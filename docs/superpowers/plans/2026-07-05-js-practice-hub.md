# JS Practice Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a central, stateless JavaScript practice hub at `#/practice` with ~155 interview-weighted `predict-output` / `spot-the-bug` code challenges, filterable and shuffleable.

**Architecture:** Mirror the site's existing content pattern — challenge data files register themselves on a global (`window.PREP_SITE.registerChallenge`), a registry file (`_practice-index.js`) defines categories and the challenge array, and a view module (`practice-hub.js`) renders the hub into `#content` when the router hits `#/practice`. A dev-only Node harness executes every predict-output snippet to guarantee answers are exactly correct.

**Tech Stack:** Vanilla ES5/ES6 browser JS in IIFEs attaching to `window.PREP_SITE`; Prism for highlighting; existing `styles/app.css` theme tokens; Node (ESM, `node:vm`) for the verification harness. No bundler, no framework, no test runner.

## Global Constraints

Copied from the spec (`docs/superpowers/specs/2026-07-05-js-practice-hub-design.md`). Every task's requirements implicitly include these:

- **No build step.** Files are loaded directly by `index.html` via `<script>` tags. No transpile/bundle.
- **Global-registration pattern.** Each script is an IIFE that reads/writes `window.PREP_SITE`. Category files call `window.PREP_SITE.registerChallenge({...})`. Follow the existing `registerTopic` convention.
- **Stateless.** No `localStorage`, no persisted progress. Filter/shuffle/reveal live in memory; refresh resets.
- **Reuse theme + Prism.** Code renders in `<pre><code class="language-js">…</code></pre>`. Use existing CSS variables/classes; no new color literals.
- **Load order.** `_practice-index.js` → all `scripts/practice/js-*.js` → `scripts/practice-hub.js` → (existing) `scripts/app.js`.
- **Enums.** `difficulty ∈ { 'easy', 'medium', 'hard' }`; `type ∈ { 'predict-output', 'spot-the-bug' }`.
- **Correctness gate.** Every `predict-output` snippet MUST be executed by the Node harness and its authored `answer` set to the real output before the task is considered done.
- **Volume weighting.** Arrays (~28) and Strings (~25) are the heaviest banks; ~155 challenges total across 11 categories (see task list).
- **No auto-commit / no auto-build.** Do NOT run `git commit`, `git push`, or any Gradle/native/build command. End each task at verification; the user commits/builds manually on request.

---

## File Structure

**Create:**
- `scripts/practice/_practice-index.js` — category registry + `registerChallenge` API + `filterChallenges` pure helper.
- `scripts/practice/js-arrays.js`, `js-strings.js`, `js-async.js`, `js-coercion.js`, `js-closures-scope.js`, `js-objects.js`, `js-this.js`, `js-prototypes.js`, `js-hoisting-tdz.js`, `js-modules.js`, `js-advanced.js` — one file per category.
- `scripts/practice-hub.js` — `window.PREP_SITE.renderPractice(container)` hub view.
- `styles/practice.css` — hub-specific styles (filter bar, challenge card), using existing tokens.
- `tools/verify-challenges.mjs` — dev-only Node harness (NOT referenced by `index.html`).

**Modify:**
- `scripts/app.js` — add `#/practice` route parsing + dispatch.
- `index.html` — add `<script>`/`<link>` tags in correct order + a nav entry.

---

### Task 1: Practice registry, `registerChallenge` API, and Node verification harness

**Files:**
- Create: `scripts/practice/_practice-index.js`
- Create: `tools/verify-challenges.mjs`

**Interfaces:**
- Produces:
  - `window.PREP_SITE.practiceCategories`: `Array<{ id: string, title: string, tier: 1|2|3 }>`
  - `window.PREP_SITE.challenges`: `Array<Challenge>` (populated by registration)
  - `window.PREP_SITE.registerChallenge(c: Challenge): void`
  - `window.PREP_SITE.filterChallenges(challenges, { category?, difficulty?, type? }): Array<Challenge>` — pure; `'all'`/undefined means no filter on that axis.
  - `Challenge = { id, category, difficulty, type, prompt, code, answer, explanation }`
  - Harness CLI: `node tools/verify-challenges.mjs` → validates shape + executes predict-output snippets; exits non-zero on any failure.

- [ ] **Step 1: Create the registry file**

Create `scripts/practice/_practice-index.js`:

