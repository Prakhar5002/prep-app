window.PREP_SITE.registerTopic({
  id: "cloud-sqs",
  module: "cloud",
  title: "SQS (+ SNS / EventBridge)",
  estimatedReadTime: "40 min",
  tags: ["aws","sqs","sns","eventbridge","kinesis","lambda","dlq","fifo","partial-batch-failure","fan-out","async-processing"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">SQS is a <strong>pull queue where receiving only hides a message until you delete it</strong>. Size the visibility timeout, attach a watched DLQ, return partial batch failures from Lambda, and make every consumer idempotent. Use SNS to fan out, EventBridge to route by content, and Kinesis for an ordered replayable stream.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Standard:</strong> at-least-once, best-effort order, nearly unlimited throughput. <strong>FIFO:</strong> order per <code>MessageGroupId</code>, 5-minute send dedup, lower throughput, <code>.fifo</code> name, FIFO DLQ.</li>
    <li><strong>Visibility timeout</strong> (default 30 seconds, max 12 hours): no delete before it expires means redelivery with receive count + 1. For Lambda, at least 6× the function timeout plus the batching window. Heartbeat long jobs with <code>ChangeMessageVisibility</code>.</li>
    <li><strong>Long polling</strong> with <code>WaitTimeSeconds</code> up to 20. Retention 1 minute to 14 days (default 4). <code>DelaySeconds</code> up to 15 minutes. At most 10 messages per receive or batch send.</li>
    <li><strong>DLQ:</strong> <code>RedrivePolicy</code> with <code>maxReceiveCount</code> of at least 5. Same type, account and region. 14-day retention (Standard keeps the original timestamp). Alarm on depth above 0. Redrive back with <code>StartMessageMoveTask</code>.</li>
    <li><strong>Lambda ESM:</strong> pollers batch (Standard up to 10,000 with a window, FIFO up to 10, 6 MB payload), invoke, and delete on success. Throw or time out and the whole batch returns.</li>
    <li><strong>Partial batch failure:</strong> <code>ReportBatchItemFailures</code> plus <code>{ batchItemFailures: [{ itemIdentifier: messageId }] }</code>. Empty means all succeeded; an invalid ID fails the whole batch. For FIFO, fail the record and everything after it.</li>
    <li><strong>MaximumConcurrency</strong> on the ESM protects the DB and rate limits. Reserved concurrency throttles and pushes messages toward the DLQ.</li>
    <li><strong>ESM filters delete</strong> non-matching SQS messages. Use one queue per consumer type.</li>
    <li><strong>SQS-triggered failures go to the queue's DLQ</strong>, not Lambda's async DLQ or destinations.</li>
    <li><strong>SNS → SQS fan-out:</strong> queue policy for <code>sns.amazonaws.com</code> with <code>aws:SourceArn</code>, raw message delivery (or double-parse), a key policy for customer-managed KMS keys, filter policies, and a subscription DLQ.</li>
    <li><strong>EventBridge:</strong> buses, rules with content patterns (prefix, numeric, anything-but), up to 5 targets per rule, a retry policy (24 hours) with a target DLQ, archive and replay, Scheduler, Pipes. About twice SNS/SQS cost per event, with higher latency.</li>
    <li><strong>Batch sends:</strong> <code>SendMessageBatch</code> and <code>PutEvents</code> can partially fail inside an HTTP 200. Check <code>Failed</code> and <code>FailedEntryCount</code>.</li>
    <li><strong>Big payloads</strong> use the claim check (S3 plus a key). <strong>Long delays</strong> use EventBridge Scheduler. <strong>Jobs over 15 minutes</strong> go to ECS workers or Step Functions.</li>
    <li><strong>Watch</strong> <code>ApproximateAgeOfOldestMessage</code>, visible and in-flight counts, DLQ depth, and empty receives.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Throwing (or swallowing) errors for a whole batch.</strong> Throwing re-runs every message in the batch, which causes duplicates. A catch-all that returns success deletes the failures silently, which loses data. Fix: catch per record, return only failed <code>messageId</code>s in <code>batchItemFailures</code>, key idempotency on the business ID, and set the visibility timeout to 6× the function timeout so in-flight work isn't redelivered.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"SQS is at-least-once, so my consumers are idempotent on a business key, like call ID plus rubric version, and never on the message ID."</div>
  <div class="revision-say">"Lambda reads SQS through an event source mapping. I enable ReportBatchItemFailures, cap it with MaximumConcurrency to protect the database, set the visibility timeout to six times the function timeout, and alarm on the DLQ and the age of the oldest message."</div>
  <div class="revision-say">"For fan-out I use SNS into one queue per consumer; for content routing across teams, or replay, I use EventBridge; for an ordered stream several consumers replay, I use Kinesis."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Why AWS messaging exists in your architecture</h3>
<ul>
  <li><strong>Decoupling:</strong> the API accepts a request, enqueues it, and returns <code>202 Accepted</code>. Transcription, LLM scoring, emails and PDF generation run later at their own pace. Async request patterns (202 + polling, webhooks, push) are covered in <a href="#/topic/be-event-driven">Event-Driven Systems &amp; Async Processing</a>.</li>
  <li><strong>Load levelling:</strong> a burst of 50,000 uploads at 9 a.m. becomes a queue that drains at the rate your database or your LLM provider's rate limit can handle.</li>
  <li><strong>Retries without code:</strong> failed work becomes visible again automatically and ends in a DLQ when it keeps failing.</li>
  <li><strong>Fan-out:</strong> one "BookingCancelled" fact can drive a cancellation email, a calendar sync, an analytics event and a room-tablet refresh without the booking service knowing about any of them.</li>
</ul>

<h3>The four services in one table</h3>
<table>
  <thead><tr><th></th><th>SQS</th><th>SNS</th><th>EventBridge</th><th>Kinesis Data Streams</th></tr></thead>
  <tbody>
    <tr><td>Shape</td><td>Queue; consumers pull</td><td>Topic; pushes to subscribers</td><td>Event bus; rules match events and route them to targets</td><td>Sharded, ordered log</td></tr>
    <tr><td>Who gets a message</td><td><strong>One</strong> consumer (competing consumers)</td><td><strong>Every</strong> subscription whose filter matches</td><td>Every target of every matching rule</td><td>Every consumer application, each tracking its own position</td></tr>
    <tr><td>Storage</td><td>Until deleted (max 14 days)</td><td>None; retries, then subscription DLQ</td><td>None by default; optional archive for replay</td><td>24 h default, extendable (up to 365 days)</td></tr>
    <tr><td>Ordering</td><td>FIFO queues: per message group</td><td>FIFO topics: per message group</td><td>Not guaranteed</td><td>Per shard (partition key)</td></tr>
    <tr><td>Filtering</td><td>None in the queue (Lambda ESM filters exist)</td><td>Filter policies on attributes or body</td><td>Rich patterns (prefix, numeric, anything-but, exists, and more)</td><td>None; consumers filter</td></tr>
    <tr><td>Replay</td><td>No</td><td>No</td><td>Archive &amp; replay</td><td>Yes, re-read from a timestamp or sequence number</td></tr>
    <tr><td>Rough price (at time of writing)</td><td>about $0.40 per million requests (Standard)</td><td>about $0.50 per million publishes, plus delivery</td><td>about $1.00 per million custom events</td><td>Per shard-hour (provisioned) or per GB (on-demand)</td></tr>
    <tr><td>Reach for it when</td><td>Background jobs, buffering, retry</td><td>Fan-out to queues, mobile push, SMS, email</td><td>Domain events across services and teams, SaaS events, schedules</td><td>Telemetry, clickstream, CDC, analytics with replay</td></tr>
  </tbody>
</table>
<p>Prices and quotas drift, so check current AWS pricing. The relative shape is stable: SQS and SNS are the cheapest per message, and EventBridge costs about twice as much but buys routing, schemas and replay.</p>

<h3>What this topic adds beyond be-queues</h3>
<p><a href="#/topic/be-queues">Queues &amp; Streaming</a> already covers at-least-once vs exactly-once, the ack model, DLQ concept, outbox, saga and a basic SQS polling loop. Here we go deep on what is <em>AWS-specific</em> and gets probed in interviews:</p>
<ul>
  <li>the exact visibility-timeout and receive-count mechanics;</li>
  <li>FIFO groups and deduplication;</li>
  <li>how the Lambda poller really behaves (batching, scaling, throttling, partial batch failure);</li>
  <li>SNS and EventBridge filtering and their permission gotchas;</li>
  <li>choosing between the four services.</li>
</ul>

<h3>Where it shows up in a typical stack</h3>
<p>Picture an app with Lambda, S3 and SQS. Uploads land in S3, S3 events go to an SQS queue, and a worker Lambda generates thumbnails. Booking changes from meeting-room tablets publish to an SNS topic, which fans out to an email queue, a calendar-sync queue and an analytics queue. In the AI version (<a href="#/topic/cloud-serverless-case">Case Study: Serverless on AWS</a>), a "score this call" job is an SQS message, and <code>MaximumConcurrency</code> keeps the LLM provider's rate limit and the RDS connection count under control.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1: the life of one SQS message</h3>
<div class="diagram">
<pre>
 SendMessage
     │
     ▼
 ┌──────────┐  ReceiveMessage   ┌───────────────────────────┐   DeleteMessage(receiptHandle)
 │ VISIBLE  │ ────────────────► │ IN FLIGHT (invisible)     │ ─────────────────────────────► gone ✔
 │ (queued) │                   │ visibility timeout ticking│
 └──────────┘ ◄──────────────── └───────────────────────────┘
      ▲        timeout expired, no delete
      │        → visible again, ApproximateReceiveCount + 1
      │
      └── when ApproximateReceiveCount &gt; maxReceiveCount on the next receive
          → moved to the DLQ (redrive policy) instead of being delivered again
 (DelaySeconds can hold a new message invisible for up to 15 min before its first delivery)
</pre>
</div>
<p>Key insight: <strong>SQS never knows whether you "succeeded"</strong>. The only success signal is a <code>DeleteMessage</code> before the timeout. A crash, a timeout, or a forgotten delete all look the same: the message comes back.</p>

<h3>Picture 2: what the Lambda event source mapping does for you</h3>
<div class="diagram">
<pre>
  SQS queue ◄── long-poll ── Lambda pollers (managed, invisible to you)
                                  │ gather a batch (BatchSize / MaximumBatchingWindow / 6 MB payload)
                                  ▼
                           invoke your function synchronously with { Records: [...] }
                                  │
           ┌──────────────────────┼─────────────────────────────────────────┐
           ▼                      ▼                                         ▼
   returns normally,       returns { batchItemFailures:             throws / times out
   no failures listed      [{ itemIdentifier: id3 }] }              (or returns garbage)
           │                      │                                         │
   pollers DELETE all      pollers delete all EXCEPT id3;           NOTHING deleted: whole batch
                           id3 reappears after visibility timeout   reappears after the timeout
</pre>
</div>

<h3>Picture 3: fan-out vs routing</h3>
<div class="diagram">
<pre>
 SNS fan-out (same message to every subscriber, optional filters)
   booking-service ──► SNS topic "booking-events"
                          ├─► SQS booking-email      (+DLQ) ──► email Lambda
                          ├─► SQS calendar-sync      (+DLQ) ──► sync Lambda
                          └─► SQS analytics          (+DLQ) ──► Firehose / warehouse

 EventBridge routing (rules match on event CONTENT)
   many services ──► event bus "app-events"
                          ├─ rule: source=app.bookings, detail-type=BookingCancelled ──► SQS, Step Functions
                          ├─ rule: detail.amount &gt; 1000                              ──► fraud Lambda
                          └─ archive (replay last 30 days after a bug fix)
</pre>
</div>

<h3>An analogy that sticks</h3>
<ul>
  <li><strong>SQS</strong> is a to-do tray for one team. Any team member grabs the next card, and it goes back in the tray if they don't finish.</li>
  <li><strong>SNS</strong> is a photocopier with a mailing list. Every subscriber gets a copy immediately, and SNS keeps nothing.</li>
  <li><strong>EventBridge</strong> is a mail-sorting room. It reads the envelope and contents and drops copies into the bins whose rules match.</li>
  <li><strong>Kinesis</strong> is a tape recorder. Everything is recorded in order, and each listener can rewind.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"FIFO means exactly-once, so I don't need idempotency." FIFO deduplicates <em>sends</em> with the same deduplication ID within 5 minutes, and won't hand a message group's next message to anyone while one is in flight. But if your consumer writes to the database and then crashes before the delete, the message is delivered again. The side effect happened twice. <strong>End-to-end exactly-once still needs an idempotent consumer.</strong> FIFO buys ordering, not magic.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Standard vs FIFO</h3>
<table>
  <thead><tr><th></th><th>Standard</th><th>FIFO</th></tr></thead>
  <tbody>
    <tr><td>Delivery</td><td>At-least-once; occasional duplicates even without failures</td><td>No duplicates <em>introduced by SQS</em>; sends deduplicated within a 5-minute window</td></tr>
    <tr><td>Ordering</td><td>Best effort (expect reordering)</td><td>Strict within a <code>MessageGroupId</code>; groups are independent</td></tr>
    <tr><td>Throughput</td><td>Nearly unlimited</td><td>About 300 API calls per second per action (3,000 messages per second with batches of 10). High-throughput mode raises this a lot (check current docs).</td></tr>
    <tr><td>Name</td><td>anything</td><td>must end in <code>.fifo</code></td></tr>
    <tr><td>Per-message delay</td><td>Yes (<code>DelaySeconds</code> per message)</td><td>Queue-level delay only</td></tr>
    <tr><td>DLQ</td><td>Standard DLQ</td><td>Must also be FIFO</td></tr>
    <tr><td>Lambda batch size</td><td>Up to 10,000 (with a batching window)</td><td>Up to 10</td></tr>
  </tbody>
</table>
<p><strong>Rule of thumb:</strong> pick Standard plus idempotent consumers unless ordering per entity is a business requirement, for example "apply booking updates for room 12 in order" or "ledger entries per account". Then pick FIFO with the entity ID as <code>MessageGroupId</code>, so you get parallelism across entities and order within each one.</p>

<h3>2. Message anatomy</h3>
<ul>
  <li><strong>Body:</strong> text (send JSON). The size limit was 256 KiB for years. AWS raised it to 1 MiB in 2025, so check current docs and confirm every hop (SNS, EventBridge, your SDK) accepts the larger size. For anything big, use the <strong>claim-check pattern</strong>: store the payload in S3 and send the key.</li>
  <li><strong>Message attributes:</strong> up to 10 typed key-values (String, Number, Binary). They count toward the size limit. Use them for routing and filtering metadata such as <code>type</code>, <code>tenantId</code> and <code>traceId</code>.</li>
  <li><strong>System attributes you'll read:</strong> <code>ApproximateReceiveCount</code>, <code>SentTimestamp</code>, <code>ApproximateFirstReceiveTimestamp</code>, plus <code>MessageGroupId</code> and <code>SequenceNumber</code> on FIFO queues.</li>
  <li><strong>MessageId</strong> is assigned by SQS at send time. <strong>ReceiptHandle</strong> is issued <em>per receive</em> and is what you delete with. If the message is received again, the old handle is stale. Always delete with the latest one.</li>
</ul>

<h3>3. Visibility timeout</h3>
<ul>
  <li>Default 30 seconds, range 0 seconds to 12 hours. It can be set on the queue, overridden per <code>ReceiveMessage</code>, and extended per message with <code>ChangeMessageVisibility</code> (a heartbeat for long jobs). The 12-hour ceiling counts from the original receive.</li>
  <li><strong>Too short:</strong> the message reappears while the first worker is still processing, so two workers run the same job concurrently.</li>
  <li><strong>Too long:</strong> after a crash, the message sits invisible for the whole timeout before anyone retries, which inflates latency.</li>
  <li><strong>For Lambda consumers:</strong> AWS's guidance is a queue visibility timeout of <strong>at least 6× the function timeout</strong>, plus <code>MaximumBatchingWindowInSeconds</code>. The extra headroom covers retries after throttling and the time a batch waits before the invoke.</li>
</ul>

<h3>4. Long polling, retention, delays</h3>
<ul>
  <li><strong>Short polling</strong> (<code>WaitTimeSeconds=0</code>) queries a subset of servers and can return empty even when messages exist. <strong>Long polling</strong> (1 to 20 seconds) waits for messages and queries all servers. Set <code>ReceiveMessageWaitTimeSeconds=20</code> on the queue so every consumer long-polls by default.</li>
  <li><code>ReceiveMessage</code> returns at most 10 messages per call.</li>
  <li><strong>Retention</strong> is 1 minute to 14 days (default 4 days). Unconsumed messages older than that are deleted silently. Alarm on <code>ApproximateAgeOfOldestMessage</code> long before you get close.</li>
  <li><strong>Delays:</strong> <code>DelaySeconds</code> is 0 to 900 (15 minutes), per queue or per message (Standard only). For "remind me in 24 hours", use EventBridge Scheduler or a scheduled-jobs table, not chained SQS delays.</li>
</ul>

<h3>5. DLQ, redrive and redrive back</h3>
<p>Set the <code>RedrivePolicy</code> attribute on the <strong>source</strong> queue. It's a JSON document passed as a string:</p>
<pre><code class="language-json">{ "deadLetterTargetArn": "arn:aws:sqs:ap-south-1:111122223333:score-jobs-dlq", "maxReceiveCount": "5" }</code></pre>
<ul>
  <li>The DLQ must be the same type as the source (FIFO to FIFO), in the same account and region.</li>
  <li><strong>maxReceiveCount of at least 5</strong> for Lambda consumers. Throttled or failed invocations also increment the receive count, and a low value sends healthy messages to the DLQ during a throttling spike.</li>
  <li><strong>Retention trap:</strong> for Standard queues, a message keeps its <em>original</em> enqueue timestamp when it moves to the DLQ. If the source retention is 4 days and the DLQ's is also 4 days, a message that failed on day 3 expires a day later. Set DLQ retention to the maximum (14 days).</li>
  <li><strong>Redrive back:</strong> after fixing the bug, move messages from the DLQ back to the source (or another queue) with the console's "Start DLQ redrive" or <code>StartMessageMoveTask</code>, rate-limited so you don't flatten the consumer.</li>
  <li><code>RedriveAllowPolicy</code> on the DLQ restricts which source queues may use it.</li>
  <li><strong>Always alarm on the DLQ</strong> (<code>ApproximateNumberOfMessagesVisible</code> greater than 0). A DLQ nobody watches is a slow-motion data-loss bug.</li>
</ul>

<h3>6. FIFO in depth</h3>
<ul>
  <li><strong>MessageGroupId</strong> is the ordering and parallelism unit. Only one batch per group is in flight at a time. Throughput comes from many groups. A single hot group is effectively serial.</li>
  <li><strong>MessageDeduplicationId</strong>: SQS drops a send whose ID it has seen within the last 5 minutes. Set it to a business event ID, or enable <code>ContentBasedDeduplication</code> (SHA-256 of the body), which is risky if the body contains timestamps.</li>
  <li><strong>Head-of-line blocking:</strong> a failing message blocks its whole group until it succeeds or hits the DLQ. Other groups keep flowing.</li>
  <li><strong>High-throughput FIFO</strong> partitions by message group. Spread load over many group IDs, and avoid one constant group like <code>"all"</code>, which serialises everything.</li>
</ul>

<h3>7. Lambda event source mapping (ESM) in depth</h3>
<ul>
  <li><strong>Pollers</strong> long-poll the queue for you. You pay for the Lambda invocations, and SQS still bills the receive requests, including empty ones while the queue is idle.</li>
  <li><strong>Batching:</strong> <code>BatchSize</code> (Standard up to 10,000, FIFO up to 10) and <code>MaximumBatchingWindowInSeconds</code> (up to 300; required when the batch size is over 10). The invoke payload is capped at 6 MB.</li>
  <li><strong>Scaling:</strong> Lambda adds concurrent invocations as the backlog grows, ramping by up to roughly 300 per minute toward a ceiling of about 1,250 per mapping, within account concurrency. These numbers have changed over time, so check current docs. For FIFO, concurrency is limited by the number of active message groups.</li>
  <li><strong>MaximumConcurrency</strong> (on the ESM, minimum 2) caps how many invocations this queue can drive. Use it to protect a database or a third-party rate limit. Don't use reserved concurrency for this: when pollers hit reserved concurrency, invocations are throttled, and those messages go back to the queue and burn receive counts.</li>
  <li><strong>On success</strong> the pollers delete the messages. Your code doesn't call <code>DeleteMessage</code>.</li>
  <li><strong>Partial batch response:</strong> enable <code>FunctionResponseTypes: ["ReportBatchItemFailures"]</code> and return <code>{ batchItemFailures: [{ itemIdentifier: messageId }] }</code>. An empty list means all succeeded. A thrown error means the whole batch failed. A malformed response or unknown ID also means the whole batch failed.</li>
  <li><strong>Filter criteria:</strong> ESM filters can drop messages before invoking. For SQS, <strong>messages that don't match are deleted</strong>, not left in the queue. Never use ESM filtering to "share" one queue between two consumers.</li>
  <li><strong>DLQ location:</strong> for SQS-triggered functions, failures go to the <em>queue's</em> redrive DLQ. Lambda's own async DLQ and on-failure destinations apply to <em>async</em> invocations, not to SQS polling. This is a common interview confusion.</li>
</ul>

<h3>8. Producer side</h3>
<ul>
  <li><code>SendMessageBatch</code> takes up to 10 entries. <strong>HTTP 200 does not mean all succeeded</strong>: check <code>Failed[]</code> and retry those entries (unless <code>SenderFault</code> is true).</li>
  <li>For "write to the DB and send a message" atomically, use the outbox pattern (<a href="#/topic/be-queues">be-queues</a>). For Postgres on RDS, a CDC stream or a relay Lambda can publish outbox rows.</li>
  <li>Producers in a VPC without internet access reach SQS through an interface VPC endpoint.</li>
</ul>

<h3>9. SNS essentials</h3>
<ul>
  <li><strong>Topic → subscriptions:</strong> SQS, Lambda, HTTP(S), email, SMS, mobile push (APNs/FCM), Firehose. For durable processing, prefer <strong>SNS → SQS → consumer</strong> over SNS → Lambda directly. The queue absorbs bursts and outages and gives you batch, DLQ and concurrency control.</li>
  <li><strong>Filter policies</strong> on a subscription match message attributes (default) or the message body (<code>FilterPolicyScope: MessageBody</code>). Non-matching messages are not delivered to that subscription.</li>
  <li><strong>Raw message delivery</strong> for SQS and HTTP subscribers: without it, the SQS body is an SNS envelope JSON with your message as an escaped string inside <code>Message</code>. Consumers then need a double <code>JSON.parse</code>, which is a common bug.</li>
  <li><strong>Permissions:</strong> the SQS queue policy must allow <code>sns.amazonaws.com</code> <code>sqs:SendMessage</code> with <code>aws:SourceArn</code> = topic ARN. If the queue uses a customer-managed KMS key, that key policy must let SNS use it. The AWS-managed <code>aws/sqs</code> key can't be granted to SNS, so the subscription silently delivers nothing.</li>
  <li><strong>Delivery retries</strong> to SQS and Lambda are aggressive and long-running. Configure a <strong>subscription-level DLQ</strong> (redrive policy on the subscription) to catch undeliverable messages, for example when someone deletes the queue or breaks the KMS policy.</li>
  <li><strong>SNS FIFO topics</strong> keep ordering and deduplication end to end into SQS FIFO queues, for ordered fan-out.</li>
</ul>

<h3>10. EventBridge essentials</h3>
<ul>
  <li><strong>Buses:</strong> the default bus (AWS service events, such as S3 "Object Created" when enabled), custom buses (your domain events), and partner buses (SaaS such as Zendesk or Auth0).</li>
  <li><strong>Events</strong> have an envelope: <code>source</code>, <code>detail-type</code>, <code>detail</code> (your JSON), <code>time</code>, <code>account</code>, <code>region</code>. Publish with <code>PutEvents</code> (up to 10 entries per call). As with SQS batches, <strong>check <code>FailedEntryCount</code></strong> and retry failed entries.</li>
  <li><strong>Rules</strong> match with event patterns (exact values, <code>prefix</code>, <code>anything-but</code>, <code>numeric</code>, <code>exists</code>, and more). Each rule has up to 5 targets, and an input transformer can reshape the payload per target.</li>
  <li><strong>Delivery:</strong> at-least-once, with a retry policy (by default up to 24 hours and 185 attempts) and an optional target DLQ (an SQS queue). Unordered.</li>
  <li><strong>Archive &amp; replay:</strong> archive matching events and replay a time window to a bus. This is a great answer to "how do you reprocess after a bug fix?", as long as consumers are idempotent.</li>
  <li><strong>Schema registry</strong> discovers and stores event schemas and can generate code bindings.</li>
  <li><strong>Pipes</strong> connect a source (SQS, Kinesis, DynamoDB Streams and others) through filter, enrich and target steps without glue Lambdas.</li>
  <li><strong>Scheduler</strong> handles one-off and recurring schedules at large scale. Use it for "send the reminder 15 minutes before the meeting" instead of cron tables.</li>
  <li><strong>Latency</strong> is typically higher than SNS (sub-second, but not single-digit ms) and has improved over time, so check current numbers before using it on a tight interactive path.</li>
</ul>

<h3>11. Picking the service: decision guide</h3>
<table>
  <thead><tr><th>Requirement</th><th>Pick</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Background job, one consumer type, retries</td><td>SQS Standard</td><td>Cheapest and simplest, with DLQ and Lambda integration</td></tr>
    <tr><td>Per-entity ordering (per room, per account)</td><td>SQS FIFO with entity as group ID</td><td>Order within an entity, parallelism across entities</td></tr>
    <tr><td>Same event to N independent consumers</td><td>SNS → N SQS queues</td><td>Each consumer gets its own buffer, DLQ and scaling</td></tr>
    <tr><td>Many event types, many teams, content-based routing, SaaS sources</td><td>EventBridge</td><td>Rules instead of code, schema registry, archive and replay</td></tr>
    <tr><td>Delayed or scheduled actions (minutes to months)</td><td>EventBridge Scheduler</td><td>SQS delay maxes out at 15 minutes</td></tr>
    <tr><td>High-volume ordered stream, multiple readers, replay</td><td>Kinesis Data Streams (or MSK/Kafka)</td><td>Log semantics: consumers track positions and can rewind</td></tr>
    <tr><td>Work over 15 minutes, or a multi-step workflow with branching</td><td>SQS + ECS/Fargate worker, or Step Functions</td><td>Lambda's maximum timeout is 15 minutes; orchestration belongs in a workflow engine</td></tr>
  </tbody>
</table>

<h3>12. Security, metrics and cost</h3>
<ul>
  <li><strong>Encryption:</strong> SSE-SQS (SQS-managed keys, the default on new queues) or SSE-KMS (customer-managed key, with the producer and consumer KMS permission gotchas above). Enforce TLS with a queue-policy deny on <code>aws:SecureTransport=false</code>.</li>
  <li><strong>Metrics to alarm on</strong> (more in <a href="#/topic/cloud-cloudwatch">CloudWatch &amp; Observability</a>):
    <ul>
      <li><code>ApproximateAgeOfOldestMessage</code>: backlog age, the best "are we falling behind?" signal;</li>
      <li><code>ApproximateNumberOfMessagesVisible</code>: backlog depth;</li>
      <li><code>ApproximateNumberOfMessagesNotVisible</code>: in flight;</li>
      <li>DLQ visible count above 0;</li>
      <li><code>NumberOfEmptyReceives</code>: a cost smell;</li>
      <li>Lambda <code>Errors</code>, <code>Throttles</code> and <code>Duration</code> near the timeout.</li>
    </ul>
  </li>
  <li><strong>Cost:</strong> billed per request, where each 64 KB chunk of payload counts as one request, and receives and deletes count too. Batching (10 per call) cuts the cost by up to 10×. Long polling avoids paying for empty receives.</li>
</ul>

<h3>13. CLI cheat sheet</h3>
<pre><code class="language-bash"># create a queue + DLQ (attribute values are strings; RedrivePolicy is JSON-in-a-string, easiest from a file)
aws sqs create-queue --queue-name score-jobs-dlq --attributes MessageRetentionPeriod=1209600
aws sqs create-queue --queue-name score-jobs --attributes file://score-jobs-attrs.json

# peek at health
aws sqs get-queue-attributes --queue-url "$QUEUE_URL" \\
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible RedrivePolicy

# send / receive by hand while debugging (long poll, show receive count)
aws sqs send-message --queue-url "$QUEUE_URL" --message-body file://job.json
aws sqs receive-message --queue-url "$QUEUE_URL" --wait-time-seconds 20 \\
  --max-number-of-messages 10 --attribute-names ApproximateReceiveCount

# wire Lambda with partial batch failure + a concurrency cap
aws lambda create-event-source-mapping \\
  --function-name score-call \\
  --event-source-arn arn:aws:sqs:ap-south-1:111122223333:score-jobs \\
  --batch-size 10 --maximum-batching-window-in-seconds 5 \\
  --function-response-types ReportBatchItemFailures \\
  --scaling-config MaximumConcurrency=20

# redrive the DLQ back to its source after a fix, rate-limited
aws sqs start-message-move-task \\
  --source-arn arn:aws:sqs:ap-south-1:111122223333:score-jobs-dlq \\
  --max-number-of-messages-per-second 20</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: Lambda SQS consumer with partial batch failure and idempotency (hand-rolled)</h3>
<p>Scenario: an async "score this call" job. The message is <code>{ callId, rubricVersion, transcriptKey }</code>. The handler must survive duplicates, transient LLM errors and poison messages without retrying the healthy ones.</p>
<pre><code class="language-ts">// worker/scoreCall.ts
import type { SQSEvent, SQSRecord, SQSBatchResponse, SQSBatchItemFailure } from 'aws-lambda';
import { pool } from './db';               // pg Pool with max: 1, via RDS Proxy (see the RDS topic)
import { scoreTranscript, RateLimitedError } from './llm';

type ScoreJob = { callId: string; rubricVersion: number; transcriptKey: string };

class PermanentError extends Error {}      // retrying will never fix it

export const handler = async (event: SQSEvent): Promise&lt;SQSBatchResponse&gt; =&gt; {
  // Standard queue: records are independent, so process them concurrently
  const results = await Promise.allSettled(event.Records.map(processRecord));

  const batchItemFailures: SQSBatchItemFailure[] = [];
  results.forEach((r, i) =&gt; {
    if (r.status === 'rejected') {
      batchItemFailures.push({ itemIdentifier: event.Records[i].messageId });
    }
  });
  return { batchItemFailures };            // [] means "delete everything"
};

async function processRecord(record: SQSRecord): Promise&lt;void&gt; {
  const receiveCount = Number(record.attributes.ApproximateReceiveCount);
  let job: ScoreJob;
  try {
    job = JSON.parse(record.body);
  } catch {
    log('poison_unparseable', record, receiveCount);
    return;                                // ack it: malformed JSON never gets better (or park it in a table)
  }

  // Idempotency on the BUSINESS key. A producer retry creates a NEW messageId for the same job,
  // so messageId alone is not enough.
  const claimed = await pool.query(
    "INSERT INTO score_runs (call_id, rubric_version, status) VALUES ($1, $2, 'running') " +
    "ON CONFLICT (call_id, rubric_version) DO UPDATE SET status = 'running', attempts = score_runs.attempts + 1 " +
    "WHERE score_runs.status = 'failed' " +
    "RETURNING id",
    [job.callId, job.rubricVersion],
  );
  if (claimed.rowCount === 0) {
    const { rows } = await pool.query(
      'SELECT status FROM score_runs WHERE call_id = $1 AND rubric_version = $2',
      [job.callId, job.rubricVersion],
    );
    if (rows[0]?.status === 'done') return;              // duplicate of finished work: ack
    throw new Error('in progress elsewhere');            // let it come back; the other worker may die
  }

  try {
    const result = await scoreTranscript(job);           // S3 read + LLM call
    await pool.query(
      "UPDATE score_runs SET status = 'done', score = $3, details = $4 WHERE call_id = $1 AND rubric_version = $2",
      [job.callId, job.rubricVersion, result.score, JSON.stringify(result.details)],
    );
  } catch (err) {
    const permanent = err instanceof PermanentError;
    await pool.query(
      'UPDATE score_runs SET status = $3, last_error = $4 WHERE call_id = $1 AND rubric_version = $2',
      [job.callId, job.rubricVersion, permanent ? 'failed_permanent' : 'failed', String(err)],
    );
    if (permanent) { log('score_failed_permanent', record, receiveCount, err); return; } // ack, surfaced via DB + alarm
    if (err instanceof RateLimitedError) log('llm_rate_limited', record, receiveCount);
    throw err;                                           // transient: report as failed, retried after visibility timeout
  }
}

function log(msg: string, r: SQSRecord, receiveCount: number, err?: unknown) {
  console.log(JSON.stringify({ msg, messageId: r.messageId, receiveCount, err: err ? String(err) : undefined }));
}</code></pre>
<p>Why it holds up:</p>
<ul>
  <li><strong>Duplicates are harmless:</strong> the unique key <code>(call_id, rubric_version)</code> means only one worker owns a run.</li>
  <li><strong>Transient failures retry only themselves:</strong> the failed message is reported in <code>batchItemFailures</code>, and the rest of the batch is deleted.</li>
  <li><strong>Poison messages don't loop forever:</strong> either they're classified permanent and acked, or they hit <code>maxReceiveCount</code> and land in the DLQ.</li>
  <li><strong>Re-scoring after a rubric change</strong> is just new messages with <code>rubricVersion + 1</code>, which is a new idempotency key.</li>
</ul>

<h3>Example 2: the same thing with Powertools for AWS Lambda</h3>
<pre><code class="language-ts">import { BatchProcessor, EventType, processPartialResponse } from '@aws-lambda-powertools/batch';
import type { SQSEvent, SQSRecord, Context } from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);

const recordHandler = async (record: SQSRecord): Promise&lt;void&gt; =&gt; {
  const job = JSON.parse(record.body);
  await scoreIdempotently(job);            // throw to mark THIS record as failed
};

export const handler = async (event: SQSEvent, context: Context) =&gt;
  processPartialResponse(event, recordHandler, processor, { context });</code></pre>
<p>Powertools builds the <code>batchItemFailures</code> response for you. It also has an idempotency utility (DynamoDB-backed) and a FIFO-aware processor. Check its current docs for class names and options. Mention it in interviews: it shows you know the hand-rolled version and the production library.</p>

<h3>Example 3: FIFO consumer that preserves order on failure</h3>
<pre><code class="language-ts">// Room-booking updates, MessageGroupId = roomId. A later update must never apply before an earlier failed one.
export const handler = async (event: SQSEvent): Promise&lt;SQSBatchResponse&gt; =&gt; {
  const batchItemFailures: SQSBatchItemFailure[] = [];
  for (let i = 0; i &lt; event.Records.length; i++) {
    try {
      await applyBookingUpdate(JSON.parse(event.Records[i].body));   // sequential on purpose
    } catch (err) {
      // fail this record AND every record after it, so nothing later in the group runs first
      for (const r of event.Records.slice(i)) batchItemFailures.push({ itemIdentifier: r.messageId });
      break;
    }
  }
  return { batchItemFailures };
};</code></pre>

<h3>Example 4: producer with SendMessageBatch that handles partial failure</h3>
<pre><code class="language-ts">import { SQSClient, SendMessageBatchCommand, SendMessageCommand, type SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});
const sleep = (ms: number) =&gt; new Promise((r) =&gt; setTimeout(r, ms));

export async function enqueueScoreJobs(queueUrl: string, jobs: ScoreJob[]) {
  for (let i = 0; i &lt; jobs.length; i += 10) {                       // max 10 entries per call
    let pending: SendMessageBatchRequestEntry[] = jobs.slice(i, i + 10).map((job, j) =&gt; ({
      Id: String(j),                                                 // unique within this batch only
      MessageBody: JSON.stringify(job),
      MessageAttributes: { type: { DataType: 'String', StringValue: 'score_call' } },
    }));

    for (let attempt = 0; pending.length &gt; 0; attempt++) {
      if (attempt === 5) throw new Error('SendMessageBatch still failing for ' + pending.length + ' entries');
      const res = await sqs.send(new SendMessageBatchCommand({ QueueUrl: queueUrl, Entries: pending }));
      const failed = res.Failed ?? [];                               // HTTP 200 can still contain failures
      const senderFaults = failed.filter((f) =&gt; f.SenderFault);
      if (senderFaults.length) throw new Error('rejected entries: ' + JSON.stringify(senderFaults));
      const retryIds = new Set(failed.map((f) =&gt; f.Id));
      pending = pending.filter((e) =&gt; retryIds.has(e.Id));
      if (pending.length) await sleep(100 * 2 ** attempt);
    }
  }
}

// FIFO send: group = ordering unit, dedup id = business event id
export async function publishRoomUpdate(fifoUrl: string, evt: { eventId: string; roomId: string }) {
  await sqs.send(new SendMessageCommand({
    QueueUrl: fifoUrl,
    MessageBody: JSON.stringify(evt),
    MessageGroupId: 'room#' + evt.roomId,
    MessageDeduplicationId: evt.eventId,                             // duplicates within 5 min are dropped
  }));
}</code></pre>

<h3>Example 5: infrastructure (CDK): queue, DLQ, ESM, alarms</h3>
<pre><code class="language-ts">import { Duration } from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

const FN_TIMEOUT_S = 120;

const dlq = new sqs.Queue(this, 'ScoreJobsDlq', {
  retentionPeriod: Duration.days(14),               // max: give humans time to look
  enforceSSL: true,
});

const queue = new sqs.Queue(this, 'ScoreJobs', {
  visibilityTimeout: Duration.seconds(6 * FN_TIMEOUT_S),   // at least 6x the function timeout
  retentionPeriod: Duration.days(4),
  receiveMessageWaitTime: Duration.seconds(20),             // long polling for non-Lambda consumers
  deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
  enforceSSL: true,
});

scoreFn.addEventSource(new SqsEventSource(queue, {
  batchSize: 10,
  maxBatchingWindow: Duration.seconds(5),
  reportBatchItemFailures: true,
  maxConcurrency: 20,                               // protects RDS connections and the LLM rate limit
}));

dlq.metricApproximateNumberOfMessagesVisible().createAlarm(this, 'ScoreDlqNotEmpty', {
  threshold: 0,
  evaluationPeriods: 1,
  comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD,
});
queue.metricApproximateAgeOfOldestMessage().createAlarm(this, 'ScoreBacklogOld', {
  threshold: 15 * 60,                               // jobs waiting more than 15 minutes
  evaluationPeriods: 3,
});</code></pre>
<p>Other IaC tools (SAM, Terraform) are compared in <a href="#/topic/cloud-cicd">CI/CD &amp; Infrastructure as Code</a>.</p>

<h3>Example 6: SNS fan-out with filter policies (booking events)</h3>
<pre><code class="language-ts">import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
const sns = new SNSClient({});

await sns.send(new PublishCommand({
  TopicArn: process.env.BOOKING_TOPIC_ARN,
  Message: JSON.stringify({ bookingId, roomId, tenantId, startsAt, cancelledBy }),
  MessageAttributes: {
    eventType: { DataType: 'String', StringValue: 'BookingCancelled' },
    site:      { DataType: 'String', StringValue: 'blr-tower-2' },
  },
}));</code></pre>
<p>Filter policy on the <code>booking-email</code> subscription (file <code>filter.json</code>):</p>
<pre><code class="language-json">{
  "eventType": ["BookingCancelled", "BookingCreated"],
  "site": [{ "prefix": "blr-" }]
}</code></pre>
<pre><code class="language-bash">aws sns subscribe --topic-arn arn:aws:sns:ap-south-1:111122223333:booking-events \\
  --protocol sqs --notification-endpoint arn:aws:sqs:ap-south-1:111122223333:booking-email \\
  --return-subscription-arn
aws sns set-subscription-attributes --subscription-arn "$SUB_ARN" \\
  --attribute-name RawMessageDelivery --attribute-value true
aws sns set-subscription-attributes --subscription-arn "$SUB_ARN" \\
  --attribute-name FilterPolicy --attribute-value file://filter.json</code></pre>
<p>The queue policy that lets the topic deliver:</p>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowBookingTopic",
      "Effect": "Allow",
      "Principal": { "Service": "sns.amazonaws.com" },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:ap-south-1:111122223333:booking-email",
      "Condition": { "ArnEquals": { "aws:SourceArn": "arn:aws:sns:ap-south-1:111122223333:booking-events" } }
    }
  ]
}</code></pre>

