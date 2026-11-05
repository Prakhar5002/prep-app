window.PREP_SITE.registerTopic({
  id: "be-mysql",
  module: "backend-stack",
  title: "MySQL & SQL Deep",
  estimatedReadTime: "55 min",
  tags: ["mysql","sql","innodb","b-plus-tree","indexes","explain","window-functions","cte","transactions","mvcc","replication","pagination","migrations"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">In InnoDB <strong>the table is the primary-key B+tree</strong> and secondary indexes point at the PK — design composite indexes from WHERE → ORDER BY → SELECT, prove them with EXPLAIN, and remember REPEATABLE READ + gap locks govern every race and deadlock you'll debug.</div>
  <h4>Key points</h4>
  <ul>
    <li>"MySQL" in practice = <strong>MySQL + InnoDB</strong>; interviews test <strong>SQL fluency</strong> (a live joins/windows/CTE round) and <strong>engine depth</strong> (why a query is slow and how you prove it).</li>
    <li><strong>SELECT order of evaluation</strong>: FROM/JOIN → WHERE → GROUP BY → HAVING → windows → SELECT → ORDER BY → LIMIT. Filter windows via a CTE/derived table (no QUALIFY); filter aggregates with HAVING.</li>
    <li><strong>ROW_NUMBER</strong> = exactly N; <strong>RANK</strong> = ties with gaps; <strong>DENSE_RANK</strong> = Nth distinct value. Always add a deterministic tie-breaker.</li>
    <li>Running totals need an explicit <code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> frame; the default RANGE frame lumps ties together.</li>
    <li>Gaps &amp; islands: <code>date − ROW_NUMBER()</code> is constant within a consecutive run. Gaps: <code>LEAD</code>. Interval overlap: <code>s1 &lt; e2 AND s2 &lt; e1</code>.</li>
    <li>Anti-join with <code>NOT EXISTS</code> or <code>LEFT JOIN … IS NULL</code>; <code>NOT IN</code> returns nothing if the subquery has a NULL. Conditions on the right table of a LEFT JOIN belong in ON.</li>
    <li>Clustered PK: compact and monotonic (BIGINT auto-inc / time-ordered ids). Wide or random PKs bloat every secondary index and fragment inserts.</li>
    <li>Composite index: equality → sort → range; a range ends the usable prefix. Covering index = <code>Using index</code>, no clustered lookups.</li>
    <li>EXPLAIN: <code>type</code> (ALL bad), <code>key</code>/<code>key_len</code> (how much of the index), <code>rows</code>×<code>filtered</code>, Extra (filesort/temporary). EXPLAIN ANALYZE compares estimates with actuals.</li>
    <li>REPEATABLE READ (default): snapshot reads, next-key locks on locking reads; write skew still possible with plain reads → lock a parent row or use a UNIQUE constraint.</li>
    <li>Retry 1213 (deadlock) and 1205 (lock wait timeout) by re-running the whole transaction; keep transactions short with no external I/O inside.</li>
    <li>Keyset pagination over (sort, id) instead of OFFSET. Read-your-writes from primary after a write when replicas lag.</li>
    <li>Migrations: expand/contract, explicit ALGORITHM/LOCK, low <code>lock_wait_timeout</code> (MDL pile-up), batched backfills, gh-ost for big rebuilds; DDL isn't transactional.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Check-then-insert under REPEATABLE READ.</strong> "SELECT to see if the slot is free, then INSERT" passes code review and fails in production: both transactions read the same snapshot and both insert. Adding <code>FOR UPDATE</code> on an empty range "fixes" it by producing gap-lock deadlocks instead. Lock a parent row (<code>SELECT … FROM rooms WHERE id = ? FOR UPDATE</code>) or enforce it with a UNIQUE constraint — and retry on 1213.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"In InnoDB the table is the primary-key B+tree, so secondary indexes carry the PK and need a second lookup unless they cover the query — that's why I keep PKs compact and design covering composites for hot queries."</div>
  <div class="revision-say">"I order composite index columns equality first, then the sort column, then the range — and I verify with EXPLAIN that key_len covers the columns I expect and there's no filesort."</div>
  <div class="revision-say">"REPEATABLE READ gives me a snapshot, not a lock — so for invariants like no double-booking I either lock the parent row or let a unique constraint enforce it, and I always retry deadlocks."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What MySQL actually is</h3>
<p>MySQL is a server process (<code>mysqld</code>) with a layered design: a <strong>SQL layer</strong> (connection handling, parser, optimizer, executor) on top of pluggable <strong>storage engines</strong>. Today you will almost only meet <strong>InnoDB</strong> (transactional, row-locking, crash-safe — the default since 5.5). MyISAM (table locks, no transactions, not crash-safe) still appears in legacy systems; if you see it on a table that takes concurrent writes, that is a finding in itself.</p>
<p>Where you meet it as a full-stack / FDE engineer:</p>
<ul>
  <li><strong>Managed</strong>: Amazon RDS for MySQL, Aurora MySQL (see <a href="#/topic/cloud-rds">RDS &amp; Aurora</a>), Google Cloud SQL, Azure Database for MySQL, PlanetScale (Vitess-based).</li>
  <li><strong>Customer environments</strong>: the "messy existing system" you integrate with is very often a MySQL 5.7 or 8.0 database behind a PHP/Java app — you'll need to read its schema, query it safely, and not lock it.</li>
  <li><strong>Your own Node services</strong>: via <code>mysql2</code>, Prisma, TypeORM, Drizzle or Knex behind <a href="#/topic/be-express">Express</a> or <a href="#/topic/be-nestjs">NestJS</a>.</li>
</ul>

<h3>Why "SQL deep" is its own interview round</h3>
<p>Many full-stack loops include a 30–45 minute SQL exercise ("here are <code>users</code>, <code>orders</code>, <code>events</code> — answer these 4 questions"). The questions are predictable: aggregation with <code>HAVING</code>, anti-joins, top-N per group, running totals, day-over-day deltas, consecutive streaks, de-duplication. Engineers who mostly used an ORM struggle because they never had to <em>think in sets</em>. The examples section is built to fix exactly that.</p>

<h3>Why engine knowledge matters even with an ORM</h3>
<ul>
  <li>The ORM writes the SQL; <strong>the engine decides the plan</strong>. A Prisma <code>findMany</code> with <code>orderBy</code> + <code>skip: 50000</code> is still an OFFSET scan.</li>
  <li>Correctness bugs (double booking, lost updates, oversold inventory) come from isolation and locking semantics, not from your TypeScript.</li>
  <li>Production incidents (site freezes during a deploy, replica serving stale data, "Deadlock found when trying to get lock") are all engine behaviour.</li>
</ul>

<h3>MySQL 5.7 vs 8.0 — what changed that interviews care about</h3>
<table>
  <thead><tr><th>Feature</th><th>5.7</th><th>8.0+</th></tr></thead>
  <tbody>
    <tr><td>Window functions, CTEs (incl. recursive)</td><td>No</td><td>Yes</td></tr>
    <tr><td><code>EXPLAIN ANALYZE</code> (actual timings), tree format</td><td>No</td><td>Yes (8.0.18+)</td></tr>
    <tr><td>Hash join</td><td>No (nested loop only)</td><td>Yes (8.0.18+)</td></tr>
    <tr><td>Descending indexes</td><td>Parsed, ignored</td><td>Real</td></tr>
    <tr><td>Invisible indexes (test dropping safely)</td><td>No</td><td>Yes</td></tr>
    <tr><td>Functional (expression) indexes</td><td>Via generated columns</td><td>Native (8.0.13+)</td></tr>
    <tr><td><code>CHECK</code> constraints enforced</td><td>Parsed, ignored</td><td>Enforced (8.0.16+)</td></tr>
    <tr><td>Transactional data dictionary, instant <code>ADD COLUMN</code></td><td>No</td><td>Yes (instant algorithm, details vary by minor version — check current docs)</td></tr>
    <tr><td>Default charset</td><td>latin1</td><td>utf8mb4</td></tr>
  </tbody>
</table>
<p>5.7 reached end of life in October 2023; if a customer still runs it, window functions and CTEs are unavailable — be ready to write the "old way" (self-joins / user variables / correlated subqueries). Newer release lines (8.4 LTS, 9.x innovation) exist; check current docs for what is LTS when you interview.</p>

<h3>MySQL vs Postgres — the short version</h3>
<table>
  <thead><tr><th>Dimension</th><th>MySQL (InnoDB)</th><th>PostgreSQL</th></tr></thead>
  <tbody>
    <tr><td>Table storage</td><td>Clustered by primary key (table = PK B+tree)</td><td>Heap; all indexes are secondary pointing at tuple ids</td></tr>
    <tr><td>MVCC old versions</td><td>Undo log; purge thread cleans up</td><td>Old tuples stay in the heap; <code>VACUUM</code> cleans up</td></tr>
    <tr><td>Default isolation</td><td>REPEATABLE READ (with gap locks)</td><td>READ COMMITTED</td></tr>
    <tr><td>DDL in transactions</td><td>No — DDL causes an implicit commit</td><td>Yes — migrations can roll back atomically</td></tr>
    <tr><td>Index types</td><td>B+tree, FULLTEXT, spatial, functional</td><td>B-tree, GIN, GiST, BRIN, hash, partial indexes, extensions</td></tr>
    <tr><td>JSON</td><td><code>JSON</code> type, index via generated column / functional index / multi-valued index</td><td><code>JSONB</code> with GIN indexes — richer</td></tr>
    <tr><td>Vectors / extensions</td><td>Limited (VECTOR type in 9.x; search features vary by edition — check current docs)</td><td>pgvector, PostGIS, Timescale… (see <a href="#/topic/ai-vector-search">Vector Search</a>)</td></tr>
    <tr><td>Replication &amp; scaling story</td><td>Very mature binlog replication; Vitess/PlanetScale for sharding</td><td>Streaming + logical replication; Citus for sharding</td></tr>
    <tr><td>SQL features</td><td>No <code>FULL OUTER JOIN</code>, no <code>RETURNING</code> (MariaDB differs), no partial indexes</td><td>Richer: <code>RETURNING</code>, <code>DISTINCT ON</code>, <code>FILTER</code>, partial indexes</td></tr>
  </tbody>
</table>
<p>Senior framing: "Both are excellent. For a greenfield app I default to Postgres for its feature set; if the team or the customer already runs MySQL, it is absolutely fine — I'd just design around clustered PKs, REPEATABLE READ gap locks, and non-transactional DDL."</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>1. The table is a B+tree ordered by primary key</h3>
<div class="diagram">
<pre>
 CLUSTERED INDEX (PRIMARY) — the table itself, 16 KB pages by default

                         ┌──────────────────────┐
     root (internal)     │  1000   │   5000     │   keys + child-page pointers only
                         └───┬─────────┬────────┬┘
                ┌────────────┘         │        └─────────────┐
        ┌───────▼──────┐       ┌───────▼──────┐        ┌──────▼───────┐
        │ 200 │ 600    │       │ 2000 │ 3500  │        │ 7000 │ 9000  │   internal
        └─┬─────┬────┬─┘       └──────────────┘        └──────────────┘
          │     │    │
   ┌──────▼─┐ ┌─▼────────┐ ┌──▼────────┐
   │1..199  │⇄│200..599  │⇄│600..999   │⇄ ...   LEAF pages: FULL ROWS, sorted by PK,
   │full row│ │full row  │ │full row   │        doubly linked → range scans are cheap
   └────────┘ └──────────┘ └───────────┘

 Height 3–4 covers hundreds of millions of rows → a PK lookup = ~3–4 page reads,
 and the upper levels are almost always in the buffer pool (RAM).
</pre>
</div>
<ul>
  <li>If you don't declare a PK, InnoDB uses the first <code>UNIQUE NOT NULL</code> index, or invents a hidden 6-byte row id. Always declare one.</li>
  <li>Inserts in PK order (auto-increment) append to the right-most leaf — fast. Random PKs (UUIDv4) insert all over the tree → page splits, fragmentation, a bigger working set. Prefer <code>BIGINT AUTO_INCREMENT</code> or time-ordered ids (UUIDv7 / ULID stored as <code>BINARY(16)</code>).</li>
</ul>

<h3>2. Secondary indexes point at the primary key, not at the row</h3>
<div class="diagram">
<pre>
 SELECT * FROM users WHERE email = 'a@x.io';

  idx_email (secondary B+tree)              PRIMARY (clustered B+tree)
  leaf: (email, id)                         leaf: (id, all columns)
  ┌──────────────────────┐                  ┌──────────────────────────┐
  │ 'a@x.io'  →  id 42   │ ──── lookup ───► │ 42 │ a@x.io │ Asha │ ... │
  └──────────────────────┘    by PK         └──────────────────────────┘
        step 1: descend idx_email             step 2: descend PRIMARY ("bookmark lookup")

 If the query only needs (email, id) → step 2 is skipped = COVERING INDEX
 EXPLAIN shows:  Extra: Using index
</pre>
</div>
<p>Consequences: a wide PK (e.g. <code>VARCHAR(255)</code> or <code>CHAR(36)</code> UUID) is copied into <em>every</em> secondary index, bloating them all. And "index on X" doesn't make <code>SELECT *</code> free — for many rows the second lookup per row can be slower than a full scan, which is why the optimizer sometimes ignores your index.</p>

<h3>3. Composite index = phone book sorted by (last, first, city)</h3>
<div class="diagram">
<pre>
 INDEX idx (tenant_id, status, created_at)

 sorted like:  (1,'active','2026-01-01') (1,'active','2026-01-05') (1,'closed',...) (2,'active',...)

 WHERE tenant_id = 1                                  ✓ uses prefix (tenant_id)
 WHERE tenant_id = 1 AND status = 'active'            ✓ uses (tenant_id, status)
 WHERE tenant_id = 1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 20             ✓ all 3 cols, no filesort
 WHERE status = 'active'                              ✗ skips leftmost column
 WHERE tenant_id = 1 AND created_at &gt; '2026-01-01'   ~ uses tenant_id only for seek
                                                        (status gap breaks the prefix;
                                                         ICP may still filter in-index)
 WHERE tenant_id = 1 AND status IN ('a','b')
       ORDER BY created_at                            ~ seek ok, but sort needed
</pre>
</div>
<p><strong>Rule of thumb:</strong> equality columns first, then the sort column, then range columns. A range condition (<code>&gt;</code>, <code>BETWEEN</code>, <code>LIKE 'x%'</code>) "uses up" the index — columns after it can't be used for seeking or ordering.</p>

<h3>4. MVCC: readers see a snapshot, writers create versions</h3>
<div class="diagram">
<pre>
 row id=7 in the clustered leaf:   balance=80  (trx 105, roll_ptr ──┐)
                                                                     ▼
                         undo log:  balance=100 (trx 90) ──► balance=120 (trx 60)

 Txn A (REPEATABLE READ) started its read view when trx 100 was the newest committed.
 A reads id=7 → current version is from trx 105 (not visible) → follow roll_ptr →
 sees balance=100.   No lock taken. Writers never block plain readers.

 Long-open transactions keep old versions alive → undo history grows
 ("history list length") → everything gets slower.
</pre>
</div>

<h3>5. Locks live on index records — and on the gaps between them</h3>
<div class="diagram">
<pre>
 idx_room_start on bookings, room 7:   (7,09:00)   (7,11:00)   (7,15:00)
                                  gap ─┘   gap  ─┘    gap   ─┘   gap → +inf

 SELECT ... WHERE room_id=7 AND starts_at BETWEEN '10:00' AND '12:00' FOR UPDATE
   REPEATABLE READ → next-key locks: record (7,11:00) + the gaps around it
   → nobody can INSERT a new 7/10:30 booking until you commit (no phantoms)
   READ COMMITTED  → record locks only (gap locking mostly disabled)
</pre>
</div>

<h3>6. Replication is "replay the binlog somewhere else, a bit later"</h3>
<div class="diagram">
<pre>
  app writes ─► PRIMARY ── commit ──► binary log (row events)
                                          │  (async by default)
                    ┌─────────────────────┴───────────────────┐
                    ▼                                         ▼
            REPLICA 1: receiver thread → relay log → applier thread(s) → data
            REPLICA 2: same                          lag = ms … minutes
  app reads ─► replicas  ⇒  "I just saved it and it's gone" = read-your-writes bug
</pre>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>Running schema for this topic</h3>
<p>A meeting-room booking system (the kind behind room-booking tablets):</p>
<pre><code class="language-sql">CREATE TABLE users (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id   INT UNSIGNED    NOT NULL,
  email       VARCHAR(255)    NOT NULL,
  name        VARCHAR(120)    NOT NULL,
  manager_id  BIGINT UNSIGNED NULL,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_email (tenant_id, email),
  KEY idx_manager (manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE rooms (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id  INT UNSIGNED NOT NULL,
  name       VARCHAR(80)  NOT NULL,
  capacity   SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_tenant (tenant_id)
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id     INT UNSIGNED    NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  status      ENUM('confirmed','checked_in','cancelled') NOT NULL DEFAULT 'confirmed',
  starts_at   DATETIME NOT NULL,
  ends_at     DATETIME NOT NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_room_start (room_id, starts_at),
  KEY idx_user_start (user_id, starts_at),
  CONSTRAINT fk_b_room FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT fk_b_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT chk_time CHECK (ends_at &gt; starts_at)
) ENGINE=InnoDB;</code></pre>
<p>Notes: <code>utf8mb4</code> (MySQL's <code>utf8</code> is an alias for the 3-byte <code>utf8mb3</code> and can't store emoji). <code>DATETIME</code> has no timezone — store UTC and convert at the edge. <code>TIMESTAMP</code> converts to/from the session timezone and has a 2038 upper bound.</p>

<h3>SQL fluency: the logical order of a SELECT</h3>
<div class="diagram">
<pre>
 written:   SELECT … FROM … JOIN … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT
 evaluated: FROM/JOIN → WHERE → GROUP BY → HAVING → window functions → SELECT
            → DISTINCT → ORDER BY → LIMIT
</pre>
</div>
<p>This one diagram answers half the "why doesn't this work" questions: you can't use a window function in <code>WHERE</code> (it hasn't been computed yet — wrap it in a CTE/derived table; MySQL has no <code>QUALIFY</code>), and you can't filter an aggregate in <code>WHERE</code> (use <code>HAVING</code>).</p>

<h3>Joins — the set picture</h3>
<table>
  <thead><tr><th>Join</th><th>Returns</th><th>Typical use</th></tr></thead>
  <tbody>
    <tr><td><code>INNER JOIN</code></td><td>Only matching pairs</td><td>Bookings with their room</td></tr>
    <tr><td><code>LEFT JOIN</code></td><td>All left rows, NULLs where no match</td><td>Rooms with booking count (incl. 0)</td></tr>
    <tr><td><code>LEFT JOIN … WHERE r.id IS NULL</code></td><td>Anti-join</td><td>Users who never booked</td></tr>
    <tr><td><code>FULL OUTER JOIN</code></td><td>Not supported in MySQL</td><td>Emulate: <code>LEFT JOIN … UNION … RIGHT JOIN</code></td></tr>
    <tr><td><code>CROSS JOIN</code></td><td>Cartesian product</td><td>Rooms × calendar days grid</td></tr>
    <tr><td>Self join</td><td>Table joined to itself</td><td>Overlapping bookings, manager chain</td></tr>
  </tbody>
</table>
<div class="callout warn">
  <div class="callout-title">LEFT JOIN turned into INNER JOIN</div>
  <p><code>FROM rooms r LEFT JOIN bookings b ON b.room_id = r.id WHERE b.status = 'confirmed'</code> silently drops rooms without bookings, because <code>NULL = 'confirmed'</code> is not true. Put conditions on the right-hand table <strong>in the ON clause</strong>: <code>ON b.room_id = r.id AND b.status = 'confirmed'</code>.</p>
</div>

<h3>Window functions — the cheat sheet</h3>
<pre><code class="language-sql">fn(...) OVER (
  PARTITION BY  &lt;group columns&gt;        -- restart per group (like GROUP BY, but rows are kept)
  ORDER BY      &lt;order columns&gt;        -- order within the partition
  ROWS BETWEEN  &lt;start&gt; AND &lt;end&gt;      -- the frame (for SUM/AVG/FIRST_VALUE...)
)</code></pre>
<table>
  <thead><tr><th>Function</th><th>Ties (100, 90, 90, 80)</th><th>Use</th></tr></thead>
  <tbody>
    <tr><td><code>ROW_NUMBER()</code></td><td>1, 2, 3, 4</td><td>Exactly N per group, de-dup "keep latest"</td></tr>
    <tr><td><code>RANK()</code></td><td>1, 2, 2, 4</td><td>Competition ranking (gaps after ties)</td></tr>
    <tr><td><code>DENSE_RANK()</code></td><td>1, 2, 2, 3</td><td>"Nth highest distinct value"</td></tr>
    <tr><td><code>LAG(x, k) / LEAD(x, k)</code></td><td>—</td><td>Previous / next row: deltas, gaps, sessionization</td></tr>
    <tr><td><code>SUM/AVG/COUNT OVER</code></td><td>—</td><td>Running totals, moving averages, % of total</td></tr>
    <tr><td><code>FIRST_VALUE / LAST_VALUE / NTH_VALUE</code></td><td>—</td><td>First booking per user (beware LAST_VALUE's default frame)</td></tr>
    <tr><td><code>NTILE(n)</code>, <code>PERCENT_RANK</code>, <code>CUME_DIST</code></td><td>—</td><td>Buckets / percentiles</td></tr>
  </tbody>
</table>
<div class="callout danger">
  <div class="callout-title">The default frame trap</div>
  <p>With <code>ORDER BY</code> and no explicit frame, the frame is <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code>. <code>RANGE</code> treats <strong>peer rows (equal ORDER BY values) as one</strong>, so a running total jumps by the sum of all ties at once, and <code>LAST_VALUE</code> returns the current row's last peer, not the partition's last row. Write <code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> explicitly for running totals, and <code>ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING</code> for <code>LAST_VALUE</code>.</p>
</div>

<h3>CTEs (WITH) and recursive CTEs</h3>
<pre><code class="language-sql">-- Named steps make interview SQL readable and debuggable
WITH daily AS (
  SELECT DATE(starts_at) AS d, COUNT(*) AS n
  FROM bookings
  WHERE status &lt;&gt; 'cancelled'
  GROUP BY DATE(starts_at)
)
SELECT d, n, n - LAG(n) OVER (ORDER BY d) AS delta FROM daily;

-- Recursive: generate a calendar (no gaps in charts)
WITH RECURSIVE cal AS (
  SELECT DATE('2026-11-01') AS d
  UNION ALL
  SELECT d + INTERVAL 1 DAY FROM cal WHERE d &lt; '2026-11-30'
)
SELECT * FROM cal;   -- cte_max_recursion_depth (default 1000) guards runaways</code></pre>

<h3>InnoDB internals you should be able to name</h3>
<ul>
  <li><strong>Buffer pool</strong> — the page cache (often 50–75% of RAM on a dedicated server). Hit ratio and "does the working set fit" explain most performance cliffs.</li>
  <li><strong>Redo log</strong> (write-ahead log) — commit = redo record flushed (with <code>innodb_flush_log_at_trx_commit=1</code>, the durable default). Dirty pages are flushed later.</li>
  <li><strong>Undo log</strong> — old row versions for rollback and MVCC snapshots; cleaned by purge.</li>
  <li><strong>Doublewrite buffer</strong> — protects against torn 16 KB page writes.</li>
  <li><strong>Binary log</strong> — the SQL layer's change log used for replication and point-in-time recovery (distinct from the redo log; two-phase commit keeps them consistent).</li>
  <li><strong>Change buffer, adaptive hash index</strong> — optimizations; know they exist, rarely an interview deep-dive.</li>
</ul>

<h3>Reading EXPLAIN — column by column</h3>
<table>
  <thead><tr><th>Column</th><th>What it tells you</th><th>Red flags</th></tr></thead>
  <tbody>
    <tr><td><code>type</code></td><td>Access method, best → worst: <code>const</code>, <code>eq_ref</code>, <code>ref</code>, <code>range</code>, <code>index</code>, <code>ALL</code></td><td><code>ALL</code> (full table scan) on a big table; <code>index</code> = full <em>index</em> scan</td></tr>
    <tr><td><code>possible_keys</code> / <code>key</code></td><td>Candidate indexes / the one chosen</td><td><code>key</code> NULL while possible_keys has entries</td></tr>
    <tr><td><code>key_len</code></td><td>Bytes of the index actually used → how many composite columns</td><td>Shorter than expected = prefix stopped early</td></tr>
    <tr><td><code>ref</code></td><td>What is compared to the index (<code>const</code>, a column)</td><td>—</td></tr>
    <tr><td><code>rows</code></td><td>Estimated rows examined (from statistics)</td><td>Huge vs rows returned</td></tr>
    <tr><td><code>filtered</code></td><td>% of examined rows surviving the WHERE</td><td>Low % = index not selective for this query</td></tr>
    <tr><td><code>Extra</code></td><td><code>Using index</code> (covering), <code>Using index condition</code> (ICP), <code>Using where</code></td><td><code>Using filesort</code>, <code>Using temporary</code> on large sets</td></tr>
  </tbody>
</table>
<p><code>key_len</code> arithmetic: <code>INT</code> = 4, <code>BIGINT</code> = 8, <code>DATETIME</code> = 5 (more with fractional seconds), <code>+1</code> if the column is nullable, <code>VARCHAR(n)</code> = n × bytes-per-char + 2. For <code>idx_room_start (room_id INT UNSIGNED NOT NULL, starts_at DATETIME NOT NULL)</code>, <code>key_len = 9</code> means both columns are used; <code>4</code> means only <code>room_id</code>.</p>
<p><code>EXPLAIN ANALYZE</code> (8.0.18+) actually runs the query and prints a tree with actual rows and time per node — use it on a replica or a copy, never casually on a heavy production write.</p>

<h3>Transactions and isolation levels in InnoDB</h3>
<table>
  <thead><tr><th>Level</th><th>Plain SELECT sees</th><th>Locking reads / writes</th><th>Allows</th></tr></thead>
  <tbody>
    <tr><td>READ UNCOMMITTED</td><td>Latest, even uncommitted</td><td>Record locks</td><td>Dirty reads — never use</td></tr>
    <tr><td>READ COMMITTED</td><td>Fresh snapshot <em>per statement</em></td><td>Record locks, gap locks mostly off</td><td>Non-repeatable reads, phantoms</td></tr>
    <tr><td><strong>REPEATABLE READ</strong> (default)</td><td>One snapshot from the <em>first read</em> of the txn</td><td>Next-key locks (record + gap)</td><td>Write skew via plain reads; locking reads see the latest committed data, not your snapshot</td></tr>
    <tr><td>SERIALIZABLE</td><td>Plain SELECTs become <code>LOCK IN SHARE MODE</code> (autocommit off)</td><td>Next-key locks</td><td>Nothing, at the cost of blocking / deadlocks</td></tr>
  </tbody>
</table>
<ul>
  <li><code>SELECT … FOR UPDATE</code> = exclusive lock on the rows/ranges read; <code>FOR SHARE</code> = shared. 8.0 adds <code>NOWAIT</code> and <code>SKIP LOCKED</code> (great for job queues).</li>
  <li>Lock waits time out after <code>innodb_lock_wait_timeout</code> (default 50s) → error 1205. Deadlocks are detected immediately; one transaction is rolled back → error 1213. <strong>Both must be retried by the app.</strong></li>
  <li><code>SHOW ENGINE INNODB STATUS</code> → "LATEST DETECTED DEADLOCK" section; <code>performance_schema.data_locks</code> / <code>data_lock_waits</code> and <code>sys.innodb_lock_waits</code> for live waits.</li>
</ul>

<h3>Node.js access with mysql2</h3>
<pre><code class="language-ts">// db.ts
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'booking',
  connectionLimit: 10,          // per process! 20 pods x 10 = 200 server connections
  waitForConnections: true,
  queueLimit: 0,
  timezone: 'Z',                // treat DATETIME as UTC
  dateStrings: false,
  // ssl: { ca: fs.readFileSync('rds-ca.pem') }   for RDS in production
});

// Parameterized: execute() uses server-side prepared statements (cached per connection)
export async function roomDay(roomId: number, dayStartUtc: Date) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, starts_at, ends_at, status ' +
    'FROM bookings WHERE room_id = ? AND starts_at &gt;= ? AND starts_at &lt; ? + INTERVAL 1 DAY ' +
    'ORDER BY starts_at',
    [roomId, dayStartUtc, dayStartUtc]
  );
  return rows as Array&lt;{ id: number; user_id: number; starts_at: Date; ends_at: Date; status: string }&gt;;
}</code></pre>

<h3>A transaction helper with deadlock retry</h3>
<pre><code class="language-ts">import type { PoolConnection } from 'mysql2/promise';

const RETRYABLE = new Set([1213 /* ER_LOCK_DEADLOCK */, 1205 /* ER_LOCK_WAIT_TIMEOUT */]);

export async function withTx&lt;T&gt;(fn: (c: PoolConnection) =&gt; Promise&lt;T&gt;, attempts = 3): Promise&lt;T&gt; {
  for (let i = 1; ; i++) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err: any) {
      await conn.rollback().catch(() =&gt; {});
      if (RETRYABLE.has(err.errno) &amp;&amp; i &lt; attempts) {
        await new Promise(r =&gt; setTimeout(r, 20 * 2 ** i + Math.random() * 20)); // jittered backoff
        continue;                                                               // re-run the WHOLE txn
      }
      throw err;
    } finally {
      conn.release();           // always — a leaked connection = pool exhaustion
    }
  }
}</code></pre>
<p>Never do HTTP calls, S3 uploads or <code>await</code> on anything slow inside <code>fn</code> — locks are held until commit.</p>

