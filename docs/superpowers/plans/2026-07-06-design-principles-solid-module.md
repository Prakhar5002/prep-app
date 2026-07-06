# Design Principles (SOLID) Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a progressive "Design Principles" notes module teaching the SOLID principles zero→hero — an overview, one topic per principle (S/O/L/I/D), and a capstone — with TypeScript before→after examples.

**Architecture:** Seven vanilla-JS IIFE topic files register via `window.PREP_SITE.registerTopic`; a new `design` module in `_index.js` drives the sidebar. The structural checker (`tools/verify-topics.mjs`) is generalized to validate the `design` module (all seven are teaching topics — no reference topic). Accuracy gated by expert review.

**Tech Stack:** Vanilla ES5/ES6 browser JS in IIFEs on `window.PREP_SITE`; existing Prism (TypeScript highlighting) + theme; Node (ESM, `node:vm`) for the structural checker. No bundler/framework/test runner.

## Global Constraints

From the spec (`docs/superpowers/specs/2026-07-06-design-principles-solid-module-design.md`). Every task implicitly includes these:

- **No build step.** Topic files load via `<script>` tags in `index.html`.
- **Registration pattern.** Each topic is an IIFE calling `window.PREP_SITE.registerTopic({ id, module, title, estimatedReadTime, tags, sections })`. `module: 'design'`.
- **Topic ids (exact) + files:** `design-solid-intro`, `design-srp`, `design-ocp`, `design-lsp`, `design-isp`, `design-dip`, `design-solid-capstone` → files `scripts/content/<id>.js`.
- **Sections:** `{ id, title, html }` (+ `collapsible: false` on the first, `tldr`). Every teaching topic MUST include the six section ids `tldr` (collapsible:false), `what-why`, `mental-model`, `mechanics`, `examples`, `interview-patterns`. Extra sections allowed (the intro/capstone add a `<table>` summary — either inside `mechanics` or as an extra section).
- **Examples:** TypeScript, **before→after** (a real violation/smell, then the fix), frontend-flavored (service/repository/notifier/strategy scenarios — NOT Java-textbook Animals/Shapes). Code in `<pre><code class="language-typescript">…</code></pre>`; inline `<code>`; tables via `<table>`.
- **HTML-safety:** TypeScript generics and JSX-like tokens (`Array<T>`, `Repository<User>`, `<Provider>`) MUST be escaped `&lt;…&gt;` in the trusted-HTML fields, or the browser swallows them.
- **Accuracy traps to respect (per spec §6):** SRP = "one reason to change / one actor," NOT "one method." LSP contract: subtypes may **weaken preconditions**, **strengthen postconditions**, must **preserve invariants**, and must not throw new exceptions the base doesn't. DIP (principle: depend on abstractions) is distinct from Dependency Injection (a technique that satisfies it). Attribution: Robert C. Martin (principles), Barbara Liskov (LSP), Michael Feathers (the SOLID acronym). No strawman befores or over-engineered afters. Cover the YAGNI / when-not-to-apply tension (intro + capstone).
- **No auto-commit / no auto-build.** Never run `git commit`/`git push`/build. End each task at verification; user commits manually on request.

---

## File Structure

**Modify:**
- `scripts/content/_index.js` — add the `design` module to `registry.modules`.
- `index.html` — add 7 `design-*.js` `<script>` tags (before `scripts/app.js`).
- `tools/verify-topics.mjs` — add `'design'` to target modules; add the 7 design topics to the full-section set.

**Create:** the 7 `scripts/content/design-*.js` files listed above.

---

### Task 1: Add the design module + generalize the checker

**Files:**
- Modify: `scripts/content/_index.js`, `tools/verify-topics.mjs`

**Interfaces:**
- Produces: `design` registry module (7 topics); `node tools/verify-topics.mjs` validates redux + git + linux + eh + design, all as teaching topics.

- [ ] **Step 1: Add the module to `_index.js`**

