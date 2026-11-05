window.PREP_SITE.registerTopic({
  id: "be-mongodb",
  module: "backend-stack",
  title: "MongoDB",
  estimatedReadTime: "50 min",
  tags: ["mongodb","nosql","document-model","indexes","esr-rule","aggregation","transactions","replica-set","sharding","mongoose","write-concern"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">MongoDB stores <strong>aggregates as documents</strong> — model around your access patterns (embed what's read together and bounded, reference the rest), index with <strong>Equality → Sort → Range</strong>, and make durability explicit with <code>w: 'majority'</code> on a replica set.</div>
  <h4>Key points</h4>
  <ul>
    <li>JSON-like documents stored as <strong>BSON</strong> in collections; <strong>one document</strong> is the unit of atomicity, locality and usually of reading — design documents around your <strong>queries, not your entities</strong>.</li>
    <li>Single-document writes are atomic; turning a cross-document invariant into a single-document one beats a multi-document transaction.</li>
    <li>Embed: one-to-few, read together, owned. Reference: unbounded, shared, independently updated. Extended reference copies a few stable display fields.</li>
    <li>16 MB document cap; unbounded arrays are the #1 modelling bug → child collection, <code>$slice</code>, or bucket pattern.</li>
    <li>Compound indexes follow a prefix rule and ESR ordering; multikey = one entry per array element, no two array fields in one compound index; TTL deletes are periodic, not exact; partial indexes beat sparse.</li>
    <li>explain("executionStats"): avoid COLLSCAN and SORT stages; keys examined ≈ docs examined ≈ returned; IXSCAN without FETCH = covered.</li>
    <li>Aggregation: <code>$match</code>/<code>$sort</code> first (index-eligible), <code>$limit</code> before <code>$lookup</code>, blocking stages have memory limits; <code>$setWindowFields</code> for running totals and ranks.</li>
    <li>Write concern = how durable (majority survives failover; w:1 can roll back). Read concern = what data is visible. Read preference = which member (secondaries can be stale).</li>
    <li>Transactions need a replica set, default 60s lifetime, abort on write conflict, retry the whole callback — keep it idempotent with no side effects.</li>
    <li>Replica set: 3 or 5 voting members across zones, majority elections, oplog replication, change streams with resume tokens.</li>
    <li>Shard key: high cardinality, even distribution, non-monotonic, in most queries; otherwise hot shards, jumbo chunks or scatter-gather.</li>
    <li>Mongoose: <code>lean()</code> for reads, <code>runValidators</code> on updates, <code>populate</code> is extra queries; pair with a DB-level <code>$jsonSchema</code>.</li>
    <li>Security: validate input types (operator injection like <code>{ $ne: null }</code>), cache one MongoClient per process (serverless!).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Modelling MongoDB like SQL</strong> — a collection per table, <code>$lookup</code> on every screen, transactions on every write — or the opposite extreme, stuffing ever-growing arrays into one document. Both come from skipping the first step: list the access patterns and their frequencies, then shape documents so the hot reads are one document and the invariants live inside one document.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I design Mongo documents around access patterns: embed what's read together and bounded, reference what's unbounded or shared, and copy a few stable fields as an extended reference to avoid lookups."</div>
  <div class="revision-say">"For compound indexes I follow Equality, Sort, Range — and I confirm with explain that there's no SORT stage and keys examined is close to documents returned."</div>
  <div class="revision-say">"Single-document atomicity is my first tool for invariants; I use multi-document transactions sparingly, with majority write concern and idempotent retry-safe callbacks."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What MongoDB is</h3>
<ul>
  <li><strong>Documents</strong>: nested objects and arrays, stored as BSON (binary JSON with extra types: <code>ObjectId</code>, <code>Date</code>, <code>Decimal128</code>, <code>Int64</code>, binary). Max <strong>16 MB</strong> per document.</li>
  <li><strong>Collections</strong>: groups of documents; schema is flexible by default but can be enforced with <code>$jsonSchema</code> validators.</li>
  <li><strong>Storage engine</strong>: WiredTiger — document-level concurrency control, compression, a cache (by default roughly half of RAM minus 1 GB; check current docs), B-tree indexes.</li>
  <li><strong>Deployment</strong>: a <strong>replica set</strong> (one primary + secondaries) is the minimum production unit; <strong>sharded clusters</strong> partition data across replica sets. Atlas is the managed offering; Amazon DocumentDB and Azure Cosmos DB offer Mongo-compatible APIs with real behavioural differences — never assume parity, check their compatibility docs.</li>
</ul>

<h3>Why teams choose it</h3>
<ul>
  <li><strong>Aggregate-shaped data</strong>: an order with its line items, a device with its config, a form submission with variable fields — read and written as one unit, no joins.</li>
  <li><strong>Heterogeneous records</strong>: product catalogs where each category has different attributes; integration payloads from many customers that differ in shape.</li>
  <li><strong>JSON end to end</strong>: a React Native client, a Node API and the DB all speak objects; low friction for prototypes.</li>
  <li><strong>Horizontal scale built in</strong>: sharding and replica sets are first-class features rather than add-ons.</li>
</ul>

<h3>Why teams regret it</h3>
<ul>
  <li>The data turns out to be <strong>highly relational</strong> (many-to-many, reporting across entities) → <code>$lookup</code> everywhere, duplicated data drifting out of sync.</li>
  <li>"Schemaless" becomes "five shapes of the same document" after two years of releases.</li>
  <li>Unbounded arrays (comments inside a post, events inside a device) hit the 16 MB limit or make every update rewrite a huge document.</li>
  <li>A poor shard key chosen early → hotspots, scatter-gather queries, painful resharding.</li>
</ul>

<h3>MongoDB vs SQL — the decision table</h3>
<table>
  <thead><tr><th>Question</th><th>Leans MongoDB</th><th>Leans SQL (MySQL / Postgres)</th></tr></thead>
  <tbody>
    <tr><td>Access pattern</td><td>Fetch/update one aggregate by id; few, known queries</td><td>Ad-hoc queries, reporting, many joins</td></tr>
    <tr><td>Shape</td><td>Nested, variable per record</td><td>Uniform rows, many-to-many relations</td></tr>
    <tr><td>Invariants</td><td>Mostly within one document</td><td>Across rows/tables (FKs, uniqueness across entities, ledgers)</td></tr>
    <tr><td>Transactions</td><td>Rare; single-doc atomicity covers most writes</td><td>Frequent multi-row transactions</td></tr>
    <tr><td>Scale-out writes</td><td>Native sharding</td><td>Vitess/Citus/app-level sharding, or vertical scale</td></tr>
    <tr><td>Team &amp; tooling</td><td>JS-heavy team, Atlas features (search, vector search, triggers)</td><td>BI tools, SQL-fluent analysts, mature migrations</td></tr>
  </tbody>
</table>
<p>Senior framing: "Postgres with JSONB covers a lot of 'I need flexible fields' cases. I reach for MongoDB when the core entity is a self-contained aggregate, the shape varies, and the access patterns are known and keyed — and I still design the schema deliberately." Atlas also offers vector search; compare with pgvector in <a href="#/topic/ai-vector-search">Vector Search</a>.</p>

<h3>Terminology map for SQL people</h3>
<table>
  <thead><tr><th>SQL</th><th>MongoDB</th></tr></thead>
  <tbody>
    <tr><td>table / row / column</td><td>collection / document / field</td></tr>
    <tr><td>primary key</td><td><code>_id</code> (default <code>ObjectId</code>: 4-byte timestamp + random + counter → roughly time-ordered)</td></tr>
    <tr><td>JOIN</td><td>embedding, or <code>$lookup</code> in aggregation</td></tr>
    <tr><td>GROUP BY</td><td><code>$group</code></td></tr>
    <tr><td>WHERE / HAVING</td><td><code>$match</code> before / after <code>$group</code></td></tr>
    <tr><td>binlog</td><td>oplog (a capped collection on each replica set member)</td></tr>
    <tr><td>ALTER TABLE</td><td>nothing — old and new shapes coexist; you migrate lazily or with scripts</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>1. A document is a pre-joined aggregate</h3>
<div class="diagram">
<pre>
 SQL: 4 tables, 3 joins per read             MongoDB: 1 document, 1 read
 ┌────────┐ ┌──────────┐ ┌──────────┐        {
 │ orders │─│order_item│─│ products │          _id: ObjectId("..."),
 └────────┘ └──────────┘ └──────────┘          userId: ObjectId("..."),
      │                                        status: "paid",
 ┌──────────┐                                  shipTo: { city: "Pune", pin: "411001" },
 │ addresses│                                  items: [                     ◄ embedded, bounded
 └──────────┘                                    { sku: "A1", name: "Mug", qty: 2, price: 349 },
                                                 { sku: "B7", name: "Tee", qty: 1, price: 799 }
                                               ],
                                               total: 1497,                 ◄ computed on write
                                               createdAt: ISODate("2026-11-05T10:00:00Z")
                                             }
 Writes to ONE document are atomic → no transaction needed to keep items + total consistent.
</pre>
</div>

<h3>2. Embed vs reference — the decision tree</h3>
<div class="diagram">
<pre>
                     Is the child read together with the parent most of the time?
                        │ no ─────────────────────────────► REFERENCE (separate collection)
                        │ yes
                     Is the child set BOUNDED (tens–hundreds, not ever-growing)?
                        │ no ─────────────────────────────► REFERENCE, or BUCKET pattern
                        │ yes
                     Is the child shared by many parents / updated independently?
                        │ yes ────────────────────────────► REFERENCE (+ extended-reference
                        │                                    copy of the few fields you show)
                        │ no
                     EMBED
</pre>
</div>
<table>
  <thead><tr><th>Relationship</th><th>Typical model</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>One-to-few</td><td>Embed array</td><td>User → 3 addresses</td></tr>
    <tr><td>One-to-many (bounded)</td><td>Embed, or child references array on the parent</td><td>Order → line items</td></tr>
    <tr><td>One-to-squillions</td><td>Child stores parent id (reference on the "many" side)</td><td>Device → telemetry events; post → comments</td></tr>
    <tr><td>Many-to-many</td><td>Arrays of ids on one or both sides, or a link collection</td><td>Users ↔ rooms they can book</td></tr>
  </tbody>
</table>

<h3>3. ESR — how to order compound index fields</h3>
<div class="diagram">
<pre>
 Query:  db.bookings.find({ tenantId: T, status: "confirmed", startsAt: { $gte: d1, $lt: d2 } })
                     .sort({ startsAt: 1 })      ← sort field = range field here

 General case:  { E fields } then { S fields } then { R fields }

 find({ tenantId: T, roomId: R, createdAt: { $gt: X } }).sort({ priority: -1 })
 → index { tenantId: 1, roomId: 1,   priority: -1,   createdAt: 1 }
            ─── Equality ──────   ── Sort ──     ── Range ──

 Why: equality narrows to one contiguous slice; inside it entries are already ordered by
 the sort field (no in-memory SORT); the range is then filtered while walking the slice.
 Put the range before the sort and the index walk returns rows ordered by createdAt,
 not priority → blocking in-memory SORT stage.
</pre>
</div>

<h3>4. Replica set — one writer, many copies, automatic failover</h3>
<div class="diagram">
<pre>
                    writes (and default reads)
        app ─────────────────────────────────┐
     (driver knows                           ▼
      the topology)              ┌──────────────────────┐
                                 │  PRIMARY             │
                                 │  applies write,      │
                                 │  appends to oplog    │
                                 └──────┬───────┬───────┘
                       oplog tailing    │       │   oplog tailing
                         ┌──────────────┘       └──────────────┐
                ┌────────▼─────────┐                  ┌────────▼─────────┐
                │ SECONDARY        │◄── heartbeats ──►│ SECONDARY        │
                │ replays oplog    │                  │ replays oplog    │
                └──────────────────┘                  └──────────────────┘
  Primary unreachable (election timeout, ~10s default — check docs) → secondaries elect a
  new primary by majority vote. Needs a MAJORITY of voting members → 3 (or 5) members,
  ideally across availability zones. Writes acknowledged with w:"majority" survive failover;
  w:1 writes can be ROLLED BACK if the old primary hadn't replicated them.
</pre>
</div>

<h3>5. Sharded cluster — route by shard key</h3>
<div class="diagram">
<pre>
           app ──► mongos (router, stateless, run several)
                      │  consults routing table from CONFIG SERVERS (a replica set)
       ┌──────────────┼─────────────────────────┐
       ▼              ▼                         ▼
   shard A (RS)    shard B (RS)            shard C (RS)
   key range        key range               key range
   [minKey, k1)     [k1, k2)                [k2, maxKey)      ← chunks / ranges,
                                                                 moved by the BALANCER
 Query includes the shard key  → TARGETED to one shard (fast, scales)
 Query lacks the shard key     → SCATTER-GATHER to all shards (cost grows with shard count)
</pre>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>CRUD with the official Node driver</h3>
<pre><code class="language-ts">// db.ts — one MongoClient per process; it is a connection POOL, reuse it
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL!, {
  maxPoolSize: 20,               // per process
  retryWrites: true,             // default true with modern drivers
  w: 'majority',                 // explicit is better than relying on defaults
});
await client.connect();
export const db = client.db('booking');

type Booking = {
  _id?: ObjectId; tenantId: ObjectId; roomId: ObjectId; userId: ObjectId;
  status: 'confirmed' | 'checked_in' | 'cancelled';
  startsAt: Date; endsAt: Date; attendees: { userId: ObjectId; name: string }[];
  createdAt: Date; version: number;
};
export const bookings = db.collection&lt;Booking&gt;('bookings');

// Create
const { insertedId } = await bookings.insertOne({
  tenantId, roomId, userId, status: 'confirmed', startsAt, endsAt,
  attendees: [], createdAt: new Date(), version: 0,
});

// Read with projection (only the fields the tablet needs)
const today = await bookings
  .find(
    { roomId, status: { $ne: 'cancelled' }, startsAt: { $gte: dayStart, $lt: dayEnd } },
    { projection: { startsAt: 1, endsAt: 1, 'attendees.name': 1 } }
  )
  .sort({ startsAt: 1 })
  .limit(50)
  .toArray();

// Atomic update operators — no read-modify-write in app code
await bookings.updateOne(
  { _id: insertedId, status: 'confirmed' },             // guard in the filter
  { $set: { status: 'checked_in' }, $inc: { version: 1 } }
);
await bookings.updateOne(
  { _id: insertedId, 'attendees.userId': { $ne: guestId } },   // no duplicates
  { $push: { attendees: { userId: guestId, name: 'Asha' } } }
);

// Upsert: create-or-update in one atomic operation
await db.collection('roomStats').updateOne(
  { roomId, day: '2026-11-05' },
  { $inc: { bookings: 1 }, $setOnInsert: { createdAt: new Date() } },
  { upsert: true }
);

// findOneAndUpdate: claim a job atomically (returns the doc)
const job = await db.collection('jobs').findOneAndUpdate(
  { status: 'pending', runAt: { $lte: new Date() } },
  { $set: { status: 'running', lockedAt: new Date() } },
  { sort: { runAt: 1 }, returnDocument: 'after' }
);</code></pre>
<p>Driver return shapes (e.g. whether <code>findOneAndUpdate</code> returns the document or a wrapper) changed between major driver versions — check the docs for the version you're on.</p>

<h3>Index types</h3>
<table>
  <thead><tr><th>Type</th><th>Create</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Single field</td><td><code>{ email: 1 }</code></td><td><code>_id</code> is indexed automatically (unique)</td></tr>
    <tr><td>Compound</td><td><code>{ tenantId: 1, status: 1, startsAt: 1 }</code></td><td>Prefix rule like SQL; follow ESR; direction matters only for multi-field sorts</td></tr>
    <tr><td>Multikey</td><td>any index on an array field</td><td>One index entry <em>per array element</em>; a compound index can include at most one array field per document</td></tr>
    <tr><td>Unique</td><td><code>{ tenantId: 1, email: 1 }, { unique: true }</code></td><td>Enforced per index; on sharded collections only if the index is prefixed by the shard key</td></tr>
    <tr><td>Partial</td><td><code>{ partialFilterExpression: { status: 'confirmed' } }</code></td><td>Smaller index; queries must include the filter to use it. Preferred over sparse</td></tr>
    <tr><td>TTL</td><td><code>{ createdAt: 1 }, { expireAfterSeconds: 86400 }</code></td><td>Single date field; a background monitor deletes expired docs about once a minute — not exact</td></tr>
    <tr><td>Text / Atlas Search</td><td><code>{ title: 'text' }</code></td><td>Basic text index; Atlas Search (Lucene) for real search</td></tr>
    <tr><td>Geospatial</td><td><code>{ location: '2dsphere' }</code></td><td><code>$near</code>, <code>$geoWithin</code></td></tr>
    <tr><td>Hashed</td><td><code>{ deviceId: 'hashed' }</code></td><td>Mainly for hashed shard keys; no range queries</td></tr>
    <tr><td>Wildcard</td><td><code>{ 'attrs.$**': 1 }</code></td><td>Unknown/variable keys; not a substitute for designed compound indexes</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">await bookings.createIndexes([
  { key: { roomId: 1, startsAt: 1 }, name: 'room_start' },
  { key: { tenantId: 1, status: 1, startsAt: 1 }, name: 'tenant_status_start' },
  { key: { userId: 1, startsAt: -1 }, name: 'user_recent' },
]);
await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // expire AT the date
await db.collection('users').createIndex(
  { tenantId: 1, email: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }   // case-insensitive uniqueness
);</code></pre>

