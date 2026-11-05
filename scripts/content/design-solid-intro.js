window.PREP_SITE.registerTopic({
  id: "design-solid-intro",
  module: "design",
  title: "SOLID: Overview & Why",
  estimatedReadTime: "16 min",
  tags: ["design","solid","oop","clean-code","principles"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>SOLID is five object-oriented design guidelines</strong> — not laws or syntax — aimed at making code easier to <strong>change, extend, and test</strong> as a system grows.</div>
  <h4>Key points</h4>
  <ul>
    <li>The five, one line each: <strong>S</strong> — one reason to change / one actor; <strong>O</strong> — open for extension, closed for modification; <strong>L</strong> — a subtype must be usable anywhere its base is expected; <strong>I</strong> — don't force clients to depend on methods they don't use; <strong>D</strong> — depend on abstractions, not concretions.</li>
    <li>History is a <strong>three-person credit</strong>: Robert C. Martin articulated four of the five and collected the set; the <strong>L is Barbara Liskov's</strong> (1987 keynote, formalized with Wing in 1994); <strong>Michael Feathers</strong> coined the SOLID acronym, which Martin then popularized.</li>
    <li>SOLID exists to fix nameable smells: <strong>rigidity</strong> (small changes cascade), <strong>fragility</strong> (a change breaks something unrelated), <strong>immobility</strong> (logic can't be reused cleanly), and <strong>needless complexity/repetition</strong>.</li>
    <li>These are guidelines for <strong>managing dependencies and coupling</strong> in OO code — they assume classes, interfaces, and polymorphism, and most fixes use <strong>composition</strong>, not inheritance.</li>
    <li>The one question tying all five together: <strong>"when the change I actually expect shows up, is it easy to make?"</strong> — not "could this handle any conceivable future requirement."</li>
    <li>The counterweight is <strong>YAGNI</strong>: every abstraction has a real cost (another file, another jump, another contract to keep consistent), so don't build extensibility before there's a real reason.</li>
    <li><strong>Premature abstraction is often worse than a little duplication</strong> — two things that look alike but change for unrelated reasons are not "the same responsibility."</li>
    <li>Mantra: <strong>SOLID isn't a checklist to satisfy</strong> &mdash; it's a set of answers to &quot;why did this small change just take down half the app?&quot;</li>
    <li>Rule of thumb: <strong>apply a principle when you feel real pain from its absence</strong> (a class you dread touching, a test needing a live DB, a switch edited five times this month), not speculatively.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Treating SOLID as <strong>laws or a checklist to satisfy on every class</strong> — extracting collaborators, adding an interface per dependency, and wrapping every construction behind a factory regardless of whether any symptom is present. That's premature abstraction: it pays the full cost of indirection for a change that may never come, and is its own design smell.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"SOLID is five guidelines for keeping the cost of a typical future change low — they target specific smells like rigidity, fragility, and immobility, not elegance for its own sake."</div>
  <div class="revision-say">"Every letter is one angle on the same question: when the change I actually expect arrives, is this design ready for it?"</div>
  <div class="revision-say">"The counterweight is YAGNI — I apply a principle when I feel real pain from its absence, because a single-implementation interface added 'just in case' is indirection with no payoff."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Where these principles came from</h3>
<p><strong>Robert C. Martin</strong> ("Uncle Bob") articulated most of these principles individually across papers and talks in the late 1990s and early 2000s, and collected them in his book <em>Agile Software Development: Principles, Patterns, and Practices</em> (2002). SRP, OCP, ISP, and DIP each existed as a named idea in his writing before there was a single acronym covering all five. The "L" is the one exception: the <strong>Liskov Substitution Principle</strong> originates with <strong>Barbara Liskov</strong>, who introduced the substitutability idea in her 1987 OOPSLA keynote "Data Abstraction and Hierarchy," later formalized with Jeannette Wing in 1994 — the principle is literally named after her; Martin adopted her idea for the "L" rather than originating it himself.</p>
<p><strong>Michael Feathers</strong> — later well known for <em>Working Effectively with Legacy Code</em> — is credited with rearranging Martin's five principles into the memorable <strong>SOLID</strong> mnemonic in the early 2000s. Martin himself popularized the acronym afterward, and it's the name that stuck. Worth keeping straight: collecting/popularizing the set, originating the L, and naming the acronym are three separate credits, not one.</p>

<h3>The smells SOLID exists to fix</h3>
<p>Martin frames these principles as answers to specific, nameable symptoms of bad object-oriented design — the same handful of smells show up over and over in a codebase that's decaying, regardless of language or team:</p>
<ul>
  <li><strong>Rigidity</strong> — every change requires touching many other places, so even small requests take a long time and drag in code nobody wanted to touch.</li>
  <li><strong>Fragility</strong> — a change in one place breaks something in a seemingly unrelated place, because responsibilities were tangled together that shouldn't have been.</li>
  <li><strong>Immobility</strong> — a piece of logic you'd like to reuse elsewhere can't be pulled out cleanly, because it's welded to details it doesn't actually need.</li>
  <li><strong>Needless complexity &amp; repetition</strong> — the design fights back against simple changes often enough that people start copy-pasting rather than reusing, and each copy drifts a little further from the others over time.</li>
</ul>
<p>None of the five letters is about elegance for its own sake — each one targets at least one of these smells directly, which is exactly the lens the summary table in Mechanics, below, uses.</p>

<h3>Who SOLID is for</h3>
<p>These are guidelines for <em>managing dependencies and coupling</em> in object-oriented code specifically — they assume you already have classes, interfaces, and polymorphism to work with (a quick refresher on all three is next, in Mental Model). They're most useful in code that's expected to change over time and has more than one person or team touching it; a one-off script you'll delete next week doesn't need any of this.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>OOP refresher, just enough to follow this module</h3>
<p>If your object-oriented vocabulary is rusty, here's the minimum you need for the rest of this module:</p>
<ul>
  <li><strong>Class</strong> — a blueprint bundling data (fields/properties) together with the behavior (methods) that operates on it.</li>
  <li><strong>Interface</strong> — a contract: a set of method/property signatures with no implementation behind them. Anything that provides those signatures satisfies the interface, whether or not it says so explicitly — TypeScript uses <em>structural</em> typing, so if the shape matches, it counts.</li>
  <li><strong>Polymorphism</strong> — the ability to call the same method name on different concrete types and get each type's own behavior, without the caller needing to know or care which concrete type it's actually talking to.</li>
  <li><strong>Abstraction</strong> — hiding "how" behind a simpler "what." Callers depend on the simple contract; the messy implementation detail lives behind it and can change freely without the caller noticing.</li>
  <li><strong>Composition</strong> — building a class's behavior by holding references to other, smaller objects ("has-a") and delegating to them, rather than inheriting behavior from a parent class ("is-a"). Most of this module leans on composition — most SOLID violations get fixed by composing smaller collaborators, not by adding inheritance.</li>
</ul>

<h3>The one question that ties all five together</h3>
<p>Every one of the five letters is a different angle on the same underlying question: <strong>"when the change I actually expect shows up, is it easy to make?"</strong> Not "could this theoretically handle any future requirement" — that's premature abstraction, covered below — but "for the kind of change this code plausibly will need, is the design ready for it?" SRP asks that question about a single class's reasons to change. OCP asks it about adding new behavior. LSP asks it about swapping implementations safely. ISP asks it about what a client is forced to know about. DIP asks it about which direction the "depends-on" arrows point.</p>
<p>Keep coming back to this framing as you go topic by topic — it explains <em>why</em> each rule exists, which is worth more in an interview (and in real design decisions) than reciting a definition from memory.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ The Five, and the Smells They Fix", collapsible: true, html: `
<h3>A single-glance reference</h3>
<p>Each row below gets its own full topic later in this module — this table is just the map before the territory:</p>
<table>
  <thead><tr><th>Principle</th><th>One-line rule</th><th>Primary smell it fixes</th></tr></thead>
  <tbody>
    <tr><td><strong>S</strong> — Single Responsibility</td><td>One reason to change; responsible to one actor.</td><td>The "god class" — persistence, business rules, and presentation tangled into one file that unrelated people all have to edit.</td></tr>
    <tr><td><strong>O</strong> — Open/Closed</td><td>Open for extension, closed for modification.</td><td>An ever-growing <code>switch</code>/<code>if-else</code> on a type code, edited every time a new case appears, risking every existing case each time.</td></tr>
    <tr><td><strong>L</strong> — Liskov Substitution</td><td>A subtype must be usable anywhere its base type is expected.</td><td>A subclass that overrides a method to throw, weaken a guarantee, or otherwise surprise code written against the base type.</td></tr>
    <tr><td><strong>I</strong> — Interface Segregation</td><td>Don't force clients to depend on methods they don't use.</td><td>The "fat interface" — implementers stub out methods they'll never use, often with a <code>throw new Error('not supported')</code>.</td></tr>
    <tr><td><strong>D</strong> — Dependency Inversion</td><td>Depend on abstractions, not concretions.</td><td>A class that constructs its own dependencies internally, wiring itself to one specific implementation and making it hard to swap or test in isolation.</td></tr>
  </tbody>
</table>

<h3>When NOT to over-apply SOLID — the YAGNI tension</h3>
<div class="callout warn">
  <div class="callout-title">⚠️ Every one of these principles has a cost</div>
  <p>Every extra interface, every extracted collaborator, every layer of indirection is a real cost: another file to open, another jump for a reader to make, another abstraction to keep consistent as the code evolves. SOLID is a response to <em>anticipated</em> change — it is not a mandate to prepare every class for every conceivable future requirement on day one.</p>
</div>
<ul>
  <li><strong>YAGNI ("You Aren't Gonna Need It")</strong> is the counterweight: don't build the extensibility until there's a real, current reason to need it. A single-implementation interface introduced "just in case" — with exactly one class behind it and no second implementation in sight — is indirection with no payoff yet.</li>
  <li><strong>Premature abstraction</strong> is often worse than a little duplication. Two pieces of code that happen to look alike today, but change for unrelated reasons, are not "the same responsibility" — forcing them into one shared abstraction to avoid repeating a few lines creates exactly the coupling SRP warns against, just one level higher up.</li>
  <li><strong>A practical rule of thumb:</strong> apply a principle when you feel real pain from its absence — a class you dread touching, a test you can't write without a live database, a <code>switch</code> statement you've edited five times this month — not speculatively, before that pain exists. A 200-line prototype rarely needs the same rigor as a payments module three teams depend on.</li>
</ul>
<p>Every topic that follows will show the "fix" for its principle, but will also call out where applying that fix everywhere, unconditionally, becomes its own smell.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Before: a switch on type, edited every time a tier is added</h3>
<pre><code class="language-typescript">type CustomerType = 'regular' | 'premium' | 'vip';

function calculateDiscount(customerType: CustomerType, amount: number): number {
  switch (customerType) {
    case 'regular':
      return amount * 0.95;
    case 'premium':
      return amount * 0.85;
    case 'vip':
      return amount * 0.7;
    default:
      throw new Error('Unknown customer type');
  }
}
</code></pre>
<p>This works fine for three tiers. But every new tier means opening <code>calculateDiscount</code> and adding a case — and it's rarely the only <code>switch</code> on <code>CustomerType</code> in a real codebase; the same shape tends to get copy-pasted into invoicing, receipts, and reporting code, each copy drifting a little further from the others. That's the smell OCP names directly: this function is not <em>closed</em> for modification — every new requirement modifies it, and risks every branch that was already there.</p>

<h3>After: one small implementation per tier, dispatched through a lookup</h3>
<pre><code class="language-typescript">interface DiscountStrategy {
  apply(amount: number): number;
}

class RegularDiscount implements DiscountStrategy {
  apply(amount: number): number { return amount * 0.95; }
}
class PremiumDiscount implements DiscountStrategy {
  apply(amount: number): number { return amount * 0.85; }
}
class VipDiscount implements DiscountStrategy {
  apply(amount: number): number { return amount * 0.7; }
}

const discountStrategies: Record&lt;CustomerType, DiscountStrategy&gt; = {
  regular: new RegularDiscount(),
  premium: new PremiumDiscount(),
  vip: new VipDiscount(),
};

function calculateDiscount(customerType: CustomerType, amount: number): number {
  return discountStrategies[customerType].apply(amount);
}
</code></pre>
<p>Adding a "student" tier now means adding one new class and one map entry — <code>calculateDiscount</code> itself never changes again, and nothing about the existing three tiers is at risk from the new one. This is a preview of the Open/Closed principle's shape (its own topic later in this module) — the point here is just to show what "applying SOLID" concretely looks like in code: not a switch statement disappearing by magic, but a small, deliberate restructuring around a stable interface.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
<div class="qa-q">What does SOLID stand for, and can you give a one-line definition of each?</div>
<div class="qa-a">
<p><strong>S</strong>ingle Responsibility — a class should have one reason to change, i.e. be responsible to one actor. <strong>O</strong>pen/Closed — open for extension, closed for modification. <strong>L</strong>iskov Substitution — subtypes must be usable anywhere their base type is expected, without surprises. <strong>I</strong>nterface Segregation — don't force clients to depend on methods they don't use. <strong>D</strong>ependency Inversion — depend on abstractions, not concrete implementations.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why do these principles exist — what problems do they actually prevent?</div>
<div class="qa-a">
<p>Each one targets one or more classic bad-design smells: <strong>rigidity</strong> (small changes cascade into many files), <strong>fragility</strong> (a change in one place breaks something seemingly unrelated), and <strong>immobility</strong> (logic can't be reused elsewhere because it's entangled with details it doesn't need). They're not about elegance for its own sake — they're about keeping the cost of a typical future change low as a codebase and a team both grow.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">When might applying SOLID be a mistake?</div>
<div class="qa-a">
<p>When it's applied speculatively, ahead of any real need — introducing an interface with a single implementation "just in case," or splitting a small, cohesive class into several pieces before there's a second actor or a second reason to change. That's the YAGNI tension: every abstraction has a real cost (indirection, more files, more to keep consistent), and paying that cost before there's a concrete payoff is its own design smell, not good practice. The rule of thumb interviewers like to hear: apply a principle when you feel real pain from its absence, not before.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Who created the SOLID principles, and who coined the acronym?</div>
<div class="qa-a">
<p>Robert C. Martin ("Uncle Bob") articulated most of the five principles individually, across papers and his book <em>Agile Software Development: Principles, Patterns, and Practices</em> — with one exception: the Liskov Substitution Principle originates with Barbara Liskov, from her 1987 OOPSLA keynote "Data Abstraction and Hierarchy" (later formalized with Jeannette Wing in 1994); Martin adopted her substitutability idea for the "L" rather than coining it. Michael Feathers is credited with rearranging the five principles into the memorable SOLID mnemonic; Martin then popularized the acronym himself. It's a three-person history worth knowing precisely — Martin for the set and four of the five principles, Liskov for the L, Feathers for the acronym — since interviewers sometimes specifically ask who coined the acronym versus who defined the underlying principles.</p>
</div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What single question ties all five SOLID principles together?</div>
  <div class="qa-answer">
    <p>"When the change I actually expect shows up, is it easy to make?", not "could this theoretically handle any future requirement", which is premature abstraction. Each letter asks it from a different angle: SRP about a single class's reasons to change, OCP about adding new behaviour, LSP about swapping implementations safely, ISP about what a client is forced to know about, and DIP about which direction the depends-on arrows point. That framing explains why each rule exists, which is worth more in an interview than reciting definitions.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q6. Why can premature abstraction be worse than a little duplication?</div>
  <div class="qa-answer">
    <p>Two pieces of code that look alike today but change for unrelated reasons are not "the same responsibility". Forcing them into one shared abstraction to avoid repeating a few lines couples them, which is exactly the coupling SRP warns against, just one level higher up. Every abstraction also costs indirection, more files and another contract to keep consistent, so apply a principle when you feel real pain from its absence. A 200-line prototype rarely needs the rigour of a payments module three teams depend on.</p>
  </div>
</div>
` },

  ]
});
