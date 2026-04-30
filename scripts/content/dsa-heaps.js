window.PREP_SITE.registerTopic({
  id: 'dsa-heaps',
  module: 'dsa',
  title: 'Heaps',
  estimatedReadTime: '40 min',
  tags: ['heap', 'priority-queue', 'min-heap', 'max-heap', 'top-k', 'kth-largest', 'merge-k-lists', 'sort'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>heap</strong> is a complete binary tree with the <strong>heap property</strong>: every parent is ≤ (min-heap) or ≥ (max-heap) its children. It's the canonical implementation of a <strong>priority queue</strong> — the data structure for "give me the smallest / largest item" in O(log n).</p>
<ul>
  <li><strong>Array-backed.</strong> No node objects; index <code>i</code>'s children are at <code>2i+1</code> and <code>2i+2</code>; parent at <code>(i-1)/2</code>.</li>
  <li><strong>Three operations:</strong> <em>peek</em> (O(1)), <em>push</em> (O(log n)), <em>pop</em> (O(log n)).</li>
  <li><strong>Build heap from array</strong> in O(n) via "siftDown from middle backwards" — surprisingly linear despite n × log n appearance.</li>
  <li><strong>JavaScript has NO built-in heap.</strong> Roll your own (~50 lines) or use a library — interview-ready hand-rolled implementations are mandatory.</li>
  <li><strong>Top-K pattern:</strong> for "kth largest" or "k smallest," maintain a min-heap of size k as you scan. O(n log k) — better than full sort O(n log n) when k ≪ n.</li>
  <li><strong>Median maintenance:</strong> two heaps (max-heap for lower half, min-heap for upper half) — peek both in O(1).</li>
  <li><strong>Merge K sorted lists:</strong> heap of head pointers. O(N log K).</li>
  <li><strong>Heaps are NOT sorted.</strong> Only the root is guaranteed extreme; siblings can be in any order.</li>
</ul>
<p><strong>Mantra:</strong> "Heap when you need fastest extreme. Min-heap of size K for top-K. Two heaps for median. Always hand-rolled in JS."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a heap?</h3>
<p>A heap is a binary tree (almost always represented as an array) with two properties:</p>
<ol>
  <li><strong>Complete:</strong> every level except possibly the last is fully filled, and the last level is filled left-to-right.</li>
  <li><strong>Heap property:</strong>
    <ul>
      <li><em>Min-heap:</em> every parent ≤ its children. Root is the minimum.</li>
      <li><em>Max-heap:</em> every parent ≥ its children. Root is the maximum.</li>
    </ul>
  </li>
</ol>

<h3>Why heaps exist</h3>
<p>You frequently need "the smallest / largest item right now." Sorted array gives O(1) peek but O(n) insert. Hash map gives O(1) insert but no extreme query. A balanced BST gives O(log n) for everything but is complex. <strong>Heap is the simplest data structure that gives O(log n) push and O(log n) pop with O(1) peek</strong> — and the constant factors are small thanks to array storage.</p>

<h3>The priority queue abstraction</h3>
<p>A priority queue is the abstract type; a heap is the canonical implementation. Other implementations: sorted list (O(n) insert), unsorted list (O(n) extract), Fibonacci heap (better asymptotics, terrible constants — almost never used). For real code, "priority queue" and "heap" are synonyms.</p>

<h3>Where heaps appear</h3>
<table>
  <thead><tr><th>Use case</th><th>Why a heap</th></tr></thead>
  <tbody>
    <tr><td>Dijkstra's shortest path</td><td>"Pop closest unvisited vertex" each step</td></tr>
    <tr><td>Prim's MST</td><td>"Pop edge with smallest weight" each step</td></tr>
    <tr><td>Top K elements</td><td>Maintain heap of size K; O(n log K)</td></tr>
    <tr><td>Median maintenance</td><td>Two heaps; O(log n) update, O(1) median</td></tr>
    <tr><td>Merge K sorted lists</td><td>Heap of K head pointers; O(N log K)</td></tr>
    <tr><td>Event simulation</td><td>"Next event by time"</td></tr>
    <tr><td>Task scheduler</td><td>"Run highest priority next"</td></tr>
    <tr><td>A* search</td><td>"Expand best heuristic state"</td></tr>
    <tr><td>Heap sort</td><td>O(n log n) sort, in-place</td></tr>
  </tbody>
</table>

<h3>Why interviewers love heaps</h3>
<ol>
  <li><strong>Pattern recognition:</strong> "kth largest" / "median" / "merge K" / "Dijkstra" all signal heap.</li>
  <li><strong>Implementation discipline:</strong> array math, sift up / sift down — small but fiddly.</li>
  <li><strong>Complexity reasoning:</strong> heap operations are textbook O(log n); top-K is the chance to compare heap vs sort.</li>
  <li><strong>JS gap:</strong> JS has no built-in priority queue, so candidates must implement one. Tests fluency.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You implement a min-heap in 30 lines without errors.</li>
  <li>You instinctively pick min-heap-of-size-K for "find K largest."</li>
  <li>You know <code>buildHeap</code> from an array is O(n), not O(n log n).</li>
  <li>You don't reach for the heap when the input is small enough to sort.</li>
  <li>You handle equal-priority items correctly (ties broken by insertion order or secondary key).</li>
  <li>You handle stale entries (lazy deletion in Dijkstra-style flows).</li>
</ul>

<h3>What heaps are NOT</h3>
<ul>
  <li><strong>Not sorted.</strong> The array <code>[1, 5, 3, 9, 6, 4]</code> is a valid min-heap (1 ≤ 5, 3; 5 ≤ 9, 6; 3 ≤ 4). Iterating is not in order.</li>
  <li><strong>Not searchable.</strong> "Is X in the heap?" is O(n). Use a Set for membership; the heap for ordering.</li>
  <li><strong>Not stable.</strong> Equal-priority items emerge in implementation-dependent order. If you need stability, store <code>[priority, insertCount, value]</code> tuples.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Array layout</h3>
<pre><code class="language-text">Index:  0  1  2  3  4  5  6  7  8  9
Value: [1, 3, 5, 7, 9, 8, 11, 15, 17, 14]

           1            ← index 0 (root)
          / \\
         3   5          ← indices 1, 2
        / \\ / \\
       7  9 8 11        ← indices 3, 4, 5, 6
      /\\ /
     15 17 14           ← indices 7, 8, 9

Parent of i: (i - 1) &gt;&gt; 1
Left child:  2i + 1
Right child: 2i + 2
</code></pre>

<h3>Sift up (after push)</h3>
<pre><code class="language-text">push(2) into min-heap [1, 3, 5, 7, 9, 8, 11, 15, 17, 14]
   ↓
[1, 3, 5, 7, 9, 8, 11, 15, 17, 14, 2]   ← append at end
                                    ^ index 10

Sift up: compare with parent (i-1)/2 = 4 → 9. 2 &lt; 9 → swap.
[1, 3, 5, 7, 2, 8, 11, 15, 17, 14, 9]
            ^                          (now at index 4)

Compare with parent (4-1)/2 = 1 → 3. 2 &lt; 3 → swap.
[1, 2, 5, 7, 3, 8, 11, 15, 17, 14, 9]
   ^                                   (now at index 1)

Compare with parent (1-1)/2 = 0 → 1. 2 &gt; 1 → stop.
</code></pre>
<p>O(log n) — at most "height of tree" swaps.</p>

<h3>Sift down (after pop)</h3>
<pre><code class="language-text">pop() from min-heap returns the root (smallest):
   ↓
1. Take root value (the answer).
2. Move last element to root position.
3. Sift down: swap with smaller child until heap property restored.

[14, 2, 5, 7, 3, 8, 11, 15, 17, 9]   ← 14 at root after move

Compare with min(2, 5) = 2 (index 1). 14 &gt; 2 → swap.
[2, 14, 5, 7, 3, 8, 11, 15, 17, 9]

Compare with min(7, 3) = 3 (index 4). 14 &gt; 3 → swap.
[2, 3, 5, 7, 14, 8, 11, 15, 17, 9]

Compare with children of index 4: index 9 (= 9) only. 14 &gt; 9 → swap.
[2, 3, 5, 7, 9, 8, 11, 15, 17, 14]

Index 9 has no children. Stop.
</code></pre>

<h3>Build heap in O(n)</h3>
<p>Counter-intuitive but provable. Start from index <code>(n/2) - 1</code> (last non-leaf) and sift down each. Lower nodes have shorter sift paths; the math works out to O(n), not O(n log n).</p>

<h3>Top-K pattern</h3>
<pre><code class="language-text">"Find K largest elements" given an unsorted array:

Approach 1: Sort, take last K.       O(n log n)
Approach 2: Quickselect.              O(n) average, O(n²) worst
Approach 3: Min-heap of size K.       O(n log K)

Heap approach:
  - Maintain a min-heap of size K.
  - For each new element:
      - If heap.size &lt; K, push.
      - Else if element &gt; heap.peek(), pop + push.
  - At end, heap contains K largest.
  - Root is the Kth largest.
</code></pre>

<h3>Median maintenance — two heaps</h3>
<pre><code class="language-text">Maintain a stream; query median anytime.

Use:
  lo = max-heap of "lower half"
  hi = min-heap of "upper half"

Invariants:
  lo.size === hi.size  OR  lo.size === hi.size + 1
  every element in lo ≤ every element in hi

Insert(x):
  if x ≤ lo.peek(): lo.push(x)
  else: hi.push(x)
  rebalance: if |lo| - |hi| &gt; 1, move lo.pop() to hi.
             if |hi| &gt; |lo|, move hi.pop() to lo.

Median():
  if equal sizes: avg(lo.peek(), hi.peek())
  else: lo.peek()
</code></pre>

<h3>The "lazy deletion" trick</h3>
<p>Heaps don't support efficient "delete arbitrary element" or "decrease key." Workaround: keep a separate map of "current valid version" per key. When popping, check if the popped entry is still valid; if not, discard and continue.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Min-heap implementation (JS)</h3>
<pre><code class="language-js">class MinHeap {
  constructor() { this.h = []; }
  size() { return this.h.length; }
  peek() { return this.h[0]; }

  push(x) {
    this.h.push(x);
    this.up(this.h.length - 1);
  }

  pop() {
    if (this.h.length === 0) return undefined;
    const top = this.h[0];
    const last = this.h.pop();
    if (this.h.length) {
      this.h[0] = last;
      this.down(0);
    }
    return top;
  }

  up(i) {
    while (i &gt; 0) {
      const p = (i - 1) &gt;&gt; 1;
      if (this.h[p] &lt;= this.h[i]) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  }

  down(i) {
    const n = this.h.length;
    while (true) {
      const l = 2*i + 1, r = 2*i + 2;
      let m = i;
      if (l &lt; n &amp;&amp; this.h[l] &lt; this.h[m]) m = l;
      if (r &lt; n &amp;&amp; this.h[r] &lt; this.h[m]) m = r;
      if (m === i) break;
      [this.h[i], this.h[m]] = [this.h[m], this.h[i]];
      i = m;
    }
  }
}
</code></pre>

<h3>Custom comparator</h3>
<pre><code class="language-js">class Heap {
  constructor(cmp = (a, b) =&gt; a - b) { this.h = []; this.cmp = cmp; }
  size() { return this.h.length; }
  peek() { return this.h[0]; }
  push(x) { this.h.push(x); this.up(this.h.length - 1); }
  pop() {
    if (!this.h.length) return undefined;
    const top = this.h[0], last = this.h.pop();
    if (this.h.length) { this.h[0] = last; this.down(0); }
    return top;
  }
  up(i) {
    while (i &gt; 0) {
      const p = (i - 1) &gt;&gt; 1;
      if (this.cmp(this.h[p], this.h[i]) &lt;= 0) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  }
  down(i) {
    const n = this.h.length;
    while (true) {
      const l = 2*i + 1, r = 2*i + 2;
      let m = i;
      if (l &lt; n &amp;&amp; this.cmp(this.h[l], this.h[m]) &lt; 0) m = l;
      if (r &lt; n &amp;&amp; this.cmp(this.h[r], this.h[m]) &lt; 0) m = r;
      if (m === i) break;
      [this.h[i], this.h[m]] = [this.h[m], this.h[i]];
      i = m;
    }
  }
}

// min-heap of [priority, value]
const pq = new Heap((a, b) =&gt; a[0] - b[0]);

// max-heap
const max = new Heap((a, b) =&gt; b - a);
</code></pre>

<h3>Heapify — build heap from array in O(n)</h3>
<pre><code class="language-js">function heapify(arr) {
  const h = new MinHeap();
  h.h = arr.slice();
  for (let i = (h.h.length &gt;&gt; 1) - 1; i &gt;= 0; i--) {
    h.down(i);
  }
  return h;
}
</code></pre>

<h3>Heap sort (in-place)</h3>
<pre><code class="language-js">function heapSort(arr) {
  const n = arr.length;
  // Build max-heap
  for (let i = (n &gt;&gt; 1) - 1; i &gt;= 0; i--) siftDown(arr, i, n);
  // Repeatedly extract max to the end
  for (let end = n - 1; end &gt; 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    siftDown(arr, 0, end);
  }
  return arr;
}
function siftDown(arr, i, n) {
  while (true) {
    const l = 2*i + 1, r = 2*i + 2;
    let m = i;
    if (l &lt; n &amp;&amp; arr[l] &gt; arr[m]) m = l;
    if (r &lt; n &amp;&amp; arr[r] &gt; arr[m]) m = r;
    if (m === i) break;
    [arr[i], arr[m]] = [arr[m], arr[i]];
    i = m;
  }
}
</code></pre>

<h3>Top K largest</h3>
<pre><code class="language-js">function topK(nums, k) {
  const heap = new MinHeap();
  for (const x of nums) {
    if (heap.size() &lt; k) heap.push(x);
    else if (x &gt; heap.peek()) { heap.pop(); heap.push(x); }
  }
  return heap.h;   // contents are the K largest (not sorted)
}
</code></pre>

<h3>Kth largest (single value)</h3>
<pre><code class="language-js">function kthLargest(nums, k) {
  const heap = new MinHeap();
  for (const x of nums) {
    heap.push(x);
    if (heap.size() &gt; k) heap.pop();
  }
  return heap.peek();
}
</code></pre>

<h3>Merge K sorted lists</h3>
<pre><code class="language-js">function mergeKLists(lists) {
  const heap = new Heap((a, b) =&gt; a.val - b.val);
  for (const node of lists) if (node) heap.push(node);
  const dummy = { val: 0, next: null };
  let tail = dummy;
  while (heap.size()) {
    const node = heap.pop();
    tail.next = node;
    tail = node;
    if (node.next) heap.push(node.next);
  }
  return dummy.next;
}
</code></pre>
<p>Time O(N log K) where N is total nodes, K is number of lists.</p>

<h3>Median from data stream — two heaps</h3>
<pre><code class="language-js">class MedianFinder {
  constructor() {
    this.lo = new Heap((a, b) =&gt; b - a);   // max-heap
    this.hi = new Heap((a, b) =&gt; a - b);   // min-heap
  }
  addNum(num) {
    if (this.lo.size() === 0 || num &lt;= this.lo.peek()) this.lo.push(num);
    else this.hi.push(num);

    // rebalance
    if (this.lo.size() &gt; this.hi.size() + 1) this.hi.push(this.lo.pop());
    else if (this.hi.size() &gt; this.lo.size()) this.lo.push(this.hi.pop());
  }
  findMedian() {
    if (this.lo.size() &gt; this.hi.size()) return this.lo.peek();
    return (this.lo.peek() + this.hi.peek()) / 2;
  }
}
</code></pre>

<h3>Top K Frequent Elements</h3>
<pre><code class="language-js">function topKFrequent(nums, k) {
  const freq = new Map();
  for (const x of nums) freq.set(x, (freq.get(x) ?? 0) + 1);
  const heap = new Heap((a, b) =&gt; a[1] - b[1]);   // min-heap by frequency
  for (const [val, count] of freq) {
    heap.push([val, count]);
    if (heap.size() &gt; k) heap.pop();
  }
  return heap.h.map(x =&gt; x[0]);
}
</code></pre>

<h3>K Closest Points to Origin</h3>
<pre><code class="language-js">function kClosest(points, k) {
  const heap = new Heap((a, b) =&gt; b[0] - a[0]);   // max-heap by distance
  for (const [x, y] of points) {
    const d = x*x + y*y;
    heap.push([d, [x, y]]);
    if (heap.size() &gt; k) heap.pop();
  }
  return heap.h.map(e =&gt; e[1]);
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Last Stone Weight (max-heap pop loop)</h3>
<pre><code class="language-js">function lastStoneWeight(stones) {
  const heap = new Heap((a, b) =&gt; b - a);   // max-heap
  for (const s of stones) heap.push(s);
  while (heap.size() &gt; 1) {
    const a = heap.pop();
    const b = heap.pop();
    if (a !== b) heap.push(a - b);
  }
  return heap.size() ? heap.peek() : 0;
}
</code></pre>

<h3>Example 2: Schedule meetings — minimum rooms</h3>
<pre><code class="language-js">function minMeetingRooms(intervals) {
  intervals.sort((a, b) =&gt; a[0] - b[0]);
  const ends = new MinHeap();   // min-heap of end times of in-use rooms
  for (const [s, e] of intervals) {
    if (ends.size() &amp;&amp; ends.peek() &lt;= s) ends.pop();
    ends.push(e);
  }
  return ends.size();
}
</code></pre>

<h3>Example 3: Reorganize String (greedy with max-heap)</h3>
<pre><code class="language-js">function reorganizeString(s) {
  const freq = new Map();
  for (const c of s) freq.set(c, (freq.get(c) ?? 0) + 1);
  for (const v of freq.values()) {
    if (v &gt; (s.length + 1) / 2) return '';
  }
  const heap = new Heap((a, b) =&gt; b[1] - a[1]);
  for (const [c, v] of freq) heap.push([c, v]);
  let prev = null, out = '';
  while (heap.size()) {
    const cur = heap.pop();
    out += cur[0];
    cur[1]--;
    if (prev &amp;&amp; prev[1] &gt; 0) heap.push(prev);
    prev = cur;
  }
  return out;
}
</code></pre>

<h3>Example 4: Sliding Window Maximum (deque is faster, but heap works)</h3>
<pre><code class="language-js">function maxSlidingWindow(nums, k) {
  // Heap-based: O(n log n)
  const heap = new Heap((a, b) =&gt; b[0] - a[0]);
  const out = [];
  for (let i = 0; i &lt; nums.length; i++) {
    heap.push([nums[i], i]);
    while (heap.peek()[1] &lt;= i - k) heap.pop();   // lazy delete out-of-window
    if (i &gt;= k - 1) out.push(heap.peek()[0]);
  }
  return out;
}
</code></pre>

<h3>Example 5: Find Median from Data Stream</h3>
<p>See MedianFinder in Mechanics — full worked-out two-heap solution.</p>

<h3>Example 6: Connect Sticks at Min Cost</h3>
<pre><code class="language-js">function connectSticks(sticks) {
  const heap = new MinHeap();
  for (const s of sticks) heap.push(s);
  let cost = 0;
  while (heap.size() &gt; 1) {
    const a = heap.pop();
    const b = heap.pop();
    cost += a + b;
    heap.push(a + b);
  }
  return cost;
}
</code></pre>

<h3>Example 7: Task Scheduler with cooldown</h3>
<pre><code class="language-js">function leastInterval(tasks, n) {
  const freq = new Map();
  for (const t of tasks) freq.set(t, (freq.get(t) ?? 0) + 1);
  const heap = new Heap((a, b) =&gt; b - a);
  for (const v of freq.values()) heap.push(v);

  let time = 0;
  while (heap.size()) {
    const tmp = [];
    for (let i = 0; i &lt;= n; i++) {
      if (heap.size()) {
        const top = heap.pop();
        if (top &gt; 1) tmp.push(top - 1);
      }
      time++;
      if (heap.size() === 0 &amp;&amp; tmp.length === 0) break;
    }
    for (const x of tmp) heap.push(x);
  }
  return time;
}
</code></pre>

<h3>Example 8: K Pairs with Smallest Sums</h3>
<pre><code class="language-js">function kSmallestPairs(nums1, nums2, k) {
  const heap = new Heap((a, b) =&gt; a[0] - b[0]);
  for (let i = 0; i &lt; Math.min(nums1.length, k); i++) {
    heap.push([nums1[i] + nums2[0], i, 0]);
  }
  const out = [];
  while (out.length &lt; k &amp;&amp; heap.size()) {
    const [, i, j] = heap.pop();
    out.push([nums1[i], nums2[j]]);
    if (j + 1 &lt; nums2.length) {
      heap.push([nums1[i] + nums2[j + 1], i, j + 1]);
    }
  }
  return out;
}
</code></pre>

<h3>Example 9: Rate Limiter via Heap</h3>
<pre><code class="language-js">// "Allow at most N requests in any T-second window."
class RateLimiter {
  constructor(n, windowMs) {
    this.n = n;
    this.windowMs = windowMs;
    this.heap = new MinHeap();
  }
  allow(now = Date.now()) {
    while (this.heap.size() &amp;&amp; this.heap.peek() &lt;= now - this.windowMs) {
      this.heap.pop();
    }
    if (this.heap.size() &lt; this.n) {
      this.heap.push(now);
      return true;
    }
    return false;
  }
}
</code></pre>

<h3>Example 10: Heap-based scheduler with priority</h3>
<pre><code class="language-js">class Scheduler {
  constructor() { this.heap = new Heap((a, b) =&gt; a.priority - b.priority); }
  schedule(task, priority) { this.heap.push({ task, priority }); }
  next() { return this.heap.pop()?.task; }
  size() { return this.heap.size(); }
}

const s = new Scheduler();
s.schedule('write report', 3);
s.schedule('FIRE', 1);             // urgent
s.schedule('coffee', 5);
s.next();   // 'FIRE'
s.next();   // 'write report'
s.next();   // 'coffee'
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Empty heap pop</h3>
<p>Implementations should return <code>undefined</code> (or throw, depending on convention). Never return a stale value.</p>

<h3>Single element</h3>
<p>Push 1 element, pop, peek — all should work without sift up/down because there's nothing to swap with.</p>

<h3>Duplicate priorities</h3>
<p>Heap doesn't preserve insertion order among equals. If your problem requires FIFO among same-priority items, store <code>[priority, insertionIndex, value]</code> tuples and break ties on the index.</p>

<h3>Comparator returning truthy / falsy</h3>
<pre><code class="language-js">// BAD — boolean instead of number
new Heap((a, b) =&gt; a &gt; b);   // returns true/false, treated as 1/0; incorrect ordering

// GOOD
new Heap((a, b) =&gt; a - b);
</code></pre>

<h3>Float comparator overflow</h3>
<p>For huge numbers or unsigned 32-bit, <code>a - b</code> can overflow. Use explicit <code>a &lt; b ? -1 : a &gt; b ? 1 : 0</code>.</p>

<h3>Heap with mutable items</h3>
<p>If you mutate an item in place after inserting, the heap property may break. The heap doesn't auto-rebalance. Either:</p>
<ul>
  <li>Treat heap entries as immutable.</li>
  <li>Reinsert the entry as a new entry; use lazy deletion of the old one.</li>
</ul>

<h3>Decrease-key not supported natively</h3>
<p>Want to "lower the priority of an existing entry"? Standard binary heap doesn't expose this efficiently. Workaround: insert a new entry with the new priority; on pop, check if it's the latest version (using a Map of "current best per key"); discard otherwise. Used in Dijkstra, A*.</p>

<h3>Heap of size 0 after construction</h3>
<p>Always check <code>heap.size() &gt; 0</code> before peek/pop. The most common runtime crash in heap-using algorithms.</p>

<h3>Top-K with K = 0 or K &gt; n</h3>
<p>K = 0: return empty. K &gt; n: return all sorted (or unsorted, per spec). Handle both at the boundary.</p>

<h3>Two-heap median balance violation</h3>
<p>Forgetting to rebalance after every insert leads to wrong median. Ensure the invariant <code>|lo.size - hi.size| ≤ 1</code> after every operation.</p>

<h3>Large-priority precision loss</h3>
<p>JS numbers are 64-bit floats. Priorities like timestamps in nanoseconds (~10¹⁸) lose precision. Use BigInt or split into [seconds, nanos] tuples.</p>

<h3>Heap inside a hot loop</h3>
<p>Allocating a new heap per iteration in a recursive algorithm is expensive. Reuse where possible; instantiate once outside the loop.</p>

<h3>Heap sort stability</h3>
<p>Heap sort is NOT stable: equal-key items may emerge in arbitrary order. If stability is required, use merge sort or stable Timsort (JS's <code>Array.prototype.sort</code> is stable since ES2019).</p>

<h3>Min-heap of objects without comparator</h3>
<pre><code class="language-js">const h = new Heap();   // default cmp: a - b
h.push({ pri: 1 });     // NaN comparisons; heap property violated silently
// FIX — provide cmp
const h = new Heap((a, b) =&gt; a.pri - b.pri);
</code></pre>

<h3>Memory churn from <code>Array.shift()</code></h3>
<p>Some "queue" implementations use shift; heap typically doesn't. But if you store the heap array in a structure with <code>shift()</code> elsewhere, beware of the O(n) shift cost.</p>

<h3>Heap as a min-heap when you need max</h3>
<p>Common bug: pasting min-heap code, expecting max behavior. Either flip the comparator or negate values. Negation breaks for objects; flip the comparator.</p>

<h3>n &lt; k for top-K problems</h3>
<p>If input has fewer than K elements, return all. Don't pad with placeholders or throw.</p>

<h3>Lazy deletion accumulating</h3>
<p>If 99% of heap entries are stale (Dijkstra on big graphs), the heap grows. Periodically rebuild from scratch, or use indexed heap with decrease-key.</p>

<h3>Recursive sift overflowing stack</h3>
<p>A recursive sift down on a heap of 10⁷ elements has log₂(10⁷) ≈ 23 frames — fine. But naive implementations using deep recursion through unrelated objects can overflow. Iterative sift loops are the standard.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: comparator returns boolean</h3>
<pre><code class="language-js">// BAD
const cmp = (a, b) =&gt; a &gt; b;   // returns true/false (1/0); not a proper -, 0, +

// GOOD
const cmp = (a, b) =&gt; a - b;
// or for non-numeric:
const cmp = (a, b) =&gt; a &lt; b ? -1 : a &gt; b ? 1 : 0;
</code></pre>

<h3>Bug 2: forgetting to handle empty</h3>
<pre><code class="language-js">while (true) {
  const x = heap.pop();
  process(x);   // x is undefined when heap is empty → crash
}

// FIX
while (heap.size()) {
  const x = heap.pop();
  process(x);
}
</code></pre>

<h3>Bug 3: top-K with wrong heap direction</h3>
<pre><code class="language-js">// "K largest" — use MIN-heap (kick out smallest when too big)
// "K smallest" — use MAX-heap (kick out largest when too big)
// Backwards is the most common bug.
</code></pre>

<h3>Bug 4: pop without saving the result</h3>
<pre><code class="language-js">// BAD — nothing kept
heap.pop();

// GOOD
const x = heap.pop();
</code></pre>

<h3>Bug 5: pushing during iteration over array snapshot</h3>
<pre><code class="language-js">// Iterating heap.h directly during mutation gives undefined order
for (const x of heap.h) heap.push(...);   // ❌

// Instead, drain via pop:
while (heap.size()) { const x = heap.pop(); /* ... */ }
</code></pre>

<h3>Bug 6: stale entries unhandled in Dijkstra</h3>
<pre><code class="language-js">// BAD — relax based on a stale entry
const [d, u] = pq.pop();
for (const [v, w] of adj[u]) { /* relax with d as if current */ }

// GOOD
if (d &gt; dist[u]) continue;
</code></pre>

<h3>Bug 7: heap as a sorted array</h3>
<pre><code class="language-js">// MISCONCEPTION — heap.h is NOT sorted, only root is the extreme
heap.h[1];   // not the second smallest in general
</code></pre>

<h3>Bug 8: median two-heap invariant violation</h3>
<pre><code class="language-js">// Forgetting to rebalance after insert
addNum(x) {
  if (...) lo.push(x); else hi.push(x);
  // forgot rebalance step
}
</code></pre>

<h3>Bug 9: building heap by N pushes instead of heapify</h3>
<pre><code class="language-js">// O(N log N)
const heap = new MinHeap();
for (const x of arr) heap.push(x);

// O(N)
heap.h = arr.slice();
for (let i = (arr.length &gt;&gt; 1) - 1; i &gt;= 0; i--) heap.down(i);
</code></pre>

<h3>Bug 10: priority inversion via mutation</h3>
<pre><code class="language-js">const item = { pri: 5, value: 'x' };
heap.push(item);
item.pri = 1;   // heap doesn't know; root may now be wrong
</code></pre>

<h3>Anti-pattern 1: heap when sort suffices</h3>
<p>If the input is small enough to sort once and you don't need streaming behavior, just sort. Heap shines when you need ordered access during ongoing inserts/removes.</p>

<h3>Anti-pattern 2: full sort for "top K"</h3>
<p>Sorting for "give me the 10 largest" of 10⁷ items wastes O(n log n). Heap of size K is O(n log K).</p>

<h3>Anti-pattern 3: searching the heap</h3>
<p>"Is X in this heap?" requires O(n) scan. Pair the heap with a Set if you need membership too.</p>

<h3>Anti-pattern 4: arbitrary deletion</h3>
<p>Heap doesn't support efficient "remove this specific element." Either use lazy deletion + Map of valid versions, or switch to a balanced BST / indexed priority queue.</p>

<h3>Anti-pattern 5: rebuilding the heap on every change</h3>
<p>If you find yourself <code>heap = new MinHeap(arr)</code> in a loop, you're doing it wrong. Keep one heap; insert / remove incrementally.</p>

<h3>Anti-pattern 6: ignoring tie-breaking</h3>
<p>If priorities tie, output may be deterministic in a sequence but unintuitive. If your spec says "FIFO among ties," store insertion index in the comparator.</p>

<h3>Anti-pattern 7: heap of huge structs</h3>
<p>Putting 1MB objects in the heap means every sift-up/down swaps the references; that's fine. But cloning per push is expensive — use references or numeric keys.</p>

<h3>Anti-pattern 8: 1-indexed vs 0-indexed mixups</h3>
<p>Some textbook implementations use 1-indexed arrays (root at index 1). JS uses 0-indexed. Mixing the formulas (parent at <code>i / 2</code> vs <code>(i-1) &gt;&gt; 1</code>) is a frequent bug.</p>

<h3>Anti-pattern 9: trusting JS PriorityQueue libraries blindly</h3>
<p>Several npm packages claim "priority queue" but have O(n log n) push or buggy edge cases. For interviews you'll roll your own anyway. For production, audit perf.</p>

<h3>Anti-pattern 10: not benchmarking on the actual data shape</h3>
<p>Heap perf is consistent O(log n) but constants matter. For very small n (&lt; 32), naive linear scans win. Profile when perf matters.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 14 problems worth memorizing patterns for</h3>
<table>
  <thead><tr><th>Problem</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>Kth Largest in Array</td><td>Min-heap of size K</td></tr>
    <tr><td>Kth Largest in Stream</td><td>Same, persistent</td></tr>
    <tr><td>Top K Frequent Elements</td><td>Map + min-heap by frequency</td></tr>
    <tr><td>K Closest Points to Origin</td><td>Max-heap by distance, size K</td></tr>
    <tr><td>Merge K Sorted Lists</td><td>Min-heap of head pointers</td></tr>
    <tr><td>Find Median from Data Stream</td><td>Two heaps (max + min)</td></tr>
    <tr><td>Last Stone Weight</td><td>Max-heap; pop two, push diff</td></tr>
    <tr><td>Reorganize String</td><td>Max-heap by frequency; defer last placed</td></tr>
    <tr><td>Task Scheduler</td><td>Max-heap by frequency; cooldown loop</td></tr>
    <tr><td>Connect Sticks at Min Cost</td><td>Min-heap; pop two, push sum, repeat</td></tr>
    <tr><td>Sliding Window Median</td><td>Two heaps (with lazy deletion)</td></tr>
    <tr><td>Min Meeting Rooms</td><td>Sort starts; min-heap of ends</td></tr>
    <tr><td>K Smallest Pairs</td><td>Heap with index tracking</td></tr>
    <tr><td>Dijkstra / Prim</td><td>Min-heap by cumulative distance / edge weight</td></tr>
  </tbody>
</table>

<h3>Pattern selection cheatsheet</h3>
<table>
  <thead><tr><th>Problem signal</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"K largest / smallest"</td><td>Heap of size K (opposite direction!)</td></tr>
    <tr><td>"Median in a stream"</td><td>Two heaps</td></tr>
    <tr><td>"Schedule with priorities"</td><td>Heap by priority</td></tr>
    <tr><td>"Merge K sorted things"</td><td>Heap of K pointers</td></tr>
    <tr><td>"Repeatedly extract extreme"</td><td>Heap</td></tr>
    <tr><td>"Greedy + 'always smallest first'"</td><td>Heap</td></tr>
    <tr><td>"Window of size K with extremes"</td><td>Heap with lazy delete OR monotonic deque</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Implement min-heap with <code>push</code>, <code>pop</code>, <code>peek</code>, <code>size</code>.</li>
  <li>Same with custom comparator for max-heap and tuple-key heap.</li>
  <li>Top K frequent elements.</li>
  <li>Find Median from Data Stream.</li>
  <li>Merge K sorted lists.</li>
  <li>Heap sort.</li>
  <li>Build heap from array in O(n) (heapify).</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Comparator returning boolean — heap order broken silently.</li>
  <li>Top-K using max-heap when you want K largest — should be min-heap of size K.</li>
  <li>Two-heap median forgetting to rebalance — wrong median.</li>
  <li>Building heap by N pushes — O(N log N) when O(N) heapify exists.</li>
  <li>Stale entries in Dijkstra unhandled — relaxation on outdated distances.</li>
  <li>Mutating items after push without re-heapifying — silent corruption.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Implementation fluency</td><td>You hand-roll a heap in 30 lines without errors.</td></tr>
    <tr><td>Pattern selection</td><td>Top-K, median, merge-K all signal heap immediately.</td></tr>
    <tr><td>Direction discipline</td><td>You correctly choose min vs max for the K-largest pattern.</td></tr>
    <tr><td>Heapify awareness</td><td>You volunteer O(n) build instead of O(n log n).</td></tr>
    <tr><td>Lazy-deletion fluency</td><td>You handle stale entries in heap-based Dijkstra / sliding-window-median.</td></tr>
    <tr><td>Tie-break awareness</td><td>You ask about ordering of equal-priority items.</td></tr>
    <tr><td>JS-specific awareness</td><td>You note JS has no built-in heap; you implement one.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Network request priority queues:</strong> some libraries (e.g., custom RN networking) use heaps to schedule requests by priority.</li>
  <li><strong>Animation engines:</strong> Reanimated and similar may use priority queues internally for tween scheduling.</li>
  <li><strong>Event systems:</strong> task scheduler / EventBus with priority levels uses a heap for next-task selection.</li>
  <li><strong>Cache eviction:</strong> some LFU caches use heaps to find min-frequency entries; but LRU is more common (doubly linked list).</li>
  <li><strong>Background sync:</strong> persistent task queues across app launches; heap by priority + retry timestamp.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why is heapify O(n) and not O(n log n)?"</em> — Most nodes are near the bottom (n/2 leaves). Their sift-down distance is 0. Internal nodes higher up have shorter average sift distance than log n. Sum bounded by n.</li>
  <li><em>"Why not always use a heap instead of sorting?"</em> — If you need ordered access to ALL n items, full sort is O(n log n) and the constants are smaller. Heap shines when you need only some extremes or when items arrive over time.</li>
  <li><em>"What's the difference between binary heap and Fibonacci heap?"</em> — Fibonacci has theoretically better amortized bounds (O(1) decrease-key). In practice, binary heap is faster due to better constants and cache locality. Fibonacci heap is a theoretical curiosity.</li>
  <li><em>"How does Dijkstra use a heap?"</em> — Min-heap keyed by tentative distance. Pop the closest unvisited; relax its neighbors; push (newDist, vertex) for any improved distance. Stale entries stick around; check on pop.</li>
  <li><em>"Why two heaps for median?"</em> — Each peek gives you the boundary of half the data in O(1). Insert and rebalance in O(log n). Total O(log n) update, O(1) query — better than O(n) on a sorted array or O(log n) BST + O(n) traversal for median.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd implement an indexed heap with decrease-key for cleaner Dijkstra (no stale entries)."</li>
  <li>"I'd benchmark binary heap vs pairing heap for our specific workload."</li>
  <li>"I'd add a stable comparator (insertion index tie-break) so equal-priority items emit in FIFO order."</li>
  <li>"I'd extract the heap into a small library — JS's missing built-in is annoying enough that we end up rewriting it on every project."</li>
  <li>"I'd profile heap allocation pressure; in a hot loop with millions of pushes, the array growth strategy matters."</li>
</ul>
`
    }
  ]
});