Add to `registry.modules` (placement: near the software-craft modules, e.g. after the `machine-coding` module; exact position is not load-bearing):
```js
    {
      id: "design",
      title: "Design Principles",
      topics: [
        { id: "design-solid-intro",    title: "SOLID: Overview & Why" },
        { id: "design-srp",            title: "S · Single Responsibility" },
        { id: "design-ocp",            title: "O · Open/Closed" },
        { id: "design-lsp",            title: "L · Liskov Substitution" },
        { id: "design-isp",            title: "I · Interface Segregation" },
        { id: "design-dip",            title: "D · Dependency Inversion" },
        { id: "design-solid-capstone", title: "Putting SOLID Together" },
      ],
    },
```

- [ ] **Step 2: Generalize `tools/verify-topics.mjs`**

Read the current file (it validates redux/git/linux/eh). Make two edits:

(a) Add `'design'` to `TARGET_MODULES`:
```js
const TARGET_MODULES = ['redux', 'git', 'linux', 'eh', 'design'];
```
(b) Add the 7 design topics to `NEW_TOPICS` (all seven are teaching topics; do NOT touch `REFERENCE_TOPICS`):
```js
  'design-solid-intro', 'design-srp', 'design-ocp', 'design-lsp',
  'design-isp', 'design-dip', 'design-solid-capstone',
```
(add these entries inside the existing `new Set([...])` literal alongside the existing ids).

- [ ] **Step 3: Run the checker**

Run: `node tools/verify-topics.mjs`
Expected: `[redux]`, `[git]`, `[linux]`, `[eh]` blocks unchanged; a new `[design]` block where all 7 design topics show `… not registered yet (pending)`; overall `✅ PASS`.

- [ ] **Step 4: Syntax-check**

Run: `node --check scripts/content/_index.js && node --check tools/verify-topics.mjs`
Expected: exit 0.

**Deliverable:** design module registered (7 "coming soon" topics) + checker validates it. No commit.

---

### Task 2: `design-solid-intro` + `design-srp` + wiring (the slice)

**Files:**
- Create: `scripts/content/design-solid-intro.js`, `scripts/content/design-srp.js`
- Modify: `index.html`

- [ ] **Step 1: Author `design-solid-intro.js`**

Create the file as an IIFE. Look at `scripts/content/git-fundamentals.js` or `scripts/content/eh-foundations.js` for house style/tone (sibling "topic 1"s). Skeleton:
```js
window.PREP_SITE.registerTopic({
  id: 'design-solid-intro', module: 'design', title: 'SOLID: Overview & Why',
  estimatedReadTime: '16 min', tags: ['design','solid','oop','clean-code','principles'],
  sections: [
    { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `…` },
    { id: 'what-why', title: '🧠 What & Why', html: `…` },
    { id: 'mental-model', title: '🗺️ Mental Model', html: `…` },
    { id: 'mechanics', title: '⚙️ The Five, and the Smells They Fix', html: `…` },
    { id: 'examples', title: '🧪 A Taste (before → after)', html: `…` },
    { id: 'interview-patterns', title: '🎤 Interview Patterns', html: `…` },
  ],
});
```
Content outline (per spec §5.1):
- **TL;DR:** SOLID = five OO design guidelines (not laws) for maintainable/flexible/testable code; the S-O-L-I-D mnemonic with a one-line statement of each; this module goes zero→hero, one topic per principle.
- **What & Why:** who (Robert C. Martin coined/popularized the principles; Michael Feathers arranged the SOLID acronym); the problem SOLID addresses — the smells of bad OO design: **rigidity** (hard to change), **fragility** (changes break unrelated code), **immobility** (hard to reuse), plus needless complexity/repetition.
- **Mental Model:** a quick OOP refresher used throughout — class, interface, polymorphism, abstraction, composition — pitched so a reader shaky on OOP can follow. Frame SOLID as "design so that the change you'll actually make is easy."
- **The Five, and the Smells They Fix:** a `<table>` — principle · one-line rule · primary smell it fixes (SRP/one reason to change/god class; OCP/extend not modify/switch-on-type; LSP/substitutability/broken subtype; ISP/small interfaces/fat interface; DIP/depend on abstractions/`new` inside a class). Then the **when NOT to over-apply** note: YAGNI tension, premature abstraction, the cost of indirection.
- **A Taste:** one small TypeScript before→after (e.g. a `switch`-on-type pricing function → a polymorphic strategy) to show the flavor; escape any generics as `&lt;…&gt;`.
- **Interview Patterns:** "what does SOLID stand for + one line each?", "why do these principles exist / what problems do they prevent?", "when might applying SOLID be a mistake?".

