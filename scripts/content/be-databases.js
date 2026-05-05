window.PREP_SITE.registerTopic({
  id: 'be-databases',
  module: 'backend',
  title: 'Databases',
  estimatedReadTime: '55 min',
  tags: ['database', 'sql', 'postgres', 'nosql', 'indexes', 'transactions', 'isolation', 'acid', 'query-optimization', 'schema-design'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>For a frontend / RN engineer, "knowing databases" means having the literacy to design a schema, read a query plan, pick the right index, understand transactions + isolation, and choose between SQL and NoSQL deliberately. You don't need DBA depth — you need enough to design a feature, debug a slow endpoint, and pass system-design rounds.</p>
<ul>
  <li><strong>SQL by default.</strong> Postgres specifically — most flexible, JSON support, strong defaults, free. NoSQL when you have a specific access pattern that SQL hurts.</li>
  <li><strong>Schema design:</strong> normalize for write integrity; denormalize for read speed. Real apps do both.</li>
  <li><strong>Indexes are the single biggest perf lever.</strong> Wrong index = full table scan; right index = millisecond lookup.</li>
  <li><strong>Transactions:</strong> ACID guarantees. Isolation levels (READ COMMITTED, REPEATABLE READ, SERIALIZABLE) trade consistency for concurrency.</li>
  <li><strong>Query plans</strong> (<code>EXPLAIN ANALYZE</code>) are your debugger. Read them.</li>
  <li><strong>NoSQL families:</strong> document (Mongo/Firestore), key-value (DynamoDB/Redis), wide-column (Cassandra), graph (Neo4j), search (Elastic). Each solves a specific shape.</li>
  <li><strong>Connection pooling, prepared statements, read replicas, partitioning</strong> — the standard scaling levers.</li>
  <li><strong>Data modeling</strong> is forever. Schema migrations are politically expensive in production; design carefully day one.</li>
</ul>
<p><strong>Mantra:</strong> "Postgres unless you have a reason. Index for queries. Transactions for invariants. Read query plans. Migrate carefully."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "knowing databases" means for FE engineers</h3>
<p>Not "I can administer a Postgres cluster." It's:</p>
<ul>
  <li>Design a schema for a feature (tables, columns, types, foreign keys, indexes).</li>
  <li>Write SQL queries cleanly; understand JOINs + GROUP BY + window functions.</li>
  <li>Read a query plan and identify the bottleneck.</li>
  <li>Use transactions correctly for atomicity.</li>
  <li>Know when to pick SQL vs NoSQL vs cache.</li>
  <li>Debug a slow endpoint by tracing it to the DB layer.</li>
  <li>Talk competently with backend / data engineers.</li>
</ul>

<h3>SQL vs NoSQL — the actual decision</h3>
<table>
  <thead><tr><th>Pick</th><th>When</th></tr></thead>
  <tbody>
    <tr><td>Postgres / MySQL</td><td>Default. Relational data, transactions matter, mixed access patterns, you'll need ad-hoc queries.</td></tr>
    <tr><td>Document (MongoDB, Firestore)</td><td>Self-contained documents, schema flexibility for prototyping, no cross-document JOINs.</td></tr>
    <tr><td>Key-value (DynamoDB, Redis, Cassandra)</td><td>Single-key access patterns at huge scale, predictable latency over flexibility.</td></tr>
    <tr><td>Wide-column (Cassandra, Bigtable)</td><td>Time-series, billions of rows, write-heavy, partition-key access.</td></tr>
    <tr><td>Graph (Neo4j, Neptune)</td><td>Many-to-many relationships, recommendations, fraud detection.</td></tr>
    <tr><td>Search (Elasticsearch, OpenSearch, Algolia)</td><td>Full-text search, faceting, ranking; secondary index, not source of truth.</td></tr>
    <tr><td>Time-series (TimescaleDB, InfluxDB)</td><td>Metrics, IoT, append-mostly with time-range queries.</td></tr>
    <tr><td>Vector (pgvector, Pinecone, Weaviate)</td><td>Embedding similarity search for AI / RAG.</td></tr>
  </tbody>
</table>

<h3>Why "Postgres by default"</h3>
<ul>
  <li>Strong ACID; rare to outgrow.</li>
  <li>JSON / JSONB columns mean you can have document-style flexibility within a relational store.</li>
  <li>Full-text search built in (good enough for most apps).</li>
  <li>Extensions: PostGIS (geo), pgvector (embeddings), Timescale (time-series), pg_partman (partitioning).</li>
  <li>Wire-protocol-compatible cloud options (Neon, Supabase, RDS, Cloud SQL).</li>
  <li>Mature query optimizer; readable EXPLAIN output.</li>
</ul>

<h3>Why people pick NoSQL prematurely</h3>
<ul>
  <li>"It scales better" — true at huge scale; not relevant to most products.</li>
  <li>"Schema-less is faster to iterate" — until you're 6 months in and need to query something the schema doesn't support.</li>
  <li>"Hipster choice" — chose by trend, not access pattern.</li>
</ul>

<p>The senior signal: "Postgres unless I can name the access pattern that justifies the alternative."</p>

<h3>What "good schema design" looks like</h3>
<ul>
  <li>Normalize for write correctness (one source of truth per fact); denormalize selectively for hot reads.</li>
  <li>Foreign keys for referential integrity (or document explicitly when skipping).</li>
  <li>Sensible types — never <code>TEXT</code> for everything; use <code>NUMERIC(10,2)</code> for money; <code>UUID</code> for ids.</li>
  <li>Timestamps on every table (<code>created_at</code>, <code>updated_at</code>).</li>
  <li>Indexes for the queries you actually run.</li>
  <li>Constraints: <code>NOT NULL</code>, <code>CHECK</code>, <code>UNIQUE</code> where applicable.</li>
  <li>Soft delete (<code>deleted_at</code>) when business needs history; hard delete + archive table when not.</li>
  <li>Migration story: every change is a versioned, reversible migration.</li>
</ul>

<h3>What "bad schema design" looks like</h3>
<ul>
  <li>EAV (entity-attribute-value) "for flexibility" — kills query performance.</li>
  <li><code>TEXT</code> everywhere; no constraints; nullable everything.</li>
  <li>No indexes on FK columns or common query columns.</li>
  <li>Money as <code>FLOAT</code> — rounding errors compound.</li>
  <li>Concatenated string keys instead of composite primary keys.</li>
  <li>JSON blob for everything ("schemaless"); becomes unqueryable.</li>
  <li>No <code>created_at</code> on tables; can't audit anything.</li>
  <li>Schema drift between dev / staging / prod (no migrations).</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>ACID — what transactions guarantee</h3>
<table>
  <thead><tr><th>Letter</th><th>Means</th></tr></thead>
  <tbody>
    <tr><td>Atomicity</td><td>All or nothing. Transaction commits fully or rolls back fully.</td></tr>
    <tr><td>Consistency</td><td>DB moves from one valid state to another. Constraints + FKs + triggers enforced.</td></tr>
    <tr><td>Isolation</td><td>Concurrent transactions don't interfere (level-dependent — see below).</td></tr>
    <tr><td>Durability</td><td>Once committed, survives crashes / restarts.</td></tr>
  </tbody>
</table>

<h3>Isolation levels (Postgres)</h3>
<table>
  <thead><tr><th>Level</th><th>Prevents</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>READ UNCOMMITTED</td><td>(Postgres treats as READ COMMITTED)</td><td>—</td></tr>
    <tr><td>READ COMMITTED (default)</td><td>Dirty reads</td><td>Most reads; writes that don't depend on read consistency</td></tr>
    <tr><td>REPEATABLE READ</td><td>+ non-repeatable reads, phantom reads (Postgres-specific)</td><td>Reports, multi-step reads requiring stable snapshot</td></tr>
    <tr><td>SERIALIZABLE</td><td>All anomalies</td><td>When concurrent updates must serialize as if sequential. Slower; retry on conflict.</td></tr>
  </tbody>
</table>

<p>Default for most apps: <strong>READ COMMITTED</strong> + explicit row locks (<code>SELECT FOR UPDATE</code>) where you need stronger guarantees.</p>

<h3>The 3 anomalies isolation prevents</h3>
<ul>
  <li><strong>Dirty read:</strong> see uncommitted data from another transaction.</li>
  <li><strong>Non-repeatable read:</strong> read the same row twice in a transaction; get different values because another tx committed in between.</li>
  <li><strong>Phantom read:</strong> read a range twice; new rows appear because another tx inserted.</li>
</ul>

<h3>Optimistic vs pessimistic concurrency</h3>
<table>
  <thead><tr><th>Strategy</th><th>How</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Pessimistic locking</td><td><code>SELECT ... FOR UPDATE</code> locks rows until commit</td><td>High-conflict; financial; inventory</td></tr>
    <tr><td>Optimistic concurrency</td><td>Version column; <code>UPDATE ... WHERE version = $1</code>; retry on 0 rows</td><td>Lower conflict; user-facing edits</td></tr>
  </tbody>
</table>

<h3>Indexes — the perf primitive</h3>
<table>
  <thead><tr><th>Index type</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>B-tree (default)</td><td>Equality + range; most queries</td></tr>
    <tr><td>Hash</td><td>Equality only; rarely better than B-tree</td></tr>
    <tr><td>GIN</td><td>Arrays, JSONB, full-text</td></tr>
    <tr><td>GiST</td><td>Geo, range types</td></tr>
    <tr><td>BRIN</td><td>Sorted huge tables; tiny size</td></tr>
    <tr><td>Partial</td><td>Index only rows matching <code>WHERE</code> clause; smaller, faster</td></tr>
    <tr><td>Composite</td><td>Multi-column; matters for sorted access</td></tr>
    <tr><td>Covering (INCLUDE)</td><td>Index contains additional columns; index-only scan</td></tr>
  </tbody>
</table>

<h3>Index design rules</h3>
<ol>
  <li>Index columns used in <code>WHERE</code>, <code>JOIN</code>, <code>ORDER BY</code>.</li>
  <li>Composite index column order matches query patterns: <code>(user_id, created_at)</code> serves <code>WHERE user_id = ? ORDER BY created_at DESC</code>.</li>
  <li>Don't index columns with very low cardinality (< 1% unique) — full scan often faster.</li>
  <li>Indexes cost on write (every update / insert maintains every relevant index).</li>
  <li>Partial index for selective sub-cases: <code>CREATE INDEX ON orders(created_at) WHERE status = 'pending';</code></li>
  <li>Covering index when you can serve a query from the index alone (no heap access).</li>
</ol>

<h3>Reading EXPLAIN</h3>
<pre><code class="language-sql">EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = '42' AND status = 'paid'
ORDER BY created_at DESC LIMIT 20;
</code></pre>

<table>
  <thead><tr><th>Operator</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td>Seq Scan</td><td>Full table scan; usually bad on big tables</td></tr>
    <tr><td>Index Scan</td><td>Uses index; visits heap for additional columns</td></tr>
    <tr><td>Index Only Scan</td><td>Index alone has all columns needed</td></tr>
    <tr><td>Bitmap Heap Scan</td><td>Multiple matching index tuples; fetches in heap order</td></tr>
    <tr><td>Hash Join</td><td>Builds hash of one side; probes with other</td></tr>
    <tr><td>Nested Loop</td><td>For each row in outer, look up matching in inner; great for small outer + indexed inner</td></tr>
    <tr><td>Merge Join</td><td>Both sides sorted; merge — good for large pre-sorted</td></tr>
    <tr><td>Sort</td><td>Explicit sort step; expensive on big results</td></tr>
  </tbody>
</table>

<p>Look for: <code>Seq Scan</code> on big tables (add index?), <code>Sort</code> with large rows (covering index?), high actual time on a deep node.</p>

<h3>Connection pooling at scale</h3>
<ul>
  <li>Postgres process per connection; ~10MB each. Default max_connections = 100.</li>
  <li>App connection pool ≤ DB max_connections.</li>
  <li>Multiple app instances? Use external pooler (PgBouncer, Pgpool) — terminates client connections, multiplexes onto fewer DB connections.</li>
  <li>Serverless (Lambda) creates connections per cold start — use HTTP-style DB clients (Neon serverless driver, Prisma Data Proxy).</li>
</ul>

<h3>Read replicas</h3>
<ul>
  <li>Reads from replicas; writes to primary.</li>
  <li>Replication lag (ms to seconds); reads may see stale data.</li>
  <li>Use when read traffic exceeds primary capacity.</li>
  <li>Beware: read-after-write expects fresh data; route to primary for those.</li>
</ul>

<h3>Partitioning + sharding</h3>
<table>
  <thead><tr><th>Strategy</th><th>How</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Vertical partitioning</td><td>Split table by columns; rare cols in separate table</td><td>Wide tables with hot subset</td></tr>
    <tr><td>Horizontal (range)</td><td>Partitions by time / id range</td><td>Time-series; archive old data</td></tr>
    <tr><td>Horizontal (hash)</td><td>Partitions by hash of key</td><td>Even distribution across shards</td></tr>
    <tr><td>Sharding</td><td>Multiple DBs; route by tenant / region</td><td>Multi-tenant SaaS at scale</td></tr>
  </tbody>
</table>

<h3>Data types worth knowing</h3>
<table>
  <thead><tr><th>Use case</th><th>Postgres type</th></tr></thead>
  <tbody>
    <tr><td>ID</td><td><code>UUID</code> (or <code>BIGSERIAL</code>)</td></tr>
    <tr><td>Money</td><td><code>NUMERIC(precision, scale)</code></td></tr>
    <tr><td>Timestamps</td><td><code>TIMESTAMPTZ</code> (always with TZ)</td></tr>
    <tr><td>Date only</td><td><code>DATE</code></td></tr>
    <tr><td>Free-form text</td><td><code>TEXT</code></td></tr>
    <tr><td>Email / short string</td><td><code>VARCHAR(255)</code> or just <code>TEXT</code></td></tr>
    <tr><td>JSON</td><td><code>JSONB</code> (always B; queryable + indexable)</td></tr>
    <tr><td>Enums</td><td>Postgres <code>ENUM</code> or check constraint on <code>TEXT</code></td></tr>
    <tr><td>Booleans</td><td><code>BOOLEAN</code></td></tr>
    <tr><td>Arrays</td><td><code>TEXT[]</code>, <code>UUID[]</code></td></tr>
    <tr><td>IP addresses</td><td><code>INET</code></td></tr>
  </tbody>
</table>

<h3>Migration model</h3>
<ul>
  <li>Versioned migrations: <code>000_init.sql</code> → <code>001_add_users.sql</code> → ...</li>
  <li>Forward-only by default; rollback is "next migration that undoes."</li>
  <li>Tools: Prisma Migrate, Drizzle, Atlas, Flyway, Sqitch, knex.</li>
  <li>Backwards-compat: deploy code that handles both old + new schema; migrate; deploy code that only handles new.</li>
  <li>Long-running migrations on big tables: use <code>CONCURRENTLY</code>, batched updates, online schema-change tools (gh-ost, pt-online-schema-change).</li>
</ul>

<h3>The CAP theorem (and why you don't really care)</h3>
<p>"Pick 2 of: Consistency, Availability, Partition tolerance." In practice all real distributed systems must choose between C and A under partition. Postgres = CP (consistent, may be unavailable during failover). DynamoDB = AP (always available, eventually consistent unless you opt into strong reads).</p>

<p>For most apps: pick the DB that fits the workload; learn its actual consistency story; don't theorize about CAP.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Schema design — a real example</h3>
<pre><code class="language-sql">-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created ON users(created_at DESC);

-- posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE status = 'published';

-- likes (junction)
CREATE TABLE likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_likes_post ON likes(post_id);
</code></pre>

<p>Notes: PK is composite on likes; partial index on email excludes soft-deleted; check constraints enforce business rules; ON DELETE CASCADE deletes posts when a user is deleted.</p>

<h3>Common queries</h3>
<pre><code class="language-sql">-- Latest 20 published posts by an author
SELECT p.id, p.title, p.published_at
FROM posts p
WHERE p.author_id = $1 AND p.status = 'published'
ORDER BY p.published_at DESC
LIMIT 20;
-- Uses idx_posts_published (partial) + filtered by author_id.
-- Better: idx_posts_author_published_pub (author_id, published_at DESC) WHERE status = 'published'

-- Cursor-based pagination
SELECT p.id, p.title, p.published_at
FROM posts p
WHERE p.author_id = $1 AND p.status = 'published'
  AND (p.published_at, p.id) &lt; ($2, $3)
ORDER BY p.published_at DESC, p.id DESC
LIMIT 20;
-- Stable across writes; index-friendly.

-- Like count per post (denormalize if hot)
SELECT post_id, COUNT(*) AS likes
FROM likes
WHERE post_id = ANY($1::UUID[])
GROUP BY post_id;

-- Posts with author info
SELECT p.id, p.title, u.id AS author_id, u.display_name
FROM posts p
JOIN users u ON p.author_id = u.id
WHERE p.status = 'published'
ORDER BY p.published_at DESC LIMIT 20;
</code></pre>

<h3>Transactions</h3>
<pre><code class="language-typescript">// Move money between accounts atomically
async function transfer(fromId: string, toId: string, cents: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock both rows in deterministic order to avoid deadlock
    const [a, b] = [fromId, toId].sort();
    await client.query('SELECT id FROM accounts WHERE id IN ($1, $2) ORDER BY id FOR UPDATE', [a, b]);

    const fromResult = await client.query(
      'UPDATE accounts SET balance_cents = balance_cents - $1 WHERE id = $2 AND balance_cents &gt;= $1 RETURNING balance_cents',
      [cents, fromId]
    );
    if (fromResult.rowCount === 0) throw new Error('insufficient_funds');

    await client.query(
      'UPDATE accounts SET balance_cents = balance_cents + $1 WHERE id = $2',
      [cents, toId]
    );

    await client.query(
      'INSERT INTO transfers (from_id, to_id, cents) VALUES ($1, $2, $3)',
      [fromId, toId, cents]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
</code></pre>

<h3>Optimistic concurrency</h3>
<pre><code class="language-sql">-- Version column on rows
ALTER TABLE posts ADD COLUMN version INT NOT NULL DEFAULT 0;

-- Update only if version matches
UPDATE posts
SET title = $1, body = $2, version = version + 1, updated_at = NOW()
WHERE id = $3 AND version = $4;

-- 0 rows = someone else updated; client retries with fresh version
</code></pre>

<h3>Pessimistic locking — SELECT FOR UPDATE</h3>
<pre><code class="language-sql">BEGIN;
SELECT * FROM inventory WHERE sku = 'ABC123' FOR UPDATE;
-- ... do checks ...
UPDATE inventory SET qty = qty - 1 WHERE sku = 'ABC123';
COMMIT;
</code></pre>

<h3>Read query optimization workflow</h3>
<ol>
  <li>Identify slow query (APM, slow query log).</li>
  <li>Run <code>EXPLAIN (ANALYZE, BUFFERS)</code> — actual time + I/O.</li>
  <li>Look for Seq Scan on large tables → missing index.</li>
  <li>Look for high cost on join → missing index on join column or wrong join order.</li>
  <li>Look for expensive sort → covering index can avoid.</li>
  <li>Try the index; re-run EXPLAIN; verify.</li>
  <li>Production: <code>CREATE INDEX CONCURRENTLY</code> to avoid table lock.</li>
</ol>

<h3>Common pitfalls in EXPLAIN</h3>
<ul>
  <li><strong>Seq Scan</strong> with high <code>actual rows</code> = read whole table.</li>
  <li><strong>Index Scan</strong> with high heap fetches = retrieved most rows anyway; index didn't help.</li>
  <li><strong>Sort</strong> with large <code>Memory</code> usage → spilling to disk; consider covering index that's pre-sorted.</li>
  <li><strong>Nested Loop</strong> with high outer rows = chooses inefficient plan; check stats with <code>ANALYZE</code>.</li>
</ul>

<h3>Bulk operations</h3>
<pre><code class="language-sql">-- Bulk insert via VALUES
INSERT INTO users (email, display_name) VALUES
  ($1, $2), ($3, $4), ($5, $6);

-- Or via UNNEST for parameterized arrays
INSERT INTO users (email, display_name)
SELECT email, display_name
FROM unnest($1::text[], $2::text[]) AS t(email, display_name);

-- Bulk update from values
UPDATE products
SET price_cents = v.price_cents
FROM (VALUES ($1::uuid, $2::int), ($3, $4)) AS v(id, price_cents)
WHERE products.id = v.id;
</code></pre>

<h3>JSONB</h3>
<pre><code class="language-sql">CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index a specific field
CREATE INDEX idx_events_user ON events ((payload-&gt;&gt;'user_id'));

-- Or GIN index for arbitrary key queries
CREATE INDEX idx_events_payload ON events USING GIN (payload);

-- Query
SELECT * FROM events WHERE payload-&gt;&gt;'user_id' = '42';
SELECT * FROM events WHERE payload @&gt; '{"action": "login"}';
</code></pre>

<p>JSONB is great for: variable schemas, audit logs, integration payloads. Bad for: data you query / aggregate / index frequently — that should be columns.</p>

<h3>Full-text search (Postgres native)</h3>
<pre><code class="language-sql">ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', body), 'B')
  ) STORED;

CREATE INDEX idx_posts_search ON posts USING GIN (search_vector);

-- Query
SELECT id, title, ts_rank(search_vector, query) AS rank
FROM posts, plainto_tsquery('english', $1) query
WHERE search_vector @@ query
ORDER BY rank DESC LIMIT 20;
</code></pre>

<p>Native FTS handles ~95% of search needs without standing up Elasticsearch. For more (synonyms, fuzzy, faceting), use a dedicated search engine.</p>

<h3>Migrations with Prisma / Drizzle</h3>
<pre><code class="language-bash"># Prisma
npx prisma migrate dev --name add_user_table
npx prisma migrate deploy  # in CI

# Drizzle
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
</code></pre>

<p>Both: schema in code → SQL diff → migration file → applied in order with version tracking in a <code>_prisma_migrations</code> / <code>__drizzle_migrations</code> table.</p>

<h3>Connection pooling on serverless</h3>
<pre><code class="language-typescript">// Standard Postgres client doesn't fit serverless (cold start = new connection)
// Use Neon serverless driver, Prisma Data Proxy, or Vercel Postgres
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

const users = await sql\`SELECT * FROM users WHERE id = \${id}\`;
</code></pre>

<p>HTTP-style DB clients sidestep TCP connection cost; each Lambda invocation is a fresh HTTPS request, no pool needed.</p>

<h3>NoSQL — DynamoDB single-table design</h3>
<pre><code class="language-text">// One table; partition + sort key compose access patterns
PK              SK              data
USER#123        PROFILE         { name, email }
USER#123        ORDER#456       { total, date }
USER#123        ORDER#789       { total, date }
ORDER#456       ITEM#1          { sku, qty }

// Get user profile: GetItem(PK=USER#123, SK=PROFILE)
// List user orders: Query(PK=USER#123, SK begins_with 'ORDER#')
// Get order items: Query(PK=ORDER#456, SK begins_with 'ITEM#')
</code></pre>

<p>Single-table is the DynamoDB idiom. Designed around access patterns, not entities. Steep learning curve; powerful at scale.</p>

<h3>Document DB — Mongo example</h3>
<pre><code class="language-javascript">await db.collection('users').insertOne({
  _id: ObjectId(),
  email: 'p@x.com',
  posts: [
    { id: 'p1', title: 'Hello', createdAt: new Date() },
  ],
  preferences: { theme: 'dark', notifications: true },
});

// Embedded doc; one read fetches user + posts
await db.collection('users').findOne({ email: 'p@x.com' });
</code></pre>

<p>Embed when always-fetched-together (preferences); reference when independently queried (orders).</p>

<h3>Vector DB — pgvector</h3>
<pre><code class="language-sql">CREATE EXTENSION vector;

CREATE TABLE documents (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL
);

CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);

-- Find similar
SELECT id, content, embedding &lt;=&gt; $1::vector AS distance
FROM documents
ORDER BY distance ASC LIMIT 5;
</code></pre>

<p>Postgres + pgvector covers most RAG use cases without standing up a separate vector DB.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Schema for a feed app</h3>
<pre><code class="language-sql">CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  bio TEXT,
  follower_count INT NOT NULL DEFAULT 0, -- denormalized, periodic recount
  following_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 280),
  like_count INT NOT NULL DEFAULT 0,
  reply_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id),
  following_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_following ON follows(following_id);

CREATE TABLE likes (
  user_id UUID NOT NULL REFERENCES users(id),
  post_id UUID NOT NULL REFERENCES posts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_likes_post ON likes(post_id);
</code></pre>

<h3>Example 2: Build the feed query</h3>
<pre><code class="language-sql">-- Posts from people I follow, newest first, paginated
SELECT
  p.id,
  p.body,
  p.like_count,
  p.created_at,
  u.id AS author_id,
  u.username,
  EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND post_id = p.id) AS has_liked
FROM posts p
JOIN follows f ON f.following_id = p.author_id AND f.follower_id = $1
JOIN users u ON u.id = p.author_id
WHERE p.created_at &lt; $2 -- cursor
ORDER BY p.created_at DESC
LIMIT 20;
</code></pre>

<p>Indexes hit: <code>idx_follows_follower</code> (PK), <code>idx_posts_author_created</code>. The <code>EXISTS</code> for <code>has_liked</code> is one index probe per row.</p>

<h3>Example 3: Atomic like + counter</h3>
<pre><code class="language-typescript">async function likePost(userId: string, postId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING 1',
      [userId, postId]
    );
    if (result.rowCount &gt; 0) {
      await client.query('UPDATE posts SET like_count = like_count + 1 WHERE id = $1', [postId]);
    }

    await client.query('COMMIT');
    return result.rowCount &gt; 0;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
</code></pre>

<p><code>ON CONFLICT DO NOTHING</code> handles the "already liked" case idempotently. Counter only bumps on actual insert.</p>

<h3>Example 4: Soft delete with view</h3>
<pre><code class="language-sql">-- Soft delete column
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

-- View hides deleted from default queries
CREATE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;

-- App code uses view; admin tooling uses raw table
SELECT * FROM active_users WHERE id = $1;
</code></pre>

<p>Pair with <code>WHERE deleted_at IS NULL</code> partial indexes so queries don't scan deleted rows.</p>

<h3>Example 5: Audit log via trigger</h3>
<pre><code class="language-sql">CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  row_id UUID NOT NULL,
  action TEXT NOT NULL,
  changed_by UUID,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_change() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, row_id, action, changed_by, diff)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    current_setting('app.user_id', true)::uuid,
    CASE TG_OP
      WHEN 'INSERT' THEN to_jsonb(NEW)
      WHEN 'UPDATE' THEN jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW))
      WHEN 'DELETE' THEN to_jsonb(OLD)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_audit
AFTER INSERT OR UPDATE OR DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION log_change();
</code></pre>

<p>App sets <code>SET LOCAL app.user_id = '...'</code> at transaction start; trigger captures who changed what.</p>

<h3>Example 6: Pagination — cursor over (timestamp, id)</h3>
<pre><code class="language-sql">-- Stable across inserts; uses idx_posts_created (created_at DESC)
SELECT * FROM posts
WHERE (created_at, id) &lt; ($1::timestamptz, $2::uuid)
ORDER BY created_at DESC, id DESC
LIMIT 20;
</code></pre>

<p>Compound cursor handles ties; (timestamp alone) breaks if multiple rows share a timestamp.</p>

<h3>Example 7: Time-bucket aggregations</h3>
<pre><code class="language-sql">-- Hourly signup count over last 7 days
SELECT
  date_trunc('hour', created_at) AS hour,
  COUNT(*) AS signups
FROM users
WHERE created_at &gt;= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;

-- Materialized view for expensive recurring aggregations
CREATE MATERIALIZED VIEW daily_signups AS
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*) AS signups
FROM users
GROUP BY day;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_signups;
</code></pre>

<h3>Example 8: Search posts by tag (array)</h3>
<pre><code class="language-sql">ALTER TABLE posts ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX idx_posts_tags ON posts USING GIN (tags);

-- Find posts with all of these tags
SELECT * FROM posts WHERE tags @&gt; ARRAY['javascript', 'react'];

-- Find posts with any of these tags
SELECT * FROM posts WHERE tags &amp;&amp; ARRAY['javascript', 'react'];
</code></pre>

<h3>Example 9: Online schema change (gh-ost-style)</h3>
<pre><code class="language-sql">-- 1. Add new column nullable, with default
ALTER TABLE posts ADD COLUMN preview TEXT;

-- 2. Backfill in batches
UPDATE posts SET preview = LEFT(body, 200) WHERE id IN (
  SELECT id FROM posts WHERE preview IS NULL LIMIT 1000
);
-- Run repeatedly until no rows left.

-- 3. Add NOT NULL once filled
ALTER TABLE posts ALTER COLUMN preview SET NOT NULL;

-- 4. Add index CONCURRENTLY
CREATE INDEX CONCURRENTLY idx_posts_preview ON posts(preview);
</code></pre>

<p>Avoid <code>ALTER TABLE ... ADD COLUMN ... NOT NULL</code> on a big table — locks the table for hours. Above approach: zero downtime.</p>

<h3>Example 10: ORM vs raw SQL — Prisma</h3>
<pre><code class="language-typescript">// Prisma schema
model Post {
  id         String   @id @default(uuid()) @db.Uuid
  authorId   String   @map("author_id") @db.Uuid
  title      String
  body       String
  status     PostStatus
  createdAt  DateTime @default(now()) @map("created_at")
  author     User     @relation(fields: [authorId], references: [id])

  @@index([authorId, createdAt(sort: Desc)])
  @@map("posts")
}

// Query
const posts = await prisma.post.findMany({
  where: { authorId, status: 'PUBLISHED' },
  include: { author: true },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
</code></pre>

<p>Prisma generates type-safe queries. Trade flexibility for safety. Drop to raw SQL (<code>$queryRaw</code>) when you need it.</p>

<h3>Example 11: pgvector for RAG</h3>
<pre><code class="language-sql">CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Find top-5 most similar chunks
SELECT id, content, 1 - (embedding &lt;=&gt; $1::vector) AS similarity
FROM document_chunks
ORDER BY embedding &lt;=&gt; $1::vector
LIMIT 5;
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>N+1 query problem</h3>
<pre><code class="language-typescript">// BAD — fires N+1 queries
const posts = await db.posts.findMany({ take: 20 });
for (const post of posts) {
  post.author = await db.users.findUnique({ where: { id: post.authorId } });
}

// GOOD — single query with JOIN
const posts = await db.posts.findMany({
  take: 20,
  include: { author: true },
});

// OR — batch fetch
const authorIds = [...new Set(posts.map(p =&gt; p.authorId))];
const authors = await db.users.findMany({ where: { id: { in: authorIds } } });
const byId = new Map(authors.map(a =&gt; [a.id, a]));
posts.forEach(p =&gt; p.author = byId.get(p.authorId));
</code></pre>

<p>Detect with APM (each query logged) or DataLoader for GraphQL.</p>

<h3>Index not used despite existing</h3>
<ul>
  <li>Query optimizer chose Seq Scan because table was small or stats stale.</li>
  <li>Run <code>ANALYZE table_name;</code> to refresh stats.</li>
  <li>Check column types match — query <code>WHERE id = '42'</code> on integer column triggers cast that disables index.</li>
  <li>Function in WHERE: <code>WHERE LOWER(email) = ?</code> — index on <code>email</code> won't help; need expression index.</li>
</ul>

<h3>Lock contention</h3>
<ul>
  <li>Many writes targeting same row (popular post like counter) → contention; throughput drops.</li>
  <li>Mitigation: counter cache in Redis with periodic flush; or sharded counters across N rows summed at read time.</li>
</ul>

<h3>Deadlocks</h3>
<ul>
  <li>Two transactions lock rows in opposite order → deadlock.</li>
  <li>Postgres detects + kills one with <code>40P01</code>; client retries.</li>
  <li>Mitigation: lock rows in deterministic order (e.g., by id ASC).</li>
</ul>

<h3>Long-running transactions</h3>
<ul>
  <li>Open transaction holds locks; blocks other writes; bloats MVCC table.</li>
  <li>Keep transactions short; never hold across user input or external API calls.</li>
  <li>Set <code>statement_timeout</code> at session level.</li>
</ul>

<h3>VACUUM / dead tuples (Postgres)</h3>
<ul>
  <li>UPDATEs in Postgres don't overwrite — they create new tuples; old ones marked dead.</li>
  <li>Autovacuum reclaims space; can lag on heavy-write tables.</li>
  <li>Symptom: table bloat, slow queries despite indexes.</li>
  <li>Tune autovacuum thresholds for hot tables; VACUUM FULL only with downtime.</li>
</ul>

<h3>Replication lag</h3>
<ul>
  <li>Read replicas lag primary by ms-to-seconds.</li>
  <li>Read-after-write: user creates post; redirects to feed; reads from replica → post not yet there.</li>
  <li>Mitigations: read from primary for read-after-write; use LSN-aware routing; or poll until visible.</li>
</ul>

<h3>Connection limits</h3>
<ul>
  <li>Postgres default max_connections = 100; cloud Postgres often higher (RDS: scaled by instance).</li>
  <li>App pool × instance count must stay under DB max.</li>
  <li>PgBouncer multiplexes; thousands of app connections → tens of DB connections.</li>
  <li>Serverless: HTTP-style drivers (Neon serverless) bypass connection cost entirely.</li>
</ul>

<h3>Migration locks</h3>
<ul>
  <li><code>ALTER TABLE</code> takes <code>ACCESS EXCLUSIVE</code> lock; blocks reads + writes for the duration.</li>
  <li><code>ADD COLUMN</code> nullable + with default = fast (Postgres 11+); without default + NOT NULL = full table rewrite.</li>
  <li><code>CREATE INDEX</code> = <code>SHARE</code> lock; blocks writes. Use <code>CONCURRENTLY</code> in production.</li>
  <li>Long migrations on hot tables: gh-ost-style online schema change.</li>
</ul>

<h3>Cascading deletes</h3>
<ul>
  <li><code>ON DELETE CASCADE</code> deletes child rows automatically.</li>
  <li>Surprising in practice — deleting one user can cascade to thousands of rows; long lock.</li>
  <li>Alternatives: soft delete with <code>deleted_at</code>; explicit cleanup via background job.</li>
</ul>

<h3>JSONB anti-patterns</h3>
<ul>
  <li>Putting columns you query into JSONB instead of as columns.</li>
  <li>Symptom: GIN index helps but query is still slow.</li>
  <li>Fix: extract frequently-queried fields into actual columns.</li>
</ul>

<h3>Money as float</h3>
<ul>
  <li><code>FLOAT</code> = binary representation; <code>0.1 + 0.2 ≠ 0.3</code>; rounding errors compound.</li>
  <li>Use <code>NUMERIC(10, 2)</code> for currency, or store as integer cents.</li>
</ul>

<h3>Timezone confusion</h3>
<ul>
  <li><code>TIMESTAMP WITHOUT TIME ZONE</code> = naive local time; ambiguous.</li>
  <li>Always use <code>TIMESTAMPTZ</code> = timestamp + zone; stored UTC, displayed in client TZ.</li>
  <li>For dates only (birthdays): <code>DATE</code>; never midnight UTC of a TIMESTAMP.</li>
</ul>

<h3>NULL semantics</h3>
<ul>
  <li><code>NULL = NULL</code> is <code>NULL</code>, not <code>true</code>. Use <code>IS NULL</code>.</li>
  <li><code>WHERE col != 'value'</code> excludes <code>NULL</code> rows. Use <code>WHERE col IS DISTINCT FROM 'value'</code>.</li>
  <li>Aggregations skip NULLs: <code>COUNT(*)</code> includes NULLs; <code>COUNT(col)</code> excludes them.</li>
</ul>

<h3>Sequence gaps</h3>
<ul>
  <li><code>BIGSERIAL</code> sequences may have gaps after rollback or restart.</li>
  <li>Don't expose sequential IDs to users (security: enumeration; UX: gaps confuse).</li>
  <li>Use UUIDs for public IDs; ints for internal.</li>
</ul>

<h3>UUID primary keys + index size</h3>
<ul>
  <li>UUIDs are 128-bit; B-tree index larger than INT; 16 bytes vs 4-8.</li>
  <li>Random UUIDs spread inserts across pages; B-tree fragmentation.</li>
  <li>Mitigation: use UUIDv7 (time-ordered) — lexicographic sortable; better index locality.</li>
</ul>

<h3>Encoding gotchas</h3>
<ul>
  <li>Database default encoding = UTF-8 (modern Postgres default).</li>
  <li>Emoji require 4-byte UTF-8; some legacy MySQL configs use <code>utf8</code> (3-byte) → emoji break. Use <code>utf8mb4</code>.</li>
</ul>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps usually don't talk to a DB directly; they call your backend.</li>
  <li>Local DBs on RN: SQLite (op-sqlite, expo-sqlite), WatermelonDB (reactive ORM over SQLite), MMKV (kv only).</li>
  <li>Same indexing / transaction principles apply locally.</li>
  <li>Sync: design backend schema with idempotency / conflict resolution in mind for mobile-offline writes.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common DB mistakes</h3>
<ol>
  <li><strong>Money as <code>FLOAT</code>.</strong> Rounding errors compound.</li>
  <li><strong>No indexes on FK / common-query columns.</strong> Full scans.</li>
  <li><strong>EAV (entity-attribute-value).</strong> "Flexible" but unindexable.</li>
  <li><strong>JSONB for everything.</strong> Loses query power; should be columns.</li>
  <li><strong><code>TIMESTAMP</code> without TZ.</strong> Ambiguous; always TZ-aware.</li>
  <li><strong>N+1 queries.</strong> Loop fires N queries; use JOIN or batch.</li>
  <li><strong>Long-running transactions.</strong> Block other writes; bloat MVCC.</li>
  <li><strong>Indexes on every column.</strong> Slow writes; bloated DB.</li>
  <li><strong>No <code>ANALYZE</code> after big changes.</strong> Stale stats; bad query plans.</li>
  <li><strong>Locking primary in deterministic-order-violation.</strong> Deadlocks.</li>
  <li><strong>UUIDv4 PKs at scale.</strong> Random; index fragmentation; use UUIDv7.</li>
  <li><strong>No connection pool.</strong> Connection exhaustion under load.</li>
</ol>

<h3>Anti-pattern: float for money</h3>
<pre><code class="language-sql">-- BAD
CREATE TABLE orders (total FLOAT);
-- 0.1 + 0.2 != 0.3; bugs you can't reproduce locally

-- GOOD
CREATE TABLE orders (total_cents BIGINT NOT NULL);
-- or
CREATE TABLE orders (total NUMERIC(10, 2) NOT NULL);
</code></pre>

<h3>Anti-pattern: no FK indexes</h3>
<pre><code class="language-sql">-- BAD — ON DELETE CASCADE locks user table for whole posts table scan
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- GOOD — index makes cascade fast + helps queries
CREATE INDEX idx_posts_author ON posts(author_id);
</code></pre>

<p>Postgres doesn't auto-index FK columns. Always add them.</p>

<h3>Anti-pattern: EAV table</h3>
<pre><code class="language-sql">-- BAD — "infinite flexibility" → impossible queries
CREATE TABLE entity_attributes (
  entity_id UUID,
  attr_name TEXT,
  attr_value TEXT
);

-- GOOD — actual columns; JSONB for genuinely variable
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb -- for variable attrs
);
</code></pre>

<h3>Anti-pattern: untyped JSONB</h3>
<pre><code class="language-sql">-- BAD — every event has different shape; no constraints
CREATE TABLE events (
  id UUID PRIMARY KEY,
  data JSONB
);

-- GOOD — typed columns + JSONB only for variable extras
CREATE TABLE events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
</code></pre>

<h3>Anti-pattern: no <code>created_at</code></h3>
<p>You'll need it. Always. For debugging, audit, ordering, retention. Add it to every table.</p>

<h3>Anti-pattern: nullable everything</h3>
<pre><code class="language-sql">-- BAD
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,           -- nullable; oops
  display_name TEXT     -- nullable; oops
);

-- GOOD
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT  -- only this is nullable; bio is genuinely optional
);
</code></pre>

<h3>Anti-pattern: function in WHERE breaks index</h3>
<pre><code class="language-sql">-- BAD — index on email NOT used; LOWER() applied per row
CREATE INDEX idx_users_email ON users(email);
SELECT * FROM users WHERE LOWER(email) = 'p@x.com';

-- GOOD — store lowercase OR expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'p@x.com';
</code></pre>

<h3>Anti-pattern: loop instead of bulk</h3>
<pre><code class="language-typescript">// BAD — N inserts; N round trips
for (const item of items) {
  await db.query('INSERT INTO items (name) VALUES ($1)', [item.name]);
}

// GOOD — single insert
await db.query(
  'INSERT INTO items (name) SELECT name FROM unnest($1::text[]) AS t(name)',
  [items.map(i =&gt; i.name)]
);
</code></pre>

<h3>Anti-pattern: <code>SELECT *</code> in app code</h3>
<pre><code class="language-sql">-- BAD — adds column → app breaks; pulls more bytes than needed
SELECT * FROM users WHERE id = $1;

-- GOOD — explicit columns
SELECT id, email, display_name FROM users WHERE id = $1;
</code></pre>

<h3>Anti-pattern: holding tx across HTTP calls</h3>
<pre><code class="language-typescript">// BAD — DB row locked while we wait for Stripe API (slow!)
await client.query('BEGIN');
await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
await stripe.charges.create({ ... }); // could take 5s
await client.query('UPDATE orders SET status = $1', ['paid']);
await client.query('COMMIT');

// GOOD — split into two transactions; idempotent on retry
const order = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
const charge = await stripe.charges.create({ idempotency_key: id, ... });
await db.query('UPDATE orders SET status = $1, charge_id = $2 WHERE id = $3', ['paid', charge.id, id]);
</code></pre>

<h3>Anti-pattern: optimistic without retry</h3>
<pre><code class="language-typescript">// BAD — first conflict crashes
const result = await db.query(
  'UPDATE posts SET title = $1, version = version + 1 WHERE id = $2 AND version = $3',
  [title, id, expectedVersion]
);
if (result.rowCount === 0) throw new Error('conflict');

// GOOD — retry loop with backoff
async function updateWithRetry(id, title, maxAttempts = 3) {
  for (let i = 0; i &lt; maxAttempts; i++) {
    const current = await db.query('SELECT version FROM posts WHERE id = $1', [id]);
    const result = await db.query(
      'UPDATE posts SET title = $1, version = version + 1 WHERE id = $2 AND version = $3',
      [title, id, current.rows[0].version]
    );
    if (result.rowCount &gt; 0) return;
  }
  throw new Error('too_many_conflicts');
}
</code></pre>

<h3>Anti-pattern: index on every column</h3>
<p>"Just in case" indexes slow writes (every UPDATE touches every index), bloat the DB, confuse the optimizer. Index for the queries you actually run; remove ones with zero hits per <code>pg_stat_user_indexes</code>.</p>

<h3>Anti-pattern: schema drift</h3>
<p>Production schema not matching dev / staging because of manual changes. Symptom: works in staging, broken in prod. Fix: migrations only; treat schema as code; CI checks <code>pg_dump --schema-only</code> matches expected.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common DB-related interview prompts</h3>
<ol>
  <li>Design the schema for [feed / chat / e-commerce / orders].</li>
  <li>Walk through how you'd debug a slow query.</li>
  <li>Compare SQL vs NoSQL; when would you pick each?</li>
  <li>Explain transactions / isolation levels.</li>
  <li>How do you scale Postgres past one machine?</li>
  <li>How would you implement [pagination / search / counters / leaderboard]?</li>
  <li>How do you handle migrations without downtime?</li>
  <li>Tell me about a time you debugged a DB issue.</li>
</ol>

<h3>The 5-step framework for "design a DB schema"</h3>
<ol>
  <li><strong>List entities + relationships:</strong> users, posts, likes; one-to-many, many-to-many.</li>
  <li><strong>Pick types deliberately:</strong> UUID for IDs, NUMERIC for money, TIMESTAMPTZ for dates, JSONB only for variable.</li>
  <li><strong>Constraints:</strong> NOT NULL, UNIQUE, CHECK, FOREIGN KEY.</li>
  <li><strong>Indexes for actual queries:</strong> author_id, created_at DESC, etc. Composite index column order matters.</li>
  <li><strong>Schema evolution:</strong> migrations versioned; backwards-compat deploys; online schema changes for big tables.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Postgres by default — flexibility, JSONB, full-text, pgvector. NoSQL when I have a specific access pattern that justifies it."</em></li>
  <li><em>"Normalize for write integrity; denormalize hot reads — feed timelines often need denorm or precomputed."</em></li>
  <li><em>"Indexes designed around actual queries; composite order matches sort + filter; partial indexes for selective subsets."</em></li>
  <li><em>"Transactions short; never hold across external calls; lock in deterministic order to avoid deadlocks."</em></li>
  <li><em>"Cursor pagination over offset — stable across writes, index-friendly."</em></li>
  <li><em>"Postgres TIMESTAMPTZ always; no naive timestamps. Money as integer cents or NUMERIC."</em></li>
  <li><em>"Migrations forward-only, reversible if possible; CONCURRENTLY for indexes; gh-ost for big-table column changes."</em></li>
  <li><em>"Read replicas for read-heavy; primary for read-after-write; PgBouncer between app and DB at scale."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"slow query"</td><td>EXPLAIN ANALYZE → identify Seq Scan / missing index / Sort</td></tr>
    <tr><td>"feed of posts from people I follow"</td><td>Join + (author, created) index + cursor pagination; consider denorm at scale</td></tr>
    <tr><td>"counter that updates often"</td><td>In-DB counter with row contention OR Redis + periodic flush</td></tr>
    <tr><td>"leaderboard"</td><td>Redis sorted sets; periodic snapshot to Postgres</td></tr>
    <tr><td>"full-text search"</td><td>Postgres tsvector + GIN; or Elastic for advanced</td></tr>
    <tr><td>"audit log"</td><td>Trigger-based; write to audit_log table</td></tr>
    <tr><td>"prevent double-charge"</td><td>Idempotency key with unique constraint</td></tr>
    <tr><td>"transfer between accounts"</td><td>Transaction with row locks in deterministic order</td></tr>
    <tr><td>"event log / time-series"</td><td>Range-partitioned table by time</td></tr>
    <tr><td>"recommendations / similarity"</td><td>pgvector with embeddings</td></tr>
    <tr><td>"multi-tenant"</td><td>Row-level security + tenant_id on every row, OR schema-per-tenant</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch tables + relationships.</li>
  <li>Show types + constraints.</li>
  <li>Define indexes per query pattern.</li>
  <li>Show one query with EXPLAIN.</li>
  <li>Show one transactional flow with locking.</li>
  <li>Talk pagination + denorm tradeoffs.</li>
  <li>Address scaling: read replicas, partitioning, PgBouncer.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Materialized views for expensive aggregations; refresh CONCURRENTLY."</em></li>
  <li><em>"pg_stat_statements for slow-query monitoring."</em></li>
  <li><em>"Range-partition the events table by month."</em></li>
  <li><em>"Row-level security for multi-tenant isolation."</em></li>
  <li><em>"Online schema change tooling (gh-ost / pg_repack) for big-table changes."</em></li>
  <li><em>"Read replicas with LSN-aware routing for read-after-write."</em></li>
  <li><em>"PgBouncer transaction-pooling between app + DB."</em></li>
  <li><em>"pgvector + IVFFlat for the recommendations index."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Schema fluency</td><td>Picks types, constraints, indexes deliberately</td></tr>
    <tr><td>Query plan literacy</td><td>Reads EXPLAIN; identifies bottlenecks</td></tr>
    <tr><td>Transaction discipline</td><td>Knows isolation levels, locking, deadlock avoidance</td></tr>
    <tr><td>SQL vs NoSQL judgement</td><td>Names access pattern; doesn't pick by trend</td></tr>
    <tr><td>Pagination instinct</td><td>Cursor by default; not offset</td></tr>
    <tr><td>Migration awareness</td><td>Online schema changes; backwards-compat deploys</td></tr>
    <tr><td>Scaling levers</td><td>Indexes → caching → replicas → partitioning → sharding</td></tr>
    <tr><td>Real war stories</td><td>Specific debugging anecdotes</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN talks to your backend; backend talks to DB. Same patterns.</li>
  <li>Local DBs in RN: SQLite (op-sqlite, expo-sqlite — fastest), WatermelonDB (reactive ORM), MMKV (kv only).</li>
  <li>Sync: backend schema must support idempotent writes (mobile clients retry on flaky networks).</li>
  <li>Offline mutations: queue + idempotency key + server dedupes.</li>
  <li>Cursor pagination critical on mobile — bandwidth + battery.</li>
  <li>Realtime updates: subscribe (WebSocket) or poll; both flow through DB layer.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"What's the difference between READ COMMITTED and REPEATABLE READ?"</em> — RC: each statement sees committed data; RR: whole transaction sees a snapshot from start. Postgres RR also prevents phantom reads (unlike SQL standard).</li>
  <li><em>"How would you implement a counter that updates 1000 times per second?"</em> — Don't update a single row; use Redis INCR + periodic flush, or sharded counters across N rows summed at read time.</li>
  <li><em>"How does <code>SELECT FOR UPDATE</code> work?"</em> — Locks the row exclusively until transaction commits; other transactions block on read-with-lock or write.</li>
  <li><em>"Why is composite index column order important?"</em> — Index is a B-tree sorted by first column, then second. <code>(a, b)</code> serves <code>WHERE a = ?</code> + <code>WHERE a = ? AND b = ?</code> + <code>ORDER BY a, b</code>. Doesn't serve <code>WHERE b = ?</code> alone.</li>
  <li><em>"How do you handle a column rename in production?"</em> — Add new column → backfill in batches → deploy code that writes both → deploy code that reads new → drop old. Multi-step migration with overlapping deploys.</li>
  <li><em>"How would you design a multi-tenant schema?"</em> — <code>tenant_id</code> on every row + RLS policies; or schema-per-tenant; or DB-per-tenant. Tradeoffs: isolation vs operational complexity.</li>
  <li><em>"Why UUIDv7 over UUIDv4?"</em> — UUIDv7 is time-ordered; index inserts append rather than fragment; better B-tree locality; sortable.</li>
  <li><em>"How do you debug a query that's slow only in production?"</em> — Get production EXPLAIN ANALYZE; check if data shape differs (cardinality, distribution); check stats freshness (<code>ANALYZE</code>); check query plan choice (often statistics-driven).</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a small Postgres schema end-to-end: users + posts + likes + follows; query patterns + indexes.</li>
  <li>Run EXPLAIN ANALYZE on every query; learn the operator vocabulary.</li>
  <li>Practice transaction + lock examples; deadlock + recovery.</li>
  <li>Try pgvector for an embeddings example.</li>
  <li>Read Postgres docs on indexes + isolation.</li>
  <li>Skim "Designing Data-Intensive Applications" chapters 2-3 (data models + storage).</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'The Art of PostgreSQL' for deep practical patterns."</li>
  <li>"Build a high-throughput counter with Postgres + Redis hybrid."</li>
  <li>"Try DynamoDB single-table design on a real schema."</li>
  <li>"Practice EXPLAIN reading on a real production-shaped dataset."</li>
</ul>
`
    }
  ]
});
