# Backend System Design (Deep) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 26-topic "System Design (Backend, Deep)" module to Prep-Site:
- estimation & numbers
- 8 building blocks
- 16 deep cases with drill-down ladders

It also reworks the Study Plan, delivered in 4 verified slices.

**Architecture:** Content is plain topic files registered into the existing global registry.
The test harness is the structural verifier (`tools/verify-topics.mjs`); for each content rule,
the check goes in first and the content follows. The UI changes are small edits in `scripts/app.js` /
`styles/app.css`, verified with a headless-Chrome DOM dump.

**Tech Stack:** Vanilla HTML/CSS/JS (no build), Node ≥ 18 for `node --check` and the verifier,
headless Google Chrome for render checks, `python3 -m http.server` to serve.

**Spec:** `docs/superpowers/specs/2026-11-11-backend-system-design-deep-design.md` (approved).
Read it alongside this plan. §4 (content bars) is the authoring brief.

## Global Constraints

- Topic file: `scripts/content/<id>.js` → `window.PREP_SITE.registerTopic({ id, module: 'backend-sd', title, estimatedReadTime, tags, sections })`.
- Section order: `revision` (first, `collapsible:false`), `what-why`, `mental-model`, `mechanics`,
  `examples`, `pitfalls`, then any extra sections, then `interview-qa` last. All except revision
  are `collapsible:true`.
- Revision card: `.revision-card` containing `.revision-oneline`, a Key points `<ul>`,
  `.revision-trap`, and 2–3 `.revision-say`.
- `html` is a template literal: **no backticks, no `${`** in authored HTML. Escape `<` `>` `&` in
  code.
- Q&A markup: `<div class="qa-block"><div class="qa-question">…</div><div class="qa-answer">…</div></div>`.
- Pitfalls section: Edge cases and Bugs & anti-patterns, each under a
  `<div class="pitfalls-part">` label.
- Module `backend-sd`, title `System Design (Backend, Deep)`, group `core`, groupLabel
  `Core · Full Stack + FDE`, placed directly after `backend` in `_index.js`.
- Link existing topics rather than re-teaching them: `be-databases`, `be-caching`, `be-queues`,
  `be-event-driven`, `be-architecture`, `be-resilience`, `be-kafka`, `lld-*`.
- Reference numbers are given as orders of magnitude or ranges with caveats, never as precise
  facts.
- **Never commit, push or deploy** unless Prakhar asks. Each slice ends by asking him.
- After every slice: `node tools/verify-topics.mjs` → `✅ PASS`.

## Review Focus

1. **Plan links to topics that aren't written yet.** Plan rows may reference topics from later
   slices. Expected: those render as plain "soon" text, not as links to a "Coming soon" page.
   Test: Task 4, step 1 (DOM check: no `a.plan-link` for unregistered ids).
2. **Old `#/topic/bsd-cases` bookmarks and synced `studied` ids.** After Slice 3, opening
   `#/topic/bsd-cases` must land on `bsd-framework`, and progress counts must not change.
   Test: Task 9, step 1.
3. **Existing plan ticks.** `prep-plan-done` keys are ISO dates, so reshaping phases must keep
   40 days starting 6 Nov. Expected: ticked dates stay ticked. Test: Task 4, step 1 (exactly 40
   `.plan-day`, first `2026-11-06`, last `2026-12-15`).
4. **Ladder follow-ups in Quick Revision.** Only ladder openers may appear in the self-test.
   Test: Task 3, step 1, plus Task 9, step 1 (self-test count per case = interview-qa
   questions + `qa-ladder-start` count).
5. **`<details>` reveal blocks in dark mode, and with JS search indexing.** Answers must be
   hidden until clicked, readable in both themes, and search must still index their text.
   Test: Task 3, steps 1 and 4.

---

## Author brief (used by every content task)

Each content task dispatches one authoring subagent per topic with this brief:

> Write `scripts/content/<id>.js` for Prep-Site.
> - Read the spec at `docs/superpowers/specs/2026-11-11-backend-system-design-deep-design.md`:
>   §4 (house style), plus §4.1, §4.2 or §4.3 for your topic type, and your topic's row and
>   scope.
> - Reference files: `scripts/content/bsd-framework.js` for the house format;
>   `scripts/content/be-databases.js` for depth; for cases, the matching old case in
>   `scripts/content/bsd-cases.js` is starting material only. Read them, don't copy them.
> - Hard rules: the Global Constraints in
>   `docs/superpowers/plans/2026-11-11-backend-system-design-deep.md`.
> - Target size: 40–60 KB.
> - When done, run `node --check scripts/content/<id>.js` and
>   `node tools/verify-topics.mjs 2>&1 | grep -A3 "<id>"`, and fix anything reported.
> - Do not edit any other file.

---

# Slice 1: Estimation, module wiring, UI, Study Plan

### Task 1: Module wiring and verifier rules

**Files:**
- Modify: `scripts/content/_index.js`: the `backend` module (around lines 33–49), plus a new
  module after it
- Modify: `index.html:310-311`
- Modify: `scripts/app.js:95-99` (`moduleLetters`) and `scripts/app.js:193-196` (`MODULE_META`)
- Modify: `tools/verify-topics.mjs`

**Interfaces:**
- Produces:
  - registry module `backend-sd`, with topics `bsd-estimation`, `bsd-framework` and
    `bsd-cases` (kept temporarily until Slice 3)
  - verifier rules `BSD_RULES`, used by every later task

- [ ] **Step 1: Add the verifier rules (they fail until the content exists)**

  In `tools/verify-topics.mjs`, after the per-topic generic checks, add per-id rules. `count(html, re)`
  is a small helper that counts regex matches.

  **Module check:**
  - `backend-sd` exists, has `group === 'core'`, and its index equals the index of `backend`
    plus 1.

  **`bsd-estimation`:**
  - Sections include `self-test`, and `count(selfTest, /class="qa-block qa-reveal"/g) >= 10`.
  - The `examples` html contains `<h3>Drill N:` for every N from 1 to 14.

  **ids starting `bsd-bb-`:**
  - At least one `<table`.
  - At least one `class="diagram"`.
  - `interview-qa` has 10 or more `class="qa-block`.

  **ids starting `bsd-case-`:**
  - Has a `drill-down` section, and its index is the index of `interview-qa` minus 1.
  - `count(drillDown, /class="qa-block/g) >= 15`.
  - `count(drillDown, /qa-ladder-start/g) >= 3`.
  - `interview-qa` has 8 or more `class="qa-block`.

- [ ] **Step 2: Run the verifier and confirm it fails**

  Run: `node tools/verify-topics.mjs | tail -3`
  Expected: `❌ FAIL`, with `module "backend-sd" missing`.

- [ ] **Step 3: Wire the module**

  **`_index.js`:**
  - Retitle `backend` to `"Backend"` and remove `bsd-framework` and `bsd-cases` from it.
  - Insert this module directly after `backend`:
    ```js
    { id: "backend-sd", title: "System Design (Backend, Deep)", group: "core", groupLabel: "Core · Full Stack + FDE",
      topics: [ { id: "bsd-estimation", title: "Estimation & Numbers" },
                { id: "bsd-framework", title: "Backend SD Framework" },
                { id: "bsd-cases", title: "Backend SD Cases (overview)" } ] },
    ```
  - In `bsd-framework.js` and `bsd-cases.js`, set `module: 'backend-sd'`.

  **`app.js`:**
  - Add `'backend-sd': 'SD'` to `moduleLetters`.
  - Add `MODULE_META['backend-sd'] = { icon: 'layers', name: 'System Design', sub: 'Estimation · building blocks · 16 cases' }`.
  - Change `MODULE_META.backend.sub` to `'DBs · caching · queues · resilience'`.

  **`index.html`:** add `<script src="scripts/content/bsd-estimation.js"></script>` directly
  before the `bsd-framework.js` tag.

- [ ] **Step 4: Run the verifier and confirm the only failure is the missing topic**

  Run: `node tools/verify-topics.mjs | grep -E "backend-sd|bsd-|PASS|FAIL"`
  Expected:
  - `[backend-sd]` is listed.
  - `bsd-estimation: not written yet`.
  - The script-tag check fails only for the missing `bsd-estimation.js`.

  This is acceptable until Task 2.

### Task 2: Author `bsd-estimation`