```js
/* ============================================================
   PRACTICE REGISTRY
   Defines practice categories and the registerChallenge API.
   Category files (js-*.js) register challenges by pushing here.
   ============================================================ */
(function () {
  window.PREP_SITE = window.PREP_SITE || {};
  var P = window.PREP_SITE;

  P.practiceCategories = [
    { id: 'js-arrays',         title: 'Arrays & Methods',        tier: 1 },
    { id: 'js-strings',        title: 'Strings & Manipulation',  tier: 1 },
    { id: 'js-async',          title: 'Async & Event Loop',      tier: 1 },
    { id: 'js-coercion',       title: 'Coercion & Edge Cases',   tier: 1 },
    { id: 'js-closures-scope', title: 'Closures & Scope',        tier: 1 },
    { id: 'js-objects',        title: 'Objects & References',    tier: 2 },
    { id: 'js-this',           title: 'this & Binding',          tier: 2 },
    { id: 'js-prototypes',     title: 'Prototypes & Inheritance',tier: 2 },
    { id: 'js-hoisting-tdz',   title: 'Hoisting & TDZ',          tier: 2 },
    { id: 'js-modules',        title: 'Modules (ESM/CJS)',       tier: 3 },
    { id: 'js-advanced',       title: 'Advanced (Proxy/Symbol/GC)', tier: 3 },
  ];

  P.challenges = P.challenges || [];

  var VALID_DIFF = { easy: 1, medium: 1, hard: 1 };
  var VALID_TYPE = { 'predict-output': 1, 'spot-the-bug': 1 };
  var catIds = {};
  P.practiceCategories.forEach(function (c) { catIds[c.id] = 1; });

  P.registerChallenge = function (c) {
    // Fail loud in dev if a challenge is malformed; harness relies on this too.
    if (!c || !c.id) throw new Error('registerChallenge: missing id');
    if (!catIds[c.category]) throw new Error('registerChallenge: bad category "' + c.category + '" for ' + c.id);
    if (!VALID_DIFF[c.difficulty]) throw new Error('registerChallenge: bad difficulty for ' + c.id);
    if (!VALID_TYPE[c.type]) throw new Error('registerChallenge: bad type for ' + c.id);
    P.challenges.push(c);
  };

  // Pure filter used by both the hub and the harness self-test.
  P.filterChallenges = function (challenges, f) {
    f = f || {};
    return challenges.filter(function (c) {
      if (f.category && f.category !== 'all' && c.category !== f.category) return false;
      if (f.difficulty && f.difficulty !== 'all' && c.difficulty !== f.difficulty) return false;
      if (f.type && f.type !== 'all' && c.type !== f.type) return false;
      return true;
    });
  };
})();
```

- [ ] **Step 2: Create the Node verification harness**

Create `tools/verify-challenges.mjs`:

```js
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

load(path.join(dir, '_practice-index.js'));
const catFiles = fs.readdirSync(dir).filter(f => f.startsWith('js-') && f.endsWith('.js')).sort();
for (const f of catFiles) load(path.join(dir, f));

const P = sandbox.window.PREP_SITE;
const challenges = P.challenges;
let failures = 0;

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
  const s = { console: fakeConsole, setTimeout, clearTimeout, queueMicrotask, Promise };
  s.globalThis = s;
  vm.createContext(s);
  try {
    vm.runInContext(code, s, { filename: 'snippet.js' });
  } catch (err) {
    lines.push(`${err.name}: ${err.message}`);
  }
  // Let microtasks + short timers flush (async ordering challenges).
  await new Promise(r => setTimeout(r, 60));
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
```

- [ ] **Step 3: Run the harness against an empty bank to prove it loads**

Run: `node tools/verify-challenges.mjs`
Expected: prints all category counts as `0`, `TOTAL: 0`, and `✅ PASS` (no category files exist yet, so nothing to execute; the registry + harness load cleanly).

- [ ] **Step 4: Syntax-check the registry**

Run: `node --check scripts/practice/_practice-index.js`
Expected: no output, exit 0.

**Deliverable:** registry API + a runnable correctness harness. No commit (per Global Constraints).

---

### Task 2: Arrays category content (`js-arrays`, ~28 challenges)

**Files:**
- Create: `scripts/practice/js-arrays.js`

**Interfaces:**
- Consumes: `window.PREP_SITE.registerChallenge` (Task 1).
- Produces: ~28 challenges with `category: 'js-arrays'`.

- [ ] **Step 1: Create the file with the standard skeleton and first verified challenges**

Create `scripts/practice/js-arrays.js`. The file is an IIFE calling `registerChallenge` once per item. Author each challenge, then Step 2 will correct every `answer` to real engine output.

