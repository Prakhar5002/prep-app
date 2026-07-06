# RN Deep Interview Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a track-switchable "RN Deep Dives" side to the existing `#/practice` hub — ~105 very-deep, senior/staff-level React Native interview cards across 12 categories, with structured multi-part revealed answers.

**Architecture:** Generalize the shipped practice hub into two tracks (`js`, `rn`) sharing the same `registerChallenge` registry, hub view, filters, and reveal. RN adds two new card types (`deep-dive`, `scenario`) whose `answer` is a structured object. A Node shape-validator checks structure/enums/uniqueness (RN answers are conceptual and are NOT executed); technical accuracy is gated by expert review against 2026 RN reality.

**Tech Stack:** Vanilla ES5/ES6 browser JS in IIFEs on `window.PREP_SITE`; existing Prism + `styles/app.css` theme tokens; Node (ESM, `node:vm`) for the shape-validator (extension of `tools/verify-challenges.mjs`). No bundler, no framework, no test runner.

## Global Constraints

Copied from the spec (`docs/superpowers/specs/2026-07-05-rn-deep-interview-hub-design.md`). Every task implicitly includes these:

- **No build step.** Files load via `<script>` tags in `index.html`. No transpile/bundle.
- **Global-registration pattern.** IIFEs read/write `window.PREP_SITE`; content files call `window.PREP_SITE.registerChallenge({...})`.
- **Stateless hub.** No `localStorage`; refresh resets track/filters/reveals.
- **Reuse theme + Prism.** Use existing CSS vars (`--bg-elev`, `--fg`, `--fg-muted`, `--border`, `--accent`, `--green`/`--yellow`/`--red`); no new color literals. Code inside answers uses `<pre><code class="language-js">`.
- **`track` field:** `'js'` (default when absent) | `'rn'`. All 11 existing JS `practiceCategories` get `track:'js'`; 12 new RN categories get `track:'rn'`.
- **Enums:** `type ∈ {predict-output, spot-the-bug, deep-dive, scenario}`. Difficulty per track: `js → {easy,medium,hard}`, `rn → {core,senior,staff}`.
- **Answer shape by type:** `predict-output`/`spot-the-bug` → `answer` is a non-empty string (+ `code`). `deep-dive` → `answer` is an object `{core, mechanism, tradeoffs, followups[], redFlags}` (strings non-empty; `followups` = array of `{q,a}`). `scenario` → `answer` object `{approach, seniorChecks, walkthrough, followups[]}`. Answer string fields are raw trusted HTML (may contain `<pre><code>`, `<ul>`, `<code>`).
- **RN cards do NOT execute** in the validator (no output diff) — structure only.
- **RN correctness = expert review** against 2026 facts (below); the validator only checks shape.
- **2026 RN fact list (every RN card must respect; web-verified 2026-07-05):** New Architecture is DEFAULT since RN 0.76 and **MANDATORY since RN 0.82** (legacy opt-out flags ignored; legacy frozen; bridgeless default); Fabric + TurboModules + JSI; **Hermes V1 is the default JS engine since RN 0.84 (Feb 2026)** — a rewritten compiler/bytecode/VM; **Static Hermes** (AOT compile of a typed subset to native machine code) is a SEPARATE, still-unshipped/research-stage effort — do NOT equate the two or call Static Hermes shipped; Hermes uses the **Hades** (mostly-concurrent generational) GC; **Reanimated v4** (New-Arch-only, worklets in standalone `react-native-worklets`); **React Native DevTools** replaced Flipper (removed); Remote JS Debugging removed in 0.79; **FlashList v2** (no `estimatedItemSize`); React Navigation **v7**; Expo Router **v5-era**; **EAS Build/Update** for OTA (CodePush deprecated); **current stable RN is ~0.85 (Apr 2026)**, Expo SDK ~53/54. Fabric render pipeline: **Render** (JS thread) builds the shadow tree (structure/props only, NO layout); **Commit** (background shadow thread) runs Yoga layout then the atomic tree-promotion swap; **Mount** (UI thread) applies the diff to host views.
- **Volume:** ~105 RN cards; `rn-architecture`, `rn-performance`, `rn-system-design` heaviest (~12 each). `rn-system-design` is mostly `scenario` type.
- **No auto-commit / no auto-build.** Never run `git commit`/`git push`/build. End each task at verification; the user commits manually on request.

---

## File Structure

**Modify:**
- `scripts/practice/_practice-index.js` — add `track` to categories, append 12 RN categories, extend `registerChallenge` validation (track/type/difficulty-per-track).
- `scripts/practice-hub.js` — track switcher; track-aware filters; `deep-dive`/`scenario` rendering.
- `styles/practice.css` — track-switcher + deep-dive answer-section styles.
- `tools/verify-challenges.mjs` — load `rn-*.js` too; type-aware shape validation; skip executing non-code types.
- `index.html` — add 12 `rn-*.js` `<script>` tags.

