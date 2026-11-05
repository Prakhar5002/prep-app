window.PREP_SITE.registerTopic({
  id: "cloud-lambda",
  module: "cloud",
  title: "AWS Lambda",
  estimatedReadTime: "45 min",
  tags: ["aws","lambda","serverless","cold-starts","concurrency","event-source-mapping","idempotency","powertools","cdk","sam"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Lambda is a <strong>stateless, one-request-per-environment worker</strong> that AWS clones on demand — <strong>init once, invoke many, scale by concurrency (RPS × duration), retry by invocation type</strong> — so keep init lean, cap concurrency in front of fragile dependencies, and make every handler idempotent.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Split of duties:</strong> AWS owns servers, OS, runtime patching and scaling; you own code, configuration and <strong>failure semantics</strong>. Billed per request + per ms of memory-time.</li>
    <li><strong>Lifecycle:</strong> INIT (download, VM, runtime, your module-scope code; 10 s limit) → many INVOKEs (frozen between) → SHUTDOWN. Module scope = per-environment cache: put SDK clients and config there.</li>
    <li><strong>Concurrency ≈ RPS × average duration</strong> (200 RPS × 250 ms = 50 environments). Default 1,000 per region (soft, shared). Scales roughly 1,000 more every 10 s per function. Slow downstreams multiply concurrency.</li>
    <li><strong>Limits:</strong> 15 min timeout; 128 MB–10 GB memory; CPU scales with memory (~1 vCPU at 1,769 MB); 6 MB sync payload; 250 MB unzipped / 10 GB image; 4 KB env vars; 5 layers; <code>/tmp</code> up to 10 GB.</li>
    <li><strong>Invocation models:</strong> sync — caller retries; async — 2 retries, up to 6 h, then destination/DLQ; poll (SQS/streams) — source-driven retries, partial batch responses, streams block per shard.</li>
    <li><strong>Cold starts:</strong> shrink bundle, modular SDK, lazy imports, light init, more memory; then provisioned concurrency (paid, alias) or SnapStart (Java/Python/.NET). Measure <code>Init Duration</code> at p99.</li>
    <li><strong>Reserved = guarantee + cap (free); provisioned = pre-initialized (paid).</strong> For SQS consumers use ESM max concurrency rather than low reserved concurrency.</li>
    <li><strong>SQS rule:</strong> visibility timeout ≥ 6 × function timeout; enable <code>ReportBatchItemFailures</code>; DLQ + alarm.</li>
    <li><strong>Timeouts top-down:</strong> client &gt; API Gateway &gt; Lambda &gt; SDK calls; use <code>getRemainingTimeInMillis()</code>.</li>
    <li><strong>At-least-once</strong> for async and ESM → idempotency keys + conditional writes (Powertools idempotency).</li>
    <li><strong>Secrets:</strong> Secrets Manager / Parameter Store, fetched at init, cached with TTL; not plain env vars.</li>
    <li><strong>Safe deploys:</strong> versions + alias + CodeDeploy canary with alarm rollback.</li>
    <li><strong>Pricing:</strong> $0.20/M requests + GB-seconds at 1 ms granularity; arm64 cheaper; you pay for time spent waiting on I/O.</li>
    <li><strong>Wrong tool for:</strong> &gt;15 min work, steady 24/7 heavy traffic, long-lived connections, GPU, connection-hungry DBs without a proxy.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Treating retries as rare and handlers as run-once.</strong> Async events retry, SQS redelivers after the visibility timeout, API clients retry after a 504 while the function is still running — so the same booking, charge or LLM call executes twice. Fix: timeouts that shrink inward, an idempotency key with a conditional write on every side effect, and partial batch responses for queues.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Concurrency is roughly requests per second times duration, so a slow downstream doesn't just add latency — it eats the account's concurrency and throttles unrelated functions. I cap concurrency in front of fragile dependencies and buffer with SQS."</div>
  <div class="revision-say">"Async and queue-driven Lambdas are at-least-once, so every side-effecting handler gets an idempotency key and a conditional write — Powertools' idempotency utility does this with DynamoDB."</div>
  <div class="revision-say">"I fix cold starts in order: smaller bundle, lighter init, more memory — and only then pay for provisioned concurrency on an alias, scaled to business hours."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What Lambda is</h3>
<p>Functions-as-a-Service: you upload a handler (a zip or a container image), connect it to an event source, and AWS runs it when events arrive — from zero to thousands of parallel copies and back to zero. You never see a server, an autoscaling group or an OS.</p>

<h3>Why teams pick it</h3>
<ul>
  <li><strong>Scale to zero.</strong> No traffic, no compute bill. Ideal for spiky, bursty or low-volume workloads: internal APIs, webhooks, nightly jobs, file processing.</li>
  <li><strong>Native event glue.</strong> S3 uploads, SQS messages, EventBridge events, Cognito sign-ups, DynamoDB changes all trigger Lambda with no polling code.</li>
  <li><strong>Operational load near zero.</strong> No patching, no capacity planning, built-in multi-AZ, logs and metrics out of the box.</li>
  <li><strong>Fine-grained isolation.</strong> One function per job means one IAM role per job — least privilege falls out of the architecture.</li>
</ul>

<h3>A realistic picture: the mobile app backend</h3>
<p>A typical React Native app backend on AWS: API Gateway → Lambda handlers for REST endpoints; the app uploads media straight to S3 with a presigned URL; an S3 event triggers a processing Lambda; heavy work (transcription, LLM scoring) goes through SQS to a worker Lambda with capped concurrency; a scheduled Lambda cleans up expired records (for example, releasing meeting-room bookings nobody checked in to). Each piece scales independently and costs almost nothing at night.</p>

<h3>Where Lambda shines vs where it hurts</h3>
<table>
  <thead><tr><th>Great fit</th><th>Poor fit</th></tr></thead>
  <tbody>
    <tr><td>Spiky HTTP APIs with idle periods</td><td>Steady high-throughput APIs running 24/7 (containers become cheaper)</td></tr>
    <tr><td>Event processing: S3, SQS, EventBridge, streams</td><td>Jobs longer than 15 minutes (use Fargate, Batch, or Step Functions to split them)</td></tr>
    <tr><td>Glue and automation (Cognito triggers, cron jobs, webhooks)</td><td>Long-lived connections (socket servers, gRPC streams)</td></tr>
    <tr><td>Fan-out parallel work (thousands of small tasks)</td><td>GPU inference, large in-memory caches, heavyweight native runtimes</td></tr>
    <tr><td>Teams who want minimal ops</td><td>Strict, low p99 latency with unpredictable bursts and no budget for provisioned concurrency</td></tr>
  </tbody>
</table>

<h3>Lambda vs the alternatives</h3>
<table>
  <thead><tr><th></th><th>Lambda</th><th>ECS on Fargate</th><th>EC2</th></tr></thead>
  <tbody>
    <tr><td>Unit of scale</td><td>Single request per environment</td><td>Task (container) serving many requests</td><td>Instance</td></tr>
    <tr><td>Scale to zero</td><td>Yes, natively</td><td>Possible, but not instant</td><td>No</td></tr>
    <tr><td>Max duration</td><td>15 minutes</td><td>Unlimited</td><td>Unlimited</td></tr>
    <tr><td>Billing</td><td>Requests + GB-seconds (1 ms granularity)</td><td>vCPU + memory per second while running</td><td>Instance hours</td></tr>
    <tr><td>Cold start</td><td>Yes (ms to seconds)</td><td>Task start: tens of seconds</td><td>Minutes</td></tr>
    <tr><td>Ops burden</td><td>Lowest</td><td>Medium (images, task defs, LB)</td><td>Highest</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — the execution environment lifecycle</h3>
<div class="diagram">
<pre>
 first request arrives, no free environment
        │
        ▼
 ┌──────────────────────────── INIT (cold start, once per environment) ────────────────────────────┐
 │ download code → start micro-VM → extensions init → runtime init → YOUR module-scope code runs  │
 │ (imports, new S3Client(), read config, open DB connection)            ≤ 10 s, then times out    │
 └──────────────────────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
 INVOKE #1  handler(event, context)  ──►  response        environment FROZEN between requests
 INVOKE #2  handler(...)  (warm: module scope, /tmp, open sockets all still there)
 INVOKE #3  ...
        │
        ▼
 SHUTDOWN  (idle for a while, or AWS recycles it — you get no guarantee of lifetime)
</pre>
</div>
<p>Everything in the module scope is a per-environment cache: great for SDK clients and parsed config, dangerous for anything user-specific.</p>

<h3>Picture 2 — concurrency is environments-in-use</h3>
<div class="diagram">
<pre>
 time ─────────────────────────────────────────────────►
 env A  [req1──][req4─][req7────]        [req11]
 env B     [req2────────][req8─]
 env C       [req3─][req5──][req9──]
 env D              [req6───────────]  ← burst needed a 4th env → a cold start

 concurrency at any instant = number of busy environments
 rule of thumb (Little's law):  concurrency ≈ RPS × average duration (s)
   100 RPS × 0.2 s  = 20      100 RPS × 2 s = 200     ← slow downstreams multiply concurrency
</pre>
</div>
<p>This is why a slow database or LLM call does not just make requests slow — it makes you run out of concurrency, which then makes <em>other</em> functions in the account throttle.</p>

<h3>Picture 3 — the three invocation models</h3>
<div class="diagram">
<pre>
 SYNC (RequestResponse)          ASYNC (Event)                       POLL (event source mapping)
 API GW / ALB / Function URL     S3 / SNS / EventBridge              SQS / Kinesis / DynamoDB Streams / Kafka
        │                               │                                    │
        ▼                               ▼                                    ▼
   Lambda ──► result to caller     Lambda internal queue               Lambda pollers read batches
   errors → caller decides         ├─ invoke, on error retry ×2        ├─ invoke with batch
            whether to retry       ├─ events kept up to 6 h            ├─ SQS: failed msgs reappear after
                                   └─ then on-failure destination/DLQ  │   visibility timeout → DLQ
                                                                       └─ streams: retry blocks the shard
</pre>
</div>

<h3>Picture 4 — memory is the only CPU dial</h3>
<p>You do not choose vCPUs. CPU, network bandwidth and (for some workloads) cost-per-request all scale with the memory setting. Around 1,769 MB you get one full vCPU; at the 10,240 MB maximum, up to 6 vCPUs. A CPU-bound function at 128 MB can be so slow that raising memory makes it <em>cheaper</em>, because duration falls faster than the per-ms price rises.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Lambda is stateless, so module-scope variables reset every request." They do not — warm invocations reuse the same process. That is a feature (connection reuse, caches) and a bug source (a module-level <code>let currentUser</code> leaks one user's data into the next request). Treat module scope as a shared cache that must never hold request-specific state.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Handler anatomy (Node.js / TypeScript)</h3>
<pre><code class="language-ts">import type { Context, SQSEvent } from 'aws-lambda';   // types from @types/aws-lambda
import { S3Client } from '@aws-sdk/client-s3';

// ── INIT: runs once per execution environment ─────────────────────
const s3 = new S3Client({});                 // reused across warm invocations
const BUCKET = process.env.BUCKET_NAME!;      // read config once

// ── INVOKE: runs per event ───────────────────────────────────────
export const handler = async (event: SQSEvent, context: Context) =&gt; {
  // context.awsRequestId           → correlation id for logs
  // context.getRemainingTimeInMillis() → budget left before the timeout kills you
  // context.functionName / functionVersion / memoryLimitInMB
  for (const record of event.Records) {
    if (context.getRemainingTimeInMillis() &lt; 5_000) throw new Error('out of time, let SQS retry');
    // ... work
  }
};</code></pre>
<ul>
  <li>Use <code>async</code> handlers and <strong>await everything</strong>. When the returned promise settles the environment is frozen; un-awaited work pauses mid-flight and may resume during the <em>next</em> request — or never.</li>
  <li>Throwing marks the invocation as failed (the retry behaviour depends on the invocation model). For API Gateway, return a proper 4xx/5xx response object instead of throwing.</li>
</ul>

<h3>2. Configuration knobs and their limits</h3>
<table>
  <thead><tr><th>Setting</th><th>Range / limit (at time of writing)</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Memory</td><td>128 MB – 10,240 MB (1 MB steps)</td><td>Also sets CPU and network share</td></tr>
    <tr><td>Timeout</td><td>1 s – 900 s (15 min)</td><td>Hard limit; set it below your caller's timeout</td></tr>
    <tr><td>Ephemeral storage (<code>/tmp</code>)</td><td>512 MB default, up to 10,240 MB</td><td>Persists across warm invocations of one environment only</td></tr>
    <tr><td>Architecture</td><td>x86_64 or arm64 (Graviton)</td><td>arm64 is cheaper per GB-second; native binaries must match</td></tr>
    <tr><td>Package size</td><td>50 MB zipped (direct upload), 250 MB unzipped incl. layers; 10 GB container image</td><td>Bigger code = slower cold start</td></tr>
    <tr><td>Layers</td><td>Up to 5 per function</td><td>Count toward the 250 MB unzipped limit</td></tr>
    <tr><td>Environment variables</td><td>4 KB total</td><td>Encrypted at rest with KMS; still visible to anyone with <code>GetFunctionConfiguration</code></td></tr>
    <tr><td>Sync payload</td><td>6 MB request and 6 MB response</td><td>Response streaming lifts the response cap (check current docs)</td></tr>
    <tr><td>Async payload</td><td>256 KB historically; AWS has raised it — check current docs</td><td>Pass S3 keys, not files</td></tr>
    <tr><td>Init phase</td><td>10 s</td><td>Heavy init beyond this fails the cold start</td></tr>
    <tr><td>Account concurrency</td><td>1,000 per region default (soft)</td><td>Shared by every function in the account and region</td></tr>
  </tbody>
</table>

<h3>3. Cold starts — what they are and what actually helps</h3>
<p>A cold start happens whenever a request needs an environment that does not exist yet: first request after deploy, after idle, or during a burst. Its cost is code download + VM start + runtime start + <em>your</em> init code. The REPORT log line tells you:</p>
<pre><code class="language-text">REPORT RequestId: 4f1c...  Duration: 38.12 ms  Billed Duration: 39 ms  Memory Size: 1024 MB
       Max Memory Used: 112 MB  Init Duration: 412.55 ms      ← present only on cold starts</code></pre>
<table>
  <thead><tr><th>Mitigation</th><th>How it helps</th><th>Trade-off</th></tr></thead>
  <tbody>
    <tr><td><strong>Bundle and tree-shake</strong> (esbuild via CDK <code>NodejsFunction</code> / SAM)</td><td>Less code to download and parse; often the biggest single win for Node</td><td>Source maps needed for readable stack traces</td></tr>
    <tr><td><strong>Modular SDK v3 clients</strong></td><td>Import <code>@aws-sdk/client-s3</code>, not a monolithic SDK</td><td>—</td></tr>
    <tr><td><strong>Lazy-load rare paths</strong></td><td><code>await import('./pdf')</code> only on the route that needs it</td><td>First call on that path pays the cost</td></tr>
    <tr><td><strong>Do less in init</strong></td><td>Defer non-essential network calls; cache secrets with a TTL</td><td>—</td></tr>
    <tr><td><strong>More memory</strong></td><td>More CPU makes init faster</td><td>Higher per-ms price (often neutral overall)</td></tr>
    <tr><td><strong>Provisioned concurrency</strong></td><td>N environments kept initialized; no cold start up to N</td><td>Billed while configured; needs a version/alias; scale it on a schedule or utilization</td></tr>
    <tr><td><strong>SnapStart</strong></td><td>Snapshots the initialized environment at publish time and restores it</td><td>Java, Python and .NET (not Node.js at time of writing); restored state must re-seed randomness and reconnect</td></tr>
    <tr><td><strong>Avoid VPC unless needed</strong></td><td>Modern VPC networking adds little, but NAT/endpoints add complexity</td><td>RDS and ElastiCache require it</td></tr>
    <tr><td>Keep-warm pings (scheduled invocations)</td><td>Keeps one environment warm</td><td>Does nothing for bursts beyond one; mostly superseded by provisioned concurrency</td></tr>
  </tbody>
</table>
<p>Typical numbers: well-bundled Node.js functions usually cold start in a few hundred milliseconds; heavy JVM functions without SnapStart can take seconds. Measure your own with the <code>Init Duration</code> field — and remember cold starts are usually a small percentage of invocations, so look at p99, not p50. Also note AWS bills the init phase (standardized for all functions in 2025 — check current pricing), so heavy init now costs money as well as latency.</p>

<h3>4. Concurrency controls</h3>
<table>
  <thead><tr><th>Control</th><th>What it does</th><th>Use it to</th></tr></thead>
  <tbody>
    <tr><td><strong>Account concurrency quota</strong></td><td>Ceiling for all functions in a region</td><td>Raise ahead of launches; it is shared, so one runaway function can starve the rest</td></tr>
    <tr><td><strong>Reserved concurrency</strong></td><td>Carves out N for a function — both a guarantee and a <em>maximum</em>; free</td><td>Protect a fragile downstream (DB, rate-limited LLM API); cap cost; set to 0 as an emergency off-switch</td></tr>
    <tr><td><strong>Provisioned concurrency</strong></td><td>N pre-initialized environments on a version/alias; paid</td><td>Remove cold starts on latency-critical paths</td></tr>
    <tr><td><strong>SQS event source max concurrency</strong></td><td>Caps how many concurrent invocations one SQS mapping drives</td><td>Throttle a queue consumer <em>without</em> the throttling side-effects of reserved concurrency</td></tr>
  </tbody>
</table>
<p><strong>Scaling rate:</strong> each function can scale up by about 1,000 concurrent executions every 10 seconds (the model AWS introduced in late 2023), up to the account limit. When you hit a limit you are <strong>throttled</strong>: synchronous callers get HTTP 429 (<code>TooManyRequestsException</code>); async events are retried internally for up to the max event age; SQS pollers back off and messages return to the queue.</p>

<h3>5. Invocation models in detail</h3>
<table>
  <thead><tr><th></th><th>Synchronous</th><th>Asynchronous</th><th>Poll-based (event source mapping)</th></tr></thead>
  <tbody>
    <tr><td>Sources</td><td>API Gateway, ALB, Function URLs, Cognito triggers, SDK <code>Invoke</code></td><td>S3, SNS, EventBridge, SDK <code>InvocationType=Event</code></td><td>SQS, Kinesis, DynamoDB Streams, MSK/Kafka, Amazon MQ</td></tr>
    <tr><td>Who retries</td><td>The caller (API Gateway does not retry for you)</td><td>Lambda: 2 retries by default (configurable 0–2), with backoff</td><td>Lambda's pollers, governed by the source</td></tr>
    <tr><td>How long</td><td>Caller's timeout</td><td>Max event age up to 6 hours</td><td>SQS: until <code>maxReceiveCount</code> → DLQ. Streams: until success, record expiry, or configured max retries</td></tr>
    <tr><td>Failures go to</td><td>The caller</td><td>On-failure destination (SQS, SNS, Lambda, EventBridge) or a DLQ</td><td>SQS redrive DLQ; stream on-failure destination</td></tr>
    <tr><td>Ordering</td><td>n/a</td><td>None</td><td>SQS FIFO per message group; streams per shard / partition</td></tr>
  </tbody>
</table>
<p>Prefer <strong>destinations</strong> over the older function-level DLQ for async invocations: destinations carry the error details and the original event, and support success routing too.</p>
<pre><code class="language-bash"># Async: no retries, drop events older than 1 hour, send failures to a queue
aws lambda put-function-event-invoke-config \\
  --function-name thumbnailer \\
  --maximum-retry-attempts 0 \\
  --maximum-event-age-in-seconds 3600 \\
  --destination-config '{"OnFailure":{"Destination":"arn:aws:sqs:ap-south-1:111111111111:thumbnailer-failures"}}'</code></pre>

<h3>6. SQS as an event source (the most common worker pattern)</h3>
<ul>
  <li><strong>Batch size</strong> 1–10 by default; standard queues allow up to 10,000 with a <strong>batching window</strong> (wait up to N seconds to fill a batch). FIFO queues max 10.</li>
  <li><strong>Visibility timeout ≥ 6 × function timeout</strong> (AWS guidance) so a message is not redelivered while a slow invocation — including throttle retries — is still working on it.</li>
  <li><strong>Partial batch failure:</strong> enable <code>ReportBatchItemFailures</code> and return the failed message IDs; otherwise one bad message makes the whole batch reappear and reprocess.</li>
  <li><strong>Filtering:</strong> event filter patterns drop messages before they invoke (and bill) your function.</li>
  <li><strong>Max concurrency</strong> on the mapping caps parallelism cleanly; reserved concurrency set lower than the pollers' demand causes throttled receives that still burn <code>maxReceiveCount</code> and can push healthy messages to the DLQ.</li>
</ul>
<p>Queue semantics themselves (visibility, DLQ, FIFO, fan-out) are covered in <a href="#/topic/cloud-sqs">SQS (+ SNS / EventBridge)</a> and <a href="#/topic/be-queues">Queues</a>.</p>

<h3>7. Timeouts: budget them top-down</h3>
<div class="diagram">
<pre>
 client (mobile) 30 s ─► API Gateway 29 s-class limit ─► Lambda timeout 10 s ─► SDK/HTTP call 3 s × 2 attempts
 each layer's timeout must be SHORTER than the layer above it, or the outer layer gives up
 while the inner one keeps working (and keeps billing, and may still commit side effects)
</pre>
</div>
<pre><code class="language-ts">import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';

const ddb = new DynamoDBClient({
  maxAttempts: 2,
  requestHandler: new NodeHttpHandler({ connectionTimeout: 1_000, requestTimeout: 3_000 }),
});

// For third-party HTTP calls, derive the budget from what is left:
const budgetMs = Math.max(500, context.getRemainingTimeInMillis() - 1_000);
const res = await fetch(url, { signal: AbortSignal.timeout(budgetMs) });</code></pre>
<p>Retry and backoff patterns are covered in depth in <a href="#/topic/be-resilience">Resilience</a>.</p>

<h3>8. Packaging, layers, extensions, containers</h3>
<ul>
  <li><strong>Bundle with esbuild</strong> (CDK <code>NodejsFunction</code>, SAM <code>BuildMethod: esbuild</code>). The Node.js managed runtimes include an AWS SDK v3, but pinning and bundling your own version makes behaviour reproducible; excluding it shrinks the bundle. Pick one deliberately.</li>
  <li><strong>Layers</strong> share code or binaries (ffmpeg, a compiled image library) across functions. Node modules in a layer must live under <code>nodejs/node_modules</code>; contents mount at <code>/opt</code>. Downsides: hidden version drift, harder local testing. With a bundler, prefer bundling app dependencies and keep layers for binaries and vendor extensions.</li>
  <li><strong>Extensions</strong> run alongside your function in the same environment (observability agents, the Parameters and Secrets extension). They add to init time and memory.</li>
  <li><strong>Container images</strong> (up to 10 GB) suit large ML or native dependencies and teams already building images. Same execution model, same limits otherwise.</li>
</ul>

<h3>9. Configuration and secrets</h3>
<table>
  <thead><tr><th>Option</th><th>Good for</th><th>Watch out</th></tr></thead>
  <tbody>
    <tr><td>Environment variables</td><td>Non-secret config: table names, queue URLs, feature flags</td><td>4 KB limit; visible to anyone who can read function config; change = new config deploy</td></tr>
    <tr><td>SSM Parameter Store</td><td>Config and simple secrets (SecureString), hierarchical paths</td><td>API throughput limits — cache, do not fetch per request</td></tr>
    <tr><td>Secrets Manager</td><td>Credentials with rotation (DB passwords, API keys)</td><td>Per-secret monthly cost + per-API-call cost; cache with a TTL</td></tr>
    <tr><td>Parameters and Secrets Lambda Extension / Powertools Parameters</td><td>Built-in caching with TTL</td><td>Extension adds init time; the Powertools utility is a library alternative</td></tr>
  </tbody>
</table>
<p>Fetch secrets at init (or lazily on first use) and cache them with a TTL so rotation is picked up within minutes. Never log them; never put them in plain environment variables if your threat model includes people with read access to function configuration.</p>

<h3>10. Versions, aliases and safe deploys</h3>
<ul>
  <li><code>$LATEST</code> is mutable. Publishing creates an immutable numbered <strong>version</strong>.</li>
  <li>An <strong>alias</strong> (<code>live</code>) points at a version and can split traffic by weight (e.g. 90% v41, 10% v42). Event sources and API Gateway should target the alias.</li>
  <li><strong>CodeDeploy</strong> (via SAM <code>DeploymentPreference</code> or CDK <code>LambdaDeploymentGroup</code>) shifts the alias gradually and rolls back automatically when CloudWatch alarms fire.</li>
  <li>Provisioned concurrency attaches to a version or alias, never <code>$LATEST</code>.</li>
</ul>

<h3>11. Idempotency</h3>
<p>Async invocations and event source mappings deliver <strong>at least once</strong>: retries, SQS redelivery after a visibility timeout, duplicate S3 notifications. Any handler with side effects (charging, emailing, creating a booking, calling a paid LLM API) needs a deduplication key and a record of "already done". Use a natural key (S3 object key + version/ETag, SQS message ID, a client-supplied <code>Idempotency-Key</code> header) and a conditional write — or Powertools' idempotency utility, which stores the result in DynamoDB and replays it for duplicates (Example 4).</p>

<h3>12. Observability in one paragraph</h3>
<p>Every invocation emits START/END/REPORT lines to CloudWatch Logs; built-in metrics include Invocations, Errors, Throttles, Duration, ConcurrentExecutions, and IteratorAge (streams). Add structured JSON logs with the request ID, custom metrics via Embedded Metric Format, and X-Ray / OpenTelemetry tracing. Powertools for AWS Lambda (TypeScript) packages Logger, Metrics and Tracer. Set log retention — the default is never expire. Details in <a href="#/topic/cloud-cloudwatch">CloudWatch &amp; Observability</a>.</p>

<h3>13. Pricing</h3>
<p>At time of writing (us-east-1; check current pricing): <strong>$0.20 per million requests</strong> plus <strong>about $0.0000166667 per GB-second</strong> on x86 (arm64 is roughly 20% cheaper), billed per millisecond. The always-free tier includes 1 million requests and 400,000 GB-seconds per month. Provisioned concurrency, ephemeral storage above 512 MB and data transfer are billed separately.</p>
<pre><code class="language-text">API function: 3,000,000 req/month × 120 ms × 0.5 GB  = 180,000 GB-s   → inside the free tier
              requests: 3M × $0.20/M                   = $0.60

LLM scoring worker: 50,000 calls × 90 s × 1.5 GB      = 6,750,000 GB-s
              arm64 ≈ $0.0000133/GB-s                  ≈ $90/month
              ...and most of those 90 s are spent WAITING on the LLM API.</code></pre>
<p>That second line is the classic insight: <strong>Lambda bills wall-clock time, including time spent waiting on I/O</strong>. Long waits on external services are where Step Functions callbacks, batching, or a container worker can be cheaper.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — HTTP API handler with validation and clean errors</h3>
<pre><code class="language-ts">// src/handlers/create-booking.ts
import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));   // init once
const TABLE = process.env.BOOKINGS_TABLE!;

const Body = z.object({
  roomId: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event, context) =&gt; {
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;

  let raw: unknown;
  try { raw = JSON.parse(event.body ?? '{}'); }
  catch { return json(400, { error: 'invalid_json' }); }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json(400, { error: 'invalid_body', issues: parsed.error.issues });

  const item = { pk: 'ROOM#' + parsed.data.roomId, sk: parsed.data.start, ...parsed.data, userId };
  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: 'attribute_not_exists(pk)',   // same room + same start = conflict
    }));
  } catch (err) {
    if ((err as Error).name === 'ConditionalCheckFailedException') return json(409, { error: 'slot_taken' });
    console.error(JSON.stringify({ level: 'error', msg: 'put_failed', requestId: context.awsRequestId, err: String(err) }));
    return json(500, { error: 'internal', requestId: context.awsRequestId });   // no stack traces to clients
  }
  return json(201, item);
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}</code></pre>
<p>This only catches exact-slot collisions; real interval-overlap detection and double-booking under concurrency are worked through in <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>.</p>