- [ ] **Step 2: Author `design-srp.js`**

Create the file with the same skeleton (`id: 'design-srp'`, `module: 'design'`, title `'S · Single Responsibility'`, tags `['design','solid','oop','srp','clean-code']`). Content (per spec §5.2):
- **TL;DR:** "A class should have one reason to change"; modern framing: responsible to **one actor/stakeholder**. Not "one method."
- **What & Why:** cohesion vs coupling; why mixing responsibilities causes shotgun-surgery and fragile code.
- **Mental Model:** "one reason to change" = one axis of change / one stakeholder; describe the class in a sentence — if you need "and," it's doing too much.
- **Mechanics:** how to spot violations (persistence + business logic + presentation in one class; "and" in the name/description); the fix = extract collaborators.
- **Examples:** before→after in TypeScript — a god `UserService` doing DB save + email + row formatting → split into `UserRepository`, `Mailer`, `UserRowView`, with `UserService` orchestrating. Show both.
- **Interview Patterns:** "what does SRP actually mean (and the 'one method' misconception)?", "how do you recognize an SRP violation?", "SRP vs separation of concerns?".

- [ ] **Step 3: Wire the script tags**

In `index.html`, add among the content `<script>` tags (before `scripts/app.js`):
```html
<script src="scripts/content/design-solid-intro.js"></script>
<script src="scripts/content/design-srp.js"></script>
```

- [ ] **Step 4: Structural check**

Run: `node tools/verify-topics.mjs`
Expected: in `[design]`, `✓ design-solid-intro: N sections` and `✓ design-srp: N sections`, the other 5 still `… pending`, overall `✅ PASS`. Fix any `✗`. Then `node --check` both files; `grep -c 'design-solid-intro.js\|design-srp.js' index.html` → 2; `grep -noE '<[A-Za-z]+>' scripts/content/design-solid-intro.js scripts/content/design-srp.js` returns no raw TS generic/JSX tokens (must be `&lt;…&gt;`).

- [ ] **Step 5: Manual browser verification**

Open `index.html`. Verify: the **Design Principles** module appears with **SOLID: Overview & Why** first, then **S · Single Responsibility** (others "coming soon"); both topics render all sections incl. the summary table and TypeScript before→after code (highlighted, with Copy); generics show literally; both themes fine; Prev/Next present.

**Deliverable:** design module + first two topics live end-to-end. **STOP for user review of depth + the TypeScript before→after style before authoring the rest.** No commit.

---

### Tasks 3–6: Remaining principle topics

Each task creates one `scripts/content/design-<suffix>.js` using the same skeleton as Task 2 (its own id/title/tags, the six required sections), authoring each section per the outline below, then adds its `<script>` tag to `index.html`, runs `node tools/verify-topics.mjs` (its topic `✓`; overall `✅ PASS`), `node --check`s the file, and confirms no raw generic/JSX tokens (`grep -noE '<[A-Za-z]+>' <file>`). No commit. Code in `<pre><code class="language-typescript">`; match the intro/SRP style; **before→after, no strawman befores or over-engineered afters; respect the accuracy traps** (Global Constraints).

### Task 3: `design-ocp.js` — "O · Open/Closed"
Statement: open for extension, closed for modification. Mechanism: polymorphism / the **Strategy** pattern; program to an abstraction. How to spot: a `switch (type)`/`if-else` chain you must edit for every new case. Before→after: a discount/shape/payment `switch` that grows with every type → a common interface with one class per case; adding a case = adding a class, editing nothing. Caveat: apply OCP to the axis that actually varies, not every axis (YAGNI).

