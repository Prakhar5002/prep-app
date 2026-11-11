window.PREP_SITE.registerTopic({
  id: "bsd-bb-probabilistic",
  module: 'backend-sd',
  title: "Probabilistic & Geo Structures",
  estimatedReadTime: "50 min",
  tags: ["system-design","bloom-filter","hyperloglog","count-min-sketch","top-k","geohash","quadtree","s2","h3","geospatial","interview"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>When the exact answer needs memory proportional to the data, trade a small, bounded, one-sided error for a fixed tiny footprint: a Bloom filter answers "seen it?" (no false negatives), HyperLogLog answers "how many distinct?" (±1.04/√m), a count-min sketch answers "how often?" (never under, over by at most εN with probability 1−δ); and for "what is near me?" turn 2-D space into 1-D cell IDs (geohash, S2, H3) or an adaptive tree (quadtree) so an ordinary index can find neighbours.</strong></div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Bloom sizing:</strong> bits per element = 1.44 × log₂(1/p), so <strong>~9.6 bits/element for 1%</strong>, ~14.4 for 0.1%; each 10× lower FPR costs ~4.8 more bits. Best k = (m/n) × ln 2 (≈7 hashes at 1%). 1B items at 1% ≈ 1.2 GB.</li>
    <li><strong>Bloom FPR:</strong> p ≈ (1 − e<sup>−kn/m</sup>)<sup>k</sup>. It holds only <em>at or below the n you sized for</em>: insert 2× n with the same m and k and 1% becomes ~16%. No deletes in a plain Bloom filter (use counting Bloom, cuckoo, or rotate filters).</li>
    <li><strong>HyperLogLog:</strong> standard error = 1.04/√m for m registers, valid in the mid-to-large range (small counts use linear counting and are near-exact). Redis: m = 16,384 six-bit registers = <strong>12 KB dense, ~0.81% standard error</strong> (1σ, so ~95% of results within ±1.6%). 4× the memory halves the error.</li>
    <li><strong>HLL merges are lossless</strong> (register-wise max = HLL of the union), so daily → weekly is a merge, never a sum. Intersections via inclusion-exclusion are weak.</li>
    <li><strong>Count-min sketch:</strong> d rows × w counters, w = ⌈e/ε⌉, d = ⌈ln(1/δ)⌉. For non-negative updates it never under-counts, and over-counts by at most εN (N = total of all increments) with probability ≥ 1−δ. ε = 0.1%, δ = 1% → 2,719 × 5 ≈ 54 KB of 4-byte counters. Good for heavy hitters, useless for the tail.</li>
    <li><strong>Top-K:</strong> count-min sketch + a min-heap of size K (or Space-Saving / HeavyKeeper). Real use: Caffeine's TinyLFU cache admission, RedisBloom TOPK, trending lists.</li>
    <li><strong>Geohash:</strong> interleave lat/lon bits, base32; shared prefix ≈ same cell, so a B-tree or sorted set can range-scan it. Always query <strong>the cell plus its 8 neighbours</strong>: two points a metre apart can have no common prefix.</li>
    <li><strong>Quadtree</strong> adapts to density (split a cell at ~100 points) but is an in-memory tree that is awkward to shard and to update for moving points. <strong>S2</strong> (Google: cube faces + Hilbert curve, 64-bit cell IDs, levels 0–30) and <strong>H3</strong> (Uber: hexagons, resolutions 0–15, equidistant neighbours) are the production answers.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Quoting the error without its condition. A Bloom filter is 1% only up to the n it was sized for; HLL's 0.81% is one standard deviation, not a hard cap; count-min's bound is relative to the <em>total</em> stream N, so a 0.1% sketch over 1B events can be off by 1M on any key. Also: a geohash prefix query without neighbour cells silently misses the closest result.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The crawler sees ~1B URLs. An exact set is ~100 GB of strings; a Bloom filter at 0.1% FPR is ~1.8 GB, fits in RAM. A false positive here means we skip a page we never crawled, so I size for 0.1%, not 1%, and rebuild the filter before it passes capacity."</div>
  <div class="revision-say">"Unique viewers per video: one HLL per video per day. Weekly uniques is PFMERGE of seven days, not a sum, because the same viewer on Monday and Tuesday must count once. Error is ~0.8% at 1σ; that's fine for a dashboard, not for billing."</div>
  <div class="revision-say">"For nearby drivers I bucket by H3 cell at a resolution where a cell is a few hundred metres across, keep cell → driver set in memory, and query the rider's cell plus a ring of neighbours, then filter by true distance."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The problem these structures solve</h3>
<p>Three questions keep showing up in large systems, and the exact answer to each needs memory that grows with the data:</p>
<ul>
  <li><strong>Membership:</strong> "Have I seen this URL / username / key before?" An exact set stores every element. 1B URLs at ~100 bytes each is ~100 GB before hash-table overhead.</li>
  <li><strong>Cardinality:</strong> "How many <em>distinct</em> users visited today?" Exact counting needs the set of IDs you have already counted, so you can ignore repeats. 100M uniques × 8-byte IDs is ~800 MB per counter, per day, before overhead. Multiply by every page, every day.</li>
  <li><strong>Frequency:</strong> "How often has this hashtag / IP / key appeared?" An exact map keeps one counter per distinct key, and in a stream the long tail of keys never ends.</li>
</ul>
<p>Probabilistic structures replace "store everything" with "store a small fingerprint of everything". Memory becomes fixed (or grows only with the accuracy you want), and you pay with an error that is <strong>bounded</strong> and, crucially, <strong>one-sided</strong>, so you can reason about which way it goes wrong.</p>

<p>The fourth question is spatial: <strong>"What is near this point?"</strong> A B-tree on latitude and a B-tree on longitude cannot answer a 2-D proximity query efficiently: each one alone returns a huge strip of the planet. Geo structures map 2-D space onto 1-D keys (geohash, S2, H3) or into an adaptive tree (quadtree, R-tree), so an ordinary index or a hash map can find neighbours.</p>

<h3>The family at a glance</h3>
<table>
  <thead><tr><th>Structure</th><th>Question</th><th>Error shape</th><th>Memory</th><th>Delete?</th><th>Merge?</th><th>Real users</th></tr></thead>
  <tbody>
    <tr><td>Bloom filter</td><td>Is x in the set?</td><td>False positives only, rate p set at sizing time</td><td>~1.44·log₂(1/p) bits per element (9.6 bits at 1%)</td><td>No (counting variant: yes, ~4× space)</td><td>Yes: bitwise OR of same-shaped filters</td><td>Cassandra, RocksDB, HBase, LevelDB SSTables; RedisBloom; CDN "one-hit wonder" filters; Parquet / ClickHouse skip indexes</td></tr>
    <tr><td>Cuckoo filter</td><td>Is x in the set?</td><td>False positives only</td><td>Smaller than Bloom below ~3% with the paper's semi-sorting optimisation; below ~0.5% for a plain cuckoo filter (e.g. RedisBloom CF)</td><td>Yes</td><td>Not simply</td><td>RedisBloom CF.*, some network and storage systems</td></tr>
    <tr><td>HyperLogLog</td><td>How many distinct?</td><td>Two-sided, standard error 1.04/√m</td><td>Fixed: 12 KB in Redis regardless of count</td><td>No</td><td>Yes, lossless (register max)</td><td>Redis PF*, BigQuery, Trino/Presto approx_distinct, Spark, Druid, Elasticsearch cardinality</td></tr>
    <tr><td>Count-min sketch</td><td>How often has x appeared?</td><td>Over-estimates only, by ≤ εN with prob. ≥ 1−δ</td><td>Fixed: ⌈e/ε⌉ × ⌈ln(1/δ)⌉ counters</td><td>Only by decrementing what you added</td><td>Yes: add matrices of the same shape and hashes</td><td>Caffeine (TinyLFU), RedisBloom CMS, Twitter Algebird, network telemetry</td></tr>
    <tr><td>Geohash</td><td>Which cell is this point in?</td><td>Exact; cells are rectangles that distort near poles; neighbour discontinuities</td><td>A string or 64-bit int per point</td><td>Yes</td><td>n/a</td><td>Redis GEO, DynamoDB geo libraries, Elasticsearch geohash_grid</td></tr>
    <tr><td>Quadtree</td><td>Which points are in this area?</td><td>Exact</td><td>Tree in RAM, adapts to density</td><td>Yes, rebalancing is fiddly</td><td>n/a</td><td>In-memory location indexes, game engines, GIS tiles</td></tr>
    <tr><td>S2 / H3</td><td>Cell ID at a chosen level / resolution</td><td>Exact; cell size varies modestly by location</td><td>64-bit int per point</td><td>Yes</td><td>n/a</td><td>S2: Google Maps, MongoDB 2dsphere, BigQuery's native geography functions, Pokémon Go, Tinder geo-sharding. H3: Uber, native H3 functions in Databricks and Snowflake (BigQuery only via CARTO or UDFs)</td></tr>
  </tbody>
</table>

<div class="callout insight"><div class="callout-title">What a deep interviewer is really testing</div>
<p>Not whether you can name HyperLogLog. Whether you can (1) size it with numbers, (2) say <strong>which direction the error goes and what that error costs in this product</strong>, and (3) say what happens when the assumption behind the bound breaks (overfilled Bloom, summed HLLs, sketch bound relative to total traffic, geohash edges). "False positive means one wasted disk read" and "false positive means we never crawl that page" are the same structure with very different consequences.</p>
</div>

<h3>When to pick one (and when not)</h3>
<ul>
  <li><strong>Pick it</strong> when the exact answer does not fit in memory (or costs far more than the answer is worth), the consumer tolerates a known error, and the error direction is safe for the use (a Bloom filter in front of a definitive store, an HLL on a dashboard).</li>
  <li><strong>Do not</strong> pick it for money, quotas you bill on, compliance counts, anything you must enumerate (a Bloom filter cannot list its members), or when n is small enough that an exact set costs a few MB. "Approximate" is a product decision: get someone to agree to it out loud.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Bloom filter: a bit array that can only say "no" with certainty</h3>
<p>Picture m light switches, all off. To add an item, hash it k ways and switch on those k bulbs. To ask "is it here?", check its k bulbs: if <em>any</em> is off, it was never added (definite no). If all are on, it was <em>probably</em> added, but other items may have switched those same bulbs on (a false positive). Nothing ever switches a bulb off, which is why there are no false negatives and why you cannot delete.</p>
<div class="diagram"><pre>
 m = 16 bits, k = 3 hashes

 add "cat":  h1=2  h2=7  h3=11
 add "dog":  h1=4  h2=7  h3=14

 index:  0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
 bits:   0 0 1 0 1 0 0 1 0 0 0  1  0  0  1  0

 query "cow": h=2,4,14   -&gt; all 1 -&gt; "maybe" (FALSE POSITIVE:
                            set by cat + dog, cow never added)
 query "emu": h=2,9,11   -&gt; bit 9 is 0 -&gt; "definitely not"
</pre></div>
<p>The more items, the more bulbs are on and the more often a random query finds all k lit. The best k is the one that leaves about half the bits set: fewer hashes and each check is too weak; more hashes and you fill the array too fast.</p>

<h3>HyperLogLog: estimate a crowd by its rarest coin-flip streak</h3>
<p>If you flip a coin and someone tells you their longest run of leading tails was 10, they probably flipped around 2¹⁰ ≈ 1,000 times. Hash each item to a uniform bit string; the number of leading zeros is that streak. Duplicates hash identically, so they cannot extend the streak: only <em>distinct</em> items matter. One streak is very noisy, so HLL splits items into m buckets (registers) by the first few bits of the hash, keeps the longest streak per bucket, and combines the buckets with a harmonic mean, which damps outliers.</p>
<div class="diagram"><pre>
 64-bit hash of "user42":
 [ 00000000110010 ][ 0001 0110 1011 ... ]
   first p=14 bits     remaining 50 bits
   -&gt; register #50     leading zeros = 3 -&gt; rank = 4

 registers (m = 2^14 = 16,384, 6 bits each = 12 KB):
   reg[50] = max(reg[50], 4)

 estimate ~ alpha_m * m^2 / sum_j( 2^(-reg[j]) )
 merge(A, B): reg[j] = max(A[j], B[j])   (lossless union)
</pre></div>

<h3>Count-min sketch: several noisy tally sheets, trust the smallest</h3>
<p>Keep d rows of w counters, each row with its own hash. To count an item, add 1 to one counter in every row. To read it, take the <strong>minimum</strong> across rows. Each counter is the item's true count plus whatever else collided into it, so every row over-counts or is exact; the minimum is the row with the least collision noise.</p>
<div class="diagram"><pre>
           w counters per row  ---------------------&gt;
 row 1 (h1): [ 0 | 5 | 0 | 9 | 2 | 0 | 1 | 0 ]
 row 2 (h2): [ 3 | 0 | 0 | 0 | 6 | 7 | 0 | 1 ]
 row 3 (h3): [ 0 | 0 | 5 | 0 | 0 | 3 | 8 | 1 ]

 count("#ipl"): h1 -&gt; 9, h2 -&gt; 6, h3 -&gt; 5
                estimate = min(9, 6, 5) = 5   (true count &lt;= 5)
</pre></div>

<h3>Geo: turn "near" into "shares a prefix" or "is in the same cell"</h3>
<p>Geohash halves the world alternately by longitude and latitude and writes down which half each time (0 or 1). Interleaving the bits means nearby points usually share a long prefix, so a range scan on the prefix finds a rectangle. The catch is the word "usually": points either side of a cell boundary can have completely different prefixes, so you always fetch the 8 neighbouring cells as well.</p>
<div class="diagram"><pre>
 geohash precision 6 cells (~1.2 km x 0.6 km each)

   +--------+--------+--------+
   | tdr1tx | tdr1w8 | tdr1w9 |
   +--------+--------+--------+
   | tdr1tw | tdr1wb |*tdr1wc |   * = rider; search the 3x3 block,
   +--------+--------+--------+       then filter by real distance
   | tdr1tt | tdr1tu | tdr1tv |
   +--------+--------+--------+
 (labels illustrative: real neighbour IDs come from a neighbours()
  function, they are not alphabetical)
</pre></div>
<p>A quadtree does the opposite: instead of fixed cells, it splits any cell that holds too many points into four, so dense downtown gets tiny cells and the ocean stays one big cell. S2 and H3 are hierarchical fixed grids engineered to fix geohash's distortions: S2 uses squares on a cube projected to the sphere, ordered by a Hilbert curve; H3 uses hexagons, whose six neighbours are all the same distance away.</p>
<div class="diagram"><pre>
 Quadtree (split when a cell holds &gt; 4 points here; ~100 in practice)

 +-----------------+-----------------+
 |                 |  .   |    .     |
 |       .         |------+----------|
 |                 | ..|..|          |
 |                 |---+--|   .      |
 |                 | . |.:|          |
 +-----------------+-----------------+
 |                 |                 |
 |     .           |        .        |
 |                 |                 |
 +-----------------+-----------------+
   sparse = big leaf       dense = deep, small leaves
</pre></div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Bloom filters in detail</h3>
<h4>The formulas, and a check that they agree</h4>
<p>With m bits, n inserted items and k hash functions, the probability that a given bit is still 0 is about e<sup>−kn/m</sup>. A false positive needs all k probed bits to be 1:</p>
<div class="diagram"><pre>
 FPR      p  ~ (1 - e^(-k*n/m))^k
 best k      = (m/n) * ln 2                ~ 0.693 * bits-per-item
 size     m  = -n * ln(p) / (ln 2)^2       ~ 1.44 * n * log2(1/p)

 p = 1%    -&gt;  9.6 bits/item, k ~ 7    1B items ~ 1.2 GB
 p = 0.1%  -&gt; 14.4 bits/item, k ~ 10   1B items ~ 1.8 GB
 p = 0.01% -&gt; 19.2 bits/item, k ~ 13   1B items ~ 2.4 GB
</pre></div>
<p><strong>Check the worked number against the FPR formula.</strong> 9.6 bits per item, k = 7: e<sup>−7/9.6</sup> ≈ 0.48, so 1 − 0.48 = 0.52, and 0.52<sup>7</sup> ≈ 0.010. That is the 1% we sized for. The common rule of thumb "10 bits per key, ~1%" (the setting RocksDB's docs typically recommend for its Bloom filter policy) gives 0.82% by the same formula, close enough.</p>
<p><strong>What overfilling does.</strong> Size for n, then insert 2n with the same m and k: bits per item halves to 4.8, e<sup>−7/4.8</sup> ≈ 0.23, 0.77<sup>7</sup> ≈ 0.16. The filter now lies <strong>~16%</strong> of the time, and at 3n it is ~44%. The FPR does not degrade gracefully; it falls off a cliff. So track the insert count and treat "n reached" as a rebuild trigger, or use a scalable Bloom filter (a chain of filters, each larger and tighter than the last; RedisBloom does this by default when a filter fills, unless created NONSCALING).</p>

<h4>Implementation details interviewers ask about</h4>
<ul>
  <li><strong>k hashes without k hash functions:</strong> compute two hashes and derive the rest as g<sub>i</sub>(x) = h₁(x) + i·h₂(x) (Kirsch–Mitzenmacher). The FPR is asymptotically the same. Use a fast non-cryptographic hash (Murmur3, xxHash); use a keyed hash if adversaries choose the inputs.</li>
  <li><strong>Cache-line ("blocked") Bloom filters:</strong> put all k bits for one item in one 64-byte block, so a lookup costs one cache miss instead of k. Slightly higher FPR for the same memory; RocksDB's FastLocalBloom format and Parquet's Split Block Bloom Filter (from Impala) use this idea.</li>
  <li><strong>Union and intersection:</strong> bitwise OR of two filters with the same m, k and hashes is exactly the filter of the union. Bitwise AND approximates the intersection with a higher FPR than a filter built directly.</li>
  <li><strong>Deletes:</strong> clearing a bit could erase other items (false negatives). Options: a <strong>counting Bloom filter</strong> (small counters, typically 4 bits, instead of bits: ~4× memory, and counters can overflow); a <strong>cuckoo filter</strong> (stores short fingerprints in buckets, supports delete, smaller than Bloom below ~3% with the paper's semi-sorting optimisation or below ~0.5% for a plain cuckoo filter such as RedisBloom CF; inserts can fail when it is nearly full, and deleting an item that was never inserted can remove a colliding item's fingerprint, creating a false negative); or <strong>time-rotated filters</strong> (keep "this hour" and "last hour", drop the oldest), which is how most dedupe windows really work.</li>
  <li><strong>Enumeration:</strong> impossible. If you might need to list members, the Bloom filter is a cache in front of a real store, never the store.</li>
</ul>

<h4>Where they live in real systems</h4>
<ul>
  <li><strong>LSM-tree stores</strong> (Cassandra, RocksDB, LevelDB, HBase, ScyllaDB): one filter per SSTable, held in memory. A point read for a key that is not in a file skips that file without a disk read, so a read touching 10 SSTables does ~1 disk read instead of 10. Cassandra exposes it as the table option bloom_filter_fp_chance (older 3.x-era docs give 0.01 by default and 0.1 for LeveledCompactionStrategy tables; check your version). It does nothing for range scans, which is why RocksDB adds prefix Bloom filters. See <a href="#/topic/bsd-bb-storage">Storage Engines</a>.</li>
  <li><strong>CDNs:</strong> Akamai famously found most objects are requested exactly once ("one-hit wonders"). Caching only on the second request, tracked with a Bloom filter, kept those objects out of the disk cache and improved hit rates. See <a href="#/topic/bsd-bb-edge">Edge &amp; Traffic</a>.</li>
  <li><strong>Query engines:</strong> Parquet and ORC files can carry per-column Bloom filters, and ClickHouse has bloom_filter skip indexes, so an equality filter can skip whole row groups or granules.</li>
  <li><strong>Applications:</strong> "have I already shown this user this post?", "is this username definitely free?" (as a fast negative check in front of the unique index, never instead of it), "has the crawler seen this URL?".</li>
</ul>

<h3>2. HyperLogLog in detail</h3>
<h4>The algorithm</h4>
<ol>
  <li>Hash the item to 64 bits (HLL++ from Google moved from 32-bit to 64-bit hashes so large cardinalities do not hit hash collisions).</li>
  <li>The first p bits choose one of m = 2<sup>p</sup> registers.</li>
  <li>In the remaining bits, find the position of the first 1 (leading zeros + 1). Call it the rank.</li>
  <li>register[j] = max(register[j], rank). Re-adding the same item changes nothing, which is the whole point.</li>
  <li>Estimate = α<sub>m</sub> · m² / Σ 2<sup>−register[j]</sup>, a harmonic mean scaled by a constant (α ≈ 0.72 for large m).</li>
  <li><strong>Small-range correction:</strong> when many registers are still zero, the raw estimate is biased, so use linear counting (m · ln(m / zeroRegisters)), which is near-exact for small counts. HLL++ adds an empirical bias-correction table for the transition region.</li>
</ol>

<h4>Error and memory, with a worked number</h4>
<p>Standard error is <strong>1.04/√m</strong>. Redis uses p = 14, so m = 16,384 registers × 6 bits = 98,304 bits = <strong>12,288 bytes = 12 KB</strong>, and 1.04/√16,384 = 1.04/128 = <strong>0.81%</strong>. That is one standard deviation: about 68% of estimates fall within ±0.81%, about 95% within ±1.6%, about 99.7% within ±2.4%. A page with 100M real daily uniques reads as 100M ± ~0.8M most of the time. Because error goes as 1/√m, halving the error costs 4× the memory (p = 16 → 48 KB → ~0.41%).</p>
<p>The 12 KB is fixed for any count up to the billions; the exact equivalent for 100M distinct 8-byte IDs is ~800 MB of raw IDs and more with hash-set overhead.</p>

<h4>Sparse representation: the part people forget</h4>
<p>12 KB per HLL is tiny for one counter and enormous for ten million small ones: 10M pages × 12 KB = 120 GB, far more than storing a few hundred visitor IDs per page exactly. Production implementations therefore start <strong>sparse</strong>, storing only the non-zero registers compactly, and convert to the dense 12 KB form when it grows. Redis promotes a key from sparse to dense once the sparse form exceeds the config hll-sparse-max-bytes (default 3,000 bytes), or as soon as any register value exceeds 32, which the sparse encoding cannot hold. Elasticsearch's cardinality aggregation is near-exact below precision_threshold (default 3,000), not exact, because it works on 32-bit hashes that can collide, and switches to HLL++ above it.</p>

<h4>Merge, and why you cannot sum</h4>
<p>Two HLLs built with the same p and hash function merge by taking the register-wise max; the result is exactly the HLL you would have built from the union of both streams. That makes them ideal for pre-aggregation: one HLL per (page, hour) rolled up into days, weeks, regions, or across shards, with no reprocessing. Summing two estimates double-counts every user who appears in both. Intersections are the weak spot: |A∩B| = |A| + |B| − |A∪B| subtracts large noisy numbers, so a small overlap between two large sets can come out with a huge relative error or even negative. If intersections matter, use MinHash or theta sketches (Apache DataSketches), which handle set operations better.</p>

<h4>Where it is used</h4>
<p>Redis PFADD / PFCOUNT / PFMERGE; BigQuery APPROX_COUNT_DISTINCT and the HLL_COUNT.* functions (HLL++ sketches you can store and merge later); Trino/Presto approx_distinct (documented default standard error 2.3%, tunable); Spark approx_count_distinct (default relative standard deviation 0.05); Druid and Pinot ingest-time sketches; the postgresql-hll extension. In the counter case (likes and views) this is the "unique viewers" path; see <a href="#/topic/bsd-estimation">Estimation</a> for the memory maths style.</p>

<h3>3. Count-min sketch and top-K</h3>
<h4>The bound, and a worked number</h4>
<div class="diagram"><pre>
 width  w = ceil(e / epsilon)      depth d = ceil(ln(1 / delta))
 guarantee (non-negative updates):
   true(x) &lt;= estimate(x) &lt;= true(x) + epsilon * N
   with probability &gt;= 1 - delta,  N = sum of ALL increments

 epsilon = 0.1%, delta = 1%:
   w = ceil(2718.3) = 2,719   d = ceil(4.61) = 5
   2,719 * 5 = 13,595 counters * 4 B ~ 54 KB
   N = 1B events -&gt; over-count &lt;= 1M on any key (prob &gt;= 99%)
</pre></div>
<p>Read that last line twice. 54 KB is wonderfully small, and an over-count of up to a million is fine for a hashtag seen 50M times (2% relative error) but meaningless for one seen 3,000 times. <strong>A count-min sketch is accurate for heavy hitters and noise for the long tail.</strong> Tightening ε to 0.01% makes it 10× wider (~540 KB) and the absolute bound 100K; the bound always scales with N, so long-running sketches need decay or windowing.</p>

<h4>Variants</h4>
<ul>
  <li><strong>Conservative update:</strong> on increment, raise each of the d counters only up to (current minimum + 1) rather than incrementing them all. Same worst-case bound, much less over-count in practice. Not valid if you need to decrement.</li>
  <li><strong>Count sketch</strong> (signed ±1 updates, median of rows): unbiased, two-sided error, handles deletions better; costs more.</li>
  <li><strong>Small counters with aging:</strong> Caffeine's W-TinyLFU keeps a count-min sketch of 4-bit counters and periodically halves every counter, so frequencies decay and the sketch tracks <em>recent</em> popularity. It uses the sketch to decide whether a new entry deserves to evict an old one. See <a href="#/topic/be-caching">Caching</a>.</li>
</ul>

<h4>Top-K from a stream</h4>
<p>A sketch tells you a key's count when you ask, but it cannot list keys. For top-K, pair it with a min-heap of size K: on each item, update the sketch, read the estimate, and if it beats the heap's minimum (and the key is not already in the heap), swap it in. Alternatives that track keys directly: <strong>Space-Saving / Misra-Gries</strong> (deterministic error bounds, very simple; you keep ~1/ε counters, many more than K, so the top K are reported reliably) and <strong>HeavyKeeper</strong> (behind RedisBloom's TOPK commands).</p>
<p><strong>Distributing it.</strong> How you split the stream decides how you merge. If you <strong>partition by key</strong>, every occurrence of a hashtag lands on one worker, so the union of the local top-Ks already contains the global top-K; each worker only needs a small margin beyond K (say K + a few dozen) to absorb sketch error near the cut-off. If the split is <strong>not by key</strong> (round-robin, or each app server pre-aggregating its own traffic), a key can be moderately hot on every node and top on none, so each node must keep far more candidates than K (say 10K for a top 100), or ship sketches and merge them. The real problem with key partitioning is skew: one viral hashtag sends its whole firehose to one worker. The fix is <strong>two-stage aggregation</strong>: stage 1 pre-aggregates locally on whatever node received the event (counts per key per few seconds), stage 2 reduces those partial counts by key. The hot worker then receives one partial count per upstream node per interval instead of every raw event.</p>

<h3>4. Geo indexing in detail</h3>
<h4>Geohash</h4>
<p>Alternately bisect longitude and latitude, emit 0 for the lower half and 1 for the upper, interleave, and base32-encode 5 bits per character. Approximate cell sizes (at the equator; cells narrow east-west toward the poles):</p>
<table>
  <thead><tr><th>Length</th><th>Cell size (approx.)</th><th>Typical use</th></tr></thead>
  <tbody>
    <tr><td>4</td><td>~39 km × 20 km</td><td>City / region bucketing, shard key</td></tr>
    <tr><td>5</td><td>~4.9 km × 4.9 km</td><td>"Restaurants in this area"</td></tr>
    <tr><td>6</td><td>~1.2 km × 0.6 km</td><td>Nearby drivers, store locator</td></tr>
    <tr><td>7</td><td>~153 m × 153 m</td><td>Neighbourhood-level</td></tr>
    <tr><td>8</td><td>~38 m × 19 m</td><td>Building-level</td></tr>
  </tbody>
</table>
<p>Query: pick the longest length whose <strong>smallest cell side is at least the search radius r</strong> (that guarantees the 3×3 block around the point contains the whole circle; for r = 2 km that is length 5, because a length-6 cell is only ~1.2 × 0.6 km), compute the point's cell and its 8 neighbours, range-scan each prefix, then compute the true (haversine) distance and filter. <strong>Redis GEO</strong> does exactly this: GEOADD stores members in a sorted set with a 52-bit interleaved geohash as the score, and GEOSEARCH (Redis 6.2+, replacing GEORADIUS) scans the neighbouring ranges and filters by distance. Geohash's weaknesses: the Z-order curve jumps (consecutive IDs can be far apart), rectangles distort with latitude, and the prefix discontinuity at boundaries (worst at the equator and prime meridian).</p>

<h4>Quadtree</h4>
<p>Start with one cell for the whole map; when a cell holds more than a threshold (often ~100 points), split it into four. Density-adaptive: Manhattan gets tiny leaves, Siberia stays coarse, so every leaf holds a similar number of points. Search descends to the leaf containing the query and expands to adjacent leaves until enough results are found. The costs are real in a distributed backend: it is a pointer-based tree in one process's memory, so sharding means partitioning the tree; and points that move every few seconds force constant remove/insert and occasional split/merge. It suits mostly-static points (businesses, POIs) held in memory and rebuilt periodically. The database-native relative is the <strong>R-tree</strong> (PostGIS via GiST indexes), which indexes bounding boxes of shapes rather than points.</p>

<h4>S2</h4>
<p>Google's S2 projects the sphere onto the six faces of a cube, builds a quadtree on each face, and numbers cells along a <strong>Hilbert curve</strong>, which has much better locality than geohash's Z-order: consecutive cell IDs are always adjacent in space. Each cell is a 64-bit integer at one of 31 levels (0–30; level 30 cells are around a square centimetre). A <strong>region coverer</strong> turns a circle or polygon into a small set of cells, and each cell is a contiguous ID range, so "points in this region" becomes a handful of range scans on an ordinary integer index. Cell areas at one level vary only by a small factor. Used by Google Maps, MongoDB 2dsphere indexes, Pokémon Go's map gameplay, and Tinder's geo-sharding.</p>

<h4>H3</h4>
<p>Uber's H3 tiles the globe (via an icosahedron) with <strong>hexagons</strong> at 16 resolutions (0–15). Roughly: resolution 7 hexagons average ~5 km², resolution 8 ~0.7 km², resolution 9 ~0.1 km² (edge ~175–200 m depending on the table version). Why hexagons: every neighbour is the same distance from the centre, so "ring of k neighbours" (gridDisk) is a near-circular area, which makes smoothing, demand/supply heat maps and surge zones behave evenly. Trade-offs: each resolution has 12 pentagons (needs care in code), and children are only approximately contained in their parent (aperture 7), so hierarchical roll-ups are not exact the way S2's or geohash's are.</p>

<table>
  <thead><tr><th></th><th>Geohash</th><th>Quadtree</th><th>S2</th><th>H3</th><th>R-tree (PostGIS)</th></tr></thead>
  <tbody>
    <tr><td>Cell shape</td><td>Rectangle, distorts with latitude</td><td>Adaptive squares</td><td>Quad on cube face, near-uniform</td><td>Hexagon (+12 pentagons)</td><td>Bounding boxes</td></tr>
    <tr><td>Storage form</td><td>String / int, works in any sorted index</td><td>In-memory tree</td><td>64-bit int ranges</td><td>64-bit int</td><td>Index inside the DB</td></tr>
    <tr><td>Neighbours</td><td>8, with prefix discontinuities</td><td>Tree walk</td><td>Library call, good locality</td><td>6, all equidistant</td><td>Index search</td></tr>
    <tr><td>Hierarchy</td><td>Exact (prefix)</td><td>Exact</td><td>Exact (parent contains children)</td><td>Approximate</td><td>n/a</td></tr>
    <tr><td>Adapts to density</td><td>No</td><td>Yes</td><td>Covers regions at mixed levels</td><td>No</td><td>Yes</td></tr>
    <tr><td>Best for</td><td>Simple proximity on Redis / any KV</td><td>Static POIs in memory</td><td>Region queries, polygon coverage, sharding</td><td>Analytics, dispatch, surge, smoothing</td><td>Complex shapes, ad-hoc GIS SQL</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: Web crawler URL-seen test</h3>
<p><strong>Setup.</strong> The crawler discovers ~1B distinct URLs over a crawl cycle and must not re-fetch ones it already queued.</p>
<ul>
  <li><strong>Exact:</strong> 1B URLs × ~100 bytes ≈ 100 GB. Storing 8-byte URL hashes instead is ~8 GB of raw hashes plus hash-table overhead, and you take a small hash-collision risk anyway.</li>
  <li><strong>Bloom at 1%:</strong> 9.6 bits × 1B ≈ 1.2 GB, k = 7.</li>
  <li><strong>What does a false positive mean here?</strong> The filter says "seen" for a URL never crawled, so the page is <em>skipped forever this cycle</em>. At 1% that is up to ~10M lost pages at full load; but p is the rate <em>at full load</em>, and the filter is emptier for most of the cycle, so the cumulative loss averaged over filling 0 → n is closer to ~2M (~1.7M by integrating the FPR formula). Size for 0.1% instead: 14.4 bits/URL ≈ 1.8 GB, k = 10, up to ~1M at full load and ~120K cumulative. (A good depth point: the quoted p is the worst moment, not the average.) Still fits in one machine's RAM, or shard it by URL hash across the crawler fleet.</li>
  <li><strong>Overfill guard:</strong> if the cycle discovers 2B URLs, a 1B-sized 0.1% filter degrades to ~5.7% (14.4 bits/item becomes 7.2 with k still 10), silently: from ~1M lost pages to tens of millions. Emit the insert count as a metric and rebuild or chain a new filter at ~80% of capacity.</li>
  <li>Use the filter as a fast path in front of a durable URL store, so a restart reloads it and a disputed URL can be checked exactly.</li>
</ul>

<h3>Example 2: Unique viewers per video</h3>
<p><strong>Setup.</strong> 50M videos watched per day; a few viral ones have tens of millions of unique viewers, most have a handful.</p>
<ul>
  <li>One Redis HLL per (video, day). Sparse encoding keeps the long tail tiny; viral videos go dense at 12 KB each. Even if 1M videos went dense that would be ~12 GB, and most will not.</li>
  <li>Weekly uniques: PFMERGE the seven daily keys (or PFCOUNT across them, which merges on the fly). Never add the seven daily numbers.</li>
  <li>Global count across regions: each region keeps its own HLLs and ships them (12 KB each, tiny) to an aggregator that merges. No cross-region coordination on the write path.</li>
  <li>Error: 0.81% at 1σ for the viral video, near-exact for the small ones (linear counting). Fine for the creator dashboard; the monetisation path that pays creators uses an exact, deduplicated pipeline instead.</li>
</ul>

<h3>Example 3: Trending hashtags / heavy-hitter IPs</h3>
<p><strong>Setup.</strong> 500K tweets/s at peak, find the top 50 hashtags per 5-minute window; separately, find IPs sending more than 1% of all traffic so the rate limiter can act on them.</p>
<ul>
  <li>Partition the stream by hashtag across, say, 20 workers. Each keeps a count-min sketch (ε = 0.01%, δ = 1%: ~27K × 5 counters, ~540 KB) plus a heap of its local top candidates for the window. Because the split is by key, each hashtag is counted on one worker only, so a local top of K plus a small margin (say 60–100 for a top 50) is enough.</li>
  <li>Window total N per worker ≈ 500K/s × 300 s ÷ 20 = 7.5M, so the over-count bound per key is ε·N ≈ 750. A hashtag needs to be in the tens of thousands per window to be trending, so the error is a few percent at most for anything that matters.</li>
  <li>Skew: one viral hashtag sends its whole firehose to one worker. Put a pre-aggregation stage in front: each ingest node counts per hashtag for a few seconds and forwards partial counts, so the hot worker gets one message per ingest node per interval instead of every tweet.</li>
  <li>Merge 20 × ~100 candidates centrally and take the top 50. For "trending", rank by growth (current window vs a decayed baseline), not raw count, or "#goodmorning" wins every day.</li>
  <li>The heavy-hitter IP version is the same pattern; the threshold "more than 1% of traffic" is far above ε·N, so false heavy hitters are rare, and the limiter confirms with an exact per-IP counter before blocking.</li>
</ul>

<h3>Example 4: Nearby drivers for ride dispatch</h3>
<p><strong>Setup.</strong> ~1M online drivers, each sending a location every ~4 s: ~250K location writes/s. Riders ask for drivers within ~2 km.</p>
<ul>
  <li>250K writes/s is about 50 Postgres primaries at the ~5K writes/s planning number (see <a href="#/topic/bsd-estimation">Estimation</a>), and a location older than a few seconds is worthless anyway. So locations live in memory: a sharded in-memory store keyed by cell.</li>
  <li>Index: H3 at resolution 8 or 9, cell → set of driver IDs, plus driver → (current cell, lat/lon, timestamp). An update in the same cell only touches the driver record; crossing a cell boundary is one remove and one add.</li>
  <li>Query: the rider's cell plus gridDisk(k) rings until the area covers ~2 km. A gridDisk of radius k holds 1 + 3k(k+1) cells: at resolution 9 (~300 m between cell centres) 2 km needs k ≈ 7, i.e. 169 cells; at resolution 8 (~800 m) k ≈ 3, i.e. 37 cells. That is why wide searches use a coarser resolution and only short-range matching uses a fine one. Then gather candidates, filter by true distance and freshness (ignore pings older than ~15 s), then rank by ETA from the routing service, not straight-line distance.</li>
  <li>Sharding: by coarse cell (city / resolution 4–5 parent) so a query is usually single-shard; queries near a shard border fan out to two or three shards.</li>
  <li>Hot cells (airport, stadium at full-time) and the quadtree / geohash alternatives: see Q11–Q12 below.</li>
</ul>

<h3>Example 5 (FDE): "Your analytics say 1.02M weekly users; our database says 970K"</h3>
<p>A customer compares the product's weekly-active-users tile with their own SQL COUNT(DISTINCT user_id) and opens a ticket. Walk it like this:</p>
<ol>
  <li><strong>Definitions first.</strong> Same week boundaries and time zone? Same user population (do they exclude bots, internal staff, deleted users)? Anonymous vs logged-in IDs? Most "wrong number" tickets end here.</li>
  <li><strong>Expected error.</strong> If the tile is an HLL at ~0.81% standard error, 1M ± 8K is normal and ± 25K is a 3σ event. A 5% gap (50K) is not HLL noise.</li>
  <li><strong>Aggregation bug.</strong> Is the weekly number the sum of daily HLL estimates? Any user active on multiple days is counted multiple times. That inflates, which matches "ours is higher". Fix: merge the daily sketches.</li>
  <li><strong>Mismatched sketches.</strong> Were some days' sketches built with a different precision or hash function (e.g. after a library upgrade)? Merging incompatible sketches is either refused or silently wrong.</li>
  <li><strong>Product answer.</strong> Label the tile as approximate, and offer an exact export for contract or billing purposes. Approximate numbers should never be the basis of an invoice.</li>
</ol>

<h3>Where each structure shows up in the classic cases</h3>
<table>
  <thead><tr><th>Case</th><th>Structure</th><th>Why there</th></tr></thead>
  <tbody>
    <tr><td>Web crawler</td><td>Bloom filter (URL seen), sometimes per-host</td><td>Billions of URLs, membership test on every discovered link</td></tr>
    <tr><td>Distributed KV store</td><td>Bloom per SSTable; Merkle trees for repair (see <a href="#/topic/bsd-bb-replication">Replication</a>)</td><td>Skip disk reads for absent keys</td></tr>
    <tr><td>URL shortener</td><td>Bloom as a negative cache for "is this custom alias taken?"; HLL for unique clicks</td><td>Cheap "definitely free" check before the unique index</td></tr>
    <tr><td>Distributed counter (likes, views)</td><td>HLL for unique viewers</td><td>Distinct counts per object without storing viewer sets</td></tr>
    <tr><td>Leaderboard / Top-K, autocomplete</td><td>Count-min sketch + heap, Space-Saving</td><td>Heavy hitters in an unbounded stream</td></tr>
    <tr><td>Rate limiter</td><td>Count-min sketch for heavy-hitter detection</td><td>Find abusive keys without a counter per key</td></tr>
    <tr><td>News feed</td><td>Bloom of already-seen post IDs per user</td><td>Dedupe without storing every impression</td></tr>
    <tr><td>Ride dispatch, nearby places</td><td>H3 / S2 / geohash, quadtree for static POIs</td><td>Proximity queries at high update rates</td></tr>
    <tr><td>Video streaming / CDN</td><td>Bloom for "cache on second hit"</td><td>Keep one-hit wonders off the disk cache</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>A Bloom filter past its design capacity</h3>
<p>Sized for n at 1%, holding 2n it is ~16% and at 3n ~44%, with no error and no log line. Track inserts; alert at ~80% of n; rebuild bigger or chain a new filter (scalable Bloom).</p>

<h3>Bloom filters and restarts</h3>
<p>An in-memory filter lost on restart starts empty, which is safe for "seen?" checks only if a miss falls through to an authoritative store. If the filter <em>is</em> the dedupe (crawler, notification dedupe), persist it or rebuild it from the store before taking traffic, or you will re-send or re-crawl everything.</p>

<h3>HLL at tiny cardinalities and in huge numbers</h3>
<p>For counts in the tens, linear counting is near-exact, but a dense 12 KB register array is wasteful. Make sure your implementation uses a sparse or exact mode for small sets; ten million dense HLLs is 120 GB.</p>

<h3>Count-min sketch over a long window</h3>
<p>The bound is ε × N, and N only grows. A sketch that has been running for a month has an absolute error 30× that of a one-day sketch. Window it (one sketch per period, rotate), or decay counters periodically like TinyLFU does.</p>

<h3>Geohash boundaries, poles and the antimeridian</h3>
<p>Two points a few metres apart across a cell edge can share no prefix (the classic example is either side of the equator or the prime meridian). Always query neighbours. Near the poles cells become slivers, and at ±180° longitude the "neighbour" wraps around: use a library, never hand-rolled bit maths.</p>

<h3>Hot geo cells</h3>
<p>A stadium emptying or an airport arrivals area puts thousands of drivers and riders in a few cells. Fixed grids do not adapt, so the shard holding that cell melts. Split hot cells to a finer resolution, give them dedicated capacity, or cap candidates per query.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Summing HLL estimates</h3>
<p>Weekly = sum of daily uniques double-counts everyone active on more than one day. Merge the sketches. Same rule across shards and regions.</p>

<h3>Merging incompatible sketches</h3>
<p>HLLs with different precisions or hash functions, Bloom filters with different m or k, or count-min sketches with different seeds cannot be combined by OR, max or add. Version your sketch parameters and store them with the data.</p>

<h3>Using a Bloom filter as the source of truth</h3>
<p>"Username available" because the filter said "not present" is fine; "username taken" because the filter said "maybe" rejects real users at the false-positive rate. The filter is a fast negative path; the unique index decides.</p>

<h3>Deleting from a plain Bloom filter</h3>
<p>Clearing bits also clears them for other items, creating false negatives, which breaks the one guarantee a Bloom filter has. Use counting Bloom, cuckoo, or time-rotated filters.</p>

<h3>Querying a count-min sketch for the tail</h3>
<p>Reading the count of a rare key from a sketch with a large ε·N returns mostly collision noise. Only trust estimates well above ε·N.</p>

<h3>Approximate numbers on an invoice</h3>
<p>If a number drives billing, quotas with financial consequences, or compliance reporting, it must be exact and reproducible. Use sketches for dashboards and detection; keep an exact path for money.</p>

<h3>Adversarial inputs</h3>
<p>If attackers control the items and know your (unkeyed) hash, they can craft inputs that collide in a count-min sketch or saturate Bloom bits. Use a keyed hash (SipHash with a secret seed) on public-facing inputs.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<p>The questions climb the way a deep interviewer chains them: each follows from the previous answer.</p>

<div class="qa-block"><div class="qa-question">1. You need to check "have we seen this before?" for about a billion items. Why not just a hash set?</div><div class="qa-answer">
<p>Because the exact set's memory is proportional to the items. A billion URLs at ~100 bytes is ~100 GB, and even 8-byte fingerprints are ~8 GB of raw data plus hash-table overhead (often 2× or more). That means a cluster or disk lookups on every check. If the use tolerates a small, one-sided error, a Bloom filter answers the same question in ~1.2 GB at 1% false positives, in memory, in a few hundred nanoseconds. The first thing I would ask is what a false positive costs here, because that sets the error rate, and whether we ever need to list or delete members, because a plain Bloom filter can do neither.</p>
</div></div>

<div class="qa-block"><div class="qa-question">2. How does a Bloom filter work, and why can it never return a false negative?</div><div class="qa-answer">
<p>It is an m-bit array plus k hash functions. Insert sets the k bits the item hashes to; query checks them. If any bit is 0, the item was definitely never inserted, because insertion would have set it and nothing ever clears a bit. If all are 1, the item was probably inserted, but other items could have set the same bits: that is the false positive. False negatives would need a bit to be cleared, which only happens if you try to delete, which is why plain Bloom filters do not support delete.</p>
</div></div>

<div class="qa-block"><div class="qa-question">3. Size one for 1 billion URLs at 1% false positives. Show the maths and check it.</div><div class="qa-answer">
<p>m = −n·ln p / (ln 2)² ≈ 1.44 · n · log₂(1/p). For p = 0.01, log₂(100) ≈ 6.64, so ≈ 9.6 bits per item; × 1B = 9.6 Gbit ≈ 1.2 GB. Optimal k = (m/n)·ln 2 ≈ 9.6 × 0.69 ≈ 6.6, round to 7. Check with the FPR formula: (1 − e<sup>−7/9.6</sup>)<sup>7</sup> = (1 − 0.48)<sup>7</sup> ≈ 0.52<sup>7</sup> ≈ 0.010. For a crawler, where a false positive means a page is never fetched, I would go to 0.1%: 14.4 bits per item, ~1.8 GB, k ≈ 10. Rule of thumb: each 10× improvement in FPR costs ~4.8 extra bits per item.</p>
</div></div>

<div class="qa-block"><div class="qa-question">4. Traffic doubled and you inserted 2 billion into that filter. What happens, and how would you have caught it?</div><div class="qa-answer">
<p>Bits per item halves to 4.8 while k stays 7: (1 − e<sup>−7/4.8</sup>)<sup>7</sup> ≈ 0.77<sup>7</sup> ≈ 16%. The filter went from wrong 1 in 100 to wrong 1 in 6, silently. In the crawler, roughly one in six genuinely new URLs is now wrongly reported as seen and never fetched. Catching it: emit the insertion count (or the fraction of bits set, which should sit near 50% at design load) as a metric and alert at ~80% of capacity. Fixing it: rebuild a bigger filter from the authoritative store, or use a scalable Bloom filter that chains a new, larger, tighter sub-filter when the current one fills, so the compound FPR stays bounded. Querying costs one check per sub-filter, which is fine for a few of them.</p>
</div></div>

<div class="qa-block"><div class="qa-question">5. Now product wants deletes: "un-see" a URL after 30 days. Options?</div><div class="qa-answer">
<p>Three. (a) <strong>Counting Bloom filter:</strong> replace bits with small counters (typically 4 bits), decrement on delete. ~4× memory, counters can overflow, and deleting something never inserted corrupts it. (b) <strong>Cuckoo filter:</strong> stores short fingerprints in a cuckoo hash table, supports delete natively and is smaller than Bloom below ~3% FPR with the paper's semi-sorting optimisation (below ~0.5% for a plain cuckoo filter such as RedisBloom CF); the catches are that inserts can fail as it approaches full, so you size it with headroom, and that deleting an item that was never inserted can remove a colliding item's fingerprint, so you only delete what you know you added. (c) <strong>Time-rotated filters:</strong> since the requirement is really "forget after 30 days", keep one filter per day (or per week), query all live ones, and drop the oldest whole. I would pick (c) for an expiry requirement and (b) for genuine arbitrary deletes.</p>
</div></div>

<div class="qa-block"><div class="qa-question">6. Where does an LSM-tree database use Bloom filters, and why don't they help range scans?</div><div class="qa-answer">
<p>An LSM store (Cassandra, RocksDB, HBase) keeps data in many immutable SSTables. A point read for a key might have to check every SSTable that could contain it, newest first. Each SSTable carries an in-memory Bloom filter of its keys, so the read skips files that definitely lack the key; a read across 10 SSTables becomes about one real disk read. Missing keys benefit most: without filters, proving absence costs a read per file. Range scans do not ask "is key k here?", they ask "which keys between a and b?", and a hash-based filter destroys ordering, so it cannot answer that. RocksDB mitigates with prefix Bloom filters (filter on a key prefix so "all keys for user 42" can skip files). The FPR is a knob: Cassandra's bloom_filter_fp_chance trades memory for avoided reads, and leveled compaction tables tolerate a higher value because SSTables within a level do not overlap, so a read checks at most one file per level and there are fewer filters to get wrong. See <a href="#/topic/bsd-bb-storage">Storage Engines</a>.</p>
</div></div>

<div class="qa-block"><div class="qa-question">7. Count distinct users per day across 100 app servers. How does HyperLogLog do it, and how accurate is it?</div><div class="qa-answer">
<p>Each server hashes every user ID; the first p bits choose a register, and the register keeps the maximum "leading zeros + 1" seen in the rest of the hash. A run of r leading zeros is roughly a 1-in-2<sup>r</sup> event, so long runs mean many distinct items; duplicates hash identically and cannot raise any register, so only distinct users count. A harmonic mean across registers smooths the noise, with linear counting for small cardinalities. Standard error is 1.04/√m. With Redis's m = 16,384 registers at 6 bits, that is 12 KB and 1.04/128 ≈ 0.81%, one standard deviation, so ~95% of answers are within ±1.6%. Each server keeps its own HLL and ships 12 KB to an aggregator that merges them; no user IDs cross the network.</p>
</div></div>

<div class="qa-block"><div class="qa-question">8. Why can you merge HLLs but not add their counts? And what about "users active on both web and mobile"?</div><div class="qa-answer">
<p>Merging takes the register-wise maximum, which is exactly the register state you would have reached feeding both streams into one HLL, so the merge is lossless with respect to the union. Adding counts double-counts every user present in both. For the intersection you only have inclusion-exclusion: |W∩M| = |W| + |M| − |W∪M|. Each term carries ~0.8% error on a large number, so if web and mobile each have 10M users and the overlap is 200K, the error terms (~±80K each, 1σ) are comparable to the answer itself; it can even come out negative. If intersections are a real requirement I would use theta sketches (Apache DataSketches) or MinHash, which are designed for set operations, or compute that one number exactly in the warehouse.</p>
</div></div>

<div class="qa-block"><div class="qa-question">9. Find the top 50 trending hashtags from a stream of hundreds of thousands of events per second. Walk me through it, including the error bound.</div><div class="qa-answer">
<p>Partition the stream by hashtag across workers. Each worker keeps a count-min sketch per window and a min-heap of its top candidates. Because the split is by key, each hashtag lives on exactly one worker, so the union of local top-Ks already contains the global top 50; I keep a small margin (top ~100) only to absorb sketch error at the cut-off. Keeping thousands per node is only needed when the split is not by key, such as per-app-server pre-aggregation. The real problem is skew: one viral hashtag makes one worker hot, so I put a local pre-aggregation stage in front (count per key for a few seconds on each ingest node) and reduce the partial counts by key. A central step merges candidates and takes the top 50, ranked by growth against a decayed baseline rather than raw count. The sketch: d rows of w counters, w = ⌈e/ε⌉, d = ⌈ln(1/δ)⌉; each increment touches one counter per row and a read takes the minimum. It never under-counts (collisions only add) and over-counts by at most ε·N with probability 1−δ, where N is the total of all increments in that sketch. With ε = 0.01%, δ = 1%: ~27K × 5 counters ≈ 540 KB. If a worker sees N = 7.5M events per window, the bound is ~750 per key, negligible for a hashtag with tens of thousands of mentions. The weakness is the tail: a key seen 500 times is indistinguishable from noise, which is fine because the tail is never trending.</p>
</div></div>

<div class="qa-block"><div class="qa-question">10. Find drivers within 2 km of a rider. Start with geohash: how, and what is the classic bug?</div><div class="qa-answer">
<p>Geohash interleaves latitude and longitude bits so a shared prefix means a shared rectangular cell; prefixes can be range-scanned in any sorted index (Redis GEO stores a 52-bit geohash as a sorted-set score). Pick the longest precision whose smallest cell side is at least the radius, so the 3×3 block around the rider covers the whole 2 km circle: length 6 cells are only ~1.2 × 0.6 km, so for 2 km it has to be length 5 (~4.9 × 4.9 km). Take the rider's cell, scan it, then compute true distance and filter. The classic bug is scanning only the rider's cell: a driver 50 m away across the cell edge can have a completely different prefix, especially at the equator or prime meridian, because the Z-order curve jumps. The fix is to always scan the cell plus its 8 neighbours, then filter by haversine distance, then rank by ETA rather than straight-line distance.</p>
</div></div>

<div class="qa-block"><div class="qa-question">11. Geohash, quadtree, S2 or H3: which would you choose for Uber-style dispatch, and why?</div><div class="qa-answer">
<p>H3, with geohash in Redis as the acceptable simple first version. A <strong>quadtree</strong> adapts to density, which is lovely for static points, but it is an in-memory pointer tree that is hard to shard, and a million drivers moving every few seconds means constant split/merge under contention. <strong>Geohash</strong> works and is easy, but rectangles distort with latitude and neighbours are irregular. <strong>S2</strong> has excellent locality (Hilbert curve), exact hierarchy, and great region covering, so I would choose it for "which points are inside this polygon" and for range-sharding by cell ID. <strong>H3</strong>'s hexagons have six equidistant neighbours, so k-rings approximate circles and every cell's neighbourhood is the same shape, which is what you want when the same grid also drives supply/demand heat maps, surge zones and ETA smoothing. That is why Uber built it. Its costs: 12 pentagons per resolution and only approximate parent-child containment, so roll-ups across resolutions are not exact.</p>
</div></div>

<div class="qa-block"><div class="qa-question">12. 1M drivers ping every 4 seconds. How do you store and shard the index, and what happens at a stadium at full-time?</div><div class="qa-answer">
<p>That is ~250K writes/s of data that is worthless after ~15 s, so it does not belong in a relational primary (at ~5K writes/s each that is ~50 primaries for throwaway data). Keep it in memory: cell → set of driver IDs, and driver → (cell, lat/lon, last-seen). Same-cell updates touch only the driver record; a cell change is remove + add. Shard by a coarse parent cell (city-level), so most queries are single-shard and queries near a border fan out to two or three. Expire drivers by last-seen rather than trusting disconnects. Persist a sampled location stream to Kafka for analytics and trip reconstruction, not to the index (<a href="#/topic/be-kafka">Kafka</a>). At a stadium the problem is not the index structure, it is that one cell and one shard get a burst of queries and updates: split hot cells to a finer resolution, give known venues dedicated shards, cap candidates per query (you need the 20 best drivers, not all 3,000), and shed or batch location updates from stationary drivers.</p>
</div></div>

<div class="qa-block"><div class="qa-question">13. A customer reports: "Your dashboard says 1.02M weekly users; our own SQL count says 970K. Your numbers are wrong." Walk me through it.</div><div class="qa-answer">
<p>First, definitions, because most of these are not bugs: same week boundaries and time zone, same population (bots, staff, deleted accounts, anonymous IDs)? Second, expected error: if the tile is HLL at ~0.81%, 1M ± ~8K is normal and ± 25K is about 3σ; a 50K (5%) gap is not sketch noise. Third, the aggregation: if the weekly number is the sum of daily estimates, everyone active on several days is counted several times, which inflates the number exactly in the direction the customer sees. The fix is merging the daily sketches. Fourth, check that every sketch in the merge was built with the same precision and hash, for instance across a library upgrade. Finally the product fix: label the tile as approximate, give the customer an exact export for anything contractual, and add a test that weekly ≤ sum of dailies and ≥ max of dailies.</p>
</div></div>

<div class="qa-block"><div class="qa-question">14. When would you refuse to use a probabilistic structure, even though it would save memory?</div><div class="qa-answer">
<p>When the error has no safe direction for the use. Money and billing (an over-counting sketch charges a customer for usage they did not have), compliance or audit counts that must be reproducible, quotas with contractual consequences, anything you must enumerate or delete individually (GDPR "forget this user" cannot be done to an HLL; you drop and rebuild it), and small n, where an exact set is a few MB and the complexity buys nothing. I would also avoid them when inputs are adversarial and I cannot use a keyed hash. The pattern I like is both: a sketch for the fast, cheap, approximate path (dashboards, detection, pre-filtering) and an exact pipeline, possibly slower and batch, for the numbers that people act on with money.</p>
</div></div>
` }

  ]
});