```js
/* Practice challenges — Arrays & Methods */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'arr-sort-default',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log([1, 10, 2, 21].sort());",
    answer: "[ 1, 10, 2, 21 ]",
    explanation: "sort() with no comparator coerces elements to strings and orders lexicographically: '1' < '10' < '2' < '21'. Use .sort((a,b)=>a-b) for numeric order."
  });

  reg({
    id: 'arr-splice-return',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1,2,3,4,5];\nvar r = a.splice(1, 2);\nconsole.log(r);\nconsole.log(a);",
    answer: "[ 2, 3 ]\n[ 1, 4, 5 ]",
    explanation: "splice mutates in place and RETURNS the removed elements ([2,3]); the original array becomes [1,4,5]."
  });

  reg({
    id: 'arr-map-parseint',
    category: 'js-arrays', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(['1','2','3'].map(parseInt));",
    answer: "[ 1, NaN, NaN ]",
    explanation: "map passes (value, index): parseInt('1',0)=1, parseInt('2',1)=NaN (radix 1 invalid), parseInt('3',2)=NaN ('3' not a base-2 digit)."
  });

  // ...author the remaining challenges below to reach ~28 (see coverage list).
})();
```

**Coverage list for the remaining ~25 arrays challenges** (each a `registerChallenge` call in the same shape; mix difficulties ~30% easy / 45% medium / 25% hard; most `predict-output`, ~4–5 `spot-the-bug`):
- `sort` numeric comparator; `sort` stability
- `map` vs `forEach` return value; `forEach` return is `undefined`
- `reduce` with/without initial value; `reduce` on empty array throws
- `filter` + `Boolean`
- `slice` vs `splice` (non-mutating vs mutating); negative indices in `slice`
- `splice` for insertion (`splice(i,0,x)`)
- `push`/`pop`/`shift`/`unshift` return values
- `concat` vs spread; `flat` / `flatMap`; `flat(Infinity)`
- `indexOf` vs `includes` with `NaN` (`[NaN].includes(NaN)` true, `indexOf` -1)
- `Array(3)` empty slots vs `Array.of(3)`; `.fill()`; `Array.from({length:3})`
- holes/sparse arrays: `map` skips holes
- `find` / `findIndex` / `findLast`
- `some` / `every` on empty array
- `join` with undefined/null elements
- `reverse` mutates
- `Array.isArray` vs `instanceof Array`
- destructuring with defaults & holes: `const [a,,b] = [1,2,3]`
- spread copy is shallow (nested ref shared)
- `sort` mutates original (spot-the-bug: sorting then expecting original unchanged)
- chaining `map().filter().reduce()`
- `length` assignment truncates array
- `delete arr[i]` leaves a hole (length unchanged)
- `at(-1)` for last element
- spot-the-bug: mutating array while iterating with `forEach`
- spot-the-bug: using `sort()` on numbers without comparator in real code
- spot-the-bug: `reduce` missing initial value on possibly-empty input

- [ ] **Step 2: Verify every answer against the real engine and correct mismatches**

Run: `node tools/verify-challenges.mjs`
Expected: `js-arrays` count ≈ 28. For each mismatch printed (`expected(answer)` vs `actual(engine)`), set the challenge's `answer` to the `actual(engine)` value, then re-run. Repeat until `✅ PASS`.

- [ ] **Step 3: Confirm clean load**

Run: `node --check scripts/practice/js-arrays.js`
Expected: exit 0.

**Deliverable:** ~28 arrays challenges, every predict-output answer machine-verified. No commit.

---

### Task 3: Hub view — render, filters, shuffle, reveal (`practice-hub.js` + `practice.css`)

**Files:**
- Create: `scripts/practice-hub.js`
- Create: `styles/practice.css`

**Interfaces:**
- Consumes: `window.PREP_SITE.challenges`, `practiceCategories`, `filterChallenges` (Task 1); `window.Prism` (existing).
- Produces: `window.PREP_SITE.renderPractice(container: HTMLElement): void`.

- [ ] **Step 1: Write the hub module**

Create `scripts/practice-hub.js`:

```js
/* PRACTICE HUB — renders the #/practice view. Stateless. */
(function () {
  window.PREP_SITE = window.PREP_SITE || {};
  var P = window.PREP_SITE;
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (m) { return { '&':'&amp;','<':'&lt;','>':'&gt;' }[m]; }); };

  // In-memory view state (reset on every renderPractice call — stateless across reloads).
  var view = { category: 'all', difficulty: 'all', type: 'all', order: null };

  function catTitle(id) {
    var c = (P.practiceCategories || []).find(function (x) { return x.id === id; });
    return c ? c.title : id;
  }

  function current() {
    var list = P.filterChallenges(P.challenges || [], view);
    if (view.order) {
      var byId = {}; list.forEach(function (c) { byId[c.id] = c; });
      list = view.order.map(function (id) { return byId[id]; }).filter(Boolean);
    }
    return list;
  }

  function typeLabel(t) { return t === 'spot-the-bug' ? 'spot the bug' : 'predict output'; }

  function cardHtml(c, n) {
    var answerLabel = c.type === 'spot-the-bug' ? 'Fix' : 'Expected output';
    return '' +
      '<div class="pc-card" data-id="' + esc(c.id) + '">' +
        '<div class="pc-meta">#' + n + ' · ' + esc(catTitle(c.category)) +
          ' · <span class="pc-diff pc-diff-' + c.difficulty + '">' + c.difficulty + '</span>' +
          ' · ' + esc(typeLabel(c.type)) + '</div>' +
        '<div class="pc-prompt">' + esc(c.prompt) + '</div>' +
        '<pre><code class="language-js">' + esc(c.code) + '</code></pre>' +
        '<button class="pc-reveal">Reveal answer ▾</button>' +
        '<div class="pc-answer" hidden>' +
          '<div class="pc-answer-label">' + answerLabel + '</div>' +
          '<pre><code class="language-js">' + esc(c.answer) + '</code></pre>' +
          '<div class="pc-why"><strong>Why:</strong> ' + esc(c.explanation) + '</div>' +
        '</div>' +
      '</div>';
  }

  function optionList(sel, items) {
    return items.map(function (it) {
      return '<option value="' + it.v + '"' + (sel === it.v ? ' selected' : '') + '>' + esc(it.t) + '</option>';
    }).join('');
  }

  function controlsHtml(count) {
    var cats = [{ v: 'all', t: 'All topics' }].concat((P.practiceCategories || []).map(function (c) { return { v: c.id, t: c.title }; }));
    var diffs = [{ v:'all',t:'All difficulty' },{ v:'easy',t:'Easy' },{ v:'medium',t:'Medium' },{ v:'hard',t:'Hard' }];
    var types = [{ v:'all',t:'All types' },{ v:'predict-output',t:'Predict output' },{ v:'spot-the-bug',t:'Spot the bug' }];
    return '' +
      '<div class="pc-controls">' +
        '<select id="pcCat">' + optionList(view.category, cats) + '</select>' +
        '<select id="pcDiff">' + optionList(view.difficulty, diffs) + '</select>' +
        '<select id="pcType">' + optionList(view.type, types) + '</select>' +
        '<button id="pcShuffle">🔀 Shuffle</button>' +
        '<button id="pcRevealAll">Reveal all</button>' +
        '<span class="pc-count">' + count + ' challenge' + (count === 1 ? '' : 's') + '</span>' +
      '</div>';
  }

  function paint(container) {
    var list = current();
    container.innerHTML =
      '<h1 class="topic-title">🏋️ JS Practice</h1>' +
      controlsHtml(list.length) +
      '<div class="pc-list">' + list.map(function (c, i) { return cardHtml(c, i + 1); }).join('') + '</div>';
    if (window.Prism) window.Prism.highlightAll(container);
    wire(container);
  }

  function wire(container) {
    var byId = function (id) { return container.querySelector('#' + id); };
    byId('pcCat').addEventListener('change', function (e) { view.category = e.target.value; view.order = null; paint(container); });
    byId('pcDiff').addEventListener('change', function (e) { view.difficulty = e.target.value; view.order = null; paint(container); });
    byId('pcType').addEventListener('change', function (e) { view.type = e.target.value; view.order = null; paint(container); });
    byId('pcShuffle').addEventListener('click', function () {
      var ids = current().map(function (c) { return c.id; });
      for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
      view.order = ids; paint(container);
    });
    var revealAllBtn = byId('pcRevealAll');
    revealAllBtn.addEventListener('click', function () {
      var cards = container.querySelectorAll('.pc-answer');
      var anyHidden = Array.prototype.some.call(cards, function (a) { return a.hidden; });
      Array.prototype.forEach.call(cards, function (a) { a.hidden = !anyHidden; });
      Array.prototype.forEach.call(container.querySelectorAll('.pc-reveal'), function (b) {
        b.textContent = anyHidden ? 'Hide answer ▴' : 'Reveal answer ▾';
      });
      revealAllBtn.textContent = anyHidden ? 'Hide all' : 'Reveal all';
    });
    // Per-card reveal (delegated).
    container.querySelector('.pc-list').addEventListener('click', function (e) {
      var btn = e.target.closest('.pc-reveal'); if (!btn) return;
      var ans = btn.nextElementSibling;
      ans.hidden = !ans.hidden;
      btn.textContent = ans.hidden ? 'Reveal answer ▾' : 'Hide answer ▴';
    });
  }

  P.renderPractice = function (container) {
    view = { category: 'all', difficulty: 'all', type: 'all', order: null }; // reset = stateless
    paint(container);
    var toc = document.getElementById('tocList'); if (toc) toc.innerHTML = '';
    document.title = 'JS Practice · Prep';
  };
})();
```

