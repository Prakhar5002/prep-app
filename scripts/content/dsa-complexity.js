window.PREP_SITE.registerTopic({
  id: 'dsa-complexity',
  module: 'DSA',
  title: 'Complexity Analysis',
  estimatedReadTime: '24 min',
  tags: ['dsa', 'complexity', 'big-o', 'time', 'space', 'amortized', 'asymptotic'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Complexity analysis is how we describe an algorithm's resource usage as a function of input size. The dominant notation is <strong>Big O</strong>: an upper bound that captures the worst-case growth rate.</p>
<ul>
  <li><strong>O(1)</strong> — constant. Hash lookup, array access, single arithmetic.</li>
  <li><strong>O(log n)</strong> — logarithmic. Binary search, balanced tree operations.</li>
  <li><strong>O(n)</strong> — linear. Single pass over an array.</li>
  <li><strong>O(n log n)</strong> — linearithmic. Merge sort, heap sort, optimal comparison sorts.</li>
  <li><strong>O(n²)</strong> — quadratic. Nested loops over the same input.</li>
  <li><strong>O(2ⁿ)</strong> — exponential. Naive recursion (Fibonacci, subsets).</li>
  <li><strong>O(n!)</strong> — factorial. Permutations.</li>
</ul>
<ul>
  <li><strong>Space complexity</strong> — extra memory used (excluding input). Includes call stack for recursive solutions.</li>
  <li><strong>Amortized</strong> — average cost per operation over many operations. Dynamic array push: O(1) amortized despite occasional O(n) resize.</li>
  <li><strong>Worst / average / best</strong> case — Big O is usually worst-case. Sometimes specifying matters.</li>
  <li><strong>Constants matter in practice</strong> — O(2n) and O(n) are both linear, but 2n is twice as slow. Big O hides constants; benchmark for real numbers.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Big O is not "how fast" — it's "how it scales with input." Drop constants and lower-order terms; keep the dominant. Always state space alongside time. Recursive solutions cost O(depth) stack space.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why we measure complexity</h3>
<p>Two algorithms might both work; one is 1000× faster on a 10M-element input. Without complexity analysis, you can't predict scale. In interviews and real systems: choosing the wrong algorithm at design time leads to expensive rewrites or production fires.</p>

<h3>Big O — formal vs intuitive</h3>
<p>Formally: <code>f(n) = O(g(n))</code> if there exist constants <code>c, n₀</code> such that <code>f(n) ≤ c·g(n)</code> for all <code>n ≥ n₀</code>. Intuitively: "f grows no faster than g, ignoring constants and small inputs."</p>
<p>For interviews: drop constants and lower-order terms. <code>3n² + 5n + 7</code> is <code>O(n²)</code>.</p>

<h3>Big Θ vs Big O vs Big Ω</h3>
<ul>
  <li><strong>O</strong> (upper bound) — "f grows at most this fast."</li>
  <li><strong>Ω</strong> (lower bound) — "f grows at least this fast."</li>
  <li><strong>Θ</strong> (tight bound) — both upper and lower; "f grows exactly this fast."</li>
</ul>
<p>In practice "O(n)" usually means tight — strict upper bounds without lower bounds are rarely useful.</p>

<h3>Why time AND space</h3>
<p>An algorithm using O(n) time + O(n) space might be unacceptable when memory is tight. Always state both. Recursive solutions especially: O(log n) time but O(n) stack space if not tail-call optimized (most JS engines don't TCO).</p>

<h3>Why amortized matters</h3>
<p>Some operations are usually fast but occasionally slow:</p>
<ul>
  <li><strong>Dynamic array push</strong>: usually O(1); when capacity is full, O(n) to grow + copy. Amortized: O(1) — N pushes do O(N) total work.</li>
  <li><strong>Hash table insert</strong>: usually O(1); rehash on resize is O(n). Amortized O(1).</li>
  <li><strong>Splay tree access</strong>: any single op may be O(n), but sequence of ops is O(n log n).</li>
</ul>
<p>Amortized is the average per-op cost over a long sequence. Different from average-case (random input).</p>

<h3>Why "drop constants"</h3>
<p>Big O describes growth rate. <code>2n</code> and <code>5n</code> are both linear — same scaling shape. The constant depends on hardware, language, cache effects — Big O abstracts those away. <strong>But</strong>: in practice, constants matter for absolute speed. A 2× constant difference can be the deciding factor.</p>

<h3>Why we ignore lower-order terms</h3>
<p><code>n² + n + 1</code> is dominated by <code>n²</code> for large n. The lower terms become negligible. So <code>O(n²)</code>, not <code>O(n² + n + 1)</code>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "growth rate" picture</h3>
<div class="diagram">
<pre>
 Input n     O(1)   O(log n)   O(n)      O(n log n)   O(n²)        O(2ⁿ)
   10        1       3          10        33           100          1,024
   100       1       7          100       664          10,000       ~10³⁰
   1,000     1       10         1,000     9,966        1,000,000    overflow
   10,000    1       13         10,000    132,877      100,000,000  ...
   1M        1       20         1M        20M          10¹²         ...

 Constant: free.
 Logarithmic: virtually free.
 Linear: scales perfectly.
 Linearithmic: still very good.
 Quadratic: breaks down at ~10⁴.
 Exponential: breaks down at ~30 input.</pre>
</div>

<h3>The "common operations" cheat sheet</h3>
<table>
  <thead><tr><th>Data structure</th><th>Access</th><th>Search</th><th>Insert</th><th>Delete</th></tr></thead>
  <tbody>
    <tr><td>Array</td><td>O(1)</td><td>O(n)</td><td>O(n) (middle)</td><td>O(n) (middle)</td></tr>
    <tr><td>Sorted array (binary search)</td><td>O(1)</td><td>O(log n)</td><td>O(n)</td><td>O(n)</td></tr>
    <tr><td>Linked list</td><td>O(n)</td><td>O(n)</td><td>O(1) (front)</td><td>O(1) (with ref)</td></tr>
    <tr><td>Hash table</td><td>—</td><td>O(1) avg, O(n) worst</td><td>O(1) avg</td><td>O(1) avg</td></tr>
    <tr><td>BST (balanced)</td><td>—</td><td>O(log n)</td><td>O(log n)</td><td>O(log n)</td></tr>
    <tr><td>Heap</td><td>—</td><td>O(n)</td><td>O(log n)</td><td>O(log n) (top)</td></tr>
    <tr><td>Trie</td><td>—</td><td>O(L)</td><td>O(L)</td><td>O(L)</td></tr>
    <tr><td>Stack / Queue (deque)</td><td>—</td><td>O(n)</td><td>O(1)</td><td>O(1)</td></tr>
  </tbody>
</table>

<h3>The "loop counting" picture</h3>
<pre><code>// O(1) — single op
return arr[i];

// O(n) — single loop over n
for (let i = 0; i &lt; n; i++) sum += arr[i];

// O(n) — two sequential loops, still linear
for (let i = 0; i &lt; n; i++) ...;
for (let j = 0; j &lt; n; j++) ...;

// O(n²) — nested loops over n
for (let i = 0; i &lt; n; i++)
  for (let j = 0; j &lt; n; j++) ...

// O(n log n) — divide and conquer with linear merge
function mergesort(arr) {
  if (arr.length &lt;= 1) return arr;
  const mid = arr.length / 2;
  return merge(mergesort(arr.slice(0, mid)), mergesort(arr.slice(mid)));
}

// O(2ⁿ) — branching recursion without memoization
function fib(n) {
  if (n &lt; 2) return n;
  return fib(n-1) + fib(n-2);
}</code></pre>

<h3>The "space" picture</h3>
<pre><code>// O(1) extra space — fixed scalars
function reverseInPlace(arr) {
  let l = 0, r = arr.length - 1;
  while (l &lt; r) { [arr[l], arr[r]] = [arr[r], arr[l]]; l++; r--; }
}

// O(n) extra — new array
function reverse(arr) { return arr.slice().reverse(); }

// O(n) stack space — recursion depth
function dfs(node) {
  if (!node) return;
  dfs(node.left);
  dfs(node.right);
}
// Worst case (skewed tree): O(n) stack frames

// O(log n) stack space — balanced tree
// Worst case (left/right balanced): O(log n) frames</code></pre>

<h3>The "drop constants" picture</h3>
<pre><code>O(2n)        → O(n)         (constant 2 dropped)
O(n + 1000)  → O(n)         (constant 1000 dropped)
O(n² + n)    → O(n²)        (lower-order n dropped)
O(3n² + 5n)  → O(n²)        (3 dropped, 5n absorbed)
O(log₂ n)    → O(log n)     (logarithm base is a constant)</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Big O tells me how fast my code runs." It doesn't. It tells you the growth shape. Two O(n) algorithms can differ by 100× in absolute speed due to constants (memory access patterns, cache, language overhead). Always benchmark when absolute performance matters.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>How to analyze a function</h3>
<ol>
  <li>Count operations as a function of input size n.</li>
  <li>Drop lower-order terms.</li>
  <li>Drop constant factors.</li>
  <li>State the result with Big O.</li>
  <li>State space complexity separately, including auxiliary structures + recursion stack.</li>
</ol>

<h3>Common patterns</h3>
<pre><code>// Pattern: single loop → O(n)
for (let i = 0; i &lt; n; i++) work();

// Pattern: nested loops over same n → O(n²)
for (let i = 0; i &lt; n; i++)
  for (let j = 0; j &lt; n; j++) work();

// Pattern: nested loops, inner over remaining → O(n²)
// (1+2+3+...+n) / 2 = n²/2 → still O(n²)
for (let i = 0; i &lt; n; i++)
  for (let j = i; j &lt; n; j++) work();

// Pattern: halve each iteration → O(log n)
let i = n;
while (i &gt; 0) { i = Math.floor(i / 2); work(); }

// Pattern: tree depth → O(log n) for balanced, O(n) worst
function search(node, target) {
  if (!node) return null;
  if (node.value === target) return node;
  return target &lt; node.value ? search(node.left, target) : search(node.right, target);
}

// Pattern: recursion with two children → O(2^h) worst, O(n) for tree
function dfs(node) {
  if (!node) return;
  dfs(node.left);
  dfs(node.right);
}
// For a tree: each node visited once → O(n)
// For unmemoized fib(n): O(2^n) because no shared subproblems</code></pre>

<h3>Multi-variable complexity</h3>
<pre><code>// Two inputs → both in big-O notation
function intersect(a, b) {
  const set = new Set(a);
  return b.filter(x =&gt; set.has(x));
}
// Time: O(a + b)
// Space: O(a)

// Don't combine: O(a + b) is more informative than O(n) where n = max(a, b)</code></pre>

<h3>Recursive analysis — Master Theorem</h3>
<p>Recurrences of form <code>T(n) = aT(n/b) + f(n)</code>:</p>
<ul>
  <li>If <code>f(n) = O(n^c)</code> with <code>c &lt; log_b(a)</code>: <strong>T(n) = O(n^(log_b a))</strong></li>
  <li>If <code>f(n) = O(n^c)</code> with <code>c = log_b(a)</code>: <strong>T(n) = O(n^c log n)</strong></li>
  <li>If <code>f(n) = O(n^c)</code> with <code>c &gt; log_b(a)</code>: <strong>T(n) = O(f(n))</strong></li>
</ul>
<p>Examples:</p>
<ul>
  <li>Merge sort: <code>T(n) = 2T(n/2) + O(n)</code> → <code>O(n log n)</code></li>
  <li>Binary search: <code>T(n) = T(n/2) + O(1)</code> → <code>O(log n)</code></li>
  <li>Fast multiplication (Karatsuba): <code>T(n) = 3T(n/2) + O(n)</code> → <code>O(n^log₂3) ≈ O(n^1.58)</code></li>
</ul>

<h3>Amortized analysis</h3>
<pre><code>// Dynamic array — amortized O(1) push
class DynamicArray {
  constructor() { this.cap = 1; this.size = 0; this.data = new Array(this.cap); }
  push(x) {
    if (this.size === this.cap) {
      this.cap *= 2;
      const newData = new Array(this.cap);
      for (let i = 0; i &lt; this.size; i++) newData[i] = this.data[i];
      this.data = newData;
    }
    this.data[this.size++] = x;
  }
}
// Most pushes O(1). Resize is O(n).
// Total cost of N pushes: 1 + 2 + 4 + ... + N + N (last resize) = ~3N
// Per-push amortized: O(1).</code></pre>

<h3>Worst case vs average case vs expected</h3>
<pre><code>// Quicksort
// Worst case: O(n²) — bad pivot every time
// Average case: O(n log n) — random pivot

// Hash table lookup
// Worst case: O(n) — all keys hash to same bucket
// Average case: O(1) — uniform distribution

// In interviews, state both when meaningful: "O(1) average, O(n) worst"</code></pre>

<h3>Time-space tradeoffs</h3>
<table>
  <thead><tr><th>Problem</th><th>Time-optimal</th><th>Space-optimal</th></tr></thead>
  <tbody>
    <tr><td>Fibonacci</td><td>O(n) with array memo</td><td>O(1) with two variables</td></tr>
    <tr><td>Find duplicates</td><td>O(n) time + O(n) hash set</td><td>O(n²) time, O(1) space (nested scan)</td></tr>
    <tr><td>Sort</td><td>O(n log n) merge sort, O(n) extra space</td><td>O(n²) bubble sort, O(1) extra</td></tr>
  </tbody>
</table>

<h3>The "what does it mean for n to be large" picture</h3>
<table>
  <thead><tr><th>n</th><th>O(n)</th><th>O(n log n)</th><th>O(n²)</th><th>O(2ⁿ)</th></tr></thead>
  <tbody>
    <tr><td>10</td><td>10ns</td><td>33ns</td><td>100ns</td><td>1µs</td></tr>
    <tr><td>1,000</td><td>1µs</td><td>10µs</td><td>1ms</td><td>~10²⁹⁵ years</td></tr>
    <tr><td>1,000,000</td><td>1ms</td><td>20ms</td><td>17 minutes</td><td>impossible</td></tr>
    <tr><td>1,000,000,000</td><td>1s</td><td>30s</td><td>32 years</td><td>impossible</td></tr>
  </tbody>
</table>
<p>Practical limits: O(n²) breaks ~10⁴. O(2ⁿ) breaks ~25. O(n!) breaks ~12.</p>

<h3>Common operation costs (JavaScript-specific)</h3>
<ul>
  <li><code>arr[i]</code> — O(1)</li>
  <li><code>arr.push(x)</code> — O(1) amortized</li>
  <li><code>arr.pop()</code> — O(1)</li>
  <li><code>arr.shift() / unshift()</code> — O(n)</li>
  <li><code>arr.splice(i, n)</code> — O(n)</li>
  <li><code>arr.slice()</code> — O(n)</li>
  <li><code>arr.concat()</code> — O(n + m)</li>
  <li><code>arr.indexOf(x)</code> — O(n)</li>
  <li><code>arr.includes(x)</code> — O(n)</li>
  <li><code>arr.sort()</code> — O(n log n)</li>
  <li><code>set.has(x)</code> — O(1) average</li>
  <li><code>map.get(k)</code> — O(1) average</li>
  <li><code>obj[key]</code> — O(1) average</li>
  <li><code>JSON.stringify(obj)</code> — O(size)</li>
  <li><code>str + str</code> — O(n + m) per concat (string immutability)</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — single loop</h3>
<pre><code class="language-js">function sum(arr) {
  let s = 0;
  for (let i = 0; i &lt; arr.length; i++) s += arr[i];
  return s;
}
// Time: O(n), Space: O(1)</code></pre>

<h3>Example 2 — nested loops over same n</h3>
<pre><code class="language-js">function pairs(arr) {
  const result = [];
  for (let i = 0; i &lt; arr.length; i++)
    for (let j = i + 1; j &lt; arr.length; j++)
      result.push([arr[i], arr[j]]);
  return result;
}
// Time: O(n²), Space: O(n²) (output)</code></pre>

<h3>Example 3 — sequential loops, two inputs</h3>
<pre><code class="language-js">function intersect(a, b) {
  const set = new Set(a);                    // O(a)
  return b.filter(x =&gt; set.has(x));          // O(b) avg
}
// Time: O(a + b), Space: O(a)</code></pre>

<h3>Example 4 — binary search</h3>
<pre><code class="language-js">function bsearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo &lt;= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] &lt; target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
// Time: O(log n), Space: O(1)</code></pre>

<h3>Example 5 — recursive Fibonacci (naive)</h3>
<pre><code class="language-js">function fib(n) {
  if (n &lt; 2) return n;
  return fib(n - 1) + fib(n - 2);
}
// Time: O(2^n), Space: O(n) call stack
// Each call branches into 2; tree of recursion has 2^n leaves.</code></pre>

<h3>Example 6 — Fibonacci with memoization</h3>
<pre><code class="language-js">function fib(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n &lt; 2) return n;
  return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
}
// Time: O(n), Space: O(n)
// Each subproblem solved once.</code></pre>

<h3>Example 7 — Fibonacci iterative</h3>
<pre><code class="language-js">function fib(n) {
  if (n &lt; 2) return n;
  let a = 0, b = 1;
  for (let i = 2; i &lt;= n; i++) [a, b] = [b, a + b];
  return b;
}
// Time: O(n), Space: O(1) — best of both</code></pre>

<h3>Example 8 — merge sort</h3>
<pre><code class="language-js">function mergesort(arr) {
  if (arr.length &lt;= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  return merge(mergesort(arr.slice(0, mid)), mergesort(arr.slice(mid)));
}
function merge(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i &lt; a.length &amp;&amp; j &lt; b.length)
    result.push(a[i] &lt;= b[j] ? a[i++] : b[j++]);
  return result.concat(a.slice(i), b.slice(j));
}
// Time: O(n log n) — recursion T(n) = 2T(n/2) + O(n)
// Space: O(n) — temp arrays</code></pre>

<h3>Example 9 — DFS on tree</h3>
<pre><code class="language-js">function depth(node) {
  if (!node) return 0;
  return 1 + Math.max(depth(node.left), depth(node.right));
}
// Time: O(n) — visits each node once
// Space: O(h) where h is tree height — O(log n) balanced, O(n) skewed</code></pre>

<h3>Example 10 — string concat</h3>
<pre><code class="language-js">function joinBad(arr) {
  let s = '';
  for (const x of arr) s += x;          // O(n²) — each += is O(current length)
  return s;
}
function joinGood(arr) {
  return arr.join('');                   // O(n) — single allocation
}
// String concatenation in a loop is a classic gotcha</code></pre>

<h3>Example 11 — Two Sum (brute vs hash)</h3>
<pre><code class="language-js">// Brute: O(n²) time, O(1) space
function twoSumBrute(arr, target) {
  for (let i = 0; i &lt; arr.length; i++)
    for (let j = i + 1; j &lt; arr.length; j++)
      if (arr[i] + arr[j] === target) return [i, j];
}

// Hash: O(n) time, O(n) space
function twoSum(arr, target) {
  const seen = new Map();
  for (let i = 0; i &lt; arr.length; i++) {
    const need = target - arr[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(arr[i], i);
  }
}
// Classic time-space tradeoff</code></pre>

<h3>Example 12 — find duplicates</h3>
<pre><code class="language-js">// O(n²) time, O(1) space
function hasDupBrute(arr) {
  for (let i = 0; i &lt; arr.length; i++)
    for (let j = i + 1; j &lt; arr.length; j++)
      if (arr[i] === arr[j]) return true;
  return false;
}

// O(n) time, O(n) space
function hasDup(arr) {
  return new Set(arr).size !== arr.length;
}

// O(n log n) time, O(1) extra (in-place sort)
function hasDupSort(arr) {
  arr.sort();
  for (let i = 1; i &lt; arr.length; i++)
    if (arr[i] === arr[i-1]) return true;
  return false;
}</code></pre>

<h3>Example 13 — palindrome check</h3>
<pre><code class="language-js">function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  while (l &lt; r) {
    if (s[l] !== s[r]) return false;
    l++; r--;
  }
  return true;
}
// Time: O(n), Space: O(1)</code></pre>

<h3>Example 14 — multi-variable</h3>
<pre><code class="language-js">function buildIndex(docs) {
  const index = new Map();
  for (const doc of docs)            // d docs
    for (const word of doc.words)    // w words avg
      index.set(word, [...(index.get(word) || []), doc.id]);
  return index;
}
// Time: O(d × w) where d = doc count, w = avg words/doc
// Space: O(unique words × frequencies)</code></pre>

<h3>Example 15 — exponential search</h3>
<pre><code class="language-js">function expSearch(arr, target) {
  if (arr[0] === target) return 0;
  let bound = 1;
  while (bound &lt; arr.length &amp;&amp; arr[bound] &lt; target) bound *= 2;
  // Now binary search in [bound/2, min(bound, arr.length)]
  return bsearch(arr, target, Math.floor(bound/2), Math.min(bound, arr.length-1));
}
// Time: O(log n) for finding bound + O(log n) for binary search = O(log n)
// Useful when target is near the start of an unbounded sorted array.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Constants matter at small n</h3>
<p>For n &lt; 50, an O(n²) algorithm with simple loop body can beat an O(n log n) with high constant. Sort: insertion sort actually beats merge sort for n &lt; ~20. Real sorts (TimSort) use insertion sort for small chunks.</p>

<h3>2. Hash table O(1) is "average"</h3>
<p>Worst case O(n) — all keys hash to same bucket. With good hash + load factor ~0.7, collisions are rare. In adversarial input (security context), attackers can craft collisions. Use cryptographic hashes (or randomized hashing) where collision attacks matter.</p>

<h3>3. JavaScript array access isn't always O(1)</h3>
<p>JS arrays are objects. Sparse arrays (with holes) are dictionary-backed → access can be O(log n) or worse. Don't <code>delete arr[i]</code> on hot paths; assign <code>undefined</code> or use shift/splice (with O(n) cost).</p>

<h3>4. String operations and immutability</h3>
<p>Strings are immutable. <code>s += x</code> in a loop is O(n²). Use <code>arr.join('')</code> or template literals or a buffer.</p>

<h3>5. Recursion stack space</h3>
<p>JS engines mostly don't tail-call optimize. <code>O(n)</code> recursion depth uses <code>O(n)</code> stack — can cause RangeError on big inputs. For deep recursion, convert to iterative + explicit stack.</p>

<h3>6. Time complexity ≠ wall clock</h3>
<p>Cache effects, memory bandwidth, branch prediction all affect real time. An O(n²) cache-friendly algorithm can outperform O(n log n) with random memory access.</p>

<h3>7. Average case can be misleading</h3>
<p>Quicksort has O(n log n) average but O(n²) worst case (sorted input + bad pivot). Production sorts use randomized pivots or hybrid algorithms. Don't quote average without context.</p>

<h3>8. Big O with multiple variables</h3>
<p><code>O(V + E)</code> for graph traversal — V vertices + E edges. Don't simplify to O(n); the relationship between V and E matters (sparse vs dense).</p>

<h3>9. log base doesn't matter</h3>
<p><code>log₂(n)</code>, <code>log₁₀(n)</code>, <code>ln(n)</code> differ by constants. Big O strips constants, so all are O(log n).</p>

<h3>10. nlogn vs n^1.5</h3>
<p>n log n eventually wins, but at n=1000: log₂ 1000 ≈ 10; √1000 ≈ 32. n log n ≈ 10000; n × √n ≈ 31600. n log n is better but not by 10×.</p>

<h3>11. "O(n) where n = input bits"</h3>
<p>For arithmetic on integers, complexity is sometimes measured in bits. <code>n!</code> calculation is O(n²) bit operations even though "n" mults seems O(n). Default to "n = element count" unless context specifies otherwise.</p>

<h3>12. Polynomial vs exponential</h3>
<p>n^k for any constant k is polynomial. n^1000 is polynomial; 2^n is exponential. For practical purposes, anything with n in the exponent is "fast." Anything with constant in the exponent is "slow."</p>

<h3>13. Recursive calls reuse subproblems</h3>
<p>Naive Fibonacci: O(2^n) because each call independently recomputes children. Memoized: O(n) because each subproblem solved once. Always check for shared subproblems → memoize.</p>

<h3>14. Big O can hide huge constants</h3>
<p>FFT is O(n log n); insertion sort is O(n²). For n=20, insertion sort wins by 10×. For n=10⁶, FFT wins by 10⁵×. Constant matters until n is "big enough."</p>

<h3>15. Allocation cost</h3>
<p>Creating an array of size n is O(n) in time and space. <code>new Array(n)</code> in JS is O(1) for the allocation but O(n) if you fill it. Be aware of this hidden cost.</p>

<h3>16. Map vs object performance</h3>
<p>JS <code>Map</code> is true hash table — O(1). Plain object <code>{}</code> behaves like one for string keys but has prototype chain + property descriptors. Map is faster for heavy use; object is fine for most cases.</p>

<h3>17. Set membership is O(1) — set.has(x)</h3>
<p>Native Set uses a hash table internally. <code>set.has(x)</code> is O(1) average. Don't use <code>arr.includes(x)</code> in a loop — that's O(n) per call → O(n²) total.</p>

<h3>18. Recursive memoization stack</h3>
<p>Memoization saves time but recursion depth is still O(n) → stack space O(n). Iterative DP with table avoids stack overhead.</p>

<h3>19. Sort cost in built-in functions</h3>
<p><code>arr.sort()</code> is O(n log n) in V8 (TimSort). <code>arr.toSorted()</code> (newer) returns a new sorted array, same cost.</p>

<h3>20. Math operations on bigints</h3>
<p>Native JS numbers: O(1). BigInt: O(d²) for multiplication where d = digits. For very large numbers, costs explode.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — quoting only time</h3>
<p>"This is O(n)." OK, but space? Recursion stack? Always state both.</p>

<h3>Anti-pattern 2 — not dropping constants</h3>
<p>"O(2n + 5)" — drop to O(n). Big O is about asymptotic growth.</p>

<h3>Anti-pattern 3 — string concatenation in loops</h3>
<p>O(n²) hidden in <code>s += x</code>. Use array join.</p>

<h3>Anti-pattern 4 — <code>arr.includes</code> in a loop</h3>
<pre><code class="language-js">for (const x of a)
  if (b.includes(x)) result.push(x);   // O(n*m) — uses linear scan per check</code></pre>
<p>Use a Set for O(n + m).</p>

<h3>Anti-pattern 5 — recursive without memoization</h3>
<p>Naive Fibonacci: O(2^n). Memoize → O(n).</p>

<h3>Anti-pattern 6 — claiming "amortized" without analysis</h3>
<p>Saying "amortized O(1)" needs a reason: doubling strategy, infrequent large operations, etc. Not a magic word.</p>

<h3>Anti-pattern 7 — forgetting recursion stack space</h3>
<p>Recursive solution: time O(n), space O(n) for call stack. Don't write "space O(1)" for a recursive solution unless tail-call optimized.</p>

<h3>Anti-pattern 8 — confusing input size with input value</h3>
<p>If input is integer n: "O(n)" means O(n) where n is the value. Or "O(log n)" if you mean log of the value (counting in bits). Be explicit.</p>

<h3>Anti-pattern 9 — over-optimizing prematurely</h3>
<p>Big O guides design but n=10 doesn't need O(log n). Optimize for the actual input size you'll see.</p>

<h3>Anti-pattern 10 — using Big O as "fast vs slow"</h3>
<p>O(n) algorithm with high constant can be slower than O(n²) on tiny n. Big O is asymptotic.</p>

<h3>Anti-pattern 11 — forgetting space-time tradeoffs</h3>
<p>Memoization makes recursion O(n) time but adds O(n) space. Always trade explicitly.</p>

<h3>Anti-pattern 12 — analyzing only the function, not callers</h3>
<p>Function is O(n). Called inside another loop: caller is O(n²). Track aggregate.</p>

<h3>Anti-pattern 13 — assuming average case</h3>
<p>Quicksort is O(n²) worst case. If your input might be sorted, that's bad. Use median-of-three pivot or fall back to merge sort.</p>

<h3>Anti-pattern 14 — measuring wrong</h3>
<p>console.time on n=10 doesn't reveal scaling. Measure across n=10, 100, 1000, 10000 to see growth shape.</p>

<h3>Anti-pattern 15 — assuming hash O(1) always</h3>
<p>Hash collisions reduce performance. Carefully crafted adversarial input can degrade to O(n). Use stable hash or randomized hashing where security matters.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What's Big O notation?</div>
  <div class="qa-answer">
    <p>An asymptotic upper bound on a function's growth rate. Formally: <code>f(n) = O(g(n))</code> if there exist constants c, n₀ such that <code>f(n) ≤ c·g(n)</code> for all <code>n ≥ n₀</code>. Practically: describes how runtime / memory scales with input size, ignoring constants and lower-order terms.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Time complexity of common operations?</div>
  <div class="qa-answer">
    <ul>
      <li>Array access: O(1)</li>
      <li>Array search: O(n)</li>
      <li>Hash get/set: O(1) average</li>
      <li>Sorted array binary search: O(log n)</li>
      <li>BST balanced operations: O(log n)</li>
      <li>Heap insert / extract: O(log n)</li>
      <li>Sort: O(n log n)</li>
      <li>Linked list access: O(n)</li>
      <li>Trie operations: O(L) where L = string length</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Walk through analyzing this:</div>
<pre><code class="language-js">for (let i = 0; i &lt; n; i++)
  for (let j = i; j &lt; n; j++)
    work();</code></pre>
  <div class="qa-answer">
    <p>Outer runs n times. Inner runs (n - i) times when outer is at i. Total: (n) + (n-1) + ... + 1 = n(n+1)/2 ≈ n²/2. Drop the 1/2 → <strong>O(n²)</strong>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What's amortized O(1) for dynamic array push?</div>
  <div class="qa-answer">
    <p>Push is O(1) when capacity isn't full. Resizing (double capacity, copy elements) is O(n). But: if you push N items, total resize cost is 1 + 2 + 4 + ... + N = ~2N. Each resize doubles capacity, so resizes happen rarely. Total cost of N pushes: ~3N work. Amortized cost per push: O(1).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Analyze recursive Fibonacci.</div>
  <div class="qa-answer">
    <p>Naive recursion calls fib(n-1) + fib(n-2). Each call branches into 2. Recursion tree has ~2^n leaves. <strong>Time: O(2^n)</strong>. Stack depth at most n. <strong>Space: O(n)</strong>.</p>
    <p>With memoization: each subproblem solved once. <strong>Time: O(n), Space: O(n)</strong>.</p>
    <p>Iterative: <strong>Time: O(n), Space: O(1)</strong>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What's the master theorem?</div>
  <div class="qa-answer">
    <p>For recurrences <code>T(n) = aT(n/b) + f(n)</code>:</p>
    <ul>
      <li>If <code>f(n) = O(n^c)</code> with <code>c &lt; log_b a</code>: <code>T(n) = O(n^(log_b a))</code></li>
      <li>If <code>c = log_b a</code>: <code>T(n) = O(n^c log n)</code></li>
      <li>If <code>c &gt; log_b a</code>: <code>T(n) = O(f(n))</code></li>
    </ul>
    <p>Examples: merge sort T(n) = 2T(n/2) + n → c=1, log_2 2 = 1 → O(n log n). Binary search T(n) = T(n/2) + 1 → O(log n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What's the space complexity of merge sort?</div>
  <div class="qa-answer">
    <p>O(n) auxiliary space for the temporary arrays during merge. Plus O(log n) recursion stack. Total: O(n).</p>
    <p>Contrast with in-place quicksort: O(log n) average space (just stack), but O(n) worst case.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why is quicksort O(n log n) average but O(n²) worst?</div>
  <div class="qa-answer">
    <p>Quicksort partitions around a pivot. Good pivot (median) → balanced split → T(n) = 2T(n/2) + n → O(n log n). Bad pivot (smallest or largest) → split into n-1 and 0 → T(n) = T(n-1) + n → O(n²). Mitigation: random pivot, median-of-three, hybrid with insertion sort for small subarrays.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. When does O(n²) beat O(n log n) in practice?</div>
  <div class="qa-answer">
    <p>For very small n (typically n &lt; 20-50), constant factors dominate. Insertion sort beats merge sort for tiny arrays. Real sort algorithms (TimSort, Introsort) use insertion sort as a base case.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What is two-sum's time / space?</div>
  <div class="qa-answer">
    <p>Brute force (nested loops): O(n²) time, O(1) space.</p>
    <p>With hash map (single pass): O(n) time, O(n) space.</p>
    <p>Classic time-space tradeoff.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Time complexity of <code>arr.shift()</code>?</div>
  <div class="qa-answer">
    <p>O(n) — must shift every other element down by 1. Same for <code>unshift</code>. For O(1) front operations, use a linked list or deque (manual implementation; JS doesn't have one built-in, but a doubly linked list class works).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What's O(V + E) and when does it apply?</div>
  <div class="qa-answer">
    <p>Graph traversal (DFS, BFS) cost: visit V vertices, examine E edges. Total: O(V + E). Don't simplify to O(n) — V and E can differ vastly (sparse: E ≈ V; dense: E = V²).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What does "log base doesn't matter" mean?</div>
  <div class="qa-answer">
    <p>log₂ n vs log₁₀ n vs ln n differ by constant factors. Big O drops constants → all are O(log n). When you say "binary search is O(log n)," you mean log₂; when you say "log of integer's digit count," you might mean log₁₀; same Big O.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Explain "polynomial vs exponential" with an example.</div>
  <div class="qa-answer">
    <p>n² is polynomial. 2^n is exponential. At n=100: n² = 10,000 (instant); 2^n = 10^30 (universe-age). Polynomial scales; exponential doesn't. Always prefer polynomial. Subset / permutation problems are inherently exponential — usually need pruning (backtracking, branch-and-bound) to be feasible at meaningful sizes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How would you choose between two algorithms?</div>
  <div class="qa-answer">
    <ol>
      <li>State Big O for both (time + space).</li>
      <li>Estimate input size n: small (&lt; 100) constants matter; medium (10^3-10^5) most algorithms work; large (10^6+) only good ones survive.</li>
      <li>Consider memory constraints.</li>
      <li>Consider implementation complexity — sometimes O(n²) is fine and simpler.</li>
      <li>Consider stability / determinism — quicksort isn't stable; merge sort is.</li>
      <li>Benchmark for absolute speed when constants matter.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You drop constants and lower-order terms.</li>
    <li>You state both time AND space.</li>
    <li>You include recursion stack in space analysis.</li>
    <li>You distinguish worst / average / amortized / expected.</li>
    <li>You memoize repeated subproblems.</li>
    <li>You name the Master Theorem when relevant.</li>
    <li>You're aware constants matter for absolute speed.</li>
    <li>You know common-operation complexities by heart.</li>
  </ul>
</div>
`}

]
});