<h3>Example 7: EventBridge: publish a domain event, route it with a rule</h3>
<pre><code class="language-ts">import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
const eb = new EventBridgeClient({});

const res = await eb.send(new PutEventsCommand({
  Entries: [{
    EventBusName: 'app-events',
    Source: 'app.bookings',
    DetailType: 'BookingCancelled',
    Detail: JSON.stringify({ bookingId, roomId: 'blr-12', tenantId, refundAmount: 1500 }),
  }],
}));
if (res.FailedEntryCount) {
  // each Entries[i] result has ErrorCode/ErrorMessage when it failed: retry those (or outbox them)
  throw new Error('PutEvents partial failure: ' + JSON.stringify(res.Entries));
}</code></pre>
<pre><code class="language-json">{
  "source": ["app.bookings"],
  "detail-type": ["BookingCancelled"],
  "detail": {
    "roomId": [{ "prefix": "blr-" }],
    "tenantId": [{ "anything-but": ["internal-test"] }],
    "refundAmount": [{ "numeric": ["&gt;", 1000] }]
  }
}</code></pre>
<pre><code class="language-bash">aws events put-rule --name large-refund-cancellations --event-bus-name app-events \\
  --event-pattern file://pattern.json
aws events put-targets --rule large-refund-cancellations --event-bus-name app-events \\
  --targets file://targets.json   # SQS target + RetryPolicy + DeadLetterConfig</code></pre>
