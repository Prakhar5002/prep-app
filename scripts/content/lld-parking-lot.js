window.PREP_SITE.registerTopic({
  id: "lld-parking-lot",
  module: "lld",
  title: "Case: Parking Lot",
  estimatedReadTime: "30 min",
  tags: ["lld","parking-lot","case-study","strategy","observer","state","concurrency","typescript"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Model types as <strong>enums plus a compatibility table</strong>, keep a <strong>per-floor free-spot index</strong> owned by the floor, put pricing and allocation behind <strong>strategies</strong>, and make the one critical section (find a free spot, then take it) atomic.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>The most-asked LLD prompt:</strong> small enough to finish, rich enough to probe modelling, patterns and concurrency.</li>
    <li><strong>Requirements:</strong> multiple floors and concurrent gates; motorcycle, car, truck; small, medium, large; hourly pricing with a grace period; ticket at entry, pay at exit; live boards. Out of scope: reservations, passes, valet.</li>
    <li><strong>Entities:</strong> Vehicle, ParkingSpot, Floor (owns spots and index), Gate, Ticket (lifecycle), plus strategies, a ticket repository, observers and the <code>ParkingLotService</code> facade.</li>
    <li><strong>Compatibility table, not subclasses:</strong> each vehicle type lists allowed sizes in best-fit order (a car fits MEDIUM or LARGE); no <code>Car extends Vehicle</code> with an empty body; adding a type is one enum value and one row.</li>
    <li><strong>Free index:</strong> <code>Map&lt;SpotSize, Set&lt;spotId&gt;&gt;</code> per floor; allocation O(floors x sizes) with O(1) steps; free counts O(1).</li>
    <li><strong>Allocation strategy:</strong> best-fitting size first, then nearest floor, so large spots stay available for large vehicles.</li>
    <li><strong>Pricing strategy:</strong> per vehicle type (not spot size), partial hours round up, grace minutes free; caps and surcharges are decorators.</li>
    <li><strong>Observer + facade:</strong> availability changes are pushed to display boards; <code>ParkingLotService</code> exposes <code>enter</code> and <code>exit</code> and holds no business rules.</li>
    <li><strong>Ticket lifecycle:</strong> ACTIVE → PAYMENT_PENDING → PAID, with failPayment back to ACTIVE; release the spot only after payment succeeds.</li>
    <li><strong>In-process concurrency:</strong> <code>enter</code> is synchronous (atomic in Node); <code>exit</code> claims the ticket synchronously before awaiting payment, so two exit gates cannot charge twice.</li>
    <li><strong>Multi-instance:</strong> <code>FOR UPDATE SKIP LOCKED</code> for allocation, conditional update for the exit claim, partial unique indexes for one unpaid ticket per spot and per plate.</li>
    <li><strong>EV charging:</strong> <code>hasCharger</code> on the spot, index keyed by size and charger, <code>EvAwareAllocation</code>, <code>ChargingSurcharge</code> decorator.</li>
    <li><strong>Hard follow-up:</strong> buses needing k contiguous spots change the model (spot positions, ticket holds a list of spots, all-or-nothing allocation).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Releasing the spot (or touching the index) outside the class that owns it, especially before payment succeeds.</strong> The model then says a spot is free while a car is still in it, and the next entry double-allocates. Fix: the floor alone changes occupancy and index together, and the exit flow is claim ticket, pay, then vacate, with failure restoring the ticket to ACTIVE.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Vehicle and spot types differ only in data, so they are enums with a compatibility table; I would only subclass if behaviour differed."</div>
  <div class="revision-say">"Each floor owns its spots and a free index per size, so allocation is constant-time per floor and the index can never drift from occupancy."</div>
  <div class="revision-say">"The only race is find-then-take. Entry is synchronous so it is atomic in-process, exit claims the ticket before awaiting payment, and across instances I use SELECT FOR UPDATE SKIP LOCKED plus partial unique indexes."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Why interviewers keep asking it</h3>
<ul>
  <li><strong>Everyone knows the domain.</strong> No time is lost explaining what a ticket is, so the whole round goes on design.</li>
  <li><strong>It has a type-versus-instance trap.</strong> Spot <em>sizes</em> vs spots, vehicle <em>types</em> vs vehicles. Candidates who build a class per type show they reach for inheritance by default.</li>
  <li><strong>It has obvious variation points.</strong> Pricing (hourly, daily cap, weekend, event day), allocation (nearest, spread load, reserved for permit holders), payment method. Each is a natural Strategy.</li>
  <li><strong>It has a real concurrency problem.</strong> Several entry gates allocate from the same pool; several exit gates can see the same ticket. "Make it thread-safe" is almost guaranteed.</li>
  <li><strong>It scales into follow-ups.</strong> EV charging, monthly passes, valet, reservations, buses that need several spots, licence-plate recognition instead of paper tickets.</li>
</ul>

<h3>What the round is really testing</h3>
<table>
  <thead><tr><th>Decision point</th><th>Weak answer</th><th>Strong answer</th></tr></thead>
  <tbody>
    <tr><td>Vehicle and spot types</td><td><code>Car</code>, <code>Bike</code>, <code>Truck</code> subclasses; <code>CompactSpot</code>, <code>LargeSpot</code> subclasses</td><td>Enums plus a compatibility table; subclasses only if behaviour differs</td></tr>
    <tr><td>Finding a spot</td><td>Scan every spot on every floor</td><td>Per-floor, per-size free index; O(floors x sizes) with O(1) inner steps</td></tr>
    <tr><td>Pricing</td><td><code>ticket.calculateFee()</code> with hard-coded rates</td><td><code>PricingStrategy</code> injected into the service; price by vehicle type, not by the spot the lot chose</td></tr>
    <tr><td>Exit</td><td>Release the spot, then try payment</td><td>Claim the ticket, pay, then release; failure leaves everything as it was</td></tr>
    <tr><td>Display boards</td><td>Boards poll all spots every second</td><td>Observer: lot pushes availability changes</td></tr>
    <tr><td>Concurrency</td><td>"JS is single-threaded"</td><td>Identifies the find-then-take critical section; in-process vs multi-instance answers</td></tr>
  </tbody>
</table>

<h3>Why it is relevant beyond the interview</h3>
<p>The shape (a pool of typed resources, allocation rules, a time-based charge, live availability displays, concurrent requests at several entry points) is the same as meeting-room booking tablets, co-working desk booking, EV charger networks, warehouse slotting and cloud instance pools. For a Forward Deployed Engineer it is also an integration problem: real lots have ANPR cameras, boom-barrier controllers and occupancy sensors from different vendors, each of which ends up behind an adapter, and the hardest production bugs are about the model drifting from physical reality (see Q12).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Physical lot to object model</h3>
<div class="diagram">
<pre>
  PHYSICAL                                 MODEL
  ─────────────────────────────            ─────────────────────────────────────────────
  Building                          ──►    ParkingLotService (facade, owns floors)
   ├─ Floor 0                       ──►    Floor  { spots, free index by size }
   │   ├─ [S][S][M][M][L]           ──►    ParkingSpot { id, size, occupant }
   │   └─ LED board "M: 1 free"     ──►    DisplayBoard (observer)
   ├─ Floor 1 ...
   ├─ Entry gate E1 (camera, printer)──►   Gate { id, ENTRY }   calls service.enter()
   └─ Exit gate X1 (card reader)    ──►    Gate { id, EXIT }    calls service.exit()
  Paper ticket / plate read         ──►    Ticket { id, vehicle, spot, entryAt, status }
  Rate card on the wall             ──►    PricingStrategy
  "Park closest to the lift"        ──►    SpotAllocationStrategy
</pre>
</div>

<h3>The free-spot index</h3>
<p>The key data-structure decision. Each floor keeps, per spot size, a set of free spot ids. Allocation takes any id from the right set (O(1)); vacating puts it back (O(1)). The floor is the only class that touches both a spot's occupant and the index, so they cannot disagree.</p>
<div class="diagram">
<pre>
  Floor 0
    spots: { F0-S1, F0-S2, F0-M1, F0-M2, F0-L1 }
    free:  SMALL  ──► { F0-S1, F0-S2 }
           MEDIUM ──► { F0-M2 }            (F0-M1 occupied by KA01AB1234)
           LARGE  ──► { F0-L1 }

  allocate(CAR):  for size in [MEDIUM, LARGE]:     (best fit first)
                    for floor in [0, 1, ...]:      (nearest first)
                      take any id from floor.free[size]   ── O(1)
</pre>
</div>

<h3>Compatibility is a table, not a hierarchy</h3>
<table>
  <thead><tr><th>VehicleType</th><th>Allowed spot sizes (preference order)</th><th>Hourly rate (paise)</th></tr></thead>
  <tbody>
    <tr><td>MOTORCYCLE</td><td>SMALL, MEDIUM, LARGE</td><td>2,000</td></tr>
    <tr><td>CAR</td><td>MEDIUM, LARGE</td><td>4,000</td></tr>
    <tr><td>TRUCK</td><td>LARGE</td><td>10,000</td></tr>
  </tbody>
</table>
<p>Adding a vehicle type is one enum value and one row. Note the rate is per <em>vehicle type</em>: if the lot puts a motorcycle in a large spot, the rider should not pay the large-spot price for the lot's allocation choice.</p>

<h3>Two small lifecycles</h3>
<div class="diagram">
<pre>
  ParkingSpot:     FREE ──assign(v)──► OCCUPIED ──release()──► FREE
                   (out-of-service is a follow-up: removed from the free index)

  Ticket:          enter()            beginPayment()                  completePayment()
          (none) ─────────► ACTIVE ─────────────────► PAYMENT_PENDING ──────────────────► PAID
                              ▲                              │
                              └──────── failPayment() ───────┘
</pre>
</div>
<p>PAYMENT_PENDING exists for concurrency: the exit flow moves the ticket into it <em>synchronously</em> before awaiting the payment provider, so a second exit request for the same ticket fails fast instead of charging twice.</p>

<h3>Stable vs varying</h3>
<table>
  <thead><tr><th>Stable (concrete)</th><th>Varying (interface)</th><th>Likely follow-up</th></tr></thead>
  <tbody>
    <tr><td>Floor, ParkingSpot, Ticket, Vehicle, Gate</td><td>SpotAllocationStrategy</td><td>"Reserve floor 0 for permit holders", "spread load across floors", "EV first"</td></tr>
    <tr><td>Compatibility table (data)</td><td>PricingStrategy</td><td>Daily cap, weekend rate, event-day flat fee, EV charging surcharge</td></tr>
    <tr><td></td><td>PaymentProcessor (per method)</td><td>Add UPI or FASTag</td></tr>
    <tr><td></td><td>ParkingObserver</td><td>Mobile app push "spot freed", analytics</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>The seven framework steps applied to the parking lot. Full runnable code is in Examples.</p>

<h3>Step 1: Requirements</h3>
<p>Questions worth asking, with the answers this solution assumes:</p>
<ul>
  <li>Floors and gates? <em>Several floors; several entry and exit gates operating concurrently.</em></li>
  <li>Vehicle and spot types? <em>Motorcycle, car, truck; small, medium, large spots. Smaller vehicles may use bigger spots.</em></li>
  <li>How is a vehicle identified? <em>Plate captured at entry; a ticket id is printed. Lost-ticket handling is a stretch goal.</em></li>
  <li>Pricing? <em>Hourly by vehicle type, partial hours round up, first 10 minutes free. Will change, so pluggable.</em></li>
  <li>Payment? <em>At the exit gate; cash, card or UPI.</em></li>
  <li>Displays? <em>Each floor and the entrance show free counts per size, updated live.</em></li>
  <li>Reservations, passes, valet? <em>Out of scope unless time allows.</em></li>
</ul>
<pre><code class="language-text">Functional
  FR1  Admin configures floors, spots (with size) and gates.
  FR2  At an entry gate, a vehicle gets the best available compatible spot and a ticket.
       Reject if no compatible spot (LOT_FULL) or the plate is already inside.
  FR3  At an exit gate, the ticket is priced, paid, and the spot is freed.
       Payment failure leaves the ticket active and the spot occupied.
  FR4  Display boards show free spots per floor and size, updated on every change.

Non-functional
  NFR1 Concurrent gates must never assign one spot twice or charge one ticket twice.
  NFR2 Allocation and pricing rules change: keep them pluggable.
  NFR3 Spot lookup must not scan the whole lot (thousands of spots).
  NFR4 Deterministic tests: injected clock and id generator; money in integer paise.

Out of scope: reservations, monthly passes, valet, hardware drivers (behind adapters).</code></pre>

<h3>Step 2: Entities &amp; relationships</h3>
<table>
  <thead><tr><th>Class</th><th>Kind</th><th>Responsibility</th></tr></thead>
  <tbody>
    <tr><td><code>Vehicle</code></td><td>Value-like entity</td><td>Plate and type; nothing else</td></tr>
    <tr><td><code>ParkingSpot</code></td><td>Entity</td><td>Holds at most one compatible vehicle; refuses otherwise</td></tr>
    <tr><td><code>Floor</code></td><td>Entity (composition root of its spots)</td><td>Owns its spots and the free index; occupy and vacate keep both consistent</td></tr>
    <tr><td><code>Gate</code></td><td>Entity</td><td>Id and direction (ENTRY or EXIT)</td></tr>
    <tr><td><code>Ticket</code></td><td>Entity with lifecycle</td><td>Records vehicle, spot, entry time; guards ACTIVE → PAYMENT_PENDING → PAID</td></tr>
    <tr><td><code>SpotAllocationStrategy</code></td><td>Policy</td><td>Chooses and occupies a spot for a vehicle</td></tr>
    <tr><td><code>PricingStrategy</code></td><td>Policy</td><td>Prices a ticket at an exit time</td></tr>
    <tr><td><code>PaymentProcessor</code></td><td>Policy / adapter</td><td>Charges an amount by one payment method</td></tr>
    <tr><td><code>TicketRepository</code></td><td>Repository</td><td>Stores tickets; finds the active ticket for a plate</td></tr>
    <tr><td><code>ParkingObserver</code> / <code>DisplayBoard</code></td><td>Observer</td><td>Reacts to availability changes</td></tr>
    <tr><td><code>ParkingLotService</code></td><td>Facade</td><td>Runs enter and exit; no business rules of its own</td></tr>
  </tbody>
</table>
<p>Relationships: ParkingLotService ◆── 1..* Floor ◆── 1..* ParkingSpot (composition: spots are created by their floor and do not outlive it). Ticket ──► 1 ParkingSpot and ──► 1 Vehicle (association; a spot has many tickets over time, at most one unpaid). The service aggregates (◇) the strategies, repository, observers, clock and id generator, all injected.</p>

<h3>Step 3: Class diagram</h3>
<div class="diagram">
<pre>
 ┌──────────────────────────────────────┐ ◇      * ┌─────────────────────────────┐
 │ ParkingLotService           (facade) │─────────►│ «interface» ParkingObserver │
 ├──────────────────────────────────────┤          │ + onAvailabilityChanged()   │
 │ + enter(vehicle, gateId): Ticket     │          └──────────────▲──────────────┘
 │ + exit(ticketId, gateId, method)     │                         ┊
 │ + subscribe(observer)                │                ┌────────┴───────┐
 └──┬──────────┬──────────────┬─────────┘                │ DisplayBoard   │
    │◆ 1..*    │◇             │◇                         └────────────────┘
    ▼          ▼              ▼
 ┌─────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
 │ Floor   │ │ «interface»              │ │ «interface»              │
 ├─────────┤ │ SpotAllocationStrategy   │ │ PricingStrategy          │
 │ number  │ │ + allocate(floors, v)    │ │ + price(ticket, exitAt)  │
 │ free idx│ └────────────▲─────────────┘ └────────────▲─────────────┘
 ├─────────┤              ┊                            ┊
 │ occupy  │ ┌────────────┴─────────────┐ ┌────────────┴─────────────┐
 │ vacate  │ │ NearestFloorBestFit      │ │ HourlyPricing            │
 └────┬────┘ └──────────────────────────┘ └──────────────────────────┘
      │◆ 1..*
      ▼
 ┌──────────────────┐ 1    0..1 ┌──────────────────┐ *      1 ┌──────────────────┐
 │ ParkingSpot      │◄──────────│ Ticket           │─────────►│ Vehicle          │
 ├──────────────────┤  (active) ├──────────────────┤          ├──────────────────┤
 │ id, floor, size  │           │ id, entryAt      │          │ plate            │
 │ - occupant       │           │ - status, amount │          │ type             │
 ├──────────────────┤           ├──────────────────┤          └──────────────────┘
 │ + assign(v)      │           │ + beginPayment() │
 │ + release()      │           │ + completePayment│
 └──────────────────┘           │ + failPayment()  │
                                └──────────────────┘
 Also injected into the service (not drawn): Gate list, PaymentProcessor per
 PaymentMethod, TicketRepository, Clock, IdGenerator.
</pre>
</div>

<h3>Step 4: Interfaces / APIs</h3>
<pre><code class="language-ts">// Public API (what gate controllers, or a REST layer, call)
interface ParkingApi {
  enter(vehicle: Vehicle, gateId: string): Ticket;                                  // sync: atomic in-process
  exit(ticketId: string, gateId: string, method: PaymentMethod): Promise&lt;Receipt&gt;; // awaits payment
  subscribe(observer: ParkingObserver): () =&gt; void;                                // returns unsubscribe
}

// Variation points
interface SpotAllocationStrategy {
  allocate(floors: ReadonlyArray&lt;Floor&gt;, vehicle: Vehicle): ParkingSpot | null;
}
interface PricingStrategy {
  price(ticket: Ticket, exitAt: Date): number;            // integer paise
}
interface PaymentProcessor {
  pay(amountPaise: number, reference: string): Promise&lt;boolean&gt;;
}
interface ParkingObserver {
  onAvailabilityChanged(floor: number, size: SpotSize, freeCount: number): void;
}

// Error contract
type ParkingErrorCode =
  | 'LOT_FULL' | 'ALREADY_PARKED' | 'TICKET_NOT_FOUND' | 'WRONG_GATE'
  | 'INVALID_STATE' | 'PAYMENT_FAILED' | 'UNSUPPORTED_PAYMENT';</code></pre>
<p><code>enter</code> is deliberately synchronous: allocation is pure in-memory work, and a synchronous method cannot be interleaved in Node, which makes "find a free spot, then take it" atomic in-process for free. <code>exit</code> is async because it talks to a payment provider.</p>

<h3>Step 5: Core flows</h3>
<p><strong>Entry:</strong></p>
<div class="diagram">
<pre>
 EntryGate      ParkingLotService            TicketRepo     Allocation     Floor / Spot
    │ enter(car,E1)  │                             │              │              │
    │───────────────►│ 1. E1 is an ENTRY gate?     │              │              │
    │                │ 2. plate already inside?    │              │              │
    │                │────────────────────────────►│              │              │
    │                │ 3. allocate(floors, car)                   │              │
    │                │───────────────────────────────────────────►│ occupy(M,car)│
    │                │                                            │─────────────►│
    │                │◄────────────────────────────── spot F0-M1 ─│              │
    │                │ 4. new Ticket(T-1, car, F0-M1, now); save  │              │
    │                │ 5. notify observers (floor 0, MEDIUM, free count)         │
    │◄── Ticket T-1 ─│ (gate prints ticket, opens barrier)                       │
</pre>
</div>
<p><strong>Exit:</strong></p>
<div class="diagram">
<pre>
 ExitGate        ParkingLotService                 PricingStrategy   PaymentProcessor
    │ exit(T-1,X1,UPI) │                                  │                 │
    │─────────────────►│ 1. load ticket; X1 is EXIT?      │                 │
    │                  │ 2. price(ticket, now) ──────────►│                 │
    │                  │◄──────────────── 12000 ──────────│                 │
    │                  │ 3. ticket.beginPayment()   sync claim, BEFORE any await
    │                  │ 4. await pay(12000, T-1) ─────────────────────────►│
    │                  │◄─────────────────────────────────────── ok ────────│
    │                  │ 5. completePayment; floor.vacate(spot); notify     │
    │◄─── Receipt ─────│    on failure: failPayment(); barrier stays closed │
</pre>
</div>

<h3>Step 6: Code (decisions to narrate)</h3>
<ul>
  <li><strong>Write order:</strong> enums and the compatibility table → <code>Vehicle</code>, <code>ParkingSpot</code>, <code>Floor</code>, <code>Ticket</code> → strategy interfaces and one implementation each → repository → <code>ParkingLotService</code> → demo driver.</li>
  <li><strong>Invariant owners:</strong> the spot refuses a second or incompatible vehicle; the floor keeps index and occupancy consistent; the ticket refuses illegal transitions; the service only sequences.</li>
  <li><strong>Construction:</strong> the service takes a single <code>deps</code> object, which keeps the wiring readable and makes each dependency explicit for tests.</li>
</ul>
<table>
  <thead><tr><th>Operation</th><th>Time</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td><code>enter</code></td><td>O(F x S)</td><td>F floors, S compatible sizes (at most 3), O(1) set operations inside</td></tr>
    <tr><td><code>exit</code></td><td>O(1) plus payment latency</td><td>Ticket lookup by id in a map; vacate is O(1)</td></tr>
    <tr><td>Free count for a board</td><td>O(1)</td><td>Size of a set</td></tr>
    <tr><td>Memory</td><td>O(spots + active tickets)</td><td>Closed tickets would move to cold storage in production</td></tr>
  </tbody>
</table>

<h3>Step 7: Extensibility &amp; concurrency</h3>
<table>
  <thead><tr><th>Follow-up</th><th>Where it lands</th><th>Edits to existing classes</th></tr></thead>
  <tbody>
    <tr><td>Weekend or event-day pricing</td><td>New <code>PricingStrategy</code></td><td>None</td></tr>
    <tr><td>Daily cap</td><td>Decorator around any pricing strategy</td><td>None</td></tr>
    <tr><td>Reserve floor 0 for permit holders</td><td>New allocation strategy that filters floors</td><td>Vehicle gains a permit flag</td></tr>
    <tr><td>EV charging (Example 2)</td><td>Spot features, EV-first allocation, charging-surcharge decorator</td><td>Spot gets <code>features</code>; Floor index keyed by size and charger</td></tr>
    <tr><td>Mobile app "spot freed" push</td><td>New <code>ParkingObserver</code></td><td>None</td></tr>
    <tr><td>Thread safety across instances (Example 3)</td><td>Database-backed repository and allocation</td><td>Floor index moves into the database</td></tr>
  </tbody>
</table>
<p><strong>Concurrency, in three layers</strong> (the general argument is in <a href="#/topic/lld-framework">LLD Interview Framework</a>):</p>
<ol>
  <li><strong>Entry, in one process:</strong> <code>enter</code> has no <code>await</code>, so allocation plus ticket creation is atomic. If allocation ever needs I/O (asking an occupancy sensor), wrap it in a per-lot async mutex.</li>
  <li><strong>Exit, in one process:</strong> the ticket moves to PAYMENT_PENDING synchronously <em>before</em> awaiting the payment, so a duplicate exit request sees the wrong state and fails. Release the spot only after payment succeeds.</li>
  <li><strong>Many instances:</strong> in-memory state and locks are per process, so spot allocation moves into the database with <code>SELECT ... FOR UPDATE SKIP LOCKED</code>, and the two invariants (one unpaid ticket per spot, one per plate) become partial unique indexes.</li>
</ol>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: the complete solution</h3>
<p>About 230 lines; this is what a 90-minute machine-coding round expects, and the core of it (enums, spot, floor, ticket, one strategy each, the facade) is what a 45-minute round expects.</p>
<pre><code class="language-ts">// ---- enums, value types, errors ----
enum VehicleType { MOTORCYCLE = 'MOTORCYCLE', CAR = 'CAR', TRUCK = 'TRUCK' }
enum SpotSize { SMALL = 'SMALL', MEDIUM = 'MEDIUM', LARGE = 'LARGE' }
enum GateType { ENTRY = 'ENTRY', EXIT = 'EXIT' }
enum TicketStatus { ACTIVE = 'ACTIVE', PAYMENT_PENDING = 'PAYMENT_PENDING', PAID = 'PAID' }
enum PaymentMethod { CASH = 'CASH', CARD = 'CARD', UPI = 'UPI' }

// Which spot sizes each vehicle may use, best fit first
const COMPATIBLE: Record&lt;VehicleType, ReadonlyArray&lt;SpotSize&gt;&gt; = {
  [VehicleType.MOTORCYCLE]: [SpotSize.SMALL, SpotSize.MEDIUM, SpotSize.LARGE],
  [VehicleType.CAR]: [SpotSize.MEDIUM, SpotSize.LARGE],
  [VehicleType.TRUCK]: [SpotSize.LARGE],
};

interface Clock { now(): Date }
interface IdGenerator { next(prefix: string): string }

type ParkingErrorCode =
  | 'LOT_FULL' | 'ALREADY_PARKED' | 'TICKET_NOT_FOUND' | 'WRONG_GATE'
  | 'INVALID_STATE' | 'PAYMENT_FAILED' | 'UNSUPPORTED_PAYMENT';

class ParkingError extends Error {
  constructor(readonly code: ParkingErrorCode, message: string) { super(message); }
}

interface Receipt {
  ticketId: string; plate: string; entryAt: Date; exitAt: Date;
  amountPaise: number; method: PaymentMethod;
}

// ---- entities ----
class Vehicle {
  constructor(readonly plate: string, readonly type: VehicleType) {}
}

class Gate {
  constructor(readonly id: string, readonly type: GateType) {}
}

class ParkingSpot {
  private occupant: Vehicle | null = null;
  constructor(readonly id: string, readonly floor: number, readonly size: SpotSize) {}

  get isFree(): boolean { return this.occupant === null; }
  get vehicle(): Vehicle | null { return this.occupant; }

  assign(v: Vehicle): void {
    if (!this.isFree) throw new ParkingError('INVALID_STATE', 'Spot ' + this.id + ' is occupied');
    if (!COMPATIBLE[v.type].includes(this.size)) {
      throw new ParkingError('INVALID_STATE', v.type + ' does not fit a ' + this.size + ' spot');
    }
    this.occupant = v;
  }

  release(): void { this.occupant = null; }
}

class Floor {
  private readonly spots = new Map&lt;string, ParkingSpot&gt;();
  private readonly free = new Map&lt;SpotSize, Set&lt;string&gt;&gt;();   // size -&gt; free spot ids

  constructor(readonly number: number, counts: Partial&lt;Record&lt;SpotSize, number&gt;&gt;) {
    for (const size of Object.values(SpotSize)) {
      const ids = new Set&lt;string&gt;();
      for (let i = 1; i &lt;= (counts[size] ?? 0); i++) {
        const spot = new ParkingSpot('F' + number + '-' + size[0] + i, number, size);  // e.g. F0-M1
        this.spots.set(spot.id, spot);
        ids.add(spot.id);
      }
      this.free.set(size, ids);
    }
  }

  freeCount(size: SpotSize): number { return this.free.get(size)!.size; }

  // Takes a free spot of this size for v, keeping occupancy and index consistent. O(1).
  occupy(size: SpotSize, v: Vehicle): ParkingSpot | null {
    const ids = this.free.get(size)!;
    const first = ids.values().next();
    if (first.done) return null;
    const spot = this.spots.get(first.value)!;
    spot.assign(v);                // throws before the index is touched
    ids.delete(spot.id);
    return spot;
  }

  vacate(spot: ParkingSpot): void {
    spot.release();
    this.free.get(spot.size)!.add(spot.id);
  }
}

class Ticket {
  private statusValue = TicketStatus.ACTIVE;
  private amountValue: number | null = null;
  private exitAtValue: Date | null = null;

  constructor(
    readonly id: string,
    readonly vehicle: Vehicle,
    readonly spot: ParkingSpot,
    readonly entryAt: Date,
  ) {}

  get status(): TicketStatus { return this.statusValue; }
  get amountPaise(): number | null { return this.amountValue; }
  get exitAt(): Date | null { return this.exitAtValue; }

  beginPayment(): void { this.transition(TicketStatus.ACTIVE, TicketStatus.PAYMENT_PENDING); }
  failPayment(): void { this.transition(TicketStatus.PAYMENT_PENDING, TicketStatus.ACTIVE); }
  completePayment(amountPaise: number, exitAt: Date): void {
    this.transition(TicketStatus.PAYMENT_PENDING, TicketStatus.PAID);
    this.amountValue = amountPaise;
    this.exitAtValue = exitAt;
  }

  private transition(from: TicketStatus, to: TicketStatus): void {
    if (this.statusValue !== from) {
      throw new ParkingError('INVALID_STATE', 'Ticket ' + this.id + ' is ' + this.statusValue + ', expected ' + from);
    }
    this.statusValue = to;
  }
}

// ---- policies ----
interface SpotAllocationStrategy {
  allocate(floors: ReadonlyArray&lt;Floor&gt;, vehicle: Vehicle): ParkingSpot | null;
}

// Best-fitting size first (keeps large spots for large vehicles), then nearest floor.
class NearestFloorBestFit implements SpotAllocationStrategy {
  allocate(floors: ReadonlyArray&lt;Floor&gt;, vehicle: Vehicle): ParkingSpot | null {
    for (const size of COMPATIBLE[vehicle.type]) {
      for (const floor of floors) {
        const spot = floor.occupy(size, vehicle);
        if (spot) return spot;
      }
    }
    return null;
  }
}

interface PricingStrategy {
  price(ticket: Ticket, exitAt: Date): number; // paise
}

class HourlyPricing implements PricingStrategy {
  constructor(
    private readonly ratePerHour: Record&lt;VehicleType, number&gt;,
    private readonly graceMinutes = 10,
  ) {}

  price(ticket: Ticket, exitAt: Date): number {
    const minutes = Math.ceil((exitAt.getTime() - ticket.entryAt.getTime()) / 60_000);
    if (minutes &lt;= this.graceMinutes) return 0;
    return Math.ceil(minutes / 60) * this.ratePerHour[ticket.vehicle.type];  // by vehicle, not spot
  }
}

interface PaymentProcessor {
  pay(amountPaise: number, reference: string): Promise&lt;boolean&gt;;
}

interface ParkingObserver {
  onAvailabilityChanged(floor: number, size: SpotSize, freeCount: number): void;
}

class DisplayBoard implements ParkingObserver {
  private readonly counts = new Map&lt;string, number&gt;();
  constructor(readonly name: string) {}
  onAvailabilityChanged(floor: number, size: SpotSize, freeCount: number): void {
    this.counts.set('F' + floor + ' ' + size, freeCount);
  }
  render(): string {
    return this.name + ': ' + [...this.counts].map(([k, n]) =&gt; k + '=' + n).join(', ');
  }
}

// ---- repository ----
interface TicketRepository {
  save(t: Ticket): void;
  get(id: string): Ticket | undefined;
  findUnpaidByPlate(plate: string): Ticket | undefined;
}

class InMemoryTicketRepository implements TicketRepository {
  private readonly byId = new Map&lt;string, Ticket&gt;();
  save(t: Ticket): void { this.byId.set(t.id, t); }
  get(id: string): Ticket | undefined { return this.byId.get(id); }
  findUnpaidByPlate(plate: string): Ticket | undefined {
    // O(n) is fine in memory; a DB uses an index (see Example 3)
    for (const t of this.byId.values()) {
      if (t.vehicle.plate === plate &amp;&amp; t.status !== TicketStatus.PAID) return t;
    }
    return undefined;
  }
}

// ---- facade ----
interface ParkingDeps {
  floors: Floor[];
  gates: Gate[];
  allocation: SpotAllocationStrategy;
  pricing: PricingStrategy;
  payments: ReadonlyMap&lt;PaymentMethod, PaymentProcessor&gt;;
  tickets: TicketRepository;
  clock: Clock;
  ids: IdGenerator;
}

class ParkingLotService {
  private readonly observers = new Set&lt;ParkingObserver&gt;();
  private readonly floorsByNumber: Map&lt;number, Floor&gt;;
  private readonly gates: Map&lt;string, Gate&gt;;

  constructor(private readonly deps: ParkingDeps) {
    this.floorsByNumber = new Map(deps.floors.map(f =&gt; [f.number, f] as const));
    this.gates = new Map(deps.gates.map(g =&gt; [g.id, g] as const));
  }

  subscribe(observer: ParkingObserver): () =&gt; void {
    this.observers.add(observer);
    for (const f of this.deps.floors) {
      for (const size of Object.values(SpotSize)) observer.onAvailabilityChanged(f.number, size, f.freeCount(size));
    }
    return () =&gt; { this.observers.delete(observer); };
  }

  // Synchronous on purpose: no await means no interleaving in-process.
  enter(vehicle: Vehicle, gateId: string): Ticket {
    this.requireGate(gateId, GateType.ENTRY);
    if (this.deps.tickets.findUnpaidByPlate(vehicle.plate)) {
      throw new ParkingError('ALREADY_PARKED', vehicle.plate + ' is already inside');
    }
    const spot = this.deps.allocation.allocate(this.deps.floors, vehicle);
    if (!spot) throw new ParkingError('LOT_FULL', 'No free spot for ' + vehicle.type);

    const ticket = new Ticket(this.deps.ids.next('T'), vehicle, spot, this.deps.clock.now());
    this.deps.tickets.save(ticket);
    this.notify(spot);
    return ticket;
  }

  async exit(ticketId: string, gateId: string, method: PaymentMethod): Promise&lt;Receipt&gt; {
    this.requireGate(gateId, GateType.EXIT);
    const ticket = this.deps.tickets.get(ticketId);
    if (!ticket) throw new ParkingError('TICKET_NOT_FOUND', 'Unknown ticket ' + ticketId);
    const processor = this.deps.payments.get(method);
    if (!processor) throw new ParkingError('UNSUPPORTED_PAYMENT', method + ' is not accepted here');

    const exitAt = this.deps.clock.now();
    const amount = this.deps.pricing.price(ticket, exitAt);

    ticket.beginPayment();                         // synchronous claim before the first await
    let paid = false;
    try {
      paid = amount === 0 || await processor.pay(amount, ticket.id);
    } catch {
      paid = false;
    }
    if (!paid) {
      ticket.failPayment();                        // ticket ACTIVE again, spot still occupied
      throw new ParkingError('PAYMENT_FAILED', 'Payment failed for ' + ticket.id);
    }

    ticket.completePayment(amount, exitAt);
    this.floorsByNumber.get(ticket.spot.floor)!.vacate(ticket.spot);
    this.notify(ticket.spot);
    return { ticketId: ticket.id, plate: ticket.vehicle.plate, entryAt: ticket.entryAt, exitAt, amountPaise: amount, method };
  }

  private requireGate(gateId: string, type: GateType): void {
    const gate = this.gates.get(gateId);
    if (!gate || gate.type !== type) throw new ParkingError('WRONG_GATE', gateId + ' is not an ' + type + ' gate');
  }

  private notify(spot: ParkingSpot): void {
    const free = this.floorsByNumber.get(spot.floor)!.freeCount(spot.size);
    for (const o of this.observers) {
      try { o.onAvailabilityChanged(spot.floor, spot.size, free); }
      catch (err) { console.error('observer failed', err); }   // a broken board must not block a gate
    }
  }
}

// ---- demo driver ----
class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date { return this.current; }
  advanceMinutes(m: number): void { this.current = new Date(this.current.getTime() + m * 60_000); }
}
class SequentialIds implements IdGenerator {
  private n = 0;
  next(prefix: string): string { return prefix + '-' + (++this.n); }
}

async function main(): Promise&lt;void&gt; {
  const clock = new FixedClock(new Date('2026-03-01T09:00:00Z'));
  const upiOk: PaymentProcessor = { pay: async () =&gt; true };
  const cardDeclined: PaymentProcessor = { pay: async () =&gt; false };

  const lot = new ParkingLotService({
    floors: [
      new Floor(0, { [SpotSize.SMALL]: 2, [SpotSize.MEDIUM]: 2, [SpotSize.LARGE]: 1 }),
      new Floor(1, { [SpotSize.MEDIUM]: 3, [SpotSize.LARGE]: 1 }),
    ],
    gates: [new Gate('E1', GateType.ENTRY), new Gate('X1', GateType.EXIT)],
    allocation: new NearestFloorBestFit(),
    pricing: new HourlyPricing({
      [VehicleType.MOTORCYCLE]: 2000, [VehicleType.CAR]: 4000, [VehicleType.TRUCK]: 10000,
    }),
    payments: new Map([[PaymentMethod.UPI, upiOk], [PaymentMethod.CARD, cardDeclined]]),
    tickets: new InMemoryTicketRepository(),
    clock,
    ids: new SequentialIds(),
  });

  const lobby = new DisplayBoard('Lobby');
  lot.subscribe(lobby);

  const t1 = lot.enter(new Vehicle('KA01AB1234', VehicleType.CAR), 'E1');
  console.log(t1.id, t1.spot.id);                                    // T-1 F0-M1
  lot.enter(new Vehicle('KA02CD5678', VehicleType.TRUCK), 'E1');     // F0-L1
  lot.enter(new Vehicle('KA03EF9012', VehicleType.TRUCK), 'E1');     // F1-L1
  try { lot.enter(new Vehicle('KA04GH3456', VehicleType.TRUCK), 'E1'); }
  catch (e) { console.log((e as ParkingError).code); }               // LOT_FULL

  clock.advanceMinutes(135);                                         // 2h15m: 3 billable hours
  try { await lot.exit(t1.id, 'X1', PaymentMethod.CARD); }
  catch (e) { console.log((e as ParkingError).code, t1.status); }    // PAYMENT_FAILED ACTIVE

  const receipt = await lot.exit(t1.id, 'X1', PaymentMethod.UPI);
  console.log(receipt.amountPaise);                                  // 12000 (Rs 120)
  console.log(lobby.render());
  // Lobby: F0 SMALL=2, F0 MEDIUM=2, F0 LARGE=0, F1 SMALL=0, F1 MEDIUM=3, F1 LARGE=0
}

main();</code></pre>

<h3>Example 2: follow-up "add EV charging"</h3>
<p>Requirements the interviewer usually adds: some spots have chargers; EVs that want to charge should get one if available; non-EVs should avoid charger spots unless nothing else is free; charging is billed per kWh on top of parking. Charger is a <em>feature</em> orthogonal to size, so it is a field on the spot, not a subclass (a subclass per size and feature is the explosion).</p>
<pre><code class="language-ts">// EDIT 1: spot gains a feature flag; vehicle gains an intent flag
class ParkingSpot {
  // ...as before, plus:
  constructor(readonly id: string, readonly floor: number, readonly size: SpotSize,
              readonly hasCharger = false) {}
}
class Vehicle {
  constructor(readonly plate: string, readonly type: VehicleType, readonly wantsCharge = false) {}
}

// EDIT 2: Floor's free index is keyed by (size, charger) instead of size alone
const indexKey = (size: SpotSize, charger: boolean) =&gt; size + (charger ? ':EV' : '');
//   occupy(size, v, charger)  takes from free[indexKey(size, charger)]
//   vacate(spot)              returns to free[indexKey(spot.size, spot.hasCharger)]

// ADDITION 1: an allocation strategy; the old one stays for lots without chargers
class EvAwareAllocation implements SpotAllocationStrategy {
  allocate(floors: ReadonlyArray&lt;Floor&gt;, v: Vehicle): ParkingSpot | null {
    // EVs that want a charge try charger spots first; everyone else tries normal spots first
    const order = v.wantsCharge ? [true, false] : [false, true];
    for (const charger of order) {
      for (const size of COMPATIBLE[v.type]) {
        for (const floor of floors) {
          const spot = floor.occupy(size, v, charger);
          if (spot) return spot;
        }
      }
    }
    return null;
  }
}

// ADDITION 2: charger sessions report energy; pricing is decorated, not rewritten
interface EnergyMeter { kwhFor(ticketId: string): number }

class ChargingSurcharge implements PricingStrategy {
  constructor(
    private readonly base: PricingStrategy,
    private readonly meter: EnergyMeter,
    private readonly paisePerKwh: number,
  ) {}
  price(ticket: Ticket, exitAt: Date): number {
    const parking = this.base.price(ticket, exitAt);
    if (!ticket.spot.hasCharger) return parking;
    return parking + Math.round(this.meter.kwhFor(ticket.id) * this.paisePerKwh);
  }
}

// WIRING: the only lines that change in main()
//   allocation: new EvAwareAllocation(),
//   pricing: new ChargingSurcharge(new HourlyPricing(rates), chargerMeter, 1800),</code></pre>
<p>What to say: two honest edits (spot field, index key) and two pure additions (strategy, decorator). If the interviewer pushes on "non-EVs blocking chargers", the next move is a policy such as "non-EVs may use charger spots only when the lot is above 90 percent full", which is another allocation strategy. An idle-fee for EVs that stay plugged in after charging completes is another pricing decorator.</p>

<h3>Example 3: follow-up "make it thread-safe" (in-process and across instances)</h3>
<p><strong>In-process.</strong> The design is already safe: <code>enter</code> is synchronous, and <code>exit</code> claims the ticket before awaiting. The test that proves the second point:</p>
<pre><code class="language-ts">// Two exit gates submit the same ticket at the same moment
const results = await Promise.allSettled([
  lot.exit(ticket.id, 'X1', PaymentMethod.UPI),
  lot.exit(ticket.id, 'X2', PaymentMethod.UPI),
]);
// one fulfilled; one rejected with INVALID_STATE ("is PAYMENT_PENDING, expected ACTIVE")
// the payment provider was called exactly once

// If allocation ever has to await (e.g. confirm with an occupancy sensor), serialise it per lot:
//   enterAsync(v, gate) { return this.lotLock.runExclusive(() =&gt; this.enterWithSensorCheck(v, gate)); }
// using the async Mutex from the LLD framework topic.</code></pre>
<p><strong>Across instances.</strong> Three service instances behind a load balancer each have their own memory, so the free index and the ticket state move into Postgres, and the database enforces the invariants:</p>
<pre><code class="language-sql">CREATE TABLE spots (
  id      TEXT PRIMARY KEY,
  lot_id  TEXT NOT NULL,
  floor   INT  NOT NULL,
  size    TEXT NOT NULL,
  status  TEXT NOT NULL DEFAULT 'FREE'           -- FREE | OCCUPIED | OUT_OF_SERVICE
);
CREATE INDEX spots_free ON spots (lot_id, size, floor) WHERE status = 'FREE';

CREATE TABLE tickets (
  id        TEXT PRIMARY KEY,
  spot_id   TEXT NOT NULL REFERENCES spots(id),
  plate     TEXT NOT NULL,
  status    TEXT NOT NULL,                         -- ACTIVE | PAYMENT_PENDING | PAID
  entry_at  TIMESTAMPTZ NOT NULL
);
-- Invariants the in-memory classes enforced, now enforced for every instance
CREATE UNIQUE INDEX one_unpaid_ticket_per_spot  ON tickets (spot_id) WHERE status &lt;&gt; 'PAID';
CREATE UNIQUE INDEX one_unpaid_ticket_per_plate ON tickets (plate)   WHERE status &lt;&gt; 'PAID';

-- Entry, at any gate on any instance: $2 is the compatible sizes in preference order
BEGIN;
SELECT id FROM spots
 WHERE lot_id = $1 AND status = 'FREE' AND size = ANY($2)
 ORDER BY array_position($2, size), floor, id
 LIMIT 1
 FOR UPDATE SKIP LOCKED;            -- concurrent gates skip rows another transaction holds
UPDATE spots SET status = 'OCCUPIED' WHERE id = $3;
INSERT INTO tickets (id, spot_id, plate, status, entry_at) VALUES ($4, $3, $5, 'ACTIVE', now());
COMMIT;

-- Exit claim: the conditional update is the cross-instance version of beginPayment()
UPDATE tickets SET status = 'PAYMENT_PENDING' WHERE id = $1 AND status = 'ACTIVE';
-- rowCount 0 means another gate already claimed it</code></pre>
<p><code>SKIP LOCKED</code> matters for throughput: without it, a second gate would block on the row the first gate locked and then find it occupied; with it, the second gate immediately takes the next free spot. The domain classes do not change; a <code>PostgresSpotAllocator</code> and <code>PostgresTicketRepository</code> replace the in-memory implementations.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Lot full for this vehicle type only</h3>
<p>Motorcycles may still fit when cars do not. Reject with <code>LOT_FULL</code> at the gate before the barrier opens, and let boards show "FULL" per size, not per lot.</p>

<h3>2. The same plate enters twice</h3>
<p>Camera misread, tailgating, or a car that left through a manually opened barrier. <code>ALREADY_PARKED</code> protects the model, but operations need an override: a supervisor closes the stale ticket (with a reason) so the real car can enter.</p>

<h3>3. Lost ticket</h3>
<p>Look up the unpaid ticket by plate (the repository already supports it) and apply a lost-ticket policy: usually the maximum daily charge, after identity checks. That is a pricing decorator, not a special case in the facade.</p>

<h3>4. Payment fails at the exit</h3>
<p>The ticket returns to ACTIVE, the spot stays occupied and the barrier stays closed. The driver retries with another method. Never release the spot first: a released spot can be allocated to someone else while the first car is still in it.</p>

<h3>5. Pay at a kiosk, exit later</h3>
<p>Real lots let you pay at a lobby kiosk and give you about 15 minutes to leave. Model it as PAID with a <code>paidUntil</code>; the exit gate checks it and, on overstay, prices only the extra time.</p>

<h3>6. Long and overnight stays</h3>
<p>Hourly pricing over three days produces large bills; most lots cap per day. Tariffs that change at night or on weekends require pricing <em>segments</em> (split the stay at tariff boundaries and price each), which is a strategy of its own. Compute boundaries in the lot's local time zone, with UTC storage.</p>

<h3>7. Grace period and rounding</h3>
<p>State both: first 10 minutes free; partial hours round up. A 61-minute stay costs 2 hours. Interviewers check whether you made the rule explicit and whether the test covers the boundary.</p>

<h3>8. Small vehicle in a big spot</h3>
<p>Allowed, but best-fit allocation prefers the smallest compatible size so trucks are not locked out by motorcycles. Price by vehicle type, so the customer does not pay for the lot's choice.</p>

<h3>9. Spot out of service</h3>
<p>Maintenance removes a spot from the free index. If it is occupied, mark it "close after release" so <code>vacate</code> does not return it to the index. Boards must exclude it from free counts.</p>

<h3>10. The car is not where the model says</h3>
<p>Drivers ignore assigned spots. If spot-level sensors exist, they are the source of truth for occupancy and the model reconciles; if not, allocation should be per floor and size, not a specific spot promise.</p>

<h3>11. Gate hardware retries</h3>
<p>A barrier controller that times out may resend "vehicle at entry". Without an idempotency key (the controller's event id), the retry issues a second ticket. Deduplicate on the event id at the adapter boundary.</p>

<h3>12. Floors added or removed at runtime</h3>
<p>Adding is safe (new floor, new index). Removing an occupied floor is not; drain it first (remove its spots from allocation, wait for exits), then delete.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1: a class per vehicle type and per spot type</h3>
<p><code>class Car extends Vehicle {}</code> with no behaviour, plus <code>CompactSpot</code> and <code>LargeSpot</code>, plus <code>canFit</code> overridden in each. Every new type touches several classes. Types that differ only by data are an enum and a table.</p>

<h3>Anti-pattern 2: scanning every spot on every entry</h3>
<p><code>spots.find(s =&gt; s.isFree &amp;&amp; s.size === wanted)</code> is O(total spots). Fine for 50 spots, not for an airport with 10,000 and a queue at the gate. Say the complexity and use the per-floor index.</p>

<h3>Anti-pattern 3: pricing inside Ticket or Vehicle</h3>
<p><code>ticket.calculateFee()</code> with rates baked in. Pricing is the most frequently changed rule in the domain; it belongs behind a <code>PricingStrategy</code> injected into the service.</p>

<h3>Anti-pattern 4: the service writes spot fields directly</h3>
<p><code>spot.vehicle = v</code> from the service, plus a separate "remove from free list" call that someone forgets. The index drifts from reality and the lot double-allocates. One owner (the floor) for both.</p>

<h3>Anti-pattern 5: release the spot, then charge</h3>
<p>If payment fails after the spot is released, the model says the spot is free while the car is still in it. Claim the ticket, pay, then release.</p>

<h3>Anti-pattern 6: <code>ParkingLot.getInstance()</code></h3>
<p>A Singleton makes it impossible to test two lots or run a multi-tenant service for many lots. Create one per lot at the composition root and inject it.</p>

<h3>Anti-pattern 7: floats and hidden clocks</h3>
<p><code>hours * 40.5</code> rupees and <code>Date.now()</code> inside pricing. Integer paise and an injected clock make the 61-minute boundary test trivial.</p>

<h3>Anti-pattern 8: the lot knows about its boards</h3>
<p><code>this.lobbyBoard.update(); this.floor1Board.update();</code> in the service. Adding a mobile push means editing the service. Observer: boards subscribe.</p>

<h3>Anti-pattern 9: hardware calls inside the domain</h3>
<p><code>barrier.open()</code> inside <code>exit()</code>. The domain decides "exit approved"; the gate adapter turns that into a vendor-specific relay command. Otherwise you cannot test without hardware, and a barrier timeout corrupts domain state.</p>

<h3>Anti-pattern 10: ticket id = plate</h3>
<p>The same car visiting twice in a day collides, and plates are personal data you may not want printed. Generate ticket ids; index by plate separately.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. "Design a parking lot." What do you ask before drawing anything?</div>
  <div class="qa-answer">
    <p>How many floors and gates, and do gates operate concurrently. Which vehicle and spot types exist and whether smaller vehicles may use bigger spots. How vehicles are identified (paper ticket, plate recognition). How pricing works and whether it will change (hourly, caps, weekends). Where and how payment happens. Whether displays must show live availability. And what is out of scope: reservations, passes, valet. The answers decide the variation points (pricing, allocation, payment) and the concurrency requirement (multiple gates).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why not create Car, Bike and Truck subclasses, and Compact and Large spot subclasses?</div>
  <div class="qa-answer">
    <p>Because they differ only in data: which spot sizes fit and which rate applies. Subclasses with empty bodies add classes without behaviour, and fit rules spread across overrides. An enum per axis plus a compatibility table makes "add a van" one enum value and one row. I would introduce subclasses only if behaviour genuinely differed, for example a valet vehicle that follows a different entry flow, and even then I would prefer a strategy.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you find a free spot efficiently? What is the complexity?</div>
  <div class="qa-answer">
    <p>Each floor keeps a map from spot size to a set of free spot ids. Allocation walks the compatible sizes in best-fit order and the floors in nearest order, taking any id from the first non-empty set: O(floors x compatible sizes), with O(1) set operations, so effectively O(floors). Vacating adds the id back in O(1). Free counts for displays are set sizes, O(1). The floor owns both the spots and the index, so occupancy and index cannot disagree. If "nearest to the lift" mattered within a floor, I would use a min-heap by distance per size instead of a set, making take O(log n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Where does pricing live, and how would you add weekend pricing or a daily cap?</div>
  <div class="qa-answer">
    <p>Behind a <code>PricingStrategy</code> interface injected into the service; the ticket only records times. Weekend pricing is a new strategy (or a strategy that picks a rate card by day). A daily cap is a decorator that wraps any strategy and clamps per 24-hour block, so it composes with whatever base pricing a lot uses. I price by vehicle type rather than spot size, so customers do not pay for the lot's allocation choice. For tariffs that change mid-stay, the strategy splits the stay into segments at tariff boundaries in the lot's local time zone.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Now add EV charging.</div>
  <div class="qa-answer">
    <p>The charger is orthogonal to size, so it is a field on the spot (<code>hasCharger</code>), not a subclass; vehicles get a <code>wantsCharge</code> flag. The floor's free index is keyed by size and charger. A new <code>EvAwareAllocation</code> strategy tries charger spots first for EVs that want to charge, and normal spots first for everyone else. Billing is a <code>ChargingSurcharge</code> decorator that adds kWh from the charger's meter to the base parking price. Two small edits (spot field, index key), two pure additions (strategy, decorator), and wiring. Natural next questions are idle fees after charging completes (another decorator) and stopping non-EVs from blocking chargers (an allocation rule).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Make it thread-safe for multiple entry and exit gates.</div>
  <div class="qa-answer">
    <p>The hazards are "find a free spot then take it" at entry and "price then charge then release" at exit. In Node, <code>enter</code> is synchronous, so it cannot interleave in one process. <code>exit</code> awaits the payment provider, so the ticket moves to PAYMENT_PENDING synchronously before the await; a duplicate exit sees the wrong state and fails, and the provider is called once. If entry ever needs I/O, a per-lot async mutex serialises it. In Java I would guard the floor's index with a lock per floor, or use concurrent sets plus an atomic compare-and-set on the spot's occupant, and the same state claim on the ticket.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Now the service runs on three instances behind a load balancer. What changes?</div>
  <div class="qa-answer">
    <p>In-memory indexes and locks are per process, so allocation and ticket state move into the database. Entry runs <code>SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1</code> over free spots of compatible sizes, ordered by preference, then updates the spot and inserts the ticket in one transaction. Exit claims the ticket with a conditional update (<code>WHERE status = 'ACTIVE'</code>) and checks the row count. Partial unique indexes enforce one unpaid ticket per spot and per plate, so even a bug cannot double-allocate. Display boards then need events from the database layer (an outbox or change stream) rather than in-process observers. The domain classes stay; repositories change.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. A bus needs three contiguous large spots. How do you support it?</div>
  <div class="qa-answer">
    <p>Spots need a position: a row id and an index within the row. The floor keeps, per row, the free large spots in a sorted structure, and allocation looks for a run of length k (a sliding window over the sorted free indices, O(spots in row)). The ticket then references a list of spots instead of one, which is a real model change: <code>Ticket.spots: ParkingSpot[]</code>, with vacate releasing all of them. Allocation for multi-spot vehicles must take all k spots atomically or none. I would say this is the one follow-up that edits the core model, and it is why I keep the spot reference on the ticket behind a method.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How would you test this design?</div>
  <div class="qa-answer">
    <p>Unit tests per class: spot refuses incompatible and second vehicles; floor index counts match occupancy after random occupy and vacate sequences (a property-based test catches drift); ticket refuses illegal transitions; pricing boundaries at 10, 11, 60 and 61 minutes with a fixed clock. Service tests with fakes: a payment processor that fails, then succeeds, asserting the spot is still occupied after the failure; duplicate exits via <code>Promise.allSettled</code> asserting one success and one provider call; LOT_FULL per vehicle type. Injected clock and id generator make every test deterministic.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Should ParkingLotService be a Singleton?</div>
  <div class="qa-answer">
    <p>No. "One lot" is a deployment fact, not a type constraint; the same code may run many lots for one operator, and tests need fresh instances. I create one instance per lot at the composition root and inject it into the gate controllers. If the interviewer insists, I implement it but point out that a singleton is per process, so it does not enforce "one" once there are several instances.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How does the design change with licence-plate recognition instead of paper tickets?</div>
  <div class="qa-answer">
    <p>The domain barely changes: the ticket id stays internal and the exit lookup becomes <code>findUnpaidByPlate</code>, which the repository already supports. The camera is an adapter that turns vendor events into <code>enter</code> and <code>exit</code> calls, with confidence scores and an idempotency key per event. New edge cases matter more: misreads (manual review queue below a confidence threshold), two cars with plates the camera confuses, and privacy rules for storing plates (retention limits, hashing for analytics).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE scenario) A mall operator using your parking software says the display boards show free spots, but drivers reach the floor and find it full. What do you do?</div>
  <div class="qa-answer">
    <p>Treat it as model-versus-reality drift: the model believes fewer cars are on that floor than really are. First get data: at a fixed time, compare the model's occupied count per floor with a physical count or sensor readings, so I know which floors drift and by how much. Then check the causes that undercount: cars entering without an entry event (barrier opened manually, tailgating behind a ticketed car), staff or permit vehicles parking outside the system, drivers parking on a different floor from the one they were allocated, and out-of-service spots still counted as free. Separately, check the boards themselves: a board that missed updates shows stale counts, so boards should periodically resync full counts, not only apply deltas. (Cars leaving without an exit event cause the opposite symptom, a full board with empty spots.) Fixes are both operational and technical: record manual barrier opens as events, make occupancy sensors the source of truth for free counts where they exist, allocate per floor instead of promising a specific spot, and alert on a "model minus sensor occupancy" metric so drift is caught before customers report it.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>Vehicle and spot types are enums joined by a compatibility table, not subclass trees.</li>
    <li>A per-floor free index gives O(1) allocation steps, and one class owns both the index and occupancy.</li>
    <li>Pricing and allocation are strategies; surcharges and caps are decorators; boards are observers.</li>
    <li>Exit claims the ticket before awaiting payment and releases the spot only after success.</li>
    <li>The concurrency answer covers in-process and multi-instance (<code>SKIP LOCKED</code>, partial unique indexes).</li>
    <li>EV charging lands as a spot feature, a strategy and a decorator, with the edits named honestly.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Draw the parking lot class diagram. Which relationships are composition and which are injected?</div>
  <div class="qa-answer">
    <p><strong>Composition:</strong> <code>ParkingLotService ◆── 1..* Floor ◆── 1..* ParkingSpot</code>. Spots are created by their floor and do not outlive it, and the floor also owns the free index, so occupancy and index change together. <strong>Association:</strong> <code>Ticket ──► 1 ParkingSpot</code> and <code>Ticket ──► 1 Vehicle</code>; a spot has many tickets over time but at most one unpaid.</p>
    <p><strong>Aggregation (injected, ◇):</strong> the service receives the <code>SpotAllocationStrategy</code> (for example <code>NearestFloorBestFit</code>), the <code>PricingStrategy</code> (for example <code>HourlyPricing</code>), a <code>PaymentProcessor</code> per payment method, the <code>TicketRepository</code>, the gate list, <code>ParkingObserver</code>s such as <code>DisplayBoard</code>, the clock and the id generator. The strategies and observer are interfaces with implementations drawn underneath them (┄┄▷), which is where the follow-ups plug in.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q14. Walk through the exit flow. What happens if payment fails, and how does a duplicate exit charge only once?</div>
  <div class="qa-answer">
    <p>Load the ticket and check the gate is an EXIT gate, price it with the pricing strategy, then call <code>ticket.beginPayment()</code> <strong>synchronously before the first await</strong>, moving it ACTIVE → PAYMENT_PENDING. Then await the payment processor. On success: <code>completePayment</code>, the floor vacates the spot, observers are notified, and a receipt is returned.</p>
    <p>On failure (rejected or thrown): <code>ticket.failPayment()</code> puts it back to ACTIVE, the spot stays occupied and the barrier stays closed, so the driver can retry with another method; the spot is never released first, or it could be allocated while the car is still in it. A duplicate exit request arriving during the await finds the ticket in PAYMENT_PENDING, fails with an invalid-state error, and the provider is called once. Across instances the same claim is a conditional update: <code>UPDATE tickets SET status = 'PAYMENT_PENDING' WHERE id = ... AND status = 'ACTIVE'</code>, checking the row count.</p>
  </div>
</div>
` },

  ]
});
