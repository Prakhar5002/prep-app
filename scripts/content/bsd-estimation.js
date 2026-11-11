window.PREP_SITE.registerTopic({
  id: "bsd-estimation",
  module: 'backend-sd',
  title: "Estimation & Numbers",
  estimatedReadTime: "55 min",
  tags: ["system-design","estimation","back-of-envelope","capacity-planning","latency","throughput","availability","interview"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>DAU × actions ÷ 10⁵ = average QPS → × 3 for peak → split reads/writes → × size for storage (× 3 replicas) → × payload for bandwidth → 20% hot set for cache → ÷ per-box capacity for machines — then say what the number forces in the design.</strong></div>
  <h4>Key points (the numbers card)</h4>
  <ul>
    <li><strong>Latency ladder:</strong> L1 ~1 ns · RAM ~100 ns · SSD random read ~100 µs · same-datacenter round trip ~0.5 ms · HDD seek ~5-10 ms · cross-region ~20-80 ms · cross-continent ~100-200 ms.</li>
    <li><strong>Time:</strong> 1 day ≈ 86,400 s ≈ <strong>10⁵ s</strong> · 1 year ≈ <strong>3 × 10⁷ s</strong> · <strong>1M requests/day ≈ 12/s</strong> · 1B/day ≈ 12K/s.</li>
    <li><strong>Peak ≈ 2-3× average</strong> for normal daily curves; 10× or more for launches, sales and live events.</li>
    <li><strong>Per box (ballparks, ranges, depend on hardware and query shape):</strong> app server ~1K-10K req/s · Postgres/MySQL ~10K-50K simple reads/s; writes: plan ~5K simple writes/s per primary, ceiling ~20K · Redis ~100K ops/s per instance · Kafka partition ~10 MB/s planning number · Cassandra node ~10K writes/s.</li>
    <li><strong>Network:</strong> 1 Gbps ≈ 125 MB/s · <strong>10 Gbps ≈ 1.25 GB/s</strong>. Bits vs bytes is a factor of 8.</li>
    <li><strong>Sizes:</strong> UUID 16 B · timestamp 8 B · post/tweet row ~1 KB · chat message ~100-500 B · thumbnail ~20-50 KB · photo ~200 KB-2 MB · 1 min of 1080p video ~50 MB (streaming encode).</li>
    <li><strong>Multipliers:</strong> × 3 for replication · ~× 2 for indexes and row overhead · 80/20 → cache ~20% of the daily read set.</li>
    <li><strong>Nines:</strong> 99.9% ≈ 8.8 h/year (~44 min/month) · 99.99% ≈ 53 min/year (~4 min/month). Serial: multiply availabilities. Parallel: 1 − (1 − A)ⁿ.</li>
    <li><strong>S3:</strong> ~3,500 writes/s and ~5,500 reads/s <em>per prefix</em> (AWS-published guideline), scales with more prefixes.</li>
    <li><strong>Little's law:</strong> requests in flight = rate × latency (2,000 req/s × 50 ms = 100 concurrent).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Producing numbers and then never using them. An estimate is only worth the time if it ends in a sentence like "so a single Postgres is fine" or "so we must shard writes" or "so media goes to a CDN". The second trap is false precision: say "about 12K QPS", never "11,574 QPS".</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I'll round hard: a day is about 10⁵ seconds, so 1 billion requests a day is about 12K a second, call it 30-40K at peak."</div>
  <div class="revision-say">"That's beyond what one primary takes for writes, so this number is what forces sharding, or batching through a queue."</div>
  <div class="revision-say">"If my estimate is off by 10×, the shape changes here and not there. Let me show you where the line is."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What the estimation step really is</h3>
<p>Back-of-the-envelope estimation is 3-5 minutes of arithmetic early in a system design interview that turns "design Twitter" into "design a system that takes ~15K writes/s at peak, ~1M timeline inserts/s, and ~550 TB/year of replicated text". Those numbers decide almost every box you draw afterwards. The step sits inside the framework in <a href="#/topic/bsd-framework">Backend SD Framework</a> (step 2). This topic is the reference you learn by heart so the step costs you no thinking time.</p>

<h3>What interviewers check</h3>
<table>
  <thead><tr><th>What they watch</th><th>Strong signal</th><th>Weak signal</th></tr></thead>
  <tbody>
    <tr><td>Do you know the reference numbers?</td><td>Says "RAM ~100 ns, SSD ~100 µs" without hesitating</td><td>Guesses, or skips estimation entirely</td></tr>
    <tr><td>Method</td><td>DAU → QPS → peak → storage → bandwidth → cache → boxes, in that order</td><td>Random numbers with no chain between them</td></tr>
    <tr><td>Rounding</td><td>Rounds to one significant figure and powers of 10, out loud</td><td>Long division on the whiteboard; "11,574.07 per second"</td></tr>
    <tr><td>Assumptions</td><td>States each one, and asks "does that sound right?"</td><td>Silent assumptions that the interviewer finds later</td></tr>
    <tr><td>Numbers → decisions</td><td>"So writes don't fit one primary → shard by user_id"</td><td>Computes storage, then never mentions it again</td></tr>
    <tr><td>Sensitivity</td><td>Knows which assumption matters most and what happens at 10×</td><td>Defends the number instead of the design</td></tr>
  </tbody>
</table>

<h3>Why numbers drive decisions</h3>
<p>Most design choices have a threshold. Under it the simple design is correct and anything more is over-engineering. Over it the simple design falls over. Estimation tells you which side of each threshold you are on:</p>
<ul>
  <li><strong>100 writes/s vs 100K writes/s</strong> is the difference between "one Postgres with a replica" and "sharded store plus a write buffer".</li>
  <li><strong>A 10 GB hot set vs a 10 TB hot set</strong> is "one Redis node" vs "a cache cluster with its own sharding and failure story".</li>
  <li><strong>200 followers vs 100M followers</strong> is "push on write" vs "pull for celebrities".</li>
  <li><strong>A 50 ms p99 budget vs a 150 ms cross-continent RTT</strong> means you cannot serve those users from one region.</li>
  <li><strong>1 Gbps vs 100 Tbps of egress</strong> is "serve from the app" vs "a CDN embedded in ISPs is the only option".</li>
</ul>
<div class="callout insight"><div class="callout-title">The point of the exercise</div>
<p>Interviewers do not grade whether your number matches theirs. They grade whether you can get to the right <em>order of magnitude</em> quickly, and whether the design you then draw is consistent with it. A design for 100 QPS that includes Kafka, Cassandra and 40 shards fails for the same reason as a design for 1M QPS that is one Postgres box.</p></div>

<h3>Why this is learnable</h3>
<p>There are only about 40 numbers in this whole topic, and about 10 of them do most of the work (the revision card). Every drill below reuses the same handful: 10⁵ s/day, peak × 3, replication × 3, 1 KB per row, 100K ops/s per Redis, ~5K simple writes/s per database primary (ceiling ~20K), 1.25 GB/s per 10 Gbps NIC. Learn those, do the 14 drills twice, then do the 12 self-test prompts from memory.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ The Method", collapsible: true, html: `
<h3>The chain (always in this order)</h3>
<div class="diagram"><pre>
 Users ──► DAU ──► actions/user/day ──► requests/day
                                            │  ÷ 10⁵
                                            ▼
                                  average QPS ──× 2-3──► peak QPS
                                            │
                       ┌────────────────────┴───────────┐
                       ▼                                ▼
                  write QPS                         read QPS
                       │                                │
        × bytes/write  │                                │  × bytes/read
                       ▼                                ▼
   storage/day ─× 365─► storage/yr           egress bandwidth
        │ × 3 replicas                                  │
        ▼                                               ▼
   shard count (÷ per-node size)      CDN? (÷ per-NIC 1 GB/s)
                                                        │
   hot set (≈20% of daily reads) ──► cache RAM ─────────┘
        │
        ▼
   machines = peak QPS ÷ per-box capacity
              (× ~1.5 headroom, + N for failure)
        │
        ▼
   THE DECISION the numbers force  ◄── never skip this
</pre></div>

<h3>Step by step</h3>
<ol>
  <li><strong>Users → DAU.</strong> If they give total users, DAU is often 10-50% of it. Ask, or state an assumption.</li>
  <li><strong>Actions per user per day</strong>, separately for writes (posts, messages, uploads) and reads (feed opens, views, searches). Reads are usually 10-100× writes for consumer apps.</li>
  <li><strong>Average QPS</strong> = requests/day ÷ 10⁵. Do not use 86,400. 10⁵ is 16% more seconds than a real day, so it understates QPS by ~14%; the × 3 peak factor more than covers that.</li>
  <li><strong>Peak QPS</strong> = average × 2-3 for normal daily curves. Use 10× or more when the prompt has events (sales, launches, match finals, New Year). If traffic is office-hours only, divide by ~3 × 10⁴ s (8 hours) instead of 10⁵.</li>
  <li><strong>Read/write split.</strong> Size the write path and the read path separately. They usually end in different decisions (write path → sharding or a queue; read path → cache or CDN).</li>
  <li><strong>Storage per day</strong> = writes/day × bytes per write. Then × 365 per year, × 3 for replication, × ~2 if you want to account for indexes and row overhead. Blobs (photos, video) are counted separately from rows.</li>
  <li><strong>Bandwidth</strong> = QPS × payload, in and out. Convert to Gbps (× 8) and compare with ~10 Gbps per box.</li>
  <li><strong>Cache</strong> = hot set. With an 80/20 skew, caching ~20% of the daily distinct items serves most reads. Compare with ~50-100 GB usable per cache node.</li>
  <li><strong>Machines/shards</strong> = peak ÷ per-box capacity, with ~30-50% headroom and room to lose a node. For concurrency, use Little's law: in-flight = rate × latency.</li>
  <li><strong>Decision.</strong> Say out loud which threshold each number crosses (table below).</li>
</ol>

<h3>How to round and narrate</h3>
<ul>
  <li><strong>One significant figure, powers of ten.</strong> 86,400 → 10⁵. 365 → 400 (or 3 × 10⁷ s per year). 1,024 → 1,000. 2.6M s/month → 2.5 × 10⁶.</li>
  <li><strong>Round in the safe direction.</strong> Round load up and capacity down. 10⁵ s/day understates QPS by ~14%, so rounding peak up to × 3 more than covers it.</li>
  <li><strong>Write the exponents, not the zeros.</strong> 5 × 10⁸ tweets × 10³ B = 5 × 10¹¹ B = 500 GB. Adding exponents is faster and safer than counting zeros.</li>
  <li><strong>Narrate as you go:</strong> "500 million tweets a day, a day is 10⁵ seconds, so about 5,000 a second average, call it 15K peak. We plan ~5K simple writes a second per primary, with a ceiling around 20K, so writes alone already need sharding or batching."</li>
  <li><strong>Stop when you have the decision.</strong> You do not need every number for every system. A URL shortener's bandwidth is not interesting; its keyspace is.</li>
  <li><strong>Check yourself with a sanity anchor.</strong> "1B/day ≈ 12K/s" catches most slipped zeros.</li>
</ul>

<h3>Numbers → decisions</h3>
<p>This is the table that turns arithmetic into design. Thresholds are deliberately rough: they say "you are near the line, act", not "at 10,001 it breaks".</p>
<table>
  <thead><tr><th>If the estimate says…</th><th>Rough threshold</th><th>Design move it triggers</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Sustained write QPS beyond one primary</td><td>above ~5K simple writes/s sustained (plan number; ceiling ~20K; heavier transactions: lower)</td><td>Shard by the write key; or buffer through a queue and batch; or an LSM store (Cassandra, DynamoDB)</td><td>A single primary is bound by commit + fsync and lock contention; replicas do not add write capacity</td></tr>
    <tr><td>Read QPS beyond primary + a few replicas</td><td>above ~tens of K reads/s</td><td>Cache-aside in Redis; read replicas; see <a href="#/topic/be-caching">Caching</a></td><td>Reads are cheap to scale out if you accept slight staleness</td></tr>
    <tr><td>Hot set fits in RAM</td><td>up to ~50-100 GB per node, a few TB across a cluster</td><td>Cache it all (or keep the whole dataset in memory)</td><td>RAM is ~1,000× faster than SSD; at this size it is cheap</td></tr>
    <tr><td>One key gets a huge share of traffic</td><td>above ~1K-10K ops/s on one key or row</td><td>Sharded counters, in-memory aggregation, local caches, request coalescing</td><td>Sharding by key does not help a hot key: it lands on one shard</td></tr>
    <tr><td>Fan-out × followers too large</td><td>writes × avg followers in the millions/s, or authors with ~10⁵+ followers</td><td>Hybrid fan-out: push for normal authors, pull for celebrities at read time</td><td>One celebrity post would otherwise be 10⁸ inserts</td></tr>
    <tr><td>p99 budget vs cross-region RTT</td><td>budget under ~2 × the RTT to users</td><td>Regional deployment; read locally; route writes to a home region per entity</td><td>You cannot beat the speed of light; one RTT may already eat the budget</td></tr>
    <tr><td>Storage growth vs one node</td><td>beyond a few TB to ~10-20 TB per DB node (ops limit: backups, restores, vacuum)</td><td>Partition; tier old data to cold storage; set retention and TTLs</td><td>Restoring a 30 TB node takes hours to days; that is your RTO</td></tr>
    <tr><td>Objects above ~1 MB, or blob bytes ≫ row bytes</td><td>photos, video, files</td><td>Object storage (S3/R2) for bytes, DB for metadata only, presigned uploads</td><td>DBs are bad at large blobs; object stores are built for them</td></tr>
    <tr><td>Egress bandwidth</td><td>beyond a few Gbps per region, or global users</td><td>CDN in front of static and media</td><td>Each box tops out near its NIC (~10-25 Gbps); edges also cut latency</td></tr>
    <tr><td>Concurrent persistent connections</td><td>beyond ~100K</td><td>Dedicated connection gateway tier, session registry (user → gateway)</td><td>Connections cost memory and file descriptors, not QPS</td></tr>
    <tr><td>Event stream throughput</td><td>above ~10 MB/s per partition</td><td>Partition count = peak MB/s ÷ ~10 MB/s (and ≥ consumer parallelism); see <a href="#/topic/be-kafka">Kafka Deep</a></td><td>Ordering and consumer parallelism are per partition</td></tr>
    <tr><td>Object-store request rate</td><td>above ~3,500 writes/s or ~5,500 reads/s on one prefix</td><td>Spread keys across prefixes (hash prefix)</td><td>Per-prefix limits throttle with 503s</td></tr>
    <tr><td>Peak ≫ average (10× or more)</td><td>flash sales, live events, notification blasts</td><td>Queue to absorb, virtual waiting room, pre-scaling, jittered sends</td><td>Sizing for the average fails at exactly the moment that matters</td></tr>
    <tr><td>Numbers are small</td><td>under ~1K QPS and under ~1 TB</td><td><strong>One Postgres + replica, one app tier. Stop.</strong></td><td>Anything more is cost and failure modes with no benefit</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Numbers to Know by Heart", collapsible: true, html: `
<div class="callout note"><div class="callout-title">How to read these tables</div>
<p>These are the commonly cited orders of magnitude (the "latency numbers every programmer should know" lineage, updated for NVMe SSDs and modern networks, plus widely quoted vendor and benchmark ballparks). Real values vary with hardware, payload size, query shape and configuration. In the interview say "roughly" and "order of magnitude", and if it matters, "I'd benchmark this".</p></div>

<h3>1. Latency ladder</h3>
<table>
  <thead><tr><th>Operation</th><th>Order of magnitude</th><th>Why it matters</th></tr></thead>
  <tbody>
    <tr><td>L1 cache reference</td><td>~1 ns (0.5-1 ns)</td><td>The floor. Tight in-process loops are effectively free.</td></tr>
    <tr><td>L2 cache reference</td><td>~5-10 ns</td><td>Data layout matters for hot loops, rarely for system design.</td></tr>
    <tr><td>Mutex lock/unlock (uncontended)</td><td>~10-25 ns</td><td>Cheap until contended; contention, not the lock, is the cost.</td></tr>
    <tr><td>Main memory (RAM) reference</td><td>~100 ns</td><td>Why in-memory stores (Redis) answer in microseconds end to end.</td></tr>
    <tr><td>Compress 1 KB (fast codec: Snappy/LZ4/zstd-fast)</td><td>~2-10 µs</td><td>Compressing payloads is cheap compared with sending them across a network.</td></tr>
    <tr><td>Read 1 MB sequentially from RAM</td><td>~10-50 µs</td><td>Scanning memory is fast; scanning gigabytes per request is not.</td></tr>
    <tr><td>SSD (NVMe) random read, 4 KB</td><td>~20-100 µs (older SATA: ~100-150 µs)</td><td>~1,000× RAM. An indexed DB read that misses the buffer cache costs this, per page.</td></tr>
    <tr><td>Round trip within one datacenter / availability zone</td><td>~0.1-0.5 ms (cross-AZ ~0.5-2 ms)</td><td>A chatty service doing 20 sequential calls burns ~10 ms just on hops.</td></tr>
    <tr><td>Read 1 MB sequentially from SSD</td><td>~0.2-1 ms</td><td>Streaming large files from SSD is bandwidth-bound, not seek-bound.</td></tr>
    <tr><td>Send 1 MB over a 10 Gbps network</td><td>~1 ms</td><td>Large payloads cost time on the wire, not just in the round trip.</td></tr>
    <tr><td>HDD seek</td><td>~5-10 ms</td><td>~100 random IOPS per disk: HDDs are only for sequential or cold data.</td></tr>
    <tr><td>Read 1 MB sequentially from HDD</td><td>~5-10 ms</td><td>Cheap capacity for logs and archives, not for random access.</td></tr>
    <tr><td>Cross-region round trip, same continent</td><td>~20-80 ms</td><td>Synchronous cross-region replication adds this to every write.</td></tr>
    <tr><td>Cross-continent round trip</td><td>~100-200 ms (e.g. India ↔ US East ~200 ms+)</td><td>A TLS connection setup costs 2-3 of these: serve from nearby regions or edges.</td></tr>
  </tbody>
</table>
<p><strong>Memorise four:</strong> RAM ~100 ns · SSD ~100 µs · same-DC RTT ~0.5 ms · cross-continent ~150 ms. The big jumps are memory → storage (~1,000×) and in-DC → WAN (~300×); SSD and a same-DC hop are the same order of magnitude.</p>

<h3>2. Throughput per box (ballparks, stated as ranges)</h3>
<table>
  <thead><tr><th>Component</th><th>Commonly cited ballpark</th><th>Caveats</th><th>Why it matters</th></tr></thead>
  <tbody>
    <tr><td>Web/app server, simple JSON endpoint</td><td>~1K-10K req/s per instance (4-8 cores); tens of K for trivial handlers</td><td>Drops fast with CPU work, serialization, and blocking downstream calls. Plan ~1K-5K for a handler that does DB/cache calls.</td><td>Stateless, so app servers are the easy part: count = peak ÷ per-box.</td></tr>
    <tr><td>Postgres/MySQL simple indexed reads</td><td>~10K-50K QPS per node (more if fully cached and tiny)</td><td>Working set in RAM vs disk; connection count (use a pooler); query shape.</td><td>Primary + a few replicas covers most read loads before you need a cache.</td></tr>
    <tr><td>Postgres/MySQL simple writes</td><td>plan ~5K simple writes/s per primary, ceiling ~20K</td><td>Commit + fsync bound; group commit and batching push toward the ceiling; multi-row transactions and many indexes push lower.</td><td>The single most common reason to shard or put a queue in front.</td></tr>
    <tr><td>Redis (single instance)</td><td>~100K ops/s simple GET/SET (up to ~1M with pipelining)</td><td>Mostly single-threaded command execution; large values and O(N) commands kill it.</td><td>One node absorbs most read caches; 1M ops/s means ~10+ shards.</td></tr>
    <tr><td>Kafka partition</td><td>~10 MB/s planning number (can go higher)</td><td>Message size, replication factor, acks, compression, consumer speed.</td><td>Partition count = peak MB/s ÷ ~10, and also ≥ the consumer parallelism you need.</td></tr>
    <tr><td>Kafka broker</td><td>~100s of MB/s; ~100K-1M small msgs/s</td><td>Disk and NIC bound; replication traffic counts too.</td><td>A small cluster (3-6 brokers) carries most companies' event volume.</td></tr>
    <tr><td>Cassandra node</td><td>~10K-50K writes/s; reads lower (~5K-20K)</td><td>Consistency level, row size, compaction strategy, read path hitting disk.</td><td>Write-heavy append workloads scale linearly by adding nodes.</td></tr>
    <tr><td>S3 per prefix</td><td>~3,500 PUT/COPY/POST/DELETE and ~5,500 GET/HEAD per second</td><td>AWS-published guideline; scales with the number of prefixes.</td><td>High-rate uploads need key prefixes spread out (hash prefix). See <a href="#/topic/cloud-s3">S3</a>.</td></tr>
    <tr><td>Network interface</td><td>1 Gbps ≈ 125 MB/s; 10 Gbps ≈ 1.25 GB/s; cloud boxes commonly 10-25 Gbps</td><td>Practical goodput is lower than line rate; cloud instance types cap it.</td><td>Media-heavy egress hits the NIC before the CPU: that is when you add a CDN.</td></tr>
    <tr><td>NVMe SSD</td><td>~100K-1M random IOPS; ~2-7 GB/s sequential</td><td>Queue depth, block size, cloud volume caps (network disks are much lower).</td><td>Disk is rarely the limit on local NVMe; on cloud network volumes it often is.</td></tr>
    <tr><td>Persistent connections per box (WebSocket/MQTT)</td><td>~100K-1M with tuning; plan ~100K</td><td>Memory per connection, file-descriptor limits, heartbeat traffic.</td><td>Chat and live apps size the gateway tier by connections, not QPS.</td></tr>
  </tbody>
</table>

<h3>3. Sizes</h3>
<table>
  <thead><tr><th>Thing</th><th>Size</th><th>Why it matters</th></tr></thead>
  <tbody>
    <tr><td>char (ASCII / UTF-8)</td><td>1 B ASCII; 1-4 B UTF-8 (Hindi/emoji: 3-4 B)</td><td>Non-Latin text is 2-3× bigger than the character count suggests.</td></tr>
    <tr><td>int / bigint</td><td>4 B / 8 B</td><td>IDs at scale are 8 B (64-bit snowflake-style).</td></tr>
    <tr><td>UUID</td><td>16 B binary; 36 B as text</td><td>Storing UUIDs as text more than doubles key and index size.</td></tr>
    <tr><td>Timestamp</td><td>8 B</td><td>Small, but on every row and often in every index.</td></tr>
    <tr><td>Tweet / post row</td><td>~300 B-1 KB with metadata; plan 1 KB</td><td>1 KB makes the arithmetic trivial and leaves margin.</td></tr>
    <tr><td>Chat message</td><td>~100 B text; ~200-500 B stored with metadata</td><td>Tiny per message; volume (10¹¹/day) is what makes it big.</td></tr>
    <tr><td>Thumbnail</td><td>~20-50 KB</td><td>Feeds load dozens per screen: cache them at the CDN.</td></tr>
    <tr><td>Photo</td><td>~200-500 KB served; ~2-5 MB original from a phone</td><td>Keep the original once, serve resized variants.</td></tr>
    <tr><td>1 minute of 720p video (streaming encode)</td><td>~20-30 MB</td><td>Bitrate ~2.5-4 Mbps; codec-dependent.</td></tr>
    <tr><td>1 minute of 1080p video (streaming encode)</td><td>~40-60 MB (raw phone recording ~100+ MB)</td><td>Video dominates every storage and egress estimate it appears in.</td></tr>
    <tr><td>Average web page</td><td>~2 MB total weight; HTML alone ~50-100 KB (~10-20 KB gzipped)</td><td>A crawler that stores only HTML stores ~1/20th of the page weight.</td></tr>
    <tr><td>DB row with index overhead</td><td>~1.5-3× raw data (row header ~24 B in Postgres, plus each index entry)</td><td>Use × 2 on raw row bytes for real disk usage.</td></tr>
  </tbody>
</table>

<h3>4. Shortcuts</h3>
<table>
  <thead><tr><th>Shortcut</th><th>Value</th><th>Why it matters</th></tr></thead>
  <tbody>
    <tr><td>Powers of two ≈ powers of ten</td><td>2¹⁰ ≈ 10³ (KB) · 2²⁰ ≈ 10⁶ (MB) · 2³⁰ ≈ 10⁹ (GB) · 2⁴⁰ ≈ 10¹² (TB) · 2⁵⁰ ≈ 10¹⁵ (PB) · 10¹⁸ = EB</td><td>Never argue 1,000 vs 1,024 in an interview; the 2.4% does not change a design.</td></tr>
    <tr><td>Seconds in a day</td><td>86,400 ≈ <strong>10⁵</strong></td><td>Every QPS estimate starts here.</td></tr>
    <tr><td>Seconds in a working day</td><td>8 h ≈ 3 × 10⁴</td><td>B2B/office apps concentrate load: ~3× higher average than spreading over 24 h.</td></tr>
    <tr><td>Seconds in a month / year</td><td>~2.5 × 10⁶ / ~3 × 10⁷</td><td>Monthly quotas and yearly storage.</td></tr>
    <tr><td>1M requests/day</td><td>≈ 12 req/s</td><td>The anchor: 100M/day ≈ 1.2K/s, 1B/day ≈ 12K/s, 10B/day ≈ 120K/s.</td></tr>
    <tr><td>Peak vs average</td><td>2-3× (events: 10×+)</td><td>Size capacity for peak; average is for cost.</td></tr>
    <tr><td>Read:write ratio</td><td>consumer social ~100:1; chat ~1:1; logging/IoT mostly writes</td><td>Decides whether you optimise the read path or the write path.</td></tr>
    <tr><td>80/20</td><td>~20% of items get ~80% of reads</td><td>Cache ~20% of the daily read set to serve most reads.</td></tr>
    <tr><td>Replication</td><td>× 3 (object stores with erasure coding ~× 1.5)</td><td>Storage estimates without this are off by 3×.</td></tr>
    <tr><td>QPS × payload</td><td>1K req/s × 1 MB = 1 GB/s ≈ 8 Gbps</td><td>Bandwidth in one line; × 8 to get bits.</td></tr>
    <tr><td>Little's law</td><td>in-flight = rate × latency</td><td>Sizes thread pools, connection pools and concurrent workers.</td></tr>
  </tbody>
</table>

<h3>5. Availability: the nines</h3>
<table>
  <thead><tr><th>Availability</th><th>Downtime / year</th><th>Downtime / month</th><th>Why it matters</th></tr></thead>
  <tbody>
    <tr><td>99% ("two nines")</td><td>~3.65 days</td><td>~7.2 h</td><td>A single box with manual recovery.</td></tr>
    <tr><td>99.9% ("three nines")</td><td>~8.8 h</td><td>~44 min</td><td>Typical internal service SLO; one bad deploy a month uses it up.</td></tr>
    <tr><td>99.95%</td><td>~4.4 h</td><td>~22 min</td><td>Common cloud managed-database SLA level.</td></tr>
    <tr><td>99.99% ("four nines")</td><td>~53 min</td><td>~4.3 min</td><td>No human in the recovery loop: needs automatic failover.</td></tr>
    <tr><td>99.999% ("five nines")</td><td>~5.3 min</td><td>~26 s</td><td>Multi-region active-active; very expensive. Payments core, telecom.</td></tr>
  </tbody>
</table>
<p><strong>Serial (A depends on B):</strong> availabilities multiply. Three 99.9% services in a chain → 0.999³ ≈ 99.7% (~26 h/year). Every hard dependency you add lowers the ceiling.</p>
<p><strong>Parallel (redundant copies, any one is enough):</strong> 1 − (1 − A)ⁿ. Two independent 99% replicas → 1 − 0.01² = 99.99%. This assumes independent failures. Shared power, a shared bad deploy or a shared region break that assumption, which is why "redundant" is not automatically "available". See <a href="#/topic/be-resilience">Resilience</a>.</p>
<div class="callout warn"><div class="callout-title">Availability budget, worked</div>
<p>Target 99.99% for an API that calls a DB (99.95%) and a cache (99.9%) in series: 0.9995 × 0.999 ≈ 99.85%, already below target. Decision: the cache must be optional (fall back to the DB when it is down), and the DB needs a hot standby with automatic failover. The math tells you which dependencies must be made soft.</p></div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Worked Drills", collapsible: true, html: `
<p>Each drill follows the same chain, shows the arithmetic, and ends with the decision the numbers force. Assumptions are stated up front; in an interview you would confirm them. Do these with the answer covered first.</p>

<h3>Drill 1: Twitter / X home timeline</h3>
<p><strong>Assume:</strong> 200M DAU, 500M tweets/day, each user opens the timeline 10 times/day, 20 tweets per page, average 200 followers, tweet row 1 KB, 10% of tweets carry ~500 KB of media.</p>
<pre><code class="language-text">Writes:   5 × 10⁸ tweets/day ÷ 10⁵ s      ≈ 5K/s avg   → ~15K/s peak
Reads:    2 × 10⁸ DAU × 10 opens = 2 × 10⁹/day ÷ 10⁵ ≈ 20K/s avg → ~60K/s peak
          each open hydrates 20 tweets → ~1.2M tweet lookups/s at peak
Fan-out:  5 × 10⁸ tweets × 200 followers = 10¹¹ inserts/day ÷ 10⁵ ≈ 1M/s avg (~3M/s peak)
Storage:  5 × 10⁸ × 1 KB = 500 GB/day → × 365 ≈ 180 TB/yr → × 3 ≈ 550 TB/yr (text)
Media:    5 × 10⁷ × 500 KB = 25 TB/day → ~9 PB/yr (object storage, erasure coded)
Cache:    800 tweet ids × 8 B = 6.4 KB per user × 2 × 10⁸ ≈ 1.3 TB of timelines
Egress:   60K pages/s × 20 × 1 KB ≈ 1.2 GB/s ≈ 10 Gbps of text; media via CDN</code></pre>
<p><strong>Decision:</strong> 15K tweet writes/s is beyond one primary, so the tweet store is sharded by tweet id. The real load is the 1M+/s fan-out inserts, which go through a queue to async workers. A celebrity with 100M followers would be 10⁸ inserts for one tweet, so use <strong>hybrid fan-out</strong>: push for normal authors, pull for authors over a follower threshold and merge at read time. ~1.3 TB of timeline ids means a Redis cluster of a few dozen nodes (with replicas), not one box. Media never touches the app tier: object storage plus CDN.</p>

<h3>Drill 2: WhatsApp messaging</h3>
<p><strong>Assume:</strong> 1B DAU, 100B messages/day, ~200 B per stored message, 10-20% of DAU online at peak, 5% of messages carry ~200 KB of media.</p>
<pre><code class="language-text">Messages:     10¹¹/day ÷ 10⁵ = 1M msg/s avg → ~2-3M/s peak (New Year: higher)
Text bytes:   1M/s × 200 B = 200 MB/s ≈ 1.6 Gbps (small)
Media bytes:  5 × 10⁴ media/s × 200 KB = 10 GB/s ≈ 80 Gbps (big)
Connections:  10⁹ × 10-20% = 100-200M concurrent sockets
Gateways:     2 × 10⁸ ÷ ~10⁵ per box ≈ 2,000 boxes (fewer with heavy tuning)
Registry:     2 × 10⁸ online users × ~100 B (user → gateway) ≈ 20 GB in memory
Storage A (store-and-forward, delete on delivery; ~10% queued ~1 day):
              10¹⁰ × 200 B ≈ 2 TB working set
Storage B (keep full history server-side):
              10¹¹ × 200 B = 20 TB/day → ~7 PB/yr → × 3 ≈ 22 PB/yr</code></pre>
<p><strong>Decision:</strong> QPS is not the hard part; <strong>connections</strong> are. That forces a dedicated gateway tier sized by sockets, plus an in-memory session registry to route each message to the right gateway. The product question "do we keep history on the server?" changes storage by ~10,000× after one year (2 TB working set vs 22 PB/yr), so ask it. Media goes to object storage and the message carries only a reference; otherwise media bandwidth is 50× the text path.</p>

<h3>Drill 3: YouTube uploads (and viewing)</h3>
<p><strong>Assume:</strong> 500 hours of video uploaded per minute (the widely quoted figure), uploads average ~50 MB per minute of video, the transcoded rendition ladder adds about the same again, transcoding a full ladder costs ~10 CPU-minutes per video-minute (rough, codec-dependent), 1B hours watched per day at ~2.5 Mbps average.</p>
<pre><code class="language-text">Upload rate:  500 h/min = 30,000 video-min per minute = 500 video-min per second
Ingest:       500 × 50 MB = 25 GB/s ≈ 200 Gbps
Per day:      30,000 × 1,440 ≈ 4.3 × 10⁷ video-min/day
Storage:      4.3 × 10⁷ × (50 + 50) MB ≈ 4 PB/day → ~1.5 EB/yr (+ ~1.5× erasure coding)
Transcode:    500 video-min/s × 10 CPU-min = 5,000 CPU-min every second
              = 300,000 core-seconds per second ≈ 300K cores busy, continuously
Upload count: 500 video-min/s ÷ ~5 min avg length ≈ 100 uploads/s (QPS is tiny)
Viewing:      10⁹ h × 3,600 s ÷ 10⁵ s ≈ 3.6 × 10⁷ concurrent streams (avg)
              × 2.5 Mbps ≈ 90 Tbps (~100 Tbps) of egress</code></pre>
<p><strong>Decision:</strong> 100 uploads/s is nothing, 200 Gbps of ingest is a lot, so uploads go <strong>directly to object storage</strong> via resumable, chunked, presigned uploads and never through the API tier. 300K cores of transcoding means a queue-driven, chunk-parallel worker fleet (and why large platforms build hardware encoders); for the long tail, transcode rare renditions lazily. ~100 Tbps of egress can only be served by a CDN with caches inside ISP networks.</p>

<h3>Drill 4: URL shortener</h3>
<p><strong>Assume:</strong> 100M new links/month, read:write 100:1, ~500 B per stored row (long URL + code + metadata + index), 5-year retention.</p>
<pre><code class="language-text">Writes:   10⁸ ÷ 2.5 × 10⁶ s/month ≈ 40/s avg → ~120/s peak
Reads:    40 × 100 = 4K redirects/s avg → ~12K/s peak  (≈ 350M redirects/day)
Storage:  10⁸ × 500 B = 50 GB/month → 600 GB/yr → 3 TB over 5 yr (→ ~9 TB with 3 copies)
Keyspace: 6 × 10⁹ links over 5 yr. base62: 62⁶ ≈ 5.7 × 10¹⁰, 62⁷ ≈ 3.5 × 10¹²
Cache:    20% of a month's links: 2 × 10⁷ × 500 B = 10 GB → one Redis node
Clicks:   350M click events/day ≈ 4K/s of analytics writes</code></pre>
<p><strong>Decision:</strong> 120 writes/s and 3 TB over five years fit <strong>one database with a replica</strong>; no sharding on day one. 12K reads/s at peak is one Redis node, so cache-aside in front of the DB. Use 7-character codes: 6 would technically fit but would be ~10% full and make random-code collisions frequent. The surprise is analytics: click events are 100× the link writes (4K/s vs 40/s), so they go to a stream (Kafka) and are aggregated, never written row-by-row into the link table.</p>

<h3>Drill 5: Payment system</h3>
<p><strong>Assume:</strong> 100M payments/day, peak 5-10× on sale and salary days, ~10 DB writes per payment (payment row, state transitions, double-entry ledger rows, idempotency key, outbox), ~500 B per row, 7-10 year retention, external PSP/bank call 200 ms-2 s.</p>
<pre><code class="language-text">Payments:  10⁸ ÷ 10⁵ ≈ 1K/s avg → ~5-10K/s peak
DB writes: × 10 per payment → ~10K/s avg, ~50-100K/s peak
Storage:   10⁸ × 10 rows × 500 B = 500 GB/day → ~180 TB/yr → × 3 ≈ 550 TB/yr
Retention: × 7-10 years → several PB kept for audit
In flight: Little's law: 10K/s × ~1 s external call ≈ 10,000 payments waiting at once
Bandwidth: trivial (KB-sized requests)</code></pre>
<p><strong>Decision:</strong> 50-100K writes/s at peak needs <strong>sharding by merchant or account</strong>, chosen so one payment's rows (payment + its ledger entries) stay on one shard and remain a local ACID transaction. 10,000 payments waiting on banks means the external call must be asynchronous: idempotency keys, timeouts, retries, webhooks and reconciliation (see <a href="#/topic/be-event-driven">Event-Driven</a> for the outbox). Years of retention means hot/cold tiering after a few months. Correctness, not throughput, stays the hard part.</p>

<h3>Drill 6: Uber driver location pings</h3>
<p><strong>Assume:</strong> 1M drivers online at peak, a ping every 4 s, ~100 B per ping, ~20M trips/day.</p>
<pre><code class="language-text">Pings:      10⁶ ÷ 4 s = 250K writes/s at peak (~100K/s daily average)
Ingest:     250K × 100 B = 25 MB/s (small)
Live state: 10⁶ drivers × 100 B = 100 MB (fits in RAM on one box)
History:    10⁵/s avg × 100 B × 10⁵ s ≈ 1 TB/day → ~350 TB/yr (→ ~1 PB with 3 copies)
Matching:   2 × 10⁷ trips ÷ 10⁵ ≈ 200/s avg → ~1-2K nearby-driver queries/s at peak
Kafka:      25 MB/s ÷ 10 MB/s per partition → ≥ 3 partitions (use many more, by city)</code></pre>
<p><strong>Decision:</strong> 250K writes/s into a durable relational table would need dozens of shards, but the live state is only 100 MB. So keep <strong>current location in memory</strong> (an in-memory geo index such as Redis GEO or geohash buckets, sharded by city/region, overwrite in place) and send raw pings to Kafka for history, analytics and ETA models, tiered to cold storage. The ping interval is a product knob: 4 s → 8 s halves the write load.</p>

<h3>Drill 7: Notification blast</h3>
<p><strong>Assume:</strong> send one push to 100M users within 10 minutes, 1.5 devices per user, ~200 B per device-token record, one sender worker does ~1K-5K sends/s over HTTP/2 to APNs/FCM, 10% of recipients tap within 10 minutes.</p>
<pre><code class="language-text">Tokens:      10⁸ × 1.5 = 1.5 × 10⁸ device tokens × 200 B = 30 GB to read
Send rate:   1.5 × 10⁸ ÷ 600 s ≈ 250K sends/s
Workers:     250K ÷ 1-5K per worker ≈ 50-250 workers
Queue msgs:  batch 1,000 tokens per message → 150K queue messages, not 150M
Click spike: 10⁷ taps ÷ 600 s ≈ 17K req/s extra on the landing API, in a burst</code></pre>
<p><strong>Decision:</strong> read tokens by <strong>partitioned scan</strong> (a planned full read of 30 GB), not 150M random lookups. Fan out through a queue in batches, rate-limited per provider, with an idempotency key per (campaign, device) so retries do not double-send (see <a href="#/topic/be-queues">Queues</a>). The second-order number is the click-through spike: pre-warm caches for the landing content and spread the send over the window with jitter, or the blast becomes a self-inflicted outage.</p>

<h3>Drill 8: Web crawler</h3>
<p><strong>Assume:</strong> crawl 1B pages/month, HTML ~100 KB per page (~20 KB compressed), 10B known URLs in the frontier, ~1 s per fetch (DNS + TLS + download), ~30 ms CPU to parse, politeness 1 request/s per host.</p>
<pre><code class="language-text">Fetch rate:   10⁹ ÷ 2.5 × 10⁶ s ≈ 400 pages/s
Download:     400 × 100 KB = 40 MB/s ≈ 320 Mbps (one NIC could do it)
In flight:    Little's law: 400/s × 1 s = 400 concurrent fetches (one async box)
Parse CPU:    400 × 30 ms = 12 core-seconds per second → ~12 cores
Storage:      10⁹ × 20 KB compressed = 20 TB/month → ~240 TB/yr (latest versions)
Frontier:     10¹⁰ URLs × 100 B = 1 TB (does not fit in RAM: disk-backed, by host)
Seen-set:     Bloom filter, 1% false positives ≈ 10 bits/URL → 10¹⁰ × 10 bits ≈ 12 GB
Big host:     10⁷ pages at 1 req/s = 10⁷ s ≈ 115 days</code></pre>
<p><strong>Decision:</strong> raw throughput is small; the design is driven by the <strong>frontier and politeness</strong>. The frontier is a disk-backed queue partitioned by host so each host gets its own rate limit. A 12 GB Bloom filter (sharded) gives "have I seen this URL?" in memory, plus content hashes for duplicate pages. The 115-day number for a large site means per-host crawl budgets and recrawl priorities, not more machines. For 10× scale, multiply fetchers; the shape does not change.</p>

<h3>Drill 9: Gaming leaderboard</h3>
<p><strong>Assume:</strong> 200M players ranked, 50M DAU, 10 score updates and 20 rank reads per DAU per day, ~100 B per sorted-set member in memory.</p>
<pre><code class="language-text">Updates:  5 × 10⁷ × 10 = 5 × 10⁸/day ÷ 10⁵ ≈ 5K/s avg → ~15-20K/s peak
Reads:    5 × 10⁷ × 20 = 10⁹/day ÷ 10⁵ ≈ 10K/s avg → ~30-35K/s peak
Total:    ~50K ops/s at peak on the ranking structure
Memory:   2 × 10⁸ members × 100 B = 20 GB (one sorted set fits one node)
Rebuild:  2 × 10⁸ inserts ÷ 10⁵ ops/s = 2,000 s ≈ 33 min</code></pre>
<p><strong>Decision:</strong> 20 GB and ~50K ops/s technically fit <strong>one Redis sorted set</strong>, which is the honest starting answer. But it is half of one node's ceiling and a single point of failure, and a cold rebuild takes ~30 minutes. So: durable scores in a database as the source of truth, Redis as a rebuildable index with a replica for failover and to offload reads, separate keys per period (daily/weekly) with TTLs. If it grows 10×, partition by score range or keep exact top-K plus approximate ranks for everyone else.</p>

<h3>Drill 10: Dropbox file sync</h3>
<p><strong>Assume:</strong> 500M registered users, 50M DAU, ~2 GB stored per user on average, ~1,000 files per user, each DAU changes 10 files/day of ~1 MB, block-level delta sync uploads ~10% of the changed bytes, ~500 B of metadata per file, 40% of DAU connected at peak.</p>
<pre><code class="language-text">Logical data: 5 × 10⁸ × 2 GB = 10⁹ GB = 1 EB
Physical:     dedup (~0.75×) × erasure coding (~1.5×) ≈ 1.1× → ~1 EB of disk
Changes:      5 × 10⁷ × 10 = 5 × 10⁸ file changes/day ÷ 10⁵ ≈ 5K/s avg → ~15K/s peak
Upload bytes: 5 × 10⁸ × 1 MB = 500 TB/day changed → delta sync ≈ 50 TB/day ≈ 0.5 GB/s
Growth:       50 TB/day × 365 ≈ 18 PB/yr (with version history)
Metadata:     5 × 10⁸ users × 1,000 files × 500 B = 2.5 × 10¹⁴ B = 250 TB
Watchers:     5 × 10⁷ × 40% = 20M long-poll/WebSocket clients → ~200 gateway boxes</code></pre>
<p><strong>Decision:</strong> split the system in two. File bytes go to a content-addressed <strong>block store</strong> (blocks keyed by hash, which gives dedup for free), sized in exabytes. Metadata (250 TB) is far beyond one database and must be <strong>sharded by user/namespace</strong> so one user's tree lives on one shard. Delta sync cuts upload bandwidth by ~10×, which is why chunking is the core of the client design. 20M watchers need a notification tier sized by connections.</p>

<h3>Drill 11: Search autocomplete</h3>
<p><strong>Assume:</strong> 5B searches/day, ~4 suggestion requests per search after debouncing, ~100M popular queries in the suggestion set averaging ~20 B, precomputed top-10 per prefix inflates that ~10-20×, total latency budget ~100 ms.</p>
<pre><code class="language-text">Requests:  5 × 10⁹ × 4 = 2 × 10¹⁰/day ÷ 10⁵ = 200K/s avg → ~500-600K/s peak
Raw data:  10⁸ queries × 20 B = 2 GB
Index:     trie + top-10 per node ≈ 2 GB × 10-20 ≈ 20-40 GB → fits in RAM on one box
Servers:   600K/s ÷ ~50K/s per in-memory server ≈ 12 → × regions × headroom ≈ tens
Log feed:  2 × 10¹⁰ keystroke events/day → stream to an offline pipeline</code></pre>
<p><strong>Decision:</strong> the whole index fits in one machine's memory, so <strong>replicate it, don't shard it</strong>: every server holds a full copy and any server can answer. The 100 ms budget rules out a database on the path and favours serving near the user. Short prefixes ("a", "ip") are the hottest and change slowly, so cache them at the CDN or in the client. Rebuild the trie offline (hourly/daily) from the logs and swap it in, instead of updating it live at 200K events/s.</p>

<h3>Drill 12: Distributed counter (views and likes)</h3>
<p><strong>Assume:</strong> 5B video views/day, 1B likes/day, a viral item can take 1% of all views, a single hot row sustains at most ~1K updates/s under lock contention (rough), ~50 B per (user, item) like record with index.</p>
<pre><code class="language-text">Views:      5 × 10⁹ ÷ 10⁵ = 50K/s avg → ~150K/s peak
Hot item:   1% of peak = 1.5K/s on ONE key (live events: 10K+/s)
Likes:      10⁹ ÷ 10⁵ = 10K/s avg
Like store: 10⁹ × 50 B = 50 GB/day → ~18 TB/yr (who-liked-what, for dedupe + unlike)
Buffered:   aggregate per item per 5 s → a hot item writes 1 row/5 s instead of 7,500</code></pre>
<p><strong>Decision:</strong> the totals shard fine by item id, but a <strong>hot key</strong> lands on one shard and one row, beyond what a single row can take. So views are counted approximately: buffer in memory or Kafka, aggregate per window, flush periodically (sharded counters for the hottest keys). Likes need exactness per user (no double-likes, unlike works), so the (user, item) set is the source of truth and the displayed count is a cached, eventually consistent total.</p>

<h3>Drill 13: Ticket booking flash sale</h3>
<p><strong>Assume:</strong> a concert with 100K seats, ~2 tickets per order, sells out in ~10 minutes, 5M fans arrive in the first minute and ~20% of them keep refreshing once a second, normal daily volume ~1M bookings/day.</p>
<pre><code class="language-text">Normal day:   10⁶ ÷ 10⁵ ≈ 10 bookings/s (tiny)
Orders:       10⁵ seats ÷ 2 = 5 × 10⁴ orders in 600 s ≈ 85 orders/s
Arrivals:     5 × 10⁶ users in 60 s ≈ 85K new sessions/s
Refreshing:   ~20% actively refreshing once a second → 10⁶ req/s
Peak ÷ avg:   ~10⁶ ÷ 10 = 100,000×
Contention:   the best ~5,000 seats get most of the first-minute attempts</code></pre>
<p><strong>Decision:</strong> the write rate (~85 orders/s) is trivial; the problem is a <strong>100,000× spike</strong> concentrated on a few thousand rows. So: a virtual waiting room that admits users at the rate the booking path can sustain, a seat map served from cache/CDN with a short TTL, seat holds with an expiry (a few minutes) and conditional updates or row locks on one event's partition, and idempotent order creation. Sizing for the "average" 10/s would be wrong by five orders of magnitude.</p>

<h3>Drill 14: Meeting-room booking platform (the small-scale check)</h3>
<p><strong>Assume:</strong> a company with 50K employees, 5K rooms each with a tablet, 2 bookings and 20 schedule views per employee per working day, traffic inside an 8-hour day (~3 × 10⁴ s), ~1 KB per booking row, room tablets polling every 30 s.</p>
<pre><code class="language-text">Bookings: 5 × 10⁴ × 2 = 10⁵/day ÷ 3 × 10⁴ s ≈ 3/s avg → ~10-20/s at the 9-10 am peak
Views:    5 × 10⁴ × 20 = 10⁶/day ÷ 3 × 10⁴ s ≈ 35/s avg → ~100/s peak
Tablets:  5 × 10³ ÷ 30 s ≈ 170 req/s, all day (the biggest load in the system)
Storage:  10⁵ × 1 KB = 100 MB/day → ~25 GB/yr (250 working days)</code></pre>
<p><strong>Decision:</strong> every number is small, so the answer is <strong>one Postgres with a hot standby and a small stateless app tier</strong>. No sharding, no Kafka, no cache cluster. Double-booking is prevented in the database with an exclusion constraint on (room, time range), not with distributed locks (see <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>). The one thing the estimate surfaces is that the tablets, not people, are the main traffic: move them from 30 s polling to server push, or use conditional requests (ETag) so most polls are cheap 304s. Knowing when <em>not</em> to scale is half the skill.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Traffic that is not spread over 24 hours</h3>
<p>B2B, office and school apps put almost all traffic into ~8 hours, and often into one peak hour (9-10 am logins, end-of-month reports). Dividing by 10⁵ understates the average by ~3× and the peak by more. Use ~3 × 10⁴ s for working-day traffic, then apply a peak factor.</p>

<h3>Events break the 2-3× peak rule</h3>
<p>Flash sales, ticket drops, match finals, New Year messages, push-notification click-throughs, and the retry storm after an outage all produce 10× to 1,000× spikes. If the prompt has an event, estimate the event explicitly (Drill 13) and design for it: queues, waiting rooms, pre-scaling.</p>

<h3>Skew and hot keys</h3>
<p>Average per-shard load is meaningless when one key gets 1% of everything. A celebrity, a viral video or a popular event lives on one shard however many shards you add. Estimate the hottest key separately (Drill 12) and compare it with what a single row or node can take.</p>

<h3>Read amplification and fan-out multipliers</h3>
<p>One timeline read is 20 tweet reads plus 20 author lookups. One tweet is 200 timeline inserts. One notification campaign is 150M sends. The request count the user sees and the operation count your storage sees can differ by 10-1,000×. Always ask "what does one request turn into?"</p>

<h3>Global users and time zones</h3>
<p>A global product smooths daily peaks (peak ≈ 2× average), while a single-country product concentrates them (peak ≈ 3× or more). A single-country product also puts every user far from a far-away region, which turns latency into the binding constraint.</p>

<h3>Retention, versions and deletes</h3>
<p>"Storage per year" assumes data is kept. Versions (Dropbox), edit history, soft-deletes, audit logs (payments: 7-10 years), backups and point-in-time recovery all multiply it. Conversely, store-and-forward (WhatsApp) or a TTL can shrink it by orders of magnitude (1,000×+). Ask about retention before multiplying by 365.</p>

<h3>Small systems</h3>
<p>Sometimes every number comes out tiny (Drill 14). That is a valid and valuable result: say "this fits on one Postgres with a standby" and spend the interview on correctness, not scale.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Unit slips</h3>
<ul>
  <li><strong>Bits vs bytes:</strong> network speeds are in bits (Gbps), storage in bytes (GB). 10 Gbps is 1.25 GB/s, not 10 GB/s. Off by 8×.</li>
  <li><strong>Per day vs per second:</strong> forgetting to divide by 10⁵, or dividing twice. Sanity check with "1B/day ≈ 12K/s".</li>
  <li><strong>Counting zeros:</strong> write 5 × 10⁸ × 10³ = 5 × 10¹¹, not "500000000 × 1000".</li>
  <li><strong>MB vs MiB:</strong> irrelevant in an interview. Saying "it's actually 1,024" signals you are optimising the wrong thing.</li>
</ul>

<h3>Ignoring peak</h3>
<p>Sizing for the average means the system falls over every evening. Capacity is sized for peak plus headroom (~30-50%) plus the loss of one node or zone. Cost is estimated on the average.</p>

<h3>Ignoring replication and index overhead</h3>
<p>Raw rows × count is not disk usage. Multiply by ~2 for indexes and row overhead and by 3 for replicas, so 100 TB of raw rows is ~600 TB of disk. For object storage, erasure coding is ~1.5× instead of 3×.</p>

<h3>False precision</h3>
<p>"11,574 QPS" or "2.73 PB" implies accuracy the assumptions do not have. One significant figure is honest and faster: "about 12K", "a few PB". Interviewers read false precision as not understanding what estimation is for.</p>

<h3>Numbers without decisions</h3>
<p>Computing storage, bandwidth and QPS and then drawing the same diagram you would have drawn anyway. Every number should end in "so…". If a number changes nothing, skip it and say why: "bandwidth here is tiny, so I'll skip it."</p>

<h3>Mixing metadata and blobs</h3>
<p>Putting photo or video bytes into the same estimate (and the same database) as row metadata. Blobs dominate bytes by 100-1,000×, rows dominate request counts. Estimate them separately; they end in different stores.</p>

<h3>Stating ballparks as facts</h3>
<p>"Postgres does 50K writes/s" stated as fact invites "on what hardware, with which schema?". Say "I plan ~5K simple writes per second per primary, with a ceiling around 20K on a decent box; I'd benchmark our actual query shape". Ranges plus caveats are the senior answer.</p>

<h3>Spending 15 minutes on arithmetic</h3>
<p>Estimation is 3-5 minutes. Pick the 3-4 numbers that drive decisions for this system (Drill 4: keyspace and cache; Drill 6: write rate vs live-state size) and move on.</p>

<h3>Forgetting concurrency</h3>
<p>QPS alone hides slow dependencies. 10K req/s with a 1 s external call means 10,000 requests in flight (Little's law): thread pools, DB connections and memory are sized by that, not by QPS.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "self-test", title: "🎯 Self-Test Drills", collapsible: true, html: `
<p>Answer out loud before you open each one. Aim for the right order of magnitude in under 30 seconds each, then say the decision.</p>

<details class="qa-block qa-reveal"><summary class="qa-question">1. 50M DAU, each makes 20 requests/day. Average and peak QPS?</summary><div class="qa-answer">
<p>5 × 10⁷ × 20 = 10⁹ requests/day. ÷ 10⁵ s ≈ <strong>10K/s average</strong> (precisely ~12K). Peak × 3 ≈ <strong>30-35K/s</strong>.</p>
<p><em>Decision:</em> stateless app tier of a few dozen boxes at ~1K-5K req/s each; check whether the DB share of that needs a cache or replicas.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">2. Seconds in a day, a month, a year? And 1M requests/day in QPS?</summary><div class="qa-answer">
<p>Day 86,400 ≈ <strong>10⁵</strong>. Month ≈ <strong>2.5 × 10⁶</strong>. Year ≈ <strong>3 × 10⁷</strong>. 1M/day ≈ <strong>12/s</strong>, so 1B/day ≈ 12K/s.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">3. Put these in order with rough values: SSD random read, RAM reference, same-DC round trip, cross-continent round trip, HDD seek.</summary><div class="qa-answer">
<p>RAM <strong>~100 ns</strong> → SSD <strong>~100 µs</strong> (NVMe often ~20-100 µs) → same-DC RTT <strong>~0.5 ms</strong> → HDD seek <strong>~5-10 ms</strong> → cross-continent <strong>~100-200 ms</strong>.</p>
<p><em>Decision cue:</em> the big jumps are memory → storage (~1,000×) and in-DC → WAN (~300×); SSD and a same-DC hop are the same order of magnitude. A design that adds one cross-continent hop per request has spent its latency budget.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">4. Downtime per year at 99.9% and at 99.99%? What does going from one to the other require?</summary><div class="qa-answer">
<p>99.9% ≈ <strong>8.8 h/year</strong> (~44 min/month). 99.99% ≈ <strong>53 min/year</strong> (~4 min/month).</p>
<p><em>Decision:</em> four nines leaves no time for a human to respond, so failover must be automatic, deploys must be canaried with automatic rollback, and hard dependencies must be minimised.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">5. Three services in series at 99.9% each. Two independent replicas at 99% each. What is the availability of each setup?</summary><div class="qa-answer">
<p>Serial: 0.999³ ≈ <strong>99.7%</strong> (multiply). Parallel: 1 − 0.01² = <strong>99.99%</strong> (1 − product of failure probabilities).</p>
<p><em>Caveat:</em> the parallel math assumes independent failures; a shared region or shared bad deploy breaks it.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">6. A service serves 2K images/s at 500 KB each. Can one 10 Gbps box serve it?</summary><div class="qa-answer">
<p>2 × 10³ × 5 × 10⁵ B = 10⁹ B/s = <strong>1 GB/s ≈ 8 Gbps</strong>. 10 Gbps ≈ 1.25 GB/s line rate, so one box would run at ~80% of its NIC at average load and fall over at peak.</p>
<p><em>Decision:</em> put a CDN in front; the origin then serves only cache misses.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">7. 500M posts/day at 1 KB each. Storage per year with replication?</summary><div class="qa-answer">
<p>5 × 10⁸ × 10³ B = 5 × 10¹¹ B = <strong>500 GB/day</strong>. × 365 ≈ <strong>180 TB/yr</strong>. × 3 replicas ≈ <strong>~550 TB/yr</strong> (× 2 more for indexes if you want disk usage).</p>
<p><em>Decision:</em> beyond any single DB node within weeks, so partition (by post id or user id) and tier old posts to cheaper storage.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">8. You need 1M cache ops/s. How many Redis instances?</summary><div class="qa-answer">
<p>~100K ops/s per instance → <strong>10 minimum</strong>; with ~50% headroom and replicas, <strong>~15-20 primaries</strong> (plus a replica each) in a Redis Cluster.</p>
<p><em>Caveat:</em> pipelining, value size and command mix move this a lot; a single hot key still caps at one instance.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">9. What are the S3 per-prefix request limits, and what do you do if uploads exceed them?</summary><div class="qa-answer">
<p>Roughly <strong>3,500 writes/s</strong> (PUT/COPY/POST/DELETE) and <strong>5,500 reads/s</strong> (GET/HEAD) per prefix, per AWS guidance.</p>
<p><em>Decision:</em> spread keys across many prefixes (e.g. a short hash at the start of the key) so throughput scales with prefix count; avoid date-only prefixes that put all of today's writes on one prefix.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">10. RAM needed to cache the hot 20% of 1B objects of 1 KB each?</summary><div class="qa-answer">
<p>10⁹ × 20% = 2 × 10⁸ objects × 10³ B = <strong>200 GB</strong>. At ~50-100 GB usable per node → <strong>~3-4 cache nodes</strong> (plus replicas).</p>
<p><em>Decision:</em> a small cache cluster, not a single node; consider whether 1 KB values could be trimmed to what the read path actually needs.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">11. A service takes 2K req/s, each spending 50 ms waiting on the DB. How many DB connections are busy?</summary><div class="qa-answer">
<p>Little's law: 2,000 × 0.05 s = <strong>100 in flight</strong>. Size the pool above that with headroom (~150), split across app instances.</p>
<p><em>Decision cue:</em> if DB latency degrades to 500 ms, the same traffic needs 1,000 connections, which is how slow queries turn into connection-pool exhaustion. Use a pooler (PgBouncer) and timeouts.</p>
</div></details>

<details class="qa-block qa-reveal"><summary class="qa-question">12. 1M devices send a 200 B reading every 10 s. Write rate, daily storage, and the storage decision?</summary><div class="qa-answer">
<p>10⁶ ÷ 10 = <strong>100K writes/s</strong>. 10⁵/s × 200 B = 20 MB/s. × 10⁵ s ≈ <strong>2 TB/day</strong> → ~700 TB/yr before replication.</p>
<p><em>Decision:</em> 100K writes/s is beyond a single relational primary: ingest through a stream (Kafka / MQTT broker), write in batches to a time-series or LSM store, downsample old data, and set retention.</p>
</div></details>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block"><div class="qa-question">"Your number is off by 10×. Does the design change?"</div><div class="qa-answer">
<p>Model answer: "Let me check which threshold it crosses. At 15K writes/s I sharded the tweet store; at 1.5K/s one primary with a replica handles it, so I'd drop sharding and keep a queue for the fan-out. At 150K/s, sharding stays and the fan-out workers and timeline cache grow ~10×, but the shape is the same. So 10× down simplifies the write path; 10× up changes sizes, not boxes." The skill being tested is knowing where your design's thresholds are, not defending the number.</p>
</div></div>

<div class="qa-block"><div class="qa-question">"Why did you use 10⁵ instead of 86,400?"</div><div class="qa-answer">
<p>"Speed, and it is safe enough. 10⁵ is 16% more seconds than a real day, so it understates my average QPS by ~14%, and the × 3 peak factor more than covers that. The aim is the right order of magnitude in seconds, not a precise figure, because the inputs (DAU, actions per user) are guesses anyway."</p>
</div></div>

<div class="qa-block"><div class="qa-question">"Where does '100K ops/s per Redis' come from? Is that real?"</div><div class="qa-answer">
<p>"It's the commonly quoted ballpark for simple GET/SET on one instance, which is mostly single-threaded per command. Pipelining can push it toward a million; large values or O(N) commands drop it a lot. I use it to get the shard count's order of magnitude. Before committing to a number in production I'd benchmark our actual command mix and value sizes."</p>
</div></div>

<div class="qa-block"><div class="qa-question">"The interviewer gives you no numbers. What do you do?"</div><div class="qa-answer">
<p>"I propose a scale and ask them to confirm: 'Let's say 100M users and 10M DAU, a mid-size consumer app. Does that sound right, or are we thinking bigger?' Then I note which assumption the design is most sensitive to, usually DAU × write actions, so we can revisit it if it changes."</p>
</div></div>

<div class="qa-block"><div class="qa-question">"Do you really need to shard here?"</div><div class="qa-answer">
<p>"Only if the numbers say so. Writes at peak are X/s; I plan ~5K simple writes/s per primary, with a ceiling around 20K; storage is Y TB against a practical single-node ceiling of ~10 TB. If both are well under, I'd start with one primary plus replicas, choose a partition key now so sharding later is a migration rather than a redesign, and set the alarm thresholds that would trigger it." (See <a href="#/topic/be-databases">Databases</a> for the sharding mechanics.)</p>
</div></div>

<div class="qa-block"><div class="qa-question">"How did you get peak = 3× average? Why not 10×?"</div><div class="qa-answer">
<p>"For a normal daily curve, the busiest hour is usually 2-3× the daily average, more for single-country products, less for global ones. For event-driven traffic (sales, live sports, notification blasts) I size the event separately, because those are 10× to 1,000×. Here the prompt has no event, so 3×; if you tell me there's a flash sale, I'll add a waiting room and a queue."</p>
</div></div>

<div class="qa-block"><div class="qa-question">"Estimate how many app servers you need."</div><div class="qa-answer">
<p>"Peak 60K req/s. A handler that does a cache and a DB call is ~1-5K req/s per box; take ~2K to be safe → 30 boxes. Add ~50% headroom and enough to lose one zone of three → about 50-60 boxes. If each request waits 100 ms on downstream calls, Little's law says 6,000 requests in flight in total, ~100-120 per box, which tells me the connection pool and thread sizing too."</p>
</div></div>

<div class="qa-block"><div class="qa-question">"Your storage estimate: did you account for replication and indexes?"</div><div class="qa-answer">
<p>"Raw is 180 TB/yr. Indexes and row overhead are roughly × 2, replication × 3, so disk is ~1 PB/yr. Backups and point-in-time recovery add more, but those go to object storage, which is cheaper per byte. Blobs are estimated separately and sit in object storage with erasure coding at ~1.5× rather than 3×."</p>
</div></div>

<div class="qa-block"><div class="qa-question">"How does latency estimation factor into your design?"</div><div class="qa-answer">
<p>"I build a budget. Say p99 is 200 ms for users in India. A round trip to US East is ~200 ms on its own, so serving from a US region fails before any work happens: we need an India region. Inside the region: ~1 ms per internal hop × 5 hops, ~1-5 ms for a cached read, ~5-20 ms for an indexed DB query, which leaves room. The budget tells me which calls must be parallel, which must be cached, and where the region boundary is."</p>
</div></div>

<div class="qa-block"><div class="qa-question">"How long should estimation take, and what do you skip?"</div><div class="qa-answer">
<p>"Three to five minutes. I compute only the numbers that can change a decision for this system. For a URL shortener: write QPS, read QPS, 5-year storage and keyspace. Bandwidth is tiny, so I say that and skip it. For video, bandwidth and transcode compute are the whole story and QPS barely matters."</p>
</div></div>
` }

  ]
});