<h3>Reading explain("executionStats")</h3>
<pre><code class="language-js">db.bookings.find({ tenantId: T, status: "confirmed", startsAt: { $gte: d1 } })
           .sort({ startsAt: 1 })
           .explain("executionStats")</code></pre>
<table>
  <thead><tr><th>Field / stage</th><th>Meaning</th><th>Healthy</th></tr></thead>
  <tbody>
    <tr><td><code>COLLSCAN</code></td><td>Full collection scan</td><td>Only on tiny collections</td></tr>
    <tr><td><code>IXSCAN</code> → <code>FETCH</code></td><td>Walk index, then load documents</td><td>Normal</td></tr>
    <tr><td><code>IXSCAN</code> with no <code>FETCH</code></td><td>Covered query (projection only indexed fields, <code>_id: 0</code>)</td><td>Best</td></tr>
    <tr><td><code>SORT</code></td><td>Blocking in-memory sort (memory-limited; may spill to disk)</td><td>Avoid on hot paths — fix the index order</td></tr>
    <tr><td><code>totalKeysExamined</code></td><td>Index entries walked</td><td>≈ nReturned</td></tr>
    <tr><td><code>totalDocsExamined</code></td><td>Documents fetched</td><td>≈ nReturned (0 if covered)</td></tr>
    <tr><td><code>nReturned</code></td><td>Results</td><td>—</td></tr>
    <tr><td><code>rejectedPlans</code></td><td>Other plans the planner raced and discarded</td><td>Look here when the "wrong" index wins</td></tr>
  </tbody>
