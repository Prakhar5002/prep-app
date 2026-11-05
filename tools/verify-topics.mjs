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
    ok++;
  }
  if (failures === before) console.log(`  ✓ ${mod.topics.length} topics`);
}
console.log(`\n${ok} topics checked, ${pending} not written yet`);
console.log(failures === 0 ? '✅ PASS' : `❌ FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
