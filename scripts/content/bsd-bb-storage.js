window.PREP_SITE.registerTopic({
  id: "bsd-bb-storage",
  module: 'backend-sd',
  title: "Storage Engines & Picking a Database",
  estimatedReadTime: "50 min",
  tags: ["system-design","storage-engine","b-tree","lsm-tree","compaction","amplification","wal","indexes","column-store","database-selection","interview"],
  sections: [

// ----------------------------------------
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>A storage engine is the part of a database that decides how bytes sit on disk. B-trees update sorted pages in place (fast, predictable reads; random writes). LSM-trees buffer writes in memory, flush them as immutable sorted files and merge them later (cheap sequential writes; reads and compaction pay). Row stores suit "fetch this record"; column stores suit "aggregate these columns over billions of rows". Pick the database from the access pattern, not the brand.</strong></div>
  <h4>Key points</h4>
  <ul>
    <li><strong>B-tree / B+tree</strong> (Postgres, MySQL InnoDB, SQL Server, Oracle, SQLite, MongoDB WiredTiger, etcd's bbolt): fixed-size pages (8 KB in Postgres, 16 KB default in InnoDB), fanout of hundreds, so 3-4 levels cover billions of keys. A point read is ~1 disk read for the index once the upper levels are cached, plus 1 heap/PK lookup unless the scan is index-only or the table is clustered.</li>
    <li><strong>LSM-tree</strong> (RocksDB, LevelDB, Cassandra, ScyllaDB, HBase, Bigtable; CockroachDB's Pebble, TiKV, YugabyteDB on top): write = append to WAL + insert into an in-memory <strong>memtable</strong>; full memtables flush to immutable sorted <strong>SSTables</strong>; background <strong>compaction</strong> merges them and drops overwritten values and tombstones.</li>
    <li><strong>Three amplifications</strong> (you can minimise two, never all three): <strong>write amp</strong> (bytes written to disk ÷ bytes the app wrote), <strong>read amp</strong> (disk reads per lookup), <strong>space amp</strong> (disk used ÷ live data). Leveled compaction: low read and space amp, high write amp (often ~10-30×). Size-tiered: lower write amp, higher read and space amp (≥2× transiently during a big compaction; several × for overwrite-heavy data, since stale versions sit in different tiers).</li>
    <li><strong>Bloom filters</strong> per SSTable let an LSM skip files that cannot contain the key (~10 bits/key ≈ 1% false positives). They help point reads, <em>not</em> range scans.</li>
    <li><strong>WAL</strong> = durability: append the change and fsync before acking, apply to pages later. Costs: fsync latency on every commit (group commit amortises it) and extra bytes (Postgres writes whole page images on the first change after a checkpoint).</li>
    <li><strong>Every index is a second write.</strong> An insert into a table with 5 indexes is ~6 structure updates plus WAL. A <strong>covering index</strong> (Postgres INCLUDE, v11+) serves a query without touching the table, at the cost of a bigger index and slower writes.</li>
    <li><strong>Row vs column:</strong> row stores keep a record's fields together (OLTP). Column stores (ClickHouse, BigQuery, Redshift, Snowflake, Parquet files, DuckDB) keep each column together: read only the columns a query needs, compress them well, scan with vectorised CPU loops. Cassandra/HBase are "wide-column", which is <em>not</em> a column store.</li>
    <li><strong>Picking a database:</strong> relational by default; then name the access pattern that justifies anything else: KV for key lookups at huge scale, wide-column for write-heavy partitioned data, document for self-contained aggregates, search for text and facets, time-series for timestamped metrics, graph for multi-hop traversals, object storage for blobs.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Saying "LSM is faster" or "Cassandra because it scales". LSM is faster for <em>writes</em>, and only while compaction keeps up; its reads, range scans and deletes (tombstones) cost more, and it needs disk headroom. The deep follow-ups are: "what happens when compaction falls behind?", "how is a delete stored?", "what does each index cost on write?". Second trap: calling Cassandra a column store.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The write path here is ~100K small appends a second and reads are mostly 'latest N for this key', so I'd batch it through Kafka into an LSM or time-series store partitioned by device and time. Per-row commits on a B-tree primary would be fsync-bound; even batched, ~860 GB a day of row and index growth, with random index I/O once the index outgrows RAM, rules out plain Postgres tables."</div>
  <div class="revision-say">"I'll start on Postgres because I need transactions and ad-hoc queries; I'd move a specific access pattern out only when I can name it: search to Elasticsearch via CDC, analytics to a column store, blobs to S3."</div>
  <div class="revision-say">"Before I add this index I'll weigh it: it speeds up this one read but adds a write to every insert and update, and it can block Postgres HOT updates on that column."</div>
</div>
` },

// ----------------------------------------
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What a storage engine is</h3>
<p>A database has two halves. The top half parses SQL (or an API call), plans the query and manages transactions. The bottom half, the <strong>storage engine</strong>, answers three questions: where on disk does this record live, how do I find it again, and how do I change it without losing it if the power goes out? MySQL makes the split visible (InnoDB, MyRocks and MyISAM are pluggable engines under the same SQL layer); MongoDB swapped MMAPv1 for WiredTiger (default since 3.2); CockroachDB replaced RocksDB with Pebble (default since v20.2).</p>
<p>There are really only two families for general-purpose data:</p>
<ul>
  <li><strong>Update-in-place (B-tree):</strong> the data has one home on disk, kept sorted in pages; a change overwrites the page that holds the key.</li>
  <li><strong>Append-and-merge (log-structured, LSM):</strong> nothing is overwritten; every change is appended, and a background process merges old and new versions later.</li>
</ul>
<p>On top of that sits a second axis, <strong>layout</strong>: keep a whole row together (row store) or keep each column together (column store).</p>

<h3>Why a backend system designer needs this</h3>
<p>You do not implement storage engines in an interview. You need them because they explain the numbers and failure modes of every database you will draw:</p>
<ul>
  <li>why a single Postgres primary plans around ~5K simple writes/s with a ceiling near ~20K (commit + fsync, random page writes, every index updated: see <a href="#/topic/bsd-estimation">Estimation</a>), while a Cassandra node takes ~10K-50K writes/s;</li>
  <li>why the same Cassandra cluster can suddenly have terrible read latency (compaction backlog, tombstones);</li>
  <li>why "SELECT SUM(amount) GROUP BY country" over a billion rows takes minutes on Postgres and seconds on ClickHouse;</li>
  <li>why adding "just one more index" slowed every write;</li>
  <li>why random UUIDs as a MySQL primary key make inserts slower as the table grows.</li>
</ul>
<p>The deep interviewer's "why that database?" is really "which engine and layout, for which access pattern, and what does it cost?". This topic gives you the mechanism behind that answer. Index basics, isolation levels and schema design live in <a href="#/topic/be-databases">Databases</a>; how data is split and copied across machines lives in <a href="#/topic/bsd-bb-partitioning">Partitioning</a> and <a href="#/topic/bsd-bb-replication">Replication</a>.</p>

<h3>B-tree vs LSM at a glance</h3>
<table>
  <thead><tr><th></th><th>B-tree (update in place)</th><th>LSM-tree (append + compact)</th></tr></thead>
  <tbody>
    <tr><td>Write path</td><td>WAL append, then modify the page in the buffer pool; dirty pages written back later (random I/O)</td><td>WAL append + memtable insert; flushes and compaction are sequential I/O</td></tr>
    <tr><td>Point read</td><td>Walk 3-4 levels; upper levels cached, ~1 disk read for the index, plus 1 heap/PK lookup unless index-only or clustered</td><td>Memtable, then SSTables newest to oldest; Bloom filters skip most; ~1 disk read if filters are healthy</td></tr>
    <tr><td>Range scan</td><td>Excellent: leaves are sorted and linked</td><td>Good but merges an iterator per level/file; Bloom filters do not help</td></tr>
    <tr><td>Write amplification</td><td>A 100 B change dirties an 8-16 KB page (plus WAL, plus full-page images after checkpoints)</td><td>Each byte is rewritten once per compaction level it moves through (often ~10-30× in leveled)</td></tr>
    <tr><td>Space</td><td>Pages 50-100% full (splits, fragmentation); MVCC bloat in Postgres until VACUUM</td><td>Compresses well (immutable sorted blocks); obsolete versions take space until compacted</td></tr>
    <tr><td>Deletes</td><td>Remove from the page (Postgres: mark dead, VACUUM reclaims)</td><td>Write a tombstone; space is reclaimed only when compaction reaches the oldest copy</td></tr>
    <tr><td>Latency profile</td><td>Predictable</td><td>Spikes when compaction competes for I/O or falls behind (write stalls)</td></tr>
    <tr><td>Transactions / locking</td><td>Mature: row locks, MVCC, constraints</td><td>Possible (RocksDB transactions, CockroachDB, TiKV) but usually built on top</td></tr>
    <tr><td>Real systems</td><td>Postgres, MySQL InnoDB, SQL Server, Oracle, SQLite, MongoDB (WiredTiger), LMDB, bbolt (etcd)</td><td>RocksDB, LevelDB, Cassandra, ScyllaDB, HBase, Bigtable, Pebble (CockroachDB), TiKV, YugabyteDB, InfluxDB's TSM (LSM-like)</td></tr>
    <tr><td>Pick when</td><td>Read-heavy or mixed OLTP, range queries, transactions, predictable latency</td><td>Write-heavy, append-mostly, huge data per node, cheap storage, SSD-friendly sequential writes</td></tr>
  </tbody>
</table>
<div class="callout insight"><div class="callout-title">The one-sentence intuition</div>
<p>A B-tree pays at write time to keep data perfectly sorted in one place; an LSM-tree defers that work and pays it later, in the background, in bulk. Deferred work is cheaper per byte (sequential, batched), but it is still work: if the write rate exceeds what compaction can absorb, the bill arrives as read latency, disk usage and eventually write stalls.</p></div>
` },

// ----------------------------------------
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Intuition: the filing cabinet vs the inbox tray</h3>
<p><strong>B-tree = a filing cabinet.</strong> Every document has exactly one folder, and folders are in alphabetical order. To file a new page you walk to the right drawer and slot it in. If the folder is full, you split it into two folders (a page split). Finding something is always fast, because it is always in its one place. Filing is slower, because you walk to a different drawer for every page (random I/O).</p>
<p><strong>LSM = an inbox tray plus a nightly sort.</strong> New pages go on top of the tray instantly (the memtable). When the tray is full you sort it once and put it in a box (an SSTable flush). Over time you have many sorted boxes; periodically you merge several boxes into one bigger sorted box and throw away superseded copies (compaction). Filing is instant. Finding something means checking the tray, then the boxes from newest to oldest, unless a sticky note on each box says "definitely not here" (a Bloom filter).</p>

<h3>B+tree: how 4 levels hold a billion keys</h3>
<div class="diagram"><pre>
                        ┌───────────────────┐
  level 1 (root)        │ [ ... | M | ... ] │  1 page, always cached
                        └─────────┬─────────┘
               ┌──────────────────┼──────────────────┐
         ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
  level 2│ A..F      │ ...  │ G..M      │ ...  │ N..Z      │ ~tens
         └─────┬─────┘      └─────┬─────┘      └───────────┘
               │                  │      (fanout ~hundreds)
  level 3  internal pages ~thousands, still fit in RAM
               │
  level 4 ┌────▼────┐   ┌─────────┐   ┌─────────┐
  (leaves)│k1 k2 k3 │──►│k4 k5 k6 │──►│k7 k8 k9 │──► sorted, linked
          └─────────┘   └─────────┘   └─────────┘
  Point read: 3 cached hops + 1 disk read. Range scan: find
  the start leaf, then follow the sibling links.
</pre></div>

<h3>LSM-tree: write path and read path</h3>
<div class="diagram"><pre>
  WRITE (put k=v)                        READ (get k)
     │                                      │
     ├─► 1. append to WAL (fsync policy)    │
     ▼                                      ▼
  ┌──────────────┐  full? freeze      check memtable(s)
  │  MEMTABLE    │──────────┐               │ miss
  │ (sorted, RAM)│          ▼               ▼
  └──────────────┘   ┌──────────────┐  L0: every file whose
                     │ immutable    │  key range covers k
                     │ memtable     │  (L0 files overlap)
                     └──────┬───────┘       │ miss
                     2. flush (sequential)  ▼
  disk ─────────────────────▼──────── L1..Ln: at most ONE file
  L0   [sst][sst][sst]  overlapping     per level; Bloom filter
  L1   [sst|sst|sst|sst]  ~256 MB       says "no" for ~99% of
  L2   [ ~10x L1 ......]  ~2.5 GB       files that lack k
  L3   [ ~10x L2 ...............]       │
       3. compaction merges down,       ▼
          drops old versions        first hit wins (newest)
</pre></div>
<p>Two rules make the read path correct: <strong>newer data shadows older data</strong> (search newest first, stop at the first hit), and <strong>a delete is just a newer record that says "deleted"</strong> (a tombstone). The tombstone must survive until compaction has merged it with every older copy of the key, or the old value would reappear.</p>

<h3>Row store vs column store</h3>
<div class="diagram"><pre>
  Table: orders(id, user, country, amount, status, ... 50 cols)

  ROW STORE (Postgres heap page)
  [ 1 | u7 | IN | 250 | paid | ... ][ 2 | u9 | US | 90 | ... ]
   one record together: great for "get order 2"

  COLUMN STORE (ClickHouse / Parquet)
  id:      [ 1 | 2 | 3 | 4 | ... ]
  country: [ IN | US | IN | IN | ... ]  RLE/dict -> tiny
  amount:  [ 250 | 90 | 40 | 12 | ...]  delta/zstd
  SUM(amount) BY country reads 2 of 50 columns, compressed
</pre></div>

<h3>The trade-off space in one picture: RUM</h3>
<p>The <strong>RUM conjecture</strong> (Read, Update, Memory overhead) says an access method can be optimal for at most two of the three. B-trees are tuned for reads and acceptable space, paying on updates. Size-tiered LSM is tuned for updates, paying in reads and space. Leveled LSM sits between. Whenever someone says an engine is "faster", ask: faster at which of the three, and paid for by which other?</p>
` },

// ----------------------------------------
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. The B-tree in detail</h3>
<ul>
  <li><strong>Pages.</strong> Everything is a fixed-size page: 8 KB in Postgres, 16 KB by default in InnoDB (configurable at creation), 4 KB in SQLite by default. Internal pages hold keys and child pointers; leaf pages hold keys plus either the row (clustered) or a pointer to it. B+trees link the leaves for range scans.</li>
  <li><strong>Fanout.</strong> An 8 KB page with ~20-byte entries holds a few hundred children. With fanout ~400: 400³ ≈ 64M, 400⁴ ≈ 25.6B. So 4 levels cover a billion keys, and the top 3 levels are small enough to stay in memory.</li>
  <li><strong>Insert.</strong> Find the leaf, insert in sorted position. If the page is full, <strong>split</strong> it in two and push a separator key into the parent (which may split too; the tree grows at the root). Splits leave pages ~50% full, so random-order inserts give ~65-75% average fill; sequential inserts (right-most leaf) pack pages almost full.</li>
  <li><strong>Buffer pool.</strong> Pages are read into a memory cache (Postgres <code>shared_buffers</code> + OS page cache; InnoDB buffer pool). Changes dirty the cached page; a background writer and the checkpointer flush them later. That is why a B-tree's "write" is cheap at commit time and expensive later as random writes.</li>
  <li><strong>Clustered vs heap.</strong> InnoDB stores the row <em>inside</em> the primary-key B-tree (clustered); secondary indexes store the primary key, so a secondary lookup is two tree walks. Postgres stores rows in an unordered <strong>heap</strong>; every index (including the primary key) points at a tuple location (ctid). Consequence: in InnoDB the primary-key order is the physical order, so a random key (UUIDv4) scatters inserts across the whole tree.</li>
</ul>

<h3>2. Crash safety: the WAL and its costs</h3>
<p>A page write is not atomic: the power can fail halfway through an 8 KB write (a <strong>torn page</strong>). Every engine therefore uses a <strong>write-ahead log</strong>:</p>
<ol>
  <li>Append a description of the change to the WAL (sequential).</li>
  <li><strong>fsync the WAL</strong> before telling the client "committed".</li>
  <li>Modify the page in memory; write it to its home location whenever convenient.</li>
  <li>On crash, replay the WAL from the last checkpoint.</li>
</ol>
<p>What it costs, and the knobs:</p>
<table>
  <thead><tr><th>Cost</th><th>Why</th><th>Mitigation / knob</th></tr></thead>
  <tbody>
    <tr><td>fsync per commit</td><td>Durable storage latency: tens of µs on enterprise NVMe with power-loss protection, up to ms on consumer drives and cloud network volumes</td><td><strong>Group commit</strong>: many transactions share one fsync. Batching writes into fewer transactions.</td></tr>
    <tr><td>Bytes written twice</td><td>Once to WAL, once to the page</td><td>Inherent. LSMs reuse the WAL-then-flush pattern too.</td></tr>
    <tr><td>Torn-page protection</td><td>Postgres <code>full_page_writes</code>: first change to a page after each checkpoint logs the whole 8 KB page. InnoDB uses a <strong>doublewrite buffer</strong> instead.</td><td>Longer checkpoint intervals mean fewer full-page images but longer crash recovery.</td></tr>
    <tr><td>Relaxed durability</td><td>Postgres <code>synchronous_commit = off</code> acks before the fsync</td><td>No corruption, but a crash can lose the last few hundred ms of acked commits (up to ~3 × <code>wal_writer_delay</code>, default 200 ms). Fine for clickstream, not for payments.</td></tr>
  </tbody>
</table>
<p>The same WAL is what <a href="#/topic/bsd-bb-replication">replication</a> ships to followers and what CDC tools (Debezium) read to stream changes into <a href="#/topic/be-kafka">Kafka</a>.</p>

<h3>3. MVCC: why Postgres updates are really inserts</h3>
<p>Postgres implements MVCC by writing a <strong>new tuple version</strong> on every UPDATE and marking the old one dead once no transaction can see it. VACUUM later reclaims dead tuples. Consequences:</p>
<ul>
  <li>An update to a row with 5 indexes normally inserts a new entry into <em>all 5</em> indexes, because the tuple moved. <strong>HOT updates</strong> (heap-only tuples) avoid this when no indexed column changed <em>and</em> the new version fits on the same page (leave room with a lower <code>fillfactor</code>).</li>
  <li>This write amplification was one reason Uber gave in 2016 for moving a large workload from Postgres to MySQL, whose secondary indexes point at the primary key rather than a physical location.</li>
  <li>Long-running transactions stop VACUUM from removing anything newer than their snapshot: tables and indexes <strong>bloat</strong>, and scans slow down.</li>
  <li>Transaction IDs are 32-bit; autovacuum must "freeze" old rows before ~2 billion transactions pass, or the database protects itself by refusing writes (<strong>wraparound</strong>).</li>
</ul>
<p>InnoDB instead updates in place and keeps old versions in an <strong>undo log</strong>; a long transaction makes the undo history grow ("history list length") instead.</p>

<h3>4. What an index really costs</h3>
<table>
  <thead><tr><th>Index type</th><th>Read benefit</th><th>Write / space cost</th></tr></thead>
  <tbody>
    <tr><td>Secondary B-tree</td><td>Equality and range on its columns; sorted output</td><td>One more tree insert per INSERT, and per UPDATE that changes it (Postgres: per non-HOT update). Random I/O if the key is random. Space ~ key size × rows.</td></tr>
    <tr><td>Composite (a, b)</td><td>Serves WHERE a = ? AND b &gt; ?, and ORDER BY a, b</td><td>Same as above; useless for queries on b alone (leftmost-prefix rule)</td></tr>
    <tr><td>Covering (Postgres INCLUDE, v11+; or extra key columns)</td><td><strong>Index-only scan</strong>: the answer is in the index, no table visit</td><td>Bigger index, more cache pressure. In Postgres it only skips the heap for pages marked all-visible in the <strong>visibility map</strong> (kept fresh by VACUUM); on a churning table it degrades to heap fetches.</td></tr>
    <tr><td>Partial (WHERE status = 'pending')</td><td>Small, hot index for a hot subset</td><td>Only maintained for matching rows: cheap. Query must repeat the predicate.</td></tr>
    <tr><td>GIN / inverted (JSONB, arrays, full-text)</td><td>Containment and text search</td><td>Expensive to update (many entries per row); Postgres buffers them with fastupdate (pending list)</td></tr>
    <tr><td>LSM secondary index (Cassandra 5.0 SAI, RocksDB-based SQL)</td><td>Query by non-key column</td><td>SAI is local, per SSTable: extra local writes but no distributed write; the cost is scatter-gather reads across nodes. A <em>global</em> index (e.g. DynamoDB GSI) is the one that adds a distributed write (see <a href="#/topic/bsd-bb-partitioning">Partitioning</a>)</td></tr>
  </tbody>
</table>
<p>Rule of thumb: each B-tree index adds roughly one more random write per row write. A table with 8 indexes can write several times more to its indexes than to the table itself. Drop indexes that <code>pg_stat_user_indexes</code> shows are never scanned, with three caveats: unique and primary-key indexes enforce constraints even at idx_scan = 0; stats are per node, so an index used only by replica queries shows 0 on the primary; and a stats reset hides history.</p>

<h3>5. The LSM-tree in detail</h3>
<ol>
  <li><strong>WAL + memtable.</strong> A put appends to the WAL and inserts into the memtable (RocksDB defaults to a skiplist). Writes are memory-speed; durability depends on the WAL sync policy (Cassandra's commitlog defaults to periodic sync every 10 s, so an acked write relies on replicas, not one node's fsync).</li>
  <li><strong>Flush.</strong> When the memtable reaches its size (e.g. RocksDB <code>write_buffer_size</code>, 64 MB default) it becomes immutable and is written out as a sorted, immutable <strong>SSTable</strong>: data blocks, a block index, a Bloom filter, and usually compression per block.</li>
  <li><strong>Compaction</strong> merges SSTables (a merge sort of sorted runs), keeps the newest version of each key, drops versions shadowed by newer ones, and drops tombstones once nothing older remains (and, in Cassandra, after <code>gc_grace_seconds</code>, default 10 days).</li>
  <li><strong>Reads</strong> consult memtables, then L0 files (which may overlap each other), then at most one file per lower level, using each file's Bloom filter and block index to avoid disk reads.</li>
</ol>

<h3>6. Compaction strategies and the three amplifications</h3>
<table>
  <thead><tr><th>Strategy</th><th>How it works</th><th>Write amp</th><th>Read amp</th><th>Space amp</th><th>Used by / pick when</th></tr></thead>
  <tbody>
    <tr><td><strong>Leveled</strong> (LCS)</td><td>Each level ~10× the previous; within a level files do not overlap; a file is merged into the overlapping files of the next level</td><td>High: often ~10-30×</td><td>Low: ~1 file per level</td><td>Low: ~1.1× with dynamic (bottom-up) level sizing; can approach 2× with static sizing</td><td>RocksDB default, LevelDB, Cassandra LCS. Read-heavy or update-heavy with bounded disk.</td></tr>
    <tr><td><strong>Size-tiered</strong> (STCS)</td><td>Merge several similar-sized SSTables into one bigger one</td><td>Low: ~ number of tiers</td><td>Higher: a key may be in many files</td><td>High: ≥2× transiently during a big compaction; several × for overwrite-heavy data (stale versions sit in different tiers)</td><td>Cassandra's long-standing default. Write-heavy, insert-mostly.</td></tr>
    <tr><td><strong>Time-window</strong> (TWCS)</td><td>Group SSTables by time bucket; never merge across windows; drop whole files when TTL expires</td><td>Low</td><td>Low for recent-time queries</td><td>Low if everything has a TTL</td><td>Cassandra/Scylla for time-series with TTL. Breaks if you update or delete old data.</td></tr>
    <tr><td><strong>Unified</strong> (UCS)</td><td>Tunable per level between tiered and leveled behaviour</td><td colspan="3">Configurable</td><td>Added in Cassandra 5.0; recommended for new tables there</td></tr>
  </tbody>
</table>
<p><strong>Where "10-30×" comes from.</strong> With static level sizing (L1 target 256 MB, each level 10× bigger), 1 TB of data needs levels L1 (256 MB) through L5 (~2.5 TB capacity). Moving a byte from level n to n+1 rewrites it together with up to ~10 bytes of overlapping data in n+1, so each move costs ~fanout + 1 ≈ 11. Four moves from L1 to L5 give a rough worst-case estimate of 1 (WAL) + 1 (flush) + 11 × 4 ≈ 46×. RocksDB 8.4+ defaults to <code>level_compaction_dynamic_level_bytes = true</code>, which sizes levels bottom-up from the real data size (1 TB, 100 GB, 10 GB, 1 GB), so data passes through about three moves: 1 + 1 + 11 × 3 ≈ 35×. It is also what keeps leveled space amp near ~1.1×. Real workloads usually measure lower, commonly 10-30×, because overlaps are partial.</p>
<p><strong>Read amp with Bloom filters.</strong> A point lookup for a key in the last level might consider 4 L0 files + 5 levels = 9 candidate SSTables. At a 1% false-positive rate the 8 "wrong" files cost 8 × 0.01 = 0.08 extra disk reads on average, so the lookup costs ~1.1 disk reads (the real one plus the occasional false positive), provided filters and index blocks stay in memory. A key that does not exist costs ~0.09 disk reads. Without Bloom filters, the same lookup is up to 9.</p>

<h3>7. When LSM writes stall</h3>
<p>Compaction is a background job with finite disk bandwidth. If sustained writes exceed what compaction can merge:</p>
<ul>
  <li>L0 file count rises; every read checks more files (read amp up, p99 up).</li>
  <li>Pending compaction bytes grow; disk usage grows (space amp up).</li>
  <li>The engine <strong>throttles</strong> then <strong>stops</strong> writes at configurable L0-count and pending-bytes thresholds (RocksDB write stalls; Cassandra shows rising pending compactions and dropped mutations).</li>
</ul>
<p>So an LSM's sustainable write rate is set by compaction throughput, not by how fast the memtable accepts writes. Benchmarks that run for 5 minutes measure the memtable; run them for hours.</p>

<h3>8. Column stores</h3>
<ul>
  <li><strong>Layout:</strong> each column stored separately in large blocks (Parquet row groups and column chunks, ClickHouse parts with one file per column).</li>
  <li><strong>Compression:</strong> a column holds one type with repetitive values: dictionary, run-length, delta and bit-packing, then a general codec (zstd/LZ4). Several × to 10×+ is common versus row storage, highly data-dependent.</li>
  <li><strong>Execution:</strong> vectorised loops over arrays of one type (SIMD), late materialisation of rows, min/max statistics per block to skip blocks (zone maps / data skipping).</li>
  <li><strong>Writes:</strong> point updates are expensive (a row touches every column file). Column stores ingest in batches; ClickHouse writes immutable "parts" and merges them in the background (its MergeTree is LSM-like), Redshift and Snowflake want bulk loads, deletes are often mutations or tombstone markers.</li>
  <li><strong>Real systems:</strong> ClickHouse, Druid, Pinot (real-time analytics), BigQuery, Redshift, Snowflake (warehouses), Parquet/ORC files on S3 queried by Athena, Trino, Spark or DuckDB.</li>
</ul>
<p>The usual architecture: OLTP rows in Postgres/MySQL, changes streamed by CDC (or nightly batch) into a column store for analytics. "HTAP" systems (TiDB with TiFlash, SingleStore, AlloyDB's columnar engine) keep both layouts of the same data.</p>

<h3>9. Hash-indexed and in-memory engines</h3>
<p><strong>Bitcask</strong> (Riak) keeps an append-only log plus an in-memory hash map of key to offset: one seek per read, no range scans, all keys in RAM. <strong>Redis</strong> keeps everything in RAM and persists by RDB snapshots and/or an append-only file (default appendfsync everysec). When the working set fits in memory, disk layout matters mostly for recovery time. See <a href="#/topic/be-caching">Caching</a>.</p>

<h3>10. Picking a database: the decision guide</h3>
<p>Start from the access patterns you wrote down in the API step of <a href="#/topic/bsd-framework">the framework</a>, then walk this table. The default is relational; each other row needs a named reason.</p>
<table>
  <thead><tr><th>Family</th><th>Data shape and access pattern</th><th>Engine underneath</th><th>Real systems</th><th>Pick when</th><th>Avoid when</th></tr></thead>
  <tbody>
    <tr><td><strong>Relational</strong></td><td>Entities with relationships; joins, ad-hoc queries, constraints, multi-row transactions</td><td>B-tree, row store, WAL</td><td>Postgres, MySQL, SQL Server, Aurora; distributed SQL: Spanner, CockroachDB, YugabyteDB, TiDB (all LSM + Raft underneath; CockroachDB on Pebble)</td><td>Default. Money, inventory, bookings, users, anything with invariants</td><td>Sustained writes far beyond one primary with no good shard key; petabyte analytics</td></tr>
    <tr><td><strong>Key-value</strong></td><td>Get/put by key, little or no querying by value</td><td>Hash or LSM; in-memory</td><td>DynamoDB, Redis, Memcached, RocksDB (embedded), etcd (for small config/coordination data)</td><td>Sessions, carts, idempotency keys, feature flags, huge-scale lookups with known keys</td><td>You will need ad-hoc filters or joins later</td></tr>
    <tr><td><strong>Document</strong></td><td>Self-contained aggregates read and written whole (a profile, an order with line items)</td><td>B-tree (WiredTiger)</td><td>MongoDB, Firestore, Couchbase, Postgres JSONB</td><td>Variable schema per record, nested data read together, mobile sync (Firestore)</td><td>Heavy cross-document relationships and joins; MongoDB doc limit is 16 MB</td></tr>
    <tr><td><strong>Wide-column</strong></td><td>Huge partitioned tables; query by partition key, sorted by clustering key</td><td>LSM</td><td>Cassandra, ScyllaDB, HBase, Bigtable</td><td>Write-heavy, append-mostly: messages, events, feeds, IoT; multi-DC writes</td><td>Ad-hoc queries, secondary-key lookups, transactions, delete-heavy or queue-like tables</td></tr>
    <tr><td><strong>Search</strong></td><td>Full-text relevance, fuzzy match, facets, aggregations over text</td><td>Inverted index in immutable segments, merged in background (LSM-like)</td><td>Elasticsearch, OpenSearch, Solr (Lucene), Typesense, Meilisearch</td><td>Product search, log search, autocomplete with typo tolerance</td><td>As the system of record; it is near-real-time (refresh ~1 s by default) and not transactional</td></tr>
    <tr><td><strong>Time-series</strong></td><td>Timestamped points, append-only, queried by time range and downsampled</td><td>Time-partitioned chunks, columnar compression (Gorilla-style deltas)</td><td>Prometheus, InfluxDB, TimescaleDB (Postgres extension), VictoriaMetrics, Druid</td><td>Metrics, telemetry, IoT, monitoring with retention policies</td><td>High-cardinality labels in Prometheus-style stores (each label combo is a new series)</td></tr>
    <tr><td><strong>Graph</strong></td><td>Many-hop traversals over relationships</td><td>Adjacency stored with each node (index-free adjacency in Neo4j)</td><td>Neo4j, Amazon Neptune, JanusGraph</td><td>Fraud rings, recommendations, permission graphs, "friends of friends of friends"</td><td>One or two hops (a join or adjacency table in Postgres is fine)</td></tr>
    <tr><td><strong>Column / analytical</strong></td><td>Aggregates over billions of rows, few columns per query</td><td>Column store</td><td>ClickHouse, BigQuery, Redshift, Snowflake, Druid, Pinot, DuckDB</td><td>Dashboards, reporting, product analytics</td><td>OLTP point reads and updates</td></tr>
    <tr><td><strong>Object storage</strong></td><td>Immutable blobs by key; MBs to TBs each</td><td>Distributed, erasure-coded; flat namespace</td><td>S3, GCS, Azure Blob, Cloudflare R2, MinIO</td><td>Images, video, backups, data-lake files (Parquet); serve via CDN</td><td>Small, frequently updated records; anything needing partial in-place updates</td></tr>
  </tbody>
</table>
<p>Object storage specifics worth knowing: S3 has been strongly consistent for read-after-write and list since December 2020; it is designed for 11 nines of durability; and it scales request rates per key prefix (documented at least 3,500 writes/s and 5,500 reads/s per partitioned prefix). Store the blob in object storage and its metadata (owner, size, key, status) in your database.</p>
` },

// ----------------------------------------
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: how deep is the B-tree for a billion rows?</h3>
<p><strong>Assume:</strong> an index on a 12-byte key, ~20 bytes per entry with the pointer, 8 KB pages, so fanout ~400.</p>
<pre><code class="language-text">Leaf level:    10⁹ entries × 20 B = 20 GB ÷ 8 KB  ≈ 2.5M leaf pages
Level above:   2.5M ÷ 400 ≈ 6,250 pages × 8 KB   ≈ 50 MB
Level above:   6,250 ÷ 400 ≈ 16 pages
Root:          1 page
Depth = 4.  Check: 400³ = 64M &lt; 10⁹ &lt; 400⁴ = 25.6B</code></pre>
<p><strong>Decision:</strong> the three upper levels total ~50 MB, which always fits in the buffer pool, so a point lookup is <strong>one random disk read</strong> for the index leaf (zero if cached), plus one heap or primary-key lookup unless the query is index-only or the index is clustered. The leaf level (20 GB) is what competes for RAM. That is why "does the working set fit in memory?" matters more than row count. (Real pages are 65-90% full, so expect somewhat more pages; the depth does not change.)</p>

<h3>Example 2: metrics ingestion, B-tree vs LSM vs time-series</h3>
<p><strong>Assume:</strong> 1M devices, one reading every 10 s, each reading = timestamp + device id + value.</p>
<pre><code class="language-text">Rate:          10⁶ ÷ 10 s = 100K points/s (sustained, not peak)
Per day:       100K × 86,400 ≈ 8.6 × 10⁹ points
Postgres rows: ~100 B/row incl. tuple header + index entries
               8.6 × 10⁹ × 100 B ≈ 860 GB/day
Compressed TS: ~1-2 B/point (delta-of-delta time, XOR values)
               8.6 × 10⁹ × 1.5 B ≈ 13 GB/day</code></pre>
<p><strong>Decision:</strong> as per-row commits, 100K writes/s is ~20× the ~5K/s plan number for a Postgres primary and would be fsync-bound. Batching changes that: COPY or 1,000-row inserts make it ~100 commits/s, and TimescaleDB on Postgres ingests hundreds of thousands of rows/s this way. So the ingest rate becomes reachable at all by batching, through a broker (<a href="#/topic/be-kafka">Kafka</a> or MQTT). What still rules out plain Postgres heap tables is the ~860 GB/day of row and index growth, which outgrows a node within weeks, plus random index I/O once the (device, ts) index outgrows RAM. Batch-write into a time-series store or an LSM wide-column store partitioned by (device, day) with time-window compaction and a TTL, keep raw data for days and downsampled rollups for months. The ~60× compression difference is the main reason the time-series family exists. TimescaleDB is the middle road if the team wants to stay on Postgres: time-partitioned chunks plus native columnar compression of old chunks.</p>

<h3>Example 3: analytics query, row store vs column store</h3>
<p><strong>Assume:</strong> 10⁹ order rows, ~200 B each, 50 columns. Query: revenue by country over 90 days, touching 3 columns (date, country, amount).</p>
<pre><code class="language-text">Row store scan:     10⁹ × 200 B             = 200 GB read
Column store scan:  10⁹ × 3 cols × ~8 B     =  24 GB raw
  with ~5x compression                      ≈ ~5 GB read
Ratio:              200 GB ÷ 5 GB           ≈ 40x less I/O
Plus: date min/max per block skips blocks outside 90 days</code></pre>
<p><strong>Decision:</strong> at ~2 GB/s sequential, the row scan is ~100 s of pure I/O; the column scan is a few seconds, and parallel across cores. Do not run this on the OLTP primary at all: replicate it into ClickHouse/BigQuery via CDC and point dashboards there. A read replica is a stopgap that still scans 200 GB and can delay replication (long queries conflict with replay).</p>

<h3>Example 4: the random-UUID primary key</h3>
<p>A team uses UUIDv4 as the InnoDB primary key for an events table. At 10M rows inserts are fast; at 500M they have slowed several-fold and the buffer pool hit rate dropped. Why: InnoDB clusters rows by primary key, so each random key lands on a random leaf page; once the table is bigger than the buffer pool, most inserts read a page from disk, dirty it and later write it back, and random splits leave pages ~half to three-quarters full (more pages, more I/O). Every secondary index also stores the 16-byte key. <strong>Fix:</strong> a time-ordered key (bigint sequence, UUIDv7, Snowflake-style IDs; see <a href="#/topic/bsd-bb-transactions">Transactions, Time &amp; IDs</a>) makes inserts hit the right-most leaf, which stays hot in memory. In Postgres the heap is unordered, so the table itself suffers less, but the primary-key index has the same random-insert problem.</p>

<h3>Example 5: chat messages on a wide-column store</h3>
<p>Discord stored messages in Cassandra (described publicly in 2017) and later migrated to ScyllaDB (described in 2023, trillions of messages). The data model is the textbook wide-column one:</p>
<pre><code class="language-text">PRIMARY KEY ((channel_id, bucket), message_id)
  partition key:   channel + time bucket (e.g. 10 days)
  clustering key:  message_id (Snowflake, time-ordered) DESC
Query: "latest 50 messages in channel X" = one partition,
       one sorted slice, no scatter-gather</code></pre>
<p>Why LSM fits: writes are appends, reads are "recent slice of one partition", the bucket caps partition size so one busy channel cannot grow without bound. Their pain points were textbook too: hot partitions for huge servers, and latency spikes from compaction and JVM garbage-collection pauses (one reason for moving to ScyllaDB, written in C++). See <a href="#/topic/bsd-bb-partitioning">Partitioning</a> for the hot-key side.</p>

<h3>Example 6: a meeting-room booking platform</h3>
<p><strong>Assume:</strong> 50K employees, 2 bookings each per working day, 5K room tablets polling every 30 s, an 8-hour day (~3 × 10⁴ s).</p>
<pre><code class="language-text">Bookings:   10⁵/day ÷ 3 × 10⁴ s ≈ 3 writes/s  (peak maybe 30/s at 9 am)
Polling:    5,000 ÷ 30 s         ≈ 170 reads/s
Storage:    10⁵ × 1 KB × 250 days ≈ 25 GB/year</code></pre>
<p><strong>Decision:</strong> one Postgres primary with a standby, nowhere near any engine limit. The interesting part is correctness, not storage: an exclusion constraint (or a unique index on room + slot) so two bookings cannot overlap, which a B-tree/GiST index enforces inside the transaction. Choosing Cassandra here would trade away the one thing the product needs (a hard "no double booking" invariant) to gain write capacity it will never use. Media like floor plans go to object storage (R2/S3) behind a CDN, with the key in Postgres.</p>
` },

// ----------------------------------------
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Tombstone overload in LSM stores</h3>
<p>A table used as a queue (insert, read, delete) in Cassandra accumulates tombstones in the same partition. Reads must scan past every tombstone until compaction removes them, which cannot happen before <code>gc_grace_seconds</code> (default 10 days). Cassandra warns at 1,000 tombstones scanned per query and aborts at 100,000 by default. Symptom: a query that returns 10 rows takes seconds. Fix: do not model queues in an LSM store (use <a href="#/topic/be-queues">a queue</a>), use TTLs with time-window compaction, or bucket partitions by time so old buckets are never read.</p>

<h3>Compaction needs free disk</h3>
<p>Size-tiered compaction writes the merged output before deleting the inputs; the largest compaction can temporarily need as much free space as the data it merges. Running a Cassandra node at 80% disk on STCS is a trap: the big compaction cannot run, SSTables pile up, reads slow, and the disk fills anyway. Plan ~50% headroom for STCS, less for leveled.</p>

<h3>Index-only scans that are not</h3>
<p>A Postgres covering index on a table with constant updates shows "Index Only Scan" in EXPLAIN but "Heap Fetches: 900000". The visibility map is stale, so Postgres checks the heap anyway. Tune autovacuum for that table or accept that the covering index buys little there.</p>

<h3>Long transactions and bloat</h3>
<p>An idle-in-transaction session or a multi-hour report on the primary stops VACUUM from cleaning anything newer than its snapshot. Tables and indexes grow, queries slow down, and in the extreme the database approaches transaction ID wraparound. Set <code>idle_in_transaction_session_timeout</code>, run reports elsewhere, and alert on the oldest transaction age.</p>

<h3>Cloud disks are not local NVMe</h3>
<p>Local NVMe does hundreds of thousands of random IOPS; a cloud network volume is often capped far lower (an AWS gp3 volume starts at a baseline of 3,000 IOPS and 125 MB/s unless you provision more). A B-tree workload whose working set spills out of RAM hits that cap first; an LSM's compaction can saturate the throughput cap. Check the volume's limits before blaming the engine.</p>

<h3>Range scans on LSM with many overlapping files</h3>
<p>Bloom filters do not help "all keys between A and B": the engine must open an iterator on the memtable, every overlapping L0 file and one file per level, and merge them. Range-heavy workloads want leveled compaction (fewer overlapping files) or a B-tree. RocksDB prefix Bloom filters help only when the range is a shared key prefix.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>"NoSQL because it scales"</h3>
<p>Choosing Cassandra or MongoDB for a 50-writes/s product gives up joins, constraints and transactions for capacity that is never used, and the team spends months re-implementing integrity in application code. The senior default is "Postgres unless I can name the access pattern and the number that rules it out" (<a href="#/topic/be-databases">Databases</a>).</p>

<h3>Search engine or cache as the system of record</h3>
<p>Elasticsearch can lose acknowledged writes in some failure modes historically, is not transactional, and reindexing is a normal operation. Redis without AOF loses everything since the last snapshot. Keep the source of truth in a durable database; feed the others by CDC or the <a href="#/topic/be-event-driven">outbox pattern</a>, and be able to rebuild them.</p>

<h3>An index for every column</h3>
<p>Each index slows every insert, can block HOT updates, and competes for buffer cache. Index for the queries you run, prefer one composite index over three single-column ones, and remove unused indexes.</p>

<h3>SELECT * defeats the covering index</h3>
<p>A covering index on (user_id) INCLUDE (status, total) does nothing for SELECT *: the query needs other columns, so it visits the table. Select the columns you need.</p>

<h3>Blobs in the database</h3>
<p>Images and PDFs stored as bytea/BLOB inflate backups, replication traffic and the buffer cache, and every replica carries them. Store blobs in object storage with a CDN in front; store the key and metadata in the database.</p>

<h3>Benchmarking an LSM for five minutes</h3>
<p>The first minutes measure the memtable and an empty tree. Sustained throughput shows up only after hours, when compaction reaches the deep levels and the dataset exceeds RAM. Benchmark at production data size, for hours, and watch pending compaction bytes.</p>
` },

// ----------------------------------------
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block"><div class="qa-question">1. Explain B-tree vs LSM-tree. Why are LSM writes cheaper?</div><div class="qa-answer">
<p>"A B-tree keeps data sorted in fixed-size pages and updates the page that owns the key, so a write means a WAL append now and a random page write later. An LSM-tree never overwrites: it appends to a WAL, inserts into a sorted in-memory memtable, and when that fills it writes the whole thing out sequentially as an immutable sorted file. Background compaction merges those files. Writes are cheaper because they are batched and sequential, and because a 100-byte change does not dirty an 8 or 16 KB page. The work isn't gone, it's deferred: compaction rewrites each byte several times. So LSM wins when writes dominate and compaction can keep up; B-trees win on read latency, range scans and predictability."</p>
</div></div>

<div class="qa-block"><div class="qa-question">2. Walk me through an LSM read for a key that doesn't exist. How do you stop it reading every file?</div><div class="qa-answer">
<p>"It checks the active memtable, any immutable memtables, then every L0 file whose key range covers the key, because L0 files can overlap, then at most one file per lower level, since levels below L0 are non-overlapping. Without help that's one disk read per candidate file. Each SSTable carries a <strong>Bloom filter</strong>: about 10 bits per key gives roughly a 1% false-positive rate, so for nine candidate files the expected wasted reads are about 0.09. A missing key costs almost nothing, as long as the filters and block indexes stay in memory. Bloom filters only answer 'is this exact key here?', so they don't help range scans; those merge an iterator from every level."</p>
</div></div>

<div class="qa-block"><div class="qa-question">3. What is compaction, and how do leveled and size-tiered differ?</div><div class="qa-answer">
<p>"Compaction merge-sorts SSTables, keeps the newest version of each key, and drops overwritten values and expired tombstones. <strong>Size-tiered</strong> merges a few similar-sized files into a bigger one: each byte is rewritten only about once per tier, so write amplification is low, but a key can live in many files (read amp) and a big merge needs free space for both inputs and output (space amp ≥2× transiently during a big merge, and several × for overwrite-heavy data, since stale versions sit in different tiers). <strong>Leveled</strong> keeps each level about 10× bigger than the last with non-overlapping files, so a read touches about one file per level and space overhead is ~10%, but moving data down rewrites overlapping files at each level, often 10-30× write amp. Time-window compaction is a third option for TTL'd time-series: it never merges across time windows and drops whole expired files. You choose by which amplification you can afford."</p>
</div></div>

<div class="qa-block"><div class="qa-question">4. What happens when writes outpace compaction?</div><div class="qa-answer">
<p>"Unmerged files pile up. L0 file count rises, so reads check more files and p99 climbs. Pending compaction bytes and disk usage grow. Then the engine protects itself: RocksDB slows and finally stops writes when L0 count or pending bytes cross thresholds, and Cassandra shows rising pending compactions, then timeouts and dropped mutations. So an LSM's real write capacity is its compaction throughput, not memtable speed. Fixes: more nodes to spread the write rate; more compaction threads and disk bandwidth; a strategy with lower write amp (tiered instead of leveled); larger memtables so flushes are bigger; and admission control upstream, like a queue that smooths bursts. I'd alert on pending compaction bytes, not on disk usage, because disk is a lagging signal."</p>
</div></div>

<div class="qa-block"><div class="qa-question">5. How is a delete stored in an LSM, and why can deleted data come back?</div><div class="qa-answer">
<p>"You can't remove a key from immutable files, so a delete writes a <strong>tombstone</strong>: a newer record saying 'deleted'. Reads see it first and return not-found. Space comes back only when compaction merges the tombstone with every older copy; then both can be dropped. In a replicated store like Cassandra there's a second constraint: the tombstone must also reach every replica before it's purged. If a replica was down longer than <code>gc_grace_seconds</code> (10 days by default) and missed it, and the other replicas have already purged the tombstone, repair sees the old value as the only version and copies it back everywhere. That's 'zombie data'. Rule: run repair more often than gc_grace. And don't use an LSM table as a queue; the tombstones pile up in the hot partition and reads have to scan through them."</p>
</div></div>

<div class="qa-block"><div class="qa-question">6. How does a B-tree database survive a crash halfway through writing a page?</div><div class="qa-answer">
<p>"Write-ahead logging. Every change is described in the WAL, and the WAL is fsynced before the commit is acknowledged. Pages are written to their home location later. After a crash, recovery replays the WAL from the last checkpoint. The subtle part is the <strong>torn page</strong>: an 8 KB write can be half done, and you can't apply a small redo record to a half-written page. Postgres handles that with <code>full_page_writes</code>: the first change to each page after a checkpoint logs the whole page image, so recovery can restore it. InnoDB uses a doublewrite buffer: pages go to a separate area first, then to their home. Costs: fsync latency per commit, which group commit amortises, and extra WAL volume right after each checkpoint. If you set <code>synchronous_commit = off</code> you skip the wait; a crash can lose the last fraction of a second of acknowledged commits, but nothing gets corrupted."</p>
</div></div>

<div class="qa-block"><div class="qa-question">7. You added an index and writes got slower. Quantify why, and when is a covering index worth it?</div><div class="qa-answer">
<p>"Each secondary B-tree index is another sorted structure to update on every insert, so a table with 5 indexes does about 6 tree inserts plus their WAL per row. If the indexed key is random, each is a random page touch, and once the indexes outgrow memory each one can be a disk read. In Postgres it's worse for updates: MVCC writes a new tuple, and unless the update is HOT (no indexed column changed and the new version fits on the same page), every index gets a new entry. Indexing a frequently updated column turns cheap HOT updates into full index maintenance. A <strong>covering index</strong> pays off when a hot, read-heavy query can be answered entirely from the index, for example a list endpoint that needs three columns from a wide table. In Postgres that only skips the table for pages the visibility map marks all-visible, so on a table that's constantly updated it buys much less than EXPLAIN suggests."</p>
</div></div>

<div class="qa-block"><div class="qa-question">8. Why do random UUID primary keys hurt, and is it the same in Postgres and MySQL?</div><div class="qa-answer">
<p>"In InnoDB the table <em>is</em> the primary-key B-tree. Random keys insert into random leaf pages, so once the table is bigger than the buffer pool most inserts read a page from disk and later write it back, and random page splits leave pages only partly full. Secondary indexes also store the 16-byte key, making them bigger. In Postgres rows go into an unordered heap, so the table is fine, but the primary-key index still gets random inserts with the same cache-miss problem, just for one index instead of the whole table. The fix is a time-ordered key: a bigint sequence, UUIDv7 or Snowflake IDs, so inserts land on the right-most leaf, which stays in memory. The trade-off is that sequential keys leak creation order and make that last page a contention point under very high concurrency."</p>
</div></div>

<div class="qa-block"><div class="qa-question">9. Why can't I run my analytics dashboards on Postgres? What is actually different about a column store?</div><div class="qa-answer">
<p>"You can at small scale. At a billion rows, a 'revenue by country' query in a row store reads every column of every row: about 200 GB if rows are 200 bytes. A column store reads only the three columns it needs, and those compress well because each column holds one type with repetitive values: dictionary, run-length and delta encoding plus zstd. That's ~24 GB raw, maybe ~5 GB on disk, roughly 40× less I/O. It also skips whole blocks using per-block min/max statistics and runs vectorised loops over arrays. The price is writes: updating one row touches every column file, so column stores ingest in batches and handle updates as background mutations. The standard design keeps OLTP in Postgres and streams changes via CDC into ClickHouse, BigQuery or Snowflake."</p>
</div></div>

<div class="qa-block"><div class="qa-question">10. Is Cassandra a column store?</div><div class="qa-answer">
<p>"No, and it's a common trap. Cassandra, HBase and Bigtable are <strong>wide-column</strong> stores: a partition key maps to a sorted set of rows identified by clustering keys, and each row can have many sparse columns. On disk, a partition's rows are stored together in LSM SSTables, so the layout is row-oriented within the partition. (HBase and Bigtable go halfway: each column family or locality group is stored in separate files, so they are partly column-grouped, but still not scan-optimised column stores.) It's built for 'fetch a slice of this partition fast', not for 'scan one column across the whole table'. A real column store like ClickHouse, Parquet or BigQuery stores each column contiguously for analytical scans. If someone wants analytics over Cassandra data, I'd export it to Parquet or stream it into a warehouse."</p>
</div></div>

<div class="qa-block"><div class="qa-question">11. Walk me through how you'd pick a database for a new product. Why not just MongoDB?</div><div class="qa-answer">
<p>"I start from the access patterns and the numbers, not the brand. One: what invariants do I need, such as uniqueness, no overselling or balances? If any, I want transactions and constraints, which means relational. Two: the write rate. Under a few thousand writes per second, one Postgres primary handles it; far above that, with a natural partition key and append-mostly data, a wide-column or KV store. Three: the read shapes. Key lookups go to KV or a cache, text relevance to a search engine, aggregates to a column store, multi-hop traversal to a graph, and blobs to object storage. Four: operations. Who runs it, and is there a managed version? MongoDB is a fine choice when records are self-contained aggregates read and written whole, the schema genuinely varies per record, and there are few cross-document invariants. It's a poor choice by default, because Postgres with JSONB covers the flexible-schema need and keeps joins and constraints. Usually the answer is Postgres plus one or two specialised stores fed by CDC, each justified by a named query."</p>
</div></div>

<div class="qa-block"><div class="qa-question">12. (FDE) A customer reports: "Every afternoon our Cassandra read p99 jumps from ~5 ms to ~500 ms, and disk is at 85%." Diagnose it.</div><div class="qa-answer">
<p>"I'd check three things. First, compaction: <code>nodetool compactionstats</code> for pending tasks and <code>nodetool tablehistograms</code> for SSTables per read on the slow tables, plus <code>nodetool tablestats</code> for per-level SSTable counts and tombstones per slice. If the afternoon is their write peak, compaction is falling behind, reads touch many more SSTables, and at 85% disk a size-tiered table may not even have room for its big merges, so the backlog never clears. Second, tombstones: are there tombstone warnings in the logs, and does any table behave like a queue or use short TTLs with the wrong compaction strategy? Third, the usual Cassandra suspects: GC pauses, and a hot partition visible in <code>nodetool toppartitions</code>. Likely fix order: free disk or add nodes so compaction can run (a node at 85% on STCS is already in trouble), move TTL'd time-series tables to time-window compaction, move read-heavy tables to leveled, remodel any queue-like table, and add alerts on pending compaction and SSTables per read. I'd tell them the root cause is write rate versus compaction throughput, and that a larger read timeout only hides it."</p>
</div></div>

<div class="qa-block"><div class="qa-question">13. (FDE) A customer on Postgres says: "Our orders table is 40 GB of data but 300 GB on disk, and queries keep getting slower." What's going on?</div><div class="qa-answer">
<p>"That's MVCC bloat. Every update and delete leaves a dead tuple, and VACUUM can only remove tuples that no open transaction can still see. I'd look for what blocks it: the oldest transaction in <code>pg_stat_activity</code> (an idle-in-transaction session, or a long report or backup), a stale replication slot or a replica with <code>hot_standby_feedback</code> holding the horizon back, and autovacuum settings that are too timid for a table this hot (check <code>n_dead_tup</code> and last_autovacuum in <code>pg_stat_user_tables</code>). Then: kill or time out the long transactions, tune autovacuum per table (a lower scale factor, a higher cost limit), and reclaim the space with <code>pg_repack</code> rather than VACUUM FULL, which takes an exclusive lock. Also check the transaction ID age, because the same blocker that causes bloat also stops freezing and pushes the database toward wraparound. Long term: no analytics on the primary, a lower fillfactor on hot tables for HOT updates, and alerts on dead tuples and the oldest transaction age."</p>
</div></div>

<div class="qa-block"><div class="qa-question">14. Pull it together: design the storage for a content app with users, subscriptions, an audio library, search and listening analytics.</div><div class="qa-answer">
<p>"Postgres is the system of record for users, subscriptions, entitlements and content metadata, because those need transactions and constraints and the write rate is small. Audio files and images go to object storage (S3 or R2) behind a CDN; Postgres stores the key, duration and status, never the bytes. Search starts as Postgres full-text with a GIN index; I'd move to Elasticsearch or OpenSearch, fed by CDC, only when I need typo tolerance, relevance tuning or facets, and I'd keep Postgres as the truth so the index can be rebuilt. Listening events are high-volume appends, say tens of thousands a second at scale, so they don't go into the OLTP database: they go through a queue or Kafka into a column store like ClickHouse or BigQuery for dashboards. Hot reads like the home feed are cached in Redis. Each store is justified by a named access pattern, every derived store can be rebuilt from the source of truth, and I'd only split things out when a number says so."</p>
</div></div>
` }

  ]
});