</table>
<p>The ratio to watch: <strong>keys examined : docs examined : returned</strong>. 1 : 1 : 1 is perfect; 50,000 : 50,000 : 20 means the index isn't selective for this query.</p>

<h3>Aggregation pipeline</h3>
<p>A pipeline is an array of stages; documents flow through like a Unix pipe. Core stages: <code>$match</code>, <code>$project</code> / <code>$set</code> (alias <code>$addFields</code>), <code>$group</code>, <code>$sort</code>, <code>$limit</code>, <code>$skip</code>, <code>$unwind</code>, <code>$lookup</code>, <code>$facet</code>, <code>$bucket</code>, <code>$setWindowFields</code> (5.0+), <code>$merge</code> / <code>$out</code> (write results).</p>
<pre><code class="language-ts">// Room utilisation per tenant for November, top 3 rooms each
const result = await bookings.aggregate([
  { $match: {                                   // FIRST: uses tenant_status_start index
      tenantId, status: { $ne: 'cancelled' },
      startsAt: { $gte: new Date('2026-11-01'), $lt: new Date('2026-12-01') },
  } },
  { $group: {
      _id: '$roomId',
      bookings: { $sum: 1 },
      minutes: { $sum: { $dateDiff: { startDate: '$startsAt', endDate: '$endsAt', unit: 'minute' } } },
  } },
  { $sort: { minutes: -1 } },
  { $limit: 3 },
  { $lookup: {                                  // AFTER narrowing to 3 docs
      from: 'rooms', localField: '_id', foreignField: '_id', as: 'room',
      pipeline: [{ $project: { name: 1, capacity: 1 } }],
  } },
  { $unwind: '$room' },
  { $project: { _id: 0, roomId: '$_id', name: '$room.name', bookings: 1,
                hours: { $round: [{ $divide: ['$minutes', 60] }, 1] } } },
]).toArray();</code></pre>
<ul>
  <li><strong>Order matters</strong>: <code>$match</code> and <code>$sort</code> at the start can use indexes; after a <code>$group</code> or <code>$project</code> nothing can. Filter and limit before <code>$lookup</code>.</li>
  <li><strong>Memory</strong>: blocking stages (<code>$group</code>, <code>$sort</code>) have a per-stage memory limit (historically 100 MB) and spill to disk when allowed (<code>allowDiskUse</code>; defaults changed in 6.0 — check current docs).</li>
  <li><strong><code>$lookup</code></strong> is a per-document nested lookup into another collection — index the <code>foreignField</code>. Support for a sharded <code>from</code> collection arrived in later versions; check docs for your cluster.</li>
  <li><strong>Output</strong>: aggregation results are documents and must fit 16 MB each; the cursor itself streams.</li>