<h3>Prisma with MySQL</h3>
<pre><code class="language-ts">import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

// Interactive transaction with explicit isolation level
await prisma.$transaction(async (tx) =&gt; {
  const clash = await tx.booking.count({
    where: { roomId, status: { not: 'cancelled' }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
  });
  if (clash &gt; 0) throw new Error('ROOM_TAKEN');
  await tx.booking.create({ data: { roomId, userId, startsAt, endsAt } });
}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 5000 });

// Raw SQL for window functions the query builder can't express:
// prefer the tagged-template form $queryRaw (auto-parameterized); the "Unsafe" variant
// is only safe when you pass values as positional parameters like this:
const top = await prisma.$queryRawUnsafe(
  'SELECT room_id, COUNT(*) AS n FROM bookings WHERE starts_at &gt;= ? GROUP BY room_id ORDER BY n DESC LIMIT 5',
  since
);</code></pre>
<p>Is the SERIALIZABLE version above actually safe? In InnoDB, SERIALIZABLE turns the <code>count</code> into a shared-locking read with next-key locks, so two concurrent bookers both take shared gap locks, both try to insert, and one gets a <strong>deadlock</strong> (1213) — correct, but you must retry. The cleaner pattern (lock the parent room row) is in the examples.</p>

<h3>Pagination: OFFSET vs keyset</h3>
<pre><code class="language-sql">-- OFFSET: reads and throws away 100000 rows, gets slower every page,
-- and duplicates/skips rows when data shifts between requests
SELECT id, starts_at FROM bookings WHERE room_id = 7
ORDER BY starts_at DESC, id DESC LIMIT 20 OFFSET 100000;

