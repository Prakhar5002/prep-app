window.PREP_SITE.registerTopic({
  id: 'api-versioning',
  module: 'api-design',
  title: 'Versioning & Rate Limiting',
  estimatedReadTime: '45 min',
  tags: ['api-versioning', 'rate-limiting', 'token-bucket', 'sliding-window', 'deprecation', 'sunset', 'quota', 'gateway'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Two cross-cutting concerns that every public-ish API must solve from day one: <strong>versioning</strong> (how the contract evolves without breaking clients) and <strong>rate limiting</strong> (how to keep one bad actor from melting the service for everyone else). Both are easy to defer and painful to retrofit.</p>
<ul>
  <li><strong>Versioning strategies:</strong> URI path (<code>/v1/...</code>), header (<code>Accept-Version</code>), media type (<code>application/vnd.example.v2+json</code>), query string. URI is most popular; header / media type are more "REST-pure" but harder to adopt.</li>
  <li><strong>Default policy:</strong> evolve additively — add fields, never remove silently; mark deprecated; ship a clear sunset date; track usage per client.</li>
  <li><strong>Rate-limit algorithms:</strong> fixed window (simple, bursty edges), sliding window (smoother), token bucket (burst-tolerant, gold standard), leaky bucket (smoothing), sliding log (precise, expensive).</li>
  <li><strong>Where to enforce:</strong> gateway (cheap, broad), service (precise, expensive), or both. Distributed limiters use Redis with atomic Lua scripts or Redis-Cell module.</li>
  <li><strong>Headers:</strong> <code>RateLimit-Limit</code>, <code>RateLimit-Remaining</code>, <code>RateLimit-Reset</code> on every response (RFC draft). <code>429 Too Many Requests</code> + <code>Retry-After</code> when blocked.</li>
  <li><strong>Quotas vs limits:</strong> rate-limit = per-second smoothing; quota = per-day cap. Usually need both.</li>
  <li><strong>Mobile:</strong> exponential backoff with jitter, offline queue, idempotency keys for retried mutations.</li>
</ul>
<p><strong>Mantra:</strong> "Never break clients silently. Never trust clients implicitly. Both versioning and rate-limiting are policy decisions before they're technical ones."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>Why versioning matters</h3>
<p>An API is a contract with code that runs on machines you don't own — partner servers, mobile apps installed for years, browser extensions, IoT firmware. Once shipped, even small changes can break callers you'll never reach. Versioning is how the contract evolves without bricking the field.</p>

<h3>The cost of "no versioning"</h3>
<ul>
  <li><strong>Mobile app stuck on v1:</strong> your unlucky 2% of users on a 14-month-old build can't be force-upgraded. Their app dies the moment you remove the field.</li>
  <li><strong>Partner integrations:</strong> a B2B integration team plans 6-month sprints. Surprise breakage = lost contracts.</li>
  <li><strong>Search engines, scrapers, monitors:</strong> you don't even know they exist until they break.</li>
  <li><strong>SDK shipping cycles:</strong> Swift / Kotlin / Java SDKs lag your server by weeks; a breaking change without versioning = mass support tickets.</li>
</ul>

<h3>Why rate-limiting matters</h3>
<table>
  <thead><tr><th>Without limits</th><th>With limits</th></tr></thead>
  <tbody>
    <tr><td>One bad client melts the DB.</td><td>Bad client gets 429; everyone else fine.</td></tr>
    <tr><td>Thundering herd on cache miss.</td><td>Bounded concurrency at the gateway.</td></tr>
    <tr><td>Surprise cost spikes (egress, DB).</td><td>Predictable cost; known burst budget.</td></tr>
    <tr><td>Hard to enforce fair share.</td><td>Per-tenant / per-key fairness.</td></tr>
    <tr><td>DoS by accident or design.</td><td>Layered defense.</td></tr>
  </tbody>
</table>

<h3>What "good" looks like for both</h3>
<ul>
  <li>Versioning policy <em>documented</em> on day one — even if you only have v1.</li>
  <li>Additive evolution by default; deprecation cycle with clear sunset dates.</li>
  <li>Telemetry per-version usage so you know when v1 is safe to retire.</li>
  <li>Rate limits documented; headers on every response; <code>429 + Retry-After</code> when blocked.</li>
  <li>Different limits for anonymous, authenticated, premium, internal — at the gateway with overrides per route.</li>
  <li>Quotas separate from rate limits (daily caps vs per-second smoothing).</li>
  <li>Distributed enforcement — works correctly across many gateway instances.</li>
  <li>Client-side: backoff with jitter, idempotency keys, offline queue.</li>
</ul>

<h3>What "bad" looks like</h3>
<ul>
  <li>Silent breaking changes. Field disappears; consumer crashes; nobody knew.</li>
  <li><code>/v1</code> in the URI but no policy for what triggers <code>/v2</code> — version increments arbitrarily.</li>
  <li>Single global rate limit, no per-tenant or per-route.</li>
  <li>Limits enforced only in app code; gateway is unprotected.</li>
  <li>No headers — clients have to guess when they're approaching limits.</li>
  <li>Hardcoded limits; can't tune without redeploy.</li>
  <li>Limit per-IP only; one office NAT melts the whole company.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model — Versioning',
      html: `
<h3>The four versioning strategies</h3>
<table>
  <thead><tr><th>Strategy</th><th>Looks like</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>URI path</td><td><code>GET /v1/users/42</code></td><td>Visible, easy to test, easy to route</td><td>Different "resources" for what's the same; CDN cache splitting</td></tr>
    <tr><td>Header</td><td><code>API-Version: 2</code> or <code>Accept-Version: 2</code></td><td>Same URI; clean</td><td>Invisible in logs; harder to test from a browser</td></tr>
    <tr><td>Media type</td><td><code>Accept: application/vnd.example.v2+json</code></td><td>"Most RESTful"</td><td>Painful to type; tooling support uneven</td></tr>
    <tr><td>Query string</td><td><code>?version=2</code></td><td>Easiest to set in a browser</td><td>Often considered an anti-pattern; pollutes cache keys</td></tr>
  </tbody>
</table>
<p>Pick one. <strong>URI path</strong> is the boring industry default — Stripe, Twilio, GitHub all use it. <strong>Stripe-style date versioning</strong> (<code>2024-09-01</code>) is the senior move for fast-evolving APIs.</p>

<h3>What counts as "breaking"</h3>
<table>
  <thead><tr><th>Change</th><th>Breaking?</th></tr></thead>
  <tbody>
    <tr><td>Add a new endpoint</td><td>No</td></tr>
    <tr><td>Add an optional field to a response</td><td>No (if clients are tolerant)</td></tr>
    <tr><td>Add an optional request field with default</td><td>No</td></tr>
    <tr><td>Add a new required request field</td><td>Yes</td></tr>
    <tr><td>Remove a response field</td><td>Yes</td></tr>
    <tr><td>Rename a field</td><td>Yes</td></tr>
    <tr><td>Change a field's type</td><td>Yes</td></tr>
    <tr><td>Change a field's nullability (null → required)</td><td>Yes</td></tr>
    <tr><td>Change semantics of an enum value</td><td>Yes</td></tr>
    <tr><td>Add a new enum value</td><td>Maybe (depends on client tolerance)</td></tr>
    <tr><td>Change error code or status</td><td>Yes</td></tr>
    <tr><td>Change pagination shape</td><td>Yes</td></tr>
    <tr><td>Tighten validation rules</td><td>Yes</td></tr>
    <tr><td>Change rate limit values</td><td>Maybe (informational, can be a soft change)</td></tr>
  </tbody>
</table>

<h3>The deprecation cycle</h3>
<pre><code class="language-text">1. ANNOUNCE   — change in changelog; email partners; show portal banner.
2. SHIP NEW   — new endpoint / field lives alongside old.
3. DEPRECATE  — old emits Deprecation + Sunset headers; track usage.
4. NUDGE      — automated emails when usage crosses thresholds.
5. SUNSET     — old returns 410 Gone after the sunset date; document migration.
</code></pre>
<p>Typical window: 6 months for partner APIs; 12+ months for mobile (you can't force-update).</p>

<h3>Headers for graceful migration</h3>
<pre><code class="language-http">HTTP/1.1 200 OK
Deprecation: Wed, 01 Jul 2026 00:00:00 GMT
Sunset: Wed, 31 Dec 2026 00:00:00 GMT
Link: &lt;https://docs.example.com/migration/v2&gt;; rel="deprecation"
Link: &lt;https://api.example.com/v2/users/42&gt;; rel="successor-version"
</code></pre>

<h3>Versioning at multiple granularities</h3>
<table>
  <thead><tr><th>Scope</th><th>Best fit</th></tr></thead>
  <tbody>
    <tr><td>Whole API</td><td>URI <code>/v1</code> when major changes happen rarely</td></tr>
    <tr><td>Per-resource</td><td>Endpoint-specific evolution; document on each route</td></tr>
    <tr><td>Per-field</td><td>Add new field, deprecate old in same payload — Stripe style</td></tr>
    <tr><td>Date-based</td><td><code>API-Version: 2026-04-30</code>; behaviour pinned per-key by signup date</td></tr>
  </tbody>
</table>

<h3>Stripe's date-based versioning</h3>
<p>Stripe's masterstroke: every API key is pinned to the version active when it was created. Server runs every version simultaneously by transforming requests/responses through a chain of "compat" shims. Pros: every change is opt-in per integrator, no big migrations. Cons: server complexity is real — each compat shim is code that lives forever.</p>
<pre><code class="language-typescript">// Pseudo
const compat = [
  { from: '2024-09-01', to: '2024-12-01', migrate: req =&gt; ..., demigrate: res =&gt; ... },
  { from: '2024-12-01', to: '2025-03-01', ... },
];
function handle(req, key) {
  let cur = req;
  for (const c of compat.from(key.version)) cur = c.migrate(cur);
  let res = router.handle(cur);
  for (const c of compat.reverse().to(key.version)) res = c.demigrate(res);
  return res;
}
</code></pre>

<h3>GraphQL: deprecation, not versioning</h3>
<p>GraphQL bakes in a <code>@deprecated(reason: "...")</code> directive — fields stay, gain a deprecation notice, eventually removed. Almost no GraphQL APIs ship multiple URI versions. Pair with introspection-driven dashboards to track usage.</p>

<h3>tRPC / RPC: schema additivity</h3>
<p>tRPC has no schema language. Versioning = "don't remove or rename procedures; add new ones; deprecate old via JSDoc + monitoring." Tag releases of the shared types package; pin clients deliberately.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics — Rate Limiting',
      html: `
<h3>The 5 main rate-limit algorithms</h3>

<h4>1. Fixed window</h4>
<p>Count requests in N-second buckets; reset every bucket boundary.</p>
<pre><code class="language-typescript">const buckets = new Map&lt;string, { count: number; resetAt: number }&gt;();
const LIMIT = 100, WINDOW_MS = 60_000;

function allow(key: string): boolean {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt &lt;= now) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  if (b.count &gt;= LIMIT) return false;
  b.count++;
  return true;
}
</code></pre>
<ul>
  <li><strong>Pro:</strong> dirt-simple; cheap memory.</li>
  <li><strong>Con:</strong> bursty at boundaries — you can do <code>2 × LIMIT</code> in <code>1 × WINDOW</code> (last second of one window + first second of the next).</li>
</ul>

<h4>2. Sliding window (counter approximation)</h4>
<p>Smooths fixed-window bursts using weighted previous + current counts.</p>
<pre><code class="language-text">approxCount = previousWindowCount × (1 − elapsedFraction) + currentWindowCount
allow if approxCount &lt; LIMIT
</code></pre>
<ul>
  <li><strong>Pro:</strong> smoother than fixed; cheap; common in production.</li>
  <li><strong>Con:</strong> not exact — assumes uniform distribution within a window.</li>
</ul>

<h4>3. Sliding log</h4>
<p>Store a log of request timestamps; count those within the last N seconds.</p>
<pre><code class="language-typescript">function allow(key, now) {
  const log = get(key); // sorted timestamps
  while (log.length &amp;&amp; log[0] &lt;= now - WINDOW_MS) log.shift();
  if (log.length &gt;= LIMIT) return false;
  log.push(now);
  set(key, log);
  return true;
}
</code></pre>
<ul>
  <li><strong>Pro:</strong> exact; supports any window shape.</li>
  <li><strong>Con:</strong> memory grows with throughput; expensive at scale.</li>
</ul>

<h4>4. Token bucket (industry default)</h4>
<p>A bucket fills with tokens at rate <code>r</code>; capacity <code>b</code>. Each request costs 1 token. Empty bucket = denied.</p>
<pre><code class="language-typescript">interface Bucket { tokens: number; lastRefill: number; }
const buckets = new Map&lt;string, Bucket&gt;();
const RATE = 10, // tokens per second
      CAPACITY = 50; // burst

function allow(key: string): boolean {
  const now = Date.now();
  let b = buckets.get(key) ?? { tokens: CAPACITY, lastRefill: now };
  const elapsed = (now - b.lastRefill) / 1000;
  b.tokens = Math.min(CAPACITY, b.tokens + elapsed * RATE);
  b.lastRefill = now;
  if (b.tokens &lt; 1) { buckets.set(key, b); return false; }
  b.tokens--;
  buckets.set(key, b);
  return true;
}
</code></pre>
<ul>
  <li><strong>Pro:</strong> burst-tolerant; intuitive ("rate + burst capacity").</li>
  <li><strong>Con:</strong> requires careful concurrency in distributed implementations.</li>
  <li><strong>Used by:</strong> AWS, GCP, Stripe, Cloudflare.</li>
</ul>

<h4>5. Leaky bucket</h4>
<p>Bucket holds a queue of requests; drains at rate <code>r</code>. Overflow = dropped.</p>
<ul>
  <li><strong>Pro:</strong> smoother output; good for rate-shaping outbound traffic.</li>
  <li><strong>Con:</strong> doesn't handle burst gracefully; rejects rather than queues most often.</li>
  <li><strong>Use case:</strong> outbound API call queues; less common for inbound HTTP.</li>
</ul>

<h3>Distributed implementation: Redis + Lua</h3>
<pre><code class="language-lua">-- Atomic token bucket in Redis
-- KEYS[1] = bucket key
-- ARGV[1] = capacity
-- ARGV[2] = rate (tokens/sec)
-- ARGV[3] = now (ms)
local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local capacity = tonumber(ARGV[1])
local rate     = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])
local tokens = tonumber(data[1]) or capacity
local ts     = tonumber(data[2]) or now
tokens = math.min(capacity, tokens + (now - ts) / 1000 * rate)
local allowed = tokens &gt;= 1
if allowed then tokens = tokens - 1 end
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], 60000)
return { allowed and 1 or 0, tokens }
</code></pre>
<p>Run via <code>EVAL</code> or <code>EVALSHA</code>. Atomic + cheap. Or use <strong>Redis-Cell</strong> module for production-grade <code>CL.THROTTLE</code>.</p>

