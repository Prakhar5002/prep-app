window.PREP_SITE.registerTopic({
  id: 'bsd-cases',
  module: 'backend',
  title: 'Backend SD Cases',
  estimatedReadTime: '60 min',
  tags: ['system-design', 'cases', 'twitter', 'url-shortener', 'rate-limiter', 'chat', 'uber', 'feed', 'payments'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Backend system design case studies.</strong> Eight worked examples following the framework from <code>bsd-framework</code> — clarify → estimate → high-level → deep dives → scale → wrap. Don't memorize answers; internalize the patterns and how each case forces certain tradeoffs.</p>
<ul>
  <li><strong>URL shortener (bit.ly)</strong> — read-heavy; cache-dominated; ID generation tradeoffs.</li>
  <li><strong>Rate limiter</strong> — algorithm choice; distributed state via Redis Lua; fail-open vs fail-closed.</li>
  <li><strong>Twitter feed</strong> — fan-out push vs pull; hot-key (celebrity) problem; hybrid approach.</li>
  <li><strong>Chat (WhatsApp / Slack)</strong> — message ordering; multi-device sync; presence; offline queueing.</li>
  <li><strong>Uber dispatch</strong> — geospatial indexing; dispatch matching; surge pricing; driver state.</li>
  <li><strong>Notification system</strong> — multi-channel fan-out; idempotency; per-user quiet hours; throttling.</li>
  <li><strong>Distributed counter</strong> — hot-key contention; sharded counters; eventual aggregation.</li>
  <li><strong>Payment system</strong> — idempotency; double-entry ledger; saga across services; reconciliation.</li>
</ul>
<p><strong>Mantra:</strong> "Walk the framework. Pin tradeoffs. Solve the hot key. Plan the failure case. Always wrap up with what's deferred."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>Why case studies matter</h3>
<p>You can read the framework in <code>bsd-framework</code> 10 times and still freeze in an interview. Cases give the muscle memory: "this prompt looks like the URL shortener problem — read-heavy, cache-dominated, ID generation matters."</p>

<h3>How each case is structured</h3>
<table>
  <thead><tr><th>Section</th><th>Length</th></tr></thead>
  <tbody>
    <tr><td>1. Clarify</td><td>Short — what's in scope, what's out</td></tr>
    <tr><td>2. Estimate</td><td>Numbers aloud</td></tr>
    <tr><td>3. High-level</td><td>Sketch + key flow</td></tr>
    <tr><td>4. Deep dive</td><td>1-2 hardest parts</td></tr>
    <tr><td>5. Scale + reliability</td><td>Bottlenecks + mitigations</td></tr>
    <tr><td>6. Wrap-up</td><td>Strong / deferred / next</td></tr>
  </tbody>
</table>

<h3>Don't memorize — pattern-match</h3>
<p>Each case shows specific tradeoffs. The interview prompt may be slightly different ("design Pinterest feed" vs Twitter), but the underlying tradeoffs (fan-out, hot keys, ranking) are the same. Recognize the pattern; apply the technique.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Cases 1-2',
      html: `
<h2>Case 1: URL shortener (bit.ly)</h2>

<h3>1. Clarify</h3>
<ul>
  <li>Shorten long URL → short URL.</li>
  <li>Redirect short → long.</li>
  <li>Out: custom aliases, expiry, auth (just rate-limit by IP).</li>
  <li>Scale: 100M URLs total, 1B redirects/day.</li>
  <li>Constraints: redirect P99 &lt; 100ms, 99.99% uptime.</li>
</ul>

<h3>2. Estimate</h3>
<pre><code class="language-text">Writes: 100M URLs / 5 years / 86400s ≈ 600/sec; peak ~2K/sec
Reads: 1B/day = 12K/sec; peak ~36K/sec
Storage: 200B/row × 100M ≈ 20GB (tiny!)
</code></pre>

<h3>3. High-level</h3>
<pre><code class="language-text">Client → CDN → LB → App servers
                       ↓
                   Cache (Redis) ← miss → Postgres

Click counter: Redis INCR → batch flush to DB
</code></pre>

<h3>4. Deep dive: short-ID generation</h3>
<table>
  <thead><tr><th>Strategy</th><th>Pro</th><th>Con</th></tr></thead>
  <tbody>
    <tr><td>Hash long URL (MD5 → first 7 chars base62)</td><td>Deterministic; same input → same output</td><td>Collisions; if user trips them, ugly behavior</td></tr>
    <tr><td>Auto-increment + base62 encode</td><td>Short (7 chars = 62^7 = 3.5T); no collision</td><td>Predictable; competitor scrapes; coupling to DB sequence</td></tr>
    <tr><td>Random + check + retry on collision</td><td>Unpredictable; no central coordination needed</td><td>Extra read on collision (rare at small scale)</td></tr>
    <tr><td>Pre-allocate ID range to each app server</td><td>No coordination per request</td><td>ID waste on rebalance</td></tr>
  </tbody>
</table>

<p><strong>Pick:</strong> random 7-char base62 + collision check via <code>INSERT ... ON CONFLICT DO NOTHING RETURNING short_id</code>.</p>

<pre><code class="language-typescript">function genShortId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 7 }, () =&gt; chars[Math.floor(Math.random() * 62)]).join('');
}

async function shorten(longUrl: string) {
  for (let i = 0; i &lt; 5; i++) {
    const id = genShortId();
    const result = await db.query(
      'INSERT INTO urls (short_id, long_url) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING short_id',
      [id, longUrl]
    );
    if (result.rowCount &gt; 0) return id;
  }
  throw new Error('id_collision_after_retries');
}
</code></pre>

<h3>5. Scale + reliability</h3>
<ul>
  <li><strong>Read path:</strong> CDN absorbs majority; cache hit &gt; 99% likely; backend reads ~360 RPS easy on Postgres.</li>
  <li><strong>Write path:</strong> 2K/sec well within Postgres write throughput.</li>
  <li><strong>10× scale:</strong> 360K reads/sec → multi-region CDN; Redis cluster; read replicas.</li>
  <li><strong>Reliability:</strong> Postgres primary + replica + auto-failover; Redis as accelerator only (DB is source of truth).</li>
  <li><strong>Redis note:</strong> Redis relicensed off open-source BSD to SSPL/RSAL in March 2024, spawning the Linux Foundation <strong>Valkey</strong> fork (AWS/Google/Oracle); Redis 8 returned to open source under AGPLv3 in May 2025. AWS ElastiCache and Google Memorystore now default new deployments to Valkey — protocol-compatible, so everything here applies to either.</li>
  <li><strong>Click counter:</strong> Redis INCR per request; batch flush every 60s to DB; tolerate counter drift on Redis loss.</li>
  <li><strong>Observability:</strong> redirect rate, P99 latency, cache hit rate, error rate; SLO 99.99% &lt; 100ms.</li>
</ul>

<h3>6. Wrap-up</h3>
<ul>
  <li><strong>Strong:</strong> CDN handles read scale; Postgres easily handles write scale; counter aggregation async.</li>
  <li><strong>Deferred:</strong> custom aliases (lookup before insert), user accounts, abuse / spam URL detection.</li>
  <li><strong>Next:</strong> analytics dashboard; multi-region active-active.</li>
</ul>

<hr>

<h2>Case 2: Rate limiter</h2>

<h3>1. Clarify</h3>
<ul>
  <li>Per-user (JWT) rate limiting, "100 req/min".</li>
  <li>Distributed (multiple app servers behind LB).</li>
  <li>Approximate accuracy OK.</li>
  <li>Configurable per route (auth: stricter; reads: looser).</li>
</ul>

<h3>2. Estimate</h3>
<pre><code class="language-text">100M users; 1M concurrent; 12K RPS total
Rate limit checks: 12K/sec → ~50K peak
</code></pre>

<h3>3. High-level</h3>
<pre><code class="language-text">Client → LB → App server → Rate limiter middleware → Backend handler
                                  ↓
                          Redis (token bucket state)
</code></pre>

<h3>4. Deep dive: algorithms</h3>
<table>
  <thead><tr><th>Algorithm</th><th>Behavior</th><th>Tradeoff</th></tr></thead>
  <tbody>
    <tr><td>Fixed window</td><td>Count per minute bucket</td><td>Bursty at boundaries (2× allowed in 2 min)</td></tr>
    <tr><td>Sliding window log</td><td>Log timestamps; count last 60s</td><td>Memory grows with rate</td></tr>
    <tr><td>Sliding window counter</td><td>Weighted average of two buckets</td><td>Smooth + cheap; approximate</td></tr>
    <tr><td>Token bucket</td><td>Tokens regenerate at rate; consume per req</td><td>Allows burst up to capacity; intuitive</td></tr>
    <tr><td>Leaky bucket</td><td>Queue with fixed drain rate</td><td>Smooth output; hard to fit per-user</td></tr>
  </tbody>
</table>

<p><strong>Pick:</strong> token bucket via Redis Lua (atomic).</p>

<pre><code class="language-lua">-- token_bucket.lua
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])  -- tokens/sec
local now = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1]) or capacity
local ts = tonumber(data[2]) or now

local elapsed = math.max(0, now - ts) / 1000
tokens = math.min(capacity, tokens + elapsed * rate)

local allowed = 0
if tokens &gt;= cost then
  tokens = tokens - cost
  allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', key, 60000)
return { allowed, tokens }
</code></pre>

<h3>5. Scale + reliability</h3>
<ul>
  <li><strong>Throughput:</strong> 50K checks/sec → single Redis (100K ops/sec) handles. At 10×: Redis cluster, shard by user_id.</li>
  <li><strong>Failure mode (Redis down):</strong> Fail-open (allow all) for analytics; fail-closed (block all) for auth. Configurable per route.</li>
  <li><strong>Headers:</strong> <code>RateLimit-Remaining</code>, <code>RateLimit-Reset</code>, <code>Retry-After</code> on 429.</li>
  <li><strong>Tiered limits:</strong> different rate per user tier (free / pro / enterprise).</li>
  <li><strong>Hot key:</strong> if one user gets 50% of traffic, that Redis shard saturates. Mitigation: per-user Lua script local to one node; or in-memory rate limit per app server with periodic Redis sync (eventually consistent).</li>
</ul>

<h3>6. Wrap-up</h3>
<ul>
  <li><strong>Strong:</strong> token bucket via atomic Lua; Redis cluster scales linearly; per-route + per-tier policies.</li>
  <li><strong>Deferred:</strong> burst credit pools; integration with billing for overage.</li>
  <li><strong>Next:</strong> chaos test fail-open vs fail-closed paths; benchmark under load.</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Cases 3-4',
      html: `
<h2>Case 3: Twitter feed</h2>

<h3>1. Clarify</h3>
<ul>
  <li>Tweets, follows, home timeline (feed of followed users), likes.</li>
  <li>Out: search, hashtags, DMs, retweets, media.</li>
  <li>Scale: 100M registered, 10M DAU, reads 100× writes, P99 feed &lt; 1s.</li>
</ul>

<h3>2. Estimate</h3>
<pre><code class="language-text">Writes: 10M DAU × 5 tweets/day / 86400s ≈ 600/sec; peak ~1.8K/sec
Reads: 100× → 60K/sec average; peak 180K/sec

Storage:
- Tweet: ~500B (incl indexes) × 100M users × 1000 tweets/user = 50TB
- Follow graph: 100M × 200 follows × 32B ≈ 640GB

Bandwidth:
- 180K reads/sec × 5KB feed page = 900MB/s peak
- CDN absorbs cached portion
</code></pre>

<h3>3. High-level</h3>
<pre><code class="language-text">Client → CDN → LB → App servers
                       ↓
                  ┌────┴────┬─────┐
                  ↓         ↓     ↓
              Tweet store Cache  Follow graph
              (sharded   (Redis: (sharded
               Postgres)  feeds) Postgres)

Background workers: feed fan-out service (push) + feed builder (pull)
</code></pre>

<h3>4. Deep dive: fan-out</h3>
<table>
  <thead><tr><th>Strategy</th><th>How</th><th>Pro / Con</th></tr></thead>
  <tbody>
    <tr><td>Push (fan-out on write)</td><td>On tweet, write to all followers' feed caches</td><td>O(1) feed read; expensive write for popular users</td></tr>
    <tr><td>Pull (fan-out on read)</td><td>On feed read, fetch each follow's recent tweets; merge</td><td>Cheap write; expensive read; hard at scale</td></tr>
    <tr><td>Hybrid</td><td>Push for normal users; pull for celebs</td><td>Best of both; complexity</td></tr>
  </tbody>
</table>

<p><strong>Pick:</strong> hybrid. For users with &lt; 10K followers, push. For celebs (&gt; 10K), pull at read time. Merge results.</p>

<pre><code class="language-text">Tweet flow:
1. User A tweets → INSERT into tweets_userA shard
2. Emit event "tweet.created"
3. Fan-out service:
   - Get A's follower list
   - If A has &lt; 10K followers: push tweet ID to each follower's feed cache (Redis sorted set, score = timestamp)
   - If A has ≥ 10K followers: do nothing (pull-based)

Feed read flow:
1. Get user B's feed cache (Redis sorted set, top 1000)
2. Get B's celebrity follows; for each, fetch recent tweets from tweet store
3. Merge cached + celeb tweets; sort by timestamp; return top N
4. Hydrate tweet IDs to full content (tweet store)
</code></pre>

<h3>5. Scale + reliability</h3>
<ul>
  <li><strong>Tweet store sharding:</strong> by user_id; consistent hashing; ~50TB / 10 shards = 5TB each — fits comfortably.</li>
  <li><strong>Follow graph sharding:</strong> by follower_id (most queries are "who do I follow"); 640GB sharded.</li>
  <li><strong>Feed cache:</strong> per-user sorted set of tweet IDs; capped at last 1000 entries; TTL 7 days for inactive.</li>
  <li><strong>Hot user (celebrity tweet read):</strong> tweet store shard for that user takes hits; cache the tweet itself in Redis with high TTL.</li>
  <li><strong>Reliability:</strong> Postgres replicas; Redis with persistence + replication; degraded mode = pull-only feed if cache unavailable.</li>
  <li><strong>Observability:</strong> feed P99 latency; cache hit rate; fan-out service queue depth; tweet write rate.</li>
</ul>

<h3>6. Wrap-up</h3>
<ul>
  <li><strong>Strong:</strong> hybrid fan-out balances cost; sharded stores scale linearly; Redis-fed feeds give P99.</li>
  <li><strong>Deferred:</strong> ranking algorithm (currently chronological); spam detection; ads.</li>
  <li><strong>Next:</strong> celebrity-tweet caching; multi-region replication; analytics pipeline.</li>
</ul>

<hr>

<h2>Case 4: Chat (WhatsApp / Slack)</h2>

<h3>1. Clarify</h3>
<ul>
  <li>1:1 + group chats; text messages (no media in scope).</li>
  <li>Multi-device sync; offline queue; presence (online / offline / typing).</li>
  <li>Out: end-to-end encryption details; voice / video calls.</li>
  <li>Scale: 1B users, 100M concurrent, 10B messages/day.</li>
</ul>

<h3>2. Estimate</h3>
<pre><code class="language-text">Writes: 10B msgs/day / 86400s ≈ 115K msg/sec; peak ~350K/sec
Reads: similar (recipient receives) — fan-out factor varies

Storage:
- Each message: ~500B
- 10B msgs/day × 500B = 5TB/day storage
- 1 year: ~1.8PB

Connections:
- 100M concurrent WebSocket connections
- One server holds ~50K connections → 2K servers minimum
</code></pre>

<h3>3. High-level</h3>
<pre><code class="language-text">Client (WS) → LB (sticky session)
              ↓
         Connection servers (hold WebSockets)
              ↓
         Message bus (Kafka)
              ↓
         Workers:
         - Persist to message store
         - Fan-out to recipient connection servers
              ↓
         Message store (Cassandra/DynamoDB; partition by chat_id)

Push: FCM/APNs for offline users
</code></pre>

<h3>4. Deep dive: message ordering + delivery</h3>
<p><strong>Ordering challenge:</strong> in a group, messages from different senders must appear in consistent order across all recipients.</p>
<ul>
  <li>Per-chat partitioning: route all messages for chat X through one Kafka partition → ordered.</li>
  <li>Server-assigned monotonic sequence ID per chat.</li>
  <li>Clients track "last seen seq"; on reconnect, request "everything after seq N."</li>
</ul>

<p><strong>Multi-device sync:</strong></p>
<ul>
  <li>Each device tracks last seen sequence per chat.</li>
  <li>Server keeps message log per chat; on device reconnect, replay from last seen.</li>
  <li>"Read" status synced across devices via dedicated event.</li>
</ul>

<p><strong>Delivery semantics:</strong></p>
<ul>
  <li>At-least-once via Kafka + idempotent client (dedupe by message_id).</li>
  <li>Acks: client confirms receipt; server marks delivered; server confirms read.</li>
  <li>Push notification for offline users; "last seen" stored in DB.</li>
</ul>

<h3>5. Scale + reliability</h3>
<ul>
  <li><strong>WebSocket connections:</strong> 100M concurrent / 50K per server = 2000 connection servers. Sticky LB by user_id hash.</li>
  <li><strong>Message store:</strong> Cassandra by (chat_id, timestamp); partition handles per-chat throughput.</li>
  <li><strong>Hot chat (1M-member group):</strong> one partition saturates. Mitigation: split into sub-partitions by member range.</li>
  <li><strong>Presence:</strong> Redis (TTL on heartbeat); per-user; LRU.</li>
  <li><strong>Reliability:</strong> WebSocket disconnects on app background → push notification; on foreground, reconnect + replay missed messages.</li>
  <li><strong>Multi-region:</strong> active-active with Cassandra cross-region replication.</li>
</ul>

<h3>6. Wrap-up</h3>
<ul>
  <li><strong>Strong:</strong> per-chat ordering via Kafka; multi-device replay via sequence numbers; offline → push.</li>
  <li><strong>Deferred:</strong> E2E encryption (Signal protocol); media; voice/video.</li>
  <li><strong>Next:</strong> hot-group partitioning; cross-region consistency; specific dispatch optimizations.</li>
</ul>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Cases 5-6',
      html: `
<h2>Case 5: Uber dispatch</h2>

<h3>1. Clarify</h3>
<ul>
  <li>Match riders to nearby drivers; track driver locations; surge pricing.</li>
  <li>Out: payments (separate); ETA prediction (separate ML).</li>
  <li>Scale: 1M concurrent drivers; 10M concurrent riders; 10K rides/sec peak.</li>
</ul>

<h3>2. Estimate</h3>
<pre><code class="language-text">Driver location updates: 1M drivers × 1 update/4s ≈ 250K updates/sec
Ride requests: 10K/sec
Geo lookups: 10K rides/sec × ~100 candidates each = 1M lookups/sec
</code></pre>

<h3>3. High-level</h3>
<pre><code class="language-text">Driver app → Location service (WS) → Geo index (Redis Geo + sharded)
                                            ↑
Rider app → Ride request → Dispatch service
                                ↓
                       Match driver → Notify both
                                ↓
                       Trip store (Postgres)
</code></pre>

<h3>4. Deep dive: geospatial matching</h3>

<p><strong>Index choice:</strong></p>
<ul>
  <li><strong>Geohash:</strong> encode (lat, lon) into prefix-shareable string. Match on prefix length to rough area; KV lookup.</li>
  <li><strong>S2 / H3:</strong> hierarchical hex grid. More uniform than geohash; better for "nearby" queries.</li>
  <li><strong>Quadtree:</strong> dynamic spatial subdivision; in-memory.</li>
  <li><strong>PostGIS:</strong> Postgres extension; ST_DWithin; great if you already use Postgres but slower than purpose-built.</li>
  <li><strong>Redis Geo:</strong> built-in GEOADD / GEOSEARCH; in-memory; fast for small radius.</li>
</ul>

<p><strong>Pick:</strong> Redis Geo (or H3) + sharded by city. Each shard holds drivers in that city.</p>

<pre><code class="language-typescript">// Driver updates location
async function updateLocation(driverId: string, lat: number, lon: number) {
  const cityShard = getCityShard(lat, lon);
  await redis(cityShard).geoadd('drivers:available', lon, lat, driverId);
  await redis(cityShard).expire(\`drivers:available\`, 30); // TTL keeps stale out
}

// Match rider to nearest drivers
async function findNearest(lat: number, lon: number, count = 10) {
  const cityShard = getCityShard(lat, lon);
  return redis(cityShard).geosearch('drivers:available',
    { lon, lat }, { byradius: 5000, unit: 'm' },
    { count, asc: true, withCoord: true }
  );
}
</code></pre>

<p><strong>Dispatch algorithm:</strong></p>
<ol>
  <li>Find K nearest available drivers (Redis Geo).</li>
  <li>Send offer to nearest; wait T seconds for accept.</li>
  <li>If declined / timeout, offer to next.</li>
  <li>If all decline, expand radius.</li>
</ol>

<h3>5. Scale + reliability</h3>
<ul>
  <li><strong>Geo index:</strong> shard by city (~1000 cities); each shard handles ~1K drivers; Redis fits.</li>
  <li><strong>Location updates:</strong> 250K/sec → 250 ops/sec/shard; trivial for Redis.</li>
  <li><strong>Driver state machine:</strong> available, on_trip, offline. Updates via events on Kafka.</li>
  <li><strong>Trip persistence:</strong> Postgres sharded by trip_id (ride completion is rare event).</li>
  <li><strong>Surge pricing:</strong> per-zone counter (rides_requested / drivers_available); periodic job updates surge multiplier.</li>
  <li><strong>Reliability:</strong> WebSocket disconnect → driver marked offline after 30s TTL; rider reassigned if driver disconnects mid-trip.</li>
</ul>

<h3>6. Wrap-up</h3>
<ul>
  <li><strong>Strong:</strong> sharded geo index handles scale; driver state via WS + TTL handles disconnects; dispatch is simple greedy.</li>
  <li><strong>Deferred:</strong> ETA prediction (ML); fraud detection; multi-modal (Uber Eats / pool).</li>
  <li><strong>Next:</strong> geohash-based dispatch with batch matching; surge pricing fairness.</li>
</ul>

<hr>

<h2>Case 6: Notification system</h2>

<h3>1. Clarify</h3>
<ul>
  <li>Multi-channel (push, email, SMS); per-user preferences; quiet hours; transactional + marketing.</li>
  <li>Idempotency (don't send twice).</li>
  <li>Scale: 100M users; 10M notifications/sec peak (broadcast campaign).</li>
</ul>

<h3>2. Estimate</h3>
<pre><code class="language-text">Steady: 1M notifications/sec average; 10M peak (campaign send)
Per channel: 30% push, 50% email, 5% SMS, 15% in-app

External APIs:
- FCM/APNs: ~1M req/sec capacity (with quotas)
- SES email: per-account, per-region send-rate limit (varies by account; request increases and warm up your sending) — scales to thousands/sec once raised
- Twilio SMS: ~100/sec per number; multiple numbers needed
</code></pre>

<h3>3. High-level</h3>
<pre><code class="language-text">Producer (any service) → Notification API → Kafka topic
                                                ↓
                                       Notification engine
                                       (decides channels per user)
                                                ↓
                                  ┌──────┬─────┬────┬──────┐
                                  ↓      ↓     ↓    ↓      ↓
                                Push  Email  SMS  In-app  Webhook
                              workers workers workers workers workers
                                  ↓      ↓     ↓    ↓      ↓
                                FCM/APNs SES Twilio DB+WS  HTTP
</code></pre>

<h3>4. Deep dive: dedup + ordering</h3>

<p><strong>Idempotency:</strong></p>
<ul>
  <li>Each notification has <code>notification_id</code> + <code>user_id</code> + <code>channel</code>.</li>
  <li>Workers maintain dedup table: (notification_id, channel) → sent_at, with 7-day TTL.</li>
  <li>On retry, check dedup; skip if already sent.</li>
</ul>

<p><strong>User preferences:</strong></p>
<ul>
  <li>Per-user opt-in/opt-out per channel + per category.</li>
  <li>Quiet hours: timezone-aware; honor user's local time.</li>
  <li>Frequency capping: max N marketing notifications/day.</li>
  <li>Engine consults preferences before each channel send.</li>
</ul>

<p><strong>Per-channel throttling:</strong></p>
<ul>
  <li>Each external API has its own rate limit (FCM, SES, Twilio).</li>
  <li>Token bucket per channel (Redis Lua); workers consume tokens.</li>
  <li>If tokens exhausted: backoff + retry.</li>
</ul>

<p><strong>DLQ:</strong></p>
<ul>
  <li>Each channel has dedicated DLQ.</li>
  <li>After N retries, move to DLQ; alert for investigation.</li>
</ul>

<h3>5. Scale + reliability</h3>
<ul>
  <li><strong>Kafka partitioning:</strong> by user_id; per-user ordering preserved.</li>
  <li><strong>Workers:</strong> N per channel; auto-scale on queue depth.</li>
  <li><strong>External quotas:</strong> SES daily quota → batch + warm up; Twilio number pool for SMS.</li>
  <li><strong>Reliability:</strong> at-least-once delivery + idempotency = reliable; users may occasionally get duplicate (rare); notification_id dedupe at receiver / native deduplication via tag.</li>
  <li><strong>Observability:</strong> per-channel send rate; success rate; queue depth; DLQ count; SLO 99.5% delivered within 5 min.</li>
</ul>

<h3>6. Wrap-up</h3>
<ul>
  <li><strong>Strong:</strong> Kafka fan-out; per-channel workers; idempotency; quiet hours.</li>
  <li><strong>Deferred:</strong> personalization / ranking (which to send when many queued); A/B testing infra.</li>
  <li><strong>Next:</strong> ML for send-time optimization; cost-aware channel selection.</li>
</ul>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Cases 7-8',
      html: `
<h2>Case 7: Distributed counter</h2>

<h3>1. Clarify</h3>
<ul>
  <li>Counter for "post likes" (or page views, votes, etc.).</li>
  <li>Scale: 1M increments/sec on hot keys; 10K-1M unique counters; eventual consistency OK.</li>
  <li>Reads: serve current count to UI; tolerate few-second lag.</li>
</ul>

<h3>2. Estimate</h3>
<pre><code class="language-text">Writes: 1M ops/sec (hot key); 10M ops/sec across all counters
Reads: 100M/sec (every page view)
Storage: 10M counters × 16B ≈ 160MB; trivial
</code></pre>

<h3>3. High-level</h3>
<pre><code class="language-text">Client → App server → Counter service
                          ↓
                    Redis (per-counter sharded if hot)
                          ↓
                    Periodic flush
                          ↓
                    Postgres (cold storage; analytics)
</code></pre>

<h3>4. Deep dive: hot-key contention</h3>

<p>One Redis key for hot counter saturates one server (single-thread Redis at 100K ops/sec).</p>

<p><strong>Sharded counter:</strong></p>
<ul>
  <li>Split logical counter into N physical keys (shards).</li>
  <li>Increment: pick random shard.</li>
  <li>Read: SUM across all shards.</li>
</ul>

<pre><code class="language-typescript">async function increment(counterId: string) {
  const shard = Math.floor(Math.random() * 10);
  await redis.incr(\`counter:\${counterId}:\${shard}\`);
}

async function getCount(counterId: string): Promise&lt;number&gt; {
  const pipeline = redis.multi();
  for (let i = 0; i &lt; 10; i++) pipeline.get(\`counter:\${counterId}:\${i}\`);
  const results = await pipeline.exec();
  return results.reduce((sum, [, val]) =&gt; sum + Number(val ?? 0), 0);
}
</code></pre>

<p>10 shards: 10× write throughput. Scales linearly with shard count.</p>

<p><strong>Periodic flush to DB:</strong></p>
<ul>
  <li>Background job sums all shards every 1 min.</li>
  <li>Writes total to Postgres for cold-storage / analytics.</li>
  <li>Resets shards (or uses delta-flush for accuracy).</li>
</ul>

<p><strong>Eventual consistency considerations:</strong></p>
<ul>
  <li>Read may see slightly different values across shards if not summing atomically (race during increment).</li>
  <li>Acceptable for "likes" counter.</li>
  <li>For exact accounting (money), use single-key with optimistic locking + retry.</li>
</ul>

<h3>5. Scale + reliability</h3>
<ul>
  <li><strong>Auto-shard count:</strong> tune based on QPS per counter; popular counters get more shards.</li>
  <li><strong>Redis cluster:</strong> distribute counters across nodes; hot counter's shards spread across cluster.</li>
  <li><strong>DB durability:</strong> Postgres for source of truth; Redis as accelerator.</li>
  <li><strong>Reliability:</strong> Redis with replication; on failure, replicas take over; brief miss tolerated.</li>
</ul>

<h3>6. Wrap-up</h3>
<ul>
  <li><strong>Strong:</strong> sharding handles hot keys; periodic flush keeps DB authoritative.</li>
  <li><strong>Deferred:</strong> per-user vote tracking (separate concern); rate-limit increments (anti-spam).</li>
  <li><strong>Next:</strong> CRDT-based counters for multi-region; hot-key auto-detection + dynamic shard adjustment.</li>
</ul>

<hr>

<h2>Case 8: Payment system</h2>

<h3>1. Clarify</h3>
<ul>
  <li>Charge customers; refund; subscription billing.</li>
  <li>Out: fraud detection (ML; separate); UI.</li>
  <li>Scale: 1M charges/day peak (modest scale; correctness matters more than throughput).</li>
  <li>Constraints: no double-charges; full audit trail; eventual reconciliation with provider.</li>
</ul>

<h3>2. Estimate</h3>
<pre><code class="language-text">Writes: 1M charges/day / 86400s ≈ 12/sec; peak ~120/sec (low; correctness is the constraint)
Storage: ~1KB per charge × 1M/day × 365 = 365GB/year (manageable)
</code></pre>

<h3>3. High-level</h3>
<pre><code class="language-text">Merchant → Payment API → Idempotency check → Saga
                                                ↓
                                    Authorize (call Stripe)
                                                ↓
                                    Capture (call Stripe)
                                                ↓
                                    Update double-entry ledger
                                                ↓
                                    Emit "payment.completed" event
                                                ↓
                                    Background reconciliation (daily)
                                          (compare our ledger vs Stripe)
</code></pre>

<h3>4. Deep dive: idempotency + ledger</h3>

<p><strong>Idempotency key:</strong></p>
<ul>
  <li>Caller passes <code>Idempotency-Key</code> header (UUID).</li>
  <li>Server: insert into <code>idempotency_records (key, request_hash, response, created_at)</code> with unique constraint.</li>
  <li>On duplicate key:
    <ul>
      <li>If request hash matches: return stored response.</li>
      <li>If request hash differs: return 422 (key reuse mismatch).</li>
    </ul>
  </li>
  <li>TTL: 24-48h.</li>
</ul>

<p><strong>Double-entry ledger:</strong></p>
<pre><code class="language-sql">CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  amount_cents BIGINT NOT NULL,    -- negative = debit, positive = credit
  currency CHAR(3) NOT NULL,
  transaction_id UUID NOT NULL,    -- groups debit + credit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- For every operation, create matching debit + credit
-- Charge $10 from customer_acct_42 to merchant_acct_99:
BEGIN;
  INSERT INTO ledger_entries (account_id, amount_cents, currency, transaction_id)
  VALUES ('customer_acct_42', -1000, 'USD', 'tx-uuid-1');
  INSERT INTO ledger_entries (account_id, amount_cents, currency, transaction_id)
  VALUES ('merchant_acct_99', 1000, 'USD', 'tx-uuid-1');
COMMIT;
</code></pre>

<p>Invariants:</p>
<ul>
  <li>Sum of all entries per transaction_id = 0 (double-entry).</li>
  <li>Sum of entries per account_id = current balance.</li>
  <li>Both sides written in same DB transaction.</li>
</ul>

<p><strong>Saga across services:</strong></p>
<pre><code class="language-text">1. Authorize charge (Stripe API) — payment gateway holds funds
2. Persist authorization to our ledger (debit, awaiting capture)
3. Trigger fulfillment workflow
4. On fulfill success → capture (Stripe API)
5. Update ledger: move from "awaiting" to "captured"
6. Emit event for downstream (analytics, accounting)

If step 4 fails:
  Compensate: release authorization (Stripe void)
  Update ledger: rollback debit
</code></pre>

<h3>5. Scale + reliability</h3>
<ul>
  <li><strong>Throughput modest;</strong> single Postgres handles. Scale via read replicas for reporting.</li>
  <li><strong>Reliability:</strong> Postgres primary + sync replica; PITR (point-in-time recovery); offsite backup.</li>
  <li><strong>Reconciliation:</strong> nightly job compares our ledger vs Stripe API; flags discrepancies (rare; investigate).</li>
  <li><strong>Audit trail:</strong> append-only ledger; never UPDATE / DELETE; corrections via additional entries.</li>
  <li><strong>Refunds:</strong> reverse-direction ledger entries.</li>
  <li><strong>Multi-currency:</strong> each transaction in source currency; FX conversion at settlement; record both.</li>
</ul>

<h3>6. Wrap-up</h3>
<ul>
  <li><strong>Strong:</strong> idempotency prevents double-charge; double-entry ledger ensures correctness; saga handles cross-system transactions; reconciliation catches anomalies.</li>
  <li><strong>Deferred:</strong> fraud detection (separate ML system); subscription billing logic; international currency rules.</li>
  <li><strong>Next:</strong> 3DS / SCA flow for European compliance; recurring billing engine; webhook delivery to merchants.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Common Pitfalls',
      html: `
<h3>The 12 most common mistakes across all cases</h3>
<ol>
  <li><strong>Skipping clarification</strong> — building the wrong system.</li>
  <li><strong>No estimation</strong> — design ungrounded in scale.</li>
  <li><strong>Missing the hot key problem</strong> — design works for average user, breaks for celebrity / popular post.</li>
  <li><strong>Ignoring idempotency</strong> — retries cause duplicates.</li>
  <li><strong>Skipping the failure case</strong> — what happens when DB / region fails?</li>
  <li><strong>Tool soup</strong> — many DBs / queues / caches without coherent reason.</li>
  <li><strong>No observability</strong> — production-readiness gap.</li>
  <li><strong>Strong consistency by reflex</strong> — most things tolerate eventual.</li>
  <li><strong>Push-based fan-out everywhere</strong> — celebrity tweets break this.</li>
  <li><strong>Single-region design</strong> — global users; high latency.</li>
  <li><strong>Unbounded queues / counters</strong> — OOM at scale.</li>
  <li><strong>No wrap-up</strong> — interview ends without summary.</li>
</ol>

<h3>Pattern: identify hot key in every problem</h3>
<table>
  <thead><tr><th>Problem</th><th>Hot key</th><th>Mitigation</th></tr></thead>
  <tbody>
    <tr><td>Twitter</td><td>Celebrity tweet</td><td>Pull-based for celebrity follows</td></tr>
    <tr><td>Counter</td><td>Popular post likes</td><td>Sharded counter</td></tr>
    <tr><td>Chat</td><td>Large group</td><td>Sub-partition by member range</td></tr>
    <tr><td>URL shortener</td><td>Viral link</td><td>CDN cache absorbs</td></tr>
    <tr><td>Notification</td><td>Broadcast campaign</td><td>Per-channel rate limiting; pre-flight prep</td></tr>
    <tr><td>Uber</td><td>Airport / event hotspot</td><td>Sub-shard within city</td></tr>
    <tr><td>Payment</td><td>Top merchant</td><td>Sharded ledger by merchant_id</td></tr>
  </tbody>
</table>

<h3>Pattern: identify failure mode</h3>
<table>
  <thead><tr><th>Component</th><th>Failure</th><th>Mitigation</th></tr></thead>
  <tbody>
    <tr><td>DB primary</td><td>Crash</td><td>Replica + auto-failover; RTO ~30s</td></tr>
    <tr><td>Cache</td><td>Down</td><td>Fall through to DB; degrade gracefully</td></tr>
    <tr><td>Queue</td><td>Backed up</td><td>Backpressure; load shed; alert</td></tr>
    <tr><td>External API</td><td>Slow / down</td><td>Circuit breaker + fallback</td></tr>
    <tr><td>Region</td><td>Outage</td><td>Multi-region active-passive minimum</td></tr>
    <tr><td>WebSocket</td><td>Dropped</td><td>Reconnect + replay from sequence number</td></tr>
    <tr><td>Worker pool</td><td>Saturated</td><td>Bounded queue + 503 + Retry-After</td></tr>
  </tbody>
</table>

<h3>Pattern: identify the read path vs write path</h3>
<ul>
  <li>Reads: cacheable? CDN? Replica?</li>
  <li>Writes: idempotent? Sharded? Async?</li>
  <li>Asymmetry usually exists — exploit it (read replicas; CQRS).</li>
</ul>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Wrap-up',
      html: `
<h3>How to use these cases</h3>
<ol>
  <li>Read each case once for the technique (sharding, fan-out, idempotency, etc.).</li>
  <li>Re-do each case from scratch on a whiteboard, timed. Compare to the worked solution.</li>
  <li>Mock with a peer; have them throw curveballs ("what if 100×?", "what if region fails?").</li>
  <li>For each new prompt, recognize the pattern: feed-like? counter-like? chat-like? Apply the technique.</li>
</ol>

<h3>Cross-case patterns to memorize</h3>
<table>
  <thead><tr><th>Pattern</th><th>Where it appears</th></tr></thead>
  <tbody>
    <tr><td>Hot-key sharding</td><td>Counter, Twitter (celebs), Chat (large groups)</td></tr>
    <tr><td>Hybrid push/pull fan-out</td><td>Twitter, Notifications</td></tr>
    <tr><td>At-least-once + idempotency</td><td>Payments, Notifications, queues everywhere</td></tr>
    <tr><td>Cache + DB-as-source-of-truth</td><td>URL shortener, Twitter, all read-heavy systems</td></tr>
    <tr><td>Geographic sharding</td><td>Uber (city), CDN (region)</td></tr>
    <tr><td>Saga + compensation</td><td>Payments, multi-step workflows</td></tr>
    <tr><td>Event-driven with Kafka</td><td>Twitter fan-out, Chat ordering, Notifications</td></tr>
    <tr><td>Circuit breaker + fallback</td><td>External API integrations everywhere</td></tr>
    <tr><td>Sequence number replay</td><td>Chat (multi-device), WebSocket reconnect</td></tr>
    <tr><td>Token bucket via Redis</td><td>Rate limiter, API quotas</td></tr>
  </tbody>
</table>

<h3>Common interview-day reframings</h3>
<table>
  <thead><tr><th>Prompt</th><th>Recognized as</th></tr></thead>
  <tbody>
    <tr><td>"Design Pinterest"</td><td>Twitter feed pattern</td></tr>
    <tr><td>"Design Facebook News Feed"</td><td>Twitter feed pattern</td></tr>
    <tr><td>"Design Yelp"</td><td>Uber dispatch (geo) + Twitter feed (reviews)</td></tr>
    <tr><td>"Design Tinder match"</td><td>Uber dispatch (geo) + custom matching</td></tr>
    <tr><td>"Design Slack"</td><td>Chat pattern</td></tr>
    <tr><td>"Design Dropbox"</td><td>Object storage + sync (chunked + delta)</td></tr>
    <tr><td>"Design Google Docs"</td><td>Real-time collab (CRDT / OT) + chat-like ordering</td></tr>
    <tr><td>"Design Stripe / payment processor"</td><td>Payment system</td></tr>
    <tr><td>"Design counters / analytics"</td><td>Distributed counter</td></tr>
    <tr><td>"Design TinyURL"</td><td>URL shortener</td></tr>
    <tr><td>"Design ride-sharing"</td><td>Uber dispatch</td></tr>
    <tr><td>"Design distributed cache"</td><td>Memcached / Redis + consistent hashing</td></tr>
    <tr><td>"Design Twitter trends"</td><td>Distributed counter + ranking</td></tr>
    <tr><td>"Design web crawler"</td><td>Queue + workers + dedup + rate limit per domain</td></tr>
  </tbody>
</table>

<h3>Final checklist before any system design interview</h3>
<ul>
  <li>☑ Memorize latency numbers (memory ~100ns, SSD ~100μs, RTT ~ms-100ms).</li>
  <li>☑ Memorize throughput ceilings (Postgres ~10K writes/sec, Redis ~100K ops/sec, Kafka ~1M msg/sec).</li>
  <li>☑ Memorize the 8 building blocks (LB, app, SQL, NoSQL, cache, queue, object storage, CDN).</li>
  <li>☑ Memorize the framework (clarify → estimate → high-level → deep dive → scale → wrap).</li>
  <li>☑ Practice 5 cases under time pressure; debrief.</li>
  <li>☑ Read 3 case studies from a real company blog (Twitter, Uber, Stripe engineering blogs).</li>
  <li>☑ Have answers ready for: "what about scale 10×?", "what if region X fails?", "what's the cost?"</li>
  <li>☑ Practice the 5-minute compressed walkthrough for short interviews.</li>
</ul>

<h3>Backend module summary</h3>
<p>This module covers backend prep + system design as a complete unit:</p>
<ul>
  <li><strong>Fundamentals</strong> — request lifecycle, runtime models, frameworks, middleware.</li>
  <li><strong>Databases</strong> — schema, indexes, transactions, isolation, NoSQL choice.</li>
  <li><strong>Caching</strong> — strategies, invalidation, persistence, hot keys.</li>
  <li><strong>Queues</strong> — at-least-once + idempotency, outbox, saga, DLQ.</li>
  <li><strong>Architecture</strong> — monolith / modular / microservices; BFF; event-driven; CQRS; hexagonal.</li>
  <li><strong>Resilience</strong> — timeouts, retries, circuit breakers, bulkheads, fallback, chaos.</li>
  <li><strong>Observability</strong> — logs / metrics / traces, SLOs, error budgets, alerting.</li>
  <li><strong>SD Framework</strong> — the structured approach to any system design prompt.</li>
  <li><strong>SD Cases</strong> (this topic) — 8 worked examples covering core patterns.</li>
</ul>
<p>9 topics. Together: enough backend literacy to pass FAANG senior+ system design rounds; collaborate effectively with backend teams; design + own a BFF or service end-to-end.</p>
`
    }
  ]
});
