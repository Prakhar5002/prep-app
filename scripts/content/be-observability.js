window.PREP_SITE.registerTopic({
  id: 'be-observability',
  module: 'backend',
  title: 'Observability',
  estimatedReadTime: '45 min',
  tags: ['observability', 'logs', 'metrics', 'traces', 'opentelemetry', 'sli', 'slo', 'sla', 'alerting', 'apm'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Observability</strong> is how you debug production. The classic three pillars — <strong>logs</strong>, <strong>metrics</strong>, <strong>traces</strong> — answer different questions: "what happened to this one request" (logs + traces), "what's the system doing aggregate" (metrics), "where did this slow request spend its time" (traces). Build observability before you need it; the worst time to wire telemetry is during an outage.</p>
<ul>
  <li><strong>Logs:</strong> structured (JSON) per-event records. Searchable + queryable in aggregator (Datadog / Splunk / ELK).</li>
  <li><strong>Metrics:</strong> numerical time-series — request rate, error rate, latency percentiles, saturation. Aggregated, cheap, alertable.</li>
  <li><strong>Traces:</strong> per-request distributed timeline across services. Identifies which span is slow. OpenTelemetry is the standard.</li>
  <li><strong>SLI / SLO / SLA:</strong> SLI = the indicator metric (99% of requests &lt; 200ms); SLO = your internal target; SLA = customer contract.</li>
  <li><strong>Error budget:</strong> 100% - SLO target. Spend on outages or risky deploys; when burned, freeze risk.</li>
  <li><strong>RED + USE:</strong> RED for services (Rate / Errors / Duration); USE for resources (Utilization / Saturation / Errors).</li>
  <li><strong>Alert on symptoms,</strong> not causes. "Error rate &gt; X%" beats "CPU &gt; 90%."</li>
  <li><strong>Correlation IDs</strong> connect logs across services + with traces. Mandatory.</li>
</ul>
<p><strong>Mantra:</strong> "Logs for narrative. Metrics for trends. Traces for distribution. Correlation IDs everywhere. Alert on user-facing symptoms. SLOs drive priorities."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The three pillars</h3>
<table>
  <thead><tr><th>Pillar</th><th>Answers</th><th>Cost / Cardinality</th></tr></thead>
  <tbody>
    <tr><td>Logs</td><td>"What happened to this specific request?" Specific events, errors, narrative.</td><td>Cheapest per event; volume can balloon. Sample at high traffic.</td></tr>
    <tr><td>Metrics</td><td>"What's the aggregate trend?" Rates, percentiles, saturation.</td><td>Constant cost regardless of traffic; cheap. Cardinality (unique label combinations) is the cost driver.</td></tr>
    <tr><td>Traces</td><td>"Where did this request spend time across services?"</td><td>Per-request; usually sampled (1-10%) at scale.</td></tr>
  </tbody>
</table>

<h3>Why all three?</h3>
<p>Each answers different questions:</p>
<ul>
  <li>Metric: "P99 latency spiked at 14:32." → Tells you something's wrong, not what.</li>
  <li>Trace: "These slow requests all spend 80% of time in <code>db.users.find</code>." → Tells you where, not why.</li>
  <li>Log: "Database connection pool exhausted at 14:31:55, 50 waiters." → Tells you exactly.</li>
</ul>

<p>Together: <em>spike detected → trace identifies bottleneck → log pinpoints cause</em>.</p>

<h3>What "good observability" looks like</h3>
<ul>
  <li>Every request has a correlation ID flowing through every log + span.</li>
  <li>Logs structured (JSON) with consistent fields (level, msg, service, traceId, userId where applicable).</li>
  <li>Metrics: RED per service, USE per resource; latency in percentiles (P50, P95, P99), not averages.</li>
  <li>Traces sampled (head-based for high traffic; tail-based for keeping all errors); critical paths instrumented.</li>
  <li>Dashboards per service + per critical user journey.</li>
  <li>Alerts on user-facing symptoms (error rate, latency, availability), not infra causes.</li>
  <li>SLOs defined; error budget tracked; release pace correlates.</li>
  <li>Runbooks linked to every alert.</li>
  <li>Production has the same observability as staging — actually more.</li>
</ul>

<h3>What "bad observability" looks like</h3>
<ul>
  <li>Plain-string logs: <code>"User Bob did action X"</code> — ungreppable, unaggregatable.</li>
  <li>Metrics on averages instead of percentiles — masks tail latency.</li>
  <li>No correlation IDs; debugging across services takes hours.</li>
  <li>Alerts on CPU / memory directly — pages on benign noise; misses real symptoms.</li>
  <li>Logs sample: 1% in prod — debugging that one user's bug impossible.</li>
  <li>No staging-vs-prod parity; you find prod-only bugs in incidents.</li>
  <li>Dashboards not curated — wall of charts, none telling a story.</li>
  <li>"We don't trace" — single-service observability only; cross-service is a black box.</li>
</ul>

<h3>The "you can't fix what you don't measure" principle</h3>
<p>Most production work is observability work in disguise. Reliable systems are observable systems. Without metrics, latency regressions hide for weeks. Without traces, you can't find the bottleneck. Without logs, you can't reconstruct what happened.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Logs — structured + queryable</h3>
<pre><code class="language-json">// Bad — plain string
"User 42 placed order 99 for $250"

// Good — structured JSON
{
  "ts": "2026-05-04T14:32:11Z",
  "level": "info",
  "msg": "order_placed",
  "service": "orders-api",
  "traceId": "abc123",
  "userId": "u-42",
  "orderId": "o-99",
  "totalCents": 25000,
  "duration_ms": 145
}
</code></pre>

<table>
  <thead><tr><th>Log level</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>FATAL</td><td>Process about to die</td></tr>
    <tr><td>ERROR</td><td>Something failed; user impact possible</td></tr>
    <tr><td>WARN</td><td>Degraded but recovered (retry succeeded, fallback fired)</td></tr>
    <tr><td>INFO</td><td>Significant business events (signup, order placed)</td></tr>
    <tr><td>DEBUG</td><td>Detailed flow info (off in prod)</td></tr>
    <tr><td>TRACE</td><td>Per-call detail (off in prod)</td></tr>
  </tbody>
</table>

<p>Production usually runs INFO+. Sampling DEBUG selectively (per-user or per-trace) is a power-user feature.</p>

<h3>Metrics — types</h3>
<table>
  <thead><tr><th>Type</th><th>Means</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Counter</td><td>Monotonic; only increases (or resets at restart)</td><td>requests_total, errors_total</td></tr>
    <tr><td>Gauge</td><td>Goes up or down; current value</td><td>active_connections, queue_depth, memory_used</td></tr>
    <tr><td>Histogram</td><td>Distribution of values; bucketed</td><td>request_duration_seconds bucketed at 1ms, 10ms, 100ms, 1s ...</td></tr>
    <tr><td>Summary</td><td>Quantiles computed at source</td><td>P50, P95, P99 directly (less aggregatable than histogram)</td></tr>
  </tbody>
</table>

<p>Histograms are the modern default; you compute percentiles in the query, aggregate across instances cleanly.</p>

<h3>Latency — percentiles, not averages</h3>
<table>
  <thead><tr><th>Stat</th><th>What it tells you</th></tr></thead>
  <tbody>
    <tr><td>Mean / Average</td><td>Hides outliers; meaningless for user experience</td></tr>
    <tr><td>P50 (median)</td><td>"Typical" user experience</td></tr>
    <tr><td>P95</td><td>"Slow" user experience; 1 in 20</td></tr>
    <tr><td>P99</td><td>"Worst" common case; 1 in 100</td></tr>
    <tr><td>P99.9</td><td>Rare bad cases; matters for high-traffic services</td></tr>
    <tr><td>Max</td><td>Pathological cases; one stuck request can dominate</td></tr>
  </tbody>
</table>

<p>"Average response time 50ms" can mean 99 fast + 1 brutally slow. P99 reveals the truth.</p>

<h3>Traces — distributed waterfall</h3>
<pre><code class="language-text">┌─ /orders POST (450ms) ─────────────────────────────────┐
  ├─ auth.verify (5ms)
  ├─ orders.create (200ms)
  │   ├─ db.insert (50ms)
  │   └─ events.publish (150ms)  ← slow!
  ├─ inventory.decrement (40ms)
  └─ response.build (5ms)
</code></pre>

<p>Each span is a unit of work with start/end + parent. OpenTelemetry collects + ships to backend (Jaeger, Datadog APM, Honeycomb, AWS X-Ray, GCP Cloud Trace).</p>

<h3>Correlation ID propagation</h3>
<pre><code class="language-text">Request → A
   X-Request-ID: abc123 (or W3C traceparent)
A logs: { traceId: abc123, msg: "received" }
A → B (passes header)
B logs: { traceId: abc123, msg: "processing" }
B → C (passes header)
C logs: { traceId: abc123, msg: "queried db" }
</code></pre>

<p>Now you can grep all logs for <code>traceId=abc123</code> and reconstruct the request across services. Without this, debugging cross-service bugs is impossible.</p>

<h3>OpenTelemetry — the standard</h3>
<p>OTel is the vendor-neutral standard for telemetry. Components:</p>
<table>
  <thead><tr><th>Layer</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>SDK</td><td>Instrumentation libraries per language; auto-collects HTTP, DB, queue spans</td></tr>
    <tr><td>API</td><td>Stable contracts; how you create custom spans / metrics / log records</td></tr>
    <tr><td>Collector</td><td>Service that receives, processes, exports telemetry</td></tr>
    <tr><td>Backends</td><td>Jaeger, Tempo (open-source); Datadog, Honeycomb, New Relic, etc. (vendor)</td></tr>
  </tbody>
</table>

<p>Pattern: instrument once with OTel SDK; switch backends without re-instrumenting.</p>

<h3>RED + USE</h3>
<table>
  <thead><tr><th>Framework</th><th>Use for</th><th>Metrics</th></tr></thead>
  <tbody>
    <tr><td>RED</td><td>Services / endpoints</td><td>Request rate, Error rate, Duration</td></tr>
    <tr><td>USE</td><td>Resources (CPU, memory, disk, queue)</td><td>Utilization (% used), Saturation (queue depth), Errors</td></tr>
    <tr><td>Four Golden Signals (Google SRE)</td><td>Service-level</td><td>Latency, Traffic, Errors, Saturation</td></tr>
  </tbody>
</table>

<h3>SLI / SLO / SLA</h3>
<table>
  <thead><tr><th>Term</th><th>Means</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>SLI</td><td>Service Level Indicator — the metric you measure</td><td>P99 latency of /api/users</td></tr>
    <tr><td>SLO</td><td>Service Level Objective — your internal target</td><td>99.9% of requests &lt; 200ms over 30 days</td></tr>
    <tr><td>SLA</td><td>Service Level Agreement — customer-facing contract; usually weaker</td><td>99% uptime; refund if violated</td></tr>
  </tbody>
</table>

<h3>Error budget</h3>
<pre><code class="language-text">SLO: 99.9% available
Error budget: 0.1% = 43 minutes per month

If error budget burned:
  → Pause feature work
  → Invest in reliability
  → Slow down deploy cadence

If error budget healthy:
  → Ship features faster
  → Take more risk on releases
</code></pre>

<p>Error budget makes the velocity-vs-reliability tradeoff explicit.</p>

<h3>Alert design</h3>
<table>
  <thead><tr><th>Bad alert</th><th>Good alert</th></tr></thead>
  <tbody>
    <tr><td>"CPU &gt; 90%"</td><td>"Error rate &gt; 1% for 5 min"</td></tr>
    <tr><td>"Disk &gt; 80%"</td><td>"P99 latency &gt; 500ms for 5 min"</td></tr>
    <tr><td>"Service down" (single check)</td><td>"Error budget burning at 10× normal rate"</td></tr>
    <tr><td>Alerts on every minor blip</td><td>Alerts on user-facing symptoms only</td></tr>
    <tr><td>"This alert" without context</td><td>Linked runbook with diagnosis steps</td></tr>
  </tbody>
</table>

<p>Symptom-based alerts: alert when users hurt. Cause-based alerts (CPU, memory): pages for things that may not affect users; alert fatigue.</p>

<h3>Sampling strategies</h3>
<table>
  <thead><tr><th>Strategy</th><th>How</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Head-based</td><td>Decide at request entry: "yes this trace, no that one"</td><td>Simple; some interesting traces lost</td></tr>
    <tr><td>Tail-based</td><td>Buffer the trace; sample after — keep errors + slow always</td><td>Best signal; costs collector memory</td></tr>
    <tr><td>Probabilistic</td><td>Random %</td><td>Default for volume control</td></tr>
    <tr><td>Per-route</td><td>Higher rate for critical paths</td><td>Tune signal-to-cost</td></tr>
  </tbody>
</table>

<h3>Cardinality</h3>
<p>The number of unique label combinations on a metric. <code>requests_total{service, endpoint, status}</code> with 10 services × 50 endpoints × 5 statuses = 2,500 series. Add <code>userId</code> label → 2,500 × 1M users → 2.5B series → metrics backend dies.</p>

<p>Rule: never use unbounded labels (userId, requestId, email) on metrics. They belong on logs / traces.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Structured logging with pino</h3>
<pre><code class="language-typescript">import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) =&gt; ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Request logger middleware
app.use((req, res, next) =&gt; {
  req.id = req.header('x-request-id') ?? crypto.randomUUID();
  req.log = logger.child({ requestId: req.id, method: req.method, url: req.url });

  const start = Date.now();
  res.on('finish', () =&gt; {
    req.log.info({
      status: res.statusCode,
      duration_ms: Date.now() - start,
    }, 'request_complete');
  });

  next();
});

// In handlers
app.post('/orders', async (req, res) =&gt; {
  req.log.info({ userId: req.user.id }, 'order_attempt');
  // ...
});
</code></pre>

<h3>Metrics with prom-client</h3>
<pre><code class="language-typescript">import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// HTTP metrics
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

const httpTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Middleware
app.use((req, res, next) =&gt; {
  const end = httpDuration.startTimer();
  res.on('finish', () =&gt; {
    const labels = { method: req.method, route: req.route?.path ?? 'unknown', status: res.statusCode };
    end(labels);
    httpTotal.inc(labels);
  });
  next();
});

// Expose at /metrics for Prometheus scrape
app.get('/metrics', async (_req, res) =&gt; {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Custom business metrics
const ordersTotal = new client.Counter({
  name: 'orders_placed_total',
  help: 'Orders placed',
  labelNames: ['plan'],
  registers: [register],
});

ordersTotal.inc({ plan: order.plan });
</code></pre>

<h3>OpenTelemetry — auto-instrumentation</h3>
<pre><code class="language-typescript">// instrumentation.ts (loaded before app)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'orders-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.GIT_SHA,
  }),
  traceExporter: new OTLPTraceExporter({ url: process.env.OTLP_ENDPOINT }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
</code></pre>

<pre><code class="language-bash"># Run
node --require ./instrumentation.ts ./server.js
</code></pre>

<p>Auto-instrumentation captures HTTP, database, queue spans without code changes. For custom spans:</p>

<pre><code class="language-typescript">import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('orders-api');

async function placeOrder(input) {
  return tracer.startActiveSpan('orders.place', async (span) =&gt; {
    span.setAttribute('user.id', input.userId);
    span.setAttribute('order.total_cents', input.totalCents);
    try {
      const order = await doWork(input);
      span.setAttribute('order.id', order.id);
      return order;
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: 2 }); // ERROR
      throw err;
    } finally {
      span.end();
    }
  });
}
</code></pre>

<h3>W3C Trace Context propagation</h3>
<pre><code class="language-text">// HTTP request
GET /api/orders/42
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
              ↑    ↑                                ↑                ↑
              ver  trace-id                         span-id          flags
</code></pre>

<p>OpenTelemetry SDKs handle this automatically. Manually for non-HTTP boundaries (queues):</p>

<pre><code class="language-typescript">// Producer
const carrier = {};
api.propagation.inject(api.context.active(), carrier);
await queue.publish({ data, headers: carrier });

// Consumer
const ctx = api.propagation.extract(api.context.active(), msg.headers);
api.context.with(ctx, () =&gt; processMessage(msg));
</code></pre>

<h3>Logs — sending to Datadog / Splunk / ELK</h3>
<pre><code class="language-typescript">// Best practice: log to stdout as JSON; let the platform pick up
logger.info({ userId, action: 'login' });
// → stdout → Docker → fluent-bit → Elasticsearch / Datadog

// Direct push (less common; coupling)
import { Datadog } from 'datadog-winston';
logger.add(new Datadog({ apiKey: process.env.DD_API_KEY }));
</code></pre>

<p>The 12-factor pattern: log to stdout, let platform aggregate. Containers + log drivers are designed for this.</p>

<h3>Sampling at the SDK level</h3>
<pre><code class="language-typescript">import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

const sdk = new NodeSDK({
  // ...
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(0.1), // 10% sample
  }),
});
</code></pre>