<h3>The standard rate-limit headers</h3>
<pre><code class="language-http">HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 47
RateLimit-Reset: 30
</code></pre>
<p>(RFC draft; older <code>X-RateLimit-*</code> still common.)</p>
<pre><code class="language-http">HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 18
Retry-After: 18
</code></pre>
<ul>
  <li><code>RateLimit-Reset</code> can be seconds-until or a Unix timestamp; pick one and document.</li>
  <li><code>Retry-After</code> can be seconds or HTTP date; pick the simpler one.</li>
</ul>

<h3>Where to enforce</h3>
<table>
  <thead><tr><th>Layer</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>CDN edge (Cloudflare, Fastly)</td><td>Cheap, fast, blocks before origin reached</td><td>Limited per-tenant logic; usually IP-based</td></tr>
    <tr><td>API gateway (AWS API GW, Kong, Tyk, Envoy)</td><td>Per-key, per-route limits; rich rules</td><td>Adds ms latency; another moving part</td></tr>
    <tr><td>Service middleware</td><td>Business-aware (e.g., per-tenant, per-feature)</td><td>Each service re-implements</td></tr>
    <tr><td>Database / queue</td><td>Last-resort backstop (e.g., DB connection pool)</td><td>Doesn't help upstream</td></tr>
  </tbody>