**Create:**
- `scripts/practice/rn-architecture.js`, `rn-performance.js`, `rn-system-design.js`, `rn-native-modules.js`, `rn-animations.js`, `rn-navigation.js`, `rn-lists.js`, `rn-state-data.js`, `rn-platform-apis.js`, `rn-build-release.js`, `rn-testing-debugging.js`, `rn-styling.js`.

---

### Task 1: Registry + validator — tracks, RN categories, new types, shape validation

**Files:**
- Modify: `scripts/practice/_practice-index.js`
- Modify: `tools/verify-challenges.mjs`

**Interfaces:**
- Produces:
  - `practiceCategories` entries now shaped `{ id, title, tier, track }`; 12 RN entries appended.
  - `registerChallenge(c)` accepts `c.track` (default `'js'`), validates `track∈{js,rn}`, `type∈{predict-output,spot-the-bug,deep-dive,scenario}`, and difficulty by track (`js:{easy,medium,hard}`, `rn:{core,senior,staff}`).
  - Validator (`node tools/verify-challenges.mjs`) validates ALL cards' shape by type, executes only `predict-output`, and prints per-category counts including RN.

- [ ] **Step 1: Add `track` to existing categories + append RN categories** in `scripts/practice/_practice-index.js`

Read the file. Add `track: 'js'` to each of the 11 existing `practiceCategories` entries. Then append these 12 RN entries to the array:

```js
    { id: 'rn-architecture',      title: 'New Architecture & Internals', tier: 1, track: 'rn' },
    { id: 'rn-performance',       title: 'Performance & Optimization',    tier: 1, track: 'rn' },
    { id: 'rn-system-design',     title: 'RN System Design',              tier: 1, track: 'rn' },
    { id: 'rn-native-modules',    title: 'Native Modules & Bridging',     tier: 2, track: 'rn' },
    { id: 'rn-animations',        title: 'Animations & Gestures',         tier: 2, track: 'rn' },
    { id: 'rn-navigation',        title: 'Navigation',                    tier: 2, track: 'rn' },
    { id: 'rn-lists',             title: 'Lists & Rendering',             tier: 2, track: 'rn' },
    { id: 'rn-state-data',        title: 'State, Data & Offline',         tier: 2, track: 'rn' },
    { id: 'rn-platform-apis',     title: 'Platform APIs & Permissions',   tier: 3, track: 'rn' },
    { id: 'rn-build-release',     title: 'Build, Release & CI/CD',        tier: 3, track: 'rn' },
    { id: 'rn-testing-debugging', title: 'Testing & Debugging',           tier: 3, track: 'rn' },
    { id: 'rn-styling',           title: 'Styling & Layout',              tier: 3, track: 'rn' },
```

- [ ] **Step 2: Extend `registerChallenge` validation** in `scripts/practice/_practice-index.js`

Locate the `registerChallenge` function. Replace its enum-validation section so it: builds the category-id set from `practiceCategories` (already done), and validates track + type + difficulty-by-track. The new body:

```js
  var VALID_TYPE = { 'predict-output':1, 'spot-the-bug':1, 'deep-dive':1, 'scenario':1 };
  var DIFF_BY_TRACK = { js: { easy:1, medium:1, hard:1 }, rn: { core:1, senior:1, staff:1 } };
  var catIds = {};
  P.practiceCategories.forEach(function (c) { catIds[c.id] = 1; });

  P.registerChallenge = function (c) {
    if (!c || !c.id) throw new Error('registerChallenge: missing id');
    if (c.track === undefined) c.track = 'js';               // default track
    if (c.track !== 'js' && c.track !== 'rn') throw new Error('registerChallenge: bad track for ' + c.id);
    if (!catIds[c.category]) throw new Error('registerChallenge: bad category "' + c.category + '" for ' + c.id);
    if (!VALID_TYPE[c.type]) throw new Error('registerChallenge: bad type for ' + c.id);
    if (!DIFF_BY_TRACK[c.track][c.difficulty]) throw new Error('registerChallenge: bad difficulty "' + c.difficulty + '" for ' + c.id);
    P.challenges.push(c);
  };
```

(Keep `filterChallenges` as-is; it filters by category/difficulty/type. Track filtering is done in the hub.)

- [ ] **Step 3: Update the validator to load RN files + validate shapes by type** in `tools/verify-challenges.mjs`

Read the file. Make three changes:

(a) The category-file glob currently matches `f.startsWith('js-')`. Change it to also load `rn-*.js`:
```js
const catFiles = fs.readdirSync(dir).filter(f => (f.startsWith('js-') || f.startsWith('rn-')) && f.endsWith('.js')).sort();
```