<p><code>ParentBasedSampler</code> respects upstream decisions — if a parent service decided to sample, downstream follow.</p>

<h3>Tail-based sampling at collector</h3>
<pre><code class="language-yaml"># OpenTelemetry Collector config
processors:
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: errors-policy
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow-policy
        type: latency
        latency: { threshold_ms: 1000 }
      - name: probabilistic
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }
</code></pre>

<p>Always keep error + slow traces; sample 5% of others.</p>

<h3>Building dashboards</h3>
<table>
  <thead><tr><th>Layer</th><th>Charts</th></tr></thead>
  <tbody>
    <tr><td>Service overview (one per service)</td><td>RED metrics: request rate, error rate, P50/P99 latency</td></tr>
    <tr><td>User journey (one per critical flow)</td><td>End-to-end latency; conversion through steps</td></tr>
    <tr><td>Resource (USE)</td><td>CPU, memory, disk, queue depth, connection pool</td></tr>
    <tr><td>SLO dashboard</td><td>Error budget remaining; burn rate; trend</td></tr>
    <tr><td>Deploy correlation</td><td>Annotations marking deploys; metric drift visible</td></tr>
  </tbody>
</table>

<h3>Alert rules (Prometheus syntax)</h3>
<pre><code class="language-yaml">groups:
  - name: api-alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
          /
          sum(rate(http_requests_total[5m])) by (service)
          &gt; 0.01
        for: 5m
        labels:
          severity: page
        annotations:
          summary: "{{ $labels.service }} error rate &gt; 1%"
          runbook: "https://wiki.example.com/runbooks/high-error-rate"

      - alert: HighLatencyP99
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          ) &gt; 1
        for: 5m
        labels:
          severity: warn
        annotations:
          summary: "{{ $labels.service }} P99 latency &gt; 1s"

      - alert: ErrorBudgetBurnFast
        expr: |
          slo:error_budget:burn_rate1h{service="orders"} &gt; 14.4
          and
          slo:error_budget:burn_rate5m{service="orders"} &gt; 14.4
        labels:
          severity: page
        annotations:
          summary: "Burning error budget 14.4× faster than allowed (2% in 1h)"