**Files:**
- Create: `scripts/content/bsd-estimation.js`
- Modify: `scripts/content/bsd-framework.js:139-171` (the "Useful estimation reference points"
  block)

**Interfaces:**
- Consumes: the Task 1 verifier rules.
- Produces:
  - `examples` section with `<h3>Drill 1: …</h3>` … `<h3>Drill 14: …</h3>` (the Study Plan
    links to `#/topic/bsd-estimation#examples` by drill number)
  - `self-test` section using `qa-reveal` markup (Task 3)

- [ ] **Step 1: Dispatch the author with the Author brief plus this section map** (spec §4.1)

  | Section | Title | Content |
  |---|---|---|
  | `revision` | `⚡ Revision — Points to Remember` | The numbers card: the ~10 must-know numbers plus the method in one line |
  | `what-why` | `🧠 What & Why` | What interviewers check; why numbers drive decisions |
  | `mental-model` | `🗺️ The Method` | §4.1 part 2, then the part 3 "Numbers → decisions" table |
  | `mechanics` | `⚙️ Numbers to Know by Heart` | §4.1 part 1: the latency, throughput, sizes, shortcuts and availability tables |
  | `examples` | `🧪 Worked Drills` | 14 drills titled `Drill N: <system>`, covering the systems listed in §4.1 part 4 |
  | `pitfalls` | `🕳️ Pitfalls` | Estimation mistakes, e.g. unit slips, ignoring peak or replication, false precision |
  | `self-test` | `🎯 Self-Test Drills` | 10 drills, each `<details class="qa-block qa-reveal"><summary class="qa-question">…</summary><div class="qa-answer">…</div></details>` |
  | `interview-qa` | `🎤 Interview Q&A` | §4.1 part 6 |

- [ ] **Step 2: Replace the estimation reference block in `bsd-framework.js`**

  Replace lines 139–171 (the `<h3>Useful estimation reference points</h3>` heading and its
  table) with:
  ```html
  <div class="callout insight"><div class="callout-title">Numbers live in their own topic</div>
  <p>Latency, throughput and size numbers, the method, and 14 worked drills are in
  <a href="#/topic/bsd-estimation">Estimation &amp; Numbers</a>. Learn those by heart first.</p></div>
  ```

- [ ] **Step 3: Verify**

  Run: `node --check scripts/content/bsd-estimation.js && node tools/verify-topics.mjs | tail -2`
  Expected: `✅ PASS`.

### Task 3: UI: reveal blocks, ladder-aware self-test, plan "soon" fallback

**Files:**
- Modify: `styles/app.css` (append after the `.qa-block` rules, around line 1297)
- Modify: `scripts/app.js:994-1006` (`questionsOf`) and `scripts/app.js:819-824` (`T`)
- Test: `scratchpad/check-ui.mjs` (temporary DOM-dump checker; not committed)

**Interfaces:**
- Produces:
  - **CSS classes:** `.qa-reveal` (on `<details>`) and `.plan-soon`.
  - **`questionsOf(topic)`:** reads `interview-qa`, plus `drill-down .qa-ladder-start .qa-question`.
  - **`T(id, label)`:**
    - If the id is registered: returns `a.plan-link` and adds the id to `planTopics`.
    - Otherwise: returns `<span class="plan-soon" title="Coming soon">label</span>` and does
      not count it.

- [ ] **Step 1: Write the DOM check**

  Write `check-ui.mjs`. It:
  - runs `python3 -m http.server 8765` in Prep-Site
  - for each route, runs
    `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --virtual-time-budget=4000 --dump-dom http://localhost:8765/<route>`
  - parses the dump with regexes.

  Assertions:
  - **`#/topic/bsd-estimation`:**
    - at least 10 `<details class="qa-block qa-reveal"`
    - no `open` attribute on them
  - **`#/revise`:**
    - the `bsd-estimation` card exists
    - its self-test count equals its `interview-qa` question count
  - **`#/plan`:**
    - exactly 40 `class="plan-day`
    - the first `data-day="2026-11-06"`, the last `data-day="2026-12-15"`
    - no `class="plan-link" href="#/topic/X"` where X is not a registered id
    - `class="plan-soon"` is present (later-slice topics)