- [ ] **Step 2: Write the styles**

Create `styles/practice.css` (reuse existing tokens; check `styles/app.css` for the variable names — e.g. `--bg`, `--panel`, `--border`, `--text`, `--accent` — and match them):

```css
.pc-controls { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:16px 0 24px; }
.pc-controls select, .pc-controls button {
  background:var(--panel); color:var(--text); border:1px solid var(--border);
  border-radius:8px; padding:6px 10px; font:inherit; cursor:pointer;
}
.pc-count { margin-left:auto; color:var(--text-dim, #8a8a8a); font-size:13px; }
.pc-card { border:1px solid var(--border); border-radius:12px; padding:16px; margin-bottom:16px; background:var(--panel); }
.pc-meta { font-size:12px; color:var(--text-dim, #8a8a8a); margin-bottom:8px; text-transform:capitalize; }
.pc-diff { font-weight:600; }
.pc-diff-easy { color:#3fb950; } .pc-diff-medium { color:#d29922; } .pc-diff-hard { color:#f85149; }
.pc-prompt { margin:0 0 10px; font-weight:500; }
.pc-reveal { background:transparent; color:var(--accent, #58a6ff); border:1px solid var(--border); border-radius:8px; padding:6px 12px; cursor:pointer; font:inherit; }
.pc-answer { margin-top:12px; }
.pc-answer-label { font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--text-dim, #8a8a8a); margin-bottom:4px; }
.pc-why { margin-top:8px; line-height:1.55; }
```

- [ ] **Step 3: Syntax-check both files**

Run: `node --check scripts/practice-hub.js`
Expected: exit 0. (CSS has no check; it is static.)

- [ ] **Step 4: Unit-test the filter via the harness sandbox**

Add nothing permanent — run this one-off to confirm `filterChallenges` behaves (the harness already loads the registry; this verifies the pure helper):

Run:
```bash
node --input-type=module -e "
import fs from 'node:fs'; import vm from 'node:vm';
const s={window:{},document:{},console}; s.globalThis=s; vm.createContext(s);
vm.runInContext(fs.readFileSync('scripts/practice/_practice-index.js','utf8'),s);
const P=s.window.PREP_SITE;
const data=[{id:'a',category:'js-arrays',difficulty:'easy',type:'predict-output'},{id:'b',category:'js-strings',difficulty:'hard',type:'spot-the-bug'}];
const r=P.filterChallenges(data,{category:'js-arrays'});
if(r.length!==1||r[0].id!=='a') throw new Error('filter failed'); console.log('filter OK');
"
```
Expected: prints `filter OK`.

**Deliverable:** working hub view module + styles (not yet wired into the router). No commit.

---

### Task 4: Wire the route, load scripts, add nav — working vertical slice

**Files:**
- Modify: `scripts/app.js` (route parsing + dispatch)
- Modify: `index.html` (script/style tags + nav entry)

**Interfaces:**
- Consumes: `window.PREP_SITE.renderPractice` (Task 3).

- [ ] **Step 1: Add the route in `app.js`**

In `parseRoute()` (around `scripts/app.js:241`), add a branch so a hash of `#/practice` returns `{ name: 'practice' }`. Match the existing return-object style, e.g. before the topic match:

```js
if (hash === '#/practice' || hash === '#/practice/') return { name: 'practice' };
```

In `route()` (around `scripts/app.js:249`), add dispatch alongside the existing `home`/`topic` branches:

```js
else if (r.name === 'practice') window.PREP_SITE.renderPractice(document.getElementById('content'));
```

(Read the exact existing code in `parseRoute`/`route` first and mirror its variable names — `r`, `$('#content')`, etc.)