</ul>

<h3>Window functions in aggregation ($setWindowFields)</h3>
<pre><code class="language-ts">// Running total of bookings per room per day (the Mongo equivalent of SUM() OVER)
await db.collection('roomDaily').aggregate([
  { $match: { tenantId } },
  { $setWindowFields: {
      partitionBy: '$roomId',
      sortBy: { day: 1 },
      output: {
        runningBookings: { $sum: '$bookings', window: { documents: ['unbounded', 'current'] } },
        ma7:             { $avg: '$bookings', window: { documents: [-6, 0] } },
        rank:            { $denseRank: {} },
      },
  } },
]).toArray();</code></pre>

<h3>Write concern, read concern, read preference</h3>
<table>
  <thead><tr><th>Knob</th><th>Values</th><th>What it controls</th></tr></thead>
  <tbody>
    <tr><td><strong>Write concern</strong> <code>w</code></td><td><code>0</code>, <code>1</code>, <code>"majority"</code>, number; plus <code>j: true</code>, <code>wtimeout</code></td><td>How many members must acknowledge before success. <code>majority</code> = survives failover (default for most topologies since 5.0 — check docs for arbiter setups)</td></tr>
    <tr><td><strong>Read concern</strong></td><td><code>local</code>, <code>available</code>, <code>majority</code>, <code>linearizable</code>, <code>snapshot</code></td><td>What data a read may return. <code>local</code> can return data later rolled back; <code>majority</code> only returns majority-committed data</td></tr>
    <tr><td><strong>Read preference</strong></td><td><code>primary</code> (default), <code>primaryPreferred</code>, <code>secondary</code>, <code>secondaryPreferred</code>, <code>nearest</code></td><td>Which member serves the read. Secondaries may be stale</td></tr>
  </tbody>
</table>
<p>Causal consistency: within a <em>causally consistent session</em> using majority read/write concerns, a client reads its own writes even from secondaries. Retryable writes (on by default in modern drivers) let the driver safely retry once on a network blip / failover.</p>

<h3>Multi-document transactions</h3>
<pre><code class="language-ts">const session = client.startSession();
try {
  await session.withTransaction(async () =&gt; {
    const wallets = db.collection('wallets');
    const res = await wallets.updateOne(
      { _id: fromId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { session }                                  // EVERY op must pass the session
    );
    if (res.modifiedCount !== 1) throw new Error('INSUFFICIENT_FUNDS'); // aborts
    await wallets.updateOne({ _id: toId }, { $inc: { balance: amount } }, { session });
    await db.collection('ledger').insertOne(
      { fromId, toId, amount, at: new Date() }, { session }
    );
  }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
} finally {
  await session.endSession();
}</code></pre>
<ul>
  <li>Require a <strong>replica set</strong> (or sharded cluster) — a standalone <code>mongod</code> can't run them. For local dev run a single-node replica set (Prisma's MongoDB connector also needs one).</li>
  <li><code>withTransaction</code> retries on <code>TransientTransactionError</code> and <code>UnknownTransactionCommitResult</code> — so the callback must be <strong>idempotent</strong> and free of side effects (no emails or HTTP calls inside).</li>
  <li>Default max lifetime is 60 seconds (<code>transactionLifetimeLimitSeconds</code>); keep them short and small. Write conflicts abort one transaction (no lock waits like InnoDB).</li>
  <li>If you need transactions everywhere, your model is probably relational — revisit it.</li>
</ul>

<h3>Mongoose — the ODM most Node codebases use</h3>
<p>You will typically wire this into an <a href="#/topic/be-express">Express</a> app (connect once at startup, share the model) or a <a href="#/topic/be-nestjs">NestJS</a> module (<code>@nestjs/mongoose</code> registers schemas as injectable models).</p>
<pre><code class="language-ts">import mongoose, { Schema, model, InferSchemaType } from 'mongoose';

const attendeeSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                                    name: String }, { _id: false });

const bookingSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  roomId:   { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status:   { type: String, enum: ['confirmed', 'checked_in', 'cancelled'], default: 'confirmed' },
  startsAt: { type: Date, required: true },
  endsAt:   { type: Date, required: true,
              validate: { validator(this: any, v: Date) { return v &gt; this.startsAt; }, message: 'endsAt must be after startsAt' } },
  attendees: { type: [attendeeSchema], validate: [(a: unknown[]) =&gt; a.length &lt;= 50, 'max 50 attendees'] },
}, { timestamps: true, optimisticConcurrency: true });   // version check on save()

bookingSchema.index({ roomId: 1, startsAt: 1 });
bookingSchema.index({ tenantId: 1, status: 1, startsAt: 1 });

bookingSchema.pre('save', function (next) {               // document middleware
  if (this.isModified('status') &amp;&amp; this.status === 'cancelled') { /* audit hook */ }
  next();
});

export type BookingDoc = InferSchemaType&lt;typeof bookingSchema&gt;;
export const Booking = model('Booking', bookingSchema);

// Reads: lean() returns plain objects — much faster, no getters/setters/save()
const list = await Booking.find({ roomId, startsAt: { $gte: dayStart } })
  .select('startsAt endsAt userId')
  .sort({ startsAt: 1 })
  .populate('userId', 'name')     // a SECOND query: users where _id in [...]
  .lean();

// Updates: validators do NOT run on updates unless you ask
await Booking.updateOne({ _id: id }, { $set: { endsAt } }, { runValidators: true });

// Transactions in Mongoose
await mongoose.connection.transaction(async (session) =&gt; {
  await Booking.create([{ tenantId, roomId, userId, startsAt, endsAt }], { session });
  await RoomStats.updateOne({ roomId }, { $inc: { total: 1 } }, { session, upsert: true });
});</code></pre>
<p>Mongoose defaults have changed across majors (for example <code>strictQuery</code>, removal of callbacks, connection-option defaults) — check the migration guide for the version in your codebase rather than trusting old Stack Overflow answers.</p>

<h3>Schema validation in the database</h3>
<pre><code class="language-js">db.runCommand({
  collMod: "bookings",
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["tenantId", "roomId", "startsAt", "endsAt", "status"],
    properties: {
      status:   { enum: ["confirmed", "checked_in", "cancelled"] },
      startsAt: { bsonType: "date" },
      endsAt:   { bsonType: "date" }
    }
  } },
  validationLevel: "moderate",     // existing invalid docs aren't blocked on unrelated updates
  validationAction: "error"        // or "warn" while migrating
})</code></pre>
<p>Mongoose validation only protects writes that go through Mongoose. A DB-level validator protects against scripts, other services and the Atlas UI.</p>

