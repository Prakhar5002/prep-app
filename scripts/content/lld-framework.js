window.PREP_SITE.registerTopic({
  id: "lld-framework",
  module: "lld",
  title: "LLD Interview Framework",
  estimatedReadTime: "32 min",
  tags: ["lld","low-level-design","ood","class-diagram","uml","typescript","composition","concurrency","interview-framework"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">LLD turns a bounded problem into <strong>classes, interfaces and runnable code</strong> by walking seven steps (requirements, entities, diagram, interfaces, flows, code, extensibility and concurrency), and it is graded on whether the model <strong>absorbs change by addition</strong>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>The round:</strong> also called OOD or "machine coding"; a bounded prompt (parking lot, LRU cache, booking system) turned into classes, interfaces, relationships and working code in 45 to 90 minutes.</li>
    <li><strong>The seven steps:</strong> Requirements (functional + non-functional) → Entities &amp; relationships → Class diagram (ASCII) → Interfaces/APIs → Core flows → Code → Extensibility &amp; concurrency.</li>
    <li><strong>Time budget:</strong> 45-min discussion round = ~5 min per step and ~15 min of code for the core flow only; 90-min machine-coding round = 8–10 min requirements, 45–50 min of runnable code with a driver, 10 min extensibility.</li>
    <li><strong>LLD vs HLD:</strong> HLD designs services and scale across machines; LLD designs the classes inside one of those boxes, and its "scale" is new requirements.</li>
    <li><strong>Requirements first</strong>, including variation hints ("will this differ later?") and an explicit out-of-scope list. Five to eight minutes, no more.</li>
    <li><strong>Nouns → classes</strong>, but filter: describing nouns are attributes, computed nouns are policy outputs, actors are usually roles.</li>
    <li><strong>Split type from instance:</strong> Book vs BookCopy, Movie vs Show vs Seat, Product vs InventoryItem.</li>
    <li><strong>Four layers:</strong> driver → thin service facade → entities that guard invariants + policies behind interfaces + repositories hiding storage.</li>
    <li><strong>Interfaces go where things vary</strong> (pricing, allocation, channels, fines), not everywhere.</li>
    <li><strong>UML-lite arrows:</strong> ──▷ inheritance, ┄┄▷ implements, ◆── composition (owns, same lifecycle), ◇── aggregation (injected or shared), ──► association, ┄┄► dependency; multiplicities at both ends.</li>
    <li><strong>Composition by default;</strong> inheritance only for shallow, substitutable is-a. Two independent axes as subclasses means an explosion.</li>
    <li><strong>Code order:</strong> enums and value objects → entities → interfaces → simplest implementations → service → driver. Inject clock, ids and storage; money in integer minor units.</li>
    <li><strong>Follow-ups in three beats:</strong> which seam absorbs it, the new class, the one line of wiring — without editing the classes you already wrote.</li>
    <li><strong>Thread safety in Node:</strong> sync code is atomic in one process; every <code>await</code> is an interleaving point (use a keyed async mutex); across instances only the shared store can guard (conditional update, row lock, unique constraint).</li>
    <li><strong>TypeScript is structural:</strong> interfaces are erased at runtime, so no <code>instanceof</code> on an interface; Java and C++ map 1:1 otherwise.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Jumping to classes (or patterns) in the first minute.</strong> Without written requirements and variation points you cannot justify any interface, the first follow-up lands as edits across the design, and "make it thread-safe" finds no identified critical section. Fix: five minutes of requirements, including "what will change later?" and "can two callers hit this at once?", before drawing a single box.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Before classes, let me pin down actors, the core use cases, which rules are likely to change, and whether two callers can hit the same object at once. Then I will list entities, draw the diagram, and code the main flow end to end."</div>
  <div class="revision-say">"I put an interface only where the requirements vary, so a follow-up like this lands as one new class and one line of wiring rather than edits across the model."</div>
  <div class="revision-say">"In Node, synchronous code is atomic per process, but every await is an interleaving point, so I serialise the critical section with a keyed mutex; across instances the guard has to move into the database as a conditional update or a unique constraint."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What an LLD round actually is</h3>
<p>You get a prompt that describes a small, self-contained system. Your output is a <strong>domain model</strong>: which classes exist, what each one is responsible for, how they relate, what the public API looks like, and code that executes the core use case. Storage is usually in-memory (a <code>Map</code> behind a repository class). Networking, deployment and scaling across machines are explicitly <em>not</em> the point; that is HLD.</p>
<p>Typical prompts: parking lot, elevator, vending machine, library management, LRU cache, rate limiter, meeting-room or movie-ticket booking, Splitwise, snake and ladder, chess, notification service, logger, in-memory key-value store, food-delivery order lifecycle.</p>

<h3>LLD vs HLD vs machine coding vs DSA</h3>
<table>
  <thead><tr><th></th><th>HLD (system design)</th><th>LLD (object design)</th><th>Frontend machine coding</th><th>DSA round</th></tr></thead>
  <tbody>
    <tr><td>Unit of design</td><td>Services, databases, queues, caches</td><td>Classes, interfaces, enums, methods</td><td>Components, state, hooks</td><td>One function</td></tr>
    <tr><td>Main artifact</td><td>Box-and-arrow architecture + estimates</td><td>Class diagram + working code</td><td>Running UI</td><td>Correct, optimal algorithm</td></tr>
    <tr><td>"Scale" means</td><td>QPS, storage, replicas, regions</td><td>New requirements arriving (change)</td><td>Many items, re-renders</td><td>Big-O on input size</td></tr>
    <tr><td>Concurrency means</td><td>Distributed consistency, idempotency</td><td>Two callers mutating the same object</td><td>Race between async effects</td><td>Rarely asked</td></tr>
    <tr><td>Typical failure</td><td>Hand-waving, no numbers</td><td>God class, inheritance explosion, no interfaces</td><td>State in the wrong place</td><td>Wrong complexity</td></tr>
    <tr><td>On this site</td><td><a href="#/topic/bsd-framework">Backend SD Framework</a>, <a href="#/topic/sd-framework">10-Step Framework</a></td><td>This module</td><td><a href="#/topic/mc-patterns">Core Patterns</a></td><td>DSA module</td></tr>
  </tbody>
</table>
<p>The two design rounds often appear in the same loop and interviewers sometimes cross the line: an HLD interviewer may say "zoom into the booking service, what are its classes?", and an LLD interviewer may finish with "now there are 50 instances of this service, what breaks?". Being able to switch altitude on request is itself a senior signal.</p>

<h3>Why companies run it</h3>
<ul>
  <li><strong>It predicts day-to-day code quality.</strong> Most engineering time is spent adding a feature to an existing model; the round simulates exactly that: build a model, then survive a change request.</li>
  <li><strong>It tests abstraction, not memorisation.</strong> You cannot recite your way through "now support EV charging"; you either left a seam for it or you did not.</li>
  <li><strong>It exposes communication</strong>: clarifying vague requirements, naming, and explaining trade-offs are all visible in 45 minutes.</li>
</ul>

<h3>Why it matters for Full Stack and Forward Deployed roles</h3>
<p>A frontend engineer mostly models UI state. A full-stack engineer owns the <strong>domain model</strong> behind the API: the <code>Booking</code>, <code>Room</code> and <code>Slot</code> types, the rules that stop a double booking, and the service classes that enforce them. A Forward Deployed Engineer (FDE) does this at speed in front of a customer: an operations lead describes their workflow on a call and you need a model you can code against by the afternoon. The skill being graded is the same in all three cases: listen, extract the nouns and the rules, and find the parts that will change.</p>
<p>Coming from React Native you already have half of this: you design component APIs (props are an interface), lift state to the right owner (responsibility assignment) and compose rather than inherit (React never had component inheritance). LLD asks you to apply the same instincts to classes on the server side.</p>

<h3>The two formats you will meet</h3>
<p><strong>Discussion LLD</strong> (45 to 60 min, whiteboard or doc) weights the diagram, interfaces, core-flow code and follow-ups; it sinks candidates who jump to code. <strong>Machine-coding LLD</strong> (90 to 120 min, your IDE) wants complete, runnable code with in-memory storage and a demo driver; it sinks candidates with an unfinished core flow or one 400-line class. Prepare for machine coding and the discussion format becomes a subset of it.</p>

<h3>What interviewers actually grade</h3>
<table>
  <thead><tr><th>Signal</th><th>Green flag</th><th>Red flag</th></tr></thead>
  <tbody>
    <tr><td>Requirement gathering</td><td>Asks about actors, core use cases, rules and limits; writes an out-of-scope list</td><td>Starts drawing classes in the first minute</td></tr>
    <tr><td>Modelling</td><td>Right nouns; splits type from instance (Book vs BookCopy); one job per class</td><td>A <code>ParkingLotManager</code> that does everything</td></tr>
    <tr><td>Abstraction</td><td>Interfaces exactly where behaviour varies (pricing, allocation, channels)</td><td>Interfaces on everything, or on nothing</td></tr>
    <tr><td>Principles and patterns</td><td>Names a pattern <em>after</em> the force that needs it ("pricing varies by lot, so Strategy")</td><td>"I will use Singleton, Factory and Observer" before knowing the problem</td></tr>
    <tr><td>Code quality</td><td>Enums over strings, private state, small methods, domain errors, injected clock</td><td>Public mutable fields, magic numbers, <code>any</code>, <code>Date.now()</code> sprinkled around</td></tr>
    <tr><td>Correctness</td><td>Core flow runs end to end; invariants enforced inside the entity that owns them</td><td>Half the flow is TODO; the service mutates other objects' fields</td></tr>
    <tr><td>Extensibility</td><td>Follow-up lands as a new class plus a line of wiring</td><td>Follow-up means editing five <code>switch</code> statements</td></tr>
    <tr><td>Concurrency awareness</td><td>Identifies the shared mutable state and the critical section, proposes a lock or a DB constraint</td><td>"JavaScript is single-threaded so there are no races"</td></tr>
    <tr><td>Communication</td><td>Narrates, checks in at step boundaries, states trade-offs</td><td>Silent coding, defensive when challenged</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The four-layer picture</h3>
<p>Almost every LLD solution, whatever the domain, has the same layers. Knowing them in advance means you spend your time on the domain, not on structure.</p>
<div class="diagram">
<pre>
 ┌──────────────────────────────────────────────────────────────────┐
 │ Driver / demo  (main(), a test, or a controller in a real app)   │
 └───────────────────────────────┬──────────────────────────────────┘
                                 │ calls the public API only
 ┌───────────────────────────────▼──────────────────────────────────┐
 │ Service facade   ParkingLotService, LibraryService, Booker       │
 │ orchestrates a use case; owns NO business rules of its own       │
 └───────┬─────────────────────────┬────────────────────────┬───────┘
         │ asks                    │ delegates decisions     │ loads / saves
 ┌───────▼────────────┐  ┌─────────▼───────────────┐  ┌──────▼──────────────┐
 │ Domain model       │  │ Policies («interface»)  │  │ Repositories        │
 │ entities that      │  │ PricingStrategy,        │  │ InMemoryRepo today, │
 │ guard their own    │  │ AllocationStrategy,     │  │ Postgres tomorrow   │
 │ invariants         │  │ FinePolicy, Channel     │  │                     │
 └────────────────────┘  └─────────────────────────┘  └─────────────────────┘
</pre>
</div>
<ul>
  <li><strong>Entities guard invariants.</strong> <code>spot.assign(vehicle)</code> refuses if the spot is occupied. The service never writes <code>spot.vehicle = v</code> directly.</li>
  <li><strong>Policies hold the rules that change.</strong> Pricing, allocation, fines, retry schedules. Each sits behind a small interface so the next rule is a new class.</li>
  <li><strong>The facade is thin.</strong> It looks things up, calls entities and policies in the right order, and saves. If it grows <code>if</code>-trees about business rules, a policy is missing.</li>
  <li><strong>Repositories hide storage.</strong> In the interview they wrap a <code>Map</code>; in production they wrap SQL. Same interface, which is the Dependency Inversion Principle in practice (see <a href="#/topic/design-dip">D · Dependency Inversion</a>).</li>
</ul>

<h3>Stable vs varying: where the interfaces go</h3>
<p>The most useful single question in LLD is: <strong>"which parts of this will change independently of the rest?"</strong> Things that vary get an interface; things that are stable stay concrete. Over-abstracting the stable parts is as bad as hard-coding the varying ones.</p>
<table>
  <thead><tr><th>Problem</th><th>Stable (concrete classes)</th><th>Varying (interface + implementations)</th></tr></thead>
  <tbody>
    <tr><td>Parking lot</td><td>Floor, Spot, Ticket</td><td>Pricing, spot allocation, payment method</td></tr>
    <tr><td>Library</td><td>Book, BookCopy, Loan</td><td>Loan limits, fines, notification of holds</td></tr>
    <tr><td>Rate limiter</td><td>Request, key extraction</td><td>Algorithm (token bucket, sliding window)</td></tr>
    <tr><td>Notifications</td><td>Message, Recipient</td><td>Channel (email, SMS, push), retry policy, template engine</td></tr>
    <tr><td>Meeting rooms</td><td>Room, Booking, TimeRange</td><td>Conflict policy, recurrence rule, room search ranking</td></tr>
  </tbody>
</table>
<p>A useful heuristic: if the interviewer's prompt contains "different", "various", "multiple types of", "can be configured" or "in future", that noun is a variation point.</p>

<h3>Entities, value objects and services</h3>
<p>An <strong>entity</strong> is defined by identity that survives attribute changes (Ticket, Booking, Member) and mutates only through methods that guard its invariants. A <strong>value object</strong> is defined by its values and is immutable: two equal ones are interchangeable (Money, TimeRange, LicensePlate). A <strong>service</strong> orchestrates a use case and holds collaborators, not domain state; a <strong>policy</strong> is a swappable rule (HourlyPricing, NearestSpotFirst). Value objects are underused in interviews and cheap: a <code>TimeRange</code> with <code>overlaps(other)</code> makes booking-conflict code read like the requirement.</p>

<h3>UML-lite in ASCII: the notation</h3>
<p>Interviewers do not expect full UML. They expect boxes with a name, the important fields and the important methods, plus arrows that distinguish "is-a", "implements", "owns" and "uses". Visibility prefixes: <code>+</code> public, <code>-</code> private, <code>#</code> protected. Stereotypes go in guillemets: <code>«interface»</code>, <code>«enum»</code>, <code>«abstract»</code>.</p>
<div class="diagram">
<pre>
 ┌────────────────────────────────┐     ┌────────────────────────────────┐
 │ ParkingSpot                    │     │ «interface»                    │
 ├────────────────────────────────┤     │ PricingStrategy                │
 │ - id: string                   │     ├────────────────────────────────┤
 │ - size: SpotSize               │     │ + priceFor(t: Ticket,          │
 │ - vehicle: Vehicle | null      │     │            exit: Date): number │
 ├────────────────────────────────┤     └────────────────────────────────┘
 │ + canFit(v: Vehicle): boolean  │
 │ + assign(v: Vehicle): void     │     ┌────────────────────────────────┐
 │ + release(): void              │     │ «enum» SpotSize                │
 └────────────────────────────────┘     │ SMALL | MEDIUM | LARGE         │
   name / fields / methods              └────────────────────────────────┘
</pre>
</div>
<table>
  <thead><tr><th>Relationship</th><th>Meaning</th><th>Drawn</th><th>Typed (Mermaid / PlantUML style)</th><th>What it looks like in TS</th></tr></thead>
  <tbody>
    <tr><td>Inheritance (generalisation)</td><td>is-a, substitutable</td><td><code>Car ──▷ Vehicle</code></td><td><code>Vehicle &lt;|-- Car</code></td><td><code>class Car extends Vehicle</code></td></tr>
    <tr><td>Realisation</td><td>implements a contract</td><td><code>HourlyPricing ┄┄▷ PricingStrategy</code></td><td><code>PricingStrategy &lt;|.. HourlyPricing</code></td><td><code>class HourlyPricing implements PricingStrategy</code></td></tr>
    <tr><td>Composition</td><td>owns; the part is created by and dies with the whole</td><td><code>Floor ◆── Spot</code></td><td><code>Floor *-- Spot</code></td><td>Floor constructs its spots internally</td></tr>
    <tr><td>Aggregation</td><td>has; the part can exist independently or be shared</td><td><code>Lot ◇── Gate</code></td><td><code>Lot o-- Gate</code></td><td>Reference passed into the constructor</td></tr>
    <tr><td>Association</td><td>knows about, held as a field</td><td><code>Ticket ──► Spot</code></td><td><code>Ticket --&gt; Spot</code></td><td><code>readonly spot: ParkingSpot</code></td></tr>
    <tr><td>Dependency</td><td>uses temporarily</td><td><code>Service ┄┄► Clock</code></td><td><code>Service ..&gt; Clock</code></td><td>A parameter or local variable</td></tr>
  </tbody>
</table>
<p>Multiplicity goes at each end of the line: <code>1</code>, <code>0..1</code>, <code>*</code> (zero or more), <code>1..*</code>. "Floor 1 ◆── * Spot" reads "a floor owns many spots; each spot belongs to exactly one floor". Composition vs aggregation is the distinction interviewers poke at most; the practical test is <em>who creates the part and does it outlive the whole?</em></p>

<h3>Composition vs inheritance</h3>
<p>Inheritance models <strong>is-a with substitutability</strong>: every <code>Car</code> can be used anywhere a <code>Vehicle</code> is expected without surprises (that is Liskov, see <a href="#/topic/design-lsp">L · Liskov Substitution</a>). Composition models <strong>has-a</strong> or <strong>behaves-like</strong>: a spot <em>has</em> a charger, a lot <em>uses</em> a pricing strategy. The failure mode of inheritance is the combinatorial explosion when two independent things vary:</p>
<div class="diagram">
<pre>
 Inheritance for two independent axes (size x feature):

                         ParkingSpot
        ┌─────────────────────┼─────────────────────┐
     SmallSpot            MediumSpot             LargeSpot
     ├─ SmallEvSpot       ├─ MediumEvSpot        ├─ LargeEvSpot
     └─ SmallAccessible   ├─ MediumAccessible    └─ LargeAccessibleEvSpot ...
                          └─ MediumAccessibleEvSpot          (3 x 4 = 12 classes)

 Composition: one class, two fields

  ParkingSpot { size: SpotSize; features: Set&lt;SpotFeature&gt; }      (1 class + 2 enums)
</pre>
</div>
<table>
  <thead><tr><th>Use inheritance when</th><th>Use composition when</th></tr></thead>
  <tbody>
    <tr><td>The child truly is a specialised parent and passes every test the parent passes</td><td>The relationship is has-a, uses, or "can be configured with"</td></tr>
    <tr><td>There is one axis of variation and it is stable</td><td>Two or more axes vary independently (size x features, channel x template)</td></tr>
    <tr><td>You want a template algorithm with a few overridable steps (Template Method)</td><td>Behaviour must change at runtime (a spot gains a charger; a user switches plan)</td></tr>
    <tr><td>The hierarchy is shallow (one or two levels)</td><td>You want to unit test each behaviour in isolation</td></tr>
  </tbody>
</table>
<p>Default to composition; reach for inheritance when the is-a is obvious and shallow. React already trained you here: components compose, and the React docs have long recommended composition over component inheritance.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"More classes and more patterns means a better design." Interviewers grade <em>fit</em>. A vending machine with nine classes and four patterns but no working <code>insertCoin</code> flow scores below a five-class design that runs and absorbs the follow-up. Every class and interface should be traceable to a requirement or a stated variation point.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>The seven steps, each with what to do, what to say, and a running example: a <strong>library lending system</strong> (members borrow and return physical copies of books; late returns are fined). The case-study topics apply the same steps to bigger problems.</p>

<h3>Step 1: Requirements (functional + non-functional)</h3>
<p>Spend the first five minutes turning the one-line prompt into a numbered list you and the interviewer agree on. Write it where both of you can see it; you will point back at it when you justify classes.</p>
<table>
  <thead><tr><th>Ask about</th><th>Example question</th><th>Why it changes the design</th></tr></thead>
  <tbody>
    <tr><td>Actors</td><td>"Who uses this: members, librarians, an admin, an external system?"</td><td>Each actor's use cases become service methods; permissions may become a policy</td></tr>
    <tr><td>Core use cases</td><td>"What are the three things that must work end to end?"</td><td>These are the flows you will code; everything else is a stretch goal</td></tr>
    <tr><td>Rules and limits</td><td>"Is there a limit on active loans? Does it depend on membership type?"</td><td>Rules that depend on a type are policy candidates</td></tr>
    <tr><td>Variation hints</td><td>"Will fines differ by branch or member type later?"</td><td>Tells you where to put interfaces</td></tr>
    <tr><td>Concurrency</td><td>"Can two people borrow at the same moment, from two kiosks?"</td><td>Identifies shared mutable state and the critical section</td></tr>
    <tr><td>Scale (rough)</td><td>"Hundreds of copies or millions?"</td><td>Decides whether a linear scan is fine or you need an index</td></tr>
    <tr><td>Persistence and interfaces</td><td>"In-memory is fine? CLI, REST, or just a class API?"</td><td>Usually: in-memory behind repositories, class API plus a demo</td></tr>
    <tr><td>Out of scope</td><td>"Shall I leave payments, auth and UI out?"</td><td>Protects your time; shows you can scope</td></tr>
  </tbody>
</table>
<p>The written output for the library example:</p>
<pre><code class="language-text">Functional
  FR1  Librarian adds books (ISBN, title, author) and physical copies of each book.
  FR2  Member searches the catalogue by title / author / ISBN.
  FR3  Member borrows an available copy. Limit: 3 active loans (PREMIUM: 10).
       Loan period: 14 days (PREMIUM: 28).
  FR4  Member returns a copy. Late return: Rs 10 per day, capped at Rs 500.
  FR5  (stretch) Member places a hold on a book with no free copy and is
       notified when one comes back.

Non-functional
  NFR1 Two members must never hold the same copy (two kiosks, concurrent).
  NFR2 Limits, loan periods and fines will change: keep them pluggable.
  NFR3 In-memory storage behind repositories, so a DB can replace it.
  NFR4 Deterministic tests: time comes from an injected clock.

Out of scope: fine payment, auth, UI, multiple branches.</code></pre>

<h3>Step 2: Entities &amp; relationships</h3>
<p><strong>Noun extraction:</strong> underline the nouns in your requirement list, then filter. Nouns that only describe something else are attributes; nouns that are computed are policy outputs; actors are usually roles, not classes.</p>
<table>
  <thead><tr><th>Decision</th><th>Nouns</th><th>Reason</th></tr></thead>
  <tbody>
    <tr><td>Entity</td><td>Book, BookCopy, Member, Loan</td><td>Identity plus state that changes (or catalogue data others point at)</td></tr>
    <tr><td>Attribute</td><td>ISBN, title, author (of Book); due date (of Loan)</td><td>Describe another noun; no behaviour of their own</td></tr>
    <tr><td>Policy</td><td>Fine (<code>FinePolicy</code>), limit and loan period (<code>LoanPolicy</code>)</td><td>Computed from rules that NFR2 says will change</td></tr>
    <tr><td>Facade / repository</td><td>Library (<code>LibraryService</code>), catalogue (repository query)</td><td>Orchestration and lookup, not domain state</td></tr>
    <tr><td>Actor only</td><td>Librarian</td><td>Calls the service; no auth in scope, so no class</td></tr>
  </tbody>
</table>
<div class="callout insight">
  <div class="callout-title">The type vs instance split</div>
  <p><strong>Book vs BookCopy</strong> is the single most common modelling insight in LLD. A <em>Book</em> is catalogue data (one row per ISBN); a <em>BookCopy</em> is a physical item with a status (many per ISBN). The same split shows up as Movie vs Show vs Seat, Product vs InventoryItem, RoomType vs Room, VehicleModel vs Vehicle. Missing it means FR3 ("borrow an available <em>copy</em>") cannot be expressed.</p>
</div>
<p><strong>Responsibilities (CRC: class, responsibility, collaborators):</strong> one sentence per class. If a sentence needs "and" twice, the class is doing too much.</p>
<table>
  <thead><tr><th>Class</th><th>Responsibility</th><th>Collaborators</th></tr></thead>
  <tbody>
    <tr><td>BookCopy</td><td>Knows and guards its own availability</td><td>Book</td></tr>
    <tr><td>Member</td><td>Tracks its active loans</td><td>Loan (by id)</td></tr>
    <tr><td>Loan</td><td>Records a borrowing and whether it is closed</td><td>Member, BookCopy</td></tr>
    <tr><td>LoanPolicy</td><td>Decides limits and loan period for a member</td><td>Member</td></tr>
    <tr><td>FinePolicy</td><td>Prices a late return</td><td>Loan</td></tr>
    <tr><td>LibraryService</td><td>Runs checkout and return in the right order</td><td>All of the above, repositories, Clock</td></tr>
  </tbody>
</table>
<p><strong>Relationships with multiplicity:</strong></p>
<ul>
  <li>Book 1 ── * BookCopy (association: a copy references its book)</li>
  <li>Member 1 ── * Loan, BookCopy 1 ── * Loan (over time a copy has many loans, at most one open)</li>
  <li>LibraryService ◇── LoanPolicy, FinePolicy, repositories, Clock (aggregation: injected, owned elsewhere)</li>
  <li>TierLoanPolicy ┄┄▷ LoanPolicy, PerDayFinePolicy ┄┄▷ FinePolicy (realisation)</li>
</ul>

<h3>Step 3: Class diagram (ASCII)</h3>
<p>Draw only what earns its place: names, key fields, key methods, arrows with multiplicities, and the interfaces. Keep it to one screen.</p>
<div class="diagram">
<pre>
                        ┌──────────────────────────────┐
                        │ LibraryService               │
                        ├──────────────────────────────┤
                        │ + checkout(memberId, isbn)   │
                        │ + returnCopy(loanId)         │
                        └──┬─────────┬──────────┬──────┘
               ◇ injected  │         │ uses     │ ◇ injected
       ┌───────────────────▼──┐      │      ┌───▼──────────────────────┐
       │ «interface»          │      │      │ «interface»              │
       │ LoanPolicy           │      │      │ FinePolicy               │
       ├──────────────────────┤      │      ├──────────────────────────┤
       │ + maxActiveLoans(m)  │      │      │ + fineFor(loan, at)      │
       │ + loanDays(m)        │      │      └───────────▲──────────────┘
       └──────────▲───────────┘      │                  ┊
                  ┊ implements       │                  ┊ implements
       ┌──────────┴───────────┐      │      ┌───────────┴──────────────┐
       │ TierLoanPolicy       │      │      │ PerDayFinePolicy         │
       └──────────────────────┘      │      └──────────────────────────┘
                                     ▼
 ┌──────────────┐ 1      * ┌──────────────┐ *      1 ┌──────────────┐ *    1 ┌────────────┐
 │ Member       │◄─────────│ Loan         │─────────►│ BookCopy     │───────►│ Book       │
 ├──────────────┤          ├──────────────┤          ├──────────────┤        ├────────────┤
 │ - id, name   │          │ - id         │          │ - id         │        │ isbn       │
 │ - tier       │          │ - borrowedAt │          │ - status     │        │ title      │
 │ - loanIds    │          │ - dueAt      │          ├──────────────┤        │ author     │
 ├──────────────┤          │ - returnedAt │          │ + isAvailable│        └────────────┘
 │ + addLoan    │          ├──────────────┤          │ + markBorrowed
 │ + removeLoan │          │ + close(at)  │          │ + markReturned
 └──────────────┘          └──────────────┘          └──────────────┘
</pre>
</div>

<h3>Step 4: Interfaces / APIs</h3>
<p>Write the signatures before any bodies. This is the contract the interviewer reviews, and it forces you to decide enums, return types and the error strategy up front.</p>
<pre><code class="language-ts">// Enums and value types
enum CopyStatus { AVAILABLE = 'AVAILABLE', BORROWED = 'BORROWED', LOST = 'LOST' }
enum MemberTier { STANDARD = 'STANDARD', PREMIUM = 'PREMIUM' }

interface Clock { now(): Date; }

// Variation points (NFR2)
interface LoanPolicy {
  maxActiveLoans(member: Member): number;
  loanDays(member: Member): number;
}
interface FinePolicy {
  fineFor(loan: Loan, returnedAt: Date): number; // integer paise, never float rupees
}

// Storage seam (NFR3)
interface Repository&lt;T extends { id: string }&gt; {
  save(item: T): void;
  get(id: string): T;                      // throws NOT_FOUND
  find(pred: (item: T) =&gt; boolean): T[];
}

// The public API the driver (or a REST controller) calls
interface LibraryApi {
  checkout(memberId: string, isbn: string): Loan;                       // FR3
  returnCopy(loanId: string): { loan: Loan; finePaise: number };        // FR4
}

// Error contract: one domain error type carrying a machine-readable code
type LibraryErrorCode = 'NOT_FOUND' | 'LOAN_LIMIT' | 'NO_COPY' | 'COPY_UNAVAILABLE' | 'LOAN_CLOSED';</code></pre>
<p>Choices worth saying out loud: string enums (readable in logs and JSON) instead of numeric ones; money as integer minor units; one domain error class with a code so a controller can map codes to HTTP statuses; a <code>Result</code> type is a fine alternative if the interviewer prefers no exceptions (see <a href="#/topic/ts-patterns">TypeScript Common Patterns</a>).</p>

<h3>Step 5: Core flows</h3>
<p>Walk the main use case as a sequence, naming which object makes each decision. This catches responsibility mistakes before you write code.</p>
<div class="diagram">
<pre>
 Driver          LibraryService            repos / LoanPolicy         BookCopy
   │ checkout(M1,isbn) │                           │                       │
   │──────────────────►│ 1. members.get(M1)        │                       │
   │                   │──────────────────────────►│                       │
   │                   │ 2. maxActiveLoans(member) │  (reject: LOAN_LIMIT) │
   │                   │──────────────────────────►│                       │
   │                   │ 3. find available copy    │  (reject: NO_COPY)    │
   │                   │──────────────────────────►│                       │
   │                   │ 4. markBorrowed()   the copy guards its own state │
   │                   │──────────────────────────────────────────────────►│
   │                   │ 5. new Loan(dueAt = now + loanDays); save         │
   │◄──── Loan L1 ─────│                                                   │
</pre>
</div>
<p>For anything with a lifecycle, also draw the state machine. Transitions become methods; illegal transitions become errors.</p>
<div class="diagram">
<pre>
               markBorrowed()
   AVAILABLE ─────────────────► BORROWED
       ▲                           │  │
       └────── markReturned() ─────┘  │ reportLost()
                                      ▼
                                    LOST   (terminal; librarian may write off)
</pre>
</div>

<h3>Step 6: Code</h3>
<p>Write in dependency order so nothing references an undefined type, and so a time-out still leaves you with a coherent core:</p>
<ol>
  <li><strong>Enums and value objects</strong> (<code>CopyStatus</code>, <code>Money</code>, <code>TimeRange</code>).</li>
  <li><strong>Entities</strong> with their invariant-guarding methods.</li>
  <li><strong>Interfaces</strong> for policies and repositories.</li>
  <li><strong>One implementation of each interface</strong> (the simplest that meets the requirement).</li>
  <li><strong>The service facade</strong>, injecting everything through the constructor.</li>
  <li><strong>A demo driver</strong> that runs the core flows and prints results. In machine coding, this is how you prove it works.</li>
</ol>
<p>Conventions that interviewers notice:</p>
<ul>
  <li>Fields <code>private</code> (or <code>readonly</code> when they never change). State changes only through methods named after the domain action (<code>markBorrowed</code>, not <code>setStatus</code>).</li>
  <li>Constructor injection for every collaborator, including the clock and the id generator. No <code>new</code> of a collaborator inside a service.</li>
  <li>Enums instead of string literals scattered through code; no magic numbers (named constants or policy config).</li>
  <li>Return copies or <code>ReadonlyArray</code> from getters so callers cannot mutate internal collections.</li>
  <li>Small methods: if a method needs a comment to explain its sections, split it.</li>
</ul>
<p>TypeScript to Java / C++ mapping, since many interviewers think in Java:</p>
<table>
  <thead><tr><th>Concept</th><th>TypeScript</th><th>Java</th><th>C++</th></tr></thead>
  <tbody>
    <tr><td>Interface</td><td><code>interface PricingStrategy { ... }</code></td><td><code>interface PricingStrategy { ... }</code></td><td>Class with only pure virtual methods</td></tr>
    <tr><td>Abstract class</td><td><code>abstract class Vehicle</code></td><td><code>abstract class Vehicle</code></td><td>Class with at least one <code>= 0</code> method</td></tr>
    <tr><td>Enum</td><td><code>enum SpotSize { SMALL = 'SMALL' }</code></td><td><code>enum SpotSize { SMALL }</code></td><td><code>enum class SpotSize { SMALL }</code></td></tr>
    <tr><td>Immutability</td><td><code>readonly</code></td><td><code>final</code></td><td><code>const</code></td></tr>
    <tr><td>Generic map</td><td><code>Map&lt;string, Spot&gt;</code></td><td><code>Map&lt;String, Spot&gt;</code></td><td><code>std::unordered_map&lt;std::string, Spot&gt;</code></td></tr>
    <tr><td>Typing model</td><td><strong>Structural</strong>: any object with the right shape satisfies an interface; interfaces vanish at runtime</td><td>Nominal</td><td>Nominal</td></tr>
  </tbody>
</table>
<p>The structural-typing row matters: in TypeScript you cannot <code>instanceof</code> an interface, and <code>implements</code> is only a compile-time check. Use a discriminant field or a class when you need a runtime type test.</p>

<h3>Step 7: Extensibility &amp; concurrency</h3>
<p><strong>Extensibility.</strong> When the interviewer says "now add X", answer in three beats: <em>which existing interface absorbs it</em>, <em>the new class</em>, <em>the one line of wiring that changes</em>. If the answer is "edit five classes", say so honestly and refactor the seam first.</p>
<table>
  <thead><tr><th>Follow-up</th><th>Where it lands</th><th>Shape</th></tr></thead>
  <tbody>
    <tr><td>"Premium members get half fines"</td><td>New <code>FinePolicy</code> implementation (or a decorator over the existing one)</td><td>Strategy / Decorator</td></tr>
    <tr><td>"Notify members when a held book is returned"</td><td>Return flow emits a <code>CopyReturned</code> event; a hold service subscribes</td><td>Observer</td></tr>
    <tr><td>"Add e-books with unlimited concurrent loans"</td><td>A <code>Lendable</code> interface implemented by <code>BookCopy</code> and <code>EbookLicence</code></td><td>Polymorphism</td></tr>
    <tr><td>"Persist to Postgres"</td><td>New <code>Repository</code> implementation</td><td>Repository / DIP</td></tr>
    <tr><td>"Audit every action"</td><td>Wrap the service in an auditing implementation of <code>LibraryApi</code></td><td>Decorator / Proxy</td></tr>
  </tbody>
</table>

<p><strong>Concurrency.</strong> "Make it thread-safe" is asked in every LLD round. In Java the answer is <code>synchronized</code>, <code>ReentrantLock</code>, <code>ConcurrentHashMap</code> or <code>AtomicInteger</code>. In TypeScript on Node the honest answer has three layers:</p>
<ol>
  <li><strong>Synchronous code is atomic within one process.</strong> Node runs your JavaScript on one thread, so a method with no <code>await</code> inside cannot be interleaved. The library <code>checkout</code> above is race-free in-process for that reason.</li>
  <li><strong>Every <code>await</code> is a point where another request can run.</strong> Real services await I/O, and that is where check-then-act races appear:</li>
</ol>
<pre><code class="language-ts">// RACE: two kiosks call this at the same time for the last copy
async checkout(memberId: string, isbn: string): Promise&lt;Loan&gt; {
  const copy = await this.copies.findAvailable(isbn);   // both requests see C1 AVAILABLE
  await this.audit.log('checkout-attempt', memberId);   // yields: the other request runs here
  copy.markBorrowed();                                   // in-memory: second call throws.
  await this.copies.save(copy);                          // with a DB and no guard: BOTH succeed
  // ...
}</code></pre>
<p>The in-process fix is an async mutex that serialises the critical section, ideally keyed by the contended resource so unrelated work still runs in parallel:</p>
<pre><code class="language-ts">class Mutex {
  private tail: Promise&lt;void&gt; = Promise.resolve();

  async runExclusive&lt;T&gt;(fn: () =&gt; Promise&lt;T&gt; | T): Promise&lt;T&gt; {
    const previous = this.tail;
    let release!: () =&gt; void;
    this.tail = new Promise&lt;void&gt;(resolve =&gt; { release = resolve; });
    await previous;                 // wait for everyone queued before us
    try { return await fn(); }
    finally { release(); }          // always release, even if fn throws
  }
}

class KeyedMutex {
  private readonly locks = new Map&lt;string, { mutex: Mutex; users: number }&gt;();

  async runExclusive&lt;T&gt;(key: string, fn: () =&gt; Promise&lt;T&gt; | T): Promise&lt;T&gt; {
    let entry = this.locks.get(key);
    if (!entry) { entry = { mutex: new Mutex(), users: 0 }; this.locks.set(key, entry); }
    entry.users++;
    try { return await entry.mutex.runExclusive(fn); }
    finally {
      entry.users--;
      if (entry.users === 0) this.locks.delete(key);   // no unbounded growth
    }
  }
}

// usage: one lock per ISBN, so checkouts of different books do not block each other
// return this.locks.runExclusive(isbn, () =&gt; this.checkoutUnsafe(memberId, isbn));</code></pre>
<ol start="3">
  <li><strong>Across processes or instances, an in-memory lock protects nothing.</strong> Two Node instances behind a load balancer each have their own mutex. Push the guard into the shared store: a conditional update (optimistic concurrency), a row lock, or a unique constraint.</li>
</ol>
<pre><code class="language-sql">-- Optimistic: succeed only if nobody changed the row since we read it
UPDATE book_copies
   SET status = 'BORROWED', version = version + 1
 WHERE id = $1 AND status = 'AVAILABLE' AND version = $2;
-- rowCount = 1: we won.  rowCount = 0: someone else did; retry or report NO_COPY.

-- Invariant as a constraint: at most one open loan per copy
CREATE UNIQUE INDEX one_open_loan_per_copy ON loans (copy_id) WHERE returned_at IS NULL;</code></pre>
<p>Saying all three layers, in that order, is the senior answer. The deep version, with double-booking of time ranges, is in <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: the complete library solution (steps 4 to 6 as code)</h3>
<p>This is the size of answer a 45-minute round expects for the core flow: about 150 lines, runnable, with a driver. Interfaces from Step 4 are repeated so the block stands alone.</p>
<pre><code class="language-ts">// ---- enums, value types, errors ----
enum CopyStatus { AVAILABLE = 'AVAILABLE', BORROWED = 'BORROWED', LOST = 'LOST' }
enum MemberTier { STANDARD = 'STANDARD', PREMIUM = 'PREMIUM' }

const DAY_MS = 24 * 60 * 60 * 1000;

interface Clock { now(): Date; }
const systemClock: Clock = { now: () =&gt; new Date() };

type LibraryErrorCode = 'NOT_FOUND' | 'LOAN_LIMIT' | 'NO_COPY' | 'COPY_UNAVAILABLE' | 'LOAN_CLOSED';
class LibraryError extends Error {
  constructor(readonly code: LibraryErrorCode, message: string) { super(message); }
}

// ---- entities ----
class Book {
  constructor(readonly isbn: string, readonly title: string, readonly author: string) {}
}

class BookCopy {
  private status: CopyStatus = CopyStatus.AVAILABLE;
  constructor(readonly id: string, readonly book: Book) {}

  isAvailable(): boolean { return this.status === CopyStatus.AVAILABLE; }

  markBorrowed(): void {
    if (!this.isAvailable()) {
      throw new LibraryError('COPY_UNAVAILABLE', 'Copy ' + this.id + ' is ' + this.status);
    }
    this.status = CopyStatus.BORROWED;
  }

  markReturned(): void { this.status = CopyStatus.AVAILABLE; }
}

class Member {
  private readonly loanIds = new Set&lt;string&gt;();
  constructor(readonly id: string, readonly name: string, readonly tier: MemberTier) {}

  get activeLoanCount(): number { return this.loanIds.size; }
  addLoan(loanId: string): void { this.loanIds.add(loanId); }
  removeLoan(loanId: string): void { this.loanIds.delete(loanId); }
}

class Loan {
  private returnedAtValue: Date | null = null;
  constructor(
    readonly id: string,
    readonly copy: BookCopy,
    readonly member: Member,
    readonly borrowedAt: Date,
    readonly dueAt: Date,
  ) {}

  get returnedAt(): Date | null { return this.returnedAtValue; }
  isOpen(): boolean { return this.returnedAtValue === null; }

  close(at: Date): void {
    if (!this.isOpen()) throw new LibraryError('LOAN_CLOSED', 'Loan ' + this.id + ' already returned');
    this.returnedAtValue = at;
  }
}

// ---- policies (variation points) ----
interface LoanPolicy {
  maxActiveLoans(member: Member): number;
  loanDays(member: Member): number;
}
interface FinePolicy {
  fineFor(loan: Loan, returnedAt: Date): number; // paise
}

// Data-driven: a new tier is a new row, not a new if-branch
const TIER_RULES: Record&lt;MemberTier, { maxLoans: number; days: number }&gt; = {
  [MemberTier.STANDARD]: { maxLoans: 3, days: 14 },
  [MemberTier.PREMIUM]: { maxLoans: 10, days: 28 },
};

class TierLoanPolicy implements LoanPolicy {
  maxActiveLoans(m: Member): number { return TIER_RULES[m.tier].maxLoans; }
  loanDays(m: Member): number { return TIER_RULES[m.tier].days; }
}

class PerDayFinePolicy implements FinePolicy {
  constructor(private readonly paisePerDay: number, private readonly capPaise: number) {}

  fineFor(loan: Loan, returnedAt: Date): number {
    const lateMs = returnedAt.getTime() - loan.dueAt.getTime();
    if (lateMs &lt;= 0) return 0;
    const lateDays = Math.ceil(lateMs / DAY_MS);     // any part of a day counts
    return Math.min(lateDays * this.paisePerDay, this.capPaise);
  }
}

// ---- storage seam ----
class InMemoryRepo&lt;T extends { id: string }&gt; {
  private readonly items = new Map&lt;string, T&gt;();
  save(item: T): void { this.items.set(item.id, item); }
  get(id: string): T {
    const item = this.items.get(id);
    if (!item) throw new LibraryError('NOT_FOUND', 'No entity with id ' + id);
    return item;
  }
  find(pred: (item: T) =&gt; boolean): T[] {
    return [...this.items.values()].filter(pred);
  }
}

// ---- service facade ----
class LibraryService {
  private nextLoanNo = 1;

  constructor(
    private readonly copies: InMemoryRepo&lt;BookCopy&gt;,
    private readonly members: InMemoryRepo&lt;Member&gt;,
    private readonly loans: InMemoryRepo&lt;Loan&gt;,
    private readonly loanPolicy: LoanPolicy,
    private readonly finePolicy: FinePolicy,
    private readonly clock: Clock = systemClock,
  ) {}

  checkout(memberId: string, isbn: string): Loan {
    const member = this.members.get(memberId);
    if (member.activeLoanCount &gt;= this.loanPolicy.maxActiveLoans(member)) {
      throw new LibraryError('LOAN_LIMIT', member.name + ' is at the loan limit');
    }
    const copy = this.copies.find(c =&gt; c.book.isbn === isbn &amp;&amp; c.isAvailable())[0];
    if (!copy) throw new LibraryError('NO_COPY', 'No available copy of ' + isbn);

    const now = this.clock.now();
    const dueAt = new Date(now.getTime() + this.loanPolicy.loanDays(member) * DAY_MS);
    const loan = new Loan('L' + this.nextLoanNo++, copy, member, now, dueAt);

    copy.markBorrowed();          // the copy guards its own invariant
    member.addLoan(loan.id);
    this.loans.save(loan);
    return loan;
  }

  returnCopy(loanId: string): { loan: Loan; finePaise: number } {
    const loan = this.loans.get(loanId);
    const now = this.clock.now();
    loan.close(now);              // throws LOAN_CLOSED on a double return
    loan.copy.markReturned();
    loan.member.removeLoan(loan.id);
    return { loan, finePaise: this.finePolicy.fineFor(loan, now) };
  }
}

// ---- demo driver ----
class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date { return this.current; }
  advanceDays(days: number): void { this.current = new Date(this.current.getTime() + days * DAY_MS); }
}

const clock = new FixedClock(new Date('2026-01-01T10:00:00Z'));
const copies = new InMemoryRepo&lt;BookCopy&gt;();
const members = new InMemoryRepo&lt;Member&gt;();
const loans = new InMemoryRepo&lt;Loan&gt;();

const book = new Book('ISBN-001', 'Designing Data Systems', 'A. Author');
copies.save(new BookCopy('C1', book));
members.save(new Member('M1', 'Asha', MemberTier.STANDARD));
members.save(new Member('M2', 'Ravi', MemberTier.STANDARD));

const library = new LibraryService(
  copies, members, loans, new TierLoanPolicy(), new PerDayFinePolicy(1000, 50000), clock,
);

const loan = library.checkout('M1', 'ISBN-001');
console.log(loan.id, loan.dueAt.toISOString());               // L1 2026-01-15T10:00:00.000Z

try { library.checkout('M2', 'ISBN-001'); }
catch (e) { console.log((e as LibraryError).code); }          // NO_COPY

clock.advanceDays(17);                                        // 3 days late
console.log(library.returnCopy(loan.id).finePaise);           // 3000 (Rs 30)</code></pre>
<p>What to point out while presenting it: the service contains no business rules (limits and fines live in policies); the copy, not the service, refuses a double borrow; time and storage are injected, so the driver is a deterministic test.</p>

<h3>Example 2: follow-up "premium members pay half fines" (absorbed by addition)</h3>
<p>No existing class changes. A decorator wraps any fine policy, so it also composes with future ones.</p>
<pre><code class="language-ts">class TierDiscountFinePolicy implements FinePolicy {
  constructor(
    private readonly inner: FinePolicy,
    private readonly discountPct: Partial&lt;Record&lt;MemberTier, number&gt;&gt;,
  ) {}

  fineFor(loan: Loan, returnedAt: Date): number {
    const base = this.inner.fineFor(loan, returnedAt);
    const pct = this.discountPct[loan.member.tier] ?? 0;
    return Math.round(base * (100 - pct) / 100);
  }
}

// wiring: the only line that changes
const finePolicy = new TierDiscountFinePolicy(
  new PerDayFinePolicy(1000, 50000),
  { [MemberTier.PREMIUM]: 50 },
);</code></pre>

<h3>Example 3: follow-up "notify the next member in the hold queue" (Observer)</h3>
<p>The return flow publishes an event; it does not know who listens. Holds become a separate class with its own responsibility.</p>
<pre><code class="language-ts">type LibraryEvent = { type: 'COPY_RETURNED'; isbn: string; copyId: string };
type Listener = (e: LibraryEvent) =&gt; void;

class EventBus {
  private readonly listeners: Listener[] = [];
  subscribe(l: Listener): () =&gt; void {
    this.listeners.push(l);
    return () =&gt; { this.listeners.splice(this.listeners.indexOf(l), 1); };
  }
  publish(e: LibraryEvent): void {
    for (const l of [...this.listeners]) {
      try { l(e); } catch (err) { console.error('listener failed', err); } // one bad listener cannot break returns
    }
  }
}

interface Notifier { notify(memberId: string, text: string): void; }

class HoldQueue {
  private readonly queues = new Map&lt;string, string[]&gt;(); // isbn -&gt; memberIds (FIFO)

  constructor(bus: EventBus, private readonly notifier: Notifier) {
    bus.subscribe(e =&gt; { if (e.type === 'COPY_RETURNED') this.onReturned(e.isbn); });
  }

  placeHold(memberId: string, isbn: string): void {
    const q = this.queues.get(isbn) ?? [];
    if (!q.includes(memberId)) q.push(memberId);
    this.queues.set(isbn, q);
  }

  private onReturned(isbn: string): void {
    const next = this.queues.get(isbn)?.shift();
    if (next) this.notifier.notify(next, 'A copy of ' + isbn + ' is ready for you');
  }
}

// In LibraryService.returnCopy, after markReturned():
//   this.bus.publish({ type: 'COPY_RETURNED', isbn: loan.copy.book.isbn, copyId: loan.copy.id });</code></pre>
<p>Honest trade-off to state: a held copy should probably be <em>reserved</em> for the notified member for 48 hours, which adds a <code>RESERVED</code> state to <code>BookCopy</code>. That is a real edit to an existing class, and saying so is better than pretending everything is pure addition.</p>

<h3>Example 4: the first five minutes, as a script</h3>
<pre><code class="language-text">Interviewer: Design a library management system.

You: Before classes, let me pin down scope. Who are the actors: members and
     librarians? Is there an online catalogue or only in-branch kiosks?
     ...
You: So the core flows are add copy, borrow and return, with limits by tier and
     a daily fine. Holds are a stretch goal. I will keep storage in-memory behind
     repositories and inject the clock so I can test fines. Two kiosks may borrow
     concurrently, so I will call out the critical section. Payments, auth and
     multi-branch are out of scope. Does that match what you want to see?

Interviewer: Yes, and assume fines may differ per branch later.

You: Good, that makes the fine rule a variation point, so it gets an interface.
     Next I will list the entities...</code></pre>
<p>That last exchange is the whole game: the interviewer just told you where the follow-up will come from.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. The prompt is one line and the interviewer says "your call"</h3>
<p>Propose a scope yourself: three core use cases, two non-functional requirements, an out-of-scope list. Ask for a nod and move on. Endless questions are as bad as none; cap requirements at five to eight minutes.</p>

<h3>2. "Skip the diagram, just code"</h3>
<p>Comply, but spend 60 seconds writing the class list and one-line responsibilities as a comment block at the top of the file. It keeps you honest and gives the interviewer a map of the code that follows.</p>

<h3>3. You are running out of time mid-code</h3>
<p>Finish the core flow end to end first, with the simplest implementation of each interface. Stub the rest as interfaces with a one-line TODO and say what each would do. A working thin slice beats a half-written thick one. Leave three minutes for the driver.</p>

<h3>4. The interviewer is silent</h3>
<p>Narrate and check in at each step boundary ("Requirements done, moving to entities unless you want to change scope"). Silence is not approval; checkpoints let them redirect cheaply.</p>

<h3>5. Type vs instance hidden in the prompt</h3>
<p>"Book a seat for a movie" hides Movie (catalogue), Show (a screening at a time in a hall) and Seat/ShowSeat (bookable instance). If a noun has both catalogue data and per-item state, it is two classes. Spot this in Step 2, because retrofitting it later touches everything.</p>

<h3>6. Enum or class hierarchy for a "type"?</h3>
<p>If types differ only in <em>data</em> (size, rate), use an enum plus a lookup table. If they differ in <em>behaviour</em> (how a payment is processed), use an interface with one class per type. If the set of types is user-defined at runtime (admin creates "Valet" spots), neither: make the type itself an entity with configuration fields.</p>

<h3>7. Time</h3>
<p>Inject a <code>Clock</code>; never call <code>new Date()</code> or <code>Date.now()</code> inside domain code. Store instants in UTC and convert to a time zone only for rules that are local ("weekend pricing" depends on the lot's zone). Decide how partial units round (a 61-minute stay is 2 hours?) and write it in the requirements.</p>

<h3>8. Money</h3>
<p>Integer minor units (paise, cents) or a <code>Money</code> value object holding an integer plus currency. Floating-point rupees produce totals like 0.30000000000000004 and fail reconciliation. Round once, at a defined point.</p>

<h3>9. Identity and id generation</h3>
<p>Entities need ids; who creates them? Inject an <code>IdGenerator</code> (a counter in tests, <code>crypto.randomUUID()</code> in production). Key maps by id, not by object reference, so a reloaded copy of the same entity is still found.</p>

<h3>10. Leaking internal collections</h3>
<p>A getter returning <code>this.spots</code> lets callers push into it and bypass every invariant. Return <code>ReadonlyArray&lt;T&gt;</code> or a copy, and expose intent-revealing methods (<code>freeSpotCount(size)</code>) instead of raw collections.</p>

<h3>11. Persistence is requested mid-interview</h3>
<p>If you used repositories, it is a new implementation plus a table sketch: one table per entity, foreign keys for associations, a unique constraint for each invariant you previously enforced in memory. Point out which invariants move from code to the database (one open loan per copy) and why.</p>

<h3>12. The interviewer pushes a pattern you think is overkill</h3>
<p>State the trade-off once ("a Singleton makes testing harder; I would inject one shared instance instead"), then do it their way if they insist. Showing judgment and flexibility both count; winning the argument does not.</p>


<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1: coding before requirements</h3>
<p>The first class you write encodes assumptions you never checked. Ten minutes later the interviewer mentions "multiple entry gates" and the design has no place for concurrency. Always do Step 1, even briefly.</p>

<h3>Anti-pattern 2: the god class ("Manager", "System", "Handler")</h3>
<p>One class that stores data, applies rules, formats output and talks to the clock. Symptom: every requirement edits the same file. Fix: one responsibility per class; the facade only orchestrates.</p>

<h3>Anti-pattern 3: anaemic entities and a fat service</h3>
<p>Entities that are bags of public getters and setters while the service does <code>copy.status = 'BORROWED'</code>. Nothing guards the invariant, so any caller can corrupt it. Move the rule into the entity's method (<code>markBorrowed</code>). Pure data transfer objects at the API edge are fine; domain entities should own their rules.</p>

<h3>Anti-pattern 4: inheritance for code reuse</h3>
<p><code>class Ticket extends Vehicle</code> "because both have a licence plate". Inheritance must be is-a and substitutable; shared fields alone do not justify it. Compose or extract a value object (<code>LicensePlate</code>).</p>

<h3>Anti-pattern 5: the same switch in five places</h3>
<p><code>switch (vehicle.type)</code> in pricing, allocation, display and receipts. Adding a vehicle type edits all of them, and you will miss one. Put the varying behaviour behind one interface or one lookup table.</p>

<h3>Anti-pattern 6: pattern stuffing</h3>
<p>Announcing Singleton, Factory, Builder and Observer before reading the problem. Interviewers mark it as cargo-culting. Name a pattern only after naming the force that needs it.</p>

<h3>Anti-pattern 7: Singletons as a global variable</h3>
<p><code>ParkingLot.getInstance()</code> called from deep inside entities hides dependencies and makes two lots in one test impossible. Create one instance at the composition root and inject it. Details in <a href="#/topic/lld-patterns">Design Patterns for LLD</a>.</p>

<h3>Anti-pattern 8: stringly-typed state and errors</h3>
<p><code>status = 'free'</code> in one file and <code>'FREE'</code> in another; functions returning <code>'ok'</code> or <code>'limit reached'</code>. Use enums and a typed domain error with a code.</p>

<h3>Anti-pattern 9: hidden time and randomness</h3>
<p><code>Date.now()</code> and <code>Math.random()</code> inside domain logic make fines and allocation impossible to test deterministically. Inject a clock and an id generator.</p>

<h3>Anti-pattern 10: diagram and code drift apart</h3>
<p>You draw a <code>PricingStrategy</code> interface, then hard-code the price in the service. If the design changes while coding, say so and update the diagram.</p>

<h3>Anti-pattern 11: designing the database instead of the objects</h3>
<p>In LLD the database sits behind a repository; schema talk belongs in a two-minute persistence follow-up.</p>

<h3>Anti-pattern 12: "JavaScript is single-threaded, so no races"</h3>
<p>True only for code without <code>await</code>, inside one process. Real handlers await I/O and real services run several instances. This line, said confidently, is one of the clearest negative signals for a Node engineer.</p>

<h3>Anti-pattern 13: boolean flag parameters</h3>
<p><code>borrow(memberId, isbn, true, false)</code>. Nobody can read the call site. Use an options object, an enum, or two intention-revealing methods.</p>

<h3>Anti-pattern 14: no driver, no proof</h3>
<p>Machine-coding rounds that end with code that was never executed. Write a small <code>main</code> that runs the happy path and one failure; it often surfaces a bug before the interviewer does.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. How is low-level design different from high-level design?</div>
  <div class="qa-answer">
    <p>HLD decides the components of a system (services, databases, queues, caches) and how they scale and fail across machines. LLD zooms into one component and decides its classes, interfaces, relationships and code. HLD's "scale" is traffic and data volume; LLD's "scale" is change: how cheaply the model absorbs new requirements. They meet at the boundary: the HLD box "booking service" is what an LLD round designs, and an LLD design's in-memory locks become an HLD question once there are many instances.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Walk me through how you approach an LLD problem.</div>
  <div class="qa-answer">
    <p>Seven steps. Requirements: actors, core use cases, rules, variation hints, concurrency, out of scope. Entities and relationships: nouns to classes, filter out attributes and computed values, split type from instance, one responsibility each. Class diagram: boxes, multiplicities, interfaces at variation points. Interfaces: public signatures, enums, error contract. Core flows: sequence for the main use case and a state machine for anything with a lifecycle. Code: enums, entities, interfaces, simplest implementations, service, driver. Then extensibility and concurrency: show how follow-ups land as additions and where the critical section is. I check in with the interviewer at each boundary.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you decide which nouns become classes?</div>
  <div class="qa-answer">
    <p>A noun becomes a class if it has identity and state that changes, or behaviour of its own. Nouns that only describe another noun are attributes (title, ISBN). Nouns that are computed are policy outputs (fine, price). Actors are roles unless they carry permissions or state. Then I look for the type-versus-instance split: if a noun has catalogue data and per-item state (Book vs BookCopy, Movie vs Show vs Seat), it is two classes. Finally each class must be describable in one sentence without "and ... and".</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. When do you choose composition over inheritance?</div>
  <div class="qa-answer">
    <p>By default. Inheritance is for a true, shallow is-a where the child passes every expectation of the parent, or for a Template Method with a few overridable steps. Composition is for has-a, uses, or anything that varies on more than one axis or at runtime. The concrete trigger is the explosion: spot size times spot features as subclasses gives twelve classes, while composition gives one class with a size enum and a feature set. Composition also makes each behaviour testable in isolation, because I can inject a fake strategy.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Interface or abstract class in TypeScript?</div>
  <div class="qa-answer">
    <p>Interface when I only need a contract: it costs nothing at runtime and a class can implement several. Abstract class when implementations share real code or state, or when I need a runtime type check, because TypeScript interfaces are erased and <code>instanceof</code> only works on classes. Note that TypeScript is structurally typed: any object of the right shape satisfies an interface, even without <code>implements</code>, which is convenient for test fakes. In Java the same choice exists, but typing is nominal.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Composition vs aggregation: does the difference matter in code?</div>
  <div class="qa-answer">
    <p>It matters for lifecycle and ownership. Composition: the whole creates the part and the part has no life outside it (a Floor builds its Spots; deleting the floor deletes them). Aggregation: the part is created elsewhere and passed in, possibly shared (a pricing strategy injected into several lots). In code, composition usually shows up as construction inside the owner and no public setter; aggregation as a constructor parameter. In persistence it becomes cascade-delete versus a nullable foreign key.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. The interviewer says "now add X". How do you respond?</div>
  <div class="qa-answer">
    <p>Three beats. Which existing seam absorbs it (for example, the <code>FinePolicy</code> interface). The new class I would write. The single line of wiring that changes. If no seam fits, I say so plainly, introduce the seam with a small refactor, and then add the feature, because pretending a cross-cutting change is additive is worse than admitting it. I also restate any new requirement it implies, such as a new state in a lifecycle.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. "Make it thread-safe." What does that mean for a TypeScript / Node design?</div>
  <div class="qa-answer">
    <p>First identify the shared mutable state and the check-then-act sequence on it, for example "find a free copy, then mark it borrowed". In one Node process, synchronous code is atomic because JavaScript runs on one thread, but every <code>await</code> lets another request interleave, so if the critical section awaits I/O I serialise it with an async mutex, ideally keyed by the contended resource. Across processes or instances an in-memory lock is useless, so the guard moves into the shared store: a conditional update with a version column, a row lock, or a unique constraint that makes the invalid state unrepresentable. In Java I would use <code>synchronized</code> or a <code>ReentrantLock</code> per resource and concurrent collections for the indexes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you decide when to apply a design pattern?</div>
  <div class="qa-answer">
    <p>Force first, pattern second. If a rule varies by configuration, that is Strategy. If an object's behaviour depends on its lifecycle state, State. If several parties react to an event without the source knowing them, Observer. If construction has many optional parts, Builder. If none of those forces exist, I do not add the pattern. I name the pattern after the force so the interviewer hears the reasoning, and I keep the implementation minimal.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Where does validation and error handling live in your design?</div>
  <div class="qa-answer">
    <p>Shape validation at the boundary (service or controller). Invariants inside the entity that owns the data, enforced by its methods, so they cannot be bypassed. Cross-entity rules in a policy or the service. Errors are a single domain error type with a machine-readable code, which a REST layer maps to status codes (NOT_FOUND to 404, LOAN_LIMIT to 409 or 422). If the team prefers no exceptions, a discriminated-union <code>Result</code> works equally well; what matters is that failures are typed, not strings.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Your design works in memory. What changes when it is backed by a database and runs on several instances?</div>
  <div class="qa-answer">
    <p>The repositories get database implementations; the domain classes do not change. In-memory indexes become database indexes. Invariants that were protected by in-process locks move into the database: unique constraints, conditional updates with a version column, or <code>SELECT ... FOR UPDATE</code> inside a transaction. Any in-memory caches need an invalidation story. Counters such as "next loan number" become database sequences or UUIDs. I would say that this is where LLD hands over to HLD, and keep the answer to those deltas.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE scenario) On a discovery call, a customer's operations lead spends 30 minutes describing how they allocate shared equipment across sites. You have to have a working prototype API by tomorrow. How do you approach the model?</div>
  <div class="qa-answer">
    <p>I run the same framework, live. During the call I capture actors, the three workflows they repeat most, and every rule phrased as "it depends on" or "except when", because those are variation points. I play back a numbered requirement list before the call ends and get an explicit out-of-scope list. Afterwards I model entities with the type-versus-instance split (EquipmentModel vs EquipmentUnit), put the "it depends" rules behind policy interfaces with the simplest implementation, keep storage behind repositories so I can start in-memory and move to their database later, and write a driver that replays their own example scenarios. The next morning I demo against their examples and ask which rule I got wrong, which is cheaper to fix in a policy class than in a tangle of conditionals.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You write requirements, including non-functional and out-of-scope, before any class.</li>
    <li>You split type from instance without being prompted.</li>
    <li>Each class has one sentence of responsibility; the facade holds no business rules.</li>
    <li>Interfaces appear exactly at the variation points you identified, and nowhere else.</li>
    <li>Entities guard their own invariants through domain-named methods.</li>
    <li>Clock, ids and storage are injected; money is integer minor units.</li>
    <li>"Now add X" lands as a new class and one line of wiring.</li>
    <li>Your thread-safety answer covers in-process, across <code>await</code>, and across instances.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. The prompt is one line: "Design a library management system." How do you turn it into requirements in the first few minutes?</div>
  <div class="qa-answer">
    <p>I ask about actors, the three core use cases that must work end to end, rules and limits (and whether they depend on a type), variation hints ("will fines differ by branch later?"), concurrency ("can two kiosks borrow at once?"), rough scale, persistence, and what is out of scope. Then I write a numbered list we both agree on, for example: FR1 add books and copies, FR2 search, FR3 borrow with a 3-loan limit (PREMIUM 10), FR4 return with a daily fine capped at a maximum, FR5 holds as a stretch; NFR1 two members never hold the same copy, NFR2 limits and fines pluggable, NFR3 in-memory behind repositories, NFR4 injected clock for deterministic tests; out of scope: payment, auth, UI, multiple branches.</p>
    <p>If the interviewer just says "your call", I propose the scope myself, ask for a nod and move on, capped at five to eight minutes. Whatever they add ("fines may differ per branch") tells me where the variation point and the follow-up will be.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q14. In an ASCII class diagram, how do composition, aggregation, association and dependency arrows differ?</div>
  <div class="qa-answer">
    <p><strong>Composition</strong> <code>Floor ◆── Spot</code>: owns; the part is created by and dies with the whole (the floor constructs its spots). <strong>Aggregation</strong> <code>Lot ◇── Gate</code>: has; the part can exist independently or be shared, and is passed into the constructor. <strong>Association</strong> <code>Ticket ──► Spot</code>: knows about it, held as a field (<code>readonly spot: ParkingSpot</code>). <strong>Dependency</strong> <code>Service ┄┄► Clock</code>: uses it temporarily, as a parameter or local variable.</p>
    <p>Add inheritance (──▷) and realisation (┄┄▷, implements an interface), and put multiplicities at both ends: "Floor 1 ◆── * Spot" reads "a floor owns many spots; each spot belongs to exactly one floor".</p>
  </div>
</div>
` },

  ]
});
