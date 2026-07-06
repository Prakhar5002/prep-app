# Design Principles Module (SOLID, Zero → Hero) — Design Spec

**Date:** 2026-07-06
**Status:** Approved design, pending implementation plan
**Repo:** Prep-Site (static, offline-first study site; no build step; vanilla JS via `<script>` tags)

## 1. Goal

Add a progressive **Design Principles** module that teaches the **SOLID** object-oriented
design principles from zero to hero: what they are, why they exist, each principle in depth with
before→after code, how they interrelate, when *not* to over-apply them, and how they map to
common design patterns. Success = a reader with basic OOP knowledge can, after the module,
explain each principle, spot the code smell it fixes, refactor a violation, and answer the
standard interview questions.

## 2. Scope

**In scope**
- A new sidebar **module** ("Design Principles") in `_index.js`, id `design`.
- 7 teaching topic files (files `scripts/content/design-*.js`).
- SOLID overview → one topic per principle (S, O, L, I, D) → a capstone that ties them together.
- Generalizing the structural checker (`tools/verify-topics.mjs`) to validate the `design` module.

**Out of scope**
- No practice-hub challenges (this is notes).
- No new site features (existing topic-rendering pipeline reused).
- Broader design content (DRY/KISS/YAGNI as their own topics, a full design-patterns catalog).
  The module is named "Design Principles" so this can be added later without renaming, but this
  spec covers SOLID only.

## 3. Architecture & Integration

Follow the existing content pattern (same as the Redux / Git / Linux / Ethical Hacking modules).
Each topic is an IIFE calling `window.PREP_SITE.registerTopic({...})`; the module list in
`_index.js` drives sidebar order and Prev/Next.

