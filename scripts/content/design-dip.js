window.PREP_SITE.registerTopic({
  id: "design-dip",
  module: "design",
  title: "D · Dependency Inversion",
  estimatedReadTime: "14 min",
  tags: ["design","solid","oop","dip","dependency-injection","clean-code"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>High-level modules should not depend on low-level modules — both depend on abstractions; abstractions don't depend on details, details depend on abstractions.</strong> It's a rule about which direction the dependency <em>arrow</em> points.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>DIP is not Dependency Injection.</strong> DIP is the <em>principle</em> (depend on an abstraction, not a concretion); DI is a <em>technique</em> (pass a dependency in instead of constructing it). This is the single most common mix-up.</li>
    <li>You can do <strong>DI and still violate DIP</strong> (inject a concrete class and you're still coupled to it), and you can <strong>satisfy DIP without any DI framework</strong> (a plain factory or manual wiring). DI is just the most convenient way to satisfy DIP.</li>
    <li><strong>"High-level" vs "low-level" = policy vs mechanism</strong>, not architectural layers or folders. Policy is your business rules (stable, specific to you); mechanism is a replaceable technical detail — a payment SDK, DB driver, HTTP client (volatile, generic).</li>
    <li>The naive direction causes <strong>rigidity</strong> (swapping a vendor means editing business logic) and <strong>untestability</strong> (no seam to substitute a fake).</li>
    <li>The immediate payoff is <strong>testability</strong>: a class depending on an injected abstraction is tested against a fake in milliseconds, with zero network and zero real infrastructure.</li>
    <li><strong>What's actually "inverted": who owns the abstraction.</strong> The interface belongs to the high-level module, shaped around what <em>it</em> needs — the low-level detail is what bends to fit, the opposite of letting the vendor's SDK dictate the shape.</li>
    <li>The fix is a sequence: <strong>(1)</strong> define the interface next to the policy, shaped around its needs; <strong>(2)</strong> make the low-level class implement it; <strong>(3)</strong> inject the abstraction (usually via constructor); <strong>(4)</strong> wire the concretion at a single <strong>composition root</strong> — nowhere else imports the concrete class.</li>
    <li>Mental picture: the high-level module defines the <strong>socket</strong>; any low-level detail is a <strong>plug</strong> built to fit it.</li>
    <li>Where the other four SOLID principles mostly shape a <strong>single class</strong>, DIP is <strong>structural</strong>: a rule about which way a dependency <em>arrow</em> may point (Robert C. Martin's two-part statement in the one-liner above).</li>
    <li>Mantra: <strong>"Depend on an interface you own, not a class someone else wrote — and never hand-<code>new</code> a concrete dependency inside the class that needs it."</strong></li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Conflating DIP with Dependency Injection.</strong> Injecting a dependency via the constructor is DI, but if the injected type is a concrete class (<code>constructor(private stripe: StripeClient)</code>), you've done DI and still violated DIP — the high-level module is still coupled to the vendor's exact shape. DIP is only satisfied when the dependency is an <em>abstraction the high-level module owns</em>.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"DIP is about dependency direction — depend on an abstraction you own, not a concretion someone else wrote. DI is just a technique for satisfying it, not a synonym."</div>
  <div class="revision-say">"High-level and low-level mean policy versus mechanism, not layers — a domain class that hard-codes a vendor SDK is coupling policy to mechanism no matter which folder it lives in."</div>
  <div class="revision-say">"The inversion is about ownership: the interface is shaped by and for the high-level side, so the vendor's SDK vocabulary never leaks into the domain — and the payoff shows up immediately as testability."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The naive direction, and why it hurts</h3>
<p>Without DIP, dependencies tend to point the way code naturally gets written: a high-level class that describes a business workflow reaches out and directly constructs the low-level, technical thing it needs — a checkout service <code>new</code>s a payment SDK client, a report generator <code>new</code>s a PDF library, a domain service <code>new</code>s a database driver. The source-code dependency arrow and the runtime call arrow both point from policy straight into mechanism. This looks harmless in a small codebase, but it causes two specific, compounding problems:</p>
<ul>
  <li><strong>Rigidity.</strong> Swapping the low-level detail — moving from Stripe to a different payment processor, from one SQL driver to another — means editing the high-level class itself, even though the business logic it contains hasn't actually changed at all.</li>
  <li><strong>Untestability.</strong> A unit test for the high-level workflow can't isolate it from the low-level detail, because the high-level class built that detail itself, internally, with no seam to intercept. The test ends up exercising a real network call, a real database, or a pile of brittle mocking of a class it doesn't own — none of which has anything to do with the business rule the test is supposed to verify.</li>
</ul>

<h3>Depend on abstractions, not concretions — and who owns the abstraction matters</h3>
<p>DIP's fix is to insert an abstraction — an interface — between the high-level policy and the low-level detail, and then to make <em>both sides</em> depend on that abstraction instead of on each other directly. The detail implements the interface; the policy calls the interface. That much is sometimes taught in isolation, but the part that actually makes it "inversion" and not just "add an interface" is <strong>who owns the interface</strong>: it belongs to the high-level module, shaped around what the high-level module needs — not to the low-level library, shaped around whatever that library's author happened to expose. The low-level detail now has to conform to a contract someone else wrote. That's the direction that's been inverted relative to the naive version, where the low-level library dictated the shape and the high-level code simply adapted to it.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Policy and mechanism, not "top" and "bottom"</h3>
<p>"High-level" and "low-level" are easy to misread as layers in a diagram — UI on top, database on the bottom. That's not what DIP means. A high-level module is <strong>policy</strong>: the rules that make your application what it is — "an order is paid once the customer's card is charged," "a discount applies if the cart exceeds $50." A low-level module is <strong>mechanism</strong>: a specific, replaceable technical means of carrying out a detail of that policy — which payment processor, which SQL dialect, which HTTP client library. Policy is stable and specific to your business; mechanism is volatile and generic to the industry. DIP says the stable thing should never be forced to depend on the volatile thing.</p>

<h3>The plug-and-socket picture</h3>
<p>A useful physical analogy: the high-level module defines the <strong>socket</strong> — the shape of the interface it needs, sized and shaped for its own purposes. Any low-level detail that wants to plug into that policy has to be built as a <strong>plug</strong> that fits the socket the policy defined. Nothing about the socket's shape comes from any particular manufacturer's plug; if you switch manufacturers, you build a new plug to the same socket, and the wall wiring — the high-level policy — never changes.</p>

<h3>DIP the principle vs. DI the technique — keep them separate</h3>
<p>DIP is a statement about <strong>dependency direction</strong>: does the high-level module depend on an abstraction it owns, or on a concretion it doesn't? Dependency Injection is a statement about <strong>wiring mechanics</strong>: how does an object get handed the dependency it needs — through a constructor parameter, a setter, or a DI container — instead of instantiating it itself? These answer different questions, and satisfying one says nothing about the other:</p>
<ul>
  <li>You can use DI and still violate DIP: <code>constructor(private stripe: StripeClient) {}</code> injects the dependency, but <code>StripeClient</code> is still a concrete class, so the high-level module is still coupled directly to Stripe's SDK shape.</li>
  <li>You can satisfy DIP without a DI framework: a plain factory function that returns an object built to an interface, or manual wiring in a single composition script, satisfies DIP just as well as a container does — DIP only cares that the dependency is an abstraction the high-level module owns, not about the mechanics of how it arrives.</li>
</ul>
<p>DI is simply the most common, most convenient technique for satisfying DIP in practice — which is exactly why the two get conflated. They are not interchangeable terms.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>How to spot a violation</h3>
<ul>
  <li><strong>A high-level class directly <code>new</code>s a concrete low-level class inside itself.</strong> The single clearest tell — look for a <code>private client = new SomeVendorSdk(...)</code> field or a <code>new</code> expression buried inside a business-logic method.</li>
  <li><strong>Business logic imports a vendor or infrastructure type by name.</strong> A domain class's imports list a specific SDK, ORM class, or HTTP library directly, rather than an interface describing only the capability it needs.</li>
  <li><strong>Tests require real infrastructure or heavy mocking of a class you don't own.</strong> If exercising a business rule means hitting a real network, spinning up a real database, or writing brittle mocks against a third-party SDK's internals, the class under test has no seam — no abstraction — to substitute a fake through.</li>
  <li><strong>Changing vendors means editing business logic.</strong> If switching payment processors, cloud providers, or database engines requires touching the class that contains the checkout or pricing rules, the policy and the mechanism are welded together.</li>
</ul>

<h3>The fix: define the abstraction where the policy lives, then inject the detail</h3>
<p>The repair is a specific sequence, not just "add an interface somewhere":</p>
<ul>
  <li><strong>1. Define the interface next to the high-level module, shaped around its needs.</strong> Ask "what does the policy actually need to call?" — not "what does the vendor's SDK already expose?" The interface belongs conceptually to the high-level side.</li>
  <li><strong>2. Make the low-level class implement that interface.</strong> The concrete detail (a Stripe wrapper, a Postgres repository) now has to conform to a contract it doesn't get to design.</li>
  <li><strong>3. Inject the abstraction into the high-level class</strong> — typically via the constructor. This is the Dependency Injection step: the class stops constructing its own dependency and starts receiving it.</li>
  <li><strong>4. Wire the concrete implementation at a single composition root.</strong> Somewhere — an app's entry point, a bootstrap module — one place is allowed to know that <code>StripeGateway</code> exists and to hand a <code>new StripeGateway()</code> to whatever needs a <code>PaymentGateway</code>. Nowhere else in the codebase should import the concrete class at all.</li>
</ul>
<p>Once this is in place, a test can hand the high-level class a fake or mock implementation of the interface instead of the composition root's real one — no network, no real infrastructure, no change to the class under test.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Before: OrderService constructs its own concrete payment client</h3>
<pre><code class="language-typescript">class StripeClient {
  private sdk = new Stripe(process.env.STRIPE_SECRET_KEY!);

  async charge(amountCents: number, cardToken: string): Promise&lt;{ id: string; status: string }&gt; {
    return this.sdk.charges.create({ amount: amountCents, source: cardToken });
  }
}

class OrderService {
  // Hard-wired concretion — built inside the exact class that needs it
  private stripe = new StripeClient();

  async placeOrder(order: { totalCents: number; cardToken: string }): Promise&lt;Order&gt; {
    const payment = await this.stripe.charge(order.totalCents, order.cardToken);
    return { id: payment.id, status: 'paid', totalCents: order.totalCents };
  }
}
</code></pre>
<p><code>OrderService</code> is high-level policy — "how a checkout gets paid" — but it has a hard compile-time and runtime dependency on a specific low-level mechanism: Stripe's SDK, imported and instantiated right inside it. Two consequences follow directly: swapping to a different payment processor means editing <code>OrderService</code> itself, even though none of its actual business rules changed; and no test can call <code>placeOrder</code> without either making a real call out to Stripe or reaching in to monkey-patch a private field — the class offers no seam to substitute anything.</p>

<h3>After: OrderService depends on an abstraction it owns; Stripe becomes just one implementation</h3>
<pre><code class="language-typescript">// PaymentGateway is the abstraction — defined and owned by the high-level side,
// shaped around what OrderService needs, not around whatever Stripe's SDK exposes.
interface PaymentGateway {
  charge(amountCents: number, cardToken: string): Promise&lt;{ id: string; status: string }&gt;;
}

// The detail now conforms to the policy's abstraction — this is the "inversion":
// StripeGateway implements an interface OrderService defined, not the other way around.
class StripeGateway implements PaymentGateway {
  private sdk = new Stripe(process.env.STRIPE_SECRET_KEY!);

  async charge(amountCents: number, cardToken: string): Promise&lt;{ id: string; status: string }&gt; {
    return this.sdk.charges.create({ amount: amountCents, source: cardToken });
  }
}

class OrderService {
  // Dependency Injection: the *technique* used here to satisfy DIP.
  // The gateway is received, never constructed inside this class.
  constructor(private gateway: PaymentGateway) {}

  async placeOrder(order: { totalCents: number; cardToken: string }): Promise&lt;Order&gt; {
    const payment = await this.gateway.charge(order.totalCents, order.cardToken);
    return { id: payment.id, status: 'paid', totalCents: order.totalCents };
  }
}

// Composition root — the one place allowed to know a concrete StripeGateway exists
const orderService = new OrderService(new StripeGateway());
</code></pre>
<p><code>OrderService</code> no longer imports or names Stripe anywhere. It depends only on <code>PaymentGateway</code>, a contract it owns. <code>StripeGateway</code> is one interchangeable plug that happens to fit that socket; a <code>PayPalGateway</code> or an <code>AdyenGateway</code> could implement the exact same interface and be swapped in at the composition root with zero change to <code>OrderService</code>.</p>

<h3>The payoff: a test with zero network, zero real Stripe</h3>
<pre><code class="language-typescript">class FakePaymentGateway implements PaymentGateway {
  public calls: Array&lt;{ amountCents: number; cardToken: string }&gt; = [];

  async charge(amountCents: number, cardToken: string): Promise&lt;{ id: string; status: string }&gt; {
    this.calls.push({ amountCents, cardToken });
    return { id: 'pay_test_123', status: 'succeeded' };
  }
}

test('placeOrder charges the gateway and returns a paid order', async () => {
  const fakeGateway = new FakePaymentGateway();
  const orderService = new OrderService(fakeGateway);

  const result = await orderService.placeOrder({ totalCents: 4200, cardToken: 'tok_test' });

  expect(result.status).toBe('paid');
  expect(fakeGateway.calls).toEqual([{ amountCents: 4200, cardToken: 'tok_test' }]);
});
</code></pre>
<p>This test never touches Stripe, never opens a socket, and runs in milliseconds. Nothing about <code>OrderService</code> had to change to make it testable this way — swapping <code>FakePaymentGateway</code> in at the call site is enough, because <code>OrderService</code> only ever knew about the <code>PaymentGateway</code> interface, never about Stripe. That seam is the concrete, day-to-day payoff of DIP: testability without mocking frameworks fighting a concrete SDK's internals.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
<div class="qa-q">Isn't Dependency Inversion just another name for Dependency Injection?</div>
<div class="qa-a">
<p>No — they answer different questions, and conflating them is the most common mistake with this principle. DIP is about <strong>direction</strong>: does a high-level module depend on an abstraction it owns, or on a concrete low-level class? DI is about <strong>mechanics</strong>: how a dependency gets handed to an object — constructor, setter, or container — instead of that object building it internally. You can use DI and still violate DIP: <code>constructor(private stripe: StripeClient) {}</code> injects the dependency, but <code>StripeClient</code> is a concretion, so the high-level module is still coupled to Stripe's exact shape. Conversely, you can satisfy DIP with a plain factory function and no DI framework at all. DI is simply the most common technique for satisfying DIP — not a synonym for it.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What do "high-level module" and "low-level module" actually mean here?</div>
<div class="qa-a">
<p>Policy vs. mechanism, not architectural layers or folder position. A high-level module is business logic — the rules that define what your application does, like "an order is paid once its charge succeeds." A low-level module is a technical implementation detail — a payment SDK, a database driver, an HTTP client — the specific, replaceable "how." It has nothing to do with which layer of a stack a class sits in; a class deep in an infra folder can still be "high-level" if it encodes a business rule, and a class in a domain folder that hard-codes a specific vendor SDK is still coupling policy to mechanism.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What does it mean that the abstraction is "owned by" the high-level module, and why does that ownership matter?</div>
<div class="qa-a">
<p>Ownership determines who gets to dictate the interface's shape. If <code>PaymentGateway</code> is defined alongside <code>OrderService</code> and shaped around exactly what checkout needs, then any payment vendor has to conform to <em>that</em> shape to plug in — Stripe's SDK vocabulary never leaks into the domain. If instead the "abstraction" were just Stripe's own SDK interface re-exported, the high-level module would still be shaped by a low-level vendor's design choices, and swapping vendors would still ripple back into the domain layer. That's why "depend on abstractions" alone isn't the full principle — the abstraction has to be designed by and for the high-level side; the detail is what bends to fit it, which is exactly the inversion the principle's name refers to.</p>
</div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Walk me through fixing a DIP violation step by step.</div>
  <div class="qa-answer">
    <p>It is a specific sequence, not just "add an interface somewhere". (1) Define the interface next to the high-level module, shaped around what the policy actually needs to call, not around what the vendor SDK exposes. (2) Make the low-level class (a Stripe wrapper, a Postgres repository) implement that interface. (3) Inject the abstraction into the high-level class, typically via the constructor; this is the DI step. (4) Wire the concrete implementation at a single <strong>composition root</strong>, such as the app's entry point or a bootstrap module: that is the one place allowed to know <code>StripeGateway</code> exists and hand it to whatever needs a <code>PaymentGateway</code>. Nowhere else in the codebase should import the concrete class.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q5. Why is testability the most immediate payoff of DIP?</div>
  <div class="qa-answer">
    <p>A class that directly <code>new</code>s its own concrete dependency has no seam: a unit test of its business rule ends up exercising a real network call or real database, or brittle mocks of a third-party SDK it doesn't own. Once the class depends on an injected abstraction it owns, a test can hand it a fake or mock implementation of that interface instead of the composition root's real one. The test runs in milliseconds, with zero network calls, zero real infrastructure, and no change to the class under test.</p>
  </div>
</div>
` },

  ]
});