</table>
<p>Senior pattern: <strong>defense in depth</strong>. CDN absorbs floods, gateway enforces per-key, service enforces business limits.</p>

<h3>Identifying the limited entity</h3>
<table>
  <thead><tr><th>Key</th><th>Use when</th><th>Watch out for</th></tr></thead>
  <tbody>
    <tr><td>IP address</td><td>Anonymous traffic; abuse mitigation</td><td>Office NATs, mobile carriers, IPv6 — multiple users one IP</td></tr>
    <tr><td>API key / token</td><td>Authenticated B2B</td><td>Stolen keys; rotate policy</td></tr>
    <tr><td>User ID</td><td>Per-user fairness</td><td>Bots that share creds</td></tr>
    <tr><td>Tenant / org ID</td><td>Per-customer billing</td><td>Hot tenants — provision higher limits</td></tr>
    <tr><td>Endpoint / route</td><td>Per-route smoothing (e.g., <code>POST /signup</code> stricter)</td><td>Don't double-count globally</td></tr>
  </tbody>
</table>
<p>Best practice: <em>combine</em>. e.g., per-(api_key, endpoint) bucket plus a global per-key cap.</p>

<h3>Rate limit vs quota</h3>
<table>
  <thead><tr><th>Concept</th><th>Window</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>Rate limit</td><td>Seconds–minutes</td><td>Smoothing; prevent spikes</td></tr>
    <tr><td>Quota</td><td>Day / month</td><td>Billing / fair use; long-window cap</td></tr>
  </tbody>
