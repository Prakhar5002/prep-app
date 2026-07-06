window.PREP_SITE.registerTopic({
  id: 'design-solid-capstone',
  module: 'design',
  title: 'Putting SOLID Together',
  estimatedReadTime: '16 min',
  tags: ['design', 'solid', 'oop', 'patterns', 'clean-code'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>SOLID isn't five separate rules to satisfy one at a time — it's one toolkit.</strong> Real code almost never presents a violation of exactly one principle in isolation: a tangled class is usually an SRP problem <em>and</em> the reason its interface is fat (ISP) <em>and</em> the reason a caller needs <code>instanceof</code> to work around it (LSP). The skill this capstone is actually about isn't reciting five definitions from memory — it's recognizing which principle, or combination of principles, a piece of real code is straining against, and knowing when the honest answer is "none of them, yet."</p>
<ul>
  <li><strong>The five, one line each:</strong> SRP — one reason to change, one actor. OCP — add behavior without editing what already works. LSP — a subtype must be safe to substitute for its base, with no surprises. ISP — don't force a client to depend on methods it doesn't use. DIP — depend on an abstraction you own, not a concretion you don't.</li>
  <li><strong>They compose, and they lean on each other.</strong> A fix for one principle frequently produces — or requires — a fix for another. That's not a coincidence; all five are angles on the same underlying goal (code that's cheap and safe to change), so pulling one thread tends to expose the next one. See Mental Model, below, for exactly how they connect.</li>
  <li><strong>Knowing when to stop is as much a skill as knowing when to apply.</strong> Every principle in this module has a real cost — another file, another interface, another jump for the next reader to make. YAGNI has run underneath every topic so far; here it applies to the combination too: reach for the principle(s) the code in front of you is actually straining against, not every principle you could theoretically justify applying.</li>
</ul>
<p><strong>Mantra:</strong> "SOLID is a toolbox, not a checklist — pick the tool the code is asking for, and put the rest back."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Knowing the definitions isn't the same skill as designing well</h3>
<p>Every principle in this module has a crisp, one-sentence definition, and being able to recite all five accurately is a real, testable skill — interviewers ask for exactly that, and the earlier topics in this module drilled it directly. But production code rarely hands you a textbook case of one violation with everything else held conveniently constant. A tangled <code>OrderProcessor</code> class might simultaneously need an SRP-style extraction, expose an accidentally fat interface that's really an ISP problem, and hard-wire a concrete payment SDK that's a DIP problem — all in the same eighty lines. Treating that class as "an SRP problem" and stopping the moment the collaborators are extracted produces a smaller class that is <em>still</em> tangled in the two other ways nobody looked for.</p>

<h3>The judgment call this capstone is actually testing</h3>
<p>Given a real piece of code, three questions matter more than "can you define OCP":</p>
<ul>
  <li><strong>Which principle (or principles) is this code actually straining against?</strong> Not which one the textbook example this class superficially resembles suggests — the actual, present symptom in front of you.</li>
  <li><strong>Does fixing it here create, or expose, a second violation?</strong> Extracting a collaborator for SRP often hands you exactly the seam DIP wants to abstract next; narrowing a fat interface for ISP sometimes turns out to be the LSP fix a caller's <code>instanceof</code> branch was really asking for.</li>
  <li><strong>Is this actually worth fixing right now?</strong> A principle applied where there's no real, current pain is indirection with no payoff — the YAGNI tension that closes out every topic in this module, now applied to the decision of <em>which</em> principle to reach for, not just whether to apply any of them.</li>
</ul>

<h3>Why "apply all five everywhere" is the wrong lesson to take away</h3>
<p>It's tempting, right after learning five named rules, to try to satisfy all five in every class you touch: extract collaborators, add an interface for every dependency, segregate every interface into single-method roles, wrap every construction behind a factory. That produces exactly the kind of code SOLID's critics point at — more files, more indirection, and a design that's harder to hold in your head than the "god class" it replaced, for a change that was never actually going to happen. The five principles are diagnostic tools for symptoms you can point at in real code — shotgun surgery, a switch you keep reopening, an <code>instanceof</code> a caller shouldn't need, a stubbed method, a hard-wired concretion — not a construction checklist to run through on every new class regardless of whether any of those symptoms are present.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>How the five actually interrelate</h3>
<p>Robert C. Martin assembled the five as a set — four of them his own, plus adopting Barbara Liskov's substitutability principle for the "L" — and Michael Feathers later arranged that set into the SOLID mnemonic. None of that means the five were derived together from a single first axiom, so their relationships are things you can observe in real code, not guarantees baked into the acronym. In practice, five connections show up over and over:</p>
<table>
  <thead><tr><th>Relationship</th><th>Why it holds</th></tr></thead>
  <tbody>
    <tr><td><strong>LSP secures OCP</strong></td><td>OCP's mechanism is polymorphism — swap in a new class behind a shared interface without editing the caller. That's only safe if every implementation actually honors the interface's contract. Plug in an implementation that throws where others don't, or returns less than the interface promises, and OCP's "just add a new class" turns into a runtime surprise the caller had no way to see coming — which is exactly the LSP violation the Liskov Substitution topic covers. Its Rectangle/Square example shows the failure at its quietest: no <code>instanceof</code> anywhere, just a silently wrong computed result (a failed postcondition) the caller has no way to detect. Its Bird/Penguin example shows the louder version, where the same kind of break forces an <code>instanceof</code> back into the caller OCP was supposed to keep closed.</td></tr>
    <tr><td><strong>ISP and DIP pair up</strong></td><td>DIP says depend on an abstraction you own, not a concretion you don't. ISP says keep that abstraction small and shaped around one client's actual needs. Put together: the interface a high-level module depends on, per DIP, should be the small, role-shaped kind ISP calls for — not one broad "manager" interface that reintroduces fat coupling through the DIP door, just with an interface keyword in front of it.</td></tr>
    <tr><td><strong>SRP underlies ISP</strong></td><td>A class with one cohesive responsibility naturally exposes a small, coherent set of methods — a small interface falls out of it almost automatically. A fat interface is very often a symptom of an SRP violation one layer down: <code>IMachine { print(); scan(); fax(); }</code> tends to exist because the concrete class behind it is itself trying to be printer, scanner, and fax machine at once. Segregating the interface is the client-facing fix; it frequently exposes — and invites — a matching SRP split on the implementation side.</td></tr>
    <tr><td><strong>SRP feeds DIP</strong></td><td>Extracting a collaborator for SRP reasons (pulling persistence, or notification, out of a god class) hands you a clean, single-purpose seam — exactly the kind of thing worth abstracting behind an interface once you actually need to swap it or test it in isolation. SRP alone doesn't require that interface; DIP is the separate, additional step of abstracting a collaborator you already extracted, taken only when there's a real reason to.</td></tr>
    <tr><td><strong>LSP feeds ISP</strong></td><td>Narrowing a fat base contract into small role interfaces — the ISP fix — is frequently also the fix for an LSP violation, because a subtype was being forced to implement (or fake, via a throwing stub) a capability it doesn't genuinely have. The Liskov Substitution topic's Bird/Penguin example resolves by splitting <code>Bird</code> into <code>Bird</code> and <code>FlyingBird</code> — an ISP-shaped move, done in service of restoring substitutability rather than purely avoiding forced stubs.</td></tr>
  </tbody>
</table>

<h3>One picture: a dependency graph, and who controls what</h3>
<p>Draw every class in a system as a node, and every "depends on" relationship as an arrow between two nodes. Each principle governs a different part of that picture: <strong>SRP</strong> decides what the nodes even are — one node per actor, not one node doing five actors' worth of work. <strong>ISP</strong> and <strong>DIP</strong> decide the shape and direction of the arrows — small, role-shaped abstractions, owned by the high-level side, with concretions pointing inward toward them rather than the reverse. <strong>OCP</strong> decides how the graph is allowed to grow — new nodes get added beside the existing ones, wired into an abstraction that already exists, rather than forcing an edit to a node that's already there. <strong>LSP</strong> is the guarantee that makes following any arrow to a concrete node <em>safe</em> — that whichever concrete implementation happens to be on the other end of an abstraction, the caller's assumptions still hold. Five rules, one picture: cohesive nodes, small owned abstractions, additive growth, and safe substitution along every edge.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Smell → principle: a diagnostic reference</h3>
<p>The fastest way to use SOLID in a real code review isn't "which of the five apply here" — it's "what's the concrete symptom, and which principle names it":</p>
<table>
  <thead><tr><th>Smell</th><th>Principle(s)</th><th>What's actually happening</th></tr></thead>
  <tbody>
    <tr><td><strong>Shotgun surgery</strong> — one conceptually small change ripples across many unrelated files or methods</td><td>SRP, often also OCP</td><td>Too many actors sharing one class (SRP), and/or no extension point, so every new case means editing shared code in more than one place (OCP).</td></tr>
    <tr><td><strong>A <code>switch</code>/<code>if-else</code> chain keyed on a type field</strong>, reopened every time a new case appears</td><td>OCP</td><td>An open-ended, business-driven set of cases handled with a closed-ended mechanism. Fix: one small class per case, behind a shared interface, dispatched through polymorphism.</td></tr>
    <tr><td><strong>Client code needs <code>instanceof</code> / type-guard checks</strong> to work around a subtype that "mostly" behaves like its base</td><td>LSP</td><td>The subtype doesn't honor the base's contract — a strengthened precondition, a weakened postcondition, or a new exception the caller wasn't prepared for. The <code>instanceof</code> is a patch over the hole, not a fix for it.</td></tr>
    <tr><td><strong>An interface implementer stubs a method</strong> — <code>throw new Error('not supported')</code>, a silent no-op, a dummy return</td><td>ISP</td><td>The interface bundles capabilities this implementer doesn't have. Fix: split it into smaller, role-shaped interfaces, so each implementer only has to honor the roles it genuinely plays.</td></tr>
    <tr><td><strong>A class does <code>new SomeConcreteThing()</code> internally</strong> for a dependency it needs, instead of receiving it</td><td>DIP</td><td>A high-level module is wired directly to a low-level detail. Fix: define an abstraction the high-level side owns, inject an implementation of it, and wire the concretion at a single composition root.</td></tr>
  </tbody>
</table>

<h3>Criticisms and limits — presented honestly</h3>
<div class="callout warn">
  <div class="callout-title">⚠️ SOLID has real, fair critics — not just impatient ones</div>
  <p>Treating SOLID as beyond criticism is itself a mistake. Three critiques hold up under scrutiny and are worth being able to state plainly, not just wave away:</p>
</div>
<ul>
  <li><strong>Over-engineering and indirection are a genuine, recurring failure mode — not a strawman.</strong> Codebases that apply every principle to every class, regardless of whether any real symptom is present, tend to accumulate an interface for every class, a factory for every interface, and a class hierarchy several files deep for behavior that never actually varies. Reading that code means following several jumps to find one concrete line of logic. This is the pattern sometimes mocked as "enterprise FizzBuzz," and the mockery is earned when the abstraction has no second implementation and no real prospect of one.</li>
  <li><strong>The YAGNI tension is real, not a footnote.</strong> SOLID is a response to <em>anticipated, real</em> change. Every topic in this module has flagged at least one place where the "correct" SOLID-compliant version would be premature — abstracting a currency field that only ever has one value, or splitting a formatter's event-type switch into one class per event when the event list is effectively fixed. Applying a principle ahead of any real pain is not disciplined design; it's a cost paid for a payoff that may never arrive.</li>
  <li><strong>SOLID is OO-centric, and that's a legitimate limitation, not a matter of taste.</strong> The vocabulary — classes, inheritance, interfaces, mutable objects passed between methods — assumes object-oriented composition as the unit of design. Functional programming pursues the same underlying goals (low coupling, safe substitution, easy extension, testability) through different mechanics: function composition and higher-order functions stand in for the Strategy pattern's family of classes; passing a function as a value replaces constructor injection of an interface; algebraic data types with exhaustive pattern matching are often preferred over a class hierarchy for a closed set of variants; immutability sidesteps a good portion of what LSP's invariant-preservation rule exists to guard against, because there's no shared mutable state left for a subtype to corrupt. None of this makes FP strictly superior — it means SOLID's specific vocabulary is one lens suited to one paradigm, and a fair critique is exactly that: don't expect its five nouns to transplant unchanged into a codebase that isn't built out of classes and inheritance to begin with.</li>
</ul>

<h3>Mapping to design patterns</h3>
<p>Several of the classic Gang-of-Four patterns are, in effect, named recipes for satisfying one or two of these principles at once:</p>
<table>
  <thead><tr><th>Pattern</th><th>Principle(s) it embodies</th><th>How</th></tr></thead>
  <tbody>
    <tr><td><strong>Strategy</strong></td><td>OCP</td><td>A family of interchangeable classes behind one small interface, selected and handed to the caller from the outside — the exact mechanism behind the payment-gateway example in the Open/Closed topic, and the discount-strategy preview back in the intro. Adding a new strategy is purely additive.</td></tr>
    <tr><td><strong>Factory / DI container</strong></td><td>DIP</td><td>Mechanizes DIP's composition-root step: something else decides which concretion to construct, and hands the high-level module only the abstraction it depends on. A hand-written factory function and a full DI container both satisfy DIP the same way — they differ only in how much of the wiring is automated.</td></tr>
    <tr><td><strong>Adapter</strong></td><td>ISP</td><td>Wraps an existing class that doesn't — and can't be changed to — fit the small, role-shaped interface a client needs, without modifying the class itself. A common way to retrofit an ISP-shaped seam onto code you don't own or don't want to touch.</td></tr>
    <tr><td><strong>Observer</strong></td><td>OCP + DIP</td><td>A publisher depends only on an abstract listener/observer interface (DIP), and new subscribers register themselves from the outside without any edit to the publisher's source (OCP) — new behavior added by addition, never by modification.</td></tr>
    <tr><td><strong>Template Method</strong></td><td>OCP (Meyer's original mechanism) + LSP</td><td>A base class's algorithm shell is closed; subclasses override specific steps to extend it — Bertrand Meyer's inheritance-based route to "open for extension, closed for modification," predating the interface-based version. It only stays safe if every subclass's override honors the shell's expectations — an LSP concern layered directly on top of the pattern.</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples (before → after)', html: `
<h3>Before: one class doing four unrelated jobs</h3>
<pre><code class="language-typescript">type NotificationEvent =
  | { type: 'order_shipped'; orderId: string }
  | { type: 'payment_failed'; orderId: string };

class NotificationService {
  // DIP violation: concrete SDK clients constructed directly inside the class
  // that needs them — no seam to swap or test any of the three in isolation.
  private smtp = new SmtpClient(process.env.SMTP_HOST!);
  private twilio = new TwilioClient(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!);
  private fcm = new FcmClient(process.env.FCM_SERVER_KEY!);

  async notify(
    channel: 'email' | 'sms' | 'push',
    event: NotificationEvent,
    userEmail: string,
    userPhone: string,
    userId: string
  ): Promise&lt;void&gt; {
    // Responsibility 1: message formatting — the copy/marketing actor.
    let subject = '';
    let body = '';
    if (event.type === 'order_shipped') {
      subject = 'Your order has shipped!';
      body = \`Order #\${event.orderId} is on its way.\`;
    } else if (event.type === 'payment_failed') {
      subject = 'Payment failed';
      body = \`We couldn't charge your card for order #\${event.orderId}.\`;
    } else {
      throw new Error(\`Unknown event type: \${(event as NotificationEvent).type}\`);
    }

    // Responsibility 2: channel dispatch, as a switch on type — OCP violation:
    // adding Slack or a webhook channel means reopening this exact method.
    switch (channel) {
      case 'email':
        await this.smtp.send({ to: userEmail, subject, body });
        break;
      case 'sms':
        await this.twilio.sendSms(userPhone, \`\${subject}: \${body}\`);
        break;
      case 'push':
        await this.fcm.push(userId, { title: subject, message: body });
        break;
      default:
        throw new Error(\`Unsupported channel: \${channel}\`);
    }
  }
}
</code></pre>
<p>Three principles are strained at once here, in the same eighty-odd lines: <strong>SRP</strong> — formatting copy, channel dispatch, and three transport mechanisms are all one actor's problem as far as this class is concerned, though in reality they belong to a copy team, a platform team, and three separate vendor integrations. <strong>OCP</strong> — the channel switch has to be reopened, and risked, for every new channel. <strong>DIP</strong> — <code>NotificationService</code> is wired directly to three concrete SDK clients it constructs itself; no test can exercise <code>notify()</code> without a real SMTP server, a real Twilio account, and real FCM credentials. There's no ISP violation yet, strictly speaking — ISP describes a fat interface forcing unwanted stubs on an implementer, and there's no shared interface here at all, just bespoke code inside the switch. But that absence is exactly the ISP-shaped <em>opportunity</em> the "after" version takes: once a small, role-shaped <code>Channel</code> interface exists, every future transport implements one method, never more than it needs.</p>

<h3>After: one collaborator per responsibility, one small interface every channel implements</h3>
<pre><code class="language-typescript">// SRP: message formatting is its own responsibility, owned by whoever
// decides what notification copy says — unrelated to how it gets delivered.
interface FormattedMessage {
  subject: string;
  body: string;
}

class NotificationFormatter {
  format(event: NotificationEvent): FormattedMessage {
    switch (event.type) {
      case 'order_shipped':
        return { subject: 'Your order has shipped!', body: \`Order #\${event.orderId} is on its way.\` };
      case 'payment_failed':
        return { subject: 'Payment failed', body: \`We couldn't charge your card for order #\${event.orderId}.\` };
      default:
        throw new Error(\`Unknown event type: \${(event as NotificationEvent).type}\`);
    }
  }
}

interface NotificationResult {
  delivered: boolean;
  channelId: string;
}

// DIP: the abstraction is owned by the notification domain, shaped around
// exactly what NotificationService needs to call — one method, one job.
// ISP: no channel is ever forced to support anything beyond send().
interface Channel {
  send(message: FormattedMessage): Promise&lt;NotificationResult&gt;;
}

// LSP: every implementation below honors the exact same contract —
// resolves with the same result shape, never throws for input the
// interface allows — so any Channel is safely substitutable for any other.
class EmailChannel implements Channel {
  constructor(private smtp: SmtpClient, private toAddress: string) {}
  async send(message: FormattedMessage): Promise&lt;NotificationResult&gt; {
    await this.smtp.send({ to: this.toAddress, subject: message.subject, body: message.body });
    return { delivered: true, channelId: 'email' };
  }
}

class SmsChannel implements Channel {
  constructor(private twilio: TwilioClient, private toPhone: string) {}
  async send(message: FormattedMessage): Promise&lt;NotificationResult&gt; {
    await this.twilio.sendSms(this.toPhone, \`\${message.subject}: \${message.body}\`);
    return { delivered: true, channelId: 'sms' };
  }
}

class PushChannel implements Channel {
  constructor(private fcm: FcmClient, private userId: string) {}
  async send(message: FormattedMessage): Promise&lt;NotificationResult&gt; {
    await this.fcm.push(this.userId, { title: message.subject, message: message.body });
    return { delivered: true, channelId: 'push' };
  }
}

// SRP: NotificationService is orchestration only, describable in one
// sentence without an "and" — "it formats an event, then sends it to
// whichever channels it was given."
// OCP: adding Slack or a webhook channel never touches this class again.
// DIP: it depends only on Channel, never on a concrete transport client.
class NotificationService {
  constructor(private formatter: NotificationFormatter) {}

  async notify(channels: Channel[], event: NotificationEvent): Promise&lt;NotificationResult[]&gt; {
    const message = this.formatter.format(event);
    return Promise.all(channels.map((channel) => channel.send(message)));
  }
}

// Composition root — the one place allowed to know concrete clients exist.
const notificationService = new NotificationService(new NotificationFormatter());
const channels: Channel[] = [
  new EmailChannel(new SmtpClient(process.env.SMTP_HOST!), 'ada@example.com'),
  new SmsChannel(new TwilioClient(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!), '+15550100'),
];
await notificationService.notify(channels, { type: 'order_shipped', orderId: '123' });
</code></pre>
<p>Adding Slack now means writing one new class, <code>SlackChannel implements Channel</code>, and adding it to the <code>channels</code> array at the call site — <code>NotificationService</code>, <code>NotificationFormatter</code>, and every existing channel are untouched and unrisked. A unit test for <code>NotificationService</code> can hand it a <code>FakeChannel implements Channel</code> that just records calls, with zero real SMTP, Twilio, or FCM traffic — the DIP payoff the earlier Dependency Inversion topic demonstrated directly. And every one of the four principles shows up because of a real, current symptom this refactor fixed — not because the checklist says a "proper" class needs an interface.</p>
<p>Notice what this refactor <em>didn't</em> do, on purpose: <code>NotificationFormatter.format</code> still contains a switch on event type, and it wasn't broken into one strategy class per event. Event types here are a small, slow-moving set decided by the product domain, not a channel-style axis with vendors and SDKs churning underneath it — abstracting it further today would be exactly the premature-abstraction mistake the Open/Closed topic's currency caveat warned about, paying real indirection cost for an axis that isn't actually varying. Nor did this add a dependency-injection container for three channel classes — a plain array built at one composition root is enough. That restraint is the YAGNI thread this whole capstone is about: every principle applied here answers a symptom that was actually present in the "before" version, and nothing was added beyond that.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">How do the five SOLID principles relate to each other — are they independent rules?</div>
<div class="qa-a">
<p>Not fully independent — Robert C. Martin assembled the five as a set (four his own, plus adopting Barbara Liskov's substitutability principle for the "L"), and Michael Feathers later arranged that set into the SOLID mnemonic; they weren't derived together from one shared axiom, but in practice they lean on each other constantly. LSP secures OCP: swapping in a new implementation is only safe if that implementation actually honors the shared contract, which is exactly what LSP checks. ISP and DIP pair up: DIP says depend on an abstraction you own, ISP says keep that abstraction small and role-shaped — together they describe what a well-formed dependency should look like, not just that one should exist. And SRP underlies ISP: a class with one cohesive responsibility naturally exposes a small interface, so a fat interface is frequently a symptom of an SRP violation on the implementing class, one layer down. The practical takeaway: fixing one principle in real code often exposes, or directly produces the fix for, another.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">You see a <code>switch</code> on a type field, and one of its branches also does an <code>instanceof</code> check inside it. Which principle is being violated?</div>
<div class="qa-a">
<p>Likely both, and it's worth naming which is which rather than picking one. The switch itself — reopened every time a new case is added — is the Open/Closed violation. The <code>instanceof</code> check inside a branch is a stronger, more specific signal: it means some subtype in that branch doesn't fully honor the shared base contract the other cases rely on, which is a Liskov Substitution violation. In fact this is the exact pattern the LSP topic's Bird/Penguin example walks through: an LSP hole gets patched with an <code>instanceof</code>, and that patch is itself an OCP violation, because every new non-conforming subtype means editing the same caller again. Naming both, and explaining which one is upstream of the other, is a stronger answer than picking just one.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">A class's constructor takes five unrelated dependencies, and one of them is a concrete <code>new SmtpClient()</code> built right there inside a method. Which principles are in play?</div>
<div class="qa-a">
<p>Two, and they're worth separating clearly. Five unrelated constructor dependencies is an SRP smell — it usually means this one class is serving several actors' worth of responsibility (persistence, notification, formatting, and so on), each of whom only cares about their own slice. The concrete <code>new SmtpClient()</code> built inside a method, rather than injected, is a separate DIP violation — the class is wired directly to a low-level detail it constructed itself, with no seam for a test or a swap. The fix sequence matters: extracting collaborators for the SRP problem usually happens first, since it's what turns "five tangled dependencies in one class" into "one focused collaborator per responsibility" — and only then does it make sense to ask, for any one of those collaborators, whether it's worth abstracting behind an interface for DIP.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Is SOLID always worth applying? When would you push back on it?</div>
<div class="qa-a">
<p>No, and saying so plainly is a stronger interview answer than reflexively defending every principle. Push back when an abstraction has exactly one implementation with no real second one in sight — an interface, a Strategy class, or a DI-injected dependency introduced "for future flexibility" pays real, ongoing cost (another file, another jump for the next reader, another contract to keep consistent) for a change that may never come. Push back on a small script, a prototype, or a one-off internal tool that will be rewritten or deleted before it ever needs to change twice. The honest rule: apply a principle when there's a concrete, currently-felt pain — a class you dread touching, a test that needs a live service, a switch you've edited five times this month — not speculatively, ahead of that pain.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Does SOLID apply outside of object-oriented code — say, in a functional codebase?</div>
<div class="qa-a">
<p>The underlying goals transfer — loose coupling, safe substitution, easy extension, testability — but the specific mechanics don't, and that's a fair, real limitation of SOLID's vocabulary rather than a reason to dismiss the goals. Functional programming reaches for function composition and higher-order functions where OCP reaches for the Strategy pattern's family of classes; a function passed as a value replaces constructor-injecting an interface for DIP; algebraic data types with exhaustive pattern matching are often preferred over a class hierarchy for a genuinely closed set of variants; and immutability sidesteps a good portion of what LSP's invariant-preservation rule guards against, since there's no shared mutable state left for a subtype to corrupt. None of this makes one paradigm strictly better — it means SOLID's five nouns are one lens, built for codebases made of classes and inheritance, and a fair critique of SOLID is exactly that it doesn't transplant unchanged into a codebase that isn't built that way.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">If you had to fix a sprawling legacy "god class" under real time pressure, which principle would you reach for first?</div>
<div class="qa-a">
<p>SRP, almost always — extracting collaborators is usually the prerequisite that makes the other four even possible to apply cleanly. It's hard to depend on a small, owned abstraction (DIP) for a class that's still doing five unrelated jobs at once; it's hard to segregate an interface (ISP) that doesn't yet correspond to one coherent responsibility; and a class this tangled rarely has a clean extension point to protect with OCP in the first place. Pulling each responsibility out into its own collaborator, and letting the original class shrink to orchestration, is what turns an unworkable mass into several smaller classes — each of which can then be evaluated, one at a time, for whether it also needs an abstraction, a segregated interface, or a safer substitution contract.</p>
</div>
</div>
`}

]});