### Task 4: `design-lsp.js` — "L · Liskov Substitution"
Statement: subtypes must be substitutable for their base without breaking correctness (Barbara Liskov). State the behavioral-subtyping **contract rules** correctly: weaken preconditions, strengthen postconditions, preserve invariants, don't throw new exceptions. Examples: the classic **Rectangle/Square** violation (`setWidth`/`setHeight` break a Rectangle invariant) and *why* it's an LSP break; then a cleaner real example (e.g. `ReadOnlyList` can't substitute a mutable `List`; a `Penguin` that can't `fly()`). Show how the violation forces callers into `instanceof` special-casing — silently breaking OCP.

### Task 5: `design-isp.js` — "I · Interface Segregation"
Statement: clients should not be forced to depend on methods they don't use; prefer many small **role interfaces** over one fat interface. How to spot: implementers throwing `NotImplemented`/stubbing unused methods. Before→after: a fat `IMachine { print(); scan(); fax(); }` forcing a simple printer to stub `scan`/`fax` → split into `IPrinter`/`IScanner`/`IFax`, each class composing only what it needs. Note ISP is the consumer's view; a fat interface often signals an SRP violation in the class behind it. Escape interface generics as `&lt;…&gt;`.

### Task 6: `design-dip.js` — "D · Dependency Inversion"
Statement: high-level modules shouldn't depend on low-level modules; both depend on abstractions; abstractions don't depend on details, details depend on abstractions. **Keep DIP (principle) distinct from Dependency Injection (technique).** Before→after: a high-level `OrderService` that `new`s a concrete `StripeClient` (rigid, untestable) → depends on a `PaymentGateway` interface injected via the constructor; a `StripeGateway implements PaymentGateway`; a test injects a fake gateway. Headline the testability/mocking payoff, and explain the "inversion" (the low-level detail now conforms to an abstraction owned by the high-level policy).

---

### Task 7: `design-solid-capstone.js` — "Putting SOLID Together" (built last)

**Files:**
- Create: `scripts/content/design-solid-capstone.js`
- Modify: `index.html`

- [ ] **Step 1: Author the capstone**

Create `scripts/content/design-solid-capstone.js` (`id: 'design-solid-capstone'`, `module: 'design'`, title `'Putting SOLID Together'`, tags `['design','solid','oop','patterns','clean-code']`), with the six required sections. Content (per spec §5.7):
- **TL;DR:** the principles are one toolkit, not five silos; learn to combine them and to know when to stop.
- **What & Why:** why "knowing each principle" isn't enough — real code needs judgment about which to apply and when.
- **Mental Model:** how the principles interrelate (a `<table>` or diagram) — LSP makes OCP's polymorphism *safe*; ISP + DIP pair (depend on small abstractions); SRP underlies ISP (small responsibilities → small interfaces).
- **Mechanics:** a **smell → principle** `<table>` (shotgun surgery → SRP/OCP; switch-on-type → OCP; subtype needs `instanceof` → LSP; stubbed interface methods → ISP; `new` inside a class → DIP); the **criticisms & limits** (over-engineering/indirection, YAGNI tension, SOLID is OO-centric while FP composes differently) — presented honestly; the **mapping to design patterns** (OCP↔Strategy, DIP↔Factory/DI containers, ISP↔role interfaces/Adapter, plus Observer/Template Method).
- **Examples:** a single multi-principle TypeScript **refactor** touching several principles at once (e.g. a notification sender: extract responsibilities (SRP), depend on a `Channel` interface (DIP/ISP), add channels without editing (OCP), substitutable channels (LSP)). Show before and after.
- **Interview Patterns:** a consolidated Q&A roundup (relationships between principles; "which principle does this smell violate?"; "is SOLID always worth it?").

- [ ] **Step 2: Wire the script tag**

