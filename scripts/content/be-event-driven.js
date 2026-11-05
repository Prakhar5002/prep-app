window.PREP_SITE.registerTopic({
  id: "be-event-driven",
  module: "backend",
  title: "Event-Driven Systems & Async Processing",
  estimatedReadTime: "40 min",
  tags: ["event-driven","async","event-sourcing","cdc","webhooks","eventual-consistency","idempotency","choreography","orchestration"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Publish <strong>past-tense facts</strong> through an outbox, let consumers react independently and <strong>safely twice and out of order</strong>, and design the API and UX for the gap between "accepted" and "done".</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Event</strong> = past-tense fact, 0..n consumers, can't be rejected. <strong>Command</strong> = intent to one owner, can fail. Avoid "passive-aggressive events" and CRUD <code>*.updated</code> events.</li>
    <li><strong>Fowler's four:</strong> event notification (thin), event-carried state transfer (fat), event sourcing, CQRS — different trade-offs, often confused.</li>
    <li><strong>Why:</strong> availability doesn't multiply (0.999<sup>4</sup> ≈ 99.6%), slow work leaves the request path, new consumers without producer changes, load levelling, replayable history.</li>
    <li><strong>Envelope:</strong> CloudEvents-style id, type, source, subject, time + tenant, aggregate version, correlation id, causation id, traceparent. Claim-check large payloads to S3.</li>
    <li><strong>Versioning:</strong> additive only, tolerant readers, registry + CI compatibility checks, breaking change = new type + dual-publish, upcasters for stored events.</li>
    <li><strong>Choreograph</strong> between contexts; <strong>orchestrate</strong> processes with outcomes, deadlines and compensations (state table, Step Functions, Temporal).</li>
    <li><strong>Async API:</strong> <code>202</code> + <code>Location</code> job resource + <code>Retry-After</code>, idempotent POST; webhooks signed with HMAC over id.timestamp.rawBody, 5-min replay window, per-endpoint queues, SSRF guard; push for own apps.</li>
    <li><strong>Idempotency:</strong> inbox in the same transaction; version-gated upsert (handles duplicates and reordering); provider idempotency keys for external effects.</li>
    <li><strong>Ordering:</strong> only per key; key by the invariant (roomId, not tenantId); retries reorder unless the key blocks; consumers order-tolerant via versions and tombstones.</li>
    <li><strong>Read-your-writes:</strong> return the write, read primary after write, consistency token (LSN/version), sync projection for the critical view, honest pending UX.</li>
    <li><strong>Event sourcing:</strong> append with expected version (PK on stream + version), fold to state, projections + snapshots; costs: schemas forever, crypto-shredding for GDPR.</li>
    <li><strong>CDC:</strong> Debezium on the WAL; best for relaying the outbox; watch replication-slot WAL retention (<code>max_slot_wal_keep_size</code>).</li>
    <li><strong>Sequences commit out of order</strong> — pollers reading <code>position &gt; last</code> can skip rows; use a safety lag, single writer or CDC.</li>
    <li><strong>Observability:</strong> correlation + causation ids, trace context in headers, consumer lag, end-to-end latency, DLQ depth with an owner.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Assuming events arrive once and in order.</strong> A consumer that increments counters or applies "cancel" only if the booking exists will double-count on redelivery and resurrect cancelled meetings when a retry reorders events. Fix: dedupe by event id, gate every state change on the aggregate version (version-gated upsert), and keep tombstones so late, older events are discarded.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Events are facts and commands are requests — I publish facts through an outbox in the same transaction as the change, so there's no dual write, and consumers react independently."</div>
  <div class="revision-say">"Every consumer is idempotent and order-tolerant: I dedupe on the event id and only apply an event if its aggregate version is newer than what I have."</div>
  <div class="revision-say">"For slow work I return 202 with a job resource, then notify by webhook or push — and I design the UI for the consistency window with read-your-writes, rather than pretending it isn't there."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Vocabulary</h3>
<table>
  <thead><tr><th>Term</th><th>Meaning</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Event</td><td>Immutable record that something happened, past tense</td><td><code>booking.cancelled</code></td></tr>
    <tr><td>Command</td><td>Request for a specific owner to do something; may be rejected</td><td><code>CancelBooking</code>, <code>SendEmail</code></td></tr>
    <tr><td>Query</td><td>Request for data; no side effects</td><td><code>GET /rooms/R12/availability</code></td></tr>
    <tr><td>Producer / consumer</td><td>Who publishes / who reacts</td><td>booking-svc / notification-svc</td></tr>
    <tr><td>Topic / stream</td><td>Named channel of events, often partitioned by key</td><td><code>bookings</code> partitioned by <code>roomId</code></td></tr>
    <tr><td>Projection / read model</td><td>A view derived by consuming events</td><td><code>room_status_view</code> for tablets</td></tr>
    <tr><td>Process manager</td><td>Stateful coordinator that reacts to events and issues commands</td><td>Paid-room checkout flow</td></tr>
  </tbody>
</table>

<h3>"Event-driven" means four different things</h3>
<p>Martin Fowler's taxonomy is the fastest way to sound precise in an interview:</p>
<table>
  <thead><tr><th>Pattern</th><th>What travels</th><th>Gain</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td>Event notification</td><td>A thin "X changed" with an id</td><td>Loose coupling; tiny events</td><td>Consumers call back for data → load + race conditions</td></tr>
    <tr><td>Event-carried state transfer</td><td>The changed state itself</td><td>Consumers keep local copies; no callbacks; producer can be down</td><td>Bigger payloads; data (and PII) replicated; schema coupling</td></tr>
    <tr><td>Event sourcing</td><td>Events <em>are</em> the source of truth</td><td>Full history, audit, replay, new projections from the past</td><td>Schema evolution forever; projections needed for queries</td></tr>
    <tr><td>CQRS</td><td>Separate write and read models (often fed by events)</td><td>Read models shaped for each screen</td><td>Eventual consistency between them; more moving parts</td></tr>
  </tbody>
</table>

<h3>Why go event-driven</h3>
<ul>
  <li><strong>Availability doesn't multiply.</strong> A request that synchronously calls four services at 99.9% each is at most ~99.6% available (0.999<sup>4</sup>) — roughly 35 hours of downtime a year instead of ~9. With events, the booking commits even if the email service is down; the email goes out when it recovers.</li>
  <li><strong>Latency moves off the request path.</strong> Transcribing a call, syncing to Google/Microsoft calendars or generating a PDF shouldn't hold an HTTP request open for 30 seconds.</li>
  <li><strong>Extensibility.</strong> A new consumer (analytics, a customer's webhook, an audit pipeline) subscribes without changing the producer.</li>
  <li><strong>Load levelling.</strong> A queue absorbs a 10× spike and lets workers drain at a sustainable rate.</li>
  <li><strong>History.</strong> A retained event log lets you rebuild a broken read model or backfill a new one.</li>
</ul>

<h3>Why not (and when not)</h3>
<ul>
  <li><strong>The user needs the answer now.</strong> "Is this room free at 3 pm?" is a query; don't route it through a queue.</li>
  <li><strong>An invariant spans the change.</strong> "No two confirmed bookings overlap in one room" must be enforced in one transaction (or one aggregate), not by eventual consensus between services.</li>
  <li><strong>Debuggability cost.</strong> Flows become invisible without correlation ids, tracing and lag metrics.</li>
  <li><strong>Small team, single service.</strong> In-process domain events plus a job queue give most of the benefit without a broker, schemas and on-call for Kafka.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Newspaper vs phone call</h3>
<p>A <strong>command</strong> is a phone call: you ring a specific person, ask for something, and they can say no. An <strong>event</strong> is a newspaper: the publisher prints what happened, has no idea who reads it, and readers act at their own pace — some today, one next week after a holiday. The publisher can't un-print yesterday's paper; it can only print a correction (a compensating event).</p>

<h3>Synchronous chain vs event flow</h3>
<div class="diagram">
<pre>
 SYNCHRONOUS (latencies add, availabilities multiply)
 client ─► booking-svc ─► notify-svc ─► calendar-svc ─► analytics-svc
           200 ms         + 300 ms       + 900 ms         + 100 ms   = 1.5 s, fails if any fails

 EVENT-DRIVEN (respond after commit; consumers proceed independently)
 client ─► booking-svc ── tx { booking row + outbox row } ──► 201 Created (≈ 40 ms)
                 │
          outbox relay / CDC
                 ▼
         ┌───────────────┐   booking.cancelled (key = roomId)
         │ broker/stream │──────────────┬──────────────┬───────────────┐
         └───────────────┘              ▼              ▼               ▼
                                  notify-svc     calendar-sync    room-status projection
                                  (email/push)   (Graph/Google)   → tablets via WebSocket
</pre>
</div>

<h3>The consistency window</h3>
<div class="diagram">
<pre>
 t=0      booking committed in Postgres (source of truth)       ← API already returned 201
 t+15ms   outbox relay publishes booking.created
 t+40ms   room-status projection updated  → tablet shows "Busy"
 t+2s     calendar-sync writes to Microsoft Graph (rate-limited, retried)
 t+5min   analytics warehouse batch load

 Every reader between t=0 and its own "updated" moment sees the OLD state.
 Designing for that window is the job — not pretending it doesn't exist.
</pre>
</div>

<h3>Three clocks</h3>
<ul>
  <li><strong>Event time</strong> — when it happened in the producer (<code>occurredAt</code>).</li>
  <li><strong>Ingestion / publish time</strong> — when the broker accepted it.</li>
  <li><strong>Processing time</strong> — when a consumer handled it (possibly hours later on a replay).</li>
</ul>
<p>Never order by processing time, and be careful ordering by event time across producers (clock skew). Order by a <strong>per-aggregate version</strong> assigned by the single writer of that aggregate.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Event-driven means event sourcing." Most event-driven systems store current state in normal tables and publish events about changes (via an outbox). Event sourcing is the much bigger commitment of making the event log <em>the</em> database. You can do either without the other.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Events vs commands</h3>
<table>
  <thead><tr><th></th><th>Event</th><th>Command</th></tr></thead>
  <tbody>
    <tr><td>Tense / name</td><td>Past: <code>booking.cancelled</code></td><td>Imperative: <code>CancelBooking</code>, <code>SendSms</code></td></tr>
    <tr><td>Addressed to</td><td>Nobody in particular — 0..n subscribers</td><td>Exactly one owner (a queue it consumes)</td></tr>
    <tr><td>Can be rejected?</td><td>No — it already happened</td><td>Yes — validation, permissions, business rules</td></tr>
    <tr><td>Coupling</td><td>Producer doesn't know consumers</td><td>Sender knows the receiver's capability</td></tr>
    <tr><td>Typical transport</td><td>Topic / stream / event bus (fan-out)</td><td>Point-to-point queue</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>Domain vs integration events:</strong> domain events are internal to a service and may change freely; integration events are a published contract other teams depend on. Don't leak every internal event onto the shared bus — that turns refactors into cross-team migrations.</li>
  <li><strong>Avoid CRUD events</strong> like <code>booking.updated</code> carrying the whole row: consumers can't tell whether it was rescheduled, renamed or cancelled. Name the business fact.</li>
  <li><strong>Passive-aggressive commands</strong> — an "event" like <code>email.should_be_sent</code> that only one service is expected to handle — are commands in disguise. Make it a command on that service's queue.</li>
</ul>

<h3>2. Designing the event</h3>
<p>Use one envelope for every event. CloudEvents (a CNCF spec) standardises the core attributes; add the ids you need for tracing.</p>
<pre><code class="language-ts">export interface EventEnvelope&lt;TType extends string, TData&gt; {
  specversion: '1.0';
  id: string;                 // unique per event — the consumer's dedupe key
  type: TType;                // 'com.example.booking.cancelled.v1'
  source: string;             // '/services/booking'
  subject: string;            // aggregate id: 'booking/bk_91'
  time: string;               // event time, ISO 8601
  datacontenttype: 'application/json';
  // extensions
  tenantid: string;
  aggregateversion: number;   // per-aggregate, monotonically increasing
  correlationid: string;      // the whole business flow (e.g. originating request id)
  causationid?: string;       // the event/command that directly caused this one
  traceparent?: string;       // W3C trace context for distributed tracing
  data: TData;
}

export type BookingCancelledV1 = EventEnvelope&lt;'com.example.booking.cancelled.v1', {
  bookingId: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
  cancelledBy: { type: 'user' | 'system' | 'device'; id: string };
  reason?: 'user_request' | 'no_show' | 'room_closed';
}&gt;;</code></pre>
<table>
  <thead><tr><th>Payload style</th><th>Pros</th><th>Cons</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td>Thin (ids only)</td><td>Tiny; no PII spread; schema rarely changes</td><td>Every consumer calls back → load spike; by the time it calls, state may have changed again</td><td>Consumers need the very latest state anyway; sensitive data</td></tr>
    <tr><td>Fat (state transfer)</td><td>Consumers self-sufficient; works when producer is down</td><td>Larger messages; replicated PII; more schema surface</td><td>Projections, search indexing, integrations</td></tr>
    <tr><td>Delta + version (middle)</td><td>What changed + enough context + version</td><td>Needs discipline about "enough"</td><td>Default for most integration events</td></tr>
  </tbody>
</table>
<p>For large payloads (a transcript, a report) use the <strong>claim-check pattern</strong>: store the blob in S3 and put the key in the event. Brokers cap message size (commonly in the hundreds of KB to around 1 MB — check your broker's current limits).</p>

<h3>3. Schemas and versioning</h3>
<table>
  <thead><tr><th>Compatibility</th><th>Guarantee</th><th>Allows</th><th>Deploy order</th></tr></thead>
  <tbody>
    <tr><td>Backward</td><td>New consumers can read old events</td><td>Add optional fields; remove fields consumers default</td><td>Consumers first</td></tr>
    <tr><td>Forward</td><td>Old consumers can read new events</td><td>Add fields (old readers ignore them)</td><td>Producers first</td></tr>
    <tr><td>Full</td><td>Both</td><td>Add/remove optional fields only</td><td>Any order</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>Rules that keep you safe:</strong> only add optional fields; never rename, retype or change the meaning of a field; consumers are <strong>tolerant readers</strong> (ignore unknown fields, don't fail on new enum values — map to "unknown").</li>
  <li><strong>Breaking change = new event type</strong> (<code>…cancelled.v2</code>). Dual-publish v1 and v2 during migration, move consumers over, then retire v1 with a date.</li>
  <li><strong>Stored events never change</strong> (replays, event sourcing): convert old shapes on read with <strong>upcasters</strong>.</li>
  <li><strong>Governance:</strong> JSON Schema / Avro / Protobuf in a registry (Confluent Schema Registry, AWS Glue Schema Registry, EventBridge's schema registry) with compatibility checks in CI; document channels with AsyncAPI; consumer-driven contract tests (Pact supports message contracts). The Avro walkthrough is in <a href="#/topic/be-queues">be-queues</a>.</li>
</ul>
<pre><code class="language-ts">import { z } from 'zod';

const CancelledV1 = z.object({ bookingId: z.string(), roomId: z.string(), reason: z.string().optional() }).passthrough();
const CancelledV2 = z.object({
  bookingId: z.string(), roomId: z.string(),
  reason: z.enum(['user_request', 'no_show', 'room_closed', 'unknown']),
  cancelledBy: z.object({ type: z.enum(['user', 'system', 'device']), id: z.string() }),
}).passthrough();                                         // tolerant reader: keep unknown fields

// Upcaster: every consumer works with the latest shape.
export function readCancelled(e: { type: string; data: unknown }) {
  if (e.type.endsWith('.v2')) return CancelledV2.parse(e.data);
  const v1 = CancelledV1.parse(e.data);
  const known = ['user_request', 'no_show', 'room_closed'] as const;
  return {
    ...v1,
    reason: (known as readonly string[]).includes(v1.reason ?? '') ? (v1.reason as typeof known[number]) : 'unknown',
    cancelledBy: { type: 'system' as const, id: 'legacy-v1' },
  };
}</code></pre>

<h3>4. Choreography vs orchestration</h3>
<table>
  <thead><tr><th></th><th>Choreography</th><th>Orchestration</th></tr></thead>
  <tbody>
    <tr><td>Control</td><td>Each service reacts to events and emits its own</td><td>A coordinator (process manager / workflow) issues commands and waits for results</td></tr>
    <tr><td>Coupling</td><td>Loose; no central owner</td><td>Coordinator knows every step</td></tr>
    <tr><td>Visibility</td><td>The flow exists only in your head (and traces)</td><td>One place shows "booking bk_91 is at step 3, waiting for payment"</td></tr>
    <tr><td>Timeouts / compensation</td><td>Scattered across services</td><td>Centralised, explicit</td></tr>
    <tr><td>Change</td><td>Adding a reaction is easy; changing a sequence touches many services</td><td>Changing the sequence is one deploy</td></tr>
    <tr><td>Tools</td><td>Any broker</td><td>A state table + handlers, AWS Step Functions, Temporal</td></tr>
  </tbody>
</table>
<p>Practical rule: <strong>choreograph across bounded contexts</strong> (booking doesn't need to know analytics exists) and <strong>orchestrate a business process with an outcome, a deadline and compensations</strong> (checkout, onboarding, a paid-room booking). Saga compensation basics are in <a href="#/topic/be-queues">be-queues</a>; Example 5 below builds a process manager.</p>

<h3>5. Async request patterns</h3>
<h4>a. 202 Accepted + a job resource</h4>
<pre><code class="language-text">POST /v1/transcriptions              Idempotency-Key: 6c1e…
{ "recordingKey": "uploads/ten_acme/rec_77.m4a" }

HTTP/1.1 202 Accepted
Location: /v1/jobs/job_5Q
Retry-After: 5
{ "id": "job_5Q", "status": "queued", "statusUrl": "/v1/jobs/job_5Q" }

GET /v1/jobs/job_5Q   →  200 { "status": "running", "progress": 0.4 }
GET /v1/jobs/job_5Q   →  200 { "status": "succeeded", "result": { "transcriptUrl": "/v1/transcripts/tr_9" } }
                           (or "failed" with a machine-readable error code)</code></pre>
<ul>
  <li>Make the <code>POST</code> idempotent (an <code>Idempotency-Key</code> unique per tenant), so a client retry doesn't start two expensive jobs.</li>
  <li>Return <code>Retry-After</code> and honour it client-side; use backoff for long jobs; give job records a retention TTL.</li>
  <li>Expose cancellation (<code>DELETE /v1/jobs/:id</code> or <code>POST …/cancel</code>) when work is expensive.</li>
</ul>

<h4>b. Webhooks (server-to-server push)</h4>
<ul>
  <li><strong>Payload:</strong> the event envelope, with a stable event <code>id</code> the receiver dedupes on.</li>
  <li><strong>Signature:</strong> HMAC-SHA256 over <code>id.timestamp.rawBody</code> with a per-endpoint secret, sent in headers (the Standard Webhooks convention is <code>webhook-id</code>, <code>webhook-timestamp</code>, <code>webhook-signature</code>). Receivers verify with a constant-time compare and reject timestamps older than ~5 minutes (replay protection). Support two active secrets during rotation.</li>
  <li><strong>Delivery:</strong> at-least-once, exponential backoff over hours to days, a per-endpoint queue so one slow customer doesn't delay others, auto-disable after sustained failure with an email, a delivery log and a "replay" button.</li>
  <li><strong>Security:</strong> customer-supplied URLs are an SSRF vector — resolve DNS and block private, loopback and link-local ranges (including cloud metadata addresses) at send time.</li>
  <li><strong>Ordering:</strong> not guaranteed. Include <code>aggregateversion</code> and a link to fetch current state, and say so in the docs.</li>
</ul>

<h4>c. Push to apps</h4>
<p>For browsers and mobile apps, notify completion over a WebSocket or SSE channel, or a push notification when backgrounded — see <a href="#/topic/api-websockets">WebSockets Deep</a> and <a href="#/topic/api-realtime">Realtime Decision Tree</a>. Push is a hint; the job resource stays the source of truth.</p>

<table>
  <thead><tr><th>Pattern</th><th>Best for</th><th>Weakness</th></tr></thead>
  <tbody>
    <tr><td>Polling a job resource</td><td>Simple clients, scripts, CLIs, behind strict firewalls</td><td>Latency vs request volume trade-off</td></tr>
    <tr><td>Webhooks</td><td>B2B integrations, server-to-server</td><td>Receiver must be reachable, verify signatures, dedupe; ordering not guaranteed</td></tr>
    <tr><td>WebSocket / SSE / push</td><td>Your own web and mobile apps</td><td>Connection management; must fall back to polling on reconnect</td></tr>
  </tbody>
</table>

<h3>6. Idempotent consumers — beyond the dedupe table</h3>
<p>The processed-messages table pattern is in <a href="#/topic/be-queues">be-queues</a>. Three more techniques interviewers probe:</p>
<pre><code class="language-sql">-- (a) Version-gated upsert: handles duplicates AND out-of-order events in one statement.
INSERT INTO room_status_view (tenant_id, room_id, status, booking_id, ends_at, version, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, now())
ON CONFLICT (tenant_id, room_id) DO UPDATE
SET status = EXCLUDED.status, booking_id = EXCLUDED.booking_id, ends_at = EXCLUDED.ends_at,
    version = EXCLUDED.version, updated_at = now()
WHERE room_status_view.version &lt; EXCLUDED.version;      -- stale or duplicate → no-op</code></pre>
<ul>
  <li><strong>(b) Inbox in the same transaction:</strong> insert <code>(consumer_name, event_id)</code> into an inbox table <em>in the same transaction</em> as the state change; a unique-violation means "already done", so roll back and ack.</li>
  <li><strong>(c) External side effects:</strong> you can't put an email or a payment in your DB transaction. Derive the provider's idempotency key from the event id (e.g. Stripe's <code>Idempotency-Key</code> header) so a retried consumer can't double-charge, and for providers without one, record "sent" after success and accept the rare duplicate on a crash in between — that's at-least-once, documented.</li>
</ul>

<h3>7. Ordering</h3>
<ul>
  <li><strong>Order is only ever per key</strong>: per Kafka partition, per SQS FIFO message group, per Kinesis shard. Across keys there is no order. (Strategy table in <a href="#/topic/be-queues">be-queues</a>; AWS specifics in <a href="#/topic/cloud-sqs">SQS (+ SNS / EventBridge)</a>.)</li>
  <li><strong>Pick the key by the invariant.</strong> If tablets need room status in order, key by <code>roomId</code>; if a booking's lifecycle must be ordered, key by <code>bookingId</code>. Keying by <code>tenantId</code> gives you order you don't need and a hot partition you don't want.</li>
  <li><strong>Retries break order</strong> unless the transport blocks the key: FIFO groups and Kafka partitions block behind a failing message (head-of-line blocking); standard queues happily deliver the next one. Either accept blocking or make consumers order-tolerant.</li>
  <li><strong>Order-tolerant consumers</strong> are the robust default: carry <code>aggregateversion</code>, apply only newer versions (the upsert above), and for "cancel before create" either store a tombstone ("cancelled at v3") so the late create (v1) is ignored, or park it and retry later.</li>
</ul>

<h3>8. Eventual consistency and read-your-writes</h3>
<table>
  <thead><tr><th>Technique</th><th>How</th><th>Trade-off</th></tr></thead>
  <tbody>
    <tr><td>Return the write</td><td>The <code>POST</code> response contains the created resource; client updates its cache (React Query <code>setQueryData</code>, optimistic UI)</td><td>Only the writer sees it immediately; simplest and usually enough</td></tr>
    <tr><td>Read from the source of truth after writing</td><td>For N seconds after a write (session flag) route that user's reads to the primary, not a replica/projection</td><td>Extra primary load; needs routing logic</td></tr>
    <tr><td>Consistency token</td><td>Write returns a version (or Postgres LSN); reads pass it; the server waits briefly until the projection/replica has caught up, else falls back to the primary</td><td>Precise; more plumbing</td></tr>
    <tr><td>Synchronous projection for the critical view</td><td>Update "my bookings" in the same transaction; everything else async</td><td>Couples one read model to the write path</td></tr>
    <tr><td>Design the UX for it</td><td>"Cancelling…" state, then push/poll for confirmation</td><td>Honest; needs product buy-in</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">// Consistency token with Postgres replicas: write returns the primary's WAL position,
// reads on a replica wait (bounded) until replay has passed it.
export async function createBooking(input: NewBooking) {
  const booking = await primary.tx(async (tx) =&gt; {
    const b = await bookingsRepo.insert(tx, input);
    await outbox.add(tx, 'booking.created', b);
    return b;
  });
  const { lsn } = await primary.one('SELECT pg_current_wal_lsn()::text AS lsn');
  return { booking, consistencyToken: lsn };
}

export async function readAfter(token: string | undefined, sql: string, params: unknown[]) {
  if (!token) return replica.any(sql, params);
  for (let i = 0; i &lt; 5; i++) {
    const { caught_up } = await replica.one(
      'SELECT pg_last_wal_replay_lsn() &gt;= $1::pg_lsn AS caught_up', [token]);
    if (caught_up) return replica.any(sql, params);
    await sleep(20);
  }
  return primary.any(sql, params);   // don't make the user wait: fall back to the primary
}</code></pre>
<p>Also name the weaker guarantees: <strong>monotonic reads</strong> (a user never sees data go backwards — pin them to one replica) and <strong>causal consistency</strong> (if you see the reply, you see the message it replies to).</p>

<h3>9. Event sourcing</h3>
<p>Instead of storing current state and overwriting it, store every state change as an event and derive state by folding them: <code>state = events.reduce(evolve, initial)</code>.</p>
<pre><code class="language-sql">CREATE TABLE events (
  global_position bigint GENERATED ALWAYS AS IDENTITY,
  stream_id       text        NOT NULL,          -- 'booking-bk_91'
  version         int         NOT NULL,          -- 1, 2, 3 … within the stream
  type            text        NOT NULL,
  data            jsonb       NOT NULL,
  metadata        jsonb       NOT NULL DEFAULT '{}',
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (stream_id, version)               -- optimistic concurrency for free
);</code></pre>
<pre><code class="language-ts">type BookingEvent =
  | { type: 'BookingRequested'; data: { roomId: string; startsAt: string; endsAt: string; organizerId: string } }
  | { type: 'BookingConfirmed'; data: {} }
  | { type: 'BookingRescheduled'; data: { startsAt: string; endsAt: string } }
  | { type: 'BookingCancelled'; data: { reason: string } };

type BookingState = { status: 'none' | 'requested' | 'confirmed' | 'cancelled'; roomId?: string; startsAt?: string; endsAt?: string };

const evolve = (s: BookingState, e: BookingEvent): BookingState =&gt; {
  switch (e.type) {
    case 'BookingRequested':   return { status: 'requested', ...e.data };
    case 'BookingConfirmed':   return { ...s, status: 'confirmed' };
    case 'BookingRescheduled': return { ...s, ...e.data };
    case 'BookingCancelled':   return { ...s, status: 'cancelled' };
  }
};

export async function handleCancel(bookingId: string, reason: string) {
  const stream = 'booking-' + bookingId;
  const history = await db.any('SELECT type, data, version FROM events WHERE stream_id = $1 ORDER BY version', [stream]);
  const state = history.reduce((s, e) =&gt; evolve(s, e as BookingEvent), { status: 'none' } as BookingState);
  if (state.status !== 'confirmed') throw new DomainError('not_cancellable');   // decide on current state

  const expectedVersion = history.length;
  try {
    await db.none('INSERT INTO events (stream_id, version, type, data) VALUES ($1, $2, $3, $4)',
      [stream, expectedVersion + 1, 'BookingCancelled', { reason }]);
  } catch (err: any) {
    if (err.code === '23505') throw new ConcurrencyError();  // someone appended first: reload + retry
    throw err;
  }
}</code></pre>
<ul>
  <li><strong>Projections</strong> (read models) are built by consuming the log and can be dropped and rebuilt by replay. <strong>Snapshots</strong> (state every N events) keep long streams fast to load.</li>
  <li><strong>Wins:</strong> complete audit trail, temporal queries ("what did the calendar look like last Tuesday?"), new read models from history, easier debugging of "how did we get here".</li>
  <li><strong>Costs:</strong> every event schema lives forever (upcasters); current-state queries need projections; GDPR erasure in an immutable log needs <strong>crypto-shredding</strong> (encrypt personal data with a per-person key, delete the key); higher learning curve. Use it for domains where history is the product — ledgers, compliance, bookings with dispute trails — not for every CRUD table.</li>
</ul>

<h3>10. Change Data Capture (CDC)</h3>
<p>CDC reads the database's own replication log — Postgres WAL via logical decoding, MySQL binlog — and emits each committed row change as an event. Tools: Debezium (on Kafka Connect or standalone), AWS DMS, DynamoDB Streams for DynamoDB.</p>
<pre><code class="language-json">{
  "name": "booking-outbox",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "plugin.name": "pgoutput",
    "database.hostname": "booking-db.internal",
    "database.port": "5432",
    "database.user": "cdc_reader",
    "database.dbname": "booking",
    "topic.prefix": "booking",
    "table.include.list": "public.outbox",
    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter"
  }
}</code></pre>
<p>(Property names follow Debezium 2.x — check the docs for your version; the database needs <code>wal_level = logical</code>.)</p>
<ul>
  <li><strong>Best use: relay the outbox.</strong> CDC on the <code>outbox</code> table publishes intentional, versioned events with commit-order fidelity and no polling. CDC on business tables leaks your schema and loses intent (an <code>UPDATE … SET status</code> isn't a "cancelled" event).</li>
  <li><strong>Other uses:</strong> keeping search indexes, caches and warehouses in sync; strangler-fig migrations; and, for FDEs, getting events out of a customer's legacy database <em>without changing their application</em>.</li>
  <li><strong>The classic outage:</strong> a logical replication slot holds WAL until its consumer confirms. If the connector is down for a day, WAL accumulates and can fill the primary's disk. Alert on slot lag (<code>pg_replication_slots</code>) and cap it with <code>max_slot_wal_keep_size</code> (Postgres 13+).</li>
  <li>Also plan for the initial snapshot, schema changes, deletes (tombstones) and multi-row transactions arriving as separate change events.</li>
</ul>

<h3>11. Observability for async flows</h3>
<ul>
  <li><strong>Correlation id</strong> on every event and log line in a flow; <strong>causation id</strong> pointing at the direct parent, so you can draw the tree.</li>
  <li><strong>Trace context</strong> (<code>traceparent</code>) propagated through message headers so OpenTelemetry stitches producer and consumer spans together.</li>
  <li><strong>Metrics:</strong> consumer lag (messages and seconds), end-to-end latency (<code>now − time</code>), DLQ depth, handler error rate by event type, redeliveries. More in <a href="#/topic/be-observability">Observability</a>.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Event catalogue for a meeting-room booking platform</h3>
<table>
  <thead><tr><th>Event</th><th>Producer</th><th>Key</th><th>Consumers</th><th>Ordering need</th></tr></thead>
  <tbody>
    <tr><td><code>booking.created.v1</code></td><td>booking-svc</td><td>roomId</td><td>room-status projection, notifications, calendar-sync, analytics</td><td>Per room (tablet status)</td></tr>
    <tr><td><code>booking.cancelled.v2</code></td><td>booking-svc</td><td>roomId</td><td>same + customer webhooks</td><td>Per room</td></tr>
    <tr><td><code>booking.checked_in.v1</code></td><td>booking-svc (from tablet)</td><td>roomId</td><td>room-status, analytics (utilisation)</td><td>Per room</td></tr>
    <tr><td><code>booking.auto_released.v1</code></td><td>no-show job</td><td>roomId</td><td>room-status, notifications</td><td>Per room</td></tr>
    <tr><td><code>room.closed.v1</code></td><td>facilities-svc</td><td>roomId</td><td>booking-svc (cancels future bookings → emits cancellations)</td><td>Per room</td></tr>
    <tr><td><code>SendNotification</code> (command)</td><td>notification rules</td><td>userId</td><td>notification-svc only</td><td>None</td></tr>
  </tbody>
</table>
<p>Calendar sync is the classic messy integration: Microsoft Graph / Google Calendar are rate-limited and occasionally slow, so the consumer retries with backoff, stores the external event id against the booking for idempotent updates, and never blocks the booking itself. Tablet updates flow from the room-status projection over <a href="#/topic/api-websockets">WebSockets</a>. The aggregate rules (overlap detection, double-booking) are in <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>.</p>

<h3>Example 2 — Async job API for call transcription + scoring</h3>
<pre><code class="language-ts">// POST: accept, persist, enqueue via outbox, return 202. Idempotent per (tenant, key).
router.post('/v1/transcriptions', authenticate, async (req, res) =&gt; {
  const p = req.principal!;
  const key = req.header('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'idempotency_key_required' });

  const job = await withTenant(p.tenantId, async (tx) =&gt; {
    const existing = await tx.oneOrNone('SELECT * FROM jobs WHERE tenant_id = $1 AND idempotency_key = $2', [p.tenantId, key]);
    if (existing) return existing;
    const created = await tx.one(
      "INSERT INTO jobs (id, tenant_id, idempotency_key, kind, status, input) VALUES ($1, $2, $3, 'transcription', 'queued', $4) RETURNING *",
      [newId('job'), p.tenantId, key, { recordingKey: req.body.recordingKey }]);
    await outbox.add(tx, 'transcription.requested.v1', { jobId: created.id, recordingKey: req.body.recordingKey },
                     { tenantId: p.tenantId, correlationId: req.id });
    return created;
  });   // a concurrent duplicate hits UNIQUE (tenant_id, idempotency_key): catch 23505 and re-read

  res.status(202).location('/v1/jobs/' + job.id).set('Retry-After', '5').json(toJobDto(job));
});

router.get('/v1/jobs/:id', authenticate, async (req, res) =&gt; {
  const job = await withTenant(req.principal!.tenantId, (tx) =&gt; jobsRepo.find(tx, req.params.id));
  if (!job) return res.status(404).end();
  if (job.status === 'queued' || job.status === 'running') res.set('Retry-After', '10');
  res.json(toJobDto(job));
});

// Worker (SQS / BullMQ consumer). Safe to run twice.
export async function onTranscriptionRequested(evt: EventEnvelope&lt;string, { jobId: string; recordingKey: string }&gt;) {
  const claimed = await db.oneOrNone(
    "UPDATE jobs SET status = 'running', attempts = attempts + 1, started_at = now() " +
    "WHERE id = $1 AND status IN ('queued', 'running') RETURNING id", [evt.data.jobId]);
  if (!claimed) return;                                   // already succeeded/failed/cancelled → ack

  const transcriptKey = await transcribe(evt.data.recordingKey, { idempotencyKey: evt.id }); // writes to S3
  const score = await scoreWithLlm(transcriptKey);                                          // rubric scoring

  await db.tx(async (tx) =&gt; {
    await tx.none("UPDATE jobs SET status = 'succeeded', result = $2, finished_at = now() WHERE id = $1",
                  [evt.data.jobId, { transcriptKey, score }]);
    await outbox.add(tx, 'transcription.completed.v1', { jobId: evt.data.jobId, score },
                     { tenantId: evt.tenantid, correlationId: evt.correlationid, causationId: evt.id });
  });
  // transcription.completed → webhook dispatcher (customers) + push to the RN app + dashboard projection
}</code></pre>
<p>The AWS-native version of this pipeline (presigned S3 upload → SQS → Lambda) is built out in <a href="#/topic/cloud-sqs">SQS (+ SNS / EventBridge)</a>.</p>

<h3>Example 3 — Signing and verifying webhooks</h3>
<pre><code class="language-ts">import { createHmac, timingSafeEqual } from 'node:crypto';

// Sender
export function signWebhook(secret: string, id: string, timestamp: number, rawBody: string) {
  const sig = createHmac('sha256', secret).update(id + '.' + timestamp + '.' + rawBody).digest('base64');
  return { 'webhook-id': id, 'webhook-timestamp': String(timestamp), 'webhook-signature': 'v1,' + sig };
}

// Receiver (the customer's side — what you document and give them as sample code)
app.post('/hooks/bookings', express.raw({ type: 'application/json' }), async (req, res) =&gt; {
  const id = req.header('webhook-id') ?? '';
  const ts = Number(req.header('webhook-timestamp'));
  const presented = (req.header('webhook-signature') ?? '').split(' ');   // may carry several during rotation
  const rawBody = req.body.toString('utf8');                               // verify the RAW bytes, not re-serialised JSON

  if (!id || !Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) &gt; 300) return res.status(400).end();
  const expected = Buffer.from('v1,' + createHmac('sha256', SECRET).update(id + '.' + ts + '.' + rawBody).digest('base64'));
  const ok = presented.some((s) =&gt; { const b = Buffer.from(s); return b.length === expected.length &amp;&amp; timingSafeEqual(b, expected); });
  if (!ok) return res.status(401).end();

  if (await seenEvents.has(id)) return res.status(200).end();   // duplicate delivery → ack
  await inboundQueue.add('booking-webhook', JSON.parse(rawBody), { jobId: id });   // process async
  await seenEvents.add(id);
  res.status(200).end();                                          // respond fast (well under the sender's timeout)
});</code></pre>

<h3>Example 4 — Order-tolerant projection consumer</h3>
<pre><code class="language-ts">// Feeds room_status_view (tablets + dashboards). Duplicates and out-of-order events are no-ops.
export async function onBookingEvent(evt: EventEnvelope&lt;string, BookingPayload&gt;) {
  const next = deriveRoomStatus(evt);                      // 'busy' | 'free' | 'checked_in' …
  const result = await db.result(UPSERT_ROOM_STATUS_IF_NEWER, [
    evt.tenantid, evt.data.roomId, next.status, next.bookingId, next.endsAt, evt.aggregateversion,
  ]);
  if (result.rowCount === 0) {
    metrics.increment('projection.stale_event_skipped', { type: evt.type });
    return;
  }
  await realtime.publish('room:' + evt.data.roomId, { type: 'room.status', ...next, version: evt.aggregateversion });
}
// Note: aggregateversion here must be per ROOM if the projection is keyed by room.
// If events carry the booking's version instead, keep a per-booking version map, not one per room.</code></pre>

<h3>Example 5 — Process manager (orchestration) for a paid room</h3>
<pre><code class="language-text">States:   HOLD_REQUESTED → HELD → PAYMENT_PENDING → CONFIRMED
                              ↘ (payment failed / 10-min deadline) → RELEASED

Event in                  Current state      Command out                 Next state
───────────────────────── ────────────────── ─────────────────────────── ────────────────
checkout.started          —                  HoldSlot(room, slot)        HOLD_REQUESTED
slot.held                 HOLD_REQUESTED     CreatePaymentIntent(amount) PAYMENT_PENDING
slot.hold_rejected        HOLD_REQUESTED     NotifyUser(slot taken)      RELEASED
payment.succeeded         PAYMENT_PENDING    ConfirmBooking(hold)        CONFIRMED
payment.failed            PAYMENT_PENDING    ReleaseSlot(hold)           RELEASED
deadline reached (sweep)  HELD | PAYMENT_*   ReleaseSlot + CancelIntent  RELEASED
payment.succeeded         RELEASED           RefundPayment               RELEASED   ← late event!</code></pre>
<pre><code class="language-ts">// One row per process; transitions are compare-and-set on (state, version).
export async function onPaymentSucceeded(evt: EventEnvelope&lt;string, { checkoutId: string; paymentId: string }&gt;) {
  await db.tx(async (tx) =&gt; {
    if (!(await inbox.tryRecord(tx, 'checkout-pm', evt.id))) return;          // dedupe
    const pm = await tx.oneOrNone('SELECT * FROM checkout_processes WHERE id = $1 FOR UPDATE', [evt.data.checkoutId]);
    if (!pm) return;
    if (pm.state === 'PAYMENT_PENDING') {
      await tx.none("UPDATE checkout_processes SET state = 'CONFIRMED', version = version + 1 WHERE id = $1", [pm.id]);
      await commands.send(tx, 'booking-svc', { type: 'ConfirmBooking', holdId: pm.hold_id, causationId: evt.id });
    } else if (pm.state === 'RELEASED') {
      await commands.send(tx, 'payments-svc', { type: 'RefundPayment', paymentId: evt.data.paymentId, reason: 'hold_expired' });
    }
  });
}
// A sweeper runs every 30 s: SELECT … WHERE state IN ('HELD','PAYMENT_PENDING') AND deadline_at &lt; now()
// FOR UPDATE SKIP LOCKED → ReleaseSlot + CancelPaymentIntent → RELEASED.</code></pre>
<p>The late <code>payment.succeeded</code> after the deadline is exactly the case choreography tends to miss — and why a process with money and deadlines deserves an explicit owner. At scale, Temporal or AWS Step Functions give you this state machine, timers and retries as a managed runtime.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Published, then rolled back</h3>
<p>Publishing to the broker inside the request before the DB commits means consumers can act on a booking that never existed. Publishing after commit means a crash in between loses the event. Both are the dual-write problem — use the outbox (<a href="#/topic/be-queues">be-queues</a>) or CDC on it.</p>

<h3>2. Sequences commit out of order</h3>
<p>Identity/sequence values are assigned at insert, not at commit. A poller reading <code>WHERE global_position &gt; $last</code> can skip position 101 if its transaction commits after 102 was read. Fixes: only read positions older than a small safety lag, track in-flight transaction ids, use a single writer, or let CDC (which reads in commit order) do the relay.</p>

<h3>3. Thin event + callback race</h3>
<p>Consumer receives <code>booking.rescheduled</code> (id only), calls the booking API, and gets a state that has already been rescheduled again — or hits a read replica that hasn't caught up and gets 404. Include the version in the event and fetch "at least version N", or send the state.</p>

<h3>4. Cancel arrives before create</h3>
<p>Different partitions, a retry, or a replay can invert the order. A projection that ignores unknown bookings will later apply the create and show a cancelled meeting as busy. Store tombstones / versions so the late, older event is discarded.</p>

<h3>5. Replays re-trigger side effects</h3>
<p>Rebuilding a projection by replaying 6 months of events must not resend 6 months of emails. Separate pure projections from side-effecting handlers, and give consumers a "rebuild" mode that disables side effects.</p>

<h3>6. Producer-first deploy of a schema change</h3>
<p>A producer starts emitting a new enum value; an old consumer with strict validation rejects every event into the DLQ. Tolerant readers, compatibility checks in CI, and deploy order matching the compatibility mode.</p>

<h3>7. Hot keys</h3>
<p>Partitioning by tenant puts your largest customer's 40% of traffic on one partition and one consumer. Choose finer keys (room, booking) unless the invariant genuinely spans the tenant.</p>

<h3>8. Event loops and cascades</h3>
<p>Service A reacts to B's event by emitting an event B reacts to… and the cascade never ends (or amplifies 10× per hop). Track causation depth, make handlers no-op when nothing actually changed, and alert on unusual fan-out.</p>

<h3>9. Personal data in an immutable log</h3>
<p>A deletion request arrives for a user whose email is in thousands of retained events. Keep PII out of events where possible (ids, not emails), set retention on topics, and use crypto-shredding for event-sourced stores.</p>

<h3>10. Webhook receiver down for days</h3>
<p>Retries eventually give up and the customer silently misses events. Provide a delivery log, a replay endpoint ("redeliver everything since T"), and an events list API (<code>GET /v1/events?since=</code>) so integrations can reconcile.</p>

<h3>11. Noisy-neighbour tenants on a shared queue</h3>
<p>One tenant's bulk import of 200k bookings delays everyone's notifications by an hour. Per-tenant concurrency limits, separate queues for bulk vs interactive work, or fair scheduling across tenant keys.</p>

<h3>12. "Exactly once" inside the broker only</h3>
<p>Kafka transactions can give exactly-once processing for read-process-write <em>within Kafka</em>. The moment the consumer writes to Postgres, calls Stripe or sends an email, you're back to at-least-once plus idempotency.</p>

<h3>13. Clock skew in event times</h3>
<p>Two producers with clocks 2 s apart make "latest by <code>time</code>" wrong. Use event time for analytics windows; use aggregate versions for correctness.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Bug 1 — Dual write</h3>
<pre><code class="language-ts">// BAD — either step can fail independently
await db.bookings.insert(booking);
await broker.publish('booking.created', booking);   // crash here → consumers never hear about it

// GOOD — one transaction; a relay (poller or CDC) publishes later
await db.tx(async (tx) =&gt; {
  await tx.bookings.insert(booking);
  await tx.outbox.insert({ type: 'booking.created.v1', key: booking.roomId, payload: toEvent(booking) });
});</code></pre>

<h3>Bug 2 — Heavy work inside the webhook handler</h3>
<p>The receiver calls three APIs before responding, exceeds the sender's timeout (often 5–30 s), the sender retries, and now the work runs three times concurrently. Verify, dedupe, enqueue, return 2xx — then process.</p>

<h3>Bug 3 — Verifying a re-serialised body</h3>
<p>Parsing JSON and then <code>JSON.stringify</code>-ing it to check the HMAC changes whitespace/key order and fails randomly — so someone disables verification. Verify the raw bytes, with <code>timingSafeEqual</code>, not <code>===</code>.</p>

<h3>Bug 4 — Increment on replay</h3>
<p><code>UPDATE rooms SET bookings_today = bookings_today + 1</code> in a consumer double-counts on every redelivery. Derive counters from source data, or dedupe through an inbox in the same transaction.</p>

<h3>Anti-pattern 5 — CRUD events</h3>
<p><code>booking.updated</code> with the whole row forces every consumer to diff old vs new to guess what happened. Publish business facts: <code>rescheduled</code>, <code>cancelled</code>, <code>checked_in</code>.</p>

<h3>Anti-pattern 6 — Database tables as the public contract</h3>
<p>CDC straight from business tables means renaming a column breaks five downstream teams. Publish from an outbox with an explicit, versioned event schema.</p>

<h3>Anti-pattern 7 — Choreography spaghetti for a critical process</h3>
<p>Checkout spread across six services reacting to each other: nobody can answer "where is order X stuck?", and deadlines/compensations are missing. Give processes with money and timeouts an orchestrator.</p>

<h3>Anti-pattern 8 — Async RPC for user-facing reads</h3>
<p>Request-reply over queues for a screen that needs data now adds latency, timeouts and correlation plumbing for no gain. Queries are synchronous; see the "queue for user-facing reads" anti-pattern in <a href="#/topic/be-queues">be-queues</a>.</p>

<h3>Anti-pattern 9 — Event sourcing by default</h3>
<p>Event-sourcing a settings page or a user profile buys upcasters and projections for no business value. Reserve it for aggregates where history is the requirement.</p>

<h3>Anti-pattern 10 — 202 with nowhere to look</h3>
<p>Returning <code>202 Accepted</code> without a status resource, error details or retention policy leaves clients guessing (and filing tickets). Every 202 needs a <code>Location</code> that tells the whole story, including failure.</p>

<h3>Anti-pattern 11 — No correlation id</h3>
<p>Incident at 2 am: a booking was confirmed but no email went out. Without correlation and causation ids in events and logs, you grep five services by timestamp. Put them in the envelope from day one.</p>

<h3>Anti-pattern 12 — Treating the DLQ as done</h3>
<p>Failed events go to the DLQ and nobody looks. Alarm on DLQ depth, triage with an owner, and make redrive a routine, safe (idempotent) operation.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What's the difference between an event and a command? Give an example of getting it wrong.</div>
  <div class="qa-answer">
    <p>An event is an immutable, past-tense fact — <code>booking.cancelled</code> — published without knowing who listens; consumers can't reject it. A command is an intent addressed to one owner — <code>CancelBooking</code>, <code>SendEmail</code> — which can be validated and refused. Getting it wrong looks like a "passive-aggressive event" such as <code>email.should_be_sent</code>, which really expects exactly one handler to act; making it a command on the notification service's queue makes ownership and failure handling explicit. The opposite mistake is a producer calling each downstream service with commands, which recreates the synchronous coupling events were meant to remove.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Choreography or orchestration — how do you decide?</div>
  <div class="qa-answer">
    <p>Choreography keeps contexts loosely coupled: booking publishes facts and analytics, notifications and calendar sync react without booking knowing they exist. It's ideal for independent reactions. Orchestration is better for a business process with an outcome, ordering, deadlines and compensations — checkout, onboarding, a paid-room booking — because one component owns the state ("waiting for payment, expires at 14:10"), timeouts and compensation, and you can answer "where is this stuck?". I usually choreograph between bounded contexts and orchestrate inside a process, with a state table and handlers or Step Functions/Temporal when timers and retries get complex.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you evolve event schemas without breaking consumers?</div>
  <div class="qa-answer">
    <p>Treat integration events as a public API. Additive changes only: new optional fields, never rename, retype or change meaning. Consumers are tolerant readers — they ignore unknown fields and map unknown enum values to a default. Schemas live in a registry with compatibility checks in CI, and the deploy order follows the compatibility mode. A breaking change gets a new event type (<code>…v2</code>), dual-published while consumers migrate, then v1 is retired on a date. For stored events that are replayed, I use upcasters to convert old shapes on read. Consumer-driven contract tests catch the rest before production.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What is event sourcing, and when would you not use it?</div>
  <div class="qa-answer">
    <p>Event sourcing stores each state change as an event in an append-only stream per aggregate and derives current state by folding those events; writes append with an expected version, which gives optimistic concurrency. Read models are projections built from the stream and can be rebuilt by replay. It shines where history is the product — ledgers, audit-heavy workflows, disputes — and enables temporal queries. I wouldn't use it for CRUD-shaped data, for teams new to the pattern under deadline, or where the queries are mostly ad-hoc on current state, because every event schema lives forever, every query needs a projection, and GDPR erasure needs crypto-shredding. And it's distinct from event-driven architecture — you can publish events from ordinary tables with an outbox.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What is CDC, and how does it relate to the outbox pattern?</div>
  <div class="qa-answer">
    <p>Change Data Capture reads the database's replication log — Postgres WAL through logical decoding, MySQL binlog — and emits committed row changes, typically with Debezium. Combined with the outbox, it replaces the polling relay: the service writes business rows and an outbox row in one transaction, and Debezium streams the outbox inserts to the broker in commit order with low latency. I avoid CDC on raw business tables as a public contract because it leaks schema and loses intent. Operational watch-outs: replication slots retain WAL while the connector is down — I alert on slot lag and set <code>max_slot_wal_keep_size</code> — plus initial snapshots and schema changes. As an FDE, CDC is also how you get events out of a customer's legacy database without touching their app.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. A user creates a booking and the list they're redirected to doesn't show it. Fix it.</div>
  <div class="qa-answer">
    <p>That's a read-your-writes violation: the list reads from a replica or an async projection that hasn't caught up. Options, cheapest first: return the created booking in the POST response and insert it into the client cache (React Query <code>setQueryData</code>) so the UI doesn't depend on the read path; route that user's reads to the primary for a few seconds after a write; or return a consistency token (a version or the Postgres WAL LSN) and have the read wait briefly until the replica/projection passes it, falling back to the primary. If the list is the critical view, update it synchronously in the write transaction. I'd also ask whether the UX can show a "pending" state, because the window never fully disappears with async read models.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Design the API for a job that takes 2–10 minutes (transcribe and score a call).</div>
  <div class="qa-answer">
    <p><code>POST /v1/transcriptions</code> with an <code>Idempotency-Key</code>; in one transaction insert a job row (status <code>queued</code>, unique on tenant + key) and an outbox event; return <code>202 Accepted</code> with <code>Location: /v1/jobs/{id}</code> and <code>Retry-After</code>. Workers consume the event, claim the job with a conditional update so duplicates no-op, write results to S3 and mark the job succeeded or failed with a machine-readable error, emitting <code>transcription.completed</code>. Clients learn completion three ways: poll the job resource (the source of truth), receive a signed webhook (B2B), or a WebSocket/push message (our own apps). Add cancellation, a retention TTL on job records, progress if the work has stages, and DLQ alarms for failures.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. A consumer updates a read model and sends an email. How do you make it safe under redelivery?</div>
  <div class="qa-answer">
    <p>Split the two effects. The read-model update is made idempotent and order-tolerant with a version-gated upsert (<code>ON CONFLICT … DO UPDATE … WHERE version &lt; EXCLUDED.version</code>) or an inbox row in the same transaction. The email can't join a DB transaction, so either use the provider's idempotency key derived from the event id, or record "email sent for event X" in an inbox after sending and accept that a crash between send and record can duplicate one email — documented at-least-once. Better still, make the email a separate command handled by the notification service with its own dedupe, so a projection rebuild never resends mail.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you handle out-of-order events?</div>
  <div class="qa-answer">
    <p>First decide what actually needs order and key by that invariant — room status needs per-room order, so the partition/message-group key is <code>roomId</code>; there's no global order and I don't want one. Then make consumers order-tolerant anyway, because retries and replays reorder events: every event carries a per-aggregate version from the single writer, consumers apply only newer versions, and deletes/cancellations leave tombstones so a late create is discarded. For gaps that matter, the consumer can fetch current state from the source of truth. I avoid ordering by timestamps across producers because of clock skew, and I'm explicit about the head-of-line blocking cost if I choose a FIFO transport.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Design a webhook delivery system for your customers.</div>
  <div class="qa-answer">
    <p>Customers register endpoints and choose event types; each endpoint has a secret (two during rotation). Domain events land in a dispatcher that fans out to per-endpoint delivery queues, so one slow customer can't delay others. Each delivery POSTs the event envelope with id, timestamp and an HMAC-SHA256 signature over id + timestamp + raw body; 2xx is success, anything else retries with exponential backoff and jitter over a day or more, then the endpoint is disabled and the owner emailed. We log every attempt and expose a delivery log, manual replay and an events-since API for reconciliation. We guard against SSRF by blocking private and metadata IP ranges at send time, document that delivery is at-least-once and unordered (dedupe by id, use the version or fetch current state), and ship receiver sample code.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you debug a flow that crosses six services and three queues?</div>
  <div class="qa-answer">
    <p>Make it debuggable before the incident. Every event carries a correlation id (the whole business flow, usually from the originating request) and a causation id (its direct parent), and every log line includes them, so I can pull the whole tree. W3C trace context travels in message headers so OpenTelemetry links producer and consumer spans into one trace. Per consumer I watch lag in messages and seconds, end-to-end latency from event time, error rate by event type, redeliveries and DLQ depth. For the specific incident: find the correlation id from the user's request, follow the tree to where it stops, then check that consumer's DLQ, lag and logs. An event catalogue that lists producers, consumers and keys turns this from archaeology into lookup.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE) A customer integrating with your webhooks says they sometimes get <code>booking.cancelled</code> before <code>booking.created</code>, and sometimes the same event three times — and their system breaks. What do you do?</div>
  <div class="qa-answer">
    <p>Both behaviours are expected with at-least-once, unordered delivery, so the fix is partly their integration and partly our contract. On a call: confirm with our delivery log (event ids, attempts, timestamps) that the duplicates are retries — often because their handler is slow and times out — and that reordering comes from retries. Then help them: verify, dedupe on the event id, enqueue and return 2xx immediately; apply events by <code>aggregateversion</code> or fetch the booking's current state from our API on each event instead of trusting arrival order. On our side, I'd make sure every event carries the version and a link to the resource, improve the docs and sample receiver code, consider per-endpoint ordered delivery by booking id if many customers need it, and offer an events-since endpoint for reconciliation. Then I'd follow up with their engineers until their error rate on our dashboard is flat.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish events from commands, and event-driven from event sourcing.</li>
    <li>You choose choreography vs orchestration by visibility, deadlines and compensations, not fashion.</li>
    <li>You treat event schemas as a public API: additive changes, tolerant readers, versioned types, registry checks.</li>
    <li>You avoid dual writes with an outbox (and know CDC can relay it, and its replication-slot risk).</li>
    <li>You make consumers idempotent <em>and</em> order-tolerant with aggregate versions.</li>
    <li>You design 202 + job resource, signed webhooks and push, and the UX for the consistency window.</li>
    <li>You bake in correlation ids, tracing and lag metrics from day one.</li>
  </ul>
</div>
` },

  ]
});