</code></pre>

<h3>Multi-window burn rate alerting</h3>
<p>Page on:</p>
<ul>
  <li>"Burning 14.4× over 1h AND 5min" → catastrophic; page immediately.</li>
  <li>"Burning 6× over 6h AND 30min" → significant; page within hours.</li>
  <li>"Burning 1× over 24h AND 2h" → ticket; investigate this week.</li>
</ul>

<h3>RUM (Real User Monitoring) for FE</h3>
<ul>
  <li>Capture browser-side metrics: TTFB, FCP, LCP, CLS, INP, JS errors.</li>
  <li>Datadog RUM, Sentry, Honeycomb client SDK.</li>
  <li>For RN: <code>@datadog/mobile-react-native</code> / <code>@sentry/react-native</code>.</li>
  <li>Pair with backend traces via shared trace ID for end-to-end visibility.</li>
</ul>

<h3>Common metric expressions (PromQL)</h3>
<pre><code class="language-text"># Request rate per service (last 5 min)
sum(rate(http_requests_total[5m])) by (service)

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
/
sum(rate(http_requests_total[5m])) by (service)

# P99 latency
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)

# Saturation (active connections vs max)
db_connections_active / db_connections_max

# Apdex (% requests under target threshold)
(sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m]))
 + sum(rate(http_request_duration_seconds_bucket{le="2"}[5m])) / 2)