(b) Replace the per-card shape-validation block with a type-aware version. Requirements: every card needs non-empty `prompt`; `predict-output`/`spot-the-bug` need non-empty string `code` and non-empty string `answer`; `deep-dive` needs `answer` object with non-empty string `core`,`mechanism`,`tradeoffs`,`redFlags` and array `followups` of `{q,a}` (each non-empty string); `scenario` needs `answer` object with non-empty string `approach`,`seniorChecks`,`walkthrough` and array `followups` of `{q,a}`. Use this helper:
```js
function nonEmptyStr(v) { return typeof v === 'string' && v.trim().length > 0; }
function validateShape(c) {
  const errs = [];
  if (!nonEmptyStr(c.prompt)) errs.push('empty prompt');
  if (c.type === 'predict-output' || c.type === 'spot-the-bug') {
    if (!nonEmptyStr(c.code)) errs.push('empty code');
    if (!nonEmptyStr(c.answer)) errs.push('answer must be non-empty string');
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
```
Then in the validation loop, replace the old non-empty-field loop with:
```js
for (const c of challenges) {
  const where = c && c.id ? c.id : JSON.stringify(c);
  validateShape(c).forEach(e => { console.log(`✗ ${where}: ${e}`); failures++; });
  if (seen.has(c.id)) { console.log(`✗ duplicate id: ${c.id}`); failures++; }
  seen.add(c.id);
}
```

(c) The execution block already filters `if (c.type !== 'predict-output') continue;` — leave it, so deep-dive/scenario/spot-the-bug are never executed. Per-category counts already iterate `P.practiceCategories`, so RN categories print automatically.

- [ ] **Step 4: Verify the JS track still passes and RN validation works**

Run: `node tools/verify-challenges.mjs`
Expected: all 11 JS categories + 12 RN categories printed (RN all `0`), `TOTAL: 160`, `✅ PASS` (JS predict-output still executes and passes; no RN cards yet).

- [ ] **Step 5: Prove the shape validator rejects a malformed deep-dive card**

Create a temp file `scripts/practice/rn-zzztmp.js`:
```js
(function () {
  var reg = window.PREP_SITE.registerChallenge;
  reg({ id: 'rn-zzz-ok', track: 'rn', category: 'rn-architecture', difficulty: 'senior', type: 'deep-dive',
        prompt: 'Q?', answer: { core: 'c', mechanism: 'm', tradeoffs: 't', redFlags: 'r',
        followups: [{ q: 'q1', a: 'a1' }] } });
  reg({ id: 'rn-zzz-bad', track: 'rn', category: 'rn-architecture', difficulty: 'senior', type: 'deep-dive',
        prompt: 'Q?', answer: { core: 'c', mechanism: 'm', tradeoffs: 't', redFlags: 'r', followups: [] } });
})();
```
Run: `node tools/verify-challenges.mjs`
Expected: a `✗ rn-zzz-bad: answer.followups must be a non-empty array` line, overall `❌ FAIL`, `rn-architecture: 2` in counts. Then DELETE `scripts/practice/rn-zzztmp.js` and re-run → back to `TOTAL: 160`, `✅ PASS`. Also run `node --check scripts/practice/_practice-index.js` and `node --check tools/verify-challenges.mjs` (both exit 0).

**Deliverable:** track-aware registry + a shape validator that enforces the RN card structure. No commit.

---

### Task 2: Hub view — track switcher + deep-dive/scenario rendering

**Files:**
- Modify: `scripts/practice-hub.js`
- Modify: `styles/practice.css`

**Interfaces:**
- Consumes: `practiceCategories` (with `track`), `challenges` (with `track`), `filterChallenges` (Task 1).
- Produces: track-aware `renderPractice(container)`; renders `deep-dive`/`scenario` cards.

- [ ] **Step 1: Add track state + track-aware data selection** in `scripts/practice-hub.js`

Read the file. Make these changes to the existing module:

(a) `view` initial state (in both the module-level `var view = {...}` and the reset inside `renderPractice`) gains `track: 'js'`:
```js
var view = { track: 'js', category: 'all', difficulty: 'all', type: 'all', order: null };
```
(b) In `current()`, filter by track BEFORE the other filters:
```js
function current() {
  var pool = (P.challenges || []).filter(function (c) { return (c.track || 'js') === view.track; });
  var list = P.filterChallenges(pool, view);
  if (view.order) {
    var byId = {}; list.forEach(function (c) { byId[c.id] = c; });
    list = view.order.map(function (id) { return byId[id]; }).filter(Boolean);
  }
  return list;
}
```
(c) Add helpers near the top:
```js
function catsForTrack(t) { return (P.practiceCategories || []).filter(function (c) { return (c.track || 'js') === t; }); }
function distinct(arr) { var s = {}; arr.forEach(function (x) { s[x] = 1; }); return Object.keys(s); }
```