<pre><code class="language-json">[
  {
    "Id": "refund-review-queue",
    "Arn": "arn:aws:sqs:ap-south-1:111122223333:refund-review",
    "RetryPolicy": { "MaximumRetryAttempts": 20, "MaximumEventAgeInSeconds": 3600 },
    "DeadLetterConfig": { "Arn": "arn:aws:sqs:ap-south-1:111122223333:refund-review-eb-dlq" }
  }
]</code></pre>

<h3>Example 8: long-running worker on ECS that extends visibility (heartbeat)</h3>
<pre><code class="language-ts">import { ReceiveMessageCommand, ChangeMessageVisibilityCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

while (!shuttingDown) {
  const { Messages = [] } = await sqs.send(new ReceiveMessageCommand({
    QueueUrl, MaxNumberOfMessages: 1, WaitTimeSeconds: 20, VisibilityTimeout: 120,
    MessageSystemAttributeNames: ['ApproximateReceiveCount'],
  }));
  for (const msg of Messages) {
    // extend visibility every 60s while a 40-minute video transcode runs (beyond Lambda's 15-min max)
    const heartbeat = setInterval(() =&gt; {
      sqs.send(new ChangeMessageVisibilityCommand({ QueueUrl, ReceiptHandle: msg.ReceiptHandle!, VisibilityTimeout: 120 }))
        .catch((e) =&gt; console.error('heartbeat_failed', e));
    }, 60_000);
    try {
      await transcode(JSON.parse(msg.Body!));
      await sqs.send(new DeleteMessageCommand({ QueueUrl, ReceiptHandle: msg.ReceiptHandle! }));
    } catch (err) {
      console.error('job_failed', err);    // no delete: it comes back, and the DLQ catches repeat offenders
    } finally {
      clearInterval(heartbeat);
    }
  }
}</code></pre>
<p>On SIGTERM (Fargate scale-in or deploy), stop receiving, let in-flight work finish within the stop timeout, or set visibility to 0 so another worker picks the job up immediately.</p>

<h3>Example 9: the claim-check pattern for big payloads</h3>
<pre><code class="language-ts">// Producer: payload to S3, pointer to SQS
const key = 'payloads/' + jobId + '.json';
await s3.send(new PutObjectCommand({ Bucket: PAYLOAD_BUCKET, Key: key, Body: JSON.stringify(bigPayload) }));
await sqs.send(new SendMessageCommand({ QueueUrl, MessageBody: JSON.stringify({ jobId, payloadKey: key }) }));

// Consumer: fetch by key; a lifecycle rule expires payloads/ after N days</code></pre>
<p>This keeps messages small, cheap and well under any size limit. The payload bucket follows the rules in <a href="#/topic/cloud-s3">S3</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Healthy messages end up in the DLQ during a spike</h3>
<p>Lambda throttles (account concurrency exhausted, or reserved concurrency set low). The poller already received the messages, so they return after the visibility timeout with their receive count incremented. With <code>maxReceiveCount: 1</code> or 2, they land in the DLQ without ever running. <strong>Fix:</strong> <code>maxReceiveCount</code> of at least 5, cap concurrency with ESM <code>MaximumConcurrency</code> instead of reserved concurrency, and keep the visibility timeout at 6× the function timeout.</p>

<h3>2. Visibility timeout shorter than processing time</h3>
<p>The message reappears while worker A is still running, and worker B starts the same job, so you get double emails and double LLM spend. This is common when someone raises the Lambda timeout and forgets the queue. <strong>Fix:</strong> derive the queue's visibility timeout from the function timeout in IaC (as in the CDK example), and heartbeat long jobs.</p>

<h3>3. One poison message keeps retrying the whole batch</h3>
<p>Without <code>ReportBatchItemFailures</code>, any throw fails all 10 records. Nine good messages re-run with it and pile up receive counts. <strong>Fix:</strong> enable partial batch responses, or use batch size 1 for very expensive, non-idempotent work.</p>

<h3>4. Returning the wrong identifier</h3>
<p><code>itemIdentifier</code> must be the record's <code>messageId</code>. Returning a business ID, an empty string or a malformed response makes Lambda treat the <strong>entire</strong> batch as failed.</p>

<h3>5. Catching everything and returning success</h3>
<p>A broad <code>try/catch</code> that logs and returns <code>{ batchItemFailures: [] }</code> deletes failed messages. That's silent data loss, and no DLQ will ever show it. Every caught error must be either reported as a failure or deliberately parked somewhere durable.</p>

<h3>6. FIFO head-of-line blocking</h3>
<p>One failing message in group <code>room#12</code> blocks every later message for room 12 until it succeeds or reaches the DLQ. Other rooms flow. If your group ID is a constant, the whole queue is blocked. Pick a group key at the finest granularity where order matters.</p>

<h3>7. FIFO deduplication is only 5 minutes</h3>
<p>A producer that retries the same event 10 minutes later creates a duplicate. The window is a convenience, not an idempotency strategy. Consumers still dedupe on a business key.</p>

<h3>8. ESM filters delete non-matching messages</h3>
<p>Someone adds a filter <code>{"body": {"type": ["score_call"]}}</code> to "only handle score jobs" on a queue that also carries <code>rescore_call</code> messages. Those messages are deleted by the poller, never processed and never DLQ'd. Use separate queues (or SNS/EventBridge routing) per consumer type.</p>

<h3>9. SNS envelope vs raw delivery</h3>
<p>Without raw message delivery, the SQS body is <code>{"Type":"Notification","Message":"{\\"bookingId\\":...}",...}</code>. Code that does one <code>JSON.parse</code> gets the envelope, and <code>body.bookingId</code> is undefined. Turn on raw delivery, or parse <code>Message</code> again. Also, S3 events delivered via SNS to SQS are double-wrapped.</p>

<h3>10. KMS-encrypted queue silently receives nothing</h3>
<p>SNS, S3 or EventBridge can't encrypt into a queue protected by a customer-managed key unless the key policy grants that service principal <code>kms:GenerateDataKey</code> and <code>kms:Decrypt</code>. The subscription "works" in the console, but no messages arrive. Check the KMS key policy and the publisher's delivery failure metrics.</p>

<h3>11. Partial failure on batch sends</h3>
<p><code>SendMessageBatch</code> and EventBridge <code>PutEvents</code> return 200 with a <code>Failed[]</code> list or <code>FailedEntryCount</code>. Code that only checks for exceptions loses those events. Always inspect per-entry results.</p>

<h3>12. Batching window adds latency</h3>
<p><code>MaximumBatchingWindowInSeconds = 60</code> improves efficiency but means a lone message can wait up to a minute before invocation. For user-visible jobs ("your report is generating"), keep the window at 0 to a few seconds.</p>

<h3>13. DLQ messages expire before anyone looks</h3>
<p>Standard-queue messages keep their original enqueue time in the DLQ, so a short DLQ retention can expire them almost immediately after they arrive. Set DLQ retention to 14 days and alarm on its depth.</p>

<h3>14. Deleting with a stale receipt handle</h3>
<p>If processing outlived the visibility timeout and the message was received again elsewhere, deleting with the first receipt handle may fail or not prevent the second delivery. Track and use the newest handle. The real fix is a correct timeout plus idempotency.</p>

<h3>15. Noisy tenant starves others</h3>
<p>One tenant enqueues 200,000 jobs, and everyone else's jobs wait behind them in a Standard queue. Options:</p>
<ul>
  <li>a queue per tier or tenant class;</li>
  <li>per-tenant concurrency tokens in the consumer;</li>
  <li>FIFO with tenant as the message group, so groups are served fairly;</li>
  <li>SQS's newer "fair queues" feature for Standard queues, which uses a message group ID to reduce noisy-neighbour dwell time (check current docs for availability and behaviour).</li>
</ul>

<h3>16. Purge and recreate delays</h3>
<p><code>PurgeQueue</code> can be called once every 60 seconds, and messages sent just before a purge may survive it. After deleting a queue, wait about 60 seconds before creating one with the same name. Both cause confusing CI and test flakiness.</p>

<h3>17. Lambda's 15-minute ceiling</h3>
<p>Jobs that might exceed Lambda's max timeout (long transcodes, giant LLM batches) need ECS/Fargate workers with heartbeats, or splitting into smaller messages, or Step Functions. More on limits in <a href="#/topic/cloud-lambda">AWS Lambda</a>.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1: no DLQ, or a DLQ with no alarm</h3>
<p>Without a DLQ, a poison message retries until retention expires, wasting compute and then vanishing. With an unwatched DLQ, failures pile up quietly for 14 days and then vanish. <strong>Fix:</strong> every queue gets a DLQ with 14-day retention, an alarm on visible messages above 0, and a runbook with redrive steps.</p>

<h3>Anti-pattern 2: throwing on any error in a batch handler</h3>
<p>One bad record retries ten. <strong>Fix:</strong> <code>ReportBatchItemFailures</code> plus per-record try/catch, or Powertools' batch processor.</p>

<h3>Anti-pattern 3: non-idempotent consumer</h3>
<p>"Send email", "charge card" or "increment counter" executed on every delivery means duplicates reach customers. <strong>Fix:</strong> a unique constraint or conditional write on a business key, or a processed-events table checked in the same transaction as the side effect.</p>

<h3>Anti-pattern 4: multiple consumer types on one queue</h3>
<p>Two services polling one queue <em>compete</em>; they don't each get a copy. Each service sees a random half of the messages. <strong>Fix:</strong> fan out with SNS or EventBridge, one queue per consumer.</p>

<h3>Anti-pattern 5: FIFO everywhere "to be safe"</h3>
<p>Lower throughput, head-of-line blocking, constant group IDs that serialise everything, and you still need idempotency. <strong>Fix:</strong> default to Standard. Use FIFO only for real per-entity ordering needs.</p>

<h3>Anti-pattern 6: reserved concurrency as the throttle for an SQS consumer</h3>
<p>Throttled invokes push messages back with higher receive counts, which leads to spurious DLQ entries and latency spikes. <strong>Fix:</strong> <code>MaximumConcurrency</code> on the event source mapping.</p>

<h3>Anti-pattern 7: big payloads inside messages</h3>
<p>Full transcripts or base64 audio in the body hit size limits, raise cost (billed per 64 KB chunk), and leak sensitive data into DLQs and logs. <strong>Fix:</strong> claim check, with the data in S3 and a key in the message.</p>

<h3>Anti-pattern 8: short polling in a hot loop</h3>
<p>Thousands of empty receives per minute is a bill with no work done. <strong>Fix:</strong> long polling (20 seconds) at the queue level.</p>

<h3>Anti-pattern 9: SNS → Lambda directly for critical work</h3>
<p>SNS invokes Lambda asynchronously, so you get no batch control, no concurrency cap tied to the backlog, and failures depend on async retry plus on-failure destination configuration. <strong>Fix:</strong> SNS → SQS → Lambda, with a DLQ at both the subscription and the queue.</p>

<h3>Anti-pattern 10: using a queue as a database</h3>
<p>Peeking messages to "check job status", or expecting to look up a message by ID. Queues don't support queries. <strong>Fix:</strong> job state lives in a table (pending, running, done, failed) that the API reads. The queue only carries "work to do".</p>

<h3>Anti-pattern 11: ignoring per-entry batch send failures</h3>
<p><code>SendMessageBatch</code> and <code>PutEvents</code> partial failures are silently dropped events. <strong>Fix:</strong> inspect and retry failed entries, and use an outbox for must-not-lose events.</p>

<h3>Anti-pattern 12: publishing after the DB commit, without an outbox</h3>
<p>The process crashes between commit and publish, and the event is lost forever. Publishing before commit instead can emit an event for a rolled-back transaction. <strong>Fix:</strong> transactional outbox plus a relay (see <a href="#/topic/be-queues">be-queues</a> and <a href="#/topic/be-event-driven">Event-Driven Systems</a>).</p>

<h3>Anti-pattern 13: EventBridge for a high-volume internal hot path</h3>
<p>Millions of events per hour between two components owned by the same team, with no routing needs, at roughly twice SQS/SNS per-message cost and higher latency. <strong>Fix:</strong> SQS directly, or Kinesis for streams. Use EventBridge where routing, decoupling across teams, SaaS integration or replay earn their price.</p>

<h3>Anti-pattern 14: chaining 15-minute delays for long schedules</h3>
<p>Re-enqueueing a message with <code>DelaySeconds=900</code> 96 times to wait a day is fragile and expensive. <strong>Fix:</strong> EventBridge Scheduler (one-time schedule) or a <code>due_at</code> column with a periodic sweeper.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Standard vs FIFO queues: how do you choose?</div>
  <div class="qa-answer">
    <p>Standard gives at-least-once delivery with occasional duplicates, best-effort order, and effectively unlimited throughput. FIFO gives strict order within a <code>MessageGroupId</code>, deduplication of sends within a 5-minute window, and lower throughput (about 300 calls per second per action, 3,000 messages per second with batching, much higher in high-throughput mode). I default to Standard plus idempotent consumers. I pick FIFO only when the business needs per-entity order, such as booking updates per room or ledger entries per account, and then I use the entity ID as the group so different entities still process in parallel. FIFO doesn't remove the need for idempotency, because a consumer crash after a side effect still causes redelivery.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Explain the visibility timeout. How do you size it for a Lambda consumer?</div>
  <div class="qa-answer">
    <p>When a consumer receives a message, SQS hides it for the visibility timeout rather than deleting it. The consumer must <code>DeleteMessage</code> before the timeout ends, or the message becomes visible again with its receive count incremented. Too short and two workers process the same job concurrently. Too long and retries after a crash are slow. For Lambda, AWS recommends a visibility timeout of at least 6× the function timeout plus the batching window, so throttling retries and batch waits don't make in-flight messages reappear. For long jobs outside Lambda, I heartbeat with <code>ChangeMessageVisibility</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Walk me through how Lambda consumes SQS, and what happens when one message in a batch of 10 fails.</div>
  <div class="qa-answer">
    <p>The event source mapping runs managed pollers that long-poll the queue, collect a batch (by batch size, batching window and the 6 MB payload limit), and invoke my function synchronously. If the function returns successfully, the pollers delete every message in the batch. If it throws or times out, nothing is deleted, and all 10 messages reappear after the visibility timeout. That's the default, and it retries the 9 good ones too. With <code>ReportBatchItemFailures</code> enabled, I catch per record and return <code>{ batchItemFailures: [{ itemIdentifier: messageId }] }</code>, so only the failed one is retried. An empty list means all succeeded, and an invalid ID fails the whole batch. After <code>maxReceiveCount</code> receives, the message goes to the queue's redrive DLQ. Not Lambda's async DLQ, which doesn't apply to polling.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How exactly do you make an SQS consumer idempotent?</div>
  <div class="qa-answer">
    <p>Pick an idempotency key from the <strong>business meaning</strong> of the work, not the SQS <code>messageId</code>, because a producer retry creates a new message with a new ID. For call scoring the key is <code>(callId, rubricVersion)</code>. Then make the side effect conditional on that key, atomically:</p>
    <ul>
      <li>in Postgres, a unique constraint plus <code>INSERT ... ON CONFLICT</code>, ideally in the same transaction as the write;</li>
      <li>in DynamoDB, a conditional put with <code>attribute_not_exists</code>;</li>
      <li>for external APIs, pass an idempotency key if the provider supports one (payment APIs usually do).</li>
    </ul>
    <p>A duplicate finds the key already <code>done</code> and acks. A duplicate that finds it <code>running</code> fails and retries later, in case the owner died. Powertools' idempotency utility packages this pattern with DynamoDB.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. SQS vs SNS vs EventBridge vs Kinesis: pick for each. (a) send receipts, (b) one booking event drives email, calendar sync and analytics, (c) route refund events above ₹1,000 to a fraud team's account, (d) 20k telemetry events per second from tablets that two teams analyse independently.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>(a)</strong> SQS Standard with a DLQ. It's a single consumer type of background work.</li>
      <li><strong>(b)</strong> SNS topic → three SQS queues, one per consumer, with filter policies if some only care about some event types. Each consumer scales and fails independently.</li>
      <li><strong>(c)</strong> EventBridge: a rule with a <code>numeric</code> pattern on <code>detail.refundAmount</code>, targeting a cross-account bus or queue. Content-based routing across team boundaries is what EventBridge is for, and archive and replay help audits.</li>
      <li><strong>(d)</strong> Kinesis Data Streams (or MSK). Each team's consumer tracks its own position, data is ordered per partition key (device ID), and either team can replay after a bug. SQS would need a copy per team and loses replay.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. A marketing push enqueues 100,000 jobs, and each job writes to RDS. How do you avoid melting the database?</div>
  <div class="qa-answer">
    <p>The queue already decouples arrival rate from processing rate. I just need to cap the processing rate:</p>
    <ul>
      <li>Set <code>MaximumConcurrency</code> on the ESM, for example 20, so at most 20 function instances (and therefore about 20 DB connections with a pool size of 1) are active.</li>
      <li>Connect through RDS Proxy so connections are pooled and survive failovers (see <a href="#/topic/cloud-rds">RDS</a>).</li>
      <li>Batch DB writes inside each invocation (multi-row inserts).</li>
      <li>Alarm on <code>ApproximateAgeOfOldestMessage</code> so we know if the cap is too low for the SLA.</li>
    </ul>
    <p>The backlog drains in a predictable time: jobs ÷ (concurrency × jobs per second per instance). I'd state that number to the business. Reserved concurrency is the wrong lever, because it throttles invocations and pushes messages toward the DLQ.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Messages are in the DLQ. What's your process?</div>
  <div class="qa-answer">
    <ol>
      <li>The alarm fires on DLQ depth above 0.</li>
      <li>Sample messages with <code>receive-message</code>, without deleting, and correlate their message IDs with logs (structured logs include <code>messageId</code> and receive count).</li>
      <li>Classify each failure as a code bug, bad data, or a downstream outage.</li>
      <li>Fix forward (deploy), or repair the data.</li>
      <li>Redrive with <code>StartMessageMoveTask</code> at a limited rate back to the source queue. This is safe only because consumers are idempotent.</li>
      <li>Truly invalid messages are archived to S3 and deleted, with a note.</li>
    </ol>
    <p>Two config checks: DLQ retention is at least as long as the source (Standard messages keep their original timestamp), and <code>maxReceiveCount</code> is high enough (5 or more) that throttling spikes don't push healthy messages there.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do FIFO queues behave with Lambda? What limits throughput?</div>
  <div class="qa-answer">
    <p>Lambda delivers each message group in order and keeps at most one batch per group in flight, so concurrency is bounded by the number of active groups. FIFO batch size is at most 10. If a message fails, I fail it and every later record in the batch (or Powertools' FIFO processor does this), so nothing in that group jumps ahead. Then the group is blocked until the message succeeds or reaches the DLQ. Throughput therefore depends on group-key cardinality: <code>roomId</code> gives parallelism across rooms, while a constant group ID gives a single-threaded queue. Deduplication is by <code>MessageDeduplicationId</code> within 5 minutes, and I still dedupe in the consumer.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Why doesn't SQS Standard offer exactly-once delivery?</div>
  <div class="qa-answer">
    <p>Standard queues store copies of each message on multiple servers for durability and availability. If one server is unavailable when you receive or delete, a copy can be delivered again later. More fundamentally, the queue can't know whether your side effect happened: the delete is a separate call that can fail after your DB commit. Exactly-once delivery across a network boundary isn't achievable in general. The pragmatic answer is at-least-once delivery plus idempotent processing, which gives exactly-once <em>effects</em>. FIFO narrows the window by deduplicating sends and serialising groups, but it doesn't change that end-to-end argument.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. FDE scenario: a customer says "some calls get scored twice, and some never get scored at all." How do you debug it?</div>
  <div class="qa-answer">
    <p><strong>Scored twice</strong> (duplicates):</p>
    <ul>
      <li>Compare the queue's visibility timeout with the Lambda timeout and p99 duration. Did someone raise the function timeout?</li>
      <li>Check whether the handler throws for the whole batch (no partial batch response), so successful records re-run.</li>
      <li>Check whether the producer retries <code>SendMessage</code> on timeouts, creating duplicate messages.</li>
      <li>Check whether the consumer's idempotency key is the <code>messageId</code> instead of <code>callId + rubricVersion</code>.</li>
      <li>Evidence: logs keyed by callId showing two runs, with receive count above 1 or different message IDs.</li>
    </ul>
    <p><strong>Never scored</strong> (losses):</p>
    <ul>
      <li>Check the DLQ depth and retention (expired DLQ messages).</li>
      <li>Look for an ESM filter that deletes non-matching messages, and a catch-all that returns success.</li>
      <li>Check <code>SendMessageBatch</code> or <code>PutEvents</code> partial failures ignored by the producer.</li>
      <li>Look for an upstream event that never fired: S3 notification misconfigured, KMS policy blocking delivery, or a missing outbox.</li>
    </ul>
    <p>I'd reconcile: a query listing calls uploaded but without a score run, cross-referenced with DLQ contents and producer logs. Then fix, add a reconciliation job that re-enqueues orphans, add alarms on DLQ depth and oldest-message age, and give the customer a written root cause plus the backfill plan.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Your job payload is 3 MB, and you need to run a task 48 hours from now. What do you do?</div>
  <div class="qa-answer">
    <p>For the payload, use the claim-check pattern: write the payload to S3 and send a small message with the key. SQS bodies were capped at 256 KiB for years (raised in 2025; check current docs), and big messages cost more because billing is per 64 KB chunk. A lifecycle rule cleans up old payloads. For the delay, SQS <code>DelaySeconds</code> maxes out at 15 minutes, and visibility tricks top out at 12 hours. Use EventBridge Scheduler with a one-time schedule targeting the queue or function, or store <code>due_at</code> in a table and run a sweeper every minute. The table also makes cancellation trivial ("user cancelled the meeting, so drop the reminder").</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How would you reprocess the last 3 days of events after fixing a scoring bug?</div>
  <div class="qa-answer">
    <p>It depends on the source:</p>
    <ul>
      <li><strong>EventBridge</strong> with an archive: start a replay for the time window to the bus, ideally to a rule that targets only the fixed consumer.</li>
      <li><strong>Kinesis:</strong> reset that consumer's position to a timestamp three days ago, if it's within retention.</li>
      <li><strong>SQS:</strong> once messages are deleted they're gone, so replay has to come from the source of truth. Query the DB for affected calls and re-enqueue jobs, possibly with a new <code>rubricVersion</code> so the idempotency key differs and old results are kept for comparison.</li>
    </ul>
    <p>In every case, consumers must be idempotent, and I'd rate-limit the replay (ESM <code>MaximumConcurrency</code>) so it doesn't starve live traffic.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You say "at-least-once plus idempotent consumer" without being prompted, and key idempotency on business IDs.</li>
    <li>You size the visibility timeout from the function timeout (6×) and set maxReceiveCount to 5 or more.</li>
    <li>You use <code>ReportBatchItemFailures</code> and know what an empty, missing or invalid response does.</li>
    <li>You cap consumers with ESM <code>MaximumConcurrency</code>, not reserved concurrency.</li>
    <li>You fan out with SNS → SQS, one queue per consumer, and know about the raw delivery and KMS gotchas.</li>
    <li>You can justify EventBridge (routing, cross-team, replay, scheduler) and Kinesis (ordered replayable stream).</li>
    <li>You alarm on DLQ depth and on <code>ApproximateAgeOfOldestMessage</code>.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Trace one SQS message from send to redrive, naming the setting or attribute that drives each step.</div>
  <div class="qa-answer">
    <p><strong>Send:</strong> SQS assigns a <code>MessageId</code>; <code>DelaySeconds</code> (up to 15 minutes) can keep it invisible before first delivery, and <code>MessageRetentionPeriod</code> (1 minute to 14 days, default 4) bounds its life. <strong>Receive:</strong> the consumer long-polls (<code>WaitTimeSeconds</code> up to 20) and gets a <code>ReceiptHandle</code> for this receive; the message is now in flight, hidden for the <strong>visibility timeout</strong>. <strong>Success:</strong> <code>DeleteMessage</code> with the latest receipt handle removes it. <strong>Failure:</strong> no delete before the timeout means it becomes visible again and <code>ApproximateReceiveCount</code> goes up by one.</p>
    <p><strong>DLQ:</strong> once <code>ApproximateReceiveCount</code> exceeds <code>maxReceiveCount</code> in the queue's <code>RedrivePolicy</code>, the next receive moves it to the dead-letter queue instead. <strong>Redrive:</strong> after fixing the bug, <code>StartMessageMoveTask</code> moves it back to the source queue at a controlled rate, which is safe only because consumers are idempotent.</p>
  </div>
</div>
` },

  ]
});
