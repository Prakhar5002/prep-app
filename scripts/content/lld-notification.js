window.PREP_SITE.registerTopic({
  id: "lld-notification",
  module: "lld",
  title: "Case: Notification Service",
  estimatedReadTime: "40 min",
  tags: ["lld","case-study","notifications","strategy","observer","decorator","retries","backoff","idempotency","rate-limiting","quiet-hours","typescript"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>Accept fast, deliver async, never send twice, never send what the user opted out of</strong> — events in through Observer, one delivery row per channel, workers sending through per-channel Strategies with retries, priorities and rate limits.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>The job:</strong> turn business events (booking cancelled, OTP requested, payment received) into messages on <strong>email, SMS, push and in-app</strong>, respecting preferences and quiet hours, with templates, priorities, retries and rate limits.</li>
    <li><strong>Two halves:</strong> accept (dedupe, channels from template defaults + preferences + available contact points, quiet hours → <code>notBefore</code>, persist, 202) and deliver (claim, re-check, render, send, record). Providers are never called in a producer's request.</li>
    <li><strong>Patterns:</strong> Observer (events → subscribers), Strategy (<code>ChannelSender</code> per channel), Adapter (vendor SDKs), Decorator (rate limit, failover), Registry (channel → sender).</li>
    <li><strong>Dedupe:</strong> deterministic key per business event + <code>UNIQUE (user_id, dedupe_key)</code> + <code>ON CONFLICT DO NOTHING</code>; notification and deliveries inserted in one transaction.</li>
    <li><strong>Claiming:</strong> <code>FOR UPDATE SKIP LOCKED</code> + flip to SENDING with a lease in one statement; expired leases are reclaimable (SQS visibility timeout is the same idea).</li>
    <li><strong>Exactly-once is impossible:</strong> at-least-once + idempotency (delivery id as provider idempotency key, in-app upsert) = <em>effectively once</em>; state the residual duplicate risk.</li>
    <li><strong>Retries:</strong> results not exceptions; 408/429/5xx/timeouts retryable, other 4xx permanent; full jitter <code>rand(0, min(cap, base·2^n))</code>, honour Retry-After, max attempts per priority, FAILED = dead letter.</li>
    <li><strong>Priorities are lanes:</strong> a million-email marketing blast never delays an OTP; CRITICAL bypasses quiet hours and caps, retries fast and expires; LOW is capped, digested or dropped.</li>
    <li><strong>Preferences:</strong> sparse explicit choices over a defaults matrix; SECURITY cannot be disabled; MARKETING needs consent; check at accept <em>and</em> at send.</li>
    <li><strong>Quiet hours:</strong> user's IANA zone, wrap-around windows, interruptive channels only, re-check for DST, combine with <code>expiresAt</code>.</li>
    <li><strong>Rate limits:</strong> per provider account (Decorator, requeue with wait) and per user per channel (fatigue cap); Redis for a fleet.</li>
    <li><strong>Operability:</strong> SUPPRESSED/EXPIRED/FAILED rows keep a reason, so "why didn't I get it?" is one query.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Sending from inside the producer's request or transaction</strong> — the booking API now fails when the email provider does, and a rolled-back transaction still sent the email. Fix: publish an event through an outbox in the same transaction; the notification service accepts it, dedupes on a unique key, and delivers asynchronously with retries.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I split it into an accept side that dedupes, applies preferences and quiet hours and persists one delivery per channel, and a deliver side where workers claim rows with SKIP LOCKED and send through a per-channel strategy."</div>
  <div class="revision-say">"Exactly-once isn't achievable across the provider boundary, so it's at-least-once with idempotency: a unique dedupe key at accept time and the delivery id as the provider's idempotency key."</div>
  <div class="revision-say">"Priorities are physical lanes — OTPs bypass quiet hours and caps, retry fast and expire, so a marketing blast can never delay them."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What the interviewer is testing</h3>
<table>
  <thead><tr><th>Area</th><th>Weak answer</th><th>Strong answer</th></tr></thead>
  <tbody>
    <tr><td>Multi-channel</td><td><code>switch (channel)</code> inside <code>send()</code></td><td><code>ChannelSender</code> Strategy + registry; adding WhatsApp is a new class</td></tr>
    <tr><td>Coupling to producers</td><td><code>BookingService</code> calls <code>emailClient</code> directly</td><td>Producers publish events; subscribers create notification requests</td></tr>
    <tr><td>Reliability</td><td>"Wrap it in try/catch and retry"</td><td>Retryable vs permanent errors, backoff with jitter, max attempts, DLQ, leases</td></tr>
    <tr><td>Duplicates</td><td>Not mentioned</td><td>Dedupe key with a unique index; provider idempotency keys; residual risk stated</td></tr>
    <tr><td>User respect</td><td>Global on/off flag</td><td>Category × channel preferences, consent for marketing, quiet hours in the user's zone, fatigue caps</td></tr>
    <tr><td>Priority</td><td>One queue</td><td>Lanes: OTPs never wait behind a marketing blast</td></tr>
  </tbody>
</table>

<h3>Channels are not interchangeable</h3>
<table>
  <thead><tr><th>Channel</th><th>Cost / speed</th><th>Gotchas</th></tr></thead>
  <tbody>
    <tr><td>Email</td><td>Cheap; seconds to minutes</td><td>Deliverability and sender reputation, bounces and complaints, HTML escaping, unsubscribe links</td></tr>
    <tr><td>SMS</td><td>Paid per segment; seconds</td><td>160 GSM-7 chars per single segment (153 when concatenated), only 70 (67) once any non-GSM character appears; sender/template registration in some countries (e.g. India's DLT); STOP keywords</td></tr>
    <tr><td>Push</td><td>Effectively free; seconds</td><td>Device tokens churn (uninstalls), payloads limited to about 4 KB on APNs/FCM, OS may throttle or delay, user may have disabled notifications</td></tr>
    <tr><td>In-app</td><td>A database row</td><td>Silent; needs read/unread state and pagination; the only channel you fully control</td></tr>
  </tbody>
</table>

<h3>Why it matters for Full Stack and FDE roles</h3>
<p>Every product has one, and it is where integration with outside systems is messiest: customer SMTP relays, their Twilio or SendGrid accounts, push certificates, webhook receipts. A forward-deployed engineer is usually the person asked "why didn't user X get the OTP?" — a design that records <em>why</em> each delivery was sent, suppressed, deferred or failed answers that in one query.</p>

<h3>Where this sits</h3>
<p>Method: <a href="#/topic/lld-framework">LLD Interview Framework</a>. Patterns: <a href="#/topic/lld-patterns">Design Patterns for LLD</a> (Strategy, Observer, Decorator, Adapter). Events and the 202-Accepted async style: <a href="#/topic/be-event-driven">Event-Driven Systems</a>. Queue mechanics (delivery semantics, DLQ, outbox): <a href="#/topic/be-queues">Queues</a> and <a href="#/topic/cloud-sqs">SQS / SNS / EventBridge</a>. Token buckets in depth: <a href="#/topic/lld-rate-limiter">Case: Rate Limiter</a>. Who may call the API and read whose inbox: <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a>. A producer to practise against: <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>.</p>
<p>Code is TypeScript (interfaces, classes, enums); Java and C++ map 1:1 (interfaces, enums, <code>CompletableFuture</code> / plain returns).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — two halves joined by a durable table or queue</h3>
<div class="diagram"><pre>
 producers                 ACCEPT side (fast, in the request path)          DELIVER side (async, N workers)
 ---------                 ---------------------------------------          -------------------------------
 BookingService --+
 AuthService    --+--&gt; EventBus --&gt; subscriber --&gt; NotificationService.notify(req)
 Billing        --+   (Observer)    event -&gt; req     1. expired already?  -&gt; drop
                                                     2. channels: template default or override
                                                     3. per channel: sender? contact? preference?
                                                     4. when: now, or end of quiet hours
                                                     5. INSERT notification ON CONFLICT DO NOTHING
                                                        + one delivery row per channel  (1 transaction)
                                                                  |
                                                                  v
                                              deliveries (priority, not_before, status)
                                                                  |  claimDue: FOR UPDATE SKIP LOCKED
                                                                  v  (or SQS: visibility timeout = lease)
                                              DeliveryWorker: re-check expiry, preference, quiet hours, cap
                                                 -&gt; render template (locale fallback)
                                                 -&gt; ChannelSender (Strategy) -&gt; provider adapter
                                                 -&gt; SENT | requeue with backoff | FAILED (dead letter)
                                                                  |
                                   provider receipts (webhook) ---+--&gt; DELIVERED / bounced -&gt; suppression list
</pre></div>
<p>The accept side answers in milliseconds and can return <code>202 Accepted</code>. The deliver side absorbs provider slowness, outages and rate limits without the producer ever noticing.</p>

<h3>Picture 2 — priority lanes</h3>
<table>
  <thead><tr><th>Priority</th><th>Examples</th><th>Quiet hours</th><th>Per-user cap</th><th>Retries</th></tr></thead>
  <tbody>
    <tr><td><strong>CRITICAL</strong></td><td>OTP, password reset, fraud alert</td><td>Bypass</td><td>Bypass</td><td>Few, seconds apart; message expires in minutes</td></tr>
    <tr><td><strong>HIGH</strong></td><td>Booking cancelled, payment receipt</td><td>Respected for push/SMS</td><td>Deferred</td><td>Up to ~6 with backoff</td></tr>
    <tr><td><strong>NORMAL</strong></td><td>Reminders, mentions</td><td>Respected</td><td>Deferred</td><td>Up to ~6</td></tr>
    <tr><td><strong>LOW</strong></td><td>Marketing, digests</td><td>Respected</td><td>Dropped / digested</td><td>Few; throttled hard</td></tr>
  </tbody>
</table>
<p>Lanes are physical, not just a sort order: separate queues (or a priority-ordered claim with dedicated workers per lane) so the OTP path has its own capacity.</p>

<h3>Picture 3 — a delivery's lifecycle</h3>
<div class="diagram"><pre>
                 claim (lease 60s)           provider accepted          receipt webhook
   QUEUED ---------------------------&gt; SENDING ----------------&gt; SENT -------------------&gt; DELIVERED
    ^  ^                                 |  |
    |  +------ lease expired ------------+  |  retryable error and attempts &lt; max:
    |          (worker crashed)              |  not_before = now + backoff
    +----------------------------------------+
    |  quiet hours / per-user cap: not_before = later

   SENDING -&gt; FAILED      permanent error, or retries exhausted  (dead letter + alert)
   QUEUED  -&gt; EXPIRED     past expires_at (an OTP after 5 minutes, a reminder after the meeting)
   created as SUPPRESSED  preference / no contact point  (kept, so "why didn't I get it?" has an answer)
</pre></div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"A queue gives me exactly-once." No queue and no provider gives exactly-once across the boundary: a worker can crash after the provider accepted the SMS but before recording SENT, and the lease expiry will send it again. You get at-least-once and design for it — dedupe at accept time, pass the delivery id as an idempotency key where the provider supports one, and accept a small residual duplicate rate for providers that don't.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>The <a href="#/topic/lld-framework">framework</a> steps in the order you would say them aloud. The full code is in <strong>Examples</strong>.</p>

<h3>Step 1 — Requirements (functional + non-functional)</h3>
<p><strong>Ask, then commit:</strong> which channels? (email, SMS, push, in-app) · who calls us? (internal services, via events and an internal API) · user preferences? (per category × channel) · quiet hours? (yes, in the user's zone) · scheduling and digests? (follow-ups) · scale? (~10M users, ~50M notifications/day ≈ 600/s average, peaks of ~10× during campaigns; OTP p99 end-to-end under ~10 s).</p>
<ul>
  <li><strong>Functional:</strong> send on any channel from a template with variables and locale fallback · category × channel preferences with defaults · marketing only with consent · quiet hours · priorities · retries · per-delivery status and reason · in-app inbox · device-token registration · delivery receipts.</li>
  <li><strong>Non-functional:</strong> producers never block on providers · at-least-once delivery, effectively-once to the user · OTP latency isolated from bulk traffic · respect provider rate limits · survive a provider outage (retry, failover) · observable ("why didn't X get it?") · adding a channel or provider touches one class.</li>
</ul>

<h3>Step 2 — Entities &amp; relationships</h3>
<ul>
  <li><strong>Notification</strong>: the intent — user, category, priority, template key, data, dedupe key, expiry.</li>
  <li><strong>Delivery</strong>: one per (notification, channel) — status, attempts, <code>notBefore</code>, provider message id, last error. This is the unit of work for workers.</li>
  <li><strong>UserPreferences</strong>: zone, locale, opt-ins per category × channel, quiet hours, <strong>ContactPoints</strong> (email, phone in E.164, push tokens).</li>
  <li><strong>Template</strong>: keyed by (key, channel, locale, version); subject + body with <code>{{variables}}</code>.</li>
  <li><strong>Enums</strong>: <code>Channel</code>, <code>Category</code>, <code>Priority</code>, <code>DeliveryStatus</code>.</li>
  <li><strong>Behaviour</strong>: NotificationService (accept), DeliveryWorker (deliver), PreferencePolicy, TemplateRenderer, RetryPolicy, RateLimiter, ChannelSender implementations, SenderRegistry, EventBus.</li>
</ul>
<p><strong>Relationships:</strong> User 1—1 UserPreferences · User 1—* Notification · Notification 1—* Delivery (one per channel) · Delivery *—1 ChannelSender (by channel) · Template * per key (channel × locale × version).</p>

<h3>Step 3 — Class diagram (ASCII)</h3>
<div class="diagram"><pre>
 +-----------------+ emit  +----------+ on(type)  +------------------------------+
 | BookingService, |------&gt;| EventBus |----------&gt;| subscribeNotifications()     |
 | AuthService ... |       +----------+           | maps DomainEvent -&gt; Request  |
 +-----------------+                              +--------------+---------------+
                                                                 | notify(req)
                                                                 v
 +--------------------------------+       +---------------------------------------+
 | NotificationService (accept)   |------&gt;| &lt;&lt;interface&gt;&gt; NotificationStore      |
 | + notify(req)                  |       | createIfNew(n, deliveries) / get(id)  |
 +-----+-----------------+--------+       +---------------------------------------+
       |                 |                +---------------------------------------+
       v                 v                | &lt;&lt;interface&gt;&gt; DeliveryStore          |
 PreferencePolicy   SenderRegistry &lt;---+  | claimDue(n, now, lease) / save(d)     |
 isAllowed()        get(channel)       |  +-------------------^-------------------+
 releaseTime()           |             |                      |
                         v             |  +-------------------+-------------------+
       &lt;&lt;interface&gt;&gt; ChannelSender      +--| DeliveryWorker  (N instances)         |
       channel / canReach() / send()      | + runOnce(): claim, re-check, render, |
         ^         ^          ^       ^   |   send, record outcome                |
   EmailSender SmsSender PushSender InAppSender  uses TemplateRenderer, RetryPolicy, |
         |         |          |           |   RateLimiter (per-user cap)          |
   EmailProvider SmsProvider PushProvider +---------------------------------------+
   (Adapters over SES / SendGrid, Twilio, FCM / APNs)

   RateLimitedSender, FailoverSender: Decorators -- implement ChannelSender AND wrap one
</pre></div>

<h3>Step 4 — Interfaces/APIs</h3>
<pre><code class="language-ts">export interface Clock { now(): Date; }

export interface Recipient { userId: string; contacts: ContactPoints; }

export type SendResult =
  | { kind: 'SENT'; providerMessageId: string }
  | { kind: 'RETRYABLE'; error: string; retryAfterMs?: number }
  | { kind: 'PERMANENT'; error: string };

/** Strategy: one implementation per channel. Errors are RESULTS, not exceptions. */
export interface ChannelSender {
  readonly channel: Channel;
  canReach(to: Recipient): boolean;
  send(to: Recipient, msg: RenderedMessage, idempotencyKey: string): Promise&lt;SendResult&gt;;
}

export interface NotificationStore {
  /** Inserts the notification AND its deliveries atomically, unless (userId, dedupeKey) exists. */
  createIfNew(n: Notification, deliveries: Delivery[]): Promise&lt;boolean&gt;;
  get(id: string): Promise&lt;Notification | null&gt;;
}

export interface DeliveryStore {
  /** Atomically hand up to n due deliveries to THIS worker under a lease. */
  claimDue(n: number, now: Date, leaseMs: number): Promise&lt;Delivery[]&gt;;
  save(d: Delivery): Promise&lt;void&gt;;
  cancelQueued(notificationId: string, channel: Channel): Promise&lt;number&gt;;
}

export interface UserDirectory { preferences(userId: string): Promise&lt;UserPreferences | null&gt;; }
export interface TemplateCatalog { defaultChannels(templateKey: string): Channel[]; }
export interface RateLimiter { tryAcquire(key: string): number; }   // 0 = go, else ms to wait</code></pre>
<table>
  <thead><tr><th>Endpoint</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td><code>POST /v1/notifications</code> (service-to-service)</td><td><code>202 Accepted</code> + id; the dedupe key makes retries safe</td></tr>
    <tr><td><code>GET /v1/notifications/:id</code></td><td>Per-channel status and reason — the support/FDE debugging view</td></tr>
    <tr><td><code>GET | PUT /v1/me/preferences</code></td><td>Category × channel toggles, quiet hours, zone; SECURITY rows read-only</td></tr>
    <tr><td><code>GET /v1/me/inbox?cursor=</code>, <code>POST /v1/me/push-tokens</code></td><td>In-app inbox; device token registration on app start</td></tr>
    <tr><td><code>POST /v1/webhooks/:provider</code></td><td>Delivery receipts and bounces; verify the provider's signature</td></tr>
  </tbody>
</table>

<h3>Step 5 — Core flows</h3>
<ul>
  <li><strong>Accept:</strong> event → subscriber builds a request → <code>notify()</code> → expired? drop · resolve channels · per channel suppress (no sender / no contact / preference) or queue · <code>notBefore</code> = now or end of quiet hours (push/SMS only) · one transaction inserts notification + deliveries, <code>ON CONFLICT (user_id, dedupe_key) DO NOTHING</code>.</li>
  <li><strong>Deliver:</strong> worker claims a batch by priority then <code>not_before</code> → per delivery: expired? · still allowed? · quiet hours now? · per-user cap? · render · send with the delivery id as idempotency key → record outcome.</li>
  <li><strong>Retry:</strong> RETRYABLE and attempts &lt; max → QUEUED with <code>not_before = now + backoff</code> (honouring Retry-After); otherwise FAILED (dead letter, alert). PERMANENT → FAILED immediately.</li>
  <li><strong>Crash recovery:</strong> a SENDING row whose lease expired is claimable again — the database version of an SQS visibility timeout.</li>
  <li><strong>Receipts:</strong> provider webhook → DELIVERED, or bounce/complaint → add the address to a suppression list that <code>canReach</code> consults.</li>
</ul>

<h3>Step 6 — Code</h3>
<p>Example 1 is the complete solution: domain types → preferences and quiet hours → templates → senders, decorators and registry → retry policy and rate limiter → <code>NotificationService</code> → <code>DeliveryWorker</code> → Postgres adapters → event wiring. Examples 2 and 3 are follow-up extensions (critical-channel escalation, digests).</p>

<h3>Step 7 — Extensibility &amp; concurrency</h3>
<h4>Schema and the database-level guards</h4>
<pre><code class="language-sql">CREATE TABLE notifications (
  id            uuid PRIMARY KEY,
  user_id       uuid NOT NULL,
  category      text NOT NULL,
  priority      smallint NOT NULL,              -- 0 = CRITICAL ... 3 = LOW
  template_key  text NOT NULL,
  data          jsonb NOT NULL,
  dedupe_key    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz,
  CONSTRAINT one_per_event UNIQUE (user_id, dedupe_key)   -- duplicate events cannot create a 2nd row
);

CREATE TABLE deliveries (
  id                   uuid PRIMARY KEY,         -- also the idempotency key sent to providers
  notification_id      uuid NOT NULL REFERENCES notifications(id),
  channel              text NOT NULL,
  priority             smallint NOT NULL,        -- denormalised for the claim query
  status               text NOT NULL,
  attempts             int  NOT NULL DEFAULT 0,
  not_before           timestamptz NOT NULL,
  lease_until          timestamptz,
  provider_message_id  text,
  last_error           text,
  CONSTRAINT one_per_channel UNIQUE (notification_id, channel)
);
CREATE INDEX deliveries_due ON deliveries (priority, not_before) WHERE status IN ('QUEUED', 'SENDING');

-- Accept: dedupe is a single atomic statement, not a SELECT-then-INSERT.
INSERT INTO notifications (id, user_id, category, priority, template_key, data, dedupe_key, expires_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (user_id, dedupe_key) DO NOTHING;      -- rowCount 0 =&gt; duplicate: skip the deliveries</code></pre>
<pre><code class="language-sql">-- Deliver: each worker claims a disjoint batch. SKIP LOCKED makes concurrent workers
-- step over rows another worker has locked instead of waiting for them.
WITH due AS (
  SELECT id FROM deliveries
   WHERE (status = 'QUEUED'  AND not_before  &lt;= $1::timestamptz)
      OR (status = 'SENDING' AND lease_until &lt;= $1::timestamptz)   -- worker died mid-send: reclaim
   ORDER BY priority, not_before
   LIMIT $2
   FOR UPDATE SKIP LOCKED
)
UPDATE deliveries d
   SET status = 'SENDING', lease_until = $1::timestamptz + $3::int * interval '1 second'
  FROM due
 WHERE d.id = due.id
RETURNING d.*;</code></pre>
<p>Why not <code>SELECT … FOR UPDATE</code> without <code>SKIP LOCKED</code>? Workers would queue behind each other on the same top rows and process serially. Why not a plain <code>SELECT</code> then <code>UPDATE</code>? Two workers would claim the same row and send twice. The same pattern drives the producer-side outbox relay (<a href="#/topic/be-queues">Queues — outbox</a>).</p>
<p><strong>On AWS</strong> the deliveries table can be replaced by SQS: one queue per priority lane, the visibility timeout is the lease, a redrive policy moves exhausted messages to a DLQ, and Lambda's partial batch failure response retries only the failed records (<a href="#/topic/cloud-sqs">SQS</a>). You lose the queryable status table, so you still write delivery outcomes to a store for the support view. SQS has no priority field, hence separate queues and dedicated consumers for CRITICAL.</p>

<h4>Extensibility hooks</h4>
<ul>
  <li><strong>New channel</strong> (WhatsApp, Slack): add the enum value, a <code>WhatsAppSender</code> + provider adapter, a templates column and a defaults column; register it. Nothing in the service or worker changes (<a href="#/topic/design-ocp">Open/Closed</a>).</li>
  <li><strong>New provider</strong> (SES → SendGrid): a new adapter behind <code>EmailProvider</code>; roll out with <code>FailoverSender</code> or a percentage split.</li>
  <li><strong>Per-tenant providers</strong> (an enterprise customer insists on their own SMTP relay or Twilio account): resolve the sender per tenant from config + secrets; the Strategy interface does not change.</li>
  <li><strong>Cross-cutting behaviour</strong> (metrics, circuit breaker, PII redaction in logs): another Decorator around any <code>ChannelSender</code>.</li>
  <li><strong>New pre-send rule</strong> (do-not-disturb during a user's meeting): today it is one more check in the worker; once there are several, formalise them as a Chain of Responsibility of <code>DeliveryFilter</code>s.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — the complete solution (TypeScript)</h3>

<h4>1a. Domain types</h4>
<pre><code class="language-ts">// ===== domain/types.ts =====
export enum Channel { EMAIL = 'EMAIL', SMS = 'SMS', PUSH = 'PUSH', IN_APP = 'IN_APP' }

export enum Category {
  SECURITY = 'SECURITY',             // OTP, new-device login: cannot be opted out of
  TRANSACTIONAL = 'TRANSACTIONAL',   // booking cancelled, receipts
  REMINDER = 'REMINDER',             // "meeting in 10 minutes"
  MARKETING = 'MARKETING',           // explicit opt-in (consent) required
}

export enum Priority { CRITICAL = 0, HIGH = 1, NORMAL = 2, LOW = 3 }   // lower number = served first

export enum DeliveryStatus {
  QUEUED = 'QUEUED', SENDING = 'SENDING', SENT = 'SENT', DELIVERED = 'DELIVERED',
  FAILED = 'FAILED', SUPPRESSED = 'SUPPRESSED', EXPIRED = 'EXPIRED',
}

/** Channels that make a sound or vibrate: these respect quiet hours. Email and in-app are silent. */
export const INTERRUPTIVE: ReadonlySet&lt;Channel&gt; = new Set([Channel.PUSH, Channel.SMS]);

export interface NotificationRequest {
  userId: string;
  category: Category;
  priority: Priority;
  templateKey: string;                       // 'booking.cancelled'
  data: Record&lt;string, string | number&gt;;
  dedupeKey: string;                         // same business event =&gt; same key =&gt; one notification
  channels?: Channel[];                      // default: the template's channels
  expiresAt?: Date;                          // after this, sending is pointless
}

export interface Notification extends Omit&lt;NotificationRequest, 'channels' | 'expiresAt'&gt; {
  id: string;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface Delivery {
  id: string;
  notificationId: string;
  channel: Channel;
  priority: Priority;
  status: DeliveryStatus;
  attempts: number;
  notBefore: Date;
  providerMessageId: string | null;
  lastError: string | null;                  // also the reason for SUPPRESSED / EXPIRED
}

export interface ContactPoints { email?: string; phoneE164?: string; pushTokens: string[]; }
export interface QuietHours { startMin: number; endMin: number; }  // minutes after local midnight; may wrap

export interface UserPreferences {
  userId: string;
  timeZone: string;                          // IANA, reported by the user's device
  locale: string;                            // 'hi-IN'
  optIns: Partial&lt;Record&lt;Category, Partial&lt;Record&lt;Channel, boolean&gt;&gt;&gt;&gt;;   // explicit choices only
  quietHours: QuietHours | null;
  contacts: ContactPoints;
}</code></pre>

<h4>1b. Preferences and quiet hours</h4>
<pre><code class="language-ts">// ===== domain/preference-policy.ts =====
const row = (email: boolean, sms: boolean, push: boolean, inApp: boolean): Record&lt;Channel, boolean&gt; =&gt;
  ({ [Channel.EMAIL]: email, [Channel.SMS]: sms, [Channel.PUSH]: push, [Channel.IN_APP]: inApp });

/** Defaults when the user never chose. Data, not code: a new channel adds a column. */
const DEFAULTS: Record&lt;Category, Record&lt;Channel, boolean&gt;&gt; = {
  [Category.SECURITY]: row(true, true, true, true),
  [Category.TRANSACTIONAL]: row(true, false, true, true),
  [Category.REMINDER]: row(false, false, true, true),
  [Category.MARKETING]: row(false, false, false, false),    // consent required
};

export class PreferencePolicy {
  isAllowed(p: UserPreferences, category: Category, channel: Channel): boolean {
    if (category === Category.SECURITY) return true;         // not user-disableable
    return p.optIns[category]?.[channel] ?? DEFAULTS[category][channel];
  }

  /** When may an interruptive message go out? CRITICAL and SECURITY bypass quiet hours. */
  releaseTime(now: Date, p: UserPreferences, priority: Priority, category: Category): Date {
    const q = p.quietHours;
    if (!q || priority === Priority.CRITICAL || category === Category.SECURITY) return now;
    const local = localMinutes(now, p.timeZone);
    const inQuiet = q.startMin &lt;= q.endMin
      ? local &gt;= q.startMin &amp;&amp; local &lt; q.endMin             // same-day window, e.g. 13:00-14:00
      : local &gt;= q.startMin || local &lt; q.endMin;            // wraps midnight, e.g. 22:00-07:00
    if (!inQuiet) return now;
    const wait = (q.endMin - local + 1440) % 1440;          // minutes until the window ends
    return new Date(now.getTime() + wait * 60_000);         // a DST night can be off by an hour: re-checked at send
  }
}

const fmtCache = new Map&lt;string, Intl.DateTimeFormat&gt;();

/** Minutes since local midnight in an IANA zone, using only the built-in Intl API. */
export function localMinutes(at: Date, timeZone: string): number {
  let fmt = fmtCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    fmtCache.set(timeZone, fmt);
  }
  const parts = fmt.formatToParts(at);
  const get = (type: string) =&gt; Number(parts.find((x) =&gt; x.type === type)?.value);
  return get('hour') * 60 + get('minute');
}</code></pre>

<h4>1c. Templates with locale fallback and escaping</h4>
<pre><code class="language-ts">// ===== domain/templates.ts =====
export interface Template {
  key: string; channel: Channel; locale: string; version: number;
  subject?: string;                          // email subject / push title
  body: string;                              // 'Your {{room}} booking at {{startsAt}} was cancelled.'
}
export interface TemplateStore { find(key: string, channel: Channel, locale: string): Template | undefined; }
export interface RenderedMessage { subject?: string; body: string; templateVersion: number; }
export class TemplateError extends Error {}

const escapeHtml = (s: string) =&gt;
  s.replace(/&amp;/g, '&amp;amp;').replace(/&lt;/g, '&amp;lt;').replace(/&gt;/g, '&amp;gt;').replace(/"/g, '&amp;quot;');

export class TemplateRenderer {
  constructor(private readonly store: TemplateStore, private readonly fallbackLocale = 'en') {}

  render(key: string, channel: Channel, locale: string, data: Record&lt;string, string | number&gt;): RenderedMessage {
    const t = this.resolve(key, channel, locale);
    const escape = channel === Channel.EMAIL ? escapeHtml : (x: string) =&gt; x;   // user data never becomes HTML
    const fill = (text: string) =&gt; text.replace(/\\{\\{\\s*(\\w+)\\s*\\}\\}/g, (_m, name: string) =&gt; {
      const v = data[name];
      if (v === undefined) throw new TemplateError(key + ' v' + t.version + ' needs "' + name + '"');
      return escape(String(v));
    });
    return { subject: t.subject &amp;&amp; fill(t.subject), body: fill(t.body), templateVersion: t.version };
  }

  private resolve(key: string, channel: Channel, locale: string): Template {
    for (const l of [locale, locale.split('-')[0], this.fallbackLocale]) {    // hi-IN -&gt; hi -&gt; en
      const t = this.store.find(key, channel, l);
      if (t) return t;
    }
    throw new TemplateError('No template ' + key + ' for ' + channel);
  }
}</code></pre>
<p>Templates are data owned by product, so they are versioned and the version is recorded on each delivery ("which wording did this user see?"). A missing variable is a bug in a deploy, not a transient fault — fail the delivery permanently and catch it earlier with a CI test that renders every template with fixture data.</p>

<h4>1d. Senders (Strategy), provider adapters, decorators, registry</h4>
<pre><code class="language-ts">// ===== channels/senders.ts =====
/** Adapter boundary: vendor SDK calls (SES/SendGrid, Twilio, FCM/APNs) live only inside these. */
export interface EmailProvider { send(to: string, subject: string, html: string, idemKey: string): Promise&lt;string&gt;; }
export interface SmsProvider { send(toE164: string, text: string, idemKey: string): Promise&lt;string&gt;; }
export interface PushProvider { send(token: string, title: string, body: string): Promise&lt;string&gt;; }
export interface PushTokenStore { remove(userId: string, token: string): Promise&lt;void&gt;; }
export interface InboxStore { upsert(userId: string, key: string, msg: RenderedMessage): Promise&lt;string&gt;; }

/** Adapters throw this. Anything else (timeouts, socket resets) is treated as retryable. */
export class ProviderError extends Error {
  constructor(message: string, readonly retryable: boolean, readonly retryAfterMs?: number,
              readonly badRecipient = false) { super(message); }

  static fromHttp(status: number, body: string, retryAfterSec?: number): ProviderError {
    const retryable = status === 408 || status === 429 || status &gt;= 500;   // other 4xx: fix the request
    return new ProviderError('HTTP ' + status + ': ' + body, retryable,
      retryAfterSec !== undefined ? retryAfterSec * 1000 : undefined);
  }
}

const toResult = (err: unknown): SendResult =&gt;
  err instanceof ProviderError &amp;&amp; !err.retryable
    ? { kind: 'PERMANENT', error: err.message }
    : { kind: 'RETRYABLE', error: err instanceof Error ? err.message : String(err),
        retryAfterMs: err instanceof ProviderError ? err.retryAfterMs : undefined };

export class EmailSender implements ChannelSender {
  readonly channel = Channel.EMAIL;
  constructor(private readonly provider: EmailProvider) {}
  canReach(to: Recipient) { return !!to.contacts.email; }
  async send(to: Recipient, msg: RenderedMessage, idemKey: string): Promise&lt;SendResult&gt; {
    try {
      const id = await this.provider.send(to.contacts.email!, msg.subject ?? '', msg.body, idemKey);
      return { kind: 'SENT', providerMessageId: id };
    } catch (err) { return toResult(err); }
  }
}

export class SmsSender implements ChannelSender {
  readonly channel = Channel.SMS;
  constructor(private readonly provider: SmsProvider) {}
  canReach(to: Recipient) { return !!to.contacts.phoneE164; }
  async send(to: Recipient, msg: RenderedMessage, idemKey: string): Promise&lt;SendResult&gt; {
    try {
      return { kind: 'SENT', providerMessageId: await this.provider.send(to.contacts.phoneE164!, msg.body, idemKey) };
    } catch (err) { return toResult(err); }
  }
}

export class PushSender implements ChannelSender {
  readonly channel = Channel.PUSH;
  constructor(private readonly provider: PushProvider, private readonly tokens: PushTokenStore) {}
  canReach(to: Recipient) { return to.contacts.pushTokens.length &gt; 0; }
  async send(to: Recipient, msg: RenderedMessage): Promise&lt;SendResult&gt; {
    const tokens = to.contacts.pushTokens;
    const results = await Promise.allSettled(tokens.map((t) =&gt; this.provider.send(t, msg.subject ?? '', msg.body)));
    const ids: string[] = [];
    let retryError: string | null = null;
    for (let i = 0; i &lt; results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled') ids.push(r.value);
      else if (r.reason instanceof ProviderError &amp;&amp; r.reason.badRecipient) await this.tokens.remove(to.userId, tokens[i]);
      else retryError = String(r.reason);
    }
    // Reached at least one device: done. Retrying would duplicate on devices that already got it.
    if (ids.length &gt; 0) return { kind: 'SENT', providerMessageId: ids.join(',') };
    return retryError ? { kind: 'RETRYABLE', error: retryError } : { kind: 'PERMANENT', error: 'no valid push tokens' };
  }
}

export class InAppSender implements ChannelSender {
  readonly channel = Channel.IN_APP;
  constructor(private readonly inbox: InboxStore) {}
  canReach() { return true; }
  async send(to: Recipient, msg: RenderedMessage, idemKey: string): Promise&lt;SendResult&gt; {
    try {
      return { kind: 'SENT', providerMessageId: await this.inbox.upsert(to.userId, idemKey, msg) };  // upsert = idempotent
    } catch (err) { return toResult(err); }
  }
}

/** Decorator: provider-level throttle (an SMS account allows N msg/s). Same interface in and out. */
export class RateLimitedSender implements ChannelSender {
  constructor(private readonly inner: ChannelSender, private readonly limiter: RateLimiter,
              private readonly bucket: string) {}
  get channel() { return this.inner.channel; }
  canReach(to: Recipient) { return this.inner.canReach(to); }
  async send(to: Recipient, msg: RenderedMessage, idemKey: string): Promise&lt;SendResult&gt; {
    const waitMs = this.limiter.tryAcquire(this.bucket);
    if (waitMs &gt; 0) return { kind: 'RETRYABLE', error: 'local rate limit', retryAfterMs: waitMs };  // requeue, don't block
    return this.inner.send(to, msg, idemKey);
  }
}

/** Decorator: second provider, ONLY on retryable errors (never re-send after "invalid number"). */
export class FailoverSender implements ChannelSender {
  constructor(private readonly primary: ChannelSender, private readonly backup: ChannelSender) {}
  get channel() { return this.primary.channel; }
  canReach(to: Recipient) { return this.primary.canReach(to); }
  async send(to: Recipient, msg: RenderedMessage, idemKey: string): Promise&lt;SendResult&gt; {
    const first = await this.primary.send(to, msg, idemKey);
    return first.kind === 'RETRYABLE' ? this.backup.send(to, msg, idemKey) : first;
  }
}

export class SenderRegistry {
  private readonly byChannel = new Map&lt;Channel, ChannelSender&gt;();
  register(s: ChannelSender): this { this.byChannel.set(s.channel, s); return this; }
  get(channel: Channel): ChannelSender | undefined { return this.byChannel.get(channel); }
}</code></pre>
<p><code>FailoverSender</code> has a sharp edge: a primary <em>timeout</em> is retryable, but the primary may in fact have sent the SMS — failing over then produces a duplicate. That is an acceptable trade for OTPs (a second OTP is better than none), and a bad one for "your card was charged". Make failover a per-category decision.</p>

<h4>1e. Retry policy and rate limiter</h4>
<pre><code class="language-ts">// ===== infra/retry.ts =====
export class RetryPolicy {
  constructor(private readonly baseMs = 2_000, private readonly capMs = 15 * 60_000,
              private readonly rand: () =&gt; number = Math.random) {}

  /** OTPs are useless after minutes: few, fast retries. Bulk mail can wait. */
  maxAttempts(p: Priority): number {
    return p === Priority.CRITICAL ? 3 : p === Priority.LOW ? 4 : 6;
  }

  /** Full jitter: uniform in [0, min(cap, base * 2^attempt)], never sooner than the provider's Retry-After. */
  delayMs(attempt: number, retryAfterMs = 0): number {
    const ceiling = Math.min(this.capMs, this.baseMs * 2 ** attempt);
    return Math.max(Math.floor(this.rand() * ceiling), retryAfterMs);
  }
}

// ===== infra/token-bucket.ts =====  (single-process; use Redis for a fleet: see Case: Rate Limiter)
export class TokenBucket implements RateLimiter {
  private readonly buckets = new Map&lt;string, { tokens: number; at: number }&gt;();
  constructor(private readonly capacity: number, private readonly perSec: number,
              private readonly now: () =&gt; number = Date.now) {}

  tryAcquire(key: string): number {
    const t = this.now();
    const b = this.buckets.get(key) ?? { tokens: this.capacity, at: t };
    b.tokens = Math.min(this.capacity, b.tokens + ((t - b.at) / 1000) * this.perSec);
    b.at = t;
    this.buckets.set(key, b);
    if (b.tokens &gt;= 1) { b.tokens -= 1; return 0; }
    return Math.ceil(((1 - b.tokens) / this.perSec) * 1000);
  }
}
// Per-user fatigue cap of 5 per hour per channel: new TokenBucket(5, 5 / 3600)</code></pre>
<p>Why full jitter? When a provider has a 2-minute outage, 50,000 deliveries fail together. Plain exponential backoff retries them in synchronised waves that knock the provider over again as it recovers; randomising across the whole window spreads the load.</p>

<h4>1f. The accept side — NotificationService</h4>
<pre><code class="language-ts">// ===== app/notification-service.ts =====
export interface NotificationServiceDeps {
  notifications: NotificationStore;
  users: UserDirectory;
  senders: SenderRegistry;
  rules: PreferencePolicy;
  catalog: TemplateCatalog;
  clock: Clock;
  newId: () =&gt; string;
}

export class NotificationService {
  constructor(private readonly d: NotificationServiceDeps) {}

  /** Decide WHAT goes WHERE and WHEN, persist it, return fast. No provider calls here. */
  async notify(req: NotificationRequest): Promise&lt;{ id: string; deliveries: Delivery[] } | null&gt; {
    const now = this.d.clock.now();
    if (req.expiresAt &amp;&amp; req.expiresAt &lt;= now) return null;              // already too late to matter
    const prefs = await this.d.users.preferences(req.userId);
    if (!prefs) return null;                                             // deleted user: drop quietly
    const to: Recipient = { userId: req.userId, contacts: prefs.contacts };
    const quietUntil = this.d.rules.releaseTime(now, prefs, req.priority, req.category);

    const n: Notification = {
      id: this.d.newId(), userId: req.userId, category: req.category, priority: req.priority,
      templateKey: req.templateKey, data: req.data, dedupeKey: req.dedupeKey,
      createdAt: now, expiresAt: req.expiresAt ?? null,
    };

    const channels = req.channels ?? this.d.catalog.defaultChannels(req.templateKey);
    const deliveries = channels.map((channel): Delivery =&gt; {
      const sender = this.d.senders.get(channel);
      const why = !sender ? 'no sender for channel'
        : !sender.canReach(to) ? 'no contact point'
        : !this.d.rules.isAllowed(prefs, req.category, channel) ? 'user preference'
        : null;
      return {
        id: this.d.newId(), notificationId: n.id, channel, priority: req.priority,
        status: why ? DeliveryStatus.SUPPRESSED : DeliveryStatus.QUEUED,
        notBefore: INTERRUPTIVE.has(channel) ? quietUntil : now,         // silent channels never wait
        attempts: 0, providerMessageId: null,
        lastError: why,                                                  // answers "why didn't I get it?"
      };
    });

    const created = await this.d.notifications.createIfNew(n, deliveries);
    return created ? { id: n.id, deliveries } : null;                    // false = duplicate event
  }
}</code></pre>

<h4>1g. The deliver side — DeliveryWorker</h4>
<pre><code class="language-ts">// ===== app/delivery-worker.ts =====
export interface DeliveryWorkerDeps {
  notifications: NotificationStore;
  deliveries: DeliveryStore;
  users: UserDirectory;
  senders: SenderRegistry;
  renderer: TemplateRenderer;
  rules: PreferencePolicy;
  retry: RetryPolicy;
  userCap: RateLimiter;
  clock: Clock;
}

export class DeliveryWorker {
  constructor(private readonly d: DeliveryWorkerDeps) {}

  /** One poll. Run many of these on many pods: claimDue gives each delivery to exactly one worker. */
  async runOnce(batchSize = 50): Promise&lt;number&gt; {
    const claimed = await this.d.deliveries.claimDue(batchSize, this.d.clock.now(), 60_000);
    await Promise.all(claimed.map((del) =&gt;
      this.deliver(del).catch((err) =&gt; this.retryLater(del, 'worker error: ' + String(err)))));
    return claimed.length;
  }

  private async deliver(del: Delivery): Promise&lt;void&gt; {
    const now = this.d.clock.now();
    const n = await this.d.notifications.get(del.notificationId);
    const prefs = n ? await this.d.users.preferences(n.userId) : null;
    if (!n || !prefs) return this.finish(del, DeliveryStatus.SUPPRESSED, 'user or notification gone');
    if (n.expiresAt &amp;&amp; n.expiresAt &lt;= now) return this.finish(del, DeliveryStatus.EXPIRED, 'too late to matter');

    // Re-check at SEND time: preferences and the clock have moved since this was queued.
    if (!this.d.rules.isAllowed(prefs, n.category, del.channel)) {
      return this.finish(del, DeliveryStatus.SUPPRESSED, 'opted out after queueing');
    }
    if (INTERRUPTIVE.has(del.channel)) {
      const releaseAt = this.d.rules.releaseTime(now, prefs, n.priority, n.category);
      if (releaseAt &gt; now) return this.requeue(del, releaseAt, 'quiet hours');
      if (n.priority !== Priority.CRITICAL) {
        const waitMs = this.d.userCap.tryAcquire(n.userId + ':' + del.channel);     // anti-fatigue cap
        if (waitMs &gt; 0) {
          return n.priority === Priority.LOW
            ? this.finish(del, DeliveryStatus.SUPPRESSED, 'per-user cap')
            : this.requeue(del, new Date(now.getTime() + waitMs), 'per-user cap');
        }
      }
    }

    const sender = this.d.senders.get(del.channel);
    if (!sender) return this.finish(del, DeliveryStatus.FAILED, 'no sender for ' + del.channel);
    let msg: RenderedMessage;
    try {
      msg = this.d.renderer.render(n.templateKey, del.channel, prefs.locale, n.data);
    } catch (err) {
      return this.finish(del, DeliveryStatus.FAILED, 'template: ' + String(err));   // retrying won't fix it
    }

    del.attempts += 1;
    const result = await sender.send({ userId: n.userId, contacts: prefs.contacts }, msg, del.id);
    if (result.kind === 'SENT') {
      return this.finish({ ...del, providerMessageId: result.providerMessageId }, DeliveryStatus.SENT, null);
    }
    if (result.kind === 'PERMANENT') return this.finish(del, DeliveryStatus.FAILED, result.error);
    return this.retryLater(del, result.error, result.retryAfterMs);
  }

  private retryLater(del: Delivery, error: string, retryAfterMs?: number): Promise&lt;void&gt; {
    if (del.attempts &gt;= this.d.retry.maxAttempts(del.priority)) {
      // Dead letter: stays queryable as FAILED, raises an alert, can be redriven after a fix.
      return this.finish(del, DeliveryStatus.FAILED, 'gave up after ' + del.attempts + ' attempts: ' + error);
    }
    const at = new Date(this.d.clock.now().getTime() + this.d.retry.delayMs(del.attempts, retryAfterMs));
    return this.requeue(del, at, error);
  }

  private requeue(del: Delivery, at: Date, why: string): Promise&lt;void&gt; {
    return this.d.deliveries.save({ ...del, status: DeliveryStatus.QUEUED, notBefore: at, lastError: why });
  }

  private finish(del: Delivery, status: DeliveryStatus, why: string | null): Promise&lt;void&gt; {
    return this.d.deliveries.save({ ...del, status, lastError: why });
  }
}</code></pre>

<h4>1h. Postgres adapters (the atomic parts)</h4>
<pre><code class="language-ts">// ===== adapters/postgres.ts (node-postgres) =====
import { Pool } from 'pg';

export class PgNotificationStore implements NotificationStore {
  constructor(private readonly pool: Pool) {}

  async createIfNew(n: Notification, deliveries: Delivery[]): Promise&lt;boolean&gt; {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const ins = await client.query(
        'INSERT INTO notifications (id, user_id, category, priority, template_key, data, dedupe_key, created_at, expires_at) ' +
        'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (user_id, dedupe_key) DO NOTHING',
        [n.id, n.userId, n.category, n.priority, n.templateKey, n.data, n.dedupeKey, n.createdAt, n.expiresAt]);
      if (ins.rowCount === 0) { await client.query('ROLLBACK'); return false; }    // duplicate event
      for (const d of deliveries) {
        await client.query(
          'INSERT INTO deliveries (id, notification_id, channel, priority, status, not_before, last_error) ' +
          'VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [d.id, d.notificationId, d.channel, d.priority, d.status, d.notBefore, d.lastError]);
      }
      await client.query('COMMIT');                // both or neither: a crash can't strand a notification
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async get(id: string): Promise&lt;Notification | null&gt; {
    const { rows } = await this.pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
    const r = rows[0];
    return r ? { id: r.id, userId: r.user_id, category: r.category, priority: r.priority, templateKey: r.template_key,
      data: r.data, dedupeKey: r.dedupe_key, createdAt: r.created_at, expiresAt: r.expires_at } : null;
  }
}

export class PgDeliveryStore implements DeliveryStore {
  // claimSql = the WITH due AS (... FOR UPDATE SKIP LOCKED) UPDATE ... RETURNING query from Step 7
  constructor(private readonly pool: Pool, private readonly claimSql: string) {}

  async claimDue(n: number, now: Date, leaseMs: number): Promise&lt;Delivery[]&gt; {
    const { rows } = await this.pool.query(this.claimSql, [now, n, Math.ceil(leaseMs / 1000)]);
    return rows.map((r) =&gt; ({
      id: r.id, notificationId: r.notification_id, channel: r.channel, priority: r.priority,
      status: r.status, attempts: r.attempts, notBefore: r.not_before,
      providerMessageId: r.provider_message_id, lastError: r.last_error,
    }));
  }

  async save(d: Delivery): Promise&lt;void&gt; {
    await this.pool.query(
      'UPDATE deliveries SET status = $2, attempts = $3, not_before = $4, provider_message_id = $5, ' +
      'last_error = $6, lease_until = NULL WHERE id = $1',
      [d.id, d.status, d.attempts, d.notBefore, d.providerMessageId, d.lastError]);
  }

  async cancelQueued(notificationId: string, channel: Channel): Promise&lt;number&gt; {
    const res = await this.pool.query(
      "UPDATE deliveries SET status = 'SUPPRESSED', last_error = 'no longer needed' " +
      "WHERE notification_id = $1 AND channel = $2 AND status = 'QUEUED'", [notificationId, channel]);
    return res.rowCount ?? 0;
  }
}</code></pre>
<p>For unit tests, in-memory twins are a few lines each: a <code>Set</code> of <code>userId + dedupeKey</code> for <code>createIfNew</code>, and a filter-sort-slice that flips rows to SENDING with no <code>await</code> in between for <code>claimDue</code> — atomic on Node's single thread, which is exactly why it proves nothing about multi-worker safety. Test that against a real database with two workers.</p>

<h4>1i. Observer wiring and composition root</h4>
<pre><code class="language-ts">// ===== app/subscriptions.ts =====
export type DomainEvent =
  | { type: 'BookingCancelled'; bookingId: string; room: string; startsAt: Date; attendeeIds: string[]; cancelledBy: string }
  | { type: 'MeetingStartingSoon'; bookingId: string; room: string; startsAt: Date; attendeeIds: string[] }
  | { type: 'OtpRequested'; requestId: string; userId: string; code: string; expiresAt: Date };

type Handler&lt;T extends DomainEvent['type']&gt; = (e: Extract&lt;DomainEvent, { type: T }&gt;) =&gt; Promise&lt;void&gt;;

export class EventBus {
  private readonly handlers = new Map&lt;string, Array&lt;(e: DomainEvent) =&gt; Promise&lt;void&gt;&gt;&gt;();

  on&lt;T extends DomainEvent['type']&gt;(type: T, handler: Handler&lt;T&gt;): void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler as (e: DomainEvent) =&gt; Promise&lt;void&gt;);
    this.handlers.set(type, list);
  }

  async emit(e: DomainEvent): Promise&lt;void&gt; {
    // One failing subscriber must not stop the others (or the producer).
    await Promise.allSettled((this.handlers.get(e.type) ?? []).map((h) =&gt; h(e)));
  }
}

/** Producers publish facts. Only this file knows those facts become notifications. */
export function subscribeNotifications(bus: EventBus, svc: NotificationService): void {
  bus.on('BookingCancelled', async (e) =&gt; {
    for (const userId of e.attendeeIds.filter((id) =&gt; id !== e.cancelledBy)) {
      await svc.notify({
        userId, category: Category.TRANSACTIONAL, priority: Priority.HIGH, templateKey: 'booking.cancelled',
        data: { room: e.room, startsAt: e.startsAt.toISOString() },
        dedupeKey: 'booking.cancelled:' + e.bookingId, expiresAt: e.startsAt,
      });
    }
  });
  bus.on('MeetingStartingSoon', async (e) =&gt; {
    for (const userId of e.attendeeIds) {
      await svc.notify({
        userId, category: Category.REMINDER, priority: Priority.NORMAL, templateKey: 'meeting.reminder',
        data: { room: e.room, startsAt: e.startsAt.toISOString() }, channels: [Channel.PUSH],
        dedupeKey: 'meeting.reminder:' + e.bookingId, expiresAt: e.startsAt,   // pointless once it starts
      });
    }
  });
  bus.on('OtpRequested', async (e) =&gt; {
    await svc.notify({
      userId: e.userId, category: Category.SECURITY, priority: Priority.CRITICAL, templateKey: 'auth.otp',
      data: { code: e.code }, channels: [Channel.SMS], dedupeKey: 'otp:' + e.requestId, expiresAt: e.expiresAt,
    });
  });
}

// ===== main.ts — the composition root: decorators stack per channel =====
// (primarySmsAdapter etc. are your SmsProvider / EmailProvider / PushProvider implementations)
const senders = new SenderRegistry()
  .register(new RateLimitedSender(
    new FailoverSender(new SmsSender(primarySmsAdapter), new SmsSender(backupSmsAdapter)),
    new TokenBucket(30, 30), 'sms-account'))                       // check your account's real throughput
  .register(new EmailSender(emailAdapter))
  .register(new PushSender(pushAdapter, pushTokenStore))
  .register(new InAppSender(inboxStore));</code></pre>
<p>The in-process <code>EventBus</code> is the Observer pattern at its simplest. Across services the same shape becomes a broker (SNS/EventBridge → SQS, Kafka): producers write events to an outbox in their own transaction, a relay publishes them, and this service's subscriber is a queue consumer. Subscribers should only <em>enqueue</em> — never call a provider inside a handler.</p>

<h3>Example 2 — follow-up: escalate CRITICAL from push to SMS</h3>
<p>"Send the security alert by push; if it isn't opened within 60 seconds, send an SMS." Schedule the SMS delivery in the future at accept time, and cancel it when the push is opened.</p>
<pre><code class="language-ts">// NotificationRequest gains:  escalateAfterMs?: number   (e.g. channels: [PUSH, SMS], escalateAfterMs: 60_000)
// In notify(), after building deliveries:
if (req.priority === Priority.CRITICAL &amp;&amp; req.escalateAfterMs) {
  for (const d of deliveries) {
    if (d.channel === Channel.SMS &amp;&amp; d.status === DeliveryStatus.QUEUED) {
      d.notBefore = new Date(now.getTime() + req.escalateAfterMs);      // the fallback waits its turn
    }
  }
}

// Called from the "notification opened" endpoint the app hits when the user taps the push.
export async function onPushOpened(notificationId: string, deliveries: DeliveryStore): Promise&lt;void&gt; {
  const cancelled = await deliveries.cancelQueued(notificationId, Channel.SMS);
  // cancelled === 0: a worker already claimed the SMS (SENDING) — it goes out; that race is acceptable.
}</code></pre>

<h3>Example 3 — follow-up: digests for LOW priority</h3>
<p>Instead of ten "someone liked your post" pushes, collect LOW items and send one summary at the user's local 09:00.</p>
<pre><code class="language-sql">CREATE TABLE digest_items (
  user_id          uuid NOT NULL,
  notification_id  uuid NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_id)          -- re-adding the same item is a no-op
);
-- notify(): LOW + digestible category =&gt; INSERT INTO digest_items instead of creating deliveries.
-- An hourly job selects users whose local time just passed 09:00 (zone stored on the user), then per user:
--   one notify({ templateKey: 'digest.daily', dedupeKey: 'digest:' || user_id || ':' || local_date, ... })
--   DELETE FROM digest_items WHERE user_id = $1 AND created_at &lt;= $2   -- same transaction</code></pre>
<p>The dedupe key built from the user and their <em>local</em> date makes the digest job safe to re-run after a crash.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Duplicate events</h3>
<p>Brokers deliver at least once, so the subscriber sees "BookingCancelled" twice. A deterministic dedupe key per business event (<code>'booking.cancelled:' + bookingId</code>) plus the unique index makes the second <code>notify()</code> a no-op. A random UUID as the dedupe key defeats the purpose.</p>

<h3>2. Sent, but the worker died before recording it</h3>
<p>The lease expires and the delivery is sent again. Pass the delivery id as the provider's idempotency key where the API supports one (check each provider's docs); otherwise accept the rare duplicate. In-app is immune because it upserts by key.</p>

<h3>3. Preferences changed after queueing</h3>
<p>A user opts out of reminders at 21:59; a reminder queued at 21:00 for 22:30 must not go out. Check preferences at accept time (to avoid useless work) <em>and</em> at send time (for correctness).</p>

<h3>4. Quiet hours and zones</h3>
<p>Evaluate in the user's zone from their device, not the server's. Windows can wrap midnight (22:00–07:00). On DST nights the computed release time can be off by an hour, so the worker re-checks and requeues. A traveller's zone changes — update it on app start.</p>

<h3>5. Deferred past relevance</h3>
<p>A "meeting in 10 minutes" reminder deferred by quiet hours, or stuck in retries, is noise after the meeting starts. Every time-sensitive request carries <code>expiresAt</code>; the worker marks it EXPIRED instead of sending.</p>

<h3>6. OTP specifics</h3>
<p>Three fast retries, then FAILED; an OTP delivered after it expired is worse than none. Store the code with a short TTL (or only its hash on the auth side), and never log it. Whether to fall back to another channel (voice, email) is a security decision, not a reliability one.</p>

<h3>7. Stale push tokens</h3>
<p>Uninstalls leave dead tokens. Providers report them as unregistered/invalid; the adapter raises <code>badRecipient</code> and the sender deletes the token. Without pruning, fan-out cost grows and metrics lie.</p>

<h3>8. Bounces and complaints</h3>
<p>Repeatedly emailing bounced addresses or users who marked you as spam damages sender reputation for <em>everyone's</em> mail. Receipt webhooks feed a suppression list that <code>canReach</code> checks.</p>

<h3>9. SMS length and encoding</h3>
<p>One emoji or a non-Latin script switches the message from GSM-7 (160 characters per single segment) to UCS-2 (70), multiplying cost. Lint SMS templates for length per locale; some countries also require pre-registered templates and sender ids.</p>

<h3>10. Out-of-order messages</h3>
<p>Retries reorder: "booking confirmed" can arrive after "booking cancelled". At send time, check that the message is still true (is the booking still cancelled?), or cancel queued deliveries for the same entity when a newer event supersedes them.</p>

<h3>11. Huge fan-out</h3>
<p>A campaign to 1M users must not be one transaction or one burst. A batch job creates notifications in pages on the LOW lane; the provider throttle and lane isolation keep it from starving OTPs.</p>

<h3>12. Formatting dates and numbers</h3>
<p>The producer does not know the recipient's zone or locale. Pass instants (ISO) in <code>data</code> and format at render time with the recipient's zone and locale.</p>

<h3>13. Deleted users and data retention</h3>
<p>The worker treats a missing user as SUPPRESSED. Notification payloads contain personal data — set retention (e.g. purge <code>data</code> after N days) and include it in account-deletion flows.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — calling providers from the producer's request</h3>
<pre><code class="language-ts">// BUG: the booking API now fails or hangs when the email provider does, and if the
// transaction rolls back after this line, the user got an email about a booking that doesn't exist.
await db.insertBooking(b);
await emailClient.send(organizer, 'Booked!');</code></pre>
<p>Publish an event (via an outbox written in the same transaction) and let the notification service deliver asynchronously.</p>

<h3>Anti-pattern 2 — retrying permanent failures</h3>
<p>Retrying "invalid phone number" six times costs money and can get the account flagged. Classify: 408/429/5xx/timeouts are retryable; other 4xx are permanent.</p>

<h3>Anti-pattern 3 — backoff without jitter, cap or limit</h3>
<p>Synchronised retries hammer a recovering provider; uncapped exponential delays reach days; unlimited attempts keep dead messages alive forever. Full jitter, a cap, a max-attempts per priority, then dead-letter.</p>

<h3>Anti-pattern 4 — dedupe by "SELECT, then INSERT"</h3>
<p>Two concurrent redeliveries both see no row and both insert. Dedupe must be one atomic statement against a unique index (<code>ON CONFLICT DO NOTHING</code>).</p>

<h3>Anti-pattern 5 — one queue for everything</h3>
<p>A 1M-email campaign queued at 10:00 delays every OTP until it drains. Separate lanes with dedicated capacity for CRITICAL.</p>

<h3>Anti-pattern 6 — <code>switch (channel)</code> scattered through the code</h3>
<p>Every new channel edits the service, the worker and the preference code. One <code>ChannelSender</code> per channel behind a registry keeps channel knowledge in one class.</p>

<h3>Anti-pattern 7 — preferences checked only when queueing</h3>
<p>Messages deferred by quiet hours or retries go out after the user opted out. Re-check at send time.</p>

<h3>Anti-pattern 8 — quiet hours in server time</h3>
<p>A server in UTC "respecting 22:00–07:00" wakes Indian users at 03:30 IST. Use the user's IANA zone.</p>

<h3>Anti-pattern 9 — PII and secrets in logs</h3>
<p>Logging the rendered SMS logs every OTP; logging recipients logs phone numbers. Log ids, template keys and statuses; redact bodies.</p>

<h3>Anti-pattern 10 — heavy work inside Observer handlers</h3>
<p>A subscriber that renders and sends inline makes the producer's <code>emit()</code> as slow and fragile as the provider. Handlers translate and enqueue; workers do the sending.</p>

<h3>Anti-pattern 11 — marketing without consent or unsubscribe</h3>
<p>Defaulting marketing to "on", or omitting the unsubscribe link, is a legal problem in many jurisdictions, not just a UX one. Marketing defaults to off and needs a recorded opt-in.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. "Design a notification service." How do you structure it?</div>
  <div class="qa-answer">
    <p>Clarify channels, callers, preferences, priorities and scale, then split into an <strong>accept side</strong> and a <strong>deliver side</strong>. Accept: producers publish events, a subscriber maps them to requests, <code>notify()</code> dedupes, picks channels, applies preferences and quiet hours, and persists a notification plus one delivery per channel in one transaction — returning 202 without touching a provider. Deliver: workers claim due deliveries, re-check rules, render the template and call a per-channel <code>ChannelSender</code>, recording SENT, a backoff retry, or FAILED. Then I cover concurrency (claiming, dedupe), priorities and extensibility.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why Strategy for channels? Walk me through adding WhatsApp.</div>
  <div class="qa-answer">
    <p>Each channel differs in contact point, payload, error semantics and provider, but the pipeline treats them identically through <code>canReach()</code> and <code>send()</code>. Adding WhatsApp: a <code>Channel.WHATSAPP</code> value, a <code>WhatsAppSender</code> over a provider adapter, templates for that channel, a defaults column, and one <code>register()</code> line. The service and worker are untouched — that is Open/Closed in practice.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Where does Observer fit? Why not call the notification service from <code>BookingService</code>?</div>
  <div class="qa-answer">
    <p>Direct calls couple every producer to notification concerns (who to tell, which template, which priority) and make the producer's latency and availability depend on ours. With Observer the booking module publishes "BookingCancelled"; a subscriber owned by the notification side decides who hears about it. In-process that is an event bus; across services it is a broker fed by an outbox, which also survives crashes between commit and publish.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you make sure a user doesn't get the same notification twice?</div>
  <div class="qa-answer">
    <p>Exactly-once is impossible across the provider boundary, so I layer it. Accept-time: a deterministic dedupe key per business event and <code>UNIQUE (user_id, dedupe_key)</code> with <code>ON CONFLICT DO NOTHING</code>. Claiming: <code>FOR UPDATE SKIP LOCKED</code> (or SQS visibility) so one worker owns a delivery. Send: the delivery id as the provider idempotency key where supported; in-app upserts by key. Residual risk: a crash after the provider accepted but before we recorded SENT — rare, and I'd state it explicitly.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Walk me through your retry policy.</div>
  <div class="qa-answer">
    <p>Senders return results, not exceptions: SENT, RETRYABLE (timeouts, 408, 429, 5xx, optional Retry-After) or PERMANENT (other 4xx, invalid recipient). RETRYABLE requeues with full-jitter exponential backoff — uniform in <code>[0, min(cap, base·2^attempt)]</code>, never sooner than Retry-After — up to a per-priority maximum (3 fast ones for OTPs, ~6 for transactional). Exhausted or permanent → FAILED, which is our dead letter: queryable, alerting, redrivable after a fix. Messages with <code>expiresAt</code> expire instead of retrying forever.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you implement quiet hours correctly?</div>
  <div class="qa-answer">
    <p>Store the window as minutes after local midnight plus the user's IANA zone. Compute the user's local time with <code>Intl.DateTimeFormat</code> and that zone, handle windows that wrap midnight, and if inside, set <code>notBefore</code> to the window's end. Apply it only to interruptive channels (push, SMS), let CRITICAL and SECURITY bypass it, re-check at send time (DST and preference changes), and combine with <code>expiresAt</code> so deferred reminders don't arrive after they matter.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. A 1M-user campaign starts at 10:00. How do OTPs still arrive in seconds?</div>
  <div class="qa-answer">
    <p>Isolation at every shared resource: separate lanes (queues or priority-ordered claims) with workers dedicated to CRITICAL; the campaign is created in pages on the LOW lane and throttled below the provider's limit; ideally a separate provider account or sender id for transactional traffic so marketing can't exhaust its rate limit. Then alert on CRITICAL lane age (oldest message), not just queue depth.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. You run 20 workers. How do they avoid sending the same delivery twice?</div>
  <div class="qa-answer">
    <p>Claiming is one atomic statement: select due rows ordered by priority with <code>FOR UPDATE SKIP LOCKED</code>, flip them to SENDING with a lease in the same statement, return them. Workers skip each other's locked rows instead of blocking. If a worker dies, the lease expires and another reclaims the row. On SQS the visibility timeout plays the lease; set it longer than a send can take.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Model user preferences.</div>
  <div class="qa-answer">
    <p>A sparse table of explicit choices — <code>(user_id, category, channel, enabled)</code> — over a defaults matrix in config, so new categories and channels get sensible defaults without a backfill. SECURITY is not user-disableable; MARKETING defaults off and records consent (when, how). Quiet hours, zone and locale live on the user. Contact points are separate (verified email, phone, push tokens) because "allowed" and "reachable" are different questions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Where does rate limiting go?</div>
  <div class="qa-answer">
    <p>Two places with different purposes. <strong>Provider protection</strong>: a token bucket per provider account as a sender Decorator; when empty it returns RETRYABLE with a wait so the worker requeues instead of blocking. <strong>User protection</strong>: a per-user, per-channel fatigue cap checked in the worker — deferred for HIGH/NORMAL, dropped (or digested) for LOW, bypassed for CRITICAL. Across many workers the buckets live in Redis (see <a href="#/topic/lld-rate-limiter">Case: Rate Limiter</a>).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. FDE scenario: a customer says "users aren't getting OTPs — or they arrive late". What do you do?</div>
  <div class="qa-answer">
    <p>Get concrete cases (user, time) and look them up: the delivery row tells me whether it was suppressed (no phone, wrong format), still queued (lane backlog — check the oldest CRITICAL item's age), retrying (provider errors in <code>last_error</code>), or SENT (then it is downstream). For SENT, check provider receipts and carrier status: country-specific sender or template registration, a carrier filtering a new sender id, or the OTP template drifting from its registered text. Split by country and carrier. Mitigations: dedicated lane and workers, a failover provider for OTPs, voice fallback if security allows, and an alert on CRITICAL lane age and per-country delivery rate.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. FDE scenario: an enterprise customer requires their own SMTP relay and Twilio account. How does the design cope?</div>
  <div class="qa-answer">
    <p>Providers are already behind adapters, so this is configuration, not redesign: a per-tenant provider config (type, endpoint, credential reference in a secrets manager), and the registry resolves senders per tenant. Rate limiter buckets become per tenant account. Bounce and receipt webhooks are routed by tenant and verified with that tenant's secret. I'd add a "send test message" endpoint and per-tenant delivery metrics so their IT team can verify the relay without us in the loop.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You separate accept from deliver and never call providers in the producer's request.</li>
    <li>You use Strategy for channels, Observer for events, Decorator for rate limiting and failover, Adapter for providers.</li>
    <li>You say "at-least-once plus idempotency", with a unique dedupe index and provider idempotency keys.</li>
    <li>You classify retryable vs permanent errors and use backoff with jitter, caps, max attempts and a dead letter.</li>
    <li>You isolate priorities physically so OTPs never wait behind bulk traffic.</li>
    <li>You respect preferences, consent and quiet hours in the user's zone — re-checked at send time.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Write the dedupe insert and the worker claim query. Why is exactly-once still impossible?</div>
  <div class="qa-answer">
    <p>Dedupe is one atomic statement, not SELECT-then-INSERT: <code>INSERT INTO notifications (...) VALUES (...) ON CONFLICT (user_id, dedupe_key) DO NOTHING</code>; a rowCount of 0 means duplicate, so skip inserting deliveries. Claiming flips due rows to SENDING with a lease in the same statement:</p>
    <pre><code class="language-sql">WITH due AS (
  SELECT id FROM deliveries
   WHERE (status = 'QUEUED'  AND not_before  &lt;= $1::timestamptz)
      OR (status = 'SENDING' AND lease_until &lt;= $1::timestamptz)  -- reclaim dead worker's rows
   ORDER BY priority, not_before
   LIMIT $2
   FOR UPDATE SKIP LOCKED
)
UPDATE deliveries d
   SET status = 'SENDING', lease_until = $1::timestamptz + $3::int * interval '1 second'
  FROM due WHERE d.id = due.id
RETURNING d.*;</code></pre>
    <p>Without <code>SKIP LOCKED</code> workers queue behind each other on the same top rows; with a plain SELECT then UPDATE, two workers claim the same row. Exactly-once is still impossible because a worker can crash after the provider accepted the message but before recording SENT, and lease expiry sends it again. So it is at-least-once plus idempotency: pass the delivery id as the provider's idempotency key where supported, and accept a small residual duplicate rate where it isn't.</p>
  </div>
</div>
` },

  ]
});
