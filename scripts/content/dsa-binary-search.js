window.PREP_SITE.registerTopic({
  id: 'dsa-binary-search',
  module: 'dsa',
  title: 'Binary Search',
  estimatedReadTime: '40 min',
  tags: ['binary-search', 'sorted-array', 'lower-bound', 'upper-bound', 'binary-search-on-answer', 'search-rotated', 'invariant'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Binary search</strong> finds an item in a sorted sequence in O(log n) by repeatedly halving the search space. It looks deceptively simple — and is famously where ~80% of seasoned engineers introduce off-by-one bugs. The trick: pick an <em>invariant</em> and stick to it.</p>
<ul>
  <li><strong>Three classic forms:</strong> exact-match (does X exist?), <em>lower bound</em> (smallest index with value ≥ target), <em>upper bound</em> (smallest index with value &gt; target).</li>
  <li><strong>The invariant decides everything.</strong> "lo and hi point to..." — keep the meaning identical at every loop iteration.</li>
  <li><strong>Use <code>lo + (hi - lo) / 2</code></strong> if your language has integer overflow concerns. JS doesn't (within safe integer range), but <code>(lo + hi) &gt;&gt; 1</code> is idiomatic and fast.</li>
  <li><strong>Binary search on the answer:</strong> not just for sorted arrays. If the predicate "is k a feasible answer?" is monotone, binary-search the answer space.</li>
  <li><strong>Rotated sorted arrays, peak finding, search-in-2D-matrix, capacity-to-ship</strong> — all binary search variants.</li>
  <li><strong>Common bugs:</strong> wrong loop condition (<code>&lt;</code> vs <code>&lt;=</code>), wrong update (<code>mid</code> vs <code>mid+1</code>), wrong return on miss, infinite loop when shrinking by 0.</li>
  <li><strong>Always pick a template that you can defend.</strong> The "less than, mid + 1 / mid" template handles both lower-bound and exact-match cleanly.</li>
</ul>
<p><strong>Mantra:</strong> "State the invariant. Stick to one template. Test on size 0, 1, 2 always."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is binary search?</h3>
<p>An algorithm that locates a target value in a <em>sorted</em> sequence by:</p>
<ol>
  <li>Comparing the middle element to the target.</li>
  <li>Eliminating half the remaining range based on the result.</li>
  <li>Repeating on the surviving half until the range is empty or the target is found.</li>
</ol>
<p>Each iteration halves the search space; n elements need ⌈log₂ n⌉ comparisons.</p>

<h3>Three problem shapes</h3>
<table>
  <thead><tr><th>Question</th><th>Result</th></tr></thead>
  <tbody>
    <tr><td>Does target X exist? Where?</td><td>Index of X, or -1</td></tr>
    <tr><td>Smallest index where value ≥ target (lower_bound)</td><td>Insert position; first match in equal-value runs</td></tr>
    <tr><td>Smallest index where value &gt; target (upper_bound)</td><td>Insert-after position; one past last match</td></tr>
  </tbody>
</table>
<p>Almost every binary search question reduces to one of these three.</p>

<h3>Why binary search matters</h3>
<ol>
  <li><strong>Logarithmic time.</strong> n = 1B → ~30 comparisons.</li>
  <li><strong>The "binary search on the answer" pattern.</strong> Even when the input isn't sorted, if a yes/no predicate is monotone in some parameter k, you can binary-search k.</li>
  <li><strong>Foundation for more complex algorithms:</strong> exponential search, ternary search, merge sort lower-bound, parametric search.</li>
  <li><strong>Common in real code:</strong> sorted arrays in the standard library, balanced trees' internal lookups, database indexes.</li>
</ol>

<h3>Why it's hard despite being short</h3>
<p>The algorithm is 5-10 lines. The off-by-one decisions are:</p>
<ul>
  <li>Should <code>hi</code> be inclusive or exclusive?</li>
  <li>Loop condition: <code>lo &lt; hi</code> or <code>lo &lt;= hi</code>?</li>
  <li>On match: return immediately or continue narrowing (for first/last occurrence)?</li>
  <li>Update: <code>lo = mid + 1</code> always; <code>hi = mid</code> or <code>hi = mid - 1</code> depending on inclusivity.</li>
  <li>Termination: when the loop ends, what does <code>lo</code> mean?</li>
</ul>
<p>One wrong decision = infinite loop or wrong answer. The fix: <strong>commit to one template</strong> and use it everywhere.</p>

<h3>What "good" looks like</h3>
<ul>
  <li>You state the invariant before coding: "lo is the smallest index that COULD be the answer; hi is one past the largest."</li>
  <li>You use a single template across exact-match and lower/upper-bound problems.</li>
  <li>You handle empty arrays without special-casing.</li>
  <li>You verify on n = 0, n = 1, target before / after / equal to all.</li>
  <li>For "binary search on answer," you state the predicate explicitly and verify monotonicity.</li>
  <li>You quote O(log n) time, O(1) space.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The half-open invariant template</h3>
<p>One template covers everything. Use it.</p>
<pre><code class="language-js">// Invariant: answer (if exists) is in [lo, hi)
//            i.e., lo is inclusive, hi is exclusive
let lo = 0, hi = arr.length;
while (lo &lt; hi) {
  const mid = (lo + hi) &gt;&gt; 1;
  if (predicate(arr[mid])) {
    hi = mid;          // answer is at mid OR to the left
  } else {
    lo = mid + 1;      // answer is to the right
  }
}
// lo === hi is the answer position (or arr.length if no match)
</code></pre>

<h3>The "predicate" abstraction</h3>
<p>Frame every binary search as: "find the smallest index where <code>predicate(arr[i])</code> is true." The predicate must be <em>monotone</em>: once true, true for all larger indices.</p>
<table>
  <thead><tr><th>Problem</th><th>Predicate</th></tr></thead>
  <tbody>
    <tr><td>Lower bound (≥ target)</td><td><code>arr[i] &gt;= target</code></td></tr>
    <tr><td>Upper bound (&gt; target)</td><td><code>arr[i] &gt; target</code></td></tr>
    <tr><td>Exact match</td><td>Use lower-bound; check <code>arr[lo] === target</code> after</td></tr>
    <tr><td>First true in boolean array</td><td><code>arr[i] === true</code></td></tr>
    <tr><td>Capacity to ship in D days</td><td><code>canShip(arr, capacity)</code></td></tr>
  </tbody>
</table>

<h3>The "found / not found" decision</h3>
<pre><code class="language-js">// After the loop, lo points to the smallest index where predicate is true.
// To convert lower-bound result into "exact found":
return lo &lt; arr.length &amp;&amp; arr[lo] === target ? lo : -1;
</code></pre>

<h3>Why <code>(lo + hi) &gt;&gt; 1</code> works</h3>
<p>Right shift by 1 = divide by 2. <code>(lo + hi) / 2</code> is fine in JS until <code>lo + hi &gt; 2^53</code>, which means &gt; 9 quadrillion entries — never. <code>(lo + hi) &gt;&gt; 1</code> coerces to int32 (truncates), risking overflow if <code>lo + hi &gt; 2^31</code>. For arrays under 1B elements, both work. For paranoia: <code>lo + ((hi - lo) &gt;&gt; 1)</code>.</p>

<h3>The "shrinks by 0" infinite-loop trap</h3>
<pre><code class="language-js">// BAD — when lo === mid, lo doesn't advance, infinite loop
while (lo &lt;= hi) {
  const mid = (lo + hi) &gt;&gt; 1;
  if (good(arr[mid])) hi = mid;
  else lo = mid;     // ❌ should be mid + 1
}
</code></pre>
<p>Whenever you set <code>lo = mid</code> (instead of <code>mid + 1</code>), you risk an infinite loop because <code>mid</code> can equal <code>lo</code>. Either always use <code>lo = mid + 1</code> with the half-open template, or compute mid as <code>(lo + hi + 1) &gt;&gt; 1</code> (rounding up) when shrinking with <code>lo = mid</code>.</p>

<h3>Binary search on the answer</h3>
<p>When the input isn't sorted but the answer space is monotone, binary-search the answer:</p>
<pre><code class="language-text">"Find smallest capacity to ship all packages in D days."

The packages array isn't sorted, but the predicate
  canShip(capacity) — "can we ship in ≤ D days with this capacity?"
is monotone: larger capacity is always feasible if smaller is.

Binary search capacity in [max(weights), sum(weights)]:
  - lo = max single weight (must fit one package)
  - hi = sum of all weights (one day is enough)
  - find smallest capacity where canShip(c) is true
</code></pre>

<h3>The "discrete" vs "continuous" answer space</h3>
<table>
  <thead><tr><th>Type</th><th>Stop condition</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Integer answer</td><td><code>lo &lt; hi</code> until convergence</td><td>Capacity to ship, min eating speed</td></tr>
    <tr><td>Floating-point answer</td><td><code>hi - lo &gt; epsilon</code></td><td>Square root, equation solving</td></tr>
  </tbody>
</table>

<h3>Rotated sorted array</h3>
<p>The array is sorted but rotated by some pivot. Binary search still works in O(log n) — at each step, identify which half is sorted, then check whether the target lies within it.</p>

<h3>Two-pointer vs binary search</h3>
<p>Both halve work, but differently. Two-pointer (left + right meeting in the middle) is for finding pairs/triples in a sorted array. Binary search is for "find this one thing." Don't confuse them.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Lower bound (smallest index with arr[i] ≥ target)</h3>
<pre><code class="language-js">function lowerBound(arr, target) {
  let lo = 0, hi = arr.length;     // half-open: [lo, hi)
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (arr[mid] &gt;= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;   // could be arr.length if no element &gt;= target
}
</code></pre>

<h3>Upper bound (smallest index with arr[i] &gt; target)</h3>
<pre><code class="language-js">function upperBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (arr[mid] &gt; target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
</code></pre>

<h3>Exact match (returns index or -1)</h3>
<pre><code class="language-js">function search(arr, target) {
  const idx = lowerBound(arr, target);
  return idx &lt; arr.length &amp;&amp; arr[idx] === target ? idx : -1;
}
</code></pre>

<h3>Range of target (first and last occurrence)</h3>
<pre><code class="language-js">function searchRange(arr, target) {
  const lo = lowerBound(arr, target);
  if (lo === arr.length || arr[lo] !== target) return [-1, -1];
  const hi = upperBound(arr, target) - 1;
  return [lo, hi];
}
</code></pre>

<h3>Search in rotated sorted array</h3>
<pre><code class="language-js">function searchRotated(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo &lt;= hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (nums[mid] === target) return mid;

    if (nums[lo] &lt;= nums[mid]) {
      // Left half [lo..mid] is sorted
      if (nums[lo] &lt;= target &amp;&amp; target &lt; nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      // Right half [mid..hi] is sorted
      if (nums[mid] &lt; target &amp;&amp; target &lt;= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}
</code></pre>

<h3>Find Minimum in Rotated Sorted Array</h3>
<pre><code class="language-js">function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (nums[mid] &gt; nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}
</code></pre>

<h3>Peak Element (any peak)</h3>
<pre><code class="language-js">function findPeakElement(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (nums[mid] &gt; nums[mid + 1]) hi = mid;     // descending: peak is at mid or left
    else lo = mid + 1;                            // ascending: peak is to the right
  }
  return lo;
}
</code></pre>

<h3>Square Root (integer)</h3>
<pre><code class="language-js">function mySqrt(x) {
  let lo = 0, hi = x;
  while (lo &lt; hi) {
    const mid = (lo + hi + 1) &gt;&gt; 1;     // round up to avoid infinite loop with lo = mid
    if (mid * mid &lt;= x) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
</code></pre>

<h3>Search in 2D Matrix (sorted rows + sorted cols)</h3>
<pre><code class="language-js">// Variant 1: each row sorted, first elem of each row &gt; last of previous
function searchMatrix(M, target) {
  if (!M.length) return false;
  const m = M.length, n = M[0].length;
  let lo = 0, hi = m * n;
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    const v = M[Math.floor(mid / n)][mid % n];
    if (v === target) return true;
    if (v &lt; target) lo = mid + 1;
    else hi = mid;
  }
  return false;
}

// Variant 2: rows and cols sorted independently — staircase descent (not pure binary search)
function searchMatrix2(M, target) {
  if (!M.length) return false;
  let r = 0, c = M[0].length - 1;
  while (r &lt; M.length &amp;&amp; c &gt;= 0) {
    if (M[r][c] === target) return true;
    if (M[r][c] &gt; target) c--;
    else r++;
  }
  return false;
}
</code></pre>

<h3>Capacity to Ship within D Days</h3>
<pre><code class="language-js">function shipWithinDays(weights, days) {
  function canShip(capacity) {
    let d = 1, cur = 0;
    for (const w of weights) {
      if (cur + w &gt; capacity) { d++; cur = 0; }
      cur += w;
    }
    return d &lt;= days;
  }
  let lo = Math.max(...weights);    // must fit each package
  let hi = weights.reduce((a, b) =&gt; a + b, 0);
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (canShip(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
</code></pre>

<h3>Koko Eating Bananas (min speed)</h3>
<pre><code class="language-js">function minEatingSpeed(piles, h) {
  function hours(speed) {
    let total = 0;
    for (const p of piles) total += Math.ceil(p / speed);
    return total;
  }
  let lo = 1, hi = Math.max(...piles);
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (hours(mid) &lt;= h) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
</code></pre>

<h3>Median of Two Sorted Arrays</h3>
<pre><code class="language-js">function findMedianSortedArrays(a, b) {
  if (a.length &gt; b.length) [a, b] = [b, a];   // ensure a is shorter
  const m = a.length, n = b.length;
  const total = m + n;
  const half = (total + 1) &gt;&gt; 1;

  let lo = 0, hi = m;
  while (lo &lt;= hi) {
    const i = (lo + hi) &gt;&gt; 1;
    const j = half - i;
    const aLeft = i === 0 ? -Infinity : a[i - 1];
    const aRight = i === m ? Infinity : a[i];
    const bLeft = j === 0 ? -Infinity : b[j - 1];
    const bRight = j === n ? Infinity : b[j];

    if (aLeft &lt;= bRight &amp;&amp; bLeft &lt;= aRight) {
      if (total % 2) return Math.max(aLeft, bLeft);
      return (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2;
    }
    if (aLeft &gt; bRight) hi = i - 1;
    else lo = i + 1;
  }
}
</code></pre>

<h3>Find First Bad Version</h3>
<pre><code class="language-js">var solution = function(isBadVersion) {
  return function(n) {
    let lo = 1, hi = n;
    while (lo &lt; hi) {
      const mid = (lo + hi) &gt;&gt; 1;
      if (isBadVersion(mid)) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  };
};
</code></pre>

<h3>Exponential search (unbounded)</h3>
<pre><code class="language-js">// For an unbounded sorted stream where you don't know the size
function exponentialSearch(reader, target) {
  // Find a range that contains the target
  let bound = 1;
  while (reader.get(bound) !== Infinity &amp;&amp; reader.get(bound) &lt; target) {
    bound *= 2;
  }
  // Binary search within [bound/2, bound]
  let lo = bound &gt;&gt; 1, hi = bound;
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (reader.get(mid) &gt;= target) hi = mid;
    else lo = mid + 1;
  }
  return reader.get(lo) === target ? lo : -1;
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Find Position to Insert (lower_bound applied)</h3>
<pre><code class="language-js">function searchInsert(nums, target) {
  let lo = 0, hi = nums.length;
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (nums[mid] &gt;= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
</code></pre>

<h3>Example 2: Search Range (first and last)</h3>
<pre><code class="language-js">function searchRange(nums, target) {
  function lb() {
    let lo = 0, hi = nums.length;
    while (lo &lt; hi) {
      const mid = (lo + hi) &gt;&gt; 1;
      if (nums[mid] &gt;= target) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }
  function ub() {
    let lo = 0, hi = nums.length;
    while (lo &lt; hi) {
      const mid = (lo + hi) &gt;&gt; 1;
      if (nums[mid] &gt; target) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }
  const left = lb();
  if (left === nums.length || nums[left] !== target) return [-1, -1];
  return [left, ub() - 1];
}
</code></pre>

<h3>Example 3: H-Index II (binary search on the answer)</h3>
<pre><code class="language-js">function hIndex(citations) {
  // citations sorted ascending
  const n = citations.length;
  let lo = 0, hi = n;
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    // n - mid papers have at least citations[mid] citations
    if (citations[mid] &gt;= n - mid) hi = mid;
    else lo = mid + 1;
  }
  return n - lo;
}
</code></pre>

<h3>Example 4: Split Array Largest Sum</h3>
<pre><code class="language-js">function splitArray(nums, k) {
  function canSplit(maxSum) {
    let groups = 1, cur = 0;
    for (const n of nums) {
      if (cur + n &gt; maxSum) { groups++; cur = 0; }
      cur += n;
    }
    return groups &lt;= k;
  }
  let lo = Math.max(...nums);
  let hi = nums.reduce((a, b) =&gt; a + b, 0);
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (canSplit(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
</code></pre>

<h3>Example 5: Find Kth Smallest in Sorted Matrix</h3>
<pre><code class="language-js">function kthSmallest(matrix, k) {
  const n = matrix.length;
  function countLE(target) {
    let count = 0, c = n - 1;
    for (let r = 0; r &lt; n; r++) {
      while (c &gt;= 0 &amp;&amp; matrix[r][c] &gt; target) c--;
      count += c + 1;
    }
    return count;
  }
  let lo = matrix[0][0], hi = matrix[n - 1][n - 1];
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (countLE(mid) &gt;= k) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
</code></pre>

<h3>Example 6: Successful Pairs of Spells (bs in sorted potions)</h3>
<pre><code class="language-js">function successfulPairs(spells, potions, success) {
  potions.sort((a, b) =&gt; a - b);
  const out = [];
  for (const s of spells) {
    const minPotion = Math.ceil(success / s);
    let lo = 0, hi = potions.length;
    while (lo &lt; hi) {
      const mid = (lo + hi) &gt;&gt; 1;
      if (potions[mid] &gt;= minPotion) hi = mid;
      else lo = mid + 1;
    }
    out.push(potions.length - lo);
  }
  return out;
}
</code></pre>

<h3>Example 7: Aggressive Cows (place K cows max-distance apart)</h3>
<pre><code class="language-js">function aggressiveCows(stalls, k) {
  stalls.sort((a, b) =&gt; a - b);
  function canPlace(d) {
    let placed = 1, last = stalls[0];
    for (let i = 1; i &lt; stalls.length; i++) {
      if (stalls[i] - last &gt;= d) {
        if (++placed === k) return true;
        last = stalls[i];
      }
    }
    return false;
  }
  let lo = 1, hi = stalls[stalls.length - 1] - stalls[0];
  while (lo &lt; hi) {
    const mid = (lo + hi + 1) &gt;&gt; 1;       // round up; we want max d
    if (canPlace(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
</code></pre>

<h3>Example 8: Time Based Key-Value Store</h3>
<pre><code class="language-js">class TimeMap {
  constructor() { this.m = new Map(); }
  set(k, v, t) {
    if (!this.m.has(k)) this.m.set(k, []);
    this.m.get(k).push([t, v]);
  }
  get(k, t) {
    const arr = this.m.get(k) ?? [];
    let lo = 0, hi = arr.length;
    while (lo &lt; hi) {
      const mid = (lo + hi) &gt;&gt; 1;
      if (arr[mid][0] &gt; t) hi = mid;
      else lo = mid + 1;
    }
    return lo === 0 ? '' : arr[lo - 1][1];
  }
}
</code></pre>

<h3>Example 9: Find K Closest Elements</h3>
<pre><code class="language-js">function findClosestElements(arr, k, x) {
  let lo = 0, hi = arr.length - k;
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (x - arr[mid] &gt; arr[mid + k] - x) lo = mid + 1;
    else hi = mid;
  }
  return arr.slice(lo, lo + k);
}
</code></pre>

<h3>Example 10: Allocate Books</h3>
<pre><code class="language-js">// Distribute books to M students such that the maximum pages assigned to any student is minimized.
function allocateBooks(pages, m) {
  if (pages.length &lt; m) return -1;
  function canAllocate(maxPages) {
    let students = 1, cur = 0;
    for (const p of pages) {
      if (p &gt; maxPages) return false;
      if (cur + p &gt; maxPages) { students++; cur = 0; }
      cur += p;
    }
    return students &lt;= m;
  }
  let lo = Math.max(...pages);
  let hi = pages.reduce((a, b) =&gt; a + b, 0);
  while (lo &lt; hi) {
    const mid = (lo + hi) &gt;&gt; 1;
    if (canAllocate(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Empty array</h3>
<p>Half-open template handles it: <code>lo = hi = 0</code>, loop doesn't enter, returns 0 (lower bound) or -1 (after exact-match check). Always test.</p>

<h3>Single element</h3>
<p>Confirm correctness for arr = [5], target = 5 (found), 4 (insert at 0), 6 (insert at 1).</p>

<h3>Target less than all elements</h3>
<p>Lower bound returns 0; upper bound returns 0. Insert at the front.</p>

<h3>Target greater than all elements</h3>
<p>Lower bound returns <code>arr.length</code>; upper bound returns <code>arr.length</code>. Insert at the end. Be careful with <code>arr[lo]</code> after the loop — guard with <code>lo &lt; arr.length</code>.</p>

<h3>Target equals all elements</h3>
<p>Lower bound returns 0; upper bound returns <code>arr.length</code>. Range = full array.</p>

<h3>Duplicates</h3>
<p>Exact-match binary search may return any matching index (typically the first hit). For "first / last occurrence," use lower_bound / upper_bound - 1.</p>

<h3>Infinite loop on <code>lo = mid</code></h3>
<pre><code class="language-js">// BAD — when lo === mid, no progress
while (lo &lt; hi) {
  const mid = (lo + hi) &gt;&gt; 1;
  if (good(mid)) lo = mid;     // ❌
  else hi = mid - 1;
}

// FIX 1 — round up
const mid = (lo + hi + 1) &gt;&gt; 1;
if (good(mid)) lo = mid;
else hi = mid - 1;

// FIX 2 — use the "lo = mid + 1" template
if (good(mid)) hi = mid;     // shrink hi
else lo = mid + 1;
</code></pre>

<h3>Floating-point convergence</h3>
<pre><code class="language-js">while (hi - lo &gt; 1e-9) {       // epsilon
  const mid = (lo + hi) / 2;
  if (predicate(mid)) hi = mid;
  else lo = mid;
}
</code></pre>
<p>Don't use <code>lo &lt; hi</code> with floats — never converges due to floating-point precision.</p>

<h3>Integer overflow</h3>
<p>JavaScript: numbers are 64-bit floats; safe integer is 2⁵³. Bitwise ops (<code>&gt;&gt;</code>, <code>|</code>) coerce to 32-bit signed. <code>(lo + hi) &gt;&gt; 1</code> on huge values can wrap. Use <code>lo + Math.floor((hi - lo) / 2)</code> for safety with very large ranges (e.g., binary search on numeric answer space).</p>

<h3>Searching for the wrong predicate direction</h3>
<p>"smallest k such that canShip(k) is true" requires <code>canShip(mid) → hi = mid</code> (search left). "largest k such that canPlace(k) is true" requires <code>canPlace(mid) → lo = mid</code> (search right) — different template!</p>

<h3>Off-by-one in upper bound</h3>
<p>Upper bound returns <em>one past</em> the last match. <code>arr[upperBound - 1]</code> is the last match. Forgetting to subtract 1 is the most common bug.</p>

<h3>Predicate that's not monotone</h3>
<p>Binary search requires the predicate to be monotone in the search variable. If "true / false / true / false" exists, binary search is wrong. Verify monotonicity before assuming you can binary-search.</p>

<h3>Rotated array with duplicates</h3>
<p>Standard rotated search runs in O(log n). With duplicates, worst case is O(n) because <code>nums[lo] === nums[mid] === nums[hi]</code> doesn't tell you which half is sorted.</p>

<h3>Two-pointer disguised as binary search</h3>
<p>"K closest" can be solved by two-pointer (O(n)) or binary search (O(log n + k)). The latter is faster when k ≪ n.</p>

<h3>Bounds for "binary search on answer"</h3>
<ul>
  <li><strong>lo</strong> = the trivially-small feasible answer (often max single element, 1, etc.).</li>
  <li><strong>hi</strong> = the trivially-large feasible answer (often sum, max possible, etc.).</li>
</ul>
<p>Pick bounds that bracket the actual answer; otherwise you may converge to an infeasible value.</p>

<h3>Checking the boundary value</h3>
<p>After loop, you have <code>lo === hi</code>. <em>Verify</em> the result is actually feasible if your bounds were guesses; sometimes the answer doesn't exist in the search space and the loop converges to a false negative.</p>

<h3>Finding the maximum vs minimum (template flip)</h3>
<p>Template depends on the goal:</p>
<ul>
  <li>"Smallest x where pred(x) is true": <code>pred(mid) → hi = mid</code>; <code>else → lo = mid + 1</code>.</li>
  <li>"Largest x where pred(x) is true": <code>pred(mid) → lo = mid</code>; <code>else → hi = mid - 1</code>; round mid up.</li>
</ul>
<p>Mixing these up produces infinite loops or wrong answers.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Wrong loop condition</h3>
<pre><code class="language-js">// Half-open template uses lo &lt; hi
while (lo &lt;= hi) {           // ❌ for half-open
  // ...
}
</code></pre>

<h3>Bug 2: Wrong update on the "go right" branch</h3>
<pre><code class="language-js">// BAD — infinite loop when lo === mid
if (arr[mid] &lt; target) lo = mid;       // ❌
else hi = mid;

// GOOD
if (arr[mid] &lt; target) lo = mid + 1;
else hi = mid;
</code></pre>

<h3>Bug 3: Missing <code>+1</code> on the asymmetric template</h3>
<pre><code class="language-js">// "Largest x where pred(x)"
const mid = (lo + hi) &gt;&gt; 1;       // rounds DOWN
if (pred(mid)) lo = mid;            // infinite loop when lo === mid

// FIX — round up
const mid = (lo + hi + 1) &gt;&gt; 1;
</code></pre>

<h3>Bug 4: Forgetting bounds check after loop</h3>
<pre><code class="language-js">// Lower bound; arr[lo] could be out of range
return arr[lo] === target ? lo : -1;       // ❌ may read out-of-bounds

// FIX
return lo &lt; arr.length &amp;&amp; arr[lo] === target ? lo : -1;
</code></pre>

<h3>Bug 5: Off-by-one in upper bound</h3>
<pre><code class="language-js">// Upper bound returns one past last match
const last = upperBound(arr, target);    // ❌ wrong; subtract 1
const last = upperBound(arr, target) - 1;
</code></pre>

<h3>Bug 6: Treating non-monotone predicate as monotone</h3>
<pre><code class="language-js">// nums = [1, 5, 3, 7, 2]; "find smallest x where x &gt; 4"?
// The array isn't sorted — binary search doesn't apply.
// Either sort first (O(n log n)) or linear scan (O(n)).
</code></pre>

<h3>Bug 7: Inclusive vs exclusive confusion</h3>
<pre><code class="language-js">// Inclusive: [lo, hi]
let lo = 0, hi = arr.length - 1;
while (lo &lt;= hi) { ... }

// Half-open: [lo, hi)
let lo = 0, hi = arr.length;
while (lo &lt; hi) { ... }
</code></pre>
<p>Mixing them (<code>lo = 0, hi = arr.length</code> with <code>while (lo &lt;= hi)</code>) can read out-of-bounds.</p>

<h3>Bug 8: Wrong direction on rotated search</h3>
<pre><code class="language-js">// You must determine which half is sorted before deciding direction
if (nums[lo] &lt;= nums[mid]) {
  // left half sorted
  if (target in [nums[lo], nums[mid])) hi = mid - 1;
  else lo = mid + 1;
} else {
  // right half sorted
  if (target in (nums[mid], nums[hi]]) lo = mid + 1;
  else hi = mid - 1;
}
</code></pre>
<p>Off-by-one in any of those bounds → wrong answer or infinite loop.</p>

<h3>Bug 9: Floating-point loop with integer condition</h3>
<pre><code class="language-js">while (lo &lt; hi) { ... }   // never terminates with floats due to precision
while (hi - lo &gt; 1e-9) { ... }   // epsilon
</code></pre>

<h3>Bug 10: Recomputing predicate on the same value</h3>
<pre><code class="language-js">// BAD
while (lo &lt; hi) {
  if (predicate(mid)) ...
  else if (predicate(mid)) ...    // duplicate call
}
// FIX — call once, store
const ok = predicate(mid);
</code></pre>

<h3>Anti-pattern 1: linear search where binary search applies</h3>
<p>O(log n) vs O(n) — for sorted inputs and frequent queries, this matters even at n = 1000.</p>

<h3>Anti-pattern 2: implementing exact match without lower_bound</h3>
<p>Lower_bound + post-check is more flexible: gives you "found?" + "where to insert?" + "first match" + "last match" via a single template.</p>

<h3>Anti-pattern 3: not testing edge cases</h3>
<p>Always run on n=0, n=1, target before all, after all, equal to all, equal to none. Five tests; covers 90% of bugs.</p>

<h3>Anti-pattern 4: copy-paste templates without understanding</h3>
<p>Templates differ in <em>tiny</em> ways. Pasting one and tweaking a comparison creates bugs that don't manifest until runtime. Internalize one template; defend it.</p>

<h3>Anti-pattern 5: binary searching on un-monotone predicates</h3>
<p>"Find first peak" works because peaks introduce monotonicity locally. But "find any peak" is still binary-search-able only if you exploit the right structure. Verify monotonicity ALWAYS before binary searching.</p>

<h3>Anti-pattern 6: not considering "binary search on the answer"</h3>
<p>Many problems that look like search/optimization can be solved this way: capacity, speed, count, etc. If the predicate "is X feasible" is monotone, binary-search.</p>

<h3>Anti-pattern 7: implementing your own when the language has one</h3>
<p>Python has <code>bisect</code>, C++ has <code>lower_bound</code> / <code>upper_bound</code>, Java has <code>Arrays.binarySearch</code>. JS does NOT — that's why JS interviews ask binary search so often.</p>

<h3>Anti-pattern 8: searching unsorted data</h3>
<p>Binary search requires sorted input. If unsorted, sort first (O(n log n) one-time) or use a different algorithm.</p>

<h3>Anti-pattern 9: ignoring the answer's existence</h3>
<p>"Find smallest x with predicate" — if no x exists, the loop returns the right boundary. Always check feasibility of the returned value when the answer might not exist.</p>

<h3>Anti-pattern 10: using <code>Math.floor((lo + hi) / 2)</code> when <code>(lo + hi) &gt;&gt; 1</code> works</h3>
<p>JS: both work for arrays under 1 billion entries. Bit shift is faster and more idiomatic.</p>
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
    <tr><td>Search Insert Position</td><td>Lower bound</td></tr>
    <tr><td>First &amp; Last Position of Element</td><td>Lower + upper bound</td></tr>
    <tr><td>Search in Rotated Sorted Array I / II</td><td>Identify sorted half each iteration</td></tr>
    <tr><td>Find Minimum in Rotated Sorted Array</td><td>Compare with right boundary</td></tr>
    <tr><td>Find Peak Element</td><td>Compare mid with mid+1</td></tr>
    <tr><td>Square Root</td><td>BS for largest x with x² ≤ n</td></tr>
    <tr><td>Search 2D Matrix</td><td>Treat as 1D OR staircase descent</td></tr>
    <tr><td>Capacity to Ship Within D Days</td><td>BS on answer; predicate canShip</td></tr>
    <tr><td>Koko Eating Bananas</td><td>BS on speed; predicate hours</td></tr>
    <tr><td>Split Array Largest Sum</td><td>BS on max sum; predicate canSplit</td></tr>
    <tr><td>Median of Two Sorted Arrays</td><td>BS partition position</td></tr>
    <tr><td>Find First Bad Version</td><td>Lower bound on boolean predicate</td></tr>
    <tr><td>H-Index II</td><td>BS on citation index</td></tr>
    <tr><td>Aggressive Cows / Allocate Books</td><td>BS on min/max distance / pages</td></tr>
  </tbody>
</table>

<h3>Pattern selection cheatsheet</h3>
<table>
  <thead><tr><th>Problem signal</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>Sorted array + "find / insert"</td><td>Lower bound</td></tr>
    <tr><td>Sorted array + "first / last occurrence"</td><td>Lower + upper bound</td></tr>
    <tr><td>Rotated sorted array</td><td>Modified BS comparing halves</td></tr>
    <tr><td>"Smallest x such that predicate(x)"</td><td>Half-open BS with predicate</td></tr>
    <tr><td>"Largest x such that predicate(x)"</td><td>BS rounding mid up</td></tr>
    <tr><td>"Min capacity / max distance" optimization</td><td>BS on answer</td></tr>
    <tr><td>2D sorted matrix</td><td>1D-flattened BS or staircase</td></tr>
    <tr><td>Floating-point answer</td><td>BS with epsilon termination</td></tr>
    <tr><td>Unbounded sorted stream</td><td>Exponential search + BS</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Lower bound + upper bound (memorize the half-open template).</li>
  <li>Search in Rotated Sorted Array (no duplicates).</li>
  <li>Find Peak Element.</li>
  <li>Square Root (integer).</li>
  <li>Capacity to Ship within D Days.</li>
  <li>Koko Eating Bananas.</li>
  <li>Median of Two Sorted Arrays (advanced).</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li><code>while (lo &lt;= hi)</code> with <code>hi = arr.length</code> — out-of-bounds access on the high end.</li>
  <li><code>lo = mid</code> in the "true → go right" template — infinite loop.</li>
  <li>Returning <code>lo</code> after lower-bound without checking bounds — out-of-range read.</li>
  <li>Upper bound returning the last-match index without subtracting 1 — off-by-one.</li>
  <li>Rotated search comparing wrong half — wrong direction.</li>
  <li>Floating-point BS with <code>lo &lt; hi</code> instead of epsilon — never terminates.</li>
  <li>Predicate not monotone — wrong answer with no error.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Template fluency</td><td>You write lower_bound from memory without bugs.</td></tr>
    <tr><td>Invariant articulation</td><td>You state "lo is the smallest possible answer" before coding.</td></tr>
    <tr><td>Edge case discipline</td><td>You test n=0, n=1, target before/after/equal proactively.</td></tr>
    <tr><td>Predicate framing</td><td>You convert problems to "smallest x where pred(x)" with a clear pred.</td></tr>
    <tr><td>BS-on-answer fluency</td><td>You name capacity / Koko / split-array as binary search problems.</td></tr>
    <tr><td>Off-by-one rigor</td><td>You distinguish lower vs upper bound and use them precisely.</td></tr>
    <tr><td>Complexity articulation</td><td>You quote O(log n) for the search and overall complexity (often O(n log A) for BS-on-answer where A is answer range).</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>FlatList scroll-to-index:</strong> finding the cell at a target offset using binary search through the offsets array.</li>
  <li><strong>Time-series queries:</strong> "show events at this time" against a sorted timestamps array → BS.</li>
  <li><strong>Auto-suggest with prefix:</strong> binary search the sorted dictionary for the first prefix match.</li>
  <li><strong>Storage tier selection:</strong> "smallest tier that fits this payload" — BS on answer.</li>
  <li><strong>Animation timeline:</strong> binary search a keyframe array by time to find the active interval.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why is the half-open template safer?"</em> — Single loop condition, single update rule, predictable termination point. Inclusive [lo, hi] requires juggling <code>hi = mid - 1</code> and <code>lo = mid + 1</code>; easier to mismatch.</li>
  <li><em>"When is binary search wrong even with a sorted array?"</em> — When the comparison isn't a total order (e.g., partial orders, NaN comparisons, custom comparators with bugs). When you need stability of equal-key ordering and the algorithm doesn't guarantee it.</li>
  <li><em>"How does binary search interact with floating-point?"</em> — Use epsilon termination, mind precision drift. For very tight tolerance, use exact arithmetic (BigInt scaling) when possible.</li>
  <li><em>"What's exponential search?"</em> — A way to binary search an unbounded stream: repeatedly double the bound until you bracket the target, then BS within the bracket. O(log n) where n is the answer index.</li>
  <li><em>"Why does median-of-two-sorted-arrays use BS?"</em> — You're searching for the partition point in the smaller array such that the left halves of both arrays together contain exactly half the total elements with all left ≤ all right. Predicate is monotone in partition index.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd extract a small <code>bsearch</code> utility module since JS lacks one — saves rewriting on every project."</li>
  <li>"I'd add property-based tests: random sorted inputs + targets, verify against linear search."</li>
  <li>"I'd add benchmarks for tail-latency on sorted arrays of size 10⁶ to confirm O(log n) holds in practice (cache effects can change constants)."</li>
  <li>"I'd handle the rotated-with-duplicates case with the explicit O(n) worst case documented."</li>
  <li>"For BS-on-answer, I'd verify the answer's feasibility post-loop in case the predicate had a bug or the bounds were too tight."</li>
</ul>
`
    }
  ]
});