<h3>Sharding mechanics</h3>
<ul>
  <li><strong>Shard key</strong>: a field (or compound fields) present in every document; data is split into ranges (chunks) by key and spread across shards. Strategies: <strong>ranged</strong> (efficient range queries, risk of hot ranges) and <strong>hashed</strong> (even writes, range queries scatter).</li>
  <li><strong>Good shard key</strong>: high cardinality, even frequency, non-monotonic writes, and present in most queries. Typical winner: <code>{ tenantId: 1, _id: 1 }</code> or <code>{ deviceId: 'hashed' }</code>.</li>
  <li><strong>Bad shard keys</strong>: monotonically increasing (<code>createdAt</code>, default <code>ObjectId</code>) → every insert hits the last chunk ("hot shard"); low cardinality (<code>status</code>, <code>country</code>) → jumbo chunks that can't split.</li>
  <li>Changing it used to be near-impossible; newer versions add <code>refineCollectionShardKey</code> and live <code>reshardCollection</code> — check current docs for version support and cost.</li>
  <li>Shard only when one replica set genuinely can't hold the working set or write load; a well-indexed replica set goes a long way.</li>
</ul>

<h3>Change streams</h3>
<pre><code class="language-ts">// React to booking changes (e.g. push to room tablets) — needs a replica set
const stream = bookings.watch(
  [{ $match: { operationType: { $in: ['insert', 'update'] }, 'fullDocument.roomId': roomId } }],
  { fullDocument: 'updateLookup' }
);
for await (const change of stream) {
  await pushToTablet(change.fullDocument);
  await saveResumeToken(change._id);   // resume after a restart without missing events
}</code></pre>
<p>Change streams are built on the oplog; if your consumer is down longer than the oplog window, the resume token becomes invalid. For durable, replayable fan-out at scale, publish to <a href="#/topic/be-kafka">Kafka</a> (e.g. via the outbox pattern in <a href="#/topic/be-queues">Queues</a>).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Modelling a meeting-room booking product</h3>
<p>Access patterns first (this is what interviewers want to hear before any schema):</p>
<ol>
  <li>Tablet: "today's bookings for room R" — every 30s per device, latency-critical.</li>
  <li>Mobile app: "my upcoming bookings" — paginated.</li>
  <li>Admin: "utilisation per room per month" — reporting.</li>
  <li>Booking create/cancel/check-in — must not double-book.</li>
</ol>
<pre><code class="language-js">// rooms — small, read-mostly; embed config and amenities (bounded)
{ _id, tenantId, name: "Everest", capacity: 8, floor: 3,
  amenities: ["tv", "whiteboard"], device: { id: "tab-031", lastSeenAt: ISODate() } }

// bookings — one doc per booking; reference room &amp; user, EXTENDED REFERENCE copies
// the few display fields so the tablet never needs $lookup
{ _id, tenantId, roomId, room: { name: "Everest" },
  userId, user: { name: "Asha P" },
  status: "confirmed", startsAt: ISODate(), endsAt: ISODate(),
  attendees: [ { userId, name } ],          // bounded (validated max 50)
  createdAt, updatedAt, __v }

// roomDaily — COMPUTED pattern, maintained by $inc on every booking change
{ _id: { roomId, day: "2026-11-05" }, tenantId, bookings: 12, minutes: 540 }</code></pre>
<p>Indexes: <code>{ roomId: 1, startsAt: 1 }</code> (pattern 1), <code>{ userId: 1, startsAt: 1 }</code> (pattern 2), roomDaily by <code>_id</code> (pattern 3). Trade-off stated: if a user renames themselves, <code>user.name</code> in old bookings is stale — acceptable (it's historical), or fix with a background job. Duplicating <em>immutable or rarely-changing</em> fields is fine; duplicating volatile fields is a bug farm.</p>

<h3>Example 2 — Preventing double booking without multi-doc transactions</h3>
<p>Mongo has no row/range locks to lean on, and no exclusion constraints. Options:</p>
<pre><code class="language-ts">// Option A: slot documents + a unique index (fixed 15-min grid)
await db.collection('slots').createIndex({ roomId: 1, slot: 1 }, { unique: true });

async function book(roomId: ObjectId, start: Date, end: Date, bookingId: ObjectId) {
  const slots = [];
  for (let t = start.getTime(); t &lt; end.getTime(); t += 15 * 60_000) {
    slots.push({ roomId, slot: new Date(t), bookingId });
  }
  const session = client.startSession();
  try {
    await session.withTransaction(async () =&gt; {
      await db.collection('slots').insertMany(slots, { session, ordered: true }); // E11000 if taken
      await bookings.insertOne({ _id: bookingId, roomId, startsAt: start, endsAt: end /* ... */ }, { session });
    });
  } catch (e: any) {
    if (e.code === 11000) throw new ConflictError('ROOM_TAKEN');
    throw e;
  } finally { await session.endSession(); }
}

// Option B: per-room-per-day document holding that day's bookings (bounded: ~30/day)
// The guard and the write are ONE atomic single-document update — no transaction.
const res = await db.collection('roomDays').updateOne(
  { _id: roomId.toHexString() + ':2026-11-05',
    items: { $not: { $elemMatch: { startsAt: { $lt: end }, endsAt: { $gt: start } } } } },
  { $push: { items: { bookingId, startsAt: start, endsAt: end } } },
  { upsert: false }
);
if (res.modifiedCount === 0) throw new ConflictError('ROOM_TAKEN_OR_DAY_MISSING');</code></pre>
<p>Option B is the senior answer: it turns a cross-document invariant into a <strong>single-document invariant</strong>, which Mongo guarantees atomically. (Pre-create the day documents, or handle the missing-doc case separately so an upsert can't bypass the overlap check.) Contrast with the MySQL approach of locking the room row in <a href="#/topic/be-mysql">MySQL &amp; SQL Deep</a>.</p>

<h3>Example 3 — ESR fix with explain()</h3>
<pre><code class="language-js">// Admin list: tenant's confirmed bookings in a date range, newest first
db.bookings.find({ tenantId: T, status: "confirmed", startsAt: { $gte: d1, $lt: d2 } })
           .sort({ createdAt: -1 }).limit(50)

// Existing index { tenantId: 1, startsAt: 1, status: 1 }  (range before equality, no sort field)
executionStats: {
  nReturned: 50, totalKeysExamined: 48210, totalDocsExamined: 48210, executionTimeMillis: 412
  winningPlan: LIMIT &lt;- SORT(createdAt -1) &lt;- FETCH &lt;- IXSCAN { tenantId, startsAt, status }
}

// ESR index: Equality (tenantId, status) → Sort (createdAt) → Range (startsAt)
db.bookings.createIndex({ tenantId: 1, status: 1, createdAt: -1, startsAt: 1 })

executionStats: {
  nReturned: 50, totalKeysExamined: 61, totalDocsExamined: 50, executionTimeMillis: 2
  winningPlan: LIMIT &lt;- FETCH &lt;- IXSCAN { tenantId, status, createdAt, startsAt }   // no SORT
}</code></pre>
<p>Walk-through: the old index put the range field second, so the planner had to fetch every in-range doc and sort 48k of them in memory to return 50. The ESR index walks entries already ordered by <code>createdAt</code> inside the (tenant, confirmed) slice, checks <code>startsAt</code> on the index key, and stops after ~50 matches. (Plan output above is abridged/illustrative; real output is nested JSON.)</p>

<h3>Example 4 — Bucket pattern for device telemetry</h3>
<pre><code class="language-js">// BAD: one doc per reading → billions of tiny docs, huge _id + index overhead
// BAD: all readings in the device doc → unbounded array, 16 MB wall

// GOOD: one bucket doc per device per hour (≤ 360 readings at 10s)
db.telemetry.updateOne(
  { deviceId: "tab-031", hour: ISODate("2026-11-05T10:00:00Z"), count: { $lt: 360 } },
  { $push: { readings: { t: ISODate("2026-11-05T10:14:30Z"), battery: 81, temp: 34.2 } },
    $inc:  { count: 1, sumBattery: 81 },
    $min:  { minBattery: 81 } },
  { upsert: true }
)</code></pre>
<p>Pre-aggregates (<code>sumBattery</code>, <code>minBattery</code>) make dashboards cheap. MongoDB also ships native <strong>time-series collections</strong> that do this bucketing internally — prefer them for new telemetry workloads (check current docs for their update/delete limitations).</p>

<h3>Example 5 — Keyset pagination for an RN infinite list</h3>
<pre><code class="language-ts">// Cursor = last item's (startsAt, _id); index { userId: 1, startsAt: 1, _id: 1 }
async function myBookings(userId: ObjectId, after?: { startsAt: Date; id: ObjectId }) {
  const filter: Record&lt;string, unknown&gt; = { userId, status: { $ne: 'cancelled' } };
  if (after) {
    filter.$or = [
      { startsAt: { $gt: after.startsAt } },
      { startsAt: after.startsAt, _id: { $gt: after.id } },
    ];
  }
  const page = await bookings.find(filter).sort({ startsAt: 1, _id: 1 }).limit(21).toArray();
  const hasMore = page.length === 21;
  const items = page.slice(0, 20);
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore &amp;&amp; last ? { startsAt: last.startsAt, id: last._id } : null };
}</code></pre>
<p><code>skip(n)</code> has the same linear cost as SQL OFFSET. Fetching <code>limit + 1</code> tells you whether there's a next page without a <code>countDocuments</code> call.</p>

<h3>Example 6 — Aggregation: daily check-in rate with $facet</h3>
<pre><code class="language-ts">const [stats] = await bookings.aggregate([
  { $match: { tenantId, startsAt: { $gte: monthStart, $lt: monthEnd } } },
  { $facet: {
      byStatus: [ { $group: { _id: '$status', n: { $sum: 1 } } } ],
      byDay: [
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$startsAt', timezone: 'Asia/Kolkata' } },
            total: { $sum: 1 },
            checkedIn: { $sum: { $cond: [{ $eq: ['$status', 'checked_in'] }, 1, 0] } },
        } },
        { $set: { rate: { $round: [{ $multiply: [{ $divide: ['$checkedIn', '$total'] }, 100] }, 1] } } },
        { $sort: { _id: 1 } },
      ],
  } },
]).toArray();</code></pre>
<p>Note the <code>timezone</code> argument: grouping UTC dates into local days is the most common reporting bug.</p>

