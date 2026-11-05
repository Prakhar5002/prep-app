window.PREP_SITE.registerTopic({
  id: "lld-booking-system",
  module: "lld",
  title: "Case: Meeting Room Booking",
  estimatedReadTime: "45 min",
  tags: ["lld","case-study","booking","interval-overlap","concurrency","double-booking","postgres","exclusion-constraint","advisory-lock","state-machine","typescript"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Bookings are <strong>half-open intervals</strong> with a status lifecycle; the overlap check is one line, and the real design is making <strong>check-then-insert atomic per room</strong> — a lock where all instances meet, plus a database constraint as the final word.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Correctness bar is absolute:</strong> two people must never hold the same room at the same time; rooms, search, check-in, cancellation and recurring are ordinary modelling.</li>
    <li><strong>Overlap:</strong> <code>a.start &lt; b.end &amp;&amp; b.start &lt; a.end</code> on <code>[start, end)</code> — every case, and back-to-back meetings (10:00–11:00, 11:00–12:00) are legal.</li>
    <li><strong>Model:</strong> <code>TimeSlot</code> value object (validated, immutable, owns <code>overlaps()</code>); <code>Booking</code> aggregate owns the lifecycle; rules are <code>BookingPolicy</code> strategies.</li>
    <li><strong>Lifecycle:</strong> PENDING → CONFIRMED → CHECKED_IN → COMPLETED, exits CANCELLED / NO_SHOW (auto-release when nobody checks in). Only PENDING, CONFIRMED, CHECKED_IN block; freeing a room = leaving that set.</li>
    <li><strong>Lock only what grows occupied time</strong> (book, extend). Cancel, check-in, end early and no-show release use optimistic versions.</li>
    <li><strong>The race:</strong> double-booking is a race, not a logic bug; check-then-insert at READ COMMITTED double-books. A per-room mutex works for a single process only; many instances need a database guard.</li>
    <li><strong>Guards:</strong> <code>FOR UPDATE</code> on the room row · <code>pg_advisory_xact_lock</code> (transaction-scoped; lock a concept) · optimistic room version · SERIALIZABLE + retry · slot-claim unique index (any DB).</li>
    <li><strong>Invariant:</strong> <code>EXCLUDE USING gist (room_id WITH =, during WITH &amp;&amp;) WHERE (status IN blocking)</code>, needs <code>btree_gist</code>, violation = 23P01 → 409.</li>
    <li><strong>Phantoms:</strong> locking the overlapping rows fails when there are none — lock the parent or a key.</li>
    <li><strong>Guard = transactional scope</strong>: the lock, the overlap read and the insert share one transaction; events publish after commit (outbox for durability).</li>
    <li><strong>Idempotency-Key</strong> + UNIQUE column; re-check inside the guard; publish only when actually created.</li>
    <li><strong>Time:</strong> UTC instants, wall-clock rules in the room's IANA zone, server clock as truth; DST days are 23/25 hours.</li>
    <li><strong>Recurring:</strong> materialise occurrences with <code>series_id</code> to a bounded horizon, zone-aware expansion, all-or-nothing vs skip-conflicts, edit this / following / all.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>"I check for overlaps, then insert — inside a transaction, so it's safe."</strong> At READ COMMITTED both requests see no clash and both insert, and an in-process mutex stops helping the moment a second instance starts. Fix: serialise per room where all instances meet (advisory xact lock or <code>FOR UPDATE</code> on the room row) and keep an exclusion constraint filtered to blocking statuses as the backstop.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Bookings are half-open intervals, so a clash is just a.start &lt; b.end and b.start &lt; a.end — back-to-back meetings are fine."</div>
  <div class="revision-say">"Double-booking is a race, not a logic bug. I serialise check-then-insert per room inside one transaction with an advisory transaction lock, and keep a Postgres exclusion constraint as the invariant every code path must satisfy."</div>
  <div class="revision-say">"Only operations that grow occupied time take the room lock; cancel, check-in, end-early and the no-show sweeper use optimistic versions, so a late check-in and the auto-release resolve cleanly."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What the interviewer is actually testing</h3>
<table>
  <thead><tr><th>Part of the problem</th><th>Tests</th><th>Weak answer</th><th>Strong answer</th></tr></thead>
  <tbody>
    <tr><td>Rooms, bookings, users</td><td>Modelling</td><td>Raw <code>Date</code> pairs everywhere</td><td>A <code>TimeSlot</code> value object owning validation and <code>overlaps()</code></td></tr>
    <tr><td>Conflict detection</td><td>Precision</td><td>Four-case if/else with <code>&lt;=</code> bugs</td><td>Half-open intervals + the two-comparison rule</td></tr>
    <tr><td>Two people booking at once</td><td>Concurrency</td><td>"I check, then I insert"</td><td>Names the race, serialises per room, adds a DB constraint</td></tr>
    <tr><td>Check-in / extend / end early / cancel</td><td>State</td><td>Boolean flags</td><td>Status enum + transition table</td></tr>
    <tr><td>Max length, capacity, no past bookings</td><td>Open/closed</td><td>Ifs inside <code>book()</code></td><td>Composable <code>BookingPolicy</code> strategies</td></tr>
    <tr><td>Recurring meetings, time zones</td><td>Rigour</td><td>"Add 7 days of milliseconds"</td><td>Expand in the room's IANA zone so 10:00 stays 10:00 across DST</td></tr>
  </tbody>
</table>

<h3>Why it is realistic, not academic</h3>
<ul>
  <li><strong>Meeting-room tablets.</strong> A tablet outside each room shows "Free / Busy until 11:00" and offers <em>book now</em>, <em>check in</em>, <em>extend</em> and <em>end early</em>. If nobody checks in within a grace period the booking is <em>auto-released</em>, so ghost meetings stop hoarding rooms. Tablets sit on flaky Wi-Fi, so every write must be <strong>idempotent</strong>.</li>
  <li><strong>Appointment / practitioner booking engines.</strong> Rules generate slots, a client requests one, the provider confirms. The standard production fix for double-booking there: inside the <code>POST /bookings</code> transaction, take <code>pg_advisory_xact_lock</code> keyed on the practitioner, re-check overlaps, insert, commit — same-practitioner bookings serialise, different practitioners run in parallel.</li>
</ul>
<p>Check-in windows, extend, end early, cancellation and double-book prevention are what a senior candidate raises <em>without being asked</em>.</p>

<h3>Where this sits</h3>
<p>Method: <a href="#/topic/lld-framework">LLD Interview Framework</a>. Patterns (Strategy, Observer, State, Repository/Adapter): <a href="#/topic/lld-patterns">Design Patterns for LLD</a>. Who may cancel or check in: <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a>. Booking events feed <a href="#/topic/lld-notification">Case: Notification Service</a> asynchronously (<a href="#/topic/be-event-driven">Event-Driven Systems</a>). Row locks and isolation in general: <a href="#/topic/be-databases">Databases</a>.</p>

<div class="callout note">
  <div class="callout-title">Language note</div>
  <p>Code is TypeScript; it maps 1:1 to Java or C++ — interfaces stay interfaces, string enums become enums, <code>Promise&lt;T&gt;</code> becomes <code>CompletableFuture&lt;T&gt;</code> or a plain return, and the per-room mutex becomes a <code>ConcurrentHashMap&lt;String, ReentrantLock&gt;</code> / <code>std::mutex</code> map.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — the overlap rule on a timeline</h3>
<div class="diagram"><pre>
             09:00     09:30     10:00     10:30     11:00     11:30     12:00
existing A                       [===================)                          10:00-11:00
new 1  ends as A starts    [=====)                                               09:30-10:00  no clash (touches)
new 2  starts as A ends                                [===================)     11:00-12:00  no clash (touches)
new 3  straddles A's start       [===========)                                   09:30-10:30  CLASH
new 4  inside A                          [=====)                                 10:15-10:45  CLASH
new 5  covers A            [=================================)                   09:30-11:30  CLASH

Rule (half-open [start, end)):   clash  &lt;=&gt;  new.start &lt; A.end  AND  A.start &lt; new.end
</pre></div>
<p>Every "case" an anxious candidate enumerates (starts inside, ends inside, contains, contained) is covered by those two comparisons. The half-open convention is what makes back-to-back meetings legal: 10:00 is <em>not</em> inside <code>[09:30, 10:00)</code>.</p>

<h3>Picture 2 — three layers of defence against double-booking</h3>
<div class="diagram"><pre>
 request
   |
   v
 [1] Domain check        TimeSlot valid? policies pass? overlaps found?     fast, friendly error message
   |                      -- NOT a guarantee: two requests can both pass this
   v
 [2] Serialise per room  in-process mutex / advisory xact lock / FOR UPDATE on the room row
   |                      -- makes "check overlaps + insert" one atomic step
   v
 [3] Database invariant  EXCLUDE USING gist (room_id WITH =, during WITH &amp;&amp;)
                          -- the truth: holds for every code path, script and future bug
</pre></div>
<p>Layer 1 alone is the classic bug. Layer 2 alone breaks when someone writes a migration script or a second service. Layer 3 alone works but surfaces as a late, generic database error. Senior answer: <strong>all three</strong>, each for a different reason.</p>

<h3>Picture 3 — the booking lifecycle</h3>
<div class="diagram"><pre>
                 approve                      check in (start-10m .. start+10m)
   PENDING ---------------&gt; CONFIRMED ------------------------------&gt; CHECKED_IN
      |                      |      |                                     |
      | decline / cancel     |      | nobody checked in by start+10m      | end early (frees the rest)
      |                      |      | (sweeper job)                       | or natural end
      v                      v      v                                     v
   CANCELLED &lt;---- cancel ---+    NO_SHOW  (room released)             COMPLETED

   Blocking (occupy the room):      PENDING, CONFIRMED, CHECKED_IN
   Non-blocking (history only):     COMPLETED, CANCELLED, NO_SHOW
</pre></div>
<p>The single most useful idea in this diagram: <strong>freeing a room is just leaving the blocking set</strong>. Cancel, no-show and end-early never need the room lock, because shrinking or releasing time can never create a conflict. Only operations that <em>grow</em> occupied time — book and extend — must be serialised.</p>

<h3>Picture 4 — whose clock, whose zone</h3>
<ul>
  <li><strong>Server time is the truth.</strong> A wall tablet whose clock drifted 4 minutes must not decide whether check-in is open. The tablet renders from the server's answer (and can compute a clock offset from a server timestamp in each response).</li>
  <li><strong>Store instants in UTC</strong> (<code>timestamptz</code>), <strong>display in a zone</strong>: the room's IANA zone (<code>Asia/Kolkata</code>) on the tablet, the viewer's zone on their phone.</li>
  <li><strong>Rules that mention wall-clock time</strong> ("business hours 08:00–20:00", "every Monday at 10:00") are evaluated in the room's zone, never the server's.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"I'll wrap it in a transaction, so it's safe." A transaction at the default <strong>READ COMMITTED</strong> isolation does not stop two transactions from both running the overlap <code>SELECT</code>, both seeing nothing, and both inserting. Transactions give atomicity of <em>writes</em>; they do not by themselves serialise <em>check-then-act</em>. You need a lock, SERIALIZABLE isolation with retries, or a constraint.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>This section walks the <a href="#/topic/lld-framework">framework</a> steps in the order you would say them out loud in the interview. The full code solution is in <strong>Examples</strong>.</p>

<h3>Step 1 — Requirements (functional + non-functional)</h3>
<p><strong>Ask, then commit:</strong> arbitrary times or a 15-minute grid? (arbitrary) · one building or many zones? (many; each room has an IANA zone) · approval rooms? (a few → PENDING) · check-in and auto-release? (yes: from 10 min before to 10 min after start) · recurring? (follow-up) · scale? (~2,000 rooms, ~50k users, peak ~50 writes/s on Monday 9 a.m., reads ~50× writes).</p>
<ul>
  <li><strong>Functional:</strong> find free rooms (time, capacity, amenities) · book · cancel · view a room's day and my bookings · check in · extend · end early · auto-release no-shows · approvals · recurring series.</li>
  <li><strong>Non-functional:</strong> <strong>never double-book</strong> (correctness over availability for writes) · search p95 &lt; 200 ms · several stateless API instances · idempotent writes · DST-correct · auditable (no hard deletes).</li>
</ul>

<h3>Step 2 — Entities &amp; relationships</h3>
<ul>
  <li><strong>Room</strong> (entity): capacity, amenities, IANA time zone, active flag.</li>
  <li><strong>TimeSlot</strong> (immutable value object): a validated half-open <code>[start, end)</code> that owns <code>overlaps()</code>.</li>
  <li><strong>Booking</strong> (aggregate root): room, organiser, attendees, slot, <strong>BookingStatus</strong>, version — owns the lifecycle transitions.</li>
  <li><strong>Actor</strong>: who is acting — a user (maybe admin) or a room's tablet device.</li>
  <li><strong>BookingPolicy</strong> (Strategy): one business rule each. <strong>BookingService</strong>: orchestrates use cases, owns no rules.</li>
  <li><strong>Ports:</strong> RoomScheduleGuard, BookingRepository, RoomRepository, Clock; <strong>BookingEventBus</strong> is the Observer subject.</li>
</ul>
<p><strong>Relationships:</strong> Room 1—* Booking · User 1—* Booking (organiser) · Booking *—* User (attendees) · Booking ◆— TimeSlot (composition: no identity of its own) · Series 1—* Booking (follow-up).</p>

<h3>Step 3 — Class diagram (ASCII)</h3>
<div class="diagram"><pre>
+-------------------------------+         +----------------------------------+
| BookingService                |-------&gt; | &lt;&lt;interface&gt;&gt; RoomRepository     |
|-------------------------------|         | findById(id) / findAll()         |
| + book(req): Booking          |         +----------------------------------+
| + bookSeries(req)             |         +----------------------------------+
| + cancel(id, actor, reason)   |-------&gt; | &lt;&lt;interface&gt;&gt; BookingRepository  |
| + checkIn(id, actor)          |         | findBlockingOverlaps(room, slot) |
| + extend(id, newEnd, actor)   |         | insert(b) / update(b) [version]  |
| + endEarly(id, actor)         |         +----------------------------------+
| + releaseNoShows(): number    |         +----------------------------------+
| + findAvailableRooms(...)     |-------&gt; | &lt;&lt;interface&gt;&gt; RoomScheduleGuard  |
+---------------+---------------+         | exclusive(roomId, fn(tx))        |
                |                         +-----------^--------------^-------+
                | uses                                |              |
                v                         InProcessRoomGuard   PgRoomScheduleGuard
+-------------------------------+         (keyed async mutex)  (BEGIN + advisory xact lock)
| &lt;&lt;interface&gt;&gt; BookingPolicy   |
| check(input): void            |&lt;---- CompositePolicy &lt;&gt;---- MaxDurationPolicy
+-------------------------------+                              NotInPastPolicy
                                                               CapacityPolicy

+--------------+ 1      * +------------------------------+ 1    1 +-------------------+
| Room         |----------| Booking                      |&lt;&gt;------| TimeSlot  (VO)    |
|--------------|          |------------------------------|        |-------------------|
| id, name     |          | id, roomId, organizerId      |        | start, end        |
| capacity     |          | attendeeIds, seriesId        |        | overlaps(other)   |
| amenities    |          | - status: BookingStatus      |        | contains(instant) |
| timeZone     |          | - version: number            |        | withEnd(end)      |
| satisfies()  |          | confirm() cancel() checkIn() |        +-------------------+
+--------------+          | extendTo() endEarly()        |
                          | markNoShow() isBlocking()    |
                          +------------------------------+
     BookingService --publish--&gt; BookingEventBus --notify--&gt; listeners (notifications, analytics, tablet push)
</pre></div>

<h3>Step 4 — Interfaces/APIs</h3>
<p>The ports the service depends on. The key design move is <code>RoomScheduleGuard</code>: it is <strong>not</strong> "a lock" but "a transactional scope with exclusive access to one room". The repository handed to the callback shares that transaction — because a lock and the write it protects must live in the same transaction, or the lock protects nothing.</p>
<pre><code class="language-ts">export interface Clock { now(): Date; }

export interface RoomRepository {
  findById(id: string): Promise&lt;Room | null&gt;;
  findAll(): Promise&lt;Room[]&gt;;
}

export interface BookingRepository {
  findById(id: string): Promise&lt;Booking | null&gt;;
  findByIdempotencyKey(key: string): Promise&lt;Booking | null&gt;;
  /** Blocking bookings in this room overlapping slot, sorted by start; optionally ignore one (extend). */
  findBlockingOverlaps(roomId: string, slot: TimeSlot, excludeId?: string): Promise&lt;Booking[]&gt;;
  /** Blocking bookings in ANY room overlapping slot (availability search). */
  findBlockingInRange(slot: TimeSlot): Promise&lt;Booking[]&gt;;
  /** CONFIRMED bookings whose start is before cutoff (no-show sweeper). */
  findConfirmedStartedBefore(cutoff: Date): Promise&lt;Booking[]&gt;;
  insert(b: Booking, idempotencyKey?: string): Promise&lt;void&gt;;
  /** Optimistic concurrency: only succeeds if the stored version equals b.version. */
  update(b: Booking): Promise&lt;void&gt;;
}

/** Exclusive + transactional access to ONE room's schedule. fn's repo shares the guard's transaction. */
export interface RoomScheduleGuard {
  exclusive&lt;T&gt;(roomId: string, fn: (tx: BookingRepository) =&gt; Promise&lt;T&gt;): Promise&lt;T&gt;;
}

export interface PolicyInput {
  kind: 'create' | 'extend';
  room: Room;
  slot: TimeSlot;
  attendeeCount: number;
  now: Date;
}
export interface BookingPolicy { check(input: PolicyInput): void; } // throws POLICY_VIOLATION</code></pre>

<p><strong>HTTP surface</strong> (thin controllers over the service):</p>
<table>
  <thead><tr><th>Endpoint</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td><code>GET /rooms/available?start=&amp;end=&amp;capacity=</code></td><td>Best fit first (smallest room that fits)</td></tr>
    <tr><td><code>GET /rooms/:id/schedule?date=2026-11-05</code></td><td>The date is a day in the <em>room's</em> zone</td></tr>
    <tr><td><code>POST /bookings</code> + <code>Idempotency-Key</code></td><td>201 · 409 <code>CONFLICT</code> (with the clashing range) · 422 policy</td></tr>
    <tr><td><code>POST /bookings/:id/{cancel|check-in|extend|end}</code></td><td>409 <code>STALE_WRITE</code> on a lost race; 422 <code>CHECK_IN_WINDOW</code></td></tr>
  </tbody>
</table>
<p>Action endpoints, not <code>PATCH {status}</code>: each transition has its own rules and permissions, and a client must not be able to "set" a state the state machine forbids (<a href="#/topic/api-rest">REST APIs</a>).</p>

<h3>Step 5 — Core flows</h3>
<h4>Create booking</h4>
<div class="diagram"><pre>
Client            BookingService             RoomScheduleGuard          BookingRepository(tx)    EventBus
  | POST /bookings      |                            |                           |                   |
  | Idempotency-Key: k  |                            |                           |                   |
  |-------------------&gt; | seen k before? -&gt; return it|                           |                   |
  |                     | TimeSlot.of + policies     |                           |                   |
  |                     |-- exclusive(roomId) ------&gt;| BEGIN; lock(room)         |                   |
  |                     |                            |-- findByIdempotencyKey --&gt;| (re-check)        |
  |                     |                            |-- findBlockingOverlaps --&gt;|                   |
  |                     |                            |&lt;---------- [] -------------|                   |
  |                     |                            |-- insert(booking) -------&gt;| EXCLUDE backstop  |
  |                     |&lt;------- booking -----------| COMMIT (lock released)    |                   |
  |                     |-- publish(BookingCreated) ------------------------------------------------&gt;|
  |&lt;-- 201 Created -----|                            |                           |                   |
</pre></div>
<h4>Which operations need the room guard?</h4>
<table>
  <thead><tr><th>Operation</th><th>Changes occupied time?</th><th>Room guard?</th><th>Concurrency control</th></tr></thead>
  <tbody>
    <tr><td>Book</td><td>Grows (new interval)</td><td><strong>Yes</strong></td><td>Guard + DB constraint</td></tr>
    <tr><td>Extend</td><td>Grows (longer interval)</td><td><strong>Yes</strong></td><td>Guard + re-read inside + constraint</td></tr>
    <tr><td>Approve (PENDING → CONFIRMED)</td><td>No (PENDING already blocks)</td><td>No</td><td>Optimistic version</td></tr>
    <tr><td>Cancel</td><td>Shrinks to nothing</td><td>No</td><td>Optimistic version</td></tr>
    <tr><td>Check in</td><td>No</td><td>No</td><td>Optimistic version (races the no-show sweeper)</td></tr>
    <tr><td>End early</td><td>Shrinks</td><td>No</td><td>Optimistic version</td></tr>
    <tr><td>Auto-release no-show</td><td>Shrinks to nothing</td><td>No</td><td>Optimistic version; loses cleanly to a late check-in</td></tr>
  </tbody>
</table>
<p>That table is a strong thing to draw in an interview: it shows you know <em>why</em> you are locking, so you lock the minimum. Pessimistic locking for growth (conflicts are about <em>absent</em> rows), optimistic versioning for state changes on an <em>existing</em> row.</p>

<h3>Step 6 — Code</h3>
<p>The complete solution is Example 1. Its heart is two ideas: the overlap rule on <code>TimeSlot</code>, and doing the overlap read and the insert <em>inside</em> <code>guard.exclusive(roomId, tx =&gt; …)</code> on the same transaction, publishing events only after it commits.</p>

<h3>Step 7 — Extensibility &amp; concurrency</h3>
<h4>Concurrency options, compared</h4>
<table>
  <thead><tr><th>Strategy</th><th>Multi-instance?</th><th>Strength</th><th>Weakness</th></tr></thead>
  <tbody>
    <tr><td>In-process mutex per room</td><td>No</td><td>Zero infra; tests and the interview baseline</td><td>Silently wrong once a second pod starts</td></tr>
    <tr><td><code>FOR UPDATE</code> on the room row</td><td>Yes</td><td>Standard SQL, MySQL too</td><td>Needs a parent row; lock ordering for multi-room</td></tr>
    <tr><td><code>pg_advisory_xact_lock(key)</code></td><td>Yes</td><td>Locks a <em>concept</em> (practitioner + day); auto-release at commit</td><td>Postgres-only; hash collisions = extra waiting</td></tr>
    <tr><td>Optimistic room version</td><td>Yes</td><td>No blocking</td><td>Retry storms at peak</td></tr>
    <tr><td>SERIALIZABLE</td><td>Yes</td><td>No explicit locks</td><td>Every caller must retry SQLSTATE 40001</td></tr>
    <tr><td><strong>Exclusion constraint</strong></td><td>Yes</td><td>Declarative invariant for every code path</td><td>Postgres-only; late, generic error (23P01)</td></tr>
    <tr><td>Slot-claim unique index</td><td>Yes</td><td>Any SQL DB; DynamoDB conditional writes</td><td>Fixed grid; N rows per booking</td></tr>
  </tbody>
</table>

<h4>Guard A — the exclusion constraint (the invariant)</h4>
<pre><code class="language-sql">CREATE EXTENSION IF NOT EXISTS btree_gist;   -- lets a GiST index handle "room_id WITH =" (a plain equality)

CREATE TABLE bookings (
  id               uuid PRIMARY KEY,
  room_id          uuid NOT NULL REFERENCES rooms(id),  -- rooms(id, name, capacity, time_zone, version)
  organizer_id     uuid NOT NULL,
  title            text NOT NULL,
  attendee_ids     uuid[] NOT NULL DEFAULT '{}',
  series_id        uuid,
  during           tstzrange NOT NULL,       -- tstzrange(start, end) defaults to '[)' = half-open
  status           text NOT NULL CHECK (status IN
                     ('PENDING','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','NO_SHOW')),
  version          int  NOT NULL DEFAULT 0,
  idempotency_key  text UNIQUE,              -- replayed POSTs hit this, not a second row
  checked_in_at    timestamptz,
  cancel_reason    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT during_not_empty CHECK (NOT isempty(during)),
  CONSTRAINT no_double_booking EXCLUDE USING gist (
    room_id WITH =,
    during  WITH &amp;&amp;
  ) WHERE (status IN ('PENDING','CONFIRMED','CHECKED_IN'))   -- only blocking rows count
);

-- Violations raise SQLSTATE 23P01 (exclusion_violation): map it to HTTP 409.</code></pre>
<p>Without the <code>WHERE</code>, a cancelled booking blocks its slot forever; the list must equal the domain's blocking set (one shared constant plus a test). The constraint's GiST index also speeds up the overlap query.</p>

<h4>Guard B — lock the parent row (any SQL database)</h4>
<pre><code class="language-sql">BEGIN;
-- Serialise all writers for this room. Locking the overlapping BOOKINGS would not work:
-- when there is no clash there are no rows to lock (the "phantom" problem).
SELECT id FROM rooms WHERE id = $1 FOR UPDATE;

SELECT 1 FROM bookings
 WHERE room_id = $1
   AND status IN ('PENDING','CONFIRMED','CHECKED_IN')
   AND during &amp;&amp; tstzrange($2::timestamptz, $3::timestamptz)
 LIMIT 1;
-- application: if a row came back -&gt; ROLLBACK and return 409; else:
INSERT INTO bookings (id, room_id, organizer_id, title, during, status)
VALUES ($4, $1, $5, $6, tstzrange($2::timestamptz, $3::timestamptz), 'CONFIRMED');
COMMIT;</code></pre>

<h4>Guard C — advisory transaction lock (lock a concept, not a row)</h4>
<pre><code class="language-sql">BEGIN;
-- Transaction-scoped: released automatically at COMMIT/ROLLBACK.
-- hashtext() maps the key to an int; a collision just makes two rooms share a lock (slower, never wrong).
SELECT pg_advisory_xact_lock(hashtext('room:' || $1));
-- ... same overlap check + INSERT as above ...
COMMIT;</code></pre>
<p>Advisory locks shine when availability comes from rules rather than rows (an appointment engine has nothing to <code>FOR UPDATE</code>) or you want a finer key ("practitioner 42 on 2026-11-05"). Use the <strong>transaction-scoped</strong> variant: session-level <code>pg_advisory_lock</code> must be unlocked explicitly and leaks across requests behind a transaction-mode pooler. <code>hashtext</code> is internal and undocumented (but widely used); a stored <code>bigint</code> lock key avoids it.</p>

<h4>Guards D and E — optimistic room version, slot-claim table</h4>
<pre><code class="language-sql">-- D: every booking for a room bumps the SAME row, so concurrent bookers collide on it.
UPDATE rooms SET version = version + 1 WHERE id = $1 AND version = $2;  -- 0 rows =&gt; ROLLBACK, retry

-- E: fixed 15-minute grid, works on any SQL database. The primary key IS the guard.
CREATE TABLE room_slot_claims (
  room_id uuid NOT NULL, slot_start timestamptz NOT NULL, booking_id uuid NOT NULL,
  PRIMARY KEY (room_id, slot_start)
);  -- 10:00-11:00 inserts 4 rows; any overlap =&gt; 23505 =&gt; whole transaction rolls back</code></pre>
<p>On DynamoDB the slot-claim idea is one item per <code>(room, slot)</code> written with an "attribute must not exist" condition inside a transactional write.</p>

<h4>Extensibility hooks</h4>
<ul>
  <li><strong>New rule</strong> (holidays, VIP rooms) → a new <code>BookingPolicy</code> in the composite; the service is untouched (<a href="#/topic/design-ocp">Open/Closed</a>).</li>
  <li><strong>New reaction</strong> (notify attendees, refresh the tablet) → a new event listener. For durability, write events to an <strong>outbox</strong> in the booking transaction and relay them to a queue (<a href="#/topic/be-queues">Queues</a>, <a href="#/topic/cloud-sqs">SQS / SNS / EventBridge</a>).</li>
  <li><strong>New state</strong> (<code>ON_HOLD</code>) → one transition-table row, plus a decision on whether it blocks (change the constraint's <code>WHERE</code> in the same migration).</li>
  <li><strong>Multi-resource bookings</strong> (room + projector) → acquire locks in a global sorted order, or deadlock.</li>
  <li><strong>Buffers / cleaning time</strong> → a second range <code>blocked = [start - before, end + after)</code> carries the constraint; <code>during</code> stays for display.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — the complete solution (TypeScript)</h3>
<p>Ordered so it reads top-down in an interview: errors and value objects, the aggregate with its state machine, ports, policies, the service, then adapters (in-memory for tests, Postgres for production).</p>

<h4>1a. Errors and the TimeSlot value object</h4>
<pre><code class="language-ts">// ===== domain/errors.ts =====
export type DomainErrorCode =
  | 'INVALID_RANGE'
  | 'ROOM_NOT_FOUND'
  | 'BOOKING_NOT_FOUND'
  | 'CONFLICT'
  | 'POLICY_VIOLATION'
  | 'INVALID_TRANSITION'
  | 'CHECK_IN_WINDOW'
  | 'FORBIDDEN'
  | 'STALE_WRITE';

export class DomainError extends Error {
  constructor(readonly code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

// ===== domain/time-slot.ts =====
export const MINUTE = 60_000;

/** Immutable half-open interval [start, end). Compared by value; never mutated in place. */
export class TimeSlot {
  private constructor(readonly start: Date, readonly end: Date) {}

  static of(start: Date, end: Date): TimeSlot {
    const s = start.getTime();
    const e = end.getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) throw new DomainError('INVALID_RANGE', 'Invalid date');
    if (e &lt;= s) throw new DomainError('INVALID_RANGE', 'end must be after start');
    return new TimeSlot(new Date(s), new Date(e)); // defensive copies: Date is mutable
  }

  overlaps(other: TimeSlot): boolean {
    return this.start.getTime() &lt; other.end.getTime() &amp;&amp; other.start.getTime() &lt; this.end.getTime();
  }

  contains(instant: Date): boolean {
    const t = instant.getTime();
    return this.start.getTime() &lt;= t &amp;&amp; t &lt; this.end.getTime();
  }

  get minutes(): number {
    return (this.end.getTime() - this.start.getTime()) / MINUTE;
  }

  withEnd(end: Date): TimeSlot {
    return TimeSlot.of(this.start, end);
  }

  toString(): string {
    return this.start.toISOString() + ' to ' + this.end.toISOString();
  }
}</code></pre>

<h4>1b. Room and the Booking aggregate (state machine)</h4>
<pre><code class="language-ts">// ===== domain/room.ts =====
export enum Amenity {
  VIDEO_CONFERENCE = 'VIDEO_CONFERENCE',
  WHITEBOARD = 'WHITEBOARD',
  DISPLAY = 'DISPLAY',
}

export class Room {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly capacity: number,
    readonly amenities: ReadonlySet&lt;Amenity&gt;,
    readonly timeZone: string,           // IANA zone: display, business hours, recurrence
    readonly active: boolean = true,
  ) {}

  satisfies(minCapacity: number, needs: readonly Amenity[]): boolean {
    return this.active &amp;&amp; this.capacity &gt;= minCapacity &amp;&amp; needs.every((a) =&gt; this.amenities.has(a));
  }
}

// ===== domain/booking.ts =====
export enum BookingStatus {
  PENDING = 'PENDING',         // needs approval; already holds the slot
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',         // auto-released: nobody checked in
}

/** Statuses that occupy the room. MUST match the DB exclusion constraint's WHERE clause. */
export const BLOCKING_STATUSES: ReadonlySet&lt;BookingStatus&gt; = new Set([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
]);

const ALLOWED: Record&lt;BookingStatus, readonly BookingStatus[]&gt; = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.CHECKED_IN, BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
  [BookingStatus.CHECKED_IN]: [BookingStatus.COMPLETED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.NO_SHOW]: [],
};

export interface CheckInWindow {
  opensBeforeStartMin: number;   // 10: the tablet shows "Check in" from 09:50 for a 10:00 meeting
  graceAfterStartMin: number;    // 10: not checked in by 10:10 =&gt; auto-release
}

export interface BookingProps {
  id: string;
  roomId: string;
  organizerId: string;
  title: string;
  attendeeIds: readonly string[];
  seriesId: string | null;
  slot: TimeSlot;
  status: BookingStatus;
  version: number;
  checkedInAt: Date | null;
  cancelReason: string | null;
  createdAt: Date;
}

export type NewBooking = Omit&lt;BookingProps, 'status' | 'version' | 'checkedInAt' | 'cancelReason'&gt;;

export class Booking {
  private p: BookingProps;                         // one private bag: snapshot() is a copy of it

  constructor(props: BookingProps) {
    this.p = { ...props, attendeeIds: [...props.attendeeIds] };
  }

  static create(n: NewBooking, needsApproval: boolean): Booking {
    const status = needsApproval ? BookingStatus.PENDING : BookingStatus.CONFIRMED;
    return new Booking({ ...n, status, version: 0, checkedInAt: null, cancelReason: null });
  }

  get id() { return this.p.id; }
  get roomId() { return this.p.roomId; }
  get organizerId() { return this.p.organizerId; }
  get attendeeIds() { return this.p.attendeeIds; }
  get slot() { return this.p.slot; }
  get status() { return this.p.status; }
  get version() { return this.p.version; }

  isBlocking(): boolean {
    return BLOCKING_STATUSES.has(this.p.status);
  }

  confirm(): void {
    this.moveTo(BookingStatus.CONFIRMED);
  }

  cancel(now: Date, reason: string): void {
    if (now.getTime() &gt;= this.p.slot.end.getTime()) {
      throw new DomainError('INVALID_TRANSITION', 'Booking has already ended');
    }
    this.moveTo(BookingStatus.CANCELLED);         // CHECKED_IN cannot cancel: use endEarly()
    this.p.cancelReason = reason;
  }

  checkIn(now: Date, w: CheckInWindow): void {
    const start = this.p.slot.start.getTime();
    const opens = start - w.opensBeforeStartMin * MINUTE;
    const closes = Math.min(start + w.graceAfterStartMin * MINUTE, this.p.slot.end.getTime());
    const t = now.getTime();
    if (t &lt; opens || t &gt;= closes) {
      throw new DomainError('CHECK_IN_WINDOW',
        'Check-in is open from ' + new Date(opens).toISOString() + ' to ' + new Date(closes).toISOString());
    }
    this.moveTo(BookingStatus.CHECKED_IN);
    this.p.checkedInAt = new Date(t);
  }

  /** Grows the booking. The caller MUST re-check conflicts for the new slot under the room guard. */
  extendTo(newEnd: Date, now: Date): void {
    if (this.p.status !== BookingStatus.CONFIRMED &amp;&amp; this.p.status !== BookingStatus.CHECKED_IN) {
      throw new DomainError('INVALID_TRANSITION', 'Only upcoming or running bookings can be extended');
    }
    if (now.getTime() &gt;= this.p.slot.end.getTime()) {
      throw new DomainError('INVALID_TRANSITION', 'Booking has already ended');
    }
    if (newEnd.getTime() &lt;= this.p.slot.end.getTime()) {
      throw new DomainError('INVALID_RANGE', 'New end must be after the current end');
    }
    this.p.slot = this.p.slot.withEnd(newEnd);
  }

  /** Leaving the blocking set frees the room; shrinking the slot keeps utilisation data honest. */
  endEarly(now: Date): void {
    if (this.p.status !== BookingStatus.CHECKED_IN) {
      throw new DomainError('INVALID_TRANSITION', 'Only a running meeting can be ended');
    }
    const t = now.getTime();
    if (t &lt; this.p.slot.end.getTime()) {
      // Checked in early and left before the start? Keep a 1-minute record rather than an empty range.
      const end = Math.max(t, this.p.slot.start.getTime() + MINUTE);
      this.p.slot = this.p.slot.withEnd(new Date(end));
    }
    this.moveTo(BookingStatus.COMPLETED);
  }

  markNoShow(now: Date, w: CheckInWindow): void {
    if (now.getTime() &lt; this.p.slot.start.getTime() + w.graceAfterStartMin * MINUTE) {
      throw new DomainError('INVALID_TRANSITION', 'Grace period is not over');
    }
    this.moveTo(BookingStatus.NO_SHOW);
  }

  /** Called by a repository after a successful write. */
  markPersisted(version: number): void {
    this.p.version = version;
  }

  snapshot(): BookingProps {
    return { ...this.p, attendeeIds: [...this.p.attendeeIds] };
  }

  private moveTo(next: BookingStatus): void {
    if (!ALLOWED[this.p.status].includes(next)) {
      throw new DomainError('INVALID_TRANSITION', this.p.status + ' -&gt; ' + next + ' is not allowed');
    }
    this.p.status = next;
  }
}</code></pre>
<p>Why a transition table instead of the full State pattern (one class per state)? Six states with mostly "allowed or not" behaviour is exactly what a table expresses best: one place to read, trivially testable, and the DB <code>CHECK</code> mirrors it. Reach for State classes when each state carries substantially different <em>behaviour</em>, not just different permissions (see <a href="#/topic/lld-patterns">Design Patterns for LLD</a>).</p>

<h4>1c. Policies (Strategy + Composite) and events (Observer)</h4>
<pre><code class="language-ts">// ===== domain/policies.ts =====
export class MaxDurationPolicy implements BookingPolicy {
  constructor(private readonly maxMinutes: number) {}
  check({ slot }: PolicyInput): void {
    if (slot.minutes &gt; this.maxMinutes) {
      throw new DomainError('POLICY_VIOLATION', 'Bookings are limited to ' + this.maxMinutes + ' minutes');
    }
  }
}

export class NotInPastPolicy implements BookingPolicy {
  /** Tolerance lets a tablet "Book now" at 10:03 for a 10:00 slot. */
  constructor(private readonly toleranceMin = 5) {}
  check({ kind, slot, now }: PolicyInput): void {
    if (kind !== 'create') return;                       // a running meeting can be extended
    if (slot.start.getTime() &lt; now.getTime() - this.toleranceMin * MINUTE) {
      throw new DomainError('POLICY_VIOLATION', 'Cannot book in the past');
    }
  }
}

export class CapacityPolicy implements BookingPolicy {
  check({ room, attendeeCount }: PolicyInput): void {
    if (attendeeCount &gt; room.capacity) {
      throw new DomainError('POLICY_VIOLATION', room.name + ' seats ' + room.capacity);
    }
  }
}

export class CompositePolicy implements BookingPolicy {
  constructor(private readonly rules: readonly BookingPolicy[]) {}
  check(input: PolicyInput): void {
    for (const rule of this.rules) rule.check(input);
  }
}

// ===== domain/events.ts =====
export type BookingEvent =
  | { type: 'BookingCreated'; booking: BookingProps }
  | { type: 'BookingCancelled'; booking: BookingProps; reason: string }
  | { type: 'BookingExtended'; booking: BookingProps; previousEnd: Date }
  | { type: 'BookingEndedEarly'; booking: BookingProps }
  | { type: 'BookingReleased'; booking: BookingProps };   // no-show auto-release

export interface BookingEventListener {
  on(event: BookingEvent): void | Promise&lt;void&gt;;
}

export class BookingEventBus {
  private listeners: BookingEventListener[] = [];

  subscribe(listener: BookingEventListener): () =&gt; void {
    this.listeners.push(listener);
    return () =&gt; { this.listeners = this.listeners.filter((l) =&gt; l !== listener); };
  }

  /** A failing listener (email provider down) must never fail an already-committed booking. */
  async publish(event: BookingEvent): Promise&lt;void&gt; {
    const results = await Promise.allSettled(
      this.listeners.map((l) =&gt; Promise.resolve().then(() =&gt; l.on(event))),
    );
    for (const r of results) {
      if (r.status === 'rejected') console.error('listener failed for', event.type, r.reason);
    }
  }
}</code></pre>

<h4>1d. The application service</h4>
<pre><code class="language-ts">// ===== app/booking-service.ts =====
export type Actor =
  | { kind: 'user'; userId: string; isAdmin: boolean }
  | { kind: 'roomDevice'; roomId: string };              // the tablet outside the room

export interface BookRequest {
  roomId: string;
  organizerId: string;
  title: string;
  start: Date;
  end: Date;
  attendeeIds?: string[];
  idempotencyKey?: string;                               // from the Idempotency-Key header
}

export interface BookingServiceDeps {
  rooms: RoomRepository;
  bookings: BookingRepository;                           // non-transactional reads
  guard: RoomScheduleGuard;
  policy: BookingPolicy;
  clock: Clock;
  events: BookingEventBus;
  newId: () =&gt; string;
  checkInWindow: CheckInWindow;
  approvalRoomIds: ReadonlySet&lt;string&gt;;
}

type Permission = 'cancel' | 'extend' | 'attend';        // per action, not per role

export class BookingService {
  constructor(private readonly d: BookingServiceDeps) {}

  async book(req: BookRequest): Promise&lt;Booking&gt; {
    if (req.idempotencyKey) {
      const prior = await this.d.bookings.findByIdempotencyKey(req.idempotencyKey);
      if (prior) return prior;                           // replayed request: same answer, no new row
    }
    const room = await this.mustFindRoom(req.roomId);
    const slot = TimeSlot.of(req.start, req.end);
    const attendeeIds = req.attendeeIds ?? [];
    this.d.policy.check({ kind: 'create', room, slot, attendeeCount: attendeeIds.length + 1, now: this.d.clock.now() });

    const { booking, created } = await this.d.guard.exclusive(room.id, async (tx) =&gt; {
      if (req.idempotencyKey) {                          // two concurrent retries of the same request
        const prior = await tx.findByIdempotencyKey(req.idempotencyKey);
        if (prior) return { booking: prior, created: false };
      }
      const clashes = await tx.findBlockingOverlaps(room.id, slot);
      if (clashes.length &gt; 0) {
        // Say WHEN it is taken, not by whom or what: other people's titles may be private.
        throw new DomainError('CONFLICT', room.name + ' is taken ' + clashes[0].slot.toString());
      }
      const b = Booking.create({
        id: this.d.newId(), roomId: room.id, organizerId: req.organizerId, title: req.title,
        attendeeIds, seriesId: null, slot, createdAt: this.d.clock.now(),
      }, this.d.approvalRoomIds.has(room.id));
      await tx.insert(b, req.idempotencyKey);
      return { booking: b, created: true };
    });

    if (created) await this.d.events.publish({ type: 'BookingCreated', booking: booking.snapshot() });
    return booking;
  }

  async cancel(bookingId: string, actor: Actor, reason = 'cancelled by organiser'): Promise&lt;Booking&gt; {
    const b = await this.mustFind(bookingId);
    this.authorize(b, actor, 'cancel');
    b.cancel(this.d.clock.now(), reason);
    await this.d.bookings.update(b);                     // STALE_WRITE if a check-in or sweeper got there first
    await this.d.events.publish({ type: 'BookingCancelled', booking: b.snapshot(), reason });
    return b;
  }

  async checkIn(bookingId: string, actor: Actor): Promise&lt;Booking&gt; {
    const b = await this.mustFind(bookingId);
    this.authorize(b, actor, 'attend');
    b.checkIn(this.d.clock.now(), this.d.checkInWindow);
    await this.d.bookings.update(b);
    return b;
  }

  async extend(bookingId: string, newEnd: Date, actor: Actor): Promise&lt;Booking&gt; {
    const current = await this.mustFind(bookingId);
    this.authorize(current, actor, 'extend');
    const room = await this.mustFindRoom(current.roomId);
    const previousEnd = current.slot.end;

    const extended = await this.d.guard.exclusive(current.roomId, async (tx) =&gt; {
      const fresh = await tx.findById(bookingId);        // re-read under the guard: never trust the outside read
      if (!fresh) throw new DomainError('BOOKING_NOT_FOUND', bookingId);
      const now = this.d.clock.now();
      fresh.extendTo(newEnd, now);
      this.d.policy.check({ kind: 'extend', room, slot: fresh.slot, attendeeCount: fresh.attendeeIds.length + 1, now });
      const clashes = await tx.findBlockingOverlaps(fresh.roomId, fresh.slot, fresh.id);
      if (clashes.length &gt; 0) {
        throw new DomainError('CONFLICT', 'The next meeting starts at ' + clashes[0].slot.start.toISOString());
      }
      await tx.update(fresh);
      return fresh;
    });

    await this.d.events.publish({ type: 'BookingExtended', booking: extended.snapshot(), previousEnd });
    return extended;
  }

  async endEarly(bookingId: string, actor: Actor): Promise&lt;Booking&gt; {
    const b = await this.mustFind(bookingId);
    this.authorize(b, actor, 'attend');
    b.endEarly(this.d.clock.now());                      // shrinking never conflicts: no room guard needed
    await this.d.bookings.update(b);
    await this.d.events.publish({ type: 'BookingEndedEarly', booking: b.snapshot() });
    return b;
  }

  /** Run every minute by a scheduler. Safe on many instances: optimistic versions make it idempotent. */
  async releaseNoShows(): Promise&lt;number&gt; {
    const now = this.d.clock.now();
    const cutoff = new Date(now.getTime() - this.d.checkInWindow.graceAfterStartMin * MINUTE);
    const due = await this.d.bookings.findConfirmedStartedBefore(cutoff);
    let released = 0;
    for (const b of due) {
      try {
        b.markNoShow(now, this.d.checkInWindow);
        await this.d.bookings.update(b);
        released++;
        await this.d.events.publish({ type: 'BookingReleased', booking: b.snapshot() });
      } catch (err) {
        // A late check-in or another sweeper instance won the race: that is the correct outcome.
        if (err instanceof DomainError &amp;&amp; err.code === 'STALE_WRITE') continue;
        throw err;
      }
    }
    return released;
  }

  async findAvailableRooms(start: Date, end: Date, minCapacity: number, needs: Amenity[] = []): Promise&lt;Room[]&gt; {
    const slot = TimeSlot.of(start, end);
    const [rooms, busy] = await Promise.all([this.d.rooms.findAll(), this.d.bookings.findBlockingInRange(slot)]);
    const busyRoomIds = new Set(busy.map((b) =&gt; b.roomId));
    return rooms
      .filter((r) =&gt; r.satisfies(minCapacity, needs) &amp;&amp; !busyRoomIds.has(r.id))
      .sort((a, b) =&gt; a.capacity - b.capacity);         // best fit: don't burn the boardroom on a 1:1
  }

  private authorize(b: Booking, actor: Actor, need: Permission): void {
    if (actor.kind === 'roomDevice') {
      // The tablet may check in, end or extend meetings in ITS room. It may never cancel.
      if (actor.roomId === b.roomId &amp;&amp; need !== 'cancel') return;
    } else if (actor.isAdmin || actor.userId === b.organizerId) {
      return;
    } else if (need === 'attend' &amp;&amp; b.attendeeIds.includes(actor.userId)) {
      return;
    }
    throw new DomainError('FORBIDDEN', 'Not allowed to change this booking');
  }

  private async mustFind(id: string): Promise&lt;Booking&gt; {
    const b = await this.d.bookings.findById(id);
    if (!b) throw new DomainError('BOOKING_NOT_FOUND', id);
    return b;
  }

  private async mustFindRoom(id: string): Promise&lt;Room&gt; {
    const r = await this.d.rooms.findById(id);
    if (!r || !r.active) throw new DomainError('ROOM_NOT_FOUND', id);
    return r;
  }
}</code></pre>
<p>The room tablet is a principal too: it authenticates as a <em>device bound to one room</em> and gets a narrower permission set (check in, end, extend — never cancel). Checking per-action permissions rather than branching on role names is the core idea of <a href="#/topic/api-auth-rbac">RBAC</a>; in a larger system <code>authorize</code> moves into a policy layer and reads permissions from the token.</p>

<h4>1e. Adapters: in-memory (tests, single process)</h4>
<pre><code class="language-ts">// ===== adapters/in-memory.ts =====
export class InMemoryRoomRepository implements RoomRepository {
  private readonly byId: Map&lt;string, Room&gt;;
  constructor(rooms: Room[]) { this.byId = new Map(rooms.map((r) =&gt; [r.id, r])); }
  async findById(id: string) { return this.byId.get(id) ?? null; }
  async findAll() { return [...this.byId.values()]; }
}

type Row = BookingProps &amp; { idempotencyKey?: string };
const hydrate = (r: Row): Booking =&gt; new Booking(r);
const byStart = (a: Booking, b: Booking) =&gt; a.slot.start.getTime() - b.slot.start.getTime();

export class InMemoryBookingRepository implements BookingRepository {
  private readonly rows = new Map&lt;string, Row&gt;();   // snapshots, never live objects
  private where = (pred: (r: Row) =&gt; boolean) =&gt; [...this.rows.values()].filter(pred).map(hydrate).sort(byStart);

  async findById(id: string) { const r = this.rows.get(id); return r ? hydrate(r) : null; }
  async findByIdempotencyKey(key: string) { return this.where((r) =&gt; r.idempotencyKey === key)[0] ?? null; }
  async findBlockingOverlaps(roomId: string, slot: TimeSlot, excludeId?: string) {
    return this.where((r) =&gt; r.roomId === roomId &amp;&amp; r.id !== excludeId &amp;&amp;
      BLOCKING_STATUSES.has(r.status) &amp;&amp; r.slot.overlaps(slot));
  }
  async findBlockingInRange(slot: TimeSlot) {
    return this.where((r) =&gt; BLOCKING_STATUSES.has(r.status) &amp;&amp; r.slot.overlaps(slot));
  }
  async findConfirmedStartedBefore(cutoff: Date) {
    return this.where((r) =&gt; r.status === BookingStatus.CONFIRMED &amp;&amp; r.slot.start.getTime() &lt; cutoff.getTime());
  }
  async insert(b: Booking, idempotencyKey?: string) {
    this.rows.set(b.id, { ...b.snapshot(), idempotencyKey });
  }
  async update(b: Booking) {
    const stored = this.rows.get(b.id);           // no await between check and write: atomic on one thread
    if (!stored) throw new DomainError('BOOKING_NOT_FOUND', b.id);
    if (stored.version !== b.version) throw new DomainError('STALE_WRITE', 'Changed since read; reload and retry');
    this.rows.set(b.id, { ...b.snapshot(), version: b.version + 1, idempotencyKey: stored.idempotencyKey });
    b.markPersisted(b.version + 1);
  }
}

/** Keyed async mutex: one queue per room, rooms never wait on each other. Single process ONLY. */
export class InProcessRoomGuard implements RoomScheduleGuard {
  private readonly tails = new Map&lt;string, Promise&lt;void&gt;&gt;();
  constructor(private readonly repo: BookingRepository) {}

  async exclusive&lt;T&gt;(roomId: string, fn: (tx: BookingRepository) =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
    const previous = this.tails.get(roomId) ?? Promise.resolve();
    let release!: () =&gt; void;
    const mine = new Promise&lt;void&gt;((resolve) =&gt; { release = resolve; });
    const tail = previous.then(() =&gt; mine);
    this.tails.set(roomId, tail);
    await previous;                                    // wait only for earlier callers on THIS room
    try {
      return await fn(this.repo);
    } finally {
      release();
      if (this.tails.get(roomId) === tail) this.tails.delete(roomId);   // nobody queued behind: no key leak
    }
  }
}</code></pre>

<h4>1f. Adapters: Postgres (node-postgres) for multi-instance production</h4>
<pre><code class="language-ts">// ===== adapters/postgres.ts =====
import { Pool, PoolClient } from 'pg';

const pgCode = (err: unknown) =&gt; (err as { code?: string }).code;
const COLS = 'id, room_id, organizer_id, title, attendee_ids, series_id, status, version, checked_in_at, ' +
  'cancel_reason, created_at, lower(during) AS start_at, upper(during) AS end_at';
const BLOCKING_OVERLAP = "status IN ('PENDING','CONFIRMED','CHECKED_IN') " +   // same list as the constraint
  'AND during &amp;&amp; tstzrange($1::timestamptz, $2::timestamptz)';
const toBooking = (r: any): Booking =&gt; new Booking({
  id: r.id, roomId: r.room_id, organizerId: r.organizer_id, title: r.title, attendeeIds: r.attendee_ids,
  seriesId: r.series_id, slot: TimeSlot.of(r.start_at, r.end_at), status: r.status, version: r.version,
  checkedInAt: r.checked_in_at, cancelReason: r.cancel_reason, createdAt: r.created_at,
});

export class PgBookingRepository implements BookingRepository {
  constructor(private readonly db: Pool | PoolClient) {}

  /** SQL fragments are constants; every value is a bind parameter. */
  private async select(where: string, params: unknown[]): Promise&lt;Booking[]&gt; {
    const { rows } = await this.db.query('SELECT ' + COLS + ' FROM bookings WHERE ' + where + ' ORDER BY lower(during)', params);
    return rows.map(toBooking);
  }
  async findById(id: string) { return (await this.select('id = $1', [id]))[0] ?? null; }
  async findByIdempotencyKey(key: string) { return (await this.select('idempotency_key = $1', [key]))[0] ?? null; }
  async findBlockingOverlaps(roomId: string, slot: TimeSlot, excludeId?: string) {
    return this.select(BLOCKING_OVERLAP + ' AND room_id = $3 AND ($4::uuid IS NULL OR id &lt;&gt; $4)',
      [slot.start, slot.end, roomId, excludeId ?? null]);
  }
  async findBlockingInRange(slot: TimeSlot) { return this.select(BLOCKING_OVERLAP, [slot.start, slot.end]); }
  async findConfirmedStartedBefore(cutoff: Date) {
    return this.select("status = 'CONFIRMED' AND lower(during) &lt; $1", [cutoff]);
  }

  async insert(b: Booking, idempotencyKey?: string) {
    const s = b.snapshot();
    try {
      await this.db.query(
        'INSERT INTO bookings (id, room_id, organizer_id, title, attendee_ids, series_id, during, status, ' +
        'idempotency_key, created_at) VALUES ($1, $2, $3, $4, $5, $6, ' +
        'tstzrange($7::timestamptz, $8::timestamptz), $9, $10, $11)',
        [s.id, s.roomId, s.organizerId, s.title, s.attendeeIds, s.seriesId, s.slot.start, s.slot.end,
         s.status, idempotencyKey ?? null, s.createdAt]);
    } catch (err) {
      if (pgCode(err) === '23P01') throw new DomainError('CONFLICT', 'Room already booked for that time'); // backstop fired
      throw err;   // 23505 on idempotency_key: a concurrent retry won; the controller re-reads and returns it
    }
  }

  async update(b: Booking) {
    const s = b.snapshot();
    try {
      const res = await this.db.query(
        'UPDATE bookings SET status = $1, during = tstzrange($2::timestamptz, $3::timestamptz), ' +
        'checked_in_at = $4, cancel_reason = $5, version = version + 1 WHERE id = $6 AND version = $7',
        [s.status, s.slot.start, s.slot.end, s.checkedInAt, s.cancelReason, s.id, s.version]);
      if (res.rowCount === 0) throw new DomainError('STALE_WRITE', 'Booking changed since it was read');
      b.markPersisted(s.version + 1);
    } catch (err) {
      if (pgCode(err) === '23P01') throw new DomainError('CONFLICT', 'Extension overlaps another booking');
      throw err;
    }
  }
}

export class PgRoomScheduleGuard implements RoomScheduleGuard {
  constructor(private readonly pool: Pool) {}

  async exclusive&lt;T&gt;(roomId: string, fn: (tx: BookingRepository) =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Transaction-scoped: released at COMMIT/ROLLBACK; safe behind a transaction-mode pooler.
      await client.query("SELECT pg_advisory_xact_lock(hashtext('room:' || $1))", [roomId]);
      const result = await fn(new PgBookingRepository(client));   // same client = same transaction
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}</code></pre>
<p>Note the layering: the advisory lock gives clean, early <code>CONFLICT</code> errors with a useful message; the exclusion constraint (23P01) is the backstop that also protects admin scripts, a future second service, and any bug in this code. If you use an ORM that cannot model <code>tstzrange</code> (Prisma marks it <code>Unsupported</code>), add the column and constraint in a raw SQL migration and do the overlap query with raw SQL.</p>

<h4>1g. Wiring it up — and the concurrency test that matters</h4>
<pre><code class="language-ts">import { randomUUID } from 'node:crypto';

const rooms = new InMemoryRoomRepository([
  new Room('r1', 'Everest', 6, new Set([Amenity.DISPLAY]), 'Asia/Kolkata'),
]);
const repo = new InMemoryBookingRepository();
const bus = new BookingEventBus();
bus.subscribe({ on: (e) =&gt; console.log('event:', e.type, e.booking.id) });

let fakeNow = new Date('2026-11-05T04:00:00Z');               // 09:30 in Asia/Kolkata
const service = new BookingService({
  rooms,
  bookings: repo,
  guard: new InProcessRoomGuard(repo),
  policy: new CompositePolicy([new NotInPastPolicy(5), new MaxDurationPolicy(240),
                               new CapacityPolicy()]),
  clock: { now: () =&gt; fakeNow },
  events: bus,
  newId: randomUUID,
  checkInWindow: { opensBeforeStartMin: 10, graceAfterStartMin: 10 },
  approvalRoomIds: new Set(),
});

// Ten people press "Book" for the same slot in the same tick.
const start = new Date('2026-11-05T04:30:00Z');
const end = new Date('2026-11-05T05:00:00Z');
const results = await Promise.allSettled(
  Array.from({ length: 10 }, (_, i) =&gt;
    service.book({ roomId: 'r1', organizerId: 'u' + i, title: 'Standup', start, end })),
);
const winners = results.filter((r) =&gt; r.status === 'fulfilled').length;
console.assert(winners === 1, 'exactly one booking must win, got ' + winners);

// Back-to-back is legal: 11:00-11:30 local right after 10:30-11:00 local.
await service.book({ roomId: 'r1', organizerId: 'u1', title: 'Next', start: end,
                     end: new Date('2026-11-05T05:30:00Z') });

// Bypass the guard and this fails: all ten see "no clash" before any insert lands.</code></pre>
<p>In the Postgres variant the equivalent integration test opens two real connections and runs both bookings concurrently; assert exactly one row exists and the loser got <code>CONFLICT</code>. Unit tests with mocks cannot prove the absence of a race — only concurrent execution can.</p>

<h3>Example 2 — follow-up: recurring bookings</h3>
<p>"Every Monday at 10:00 for 12 weeks." Three decisions to say out loud:</p>
<ul>
  <li><strong>Materialise occurrences</strong> as real booking rows (with a <code>series_id</code>) up to a bounded horizon. The exclusion constraint, availability search and the tablet's "today" view then just work. Compute-on-read (store only the rule) makes conflict detection against <em>other</em> series very hard.</li>
  <li><strong>Expand in the room's time zone</strong>, not by adding <code>7 * 24h</code> to a UTC instant — otherwise the meeting shifts by an hour at every DST change.</li>
  <li><strong>Conflict policy</strong>: all-or-nothing, or book the free occurrences and report the clashes. Product decides; implement both behind a flag.</li>
</ul>
<pre><code class="language-ts">// ===== domain/recurrence.ts =====  (uses Luxon for zone-aware calendar math)
import { DateTime } from 'luxon';

export enum Frequency { DAILY = 'DAILY', WEEKLY = 'WEEKLY' }

export interface RecurrenceRule {
  frequency: Frequency;
  interval: number;          // every N days / weeks
  weekdays?: number[];       // WEEKLY only, ISO: 1 = Monday ... 7 = Sunday
  count?: number;            // stop after N occurrences ...
  until?: Date;              // ... or at this instant. One of the two is required.
}

export const MAX_OCCURRENCES = 100;   // bounded horizon; a nightly job can extend long series

/** "10:00 every Monday" stays 10:00 local on both sides of a DST change. */
export function expand(firstStartLocal: string, durationMin: number, rule: RecurrenceRule, zone: string): TimeSlot[] {
  if (rule.count === undefined &amp;&amp; rule.until === undefined) {
    throw new DomainError('POLICY_VIOLATION', 'A series needs a count or an end date');
  }
  const first = DateTime.fromISO(firstStartLocal, { zone });        // e.g. '2026-11-02T10:00'
  if (!first.isValid) throw new DomainError('INVALID_RANGE', 'Bad start: ' + first.invalidReason);

  const limit = Math.min(rule.count ?? MAX_OCCURRENCES, MAX_OCCURRENCES);
  const weekdays = rule.frequency === Frequency.WEEKLY
    ? [...(rule.weekdays ?? [first.weekday])].sort((a, b) =&gt; a - b)
    : null;
  const out: TimeSlot[] = [];

  for (let period = 0; out.length &lt; limit &amp;&amp; period &lt; 1000; period++) {
    const base = rule.frequency === Frequency.DAILY
      ? first.plus({ days: period * rule.interval })                // calendar math: keeps wall-clock time
      : first.plus({ weeks: period * rule.interval });
    const starts = weekdays ? weekdays.map((wd) =&gt; base.set({ weekday: wd })) : [base];
    for (const s of starts) {
      if (s.toMillis() &lt; first.toMillis()) continue;              // first week may begin mid-week
      if (rule.until &amp;&amp; s.toMillis() &gt;= rule.until.getTime()) return out;
      if (out.length &gt;= limit) break;
      out.push(TimeSlot.of(s.toJSDate(), s.plus({ minutes: durationMin }).toJSDate()));
    }
  }
  return out;
}

// ===== in BookingService =====
async bookSeries(
  req: Omit&lt;BookRequest, 'start' | 'end'&gt; &amp; { firstStartLocal: string; durationMin: number;
    rule: RecurrenceRule; mode: 'ALL_OR_NOTHING' | 'SKIP_CONFLICTS' },
): Promise&lt;{ created: Booking[]; skipped: TimeSlot[] }&gt; {
  const room = await this.mustFindRoom(req.roomId);
  const slots = expand(req.firstStartLocal, req.durationMin, req.rule, room.timeZone);
  const now = this.d.clock.now();
  for (const slot of slots) {
    this.d.policy.check({ kind: 'create', room, slot, attendeeCount: (req.attendeeIds ?? []).length + 1, now });
  }
  const seriesId = this.d.newId();

  const result = await this.d.guard.exclusive(room.id, async (tx) =&gt; {
    const free: TimeSlot[] = [];
    const skipped: TimeSlot[] = [];
    for (const slot of slots) {
      const clashes = await tx.findBlockingOverlaps(room.id, slot);
      (clashes.length &gt; 0 ? skipped : free).push(slot);
    }
    if (req.mode === 'ALL_OR_NOTHING' &amp;&amp; skipped.length &gt; 0) {
      throw new DomainError('CONFLICT', skipped.length + ' occurrence(s) clash, first at ' + skipped[0].toString());
    }
    const created: Booking[] = [];
    for (const slot of free) {
      const b = Booking.create({
        id: this.d.newId(), roomId: room.id, organizerId: req.organizerId, title: req.title,
        attendeeIds: req.attendeeIds ?? [], seriesId, slot, createdAt: now,
      }, this.d.approvalRoomIds.has(room.id));
      await tx.insert(b);                                  // one transaction: all or none commit
      created.push(b);
    }
    return { created, skipped };
  });

  for (const b of result.created) await this.d.events.publish({ type: 'BookingCreated', booking: b.snapshot() });
  return result;
}</code></pre>
<p>Series follow-ups an interviewer will push on:</p>
<ul>
  <li><strong>Edit/cancel scope</strong>: "this occurrence", "this and following", "all". "This and following" = cancel future occurrences and (if the series continues with changes) start a new series id from that date — the same model calendar products use.</li>
  <li><strong>Exceptions</strong>: moving one occurrence just updates that row; keep <code>series_id</code> so "all" still finds it.</li>
  <li><strong>Infinite series</strong>: store the rule, materialise a rolling window (e.g. 6 months) with a nightly job; conflicts discovered by the job become notifications to the organiser.</li>
  <li><strong>Lock duration</strong>: 100 occurrences hold the room lock for the whole loop — batch the overlap check into one query (<code>during &amp;&amp; ANY($1::tstzrange[])</code>) if latency matters.</li>
</ul>

` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Back-to-back meetings</h3>
<p>10:00–11:00 then 11:00–12:00 must be allowed. Closed intervals (<code>&lt;=</code>) reject it; half-open with strict <code>&lt;</code> accepts it, and <code>tstzrange(a, b)</code> defaults to <code>'[)'</code> so the DB agrees.</p>

<h3>2. Zero-length and inverted ranges</h3>
<p>Reject <code>end &lt;= start</code> in <code>TimeSlot.of</code> and add <code>CHECK (NOT isempty(during))</code>. An empty range overlaps nothing, so a zero-length booking would "succeed" against an occupied room.</p>

<h3>3. Check-in window boundaries</h3>
<p>Opens at <code>start - 10m</code> (inclusive), closes at <code>min(start + grace, end)</code> (exclusive) — a 5-minute meeting must not be check-in-able after it ended. Test the exact boundary instants.</p>

<h3>4. Late check-in racing the no-show sweeper</h3>
<p>Both load version 3; exactly one <code>UPDATE … WHERE version = 3</code> wins. The sweeper swallows <code>STALE_WRITE</code> (the human won); if the sweeper won, the tablet offers "released — book now?".</p>

<h3>5. Extend into the next meeting</h3>
<p>Re-read the booking inside the room guard and check overlaps <em>excluding itself</em>. Return the next meeting's start so the UI can offer "extend until 11:30 instead".</p>

<h3>6. End early before the scheduled start</h3>
<p>Checked in at 09:52 for 10:00, left at 09:55: ending at <code>now</code> would invert the range. Keep a 1-minute record; COMPLETED is non-blocking, so the room is free either way.</p>

<h3>7. Device clock drift</h3>
<p>A tablet 4 minutes fast must not decide that check-in is open. Rules run on the server <code>Clock</code>; the tablet renders server-derived state.</p>

<h3>8. DST gaps, overlaps and 23/25-hour days</h3>
<p>Local 02:30 may not exist on spring-forward day, and 01:30 happens twice in autumn; date libraries resolve these by a documented policy (Temporal's default <code>'compatible'</code> shifts a gap time forward) — choose deliberately and test. A room's "day" runs from start-of-day to next start-of-day <em>in its zone</em>, never <code>start + 86_400_000</code>. <code>Asia/Kolkata</code> has no DST; people booking it from London do.</p>

<h3>9. Retries from flaky networks</h3>
<p>Without an idempotency key, a retried "Book now" hits <code>CONFLICT</code> against the booking it just made — or books a second room in a "find any room" flow. Key + re-check inside the guard + <code>UNIQUE</code> column.</p>

<h3>10. Cancelled rows vs the constraint</h3>
<p>No <code>WHERE status IN (…)</code> on the exclusion constraint → cancelled bookings block forever. Domain list and constraint list drifting apart → phantom conflicts or a missing guarantee.</p>

<h3>11. Approval timeouts</h3>
<p>PENDING holds the slot. If nobody approves, it is wasted. Auto-cancel PENDING bookings some time before start and notify both sides.</p>

<h3>12. Overnight bookings and "schedule for a date"</h3>
<p>An offsite from 18:00 to 09:00 crosses midnight. Schedule queries must return bookings that <em>overlap</em> the day, not ones that <em>start</em> on it.</p>

<h3>13. Precision mismatches</h3>
<p>An end of 11:00:00.001 "overlaps" an 11:00:00 start. Normalise to whole minutes (or seconds) at the API boundary.</p>

<h3>14. Stale search results</h3>
<p>Availability is a hint, not a reservation. Handle <code>CONFLICT</code> on submit by refreshing suggestions; if product wants "hold while I fill the form", add a short-lived HELD status — just another blocking status with an expiry.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — check-then-insert without atomicity</h3>
<pre><code class="language-ts">// BUG: two requests both pass the check before either inserts.
const clashes = await repo.findBlockingOverlaps(roomId, slot);
if (clashes.length === 0) await repo.insert(booking);</code></pre>
<p>Classic time-of-check to time-of-use (TOCTOU). Wrap both steps in the room guard and keep a DB constraint behind it.</p>

<h3>Anti-pattern 2 — an in-memory lock in a multi-instance deployment</h3>
<p>The per-room mutex works in tests and on one pod. Scale to two pods behind a load balancer and the "lock" protects nothing. In production the serialisation must live where all instances meet: the database (or a correctly used distributed lock — and that path has its own pitfalls; prefer the DB).</p>

<h3>Anti-pattern 3 — <code>SELECT … FOR UPDATE</code> on the overlapping bookings</h3>
<p>When there is no clash there is no row to lock, so two transactions both lock nothing and both insert. Lock a row that always exists (the room) or use an advisory lock or constraint.</p>

<h3>Anti-pattern 4 — closed intervals / four-case overlap logic</h3>
<p>Hand-enumerating "starts inside / ends inside" with <code>&lt;=</code> rejects back-to-back meetings and usually misses "fully contains". The rule is two strict comparisons on half-open intervals.</p>

<h3>Anti-pattern 5 — session-level advisory locks behind a connection pooler</h3>
<p><code>pg_advisory_lock</code> lives until explicitly unlocked or the session ends. With PgBouncer in transaction mode, the session is shared and the lock leaks to unrelated requests, or the unlock runs on a different backend. Use <code>pg_advisory_xact_lock</code>.</p>

<h3>Anti-pattern 6 — boolean flags instead of a status</h3>
<p><code>isCancelled</code>, <code>isCheckedIn</code>, <code>isNoShow</code> allow impossible combinations (cancelled AND checked in). One enum plus a transition table makes illegal states unrepresentable and gives the DB constraint something precise to filter on.</p>

<h3>Anti-pattern 7 — the god <code>BookingManager</code></h3>
<p>One class doing validation, SQL, emails, Slack posts and tablet pushes. Split by reason to change: domain (Booking, TimeSlot), rules (policies), orchestration (service), side effects (listeners). See <a href="#/topic/design-srp">Single Responsibility</a>.</p>

<h3>Anti-pattern 8 — side effects inside the lock / transaction</h3>
<p>Sending the confirmation email inside the guard holds the room lock for the duration of an SMTP call — and if the transaction later rolls back, the email already went out. Publish after commit, and for durability use an outbox written in the same transaction.</p>

<h3>Anti-pattern 9 — hard-deleting bookings</h3>
<p>Deleting on cancel loses audit history ("who cancelled the board meeting?"), breaks utilisation analytics and makes no-show rates uncomputable. Soft-cancel with a status, reason and actor.</p>

<h3>Anti-pattern 10 — trusting the client's clock or zone</h3>
<p>Accepting "now" from the device, or interpreting "2026-11-05T10:00" without a zone, produces bookings an hour off and check-ins outside the window. Accept ISO-8601 instants with an offset (or a local time plus an explicit IANA zone) and use the server clock for rules.</p>

<h3>Anti-pattern 11 — leaking other people's meeting titles in errors</h3>
<p>"Room taken by 'Layoff planning — confidential'" is a real incident pattern. Conflict errors return the time range, and the organiser only if the caller is allowed to see it.</p>

` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. "Design a meeting room booking system." How do you start?</div>
  <div class="qa-answer">
    <p>A few clarifying questions, then I commit to a scope: arbitrary-minute bookings, rooms with capacity, amenities and a time zone, check-in with auto-release, some approval rooms, recurring as a follow-up. I state the headline non-functional requirement — <strong>never double-book</strong>, on multiple API instances, with idempotent writes — then walk the framework: entities, class diagram, interfaces, the create flow, code, and finally concurrency and extensions. Saying the plan aloud lets the interviewer redirect me early.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. How do you detect a conflict?</div>
  <div class="qa-answer">
    <p>Half-open intervals <code>[start, end)</code>; two overlap iff <code>a.start &lt; b.end &amp;&amp; b.start &lt; a.end</code>. That covers partial overlap, containment and identical ranges, and allows back-to-back meetings. It lives on the <code>TimeSlot</code> value object; in Postgres it is the <code>&amp;&amp;</code> operator on <code>tstzrange</code>, GiST-indexable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Two users press "Book" for the same room and time at the same instant. What happens?</div>
  <div class="qa-answer">
    <p>Unprotected, both run the overlap query, both see nothing, both insert — check-then-act, and READ COMMITTED does not prevent it. I serialise per room: a transaction that first takes <code>pg_advisory_xact_lock</code> on the room key (or <code>FOR UPDATE</code> on the room row). The second request waits, then its overlap query sees the new row and it gets a 409 with the clashing time. Behind that, an exclusion constraint holds the invariant even for code paths that forget the lock.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Why not <code>SELECT … FOR UPDATE</code> the overlapping bookings?</div>
  <div class="qa-answer">
    <p>The dangerous case is when there are <em>no</em> overlapping rows — nothing to lock, so both transactions proceed (the phantom problem). Lock something that always exists and represents the resource — the room row or an advisory key — or let a constraint or SERIALIZABLE's predicate locks catch it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Exclusion constraint or advisory lock — which do you ship?</div>
  <div class="qa-answer">
    <p>Both. The <strong>lock</strong> serialises the whole use case, so multi-row checks (policies, idempotency, series expansion) run safely and return a precise error. The <strong>constraint</strong> is the invariant for every writer, including scripts and future services, surfacing as SQLSTATE 23P01 → 409. If I could keep only one on Postgres, the constraint — correctness should not depend on everyone remembering a lock. On MySQL: <code>FOR UPDATE</code> on the room row, or a slot-claim table with a unique index.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Model check-in, auto-release, extend and end early.</div>
  <div class="qa-answer">
    <p>Status enum plus transition table: PENDING → CONFIRMED → CHECKED_IN → COMPLETED, exits CANCELLED and NO_SHOW. A scheduled sweeper marks CONFIRMED bookings NO_SHOW after start + grace, which drops them from the blocking set. End early → COMPLETED with a trimmed slot. Extend grows the slot, so it needs the room guard and an overlap check excluding itself. Only operations that <em>grow</em> occupied time lock; the rest use optimistic versions — which is also how "late check-in vs sweeper" resolves cleanly.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How would you add recurring bookings?</div>
  <div class="qa-answer">
    <p>Store the rule on a series and materialise occurrences as ordinary bookings with a <code>series_id</code>, bounded by a count or rolling horizon. Expand in the room's IANA zone with calendar math so 10:00 stays 10:00 across DST. Check and insert all occurrences in one guarded transaction under a product-chosen policy (all-or-nothing or skip-and-report). Edits support this / this-and-following (split into a new series) / all. Materialising keeps the constraint, search and tablet view unchanged.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you make "a free room for 6 people at 3 p.m." fast?</div>
  <div class="qa-answer">
    <p>One query: filter rooms by capacity and amenities, anti-join blocking bookings with <code>NOT EXISTS (… during &amp;&amp; tstzrange($1, $2))</code> on the GiST index, order by capacity ascending for best fit — milliseconds for 2,000 rooms. If reads dominate further, cache each room's day schedule (invalidated by booking events); per room a sorted interval list with binary search gives O(log n) checks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Optimistic or pessimistic concurrency here?</div>
  <div class="qa-answer">
    <p>Pessimistic for creating or growing bookings: the conflict is about <em>absent</em> rows and contention is bursty (9 a.m. Monday), so retries would storm. Optimistic (<code>UPDATE … WHERE version = $v</code>) for transitions on an existing booking — cancel, check-in, end early, no-show — where conflicts are rare and losing cleanly is correct.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you make booking idempotent for clients on flaky networks?</div>
  <div class="qa-answer">
    <p>The client sends an <code>Idempotency-Key</code> per user intent and reuses it on retries. The service returns the existing booking for a seen key, re-checks inside the room guard for concurrent retries, and stores the key in a <code>UNIQUE</code> column. Events are published only when a booking was actually created, so a replay sends no second confirmation.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. FDE scenario: "we see double-bookings in production, but your code checks for overlaps".</div>
  <div class="qa-answer">
    <p>Quantify first: an overlap self-join on their data (<code>a.room_id = b.room_id AND a.id &lt; b.id AND a.during &amp;&amp; b.during</code>, blocking statuses only) listing creation times and the writer of each row. Usual causes: the deployment scaled out while the lock was in-process; a second writer (calendar sync, admin import) bypasses the service; retries without idempotency; zone bugs making "different" local times the same instant. Short term: notify affected organisers and resolve duplicates by the customer's rule. Fix: serialise in the database and add the exclusion constraint — after cleaning existing overlaps, since it cannot be created over violating rows — plus a concurrency integration test so it cannot regress.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. FDE scenario: "rooms show as busy but nobody is in them".</div>
  <div class="qa-answer">
    <p>Ghost meetings — forgotten bookings or recurring series whose owners left. Pull no-show rates per room and per series. If check-in exists, verify the sweeper is actually running (a silently dead cron is common) and the grace window matches their policy; if not, enable check-in on the tablets with auto-release, and cancel a series after K consecutive no-shows with notice to the organiser. Show utilisation before and after.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You use half-open intervals and the two-comparison overlap rule.</li>
    <li>You name the check-then-insert race before being asked, and explain why READ COMMITTED does not fix it.</li>
    <li>You know why locking the overlapping rows fails (phantoms) and lock the room or a key instead.</li>
    <li>You layer domain check, per-room serialisation and a DB constraint — and explain each one's job.</li>
    <li>You model the lifecycle as an enum + transition table and only lock operations that grow occupied time.</li>
    <li>You treat time zones properly: UTC instants, IANA zones for wall-clock rules, server clock as truth.</li>
    <li>You make writes idempotent and publish events only after commit.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Write the Postgres exclusion constraint that prevents double-booking. What if your database doesn't have one?</div>
  <div class="qa-answer">
    <p>Store the slot as a <code>tstzrange</code> (half-open <code>[)</code> by default), enable <code>btree_gist</code> so a GiST index can handle the plain equality on <code>room_id</code>, and filter the constraint to blocking statuses — without the <code>WHERE</code>, a cancelled booking blocks its slot forever. Violations raise SQLSTATE 23P01, which you map to HTTP 409.</p>
    <pre><code class="language-sql">CREATE EXTENSION IF NOT EXISTS btree_gist;
-- inside CREATE TABLE bookings (... during tstzrange NOT NULL, status text NOT NULL ...)
CONSTRAINT no_double_booking EXCLUDE USING gist (
  room_id WITH =,
  during  WITH &amp;&amp;
) WHERE (status IN ('PENDING','CONFIRMED','CHECKED_IN'))</code></pre>
    <p>Without exclusion constraints (MySQL, for example): <code>SELECT … FOR UPDATE</code> on the room row so every booker for that room serialises on it, or a <strong>slot-claim table</strong> on a fixed grid with <code>PRIMARY KEY (room_id, slot_start)</code>, where a 10:00–11:00 booking inserts four 15-minute rows and any overlap hits a unique violation and rolls back the transaction. An optimistic room version (<code>UPDATE rooms SET version = version + 1 WHERE id = $1 AND version = $2</code>) also works.</p>
  </div>
</div>
` },

  ]
});
