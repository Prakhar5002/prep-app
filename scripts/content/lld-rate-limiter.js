window.PREP_SITE.registerTopic({
  id: "lld-rate-limiter",
  module: "lld",
  title: "Case: Rate Limiter",
  estimatedReadTime: "45 min",
  tags: ["lld","rate-limiter","token-bucket","leaky-bucket","sliding-window","strategy","template-method","redis","lua","typescript","concurrency"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">A rate limiter answers <em>"may this key do this now?"</em> as a <strong>per-key state machine</strong> — <em>advance to now → decide → consume if allowed</em> — with interchangeable algorithms as Strategies, made atomic by synchronous code in one process or by a <strong>Lua script</strong> in Redis.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Keys:</strong> user, API key, IP, tenant, or "everyone" (global); by user or API key when authenticated; per-IP only as a generous backstop (offices share IPs); set <code>trust proxy</code> to the real hop count.</li>
    <li><strong>Token bucket</strong> (default): <code>tokens = min(C, tokens + elapsed × r)</code>, refilled lazily from elapsed time (no timers); capacity = burst, rate = sustained; retry after <code>(cost − tokens) / r</code>.</li>
    <li><strong>Leaky bucket</strong>: as a meter it's token bucket mirrored; as a <em>queue</em> it shapes traffic (outbound calls).</li>
    <li><strong>Fixed window</strong>: cheapest, but up to 2× bursts at boundaries and synchronised resets.</li>
    <li><strong>Sliding log</strong>: exact, O(limit) memory per key, so use it for small, security-relevant limits; in Redis it's a sorted set (<code>ZREMRANGEBYSCORE</code>/<code>ZCARD</code>/<code>ZADD</code>, unique members).</li>
    <li><strong>Sliding counter</strong>: <code>prev × (1 − elapsed/W) + curr</code>, 3 numbers, O(1), slightly approximate.</li>
    <li><strong>Design:</strong> <code>RateLimitAlgorithm</code> Strategy + <code>KeyedAlgorithm</code> Template Method (create / advance / decide / consume / isFresh; base owns per-key state, memory bound, validation) + Factory over a discriminated union with a <code>never</code> check + Express Adapter.</li>
    <li><strong>Return a <code>Decision</code></strong> (allowed, remaining, retryAfterMs, resetMs), not a boolean → 429 Too Many Requests + <code>Retry-After</code> + <code>RateLimit-*</code> headers.</li>
    <li><strong>Multiple rules</strong> (per-user, per-IP, global): peek all, then consume all, so a denial costs nothing; report the longest retry or the smallest remaining.</li>
    <li><strong>Node concurrency:</strong> sync check-and-consume is atomic; <code>GET</code> → <code>await</code> → <code>SET</code> against Redis is a race, so use <code>INCR</code> or Lua.</li>
    <li><strong>Distributed:</strong> Lua with Redis <code>TIME</code> (no clock skew), <code>PEXPIRE</code> = time-to-full, integer returns, hash tags for multi-key in Cluster, fail open/closed per rule with a timeout and an alert.</li>
    <li><strong>Memory:</strong> O(1) algorithms, sweep fresh states, <code>maxKeys</code> LRU cap, IPv6 by <code>/64</code>.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Thinking single-threaded Node makes a Redis-backed limiter safe.</strong> <code>const n = await redis.get(k); if (n &lt; limit) await redis.set(k, n + 1)</code> lets concurrent requests all read the same value and all pass, because the <code>await</code> yields to other requests. The check and the update must be one atomic server-side step: <code>INCR</code>, or a Lua script for anything with logic.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I default to a token bucket: capacity is the burst, the refill rate is the sustained limit, and I refill lazily from elapsed time, so there are no timers."</div>
  <div class="revision-say">"Every algorithm is a Strategy with the same advance–decide–consume shape, so peek is free and a multi-rule check can ask every rule before charging any of them."</div>
  <div class="revision-say">"In one Node process the check is atomic because it never awaits; across pods I move the algorithm into a Redis Lua script and use Redis's clock, not each pod's."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Why rate limit at all</h3>
<ul>
  <li><strong>Protect capacity:</strong> one runaway client (a retry loop in a mobile app, a customer's cron job) shouldn't take the API down for everyone.</li>
  <li><strong>Fairness between tenants:</strong> in a multi-tenant SaaS, tenant A's bulk import must not starve tenant B's interactive traffic.</li>
  <li><strong>Security:</strong> slow down credential stuffing and OTP brute force (<code>POST /login</code>: 5 tries per 15 minutes per account and per IP).</li>
  <li><strong>Cost control:</strong> every LLM call costs money; per-user quotas on an AI feature cap the bill.</li>
  <li><strong>Being a good client:</strong> third-party APIs (LLM providers, payment gateways, a customer's legacy system) enforce their own limits — you need an <em>outbound</em> limiter so you don't get 429s yourself (Example 3).</li>
</ul>

<h3>Related controls — don't mix them up</h3>
<table>
  <thead><tr><th>Control</th><th>Question it answers</th><th>Typical response</th></tr></thead>
  <tbody>
    <tr><td><strong>Rate limiting (policing)</strong></td><td>Too many requests per unit of time from this key?</td><td>Reject with 429</td></tr>
    <tr><td><strong>Throttling / shaping</strong></td><td>Same, but smooth instead of reject</td><td>Delay / queue the request</td></tr>
    <tr><td><strong>Quota</strong></td><td>Too much in the billing period (per day / month)?</td><td>403 or 429 until the period resets</td></tr>
    <tr><td><strong>Concurrency limit</strong></td><td>Too many requests <em>in flight</em> right now?</td><td>Reject or queue</td></tr>
    <tr><td><strong>Load shedding</strong></td><td>Is the <em>server</em> overloaded, whoever is calling?</td><td>503, drop low-priority traffic</td></tr>
    <tr><td><strong>Circuit breaker</strong></td><td>Is a <em>dependency</em> failing?</td><td>Fail fast without calling it</td></tr>
  </tbody>
</table>
<p>The last three are covered in <a href="#/topic/be-resilience">Resilience</a>; status codes and headers in <a href="#/topic/api-rest">REST Principles</a>.</p>

<h3>Where the limiter lives</h3>
<ul>
  <li><strong>Edge / gateway:</strong> CDN or WAF rules, AWS API Gateway throttling and usage plans (<a href="#/topic/cloud-api-gateway">API Gateway</a>). Coarse and cheap; knows the IP and API key, rarely the user.</li>
  <li><strong>Service middleware:</strong> knows the authenticated user, tenant, plan and route. This is what the LLD round asks you to build.</li>
  <li><strong>Outbound client:</strong> wraps calls to a rate-limited dependency.</li>
  <li><strong>Mobile / web client:</strong> debounce and throttle for UX only. <strong>Never a security control</strong>: anyone can call your API with curl.</li>
</ul>

<h3>The algorithms at a glance</h3>
<table>
  <thead><tr><th>Algorithm</th><th>State per key</th><th>Bursts</th><th>Accuracy</th><th>Known uses (check current docs)</th></tr></thead>
  <tbody>
    <tr><td>Token bucket</td><td>2 numbers</td><td>Yes, up to capacity</td><td>Exact for its model</td><td>AWS API Gateway throttling (rate + burst), Stripe's API limiter</td></tr>
    <tr><td>Leaky bucket (meter)</td><td>2 numbers</td><td>Up to capacity</td><td>Exact; mirror of token bucket</td><td>NGINX <code>limit_req</code> ("leaky bucket" in its docs)</td></tr>
    <tr><td>Fixed window counter</td><td>2 numbers</td><td>Up to 2× at boundaries</td><td>Coarse</td><td>Simple quotas, <code>INCR</code> + expiry in Redis</td></tr>
    <tr><td>Sliding window log</td><td>O(limit) timestamps</td><td>No</td><td>Exact</td><td>Low limits: login attempts, OTP sends</td></tr>
    <tr><td>Sliding window counter</td><td>3 numbers</td><td>Small</td><td>Approximate (assumes even spread)</td><td>Cloudflare has described this approximation for its edge rate limiting</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Token bucket — a bucket of permits</h3>
<div class="diagram"><pre>
        refill: r tokens/sec (computed lazily from elapsed time)
                       │
                       ▼
               ┌───────────────┐
               │ ● ● ● ● ●     │  capacity C = max burst
               │ ● ● ●         │  tokens now = 8
               └───────┬───────┘
                       │ each request takes "cost" tokens
                       ▼
     tokens &gt;= cost ? allow, tokens -= cost : deny, retry after (cost - tokens) / r
</pre></div>
<p>Two knobs, two meanings: <strong>capacity = how bursty</strong>, <strong>rate = sustained throughput</strong>. "100 per minute with bursts of 20" is <code>capacity 20, rate 100/60 per second</code>.</p>

<h3>Leaky bucket — same maths, sign flipped</h3>
<p>As a <em>meter</em>, each request pours <code>cost</code> into a bucket that drains at a fixed rate; overflow means reject. Level = capacity − tokens, so it's equivalent to a token bucket that starts full. The leaky bucket only behaves differently as a <em>queue</em>: requests wait and leave at a steady rate (shaping, not policing) — that's Example 3.</p>

<h3>Fixed window — and its boundary problem</h3>
<div class="diagram"><pre>
 limit = 100 per minute, windows aligned to the clock

  window [0:00 – 1:00)              window [1:00 – 2:00)
 ├──────────────────────────────┼──────────────────────────────┤
                         ▲▲▲▲▲▲▲ ▲▲▲▲▲▲▲
                    100 requests │ 100 requests
                    at 0:59      │ at 1:00
                                 │
            200 requests in ~1 second — each window says "fine"
</pre></div>

<h3>Sliding window counter — weight the previous window</h3>
<div class="diagram"><pre>
 limit 100/min      previous window: 80       current window: 30 so far
                  ├──────────────────────┼──────────────────────┤
                             ◄──────── sliding 60 s ────────►
                                         ▲ now = 15 s into current window

 estimate = prev × (1 − elapsed / window) + curr
          = 80   × (1 − 15/60)            + 30   = 60 + 30 = 90   → 10 more allowed
</pre></div>
<p>It assumes the previous window's requests were spread evenly. If they were all bunched at its end, the estimate is too low, so it can slightly over-admit. That error is usually acceptable for API limits, but not for "exactly 5 login attempts".</p>

<h3>The shape every algorithm shares</h3>
<p>Every algorithm is the same four moves: <strong>advance</strong> the key's state to <em>now</em> (refill, roll the window, prune old entries), <strong>decide</strong> without mutating, <strong>consume</strong> only if allowed, and <strong>forget</strong> the key once its state is back to fresh. Split this way, <code>peek</code> is just advance + decide, and a multi-rule check can ask every rule before charging any of them. That split is the design insight of this case.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>We walk the seven steps from <a href="#/topic/lld-framework">LLD Interview Framework</a>, naming each one aloud as we go.</p>

<h3>Step 1: Requirements (functional + non-functional)</h3>
<p><strong>Clarifying questions</strong> (pick the 4 that matter):</p>
<ul>
  <li>What's the key: user, API key, IP, tenant, route, or a combination? Several rules at once?</li>
  <li>Are bursts OK? (Yes → token bucket. Must be exact → sliding log.)</li>
  <li>One process or many? (Many → shared state, i.e. Redis.)</li>
  <li>On limit: reject (429), or queue and delay?</li>
  <li>Do requests have different costs (an LLM call costed in tokens, a bulk export)?</li>
</ul>
<table>
  <thead><tr><th>Functional</th><th>Non-functional</th></tr></thead>
  <tbody>
    <tr><td><code>check(request)</code> → allowed / remaining / retryAfter / reset</td><td>Low latency: microseconds in-process, about one Redis round trip when distributed</td></tr>
    <tr><td>Multiple rules per request; all must pass</td><td>Bounded memory per key, and bounded number of keys</td></tr>
    <tr><td>Configurable algorithm and limits per rule (route, plan)</td><td>Correct under concurrency, with no double-spend of tokens</td></tr>
    <tr><td>Weighted cost per request</td><td>Deliberate failure mode (fail open vs closed)</td></tr>
    <tr><td>429 + <code>Retry-After</code> + rate-limit headers</td><td>Testable with an injected clock; observable (allow/deny metrics per rule)</td></tr>
  </tbody>
</table>
<p><strong>Out of scope (say it):</strong> billing quotas, admin UI, dynamic config push. Distribution is a follow-up in step 7.</p>

<h3>Step 2: Entities &amp; relationships</h3>
<ul>
  <li><strong><code>RateLimiter</code></strong> — façade; evaluates every applicable <code>Rule</code> for a request; implements the async <code>Limiter</code> interface.</li>
  <li><strong><code>Rule</code></strong> — data: id, <code>appliesTo(ctx)</code>, key extractor, optional cost, and <em>has one</em> algorithm.</li>
  <li><strong><code>RateLimitAlgorithm</code></strong> — the <strong>Strategy</strong> interface (<code>peek</code>, <code>tryAcquire</code>, <code>sweep</code>).</li>
  <li><strong><code>KeyedAlgorithm&lt;S&gt;</code></strong> — abstract <strong>Template Method</strong> base: per-key state map, memory bound, validation, step order. Five subclasses supply only the maths.</li>
  <li><strong><code>createAlgorithm(config)</code></strong> — <strong>Factory</strong> over a discriminated union. <strong><code>Decision</code>/<code>Verdict</code></strong> — value objects. <strong><code>Clock</code></strong> — injected. <strong><code>rateLimit()</code></strong> — Express <strong>Adapter</strong>.</li>
</ul>

<h3>Step 3: Class diagram (ASCII)</h3>
<div class="diagram"><pre>
 rateLimit(limiter) ──uses──► «interface» Limiter
   (Express adapter)           + check(ctx): Promise&lt;Verdict&gt;
                                        △
                    ┌───────────────────┴───────────────────┐
                    │ implements                            │ implements (Example 2)
              RateLimiter                          RedisTokenBucket-backed limiter
  ------------------------------              (Lua script holds the algorithm)
  - rules: Rule[]          ◇──────┐
  - clock: Clock                  │ 1..*
  + check(ctx)                    ▼
  + startSweeper()              Rule
                     -----------------------------
                     + id: string
                     + appliesTo(ctx): boolean
                     + key(ctx): string | undefined
                     + cost?(ctx): number
                     + algorithm ──────────► «interface» RateLimitAlgorithm
                                              + limit: number
                                              + peek(key, cost, now): Decision
                                              + tryAcquire(key, cost, now): Decision
                                              + sweep(now): number
                                                        △
                                                        │ implements
                                          «abstract» KeyedAlgorithm&lt;S&gt;
                                    -----------------------------------------
                                    - states: Map&lt;string, S&gt;   (LRU-bounded)
                                    # create(now): S
                                    # advance(s, now)       ← refill / roll / prune
                                    # decide(s, cost, now)  ← pure
                                    # consume(s, cost, now)
                                    # isFresh(s): boolean
                                                        △  extends
       ┌───────────────┬───────────────┬────────────────┼──────────────────────┐
  TokenBucket     LeakyBucket     FixedWindow     SlidingWindowLog     SlidingWindowCounter
  {tokens,last}   {level,last}    {start,count}   {entries,head,used}  {start,curr,prev}

 ◇ aggregation (injected)   △ implements / extends   ──► association   # protected   - private   + public
</pre></div>

<h3>Step 4: Interfaces / APIs</h3>
<pre><code class="language-ts">export interface Clock {
  now(): number; // epoch ms
}
export const systemClock: Clock = { now: () =&gt; Date.now() };

/** Immutable answer to "may this request proceed?" */
export interface Decision {
  readonly allowed: boolean;
  readonly limit: number; // capacity of the rule that decided
  readonly remaining: number; // whole units left after this request
  readonly retryAfterMs: number; // 0 when allowed
  readonly resetMs: number; // ms until fully replenished
}

/** Strategy interface: every algorithm is interchangeable behind it. */
export interface RateLimitAlgorithm {
  readonly limit: number;
  peek(key: string, cost: number, now: number): Decision; // never consumes
  tryAcquire(key: string, cost: number, now: number): Decision; // check + consume, one sync step
  sweep(now: number): number; // forget idle keys
}

export interface RequestContext {
  readonly ip: string;
  readonly route: string; // e.g. 'POST /login'
  readonly userId?: string;
  readonly apiKey?: string;
}

export interface Rule {
  readonly id: string; // 'login:ip', 'api:user' — also namespaces the state keys
  readonly appliesTo: (ctx: RequestContext) =&gt; boolean;
  readonly key: (ctx: RequestContext) =&gt; string | undefined; // undefined = rule skipped
  readonly algorithm: RateLimitAlgorithm;
  readonly cost?: (ctx: RequestContext) =&gt; number;
}

export interface Verdict extends Decision {
  readonly ruleId: string | null; // which rule decided (null = no rule applied)
}

/** What callers depend on. Async so the backend can be in-process or Redis. */
export interface Limiter {
  check(ctx: RequestContext): Promise&lt;Verdict&gt;;
}</code></pre>
<p><strong>API decisions to say out loud:</strong></p>
<ul>
  <li><strong><code>now</code> is a parameter</strong> on the algorithm methods: they're deterministic functions of (state, cost, time), so they're trivial to test, and the façade reads the clock once per request so every rule sees the same instant.</li>
  <li><strong><code>Limiter.check</code> is async even though the in-memory one never awaits.</strong> The moment state moves to Redis, the call becomes I/O. Designing the caller-facing interface as async from day one means swapping backends doesn't ripple through the middleware.</li>
  <li><strong>Return a rich <code>Decision</code>, not a boolean:</strong> the HTTP layer needs <code>remaining</code>, <code>retryAfterMs</code> and <code>resetMs</code> for headers, and clients need <code>Retry-After</code> to back off properly.</li>
</ul>

<h3>Step 5: Core flows</h3>
<div class="diagram"><pre>
 HTTP request
     │
     ▼
 rateLimit middleware ── toContext(req) ──► RateLimiter.check(ctx)
                                                 │ now = clock.now()   (once)
                                                 ▼
                              applicable = rules.filter(appliesTo &amp;&amp; key(ctx) !== undefined)
                                                 │
                       ┌─────────────────────────┴─────────────────────────┐
                       ▼ PHASE 1: peek every rule (consumes nothing)         │
             any rule denies? ──yes──► return the deny with the LONGEST retryAfter
                       │ no                                                 │
                       ▼ PHASE 2: tryAcquire on every rule (same tick)      │
             return the allow with the SMALLEST remaining (for headers)    │
                                                 │
     ◄──────────────────────────────────────────┘
 allowed  → set RateLimit-* headers, next()
 denied   → 429 + Retry-After + JSON body
</pre></div>
<p><strong>Why two phases:</strong> with a per-user rule and a per-IP rule, a naive loop consumes the per-user token, then gets denied by the per-IP rule. The user paid for a request that never ran. Peeking first avoids it, and because both phases run synchronously in one tick, no other request can change state between them.</p>

<h3>Step 6: Code</h3>
<p>Order on the whiteboard: interfaces (step 4) → <code>KeyedAlgorithm</code> skeleton → <code>TokenBucket</code> (the one they'll ask about) → <code>RateLimiter</code> → one more algorithm if time allows. The full listing is Example 1 in the Examples section. <strong>Invariants</strong> to state before writing code:</p>
<ol>
  <li>A denied request never changes any rule's budget.</li>
  <li>Token bucket: <code>0 ≤ tokens ≤ capacity</code> after every call; windows: <code>used ≤ limit</code>.</li>
  <li><code>retryAfterMs</code> is honest: retrying after exactly that long succeeds if nothing else consumed budget meanwhile.</li>
  <li>Tracked keys never exceed <code>maxKeys</code>.</li>
</ol>
<p><strong>Complexity:</strong> token bucket, leaky bucket, fixed window and sliding counter are O(1) time and O(1) space per key. The sliding log is amortised O(1) per call but O(limit) memory per key, which is why it's reserved for small limits. <code>sweep</code> is O(tracked keys). The façade is O(rules) per request.</p>

<h3>Step 7: Extensibility &amp; concurrency</h3>
<table>
  <thead><tr><th>Change request</th><th>What you touch</th><th>Why it's cheap</th></tr></thead>
  <tbody>
    <tr><td>New algorithm (for example GCRA)</td><td>One new <code>KeyedAlgorithm</code> subclass + one factory case</td><td>Open/closed; the compiler flags the missing <code>switch</code> case via <code>never</code></td></tr>
    <tr><td>New dimension (per-tenant, per-route)</td><td>One new <code>Rule</code></td><td>Rules are data</td></tr>
    <tr><td>Plan tiers (free 60/min, pro 600/min)</td><td>A rule per tier with <code>appliesTo: ctx =&gt; plan(ctx) === 'pro'</code>, or a key that includes the plan</td><td>No algorithm change</td></tr>
    <tr><td>Weighted cost (LLM tokens)</td><td><code>rule.cost(ctx)</code></td><td>Every algorithm already takes <code>cost</code></td></tr>
    <tr><td>Shared state across pods</td><td>A new <code>Limiter</code> implementation backed by Redis + Lua</td><td>Middleware depends on the async <code>Limiter</code> interface</td></tr>
    <tr><td>Shaping instead of rejecting</td><td>A queue in front of a token bucket</td><td>Example 3</td></tr>
  </tbody>
</table>

<h4>Concurrency</h4>
<ul>
  <li><strong>One Node process:</strong> <code>tryAcquire</code> reads, decides and writes with no <code>await</code> in between, and the event loop never interleaves synchronous code, so it's atomic with no locks. <code>check</code> is <code>async</code> but never awaits, so it stays atomic (see <a href="#/topic/js-event-loop">Event Loop</a>). In Java you'd need per-key atomicity (<code>ConcurrentHashMap.compute</code>) or a library such as Bucket4j.</li>
  <li><strong>Many processes:</strong> each pod has its own <code>Map</code>, so 6 pods allow up to 6× the limit. Shared state goes to Redis, where read → compute → write must be one atomic server-side step (<code>INCR</code>, or a Lua script; Example 2).</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — The full in-process solution</h3>
<h4>1a. Template Method base + five Strategies + Factory</h4>
<pre><code class="language-ts">// rate-limiter/algorithms.ts   (Clock, Decision, RateLimitAlgorithm as in Step 4)

/** Template Method: owns per-key state, the memory bound, validation and the step order.
 *  Subclasses supply only the maths, as five small hooks. */
export abstract class KeyedAlgorithm&lt;S&gt; implements RateLimitAlgorithm {
  private readonly states = new Map&lt;string, S&gt;();

  protected constructor(readonly limit: number, private readonly maxKeys: number) {
    if (!(limit &gt; 0)) throw new RangeError('limit must be &gt; 0');
    if (!Number.isInteger(maxKeys) || maxKeys &lt; 1) throw new RangeError('maxKeys must be a positive integer');
  }

  protected abstract create(now: number): S;
  protected abstract advance(state: S, now: number): void; // refill / roll window / prune: time only
  protected abstract decide(state: S, cost: number, now: number): Decision; // pure: no mutation
  protected abstract consume(state: S, cost: number, now: number): void;
  protected abstract isFresh(state: S): boolean; // indistinguishable from create()? safe to forget

  peek(key: string, cost: number, now: number): Decision {
    this.validate(cost);
    const state = this.states.get(key) ?? this.create(now);
    this.advance(state, now);
    return this.decide(state, cost, now);
  }

  tryAcquire(key: string, cost: number, now: number): Decision {
    this.validate(cost);
    const state = this.load(key, now);
    this.advance(state, now);
    const decision = this.decide(state, cost, now);
    if (decision.allowed) this.consume(state, cost, now);
    return decision;
  }

  sweep(now: number): number {
    let dropped = 0;
    for (const [key, state] of this.states) { // deleting during Map iteration is safe in JS
      this.advance(state, now);
      if (this.isFresh(state) &amp;&amp; this.states.delete(key)) dropped++;
    }
    return dropped;
  }

  get trackedKeys(): number { return this.states.size; }

  private load(key: string, now: number): S {
    const state = this.states.get(key) ?? this.create(now);
    this.states.delete(key); // delete + re-insert: Map order becomes recency order (LRU)
    this.states.set(key, state);
    if (this.states.size &gt; this.maxKeys) {
      this.states.delete(this.states.keys().next().value as string); // evicted key restarts fresh
    }
    return state;
  }

  private validate(cost: number): void {
    if (!Number.isFinite(cost) || cost &lt;= 0) throw new RangeError('cost must be a positive finite number');
    if (cost &gt; this.limit) throw new RangeError('cost ' + cost + ' &gt; limit ' + this.limit + ': can never succeed');
  }
}

// ── Token bucket ────────────────────────────────────────────────
interface BucketState { tokens: number; last: number }

export class TokenBucket extends KeyedAlgorithm&lt;BucketState&gt; {
  /** capacity = max burst; refillPerSec = sustained rate */
  constructor(capacity: number, private readonly refillPerSec: number, maxKeys = 100_000) {
    super(capacity, maxKeys);
    if (!(refillPerSec &gt; 0)) throw new RangeError('refillPerSec must be &gt; 0');
  }

  protected create(now: number): BucketState {
    return { tokens: this.limit, last: now }; // start full: allows an initial burst
  }

  protected advance(s: BucketState, now: number): void {
    const elapsedMs = Math.max(0, now - s.last); // clock went backwards: no refill, no crash
    s.tokens = Math.min(this.limit, s.tokens + (elapsedMs * this.refillPerSec) / 1000);
    s.last = Math.max(s.last, now);
  }

  protected decide(s: BucketState, cost: number): Decision {
    const allowed = s.tokens &gt;= cost;
    const after = allowed ? s.tokens - cost : s.tokens;
    return {
      allowed, limit: this.limit, remaining: Math.floor(after),
      retryAfterMs: allowed ? 0 : this.msToEarn(cost - s.tokens),
      resetMs: this.msToEarn(this.limit - after),
    };
  }

  protected consume(s: BucketState, cost: number): void { s.tokens -= cost; }
  protected isFresh(s: BucketState): boolean { return s.tokens &gt;= this.limit; }
  private msToEarn(tokens: number): number { return Math.ceil((tokens * 1000) / this.refillPerSec); }
}

// ── Leaky bucket as a meter: pour cost in, drain at a fixed rate, overflow = reject ──
interface LeakState { level: number; last: number }

export class LeakyBucket extends KeyedAlgorithm&lt;LeakState&gt; {
  constructor(capacity: number, private readonly leakPerSec: number, maxKeys = 100_000) {
    super(capacity, maxKeys);
    if (!(leakPerSec &gt; 0)) throw new RangeError('leakPerSec must be &gt; 0');
  }

  protected create(now: number): LeakState { return { level: 0, last: now }; }

  protected advance(s: LeakState, now: number): void {
    s.level = Math.max(0, s.level - (Math.max(0, now - s.last) * this.leakPerSec) / 1000);
    s.last = Math.max(s.last, now);
  }

  protected decide(s: LeakState, cost: number): Decision {
    const allowed = s.level + cost &lt;= this.limit;
    const after = allowed ? s.level + cost : s.level;
    return {
      allowed, limit: this.limit, remaining: Math.floor(this.limit - after),
      retryAfterMs: allowed ? 0 : Math.ceil(((s.level + cost - this.limit) * 1000) / this.leakPerSec),
      resetMs: Math.ceil((after * 1000) / this.leakPerSec),
    };
  }

  protected consume(s: LeakState, cost: number): void { s.level += cost; }
  protected isFresh(s: LeakState): boolean { return s.level &lt;= 0; }
}

// ── Fixed window counter ────────────────────────────────────────
interface WindowState { start: number; count: number }

export class FixedWindow extends KeyedAlgorithm&lt;WindowState&gt; {
  constructor(limit: number, private readonly windowMs: number, maxKeys = 100_000) {
    super(limit, maxKeys);
    if (!(windowMs &gt; 0)) throw new RangeError('windowMs must be &gt; 0');
  }

  private windowStart(now: number): number { return Math.floor(now / this.windowMs) * this.windowMs; }
  protected create(now: number): WindowState { return { start: this.windowStart(now), count: 0 }; }

  protected advance(s: WindowState, now: number): void {
    const start = this.windowStart(now);
    if (start &gt; s.start) { s.start = start; s.count = 0; } // never roll backwards
  }

  protected decide(s: WindowState, cost: number, now: number): Decision {
    const allowed = s.count + cost &lt;= this.limit;
    const resetMs = Math.max(0, s.start + this.windowMs - now);
    return {
      allowed, limit: this.limit, remaining: this.limit - s.count - (allowed ? cost : 0),
      retryAfterMs: allowed ? 0 : resetMs, resetMs,
    };
  }

  protected consume(s: WindowState, cost: number): void { s.count += cost; }
  protected isFresh(s: WindowState): boolean { return s.count === 0; }
}

// ── Sliding window log (exact) ──────────────────────────────────
interface LogState {
  entries: Array&lt;{ at: number; cost: number }&gt;;
  head: number; // index of the oldest live entry: avoids O(n) shift()
  used: number;
}

export class SlidingWindowLog extends KeyedAlgorithm&lt;LogState&gt; {
  constructor(limit: number, private readonly windowMs: number, maxKeys = 100_000) {
    super(limit, maxKeys);
    if (!(windowMs &gt; 0)) throw new RangeError('windowMs must be &gt; 0');
  }

  protected create(): LogState { return { entries: [], head: 0, used: 0 }; }

  protected advance(s: LogState, now: number): void {
    const cutoff = now - this.windowMs; // the window is (now - W, now]
    while (s.head &lt; s.entries.length &amp;&amp; s.entries[s.head].at &lt;= cutoff) {
      s.used -= s.entries[s.head].cost;
      s.head++;
    }
    if (s.head &gt; 32 &amp;&amp; s.head * 2 &gt; s.entries.length) { // compact occasionally: amortised O(1)
      s.entries = s.entries.slice(s.head);
      s.head = 0;
    }
  }

  protected decide(s: LogState, cost: number, now: number): Decision {
    const allowed = s.used + cost &lt;= this.limit;
    const newest = allowed ? now : s.head &lt; s.entries.length ? s.entries[s.entries.length - 1].at : undefined;
    return {
      allowed, limit: this.limit, remaining: this.limit - s.used - (allowed ? cost : 0),
      retryAfterMs: allowed ? 0 : this.retryAfter(s, cost, now),
      resetMs: newest === undefined ? 0 : newest + this.windowMs - now,
    };
  }

  /** Exact: walk oldest-first until enough units would have aged out. */
  private retryAfter(s: LogState, cost: number, now: number): number {
    let freed = 0;
    for (let i = s.head; i &lt; s.entries.length; i++) {
      freed += s.entries[i].cost;
      if (s.used - freed + cost &lt;= this.limit) return s.entries[i].at + this.windowMs - now;
    }
    return this.windowMs; // unreachable while cost &lt;= limit
  }

  protected consume(s: LogState, cost: number, now: number): void {
    s.entries.push({ at: now, cost });
    s.used += cost;
  }

  protected isFresh(s: LogState): boolean { return s.head &gt;= s.entries.length; }
}

// ── Sliding window counter (approximate, O(1)) ──────────────────
interface CounterState { start: number; curr: number; prev: number } // start of current window

export class SlidingWindowCounter extends KeyedAlgorithm&lt;CounterState&gt; {
  constructor(limit: number, private readonly windowMs: number, maxKeys = 100_000) {
    super(limit, maxKeys);
    if (!(windowMs &gt; 0)) throw new RangeError('windowMs must be &gt; 0');
  }

  private windowStart(now: number): number { return Math.floor(now / this.windowMs) * this.windowMs; }
  protected create(now: number): CounterState { return { start: this.windowStart(now), curr: 0, prev: 0 }; }

  protected advance(s: CounterState, now: number): void {
    const start = this.windowStart(now);
    if (start &lt;= s.start) return; // same window, or the clock went backwards
    s.prev = start - s.start === this.windowMs ? s.curr : 0; // gap of 2+ windows: both stale
    s.curr = 0;
    s.start = start;
  }

  private estimate(s: CounterState, now: number): number {
    const elapsed = Math.min(this.windowMs, Math.max(0, now - s.start));
    return s.prev * (1 - elapsed / this.windowMs) + s.curr; // prev's share still inside the slide
  }

  protected decide(s: CounterState, cost: number, now: number): Decision {
    const used = this.estimate(s, now);
    const allowed = used + cost &lt;= this.limit;
    const currAfter = s.curr + (allowed ? cost : 0);
    let resetMs = 0;
    if (currAfter &gt; 0) resetMs = s.start + 2 * this.windowMs - now;
    else if (s.prev &gt; 0) resetMs = s.start + this.windowMs - now;
    return {
      allowed, limit: this.limit, remaining: Math.max(0, Math.floor(this.limit - used - (allowed ? cost : 0))),
      retryAfterMs: allowed ? 0 : this.retryAfter(s, cost, now), resetMs,
    };
  }

  private retryAfter(s: CounterState, cost: number, now: number): number {
    const W = this.windowMs;
    const room = this.limit - s.curr - cost;
    if (room &gt;= 0 &amp;&amp; s.prev &gt; 0) { // fits later in THIS window, once prev's weight decays enough
      return Math.max(1, Math.ceil(s.start + W * (1 - room / s.prev) - now));
    }
    // otherwise wait into the NEXT window, where prev := curr
    const fraction = s.curr &gt; 0 ? Math.max(0, 1 - (this.limit - cost) / s.curr) : 0;
    return Math.max(1, Math.ceil(s.start + W + W * fraction - now));
  }

  protected consume(s: CounterState, cost: number): void { s.curr += cost; }
  protected isFresh(s: CounterState): boolean { return s.curr === 0 &amp;&amp; s.prev === 0; }
}

// ── Factory over a discriminated union ──────────────────────────
export type AlgorithmConfig =
  | { type: 'token-bucket'; capacity: number; refillPerSec: number }
  | { type: 'leaky-bucket'; capacity: number; leakPerSec: number }
  | { type: 'fixed-window' | 'sliding-log' | 'sliding-counter'; limit: number; windowMs: number };

export function createAlgorithm(cfg: AlgorithmConfig, maxKeys?: number): RateLimitAlgorithm {
  switch (cfg.type) {
    case 'token-bucket': return new TokenBucket(cfg.capacity, cfg.refillPerSec, maxKeys);
    case 'leaky-bucket': return new LeakyBucket(cfg.capacity, cfg.leakPerSec, maxKeys);
    case 'fixed-window': return new FixedWindow(cfg.limit, cfg.windowMs, maxKeys);
    case 'sliding-log': return new SlidingWindowLog(cfg.limit, cfg.windowMs, maxKeys);
    case 'sliding-counter': return new SlidingWindowCounter(cfg.limit, cfg.windowMs, maxKeys);
    default: {
      const unreachable: never = cfg; // a new variant without a case = compile error
      throw new Error('unknown algorithm: ' + JSON.stringify(unreachable));
    }
  }
}</code></pre>

<h4>1b. The façade: several rules, two phases</h4>
<pre><code class="language-ts">// rate-limiter/limiter.ts   (RequestContext, Rule, Verdict, Limiter as in Step 4)
const UNLIMITED: Verdict = { allowed: true, limit: Infinity, remaining: Infinity, retryAfterMs: 0, resetMs: 0, ruleId: null };

export class RateLimiter implements Limiter {
  constructor(private readonly rules: readonly Rule[], private readonly clock: Clock = systemClock) {
    const ids = new Set(rules.map((r) =&gt; r.id));
    if (ids.size !== rules.length) throw new Error('rule ids must be unique');
  }

  /** async for interface parity only: the body never awaits, so it runs atomically. */
  async check(ctx: RequestContext): Promise&lt;Verdict&gt; {
    return this.checkSync(ctx);
  }

  checkSync(ctx: RequestContext): Verdict {
    const now = this.clock.now();
    const applicable: Array&lt;{ rule: Rule; key: string; cost: number }&gt; = [];
    for (const rule of this.rules) {
      if (!rule.appliesTo(ctx)) continue;
      const key = rule.key(ctx);
      if (key === undefined) continue;
      applicable.push({ rule, key: rule.id + ':' + key, cost: rule.cost?.(ctx) ?? 1 });
    }
    if (applicable.length === 0) return UNLIMITED;

    // Phase 1 — ask every rule; consume nothing. A deny must not burn other rules' budget.
    let worst: Verdict | null = null;
    for (const a of applicable) {
      const d = a.rule.algorithm.peek(a.key, a.cost, now);
      if (!d.allowed &amp;&amp; (worst === null || d.retryAfterMs &gt; worst.retryAfterMs)) {
        worst = { ...d, ruleId: a.rule.id }; // report the rule that blocks longest
      }
    }
    if (worst !== null) return worst;

    // Phase 2 — all said yes: consume everywhere. Same tick, so nothing can interleave.
    let tightest: Verdict | null = null;
    for (const a of applicable) {
      const d = a.rule.algorithm.tryAcquire(a.key, a.cost, now);
      if (tightest === null || d.remaining &lt; tightest.remaining) tightest = { ...d, ruleId: a.rule.id };
    }
    return tightest!;
  }

  /** Periodically forget idle keys. Returns a stop function. */
  startSweeper(intervalMs = 30_000): () =&gt; void {
    const timer = setInterval(() =&gt; {
      const now = this.clock.now();
      for (const rule of this.rules) rule.algorithm.sweep(now);
    }, intervalMs);
    timer.unref(); // never keep the process alive just for housekeeping
    return () =&gt; clearInterval(timer);
  }
}</code></pre>

<h4>1c. Express adapter and wiring (per-IP, per-user and global rules)</h4>
<pre><code class="language-ts">// rate-limiter/middleware.ts
import type { Request, Response, RequestHandler } from 'express';
import ipaddr from 'ipaddr.js';

export function rateLimit(
  limiter: Limiter,
  toContext: (req: Request, res: Response) =&gt; RequestContext,
): RequestHandler {
  return (req, res, next) =&gt; {
    limiter.check(toContext(req, res)).then((verdict) =&gt; {
      if (verdict.ruleId !== null) {
        res.setHeader('RateLimit-Limit', String(verdict.limit));
        res.setHeader('RateLimit-Remaining', String(Math.max(0, verdict.remaining)));
        res.setHeader('RateLimit-Reset', String(Math.ceil(verdict.resetMs / 1000)));
      }
      if (verdict.allowed) {
        next();
        return;
      }
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil(verdict.retryAfterMs / 1000))));
      res.status(429).json({ error: 'rate_limited', retryAfterMs: verdict.retryAfterMs });
    }, next); // Express 4 does not catch a rejected promise for you
  };
}

/** IPv4-mapped IPv6 → plain IPv4; real IPv6 → its /64 (one customer usually owns the whole /64). */
export function ipKey(raw: string): string {
  if (!ipaddr.isValid(raw)) return 'invalid';
  const addr = ipaddr.process(raw); // '::ffff:1.2.3.4' becomes IPv4 '1.2.3.4'
  if (addr.kind() === 'ipv4') return addr.toString();
  return addr.toNormalizedString().split(':').slice(0, 4).join(':') + '::/64';
}

// app.ts
const limiter = new RateLimiter([
  {
    id: 'login:ip', // brute force: exact, low limit → sliding log
    appliesTo: (c) =&gt; c.route === 'POST /login',
    key: (c) =&gt; ipKey(c.ip),
    algorithm: createAlgorithm({ type: 'sliding-log', limit: 5, windowMs: 15 * 60_000 }),
  },
  {
    id: 'api:user', // authenticated traffic: 5/s sustained, bursts of 20
    appliesTo: (c) =&gt; c.route.includes(' /api/'),
    key: (c) =&gt; c.userId, // anonymous → rule skipped
    algorithm: createAlgorithm({ type: 'token-bucket', capacity: 20, refillPerSec: 5 }),
  },
  {
    id: 'api:ip', // backstop for anonymous / abusive IPs, set generously (offices share IPs)
    appliesTo: () =&gt; true,
    key: (c) =&gt; ipKey(c.ip),
    algorithm: createAlgorithm({ type: 'sliding-counter', limit: 1_000, windowMs: 60_000 }),
  },
  {
    id: 'global', // protect the database from everyone at once
    appliesTo: (c) =&gt; c.route.startsWith('POST /api/reports'),
    key: () =&gt; 'all',
    algorithm: createAlgorithm({ type: 'token-bucket', capacity: 50, refillPerSec: 10 }),
  },
]);
limiter.startSweeper();

app.set('trust proxy', 1); // exactly one proxy (the load balancer) in front: req.ip = real client
app.use(authenticate); // sets res.locals.userId
app.use(
  rateLimit(limiter, (req, res) =&gt; ({
    ip: req.ip ?? 'unknown',
    route: req.method + ' ' + req.path,
    userId: res.locals.userId as string | undefined,
  })),
);</code></pre>

<h4>Tests in prose (each is a fake-clock unit test; no sleeping)</h4>
<ol>
  <li><strong>Token bucket</strong> (capacity 10, 1/s): ten calls at t=0 pass; the 11th is denied with <code>retryAfterMs = 1000</code>; at t=500 still denied with 500; at t=1000 exactly one passes. A call at t=0 <em>after</em> t=1000 (clock went backwards) is denied, not crashed.</li>
  <li><strong>Fixed window boundary</strong> (100/min): 100 at 59 s + 100 at 60 s all pass, which is <em>200 in one second</em>. The test documents the weakness; at 61 s the next is denied with <code>retryAfterMs = 59000</code>.</li>
  <li><strong>Sliding log</strong> (3 per 1000 ms): t=0, 100, 200 pass; t=300 denied with <code>retryAfterMs = 700</code>; t=999 denied; t=1000 passes, because the window is <code>(now − W, now]</code> and the t=0 entry has left. Weighted: limit 10, costs 4 @0 and 4 @100, then cost 5 @200 → denied, retry after 800 ms (once the first 4 units leave).</li>
  <li><strong>Sliding counter</strong> (100/min): 80 in the previous window, 30 at 70 s; at 75 s the estimate is 80 × 0.75 + 30 = 90, so exactly 10 more pass; the next is denied with <code>retryAfterMs = 750</code>, and at 75.75 s it passes.</li>
  <li><strong>Two-phase:</strong> per-user bucket 2, per-IP bucket 3. User A: two pass, the third is denied by <code>user</code>, and the IP bucket still has 1 token (the denial consumed nothing). User B from the same IP: one passes, then denied by <code>ip</code>.</li>
  <li><strong>Validation &amp; bounds:</strong> cost 0, NaN, or above the limit throws <code>RangeError</code>; with <code>maxKeys = 3</code>, a 4th key evicts the least-recently-seen key; after a long idle, <code>sweep()</code> leaves <code>trackedKeys = 0</code>.</li>
</ol>

<h3>Example 2 — Follow-up: make it distributed (Redis + Lua)</h3>
<p>Six pods must share one budget per user. The algorithm moves <strong>into Redis</strong> as a Lua script, because a script executes atomically: no other command runs between its read and its write. This improves on the sketch in <a href="#/topic/bsd-cases">Backend SD Cases</a> in three ways: it uses <strong>Redis server time</strong> (one clock, no skew between pods), it sets the key's TTL to <strong>time-to-full</strong> (idle keys cost nothing), and it returns <strong>integers plus retry-after</strong>.</p>
<pre><code class="language-lua">-- token-bucket.lua
-- KEYS[1] = bucket key
-- ARGV[1] = capacity, ARGV[2] = refill per second, ARGV[3] = cost
local capacity = tonumber(ARGV[1])
local rate     = tonumber(ARGV[2])
local cost     = tonumber(ARGV[3])

-- Redis server time, not the caller's clock: one clock for every app server
local t   = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)

local state  = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(state[1])
local ts     = tonumber(state[2])
if tokens == nil then
  tokens = capacity
  ts = now
end

tokens = math.min(capacity, tokens + math.max(0, now - ts) * rate / 1000)

local allowed = 0
local retry_after = 0
if tokens &gt;= cost then
  tokens = tokens - cost
  allowed = 1
else
  retry_after = math.ceil((cost - tokens) * 1000 / rate)
end

redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
-- An idle bucket is "full" once this elapses, and a missing key reads as full:
-- so expiring it here loses nothing and frees memory.
redis.call('PEXPIRE', KEYS[1], math.ceil((capacity - tokens) * 1000 / rate) + 1000)

-- Lua numbers become Redis INTEGER replies (fraction dropped): round explicitly.
return { allowed, math.floor(tokens), retry_after }</code></pre>
<pre><code class="language-ts">// rate-limiter/redis-token-bucket.ts  (CommonJS build; in ESM use import.meta.dirname)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Redis from 'ioredis';

type Reply = [allowed: number, remaining: number, retryAfterMs: number];

// defineCommand adds a method at runtime; this tells TypeScript about it.
type LimiterRedis = Redis &amp; {
  tokenBucket(key: string, capacity: number, refillPerSec: number, cost: number): Promise&lt;Reply&gt;;
};

export interface RedisBucketConfig {
  prefix: string; // 'rl:api:user'
  capacity: number;
  refillPerSec: number;
  timeoutMs: number; // budget for the round trip, e.g. 50
  failOpen: boolean; // true = allow when Redis is unavailable
}

export class RedisTokenBucket {
  private readonly redis: LimiterRedis;

  constructor(redis: Redis, private readonly cfg: RedisBucketConfig) {
    redis.defineCommand('tokenBucket', {
      numberOfKeys: 1,
      lua: readFileSync(join(__dirname, 'token-bucket.lua'), 'utf8'),
    });
    this.redis = redis as LimiterRedis;
  }

  async acquire(key: string, cost = 1): Promise&lt;Decision&gt; {
    const redisKey = this.cfg.prefix + ':' + key;
    try {
      const [allowed, remaining, retryAfterMs] = await withTimeout(
        this.redis.tokenBucket(redisKey, this.cfg.capacity, this.cfg.refillPerSec, cost),
        this.cfg.timeoutMs,
      );
      const resetMs = Math.ceil(((this.cfg.capacity - remaining) * 1000) / this.cfg.refillPerSec);
      return { allowed: allowed === 1, limit: this.cfg.capacity, remaining, retryAfterMs, resetMs };
    } catch {
      // count this in a metric + alert: a silent fail-open is an outage you never hear about
      const retryAfterMs = this.cfg.failOpen ? 0 : 1000;
      return { allowed: this.cfg.failOpen, limit: this.cfg.capacity, remaining: 0, retryAfterMs, resetMs: retryAfterMs };
    }
  }
}

function withTimeout&lt;T&gt;(work: Promise&lt;T&gt;, ms: number): Promise&lt;T&gt; {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise&lt;never&gt;((_, reject) =&gt; {
    timer = setTimeout(() =&gt; reject(new Error('rate limiter timeout after ' + ms + 'ms')), ms);
  });
  return Promise.race([work, timeout]).finally(() =&gt; clearTimeout(timer));
}</code></pre>
<p><strong>Points an interviewer will probe:</strong></p>
<ul>
  <li><strong>Why Lua, not <code>MULTI</code>/<code>EXEC</code>?</strong> A transaction can't branch on a value it reads; the token maths needs read → compute → conditional write, atomically. ioredis's <code>defineCommand</code> loads the script once and calls it by SHA (<code>EVALSHA</code>).</li>
  <li><strong><code>TIME</code> inside a script</strong> is fine on Redis 5+ (effects replication); very old versions needed <code>redis.replicate_commands()</code> first.</li>
  <li><strong>Cluster:</strong> single-key scripts are always safe. To check all of a request's rules in one script, the keys must share a slot, so use a hash tag: <code>rl:{user42}:minute</code>, <code>rl:{user42}:day</code>.</li>
  <li><strong>Timeouts and hot keys:</strong> after a timeout the script may still run and consume a token (acceptable; say so). A tenant sending half the traffic saturates one shard, so let each pod <em>lease</em> small batches of tokens into a local bucket.</li>
</ul>
<p><strong>Sliding log in Redis</strong> maps onto a sorted set scored by timestamp: in one script, <code>ZREMRANGEBYSCORE key -inf (now − W)</code>, then <code>ZCARD</code>; if under the limit, <code>ZADD key now &lt;unique-id&gt;</code> (unique, because two requests can share a millisecond) and <code>PEXPIRE key W</code>; otherwise the retry time is the oldest score + W − now. Memory is O(limit) per key, the same trade-off as in-process.</p>
<p><strong>Test it for real:</strong> start Redis in a container (for example with Testcontainers), fire 200 concurrent <code>acquire</code> calls at a limit of 100 with <code>Promise.all</code>, and assert <em>exactly</em> 100 were allowed. Then repeat with a naive <code>GET</code>/<code>SET</code> version and watch it fail. That's the demo that proves atomicity.</p>

<h3>Example 3 — Follow-up: shaping outbound calls to a rate-limited API</h3>
<p>FDE-flavoured: your service calls an LLM provider limited to, say, 90,000 tokens per minute. Rejecting your own users is the wrong answer here; you want to <strong>wait</strong> for budget. That's the leaky bucket used as a <em>queue</em> (shaping), built on token-bucket maths:</p>
<pre><code class="language-ts">// outbound/throttled-queue.ts — shaping: callers WAIT instead of being rejected
interface Waiter { cost: number; resolve: () =&gt; void }

export class ThrottledQueue {
  private tokens: number;
  private last: number;
  private readonly waiters: Waiter[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly capacity: number, // burst, e.g. tokens-per-minute / 6
    private readonly refillPerSec: number, // e.g. tokens-per-minute / 60
    private readonly maxQueue = 1_000,
    private readonly clock: Clock = systemClock,
  ) {
    this.tokens = capacity;
    this.last = clock.now();
  }

  /** Resolves once cost units are granted. FIFO: a big request is never starved by small ones. */
  acquire(cost = 1): Promise&lt;void&gt; {
    if (!(cost &gt; 0) || cost &gt; this.capacity) {
      return Promise.reject(new RangeError('cost must be in (0, ' + this.capacity + ']'));
    }
    if (this.waiters.length &gt;= this.maxQueue) {
      return Promise.reject(new Error('throttle queue full')); // shed load instead of queueing forever
    }
    return new Promise&lt;void&gt;((resolve) =&gt; {
      this.waiters.push({ cost, resolve });
      this.drain();
    });
  }

  /** Upstream said 429 + Retry-After: go into debt so nothing is sent for ms milliseconds. */
  pauseFor(ms: number): void {
    this.refill();
    this.tokens = Math.min(this.tokens, 0) - (ms * this.refillPerSec) / 1000;
    this.reschedule();
  }

  private refill(): void {
    const now = this.clock.now();
    this.tokens = Math.min(this.capacity, this.tokens + (Math.max(0, now - this.last) * this.refillPerSec) / 1000);
    this.last = Math.max(this.last, now);
  }

  private drain(): void {
    this.refill();
    while (this.waiters.length &gt; 0 &amp;&amp; this.tokens &gt;= this.waiters[0].cost) {
      const w = this.waiters.shift()!;
      this.tokens -= w.cost;
      w.resolve();
    }
    this.reschedule();
  }

  private reschedule(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    if (this.waiters.length === 0) return;
    const deficit = this.waiters[0].cost - this.tokens;
    const waitMs = Math.max(1, Math.ceil((deficit * 1000) / this.refillPerSec));
    this.timer = setTimeout(() =&gt; { this.timer = null; this.drain(); }, waitMs);
  }
}

// usage: estimate the cost, wait for budget, back off if the provider still says 429
const llmBudget = new ThrottledQueue(15_000, 90_000 / 60);

async function complete(prompt: string): Promise&lt;string&gt; {
  await llmBudget.acquire(estimateTokens(prompt) + MAX_OUTPUT_TOKENS);
  const res = await callProvider(prompt);
  if (res.status === 429) {
    llmBudget.pauseFor(Number(res.headers.get('retry-after') ?? '1') * 1000);
    throw new RetryableError('provider rate limited');
  }
  return res.text;
}</code></pre>
<ul>
  <li><strong>Debt instead of a flag:</strong> <code>pauseFor</code> makes <code>tokens</code> negative, so the ordinary refill maths produces the pause; there's no separate "paused until" state to get wrong.</li>
  <li><strong>FIFO and bounded:</strong> a 12,000-token request isn't starved by a stream of small ones, and with 1,000 callers already waiting we fail fast instead of turning overload into memory growth. Per process only: with 4 pods, give each a quarter of the budget or coordinate via Redis.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Cost larger than capacity, zero, negative, or NaN</h3>
<p>A request with cost 30 against a bucket of capacity 20 can <em>never</em> succeed; returning "retry after N ms" sends the client into an infinite retry loop. Reject at the boundary with a clear error (a 400 or 413-style response), as <code>validate()</code> does. NaN must not slip through: <code>NaN &gt;= cost</code> is false and <code>tokens - NaN</code> poisons the state forever.</p>

<h3>2. The clock goes backwards</h3>
<p>NTP corrections, VM migration or a test harness can move <code>Date.now()</code> backwards. A negative elapsed time would <em>remove</em> tokens or reset windows. Clamp elapsed to ≥ 0 and keep <code>last = max(last, now)</code>, as every <code>advance</code> above does. Distributed: use Redis <code>TIME</code>, never each pod's clock.</p>

<h3>3. Key cardinality (memory as an attack surface)</h3>
<p>Keying by IP lets an attacker with many addresses create millions of states. IPv6 makes it trivial: one host can rotate through a whole <code>/64</code>. Hence O(1)-state algorithms, a sweeper that forgets fresh states (a fresh state behaves exactly like a missing one; in Redis a TTL of time-to-full does the same), <code>maxKeys</code> with LRU eviction (the same idea as <a href="#/topic/lld-lru-cache">Case: LRU Cache</a>), and IPv6 keyed by <code>/64</code> prefix. Note that evicting a key is <em>lenient</em>: it restarts with a full bucket.</p>

<h3>4. Shared IPs: offices, NAT, mobile carriers</h3>
<p>A whole office (or a mobile carrier's NAT) can appear as one IP. A tight per-IP limit then blocks hundreds of legitimate users. Key authenticated traffic by user or API key, keep per-IP limits generous and aimed at anonymous traffic, and allowlist known customer egress ranges only with care.</p>

<h3>5. Proxies and <code>req.ip</code></h3>
<p>Behind a load balancer, <code>req.ip</code> is the balancer's address unless Express is told to trust it, so everyone shares one bucket. Trust too much (<code>trust proxy: true</code> with clients able to reach you directly) and attackers spoof <code>X-Forwarded-For</code> to get a fresh bucket per request. Trust exactly the number of hops you actually have.</p>

<h3>6. Synchronised resets</h3>
<p>Fixed windows aligned to the wall clock reset for <em>everyone</em> at :00, so every blocked client retries at the same instant. Offset each key's window by <code>hash(key) % windowMs</code>, and tell clients to add jitter to <code>Retry-After</code>.</p>

<h3>7. Multiple instances and serverless</h3>
<p>N pods with in-memory limiters allow N × the limit, and N changes under autoscaling. On AWS Lambda each concurrent execution environment has its own memory, so an in-process limiter is close to meaningless. Use API Gateway throttling and usage plans, or shared state (Redis, DynamoDB conditional writes).</p>

<h3>8. Smaller ones worth a sentence each</h3>
<ul>
  <li><strong>Floating-point drift:</strong> fractional refills can leave <code>0.9999999</code> tokens, which means a deny with a 1 ms retry. Store integer milli-tokens if exactness matters.</li>
  <li><strong>Cold-start bursts:</strong> buckets start full, so every client can burst right after a deploy or eviction; start expensive endpoints' buckets partly empty.</li>
  <li><strong>Long-lived connections:</strong> a WebSocket is one HTTP request but thousands of messages, so limit messages per connection <em>and</em> connections per user.</li>
  <li><strong>Lowering a limit at runtime:</strong> <code>advance</code> clamps tokens to the new capacity on the next call; switching algorithm type resets every key once.</li>
  <li><strong>Redis failover:</strong> replication is asynchronous, so a failover can lose recent counts and briefly over-admit. Fine for rate limiting, not for billing.</li>
</ul>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Bug 1 — Read-modify-write across an <code>await</code></h3>
<pre><code class="language-ts">// BUG: two concurrent requests both read 99, both write 100 → 101 allowed
const count = Number((await redis.get(key)) ?? 0);
if (count &gt;= limit) return deny();
await redis.set(key, count + 1);</code></pre>
<p>Single-threaded JavaScript doesn't save you here: the <code>await</code> hands control back to the event loop, other requests run, and Redis serves them all. Use <code>INCR</code> (atomic) or a Lua script.</p>

<h3>Bug 2 — <code>INCR</code> then <code>EXPIRE</code> as two calls</h3>
<pre><code class="language-ts">// BUG: if the process dies (or the call fails) between these lines,
// the key never expires and that user is blocked forever
const n = await redis.incr(key);
if (n === 1) await redis.pexpire(key, windowMs);</code></pre>
<p>Fix: do both inside one Lua script, or <code>MULTI</code> with <code>INCR</code> + <code>PEXPIRE key ms NX</code> (the <code>NX</code> flag, "only if no TTL yet", is Redis 7+).</p>

<h3>Bug 3 — Each pod's clock as the timestamp</h3>
<p>Passing <code>Date.now()</code> from the app into the script means pods with 200 ms of skew refill the same bucket differently. A pod whose clock runs behind looks like a clock going backwards. Read <code>TIME</code> inside the script.</p>

<h3>Bug 4 — A timer per key to refill tokens</h3>
<p><code>setInterval(() =&gt; bucket.tokens++, 1000)</code> for each of 100,000 keys means 100,000 timers that keep running long after users leave. Refill lazily from elapsed time; it costs one subtraction per request.</p>

<h3>Bug 5 — Counting denied requests</h3>
<p>If denials also consume budget, a client that retries while blocked stays blocked forever. Sometimes that's a deliberate penalty (login abuse); usually it's an accident. In this design, denials consume nothing (invariant 1).</p>

<h3>Anti-pattern 6 — Fixed window for login brute force</h3>
<p>"5 attempts per 15 minutes" with fixed windows allows 10 in a few seconds around the boundary. Low limits that matter for security deserve the exact sliding log.</p>

<h3>Anti-pattern 7 — Unbounded per-key map</h3>
<p>A <code>Map&lt;ip, state&gt;</code> that only grows is a memory leak an attacker can drive. Bound it (<code>maxKeys</code>) and sweep idle keys.</p>

<h3>Anti-pattern 8 — Limiting after the expensive work</h3>
<p>Running the limiter after body parsing, authentication against the database, or the LLM call itself protects nothing. Put a cheap per-IP limit first, then authenticate, then per-user limits.</p>

<h3>Anti-pattern 9 — 200 with an error body, or 429 without <code>Retry-After</code></h3>
<p>Clients, SDKs and CDNs key their retry behaviour off the status code. Without <code>Retry-After</code>, well-behaved clients guess and badly-behaved ones hammer. <code>Retry-After</code> is standard HTTP; the <code>RateLimit-*</code> fields used above come from an IETF draft whose shape has changed between versions (later drafts use <code>RateLimit</code> + <code>RateLimit-Policy</code>), and many APIs still send <code>X-RateLimit-*</code>, so check the current draft, pick one, and document it. See <a href="#/topic/api-rest">REST Principles</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Design a rate limiter. (The opener.)</div>
  <div class="qa-answer">
    <p>Clarify: what's the key, are bursts OK, one process or many, reject or queue? Then the LLD steps. <strong>Entities:</strong> a <code>RateLimiter</code> façade, <code>Rule</code>s, and a <code>RateLimitAlgorithm</code> Strategy with five implementations on a Template Method base. <strong>API:</strong> a <code>Decision</code> (allowed, remaining, retryAfter, reset), not a boolean. <strong>Flow:</strong> peek every rule, then consume from all. <strong>Code:</strong> base class and token bucket first. <strong>Then:</strong> concurrency (atomic in one Node process, Lua in Redis), memory bounds, and 429 + <code>Retry-After</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Compare the algorithms. Which would you pick?</div>
  <div class="qa-answer">
    <p><strong>Token bucket</strong> by default: O(1) state, allows controlled bursts (capacity) at a steady rate, and is easy to explain to customers ("100/min, bursts of 20"). <strong>Sliding window log</strong> when the limit is small and must be exact (login, OTP), because its memory is O(limit) per key. <strong>Sliding window counter</strong> when I want window semantics at O(1) and slight approximation is fine. <strong>Fixed window</strong> only for coarse quotas (daily caps): 100/min lets 100 through at 0:59 and 100 more at 1:00, which is 2× in a second, and aligned windows make everyone retry at :00 (offset windows by a hash of the key if you must keep them). <strong>Leaky bucket</strong> as a meter is token bucket mirrored; as a queue it's for shaping outbound traffic.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain the sliding window counter's maths and its error.</div>
  <div class="qa-answer">
    <p>Keep counts for the current and previous fixed windows. Estimated usage = <code>prev × (1 − elapsed/window) + curr</code>: the fraction of the previous window still inside the sliding window, assuming its requests were spread evenly. Example: limit 100, prev 80, curr 30, 15 s into the current minute gives 80 × 0.75 + 30 = 90, so 10 more are allowed. If the previous window's traffic was bunched at its end, the estimate is low and it can over-admit a little. Memory is 3 numbers per key versus O(limit) for the log, and that trade is usually worth it for API limits.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. A request is subject to per-user, per-IP and global limits. How do you combine them?</div>
  <div class="qa-answer">
    <p>Each is a <code>Rule</code> with its own key and algorithm, and the request must pass all of them. The trap is consuming from the per-user bucket and then being denied by the per-IP one: the user pays for a request that never ran. So I <strong>peek all rules first, then consume from all</strong>, which is atomic in one Node tick. If anything denies, I return the denial with the <em>longest</em> <code>retryAfter</code> (retrying sooner would just fail again); if all allow, I report the rule with the <em>smallest</em> remaining in the headers. In Redis I'd do all rules in one Lua script, with keys sharing a hash tag in Cluster.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Is your in-memory limiter thread-safe? What about 6 pods?</div>
  <div class="qa-answer">
    <p>In one Node process, yes: <code>tryAcquire</code> reads, decides and writes synchronously, and the event loop never interleaves synchronous code, so there's no lock to forget. (In Java I'd need per-key atomicity, for example <code>ConcurrentHashMap.compute</code>.) With 6 pods, each has its own <code>Map</code>, so a user can get up to 6× the limit, and the multiple changes with autoscaling. Options: split the limit per pod (imprecise), consistent-hash each key to one pod (complex routing), or move the state to Redis with an atomic script, which is the usual answer.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Make it distributed. Walk me through the Redis design.</div>
  <div class="qa-answer">
    <p>Each bucket is a hash <code>{tokens, ts}</code>, and the whole advance → decide → consume runs as a <strong>Lua script</strong>, atomic on the server; otherwise two pods both read 1 token and both allow. In the script: Redis <code>TIME</code> (one clock), <code>PEXPIRE</code> = time-to-full (idle keys vanish), integer returns (Lua numbers come back truncated). Load it once and call by SHA. Shard by key in Cluster, with hash tags when one script touches several keys. Capacity estimates and sharding are the HLD half, in <a href="#/topic/bsd-cases">Backend SD Cases</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Redis is down or slow. Fail open or fail closed?</div>
  <div class="qa-answer">
    <p>Per rule, by what it protects. <strong>Fail open</strong> (allow) for ordinary API traffic, so a limiter outage doesn't become a product outage. <strong>Fail closed</strong> (deny) for login, OTP, password reset, and expensive operations where abuse costs real money. Either way: a tight timeout (tens of ms), a fallback to a local in-memory limiter with a conservative per-pod share, and a metric plus alert on every fallback; a silent fail-open can leave you unprotected for weeks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Your service calls an LLM provider limited to 90k tokens/minute. How do you avoid hitting their limit?</div>
  <div class="qa-answer">
    <p>That's <strong>shaping</strong>, not policing: my users shouldn't get errors because I'm near <em>my</em> provider's limit, so requests should wait. I use a token bucket in tokens per second with a FIFO queue of waiters (Example 3): <code>acquire(estimatedTokens)</code> resolves when budget exists, the queue is bounded so overload fails fast, and when the provider still returns 429 I honour <code>Retry-After</code> by putting the bucket into debt. With several pods, give each a share of the budget or coordinate through Redis. Also cut demand: cache identical prompts, batch where the provider supports it, and put cheaper models on non-critical paths.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. (FDE scenario) A customer says: "Our staff keep getting 429s all morning, but our traffic is tiny." What do you do?</div>
  <div class="qa-answer">
    <p>Check the data before changing limits. Pull the denials by <code>ruleId</code> and key. The classic pattern is one key, the customer's office egress IP, hitting the <strong>per-IP</strong> rule: hundreds of staff behind one NAT look like a single heavy client. Second suspect: <code>req.ip</code> is the load balancer's address because <code>trust proxy</code> is wrong, so <em>everyone</em> shares one bucket, which shows up as a single key with a huge count. Third: a client-side retry loop without backoff amplifying a few real 429s. Fixes, in order: key authenticated traffic by user or API key, make the per-IP rule a generous backstop for anonymous traffic, correct the proxy config, and make the client honour <code>Retry-After</code> with jitter. Then send the customer a short note with what we saw and what changed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you test a rate limiter?</div>
  <div class="qa-answer">
    <p><strong>Unit:</strong> algorithms take <code>now</code> as a parameter, so tests are exact and instant: boundary bursts, exact <code>retryAfterMs</code>, clock going backwards, validation, two-phase non-consumption, the sweeper. <strong>Property-based:</strong> over random timelines, "never more than <code>limit</code> in any window W" for the log and "never more than capacity + rate × t" for the bucket. <strong>Integration:</strong> real Redis in a container, 200 concurrent requests at a limit of 100, exactly 100 allowed. <strong>Load:</strong> the limiter's own p99 overhead.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this case</div>
  <ul>
    <li>You ask what the key is and whether bursts are allowed before choosing an algorithm.</li>
    <li>You can derive token-bucket refill lazily and explain capacity vs rate.</li>
    <li>You show algorithms as interchangeable Strategies behind one interface, with a shared Template Method.</li>
    <li>You return a rich decision and map it to 429 + <code>Retry-After</code>.</li>
    <li>You explain why in-process is atomic in Node and why Redis needs Lua, and you name the clock-skew fix.</li>
    <li>You bound memory and choose fail-open vs fail-closed per rule, with alerting.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Implement a lazily-refilled token bucket with an exact <code>retryAfterMs</code>. What do capacity and rate each control?</div>
  <div class="qa-answer">
    <p>Two knobs, two meanings: <strong>capacity = how bursty</strong>, <strong>rate = sustained throughput</strong>, so "100 per minute with bursts of 20" is capacity 20 and rate 100/60 per second. State is just <code>{ tokens, last }</code>, created full so an initial burst is allowed. No timers: on each call, advance by elapsed time, <code>tokens = min(capacity, tokens + elapsed × rate)</code>, using <code>max(0, now − last)</code> so a clock going backwards neither refills nor crashes. Allow if <code>tokens ≥ cost</code> and subtract; otherwise <code>retryAfterMs = ceil((cost − tokens) × 1000 / rate)</code>, which is honest: retrying after exactly that long succeeds if nothing else consumed budget meanwhile. Example: capacity 10 at 1/s, ten calls at t=0 pass and the 11th is denied with <code>retryAfterMs = 1000</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you structure five algorithms as Strategies behind one interface, with a Template Method base?</div>
  <div class="qa-answer">
    <p>The Strategy interface is <code>RateLimitAlgorithm</code> (<code>peek</code>, <code>tryAcquire</code>, <code>sweep</code>), so a <code>Rule</code> holds one algorithm and the <code>RateLimiter</code> façade never knows which. An abstract <code>KeyedAlgorithm&lt;S&gt;</code> is the Template Method: it owns the per-key state map, the <code>maxKeys</code> LRU bound, cost validation and the step order — <code>tryAcquire</code> loads state, calls <code>advance</code>, then <code>decide</code>, and calls <code>consume</code> only if allowed; <code>peek</code> runs the same steps without consuming. The five subclasses (token bucket, leaky bucket, fixed window, sliding log, sliding counter) supply only five small hooks: <code>create</code>, <code>advance</code>, <code>decide</code>, <code>consume</code> and <code>isFresh</code> (so <code>sweep</code> can forget idle keys). A <code>createAlgorithm(config)</code> Factory over a discriminated union, with a <code>never</code> check, builds the right one.</p>
  </div>
</div>
` },

  ]
});
