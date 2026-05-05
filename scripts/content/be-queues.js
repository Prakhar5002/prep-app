window.PREP_SITE.registerTopic({
  id: 'be-queues',
  module: 'backend',
  title: 'Queues & Streaming',
  estimatedReadTime: '50 min',
  tags: ['queues', 'kafka', 'rabbitmq', 'sqs', 'redis-streams', 'pubsub', 'idempotency', 'dead-letter', 'event-driven'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Queues + streaming</strong> turn synchronous request/response into asynchronous work. They're how you decouple producers from consumers, smooth traffic spikes, retry transient failures, and build event-driven systems. The wrong primitive is the difference between "messages always delivered" and "lost a million orders during a deploy."</p>
<ul>
  <li><strong>Three families:</strong> message queues (RabbitMQ / SQS) — work distribution; streams (Kafka / Redis Streams) — durable event log with replay; pub/sub (Redis Pub/Sub / NATS) — fire-and-forget broadcast.</li>
  <li><strong>Delivery semantics:</strong> at-most-once (fast, lossy), at-least-once (default, may dupe), exactly-once (rare, expensive). Most systems are at-least-once + idempotent consumers.</li>
  <li><strong>Idempotent consumers</strong> are non-negotiable — design every handler to be safe to run twice.</li>
  <li><strong>Dead-letter queue (DLQ)</strong> for poison messages — after N failures, move out of main queue, alert.</li>
  <li><strong>Backpressure:</strong> bounded queue size; reject / spill / shed when full. Unbounded queues are how systems collapse.</li>
  <li><strong>Ordering:</strong> partition by key (Kafka) or single-consumer (RabbitMQ) for per-key ordered delivery.</li>
  <li><strong>Use a queue when:</strong> work is async-tolerable, retry-friendly, throughput-decoupled. Don't queue user-facing reads.</li>
</ul>
<p><strong>Mantra:</strong> "Idempotent consumers. Dead-letter for poison. Bounded queues for backpressure. Partition by key for order. At-least-once + dedupe is the pragmatic default."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The three queueing primitives</h3>
<table>
  <thead><tr><th>Primitive</th><th>Shape</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Message queue</td><td>FIFO; one consumer per message; ack on success</td><td>Work distribution: send email, resize image, charge card</td></tr>
    <tr><td>Stream / log</td><td>Durable append-only log; multiple consumers; replay from offset</td><td>Event sourcing, analytics, fan-out to multiple subscribers</td></tr>
    <tr><td>Pub/Sub (no persistence)</td><td>Fire-and-forget broadcast; all live subscribers receive</td><td>Cache invalidation, presence, ephemeral fan-out</td></tr>
  </tbody>
</table>

<h3>The big tools</h3>
<table>
  <thead><tr><th>Tool</th><th>Family</th><th>Sweet spot</th></tr></thead>
  <tbody>
    <tr><td><strong>RabbitMQ</strong></td><td>Message queue (AMQP)</td><td>Per-message routing; complex topologies; smaller scale</td></tr>
    <tr><td><strong>AWS SQS</strong></td><td>Message queue (managed)</td><td>Simple, cheap, ops-free; standard or FIFO variants</td></tr>
    <tr><td><strong>Apache Kafka</strong></td><td>Stream</td><td>Very high throughput, durable replay, fan-out, event-sourcing</td></tr>
    <tr><td><strong>Redis Streams</strong></td><td>Stream-lite</td><td>Mid-throughput; if you already have Redis</td></tr>
    <tr><td><strong>NATS / NATS JetStream</strong></td><td>Pub/Sub + stream</td><td>Ultra-low latency, lightweight, microservices messaging</td></tr>
    <tr><td><strong>AWS SNS</strong></td><td>Pub/Sub</td><td>Fan-out to SQS / Lambda / HTTP; pairs with SQS</td></tr>
    <tr><td><strong>GCP Pub/Sub</strong></td><td>Stream</td><td>Managed Kafka-equivalent on GCP</td></tr>
    <tr><td><strong>BullMQ / Sidekiq / Celery</strong></td><td>Library queues over Redis / RabbitMQ</td><td>App-level job queues with scheduling, retries, UI</td></tr>
    <tr><td><strong>Temporal</strong></td><td>Workflow engine</td><td>Long-running, reliable workflows with branches + compensations</td></tr>
  </tbody>
</table>

<h3>When to use a queue</h3>
<table>
  <thead><tr><th>Use queue when</th><th>Don't queue when</th></tr></thead>
  <tbody>
    <tr><td>Work tolerates seconds-to-minutes delay</td><td>User-facing read needs immediate response</td></tr>
    <tr><td>Decouple producer/consumer cadence</td><td>Synchronous request/response sufficient</td></tr>
    <tr><td>Retry transient failures gracefully</td><td>Permanent failures (4xx) — fast-fail at request time</td></tr>
    <tr><td>Smooth traffic spikes</td><td>Constant low-throughput</td></tr>
    <tr><td>Fan-out one event to many consumers</td><td>One handler, no replay needed</td></tr>
    <tr><td>Long-running job (image processing, ML)</td><td>Sub-second job; just await it</td></tr>
  </tbody>
</table>

<h3>Why systems fail without good queue design</h3>
<ul>
  <li>Synchronous chains: A → B → C. C slow → B slow → A times out. One queue between B and C absorbs the spike.</li>
  <li>No retry: transient network blip = lost order.</li>
  <li>No idempotency: retry = double charge.</li>
  <li>Unbounded queue: producer outpaces consumer; queue grows; OOM; whole system dies.</li>
  <li>No DLQ: poison message blocks the whole queue; nothing gets processed.</li>
  <li>Lost ordering: comment-on-deleted-post arrives before delete; UI displays a comment that shouldn't exist.</li>
</ul>

<h3>What "good queue design" looks like</h3>
<ul>
  <li>Producer publishes; doesn't wait for consumer.</li>
  <li>Idempotency key on every message; consumer dedupes.</li>
  <li>Bounded queue; reject / shed when full.</li>
  <li>Per-key partitioning when ordering matters.</li>
  <li>DLQ after N retries; ops alert.</li>
  <li>Visibility timeout / lease so a crashed consumer's message gets retried.</li>
  <li>Metrics: queue depth, consumer lag, processing time, error rate.</li>
  <li>Schema (Avro / Protobuf / JSON Schema) — versioned; backwards-compat.</li>
</ul>

<h3>What "bad queue design" looks like</h3>
<ul>
  <li>Queue replaces immediate API call (user waits forever).</li>
  <li>No idempotency; retry causes duplicates.</li>
  <li>One giant queue for every type of work; one slow consumer blocks unrelated work.</li>
  <li>No DLQ; poison message stuck forever.</li>
  <li>Unbounded queue; OOM.</li>
  <li>Schema-less JSON; producer changes shape; consumers break silently.</li>
  <li>No metrics; consumer fell behind 6 hours ago; you find out from users.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Delivery semantics</h3>
<table>
  <thead><tr><th>Guarantee</th><th>Means</th><th>How achieved</th></tr></thead>
  <tbody>
    <tr><td>At-most-once</td><td>Each message delivered 0 or 1 times. Some loss possible.</td><td>Fire-and-forget; no ack; producer doesn't retry</td></tr>
    <tr><td>At-least-once</td><td>Each message delivered ≥ 1 time. Duplicates possible.</td><td>Ack-based; retry on failure; default for most systems</td></tr>
    <tr><td>Exactly-once</td><td>Each message processed exactly once.</td><td>At-least-once + idempotent consumer; or distributed transaction (rare, expensive)</td></tr>
  </tbody>
</table>

<p>Practical reality: Kafka has "exactly-once" semantics within Kafka but can't guarantee that downstream side effects (DB writes, API calls) happen exactly once. Always design consumers to be idempotent.</p>

<h3>Ack model</h3>
<pre><code class="language-text">Consumer pulls message
   ↓
Process
   ├─ Success → ACK → broker removes / commits offset
   └─ Fail → NACK → broker re-delivers (or sends to DLQ after N retries)
   ↓
If consumer crashes before ACK:
   visibility timeout expires → broker re-delivers to another consumer
</code></pre>

<table>
  <thead><tr><th>Ack mode</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Auto-ack</td><td>Ack on receive. Fast; data loss if crash before processing.</td></tr>
    <tr><td>Manual ack</td><td>Ack after success. Safe; risk of dupes if crash after processing but before ack.</td></tr>
    <tr><td>Per-batch ack</td><td>Process N; ack all together. Higher throughput; bigger replay window on failure.</td></tr>
  </tbody>
</table>

<h3>Idempotency — the consumer's responsibility</h3>
<pre><code class="language-typescript">async function handleOrderCreated(message: OrderCreated) {
  // Check if we've already processed this message
  const existing = await db.processedMessages.findOne({ messageId: message.id });
  if (existing) {
    logger.info('duplicate_message_skipped', { id: message.id });
    return;
  }

  // Do the work atomically with marking as processed
  await db.transaction(async (tx) =&gt; {
    await chargeCustomer(tx, message);
    await tx.processedMessages.insert({ messageId: message.id, processedAt: new Date() });
  });
}
</code></pre>

<p>Three flavors:</p>
<ul>
  <li><strong>Idempotency key</strong> in the message; consumer stores key → result; replay returns stored result.</li>
  <li><strong>Natural idempotency</strong>: <code>SET status = 'paid'</code> is idempotent already; <code>INCREMENT counter</code> isn't.</li>
  <li><strong>Conditional ops</strong>: <code>UPDATE WHERE status != 'paid'</code> — replay no-ops on rows already updated.</li>
</ul>

<h3>Ordering</h3>
<table>
  <thead><tr><th>Strategy</th><th>How</th><th>Tradeoff</th></tr></thead>
  <tbody>
    <tr><td>FIFO queue</td><td>Single consumer; processes one at a time</td><td>Strict order; throughput limited to one consumer</td></tr>
    <tr><td>Partitioned (Kafka)</td><td>Hash by key (e.g., user_id) → partition. Per-partition order preserved.</td><td>Per-key ordered; parallel across keys</td></tr>
    <tr><td>FIFO group (SQS FIFO)</td><td>MessageGroupId — per-group ordered</td><td>Same as Kafka partition</td></tr>
    <tr><td>No ordering (default)</td><td>Multiple consumers; any order</td><td>Max throughput; consumers must handle out-of-order</td></tr>
  </tbody>
</table>

<h3>Backpressure</h3>
<table>
  <thead><tr><th>Pattern</th><th>How</th></tr></thead>
  <tbody>
    <tr><td>Bounded queue with reject</td><td>Producer gets error when full; client retries with backoff</td></tr>
    <tr><td>Bounded queue with block</td><td>Producer blocks until space; can deadlock if producer is also a consumer</td></tr>
    <tr><td>Drop oldest</td><td>Best-effort delivery; drop oldest when full (logs, metrics)</td></tr>
    <tr><td>Spill to disk / cheaper tier</td><td>Cold queue overflow; processed when hot queue catches up</td></tr>
  </tbody>
</table>

<h3>Dead-letter queue (DLQ)</h3>
<pre><code class="language-text">Main queue: order-created
Consumer fails 3 times on message X
   ↓
Move message to DLQ: order-created-dlq
Alert ops; investigate
   ↓
After fix: requeue from DLQ to main
</code></pre>

<p>Without DLQ: poison message blocks the queue forever. With DLQ: bad message moves out, queue keeps processing.</p>

<h3>Visibility timeout / lease</h3>
<ul>
  <li>Consumer takes a message; broker hides it for N seconds.</li>
  <li>If consumer ACKs in time → removed.</li>
  <li>If consumer crashes / takes too long → broker re-delivers.</li>
  <li>Tune timeout to slightly more than max processing time. Too short = duplicate processing; too long = slow recovery.</li>
</ul>

<h3>Outbox pattern</h3>
<p>Atomically write to DB + queue. Common bug: write DB succeeds, queue write fails — message lost. Fix:</p>
<ol>
  <li>Write business data + outbox row in one DB transaction.</li>
  <li>Background poller reads outbox; publishes to queue; deletes from outbox.</li>
  <li>Guaranteed: every committed business write produces a queue message.</li>
</ol>

<pre><code class="language-sql">CREATE TABLE outbox (
  id UUID PRIMARY KEY,
  topic TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- In application code, write inside same transaction:
INSERT INTO orders (...) VALUES (...);
INSERT INTO outbox (id, topic, payload) VALUES ($1, 'order.created', $2);
COMMIT;

-- Poller (separate process)
SELECT * FROM outbox ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED;
-- ...publish each, delete on success
</code></pre>

<h3>Saga pattern (distributed transactions)</h3>
<p>For multi-service operations: order needs charge + inventory + shipping. No global transaction. Saga: each step has a compensating action. If shipping fails, run "refund" + "release inventory."</p>
<ul>
  <li><strong>Choreography:</strong> services react to events; no central coordinator. Simpler; harder to debug.</li>
  <li><strong>Orchestration:</strong> central workflow engine (Temporal) drives steps + compensations. Clearer; needs the engine.</li>
</ul>

<h3>Schemas + evolution</h3>
<ul>
  <li>Schemaless JSON works at small scale; producer changes shape silently breaks consumers.</li>
  <li>Schema registry (Confluent for Kafka, Pulsar) enforces backwards-compat at publish time.</li>
  <li>Schema formats: Avro (Kafka default), Protobuf, JSON Schema.</li>
  <li>Evolution rules: add optional fields, never remove required, deprecate before delete.</li>
</ul>

<h3>Metrics that matter</h3>
<table>
  <thead><tr><th>Metric</th><th>What it tells you</th></tr></thead>
  <tbody>
    <tr><td>Queue depth</td><td>Producer / consumer balance; trending up = consumers slow</td></tr>
    <tr><td>Consumer lag (Kafka)</td><td>How far behind the consumer is from the head</td></tr>
    <tr><td>Processing time (P50, P95, P99)</td><td>Per-message handler latency</td></tr>
    <tr><td>Error rate</td><td>Rejected / DLQ rate</td></tr>
    <tr><td>Visibility-timeout retries</td><td>Crashing / slow consumers</td></tr>
    <tr><td>Throughput</td><td>Messages/sec produced + consumed</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>BullMQ — Redis-backed job queue</h3>
<pre><code class="language-typescript">import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

// Producer
const emailQueue = new Queue('email', { connection });

await emailQueue.add('send-welcome', {
  userId: 'u-123',
  email: 'p@x.com',
}, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
});

// Consumer
const worker = new Worker('email', async (job) =&gt; {
  const { userId, email } = job.data;
  await sendEmail(email, 'Welcome!');
  await db.users.update({ where: { id: userId }, data: { welcomed: true } });
}, {
  connection,
  concurrency: 10,
  limiter: { max: 100, duration: 1000 }, // 100/s rate limit
});

worker.on('failed', (job, err) =&gt; {
  if (job.attemptsMade &gt;= job.opts.attempts) {
    alertOps('email_dlq', { jobId: job.id, error: err.message });
  }
});
</code></pre>

<h3>RabbitMQ — message queue with AMQP</h3>
<pre><code class="language-typescript">import amqp from 'amqplib';

// Producer
const conn = await amqp.connect(process.env.RABBIT_URL!);
const channel = await conn.createConfirmChannel();
await channel.assertQueue('orders', { durable: true });

await channel.sendToQueue('orders',
  Buffer.from(JSON.stringify({ orderId: 'o-42', total: 9999 })),
  { persistent: true, messageId: crypto.randomUUID() }
);
await channel.waitForConfirms();

// Consumer
const conn2 = await amqp.connect(process.env.RABBIT_URL!);
const ch = await conn2.createChannel();
await ch.assertQueue('orders', { durable: true });
await ch.prefetch(10); // limit concurrent in-flight

ch.consume('orders', async (msg) =&gt; {
  if (!msg) return;
  try {
    const data = JSON.parse(msg.content.toString());
    await processOrder(data);
    ch.ack(msg);
  } catch (err) {
    logger.error({ err }, 'order_processing_failed');
    ch.nack(msg, false, false); // false = don't requeue → goes to DLQ via dead-letter exchange
  }
});

// DLX (Dead-Letter eXchange) setup
await ch.assertExchange('orders.dlx', 'direct', { durable: true });
await ch.assertQueue('orders.dlq', { durable: true });
await ch.bindQueue('orders.dlq', 'orders.dlx', '');
await ch.assertQueue('orders', {
  durable: true,
  arguments: { 'x-dead-letter-exchange': 'orders.dlx' },
});
</code></pre>

<h3>AWS SQS</h3>
<pre><code class="language-typescript">import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'us-east-1' });
const QUEUE_URL = process.env.SQS_URL!;

// Producer
await sqs.send(new SendMessageCommand({
  QueueUrl: QUEUE_URL,
  MessageBody: JSON.stringify({ orderId: 'o-42' }),
  MessageAttributes: {
    idempotencyKey: { DataType: 'String', StringValue: crypto.randomUUID() },
  },
}));

// Consumer (long-poll loop)
async function consume() {
  while (true) {
    const result = await sqs.send(new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20, // long poll
      VisibilityTimeout: 30,
    }));

    const messages = result.Messages ?? [];
    await Promise.all(messages.map(async (msg) =&gt; {
      try {
        const data = JSON.parse(msg.Body!);
        await processOrder(data);
        await sqs.send(new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: msg.ReceiptHandle!,
        }));
      } catch (err) {
        // Don't delete; SQS re-delivers after VisibilityTimeout
        // After maxReceiveCount → DLQ via redrive policy
        logger.error({ err, msgId: msg.MessageId }, 'processing_failed');
      }
    }));
  }
}
</code></pre>