-- KEYSET (seek): constant cost, stable under inserts.
-- Cursor = (starts_at, id) of the last row the client saw.
SELECT id, starts_at FROM bookings
WHERE room_id = 7
  AND (starts_at &lt; ? OR (starts_at = ? AND id &lt; ?))
ORDER BY starts_at DESC, id DESC
LIMIT 20;
-- needs INDEX (room_id, starts_at, id); in InnoDB a secondary index already
-- ends with the PK, so (room_id, starts_at) effectively is (room_id, starts_at, id).</code></pre>
<p>The row-constructor form <code>(starts_at, id) &lt; (?, ?)</code> is shorter; confirm with EXPLAIN on your version that it produces a <code>range</code> scan before relying on it. Keyset trade-off: no "jump to page 37" — fine for infinite scroll in an RN list, which is the common case.</p>

<h3>Replication essentials</h3>
<ul>
  <li><strong>Binlog format</strong>: ROW (default and recommended) logs changed rows; STATEMENT logs SQL (non-deterministic functions break replicas); MIXED switches.</li>
  <li><strong>GTIDs</strong> give every transaction a global id → failover and re-pointing replicas without file/position arithmetic.</li>
  <li><strong>Async</strong> (default): primary doesn't wait → failover can lose the last few transactions. <strong>Semi-sync</strong>: commit waits until at least one replica has <em>received</em> the event. <strong>Group Replication / InnoDB Cluster</strong>: consensus-based. Aurora replaces binlog replication with a shared storage layer.</li>
  <li>Lag shows in <code>SHOW REPLICA STATUS</code> (<code>Seconds_Behind_Source</code>; older versions use <code>SHOW SLAVE STATUS</code> / <code>Seconds_Behind_Master</code>). Big transactions and single-threaded apply are the classic causes; enable parallel applier workers.</li>
