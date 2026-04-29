window.PREP_SITE.registerTopic({
  id: 'dsa-arrays-strings',
  module: 'DSA',
  title: 'Arrays & Strings',
  estimatedReadTime: '28 min',
  tags: ['dsa', 'array', 'string', 'patterns', 'in-place', 'reverse', 'rotate'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Arrays and strings are the most-asked categories in interviews. Master a small set of patterns and you've covered 60% of array-related problems.</p>
<ul>
  <li><strong>Two pointers</strong> — opposite ends or same direction with different speeds.</li>
  <li><strong>Sliding window</strong> — variable or fixed-size window over the array.</li>
  <li><strong>Prefix sums</strong> — preprocess for O(1) range sum queries.</li>
  <li><strong>In-place operations</strong> — modify the array without extra space.</li>
  <li><strong>Sorting first</strong> — many problems become trivial after a sort.</li>
  <li><strong>Hash maps for lookups</strong> — O(1) presence checks; trade space for time.</li>
  <li><strong>Rotation</strong> — three reverses (reverse all, reverse left part, reverse right part).</li>
  <li><strong>Reverse</strong> — two pointers from both ends, swap.</li>
  <li><strong>Cyclic sort</strong> — for "find missing/duplicate in [1..n]" problems.</li>
  <li><strong>String-specific</strong>: char counts, palindrome (two pointers), anagram (sorted or count), substring patterns.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Identify the pattern, write the template, handle edges (empty, single element, all-same, sorted, reverse-sorted). Most array/string problems are 1-2 patterns from the canonical list applied to a specific question.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why arrays / strings dominate</h3>
<ul>
  <li>Universal, language-agnostic, fundamental.</li>
  <li>Test multiple skills: indexing, mutation, search, sort, hash, recursion.</li>
  <li>Real-world: most data is array-shaped.</li>
  <li>Patterns transfer to other DSA categories.</li>
</ul>

<h3>The pattern catalog</h3>
<table>
  <thead><tr><th>Pattern</th><th>When</th><th>Time</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Two pointers</td><td>Sorted array, palindrome, two-sum-on-sorted, partitioning</td><td>O(n)</td><td>Reverse, Container with most water</td></tr>
    <tr><td>Sliding window</td><td>Subarray / substring with property</td><td>O(n)</td><td>Longest substring without repeat, max sum subarray of size k</td></tr>
    <tr><td>Prefix sum</td><td>Range sum / count queries</td><td>O(n) prep + O(1) query</td><td>Range sum, equal partition</td></tr>
    <tr><td>Hash map</td><td>Lookups, frequency, complement search</td><td>O(n) time, O(n) space</td><td>Two sum, anagrams</td></tr>
    <tr><td>Sort first</td><td>Closest pairs, k-th element, dedup</td><td>O(n log n)</td><td>3-sum, merge intervals</td></tr>
    <tr><td>Cyclic sort</td><td>Numbers in [1..n] range</td><td>O(n)</td><td>Find missing, find duplicate</td></tr>
    <tr><td>Reverse / rotate</td><td>In-place rearrangement</td><td>O(n)</td><td>Rotate array, reverse words</td></tr>
    <tr><td>Kadane's</td><td>Max subarray sum</td><td>O(n)</td><td>Maximum subarray</td></tr>
  </tbody>
</table>

<h3>Why "in-place"</h3>
<p>Memory-constrained problems. Interviewer often says: "Solve with O(1) extra space." Forces you to manipulate the array directly — swaps, two pointers, marking via sign, etc.</p>

<h3>Why string differs from array</h3>
<ul>
  <li>JS strings are immutable. Concatenation in a loop is O(n²).</li>
  <li>Convert to array of chars for in-place: <code>str.split('')</code>.</li>
  <li>Char counts are bounded (256 for ASCII, 26 for lowercase letters) → can use fixed-size arrays instead of hash maps.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "two pointers" picture</h3>
<div class="diagram">
<pre>
 Opposite ends:
   l →                    ← r
   [4, 1, 7, 3, 5, 9, 2, 8]
   converge in middle, common in palindromes / pair sums

 Same direction (slow + fast):
   slow→        fast→→
   [4, 1, 7, 3, 5, 9, 2, 8]
   slow advances when condition met; fast iterates
   common in dedup / partition / cycle detection</pre>
</div>

<h3>The "sliding window" picture</h3>
<div class="diagram">
<pre>
 [a, b, c, a, d, e, c, a, b]
        l───→r            ← variable: r expands; l contracts when invariant broken
        l→r               ← fixed size k

 Maintain: window state (set, count, sum)
 Expand r: include element
 Contract l: when condition violated
 Track best answer along the way</pre>
</div>

<h3>The "prefix sum" picture</h3>
<div class="diagram">
<pre>
 nums:   [3, 1, 4, 1, 5, 9, 2, 6]
 prefix: [0, 3, 4, 8, 9, 14, 23, 25, 31]
                ↑    ↑  ↑
 Range sum [2..5] = prefix[6] - prefix[2] = 23 - 4 = 19
 (sum from index 2 to 5 inclusive, plus the leading 0)</pre>
</div>

<h3>The "rotation = three reverses" picture</h3>
<pre><code>Rotate right by k:
 [1, 2, 3, 4, 5, 6, 7]   k=3, expected: [5,6,7,1,2,3,4]

 1. Reverse entire:    [7,6,5,4,3,2,1]
 2. Reverse first k:   [5,6,7,4,3,2,1]
 3. Reverse remaining: [5,6,7,1,2,3,4] ✓

 In-place, O(n) time, O(1) extra.</code></pre>

<h3>The "edge cases" checklist</h3>
<ul>
  <li>Empty array / string.</li>
  <li>Single element.</li>
  <li>All same elements.</li>
  <li>Sorted ascending.</li>
  <li>Sorted descending.</li>
  <li>Negative numbers (if relevant).</li>
  <li>Duplicates allowed/not.</li>
  <li>Very large input (overflow, perf).</li>
  <li>Boundary indices.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Two pointers and sliding window are the same." Both use multiple indices, but:</p>
  <ul>
    <li><strong>Two pointers</strong>: typically converging from opposite ends, or fast/slow, doing pointwise work.</li>
    <li><strong>Sliding window</strong>: maintaining a region with a property (sum, distinct count), expanding and contracting.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Two pointers — opposite ends</h3>
<pre><code class="language-js">// Reverse in place
function reverse(arr) {
  let l = 0, r = arr.length - 1;
  while (l &lt; r) {
    [arr[l], arr[r]] = [arr[r], arr[l]];
    l++; r--;
  }
}

// Two-sum on sorted
function twoSumSorted(arr, target) {
  let l = 0, r = arr.length - 1;
  while (l &lt; r) {
    const s = arr[l] + arr[r];
    if (s === target) return [l, r];
    if (s &lt; target) l++; else r--;
  }
  return [-1, -1];
}</code></pre>

<h3>Two pointers — same direction (fast/slow)</h3>
<pre><code class="language-js">// Remove duplicates from sorted array, in place; return new length
function dedupSorted(arr) {
  if (arr.length === 0) return 0;
  let slow = 0;
  for (let fast = 1; fast &lt; arr.length; fast++) {
    if (arr[fast] !== arr[slow]) {
      slow++;
      arr[slow] = arr[fast];
    }
  }
  return slow + 1;
}

// Move zeros to end
function moveZeros(arr) {
  let slow = 0;
  for (let fast = 0; fast &lt; arr.length; fast++) {
    if (arr[fast] !== 0) {
      [arr[slow], arr[fast]] = [arr[fast], arr[slow]];
      slow++;
    }
  }
}</code></pre>

<h3>Sliding window — variable</h3>
<pre><code class="language-js">// Longest substring without repeating chars
function longestUnique(s) {
  const set = new Set();
  let l = 0, max = 0;
  for (let r = 0; r &lt; s.length; r++) {
    while (set.has(s[r])) set.delete(s[l++]);   // contract
    set.add(s[r]);                                // expand
    max = Math.max(max, r - l + 1);
  }
  return max;
}</code></pre>

<h3>Sliding window — fixed</h3>
<pre><code class="language-js">// Max sum of any contiguous subarray of size k
function maxSumK(arr, k) {
  let sum = 0;
  for (let i = 0; i &lt; k; i++) sum += arr[i];
  let max = sum;
  for (let i = k; i &lt; arr.length; i++) {
    sum += arr[i] - arr[i - k];
    max = Math.max(max, sum);
  }
  return max;
}</code></pre>

<h3>Prefix sum</h3>
<pre><code class="language-js">// Build prefix sum (1-indexed for cleaner range queries)
function buildPrefix(arr) {
  const prefix = [0];
  for (const x of arr) prefix.push(prefix.at(-1) + x);
  return prefix;
}

// Range sum from index l to r (inclusive), 0-indexed
function rangeSum(prefix, l, r) {
  return prefix[r + 1] - prefix[l];
}</code></pre>

<h3>Kadane's algorithm — max subarray sum</h3>
<pre><code class="language-js">function maxSubarray(arr) {
  let best = arr[0], current = arr[0];
  for (let i = 1; i &lt; arr.length; i++) {
    current = Math.max(arr[i], current + arr[i]);
    best = Math.max(best, current);
  }
  return best;
}
// O(n) time, O(1) space</code></pre>

<h3>Cyclic sort (for [1..n] range)</h3>
<pre><code class="language-js">// Find missing number in [1..n] from array of n-1 distinct numbers
function findMissing(arr) {
  let i = 0;
  while (i &lt; arr.length) {
    const correctIdx = arr[i] - 1;
    if (arr[i] &lt; arr.length + 1 &amp;&amp; arr[i] !== arr[correctIdx]) {
      [arr[i], arr[correctIdx]] = [arr[correctIdx], arr[i]];
    } else {
      i++;
    }
  }
  for (let i = 0; i &lt; arr.length; i++)
    if (arr[i] !== i + 1) return i + 1;
  return arr.length + 1;
}</code></pre>

<h3>Rotate array</h3>
<pre><code class="language-js">// Rotate right by k positions
function rotate(arr, k) {
  k = k % arr.length;
  reverse(arr, 0, arr.length - 1);
  reverse(arr, 0, k - 1);
  reverse(arr, k, arr.length - 1);
}
function reverse(arr, l, r) {
  while (l &lt; r) { [arr[l], arr[r]] = [arr[r], arr[l]]; l++; r--; }
}
// O(n) time, O(1) space</code></pre>

<h3>String-specific patterns</h3>
<pre><code class="language-js">// Char count (lowercase Latin)
function charCount(s) {
  const count = new Array(26).fill(0);
  for (const c of s) count[c.charCodeAt(0) - 97]++;
  return count;
}

// Anagram check
function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  const ca = charCount(a), cb = charCount(b);
  return ca.every((x, i) =&gt; x === cb[i]);
}

// Palindrome (alphanumeric only)
function isPalindrome(s) {
  s = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let l = 0, r = s.length - 1;
  while (l &lt; r) {
    if (s[l] !== s[r]) return false;
    l++; r--;
  }
  return true;
}

// Reverse words in a sentence
function reverseWords(s) {
  return s.split(/\\s+/).filter(Boolean).reverse().join(' ');
}</code></pre>

<h3>Three sum (sort + two pointers)</h3>
<pre><code class="language-js">function threeSum(nums) {
  nums.sort((a, b) =&gt; a - b);
  const result = [];
  for (let i = 0; i &lt; nums.length - 2; i++) {
    if (i &gt; 0 &amp;&amp; nums[i] === nums[i-1]) continue;       // skip dups for i
    let l = i + 1, r = nums.length - 1;
    while (l &lt; r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum === 0) {
        result.push([nums[i], nums[l], nums[r]]);
        while (l &lt; r &amp;&amp; nums[l] === nums[l+1]) l++;     // skip dups
        while (l &lt; r &amp;&amp; nums[r] === nums[r-1]) r--;
        l++; r--;
      } else if (sum &lt; 0) l++; else r--;
    }
  }
  return result;
}
// O(n²) time, O(1) extra (excluding output + sort)</code></pre>

<h3>Merge intervals</h3>
<pre><code class="language-js">function merge(intervals) {
  intervals.sort((a, b) =&gt; a[0] - b[0]);
  const result = [intervals[0]];
  for (let i = 1; i &lt; intervals.length; i++) {
    const last = result.at(-1);
    if (intervals[i][0] &lt;= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      result.push(intervals[i]);
    }
  }
  return result;
}
// O(n log n) due to sort</code></pre>

<h3>Product of array except self</h3>
<pre><code class="language-js">// Without division
function productExceptSelf(nums) {
  const result = new Array(nums.length).fill(1);
  let prefix = 1;
  for (let i = 0; i &lt; nums.length; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = nums.length - 1; i &gt;= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }
  return result;
}
// O(n) time, O(1) extra (output not counted)</code></pre>

<h3>Common operations cost (JS)</h3>
<table>
  <thead><tr><th>Op</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td>arr[i]</td><td>O(1)</td></tr>
    <tr><td>arr.push / pop</td><td>O(1) amortized</td></tr>
    <tr><td>arr.shift / unshift</td><td>O(n)</td></tr>
    <tr><td>arr.splice(i, n)</td><td>O(n)</td></tr>
    <tr><td>arr.slice / concat / map / filter</td><td>O(n)</td></tr>
    <tr><td>arr.includes / indexOf</td><td>O(n)</td></tr>
    <tr><td>arr.sort</td><td>O(n log n)</td></tr>
    <tr><td>set.has / map.has</td><td>O(1) avg</td></tr>
    <tr><td>str.charAt / str[i]</td><td>O(1)</td></tr>
    <tr><td>str + str (concat)</td><td>O(n)</td></tr>
    <tr><td>str in loop with += </td><td>O(n²) total</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — Two Sum</h3>
<pre><code class="language-js">// Find two indices that sum to target
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i &lt; nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
// O(n) time, O(n) space</code></pre>

<h3>Example 2 — Best Time to Buy and Sell Stock</h3>
<pre><code class="language-js">function maxProfit(prices) {
  let minPrice = Infinity, maxProfit = 0;
  for (const p of prices) {
    minPrice = Math.min(minPrice, p);
    maxProfit = Math.max(maxProfit, p - minPrice);
  }
  return maxProfit;
}
// O(n) time, O(1) space</code></pre>

<h3>Example 3 — Container With Most Water</h3>
<pre><code class="language-js">function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l &lt; r) {
    const area = Math.min(height[l], height[r]) * (r - l);
    best = Math.max(best, area);
    if (height[l] &lt; height[r]) l++; else r--;
  }
  return best;
}
// O(n) time, O(1) space — two pointers from ends</code></pre>