<h3>Example 2 — S3 upload → processing (and how not to loop forever)</h3>
<pre><code class="language-ts">import type { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const OUT_BUCKET = process.env.THUMBS_BUCKET!;    // a DIFFERENT bucket (or at least prefix)

export const handler = async (event: S3Event) =&gt; {
  for (const rec of event.Records) {
    const bucket = rec.s3.bucket.name;
    // keys arrive URL-encoded, with spaces as "+"
    const key = decodeURIComponent(rec.s3.object.key.replace(/\\+/g, ' '));
    if (!key.startsWith('uploads/')) continue;     // belt-and-braces recursion guard

    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const bytes = await obj.Body!.transformToByteArray();
    const thumb = await makeThumbnail(bytes);      // e.g. sharp — native build must match arm64/x86

    await s3.send(new PutObjectCommand({
      Bucket: OUT_BUCKET,
      Key: key.replace(/^uploads\\//, 'thumbs/'),
      Body: thumb,
      ContentType: 'image/jpeg',
    }));
  }
};
declare function makeThumbnail(input: Uint8Array): Promise&lt;Uint8Array&gt;;</code></pre>
<p>Writing output back into the same bucket and prefix that triggers the function creates an infinite loop. Lambda has recursive-loop detection for some services (it stops the chain after roughly 16 hops — check current docs for which sources), but design it out: separate bucket or a prefix filter on the notification. S3 notifications are async and at-least-once, so the work should be idempotent (overwriting the same thumbnail key is naturally idempotent).</p>

<h3>Example 3 — SQS worker with partial batch failures</h3>
<pre><code class="language-ts">import type { SQSEvent, SQSBatchResponse } from 'aws-lambda';

export const handler = async (event: SQSEvent): Promise&lt;SQSBatchResponse&gt; =&gt; {
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];

  for (const record of event.Records) {
    try {
      const job = JSON.parse(record.body) as { callId: string; s3Key: string };
      await scoreCall(job);                         // idempotent by callId (see Example 4)
    } catch (err) {
      console.error(JSON.stringify({ msg: 'job_failed', messageId: record.messageId, err: String(err) }));
      batchItemFailures.push({ itemIdentifier: record.messageId });
      // FIFO queue? stop here and also report every remaining record, to preserve ordering.
    }
  }
  return { batchItemFailures };   // only these return to the queue; the rest are deleted
};
declare function scoreCall(job: { callId: string; s3Key: string }): Promise&lt;void&gt;;</code></pre>
<p>Requires <code>ReportBatchItemFailures</code> on the event source mapping. Without it, a single poison message makes the whole batch reappear until every message hits <code>maxReceiveCount</code> and lands in the DLQ together.</p>

<h3>Example 4 — idempotent handler with Powertools</h3>
<pre><code class="language-ts">import { makeIdempotent, IdempotencyConfig } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({ tableName: process.env.IDEMPOTENCY_TABLE! });
const config = new IdempotencyConfig({
  eventKeyJmesPath: 'headers."idempotency-key"',   // client sends Idempotency-Key per logical action
  expiresAfterSeconds: 24 * 60 * 60,
});

const createPayment = async (event: APIGatewayProxyEventV2, _context: Context) =&gt; {
  const body = JSON.parse(event.body ?? '{}');
  const payment = await chargeCard(body);         // the side effect we must not repeat
  return { statusCode: 201, body: JSON.stringify(payment) };
};

export const handler = makeIdempotent(createPayment, { persistenceStore, config });
declare function chargeCard(input: unknown): Promise&lt;{ id: string }&gt;;</code></pre>
<p>First call: the utility writes an "in progress" record, runs the function, stores the result. A duplicate with the same key returns the stored result without charging again; a concurrent duplicate gets an "already in progress" error instead of a double charge. The same idea by hand is a DynamoDB <code>PutItem</code> with <code>attribute_not_exists</code> on the key before doing the work.</p>

<h3>Example 5 — secrets cached at init with a TTL</h3>
<pre><code class="language-ts">import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const sm = new SecretsManagerClient({});
const TTL_MS = 5 * 60_000;
let cache: { value: string; at: number } | undefined;

export async function llmApiKey(): Promise&lt;string&gt; {
  if (cache &amp;&amp; Date.now() - cache.at &lt; TTL_MS) return cache.value;
  const res = await sm.send(new GetSecretValueCommand({ SecretId: process.env.LLM_KEY_SECRET_ARN! }));
  cache = { value: res.SecretString!, at: Date.now() };
  return cache.value;
}

// Library alternative:  import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
//                       const key = await getSecret('prod/llm-key', { maxAge: 300 });</code></pre>

<h3>Example 6 — CDK: worker + API with the right knobs</h3>
<pre><code class="language-ts">import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as appscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

// ── Queue worker ─────────────────────────────────────────────
const dlq = new sqs.Queue(this, 'ScoringDlq', { retentionPeriod: Duration.days(14) });
const queue = new sqs.Queue(this, 'ScoringQueue', {
  visibilityTimeout: Duration.seconds(6 * 120),        // ≥ 6 × the function timeout
  deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
});

const scorer = new NodejsFunction(this, 'Scorer', {
  entry: 'src/handlers/score-call.ts',
  runtime: lambda.Runtime.NODEJS_22_X,                  // check currently supported runtimes
  architecture: lambda.Architecture.ARM_64,
  memorySize: 1536,
  timeout: Duration.seconds(120),
  tracing: lambda.Tracing.ACTIVE,
  environment: { NODE_OPTIONS: '--enable-source-maps', POWERTOOLS_SERVICE_NAME: 'scorer' },
  bundling: { minify: true, sourceMap: true },
});
scorer.addEventSource(new SqsEventSource(queue, {
  batchSize: 5,
  maxBatchingWindow: Duration.seconds(10),
  reportBatchItemFailures: true,
  maxConcurrency: 20,                                    // protects the LLM provider's rate limit
}));

// ── Latency-sensitive API function ───────────────────────────
const api = new NodejsFunction(this, 'BookingsApi', {
  entry: 'src/handlers/create-booking.ts',
  runtime: lambda.Runtime.NODEJS_22_X,
  architecture: lambda.Architecture.ARM_64,
  memorySize: 1024,
  timeout: Duration.seconds(10),                         // well under API Gateway's limit
});
const live = new lambda.Alias(this, 'Live', {
  aliasName: 'live',
  version: api.currentVersion,
  provisionedConcurrentExecutions: 2,
});
const pc = live.addAutoScaling({ minCapacity: 2, maxCapacity: 20 });
pc.scaleOnUtilization({ utilizationTarget: 0.7 });
pc.scaleOnSchedule('OfficeHours', {
  schedule: appscaling.Schedule.cron({ hour: '3', minute: '30' }),   // 09:00 IST in UTC
  minCapacity: 10,
});</code></pre>

<h3>Example 7 — SAM: canary deploy with automatic rollback</h3>
<pre><code class="language-yaml">Resources:
  BookingsFn:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs22.x
      Architectures: [arm64]
      Handler: index.handler
      CodeUri: dist/
      MemorySize: 1024
      Timeout: 10
      AutoPublishAlias: live                 # publish a version + move the alias each deploy
      DeploymentPreference:
        Type: Canary10Percent5Minutes        # 10% for 5 minutes, then 100%
        Alarms:
          - !Ref BookingsErrorAlarm          # alarm fires → CodeDeploy rolls the alias back
      Events:
        CreateBooking:
          Type: HttpApi
          Properties:
            Path: /bookings
            Method: post</code></pre>

<h3>Example 8 — scheduled cleanup job</h3>
<pre><code class="language-ts">import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

// Every 5 minutes: release bookings nobody checked in to within the grace period.
new events.Rule(this, 'ReleaseNoShows', {
  schedule: events.Schedule.rate(Duration.minutes(5)),
  targets: [new targets.LambdaFunction(releaseNoShowsFn)],
});</code></pre>
<p>Scheduled invocations are async: make the job idempotent (a run may overlap the next or be retried) and bounded (query only what changed since the last window). EventBridge Scheduler is the newer option for one-off and per-tenant schedules at scale.</p>

<h3>Example 9 — streaming LLM tokens through a Function URL</h3>
<pre><code class="language-ts">// Function URL configured with InvokeMode: RESPONSE_STREAM
declare const awslambda: any;   // global provided by the Node.js runtime

export const handler = awslambda.streamifyResponse(async (event: any, responseStream: any) =&gt; {
  responseStream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode: 200,
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
  const prompt = JSON.parse(event.body ?? '{}').prompt as string;
  for await (const token of streamCompletion(prompt)) {
    responseStream.write('data: ' + JSON.stringify({ token }) + '\\n\\n');
  }
  responseStream.end();
});
declare function streamCompletion(prompt: string): AsyncIterable&lt;string&gt;;</code></pre>
<p>Streaming improves time-to-first-token and lifts the 6 MB buffered-response cap. Check current docs for which front doors support streaming (Function URLs do; API Gateway support has been evolving). Protect the URL — <code>AuthType: AWS_IAM</code> behind CloudFront, or validate a token in code. See <a href="#/topic/ai-llm-integration">LLM Integrations</a>.</p>

<h3>Example 10 — everyday CLI</h3>
<pre><code class="language-bash"># Invoke synchronously and see the result (CLI v2 needs the binary-format flag for raw JSON)
aws lambda invoke --function-name create-booking \\
  --cli-binary-format raw-in-base64-out \\
  --payload '{"body":"{}"}' out.json &amp;&amp; cat out.json

# Account concurrency limit and how much is unreserved
aws lambda get-account-settings

# Emergency off-switch: no new invocations at all
aws lambda put-function-concurrency --function-name scorer --reserved-concurrent-executions 0

# Pre-warm 10 environments on the live alias
aws lambda put-provisioned-concurrency-config --function-name create-booking \\
  --qualifier live --provisioned-concurrent-executions 10

# Tail logs while testing
aws logs tail /aws/lambda/create-booking --follow</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. The caller times out, the function keeps going</h3>
<p>API Gateway gives up at its integration timeout and returns 504, but a Lambda with a 60 s timeout keeps running, keeps billing, and may still commit the booking. The client retries and you get a duplicate. Set function timeouts below the caller's and make writes idempotent.</p>

<h3>2. Request data leaking through module scope</h3>
<p>A module-level <code>let currentTenant</code> set inside the handler is visible to the next request in that environment. In the worst case it serves one customer's data to another. Request-specific values live in local variables only.</p>

<h3>3. Fire-and-forget promises</h3>
<p><code>sendAnalytics(event)</code> without <code>await</code>: the handler returns, the environment freezes, the HTTP call stalls and maybe completes during the next invocation — or is lost if the environment is reclaimed. Await it, or hand it to a queue.</p>

<h3>4. <code>/tmp</code> fills up across warm invocations</h3>
<p>Downloading a 300 MB file per invocation into <code>/tmp</code> without deleting it works for the first request and fails on the second. Clean up, stream instead of buffering, or raise ephemeral storage.</p>

<h3>5. Database connection storms</h3>
<p>Each environment opens its own connection; a burst to 800 concurrent environments means 800 Postgres connections, and RDS falls over. Use RDS Proxy, cap concurrency, or use a connection-less data API. Covered in <a href="#/topic/cloud-rds">RDS (+ Aurora)</a>.</p>

<h3>6. Reserved concurrency lower than SQS demand</h3>
<p>Pollers receive messages, invocations are throttled, messages return to the queue and their receive count increments. Healthy messages end up in the DLQ. Use the event source mapping's <code>maxConcurrency</code> instead.</p>

<h3>7. Visibility timeout shorter than the function timeout</h3>
<p>A 5-minute job with a 30-second visibility timeout is delivered again while the first copy is still running — duplicate processing without any error anywhere.</p>

<h3>8. Kinesis / DynamoDB Streams poison pill</h3>
<p>Stream batches are retried in order; a record that always fails blocks its shard until it expires, and <code>IteratorAge</code> climbs. Configure bisect-on-error, a maximum retry count, and an on-failure destination.</p>

<h3>9. Provisioned concurrency on <code>$LATEST</code></h3>
<p>Not allowed — it attaches to a version or alias. And if the API integration points at the unqualified function name, provisioned environments are never used.</p>

<h3>10. Throwing vs returning in API handlers</h3>
<p>An uncaught exception behind API Gateway's proxy integration becomes a generic 502 or 500 with no useful body. Catch, log with the request ID, and return an explicit status.</p>

<h3>11. Init longer than 10 seconds</h3>
<p>Loading a large model or warming caches in module scope can exceed the init limit; the init is then retried inside the first invocation with the function's timeout, so the first request is very slow. Lazy-load, shrink, or move to a container service.</p>

<h3>12. Native binaries and architecture</h3>
<p>A dependency compiled on an Intel Mac (sharp, bcrypt, Prisma engines) crashes on arm64 Lambda. Build inside a matching container or install the platform-specific package.</p>

<h3>13. SnapStart uniqueness</h3>
<p>Every environment restored from the same snapshot shares the memory state captured at publish time: random seeds, generated IDs, open connections, cached credentials. Re-seed and reconnect in the restore hook.</p>

<h3>14. Lambda in a VPC cannot reach AWS APIs</h3>
<p>Calls to SQS or Secrets Manager hang until timeout without a NAT Gateway or VPC endpoints. The error looks like a slow dependency, not a network misconfiguration.</p>

<h3>15. Environments are recycled</h3>
<p>Even a busy environment is eventually replaced. Do not depend on long-lived in-memory state or assume a cache warmed once stays warm.</p>

<h3>16. S3 event key encoding</h3>
<p>A file named <code>Q3 report.pdf</code> arrives as <code>Q3+report.pdf</code>. Without decoding, <code>GetObject</code> returns NoSuchKey for exactly the files with spaces or special characters — a bug that only appears in production.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — Lambda synchronously calling Lambda</h3>
<p>Function A invokes B and waits: you pay for both while A idles, timeouts compound, and failures cascade. Use a queue or EventBridge for async hand-off, Step Functions for orchestration, or simply a shared library.</p>

<h3>Anti-pattern 2 — clients created inside the handler</h3>
<p><code>new DynamoDBClient()</code> per request discards connection reuse and adds TLS handshakes to every call. Create clients in module scope.</p>

<h3>Anti-pattern 3 — paying to wait</h3>
<p><code>while (!done) { await sleep(5000); poll(); }</code> inside a Lambda bills every second of sleeping. Use Step Functions wait states or callbacks, SQS delay queues, or EventBridge Scheduler.</p>

<h3>Anti-pattern 4 — no concurrency cap in front of a fragile dependency</h3>
<p>A traffic spike scales Lambda to hundreds of environments and they collectively DDoS your database or blow through the LLM provider's rate limit. Cap concurrency (reserved or ESM max concurrency) and buffer with SQS.</p>

<h3>Anti-pattern 5 — ignoring partial batch failures</h3>
<p>Throwing on the first bad SQS message retries the whole batch, re-running side effects for messages that already succeeded.</p>

<h3>Anti-pattern 6 — memory left at 128 MB</h3>
<p>CPU-starved functions run slowly and can cost more. Tune with data (the open-source AWS Lambda Power Tuning tool runs your function at several memory sizes and plots cost vs speed).</p>

<h3>Anti-pattern 7 — one giant function, or a thousand tiny ones, by default</h3>
<p>Both are choices with trade-offs, not defaults:</p>
<table>
  <thead><tr><th></th><th>Function per route</th><th>"Lambdalith" (one function, internal router)</th></tr></thead>
  <tbody>
    <tr><td>IAM</td><td>Least privilege per route</td><td>One role with the union of permissions</td></tr>
    <tr><td>Cold starts</td><td>More, smaller environments; rarely used routes are often cold</td><td>Shared warm pool; bigger bundle</td></tr>
    <tr><td>Deploys</td><td>Many resources; fine-grained</td><td>One artifact; easy local dev (Express/Fastify adapters)</td></tr>
    <tr><td>Metrics and alarms</td><td>Per route, for free</td><td>Need custom metrics per route</td></tr>
    <tr><td>Good default when</td><td>Routes have very different permissions, memory, or scaling needs</td><td>Small team, CRUD API, migrating an existing Express app</td></tr>
  </tbody>
</table>

<h3>Anti-pattern 8 — unstructured logs and logging secrets</h3>
<p><code>console.log('user', user)</code> dumps PII and tokens into a log group that never expires. Log structured JSON with a request ID, redact sensitive fields, and set retention.</p>

<h3>Anti-pattern 9 — Lambda for steady 24/7 heavy traffic</h3>
<p>At sustained high utilization a container service is usually cheaper and avoids cold starts entirely. Run the cost crossover with real numbers before committing either way.</p>

<h3>Anti-pattern 10 — retries everywhere</h3>
<p>Client retries × API retries × SDK retries × async Lambda retries multiply load during an outage (a retry storm). Retry at one layer, with backoff and jitter, and make the rest fail fast.</p>

<h3>Anti-pattern 11 — "it's serverless, so it's secure"</h3>
<p>A Function URL with <code>AuthType: NONE</code>, or an over-privileged execution role, is a public endpoint with admin rights. Function-level IAM still matters (see <a href="#/topic/cloud-aws-foundations">AWS Foundations &amp; IAM</a>).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. How does Lambda work under the hood?</div>
  <div class="qa-answer">
    <p>Each function runs in execution environments — Firecracker micro-VMs that hold the runtime and your code. The first request to need an environment triggers the init phase: download code, start the VM, start the runtime and extensions, run your module-scope code. Then the environment serves invocations one at a time; between them it is frozen, and later reused (a warm start) with module scope, <code>/tmp</code> and open connections intact. AWS adds environments as concurrency rises and reclaims idle ones. So the core properties are: single request per environment, scale by cloning environments, state survives only as a best-effort per-environment cache.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is a cold start and how do you reduce it?</div>
  <div class="qa-answer">
    <p>The extra latency when a request needs a new environment: code download, runtime start and your init code. I measure it with <code>Init Duration</code> in REPORT logs and look at p99, not averages. Fixes in order: shrink and tree-shake the bundle with esbuild, use modular SDK v3 clients, move rare dependencies behind dynamic imports, reduce network calls during init, and give it more memory because CPU speeds up init. If the path is latency-critical, provisioned concurrency on an alias, auto-scaled on a schedule or utilization. SnapStart is the other managed option for Java, Python and .NET. Keep-warm pings only keep one environment warm, so they do not help with bursts.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Reserved vs provisioned concurrency?</div>
  <div class="qa-answer">
    <p><strong>Reserved</strong> concurrency carves out a slice of the account pool for one function: it guarantees that capacity and also caps the function at that number. It costs nothing and is mainly a protection tool — keep a runaway function from starving others, protect a downstream, or set it to zero as a kill switch. <strong>Provisioned</strong> concurrency keeps N environments initialized on a specific version or alias so those requests never cold start; you pay for it while configured. They solve different problems — one is a limit, the other is pre-warming — and can be combined.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Explain the invocation models and what happens on failure in each.</div>
  <div class="qa-answer">
    <p><strong>Synchronous</strong> (API Gateway, ALB, Function URLs): the caller waits; on error or throttle the caller gets the failure and decides whether to retry. <strong>Asynchronous</strong> (S3, SNS, EventBridge): Lambda puts the event on an internal queue, retries twice by default with backoff, keeps events up to six hours, then sends them to an on-failure destination or DLQ. <strong>Poll-based</strong> event source mappings (SQS, Kinesis, DynamoDB Streams): Lambda polls and invokes with batches; for SQS failed messages reappear after the visibility timeout until <code>maxReceiveCount</code> moves them to the DLQ, and partial batch responses let you fail only the bad ones; for streams, a failing batch blocks the shard until it succeeds, expires or hits the retry limit, so you configure bisecting and an on-failure destination. In every non-sync model, delivery is at least once, so handlers must be idempotent.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you choose the memory size?</div>
  <div class="qa-answer">
    <p>Memory is the only performance dial: CPU and network scale with it (about one full vCPU around 1,769 MB, up to six at the maximum). For CPU-bound code, raising memory often cuts duration enough to lower cost; for I/O-bound code waiting on a database or API, extra memory buys little. I test empirically with Lambda Power Tuning, which runs the function at several sizes and plots cost against duration, then pick the knee of the curve. I also check Max Memory Used in REPORT logs to avoid out-of-memory errors.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you make a Lambda handler idempotent?</div>
  <div class="qa-answer">
    <p>Pick an idempotency key that identifies the logical operation — a client-sent <code>Idempotency-Key</code>, the SQS message ID, the S3 object key plus version. Before doing the side effect, atomically record "in progress" for that key with a conditional write (DynamoDB <code>attribute_not_exists</code>); after success, store the result with a TTL. Duplicates return the stored result; concurrent duplicates are rejected instead of double-executed. Powertools' idempotency utility implements exactly this. Where possible, also make the side effect itself naturally idempotent — upserts, deterministic output keys, passing the key to a payment provider that supports idempotency.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Our Lambda API backed by Postgres fails under load with "too many connections". Why, and what do you do?</div>
  <div class="qa-answer">
    <p>Each environment holds its own connection, and concurrency maps one-to-one to environments, so a burst to hundreds of concurrent invocations means hundreds of connections — beyond the database's limit. Fixes: put RDS Proxy in front to pool and multiplex connections; open the connection in module scope so warm invocations reuse it; cap the function's concurrency to what the database can serve; keep queries short so duration (and therefore concurrency) stays low; and for write bursts, buffer through SQS. For new designs I would also ask whether DynamoDB fits the access patterns, since it has no connection limit.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. A job takes 40 minutes, or an API call needs 2 minutes. How do you handle that with Lambda?</div>
  <div class="qa-answer">
    <p>For the API case, do not hold the HTTP request open: accept it, enqueue the work, return 202 with a job ID, and let the client poll a status endpoint or get a push or WebSocket notification when done. For the 40-minute job, either split it into chunks under 15 minutes orchestrated by Step Functions (map state for parallel chunks, retries per step), or run it on Fargate or AWS Batch, which have no duration limit. Lambda is the wrong tool for single long-running units of work.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you manage secrets in Lambda?</div>
  <div class="qa-answer">
    <p>Store them in Secrets Manager (rotation) or SSM Parameter Store SecureString, grant the execution role read access to that specific secret ARN, fetch at init or on first use, and cache with a TTL of a few minutes so rotation propagates without a fetch per request. The Parameters and Secrets extension or Powertools Parameters gives that caching off the shelf. I avoid plain environment variables for secrets because anyone with read access to the function configuration can see them, and they never rotate. And I never log them.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. When would you NOT use Lambda?</div>
  <div class="qa-answer">
    <p>Work longer than 15 minutes; steady, high, 24/7 throughput where containers are cheaper per request; long-lived connections such as a socket server; GPU workloads; large in-memory state; very strict p99 latency with spiky traffic where provisioned concurrency would cost more than containers; and anything that hammers a connection-limited database without a proxy. I also weigh team skills — a team fluent in containers may ship faster on Fargate. The cost crossover is easy to estimate: concurrency × hours × GB versus the equivalent container vCPU and memory hours.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. (FDE) A customer says "your API is fast most of the time but randomly takes 3 seconds." How do you investigate?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Quantify:</strong> API Gateway Latency vs IntegrationLatency p50/p99 — is the time in Lambda or in front of it?</li>
      <li><strong>Correlate with cold starts</strong> using Logs Insights on the REPORT lines:
        <pre><code class="language-text">filter @type = "REPORT"
| stats count(*) as invocations, count(@initDuration) as coldStarts,
        avg(@initDuration) as avgInitMs, pct(@duration, 99) as p99Ms by bin(15m)</code></pre>
      </li>
      <li><strong>Check throttles</strong> (Throttles metric, ConcurrentExecutions near the limit) and client retries.</li>
      <li><strong>Trace a slow request</strong> with X-Ray: is it init (large bundle, secrets fetch, DB connect at init), a slow downstream, or retries with backoff?</li>
      <li><strong>Fix by cause:</strong> bundle/init work and provisioned concurrency during their business hours for cold starts; RDS Proxy for connection setup; raising quotas or capping a noisy neighbour for throttles; timeouts and caching for slow downstreams.</li>
      <li><strong>Report back</strong> with the before/after p99 chart and what it costs (provisioned concurrency is not free) so the customer can make the trade-off.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. One message in our SQS-triggered Lambda keeps failing and the whole batch keeps reprocessing. What's wrong?</div>
  <div class="qa-answer">
    <p>Without partial batch responses, an error fails the entire batch, so all messages become visible again and are reprocessed — duplicating side effects for the successful ones — until they all exhaust <code>maxReceiveCount</code>. Fix: enable <code>ReportBatchItemFailures</code> and return only the failed message IDs; make processing idempotent; configure a DLQ with a sensible <code>maxReceiveCount</code> and an alarm on its depth; and for FIFO queues stop at the first failure and report the rest to preserve ordering. Then investigate the poison message from the DLQ and redrive once fixed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you deploy a Lambda change safely?</div>
  <div class="qa-answer">
    <p>Publish an immutable version per deploy and route traffic through an alias. Use CodeDeploy (SAM <code>DeploymentPreference</code> or CDK) to shift a small percentage first — canary or linear — with CloudWatch alarms on errors and latency wired as rollback triggers. Integrations point at the alias, never <code>$LATEST</code>. Combine with feature flags for behaviour changes and keep database migrations backward compatible so a rollback does not break on the new schema.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You explain init vs invoke and why clients live in module scope.</li>
    <li>You compute concurrency as RPS × duration and connect it to throttling and DB limits.</li>
    <li>You know retry semantics for sync, async and poll-based invocations.</li>
    <li>You say "at least once, so idempotent" without being asked.</li>
    <li>You distinguish reserved (limit) from provisioned (pre-warm) concurrency.</li>
    <li>You use partial batch responses and the visibility-timeout rule for SQS.</li>
    <li>You can name when Lambda is the wrong tool and estimate the cost crossover.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How do you estimate a function's concurrency, and what happens when you hit the limit for sync, async and SQS-triggered functions?</div>
  <div class="qa-answer">
    <p>By Little's law, concurrency ≈ requests per second × average duration in seconds: 100 RPS × 0.2 s = 20, but 100 RPS × 2 s = 200, so a slow downstream multiplies concurrency and can exhaust the account pool (1,000 per region by default, soft and shared), throttling unrelated functions. Each function scales by about 1,000 concurrent executions every 10 seconds up to that limit. When throttled: <strong>synchronous</strong> callers get HTTP 429 (<code>TooManyRequestsException</code>); <strong>async</strong> events are retried internally up to the max event age; <strong>SQS</strong> pollers back off and messages return to the queue. To throttle an SQS consumer, use the event source mapping's <strong>max concurrency</strong> rather than low reserved concurrency: reserved concurrency below the pollers' demand causes throttled receives that still burn <code>maxReceiveCount</code> and can push healthy messages to the DLQ.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q15. Write an SQS-triggered handler that reports partial batch failures. How should the visibility timeout be set?</div>
  <div class="qa-answer">
    <pre><code class="language-ts">export const handler = async (event: SQSEvent): Promise&lt;SQSBatchResponse&gt; =&gt; {
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];
  for (const record of event.Records) {
    try {
      await scoreCall(JSON.parse(record.body));   // idempotent by callId
    } catch (err) {
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }
  return { batchItemFailures };   // only these return to the queue
};</code></pre>
    <p>Enable <code>ReportBatchItemFailures</code> on the mapping; otherwise one bad message makes the whole batch reappear and reprocess. Set the queue's <strong>visibility timeout to at least 6 × the function timeout</strong> (AWS guidance), so a message isn't redelivered while a slow invocation, including throttle retries, is still working on it. A 5-minute job with a 30-second visibility timeout gets processed twice with no error anywhere. Add a DLQ with a sensible <code>maxReceiveCount</code> and an alarm on its depth.</p>
  </div>
</div>
` },

  ]
});
