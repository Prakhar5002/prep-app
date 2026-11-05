window.PREP_SITE.registerTopic({
  id: "lld-patterns",
  module: "lld",
  title: "Design Patterns for LLD",
  estimatedReadTime: "34 min",
  tags: ["lld","design-patterns","gof","strategy","observer","state","factory","decorator","adapter","typescript"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">A design pattern is a <strong>named answer to a recurring force</strong>; in LLD you pick it because a requirement varies, reacts, wraps or sequences in a specific way, and you <strong>say the force before the pattern</strong>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>The toolkit:</strong> about thirteen Gang-of-Four patterns — creational (Factory, Builder, Singleton), structural (Adapter, Decorator, Facade, Proxy), behavioural (Strategy, Observer, State, Command, Chain of Responsibility, Template Method). A pattern you cannot tie to a requirement is a pattern you should not draw.</li>
    <li><strong>Creational:</strong> Factory hides which class is built (registry beats a growing switch); Builder assembles complex immutable objects with cross-field validation; Singleton means one instance, which you should create once and <em>inject</em>.</li>
    <li><strong>Singleton pitfalls:</strong> hidden dependency, shared test state, one per <em>process</em> (not per system), and duplicate copies via multiple package versions or ESM/CJS.</li>
    <li><strong>Wrapper family:</strong> Adapter = different interface (make it fit); Decorator = same interface + behaviour, stackable; Proxy = same interface + access control (cache, auth, lazy); Facade = new simpler interface over many subsystems.</li>
    <li><strong>Strategy vs State:</strong> identical diagram; strategies are chosen from outside and ignore each other, states switch themselves after events.</li>
    <li><strong>Observer</strong> is in-process fan-out; isolate handler errors, iterate over a copy, unsubscribe. Pub/sub adds a broker and delivery semantics.</li>
    <li><strong>Command</strong> turns requests into objects for undo, queues and replay; capture undo data at execute time; non-invertible actions need compensation.</li>
    <li><strong>Chain of Responsibility</strong> passes requests along handlers (ATM dispenser, middleware, interceptors); always have a terminal handler; greedy chains can miss valid solutions.</li>
    <li><strong>Template Method</strong> fixes a skeleton via inheritance; prefer Strategy when steps vary independently. Never call overridable methods from a JS constructor (subclass fields are not set yet).</li>
    <li><strong>Decorator order matters:</strong> cache outside retry for reads; timeout inside retry bounds each attempt; never cache side-effecting calls, use idempotency keys instead.</li>
    <li><strong>Idiomatic TS:</strong> strategies as functions, decorators as higher-order functions, commands as closures, observers via <code>EventEmitter</code>, singletons as module exports.</li>
    <li><strong>Problem map:</strong> parking lot = Strategy + Factory + Observer + Decorator + Facade; vending machine and elevator = State; editor = Command; ATM = Chain; importers = Template Method + Adapter.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Pattern stuffing:</strong> announcing Singleton, Factory and Observer before the requirements are known, or adding a Strategy with one implementation and no stated variation. It reads as memorisation and adds indirection the design cannot justify. Fix: tie every pattern to a sentence in the requirements, and for speculative ones say "if this starts to vary, I would extract a Strategy here".</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Pricing varies by lot and changes over time, so pricing is a Strategy behind an interface; a new rule is a new class and one line of wiring."</div>
  <div class="revision-say">"Strategy and State have the same diagram; the difference is that a strategy is picked from outside while a state transitions itself after events."</div>
  <div class="revision-say">"I want one instance of this, but not global access to it, so I create it at the composition root and inject it; and I remember that 'one' is per process."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Where patterns come from</h3>
<p>The 1994 book <em>Design Patterns: Elements of Reusable Object-Oriented Software</em> by Gamma, Helm, Johnson and Vlissides (the "Gang of Four", GoF) catalogued 23 patterns from C++ and Smalltalk codebases. Each entry has a name, the problem (force) it addresses, a structure, and consequences. The value was never the code; it was the <strong>shared vocabulary</strong>. "Wrap the SDK in an adapter and put a retry decorator around it" communicates a design in one sentence.</p>

<h3>Why they matter in an LLD interview</h3>
<ul>
  <li><strong>Compression.</strong> Naming a pattern lets the interviewer skip the explanation and probe the interesting part (why Strategy and not a switch?).</li>
  <li><strong>Experience signal.</strong> Candidates who have maintained real code recognise the forces: "this is going to need a new pricing rule every quarter".</li>
  <li><strong>Extensibility on demand.</strong> Most follow-ups ("add EV charging", "add WhatsApp as a channel", "support undo") are designed to land on a pattern-shaped seam. If the seam exists, the follow-up is a new class.</li>
</ul>

<h3>Why they can hurt you</h3>
<p>Interviewers penalise <strong>pattern stuffing</strong>: Singleton, Factory, Builder and Observer announced before the requirements are known, or a <code>PricingStrategyFactoryProvider</code> for a problem with one price. Each pattern adds indirection; indirection is a cost that must be paid for by a real variation point.</p>

<h3>Patterns in TypeScript are often lighter</h3>
<p>Many GoF patterns exist to work around missing language features in 1990s C++ and Java. Peter Norvig argued in 1996 that most of the 23 become simpler or invisible in dynamic languages with first-class functions. In TypeScript:</p>
<table>
  <thead><tr><th>Pattern</th><th>Class form (GoF)</th><th>Idiomatic TS form</th></tr></thead>
  <tbody>
    <tr><td>Strategy</td><td>Interface + one class per algorithm</td><td>A function type: <code>type Pricing = (mins: number) =&gt; number</code></td></tr>
    <tr><td>Command</td><td>Interface with <code>execute()</code></td><td>A closure, or a plain action object (Redux)</td></tr>
    <tr><td>Observer</td><td>Subject + Observer interfaces</td><td><code>EventEmitter</code>, a typed emitter, RxJS</td></tr>
    <tr><td>Singleton</td><td>Private constructor + <code>getInstance()</code></td><td>An exported instance: ES modules evaluate once per module graph</td></tr>
    <tr><td>Decorator</td><td>Wrapper class implementing the same interface</td><td>Higher-order function: <code>withRetry(fn)</code></td></tr>
    <tr><td>Iterator</td><td>Iterator class</td><td>Built in: generators and <code>for...of</code></td></tr>
  </tbody>
</table>
<p>In an LLD interview, prefer the <strong>class form</strong> when the strategy has more than one method, holds state, or needs a name on the class diagram; mention the function form to show you know it. In production TS, the lighter form is often better.</p>

<h3>Patterns you already use in React Native</h3>
<ul>
  <li><strong>Decorator:</strong> a higher-order component wraps a component and adds behaviour with the same props interface.</li>
  <li><strong>Observer:</strong> <code>AppState.addEventListener</code>, <code>NetInfo</code> listeners, store subscriptions (Redux <code>subscribe</code>, Zustand).</li>
  <li><strong>Command:</strong> Redux actions are commands as data; replaying them is how devtools time-travel.</li>
  <li><strong>Chain of Responsibility:</strong> Axios interceptors and Redux middleware pass a request along a chain.</li>
  <li><strong>Strategy:</strong> passing <code>renderItem</code> or <code>keyExtractor</code> into <code>FlatList</code>.</li>
  <li><strong>Facade:</strong> a <code>useAuth()</code> hook hiding tokens, refresh and storage behind three functions.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Three families, three questions</h3>
<div class="diagram">
<pre>
  CREATIONAL             STRUCTURAL                 BEHAVIOURAL
  "how is it made?"      "how is it wrapped or      "who decides, and who
                          composed?"                 reacts?"
  ─────────────────      ─────────────────────      ─────────────────────────
  Factory                Adapter   (convert)        Strategy  (swap a rule)
  Builder                Decorator (add)            State     (behaviour by state)
  Singleton              Proxy     (guard)          Observer  (fan-out events)
                         Facade    (simplify)       Command   (request as object)
                                                    Chain     (pass along)
                                                    Template  (fixed skeleton)
</pre>
</div>

<h3>The wrapper family: same shape, different intent</h3>
<p>Adapter, Decorator and Proxy all hold a reference to another object and forward calls to it; Facade holds several. Interviewers love asking you to tell them apart, and the answer is always <strong>intent and interface</strong>:</p>
<div class="diagram">
<pre>
  Adapter     Client ──► [ Target iface ]──wraps──► Adaptee (DIFFERENT iface)
  Decorator   Client ──► [ Same iface   ]──wraps──► Real  (same iface)  + extra behaviour
  Proxy       Client ──► [ Same iface   ]──wraps──► Real  (same iface)  access control
  Facade      Client ──► [ New, simpler ]──uses───► Subsystem A, B, C
</pre>
</div>
<table>
  <thead><tr><th>Pattern</th><th>Interface it exposes</th><th>Intent</th><th>Stacks?</th></tr></thead>
  <tbody>
    <tr><td>Adapter</td><td>The one the client expects (different from the wrapped one)</td><td>Make an incompatible thing fit</td><td>Rarely</td></tr>
    <tr><td>Decorator</td><td>Same as the wrapped one</td><td>Add responsibilities (retry, log, surcharge)</td><td>Yes, by design</td></tr>
    <tr><td>Proxy</td><td>Same as the wrapped one</td><td>Control access (cache, auth, lazy, remote)</td><td>Occasionally</td></tr>
    <tr><td>Facade</td><td>A new, smaller one</td><td>Simplify a subsystem for common use cases</td><td>No</td></tr>
  </tbody>
</table>

<h3>The polymorphism family: who picks the behaviour?</h3>
<table>
  <thead><tr><th>Pattern</th><th>Who chooses the implementation</th><th>When it changes</th><th>Mechanism</th></tr></thead>
  <tbody>
    <tr><td>Strategy</td><td>The client or configuration, from outside</td><td>At wiring time, occasionally at runtime</td><td>Composition</td></tr>
    <tr><td>State</td><td>The object itself, as a result of its own transitions</td><td>Constantly, after events</td><td>Composition</td></tr>
    <tr><td>Template Method</td><td>The subclass, fixed at compile time</td><td>Never at runtime</td><td>Inheritance</td></tr>
    <tr><td>Command</td><td>Whoever creates the command; the invoker just runs it</td><td>Per request</td><td>Composition</td></tr>
  </tbody>
</table>
<p>Strategy and State have the <em>identical</em> class diagram (a context holding an interface reference). The difference is that strategies do not know about each other, while states trigger transitions to other states.</p>

<h3>From force to pattern: the lookup you run in your head</h3>
<div class="diagram">
<pre>
  "rule X varies by config / will change"        ──►  Strategy   (+ Factory to pick it)
  "behaviour depends on status; illegal moves"   ──►  State
  "when X happens, several things must react"    ──►  Observer
  "third-party / legacy API has the wrong shape" ──►  Adapter
  "add retry / logging / caching without edits"  ──►  Decorator (or Proxy for access)
  "callers need one simple entry point"          ──►  Facade
  "undo, queue, schedule, or log requests"       ──►  Command
  "try handlers in order until one copes"        ──►  Chain of Responsibility
  "same steps, a few differ per variant"         ──►  Template Method
  "complex object, many optional parts"          ──►  Builder
  "caller should not name the concrete class"    ──►  Factory
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Using more patterns shows more seniority." Seniority shows in <em>restraint</em>: knowing that a single pricing rule does not need a Strategy yet, and saying "if pricing starts to vary I would extract a <code>PricingStrategy</code> here" instead. Naming the seam you would add later scores as well as adding it, at none of the complexity cost.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>Each pattern below has its intent, TypeScript code, the LLD problems that use it, and its main pitfall. Money is in integer paise throughout.</p>

<h3>Creational 1: Factory</h3>
<p><strong>Intent:</strong> centralise the decision of <em>which concrete class</em> to instantiate, so callers depend only on an interface. A registry-based factory is open for extension: a new type is one <code>register</code> call, not an edit to a <code>switch</code>.</p>
<pre><code class="language-ts">enum PaymentMethod { CASH = 'CASH', CARD = 'CARD', UPI = 'UPI' }

interface PaymentProcessor {
  pay(amountPaise: number, reference: string): Promise&lt;{ ok: boolean; txnId?: string }&gt;;
}

class CashProcessor implements PaymentProcessor {
  async pay(_amount: number, reference: string) { return { ok: true, txnId: 'cash-' + reference }; }
}
class CardProcessor implements PaymentProcessor {
  constructor(private readonly terminalId: string) {}
  async pay(amountPaise: number, reference: string) {
    // talk to the card terminal here
    return { ok: true, txnId: this.terminalId + '-' + reference };
  }
}

class PaymentProcessorFactory {
  private readonly creators = new Map&lt;PaymentMethod, () =&gt; PaymentProcessor&gt;();

  register(method: PaymentMethod, create: () =&gt; PaymentProcessor): this {
    this.creators.set(method, create);
    return this;
  }

  create(method: PaymentMethod): PaymentProcessor {
    const create = this.creators.get(method);
    if (!create) throw new Error('Unsupported payment method: ' + method);
    return create();
  }
}

// composition root: the only place that names concrete classes
const processors = new PaymentProcessorFactory()
  .register(PaymentMethod.CASH, () =&gt; new CashProcessor())
  .register(PaymentMethod.CARD, () =&gt; new CardProcessor('T-07'));</code></pre>
<p><strong>Variants to name:</strong> <em>Simple factory</em> (above). <em>Factory Method</em> (GoF): a base class declares <code>protected abstract createChannel()</code> and subclasses decide. <em>Abstract Factory</em>: one factory creates a <em>family</em> of related objects that must match (a light-theme factory creates Button and Card that fit together; a per-cloud factory creates Queue and BlobStore for the same provider).<br>
<strong>Used in:</strong> parking-lot exit payment by method; notification channel by user preference (<a href="#/topic/lld-notification">Case: Notification Service</a>); rate-limit algorithm by config (<a href="#/topic/lld-rate-limiter">Case: Rate Limiter</a>).<br>
<strong>Pitfall:</strong> a factory that returns <code>any</code> or a union, forcing callers to downcast, defeats the purpose.</p>

<h3>Creational 2: Builder</h3>
<p><strong>Intent:</strong> construct a complex, usually immutable object step by step, validating the combination at the end.</p>
<pre><code class="language-ts">interface OrderItem { sku: string; qty: number; unitPaise: number }

class Order {
  constructor(
    readonly id: string,
    readonly customerId: string,
    readonly items: ReadonlyArray&lt;OrderItem&gt;,
    readonly couponCode: string | null,
    readonly deliveryNote: string | null,
    readonly scheduledFor: Date | null,
  ) {}
  totalPaise(): number { return this.items.reduce((sum, i) =&gt; sum + i.qty * i.unitPaise, 0); }
}

class OrderBuilder {
  private readonly items: OrderItem[] = [];
  private couponCode: string | null = null;
  private deliveryNote: string | null = null;
  private scheduledFor: Date | null = null;

  constructor(private readonly id: string, private readonly customerId: string) {}

  addItem(sku: string, qty: number, unitPaise: number): this {
    if (qty &lt;= 0) throw new Error('qty must be positive');
    this.items.push({ sku, qty, unitPaise });
    return this;
  }
  withCoupon(code: string): this { this.couponCode = code; return this; }
  withNote(note: string): this { this.deliveryNote = note; return this; }
  scheduleFor(at: Date): this { this.scheduledFor = at; return this; }

  build(): Order {
    if (this.items.length === 0) throw new Error('An order needs at least one item');
    if (this.scheduledFor &amp;&amp; this.couponCode === 'INSTANT10') {
      throw new Error('INSTANT10 is not valid for scheduled orders');      // cross-field rule
    }
    return new Order(this.id, this.customerId, [...this.items],          // copy: builder reuse is safe
      this.couponCode, this.deliveryNote, this.scheduledFor);
  }
}

const order = new OrderBuilder('O-1', 'U-7')
  .addItem('PIZZA-M', 2, 34900)
  .withCoupon('WELCOME50')
  .build();</code></pre>
<p><strong>In TypeScript</strong> an options object (<code>new Order({ id, items, couponCode })</code>) with optional fields often replaces a builder. Builder earns its place when construction is incremental (items added in a loop), when validation spans fields, or when the type system should track which steps are done (see the typed builder in <a href="#/topic/ts-patterns">TypeScript Common Patterns</a>).<br>
<strong>Used in:</strong> food-delivery orders, notification messages with optional attachments, query objects, test-data builders.<br>
<strong>Pitfall:</strong> returning the builder's internal array from <code>build()</code>, so reusing the builder mutates an "immutable" order.</p>

<h3>Creational 3: Singleton (and its pitfalls)</h3>
<p><strong>Intent:</strong> guarantee one instance and give global access to it.</p>
<pre><code class="language-ts">// GoF form
class IdGenerator {
  private static instance: IdGenerator | null = null;
  private counter = 0;
  private constructor() {}

  static getInstance(): IdGenerator {
    if (!IdGenerator.instance) IdGenerator.instance = new IdGenerator();
    return IdGenerator.instance;
  }
  next(prefix: string): string { return prefix + '-' + (++this.counter); }
}

// Idiomatic TS: a module is evaluated once per module graph, so an exported instance
// is already a singleton (ids.ts):   export const ids = new SequentialIds();

// What to do in an LLD answer: create ONE instance at the composition root and inject it
interface Ids { next(prefix: string): string }
class SequentialIds implements Ids {
  private counter = 0;
  next(prefix: string): string { return prefix + '-' + (++this.counter); }
}
// const lot = new ParkingLot(floors, pricing, new SequentialIds());</code></pre>
<p><strong>Why it is the most criticised pattern:</strong></p>
<ul>
  <li><strong>Hidden dependency.</strong> <code>IdGenerator.getInstance()</code> inside a method does not appear in the constructor, so readers and tests cannot see or replace it.</li>
  <li><strong>Global mutable state.</strong> Tests leak into each other through it; two parking lots in one test share ticket counters.</li>
  <li><strong>"One" is a lie at scale.</strong> It is one per process: every Node instance behind a load balancer, every warm Lambda container and every worker thread has its own. An in-memory singleton counter produces duplicate ids across instances.</li>
  <li><strong>Module duplication.</strong> Two versions of a package in <code>node_modules</code>, or the ESM/CommonJS dual-package hazard, give two "singletons". Jest isolates the module registry per test file.</li>
  <li><strong>Lazy-init races</strong> in multi-threaded languages (Java's double-checked locking needs <code>volatile</code>); not an issue for synchronous JS initialisation.</li>
</ul>
<p><strong>Used in (legitimately):</strong> configuration, a connection pool, a metrics registry: things that are expensive or must be shared. <strong>Say:</strong> "one instance, yes; global access, no: I inject it."</p>

<h3>Structural 1: Adapter</h3>
<p><strong>Intent:</strong> convert the interface of a class you cannot change into the interface your code expects.</p>
<pre><code class="language-ts">// What our domain wants
interface SmsSender {
  send(toE164: string, text: string): Promise&lt;{ messageId: string }&gt;;
}

// A vendor SDK with a different shape (fictional, for illustration)
declare class AcmeTelecomClient {
  constructor(apiKey: string);
  dispatch(
    payload: { msisdn: string; body: string; route: 'TXN' | 'PROMO' },
    callback: (err: Error | null, result?: { ref: string; status: number }) =&gt; void,
  ): void;
}

class AcmeSmsAdapter implements SmsSender {
  constructor(private readonly client: AcmeTelecomClient) {}

  send(toE164: string, text: string): Promise&lt;{ messageId: string }&gt; {
    const msisdn = toE164.replace('+', '');                       // vendor wants digits only
    return new Promise((resolve, reject) =&gt; {
      this.client.dispatch({ msisdn, body: text, route: 'TXN' }, (err, result) =&gt; {
        if (err) return reject(err);
        if (!result || result.status !== 0) {
          return reject(new Error('SMS rejected by vendor, status ' + result?.status));
        }
        resolve({ messageId: result.ref });
      });
    });
  }
}</code></pre>
<p>The adapter converts <em>everything</em> that differs: callback to Promise, phone format, status codes to errors, vendor ids to ours. Vendor types must not leak past it.<br>
<strong>Used in:</strong> every integration: SMS/email providers, payment gateways, a customer's legacy SOAP or CSV system (the bread and butter of FDE work).<br>
<strong>Pitfall:</strong> a leaky adapter that passes vendor error codes or units through, so the domain ends up with <code>if (err.code === 'ACME_42')</code>.</p>

<h3>Structural 2: Decorator</h3>
<p><strong>Intent:</strong> add responsibilities to an object at runtime by wrapping it in another object with the <em>same</em> interface. Decorators stack.</p>
<pre><code class="language-ts">interface Notifier { send(to: string, text: string): Promise&lt;void&gt;; }

class SmsNotifier implements Notifier {
  constructor(private readonly sms: SmsSender) {}
  async send(to: string, text: string): Promise&lt;void&gt; { await this.sms.send(to, text); }
}

class RetryingNotifier implements Notifier {
  constructor(private readonly inner: Notifier, private readonly attempts = 3, private readonly baseDelayMs = 200) {}

  async send(to: string, text: string): Promise&lt;void&gt; {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.inner.send(to, text);
      } catch (err) {
        if (attempt &gt;= this.attempts) throw err;
        const delay = this.baseDelayMs * 2 ** (attempt - 1) * (0.5 + Math.random() / 2); // backoff + jitter
        await new Promise(resolve =&gt; setTimeout(resolve, delay));
      }
    }
  }
}

class LoggingNotifier implements Notifier {
  constructor(private readonly inner: Notifier, private readonly log: (line: string) =&gt; void) {}

  async send(to: string, text: string): Promise&lt;void&gt; {
    const started = Date.now();
    try {
      await this.inner.send(to, text);
      this.log('sent to ' + to + ' in ' + (Date.now() - started) + 'ms');
    } catch (err) {
      this.log('FAILED to ' + to + ': ' + (err as Error).message);
      throw err;
    }
  }
}

// Order matters: logging OUTSIDE retry logs once per send; INSIDE it logs every attempt
// const notifier: Notifier = new LoggingNotifier(new RetryingNotifier(new SmsNotifier(sms)), console.log);</code></pre>
<p><strong>Used in:</strong> notification retry/logging/rate limiting, pricing surcharges (EV charging, weekend multiplier stacked on base pricing in <a href="#/topic/lld-parking-lot">Case: Parking Lot</a>), caching around a repository.<br>
<strong>Pitfall:</strong> a decorator that type-checks its inner object (<code>if (inner instanceof SmsNotifier)</code>) or changes the interface; the second one is an adapter.</p>

<h3>Structural 3: Facade</h3>
<p><strong>Intent:</strong> a single, simpler entry point over several collaborating subsystems, for the common use cases.</p>
<pre><code class="language-ts">interface Inventory {
  reserve(items: ReadonlyArray&lt;OrderItem&gt;): Promise&lt;string&gt;;    // reservation id
  commit(reservationId: string): Promise&lt;void&gt;;
  release(reservationId: string): Promise&lt;void&gt;;
}
interface OrderRepository { save(order: Order): Promise&lt;void&gt;; }

class CheckoutService {
  constructor(
    private readonly inventory: Inventory,
    private readonly processors: PaymentProcessorFactory,
    private readonly orders: OrderRepository,
    private readonly notifier: Notifier,
  ) {}

  async placeOrder(order: Order, method: PaymentMethod, phone: string): Promise&lt;string&gt; {
    const reservationId = await this.inventory.reserve(order.items);
    try {
      const payment = await this.processors.create(method).pay(order.totalPaise(), order.id);
      if (!payment.ok) throw new Error('Payment declined');
      await this.orders.save(order);
      await this.inventory.commit(reservationId);
    } catch (err) {
      await this.inventory.release(reservationId);                  // compensate, then rethrow
      throw err;
    }
    this.notifier.send(phone, 'Order ' + order.id + ' confirmed').catch(() =&gt; {}); // best effort
    return order.id;
  }
}</code></pre>
<p><strong>Used in:</strong> every LLD solution has one: <code>ParkingLotService</code>, <code>LibraryService</code>, <code>BookingService</code>. It is what the driver or controller calls.<br>
<strong>Pitfall:</strong> the facade accumulates business rules (pricing, limits) and becomes the god class. It should only sequence calls.</p>

<h3>Structural 4: Proxy</h3>
<p><strong>Intent:</strong> a stand-in with the same interface that <em>controls access</em> to the real object: caching proxy, protection (authorisation) proxy, virtual (lazy) proxy, remote proxy.</p>
<pre><code class="language-ts">interface Room { id: string; name: string; capacity: number }
interface RoomDirectory { getRoom(id: string): Promise&lt;Room | null&gt;; }

// Caching proxy
class CachingRoomDirectory implements RoomDirectory {
  private readonly cache = new Map&lt;string, { room: Room | null; expiresAt: number }&gt;();
  constructor(private readonly inner: RoomDirectory, private readonly ttlMs: number,
              private readonly now: () =&gt; number = Date.now) {}

  async getRoom(id: string): Promise&lt;Room | null&gt; {
    const hit = this.cache.get(id);
    if (hit &amp;&amp; hit.expiresAt &gt; this.now()) return hit.room;
    const room = await this.inner.getRoom(id);
    this.cache.set(id, { room, expiresAt: this.now() + this.ttlMs });
    return room;
  }
}

// Protection proxy
interface Booking { id: string; ownerId: string }
interface BookingApi { get(id: string): Promise&lt;Booking&gt;; cancel(id: string): Promise&lt;void&gt;; }

class AuthorizingBookingApi implements BookingApi {
  constructor(private readonly inner: BookingApi, private readonly user: { id: string; roles: string[] }) {}
  get(id: string): Promise&lt;Booking&gt; { return this.inner.get(id); }
  async cancel(id: string): Promise&lt;void&gt; {
    const booking = await this.inner.get(id);
    if (booking.ownerId !== this.user.id &amp;&amp; !this.user.roles.includes('ADMIN')) {
      throw new Error('FORBIDDEN');
    }
    return this.inner.cancel(id);
  }
}</code></pre>
<p><strong>Proxy vs Decorator:</strong> structurally identical. A proxy <em>controls access</em> and usually manages the subject's lifecycle or availability; a decorator <em>adds behaviour</em> and is designed to stack. State the intent and either name is accepted. JavaScript's built-in <code>Proxy</code> object is a different, meta-programming tool (property traps) used by MobX, Immer and Vue for reactivity.<br>
<strong>Used in:</strong> room or rate-card caching in <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>, permission checks on cancel, lazy loading of heavy resources.<br>
<strong>Pitfall:</strong> caching proxies without TTL or invalidation; caching <code>null</code> (negative caching) forever.</p>

<h3>Behavioural 1: Strategy</h3>
<p><strong>Intent:</strong> define a family of interchangeable algorithms behind one interface, chosen from outside. The textbook expression of Open/Closed (see <a href="#/topic/design-ocp">O · Open/Closed</a>).</p>
<pre><code class="language-ts">enum SpotSize { SMALL = 'SMALL', MEDIUM = 'MEDIUM', LARGE = 'LARGE' }

interface PricingStrategy {
  priceFor(minutes: number, size: SpotSize): number; // paise
}

class HourlyPricing implements PricingStrategy {
  constructor(private readonly ratePerHour: Record&lt;SpotSize, number&gt;) {}
  priceFor(minutes: number, size: SpotSize): number {
    const hours = Math.max(1, Math.ceil(minutes / 60));     // minimum one hour, partial hours round up
    return hours * this.ratePerHour[size];
  }
}

class FlatEventPricing implements PricingStrategy {
  constructor(private readonly flatPaise: number) {}
  priceFor(): number { return this.flatPaise; }             // fewer params is a valid implementation
}

class FeeCalculator {
  constructor(private strategy: PricingStrategy) {}
  useStrategy(next: PricingStrategy): void { this.strategy = next; }   // e.g. stadium event day
  fee(minutes: number, size: SpotSize): number { return this.strategy.priceFor(minutes, size); }
}

// Function form, equally valid when the strategy is a single pure function:
type PricingFn = (minutes: number, size: SpotSize) =&gt; number;</code></pre>
<p><strong>Used in:</strong> parking pricing and spot allocation, rate-limiter algorithms, cache eviction (LRU vs LFU in <a href="#/topic/lld-lru-cache">Case: LRU Cache</a>), notification channel delivery, Splitwise split types (equal, exact, percentage).<br>
<strong>Pitfall:</strong> an interface shaped around the first implementation. If the second strategy needs data the first did not, pass a context object (<code>priceFor(ctx: PricingContext)</code>) so adding fields does not break every implementation.</p>

<h3>Behavioural 2: Observer</h3>
<p><strong>Intent:</strong> a subject notifies a list of subscribers when something happens, without knowing who they are.</p>
<pre><code class="language-ts">type ParkingEvents = {
  spotOccupied: { floor: number; size: SpotSize };
  spotFreed: { floor: number; size: SpotSize };
};

class TypedEmitter&lt;E extends Record&lt;string, unknown&gt;&gt; {
  private readonly handlers: { [K in keyof E]?: Array&lt;(payload: E[K]) =&gt; void&gt; } = {};

  on&lt;K extends keyof E&gt;(event: K, handler: (payload: E[K]) =&gt; void): () =&gt; void {
    (this.handlers[event] ??= []).push(handler);
    return () =&gt; { this.handlers[event] = this.handlers[event]?.filter(h =&gt; h !== handler); };
  }

  emit&lt;K extends keyof E&gt;(event: K, payload: E[K]): void {
    for (const handler of [...(this.handlers[event] ?? [])]) {      // copy: safe if a handler unsubscribes
      try { handler(payload); }
      catch (err) { console.error('handler failed for ' + String(event), err); } // isolate failures
    }
  }
}

class DisplayBoard {
  private readonly free = new Map&lt;string, number&gt;();

  constructor(events: TypedEmitter&lt;ParkingEvents&gt;) {
    events.on('spotOccupied', e =&gt; this.bump(e.floor, e.size, -1));
    events.on('spotFreed', e =&gt; this.bump(e.floor, e.size, +1));
  }
  setInitial(floor: number, size: SpotSize, count: number): void { this.free.set(floor + ':' + size, count); }
  private bump(floor: number, size: SpotSize, delta: number): void {
    const key = floor + ':' + size;
    this.free.set(key, (this.free.get(key) ?? 0) + delta);
  }
  render(): string { return [...this.free].map(([k, n]) =&gt; k + '=' + n).join('  '); }
}</code></pre>
<p><strong>Observer vs publish/subscribe:</strong> Observer is in-process and synchronous; the subject holds the subscriber list. Pub/sub puts a broker (Redis, SNS, Kafka) between publisher and subscribers, decoupling them in time and process, with delivery semantics to think about (see <a href="#/topic/be-queues">Queues</a> and <a href="#/topic/be-event-driven">Event-Driven Systems</a>).<br>
<strong>Used in:</strong> parking display board, notification service fan-out, stock or price alerts, auction bids, "notify when back in stock".<br>
<strong>Pitfall:</strong> forgotten unsubscribes (memory leaks; Node's <code>EventEmitter</code> warns past 10 listeners per event by default), and long event chains that hide control flow.</p>

<h3>Behavioural 3: State</h3>
<p><strong>Intent:</strong> an object changes behaviour when its internal state changes; each state is a class, and illegal actions in a state are handled by that state.</p>
<pre><code class="language-ts">interface VendingState {
  insertCoin(m: VendingMachine, paise: number): void;
  select(m: VendingMachine, code: string): void;
  cancel(m: VendingMachine): void;
}

class IdleState implements VendingState {
  insertCoin(m: VendingMachine, paise: number): void { m.addBalance(paise); m.setState(new HasMoneyState()); }
  select(): void { throw new Error('Insert money first'); }
  cancel(): void { /* nothing to refund */ }
}

class HasMoneyState implements VendingState {
  insertCoin(m: VendingMachine, paise: number): void { m.addBalance(paise); }
  select(m: VendingMachine, code: string): void {
    const slot = m.slot(code);
    if (!slot || slot.qty === 0) throw new Error('Sold out: ' + code);
    if (m.balance &lt; slot.pricePaise) throw new Error('Insert ' + (slot.pricePaise - m.balance) + ' more paise');
    slot.qty--;
    m.dispense(code, m.balance - slot.pricePaise);
    m.resetBalance();
    m.setState(m.isEmpty() ? new SoldOutState() : new IdleState());
  }
  cancel(m: VendingMachine): void { m.refund(m.balance); m.resetBalance(); m.setState(new IdleState()); }
}

class SoldOutState implements VendingState {
  insertCoin(m: VendingMachine, paise: number): void { m.refund(paise); }
  select(): void { throw new Error('Machine is sold out'); }
  cancel(): void {}
}

class VendingMachine {
  private state: VendingState = new IdleState();
  private balancePaise = 0;
  constructor(private readonly slots: Map&lt;string, { pricePaise: number; qty: number }&gt;) {}

  // public API: every call is delegated to the current state
  insertCoin(paise: number): void { this.state.insertCoin(this, paise); }
  select(code: string): void { this.state.select(this, code); }
  cancel(): void { this.state.cancel(this); }

  // used by states (package-private in Java; kept small and intention-named here)
  get balance(): number { return this.balancePaise; }
  get stateName(): string { return this.state.constructor.name; }
  slot(code: string) { return this.slots.get(code); }
  setState(next: VendingState): void { this.state = next; }
  addBalance(paise: number): void { this.balancePaise += paise; }
  resetBalance(): void { this.balancePaise = 0; }
  isEmpty(): boolean { return [...this.slots.values()].every(s =&gt; s.qty === 0); }
  dispense(code: string, changePaise: number): void { console.log('dispense ' + code + ', change ' + changePaise); }
  refund(paise: number): void { console.log('refund ' + paise); }
}</code></pre>
<p><strong>Lighter alternative:</strong> when states differ only in which transitions are legal (not in behaviour), a transition table is clearer: <code>const NEXT: Record&lt;Status, Partial&lt;Record&lt;Action, Status&gt;&gt;&gt;</code>, or a discriminated union (see the state-machine pattern in <a href="#/topic/ts-patterns">TypeScript Common Patterns</a>).<br>
<strong>Used in:</strong> vending machine, elevator (idle, moving up, moving down, doors open), ATM, order and booking lifecycles, traffic lights.<br>
<strong>Pitfall:</strong> keeping a <code>switch (this.status)</code> in the context alongside state classes: two sources of truth.</p>

<h3>Behavioural 4: Command</h3>
<p><strong>Intent:</strong> turn a request into an object, so it can be queued, logged, retried, undone or replayed.</p>
<pre><code class="language-ts">class TextDocument {
  private text = '';
  get content(): string { return this.text; }
  insert(at: number, s: string): void { this.text = this.text.slice(0, at) + s + this.text.slice(at); }
  remove(at: number, length: number): string {
    const removed = this.text.slice(at, at + length);
    this.text = this.text.slice(0, at) + this.text.slice(at + length);
    return removed;
  }
}

interface Command { execute(): void; undo(): void; }

class InsertCommand implements Command {
  constructor(private readonly doc: TextDocument, private readonly at: number, private readonly s: string) {}
  execute(): void { this.doc.insert(this.at, this.s); }
  undo(): void { this.doc.remove(this.at, this.s.length); }
}

class DeleteCommand implements Command {
  private removed = '';                                   // captured on execute, needed for undo
  constructor(private readonly doc: TextDocument, private readonly at: number, private readonly length: number) {}
  execute(): void { this.removed = this.doc.remove(this.at, this.length); }
  undo(): void { this.doc.insert(this.at, this.removed); }
}

class History {
  private readonly done: Command[] = [];
  private readonly undone: Command[] = [];
  constructor(private readonly limit = 100) {}

  run(cmd: Command): void {
    cmd.execute();
    this.done.push(cmd);
    if (this.done.length &gt; this.limit) this.done.shift();  // bounded memory
    this.undone.length = 0;                                 // a new action clears the redo stack
  }
  undo(): void { const c = this.done.pop(); if (c) { c.undo(); this.undone.push(c); } }
  redo(): void { const c = this.undone.pop(); if (c) { c.execute(); this.done.push(c); } }
}</code></pre>
<p><strong>Used in:</strong> undo/redo editors and drawing tools, job queues (a serialisable command is a job), elevator request queues, smart-home remotes, macro recording. Redux actions are commands as plain data.<br>
<strong>Pitfall:</strong> non-invertible commands (an SMS already sent). Undo becomes a <em>compensating</em> command (send a correction), not a reversal.</p>

<h3>Behavioural 5: Chain of Responsibility</h3>
<p><strong>Intent:</strong> pass a request along a chain of handlers; each handles what it can and passes the rest on.</p>
<pre><code class="language-ts">// Classic LLD: ATM note dispenser. Each handler pays out its denomination, passes the remainder.
class NoteDispenser {
  private next: NoteDispenser | null = null;
  constructor(readonly denomination: number, private available: number) {}

  setNext(next: NoteDispenser): NoteDispenser { this.next = next; return next; }

  // Plan first, commit later: a failed plan must not consume notes
  plan(amount: number, acc: Map&lt;number, number&gt; = new Map()): Map&lt;number, number&gt; {
    const count = Math.min(Math.floor(amount / this.denomination), this.available);
    if (count &gt; 0) acc.set(this.denomination, count);
    const rest = amount - count * this.denomination;
    if (rest === 0) return acc;
    if (!this.next) throw new Error('Cannot dispense remaining ' + rest);
    return this.next.plan(rest, acc);
  }

  commit(plan: Map&lt;number, number&gt;): void {
    this.available -= plan.get(this.denomination) ?? 0;
    this.next?.commit(plan);
  }
}

const atm = new NoteDispenser(2000, 10);
atm.setNext(new NoteDispenser(500, 20)).setNext(new NoteDispenser(100, 50));
const plan = atm.plan(3700);   // Map { 2000 =&gt; 1, 500 =&gt; 3, 100 =&gt; 2 }
atm.commit(plan);</code></pre>
<p>The everyday version is middleware: Express and Koa handlers receive <code>next</code> and either respond or pass the request on; Axios interceptors and validation pipelines work the same way.<br>
<strong>Used in:</strong> ATM dispensing, support-ticket escalation (L1, L2, manager), request validation and auth pipelines, logger level handling, discount rules applied in order.<br>
<strong>Pitfall:</strong> no terminal handler, so an unhandled request silently disappears; and in the ATM, greedy chains can fail where a solution exists (see Edge Cases).</p>

<h3>Behavioural 6: Template Method</h3>
<p><strong>Intent:</strong> a base class fixes the skeleton of an algorithm; subclasses override specific steps (and optional hooks) without changing the order.</p>
<pre><code class="language-ts">import { parse } from 'csv-parse/sync';

interface CustomerRecord { externalId: string; name: string; email: string }
interface CustomerRepo { upsert(rec: CustomerRecord): Promise&lt;void&gt;; }

abstract class CustomerImporter&lt;Raw&gt; {
  constructor(protected readonly repo: CustomerRepo) {}

  // The template: subclasses must not change this order
  async run(): Promise&lt;{ imported: number; rejected: number }&gt; {
    const rows = await this.load();
    let imported = 0;
    let rejected = 0;
    for (const row of rows) {
      const rec = this.toRecord(row);
      if (rec &amp;&amp; this.isValid(rec)) { await this.repo.upsert(rec); imported++; }   // upsert: re-runs are safe
      else rejected++;
    }
    await this.afterRun(imported, rejected);
    return { imported, rejected };
  }

  protected abstract load(): Promise&lt;Raw[]&gt;;                       // required step
  protected abstract toRecord(raw: Raw): CustomerRecord | null;     // required step
  protected isValid(rec: CustomerRecord): boolean {                 // default, overridable
    return rec.name.length &gt; 0 &amp;&amp; rec.email.includes('@');
  }
  protected async afterRun(_imported: number, _rejected: number): Promise&lt;void&gt; {} // hook
}

class CsvCustomerImporter extends CustomerImporter&lt;Record&lt;string, string&gt;&gt; {
  constructor(repo: CustomerRepo, private readonly csvText: string) { super(repo); }
  protected async load() {
    return parse(this.csvText, { columns: true, skip_empty_lines: true }) as Record&lt;string, string&gt;[];
  }
  protected toRecord(row: Record&lt;string, string&gt;): CustomerRecord | null {
    if (!row['Email']) return null;
    return { externalId: row['ID'], name: row['Full Name'], email: row['Email'].trim().toLowerCase() };
  }
}

interface CrmContact { id: string; firstName: string; lastName: string; email: string }

class CrmApiImporter extends CustomerImporter&lt;CrmContact&gt; {
  constructor(repo: CustomerRepo, private readonly baseUrl: string, private readonly token: string) { super(repo); }
  protected async load(): Promise&lt;CrmContact[]&gt; {
    const res = await fetch(this.baseUrl + '/contacts', { headers: { Authorization: 'Bearer ' + this.token } });
    if (!res.ok) throw new Error('CRM responded ' + res.status);
    return ((await res.json()) as { items: CrmContact[] }).items;
  }
  protected toRecord(c: CrmContact): CustomerRecord {
    return { externalId: c.id, name: c.firstName + ' ' + c.lastName, email: c.email.toLowerCase() };
  }
}</code></pre>
<p><strong>Template Method vs Strategy:</strong> the same goal (vary steps) via inheritance vs composition. Template Method is fine for a stable skeleton with two or three variants; Strategy is better when steps vary independently or must be swapped at runtime.<br>
<strong>Used in:</strong> data import and ETL pipelines, game turn loops (roll, move, check win) in snake-and-ladder or chess, report exporters, a notification send skeleton (render, send, record).<br>
<strong>Pitfall:</strong> deep hierarchies where nobody knows which override runs; and calling overridable methods from the base constructor (see Edge Cases).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: one integration, five patterns (an FDE-style payments layer)</h3>
<p>A booking product must take payments through two providers a customer already has contracts with. Requirements: providers differ by region; the primary may fail and must fall back; every attempt is timed and logged; the booking code must not know any of this. Each pattern below is there because of one of those sentences.</p>
<pre><code class="language-ts">// The one interface the domain sees
interface PaymentGateway {
  readonly name: string;
  charge(amountPaise: number, idempotencyKey: string): Promise&lt;{ chargeId: string }&gt;;
}

// ADAPTERS: one per provider SDK (fictional shapes), converting units, callbacks and errors
declare const northPaySdk: { createCharge(o: { amount_minor: number; key: string }): Promise&lt;{ id: string; ok: boolean }&gt; };
declare const southPaySdk: { pay(amountRupees: string, ref: string): Promise&lt;{ txn: string; code: number }&gt; };

class NorthPayAdapter implements PaymentGateway {
  readonly name = 'northpay';
  async charge(amountPaise: number, key: string) {
    const r = await northPaySdk.createCharge({ amount_minor: amountPaise, key });
    if (!r.ok) throw new Error('northpay declined');
    return { chargeId: r.id };
  }
}
class SouthPayAdapter implements PaymentGateway {
  readonly name = 'southpay';
  async charge(amountPaise: number, key: string) {
    const r = await southPaySdk.pay((amountPaise / 100).toFixed(2), key);  // this SDK wants rupee strings
    if (r.code !== 0) throw new Error('southpay error ' + r.code);
    return { chargeId: r.txn };
  }
}

// DECORATOR: timing and logging for any gateway
class TimedGateway implements PaymentGateway {
  constructor(private readonly inner: PaymentGateway, private readonly log: (s: string) =&gt; void) {}
  get name() { return this.inner.name; }
  async charge(amountPaise: number, key: string) {
    const t0 = Date.now();
    try { return await this.inner.charge(amountPaise, key); }
    finally { this.log(this.inner.name + ' charge took ' + (Date.now() - t0) + 'ms'); }
  }
}

// STRATEGY: how to route between gateways
interface RoutingStrategy {
  charge(gateways: PaymentGateway[], amountPaise: number, key: string): Promise&lt;{ chargeId: string; via: string }&gt;;
}
class PrimaryWithFallback implements RoutingStrategy {
  async charge(gateways: PaymentGateway[], amountPaise: number, key: string) {
    let lastError: unknown;
    for (const g of gateways) {
      try { return { ...(await g.charge(amountPaise, key)), via: g.name }; }
      catch (err) { lastError = err; }                      // same idempotency key on every attempt
    }
    throw lastError;
  }
}

// FACTORY: which gateways, in which order, for a region (config-driven)
const GATEWAYS_BY_REGION: Record&lt;string, Array&lt;() =&gt; PaymentGateway&gt;&gt; = {
  north: [() =&gt; new NorthPayAdapter(), () =&gt; new SouthPayAdapter()],
  south: [() =&gt; new SouthPayAdapter()],
};
function gatewaysFor(region: string, log: (s: string) =&gt; void): PaymentGateway[] {
  const creators = GATEWAYS_BY_REGION[region];
  if (!creators) throw new Error('No payment gateways configured for ' + region);
  return creators.map(create =&gt; new TimedGateway(create(), log));
}

// FACADE: the only thing booking code calls
class Payments {
  constructor(private readonly routing: RoutingStrategy, private readonly log: (s: string) =&gt; void) {}
  pay(region: string, bookingId: string, amountPaise: number) {
    return this.routing.charge(gatewaysFor(region, this.log), amountPaise, 'booking-' + bookingId);
  }
}

// const payments = new Payments(new PrimaryWithFallback(), console.log);
// await payments.pay('north', 'B-42', 129900);</code></pre>
<p>What to say about it: the adapters isolate vendor quirks (units, error codes); the decorator applies cross-cutting timing to both without editing either; routing is a strategy because "fallback" will soon become "cheapest first" or "split by card type"; the factory is configuration, not code; the facade gives booking code one method. The idempotency key is reused across fallback attempts so a timeout that actually succeeded is not charged twice.</p>

<h3>Example 2: the same patterns, idiomatic TypeScript</h3>
<p>When the variation is a single function, functions and closures express the pattern with less ceremony. Know both forms; use classes on the interview diagram, functions where the codebase prefers them.</p>
<pre><code class="language-ts">// Strategy as a function type
type Pricing = (minutes: number) =&gt; number;
const hourly = (ratePaise: number): Pricing =&gt; mins =&gt; Math.max(1, Math.ceil(mins / 60)) * ratePaise;
const flat = (paise: number): Pricing =&gt; () =&gt; paise;

// Decorator as a higher-order function
function withRetry&lt;A extends unknown[], R&gt;(fn: (...args: A) =&gt; Promise&lt;R&gt;, attempts = 3) {
  return async (...args: A): Promise&lt;R&gt; =&gt; {
    for (let i = 1; ; i++) {
      try { return await fn(...args); }
      catch (err) { if (i &gt;= attempts) throw err; }
    }
  };
}
// const sendSms = withRetry((to: string, text: string) =&gt; sms.send(to, text));

// Command as a closure pair
type Cmd = { run: () =&gt; void; undo: () =&gt; void };
const setTitle = (doc: { title: string }, next: string): Cmd =&gt; {
  const prev = doc.title;
  return { run: () =&gt; { doc.title = next; }, undo: () =&gt; { doc.title = prev; } };
};

// Observer with Node's built-in emitter
import { EventEmitter } from 'node:events';
const lotEvents = new EventEmitter();
lotEvents.on('spotFreed', (floor: number) =&gt; console.log('free on floor ' + floor));
lotEvents.emit('spotFreed', 2);

// Singleton as a module export (config.ts):  export const config = loadConfig();</code></pre>

<h3>Example 3: which patterns each classic LLD problem uses</h3>
<table>
  <thead><tr><th>Problem</th><th>Patterns and why</th></tr></thead>
  <tbody>
    <tr><td><a href="#/topic/lld-parking-lot">Parking lot</a></td><td>Strategy (pricing, spot allocation), Factory (payment processor by method), Observer (display boards), Decorator (EV or weekend surcharge), Facade (<code>ParkingLotService</code>)</td></tr>
    <tr><td><a href="#/topic/lld-lru-cache">LRU cache</a></td><td>Strategy (eviction policy: LRU, LFU, TTL), Decorator or Proxy (cache in front of a slow store)</td></tr>
    <tr><td><a href="#/topic/lld-rate-limiter">Rate limiter</a></td><td>Strategy (token bucket, sliding window), Factory (algorithm by config), Chain or middleware (where it plugs into a request pipeline)</td></tr>
    <tr><td><a href="#/topic/lld-booking-system">Meeting-room booking</a></td><td>State (booking lifecycle), Strategy (room ranking, conflict policy), Proxy (authorisation on cancel), Observer (reminders)</td></tr>
    <tr><td><a href="#/topic/lld-notification">Notification service</a></td><td>Strategy or Factory (channel), Decorator (retry, rate limit), Observer (domain events trigger sends), Template Method (render, send, record), Builder (message)</td></tr>
    <tr><td>Vending machine</td><td>State (idle, has money, sold out), Strategy (change-making), Command (maintenance operations)</td></tr>
    <tr><td>Elevator</td><td>State (per car), Strategy (dispatch: nearest car, SCAN), Command (requests queue), Observer (floor displays)</td></tr>
    <tr><td>Splitwise</td><td>Strategy (equal, exact, percentage split), Factory (split by type), Observer (balance notifications)</td></tr>
    <tr><td>Logger</td><td>Chain of Responsibility (levels), Strategy (formatters, sinks), Singleton (injected), Decorator (async buffering)</td></tr>
    <tr><td>Chess / board games</td><td>Template Method (turn loop), Strategy (move rules per piece), Command (moves with undo)</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Singletons are per process, not per system</h3>
<p>Every Node instance, warm Lambda container and worker thread has its own. Counters, caches and in-memory locks held in a singleton are not shared. If the requirement is "one across the system", the state belongs in a database or Redis, not in a class.</p>

<h3>2. Two copies of a "singleton" in one process</h3>
<p>Two versions of the same package in <code>node_modules</code>, or the same package loaded once as ESM and once as CommonJS (the dual-package hazard), create two module instances and therefore two singletons. Symptoms: a registry that "forgets" registrations, or <code>instanceof</code> failing across them.</p>

<h3>3. Calling overridable methods from a base constructor</h3>
<p>In TypeScript/JavaScript, a subclass's field initialisers run <em>after</em> <code>super()</code> returns. If a Template Method base constructor calls <code>this.load()</code>, the subclass's override runs before its own fields are set and sees <code>undefined</code>. Keep constructors free of template calls; start the algorithm from a separate method (<code>run()</code>).</p>

<h3>4. Decorator order changes behaviour</h3>
<p><code>Cache(Retry(Real))</code> caches only successful results after retries; <code>Retry(Cache(Real))</code> retries cache lookups too. <code>Timeout(Retry(x))</code> bounds the total; <code>Retry(Timeout(x))</code> bounds each attempt. Logging outside retry logs once; inside, every attempt. Decide and say which you mean.</p>

<h3>5. Observer handler failures and re-entrancy</h3>
<p>One throwing handler must not stop the others (wrap each call). Handlers that subscribe or unsubscribe during an emit can skip or double-call others unless you iterate over a copy. A handler that emits another event can loop. Async handlers are not awaited by a plain emitter, so ordering and error handling need an explicit decision.</p>

<h3>6. Greedy chains can fail when a solution exists</h3>
<p>An ATM with only 500 and 200 notes cannot pay 600 greedily (500 leaves 100), although 3 x 200 works. Real dispensers use a small search or dynamic programming over the available counts. Mention it: interviewers use it to see whether you test your own design.</p>

<h3>7. State objects and persistence</h3>
<p>State classes are runtime objects; the database stores an enum. Rehydrate with a lookup (<code>STATE_BY_NAME[row.status]</code>). Concurrent events on the same object (two coins at once, cancel during dispense) still need serialisation; the State pattern does not make transitions atomic.</p>

<h3>8. Strategies that need different inputs</h3>
<p>If <code>WeekendPricing</code> needs the entry date and <code>HourlyPricing</code> does not, a narrow signature forces a breaking change. Pass a context object (<code>{ entryAt, exitAt, size, vehicle }</code>) from the start when you expect variety.</p>

<h3>9. Commands that cannot be undone</h3>
<p>Sending an email, charging a card or calling an external API cannot be reversed. Model undo as a compensating command (refund, correction message) and say that history for such commands is an audit log, not a reversible stack.</p>

<h3>10. Caching proxy correctness</h3>
<p>Without TTL or invalidation a cache serves stale data forever. Caching <code>null</code> (negative caching) hides newly created entities. Many concurrent misses for the same key cause a stampede; store the in-flight promise in the map so callers share one fetch.</p>

<h3>11. Builder reuse</h3>
<p>If <code>build()</code> hands out the builder's internal array, building twice from the same builder makes two orders share one list. Copy on build, or make the builder single-use.</p>

<h3>12. Adapters for two-way or chatty APIs</h3>
<p>Some integrations need mapping in both directions (our ids to theirs and back) and pagination, rate limits and partial failures. The adapter is the place for all of it, plus a mapping table persisted somewhere, not scattered through the domain.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1: pattern-first design</h3>
<p>Choosing patterns before reading requirements, then bending the problem to fit them. Interviewers hear "I will use Singleton, Factory and Observer" as a script. Start from forces.</p>

<h3>Anti-pattern 2: Singleton as a global variable</h3>
<p><code>Something.getInstance()</code> called from deep inside entities. Dependencies become invisible and tests share state. One instance, created at the root, injected.</p>

<h3>Anti-pattern 3: speculative Strategy</h3>
<p>An interface with exactly one implementation and no stated reason to vary. It adds a file and an indirection for nothing. Exception: the interviewer said the rule will vary, or you need a seam for testing.</p>

<h3>Anti-pattern 4: the factory that is a growing switch</h3>
<p>A <code>switch</code> inside a factory is fine for three stable types. When every new type edits it, move to a registry so new types are registered, not edited in.</p>

<h3>Anti-pattern 5: Observer spaghetti</h3>
<p>Events triggering events triggering events. Control flow becomes invisible and ordering bugs appear. Keep chains shallow, name events in past tense (<code>SpotFreed</code>), and keep business-critical steps as explicit calls, not side effects of listeners.</p>

<h3>Anti-pattern 6: the facade that grew a brain</h3>
<p>A service facade full of pricing <code>if</code>s and limit checks. It is now the god class. Push rules into policies and entities; the facade sequences.</p>

<h3>Anti-pattern 7: a "decorator" that changes the interface</h3>
<p>If the wrapper exposes different methods, it is an adapter, and it cannot be stacked with other decorators. Keep decorators interface-preserving.</p>

<h3>Anti-pattern 8: State pattern plus a status switch</h3>
<p>State classes exist, but the context still does <code>if (this.status === 'IDLE')</code>. Two sources of truth drift. Either the state object decides, or a transition table does; not both.</p>

<h3>Anti-pattern 9: deep Template Method hierarchies</h3>
<p><code>BaseImporter</code> → <code>FileImporter</code> → <code>CsvImporter</code> → <code>BankCsvImporter</code>, each overriding a hook. Nobody can tell which step runs. Keep it to one level of abstract base, or switch to composed strategies.</p>

<h3>Anti-pattern 10: commands holding live mutable references</h3>
<p>An undo that restores "the previous value" by reading a shared object that has since changed restores the wrong thing. Capture what undo needs at execute time (as <code>DeleteCommand</code> captures the removed text).</p>

<h3>Anti-pattern 11: enterprise naming without substance</h3>
<p><code>AbstractPricingStrategyFactoryProvider</code>. Names should describe the domain role (<code>PricingPolicy</code>, <code>pricingFor(lot)</code>); the pattern is visible in the structure, it need not be in every class name.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is the difference between Strategy and State? Their class diagrams look identical.</div>
  <div class="qa-answer">
    <p>Structurally they are the same: a context holds a reference to an interface and delegates. The difference is who changes the implementation and why. A strategy is chosen from outside (configuration, the client) and strategies do not know about each other. A state is changed by the object itself as a consequence of its own operations, and states know which state comes next. Pricing per lot is Strategy; a vending machine moving from Idle to HasMoney after a coin is State.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Adapter, Decorator, Proxy and Facade all wrap something. How do you tell them apart?</div>
  <div class="qa-answer">
    <p>By interface and intent. Adapter exposes a <em>different</em> interface from the thing it wraps, to make an incompatible class fit (a vendor SMS SDK behind our <code>SmsSender</code>). Decorator exposes the <em>same</em> interface and adds behaviour, and is designed to stack (retry around logging around SMS). Proxy also exposes the same interface but controls access: caching, authorisation, lazy loading or a remote call. Facade exposes a <em>new, simpler</em> interface over several subsystems. If I am unsure between Proxy and Decorator I state the intent, since they are structurally identical.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why is Singleton often called an anti-pattern, and how would you handle "there must be one X" in TypeScript?</div>
  <div class="qa-answer">
    <p>Because it couples "exactly one instance" with "global access". Global access hides dependencies, leaks state between tests and makes two instances impossible when you later need them (two lots in one test). Also, "one" is per process: multiple Node instances or Lambda containers each have their own, and duplicate package copies can create two in one process. In TypeScript I create one instance at the composition root and inject it; if I need module-level sharing, an exported instance is already a singleton because ES modules evaluate once. If the "one" must be system-wide, the state goes into a shared store.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Factory vs Builder: when do you use which? And do you need Builder in TypeScript at all?</div>
  <div class="qa-answer">
    <p>A factory decides <em>which</em> class to create and hides that choice; a builder decides <em>how</em> to assemble one complex object, step by step, validating at the end. They combine well (a factory that returns a pre-configured builder). In TypeScript, an options object with optional fields replaces many builders. I keep a builder when construction is incremental (items added in a loop), when validation spans fields, when the result must be immutable, or when I want the type system to track required steps.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Observer vs publish/subscribe?</div>
  <div class="qa-answer">
    <p>Observer is in-process: the subject keeps a list of observers and calls them synchronously, so they share its lifetime and failures. Pub/sub inserts a broker (Redis, SNS, Kafka, an event bus) between publishers and subscribers, which decouples them in time, process and scale, but brings delivery semantics: at-least-once, ordering, retries, dead-letter queues and idempotent consumers. In an LLD answer I use Observer for the display board; if the interviewer asks what happens across services, I move to pub/sub and talk about those semantics.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Template Method or Strategy for varying steps of an algorithm?</div>
  <div class="qa-answer">
    <p>Template Method uses inheritance: the base class fixes the order and subclasses override steps. It suits a stable skeleton with a few variants, like CSV vs CRM-API importers sharing load, map, validate, save. Strategy uses composition: each varying step is an injected object, so steps vary independently, can be swapped at runtime and tested alone. If two steps vary on independent axes, Template Method needs a subclass per combination, which is the inheritance explosion; that is my cue to switch to strategies.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Implement undo/redo for an editor. What are the design decisions?</div>
  <div class="qa-answer">
    <p>Command pattern: each edit is an object with <code>execute()</code> and <code>undo()</code>, capturing what it needs to reverse itself at execute time (a delete stores the removed text). A history keeps two stacks: undo pushes onto redo, and any new command clears redo. Decisions to state: bound the history for memory; coalesce rapid keystrokes into one command so undo is not per character; for collaborative editing, inverse operations must be transformed against concurrent edits (operational transforms or CRDTs), which is beyond plain Command; and side-effecting commands use compensation, not reversal.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Which patterns would you use in a parking lot design, and which would you avoid?</div>
  <div class="qa-answer">
    <p>Strategy for pricing and for spot allocation, since both vary by lot and over time. A factory or registry for the payment processor chosen at exit. Observer so display boards update when spots change without the lot knowing about boards. A decorator for surcharges such as EV charging stacked on base pricing. A facade, <code>ParkingLotService</code>, as the single entry point. I would avoid a <code>ParkingLot</code> Singleton (inject one instance instead) and avoid a vehicle subclass hierarchy when vehicles differ only by data; an enum plus a compatibility table is simpler.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Where have you used Chain of Responsibility in real code?</div>
  <div class="qa-answer">
    <p>Middleware is the everyday form: Express or Koa handlers take <code>next</code> and either respond or pass the request on, and the order (auth, rate limit, validation, handler) is the chain. On mobile, Axios request and response interceptors are a chain, used for attaching tokens and refreshing on 401. In LLD, the ATM note dispenser and support-ticket escalation are the classic prompts. Two things I always add: a terminal handler so nothing is silently dropped, and a clear rule for whether a handler stops the chain or every handler runs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. You wrap a payment call with a retry decorator and a cache decorator. In which order, and why?</div>
  <div class="qa-answer">
    <p>For payments I would not cache the charge at all; I would cache nothing that has side effects. For a read, such as fetching an exchange rate, the cache goes outside retry: <code>Cache(Retry(Real))</code>, so a hit avoids any network work and only a miss pays for retries. For the charge, the important companion to retry is an idempotency key reused on every attempt, so a timed-out attempt that actually succeeded is not charged twice. Timeout placement also matters: inside retry bounds each attempt, outside bounds the total.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Which design patterns do you use in React Native without naming them?</div>
  <div class="qa-answer">
    <p>Higher-order components are decorators: same props in, extra behaviour added. Store subscriptions and <code>AppState</code> or <code>NetInfo</code> listeners are Observer. Redux actions are commands as data, which is why time-travel debugging works, and Redux middleware and Axios interceptors are chains. Passing <code>renderItem</code> to <code>FlatList</code> is Strategy. A <code>useAuth</code> hook that hides token storage and refresh is a facade. The shift to backend LLD is mostly naming these and using them for domain rules instead of UI.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE scenario) A customer wants your scheduling product to sync with their three internal systems: a SOAP HR system, a CSV export from a facilities tool, and a modern REST CRM. Syncs are slow and occasionally create duplicates. How do you structure the integration?</div>
  <div class="qa-answer">
    <p>One Adapter per system, each converting transport, auth, ids and errors into a single internal interface, so the domain never sees SOAP faults or CSV quirks. A Template Method importer fixes the pipeline (load, map, validate, upsert, report) while each source supplies load and map. Duplicates usually mean inserts keyed on our ids; I would upsert on the source system's external id and keep an id-mapping table, which also makes re-runs idempotent. For slowness I would measure first: SOAP calls are often per-record, so batch where the API allows, run sources in parallel, and sync incrementally using a "modified since" watermark instead of full exports. Retry with backoff goes in a decorator around each adapter, so policies are tuned per system without touching the import logic.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You name the force before the pattern, and decline patterns that have no force.</li>
    <li>You distinguish Strategy from State, and Adapter, Decorator, Proxy and Facade, by intent.</li>
    <li>You inject a single instance instead of reaching for a global Singleton, and know why "one" is per process.</li>
    <li>You know the lighter TypeScript forms (functions, closures, module exports) and when the class form is clearer.</li>
    <li>You mention decorator ordering, observer failure isolation and non-invertible commands without prompting.</li>
    <li>You map each classic LLD problem to the two or three patterns that genuinely serve it.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. For each of the thirteen core patterns, what force triggers it, and where does it show up in an LLD problem?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Factory:</strong> the caller should not know which concrete class to build — payment processor by method, channel by user preference.</li>
      <li><strong>Builder:</strong> many optional parts, cross-field validation, immutable result — order, notification message, search query.</li>
      <li><strong>Singleton:</strong> exactly one shared instance (use sparingly, inject it) — config, id generator, connection pool.</li>
      <li><strong>Adapter:</strong> a class you cannot change has the wrong interface — vendor SMS or payment SDKs, customer legacy systems.</li>
      <li><strong>Decorator:</strong> add stackable behaviour without editing the object — retry, logging, caching, pricing surcharges.</li>
      <li><strong>Facade:</strong> many subsystems, callers want one simple entry point — <code>ParkingLotService</code>, checkout.</li>
      <li><strong>Proxy:</strong> control access (cache, authorise, lazy-load) — caching repository, permission check on cancel.</li>
      <li><strong>Strategy:</strong> an algorithm or rule varies and must be swappable — pricing, spot allocation, rate-limit algorithm, eviction.</li>
      <li><strong>Observer:</strong> many dependants react to an event the source should not know about — display board, notifications, price alerts.</li>
      <li><strong>State:</strong> behaviour depends on lifecycle state with transition rules — vending machine, elevator, order or booking status.</li>
      <li><strong>Command:</strong> requests as objects to queue, log, undo or replay — undo/redo editor, job queue, elevator requests.</li>
      <li><strong>Chain of Responsibility:</strong> a request passes through handlers until one (or all) handle it — ATM note dispenser, validation pipeline, middleware.</li>
      <li><strong>Template Method:</strong> fixed algorithm skeleton with a few varying steps — import pipelines, game turn loop, report export.</li>
    </ul>
    <p>In the interview I say the force first and the pattern second: "pricing varies by lot, so pricing is a Strategy".</p>
  </div>
</div>
` },

  ]
});