<h3>Example 7 — Lazy schema migration</h3>
<pre><code class="language-ts">// v1 docs: { name: "Asha Pandey" }   v2 docs: { firstName, lastName, schemaVersion: 2 }
function normalizeUser(doc: any) {
  if ((doc.schemaVersion ?? 1) &lt; 2) {
    const [firstName, ...rest] = String(doc.name ?? '').split(' ');
    return { ...doc, firstName, lastName: rest.join(' '), schemaVersion: 2 };
  }
  return doc;
}
// Read path normalizes; write path always writes v2; a background job backfills in batches:
// updateMany is fine for small sets, otherwise iterate by _id ranges and bulkWrite 1000 at a time.</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Document size and growth</h3>
<ul>
  <li>16 MB hard limit per document (use GridFS or object storage like S3 for files).</li>
  <li>Large documents are expensive even far below 16 MB: every update rewrites the document in WiredTiger, and every read pulls it into cache. A 2 MB "user" doc read on every request kills the cache.</li>
  <li>Arrays that grow forever (logs, comments, chat messages) — the most common modelling failure. Cap with <code>$push</code> + <code>$slice</code> (keep last N), or move to a child collection / bucket.</li>
</ul>

<h3>Multikey index limits</h3>
<ul>
  <li>A compound index can't contain two array fields in the same document ("cannot index parallel arrays").</li>
  <li>Multikey indexes can't cover queries on the array field in many cases, and a large array means many index entries per document → write amplification.</li>
  <li><code>$elemMatch</code> vs dotted conditions: <code>{ 'items.sku': 'A1', 'items.qty': { $gt: 5 } }</code> can match <em>different</em> elements; use <code>$elemMatch</code> when both conditions must hold on the same element.</li>
</ul>

<h3>Types and comparisons</h3>
<ul>
  <li><code>"42"</code> and <code>42</code> are different values — a query by string finds nothing if stored as number. ObjectId vs its hex string: same trap (very common when ids come from URL params).</li>
  <li>JavaScript numbers are doubles: use <code>Decimal128</code> (or integer minor units) for money.</li>
  <li><code>{ field: null }</code> matches documents where the field is null <em>or missing</em>; use <code>{ field: { $exists: false } }</code> or <code>{ field: { $type: 'null' } }</code> to distinguish.</li>
  <li>Sort order across mixed types follows BSON comparison order — another reason to keep a field single-typed.</li>
</ul>

<h3>Consistency surprises</h3>
<ul>
  <li><strong>Rollback</strong>: with <code>w: 1</code>, a write acknowledged by a primary that crashes before replicating can be rolled back after failover — "the API returned 201 but the data is gone".</li>
  <li><strong>Stale secondary reads</strong>: <code>secondaryPreferred</code> to "offload reads" causes read-your-writes bugs just like MySQL replicas.</li>
  <li><strong>Unique indexes on sharded collections</strong> must be prefixed by the shard key — "unique email across all tenants" isn't enforceable if you shard by <code>tenantId</code> (and is usually wrong for multi-tenant anyway).</li>
  <li><strong>Cursor isolation</strong>: a long-running cursor without snapshot read concern can see a document twice or miss it if it moves during the scan. Iterate on an indexed, immutable key (<code>_id</code>) for batch jobs.</li>
</ul>

<h3>TTL index behaviour</h3>
<ul>
  <li>Deletion runs periodically (about every 60 seconds) and can lag under load — never rely on TTL for security-critical expiry (also check <code>expiresAt</code> in the query).</li>
  <li>Only works on a single date field (or array of dates — earliest wins); doesn't work on compound indexes in older versions; deletes generate oplog traffic like any delete.</li>
</ul>

<h3>Transactions in practice</h3>
<ul>
  <li>Creating collections/indexes inside transactions has restrictions (relaxed over versions — check docs).</li>
  <li>Large transactions (many thousands of docs) stress the cache and oplog; batch outside a transaction where invariants allow.</li>
  <li>Write conflicts abort immediately rather than waiting — high contention on one hot document = many retries.</li>
</ul>

<h3>Connections</h3>
<ul>
  <li>Each <code>MongoClient</code> keeps a pool <em>per server</em> it talks to. Creating a client per request (classic serverless bug) exhausts connections; cache the client in module scope across Lambda invocations.</li>
  <li>Atlas tiers have connection limits; many app instances × <code>maxPoolSize</code> can exceed them.</li>