**Modify**
- `scripts/content/_index.js` — add a new module to `registry.modules`:
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
  }
  ```
  Placement: a judgment call; place it near the other software-craft modules (e.g. after
  `machine-coding`), but exact position is not load-bearing.
- `index.html` — add 7 `<script src="scripts/content/design-*.js">` tags among the content
  scripts (before `scripts/app.js`).
- `tools/verify-topics.mjs` — add `'design'` to `TARGET_MODULES`; add the 7 design topics to the
  full-section set (`NEW_TOPICS`). No reference topic → no change to `REFERENCE_TOPICS`.

**Create** — 7 topic files: `design-solid-intro.js`, `design-srp.js`, `design-ocp.js`,
`design-lsp.js`, `design-isp.js`, `design-dip.js`, `design-solid-capstone.js`.

**No change** to the router, search, theme, progress, or other modules.

## 4. Topic Registration Shape

Each topic uses the site's standard shape (`module: 'design'`):

```js
window.PREP_SITE.registerTopic({
  id: 'design-srp', module: 'design', title: 'S · Single Responsibility',
  estimatedReadTime: '14 min', tags: ['design','solid','oop','srp','clean-code'],
  sections: [ { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `…` }, … ],
});
```

- Section `html` is raw trusted HTML; code uses `<pre><code class="language-typescript">…</code></pre>`,
  inline `<code>`, tables via `<table>`.
- **HTML-safety:** TypeScript generics and JSX-like tokens (`Array<T>`, `Repository<User>`,
  `<Provider>`) must be escaped `&lt;…&gt;` in the trusted-HTML fields, or the browser will
  swallow them.
- Every teaching topic includes the checker's six required section ids: `tldr`
  (collapsible:false), `what-why`, `mental-model`, `mechanics`, `examples`, `interview-patterns`.
  The intro and capstone additionally include a `<table>` summary (inside `mechanics` or a
  dedicated section). No per-principle cheat-sheet is required (SOLID principles are conceptual,
  not a command/tool catalog); the master summary lives in the capstone.
- **Examples are TypeScript, before→after, frontend-flavored** — each principle shown as a
  concrete violation/smell, then the refactored fix, using relatable scenarios (a service,
  repository, notifier, payment/pricing strategy) rather than Java-textbook Animals/Shapes.

## 5. Topic Content Outline

1. **`design-solid-intro` — SOLID: Overview & Why.**
   - What SOLID is; coined/popularized by **Robert C. Martin ("Uncle Bob")**, acronym by Michael
     Feathers; the five principles are guidelines for OO design, not laws.
   - The goal: code that is maintainable, flexible, and testable; the smells SOLID fights —
     **rigidity** (hard to change), **fragility** (changes break unrelated things), **immobility**
     (hard to reuse), needless complexity/repetition.
   - A quick OOP refresher used throughout: class, interface, polymorphism, abstraction,
     composition — enough that a reader shaky on OOP can follow the rest.
   - The mnemonic (S-O-L-I-D) and a one-line statement of each.
   - **When NOT to over-apply:** YAGNI tension, premature abstraction, the cost of indirection —
     SOLID serves change that actually happens.
   - A summary `<table>`: principle · one-line rule · primary smell it fixes.

2. **`design-srp` — S · Single Responsibility.**
   - "A class should have one, and only one, reason to change"; the modern framing: a module
     should be responsible to **one actor/stakeholder**. Cohesion vs coupling.
   - How to spot: a class that mixes persistence + business logic + presentation; "and" in the
     class description.
   - Before→after: a god `UserService` (save to DB + send email + format a row) → split into
     `UserRepository`, `Mailer`, `UserRowView`.
   - Relationship to separation of concerns; note SRP is the most misunderstood ("one method"
     is wrong — it's one *reason to change*).

3. **`design-ocp` — O · Open/Closed.**
   - "Software entities should be open for extension, but closed for modification" — add behavior
     by adding code, not editing existing code.
   - Mechanism: polymorphism / the **Strategy** pattern; program to an abstraction.
   - Before→after: a `switch (type)` / `if-else` chain on a shape/discount/payment type that must
     be edited for every new case → a polymorphic set of types implementing a common interface;
     adding a case = adding a class.
   - Caveat: don't pre-abstract every axis — apply OCP to the axes that actually vary.

4. **`design-lsp` — L · Liskov Substitution.**
   - "Subtypes must be substitutable for their base types" without breaking correctness — Barbara
     Liskov's substitution requirement.
   - The behavioral-subtyping contract rules: a subtype may **weaken preconditions** and
     **strengthen postconditions**, must preserve **invariants**, and must not throw new
     exceptions the base doesn't. State them plainly with examples.
   - The classic **Rectangle/Square** violation (setWidth/setHeight break a Rectangle invariant)
     and *why* it violates LSP; then a cleaner real example (e.g. a read-only collection that can't
     be a subtype of a mutable one; a bird that can't fly).
   - How an LSP violation silently breaks OCP (callers must special-case the subtype).

5. **`design-isp` — I · Interface Segregation.**
   - "Clients should not be forced to depend on methods they do not use" — prefer many small
     **role interfaces** over one fat interface.
   - How to spot: implementers throwing `NotImplemented` / stubbing methods they don't need; a
     "manager" interface every consumer only partially uses.
   - Before→after: a fat `IMachine { print(); scan(); fax(); }` forcing a simple printer to stub
     scan/fax → split into `IPrinter`, `IScanner`, `IFax`; a class composes only what it needs.
   - Note: ISP is about the *consumer's* view; relationship to SRP (fat interfaces often signal a
     class doing too much).

6. **`design-dip` — D · Dependency Inversion.**
   - "High-level modules should not depend on low-level modules; both should depend on
     abstractions. Abstractions should not depend on details; details depend on abstractions."
   - **DIP vs Dependency Injection:** DIP is the principle (depend on an abstraction); DI is one
     technique to satisfy it (pass the dependency in — constructor/param) — do not conflate them.
   - Before→after: a high-level `OrderService` that `new`s a concrete `StripeClient` (rigid,
     untestable) → depends on a `PaymentGateway` interface injected in; a `StripeGateway`
     implements it; tests inject a fake. The testability/mocking payoff is the headline benefit.
   - Note the "inversion": the low-level detail now conforms to an abstraction owned by the
     high-level policy.

7. **`design-solid-capstone` — Putting SOLID Together.**
   - How the principles interrelate: LSP is what makes OCP's polymorphism safe; ISP + DIP work
     together (depend on small abstractions); SRP underlies ISP (small responsibilities → small
     interfaces). A relationships diagram/table.
   - A **smell → principle** table (e.g. "shotgun surgery" → SRP/OCP; "switch on type" → OCP;
     "subtype needs `instanceof` checks" → LSP; "stubbed interface methods" → ISP; "`new` inside a
     class" → DIP).
   - A single **multi-principle refactor** worked example touching several principles at once.
   - **Criticisms & limits:** SOLID can breed over-engineering/indirection; YAGNI and "simplest
     thing that works" tension; SOLID is OO-centric (FP composes differently). Present honestly.
   - **Mapping to design patterns:** OCP↔Strategy, DIP↔Factory/DI containers, ISP↔role interfaces/
     Adapter, plus Observer/Template Method as extension mechanisms.
   - Interview-Q&A roundup consolidating the per-principle questions.

## 6. Correctness (accuracy)

Prose + code notes — no execution harness. Accuracy is gated by **expert review**, seeded with:
- Each principle stated correctly and attributed correctly (Martin; Liskov for LSP; Feathers for
  the acronym). SRP framed as "one reason to change / one actor," **not** "one method."
- **LSP contract rules** stated correctly (weaken preconditions, strengthen postconditions,
  preserve invariants) — a common place to get the direction backwards.
- **DIP vs DI** kept distinct (principle vs technique).
- TypeScript examples compile-plausible and idiomatic; the before genuinely violates the
  principle and the after genuinely fixes it (no strawman befores, no over-engineered afters).
- Generics/JSX-like tokens escaped (`&lt;…&gt;`); balanced HTML.

A structural check (`tools/verify-topics.mjs`, generalized to `design`) confirms each topic
registers with `module:'design'`, a unique id, `tldr` first (collapsible:false), and all six
required teaching sections.

## 7. Rollout Plan

Reviewable batches; nothing committed unless the user asks.

1. **Slice:** add the `design` module to `_index.js`; generalize `tools/verify-topics.mjs`; author
   **`design-solid-intro`** and **`design-srp`** end-to-end; wire their tags. User reviews the
   module + the intro/SRP depth + the TypeScript before→after style. **STOP for review.**
2–6. The remaining principle topics (`design-ocp`, `design-lsp`, `design-isp`, `design-dip`) and
   the **`design-solid-capstone`** (built last, since it references all five), each authored,
   structurally checked, accuracy-reviewed.
7. Final accuracy-review pass across all 7 + structural check + browser pass (module ordered,
   all render, Prev/Next threads them, tables render, before→after code highlights).

Each content batch: author → structural check → accuracy review → fix → summarize.

## 8. Risks & Mitigations

- **Subtly wrong principle statements** (esp. SRP "one method" myth, LSP contract direction,
  DIP-vs-DI conflation) → §6 expert-review gate seeded with these exact traps.
- **Strawman before / over-engineered after** examples → review checks the before truly violates
  and the after is idiomatic, not gratuitous indirection.
- **HTML-safety** with TS generics/JSX tokens → escape `&lt;…&gt;`; grep for raw `<T>`-style tokens.
- **Over-abstraction messaging** → intro and capstone explicitly cover YAGNI tension / when not to
  apply, so the module teaches judgment, not dogma.
- **Checker generalization** → add `'design'` + the 7 topics to `NEW_TOPICS`; no reference topic,
  so the existing teaching-section rule applies unchanged.

## 9. Open Questions

None blocking. Code language is **TypeScript, frontend-flavored** (chosen for the RN/TS audience
and because ISP/DIP need interfaces to show cleanly); adjustable if the user prefers plain JS.
Exact module placement in the sidebar order is a non-load-bearing judgment call.