Add to `index.html` (before `scripts/app.js`): `<script src="scripts/content/design-solid-capstone.js"></script>`.

- [ ] **Step 3: Structural check**

Run: `node tools/verify-topics.mjs`
Expected: `✓ design-solid-capstone: N sections`, all 7 design topics `✓`, overall `✅ PASS`. Then `node --check scripts/content/design-solid-capstone.js`; `grep -noE '<[A-Za-z]+>' scripts/content/design-solid-capstone.js` shows no raw generic/JSX tokens.

**Deliverable:** the capstone tying SOLID together. No commit.

---

### Task 8: Final structural check + review pass

**Files:** none (verification only).

- [ ] **Step 1: Full structural check**

Run: `node tools/verify-topics.mjs`
Expected: `[design]` block shows all 7 topics `✓`; `[redux]`/`[git]`/`[linux]`/`[eh]` unchanged; overall `✅ PASS`.

- [ ] **Step 2: Confirm files parse + tags wired + tokens escaped**

Run: `for f in scripts/content/design-*.js; do node --check "$f" || echo "FAIL $f"; done` (expect no FAIL). `grep -c 'scripts/content/design-' index.html` (expect 7). `grep -rnoE '<[A-Za-z][A-Za-z0-9]*>' scripts/content/design-*.js` and confirm every hit is a real HTML tag (`<p>`, `<code>`, `<td>`, …) — no raw TS generic/JSX tokens like `<T>`/`<User>`/`<Provider>` leaked.

- [ ] **Step 3: Final manual browser pass**

Open the site: the **Design Principles** module lists all 7 topics in order (overview → S → O → L → I → D → capstone); each renders (before→after TypeScript highlights, summary tables render); Prev/Next threads them; both themes fine; search finds the new topics. Confirm no existing module regressed.

**Deliverable:** complete 7-topic Design Principles module, structurally valid and wired. Accuracy separately gated by the expert-review step in execution. No commit.

---

## Self-Review

**Spec coverage:**
- §3 Architecture (module, 7 topic files, script tags, generalized checker) → Tasks 1, 2, 3–6, 7, 8. ✓
- §4 Registration shape (module 'design', six required sections, TS before→after, escape generics) → Task 1 checker enforces; Tasks 2–7 author. ✓
- §5 Topic outlines (7 topics) → Tasks 2 (intro+SRP), 3 (OCP), 4 (LSP), 5 (ISP), 6 (DIP), 7 (capstone). ✓
- §6 Correctness (accuracy traps: SRP/LSP/DIP-vs-DI, attributions, no strawmen; structural check; expert review) → Global Constraints trap list; Task 1 checker; accuracy via SDD review. ✓
- §7 Rollout (module + intro+SRP slice first, STOP, then O/L/I/D, capstone last, final) → Task ordering + explicit STOP at Task 2 + capstone at Task 7. ✓
- §8 Risks (wrong statements, strawman examples, HTML-safety, over-abstraction messaging, checker) → Global Constraints + Task 3–7 outlines + Task 8 grep + intro/capstone YAGNI coverage. ✓

**Placeholder scan:** Content tasks carry per-topic outlines (the "what to cover"), not "TODO"; prose/code authored during execution + gated by structural-check + expert review; `…` in skeletons are author-fill markers. Infrastructure (checker edits, registry entry) shown in full. No "handle errors / similar to Task N" placeholders in code steps.

**Type consistency:** Topic ids, `module: 'design'`, the `NEW_TOPICS` additions in the checker, the six required section ids, and the `registerTopic` fields are used identically across Task 1 (checker + registry) and Tasks 2–7. File names match ids. All seven are teaching topics (no reference topic), so the existing teaching-section rule applies unchanged — consistent with Task 1's checker edit.

**Deviation note:** Standard TDD "commit each task" + execution tests are replaced by (a) the Node structural checker and (b) expert accuracy review, because topics are prose/illustrative code (no runnable output) and per project rules must not auto-commit/build.