- [ ] **Step 2: Track switcher + track-aware controls** in `scripts/practice-hub.js`

Replace `controlsHtml(count)` so it (1) renders two track tabs, (2) builds Topic options from `catsForTrack(view.track)`, (3) builds the Difficulty/Level options from the difficulties actually present in the active track, (4) relabels the difficulty control "Level" for the RN track:

```js
function controlsHtml(count) {
  var cats = [{ v: 'all', t: 'All topics' }].concat(catsForTrack(view.track).map(function (c) { return { v: c.id, t: c.title }; }));
  var pool = (P.challenges || []).filter(function (c) { return (c.track || 'js') === view.track; });
  var diffVals = distinct(pool.map(function (c) { return c.difficulty; }));
  var diffOrder = view.track === 'rn' ? ['core','senior','staff'] : ['easy','medium','hard'];
  diffVals.sort(function (a, b) { return diffOrder.indexOf(a) - diffOrder.indexOf(b); });
  var diffLabel = view.track === 'rn' ? 'level' : 'difficulty';
  var diffs = [{ v: 'all', t: 'All ' + diffLabel }].concat(diffVals.map(function (d) { return { v: d, t: d }; }));
  var typeVals = distinct(pool.map(function (c) { return c.type; }));
  var typeName = { 'predict-output':'Predict output', 'spot-the-bug':'Spot the bug', 'deep-dive':'Deep dive', 'scenario':'Scenario' };
  var types = [{ v: 'all', t: 'All types' }].concat(typeVals.map(function (t) { return { v: t, t: typeName[t] || t }; }));
  var tab = function (t, label) { return '<button class="pc-track' + (view.track === t ? ' active' : '') + '" data-track="' + t + '">' + label + '</button>'; };
  return '' +
    '<div class="pc-tracks">' + tab('js', 'JS Code Challenges') + tab('rn', 'RN Deep Dives') + '</div>' +
    '<div class="pc-controls">' +
      '<select id="pcCat">' + optionList(view.category, cats) + '</select>' +
      '<select id="pcDiff">' + optionList(view.difficulty, diffs) + '</select>' +
      '<select id="pcType">' + optionList(view.type, types) + '</select>' +
      '<button id="pcShuffle">🔀 Shuffle</button>' +
      '<button id="pcRevealAll">Reveal all</button>' +
      '<span class="pc-count">' + count + ' card' + (count === 1 ? '' : 's') + '</span>' +
    '</div>';
}
```

- [ ] **Step 3: Render deep-dive/scenario answers** in `scripts/practice-hub.js`

