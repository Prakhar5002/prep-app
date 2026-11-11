window.PREP_SITE.registerTopic({
  id: "bsd-bb-transactions",
  module: 'backend-sd',
  title: "Distributed Transactions, Time & IDs",
  estimatedReadTime: "50 min",
  tags: ["system-design","distributed-systems","2pc","saga","outbox","clocks","lamport","vector-clocks","hlc","truetime","snowflake","uuidv7","ulid","idempotency","exactly-once","interview"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>Once one business action touches two machines, you lose the free atomicity, the free ordering and the free unique IDs that one database gave you; you buy them back with 2PC (atomic but blocking), sagas plus outbox (available but not isolated), logical or hybrid clocks (order without trusting wall time), and Snowflake/UUIDv7-style IDs (unique and roughly time-sortable without coordination), and you get "exactly once" only as at-least-once delivery plus idempotent processing.</strong></div>
  <h4>Key points</h4>
  <ul>
    <li><strong>2PC:</strong> coordinator asks every participant to <em>prepare</em> (make the change durable, hold locks, vote yes or no), then tells all to commit or all to abort. Atomic. <strong>Blocking:</strong> a participant that voted yes and then loses the coordinator <em>before learning the decision</em> can neither commit nor abort; it holds its locks until the coordinator comes back.</li>
    <li><strong>Making 2PC survivable:</strong> replicate the coordinator's decision with consensus (Spanner's Paxos groups, Kafka's replicated transaction log). Then a crashed coordinator is replaced, not waited for. 3PC does not fix it in real networks: it assumes bounded delays.</li>
    <li><strong>Saga:</strong> a chain of local transactions, each with a compensating action. Always available, never blocks, but <strong>no isolation</strong>: other requests see the half-done state. Design around it with pending states and semantic locks. Details: <a href="#/topic/be-queues">Queues &amp; Streaming</a>.</li>
    <li><strong>Outbox:</strong> write the business row and the event row in <em>one</em> local transaction; a relay publishes the event later. Removes the dual-write bug; publishing becomes at-least-once, so consumers must be idempotent.</li>
    <li><strong>Wall clocks lie:</strong> they drift (tens of ppm, i.e. seconds per day unsynced), get stepped backward by NTP, freeze during VM pauses. NTP keeps servers within roughly sub-ms to tens of ms, not zero. Never decide "which happened first" across machines with raw timestamps.</li>
    <li><strong>Lamport clock:</strong> counter, max(mine, received) + 1. If a happened-before b then L(a) &lt; L(b); the converse is <em>not</em> true, so it cannot detect concurrency. Gives a total order (break ties by node id).</li>
    <li><strong>Vector clock:</strong> one counter per node. Can tell "before", "after" or "concurrent". Cost: size grows with the number of writers.</li>
    <li><strong>HLC:</strong> physical time plus a logical counter. Respects causality like Lamport, stays within the clock-skew bound of real time, can pack into 64 bits. CockroachDB, YugabyteDB and MongoDB's cluster time use it.</li>
    <li><strong>TrueTime (Spanner):</strong> the clock returns an interval [earliest, latest]; a commit waits out the uncertainty before becoming visible. That buys external consistency at the cost of a few ms per write.</li>
    <li><strong>IDs:</strong> Snowflake = 41-bit ms timestamp + 10-bit worker + 12-bit sequence in a 64-bit int (~69 years, 1,024 workers, 4,096 IDs per ms per worker). UUIDv7 (RFC 9562) and ULID = 48-bit ms timestamp + randomness in 128 bits. All are only <em>roughly</em> time-ordered across machines. UUIDv4 is random and hurts B-tree inserts.</li>
    <li><strong>Exactly-once</strong> delivery is impossible over an unreliable network; exactly-once <em>effect</em> = at-least-once delivery + idempotent processing (a dedupe key checked in the same transaction as the effect).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Saying "I'll use a distributed transaction" or "Kafka gives exactly-once" and stopping. The follow-ups are: "the coordinator dies after everyone voted yes: what holds the locks, and for how long?" and "the consumer charges the card and crashes before committing the offset: what stops a second charge?" Kafka's exactly-once covers read-process-write <em>inside Kafka</em>; any external side effect still needs an idempotency key.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I'd first try to keep the invariant inside one database transaction, by choosing the partition key so the rows live together. Only if it must cross services do I pick a saga with an outbox, and I'll name the compensation for each step."</div>
  <div class="revision-say">"I won't order events by wall-clock timestamps from different machines. Inside a partition I use the log offset; across nodes I use an HLC or a version vector, depending on whether I need to detect concurrent writes."</div>
  <div class="revision-say">"Delivery is at-least-once. Every consumer stores a dedupe key in the same transaction as its effect, so a redelivery is a no-op. That's what 'exactly once' really means."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What one database quietly gave you</h3>
<p>On a single Postgres primary, three things are free and you rarely think about them:</p>
<ul>
  <li><strong>Atomicity across rows:</strong> <code>BEGIN; debit A; credit B; COMMIT;</code> either both happen or neither does. (ACID and isolation levels: <a href="#/topic/be-databases">Databases</a>.)</li>
  <li><strong>One clock, one log:</strong> the WAL is one sequence and one clock stamps every row, so there is no skew. Careful though: even here <code>created_at</code> (<code>now()</code> = transaction <em>start</em>) and <code>bigserial</code> (assigned at insert) are not commit order; a transaction that takes id 41 and commits after id 42 is skipped by any "id &gt; last_seen" cursor.</li>
  <li><strong>Unique IDs:</strong> a sequence (<code>bigserial</code>, <code>AUTO_INCREMENT</code>) hands out 1, 2, 3 with no collisions, because one process owns the counter.</li>
</ul>
<p>Split the data over shards, services or regions and all three disappear at once. This topic is about buying each one back, and about knowing exactly what each purchase costs.</p>

<h3>Why it is hard: three facts you can't engineer away</h3>
<ol>
  <li><strong>You can't tell slow from dead.</strong> A participant that hasn't answered may have crashed, may be paused in GC, or may have answered into a dropped packet. Every atomic-commit protocol has to decide what to do in that silence.</li>
  <li><strong>There is no shared "now".</strong> Each machine has its own quartz clock that drifts and is corrected in jumps. Two events 1 ms apart on different machines can carry timestamps in the wrong order.</li>
  <li><strong>Messages are lost and duplicated.</strong> A sender that got no ack must retry, and a retry of a message that <em>did</em> arrive is a duplicate. So "deliver exactly once" isn't achievable; "apply exactly once" is.</li>
</ol>

<h3>The four tools</h3>
<p>Atomic change across services: 2PC or saga + outbox. Ordering: Lamport, vector clocks, HLC, TrueTime. Coordination-free IDs: Snowflake, UUIDv7, ULID. No double effects: idempotency keys. Each has a price, compared in the tables under Examples.</p>

<h3>Where this shows up in interviews</h3>
<p>Payments, orders and bookings (saga vs 2PC, compensations, the idempotency key on the charge); chat, feeds and audit logs (ordering without <code>created_at</code>); any sharded table (how IDs are minted, and what they leak); any queue (the consumer crashed after the work but before the ack).</p>

<div class="callout insight">The best distributed transaction is the one you design away. Before reaching for 2PC or a saga, ask whether a better partition key puts every row the invariant touches on one shard (see <a href="#/topic/bsd-bb-partitioning">Partitioning</a>). "All of a user's wallet entries live on the user's shard" turns a distributed transfer between two of that user's sub-accounts into a local one.</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Atomic commit = a group vote with one irreversible decision</h3>
<p>Think of 2PC as a wedding. The officiant (coordinator) asks each partner "do you?" (prepare). Once someone says "I do" (votes yes), they have given up the right to walk away on their own: they must wait for the officiant to pronounce the result. If the officiant faints right then, both partners stand at the altar, unable to leave and unable to marry, until the officiant wakes up. That's the blocking problem in one picture: <strong>a yes vote surrenders your autonomy until you hear the decision.</strong></p>

<p>A saga is the opposite: each partner signs their own paperwork immediately (local commit), and if a later step fails, they file a divorce (compensation). Nobody waits, but for a while the world sees a half-married state.</p>

<div class="diagram"><pre>
 2PC, happy path and the blocking window

 Coordinator          Participant A           Participant B
     |---- PREPARE -------&gt;|                        |
     |---- PREPARE ---------------------------------&gt;|
     |                     | write redo + lock rows |
     |&lt;--- YES ------------|                        | write + lock
     |&lt;--- YES -------------------------------------|
     | log COMMIT (durable)  &lt;-- the decision point |
     |---- COMMIT --------&gt;|                        |
     |      X crash here: B voted YES, never hears; |
     |        (B blocks only if it can't reach A)   |
     |                     | commits, unlocks       | IN DOUBT:
     |                     |                        | locks held,
     |                     |                        | can't commit,
     |                     |                        | can't abort
     | (recovers, reads log, resends COMMIT) ------&gt;| commits
</pre></div>

<h3>Time = three different things people call "a timestamp"</h3>
<ul>
  <li><strong>Wall-clock (time-of-day):</strong> "it's 10:02:03.120 UTC". Comparable with humans, wrong by an unknown amount, can jump backward.</li>
  <li><strong>Monotonic clock:</strong> "312,004 ms since this process booted". Never goes backward, perfect for timeouts and durations on one machine, meaningless on another machine.</li>
  <li><strong>Logical clock:</strong> "event #47 in causal order". No relation to real time, but never contradicts cause and effect.</li>
</ul>
<p>HLC and TrueTime are attempts to get the human-readable value of the first with the safety of the third.</p>

<h3>Happened-before, the one relation that matters</h3>
<p>Lamport's definition: a <strong>happened-before</strong> b (a → b) if they are on the same process and a came first, or a is the send of a message and b its receipt, or there is a chain of those. If neither a → b nor b → a, the events are <strong>concurrent</strong>: no information could have flowed between them, so neither can have caused the other. Ordering by causality is what users actually expect ("the reply must appear after the question"). Ordering concurrent events is a choice you make, not a fact you discover.</p>

<div class="diagram"><pre>
 Vector clocks across three nodes   [A, B, C]

 A: (1,0,0) set x=1 ---msg---+
                             v
 B:                     (1,1,0) recv ---- (1,2,0) set x=2
                                                  |
 C: (0,0,1) set x=3                               |
                                                  v
 C:                                       (1,2,2) recv

 (1,0,0) &lt; (1,2,0)  every entry &lt;=, one &lt;  =&gt; A's write
                                              came BEFORE
 (1,2,0) vs (0,0,1) neither dominates        =&gt; CONCURRENT
                                              keep both or merge
</pre></div>

<h3>IDs = time + place + counter</h3>
<p>Every coordination-free ID scheme is the same recipe: <em>when</em> (a timestamp, so IDs sort roughly by creation), <em>where</em> (a worker id or enough randomness that two places never pick the same value), and <em>which one this millisecond</em> (a sequence or more randomness). Snowflake spends 64 bits and uses explicit worker ids; UUIDv7 and ULID spend 128 bits and use randomness instead of worker ids, so nobody has to assign anything.</p>

<div class="diagram"><pre>
 Snowflake (64-bit signed int)
 +-+-----------------------------------------+----------+------------+
 |0| 41 bits: ms since custom epoch          | 10 bits  | 12 bits    |
 | |  2^41 ms = ~69.7 years                  | worker   | seq/ms     |
 +-+-----------------------------------------+----------+------------+
   sign bit unused     1,024 workers x 4,096 ids/ms = ~4M ids/s/worker

 UUIDv7 (128 bits, RFC 9562)
 +------------------------+-----+----------+--+----------------------+
 | 48 bits unix ms        | ver | 12 rand  |va| 62 bits rand         |
 +------------------------+-----+----------+--+----------------------+
                         74 random bits (some impls use 12 as counter)
</pre></div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Two-phase commit, step by step</h3>
<ol>
  <li><strong>Prepare.</strong> The coordinator sends PREPARE with the transaction id to every participant.</li>
  <li><strong>Vote.</strong> Each participant does all the work, writes it durably (redo log flushed), takes and keeps its locks, and replies YES. After a YES it has promised: "I can commit no matter what happens to me, even if I crash and restart." Or it replies NO and aborts locally.</li>
  <li><strong>Decide.</strong> If every vote is YES, the coordinator writes COMMIT to its own durable log. That write <em>is</em> the commit point. Any NO or a timeout before deciding means ABORT.</li>
  <li><strong>Complete.</strong> The coordinator sends the decision; participants apply it, release locks and ack. The coordinator retries until every participant acks, then forgets the transaction.</li>
  <li><strong>Presumed abort</strong> (XA and most DBMSs): no log record means abort, so aborts need no forced writes or acks. <strong>Presumed commit</strong> logs the transaction's start instead, so commits need no acks.</li>
</ol>
<p><strong>Cost:</strong> 2 round trips plus 2 durable log writes on the critical path (participants' prepare fsync, coordinator's decision fsync), and locks held for all of it. In one datacenter that's a few ms; across regions, two cross-region round trips (100+ ms) with rows locked the whole time. Throughput on hot rows collapses because lock hold time is now network-bound.</p>

<h4>Where it blocks, precisely</h4>
<ul>
  <li><strong>Participant crashes before voting:</strong> no problem. The coordinator times out and aborts.</li>
  <li><strong>Coordinator crashes before deciding:</strong> participants that voted YES are stuck: they don't know whether the coordinator wrote COMMIT before dying. They can ask each other; if any participant voted NO or never got PREPARE, everyone can abort safely. If all voted YES, nobody knows. <strong>This is the blocking case.</strong></li>
  <li><strong>Coordinator crashes after logging COMMIT:</strong> on recovery it reads its log and resends COMMIT. Participants were blocked until then.</li>
</ul>
<p>3PC adds a "pre-commit" phase so that a participant can decide by timeout. It is non-blocking only if you assume message delays are bounded; with a network partition, both sides of the split can time out into different decisions. That's why nobody ships 3PC.</p>

<h4>How real systems make 2PC tolerable</h4>
<ul>
  <li><strong>Replicate the coordinator.</strong> Spanner makes each participant a Paxos group and the coordinator one of those groups' leaders; the commit decision is Paxos-replicated, so a crashed coordinator machine is replaced by an election in seconds. CockroachDB stores a transaction record in a Raft-replicated range. Kafka's transaction coordinator writes to the replicated <code>__transaction_state</code> topic. The blocking problem becomes "wait for a leader election", not "wait for a human".</li>
  <li><strong>Percolator style</strong> (Google Percolator, TiDB): the decision lives in a "primary lock" on one row; committing = atomically flipping that one row. Anyone who finds a stale secondary lock checks the primary to resolve it. No separate coordinator to lose.</li>
  <li><strong>XA / Postgres PREPARE TRANSACTION:</strong> exists, works, and is risky: an orphaned prepared transaction holds its locks and pins the vacuum horizon until someone runs <code>COMMIT PREPARED</code> or <code>ROLLBACK PREPARED</code> by hand. Postgres ships with <code>max_prepared_transactions = 0</code>, which disables the feature until you turn it on.</li>
</ul>

<h3>2. Sagas and the outbox (linking, not re-teaching)</h3>
<p>The orchestration vs choreography choice, compensation code and a Temporal example are in <a href="#/topic/be-queues">Queues &amp; Streaming</a>; the architecture view is in <a href="#/topic/be-architecture">Architecture Patterns</a>; outbox to Kafka is in <a href="#/topic/be-kafka">Kafka Deep</a>. What a deep interviewer probes beyond the basics:</p>
<ul>
  <li><strong>Isolation is gone.</strong> Between step 1 and the compensation of step 1, other transactions can read and act on the intermediate state. The anomalies are the familiar ones: dirty reads (someone sees a reserved seat as sold), lost updates, and non-repeatable reads.</li>
  <li><strong>Countermeasures:</strong> a <em>semantic lock</em> (a status field like <code>PENDING</code> that other flows respect), <em>commutative updates</em> (increment/decrement, so order doesn't matter), <em>pessimistic ordering</em> (put the step most likely to fail first, and the irreversible step, like sending an email or capturing money, last), <em>re-read before act</em>.</li>
  <li><strong>Compensations must themselves be idempotent and must not fail permanently.</strong> "Refund" can be retried forever; if it can truly fail, you need a human queue.</li>
  <li><strong>Pivot transaction:</strong> the step after which the saga only goes forward (e.g. card captured). Steps before it are compensatable; steps after it must be retryable until they succeed.</li>
  <li><strong>Outbox relay:</strong> polling (<code>SELECT ... FOR UPDATE SKIP LOCKED</code> on unsent rows) or CDC from the WAL (Debezium). Either way a crash between "published" and "marked sent" republishes, so delivery is at-least-once. Don't poll with "id &gt; last_id": ids aren't commit order, so a late-committing row is skipped; select unsent rows instead, or use CDC. Several relays with SKIP LOCKED can also reorder one aggregate's events; when per-entity order matters, use one relay per partition/key or CDC.</li>
</ul>

<h3>3. Why wall clocks lie</h3>
<ul>
  <li><strong>Drift:</strong> a quartz oscillator is off by tens of ppm and varies with temperature. 50 ppm × 86,400 s/day ≈ 4.3 s per day if nothing corrects it.</li>
  <li><strong>NTP correction:</strong> small errors are <em>slewed</em> (clock sped up or slowed down), large ones are <em>stepped</em>, which can move the clock backward. A well-run datacenter keeps servers within roughly sub-ms to a few ms; over the public internet, tens of ms is normal. Under faults (NTP server unreachable, a bad upstream) it can be seconds or worse, and nothing alerts by default.</li>
  <li><strong>Pauses:</strong> a GC pause, VM live migration or a throttled container stops the process; when it resumes, the clock has moved but the code believes no time passed between two lines.</li>
  <li><strong>Leap seconds:</strong> caused real outages (2012 hit many Linux systems). Google and AWS smear the second over hours; mixing smeared and unsmeared sources means up to a second of disagreement.</li>
  <li><strong>Rules:</strong> use the monotonic clock (<code>CLOCK_MONOTONIC</code>, <code>System.nanoTime</code>, <code>process.hrtime</code>, <code>performance.now</code>) for timeouts and durations; use wall time only for display and coarse bucketing; never let correctness depend on two machines' wall clocks agreeing unless the system (like CockroachDB) explicitly bounds and monitors the offset.</li>
</ul>
<p><strong>Better cloud time:</strong> AWS Time Sync Service gives far tighter bounds than public NTP (microsecond range on supported instance types), and AWS's open-source ClockBound returns an error bound with each reading, in the spirit of TrueTime. Smaller uncertainty, never zero.</p>

<h3>4. Lamport clocks</h3>
<pre><code>on local event or send:  L = L + 1;  attach L to the message
on receive(msg):         L = max(L, msg.L) + 1</code></pre>
<ul>
  <li><strong>Guarantee:</strong> a → b implies L(a) &lt; L(b).</li>
  <li><strong>Not guaranteed:</strong> L(a) &lt; L(b) does <em>not</em> imply a → b. Two concurrent events get different numbers, and you can't tell they were concurrent.</li>
  <li><strong>Total order:</strong> sort by (L, nodeId). Every node agrees on this order, and it never puts an effect before its cause. Useful for deterministic tie-breaking and for replicated state machines that need one agreed order.</li>
</ul>

<h3>5. Vector clocks and version vectors</h3>
<pre><code>each node i keeps V[1..n]
on local event at i:   V[i] = V[i] + 1
on send:               attach V
on receive(W) at i:    V[k] = max(V[k], W[k]) for all k;  V[i] = V[i] + 1

V &lt;= W  iff  V[k] &lt;= W[k] for every k
V &lt; W   iff  V &lt;= W and V != W       (V happened before W)
neither V &lt;= W nor W &lt;= V            (concurrent)</code></pre>
<ul>
  <li><strong>What it buys:</strong> conflict detection. A replica that receives a write whose vector neither dominates nor is dominated by its own knows it has two concurrent versions and must keep both (siblings) or merge them.</li>
  <li><strong>Version vectors</strong> are the storage flavour: one counter per <em>replica</em> that accepts writes, attached to each key's value. Riak uses dotted version vectors; the 2007 Dynamo paper used vector clocks. See <a href="#/topic/bsd-bb-replication">Replication &amp; Quorums</a> for where they sit in leaderless stores.</li>
  <li><strong>Cost:</strong> O(number of writers) per value. With client ids as entries, vectors explode; Dynamo truncated old entries, which can produce false conflicts. Keep the entries to server replicas.</li>
  <li><strong>Merging siblings</strong> is the application's job, or a CRDT's (counters, OR-sets) if the data type merges deterministically.</li>
</ul>

<h3>6. Hybrid logical clocks (HLC)</h3>
<p>An HLC timestamp is a pair (l, c): <em>l</em> is the largest physical time this node has seen (its own or in a message), <em>c</em> is a counter that breaks ties when l doesn't advance.</p>
<pre><code>send or local event (pt = physical clock now):
  l_new = max(l, pt)
  c = (l_new == l) ? c + 1 : 0
  l = l_new

receive (l_m, c_m):
  l_new = max(l, l_m, pt)
  if l_new == l and l_new == l_m:  c = max(c, c_m) + 1
  else if l_new == l:              c = c + 1
  else if l_new == l_m:            c = c_m + 1
  else:                            c = 0
  l = l_new</code></pre>
<ul>
  <li>Like Lamport: a → b implies HLC(a) &lt; HLC(b).</li>
  <li>Unlike Lamport: l never runs more than the maximum clock skew ahead of real time, so the timestamp is still readable as a time and can be used for snapshot reads "as of 10:02:03".</li>
  <li>Can pack into 64 bits (the HLC paper's 48 bits of time + 16 of counter), so it replaces a wall-clock column cheaply; CockroachDB stores an int64 of wall nanoseconds plus an int32 logical counter.</li>
  <li><strong>Used by:</strong> CockroachDB (MVCC timestamps), YugabyteDB, MongoDB's cluster time (causal consistency sessions, since 3.6).</li>
  <li><strong>Limit:</strong> HLC orders causally related events correctly; two concurrent transactions on different nodes still get an order that may not match real time. CockroachDB handles that with an <em>uncertainty interval</em>: a read that sees a value with a timestamp in (read_ts, read_ts + max_offset] can't tell if it happened before the read, so it restarts the read at a higher timestamp. The max offset has long defaulted to 500 ms (check your version's <code>--max-offset</code>), and a node whose clock drifts too far from the others shuts itself down rather than serve wrong answers.</li>
</ul>

<h3>7. TrueTime and commit wait (Spanner)</h3>
<ul>
  <li><code>TT.now()</code> returns [earliest, latest], guaranteed to contain true time. GPS receivers and atomic clocks in each datacenter keep the width (2ε) small: the 2012 paper reports ε usually under ~7 ms, and it has reportedly shrunk since.</li>
  <li><strong>Commit wait:</strong> a transaction picks commit timestamp s = TT.now().latest, then waits until TT.now().earliest &gt; s before releasing locks and acking. After that wait, s is definitely in the past everywhere, so any transaction that starts later gets a larger timestamp.</li>
  <li><strong>Result:</strong> external consistency (strict serializability): if T1 commits before T2 starts in real time, T1's timestamp is smaller. Cost: roughly 2ε added to every read-write commit, overlapped with Paxos replication where possible.</li>
  <li>Without TrueTime-quality clocks you can't safely do commit wait with a 7 ms bound; a 250-500 ms bound would make every commit that slow. That's why CockroachDB chose HLC + uncertainty restarts instead, and is serializable but not strictly serializable for all transaction pairs (see <a href="#/topic/bsd-bb-consistency">Consistency Models</a>).</li>
</ul>

<h3>8. ID generation schemes</h3>
<ul>
  <li><strong>DB sequence / auto-increment:</strong> perfect order, 8 bytes, and one writer. Gaps are normal (rollbacks and cached sequence values burn numbers). Sharded variants: per-shard offset and step (MySQL <code>auto_increment_increment</code> / <code>auto_increment_offset</code>), or Flickr's "ticket servers" (two MySQL boxes, one odd, one even).</li>
  <li><strong>Range allocation:</strong> a central service hands each app server a block of 10,000 IDs; servers mint locally. One coordinated write per block, not per ID. Ordering is only per block.</li>
  <li><strong>Snowflake</strong> (Twitter, 2010; Discord and others use variants): 41 bits of ms since a custom epoch, 10 bits worker, 12 bits sequence. Fits a <code>bigint</code>. If the sequence overflows in one ms, wait for the next ms. Worker ids must be unique: assign them from ZooKeeper/etcd leases or from a stable pod ordinal, never from a random pick.</li>
  <li><strong>Instagram's variant:</strong> 41 bits time, 13 bits logical shard id, 10 bits per-shard sequence, generated inside Postgres by a PL/pgSQL function. The ID carries its own shard, so routing needs no lookup.</li>
  <li><strong>UUIDv4:</strong> 122 random bits; nobody coordinates anything. Collisions are not a practical concern (about 10⁻¹⁹ for a billion IDs), but random keys scatter B-tree inserts.</li>
  <li><strong>UUIDv7</strong> (RFC 9562, 2024): 48-bit Unix ms timestamp first, then 74 bits of randomness (implementations may use part of it as a counter for in-ms monotonicity). Standard UUID type, so every driver and Postgres <code>uuid</code> column take it. Postgres 18 added a built-in <code>uuidv7()</code> that uses the 12 rand_a bits for a sub-millisecond time fraction (RFC 9562 method 3), so IDs from one backend stay ordered; before that, generate it in the app or an extension.</li>
  <li><strong>ULID:</strong> 48-bit ms timestamp + 80 random bits, written as 26 Crockford base32 characters. Lexicographically sortable as a string; a "monotonic" mode increments the random part within the same ms. Same idea as UUIDv7, older and not an IETF standard.</li>
</ul>

<h4>Why random keys hurt a B-tree</h4>
<p>A B-tree index on a monotonically increasing key appends to the rightmost leaf page: that page is hot in cache, fills up, and splits cleanly. With random keys, each insert lands on a random leaf: the working set is the whole index, pages split half-full, and after each checkpoint Postgres writes a full-page image to the WAL for every page's first change. In MySQL/InnoDB the primary key <em>is</em> the clustered table, so random UUIDv4 primary keys scatter the rows themselves. The usual result is a large slowdown in insert throughput and WAL volume once the index no longer fits in memory. Time-ordered IDs (UUIDv7, ULID, Snowflake) fix most of it.</p>

<h3>9. Exactly-once = at-least-once + idempotency</h3>
<p>Two generals can't agree over a lossy link, and for the same reason a sender can't know whether its unacknowledged message was processed. So it must retry (at-least-once) or give up (at-most-once). Exactly-once <em>effect</em> is built on top:</p>
<ol>
  <li>Every operation carries a stable key: the client-generated idempotency key for an API call, or the event id / (partition, offset) for a message.</li>
  <li>The consumer does, in <strong>one local transaction</strong>: insert the key into a dedupe table (unique constraint), apply the effect, and store the response.</li>
  <li>A duplicate hits the unique constraint; the consumer returns the stored response and does nothing else.</li>
</ol>
<pre><code>BEGIN;
INSERT INTO processed (key, response) VALUES ($1, NULL)
  ON CONFLICT (key) DO NOTHING;      -- 0 rows =&gt; duplicate, stop
UPDATE accounts SET balance = balance - 500 WHERE id = $2;
UPDATE processed SET response = $3 WHERE key = $1;
COMMIT;</code></pre>
<ul>
  <li><strong>Kafka's exactly-once</strong> (idempotent producer: producer id + per-partition sequence numbers; transactions: <code>transactional.id</code> with an epoch that fences zombie producers; consumers in <code>read_committed</code>) makes consume-transform-produce within Kafka effectively once. Since Kafka 3.0 the producer defaults to <code>enable.idempotence=true</code> and <code>acks=all</code>. It does nothing for an HTTP call or a DB write you make in the middle. Details: <a href="#/topic/be-kafka">Kafka Deep</a>.</li>
  <li><strong>SQS FIFO</strong> dedupes by message deduplication id within a 5-minute window only; a retry after 6 minutes is a new message.</li>
  <li><strong>Stripe-style APIs</strong> keep idempotency keys for about 24 hours and return the first response for a repeat key; a repeat with a different body is rejected. Middleware patterns: <a href="#/topic/be-resilience">Resilience</a>; consumer-side dedupe: <a href="#/topic/be-event-driven">Event-Driven Systems</a>.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Trade-off: how to change state in two places</h3>
<table>
  <thead><tr><th>Approach</th><th>Atomic?</th><th>Isolated?</th><th>Available when a part is down?</th><th>Latency cost</th><th>Pick it when</th></tr></thead>
  <tbody>
    <tr><td>Co-locate in one DB (pick partition key)</td><td>Yes</td><td>Yes (DB isolation level)</td><td>As available as that DB</td><td>None extra</td><td>Always try first</td></tr>
    <tr><td>Distributed SQL (Spanner, CockroachDB, YugabyteDB)</td><td>Yes (2PC over consensus groups)</td><td>Serializable available (CockroachDB default; YugabyteDB defaults to snapshot)</td><td>Yes, while a majority of each group is up</td><td>Consensus round trips; cross-region writes tens to 100+ ms</td><td>Strong invariants across shards, and you can afford the write latency</td></tr>
    <tr><td>Classic 2PC / XA across heterogeneous DBs</td><td>Yes</td><td>Yes, locks held through both phases</td><td>No: blocks on coordinator loss</td><td>2 round trips + 2 fsyncs, locks held</td><td>Rarely: few, short, in-datacenter transactions where you control every participant</td></tr>
    <tr><td>Saga (orchestrated) + outbox</td><td>Eventually (via compensation)</td><td>No</td><td>Yes: steps queue up and resume</td><td>Steps run async; end-to-end seconds</td><td>Cross-service business flows: orders, bookings, payments</td></tr>
    <tr><td>Single-writer + events (one service owns the invariant)</td><td>The owner's local tx</td><td>Within the owner</td><td>Owner must be up for writes</td><td>None extra</td><td>One service can own the rule (inventory owns "no overselling")</td></tr>
  </tbody>
</table>

<h3>Trade-off: ordering and time</h3>
<table>
  <thead><tr><th>Clock</th><th>Size</th><th>Respects causality?</th><th>Detects concurrency?</th><th>Close to real time?</th><th>Used by</th></tr></thead>
  <tbody>
    <tr><td>Wall clock (NTP)</td><td>8 bytes</td><td>No (skew can invert cause and effect)</td><td>No</td><td>Yes, within the skew</td><td>Cassandra cell timestamps (LWW), logs</td></tr>
    <tr><td>Lamport</td><td>8 bytes</td><td>Yes</td><td>No</td><td>No</td><td>Total-order broadcast, tie-breaking</td></tr>
    <tr><td>Vector / version vector</td><td>O(nodes)</td><td>Yes</td><td>Yes</td><td>No</td><td>Riak, Dynamo paper, CRDT systems</td></tr>
    <tr><td>HLC</td><td>8-12 bytes</td><td>Yes</td><td>No</td><td>Yes, within max skew</td><td>CockroachDB, YugabyteDB, MongoDB cluster time</td></tr>
    <tr><td>TrueTime</td><td>Interval</td><td>Yes, with commit wait</td><td>No</td><td>Yes, bounded by ε</td><td>Spanner</td></tr>
    <tr><td>Log offset / per-entity sequence</td><td>8 bytes</td><td>Yes, within the partition</td><td>Not needed: one writer</td><td>No</td><td>Kafka partitions, chat per-conversation seq</td></tr>
  </tbody>
</table>

<h3>Trade-off: ID schemes</h3>
<table>
  <thead><tr><th>Scheme</th><th>Bytes</th><th>Coordination</th><th>Sortable by time?</th><th>Leaks</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Auto-increment</td><td>8</td><td>One writer</td><td>Yes, exactly (per DB)</td><td>Volume and growth rate (anyone can diff two IDs)</td><td>Breaks when sharded or multi-leader</td></tr>
    <tr><td>UUIDv4</td><td>16</td><td>None</td><td>No</td><td>Nothing</td><td>Index-hostile; fine for low insert rates or as a secondary public id</td></tr>
    <tr><td>UUIDv7</td><td>16</td><td>None</td><td>Roughly (ms, then random; skew across machines)</td><td>Creation time</td><td>Standard UUID type; good default PK today</td></tr>
    <tr><td>ULID</td><td>16 (26-char string)</td><td>None</td><td>Roughly, also as a string</td><td>Creation time</td><td>Nice in URLs and logs; not an IETF standard</td></tr>
    <tr><td>Snowflake</td><td>8</td><td>Unique worker ids</td><td>Roughly (ms, then worker)</td><td>Creation time, worker, per-ms volume</td><td>Half the size of UUIDs; needs worker-id assignment and clock-backward handling</td></tr>
    <tr><td>Range / ticket server</td><td>8</td><td>One call per block</td><td>Per block only</td><td>Volume</td><td>Simple; the allocator is a small SPOF</td></tr>
  </tbody>
</table>

<h3>Example 1: last-write-wins loses an acknowledged write</h3>
<p>Node A's clock is 80 ms fast; node B's is correct. A user updates their display name twice, the second update routed to a different node:</p>
<pre><code>real time      node   value     stamped timestamp
10:00:00.000   A      "Prak"    10:00:00.080   (A is +80 ms)
10:00:00.050   B      "Prakhar" 10:00:00.050
LWW keeps the highest timestamp: .080 &gt; .050  =&gt; "Prak" wins</code></pre>
<p>The later write, which the user saw succeed, silently disappears, and no error is logged anywhere. Any gap smaller than the skew can be inverted. Fixes: route all writes for a key to one leader (single-leader per key), use a version number with compare-and-set (<code>UPDATE ... SET v = v + 1 WHERE v = $seen</code>), or use version vectors and surface the conflict. LWW is fine for presence and "last seen" where losing an update costs nothing.</p>

<h3>Example 2: an HLC trace</h3>
<p>Physical clocks: A reads 100, B is behind and reads 90. Timestamps are (l, c).</p>
<pre><code>A event, pt=100:  l=max(0,100)=100, new l       c=0   -&gt; (100,0)
A sends (100,0) to B
B recv,  pt=90:   l=max(0,100,90)=100 = l_m     c=0+1 -&gt; (100,1)
B event, pt=91:   l=max(100,91)=100 = old l     c=2   -&gt; (100,2)
B event, pt=101:  l=max(100,101)=101, new l     c=0   -&gt; (101,0)</code></pre>
<p>B's events are ordered after A's send even though B's own clock said 90, and as soon as B's physical clock passes the largest time it has seen, the counter resets and l tracks real time again. A pure wall clock would have stamped B's receive at 90, before its cause.</p>

<h3>Example 3: sizing a Snowflake generator</h3>
<ul>
  <li>Lifetime: 2<sup>41</sup> ms ≈ 2.2 × 10<sup>12</sup> ms ≈ 2.2 × 10<sup>9</sup> s ≈ 69.7 years. Pick the epoch as your launch date, not 1970, or you've already spent 55+ years of range.</li>
  <li>Per worker: 4,096 IDs per ms = ~4.1 million IDs/s. A typical API server inserts hundreds to a few thousand rows/s, so the sequence almost never overflows; when it does, the generator spins to the next ms.</li>
  <li>Fleet: 1,024 worker ids. With 300 pods, rolling deploys briefly need extra ids (old and new pods overlap), so lease ids with a TTL from etcd or a DB table rather than counting pods.</li>
</ul>

<h3>Example 4: a booking saga with the outbox</h3>
<p>A meeting-room booking platform: <em>hold room → charge deposit → confirm booking → send invite</em>, across a booking service and a payments service.</p>
<div class="diagram"><pre>
 Booking svc (Postgres)                     Payments svc
 ---------------------                      ------------
 tx1: INSERT booking(status=HELD,
          expires_at=now+10min)
      INSERT outbox(ChargeDeposit, key=bk_42)
            | relay (at-least-once)
            +---------------------------------&gt; charge(idem key=bk_42)
                                               dedupe on key; card API
                                               called with same key
            &lt;---------------------------------+ outbox(DepositCharged)
 tx2: UPDATE booking SET status=CONFIRMED
        WHERE id=42 AND status='HELD'
      INSERT outbox(SendInvite)
 on DepositFailed or hold expiry:
 tx3: UPDATE booking SET status=RELEASED  (compensation)
      ... and if a charge later succeeds for a RELEASED booking:
      INSERT outbox(RefundDeposit, key=bk_42-refund)
</pre></div>
<ul>
  <li><strong>Semantic lock:</strong> HELD rows block the slot for others, so no double booking during the saga. The <code>expires_at</code> releases abandoned holds.</li>
  <li><strong>Guarded transitions:</strong> <code>WHERE status = 'HELD'</code> makes every transition idempotent and resolves the race between "deposit charged" and "hold expired": exactly one of them wins, and the loser's path compensates (refund).</li>
  <li><strong>Pivot:</strong> the charge. Before it, release the hold; after it, keep retrying confirmation, or refund.</li>
  <li><strong>The invite is last</strong> because an email can't be compensated.</li>
</ul>
<p>Load check (consistent with <a href="#/topic/bsd-estimation">Estimation &amp; Numbers</a>): a successful booking costs 2 transactions in the booking DB (hold, confirm), each writing a booking row and an outbox row, plus the relay marking those 2 outbox rows sent: about 6 row writes. A failed one adds a third transaction. At 200 bookings/s peak that's ~400-600 transactions and ~1,200-1,800 row writes per second, well under the ~5K simple writes/s we plan per Postgres primary; the outbox does not force a second database.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Clock moves backward under a Snowflake generator</h3>
<p>NTP steps the clock back 50 ms. A naive generator reuses timestamps it already used, and if the sequence counter was reset, it mints duplicates. Fix: remember the last timestamp; if now &lt; last, either wait until the clock catches up (fine for small steps) or refuse and alert (for large ones). Some implementations keep using the last timestamp and keep incrementing the sequence. Never "just continue".</p>

<h3>Two workers with the same worker id</h3>
<p>A pod is restarted on a new node while the old one is still draining; both have worker id 17. Every millisecond in which both mint IDs, they can produce identical IDs. Lease worker ids with a TTL and have the generator <em>self-check</em>: before minting, confirm the lease is still valid by the monotonic clock with a safety margin. A new holder waits at least TTL + max clock offset before reusing the id, and the primary key's unique constraint is the backstop. This is not fencing (<a href="#/topic/bsd-bb-consensus">Consensus</a>): there is no external resource checking a token, so a process paused right after its check can still mint a duplicate; the margins make that rare and the unique constraint makes it loud.</p>

<h3>"Sortable" IDs that aren't sorted</h3>
<p>UUIDv7, ULID and Snowflake order by the minting machine's clock. Two IDs minted 2 ms apart on different machines with 5 ms of skew sort backward. Within one ms on one machine, random-tail schemes (non-monotonic ULID, UUIDv7 without a counter) don't preserve mint order either. Use them for index locality and "roughly newest first"; use a sequence or log offset when order is a requirement (chat messages in a conversation, ledger entries).</p>

<h3>Idempotency key reused with a different body</h3>
<p>A client bug reuses one key for two different orders; returning the cached response silently drops the second. Store a request hash with the key and reject a mismatch with a 4xx (Stripe does this).</p>

<h3>Concurrent duplicates while the first is still running</h3>
<p>The client times out at 5 s and retries while the first request is still calling the card network. A dedupe check that only looks for <em>completed</em> keys lets both run. Insert the key as "in progress" first (unique constraint wins the race) and make the duplicate wait, poll, or get a 409 "in progress".</p>

<h3>Dedupe window shorter than the retry horizon</h3>
<p>A consumer dedupes for 1 hour, but the DLQ replay tool re-drives messages from 3 days ago. Every replayed message is processed again. Keep dedupe retention at least as long as any path that can redeliver, or make the effect itself naturally idempotent (upsert by business key, guarded state transition).</p>

<h3>Orphaned prepared transactions</h3>
<p>An app using XA crashes between phases. A prepared transaction sits in Postgres for days holding row locks and pinning the vacuum horizon, so tables bloat. Monitor <code>pg_prepared_xacts</code> for anything older than minutes.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Dual write: DB commit, then publish</h3>
<p><code>save(order); kafka.send(OrderPlaced)</code>. A crash between the two loses the event forever; reversing the order publishes events for orders that never committed. Use the outbox or CDC (<a href="#/topic/be-queues">Queues &amp; Streaming</a>).</p>

<h3>Ordering by <code>created_at</code> from many app servers</h3>
<p>Each server stamps rows with its own clock, so a view sorted by that column shows effects before causes whenever two writes land closer together than the skew. A DB-assigned sequence removes skew but still isn't commit order (ids and <code>now()</code> are fixed before commit), so a consumer paging "id &gt; last_seen" can permanently skip a late committer. For display order use a per-entity counter bumped under a row lock, or an HLC; for consumer cursors use WAL/LSN order (CDC), or a poller that re-scans a lag window behind its cursor.</p>

<h3>Distributed lock instead of a transaction</h3>
<p>"Take a Redis lock, then update both services." The lock doesn't make the two updates atomic (a crash in between still leaves half), and without fencing it doesn't even guarantee mutual exclusion. A lock serialises; it doesn't commit.</p>

<h3>Believing Kafka exactly-once covers the side effect</h3>
<p>A transactional consumer that calls a payment API and then commits offsets in the Kafka transaction will call the payment API again after a crash: the API call isn't part of the transaction. The payment call needs its own idempotency key.</p>

<h3>Using wall time for timeouts and leases</h3>
<p><code>if (Date.now() - start &gt; 30000)</code> breaks when NTP steps the clock: a backward step makes a timeout fire late by the size of the step; a forward step fires it early. Durations use the monotonic clock.</p>

<h3>Exposing sequential IDs publicly</h3>
<p><code>/invoices/10234</code> invites enumeration (try 10235) and reveals volume. Authorise every access regardless, and if growth numbers are sensitive, expose a random or opaque public id alongside the internal key.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block"><div class="qa-question">1. "Order service and payment service each have their own database. Why can't we just wrap both writes in a transaction?"</div><div class="qa-answer">
<p>"A database transaction only covers what one database's lock manager and log control. The order DB can't roll back the payment DB, and neither knows whether the other committed. If I commit orders and then payments fails, I have an order without a payment. So I either need an atomic-commit protocol over both, which is 2PC, or I accept eventual atomicity with a saga. Before either, I'd ask whether the invariant really spans both: often the payment service can own the money and the order service just reacts to events, so no cross-DB atomicity is needed at all."</p>
</div></div>

<div class="qa-block"><div class="qa-question">2. "Walk me through 2PC. Where exactly does it block?"</div><div class="qa-answer">
<p>"Phase 1: the coordinator sends PREPARE; each participant does the work, flushes it to its log, keeps its locks and votes YES, or votes NO and aborts. Phase 2: if all voted YES the coordinator durably logs COMMIT, which is the commit point, and tells everyone; otherwise ABORT. It blocks when a participant has voted YES and then loses the coordinator before hearing the decision. It can't commit, because maybe someone voted NO; it can't abort, because maybe the coordinator already logged COMMIT and others committed. So it holds its locks until the coordinator recovers. Those are locks on real rows, so every other transaction touching them queues behind it: a single coordinator crash becomes an outage on the hottest rows."</p>
</div></div>

<div class="qa-block"><div class="qa-question">3. "Doesn't 3PC solve that? And if not, how does Spanner run 2PC at Google scale?"</div><div class="qa-answer">
<p>"3PC adds a pre-commit phase so participants can time out into a decision, but it's only safe if message delays are bounded. In a partition, each side can time out into a different outcome, so it trades blocking for inconsistency. Spanner keeps 2PC but removes the single point of failure: every participant is a Paxos group, the coordinator is the leader of one of those groups, and the commit decision is replicated by Paxos before it's acted on. A coordinator machine dying just triggers a leader election, seconds (Spanner leader leases are ~10 s), and the new leader has the decision. CockroachDB does the same with a Raft-replicated transaction record, and Kafka transactions with a replicated transaction log. The pattern is: 2PC for atomicity, consensus for the coordinator's availability."</p>
</div></div>

<div class="qa-block"><div class="qa-question">4. "OK, we go with a saga for 'reserve inventory, charge card, create shipment'. What do we lose, and how do you design around it?"</div><div class="qa-answer">
<p>"We lose isolation. Between reserving inventory and a failed charge's compensation, other requests see stock as reserved, and analytics may count an order that will be cancelled. I design around it: a semantic lock, meaning the reservation is a PENDING status that other flows respect and that expires on its own; commutative updates, like decrementing stock, so reordering doesn't matter; and ordering steps so the one most likely to fail goes early and the irreversible one goes last. The charge is the pivot: before it I compensate (release stock), after it I only go forward (retry shipment creation until it succeeds, or refund as a deliberate new action). Every step and every compensation is idempotent and keyed by the order id, because the orchestrator will retry them. I'd use an orchestrator, Temporal or a state table, for anything over three steps, so the flow is visible in one place."</p>
</div></div>

<div class="qa-block"><div class="qa-question">5. "The orchestrator writes the order row and then publishes 'ChargeCard' to a queue. What can go wrong?"</div><div class="qa-answer">
<p>"It's a dual write. If the process dies after the commit and before the publish, the order sits there forever and no charge is ever requested. If I publish first and the commit fails, I charge for an order that doesn't exist. The fix is the outbox: insert the ChargeCard message into an outbox table in the same transaction as the order, and have a relay (a poller with SKIP LOCKED, or Debezium reading the WAL) publish it. Now the event exists if and only if the order does. The relay can crash after publishing and before marking the row sent, so it republishes: the payment consumer must dedupe on the message's key."</p>
</div></div>

<div class="qa-block"><div class="qa-question">6. "Can we get exactly-once delivery so the consumer doesn't need to dedupe?"</div><div class="qa-answer">
<p>"Not over a network that loses messages. If the sender doesn't get an ack, it can't tell 'lost before processing' from 'processed, ack lost', so it must retry or give up: at-least-once or at-most-once. What we can get is an exactly-once <em>effect</em>: at-least-once delivery plus an idempotent consumer. Kafka's exactly-once semantics is real but scoped: the idempotent producer dedupes broker-side retries using a producer id and sequence numbers, and transactions make 'consume, produce, commit offsets' atomic within Kafka. As soon as the consumer writes to Postgres or calls an API, that write is outside the transaction and needs its own dedupe, typically storing the (partition, offset) or event id in the same DB transaction as the effect."</p>
</div></div>

<div class="qa-block"><div class="qa-question">7. "Design the idempotency layer for a payments API. Be specific."</div><div class="qa-answer">
<p>"The client generates a key per logical operation and sends it in an Idempotency-Key header, reusing it on retries. Server side, in Postgres: a table keyed by (merchant_id, key) with request_hash, status (IN_PROGRESS, DONE), response and created_at. Flow: insert the row as IN_PROGRESS; the unique constraint decides the race between concurrent duplicates. If the insert conflicts: same hash and DONE, return the stored response; same hash and IN_PROGRESS, return 409 or wait; different hash, reject as misuse. Then call the card network, passing our own key downstream so their side dedupes too, and store the result and DONE. If we crash mid-call, a recovery job finds stale IN_PROGRESS rows and asks the card network for the outcome using that key rather than charging again. Retention: at least the client's retry horizon; Stripe uses about 24 hours. Cost: one extra row write per payment, trivial against the ~5K simple writes/s we plan per primary."</p>
</div></div>

<div class="qa-block"><div class="qa-question">8. "Why can't we order events from different servers by their timestamps? NTP keeps them in sync."</div><div class="qa-answer">
<p>"NTP keeps them <em>close</em>, not equal: sub-ms to a few ms in a good datacenter, tens of ms across the internet, and unbounded when NTP silently fails. Clocks also step backward on correction and freeze during GC or VM pauses. Any two events closer together than the current skew can come out in the wrong order, including a reply stamped before its question. With last-write-wins, that inversion silently drops an acknowledged write. So wall time is fine for display and coarse analytics, but for correctness I use something with a defined guarantee: a sequence from a single writer, such as a log offset or a per-conversation counter, or a logical or hybrid clock that is guaranteed to respect causality."</p>
</div></div>

<div class="qa-block"><div class="qa-question">9. "Lamport clocks vs vector clocks. When do you actually need vector clocks?"</div><div class="qa-answer">
<p>"A Lamport clock is one counter: increment on each event, take max(mine, received) + 1 on receive. It guarantees that if a happened before b, a's number is smaller, so sorting by (counter, node id) gives a total order that never contradicts causality. But a smaller number doesn't mean 'happened before': it can't tell me two writes were concurrent. Vector clocks keep one counter per node, and comparing two vectors tells me before, after or concurrent. I need that when concurrent writes to the same key must be detected rather than silently ordered: multi-leader or leaderless replication where I want to keep siblings or merge with a CRDT, like the Dynamo shopping cart. The cost is size proportional to the number of writers, so I keep entries per server replica, not per client."</p>
</div></div>

<div class="qa-block"><div class="qa-question">10. "What's a hybrid logical clock, and what does CockroachDB do when clocks still disagree?"</div><div class="qa-answer">
<p>"An HLC is a (physical, logical) pair: the physical part is the max wall time seen so far, from my clock or any message, and the logical counter breaks ties. It respects causality like Lamport, stays within the max clock skew of real time, and can pack into 64 bits, so it works as an MVCC timestamp you can still read as a time. It doesn't fix concurrent transactions on different nodes whose clocks disagree. CockroachDB handles that with an uncertainty window: if a read at time t finds a value stamped between t and t + max_offset, it can't know whether that write really happened first, so it restarts the read at a higher timestamp. The max offset has long defaulted to 500 ms, and a node that detects its clock is too far from its peers shuts itself down. So correctness rests on a clock bound that's configured and enforced, rather than one you assume and never check."</p>
</div></div>

<div class="qa-block"><div class="qa-question">11. "Then how does Spanner give external consistency, and why doesn't everyone copy it?"</div><div class="qa-answer">
<p>"TrueTime returns an interval guaranteed to contain true time, kept narrow (single-digit ms in the 2012 paper) by GPS and atomic clocks in every datacenter. A read-write transaction takes its commit timestamp as the interval's latest bound, then commit-waits until the earliest bound has passed that timestamp before it releases locks and acks. After that wait, every transaction that starts later anywhere gets a larger timestamp, so timestamp order matches real-time order. The cost is about twice the uncertainty per commit, which is fine at a few ms. Copying it needs the clock hardware: with ordinary NTP the typical error is small, but the bound you can <em>guarantee</em> is hundreds of ms, and waiting that long on every commit is unacceptable. That's why CockroachDB uses HLC plus read restarts. Cloud time services with published error bounds, like AWS ClockBound, are narrowing the gap."</p>
</div></div>

<div class="qa-block"><div class="qa-question">12. "Design an ID generator for ~100K inserts/s across many services and two regions. IDs should sort roughly by time and fit in a bigint."</div><div class="qa-answer">
<p>"Snowflake-style, generated in-process, so there's no network hop: 41 bits of ms since our own epoch (about 70 years), 10 bits of worker id, 12 bits of sequence. That's 4,096 IDs per ms per worker, so 100K/s is about 100 per ms spread over the fleet, nowhere near the limit. Worker ids are leased from etcd or a DB table with a TTL; the generator self-checks its lease (monotonic clock, safety margin) before minting, a new holder waits TTL + max clock offset before reusing an id, and the primary key's unique constraint catches the rare pause-induced duplicate. That's lease self-checking, not fencing: nothing external rejects a stale holder. I'd spend one or two worker bits on region so the regions can never collide even if a lease store splits. Clock moving backward: track the last timestamp; for small steps, wait it out; for large ones, refuse and alert. I'd tell the interviewer that the IDs sort by time only to within the clock skew between workers. If they don't need a bigint, UUIDv7 avoids the worker-id problem entirely, at 16 bytes."</p>
</div></div>

<div class="qa-block"><div class="qa-question">13. "Our Postgres table uses UUIDv4 primary keys and inserts got slower as it grew. Why, and what would you change?"</div><div class="qa-answer">
<p>"Random keys scatter inserts across the whole B-tree. While the index fits in memory you barely notice; once it doesn't, each insert can mean a random page read, pages split half-full, and after every checkpoint the first touch of each page writes a full-page image to the WAL, so WAL volume and I/O climb with table size. A time-ordered key appends to the right edge, so the hot pages stay in cache. I'd switch new rows to UUIDv7: same type and size, no schema change for clients (Postgres 18 has a built-in uuidv7() function; on older versions generate it in the app). Existing rows can keep their v4 keys. If the UUID is exposed publicly and creation time is sensitive, keep a separate random public id. In MySQL it's worse, because InnoDB clusters the table on the primary key, so the rows themselves scatter."</p>
</div></div>

<div class="qa-block"><div class="qa-question">14. "A customer reports that some users were charged twice for one booking, always on slow mobile networks. Walk me through the investigation and the fix."</div><div class="qa-answer">
<p>"'Slow networks' says retries. My hypothesis is that the client times out, the user taps again or the HTTP library retries, and the server treats the retry as a new charge. First I'd confirm it: pull both charges and check whether they share a booking id, how far apart they are (seconds suggests a retry; minutes suggests a double tap after an error screen), and whether the first request completed on the server after the client gave up, which the request logs show. Then I'd check every hop for retries: the mobile client, the gateway or load balancer, our service's call to the payment provider, and any queue consumer in between. Fix, in layers: the client generates an idempotency key when the user starts checkout and reuses it on every retry; the server stores it with an IN_PROGRESS status under a unique constraint, so a concurrent duplicate is rejected or waits; we pass the same key to the payment provider so their side dedupes too; and the booking transition is guarded (<code>WHERE status = 'HELD'</code>) so a second confirmation is a no-op. For the affected users I'd run a reconciliation query for multiple charges per booking and refund them, and I'd add an alert on that query so we hear about it before customers do."</p>
</div></div>
` }

  ]
});