</ul>

<h3>Regex and case-insensitivity</h3>
<p>A case-insensitive regex (<code>/^asha/i</code>) can't use an index efficiently. Use a collation-aware index (strength 2) with matching collation in the query, store a normalized lowercase field, or use Atlas Search. An anchored, case-sensitive prefix regex (<code>/^Asha/</code>) can use an index.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>1. Modelling it like SQL ("one collection per table + $lookup everywhere")</h3>
<p>You get the costs of a document store (no FKs, weak joins) with none of the benefits. If every screen needs three <code>$lookup</code>s, either reshape documents around the access patterns or use a relational database.</p>

<h3>2. Unbounded arrays</h3>
<pre><code class="language-js">// BUG: grows forever; hits 16 MB; every $push rewrites a huge doc
db.rooms.updateOne({ _id: R }, { $push: { bookingHistory: booking } })

// FIX: child collection keyed by parent (one-to-squillions), or keep only the last N:
db.rooms.updateOne({ _id: R }, { $push: { recent: { $each: [booking], $slice: -20 } } })</code></pre>

<h3>3. Read-modify-write in app code</h3>
<pre><code class="language-ts">// BUG: lost update under concurrency
const room = await rooms.findOne({ _id });
room.bookedCount += 1;
await rooms.replaceOne({ _id }, room);

// FIX: atomic operator
await rooms.updateOne({ _id }, { $inc: { bookedCount: 1 } });
// or optimistic concurrency when the change is complex:
await rooms.updateOne({ _id, version: room.version }, { $set: { ...changes }, $inc: { version: 1 } });
// matchedCount === 0 → somebody else changed it, reload and retry</code></pre>

<h3>4. NoSQL injection</h3>
<pre><code class="language-ts">// BUG: body = { "email": "a@x.io", "password": { "$ne": null } } → logs in as anyone
const user = await users.findOne({ email: req.body.email, password: req.body.password });

// FIX: validate types at the edge (zod) so operators can't sneak in, and never query by password
const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
const user = await users.findOne({ email });
const ok = user &amp;&amp; await argon2.verify(user.passwordHash, password);
// Mongoose: keep sanitizeFilter / strictQuery protections on (check your version's defaults).</code></pre>

<h3>5. Indexes that don't match the query shape</h3>
<p>One single-field index per field, or compound indexes in "natural" order (range first) → SORT stages and huge <code>totalKeysExamined</code>. Design from the query using ESR and verify with explain. Remove unused ones (<code>$indexStats</code> shows access counts) — every index costs RAM and write time.</p>

<h3>6. <code>populate()</code> as a join engine</h3>
<p>Each <code>populate</code> is an extra query; nested populates in a list endpoint become N+1-ish fan-out. Use extended references (copy display fields), a single <code>$lookup</code> after narrowing, or batch with <code>$in</code>.</p>

<h3>7. Forgetting <code>lean()</code> on read-heavy endpoints</h3>
<p>Hydrated Mongoose documents are much heavier (change tracking, getters). For JSON APIs that just serialize results, <code>.lean()</code> is a cheap, large win. Caveat: lean results skip virtuals/getters and defaults unless plugins re-add them.</p>

<h3>8. Trusting Mongoose validation on updates</h3>
<p><code>updateOne</code>/<code>findOneAndUpdate</code> skip schema validators unless <code>runValidators: true</code>, and even then <code>this</code> in validators isn't the document. Bulk scripts bypass Mongoose entirely. Put critical rules in a DB <code>$jsonSchema</code> validator too.</p>

<h3>9. Monotonic shard key</h3>
<p>Sharding on <code>createdAt</code> or default <code>_id</code>: all inserts land on the max chunk, one shard is hot, the balancer constantly migrates. Use a hashed key or a compound key led by a well-distributed field.</p>

<h3>10. <code>w: 0</code> or <code>w: 1</code> "for speed" on important data</h3>
<p>Fire-and-forget writes lose data silently on errors; <code>w: 1</code> can be rolled back on failover. Use <code>majority</code> for anything users or money depend on; relax only for genuinely disposable data (metrics samples).</p>

<h3>11. Using ObjectId timestamps or <code>countDocuments</code> naively</h3>
<p>ObjectId's embedded timestamp has 1-second resolution and comes from the client clock — fine for rough ordering, not for business timestamps. <code>countDocuments</code> on a large filtered set is a scan; <code>estimatedDocumentCount</code> uses metadata but ignores filters.</p>

