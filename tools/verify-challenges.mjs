// DEV ONLY — not referenced by index.html. Run: node tools/verify-challenges.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'scripts', 'practice');

// Sandbox with a window shim so IIFEs attaching to window.PREP_SITE work.
const sandbox = { window: {}, document: {}, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (file) => vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });

let failures = 0;

// The registry itself must load; if it fails, aborting the whole run is fine.
load(path.join(dir, '_practice-index.js'));
const catFiles = fs.readdirSync(dir).filter(f => (f.startsWith('js-') || f.startsWith('rn-')) && f.endsWith('.js')).sort();
for (const f of catFiles) {
  try {
    load(path.join(dir, f));
  } catch (err) {
    console.log(`✗ ${f}: ${err.message}`);
    failures++;
  }
}

const P = sandbox.window.PREP_SITE;
const challenges = P.challenges;

// --- Shape validation ---
function nonEmptyStr(v) { return typeof v === 'string' && v.trim().length > 0; }
function validateShape(c) {
  const errs = [];
  if (!nonEmptyStr(c.prompt)) errs.push('empty prompt');
  if (c.type === 'predict-output' || c.type === 'spot-the-bug') {
    if (!nonEmptyStr(c.code)) errs.push('empty code');
    if (!nonEmptyStr(c.answer)) errs.push('answer must be non-empty string');
    if (!nonEmptyStr(c.explanation)) errs.push('empty explanation');
  } else if (c.type === 'deep-dive' || c.type === 'scenario') {
    const a = c.answer;
    if (!a || typeof a !== 'object') { errs.push('answer must be an object'); return errs; }
    const req = c.type === 'deep-dive' ? ['core','mechanism','tradeoffs','redFlags'] : ['approach','seniorChecks','walkthrough'];
    req.forEach(f => { if (!nonEmptyStr(a[f])) errs.push('answer.' + f + ' empty'); });
    if (!Array.isArray(a.followups) || a.followups.length === 0) errs.push('answer.followups must be a non-empty array');
    else a.followups.forEach((f, i) => { if (!nonEmptyStr(f && f.q) || !nonEmptyStr(f && f.a)) errs.push('followups[' + i + '] needs q & a'); });
  }
  return errs;
}

const seen = new Set();
for (const c of challenges) {
  const where = c && c.id ? c.id : JSON.stringify(c);
  validateShape(c).forEach(e => { console.log(`✗ ${where}: ${e}`); failures++; });
  if (seen.has(c.id)) { console.log(`✗ duplicate id: ${c.id}`); failures++; }
  seen.add(c.id);
}

// --- Execute predict-output snippets and diff against answer ---
function normalize(s) {
  return String(s).replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').trim();
}
async function runSnippet(code) {
  const lines = [];
  const fakeConsole = {
    log: (...a) => lines.push(a.map(fmt).join(' ')),
    error: (...a) => lines.push(a.map(fmt).join(' ')),
    warn: (...a) => lines.push(a.map(fmt).join(' ')),
    info: (...a) => lines.push(a.map(fmt).join(' ')),
  };
  // Track outstanding real timers so we can drain until they're actually done,
  // instead of guessing a fixed delay (which truncates output from late-firing timers).
  const pendingTimers = new Set();
  const fakeSetTimeout = (fn, delay, ...args) => {
    const id = setTimeout((...cbArgs) => {
      pendingTimers.delete(id);
      fn(...cbArgs);
    }, delay, ...args);
    pendingTimers.add(id);
    return id;
  };
  const fakeClearTimeout = (id) => {
    pendingTimers.delete(id);
    clearTimeout(id);
  };
  const s = { console: fakeConsole, setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout, queueMicrotask, Promise, structuredClone };
  s.globalThis = s;
  vm.createContext(s);
  try {
    vm.runInContext(code, s, { filename: 'snippet.js' });
  } catch (err) {
    lines.push(`${err.name}: ${err.message}`);
  }
  // Drain: interleave microtask-flush and timer-wait until BOTH are stable.
  // A timer may be scheduled inside a microtask (or vice-versa), so flush microtasks
  // FIRST each round, then break only when no timers remain. Safety cap prevents a
  // self-rescheduling timer from hanging the harness.
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    for (let i = 0; i < 10; i++) await Promise.resolve();
    await new Promise(r => setImmediate(r));
    if (pendingTimers.size === 0) break;
    await new Promise(r => setTimeout(r, 10)); // let the earliest pending timer fire
  }
  // Final microtask flush for anything queued by the last timer callback(s).
  for (let i = 0; i < 10; i++) await Promise.resolve();
  await new Promise(r => setImmediate(r));
  return lines.join('\n');
}
// Use Node's util.inspect for array/object formatting parity with the browser-ish console.
import util from 'node:util';
function fmt(v) { return typeof v === 'string' ? v : util.inspect(v, { depth: null }); }

const outputs = [];
for (const c of challenges) {
  if (c.type !== 'predict-output') continue;
  outputs.push(runSnippet(c.code).then(actual => {
    if (normalize(actual) !== normalize(c.answer)) {
      failures++;
      console.log(`✗ ${c.id} [${c.category}] output mismatch:`);
      console.log(`    expected(answer): ${JSON.stringify(normalize(c.answer))}`);
      console.log(`    actual(engine):   ${JSON.stringify(normalize(actual))}`);
    }
  }));
}

await Promise.all(outputs);

// --- Per-category counts ---
const counts = {};
for (const c of challenges) counts[c.category] = (counts[c.category] || 0) + 1;
console.log('\n--- counts ---');
for (const cat of P.practiceCategories) console.log(`  ${cat.id}: ${counts[cat.id] || 0}`);
console.log(`  TOTAL: ${challenges.length}`);

console.log(failures === 0 ? '\n✅ PASS' : `\n❌ FAIL (${failures} problem(s))`);
process.exit(failures === 0 ? 0 : 1);