</ul>

<h3>Online schema change toolbox</h3>
<table>
  <thead><tr><th>Approach</th><th>How</th><th>When</th></tr></thead>
  <tbody>
    <tr><td><code>ALGORITHM=INSTANT</code></td><td>Metadata-only change</td><td>Add column, some renames/defaults (8.0; scope varies by version)</td></tr>
    <tr><td><code>ALGORITHM=INPLACE, LOCK=NONE</code></td><td>Rebuilds/adds index while allowing DML</td><td>Add secondary index; still heavy I/O and replica lag</td></tr>
    <tr><td><code>ALGORITHM=COPY</code></td><td>Copies table, blocks writes</td><td>Avoid on big tables (e.g. changing column type)</td></tr>
    <tr><td>gh-ost / pt-online-schema-change</td><td>Shadow table + backfill + cut-over</td><td>Big tables, throttling on replica lag, pausable</td></tr>
  </tbody>
</table>
<p>Specify <code>ALGORITHM</code> and <code>LOCK</code> explicitly — the statement then <em>fails</em> instead of silently falling back to a blocking copy.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<p>Part A is an <strong>SQL practice set</strong> in interview order (try each before reading the solution). Part B is engine work: EXPLAIN walk-through, the double-booking race, a zero-downtime migration.</p>

<h3>Part A — SQL practice problems</h3>
<p>Extra tables used below:</p>
<pre><code class="language-sql">employees(id, name, dept_id, salary, manager_id)
orders(id, user_id, amount DECIMAL(10,2), created_at DATETIME)
logins(user_id, login_date DATE)          -- one row per user per day they logged in</code></pre>

<h4>P1. Second-highest distinct salary per department (Nth highest)</h4>
<pre><code class="language-sql">WITH ranked AS (
  SELECT dept_id, name, salary,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
  FROM employees
)
SELECT dept_id, name, salary
FROM ranked
WHERE rnk = 2;</code></pre>
<p>Why <code>DENSE_RANK</code>: salaries 100, 100, 90 → "second highest" should be 90. <code>ROW_NUMBER</code> returns a 100; <code>RANK</code> skips to 3 for 90 and returns nothing for rnk = 2. Classic single-table variant without windows (5.7): <code>SELECT MAX(salary) FROM employees WHERE salary &lt; (SELECT MAX(salary) FROM employees)</code> — returns NULL, not an empty set, when there is no second value, which interviewers like.</p>

<h4>P2. Top 3 rooms per tenant by confirmed hours this month (top-N per group)</h4>
<pre><code class="language-sql">WITH usage_hours AS (
  SELECT r.tenant_id, r.id AS room_id, r.name,
         SUM(TIMESTAMPDIFF(MINUTE, b.starts_at, b.ends_at)) / 60 AS hours
  FROM rooms r
  JOIN bookings b ON b.room_id = r.id
                 AND b.status &lt;&gt; 'cancelled'
                 AND b.starts_at &gt;= '2026-11-01' AND b.starts_at &lt; '2026-12-01'
  GROUP BY r.tenant_id, r.id, r.name
),
ranked AS (
  SELECT u.*, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY hours DESC, room_id) AS rn
  FROM usage_hours u
)
SELECT tenant_id, room_id, name, hours
FROM ranked
WHERE rn &lt;= 3
ORDER BY tenant_id, rn;</code></pre>
<p>Talking points: the tie-breaker (<code>room_id</code>) makes output deterministic; use <code>RANK</code> if the interviewer wants "include ties". The month filter is a half-open range on the raw column (sargable) — not <code>MONTH(starts_at) = 11</code>. Pre-8.0 alternative: correlated subquery <code>WHERE (SELECT COUNT(*) FROM usage_hours u2 WHERE u2.tenant_id = u.tenant_id AND u2.hours &gt; u.hours) &lt; 3</code> — O(n²) per group, mention it only as the fallback.</p>

<h4>P3. Running total and % of month for each user's orders</h4>
<pre><code class="language-sql">SELECT user_id, created_at, amount,
       SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at, id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
       ROUND(100 * amount / SUM(amount) OVER (PARTITION BY user_id), 2)  AS pct_of_user_total