Add a renderer for structured answers and branch `cardHtml` on `type`. Add:
```js
function fus(followups) {
  return '<ul class="pc-fu">' + (followups || []).map(function (f) {
    return '<li><span class="pc-fu-q">Q: ' + f.q + '</span> <span class="pc-fu-a">' + f.a + '</span></li>';
  }).join('') + '</ul>';
}
function sectionsHtml(type, a) {
  var rows;
  if (type === 'scenario') {
    rows = [['Approach', a.approach], ['What a senior checks first', a.seniorChecks], ['Model walkthrough', a.walkthrough]];
  } else {
    rows = [['Core answer', a.core], ['Deeper mechanism', a.mechanism], ['Tradeoffs & when it matters', a.tradeoffs]];
  }
  var html = rows.map(function (r) { return '<div class="pc-sec"><div class="pc-sec-label">' + r[0] + '</div><div class="pc-sec-body">' + r[1] + '</div></div>'; }).join('');
  html += '<div class="pc-sec"><div class="pc-sec-label">Follow-ups</div>' + fus(a.followups) + '</div>';
  if (type === 'deep-dive') html += '<div class="pc-sec pc-redflags"><div class="pc-sec-label">🚩 Red flags</div><div class="pc-sec-body">' + a.redFlags + '</div></div>';
  return html;
}
```
Then in `cardHtml(c, n)`, branch: for `deep-dive`/`scenario`, the card has NO leading code block and the answer body uses `sectionsHtml`; for code types, keep the current rendering. Concretely, build the meta + prompt as today, then:
```js
  var isDeep = (c.type === 'deep-dive' || c.type === 'scenario');
  var codeBlock = isDeep ? '' : '<pre><code class="language-js">' + esc(c.code) + '</code></pre>';
  var answerInner = isDeep
    ? sectionsHtml(c.type, c.answer)
    : '<div class="pc-answer-label">' + (c.type === 'spot-the-bug' ? 'Fix' : 'Expected output') + '</div>' +
      '<pre><code class="language-js">' + esc(c.answer) + '</code></pre>' +
      '<div class="pc-why"><strong>Why:</strong> ' + esc(c.explanation) + '</div>';
```
and assemble the card with `codeBlock` after the prompt and `answerInner` inside `.pc-answer`. (Note: deep-dive answer fields are trusted HTML → NOT `esc()`'d; code-type answer/code stay `esc()`'d exactly as today. The meta line's `typeLabel` should map `deep-dive`→'deep dive', `scenario`→'scenario'.)

- [ ] **Step 4: Wire the track switcher** in `scripts/practice-hub.js`

In `wire(container)`, add a handler so clicking a track tab switches track and resets filters + order:
```js
  Array.prototype.forEach.call(container.querySelectorAll('.pc-track'), function (btn) {
    btn.addEventListener('click', function () {
      var t = btn.getAttribute('data-track');
      if (t === view.track) return;
      view.track = t; view.category = 'all'; view.difficulty = 'all'; view.type = 'all'; view.order = null;
      paint(container);
    });
  });
```
(Everything else in `wire` — filter changes, shuffle, reveal-all, per-card reveal — stays; they already re-read `current()`.)

- [ ] **Step 5: Styles** in `styles/practice.css`

Append (reuse existing tokens):
```css
.pc-tracks { display:flex; gap:8px; margin:16px 0 12px; }
.pc-tracks .pc-track { background:transparent; color:var(--fg-muted, #8a8a8a); border:1px solid var(--border); border-radius:999px; padding:6px 14px; font:inherit; cursor:pointer; }
.pc-tracks .pc-track.active { background:var(--accent, #58a6ff); color:#fff; border-color:var(--accent, #58a6ff); }
.pc-sec { margin-top:12px; }
.pc-sec-label { font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--fg-muted, #8a8a8a); margin-bottom:4px; }
.pc-sec-body { line-height:1.6; }
.pc-redflags .pc-sec-body { color:var(--red, #f85149); }
.pc-fu { margin:4px 0 0; padding-left:18px; }
.pc-fu li { margin-bottom:6px; line-height:1.5; }
.pc-fu-q { font-weight:600; }
```

- [ ] **Step 6: Verify**

Run: `node --check scripts/practice-hub.js` → exit 0.
Run the filter one-off (loads `_practice-index.js`, asserts `filterChallenges` narrows correctly) → prints `filter OK` (reuse the snippet pattern from the JS-hub task-3). Full browser verification happens in Task 4.

**Deliverable:** track-switchable hub that can render deep-dive/scenario cards (no RN content yet). No commit.

---

### Task 3: `rn-architecture` content (~12 deep-dive cards)

**Files:**
- Create: `scripts/practice/rn-architecture.js`

**Interfaces:**
- Consumes: `registerChallenge` (Task 1). Produces ~12 cards, `track:'rn'`, `category:'rn-architecture'`.

- [ ] **Step 1: Author the file**

Create `scripts/practice/rn-architecture.js` as an IIFE. Card skeleton (deep-dive):
```js
/* RN Deep Dives — New Architecture & Internals */
(function () {
  var reg = window.PREP_SITE.registerChallenge;
  reg({
    id: 'rn-arch-why-new-arch', track: 'rn', category: 'rn-architecture',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Why does the New Architecture exist, and what actually breaks or is limited without it?',
    answer: {
      core: '…crisp senior answer…',
      mechanism: '…JSI removes the async JSON bridge; Fabric renderer; TurboModules lazy+typed; bridgeless…',
      tradeoffs: '…migration cost, lib compat, when it matters vs not…',
      followups: [
        { q: 'What is bridgeless mode and when did it become default?', a: '…' },
        { q: 'How does JSI differ from the old bridge concretely?', a: '…' }
      ],
      redFlags: '…"it\'s just faster" with no mechanism; calling it experimental/opt-in (it\'s default since 0.76)…'
    }
  });
  // …author ~12 total…
})();
```
Author ~12 cards (mostly `deep-dive`, level spread across `core`/`senior`/`staff`, skewing senior) covering: (1) why the New Architecture exists / what it fixes; (2) JSI — what it is, how it replaces the bridge, what it enables (sync calls, HostObjects, MMKV, Reanimated); (3) Fabric renderer internals (C++ shadow tree, sync layout, concurrent-React aware, atomic tree swap); (4) TurboModules vs NativeModules (lazy, typed, codegen, sync-capable); (5) Codegen — what it generates and from what (TS specs); (6) bridgeless mode (default since 0.76, what it removes); (7) the thread model (JS / UI-main / Shadow-Yoga) and blocking implications; (8) Hermes — why, bytecode precompile, GC, default status; (9) the interop layer (running old-arch libs under new arch) and migration risks; (10) how the New Architecture enables React 18 concurrent features in RN; (11) what still uses the legacy path / gotchas during migration; (12) a `staff`-level card on evaluating whether/when to migrate a large app.

**Every card must respect the Global Constraints 2026 fact list** (New Arch default since 0.76, legacy frozen, Reanimated v4, RN DevTools, etc.).

- [ ] **Step 2: Shape-validate**

Run: `node tools/verify-challenges.mjs`
Expected: `rn-architecture` count ~12, ZERO `✗` lines mentioning any `rn-arch-*` id, overall still `✅ PASS`. Fix any shape errors it reports (missing answer fields, empty followups, bad enum). `node --check scripts/practice/rn-architecture.js` → exit 0.

(Accuracy is gated by expert review in the SDD review step, not here.)

**Deliverable:** ~12 New Architecture deep-dive cards, shape-valid. No commit.

---

### Task 4: Wire `rn-architecture` + browser verification of the RN track

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add the script tag**

In `index.html`, add AFTER the last `js-*.js` practice tag and BEFORE `practice-hub.js`:
```html
<script src="scripts/practice/rn-architecture.js"></script>
```

- [ ] **Step 2: Manual browser verification**

Open `index.html` (or `python3 -m http.server` then visit it). Verify:
- The hub shows a **track switcher**; clicking **RN Deep Dives** switches to the RN track.
- On the RN track: Topic filter lists RN categories; the difficulty filter is labelled/valued for levels (`core/senior/staff`); the count shows ~12; Type filter shows "Deep dive".
- A card reveals the **structured answer** (Core / Deeper mechanism / Tradeoffs / Follow-ups list / 🚩 Red flags), rendered legibly.
- Switching back to **JS Code Challenges** shows the 160 JS cards with the original difficulty/type filters (no regression).
- Shuffle, Reveal-all, per-card reveal all work on the RN track; both themes look right.
- Refresh resets to the JS track (stateless).

- [ ] **Step 3: Regression check**

Confirm home (`#/`) and a note topic still render; the JS track still reports 160.

**Deliverable:** RN track live end-to-end with the New Architecture bank. **STOP for user look/feel review before authoring the rest.** No commit.

---

### Tasks 5–15: Remaining RN categories

Each task creates ONE `scripts/practice/<file>.js` with the same deep-dive skeleton as Task 3 (or `scenario` skeleton for system-design — see Task 6), authoring the target count across the listed coverage, then runs `node tools/verify-challenges.mjs` and confirms its category is shape-valid (~target count, zero `✗` for its ids, overall PASS) and `node --check`s the file. Do NOT modify `index.html` (Task 16 wires all remaining tags centrally). No commit. **Every card must respect the Global Constraints 2026 fact list.** Level spread skews `senior` with some `core` and some `staff`.

### Task 5: `rn-performance.js` (~12 deep-dive, a few `spot-the-bug`) — `category: 'rn-performance'`
Coverage: JS-thread vs UI-thread frame budget & what blocks each; measuring perf (RN DevTools profiler, Perf Monitor, Systrace/Hermes sampling profiler — NOT Flipper); re-render minimization (memo, useCallback, selective subscriptions); list perf (windowing, FlashList v2, keyExtractor, getItemLayout tradeoffs); image perf (expo-image, caching, resizeMode, downscaling); startup/TTI (Hermes bytecode, inline requires, RAM bundles legacy vs current, bundle splitting); JSI/native offloading; Reanimated on UI thread; memory leaks (listeners, timers, navigation retention); InteractionManager & deferring work; a `spot-the-bug` on an unstable inline `renderItem`/missing `keyExtractor`; a `spot-the-bug` on a `useEffect` missing cleanup causing a leak; a `staff` card on setting a perf budget & profiling methodology.

### Task 6: `rn-system-design.js` (~12, mostly `scenario`) — `category: 'rn-system-design'`
Use the SCENARIO skeleton:
```js
reg({ id: 'rn-sd-<slug>', track: 'rn', category: 'rn-system-design', difficulty: 'staff', type: 'scenario',
  prompt: '…design/debug prompt…',
  answer: { approach: '…clarifying questions/framing…', seniorChecks: '…what a senior evaluates first…',
            walkthrough: '…the model design…', followups: [{ q: '…', a: '…' }] } });
```
Coverage (scenarios): design an offline-first app with sync/conflict resolution; design a chat/messaging feature (realtime, pagination, optimistic send); design image-heavy feed with smooth scroll on low-end Android; design an OTA update + release strategy (EAS Update, staged rollout, native/JS version skew); design robust deep-linking + navigation state restoration; design a design-system/component library for a large RN app; design analytics + crash pipeline; design auth/session/secure-token storage; design a large-list + search screen; design theming (light/dark) + accessibility; a debug scenario ("frames drop on scroll — diagnose"); a debug scenario ("app cold-start is slow — diagnose"). Mostly `staff`/`senior`.

### Task 7: `rn-native-modules.js` (~9 deep-dive, maybe 1 `spot-the-bug`) — `category: 'rn-native-modules'`
Coverage: when you need a native module vs a JS lib; TurboModule authoring (TS spec → codegen → native impl) at a conceptual level; JSI HostObjects & synchronous native access; threading (which thread native methods run on, dispatching to main); passing data across (types, serialization cost on old bridge vs JSI); Fabric native components (custom views) vs native modules; Expo Modules API as the modern authoring path; new-arch vs old-arch module compatibility & the interop layer; event emitting to JS; a `spot-the-bug` or gotcha card (e.g. blocking the main thread from a sync native call).

### Task 8: `rn-animations.js` (~9 deep-dive, ~2 `spot-the-bug`) — `category: 'rn-animations'`
Coverage: Animated API vs Reanimated (when/why); **Reanimated v4** worklets — what a worklet is, UI-thread execution, `react-native-worklets` split, New-Arch-only; shared values & `useAnimatedStyle`; gesture handler integration; `runOnJS`/`runOnUI` and thread hops; layout animations & entering/exiting; interpolation & derived values; performance vs JS-driven Animated; a `spot-the-bug` on capturing a stale JS variable in a worklet; a `spot-the-bug` on running heavy work in `useAnimatedStyle`. (Do NOT reference Reanimated 3 as current.)

### Task 9: `rn-navigation.js` (~9 deep-dive) — `category: 'rn-navigation'`
Coverage: React Navigation **v7** architecture (navigators, native-stack vs JS stack); Expo Router (**v5-era**, file-based) vs React Navigation tradeoffs; deep linking config & universal/app links; navigation state persistence/restoration; params vs global state; nested navigators & type-safety; auth flows (protected routes, redirects); performance (native-stack, screen freezing, lazy screens); modals & presentation; a card on shared-element/transition options in 2026.

### Task 10: `rn-lists.js` (~9 deep-dive, ~2 `spot-the-bug`) — `category: 'rn-lists'`
Coverage: FlatList internals (windowing, `windowSize`, `maxToRenderPerBatch`, recycling-or-not); **FlashList v2** (no `estimatedItemSize`, recycling, when to choose it); `keyExtractor` & stable keys; `getItemLayout`; re-render pitfalls (inline renderItem, non-memoized items); SectionList; huge lists & pagination/infinite scroll; pull-to-refresh & scroll perf; a `spot-the-bug` (missing/duplicate keys causing state bleed); a `spot-the-bug` (index as key on a reorderable list).

### Task 11: `rn-state-data.js` (~9 deep-dive) — `category: 'rn-state-data'`
Coverage: local state vs context vs external store (Zustand/Redux Toolkit/Jotai) tradeoffs in RN; server state with TanStack Query (caching, `staleTime`/`gcTime`, offline); persistence (MMKV vs AsyncStorage — sync JSI vs async); offline-first & background sync patterns; optimistic updates & rollback; secure storage (Keychain/Keystore, expo-secure-store); data migration/versioning of persisted state; hydration/rehydration & startup; a card on selecting a state solution for a given scale.

### Task 12: `rn-platform-apis.js` (~6 deep-dive) — `category: 'rn-platform-apis'`
Coverage: permissions model (iOS/Android differences, runtime prompts, rationale); push notifications (APNs/FCM via Expo Notifications / notifee; FCM legacy API shutdown); background tasks/fetch limitations per OS; camera/media/file access; linking & app-to-app; platform-specific code (`Platform.select`, `.ios.tsx`/`.android.tsx`); a card on handling permission denial gracefully.

### Task 13: `rn-build-release.js` (~6 deep-dive) — `category: 'rn-build-release'`
Coverage: **EAS Build** pipeline & profiles; **EAS Update** (OTA) — what can/can't be OTA'd (JS vs native), runtime versions, staged rollout (CodePush deprecated); app signing (iOS certs/provisioning, Android keystore); versioning & native/JS skew; the 16 KB page-size / target-SDK store requirements era; store submission (EAS Submit); a card on a safe release/rollback strategy.

### Task 14: `rn-testing-debugging.js` (~6 deep-dive, ~1 `spot-the-bug`) — `category: 'rn-testing-debugging'`
Coverage: testing pyramid for RN (Jest + RTL-native, component vs integration); E2E (Detox vs Maestro tradeoffs); mocking native modules; **React Native DevTools** (replaced Flipper) & Hermes debugging; performance debugging workflow; crash symbolication (Sentry); "Debug in Chrome"/Remote JS Debugging removed in 0.79 (what to use instead); a `spot-the-bug` on a flaky async test (missing `await`/`waitFor`).

### Task 15: `rn-styling.js` (~6 deep-dive) — `category: 'rn-styling'`
Coverage: Flexbox in RN vs web (defaults: column, flex semantics); no CSS Grid — alternatives; `StyleSheet.create` vs inline (and whether it still matters); responsive/adaptive layouts (Dimensions, `useWindowDimensions`, safe-area); styling libraries (NativeWind, Tamagui, Unistyles) tradeoffs in 2026; theming (light/dark) & tokens; platform-specific styling & pixel density; a card on shadow/elevation cross-platform differences.

---

### Task 16: Wire remaining RN tags + final validation

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Wire the 11 remaining RN tags**

In `index.html`, after `scripts/practice/rn-architecture.js` and before `practice-hub.js`, add (in tier order):
```html
<script src="scripts/practice/rn-performance.js"></script>
<script src="scripts/practice/rn-system-design.js"></script>
<script src="scripts/practice/rn-native-modules.js"></script>
<script src="scripts/practice/rn-animations.js"></script>
<script src="scripts/practice/rn-navigation.js"></script>
<script src="scripts/practice/rn-lists.js"></script>
<script src="scripts/practice/rn-state-data.js"></script>
<script src="scripts/practice/rn-platform-apis.js"></script>
<script src="scripts/practice/rn-build-release.js"></script>
<script src="scripts/practice/rn-testing-debugging.js"></script>
<script src="scripts/practice/rn-styling.js"></script>
```

- [ ] **Step 2: Full shape validation**

Run: `node tools/verify-challenges.mjs`
Expected: `✅ PASS`; JS `TOTAL` contribution unchanged (160 JS predict-output/etc. still pass); all 12 RN categories show their counts (~105 RN total → grand `TOTAL ≈ 265`); zero `✗` lines.

- [ ] **Step 3: Confirm all files parse**

Run: `for f in scripts/practice/*.js scripts/practice-hub.js; do node --check "$f" || echo "FAIL $f"; done`
Expected: no `FAIL`.

- [ ] **Step 4: Final manual browser pass**

Open the site → `#/practice` → RN Deep Dives. Spot-check: all 12 RN categories in the Topic filter, level/type filters work, counts look right (~105), deep-dive + scenario cards both render their structured answers, shuffle/reveal work, both themes fine. Confirm the JS track still shows 160 and home/notes still work.

**Deliverable:** complete ~105-card RN Deep Dives track, shape-valid and wired. No commit (user commits on request). (Note: technical accuracy of RN cards is separately gated by the expert-review step in execution — see §7 of the spec.)

---

## Self-Review

**Spec coverage:**
- §3 Architecture (track field, RN categories, new types, hub switcher, deep-dive rendering, validator, tags) → Tasks 1, 2, 4, 16. ✓
- §4 Data model (track default, enums, object answer shape by type) → Task 1 (registry + validator), Task 2 (rendering). ✓
- §5 UX (track switcher, track-scoped filters, level relabel, structured reveal, stateless) → Task 2 + Task 4 verification. ✓
- §6 Coverage/weighting (12 categories, ~105, counts, system-design=scenario) → Tasks 3, 5–15; totals Task 16. ✓
- §7 Verification (shape validator no-exec + expert review + 2026 facts) → Task 1 validator; fact list in Global Constraints; accuracy via SDD review. ✓
- §8 Rollout (architecture slice first, STOP, tiers, final) → Task ordering + explicit STOP at Task 4. ✓
- §9 Risks (JS regression, data-model divergence, theme) → Global Constraints + Task 1 shape enforcement + Task 4/16 regression checks. ✓

**Placeholder scan:** Content tasks carry concrete coverage lists (specific interview questions to author), not "TODO"; the deep answers are authored during execution (they are prose model answers, not derivable in advance) and gated by shape-validation + expert review. All infrastructure code (registry validation, validator shape checks, hub track logic, deep-dive rendering, CSS) is shown in full. The example `answer` field values in Task 3 use `…` as visible author placeholders WITHIN a template the author fills — not plan placeholders for infrastructure.

**Type consistency:** `track` (default `'js'`), the four `type` values, difficulty-by-track (`easy/medium/hard` vs `core/senior/staff`), the deep-dive answer object keys (`core/mechanism/tradeoffs/followups/redFlags`) and scenario keys (`approach/seniorChecks/walkthrough/followups`), and `followups:[{q,a}]` are used identically in Task 1 (validator + registry), Task 2 (rendering `sectionsHtml`/`fus`), and Tasks 3/5–15 (authoring). Category ids in Task 1 match the `category:` values in Tasks 3/5–15 and the tags in Tasks 4/16.

**Deviation note:** Standard TDD "commit each task" + execution-harness testing are replaced by (a) a Node shape-validator for structure and (b) expert accuracy review, because RN content is conceptual (no runnable output) and per project rules must not auto-commit or auto-build.