</table>
<p>Most production APIs need both. "100 req/sec but no more than 1M/day" is a common shape.</p>

<h3>Cost-based throttling</h3>
<p>Not all requests are equal. A search query that scans 10M rows is much more expensive than reading one user. Mature APIs assign <em>cost</em> per request and bucket against cost, not just count:</p>
<pre><code class="language-text">cost = base_cost + per_field_count + scan_size_estimate
allow if bucket.tokens &gt;= cost
</code></pre>
<p>GraphQL APIs do this with per-field complexity weights. Stripe and Shopify both use cost-based limits.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Versioning a breaking field rename</h3>
<p>Goal: rename <code>full_name</code> → <code>name</code> on User without breaking clients.</p>
<ol>
  <li><strong>Add</strong> <code>name</code> alongside <code>full_name</code>; both populated from the same source.</li>
  <li><strong>Document</strong>: changelog entry, partner email, dev portal banner.</li>
  <li><strong>Mark</strong> <code>full_name</code> deprecated in OpenAPI / SDL with a deprecation message.</li>
  <li><strong>Telemetry</strong>: log per-client usage of <code>full_name</code>; nudge top consumers.</li>
  <li><strong>Sunset</strong>: after 6 months (or zero usage), remove <code>full_name</code>; old clients get <code>null</code> or 410 depending on strategy.</li>
</ol>
<pre><code class="language-http">GET /v1/users/42

→ 200 OK
  Deprecation: true
  Sunset: Wed, 31 Dec 2026 00:00:00 GMT
  Content-Type: application/json

  {
    "id": 42,
    "name": "Prakhar",
    "full_name": "Prakhar"   // deprecated, use 'name'
  }
</code></pre>

