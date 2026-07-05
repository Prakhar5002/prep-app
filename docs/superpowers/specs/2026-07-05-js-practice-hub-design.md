# JS Practice Hub — Design Spec

**Date:** 2026-07-05
**Status:** Approved design, pending implementation plan
**Repo:** Prep-Site (static, offline-first study site; no build step, vanilla JS loaded via `<script>` tags)

## 1. Goal

Add a dedicated, high-volume **JavaScript practice-question hub** for heavy interview
preparation. The existing 11 JS topic pages already contain readable "Interview
Patterns" Q&A; this feature adds something different: **interactive code challenges**
("predict the output" and "spot the bug") that the user reasons through and then reveals.

Success = the user can drill a large, interview-weighted bank of JS code challenges in
one place, self-pace via reveal, and trust that every answer is exactly correct.

## 2. Scope

**In scope**
- A single central Practice hub at route `#/practice`.
- ~155 JS code challenges, weighted by interview frequency (see §6).
- Two challenge types: `predict-output` and `spot-the-bug`.
- Filters (topic / difficulty / type), shuffle, per-card reveal, reveal-all/hide-all.
- Reuse of existing theme, Prism syntax highlighting, and code Copy button.

**Out of scope (explicitly, per brainstorming decisions)**
- No progress tracking / mastery / self-grading / spaced repetition — the hub is
  **stateless** (refresh = clean slate). Nothing persisted to localStorage.
- No multiple-choice format.
- No changes to existing note topics, the `studied` progress system, or search.
- No DSA/React/other-module practice yet (JS only; taxonomy is JS-flavored).

## 3. Architecture & Integration

Mirror the existing content-registration pattern so the feature feels native.

**New files**
- `scripts/practice/_practice-index.js`
  - Defines the practice category registry: an ordered list of
    `{ id, title, tier }` categories.
  - Exposes `window.PREP_SITE.registerChallenge(obj)` which pushes into
    `window.PREP_SITE.challenges` (array) and/or `challengesByCategory` (map).
- `scripts/practice/js-arrays.js`, `js-strings.js`, `js-async.js`, `js-coercion.js`,
  `js-closures-scope.js`, `js-objects.js`, `js-this.js`, `js-prototypes.js`,
  `js-hoisting-tdz.js`, `js-modules.js`, `js-advanced.js`
  - One file per category; each registers its challenges via `registerChallenge`.
- `scripts/practice-hub.js`
  - The hub view: render list, filters, shuffle, reveal handlers.
  - Kept separate from `app.js`; the router delegates the `#/practice` route to a
    single entry point (e.g. `window.PREP_SITE.renderPractice(container)`).

**Edits to existing files (minimal)**
- `scripts/app.js`
  - `parseRoute()`: recognize `#/practice`.
  - `route()`: when name === 'practice', call the hub renderer with `#content`.
  - Sidebar/home: add one "🏋️ JS Practice" entry linking to `#/practice`
    (placed sensibly near the JS module or in a top-level nav slot).
- `index.html`
  - Add `<script>` tags for `_practice-index.js`, each category file, and
    `practice-hub.js`, in dependency order (index before categories before hub).

**No change** to note topics, `registerTopic`, the `studied` set, reading progress,
or search.

## 4. Data Model

Each challenge is a plain object registered at load time:

```js
window.PREP_SITE.registerChallenge({
  id: 'arr-sort-default',        // unique, kebab-case
  category: 'js-arrays',         // must match a category id in _practice-index.js
  difficulty: 'medium',          // 'easy' | 'medium' | 'hard'
  type: 'predict-output',        // 'predict-output' | 'spot-the-bug'
  prompt: 'What does this log?',  // short instruction (plain text/inline HTML)
  code: `console.log([1, 10, 2, 21].sort());`,  // the snippet (raw JS source)
  answer: `[ 1, 10, 2, 21 ]`,    // predict-output: exact console output.
                                  // spot-the-bug: the corrected code / stated fix.
  explanation: `sort() coerces elements to strings by default, so it orders
                lexicographically: "1" < "10" < "2" < "21".`,  // the "why"
});
```

Field semantics:
- `type: 'predict-output'` — `code` is run mentally; `answer` is the **exact** engine
  output (including formatting, e.g. array spacing, `undefined`, thrown errors,
  async ordering). `explanation` states the mechanism.
- `type: 'spot-the-bug'` — `code` contains a defect; `answer` is the fix (corrected
  snippet and/or one-line description); `explanation` states the root cause.
- `code` is rendered inside `<pre><code class="language-js">…</code></pre>` so the
  existing Prism highlighting and Copy button apply automatically.