FROM orders
WHERE created_at &gt;= '2026-11-01' AND created_at &lt; '2026-12-01'
ORDER BY user_id, created_at, id;</code></pre>
<p>Explicit <code>ROWS</code> frame + <code>id</code> tie-breaker = two orders at the same second don't get the same running total. The second window has no <code>ORDER BY</code>, so its frame is the whole partition → the user's total.</p>

<h4>P4. 7-day moving average of daily bookings, with zero-filled days</h4>
<pre><code class="language-sql">WITH RECURSIVE cal AS (
  SELECT DATE('2026-10-01') AS d
  UNION ALL SELECT d + INTERVAL 1 DAY FROM cal WHERE d &lt; '2026-10-31'
),
daily AS (
  SELECT DATE(starts_at) AS d, COUNT(*) AS n
  FROM bookings
  WHERE starts_at &gt;= '2026-10-01' AND starts_at &lt; '2026-11-01'
  GROUP BY DATE(starts_at)
)
SELECT cal.d,
       COALESCE(daily.n, 0) AS bookings,
       ROUND(AVG(COALESCE(daily.n, 0)) OVER (ORDER BY cal.d
             ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS ma7
FROM cal LEFT JOIN daily ON daily.d = cal.d
ORDER BY cal.d;</code></pre>
<p>Without the calendar, missing days silently shrink the window ("7 rows" ≠ "7 days"). That observation is a senior signal.</p>

<h4>P5. Day-over-day change with LAG</h4>
<pre><code class="language-sql">WITH daily AS (
  SELECT DATE(created_at) AS d, SUM(amount) AS revenue
  FROM orders GROUP BY DATE(created_at)
)
SELECT d, revenue,
       revenue - LAG(revenue) OVER (ORDER BY d) AS abs_change,
       ROUND(100 * (revenue - LAG(revenue) OVER (ORDER BY d))
             / NULLIF(LAG(revenue) OVER (ORDER BY d), 0), 1) AS pct_change
FROM daily;</code></pre>
<p><code>NULLIF(x, 0)</code> avoids division by zero (MySQL returns NULL plus a warning, or errors in strict modes for some statements — be explicit).</p>

<h4>P6. Gaps and islands — longest consecutive login streak per user</h4>
<pre><code class="language-sql">WITH d AS (
  SELECT DISTINCT user_id, login_date FROM logins
),
grp AS (
  SELECT user_id, login_date,
         DATE_SUB(login_date,
                  INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) DAY) AS island
  FROM d
),
streaks AS (
  SELECT user_id, island, MIN(login_date) AS start_d, MAX(login_date) AS end_d, COUNT(*) AS len
  FROM grp GROUP BY user_id, island
)
SELECT user_id, MAX(len) AS longest_streak
FROM streaks GROUP BY user_id;</code></pre>
<div class="diagram">
<pre>
 login_date   row_number   login_date - rn   → island key
 2026-11-01       1          2026-10-31   ┐
 2026-11-02       2          2026-10-31   ├ same key = consecutive run of 3
 2026-11-03       3          2026-10-31   ┘
 2026-11-07       4          2026-11-03   ┐ new island (gap broke the pattern)
 2026-11-08       5          2026-11-03   ┘
</pre>
</div>
<p>Explain the trick out loud: within a consecutive run, date and row number both increase by 1, so their difference is constant. <code>DISTINCT</code> first, or duplicate logins break it.</p>

<h4>P7. Gaps — find missing invoice numbers and free room slots</h4>
<pre><code class="language-sql">-- Missing ranges in a supposedly contiguous sequence
SELECT invoice_no + 1 AS gap_start, next_no - 1 AS gap_end
FROM (
  SELECT invoice_no, LEAD(invoice_no) OVER (ORDER BY invoice_no) AS next_no
  FROM invoices
) t
WHERE next_no - invoice_no &gt; 1;

-- Free gaps of 30+ minutes between bookings in room 7 on a given day
SELECT ends_at AS free_from, next_start AS free_until
FROM (
  SELECT ends_at, LEAD(starts_at) OVER (ORDER BY starts_at) AS next_start
  FROM bookings
  WHERE room_id = 7 AND status &lt;&gt; 'cancelled'
    AND starts_at &gt;= '2026-11-05' AND starts_at &lt; '2026-11-06'
) t
WHERE TIMESTAMPDIFF(MINUTE, ends_at, next_start) &gt;= 30;</code></pre>

<h4>P8. Overlapping bookings (data-quality check)</h4>
<pre><code class="language-sql">SELECT a.id AS booking_a, b.id AS booking_b, a.room_id
FROM bookings a
JOIN bookings b
  ON  b.room_id = a.room_id
  AND b.id &gt; a.id                         -- each pair once, no self-match
  AND a.starts_at &lt; b.ends_at
  AND b.starts_at &lt; a.ends_at            -- the universal interval-overlap test
WHERE a.status &lt;&gt; 'cancelled' AND b.status &lt;&gt; 'cancelled';</code></pre>
<p>Memorize the overlap condition: two half-open intervals [s1, e1) and [s2, e2) overlap iff <code>s1 &lt; e2 AND s2 &lt; e1</code>. Back-to-back bookings (10:00–11:00 and 11:00–12:00) correctly don't overlap.</p>

<h4>P9. Anti-join — users who never booked (and the NOT IN NULL trap)</h4>
<pre><code class="language-sql">-- Correct and usually fastest (semi/anti-join optimisations)
SELECT u.id, u.email FROM users u
WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.user_id = u.id);

-- Also correct
SELECT u.id, u.email FROM users u
LEFT JOIN bookings b ON b.user_id = u.id
WHERE b.id IS NULL;

-- BUG if the subquery can return NULL: x NOT IN (1, 2, NULL) is never TRUE → zero rows
SELECT id FROM users WHERE id NOT IN (SELECT manager_id FROM users);</code></pre>

<h4>P10. De-duplicate, keeping the newest row per key</h4>
<pre><code class="language-sql">-- Preview what would be deleted
SELECT * FROM (
  SELECT id, tenant_id, email,
         ROW_NUMBER() OVER (PARTITION BY tenant_id, LOWER(email) ORDER BY created_at DESC, id DESC) AS rn
  FROM users
) t WHERE rn &gt; 1;

-- Delete via a join to a derived table (a direct subquery on the same table hits error 1093)
DELETE u FROM users u
JOIN (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id, LOWER(email)
                                ORDER BY created_at DESC, id DESC) AS rn
  FROM users
) d ON d.id = u.id
WHERE d.rn &gt; 1;</code></pre>
<p>On a big table do this in batches (<code>LIMIT</code> by id ranges) and then add the <code>UNIQUE</code> constraint so it can't happen again — the de-dup alone is a symptom fix.</p>

<h4>P11. Pivot with conditional aggregation</h4>
<pre><code class="language-sql">SELECT room_id,
       SUM(status = 'confirmed')  AS confirmed,    -- boolean → 1/0 in MySQL
       SUM(status = 'checked_in') AS checked_in,
       SUM(status = 'cancelled')  AS cancelled,
       ROUND(100 * SUM(status = 'cancelled') / COUNT(*), 1) AS cancel_rate_pct
FROM bookings
WHERE starts_at &gt;= '2026-11-01'
GROUP BY room_id
HAVING COUNT(*) &gt;= 20          -- filter on aggregate → HAVING, not WHERE
ORDER BY cancel_rate_pct DESC;</code></pre>
<p>Portable form: <code>SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)</code>. Postgres would use <code>COUNT(*) FILTER (WHERE …)</code>, which MySQL lacks.</p>

<h4>P12. Recursive CTE — full management chain above an employee</h4>
<pre><code class="language-sql">WITH RECURSIVE chain AS (
  SELECT id, name, manager_id, 0 AS depth FROM employees WHERE id = 42
  UNION ALL
  SELECT e.id, e.name, e.manager_id, c.depth + 1
  FROM employees e JOIN chain c ON e.id = c.manager_id
  WHERE c.depth &lt; 20                 -- guard against cycles in dirty data
)
SELECT * FROM chain ORDER BY depth;</code></pre>

<h4>P13. Month-1 retention cohort</h4>
<pre><code class="language-sql">WITH first_order AS (
  SELECT user_id, DATE_FORMAT(MIN(created_at), '%Y-%m-01') AS cohort
  FROM orders GROUP BY user_id
),
activity AS (
  SELECT DISTINCT o.user_id, f.cohort,
         TIMESTAMPDIFF(MONTH, f.cohort, DATE_FORMAT(o.created_at, '%Y-%m-01')) AS month_n
  FROM orders o JOIN first_order f USING (user_id)
)
SELECT cohort,
       COUNT(DISTINCT CASE WHEN month_n = 0 THEN user_id END) AS cohort_size,
       COUNT(DISTINCT CASE WHEN month_n = 1 THEN user_id END) AS retained_m1,
       ROUND(100 * COUNT(DISTINCT CASE WHEN month_n = 1 THEN user_id END)
                 / COUNT(DISTINCT CASE WHEN month_n = 0 THEN user_id END), 1) AS m1_pct
FROM activity
GROUP BY cohort ORDER BY cohort;</code></pre>

<div class="callout insight">
  <div class="callout-title">How to run a live SQL round</div>
  <p>1) Restate the grain of the output ("one row per tenant per room"). 2) Ask about ties, NULLs, cancelled rows, timezones. 3) Build it in CTE steps and say what each step returns. 4) Sanity-check with a 3-row mental example. 5) Mention the index that would make it fast. That narration matters as much as the final query.</p>
