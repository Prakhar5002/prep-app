# Redux Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a progressive "Redux" notes module (5 ordered topics, beginner → advanced) to the study site, following the existing topic conventions.

**Architecture:** Each topic is a vanilla-JS IIFE calling `window.PREP_SITE.registerTopic({...})` (defined in `scripts/content/_index.js`); a new `redux` module entry in the registry drives the sidebar and Prev/Next. A dev-only Node structural-check tool loads the topics under a `window` shim and asserts each registers with a unique id, `module: 'redux'`, and the required sections. Prose accuracy is gated by expert review (no execution).

**Tech Stack:** Vanilla ES5/ES6 browser JS in IIFEs on `window.PREP_SITE`; existing Prism + theme; Node (ESM, `node:vm`) for the structural checker. No bundler, no framework, no test runner.

## Global Constraints

From the spec (`docs/superpowers/specs/2026-07-05-redux-module-design.md`). Every task implicitly includes these:

- **No build step.** Topic files load via `<script>` tags in `index.html`. No transpile/bundle.
- **Registration pattern.** Each topic file is an IIFE calling `window.PREP_SITE.registerTopic({ id, module, title, estimatedReadTime, tags, sections })`. `registerTopic` (in `_index.js`) stores `topicsById[topic.id] = topic`.
- **Module field = module id.** Set `module: 'redux'` (the registry module's `id`); `moduleTitle()` resolves id→title for the breadcrumb.
- **Registry module:** `{ id: "redux", title: "Redux", topics: [5 entries] }` in `_index.js` `registry.modules`. Sidebar groups by the registry's `topics` id list; a registry topic id with no registered topic renders "coming soon".
- **Sections:** each `sections[]` entry is `{ id, title, html }` (+ `collapsible: false` on the first, `tldr`). `html` is raw trusted HTML; code uses `<pre><code class="language-js">…</code></pre>`, inline uses `<code>`. Every topic includes at least these section ids: `tldr`, `what-why`, `mental-model`, `mechanics`, `examples`, `interview-patterns` (others optional: `edge-cases`, `bugs-anti-patterns`).
- **Topic ids (exact):** `redux-core`, `redux-toolkit`, `redux-rtk-query`, `redux-middleware-async`, `redux-advanced-testing`. Their files are `scripts/content/redux-<suffix>.js` matching the id.
- **2026 Redux facts (every topic must respect; WebSearch to confirm version specifics):** Redux Toolkit (RTK) is THE standard — hand-written Redux (manual action-type constants, switch reducers, `connect`) is legacy, taught only as historical context in `redux-core`. Current majors: **Redux 5.x, Redux Toolkit 2.x, React-Redux 9.x**. `createListenerMiddleware` is the modern built-in side-effect tool (not Sagas by default). `createSlice`'s "mutation" is Immer drafts, not real mutation. RTK Query is RTK's server-cache; TanStack Query is the common alternative. TypeScript-first (`RootState`/`AppDispatch`, typed hooks).
- **Cross-link, don't duplicate:** the existing `scripts/content/state-redux.js` stays the concise reference; add one reciprocal cross-link each way. No copied sections.
- **No auto-commit / no auto-build.** Never run `git commit`/`git push`/build. End each task at verification; user commits manually on request.

---

## File Structure

**Modify:**
- `scripts/content/_index.js` — add the `redux` module to `registry.modules`.
- `index.html` — add 5 `redux-*.js` `<script>` tags among the content scripts (before `scripts/app.js`).
- `scripts/content/state-redux.js` — add ONE cross-link line to the new module.

**Create:**
- `scripts/content/redux-core.js`, `redux-toolkit.js`, `redux-rtk-query.js`, `redux-middleware-async.js`, `redux-advanced-testing.js`.
- `tools/verify-topics.mjs` — dev-only structural checker (NOT referenced by index.html).

---

### Task 1: Register the `redux` module + structural-check tool

**Files:**
- Modify: `scripts/content/_index.js`
- Create: `tools/verify-topics.mjs`

**Interfaces:**
- Produces: a `redux` registry module with 5 topic entries; `node tools/verify-topics.mjs` validates registered `redux-*` topics' structure.

- [ ] **Step 1: Add the module to the registry**

In `scripts/content/_index.js`, add this object to the `registry.modules` array, immediately before or after the `state-deep` module entry (so related content is adjacent):

```js
    {
      id: "redux",
      title: "Redux",
      topics: [
        { id: "redux-core",             title: "Why Redux & Core Concepts" },
        { id: "redux-toolkit",          title: "Redux Toolkit (RTK)" },
        { id: "redux-rtk-query",        title: "RTK Query" },
        { id: "redux-middleware-async", title: "Middleware & Async" },
        { id: "redux-advanced-testing", title: "Advanced Patterns & Testing" },
      ],
    },
```

- [ ] **Step 2: Create the structural-check tool**

Create `tools/verify-topics.mjs`:

```js
// DEV ONLY — not referenced by index.html. Run: node tools/verify-topics.mjs
// Structural check for the redux topic module: each registry redux topic must have a
// registered topic with module:'redux', a unique id, and the required sections.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'scripts', 'content');

const sandbox = { window: {}, document: {}, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f });

let failures = 0;
load(path.join(contentDir, '_index.js'));               // defines registry + registerTopic
for (const f of fs.readdirSync(contentDir).filter(f => f.startsWith('redux-') && f.endsWith('.js')).sort()) {
  try { load(path.join(contentDir, f)); }
  catch (err) { console.log(`✗ ${f}: ${err.message}`); failures++; }
}

const P = sandbox.window.PREP_SITE;
const byId = P.topicsById || {};
const reduxMod = (P.registry.modules || []).find(m => m.id === 'redux');
if (!reduxMod) { console.log('✗ no "redux" module in registry'); process.exit(1); }

const REQUIRED = ['tldr', 'what-why', 'mental-model', 'mechanics', 'examples', 'interview-patterns'];
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

for (const entry of reduxMod.topics) {
  const t = byId[entry.id];
  if (!t) { console.log(`… ${entry.id}: not registered yet (pending)`); continue; }
  if (t.module !== 'redux') { console.log(`✗ ${entry.id}: module is "${t.module}", expected "redux"`); failures++; }
  if (!nonEmpty(t.title)) { console.log(`✗ ${entry.id}: empty title`); failures++; }
  if (!Array.isArray(t.sections) || !t.sections.length) { console.log(`✗ ${entry.id}: no sections`); failures++; continue; }
  const ids = t.sections.map(s => s.id);
  for (const req of REQUIRED) if (!ids.includes(req)) { console.log(`✗ ${entry.id}: missing section "${req}"`); failures++; }
  if (t.sections[0].id !== 'tldr' || t.sections[0].collapsible !== false) { console.log(`✗ ${entry.id}: first section must be tldr with collapsible:false`); failures++; }
  t.sections.forEach(s => {
    if (!nonEmpty(s.id) || !nonEmpty(s.title) || !nonEmpty(s.html)) { console.log(`✗ ${entry.id}: section "${s.id||'?'}" missing id/title/html`); failures++; }
  });
  console.log(`✓ ${entry.id}: ${t.sections.length} sections`);
}

const registered = reduxMod.topics.filter(e => byId[e.id]).length;
console.log(`\n${registered}/${reduxMod.topics.length} redux topics registered`);
console.log(failures === 0 ? '✅ PASS' : `❌ FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 3: Run the tool (module present, topics pending)**

Run: `node tools/verify-topics.mjs`
Expected: 5 lines `… redux-*: not registered yet (pending)`, `0/5 redux topics registered`, `✅ PASS` (no topic files exist yet, so nothing fails; the module loads cleanly).

- [ ] **Step 4: Syntax-check**

Run: `node --check scripts/content/_index.js && node --check tools/verify-topics.mjs`
Expected: no output, exit 0.

**Deliverable:** the `redux` module exists in the registry (sidebar will show it with 5 "coming soon" topics) + a runnable structural checker. No commit.

---

### Task 2: `redux-core` topic + wiring + cross-link (the slice)

**Files:**
- Create: `scripts/content/redux-core.js`
- Modify: `index.html`, `scripts/content/state-redux.js`

**Interfaces:**
- Consumes: `registerTopic` (Task 1). Produces the `redux-core` topic.

- [ ] **Step 1: Author `redux-core.js`**

Create `scripts/content/redux-core.js` as an IIFE registering the topic. Use this skeleton and author each section's `html` per the outline below:

```js
window.PREP_SITE.registerTopic({
  id: 'redux-core',
  module: 'redux',
  title: 'Why Redux & Core Concepts',
  estimatedReadTime: '25 min',
  tags: ['redux', 'state-management', 'fundamentals', 'store', 'reducers'],
  sections: [
    { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `…` },
    { id: 'what-why', title: '🧠 What & Why', html: `…` },
    { id: 'mental-model', title: '🗺️ Mental Model', html: `…` },
    { id: 'mechanics', title: '⚙️ Mechanics', html: `…` },
    { id: 'examples', title: '🧪 Worked Examples', html: `…` },
    { id: 'edge-cases', title: '⚠️ Edge Cases', html: `…` },
    { id: 'interview-patterns', title: '🎤 Interview Patterns', html: `…` },
  ],
});
```

Content outline (beginner level — assume only React basics):
- **TL;DR:** 3–5 bullets — what Redux is, the one-way data-flow loop, when you actually need it (and when Context/local state suffice), and that RTK is how you use it today.
- **What & Why:** the problem — shared state across distant components, prop-drilling, unpredictable updates; predictability/traceability benefits; honest "you might not need Redux" (Context, server-state libs).
- **Mental Model:** store = single source of truth (one state tree); actions = plain `{type, payload}` events describing "what happened"; reducers = pure `(state, action) => newState`; `dispatch` sends actions; subscribers re-read. A small diagram (ASCII ok) of the dispatch → reducer → store → view loop.
- **Mechanics:** hand-roll a ~15-line `createStore(reducer)` with `getState`/`dispatch`/`subscribe` in a `<pre><code class="language-js">` block, then a counter reducer using it — so the mechanism is concrete. Cover immutability (return new objects, never mutate) and pure reducers (no side effects, no async). Then show the React-Redux wiring: `<Provider store>`, `useSelector`, `useDispatch`.
- **Worked Examples:** a counter and a small todo reducer (add/toggle), each with actions + reducer + component usage. Then explicitly say "RTK removes this boilerplate — see the next topic."
- **Edge Cases:** mutating state in a reducer (bug), non-serializable values in state/actions, putting derived data in the store, over-using Redux for local UI state.
- **Interview Patterns:** 4–6 Q&A — "What problem does Redux solve?", "Why must reducers be pure?", "action vs reducer vs store", "Redux vs Context", "is Redux still relevant in 2026?" (answer: yes, via RTK, for complex shared/client state — but many apps use server-state libs + Context instead).

Respect the Global Constraints 2026 facts (RTK is the modern way; hand-written Redux is legacy/for-understanding-only).

- [ ] **Step 2: Wire the script tag**

In `index.html`, add among the content `<script>` tags (before `scripts/app.js`):
```html
<script src="scripts/content/redux-core.js"></script>
```

- [ ] **Step 3: Add the cross-link in `state-redux.js`**

Read `scripts/content/state-redux.js`; in its `tldr` section html, add one line (matching existing markup style), e.g.:
```html
<p>New to Redux? Start with the ground-up <a href="#/topic/redux-core">Redux module</a>.</p>
```

- [ ] **Step 4: Structural check**

Run: `node tools/verify-topics.mjs`
Expected: `✓ redux-core: N sections`, the other 4 still `… pending`, `1/5 redux topics registered`, `✅ PASS`. Fix any `✗` it reports (missing section, wrong module, empty html). Then `node --check scripts/content/redux-core.js`.

- [ ] **Step 5: Manual browser verification**

Open `index.html` (or `python3 -m http.server`). Verify: the **Redux** module shows in the sidebar; **Why Redux & Core Concepts** opens and renders all sections; code blocks are highlighted with a Copy button; the cross-link from the existing Redux note works; both themes look right; Prev/Next appears. Confirm the other 4 redux topics show "coming soon".

**Deliverable:** the Redux module + topic 1 live end-to-end. **STOP for user review of look/feel + topic-1 depth before authoring topics 2–5.** No commit.

---

### Tasks 3–6: Remaining topics

Each task creates one `scripts/content/redux-<suffix>.js` using the same `registerTopic` skeleton as Task 2 (with the topic's own id/title/tags), authoring each section's `html` per the outline below, then adds its `<script>` tag to `index.html`, runs `node tools/verify-topics.mjs` (its topic must show `✓` with the required sections and overall `✅ PASS`), and `node --check`s the file. No commit. Respect the Global Constraints 2026 facts; use `<pre><code class="language-js">` for code.

### Task 3: `redux-toolkit.js` — id `redux-toolkit`, title "Redux Toolkit (RTK)"
Sections + outline:
- **TL;DR:** RTK is the official, standard way to write Redux; kills boilerplate; batteries-included (store setup, slices, thunks, entity adapters, RTK Query).
- **What & Why:** what hand-written Redux cost (action constants, switch reducers, immutable spreads, wiring) and how RTK removes each.
- **Mental Model:** slice = reducer logic + auto-generated actions for one state domain; the store composes slices; Immer lets you "mutate" a draft safely.
- **Mechanics:** `configureStore` (defaults: thunk middleware, Redux DevTools, dev-only immutability & serializability checks); `createSlice` (name/initialState/reducers, `PayloadAction`, auto action creators, Immer draft — explain it's not real mutation); `createAsyncThunk` (pending/fulfilled/rejected, `extraReducers` with builder callback); `createEntityAdapter` (normalized CRUD + selectors); memoized selectors via `createSelector`. TypeScript: `RootState`/`AppDispatch`, `useAppSelector`/`useAppDispatch` typed hooks.
- **Worked Examples:** a `counterSlice`; an async `usersSlice` with `createAsyncThunk` + `extraReducers`; a normalized `todosAdapter`. Full store composition.
- **Edge Cases:** returning a new value AND mutating draft in one reducer (don't); non-serializable in state; forgetting `extraReducers` builder; selector identity/memoization pitfalls.
- **Interview Patterns:** "why RTK over hand-written Redux?", "how does Immer work in createSlice?", "createAsyncThunk lifecycle", "createEntityAdapter — why normalize?", "how do you type the store?".

### Task 4: `redux-rtk-query.js` — id `redux-rtk-query`, title "RTK Query"
- **TL;DR:** RTK Query is RTK's data-fetching + caching layer; auto-generated hooks; declarative cache invalidation via tags.
- **What & Why:** hand-rolled thunks + loading/err flags vs a declarative cache; server-state vs client-state distinction.
- **Mental Model:** an `api` slice with endpoints; the cache keyed by endpoint+args; tags describe what data an endpoint provides/invalidates.
- **Mechanics:** `createApi` (`baseQuery: fetchBaseQuery`, `endpoints` builder), query vs mutation endpoints, auto hooks (`useGetXQuery`, `useAddXMutation`), `providesTags`/`invalidatesTags` (+ `{type,id:'LIST'}` bulk pattern), `keepUnusedDataFor`, refetch triggers, optimistic updates via `onQueryStarted` + `updateQueryData`, store wiring (`api.reducerPath`, `api.middleware`).
- **Worked Examples:** a posts API — list + add with tag invalidation; an optimistic like/toggle.
- **Edge Cases:** over-granular per-item tags (10k tags) → use LIST tags; cache serialization of args; mixing RTK Query with manual slices.
- **Interview Patterns:** "RTK Query vs createAsyncThunk", "how does tag invalidation work?", "RTK Query vs TanStack Query" (both valid; RTK Query if you're already in Redux, TanStack Query otherwise), "optimistic updates in RTK Query".

### Task 5: `redux-middleware-async.js` — id `redux-middleware-async`, title "Middleware & Async"
- **TL;DR:** middleware intercepts actions between dispatch and reducer; thunks + `createListenerMiddleware` cover almost all needs today; Sagas/Observables are niche.
- **What & Why:** reducers are pure (no async/side effects) — middleware is where effects live.
- **Mental Model:** the `store => next => action` chain; enhancers vs middleware.
- **Mechanics:** thunk middleware (already default in RTK; `dispatch(fn)`); `createListenerMiddleware` (the modern built-in — `startListening`, `actionCreator`/`matcher`/`predicate`, effect API `condition`/`fork`/`cancelActiveListeners`) as the RTK-recommended reactive side-effect tool; brief Saga/Observable landscape (generators / RxJS — where they still fit, why most teams don't need them); writing a tiny custom logger middleware; store enhancers concept.
- **Worked Examples:** a listener that reacts to a login action to fetch a profile + debounce a search; a custom logging middleware.
- **Edge Cases:** doing async in reducers (bug); listener leaks/cancellation; middleware order.
- **Interview Patterns:** "thunks vs sagas vs listener middleware", "what is middleware / the signature", "createListenerMiddleware vs Saga", "middleware vs enhancer".

### Task 6: `redux-advanced-testing.js` — id `redux-advanced-testing`, title "Advanced Patterns & Testing"
- **TL;DR:** normalization, selector performance, dynamic reducer injection, migration, and testing Redux code.
- **What & Why:** why normalize (dedupe, O(1) lookups, cache consistency); why memoized selectors matter for re-renders.
- **Mental Model:** byId/allIds shape; `useSelector` re-runs on every dispatch and re-renders on `!==` result → memoize + `shallowEqual`.
- **Mechanics:** normalization patterns (+ `createEntityAdapter` recap); performance (`createSelector`, selector identity, `shallowEqual`, avoiding new objects/arrays in selectors); code-splitting reducers / dynamic injection (`combineSlices` / `reducerManager` pattern); migrating legacy Redux (connect→hooks, constants/switch→slices, incremental adoption). **Testing:** slices/reducers (pure — assert `reducer(state, action)`), thunks/async (mock the API, assert dispatched states), RTK Query (msw), components with a real store (RTL `renderWithProviders` that wraps in `<Provider>` with a test store).
- **Worked Examples:** a `renderWithProviders` helper; a slice unit test; a thunk test; a component-with-store test.
- **Edge Cases:** selector returning a new array each call (re-render storm); testing against the real store vs a fresh one per test; over-normalizing tiny state.
- **Interview Patterns:** "how do you test Redux?", "how do you keep selectors fast?", "how do you code-split reducers?", "how would you migrate a legacy connect-based app to RTK?".

---

### Task 7: Final structural check + review pass

**Files:** none (verification only).

- [ ] **Step 1: Full structural check**

Run: `node tools/verify-topics.mjs`
Expected: all 5 topics show `✓ redux-*: N sections`, `5/5 redux topics registered`, `✅ PASS`.

- [ ] **Step 2: Confirm all files parse + tags wired**

Run: `for f in scripts/content/redux-*.js; do node --check "$f" || echo "FAIL $f"; done` (expect no FAIL). Then confirm `index.html` has all 5 redux `<script>` tags: `grep -c 'scripts/content/redux-' index.html` (expect 5).

- [ ] **Step 3: Final manual browser pass**

Open the site: the Redux module lists all 5 topics; each renders fully; Prev/Next threads them in order (core → toolkit → rtk-query → middleware-async → advanced-testing); the cross-links to/from `state-redux.js` work; search finds the new topics by title/tag; both themes render. Confirm no existing module/topic regressed.

**Deliverable:** complete 5-topic Redux module, structurally valid and wired. Accuracy is separately gated by the expert-review step in execution. No commit (user commits on request).

---

## Self-Review

**Spec coverage:**
- §3 Architecture (module registration, topic files, script tags, cross-link, structural tool) → Tasks 1, 2, 3–6, 7. ✓
- §4 Registration shape (registerTopic fields, module id, sections, first-section collapsible) → Task 1 tool enforces; Tasks 2–6 author. ✓
- §5 Topic outlines (5 topics, beginner→advanced, hand-rolled store in topic 1) → Tasks 2–6 with per-section outlines. ✓
- §6 Correctness (2026 facts + structural load check + expert review) → Global Constraints fact list; Task 1 tool; accuracy via SDD review. ✓
- §7 Rollout (module+core slice first, STOP, then 2–5, then final) → Task ordering + explicit STOP at Task 2. ✓
- §8 Risks (duplication, module-not-appearing) → cross-link in Task 2; structural + browser checks in Tasks 2/7. ✓

**Placeholder scan:** Content tasks carry per-section content outlines (what each section teaches), not "TODO" — the prose is authored during execution and gated by structural-check + expert review; the `…` in the skeletons are author-fill markers within a template. All infrastructure (registry entry, structural tool) is shown in full. No "handle errors / similar to Task N" placeholders in code steps.

**Type consistency:** Topic ids (`redux-core`, `redux-toolkit`, `redux-rtk-query`, `redux-middleware-async`, `redux-advanced-testing`), `module: 'redux'`, the registry module id `redux`, the required section ids (`tldr`/`what-why`/`mental-model`/`mechanics`/`examples`/`interview-patterns`), and the `registerTopic` field names are used identically across Task 1 (registry + tool), Task 2, and Tasks 3–6. File names match topic ids.

**Deviation note:** Standard TDD "commit each task" + execution tests are replaced by (a) the Node structural checker (registration + sections) and (b) expert accuracy review, because topics are prose (no runnable output) and per project rules must not auto-commit or auto-build.