<h3>Example 4 — Trapping Rain Water</h3>
<pre><code class="language-js">function trap(height) {
  let l = 0, r = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (l &lt; r) {
    if (height[l] &lt; height[r]) {
      leftMax = Math.max(leftMax, height[l]);
      water += leftMax - height[l];
      l++;
    } else {
      rightMax = Math.max(rightMax, height[r]);
      water += rightMax - height[r];
      r--;
    }
  }
  return water;
}
// O(n) time, O(1) space</code></pre>

<h3>Example 5 — Longest Substring Without Repeating</h3>
<pre><code class="language-js">function lengthOfLongestSubstring(s) {
  const map = new Map();
  let l = 0, max = 0;
  for (let r = 0; r &lt; s.length; r++) {
    if (map.has(s[r]) &amp;&amp; map.get(s[r]) &gt;= l) {
      l = map.get(s[r]) + 1;
    }
    map.set(s[r], r);
    max = Math.max(max, r - l + 1);
  }
  return max;
}
// O(n) time, O(min(n, charset)) space</code></pre>

<h3>Example 6 — Group Anagrams</h3>
<pre><code class="language-js">function groupAnagrams(strs) {
  const groups = new Map();
  for (const s of strs) {
    const key = s.split('').sort().join('');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}
// O(n × k log k) where k = avg string length</code></pre>

<h3>Example 7 — Valid Anagram</h3>
<pre><code class="language-js">function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);
  for (let i = 0; i &lt; s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
    count[t.charCodeAt(i) - 97]--;
  }
  return count.every(c =&gt; c === 0);
}
// O(n) time, O(1) space (26 fixed)</code></pre>

