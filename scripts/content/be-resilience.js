window.PREP_SITE.registerTopic({
  id: 'be-resilience',
  module: 'backend',
  title: 'Resilience',
  estimatedReadTime: '45 min',
  tags: ['resilience', 'retries', 'circuit-breaker', 'timeouts', 'bulkhead', 'idempotency', 'fallback', 'chaos'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Resilience patterns</strong> are how distributed systems stay up when individual pieces fail. Networks blip, dependencies slow down, instances crash — the question isn't "how do I prevent this?" but "how do I keep serving users when this happens?" The cost of getting it wrong: a slow upstream takes down your whole service.</p>
<ul>
  <li><strong>Timeouts</strong> are the foundational resilience primitive. Every external call needs one. Without them, slow upstream = blocked workers = total outage.</li>
  <li><strong>Retries with exponential backoff + jitter</strong> handle transient failures. Cap max attempts; idempotency required.</li>
  <li><strong>Circuit breaker</strong> stops sending requests to a failing upstream — fail fast instead of cascading.</li>
  <li><strong>Bulkhead</strong> isolates failure domains — one bad downstream shouldn't exhaust threads needed for healthy ones.</li>
  <li><strong>Fallback</strong> degrades gracefully — cached data, default values, shed feature.</li>
  <li><strong>Idempotency keys</strong> make retries safe.</li>
  <li><strong>Backpressure</strong> protects against overload — bounded queues + load shedding (return 503).</li>
  <li><strong>Chaos engineering</strong> deliberately fails things in production to find weak spots before users do.</li>
</ul>
<p><strong>Mantra:</strong> "Timeout everything. Retry idempotently with backoff + jitter. Break circuits. Bulkhead failures. Degrade gracefully. Shed load. Test failure deliberately."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The fundamental problem</h3>
<p>Distributed systems fail constantly. Networks drop packets, instances die, GC pauses freeze, dependencies go slow, deploys cause hiccups. The question isn't "if" but "when + how often + how badly." Resilience patterns are the toolkit for staying up despite this.</p>

<h3>What can go wrong</h3>
<table>
  <thead><tr><th>Failure</th><th>Frequency</th><th>Impact without resilience</th></tr></thead>
  <tbody>
    <tr><td>Slow downstream API</td><td>Daily</td><td>Workers blocked; whole service unavailable</td></tr>
    <tr><td>Transient network blip</td><td>Per request at scale</td><td>Avoidable user-facing errors</td></tr>
    <tr><td>Downstream completely down</td><td>Weekly+</td><td>Cascading failure</td></tr>
    <tr><td>DB connection exhaustion</td><td>Under load spikes</td><td>503s for everyone</td></tr>
    <tr><td>Memory leak / OOM</td><td>Eventually</td><td>Crash; partial data loss</td></tr>
    <tr><td>Bad deploy</td><td>Per release</td><td>Outage until rollback</td></tr>
    <tr><td>Traffic spike (viral)</td><td>Rare but real</td><td>Auto-scaling lags; degradation</td></tr>
    <tr><td>Region outage</td><td>Yearly</td><td>Hours of downtime</td></tr>
  </tbody>
</table>

<h3>Why "resilience" is its own discipline</h3>
<ul>
  <li>Happy path is easy; failure paths are 80% of the work.</li>
  <li>Failures compose: one slow service cascades upstream unless contained.</li>
  <li>Local correctness ≠ global resilience.</li>
  <li>Untested failure modes always fire eventually.</li>
</ul>

<h3>What "resilient system" looks like</h3>
<ul>
  <li>Every external call has a timeout.</li>
  <li>Retries with backoff + jitter on transient failures only (5xx, network errors).</li>
  <li>4xx errors fail fast (client mistake; retry won't help).</li>
  <li>Circuit breakers on each downstream dependency.</li>
  <li>Fallbacks for degraded mode (cached data, defaults).</li>
  <li>Bulkheads — one downstream's failure doesn't starve others.</li>
  <li>Idempotency keys on every mutation.</li>
  <li>Bounded queues + load shedding (return 503 over crashing).</li>
  <li>Health checks differentiating liveness vs readiness.</li>
  <li>Observability: alerts on error rate, latency, saturation, traffic.</li>
  <li>Chaos engineering: regular fault injection in non-prod (and eventually prod).</li>
</ul>

<h3>What "fragile system" looks like</h3>
<ul>
  <li>Some external calls have timeouts; others run unbounded.</li>
  <li>Retries on all errors including 4xx (compounds problems).</li>
  <li>One slow dep takes down the whole service.</li>
  <li>No fallback — failure visible to users immediately.</li>
  <li>Unbounded queues — OOM under load.</li>
  <li>Deploy strategy is "push and pray"; no canary or rollback.</li>
  <li>Health checks too aggressive (liveness fails on transient hiccups).</li>
  <li>Observability gaps; you find out about outages from users.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The 4 "Rs" of resilience</h3>
<table>
  <thead><tr><th>R</th><th>Means</th></tr></thead>
  <tbody>
    <tr><td><strong>Recognize</strong></td><td>Detect failure (timeout, error, slow response)</td></tr>
    <tr><td><strong>Recover</strong></td><td>Retry, fallback, switch to backup</td></tr>
    <tr><td><strong>Restore</strong></td><td>Bring failed component back when healthy</td></tr>
    <tr><td><strong>Reproduce</strong></td><td>Test failures via chaos eng before they hit prod</td></tr>
  </tbody>
</table>

<h3>Timeouts — the foundation</h3>
<p>Every external call needs a deadline. Without it, one slow caller blocks workers indefinitely; throughput drops to zero.</p>
<table>
  <thead><tr><th>Type</th><th>Reasonable value</th></tr></thead>
  <tbody>
    <tr><td>Internal microservice (low-latency)</td><td>500ms-2s</td></tr>
    <tr><td>External API (payment, search)</td><td>3-10s</td></tr>
    <tr><td>DB query</td><td>1-10s; per-statement</td></tr>
    <tr><td>Cache lookup</td><td>50-200ms</td></tr>
    <tr><td>Total request budget</td><td>1-5s for interactive UI</td></tr>
    <tr><td>Background job</td><td>Long; with explicit checkpointing</td></tr>
  </tbody>
</table>

<h3>Budget propagation</h3>
<p>Parent has 5s budget; calls child with deadline of 4s (leaving 1s for response). Child propagates further. Prevents cascade where one slow leg uses whole upstream budget.</p>
<pre><code class="language-text">Client (5s timeout)
   ↓
A (passes deadline 4s)
   ↓
B (passes deadline 3s)
   ↓
C (must finish in 3s)
</code></pre>

<p>gRPC has built-in deadlines; HTTP needs custom header (e.g., <code>X-Request-Deadline</code>).</p>

<h3>Retry strategy</h3>
<table>
  <thead><tr><th>Scenario</th><th>Retry?</th><th>How</th></tr></thead>
  <tbody>
    <tr><td>Network error</td><td>Yes</td><td>Exponential backoff + jitter; max 3-5 attempts</td></tr>
    <tr><td>5xx server error</td><td>Yes (with caution)</td><td>Same; consider circuit breaker</td></tr>
    <tr><td>429 rate limit</td><td>Yes; respect <code>Retry-After</code></td><td>Honor server's hint</td></tr>
    <tr><td>4xx client error</td><td>No</td><td>Won't help; fix the request</td></tr>
    <tr><td>Timeout</td><td>Maybe</td><td>If idempotent, yes. If not, server may have already done the work.</td></tr>
  </tbody>
</table>

<h3>Backoff with jitter</h3>
<pre><code class="language-typescript">// Exponential: 100ms, 200ms, 400ms, 800ms, 1600ms ...
function backoff(attempt: number, base = 100, max = 30_000): number {
  const exp = Math.min(max, base * 2 ** attempt);
  const jitter = Math.random() * exp * 0.3; // ±30%
  return exp + jitter;
}
</code></pre>

<p>Jitter is critical: without it, all clients retry at the same time → thundering herd → upstream still struggling.</p>

<h3>Circuit breaker</h3>
<pre><code class="language-text">States:
  CLOSED   — normal; requests pass through
  OPEN     — circuit broken; requests fail fast (no upstream call)
  HALF-OPEN — periodic probe; if successful, close

Trigger: failure rate &gt; threshold (e.g., 50% over 1 min)
Open duration: 30s before probing
</code></pre>

<p>Why: when upstream is down, sending requests pointlessly burns latency budget + makes upstream worse. Open the circuit; serve fallback; periodically check if upstream recovered.</p>

<h3>Bulkhead pattern</h3>
<p>Isolate resources per dependency:</p>
<pre><code class="language-text">Without bulkhead:
  100-thread pool serves all downstream calls.
  Slow downstream X uses 80 threads.
  Healthy downstream Y has 20 threads available.
  Bottleneck.

With bulkhead:
  X has its own 30-thread pool.
  Y has its own 30-thread pool.
  X's slowness doesn't affect Y.
</code></pre>

<p>Implemented as: separate thread pools, separate connection pools, separate queue lanes. Service mesh handles this at network level.</p>

<h3>Fallback</h3>
<table>
  <thead><tr><th>Fallback type</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Cached data</td><td>Last-known good response</td></tr>
    <tr><td>Default value</td><td>"Recommendations unavailable" → show top-10 default list</td></tr>
    <tr><td>Lower-fidelity</td><td>Personalized search → unranked search</td></tr>
    <tr><td>Feature flag off</td><td>Hide the feature entirely if upstream down</td></tr>
    <tr><td>Async deferral</td><td>Queue for later; tell user "we'll process this"</td></tr>
  </tbody>
</table>

<h3>Idempotency</h3>
<p>Retries cause duplicate requests. Without idempotency keys, you may double-charge / double-create / double-delete. Pattern:</p>
<ol>
  <li>Client generates UUID per logical operation.</li>
  <li>Server stores (key → result) for some TTL (24h+).</li>
  <li>On retry, server returns stored result without re-executing.</li>
</ol>

<h3>Backpressure + load shedding</h3>
<table>
  <thead><tr><th>Strategy</th><th>How</th></tr></thead>
  <tbody>
    <tr><td>Bounded queue</td><td>Reject when full; producer backs off</td></tr>
    <tr><td>Drop oldest</td><td>For ephemeral data; preserve newest</td></tr>
    <tr><td>Rate limiting</td><td>Cap RPS per client</td></tr>
    <tr><td>503 + Retry-After</td><td>Tell clients to back off</td></tr>
    <tr><td>Cancel low-priority work</td><td>Prefer interactive over batch</td></tr>
    <tr><td>Adaptive concurrency limits</td><td>Adjust max concurrent requests dynamically (Netflix's adaptive concurrency)</td></tr>
  </tbody>
</table>

<h3>Health checks: liveness vs readiness</h3>
<table>
  <thead><tr><th>Check</th><th>Question</th><th>Action on fail</th></tr></thead>
  <tbody>
    <tr><td>Liveness</td><td>Is the process alive?</td><td>Restart container</td></tr>
    <tr><td>Readiness</td><td>Can it serve traffic?</td><td>Remove from load balancer rotation</td></tr>
    <tr><td>Startup (Kubernetes)</td><td>Has it finished initializing?</td><td>Wait before liveness checks start</td></tr>
  </tbody>
</table>

<p>Common mistake: making readiness checks too aggressive (depends on every downstream). One downstream blip flaps your service in/out of rotation. Readiness should reflect "can I serve some traffic" not "is everything perfect."</p>

<h3>Graceful degradation hierarchy</h3>
<pre><code class="language-text">Best:    Full functionality, fast
         ↓
         Cached / stale data
         ↓
         Default / generic response
         ↓
         Feature disabled with explanation
         ↓
         Honest error with retry guidance
         ↓
Worst:   Generic 500; user sees broken app
</code></pre>

<h3>Chaos engineering</h3>
<ul>
  <li>Deliberately inject failures: kill instances, slow networks, drop packets, fill disks.</li>
  <li>Test in non-prod first; advance to "Game Days" in prod with care.</li>
  <li>Tools: Chaos Monkey (Netflix), Gremlin, Litmus (K8s).</li>
  <li>Goal: find weakness before users.</li>
</ul>

<h3>Deploy resilience</h3>
<ul>
  <li><strong>Canary:</strong> route 1-5% traffic to new version; watch metrics; expand or rollback.</li>
  <li><strong>Blue-green:</strong> two identical environments; flip traffic; instant rollback.</li>
  <li><strong>Rolling:</strong> replace instances gradually.</li>
  <li><strong>Feature flags:</strong> deploy code; enable separately; rollback = flip flag (no redeploy).</li>
  <li>Always: graceful shutdown so in-flight requests complete.</li>
</ul>

<h3>Disaster recovery</h3>
<table>
  <thead><tr><th>Term</th><th>Means</th></tr></thead>
  <tbody>
    <tr><td>RTO (Recovery Time Objective)</td><td>How long to restore service</td></tr>
    <tr><td>RPO (Recovery Point Objective)</td><td>How much data loss is acceptable</td></tr>
    <tr><td>Backup</td><td>Snapshot of data; tested restore</td></tr>
    <tr><td>DR site</td><td>Secondary region; standby or active</td></tr>
    <tr><td>Multi-region active-active</td><td>Both regions serve; latency-aware routing</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Timeout via AbortSignal</h3>
<pre><code class="language-typescript">// Modern fetch with timeout
async function fetchWithTimeout(url: string, ms: number, init?: RequestInit) {
  const ac = new AbortController();
  const timer = setTimeout(() =&gt; ac.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Or AbortSignal.timeout (Node 18+, modern browsers)
const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
</code></pre>

<h3>Retry with exponential backoff + jitter</h3>
<pre><code class="language-typescript">async function callWithRetry&lt;T&gt;(
  fn: (signal: AbortSignal) =&gt; Promise&lt;T&gt;,
  opts: { maxAttempts?: number; baseMs?: number; maxMs?: number; timeoutMs?: number } = {}
): Promise&lt;T&gt; {
  const { maxAttempts = 5, baseMs = 100, maxMs = 30_000, timeoutMs = 5_000 } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt &lt; maxAttempts; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() =&gt; ac.abort(), timeoutMs);
    try {
      return await fn(ac.signal);
    } catch (err: any) {
      lastErr = err;
      // Don't retry 4xx (except 429)
      if (err.status &amp;&amp; err.status &gt;= 400 &amp;&amp; err.status &lt; 500 &amp;&amp; err.status !== 429) {
        throw err;
      }
      const exp = Math.min(maxMs, baseMs * 2 ** attempt);
      const jitter = Math.random() * exp * 0.3;
      // Honor Retry-After if 429
      const retryAfter = err.retryAfter ? err.retryAfter * 1000 : exp + jitter;
      await new Promise((r) =&gt; setTimeout(r, retryAfter));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}
</code></pre>

<h3>Circuit breaker (opossum)</h3>
<pre><code class="language-typescript">import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(
  async (input: { id: string }) =&gt; {
    const res = await fetchWithTimeout(\`http://payments-svc/charge/\${input.id}\`, 3000);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return res.json();
  },
  {
    timeout: 3000,           // per-call timeout
    errorThresholdPercentage: 50, // open if 50% fail in window
    resetTimeout: 30_000,    // try to half-open after 30s
    rollingCountTimeout: 10_000, // metrics window
  }
);

breaker.fallback(() =&gt; ({ status: 'pending', degraded: true }));

breaker.on('open', () =&gt; logger.warn('payments_circuit_open'));
breaker.on('halfOpen', () =&gt; logger.info('payments_circuit_half_open'));
breaker.on('close', () =&gt; logger.info('payments_circuit_closed'));

// Use it
const result = await breaker.fire({ id: orderId });
</code></pre>

<h3>Bulkhead with separate clients</h3>
<pre><code class="language-typescript">// Each downstream gets its own pool — isolated failure domain
import { Agent } from 'undici';

const stripeAgent = new Agent({ connections: 50, pipelining: 1 });
const userSvcAgent = new Agent({ connections: 100 });
const searchAgent = new Agent({ connections: 30 });

async function chargeStripe(...) {
  return fetch('https://api.stripe.com/...', {
    dispatcher: stripeAgent,
    signal: AbortSignal.timeout(5000),
  });
}
</code></pre>

<h3>Idempotency key middleware</h3>
<pre><code class="language-typescript">// Server-side dedupe
async function withIdempotency(req, res, next) {
  const key = req.header('idempotency-key');
  if (!key) return next();

  const cached = await redis.get(\`idem:\${key}\`);
  if (cached) {
    const { status, body } = JSON.parse(cached);
    return res.status(status).json(body);
  }

  // Capture response
  const originalJson = res.json.bind(res);
  res.json = (body) =&gt; {
    redis.setex(\`idem:\${key}\`, 86400, JSON.stringify({ status: res.statusCode, body }));
    return originalJson(body);
  };

  next();
}

app.post('/orders', withIdempotency, async (req, res) =&gt; {
  const order = await createOrder(req.body);
  res.status(201).json(order);
});
</code></pre>

<h3>Backpressure via bounded queue</h3>
<pre><code class="language-typescript">import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 100,        // max in-flight
  intervalCap: 1000,       // max per interval
  interval: 1000,          // 1s
});

app.post('/expensive', async (req, res) =&gt; {
  if (queue.size &gt; 1000) {
    return res.status(503).set('Retry-After', '5').json({ error: 'overloaded' });
  }
  const result = await queue.add(() =&gt; doExpensive(req.body));
  res.json(result);
});
</code></pre>

<h3>Adaptive concurrency (Netflix-style)</h3>
<pre><code class="language-typescript">// Dynamically adjust max in-flight based on observed latency
class AdaptiveLimiter {
  private inFlight = 0;
  private limit = 100;
  private latencyP99 = 0;

  async run&lt;T&gt;(fn: () =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
    if (this.inFlight &gt;= this.limit) throw new Error('overloaded');
    this.inFlight++;
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.inFlight--;
      const latency = Date.now() - start;
      this.update(latency);
    }
  }

  private update(latency: number) {
    // Simple version — adjust limit based on latency drift
    if (latency &gt; this.latencyP99 * 1.5) this.limit = Math.max(10, this.limit * 0.9);
    else if (latency &lt; this.latencyP99 * 0.8 &amp;&amp; this.inFlight === this.limit) this.limit++;
    this.latencyP99 = this.latencyP99 * 0.95 + latency * 0.05;
  }
}
</code></pre>

<h3>Graceful shutdown</h3>
<pre><code class="language-typescript">const server = app.listen(3000);
let shuttingDown = false;
const inFlight = new Set();

app.use((req, res, next) =&gt; {
  if (shuttingDown) return res.status(503).set('Connection', 'close').json({ error: 'shutting_down' });
  inFlight.add(req);
  res.on('finish', () =&gt; inFlight.delete(req));
  res.on('close', () =&gt; inFlight.delete(req));
  next();
});

async function shutdown() {
  shuttingDown = true;
  server.close();

  const start = Date.now();
  while (inFlight.size &gt; 0 &amp;&amp; Date.now() - start &lt; 30_000) {
    logger.info({ remaining: inFlight.size }, 'draining');
    await new Promise((r) =&gt; setTimeout(r, 500));
  }

  await pool.end();
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
</code></pre>

<h3>Health check pattern</h3>
<pre><code class="language-typescript">app.get('/live', (_req, res) =&gt; res.status(200).json({ alive: true }));

app.get('/ready', async (_req, res) =&gt; {
  try {
    await Promise.all([
      pool.query('SELECT 1'),
      redis.ping(),
      // Don't include slow / non-essential checks
    ]);
    res.json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false, error: String(err) });
  }
});
</code></pre>

<h3>Fallback pattern</h3>
<pre><code class="language-typescript">async function getRecommendations(userId: string): Promise&lt;Recommendation[]&gt; {
  try {
    return await breaker.fire({ userId });
  } catch (err) {
    logger.warn({ err, userId }, 'recs_fallback');
    // Fallback: cached default list
    const cached = await redis.get('recs:default');
    if (cached) return JSON.parse(cached);
    // Last resort
    return [];
  }
}
</code></pre>

<h3>Hedged requests</h3>
<pre><code class="language-typescript">// Send the same request to two replicas; take whichever finishes first
async function hedged&lt;T&gt;(call: () =&gt; Promise&lt;T&gt;, hedgeAfterMs = 100): Promise&lt;T&gt; {
  return new Promise((resolve, reject) =&gt; {
    let pending = 1;
    let resolved = false;
    const fire = () =&gt; {
      pending++;
      call().then((r) =&gt; {
        if (!resolved) { resolved = true; resolve(r); }
      }).catch((e) =&gt; {
        pending--;
        if (pending === 0 &amp;&amp; !resolved) reject(e);
      });
    };
    const timer = setTimeout(() =&gt; fire(), hedgeAfterMs);
    call().then((r) =&gt; {
      clearTimeout(timer);
      if (!resolved) { resolved = true; resolve(r); }
    }).catch(() =&gt; {
      pending--;
      if (pending === 0 &amp;&amp; !resolved) fire();
    });
  });
}
</code></pre>

<p>Hedging tail-latency: most requests fast, a few slow — second request often beats. Tradeoff: doubles load; only for read-only critical paths.</p>

<h3>Per-tenant rate limiting (token bucket via Redis)</h3>
<pre><code class="language-lua">-- token_bucket.lua
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])  -- tokens/sec
local cost = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1]) or capacity
local ts = tonumber(data[2]) or now

local elapsed = math.max(0, now - ts) / 1000
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens &lt; cost then
  redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
  return 0
end

tokens = tokens - cost
redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', key, 60000)
return 1
</code></pre>

<h3>Chaos test sketch</h3>
<pre><code class="language-typescript">// Inject 5% latency + 1% failure into HTTP client (non-prod)
async function chaosFetch(url: string, opts?: RequestInit) {
  if (process.env.CHAOS === 'true') {
    if (Math.random() &lt; 0.05) await new Promise((r) =&gt; setTimeout(r, 5000)); // 5% slow
    if (Math.random() &lt; 0.01) throw new Error('chaos_failure'); // 1% error
  }
  return fetch(url, opts);
}
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Robust external API call</h3>
<pre><code class="language-typescript">import CircuitBreaker from 'opossum';
import { Agent } from 'undici';

const stripeAgent = new Agent({ connections: 50 });
const stripeBreaker = new CircuitBreaker(
  async (input: { customerId: string; amountCents: number; idempotencyKey: string }) =&gt; {
    const res = await fetch('https://api.stripe.com/v1/charges', {
      method: 'POST',
      dispatcher: stripeAgent,
      headers: {
        'Authorization': \`Bearer \${process.env.STRIPE_KEY}\`,
        'Idempotency-Key': input.idempotencyKey,
      },
      body: new URLSearchParams({
        customer: input.customerId,
        amount: String(input.amountCents),
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const err: any = new Error(\`stripe_\${res.status}\`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },
  {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30_000,
    volumeThreshold: 10, // need at least 10 requests in window before tripping
  }
);

stripeBreaker.fallback(() =&gt; {
  throw new Error('payments_unavailable'); // surface to caller; degrade UX
});

async function chargeWithRetry(customerId, amountCents, idempotencyKey, maxAttempts = 3) {
  for (let i = 0; i &lt; maxAttempts; i++) {
    try {
      return await stripeBreaker.fire({ customerId, amountCents, idempotencyKey });
    } catch (err: any) {
      // Don't retry 4xx (except 429)
      if (err.status &amp;&amp; err.status &gt;= 400 &amp;&amp; err.status &lt; 500 &amp;&amp; err.status !== 429) throw err;
      // Don't retry if circuit open (circuit will return immediately)
      if (err.message === 'Breaker is open') throw err;
      const backoff = 500 * 2 ** i + Math.random() * 200;
      await new Promise((r) =&gt; setTimeout(r, backoff));
    }
  }
  throw new Error('charge_max_retries');
}
</code></pre>

<h3>Example 2: Fallback to cached recommendations</h3>
<pre><code class="language-typescript">async function getRecommendations(userId: string): Promise&lt;Product[]&gt; {
  try {
    return await recsBreaker.fire({ userId });
  } catch (err) {
    // Personalized recs unavailable; degrade gracefully
    logger.warn({ err, userId }, 'recs_fallback');

    // 1. Try user's last-known recommendations
    const cached = await redis.get(\`recs:user:\${userId}\`);
    if (cached) return JSON.parse(cached);

    // 2. Try category-based defaults
    const userCategory = await getUserCategory(userId);
    const defaults = await redis.get(\`recs:cat:\${userCategory}\`);
    if (defaults) return JSON.parse(defaults);

    // 3. Top-10 site-wide
    return getTopProducts();
  }
}
</code></pre>

<h3>Example 3: Bulkhead — separate pools per dependency</h3>
<pre><code class="language-typescript">// One slow downstream shouldn't starve others
import { Agent, fetch } from 'undici';

const agents = {
  payments: new Agent({ connections: 50 }),
  search: new Agent({ connections: 30 }),
  notifications: new Agent({ connections: 20 }),
};

const limiters = {
  payments: new PQueue({ concurrency: 50 }),
  search: new PQueue({ concurrency: 30 }),
  notifications: new PQueue({ concurrency: 20 }),
};

async function callPayments(input) {
  return limiters.payments.add(() =&gt; fetch('http://payments-svc/...', {
    dispatcher: agents.payments,
    signal: AbortSignal.timeout(3000),
  }));
}

async function callSearch(input) {
  return limiters.search.add(() =&gt; fetch('http://search-svc/...', {
    dispatcher: agents.search,
    signal: AbortSignal.timeout(1000),
  }));
}
</code></pre>

<h3>Example 4: Idempotent endpoint</h3>
<pre><code class="language-typescript">app.post('/orders', async (req, res) =&gt; {
  const idempotencyKey = req.header('idempotency-key');
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'idempotency_key_required' });
  }

  // Check if already processed
  const cached = await redis.get(\`idem:order:\${idempotencyKey}\`);
  if (cached) {
    const { status, body } = JSON.parse(cached);
    return res.status(status).json(body);
  }

  try {
    const order = await db.transaction(async (tx) =&gt; {
      // Within transaction, also store idempotency to prevent races
      const existing = await tx.query(
        'SELECT result FROM idempotency WHERE key = $1',
        [idempotencyKey]
      );
      if (existing.rows[0]) return existing.rows[0].result;

      const o = await tx.query('INSERT INTO orders ... RETURNING *', [...]);
      await tx.query(
        'INSERT INTO idempotency (key, result, expires_at) VALUES ($1, $2, NOW() + interval \\'24 hours\\')',
        [idempotencyKey, JSON.stringify(o.rows[0])]
      );
      return o.rows[0];
    });

    const response = { status: 201, body: order };
    await redis.setex(\`idem:order:\${idempotencyKey}\`, 86400, JSON.stringify(response));
    res.status(201).json(order);
  } catch (err) {
    if (err.code === '23505' &amp;&amp; err.constraint === 'idempotency_key_pkey') {
      // Concurrent request inserted; read and return
      const result = await db.query('SELECT result FROM idempotency WHERE key = $1', [idempotencyKey]);
      return res.status(201).json(result.rows[0].result);
    }
    throw err;
  }
});
</code></pre>

<h3>Example 5: Adaptive concurrency limit</h3>
<pre><code class="language-typescript">// Bound concurrent in-flight; adjust based on observed latency
class AdaptiveLimit {
  private inFlight = 0;
  private limit = 100;
  private p99 = 1000;
  private samples: number[] = [];

  async wrap&lt;T&gt;(fn: () =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
    if (this.inFlight &gt;= this.limit) {
      throw new HttpError(503, 'overloaded');
    }
    this.inFlight++;
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const dur = Date.now() - start;
      this.inFlight--;
      this.recordSample(dur);
    }
  }

  private recordSample(d: number) {
    this.samples.push(d);
    if (this.samples.length &gt; 1000) this.samples.shift();
    if (this.samples.length &gt; 100) {
      const sorted = [...this.samples].sort((a, b) =&gt; a - b);
      const newP99 = sorted[Math.floor(sorted.length * 0.99)];
      if (newP99 &gt; this.p99 * 1.3) this.limit = Math.max(10, Math.floor(this.limit * 0.9));
      else if (newP99 &lt; this.p99 * 0.7 &amp;&amp; this.inFlight === this.limit) this.limit++;
      this.p99 = newP99;
    }
  }
}

const limiter = new AdaptiveLimit();

app.use(async (req, res, next) =&gt; {
  try {
    await limiter.wrap(async () =&gt; {
      await new Promise(next);
    });
  } catch (err) {
    if (err.status === 503) {
      res.status(503).set('Retry-After', '1').json({ error: 'overloaded' });
    } else throw err;
  }
});
</code></pre>

<h3>Example 6: Hedged read for tail-latency</h3>
<pre><code class="language-typescript">// Two replicas; fire second if first hasn't responded in 100ms
async function readHedged(query: string, args: any[]): Promise&lt;Row[]&gt; {
  const replicas = ['db-replica-1', 'db-replica-2'];
  let primary = await Promise.race([
    queryReplica(replicas[0], query, args),
    new Promise((_, reject) =&gt; setTimeout(() =&gt; reject('hedge'), 100)),
  ]).catch(() =&gt; null);

  if (primary) return primary as Row[];

  // First didn't respond in 100ms; race both
  return Promise.any([
    queryReplica(replicas[0], query, args),
    queryReplica(replicas[1], query, args),
  ]);
}
</code></pre>

<h3>Example 7: Canary deploy with metric watch</h3>
<pre><code class="language-yaml"># Argo Rollouts canary spec
spec:
  strategy:
    canary:
      steps:
        - setWeight: 5    # 5% to canary
        - pause: { duration: 10m }
        - analysis:        # check error rate + latency
            templates:
              - templateName: success-rate
              - templateName: latency-p99
        - setWeight: 25
        - pause: { duration: 10m }
        - setWeight: 100
</code></pre>

<p>If success-rate or latency-p99 violates thresholds, auto-rollback. No manual intervention.</p>

<h3>Example 8: Chaos experiment</h3>
<pre><code class="language-typescript">// Fault-inject 1% of search calls in staging; verify fallback works
import { setTimeout as sleep } from 'timers/promises';

async function chaosSearchCall(query: string) {
  if (process.env.CHAOS === 'true' &amp;&amp; Math.random() &lt; 0.01) {
    await sleep(10_000); // simulate 10s slow
  }
  if (process.env.CHAOS === 'true' &amp;&amp; Math.random() &lt; 0.005) {
    throw new Error('chaos_search_down');
  }
  return realSearchCall(query);
}

// Then run integration tests; verify circuit breaker opens, fallback fires.
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Retries amplifying load</h3>
<ul>
  <li>1000 clients each retry 3 times → upstream hit 3000× when it was already struggling.</li>
  <li>Mitigation: limited retry budget per request; circuit breaker; jittered exponential backoff so retries spread.</li>
</ul>

<h3>Cascading timeouts</h3>
<ul>
  <li>A → B → C all 30s timeout. C fails at 30s; B's timer fires after that; A's already gone.</li>
  <li>Mitigation: budget propagation. A passes deadline 25s to B; B passes 20s to C.</li>
</ul>

<h3>Circuit breaker on stateful operations</h3>
<ul>
  <li>Circuit opens after 50% failure rate. But the 50% that succeeded did write to the DB. Now you fail fast — but you've left half-completed state.</li>
  <li>Mitigation: idempotent operations; saga compensations; clean retries from a known good state.</li>
</ul>

<h3>Liveness check too aggressive</h3>
<ul>
  <li>Liveness fails on transient hiccup; container restarts; restart cascade.</li>
  <li>Liveness should only fail when the process is genuinely stuck (deadlock, infinite loop). Use long timeouts; check internal state, not external dependencies.</li>
</ul>

<h3>Readiness check too lenient</h3>
<ul>
  <li>Readiness returns 200 even when DB is down; LB sends traffic; users see 500s.</li>
  <li>Mitigation: readiness checks key dependencies; degraded but not fully broken returns 200 with warning.</li>
</ul>

<h3>Retry on POST without idempotency</h3>
<ul>
  <li>Network blip mid-charge; client retries; double charge.</li>
  <li>Always: idempotency key on every mutation. Server dedupes.</li>
</ul>

<h3>Fallback masks the real issue</h3>
<ul>
  <li>Recs service down for a week; fallback to defaults; nobody notices.</li>
  <li>Mitigation: alert on fallback rate; fallback shouldn't be silent in monitoring.</li>
</ul>

<h3>Deploy strategy and graceful shutdown mismatch</h3>
<ul>
  <li>Pod gets SIGTERM; LB still sends traffic for ~10s while service registry updates.</li>
  <li>Mitigation: pre-stop hook delays shutdown; LB removes from rotation before SIGTERM.</li>
</ul>

<h3>Hedged requests doubling load</h3>
<ul>
  <li>Hedging fires second request after 100ms; under load, every request hedges; load doubles.</li>
  <li>Mitigation: hedge only if confident; cap total concurrent hedges; use only for read paths.</li>
</ul>

<h3>Region failover correctness</h3>
<ul>
  <li>Active-active multi-region with write conflicts; user updates same record in both regions.</li>
  <li>Mitigations: last-write-wins (timestamp-based); CRDTs; or active-passive (only one region writes).</li>
</ul>

<h3>Chaos in production</h3>
<ul>
  <li>Easy to break customer experience; safe scope: feature flags, gradual rollout, business-hours only.</li>
  <li>Game days: explicit, scheduled, limited blast radius.</li>
  <li>Always have a rollback / abort.</li>
</ul>

<h3>Backpressure but client doesn't respect 503</h3>
<ul>
  <li>Server returns 503 + Retry-After; mobile client retries immediately.</li>
  <li>Mitigation: enforce backoff client-side (RN libraries handle); server can also tarpit (slow response) clients ignoring 503.</li>
</ul>

<h3>Mobile angle</h3>
<ul>
  <li>Mobile clients flap; idempotency keys + backoff are non-negotiable.</li>
  <li>Cellular networks add 200-500ms baseline; budget accordingly.</li>
  <li>OS may suspend app mid-request; the request may complete on server but client never sees the response. Server idempotency catches the retry.</li>
  <li>Background sync: queue mutations locally; flush when online; idempotency keys on each.</li>
</ul>

<h3>Distributed tracing during failure</h3>
<ul>
  <li>Without correlation IDs across services, debugging across hops takes hours.</li>
  <li>OpenTelemetry trace context propagated everywhere; logs include trace ID.</li>
  <li>Service mesh handles propagation transparently.</li>
</ul>

<h3>Error budget</h3>
<ul>
  <li>SLO: 99.9% uptime → 43min/month error budget. Spent on outages or feature risk.</li>
  <li>If error budget burned: pause feature work; invest in reliability.</li>
  <li>Healthy: balanced velocity vs reliability; explicit tradeoff via SLO.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common resilience mistakes</h3>
<ol>
  <li><strong>No timeout on external calls.</strong> Slow upstream blocks workers; service unavailable.</li>
  <li><strong>Retry on 4xx.</strong> Won't help; amplifies bad client behavior.</li>
  <li><strong>No jitter.</strong> Synchronized retries; thundering herd.</li>
  <li><strong>No idempotency keys.</strong> Retry causes duplicates.</li>
  <li><strong>No circuit breaker.</strong> Cascading failures across slow upstream.</li>
  <li><strong>Liveness checks downstream dependencies.</strong> Restart cascade.</li>
  <li><strong>No backpressure.</strong> Overload → OOM.</li>
  <li><strong>Unbounded queues.</strong> Memory exhaustion.</li>
  <li><strong>Big-bang deploys.</strong> No canary; bad release = full outage.</li>
  <li><strong>No graceful shutdown.</strong> SIGTERM cuts in-flight requests.</li>
  <li><strong>Silent fallbacks.</strong> Recs down for week, nobody notices.</li>
  <li><strong>No chaos testing.</strong> Failure modes only discovered in prod.</li>
</ol>

<h3>Anti-pattern: missing timeout</h3>
<pre><code class="language-typescript">// BAD — slow upstream blocks forever
const res = await fetch('https://upstream.example.com/data');

// GOOD — explicit timeout
const res = await fetch('https://upstream.example.com/data', {
  signal: AbortSignal.timeout(3000),
});
</code></pre>

<h3>Anti-pattern: retry on 4xx</h3>
<pre><code class="language-typescript">// BAD — retries even for 401, 403, 422
async function call(fn) {
  for (let i = 0; i &lt; 5; i++) {
    try { return await fn(); } catch { await sleep(2 ** i * 100); }
  }
}

// GOOD — only retry transient
async function call(fn, { maxAttempts = 5 } = {}) {
  for (let i = 0; i &lt; maxAttempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err.status &amp;&amp; err.status &gt;= 400 &amp;&amp; err.status &lt; 500 &amp;&amp; err.status !== 429) throw err;
      await sleep(Math.min(30_000, 2 ** i * 100) + Math.random() * 200);
    }
  }
  throw new Error('max_retries');
}
</code></pre>

<h3>Anti-pattern: no jitter</h3>
<pre><code class="language-typescript">// BAD — all clients retry at exactly t+1s, t+2s, t+4s; thundering herd
await sleep(2 ** i * 1000);

// GOOD — jitter spreads retries
const exp = Math.min(30_000, 2 ** i * 1000);
const jitter = Math.random() * exp * 0.3;
await sleep(exp + jitter);
</code></pre>

<h3>Anti-pattern: liveness includes external deps</h3>
<pre><code class="language-typescript">// BAD — DB blip → liveness fails → container restart → still no DB → restart loop
app.get('/live', async (_req, res) =&gt; {
  await db.query('SELECT 1');
  res.json({ alive: true });
});

// GOOD — liveness checks process internals only
app.get('/live', (_req, res) =&gt; res.json({ alive: true }));

// Readiness can check deps
app.get('/ready', async (_req, res) =&gt; {
  try { await db.query('SELECT 1'); res.json({ ready: true }); }
  catch { res.status(503).json({ ready: false }); }
});
</code></pre>

<h3>Anti-pattern: no graceful shutdown</h3>
<pre><code class="language-typescript">// BAD — SIGTERM kills mid-request
app.listen(3000);

// GOOD — drain in-flight; then close
const server = app.listen(3000);
process.on('SIGTERM', async () =&gt; {
  server.close();
  await waitForInFlight();
  await db.end();
  process.exit(0);
});
</code></pre>

<h3>Anti-pattern: unbounded retry budget</h3>
<pre><code class="language-typescript">// BAD — A retries 5x; B retries 5x; total 25 attempts upstream
// At service A, retry the call to B 5 times.
// At service B, retry the call to C 5 times.

// GOOD — budget propagation; total retries bounded
// A retries 2x; B retries 2x; total 4 attempts
// Or: only retry at the highest layer
</code></pre>

<h3>Anti-pattern: silent fallback</h3>
<pre><code class="language-typescript">// BAD — fallback fires; nobody knows
async function getRecs(userId) {
  try { return await callRecs(userId); }
  catch { return DEFAULT_RECS; }
}

// GOOD — instrument the fallback
async function getRecs(userId) {
  try { return await callRecs(userId); }
  catch (err) {
    metrics.counter('recs_fallback', 1, { reason: err.message });
    logger.warn({ err, userId }, 'recs_fallback');
    return DEFAULT_RECS;
  }
}
</code></pre>

<h3>Anti-pattern: exclusive deploy strategy</h3>
<pre><code class="language-text">// BAD — replace 100% of pods at once; bad release = total outage

// GOOD — canary or rolling
1. Deploy new version to 5% of pods (canary)
2. Watch error rate + latency for 10 min
3. If healthy, expand to 25%, 50%, 100%
4. If unhealthy, rollback automatically
</code></pre>

<h3>Anti-pattern: no observability for failures</h3>
<p>Without dashboards on error rate, latency p99, saturation, traffic — you find out about outages from users. Build SLO dashboards; alert on error budget burn.</p>

<h3>Anti-pattern: no chaos test of fallbacks</h3>
<p>Fallback exists in code but never exercised. First time it runs in prod, it has bugs. Run chaos tests in staging that exercise fallback paths regularly.</p>

<h3>Anti-pattern: hedging in writes</h3>
<p>Hedged requests for writes = double-execution. Only hedge idempotent reads. For writes, redundancy via retry + idempotency key.</p>

<h3>Anti-pattern: ignoring backpressure</h3>
<pre><code class="language-typescript">// BAD — process whatever comes; no shedding
app.post('/expensive', async (req, res) =&gt; {
  await doExpensive(req.body);
  res.json({ ok: true });
});

// GOOD — bounded concurrency; shed when full
const limiter = new PQueue({ concurrency: 50 });
app.post('/expensive', async (req, res) =&gt; {
  if (limiter.size &gt; 500) return res.status(503).set('Retry-After', '5').json({ error: 'overloaded' });
  await limiter.add(() =&gt; doExpensive(req.body));
  res.json({ ok: true });
});
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common resilience interview prompts</h3>
<ol>
  <li>How do you handle a slow downstream API?</li>
  <li>Walk through retry strategy for [feature].</li>
  <li>What's the circuit breaker pattern?</li>
  <li>How do you prevent cascading failures?</li>
  <li>How do you handle deploy rollouts safely?</li>
  <li>What's the difference between liveness and readiness?</li>
  <li>How do you test for resilience (chaos engineering)?</li>
  <li>Tell me about an outage you debugged.</li>
</ol>

<h3>The 5-step framework for "make this resilient"</h3>
<ol>
  <li><strong>Timeout every external call</strong> with a sensible budget.</li>
  <li><strong>Retry transient failures</strong> with backoff + jitter; idempotency keys for writes.</li>
  <li><strong>Circuit-break</strong> on consistent failure; fail fast with fallback.</li>
  <li><strong>Bulkhead + backpressure</strong> — isolate failure domains; bounded queues; load shed.</li>
  <li><strong>Test deliberately</strong> — chaos in staging; canary deploys; observability everywhere.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Timeout every external call. Without it, slow upstream cascades into total outage. Budget propagation so child deadlines fit within parent."</em></li>
  <li><em>"Retry transient failures only — 5xx and network errors with exponential backoff + jitter. 4xx fail fast; client mistake."</em></li>
  <li><em>"Idempotency keys per mutation; server dedupes for 24h+. Without this, retries duplicate."</em></li>
  <li><em>"Circuit breaker on each downstream — opens at 50% failure rate; fails fast with fallback; periodically probes."</em></li>
  <li><em>"Bulkhead per dependency — separate connection pools / thread pools / queues. One bad downstream shouldn't starve the rest."</em></li>
  <li><em>"Backpressure with bounded queues — reject when full; client gets 503 + Retry-After. Unbounded queues are how systems collapse."</em></li>
  <li><em>"Liveness checks process health only; readiness checks deps. Aggressive liveness causes restart cascades."</em></li>
  <li><em>"Canary deploys with auto-rollback on metric drift. Big-bang deploys are how outages happen."</em></li>
  <li><em>"Chaos engineering in staging; failure modes discovered before prod."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"slow upstream blocking us"</td><td>Timeout + circuit breaker + bulkhead</td></tr>
    <tr><td>"don't double-charge"</td><td>Idempotency key on POST; server dedupes</td></tr>
    <tr><td>"prevent cascade"</td><td>Timeouts + circuit breakers + budget propagation</td></tr>
    <tr><td>"thundering herd"</td><td>Jittered backoff; single-flight; cache stampede</td></tr>
    <tr><td>"deploy safely"</td><td>Canary or blue-green; auto-rollback on metric drift</td></tr>
    <tr><td>"recs unavailable"</td><td>Fallback to cached / default; alert on fallback rate</td></tr>
    <tr><td>"protect from overload"</td><td>Adaptive concurrency limit; bounded queue; load shed</td></tr>
    <tr><td>"region failover"</td><td>Multi-region (active-active or active-passive); DNS-based or anycast</td></tr>
    <tr><td>"test failure"</td><td>Chaos engineering; staging fault injection; game days</td></tr>
    <tr><td>"tail latency"</td><td>Hedged requests (read paths only)</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch the call graph; identify each external dep.</li>
  <li>Show timeout per dep + budget propagation.</li>
  <li>Show retry policy (transient only, jittered).</li>
  <li>Wrap in circuit breaker with fallback.</li>
  <li>Bulkhead per dependency.</li>
  <li>Idempotency keys for writes.</li>
  <li>Backpressure / load shedding.</li>
  <li>Talk deploy strategy (canary + auto-rollback) + chaos.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Service mesh (Istio / Linkerd) for retries, timeouts, mTLS, circuit-breaking transparently."</em></li>
  <li><em>"Adaptive concurrency limits that auto-tune based on observed latency."</em></li>
  <li><em>"Multi-region active-active with health-based DNS routing."</em></li>
  <li><em>"Chaos Monkey-style tests in staging weekly."</em></li>
  <li><em>"Error-budget-driven release pace (SRE)."</em></li>
  <li><em>"Distributed tracing on every cross-service call."</em></li>
  <li><em>"Per-tenant isolation (noisy-neighbor protection)."</em></li>
  <li><em>"DR runbook with RTO / RPO targets and tested restores."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Timeout discipline</td><td>Names timeout + budget propagation</td></tr>
    <tr><td>Retry strategy</td><td>Transient only + backoff + jitter + max</td></tr>
    <tr><td>Idempotency awareness</td><td>Keys + dedupe</td></tr>
    <tr><td>Circuit breaker</td><td>Names states + fallback</td></tr>
    <tr><td>Bulkhead</td><td>Isolation per dependency</td></tr>
    <tr><td>Backpressure</td><td>Bounded queues; load shed</td></tr>
    <tr><td>Health checks</td><td>Liveness vs readiness distinction</td></tr>
    <tr><td>Deploy resilience</td><td>Canary + auto-rollback</td></tr>
    <tr><td>Chaos awareness</td><td>Tests failure deliberately</td></tr>
    <tr><td>SLO / error budget</td><td>Names budget-based decision making</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Mobile clients add their own resilience layer: retry, idempotency keys, offline queue.</li>
  <li>Cellular networks: 200-500ms baseline + flapping. Generous timeouts + aggressive retry.</li>
  <li>Background suspension: server may complete request after client gives up; idempotency catches retry.</li>
  <li>Offline mutations queue locally; flush when online; each carries idempotency key.</li>
  <li>Push notification → action that may have already happened (server already processed) — dedupe at client.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How do you decide retry vs no retry?"</em> — Transient (network, 5xx, 429) → retry with backoff. Permanent (4xx) → fail fast. Idempotency key on writes regardless.</li>
  <li><em>"How does a circuit breaker know when to close?"</em> — After timeout, transitions to half-open; sends a probe; if successful, closes; if fails, returns to open.</li>
  <li><em>"What's the difference between bulkhead and rate limiting?"</em> — Bulkhead: isolation per dependency (separate pools). Rate limiting: cap per-client / per-time. Both protect against overload via different mechanisms.</li>
  <li><em>"How do you prevent cascading failures?"</em> — Timeouts everywhere with budget propagation; circuit breakers; bulkheads; load shedding; aggressive client-side retry policies (with caps).</li>
  <li><em>"What metrics indicate health?"</em> — RED (Request rate, Error rate, Duration) per service; USE (Utilization, Saturation, Errors) per resource. Both per-instance + aggregate.</li>
  <li><em>"How do you handle a deploy that breaks production?"</em> — Auto-rollback via canary metric watch; manual rollback through deploy tool; never "roll forward with a fix" under fire — get back to known-good first.</li>
  <li><em>"Walk me through your last outage."</em> — Specific story: detection time, mitigation, root cause, prevention. Honest about gaps.</li>
  <li><em>"What's an SLO?"</em> — Service Level Objective: target reliability (e.g., 99.9% of requests &lt; 200ms over 30 days). Difference from objective is your error budget. Below target → invest in reliability over features.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a small service with timeouts + retries + circuit breakers via opossum.</li>
  <li>Add idempotency middleware.</li>
  <li>Add bulkhead via separate undici Agents.</li>
  <li>Test cascading failure: kill upstream; verify fallback works.</li>
  <li>Try Chaos Monkey-style fault injection.</li>
  <li>Read Google's SRE book chapters on SLO + error budget.</li>
  <li>Read Netflix's Hystrix / opossum / Polly docs.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'Release It!' by Michael Nygard cover to cover."</li>
  <li>"Read AWS's Builder's Library articles on resilience patterns."</li>
  <li>"Build a multi-region active-active system end-to-end."</li>
  <li>"Set up an Argo Rollouts canary in a real cluster; trigger an auto-rollback."</li>
</ul>
`
    }
  ]
});