<h3>Kafka — high-throughput stream</h3>
<pre><code class="language-typescript">import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'orders-service',
  brokers: ['kafka1:9092', 'kafka2:9092'],
});

// Producer
const producer = kafka.producer({ idempotent: true });
await producer.connect();

await producer.send({
  topic: 'orders',
  messages: [{
    key: order.userId, // hash to partition; per-user order preserved
    value: JSON.stringify(order),
    headers: { 'message-id': order.id },
  }],
});

// Consumer (committed offset)
const consumer = kafka.consumer({ groupId: 'order-fulfillment' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: false });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) =&gt; {
    const order = JSON.parse(message.value!.toString());
    const idempotencyKey = message.headers!['message-id']!.toString();

    if (await alreadyProcessed(idempotencyKey)) return;
    await processOrder(order);
    await markProcessed(idempotencyKey);
    // Auto-commits offset on successful return
  },
});
</code></pre>

<h3>Redis Streams</h3>
<pre><code class="language-typescript">import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Producer
await redis.xadd('orders', '*', 'orderId', 'o-42', 'total', '9999');

// Consumer (with consumer group)
await redis.xgroup('CREATE', 'orders', 'fulfillment-workers', '$', 'MKSTREAM').catch(() =&gt; {});

while (true) {
  const result = await redis.xreadgroup(
    'GROUP', 'fulfillment-workers', 'worker-1',
    'COUNT', '10',
    'BLOCK', '5000',
    'STREAMS', 'orders', '&gt;'
  );

  if (!result) continue;
  for (const [, messages] of result) {
    for (const [id, fields] of messages) {
      try {
        await processOrder(fieldsToObject(fields));
        await redis.xack('orders', 'fulfillment-workers', id);
      } catch (err) {
        logger.error({ err, id }, 'failed');
        // After N retries, XCLAIM to DLQ
      }
    }
  }
}
</code></pre>