<h3>Example 8 — Maximum Subarray (Kadane's)</h3>
<pre><code class="language-js">function maxSubArray(nums) {
  let current = nums[0], max = nums[0];
  for (let i = 1; i &lt; nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    max = Math.max(max, current);
  }
  return max;
}
// O(n) time, O(1) space</code></pre>

<h3>Example 9 — Merge Sorted Array (in place)</h3>
<pre><code class="language-js">function merge(nums1, m, nums2, n) {
  let i = m - 1, j = n - 1, k = m + n - 1;
  while (j &gt;= 0) {
    if (i &gt;= 0 &amp;&amp; nums1[i] &gt; nums2[j]) {
      nums1[k--] = nums1[i--];
    } else {
      nums1[k--] = nums2[j--];
    }
  }
}
// O(m + n) time, O(1) space — fill from the back</code></pre>

<h3>Example 10 — Find Duplicate Number (cyclic)</h3>
<pre><code class="language-js">// numbers in [1..n], one duplicate, find without modifying
function findDuplicate(nums) {
  // Floyd's cycle detection — treat as linked list
  let slow = nums[0], fast = nums[0];
  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);
  slow = nums[0];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }
  return slow;
}
// O(n) time, O(1) space — clever cycle approach</code></pre>

<h3>Example 11 — Valid Palindrome (alphanumeric)</h3>
<pre><code class="language-js">function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  const isAlnum = (c) =&gt; /[a-zA-Z0-9]/.test(c);
  while (l &lt; r) {
    while (l &lt; r &amp;&amp; !isAlnum(s[l])) l++;
    while (l &lt; r &amp;&amp; !isAlnum(s[r])) r--;
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++; r--;
  }
  return true;
}
// O(n) time, O(1) space</code></pre>

