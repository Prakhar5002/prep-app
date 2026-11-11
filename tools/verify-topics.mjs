// DEV ONLY — not referenced by index.html. Run: node tools/verify-topics.mjs
// Structural check for every module in the registry (7-section format, Nov 2026):
//  - every registry topic resolves to a registered topic (file = scripts/content/<id>.js)
//  - every content file loads without throwing (catches unescaped ${…} in template literals)
//  - first section is ⚡ Revision (collapsible:false) with the 4-part revision card
//  - required sections present; legacy TL;DR / Checklist sections are gone
//  - every module has a group (tier) for the sidebar
//  - every <a href="#/topic/…"> cross-link points at a real topic
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'scripts', 'content');
const REQUIRED = ['revision', 'interview-qa']; // a few special-format topics (cases, references, gotchas) have custom middle sections
const LEGACY = ['tldr', 'checklist', 'edge-cases', 'interview-patterns', 'bugs-antipatterns', 'bugs-anti-patterns'];
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

const sandbox = { window: {}, document: {}, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f });

let failures = 0, pending = 0, ok = 0;
const fail = (msg) => { console.log('  ✗ ' + msg); failures++; };
load(path.join(contentDir, '_index.js'));
const P = sandbox.window.PREP_SITE;

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tagged = new Set([...html.matchAll(/src="scripts\/content\/([^"]+)\.js"/g)].map(m => m[1]));

for (const mod of P.registry.modules) {
  for (const { id } of mod.topics) {
    const f = path.join(contentDir, id + '.js');
    if (!fs.existsSync(f)) continue;
    if (!tagged.has(id)) console.log(`✗ ${id}.js exists but has no <script> tag in index.html`), failures++;
    try { load(f); } catch (err) { console.log(`✗ ${id}.js: ${err.message}`); failures++; }
  }
}

const count = (h, re) => (h.match(re) || []).length;
const mods = P.registry.modules;
const bsdMod = mods.find(m => m.id === 'backend-sd');
if (!bsdMod) fail('module "backend-sd" missing');
else if (bsdMod.group !== 'core' || mods.indexOf(bsdMod) !== mods.findIndex(m => m.id === 'backend') + 1)
  fail('module "backend-sd" must have group core and sit directly after "backend"');

// BSD_RULES: per-id rules for the System Design (Backend, Deep) module; only apply once a topic exists
const BSD_RULES = (id, s, sids) => {
  const sec = (k) => (s.find(x => x.id === k) || {}).html || '';
  if (id === 'bsd-estimation') {
    if (!sids.includes('self-test')) fail(`${id}: missing section "self-test"`);
    else if (count(sec('self-test'), /class="qa-block qa-reveal"/g) < 10) fail(`${id}: self-test needs >= 10 qa-block qa-reveal`);
    for (let n = 1; n <= 14; n++) if (!sec('examples').includes(`<h3>Drill ${n}:`)) fail(`${id}: examples missing "<h3>Drill ${n}:"`);
  }
  if (id.startsWith('bsd-bb-')) {
    const all = s.map(x => x.html).join('');
    if (!/<table/.test(all)) fail(`${id}: needs at least one <table`);
    if (!/class="diagram"/.test(all)) fail(`${id}: needs at least one class="diagram"`);
    if (count(sec('interview-qa'), /class="qa-block/g) < 10) fail(`${id}: interview-qa needs >= 10 qa-block`);
  }
  if (id.startsWith('bsd-case-')) {
    const dd = sids.indexOf('drill-down');
    if (dd < 0) fail(`${id}: missing section "drill-down"`);
    else {
      if (dd !== sids.indexOf('interview-qa') - 1) fail(`${id}: drill-down must sit directly before interview-qa`);
      if (count(sec('drill-down'), /class="qa-block/g) < 15) fail(`${id}: drill-down needs >= 15 qa-block`);
      if (count(sec('drill-down'), /qa-ladder-start/g) < 3) fail(`${id}: drill-down needs >= 3 qa-ladder-start`);
    }
    if (count(sec('interview-qa'), /class="qa-block/g) < 8) fail(`${id}: interview-qa needs >= 8 qa-block`);
  }
};

// ---- DSA plain-English rules ----
const DSA_REWRITTEN = new Set([]);
const DSA_CODE_RE = /<pre><code class="language-js">([\s\S]*?)<\/code><\/pre>/g;
const DSA_RULES = (id, s) => {
  if (!DSA_REWRITTEN.has(id)) return;
  const sec = (k) => (s.find(x => x.id === k) || {}).html || '';
  if (!/class="diagram"/.test(sec('mental-model'))) fail(`${id}: mental-model needs a class="diagram" trace`);
  const all = s.map(x => x.html).join('');
  for (const m of all.matchAll(DSA_CODE_RE)) {
    for (const line of m[1].split('\n')) {
      if (/^\s*(let|const|var)\s+[\w$]+\s*=[^;]*,\s*[\w$]+\s*=/.test(line)) fail(`${id}: multi-declare line in code: ${line.trim()}`);
    }
    if (/\|\|\s*0\)\s*[+-]/.test(m[1])) fail(`${id}: inline defaulting "(x || 0) +/-" in code`);
  }
};
const DSA_WORDS_LINK_CHECK = () => {
  const w = P.topicsById['dsa-words'];
  if (!w) return;
  const wordIds = new Set([...w.sections.map(x => x.html).join('').matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  for (const t of Object.values(P.topicsById)) {
    for (const m of (t.sections || []).map(x => x.html).join('').matchAll(/href="#\/topic\/dsa-words#(w-[\w-]+)"/g)) {
      if (!wordIds.has(m[1])) fail(`${t.id}: link to dsa-words#${m[1]} has no matching id`);
    }
  }
};
// ---- end DSA plain-English rules ----

const ids = new Set(P.registry.modules.flatMap(m => m.topics.map(t => t.id)));
for (const mod of P.registry.modules) {
  const before = failures;
  console.log(`\n[${mod.id}] ${mod.groupLabel || '(no group!)'}`);
  if (!mod.group) fail(`module "${mod.id}" has no group`);
  for (const entry of mod.topics) {
    const t = P.topicsById[entry.id];
    if (!t) { console.log(`  … ${entry.id}: not written yet`); pending++; continue; }
    const s = t.sections || [];
    const sids = s.map(x => x.id);
    if (!nonEmpty(t.title)) fail(`${entry.id}: empty title`);
    if (sids[0] !== 'revision' || s[0].collapsible !== false) fail(`${entry.id}: first section must be revision with collapsible:false`);
    for (const r of REQUIRED) if (!sids.includes(r)) fail(`${entry.id}: missing section "${r}"`);
    for (const l of LEGACY) if (sids.includes(l)) fail(`${entry.id}: legacy section "${l}" still present`);
    if (new Set(sids).size !== sids.length) fail(`${entry.id}: duplicate section ids`);
    s.forEach(x => { if (!nonEmpty(x.id) || !nonEmpty(x.title) || !nonEmpty(x.html)) fail(`${entry.id}: section "${x.id || '?'}" missing id/title/html`); });
    const rev = s[0]?.html || '';
    for (const c of ['revision-card', 'revision-oneline', 'revision-trap', 'revision-say']) if (!rev.includes(c)) fail(`${entry.id}: revision missing .${c}`);
    for (const m of s.map(x => x.html).join('').matchAll(/href="#\/topic\/([\w-]+)/g)) if (!ids.has(m[1])) fail(`${entry.id}: dead link #/topic/${m[1]}`);
    BSD_RULES(entry.id, s, sids);
    DSA_RULES(entry.id, s); // DSA plain-English rules
    ok++;
  }
  if (failures === before) console.log(`  ✓ ${mod.topics.length} topics`);
}
DSA_WORDS_LINK_CHECK(); // DSA plain-English rules
console.log(`\n${ok} topics checked, ${pending} not written yet`);
console.log(failures === 0 ? '✅ PASS' : `❌ FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
