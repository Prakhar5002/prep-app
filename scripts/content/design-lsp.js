window.PREP_SITE.registerTopic({
  id: 'design-lsp',
  module: 'design',
  title: 'L · Liskov Substitution',
  estimatedReadTime: '13 min',
  tags: ['design', 'solid', 'oop', 'lsp', 'clean-code'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Liskov Substitution Principle (LSP):</strong> if <code>S</code> is a subtype of <code>T</code>, objects of type <code>T</code> should be replaceable with objects of type <code>S</code> <strong>without altering the correctness of the program</strong>. This is <strong>Barbara Liskov's</strong> principle, not Martin's — it comes from her 1987 OOPSLA keynote <em>"Data Abstraction and Hierarchy,"</em> was formalized with Jeannette Wing in their 1994 paper on behavioral subtyping, and the "L" in SOLID is literally named after her; Robert C. Martin only collected it into the SOLID acronym.</p>
<ul>
  <li><strong>It's about behavior, not shape.</strong> A subtype can match the base type's method signatures perfectly and still violate LSP — LSP is a contract on <em>behavior</em>, not a check that the type system already performs for free.</li>
  <li><strong>The contract rules — get the direction right:</strong> a subtype may <strong>weaken preconditions</strong> (ask no more of the caller than the base did — it can ask for less), must <strong>strengthen or preserve postconditions</strong> (promise no less than the base did — it can promise more), must <strong>preserve the base's invariants</strong>, and must not throw new exceptions the caller wasn't already prepared for.</li>
  <li><strong>The smell it fixes:</strong> client code sprinkled with <code>instanceof</code> / type-guard checks to work around a subtype that "mostly" behaves like the base, except when it doesn't.</li>
  <li><strong>Why it matters beyond LSP itself:</strong> a substitutability hole almost always gets patched with a type check in every caller — and every new subtype then requires editing all of those callers again, which is an <strong>Open/Closed Principle violation</strong> hiding behind an LSP one.</li>
</ul>
<p><strong>Mantra:</strong> "Ask no more, promise no less."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Behavioral subtyping, not structural subtyping</h3>
<p>TypeScript (and most mainstream type systems) check <strong>structural</strong> subtyping for free: if <code>Square</code> has every method <code>Rectangle</code> has, with compatible signatures, the compiler is satisfied. LSP asks a strictly harder question that no compiler checks: does <code>Square</code> actually <em>behave</em> the way any code written against <code>Rectangle</code> is entitled to expect? A subtype can be structurally perfect and behaviorally broken — that gap is exactly what LSP names.</p>

<h3>Why this is Liskov's principle, not Martin's</h3>
<p>Barbara Liskov introduced the idea in her 1987 OOPSLA keynote <em>"Data Abstraction and Hierarchy,"</em> and formalized it with Jeannette Wing in their 1994 paper, "A Behavioral Notion of Subtyping" — the actual technical content (preconditions, postconditions, invariants) is theirs. Robert C. Martin didn't invent this rule; he assembled five pre-existing design ideas into the SOLID mnemonic, and named the "L" directly after Liskov because her substitutability principle was the closest fit for that letter. Crediting Martin with the LSP itself is a common mix-up worth avoiding.</p>

<h3>Why a substitutability hole causes real damage</h3>
<ul>
  <li><strong>Silent correctness bugs, not compile errors.</strong> Because the type system only checks structure, an LSP violation compiles cleanly and then breaks at runtime, often far from the subtype's own code — in whatever caller happened to rely on the base type's contract.</li>
  <li><strong>Defensive client code.</strong> Once one subtype doesn't fully honor the base contract, callers start adding <code>instanceof</code> checks "just for that one type" — and that pattern spreads, because now every caller has to know about the exception.</li>
  <li><strong>Polymorphism stops paying for itself.</strong> The entire point of a shared base type is that callers can treat every subtype uniformly. The moment a caller needs to ask "but which subtype is this, really?", polymorphism has been defeated — the abstraction is a fiction the client can no longer trust.</li>
  <li><strong>It quietly breaks OCP too.</strong> See Mechanics and Examples, below — the <code>instanceof</code> branches that patch over an LSP violation are exactly the code you must revisit, and edit, every time a new subtype is added.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>A contract between caller and callee</h3>
<p>Borrowing Bertrand Meyer's "design by contract" framing: every method has an implicit contract with its caller, made of three parts — a <strong>precondition</strong> (what the caller must guarantee true before calling), a <strong>postcondition</strong> (what the method guarantees true after it returns), and any <strong>class invariant</strong> (what stays true about the object's state, before and after every public call). LSP is the rule that a subtype must honor the base type's contract at least as well as the base type does — it may only ever make the contract <em>easier to rely on</em>, never harder.</p>

<h3>The direction that's easy to get backwards</h3>
<p>The four rules, stated so the direction is unmistakable:</p>
<ul>
  <li><strong>Preconditions may only be weakened (or kept equal).</strong> The subtype can accept <em>at least as much</em> as the base required — it must never demand something extra the base didn't. If <code>Base.process(n: number)</code> accepts any number, a subtype that suddenly requires <code>n &gt; 0</code> has <strong>strengthened</strong> the precondition — that's the violation direction.</li>
  <li><strong>Postconditions must be strengthened (or kept equal) — never weakened.</strong> The subtype must guarantee <em>at least as much</em> as the base promised on return. If <code>Base.withdraw()</code> promises the balance decreases by exactly the requested amount, a subtype that sometimes withdraws less has <strong>weakened</strong> the postcondition — again, the violation direction.</li>
  <li><strong>Invariants must be preserved.</strong> Whatever stays true about every instance of the base type must stay true for the subtype too — a subtype must not introduce a new invariant of its own that forces it to break one of the base's.</li>
  <li><strong>No new exceptions the caller wasn't already prepared for.</strong> If the base's contract never throws for a given call, a subtype that throws a new, unexpected exception type there breaks every caller written against the base's contract.</li>
</ul>
<p>The intuition that makes the direction stick: a subtype must be <strong>at least as easy to call</strong> (precondition — ask no more) and <strong>at least as reliable to depend on</strong> (postcondition — promise no less) as the base. Reverse either direction and some caller that was written correctly against the base's contract now breaks the moment it receives the subtype instead.</p>

<h3>"Is-a" is necessary, not sufficient</h3>
<p>Squares genuinely "are" rectangles, geometrically — and TypeScript will happily let <code>Square extends Rectangle</code> compile. LSP is the reminder that the geometric or linguistic "is-a" relationship doesn't automatically transfer to "is behaviorally substitutable for" — that has to be checked separately, against the base's actual contract, not against its name. See Examples, below, for exactly where this specific case breaks.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>How to spot a violation</h3>
<ul>
  <li><strong>An override that throws where the base never did.</strong> The single most common tell — a subtype's method body is <code>throw new Error('not supported')</code> for an operation the base type's contract promises will succeed.</li>
  <li><strong>An override that narrows accepted input.</strong> A subtype's method rejects inputs the base method happily accepted — a precondition strengthened in the wrong direction.</li>
  <li><strong>An override that returns or guarantees less.</strong> A subtype quietly does a smaller version of what the base promised (returns an unsorted list where the base guaranteed sorted output, mutates less state than promised) — a postcondition weakened in the wrong direction.</li>
  <li><strong>A subtype-only invariant that conflicts with the base's.</strong> The classic case: the subtype needs two fields to always stay equal, but the base's contract for its own setters explicitly allows them to vary independently — see the Rectangle/Square example below.</li>
  <li><strong><code>instanceof</code> / type-guard branches sprinkled through client code.</strong> This is the giveaway from the <em>caller's</em> side: if code that accepts a base type has to check "but is this actually the <code>Foo</code> subtype?" before it dares call a method, some subtype in that hierarchy isn't truly substitutable.</li>
</ul>
<p>The same shape shows up with collections and generics, not just class hierarchies: if client code expects a mutable <code>List&lt;T&gt;</code> (with a working <code>add(item: T): void</code>), a <code>ReadOnlyList&lt;T&gt;</code> cannot be substituted for it — calling <code>.add()</code> must either throw or silently no-op, and either way that's the exact same contract break as <code>Penguin.fly()</code> below, just wearing a generic-collection costume instead of an animal-hierarchy one.</p>

<h3>The fix: model the true capability, don't force a shared base</h3>
<p>When behavior genuinely diverges — some subtypes can do something the base promises and some can't — the fix is never "override it to throw" or "override it to silently no-op." Both of those are still LSP violations, just relocated. The real fix is to stop promising that capability at the level where not every subtype can honor it: pull the capability into its own narrower interface, and only have the subtypes that genuinely support it implement that interface. Base-type code, and every caller of it, then only ever sees operations every actual instance can honor — substitutability is restored because the contract was made honest, not because the exception was hidden better.</p>
<p>This is also where an LSP fix quietly leans on ISP (see the previous topic in this module): segregating "the capability not everyone has" into its own small interface is precisely the "role, not thing" move ISP mechanics describes — here it's in service of keeping every remaining base-type reference truly substitutable, rather than purely avoiding forced stub methods.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples (before → after)', html: `
<h3>The classic violation: Rectangle / Square</h3>
<pre><code class="language-typescript">class Rectangle {
  constructor(protected _width: number, protected _height: number) {}

  // Contract: setWidth changes width only; height is left unchanged.
  setWidth(width: number): void {
    this._width = width;
  }

  // Contract: setHeight changes height only; width is left unchanged.
  setHeight(height: number): void {
    this._height = height;
  }

  get width(): number { return this._width; }
  get height(): number { return this._height; }

  area(): number {
    return this._width * this._height;
  }
}

// Square "is-a" Rectangle geometrically — but it cannot honor Rectangle's contract.
class Square extends Rectangle {
  override setWidth(width: number): void {
    this._width = width;
    this._height = width; // forced, to keep Square's own invariant: width === height
  }

  override setHeight(height: number): void {
    this._width = height;
    this._height = height; // forced, for the same reason
  }
}

function resizeAndCheckArea(rect: Rectangle): void {
  rect.setWidth(5);
  rect.setHeight(4);
  // Any Rectangle, per its contract, leaves this true: setWidth touched only
  // width, setHeight touched only height, so area is 5 * 4.
  console.assert(rect.area() === 20, \`expected 20, got \${rect.area()}\`);
}

resizeAndCheckArea(new Rectangle(1, 1)); // passes — area is 20
resizeAndCheckArea(new Square(1, 1));    // fails — area is 16
</code></pre>
<p><strong>Why this is an LSP break, precisely:</strong> <code>Rectangle.setWidth</code>'s postcondition promises "width becomes the given value, height is unchanged." <code>Square.setWidth</code> cannot deliver that postcondition — every call to it also changes height, because Square is enforcing an invariant of its own (width always equals height) that Rectangle's contract never required and never expected. That's a postcondition <strong>weakened</strong> in exactly the forbidden direction: <code>resizeAndCheckArea</code> was written correctly against Rectangle's contract, and it silently breaks the moment a Square is substituted in. The bug isn't that "squares are a kind of rectangle" — it's that <code>Rectangle</code>'s public contract (independently mutable width and height) is not one every rectangle-like shape can actually honor.</p>

<h3>A cleaner, real-world version of the same mistake — and the instanceof it forces</h3>
<pre><code class="language-typescript">class Bird {
  layEgg(): void {
    console.log('Egg laid.');
  }

  fly(): void {
    console.log('Flying...');
  }
}

// Penguin "is-a" Bird — but cannot honor Bird's fly() contract.
class Penguin extends Bird {
  override fly(): void {
    throw new Error('Penguins cannot fly'); // a new exception the caller never expected
  }
}

// Client code now has to know about this one subtype to avoid a crash...
function launchAll(birds: Bird[]): void {
  for (const bird of birds) {
    if (bird instanceof Penguin) continue; // defensive special-case
    bird.fly();
  }
}
</code></pre>
<p>The next flightless species — <code>Ostrich</code>, <code>Kiwi</code> — needs the exact same <code>instanceof</code> branch added here, and in every other place client code touches <code>Bird</code>. The LSP violation has silently become an <strong>OCP violation</strong>: <code>launchAll</code> must be modified every time a new subtype is added that can't do what the base type promises — precisely the "closed for modification" guarantee OCP is supposed to give callers.</p>

<pre><code class="language-typescript">interface Bird {
  layEgg(): void;
}

interface FlyingBird extends Bird {
  fly(): void;
}

class Sparrow implements FlyingBird {
  layEgg(): void { console.log('Sparrow laid an egg.'); }
  fly(): void { console.log('Sparrow flying...'); }
}

class Penguin implements Bird {
  layEgg(): void { console.log('Penguin laid an egg.'); }
  // No fly() — Penguin was never forced to promise something it can't deliver.
}

// Only birds that genuinely support flight can be passed here — no instanceof needed.
function launchAll(birds: FlyingBird[]): void {
  for (const bird of birds) bird.fly(); // every element truly substitutable
}

launchAll([new Sparrow()]);       // fine
// launchAll([new Penguin()]);    // compile error — Penguin isn't a FlyingBird
</code></pre>
<p>Every element of a <code>FlyingBird[]</code> is now genuinely substitutable — nothing in that array can violate <code>launchAll</code>'s expectations, because the type system, not a runtime check, enforces it. Adding a new flightless species requires zero changes to <code>launchAll</code>: it simply implements <code>Bird</code>, not <code>FlyingBird</code>. Fixing the LSP violation — by refusing to let <code>Bird</code> promise a capability not every bird has — restored OCP at the exact same call site the <code>instanceof</code> branch used to live in.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What does LSP actually require, and why isn't matching the base type's method signatures enough?</div>
<div class="qa-a">
<p>LSP requires that objects of a supertype can be replaced with objects of a subtype without altering the program's correctness — it's a statement about <strong>behavior</strong>, not shape. A subtype can implement every method the base type has, with fully compatible signatures, and still violate LSP, because the type checker only verifies structure — it has no way to know whether an overridden method actually honors the base method's preconditions, postconditions, and invariants. That behavioral layer is exactly what LSP adds on top of what the compiler already checks for free.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">State the behavioral-subtyping contract rules — precisely, including direction.</div>
<div class="qa-a">
<p>Four rules, and the direction is the part people get backwards under interview pressure: (1) a subtype may only <strong>weaken</strong> preconditions — it can ask the caller for no more than the base required, though it may ask for less; (2) a subtype must <strong>strengthen or preserve</strong> postconditions — it must guarantee the caller at least as much as the base promised, never less; (3) a subtype must <strong>preserve</strong> the base type's invariants, and must not introduce a new invariant of its own that forces it to break one of the base's; (4) a subtype must not throw new exception types the caller wasn't already prepared for by the base's contract. A useful check when reciting these live: preconditions loosen, postconditions tighten — reversing either one is the mistake, not the rule.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why does an LSP violation tend to turn into an OCP violation?</div>
<div class="qa-a">
<p>Once a subtype can't fully honor the base type's contract — it throws where the base didn't, or silently does less than promised — client code that was written to treat every subtype uniformly starts failing for that one case. The near-universal patch is an <code>instanceof</code> or type-guard check in every caller that special-cases the offending subtype. That code is now open for modification every time a new, similarly non-conforming subtype is introduced — someone has to go find every one of those special-case branches and add another one. OCP promises client code stays closed for modification when new subtypes arrive; an LSP hole is exactly what forces it back open.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why is <code>Square extends Rectangle</code> the textbook wrong answer, and what's the general lesson?</div>
<div class="qa-a">
<p>Geometrically a square is a rectangle, so the inheritance looks obviously correct — but <code>Rectangle</code>'s actual contract (its <code>setWidth</code> and <code>setHeight</code> methods each promise to change only one dimension) is a contract <code>Square</code> cannot honor while also keeping its own invariant that width always equals height. The general lesson: "is-a" in the everyday, linguistic sense is necessary but not sufficient for a safe subtype relationship — what actually matters is whether the subtype can honor the base's contract, checked method by method, not whether the English sentence "a square is a rectangle" sounds true.</p>
</div>
</div>
`}

]});
