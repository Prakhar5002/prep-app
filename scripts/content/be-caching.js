window.PREP_SITE.registerTopic({
  id: 'be-caching',
  module: 'backend',
  title: 'Caching',
  estimatedReadTime: '50 min',
  tags: ['cache', 'redis', 'memcached', 'cdn', 'cache-aside', 'write-through', 'invalidation', 'ttl', 'thundering-herd'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Caching is the universal scaling lever — it turns expensive computation into cheap memory lookup. Get it right and your system flies; get invalidation wrong and users see stale data, support tickets pile up, and you debug the worst kind of bug. Phil Karlton: <em>"There are only two hard things in computer science: cache invalidation and naming things."</em></p>
<ul>
  <li><strong>5 cache layers</strong> in a typical web stack: browser HTTP cache → CDN edge → reverse proxy → app memory → distributed (Redis/memcached). Each has different TTLs + invalidation rules.</li>
  <li><strong>Cache-aside (lazy)</strong> is the default pattern: read miss → fetch from source → populate cache. Write goes to source; cache invalidated separately.</li>
  <li><strong>Write strategies:</strong> write-through (sync; consistent, slower writes), write-behind (async; fast writes, risk of loss), write-around (skip cache on write; populate on read).</li>
  <li><strong>Invalidation patterns:</strong> TTL-based (simple), event-driven (precise), versioned key (atomic), tags (group invalidation).</li>
  <li><strong>Redis</strong> is the de facto distributed cache; also serves queues, pub/sub, rate-limit, locks, sorted sets (leaderboards). <em>Licensing note:</em> Redis moved off the open-source BSD license to SSPL/RSAL in March 2024, triggering the Linux Foundation's <strong>Valkey</strong> fork (backed by AWS/Google/Oracle); Redis then returned to open source under AGPLv3 with Redis 8 (May 2025). AWS ElastiCache and Google Memorystore now default new deployments to Valkey — everything here applies to both since they share the protocol.</li>
  <li><strong>Common pitfalls:</strong> thundering herd, cache stampede, stale reads after writes, hot keys, inconsistent layered TTLs.</li>
  <li><strong>Cache hit ratio</strong> is the primary metric — aim for &gt;95% on hot paths.</li>
  <li><strong>Don't cache everything.</strong> Cache when reads &gt;&gt; writes, computation is expensive, and stale-by-N-seconds is acceptable.</li>
</ul>
<p><strong>Mantra:</strong> "Cache for read amplification. TTL by default. Invalidate by event when correctness matters. Single-flight to avoid stampedes. Measure hit rate."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What caching is, technically</h3>
<p>Storing the result of an expensive operation (DB query, computation, external API call, file read) in a faster-access medium (memory, local disk, SSD, CDN) so that subsequent requests return without redoing the work.</p>

<h3>Why caching dominates scaling discussions</h3>
<table>
  <thead><tr><th>Without cache</th><th>With cache</th></tr></thead>
  <tbody>
    <tr><td>1000 req/s × 50ms DB query = 50s of DB work</td><td>950 req/s served from cache (1ms each); 50 req/s hit DB (50ms)</td></tr>
    <tr><td>DB is the bottleneck; vertical scale costs $$</td><td>Redis costs cents; primary stays light</td></tr>
    <tr><td>Cold-cache regions = poor UX</td><td>CDN edge cache = ms latency globally</td></tr>
    <tr><td>External API rate limits hit</td><td>Cache 1-min responses; 100× fewer calls</td></tr>
    <tr><td>Computed feeds recomputed per request</td><td>Cached for 60s; compute once per minute</td></tr>
  </tbody>
</table>

<h3>The cache-stack</h3>
<pre><code class="language-text">Client request
   ↓
1. Browser HTTP cache         (Cache-Control / ETag; per-user)
   ↓
2. CDN edge                   (Cloudflare / Fastly / CloudFront)
   ↓
3. Reverse proxy / app cache  (Nginx + memcached or app memory LRU)
   ↓
4. App-process memory         (Node global Map / LRU lib; per-instance)
   ↓
5. Distributed cache          (Redis / memcached cluster; shared)
   ↓
6. Database
</code></pre>

<p>Each layer has tradeoffs (locality, capacity, consistency, cost). Production systems often use 3-4 layers concurrently.</p>

<h3>When to cache</h3>
<table>
  <thead><tr><th>Cache when</th><th>Don't cache when</th></tr></thead>
  <tbody>
    <tr><td>Reads &gt;&gt; writes</td><td>Writes ≥ reads (cache invalidation cost &gt; benefit)</td></tr>
    <tr><td>Source query expensive</td><td>Source query already &lt; 5ms</td></tr>
    <tr><td>Stale-by-N-seconds acceptable</td><td>Strict consistency required (financial balances, locks)</td></tr>
    <tr><td>Same data accessed by many users</td><td>Per-user data with low repeat access</td></tr>
    <tr><td>Expensive external API call</td><td>API requires fresh response (real-time pricing)</td></tr>
  </tbody>
</table>

<h3>What "good caching" looks like</h3>
<ul>
  <li>Each cache layer has a documented TTL + invalidation strategy.</li>
  <li>Cache key includes everything that affects the result (user id, tenant, version, params).</li>
  <li>Cache-aside pattern; cache absent → fetch + populate; never cache absent → block forever.</li>
  <li>Single-flight: only one fetcher per key; others wait for the result.</li>
  <li>Stale-while-revalidate: serve stale while async refresh.</li>
  <li>Hit-rate dashboards per cache layer; alert on drops.</li>
  <li>TTL with jitter (±10%) to avoid synchronized expiration.</li>
  <li>Negative caching for "not found" results (with shorter TTL).</li>
  <li>Eviction policy chosen deliberately (LRU, LFU, TTL).</li>
</ul>

<h3>What "bad caching" looks like</h3>
<ul>
  <li>Cache key forgets one variable; users see each other's data.</li>
  <li>No TTL; stale forever.</li>
  <li>Update primary; forget cache invalidation; users see old data for hours.</li>
  <li>1000 concurrent requests hit cache miss; all fire DB query (thundering herd).</li>
  <li>Hot key on Redis; one machine saturates; latency spikes.</li>
  <li>Cache layer goes down; all traffic hits DB; cascading failure.</li>
  <li>Caching everything indiscriminately; complex invalidation; bugs everywhere.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The 4 main caching strategies</h3>
<table>
  <thead><tr><th>Strategy</th><th>Read</th><th>Write</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td><strong>Cache-aside (lazy)</strong></td><td>Cache → miss → DB → populate cache → return</td><td>DB only; invalidate cache on success</td><td>Default; most flexible</td></tr>
    <tr><td><strong>Read-through</strong></td><td>Cache (cache fetches from DB on miss)</td><td>DB; cache notified to invalidate</td><td>Cache library handles fetching</td></tr>
    <tr><td><strong>Write-through</strong></td><td>Cache</td><td>Cache + DB synchronously; both succeed or rollback</td><td>Strong consistency required</td></tr>
    <tr><td><strong>Write-behind (write-back)</strong></td><td>Cache</td><td>Cache immediately; DB async via queue</td><td>Write-heavy workloads; risk of data loss</td></tr>
    <tr><td><strong>Write-around</strong></td><td>Cache → miss → DB → populate → return</td><td>DB only; cache stays empty until next read</td><td>Write-once-read-rarely</td></tr>
  </tbody>
</table>

<h3>Invalidation strategies</h3>
<table>
  <thead><tr><th>Pattern</th><th>How</th><th>Tradeoff</th></tr></thead>
  <tbody>
    <tr><td><strong>TTL-based</strong></td><td>Cache expires after N seconds</td><td>Simple; staleness up to TTL</td></tr>
    <tr><td><strong>Event-driven</strong></td><td>On write, explicitly delete / update cache key</td><td>Precise; complexity per write site</td></tr>
    <tr><td><strong>Versioned key</strong></td><td>Cache key includes version; bump version invalidates</td><td>Atomic; no race; old keys dangle until evicted</td></tr>
    <tr><td><strong>Tag-based</strong></td><td>Each entry tagged; invalidate all entries with tag</td><td>Group invalidation; tag bookkeeping</td></tr>
    <tr><td><strong>Write-through</strong></td><td>Update both atomically</td><td>No stale window; slower writes</td></tr>
  </tbody>
</table>

<h3>Cache key design</h3>
<p>Bad cache keys are the source of most cache bugs. Good keys:</p>
<ul>
  <li>Include every variable that affects the result: user id, tenant, locale, version.</li>
  <li>Are deterministic — same input → same key.</li>
  <li>Are namespaced — <code>app:v1:user:42:profile</code>.</li>
  <li>Survive deploys — version in key avoids cross-deploy contamination on schema change.</li>
</ul>

<pre><code class="language-typescript">function userProfileKey(userId: string, locale: string, version = 'v3') {
  return \`profile:\${version}:\${locale}:\${userId}\`;
}
</code></pre>

<h3>TTL selection</h3>
<table>
  <thead><tr><th>Data</th><th>TTL</th><th>Reason</th></tr></thead>
  <tbody>
    <tr><td>Static assets (with hash)</td><td>1 year</td><td>Hash changes on update; safe to cache forever</td></tr>
    <tr><td>HTML (auth'd)</td><td>30s–5min</td><td>Personalized; freshness matters</td></tr>
    <tr><td>API responses (read-heavy)</td><td>1–5min</td><td>Balance freshness vs hit rate</td></tr>
    <tr><td>User profile</td><td>5–15min + event invalidate</td><td>Updates infrequent</td></tr>
    <tr><td>Feed (timeline)</td><td>30–60s</td><td>New posts visible quickly</td></tr>
    <tr><td>Search results</td><td>5min</td><td>Fast-changing; keep short</td></tr>
    <tr><td>External API (rate-limited)</td><td>1–60min</td><td>Save quota</td></tr>
    <tr><td>Negative cache (not found)</td><td>30s–5min</td><td>Avoid hammering source for missing</td></tr>
  </tbody>
</table>

<p>Add jitter (±10%) so 1000 entries don't expire simultaneously, causing a stampede.</p>

<h3>The thundering herd</h3>
<pre><code class="language-text">Cache key 'feed:42' expires.
1000 requests for user 42 arrive concurrently.
All see cache miss.
All fire DB query simultaneously.
DB at 100% CPU; latency spikes; some requests time out.
Eventually one populates cache; others gave up.
</code></pre>

<p>Mitigations:</p>
<ul>
  <li><strong>Single-flight (request coalescing):</strong> first miss starts the fetch; subsequent misses wait for the same in-flight result.</li>
  <li><strong>Stale-while-revalidate (SWR):</strong> serve stale; first miss async-refreshes.</li>
  <li><strong>TTL jitter:</strong> spread expirations.</li>
  <li><strong>Soft TTL + hard TTL:</strong> soft = "refresh in background"; hard = "must refetch."</li>
  <li><strong>Pre-warming:</strong> populate cache before traffic hits.</li>
</ul>

<h3>Cache stampede vs thundering herd</h3>
<ul>
  <li><strong>Thundering herd:</strong> many concurrent misses on the same key.</li>
  <li><strong>Cache stampede:</strong> many keys expire near the same time; concurrent misses across keys.</li>
  <li>Both solved by single-flight + jitter + SWR.</li>
</ul>

<h3>Hot keys</h3>
<ul>
  <li>One key receives disproportionate traffic (popular post, viral content).</li>
  <li>One Redis node saturates; latency spikes.</li>
  <li>Mitigations: per-key client-side cache (multi-tier), key sharding (split by random suffix), denormalize hot data into multiple keys.</li>
</ul>

<h3>Eviction policies</h3>
<table>
  <thead><tr><th>Policy</th><th>Evicts</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>LRU (least recently used)</td><td>Oldest accessed</td><td>Most general; recent access predicts future</td></tr>
    <tr><td>LFU (least frequently used)</td><td>Least accessed</td><td>Long-lived hot keys</td></tr>
    <tr><td>FIFO</td><td>Oldest inserted</td><td>Simple; rarely best</td></tr>
    <tr><td>TTL only</td><td>Expired only</td><td>If you want strict expiration</td></tr>
    <tr><td>Random</td><td>Any</td><td>Cheap; surprisingly competitive</td></tr>
  </tbody>
</table>

<p>Redis policies: <code>noeviction</code>, <code>allkeys-lru</code>, <code>allkeys-lfu</code>, <code>volatile-lru</code> (LRU among keys with TTL), <code>volatile-ttl</code> (shortest TTL first).</p>

<h3>Memory budget</h3>
<ul>
  <li>Set <code>maxmemory</code> in Redis; without it, cache grows until OOM.</li>
  <li>Estimate: average value size × number of keys + overhead (~40 bytes per key).</li>
  <li>Monitor <code>used_memory</code> trend; alert at 80%.</li>
</ul>

<h3>Multi-tier (L1 / L2)</h3>
<pre><code class="language-text">L1: Process memory (per-instance LRU; ~ms; small)
   ↓ miss
L2: Redis (shared; ~1-5ms; large)
   ↓ miss
DB
</code></pre>

<p>L1 absorbs hot keys without hitting Redis network round trip. Tradeoff: L1 is per-instance, so consistency across instances is harder; use very short TTL.</p>

<h3>Negative caching</h3>
<pre><code class="language-typescript">// User asks for "/users/missing-id"; DB returns nothing.
// Without negative cache: every request hits DB.
// With negative cache: cache "absence" with short TTL.

async function getUser(id: string) {
  const cached = await cache.get(\`user:\${id}\`);
  if (cached === '__NULL__') return null;
  if (cached) return JSON.parse(cached);

  const user = await db.users.findUnique({ where: { id } });
  if (user) {
    await cache.set(\`user:\${id}\`, JSON.stringify(user), { ex: 300 });
  } else {
    await cache.set(\`user:\${id}\`, '__NULL__', { ex: 30 });
  }
  return user;
}
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Cache-aside in code</h3>
<pre><code class="language-typescript">import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function getUserProfile(userId: string) {
  const key = \`profile:v1:\${userId}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const user = await db.query('SELECT id, name, bio, avatar_url FROM users WHERE id = $1', [userId]);
  if (!user.rows[0]) return null;

  // Set with TTL + jitter
  const ttl = 300 + Math.floor(Math.random() * 60); // 300-360s
  await redis.setex(key, ttl, JSON.stringify(user.rows[0]));

  return user.rows[0];
}

// Invalidate on update
async function updateUserProfile(userId: string, updates: object) {
  await db.query('UPDATE users SET ... WHERE id = $1', [userId]);
  await redis.del(\`profile:v1:\${userId}\`);
}
</code></pre>

<h3>Single-flight pattern</h3>
<pre><code class="language-typescript">const inFlight = new Map&lt;string, Promise&lt;any&gt;&gt;();

async function getCached&lt;T&gt;(key: string, fetcher: () =&gt; Promise&lt;T&gt;, ttl = 300): Promise&lt;T&gt; {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // If a request for this key is already in flight, await it
  if (inFlight.has(key)) return inFlight.get(key) as Promise&lt;T&gt;;

  const promise = (async () =&gt; {
    try {
      const value = await fetcher();
      await redis.setex(key, ttl, JSON.stringify(value));
      return value;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}
</code></pre>

<p>This handles per-instance single-flight. For cross-instance, use Redis SETNX with a "fetching" flag and have other instances poll briefly.</p>

<h3>Stale-while-revalidate</h3>
<pre><code class="language-typescript">type CachedValue&lt;T&gt; = { value: T; cachedAt: number };
const SOFT_TTL = 60_000;
const HARD_TTL = 300_000;

async function getSWR&lt;T&gt;(key: string, fetcher: () =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
  const raw = await redis.get(key);
  if (raw) {
    const parsed: CachedValue&lt;T&gt; = JSON.parse(raw);
    const age = Date.now() - parsed.cachedAt;

    if (age &lt; SOFT_TTL) return parsed.value; // fresh

    if (age &lt; HARD_TTL) {
      // stale-but-acceptable; refresh in background
      refreshInBackground(key, fetcher);
      return parsed.value;
    }
  }

  // Hard miss; must fetch
  const value = await fetcher();
  await redis.set(key, JSON.stringify({ value, cachedAt: Date.now() }), 'PX', HARD_TTL);
  return value;
}

async function refreshInBackground&lt;T&gt;(key: string, fetcher: () =&gt; Promise&lt;T&gt;) {
  if (refreshLocks.has(key)) return; // single-flight refresh
  refreshLocks.add(key);
  try {
    const value = await fetcher();
    await redis.set(key, JSON.stringify({ value, cachedAt: Date.now() }), 'PX', HARD_TTL);
  } finally {
    refreshLocks.delete(key);
  }
}

const refreshLocks = new Set&lt;string&gt;();
</code></pre>

<h3>Versioned cache keys</h3>
<pre><code class="language-typescript">// Schema change → bump version; old keys naturally expire
const KEY_VERSION = 'v3';

function userKey(id: string) {
  return \`user:\${KEY_VERSION}:\${id}\`;
}

// Invalidate ALL users at once: bump KEY_VERSION; redeploy.
// Old v2 keys remain in cache, evicted by LRU/TTL.
</code></pre>

<h3>Tag-based invalidation</h3>
<pre><code class="language-typescript">// Store tag → keys map; invalidate by tag = delete all keys with that tag
async function setWithTags(key: string, value: any, tags: string[], ttl: number) {
  const pipeline = redis.multi();
  pipeline.setex(key, ttl, JSON.stringify(value));
  for (const tag of tags) {
    pipeline.sadd(\`tag:\${tag}\`, key);
    pipeline.expire(\`tag:\${tag}\`, ttl + 60);
  }
  await pipeline.exec();
}

async function invalidateTag(tag: string) {
  const keys = await redis.smembers(\`tag:\${tag}\`);
  if (keys.length &gt; 0) await redis.del(...keys, \`tag:\${tag}\`);
}

// Usage
await setWithTags(\`post:42\`, post, ['user:123', 'feed'], 300);
await invalidateTag('user:123'); // user 123's posts all invalidated
</code></pre>

<h3>Multi-tier (process + Redis)</h3>
<pre><code class="language-typescript">import LRU from 'lru-cache';

const l1 = new LRU&lt;string, any&gt;({ max: 10_000, ttl: 5_000 });

async function getMultiTier&lt;T&gt;(key: string, fetcher: () =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
  // L1
  const l1hit = l1.get(key);
  if (l1hit !== undefined) return l1hit;

  // L2 (Redis)
  const l2raw = await redis.get(key);
  if (l2raw) {
    const value = JSON.parse(l2raw);
    l1.set(key, value);
    return value;
  }

  // Miss
  const value = await fetcher();
  await redis.setex(key, 300, JSON.stringify(value));
  l1.set(key, value);
  return value;
}
</code></pre>

<h3>Distributed lock (Redis)</h3>
<pre><code class="language-typescript">// Used in single-flight refresh and other "only one worker should do this"
async function withLock&lt;T&gt;(lockKey: string, ttlMs: number, fn: () =&gt; Promise&lt;T&gt;): Promise&lt;T | null&gt; {
  const token = crypto.randomUUID();
  const acquired = await redis.set(lockKey, token, 'PX', ttlMs, 'NX');
  if (acquired !== 'OK') return null;

  try {
    return await fn();
  } finally {
    // Lua script to release only if we still hold the lock
    await redis.eval(
      \`if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end\`,
      1, lockKey, token
    );
  }
}
</code></pre>

<h3>Rate limiting via Redis</h3>
<pre><code class="language-typescript">// Sliding window via sorted set
async function rateLimit(key: string, limit: number, windowMs: number): Promise&lt;boolean&gt; {
  const now = Date.now();
  const start = now - windowMs;

  const pipeline = redis.multi();
  pipeline.zremrangebyscore(\`rl:\${key}\`, 0, start);
  pipeline.zadd(\`rl:\${key}\`, now, \`\${now}-\${crypto.randomUUID()}\`);
  pipeline.zcard(\`rl:\${key}\`);
  pipeline.expire(\`rl:\${key}\`, Math.ceil(windowMs / 1000));

  const [, , count] = await pipeline.exec();
  return (count[1] as number) &lt;= limit;
}
</code></pre>

<h3>Pub/sub for cross-instance invalidation</h3>
<pre><code class="language-typescript">const pub = redis;
const sub = new Redis(process.env.REDIS_URL);

// On write
async function updateUser(id: string, updates: object) {
  await db.query('UPDATE users SET ... WHERE id = $1', [id]);
  const cacheKey = \`user:\${id}\`;
  await redis.del(cacheKey);
  await pub.publish('cache-invalidate', cacheKey); // tell L1 caches
}

// On boot, each instance subscribes
sub.subscribe('cache-invalidate');
sub.on('message', (channel, key) =&gt; {
  l1.delete(key); // delete from in-process L1
});
</code></pre>

<h3>HTTP cache headers (browser + CDN)</h3>
<pre><code class="language-text">Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400
ETag: "abc123"
Last-Modified: Mon, 04 May 2026 10:00:00 GMT
Vary: Accept-Encoding, Authorization
</code></pre>

<table>
  <thead><tr><th>Header</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>max-age=N</code></td><td>Browser caches for N seconds</td></tr>
    <tr><td><code>s-maxage=N</code></td><td>Shared (CDN) caches for N seconds</td></tr>
    <tr><td><code>public</code></td><td>Cacheable by shared caches</td></tr>
    <tr><td><code>private</code></td><td>Browser only; no CDN</td></tr>
    <tr><td><code>no-cache</code></td><td>Must revalidate before serving</td></tr>
    <tr><td><code>no-store</code></td><td>Don't cache at all</td></tr>
    <tr><td><code>stale-while-revalidate=N</code></td><td>Serve stale up to N seconds while async refreshing</td></tr>
    <tr><td><code>Vary</code></td><td>Caches per listed headers; e.g., per-user via Authorization</td></tr>
  </tbody>
</table>

<h3>CDN purge</h3>
<pre><code class="language-typescript">// Cloudflare API example
await fetch(\`https://api.cloudflare.com/client/v4/zones/\${ZONE_ID}/purge_cache\`, {
  method: 'POST',
  headers: { Authorization: \`Bearer \${CF_TOKEN}\` },
  body: JSON.stringify({ files: [\`https://example.com/posts/\${id}\`] }),
});
</code></pre>

<h3>Postgres + materialized view as cache</h3>
<pre><code class="language-sql">-- Expensive aggregation cached in DB
CREATE MATERIALIZED VIEW user_stats AS
SELECT user_id, COUNT(*) AS post_count, MAX(created_at) AS last_post
FROM posts GROUP BY user_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;

CREATE INDEX ON user_stats (user_id);
</code></pre>

<p>Materialized views are an in-DB cache — fast reads, manual refresh. Useful when you want SQL access on top of the cached data.</p>

<h3>Common Redis data structures for caching</h3>
<table>
  <thead><tr><th>Structure</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>String (SET / GET)</td><td>Simple key-value cache</td></tr>
    <tr><td>Hash (HSET / HGET)</td><td>Object cache; partial reads/writes per field</td></tr>
    <tr><td>List (LPUSH / RPOP)</td><td>Recent N items, queue</td></tr>
    <tr><td>Set (SADD / SISMEMBER)</td><td>Membership, tags, deduplication</td></tr>
    <tr><td>Sorted set (ZADD / ZRANGE)</td><td>Leaderboards, rate limiting, time-ordered streams</td></tr>
    <tr><td>Stream (XADD / XREAD)</td><td>Event log, pub-sub with replay</td></tr>
    <tr><td>HyperLogLog (PFADD)</td><td>Approximate cardinality (unique visitors)</td></tr>
    <tr><td>Geo (GEOADD)</td><td>Location-based queries</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Cache user profile (cache-aside)</h3>
<pre><code class="language-typescript">async function getUserProfile(userId: string): Promise&lt;Profile | null&gt; {
  const key = \`profile:v2:\${userId}\`;

  const cached = await redis.get(key);
  if (cached === '__NULL__') return null;
  if (cached) return JSON.parse(cached);

  const result = await db.query(
    'SELECT id, username, display_name, bio, avatar_url FROM users WHERE id = $1',
    [userId]
  );
  const profile = result.rows[0] ?? null;

  if (profile) {
    const ttl = 600 + Math.floor(Math.random() * 60); // 10-11 min jitter
    await redis.setex(key, ttl, JSON.stringify(profile));
  } else {
    await redis.setex(key, 60, '__NULL__'); // negative cache
  }

  return profile;
}

async function updateUserProfile(userId: string, updates: Partial&lt;Profile&gt;) {
  await db.query('UPDATE users SET ... WHERE id = $1', [userId]);
  await redis.del(\`profile:v2:\${userId}\`);
}
</code></pre>

<h3>Example 2: Feed with SWR + single-flight</h3>
<pre><code class="language-typescript">async function getFeed(userId: string): Promise&lt;Post[]&gt; {
  const key = \`feed:\${userId}\`;
  return getSWR(key, () =&gt; computeFeed(userId), {
    softTtl: 60_000,
    hardTtl: 300_000,
  });
}

async function computeFeed(userId: string): Promise&lt;Post[]&gt; {
  // Expensive: join users + posts + likes; rank
  const result = await db.query(\`
    SELECT p.*, u.username
    FROM posts p
    JOIN follows f ON f.following_id = p.author_id AND f.follower_id = $1
    JOIN users u ON u.id = p.author_id
    ORDER BY p.created_at DESC
    LIMIT 100
  \`, [userId]);
  return result.rows;
}
</code></pre>

<h3>Example 3: Counter with periodic flush</h3>
<pre><code class="language-typescript">// Hot counter (post like count); update Redis frequently, DB every minute
async function incrementLikeCount(postId: string) {
  await redis.incr(\`like_count:\${postId}\`);
  await redis.zadd('counters:dirty', Date.now(), \`like:\${postId}\`);
}

async function flushDirtyCounters() {
  const dirty = await redis.zrange('counters:dirty', 0, -1);
  for (const item of dirty) {
    const [type, id] = item.split(':');
    if (type === 'like') {
      const count = await redis.get(\`like_count:\${id}\`);
      await db.query('UPDATE posts SET like_count = $1 WHERE id = $2', [count, id]);
    }
  }
  await redis.zremrangebyscore('counters:dirty', 0, Date.now());
}

// Run every 60s
setInterval(flushDirtyCounters, 60_000);
</code></pre>

<h3>Example 4: Hot-key sharding</h3>
<pre><code class="language-typescript">// Popular post views: split across 10 shards to spread load
async function incrementPostViews(postId: string) {
  const shard = Math.floor(Math.random() * 10);
  await redis.incr(\`views:\${postId}:\${shard}\`);
}

async function getPostViews(postId: string): Promise&lt;number&gt; {
  const pipeline = redis.multi();
  for (let i = 0; i &lt; 10; i++) pipeline.get(\`views:\${postId}:\${i}\`);
  const results = await pipeline.exec();
  return results.reduce((sum, [, val]) =&gt; sum + Number(val ?? 0), 0);
}
</code></pre>

<h3>Example 5: Cross-instance invalidation</h3>
<pre><code class="language-typescript">// L1 cache per instance + Redis pub/sub for invalidation
import LRU from 'lru-cache';

const l1 = new LRU&lt;string, any&gt;({ max: 10_000, ttl: 60_000 });
const sub = new Redis(process.env.REDIS_URL);

sub.subscribe('cache:invalidate');
sub.on('message', (_channel, key) =&gt; {
  l1.delete(key);
});

async function getMultiTier&lt;T&gt;(key: string, fetcher: () =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
  const l1hit = l1.get(key);
  if (l1hit !== undefined) return l1hit;

  const l2hit = await redis.get(key);
  if (l2hit) {
    const value = JSON.parse(l2hit);
    l1.set(key, value);
    return value;
  }

  const value = await fetcher();
  await redis.setex(key, 600, JSON.stringify(value));
  l1.set(key, value);
  return value;
}

async function invalidate(key: string) {
  await redis.del(key);
  await redis.publish('cache:invalidate', key); // notifies all instances
  l1.delete(key);
}
</code></pre>

<h3>Example 6: HTTP cache for API endpoint</h3>
<pre><code class="language-typescript">app.get('/api/products/:id', async (req, res) =&gt; {
  const product = await getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'not_found' });

  const etag = \`"\${product.updatedAt.getTime()}"\`;
  if (req.header('if-none-match') === etag) {
    return res.status(304).end();
  }

  res
    .set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
    .set('ETag', etag)
    .json(product);
});
</code></pre>

<h3>Example 7: Pre-warming</h3>
<pre><code class="language-typescript">// On deploy, warm cache for hottest content before traffic hits
async function warmCache() {
  const topProducts = await db.query('SELECT id FROM products ORDER BY view_count DESC LIMIT 1000');
  for (const { id } of topProducts.rows) {
    await getProduct(id); // populates cache
  }
}

// Run on app start (after warm-up flag flipped)
await warmCache();
</code></pre>

<h3>Example 8: Lock + leader for periodic task</h3>
<pre><code class="language-typescript">// Multiple app instances; only one should run the daily report
async function maybeRunDailyReport() {
  const lock = await withLock('locks:daily-report', 60_000, async () =&gt; {
    const lastRun = await redis.get('daily-report:last-run');
    if (lastRun &amp;&amp; Date.now() - parseInt(lastRun) &lt; 86_400_000) return;

    await runDailyReport();
    await redis.set('daily-report:last-run', Date.now().toString());
  });
}

setInterval(maybeRunDailyReport, 60 * 60_000);
</code></pre>

<h3>Example 9: Tag-based invalidation</h3>
<pre><code class="language-typescript">// Cache feed entries tagged by author; on author update, invalidate all
async function getCachedFeedEntry(postId: string): Promise&lt;FeedEntry&gt; {
  const key = \`feed_entry:\${postId}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const entry = await computeFeedEntry(postId);
  await setWithTags(key, entry, [\`author:\${entry.authorId}\`], 600);
  return entry;
}

async function onAuthorUpdate(authorId: string) {
  await invalidateTag(\`author:\${authorId}\`);
}
</code></pre>

<h3>Example 10: Hybrid Postgres LISTEN/NOTIFY for invalidation</h3>
<pre><code class="language-sql">-- Trigger fires NOTIFY on update
CREATE OR REPLACE FUNCTION notify_change() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('user_updated', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_change
AFTER UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION notify_change();
</code></pre>

<pre><code class="language-typescript">// App listens; invalidates cache
import { createClient } from 'pg';

const pgListener = createClient({ connectionString: process.env.DATABASE_URL });
await pgListener.connect();
await pgListener.query('LISTEN user_updated');

pgListener.on('notification', async ({ channel, payload }) =&gt; {
  if (channel === 'user_updated') {
    await redis.del(\`user:\${payload}\`);
  }
});
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Cache poisoning</h3>
<ul>
  <li>Bad data written to cache; subsequent reads return bad data until TTL.</li>
  <li>Sources: failed validation that still wrote, race condition with concurrent writes, deserialization bug.</li>
  <li>Mitigation: validate before writing; version cache keys so a deploy invalidates everything; have a "nuke cache" tool.</li>
</ul>

<h3>Read-after-write inconsistency</h3>
<ul>
  <li>User updates profile; redirected to view; reads from cache — sees old version.</li>
  <li>Mitigation: read-after-write reads from primary (skip cache for the user's own data for ~1s); or set + read from cache atomically; or write-through.</li>
</ul>

<h3>Cache-DB inconsistency on write</h3>
<pre><code class="language-text">Sequence A (cache-aside):
1. Update DB
2. Delete cache
   ✓ if both succeed; ✗ if step 2 fails → stale cache

Sequence B (cache-aside, double-delete):
1. Delete cache
2. Update DB
3. Delete cache again
   Handles race where another reader populated cache between 1 and 2.
</code></pre>

<p>For strict consistency, use write-through with transactional commit.</p>

<h3>TTL drift across layers</h3>
<ul>
  <li>Browser cache: 5min. CDN: 1min. App cache: 30s. They don't agree.</li>
  <li>Stale browser cache shows old data even after CDN purge.</li>
  <li>Mitigation: align TTLs (CDN ≥ app cache); use ETag for revalidation.</li>
</ul>

<h3>Hot-key tail latency</h3>
<ul>
  <li>One key gets 10× traffic of others; one Redis node CPU-saturated.</li>
  <li>Symptom: P99 spikes; P50 fine.</li>
  <li>Mitigation: client-side L1 cache for hot keys; key sharding (split write across N replicas, sum at read).</li>
</ul>

<h3>Cache cluster failover</h3>
<ul>
  <li>Redis primary fails; replica promoted; brief unavailability.</li>
  <li>If app blocks on cache, all requests time out.</li>
  <li>Mitigation: short timeouts on cache calls (50-200ms); fall back to DB on cache failure (degrade gracefully).</li>
</ul>

<h3>Cache as system of record</h3>
<ul>
  <li>Treating Redis as durable storage; data lost on eviction or failure.</li>
  <li>Cache is best-effort; DB is source of truth.</li>
  <li>Exception: Redis with persistence + replication for queues / sessions; treat as durable but back up.</li>
</ul>

<h3>Big keys</h3>
<ul>
  <li>One Redis key &gt; 1MB blocks the event loop on read/write.</li>
  <li>Mitigation: chunk large values; use hashes / lists / streams; compress.</li>
  <li>Detect with <code>redis-cli --bigkeys</code>.</li>
</ul>

<h3>Memory eviction surprises</h3>
<ul>
  <li>Cache fills; LRU evicts; suddenly hit rate drops.</li>
  <li>Items with no TTL vs short TTL — eviction policy decides priority.</li>
  <li>Monitor eviction rate; if high, increase memory or shorten TTLs.</li>
</ul>

<h3>Inconsistent cache between app instances</h3>
<ul>
  <li>App instance A's L1 cache populated; B's not. Different responses to the same query.</li>
  <li>Acceptable when stale-by-N-seconds is OK; mitigated by short L1 TTL.</li>
  <li>For consistency: invalidate cross-instance via pub/sub.</li>
</ul>

<h3>Cache key collision</h3>
<ul>
  <li>Two features use same key prefix; one's writes overwrite the other's reads.</li>
  <li>Mitigation: namespace per feature (<code>profile:</code> vs <code>billing:</code>); enforce via constants.</li>
</ul>

<h3>Negative caching gone wrong</h3>
<ul>
  <li>Cache "user not found" for 5 min; user signs up; cached "not found" overrides.</li>
  <li>Mitigation: short negative TTL (30s); on signup, explicit cache delete.</li>
</ul>

<h3>Prematurely caching</h3>
<ul>
  <li>Caching before profiling; trades complexity for negligible gain.</li>
  <li>Profile first; cache where the bottleneck is; measure hit rate after.</li>
</ul>

<h3>Forgotten cache invalidation</h3>
<ul>
  <li>Adding a write path that bypasses cache invalidation; users see stale data.</li>
  <li>Mitigation: centralize write paths; one function per entity that handles DB + cache.</li>
</ul>

<h3>Mobile + RN angle</h3>
<ul>
  <li>RN clients have their own cache layer (react-query, Apollo, MMKV-backed). Backend cache + client cache compose.</li>
  <li>Backend should respect <code>If-None-Match</code> + <code>ETag</code> from RN clients to enable client-side revalidation.</li>
  <li>Persistent client cache survives app close; pair with version stamp for safe migrations.</li>
  <li>Cellular networks: cache aggressively at backend so mobile clients hit warm responses.</li>
</ul>

<h3>Eviction analytics</h3>
<ul>
  <li>Track per-key access frequency; identify keys that are written but never read.</li>
  <li>Track hit rate per layer; alert on drops &gt; 10%.</li>
  <li>Track key size distribution; flag big keys.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common cache mistakes</h3>
<ol>
  <li><strong>No TTL.</strong> Stale forever.</li>
  <li><strong>No invalidation on write.</strong> Stale until TTL.</li>
  <li><strong>Cache key forgets a variable.</strong> User A sees user B's data.</li>
  <li><strong>Thundering herd.</strong> 1000 concurrent misses; all hit DB.</li>
  <li><strong>Cache as system of record.</strong> Eviction = data loss.</li>
  <li><strong>Big keys (&gt;1MB).</strong> Block Redis event loop.</li>
  <li><strong>No timeout on cache calls.</strong> Cache failure cascades to all requests.</li>
  <li><strong>Same TTL for everything.</strong> Synchronized expiration → stampede.</li>
  <li><strong>Caching everything.</strong> Complex invalidation; bugs everywhere.</li>
  <li><strong>Read-after-write reads stale.</strong> User confused.</li>
  <li><strong>Mixing fetch policies (cache-first + no-cache).</strong> Inconsistent state.</li>
  <li><strong>No hit-rate dashboard.</strong> Cache silently broken; you find out from users.</li>
</ol>

<h3>Anti-pattern: no TTL</h3>
<pre><code class="language-typescript">// BAD — stale forever
await redis.set(key, value);

// GOOD
await redis.setex(key, 300, value);
</code></pre>

<h3>Anti-pattern: no invalidation</h3>
<pre><code class="language-typescript">// BAD — write to DB; cache stays old
async function updateUser(id, updates) {
  await db.query('UPDATE users SET ... WHERE id = $1', [id]);
}

// GOOD
async function updateUser(id, updates) {
  await db.query('UPDATE users SET ... WHERE id = $1', [id]);
  await redis.del(\`user:\${id}\`);
}
</code></pre>

<h3>Anti-pattern: cache key missing variables</h3>
<pre><code class="language-typescript">// BAD — same key for any locale
const key = \`product:\${id}\`;

// GOOD
const key = \`product:v2:\${locale}:\${id}\`;
</code></pre>

<h3>Anti-pattern: stampede on cold cache</h3>
<pre><code class="language-typescript">// BAD — 1000 misses → 1000 DB queries
async function get(key, fetcher) {
  const cached = await redis.get(key);
  if (cached) return cached;
  return fetcher(); // no protection
}

// GOOD — single-flight
async function get(key, fetcher) {
  const cached = await redis.get(key);
  if (cached) return cached;
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = fetcher().finally(() =&gt; inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}
</code></pre>

<h3>Anti-pattern: blocking on cache</h3>
<pre><code class="language-typescript">// BAD — cache down → all requests time out
const value = await redis.get(key);

// GOOD — short timeout; fall back to DB
const value = await Promise.race([
  redis.get(key),
  new Promise((_, reject) =&gt; setTimeout(() =&gt; reject('cache_timeout'), 100)),
]).catch(() =&gt; null);

if (!value) return fetchFromDb();
</code></pre>

<h3>Anti-pattern: synchronized TTL</h3>
<pre><code class="language-typescript">// BAD — 1000 keys all expire at minute 5
await redis.setex(key, 300, value);

// GOOD — jitter
const ttl = 300 + Math.floor(Math.random() * 60);
await redis.setex(key, ttl, value);
</code></pre>

<h3>Anti-pattern: huge cached values</h3>
<pre><code class="language-typescript">// BAD — full user profile with all posts (10MB)
await redis.set(\`user:\${id}\`, JSON.stringify(fullUser));

// GOOD — narrow
await redis.set(\`user_meta:\${id}\`, JSON.stringify({ id, username, bio }));
await redis.set(\`user_posts:\${id}:page1\`, JSON.stringify(posts.slice(0, 20)));
</code></pre>

<h3>Anti-pattern: cache-as-DB</h3>
<pre><code class="language-typescript">// BAD — only stored in Redis
await redis.set(\`session:\${id}\`, JSON.stringify(session));
// Eviction or restart → user logged out

// GOOD — DB primary; cache for speed
await db.sessions.upsert({ id, ... });
await redis.setex(\`session:\${id}\`, 3600, JSON.stringify(session));
</code></pre>

<h3>Anti-pattern: mixed cache policies</h3>
<pre><code class="language-typescript">// BAD — some endpoints hit cache; others bypass; users see different state
useQuery(GET_USER, { fetchPolicy: 'cache-first' });
useQuery(GET_USER, { fetchPolicy: 'no-cache' });

// GOOD — pick one per query; document
const useUser = (id) =&gt; useQuery(GET_USER, { variables: { id }, fetchPolicy: 'cache-and-network' });
</code></pre>

<h3>Anti-pattern: no negative cache + repeat misses</h3>
<pre><code class="language-typescript">// BAD — every request for nonexistent user hits DB
async function getUser(id) {
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);
  return db.users.findUnique({ where: { id } });
}

// GOOD — cache "not found" briefly
async function getUser(id) {
  const cached = await redis.get(\`user:\${id}\`);
  if (cached === '__NULL__') return null;
  if (cached) return JSON.parse(cached);

  const user = await db.users.findUnique({ where: { id } });
  if (user) await redis.setex(\`user:\${id}\`, 600, JSON.stringify(user));
  else await redis.setex(\`user:\${id}\`, 60, '__NULL__');
  return user;
}
</code></pre>

<h3>Anti-pattern: forgotten invalidation paths</h3>
<p>Three places update the user (admin tool, user UI, background job). Two delete cache; one forgot. Centralize: <code>updateUser(id, updates)</code> handles both DB + cache; nothing else writes directly.</p>

<h3>Anti-pattern: write-through with weak transaction</h3>
<pre><code class="language-typescript">// BAD — cache populated; DB write fails
await redis.setex(\`user:\${id}\`, 600, JSON.stringify(updates));
await db.users.update({ ... }); // throws

// GOOD — DB first; cache only after DB commit
const user = await db.users.update({ ... });
await redis.setex(\`user:\${id}\`, 600, JSON.stringify(user));
</code></pre>

<h3>Anti-pattern: no metrics</h3>
<p>Without hit rate, eviction rate, key size dashboards, cache problems are invisible until users complain. Instrument; alert.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common cache interview prompts</h3>
<ol>
  <li>How would you cache [feed / user profile / leaderboard]?</li>
  <li>Compare cache-aside vs write-through.</li>
  <li>How do you invalidate cache on writes?</li>
  <li>How do you handle thundering herd?</li>
  <li>How would you scale Redis to 100k req/s?</li>
  <li>What's the difference between cache and CDN?</li>
  <li>How do you decide TTL?</li>
  <li>Tell me about a time you debugged a cache bug.</li>
</ol>

<h3>The 5-step framework for "design caching for X"</h3>
<ol>
  <li><strong>Identify hot reads:</strong> what's expensive + frequently accessed?</li>
  <li><strong>Pick layer + TTL:</strong> client cache, CDN, Redis, in-process — chosen by access pattern.</li>
  <li><strong>Pick strategy:</strong> cache-aside default; write-through if strict consistency; SWR for fast + acceptably stale.</li>
  <li><strong>Plan invalidation:</strong> TTL by default; event-driven on write; versioned key for schema changes.</li>
  <li><strong>Plan failure:</strong> short timeouts; degrade to DB; single-flight for stampedes.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Cache-aside by default — read miss populates; write invalidates. Most flexible. Write-through when strict consistency matters."</em></li>
  <li><em>"TTL with jitter (±10%) to avoid synchronized expirations. Single-flight to coalesce concurrent misses on the same key."</em></li>
  <li><em>"Stale-while-revalidate for fast reads + acceptable freshness — feed timelines, profile data."</em></li>
  <li><em>"Versioned keys for safe schema migrations — bump version, old keys naturally expire."</em></li>
  <li><em>"Multi-tier: in-process L1 + Redis L2. L1 absorbs hot keys; L2 shared across instances; pub/sub invalidation."</em></li>
  <li><em>"Negative caching for absent results — short TTL avoids hammering DB with 'not found' lookups."</em></li>
  <li><em>"Hit rate dashboard per layer; alert on drops. Eviction rate trending up = need more memory or shorter TTLs."</em></li>
  <li><em>"Cache is best-effort; DB is source of truth. Always degrade gracefully on cache failure."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"feed for many users"</td><td>SWR + per-user cache key + denorm hot data</td></tr>
    <tr><td>"counter that updates often"</td><td>Redis INCR + periodic flush to DB</td></tr>
    <tr><td>"leaderboard"</td><td>Redis sorted set</td></tr>
    <tr><td>"rate limit"</td><td>Redis sorted set or token bucket via Lua</td></tr>
    <tr><td>"hot key"</td><td>Multi-tier + key sharding</td></tr>
    <tr><td>"thundering herd"</td><td>Single-flight + jittered TTL + SWR</td></tr>
    <tr><td>"stale data after write"</td><td>Read-after-write from primary; or write-through</td></tr>
    <tr><td>"global low-latency reads"</td><td>CDN edge + ETag</td></tr>
    <tr><td>"cache user-personalized HTML"</td><td><code>Cache-Control: private</code> + Vary</td></tr>
    <tr><td>"schema change"</td><td>Bump cache key version</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch the request flow (browser → CDN → app → Redis → DB).</li>
  <li>Show one cache-aside read function.</li>
  <li>Show invalidation on write.</li>
  <li>Show single-flight.</li>
  <li>Show TTL with jitter.</li>
  <li>Talk hit-rate metric, eviction, big keys.</li>
  <li>Address failover degradation.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Multi-tier with pub/sub invalidation across instances."</em></li>
  <li><em>"Per-key access analytics to identify cold cache."</em></li>
  <li><em>"Pre-warming on deploy for hot content."</em></li>
  <li><em>"Hot-key sharding for the trending-post problem."</em></li>
  <li><em>"Postgres LISTEN/NOTIFY for trigger-based invalidation."</em></li>
  <li><em>"Materialized views for expensive aggregations."</em></li>
  <li><em>"CDN purge integration on critical content updates."</em></li>
  <li><em>"Stale-while-revalidate on critical user-facing reads."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Strategy fluency</td><td>Names cache-aside / write-through / SWR / write-behind</td></tr>
    <tr><td>Invalidation discipline</td><td>TTL + event-driven + versioned keys</td></tr>
    <tr><td>Stampede awareness</td><td>Single-flight + jitter + SWR</td></tr>
    <tr><td>Failure handling</td><td>Short timeouts; degrade to DB</td></tr>
    <tr><td>Layered understanding</td><td>Browser / CDN / app / Redis / DB</td></tr>
    <tr><td>Consistency awareness</td><td>Read-after-write; write-through; trade-offs</td></tr>
    <tr><td>Hot-key handling</td><td>Multi-tier + sharding</td></tr>
    <tr><td>Metrics instinct</td><td>Hit rate, eviction, key size</td></tr>
    <tr><td>Restraint</td><td>Doesn't cache prematurely</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN clients have their own cache (react-query, Apollo, MMKV-backed). Backend cache complements, doesn't replace.</li>
  <li>HTTP cache headers (<code>Cache-Control</code>, <code>ETag</code>) work with RN's fetch + Apollo's HTTP layer; respect them.</li>
  <li>Mobile networks: aggressive backend caching saves cellular bandwidth + battery.</li>
  <li>Persistent client caches must version-invalidate on schema change; backend can hint via API version header.</li>
  <li>Push notifications can trigger cache refresh (silent push to app to invalidate stale cache).</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How would you cache a feed for 1M users?"</em> — Per-user cache key (<code>feed:userId</code>); SWR; precompute for top users; on-demand for tail. TTL ~60s. Single-flight on miss.</li>
  <li><em>"Why use cache-aside over write-through?"</em> — Cache-aside is simpler, more flexible, works with any storage. Write-through requires synchronous coordination + may slow writes. Use write-through when the cache must never be stale (rare).</li>
  <li><em>"What's the hardest cache bug you've debugged?"</em> — Forgotten invalidation path, cache poisoning, hot key contention, cross-tenant leakage from missing key namespace.</li>
  <li><em>"How does Redis stay fast?"</em> — Single-threaded event loop; in-memory; tight data structures; no disk write on critical path (AOF / RDB async). Multi-thread limited to I/O.</li>
  <li><em>"How do you handle Redis failover?"</em> — Sentinel or Cluster auto-promotes replica; client retries; brief unavailability. Degrade to DB if cache call times out.</li>
  <li><em>"What's the difference between L1 in-process and Redis?"</em> — L1 is per-instance, no network, ms-scale, small. Redis is shared, network, ~1-5ms, large. Multi-tier combines both.</li>
  <li><em>"How would you implement rate limiting with Redis?"</em> — Sliding window via sorted set: ZADD timestamp; ZREMRANGEBYSCORE older than window; ZCARD count; allow if &lt; limit.</li>
  <li><em>"Why TTL jitter?"</em> — Without it, 1000 entries set at startup all expire simultaneously → mass cache miss → DB stampede. Jitter spreads expirations.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a small app with cache-aside + Redis; instrument hit rate.</li>
  <li>Implement single-flight; load-test; measure stampede mitigation.</li>
  <li>Add SWR for one hot read; observe perceived latency.</li>
  <li>Add multi-tier (L1 + Redis); pub/sub invalidation.</li>
  <li>Implement Redis sliding-window rate limiter.</li>
  <li>Read Redis docs on data structures (hash, sorted set, stream, HyperLogLog).</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'Designing Data-Intensive Applications' chapters on caching + replication."</li>
  <li>"Read Cloudflare / Vercel docs on edge caching strategies."</li>
  <li>"Build a tiny LRU + LFU implementation by hand to understand eviction."</li>
  <li>"Audit a real codebase's cache usage; find missing invalidations."</li>
</ul>
`
    }
  ]
});
