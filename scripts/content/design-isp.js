window.PREP_SITE.registerTopic({
  id: 'design-isp',
  module: 'design',
  title: 'I · Interface Segregation',
  estimatedReadTime: '12 min',
  tags: ['design', 'solid', 'oop', 'isp', 'clean-code'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Interface Segregation Principle (ISP)</strong>, Robert C. Martin's phrasing: <strong>"Clients should not be forced to depend upon interfaces that they do not use."</strong> In practice: don't design one broad, "fat" interface that bundles unrelated capabilities together — split it into several small, focused <strong>role interfaces</strong>, so each consumer depends only on the methods it actually calls.</p>
<ul>
  <li><strong>It's about the consumer's view, not the implementer's.</strong> ISP asks: what does <em>this client</em> need to call? Not: what could this class theoretically do? A class may still implement several small interfaces — that's composition, and it's fine.</li>
  <li><strong>The smell it fixes:</strong> implementers stubbing out methods they don't support — throwing <code>NotImplementedError</code>, returning <code>null</code>, or leaving a method empty — purely to satisfy an interface contract that has nothing to do with what that class actually does.</li>
  <li><strong>The fix is almost always the same shape:</strong> break the fat interface into several small, cohesive ones, grouped by which clients actually use which methods together, and have each implementer depend on only the ones it needs.</li>
  <li><strong>It's closely related to SRP, but not the same axis.</strong> SRP is about a class having one reason to change; ISP is about a client not being forced to know about methods it never calls. A fat interface very often signals that the class <em>behind</em> it is itself violating SRP — see What &amp; Why, below.</li>
</ul>
<p><strong>Mantra:</strong> "If implementing an interface means writing a method body that just throws, the interface is too fat."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The core complaint: forced, unwanted dependencies</h3>
<p>ISP is a statement about coupling from the <strong>client's</strong> side. When an interface bundles together methods that serve different, unrelated purposes, every implementer is forced to depend on — and provide some answer for — all of them, even the ones it has no meaningful behavior for. That's the "force" in the principle's name: the interface itself is imposing a dependency the implementing class never asked for and doesn't need.</p>

<h3>Why this causes real damage</h3>
<ul>
  <li><strong>Stub methods that lie.</strong> A class forced to implement a method it doesn't support has exactly two bad options: throw (a runtime surprise waiting for whichever caller doesn't know to avoid that method) or silently no-op (a bug waiting to be triggered). Either way, the compiler says the contract is satisfied — the truth is it isn't.</li>
  <li><strong>Unnecessary recompilation and rebuilding.</strong> Martin's original C++ context: if a fat interface changes because <em>one</em> client's method needed a new parameter, every class that implements that interface — even ones that never call the changed method — has to be recompiled. In interpreted/dynamically-typed languages the same idea shows up as unrelated code needing to be re-tested and redeployed for a change it never cared about.</li>
  <li><strong>False coupling between unrelated clients.</strong> If <code>ReportGenerator</code> and <code>Printer</code> both depend on one fat <code>IOfficeDevice</code> interface, a change requested by the printing team can ripple into the reporting team's code path, purely because they share an interface neither of them fully needs.</li>
  <li><strong>Misleading contracts mislead callers, too.</strong> A caller holding a reference to a fat interface has no way to know, just from the type, which methods are "real" for a given instance and which will blow up. Small, role-based interfaces make illegal calls a compile error instead of a runtime surprise.</li>
</ul>

<h3>ISP's relationship to SRP</h3>
<p>The two principles look at the same code from opposite directions. <strong>SRP</strong> asks whether a class has one reason to change. <strong>ISP</strong> asks whether a client is forced to depend on methods it doesn't use. In practice, a fat interface is frequently a symptom of an SRP violation one layer down: if <code>IMachine</code> bundles <code>print()</code>, <code>scan()</code>, and <code>fax()</code>, it's often because the concrete class behind it — a single "office machine" class — is itself trying to be printer, scanner, and fax machine at once, three responsibilities, three actors, one class. Segregating the interface is the client-facing fix; it frequently exposes, and invites, a matching SRP-style split on the implementation side.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>Think "role," not "thing"</h3>
<p>A fat interface is usually modeled after a <em>thing</em> — "a machine," "a user," "a repository" — and then grows to list everything that thing could ever do. A segregated design instead models <em>roles</em> — "something that can be printed to," "something that can be read from," "something that can be scanned" — and lets a class implement as many small roles as it genuinely plays. The interface answers "what can you ask of me?", not "what kind of object am I?"</p>

<h3>The stub-method test</h3>
<p>A fast, practical check: for every class implementing an interface, look at each method's real body. If any of them is <code>throw new Error('not supported')</code>, an empty no-op, or a comment saying "not applicable here," that's not a quirky edge case — it's ISP being violated in front of you. A correctly segregated interface never needs a class to fake compliance.</p>

<h3>Small interfaces compose; they don't need to multiply endlessly</h3>
<p>Splitting <code>IMachine</code> into <code>Printer</code>, <code>Scanner</code>, and <code>Fax</code> doesn't mean a full-featured all-in-one device becomes awkward to model — it implements all three role interfaces at once, and clients that only need one of those roles still only depend on that one. The goal isn't "as many tiny interfaces as possible" for its own sake; it's "each client depends on exactly the capabilities it uses," which composition of several small interfaces achieves without forcing anyone (implementer or caller) to deal with capabilities they don't need.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>How to spot a violation</h3>
<ul>
  <li><strong>Stubbed or throwing method bodies.</strong> The single most reliable signal — a class implementing an interface with a method body that throws <code>NotImplementedError</code>, returns a dummy value, or is simply empty, purely to satisfy the type contract.</li>
  <li><strong>A "manager" or "service" interface every consumer only partially uses.</strong> An interface with ten methods where each caller only ever invokes two or three of them, and different callers use different, non-overlapping subsets — a strong sign the ten methods belong to several smaller roles, not one.</li>
  <li><strong>Mocking pain in tests.</strong> If testing a class that depends on a fat interface requires stubbing out several methods the test doesn't care about just to satisfy the type, the interface is forcing an unwanted dependency onto the test too.</li>
  <li><strong>Interface changes that ripple to unrelated implementers.</strong> If adding a method for one client's use case means every other implementer of the same interface must now also provide (or stub) that method, the interface is doing too much.</li>
</ul>

<h3>The fix: segregate by client, then compose</h3>
<p>Group methods by <em>which clients call which methods together</em>, not by which class happens to implement them today. Each resulting role interface should be small enough that "does this implementer genuinely support every method here?" is always true, not aspirational. A class that legitimately plays several roles simply implements — or composes — several of these small interfaces; a client that only needs one role only ever sees, and depends on, that one.</p>
<p>Two things this fix is <em>not</em>: it's not "extract an interface for every single method" (see Mental Model, above — roles group naturally-related capabilities, they don't atomize down to one method each), and it's not a license to skip fixing the underlying class if the real problem is that one class is trying to be too many things — that's the SRP angle, and segregating the interface alone doesn't resolve it if the implementation still needs the split too.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples (before → after)', html: `
<h3>Before: one fat interface, forced stubs</h3>
<pre><code class="language-typescript">interface Machine {
  print(document: Document): Promise&lt;void&gt;;
  scan(): Promise&lt;Document&gt;;
  fax(document: Document, recipient: string): Promise&lt;void&gt;;
}

// A simple, ink-and-paper-only printer has no scanning or fax hardware —
// but the interface forces it to declare methods for both anyway.
class SimplePrinter implements Machine {
  async print(document: Document): Promise&lt;void&gt; {
    this.sendToPrintHead(document);
  }

  // Forced stub — this printer has no scanner. Either it throws...
  async scan(): Promise&lt;Document&gt; {
    throw new Error('SimplePrinter does not support scanning');
  }

  // ...or, worse, it silently does nothing and lies to the caller.
  async fax(document: Document, recipient: string): Promise&lt;void&gt; {
    throw new Error('SimplePrinter does not support faxing');
  }

  private sendToPrintHead(document: Document): void {
    /* ... */
  }
}
</code></pre>
<p>Any code holding a <code>Machine</code> reference has no way to know, from the type alone, whether calling <code>.scan()</code> is safe — for a <code>SimplePrinter</code> it always blows up at runtime. <code>SimplePrinter</code> is forced to depend on, and answer for, two capabilities it doesn't have, purely because they were bundled into the interface it needed one part of.</p>

<h3>After: role interfaces, composed only where genuinely needed</h3>
<pre><code class="language-typescript">interface Printer {
  print(document: Document): Promise&lt;void&gt;;
}

interface Scanner {
  scan(): Promise&lt;Document&gt;;
}

interface Fax {
  fax(document: Document, recipient: string): Promise&lt;void&gt;;
}

// Implements only the role it genuinely supports — no stubs, no lies.
class SimplePrinter implements Printer {
  async print(document: Document): Promise&lt;void&gt; {
    this.sendToPrintHead(document);
  }

  private sendToPrintHead(document: Document): void {
    /* ... */
  }
}

// A full multifunction device composes every role it actually supports.
class MultiFunctionPrinter implements Printer, Scanner, Fax {
  async print(document: Document): Promise&lt;void&gt; {
    this.sendToPrintHead(document);
  }

  async scan(): Promise&lt;Document&gt; {
    return this.readFromSensor();
  }

  async fax(document: Document, recipient: string): Promise&lt;void&gt; {
    await this.transmitOverPhoneLine(document, recipient);
  }

  private sendToPrintHead(document: Document): void { /* ... */ }
  private readFromSensor(): Document { /* ... */ return {} as Document; }
  private async transmitOverPhoneLine(document: Document, recipient: string): Promise&lt;void&gt; { /* ... */ }
}

// A client that only ever prints depends on exactly that capability —
// it can never be handed something that fails at runtime on .scan().
function printReport(printer: Printer, document: Document): Promise&lt;void&gt; {
  return printer.print(document);
}
</code></pre>
<p><code>SimplePrinter</code> now implements exactly one interface, with no stub methods and no dishonest runtime throws. <code>MultiFunctionPrinter</code> still models a real multifunction device by composing all three role interfaces — segregation didn't make richer devices awkward, it just stopped forcing that richness onto devices that don't have it. And <code>printReport</code>'s signature now documents, at the type level, that it only needs printing — a caller can never accidentally hand it something that will throw on an unsupported call.</p>
<p>Note what this also hints at: if the original <code>Machine</code>-backed class had really been one physical printer-only device pretending to support scanning and faxing, the fat interface was a symptom of that single class trying to model three unrelated actors' worth of hardware capability — the same smell SRP names from the implementation side (see What &amp; Why, above). Segregating the interface is the client-facing fix; here it also happens to line up with three genuinely separate classes, which is exactly the shape a matching SRP split would produce.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What does ISP actually say, and whose perspective is it written from?</div>
<div class="qa-a">
<p>ISP says clients should not be forced to depend on interface methods they don't use — Martin's phrasing is "no client should be forced to depend on methods it does not use." It's written from the <strong>consumer's</strong> perspective, not the implementer's: the question isn't "what could this class do?" but "what does this specific caller actually need to call?" The fix is to replace one broad interface with several small, focused role interfaces, so each client only depends on the slice it actually uses. A class is still free to implement several of those small interfaces at once if it genuinely plays several roles.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you recognize an ISP violation in a real codebase?</div>
<div class="qa-a">
<p>The fastest check: look at every implementer of an interface and read each method body. A method that throws <code>NotImplementedError</code>, silently no-ops, or returns a dummy value purely to satisfy the interface's type contract is the clearest signal. Other tells: a "manager" or "service" interface where each caller only ever touches a small, non-overlapping subset of its methods; test code that has to stub out methods it doesn't care about; and interface changes that force unrelated implementers to also update, just to keep compiling.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How is ISP different from — and related to — SRP?</div>
<div class="qa-a">
<p>SRP is about a class having one reason to change, driven by one actor. ISP is about a client not being forced to depend on capabilities it doesn't use. They're different axes — SRP judges a class's own cohesion, ISP judges what an interface forces on its consumers — but they show up together constantly: a fat interface like <code>IMachine { print(); scan(); fax(); }</code> very often exists because the concrete class behind it is itself trying to be three unrelated things at once, which is an SRP violation on the implementation side. Segregating the interface fixes the client-facing symptom; splitting the implementing class into one collaborator per role — the SRP fix — is often the matching move underneath it.</p>
</div>
</div>
`}

]});
