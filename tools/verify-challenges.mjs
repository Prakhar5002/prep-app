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
const catFiles = fs.readdirSync(dir).filter(f => f.startsWith('js-') && f.endsWith('.js')).sort();
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
const seen = new Set();
for (const c of challenges) {
  const where = c && c.id ? c.id : JSON.stringify(c);
  for (const field of ['prompt', 'code', 'answer', 'explanation']) {
    if (!c[field] || !String(c[field]).trim()) { console.log(`✗ ${where}: empty ${field}`); failures++; }
  }
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
  const s = { console: fakeConsole, setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout, queueMicrotask, Promise };
  s.globalThis = s;
  vm.createContext(s);
  try {
    vm.runInContext(code, s, { filename: 'snippet.js' });
  } catch (err) {
    lines.push(`${err.name}: ${err.message}`);
  }
  // Drain: real timers preserve ordering, so poll until none are outstanding.
  // Safety cap so a runaway snippet (e.g. a timer that reschedules itself) can't hang the harness.
  const deadline = Date.now() + 2000;
  while (pendingTimers.size > 0 && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 10));
  }
  // Flush trailing microtasks queued by the last timer callback(s).
  for (let i = 0; i < 5; i++) await Promise.resolve();
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