- [ ] **Step 2: Add tags to `index.html`**

In `<head>` (next to the existing `app.css` link) add:
```html
<link rel="stylesheet" href="styles/practice.css">
```
Immediately BEFORE the existing `<script src="scripts/app.js"></script>` and AFTER the content `<script>`s, add — in this order:
```html
<script src="scripts/practice/_practice-index.js"></script>
<script src="scripts/practice/js-arrays.js"></script>
<script src="scripts/practice-hub.js"></script>
```
(Later content tasks add their `js-*.js` tags between the index and the hub tag.)

- [ ] **Step 3: Add a nav entry**

Add a link to `#/practice` in the sidebar/home area. Simplest: in `index.html`, near the sidebar header or nav, add:
```html
<a href="#/practice" class="nav-practice">🏋️ JS Practice</a>
```
(If the sidebar is generated in `app.js renderSidebar()`, instead add one static entry there matching the existing `nav-topic` markup style. Prefer the static `index.html` link if there is a stable nav container.)

- [ ] **Step 4: Manual browser verification**

Open `index.html` in a browser (or run `python3 -m http.server` in the repo and visit `http://localhost:8000`). Verify:
- Clicking "🏋️ JS Practice" (or visiting `#/practice`) renders the hub with the arrays challenges and a live count.
- Topic/Difficulty/Type selects filter the list and the count updates.
- Shuffle reorders; changing a filter resets order.
- Per-card "Reveal answer" toggles that card only; "Reveal all"/"Hide all" toggles everything.
- Code blocks are syntax-highlighted and the existing Copy button appears on hover.
- Dark and light themes both look correct (toggle theme).
- Refreshing the page resets all filters/reveals (stateless).

- [ ] **Step 5: Regression check**

Verify existing routes still work: home (`#/`) and a note topic (`#/topic/js-closures`) render normally; sidebar/search/theme/progress unaffected.

**Deliverable:** end-to-end working slice — arrays challenges drillable at `#/practice`. **STOP here for user review of look/feel before authoring more content.** No commit.

---

### Tasks 5–14: Remaining category content

Each task is identical in shape to Task 2 (arrays): create `scripts/practice/<file>.js` using the skeleton below, author the target number of challenges across the listed coverage, add the file's `<script>` tag to `index.html` (between the index and hub tags), then run `node tools/verify-challenges.mjs` and correct every `answer` to real engine output until `✅ PASS`, and `node --check` the file. No commit.

**Skeleton (same for every category file):**
```js
/* Practice challenges — <Category Title> */
(function () {
  var reg = window.PREP_SITE.registerChallenge;
  reg({ id: '<prefix>-<slug>', category: '<category-id>', difficulty: 'easy|medium|hard',
        type: 'predict-output|spot-the-bug', prompt: '…', code: "…", answer: "…", explanation: "…" });
  // …repeat to target count…
})();
```

Each task's Steps: **(1)** author the file to its coverage list; **(2)** `node tools/verify-challenges.mjs` → fix answers to engine output → repeat to PASS; **(3)** `node --check <file>`; **(4)** add its `<script>` tag to `index.html`.

---

### Task 5: Strings (`js-strings.js`, ~25) — `category: 'js-strings'`
Coverage: `split`/`join` round-trips; `slice` vs `substring` vs `substr` (and negative args); `replace` with string vs regex (only first match for string); `replaceAll`; `replace` with `$1`/`$&` patterns; `match`/`matchAll`; template literals & tagged templates; `+` string concatenation with numbers/objects (`[]`, `{}`); `padStart`/`padEnd`; `trim`/`trimStart`; `repeat`; `charAt` vs bracket vs `at(-1)`; `charCodeAt`/`codePointAt`/`String.fromCharCode`; unicode length surprises (emoji `.length`, spread vs `.length`); `normalize`; `localeCompare`; `String(x)` vs `x.toString()` for null/undefined; immutability (`s[0]='x'` no-op); `includes`/`startsWith`/`endsWith`; number-to-string radix (`(255).toString(16)`); parsing (`Number('')`, `Number(' ')`, `parseInt`/`parseFloat` edge cases); `JSON.stringify` of strings with quotes; spot-the-bug: off-by-one in `substring`, mutating a string expecting change, using `replace` expecting global.