</div>

<h3>Part B — Engine work</h3>

<h4>B1. EXPLAIN walk-through: the tablet's "today's schedule" query</h4>
<pre><code class="language-sql">-- Suppose the table was created WITHOUT idx_room_start (only PRIMARY + idx_user_start)
EXPLAIN SELECT id, user_id, starts_at, ends_at
FROM bookings
WHERE room_id = 7 AND starts_at &gt;= '2026-11-05' AND starts_at &lt; '2026-11-06'
ORDER BY starts_at;</code></pre>
<pre><code class="language-text">id select_type table    type possible_keys key  key_len rows    filtered Extra
1  SIMPLE      bookings ALL  NULL          NULL NULL    1184220 1.11     Using where; Using filesort</code></pre>
<p>Read it: <code>type=ALL</code> → full scan of 1.18M rows (estimate); <code>filtered=1.11</code> → ~13k survive the WHERE; <code>Using filesort</code> → sorting after the scan. Every tablet polls this every 30 seconds → CPU pegged.</p>
<pre><code class="language-sql">ALTER TABLE bookings ADD INDEX idx_room_start (room_id, starts_at), ALGORITHM=INPLACE, LOCK=NONE;</code></pre>
<pre><code class="language-text">id select_type table    type  possible_keys  key            key_len rows filtered Extra
1  SIMPLE      bookings range idx_room_start idx_room_start 9       14   100.00   Using index condition</code></pre>
<p>Now: <code>type=range</code>, <code>key_len=9</code> (both columns: 4 + 5), 14 rows, and <strong>no filesort</strong> because the index is already ordered by <code>starts_at</code> within <code>room_id = 7</code>. Each of those 14 rows still needs a PK lookup to fetch <code>user_id</code> and <code>ends_at</code>. To make it covering:</p>
<pre><code class="language-sql">ALTER TABLE bookings DROP INDEX idx_room_start,
  ADD INDEX idx_room_start_cov (room_id, starts_at, ends_at, user_id, status),
  ALGORITHM=INPLACE, LOCK=NONE;
-- Extra: Using where; Using index   ← no clustered lookups at all</code></pre>
<p>Trade-off to say out loud: wider index = more RAM and slower writes. Worth it for a query run by every device every 30 seconds; not worth it for an admin report run once a day.</p>
<pre><code class="language-text">-- EXPLAIN ANALYZE (8.0.18+) shape — illustrative, exact text varies by version
-&gt; Filter: ((bookings.starts_at &gt;= TIMESTAMP'2026-11-05 00:00:00') and ...)
     (cost=6.56 rows=14) (actual time=0.041..0.088 rows=14 loops=1)
   -&gt; Covering index range scan on bookings using idx_room_start_cov over (room_id = 7 AND ...)
        (cost=6.56 rows=14) (actual time=0.037..0.079 rows=14 loops=1)</code></pre>
<p>Compare estimated <code>rows</code> vs actual <code>rows</code>; a 100× mismatch means stale statistics (<code>ANALYZE TABLE</code>) or skewed data (histograms: <code>ANALYZE TABLE … UPDATE HISTOGRAM ON col</code>).</p>

<h4>B2. The double-booking race and three fixes</h4>
<div class="diagram">
<pre>
 Txn A                                          Txn B
 SELECT COUNT(*) overlapping room 7 10–11 → 0
                                                SELECT COUNT(*) overlapping → 0   (snapshot!)
 INSERT booking 10:00–11:00
 COMMIT
                                                INSERT booking 10:30–11:30
                                                COMMIT        ⇒ DOUBLE BOOKED
