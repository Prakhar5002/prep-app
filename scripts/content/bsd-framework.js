window.PREP_SITE.registerTopic({
  id: 'bsd-framework',
  module: 'backend',
  title: 'Backend SD Framework',
  estimatedReadTime: '50 min',
  tags: ['system-design', 'framework', 'estimation', 'capacity-planning', 'tradeoffs', 'interview'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Backend system design interviews are 45-90 minutes of "design X at scale." Most candidates fail not from lack of knowledge but from <strong>poor structure</strong>. The framework below — clarify → estimate → high-level → deep dives → scale → wrap-up — is the difference between rambling for 60 minutes and confidently shipping a design.</p>
<ul>
  <li><strong>Spend the first 5-10 minutes clarifying scope.</strong> "Twitter" can be 5 features or 50; pin it.</li>
  <li><strong>Capacity estimates anchor decisions.</strong> 100 RPS or 100k RPS = different system.</li>
  <li><strong>High-level diagram first;</strong> agree on shape before diving in.</li>
  <li><strong>Deep dives where it matters</strong> — pick the 2-3 hardest parts; don't try to cover everything.</li>
  <li><strong>Scale + reliability + observability</strong> in the last third — bottleneck identification, partitioning, replication, monitoring.</li>
  <li><strong>Tradeoffs out loud:</strong> "I'm choosing X over Y because Z." Silent decisions get marked down.</li>
  <li><strong>5 reusable building blocks:</strong> load balancer, app servers, DB (SQL + NoSQL), cache (Redis), queue (Kafka / SQS), object storage (S3), CDN.</li>
  <li><strong>Don't memorize Twitter / Uber answers</strong> — internalize the framework so any prompt fits.</li>
</ul>
<p><strong>Mantra:</strong> "Clarify scope. Estimate scale. High-level shape. Deep-dive what's hard. Scale + reliability. Tradeoffs out loud. Restraint over completeness."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What backend system design interviews test</h3>
<table>
  <thead><tr><th>What they grade</th><th>What it tells them</th></tr></thead>
  <tbody>
    <tr><td>Structure under ambiguity</td><td>Can you make progress on an open-ended problem?</td></tr>
    <tr><td>Estimation skills</td><td>Do you have feel for scale + numbers?</td></tr>
    <tr><td>Tradeoff reasoning</td><td>Senior signal: name what you're not doing + why</td></tr>
    <tr><td>Communication</td><td>Can you collaborate? React to feedback?</td></tr>
    <tr><td>Knowledge breadth</td><td>Do you know the building blocks (cache, queue, replication)?</td></tr>
    <tr><td>Knowledge depth</td><td>Pick one part — can you go deep?</td></tr>
    <tr><td>Time management</td><td>Do you cover the prompt in 45-60 min?</td></tr>
  </tbody>
</table>

<h3>What they don't test</h3>
<ul>
  <li><strong>Memorization of "the" answer.</strong> Twitter has been designed 1000 ways; there's no canonical answer.</li>
  <li><strong>Encyclopedic knowledge of every tool.</strong> Pick one DB; know it well.</li>
  <li><strong>Production-ready completeness.</strong> Sketch, not implement.</li>
  <li><strong>Code.</strong> Backend SD is about boxes + arrows + tradeoffs.</li>
</ul>

<h3>Why structure matters more than knowledge</h3>
<p>Two candidates with identical knowledge — one walks the framework calmly; the other skips ahead and rambles. The first ships a coherent design; the second leaves gaps. Interviewers consistently pass structured candidates.</p>

<h3>What "good system design interview" looks like</h3>
<ul>
  <li>You spend the first 5-10 minutes asking clarifying questions.</li>
  <li>You make capacity estimates aloud (not silent math).</li>
  <li>You sketch a high-level diagram before deciding details.</li>
  <li>You name 2-3 deep-dive areas; the interviewer picks (or you propose).</li>
  <li>You verbalize tradeoffs continuously: "I'm choosing X over Y because Z; the cost is W."</li>
  <li>You handle interviewer's pushback with curiosity, not defensiveness.</li>
  <li>You manage time — last 10 min covers scaling + reliability + observability.</li>
  <li>You close with: what's good, what's missing, what you'd do next.</li>
</ul>

<h3>What "bad system design interview" looks like</h3>
<ul>
  <li>Jumps into solution within 30 seconds; skips clarification.</li>
  <li>Hand-waves estimates: "It's a lot of users."</li>
  <li>Draws 50 boxes without explaining why each.</li>
  <li>Picks Kafka without justifying — defaults from training, not reasoning.</li>
  <li>Silent for 5-minute stretches.</li>
  <li>Dies on a deep-dive question because they over-extended.</li>
  <li>Spends 40 minutes on the schema; never gets to scale.</li>
  <li>Doesn't mention monitoring, observability, deploy strategy.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The 6-step framework</h3>
<table>
  <thead><tr><th>Step</th><th>Time</th><th>Goal</th></tr></thead>
  <tbody>
    <tr><td>1. Clarify scope</td><td>5-10 min</td><td>Pin features, scale, constraints</td></tr>
    <tr><td>2. Estimate scale</td><td>5 min</td><td>Numbers anchor decisions</td></tr>
    <tr><td>3. High-level design</td><td>10-15 min</td><td>Boxes + arrows; agree on shape</td></tr>
    <tr><td>4. Deep dive</td><td>15-20 min</td><td>Pick 2-3 hardest parts; details</td></tr>
    <tr><td>5. Scale + reliability + observability</td><td>10-15 min</td><td>Bottlenecks, replication, monitoring</td></tr>
    <tr><td>6. Wrap up</td><td>2-5 min</td><td>What's good, what's missing, what's next</td></tr>
  </tbody>
</table>

<p>For 45-min interview, compress steps 4-5 (10-15 min total). For 90-min, expand deep dive.</p>

<h3>Step 1: Clarify scope (5-10 min)</h3>
<p>Don't start designing yet. Ask:</p>
<table>
  <thead><tr><th>Category</th><th>Questions</th></tr></thead>
  <tbody>
    <tr><td>Features</td><td>What features are in scope? What's out? (cut early)</td></tr>
    <tr><td>Users</td><td>How many users? Active vs registered? Geographic distribution?</td></tr>
    <tr><td>Traffic shape</td><td>Reads vs writes? Average + peak? Diurnal pattern?</td></tr>
    <tr><td>Data shape</td><td>How much data per user? Per object? Total storage?</td></tr>
    <tr><td>Constraints</td><td>Latency requirements? Consistency? Compliance (GDPR, HIPAA)?</td></tr>
    <tr><td>Non-functional</td><td>Availability target (99.9%? 99.99%)? Cost sensitivity?</td></tr>
  </tbody>
</table>

<p>Confirm scope back: "OK, so we're designing [X] supporting [Y] features at [Z] scale. Out of scope: [W]. Sound right?"</p>

<h3>Step 2: Estimate scale (5 min)</h3>
<p>Numbers turn vague designs into specific tradeoffs. Calculate aloud:</p>
<pre><code class="language-text">Users: 100M registered, 10M DAU
RPS: 10M DAU × 50 actions/day / 86400s ≈ 6,000 RPS average
Peak: ~3× average = ~18,000 RPS
Reads: 100× writes (typical social) → ~17,800 RPS reads, ~180 RPS writes
Storage:
  Each post: ~1KB metadata + 0-10MB media (avg 200KB)
  100M users × 1000 posts/user × 200KB ≈ 20PB media; 100TB metadata
Bandwidth:
  Reads × payload ≈ 10K RPS × 5KB ≈ 50MB/s
</code></pre>

<p>Round generously. "Order of magnitude" right is what counts. Numbers anchor: 10K RPS = single beefy DB; 1M RPS = sharded.</p>

<h3>Useful estimation reference points</h3>
<table>
  <thead><tr><th>Operation</th><th>Latency (single op)</th></tr></thead>
  <tbody>
    <tr><td>L1 cache reference</td><td>~0.5ns</td></tr>
    <tr><td>Branch mispredict</td><td>~5ns</td></tr>
    <tr><td>L2 cache reference</td><td>~7ns</td></tr>
    <tr><td>Mutex lock/unlock</td><td>~25ns</td></tr>
    <tr><td>Main memory reference</td><td>~100ns</td></tr>
    <tr><td>Compress 1KB with Zippy</td><td>~10μs</td></tr>
    <tr><td>Send 2KB over 1Gbps</td><td>~20μs</td></tr>
    <tr><td>SSD random read</td><td>~150μs</td></tr>
    <tr><td>Round-trip same datacenter</td><td>~500μs</td></tr>
    <tr><td>Read 1MB sequentially from SSD</td><td>~1ms</td></tr>
    <tr><td>HDD seek</td><td>~10ms</td></tr>
    <tr><td>Cross-continental round trip</td><td>~150ms</td></tr>
  </tbody>
</table>

<p>Memorize: memory ~100ns, SSD ~100μs, datacenter RTT ~500μs, internet RTT ~50-150ms.</p>

<table>
  <thead><tr><th>Storage / throughput</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Single Postgres write throughput</td><td>~10K-50K writes/sec (depends on hardware + workload)</td></tr>
    <tr><td>Single Redis throughput</td><td>~100K ops/sec per instance</td></tr>
    <tr><td>Single Kafka broker</td><td>~1M msg/sec produce; consumer scales</td></tr>
    <tr><td>S3 read latency</td><td>~50-200ms</td></tr>
    <tr><td>CDN edge cache</td><td>~10-50ms globally</td></tr>
    <tr><td>1KB row in Postgres</td><td>Disk + index ~few KB total</td></tr>
  </tbody>
</table>

<h3>Step 3: High-level design (10-15 min)</h3>
<p>Sketch the boxes + arrows. Don't pick implementations yet — just shape:</p>
<pre><code class="language-text">         CDN ─── static assets
          ↑
        Client
          ↓
       Load balancer
          ↓
      API gateway / app servers
          ↓
   ┌──────┼──────┐
   ↓      ↓      ↓
  DB    Cache  Queue
                 ↓
               Workers
                 ↓
               (back to DB)

External: Object storage (S3) for user uploads
</code></pre>

<p>Walk through one or two key flows: "User posts a photo: client → app → S3 (pre-signed URL upload) → metadata to DB → emit event → fan-out to feed cache."</p>

<h3>Step 4: Deep dive (15-20 min)</h3>
<p>Pick the 2-3 hardest parts. Common deep dives by problem:</p>
<table>
  <thead><tr><th>Problem</th><th>Likely deep dives</th></tr></thead>
  <tbody>
    <tr><td>Twitter / feed</td><td>Fan-out (write vs read), ranking, hot users</td></tr>
    <tr><td>Chat</td><td>Message delivery, presence, ordering, multi-device sync</td></tr>
    <tr><td>Uber / ride matching</td><td>Geo-indexing, dispatch algorithm, surge pricing</td></tr>
    <tr><td>URL shortener</td><td>ID generation, KV store, cache strategy, analytics</td></tr>
    <tr><td>Rate limiter</td><td>Algorithms (token bucket vs sliding window), distributed state</td></tr>
    <tr><td>Notification system</td><td>Fan-out, dedup, retry, channel-specific (push, email, SMS)</td></tr>
    <tr><td>Search</td><td>Indexing pipeline, query routing, ranking, suggestions</td></tr>
    <tr><td>Payment</td><td>Idempotency, fraud, reconciliation, async settlement</td></tr>
  </tbody>
</table>

<p>For each: data model → API → algorithm/flow → tradeoffs.</p>

<h3>Step 5: Scale + reliability + observability (10-15 min)</h3>
<table>
  <thead><tr><th>Concern</th><th>Address</th></tr></thead>
  <tbody>
    <tr><td>Bottleneck</td><td>Where does it die at 10×? DB write throughput? Single hot key?</td></tr>
    <tr><td>Sharding</td><td>If DB is bottleneck, shard by user_id / tenant_id</td></tr>
    <tr><td>Read replicas</td><td>Read-heavy workloads</td></tr>
    <tr><td>Caching layers</td><td>Which routes? TTL? Invalidation strategy?</td></tr>
    <tr><td>CDN</td><td>For static + sometimes dynamic content</td></tr>
    <tr><td>Multi-region</td><td>Active-active or active-passive? Data replication?</td></tr>
    <tr><td>Failover</td><td>What happens if primary DB fails? RTO / RPO?</td></tr>
    <tr><td>Observability</td><td>Metrics (RED, USE), logs, traces, SLOs</td></tr>
    <tr><td>Deploy strategy</td><td>Canary; feature flags; rollback</td></tr>
  </tbody>
</table>

<h3>Step 6: Wrap-up (2-5 min)</h3>
<ul>
  <li>"Here's what's strong: X, Y, Z."</li>
  <li>"Here's what I deliberately deferred: A, B."</li>
  <li>"Given more time, I'd dive into: C, D, E."</li>
</ul>

<h3>The 7 building blocks (memorize)</h3>
<table>
  <thead><tr><th>Block</th><th>What it provides</th></tr></thead>
  <tbody>
    <tr><td>Load balancer</td><td>Distribute traffic; health checks; SSL termination (ALB, NLB, Nginx)</td></tr>
    <tr><td>App servers</td><td>Stateless; horizontally scalable; behind LB</td></tr>
    <tr><td>SQL DB</td><td>Strong consistency, joins, transactions (Postgres, MySQL)</td></tr>
    <tr><td>NoSQL DB</td><td>Specific access patterns at scale (DynamoDB, Cassandra, MongoDB)</td></tr>
    <tr><td>Cache</td><td>In-memory key-value (Redis, Memcached). Note: Redis relicensed off open-source BSD to SSPL/RSAL in March 2024, spawning the Linux Foundation <strong>Valkey</strong> fork (AWS/Google/Oracle); Redis 8 returned to open source under AGPLv3 in May 2025. AWS ElastiCache and Google Memorystore now default new deployments to Valkey (drop-in, same protocol).</td></tr>
    <tr><td>Queue / stream</td><td>Async work, fan-out, event log (Kafka, SQS, Redis Streams)</td></tr>
    <tr><td>Object storage</td><td>Files / images / video (S3, GCS)</td></tr>
    <tr><td>CDN</td><td>Edge caching for global low-latency static + dynamic (Cloudflare, Fastly)</td></tr>
    <tr><td>Search index</td><td>Full-text / faceted (Elasticsearch, OpenSearch, Algolia)</td></tr>
    <tr><td>Vector DB</td><td>Embedding similarity (pgvector, Pinecone)</td></tr>
  </tbody>
</table>

<h3>Communication patterns</h3>
<table>
  <thead><tr><th>Pattern</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Sync request/response (HTTP / gRPC)</td><td>User-facing reads + writes that need immediate confirmation</td></tr>
    <tr><td>Async via queue</td><td>Work that can defer; retry-friendly; decouple producer/consumer</td></tr>
    <tr><td>Event-driven (pub/sub)</td><td>Fan-out one event to many consumers</td></tr>
    <tr><td>Streaming (Kafka)</td><td>Durable event log; replay; analytics</td></tr>
    <tr><td>Polling</td><td>Simple "check periodically"</td></tr>
    <tr><td>Server-Sent Events</td><td>Server → client streaming</td></tr>
    <tr><td>WebSocket</td><td>Bidirectional realtime</td></tr>
  </tbody>
</table>

<h3>Consistency tradeoffs (CAP)</h3>
<ul>
  <li>Network partition will eventually happen.</li>
  <li>You can pick CP (consistent, may be unavailable during partition) or AP (always available, eventually consistent).</li>
  <li>Most systems: strong consistency for money / inventory / auth; eventual for feeds / counts / search.</li>
  <li>"Strong consistency" usually means "linearizable for this op"; design per operation, not per system.</li>
</ul>

<h3>Capacity planning vocabulary</h3>
<table>
  <thead><tr><th>Term</th><th>Means</th></tr></thead>
  <tbody>
    <tr><td>QPS / RPS / TPS</td><td>Queries/Requests/Transactions per second</td></tr>
    <tr><td>Throughput</td><td>Work units per time</td></tr>
    <tr><td>Latency</td><td>Time per request (P50, P95, P99)</td></tr>
    <tr><td>Concurrency</td><td>In-flight at once</td></tr>
    <tr><td>Bandwidth</td><td>Bytes per second</td></tr>
    <tr><td>Storage</td><td>Total data; growth rate</td></tr>
    <tr><td>Read amplification</td><td>Reads per logical request (e.g., feed = 1 read but joins 50 posts)</td></tr>
    <tr><td>Write amplification</td><td>Writes per logical change (e.g., index updates per row insert)</td></tr>
    <tr><td>Fan-out</td><td>One event → N downstream actions</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Sample dialog: clarifying scope</h3>
<pre><code class="language-text">Interviewer: "Design Twitter."

You: "Great. Let me clarify scope first.

Q1: Which features in scope?
- Tweets (short text, &lt; 280 chars)
- User follows
- Home timeline (feed of followed users' tweets)
- Likes
What's out: search, hashtags, DMs, retweets, media uploads (unless you want them).

Q2: Scale?
- How many users? Total + DAU?

Q3: Traffic shape?
- Reads vs writes ratio?
- Peak concurrent users?

Q4: Constraints?
- Strict ordering of feed? Eventual consistency OK?
- Latency target for feed reads?"

Interviewer: "100M registered, 10M DAU. Reads 100× writes. Feed within 1s."

You: "Got it. Recap: design Twitter for 100M users / 10M DAU, read-heavy (100:1), feed P99 &lt; 1s, eventual consistency on feed OK. Out of scope: search, hashtags, DMs, retweets, media. Sound right?"
</code></pre>

<h3>Sample dialog: estimating</h3>
<pre><code class="language-text">"OK, let me estimate. 10M DAU × 5 tweets/day average ÷ 86400s ≈ 600 tweets/sec write.
Peak ~3× = 1800 writes/sec.
Reads at 100:1 → 180,000 reads/sec average; 540K peak.

Storage:
- Tweet: ~300B (text + metadata + indexes)
- 100M users × 1000 tweets each × 300B ≈ 30TB just tweets metadata.
- Plus follow graph: 100M × 100 follows × 32B ≈ 320GB.

Bandwidth:
- 540K reads/sec × ~5KB feed page = ~2.7GB/s peak feed delivery.
- CDN absorbs most of this for static/cached parts.

Numbers tell us: write throughput modest (1800/sec, single Postgres handles); read 540K/sec needs caching + replicas; 30TB DB likely needs sharding eventually."
</code></pre>

<h3>Sample high-level diagram (Twitter feed)</h3>
<pre><code class="language-text">      Client
        ↓
     CDN (cache static + some pages)
        ↓
   Load balancer
        ↓
    ┌───┴───┐
    ↓       ↓
  Read    Write
  servers servers
    ↓       ↓
  Cache   Tweet store (Postgres sharded by user_id)
  (Redis  Follow graph (Postgres / specialized graph DB)
  feed)
    ↓
  Read replicas

Background: feed builder workers read tweets + follows; precompute feeds; write to feed cache (push-based fan-out for active users) or compute on read (pull-based for inactive).
</code></pre>

<h3>Sample deep dive: feed fan-out</h3>
<pre><code class="language-text">Two strategies:

A. Push (fan-out on write)
   When user A tweets, fan out to all followers' feed caches.
   Pro: feed read = O(1) lookup
   Con: Justin Bieber has 100M followers → 100M cache writes per tweet. Slow + expensive.

B. Pull (fan-out on read)
   On feed read, fetch tweets from each followed user; merge.
   Pro: cheap on write
   Con: feed read = O(N follows) reads; slow for users following many.

Hybrid:
- Push for users with &lt; 10k followers.
- Pull for celebrities (&gt; 10k followers).
- On feed read, merge cached push results + live pull from celebrities.

Tradeoff explicitly: Twitter uses hybrid; cost depends on follower distribution. For our scale (avg 200 followers), push works for most users; pull for top 0.1%.
</code></pre>

<h3>Sample scale + reliability discussion</h3>
<pre><code class="language-text">Bottlenecks at 10×:
- Tweet store: 1800 writes/sec → 18000. Single Postgres ~10K writes/sec → must shard. Shard by user_id; consistent hashing.
- Feed cache: 540K reads/sec → 5.4M. Multi-region Redis cluster; per-region replicas.
- Follow graph: not bottleneck at this scale; if it grows, shard by follower_id.

Reliability:
- Postgres primary fails: streaming replication; auto-failover via Patroni; RTO ~30s, RPO ~few seconds.
- Redis cluster: replication; sentinel for failover; tolerate cache miss → fall through to DB.
- Region failure: active-active in 2 regions; DNS-based failover.

Observability:
- Metrics: feed P99 latency; cache hit rate; tweet write rate; follow query latency.
- Logs: structured; correlation ID per request.
- Tracing: OpenTelemetry; sample 5% + all errors.
- SLO: 99.9% of feed reads &lt; 500ms; error budget tracked.
</code></pre>

<h3>Sample wrap-up</h3>
<pre><code class="language-text">"To summarize:
- Strong: hybrid fan-out balances cost; sharded Postgres handles scale; Redis-fed feeds give P99 latency.
- Deferred: tweet ranking algorithm; spam detection; search; media upload pipeline.
- Given more time: dive into the celebrity-fan-out hot key problem; multi-region replication consistency; analytics pipeline for trends."

This shows: confidence in what's done; honesty about gaps; clear next steps.
</code></pre>

<h3>Common mistakes by step</h3>
<table>
  <thead><tr><th>Step</th><th>Common mistakes</th></tr></thead>
  <tbody>
    <tr><td>1. Clarify</td><td>Skip; jump to solution</td></tr>
    <tr><td>2. Estimate</td><td>Hand-wave numbers; don't compute aloud</td></tr>
    <tr><td>3. High-level</td><td>50 boxes; no narrative</td></tr>
    <tr><td>4. Deep dive</td><td>Try to cover everything; nothing in depth</td></tr>
    <tr><td>5. Scale</td><td>Skip entirely; no bottleneck analysis</td></tr>
    <tr><td>6. Wrap-up</td><td>Stop without summary; no acknowledgment of gaps</td></tr>
  </tbody>
</table>

<h3>Key tradeoff vocabulary (use 5-10 of these per interview)</h3>
<ul>
  <li>"Strong consistency vs eventual consistency."</li>
  <li>"Push (fan-out on write) vs pull (fan-out on read)."</li>
  <li>"Synchronous vs asynchronous (decouple via queue)."</li>
  <li>"Sharded vs single-instance."</li>
  <li>"Cache-aside vs read-through."</li>
  <li>"Stateless app, state in DB / cache."</li>
  <li>"Idempotent operations + at-least-once delivery."</li>
  <li>"Optimistic vs pessimistic locking."</li>
  <li>"Read replicas with replication lag tradeoff."</li>
  <li>"Active-active vs active-passive multi-region."</li>
  <li>"Hot keys via sharding or caching layer above."</li>
  <li>"Backpressure: bounded queues + load shedding."</li>
  <li>"Monitoring drives release pace via error budget."</li>
</ul>

<h3>Diagram conventions</h3>
<table>
  <thead><tr><th>Shape</th><th>Means</th></tr></thead>
  <tbody>
    <tr><td>Box</td><td>Service / process</td></tr>
    <tr><td>Cylinder</td><td>Database</td></tr>
    <tr><td>Cloud</td><td>External service / CDN</td></tr>
    <tr><td>Arrow →</td><td>Sync call</td></tr>
    <tr><td>Dashed arrow</td><td>Async / event</td></tr>
    <tr><td>Multiple boxes</td><td>Replicated / load-balanced</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Full walkthrough — URL shortener</h3>

<p><strong>Step 1: Clarify</strong></p>
<pre><code class="language-text">"Design a URL shortener like bit.ly.

Q: Features?
- Shorten long URL → short URL.
- Redirect short URL → original.
- Custom aliases? (assume not.)
- Analytics on clicks? (assume basic count.)
- Expiry? (assume no.)
- Auth? (assume anonymous; rate-limit by IP.)

Q: Scale?
- 100M URLs created total to date.
- 1B redirects per day.

Q: Constraints?
- Redirect P99 &lt; 100ms.
- 99.99% uptime."
</code></pre>

<p><strong>Step 2: Estimate</strong></p>
<pre><code class="language-text">Writes: 100M URLs / 5 years = 20M/year ≈ 600/sec; peak ~2K/sec.
Reads: 1B/day ≈ 12K/sec; peak ~36K/sec.

Storage:
- Each URL row: short ID (~7 chars) + long URL (~100B avg) + created_at + counter ≈ 200B.
- 100M × 200B = 20GB. Trivial.

Bandwidth:
- Read response = HTTP redirect (~500B header).
- 12K reads/sec × 500B = 6MB/s read bandwidth.

Numbers say: tiny dataset; high read throughput; perfect for cache + KV store.
</code></pre>

<p><strong>Step 3: High-level</strong></p>
<pre><code class="language-text">Client
  ↓
CDN (cache redirect responses!)
  ↓
Load balancer
  ↓
App servers (stateless)
  ↓
┌──────┴──────┐
↓             ↓
Cache     Primary store
(Redis)   (Postgres / DynamoDB)
              ↓
         Counter store (Redis INCR for click counts)
</code></pre>

<p><strong>Step 4: Deep dive — short-ID generation</strong></p>
<pre><code class="language-text">Options:
A. Hash long URL → take first N chars
   Pros: deterministic; same long URL → same short.
   Cons: collisions; hash truncation reduces collision probability but increases when N small.

B. Auto-increment + base62 encode
   Pros: short (7 chars = 62^7 = 3.5T possibilities); no collisions.
   Cons: predictable (security; competitor can scrape).

C. Random short ID + collision check
   Pros: unpredictable; simple.
   Cons: extra read on collision; usually rare at small scale.

Pick C for now; switch to B if predictability OK + scale needs faster generation.

ID generation in code:
function shortId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 7 }, () =&gt; chars[Math.floor(Math.random() * 62)]).join('');
}

INSERT INTO urls (short_id, long_url) VALUES ($1, $2)
ON CONFLICT (short_id) DO NOTHING RETURNING short_id;

If insert returns no row → collision; generate new and retry.
</code></pre>

<p><strong>Step 5: Scale + reliability</strong></p>
<pre><code class="language-text">Read path: 36K RPS peak.
- CDN absorbs majority via Cache-Control: public, max-age=86400.
- Cache hit ratio &gt; 99% likely.
- Backend reads ~360 RPS — single Postgres handles.

Write path: 2K RPS peak.
- Single Postgres handles 10K-50K writes/sec.

Bottleneck if 10×: write throughput.
- At 20K writes/sec: still fits Postgres.
- At 200K writes/sec: shard by short_id prefix.

Reliability:
- Postgres primary + replica; auto-failover.
- Redis cache as accelerator; cache miss → DB; never source of truth.
- CDN cache: stale data tolerable for redirects (URL rarely changes).

Observability:
- Metrics: redirect rate, P99, cache hit rate, error rate.
- SLO: 99.99% of redirects &lt; 100ms.
- Click-counter: async via Redis INCR, periodic flush to DB (no-strict-consistency OK).
</code></pre>

<p><strong>Step 6: Wrap-up</strong></p>
<pre><code class="language-text">"Strong: CDN handles read scale; Postgres easily handles write scale; cache miss has DB fallback; click counter async-aggregated.
Deferred: custom aliases (just lookup before insert); user accounts; analytics dashboard.
Given more time: spam URL detection; abuse mitigation; multi-region deployment."
</code></pre>

<h3>Example 2: Compressed walkthrough — Rate limiter (45-min)</h3>
<pre><code class="language-text">CLARIFY:
- Per-user, per-API key, per-IP? Per-user (using JWT).
- Window? "100 requests per minute."
- Distributed? Yes, multiple app servers behind LB.
- Strict or approximate? Approximate OK.

ESTIMATE:
- 100M users; 1M concurrent.
- 1B requests/day → 12K RPS.
- Rate limiter checks: 12K/sec.

HIGH-LEVEL:
Client → LB → App server → Rate limiter (Redis)
                      ↓ (if allowed)
                    Backend handler

DEEP DIVE — algorithms:
A. Fixed window: count in 1-minute buckets. Simple; bursty at boundaries.
B. Sliding window log: log timestamps; count those in last 60s. Memory grows.
C. Sliding window counter: weighted average of two adjacent fixed buckets. Smooth + cheap.
D. Token bucket: tokens regenerated at rate; consume per request. Allows bursts.
E. Leaky bucket: queue with fixed drain rate.

For per-user: token bucket via Redis Lua script.

LUA SCRIPT (atomic):
local tokens = redis.call('GET', key)
if not tokens then tokens = capacity end
local now = tonumber(ARGV[1])
local lastRefill = tonumber(redis.call('GET', key .. ':ts')) or now
local elapsed = now - lastRefill
tokens = math.min(capacity, tokens + elapsed * rate)
if tokens &lt; 1 then return 0 end
tokens = tokens - 1
redis.call('SET', key, tokens, 'PX', 60000)
redis.call('SET', key .. ':ts', now, 'PX', 60000)
return 1

SCALE:
- 12K checks/sec. Single Redis: 100K ops/sec — fine.
- 10×: Redis cluster shard by user_id.

RELIABILITY:
- Redis down: fail-open or fail-closed? Auth endpoints fail-closed; analytics fail-open.

OBSERVABILITY:
- Metrics: requests_blocked_total{reason="rate_limit"}.
- Per-user dashboard for support.
</code></pre>

<h3>Example 3: 5-minute compressed — Notification system</h3>
<pre><code class="language-text">CLARIFY: Multi-channel (push, email, SMS). 100M users. 1M notifications/sec peak (campaign).
ESTIMATE: 1M ops/sec → far beyond single-DB writes; needs queue.
HIGH-LEVEL:
  Producer → Kafka → Consumer fan-out per channel
                 ↓        ↓        ↓
               Push    Email    SMS
              (FCM)  (SES)   (Twilio)
DEEP DIVE: idempotency (dedupe by notification_id); rate-limit per user; quiet hours.
SCALE: Kafka partitions by user_id; consumers scale independently.
RELIABILITY: DLQ per channel; retry with backoff; multi-region; per-channel SLOs.
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Common interview pitfalls</h3>

<h4>Pitfall: starting before clarifying</h4>
<ul>
  <li>Skipping the question round → 30 minutes designing the wrong thing.</li>
  <li>Pause. Ask scope. Confirm. Then start.</li>
</ul>

<h4>Pitfall: estimating without numbers</h4>
<ul>
  <li>"It's at scale" doesn't anchor decisions.</li>
  <li>Compute even rough numbers aloud.</li>
</ul>

<h4>Pitfall: drawing 50 boxes</h4>
<ul>
  <li>Every box requires a rationale ("why this?").</li>
  <li>Start with 5-7 boxes; add as needed.</li>
</ul>

<h4>Pitfall: not picking deep dives</h4>
<ul>
  <li>Trying to cover everything = nothing in depth.</li>
  <li>Pick 2-3; ask interviewer "want me to dive into X or Y?"</li>
</ul>

<h4>Pitfall: silent decisions</h4>
<ul>
  <li>"I'll use Kafka" without justification.</li>
  <li>"I'll use Kafka because we need durable replay + fan-out across consumer groups."</li>
</ul>

<h4>Pitfall: avoiding tradeoffs</h4>
<ul>
  <li>"This is the best way" — interviewers want to hear the cost.</li>
  <li>"This trades X for Y; alternative would be Z but costs W."</li>
</ul>

<h4>Pitfall: time mismanagement</h4>
<ul>
  <li>40 minutes on schema; 5 minutes on scaling; never reaches reliability.</li>
  <li>Watch the clock; budget per step.</li>
</ul>

<h4>Pitfall: defensive on pushback</h4>
<ul>
  <li>Interviewer: "What about X?" → you double down.</li>
  <li>Better: "Good point — that would mean Y. Let me reconsider."</li>
  <li>Senior signal: updating mental model on new info.</li>
</ul>

<h4>Pitfall: missing the non-functional</h4>
<ul>
  <li>Functional design only; no observability, no reliability, no deploy strategy.</li>
  <li>Last 10 min always covers these.</li>
</ul>

<h4>Pitfall: jargon without substance</h4>
<ul>
  <li>"We'll use a service mesh + CQRS + event sourcing + saga + ..."</li>
  <li>Interviewer: "Why?"</li>
  <li>If you can't justify each, skip it. Senior signal = restraint.</li>
</ul>

<h4>Pitfall: forgetting database choice</h4>
<ul>
  <li>"I'll use a database" without specifying.</li>
  <li>Pick one (Postgres) explicitly; justify (relational data, transactions matter).</li>
</ul>

<h4>Pitfall: skipping data model</h4>
<ul>
  <li>Tables / fields / indexes are concrete; without them, design is hand-wavy.</li>
  <li>Sketch key schemas during deep dive.</li>
</ul>

<h4>Pitfall: not handling the hot key</h4>
<ul>
  <li>Justin Bieber's tweets — 100M followers. Single fan-out won't work.</li>
  <li>"For celebrities, we'd switch to pull-based" — name the seam.</li>
</ul>

<h4>Pitfall: ignoring failure modes</h4>
<ul>
  <li>"What if the DB goes down?" → silence.</li>
  <li>Always: "DB primary fails → replica promoted via Patroni; RTO ~30s; RPO ~seconds."</li>
</ul>

<h4>Pitfall: missing geographic distribution</h4>
<ul>
  <li>If problem mentions global users, single-region won't work for latency.</li>
  <li>Multi-region; CDN for static; per-region replicas; data residency compliance.</li>
</ul>

<h4>Pitfall: over-engineering for hypothetical scale</h4>
<ul>
  <li>"100 users → 100M users" doesn't mean start with 100M architecture.</li>
  <li>Match design to stated scale; mention "would shift to X if scale grew."</li>
</ul>

<h4>Pitfall: forgetting cost</h4>
<ul>
  <li>Interviewer may probe: "What's the monthly bill for this?"</li>
  <li>Have rough order-of-magnitude in mind: $100/month, $10K/month, $1M/month.</li>
</ul>

<h4>Pitfall: not asking when stuck</h4>
<ul>
  <li>Stuck for 60 seconds → ask for a hint.</li>
  <li>"I'm thinking about how to handle X; what considerations matter to you?"</li>
  <li>Interviewers prefer engaged candidates over silently-frozen ones.</li>
</ul>

<h4>Pitfall: too many tools / low coherence</h4>
<ul>
  <li>"Postgres + Mongo + DynamoDB + Cassandra + Redis + Memcached."</li>
  <li>One tool per concern; reuse where possible.</li>
</ul>

<h3>Recovering when stuck</h3>
<ul>
  <li><strong>Ask the interviewer.</strong> "Should I focus on X or Y?"</li>
  <li><strong>Restate the goal.</strong> Sometimes verbalizing reveals the answer.</li>
  <li><strong>Pick the simpler path.</strong> Reach for monolith / single DB; explain you'd revise if scale demands.</li>
  <li><strong>Acknowledge gaps.</strong> "I'd want to research X more before committing here."</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common backend system design interview mistakes</h3>
<ol>
  <li><strong>Skipping clarification.</strong> Designs the wrong thing.</li>
  <li><strong>No estimation.</strong> Decisions ungrounded.</li>
  <li><strong>50-box diagram.</strong> No narrative.</li>
  <li><strong>No deep dives.</strong> Covers nothing in depth.</li>
  <li><strong>Silent tradeoffs.</strong> Picks tools without justification.</li>
  <li><strong>40 min on schema.</strong> Never reaches scale.</li>
  <li><strong>No reliability discussion.</strong> Functional only.</li>
  <li><strong>No observability.</strong> Production-readiness gap.</li>
  <li><strong>Defensive on pushback.</strong> Refuses to update mental model.</li>
  <li><strong>Over-engineered for hypothetical scale.</strong> Complexity for scale that doesn't exist.</li>
  <li><strong>Tool soup.</strong> 6 different DBs; no coherence.</li>
  <li><strong>Closing without wrap-up.</strong> Missed chance to summarize + frame next steps.</li>
</ol>

<h3>Anti-pattern: solution-first thinking</h3>
<pre><code class="language-text">// BAD
"Design Twitter."
"OK, we use Cassandra for tweets, Redis for feeds, Kafka for fan-out, ElasticSearch for..."
[15 minutes of tool dump; haven't asked a single clarifying question]

// GOOD
"Design Twitter."
"Let me clarify: which features in scope? Scale? Constraints?"
[5 minutes of focused Q&amp;A → confirmed scope → start estimating]
</code></pre>

<h3>Anti-pattern: hand-wave estimation</h3>
<pre><code class="language-text">// BAD
"It's a lot of users. Quite a lot of writes. Storage will be big."

// GOOD
"100M users × 5 tweets/day / 86400s ≈ 6K writes/sec average; 18K peak.
Reads at 100:1 → 1.8M peak reads/sec.
Storage: 100M × 1000 tweets × 500B ≈ 50TB."
</code></pre>

<h3>Anti-pattern: every tool you've heard of</h3>
<pre><code class="language-text">// BAD
"We'll use Kubernetes + Istio + Kafka + Cassandra + ElasticSearch + Redis + Memcached + S3 + Cloudflare + CloudFront + Route53 + ..."

// GOOD
"We'll use Postgres for primary + Redis cache + S3 for media. Add Kafka if we need durable event log; ElasticSearch only when search becomes a real requirement."
</code></pre>

<h3>Anti-pattern: ignoring write throughput</h3>
<pre><code class="language-text">// BAD
"Single Postgres handles all writes." [for 1M writes/sec system]

// GOOD
"At 1M writes/sec, single Postgres won't work (~10K-50K/sec ceiling). Shard by user_id; consistent hashing; or write-optimized DB like Cassandra for tweets specifically."
</code></pre>

<h3>Anti-pattern: missing the celeb / hot key problem</h3>
<pre><code class="language-text">// BAD
"Push-based fan-out: when a user tweets, write to all followers' feed caches."

// GOOD
"For most users push works. But Justin Bieber has 100M followers — 100M writes per tweet kills throughput. Hybrid: push for &lt; 10K followers; pull on read for celebs; merge at read time."
</code></pre>

<h3>Anti-pattern: skipping the failure case</h3>
<pre><code class="language-text">// BAD
[never mentions what happens when DB fails]

// GOOD
"Postgres primary + 2 replicas; streaming replication; Patroni for auto-failover. RTO ~30s; RPO ~few seconds replication lag.
For higher availability: multi-region active-passive; cross-region replica with async replication; manual failover for region outage."
</code></pre>

<h3>Anti-pattern: skip observability</h3>
<pre><code class="language-text">// BAD
[design ends without mentioning monitoring]

// GOOD
"Observability: structured logs with correlation IDs; metrics (RED for services, USE for resources); OpenTelemetry tracing.
SLOs: feed P99 &lt; 500ms over 30 days. Error budget: 0.1% (43min/month).
Alerts: error rate spikes; latency drift; cache hit-rate drops; saturation."
</code></pre>

<h3>Anti-pattern: not surfacing tradeoffs</h3>
<pre><code class="language-text">// BAD
"I'll use cache-aside."

// GOOD
"Cache-aside vs write-through: cache-aside is simpler — write to DB, invalidate cache. Write-through keeps cache strictly consistent but slows writes. Picking cache-aside for default; write-through for specific fields where staleness is unacceptable (user balance)."
</code></pre>

<h3>Anti-pattern: jargon without substance</h3>
<pre><code class="language-text">// BAD
"We'll do CQRS + event sourcing + saga + service mesh."
Interviewer: "Why?"
[stumbling explanation that doesn't fit the problem]

// GOOD
"Event-driven via Kafka because the analytics consumer needs replay. CQRS only for the feed read model — write to normalized tables, project to denormalized feed_entries on event."
</code></pre>

<h3>Anti-pattern: avoiding interviewer hints</h3>
<pre><code class="language-text">// BAD
Interviewer: "What about consistency?"
You: "Eventually consistent." [moves on]

// GOOD
Interviewer: "What about consistency?"
You: "Good question. For tweets: eventual is fine (people don't notice 100ms lag). For follows: also eventual. For DMs (if added): would need read-your-write consistency. For payment-style features: strong / linearizable."
</code></pre>

<h3>Anti-pattern: ignoring time</h3>
<pre><code class="language-text">// BAD
[40 min in; you've drawn one diagram and discussed indexes]

// GOOD
[15 min: clarified + estimated]
[15 min: high-level + first deep dive]
[15 min: second deep dive + scale + reliability]
[5 min: wrap-up]
</code></pre>

<h3>Anti-pattern: no wrap-up</h3>
<pre><code class="language-text">// BAD
[interviewer asks for time check; you say "I'm done"; awkward silence]

// GOOD
"To summarize: [strong points]. Deferred: [things explicitly out of scope]. Given more time: [specific next dives]. Anything you'd like me to explore further?"
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common system design interview prompts</h3>
<ol>
  <li>Design Twitter / Instagram / Pinterest feed.</li>
  <li>Design URL shortener (bit.ly).</li>
  <li>Design rate limiter.</li>
  <li>Design chat (WhatsApp / Slack / Discord).</li>
  <li>Design Uber / Lyft (ride matching).</li>
  <li>Design Dropbox / Google Drive (file sync).</li>
  <li>Design YouTube / Netflix (video streaming).</li>
  <li>Design payment processor.</li>
  <li>Design distributed cache.</li>
  <li>Design search autocomplete.</li>
  <li>Design notification system.</li>
  <li>Design news feed.</li>
  <li>Design typeahead.</li>
  <li>Design distributed key-value store.</li>
  <li>Design web crawler.</li>
</ol>

<h3>The framework — quick reference</h3>
<pre><code class="language-text">1. Clarify (5-10 min): features, scale, constraints
2. Estimate (5 min): RPS, storage, bandwidth
3. High-level (10-15 min): boxes + arrows
4. Deep dive (15-20 min): pick 2-3 hard parts
5. Scale + reliability + observability (10-15 min)
6. Wrap-up (2-5 min): strong / deferred / next
</code></pre>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Strong consistency for money / inventory / auth; eventual for feeds / counts / search."</em></li>
  <li><em>"Push-based fan-out for normal users; pull-based for celebrities; hybrid merge at read."</em></li>
  <li><em>"Cache-aside by default; write-through where strict consistency matters."</em></li>
  <li><em>"Sharded by user_id; consistent hashing; resharding via virtual nodes."</em></li>
  <li><em>"Read replicas for read-heavy; primary for read-after-write."</em></li>
  <li><em>"At-least-once + idempotent consumers — pragmatic 'exactly once.'"</em></li>
  <li><em>"CDN absorbs static + cached dynamic; per-region for low-latency global."</em></li>
  <li><em>"Stateless app; state in DB / cache / queue."</em></li>
  <li><em>"Outbox pattern for atomic DB+publish."</em></li>
  <li><em>"Saga + compensations for cross-service transactions."</em></li>
  <li><em>"Bounded queues + load shedding (503) instead of unbounded growth."</em></li>
  <li><em>"Multi-region active-active for resilience; data replication is the hard part."</em></li>
  <li><em>"SLO drives investment; error budget burning fast → freeze risk."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"feed / timeline"</td><td>Hybrid fan-out + cache + ranking</td></tr>
    <tr><td>"chat / messaging"</td><td>WebSocket + message store + ordered partitions</td></tr>
    <tr><td>"realtime"</td><td>Pub/sub + WebSocket + in-memory state</td></tr>
    <tr><td>"large file"</td><td>Object storage + chunked upload + CDN</td></tr>
    <tr><td>"search"</td><td>ElasticSearch / OpenSearch; or pgvector for similarity</td></tr>
    <tr><td>"rate limiter"</td><td>Token bucket via Redis Lua</td></tr>
    <tr><td>"counter"</td><td>Redis INCR + periodic flush; or sharded counter</td></tr>
    <tr><td>"unique ID"</td><td>UUIDv7 / Snowflake / random + check</td></tr>
    <tr><td>"high-write"</td><td>Cassandra / DynamoDB; or sharded Postgres</td></tr>
    <tr><td>"transactional"</td><td>Postgres + transactions; saga across services</td></tr>
    <tr><td>"queue"</td><td>Kafka for log; SQS for simple; idempotent consumers</td></tr>
    <tr><td>"global low-latency"</td><td>CDN + multi-region + per-region replicas</td></tr>
    <tr><td>"hot key / celebrity"</td><td>Pull-based for that key; multi-tier cache</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard)</h3>
<ol>
  <li>"Let me clarify scope first..." (Q&amp;A)</li>
  <li>"Recap: we're designing X for Y at Z scale, focused on A B C; out of scope D E."</li>
  <li>"Let me estimate..." (computes aloud)</li>
  <li>"High-level shape:" (sketches 5-7 boxes)</li>
  <li>"Walk through the key flow:" (one user action end-to-end)</li>
  <li>"Hardest parts: X, Y, Z. Want me to dive into one?"</li>
  <li>(Deep dive on chosen 2-3)</li>
  <li>"Bottlenecks at 10×: A, B. Mitigations: ..."</li>
  <li>"Reliability: replication; failover; multi-region."</li>
  <li>"Observability: metrics, logs, traces, SLOs."</li>
  <li>"Strong: ... Deferred: ... Given more time: ..."</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"I'd dive deeper into [specific bottleneck]."</em></li>
  <li><em>"I'd quantify the cost of multi-region active-active vs active-passive."</em></li>
  <li><em>"I'd specify the data partitioning strategy for the [specific table]."</em></li>
  <li><em>"I'd write out the SLO numbers and burn-rate alert thresholds."</em></li>
  <li><em>"I'd plan the migration path from monolith to extracted services."</em></li>
  <li><em>"I'd address [specific compliance / security concern]."</em></li>
  <li><em>"I'd benchmark the chosen DB against expected workload."</em></li>
  <li><em>"I'd run a chaos experiment to validate the fail-over story."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Structure</td><td>Walks framework calmly; doesn't skip steps</td></tr>
    <tr><td>Estimation</td><td>Computes aloud; has feel for numbers</td></tr>
    <tr><td>Tradeoffs</td><td>Names alternatives + cost</td></tr>
    <tr><td>Depth</td><td>Picks 2-3 deep dives; goes deep on each</td></tr>
    <tr><td>Breadth</td><td>Knows building blocks (cache, queue, replication)</td></tr>
    <tr><td>Time mgmt</td><td>Hits all 6 steps in 45-60 min</td></tr>
    <tr><td>Reactivity</td><td>Updates mental model on interviewer feedback</td></tr>
    <tr><td>Communication</td><td>Verbalizes decisions; never silent &gt; 30s</td></tr>
    <tr><td>Restraint</td><td>Doesn't over-engineer for unknown scale</td></tr>
    <tr><td>Wrap-up</td><td>Summarizes; honest about gaps</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>If problem involves mobile clients, mention BFF — composes microservice data into screen shapes; reduces cellular round trips.</li>
  <li>Cellular-friendly: aggressive caching; small payloads; idempotency keys for retry.</li>
  <li>Push notifications: SNS / FCM / APNs flow.</li>
  <li>Offline support: local cache + queue + sync layer.</li>
  <li>Real-time: WebSocket while foreground; push when backgrounded.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"What's the bottleneck at 10×?"</em> — Identify; usually DB write throughput, single-cache hot key, or bandwidth.</li>
  <li><em>"What if region goes down?"</em> — Multi-region active-passive minimum; data replication via async; DNS failover; tested RTO/RPO.</li>
  <li><em>"How do you ensure no data loss on crash?"</em> — Outbox pattern + WAL replication + retention; durable storage at every commit point.</li>
  <li><em>"How do you debug a slow request in production?"</em> — Trace + correlation IDs + structured logs + APM; reproduce in staging.</li>
  <li><em>"Why did you pick X over Y?"</em> — Always have a real reason: latency, throughput, ops cost, team familiarity. Not "best practice."</li>
  <li><em>"What's the cost?"</em> — Order of magnitude estimate: $1K, $10K, $100K, $1M/month based on storage + RPS + bandwidth.</li>
  <li><em>"How would you migrate from this design to next-scale?"</em> — Strangler fig; per-component evolution; shared API contracts.</li>
  <li><em>"What's the security story?"</em> — TLS in transit; encryption at rest; auth at edge; audit log; secrets in vault; least-privilege roles.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Walk through the framework on 5 different prompts; do timed mock interviews.</li>
  <li>Memorize the building blocks + their tradeoffs.</li>
  <li>Memorize the latency numbers + capacity ceilings (Postgres throughput, Redis ops/sec, Kafka throughput).</li>
  <li>Practice estimation: "100M users / X actions per day / 86400s = ?" until reflexive.</li>
  <li>Read 3-5 worked examples from system-design-primer.</li>
  <li>Practice tradeoff vocabulary out loud.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'Designing Data-Intensive Applications' cover to cover."</li>
  <li>"Watch Hello Interview videos; mock-interview style."</li>
  <li>"Pair with someone for timed mocks; get feedback."</li>
  <li>"Build one of the systems (URL shortener, rate limiter) end-to-end as a personal project."</li>
</ul>
`
    }
  ]
});