### Task 6: Async & Event Loop (`js-async.js`, ~20) — `category: 'js-async'`
Coverage: microtask vs macrotask ordering (`setTimeout` vs `Promise.then` vs sync); `Promise.resolve().then` chains; `async` function returns a Promise; `await` pauses & resumes as microtask; ordering of `console.log` around `await`; `setTimeout(…,0)` after sync; `Promise.all` order vs settle; `Promise.race`/`any`/`allSettled` outcomes; unhandled rejection; error propagation through `async`/`await` (try/catch); `await` in a `for` loop vs `Promise.all`; `forEach` with async callback (doesn't await — spot-the-bug); `queueMicrotask` ordering; nested promises flattening; returning vs awaiting in `.then`; `process.nextTick`-style not applicable note (browser); `setTimeout` clamp not testable — avoid timing-exact ones except ordering; spot-the-bug: missing `await`, missing `return` in `.then`, `await` inside non-async. (NOTE: harness flushes ~60ms; keep timers ≤10ms and rely on ordering, not wall-clock.)

### Task 7: Coercion & Edge Cases (`js-coercion.js`, ~18) — `category: 'js-coercion'`
Coverage: `[]+[]`, `[]+{}`, `{}+[]`; `1+'1'`, `1-'1'`, `'5'*2`; `==` vs `===` (`null==undefined`, `NaN==NaN`, `0==''`, `0=='0'`, `''==0`, `[]==![]`); truthiness of `[]`,`{}`,`''`,`0`,`'0'`,`NaN`; `typeof null`, `typeof NaN`, `typeof function`, `typeof undeclared`; `+true`, `+null`, `+undefined`, `+''`, `+[]`, `+[1]`, `+[1,2]`; `Number(null)` vs `Number(undefined)`; `parseInt('08')` vs `Number('08')`; `0.1+0.2`; `isNaN` vs `Number.isNaN`; `!!` conversions; `String(null)` vs `''+null`; comparison `NaN < 1`; `Infinity` arithmetic; `-0` vs `0` (`Object.is`); spot-the-bug: using `==` where `===` needed, `if (x = 5)` assignment.

### Task 8: Closures & Scope (`js-closures-scope.js`, ~15) — `category: 'js-closures-scope'`
Coverage: classic `var` loop + `setTimeout` (logs `3 3 3`); `let` loop fix (`0 1 2`); IIFE capture fix; counter factory (private state); shared vs per-call closure; stale closure over a variable reassigned later; closure in event handler capturing loop index; block scope with `let`/`const`; TDZ interaction (cross-ref hoisting task); function returning function accumulating; memoization closure; `this` is NOT closed over (arrow captures lexically — cross-ref this task); module pattern; spot-the-bug: expecting `var` loop to capture per-iteration; spot-the-bug: recreating closure each render loses memo.

### Task 9: Objects & References (`js-objects.js`, ~12) — `category: 'js-objects'`
Coverage: reference equality (`{}==={}` false, same ref true); pass-by-reference mutation in function; shallow copy (`{...o}`/`Object.assign`) leaves nested refs shared; deep clone via `structuredClone`; `const obj` still mutable; `Object.freeze` shallow (nested still mutable); key ordering (integer keys sorted, then insertion); `Object.keys`/`entries`/`values`; computed keys; `delete` vs setting `undefined`; `JSON.parse(JSON.stringify)` drops functions/undefined/Dates; optional chaining + nullish; spot-the-bug: shallow copy then mutating nested; spot-the-bug: using object as another object's key (stringified to `[object Object]`).

### Task 10: this & Binding (`js-this.js`, ~10) — `category: 'js-this'`
Coverage: method call vs detached function (`const f = obj.method`); `this` in plain function (undefined in strict / global otherwise); arrow inherits lexical `this`; `call`/`apply`/`bind`; `bind` is permanent (double-bind); `new` binding; `this` in `setTimeout` callback (arrow vs function); `this` in array method with `thisArg`; class method losing `this` when passed as handler; spot-the-bug: passing `obj.method` as callback without bind; spot-the-bug: arrow as object method expecting dynamic `this`.

### Task 11: Prototypes & Inheritance (`js-prototypes.js`, ~8) — `category: 'js-prototypes'`
Coverage: `[[Prototype]]` lookup chain; `Object.create(null)` has no `toString`; `hasOwnProperty` vs `in`; shadowing on write (assignment creates own prop, doesn't mutate proto); `instanceof` walks the chain; `constructor` property; `class extends`/`super`; mutating a shared prototype property (object vs primitive on proto); spot-the-bug: array/object as a prototype default shared across instances.

### Task 12: Hoisting & TDZ (`js-hoisting-tdz.js`, ~8) — `category: 'js-hoisting-tdz'`
Coverage: `var` hoisted as `undefined`; `let`/`const` in TDZ throw `ReferenceError`; function declaration fully hoisted (callable before definition); function expression not; `typeof` on TDZ variable throws (vs `typeof undeclared` = `'undefined'`); function vs var name precedence; hoisting inside blocks; default-param TDZ; spot-the-bug: using a `const` before its declaration line.

### Task 13: Modules (`js-modules.js`, ~6) — `category: 'js-modules'`
Coverage: ESM live bindings (imported binding reflects later change) vs CJS value copy; named vs default export/import; imports are read-only (reassigning throws); hoisting of `import`; `this` at module top level (`undefined` in ESM vs `module.exports` in CJS); circular import partial-value behavior. (These describe behavior; where a snippet can't run standalone in the harness, use `type: 'predict-output'` only for self-contained cases and prefer conceptual `spot-the-bug` for the rest, OR mark clearly in `explanation` — keep the `code` runnable so the harness can check it, e.g. simulate live-binding with a closure.)

### Task 14: Advanced — Proxy/Symbol/GC/Iterators (`js-advanced.js`, ~6) — `category: 'js-advanced'`
Coverage: `Symbol` uniqueness (`Symbol('x')!==Symbol('x')`); `Symbol` keys skipped by `Object.keys`/`JSON.stringify`; well-known `Symbol.iterator` (custom iterable + spread); generator `next()`/`yield` sequence; `Proxy` `get`/`has` trap output; `WeakMap` key must be object (ES2023: symbols allowed) — runnable snippet; iterator protocol manual `next()`.

---

### Task 15: Full-bank verification and final counts

**Files:** none (verification only).

- [ ] **Step 1: Run the full harness**

Run: `node tools/verify-challenges.mjs`
Expected: `✅ PASS`, `TOTAL ≈ 155`, and per-category counts within a couple of the targets (arrays ~28, strings ~25, async ~20, coercion ~18, closures ~15, objects ~12, this ~10, prototypes ~8, hoisting ~8, modules ~6, advanced ~6). Every predict-output answer matches engine output.

- [ ] **Step 2: Confirm all practice files parse**

Run: `for f in scripts/practice/*.js scripts/practice-hub.js; do node --check "$f" || echo "FAIL $f"; done`
Expected: no `FAIL` lines.

- [ ] **Step 3: Final manual browser pass**

Open the site, go to `#/practice`, and spot-check: total count, each topic filter shows its bank, difficulty/type filters work across the full set, shuffle + reveal-all behave, both themes render. Confirm home and a note topic still work.

**Deliverable:** complete ~155-challenge JS practice hub, fully machine-verified. No commit (user commits on request).

---

## Self-Review

**Spec coverage:**
- §3 Architecture (new files, route, script order, nav) → Tasks 1, 3, 4. ✓
- §4 Data model (`registerChallenge` shape, Prism render) → Task 1 (API), Task 3 (render). ✓
- §5 UX (filters, shuffle, reveal, reveal-all, stateless, theme) → Task 3 + Task 4 verification. ✓
- §6 Weighting (arrays/strings heaviest, ~155) → Tasks 2, 5–14 counts; Task 15 totals. ✓
- §7 Correctness gate (run every predict-output) → Task 1 harness; enforced in Tasks 2, 5–14, 15. ✓
- §8 Rollout (arrays slice first, then strings, then rest) → Task ordering + explicit STOP at Task 4. ✓
- §9 Risks (load order, theme drift, long page) → Global Constraints + Task 4 checks. ✓

**Placeholder scan:** Content tasks intentionally carry coverage checklists rather than 155 pre-written snippets — the snippet code is authored during execution and the exact `answer` is *derived from the engine*, not guessable in advance; the harness makes this deterministic. All infrastructure code (registry, harness, hub, CSS, wiring) is shown in full. No "TODO/handle errors/similar to Task N" placeholders in the code steps.

**Type consistency:** `registerChallenge`, `filterChallenges`, `renderPractice`, `practiceCategories`, `challenges`, and the `Challenge` field names are used identically across Tasks 1, 3, 4. Category ids in Task 1 match the `category:` values referenced in Tasks 2 and 5–14. Difficulty/type enums match the harness validation.

**Deviation note:** Standard TDD "commit each task" and browser-DOM unit tests are replaced by (a) the Node execution harness for content correctness and (b) manual browser checklists for UI, because the repo has no test runner/build and per project rules must not auto-commit or auto-build.