</pre>
</div>
<p>Plain SELECTs in REPEATABLE READ read a snapshot and take no locks — this is <strong>write skew</strong>. Fixes:</p>
<pre><code class="language-ts">// Fix 1 (recommended): serialize per room by locking the PARENT row
await withTx(async (c) =&gt; {
  await c.execute('SELECT id FROM rooms WHERE id = ? FOR UPDATE', [roomId]);   // queue per room
  const [rows]: any = await c.execute(
    'SELECT COUNT(*) AS n FROM bookings WHERE room_id = ? AND status &lt;&gt; ? ' +
    'AND starts_at &lt; ? AND ends_at &gt; ?',
    [roomId, 'cancelled', endsAt, startsAt]
  );
  if (rows[0].n &gt; 0) throw new ConflictError('ROOM_TAKEN');
  await c.execute(
    'INSERT INTO bookings (room_id, user_id, starts_at, ends_at) VALUES (?, ?, ?, ?)',
    [roomId, userId, startsAt, endsAt]
  );
});</code></pre>
<ul>
  <li><strong>Fix 1 — lock the parent row</strong>: one cheap record lock, bookings for other rooms proceed in parallel, no gap-lock deadlocks. Contention only per room.</li>
  <li><strong>Fix 2 — <code>SELECT … FOR UPDATE</code> on the bookings range</strong>: works via next-key locks, but two transactions locking the same <em>empty</em> gap both succeed (gap locks don't conflict with each other), then both INSERTs wait on each other's gap lock → deadlock 1213. Correct only with retry; noisier.</li>
  <li><strong>Fix 3 — make conflicts impossible by constraint</strong>: if bookings are fixed slots (e.g. 30-minute grid), store one row per slot with <code>UNIQUE (room_id, slot_start)</code> and catch duplicate-key error 1062. MySQL has no exclusion constraints (Postgres does), so arbitrary-interval overlap can't be expressed as a constraint.</li>
</ul>

<h4>B3. Lost update on a counter</h4>
<pre><code class="language-sql">-- BUG: read-modify-write in app code; two requests both read 5 and both write 6
SELECT credits FROM accounts WHERE id = 1;          -- app computes credits - 1
UPDATE accounts SET credits = 4 WHERE id = 1;

-- FIX A: atomic in-place update with a guard
UPDATE accounts SET credits = credits - 1 WHERE id = 1 AND credits &gt; 0;
-- affectedRows = 0  → insufficient credits

-- FIX B: optimistic concurrency with a version column
UPDATE accounts SET credits = ?, version = version + 1 WHERE id = ? AND version = ?;
-- affectedRows = 0  → someone else won, reload and retry</code></pre>

<h4>B4. Zero-downtime rename: <code>users.name</code> → <code>full_name</code> (expand / contract)</h4>
<ol>
  <li><strong>Expand</strong>: <code>ALTER TABLE users ADD COLUMN full_name VARCHAR(120) NULL, ALGORITHM=INSTANT;</code></li>
  <li><strong>Dual-write</strong>: deploy app version that writes both columns, still reads <code>name</code>.</li>
  <li><strong>Backfill in batches</strong>: <code>UPDATE users SET full_name = name WHERE id BETWEEN ? AND ? AND full_name IS NULL;</code> — 1–5k rows per batch, sleep between, watch replica lag.</li>
  <li><strong>Switch reads</strong> to <code>full_name</code>; verify counts match.</li>
  <li><strong>Contract</strong>: stop writing <code>name</code>; later drop it (gh-ost / instant drop where supported) after a full release cycle so rollbacks still work.</li>
</ol>
<pre><code class="language-sql">-- Before any DDL in production: protect against the metadata-lock pile-up
SET SESSION lock_wait_timeout = 5;   -- give up quickly instead of blocking every query behind us
ALTER TABLE users ADD COLUMN full_name VARCHAR(120) NULL, ALGORITHM=INSTANT;</code></pre>

<h4>B5. Job queue with SKIP LOCKED</h4>
<pre><code class="language-sql">START TRANSACTION;
SELECT id, payload FROM jobs
WHERE status = 'pending' AND run_at &lt;= NOW()
ORDER BY run_at
LIMIT 10
FOR UPDATE SKIP LOCKED;          -- concurrent workers grab disjoint batches, no waiting
UPDATE jobs SET status = 'running', locked_by = ? WHERE id IN (...);
COMMIT;</code></pre>
<p>Good enough for modest throughput (thousands/min). Beyond that, or for fan-out, move to a real broker — see <a href="#/topic/be-queues">Queues</a> and <a href="#/topic/be-kafka">Kafka</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Index silently not used</h3>
<ul>
  <li><strong>Function on the column</strong>: <code>WHERE DATE(starts_at) = '2026-11-05'</code> → can't seek. Rewrite as a half-open range or add a functional index.</li>
  <li><strong>Implicit type conversion</strong>: <code>phone VARCHAR</code> compared with a number (<code>WHERE phone = 98765</code>) converts every row → full scan. Comparing an INT column to a string is fine; the reverse is not.</li>
  <li><strong>Collation/charset mismatch in joins</strong>: joining <code>utf8mb4_0900_ai_ci</code> to <code>utf8mb3_general_ci</code> columns can force conversion and skip the index.</li>
  <li><strong>Leading wildcard</strong>: <code>LIKE '%son'</code> can't seek; use FULLTEXT or a search engine.</li>
  <li><strong><code>OR</code> across different columns</strong>: may fall back to a scan; sometimes <code>index_merge</code> helps, often <code>UNION ALL</code> of two indexed queries is better.</li>
  <li><strong>Low selectivity</strong>: index on <code>status</code> where 90% rows are 'confirmed' → optimizer correctly prefers a scan.</li>
  <li><strong>Stale statistics</strong> after bulk loads → bad plans; <code>ANALYZE TABLE</code>.</li>
</ul>

<h3>NULL semantics</h3>
<ul>
  <li><code>NULL = NULL</code> is NULL (not true). Use <code>IS NULL</code> or MySQL's null-safe <code>&lt;=&gt;</code>.</li>
  <li><code>COUNT(col)</code> skips NULLs, <code>COUNT(*)</code> doesn't. <code>AVG</code> ignores NULLs (not zero!).</li>
  <li><code>UNIQUE</code> allows multiple NULLs.</li>
  <li><code>NOT IN</code> with a NULL in the list returns no rows (P9).</li>
</ul>

<h3>GROUP BY and ONLY_FULL_GROUP_BY</h3>
<p>Since 5.7 the default <code>sql_mode</code> includes <code>ONLY_FULL_GROUP_BY</code>: selecting a non-aggregated column that isn't functionally dependent on the GROUP BY is an error. Old code that relied on "MySQL picks any row" breaks on upgrade. Fix it properly (aggregate, or window function), not with <code>ANY_VALUE()</code> everywhere.</p>

<h3>Time and timezones</h3>
<ul>
  <li><code>DATETIME</code> stores wall-clock with no zone; <code>TIMESTAMP</code> stores UTC and converts using the <em>session</em> <code>time_zone</code> — two app servers with different session timezones read different values.</li>
  <li>Driver timezone (<code>mysql2</code> <code>timezone</code> option) adds another conversion. Pick UTC everywhere and convert in the client (the RN app knows the device zone; a room tablet knows the building's zone).</li>
  <li>"Bookings for today" is a range in the building's local day converted to UTC — not <code>CURDATE()</code> on a server in another region.</li>
</ul>

<h3>Strings and charset</h3>
<ul>
  <li><code>utf8</code> = <code>utf8mb3</code> → emoji fail to insert (or get truncated in non-strict mode). Use <code>utf8mb4</code> for every table <em>and</em> the connection.</li>
  <li>Default collations are case- and accent-insensitive (<code>_ai_ci</code>): <code>'José' = 'jose'</code> is true, so a <code>UNIQUE</code> on email treats <code>A@x.io</code> and <code>a@x.io</code> as duplicates — usually what you want, occasionally a surprise.</li>
  <li>Index key prefix limit (3072 bytes for DYNAMIC row format) → <code>VARCHAR(1000)</code> utf8mb4 can't be fully indexed; use a prefix index or a hash column.</li>
</ul>

<h3>Transactions and DDL</h3>
<ul>
  <li>DDL commits implicitly — a failed multi-step migration leaves you half-migrated. Make each step idempotent.</li>
  <li><strong>Metadata lock (MDL) pile-up</strong>: <code>ALTER TABLE</code> needs an exclusive MDL briefly; if a long transaction (even an idle one left open by a console session) holds a shared MDL, the ALTER waits — and every new query on that table queues <em>behind the ALTER</em>. Symptom: site-wide stall during a "safe" instant DDL. Set <code>lock_wait_timeout</code> low and kill idle transactions first.</li>
  <li>Autocommit is on by default; an ORM/driver that forgets to commit or release leaves a transaction open for hours.</li>
</ul>

<h3>AUTO_INCREMENT surprises</h3>
<ul>
  <li>Gaps are normal (rolled-back inserts, bulk inserts reserve ranges). Never use the id as "count of rows" or for invoice numbering that legally must be gapless.</li>
  <li><code>INT UNSIGNED</code> maxes at ~4.29 billion — event tables hit it. Use <code>BIGINT</code> for anything high-volume; altering it later is a full table rebuild.</li>
  <li>Exposing sequential ids in URLs leaks volume and enables enumeration — combine with authorization checks or expose a public opaque id.</li>
</ul>

<h3>Replication and reads</h3>
<ul>
  <li>Read-your-writes: after a write, read from the primary for that user for N seconds, or route by session "sticky to primary", or check the replica's executed GTID set.</li>
  <li><code>Seconds_Behind_Source</code> can read 0 while the replica's receiver is disconnected; monitor with a heartbeat table (e.g. pt-heartbeat) for truth.</li>
  <li>One huge <code>UPDATE</code> of 10M rows replays as one huge transaction on replicas → minutes of lag. Batch it.</li>
</ul>

<h3>Large OFFSET, COUNT(*), and "exact totals"</h3>
<p>InnoDB has no cached row count — <code>SELECT COUNT(*) FROM bookings</code> scans an index. For "Showing 1–20 of 1,284,113" UIs, use an approximate count, a cached counter table, or drop the total.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>1. Check-then-insert without a lock or a constraint</h3>
<p>The double-booking / duplicate-signup bug. The only reliable fixes are a <code>UNIQUE</code> constraint (handle 1062) or a lock on a parent row. Application-level "SELECT first" is a race.</p>

<h3>2. String-built SQL</h3>
<pre><code class="language-ts">// BUG: SQL injection, and no plan caching
await pool.query("SELECT * FROM users WHERE email = '" + req.query.email + "'");

// FIX: placeholders (values are sent separately)
await pool.execute('SELECT id, name FROM users WHERE email = ?', [req.query.email]);
// Identifiers (ORDER BY column) can't be placeholders → whitelist them:
const sortCol = ({ name: 'name', created: 'created_at' } as Record&lt;string, string&gt;)[req.query.sort as string] ?? 'id';</code></pre>

<h3>3. N+1 queries from an ORM</h3>
<p>Loading 50 rooms and then each room's bookings in a loop = 51 round trips. Use a join, an <code>IN (…)</code> batch, Prisma <code>include</code>, or a DataLoader. Detect it by counting queries per request in logs.</p>

<h3>4. One index per column</h3>
<p>Ten single-column indexes ≠ one good composite. MySQL usually uses one index per table access (index_merge is the exception and is often slower). Each extra index costs write amplification, RAM and replica apply time. Design composites from real queries; find unused ones with <code>sys.schema_unused_indexes</code>; test removal with <code>ALTER TABLE … ALTER INDEX idx INVISIBLE</code>.</p>

<h3>5. Redundant index</h3>
<p><code>INDEX (room_id)</code> next to <code>INDEX (room_id, starts_at)</code> is redundant — the composite's left prefix serves the same queries. (<code>sys.schema_redundant_indexes</code> lists them.)</p>

<h3>6. UUIDv4 as CHAR(36) primary key</h3>
<p>36 bytes copied into every secondary index, random insert positions, buffer-pool churn. Use <code>BIGINT</code> PK + a separate public id, or time-ordered UUIDs stored as <code>BINARY(16)</code> (<code>UUID_TO_BIN(uuid, 1)</code> swaps time bits for v1 UUIDs; for v7 generate in the app).</p>

<h3>7. FLOAT/DOUBLE for money</h3>
<p>Use <code>DECIMAL(12,2)</code> or integer minor units (paise/cents as <code>BIGINT</code>). <code>0.1 + 0.2</code> in DOUBLE isn't 0.3.</p>

<h3>8. Long transactions</h3>
<p>A transaction that stays open while the app calls a payment gateway holds row locks (blocking others), holds an MVCC snapshot (purge can't clean undo → history list grows → all reads slower), and holds MDL (blocking DDL). Keep transactions short and do external I/O outside, with an outbox if needed (<a href="#/topic/be-queues">Queues</a>).</p>

<h3>9. Ignoring deadlock errors</h3>
<p>Deadlocks are <em>normal</em> under concurrency in InnoDB. Treating 1213 as a 500 is the bug. Retry the whole transaction with backoff, and reduce frequency by locking rows in a consistent order and keeping transactions short.</p>

<h3>10. SELECT * in hot paths</h3>
<p>Prevents covering indexes, drags large TEXT/JSON columns off-page, breaks when columns are added (positional mapping), and ships PII you didn't need.</p>

<h3>11. Huge single-statement backfills and deletes</h3>
<pre><code class="language-sql">-- BUG: one 40M-row transaction: undo bloat, locks, replica lag for minutes
DELETE FROM events WHERE created_at &lt; '2025-01-01';

-- FIX: batches by primary key, committed separately
DELETE FROM events WHERE created_at &lt; '2025-01-01' ORDER BY id LIMIT 5000;
-- loop until affectedRows = 0, sleep ~100ms between, pause if replica lag &gt; N s
-- Long-term: RANGE partition by month and DROP PARTITION (instant).</code></pre>

<h3>12. Pool too large, not too small</h3>
<p><code>connectionLimit: 100</code> per pod × 30 pods = 3,000 connections; MySQL threads thrash and memory per connection adds up. More connections rarely means more throughput. Size small, scale with replicas or a proxy (RDS Proxy, ProxySQL). Serverless functions especially need a proxy.</p>

<h3>13. Reading from a replica right after writing</h3>
<p>"Booking created" → redirect → list page reads from a lagging replica → booking missing → user books again. Route the follow-up read to the primary.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is a clustered index in InnoDB, and why does the primary key choice matter so much?</div>
  <div class="qa-answer">
    <p>InnoDB stores the table as a B+tree keyed by the primary key — leaf pages hold the full rows in PK order. Every secondary index stores its columns plus the PK, and a lookup that needs other columns goes back through the clustered index. So the PK determines physical insert locality (auto-increment appends; random UUIDs scatter and split pages) and the size of every secondary index (a 36-byte PK is copied into all of them). I use a compact, monotonically increasing PK and expose a separate opaque public id if needed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Explain the left-prefix rule. Given INDEX (a, b, c), which of these use it: WHERE b = 1; WHERE a = 1 AND c = 3; WHERE a = 1 ORDER BY b; WHERE a &gt; 1 AND b = 2?</div>
  <div class="qa-answer">
    <p>A composite index is sorted by a, then b within a, then c. <code>b = 1</code> — no seek (leftmost column missing). <code>a = 1 AND c = 3</code> — seeks on a only; c can be checked inside the index via index condition pushdown but not used to narrow the seek. <code>a = 1 ORDER BY b</code> — seek on a and the rows come out ordered by b, no filesort. <code>a &gt; 1 AND b = 2</code> — range on a; b can't narrow the seek after a range. The ordering principle I use: equality columns, then sort column, then range column.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Walk me through how you'd debug a slow query in MySQL.</div>
  <div class="qa-answer">
    <p>1) Find it: slow query log or <code>performance_schema</code> / <code>sys.statements_with_runtime_in_95th_percentile</code>, or RDS Performance Insights — sort by total time, not single slowest. 2) <code>EXPLAIN</code>: check <code>type</code> (ALL/index are scans), <code>key</code> and <code>key_len</code> (which index and how many columns), <code>rows</code> vs result size, and <code>Extra</code> for filesort/temporary. 3) <code>EXPLAIN ANALYZE</code> on a replica to compare estimated vs actual rows — a big mismatch means stale stats or skew. 4) Fix in order of cheapness: make the predicate sargable, add/reshape a composite index (possibly covering), rewrite (keyset instead of OFFSET, <code>EXISTS</code> instead of <code>IN</code>), and only then caching or schema changes. 5) Verify the plan and latency after, and check write cost of the new index.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What is InnoDB's default isolation level and what does it actually guarantee?</div>
  <div class="qa-answer">
    <p>REPEATABLE READ. Plain SELECTs read a consistent snapshot taken at the first read in the transaction, via MVCC (undo log), without locks — so re-reads are stable and phantoms don't appear for snapshot reads. Locking reads and writes (<code>FOR UPDATE</code>, <code>UPDATE</code>, <code>DELETE</code>) read the latest committed data and take next-key locks (record + gap), which prevents phantom inserts into scanned ranges. What it does <em>not</em> prevent is write skew from check-then-act with plain reads — two transactions both see "no conflicting booking" in their snapshots and both insert. That needs a lock or a constraint.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What are gap locks and next-key locks, and how do they cause deadlocks?</div>
  <div class="qa-answer">
    <p>A gap lock locks the space between index records so nobody can insert there; a next-key lock is a record lock plus the gap before it. InnoDB uses them in REPEATABLE READ for locking reads and range updates. Gap locks are compatible with each other — two transactions can both hold a gap lock on the same empty range. If both then INSERT into it, each insert-intention lock waits for the other's gap lock → deadlock; InnoDB detects it and rolls one back with 1213. Mitigations: lock a parent row instead of a range, use READ COMMITTED (gap locking mostly off) where phantoms are acceptable, keep transactions short, access rows in a consistent order, and always retry 1213.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Write a query: top 2 highest-paid employees per department, including ties.</div>
  <div class="qa-answer">
    <pre><code class="language-sql">SELECT dept_id, name, salary FROM (
  SELECT dept_id, name, salary,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS r
  FROM employees
) t
WHERE r &lt;= 2
ORDER BY dept_id, salary DESC;</code></pre>
    <p>"Including ties" → <code>DENSE_RANK</code> (or <code>RANK</code> if they want competition semantics); "exactly 2" → <code>ROW_NUMBER</code> with a deterministic tie-breaker. The window can't go in <code>WHERE</code> because windows are computed after WHERE, hence the derived table — MySQL has no <code>QUALIFY</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Why is OFFSET pagination slow and what do you use instead?</div>
  <div class="qa-answer">
    <p><code>LIMIT 20 OFFSET 100000</code> still walks 100,020 index entries (and possibly fetches the rows) and discards most; cost grows linearly with page depth, and rows shift between pages when data changes. Keyset pagination remembers the last row's sort key and id and asks for <code>WHERE (sort, id) &lt; (last_sort, last_id) ORDER BY sort DESC, id DESC LIMIT 20</code>, backed by an index on the sort columns — constant cost per page and stable for infinite scroll. Trade-off: no random page jumps, and the cursor must include a unique tie-breaker.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you add a column or index to a 200M-row table without downtime?</div>
  <div class="qa-answer">
    <p>First check what the operation needs: adding a nullable column can be <code>ALGORITHM=INSTANT</code> in 8.0; adding an index is <code>INPLACE, LOCK=NONE</code> but heavy I/O and can lag replicas; a column type change is a COPY → use gh-ost or pt-online-schema-change, which build a shadow table, backfill with throttling on replica lag, and cut over atomically. Always state <code>ALGORITHM</code>/<code>LOCK</code> so it fails instead of silently blocking, set a low <code>lock_wait_timeout</code> to avoid the metadata-lock pile-up, and make app changes expand/contract: add, dual-write, backfill in batches, switch reads, drop later.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Users report "I created a booking and it disappeared, then it came back." What's going on?</div>
  <div class="qa-answer">
    <p>Classic read-your-writes violation from replica lag: the write went to the primary, the next read hit an async replica that hadn't applied it yet. Confirm by checking whether reads are routed to replicas and correlating with replica lag metrics at that time. Fixes: route reads to the primary for a short window after a user's write (session stickiness), read from primary on the post-write screen, or wait for the replica to have the write's GTID. Also look at why lag spiked — usually a big batch job or a single huge transaction.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. MySQL or Postgres for a new service — and when would you pick MongoDB instead?</div>
  <div class="qa-answer">
    <p>For a new service I lean Postgres (transactional DDL, partial indexes, JSONB, pgvector), but MySQL is a perfectly good choice and I'd follow the team's operational expertise — running a database well matters more than its feature list. Differences that change my design: InnoDB clusters by PK, defaults to REPEATABLE READ with gap locks, and DDL isn't transactional. I'd pick a document store like <a href="#/topic/be-mongodb">MongoDB</a> only when the data is naturally aggregate-shaped (read and written as one document), the schema varies per record, and I don't need multi-entity joins or strong cross-row constraints on the hot path.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. (FDE scenario) A customer says "your integration made our MySQL slow — the whole app freezes every night at 2 a.m." What do you do?</div>
  <div class="qa-answer">
    <p>Stay calm and get data before theories. 1) Ask for read-only visibility: slow query log / Performance Insights around 2 a.m., <code>SHOW PROCESSLIST</code> or <code>sys.processlist</code> during the window, replica lag graphs. 2) Our sync job is the prime suspect: likely a big <code>SELECT … WHERE updated_at &gt; ?</code> without an index (full scan evicting the buffer pool), OFFSET pagination getting slower each page, or one huge transaction holding locks / MDL. 3) Mitigate on our side first — no schema changes on their DB without approval: run against a read replica, page with keyset on <code>(updated_at, id)</code>, small batches with sleeps, short transactions, a query timeout (<code>MAX_EXECUTION_TIME</code> hint), and back off when lag rises. 4) If an index would fix it, propose it with the EXPLAIN before/after and its write cost, and let their DBA schedule it. 5) Write up the root cause and add monitoring so we see it before they do.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How does replication work, and what happens to the last transactions on failover?</div>
  <div class="qa-answer">
    <p>The primary writes committed changes to the binary log (row format); each replica's receiver thread copies events to its relay log and applier threads replay them. With async replication the primary doesn't wait, so on a crash any events not yet received by the promoted replica are lost. Semi-sync narrows that window by waiting until at least one replica has received the event (not applied). GTIDs make re-pointing replicas after failover safe. Managed services (RDS Multi-AZ, Aurora) use synchronous/storage-level replication for the standby — check current docs for the exact guarantees of the offering you're on.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you write a running total, a 7-day moving average and a longest-consecutive-streak query in MySQL?</div>
  <div class="qa-answer">
    <p><strong>Running total:</strong> <code>SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)</code>. The explicit <code>ROWS</code> frame plus the <code>id</code> tie-breaker matters, because the default <code>RANGE</code> frame treats rows with equal ORDER BY values as one and gives them the same total. <strong>7-day moving average:</strong> <code>AVG(n) OVER (ORDER BY d ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)</code>, but first LEFT JOIN a recursive-CTE calendar and <code>COALESCE</code> missing days to 0; otherwise "7 rows" is not "7 days". <strong>Gaps and islands:</strong> take distinct (user, date), compute <code>login_date - ROW_NUMBER()</code> per user; that value is constant within a consecutive run, so GROUP BY it, COUNT the run length, and take the MAX per user. For ranking, <code>ROW_NUMBER</code> gives exactly N, <code>RANK</code> gives ties with gaps, and <code>DENSE_RANK</code> gives the Nth distinct value.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q14. What happens on a secondary-index lookup in InnoDB, and what makes an index covering?</div>
  <div class="qa-answer">
    <p>A secondary index is its own B+tree whose leaves hold the indexed columns plus the primary key. A lookup descends it to find the PK (step 1), then descends the clustered PRIMARY tree to fetch the full row (step 2, the "bookmark lookup"). If every column the query needs (WHERE, ORDER BY and SELECT list) is in the secondary index, step 2 is skipped: that is a <strong>covering index</strong>, shown in EXPLAIN as <code>Extra: Using index</code>. This is why <code>SELECT *</code> prevents covering, and why for many rows the per-row second lookup can be slower than a full scan, so the optimizer sometimes ignores your index.</p>
  </div>
</div>
` },

  ]
});
