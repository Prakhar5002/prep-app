window.PREP_SITE.registerTopic({
  id: "cloud-cloudwatch",
  module: "cloud",
  title: "CloudWatch & Observability",
  estimatedReadTime: "40 min",
  tags: ["aws","cloudwatch","logs-insights","emf","alarms","x-ray","lambda","observability","structured-logging","cdk"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">CloudWatch is already collecting everything. The job is to <strong>log JSON with a correlation ID, emit a few EMF metrics with low-cardinality dimensions, and alarm on user-facing symptoms with M-of-N and composites</strong>, with retention and log level set on day one so cost and noise don't come from the defaults.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Nothing to install:</strong> every AWS service already publishes metrics (free namespaces like <code>AWS/Lambda</code>, <code>AWS/SQS</code>) and everything a Lambda prints already lands in Logs. The work is making it useful.</li>
    <li><strong>Logs:</strong> log group → stream (≈ one per warm Lambda container) → event. Lambda's default group is <code>/aws/lambda/&lt;fn&gt;</code>. Default retention is <strong>never expire</strong>, so set it in IaC.</li>
    <li><strong>Log classes:</strong> Standard vs Infrequent Access (cheaper ingest, fewer features). Lambda advanced logging gives JSON format, a platform log-level filter and custom log groups.</li>
    <li><strong>Logs Insights:</strong> <code>fields | filter | stats … by bin() | sort | limit</code>. JSON fields are auto-discovered. Lambda <code>REPORT</code> fields (<code>@duration</code>, <code>@initDuration</code>, <code>@maxMemoryUsed</code>) answer cold-start and memory questions. Billed per GB <em>scanned</em>, and <code>limit</code> doesn't reduce it, so narrow the time range first.</li>
    <li><strong>Metric identity = namespace + name + exact dimension set</strong>. Each unique one is billed monthly. Never use userId or requestId as a dimension.</li>
    <li><strong>Resolution/retention:</strong> 60 s standard, 1 s high-res. Roll-ups: 1 s data for 3 h, 1 min for 15 days, 5 min for 63 days, 1 h for 15 months.</li>
    <li><strong>EMF</strong> = a JSON log line with <code>_aws.CloudWatchMetrics</code>. Metrics are extracted asynchronously with no API call in the hot path, and the context stays queryable. Prefer it over <code>PutMetricData</code> in Lambda.</li>
    <li><strong>Alarms evaluate metrics only.</strong> A log pattern needs EMF or a metric filter (not retroactive) first.</li>
    <li><strong>Alarm knobs:</strong> period, N evaluation periods, M datapoints-to-alarm, statistic (Sum for counts, p99 for latency, Max for queue age), and TreatMissingData (<code>notBreaching</code> for errors, <code>breaching</code> for heartbeats). Actions fire on state change.</li>
    <li><strong>Metric math</strong> for rates (<code>IF(inv &gt; 0, 100*err/inv, 0)</code>). <strong>Anomaly detection</strong> for seasonal traffic. <strong>Composite alarms</strong> to page once and suppress during deploys.</li>
    <li><strong>Async paths fail quietly:</strong> watch <code>ApproximateAgeOfOldestMessage</code>, DLQ depth, <code>AsyncEventsDropped</code> and <code>Throttles</code>. API 5xx won't show these failures.</li>
    <li><strong>Tracing:</strong> X-Ray is now shown inside the CloudWatch console. Segments/subsegments. Annotations are indexed, metadata is not. Context propagates via <code>X-Amzn-Trace-Id</code> and SQS system attributes. Default sampling is 1 req/s + 5%. AWS steers new instrumentation to OpenTelemetry (ADOT).</li>
    <li><strong>Correlation ID everywhere</strong>, carried in SQS bodies and attributes and reset per invocation or record, because traces are sampled and logs are not.</li>
    <li><strong>Cost levers:</strong> log ingestion is usually #1 (~$0.50/GB at the time of writing). Then high-cardinality metrics, dashboard query widgets, and vendor GetMetricData polling.</li>
    <li><strong>Monitor the monitor:</strong> a scheduled checker or heartbeat must fail loudly (missing data = breaching).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Alarming on "Lambda Errors ≥ 1" and calling the system monitored.</strong> It pages on every transient retry (so people mute it), yet it misses throttles, dropped async events, timeouts and a growing backlog. Fix: page on error <em>rate</em> with M-of-N, p99 latency, and queue age, combined with composites. Send single errors and DLQ &gt; 0 to a ticket.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Alarms only evaluate metrics, so I bridge logs to metrics with EMF where I own the code and metric filters where I don't. High-cardinality IDs stay in the log line, never in dimensions."</div>
  <div class="revision-say">"For async work, the symptom users feel is staleness, so I alarm on ApproximateAgeOfOldestMessage and DLQ depth, not just API 5xx."</div>
  <div class="revision-say">"Traces are sampled, logs aren't, so every hop logs a correlation ID and one Logs Insights query across log groups replays any request."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What CloudWatch actually is</h3>
<p>"CloudWatch" is a family of related services under one console. In interviews, name the parts precisely:</p>
<table>
  <thead><tr><th>Component</th><th>What it does</th><th>You use it for</th></tr></thead>
  <tbody>
    <tr><td><strong>CloudWatch Logs</strong></td><td>Ingests, stores and indexes log events in log groups</td><td>Lambda/ECS/API Gateway logs, application logs, audit trails</td></tr>
    <tr><td><strong>Logs Insights</strong></td><td>Ad-hoc query engine over log groups</td><td>Incident debugging, p99 by route, cold-start analysis</td></tr>
    <tr><td><strong>Metric filters / subscription filters</strong></td><td>Turn log patterns into metrics, or stream logs out (Lambda, Kinesis, Firehose, OpenSearch)</td><td>Alarming on log patterns; shipping logs to Datadog/S3/SIEM</td></tr>
    <tr><td><strong>Metrics</strong></td><td>Time-series datapoints with statistics (Sum, Avg, Min, Max, SampleCount, pNN)</td><td>Vended service metrics + your custom/business metrics</td></tr>
    <tr><td><strong>Alarms</strong></td><td>State machines over a metric or expression: OK / ALARM / INSUFFICIENT_DATA</td><td>Paging, auto scaling, automated remediation</td></tr>
    <tr><td><strong>Dashboards</strong></td><td>Widgets over metrics and Logs Insights queries</td><td>Service health view, incident war-room</td></tr>
    <tr><td><strong>X-Ray / Traces</strong></td><td>Distributed tracing: segments per service, trace map</td><td>"Where did this slow request spend its time?"</td></tr>
    <tr><td><strong>Synthetics</strong></td><td>Scheduled canary scripts that hit your endpoints</td><td>Outside-in uptime and flow checks</td></tr>
    <tr><td><strong>RUM</strong></td><td>Real-user monitoring for web clients</td><td>Front-end errors, page-load performance</td></tr>
    <tr><td><strong>Application Signals</strong></td><td>APM-style service view + SLOs on top of OTel data</td><td>SLO tracking without hand-built math (check current docs for scope)</td></tr>
    <tr><td><strong>Contributor Insights, Lambda Insights, Container Insights, Live Tail</strong></td><td>Top-N analysis, enhanced runtime metrics, real-time log tail</td><td>"Which tenant is causing the 5xx?", memory/CPU per function</td></tr>
  </tbody>
</table>

<h3>Why it matters for a full-stack / FDE role</h3>
<ul>
  <li><strong>It is already there.</strong> You cannot opt out of CloudWatch in a serverless stack: Lambda, API Gateway, SQS and RDS all send their telemetry to it. Even teams that use Datadog usually start in CloudWatch and forward from there.</li>
  <li><strong>FDE work is field debugging.</strong> When a customer says "uploads stopped processing last night", your first five minutes are a Logs Insights query and a look at <code>ApproximateAgeOfOldestMessage</code>. Fluency here is a visible senior signal.</li>
  <li><strong>Cost and noise are design decisions.</strong> Interviewers probe whether you know that logging and custom metrics can cost more than the compute, and that a pager that rings for every single Lambda error gets ignored.</li>
</ul>

<h3>CloudWatch vs third-party observability</h3>
<table>
  <thead><tr><th></th><th>CloudWatch</th><th>Datadog / New Relic</th><th>Grafana stack (Loki/Prometheus/Tempo) or OTel + vendor</th></tr></thead>
  <tbody>
    <tr><td>Setup</td><td>Zero: vended metrics + Lambda logs are automatic</td><td>Agent/extension + API keys + log forwarding</td><td>Run or rent the backends; instrument with OTel</td></tr>
    <tr><td>IAM / security</td><td>Native IAM, data never leaves the account</td><td>Data leaves the account (compliance review)</td><td>Depends on hosting</td></tr>
    <tr><td>Query/UX</td><td>Good enough; Logs Insights is decent, cross-service correlation is clunkier</td><td>Best-in-class correlation, APM, dashboards</td><td>Flexible, PromQL/LogQL power, more ops</td></tr>
    <tr><td>Cost shape</td><td>Pay per GB ingested/scanned, per metric, per alarm</td><td>Per host / per GB / per span; can surprise at scale</td><td>Infra + people time, or vendor pricing</td></tr>
    <tr><td>Multi-cloud</td><td>AWS-centric</td><td>Yes</td><td>Yes</td></tr>
  </tbody>
</table>
<p>A defensible stance: <strong>"CloudWatch as the system of record inside AWS, instrumented with open formats (JSON logs, EMF, OpenTelemetry) so we can forward to a vendor later without re-instrumenting."</strong></p>

<h3>Where this shows up in real work</h3>
<p>Take a typical app: an RN mobile client calls API Gateway, Lambda writes to RDS, uploads land in S3, and an SQS queue feeds background workers. Meeting-room booking tablets send a heartbeat every minute. The questions you actually get from that system are "why did booking creation fail for this tenant at 09:02", "are tablets offline", "is the worker queue backing up", and "why is the p99 of <code>GET /rooms</code> 4 seconds on Monday mornings". Each one maps to one CloudWatch feature, and that mapping is what this topic teaches. The end-to-end version of this system, with its alarms, is designed in <a href="#/topic/cloud-serverless-case">Case Study: Serverless on AWS</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The data-flow picture</h3>
<div class="diagram">
<pre>
  Your code (Lambda / ECS / EC2)                     AWS services
  ─────────────────────────────                      ────────────
  stdout: JSON log lines  ─┐                         Lambda, API GW, SQS, RDS, S3 ...
  stdout: EMF JSON lines  ─┤                                   │ vended metrics (free)
  PutMetricData API calls ─┼──────────┐                        ▼
  X-Ray / OTel spans      ─┼───┐      │          ┌──────────────────────────┐
                           │   │      └────────► │   CloudWatch METRICS      │
                           ▼   │                 │  namespace / name / dims  │
              ┌────────────────────────┐ EMF ──► │  1s / 60s datapoints      │
              │   CloudWatch LOGS       │ metric  └────────────┬─────────────┘
              │ log group / stream      │ filter ──►           │
              │ retention, log class    │                      ▼
              └──┬─────────┬───────────┘           ┌──────────────────────┐
                 │         │                       │       ALARMS          │
     Logs Insights│         │subscription filter    │ static / math /       │
     (ad-hoc SQL- │         ▼                       │ anomaly / composite   │
      ish query)  │  Lambda / Firehose / Kinesis    └──────────┬───────────┘
                 ▼  / OpenSearch → S3, SIEM, vendor            │ actions
          dashboards                                          ▼
                                                SNS → email / chat / PagerDuty
                           ▼                    Lambda, Auto Scaling, SSM
                 X-Ray traces → trace map, segment timeline
</pre>
</div>

<h3>Two hierarchies to keep straight</h3>
<div class="diagram">
<pre>
 LOGS                                   METRICS
 ────                                   ───────
 Log group   /aws/lambda/score-call     Namespace   CallScoring
  ├─ retention, KMS key, log class       └─ Metric name   ScoringLatency
  ├─ metric filters, subscription         └─ Dimensions   {Service=scorer, Stage=prod}
  └─ Log stream  2026/11/05/[$LATEST]ab12      └─ datapoints (timestamp, value, unit)
       └─ Log event  { timestamp, message }         └─ statistics: Sum Avg Min Max
                                                          SampleCount p50 p90 p99 ...
 One stream per execution environment
 (≈ per warm Lambda container)          Identity = namespace + name + EXACT dimension set.
                                        {Service=scorer} and {Service=scorer,Stage=prod}
                                        are two different metrics, each billed.
</pre>
</div>

<h3>Three rules that organise everything else</h3>
<ol>
  <li><strong>Alarms only look at metrics.</strong> To alarm on a log pattern, you first turn it into a metric (EMF or a metric filter). "Page me when the log says X" always means "build a metric, then alarm on it."</li>
  <li><strong>Logs are for detail, metrics for trends, traces for one request's path.</strong> High-cardinality data (userId, callId, requestId) goes in logs and trace annotations. Low-cardinality data (service, stage, route, status class) goes in metric dimensions.</li>
  <li><strong>The defaults are the trap.</strong> Logs are kept forever, DEBUG gets left on, every Lambda error pages someone, and average latency is shown instead of percentiles. A senior engineer changes each of these on day one.</li>
</ol>

<h3>The alarm state machine</h3>
<div class="diagram">
<pre>
          breaching datapoints ≥ M of last N periods
   ┌────┐ ───────────────────────────────────────────► ┌───────┐
   │ OK │                                              │ ALARM │ ── actions fire on
   └────┘ ◄─────────────────────────────────────────── └───────┘    state CHANGE only
      ▲          fewer than M breaching                   ▲
      │                                                   │
      │    ▼  not enough data (and TreatMissingData = missing)
   ┌───────────────────┐
   │ INSUFFICIENT_DATA │  ← a brand-new alarm, or a metric that stopped reporting
   └───────────────────┘
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"CloudWatch shows average Lambda duration, and it's 120 ms, so we're fine." Averages hide the tail. A p99 of 3 s means 1 in 100 users waits 3 s, and on a screen that makes 10 calls, roughly 1 in 10 page loads hits it. Graph and alarm on <code>p99</code> (or <code>p95</code>) and keep the average only as context.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Logs: groups, streams, retention, classes</h3>
<ul>
  <li><strong>Lambda</strong> writes stdout/stderr to <code>/aws/lambda/&lt;function-name&gt;</code> by default, one stream per execution environment. The platform adds <code>START</code>, <code>END</code> and <code>REPORT</code> lines. <code>REPORT</code> carries Duration, Billed Duration, Memory Size, Max Memory Used and, on a cold start, Init Duration.</li>
  <li><strong>Advanced logging controls</strong> (added in late 2023): per function you can pick <em>JSON vs Text</em> log format, an application/system log level filter applied by the platform, and a custom log group, so several functions can share one group. Check current docs for runtime-specific behaviour.</li>
  <li><strong>Retention</strong> defaults to <em>never expire</em>. You choose from fixed values: 1, 3, 5, 7, 14, 30, 60, 90 days and so on up to 10 years.</li>
  <li><strong>Log classes:</strong> <em>Standard</em> (full features) vs <em>Infrequent Access</em> (cheaper ingestion, fewer features). IA is fine for logs you only query occasionally. Check current docs for which features IA lacks, such as metric filters and subscriptions.</li>
  <li><strong>Encryption:</strong> always encrypted at rest. You can associate a customer-managed KMS key per log group.</li>
  <li><strong>Data protection policies</strong> can detect and mask sensitive data such as emails and card numbers in log groups. Treat this as a safety net, not a substitute for not logging PII.</li>
</ul>
<pre><code class="language-bash"># Set retention (do this for EVERY group, ideally in IaC)
aws logs put-retention-policy --log-group-name /aws/lambda/score-call --retention-in-days 30

# Live tail during an incident (CLI v2)
aws logs tail /aws/lambda/score-call --follow --since 15m --format short

# Grep-style search across streams (JSON filter pattern)
aws logs filter-log-events --log-group-name /aws/lambda/score-call \\
  --start-time $(date -v-1H +%s000) \\
  --filter-pattern '{ $.level = "ERROR" }'</code></pre>
<p>Filter-pattern syntax is different from Logs Insights. <code>{ $.level = "ERROR" &amp;&amp; $.durationMs &gt; 1000 }</code> matches JSON fields, and a bare <code>"Task timed out"</code> matches a literal term. Filter patterns are used by metric filters, subscription filters and <code>filter-log-events</code>.</p>

<h3>2. Structured logging from Lambda (TypeScript)</h3>
<p>Rules: one JSON object per line, a fixed set of top-level keys (<code>level</code>, <code>msg</code>, <code>service</code>, <code>correlationId</code>, <code>requestId</code>), errors serialised with name, message and stack, and per-invocation context reset so warm containers don't leak the previous request's IDs.</p>
<pre><code class="language-ts">// src/lib/log.ts: zero-dependency structured logger for Lambda
type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
const ORDER: Record&lt;Level, number&gt; = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
const MIN = ORDER[(process.env.LOG_LEVEL as Level) ?? 'INFO'] ?? ORDER.INFO;
const SERVICE = process.env.SERVICE_NAME ?? 'unknown';

let ctx: Record&lt;string, unknown&gt; = {};

/** Call at the START of every invocation/record: replaces (not merges) context. */
export function setLogContext(next: Record&lt;string, unknown&gt;) {
  ctx = next;
}

function serialise(_key: string, value: unknown) {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}

function write(level: Level, msg: string, extra?: Record&lt;string, unknown&gt;) {
  if (ORDER[level] &lt; MIN) return;
  const line = { ts: new Date().toISOString(), level, msg, service: SERVICE, ...ctx, ...extra };
  // process.stdout.write emits a pure JSON line (no runtime prefix in Text mode),
  // which keeps it parseable by Logs Insights, filter patterns and EMF extraction.
  process.stdout.write(JSON.stringify(line, serialise) + '\\n');
}

export const log = {
  debug: (msg: string, extra?: Record&lt;string, unknown&gt;) =&gt; write('DEBUG', msg, extra),
  info:  (msg: string, extra?: Record&lt;string, unknown&gt;) =&gt; write('INFO', msg, extra),
  warn:  (msg: string, extra?: Record&lt;string, unknown&gt;) =&gt; write('WARN', msg, extra),
  error: (msg: string, extra?: Record&lt;string, unknown&gt;) =&gt; write('ERROR', msg, extra),
};</code></pre>
<p>In production most teams use <strong>Powertools for AWS Lambda (TypeScript)</strong>, which provides Logger, Metrics and Tracer utilities and does the same things: Lambda context injection, a correlation ID taken from the event, sampling of DEBUG logs, and EMF. Learn the hand-rolled version so you can explain what the library does for you.</p>

<h3>3. Logs Insights: the query language</h3>
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>fields</code></td><td>Choose/compute columns</td><td><code>fields @timestamp, level, msg, durationMs</code></td></tr>
    <tr><td><code>filter</code></td><td>Keep matching events</td><td><code>filter level = "ERROR" and route like /bookings/</code></td></tr>
    <tr><td><code>stats</code></td><td>Aggregate (count, avg, pct, max, count_distinct…)</td><td><code>stats pct(durationMs, 99) by route</code></td></tr>
    <tr><td><code>bin()</code></td><td>Time buckets inside stats</td><td><code>stats count(*) by bin(5m)</code></td></tr>
    <tr><td><code>sort</code> / <code>limit</code></td><td>Order and truncate</td><td><code>sort @timestamp desc | limit 50</code></td></tr>
    <tr><td><code>parse</code></td><td>Extract fields from unstructured text (glob or regex)</td><td><code>parse @message "user=* action=*" as user, action</code></td></tr>
    <tr><td><code>display</code> / <code>dedup</code></td><td>Final column set / drop duplicates by field</td><td><code>dedup correlationId</code></td></tr>
  </tbody>
</table>
<p>Fields from JSON log lines are <strong>auto-discovered</strong>, and nested keys use dot notation (<code>err.name</code>). Lambda logs also expose system fields: <code>@requestId</code>, <code>@type</code> (<code>REPORT</code>…), <code>@duration</code>, <code>@billedDuration</code>, <code>@initDuration</code>, <code>@maxMemoryUsed</code> and <code>@memorySize</code>. Newer releases also accept OpenSearch PPL and SQL as query languages (check current docs).</p>
<pre><code class="language-text"># Latest errors, newest first
fields @timestamp, correlationId, msg, err.name, err.message
| filter level = "ERROR"
| sort @timestamp desc
| limit 50

# Latency percentiles per route (from your own JSON field)
filter ispresent(durationMs)
| stats count(*) as n, pct(durationMs, 50) as p50, pct(durationMs, 90) as p90,
        pct(durationMs, 99) as p99 by route
| sort p99 desc

# Cold starts per hour, and how long init takes
filter @type = "REPORT" and ispresent(@initDuration)
| stats count(*) as coldStarts, avg(@initDuration) as avgInitMs, max(@initDuration) as maxInitMs by bin(1h)

# Memory right-sizing: are we paying for RAM we never use?
filter @type = "REPORT"
| stats max(@memorySize / 1000 / 1000) as provisionedMB,
        max(@maxMemoryUsed / 1000 / 1000) as peakUsedMB,
        avg(@billedDuration) as avgBilledMs

# Timeouts (platform message, not your logger)
filter @message like /Task timed out/
| stats count(*) by bin(5m)</code></pre>
<p><strong>Cost model:</strong> you pay per GB of log data <em>scanned</em>, around $0.005/GB in us-east-1 at the time of writing (check current pricing). <code>limit 20</code> does not reduce the scan. Only a narrower time range, fewer log groups, or a filter that the engine can push down (like an indexed field) reduces cost. Queries span multiple log groups (dozens per query, with newer prefix/criteria-based selection; check current limits), time out after a long ceiling (60 minutes at the time of writing), and return up to 10,000 rows.</p>

<h3>4. Metric filters and subscription filters</h3>
<ul>
  <li><strong>Metric filter:</strong> a filter pattern on a log group. Each matching event increments a metric, or publishes a numeric field as the value. It is not retroactive: it only counts events ingested after creation. Use it when you cannot change the code to emit EMF, for example in legacy services or third-party logs.</li>
  <li><strong>Subscription filter:</strong> streams matching events in near-real-time to Lambda, Kinesis Data Streams, Firehose or OpenSearch. This is how logs reach S3 for cheap long-term archive, a SIEM, or a vendor. There is a small per-log-group cap (2 at the time of writing).</li>
</ul>

<h3>5. Metrics: namespaces, dimensions, resolution, retention</h3>
<table>
  <thead><tr><th>Concept</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Namespace</td><td><code>AWS/*</code> is reserved for AWS. Use your own, e.g. <code>CallScoring</code> or <code>Bookings/Prod</code></td></tr>
    <tr><td>Dimensions</td><td>Name/value pairs that identify a series, up to 30 per metric at the time of writing. <strong>Low cardinality only</strong></td></tr>
    <tr><td>Units</td><td>Count, Milliseconds, Seconds, Bytes, Percent… Must be consistent, because a mixed unit splits statistics</td></tr>
    <tr><td>Resolution</td><td>Standard = 60 s, high-resolution = down to 1 s (higher cost; alarms can use 10 s / 30 s periods)</td></tr>
    <tr><td>Retention / roll-up</td><td>&lt; 60 s data for 3 hours; 60 s for 15 days; 5 min for 63 days; 1 hour for 455 days (15 months)</td></tr>
    <tr><td>Statistics</td><td>Sum, Average, Minimum, Maximum, SampleCount, percentiles (p50…p99.9), trimmed mean (tm99)</td></tr>
    <tr><td>Timestamps</td><td>Datapoints may be published somewhat in the past or slightly in the future (about two weeks back and two hours forward at the time of writing)</td></tr>
  </tbody>
</table>
<p>Vended metrics you should know by name:</p>
<table>
  <thead><tr><th>Namespace</th><th>Metrics that matter</th></tr></thead>
  <tbody>
    <tr><td><code>AWS/Lambda</code></td><td>Invocations, Errors, Throttles, Duration, ConcurrentExecutions, IteratorAge (streams), AsyncEventAge / AsyncEventsDropped (async), DeadLetterErrors</td></tr>
    <tr><td><code>AWS/SQS</code></td><td>ApproximateAgeOfOldestMessage, ApproximateNumberOfMessagesVisible, ApproximateNumberOfMessagesNotVisible, NumberOfMessagesSent/Received/Deleted</td></tr>
    <tr><td><code>AWS/ApiGateway</code></td><td>Count, 4XXError, 5XXError, Latency, IntegrationLatency (REST; HTTP API names differ slightly, so check)</td></tr>
    <tr><td><code>AWS/RDS</code></td><td>CPUUtilization, DatabaseConnections, FreeableMemory, ReadLatency/WriteLatency, FreeStorageSpace</td></tr>
  </tbody>
</table>

<h3>6. Three ways to publish a custom metric</h3>
<table>
  <thead><tr><th></th><th>PutMetricData API</th><th>EMF log line</th><th>Metric filter</th></tr></thead>
  <tbody>
    <tr><td>Hot-path cost</td><td>A network call per publish (latency, API throttling, needs IAM)</td><td>None: it is a stdout write</td><td>None</td></tr>
    <tr><td>Billed as</td><td>API requests + metrics</td><td>Log ingestion + metrics</td><td>Log ingestion + metrics</td></tr>
    <tr><td>Keeps context?</td><td>No (just numbers)</td><td><strong>Yes</strong>: the same line is queryable in Logs Insights</td><td>Yes (the source log)</td></tr>
    <tr><td>Dimensions</td><td>Full</td><td>Full (multiple dimension sets per line)</td><td>Limited (a few, from JSON fields)</td></tr>
    <tr><td>Best for</td><td>Non-log contexts, batch backfills, scripts</td><td><strong>Lambda / containers app metrics (default choice)</strong></td><td>Code you can't change; counting a text pattern</td></tr>
  </tbody>
</table>

<h3>7. EMF: the format</h3>
<p>An EMF line is a normal JSON log event with a reserved <code>_aws</code> key that tells CloudWatch which root-level fields are metrics and which are dimensions. Every other key stays in the log as searchable context.</p>
<pre><code class="language-json">{
  "_aws": {
    "Timestamp": 1762329600000,
    "CloudWatchMetrics": [{
      "Namespace": "CallScoring",
      "Dimensions": [["Service", "Stage"], ["Service"]],
      "Metrics": [
        { "Name": "ScoringLatency", "Unit": "Milliseconds" },
        { "Name": "CallsScored", "Unit": "Count" }
      ]
    }]
  },
  "Service": "scorer",
  "Stage": "prod",
  "ScoringLatency": 1840,
  "CallsScored": 1,
  "callId": "c_9f2a",
  "tenantId": "t_acme",
  "correlationId": "7d1e-..."
}</code></pre>
<p>Notes: each inner array in <code>Dimensions</code> is a <em>dimension set</em>, and each set creates a separate metric (two here). <code>callId</code> and <code>tenantId</code> are <strong>not</strong> dimensions, so they cost nothing as metrics but can still be queried. There are per-line caps on the number of metrics and values (around 100 at the time of writing). In Lambda, extraction is automatic. On EC2/ECS you send EMF through the CloudWatch agent or the EMF-aware log driver.</p>
<pre><code class="language-ts">// src/lib/metrics.ts: minimal EMF emitter (one log line = N metrics)
type Unit = 'Count' | 'Milliseconds' | 'Bytes' | 'Percent' | 'None';

export function emitMetrics(
  namespace: string,
  dimensions: Record&lt;string, string&gt;,
  metrics: Record&lt;string, { value: number; unit: Unit }&gt;,
  context: Record&lt;string, unknown&gt; = {},   // high-cardinality: logged, NOT a dimension
) {
  const line = {
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [{
        Namespace: namespace,
        Dimensions: [Object.keys(dimensions)],
        Metrics: Object.entries(metrics).map(([Name, m]) =&gt; ({ Name, Unit: m.unit })),
      }],
    },
    ...context,
    ...dimensions,
    ...Object.fromEntries(Object.entries(metrics).map(([name, m]) =&gt; [name, m.value])),
  };
  process.stdout.write(JSON.stringify(line) + '\\n');
}</code></pre>
<p>The Powertools equivalent (v2-era names; check current docs before quoting them in code):</p>
<pre><code class="language-ts">import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({ namespace: 'CallScoring', serviceName: 'scorer' });

export const handler = async (event: unknown) =&gt; {
  metrics.addDimension('Stage', process.env.STAGE ?? 'dev');
  metrics.addMetric('CallsScored', MetricUnit.Count, 1);
  metrics.addMetadata('callId', 'c_9f2a');   // context on the log line, not a dimension
  // ... work ...
  metrics.publishStoredMetrics();            // flushes one EMF line (middleware does this for you)
};</code></pre>

<h3>8. Alarms: the knobs you must be able to explain</h3>
<table>
  <thead><tr><th>Setting</th><th>Meaning</th><th>Typical choice</th></tr></thead>
  <tbody>
    <tr><td>Metric / expression</td><td>A single metric, or metric math (<code>100 * errors / invocations</code>)</td><td>Ratios over raw counts for paging</td></tr>
    <tr><td>Statistic</td><td>Sum / Average / Maximum / pNN</td><td>Sum for counts, p99 for latency, Maximum for queue age</td></tr>
    <tr><td>Period</td><td>Aggregation window per datapoint</td><td>60 s for fast signals, 300 s for noisy ones</td></tr>
    <tr><td>Evaluation periods (N)</td><td>How many recent periods are looked at</td><td>3–5</td></tr>
    <tr><td>Datapoints to alarm (M)</td><td>How many of those N must breach</td><td>"2 of 3" or "3 of 5" to ignore single blips</td></tr>
    <tr><td>Threshold + comparison</td><td>Static value, or an anomaly-detection band</td><td>Static for SLOs; band for traffic-shaped metrics</td></tr>
    <tr><td>TreatMissingData</td><td><code>missing</code> (default) / <code>notBreaching</code> / <code>breaching</code> / <code>ignore</code></td><td>notBreaching for errors (no traffic ≠ broken); <strong>breaching</strong> for heartbeats</td></tr>
    <tr><td>Actions</td><td>Per state: OK / ALARM / INSUFFICIENT_DATA</td><td>SNS topic → chat + pager; Auto Scaling; Lambda; SSM</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>Metric math:</strong> <code>IF(invocations &gt; 0, 100 * errors / invocations, 0)</code>, <code>FILL(m1, 0)</code>, <code>SUM(METRICS())</code>, <code>RATE(m1)</code>. One alarm can evaluate an expression over up to ~10 metrics.</li>
  <li><strong>Anomaly detection:</strong> CloudWatch trains a model on the metric's history, including daily and weekly seasonality, and the alarm compares against <code>ANOMALY_DETECTION_BAND(m1, 2)</code> (2 = band width in standard deviations). Good for traffic volume ("requests dropped to zero at 10am Tuesday"), poor for brand-new or very spiky metrics.</li>
  <li><strong>Composite alarms:</strong> a boolean rule over other alarms, e.g. <code>ALARM("api-5xx-rate") AND ALARM("api-p99-latency")</code>. Use them to page once for a correlated incident, and to <em>suppress</em> child alarms during a known upstream outage or deploy window. Child alarms can have no actions and exist only as inputs.</li>
  <li>Actions fire on <strong>state transitions</strong>, not on every evaluation. A flapping alarm (OK→ALARM→OK) notifies every time, which is another reason for M-of-N.</li>
</ul>
<pre><code class="language-bash"># Static alarm: 3 of 5 one-minute periods with ≥ 5 Lambda errors
aws cloudwatch put-metric-alarm \\
  --alarm-name score-call-errors \\
  --namespace AWS/Lambda --metric-name Errors \\
  --dimensions Name=FunctionName,Value=score-call \\
  --statistic Sum --period 60 \\
  --evaluation-periods 5 --datapoints-to-alarm 3 \\
  --threshold 5 --comparison-operator GreaterThanOrEqualToThreshold \\
  --treat-missing-data notBreaching \\
  --alarm-description "Runbook: https://wiki.example.com/runbooks/score-call" \\
  --alarm-actions arn:aws:sns:ap-south-1:111122223333:oncall

# Composite: page only when BOTH symptoms are true
aws cloudwatch put-composite-alarm \\
  --alarm-name scoring-pipeline-degraded \\
  --alarm-rule 'ALARM("score-call-error-rate") AND ALARM("scoring-queue-age")' \\
  --alarm-actions arn:aws:sns:ap-south-1:111122223333:oncall</code></pre>

<h3>9. Dashboards</h3>
<p>Dashboards are JSON documents of widgets: metric graphs, single values, Logs Insights tables, alarm status and text. Build them in IaC so every stage gets the same view. Keep one <strong>service health</strong> dashboard (RED metrics + queue age + DLQ + top errors) per service, and resist "wall of 60 charts" dashboards. Dashboards can mix regions, and with cross-account observability (a monitoring account linked to source accounts) they can mix accounts. Pricing is a small monthly fee per dashboard beyond a free allowance.</p>

<h3>10. Tracing: X-Ray and OpenTelemetry</h3>
<ul>
  <li><strong>Trace</strong> = one request end to end. Each service contributes a <strong>segment</strong>, and calls inside a service (DynamoDB, HTTP, SQL) are <strong>subsegments</strong>.</li>
  <li><strong>Annotations</strong> are indexed key/values you can filter traces by (<code>annotation.tenantId = "t_acme"</code>). <strong>Metadata</strong> is not indexed and is used for debugging payloads. Put the IDs you will search by in annotations.</li>
  <li><strong>Propagation:</strong> the <code>X-Amzn-Trace-Id</code> header (<code>Root=1-…;Parent=…;Sampled=1</code>). API Gateway and Lambda participate when tracing is enabled (Lambda "active tracing"). SQS carries the trace context in a message system attribute, so the consumer's trace links to the producer's.</li>
  <li><strong>Sampling:</strong> the default rule records the first request each second plus 5% of the rest. Customise per route, for example 100% for <code>POST /payments</code> and less for health checks.</li>
  <li><strong>Direction of travel:</strong> AWS offers the AWS Distro for OpenTelemetry (ADOT) and steers new instrumentation toward OTel. There are newer options that ingest spans as structured logs for full-fidelity search, and Application Signals builds service maps and SLOs on top. Check current docs for the support status of the classic X-Ray SDKs before choosing.</li>
</ul>
<pre><code class="language-ts">// Powertools Tracer sketch (check current docs for exact API)
import { Tracer } from '@aws-lambda-powertools/tracer';
import { S3Client } from '@aws-sdk/client-s3';

const tracer = new Tracer({ serviceName: 'scorer' });
const s3 = tracer.captureAWSv3Client(new S3Client({}));   // every S3 call becomes a subsegment

export const handler = async (event: { callId: string; tenantId: string }) =&gt; {
  tracer.putAnnotation('tenantId', event.tenantId);         // searchable
  tracer.putMetadata('input', event);                       // not searchable
  // ...
};</code></pre>

<h3>11. Pricing levers you should quote (approximate, us-east-1, at the time of writing; check current pricing)</h3>
<table>
  <thead><tr><th>Item</th><th>Rough price</th><th>Why it bites</th></tr></thead>
  <tbody>
    <tr><td>Log ingestion (Standard)</td><td>~$0.50 / GB (IA roughly half; Lambda logs now on tiered "vended" pricing)</td><td>Usually the #1 CloudWatch line item. DEBUG in prod multiplies it</td></tr>
    <tr><td>Log storage</td><td>~$0.03 / GB-month</td><td>Never-expire retention compounds monthly</td></tr>
    <tr><td>Logs Insights</td><td>~$0.005 / GB scanned</td><td>Dashboards with query widgets re-run on every refresh</td></tr>
    <tr><td>Custom metrics</td><td>~$0.30 / metric-month for the first 10k, cheaper in higher tiers</td><td>High-cardinality dimensions create thousands of metrics</td></tr>
    <tr><td>Alarms</td><td>~$0.10 / standard alarm-metric-month; more for high-res, anomaly and composite</td><td>Per-entity alarms (one per tablet) scale linearly</td></tr>
    <tr><td>API calls (GetMetricData etc.)</td><td>~$0.01 per 1,000 metrics requested</td><td>Third-party tools polling CloudWatch every minute</td></tr>
    <tr><td>X-Ray</td><td>~$5 per million traces recorded (free tier exists)</td><td>100% sampling on a high-RPS API</td></tr>
  </tbody>
</table>
<p>Back-of-envelope: 50 functions × 1M invocations/day × 1 KB of logs each = 50 GB/day, about 1.5 TB/month, so roughly <strong>$750/month just to ingest</strong>, before storage. Cutting log volume (sampling DEBUG, dropping request-body dumps) is usually the biggest lever.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: an SQS-driven scoring Lambda with logs, EMF and partial-batch failure</h3>
<p>A worker consumes "score this call" messages (see <a href="#/topic/cloud-sqs">SQS</a> and <a href="#/topic/cloud-lambda">Lambda</a>). It produces one structured log line per outcome, one EMF line per outcome, a correlation ID carried from the API request that enqueued the job, and per-message failure reporting so one bad call does not retry the whole batch.</p>
<pre><code class="language-ts">// src/handlers/score-call.ts
import type { Context, SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { log, setLogContext } from '../lib/log';
import { emitMetrics } from '../lib/metrics';
import { scoreCall } from '../domain/scoring';

const NS = 'CallScoring';
const DIMS = { Service: 'scorer', Stage: process.env.STAGE ?? 'dev' };

type Job = { callId: string; tenantId: string; correlationId: string };

export const handler = async (event: SQSEvent, context: Context): Promise&lt;SQSBatchResponse&gt; =&gt; {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    const job = JSON.parse(record.body) as Job;
    setLogContext({
      requestId: context.awsRequestId,
      correlationId: job.correlationId,
      callId: job.callId,
      tenantId: job.tenantId,
      receiveCount: Number(record.attributes.ApproximateReceiveCount),
    });
    const started = Date.now();

    try {
      const result = await scoreCall(job.callId);
      const durationMs = Date.now() - started;
      emitMetrics(NS, DIMS, {
        CallsScored:    { value: 1, unit: 'Count' },
        ScoringLatency: { value: durationMs, unit: 'Milliseconds' },
        LlmTokens:      { value: result.tokensUsed, unit: 'Count' },
      }, { callId: job.callId, tenantId: job.tenantId });
      log.info('call scored', { score: result.score, durationMs });
    } catch (err) {
      emitMetrics(NS, DIMS, { ScoringFailures: { value: 1, unit: 'Count' } }, { callId: job.callId });
      log.error('scoring failed', { err, durationMs: Date.now() - started });
      batchItemFailures.push({ itemIdentifier: record.messageId });   // only this one retries
    }
  }
  return { batchItemFailures };   // requires ReportBatchItemFailures on the event source mapping
};</code></pre>
<p>What this gives you: an alarm on <code>ScoringFailures</code>, a p99 graph of <code>ScoringLatency</code>, token spend per stage, and when a customer asks "why wasn't call c_9f2a scored?", one query: <code>filter callId = "c_9f2a" | sort @timestamp asc</code>.</p>

<h3>Example 2: a Logs Insights cookbook for incidents</h3>
<pre><code class="language-text"># 1) Error breakdown in the incident window: what kinds, how many
filter level = "ERROR"
| stats count(*) as n by err.name, msg
| sort n desc

# 2) Is it one tenant? (who is hit hardest)
filter level = "ERROR"
| stats count(*) as errors, count_distinct(correlationId) as requests by tenantId
| sort errors desc
| limit 10

# 3) Follow ONE request across several log groups (select api, worker, notifier groups)
filter correlationId = "7d1e0c4a-..."
| fields @timestamp, @log, level, msg
| sort @timestamp asc

# 4) Errors vs total per 5 minutes from your own logs (when you lack a metric)
fields strcontains(level, "ERROR") as isError
| stats sum(isError) as errors, count(*) as total by bin(5m)

# 5) Which messages are being retried (poison-pill hunting)
filter receiveCount &gt; 1
| stats max(receiveCount) as maxReceives by callId
| sort maxReceives desc</code></pre>
<p>Save the good ones as <strong>saved queries</strong> and link them from the runbook. During an incident, nobody should be writing <code>stats</code> syntax from memory.</p>

<h3>Example 3: CDK stack with retention, alarms, a composite alarm and a dashboard</h3>
<pre><code class="language-ts">// lib/scoring-observability.ts (aws-cdk-lib v2)
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';

export class ScoringStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, 'ScoreLogs', {
      retention: logs.RetentionDays.ONE_MONTH,          // never "never expire"
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const dlq = new sqs.Queue(this, 'ScoreDlq', { retentionPeriod: Duration.days(14) });
    const queue = new sqs.Queue(this, 'ScoreQueue', {
      visibilityTimeout: Duration.seconds(360),          // ≥ 6 × function timeout is common guidance
      deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
    });

    const fn = new nodejs.NodejsFunction(this, 'ScoreFn', {
      entry: 'src/handlers/score-call.ts',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: Duration.seconds(60),
      tracing: lambda.Tracing.ACTIVE,
      loggingFormat: lambda.LoggingFormat.JSON,
      logGroup,                                          // explicit, IaC-owned log group
      environment: { SERVICE_NAME: 'scorer', STAGE: 'prod', LOG_LEVEL: 'INFO' },
    });

    const oncall = new sns.Topic(this, 'Oncall');
    oncall.addSubscription(new subs.EmailSubscription('oncall@example.com'));
    const page = new cwActions.SnsAction(oncall);

    // 1) Error RATE, not raw count
    const errorRate = new cw.MathExpression({
      expression: 'IF(invocations &gt; 0, 100 * errors / invocations, 0)',
      usingMetrics: {
        errors: fn.metricErrors({ statistic: 'Sum' }),
        invocations: fn.metricInvocations({ statistic: 'Sum' }),
      },
      period: Duration.minutes(5),
      label: 'Error rate %',
    });
    const errorRateAlarm = errorRate.createAlarm(this, 'ErrorRate', {
      alarmName: 'score-call-error-rate',
      threshold: 5,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'More than 5% of scoring invocations failing. Runbook: https://wiki.example.com/rb/scoring',
    });

    // 2) Backlog: the user-visible symptom for async work is "how stale is the oldest job"
    const queueAgeAlarm = queue.metricApproximateAgeOfOldestMessage({
      period: Duration.minutes(1), statistic: 'Maximum',
    }).createAlarm(this, 'QueueAge', {
      alarmName: 'scoring-queue-age',
      threshold: 15 * 60,                                 // 15 min behind = customers notice
      evaluationPeriods: 5,
      datapointsToAlarm: 5,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // 3) Anything in the DLQ needs a human, but as a ticket, not a 3am page
    const dlqAlarm = dlq.metricApproximateNumberOfMessagesVisible({
      period: Duration.minutes(5), statistic: 'Maximum',
    }).createAlarm(this, 'DlqNotEmpty', {
      alarmName: 'scoring-dlq-not-empty',
      threshold: 0,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // 4) Composite: page once, and only when failures are actually hurting users,
    //    i.e. jobs are failing AND the backlog is ageing. The children have no actions.
    const degraded = new cw.CompositeAlarm(this, 'PipelineDegraded', {
      compositeAlarmName: 'scoring-pipeline-degraded',
      alarmRule: cw.AlarmRule.allOf(
        cw.AlarmRule.fromAlarm(errorRateAlarm, cw.AlarmState.ALARM),
        cw.AlarmRule.fromAlarm(queueAgeAlarm, cw.AlarmState.ALARM),
      ),
    });
    degraded.addAlarmAction(page);

    // Lower urgency: a chat/ticket topic for the individual signals
    const ticket = new cwActions.SnsAction(new sns.Topic(this, 'OpsChannel'));
    queueAgeAlarm.addAlarmAction(ticket);   // slow backlog with no errors (e.g. throttling)
    dlqAlarm.addAlarmAction(ticket);        // poison messages need a human, not at 3am

    // 5) One health dashboard per service
    new cw.Dashboard(this, 'ScoringDashboard', {
      dashboardName: 'scoring-prod',
      widgets: [
        [
          new cw.GraphWidget({ title: 'Invocations vs errors', left: [fn.metricInvocations()], right: [fn.metricErrors()], width: 8 }),
          new cw.GraphWidget({ title: 'Duration p50 / p99', left: [fn.metricDuration({ statistic: 'p50' }), fn.metricDuration({ statistic: 'p99' })], width: 8 }),
          new cw.GraphWidget({ title: 'Queue age (s)', left: [queue.metricApproximateAgeOfOldestMessage()], width: 8 }),
        ],
        [
          new cw.SingleValueWidget({ title: 'DLQ depth', metrics: [dlq.metricApproximateNumberOfMessagesVisible()], width: 6 }),
          new cw.AlarmStatusWidget({ title: 'Alarms', alarms: [errorRateAlarm, queueAgeAlarm, dlqAlarm], width: 6 }),
          new cw.LogQueryWidget({
            title: 'Latest errors',
            logGroupNames: [logGroup.logGroupName],
            queryLines: ['fields @timestamp, correlationId, msg, err.message', 'filter level = "ERROR"', 'sort @timestamp desc', 'limit 20'],
            width: 12,
          }),
        ],
      ],
    });
  }
}</code></pre>
<p>Note the shape: a short error burst that SQS retries absorb never pages anyone, because the backlog doesn't age. A backlog that ages <em>without</em> errors (throttling, an under-provisioned worker) reaches the ops channel through the child alarm. Only "failing and falling behind" wakes a human. In a stricter setup you would add a second, higher queue-age threshold (say 60 minutes) that pages on its own. Many teams also add a p99-duration alarm, an alarm on <code>Throttles &gt; 0</code> as a ticket, and a billing alarm. Prop names follow aws-cdk-lib v2; verify against your CDK version.</p>

<h3>Example 4: a metric filter for code you can't change</h3>
<p>A legacy booking service logs <code>BOOKING_CONFLICT room=R12 slot=09:00</code> as plain text. You want a count and an alarm on spikes without a deploy:</p>
<pre><code class="language-ts">new logs.MetricFilter(this, 'BookingConflicts', {
  logGroup: legacyLogGroup,
  filterPattern: logs.FilterPattern.literal('BOOKING_CONFLICT'),
  metricNamespace: 'Bookings',
  metricName: 'Conflicts',
  metricValue: '1',
  defaultValue: 0,          // publish 0 when nothing matches, so the graph isn't gappy
});</code></pre>
<p>It only counts events from creation onwards. For history, run a Logs Insights <code>stats count(*) by bin(1h)</code> over the old data.</p>

<h3>Example 5: are the meeting-room tablets online? (heartbeat design)</h3>
<p>Picture 400 booking tablets sending a heartbeat every 60 s. The naive design is a custom metric per device (dimension <code>DeviceId</code>) with one alarm each using <code>TreatMissingData=breaching</code>. That is 400 metrics plus 400 alarms, around $160/month at the time of writing, and it scales linearly with every customer site. It also pages 400 times when the office Wi-Fi drops.</p>
<table>
  <thead><tr><th>Design</th><th>Cost/scale</th><th>Tells you which device?</th><th>Verdict</th></tr></thead>
  <tbody>
    <tr><td>Metric + alarm per device</td><td>Linear in devices</td><td>Yes</td><td>OK for 20 devices, bad for 20,000</td></tr>
    <tr><td>One <code>HeartbeatsReceived</code> Sum vs expected count</td><td>Constant</td><td>No</td><td>Good fleet-level signal, poor triage</td></tr>
    <tr><td><strong>Store <code>lastSeenAt</code> in the DB; a scheduled Lambda emits <code>StaleDevices</code> (count) via EMF, logs the IDs, and dimensions by site</strong></td><td>Constant metrics</td><td>Yes, via the log line / API</td><td><strong>Recommended</strong></td></tr>
  </tbody>
</table>
<pre><code class="language-ts">// scheduled every 5 min (EventBridge Scheduler / rule)
export const handler = async () =&gt; {
  const stale = await db.devices.findMany({ where: { lastSeenAt: { lt: new Date(Date.now() - 5 * 60_000) } } });
  const bySite = new Map&lt;string, string[]&gt;();
  for (const d of stale) bySite.set(d.siteId, [...(bySite.get(d.siteId) ?? []), d.id]);

  for (const [siteId, ids] of bySite) {
    // siteId is bounded (tens of sites), so it is fine as a dimension; device IDs are context
    emitMetrics('Fleet', { Site: siteId }, { StaleDevices: { value: ids.length, unit: 'Count' } }, { deviceIds: ids });
  }
  emitMetrics('Fleet', { Scope: 'all' }, { StaleDevices: { value: stale.length, unit: 'Count' } });
};
// Alarm: Fleet/StaleDevices{Scope=all} &gt; 10% of fleet for 2 of 3 periods → page.
// Per-site alarm only for sites with an SLA. Note the alarm on the JOB itself
// (Invocations missing → TreatMissingData=breaching) so a dead checker doesn't look "green".</code></pre>
<p>The last comment is the senior detail: <strong>monitor the monitor</strong>. If the scheduled checker stops running, <code>StaleDevices</code> stops reporting, and with <code>notBreaching</code> everything looks fine.</p>

<h3>Example 6: the same alarm via the CLI with anomaly detection (shape)</h3>
<pre><code class="language-bash">aws cloudwatch put-metric-alarm --alarm-name bookings-traffic-drop \\
  --comparison-operator LessThanLowerThreshold --evaluation-periods 3 \\
  --threshold-metric-id band --metrics file://metrics.json \\
  --alarm-actions arn:aws:sns:ap-south-1:111122223333:oncall</code></pre>
<pre><code class="language-json">[
  { "Id": "m1", "ReturnData": true,
    "MetricStat": { "Metric": { "Namespace": "AWS/ApiGateway", "MetricName": "Count",
                                "Dimensions": [{ "Name": "ApiName", "Value": "bookings" }] },
                    "Period": 300, "Stat": "Sum" } },
  { "Id": "band", "Expression": "ANOMALY_DETECTION_BAND(m1, 2)", "Label": "expected range" }
]</code></pre>
<p>"Traffic dropped below its normal Tuesday-10am range" catches a silent failure, such as a broken mobile release that stops calling the API, which no error-rate alarm will ever see. Check current docs for exact <code>ReturnData</code> rules on band alarms.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. The log group that IaC doesn't own</h3>
<p>Lambda creates <code>/aws/lambda/&lt;fn&gt;</code> on first invoke if it doesn't exist. That group has no retention and is not deleted with your stack. If you later add the same group to IaC, the deploy can fail with "already exists". Fix: declare the log group in IaC <em>before</em> the function first runs (or pass it as the function's custom log group), and import or delete orphaned groups once.</p>

<h3>2. Errors with no traffic, and heartbeats with no data</h3>
<p>A Lambda that isn't invoked publishes no <code>Errors</code> datapoint. With the default <code>missing</code>, the alarm can sit in INSUFFICIENT_DATA, and some teams wire that to paging by mistake. Use <code>notBreaching</code> for error metrics. For "this thing must report" metrics (heartbeats, a cron job's success count), use <code>breaching</code>, so silence becomes an alarm.</p>

<h3>3. Percentiles on tiny samples</h3>
<p>The p99 of 30 requests is basically the max. A low-traffic endpoint at night flaps a p99 alarm. Combine with a minimum-sample guard (metric math with <code>SampleCount</code>), use a longer period at night, or alarm on p95/p90.</p>

<h3>4. Average of averages / wrong statistic</h3>
<p>Graphing <code>Average</code> of <code>Errors</code> gives "average errors per datapoint", not an error rate. Counts take <code>Sum</code>, latency takes percentiles, queue age takes <code>Maximum</code>, and concurrency takes <code>Maximum</code>. Mixing units on one metric (ms in one place, seconds in another) quietly corrupts statistics.</p>

<h3>5. EMF lines that produce no metric</h3>
<p>Common causes: the metric value isn't a number (a string "120"), a dimension listed in <code>Dimensions</code> is missing from the root, the <code>Timestamp</code> is outside the accepted window, too many metrics in one line, the line was split because it was too long, or the line is prefixed by the runtime so it isn't pure JSON. Check by querying the raw line in Logs Insights first.</p>

<h3>6. Logs Insights cost surprises</h3>
<p>A dashboard <code>LogQueryWidget</code> over 30 days of a 2 TB log group, auto-refreshing every minute, is a scan bill. Keep query widgets on short ranges, or turn the signal into a metric.</p>

<h3>7. Metric filter is not retroactive</h3>
<p>You add a filter mid-incident and the graph starts at "now". For the past, use Logs Insights.</p>

<h3>8. Async Lambda failures are invisible to API metrics</h3>
<p>S3 → Lambda and SNS → Lambda are async invocations. Failures retry (twice by default) and are then dropped unless you configure a DLQ or on-failure destination. Watch <code>AsyncEventsDropped</code>, <code>AsyncEventAge</code> and <code>DeadLetterErrors</code>. The API's 5xx graph will look perfect while uploads silently go unprocessed.</p>

<h3>9. Throttles are not Errors</h3>
<p><code>Throttles</code> is a separate metric. A function capped by reserved concurrency can drop events, or back up an SQS queue, without raising <code>Errors</code>. Alarm on throttles (or on queue age, the downstream symptom).</p>

<h3>10. Trace gaps</h3>
<p>Sampling means most requests have <em>no</em> trace, so don't rely on traces for audits. Async hops (SQS, EventBridge) and third-party HTTP calls break the chain unless context is propagated. A correlation ID in logs is the always-on backstop.</p>

<h3>11. Warm-container context leakage</h3>
<p>Module-level state survives between invocations. A logger with <code>appendKeys({ userId })</code> that is never cleared will stamp user A's ID on user B's logs. Reset context per invocation (and per SQS record).</p>

<h3>12. Event size limits and truncation</h3>
<p>Very large log events get truncated or rejected (the per-event max was 256 KB for years; check current limits). Dumping a whole LLM response or base64 image into a log line loses the end of the line, which often holds the error, and costs money.</p>

<h3>13. Regions and accounts</h3>
<p>Metrics and alarms are regional. An alarm watches a metric in its own region. Billing metrics live in us-east-1. For multi-account orgs, set up cross-account observability into a monitoring account rather than logging into ten consoles.</p>

<h3>14. PII and secrets in logs</h3>
<p>Logging request bodies leaks emails, phone numbers and auth headers into a system with broad read access and long retention. Redact at the logger (an allowlist of fields), never log tokens, and add data-protection policies as a backstop.</p>

<h3>15. SQS metrics and idle queues</h3>
<p>SQS metrics are reported at one-minute granularity, but a queue that has been idle for a long period can stop publishing until activity resumes (check current docs for the exact behaviour). An alarm on an idle queue may see "missing" data. Choose <code>TreatMissingData</code> deliberately.</p>

<h3>16. Mobile and client-side signals</h3>
<p>CloudWatch sees the backend. A React Native app that never reaches your API (bad config in a release, a TLS issue, a crash on launch) produces <em>no</em> server-side signal at all, except a traffic drop. Pair with client crash reporting (see <a href="#/topic/mprod-crash">Crash Reporting</a>) and an anomaly-detection alarm on request volume.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1: never-expire retention everywhere</h3>
<p>The default is forever, and storage grows every month. Fix: set retention in IaC for every group (7–30 days for app logs, longer only where compliance requires, plus archive to S3 via a subscription or export for cheap long-term storage).</p>

<h3>Anti-pattern 2: plain-text logs</h3>
<pre><code class="language-ts">// ❌ unqueryable, unparseable
console.log('Booking failed for ' + userId + ' in room ' + roomId + ': ' + err);

// ✅ one JSON object, stable keys, error serialised
log.error('booking failed', { userId, roomId, err });</code></pre>

<h3>Anti-pattern 3: userId / requestId as a metric dimension</h3>
<p>20,000 users × 3 metrics = 60,000 custom metrics. At first-tier pricing (~$0.30 for 10k, then ~$0.10) that is roughly $8,000/month at the time of writing, for data nobody graphs. Fix: bounded dimensions only (service, stage, route, status class, site). High-cardinality IDs go in EMF context, log fields and trace annotations.</p>

<h3>Anti-pattern 4: PutMetricData in the request path</h3>
<p>A synchronous API call per request adds latency, can be throttled, and fails the request if you <code>await</code> it without a try/catch. Use EMF.</p>

<h3>Anti-pattern 5: paging on "Errors &gt;= 1"</h3>
<p>One transient timeout at 3am wakes someone, and by the fifth night they mute the channel. Fix: alarm on the error <em>rate</em> with M-of-N, page on user-facing symptoms, and send single failures to a ticket or dashboard.</p>

<h3>Anti-pattern 6: alarms without a runbook or owner</h3>
<p>"score-call-errors is in ALARM" at 3am with no context. Fix: every alarm description carries what it means, the first query to run (a saved Logs Insights query), the dashboard link and the owning team.</p>

<h3>Anti-pattern 7: average latency on dashboards and alarms</h3>
<p>Fix: p50 + p99 on graphs, p99 (or p95) in alarms. See <a href="#/topic/be-observability">Observability</a> for why tails matter.</p>

<h3>Anti-pattern 8: DEBUG logging left on in prod</h3>
<p>This often doubles or triples ingestion. Fix: INFO by default, the level from an env var or the platform log-level setting, and if you need DEBUG detail, sample it (log DEBUG for 1% of invocations) or switch it on per function during an incident.</p>

<h3>Anti-pattern 9: logging whole payloads</h3>
<p>Request bodies, LLM prompts and responses, presigned URLs, and tokens. These carry cost, PII and security risk at once. Fix: log IDs, sizes and hashes. Keep full payloads in S3 with tight access if you truly need replay.</p>

<h3>Anti-pattern 10: one alarm per entity</h3>
<p>Per-device, per-tenant or per-queue-shard alarms scale linearly in cost and noise. Fix: aggregate metrics, then find the culprit with Contributor Insights or a scheduled check that emits counts and logs IDs (Example 5).</p>

<h3>Anti-pattern 11: no alarm on async backlog</h3>
<p>Teams alarm on API 5xx and forget that queue workers fail silently. The symptom users feel is <em>staleness</em>, so alarm on <code>ApproximateAgeOfOldestMessage</code> and DLQ depth.</p>

<h3>Anti-pattern 12: console clicking alarms into existence</h3>
<p>Hand-made alarms drift, are missing in staging, and die with the person who made them. Fix: alarms and dashboards in CDK/Terraform next to the resource they watch (see <a href="#/topic/cloud-cicd">CI/CD &amp; IaC</a>).</p>

<h3>Anti-pattern 13: mutable logger context in warm containers</h3>
<p>Context keys appended once and never cleared stamp the wrong user or tenant on later invocations. This is a privacy bug, not just a debugging one. Reset per invocation.</p>

<h3>Anti-pattern 14: "monitoring" that can't fail loudly</h3>
<p>A health-check Lambda whose own failure shows as missing data, with <code>notBreaching</code>. Monitor the monitor: alarm on its invocations, or treat missing data as breaching.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you set up observability for a serverless app on AWS?</div>
  <div class="qa-answer">
    <p>Four layers. <strong>Logs:</strong> structured JSON from every Lambda, with a correlation ID generated at the edge (API Gateway request or client header) and carried through SQS message bodies or attributes, explicit log groups with retention in IaC, INFO level by default. <strong>Metrics:</strong> vended metrics for free, plus a handful of business metrics via EMF (bookings created, calls scored, LLM tokens) with low-cardinality dimensions. <strong>Alarms:</strong> on symptoms (API 5xx rate, p99 latency, queue age, DLQ depth), using M-of-N, combined with composite alarms, each with a runbook, routed through SNS to chat and a pager. <strong>Tracing:</strong> active tracing on API Gateway and Lambda (or OTel) with tenant and entity IDs as annotations. Then one dashboard per service, and cost guards: retention, sampling, no payload logging.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is EMF and why would you use it instead of PutMetricData?</div>
  <div class="qa-answer">
    <p>Embedded Metric Format is a JSON log line with an <code>_aws.CloudWatchMetrics</code> block declaring which root fields are metrics and which are dimensions. CloudWatch Logs extracts the metrics asynchronously. Compared with <code>PutMetricData</code>: there's no network call in the hot path (no added latency, no API throttling, no failure mode in your request), you batch many metrics into one line, and the same line keeps high-cardinality context (callId, tenantId) that you can query in Logs Insights without paying for it as a metric dimension. The trade-off is that you pay log ingestion for the line, and extraction is asynchronous, so there's a small delay before the metric shows up.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Write a Logs Insights query for p99 latency per route over the last hour, worst first.</div>
  <div class="qa-answer">
<pre><code class="language-text">filter ispresent(durationMs)
| stats count(*) as n, pct(durationMs, 50) as p50, pct(durationMs, 99) as p99 by route
| sort p99 desc
| limit 20</code></pre>
    <p>Then add: "If it's a Lambda and I don't log duration myself, I'd use <code>filter @type = "REPORT" | stats pct(@duration, 99) by bin(5m)</code>, but that's per function, not per route, which is why I log route and durationMs. I'd also check the count column, because a p99 over 15 requests is noise."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you alarm on something that only appears in logs?</div>
  <div class="qa-answer">
    <p>Alarms only evaluate metrics, so first bridge the log to a metric. If I own the code, I emit an EMF metric at the point the event happens (best: typed, dimensioned, context kept). If I don't own the code, I create a metric filter with a filter pattern on the log group, emitting 1 per match with a default value of 0, and alarm on its Sum. Caveats: metric filters aren't retroactive, and their patterns use a different syntax from Logs Insights.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Explain period, evaluation periods, datapoints-to-alarm and TreatMissingData with a real example.</div>
  <div class="qa-answer">
    <p>For "error rate &gt; 5%": period 5 minutes (each datapoint is a 5-minute error rate), evaluation periods 3, datapoints-to-alarm 2. The alarm fires if 2 of the last 3 five-minute windows breach, which ignores a single blip but reacts within about 10–15 minutes. TreatMissingData is <code>notBreaching</code> because no invocations means nothing is failing. Contrast with a tablet-fleet heartbeat or a nightly job's success metric: there missing data <em>is</em> the failure, so it's <code>breaching</code>. Actions fire on state change, so M-of-N also stops a flapping alarm from spamming the channel.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What are composite alarms and when do they help?</div>
  <div class="qa-answer">
    <p>A composite alarm's state is a boolean rule over other alarms, e.g. <code>ALARM(api-5xx-rate) AND ALARM(api-p99)</code>, or <code>ALARM(queue-age) AND NOT ALARM(deploy-in-progress)</code>. They help in three ways. <strong>Noise reduction:</strong> one page for a correlated incident instead of six. <strong>Precision:</strong> page only when two weak signals agree. <strong>Suppression:</strong> mute child alarms during maintenance or when a known upstream dependency is down. A common pattern is child alarms with no actions and only the composite wired to the pager.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you trace one request from the mobile app through API Gateway, Lambda, SQS and a worker Lambda?</div>
  <div class="qa-answer">
    <p>Two complementary mechanisms. <strong>Tracing:</strong> enable X-Ray (or OTel via ADOT) on the API stage and both functions. The trace header propagates from API Gateway to Lambda, and SQS carries trace context in a message system attribute, so the worker's segment links to the producer's. Add annotations (tenantId, bookingId) so I can search traces. <strong>Correlation ID:</strong> sampling means most requests have no trace, so I also generate or accept a correlation ID (an <code>x-correlation-id</code> from the RN client, or the API Gateway request ID), log it on every line, put it in the SQS message, and re-establish it in the worker's log context. Then one Logs Insights query across the API and worker log groups (<code>filter correlationId = "…" | sort @timestamp asc</code>) shows the whole story, every time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Your CloudWatch bill doubled last month. How do you investigate and fix it?</div>
  <div class="qa-answer">
    <p>Start with Cost Explorer filtered to CloudWatch, grouped by usage type: is it log ingestion (<code>DataProcessing-Bytes</code>), storage, custom metrics, Logs Insights scans, alarms, or API calls such as GetMetricData from a vendor integration? Then find the culprit. For logs, the per-log-group <code>IncomingBytes</code> metric shows which function got noisy; usually it's a DEBUG flag or a new payload dump. For metrics, look for new namespaces or a dimension that went high-cardinality (someone added userId). For Insights, look for dashboards with query widgets on long ranges. Fixes: lower the log level and sample DEBUG, stop logging bodies, set retention, move cold groups to the Infrequent Access class, archive to S3, collapse dimensions, and lengthen polling intervals for the vendor. Then add a billing alarm and an <code>IncomingBytes</code> anomaly alarm so it can't happen silently again.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. FDE scenario: a customer says "uploaded call recordings sometimes never get a score, and your API shows no errors." What do you do?</div>
  <div class="qa-answer">
    <p>"No API errors" fits, because the failure is probably in the async half. My steps: (1) Get one concrete example: the callId and the upload time. (2) Run Logs Insights over the upload-API, S3-event and worker log groups with <code>filter callId = "…"</code> to see how far it got. (3) Check the async path's metrics. Is there an S3 event notification for that prefix and suffix (a <code>.M4A</code> vs <code>.m4a</code> filter mismatch is a classic)? Did the Lambda async invocation drop the event (<code>AsyncEventsDropped</code>)? What are SQS <code>ApproximateAgeOfOldestMessage</code> and DLQ depth? Is the worker throttled (<code>Throttles</code>)? Is it timing out on long recordings (<code>filter @message like /Task timed out/</code>)? (4) Fix the root cause, redrive the DLQ, and backfill the missed calls. (5) Close the gap so I'd have known before the customer did: alarms on DLQ depth and queue age, plus a reconciliation metric ("uploads older than 30 min with no score") emitted by a scheduled job. Then I reply to the customer with what happened, what we fixed, and what now alerts us.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. X-Ray vs OpenTelemetry: which would you choose today?</div>
  <div class="qa-answer">
    <p>For new work I'd instrument with OpenTelemetry (via ADOT or the OTel SDK). It's vendor-neutral, so the same instrumentation can send to CloudWatch/X-Ray today and Datadog or Honeycomb later, and AWS's own direction is OTel-first (Application Signals is built on it). X-Ray-native SDKs and Powertools Tracer are fine for existing Lambda-heavy codebases and are very low effort. Either way the concepts are the same (spans, context propagation, sampling, annotations), and I'd check the current support status of the X-Ray SDKs before choosing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How would you design alerts that don't cause fatigue?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Page on symptoms, ticket on causes:</strong> 5xx rate, p99, queue age and SLO burn page someone. CPU, single errors, DLQ &gt; 0 and throttles go to a ticket or channel.</li>
      <li><strong>Rates and percentiles</strong>, not raw counts or averages; M-of-N to absorb blips.</li>
      <li><strong>Composite alarms</strong> to dedupe correlated alarms and suppress during deploys.</li>
      <li><strong>Every page is actionable:</strong> a runbook link, an owner, a saved query. An alarm nobody acts on gets deleted or downgraded.</li>
      <li><strong>Review:</strong> track pages per week. If an alarm fired and the answer was "ignore", fix the alarm.</li>
      <li>For SLO-based paging and multi-window burn rates, see <a href="#/topic/be-observability">Observability</a>.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Probing follow-up: "Why not just alarm on Lambda Errors &gt; 0 for every function?"</div>
  <div class="qa-answer">
    <p>Because it measures the wrong thing at the wrong sensitivity. A function handling 1M invocations a day will always have a few transient errors that succeed on retry (SQS redelivers, clients retry), so the alarm would fire constantly and train people to ignore it. It also misses failures that aren't <code>Errors</code>: throttles, dropped async events, timeouts that the client sees as 504, and silent backlog growth. I'd alarm on the error rate with M-of-N for the user-facing path, on queue age and DLQ for async paths, and keep per-function error counts on the dashboard.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. CloudWatch or Datadog for this company?</div>
  <div class="qa-answer">
    <p>It depends on scale, team and constraints. Small team, AWS-only, cost-sensitive, or with data-residency or compliance requirements: CloudWatch, which needs zero agents, keeps data in the account, and is good enough with JSON logs and EMF. Multiple clouds, heavy microservices, a need for strong APM and correlation UX, and budget to pay for it: a vendor. In either case I'd instrument with open formats (JSON logs, OTel traces, EMF or OTel metrics) so switching later is a forwarding change, not a rewrite. Many teams run both: CloudWatch as the always-on source and a vendor fed by subscription filters or the Lambda extension.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You set retention and log level deliberately and know logs are the main cost.</li>
    <li>You explain EMF and keep high-cardinality IDs out of dimensions.</li>
    <li>You alarm on rates, percentiles and queue age, using M-of-N and TreatMissingData correctly.</li>
    <li>You use composite alarms to reduce noise, and every alarm has a runbook.</li>
    <li>You can write a Logs Insights query on the whiteboard.</li>
    <li>You carry a correlation ID across async hops and don't rely on sampled traces alone.</li>
    <li>You remember that async failures don't show up in API metrics.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Write a Logs Insights query that counts Lambda cold starts per hour.</div>
  <div class="qa-answer">
    <p>Cold starts show up on the Lambda <code>REPORT</code> line as an <code>@initDuration</code> field, which is only present when the environment was initialised for that invocation:</p>
    <pre><code>filter @type = "REPORT" and ispresent(@initDuration)
| stats count(*) as coldStarts, avg(@initDuration) as avgInitMs, max(@initDuration) as maxInitMs by bin(1h)</code></pre>
    <p>The same <code>REPORT</code> fields (<code>@duration</code>, <code>@maxMemoryUsed</code>, <code>@memorySize</code>) answer latency and memory questions. Narrow the time range first, because Logs Insights bills per GB scanned and <code>limit</code> doesn't reduce that.</p>
  </div>
</div>
` },

  ]
});