- `answer` that is itself code is likewise rendered in a highlighted block.

## 5. UX / Interaction

Single scrollable page rendered into `#content` at `#/practice`.

**Header / controls**
```
🏋️ JS Practice · <N> challenges
Topic: [All ▾]   Difficulty: [All ▾]   Type: [All ▾]   [ 🔀 Shuffle ]  [ Reveal all / Hide all ]
```
- **Topic filter** — options from the category registry (All + each category).
- **Difficulty filter** — All / Easy / Medium / Hard.
- **Type filter** — All / Predict output / Spot the bug.
- Filters combine (AND). The count updates to reflect the active filter.
- **Shuffle** — randomizes the order of the currently filtered list, in memory only.
- **Reveal all / Hide all** — toggles every visible card's answer.

**Challenge card**
```
#<n> · <Category> · <Difficulty> · <type label>
<prompt>
┌───────────────────────────┐
│ <code, syntax-highlighted> │  [Copy]
└───────────────────────────┘
[ Reveal answer ▾ ]
  → on reveal (expand inline):
     Expected output / Fix:  <answer>
     Why:  <explanation>
```
- Reveal is per-card, expand/collapse (chevron), independent of other cards.
- Uses existing CSS tokens so it themes correctly in dark and light modes.

**State**
- Stateless. Filter/shuffle/reveal live in memory only; a refresh resets everything.
  No localStorage writes.

## 6. Content Weighting (interview-frequency + user emphasis)

Volume follows interview frequency, with **arrays and strings deliberately heaviest**
per the user's emphasis. Counts are approximate targets, not hard limits.

| Tier | Category (id) | ~Count |
|------|---------------|--------|
| 1 | Arrays & methods (`js-arrays`) | ~28 |
| 1 | Strings & manipulation (`js-strings`) | ~25 |
| 1 | Async: event loop / promises / async-await (`js-async`) | ~20 |
| 1 | Coercion & edge cases (`js-coercion`) | ~18 |
| 1 | Closures & scope (`js-closures-scope`) | ~15 |
| 2 | Objects: refs, clone, spread, freeze, key order (`js-objects`) | ~12 |
| 2 | `this` / binding / arrow vs regular (`js-this`) | ~10 |
| 2 | Prototypes & inheritance (`js-prototypes`) | ~8 |
| 2 | Hoisting & TDZ (`js-hoisting-tdz`) | ~8 |
| 3 | Modules: ESM/CJS, live bindings, circular (`js-modules`) | ~6 |
| 3 | Memory/GC · Proxy/Symbol/Iterators (`js-advanced`) | ~6 |

**Total ≈ 155 challenges.**

Each category should span difficulties (not all hard); aim for a spread roughly
30% easy / 45% medium / 25% hard, weighted toward the classic traps.

## 7. Correctness Requirement (non-negotiable)

These are output-prediction challenges, so answers must be **exactly** what a JS engine
produces. Before any batch ships:

- Every `predict-output` snippet is **executed in Node** and the real stdout is diffed
  against the authored `answer`. The authored answer is corrected to match real output
  (including formatting like `[ 1, 10, 2, 21 ]`, `undefined`, error messages, and
  async/microtask ordering).
- Every `spot-the-bug` snippet is run to confirm (a) the buggy version actually
  misbehaves and (b) the fix behaves as claimed.
- Snippets that are environment-dependent (e.g. Node vs browser console formatting,
  timing) are either avoided or explicitly annotated in the explanation.

Verification is done via a throwaway Node script per batch (not shipped with the site).

## 8. Rollout Plan

Build in reviewable batches; nothing committed unless the user explicitly asks.

1. **Scaffold + vertical slice:** hub view + `#/practice` route + `_practice-index.js`
   + the `js-arrays` category (fully authored & Node-verified) + script tags + nav
   entry. User reviews the look/feel end-to-end.
2. **Strings:** author + verify `js-strings`.
3. **Remaining categories:** author + verify the rest, in tier order.

Each batch: author → run Node verification → fix answers → summarize.

## 9. Risks & Mitigations

- **Wrong answers** (the whole point is trust) → §7 Node-verification gate on every batch.
- **Long-page performance** with ~155 cards → render is simple DOM; if needed, cap
  initial render to the filtered set (already the case) and keep reveal lazy (answer
  HTML built on first reveal). Acceptable at this scale without virtualization.
- **Script load order** → index registry loads before category files before hub;
  enforced by `<script>` order in `index.html`.
- **Theme drift** → reuse existing CSS variables/classes; no new color literals.

## 10. Open Questions

None blocking. Explanation length/format left to author discretion (concise "why" +
optional one-line interview tip), adjustable during review.
