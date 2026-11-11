window.PREP_SITE.registerTopic({
  id: "bsd-bb-consistency",
  module: 'backend-sd',
  title: "Consistency Models, CAP & PACELC",
  estimatedReadTime: "45 min",
  tags: ["system-design","distributed-systems","consistency","linearizability","cap","pacelc","eventual-consistency","causal","tunable-consistency","interview"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>A consistency model is a contract about what a read may return when data is copied across machines; stronger contracts (linearizable) look like one copy but cost a round trip to a quorum or leader on every operation, and CAP says that during a network partition you must give up either that contract or availability, while PACELC adds that even without a partition you trade latency for it.</strong></div>
  <h4>Key points</h4>
  <ul>
    <li><strong>The ladder, strongest first:</strong> linearizable (behaves like one copy, in real time) → sequential (one agreed order, but it may lag real time) → causal (cause is always seen before effect; unrelated writes can be seen in any order) → eventual (replicas agree <em>if writes stop</em>; no promise about what you read meanwhile).</li>
    <li><strong>Session guarantees</strong> sit beside the ladder and are cheap: read-your-writes, monotonic reads, monotonic writes, writes-follow-reads. Most user-facing bugs ("my edit vanished") are a missing session guarantee, not a missing linearizability.</li>
    <li><strong>CAP, said correctly:</strong> partitions are not optional, so P is a fact, not a choice. <em>During</em> a partition, a replica that can't reach the others either refuses (keeps C, loses A) or answers with possibly stale data (keeps A, loses C). C in CAP means linearizability, nothing weaker. "CA" is not a real option for a distributed system.</li>
    <li><strong>PACELC:</strong> if Partition → Availability or Consistency; Else → Latency or Consistency. The "else" half is what you pay <em>every day</em>: DynamoDB and Cassandra are commonly classed PA/EL, Spanner and HBase PC/EC.</li>
    <li><strong>Choose per operation, not per system.</strong> Username uniqueness, money movement, seat holds and locks need linearizable compare-and-set. Feeds, like counts, view counts and search indexes are fine eventual.</li>
    <li><strong>Tunable consistency:</strong> Cassandra ONE / QUORUM / LOCAL_QUORUM / ALL (+ SERIAL via Paxos for CAS); DynamoDB eventually vs strongly consistent reads (strong costs ~2× read units, not available on GSIs or Streams; LSIs support it); MongoDB readConcern / writeConcern "majority", plus readConcern "linearizable"; Cosmos DB's five levels (strong, bounded staleness, session, consistent prefix, eventual). <em>Consistent prefix</em> = you never see writes out of order, though you may lag. <em>Bounded staleness</em> = reads lag by at most K versions or T seconds.</li>
    <li><strong>R + W &gt; N is necessary, not sufficient</strong> for linearizability: Dynamo/Riak-style sloppy quorums, last-write-wins on skewed clocks, and reads racing a half-applied write all break it.</li>
    <li><strong>Cost of strong:</strong> in one region a quorum adds ~1-2 ms. Across regions every strongly consistent write waits for at least one cross-region round trip to a majority, ~20-80 ms between nearby regions, ~70-250 ms across continents depending on the pair, and the minority side of a partition can't accept writes.</li>
    <li><strong>Not the same word:</strong> ACID's C (invariants hold), CAP's C (linearizability) and serializability (transactions look one-at-a-time) are three different things. Strict serializability = serializable + linearizable (Spanner).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Labelling a whole database "CP" or "AP" and stopping there. Most real deployments are neither in the CAP sense (Postgres with an async replica is not linearizable on the replica and not available on the minority side), and the label hides the useful question: which operations need which guarantee, and what does it cost in latency? The second trap is saying "we'll use eventual consistency" for something that has an invariant, like "no two users get the same username".</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"CAP only bites during a partition, so the more useful question is PACELC's: on a normal day, do I pay a quorum round trip for this read, or accept slightly stale data? I'll answer that per operation."</div>
  <div class="revision-say">"The seat hold needs linearizable compare-and-set on one key, so it goes to the leader. The availability grid can be eventually consistent and served from replicas and cache, because the hold itself is the source of truth."</div>
  <div class="revision-say">"The bug users actually notice is read-your-writes. I'll route a user's reads to the leader for a few seconds after they write, or pass a session token, which is much cheaper than making everything linearizable."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The problem consistency models answer</h3>
<p>The moment data lives on more than one machine (replicas for availability and read scale, see <a href="#/topic/bsd-bb-replication">Replication &amp; Quorums</a>), or more than one client touches it at once, a simple question gets hard: <strong>after a write, what is a read allowed to return?</strong> The latest value? Any value that was ever written? Something older than what <em>you</em> just wrote?</p>
<p>A <strong>consistency model</strong> is the written answer to that question. It is a contract between the storage system and the application: "if you do these operations, these are the results you may observe". A stronger contract makes the application easy to reason about (it can pretend there is one copy). A weaker contract lets the system answer faster, from the nearest replica, and keep answering when the network is broken.</p>

<div class="callout insight"><div class="callout-title">The intuition to hold onto</div>
<p>Strong consistency means <strong>coordination on the hot path</strong>: before answering, a replica has to check with others (a leader, a quorum). Coordination costs round trips, and round trips cost latency and fail when the network fails. Every model on the ladder is a different answer to "how much coordination do I pay for, and what anomaly do I accept in exchange?"</p>
</div>

<h3>Why interviewers push on it</h3>
<p>In a deep backend round, consistency is where "draw some boxes" turns into "prove you understand what your boxes do when something breaks": the read right after a write, two users claiming one username, "is it CP or AP?", the cost of going multi-region, the leader that dies right after an ack.</p>
<p>The candidate who holds up is the one who can name the anomaly, name the guarantee that prevents it, say what it costs, and pick the cheapest guarantee that is still correct for <em>that</em> operation.</p>

<h3>Three different things called "consistency"</h3>
<p>The single biggest source of confusion. Say which one you mean.</p>
<table>
  <thead><tr><th>Term</th><th>What it actually means</th><th>Scope</th><th>Example question it answers</th></tr></thead>
  <tbody>
    <tr><td><strong>C in ACID</strong></td><td>The application's invariants hold before and after each transaction (balance ≥ 0, foreign keys valid). Mostly the application's job, helped by constraints.</td><td>One database, transactions</td><td>"Can the account go negative?"</td></tr>
    <tr><td><strong>C in CAP</strong> (consistency models)</td><td>Linearizability: every operation appears to take effect at one instant between its start and end, as if there were one copy.</td><td>Single objects/keys across replicas</td><td>"After the write returns, will every read see it?"</td></tr>
    <tr><td><strong>Isolation levels</strong> (serializable, snapshot, read committed)</td><td>How concurrent multi-object transactions may interleave. Serializable = same result as some one-at-a-time order.</td><td>Multi-object transactions</td><td>"Can two transactions both book the last seat?"</td></tr>
    <tr><td><strong>Eventual consistency / convergence</strong></td><td>If writes stop, all replicas eventually hold the same value.</td><td>Replicas over time</td><td>"Will the replicas ever agree?"</td></tr>
  </tbody>
</table>
<p>Isolation is covered in <a href="#/topic/be-databases">Databases</a> and <a href="#/topic/bsd-bb-transactions">Distributed Transactions, Time &amp; IDs</a>. This topic is about the replica side: what reads see across copies, and CAP / PACELC on top.</p>

<h3>Where this shows up in designs</h3>
<ul>
  <li><strong>Read replicas and caches</strong>: every one is a place a stale read can come from (<a href="#/topic/be-caching">Caching</a>).</li>
  <li><strong>Multi-region</strong>: the latency of strong consistency becomes tens to hundreds of milliseconds.</li>
  <li><strong>Leaderless stores</strong> (Cassandra, Riak) and DynamoDB (a Multi-Paxos leader per partition, but eventually consistent reads from any replica): consistency is a per-request knob.</li>
  <li><strong>Coordination</strong> (locks, leader election, uniqueness): needs linearizability, usually via consensus (<a href="#/topic/bsd-bb-consensus">Consensus &amp; Coordination</a>).</li>
  <li><strong>Event-driven pipelines</strong>: projections and read models are eventually consistent by construction (<a href="#/topic/be-event-driven">Event-Driven Architecture</a>).</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The ladder</h3>
<p>Each step down allows more anomalies and needs less coordination. Each step down also makes it possible to stay available in more failure cases.</p>
<div class="diagram"><pre>
 STRONGER  (more coordination, higher latency, less available)
   │
   │  strict serializability   = serializable txns + real-time order
   │        (Spanner, FoundationDB, CockroachDB-ish)
   │
   │  LINEARIZABLE  ── one copy, real-time order        [CAP's "C"]
   │        (etcd, ZooKeeper writes, Spanner, DynamoDB strong read)
   │
   │  SEQUENTIAL    ── one global order, may lag real time
   │        (ZooKeeper reads without sync())
   │
   │  CAUSAL        ── cause before effect; concurrent = any order
   │        (MongoDB causal sessions, COPS research systems)
   │        ~ strongest model that can stay available in a partition
   │
   │  session guarantees: read-your-writes, monotonic reads,
   │                      monotonic writes, writes-follow-reads
   │        (Cosmos DB "session", sticky routing, LSN tokens)
   │
   │  EVENTUAL      ── replicas converge once writes stop
   │        (DNS, Cassandra at ONE, S3 replication, caches)
   ▼
 WEAKER    (local answers, low latency, always available)
</pre></div>

<h3>The four models in plain words</h3>

<h4>Linearizable: "there is one copy, and time is real"</h4>
<p>Once a write has returned success, every read that <em>starts after that moment</em>, from any client, on any replica, returns that value or a newer one. And once any reader has seen a new value, no later reader may see the old one. It is what you'd get from a single server with a single lock.</p>
<p><strong>Example:</strong> Alice changes her password and the call returns. Bob's login one second later, routed to a different replica, must check the new password. With linearizability that is guaranteed; with anything weaker the old password might still work for a while.</p>
<p><strong>Why it matters:</strong> linearizability is what lets you build <strong>compare-and-set</strong>, locks, leader election and uniqueness checks on top of replicated storage. "Set username = 'prakhar' only if it's free" is only safe if no replica can answer "free" based on old data.</p>

<h4>Sequential: "everyone sees the same order, but maybe late"</h4>
<p>All clients see all writes in the <em>same</em> order, and each client's own operations appear in the order it issued them. But that order doesn't have to match wall-clock time: a reader can be a few seconds behind, as long as it moves forward through the same history as everyone else.</p>
<p><strong>Example:</strong> ZooKeeper. Writes go through the leader and are totally ordered (linearizable). A read is served by whatever server you are connected to, which may not have applied the newest writes yet. You never see writes out of order, but you can see an old state. Calling <code>sync()</code> before a read makes that read catch up.</p>

<h4>Causal: "you never see an effect before its cause"</h4>
<p>If write B was made by someone who had seen write A (B <em>depends on</em> A), everyone sees A before B. Writes with no relationship (concurrent writes) can be seen in different orders by different people.</p>
<p><strong>Example:</strong> Alice posts "I lost my job". Her friend replies "so sorry!". Under eventual consistency, Carol might see the reply before the post it answers, which is nonsense. Causal consistency guarantees post → reply. Two unrelated posts by strangers can still appear in either order, and that's fine.</p>
<p><strong>Why it's special:</strong> causal is roughly the strongest model a system can provide while every replica keeps accepting reads and writes during a partition (a result proved for "real-time causal" consistency, assuming clients stick to replicas they've used). It is the sweet spot for collaborative and social features, but it needs dependency metadata, which is why few mainstream databases expose it directly.</p>

<h4>Eventual: "if everyone stops writing, replicas will agree"</h4>
<p>That's the whole promise. It says nothing about what you read in the meantime: an old value, a value that later disappears (a write that lost a conflict), or values going backwards between two reads hitting different replicas. It is a <strong>liveness</strong> promise (something good eventually happens), not a <strong>safety</strong> promise (nothing bad ever happens).</p>
<p><strong>Example:</strong> DNS. Change a record and resolvers around the world pick it up over minutes to hours, depending on TTLs. Like counts and view counters are the classic eventual data in system design.</p>
<p><strong>Strong eventual consistency</strong> adds: replicas that have received the same set of updates are in the same state, without coordination. CRDTs (counters, sets, text) give you this, which is how collaborative editors and Riak's data types avoid "lost write" conflicts.</p>

<h3>Session guarantees: the cheap fixes users actually notice</h3>
<p>These are per-client promises. They don't make the system linearizable, but they remove the anomalies that make users file bug reports. The mechanics (and lag anomalies they fix) are in <a href="#/topic/bsd-bb-replication">Replication &amp; Quorums</a>; here is what each one promises.</p>
<table>
  <thead><tr><th>Guarantee</th><th>Promise</th><th>Anomaly without it</th><th>Cheap way to get it</th></tr></thead>
  <tbody>
    <tr><td>Read-your-writes</td><td>You see your own writes</td><td>Edit profile, refresh, old name is back</td><td>Read from leader for N s after a write; or carry the write's log position and wait for a replica to reach it</td></tr>
    <tr><td>Monotonic reads</td><td>You never see time go backwards</td><td>Comment appears, refresh, comment gone, refresh, back again</td><td>Stick each user to one replica (hash user_id); if that replica dies, carry a version token so the next replica waits until it is at least that fresh</td></tr>
    <tr><td>Monotonic writes</td><td>Your writes apply in the order you made them</td><td>"Set price 10" then "set price 12" applied as 12 then 10</td><td>Route a session's writes through one leader / partition</td></tr>
    <tr><td>Writes-follow-reads</td><td>A write you make after reading X is ordered after X</td><td>Reply stored before the post it answers</td><td>Attach the version you read to the write (causal metadata)</td></tr>
  </tbody>
</table>

<h3>Picture of a linearizability violation</h3>
<div class="diagram"><pre>
 time ──────────────────────────────────────────────────────────►

 Writer   |── write x=2 ──────────────────────|  (returns OK)
              reaches replica A ...... reaches replica B later

 Reader 1         |── read (A) → 2 ──|
 Reader 2                               |── read (B) → 1 ──|

 Reader 2 started AFTER Reader 1 finished and saw 2,
 yet Reader 2 sees the OLD value 1.
   → fine under eventual consistency
   → a VIOLATION under linearizability
     (once anyone has seen 2, nobody may see 1)
</pre></div>
<p>This exact shape happens with a strict quorum (R + W &gt; N) when a write has landed on some replicas but not all, which is why quorum math alone does not give linearizability (see Mechanics).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. CAP, explained correctly</h3>
<p>Brewer conjectured it in 2000; Gilbert and Lynch proved a narrower formal version in 2002.</p>
<p><strong>The formal definitions:</strong></p>
<ul>
  <li><strong>C</strong> = linearizability (not "data is correct", not ACID).</li>
  <li><strong>A</strong> = every request received by a <em>non-failing</em> node gets a (non-error) response. Eventually, no time bound. This is "total availability", stricter than any SLA.</li>
  <li><strong>P</strong> = the network may drop arbitrarily many messages between nodes.</li>
</ul>
<p><strong>The theorem:</strong> if the network partitions, you cannot have both C and A. The proof is two lines:</p>
<div class="diagram"><pre>
        client X                              client Y
           │ write k=2                           │ read k
           ▼                                     ▼
     ┌───────────┐     ✂  network  ✂      ┌───────────┐
     │  node N1  │ ───── partition ────── │  node N2  │
     │  k = 2    │    (no messages)       │  k = 1    │
     └───────────┘                        └───────────┘

 N2 cannot learn about the write. When Y reads, N2 must either:
   (a) answer k=1  → available, but NOT linearizable    (AP side)
   (b) refuse/wait → linearizable, but NOT available    (CP side)
 There is no (c). That is all CAP says.
</pre></div>

<h4>What CAP does NOT say</h4>
<ul>
  <li><strong>It does not say "pick any 2".</strong> Partitions happen whether you like it or not (switch failures, GC pauses that look like partitions, misconfigured firewalls, cross-region links). A distributed system can't choose to "not tolerate partitions". So the real choice is C vs A <em>while partitioned</em>. "CA" only describes a single-node system, or a system that becomes unusable whenever the network hiccups.</li>
  <li><strong>It says nothing about the normal case.</strong> When there's no partition you can have both C and A; what you pay is latency. That gap is why PACELC exists.</li>
  <li><strong>It's per operation, not per product.</strong> A system can serve some reads with C (from the leader) and others with A (from any replica). Most real databases offer both.</li>
  <li><strong>Its definitions are extreme.</strong> Most real systems satisfy neither CAP-C nor CAP-A. Postgres with an async replica: the replica serves stale reads (not C), and the minority side of a partition can't take writes (not A). That is a perfectly good system; it just doesn't fit the binary. Martin Kleppmann's essay "Please stop calling databases CP or AP" (2015) makes this case well.</li>
  <li><strong>"Available" in CAP is not "highly available" in ops terms.</strong> A CP system like etcd or Spanner can still be up 99.99%+ of the time, because partitions that split a majority from the client are rare and short. Brewer himself argued in 2017 that Spanner is "effectively CA": technically CP, but partitions are so rare on Google's network that users don't experience the unavailability.</li>
</ul>

<h3>2. PACELC: the part you pay every day</h3>
<p>Daniel Abadi (2010, published 2012): <strong>if there is a Partition, choose Availability or Consistency; Else (normal operation), choose Latency or Consistency.</strong></p>
<p>The "else" half matters more in practice, because partitions are rare and latency is every request. Strong consistency means a replica must coordinate before answering, which is at least one extra round trip to a leader or quorum. Weak consistency means the nearest replica answers immediately.</p>
<table>
  <thead><tr><th>System (default config)</th><th>Commonly classed</th><th>During a partition</th><th>Normal operation</th></tr></thead>
  <tbody>
    <tr><td>DynamoDB</td><td>PA/EL (its default <em>read</em> path)</td><td>Each partition has a Multi-Paxos leader; writes need 2 of 3 replicas, so minority-side writes and strong reads fail, while eventually consistent reads keep being served by any replica</td><td>Writes and strong reads go to the leader; default reads are eventually consistent from any replica (cheaper, faster)</td></tr>
    <tr><td>Cassandra / ScyllaDB</td><td>PA/EL (tunable)</td><td>At ONE, any live replica answers; at QUORUM, the minority side fails</td><td>Consistency level per query; LOCAL_QUORUM is the usual compromise</td></tr>
    <tr><td>MongoDB (replica set)</td><td>PA/EC-ish, tunable</td><td>Minority primary steps down; secondaries can still serve reads if read preference allows</td><td>Primary reads by default; w:"majority" for durable writes</td></tr>
    <tr><td>Spanner</td><td>PC/EC</td><td>Minority side can't commit</td><td>Paxos majority + TrueTime commit wait on every write</td></tr>
    <tr><td>HBase / Bigtable</td><td>PC/EC</td><td>Region unavailable until reassigned</td><td>One server owns each key range; reads and writes go there</td></tr>
    <tr><td>etcd / ZooKeeper / Consul</td><td>PC/EC</td><td>Minority side refuses writes (and linearizable reads)</td><td>Raft / ZAB majority per write</td></tr>
  </tbody>
</table>
<p>These labels depend on configuration: say "commonly classed as", then go to the operation.</p>

<h3>3. How each model is implemented</h3>

<h4>Linearizable</h4>
<ul>
  <li><strong>Single leader per key range, reads from the leader.</strong> The simplest route (Postgres primary, HBase region server, a Raft group's leader). The catch: a leader that has been deposed but doesn't know it yet (a network blip, a long GC pause) can still serve a stale read. Two fixes:
    <ul>
      <li><strong>ReadIndex / quorum read:</strong> before answering, the leader confirms with a majority that it's still leader (one round of heartbeats). Correct, costs a round trip. etcd does this for its default linearizable reads.</li>
      <li><strong>Leader lease:</strong> the leader holds a time-bounded lease, and followers promise not to elect anyone else until it expires; reads are local during the lease. Fast, but relies on bounded clock drift. If clocks misbehave, you can serve stale reads. Spanner uses leases backed by TrueTime; CockroachDB uses range leases.</li>
    </ul>
  </li>
  <li><strong>Consensus on every write</strong> (Raft, Paxos, ZAB). The write is committed when a majority has it in its log. See <a href="#/topic/bsd-bb-consensus">Consensus &amp; Coordination</a>.</li>
  <li><strong>Quorum register with write-back (ABD algorithm).</strong> In leaderless systems you can get a linearizable read/write register if a reader, after collecting a quorum, writes the newest value back to a quorum before returning. That fixes the diagram in the Mental Model; Cassandra's blocking read repair at QUORUM is ABD-like. It still doesn't give you compare-and-set; for that, leaderless systems bolt on Paxos (Cassandra lightweight transactions).</li>
</ul>

<h4>Why R + W &gt; N on its own is not linearizable</h4>
<p>Quorum overlap guarantees that a read quorum <em>contains</em> at least one replica with the latest acknowledged write. It doesn't guarantee you get linearizability, because:</p>
<ol>
  <li><strong>Reads racing a write:</strong> a write in progress has reached 1 of 3 replicas. Reader 1 hits that replica and sees the new value; Reader 2 hits the other two and sees the old one. (The diagram earlier.) Fixed by synchronous read repair / write-back before returning, which Cassandra does at QUORUM (blocking read repair, the default since 4.0).</li>
  <li><strong>Last-write-wins with wall-clock timestamps:</strong> if a node's clock is ahead, its older write carries a bigger timestamp and silently beats a newer write. Acknowledged writes disappear. Clocks are covered in <a href="#/topic/bsd-bb-transactions">Distributed Transactions, Time &amp; IDs</a>.</li>
  <li><strong>Sloppy quorums (Dynamo/Riak-style):</strong> during failures, writes go to "any N healthy nodes", not the home replicas (hinted handoff). The read quorum and write quorum may not overlap at all until the hints are delivered. Cassandra also stores hints, but they don't count toward the consistency level (except at CL=ANY).</li>
  <li><strong>Failed writes aren't rolled back:</strong> a write that reached 1 replica and then "failed" (W not met) is still on that replica and may surface on a later read.</li>
  <li><strong>Membership changes:</strong> while nodes are added or replaced, "N" is briefly different for different coordinators.</li>
</ol>

<h4>Sequential</h4>
<p>A single totally ordered log (from one leader or a consensus group) applied in order by every replica, with reads served locally from whatever prefix a replica has applied. ZooKeeper is the textbook case; Kafka consumers reading a single partition see the same order too.</p>

<h4>Causal</h4>
<ul>
  <li><strong>Track dependencies:</strong> each write carries the versions it depends on (version vectors, or a compact "I've seen up to cluster time T"). A replica delays making a write visible until its dependencies are visible.</li>
  <li><strong>MongoDB causally consistent sessions:</strong> the client carries <code>operationTime</code> / <code>clusterTime</code> from its last operation; a secondary waits until it has applied up to that point before answering. Gives read-your-writes and monotonic reads across secondaries. Those guarantees only hold across a failover with majority read and write concerns (w:"majority" has been the default since 5.0).</li>
  <li><strong>Session tokens:</strong> Cosmos DB's "session" level returns a token after each write; passing it on reads makes the replica serve data at least that fresh.</li>
  <li><strong>The cheap version:</strong> route all of one user's (or one document's) operations to one partition. You get causal order inside that scope for free, which is why "partition by conversation_id" works for chat (<a href="#/topic/bsd-bb-partitioning">Partitioning &amp; Consistent Hashing</a>).</li>
</ul>

<h4>Eventual</h4>
<p>Asynchronous replication plus a way to converge: anti-entropy (Merkle-tree comparison), read repair, and a conflict rule. Conflict rules, from crudest to best:</p>
<ul>
  <li><strong>Last-write-wins (LWW):</strong> highest timestamp wins. Simple; silently drops concurrent writes. Cassandra's default per cell.</li>
  <li><strong>Keep siblings:</strong> store both versions (version vectors detect they're concurrent), let the app merge. Riak, the original Dynamo shopping cart.</li>
  <li><strong>CRDTs:</strong> data types whose merge is commutative, associative and idempotent (G-counter, OR-set, sequence CRDTs). Merge is automatic and loses nothing. Redis Enterprise active-active, Riak data types, Automerge/Yjs in collaborative editors.</li>
</ul>

<h3>4. Tunable consistency in real systems</h3>
<table>
  <thead><tr><th>System</th><th>Knobs</th><th>What "strong" means there</th><th>Gotchas</th></tr></thead>
  <tbody>
    <tr><td>Cassandra</td><td>Per query: ONE, TWO, QUORUM, LOCAL_QUORUM, EACH_QUORUM, ALL, SERIAL / LOCAL_SERIAL</td><td>QUORUM write + QUORUM read gives overlap; SERIAL (Paxos-based lightweight transactions) gives linearizable compare-and-set</td><td>LWW on clock timestamps still drops writes; LWT costs ~4 round trips and is much slower; don't mix LWT and non-LWT writes on the same data</td></tr>
    <tr><td>DynamoDB</td><td>Per read: <code>ConsistentRead</code> true/false. Transactions API for multi-item</td><td>Strong read returns the latest acknowledged write in that region</td><td>Strong reads cost ~2× read capacity; not available on global secondary indexes; global tables were historically eventually consistent across regions (LWW), a newer multi-region strong mode exists, so check current docs</td></tr>
    <tr><td>MongoDB</td><td>writeConcern (w:1, w:"majority"), readConcern (local, majority, linearizable, snapshot), readPreference</td><td>w:"majority" + readConcern "linearizable" on the primary</td><td>w:1 writes can be rolled back after a failover; reads from secondaries are stale unless you use causal sessions</td></tr>
    <tr><td>Cosmos DB</td><td>Account default + per request weaker: Strong, Bounded staleness, Session, Consistent prefix, Eventual</td><td>Strong = linearizable</td><td>Strong across multiple write regions isn't offered; strong in multi-region pays cross-region latency</td></tr>
    <tr><td>Postgres / MySQL</td><td>Sync vs async replicas (<code>synchronous_commit</code>, semi-sync), which node you read from</td><td>Reads from the primary (linearizable for a single key in practice)</td><td>Async failover can lose acknowledged writes; replica reads are stale by the replication lag</td></tr>
    <tr><td>etcd / ZooKeeper</td><td>etcd: linearizable (default) or serializable reads; ZooKeeper: <code>sync()</code> before read</td><td>etcd: linearizable via Raft ReadIndex; ZooKeeper with sync(): near-linearizable</td><td>The cheap read mode can be stale; clients often don't realise they chose it</td></tr>
    <tr><td>Redis (primary + replicas)</td><td><code>WAIT</code> for N replicas</td><td>None, strictly: replication is async and WAIT doesn't make failover safe</td><td>A failover can lose acknowledged writes; don't build locks that need correctness on it without fencing</td></tr>
  </tbody>
</table>

<h3>5. What strong consistency costs, in numbers</h3>
<p>Use the latency ladder from <a href="#/topic/bsd-estimation">Estimation &amp; Numbers</a>. All of these are orders of magnitude, not benchmarks.</p>
<table>
  <thead><tr><th>Setup</th><th>Eventual / local read</th><th>Strong read</th><th>Strong write</th></tr></thead>
  <tbody>
    <tr><td>Single region, 3 replicas in 3 AZs</td><td>~0.5-1 ms (any replica)</td><td>~1-3 ms (leader, maybe + ReadIndex round)</td><td>~2-5 ms (fsync + majority ack across AZs)</td></tr>
    <tr><td>3 regions, same continent</td><td>~1 ms (local replica)</td><td>~20-80 ms if the leader or a majority is remote</td><td>~20-80 ms (one round trip to the nearest majority)</td></tr>
    <tr><td>3 regions, across continents</td><td>~1 ms (local replica)</td><td>~70-250 ms depending on the pair</td><td>~70-250 ms depending on the pair, often more with two-phase protocols</td></tr>
    <tr><td>Spanner multi-region</td><td>Stale / snapshot reads at a past timestamp (e.g. 10-15 s old) are local</td><td>A non-leader replica must contact the leader to confirm the read timestamp (a cross-region trip unless the leader is local)</td><td>Paxos majority round trip + commit wait (a few ms at most)</td></tr>
  </tbody>
</table>
<p><strong>Throughput cost:</strong> strong writes funnel through one leader per key range, so a key range is capped at roughly what one node can do (plan ~5K simple writes/s per Postgres primary, ceiling ~20K, as in <a href="#/topic/bsd-estimation">Estimation &amp; Numbers</a>; that's spread across many rows). A single hot row is far lower, often hundreds to low thousands of updates/s, because updates serialize on its row lock. Leaderless eventual writes spread across all replicas instead.</p>
<p><strong>Availability cost:</strong> with 3 replicas and majority quorums, losing 2 makes the key range unwritable. With 5 replicas you survive 2 failures but pay a wider quorum. Eventual consistency keeps accepting writes with 1 survivor.</p>

<div class="callout warn"><div class="callout-title">The latency of strong consistency is a physics cost</div>
<p>Light in fibre covers ~200 km per millisecond. New York to London is ~5,500 km, so the theoretical floor is ~28 ms one way, ~56 ms round trip; a real round trip is ~70-80 ms. No protocol makes a cross-Atlantic linearizable write faster than one round trip to a majority. If the product needs &lt;50 ms writes for users on both continents, it can't have a single linearizable copy of that data: partition data by home region, or relax the model.</p>
</div>

<h3>6. Linearizability vs serializability</h3>
<table>
  <thead><tr><th></th><th>Linearizable</th><th>Serializable</th><th>Strict serializable</th></tr></thead>
  <tbody>
    <tr><td>About</td><td>Single operations on single objects</td><td>Transactions over many objects</td><td>Both</td></tr>
    <tr><td>Real-time order?</td><td>Yes</td><td>No: any one-at-a-time order is fine, even one that puts a later transaction first</td><td>Yes</td></tr>
    <tr><td>Anomaly it allows</td><td>Write skew across two keys (it says nothing about multi-key)</td><td>Stale reads: a read-only txn may see a state older than a committed one</td><td>None of these</td></tr>
    <tr><td>Examples</td><td>etcd, a single Raft group, DynamoDB strong read on one item</td><td>CockroachDB; any serializable DB whose reads can hit a lagging replica</td><td>Spanner, FoundationDB, single-node Postgres at SERIALIZABLE (SSI) read from the primary</td></tr>
  </tbody>
</table>
<p>Strict serializability is also called <strong>external consistency</strong> (Spanner's term). CockroachDB is serializable and guarantees no stale reads for single keys, but is not strictly serializable for all transaction pairs because it has no TrueTime-style commit wait; it depends on a configured maximum clock offset instead.</p>

<h3>7. When would you pick which?</h3>
<table>
  <thead><tr><th>Pick</th><th>When the data or operation…</th><th>Typical examples</th></tr></thead>
  <tbody>
    <tr><td>Linearizable</td><td>has an invariant checked by read-then-write; feeds a lock, lease or leader; or a stale read means money or safety is wrong</td><td>Username/email uniqueness, seat or room holds, balance debits, idempotency-key claim, leader election, config flags that gate a migration</td></tr>
    <tr><td>Causal / session</td><td>is user-generated and shown back to the same user or conversation</td><td>Profile edits, comments and replies, chat in one conversation, settings pages, shopping carts</td></tr>
    <tr><td>Bounded staleness</td><td>can be a few seconds old but must not be minutes old</td><td>Stock or availability displays, dashboards, leaderboards</td></tr>
    <tr><td>Eventual</td><td>is derived, aggregated, or approximate anyway</td><td>Like/view counts, feeds, search indexes, analytics, recommendations, CDN content</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: username uniqueness on a leaderless store</h3>
<p><strong>The setup:</strong> sign-up writes to a Cassandra <code>users_by_username</code> table at QUORUM. The design reads "is the name free?" at QUORUM, then inserts.</p>
<p><strong>What breaks:</strong> two sign-ups for "prakhar" arrive 5 ms apart at different coordinators. Both read "free" (neither write exists yet), both insert. LWW keeps the one with the higher timestamp, so one user silently loses their account mapping. QUORUM didn't help: it ensures overlap with <em>completed</em> writes, not with concurrent ones, and check-then-act is two operations.</p>
<p><strong>Fixes, in order of preference:</strong></p>
<ol>
  <li><code>INSERT ... IF NOT EXISTS</code> (Cassandra lightweight transaction, Paxos, SERIAL). Linearizable compare-and-set. Slower (~4 round trips), but sign-ups are rare, so the cost is irrelevant.</li>
  <li>Put the uniqueness check in a relational store with a <code>UNIQUE</code> constraint on the primary. The database's single leader serialises it.</li>
  <li>DynamoDB: <code>PutItem</code> with <code>attribute_not_exists(username)</code> condition, which is linearizable per item.</li>
</ol>
<p><strong>The lesson to say out loud:</strong> "uniqueness is a compare-and-set, so it needs linearizability on that one key, and nothing else in this system does."</p>

<h3>Example 2: "I edited my profile and it went back"</h3>
<p><strong>The setup:</strong> Postgres primary + 2 async read replicas behind a load balancer; writes go to the primary, all reads to replicas. Replica lag is normally ~10-100 ms but spikes to seconds during heavy batch jobs.</p>
<p><strong>What breaks:</strong> user saves, the app redirects to the profile page, the read hits a replica that hasn't applied the write yet, the old name shows. The user saves again. Support tickets follow.</p>
<p><strong>Fixes (read-your-writes, cheapest first):</strong></p>
<ul>
  <li>After a write, set a short-lived marker (cookie or session field, ~5-10 s, longer than typical lag) and route that user's reads to the primary while it's set.</li>
  <li>Return the primary's WAL position (LSN) with the write; on read, use a replica only if its replay position is ≥ that LSN, else go to the primary.</li>
  <li>Optimistic UI on the client: render the saved value from the response, don't re-fetch immediately.</li>
</ul>
<p>Linearizability for the whole profile service would also fix it, but at the cost of sending every read to the primary. The session guarantee fixes the bug users see for ~1% of the load.</p>

<h3>Example 3: meeting-room booking (a real-work shape)</h3>
<p>A workplace platform with rooms, a booking API, a tablet outside each room showing the day's timeline, and a mobile app. Different parts need very different guarantees:</p>
<table>
  <thead><tr><th>Operation</th><th>Model</th><th>Mechanism</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Create booking for room R, 10:00-11:00</td><td>Linearizable on (room, slot)</td><td>Transaction on the primary with an exclusion constraint or row lock on the room's slots</td><td>Two people must never both get the room. An invariant is checked, so it needs coordination.</td></tr>
    <tr><td>Cancel booking</td><td>Linearizable on the booking row</td><td>Primary, conditional update on status</td><td>Cancel must not race a check-in or a second cancel. Make it idempotent too.</td></tr>
    <tr><td>Tablet timeline for room R</td><td>Bounded staleness (seconds)</td><td>Read replica or cache + push/poll refresh</td><td>Being 5 s late on a display is harmless; the booking write is the source of truth.</td></tr>
    <tr><td>"My bookings" in the mobile app</td><td>Read-your-writes</td><td>Read from primary after the user's own write, or optimistic UI</td><td>A user who just booked must see the booking immediately.</td></tr>
    <tr><td>Utilisation analytics</td><td>Eventual</td><td>Event stream → warehouse</td><td>Minutes or hours old is fine.</td></tr>
  </tbody>
</table>

<h3>Example 4: multi-region writes for a SaaS app</h3>
<p>A B2B app serves the US and EU. Options:</p>
<table>
  <thead><tr><th>Option</th><th>Consistency</th><th>Write latency for the far region</th><th>Partition behaviour</th></tr></thead>
  <tbody>
    <tr><td>Single primary in US, replicas in EU</td><td>Linearizable on primary; EU reads stale</td><td>EU writes ~70-100 ms (cross-Atlantic)</td><td>EU can read (stale), can't write</td></tr>
    <tr><td>Home-region per tenant (EU tenants' data lives in EU)</td><td>Linearizable per tenant</td><td>Local for most users (~ms)</td><td>A tenant is only affected if its home region is cut off</td></tr>
    <tr><td>Multi-leader / active-active with LWW</td><td>Eventual; concurrent edits conflict</td><td>Local</td><td>Both sides keep writing; conflicts later</td></tr>
    <tr><td>Spanner/Cosmos-style strong multi-region</td><td>Linearizable globally</td><td>~One round trip to a majority of regions</td><td>Minority regions can't write</td></tr>
  </tbody>
</table>
<p>For most B2B products, <strong>home-region per tenant</strong> wins: tenants rarely need cross-region transactions, it also answers data-residency rules (GDPR), and it keeps strong consistency local and cheap.</p>

<h3>Example 5 (FDE scenario): "orders show as paid, then unpaid, then paid again"</h3>
<p><strong>The report:</strong> a customer's ops team says that in the admin dashboard, an order's status flips between "paid" and "pending" when they refresh, for about 30 seconds after payment.</p>
<p><strong>Walk-through:</strong></p>
<ol>
  <li><strong>Name the anomaly:</strong> values going backwards between refreshes is a <em>monotonic reads</em> violation. Different refreshes are hitting different replicas (or a cache and a replica) with different lag.</li>
  <li><strong>Confirm:</strong> check whether the dashboard reads through a load balancer over several replicas; log the serving node and its replication lag per request; check for a cache with per-node or per-pod copies.</li>
  <li><strong>Find why lag is 30 s:</strong> normal lag should be sub-second. Long lag usually means a long-running query on a replica blocking replay, a big batch write, or an under-sized replica.</li>
  <li><strong>Fix the experience:</strong> sticky routing per user to one replica (monotonic reads), or read order status from the primary since it's a low-volume, high-importance query.</li>
  <li><strong>Fix the cause:</strong> address the lag source; alert on replica lag above a few seconds; for payment-state reads that drive actions (refunds, fulfilment), always use the primary or the payment provider's API, never a replica.</li>
</ol>
<p>The customer-facing summary: "your data was never wrong. Some screens were reading copies that were 30 s behind. We've pinned those screens to a single fresh source and fixed what slowed the copies down."</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Failover with async replication loses acknowledged writes</h3>
<p>The leader acks a write, crashes before shipping it, a follower is promoted. The write is gone, and if the old leader comes back it may hold writes that conflict with the new history (MongoDB calls this rollback). For the client, this breaks linearizability <em>and</em> durability. Fix: synchronous or semi-synchronous replication to at least one follower for data that must not be lost (Postgres <code>synchronous_standby_names</code>, MySQL semi-sync, MongoDB w:"majority"), and accept the extra ~1-5 ms in-region.</p>

<h3>The deposed leader that keeps answering</h3>
<p>A leader pauses for 20 s in GC. The cluster elects a new one. The old leader wakes up and still thinks it's leader. What happens next depends on the setup. <strong>In Raft/Paxos</strong> it can't commit anything (it no longer has a majority), but if it serves reads locally without checking, those reads are stale. <strong>In async primary/replica failover without fencing</strong> (Postgres, MySQL or Redis with an external failover manager), the old primary keeps <em>accepting writes</em> from clients that still reach it: real split brain, two divergent histories. Fix: ReadIndex-style confirmation, leases with clock-drift margins, and <strong>fencing tokens</strong> on anything downstream (covered in <a href="#/topic/bsd-bb-consensus">Consensus &amp; Coordination</a>).</p>

<h3>Clock skew under last-write-wins</h3>
<p>A node with a clock 2 s fast writes first; a correct node writes 1 s later with a smaller timestamp. LWW keeps the older value. Nobody gets an error. Watch for it whenever "conflict resolution: timestamps" appears in a design. Use version vectors, CRDTs, or conditional writes instead for data that matters.</p>

<h3>Caches are replicas too</h3>
<p>A cache in front of a strongly consistent database makes reads eventually consistent, unless invalidation is synchronous and ordered. A classic race: reader misses, reads old value from DB, writer updates DB and deletes the cache key, reader then writes the old value into the cache. It stays stale until TTL. See cache-aside races in <a href="#/topic/be-caching">Caching</a>.</p>

<h3>Secondary indexes lag the base table</h3>
<p>DynamoDB global secondary indexes are always eventually consistent, even if you read the base table strongly. Elasticsearch is near-real-time (refresh interval ~1 s). A "query by email right after insert" against an async index returns nothing.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Labelling the whole system CP or AP</h3>
<p>Interviewers hear this as a memorised label. Go per operation and name the mechanism and cost.</p>

<h3>Check-then-act against a replica or cache</h3>
<p>"Read stock from the replica, if &gt; 0 then decrement" oversells. Any invariant check must be a single conditional write on the source of truth (<code>UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock &gt; 0</code>) or happen under the same lock as the write.</p>

<h3>Assuming QUORUM means "strongly consistent"</h3>
<p>See the five reasons in Mechanics. QUORUM/QUORUM gives you "usually reads the latest completed write", not compare-and-set and not linearizability under concurrency.</p>

<h3>Mixing consistency levels on the same data</h3>
<p>With RF=3, writing at ONE and reading at QUORUM gives no overlap guarantee (1 + 2 = 3, not &gt; 3). Mixing Cassandra lightweight transactions with plain writes on the same row breaks the LWT guarantee. Pick one level pair per data path and write it down.</p>

<h3>Using eventual consistency for money or limits</h3>
<p>Balances, quotas, rate limits that protect paid resources, and inventory holds are invariants. Eventual consistency on them means overdrafts and overselling. Strong on the decision; eventual on the display.</p>

<h3>Retries without idempotency</h3>
<p>A timeout doesn't tell you whether the write happened. Under any consistency model, a retried non-idempotent write can apply twice. Pair strong writes with idempotency keys (<a href="#/topic/be-resilience">Resilience</a>).</p>

` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block"><div class="qa-question">1. "What does the CAP theorem actually say?"</div><div class="qa-answer">
<p>"In a replicated system, if the network partitions so some replicas can't talk to others, a replica that receives a request must either answer with what it has, which may be stale (that's choosing availability), or refuse until the partition heals (that's choosing consistency). C there specifically means linearizability, and A means every non-failing node answers. It only constrains behaviour <em>during</em> a partition. When the network is fine you can have both; what you trade then is latency, which is what PACELC adds."</p>
</div></div>

<div class="qa-block"><div class="qa-question">2. "Why can't I just pick CA?"</div><div class="qa-answer">
<p>"Because P isn't something you pick, it's something that happens to you. Switches fail, cross-AZ links flap, a 30-second GC pause looks exactly like a partition to the other nodes. The only systems that are 'CA' are single-node ones, or ones that stop working whenever any message is delayed. So for a distributed system, the question is only: when a partition happens, does this operation refuse, or answer possibly stale?"</p>
</div></div>

<div class="qa-block"><div class="qa-question">3. "OK, then is Postgres with a read replica CP or AP?"</div><div class="qa-answer">
<p>"Neither, strictly, and that's why the labels aren't very useful. Reads from the async replica can be stale, so the replica isn't linearizable, so not CP for those reads. If the primary is cut off from clients, writes stop, so not AP for writes. Per operation: primary reads and writes behave like CP (linearizable, unavailable on the wrong side of a partition), replica reads behave like AP (available, stale). In a design I'd say which operations use which path and why."</p>
</div></div>

<div class="qa-block"><div class="qa-question">4. "What does PACELC add, and where do DynamoDB, Cassandra and Spanner sit?"</div><div class="qa-answer">
<p>"PACELC says: if Partition, Availability vs Consistency; Else, Latency vs Consistency. The else branch is the everyday cost, because strong consistency needs a round trip to a leader or quorum on each operation. DynamoDB and Cassandra are commonly classed PA/EL, but for different reasons. Cassandra is leaderless: at ONE, any replica answers reads and takes writes. DynamoDB has a Multi-Paxos leader per partition, so writes always go to the leader and need 2 of 3 replicas; only its default eventually consistent <em>reads</em> come from any replica, fast and possibly stale. Both let you opt into stronger reads per request. Spanner is PC/EC: every write does a Paxos majority round plus TrueTime commit wait, and the minority side of a partition can't commit. Those are default-config labels; Cassandra at QUORUM/QUORUM behaves much more like EC."</p>
</div></div>

<div class="qa-block"><div class="qa-question">5. "Explain linearizability vs serializability. Which does Postgres give you?"</div><div class="qa-answer">
<p>"Linearizability is about single objects and real time: once a write completes, every later read sees it. Serializability is about transactions over many objects: the result equals <em>some</em> serial order, which doesn't have to respect real time, so a read-only transaction can legally see an older snapshot. Strict serializability is both, which Spanner calls external consistency. A single Postgres node at SERIALIZABLE (SSI), reading from the primary, is effectively strictly serializable, because there's one copy and commit order is real-time order; that's where I put it in the comparison table. Add an async replica and reads there are neither linearizable nor fresh, even though each transaction is still serializable."</p>
</div></div>

<div class="qa-block"><div class="qa-question">6. "If I set R + W &gt; N in Cassandra, do I get strong consistency?"</div><div class="qa-answer">
<p>"You get overlap: every read quorum touches at least one replica with the latest <em>completed</em> write. That's not linearizability. To be fair to Cassandra, it closes the read/read race: at QUORUM, if the replicas disagree, the coordinator does a blocking read repair, writing the newest value back before returning, which is ABD-like, and since 4.0 the table default is read_repair='BLOCKING'. Linearizability still fails in three ways. Conflict resolution is last-write-wins on timestamps, so concurrent writes plus clock skew silently drop an acknowledged write. A write that failed to reach W replicas isn't rolled back and may surface later. And there is no compare-and-set: two concurrent 'insert if absent' both succeed. (Sloppy quorums are a Dynamo/Riak-style problem; Cassandra's hints don't count toward the consistency level except at CL=ANY.) For real linearizable CAS, Cassandra has lightweight transactions at SERIAL consistency, which run Paxos and cost about 4 round trips."</p>
</div></div>

<div class="qa-block"><div class="qa-question">7. "With a Raft leader, why not just read from the leader? Why do etcd reads need anything extra?"</div><div class="qa-answer">
<p>"Because the node that thinks it's leader may not be. If it's partitioned or paused, the others can elect a new leader and commit new writes; the old leader would serve stale data. Two fixes. A deposed Raft leader can't <em>commit</em>, since it lacks a majority, so this is a stale-read problem, not split brain; split brain with accepted writes belongs to async primary/replica failover without fencing. ReadIndex: the leader records its commit index, sends a heartbeat round, and only after a majority confirms it's still leader does it answer, once its apply index has reached that read index. A new leader must first commit a no-op in its own term, so it knows its commit index is current. Costs one round trip, no disk write. Leases: followers promise not to elect a new leader for a lease period, so the leader can answer locally until the lease expires. That's faster but relies on clocks not drifting more than the safety margin. etcd uses ReadIndex for its default linearizable reads and also offers a cheaper 'serializable' read that may be stale."</p>
</div></div>

<div class="qa-block"><div class="qa-question">8. "We go multi-region with strong consistency. Give me numbers for what a write costs."</div><div class="qa-answer">
<p>"A linearizable write needs a majority to acknowledge, so it costs at least one round trip from the leader to the nearest majority. Three regions on one continent: ~20-80 ms per write instead of ~2-5 ms in one region. Across continents: ~70-250 ms depending on the region pair. And that's leader-side: a client far from the leader first pays its own hop to the leader, so a user in Singapore writing to a US-hosted leader adds that round trip on top. Reads either go to the leader (same cost if you're far away) or use leases or a timestamp scheme so a local replica can answer once it's caught up. If the product needs sub-50 ms writes in both the US and EU, I wouldn't make one global linearizable copy. I'd give each tenant or user a home region, keep strong consistency inside it, and replicate asynchronously elsewhere for reads and disaster recovery."</p>
</div></div>

<div class="qa-block"><div class="qa-question">9. "Spanner says it's globally consistent and highly available. Did Google beat CAP?"</div><div class="qa-answer">
<p>"No. Spanner is CP: during a partition, the minority side of a Paxos group can't commit. What Google did was make partitions very rare with a private redundant network, so the C-over-A choice almost never costs users anything, which is why Brewer called it 'effectively CA'. The interesting trick is TrueTime: GPS and atomic clocks give each node a time interval with bounded uncertainty, and a commit waits out that uncertainty (a few milliseconds) before acknowledging. That makes commit timestamps respect real-time order globally, giving external consistency, and it lets replicas serve consistent snapshot reads at a past timestamp locally. A strong read at a non-leader replica still has to ask the leader to confirm the read timestamp, so it's only local when the leader is local."</p>
</div></div>

<div class="qa-block"><div class="qa-question">10. "Why is causal consistency interesting, and how would you implement it?"</div><div class="qa-answer">
<p>"It's roughly the strongest model you can keep while every replica stays available during a partition, and it rules out the anomalies humans notice: replies before posts, a permission removed and then a photo shared still visible to the removed person. Implementation: every write carries its dependencies, either version vectors or a single 'I've seen up to cluster time T' token; a replica holds back a write or a read until it has applied everything that write depends on. MongoDB's causally consistent sessions do the token version. The cheap version in a design is partitioning so related things share one partition, like all messages in one conversation, because a single partition's log already gives you order. The cost is metadata per write and the risk that one slow dependency delays visibility."</p>
</div></div>

<div class="qa-block"><div class="qa-question">11. "Design question: a ticket booking system. Which consistency where?"</div><div class="qa-answer">
<p>"I'd split it by operation. Seat hold and purchase: linearizable on the seat, via a conditional write on the primary or a single-partition transaction, with a hold that expires (TTL) and an idempotency key on purchase, because two people must never get the same seat. Payment state: strong, from the primary and the provider's webhook, never a replica. Seat map display: bounded staleness, served from cache or replicas with a few seconds of lag, because the hold is the real check. If the map says free and the hold fails, the user just picks again. Event listings and search: eventual. 'My tickets' page: read-your-writes, via primary reads after purchase. That keeps the expensive guarantee on maybe 1% of requests."</p>
</div></div>

<div class="qa-block"><div class="qa-question">12. "The primary dies right after acknowledging a write. Is the write lost? What do you do about it?"</div><div class="qa-answer">
<p>"With async replication, possibly yes. If the promoted follower hadn't received it, the client was told 'success' for a write that no longer exists, which breaks durability and linearizability. Options: synchronous or semi-synchronous replication to at least one follower so an acked write exists on two nodes (costs ~1-5 ms in-region and blocks writes if the sync follower is down unless you allow fallback); quorum writes like MongoDB w:'majority' or Raft commit, where a write is acked only once a majority has it, so any electable leader has it; and failover tooling that only promotes the most up-to-date follower. I'd tie the choice to an explicit RPO: zero for payments and bookings, seconds for activity data."</p>
</div></div>

<div class="qa-block"><div class="qa-question">13. "FDE scenario: a customer says 'users update their address, and orders still ship to the old one'. Walk me through it."</div><div class="qa-answer">
<p>"First, the timeline: how long after the edit was the order placed, and does it happen more at peak? If it's within seconds, I suspect a stale read. Then trace the order path: where does checkout read the address? Commonly it's a read replica, a cache, or a copy in another service fed by events. Each is eventually consistent. I'd check replica lag and cache TTLs, and for event-fed copies the consumer lag. The fix depends on the source: for checkout, the address is part of a money-and-fulfilment decision, so read it from the source of truth, or better, snapshot the address onto the order at checkout from a primary read and show it on the confirm screen, so the user confirms exactly what will ship. For the edit itself, read-your-writes in the profile UI. Then add a metric: lag between profile update and the copy checkout reads from, with an alert."</p>
</div></div>

<div class="qa-block"><div class="qa-question">14. "How would you check whether a database really provides the consistency it claims?"</div><div class="qa-answer">
<p>"Read the vendor's precise definitions and defaults first, because 'strong' often means something narrower, like strong within one region or for single keys. Then look for independent testing: Jepsen analyses have found real violations in many well-known databases, often in failover paths or non-default settings. To test it myself, I'd run a Jepsen-style harness: concurrent clients doing reads, writes and compare-and-sets, a nemesis injecting partitions, clock skew and process kills, and a recorded history checked by a linearizability checker (Knossos, Porcupine) or a transactional checker (Elle). In production, I'd watch replica lag, failover events and conflict counts, because the guarantees that break are usually the ones exercised only during failures."</p>
</div></div>
` }

  ]
});
