window.PREP_SITE.registerTopic({
  id: "be-kafka",
  module: "backend-stack",
  title: "Kafka Deep",
  estimatedReadTime: "38 min",
  tags: ["kafka","streaming","event-log","partitions","consumer-groups","exactly-once","schema-registry","kafkajs","backend"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Kafka is a <strong>partitioned, replicated, append-only log</strong>: ordering and parallelism live in the <strong>partition</strong>, consumers are <strong>cursors</strong> (committed offsets per group), and delivery semantics are decided by <strong>when you commit</strong>.</div>
  <h4>Key points</h4>
  <ul>
    <li>A queue hands out work and forgets it; Kafka <strong>keeps an ordered history</strong> and each consumer group remembers where it is.</li>
    <li><strong>Topic → partitions → offsets.</strong> Ordering is per partition only; same key → same partition (hash mod N). Key = the entity whose order matters (orderId, deviceId, userId).</li>
    <li><strong>One partition → one consumer per group</strong>; partition count caps parallelism; extra consumers idle.</li>
    <li>Consumer groups are independent cursors → native fan-out and <strong>replay</strong> by resetting offsets.</li>
    <li>Committed offset = <strong>next offset to read</strong> (last handled + 1). <strong>Lag</strong> = log-end-offset − committed offset, per partition per group: THE health metric.</li>
    <li>Durability: <strong>RF=3, min.insync.replicas=2, acks=all</strong>, idempotent producer, unclean leader election off.</li>
    <li>Idempotent producer dedupes <em>retries</em> per partition (PID + sequence); it doesn't dedupe your app sending twice.</li>
    <li><strong>Exactly-once = Kafka→Kafka transactions</strong> (outputs + offsets atomic, stable transactional.id fences zombies, consumers read_committed). External side effects still need idempotency.</li>
    <li>Rebalances cause most duplicates; tame them with cooperative-sticky, static membership, graceful shutdown, short batches + heartbeats.</li>
    <li>Retention is time/size, not consumption. <strong>Compaction</strong> keeps latest value per key; null = tombstone.</li>
    <li>No native DLQ: build retry topics + DLQ; retry topics <strong>break per-key ordering</strong>.</li>
    <li>Schema registry: BACKWARD default (consumers first, new fields need defaults); wire format = magic byte + schema id + payload.</li>
    <li>Adding partitions remaps keys — size up front; can't reduce partitions.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Saying "Kafka guarantees ordering" or "Kafka gives exactly-once" without the qualifiers. Ordering is <strong>per partition, per key</strong>, and only while the partition count is fixed; exactly-once is <strong>within Kafka</strong> (transactions + read_committed) — the email or DB write your consumer does still happens at-least-once unless you make it idempotent.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Every Kafka design comes down to three choices: the key, which decides ordering and load spread; the partition count, which caps parallelism; and when I commit, which decides at-most-once versus at-least-once."</div>
  <div class="revision-say">"I run at-least-once with idempotent consumers by default, and use transactions only for Kafka-to-Kafka pipelines where exactly-once is actually achievable."</div>
  <div class="revision-say">"Most duplicate-processing incidents I've seen are rebalances, not broker failures — so I watch lag and rebalance counts, use cooperative-sticky assignment and static membership, and shut down gracefully."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What Kafka actually is</h3>
<p>Strip the marketing and Kafka is: a cluster of <strong>brokers</strong> that each store some <strong>partitions</strong>, where a partition is a set of append-only <strong>segment files</strong> on disk. Writes go to the end. Reads are sequential scans from an offset. Because both are sequential disk I/O (and lean heavily on the OS page cache and zero-copy <code>sendfile</code>), a modest cluster moves hundreds of MB/s.</p>
<p>Around that core you get: replication (each partition has a leader and followers), a <strong>group coordinator</strong> that assigns partitions to consumers, a metadata quorum (<strong>KRaft</strong> — Kafka's built-in Raft controller; ZooKeeper mode was removed in Kafka 4.0), plus ecosystem pieces: Kafka Connect (move data in/out of DBs, S3, etc.), Kafka Streams / ksqlDB (stream processing), Schema Registry (Confluent, separate service).</p>

<h3>Why teams pick it</h3>
<ul>
  <li><strong>Fan-out without coupling.</strong> One <code>order.placed</code> event; five teams consume it with five consumer groups. The producer never knows they exist.</li>
  <li><strong>Replay.</strong> Ship a bug in the search indexer? Fix it, reset that group's offsets to yesterday, rebuild. A queue that deleted acked messages can't do this.</li>
  <li><strong>Ordered per entity at scale.</strong> Per-key ordering with horizontal scale — something SQS standard queues don't give and FIFO queues give with throughput caps.</li>
  <li><strong>Throughput.</strong> Batching + compression + sequential I/O. Millions of small events per second is a normal Kafka workload.</li>
  <li><strong>Log as source of truth.</strong> Event sourcing, CDC (Debezium streaming DB changes into Kafka), materialised views that can be rebuilt from scratch.</li>
</ul>

<h3>Why teams regret it</h3>
<ul>
  <li>It's <strong>operationally heavy</strong> if self-hosted: broker sizing, disk, partition rebalancing, upgrades. Managed options (Confluent Cloud, AWS MSK, Aiven, Redpanda as a Kafka-API alternative) shift that, at a cost.</li>
  <li>It is <strong>not a job queue</strong>. No per-message ack, no per-message delay, no per-message visibility timeout, no built-in DLQ. One slow or poison message blocks its whole partition for that group.</li>
  <li>Partition count is a <strong>sticky decision</strong>: you can add partitions but it remaps keys (ordering breaks across the change), and you can't remove them.</li>
</ul>

<h3>Kafka vs SQS vs RabbitMQ</h3>
<table>
  <thead><tr><th></th><th>Kafka</th><th>SQS (standard / FIFO)</th><th>RabbitMQ (classic/quorum queues)</th></tr></thead>
  <tbody>
    <tr><td>Model</td><td>Replicated log; consumers track offsets</td><td>Managed queue; message deleted after ack</td><td>Broker with exchanges → queues; message removed on ack</td></tr>
    <tr><td>Retention</td><td>Time/size or compaction, independent of consumption</td><td>Until deleted, max retention period (check AWS docs; historically up to 14 days)</td><td>Until acked (streams feature adds log semantics)</td></tr>
    <tr><td>Ordering</td><td>Per partition (per key)</td><td>None (standard) / per message group (FIFO)</td><td>Per queue, single consumer; lost with competing consumers + requeue</td></tr>
    <tr><td>Fan-out</td><td>Native: N consumer groups</td><td>Via SNS → N queues</td><td>Native via fanout/topic exchanges</td></tr>
    <tr><td>Replay</td><td>Yes — seek / reset offsets</td><td>No</td><td>No (except Streams)</td></tr>
    <tr><td>Per-message ack / retry / delay</td><td>No — offset is a high-water mark per partition</td><td>Yes — visibility timeout, DLQ via redrive policy, delay queues</td><td>Yes — ack/nack, DLX, TTL, priority</td></tr>
    <tr><td>Scale unit</td><td>Partitions</td><td>Effectively unlimited (standard)</td><td>Queues / nodes</td></tr>
    <tr><td>Ops</td><td>Heavy (or pay for managed)</td><td>Zero</td><td>Medium</td></tr>
    <tr><td>Sweet spot</td><td>Event streams, CDC, analytics pipelines, many consumers, replay</td><td>Task queues on AWS, decoupling Lambdas</td><td>Complex routing, RPC-ish work queues, priorities</td></tr>
  </tbody>
</table>
<p>For the SQS side in depth, see <a href="#/topic/cloud-sqs">AWS SQS</a>.</p>

<div class="callout note">
  <div class="callout-title">Rule of thumb</div>
  <p>"Do this job once, retry it, then park it" → a queue. "This happened; whoever cares can read it, now or later, in order" → Kafka. Many real systems use both: Kafka as the event backbone, a queue (or BullMQ) for the heavy per-task work a consumer kicks off.</p>
</div>

<div class="callout info">
  <div class="callout-title">KafkaJS status</div>
  <p>KafkaJS (pure JavaScript client, used in the code below) is widely deployed but its maintenance slowed significantly after 2023. Confluent now publishes <code>@confluentinc/kafka-javascript</code> (librdkafka-based) with a KafkaJS-compatible API mode. For a new production service, check current docs for both before choosing. The concepts and configs below are client-agnostic.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — a topic is N independent logs</h3>
<div class="diagram">
<pre>
 topic: orders  (3 partitions)

 P0 │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ ...        ← append here
 P1 │ 0 │ 1 │ 2 │ 3 │ ...
 P2 │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ ...

 key "order-42" ──hash(key) % 3──► always P1   (ordered among themselves)
 key "order-77" ──hash(key) % 3──► always P0
 no key        ──► sticky partitioner: fills a batch on one partition, then moves on

 Offsets are per partition. "Offset 4" means nothing without "of which partition".
</pre>
</div>

<h3>Picture 2 — consumer groups each own a cursor</h3>
<div class="diagram">
<pre>
                    ┌─────────── orders (P0, P1, P2) ───────────┐
                    │                                           │
   group: billing   │  C1 ◄─ P0, P1        C2 ◄─ P2             │  committed: P0=812 P1=640 P2=901
   group: search    │  C1 ◄─ P0  C2 ◄─ P1  C3 ◄─ P2  C4 (idle!) │  committed: P0=500 P1=410 P2=455
   group: audit     │  C1 ◄─ P0, P1, P2                         │  committed: P0=12  P1=9   P2=30
                    └───────────────────────────────────────────┘

 • Within a group: one partition → exactly one consumer. Extra consumers sit idle.
 • Across groups: totally independent. "search" being slow never slows "billing".
 • Lag = log-end-offset − committed offset, per partition. THE health metric.
</pre>
</div>

<h3>Picture 3 — replication and the in-sync replica set</h3>
<div class="diagram">
<pre>
 partition orders-P1, replication.factor = 3, min.insync.replicas = 2

   Broker 1 (LEADER)     Broker 2 (follower)    Broker 3 (follower)
   ... 98 99 100 101     ... 98 99 100 101      ... 98 99           ← lagging
   └──────────── ISR = {1, 2} ────────────┘     (dropped from ISR until it catches up)

 high-watermark (HW) = highest offset replicated to ALL ISR members = 101
 consumers only see up to HW  → they never read a write that could be lost

 producer acks=all → leader waits for every ISR member, then acks.
 if ISR shrinks below min.insync.replicas → writes with acks=all FAIL
   (NotEnoughReplicas) — Kafka chooses unavailability over silent data loss.
</pre>
</div>

<h3>Picture 4 — where a record goes on the producer side</h3>
<div class="diagram">
<pre>
 send(record)
   │
   ├─ serialize key + value (JSON / Avro / Protobuf)
   ├─ partitioner: key ? hash(key) % N : sticky
   ├─ RecordAccumulator: per-partition batch  ── waits up to linger.ms or batch.size
   ├─ compression (per batch: gzip / snappy / lz4 / zstd)
   └─ sender → leader broker of that partition
           │  acks=0   → fire &amp; forget
           │  acks=1   → leader wrote it
           │  acks=all → all ISR wrote it
           └─ retries with (producerId, sequence#) → broker dedupes = idempotence
</pre>
</div>

<h3>The four ideas that make everything else make sense</h3>
<ol>
  <li><strong>The log is immutable; consumers are just cursors.</strong> Consuming doesn't delete anything. Retention deletes old segments on a timer regardless of who has read them.</li>
  <li><strong>The partition is the unit of everything:</strong> ordering, parallelism, replication, leadership, and the commit high-water mark.</li>
  <li><strong>A committed offset is a single number per (group, partition)</strong> — "I've handled everything before this". There is no "message 57 failed but 58 succeeded" — which is why poison messages are a design problem.</li>
  <li><strong>Rebalances move partitions between consumers.</strong> Anything processed but not committed when ownership moves gets processed again by the new owner. That's where most duplicates come from.</li>
</ol>

<div class="callout warn">
  <div class="callout-title">Frontend analogy (and where it breaks)</div>
  <p>Think of a partition like an append-only Redux action log and a consumer group like a reducer that remembers the index of the last action it applied. Replay = re-run the reducer from index 0. Where it breaks: unlike a Redux store, a Kafka consumer's side effects (DB writes, emails) are <em>not</em> undone when you rewind — so replays must be idempotent.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Cluster and topic setup</h3>
<p>Brokers hold partition replicas; the KRaft controller quorum holds metadata (topics, partition leaders, ISR). Each partition has one leader that serves all reads and writes (follower fetching from nearest replica exists via rack-aware config — check current docs). Topics are created with a partition count, replication factor and per-topic config overrides.</p>
<pre><code class="language-ts">// admin.ts — create topics idempotently at deploy time (or via IaC / Terraform)
import { Kafka, logLevel } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'orders-service',
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_USER
    ? { mechanism: 'scram-sha-512', username: process.env.KAFKA_USER, password: process.env.KAFKA_PASS! }
    : undefined,
  logLevel: logLevel.WARN,
});

export async function ensureTopics(): Promise&lt;void&gt; {
  const admin = kafka.admin();
  await admin.connect();
  try {
    await admin.createTopics({
      waitForLeaders: true,
      topics: [
        {
          topic: 'orders.v1',
          numPartitions: 12,
          replicationFactor: 3,
          configEntries: [
            { name: 'min.insync.replicas', value: '2' },
            { name: 'retention.ms', value: String(7 * 24 * 60 * 60 * 1000) }, // 7 days
            { name: 'cleanup.policy', value: 'delete' },
          ],
        },
        {
          topic: 'device-state.v1',          // latest value per device, forever
          numPartitions: 6,
          replicationFactor: 3,
          configEntries: [{ name: 'cleanup.policy', value: 'compact' }],
        },
      ],
    }); // returns false (no throw) if topics already exist
  } finally {
    await admin.disconnect();
  }
}
</code></pre>

<h3>2. Producer: acks, idempotence, batching, keys</h3>
<table>
  <thead><tr><th>Config (Java client name)</th><th>What it does</th><th>Senior default</th></tr></thead>
  <tbody>
    <tr><td><code>acks</code></td><td>0 = don't wait; 1 = leader only; all (-1) = all ISR</td><td><code>all</code> for anything you can't lose</td></tr>
    <tr><td><code>enable.idempotence</code></td><td>Broker dedupes retries using producerId + per-partition sequence numbers. Prevents duplicates <em>and</em> reordering from retries.</td><td>On (default on in modern Java clients since 3.0; in KafkaJS pass <code>idempotent: true</code>)</td></tr>
    <tr><td><code>max.in.flight.requests.per.connection</code></td><td>Unacked requests per broker connection</td><td>≤ 5 with idempotence keeps ordering; KafkaJS docs historically required 1 for idempotent mode — check current docs</td></tr>
    <tr><td><code>retries</code> / <code>delivery.timeout.ms</code></td><td>How long the client keeps retrying a send</td><td>Bound total time with delivery timeout, not retry count</td></tr>
    <tr><td><code>linger.ms</code></td><td>Wait to fill a batch</td><td>5–20 ms for throughput; default changed across versions — check docs</td></tr>
    <tr><td><code>batch.size</code></td><td>Max bytes per partition batch</td><td>16 KB default; 64–256 KB for high-volume topics</td></tr>
    <tr><td><code>compression.type</code></td><td>Per-batch compression</td><td><code>zstd</code> or <code>lz4</code> (snappy is fine too); JSON compresses 5–10×</td></tr>
    <tr><td><code>max.request.size</code> / broker <code>message.max.bytes</code></td><td>Max record/batch size</td><td>~1 MB default. Big payloads → store in S3, send a pointer</td></tr>
  </tbody>
</table>

<h4>Keys → ordering</h4>
<p>The default partitioner hashes the key (murmur2 in the Java client) modulo partition count. Consequences:</p>
<ul>
  <li>All events for one key land in one partition → strict order for that key.</li>
  <li><strong>Skewed keys = hot partitions.</strong> A key like <code>tenantId</code> where one tenant is 40% of traffic pins 40% of load to one partition and one consumer.</li>
  <li><strong>Changing partition count changes the mapping.</strong> Key K was on P3, is now on P7; for a while P3 and P7 both hold K's events and two consumers may process them concurrently.</li>
  <li>KafkaJS 2.x changed its default partitioner to be Java-compatible and logs a warning; <code>Partitioners.LegacyPartitioner</code> keeps the old mapping. Mixed-language producers on the same topic must agree on the partitioner, or "same key → same partition" silently breaks.</li>
</ul>

<pre><code class="language-ts">// producer.ts
import { CompressionTypes, Partitioners, Producer } from 'kafkajs';
import { kafka } from './admin';

let producer: Producer | null = null;

export async function getProducer(): Promise&lt;Producer&gt; {
  if (producer) return producer;
  producer = kafka.producer({
    idempotent: true,                 // dedupe retries on the broker
    maxInFlightRequests: 1,           // conservative ordering guarantee in KafkaJS
    createPartitioner: Partitioners.DefaultPartitioner,
    retry: { retries: 8, initialRetryTime: 100 },
  });
  await producer.connect();
  return producer;
}

export async function publishOrderEvent(evt: { orderId: string; type: string; payload: unknown }) {
  const p = await getProducer();
  await p.send({
    topic: 'orders.v1',
    acks: -1,                                  // = all ISR
    compression: CompressionTypes.GZIP,        // snappy/lz4/zstd need codec packages in KafkaJS
    messages: [{
      key: evt.orderId,                        // ordering unit = one order
      value: JSON.stringify({ ...evt, occurredAt: new Date().toISOString() }),
      headers: { 'event-type': evt.type, 'event-id': crypto.randomUUID() },
    }],
  });
}
</code></pre>

<h3>3. Consumer: poll loop, offsets, commits</h3>
<p>Under the hood every client runs the same loop: <em>fetch a batch for my assigned partitions → hand records to your code → periodically commit "next offset to read" per partition to the internal <code>__consumer_offsets</code> topic</em>. KafkaJS wraps this in <code>consumer.run({ eachMessage | eachBatch })</code>.</p>
<table>
  <thead><tr><th>Config</th><th>Meaning</th><th>Gotcha</th></tr></thead>
  <tbody>
    <tr><td><code>group.id</code></td><td>Which group (and so which offsets) you belong to</td><td>New group id = new cursor. Renaming the group in a deploy = reprocess or skip, depending on reset policy</td></tr>
    <tr><td><code>auto.offset.reset</code></td><td>Where to start when there is no committed offset: <code>earliest</code> / <code>latest</code></td><td>KafkaJS equivalent: <code>fromBeginning</code> on subscribe. <code>latest</code> silently skips everything produced before first start</td></tr>
    <tr><td><code>enable.auto.commit</code> / <code>auto.commit.interval.ms</code></td><td>Commit periodically in the background</td><td>Java auto-commit commits what was <em>polled</em>; KafkaJS auto-commit commits what your handler <em>resolved</em>. Know your client</td></tr>
    <tr><td><code>session.timeout.ms</code> + <code>heartbeat.interval.ms</code></td><td>Liveness via background heartbeats</td><td>Missed heartbeats → kicked out → rebalance</td></tr>
    <tr><td><code>max.poll.interval.ms</code></td><td>Max time between polls (Java) before the consumer is considered stuck</td><td>Slow handlers trigger rebalances even though the process is alive. KafkaJS: call <code>heartbeat()</code> inside long batches</td></tr>
    <tr><td><code>isolation.level</code></td><td><code>read_uncommitted</code> / <code>read_committed</code></td><td>Must be read_committed to get EOS from transactional producers. KafkaJS: <code>readUncommitted: false</code> (default)</td></tr>
    <tr><td><code>partition.assignment.strategy</code></td><td>Range, RoundRobin, Sticky, CooperativeSticky</td><td>Cooperative = incremental rebalances (no stop-the-world)</td></tr>
  </tbody>
</table>

<div class="callout warn">
  <div class="callout-title">The committed offset is "next to read", not "last read"</div>
  <p>If you commit manually after handling offset 41, you commit <strong>42</strong>. Committing 41 means 41 is redelivered after a restart. KafkaJS: <code>(BigInt(message.offset) + 1n).toString()</code> or <code>Number(...) + 1</code>.</p>
</div>

<h3>4. Delivery semantics = commit placement</h3>
<table>
  <thead><tr><th>Order of operations</th><th>Crash between the two steps →</th><th>Semantics</th></tr></thead>
  <tbody>
    <tr><td>commit → process</td><td>offset moved, work never done</td><td>At-most-once (lose)</td></tr>
    <tr><td>process → commit</td><td>work done, offset not moved → redo</td><td>At-least-once (duplicate)</td></tr>
    <tr><td>process + write output + commit offset in <strong>one Kafka transaction</strong></td><td>all-or-nothing</td><td>Exactly-once (Kafka → Kafka only)</td></tr>
    <tr><td>process + store offset in <strong>your DB transaction</strong>, seek from DB on startup</td><td>all-or-nothing</td><td>Effectively-once (Kafka → DB)</td></tr>
  </tbody>
</table>
<p>The generic theory of these three semantics is in <a href="#/topic/be-queues">Queues &amp; Async Processing</a>. What's Kafka-specific: (a) commits are per partition high-water marks, (b) rebalances cause the "crash between" case even with no crash, and (c) Kafka has a native transactional path for Kafka-to-Kafka pipelines.</p>

<h3>5. Exactly-once: idempotent producer + transactions</h3>
<ul>
  <li><strong>Idempotent producer</strong>: broker assigns a producerId (PID); each batch carries a per-partition sequence number; duplicates and out-of-order sequences are rejected. Scope: one producer session, one partition, retries only. It doesn't dedupe your app calling <code>send()</code> twice.</li>
  <li><strong>Transactions</strong> (<code>transactional.id</code>): atomically write to many partitions <em>and</em> commit consumer offsets. A stable transactional id + epoch lets the broker <strong>fence zombies</strong> — an old instance that wakes up after a GC pause can't commit.</li>
  <li><strong>read_committed consumers</strong> skip records from aborted transactions and don't read past the last stable offset (LSO).</li>
  <li><strong>Limit:</strong> your HTTP call, email, or Postgres write is outside the transaction. For those you still need idempotency keys or an inbox table.</li>
</ul>

<h3>6. Rebalancing</h3>
<div class="diagram">
<pre>
 Triggers: consumer joins / leaves / crashes / misses heartbeats / exceeds max.poll.interval
           / subscription changes / partitions added

 EAGER (classic):                         COOPERATIVE (incremental):
   all consumers revoke ALL partitions      only partitions that MOVE are revoked
   ─ stop the world ─                       others keep processing
   rejoin, new assignment                   usually two short rounds

 Static membership (group.instance.id): a restarting pod with the same instance id
 gets its partitions back without a rebalance, if it returns within session.timeout.

 New protocol (KIP-848, "consumer" group protocol): broker-side assignment, no
 global sync barrier; GA in Kafka 4.0 for the Java client — client support varies,
 check current docs.
</pre>
</div>
<p>Rolling deploys of a 20-pod consumer with eager assignment can cause 20 back-to-back rebalances. Mitigations: cooperative-sticky assignment, static membership, longer session timeouts, and committing on partition revocation (KafkaJS emits <code>consumer.events.REBALANCING</code> / <code>GROUP_JOIN</code>; commit pending offsets before giving partitions up).</p>

<h3>7. Retention and compaction</h3>
<table>
  <thead><tr><th>Setting</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>cleanup.policy=delete</code></td><td>Delete whole <em>segments</em> older than <code>retention.ms</code> (default 7 days) or beyond <code>retention.bytes</code> per partition</td></tr>
    <tr><td><code>cleanup.policy=compact</code></td><td>Background cleaner keeps at least the latest record per key; older values for that key are removed. A <strong>null value (tombstone)</strong> deletes the key after <code>delete.retention.ms</code></td></tr>
    <tr><td><code>compact,delete</code></td><td>Compact, but also drop anything older than retention</td></tr>
    <tr><td><code>segment.ms</code> / <code>segment.bytes</code></td><td>When the active segment rolls. Retention and compaction never touch the active segment — a low-traffic topic can keep "expired" data until the segment rolls</td></tr>
    <tr><td><code>min.compaction.lag.ms</code></td><td>Guarantee a record stays un-compacted for at least this long (so consumers see intermediate values)</td></tr>
  </tbody>
</table>
<p>Compacted topics are how you model "a table as a stream": latest config per device, latest profile per user, Kafka Streams state-store changelogs, and Kafka's own <code>__consumer_offsets</code>. A new consumer reading a compacted topic from the beginning rebuilds the current state.</p>
<p><strong>Tiered storage</strong> (KIP-405, production-ready in 3.9 per release notes — check current docs and your provider) moves older segments to object storage so retention can be long without huge broker disks.</p>

<h3>8. Schema Registry</h3>
<p>Raw JSON on a topic with 6 consumer teams is a time bomb: someone renames a field and three services fail at 2 a.m. Schema Registry (Confluent's, or compatible ones like Apicurio/Karapace) stores versioned Avro / Protobuf / JSON Schema definitions per <em>subject</em> (default naming: <code>&lt;topic&gt;-value</code>, <code>&lt;topic&gt;-key</code>) and enforces a compatibility rule on registration.</p>
<table>
  <thead><tr><th>Mode</th><th>Guarantee</th><th>Allowed changes (Avro intuition)</th><th>Deploy order</th></tr></thead>
  <tbody>
    <tr><td>BACKWARD (default)</td><td>New schema can read data written with the previous one</td><td>Delete fields; add fields <em>with defaults</em></td><td>Upgrade consumers first</td></tr>
    <tr><td>FORWARD</td><td>Old schema can read data written with the new one</td><td>Add fields; delete fields that had defaults</td><td>Upgrade producers first</td></tr>
    <tr><td>FULL</td><td>Both</td><td>Only add/remove optional (defaulted) fields</td><td>Any order</td></tr>
    <tr><td>*_TRANSITIVE</td><td>Same, checked against all previous versions, not just the last</td><td>—</td><td>—</td></tr>
  </tbody>
</table>
<p>Wire format (Confluent serializers): 1 magic byte (0) + 4-byte schema id + payload. Consumers fetch the schema by id (and cache it), so producers and consumers never need to ship schemas inline.</p>
<pre><code class="language-ts">// schema.ts — using @kafkajs/confluent-schema-registry
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';

const registry = new SchemaRegistry({ host: process.env.SCHEMA_REGISTRY_URL! });

const orderPlacedV1 = {
  type: 'record', name: 'OrderPlaced', namespace: 'com.example.orders',
  fields: [
    { name: 'orderId', type: 'string' },
    { name: 'amountMinor', type: 'long' },
    { name: 'currency', type: 'string' },
    { name: 'couponCode', type: ['null', 'string'], default: null }, // optional = safe to add
  ],
};

export async function registerSchemas() {
  const { id } = await registry.register(
    { type: SchemaType.AVRO, schema: JSON.stringify(orderPlacedV1) },
    { subject: 'orders.v1-value' },
  );
  return id;
}

export const encode = (schemaId: number, payload: object) =&gt; registry.encode(schemaId, payload);
export const decode = (buf: Buffer) =&gt; registry.decode(buf); // schema id is read from the bytes
</code></pre>

<h3>9. Security and multi-tenancy (what interviewers poke at)</h3>
<ul>
  <li><strong>Encryption:</strong> TLS listeners. <strong>AuthN:</strong> SASL/SCRAM, mTLS, SASL/OAUTHBEARER, or IAM auth on AWS MSK (separate client library/mechanism — check current docs for Node support).</li>
  <li><strong>AuthZ:</strong> ACLs per principal on topic / group / transactional-id resources (e.g. service A may WRITE <code>orders.*</code>, service B may READ <code>orders.v1</code> with group <code>billing</code>).</li>
  <li><strong>Quotas:</strong> per-client produce/fetch byte-rate quotas so one noisy tenant can't starve the cluster.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — At-least-once consumer with manual commits and an idempotent write</h3>
<p>Scenario: meeting-room booking events (<code>booking.created</code>, <code>booking.cancelled</code>) keyed by <code>roomId</code> so each room's history is ordered. A projector service maintains a "room schedule" table read by wall-mounted tablets.</p>
<pre><code class="language-ts">// booking-projector.ts
import { Consumer, EachBatchPayload } from 'kafkajs';
import { kafka } from './admin';
import { db } from './db'; // e.g. a pg Pool

const consumer: Consumer = kafka.consumer({
  groupId: 'room-schedule-projector',
  sessionTimeout: 30_000,
  heartbeatInterval: 3_000,
});

type BookingEvent = {
  eventId: string;
  type: 'booking.created' | 'booking.cancelled';
  roomId: string;
  bookingId: string;
  start: string;
  end: string;
  version: number;   // per-booking version, monotonically increasing
};

async function apply(evt: BookingEvent) {
  // Idempotent + order-safe: only apply if this version is newer than what we have.
  await db.query(
    'INSERT INTO room_schedule (booking_id, room_id, starts_at, ends_at, status, version) ' +
    'VALUES ($1, $2, $3, $4, $5, $6) ' +
    'ON CONFLICT (booking_id) DO UPDATE SET ' +
    '  starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at, ' +
    '  status = EXCLUDED.status, version = EXCLUDED.version ' +
    'WHERE room_schedule.version &lt; EXCLUDED.version',
    [evt.bookingId, evt.roomId, evt.start, evt.end,
     evt.type === 'booking.cancelled' ? 'cancelled' : 'active', evt.version],
  );
}

export async function start() {
  await consumer.connect();
  await consumer.subscribe({ topics: ['bookings.v1'], fromBeginning: true });

  await consumer.run({
    autoCommit: false,
    partitionsConsumedConcurrently: 4,         // parallel across partitions, still ordered within one
    eachBatchAutoResolve: false,
    eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary, isRunning, isStale }: EachBatchPayload) =&gt; {
      for (const message of batch.messages) {
        if (!isRunning() || isStale()) break;   // partition revoked mid-batch → stop
        const evt = JSON.parse(message.value!.toString()) as BookingEvent;
        await apply(evt);                       // throws → batch retried from last resolved offset
        resolveOffset(message.offset);          // mark as done (KafkaJS commits offset + 1)
        await heartbeat();                      // keep the session alive during long batches
      }
      await commitOffsetsIfNecessary();
    },
  });
}
</code></pre>
<p>Why it's safe: process-then-commit gives at-least-once; the <code>version</code> guard turns duplicates and replays into no-ops. Key = <code>roomId</code> keeps one room's events ordered; the version check additionally protects against out-of-order delivery if keys ever change.</p>

<h3>Example 2 — Retry topics and a DLQ (Kafka has no built-in one)</h3>
<div class="diagram">
<pre>
 orders.v1 ──► main consumer ──ok──► commit
                    │ transient error (timeout, 503)
                    ▼
              orders.retry.1m ──► retry consumer (waits until ts + 1m) ──fail──► orders.retry.10m
                                                                                │ fail
                                                                                ▼
                                                                          orders.dlq ──► alert + manual replay tool
                    │ permanent error (validation, unknown schema)
                    └──────────────────────────────────────────────────────────► orders.dlq
</pre>
</div>
<pre><code class="language-ts">// error-routing.ts
import { KafkaMessage } from 'kafkajs';
import { getProducer } from './producer';

class PermanentError extends Error {}

const NEXT_TOPIC: Record&lt;string, string&gt; = {
  'orders.v1': 'orders.retry.1m',
  'orders.retry.1m': 'orders.retry.10m',
  'orders.retry.10m': 'orders.dlq',
};

export async function routeFailure(topic: string, msg: KafkaMessage, err: unknown) {
  const target = err instanceof PermanentError ? 'orders.dlq' : NEXT_TOPIC[topic] ?? 'orders.dlq';
  const attempts = Number(msg.headers?.['x-attempts']?.toString() ?? '0') + 1;
  const p = await getProducer();
  await p.send({
    topic: target,
    messages: [{
      key: msg.key,                              // keep the key so per-key grouping survives
      value: msg.value,
      headers: {
        ...msg.headers,
        'x-attempts': String(attempts),
        'x-original-topic': String(msg.headers?.['x-original-topic'] ?? topic),
        'x-error': String((err as Error)?.message ?? err).slice(0, 500),
        'x-failed-at': String(Date.now()),
      },
    }],
  });
  // Caller then commits the original offset: the message is "handled" by being parked.
}

// Retry consumer: delay WITHOUT sleeping through max.poll / session timeouts.
// Pause the partition, resume it when the head message becomes due.
// consumer.pause([{ topic, partitions: [partition] }]);
// setTimeout(() =&gt; consumer.resume([{ topic, partitions: [partition] }]), dueInMs);
// then throw/skip resolveOffset so the same message is fetched again after resume.
</code></pre>
<div class="callout warn">
  <div class="callout-title">The trade-off you must say out loud</div>
  <p>Non-blocking retry topics <strong>break per-key ordering</strong>: event 2 for order-42 can be processed while event 1 sits in the retry topic. If ordering matters for that entity, either block the partition (retry in place with backoff, accept the lag) or park <em>all subsequent events for that key</em> until the failed one clears.</p>
</div>

<h3>Example 3 — Consume → transform → produce with exactly-once</h3>
<p>Scenario: enrich raw sensor readings (<code>telemetry.raw</code>) into per-room occupancy aggregates (<code>occupancy.v1</code>). Both sides are Kafka, so transactions apply.</p>
<pre><code class="language-ts">// enricher-eos.ts
import { kafka } from './admin';

const groupId = 'occupancy-enricher';
// transactionalId must be STABLE per logical instance (e.g. pod ordinal), not random,
// so a restarted instance fences its own zombie predecessor.
const producer = kafka.producer({
  transactionalId: 'occupancy-enricher-' + (process.env.POD_ORDINAL ?? '0'),
  idempotent: true,
  maxInFlightRequests: 1,
});
const consumer = kafka.consumer({ groupId, readUncommitted: false });

export async function run() {
  await Promise.all([producer.connect(), consumer.connect()]);
  await consumer.subscribe({ topics: ['telemetry.raw'] });

  await consumer.run({
    autoCommit: false,
    eachBatchAutoResolve: false,
    eachBatch: async ({ batch, resolveOffset, heartbeat }) =&gt; {
      const tx = await producer.transaction();
      try {
        for (const m of batch.messages) {
          const reading = JSON.parse(m.value!.toString());
          await tx.send({
            topic: 'occupancy.v1',
            messages: [{ key: reading.roomId, value: JSON.stringify(toOccupancy(reading)) }],
          });
          resolveOffset(m.offset);
        }
        const last = batch.messages[batch.messages.length - 1];
        await tx.sendOffsets({
          consumerGroupId: groupId,
          topics: [{
            topic: batch.topic,
            partitions: [{ partition: batch.partition, offset: (BigInt(last.offset) + 1n).toString() }],
          }],
        });
        await tx.commit();        // output records + consumer offsets become visible atomically
      } catch (e) {
        await tx.abort();         // read_committed consumers never see the partial output
        throw e;                  // KafkaJS retries the batch from the last committed offset
      }
      await heartbeat();
    },
  });
}

function toOccupancy(r: { roomId: string; people: number; ts: number }) {
  return { roomId: r.roomId, occupied: r.people &gt; 0, people: r.people, ts: r.ts };
}
</code></pre>

<h3>Example 4 — Compacted topic as a device-config table</h3>
<p>A fleet of kiosks/tablets needs "current config per device" (brightness schedule, room assignment, feature flags). Publish to a compacted topic keyed by <code>deviceId</code>; the gateway service reads it from the beginning on boot to build an in-memory map, then stays subscribed for updates.</p>
<pre><code class="language-ts">// device-config-cache.ts
const configByDevice = new Map&lt;string, DeviceConfig&gt;();

await consumer.subscribe({ topics: ['device-config.v1'], fromBeginning: true });
await consumer.run({
  eachMessage: async ({ message }) =&gt; {
    const id = message.key!.toString();
    if (message.value === null) {          // tombstone → device decommissioned
      configByDevice.delete(id);
      return;
    }
    configByDevice.set(id, JSON.parse(message.value.toString()));
  },
});

// Decommission a device: publish a tombstone (null value) for its key.
await producer.send({ topic: 'device-config.v1', messages: [{ key: 'kiosk-0193', value: null }] });
</code></pre>
<p>Each gateway instance uses its <em>own</em> group id (or no committed offsets at all) because every instance needs <em>all</em> partitions, not a share of them — a common mistake is putting them in one group and wondering why each instance only knows a third of the devices. (For pushing those configs on to the devices themselves, MQTT is the usual last hop — see <a href="#/topic/be-mqtt">MQTT &amp; IoT Messaging</a>.)</p>

<h3>Example 5 — Sizing partitions (a worked calculation)</h3>
<pre><code class="language-text">Target peak:            20,000 events/s, avg 1 KB  → ~20 MB/s produce
Consumer throughput:    one consumer instance handles ~1,500 events/s
                        (bounded by a DB upsert per event)
Needed consumers:       20,000 / 1,500 ≈ 14  → round up with headroom
Partitions:             max(throughput need, consumer parallelism need) × growth
                        = 14 × ~2 (2-year growth) ≈ 24–32 → choose 24 or 32
Per-partition produce:  20 MB/s / 24 ≈ 0.8 MB/s — well within a broker's capacity
Storage (7d, RF=3):     20 MB/s × 86,400 × 7 × 3 ≈ 36 TB raw (before compression)
                        → compression (say 5×) ≈ 7 TB → consider tiered storage / shorter retention
</code></pre>
<p>Too few partitions caps consumer parallelism forever (without repartitioning). Too many costs file handles, memory, longer leader elections and more rebalance work. Tens to low hundreds per topic is normal; thousands needs a reason.</p>

<h3>Example 6 — Graceful shutdown (avoid duplicate storms on deploy)</h3>
<pre><code class="language-ts">// main.ts
const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
for (const sig of signals) {
  process.once(sig, async () =&gt; {
    try {
      await consumer.disconnect();   // stops fetching, commits resolved offsets, leaves group cleanly
      await producer.disconnect();   // flushes in-flight sends
    } finally {
      process.exit(0);
    }
  });
}
</code></pre>
<p>A pod killed with SIGKILL never leaves the group: the coordinator waits for <code>session.timeout</code> before rebalancing (lag spike), and everything since the last commit is reprocessed. Set Kubernetes <code>terminationGracePeriodSeconds</code> above your worst-case batch time.</p>

<h3>Example 7 — Outbox → Kafka (don't dual-write)</h3>
<p>"Save order in Postgres, then <code>producer.send</code>" loses events when the process dies between the two. The fix is the transactional outbox (implementation in <a href="#/topic/be-queues">Queues &amp; Async Processing</a>). Kafka-specific variant: let <strong>Debezium</strong> (Kafka Connect source) tail the outbox table via the DB's change log and publish rows to Kafka, so you don't write a polling relay at all. Key the outbox row by aggregate id to keep per-aggregate order.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Slow handler → "rebalance storm"</h3>
<p>A handler that sometimes takes 6 minutes (big report, slow third-party API) exceeds <code>max.poll.interval.ms</code> (Java default 5 min) or misses heartbeats. The consumer is evicted, its partitions move, the new owner reprocesses the same uncommitted batch, hits the same slow path, gets evicted... Fixes: smaller batches, call <code>heartbeat()</code> in KafkaJS loops, raise the interval deliberately, or hand the slow work to a job queue and commit quickly.</p>

<h3>Consumer is so far behind that retention deletes its data</h3>
<p>Lag of 9 days on a 7-day topic. The committed offset now points to a deleted segment → <code>OffsetOutOfRange</code> → the client applies <code>auto.offset.reset</code>. With <code>latest</code> you silently skip days of events; with <code>earliest</code> you jump to the oldest surviving record and also lose the gap. Alert on lag <em>in time</em> (oldest unconsumed record age), not just record count.</p>

<h3>Committed offsets expire</h3>
<p>A group with no active members has its offsets removed after <code>offsets.retention.minutes</code> (7 days in modern versions — check your broker config). A batch job that runs monthly comes back to "no committed offset" and applies the reset policy. Store offsets externally or run often enough.</p>

<h3>Hot partition</h3>
<p>One key gets 30× the traffic (a single huge tenant, a stuck device spamming). Lag grows on one partition only; adding consumers does nothing. Options: a better key (<code>tenantId + ':' + entityId</code>), salting the hot key into N sub-keys (and giving up strict order for it), or a dedicated topic for the giant tenant.</p>

<h3>Adding partitions to a keyed topic</h3>
<p>Existing data stays where it is; new data for key K may go to a new partition. A consumer can briefly process K's old events (old partition) and new events (new partition) in parallel → reordering. For compacted topics it's worse: two "latest" values for K in two partitions. Plan partition counts up front; if you must grow, migrate to a new topic (<code>orders.v2</code>) with a cut-over.</p>

<h3>Unclean leader election</h3>
<p>If every ISR replica is down, Kafka can wait (unavailable) or elect an out-of-sync replica (<code>unclean.leader.election.enable=true</code>) and <strong>lose acknowledged writes</strong>. Default is false. Know that availability-vs-durability is a per-topic choice.</p>

<h3>acks=all with min.insync.replicas=1</h3>
<p>"acks=all" only means "all <em>current</em> ISR members". If the ISR has shrunk to just the leader and min ISR is 1, acks=all degrades to acks=1 — and a leader crash loses data. Always pair acks=all with min.insync.replicas ≥ 2 and RF ≥ 3.</p>

<h3>Large messages</h3>
<p>A 3 MB payload fails with <code>MESSAGE_TOO_LARGE</code> / <code>RecordTooLargeException</code>. Raising broker, topic, producer and consumer fetch limits together works but hurts memory and latency. Better: claim-check pattern — upload to S3, send the key + checksum.</p>

<h3>Tombstones that never disappear (or disappear too soon)</h3>
<p>Tombstones are kept for <code>delete.retention.ms</code> (default 1 day) after compaction so slow consumers can see the delete. A consumer that's down longer than that rebuilding state from a compacted topic will never learn the key was deleted.</p>

<h3>Timestamps lie</h3>
<p>Record timestamp is <code>CreateTime</code> (set by producer — device clocks drift) or <code>LogAppendTime</code> (set by broker). Windowed aggregations and "retry after 10 min" logic need to know which. Kiosks with a dead RTC battery report 1970.</p>

<h3>Transactions and zombie producers</h3>
<p>A random <code>transactionalId</code> per process start defeats fencing: an old instance paused by GC resumes and commits alongside the new one. Use a stable id per logical producer. Also: an open transaction blocks <code>read_committed</code> consumers at the LSO until it commits/aborts (transaction timeout default 60 s) — a hung producer stalls downstream consumers.</p>

<h3>Same group id, different subscriptions</h3>
<p>Two services accidentally sharing <code>groupId: 'worker'</code> but subscribing to different topics produce confusing assignments and rebalances. Group ids should be unique per logical consumer service.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>1. Assuming topic-wide ordering</h3>
<p>"Events are in Kafka, so they're ordered." Only within a partition. Unkeyed events for one order spread across partitions and arrive in any order. <strong>Fix:</strong> key by the entity whose order matters, and keep consumers order-tolerant anyway (version numbers).</p>

<h3>2. Fire-and-forget sends in a request handler</h3>
<pre><code class="language-ts">// ❌ swallowed failure: HTTP 200 returned, event never published
app.post('/orders', async (req, res) =&gt; {
  const order = await saveOrder(req.body);
  producer.send({ topic: 'orders.v1', messages: [{ key: order.id, value: JSON.stringify(order) }] });
  res.status(201).json(order);
});

// ✅ outbox: write event row in the same DB transaction; a relay/CDC publishes it
app.post('/orders', async (req, res) =&gt; {
  const order = await db.transaction(async (tx) =&gt; {
    const o = await tx.orders.insert(req.body);
    await tx.outbox.insert({ aggregateId: o.id, type: 'order.placed', payload: o });
    return o;
  });
  res.status(201).json(order);
});
</code></pre>

<h3>3. One producer per request</h3>
<p>Creating and connecting a producer per HTTP call means a TCP + metadata handshake each time and zero batching. <strong>Fix:</strong> one long-lived producer per process (singleton), connected at boot, disconnected on shutdown.</p>

<h3>4. Committing before the side effect</h3>
<p>Auto-commit + "fire async work and return" in <code>eachMessage</code> means the offset is committed while the work is still running. A crash loses it. <strong>Fix:</strong> <code>await</code> the work inside the handler; only resolve offsets for completed work.</p>

<h3>5. Unbounded retry in place on a poison message</h3>
<p>A malformed record throws every time; KafkaJS retries the batch forever; the partition's lag grows to millions while the dashboard shows "consumer healthy". <strong>Fix:</strong> classify errors, cap attempts, route to retry/DLQ topics, alert on DLQ rate.</p>

<h3>6. Using Kafka as a job queue with per-task latency needs</h3>
<p>Thumbnail jobs that take 0.1–60 s on one partition: one 60 s job blocks every job behind it. <strong>Fix:</strong> Kafka for the event, a real job queue (SQS / BullMQ) for the variable-latency work — or many more partitions plus <code>partitionsConsumedConcurrently</code>.</p>

<h3>7. More consumers than partitions</h3>
<p>Autoscaling the consumer deployment to 40 pods on a 12-partition topic: 28 pods idle, still paying for them, still joining rebalances. <strong>Fix:</strong> scale on lag, cap replicas at partition count.</p>

<h3>8. JSON with no contract</h3>
<p>Producers rename <code>amount</code> → <code>amountMinor</code>; four consumers break. <strong>Fix:</strong> schema registry with BACKWARD (or FULL) compatibility, or at minimum versioned topics/event types and contract tests in CI.</p>

<h3>9. Treating "exactly-once" as end-to-end</h3>
<p>Enabling transactions and then sending emails inside the handler. The transaction can abort and retry; the email still went out twice. <strong>Fix:</strong> idempotency keys at the side-effect boundary (or an inbox table keyed by event id).</p>

<h3>10. Rebuilding state with a shared group id</h3>
<p>Every cache instance that needs the full dataset must read all partitions — separate group ids or manual <code>assign</code>-style reading — not share one group.</p>

<h3>11. Logging the payload</h3>
<p>Dumping full event values (with emails, phone numbers, tokens) into logs on every error. <strong>Fix:</strong> log topic/partition/offset/key/event-id; fetch the payload from the topic or DLQ when debugging.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block"><div class="qa-question">Q1. What is Kafka, and how is it different from a message queue?</div><div class="qa-answer">
<p>Kafka is a distributed, replicated, append-only log split into partitions. Producers append; consumers read from an offset and commit their position. Consuming doesn't remove data — retention does, on time/size. A queue (SQS, RabbitMQ) hands each message to one consumer and deletes it on ack. So Kafka gives replay, many independent consumer groups and per-key ordering; a queue gives per-message ack, retry, delay and DLQ out of the box. I pick Kafka for event streams with multiple consumers or replay needs, and a queue for "do this task once" work.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q2. How does Kafka guarantee ordering?</div><div class="qa-answer">
<p>Only within a partition. Records with the same key go to the same partition via hash(key) mod N, so per-key ordering holds — as long as the partition count doesn't change and producers use the same partitioner. On the producer, idempotence (or max in-flight = 1) keeps retries from reordering. On the consumer, a partition is owned by one group member at a time, so processing is sequential per partition unless I parallelise inside it. I also make handlers version-aware, because rebalances and retry topics can still produce out-of-order effects.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q3. You have 12 partitions and 20 consumers in a group. What happens? And 4 consumers?</div><div class="qa-answer">
<p>With 20, only 12 get a partition; 8 sit idle as hot standbys. With 4, each owns 3 partitions. Partition count is the ceiling on parallelism per group, so I size partitions for the parallelism I'll need in a couple of years, and I autoscale consumers on lag with a cap at the partition count. If I need more parallelism without repartitioning, I can process different keys within a partition concurrently (keyed worker pool) while keeping per-key order — at the cost of more complex offset tracking.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q4. Walk me through acks, min.insync.replicas and what can still lose data.</div><div class="qa-answer">
<p>acks=0 doesn't wait; acks=1 waits for the leader's local write — lost if the leader dies before followers copy it; acks=all waits for every current ISR member. min.insync.replicas sets how small the ISR can get before acks=all writes are rejected. RF=3, min ISR=2, acks=all tolerates one broker loss with no acknowledged-write loss. Remaining risks: unclean leader election enabled, min ISR of 1 (acks=all degrades to acks=1), the app not awaiting the send, or a producer buffer lost when the process crashes before sending.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q5. Explain at-most-once, at-least-once and exactly-once in Kafka terms.</div><div class="qa-answer">
<p>It's about commit placement. Commit before processing → at-most-once. Process then commit → at-least-once; duplicates come from crashes and rebalances between the two. Exactly-once exists for Kafka-to-Kafka: an idempotent, transactional producer writes the outputs and the consumer offsets in one transaction, and downstream consumers use read_committed. For Kafka-to-database I get effectively-once by either storing the offset in the same DB transaction as the result, or by making the write idempotent with an event id or version check. Anything with external side effects still needs idempotency keys.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q6. What triggers a rebalance and how do you make rebalances less painful?</div><div class="qa-answer">
<p>Members joining or leaving, crashes, missed heartbeats, exceeding max.poll.interval, subscription changes, partition count changes. Under eager assignment every member drops all partitions — a stop-the-world pause plus reprocessing of uncommitted work. I use cooperative-sticky assignment (only moved partitions are revoked), static membership with group.instance.id so restarts don't rebalance, commit on revocation, graceful shutdown on SIGTERM, keep batches short or heartbeat inside them, and on newer clusters/clients consider the KIP-848 protocol.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q7. How do you handle a poison message?</div><div class="qa-answer">
<p>Kafka has no per-message ack or native DLQ, so a message that always throws blocks its partition. I classify errors: permanent (validation, schema) go straight to a DLQ topic with headers for the error, original topic/partition/offset and attempt count; transient ones go through delayed retry topics (1 min, 10 min) using pause/resume so the consumer isn't sleeping through its poll interval. Then I commit the original offset. I alert on DLQ rate and have a replay tool. And I call out the cost: retry topics break per-key ordering, so for order-sensitive entities I'd block or park the whole key instead.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q8. When would you use log compaction?</div><div class="qa-answer">
<p>When the topic represents current state per key rather than a history: latest config per device, latest profile per user, CDC of a table, Kafka Streams changelogs. Compaction keeps at least the latest record per key; a null value is a tombstone that deletes the key after delete.retention.ms. A new consumer reads from the beginning to rebuild the full table. Caveats: the active segment isn't compacted, tombstones vanish after the retention window, and adding partitions splits a key's history.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q9. Why use a schema registry? Which compatibility mode would you choose?</div><div class="qa-answer">
<p>It turns the topic into a contract: producers can't register a schema that breaks consumers, payloads are smaller (schema id in the bytes, not field names), and consumers decode any version. I default to BACKWARD (or BACKWARD_TRANSITIVE for long-retention topics, since a consumer may replay very old data): consumers upgrade first, new fields must have defaults. FULL if producer and consumer teams deploy independently and in any order. Breaking changes get a new topic version and a migration period.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q10. How would you choose the number of partitions?</div><div class="qa-answer">
<p>Take the maximum of throughput need (peak MB/s divided by what one partition/consumer sustains) and required consumer parallelism (peak events/s divided by per-consumer throughput, which is usually bounded by the downstream DB), then multiply by expected growth. Check the key distribution for hot keys. Avoid going wild: more partitions mean more open files, longer failovers and heavier rebalances. Because adding partitions remaps keys, I'd rather over-provision modestly up front.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q11. (FDE scenario) A customer says "your integration processes some of our booking events twice, and the room tablets show stale schedules for minutes at a time." What do you do?</div><div class="qa-answer">
<p>Two symptoms, likely one cause. First, get data: consumer group lag per partition over time, rebalance events in consumer logs, deploy times, handler p99 latency. Duplicates plus stale periods together usually mean rebalances: a slow handler (maybe their booking API got slower) exceeds the poll interval or misses heartbeats, the consumer gets evicted, partitions move, the uncommitted batch is reprocessed while nothing advances. Short-term: shrink batch size, heartbeat inside batches, make sure SIGTERM leaves the group cleanly. Durable fix: make the write idempotent (upsert with a version check on bookingId), move slow external calls off the consumer path, switch to cooperative-sticky and static membership. Then confirm with the customer using the same metrics — lag back near zero, rebalances only on deploys — and write up the cause in their terms: "we were re-reading events after restarts; now re-reads are harmless and rarer".</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q12. (Senior probe) Your service writes to Postgres and must publish an event. How do you avoid losing or duplicating it?</div><div class="qa-answer">
<p>No dual writes. Transactional outbox: insert the domain row and an outbox row in one DB transaction; a relay (polling or CDC with Debezium) publishes outbox rows to Kafka, keyed by aggregate id for ordering, using an idempotent producer. The relay itself is at-least-once, so every event carries a unique event id and consumers dedupe or apply idempotently. That gives "no loss" from the outbox and "no visible duplicates" from consumer idempotency — which is the honest version of exactly-once across a DB and Kafka.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q13. (Senior probe) Kafka or SQS for a new AWS-hosted system?</div><div class="qa-answer">
<p>Default to SQS (plus SNS for fan-out) for task-style work on AWS: zero ops, per-message retry/DLQ, Lambda integration, pay per request. Choose Kafka (MSK or Confluent) when I need replay, many independent consumers on a high-volume stream, per-key ordering at high throughput, CDC/stream processing, or long retention. Kinesis sits between: log semantics, shards, AWS-native, but a smaller ecosystem. I'd also weigh team skills — a Kafka cluster with nobody who understands rebalances is a liability.</p>
</div></div>

<div class="qa-block">
  <div class="qa-question">Q14. Two consumer groups read the same topic. Who reads what, and how do you measure lag?</div>
  <div class="qa-answer">
    <p>Within one group, each partition is owned by exactly one consumer; a consumer may own several partitions, and consumers beyond the partition count sit idle. Across groups everything is independent: each group (say billing and search) gets every record and keeps its own committed offset per partition, so a slow search group never slows billing, and either can replay by resetting its offsets. <strong>Lag</strong> is measured per partition per group as <code>log-end-offset - committed offset</code>; it is the key health metric, and I autoscale consumers on it, capped at the partition count. Lag growing on only one partition usually means a hot key, which adding consumers won't fix.</p>
  </div>
</div>
` },

  ]
});
