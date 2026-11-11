# DSA in Plain English Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite all 16 DSA topics in simple English with simple code, keeping every interview
item, and add a `dsa-words` glossary topic. A sample (glossary + Sliding Window) is approved by
Prakhar first.

**Architecture:** This is a content rewrite of existing topic files, in place: same ids, same
7 sections. Tooling built in the plan's workspace (not committed):
- an inventory extractor (what today's topic covers)
- a code-block runner (does the example code actually run)

The committed verifier gains `dsa-*` rules that apply only to topics already rewritten.

**Tech Stack:** Vanilla JS content files, Node ≥ 18 (`node --check`, `vm`), headless Chrome for
render checks.

**Spec:** `docs/superpowers/specs/2026-11-11-dsa-plain-english-design.md` (approved). §4 is the
writing standard every author follows.

## Global Constraints

- Same ids and the same 7 sections: `revision` (first, `collapsible:false`, 4-part card),
  `what-why`, `mental-model`, `mechanics`, `examples`, `pitfalls`, `interview-qa`. Existing extra
  sections may stay, rewritten to the same standard.
- `html` is a template literal: **no backticks and no `${`** in authored HTML; escape `<` `>` `&`
  in code.
- Every DSA term is explained at first use in a topic and linked to
  `#/topic/dsa-words#w-<slug>`.
- Code: `language-js`, descriptive names, one declaration per line, no `(x || 0) + 1` inside
  calls, no chained ternaries, no comma operators, no placeholder stubs, and a comment on every
  non-obvious line. Code must run.
- `mental-model` contains at least one step-by-step trace in `<div class="diagram"><pre>`.
- Nothing from today's version is lost (coverage map, spec §6).
- The Study Plan is untouched.
- **Never commit, push or deploy** unless Prakhar asks.
- **Shared files** (`scripts/content/_index.js`, `index.html`, `tools/verify-topics.mjs`) are
  also being edited by the Backend SD build. Change only the `dsa` module entry, the DSA script
  tags, and a clearly labelled `// ---- DSA plain-English rules ----` block.

## Review Focus

1. **A "simplified" statement that is now false.** Example: Big-O stated wrongly, or an edge
   case "fixed" incorrectly. Expected: the reviewer catches it. Test: the per-topic review
   rubric in Tasks 3, 5 and 6 (correctness pass plus the code runner).
2. **Example code that doesn't run** after renaming variables. Test: `run-code-blocks.mjs` in
   every topic task, with zero failures.
3. **A trace that disagrees with the code,** for example the window moving differently than
   the code moves it. Test: the reviewer re-runs the trace input through the code block (Tasks
   3, 5 and 6 rubric).
4. **A glossary link to an entry that doesn't exist** (`#w-…`). Expected: the verifier fails.
   Test: Task 1, step 1 rule.
5. **The verifier's `dsa-*` rules firing on topics that aren't rewritten yet** and blocking the
   other build. Expected: the rules apply only to ids in `DSA_REWRITTEN`. Test: Task 1, step 2
   (PASS with an empty set).

---

### Task 1: Tooling, backup and verifier rules

**Files:**
- Create (workspace, not committed): `<ws>/inventory.mjs`, `<ws>/run-code-blocks.mjs`,
  `<ws>/dsa-backup/` (a copy of the 16 `scripts/content/dsa-*.js` files)
- Modify: `tools/verify-topics.mjs`, adding the labelled DSA block

`<ws>` is this plan's SDD workspace (`.superpowers/sdd/2026-11-11-dsa-plain-english/`).

**Interfaces:**
- **Produces `node <ws>/inventory.mjs <topic-id>`:**
  - writes `<ws>/inventory/<id>.json` = `{ headings: string[], questions: string[], problems: string[], pitfalls: string[] }`
  - `headings`: `<h3>`/`<h4>` text
  - `questions`: `.qa-question` / `.qa-q` text
  - `problems`: `<h3>` text inside `examples`
  - `pitfalls`: `<li>` and `<h3>` text inside `pitfalls`
  - always reads from `<ws>/dsa-backup/` (the original), never the live file
- **Produces `node <ws>/run-code-blocks.mjs <topic-id>`:**
  - extracts every `<pre><code class="language-js">` block from the live topic
  - decodes `&lt; &gt; &amp; &quot; &#39;`
  - runs each block in a fresh `vm` context with `console` stubbed and a 2-second timeout
  - prints `block N: ok` or `block N: <error>`
  - exits 1 if any block throws
- **Produces `DSA_REWRITTEN`:** a `Set` of ids in the verifier. Later tasks add ids to it.

- [ ] **Step 1: Add the verifier rules (labelled block)**

  The rules apply to ids in `DSA_REWRITTEN`:
  - `mental-model` html matches `/class="diagram"/`.
  - **No multi-declare line:** within `<pre><code class="language-js">…</code></pre>` blocks, no
    line matches `/^\s*(let|const|var)\s+[\w$]+\s*=[^;]*,\s*[\w$]+\s*=/`.
  - **No inline defaulting:** within the same code blocks, nothing matches `/\|\|\s*0\)\s*[+-]/`.

  Plus one global rule:
  - Every `href="#/topic/dsa-words#(w-[\w-]+)"` in any topic must match an `id="…"` present in
    `dsa-words`'s html. This applies once `dsa-words` is registered.

- [ ] **Step 2: Run the verifier with `DSA_REWRITTEN` empty**

  Run: `node tools/verify-topics.mjs | tail -1`
  Expected: `✅ PASS`, with no change in outcome for current files.

  Then temporarily add `'dsa-sliding-window'` to the set and confirm the rule FAILS on today's
  file (it uses `let l = 0, count = new Map(), …`). Remove it again.

- [ ] **Step 3: Write the workspace tools, then run them on the original file**

  Run: `node <ws>/inventory.mjs dsa-sliding-window && node <ws>/run-code-blocks.mjs dsa-sliding-window`

  Expected:
  - The inventory JSON has 15 or more questions.
  - The runner reports per-block results.
  - Any failures on today's file (for example the `/* initial */` placeholder template) are
    listed. Record them; they prove the runner catches stubs.

### Task 2: Author `dsa-words` (sample, part 1)

**Files:**
- Create: `scripts/content/dsa-words.js`
- Modify:
  - `scripts/content/_index.js`: add `{ id: "dsa-words", title: "DSA Words in Plain English" }`
    first in the `dsa` module
  - `index.html`: a `<script>` tag before the first `dsa-*.js` tag
  - verifier: add `'dsa-words'` to `DSA_REWRITTEN`

**Interfaces:**
- **Produces:** every glossary entry as `<h3 id="w-<slug>">`, with lowercase hyphenated slugs.
  Topics link to `#/topic/dsa-words#w-<slug>`.
- Writes `<ws>/dsa-words-slugs.txt`, a list of every slug, so later authors know the valid
  targets.

- [ ] **Step 1: Collect the term list**

  Scan the 16 backup files for the spec §5 terms plus any other DSA jargon they use, and write
  `<ws>/terms.txt`.

- [ ] **Step 2: Dispatch the author**

  The brief: spec §4 and §5, the term list, and the Global Constraints. Entries are grouped by
  family, each with a meaning, an analogy, a tiny example, and "you'll meet it in" links (topic
  level, e.g. `#/topic/dsa-trees`).

- [ ] **Step 3: Verify**

  Run: `node --check scripts/content/dsa-words.js && node <ws>/run-code-blocks.mjs dsa-words && node tools/verify-topics.mjs | tail -1`
  Expected: no errors, all blocks `ok`, and `✅ PASS`.

### Task 3: Rewrite `dsa-sliding-window` (sample, part 2)

**Files:**
- Modify: `scripts/content/dsa-sliding-window.js` (full rewrite)
- Create (workspace): `<ws>/coverage/dsa-sliding-window.md`

**Interfaces:**
- **Consumes:** `<ws>/inventory/dsa-sliding-window.json` and `<ws>/dsa-words-slugs.txt`.
- **Coverage map format:** one row per inventory item, `| item | new location (section › heading) | note |`.
  The note is `kept`, `merged into …` or `dropped: <reason>`.

- [ ] **Step 1: Add the id to `DSA_REWRITTEN`, run the verifier, and confirm it fails** on the
  old file.
- [ ] **Step 2: Dispatch the author**

  The brief:
  - spec §4 in full: teaching order, words, code, analogies
  - the inventory and slug list
  - the backup file, as the source of truth for *what* to cover
  - the Global Constraints

  The author also writes the coverage map.
- [ ] **Step 3: Verify**

  Run: `node --check scripts/content/dsa-sliding-window.js && node <ws>/run-code-blocks.mjs dsa-sliding-window && node tools/verify-topics.mjs | tail -1`
  Expected: all blocks `ok`, and `✅ PASS`.
- [ ] **Step 4: Review rubric** (used by the task reviewer, and reused in Tasks 5 and 6)
  1. **Coverage:** every inventory item is in the coverage map, and every "kept" item really
     exists at the stated location. Spot-check 10.
  2. **Simplicity:**
     - no undefined jargon in the first 2 sections
     - the code follows the §4.3 rules
     - at least one trace
     - the analogy is tied back to the data
  3. **Correctness:**
     - Big-O claims are right
     - for 2 traces, run the trace input through the matching code block and compare the results
- [ ] **Step 5: Render check**

  Take headless screenshots of `#/topic/dsa-words` and `#/topic/dsa-sliding-window`, in light and
  dark, at 1440 px and at 390 px. There must be no console errors.

### Task 4: Sample gate (STOP for Prakhar)

- [ ] **Step 1: Ask Prakhar to read the sample**

  Ask him to read the sample in a local preview. Start `python3 -m http.server 8765` in
  Prep-Site and give him `http://localhost:8765/#/topic/dsa-sliding-window`.

  Also give him a 3-line before/after excerpt (old opening vs new opening) in chat.
- [ ] **Step 2: Record his feedback**

  Add it to spec §4 as a new subsection, "4.5 Sample feedback (Prakhar, <date>)". If he asks
  for changes, re-dispatch the Task 3 author with the feedback and repeat this gate.

  **No further DSA authoring until he approves.**

### Task 5: Batch A: complexity and the topics already reached

**Topics:** `dsa-complexity`, `dsa-arrays-strings`, `dsa-hashing`, `dsa-two-pointers`,
`dsa-stack-queue`, `dsa-linked-list`.

- [ ] **Step 1:** For each topic:
  - run `inventory.mjs`
  - add the id to `DSA_REWRITTEN`
  - confirm the verifier fails on the old file
- [ ] **Step 2:** Dispatch one author per topic, at most 3 in parallel. Each brief is the same as
  Task 3 step 2, plus spec §4.5 (the sample feedback) and the approved sample as the voice
  reference (`scripts/content/dsa-sliding-window.js`).
- [ ] **Step 3:** For each topic, run
  `node --check …`, `run-code-blocks.mjs <id>` and `node tools/verify-topics.mjs | tail -1`.
  Expected: all `ok`, and `✅ PASS`.
- [ ] **Step 4:** Review each topic with the Task 3 step 4 rubric, then do a render spot-check of
  2 topics. Ask Prakhar whether to commit and deploy Batch A, together with the sample.

### Task 6: Batches B and C: the remaining topics

**Batch B:** `dsa-binary-search`, `dsa-trees`, `dsa-heaps`, `dsa-graphs`, `dsa-dp`.
**Batch C:** `dsa-greedy`, `dsa-backtracking`, `dsa-trie`, `dsa-bit`.

- [ ] **Step 1:** Run Batch B through the same steps as Task 5 steps 1–4. Ask Prakhar whether to
  commit and deploy.
- [ ] **Step 2:** Run Batch C the same way. For `dsa-bit`, bit operators are allowed but must be
  explained per spec §4.3.
- [ ] **Step 3:** Final module check:
  - `DSA_REWRITTEN` contains all 17 ids
  - the verifier passes
  - Quick Revision, filtered to DSA, renders 17 cards
  - no `dsa-words#w-` dead links
- [ ] **Step 4:** Delete `<ws>/dsa-backup/` only after Prakhar has approved the whole rewrite.
  Update the memory file `project_prepsite_revision_rollout.md`.
