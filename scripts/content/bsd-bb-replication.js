window.PREP_SITE.registerTopic({
  id: "bsd-bb-replication",
  module: 'backend-sd',
  title: "Replication & Quorums",
  estimatedReadTime: "50 min",
  tags: ["system-design","replication","quorum","leader-follower","multi-leader","leaderless","failover","split-brain","replication-lag","anti-entropy","interview"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>Replication keeps copies of the same data on several machines for availability, durability, read scale and locality. Every design answers two questions: who may accept a write (one leader, many leaders, or any node), and when is a write "done" (after 1 copy, after some, after a majority). The answers decide what you lose on a crash and what stale reads users see.</strong></div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Single-leader</strong> (Postgres, MySQL, MongoDB replica sets, Kafka partitions, Redis): one node takes writes and ships a log to followers. Simple, no write conflicts. Writes do not scale past one primary (plan ~5K simple writes/s, ceiling ~20K for Postgres; see <a href="#/topic/bsd-estimation">Estimation</a>).</li>
    <li><strong>Multi-leader</strong> (multi-region active-active, CouchDB, offline-first apps, Postgres BDR, DynamoDB global tables): every region writes locally. Low write latency, survives a region loss, but <em>conflicts are guaranteed</em> and must be resolved (LWW, merge, CRDTs).</li>
    <li><strong>Leaderless</strong> (Dynamo paper, Cassandra, ScyllaDB, Riak): the client (or a coordinator) writes to N replicas and waits for W acks; reads ask R replicas. <strong>R + W &gt; N</strong> means the read set and write set overlap in at least one node.</li>
    <li><strong>Sync vs async:</strong> sync = no data loss on leader crash but latency and availability hostage to the slowest required replica. Async = fast but the last few ms-to-seconds of writes can vanish on failover (that window is your RPO). Real systems use <em>semi-sync</em> or <em>quorum commit</em> (1 of N sync, Aurora 4 of 6, Kafka min.insync.replicas).</li>
    <li><strong>Lag anomalies</strong> from async followers: <strong>read-your-writes</strong> (my update is "gone" after refresh), <strong>monotonic reads</strong> (data goes back in time between two reads), <strong>consistent prefix</strong> (answer seen before the question). Fixes: read from leader after own writes, LSN/version tokens, sticky replica per user, causally related writes in one partition.</li>
    <li><strong>Quorum repair:</strong> hinted handoff (a stand-in node holds writes for a dead one), read repair (fix stale replicas seen during a read), anti-entropy (background Merkle tree comparison for data nobody reads).</li>
    <li><strong>Sloppy quorums</strong> (Dynamo, Riak) keep writes available when home replicas are unreachable: hinted writes on fallback nodes count toward W, so R + W &gt; N no longer guarantees overlap. <strong>Cassandra quorums are strict:</strong> hints do not count toward the consistency level (except CL=ANY), so too few home replicas means UnavailableException.</li>
    <li><strong>Quorums are not linearizability.</strong> Concurrent writes with last-write-wins, partially failed writes, sloppy quorums and clock skew all break "I always read the latest".</li>
    <li><strong>Failover</strong> = detect (timeouts), choose (most up-to-date replica, via consensus), reconfigure (clients, old leader). Risks: lost async writes, reused IDs, two leaders (<strong>split brain</strong>). Prevent with a majority/lease from a consensus store (etcd/ZooKeeper/Consul) and <strong>fencing tokens</strong> or STONITH.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Saying "add read replicas" and stopping. A deep interviewer immediately asks: "the user writes then reads from a replica, what do they see?", then "the primary dies, how many writes are lost?", then "who decides the new primary, and what stops the old one writing?". Also: saying "R + W &gt; N gives strong consistency". It gives overlap, not linearizability.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Reads scale with async replicas, but I have to handle lag: the user's own reads go to the primary or to a replica that has caught up to their last write's LSN."</div>
  <div class="revision-say">"For durability I'd run one synchronous standby out of two or three, so a commit is on two machines in different zones before we ack, without making every replica a latency hostage."</div>
  <div class="revision-say">"Failover is a consensus problem: a lease in etcd decides the leader, and the old primary is fenced, by demotion, the proxy or STONITH, so a zombie can't keep writing."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What replication is</h3>
<p>Replication means keeping a copy of the same data on more than one machine, connected by a network. It is different from <a href="#/topic/bsd-bb-partitioning">partitioning</a>: partitioning splits data so each node holds a <em>different</em> slice, replication copies each slice so several nodes hold the <em>same</em> slice. Real systems do both: a Cassandra or DynamoDB table is split into partitions, and each partition is stored on ~3 replicas.</p>
<p>If the data never changed, replication would be trivial: copy it once. The whole topic is about <strong>handling changes</strong>: how a write reaches every copy, how long that takes, what happens when a copy is down while it is happening, and what a reader sees in the meantime.</p>

<h3>Why you replicate (four separate reasons)</h3>
<table>
  <thead><tr><th>Reason</th><th>What it buys</th><th>What it needs from the design</th></tr></thead>
  <tbody>
    <tr><td><strong>Availability</strong></td><td>The system keeps serving when a node, rack or zone dies</td><td>Automatic failover (single-leader) or no leader at all (leaderless); replicas in different failure domains</td></tr>
    <tr><td><strong>Durability</strong></td><td>An acked write survives a disk or machine loss</td><td>The write is on 2+ machines <em>before</em> the client gets "OK" (sync or quorum commit)</td></tr>
    <tr><td><strong>Read scale</strong></td><td>More machines serving reads</td><td>Async followers are fine, but you must handle stale reads</td></tr>
    <tr><td><strong>Latency / locality</strong></td><td>Data close to users in each region</td><td>Cross-region replicas; for local <em>writes</em> you need multi-leader or a partition-per-region (home-region) design</td></tr>
  </tbody>
</table>
<p>Say which one you are buying: durability wants synchronous copies, read scale and latency want asynchronous ones. "3 replicas" with no reason is not a decision.</p>

<h3>The three topologies at a glance</h3>
<table>
  <thead><tr><th></th><th>Single-leader</th><th>Multi-leader</th><th>Leaderless</th></tr></thead>
  <tbody>
    <tr><td>Who accepts writes</td><td>One leader per partition</td><td>One leader per region/site (or per device)</td><td>Any replica; client/coordinator fans out</td></tr>
    <tr><td>Write conflicts</td><td>None (leader serialises)</td><td>Yes, must be resolved</td><td>Yes (concurrent writes), resolved by versions/LWW/CRDT</td></tr>
    <tr><td>Write latency</td><td>One round trip to the leader (could be far away)</td><td>Local</td><td>Wait for W of N; tail latency is the W-th fastest</td></tr>
    <tr><td>Leader failure</td><td>Failover needed (seconds to minutes, risky)</td><td>Other leaders keep going</td><td>No failover concept; just fewer replicas answering</td></tr>
    <tr><td>Strongest offered read</td><td>Linearizable (read from leader, with a lease)</td><td>Usually eventual across regions</td><td>Tunable, never truly linearizable with LWW</td></tr>
    <tr><td>Real systems</td><td>Postgres, MySQL, SQL Server, MongoDB, Redis, Kafka, etcd (Raft is single-leader)</td><td>CouchDB, Postgres BDR, DynamoDB global tables, Cosmos DB multi-region writes, offline-first mobile apps</td><td>Dynamo (2007 paper), Cassandra, ScyllaDB, Riak, Voldemort</td></tr>
    <tr><td>Default pick when</td><td>Almost always. You need transactions and constraints</td><td>Writes must be local in several regions, or devices work offline</td><td>Very high write volume, always-writable, conflicts tolerable or modelled</td></tr>
  </tbody>
</table>

<div class="callout warn"><div class="callout-title">Common misconception: DynamoDB is not "Dynamo"</div>
<p>The 2007 Dynamo paper describes a leaderless store with sloppy quorums and vector clocks. The DynamoDB <em>service</em> is different: each partition has a leader replica and ~3 copies across AZs; a write is acked when a majority have it, strongly consistent reads go to the leader, eventually consistent reads may hit any replica. Cassandra and Riak are the leaderless descendants of the paper. Interviewers who know this notice when you mix them up.</p>
<p><strong>Also not LWW multi-leader:</strong> Galera and MySQL Group Replication multi-primary let every node accept writes but replicate synchronously with certification: conflicting transactions abort at commit (first committer wins), so there is nothing to merge. And MySQL "multi-source" replication is fan-in (one replica, several sources), not multi-leader.</p></div>

<h3>Why interviewers probe this so hard</h3>
<p>Replication is where designs meet partial failure. If you can say what is lost, what is stale and who decides for each choice you draw, you will hold up four or five follow-ups deep.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Intuition: a notebook and photocopies</h3>
<p>Think of the leader as the one person allowed to write in the master notebook. Every write is also appended to a numbered changelog (the <strong>replication log</strong>: WAL in Postgres, binlog in MySQL, oplog in MongoDB, the partition log in Kafka). Followers are clerks who read that changelog and apply each entry, in order, to their own copy. A follower's state is fully described by one number: <strong>"I have applied the log up to position X"</strong> (an LSN, a GTID, an offset). Replication lag is just "leader position minus follower position".</p>
<p>That single picture explains most of the topic:</p>
<ul>
  <li><strong>Stale reads</strong> = reading from a clerk whose X is behind the position of the write you care about.</li>
  <li><strong>Lost writes on failover</strong> = promoting a clerk whose X is behind the old leader's; entries after X are gone.</li>
  <li><strong>Read-your-writes fix</strong> = remember the position of your write and only read from a clerk with X at least that big.</li>
  <li><strong>Adding a new follower</strong> = copy a snapshot taken at position X, then replay the log from X.</li>
</ul>

<h3>Single-leader, with a sync and an async follower</h3>
<div class="diagram"><pre>
   client
     │ 1. write
     ▼
 ┌────────┐  2. append to log (LSN 1042)
 │ LEADER │───────────────┬─────────────────────┐
 └────────┘               │ sync                │ async
     ▲                    ▼                     ▼
     │              ┌───────────┐         ┌───────────┐
     │ 3. ack       │ FOLLOWER A│         │ FOLLOWER B│
     └──────────────│ at 1042   │         │ at 1037   │
       (only after  └───────────┘         └───────────┘
        A confirms)    zone b                zone c
                                         lag = 5 entries
 Commit is durable on 2 machines. B serves reads that may be
 ~ms to seconds stale. If the leader dies, promote A, not B.
</pre></div>

<h3>Multi-leader across regions</h3>
<div class="diagram"><pre>
   users in India                      users in US
        │ local write                       │ local write
        ▼                                   ▼
 ┌──────────────┐   async, both ways  ┌──────────────┐
 │ LEADER (ap)  │◄═══════════════════►│ LEADER (us)  │
 │ followers... │    ~100-250 ms RTT  │ followers... │
 └──────────────┘                     └──────────────┘
 Same row edited in both regions inside the replication
 window = a CONFLICT. Someone must decide the winner or merge.
</pre></div>

<h3>Leaderless quorum (N = 3, W = 2, R = 2)</h3>
<div class="diagram"><pre>
 write v2 ──► replica 1  ack  ✓
          ──► replica 2  ack  ✓    W = 2 reached → OK to client
          ──► replica 3  (down, missed v2)

 read     ──► replica 2  returns v2 ┐
          ──► replica 3  returns v1 ┘ R = 2: newest version wins
                                       → client gets v2, and the
                                         coordinator writes v2 back
                                         to replica 3 (read repair)

 W + R = 4 &gt; N = 3: any 2 read nodes share at least 1 node
 with any 2 write nodes, so one of them has v2.
</pre></div>

<h3>The two dials that define every design</h3>
<table>
  <thead><tr><th>Dial</th><th>Positions</th><th>Moving it right costs</th><th>Moving it right buys</th></tr></thead>
  <tbody>
    <tr><td>Who may write</td><td>one leader → one per region → anyone</td><td>Conflicts, weaker guarantees, harder app logic</td><td>Write availability and local write latency</td></tr>
    <tr><td>When is a write done</td><td>leader only → 1 sync follower → majority → all</td><td>Latency (slowest required ack) and availability (needs those replicas up)</td><td>Durability on crash, fewer lost writes on failover</td></tr>
  </tbody>
</table>
<p>Whenever an interviewer gives you a new requirement ("must survive a region loss", "no lost payments", "writes from Sydney in &lt; 50 ms"), translate it into a position on these two dials and the trade-off falls out.</p>

<h3>Where this connects</h3>
<p>Precise consistency levels and CAP/PACELC: <a href="#/topic/bsd-bb-consistency">Consistency</a>. Elections, leases, fencing: <a href="#/topic/bsd-bb-consensus">Consensus</a>. Clocks, LWW and vector clocks: <a href="#/topic/bsd-bb-transactions">Time &amp; IDs</a>. Replica placement on the ring: <a href="#/topic/bsd-bb-partitioning">Partitioning</a>. Kafka ISR: <a href="#/topic/be-kafka">Kafka</a>. Day-to-day read replicas: <a href="#/topic/be-databases">Databases</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. What actually gets shipped: the replication log</h3>
<table>
  <thead><tr><th>Log format</th><th>Example</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td><strong>Statement-based</strong></td><td>Old MySQL default (SBR)</td><td>Compact</td><td>Non-deterministic statements (NOW(), RAND(), auto-increment order, triggers) produce different results on followers. Mostly abandoned</td></tr>
    <tr><td><strong>Physical / WAL shipping</strong></td><td>Postgres streaming replication</td><td>Exact byte-level copy, cheap for the leader</td><td>Tied to storage format and major version, so zero-downtime major upgrades need another method; replicas must be full copies</td></tr>
    <tr><td><strong>Logical (row-based)</strong></td><td>MySQL row-based binlog, Postgres logical replication, MongoDB oplog</td><td>Version-independent, can replicate a subset of tables, can feed other systems (CDC with Debezium into Kafka)</td><td>More bytes for bulk updates; schema changes need care</td></tr>
  </tbody>
</table>
<p>The logical log is also the foundation of change data capture and the <a href="#/topic/be-event-driven">event-driven</a> outbox pattern: "replicate to a follower" and "publish changes to Kafka" are the same mechanism with a different consumer.</p>

<h3>2. Sync, async, semi-sync and quorum commit</h3>
<table>
  <thead><tr><th>Mode</th><th>Ack sent to client when</th><th>Lost on leader crash</th><th>Latency added</th><th>Availability risk</th></tr></thead>
  <tbody>
    <tr><td><strong>Async</strong></td><td>Leader has it locally</td><td>Everything not yet shipped (ms to seconds; minutes if lag spiked)</td><td>None</td><td>None from replicas</td></tr>
    <tr><td><strong>Fully sync (all)</strong></td><td>Every follower has it</td><td>Nothing</td><td>Slowest follower's round trip</td><td>Any one follower down blocks all writes. Almost nobody runs this</td></tr>
    <tr><td><strong>Semi-sync / 1 sync standby</strong></td><td>Leader + at least one follower</td><td>Nothing, if you promote that follower</td><td>One round trip to the nearest standby (~1 ms same region, cross-AZ a little more)</td><td>If no sync standby is available, vanilla Postgres commits hang; they do not fall back to async (Patroni's non-strict synchronous_mode does that). MySQL semi-sync falls back after a timeout</td></tr>
    <tr><td><strong>Quorum commit</strong></td><td>Majority (or k of N) have it</td><td>Nothing if the new leader is chosen from the majority</td><td>k-th fastest replica, tolerant of one slow node</td><td>Survives a minority of replicas down</td></tr>
  </tbody>
</table>
<p>Concrete knobs, so you can name them:</p>
<ul>
  <li><strong>Postgres:</strong> <code>synchronous_standby_names = 'ANY 1 (s1, s2)'</code> gives quorum-style "any one of two". <code>synchronous_commit</code> ranges from <code>off</code> (not even local flush before ack) through <code>remote_write</code>, <code>on</code> (standby flushed WAL) to <code>remote_apply</code> (standby has applied it, so a read there sees it). It can be set per transaction: payments use <code>on</code>, analytics events use <code>local</code>.</li>
  <li><strong>MySQL:</strong> semi-synchronous replication waits for at least one replica to <em>receive</em> the event (relay log), not apply it. "Lossless" semi-sync (AFTER_SYNC) waits before committing on the source so a crash cannot expose a commit no replica has.</li>
  <li><strong>Kafka:</strong> <code>acks=all</code> + <code>min.insync.replicas=2</code> with replication factor 3: a write is acked when every in-sync replica has it, and refused if fewer than 2 are in sync. Followers that fall behind are dropped from the ISR rather than blocking the leader.</li>
  <li><strong>MongoDB:</strong> <code>writeConcern: { w: "majority" }</code>; <code>readConcern: "majority"</code> only returns data a majority has, so it cannot be rolled back by a failover.</li>
  <li><strong>Aurora:</strong> storage is replicated 6 ways across 3 AZs; a write needs 4 of 6 and a read quorum (used in recovery) needs 3 of 6. Writes survive losing an AZ (2 of 6); reads and repair survive AZ+1. Replicas share that storage, so replica lag is typically tens of ms.</li>
</ul>
<div class="callout insight"><div class="callout-title">Durability is not the same as visibility</div>
<p>"Sync replication" usually means the standby has <em>persisted</em> the log, not <em>applied</em> it. A read on that standby a millisecond after the ack can still be stale. Only <code>remote_apply</code>-style settings (or reading from the leader) make your own write visible on the replica. People confuse these in interviews constantly. Also: if a client cancels a commit that is waiting for the sync standby, Postgres keeps it committed locally, but it may not be replicated.</p></div>

<h3>3. Adding a follower without downtime</h3>
<p>Take a snapshot tagged with its log position (<code>pg_basebackup</code>, binlog GTID, or a storage snapshot), restore it, replay the log from that position, and add the node to the read pool once lag is near zero. The leader must <strong>retain</strong> the log until then; Postgres replication slots do this, which is also a classic outage (see Pitfalls).</p>

<h3>4. Replication lag and its three anomalies</h3>
<p>Async lag in the same region is usually milliseconds to sub-second. It grows to seconds or minutes under a write burst, a long-running transaction or migration on the leader, a slow replica disk, a replica running heavy analytical queries, or cross-region links. Your design must be correct when lag is large, not just when it is typical.</p>
<table>
  <thead><tr><th>Anomaly</th><th>What the user sees</th><th>Guarantee you want</th><th>Fixes</th></tr></thead>
  <tbody>
    <tr><td><strong>Read-your-writes</strong></td><td>I save my profile, the page reloads, the old value is back</td><td>A user always sees their own writes</td><td>Read from the leader for things the user can edit, or for ~N seconds after their last write; or remember the write's LSN/version in the session and only read from a replica that has applied it; or fall back to the leader if no replica is caught up</td></tr>
    <tr><td><strong>Monotonic reads</strong></td><td>A comment appears, I refresh, it is gone, I refresh, it is back</td><td>Time never goes backwards for one user</td><td>Pin each user to one replica (hash user_id → replica), or carry the highest LSN seen and never read from a replica below it</td></tr>
    <tr><td><strong>Consistent prefix</strong></td><td>I see the answer before the question (two writes on different partitions arrive out of order)</td><td>If B happened after A, nobody sees B without A</td><td>Put causally related writes in the same partition (same conversation_id), or track causal dependencies (version vectors, causal sessions)</td></tr>
  </tbody>
</table>
<p>Real implementations of the LSN-token idea: MongoDB causally consistent sessions (<code>afterClusterTime</code>), Azure Cosmos DB "session" consistency tokens, Postgres apps comparing <code>pg_last_wal_replay_lsn()</code> on a replica with the LSN returned after a write, and AWS DynamoDB's simpler per-request <code>ConsistentRead=true</code> (go to the leader). Cross-device read-your-writes (I write on my phone, read on my laptop) needs the token stored server-side per user, not in one device's cookie.</p>

<h3>5. Multi-leader: the conflict problem</h3>
<p>With two leaders, two writes to the same record can each succeed locally, then cross in flight. Neither leader was wrong; the system now holds two versions. Options, from crudest to best:</p>
<ul>
  <li><strong>Avoid conflicts:</strong> route every write for a given record to one "home" leader (user's home region). Most production "multi-region active-active" is really this: active-active across users, single-leader per user. Conflicts only happen when the home changes.</li>
  <li><strong>Last write wins (LWW):</strong> attach a timestamp, keep the highest. Simple and used by Cassandra and DynamoDB global tables. It <em>silently discards</em> the losing write, and with clock skew the "later" write may actually be the earlier one. Fine for caches, presence, "last seen"; dangerous for counters, carts, balances.</li>
  <li><strong>Merge in the app:</strong> keep both versions (siblings) and let code or the user merge them (Riak siblings, CouchDB conflicts, Git).</li>
  <li><strong>CRDTs:</strong> data types whose merge is mathematically order-independent: grow-only counters, PN-counters, OR-sets, sequence CRDTs for text (Riak data types, Redis Enterprise active-active, Automerge/Yjs for collaborative editing). Converge automatically, but only for operations that fit the type.</li>
</ul>
<p>Multi-leader also breaks things you get for free with one leader: unique constraints ("username must be unique" can be violated in two regions at once), auto-increment IDs (use region-prefixed or Snowflake-style IDs), and foreign keys. Detecting concurrency correctly needs version vectors rather than timestamps (see <a href="#/topic/bsd-bb-transactions">Time &amp; IDs</a>).</p>

<h3>6. Leaderless quorums in detail</h3>
<p>Each key lives on N replicas (usually the next N nodes clockwise on the hash ring; see <a href="#/topic/bsd-bb-partitioning">Partitioning</a>). A coordinator sends the write to all N and returns success after W acks; a read goes to R replicas (often all N, waiting for R) and returns the newest version among them.</p>
<table>
  <thead><tr><th>N / W / R</th><th>Behaviour</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td>3 / 2 / 2</td><td>Overlap guaranteed, tolerates 1 node down for both reads and writes</td><td>The default balanced choice (Cassandra QUORUM / QUORUM)</td></tr>
    <tr><td>3 / 3 / 1</td><td>Fast reads, but one dead node blocks all writes</td><td>Read-heavy, writes can be retried later. Rare</td></tr>
    <tr><td>3 / 1 / 3</td><td>Fast, always-available writes, but one dead node blocks reads</td><td>Write-heavy ingestion where reads are rare</td></tr>
    <tr><td>3 / 1 / 1</td><td>No overlap. Fastest and most available; reads may be stale</td><td>Metrics, logs, "likes" where eventual is fine (Cassandra ONE)</td></tr>
    <tr><td>5 / 3 / 3</td><td>Tolerates 2 nodes down</td><td>Higher durability or multi-AZ with uneven zones</td></tr>
  </tbody>
</table>
<p>Latency note: quorum latency is the W-th (or R-th) fastest response, not the slowest. With N = 3, W = 2, one slow or GC-pausing node does not hurt you. This is why leaderless stores have good tail latency under node hiccups, and why Cassandra also does "speculative retry" on reads.</p>
<p>Multi-datacenter quorums: Cassandra's <code>LOCAL_QUORUM</code> counts only replicas in the local DC (e.g. 2 of 3 local), so writes do not wait for a cross-ocean round trip, and the remote DC catches up asynchronously. <code>EACH_QUORUM</code> waits for a quorum in every DC: safer, slower.</p>

<h3>7. Keeping leaderless replicas converged</h3>
<p><strong>Hinted handoff.</strong> If one of a key's N home replicas is down, a stand-in keeps the write with a "hint": "this belongs to node C", and delivers it when C returns. Hints are kept for a bounded window (a few hours by default in Cassandra); a node out longer needs full repair. Where the hint lives, and whether it counts, differs by system:</p>
<ul>
  <li><strong>Dynamo and Riak (sloppy quorum):</strong> the write goes to the first N <em>healthy</em> nodes on the key's preference list, so a fallback node further round the ring stands in, and its ack counts toward W. Writes stay available during a partition, which was the shopping-cart goal. The cost: the W nodes and the next R home nodes may not overlap, so a read can miss an acknowledged write until hints are delivered. It is a durability guarantee ("W nodes have it somewhere"), not a read guarantee. Riak's PW/PR settings demand primary (home) replicas, i.e. a strict quorum.</li>
  <li><strong>Cassandra (strict quorum):</strong> the coordinator stores the hint itself, and hints do <em>not</em> count toward the consistency level, except at CL=ANY. If fewer home replicas than the CL needs are up, the write fails fast with UnavailableException. Hints only speed up convergence.</li>
</ul>
<p><strong>Read repair.</strong> During a read, if the coordinator sees replicas with older versions, it writes the newest version back to them. Cheap, but only repairs keys that are read. In Cassandra, <em>blocking</em> read repair on QUORUM reads (the stale replicas are fixed before the read returns) is what makes quorum reads monotonic; the old probabilistic background read repair (read_repair_chance) was removed in 4.0.</p>
<p><strong>Anti-entropy with Merkle trees.</strong> For data nobody reads, a background process compares replicas. Comparing every key over the network is too expensive, so each replica builds a Merkle tree over its key range: leaves are hashes of small key ranges, each parent is the hash of its children.</p>
<div class="diagram"><pre>
        replica A                         replica B
          [root ab12]                       [root ab99]   differ
          /        \\                        /        \\
     [h 7f01]    [h 33c2]              [h 7f01]    [h 9e40]
      same ✓      /    \\                same ✓      /    \\
             [h 11]  [h 52]                    [h 11]  [h 6d]
              same    DIFF ◄── only this range's keys are
                               streamed and reconciled
 Compare roots; descend only into subtrees whose hashes differ.
 One differing leaf: ~log(ranges) exchanges. Cost grows per leaf.
</pre></div>
<p>Cassandra runs this as <code>nodetool repair</code> (operators schedule it, often with Reaper, within the tombstone grace period so deleted data does not come back). Riak runs it continuously. Building trees is CPU and I/O heavy, so it is throttled and run per range. In practice Cassandra builds the <em>whole</em> tree on each replica and ships it to the repair coordinator, and the "log" cost only holds for a single difference: it grows with every differing leaf. Trees have fixed depth, so one differing row streams its entire leaf range (<strong>overstreaming</strong>).</p>

<h3>8. Versions: deciding which value is newest</h3>
<p><strong>Timestamps (LWW)</strong>, as in Cassandra's per-cell timestamps: a few ms of clock skew can make a later write lose, silently. <strong>Version vectors</strong> (Riak, Dynamo paper) tell "before", "after" or "concurrent", and keep concurrent values as siblings for the app to merge: more correct, more client work.</p>

<h3>9. Failover in single-leader systems</h3>
<ol>
  <li><strong>Detect:</strong> no heartbeat for a timeout (typically ~10-30 s). Too short and a GC pause or network blip triggers needless failovers; too long and you are down longer.</li>
  <li><strong>Choose:</strong> the replica with the most recent log position (ideally the synchronous one), agreed by a majority so only one choice is made. Tools: Patroni (Postgres, stores the leader key in etcd/Consul/ZooKeeper), Orchestrator (MySQL), MongoDB and Redis Sentinel run their own elections, Raft-based systems elect natively.</li>
  <li><strong>Reconfigure:</strong> move the write endpoint (DNS, VIP, proxy like PgBouncer/HAProxy/ProxySQL, or cluster-aware drivers), and make sure the old leader, if it returns, becomes a follower and does not keep accepting writes.</li>
</ol>
<p>Managed databases hide this but do not remove it: RDS Multi-AZ typically fails over in a minute or two (DNS flip to a synchronous standby). Clients must retry and reconnect.</p>
<p><strong>What goes wrong:</strong></p>
<ul>
  <li><strong>Lost writes:</strong> with async replication, the new leader lacks the old leader's last writes. When the old leader comes back, those writes are usually discarded, which breaks the "acked means durable" promise.</li>
  <li><strong>Reused IDs:</strong> the new leader hands out auto-increment IDs the old leader had already used. If anything outside the DB (a cache, another service, an email) stored those IDs, data now points at the wrong rows. A well-known GitHub incident (described in DDIA) leaked private data this way through Redis keys.</li>
  <li><strong>Split brain:</strong> both nodes believe they are the leader and accept writes, so data diverges and cannot be merged automatically.</li>
  <li><strong>Flapping:</strong> repeated failovers under load, each one causing a cold-cache leader that is slower, which looks like another failure.</li>
</ul>

<h3>10. Preventing split brain</h3>
<ul>
  <li><strong>Majority decides:</strong> leadership requires votes or a lease from a majority of a consensus group (3 or 5 nodes). A minority side of a partition cannot elect anyone. This is why you run 3 nodes, not 2, or add a witness/arbiter (MongoDB arbiter, a witness node in a third zone).</li>
  <li><strong>Leases:</strong> the leader holds a time-bounded lease and stops serving writes itself when it cannot renew. Depends on bounded clock drift and on the old leader checking its lease before every write.</li>
  <li><strong>Fencing tokens:</strong> each new leadership term gets a higher number; storage or downstream services reject writes with a lower number. This protects against a leader that paused (GC, VM freeze) and woke up still thinking it leads. Detail in <a href="#/topic/bsd-bb-consensus">Consensus</a>.</li>
  <li><strong>Who enforces it for a DB primary:</strong> in Raft, followers reject messages from an old term, and an old leader cannot commit anything without a majority. Patroni demotes the primary when it cannot renew its leader key in etcd, and a watchdog (softdog) reboots the node if Patroni itself hangs. A <em>synchronous</em> old primary blocks on its own, because its standby now follows the new leader; an <em>async</em> old primary keeps accepting local writes until it is fenced at the proxy or by STONITH.</li>
  <li><strong>STONITH</strong> ("shoot the other node in the head"): power off or network-isolate the old leader before promoting. Blunt and effective, but implement carefully or both nodes shoot each other.</li>
</ul>

<div class="callout note"><div class="callout-title">Raft is single-leader replication done carefully</div>
<p>Raft (etcd, Consul, CockroachDB ranges, TiKV, Kafka KRaft metadata) is a single-leader replicated log where a write commits after a majority persists it, and elections use terms so only one leader per term exists. It is exactly "quorum commit + majority-elected failover + fencing by term number", built in rather than bolted on. That is why consensus-replicated databases can give linearizable reads (via ReadIndex or leader leases; e.g. Consul's default mode can be briefly stale) and survive failover without lost writes, at the cost of a majority round trip per write.</p></div>

` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: A booking platform on Postgres with read replicas</h3>
<p><strong>Setup:</strong> a meeting-room booking platform on a single Postgres primary with two replicas in other zones, behind PgBouncer. Tens of writes per second, a few hundred reads per second at the 9 am peak. By the <a href="#/topic/bsd-estimation">numbers</a>, one primary has 100× headroom for writes, so replication here is for <strong>availability and durability</strong>, with read scale as a bonus.</p>
<p><strong>Decisions:</strong></p>
<ul>
  <li>Replica 1 is synchronous (<code>synchronous_standby_names = 'ANY 1 (r1, r2)'</code>), so a confirmed booking is on two machines before the user sees "Booked". The ~1 ms cross-zone cost is invisible next to the app's latency.</li>
  <li>Availability search ("which rooms are free at 3 pm?") reads from replicas. Booking itself (check + insert with an exclusion constraint or row lock) and the "My bookings" page after a booking go to the <strong>primary</strong>: the user just wrote and must see it.</li>
  <li>The replica-served availability grid can be a few hundred ms stale, which is acceptable because the booking write re-checks on the primary. Stale reads are fine for <em>suggestions</em>; the <em>decision</em> happens on the leader.</li>
  <li>Failover via Patroni with an etcd leader key; app connects through a proxy endpoint that follows the leader.</li>
</ul>

<h3>Example 2: Shopping cart in a leaderless store (the Dynamo story)</h3>
<p>Dynamo's goal: "add to cart" must <em>never</em> fail, even in a partition. So N = 3, W = 2, R = 2 with sloppy quorums; concurrent cart versions are detected by vector clocks and merged by <strong>union</strong>, so a deleted item can reappear. Amazon accepted that; today you would use an OR-set CRDT.</p>

<h3>Example 3: Cassandra for a high-volume event store across two regions</h3>
<p>RF 3 per DC, two DCs, reads and writes at <code>LOCAL_QUORUM</code> (2 of 3 local, so R + W = 4 &gt; 3 within a DC, no ocean crossing); cross-DC is async; repair runs within <code>gc_grace_seconds</code>. The other region may read slightly stale data: fine for analytics, not for a balance.</p>

<h3>Example 4: Multi-region writes, the honest way</h3>
<p>A global SaaS wants low-latency writes in the US, EU and India. Instead of true multi-leader on every row, assign each tenant a <strong>home region</strong>; all writes for that tenant go to its home leader, and other regions hold async read replicas. Writes from a traveller cost one cross-region round trip (~100-250 ms) but there are no conflicts and no merge code. This is how most "active-active" systems actually work (and how data-residency rules are usually met too). True multi-leader is reserved for data that merges naturally: presence, counters as CRDTs, user preferences with LWW.</p>

<h3>Example 5: Kafka as replicated log</h3>
<p>With RF = 3, <code>acks=all</code> and <code>min.insync.replicas=2</code>, an acked message is on at least two brokers; if two brokers die, producers get errors instead of writing to one copy (consistency over availability). <code>unclean.leader.election.enable=true</code> flips that: an out-of-sync replica may lead and acked messages are lost. See <a href="#/topic/be-kafka">Kafka</a>.</p>

<h3>Example 6 (FDE): "Customers say their changes disappear for a few seconds"</h3>
<p><strong>Report:</strong> a customer's admins update a room's capacity, the page reloads, and the old value shows; a minute later it is correct. It happens more at 9 am.</p>
<p><strong>Diagnosis path:</strong></p>
<ol>
  <li>Reproduce: write, then read immediately. Check which endpoint served the read. In the ORM, "reads go to replica" was enabled globally last sprint.</li>
  <li>Measure lag: on the primary, <code>pg_stat_replication</code> shows <code>replay_lag</code>; at 9 am a bulk calendar sync job runs large transactions, and lag jumps from ~50 ms to ~5-20 s.</li>
  <li>Root cause: read-your-writes violation, made visible by a lag spike.</li>
</ol>
<p><strong>Fix, in order of effort:</strong> route the admin's reads to the primary for a short window after a write (session flag); then carry the commit LSN in the session and read from a replica only if <code>pg_last_wal_replay_lsn() &gt;= token</code>, otherwise the primary; batch the sync job into smaller transactions so lag stays low; alert on replica lag above a threshold and pull lagging replicas out of the read pool. Explain to the customer that it is a stale read, not data loss, and that nothing was overwritten.</p>

<h3>Example 7 (FDE): "After last night's failover, some orders are missing and two orders share an ID"</h3>
<p>Questions to ask: was replication async? What was the replica lag at the moment of failover (metrics)? Did the old primary come back and get rewound (<code>pg_rewind</code>) or re-cloned? Where else were order IDs stored (cache, emails, payment provider metadata)?</p>
<p>Likely story: the async replica was a couple of seconds behind; the last orders committed on the old primary never reached it and were discarded on rejoin; the new primary's sequence handed out the same IDs to new orders, so external systems that saw the old IDs now point at different orders. Remedies: recover the lost transactions from the old primary's WAL (if kept) or from the payment provider's records; move to a synchronous standby (or quorum commit) for the orders database; use non-reusable IDs (UUIDv7/Snowflake) so external references cannot collide; make the external effects idempotent and keyed by a business key. See <a href="#/topic/be-resilience">Resilience</a> for the retry side.</p>

<h3>When would you pick which?</h3>
<table>
  <thead><tr><th>Situation</th><th>Pick</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Transactions, constraints, money, inventory, bookings</td><td>Single-leader, 1 sync standby (or Raft-based DB)</td><td>No conflicts; no lost acked writes on failover</td></tr>
    <tr><td>Read-heavy app, writes fit one primary</td><td>Single-leader + async read replicas + read-your-writes routing</td><td>Cheapest read scale</td></tr>
    <tr><td>Global users, writes must be local, data partitions by user/tenant</td><td>Home-region single leader per tenant</td><td>Local writes for most users without conflicts</td></tr>
    <tr><td>Offline-first mobile, collaborative editing</td><td>Multi-leader with CRDTs / OT</td><td>Each device is a leader while offline</td></tr>
    <tr><td>Huge write volume, always-writable, eventual OK (events, metrics, feeds)</td><td>Leaderless (Cassandra/ScyllaDB), tunable quorums</td><td>No failover pause, writes scale horizontally, good tail latency</td></tr>
    <tr><td>Cluster metadata, locks, config, leader election</td><td>Consensus (etcd/ZooKeeper/Consul)</td><td>Linearizable, small data, majority quorum</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Lag is unbounded</h3>
<p>"Replicas are usually 50 ms behind" is true until a large migration, a long transaction, a vacuum conflict, a replica running a heavy report, or a network hiccup. Then it is minutes. Any correctness argument that depends on lag being small is wrong. Bound it operationally (alert, remove lagging replicas from the read pool) and design reads that do not depend on it.</p>

<h3>Dead replica fills the primary's disk</h3>
<p>Postgres replication slots (and Kafka retention, MySQL binlog retention) keep the log until every consumer has read it. A replica that dies or a forgotten logical slot (an old CDC connector) makes the primary retain WAL until its disk fills and the primary stops. Cap it (<code>max_slot_wal_keep_size</code>) and alert on retained WAL.</p>

<h3>Partially failed quorum writes are not rolled back</h3>
<p>W = 2 of 3, but only one replica acked before the timeout. The client sees an error, yet one replica has the new value. Later reads may or may not return it, depending on which replicas answer, and read repair may spread it. "Error" in a leaderless store means "unknown", not "did not happen". Make writes idempotent and retry.</p>

<h3>Sloppy quorum reads miss acknowledged writes</h3>
<p>In Dynamo-style stores, W acks may have landed on fallback nodes during a partition, and a read from the home replicas misses the write until hints are handed off. If the business logic needs "acked then readable", use strict quorums (Riak PW/PR; Cassandra is already strict) or a strongly consistent store.</p>

<h3>Deletes coming back (zombie data)</h3>
<p>In leaderless stores, a delete is a tombstone. If a replica was down longer than the tombstone grace period and repair did not run, the old value on that replica looks "newer than nothing" after tombstones are purged and gets repaired back everywhere. Rule: run full repair more often than <code>gc_grace_seconds</code>.</p>

<h3>Cross-region failover is a business decision</h3>
<p>Promoting an async replica in another region loses its lag worth of writes, and automating it risks split brain across an ocean. Many teams keep it manual, with a stated RPO.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Global "reads go to replicas" switch</h3>
<p>An ORM-wide "SELECTs go to replicas" breaks read-your-writes, uniqueness checks and read-modify-write logic. Route per query: lists to replicas, anything feeding a write decision to the leader.</p>

<h3>Check on the replica, write on the leader</h3>
<p>"SELECT seats_left from replica; if &gt; 0, INSERT booking on primary" oversells. The check and the write must happen in the same transaction on the leader (row lock, conditional update, constraint). See <a href="#/topic/be-databases">Databases</a> and <a href="#/topic/bsd-bb-transactions">Transactions</a>.</p>

<h3>Treating R + W &gt; N as linearizable</h3>
<p>With concurrent writes and LWW, with sloppy quorums, with a write that partially failed, or with a replica restored from an old backup, a quorum read can return an old value or two readers can see values in different orders. If you need linearizability (unique usernames, locks, balances), use a consensus-based store or a single leader.</p>

<h3>Two-node "HA" with automatic failover</h3>
<p>With two nodes there is no majority after a network split: either both promote (split brain) or neither does. Use three nodes, or two data nodes plus a witness in a third failure domain.</p>

<h3>Failover without fencing</h3>
<p>Promoting the replica and updating DNS, while the old primary is still alive behind a cached DNS entry or long-lived connection pool, gives you two writable primaries. Fence the old one (revoke its lease, block it at the proxy, shut it down) <em>before</em> sending traffic to the new one.</p>

<h3>LWW with client clocks</h3>
<p>A phone with its clock set to next year wins every conflict forever. Use server timestamps, HLCs or version vectors.</p>

<h3>Replicas as backups</h3>
<p>A replica replicates <code>DROP TABLE</code> within milliseconds. Replication protects against machine loss, not mistakes: keep tested point-in-time recovery backups (WAL archived to object storage), or a delayed replica as a middle ground.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<p>Ordered as a tough interviewer would chain them.</p>

<div class="qa-block"><div class="qa-question">1. Why replicate a database at all, and what do you give up?</div><div class="qa-answer">
<p>"Four separate reasons: availability when a node or zone dies, durability of acked writes, read scale, and keeping data close to users. I say which one I'm buying because they conflict: durability wants synchronous copies, read scale and latency want asynchronous ones. What I give up is simplicity: as soon as there are two copies, I have to answer what a reader sees while they differ, and what happens to writes in flight when the leader dies. Replication does <em>not</em> scale writes in a single-leader system; for that I partition."</p>
</div></div>

<div class="qa-block"><div class="qa-question">2. Synchronous or asynchronous replication? What exactly do you lose with each?</div><div class="qa-answer">
<p>"With async, the leader acks once it has the write locally, so if it crashes, everything not yet shipped is lost on failover: usually milliseconds, but it's whatever the lag was at that moment, which can be seconds. That window is my RPO. With fully synchronous, nothing is lost, but every write waits for the slowest follower, and any follower outage blocks writes. So the usual middle is one synchronous standby out of several, or quorum commit: Postgres <code>ANY 1 (s1, s2)</code>, MySQL lossless semi-sync, Kafka <code>acks=all</code> with <code>min.insync.replicas=2</code>, MongoDB <code>w: majority</code>. The commit lives on two machines in different zones, I pay ~1 ms, and one slow replica doesn't hurt. For a payments or bookings DB I'd do that; for a clickstream I'd stay async."</p>
</div></div>

<div class="qa-block"><div class="qa-question">3. A user updates their profile, the page reloads, and the old value appears. Why, and how do you fix it?</div><div class="qa-answer">
<p>"The write went to the leader and the reload read from an async replica that hadn't applied it: a read-your-writes violation. Options, simplest first: (a) read anything the user can edit from the leader; (b) read from the leader for ~N seconds after that user's last write, using a timestamp in the session; (c) return the commit's log position (LSN) with the write, store it in the session, and only read from a replica whose replayed position is at least that, otherwise the leader. (c) is the precise one and is what MongoDB causal sessions and Cosmos DB session tokens do. If the user has multiple devices, the token must live server-side per user, not in a cookie."</p>
</div></div>

<div class="qa-block"><div class="qa-question">4. Your fix sends lots of reads to the leader and it's getting hot. Now what?</div><div class="qa-answer">
<p>"Narrow what goes to the leader: only the user's own recent writes need it. The LSN-token approach hits the leader only when no replica has caught up, which is rare at normal lag. I'd also cut lag: split huge batch transactions, keep analytics off the read pool, pull lagging replicas from rotation. If the leader is still hot, that's a write-capacity problem, which means caching (see <a href="#/topic/be-caching">Caching</a>) for read paths and eventually partitioning."</p>
</div></div>

<div class="qa-block"><div class="qa-question">5. What are monotonic reads and consistent prefix reads? Give an example of each breaking.</div><div class="qa-answer">
<p>"Monotonic reads: one user's view never goes back in time. It breaks when request 1 hits a caught-up replica and shows a new comment, and request 2 hits a lagging one and the comment disappears. Fix: pin a user to one replica by hashing user_id, or carry the highest position seen and skip replicas behind it. Consistent prefix: if write B depends on A, nobody sees B without A. It breaks in partitioned systems when the question lives on partition 2 and the answer on partition 7, and partition 7 replicates first. Fix: put causally related writes in the same partition, e.g. partition by conversation_id, or track causal dependencies."</p>
</div></div>

<div class="qa-block"><div class="qa-question">6. Explain R + W &gt; N. With N = 3, how would you set R and W for a read-heavy and a write-heavy workload?</div><div class="qa-answer">
<p>"Each key has N replicas. A write is successful after W acks, a read asks R replicas and takes the newest version. If R + W &gt; N, any read set and any write set share at least one replica, so the read sees the latest acked write, under ideal conditions. Balanced: W = 2, R = 2, tolerating one node down for both. Read-heavy: W = 3, R = 1 gives the cheapest reads but one dead node blocks writes, so in practice I'd still use 2/2 and rely on R being the 2nd-fastest response. Write-heavy ingestion: W = 1, R = 3, or W = 1, R = 1 if eventual is acceptable. Latency is the W-th or R-th fastest reply, so one slow node doesn't hurt a quorum."</p>
</div></div>

<div class="qa-block"><div class="qa-question">7. So with R + W &gt; N, is the system linearizable?</div><div class="qa-answer">
<p>"No. Overlap only guarantees that <em>some</em> replica in the read set has the latest <em>completed</em> write. It breaks in several ways: two concurrent writes resolved by last-write-wins, where clock skew lets the earlier one win and one is silently dropped; a write that reached fewer than W replicas, failed to the client, but isn't rolled back, so some reads see it and some don't; a read concurrent with a write, where reader 1 sees the new value and a later reader 2 sees the old one; sloppy quorums (Dynamo, Riak), where W acks came from non-home nodes; and a replica restored from an old backup. You can get linearizable reads and writes of a single register with synchronous read repair before returning (the ABD algorithm), but not compare-and-set. For uniqueness, locks or balances I'd use a consensus-based store or single leader."</p>
</div></div>

<div class="qa-block"><div class="qa-question">8. A home replica is down during a write. What do sloppy quorums and hinted handoff do, and what does that cost?</div><div class="qa-answer">
<p>"It depends on the system, and the difference matters. In Dynamo and Riak, the write goes to the first N healthy nodes on the key's preference list, so a fallback node holds the down node's copy with a hint and its ack counts toward W. That's a sloppy quorum: writes stay available during a partition, which is what the shopping cart wanted, but the W nodes may be outside the key's home nodes, so a later R-read from home replicas can miss the write until the hint is delivered. Durability guarantee, not a read guarantee; Riak's PW/PR make it strict. Cassandra is different: the coordinator keeps the hint, hints don't count toward the consistency level except at CL=ANY, so QUORUM is a strict quorum and fails with UnavailableException if too few home replicas are up. In both, hints are kept only for a window (a few hours by default in Cassandra); a node out longer needs a full repair."</p>
</div></div>

<div class="qa-block"><div class="qa-question">9. Read repair only fixes keys that are read. How do replicas converge for cold data? How does a Merkle tree make that cheap?</div><div class="qa-answer">
<p>"Anti-entropy: a background process compares replicas pairwise. Sending every key is too expensive, so each replica builds a Merkle tree per token range: leaves hash small key ranges, parents hash their children. Two replicas compare roots; if equal, they're in sync and we're done with one hash exchange. If not, they descend only into child subtrees whose hashes differ, so with one difference it's about log(number of ranges) comparisons, growing with each differing leaf. Costs: building trees is CPU and disk heavy, so it's throttled; Cassandra actually builds whole trees and ships them to the repair coordinator, and because leaves are fixed-size ranges, one bad row streams its whole leaf range (overstreaming). In Cassandra it's <code>nodetool repair</code>, and it must complete within <code>gc_grace_seconds</code>, otherwise a replica that missed a delete can resurrect the data after tombstones are purged."</p>
</div></div>

<div class="qa-block"><div class="qa-question">10. You go multi-leader across two regions and the same booking is edited in both. How do you resolve it, and why is last-write-wins risky?</div><div class="qa-answer">
<p>"First I'd try to avoid it: give each booking or tenant a home region and send all its writes there, which makes it single-leader per record with local writes for most users. If true concurrent edits are allowed: LWW keeps the highest timestamp and silently discards the other, and with clock skew the 'later' one may actually be earlier, so it's only OK for presence, last-seen or caches. Better: detect concurrency with version vectors and keep siblings for the app to merge, or model the data as CRDTs (counters, OR-sets) that merge deterministically. For bookings specifically, a double booking can't be 'merged', so the booking's resource must have a single home leader; multi-leader is the wrong tool. Also: unique constraints and auto-increment IDs don't work across leaders, so use globally unique IDs."</p>
</div></div>

<div class="qa-block"><div class="qa-question">11. The primary dies. Walk me through failover, and tell me what can go wrong.</div><div class="qa-answer">
<p>"Detect: missed heartbeats for ~10-30 s; shorter causes false failovers on GC pauses. Choose: the most up-to-date replica, ideally the synchronous standby, picked by a majority so only one choice is made: Patroni with an etcd lock, MongoDB's election, Raft. Reconfigure: move the write endpoint (proxy, VIP or DNS), and fence the old primary. What goes wrong: with async replication the new leader lacks the last writes, and when the old one rejoins those are discarded; the new leader can reissue auto-increment IDs already seen by caches or other services; the old primary may still be accepting writes through cached DNS or pooled connections, which is split brain; and repeated failovers under load flap the cluster. Clients need retries with idempotency keys because in-flight transactions get errors with unknown outcome."</p>
</div></div>

<div class="qa-block"><div class="qa-question">12. How do you guarantee there is never more than one leader, even if the old one is just paused, not dead?</div><div class="qa-answer">
<p>"You can't guarantee the old process knows it's been replaced, so you make it harmless. Leadership comes from a majority: a lease or vote in a 3- or 5-node consensus group, so a minority partition can't elect. The leader stops serving when it can't renew its lease, but a paused process can wake up after its lease expired without noticing, so every write also carries a <strong>fencing token</strong>: a term or epoch number that increases with each election, and storage rejects any write with an older token. Raft's term number is exactly this: followers reject an old term, and an old leader can't commit without a majority. For Postgres with Patroni, the primary demotes itself when it can't renew its leader key, and a softdog watchdog reboots the node if Patroni hangs. A synchronous old primary blocks anyway, because its standby now follows the new leader; an async one keeps taking local writes until it's fenced at the proxy. The blunt alternative is STONITH: cut the old node's power or network before promoting. And never run a two-node cluster with automatic failover; add a witness in a third zone. Details in <a href="#/topic/bsd-bb-consensus">Consensus</a>."</p>
</div></div>

<div class="qa-block"><div class="qa-question">13. (FDE) A customer reports: after a failover last night, some orders are missing and two different orders share an ID. Diagnose it and tell them what you'd change.</div><div class="qa-answer">
<p>"I'd check whether replication was async and what the replica lag was at failover time. The likely story: the promoted replica was a few seconds behind, so the last orders on the old primary never made it and were discarded when it rejoined. The new primary's sequence then handed out the same IDs again, and systems outside the DB (emails, the payment provider, a cache) still reference the old ones, so two orders appear to share an ID. Recovery: extract the lost transactions from the old primary's WAL or data directory before it's re-cloned, cross-check with the payment provider's records, and reconcile. Prevention: a synchronous standby or quorum commit for the orders DB so acked orders can't be lost; non-reusable IDs like UUIDv7 or Snowflake so external references never collide; idempotency keys on order creation; and a failover runbook that fences the old primary and records the lag at promotion. I'd tell the customer the exact window and the count of affected orders, not 'some'."</p>
</div></div>

<div class="qa-block"><div class="qa-question">14. Pull it together: when would you pick single-leader, multi-leader or leaderless? Design replication for a multi-region ticket-booking product.</div><div class="qa-answer">
<p>"Single-leader by default, whenever I need transactions, constraints or 'exactly one winner': money, inventory, seats. Multi-leader when writes must be local in several places and the data merges naturally: offline-first apps, collaborative editing with CRDTs, presence. Leaderless when write volume is huge and the system must always accept writes, with eventual reads acceptable: events, metrics, feeds. For ticket booking: each event's inventory has one home region and one leader, with a synchronous standby in another zone, so a seat can't be sold twice and an acked booking can't be lost. Seat maps and event pages are served from async replicas and the CDN, a little stale, with the final seat claim re-checked on the leader. Other regions get async read replicas; buyers far from the home region pay one cross-region round trip at checkout, which is acceptable for a purchase. Analytics and clickstream go to a leaderless or log-based store. Cross-region failover of the home leader is manual, with a stated RPO, because automatic failover across an ocean risks split brain and lost bookings."</p>
</div></div>
` }

  ]
});