- [ ] **Step 2: Run it and confirm it fails**

  Run: `node scratchpad/check-ui.mjs`
  Expected: FAIL on `plan-soon` missing (the plan isn't reworked yet; Task 4 makes it pass).
  The estimation checks pass after Task 2.

- [ ] **Step 3: Implement**

  **CSS:**
  - `.qa-reveal > summary`: a `.qa-question` look, `cursor:pointer`, `list-style:none`, and a
    "Show answer" chevron through `::after` that rotates on `[open]`.
  - `.qa-reveal:not([open]) > .qa-answer`: hidden.
  - `.plan-soon`: muted colour with a dotted underline.
  - Use theme tokens only, so dark mode works automatically.

  **`questionsOf`:**
  - Keep the existing logic.
  - Append questions from `findSec(topic, ['drill-down'])`, selecting
    `.qa-ladder-start .qa-question` with the same cleanup and filter.

  **`T`:** use `topicsById[id]` to decide whether to link or render "soon".

- [ ] **Step 4: Check the theme by eye**

  Screenshot `#/topic/bsd-estimation` with `?theme=dark`, or with the theme set in
  `localStorage` (`prep:theme`). Then click one reveal block. Expected: answers are hidden, and
  shown with readable contrast after the click. The search index still finds text inside an
  answer: `⌘K`, then type a phrase from the answer.

### Task 4: Study Plan rework

**Files:**
- Modify: `scripts/app.js`, `renderPlan()` `DATA` phases `p4` through `p6` (around lines
  858–878) and the row renderer (around lines 885–896)

**Interfaces:**
- Consumes: `T(id, label)` with the "soon" fallback from Task 3, and the `Drill 1–14` headings
  from Task 2.

- [ ] **Step 1: Check the test**

  `check-ui.mjs` from Task 3 already asserts the plan shape. Add these assertions:
  - The text `Drill 1` appears on the `2026-11-12` row.
  - The text `Stretch` appears in Phase 6.
  - `sd-framework` is linked inside Phase 5.

- [ ] **Step 2: Replace `p4` with 9 rows, in this order** (left column | right column)

  1. `bsd-estimation` · `bsd-framework` | `<b>Drill:</b> 3 worked drills from memory, then check the math`
  2. Building blocks: partitioning · replication · consistency · consensus | `<b>DSA:</b> Graphs — topological sort / union-find — 4 problems`
  3. Building blocks: storage · transactions · probabilistic · edge | `<b>DSA:</b> Dynamic Programming (1D) — 4 problems`
  4. Cases: url-shortener · rate-limiter | `<b>Practice:</b> redo one drill-down ladder out loud`
  5. Cases: news-feed · chat | same right column as row 4
  6. Cases: notifications · payments | same
  7. Cases: kv-store · ticket-booking | same
  8. Cases: video-streaming · ride-dispatch | same
  9. `lld-framework` · `lld-patterns` · `lld-lru-cache` · `lld-rate-limiter` | `<b>Mock #2:</b> one HLD + one LLD round, timed`

  Pass every not-yet-written id with an explicit label, matching the §3 titles of the spec.
  Example: `T('bsd-bb-partitioning', 'Partitioning & Consistent Hashing')`.

- [ ] **Step 3: Replace `p5` with 2 rows**

  1. `<b>FE system design:</b> sd-framework · sd-cases; QR('JavaScript, TypeScript, React')` | `<b>Machine coding:</b> typeahead with debounce, keyboard nav, loading/empty states`
  2. `<b>Full-stack:</b> react-nextjs · js-event-loop · web-security` | `<b>Mock #3:</b> full-stack coding round (API + UI), timed`

- [ ] **Step 4: Add Stretch lines to Phase 6**

  On `p6` rows 1–4, append ` <br><span class="plan-stretch">Stretch:</span> …` to the left
  column:
  - Row 1: counter · file-sync
  - Row 2: autocomplete · web-crawler
  - Row 3: job-scheduler · leaderboard
  - Row 4: `lld-parking-lot` · `lld-booking-system` · `lld-notification`

  Add CSS: `.plan-stretch { font: 600 11px var(--font-mono); text-transform: uppercase; color: var(--text-subtle); }`.

- [ ] **Step 5: Add the daily warm-up in the row renderer**

  For rows whose ISO date is on or after `'2026-11-12'`:
  - set `n = ((dayIndex - 6) % 14) + 1`
  - append to the right column:
    `` ` · <b>Estimation:</b> <a class="plan-link" href="#/topic/bsd-estimation#examples">Drill ${n}</a>` ``

  This is in `app.js` JS, not inside a content template, so `${}` is fine here.

  Also update the plan intro note to mention the daily drill.

- [ ] **Step 6: Verify**

  Run: `node scratchpad/check-ui.mjs && node tools/verify-topics.mjs | tail -1`
  Expected: all checks pass, and `✅ PASS`.

### Task 5: Slice 1 sign-off

- [ ] **Step 1:** Take headless screenshots, light and dark, at 1440 px and 390 px (in an
  iframe):
  - the sidebar showing the new module under Core
  - `#/topic/bsd-estimation`
  - `#/plan`, Phase 4 and the 12 Nov row

  Check that the browser console reports no errors.
- [ ] **Step 2:** Summarise for Prakhar and ask whether to commit and deploy Slice 1. When he
  says yes, push with the `Prakhar5002` credential helper, then confirm the Vercel deployment is
  READY and use `curl` to check that `scripts/content/bsd-estimation.js` returns 200.

---

# Slice 2: Building blocks

### Task 6: Author the 8 `bsd-bb-*` topics

**Files:** Create `scripts/content/bsd-bb-{partitioning,replication,consistency,consensus,storage,transactions,probabilistic,edge}.js`

- [ ] **Step 1:** Dispatch 8 authoring subagents in parallel, one per topic. Each gets the Author
  brief, its §4.2 scope paragraph, and the §3 title.
- [ ] **Step 2:** For each file, run `node --check`. Expected: no output.

### Task 7: Register and verify the building blocks

**Files:** Modify `scripts/content/_index.js` (`backend-sd`) and `index.html`

- [ ] **Step 1:** Insert the 8 topics after `bsd-framework` in §3 order, with the §3 titles. Add
  8 `<script>` tags after `bsd-framework.js`.
- [ ] **Step 2:** Run `node tools/verify-topics.mjs | tail -1`. Expected: `✅ PASS`. The bb
  rules apply now.
- [ ] **Step 3:** Run `node scratchpad/check-ui.mjs`. Expected: PASS, and plan Phase 4 rows 2–3
  now render as `a.plan-link`.
- [ ] **Step 4:** Spot-read 2 topics against the spec §2 anti-goals (depth, decisions, no
  invented precision), then ask Prakhar whether to commit and deploy.

---

# Slice 3: The 10 core cases, and retiring `bsd-cases`

### Task 8: Author the 10 core cases

**Files:** Create `scripts/content/bsd-case-{url-shortener,rate-limiter,news-feed,chat,notifications,payments,kv-store,ticket-booking,video-streaming,ride-dispatch}.js`

- [ ] **Step 1:** Dispatch 10 authoring subagents (at most 5 at a time). Each gets:
  - the Author brief, the §4.3 section map, and the §3 row
  - the matching old case from `bsd-cases.js` (old cases 1–6 and 8; cases 7 onward are new)
  - its LLD twin id where one exists
  - the ladder markup:
    - each ladder opens with `<div class="qa-block qa-ladder-start">`
    - follow-ups are plain `qa-block`s labelled `L2`–`L5` in the question text, so they read in
      sequence on the page
- [ ] **Step 2:** Run `node --check` on every file. Expected: no output.

### Task 9: Register the cases, fold in the cross-case material, retire `bsd-cases`

**Files:**
- Modify: `scripts/content/_index.js`, `index.html`, `scripts/app.js` (`route()` at line 349),
  `scripts/content/bsd-framework.js`, `scripts/content/cloud-serverless-case.js:74`,
  `scripts/content/lld-rate-limiter.js`, `lld-framework.js`, `lld-notification.js`,
  `lld-booking-system.js`, `tools/verify-topics.mjs`
- Delete: `scripts/content/bsd-cases.js`

**Interfaces:**
- Produces: `TOPIC_REDIRECTS = { 'bsd-cases': 'bsd-framework' }` in `app.js`.

- [ ] **Step 1: Write the retirement checks first**

  In the verifier, fail if:
  - the registry contains `bsd-cases`
  - any topic's html contains `#/topic/bsd-cases`
  - `scripts/app.js` doesn't contain `'bsd-cases': 'bsd-framework'`

  In `check-ui.mjs`, assert:
  - `#/topic/bsd-cases` ends on the `bsd-framework` page, i.e. its title is in the dump
  - the home page "studied" totals are unchanged with `prep:studied` containing `"bsd-cases"`
    in localStorage. Inject it with `--user-data-dir` set to a temporary profile, or with a
    `?seed` query that writes localStorage before the app boots (choose one; this is test-only)
  - each case's Quick Revision self-test count equals its interview-qa count plus its
    `qa-ladder-start` count

  Run both. Expected: FAIL.

- [ ] **Step 2: Fold the cross-case material into the framework**

  Add an extra section to `bsd-framework.js`, before `interview-qa`:
  `{ id: 'cross-case', title: '🧩 Cross-Case Patterns', collapsible: true }`.

  Move into it, verbatim, these `<h3>` blocks from `bsd-cases.js`:
  - "The 12 most common mistakes across all cases"
  - the three "Pattern: identify …" blocks
  - "Cross-case patterns to memorize"
  - "Common interview-day reframings"
  - "Final checklist before any system design interview"

  Then add a "Cases" list linking all registered `bsd-case-*` topics.

- [ ] **Step 3: Retire `bsd-cases`**

  - Delete `bsd-cases.js`, plus its registry entry and its script tag.
  - Register the 10 cases after the building blocks, with `<script>` tags.
  - Add `TOPIC_REDIRECTS` and, at the top of `route()`:
    `if (r.name === 'topic' && TOPIC_REDIRECTS[r.topicId]) { location.replace('#/topic/' + TOPIC_REDIRECTS[r.topicId]); return; }`
  - Repoint the `cloud-serverless-case.js:74` and `lld-rate-limiter.js` links to the matching
    case (`bsd-case-rate-limiter`), or to `bsd-framework`.
  - Add a one-line "HLD version: …" link in `lld-rate-limiter`, `lld-notification`,
    `lld-booking-system`, and an "HLD cases" link in `lld-framework`.

- [ ] **Step 4: Verify**

  Run: `node tools/verify-topics.mjs | tail -1 && node scratchpad/check-ui.mjs`
  Expected: `✅ PASS` and all UI checks pass. Phase 4 rows 4–8 are now links.

- [ ] **Step 5: Review distinctness and ask about shipping**

  Spot-read 3 cases against the §4.3 distinctness bar, e.g. compare the deep-dive titles of all
  10 for generic repeats. Then ask Prakhar whether to commit and deploy.

---

# Slice 4: The 6 stretch cases

### Task 10: Author the stretch cases

**Files:** Create `scripts/content/bsd-case-{counter,file-sync,autocomplete,web-crawler,job-scheduler,leaderboard}.js`

- [ ] **Step 1:** Dispatch 6 authors. Use the same brief as Task 8, with old case 7 as starting
  material for `counter`.
- [ ] **Step 2:** Run `node --check` on each file.

### Task 11: Register the stretch cases

- [ ] **Step 1:** Register them after the 10 core cases in §3 order, and add the script tags.
- [ ] **Step 2:** Run `node tools/verify-topics.mjs | tail -1` → `✅ PASS`. Run
  `node scratchpad/check-ui.mjs` → PASS, with no `plan-soon` left in the plan.

### Task 12: Final whole-module check

- [ ] **Step 1:** Run every `check-ui.mjs` assertion, including Review Focus items 2 and 4.
  Then take screenshots of the module in the sidebar, Quick Revision filtered to System Design,
  and one case page, light and dark, at desktop and 390 px.
- [ ] **Step 2:** Check the totals:
  - The verifier reports 258 − 1 + 25 = **282** topics, plus 5 pending career placeholders.
  - The plan header's topic count has grown.
- [ ] **Step 3:** Update the memory file `project_prepsite_revision_rollout.md`, then ask
  Prakhar whether to commit and deploy.
