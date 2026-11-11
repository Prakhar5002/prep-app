window.PREP_SITE.registerTopic({
  id: "bsd-bb-partitioning",
  module: 'backend-sd',
  title: "Partitioning & Consistent Hashing",
  estimatedReadTime: "50 min",
  tags: ["system-design","partitioning","sharding","consistent-hashing","virtual-nodes","hot-keys","secondary-indexes","resharding","interview"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>Partitioning splits data so each node owns a slice: pick the key by your hottest access pattern, map keys to slices with hash (even load), range (ordered scans) or a directory (full control), keep the slice count independent of the node count so you can move slices instead of rehashing keys, and plan for the one key that is hotter than any node.</strong></div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Why:</strong> data or write load that does not fit one machine. Replication scales reads and survives failures; only partitioning scales <em>writes</em> and <em>storage</em>. Plan ~5K simple writes/s per Postgres primary (ceiling ~20K), see <a href="#/topic/bsd-estimation">Estimation</a>.</li>
    <li><strong>hash(key) mod N</strong> is even but brittle: going from N to N+1 nodes moves ~N/(N+1) of all keys (4 → 5 nodes moves ~80%).</li>
    <li><strong>Consistent hashing</strong> puts nodes and keys on a ring; a key belongs to the next node clockwise. Adding a node moves only ~1/N of keys, all from its neighbour(s).</li>
    <li><strong>Virtual nodes</strong> (many tokens per physical node) fix uneven arcs, spread a joining or leaving node's load across all peers, and let bigger machines take more tokens. Cost: more metadata, and repair/streaming touches more peers.</li>
    <li><strong>Fixed logical partitions</strong> (Redis Cluster 16,384 slots, Couchbase 1,024 vBuckets, Kafka partitions, Instagram/Notion logical shards) are the practical form: create many more partitions than nodes, then rebalance by <em>moving whole partitions</em>.</li>
    <li><strong>Range partitioning</strong> (HBase, Bigtable, Spanner, CockroachDB, TiKV) keeps keys sorted for range scans and splits hot or large ranges automatically, but monotonic keys (timestamps, auto-increment) all land on the last range.</li>
    <li><strong>Hot keys:</strong> no partitioning scheme spreads one key. Reads: cache, replicate the key, L1 in-process. Writes: salt the key into k sub-keys and merge on read, or buffer and batch. Celebrities get a separate code path.</li>
    <li><strong>Secondary indexes:</strong> <em>local</em> (per partition: cheap writes, scatter-gather reads) vs <em>global</em> (partitioned by the indexed term: one-partition reads, cross-partition writes that are usually async, so the index lags).</li>
    <li><strong>Resharding without downtime:</strong> copy (snapshot + change stream), verify, flip reads, flip writes, keep a reverse stream for rollback. Logical shards turn it into "move a few logical shards", not "rehash everything".</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Saying "we'll use consistent hashing" as if it solves load. It solves <em>key movement on membership change</em>. It does nothing for a hot key, nothing for cross-shard queries, and with one token per node it is often <em>less</em> balanced than mod N. The real design questions are the shard key, the hot key, and how you query by anything that is not the shard key.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I'll shard by tenant_id because every hot query is scoped to one tenant, so they stay single-shard. I'll pre-create ~1,000 logical shards on 8 physical databases so growth is moving shards, not rehashing rows."</div>
  <div class="revision-say">"Hashing spreads keys, not load. The largest tenant is ~3% of traffic, below one shard's capacity today; if it outgrows that, it gets its own shard through the directory."</div>
  <div class="revision-say">"Lookups by email aren't on the shard key, so I keep a global email → user_id index. Signup synchronously <em>claims</em> the email with a conditional insert into a unique email table on that email's shard; the rest of the index can lag."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The problem in one picture</h3>
<p>One database box has a ceiling on disk, on memory for the working set, and above all on write throughput. Read replicas (see <a href="#/topic/bsd-bb-replication">Replication &amp; Quorums</a>) multiply read capacity, but every replica still applies every write and stores every byte. When writes or data outgrow one machine, the only way out is to give each machine a <em>different</em> slice of the data. That is partitioning; "sharding" is the same thing when the slices live on separate database servers.</p>
<p>The vocabulary varies by system and interviewers expect you to recognise all of it: a <strong>shard</strong> (MongoDB, Elasticsearch, Vitess), a <strong>region</strong> (HBase, TiKV), a <strong>tablet</strong> (Bigtable), a <strong>range</strong> (CockroachDB), a <strong>vnode</strong> or token range (Cassandra, Riak), a <strong>partition</strong> (DynamoDB, Kafka), a <strong>vBucket</strong> (Couchbase), a <strong>hash slot</strong> (Redis Cluster).</p>

<h3>The three decisions</h3>
<ol>
  <li><strong>The partition key.</strong> Which attribute decides where a row lives. This is the decision that is expensive to change, because every query that includes the key goes to one partition and every query that does not goes to all of them.</li>
  <li><strong>The mapping.</strong> How a key becomes a partition: hash, range, or an explicit directory. This decides balance, range-scan ability and how painful growth is.</li>
  <li><strong>The placement and routing.</strong> Which node holds which partition, how that changes when nodes join or fail, and how a client finds the right node.</li>
</ol>

<h3>Goals, in tension</h3>
<table>
  <thead><tr><th>Goal</th><th>What helps</th><th>What it costs</th></tr></thead>
  <tbody>
    <tr><td>Even data and load</td><td>Hashing a high-cardinality key</td><td>Range scans become scatter-gather; locality lost</td></tr>
    <tr><td>Single-partition queries</td><td>Key = the scope of your hottest query (tenant, user, conversation)</td><td>Skew if one scope is huge</td></tr>
    <tr><td>Cheap growth</td><td>Many small logical partitions, consistent hashing</td><td>Metadata, routing layer, more moving parts</td></tr>
    <tr><td>Ordered scans</td><td>Range partitioning on a sortable key</td><td>Hot spots on monotonic keys, split management</td></tr>
    <tr><td>Flexible placement</td><td>Directory / lookup table</td><td>The directory becomes a critical, highly available dependency</td></tr>
  </tbody>
</table>

<h3>When <em>not</em> to partition</h3>
<p>Partitioning is the most expensive scaling step: you lose cross-row joins and transactions across partitions, every query must carry the key, and operations get harder. Exhaust the cheaper levers first: indexes, caching (<a href="#/topic/be-caching">Caching</a>), read replicas, a bigger box, archiving cold data, batching writes through a queue (<a href="#/topic/be-queues">Queues</a>). A modern Postgres on a large instance holds terabytes and thousands of writes per second. The order is in <a href="#/topic/be-databases">Databases</a>: indexes → caching → replicas → partitioning → sharding.</p>
<div class="callout insight"><div class="callout-title">What a deep interviewer is really testing</div>
<p>Anyone can say "shard it". The follow-ups are always: shard by what, what happens to queries not on that key, what happens when one key is hotter than a whole shard, and how you add capacity next year without an outage. This topic is built around those four questions.</p></div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Three ways to map a key to a partition</h3>
<div class="diagram"><pre>
 HASH:      key ──► hash(key) ──► partition = f(hash)
            "user:42" → 0x9f3a… → P7      even spread, no ordering

 RANGE:     key ──► find the range that contains it
            [a..f) P1  [f..m) P2  [m..s) P3  [s..z] P4
            "kumar" → P2                  ordered scans, hot ends

 DIRECTORY: key ──► lookup table ──► partition
            tenant_17 → shard 3, tenant_9 → shard 11 (dedicated)
                                          full control, extra hop
</pre></div>

<h3>Hash partitioning</h3>
<p>Hash the key with a well-mixed hash (MurmurHash, xxHash, MD5: the cryptographic strength does not matter, the uniformity does) and map the hash to a partition. Similar keys land far apart, so load spreads evenly as long as no single key dominates. You lose order: "all orders between Monday and Friday" must ask every partition. Cassandra's trick is a compound key: hash the <em>partition key</em> (say <code>user_id</code>) to find the node, then keep rows sorted by a <em>clustering key</em> (say <code>created_at</code>) inside it, so "this user's latest 50 orders" is one ordered read on one node.</p>

<h3>Range partitioning</h3>
<p>Keep keys sorted and give each partition a contiguous range. Range scans are cheap, and the system can split a range that gets too big or too hot and move half of it. This is how Bigtable, HBase, Spanner, CockroachDB and TiKV work, and it is why they cope with any key distribution. The catch is a monotonic key: if the key is a timestamp or an auto-increment id, every new write goes to the last range, and one node takes 100% of the write load while the rest idle. Fixes: prefix the key with something that spreads (a hash bucket, a device id), or use a key that is not time-ordered at the front.</p>

<h3>Directory (lookup) partitioning</h3>
<p>Keep an explicit map from key (or key group) to partition. It is the most flexible: move one tenant, give a whale tenant a dedicated shard, place EU tenants in an EU region, all without touching anyone else. Costs: an extra lookup (cache it hard), and the directory itself must be highly available and consistent, typically stored in a small replicated store (etcd/ZooKeeper, a config database) and cached in every router. Vitess "lookup vindexes" and per-tenant shard maps in multi-tenant SaaS are this pattern. In practice it is usually layered on top of hashing: hash to one of ~1,000 logical shards, then a small directory maps logical shards to physical databases.</p>

<h3>The two-level model (memorise this)</h3>
<div class="diagram"><pre>
   key ─hash─► logical shard (fixed: e.g. 1,024 of them, never changes)
                    │
                    │  small directory, changes on rebalance
                    ▼
              physical node (8 today, 32 next year)

   Growth = move some logical shards to new nodes.
   No key ever changes its logical shard, so nothing is rehashed.
</pre></div>
<p>Redis Cluster (16,384 hash slots), Couchbase (1,024 vBuckets), Riak (a fixed ring size), Elasticsearch (primary shard count fixed at index creation) and Kafka (fixed partitions per topic) all use this shape. Kafka also shows what happens when you break the rule: the default partitioner is murmur2(key) mod numPartitions, so adding partitions to a topic remaps keys and breaks per-key ordering, which is the mod-N lesson in a system you already know. Instagram and Notion described the same idea for Postgres in their engineering blogs: thousands or hundreds of logical shards mapped onto a few dozen physical databases. Pick the logical count once, generously (10-100× the nodes you expect), because changing <em>that</em> is a full reshard.</p>

<h3>Placement and routing</h3>
<p>Three ways a request finds its partition:</p>
<ul>
  <li><strong>Smart client:</strong> the client library holds the partition map and talks to the right node directly (Cassandra token-aware drivers, Redis Cluster clients, Kafka producers). Lowest latency; every client must refresh the map.</li>
  <li><strong>Routing tier:</strong> a proxy holds the map (MongoDB mongos, Vitess vtgate, Twemproxy/Envoy for caches). Clients stay simple; one more hop.</li>
  <li><strong>Any node forwards:</strong> contact any node, it forwards or redirects (Cassandra coordinators, Redis Cluster MOVED/ASK replies).</li>
</ul>
<p>The map itself lives somewhere authoritative: gossip among nodes (Cassandra, Dynamo-style), a consensus store (ZooKeeper, etcd: see <a href="#/topic/bsd-bb-consensus">Consensus &amp; Coordination</a>), or a metadata service (MongoDB config servers, HBase meta table, Spanner placement driver). A stale map is normal and expected; correctness comes from the owning node rejecting requests for partitions it no longer owns and telling the client where to go.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>Why hash mod N breaks</h3>
<p>With <code>partition = hash(key) mod N</code>, a key stays put on growth only if <code>hash mod N == hash mod (N+1)</code>. That is true for about 1/(N+1) of keys. Going from 4 to 5 nodes moves ~80% of all data; from 10 to 11 moves ~91%. For a cache that is a near-total miss storm on the database; for a database it is moving almost every row while serving traffic. Mod N is fine when N never changes (a fixed number of logical shards), which is exactly why the two-level model uses it for key → logical shard.</p>

<h3>Consistent hashing</h3>
<p>Introduced by Karger et al. (1997) for web caching at what became Akamai, popularised for storage by Amazon's Dynamo paper (2007). Hash both keys and nodes onto the same circular space (say 0 to 2⁶⁴ − 1). A key belongs to the first node at or after its position, walking clockwise.</p>
<div class="diagram"><pre>
                      0 / 2^64
                         │
              N3 ●───────┼───────● N1
               ╱    k9   │          ╲      k1 → N1 (next clockwise)
              │          │     k1    │     k4 → N2
       k7 ●   │          │           │     k7 → N3
              │                      │     k9 → N1 (wraps past 0)
               ╲         k4         ╱
                 ●─────────────────
                 N2

 Add N4 between N2 and N3: only keys in (N2, N4] move, N3 → N4.
 Every other key stays where it was. Moved ≈ 1/(N+1) of keys.
</pre></div>
<p>Lookup: keep node positions in a sorted array and binary-search the key's hash: O(log V) for V positions. Replication follows the ring: the next R <em>distinct physical</em> nodes clockwise hold the replicas (Dynamo calls this the preference list), skipping extra tokens of a node already chosen and, ideally, nodes in the same rack or zone.</p>

<h3>Virtual nodes: why plain consistent hashing is not enough</h3>
<p>With one position per node, the arcs are random lengths. The biggest arc is typically several times the average (roughly a ln N factor), so one node can own 2-3× its fair share. Worse, when a node dies its whole arc falls on <em>one</em> neighbour, which can cascade. The fix: give each physical node many positions (tokens, vnodes).</p>
<ul>
  <li><strong>Balance:</strong> with ~100+ tokens per node, each node's share is the sum of many small arcs, which averages out: typical deviation ~10% from fair, the worst node somewhat more.</li>
  <li><strong>Spread recovery:</strong> a leaving node's arcs go to many different peers, so the extra load and the streaming work are shared.</li>
  <li><strong>Heterogeneous hardware:</strong> a box with twice the disk gets twice the tokens.</li>
  <li><strong>Cost:</strong> more ring metadata, and repair and bootstrap involve more peers. Cassandra historically defaulted to 256 tokens per node; Cassandra 4.0 changed the default to 16 with a token-allocation algorithm that places tokens deliberately rather than randomly. Two reasons: 256 made repairs heavier, and it hurt availability. With 256 random vnodes, every node shares ranges with almost every other node, so at RF=3 losing <em>any</em> two nodes loses quorum for some ranges. That evolution is a good thing to know: "more vnodes" is not free.</li>
</ul>

<h3>Other hashing schemes interviewers may name</h3>
<table>
  <thead><tr><th>Scheme</th><th>How it works</th><th>Strength</th><th>Weakness</th><th>Seen in</th></tr></thead>
  <tbody>
    <tr><td>mod N</td><td>hash % N</td><td>Trivial, perfectly even for many keys</td><td>~all keys move when N changes</td><td>Key → fixed logical shard</td></tr>
    <tr><td>Ring + vnodes</td><td>Next token clockwise</td><td>~1/N keys move; arbitrary add/remove</td><td>Needs many tokens for balance; metadata</td><td>Dynamo, Cassandra, Riak, memcached clients (ketama), Discord's service routing</td></tr>
    <tr><td>Fixed slots</td><td>hash % S, slot → node table</td><td>Explicit, movable units; easy to reason about</td><td>Slot count fixed up front</td><td>Redis Cluster (CRC16 % 16,384), Couchbase, Kafka, Elasticsearch</td></tr>
    <tr><td>Rendezvous (HRW)</td><td>Score every node with hash(key, node); pick the max</td><td>No ring; minimal movement; top-k gives replicas for free</td><td>O(N) per lookup (fine for tens of nodes)</td><td>Some caches and load balancers</td></tr>
    <tr><td>Jump hash</td><td>Arithmetic jump over bucket numbers (Google, 2014)</td><td>No memory, very fast, near-perfect balance</td><td>Buckets are 0..n−1: you can only add or remove the last one</td><td>Storage shards that only grow</td></tr>
    <tr><td>Maglev</td><td>Builds a fixed lookup table from node preferences</td><td>O(1) lookup, even, minimal disruption</td><td>Table rebuild on change; some extra movement</td><td>Google's L4 LB; Envoy's maglev policy</td></tr>
    <tr><td>Bounded-load CH</td><td>Ring, but a full node passes the key to the next</td><td>Caps any node at (1+ε) × average</td><td>Key placement depends on load, so less sticky</td><td>Vimeo's HAProxy setup, some cache routers</td></tr>
  </tbody>
</table>
<p>Consistent hashing also shows up outside databases: sticky routing of a user's WebSocket or game session to one server, sharding an in-memory cache tier, and partition-aware load balancing. The same "minimal movement" property is the point every time. Load balancing variants are covered in <a href="#/topic/bsd-bb-edge">Edge &amp; Traffic</a>.</p>

<h3>Rebalancing: what actually moves and who decides</h3>
<ol>
  <li><strong>Decide:</strong> an operator or a balancer chooses which partitions move. Fully automatic rebalancing is convenient but dangerous: a slow node looks dead, the system starts moving its data, the extra load makes other nodes slow, and it cascades. Many systems keep a human in the loop or throttle hard (Couchbase and Riak propose a plan; MongoDB's balancer moves a limited number of chunks per shard at a time and can optionally be restricted to a balancing window).</li>
  <li><strong>Copy:</strong> the new owner streams a snapshot of the partition, then catches up from the change log while the old owner keeps serving.</li>
  <li><strong>Cut over:</strong> a short fence: stop writes to the partition (or forward them), apply the last changes, flip ownership in the map, bump an epoch/version.</li>
  <li><strong>Redirect stragglers:</strong> clients with an old map hit the old owner, which answers "moved" (Redis MOVED, HBase NotServingRegion), and the client refreshes. During migration Redis uses ASK: keys already moved are served by the target, the rest by the source.</li>
  <li><strong>Clean up:</strong> delete the old copy only after the new owner has been authoritative for a while.</li>
</ol>
<div class="callout warn"><div class="callout-title">Throttle it</div>
<p>Rebalance traffic competes with production traffic for disk and network. Rate-limit streaming, move a few partitions at a time, and do it off-peak. A rebalance that saturates the network is a self-inflicted outage.</p></div>

<h3>Range splitting</h3>
<p>Range-partitioned systems split a range when it passes a size threshold (CockroachDB splits around 512 MB by default; MongoDB historically split chunks at 64 MB; the default is 128 MB since 6.0, which also balances by data size instead of chunk count) or when it is too hot (load-based splitting in CockroachDB, TiKV, Bigtable, and DynamoDB's "split for heat"). They merge cold, small neighbours. You can also <strong>pre-split</strong> before a bulk load: create empty ranges at known boundaries so the import does not hammer a single initial range. HBase users learn this the hard way: a new table starts as one region.</p>

<h3>DynamoDB as a worked mechanism</h3>
<p>AWS documents the model: items are placed by hashing the partition key; each physical partition holds up to ~10 GB and serves up to about 3,000 read units and 1,000 write units per second. Partitions split as data or throughput grows. <strong>Adaptive capacity</strong> lets a hot partition borrow unused throughput from the table, and split-for-heat can divide a hot partition key by sort-key range (when the table has no LSI). But a single hot item, or a key whose traffic can't be split by sort key, is still capped at ~3K read units and ~1K write units per second. That is the cleanest statement of the hot-key ceiling in any real system: no amount of table capacity rescues one hot key.</p>

<h3>Hot keys and celebrity mitigation</h3>
<p>Hashing spreads <em>keys</em>. It cannot spread <em>one</em> key. A celebrity's profile, a viral post's like counter, a flash-sale SKU, or one giant tenant all land on one partition. First, estimate it (<a href="#/topic/bsd-estimation">Estimation</a>): if the hottest key needs 50K ops/s and one partition takes ~10K, no rebalance helps.</p>
<table>
  <thead><tr><th>Hot on…</th><th>Technique</th><th>How</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td>Reads</td><td>Cache in front</td><td>Redis/CDN; plus an in-process L1 for the very hottest keys (<a href="#/topic/be-caching">Caching</a>)</td><td>Staleness; L1 invalidation across instances</td></tr>
    <tr><td>Reads</td><td>Replicate the hot key</td><td>Store k copies (key#0..key#k−1) on different nodes, read a random one</td><td>Writes go to k places</td></tr>
    <tr><td>Writes</td><td>Key salting / split counters</td><td>Write to key#rand(0..k), sum the k parts on read</td><td>Reads fan out to k; no single-row atomicity</td></tr>
    <tr><td>Writes</td><td>Buffer and batch</td><td>Aggregate increments in memory or a queue, flush every second</td><td>Small loss window or delay; needs idempotency</td></tr>
    <tr><td>Fan-out</td><td>Celebrity path</td><td>Push to followers for normal users, pull at read time for accounts above a threshold</td><td>Two code paths; merge at read</td></tr>
    <tr><td>Tenants</td><td>Isolate the whale</td><td>Directory moves the big tenant to a dedicated shard; or sub-partition it by (tenant, entity)</td><td>Special cases in ops and routing</td></tr>
  </tbody>
</table>
<p>Two rules make this work in practice. Detect hot keys (per-key metrics, sampled top-K, Redis <code>--hotkeys</code>, DynamoDB contributor insights) instead of guessing. And apply salting only to keys known to be hot, using a small "hot list", so normal keys keep single-partition reads. The same problem appears in Kafka as one lagging partition: see <a href="#/topic/be-kafka">Kafka</a>.</p>

<h3>Secondary indexes on partitioned data</h3>
<p>The data is partitioned by <code>user_id</code>. Now someone wants "find user by email" or "all orders with status = FAILED". Two designs:</p>
<div class="diagram"><pre>
 LOCAL (document-partitioned)        GLOBAL (term-partitioned)
 each partition indexes its rows     the index is partitioned by
                                     the indexed value

 P1: rows u1,u4  idx: red→u1         IdxA (a..m): email→user_id
 P2: rows u2,u5  idx: red→u5         IdxB (n..z): email→user_id
 P3: rows u3,u6  idx: blue→u3

 query color=red → ask P1,P2,P3      query email=x → ask one IdxB
 (scatter-gather, merge)             then fetch the row from its Pn
 write: one partition, sync          write: row on Pn + index on IdxB
                                     → cross-partition, usually async
</pre></div>
<table>
  <thead><tr><th></th><th>Local index</th><th>Global index</th></tr></thead>
  <tbody>
    <tr><td>Write cost</td><td>Same partition, same transaction</td><td>Extra write to another partition</td></tr>
    <tr><td>Consistency</td><td>Index always matches the row</td><td>Usually eventually consistent (lags)</td></tr>
    <tr><td>Read by indexed field</td><td>All partitions; tail latency = slowest shard</td><td>One index partition, then one data partition</td></tr>
    <tr><td>Uniqueness constraint</td><td>Cannot enforce across partitions</td><td>Possible only with a synchronous/conditional write to the index partition, not with an async GSI</td></tr>
    <tr><td>Examples</td><td>Cassandra secondary indexes, MongoDB and Elasticsearch per-shard indexes, DynamoDB LSI</td><td>DynamoDB GSI, Spanner/CockroachDB indexes (kept transactionally, at a write cost)</td></tr>
  </tbody>
</table>
<p>DynamoDB is a good detail to know: an LSI shares the base partition (strongly consistent reads possible, but it caps each partition-key value's item collection at 10 GB and must be defined at table creation); a GSI is its own partitioned table, updated asynchronously, readable only with eventual consistency, and if the GSI is under-provisioned its throttling pushes back on writes to the base table. Spanner and CockroachDB keep global indexes consistent by writing the index row in the same distributed transaction, which costs a cross-partition commit on every write (see <a href="#/topic/bsd-bb-transactions">Distributed Transactions</a>).</p>
<p>A third, very common option: <strong>do not index it in the primary store at all</strong>. Stream changes (CDC or an outbox, <a href="#/topic/be-event-driven">Event-driven</a>) into a search system or a separate lookup table built for that access pattern. That is a global index you own, with explicit lag.</p>

<h3>Cross-partition queries and transactions</h3>
<ul>
  <li><strong>Design them away:</strong> choose the key so the hot paths are single-partition. Co-locate data that is queried together under the same key (Redis Cluster hash tags: <code>{user42}:cart</code> and <code>{user42}:profile</code> hash only the part in braces, so they share a slot; Vitess and Citus co-locate tables sharded on the same column).</li>
  <li><strong>Scatter-gather</strong> for rare queries: fan out, merge, paginate carefully. Tail latency is the slowest shard's, and it gets worse as shard count grows.</li>
  <li><strong>Cross-partition writes</strong> need 2PC, a saga or an outbox. They belong to <a href="#/topic/bsd-bb-transactions">Distributed Transactions, Time &amp; IDs</a>; here the lesson is that the shard key decides how often you pay that price.</li>
  <li><strong>Analytics</strong> belongs in a warehouse fed by CDC, not as scatter-gather on the OLTP shards.</li>
</ul>

<h3>Resharding without downtime</h3>
<p>Moving from 8 to 32 shards, or from one database to sharded, while serving traffic. The safe recipe, used in some form by Vitess (VReplication + SwitchTraffic), MongoDB's online reshardCollection, and every hand-rolled migration at scale:</p>
<div class="diagram"><pre>
 1. Provision targets      old shards ──serve all traffic──►
 2. Snapshot copy          old ══copy══► new (consistent snapshot,
                                          remember the log position)
 3. Catch up via CDC       old ──binlog / WAL stream──► new
 4. Verify                 row counts + checksums per key range
 5. Switch REPLICA READS  lag-tolerant reads → new (shadow-compare)
 6. Switch WRITES +        short write fence (ms to seconds),
    PRIMARY READS          drain stream, flip map, bump epoch;
                           read-your-writes paths flip with writes
 7. Reverse stream         new ──CDC──► old  (rollback path)
 8. Decommission           after days of clean running
</pre></div>
<p>Variants: <strong>dual writes</strong> from the application (write old and new, read old, backfill, compare, switch reads, stop writing old). Dual writes are simpler to start but need care, because the two writes can fail independently, so you still need a backfill and a reconciliation pass. CDC-based copying keeps a single source of truth until the flip, which is why most tooling prefers it. Only lag-tolerant (replica) reads switch early; primary and read-your-writes paths flip together with writes, which is how Vitess sequences it (replica traffic first, then primary). Either way: do it per logical shard or key range, not all at once; keep the old side writable as a rollback target until you are sure; and make every step reversible.</p>
<div class="callout info"><div class="callout-title">Why logical shards make this easy</div>
<p>If you started with 1,024 logical shards on 8 servers, going to 32 servers is "move 768 logical shards, a few at a time", each a small, independently verifiable, independently reversible migration. If you started with 8 hash buckets, you are re-splitting every row. This is the single most valuable decision you can make on day one.</p></div>

<h3>Choosing the partition key: the checklist</h3>
<ol>
  <li><strong>Hot-path scope:</strong> what do 90% of reads and writes filter on? Use that (tenant, user, conversation, device).</li>
  <li><strong>Cardinality:</strong> many more distinct values than partitions. <code>country</code> or <code>status</code> are terrible keys.</li>
  <li><strong>Even frequency:</strong> no single value carries a big share of traffic. Estimate the biggest one.</li>
  <li><strong>Not monotonic</strong> for range partitioning (or hash it / prefix it).</li>
  <li><strong>Immutable:</strong> changing a row's key is a delete on one shard and an insert on another.</li>
  <li><strong>Fits the transactions:</strong> things that must change atomically share a key.</li>
</ol>

<h3>When would you pick which?</h3>
<table>
  <thead><tr><th>Situation</th><th>Pick</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Key-value / point lookups at scale, no range scans</td><td>Hash (ring + vnodes or fixed slots)</td><td>Even spread, cheap growth</td></tr>
    <tr><td>Time-series, ordered scans, "latest N"</td><td>Range, or hash(entity) + clustering by time</td><td>Ordered reads; avoid one hot "now" range</td></tr>
    <tr><td>Multi-tenant SaaS with a few whales</td><td>Hash to logical shards + directory overrides</td><td>Even by default, isolate the big ones</td></tr>
    <tr><td>Data residency (EU data stays in EU)</td><td>Directory or range by region prefix</td><td>Placement is a requirement, not an optimisation</td></tr>
    <tr><td>Cache tier sharding</td><td>Consistent hashing on the client</td><td>A node loss misses only ~1/N of keys</td></tr>
    <tr><td>Stateful connection routing</td><td>Consistent / rendezvous hashing</td><td>Minimal reshuffle when servers scale</td></tr>
    <tr><td>One database is still enough</td><td>Do not partition</td><td>Joins, transactions and simple ops are worth a lot</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: Multi-tenant meeting-room booking platform</h3>
<p>A booking platform for office buildings: organisations, buildings, rooms, bookings, check-ins, with tablets outside each room polling availability. Today: one Postgres, a few hundred writes/s at peak. Planning for 50× growth.</p>
<ul>
  <li><strong>Do we need it now?</strong> Not today, but within the plan horizon. A few hundred writes/s × 50 is ~10K-25K/s, call it ~15K/s: beyond the ~5K/s planning number per primary and close to the ~20K ceiling. So batching (check-in and polling-driven writes through a queue) buys time, and sharding is on the roadmap. The right move today: read replicas for tablet polling, a cache for "room status now", write batching where it is safe, and <em>a shard-ready key</em> so the split, when it comes, is cheap.</li>
  <li><strong>Key:</strong> <code>org_id</code>. Every hot query (a room's day, a user's bookings, a building's occupancy) is inside one organisation, and double-booking checks only need one org's rows, so the booking transaction stays single-shard.</li>
  <li><strong>Shard-ready now:</strong> every table carries <code>org_id</code>, every query filters on it, no foreign keys or joins across orgs, IDs that are globally unique (not per-table sequences; see <a href="#/topic/bsd-bb-transactions">IDs</a>).</li>
  <li><strong>Whale:</strong> one enterprise customer with 40 buildings is ~15% of traffic. It goes to a dedicated shard via the directory; if it outgrows that, sub-partition by <code>(org_id, building_id)</code>, because nothing transactional spans buildings.</li>
  <li><strong>Cross-org queries</strong> (internal analytics, billing) read from a warehouse fed by CDC, never from the shards.</li>
</ul>

<h3>Example 2: Chat messages</h3>
<p>Key: <code>conversation_id</code> as partition key, message time (or a sortable ID) as clustering key. "Load the latest 50 messages" is one ordered read on one partition. This is the shape Discord described for its message store (Cassandra, then ScyllaDB): partition by channel plus a time bucket, because a single huge, busy channel would otherwise become one unbounded partition. The <strong>bucket</strong> (say, one per 10 days) is a classic answer to "what if one partition grows forever?": the key becomes <code>(channel_id, bucket)</code> and reads walk back bucket by bucket.</p>

<h3>Example 3: Like counter for a viral post</h3>
<p>Writes on one key spike to ~50K/s. Options, cheapest first: buffer increments in the app and flush a sum every second (50K writes become a handful), or split the counter into 32 sub-keys (<code>likes:post9#0..#31</code>) chosen at random and summed on read (each sub-key takes ~1.5K/s). Apply the split only to posts on the hot list. Reads come from a cached total refreshed every second or two: nobody needs an exact live like count. Covered in depth in the counter case later in this module.</p>

<h3>Example 4: Time-series metrics on a range-partitioned store</h3>
<p>Row key <code>timestamp#device_id</code> sends all current writes to the last range. Reverse it to <code>device_id#timestamp</code> and writes spread across devices while "device X, last hour" is still one contiguous scan. If you need "all devices, last minute", add a small hash prefix (<code>bucket(0..15)#timestamp</code>) and fan out 16 parallel scans. This is the standard HBase/Bigtable row-key design advice.</p>

<h3>Example 5: Cache tier on consistent hashing</h3>
<p>Ten Redis or memcached nodes behind client-side consistent hashing with ~100-200 virtual points per node. One node dies: ~10% of keys miss and refill from the database, not 90% as with mod N. Add a node: ~9% of keys move. Guard the refill with request coalescing so the misses do not stampede the database (<a href="#/topic/be-caching">Caching</a>).</p>

<h3>Example 6 (FDE): "One tenant says the app got slow, everyone else is fine"</h3>
<p>A customer reports p99 latency jumping from ~80 ms to ~2 s since Monday. Other customers are unaffected.</p>
<ol>
  <li><strong>Locate:</strong> per-shard dashboards show shard 7 at ~95% CPU, the others at ~20-30%. That pattern (one shard hot, the rest idle) means skew, not under-capacity overall. Adding shards will not help.</li>
  <li><strong>Who:</strong> top queries on shard 7 by tenant: this customer onboarded 30 new buildings on Monday and their kiosk devices poll every 5 s. Another tenant on the same shard is collateral damage, which is the next complaint you will get.</li>
  <li><strong>Mitigate today:</strong> serve the polling endpoint from the cache, raise the poll interval or switch to push, rate-limit per tenant so one customer cannot starve a shard.</li>
  <li><strong>Fix this week:</strong> move the tenant to its own shard via the directory, using the online copy → catch-up → verify → flip recipe for one logical shard.</li>
  <li><strong>Prevent:</strong> per-tenant load metrics and alerts on shard imbalance (max/median), plus a documented threshold above which a tenant gets dedicated capacity.</li>
</ol>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Monotonic keys on range partitions</h3>
<p>Timestamps, auto-increment IDs, and time-prefixed IDs (Snowflake, ULID, UUIDv7) are great for index locality in one database but send every insert to the last range in a range-partitioned store. Hash or prefix them, or rely on a store that splits by load and accept the warm-up.</p>

<h3>One partition grows without bound</h3>
<p>A single key with unbounded children (a channel's messages, a device's readings, a celebrity's followers) eventually exceeds what one partition holds or compacts well. Add a time or sequence bucket to the key.</p>

<h3>Stale routing during a move</h3>
<p>Clients and proxies cache the partition map. During and after a migration, some requests go to the old owner. The owner must reject or redirect, and writes must be fenced with an epoch so a stale owner cannot accept a write after the flip. Something concrete must enforce the fence: deny-writes / query rules on the source (Vitess sets these on the source shard), a lease the old owner loses and must hold to write, or a storage-side check that rejects writes carrying an old epoch (fencing tokens, see <a href="#/topic/bsd-bb-consensus">Consensus &amp; Coordination</a>). A cutover with no fence can lose or duplicate writes.</p>

<h3>Node failure looks like a rebalance trigger</h3>
<p>A node that is slow, not dead, can trigger automatic data movement that adds more load and spreads the slowness. Separate "temporarily unavailable" (hinted handoff, replicas serve) from "gone" (rebalance), and put a delay or a human between them.</p>

<h3>Uneven partition sizes with fixed slots</h3>
<p>Fixed slots make movement easy but slots are not equal in practice: one slot may hold a whale. Balance by measured size and load, not by slot count.</p>

<h3>Scatter-gather tail latency</h3>
<p>A query that fans out to 64 shards is as slow as the slowest of 64. Even if each shard's p99 is fine, the fan-out's median approaches a single shard's p99. Keep fan-out queries off the hot path, or hedge requests (see <a href="#/topic/be-resilience">Resilience</a>).</p>

<h3>Pagination across shards</h3>
<p>"Page 5 sorted by date" across shards needs each shard to return its top (page × size) rows and a merge. Deep offsets get expensive fast; use cursor (keyset) pagination keyed on the sort field plus a tiebreaker.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>"Consistent hashing" with one token per node</h3>
<p>Random arcs mean some nodes get 2-3× their share, and a dead node dumps its whole load on one neighbour. Use virtual nodes, or fixed slots with an explicit map.</p>

<h3>Using a language's default hash</h3>
<p>Some runtime hash functions are randomised per process (Python's string hash, for one) or differ across languages and versions. Two services computing different partitions for the same key is a silent data-split bug. Use an explicit, documented hash (Murmur3, xxHash, CRC16 for Redis compatibility) everywhere.</p>

<h3>Sharding too early, or on the wrong key</h3>
<p>Sharding a system that fits on one box buys operational pain for nothing. Sharding on a key that does not match the hot queries turns every request into scatter-gather. Both are worse than not sharding.</p>

<h3>Low-cardinality or mutable keys</h3>
<p>Keying by country, plan type or status gives a handful of huge partitions. Keying by something that changes (a user's current team) forces a cross-shard move on every change.</p>

<h3>Global index assumed consistent</h3>
<p>A user signs up, the app immediately looks them up by email through an async global index, finds nothing, and creates a duplicate account. Do uniqueness checks against an authoritative source (a synchronous unique-index partition or a reservation table), and read-your-write from the primary path.</p>

<h3>Choosing the logical shard count too small</h3>
<p>Sixteen logical shards on eight servers leaves room for one doubling. Then you are back to a full reshard. Pick a count that covers a 10-100× growth in nodes; the cost of extra empty logical shards is small.</p>

<h3>Rebalancing at full speed in business hours</h3>
<p>Streaming partitions saturates disks and the network and raises latency for everyone. Throttle, move a few at a time, and schedule it.</p>

<h3>Dual writes without reconciliation</h3>
<p>The app writes old and new; one write fails; the stores drift silently. Every dual-write migration needs a backfill plus a comparison job before the read switch.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<p>These are ordered the way a tough interviewer chains them: each answer invites the next "why?" or "what if?".</p>

<div class="qa-block"><div class="qa-question">1. When do you need to partition, and why don't read replicas solve it?</div><div class="qa-answer">
<p>"When one machine can't hold the data or take the write rate. Every replica applies every write and stores every byte, so replicas scale reads and availability, not writes or storage. My threshold: plan ~5K simple writes/s per Postgres primary, ceiling ~20K, and a few TB per node before operations get painful. Before sharding I'd use indexes, caching, a bigger box, archiving and write batching, because sharding costs cross-partition joins and transactions forever. If the estimate says we're under the line, I keep one primary and design the schema to be shard-ready."</p>
</div></div>

<div class="qa-block"><div class="qa-question">2. Why not just hash(key) mod N?</div><div class="qa-answer">
<p>"It's even, but when N changes almost every key moves: a key stays only if hash mod N equals hash mod N+1, about 1/(N+1) of keys. Going from 4 to 5 nodes moves ~80% of the data. For a cache that's a miss storm on the database; for a database it's moving nearly every row under load. Mod N is fine when N is fixed, which is why I use it to map keys to a fixed set of logical shards and keep a separate, small map from logical shards to machines."</p>
</div></div>

<div class="qa-block"><div class="qa-question">3. How does consistent hashing fix that, and how many keys move when a node joins?</div><div class="qa-answer">
<p>"Keys and nodes hash onto the same ring; a key belongs to the next node clockwise. A new node takes only the arc between itself and its predecessor, about 1/(N+1) of the keys, all from one neighbour. Removal is symmetric. Lookup is a binary search over sorted node positions. Replicas are the next R distinct physical nodes clockwise, preferably in different zones. It came from Karger's 1997 work on web caching, and Dynamo made it the standard for leaderless stores like Cassandra and Riak."</p>
</div></div>

<div class="qa-block"><div class="qa-question">4. Why virtual nodes? How many, and what do they cost?</div><div class="qa-answer">
<p>"With one position per node, arc lengths are random, and the biggest is typically a few times the average, so one node gets 2-3× its fair share. And when a node dies its whole arc lands on one neighbour, which can cascade. With many tokens per node, each node's share is a sum of many small arcs, so the typical deviation is ~10%, the worst node somewhat more; a failed node's load spreads over all peers, and a bigger box can take more tokens. The cost is metadata and that repair and bootstrap touch more peers. Cassandra 4.0 cut the default from 256 tokens to 16 with smarter allocation, for two reasons: repair got heavier, and availability got worse. With 256 random vnodes every node shares ranges with almost every other node, so at RF=3 losing any two nodes loses quorum for some ranges. So I'd say tens to low hundreds, placed deliberately if the system allows."</p>
</div></div>

<div class="qa-block"><div class="qa-question">5. Ring hashing vs fixed hash slots vs rendezvous vs jump hash: which would you pick?</div><div class="qa-answer">
<p>"For a database I prefer fixed slots: hash mod S into, say, 16,384 slots like Redis Cluster, with an explicit slot → node table. Moving a slot is an observable, reversible unit and balancing is explicit. For a client-side cache tier, a ring with vnodes or rendezvous hashing, since nodes come and go arbitrarily. Rendezvous is simple, needs no ring and gives top-k replicas for free, but it's O(N) per lookup, fine for tens of nodes. Jump hash is fast and memory-free but only lets you add or remove the last bucket, so it suits storage that only grows, not a cache whose nodes fail at random. For an L4 load balancer, Maglev-style tables give O(1) lookups."</p>
</div></div>

<div class="qa-block"><div class="qa-question">6. Hash or range partitioning: when would you choose range?</div><div class="qa-answer">
<p>"When the dominant query is an ordered scan: time windows, 'latest N', prefix searches. Range keeps neighbours together and can split hot or big ranges automatically, which is why Bigtable, HBase, Spanner and CockroachDB use it. The danger is a monotonic key: if the key starts with a timestamp, all current writes hit the last range. So I put the entity first (device_id#timestamp), or add a small hash prefix and fan out a few parallel scans. Often the best of both is Cassandra's shape: hash the partition key for distribution, sort by a clustering key inside it."</p>
</div></div>

<div class="qa-block"><div class="qa-question">7. Pick a shard key for a multi-tenant SaaS. What breaks first?</div><div class="qa-answer">
<p>"tenant_id, because every hot query and every transaction that must be atomic, like a double-booking check, stays inside one tenant, so they're single-shard. What breaks first is the whale: one tenant with 10-20% of traffic, so the shard it lives on runs hot while the rest idle. I plan for it on day one: hash tenants into ~1,000 logical shards, with a directory that can override placement so a whale gets a dedicated shard. If one tenant outgrows a whole shard, I sub-partition by (tenant_id, building_id or project_id), which works only if nothing transactional spans those sub-keys. I'd verify that before promising it."</p>
</div></div>

<div class="qa-block"><div class="qa-question">8. One key gets 50K writes/s and a partition handles ~10K. Rebalancing won't help. What do you do?</div><div class="qa-answer">
<p>"Right, rebalancing moves keys and this is one key. For writes: batch first, by aggregating increments in memory or a queue and flushing a sum every second, which cuts 50K writes to a few. If the writes must be durable individually, salt the key into k sub-keys (k = 8-32) on different partitions and sum on read, applied only to keys on a hot list so normal keys keep single-partition reads. For reads of that key: cache it, add an in-process L1 for the hottest few, or replicate it as k copies. If it's a celebrity fan-out problem, the answer is a different path: pull at read time for accounts over a follower threshold instead of pushing to millions of timelines. And I'd detect hot keys with top-K metrics instead of guessing."</p>
</div></div>

<div class="qa-block"><div class="qa-question">9. Users are sharded by user_id. How do you look a user up by email?</div><div class="qa-answer">
<p>"Two choices. A local index on each shard means a lookup asks every shard: fine for an admin tool, bad for login. A global index partitioned by email gives one hop to the index shard, then one hop to the user's shard. For login I'd use the global one: a table email → user_id, sharded by hash(email). The catch is that the index entry and the user row are on different shards, so keeping them in sync is a cross-partition write: either a distributed transaction like Spanner or CockroachDB do, or an asynchronous update, like DynamoDB GSIs, which can lag."</p>
</div></div>

<div class="qa-block"><div class="qa-question">10. Your global index is asynchronous. What bugs does that cause, and how do you contain them?</div><div class="qa-answer">
<p>"Three. Read-after-write misses: a user signs up and the next lookup by email finds nothing. Uniqueness races: two signups with the same email both pass a check against a lagging index. And orphans: an index entry pointing at a deleted row, or the reverse. Containment: treat the email index as the authority for uniqueness. Signup claims the email synchronously in the index shard first (an insert into a unique table on that one shard), then creates the user, and a reconciler cleans up claims that never got a user. For read-your-writes, route the user's own requests through the primary path for a short window after a write. Every async-index consumer must tolerate a pointer to a missing row and re-check the base row. DynamoDB also teaches a capacity lesson: an under-provisioned GSI throttles the base table's writes."</p>
</div></div>

<div class="qa-block"><div class="qa-question">11. A product manager wants a dashboard of all orders over $1,000 in the last hour, across all shards. Do you run it on the shards?</div><div class="qa-answer">
<p>"Not on the OLTP shards if it's frequent. A scatter-gather to 64 shards has the tail latency of the slowest shard, and as shard count grows, the median of the fan-out approaches a single shard's p99. Plus it competes with user traffic. I'd stream changes by CDC or an outbox into a store built for that query: a warehouse for analytics, or a small materialized view keyed by time for a live dashboard. Rare admin queries can scatter-gather with a timeout and partial results. And if it's actually a hot product query, that tells me the shard key or a global index was chosen against the wrong access pattern."</p>
</div></div>

<div class="qa-block"><div class="qa-question">12. You have 8 shards and need 32. Walk me through it with zero downtime.</div><div class="qa-answer">
<p>"If we started with ~1,000 logical shards, it's moving logical shards to new servers, a few at a time. Per logical shard: provision the target; take a consistent snapshot and note the log position; stream the binlog or WAL from that position so the target catches up; verify with per-range counts and checksums; shadow-read and compare; switch only lag-tolerant replica reads early; then a short write fence of milliseconds to seconds, with primary and read-your-writes reads flipping together with writes: stop writes for that shard, drain the stream, flip the directory, bump an epoch so the old owner rejects stale writes. Then start a reverse stream from new to old so rollback is a flip, and decommission after days of clean running. Vitess's Reshard/SwitchTraffic workflow and MongoDB's online resharding do exactly this. If we started with 8 hash buckets, it's the same recipe but every row moves, which is why I'd pick the logical count generously up front."</p>
</div></div>

<div class="qa-block"><div class="qa-question">13. Mid-cutover the new shard starts erroring. How do you roll back, and how do you know you lost nothing?</div><div class="qa-answer">
<p>"Because writes were fenced and the map flip was atomic, there's one authoritative owner at any instant, and the reverse CDC stream kept the old shard current with every write accepted by the new one. Rollback is: fence writes again, let the reverse stream drain, flip the directory back, bump the epoch. The epoch matters because a client with a cached map might still write to the 'wrong' side; the fence makes that write fail instead of silently forking the data. Something has to enforce it: deny-writes rules on the side that isn't the owner, a lease the old owner must hold to write, or a storage-side check that rejects an old epoch, which is the fencing-token idea from <a href="#/topic/bsd-bb-consensus">Consensus &amp; Coordination</a>. For 'nothing lost' I don't trust the process, I check: per-range row counts and checksums between old and new after rollback, and the stream position we drained to. Writes that failed during the fence get retried by clients, so the write path must be idempotent (see <a href="#/topic/be-resilience">Resilience</a>)."</p>
</div></div>

<div class="qa-block"><div class="qa-question">14. (FDE follow-up to Example 6) You moved the slow customer to a dedicated shard, and a month later they report slowness again: they are now bigger than any single shard can be. Now what?</div><div class="qa-answer">
<p>"A dedicated shard was the last move that works by placement alone; now the tenant itself has to be partitioned. First I split their load by kind. Reads like kiosk polling and dashboards go to replicas and a cache; that is often most of the load, and it buys weeks. For writes, I find a sub-key inside the tenant that no transaction crosses. For a booking platform that's building_id: a double-booking check only touches one room's rows, so (tenant_id, building_id) can be the new partition key for that tenant, mapped through the directory to several shards. Then I check the queries that span the sub-key, like 'all of this customer's bookings today' or org-wide reports. Those become scatter-gather over the tenant's few shards or move to a CDC-fed read model. Any org-wide invariant, such as a per-org booking quota, needs a different home: a counter service, or an async check with compensation. The migration is the same online recipe per building group. I'd tell the customer plainly which cross-building views become slightly stale, and get that agreed before we flip."</p>
</div></div>
` }

  ]
});
