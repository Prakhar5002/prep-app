window.PREP_SITE.registerTopic({
  id: "lld-lru-cache",
  module: "lld",
  title: "Case: LRU Cache",
  estimatedReadTime: "40 min",
  tags: ["lld","lru","cache","lfu","ttl","doubly-linked-list","hash-map","typescript","concurrency","single-flight"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">An LRU cache is a <strong>hash map from key to node in a doubly linked recency list</strong>: the map finds in O(1), the list promotes and evicts in O(1), and <strong>every <code>get</code> is a write</strong>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>The bar:</strong> holds at most <em>N</em> entries, evicts the one touched longest ago, with <strong>O(1) <code>get</code> and O(1) <code>put</code></strong>; only one structure gets you there.</li>
    <li><strong>Map <code>key → node</code> + doubly linked list (MRU at head, LRU at tail)</strong> → O(1) <code>get</code>/<code>put</code>/<code>delete</code>, O(capacity) space.</li>
    <li><strong>Doubly linked</strong> because promotion unlinks an arbitrary node and needs <code>prev</code>; <strong>sentinels</strong> delete every empty/first/last branch; the <strong>node stores its key</strong> so eviction can delete the map entry.</li>
    <li><strong>Update = use:</strong> <code>put</code> on an existing key refreshes value + recency and never evicts; check existence <em>before</em> any eviction.</li>
    <li><strong>Eviction touches both structures</strong> — forgetting <code>index.delete(lru.key)</code> is the classic leak.</li>
    <li><strong>LLD framing (vs LeetCode 146):</strong> <code>Cache&lt;K, V&gt;</code> interface, composition over <code>extends Map</code>, options object, validation, <code>onEvict</code> (Observer), hit/miss stats, <code>peek</code>/<code>has</code> that don't promote.</li>
    <li><strong>JS shortcut:</strong> <code>Map</code> insertion order + delete/set; Java: <code>LinkedHashMap(cap, 0.75f, true)</code> + <code>removeEldestEntry</code>; Python: <code>OrderedDict.move_to_end</code>.</li>
    <li><strong>TTL:</strong> wrap entries with <code>expiresAt</code> (Decorator), inject a <code>Clock</code>, lazy expiry on read + bounded periodic prune; collect-then-delete when iterating.</li>
    <li><strong>LFU in O(1):</strong> <code>key → {value, freq}</code>, <code>freq → ordered keys</code>, <code>minFreq</code>; evict before insert; add decay in production.</li>
    <li><strong>Size-by-bytes:</strong> a <code>sizeOf</code> weigher + running <code>totalBytes</code>; evict from the tail <em>while</em> over <code>maxBytes</code>; reject a single value bigger than <code>maxBytes</code>.</li>
    <li><strong>Strategy</strong> (<code>EvictionPolicy</code>) makes LRU/FIFO/LFU pluggable at the cost of a second hash structure.</li>
    <li><strong>Node concurrency:</strong> sync ops are atomic on the event loop; races live across <code>await</code> → single-flight (in-flight promise map, registered before any await, cleared in <code>finally</code>).</li>
    <li><strong>Java concurrency:</strong> RW locks don't help (reads mutate) → single lock, lock striping, or buffered reads (Caffeine).</li>
    <li><strong>Multi-instance:</strong> each pod has its own LRU → short TTLs, pub/sub invalidation, or L1 LRU + L2 Redis; Redis's own LRU is <em>sampled</em>, not exact.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Evicting from the list but not the map</strong> (or a node without its key, so you <em>can't</em>): <code>size</code> never drops, memory leaks, and a later <code>get</code> "hits" an unlinked node and corrupts the pointers. Eviction is always two steps: <code>list.removeLast()</code> <em>and</em> <code>index.delete(node.key)</code> — then fire <code>onEvict</code>.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"A hash map gives me O(1) lookup into a doubly linked list that gives me O(1) reordering; the node keeps its key so eviction can clean up the map too."</div>
  <div class="revision-say">"In an LRU every get is a write — that's why a reader-writer lock doesn't help in Java, and why peek exists."</div>
  <div class="revision-say">"In Node the synchronous ops are atomic; the real race is check-await-fill, so I wrap the loader in single-flight and add TTL jitter."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What an LRU cache is</h3>
<p>A bounded key-value store with an <strong>eviction policy</strong>: when inserting into a full cache, remove the entry whose last access is oldest. "Access" means both reads (<code>get</code>) and writes (<code>put</code>). The bet LRU makes is <strong>temporal locality</strong> — something used recently is likely to be used again soon.</p>

<h3>Where you have already met it</h3>
<ul>
  <li><strong>Mobile:</strong> in-memory image caches in RN image libraries, a "recently viewed" list, a per-screen API response cache on a meeting-room tablet so swiping between rooms doesn't refetch.</li>
  <li><strong>Node backends:</strong> a per-process cache in front of a slow dependency (config service, feature flags, a customer's legacy API) — usually via the <code>lru-cache</code> npm package.</li>
  <li><strong>Infrastructure:</strong> Redis <code>maxmemory-policy allkeys-lru</code> (an <em>approximated</em> LRU — see Interview Q10), database buffer pools, CDN edge caches, OS page caches (usually LRU approximations such as CLOCK).</li>
</ul>

<h3>Why interviewers love it as an LLD case</h3>
<ul>
  <li>Small enough to <strong>finish with working code</strong> in 45 minutes — unlike a parking lot, there's no hiding behind boxes.</li>
  <li>Tests a real <strong>data-structure decision</strong> (why a doubly linked list, why sentinels, why the node keeps its key).</li>
  <li>Has a deep bench of <strong>follow-ups</strong> that separate mid from senior: TTL, LFU, Strategy, stampedes, thread safety, distribution.</li>
</ul>

<h3>LeetCode answer vs LLD answer</h3>
<table>
  <thead><tr><th></th><th>DSA round (LeetCode 146)</th><th>LLD round (this topic)</th></tr></thead>
  <tbody>
    <tr><td>Types</td><td><code>number → number</code>, returns <code>-1</code> on miss</td><td>Generic <code>Cache&lt;K, V&gt;</code>, returns <code>undefined</code>, has <code>has()</code> for falsy values</td></tr>
    <tr><td>Structure</td><td>One class</td><td>Interface + cache + list + node, each with one job (SRP)</td></tr>
    <tr><td>Validation</td><td>Assumed valid</td><td>Rejects capacity 0 / NaN / non-integer</td></tr>
    <tr><td>Observability</td><td>None</td><td><code>onEvict</code> listener, hit/miss stats</td></tr>
    <tr><td>Extensions</td><td>Rarely asked</td><td>TTL, LFU, pluggable policy, byte-size limit</td></tr>
    <tr><td>Concurrency</td><td>Not discussed</td><td>Event loop atomicity, async stampedes, Java locking, multi-instance</td></tr>
  </tbody>
</table>
<p>The data-structure core is already taught in <a href="#/topic/dsa-linked-list">Linked Lists</a> (doubly linked lists) and <a href="#/topic/dsa-hashing">Hashing</a>; this topic is about turning it into a <em>design</em>.</p>

<h3>Eviction policies — where LRU sits</h3>
<table>
  <thead><tr><th>Policy</th><th>Evicts</th><th>Strength</th><th>Weakness</th><th>Seen in</th></tr></thead>
  <tbody>
    <tr><td>LRU</td><td>Least recently accessed</td><td>Simple, O(1), great for recency-driven workloads</td><td>One big scan flushes the hot set</td><td>Most app caches, <code>lru-cache</code></td></tr>
    <tr><td>LFU</td><td>Least frequently accessed</td><td>Keeps long-term favourites</td><td>Yesterday's hot key never leaves without decay</td><td>Redis <code>allkeys-lfu</code> (with decay)</td></tr>
    <tr><td>FIFO / Random / TTL-only</td><td>Oldest insert / anyone / expired</td><td>No read-side bookkeeping</td><td>Ignore popularity; TTL alone has no memory bound</td><td>Simple buffers, Redis <code>allkeys-random</code>, HTTP caches</td></tr>
    <tr><td>Segmented LRU / 2Q / ARC</td><td>Cold segment first</td><td>Scan-resistant</td><td>More moving parts</td><td>memcached (segmented LRU), ZFS (ARC)</td></tr>
    <tr><td>W-TinyLFU</td><td>Admission by frequency sketch + LRU window</td><td>Near-optimal hit rates</td><td>Complex; approximate</td><td>Caffeine (Java)</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The picture: an index that points into a queue</h3>
<div class="diagram"><pre>
  index: Map&lt;K, Node&gt;        (map order is irrelevant — the arrows are pointers)
          ┌───────┬───────┬───────┐
          │  "c"  │  "a"  │  "b"  │
          └───┬───┴───┬───┴───┬───┘
              │       │       │
              ▼       ▼       ▼
  HEAD ⇄  [c:3] ⇄ [a:1] ⇄ [b:2]  ⇄ TAIL
   ▲      most recently used ──► least recently used     ▲
   │      (insert / promote here)   (evict from here)    │
 sentinel                                            sentinel
</pre></div>
<p>The map answers "<em>where</em> is key k?" in O(1). The list answers "<em>who</em> is oldest?" in O(1). Neither can do the other's job: a map has no cheap "oldest" query, and a list has no cheap "find k".</p>

<h3>Why each piece exists</h3>
<table>
  <thead><tr><th>Requirement</th><th>Piece</th><th>What breaks without it</th></tr></thead>
  <tbody>
    <tr><td>Find an entry in O(1)</td><td>Hash map <code>key → node</code></td><td>O(n) scan of the list</td></tr>
    <tr><td>Promote any entry in O(1)</td><td>Doubly linked list (<code>prev</code> + <code>next</code>)</td><td>Singly linked: finding the predecessor is O(n)</td></tr>
    <tr><td>Evict the oldest in O(1)</td><td>Tail pointer</td><td>Walk the whole list</td></tr>
    <tr><td>No null checks at the ends</td><td>Sentinel <code>HEAD</code> / <code>TAIL</code></td><td>Four extra branches, classic off-by-one bugs</td></tr>
    <tr><td>Remove the evicted key from the map</td><td>Node stores its <code>key</code></td><td>Map keeps a dead entry: memory leak + wrong <code>size</code></td></tr>
  </tbody>
</table>

<h3>Trace it once (capacity 3)</h3>
<table>
  <thead><tr><th>Op</th><th>List after (MRU → LRU)</th><th>Note</th></tr></thead>
  <tbody>
    <tr><td><code>put(A)</code>, <code>put(B)</code>, <code>put(C)</code></td><td>C, B, A</td><td>Each insert goes to the front</td></tr>
    <tr><td><code>get(A)</code></td><td>A, C, B</td><td>A read promotes — B is now the oldest</td></tr>
    <tr><td><code>put(D)</code></td><td>D, A, C</td><td>Size 4 &gt; 3 → evict tail B (list <em>and</em> map)</td></tr>
    <tr><td><code>put(C, 30)</code></td><td>C, D, A</td><td>Update: new value, promoted, nothing evicted</td></tr>
    <tr><td><code>get(B)</code></td><td>C, D, A</td><td>Miss → <code>undefined</code>, no change</td></tr>
    <tr><td><code>put(E)</code></td><td>E, C, D</td><td>Evict A</td></tr>
  </tbody>
</table>

<h3>Pointer surgery for "promote C"</h3>
<div class="diagram"><pre>
before:   HEAD ⇄ A ⇄ B ⇄ C ⇄ TAIL
remove(C):     B.next = TAIL     TAIL.prev = B           (C unlinked)
addToFront(C): C.prev = HEAD     C.next = A
               A.prev = C        HEAD.next = C
after:    HEAD ⇄ C ⇄ A ⇄ B ⇄ TAIL                       6 pointer writes, O(1)
</pre></div>

<div class="callout warn">
  <div class="callout-title">The insight that drives everything else</div>
  <p><strong>In an LRU, <code>get</code> mutates.</strong> A read re-orders the list. That's why a reader-writer lock doesn't help in Java (every reader needs the write lock), why <code>peek()</code> exists as a separate method, and why "just put a cache in front of it" is never free under concurrency.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>We walk the seven steps of <a href="#/topic/lld-framework">LLD Interview Framework</a> in order. Say each step's name out loud in the interview — it shows the grader you have a method.</p>

<h3>Step 1: Requirements (functional + non-functional)</h3>
<p><strong>Clarifying questions first</strong> (ask 3–4, not 10):</p>
<ul>
  <li>Capacity by <em>count</em> or by <em>bytes</em>? (Count unless told otherwise.)</li>
  <li>Does <code>put</code> on an existing key count as "use"? (Yes — it refreshes recency.)</li>
  <li>Do we need TTL? Do we need an eviction callback?</li>
  <li>Single process, or shared across servers? Single-threaded runtime or multi-threaded?</li>
</ul>
<table>
  <thead><tr><th>Functional</th><th>Non-functional</th></tr></thead>
  <tbody>
    <tr><td><code>get(key)</code> → value or <code>undefined</code>; marks key most-recent</td><td>O(1) average for <code>get</code> / <code>put</code> / <code>delete</code></td></tr>
    <tr><td><code>put(key, value)</code> → insert or update; marks most-recent</td><td>Memory bounded by capacity (O(capacity) space)</td></tr>
    <tr><td>Evict least-recent when size would exceed capacity</td><td>Generic over <code>K</code>, <code>V</code>; type-safe</td></tr>
    <tr><td><code>delete(key)</code>, <code>has(key)</code>, <code>peek(key)</code>, <code>clear()</code>, <code>size</code></td><td>Deterministic and testable (injectable clock for TTL)</td></tr>
    <tr><td>Optional <code>onEvict(key, value)</code> listener</td><td>Observable: hit rate, evictions</td></tr>
  </tbody>
</table>
<p><strong>Out of scope (say it):</strong> persistence, distribution across nodes, write-back to a database. Mention you'll come back to concurrency in step 7.</p>

<h3>Step 2: Entities &amp; relationships</h3>
<table>
  <thead><tr><th>Entity</th><th>Responsibility</th><th>Relationship</th></tr></thead>
  <tbody>
    <tr><td><code>Cache&lt;K, V&gt;</code> (interface)</td><td>The contract callers depend on</td><td>Implemented by <code>LRUCache</code>, later <code>LFUCache</code>, <code>TtlCache</code></td></tr>
    <tr><td><code>LRUCache&lt;K, V&gt;</code></td><td>Enforces capacity; coordinates index and order</td><td><strong>Composes</strong> one <code>Map</code> and one <code>DoublyLinkedList</code></td></tr>
    <tr><td><code>DoublyLinkedList&lt;K, V&gt;</code></td><td>Owns recency order only</td><td><strong>Composes</strong> 0..n <code>Node</code>s plus two sentinels</td></tr>
    <tr><td><code>Node&lt;K, V&gt;</code></td><td>Holds key, value, <code>prev</code>, <code>next</code></td><td>Shared by reference: list owns it, map points to it</td></tr>
    <tr><td><code>Map&lt;K, Node&gt;</code></td><td>Index: key → node</td><td>Built-in; no wrapper needed</td></tr>
  </tbody>
</table>
<div class="callout note">
  <div class="callout-title">Composition, not inheritance</div>
  <p>A tempting shortcut is <code>class LRUCache extends Map</code>. Don't: every inherited method (<code>set</code>, <code>forEach</code>, <code>entries</code>) would bypass eviction and recency, so a caller holding a <code>Map</code> reference could break the invariants — a Liskov violation. Compose a private <code>Map</code> and expose only the cache contract.</p>
</div>

<h3>Step 3: Class diagram (ASCII)</h3>
<div class="diagram"><pre>
            «interface»
           Cache&lt;K, V&gt;
  ─────────────────────────────
  + get(key: K): V | undefined
  + put(key: K, value: V): void
  + delete(key: K): boolean
  + has(key: K): boolean
  + size: number
                 △
                 │ implements
                 │
           LRUCache&lt;K, V&gt;
  ─────────────────────────────
  - capacity: number
  - index: Map&lt;K, Node&lt;K, V&gt;&gt;  ◆───────────┐
  - list: DoublyLinkedList&lt;K, V&gt; ◆──┐      │
  - onEvict?: (k, v) =&gt; void        │      │
  - hits, misses: number            │      │
  ─────────────────────────────     │      │
  + get / put / delete / has        │      │
  + peek(key): V | undefined        │      │
  + clear(), stats()                │      │
  - evictLeastRecent()              │      │
                                    ▼      │
                    DoublyLinkedList&lt;K, V&gt; │
              ─────────────────────────────│
              - head: Node  (sentinel)     │
              - tail: Node  (sentinel)     │
              + addToFront(n)              │
              + remove(n)                  │
              + moveToFront(n)             │
              + removeLast(): Node | null  │
                          ◆ 0..*           │
                          ▼                ▼
                     Node&lt;K, V&gt;  ◄── (map values point at the same nodes)
              ─────────────────────
              + key: K  (readonly)
              + value: V
              + prev, next: Node | null

  △ implements / extends    ◆ composition (owns lifetime)    ◄ reference
</pre></div>

<h3>Step 4: Interfaces / APIs</h3>
<pre><code class="language-ts">export interface Cache&lt;K, V&gt; {
  get(key: K): V | undefined;   // promotes on hit
  put(key: K, value: V): void;  // insert or update; may evict
  delete(key: K): boolean;      // true if something was removed
  has(key: K): boolean;         // does NOT promote
  readonly size: number;
}

export interface LRUCacheOptions&lt;K, V&gt; {
  capacity: number;                       // positive integer
  onEvict?: (key: K, value: V) =&gt; void;   // Observer hook: metrics, cleanup, write-back
}</code></pre>
<p><strong>API decisions worth saying out loud:</strong></p>
<ul>
  <li><strong><code>undefined</code> on miss, not <code>-1</code> or <code>null</code></strong> — <code>-1</code> only works for numbers. If callers may legitimately store <code>undefined</code>, they use <code>has()</code> first (or the API returns <code>{ hit: boolean; value?: V }</code>).</li>
  <li><strong><code>has()</code> and <code>peek()</code> don't promote</strong> — monitoring or an admin endpoint must not change what gets evicted.</li>
  <li><strong>Options object, not positional args</strong> — adding <code>ttlMs</code> or <code>maxBytes</code> later doesn't break callers.</li>
</ul>

<h3>Step 5: Core flows</h3>
<div class="diagram"><pre>
 get(k)                                  put(k, v)
 ──────                                  ─────────
 node = index.get(k)                     node = index.get(k)
   │                                       │
   ├─ undefined → misses++                 ├─ exists → node.value = v
   │              return undefined         │           list.moveToFront(node)
   │                                       │           return            (never evicts)
   └─ found → hits++                       │
              list.moveToFront(node)       └─ new → node = new Node(k, v)
              return node.value                     index.set(k, node)
                                                    list.addToFront(node)
                                                    if index.size &gt; capacity:
                                                      lru = list.removeLast()
                                                      index.delete(lru.key)
                                                      onEvict(lru.key, lru.value)
</pre></div>
<p><strong>Insert-then-evict vs evict-then-insert:</strong> both are correct <em>if</em> the update path returns early. Insert-then-evict reads naturally ("we're over capacity, trim"). Evict-first is required for LFU (a brand-new key has the lowest frequency and would evict itself) — see Example 4.</p>

<h3>Step 6: Code</h3>
<p>Write it in this order so you always have something runnable: <code>Node</code> → <code>DoublyLinkedList</code> (4 primitives) → <code>LRUCache</code> → walk one test aloud. The full listing is Example 1 in the Examples section. Before you write a line, state the <strong>invariants</strong> — they double as your test plan:</p>
<ol>
  <li><code>index.size</code> equals the number of real nodes in the list.</li>
  <li>Every node in the list is in the index under <code>node.key</code>, and vice versa.</li>
  <li><code>head.next</code> is the most-recent entry; <code>tail.prev</code> is the least-recent.</li>
  <li>After every public call, <code>size ≤ capacity</code>.</li>
</ol>
<p><strong>Complexity:</strong> <code>get</code>, <code>put</code>, <code>delete</code>, <code>peek</code>, <code>has</code> are O(1) average (hash map) and O(1) worst for the list part; <code>clear</code> is O(n); space is O(capacity). Per-entry overhead is one node object (4 fields) plus one map slot — real, but rarely the bottleneck; measure with a heap snapshot if it matters.</p>

<h3>Step 7: Extensibility &amp; concurrency</h3>
<table>
  <thead><tr><th>Follow-up</th><th>Change</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>TTL</td><td>Wrap entries as <code>{ value, expiresAt }</code>; lazy check on read + periodic prune</td><td>Decorator (Example 3)</td></tr>
    <tr><td>LFU</td><td>Different data structure: frequency buckets + <code>minFreq</code></td><td>Same <code>Cache</code> interface (Example 4)</td></tr>
    <tr><td>Pluggable eviction (LRU / FIFO / LFU)</td><td>Extract an <code>EvictionPolicy&lt;K&gt;</code></td><td>Strategy (below)</td></tr>
    <tr><td>Metrics, write-back, cleanup on evict</td><td><code>onEvict</code> callback</td><td>Observer</td></tr>
    <tr><td>Load-on-miss with no stampede</td><td>Wrap with in-flight promise map</td><td>Decorator / single-flight (Example 5)</td></tr>
    <tr><td>Capacity in bytes</td><td><code>sizeOf(value)</code> weigher; evict while <code>totalBytes &gt; maxBytes</code></td><td>Interview Q8</td></tr>
  </tbody>
</table>

<h4>Pluggable eviction with Strategy</h4>
<pre><code class="language-ts">export interface EvictionPolicy&lt;K&gt; {
  recordInsert(key: K): void;
  recordAccess(key: K): void;
  recordRemoval(key: K): void;
  victim(): K | undefined;
}

export class LruPolicy&lt;K&gt; implements EvictionPolicy&lt;K&gt; {
  private readonly order = new Set&lt;K&gt;(); // a Set iterates in insertion order = recency order
  recordInsert(key: K): void { this.order.add(key); }
  recordAccess(key: K): void { this.order.delete(key); this.order.add(key); }
  recordRemoval(key: K): void { this.order.delete(key); }
  victim(): K | undefined { return this.order.values().next().value; }
}

export class FifoPolicy&lt;K&gt; extends LruPolicy&lt;K&gt; {
  override recordAccess(): void { /* reads don't change FIFO order */ }
}

// The cache owns a Map&lt;K, V&gt; and delegates "whom do I evict?" to the policy:
//   get:  hit → policy.recordAccess(key)
//   put:  new key at capacity → victim = policy.victim(); delete it; policy.recordRemoval(victim)
//         then store.set(key, value); policy.recordInsert(key)
const lruCache  = new PolicyCache&lt;string, Buffer&gt;(1_000, new LruPolicy());
const fifoCache = new PolicyCache&lt;string, Buffer&gt;(1_000, new FifoPolicy());</code></pre>
<p><strong>Trade-off to name:</strong> the Strategy version hashes each key twice (store + policy) and keeps two structures. The hand-rolled list in Example 1 fuses index and order into one node — faster and leaner. Pick Strategy when policies genuinely vary per use-site; pick the fused version for a hot path. Both are O(1).</p>

<h4>Concurrency — three runtimes, three answers</h4>
<ul>
  <li><strong>Node.js (single event loop):</strong> <code>get</code>/<code>put</code> are synchronous, so each runs to completion before any other JS runs — they are atomic for free. The races appear the moment an <code>await</code> sits between "check the cache" and "fill the cache": N concurrent misses each call the database (a <strong>cache stampede</strong>). Fix: single-flight (Example 5). See <a href="#/topic/js-event-loop">Event Loop</a>.</li>
  <li><strong>Node with <code>worker_threads</code> / cluster / PM2:</strong> every worker or process has its own heap, so its own cache — N copies, N× memory, independent eviction, and invalidations must be broadcast. Sharing across workers means an external cache (Redis), not a shared JS object.</li>
  <li><strong>Java / Go / C++ (shared-memory threads):</strong> the list is mutated on every read, so a reader-writer lock buys nothing. Options in increasing sophistication: one mutex around every op (simple, contended); <strong>lock striping</strong> — N independent LRU segments chosen by <code>hash(key) % N</code> (approximate global LRU, far less contention); or <strong>buffered reads</strong> — record accesses into a lossy buffer and replay them under the lock in batches (the approach Caffeine takes).</li>
</ul>
<pre><code class="language-java">// Java's built-in LRU: LinkedHashMap in access order + an eviction hook
class LruCache&lt;K, V&gt; extends LinkedHashMap&lt;K, V&gt; {
  private final int capacity;
  LruCache(int capacity) {
    super(16, 0.75f, true);              // accessOrder = true → get() re-orders
    this.capacity = capacity;
  }
  @Override
  protected boolean removeEldestEntry(Map.Entry&lt;K, V&gt; eldest) {
    return size() &gt; capacity;
  }
}
// get() mutates, so EVERY call (reads included) must take the same lock:
Map&lt;String, byte[]&gt; cache = Collections.synchronizedMap(new LruCache&lt;&gt;(10_000));</code></pre>
<p>Python has the same shortcut: <code>collections.OrderedDict</code> with <code>move_to_end()</code> and <code>popitem(last=False)</code>, or <code>functools.lru_cache</code> for memoising a function. Syntax differs; the design maps 1:1.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — The full solution (hash map + doubly linked list)</h3>
<pre><code class="language-ts">// lru-cache.ts
export interface Cache&lt;K, V&gt; {
  get(key: K): V | undefined;
  put(key: K, value: V): void;
  delete(key: K): boolean;
  has(key: K): boolean;
  readonly size: number;
}

class Node&lt;K, V&gt; {
  prev: Node&lt;K, V&gt; | null = null;
  next: Node&lt;K, V&gt; | null = null;
  constructor(public readonly key: K, public value: V) {}
}

/** Owns recency order only. Knows nothing about capacity or keys-to-nodes. */
class DoublyLinkedList&lt;K, V&gt; {
  // Sentinels never hold data and are never removed, so addToFront/remove
  // need no "is this the first / last node?" branches.
  private readonly head = new Node&lt;K, V&gt;(undefined as unknown as K, undefined as unknown as V);
  private readonly tail = new Node&lt;K, V&gt;(undefined as unknown as K, undefined as unknown as V);

  constructor() {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /** Insert right after HEAD = most-recently-used slot. O(1). */
  addToFront(node: Node&lt;K, V&gt;): void {
    const first = this.head.next!;
    node.prev = this.head;
    node.next = first;
    first.prev = node;
    this.head.next = node;
  }

  /** Unlink any node in O(1) — possible only because the node knows its prev. */
  remove(node: Node&lt;K, V&gt;): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
    node.prev = null; // a second remove() of the same node now throws loudly
    node.next = null;
  }

  moveToFront(node: Node&lt;K, V&gt;): void {
    if (this.head.next === node) return; // already MRU: skip four pointer writes
    this.remove(node);
    this.addToFront(node);
  }

  /** Remove and return the least-recently-used node, or null when empty. */
  removeLast(): Node&lt;K, V&gt; | null {
    const last = this.tail.prev!;
    if (last === this.head) return null;
    this.remove(last);
    return last;
  }

  *fromMru(): IterableIterator&lt;[K, V]&gt; {
    for (let n = this.head.next!; n !== this.tail; n = n.next!) yield [n.key, n.value];
  }

  *fromLru(): IterableIterator&lt;[K, V]&gt; {
    for (let n = this.tail.prev!; n !== this.head; n = n.prev!) yield [n.key, n.value];
  }
}

export interface LRUCacheOptions&lt;K, V&gt; {
  capacity: number;
  onEvict?: (key: K, value: V) =&gt; void;
}

export class LRUCache&lt;K, V&gt; implements Cache&lt;K, V&gt; {
  private readonly capacity: number;
  private readonly index = new Map&lt;K, Node&lt;K, V&gt;&gt;();
  private readonly list = new DoublyLinkedList&lt;K, V&gt;();
  private readonly onEvict?: (key: K, value: V) =&gt; void;
  private hits = 0;
  private misses = 0;

  constructor(options: LRUCacheOptions&lt;K, V&gt;) {
    if (!Number.isInteger(options.capacity) || options.capacity &lt; 1) {
      throw new RangeError('capacity must be a positive integer, got ' + options.capacity);
    }
    this.capacity = options.capacity;
    this.onEvict = options.onEvict;
  }

  get size(): number {
    return this.index.size;
  }

  get(key: K): V | undefined {
    const node = this.index.get(key);
    if (node === undefined) {
      this.misses++;
      return undefined;
    }
    this.hits++;
    this.list.moveToFront(node); // a read is a write: it changes recency
    return node.value;
  }

  /** Read WITHOUT promoting — for metrics, admin endpoints, decorators. */
  peek(key: K): V | undefined {
    return this.index.get(key)?.value;
  }

  has(key: K): boolean {
    return this.index.has(key);
  }

  put(key: K, value: V): void {
    const existing = this.index.get(key);
    if (existing !== undefined) {
      existing.value = value; // update path: refresh, never evict
      this.list.moveToFront(existing);
      return;
    }
    const node = new Node(key, value);
    this.index.set(key, node);
    this.list.addToFront(node);
    if (this.index.size &gt; this.capacity) this.evictLeastRecent();
  }

  delete(key: K): boolean {
    const node = this.index.get(key);
    if (node === undefined) return false;
    this.list.remove(node);
    this.index.delete(key);
    return true;
  }

  clear(): void {
    while (this.list.removeLast() !== null) {
      /* unlink every node so stray references can't resurrect them */
    }
    this.index.clear();
  }

  stats(): { size: number; capacity: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : this.hits / total,
    };
  }

  /** Most-recent first. Used by tests and debugging; never mutate during iteration. */
  entriesMruFirst(): IterableIterator&lt;[K, V]&gt; {
    return this.list.fromMru();
  }

  entriesLruFirst(): IterableIterator&lt;[K, V]&gt; {
    return this.list.fromLru();
  }

  private evictLeastRecent(): void {
    const lru = this.list.removeLast();
    if (lru === null) return;
    this.index.delete(lru.key); // the line everyone forgets
    this.onEvict?.(lru.key, lru.value); // fire only once state is consistent again
  }
}</code></pre>

<h4>Tests in prose (say these; they map 1:1 to Jest/Vitest cases)</h4>
<ol>
  <li><strong>Basic eviction:</strong> capacity 2; <code>put(a)</code>, <code>put(b)</code>, <code>get(a)</code>, <code>put(c)</code> → <code>get(b)</code> is <code>undefined</code>, <code>onEvict</code> was called exactly once with <code>b</code>, order is <code>[c, a]</code>.</li>
  <li><strong>Update never evicts:</strong> full cache, <code>put</code> an existing key → size unchanged, no <code>onEvict</code>, key moves to the front.</li>
  <li><strong><code>peek</code> doesn't promote:</strong> <code>peek(c)</code> then fill the cache → <code>c</code> is still the one evicted.</li>
  <li><strong>Capacity 1:</strong> every new key evicts the previous one; <code>get</code> of the latest still works.</li>
  <li><strong>Delete then reuse:</strong> <code>delete(a)</code> returns <code>true</code>, a second <code>delete(a)</code> returns <code>false</code>, and a later <code>put</code> doesn't evict anything early (size really dropped).</li>
  <li><strong>Validation:</strong> <code>capacity: 0</code>, <code>-1</code>, <code>1.5</code>, <code>NaN</code> all throw <code>RangeError</code>.</li>
  <li><strong>Re-entrant listener:</strong> an <code>onEvict</code> that calls <code>put</code> doesn't corrupt state, because the callback runs only after the map and list agree.</li>
  <li><strong>Invariant check after every step</strong> of the capacity-3 trace in Mental Model: walk <code>entriesMruFirst()</code> and assert it equals the expected order and has <code>size</code> items.</li>
</ol>

<h3>Example 2 — The JavaScript shortcut: <code>Map</code> insertion order</h3>
<p>A JS <code>Map</code> iterates in insertion order, and <code>delete</code> + <code>set</code> moves a key to the end. That gives an O(1) LRU in a dozen lines:</p>
<pre><code class="language-ts">export class MapLRU&lt;K, V&gt; {
  private readonly map = new Map&lt;K, V&gt;();

  constructor(private readonly capacity: number) {}

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key) as V;
    this.map.delete(key); // delete + set = move to the newest end
    this.map.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size &gt; this.capacity) {
      const oldest = this.map.keys().next().value as K; // first key = least recent
      this.map.delete(oldest);
    }
  }
}</code></pre>
<p><strong>When to use it in an interview:</strong> mention it as "what I'd ship in JS", then ask whether they want the explicit structure. Most interviewers do — the shortcut hides exactly the reasoning they're testing, and it doesn't translate to Java/C++ (Java's equivalent is <code>LinkedHashMap</code>). It also costs a hash delete + insert per read instead of a few pointer writes.</p>

<h3>Example 3 — Follow-up: add TTL (Decorator over the LRU)</h3>
<p>Interviewer: "Entries must also expire after a TTL." We don't edit <code>LRUCache</code> (Open/Closed) — we <strong>wrap</strong> it and store <code>{ value, expiresAt }</code>. Time comes from an injected <code>Clock</code> so tests never sleep.</p>
<pre><code class="language-ts">export interface Clock {
  now(): number;
}
export const systemClock: Clock = { now: () =&gt; Date.now() };

export type EvictionReason = 'capacity' | 'expired';

interface Expiring&lt;V&gt; {
  value: V;
  expiresAt: number;
}

export class TtlCache&lt;K, V&gt; implements Cache&lt;K, V&gt; {
  private readonly inner: LRUCache&lt;K, Expiring&lt;V&gt;&gt;;

  constructor(
    capacity: number,
    private readonly defaultTtlMs: number,
    private readonly clock: Clock = systemClock,
    private readonly onEvict?: (key: K, value: V, reason: EvictionReason) =&gt; void,
  ) {
    if (!(defaultTtlMs &gt; 0)) throw new RangeError('defaultTtlMs must be &gt; 0');
    this.inner = new LRUCache&lt;K, Expiring&lt;V&gt;&gt;({
      capacity,
      onEvict: (key, entry) =&gt; this.onEvict?.(key, entry.value, 'capacity'),
    });
  }

  /** Includes expired-but-not-yet-pruned entries: an upper bound, not a live count. */
  get size(): number {
    return this.inner.size;
  }

  get(key: K): V | undefined {
    const entry = this.inner.peek(key); // look first: don't promote a corpse
    if (entry === undefined) return undefined;
    if (entry.expiresAt &lt;= this.clock.now()) {
      this.expire(key, entry);
      return undefined;
    }
    return this.inner.get(key)!.value; // live: now promote
  }

  put(key: K, value: V, ttlMs: number = this.defaultTtlMs): void {
    this.inner.put(key, { value, expiresAt: this.clock.now() + ttlMs });
  }

  has(key: K): boolean {
    const entry = this.inner.peek(key);
    return entry !== undefined &amp;&amp; entry.expiresAt &gt; this.clock.now();
  }

  delete(key: K): boolean {
    return this.inner.delete(key);
  }

  /**
   * Active expiry: scan up to maxScan entries from the cold end and drop the
   * expired ones. Collect first, delete after — never unlink nodes mid-iteration.
   */
  prune(maxScan = 100): number {
    const now = this.clock.now();
    const dead: Array&lt;[K, Expiring&lt;V&gt;]&gt; = [];
    let scanned = 0;
    for (const [key, entry] of this.inner.entriesLruFirst()) {
      if (scanned++ &gt;= maxScan) break;
      if (entry.expiresAt &lt;= now) dead.push([key, entry]);
    }
    for (const [key, entry] of dead) this.expire(key, entry);
    return dead.length;
  }

  private expire(key: K, entry: Expiring&lt;V&gt;): void {
    this.inner.delete(key);
    this.onEvict?.(key, entry.value, 'expired');
  }
}

// Wiring: lazy expiry on every read + a bounded background sweep
const users = new TtlCache&lt;string, { name: string }&gt;(10_000, 60_000);
const sweeper = setInterval(() =&gt; users.prune(500), 5_000);
sweeper.unref(); // don't keep the Node process alive just for housekeeping</code></pre>
<p><strong>Design notes to say aloud:</strong></p>
<ul>
  <li><strong>Lazy + active expiry</strong> is the same split Redis uses: check on access (cheap, exact for the key you touch) plus a bounded periodic sweep so cold expired keys don't squat on memory forever.</li>
  <li><strong>Why scan from the cold end?</strong> LRU order is by <em>access</em>, not by <em>expiry</em>, so expired entries can sit anywhere; the cold end is just the most likely place. For exact, O(log n) expiry use a min-heap keyed by <code>expiresAt</code> (or, with one fixed TTL and no refresh-on-read, a second FIFO list in insertion order).</li>
  <li><strong>Does a read extend the TTL?</strong> Here no (absolute expiry). "Sliding expiration" — reset <code>expiresAt</code> on every hit — is a one-line change in <code>get</code>, and a product decision: sessions want sliding, price quotes want absolute.</li>
  <li><strong>Tests:</strong> fake clock at 1000, <code>put(a)</code> with TTL 100 → at 1099 <code>get(a)</code> hits; at 1100 it misses and <code>onEvict</code> fires with reason <code>'expired'</code>; two short-TTL entries + <code>prune()</code> returns 2.</li>
</ul>

<h3>Example 4 — Follow-up: make it LFU in O(1)</h3>
<p>Evict the <em>least frequently</em> used key; break ties by least recently used. The O(1) trick (LeetCode 460): keep a <strong>bucket per frequency</strong> and track <code>minFreq</code>. A JS <code>Set</code> preserves insertion order, so each bucket is already an LRU list.</p>
<pre><code class="language-ts">interface LfuEntry&lt;V&gt; {
  value: V;
  freq: number;
}

export class LFUCache&lt;K, V&gt; implements Cache&lt;K, V&gt; {
  private readonly entries = new Map&lt;K, LfuEntry&lt;V&gt;&gt;();
  /** freq → keys at that freq. A Set iterates in insertion order = LRU tie-break for free. */
  private readonly buckets = new Map&lt;number, Set&lt;K&gt;&gt;();
  private minFreq = 0;

  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity &lt; 1) {
      throw new RangeError('capacity must be a positive integer');
    }
  }

  get size(): number {
    return this.entries.size;
  }

  has(key: K): boolean {
    return this.entries.has(key);
  }

  get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) return undefined;
    this.touch(key, entry);
    return entry.value;
  }

  put(key: K, value: V): void {
    const entry = this.entries.get(key);
    if (entry !== undefined) {
      entry.value = value;
      this.touch(key, entry);
      return;
    }
    // Evict BEFORE inserting: the newcomer has freq 1 and would otherwise be its own victim.
    if (this.entries.size &gt;= this.capacity) this.evict();
    this.entries.set(key, { value, freq: 1 });
    this.bucket(1).add(key);
    this.minFreq = 1;
  }

  delete(key: K): boolean {
    const entry = this.entries.get(key);
    if (entry === undefined) return false;
    this.unbucket(key, entry.freq);
    this.entries.delete(key);
    return true; // minFreq may now point at an empty bucket; evict() repairs it
  }

  private touch(key: K, entry: LfuEntry&lt;V&gt;): void {
    const emptied = this.unbucket(key, entry.freq);
    if (emptied &amp;&amp; this.minFreq === entry.freq) this.minFreq++;
    entry.freq++;
    this.bucket(entry.freq).add(key);
  }

  private evict(): void {
    let keys = this.buckets.get(this.minFreq);
    if (keys === undefined) {
      // only after delete() emptied the min bucket: O(distinct frequencies), rare
      this.minFreq = Math.min(...this.buckets.keys());
      keys = this.buckets.get(this.minFreq)!;
    }
    const victim = keys.values().next().value as K; // oldest key at the lowest frequency
    this.unbucket(victim, this.minFreq);
    this.entries.delete(victim);
  }

  private bucket(freq: number): Set&lt;K&gt; {
    let keys = this.buckets.get(freq);
    if (keys === undefined) {
      keys = new Set&lt;K&gt;();
      this.buckets.set(freq, keys);
    }
    return keys;
  }

  /** Returns true when the bucket became empty (and was dropped). */
  private unbucket(key: K, freq: number): boolean {
    const keys = this.buckets.get(freq)!;
    keys.delete(key);
    if (keys.size &gt; 0) return false;
    this.buckets.delete(freq);
    return true;
  }
}</code></pre>
<ul>
  <li><strong>Why <code>minFreq++</code> is enough in <code>touch</code>:</strong> the key we just moved now lives in bucket <code>freq + 1</code>, so if bucket <code>freq</code> was the minimum and is now empty, the new minimum is exactly <code>freq + 1</code>.</li>
  <li><strong>Why <code>put</code> resets <code>minFreq = 1</code>:</strong> a new key always has frequency 1, the lowest possible.</li>
  <li><strong>Tests:</strong> capacity 2: <code>put(1)</code>, <code>put(2)</code>, <code>get(1)</code>, <code>put(3)</code> evicts 2 (freq 1); then <code>get(3)</code> makes 1 and 3 both freq 2, and <code>put(4)</code> evicts 1 (older within the tie).</li>
  <li><strong>The production caveat:</strong> pure LFU suffers <em>cache pollution</em> — a key that was hot last week keeps a huge count forever. Real systems decay counts (Redis's LFU uses a small logarithmic counter that decays over time) or use admission filters (W-TinyLFU).</li>
</ul>

<h3>Example 5 — Follow-up: load-on-miss without a stampede (single-flight)</h3>
<p>Interviewer: "Wrap a slow loader. If 500 requests miss the same key at once, the database must see <em>one</em> query."</p>
<pre><code class="language-ts">export class LoadingCache&lt;K, V&gt; {
  private readonly inFlight = new Map&lt;K, Promise&lt;V&gt;&gt;();

  constructor(
    private readonly cache: Cache&lt;K, V&gt;,
    private readonly loader: (key: K) =&gt; Promise&lt;V&gt;,
  ) {}

  get(key: K): Promise&lt;V&gt; {
    const cached = this.cache.get(key);
    if (cached !== undefined) return Promise.resolve(cached);

    const pending = this.inFlight.get(key);
    if (pending !== undefined) return pending; // join the request already in the air

    const promise = this.loader(key)
      .then((value) =&gt; {
        if (this.inFlight.get(key) === promise) this.cache.put(key, value); // skip if invalidated meanwhile
        return value;
      })
      .finally(() =&gt; {
        if (this.inFlight.get(key) === promise) this.inFlight.delete(key);
      });
    this.inFlight.set(key, promise);
    return promise;
  }

  /** Invalidate: drop the value AND orphan any in-flight load so it can't write stale data back. */
  invalidate(key: K): void {
    this.cache.delete(key);
    this.inFlight.delete(key);
  }
}</code></pre>
<ul>
  <li><strong>Why it's race-free:</strong> between "cache miss" and <code>inFlight.set</code> there is no <code>await</code>, so on one event loop no other request can slip in between the check and the registration.</li>
  <li><strong>Errors aren't cached:</strong> a rejection clears the in-flight slot, so the next call retries. If the dependency is down hard, add <em>negative caching</em> (store the failure for a few seconds) or a circuit breaker — see <a href="#/topic/be-resilience">Resilience</a>.</li>
  <li><strong>The stale write-back race:</strong> without the <code>inFlight.get(key) === promise</code> guard, an invalidation that lands while a load is in flight is undone when the old load finishes and writes the old value back.</li>
  <li><strong>Tests:</strong> a loader that returns a manually-resolved promise → two concurrent <code>get('k')</code> calls → loader called once, both resolve to 42, a third call hits the cache; a rejecting loader is called again on retry; <code>invalidate</code> during the flight leaves the cache empty after resolution.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Capacity 0, negative, fractional, NaN</h3>
<p>Capacity 0 means "cache nothing" — legitimate in config (a kill switch) but it breaks the insert-then-evict flow if you don't think about it. Either reject it (as Example 1 does) or treat it as a no-op cache. Never silently coerce <code>1.5</code> or <code>NaN</code>.</p>

<h3>2. Updating an existing key when the cache is full</h3>
<p>Must not evict. The bug appears when code evicts first and checks for existence second — you lose an innocent entry for no reason.</p>

<h3>3. Falsy and <code>undefined</code> values</h3>
<p><code>if (cache.get(k))</code> treats a cached <code>0</code>, <code>''</code> or <code>false</code> as a miss and refetches every time. Compare with <code>=== undefined</code>, and if <code>undefined</code> itself is a valid value, use <code>has()</code> or return a result object.</p>

<h3>4. Key identity</h3>
<p>A JS <code>Map</code> uses SameValueZero: <code>'1'</code> and <code>1</code> are different keys, <code>NaN</code> equals <code>NaN</code>, and object keys compare by <em>reference</em> — <code>{ id: 1 }</code> built twice is two different keys. Normalise composite keys to a string (<code>tenantId + ':' + id</code>), and in Java make sure <code>equals</code>/<code>hashCode</code> are consistent.</p>

<h3>5. Mutable cached values</h3>
<p><code>get</code> returns the same object every caller gets. One caller mutating it changes it for everyone, and a cached "user" may silently diverge from the database. Freeze values (<code>Object.freeze</code>), store immutable DTOs, or clone on read for untrusted callers.</p>

<h3>6. Re-entrant callbacks</h3>
<p>An <code>onEvict</code> that calls back into the cache (<code>put</code> a replacement, <code>delete</code> a related key) runs while you are still inside <code>put</code>. Fire listeners only after the map and list are consistent (Example 1 does), or queue them and fire after the operation.</p>

<h3>7. Mutating during iteration</h3>
<p>Deleting a node while a generator walks the list nulls that node's <code>next</code>, and the iteration stops early. Collect first, then delete — that's why <code>prune()</code> in Example 3 builds a <code>dead</code> array. (A JS <code>Map</code>, by contrast, tolerates deletes during iteration.)</p>

<h3>8. Clock problems with TTL</h3>
<p><code>Date.now()</code> is wall-clock time and can jump backwards or forwards on NTP correction. For in-process durations prefer a monotonic source (<code>performance.now()</code>, <code>process.hrtime.bigint()</code>); in tests inject a fake <code>Clock</code>. Also decide what "expires at exactly T" means — this design treats <code>expiresAt &lt;= now</code> as expired.</p>

<h3>9. Scan pollution</h3>
<p>A batch job or a crawler that touches every key once pushes the genuinely hot entries out — LRU's classic weakness. Mitigations: don't let bulk paths populate the cache, use <code>peek</code> for scans, or switch to a scan-resistant policy (segmented LRU, W-TinyLFU).</p>

<h3>10. Multiple instances, deploys and cold starts</h3>
<p>Each instance has its own LRU. A <code>DELETE /users/42</code> handled by instance A invalidates A's copy only; instances B–F keep serving the stale user until TTL. And every deploy or Lambda cold start empties every in-process cache at once, so the first minutes after a release hit the database hardest (pre-warm the top-N keys if that hurts). Use short TTLs for in-process caches, broadcast invalidations (Redis pub/sub), or keep shared data in Redis — see <a href="#/topic/be-caching">Caching</a>.</p>

<h3>11. Per-user data in a module-level cache (SSR / multi-tenant)</h3>
<p>A module-level cache in a Node server is shared by <em>every</em> request. Keying it by URL alone can serve tenant A's data to tenant B. Put tenant/user identity in the key, or scope the cache per request.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Bug 1 — Evicting from the list but not the map</h3>
<pre><code class="language-ts">// BUG
const lru = this.list.removeLast();
// forgot: this.index.delete(lru.key)</code></pre>
<p>The map keeps pointing at an unlinked node: <code>size</code> never drops, memory grows without bound, and a later <code>get</code> "hits" a node that's no longer in the list, then <code>moveToFront</code> corrupts the pointers. It's the most common LRU bug (also called out in <a href="#/topic/dsa-linked-list">Linked Lists</a>).</p>

<h3>Bug 2 — Node doesn't store its key</h3>
<p>If nodes only hold values, eviction has the node but can't find which map entry to delete. Store <code>key</code> on the node; it costs one field.</p>

<h3>Bug 3 — Not promoting on update</h3>
<p><code>put(existingKey, v)</code> changes the value but leaves the node where it is. The freshly written key is then the next eviction victim. An update is a use.</p>

<h3>Bug 4 — Evict-before-exists-check</h3>
<pre><code class="language-ts">// BUG: evicts even when we're only updating
if (this.index.size &gt;= this.capacity) this.evictLeastRecent();
const existing = this.index.get(key);</code></pre>

<h3>Bug 5 — Array, singly linked list, or timestamps</h3>
<p>Arrays make promotion O(n) (<code>indexOf</code> + <code>splice</code>). A singly linked list makes unlinking O(n) because you need the predecessor. A <code>lastUsed</code> timestamp per entry makes every eviction an O(n) scan for the minimum. All three work in a 100-entry demo and melt at 100,000.</p>

<h3>Anti-pattern 6 — <code>class LRUCache extends Map</code></h3>
<p>Leaks <code>set</code>, <code>forEach</code>, <code>entries</code>, and so on, all of which bypass recency and eviction. Compose instead (Step 2).</p>

<h3>Anti-pattern 7 — An unbounded "cache"</h3>
<p>A module-level <code>const cache = new Map()</code> that is only ever <code>set</code> is a memory leak with a nicer name. It's one of the most common causes of a Node service whose memory climbs until it is OOM-killed. Every cache needs a bound (count, bytes, or TTL + sweep).</p>

<h3>Anti-pattern 8 — <code>await</code> between check and fill</h3>
<pre><code class="language-ts">// BUG: N concurrent misses → N database queries (stampede)
async function getUser(id: string): Promise&lt;User&gt; {
  const hit = cache.get(id);
  if (hit !== undefined) return hit;
  const user = await db.users.findById(id); // every waiter gets here
  cache.put(id, user);
  return user;
}</code></pre>
<p>Fix with single-flight (Example 5). Add jittered TTLs so a thousand keys written at the same moment don't all expire at the same moment.</p>

<h3>Anti-pattern 9 — Caching errors forever, or never</h3>
<p>Caching a rejected promise forever turns one failed call into a permanent outage for that key. Never caching failures turns a database outage into a retry storm. Negative-cache failures for a few seconds, deliberately.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Design an LRU cache. (The opener — how do you run the 45 minutes?)</div>
  <div class="qa-answer">
    <p>I walk the LLD steps aloud. <strong>Requirements:</strong> O(1) <code>get</code>/<code>put</code>, bounded capacity, evict least-recently-used, generic types; I ask whether capacity is a count or bytes, whether updates count as use, and whether TTL or concurrency matter. <strong>Entities:</strong> a <code>Cache&lt;K, V&gt;</code> interface, an <code>LRUCache</code> composing a <code>Map&lt;K, Node&gt;</code> and a <code>DoublyLinkedList</code>, and a <code>Node</code>. Then the <strong>class diagram</strong>, the <strong>get/put flows</strong>, and the <strong>code</strong> (list primitives first). I aim for working code by minute 30, so the last 15 minutes go on follow-ups, which is where seniority shows.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why a doubly linked list? Why sentinels? Why does the node store the key?</div>
  <div class="qa-answer">
    <p><strong>Doubly linked:</strong> promoting a key unlinks an arbitrary node, which is O(1) with <code>prev</code> and an O(n) predecessor walk without it. <strong>Sentinels:</strong> every real node always has non-null neighbours, so <code>addToFront</code>/<code>remove</code> have no empty-list or first/last branches. <strong>Key in node:</strong> eviction holds the tail node and must also delete its map entry; the key is the only O(1) way back.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Add a TTL. What changes?</div>
  <div class="qa-answer">
    <p>Wrap values as <code>{ value, expiresAt }</code> and inject a <code>Clock</code>. On <code>get</code>, <code>peek</code> first; if expired, delete and report a miss (lazy expiry), otherwise promote. Lazy expiry alone lets cold expired entries hold memory, so add a bounded <code>prune(maxScan)</code> on an <code>unref()</code>'d timer (active expiry), which is the same split Redis uses. I build it as a Decorator so the tested core doesn't change. Things to settle: absolute vs sliding TTL, per-entry vs global, and whether expired entries must go before live ones (exact answer: a min-heap on <code>expiresAt</code>).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Now make it LFU — still O(1).</div>
  <div class="qa-answer">
    <p><code>key → { value, freq }</code>, <code>freq → ordered set of keys</code>, and <code>minFreq</code>. Access moves a key from bucket <code>f</code> to <code>f + 1</code>; if <code>f</code> empties and was the minimum, <code>minFreq = f + 1</code>. Insert sets <code>minFreq = 1</code>. Evict the oldest key in the <code>minFreq</code> bucket, which gives an LRU tie-break for free. Evict <em>before</em> inserting, or the new freq-1 key evicts itself. In production, add frequency decay or last week's hot keys never leave.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Is your cache thread-safe?</div>
  <div class="qa-answer">
    <p><strong>Node:</strong> the synchronous API is atomic, because the event loop runs one task at a time and <code>get</code>/<code>put</code> never yield. What Node doesn't protect is logic spanning an <code>await</code> (check → load → fill), and workers or cluster processes each get their own copy. <strong>Java:</strong> no, and a read-write lock doesn't fix it, because <code>get</code> reorders the list, so it's a write. Use one lock, lock striping (N segments by key hash: approximate LRU, much less contention), or Caffeine, which buffers reads and replays them under a lock.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. 500 requests miss the same key at the same moment. What happens and how do you fix it?</div>
  <div class="qa-answer">
    <p>Naively, 500 identical database queries: a cache stampede. Fix with <strong>single-flight</strong>: the first miss registers its loader promise in an in-flight map <em>before any <code>await</code></em>, and the other 499 join it; clear the entry in <code>finally</code> so errors aren't cached. Add TTL jitter so keys written together don't expire together, and refresh very hot keys ahead of expiry. Single-flight is per process, so across many servers add a short Redis lock (<code>SET key NX PX</code>) if N loads is still too many.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How would you let callers choose LRU, FIFO or LFU without touching the cache class?</div>
  <div class="qa-answer">
    <p>Strategy: an <code>EvictionPolicy&lt;K&gt;</code> with <code>recordInsert</code>/<code>recordAccess</code>/<code>recordRemoval</code>/<code>victim()</code>. The cache owns the <code>Map&lt;K, V&gt;</code> and asks the policy whom to evict. LRU is a <code>Set</code> with delete-and-re-add on access, FIFO makes <code>recordAccess</code> a no-op, and LFU keeps frequency buckets, all O(1). The cost is a second hash structure, so for one hot path I keep the fused hand-rolled version. New policy, zero edits to the cache: open/closed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Capacity should be 50 MB, not 1,000 entries. Changes?</div>
  <div class="qa-answer">
    <p>Add a weigher <code>sizeOf: (v: V) =&gt; number</code> and a running <code>totalBytes</code>; <code>put</code> adds the new size (minus the old one on update) and evicts from the tail <em>while</em> <code>totalBytes &gt; maxBytes</code>, which may take several evictions. Reject any single value larger than <code>maxBytes</code>, because it would flush everything and still not fit. JS object sizes are estimates (for example <code>Buffer.byteLength</code> of the serialised form), so pick one and be consistent. The <code>lru-cache</code> package calls these <code>maxSize</code> + <code>sizeCalculation</code> (check current docs).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. You run 8 instances behind a load balancer. In-process LRU, Redis, or both?</div>
  <div class="qa-answer">
    <p>In-process is orders of magnitude faster (a hash lookup vs a network round trip) but per instance: 8 copies, a lower combined hit rate, and an invalidation reaches one instance only. Redis is shared and consistent but costs a round trip and can fail. For read-heavy, slightly-stale-OK data (flags, config, catalogue) use <strong>both</strong>: a small L1 LRU with a seconds-long TTL in front of L2 Redis, with invalidations broadcast over pub/sub. Skip L1 for data that must be right immediately after a write (balances, permissions). See <a href="#/topic/be-caching">Caching</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How does Redis implement LRU, and why not exactly?</div>
  <div class="qa-answer">
    <p>No global linked list, which would cost two pointers per key and a write on every read. Each object stores a small last-access clock; when over <code>maxmemory</code>, Redis <strong>samples</strong> a few keys (<code>maxmemory-samples</code>, default 5) and evicts the best candidate, keeping a small pool of good candidates between rounds. With around 10 samples it's close to true LRU. Its LFU mode stores a tiny logarithmic counter with time decay. Lesson: at scale, approximate and cheap beats exact and expensive.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. (FDE scenario) A customer says: "Since you added caching, our Node service's memory climbs all day until it restarts, and p99 latency got worse." What do you do?</div>
  <div class="qa-answer">
    <p><strong>Data before theories:</strong> memory per pod over time, cache size/hit-rate metrics, and two heap snapshots a few hours apart, compared. Usual suspects: (1) <strong>no bound</strong>, a <code>Map</code> used as a cache or a TTL with no sweep; (2) <strong>key-cardinality explosion</strong>, where the key includes a timestamp, a full query string or a request ID, so hit rate is near zero and every request adds an entry; (3) <strong>huge values</strong> under a count limit instead of a byte limit; (4) evicted values retained by listeners or closures. The worse p99 is usually GC pauses on a bloated heap, or a stampede at expiry. Fix: bound by bytes, normalise keys, add jitter and single-flight, export <code>size</code>/<code>hitRate</code>/evictions with alerts, and send the customer a short write-up with before/after graphs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you test it properly?</div>
  <div class="qa-answer">
    <p>Scenario tests (eviction order, update without eviction, peek without promotion, capacity 1, validation) with a fake clock, so no <code>sleep</code>. Then a <strong>model-based property test</strong>: generate random <code>get</code>/<code>put</code>/<code>delete</code> sequences (for example with fast-check), run them against the cache and against a dumb O(n) array model, and assert identical results and order after every step. That catches pointer bugs hand-written cases miss. For the loading cache: a manually-resolved promise for single-flight, and a rejecting loader to prove errors aren't cached.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this case</div>
  <ul>
    <li>You state requirements and invariants before writing code.</li>
    <li>You can justify the doubly linked list, sentinels and key-in-node, not just recite them.</li>
    <li>You have working, generic, validated code by around minute 30.</li>
    <li>You say "get is a write" unprompted when concurrency comes up.</li>
    <li>You extend via Decorator or Strategy instead of editing the tested core.</li>
    <li>You distinguish Node event-loop atomicity from async races, and in-process from distributed caches.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Write a generic <code>LRUCache&lt;K, V&gt;</code> with sentinels from memory. What are its invariants?</div>
  <div class="qa-answer">
    <p>Write it in this order so something is always runnable: <code>Node</code> (key, value, prev, next) → <code>DoublyLinkedList</code> with sentinel <code>head</code>/<code>tail</code> and four primitives → <code>LRUCache</code> composing a private <code>Map&lt;K, Node&gt;</code> and the list → walk one test aloud. Before writing a line, state the four invariants, which double as the test plan: (1) <code>index.size</code> equals the number of real nodes in the list; (2) every node in the list is in the index under <code>node.key</code>, and vice versa; (3) <code>head.next</code> is the most-recent entry and <code>tail.prev</code> the least-recent; (4) after every public call, <code>size ≤ capacity</code>. <code>get</code>, <code>put</code>, <code>delete</code>, <code>peek</code> and <code>has</code> are O(1); space is O(capacity).</p>
  </div>
</div>
` },

  ]
});