<h3>Outbox pattern implementation</h3>
<pre><code class="language-typescript">// In a transaction with the business write
async function placeOrder(order: Order) {
  await db.transaction(async (tx) =&gt; {
    await tx.orders.insert(order);
    await tx.outbox.insert({
      id: crypto.randomUUID(),
      topic: 'order.placed',
      payload: order,
    });
  });
}

// Background relay (separate process)
async function relayOutbox() {
  while (true) {
    const messages = await db.transaction(async (tx) =&gt; {
      const rows = await tx.query(\`
        SELECT * FROM outbox
        ORDER BY created_at
        LIMIT 100
        FOR UPDATE SKIP LOCKED
      \`);
      return rows;
    });

    if (!messages.length) {
      await sleep(1000);
      continue;
    }

    for (const msg of messages) {
      try {
        await producer.send({
          topic: msg.topic,
          messages: [{ key: msg.payload.id, value: JSON.stringify(msg.payload) }],
        });
        await db.outbox.delete({ id: msg.id });
      } catch (err) {
        logger.error({ err, id: msg.id }, 'outbox_publish_failed');
        // Will retry next loop
      }
    }
  }
}
</code></pre>

<h3>Saga via Temporal (orchestration)</h3>
<pre><code class="language-typescript">// Workflow definition
import { proxyActivities } from '@temporalio/workflow';
const { chargeCustomer, reserveInventory, shipOrder, refundCustomer, releaseInventory } =
  proxyActivities&lt;typeof activities&gt;({ startToCloseTimeout: '30 seconds' });

export async function fulfillOrder(orderId: string) {
  let charged = false, reserved = false;
  try {
    await chargeCustomer(orderId);
    charged = true;
    await reserveInventory(orderId);
    reserved = true;
    await shipOrder(orderId);
  } catch (err) {
    // Compensations in reverse
    if (reserved) await releaseInventory(orderId);
    if (charged) await refundCustomer(orderId);
    throw err;
  }
}
</code></pre>

<h3>Idempotency table</h3>
<pre><code class="language-sql">CREATE TABLE processed_messages (
  message_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result JSONB
);

-- TTL via partial index + cleanup job
CREATE INDEX ON processed_messages (processed_at);
DELETE FROM processed_messages WHERE processed_at &lt; NOW() - INTERVAL '7 days';
</code></pre>

<h3>Rate limiting consumers</h3>
<pre><code class="language-typescript">// BullMQ rate limit
const worker = new Worker('email', handler, {
  connection,
  concurrency: 10,
  limiter: { max: 100, duration: 1000 },
});

// Custom (sliding window)
let lastTime = Date.now();
let processed = 0;
async function rateLimited(fn) {
  if (Date.now() - lastTime &lt; 1000 &amp;&amp; processed &gt;= 100) {
    await sleep(1000 - (Date.now() - lastTime));
    processed = 0; lastTime = Date.now();
  }
  await fn();
  processed++;
}
</code></pre>

<h3>Scheduled jobs (delayed delivery)</h3>
<pre><code class="language-typescript">// BullMQ
await emailQueue.add('reminder', payload, { delay: 24 * 60 * 60_000 }); // 24h

// SQS — DelaySeconds (max 15 min); for longer, use EventBridge / Step Functions

// Custom — store with run_at; poll
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY,
  run_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);
CREATE INDEX ON scheduled_jobs (run_at);

// Poller (every 10s)
SELECT * FROM scheduled_jobs WHERE run_at &lt;= NOW() FOR UPDATE SKIP LOCKED LIMIT 100;
// Process; delete.
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Decouple email-send from signup</h3>
<pre><code class="language-typescript">// Without queue: signup waits for email send (slow + brittle)
async function signup(req, res) {
  const user = await db.users.create(req.body);
  await sendWelcomeEmail(user.email); // 500ms-2s
  res.json(user);
}

// With queue: signup returns instantly; email handled async
async function signupQueued(req, res) {
  const user = await db.users.create(req.body);
  await emailQueue.add('welcome', { userId: user.id, email: user.email });
  res.json(user); // user sees instant signup
}
</code></pre>

<h3>Example 2: Outbox for atomic order placement</h3>
<pre><code class="language-typescript">async function placeOrder(req, res) {
  const order = await db.transaction(async (tx) =&gt; {
    const o = await tx.orders.insert({ ... });
    await tx.outbox.insert({
      id: crypto.randomUUID(),
      topic: 'order.placed',
      payload: o,
    });
    return o;
  });

  res.status(201).json(order);
  // Background relay publishes to Kafka; downstream services consume
}

// Downstream: charge customer
consumer.run({
  eachMessage: async ({ message }) =&gt; {
    const order = JSON.parse(message.value!.toString());
    const idempotencyKey = \`charge-\${order.id}\`;

    if (await alreadyProcessed(idempotencyKey)) return;
    await chargeStripe(order, idempotencyKey);
    await markProcessed(idempotencyKey);
  },
});
</code></pre>

<h3>Example 3: Image processing pipeline</h3>
<pre><code class="language-typescript">// User uploads image; queue triggers resize / thumbnail / OCR
async function uploadImage(req, res) {
  const upload = await s3.upload({ ... });
  await db.images.insert({ id: upload.id, originalUrl: upload.url, status: 'processing' });

  await imageQueue.add('process', { imageId: upload.id, url: upload.url }, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
  });

  res.status(202).json({ id: upload.id, statusUrl: \`/images/\${upload.id}\` });
}

const worker = new Worker('process', async (job) =&gt; {
  const { imageId, url } = job.data;
  const buffer = await downloadFromS3(url);

  const [thumbnail, resized] = await Promise.all([
    generateThumbnail(buffer),
    resizeImage(buffer, 1200),
  ]);

  await s3.upload({ key: \`thumb/\${imageId}\`, body: thumbnail });
  await s3.upload({ key: \`resized/\${imageId}\`, body: resized });
  await db.images.update({ where: { id: imageId }, data: { status: 'ready' } });
}, { connection, concurrency: 5 });
</code></pre>

<h3>Example 4: Fan-out via SNS → SQS</h3>
<pre><code class="language-text">user.signed_up event
   ↓
SNS topic
   ├─→ SQS: send-welcome-email
   ├─→ SQS: provision-trial
   ├─→ SQS: track-analytics
   └─→ SQS: notify-sales
</code></pre>

<p>One publish; multiple consumers; each scales independently. Each SQS has its own retry + DLQ.</p>

<pre><code class="language-typescript">// Publisher
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
const sns = new SNSClient({});

await sns.send(new PublishCommand({
  TopicArn: 'arn:aws:sns:us-east-1:123:user-events',
  Message: JSON.stringify({ event: 'user.signed_up', userId: u.id }),
}));
</code></pre>

<h3>Example 5: Per-key ordered processing (Kafka)</h3>
<pre><code class="language-typescript">// Bank-account events: deposit, withdraw, transfer.
// Must process per-account in order.
await producer.send({
  topic: 'account-events',
  messages: events.map((e) =&gt; ({
    key: e.accountId, // ← partitioning key; same account → same partition → ordered
    value: JSON.stringify(e),
  })),
});

const consumer = kafka.consumer({ groupId: 'balance-service' });
await consumer.run({
  eachMessage: async ({ message }) =&gt; {
    const event = JSON.parse(message.value!.toString());
    await applyToBalance(event.accountId, event); // safe; no concurrent processing per key
  },
});
</code></pre>

<h3>Example 6: Saga with compensation</h3>
<pre><code class="language-typescript">async function bookTrip(userId: string, trip: Trip) {
  const reserved = { flight: false, hotel: false };
  let payment: Charge | null = null;

  try {
    payment = await chargeCustomer(userId, trip.total);
    await reserveFlight(trip.flight);
    reserved.flight = true;
    await reserveHotel(trip.hotel);
    reserved.hotel = true;
  } catch (err) {
    // Compensate in reverse
    if (reserved.hotel) await cancelHotel(trip.hotel);
    if (reserved.flight) await cancelFlight(trip.flight);
    if (payment) await refundCharge(payment.id);
    throw err;
  }
}
</code></pre>

<p>For real workflows of this complexity, use Temporal: it persists state, retries activities, runs compensations atomically.</p>

<h3>Example 7: Webhook retry with DLQ</h3>
<pre><code class="language-typescript">// Send webhook; on failure, retry with exponential backoff
const webhookQueue = new Queue('webhooks', { connection });

async function sendWebhook(url: string, payload: any) {
  await webhookQueue.add('deliver', { url, payload }, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

const worker = new Worker('webhooks', async (job) =&gt; {
  const { url, payload } = job.data;
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok &amp;&amp; res.status &gt;= 500) throw new Error(\`HTTP \${res.status}\`);
  // 4xx (except 429) is permanent — don't retry
  if (!res.ok &amp;&amp; res.status &gt;= 400 &amp;&amp; res.status !== 429) {
    job.discard(); // mark as final failure
    return;
  }
}, { connection });

worker.on('failed', (job, err) =&gt; {
  if (job.attemptsMade &gt;= job.opts.attempts) {
    db.webhookDLQ.insert({ url: job.data.url, payload: job.data.payload, error: err.message });
    alertOps('webhook_dlq', { url: job.data.url });
  }
});
</code></pre>

<h3>Example 8: Schema evolution (Avro / Confluent Schema Registry)</h3>
<pre><code class="language-json">// v1 schema
{
  "type": "record",
  "name": "Order",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "userId", "type": "string" },
    { "name": "total", "type": "long" }
  ]
}

// v2 — add optional field (backwards-compat)
{
  "type": "record",
  "name": "Order",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "userId", "type": "string" },
    { "name": "total", "type": "long" },
    { "name": "currency", "type": "string", "default": "USD" }
  ]
}
</code></pre>

<p>Schema registry rejects v2 if it breaks compat (e.g., removing a required field). Old consumers see "USD" default; new consumers read currency.</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Visibility timeout misconfigured</h3>
<ul>
  <li>Too short: consumer takes 60s; visibility = 30s; broker re-delivers; duplicate processing.</li>
  <li>Too long: consumer crashes; message stuck for hours.</li>
  <li>Tune to ~2× max processing time; or extend dynamically with heartbeats.</li>
</ul>

<h3>Poison messages</h3>
<ul>
  <li>One bad message that always throws; without DLQ, blocks the queue.</li>
  <li>Symptom: queue depth increasing despite consumer running.</li>
  <li>Fix: configure DLQ with maxReceiveCount; alert on DLQ entries.</li>
</ul>

<h3>Lost messages on producer side</h3>
<ul>
  <li>Producer publishes; broker hadn't fsynced; broker crashes; message lost.</li>
  <li>Mitigations: producer ack mode set to "all replicas" (Kafka acks=all); RabbitMQ confirm channel; SQS waits for durable storage.</li>
  <li>Outbox pattern: durable in DB before publish.</li>
</ul>

<h3>Consumer offset commit timing</h3>
<table>
  <thead><tr><th>Pattern</th><th>Behavior</th></tr></thead>
  <tbody>
    <tr><td>Auto-commit before processing</td><td>At-most-once; loss on crash</td></tr>
    <tr><td>Auto-commit after processing</td><td>At-least-once; dupes on crash before commit</td></tr>
    <tr><td>Manual commit per message</td><td>Best control; throughput cost</td></tr>
    <tr><td>Manual commit batch</td><td>Higher throughput; bigger replay window</td></tr>
  </tbody>
</table>

<h3>Re-balancing in Kafka consumer groups</h3>
<ul>
  <li>Consumer joins / leaves → partitions re-assigned.</li>
  <li>During re-balance, processing pauses (ms to seconds).</li>
  <li>Consumers must commit before re-balance to avoid duplicate processing post-rebalance.</li>
</ul>

<h3>Long-running tasks</h3>
<ul>
  <li>Job takes 30 min; visibility timeout is 5 min; broker re-delivers; duplicate.</li>
  <li>Mitigations: extend visibility on heartbeat; or break into smaller jobs; or use workflow engine (Temporal).</li>
</ul>

<h3>Backpressure failures</h3>
<ul>
  <li>Producer outpaces consumer; queue grows; OOM.</li>
  <li>Detect: queue depth alert.</li>
  <li>Mitigations: scale consumers up; rate-limit producer; bounded queue with reject-new policy.</li>
</ul>

<h3>Schema breaking changes</h3>
<ul>
  <li>Producer adds required field; old consumer crashes on unknown.</li>
  <li>Producer removes field consumer relied on; consumer reads null / undefined.</li>
  <li>Mitigations: schema registry with compat checks; never remove required; deprecate before delete.</li>
</ul>

<h3>Kafka partition rebalance &amp; ordering</h3>
<ul>
  <li>Adding partitions changes hash mapping; same key may go to different partition.</li>
  <li>Per-key ordering broken across the partition change.</li>
  <li>Mitigation: choose partition count carefully upfront; if you must add, expect a temporary order anomaly.</li>
</ul>

<h3>Duplicate sends from outbox relay</h3>
<ul>
  <li>Relay publishes; succeeds; but DB delete fails (e.g., crash).</li>
  <li>Next poll re-reads same row; publishes again.</li>
  <li>Consumer must dedupe by message ID. Outbox + at-least-once + idempotent consumer is the pragmatic full path.</li>
</ul>

<h3>Skewed consumer load</h3>
<ul>
  <li>Hash partitioning by user_id; one user has 10× traffic of others; one partition + consumer saturates.</li>
  <li>Symptom: lag on one partition; rest fine.</li>
  <li>Mitigations: better partition key (sub-shard the hot key); consumer-side handle hot keys separately.</li>
</ul>

<h3>Ordering vs throughput conflict</h3>
<ul>
  <li>Strict ordering = single consumer; max throughput = N consumers.</li>
  <li>Mitigation: per-key ordering via partitioning — parallel across keys, ordered within key.</li>
  <li>If you don't actually need ordering, drop it for throughput.</li>
</ul>

<h3>Slow consumers + blocking the partition</h3>
<ul>
  <li>Kafka consumer group: each partition has one consumer at a time.</li>
  <li>One slow message blocks subsequent messages on that partition.</li>
  <li>Mitigations: process in batches with parallel handling; offload heavy work to a worker pool; partition by sub-key.</li>
</ul>

<h3>Cleanup of processed_messages table</h3>
<ul>
  <li>Idempotency table grows unboundedly without cleanup.</li>
  <li>Cleanup job: <code>DELETE WHERE processed_at &lt; NOW() - INTERVAL '7 days'</code>.</li>
  <li>Or partition by week + drop old partitions.</li>
</ul>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN clients send actions to your backend; backend often queues for async processing (uploads, image processing, push fan-out).</li>
  <li>Mobile retries on flaky network → server must dedupe via idempotency key.</li>
  <li>Push notification triggers from queue events: SNS → SQS → push service.</li>
  <li>Background processing on mobile (in-app queues for offline mutations) — same patterns: idempotency keys, retry with backoff, dead-letter UX (show user "couldn't send; tap to retry").</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common queue mistakes</h3>
<ol>
  <li><strong>Non-idempotent consumers.</strong> At-least-once + bad code = duplicates.</li>
  <li><strong>No DLQ.</strong> Poison messages stuck forever.</li>
  <li><strong>Unbounded queues.</strong> OOM under load.</li>
  <li><strong>Auto-ack before processing.</strong> Message loss on crash.</li>
  <li><strong>Visibility timeout too short.</strong> Re-delivery during processing.</li>
  <li><strong>One queue for all work types.</strong> Slow consumer blocks unrelated.</li>
  <li><strong>Schemaless messages.</strong> Silent breakage on producer change.</li>
  <li><strong>No metrics.</strong> Lag invisible until users complain.</li>
  <li><strong>Synchronous consumer in event loop.</strong> One slow handler blocks whole partition.</li>
  <li><strong>Queue replaces sync API for user-facing reads.</strong> User stares at spinner forever.</li>
  <li><strong>Producer publishes outside DB transaction.</strong> DB write succeeds; queue write fails; lost event.</li>
  <li><strong>Distributed transaction for "exactly once."</strong> Over-engineered; idempotent at-least-once is the pragmatic path.</li>
</ol>

<h3>Anti-pattern: non-idempotent consumer</h3>
<pre><code class="language-typescript">// BAD — retry doubles the charge
async function handleOrder(msg) {
  await stripe.charges.create({ amount: msg.total });
}

// GOOD — idempotency key
async function handleOrder(msg) {
  const existing = await db.processedMessages.findOne({ messageId: msg.id });
  if (existing) return;
  await db.transaction(async (tx) =&gt; {
    await stripe.charges.create({ amount: msg.total, idempotency_key: msg.id });
    await tx.processedMessages.insert({ messageId: msg.id });
  });
}
</code></pre>

<h3>Anti-pattern: no DLQ</h3>
<pre><code class="language-typescript">// BAD — poison message; consumer dies on every retry
const worker = new Worker('queue', handler, { connection });

// GOOD — explicit DLQ via attempts limit
const worker = new Worker('queue', handler, {
  connection,
  // attempts comes from job options
});

worker.on('failed', (job, err) =&gt; {
  if (job.attemptsMade &gt;= job.opts.attempts) {
    db.dlq.insert({ jobId: job.id, payload: job.data, error: err.message });
    alertOps('queue_dlq', { jobId: job.id });
  }
});
</code></pre>

<h3>Anti-pattern: unbounded queue</h3>
<pre><code class="language-typescript">// BAD — accepts any rate; eventually OOM
await emailQueue.add('send', payload);

// GOOD — bounded queue with reject
const depth = await emailQueue.count();
if (depth &gt; 100_000) {
  return res.status(503).json({ error: 'queue_full' });
}
await emailQueue.add('send', payload);
</code></pre>

<h3>Anti-pattern: ack before processing</h3>
<pre><code class="language-typescript">// BAD — auto-ack on receive; crash loses message
ch.consume('orders', async (msg) =&gt; {
  ch.ack(msg);             // ← ack first
  await processOrder(msg); // ← if this crashes, message lost
}, { noAck: false });

// GOOD — ack only after success
ch.consume('orders', async (msg) =&gt; {
  try {
    await processOrder(msg);
    ch.ack(msg);
  } catch (err) {
    ch.nack(msg, false, false); // → DLQ via DLX
  }
}, { noAck: false });
</code></pre>

<h3>Anti-pattern: shared queue for everything</h3>
<pre><code class="language-typescript">// BAD — slow image-processing blocks email sends
const worker = new Worker('all-work', async (job) =&gt; {
  if (job.name === 'send-email') return sendEmail(job.data);
  if (job.name === 'process-image') return processImage(job.data); // 30s
});

// GOOD — separate queues + workers
new Worker('email', sendEmail, { connection, concurrency: 100 });
new Worker('image', processImage, { connection, concurrency: 5 });
</code></pre>

<h3>Anti-pattern: schemaless JSON</h3>
<pre><code class="language-typescript">// BAD — producer changes shape; consumer breaks silently
{ "userId": "123", "total": 100 }
// later changes to:
{ "user_id": "123", "totalCents": 10000 }

// GOOD — versioned schema with registry
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
const registry = new SchemaRegistry({ host: '...' });
const value = await registry.encode(schemaId, payload);
await producer.send({ topic, messages: [{ value }] });
</code></pre>

<h3>Anti-pattern: no metrics</h3>
<pre><code class="language-typescript">// BAD — fire-and-forget; lag invisible
await emailQueue.add('send', payload);

// GOOD — expose metrics
const queueDepth = await emailQueue.count();
metrics.gauge('queue.depth', queueDepth, { queue: 'email' });
metrics.histogram('queue.processing.ms', durationMs, { queue: 'email' });
metrics.counter('queue.dlq', 1, { queue: 'email' });
</code></pre>

<h3>Anti-pattern: synchronous in event loop</h3>
<pre><code class="language-typescript">// BAD — blocks event loop; one slow message stalls whole consumer
const worker = new Worker('image', (job) =&gt; {
  return sharp(job.data.url).resize(1200).toBuffer(); // sync
});

// GOOD — async with concurrency limit
const worker = new Worker('image', async (job) =&gt; {
  const buffer = await downloadAsync(job.data.url);
  return sharpAsync(buffer).resize(1200).toBuffer();
}, { concurrency: 5 });
</code></pre>

<h3>Anti-pattern: queue for user-facing reads</h3>
<pre><code class="language-typescript">// BAD — user makes request; you queue; respond "we'll get back to you"
async function getProfile(req, res) {
  await profileQueue.add('fetch', { userId: req.user.id });
  res.json({ status: 'queued' }); // user is confused
}

// GOOD — async only when async-tolerable
async function getProfile(req, res) {
  const profile = await db.users.findUnique({ where: { id: req.user.id } });
  res.json(profile);
}
</code></pre>

<h3>Anti-pattern: producer outside DB transaction</h3>
<pre><code class="language-typescript">// BAD — DB succeeds; queue fails → lost event
await db.orders.insert(order);
await kafka.send({ topic: 'order.placed', ... }); // could fail

// GOOD — outbox pattern
await db.transaction(async (tx) =&gt; {
  await tx.orders.insert(order);
  await tx.outbox.insert({ topic: 'order.placed', payload: order });
});
// Background relay publishes from outbox
</code></pre>

<h3>Anti-pattern: chasing exactly-once</h3>
<p>"Exactly-once delivery" is a tar pit. At-least-once + idempotent consumer is the pragmatic, robust path. Build idempotency keys; design handlers idempotent; stop chasing perfect delivery semantics.</p>

<h3>Anti-pattern: DLQ as graveyard</h3>
<p>Messages land in DLQ; nobody looks; orders silently fail. Always alert on DLQ growth; weekly review + replay or close.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common queue / streaming interview prompts</h3>
<ol>
  <li>Compare RabbitMQ / Kafka / SQS / Redis Streams.</li>
  <li>How do you achieve exactly-once?</li>
  <li>How do you handle a poison message?</li>
  <li>How would you build [email pipeline / order processing / event-driven X]?</li>
  <li>What's the outbox pattern?</li>
  <li>How do you prevent duplicate charges?</li>
  <li>What's the saga pattern?</li>
  <li>Tell me about a queue / streaming bug you debugged.</li>
</ol>

<h3>The 5-step framework for "design async work for X"</h3>
<ol>
  <li><strong>Identify the work:</strong> async-tolerable, retry-friendly, decoupled cadence?</li>
  <li><strong>Pick the primitive:</strong> queue (work distribution) / stream (durable log + replay) / pub/sub (broadcast).</li>
  <li><strong>Pick the tool:</strong> SQS / RabbitMQ / Kafka / Redis Streams / NATS — by ops budget + throughput.</li>
  <li><strong>Idempotency:</strong> key per message; consumer dedupes; processed-messages table.</li>
  <li><strong>Failure handling:</strong> retries with backoff; DLQ; metrics + alerts.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"At-least-once + idempotent consumers — the pragmatic 'exactly-once' that actually works in production."</em></li>
  <li><em>"Idempotency keys per message; processed-messages table with a TTL; consumer dedupes."</em></li>
  <li><em>"DLQ after N retries; alert on DLQ growth; never drop a message silently."</em></li>
  <li><em>"Outbox pattern for atomic DB-write-and-publish — DB transaction commits both the business write and the outbox row; relay publishes async."</em></li>
  <li><em>"Per-key partitioning (Kafka) for ordered-within-key + parallel-across-keys."</em></li>
  <li><em>"Bounded queue with reject-new policy — unbounded queues are how systems collapse under load."</em></li>
  <li><em>"Visibility timeout = 2× max processing time; or extend with heartbeats for long jobs."</em></li>
  <li><em>"Saga + compensations for distributed transactions; Temporal if it gets complex."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"send 1M emails"</td><td>SQS / BullMQ; bounded concurrency; rate limit by provider quota</td></tr>
    <tr><td>"process orders end-to-end"</td><td>Kafka with partition by user_id; per-step services consume + emit</td></tr>
    <tr><td>"image processing"</td><td>Job queue with concurrency limit; pre-signed S3 URL for download</td></tr>
    <tr><td>"webhook delivery"</td><td>Queue with exponential backoff + DLQ + dashboard</td></tr>
    <tr><td>"event sourcing"</td><td>Kafka with infinite retention; aggregate by replay</td></tr>
    <tr><td>"distributed transaction"</td><td>Saga with compensations; Temporal for orchestration</td></tr>
    <tr><td>"prevent double-charge"</td><td>Idempotency key; processed-messages table; conditional update</td></tr>
    <tr><td>"fan-out one event to N consumers"</td><td>SNS → multiple SQS, or Kafka with multiple consumer groups</td></tr>
    <tr><td>"per-user ordering"</td><td>Kafka partition by user_id, or SQS FIFO with MessageGroupId</td></tr>
    <tr><td>"replay old events"</td><td>Kafka with retention; consumer with reset offset</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch producer → broker → consumer.</li>
  <li>Identify delivery semantics (at-least-once default).</li>
  <li>Show idempotency key in producer + dedupe table in consumer.</li>
  <li>Show retry + DLQ.</li>
  <li>Show outbox if DB consistency matters.</li>
  <li>Talk metrics: depth, lag, processing time, DLQ count.</li>
  <li>Address backpressure + scaling.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Schema registry (Avro / Confluent) for backward-compat checks."</em></li>
  <li><em>"Temporal for orchestration of long-running workflows."</em></li>
  <li><em>"Per-tenant queue isolation to prevent noisy-neighbor."</em></li>
  <li><em>"DLQ replay tooling with diff + reprocess."</em></li>
  <li><em>"Auto-scaling consumers based on queue depth."</em></li>
  <li><em>"Distributed tracing across producer → broker → consumer."</em></li>
  <li><em>"Throttle + circuit-break on downstream calls."</em></li>
  <li><em>"Outbox + CDC (Debezium) for change-data capture."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Tool fluency</td><td>RabbitMQ / Kafka / SQS / NATS picked by use case</td></tr>
    <tr><td>Delivery semantics</td><td>At-least-once + idempotent named explicitly</td></tr>
    <tr><td>Idempotency discipline</td><td>Idempotency key + dedupe table</td></tr>
    <tr><td>DLQ awareness</td><td>Every queue has a DLQ + alert</td></tr>
    <tr><td>Outbox pattern</td><td>Names it for atomic DB+queue</td></tr>
    <tr><td>Saga awareness</td><td>For distributed transactions</td></tr>
    <tr><td>Backpressure</td><td>Bounded queues; backpressure to producer</td></tr>
    <tr><td>Ordering tradeoff</td><td>Partition by key for per-key order</td></tr>
    <tr><td>Metrics</td><td>Depth, lag, error rate</td></tr>
    <tr><td>Restraint</td><td>Doesn't queue user-facing reads; doesn't chase exactly-once</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Mobile clients submit work that goes through a backend queue (image upload → process → notify).</li>
  <li>Mobile retries on flaky network → server idempotency key on every mutation.</li>
  <li>Push notifications often delivered via queue (SNS / SQS → FCM / APNs).</li>
  <li>RN background mutation queues (offline mutations) parallel server queues — same idempotency + retry + dead-letter UX.</li>
  <li>Long-running RN jobs (video upload + process) use 202 + status endpoint + queue under the hood.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How do you prevent duplicate charges if the queue retries?"</em> — Idempotency key per message; Stripe charges_create takes one; server-side dedupe table for own state.</li>
  <li><em>"What's the difference between Kafka and RabbitMQ?"</em> — Kafka is a durable, append-only log designed for high-throughput streaming + replay. RabbitMQ is a message broker with rich routing (exchanges, bindings) for traditional work distribution. Kafka for event streaming + analytics; RabbitMQ for task queues with complex topology.</li>
  <li><em>"How does the outbox pattern work?"</em> — Write business data + outbox row in one DB transaction. Background relay reads outbox; publishes; deletes. Guarantees: every committed write produces a queue message; dedupe at consumer for the rare double-publish.</li>
  <li><em>"How do you handle a poison message?"</em> — DLQ with maxReceiveCount; alert ops; investigate in DLQ-dashboard; fix bug or filter; replay from DLQ.</li>
  <li><em>"Saga vs distributed transaction?"</em> — Distributed tx (2PC) needs all participants synchronized; brittle, slow, rare. Saga: each step has compensation. Run forward; on failure, run compensations in reverse. Choreography (events) or orchestration (Temporal).</li>
  <li><em>"How do you handle ordering with parallel consumers?"</em> — Partition by key; per-partition single consumer (or single thread); per-key order preserved. Kafka, SQS FIFO with MessageGroupId, RabbitMQ consistent-hash exchange.</li>
  <li><em>"What's a hot partition?"</em> — One key gets disproportionate traffic; one partition saturates; lag piles. Mitigate by sub-sharding the hot key, or processing hot keys with dedicated workers.</li>
  <li><em>"How do you scale consumers?"</em> — Add more consumer instances (Kafka auto-rebalances partitions); ensure stateless handlers; metrics-driven autoscaling on queue depth or lag.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a producer + consumer with BullMQ + Redis. Add retry, DLQ, idempotency.</li>
  <li>Build outbox pattern with Postgres + Kafka. Verify atomic publish.</li>
  <li>Try saga via Temporal on a small workflow.</li>
  <li>Read Kafka's "Designing Data-Intensive Applications" chapter on streams.</li>
  <li>Try Redis Streams; compare with Kafka.</li>
  <li>Practice the 5-step async design framework on 5 prompts.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read Confluent's Kafka guides on consumer groups + exactly-once semantics."</li>
  <li>"Read the Temporal docs on workflows + activities."</li>
  <li>"Build a webhook delivery system end-to-end with retries + DLQ + dashboard."</li>
  <li>"Audit a real codebase's queue usage; find missing idempotency / DLQs."</li>
</ul>
`
    }
  ]
});
