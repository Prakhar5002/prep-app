window.PREP_SITE.registerTopic({
  id: "bsd-bb-consensus",
  module: 'backend-sd',
  title: "Consensus & Coordination",
  estimatedReadTime: "50 min",
  tags: ["system-design","distributed-systems","consensus","raft","paxos","etcd","zookeeper","distributed-locks","leader-election","fencing-tokens","interview"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>Consensus gets a group of machines to agree on one ordered log of decisions, even when some crash, by requiring a majority (quorum) for every decision; you almost never build it yourself: you put the small, critical "who is leader / who holds the lock / what is the config" state into etcd, ZooKeeper or Consul, and you protect the resource with fencing tokens because a lock alone is never enough.</strong></div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Why:</strong> leader election, locks, membership, config and "exactly one of us does X" all reduce to agreeing on one value or one order. Without consensus you get split brain: two leaders, two writers, double-run jobs.</li>
    <li><strong>Majority quorum:</strong> 2f + 1 nodes tolerate f crashes. 3 nodes survive 1, 5 survive 2. Any two majorities overlap in at least one node, and that overlap is what carries the truth forward.</li>
    <li><strong>Raft in four words:</strong> terms, election, replication, commit. One leader per term; a candidate needs a majority of votes and an up-to-date log; the leader appends entries and an entry is <em>committed</em> once a majority has it on disk and it is from the leader's current term (older-term entries commit indirectly behind it).</li>
    <li><strong>Paxos:</strong> same guarantee, two phases (prepare/promise, accept/accepted) with ballot numbers; Multi-Paxos keeps a stable leader so the steady state looks like Raft. Raft was designed to be understandable.</li>
    <li><strong>Cost:</strong> every write = 1 round trip to a majority + an fsync. ~1-10 ms inside one datacenter; cross-region adds the RTT to the nearest majority (tens of ms). Throughput is small: think thousands to low tens of thousands of writes/s per group, and a few GB of data total.</li>
    <li><strong>Coordination services:</strong> etcd (Kubernetes), ZooKeeper (HBase, older Kafka, Hadoop), Consul (service discovery). Store <em>metadata</em>, not business data.</li>
    <li><strong>Leases:</strong> a lock with a TTL. If the holder dies, the lock frees itself. If the holder only <em>pauses</em> (GC, VM freeze), it may still believe it holds the lock.</li>
    <li><strong>Fencing token:</strong> a number that increases on every lock grant (etcd revision, ZooKeeper zxid). The storage rejects writes carrying an older token. This is what makes a lock safe.</li>
    <li><strong>Redlock debate:</strong> Redlock depends on bounded clock drift and pauses and issues no fencing token, so it is fine for efficiency (avoid duplicate work) but not for correctness (avoid corrupt data).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Saying "I'll take a Redis lock" and stopping there. The follow-up is always "the lock holder pauses for 30 s and the lease expires; now two workers write. What stops that?" The answer is a fencing token checked by the resource, or a design that needs no lock at all (a DB unique constraint, a conditional write, a single partition owner).</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I don't want to implement consensus. I'll keep leadership and config in etcd, which runs Raft across 3 or 5 nodes, and keep the high-volume data path out of it."</div>
  <div class="revision-say">"A lease tells a worker it is <em>probably</em> the leader. The fencing token makes the storage enforce it, so a paused old leader can't corrupt anything."</div>
  <div class="revision-say">"Is this lock for efficiency or for correctness? If it's correctness, I want the guarantee in the database: a unique constraint or a compare-and-set, not a Redis key."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The problem consensus solves</h3>
<p>Many backend designs quietly assume "there is exactly one of something": one primary database, one scheduler that fires the cron job, one consumer that owns a partition, one config version everyone sees. On one machine that is trivial. Across machines that crash, pause and lose network links, it is the hardest problem in the field, because no node can tell the difference between "the other node is dead" and "the other node is slow or cut off from me".</p>
<p><strong>Consensus</strong> is a protocol that lets a group of nodes agree on a value (or a sequence of values, a log) such that:</p>
<ul>
  <li><strong>Agreement:</strong> no two nodes decide different values.</li>
  <li><strong>Validity:</strong> the decided value was actually proposed by someone (no made-up values).</li>
  <li><strong>Integrity:</strong> a node decides at most once; a decision is never undone.</li>
  <li><strong>Termination:</strong> if a majority is up and can talk, a decision is eventually reached.</li>
</ul>
<p>Agreeing on a single <em>log</em> is the useful form: if every node applies the same commands in the same order to the same starting state, every node ends in the same state. This is <strong>state machine replication</strong>, and it is how etcd, ZooKeeper, Consul, CockroachDB ranges, TiKV regions, Spanner splits and Kafka's KRaft controller all work.</p>

<h3>What reduces to consensus</h3>
<p>Interviewers like this because it shows you see the common shape. All of these are the same problem in disguise:</p>
<table>
  <thead><tr><th>Need</th><th>Phrased as consensus</th><th>Where you meet it</th></tr></thead>
  <tbody>
    <tr><td>Leader election</td><td>Agree on who is leader for term N</td><td>DB failover, Kafka controller, scheduler, Kubernetes controllers</td></tr>
    <tr><td>Distributed lock</td><td>Agree on who holds lock L right now, and in what order it was granted</td><td>Single-runner jobs, migrations, exclusive file processing</td></tr>
    <tr><td>Membership / config</td><td>Agree on the set of live nodes and the current config version</td><td>Shard maps, feature config, cluster topology</td></tr>
    <tr><td>Atomic commit</td><td>Agree to commit or abort across participants</td><td>2PC coordinator made fault-tolerant (Spanner runs 2PC over Paxos groups)</td></tr>
    <tr><td>Uniqueness</td><td>Agree that username X was claimed first by user A</td><td>Usernames, seat booking, idempotency keys</td></tr>
    <tr><td>Linearizable compare-and-set</td><td>Agree on the order of CAS operations on one register</td><td>Optimistic locking, counters that must not double-count</td></tr>
  </tbody>
</table>
<p>The deep result: <strong>total-order broadcast, linearizable compare-and-set and consensus are equivalent</strong>. If you have one, you can build the others. So when an interviewer asks "how do you guarantee only one X?", the honest answer is "something somewhere runs consensus: either a coordination service, or a database whose primary election or conditional write already does it".</p>

<h3>Why it is hard: the impossibility results, in plain words</h3>
<ul>
  <li><strong>FLP (1985):</strong> in a fully asynchronous network (no upper bound on message delay), no deterministic protocol can guarantee consensus terminates if even one node may crash. Real systems escape it by using <em>timeouts</em> (partial synchrony): safety never depends on timing, but progress (electing a leader) does. Raft and Paxos are always safe; they are live only when the network behaves for long enough. The other escape is <em>randomisation</em> (Ben-Or, 1983): a protocol that flips coins terminates with probability 1, which FLP's "deterministic" wording doesn't forbid.</li>
  <li><strong>Two Generals:</strong> over a lossy link, two parties can never be <em>certain</em> they agree. Hence acknowledgements, retries and idempotency everywhere.</li>
  <li><strong>CAP:</strong> during a partition, the minority side of a consensus group cannot accept writes. Consensus systems are CP. See <a href="#/topic/bsd-bb-consistency">Consistency Models, CAP &amp; PACELC</a>.</li>
</ul>

<h3>Why interviewers probe it</h3>
<p>Every deep design eventually has a "what if two of them think they're in charge?" moment: the job scheduler fires twice, two primaries accept writes after a failover, two booking workers allocate the same seat. A candidate who can explain terms, quorums, leases and fencing can answer 4-5 levels of "what if it fails?" without hand-waving. A candidate who says "use ZooKeeper" and stops gets caught at level 2.</p>

<div class="callout insight"><div class="callout-title">The rule that saves you in interviews</div>
<p>Consensus is a <strong>control-plane</strong> tool. It decides <em>who</em> does the work and <em>what</em> the config is. The data plane (millions of writes/s) either stays out of it entirely, or is split into many small consensus groups (multi-Raft: one per shard) so no single group carries the whole load.</p></div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture: a committee with minutes</h3>
<p>Think of a committee of 5 that keeps a numbered minutes book. A chair (the leader) proposes each new line. A line counts as official once at least 3 members have written it into their own copy. If the chair goes silent, members wait a random time and then one calls an election for a new <em>term</em>; whoever gets 3 votes chairs that term. Two facts make it safe:</p>
<ol>
  <li><strong>Any two groups of 3 out of 5 share at least one member.</strong> So every new chair's voters include someone who saw every official line, and a member only votes for a candidate whose minutes are at least as complete as their own. Official lines are never lost.</li>
  <li><strong>Terms only go up.</strong> A member who has seen term 7 ignores anything from a term-6 chair. A deposed chair who wakes up from a nap is told "we're in term 7 now" and steps down.</li>
</ol>
<p>That is Raft. Everything else is detail on top of those two facts.</p>

<h3>Node states</h3>
<div class="diagram"><pre>
          times out: term + 1, votes for self, asks for votes
 +----------+ -----------------------------------&gt; +-----------+
 | FOLLOWER |                                       | CANDIDATE |--+
 +----------+ &lt;----------------------------------- +-----------+  |
      ^         sees a leader or a higher term         |     ^     |
      |                                     wins a     |     +-----+
      |                                     majority   v   split vote:
      |   sees a higher term                   +--------+  time out again
      +----------------------------------------| LEADER |
            (steps down at once)               +--------+
     leader heartbeats (empty AppendEntries) every ~50-100 ms
     keep followers from timing out
</pre></div>

<h3>The log and the commit point</h3>
<div class="diagram"><pre>
 index:     1    2    3    4    5    6
          +----+----+----+----+----+----+
 Leader   | t1 | t1 | t2 | t2 | t3 | t3 |   (t = term entry was made)
          +----+----+----+----+----+----+
 Node B   | t1 | t1 | t2 | t2 | t3 |          has 1..5
 Node C   | t1 | t1 | t2 | t2 | t3 | t3 |     has 1..6
 Node D   | t1 | t1 | t2 |                    lagging
 Node E   | t1 |                              very behind / down
                             ^
                     commitIndex = 5: entries 1..5 are on 3 of 5
                     nodes (leader, B, C), current-term entry
                     included, so they are committed and safe
                     to apply. Entry 6 is on 2 of 5: not yet.
</pre></div>

<h3>Quorum math you should say without thinking</h3>
<table>
  <thead><tr><th>Cluster size N</th><th>Majority</th><th>Crashes tolerated</th><th>Comment</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>1</td><td>0</td><td>Dev only. No fault tolerance.</td></tr>
    <tr><td>2</td><td>2</td><td>0</td><td>Worse than 1: two things that can fail, still no tolerance.</td></tr>
    <tr><td>3</td><td>2</td><td>1</td><td>The default. Survives one node or one zone.</td></tr>
    <tr><td>4</td><td>3</td><td>1</td><td>Same tolerance as 3, bigger quorum, slower. Avoid even sizes.</td></tr>
    <tr><td>5</td><td>3</td><td>2</td><td>Survives a failure during a planned upgrade. Common for important clusters.</td></tr>
    <tr><td>7</td><td>4</td><td>3</td><td>Rare. More nodes = more replication traffic and slower commits, not more throughput.</td></tr>
  </tbody>
</table>
<p>Adding nodes to a consensus group <strong>never adds write throughput</strong>: every write still goes through one leader and must reach a majority. It only adds fault tolerance (and, with follower reads, read capacity). To scale writes, run <em>many</em> groups, one per shard. See <a href="#/topic/bsd-bb-partitioning">Partitioning &amp; Consistent Hashing</a>.</p>

<h3>Locks, leases and fencing as one picture</h3>
<ul>
  <li><strong>Lock:</strong> "only one of us at a time". On a single machine, the OS enforces it.</li>
  <li><strong>Lease:</strong> a lock that expires after a TTL unless renewed. It solves "the holder crashed and the lock is stuck forever" but introduces "the holder thinks it still holds it after expiry".</li>
  <li><strong>Fencing token:</strong> every grant comes with a strictly increasing number. The <em>resource</em> remembers the highest token it has seen and rejects anything lower. This closes the gap the lease opened.</li>
</ul>
<p>The progression lock → lease → fencing is the backbone of the follow-up chain interviewers use. Learn it in that order.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Raft: leader election</h3>
<ul>
  <li>Every node starts as a <strong>follower</strong> with an <em>election timeout</em> randomised in a range (the paper uses 150-300 ms; production systems like etcd default to ~1 s elections with 100 ms heartbeats). Randomisation is what stops everyone standing at once and splitting the vote forever.</li>
  <li>If no heartbeat arrives before the timeout, the follower becomes a <strong>candidate</strong>: it increments its <code>currentTerm</code>, votes for itself, persists that to disk, and sends <code>RequestVote(term, lastLogIndex, lastLogTerm)</code> to everyone.</li>
  <li>A node grants its vote if (a) it has not voted for someone else in this term, and (b) the candidate's log is <strong>at least as up to date</strong> as its own: higher last term wins; equal last term, then longer log wins. This is the <em>election restriction</em>. It guarantees the winner holds every committed entry, because committed entries are on a majority and the winner needs votes from a majority, and those two sets overlap.</li>
  <li>With a majority of votes it becomes <strong>leader</strong> and immediately sends heartbeats. If it hears from a valid leader with term &gt;= its own, it steps back to follower. If the vote splits, the timeout fires again with a new random value and a new term.</li>
  <li><strong>Terms are a logical clock.</strong> Every message carries the sender's term. Seeing a higher term makes any node update its term and become a follower. Messages with a lower term are rejected. This alone deposes stale leaders.</li>
</ul>

<h3>2. Raft: log replication</h3>
<ol>
  <li>A client sends a command to the leader (followers redirect or proxy).</li>
  <li>The leader appends <code>(term, index, command)</code> to its own log and sends <code>AppendEntries(term, prevLogIndex, prevLogTerm, entries[], leaderCommit)</code> to each follower, in parallel.</li>
  <li><strong>Consistency check:</strong> a follower accepts only if its log has an entry at <code>prevLogIndex</code> with term <code>prevLogTerm</code>. If not, it rejects, and the leader walks <code>nextIndex</code> backwards for that follower until they match, then overwrites the follower's conflicting suffix. By induction, if two logs agree at an index and term, they agree on everything before it (the <em>Log Matching</em> property).</li>
  <li>Followers <strong>fsync</strong> the entries before acknowledging. An ack from a node that would forget the entry after a reboot is worthless.</li>
  <li>Once a majority (counting the leader) has the entry, the leader advances <code>commitIndex</code>, applies the entry to its state machine, and answers the client. Followers learn the new commit index in the next AppendEntries and apply too.</li>
</ol>
<div class="callout warn"><div class="callout-title">The subtle commit rule (the "Figure 8" problem)</div>
<p>A leader may only count replicas to commit an entry <strong>from its own current term</strong>. Entries from earlier terms become committed indirectly, when a current-term entry after them is committed. Without this, an old-term entry that sits on a majority could still be overwritten by a later leader whose log has a higher last term. That is why a new leader immediately appends a no-op entry for its term: it commits everything before it and lets the leader learn the true commit index.</p></div>

<h3>3. Reads: the part candidates forget</h3>
<p>Writes are linearizable by construction. Reads are not, unless you do something: a leader that has been partitioned away might not know it is deposed and could serve stale data.</p>
<table>
  <thead><tr><th>Read strategy</th><th>How</th><th>Cost</th><th>Safe?</th></tr></thead>
  <tbody>
    <tr><td>Log read</td><td>Put the read through the log like a write</td><td>Full round trip + fsync per read</td><td>Linearizable</td></tr>
    <tr><td>ReadIndex</td><td>Leader must first have committed an entry from its current term (the no-op), so it knows the true commit index. It then records commitIndex, confirms it is still leader with one heartbeat round to a majority, waits until applied, and reads locally</td><td>One network round trip, no disk write</td><td>Linearizable (etcd default)</td></tr>
    <tr><td>Lease read</td><td>Leader assumes nobody else can be elected until its lease (shorter than the election timeout) runs out, and reads locally without asking</td><td>No round trip</td><td>Only if clock drift is bounded. A timing assumption.</td></tr>
    <tr><td>Follower read</td><td>Follower asks the leader for the current commitIndex, waits to apply it, reads locally</td><td>One round trip to leader; spreads read load</td><td>Linearizable</td></tr>
    <tr><td>Stale / serializable read</td><td>Read any node's local state</td><td>Free</td><td>May be stale. etcd <code>--consistency=s</code>, ZooKeeper reads by default</td></tr>
  </tbody>
</table>
<p><strong>ZooKeeper gotcha:</strong> ZooKeeper reads are served by whichever server the client is connected to and can be stale. Writes are linearizable; reads are only sequentially consistent per client. Call <code>sync()</code> before a read when you need a practically up-to-date value; it narrows staleness to almost nothing but is not strictly linearizable in every edge case (for example a server that has just lost leadership and doesn't know it yet).</p>

<h3>4. Membership changes, snapshots and liveness extras</h3>
<ul>
  <li><strong>Changing the cluster</strong> (3 → 5 nodes, replacing a dead node) is itself a log entry. Switching every node from old to new config at once is unsafe: for a moment an old majority and a new majority might not overlap, and two leaders could be elected. Raft uses either <em>joint consensus</em> (a transitional config that needs majorities of both old and new) or <em>one server at a time</em> changes (any two adjacent configs always overlap). etcd adds new members as non-voting <em>learners</em> first, so a fresh node catching up does not shrink the effective quorum.</li>
  <li><strong>Snapshots / log compaction:</strong> the log cannot grow forever. Each node periodically snapshots its state machine and discards the log prefix. A follower too far behind gets the snapshot via <code>InstallSnapshot</code>. Huge state makes snapshots, and therefore recovery, slow. Don't confuse this with etcd's separate <em>MVCC compaction</em>: etcd keeps old revisions of every key in its keyspace (so watches can resume from a revision), and you compact that history (and defragment) on its own schedule. Raft log compaction trims the replication log; MVCC compaction trims the key history.</li>
  <li><strong>Pre-vote:</strong> a node that was partitioned keeps timing out and bumping its term; when it rejoins, its high term forces the healthy leader to step down for nothing. With pre-vote, a node first asks "would you vote for me?" without bumping the term, and only stands if a majority says yes.</li>
  <li><strong>Check-quorum:</strong> a leader that hasn't heard from a majority within an election timeout steps down on its own, so a minority-side leader stops accepting work quickly.</li>
</ul>

<h3>5. Paxos in one paragraph (plus its family)</h3>
<p><strong>Paxos</strong> (Lamport) agrees on one value in two phases. In phase 1, a proposer picks a ballot number <em>n</em> higher than any it has seen and sends <em>prepare(n)</em>; each acceptor promises to ignore ballots below <em>n</em> and replies with the highest-ballot value it has already accepted, if any. With promises from a majority, phase 2 begins: the proposer sends <em>accept(n, v)</em>, where <em>v</em> must be the value from the highest ballot reported in phase 1 (only if none was reported may it choose its own). The value is chosen once a majority of acceptors accept it. The "must re-propose what you learned" rule plus majority overlap is the whole safety argument, the same one Raft uses. Single-decree Paxos decides one value; <strong>Multi-Paxos</strong> runs a slot per log index and keeps a stable leader so phase 1 is done once per leadership, making the steady state one round trip, like Raft. Raft is essentially Multi-Paxos with stronger rules (only up-to-date nodes can be elected, logs never have holes), chosen to be easier to implement correctly.</p>
<ul>
  <li><strong>ZAB</strong> (ZooKeeper Atomic Broadcast) and <strong>Viewstamped Replication</strong> are close relatives: leader-based, epoch/view numbers, majority acks.</li>
  <li><strong>Byzantine fault tolerance</strong> (PBFT, Tendermint) handles nodes that lie, needs 3f + 1 nodes, and is for blockchains and adversarial settings, not normal backends. Raft and Paxos assume nodes crash but don't lie.</li>
</ul>

<h3>6. Coordination services: what they give you</h3>
<table>
  <thead><tr><th></th><th>etcd</th><th>ZooKeeper</th><th>Consul</th></tr></thead>
  <tbody>
    <tr><td>Protocol</td><td>Raft</td><td>ZAB</td><td>Raft (per datacenter)</td></tr>
    <tr><td>Data model</td><td>Flat key space, MVCC revisions, range queries</td><td>Tree of znodes (paths)</td><td>KV + service catalog</td></tr>
    <tr><td>Liveness primitive</td><td>Lease with TTL; keys attached to a lease vanish when it expires</td><td>Session; <em>ephemeral</em> znodes vanish when the session ends</td><td>Session tied to health checks</td></tr>
    <tr><td>Ordering primitive</td><td>Global revision number (monotonic)</td><td><em>Sequential</em> znodes, zxid</td><td>ModifyIndex</td></tr>
    <tr><td>Notification</td><td>Watch from a revision (no gaps if you resume from the last revision seen)</td><td>Classic watches are one-shot (re-register after each event; events between can be missed, so re-read). ZooKeeper 3.6+ adds persistent and recursive watches via <code>addWatch</code></td><td>Blocking queries</td></tr>
    <tr><td>Atomic ops</td><td>Txn: if (compare) then (ops) else (ops)</td><td>multi(), versioned setData</td><td>CAS via index, txn</td></tr>
    <tr><td>Famous users</td><td>Kubernetes (all cluster state), CoreDNS, many Go systems</td><td>HBase, Hadoop HA, Solr, older Kafka (pre-KRaft)</td><td>Service discovery, Vault storage, service mesh</td></tr>
  </tbody>
</table>
<p><strong>Size and speed (ballparks, hardware dependent):</strong> etcd ships with a ~2 GB storage quota and its docs suggest staying under ~8 GB; values should be small (request size defaults to ~1.5 MB max). Writes on SSDs in one datacenter land in the low milliseconds; throughput is in the thousands to low tens of thousands of writes/s, bounded by fsync latency and the single leader. ZooKeeper is similar: tuned for read-heavy coordination, with all data held in memory. Treat these as "metadata stores", sized in MB to low GB, not data stores. Slow disks are the number-one cause of etcd trouble: fsync latency directly becomes commit latency, and missed heartbeats cause spurious elections.</p>

<h3>7. Recipes on top of a coordination service</h3>
<p><strong>Leader election with etcd:</strong></p>
<pre><code>lease = grant(ttl = 10s)            // keepalive every ~3s
// atomically create the key only if it does not exist
txn(
  if   createRevision("/svc/leader") == 0
  then put("/svc/leader", myId, lease)
  else get("/svc/leader")
)
// winner: its key's createRevision is the fencing token
// losers: watch "/svc/leader"; on delete, try again
// leader: if keepalive fails or lease expires -&gt; stop leading NOW</code></pre>
<p>The official <code>concurrency.Election</code> helper does a fairer version: every candidate creates a key under a prefix, and the one with the lowest creation revision leads; each waits only on its predecessor.</p>
<p><strong>Leader election / lock with ZooKeeper:</strong> each client creates an <em>ephemeral sequential</em> znode like <code>/lock/n_0000000042</code>. The lowest sequence number holds the lock. Every other client watches <em>only the node just before it</em>, not the lock parent, which avoids the <strong>herd effect</strong> (1,000 clients woken on every release). If the holder's session dies, its ephemeral node disappears and the next one is notified. Apache Curator implements these recipes; use it rather than writing them by hand.</p>
<p><strong>Kubernetes Lease objects:</strong> controllers (scheduler, controller-manager, operators) elect a leader by updating a <code>Lease</code> resource with a holder identity and renew time, using optimistic concurrency on the object's resourceVersion. That CAS is backed by etcd's Raft, so it is consensus underneath.</p>

<h3>8. Distributed locks, leases and fencing tokens</h3>
<p>A distributed lock has two possible jobs, and you must say which one:</p>
<ul>
  <li><strong>Efficiency:</strong> avoid doing the same work twice (sending the same report email, rebuilding the same cache). If the lock occasionally fails, you waste a bit of work. Almost anything works, including a single Redis <code>SET key val NX PX 30000</code>.</li>
  <li><strong>Correctness:</strong> two holders would corrupt data or double-spend (two workers writing the same file, two schedulers charging the same invoice). Here a lock without fencing is not enough, no matter how good the lock service is.</li>
</ul>
<p>Why no lock alone is enough for correctness: the holder can pause at any point (stop-the-world GC, VM live migration, page faults on swap, a long network stall on its write). The lease expires, another client gets the lock, and then the first one wakes up and completes its write. It never "checked" that it still held the lock at the moment the write landed, and it can't: there is always a gap between checking and acting.</p>
<div class="diagram"><pre>
 Client 1        Lock service              Storage
    |  acquire -------&gt;|                       |
    |&lt;---- ok, token 33 |                       |
    |                   |                       |
    |  ~~ GC pause 40 s; lease (30 s) expires ~~|
    |                   |                       |
    |      Client 2 --&gt; | acquire               |
    |      Client 2 &lt;-- | ok, token 34          |
    |                   |  Client 2: write(34) -&gt;|  accepted
    |                   |                       |  highest = 34
    |  wakes up, still "holds" the lock         |
    |  write(data, token 33) ------------------&gt;|  REJECTED:
    |                   |                       |  33 &lt; 34
</pre></div>
<p><strong>Where the token comes from:</strong> etcd's key revision (or lease-scoped create revision), ZooKeeper's zxid or the znode sequence number, a database sequence. <strong>Where it is checked:</strong> the resource itself, for example <code>UPDATE files SET ... , fence = 34 WHERE id = ? AND fence &lt;= 34</code>, a conditional write in DynamoDB, or an object store with conditional puts. If the resource cannot check tokens, you cannot make the lock safe; redesign so the resource enforces exclusivity directly.</p>

<h3>9. Why Redlock is debated</h3>
<p><strong>Redlock</strong> (proposed by Redis's author) takes a lock on a majority of N independent Redis masters (typically 5) with the same random value and TTL, and treats the lock as held if a majority granted it within less time than the TTL. The debate (Martin Kleppmann's 2016 critique vs antirez's reply) comes down to:</p>
<ul>
  <li><strong>No fencing token.</strong> The random value proves ownership for <em>release</em>, but it is not monotonic, so a storage system cannot reject a stale holder. Every pause scenario above applies.</li>
  <li><strong>Timing assumptions.</strong> Safety depends on bounded clock drift, bounded process pauses and bounded network delay. If a Redis node's clock jumps forward (an NTP step, an operator change), its key expires early, and two clients can each believe they hold a majority.</li>
  <li><strong>Persistence.</strong> If a Redis node restarts without having fsynced the key, it forgets the lock and can grant it again; the recommended mitigation is delaying restarts by the max TTL.</li>
  <li><strong>The other side:</strong> antirez argues the random value can be used for check-and-set on the resource, that clock assumptions are reasonable with monotonic clocks and careful ops, and that most uses are for efficiency anyway.</li>
</ul>
<p><strong>The interview-safe position:</strong> "For efficiency, a single Redis <code>SET NX PX</code> is fine and Redlock adds little. For correctness, I want a lock built on consensus (etcd, ZooKeeper) that hands out fencing tokens, <em>and</em> a resource that checks them. Or better, no lock: push the exclusivity into the database with a unique constraint or a conditional update."</p>

<h3>10. Leader election patterns compared</h3>
<table>
  <thead><tr><th>Pattern</th><th>How it works</th><th>Good for</th><th>Watch out for</th></tr></thead>
  <tbody>
    <tr><td>Coordination-service lease (etcd, ZooKeeper, Consul)</td><td>Ephemeral key + lease; lowest revision/sequence wins</td><td>Schedulers, controllers, primary selection</td><td>Must stop work when the lease is lost; pass the revision as a fencing token</td></tr>
    <tr><td>Kubernetes Lease</td><td>CAS on a Lease object, renew every few seconds</td><td>Anything already running on Kubernetes</td><td>Lease duration ~15 s typical: failover is seconds, not ms</td></tr>
    <tr><td>Database row lease</td><td><code>UPDATE leader SET holder=?, expires=now()+30s WHERE expires &lt; now() OR holder=?</code></td><td>Small systems that already have one Postgres</td><td>DB clock is the source of truth (good); the DB itself is a single point unless replicated with failover</td></tr>
    <tr><td>Postgres advisory lock</td><td><code>pg_try_advisory_lock(key)</code> held by a session</td><td>Single-runner cron, migrations</td><td>Lock lives as long as the connection: poolers (PgBouncer transaction mode) break it; no fencing token</td></tr>
    <tr><td>Built into the data system</td><td>Kafka group coordinator assigns partitions; Raft-based DBs elect per range</td><td>Partition ownership, per-shard leaders</td><td>Rebalances pause consumption; generation/epoch numbers are the fencing tokens</td></tr>
  </tbody>
</table>
<p><strong>Epochs are fencing tokens with another name.</strong> Kafka's controller epoch and producer epoch, a consumer group's generation id, Raft's term, a database's timeline id after failover: all of them let the rest of the system reject a deposed leader. When you design a leader, design its epoch number, and make every downstream write carry it.</p>

<h3>11. Latency and placement</h3>
<ul>
  <li><strong>Single datacenter, 3 nodes across zones:</strong> commit ≈ one inter-zone round trip (~0.5-2 ms) + fsync (sub-ms on good NVMe, much worse on network disks). Typical write latency: a few ms.</li>
  <li><strong>Cross-region, 5 nodes over 3 regions (2-2-1):</strong> commit ≈ RTT from the leader to the nearest other region holding enough replicas, often 10-80 ms. Spanner and CockroachDB accept this for global strong consistency and hide it with leader placement near the writers.</li>
  <li><strong>Even split across 2 regions is a trap:</strong> 2 + 2 nodes means losing either region kills the majority; 3 + 2 means losing the 3-node region kills it. You need a third location (even a single tie-breaker node) to survive a region loss.</li>
  <li><strong>Failover time</strong> ≈ detection (election timeout, often ~1-10 s in production configs) + election (one round) + clients rediscovering the leader. Budget seconds, not milliseconds, and make clients retry idempotently (<a href="#/topic/be-resilience">Resilience</a>).</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Real systems, and where consensus sits in each</h3>
<table>
  <thead><tr><th>System</th><th>Consensus</th><th>What it is used for</th></tr></thead>
  <tbody>
    <tr><td>Kubernetes</td><td>etcd (Raft)</td><td>All cluster state; controllers elect leaders via Lease objects</td></tr>
    <tr><td>Kafka (KRaft mode)</td><td>Raft-based controller quorum</td><td>Cluster metadata, partition leadership. Replaced ZooKeeper; partition data itself is replicated with ISR, not Raft</td></tr>
    <tr><td>CockroachDB, TiKV/TiDB, YugabyteDB</td><td>Multi-Raft: one group per range/region (~64-512 MB each)</td><td>Every row's replication; thousands of groups per cluster spread the leaders</td></tr>
    <tr><td>Google Spanner</td><td>Paxos per split</td><td>Replication; 2PC across splits with Paxos-replicated participants; TrueTime for ordering</td></tr>
    <tr><td>Google Chubby</td><td>Paxos</td><td>Coarse-grained lock service that inspired ZooKeeper; famous for sequencers (fencing tokens)</td></tr>
    <tr><td>HBase, Hadoop HDFS HA</td><td>ZooKeeper</td><td>Active master election, region server liveness</td></tr>
    <tr><td>MongoDB replica sets</td><td>Raft-like protocol</td><td>Primary election; majority write concern for durable writes</td></tr>
    <tr><td>Consul / Nomad / Vault</td><td>Raft</td><td>Service catalog, scheduler state, secrets storage</td></tr>
    <tr><td>Amazon DynamoDB</td><td>Multi-Paxos per partition (2022 paper)</td><td>Each partition has 3 replicas across AZs; Multi-Paxos elects the leader and replicates the log; the leader takes writes and acks once 2 of 3 have it. Not to be confused with Dynamo (2007), which used leaderless sloppy quorums</td></tr>
    <tr><td>Redis Sentinel / Cluster</td><td>Not full consensus on data</td><td>Sentinels vote to fail over a master; async replication means acknowledged writes can be lost</td></tr>
  </tbody>
</table>
<p>Notice the pattern: many big data systems use consensus to pick the <em>leader</em> of each partition and then replicate data with a cheaper scheme (Kafka ISR). Others (CockroachDB, TiKV) put every write through Raft but split data into many small groups. Both are answers to "consensus is slow and doesn't scale writes". Compare with leaderless quorums in <a href="#/topic/bsd-bb-replication">Replication &amp; Quorums</a>.</p>

<h3>Example 1: the cron job that must run once</h3>
<p>A nightly billing job runs on 3 app instances for availability. Naively all 3 fire at 02:00.</p>
<ul>
  <li><strong>Level 1:</strong> elect a leader (etcd lease, Kubernetes Lease, or a DB row lease); only the leader runs the schedule.</li>
  <li><strong>Level 2:</strong> the leader pauses mid-run and loses its lease; the new leader starts the same run. Now the job must be <strong>idempotent per unit of work</strong>: each invoice charge carries an idempotency key like <code>invoice:2026-11:cust42</code>, enforced by a unique constraint (<a href="#/topic/be-architecture">Architecture</a> covers idempotency keys). The lock prevents waste; the constraint prevents double-charging.</li>
  <li><strong>Level 3:</strong> record progress with the leader's epoch: <code>UPDATE job_runs SET cursor=?, epoch=? WHERE id=? AND epoch &lt;= ?</code>, so a stale leader cannot move the cursor backwards.</li>
</ul>

<h3>Example 2: a meeting-room booking platform</h3>
<p>Two people tap "book" on the same room and slot within 100 ms. A tempting design: "take a distributed lock on room 12 + 10:00, check availability, insert". That adds a lock service, a TTL to tune and a pause hazard, and the database still has to be right.</p>
<p><strong>Better:</strong> let the database be the arbiter. An exclusion constraint on <code>(room_id, tstzrange(start, end))</code> in Postgres, or a unique index on <code>(room_id, slot)</code>, means the second insert fails cleanly and the app returns "just taken". The primary's own replication and failover already provide the agreement. Reserve coordination services for things the database can't express (cross-system leadership, config). See <a href="#/topic/bsd-bb-transactions">Distributed Transactions, Time &amp; IDs</a> and <a href="#/topic/be-databases">Databases</a>.</p>

<h3>Example 3: partition ownership in a consumer fleet</h3>
<p>A stream of device events is processed by 20 workers, and each device's events must be handled in order by one worker. You don't need your own election: Kafka's group coordinator assigns partitions, and the consumer group's <strong>generation id</strong> fences zombies (a consumer from an old generation can't commit offsets). If the processing writes to a DB, include the partition's generation or an offset check in the write so a revoked consumer that's still running can't overwrite newer results. See <a href="#/topic/be-kafka">Kafka</a> and <a href="#/topic/be-queues">Queues</a>.</p>

<h3>Example 4: config that must be the same everywhere</h3>
<p>A shard map must change atomically, or half the fleet writes to the wrong shard. Store it in etcd as one versioned key; services watch it, every request carries the map version, and shards reject versions older than they have accepted. That is fencing again, applied to configuration.</p>

<h3>Example 5 (FDE): "our jobs sometimes run twice"</h3>
<p>A customer on a self-hosted deployment reports that a nightly export occasionally produces duplicate rows, roughly once a week, always after nights with high load.</p>
<ol>
  <li><strong>Gather facts:</strong> which instance ran each copy (logs with instance id and timestamps), how leadership is decided, the lock TTL, GC logs and node CPU around the event.</li>
  <li><strong>Likely finding:</strong> a Redis <code>SET NX EX 30</code> lock, renewed every 10 s by a background thread. Under heavy load a 35-40 s full GC pause (or a CPU-starved container) stopped renewal; the key expired, a second instance acquired it and started the export; the first resumed and finished its run.</li>
  <li><strong>Immediate mitigation:</strong> make the export idempotent: a unique key per (export date, row id), or write to a staging table and swap atomically, so a second run is harmless.</li>
  <li><strong>Structural fix:</strong> take a fencing token with the lock (etcd revision or a DB sequence), store it on the export run, and make the final swap conditional on holding the highest token. Have the worker check the lease before each batch and abort when it is lost.</li>
  <li><strong>Explain to the customer:</strong> "Locks with timeouts can't be perfect when a process can freeze. We've made the export safe even if it runs twice, and added a check so a stale runner can't finish." Add an alert on "lease lost while running".</li>
</ol>

<h3>When would you pick what?</h3>
<table>
  <thead><tr><th>Situation</th><th>Pick</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Uniqueness of a business fact (seat, username, payment)</td><td>DB unique constraint / conditional write</td><td>The data store is already the arbiter; no extra moving parts</td></tr>
    <tr><td>Only one instance should run a periodic job</td><td>Kubernetes Lease, DB row lease or advisory lock, plus idempotent work</td><td>Leadership is coarse; idempotency covers the gaps</td></tr>
    <tr><td>Exclusive access to an external resource that can check a token</td><td>etcd / ZooKeeper lock + fencing token</td><td>Only safe combination for correctness</td></tr>
    <tr><td>Avoid duplicate expensive work, duplicates harmless</td><td>Redis <code>SET NX PX</code></td><td>Cheap, fast, good enough</td></tr>
    <tr><td>Cluster membership, service discovery, config</td><td>etcd / Consul / ZooKeeper</td><td>Small, critical, needs watches and linearizable updates</td></tr>
    <tr><td>Replicating a strongly consistent database</td><td>A DB that runs Raft/Paxos internally (CockroachDB, Spanner, TiDB) or a primary with managed failover</td><td>Don't build your own Raft</td></tr>
    <tr><td>High-volume, availability-first data</td><td>Leaderless quorums or async replication; no consensus on the write path</td><td>Consensus would cost latency and availability you don't need</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Even-sized clusters and two-node "HA"</h3>
<p>A 4-node cluster tolerates 1 failure, exactly like 3, but needs 3 acks per write. A 2-node cluster tolerates nothing, and if you "fix" that by letting one node continue alone when it can't see the other, you have built split brain: both sides think the other is dead. Use 3 or 5, and a third location for the tie-breaker.</p>

<h3>Process pauses longer than the lease</h3>
<p>Stop-the-world GC, VM live migration, a container throttled by CPU limits, swapping, or a blocking DNS lookup can freeze a process for seconds to minutes. A lease holder can't detect this from the inside: it wakes, reads the clock, and the next line of code is already past expiry. Only fencing at the resource fixes it.</p>

<h3>Clocks in lease logic</h3>
<p>Measure lease durations with a <strong>monotonic</strong> clock, never wall-clock time, which NTP can step backwards or forwards. Have the holder treat its lease as expiring <em>earlier</em> than the server does (subtract a safety margin for drift and the request latency spent acquiring it). Lease-based reads in Raft carry the same assumption.</p>

<h3>The minority-side leader</h3>
<p>During a partition, the old leader on the minority side may still accept requests until it notices. Raft won't commit them (no majority), so clients see timeouts, but if the leader serves reads from local state without ReadIndex or a lease check, those reads are stale. Check-quorum makes it step down within an election timeout.</p>

<h3>Disk latency becomes election storms</h3>
<p>etcd on a shared network disk or a noisy neighbour: fsync spikes to hundreds of ms, the leader misses heartbeats, followers start elections, the cluster flaps, and Kubernetes API calls start failing. Put consensus nodes on dedicated, low-latency SSDs and alert on fsync and leader-change rates.</p>

<h3>Watches miss events</h3>
<p>Classic ZooKeeper watches fire once; changes between the event and re-registering are invisible unless you re-read (3.6+ persistent watches via <code>addWatch</code> remove the re-register gap, but you still re-read after a disconnect). etcd watches resume from a revision, but if that revision has been compacted, the watch fails and you must re-list everything. Always treat a watch as "something changed, go re-read", not as a perfect change log.</p>

<h3>Membership change during a failure</h3>
<p>The canonical trap: a 3-node cluster loses one node, and the operator <em>adds</em> a replacement before removing the dead one. Now the cluster is 4 members with a majority of 3, but only 2 are healthy (the new one is still empty or not yet started), so it is below quorum and can't even commit the removal. Fix: <strong>remove the failed member first</strong> (2 of 3 healthy is still a majority), then add the replacement, one change at a time, and add new nodes as non-voting <em>learners</em> until they have caught up. Losing a majority permanently means disaster recovery from a snapshot, with possible loss of recent writes.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Releasing a lock you no longer own</h3>
<p><code>DEL lock:job</code> at the end of the work deletes whoever holds it <em>now</em>, possibly another worker whose lease began after yours expired. Release with a compare-and-delete on your unique value (a Lua script in Redis, a txn on revision in etcd).</p>

<h3>Check-then-act with a lock as the only guard</h3>
<p>"Acquire lock, read balance, write new balance" is safe only if nothing can pause between acquiring and writing. Something always can. Prefer a single conditional statement in the store (<code>UPDATE ... WHERE version = ?</code>), or fence the write.</p>

<h3>Putting the data path through the coordination service</h3>
<p>Storing user sessions, queues of jobs, or per-request counters in etcd or ZooKeeper. They're built for kilobytes and a few thousand writes/s; heavy write load slows every leader election and watch in the cluster, including the ones Kubernetes needs to stay alive.</p>

<h3>Writing your own consensus</h3>
<p>"Each node pings the others and the highest id becomes leader" is not partition-safe. Even well-reviewed Raft implementations have shipped subtle bugs; Jepsen has found safety violations in many databases' consensus and failover code. Use etcd, ZooKeeper, or a library such as etcd's raft or HashiCorp's raft, and test with fault injection.</p>

<h3>Ignoring "lease lost"</h3>
<p>Leader code that keeps running its loop after the keepalive fails. The callback for lost leadership must stop work immediately (or exit the process), not log a warning.</p>

<h3>Advisory locks through a connection pooler</h3>
<p>A session-level Postgres advisory lock taken through PgBouncer in transaction mode is held by whatever server connection ran it, and the next transaction may run on another one. The "leader" silently loses its lock, or another client inherits it.</p>

<h3>Calling a failover-based system "consensus"</h3>
<p>Redis Sentinel or a basic primary-replica setup with async replication elects a new primary, but acknowledged writes that hadn't reached the replica are lost, and an isolated old primary can keep accepting writes until it is fenced. Say what the durability guarantee actually is (see <a href="#/topic/bsd-bb-replication">Replication &amp; Quorums</a>).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block"><div class="qa-question">1. "Why do we need consensus at all? Can't the nodes just ping each other and pick the one with the highest id?"</div><div class="qa-answer">
<p>"Pinging can't distinguish a dead node from a slow or partitioned one. If the network splits into {A, B} and {C}, C sees A and B as dead and elects itself, while A and B pick A. Now there are two leaders taking writes: split brain. Consensus fixes this by requiring a <em>majority</em> for any decision. Only one side of any partition can have a majority, and any two majorities overlap, so two leaders can never both be confirmed for the same term. The price is that the minority side stops making progress during the partition. That's the CP choice."</p>
</div></div>

<div class="qa-block"><div class="qa-question">2. "Walk me through how Raft elects a leader."</div><div class="qa-answer">
<p>"Each follower has a randomised election timeout. If it hears no heartbeat in time, it becomes a candidate, increments the term, votes for itself, persists that, and asks everyone for votes. A node votes at most once per term, and only for a candidate whose log is at least as up to date as its own: compare last-entry term, then length. A majority of votes makes it leader, and it starts heartbeating. Split votes just time out and retry with fresh random timeouts and a higher term. Any node that sees a higher term in any message steps down to follower, which is how a stale leader gets deposed."</p>
</div></div>

<div class="qa-block"><div class="qa-question">3. "Why does the voter check that the candidate's log is up to date? What would break without it?"</div><div class="qa-answer">
<p>"Committed entries could be lost. An entry is committed once it's on a majority. If a node that missed it could win, it would become leader and overwrite followers' logs with its own, erasing an entry a client was already told succeeded. With the restriction, the candidate needs votes from a majority, that majority overlaps the majority holding the committed entry, and the overlapping voter refuses anyone behind it. So every leader has every committed entry: the <em>Leader Completeness</em> property."</p>
</div></div>

<div class="qa-block"><div class="qa-question">4. "When exactly is a write committed, and when does the client get its 'OK'?"</div><div class="qa-answer">
<p>"The leader appends the entry, replicates it with AppendEntries, and each follower fsyncs before acking. Once a majority including the leader has it durably, and it's from the leader's current term, the leader advances commitIndex, applies the entry to its state machine, and replies to the client. Followers apply it after they learn the new commitIndex. The current-term rule matters: an old-term entry on a majority can still be overwritten, so it's committed only indirectly, when a current-term entry after it commits. That's why a new leader appends a no-op right away."</p>
</div></div>

<div class="qa-block"><div class="qa-question">5. "The leader commits a write, replies OK, then crashes before followers learn the commit index. Is the write lost?"</div><div class="qa-answer">
<p>"No. Committed means it's on a majority's disks, not that everyone has applied it. The next leader must win votes from a majority, which overlaps the majority that has the entry, and the up-to-date check means the winner has it too. The new leader then commits its own no-op, which commits everything before it, including our write. The risk runs the other way: if the leader crashes after appending but <em>before</em> a majority had it, the client got no OK and the entry may vanish. The client should retry with an idempotency key, because it can't tell those two cases apart."</p>
</div></div>

<div class="qa-block"><div class="qa-question">6. "Are reads from the Raft leader always up to date?"</div><div class="qa-answer">
<p>"Not automatically. A leader cut off from the majority may not know a new leader exists yet, so a local read could be stale. Options: send the read through the log (correct, costly); ReadIndex, where the leader, once it has committed an entry from its own term (the no-op), confirms leadership with one heartbeat round to a majority and then reads at its commit index (etcd's default for linearizable reads); or lease reads, which skip the round trip by trusting that no election can finish within the lease window, which depends on bounded clock drift. If staleness is fine, read any follower. And in ZooKeeper, reads are served by the connected server and can be stale; sync() first makes them practically up to date."</p>
</div></div>

<div class="qa-block"><div class="qa-question">7. "How does Paxos differ from Raft? Which would you choose?"</div><div class="qa-answer">
<p>"Same safety idea: majority quorums plus a monotonic number (ballot or term), and a new proposer must re-propose any value that might already be chosen. Basic Paxos decides one value with prepare/promise then accept/accepted; Multi-Paxos keeps a stable leader so the steady state is one round trip per entry. Raft is roughly Multi-Paxos with extra rules: only up-to-date nodes can win, logs have no holes, and membership changes and snapshots are specified, which makes it easier to implement. I wouldn't choose either to implement. I'd choose a system: etcd or Consul (Raft), ZooKeeper (ZAB), or a database with Raft or Paxos inside."</p>
</div></div>

<div class="qa-block"><div class="qa-question">8. "Your etcd cluster is in one region. Product wants it to survive a region outage. What do you do, and what does it cost?"</div><div class="qa-answer">
<p>"Spread 5 members over 3 regions, like 2-2-1, so losing any one region leaves 3 of 5. Two regions can't do it: with 2+2 or 3+2, losing the larger side kills the majority. Cost: every write now waits for a cross-region ack, from the leader to the nearest region holding enough replicas, so commit latency goes from a few ms to tens of ms. Election timeouts must be raised above the cross-region RTT or there'll be spurious elections. Kubernetes usually does the opposite: one etcd per region-local cluster, with a separate control plane per region and no shared quorum across regions. I'd ask whether we need one global source of truth or can run one per region and federate."</p>
</div></div>

<div class="qa-block"><div class="qa-question">9. "Design a distributed lock for a job that writes to shared storage. Start simple."</div><div class="qa-answer">
<p>"First question: efficiency or correctness? If a duplicate run just wastes CPU, Redis <code>SET lock:job &lt;uuid&gt; NX PX 30000</code>, renewed while working and released with a compare-and-delete on the uuid, is enough. If a duplicate run corrupts data, I use etcd or ZooKeeper: acquire a lease-backed key, and take its revision (or znode sequence) as a <em>fencing token</em>. Every write to storage carries the token, and storage rejects tokens lower than the highest it has seen. The worker also checks its lease before each batch and stops the moment keepalive fails. The lock gives mostly-exclusive execution; the token makes it safe when the 'mostly' fails."</p>
</div></div>

<div class="qa-block"><div class="qa-question">10. "Your worker holds the lock, pauses for 40 s in GC, and the 30 s lease expires. Step through what happens with and without fencing."</div><div class="qa-answer">
<p>"Without fencing: worker 2 acquires the lock, writes; worker 1 wakes up, still believing it holds the lock, because from its own point of view no time passed, and overwrites worker 2's data. Checking 'do I still hold it?' right before writing doesn't help, since the pause can land between the check and the write. With fencing: worker 1 had token 33, worker 2 got 34 and wrote with 34, so storage recorded 34. Worker 1's write arrives with 33 and is rejected. Worker 1 sees the rejection, gives up, and the job state stays consistent. The lesson: the resource must enforce exclusivity, the client can't."</p>
</div></div>

<div class="qa-block"><div class="qa-question">11. "Why not Redlock? It uses a majority of Redis nodes, so isn't it consensus?"</div><div class="qa-answer">
<p>"It borrows the majority idea but not the guarantees. Three problems: it issues no monotonic token, so storage can't fence a stale holder; its safety depends on bounded clock drift and pauses, so a clock jump on one Redis node can expire a key early and let two clients each count a majority; and a Redis node that restarts without the key persisted can grant the lock again. Its defenders say careful ops and monotonic clocks make the timing assumptions reasonable, and that most locks are for efficiency anyway. My position: for efficiency, one Redis instance is enough and Redlock adds operational cost for little gain; for correctness, I want a consensus-backed lock with fencing tokens, or, best, no lock, with the database enforcing the invariant."</p>
</div></div>

<div class="qa-block"><div class="qa-question">12. "We have one Postgres. Do we even need etcd to elect a scheduler leader?"</div><div class="qa-answer">
<p>"Usually not. A lease row works: <code>UPDATE leader SET holder = $me, expires = now() + interval '30 s', epoch = CASE WHEN holder = $me THEN epoch ELSE epoch + 1 END WHERE name = 'scheduler' AND (expires &lt; now() OR holder = $me) RETURNING epoch</code>. One row means the database serialises the competition, now() is the database's clock so client clock skew doesn't matter, and epoch, which only increases when the holder changes, is a free fencing token for job-run writes. The weak point is that the leader election is only as available as that Postgres, but if the scheduler's work all needs that Postgres anyway, nothing is lost. I'd move to etcd or Kubernetes Leases when many services need leadership, or the coordination must outlive any single database."</p>
</div></div>

<div class="qa-block"><div class="qa-question">13. "We're seeing frequent leader elections in etcd and Kubernetes API calls failing intermittently. How would you investigate?"</div><div class="qa-answer">
<p>"Elections mean followers aren't getting heartbeats in time. First suspect: disk. etcd fsyncs every write, and slow fsync (a network disk, a noisy neighbour, a backup job) stalls the leader. I'd check the WAL fsync and backend commit duration metrics (etcd's guidance: WAL fsync p99 under ~10 ms, backend commit p99 under ~25 ms), leader-change counts, and peer round-trip times. Second: network. Packet loss or latency between members, especially cross-zone. Third: CPU starvation or GC on the members. Fourth: a large database or a write flood, say a controller hot-looping on updates or huge objects, making snapshots and compaction expensive. Fixes in that order: dedicated SSDs, tune the heartbeat and election timeouts to the real RTT, find and throttle the noisy writer, defragment and compact. Don't just raise the election timeout: that hides the problem and slows real failover."</p>
</div></div>

<div class="qa-block"><div class="qa-question">14. "Consensus doesn't scale writes. How does CockroachDB or Spanner still handle huge write volume with consensus on every write?"</div><div class="qa-answer">
<p>"They split the key space into many ranges, each a few hundred MB at most, and run a separate Raft or Paxos group per range, so a cluster has thousands of small groups with leaders spread across all nodes. Total write throughput scales with the number of ranges, while each write still pays one majority round trip within its group. Cross-range transactions add a 2PC layer whose participants are themselves replicated groups, so the coordinator can't block forever the way classic 2PC can. The costs are latency per write, especially cross-region, plus bookkeeping: range splits, leader rebalancing, and heartbeat traffic from thousands of groups, which they batch per node pair. It's the same move as sharding, applied to consensus groups. See <a href="#/topic/bsd-bb-partitioning">partitioning</a> and <a href="#/topic/bsd-bb-transactions">transactions</a>."</p>
</div></div>
` }

  ]
});
