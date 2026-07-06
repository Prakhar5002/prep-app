// DEV ONLY — not referenced by index.html. Run: node tools/verify-topics.mjs
// Structural check for the progressive notes modules (redux, git):
//  - every registry topic in a target module resolves to a registered topic with the right module
//  - the NEW topics additionally must have the required sections (first = tldr, collapsible:false)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'scripts', 'content');

const TARGET_MODULES = ['redux', 'git', 'linux', 'eh'];
const NEW_TOPICS = new Set([
  'redux-core', 'redux-toolkit', 'redux-rtk-query', 'redux-middleware-async', 'redux-advanced-testing',
  'git-fundamentals', 'git-branching', 'git-remotes', 'git-undoing',
  'linux-fundamentals', 'linux-files-permissions', 'linux-text-pipelines',
  'linux-processes-services', 'linux-shell-scripting', 'linux-networking-sysadmin',
  'eh-foundations', 'eh-recon', 'eh-scanning', 'eh-vuln', 'eh-web', 'eh-network',
  'eh-wireless', 'eh-passwords', 'eh-exploitation', 'eh-postexploit',
  'eh-activedirectory', 'eh-social-physical', 'eh-reporting-cloud',
]);
const REFERENCE_TOPICS = new Set(['linux-command-reference', 'eh-tools-arsenal']);
const REQUIRED = ['tldr', 'what-why', 'mental-model', 'mechanics', 'examples', 'interview-patterns'];
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

const sandbox = { window: {}, document: {}, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f });

let failures = 0;
load(path.join(contentDir, '_index.js')); // defines registry + registerTopic
// Load content files for the target modules (redux-*.js, git-*.js).
const prefixes = TARGET_MODULES.map(m => m + '-');
for (const f of fs.readdirSync(contentDir).filter(f => f.endsWith('.js') && prefixes.some(p => f.startsWith(p))).sort()) {
  try { load(path.join(contentDir, f)); }
  catch (err) { console.log(`✗ ${f}: ${err.message}`); failures++; }
}

const P = sandbox.window.PREP_SITE;
const byId = P.topicsById || {};

for (const modId of TARGET_MODULES) {
  const mod = (P.registry.modules || []).find(m => m.id === modId);
  if (!mod) { console.log(`✗ no "${modId}" module in registry`); failures++; continue; }
  console.log(`\n[${modId}]`);
  for (const entry of mod.topics) {
    const t = byId[entry.id];
    if (!t) { console.log(`  … ${entry.id}: not registered yet (pending)`); continue; }
    const before = failures;
    if (t.module !== modId) { console.log(`  ✗ ${entry.id}: module "${t.module}", expected "${modId}"`); failures++; }
    if (!nonEmpty(t.title)) { console.log(`  ✗ ${entry.id}: empty title`); failures++; }
    if (!Array.isArray(t.sections) || !t.sections.length) { console.log(`  ✗ ${entry.id}: no sections`); failures++; continue; }
    if (NEW_TOPICS.has(entry.id)) {
      const ids = t.sections.map(s => s.id);
      for (const req of REQUIRED) if (!ids.includes(req)) { console.log(`  ✗ ${entry.id}: missing section "${req}"`); failures++; }
      if (t.sections[0].id !== 'tldr' || t.sections[0].collapsible !== false) { console.log(`  ✗ ${entry.id}: first section must be tldr with collapsible:false`); failures++; }
      t.sections.forEach(s => { if (!nonEmpty(s.id) || !nonEmpty(s.title) || !nonEmpty(s.html)) { console.log(`  ✗ ${entry.id}: section "${s.id||'?'}" missing id/title/html`); failures++; } });
    } else if (REFERENCE_TOPICS.has(entry.id)) {
      if (t.sections[0].id !== 'tldr' || t.sections[0].collapsible !== false) { console.log(`  ✗ ${entry.id}: first section must be tldr with collapsible:false`); failures++; }
      if (t.sections.length < 3) { console.log(`  ✗ ${entry.id}: reference topic needs at least 3 sections`); failures++; }
      t.sections.forEach(s => { if (!nonEmpty(s.id) || !nonEmpty(s.title) || !nonEmpty(s.html)) { console.log(`  ✗ ${entry.id}: section "${s.id||'?'}" missing id/title/html`); failures++; } });
    }
    if (failures === before) console.log(`  ✓ ${entry.id}: ${t.sections.length} sections${NEW_TOPICS.has(entry.id) ? '' : REFERENCE_TOPICS.has(entry.id) ? ' (reference)' : ' (existing, registration only)'}`);
  }
}
console.log(failures === 0 ? '\n✅ PASS' : `\n❌ FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