<h3>Example 2: Cutting a /v2 (when additive isn't enough)</h3>
<p>Goal: pagination shape changing from offset/limit to cursor.</p>
<ol>
  <li>Spin up <code>/v2</code> with the new shape; <code>/v1</code> stays as-is.</li>
  <li>Both implementations share most code; only the controller / serializer differ.</li>
  <li>SDKs publish a new major version pointing at <code>/v2</code>.</li>
  <li>Telemetry per route + version; nudge high-traffic <code>/v1</code> consumers.</li>
  <li><code>/v1</code> sunset after announced window; eventually returns <code>410 Gone</code> with a <code>Link: rel="successor-version"</code>.</li>
</ol>

<h3>Example 3: Stripe-style date-versioned API</h3>
<p>Each API key is pinned at signup to a date; server stores a list of "compat shims" that transform requests/responses across versions.</p>
<pre><code class="language-typescript">type Shim = {
  from: string; to: string;
  upRequest: (req: Req) =&gt; Req;
  downResponse: (res: Res) =&gt; Res;
};

const shims: Shim[] = [
  {
    from: '2024-09-01', to: '2024-12-01',
    upRequest:    (req) =&gt; req,
    downResponse: (res) =&gt; ({ ...res, full_name: res.name }), // re-add removed field
  },
];

function handle(req: Req, key: { version: string }) {
  let r = req;
  for (const s of shimsAfter(key.version)) r = s.upRequest(r);
  let res = await pipeline(r);
  for (const s of shimsAfter(key.version).reverse()) res = s.downResponse(res);
  return res;
}
</code></pre>
<p>Wins: every customer chooses when to upgrade. Costs: each shim is permanent code with its own tests; shim count grows slowly forever.</p>

<h3>Example 4: Token bucket per (api_key, endpoint)</h3>
<pre><code class="language-typescript">// Express middleware using Redis Cell
import { createClient } from 'redis';

const redis = createClient();

export function rateLimit({ rate, capacity }: { rate: number; capacity: number }) {
  return async (req, res, next) =&gt; {
    const key = \`rl:\${req.apiKey}:\${req.route.path}\`;
    const [allowed, total, remaining, retryAfter, resetAfter] =
      await redis.sendCommand(['CL.THROTTLE', key, capacity - 1, rate, 60, 1]);

    res.setHeader('RateLimit-Limit', total);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetAfter);

    if (allowed === 1) {
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        type: 'https://example.com/errors/rate-limit',
        title: 'Too Many Requests',
        retryAfterSeconds: retryAfter,
      });
    }
    next();
  };
}

app.post('/users', rateLimit({ rate: 5, capacity: 20 }), createUser);
</code></pre>

<h3>Example 5: Tiered limits for free / paid tiers</h3>
<pre><code class="language-typescript">const TIER_LIMITS = {
  anonymous: { rate: 1,  capacity: 5  },
  free:      { rate: 5,  capacity: 25 },
  pro:       { rate: 50, capacity: 200 },
  enterprise:{ rate: 500, capacity: 2000 },
};

function pickLimit(req) {
  if (!req.user) return TIER_LIMITS.anonymous;
  return TIER_LIMITS[req.user.tier] ?? TIER_LIMITS.free;
}

app.use(async (req, res, next) =&gt; {
  const limit = pickLimit(req);
  await rateLimit(limit)(req, res, next);
});
</code></pre>

<h3>Example 6: Client-side respectful retry</h3>
<pre><code class="language-typescript">async function callWithRetry(fn: () =&gt; Promise&lt;Response&gt;, max = 3) {
  for (let attempt = 0; attempt &lt; max; attempt++) {
    const res = await fn();
    if (res.status !== 429 &amp;&amp; res.status &lt; 500) return res;
    if (attempt === max - 1) return res;
    const ra = parseInt(res.headers.get('Retry-After') ?? '0', 10) * 1000;
    const exp = Math.min(30_000, 500 * 2 ** attempt);
    const jitter = Math.random() * exp * 0.3;
    await new Promise(r =&gt; setTimeout(r, ra || (exp + jitter)));
  }
}
</code></pre>

<h3>Example 7: Cost-based limit for an expensive search endpoint</h3>
<pre><code class="language-typescript">async function searchHandler(req, res) {
  const cost = computeCost(req.body); // base + filters + sort + facets
  if (cost &gt; 50) return res.status(400).json({ error: 'Query too expensive; refine filters' });
  const allowed = await bucket.consume(req.apiKey, cost);
  if (!allowed) return res.status(429).end();
  return doSearch(req.body).then(json =&gt; res.json(json));
}
</code></pre>

<h3>Example 8: Daily quota on top of per-second limit</h3>
<pre><code class="language-typescript">// Two layers
const persecond = rateLimit({ rate: 10, capacity: 50 });
const daily     = quotaLimit({ ceiling: 100_000, period: 'day' });

app.use('/api', persecond, daily);
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Versioning edges</h3>
<ul>
  <li><strong>Mobile stragglers:</strong> 1–5% of users on app versions older than 12 months. Hard to force-upgrade. Plan minimum-supported-version policy and "minimum app version" responses (<code>426 Upgrade Required</code> + deep link to store).</li>
  <li><strong>Cached responses across version cuts:</strong> CDN may have <code>/v1</code> responses cached. Bump cache-key, send <code>Vary: API-Version</code>, or include version in URL.</li>
  <li><strong>SDK lag:</strong> server v2 ships, but Swift/Kotlin SDK v2 ships 2 weeks later. Don't deprecate v1 endpoints until SDK has migrated.</li>
  <li><strong>OAuth scopes:</strong> new versions sometimes require new scopes — handle backward-compat by inferring from old scopes during a grace window.</li>
  <li><strong>Documentation drift:</strong> v1 + v2 docs both must exist + be searchable. Version-pinned docs site or version selector in the portal.</li>
</ul>

<h3>"Additive" gotchas</h3>
<ul>
  <li><strong>Adding a required input field</strong> is breaking. Always add as optional with default; if the field is conceptually required, deprecate the call site or add a parallel mutation.</li>
  <li><strong>Adding an enum value</strong> may break clients that <code>switch</code> exhaustively without a default branch. Document policy: clients must handle unknown enum values.</li>
  <li><strong>Tightening validation</strong> (e.g., username length 50 → 30) is breaking. Communicate; phase in.</li>
  <li><strong>Rounding / display behaviour:</strong> Stripe famously broke clients by changing how cents were rounded in receipts. Behavioural changes matter as much as schema changes.</li>
</ul>

<h3>Deprecation gone wrong</h3>
<ul>
  <li><strong>Deprecation header without telemetry</strong> = you can't tell when usage is zero. Always log usage by client / version.</li>
  <li><strong>Sunset date too aggressive</strong> = customer outage. Default conservative, accelerate if telemetry shows quick migration.</li>
  <li><strong>Sunset date too lax</strong> = old code lives forever, server complexity grows. Have a written policy ("Stripe's max 12 months").</li>
</ul>

<h3>Rate-limiting edges</h3>
<ul>
  <li><strong>Clock skew across instances:</strong> distributed counters drift if instance clocks diverge. Use Redis time, not local time, in distributed limiters.</li>
  <li><strong>Hot keys:</strong> one tenant doing 90% of traffic = Redis hot key. Shard by hash; pre-warm replicas.</li>
  <li><strong>Burst at boundary:</strong> fixed window allows 2× LIMIT in 2 windows; sliding window solves it. Use sliding by default.</li>
  <li><strong>Cold start:</strong> new container = empty bucket = unlimited burst until refill. Either pre-populate or use Redis-shared state.</li>
  <li><strong>Background workers</strong> using same API key as user actions can starve user requests. Separate keys; separate limits.</li>
</ul>

<h3>Identifier edges</h3>
<ul>
  <li><strong>IPv4 vs IPv6:</strong> v4 has tight pool (~office shares one IP); v6 has billions per device. Limit by /64 prefix for IPv6.</li>
  <li><strong>Office NATs:</strong> one company = one IP; limiting by IP punishes everyone. Combine with auth-key when available.</li>
  <li><strong>Mobile carrier-grade NAT:</strong> thousands of users share one IP. Definitely don't limit anonymous endpoints by IP alone.</li>
  <li><strong>Stolen API keys:</strong> attacker bursts the key's limit; legitimate user fails. Layer with user-account limits + anomaly detection.</li>
  <li><strong>Anonymous abuse:</strong> per-IP doesn't stop a botnet with 10k IPs. Layer with CAPTCHA, fingerprinting, behavioural signals.</li>
</ul>

<h3>Header edges</h3>
<ul>
  <li><strong>Missing headers:</strong> if client polls without checking, they hit limits surprised. Document the headers and SDK should expose them.</li>
  <li><strong><code>RateLimit-Reset</code> as Unix timestamp vs seconds:</strong> draft RFC says either; clients must support both. Pick one and document.</li>
  <li><strong>Different headers across endpoints:</strong> consistency matters. Pick a format org-wide.</li>
</ul>

<h3>Mobile / RN edges</h3>
<ul>
  <li><strong>Backoff with jitter is mandatory.</strong> Without jitter, 100k phones all retry at the same second after a failure.</li>
  <li><strong>Idempotency keys for retries:</strong> mobile retries are common; server must dedupe.</li>
  <li><strong>Offline queue:</strong> mutations while offline → queue → flush on reconnect with idempotency keys.</li>
  <li><strong>Foreground bursts:</strong> app foregrounds → fires 10 prefetches at once. Coalesce / sequence them; don't blow the bucket on cold start.</li>
  <li><strong>Push-triggered fetches:</strong> 1M users get a marketing push → all fetch at once. Server-side limit + client-side jitter on push handlers.</li>
</ul>

<h3>Observability edges</h3>
<ul>
  <li><strong>Track 429s by route, by client, by tier.</strong> Spike in 429s on /signup = abuse; spike on /search = legitimate growth.</li>
  <li><strong>Alert on "approaching limit"</strong> for premium customers — call them before they hit.</li>
  <li><strong>Distinguish soft vs hard limits</strong> in dashboards; "soft" = warned, "hard" = blocked.</li>
  <li><strong>Correlate version usage</strong> with changelog entries — sudden drop on v1 = deprecation working; sudden spike = a new bot adopted v1.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 10 most common versioning + rate-limit mistakes</h3>
<ol>
  <li><strong>No versioning policy on day one.</strong> First breaking change becomes a heroic migration.</li>
  <li><strong>Cutting <code>/v2</code> for non-breaking changes.</strong> Pollutes the URL space; clients fragment.</li>
  <li><strong>Removing fields without deprecation.</strong> Mobile clients on yesterday's build silently break.</li>
  <li><strong>No telemetry on deprecated fields.</strong> You don't know when it's safe to remove.</li>
  <li><strong>Single global rate limit.</strong> One bad client melts the API; legit traffic also throttled.</li>
  <li><strong>Limiting by IP only.</strong> Office NATs, carrier NAT, IPv6 mismatches — false positives + false negatives.</li>
  <li><strong>No headers on 429.</strong> Clients can't backoff intelligently; they hammer.</li>
  <li><strong>Hardcoded limits in app code.</strong> Tuning requires redeploy; can't react to incidents.</li>
  <li><strong>No jitter on client backoff.</strong> Thundering herd after every blip.</li>
  <li><strong>Treating quota as rate-limit.</strong> Users hit "1M/day" mid-afternoon and are dead until reset.</li>
</ol>

<h3>Anti-pattern: silent breaking change</h3>
<pre><code class="language-text">// BAD — old field removed; mobile clients crash
GET /users/42
{ "id": 42, "name": "Prakhar" }   // 'full_name' silently removed

// GOOD — keep both, deprecate the old, sunset on schedule
GET /users/42
{ "id": 42, "name": "Prakhar", "full_name": "Prakhar" }
Deprecation: true
Sunset: Wed, 31 Dec 2026 ...
</code></pre>

<h3>Anti-pattern: <code>/v1.1</code>, <code>/v1.2</code></h3>
<p>Don't increment minor versions in URLs. URI versions should reflect breaking changes only. For non-breaking, just ship.</p>

<h3>Anti-pattern: 200 OK + error body</h3>
<pre><code class="language-json">// BAD
HTTP/1.1 200 OK
{ "success": false, "error": "rate limit" }

// GOOD
HTTP/1.1 429 Too Many Requests
Retry-After: 30
{ "type": "...", "title": "Too Many Requests", "retryAfterSeconds": 30 }
</code></pre>

<h3>Anti-pattern: limit but no response headers</h3>
<p>Server enforces 100/min but doesn't send <code>RateLimit-*</code> headers. Clients can't know they're at 99/100; they hit 100 mid-request and the next one fails. Always emit headers.</p>

<h3>Anti-pattern: cargo-culted "Retry-After: 60"</h3>
<p>Always returning 60 regardless of actual reset time. Clients sleep too long or too short. Compute the real value from the bucket state.</p>

<h3>Anti-pattern: per-endpoint limit with no global cap</h3>
<p>10 endpoints × 100/sec each = 1000/sec total per key. One client can flood even though no single route exceeds. Layer per-endpoint <em>and</em> global per-key.</p>

<h3>Anti-pattern: leaving deprecated fields forever</h3>
<p>Server complexity grows linearly with shims; tests cover them; bugs hide in them. Have a written sunset policy and execute on it.</p>

<h3>Anti-pattern: no client SDK retry / backoff</h3>
<p>SDK fires the next request immediately on 429. Server stays melted. SDKs should respect <code>Retry-After</code>, jitter, and stop after N attempts.</p>

<h3>Anti-pattern: Lua script with race conditions</h3>
<pre><code class="language-typescript">// BAD — read + write in two commands; concurrent burst gets through
const tokens = await redis.get(key);
if (tokens &gt; 0) await redis.set(key, tokens - 1);

// GOOD — atomic Lua script
await redis.eval(BUCKET_LUA, 1, key, capacity, rate, now);
</code></pre>

<h3>Anti-pattern: not versioning rate limits themselves</h3>
<p>Rate limit values are part of the contract. Tightening "100/sec" to "50/sec" silently breaks clients that designed for headroom. Communicate, phase in, monitor.</p>

<h3>Anti-pattern: no tiered limits</h3>
<p>Free, paid, and enterprise customers all share one limit. Premium buyers pay for higher limits; free should be much lower. Tiered fairness is table stakes.</p>

<h3>Anti-pattern: limit without cost</h3>
<p>Counting requests when one search costs 100x another. Cost-based limits scale fairly; raw count doesn't.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common versioning + rate-limiting prompts</h3>
<ol>
  <li>Design a versioning strategy for a public REST API.</li>
  <li>Design a rate limiter for a global API platform.</li>
  <li>Compare token bucket vs sliding window for use case X.</li>
  <li>How would you prevent one user from monopolising a shared API?</li>
  <li>Plan a deprecation cycle for a breaking change.</li>
  <li>Handle rate limits across mobile + web + partners.</li>
  <li>How would you migrate from offset to cursor pagination?</li>
  <li>Design a daily quota + per-second limit together.</li>
</ol>

<h3>The 5-step framework</h3>
<ol>
  <li><strong>Clarify:</strong> who are the consumers? What's the change? What's the cost of breaking them?</li>
  <li><strong>Versioning:</strong> URI / header / date-based; additive vs major bump; deprecation cycle; sunset window.</li>
  <li><strong>Rate-limit algorithm:</strong> pick token bucket by default; cost-based for expensive endpoints; tiers for free / paid / enterprise.</li>
  <li><strong>Where to enforce:</strong> CDN + gateway + service; layered defense.</li>
  <li><strong>Operability:</strong> headers, telemetry, alerts, dashboards, SDK retry conventions.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"URI versioning by default — visible in logs, easy to test, easy to route. Stripe-style date versioning when changes are frequent and partner upgrade cycles are slow."</em></li>
  <li><em>"Additive evolution — never remove without deprecation. Track per-client usage; sunset only when telemetry shows zero."</em></li>
  <li><em>"Token bucket because it's burst-tolerant and intuitive. Sliding window when accuracy matters; sliding log when bursts must be precise."</em></li>
  <li><em>"Layered limits: CDN absorbs floods, gateway enforces per-key, service enforces business rules."</em></li>
  <li><em>"Tiered limits — free 5/sec, paid 50/sec, enterprise 500/sec — at the gateway with overrides."</em></li>
  <li><em>"Cost-based limit for search — refining filters costs less than full-text scan."</em></li>
  <li><em>"Headers on every response so SDKs can backoff intelligently before they hit 429."</em></li>
  <li><em>"Mobile clients respect <code>Retry-After</code>, jitter retries, and queue mutations offline with idempotency keys."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"don't break clients"</td><td>Additive evolution + deprecation cycle</td></tr>
    <tr><td>"public API", "partners"</td><td>URI versioning + 6–12mo sunset window</td></tr>
    <tr><td>"frequent breaking changes"</td><td>Stripe-style date versioning</td></tr>
    <tr><td>"prevent abuse"</td><td>Token bucket + tiered limits + CAPTCHA fallback</td></tr>
    <tr><td>"fair share across tenants"</td><td>Per-tenant + per-endpoint bucket</td></tr>
    <tr><td>"one expensive call shouldn't blow the bucket"</td><td>Cost-based limit</td></tr>
    <tr><td>"monthly quota for billing"</td><td>Quota in addition to per-second limit</td></tr>
    <tr><td>"global scale"</td><td>Distributed Redis bucket + edge sharding</td></tr>
    <tr><td>"mobile retries"</td><td>Idempotency keys + exponential backoff with jitter</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard)</h3>
<ol>
  <li>State the scope: who consumes, what's the change, what's the cost of breaking.</li>
  <li>Pick a versioning strategy + show a deprecation timeline (months on x-axis).</li>
  <li>Sketch the rate-limit pipeline: client → CDN → gateway → service → DB.</li>
  <li>Annotate each layer with what it enforces.</li>
  <li>Show one Redis Lua bucket implementation.</li>
  <li>Show response headers + 429 example.</li>
  <li>Talk through edge cases: hot keys, burst, mobile, IPv6, fail-open vs fail-closed.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Per-version usage telemetry to drive deprecation decisions."</em></li>
  <li><em>"Automated email nudges to top consumers of deprecated fields."</em></li>
  <li><em>"Stripe-style date versioning with shim chain — every key pinned at signup."</em></li>
  <li><em>"Cost-based limits with per-field weights tuned on real traffic."</em></li>
  <li><em>"Anomaly detection on 429s — distinguish 'usage growth' from 'abuse'."</em></li>
  <li><em>"Per-tenant overrides for enterprise customers via admin API."</em></li>
  <li><em>"Edge-deployed limits via Cloudflare Workers / Lambda@Edge before hitting origin."</em></li>
  <li><em>"SDK conventions for backoff with jitter; idempotency-key generation."</em></li>
  <li><em>"Status page tied to rate-limit incidents — communicate when global limits change."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Versioning maturity</td><td>Names policy + deprecation + telemetry, not just <code>/v1</code></td></tr>
    <tr><td>Algorithm fluency</td><td>Picks token bucket by default; knows when to deviate</td></tr>
    <tr><td>Layering</td><td>Defense in depth — CDN, gateway, service</td></tr>
    <tr><td>Identity choice</td><td>Combines IP + key + tenant; aware of NAT pitfalls</td></tr>
    <tr><td>Quota awareness</td><td>Distinguishes per-second from per-day</td></tr>
    <tr><td>Header hygiene</td><td>Standard headers + 429 + Retry-After</td></tr>
    <tr><td>Mobile empathy</td><td>Idempotency keys, jitter, offline queue</td></tr>
    <tr><td>Operability</td><td>Telemetry, alerts, dashboards, runbooks</td></tr>
    <tr><td>Restraint</td><td>Doesn't cut <code>/v2</code> for non-breaking changes</td></tr>
    <tr><td>Communication</td><td>Names tradeoffs; asks about scope</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>App versions linger on devices for a year+. Server must support old shapes far longer than backend teams want.</li>
  <li>Force-upgrade is a product decision (spend goodwill); minimum-supported-version policy is mandatory.</li>
  <li><code>426 Upgrade Required</code> + a deep link to the App Store / Play Store on outdated builds.</li>
  <li>Per-device API key or token is good for fairness; rotate on logout.</li>
  <li>Background fetch + push spike handlers must jitter their requests; without jitter, 1M phones all hit /sync at the same second.</li>
  <li>Offline mutation queue + idempotency keys: server dedupes retries safely.</li>
  <li>Track app-version-specific 429 rates — suspicious spike = bug in that build.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How do you handle a large enterprise customer that legitimately exceeds limits?"</em> — Per-tenant overrides via admin API; communicate; consider dedicated tier.</li>
  <li><em>"What if Redis is down?"</em> — Decide fail-open vs fail-closed per route. Auth endpoints fail-closed; analytics fail-open. Always alert.</li>
  <li><em>"How do you migrate clients from <code>/v1</code> to <code>/v2</code> without their cooperation?"</em> — You don't. You communicate, deprecate, sunset on a schedule, and accept some attrition.</li>
  <li><em>"How do you cost-weight an endpoint?"</em> — Sample real traffic; correlate with DB cost / cache miss rate; assign weights; tune over time.</li>
  <li><em>"How do you prevent thundering herd after a server restart?"</em> — Pre-warm caches, ramp traffic via load balancer slow-start, jitter client retries, edge rate limits absorb early floods.</li>
  <li><em>"How do you communicate a rate limit change to all customers?"</em> — Status page + email + portal banner + observability dashboards. Roll out per-tier; never global at once.</li>
  <li><em>"What's the difference between rate limit, quota, and concurrency limit?"</em> — Rate = per-time, quota = ceiling per period, concurrency = max in-flight at once. All three matter for protection.</li>
</ul>

<h3>"What I'd do day one prepping versioning + rate-limiting"</h3>
<ul>
  <li>Read Stripe's API versioning blog posts.</li>
  <li>Read the IETF draft on <code>RateLimit-*</code> headers.</li>
  <li>Implement token bucket + sliding window in Redis Lua; benchmark each.</li>
  <li>Build a tiny gateway with tiered limits + per-route overrides.</li>
  <li>Design a deprecation timeline for one breaking change end to end.</li>
  <li>Memorise the breaking-change matrix.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read Cloudflare's blog on edge rate-limit architecture."</li>
  <li>"Compare how Stripe vs GitHub vs Twilio version their APIs — three working models."</li>
  <li>"Read the Redis Cell module source — small, instructive."</li>
  <li>"Build a tiny CLI that consumes rate-limit headers and visualises the bucket draining."</li>
</ul>

<h3>API Design module summary</h3>
<p>The complete API Design module covers:</p>
<ul>
  <li><strong>REST Principles</strong> — verbs, status codes, idempotency, caching, pagination, errors.</li>
  <li><strong>GraphQL Schema Design</strong> — types, resolvers, DataLoader, Relay connections, federation, evolution by deprecation.</li>
  <li><strong>tRPC / Type-Safe APIs</strong> — end-to-end TS, procedures, middleware, when it fits and when it doesn't.</li>
  <li><strong>Realtime Decision Tree</strong> — polling, SSE, WebSocket, WebRTC, push; pub/sub fanout; mobile background reality.</li>
  <li><strong>Versioning &amp; Rate Limiting</strong> (this topic) — additive evolution, deprecation cycle, token bucket, layered enforcement.</li>
</ul>
<p>5 topics. Together they cover ~95% of API-design interview questions across REST, RPC, real-time, and operational concerns.</p>
`
    }
  ]
});