<h3>12. One giant "settings" document everyone updates</h3>
<p>A single hot document is a write-contention point (and transactions touching it conflict constantly). Split by tenant/user, or use counters sharded across N documents and sum on read.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. When would you embed and when would you reference?</div>
  <div class="qa-answer">
    <p>Embed when the child is read with the parent, is bounded in size, and belongs to that parent (order line items, a user's few addresses) — you get one read and single-document atomic updates. Reference when the child is unbounded (comments, events), shared across parents (products referenced by many orders), updated independently and often, or queried on its own. A common middle ground is the extended reference: store the id plus the couple of rarely-changing fields you display, so list screens don't need <code>$lookup</code>. I always start from the access patterns, not the entity diagram.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Explain the ESR rule with an example.</div>
  <div class="qa-answer">
    <p>Order compound index fields as Equality, then Sort, then Range. For <code>find({ tenantId, status: 'open', createdAt: { $gte: d } }).sort({ priority: -1 })</code>, the index is <code>{ tenantId: 1, status: 1, priority: -1, createdAt: 1 }</code>. Equality fields pin a contiguous slice; within it the entries are already sorted by priority so there's no in-memory SORT; the range on createdAt is filtered on index keys as we walk. If the range came before the sort field, results would come out ordered by createdAt and Mongo would have to sort them in memory. I'd verify with explain: no SORT stage, keys examined close to returned.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you read explain("executionStats") to decide if a query is healthy?</div>
  <div class="qa-answer">
    <p>Look at the winning plan stages and three numbers. Stages: COLLSCAN is a full scan; IXSCAN → FETCH is normal; IXSCAN without FETCH is a covered query; a SORT stage means a blocking in-memory sort. Numbers: <code>totalKeysExamined</code>, <code>totalDocsExamined</code>, <code>nReturned</code> — ideally close to each other. Keys ≫ returned means the index isn't selective for this predicate (wrong field order); docs ≫ returned means filtering happens after fetching. I also glance at rejectedPlans when the planner picks an unexpected index, and use <code>hint()</code> only to test, not as a permanent fix.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Does MongoDB support transactions? When do you use them?</div>
  <div class="qa-answer">
    <p>Single-document writes have always been atomic, including nested arrays and multiple fields. Multi-document ACID transactions exist on replica sets (4.0) and sharded clusters (4.2). I use them for genuine cross-document invariants — a wallet transfer plus ledger entry. They have costs: a 60-second default lifetime, cache pressure, write conflicts that abort instead of waiting, and the callback must be idempotent because <code>withTransaction</code> retries. If I find myself needing them on every request, I either remodel so the invariant lives in one document or choose a relational database.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Explain write concern, read concern and read preference. What would you set for a payments service?</div>
  <div class="qa-answer">
    <p>Write concern is how many replica set members must acknowledge a write — <code>majority</code> means it survives a failover; <code>w: 1</code> can be rolled back. Read concern is what data a read can see — <code>majority</code> only returns majority-committed data, <code>linearizable</code> adds a real-time guarantee for single-document reads at extra latency, <code>snapshot</code> is for transactions. Read preference picks which member serves the read; secondaries can be stale. For payments: <code>w: 'majority'</code> (with <code>j: true</code>), majority/snapshot read concern in transactions, primary reads for anything that decides money movement, and idempotency keys on the API so retries don't double-charge.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do replica set elections work, and what happens to in-flight writes?</div>
  <div class="qa-answer">
    <p>Members heartbeat each other; if the primary is unreachable beyond the election timeout, an eligible secondary calls an election and becomes primary if it gets votes from a majority of voting members (that's why you run 3 or 5, spread across zones — an even split can't elect). The driver discovers the new primary; retryable writes re-send once. Writes acknowledged with <code>majority</code> are guaranteed to be on the new primary; writes acknowledged only by the old primary (<code>w: 1</code>) may be rolled back and written to rollback files. During the election window (seconds), writes fail and the app must tolerate it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How would you choose a shard key for a multi-tenant SaaS?</div>
  <div class="qa-answer">
    <p>Criteria: high cardinality, even write distribution, not monotonic, and present in most queries so they're targeted rather than scatter-gather. For multi-tenant, <code>{ tenantId: 1, _id: 1 }</code> is common: queries are always tenant-scoped (targeted), and the <code>_id</code> suffix gives cardinality within big tenants. Risk: one huge tenant concentrates load — a hashed component or zone sharding for whales helps. I'd avoid <code>createdAt</code> or default ObjectId alone (hot last chunk) and low-cardinality fields like <code>country</code> (jumbo chunks). And I'd delay sharding until a single replica set really can't cope; newer versions can reshard, but it's still expensive — check current docs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Write an aggregation: for each room, the number of bookings and the average duration in minutes last month, top 5 rooms.</div>
  <div class="qa-answer">
    <pre><code class="language-js">db.bookings.aggregate([
  { $match: { status: { $ne: "cancelled" },
              startsAt: { $gte: ISODate("2026-10-01"), $lt: ISODate("2026-11-01") } } },
  { $group: { _id: "$roomId",
              n: { $sum: 1 },
              avgMin: { $avg: { $dateDiff: { startDate: "$startsAt", endDate: "$endsAt", unit: "minute" } } } } },
  { $sort: { n: -1, _id: 1 } },
  { $limit: 5 },
  { $lookup: { from: "rooms", localField: "_id", foreignField: "_id", as: "room" } },
  { $project: { _id: 0, room: { $first: "$room.name" }, n: 1, avgMin: { $round: ["$avgMin", 0] } } }
])</code></pre>
    <p>Points to narrate: <code>$match</code> first so it can use an index on <code>startsAt</code>; <code>$lookup</code> after <code>$limit</code> so it runs 5 times, not thousands; tie-breaker in the sort for deterministic output.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Mongoose vs the native driver — what do you pick and why?</div>
  <div class="qa-answer">
    <p>Mongoose gives schemas, casting, validation, middleware and <code>populate</code> — valuable for teams that want guard rails on a flexible store. Costs: overhead on hydration (use <code>lean()</code>), validation that doesn't run on updates by default, middleware that's easy to bypass, and abstraction that hides query shape. The native driver is thinner, fully typed with generics, and closer to what the server does. For a high-throughput service I'd use the driver with zod at the edges and a DB-level <code>$jsonSchema</code>; for a CRUD-heavy app with a team used to Mongoose, Mongoose with <code>lean()</code> and <code>runValidators</code> is fine. Prisma also supports MongoDB (needs a replica set) if the team is already on Prisma.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. (FDE scenario) A customer's Atlas cluster alerts "high CPU" since our integration went live, and their dashboard is slow. What do you do?</div>
  <div class="qa-answer">
    <p>1) Get evidence: Atlas Query Profiler / Performance Advisor, slow query logs and <code>$currentOp</code> filtered to our app name (set <code>appName</code> in our connection string so our traffic is attributable). 2) Typical culprits from an integration: a sync query on <code>updatedAt</code> with no index (COLLSCAN on every poll), <code>skip</code>-based pagination, a regex search, <code>populate</code> fan-out, or polling far too frequently. 3) Mitigate on our side immediately: back off the poll interval, switch to keyset pagination on <code>(updatedAt, _id)</code>, project only needed fields, read from a secondary with an analytics tag if staleness is OK — or replace polling with a change stream. 4) Propose an index with explain() before/after and expected write cost; build it in a low-traffic window (index builds still consume resources) and let their team approve. 5) Confirm CPU returns to baseline and document the root cause plus the monitoring we added.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you prevent a user from being double-booked in MongoDB?</div>
  <div class="qa-answer">
    <p>Mongo has no range locks or exclusion constraints, so I turn the invariant into something it can guarantee. Option 1: a per-resource-per-day document holding that day's bookings, and a single <code>updateOne</code> whose filter asserts "no overlapping element" via <code>$not: { $elemMatch: { startsAt: { $lt: end }, endsAt: { $gt: start } } }</code> and whose update <code>$push</code>es the booking — single-document atomicity does the rest. Option 2: discrete slot documents with a unique index on <code>(roomId, slot)</code> inserted in a transaction with the booking, catching E11000. Option 3: a transaction with an explicit "lock" field update on the room document so concurrent bookers conflict. I prefer option 1 when the per-day set is bounded.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. A collection works fine at 1M documents but writes slowed down a lot at 50M. Why might that be?</div>
  <div class="qa-answer">
    <p>Most likely the working set (hot documents plus indexes) no longer fits in the WiredTiger cache, so reads and index updates hit disk. Check index sizes vs RAM: many or wide indexes (especially multikey on big arrays) multiply write cost. Random-insert keys (e.g. UUIDv4 as <code>_id</code>) scatter index writes across the whole B-tree. Growing documents get rewritten in full on each update. Fixes: drop unused indexes (<code>$indexStats</code>), use time-ordered ids, cap arrays / bucket, archive cold data (TTL or online archive), scale the instance, and only then consider sharding.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you compute running totals, moving averages or ranks in a MongoDB aggregation?</div>
  <div class="qa-answer">
    <p>With <code>$setWindowFields</code>, the Mongo equivalent of SQL's <code>SUM() OVER</code>. You give it <code>partitionBy</code> (e.g. <code>'&#36;roomId'</code>), <code>sortBy</code> (e.g. <code>{ day: 1 }</code>) and <code>output</code> fields with a window: a running total is <code>$sum</code> over <code>documents: ['unbounded', 'current']</code>, a 7-day moving average is <code>$avg</code> over <code>documents: [-6, 0]</code>, and <code>$denseRank: {}</code> gives ranks. Put <code>$match</code> (and <code>$sort</code>) first so they can use an index, keep <code>$limit</code> before any <code>$lookup</code> so the join runs only on the surviving documents, and remember blocking stages have memory limits.</p>
  </div>
</div>
` },

  ]
});