/ sum(rate(http_request_duration_seconds_count[5m]))
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Full instrumentation of an Express service</h3>
<pre><code class="language-typescript">// instrumentation.ts (loaded first)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'orders-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.GIT_SHA,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false }, // skip noisy fs
  })],
  traceExporter: new OTLPTraceExporter({ url: process.env.OTLP_ENDPOINT }),
});
sdk.start();

// app.ts
import express from 'express';
import pino from 'pino';
import client from 'prom-client';
import { trace } from '@opentelemetry/api';

const logger = pino();
const app = express();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Request middleware: id + log + metric
app.use((req, res, next) =&gt; {
  req.id = req.header('x-request-id') ?? crypto.randomUUID();
  req.log = logger.child({
    requestId: req.id,
    traceId: trace.getActiveSpan()?.spanContext().traceId,
  });

  const end = httpDuration.startTimer();
  const start = Date.now();

  res.on('finish', () =&gt; {
    end({ method: req.method, route: req.route?.path ?? 'unknown', status: res.statusCode });
    req.log.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration_ms: Date.now() - start,
    }, 'request_complete');
  });

  next();
});

app.get('/metrics', async (_req, res) =&gt; {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (_req, res) =&gt; res.json({ ok: true }));

// Business endpoints
app.post('/orders', async (req, res, next) =&gt; {
  try {
    const tracer = trace.getTracer('orders-api');
    await tracer.startActiveSpan('orders.place', async (span) =&gt; {
      span.setAttribute('user.id', req.user.id);
      const order = await placeOrder(req.body);
      span.setAttribute('order.id', order.id);
      span.end();
      ordersPlacedTotal.inc({ plan: req.user.plan });
      req.log.info({ orderId: order.id }, 'order_placed');
      res.status(201).json(order);
    });
  } catch (err) {
    next(err);
  }
});

// Centralized error handler
app.use((err, req, res, _next) =&gt; {
  req.log.error({ err }, 'unhandled');
  errorsTotal.inc({ route: req.route?.path });
  res.status(500).json({ error: 'internal_server_error', requestId: req.id });
});

const ordersPlacedTotal = new client.Counter({
  name: 'orders_placed_total',
  labelNames: ['plan'],
  registers: [register],
});

const errorsTotal = new client.Counter({
  name: 'errors_total',
  labelNames: ['route'],
  registers: [register],
});

app.listen(3000, () =&gt; logger.info('listening'));
</code></pre>

<h3>Example 2: SLO definition + dashboard</h3>
<pre><code class="language-yaml"># Service: orders-api
SLO: 99.9% of POST /orders return &lt; 500ms over 30 days

SLI:
  goodEvents: count of POST /orders with duration_ms &lt; 500 AND status &lt; 500
  totalEvents: count of POST /orders

ErrorBudget: 0.1% × total_events_per_30_days
  e.g., 1M requests/month → 1000 "bad" events allowed

BurnRateAlerts:
  - Critical (page): burning 14.4× normal in 1h AND 5min
  - High (page): burning 6× normal in 6h AND 30min
  - Medium (ticket): burning 1× normal in 24h AND 2h
</code></pre>

<h3>Example 3: Distributed trace with custom attributes</h3>
<pre><code class="language-typescript">// orders-api → payments-svc → stripe API
import { trace, context } from '@opentelemetry/api';

async function placeOrder(input) {
  const tracer = trace.getTracer('orders-api');
  return tracer.startActiveSpan('orders.place', async (span) =&gt; {
    span.setAttribute('user.id', input.userId);
    span.setAttribute('order.total_cents', input.totalCents);

    try {
      // DB write — auto-instrumented
      const order = await db.orders.create({ ... });
      span.setAttribute('order.id', order.id);

      // Internal call — context propagated automatically
      const charge = await callPayments(order);
      span.setAttribute('charge.id', charge.id);

      return { order, charge };
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  });
}

async function callPayments(order) {
  // OTel HTTP instrumentation injects traceparent header
  const res = await fetch(\`http://payments-svc/charge\`, {
    method: 'POST',
    body: JSON.stringify({ orderId: order.id, amountCents: order.totalCents }),
    signal: AbortSignal.timeout(5000),
  });
  return res.json();
}
</code></pre>

<p>Result: trace shows orders.place → HTTP POST /charge → payments-svc.charge → stripe.charges.create with timing per span.</p>

<h3>Example 4: Log correlation across services</h3>
<pre><code class="language-typescript">// Service A receives request
app.use((req, res, next) =&gt; {
  req.id = req.header('x-request-id') ?? crypto.randomUUID();
  req.log = logger.child({ requestId: req.id });
  next();
});

// Service A calls Service B
async function callB(req, payload) {
  return fetch('http://b/api', {
    method: 'POST',
    headers: {
      'x-request-id': req.id,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

// Service B logs with same request ID
app.use((req, res, next) =&gt; {
  req.id = req.header('x-request-id') ?? crypto.randomUUID();
  req.log = logger.child({ requestId: req.id });
  next();
});

// In Datadog / Splunk:
// query: requestId:abc123
// → All logs across all services for this user request
</code></pre>

<h3>Example 5: Custom metric for business KPI</h3>
<pre><code class="language-typescript">const subscriptionMRR = new client.Gauge({
  name: 'subscription_mrr_cents',
  help: 'Total MRR in cents',
  labelNames: ['plan'],
  registers: [register],
});

// Update every minute
setInterval(async () =&gt; {
  const result = await db.query(\`
    SELECT plan, SUM(price_cents) as mrr
    FROM subscriptions
    WHERE status = 'active'
    GROUP BY plan
  \`);
  for (const row of result.rows) {
    subscriptionMRR.set({ plan: row.plan }, parseInt(row.mrr));
  }
}, 60_000);
</code></pre>

<p>Now MRR is a graphable metric; alert if it drops &gt; 5% in an hour.</p>

<h3>Example 6: Tail-based sampling for cost control</h3>
<pre><code class="language-yaml"># otel-collector-config.yaml
processors:
  tail_sampling:
    decision_wait: 30s
    num_traces: 50000
    expected_new_traces_per_sec: 1000
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow
        type: latency
        latency: { threshold_ms: 1000 }
      - name: critical-path
        type: string_attribute
        string_attribute:
          key: http.route
          values: ['/api/checkout', '/api/login']
      - name: probabilistic
        type: probabilistic
        probabilistic: { sampling_percentage: 1 }
</code></pre>

<p>Keeps all errors, slow requests, critical-path traces; samples 1% of normal. Drastic cost reduction without losing signal.</p>

<h3>Example 7: Runbook linked to alert</h3>
<pre><code class="language-markdown"># Runbook: orders-api High Error Rate

## Diagnosis (in order)

1. Check error rate dashboard: which status codes? Spike?
2. Check trace samples: which downstream is failing?
3. Check downstream service dashboards (payments, inventory).
4. Check recent deploys (annotations on dashboards).

## Common causes + fixes

### Stripe API errors (status 5xx from payments-svc)

→ Check Stripe status page.
→ If Stripe is down: enable circuit breaker fallback (degrade to "we'll process payment async").
→ If our key issue: rotate Stripe key.

### DB connection exhaustion

→ Check db_connections_active / db_connections_max gauge.
→ If saturated: scale up DB or app instances; check for slow queries via pg_stat_activity.

## Rollback

If error rate started after recent deploy:
\`\`\`
kubectl rollout undo deployment/orders-api
\`\`\`

## Escalation

If unresolved in 15 min, page #incident channel.
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Cardinality explosions</h3>
<ul>
  <li>Adding <code>userId</code> as a metric label → millions of unique combinations → metrics backend dies.</li>
  <li>Mitigations: never use unbounded labels. Per-user data goes on logs / traces, not metrics.</li>
  <li>Detect: monitor metric series count; alert when one metric crosses threshold.</li>
</ul>

<h3>Log volume costs</h3>
<ul>
  <li>Logging every request body in production → 10TB/day → $$.</li>
  <li>Mitigation: structured logs with sensible fields (no payloads); sample DEBUG; redact PII.</li>
  <li>Use a sampling sidecar for non-error events at high traffic.</li>
</ul>

<h3>PII in telemetry</h3>
<ul>
  <li>Logs / traces / metrics may contain SSN, email, credit card.</li>
  <li>Mitigations: redaction at SDK level; never log full payloads; review fields exposed in spans.</li>
  <li>Compliance: GDPR / CCPA require user data deletion — audit your telemetry pipeline.</li>
</ul>

<h3>Trace gaps across services</h3>
<ul>
  <li>One service uses W3C trace context; another uses Datadog's; another uses none.</li>
  <li>Mitigation: standardize on OpenTelemetry; force traceparent everywhere; service mesh handles silently.</li>
</ul>

<h3>Async work loses trace context</h3>
<ul>
  <li>HTTP handler queues a job; job runs an hour later; trace context lost.</li>
  <li>Mitigation: propagate context via job message headers; consumer extracts and continues span.</li>
</ul>

<h3>Sampling decisions and metrics</h3>
<ul>
  <li>1% trace sample = 1% of error traces seen → can't debug rare errors.</li>
  <li>Mitigation: tail-based sampling — keep all errors, slow requests, sample others.</li>
  <li>Or: head-based with always-sample for error responses (decide at the response, not request).</li>
</ul>

<h3>Alert fatigue</h3>
<ul>
  <li>50 alerts per day; engineers tune them out; real alerts ignored.</li>
  <li>Mitigations: alert only on user-facing symptoms; multi-window burn rate; on-call rotation reviews + tunes weekly.</li>
  <li>Goal: each alert is actionable; if not, delete or downgrade.</li>
</ul>

<h3>Average vs percentile</h3>
<ul>
  <li>Average response time 50ms; P99 = 5s. 1 in 100 users has terrible experience; average hides it.</li>
  <li>Always: percentile-based SLOs and alerts. Don't graph average alone.</li>
</ul>

<h3>Histogram bucket choice</h3>
<ul>
  <li>Buckets too coarse: P99 imprecise. Too fine: cardinality cost.</li>
  <li>Pick buckets matching your SLO + typical latency: <code>[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]</code> covers most.</li>
</ul>

<h3>Synchronous logging</h3>
<ul>
  <li>Logger blocks request thread waiting for disk write.</li>
  <li>Mitigation: async logger (pino is); buffered logs sent in batches.</li>
</ul>

<h3>Time skew across services</h3>
<ul>
  <li>Server A clock drifts from server B; trace timeline appears out-of-order.</li>
  <li>Mitigation: NTP everywhere; tolerate ms-level skew in trace viewers.</li>
</ul>

<h3>Multiple log aggregators</h3>
<ul>
  <li>Frontend logs to Sentry; backend to Datadog; app traces in Jaeger; can't connect across.</li>
  <li>Mitigation: single backend or interconnected (e.g., shared trace ID); RUM agent that ties browser → backend.</li>
</ul>

<h3>Missing context on errors</h3>
<ul>
  <li>"Error: Database connection failed" — which DB? Which user? Which request?</li>
  <li>Always log <code>{err, requestId, userId, operation, ...}</code>; pino does this naturally.</li>
</ul>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps send their own observability via Sentry / Datadog mobile SDK.</li>
  <li>Capture: crashes, JS errors, network errors, slow renders, app start time.</li>
  <li>Stitch with backend via shared trace ID (RN sends X-Request-ID; backend echoes in trace).</li>
  <li>Battery + bandwidth: sample / batch / compress; never fire telemetry on every event.</li>
  <li>PII: redact device identifiers per Apple / Google rules.</li>
</ul>

<h3>Observability cost spiral</h3>
<ul>
  <li>Datadog bill grows with traffic — at scale, observability cost &gt; compute cost.</li>
  <li>Mitigations: tail sampling; aggregate at edges; metrics over logs where possible; self-host options (Loki, Tempo, Prometheus).</li>
</ul>

<h3>Downstream service health vs your service health</h3>
<ul>
  <li>Your service is healthy; downstream is down; users experience errors.</li>
  <li>Your error rate is the right SLI; downstream errors that you can't fix should still alert (so you know).</li>
  <li>Distinguish "our bug" from "their outage" via per-dependency error labels.</li>
</ul>

<h3>Ephemeral environments</h3>
<ul>
  <li>PR-preview environments exist for hours; observability budget can balloon.</li>
  <li>Mitigation: tag traces / logs with environment; aggressive retention reduction in non-prod.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common observability mistakes</h3>
<ol>
  <li><strong>Plain-string logs.</strong> Ungreppable; can't aggregate.</li>
  <li><strong>Average instead of percentile.</strong> Hides tail latency.</li>
  <li><strong>No correlation IDs.</strong> Cross-service debugging takes hours.</li>
  <li><strong>Cardinality explosion.</strong> Unbounded labels kill metrics backend.</li>
  <li><strong>Alerting on causes, not symptoms.</strong> Pages on benign noise; misses real issues.</li>
  <li><strong>No SLOs.</strong> Reliability investments lack prioritization.</li>
  <li><strong>Unbounded log volume.</strong> Cost spirals; logs unsearchable.</li>
  <li><strong>PII leaking into telemetry.</strong> Compliance violation.</li>
  <li><strong>1% trace sampling without keeping errors.</strong> Can't debug rare bugs.</li>
  <li><strong>No runbooks linked from alerts.</strong> On-call wastes time triaging.</li>
  <li><strong>Logs only; no metrics or traces.</strong> Can't see aggregate or distribution.</li>
  <li><strong>Vendor lock-in.</strong> Telemetry tied to one backend; no migration path.</li>
</ol>

<h3>Anti-pattern: plain-string logs</h3>
<pre><code class="language-typescript">// BAD
console.log(\`User \${userId} placed order \${orderId} for $\${amount}\`);

// GOOD
logger.info({
  msg: 'order_placed',
  userId,
  orderId,
  amountCents: amount * 100,
});
</code></pre>

<h3>Anti-pattern: average latency</h3>
<pre><code class="language-text">// BAD — average masks tail
average_response_time_ms

// GOOD — percentiles
http_request_duration_seconds histogram
→ histogram_quantile(0.99, ...) for P99
</code></pre>

<h3>Anti-pattern: missing correlation</h3>
<pre><code class="language-typescript">// BAD — logs across services unconnectable
service A logs: "received request"
service B logs: "processing"
service C logs: "db error"
// no shared key; debug requires guesswork

// GOOD
service A: { msg: "received request", requestId: "abc123" }
service B: { msg: "processing", requestId: "abc123" }
service C: { msg: "db error", requestId: "abc123" }
// query: requestId:abc123 → full picture
</code></pre>

<h3>Anti-pattern: cardinality explosion</h3>
<pre><code class="language-typescript">// BAD — userId on metric label
const requests = new Counter({
  name: 'requests_total',
  labelNames: ['userId', 'status'], // ← 1M users × N statuses → millions of series
});

// GOOD — userId only on logs / traces
const requests = new Counter({
  name: 'requests_total',
  labelNames: ['endpoint', 'status'], // bounded
});
logger.info({ userId, endpoint, status }); // userId on log
</code></pre>

<h3>Anti-pattern: alerting on CPU directly</h3>
<pre><code class="language-yaml">## BAD — pages on benign noise
- alert: HighCPU
  expr: cpu_usage &gt; 90

## GOOD — pages on user-facing impact
- alert: HighErrorRate
  expr: error_rate &gt; 1%
  for: 5m

# Use CPU as a context indicator on the runbook, not the trigger.
</code></pre>

<h3>Anti-pattern: log everything in detail</h3>
<pre><code class="language-typescript">// BAD — logs every step at INFO; volume explodes
logger.info({ step: 1, payload: req.body }, 'starting');
logger.info({ step: 2, validated: true }, 'validated');
logger.info({ step: 3, dbCall: true }, 'db_called');
logger.info({ step: 4, response: result }, 'complete');

// GOOD — log key business events at INFO; details at DEBUG
logger.info({ orderId: order.id, userId }, 'order_placed');
logger.debug({ steps, payload }, 'order_internal');
</code></pre>

<h3>Anti-pattern: trace 1% always</h3>
<pre><code class="language-typescript">// BAD — 1% sample; only 1% of errors visible
sampler: new TraceIdRatioBasedSampler(0.01);

// GOOD — tail sampling: keep all errors + slow + sample rest
// Configure at OpenTelemetry Collector level
</code></pre>

<h3>Anti-pattern: alert without runbook</h3>
<pre><code class="language-yaml"># BAD — on-call sees alert; doesn't know what to do
- alert: HighErrorRate
  expr: error_rate &gt; 1%
  annotations:
    summary: "errors are high"

# GOOD
- alert: HighErrorRate
  expr: error_rate &gt; 1%
  annotations:
    summary: "{{ $labels.service }} error rate &gt; 1% for 5min"
    runbook: "https://wiki.example.com/runbooks/service-error-rate"
    dashboard: "https://app.datadog.com/dashboard/service-{{ $labels.service }}"
</code></pre>

<h3>Anti-pattern: PII in logs</h3>
<pre><code class="language-typescript">// BAD — full request body
logger.info({ body: req.body }, 'request');
// body might include SSN, password, credit card

// GOOD — explicit allowlist
logger.info({
  endpoint: req.path,
  method: req.method,
  userId: req.user?.id,
  // explicit subset; never req.body
}, 'request');
</code></pre>

<h3>Anti-pattern: synchronous logger</h3>
<pre><code class="language-typescript">// BAD — fs.appendFileSync per log → blocks event loop
fs.appendFileSync('app.log', JSON.stringify(record) + '\\n');

// GOOD — pino streams to stdout; non-blocking
const logger = pino({ transport: { target: 'pino/file', options: { destination: 1 } } });
</code></pre>

<h3>Anti-pattern: multiple loggers without convention</h3>
<pre><code class="language-typescript">// BAD — each module has its own setup; inconsistent fields
import winston from 'winston';
import bunyan from 'bunyan';
import pino from 'pino';

// GOOD — one logger; child loggers per module
const root = pino({ ... });
export const ordersLogger = root.child({ module: 'orders' });
export const usersLogger = root.child({ module: 'users' });
</code></pre>

<h3>Anti-pattern: dashboards that are walls of charts</h3>
<p>Service dashboard with 50 charts; engineers can't tell at a glance "is this service healthy?" Curate ruthlessly: top 3-5 charts answer "is it healthy?" Drill-down dashboards for deep diagnosis.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common observability interview prompts</h3>
<ol>
  <li>Walk me through observability for [service / system].</li>
  <li>Compare logs, metrics, traces.</li>
  <li>How do you debug a slow endpoint?</li>
  <li>How would you set up SLOs?</li>
  <li>How do you reduce alert fatigue?</li>
  <li>What's a correlation ID and why do you need it?</li>
  <li>Tell me about a production debug story.</li>
  <li>How do you catch issues before users do?</li>
</ol>

<h3>The 5-step framework for "set up observability"</h3>
<ol>
  <li><strong>Logs:</strong> structured (JSON) at INFO+ in prod; correlation ID per request; per-service child loggers.</li>
  <li><strong>Metrics:</strong> RED for services, USE for resources; histograms for latency; bounded labels.</li>
  <li><strong>Traces:</strong> OpenTelemetry SDK with auto-instrumentation; tail sampling at the collector; W3C trace context propagation.</li>
  <li><strong>SLOs + alerts:</strong> SLI per critical journey; SLO with error budget; multi-window burn-rate alerts; runbooks linked.</li>
  <li><strong>Dashboards:</strong> service overview (RED), user-journey latency, SLO health, deploy correlation.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Three pillars: logs for narrative, metrics for trends, traces for distribution. Each answers a different question; all three are needed."</em></li>
  <li><em>"OpenTelemetry as the standard — instrument once; switch backends without re-instrumenting."</em></li>
  <li><em>"Percentiles, not averages — average latency 50ms can hide P99 of 5s. 1 in 100 users has terrible experience."</em></li>
  <li><em>"Tail-based sampling at the collector — keep all errors and slow requests; sample 1-5% of normal. Best signal-to-cost."</em></li>
  <li><em>"Symptom-based alerting — error rate, latency, availability. Cause-based (CPU, memory) creates fatigue."</em></li>
  <li><em>"Multi-window burn rate — page on 14.4× burn over 1h AND 5min; ticket on slow burn over 24h. Catches both fast and gradual outages."</em></li>
  <li><em>"Cardinality discipline — userId on logs/traces, not metrics. Unbounded labels kill the backend."</em></li>
  <li><em>"SLO drives investment — error budget burning fast → freeze risk; healthy → ship more."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"slow endpoint"</td><td>Trace → identify slow span → log/metric for that step</td></tr>
    <tr><td>"prod debug across services"</td><td>Correlation ID + trace + structured logs</td></tr>
    <tr><td>"alert fatigue"</td><td>Symptom-based alerts; multi-window; runbooks</td></tr>
    <tr><td>"detect regression"</td><td>SLO-based monitoring; error-budget burn</td></tr>
    <tr><td>"reduce telemetry cost"</td><td>Tail sampling; cardinality control; metrics over logs</td></tr>
    <tr><td>"end-to-end visibility"</td><td>OpenTelemetry; W3C trace context; RUM stitched to backend</td></tr>
    <tr><td>"deploy regression"</td><td>Deploy annotations on dashboards; canary metric watch</td></tr>
    <tr><td>"runbook for on-call"</td><td>Per-alert runbook with diagnosis + mitigation steps</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch the request flow; identify each service.</li>
  <li>Show structured log with correlation ID.</li>
  <li>Show RED metrics (rate, error, P99).</li>
  <li>Show distributed trace with spans.</li>
  <li>Show SLO with error budget burn.</li>
  <li>Show alert with linked runbook.</li>
  <li>Talk sampling + cardinality + cost control.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Adopt OpenTelemetry SDK across all services for vendor-neutral instrumentation."</em></li>
  <li><em>"Tail-based sampling at the collector for cost-effective signal preservation."</em></li>
  <li><em>"SLO-driven release pace with error budget tracking."</em></li>
  <li><em>"Multi-window burn-rate alerts to catch fast + slow outages."</em></li>
  <li><em>"Per-alert runbooks linked from the alert annotation."</em></li>
  <li><em>"RUM agent in the frontend stitched to backend via shared trace ID."</em></li>
  <li><em>"Synthetic monitoring for critical paths from multiple regions."</em></li>
  <li><em>"Cost-aware retention policies; aggressive in non-prod."</em></li>
  <li><em>"Per-tenant observability for noisy-neighbor identification."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Three-pillars fluency</td><td>Names logs / metrics / traces with what each answers</td></tr>
    <tr><td>Correlation ID instinct</td><td>Names without prompting</td></tr>
    <tr><td>Percentile awareness</td><td>P99, not average</td></tr>
    <tr><td>Cardinality awareness</td><td>Bounded labels for metrics</td></tr>
    <tr><td>OTel knowledge</td><td>Vendor-neutral; auto-instrumentation; tail sampling</td></tr>
    <tr><td>Symptom-based alerting</td><td>User-facing impact, not infra</td></tr>
    <tr><td>SLO maturity</td><td>Error budget; burn rate; release pace</td></tr>
    <tr><td>Runbook discipline</td><td>Every alert has one</td></tr>
    <tr><td>Cost awareness</td><td>Sampling, cardinality, retention</td></tr>
    <tr><td>Production stories</td><td>Specific debugging anecdotes</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps need their own observability — crash reporting, JS errors, slow renders, slow API calls.</li>
  <li>Sentry / Datadog mobile SDKs; capture device + OS context.</li>
  <li>Stitch to backend via shared trace ID (RN sends X-Request-ID; backend includes in spans).</li>
  <li>Battery + bandwidth: sample telemetry; batch uploads; compress.</li>
  <li>PII: redact device identifiers; comply with Apple / Google policies.</li>
  <li>Real User Monitoring on RN: TTI, JS thread blocked time, frame drops.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How would you debug a request that intermittently takes 5 seconds?"</em> — Trace + tail sampling keeps slow traces; identify slow span; correlate with logs at that timestamp; metric to confirm pattern (only certain users? certain time?).</li>
  <li><em>"What's the difference between a counter and a gauge?"</em> — Counter is monotonic (only goes up); use for events (requests, errors). Gauge can go up or down; use for instantaneous values (active connections, queue depth, memory).</li>
  <li><em>"Why are histograms preferred over summaries?"</em> — Histograms aggregate cleanly across instances (sum buckets, then compute quantile). Summaries compute quantiles per-instance; can't be combined.</li>
  <li><em>"What's an error budget?"</em> — 100% - SLO target. If SLO is 99.9%, you have 0.1% (43min/month) of allowed unavailability. Burns drive prioritization: fast burn → freeze risk; slow burn → fix this week.</li>
  <li><em>"How do you set SLOs?"</em> — Pick critical user journeys; define SLI (e.g., "P99 latency &lt; 200ms" for /api/login); pick target based on user expectation (99.9% for paid; 99% for free); review monthly.</li>
  <li><em>"How do you handle telemetry cost at scale?"</em> — Tail sampling; cardinality control; aggregate at the edge; metrics for trends + sample logs/traces for detail; consider self-hosted (Prometheus + Loki + Tempo).</li>
  <li><em>"What's the difference between RED and USE?"</em> — RED for services (Rate / Errors / Duration). USE for resources (Utilization / Saturation / Errors). RED tells you "is the service healthy"; USE tells you "is the resource healthy."</li>
  <li><em>"How do you avoid alert fatigue?"</em> — Symptom-based; multi-window burn; alert review weekly; delete actionless alerts; runbook per alert; SLO-grounded thresholds.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Set up OpenTelemetry SDK in a service; trace HTTP + DB; ship to Jaeger.</li>
  <li>Instrument with prom-client; expose /metrics; scrape with Prometheus.</li>
  <li>Wire structured logging with pino + correlation IDs.</li>
  <li>Define one SLO for a critical endpoint; build burn-rate alerts.</li>
  <li>Build a service overview dashboard with RED metrics.</li>
  <li>Read Google's SRE book chapters on monitoring + SLOs.</li>
  <li>Read OpenTelemetry docs for trace context propagation.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'Distributed Systems Observability' by Cindy Sridharan."</li>
  <li>"Read Honeycomb's blog on high-cardinality observability."</li>
  <li>"Set up the full Loki + Tempo + Prometheus + Grafana stack on a side project."</li>
  <li>"Practice debugging a known-slow distributed system using only telemetry."</li>
</ul>
`
    }
  ]
});
