# DSA in Plain English: design

Date: 2026-11-11 · Status: draft, for Prakhar's review · Site: Prep-Site (`prepv1.vercel.app`)

## 1. Intent

Prakhar avoids reading the DSA module, and the problem is not one topic: **all 16 topics** have
it. They are written for someone who already understands DSA.

- Jargon is never defined: indices, O(n), subarray, invariant, monotonic, amortized,
  sentinel, Floyd's.
- The pattern comes before the problem.
- There are no pictures of the data changing.
- The code is compressed: `l`/`r`, `(m.get(x) || 0) + 1`, several declarations on one line,
  and `/* sentinel */` placeholder templates.

In his words: *"If I don't understand the concepts/words/meanings then how can I learn this."*

What made other technical topics click for him was **real examples and simple analogies**.

**Starting point (confirmed by Prakhar):** he is comfortable with everyday JavaScript (loops,
arrays, objects, functions). **Everything DSA-specific must be taught from scratch:** Big-O,
pointers, recursion, trees, graphs, DP, and so on.

**Success:**
- He opens any DSA topic and can follow it start to finish without looking anything up.
- He comes away able to explain the idea in his own words, and to solve and explain the
  classic interview problems for that pattern.

## 2. Goals / non-goals / anti-goals

**Goals**
- Rewrite **all 16 DSA topics** in simple English, with simple code, end to end. This includes
  the Revision card and the Interview Q&A.
- Add **one new topic, "DSA Words in Plain English"** (`dsa-words`), first in the DSA module.
- **Keep the interview depth:** every pattern, problem, edge case and interview question in
  today's version is still covered, explained simply.

**Non-goals**
- Other modules are not rewritten. Plain English may become a site-wide standard later, but
  that is a separate decision.
- No new UI features. Everything uses existing content markup: callouts, `div.diagram`,
  tables, `.qa-block`, revision card.
