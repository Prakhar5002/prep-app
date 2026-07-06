window.PREP_SITE.registerTopic({
  id: 'design-ocp',
  module: 'design',
  title: 'O · Open/Closed',
  estimatedReadTime: '13 min',
  tags: ['design', 'solid', 'oop', 'ocp', 'clean-code'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Open/Closed Principle (OCP)</strong>, Bertrand Meyer's original phrasing from <em>Object-Oriented Software Construction</em> (1988): a module should be <strong>open for extension, but closed for modification</strong>. In practice: when a new requirement shows up, you should be able to add behavior by <strong>adding new code</strong> — a new class, a new file — not by reopening and editing code that already works, is already tested, and is already relied on elsewhere.</p>
<ul>
  <li><strong>The mechanism is polymorphism</strong> — usually via the <strong>Strategy pattern</strong>: define a small interface, put each variant behind its own class that implements it, and have the calling code depend only on that abstraction, never on which concrete class it's actually talking to.</li>
  <li><strong>How to spot a violation:</strong> a <code>switch (type)</code> or <code>if-else</code> chain keyed on a type discriminator, that you have to reopen and add a branch to every time a new case appears.</li>
  <li><strong>The fix:</strong> replace the branch with one class per case. Adding a new case becomes "write one new class that implements the interface" — the switch, and everything that depended on it, is never touched again.</li>
  <li><strong>The caveat:</strong> apply OCP to the axis that <strong>actually</strong> varies today — not to every axis you can imagine varying someday. Abstracting a dimension that never gets a second implementation is pure YAGNI cost with no payoff.</li>
</ul>
<p><strong>Mantra:</strong> "If shipping a new case means editing an existing, working function, that function isn't closed yet."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Where OCP came from — and the reinterpretation that matters most today</h3>
<p>Bertrand Meyer coined the term in <em>Object-Oriented Software Construction</em> (1988). His original formulation: a module is <strong>open</strong> if it can still be extended — new behavior can be added — and <strong>closed</strong> if it's stable enough for other modules to depend on, meaning its published interface won't shift out from under them. Meyer's own mechanism for getting both at once was <strong>inheritance</strong>: a base class ships, gets tested, and is closed to edits; a new requirement is met by writing a <em>subclass</em> that inherits and overrides, leaving the base class's source file untouched.</p>
<p>Robert C. Martin later reinterpreted OCP for the era of explicit interfaces and dependency inversion — this is the version almost everyone means today, and the one this topic focuses on. In Martin's framing, calling code depends on an <strong>abstraction</strong> (an interface), never on a concrete class. Every concrete implementation of that interface is a peer, interchangeable from the caller's point of view. A new requirement is met by writing a new class that implements the existing interface and wiring it in — the interface doesn't change, no existing implementation changes, and critically, the code that <em>calls through</em> the interface doesn't change either. Meyer's version closes the base class; Martin's polymorphic version closes the interface <em>and</em> every caller of it — which is why it's the version that scales to real codebases with many independent call sites.</p>

<h3>Why editing a shared function for every new case causes real damage</h3>
<ul>
  <li><strong>Regression risk compounds.</strong> Every edit to a function that already has five working cases risks all five, not just the new sixth one — a stray change to a shared variable, or a misplaced brace, can silently break a case nobody meant to touch.</li>
  <li><strong>Cyclomatic complexity only grows.</strong> A switch with three cases is easy to hold in your head; the same switch with fifteen cases, plus nested conditionals per case, stops being reviewable in one sitting — and it rarely shrinks back down on its own.</li>
  <li><strong>The same switch tends to multiply.</strong> In a real codebase, one type discriminator rarely drives just one function — invoicing, reporting, validation, and serialization code often each grow their own parallel switch on the same enum, so one new case in the business domain becomes N edits scattered across N files, each one a chance to miss a spot.</li>
  <li><strong>It compounds with SRP.</strong> A shared switch is frequently also a multi-actor magnet: the team that owns "credit card" behavior and the team that owns "PayPal" behavior end up both editing the exact same function, for entirely unrelated reasons, at unrelated times — the same "two actors, one file" problem the SRP topic named directly, just showing up through a different door.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>"Closed" means stable and trusted, not "frozen forever"</h3>
<p>"Closed for modification" doesn't mean a class can never change — bugs still get fixed, and a genuinely wrong implementation still gets corrected. It means: <em>adding a new variant of behavior the class already anticipates</em> should not require reopening it. The function that computes a discount, processes a payment, or measures a shape's area shouldn't still be accumulating <code>else if</code> branches a year into production — new variants should show up as new code sitting <em>beside</em> it, not new branches injected <em>into</em> it.</p>

<h3>The mechanism: program to an abstraction (the Strategy pattern)</h3>
<p>The concrete technique is close to mechanical: define a small interface naming the one behavior that varies, give each variant its own class implementing that interface, and have the calling code hold a reference typed as the <em>interface</em> — never as one specific concrete class. The caller invokes the interface's method and gets back whichever behavior belongs to the concrete instance it was actually handed; it never inspects "which case is this" itself, because it doesn't need to. This is the <strong>Strategy pattern</strong> by name: a family of interchangeable behaviors, each wrapped in its own small class, selected and handed to the client from the outside rather than branched on from the inside.</p>

<h3>The tell: a <code>switch(type)</code> you must reopen for every new case</h3>
<p>The single most reliable signal that a piece of code violates OCP is structural, not stylistic: a <code>switch</code> statement or an <code>if-else</code> chain keyed on a type/kind/category field, where the list of cases is expected to grow over the code's lifetime, and where growing it means editing that exact function. It's not about switch statements being bad in general — a switch over a truly fixed, closed set of values (say, the seven days of the week) is completely fine, because there is no "new case" coming. The violation is specifically an <strong>open-ended</strong> set of cases handled with a <strong>closed-ended</strong> mechanism.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>How to spot a violation</h3>
<ul>
  <li><strong>A <code>switch</code>/<code>if-else</code> on a type discriminator that grows over time.</strong> The canonical signal — see Mental Model above. Look for a <code>default: throw new Error('Unknown ...')</code> branch; it's a tell that the list of cases is expected to keep expanding.</li>
  <li><strong>The same discriminator switched on in more than one place.</strong> If <code>PaymentMethod</code> is switched on in the payment processor <em>and</em> in the invoice renderer <em>and</em> in the analytics exporter, a new payment method means editing all three — and it's easy to update two and forget the third.</li>
  <li><strong>Commit history showing the same function edited over and over, only to add a case.</strong> A function whose changelog is "add case: crypto," "add case: Apple Pay," "add case: Google Pay" is telling you exactly where the missing abstraction belongs.</li>
  <li><strong>A code review comment that says "just add another <code>else if</code> here."</strong> If that's the accepted, expected way to ship the next variant, the design has already settled into an OCP violation — it's just not painful yet.</li>
</ul>

<h3>The fix: one class per case, dispatch by polymorphism</h3>
<p>Extract the varying behavior behind a small interface — often just one method. Give each existing case its own class implementing that interface. Replace the switch's call sites with a call through the interface. The function that used to contain the switch either disappears entirely (callers now hold the right implementation directly) or shrinks to a single line that calls the interface method on whatever implementation it was given. Adding the next case is now purely additive: write one new class implementing the interface, and — if a discriminator value (like a string from a request payload) still needs to be turned into a concrete instance somewhere — add one entry to a small lookup table at the edge of the system. Nothing that already worked is opened again.</p>

<div class="callout warn">
  <div class="callout-title">⚠️ Apply OCP to the axis that actually varies — not every axis</div>
  <p>OCP is not a mandate to make every field of every class extensible "just in case." Before extracting an interface, ask: is there a real, current second implementation — or a concrete, near-term third one on the roadmap — or is this purely speculative? A payment method genuinely varies (credit card vs. PayPal vs. bank transfer behave differently); the currency a payment is denominated in might not, if the system only ever handles one currency today. Wrapping <em>every</em> field that could theoretically vary behind its own interface "for future flexibility" is premature abstraction: it pays the full cost of indirection — another file, another jump, another contract to keep consistent — for an axis of change that may never materialize. Reach for OCP where the switch you're staring at already has three or more cases and a visible trend of growing, not for a field that has exactly one value today.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples (before → after)', html: `
<h3>Before: a payment processor that must be reopened for every new method</h3>
<pre><code class="language-typescript">type PaymentMethod = 'credit_card' | 'paypal' | 'bank_transfer';

interface PaymentRequest {
  accountId: string;
  amount: number;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  feePercent: number;
}

async function processPayment(
  method: PaymentMethod,
  request: PaymentRequest
): Promise&lt;PaymentResult&gt; {
  switch (method) {
    case 'credit_card': {
      const feePercent = 0.029;
      const transactionId = await creditCardGateway.charge(request.accountId, request.amount);
      return { success: true, transactionId, feePercent };
    }
    case 'paypal': {
      const feePercent = 0.034;
      const transactionId = await paypalClient.createPayment(request.accountId, request.amount);
      return { success: true, transactionId, feePercent };
    }
    case 'bank_transfer': {
      const feePercent = 0.008;
      const transactionId = await bankGateway.initiateTransfer(request.accountId, request.amount);
      return { success: true, transactionId, feePercent };
    }
    default:
      throw new Error(\`Unsupported payment method: \${method}\`);
  }
}
</code></pre>
<p>This works for three payment methods, but the shape is a genuine OCP violation: adding Apple Pay, Google Pay, or a crypto rail means reopening <code>processPayment</code>, adding a fourth <code>case</code>, and — because all four branches now live in the same function — risking the three that were already working and already handling real money. The function is not <em>closed</em>; every new payment method modifies it.</p>

<h3>After: one gateway class per method, the function only dispatches through an interface</h3>
<pre><code class="language-typescript">interface PaymentGateway {
  readonly feePercent: number;
  charge(request: PaymentRequest): Promise&lt;PaymentResult&gt;;
}

class CreditCardGateway implements PaymentGateway {
  readonly feePercent = 0.029;
  async charge(request: PaymentRequest): Promise&lt;PaymentResult&gt; {
    const transactionId = await creditCardGateway.charge(request.accountId, request.amount);
    return { success: true, transactionId, feePercent: this.feePercent };
  }
}

class PaypalGateway implements PaymentGateway {
  readonly feePercent = 0.034;
  async charge(request: PaymentRequest): Promise&lt;PaymentResult&gt; {
    const transactionId = await paypalClient.createPayment(request.accountId, request.amount);
    return { success: true, transactionId, feePercent: this.feePercent };
  }
}

class BankTransferGateway implements PaymentGateway {
  readonly feePercent = 0.008;
  async charge(request: PaymentRequest): Promise&lt;PaymentResult&gt; {
    const transactionId = await bankGateway.initiateTransfer(request.accountId, request.amount);
    return { success: true, transactionId, feePercent: this.feePercent };
  }
}

// Never edited again: it doesn't know or care which gateway it was handed.
async function processPayment(
  gateway: PaymentGateway,
  request: PaymentRequest
): Promise&lt;PaymentResult&gt; {
  return gateway.charge(request);
}

// The one place a string still needs to become a concrete gateway — pure wiring, no business logic.
const gateways: Record&lt;PaymentMethod, PaymentGateway&gt; = {
  credit_card: new CreditCardGateway(),
  paypal: new PaypalGateway(),
  bank_transfer: new BankTransferGateway(),
};
</code></pre>
<p>Adding Apple Pay now means writing one new class, <code>ApplePayGateway implements PaymentGateway</code>, and adding one entry to the <code>gateways</code> map — <code>processPayment</code> itself never changes again, and none of the three existing gateway classes are touched or put at risk. Notice the honest boundary here: the <code>gateways</code> registry does grow by one line per new method, but that line is data (an object literal mapping a string to an instance), not business logic — the actual charge behavior, fee calculation, and dispatch function are all genuinely closed. That's the realistic shape of OCP in practice: the logic stops changing; a small, inspectable piece of composition wiring is the only thing that still grows, and it grows by addition, never by editing an existing branch.</p>
<p>Also notice what this refactor deliberately left alone: <code>PaymentRequest</code>'s <code>amount</code> field is still a plain <code>number</code>, not wrapped in some extensible <code>Money</code> abstraction with pluggable currency-conversion strategies. Nothing in this system currently needs more than one currency behavior — abstracting that axis today would be the premature-abstraction mistake the caveat above warns about, applied to an axis that isn't actually varying yet.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">State the Open/Closed Principle precisely. What's the difference between Meyer's original version and the one most people mean today?</div>
<div class="qa-a">
<p>A module should be open for extension but closed for modification: new behavior should be addable without editing existing, working code. Bertrand Meyer, who coined the term in 1988, achieved this through <strong>inheritance</strong> — a base class ships and is closed to edits; new behavior comes from subclassing it. Robert C. Martin's later, more widely used reinterpretation achieves it through <strong>polymorphism against an explicit interface</strong>: calling code depends only on an abstraction, every concrete implementation is an interchangeable peer, and a new requirement is met by adding a new class that implements the interface — without touching the interface, any existing implementation, or any code that calls through it. Martin's version is the one almost everyone means by OCP in modern object-oriented code, and it's the version that pairs directly with the Strategy pattern and with Dependency Inversion.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you recognize an OCP violation in a code review?</div>
<div class="qa-a">
<p>Look for a <code>switch</code> or <code>if-else</code> chain keyed on a type/kind discriminator whose set of cases is expected to keep growing — especially one with a <code>default: throw new Error('unknown ...')</code> branch, which all but announces that new cases are coming. Red flags that make it worse: the same discriminator switched on in more than one function across the codebase (so one new case means several coordinated edits), and commit history showing the same function repeatedly touched only to add a case. The fix is always the same shape: extract an interface for the one behavior that varies, give each case its own class, and dispatch through the interface instead of branching on the type.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Doesn't OCP conflict with YAGNI? When should you deliberately not apply it?</div>
<div class="qa-a">
<p>They're in real tension, and that's fine — OCP says "make this easy to extend," YAGNI says "don't build extensibility you don't need yet," and the right call depends on whether the variation is real. Apply OCP where there's already a switch with several cases and a visible trend of growing, or where a second concrete implementation already exists or is clearly imminent. Don't apply it to a field or behavior that has exactly one implementation today with no second one in sight — wrapping it in an interface "for future flexibility" pays the full cost of indirection (an extra file, an extra layer to read through, a contract to keep in sync) for a change that may never come. The practical rule: abstract the axis that is demonstrably varying, leave every other axis as plain, concrete code until it starts varying for real.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Is every switch statement an OCP violation?</div>
<div class="qa-a">
<p>No. A switch over a genuinely fixed, closed set of values — the seven days of the week, the four suits in a deck of cards — isn't an OCP problem, because there is no "new case" ever coming; there's nothing to keep the switch open <em>for</em>. The violation is specifically an open-ended, business-driven set of cases (payment methods, shape types, notification channels) being handled with a closed-ended mechanism that has to be edited every time the business adds one. The question to ask isn't "is this a switch statement" — it's "will someone need to add a new case to this list, and if so, does adding it mean editing this function."</p>
</div>
</div>
`}

]});