<h3>Example 12 — Rotate Array</h3>
<pre><code class="language-js">function rotate(nums, k) {
  k = k % nums.length;
  reverse(nums, 0, nums.length - 1);
  reverse(nums, 0, k - 1);
  reverse(nums, k, nums.length - 1);
}
function reverse(arr, l, r) {
  while (l &lt; r) { [arr[l], arr[r]] = [arr[r], arr[l]]; l++; r--; }
}
// O(n) time, O(1) space</code></pre>

<h3>Example 13 — Spiral Matrix</h3>
<pre><code class="language-js">function spiralOrder(matrix) {
  const result = [];
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;
  while (top &lt;= bottom &amp;&amp; left &lt;= right) {
    for (let j = left; j &lt;= right; j++) result.push(matrix[top][j]);
    top++;
    for (let i = top; i &lt;= bottom; i++) result.push(matrix[i][right]);
    right--;
    if (top &lt;= bottom) {
      for (let j = right; j &gt;= left; j--) result.push(matrix[bottom][j]);
      bottom--;
    }
    if (left &lt;= right) {
      for (let i = bottom; i &gt;= top; i--) result.push(matrix[i][left]);
      left++;
    }
  }
  return result;
}
// O(m × n) time, O(1) extra</code></pre>

<h3>Example 14 — Set Matrix Zeros</h3>
<pre><code class="language-js">function setZeroes(matrix) {
  const m = matrix.length, n = matrix[0].length;
  let firstRowZero = false, firstColZero = false;
  for (let j = 0; j &lt; n; j++) if (matrix[0][j] === 0) firstRowZero = true;
  for (let i = 0; i &lt; m; i++) if (matrix[i][0] === 0) firstColZero = true;
  for (let i = 1; i &lt; m; i++)
    for (let j = 1; j &lt; n; j++)
      if (matrix[i][j] === 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
  for (let i = 1; i &lt; m; i++)
    for (let j = 1; j &lt; n; j++)
      if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0;
  if (firstRowZero) for (let j = 0; j &lt; n; j++) matrix[0][j] = 0;
  if (firstColZero) for (let i = 0; i &lt; m; i++) matrix[i][0] = 0;
}
// O(m × n) time, O(1) extra space</code></pre>

<h3>Example 15 — Encode and Decode Strings (length-prefixed)</h3>
<pre><code class="language-js">function encode(strs) {
  return strs.map(s =&gt; s.length + '#' + s).join('');
}
function decode(s) {
  const result = [];
  let i = 0;
  while (i &lt; s.length) {
    let j = i;
    while (s[j] !== '#') j++;
    const len = parseInt(s.slice(i, j));
    result.push(s.slice(j + 1, j + 1 + len));
    i = j + 1 + len;
  }
  return result;
}
// Length prefix avoids escaping concerns. Common pattern.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Empty input</h3>
<p>Many algorithms break on length 0. Always handle: return early, return default value (0 for sum, [] for list, null for first element).</p>

<h3>2. Single element</h3>
<p>Trivially palindrome, sorted, etc. Often handled implicitly but check loops don't underflow.</p>

<h3>3. All same elements</h3>
<p>Two-sum with duplicates: <code>[3,3], target=6</code>. Sliding window with all-same: window stays full or contracts to 1.</p>

<h3>4. Already sorted / reverse sorted</h3>
<p>Some algorithms have worst case here (quicksort with bad pivot). Test both.</p>

<h3>5. Negatives + positives + zeros</h3>
<p>Especially in subarray sum problems. Kadane's handles all-negative correctly (returns the maximum single element). Don't write Kadane that returns 0 on all-negative.</p>

<h3>6. Integer overflow</h3>
<p>JS numbers handle up to 2^53 precisely. For larger sums, BigInt or modular arithmetic. Prefix sums on long arrays of large ints: aware.</p>

<h3>7. Off-by-one in two pointers</h3>
<p><code>while (l &lt; r)</code> vs <code>while (l &lt;= r)</code>. The first stops when they meet; the second processes the meeting point. Correctness depends on problem.</p>

<h3>8. Sliding window with empty constraint</h3>
<p>Window of distinct chars: starting empty, expanding. If first char immediately violates a (different) constraint, the contract loop should handle it.</p>

<h3>9. In-place modification while iterating</h3>
<p>Modifying array length / elements during iteration can skip elements. Use indices carefully or iterate in reverse for deletes.</p>

<h3>10. String immutability</h3>
<p><code>str[i] = 'x'</code> doesn't work. Convert to array first: <code>const arr = str.split('')</code>.</p>

<h3>11. Char comparisons</h3>
<p><code>'a' &lt; 'b'</code> works in JS but not all char encodings. Use char codes for safety: <code>s.charCodeAt(0)</code>.</p>

<h3>12. Hash map vs object for keys</h3>
<p><code>Map</code> handles any key (objects, numbers). Object only string keys (via coercion). Map maintains insertion order; objects do too in modern JS.</p>

<h3>13. Sorting strings</h3>
<p><code>arr.sort()</code> uses lexicographic order. <code>['10', '9'].sort()</code> → <code>['10', '9']</code> (because '1' &lt; '9'). For numeric sort: <code>(a, b) =&gt; a - b</code>.</p>

<h3>14. Sort stability</h3>
<p>JS sort is stable since ES2019. Objects with equal keys retain original order. Older engines: not guaranteed.</p>

<h3>15. Rotation k larger than length</h3>
<p>Handle <code>k = k % n</code> first. Rotating by 7 in array of 5 = rotating by 2.</p>

<h3>16. Cyclic sort with values out of range</h3>
<p>If input has values outside [1..n], cyclic sort won't work as-is. Filter or handle separately.</p>

<h3>17. Two pointers and duplicates in 3-sum</h3>
<p>Skip duplicates at all three positions. Easy to forget the inner two; results will have duplicates.</p>

<h3>18. Merge intervals — empty or single</h3>
<p>Empty input → return []. Single interval → return [interval]. Sort first; iteration handles.</p>

<h3>19. <code>arr.length</code> in tight loops</h3>
<p>JS engines cache; minor perf optimization to hoist: <code>for (let i = 0, n = arr.length; i &lt; n; i++)</code>. Negligible in modern engines.</p>

<h3>20. Spaces / special chars in strings</h3>
<p>Palindromes, anagrams: ignore spaces / case? Read the prompt. <code>"A man a plan"</code> needs preprocessing.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — string concatenation in loop</h3>
<pre><code class="language-js">// BAD: O(n²)
let s = '';
for (const x of arr) s += x;

// GOOD: O(n)
const s = arr.join('');</code></pre>

<h3>Anti-pattern 2 — <code>arr.includes</code> in nested loop</h3>
<pre><code class="language-js">// O(n × m) — linear scan inside loop
for (const a of arr1)
  if (arr2.includes(a)) result.push(a);

// O(n + m) — Set lookup
const set = new Set(arr2);
for (const a of arr1)
  if (set.has(a)) result.push(a);</code></pre>

<h3>Anti-pattern 3 — modifying array while iterating</h3>
<pre><code class="language-js">// BAD — skips elements
for (let i = 0; i &lt; arr.length; i++)
  if (arr[i] === target) arr.splice(i, 1);

// GOOD — iterate backward
for (let i = arr.length - 1; i &gt;= 0; i--)
  if (arr[i] === target) arr.splice(i, 1);

// BETTER — filter
arr = arr.filter(x =&gt; x !== target);</code></pre>

<h3>Anti-pattern 4 — sorting strings of numbers</h3>
<pre><code class="language-js">// BAD: ['10', '9', '2'].sort() → ['10', '2', '9']
nums.sort();

// GOOD
nums.sort((a, b) =&gt; a - b);</code></pre>

<h3>Anti-pattern 5 — copying array with <code>...arr</code> in loop</h3>
<pre><code class="language-js">// O(n²) total — each spread is O(n)
let acc = [];
for (const x of arr) acc = [...acc, x];

// O(n)
const acc = [...arr];</code></pre>

<h3>Anti-pattern 6 — using <code>indexOf</code> instead of Set/Map</h3>
<p>Linear scan per call → O(n²). Use Set/Map for O(1) lookup.</p>

<h3>Anti-pattern 7 — recursive solution that should be iterative</h3>
<p>Reversing array via recursion: O(n) stack space. Iterative two-pointer: O(1).</p>

<h3>Anti-pattern 8 — not handling empty / single-element</h3>
<p>Off-by-one or array out of bounds. Always test edges.</p>

<h3>Anti-pattern 9 — mutating sort source vs returning new</h3>
<p><code>arr.sort()</code> mutates in place. <code>arr.toSorted()</code> returns new (modern). If caller doesn't expect mutation: copy first or use toSorted.</p>

<h3>Anti-pattern 10 — using string as key for object pairs</h3>
<pre><code class="language-js">// BAD — collisions: "1,2" === "1,2" but [1,2] !== [1,2]
const map = {};
map[[1, 2]] = 'a';   // key is "1,2"

// Better: nested map or stringify with delimiter</code></pre>

<h3>Anti-pattern 11 — hard-coding charset size</h3>
<p>Counting chars assuming 26 lowercase letters. Real input may have uppercase, digits, Unicode. State assumption clearly.</p>

<h3>Anti-pattern 12 — over-using regex</h3>
<p>Regex for simple operations is overkill + slow. <code>str.split('').reverse().join('')</code> over <code>str.replace(/(.)(.)/, '$2$1')</code>.</p>

<h3>Anti-pattern 13 — not skipping duplicates in 3-sum</h3>
<p>Output has [1,1,2] and [1,1,2] as duplicates. Skip <code>nums[i] === nums[i-1]</code> for i, l, r.</p>

<h3>Anti-pattern 14 — Math.floor on negative numbers</h3>
<p><code>Math.floor(-1/2) = -1</code>, not 0. Use <code>(a + b) &gt;&gt; 1</code> for unsigned int division, or be careful with negative bounds.</p>

<h3>Anti-pattern 15 — re-declaring helpers in tight loops</h3>
<pre><code class="language-js">// Slow — function created each iteration
for (let i = 0; i &lt; n; i++) {
  const helper = (x) =&gt; x * 2;
  helper(arr[i]);
}

// Fast — hoist the function
const helper = (x) =&gt; x * 2;
for (let i = 0; i &lt; n; i++) helper(arr[i]);</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Two Sum — best approach?</div>
  <div class="qa-answer">
    <p>Hash map with single pass: O(n) time, O(n) space. For each element, check if <code>target - x</code> is in the map; if yes, return both indices; otherwise store current.</p>
    <p>If sorted: two pointers from both ends, O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. When use sliding window?</div>
  <div class="qa-answer">
    <p>Problems asking for a contiguous subarray / substring with some property: max sum of size k, longest substring without repeats, smallest subarray with sum ≥ target, etc. The window has a left + right index; expand right, contract left when invariant breaks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. When use two pointers?</div>
  <div class="qa-answer">
    <ul>
      <li>Sorted array — converging from both ends (two-sum, container).</li>
      <li>Palindrome check.</li>
      <li>Same direction with different speeds (cycle detection, dedup).</li>
      <li>Partitioning around a pivot.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Implement reverse in place.</div>
  <div class="qa-answer">
<pre><code class="language-js">function reverse(arr) {
  let l = 0, r = arr.length - 1;
  while (l &lt; r) {
    [arr[l], arr[r]] = [arr[r], arr[l]];
    l++; r--;
  }
}</code></pre>
    <p>O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Rotate array by k positions.</div>
  <div class="qa-answer">
    <p>Three-reverse trick:</p>
<pre><code class="language-js">function rotate(arr, k) {
  k = k % arr.length;
  reverse(arr, 0, arr.length - 1);
  reverse(arr, 0, k - 1);
  reverse(arr, k, arr.length - 1);
}</code></pre>
    <p>O(n) time, O(1) space. Alternative: copy to new array (O(n) space) or rotate one at a time (O(n×k) — bad).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Maximum subarray sum (Kadane's).</div>
  <div class="qa-answer">
<pre><code class="language-js">function maxSubArray(nums) {
  let current = nums[0], best = nums[0];
  for (let i = 1; i &lt; nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}</code></pre>
    <p>O(n) time, O(1) space. Correctly handles all-negative arrays.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Longest substring without repeating characters.</div>
  <div class="qa-answer">
<pre><code class="language-js">function lengthOfLongestSubstring(s) {
  const map = new Map();
  let l = 0, max = 0;
  for (let r = 0; r &lt; s.length; r++) {
    if (map.has(s[r]) &amp;&amp; map.get(s[r]) &gt;= l)
      l = map.get(s[r]) + 1;
    map.set(s[r], r);
    max = Math.max(max, r - l + 1);
  }
  return max;
}</code></pre>
    <p>O(n) time, O(min(n, charset)) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Three Sum.</div>
  <div class="qa-answer">
    <p>Sort + two-pointer for each i:</p>
<pre><code class="language-js">function threeSum(nums) {
  nums.sort((a, b) =&gt; a - b);
  const result = [];
  for (let i = 0; i &lt; nums.length - 2; i++) {
    if (i &gt; 0 &amp;&amp; nums[i] === nums[i-1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l &lt; r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum === 0) {
        result.push([nums[i], nums[l], nums[r]]);
        while (l &lt; r &amp;&amp; nums[l] === nums[l+1]) l++;
        while (l &lt; r &amp;&amp; nums[r] === nums[r-1]) r--;
        l++; r--;
      } else if (sum &lt; 0) l++; else r--;
    }
  }
  return result;
}</code></pre>
    <p>O(n²) time, O(1) extra (excluding output + sort).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Best Time to Buy and Sell Stock.</div>
  <div class="qa-answer">
<pre><code class="language-js">function maxProfit(prices) {
  let minPrice = Infinity, max = 0;
  for (const p of prices) {
    minPrice = Math.min(minPrice, p);
    max = Math.max(max, p - minPrice);
  }
  return max;
}</code></pre>
    <p>O(n) time, O(1) space. Track running minimum + max profit so far.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Container With Most Water.</div>
  <div class="qa-answer">
    <p>Two pointers from ends; move the shorter pointer (taller stays as candidate):</p>
<pre><code class="language-js">function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l &lt; r) {
    best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
    if (height[l] &lt; height[r]) l++; else r--;
  }
  return best;
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Product of Array Except Self (no division).</div>
  <div class="qa-answer">
    <p>Two passes: prefix products, then suffix products multiplied in:</p>
<pre><code class="language-js">function productExceptSelf(nums) {
  const result = new Array(nums.length).fill(1);
  let prefix = 1;
  for (let i = 0; i &lt; nums.length; i++) { result[i] = prefix; prefix *= nums[i]; }
  let suffix = 1;
  for (let i = nums.length - 1; i &gt;= 0; i--) { result[i] *= suffix; suffix *= nums[i]; }
  return result;
}</code></pre>
    <p>O(n) time, O(1) extra (output not counted).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Move zeros to end.</div>
  <div class="qa-answer">
<pre><code class="language-js">function moveZeroes(nums) {
  let slow = 0;
  for (let fast = 0; fast &lt; nums.length; fast++) {
    if (nums[fast] !== 0) {
      [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
      slow++;
    }
  }
}</code></pre>
    <p>Two-pointer same direction. O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Anagram check.</div>
  <div class="qa-answer">
<pre><code class="language-js">function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);
  for (let i = 0; i &lt; s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
    count[t.charCodeAt(i) - 97]--;
  }
  return count.every(c =&gt; c === 0);
}</code></pre>
    <p>O(n) time, O(1) space (26 fixed). For Unicode: use a Map.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Merge Intervals.</div>
  <div class="qa-answer">
    <p>Sort by start; iterate and merge overlaps:</p>
<pre><code class="language-js">function merge(intervals) {
  intervals.sort((a, b) =&gt; a[0] - b[0]);
  const result = [intervals[0]];
  for (let i = 1; i &lt; intervals.length; i++) {
    const last = result.at(-1);
    if (intervals[i][0] &lt;= last[1]) last[1] = Math.max(last[1], intervals[i][1]);
    else result.push(intervals[i]);
  }
  return result;
}</code></pre>
    <p>O(n log n) due to sort.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What's your debugging checklist for array problems?</div>
  <div class="qa-answer">
    <ol>
      <li>Empty input.</li>
      <li>Single element.</li>
      <li>All same elements.</li>
      <li>Already sorted / reverse sorted.</li>
      <li>Negatives + positives + zeros (if relevant).</li>
      <li>Duplicates allowed?</li>
      <li>Very large input (overflow / perf).</li>
      <li>Off-by-one — recheck l/r initialization and termination.</li>
      <li>Skip duplicates in pointer-based solutions.</li>
      <li>String immutability if dealing with strings.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You recognize patterns (two pointers, sliding window, prefix sums, hash).</li>
    <li>You state time AND space complexity.</li>
    <li>You handle edge cases up front.</li>
    <li>You prefer in-place when possible.</li>
    <li>You use Set/Map for lookup, not <code>arr.includes</code> in loops.</li>
    <li>You skip duplicates when problem requires unique tuples.</li>
    <li>You convert string to char array for in-place ops.</li>
    <li>You sort first when it simplifies the problem.</li>
    <li>You know Kadane's for max subarray.</li>
    <li>You implement rotation as three reverses.</li>
  </ul>
</div>
`}

]
});