- The Study Plan stays unchanged. Its DSA lines are plain text ("DSA: Arrays & Strings + Hashing
  — 4 problems"), not topic links, so nothing there depends on the rewrite.

**Anti-goals** (failure even if it technically works)
- **Dumbing down:** dropping patterns, problems or edge cases to make it shorter. Simpler words,
  same knowledge.
- **Jargon left in disguise:** a term like "monotonic" or "amortized" used before it's
  explained, or explained only with other jargon.
- **Analogy without the real thing:** a cute analogy that never connects back to the actual
  array or code.
- **"Simple" code that is still clever:** chained ternaries, `||` defaulting inside
  expressions, reduce one-liners, unexplained helper templates.
- **Wrong content:** a simplification that makes a statement false. Big-O claims, edge-case
  behaviour and code must stay correct.

## 3. Topic list and order

The registry order of the `dsa` module becomes:

| # | id | Title |
|---|----|-------|
| 1 | `dsa-words` | **DSA Words in Plain English** (NEW) |
| 2–17 | existing 16 ids, unchanged | existing titles (simplifying a title is allowed) |

**Rewrite order (delivery order):**
1. `dsa-words`
2. `dsa-complexity`, because every other topic leans on Big-O
3. Next, the topics his Study Plan has already reached and he found hard: arrays-strings,
   hashing, two-pointers, sliding-window, stack-queue, linked-list
4. Then the remaining topics in the order the plan reaches them: binary-search, trees, heaps,
   graphs, dp
5. Last, the topics that aren't scheduled in the plan: greedy, backtracking, trie, bit

## 4. Writing rules (the "plain English" standard)

### 4.1 Words
- Short sentences, about 20 words or fewer. Everyday words. Second person ("you") is fine.
- **Every DSA term is explained the first time it appears in a topic,** in words and ideally
  with an analogy. Each one links to its `dsa-words` entry (`#/topic/dsa-words`).
- **Notation always comes with words.** For example, `O(n)` means "the work grows in step with
  the input: twice the items, twice the work". Never leave bare notation unexplained the first
  time.
- Keep technical names (interviewers use them: "Floyd's cycle detection", "Dutch national
  flag"), but introduce each with its plain meaning first.

### 4.2 Teaching order inside a topic
Each topic follows the site's 7-section format:

| Section | What it must do in plain-English form |
|---|---|
| `revision` ⚡ (first, `collapsible:false`) | The 4-part card (`revision-oneline`, Key points `<ul>`, `revision-trap`, `revision-say`), in simple words. It is still the 5-minute pre-interview skim, so keep it short. |
| `what-why` 🧠 | **Analogy** (real-life picture) → **a real problem in plain words** → **the slow way** a beginner would write, and why it's slow (counted in steps, e.g. "for 1,000 items that's about 1,000,000 checks") → what this pattern does about it |
| `mental-model` 🗺️ | **The trick, shown step by step:** at least one **trace** in a `div.diagram`, i.e. a small concrete input (e.g. `[2, 1, 5, 1, 3]`) and its state after each step (where `left`/`right` point, the running total). Then "how to recognise this pattern in a question" in plain words. |
| `mechanics` ⚙️ | The core code template(s) in simple code (§4.3), each followed by a short line-by-line walkthrough. Variants of the pattern are explained one at a time. |
| `examples` 🧪 | The classic interview problems for the pattern. Every problem in today's version must stay. Each one gets: the problem in plain words → the idea → a short trace → simple code → time/space in words. |
| `pitfalls` 🕳️ | Edge cases and Bugs & anti-patterns under `.pitfalls-part` labels. Each item says *what goes wrong*, *a tiny example of it*, and *the fix*. |
| `interview-qa` 🎤 | Every question from today's version, answered in simple English (`.qa-block`). New questions are fine where the rewrite reveals a gap. |

Topic-specific extra sections that exist today (cheat sheets, references) may stay if they are
rewritten to the same standard.

### 4.3 Code
- Plain JavaScript (`language-js`), as today.
- **Descriptive names:** `left`/`right`, not `l`/`r`; `windowSum`, `bestLength`,
  `seenCount`, `node`; `i`/`j` are fine for simple loop counters.
- **One declaration and one idea per line.** No `let a = 0, b = new Map(), c = 0;`.
- **No clever shorthand:**
  - no `(x || 0) + 1` inside a call; read into a named variable first
  - no chained ternaries
  - no `reduce` where a loop reads more clearly
  - no comma operators
  - no bit tricks except in the Bit Manipulation topic, where they are explained
- **A comment on every line that isn't obvious** to someone who knows basic JS but not DSA.
- **No placeholder templates** like `/* sentinel */` or `addToState(...)` stubs. Show a real,
  runnable example instead, and describe the general shape in words.
- Code must be correct. Every example function should run as written in Node if pasted with a
  call.

### 4.4 Analogies and examples
- One main analogy per topic, used consistently and **tied back to the real data**. For
  example: "the viewfinder is the window from `left` to `right`".
- Prefer real-life or real-product examples: sales streaks, playlists, browser history (stack),
  a printer queue, a family tree, a metro map (graph), a dictionary (trie).

### 4.5 Sample feedback (Prakhar, 2026-11-11)

- **Voice approved as is.** The sample (`dsa-words` + `dsa-sliding-window`) is the reference
  for all remaining topics.
- **Interview Q&A repeats the full code** in each answer that needs code, so every Q&A works on
  its own for drilling. Don't replace it with a link to the example.

## 5. The `dsa-words` topic

It uses the same 7-section skeleton. `mechanics` and `examples` hold the glossary itself.

- **Coverage:** every DSA term used anywhere in the 16 topics. The builder collects these by
  scanning the topics. At a minimum:
  - **Basics:** array, index, element, subarray vs subsequence vs substring, in-place
  - **Pointers:** pointer, two pointers, window
  - **Big-O:** what it measures, O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), time vs space
  - **Recursion:** recursion, base case, call stack, memoization
  - **Structures:** hash map/set, stack, queue, deque, linked list, node, tree, binary tree,
    BST, heap, priority queue, trie, graph, edge, vertex, directed/undirected, cycle, DAG
  - **Searches and techniques:** BFS, DFS, topological sort, union-find, greedy, backtracking,
    DP, state, transition
  - **Jargon:** monotonic, invariant, amortized, sentinel, prefix sum, bitmask
- **Each entry** is an `<h3 id="w-<term-slug>">` (e.g. `w-big-o`, `w-two-pointers`), so topics
  can link straight to it with `#/topic/dsa-words#w-<slug>`. *(My call.)* The verifier checks
  that every `dsa-words#w-…` link targets an id that exists.
- **Each entry:** the term → a one-line plain meaning → an everyday analogy → a tiny code or
  data example → "you'll meet it in: <topic links>".
- Grouped by family, with a table of contents.
- The Revision card covers the 10–15 words that unlock everything else.

## 6. Nothing gets lost: the coverage check

The rewrite must keep every pattern, problem, edge case and question.

**Before rewriting a topic:**
- A script extracts an **inventory** from today's file: every `<h3>`/`<h4>` heading, every
  Q&A question, every problem name in `examples`, and every `pitfalls` item.
- The inventory is saved outside the repo: in the build workspace, not committed.

**The author:**
- produces the rewritten file
- produces a **coverage map** giving, for each inventory item, where it lives in the new file or
  why it was merged. For example, "duplicate of X, merged into Y".
- may drop an item only with a reason, such as an exact duplicate. Dropped items are listed for
  review.

**The reviewer checks three things per topic:**
1. **Coverage:** every inventory item is mapped, and no real content was dropped.
2. **Simplicity:** follows §4. Spot-check that undefined jargon is absent, that code follows
   §4.3, and that there is at least one trace in `mental-model`.
3. **Correctness:**
   - Big-O claims are right.
   - **Example code runs:** the reviewer extracts the code blocks and runs them with sample
     inputs in Node.
   - Traces match what the code actually does.

**Safety net:** a backup of today's DSA files is kept outside the repo until the whole rewrite
is approved.

## 7. Integration

- **`scripts/content/_index.js`:** add `{ id: "dsa-words", title: "DSA Words in Plain English" }`
  first in the `dsa` module.
- **`index.html`:** add a `<script>` tag for `dsa-words.js` before the other DSA tags.
- **`tools/verify-topics.mjs`:** must PASS. Add a light, mechanical simplicity check for `dsa-*`
  topics:
  - `mental-model` contains a `class="diagram"` trace
  - no code-block line declares more than one variable with commas
  - no `|| 0) +` pattern inside a call
- **Rendering:** a headless-Chrome check of 2–3 rewritten topics in light and dark, at desktop
  and 390 px, with no console errors.
- **Size (my call):** there is no hard cap. Expect topics to grow from ~40 KB to roughly 60–90 KB,
  because of the extra traces and walkthroughs. That is acceptable: the site already loads every
  topic eagerly, and one extra MB is fine. Don't split topics into new ids; only `dsa-words` is new.
- **Shared files (my call):** the Backend SD build is editing `_index.js`, `index.html` and
  `verify-topics.mjs` in the same working tree. DSA work adds its verifier rules as a separate,
  clearly labelled `dsa-*` block, and touches only the `dsa` module entry and the DSA script
  tags. The coordinator serialises edits to those 3 shared files, so the two builds never write
  them at the same time. If the verifier fails, the failing id tells you which build caused it.
- **Topic ids, section ids and Quick Revision behaviour stay the same.**
- **Style gate (Prakhar's decision, 2026-11-11):** write `dsa-words` and `dsa-sliding-window`
  first, as a **sample**. Prakhar reads it and either approves the voice or gives changes. No
  other DSA topic is authored until he approves. His feedback becomes part of §4 for all the
  remaining topics.
- **Delivery in batches, following §3, after the sample is approved:**
  1. `dsa-words` + complexity
  2. The 6 topics already reached in the plan
  3. The next 5
  4. The last 4

  Each batch is verified on its own. Prakhar decides when to commit and deploy each batch.
- **No commit or deploy until Prakhar asks.**
- This runs alongside the Backend System Design (Deep) build. The two touch different files.
  The only shared files are `_index.js` and `index.html`, edited in different places.

## 8. Calls I made (Prakhar to check)

1. The rewrite **replaces** today's wording in place (same topic ids and sections). It is not a
   separate "beginner" layer, because Prakhar asked for simple English throughout.
2. Interview depth is kept in full, and a coverage check enforces it.
3. A new glossary topic `dsa-words` goes first in the module, and topics link to it.
4. Code stays JavaScript, with the readability rules in §4.3.
5. Delivery order is: glossary + complexity, then topics in Study Plan order, then the
   unscheduled ones.

## 9. Left to the builder

- The choice of analogy for each topic, within §4.4.
- Exact trace inputs, wording, and which extra problems (if any) to add.
- How to split authoring across agents. One author per topic, briefed from this spec, is fine.
- Exact `estimatedReadTime` values.
