window.PREP_SITE.registerTopic({
  id: 'dsa-sliding-window',
  module: 'DSA',
  title: 'Sliding Window',
  estimatedReadTime: '22 min',
  tags: ['dsa', 'sliding-window', 'array', 'string', 'pattern'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Sliding window is the pattern for "find the best contiguous subarray/substring with property X." Maintain a window <code>[l, r]</code> over the input; expand r, contract l when the property breaks.</p>
<ul>
  <li><strong>Fixed-size window</strong>: window of length k moves through the array. Maintain rolling state (sum, count). E.g., max sum of k consecutive elements.</li>
  <li><strong>Variable-size window</strong>: window grows / shrinks based on a constraint. E.g., longest substring with at most K distinct chars.</li>
  <li><strong>Constraint examples</strong>: at most k of X; exactly k of X; at most n distinct; sum &lt; target.</li>
  <li><strong>O(n) time</strong> typically — each pointer moves at most n steps total.</li>
  <li><strong>Window state</strong>: counter map, set, sum, etc. Update on expand/contract.</li>
  <li><strong>Track best answer</strong> at each step: max length, max sum, count of valid windows.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Expand r to grow; contract l until invariant holds; record the best at every step. Each element enters and leaves the window at most once → O(n).</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The pattern</h3>
<p>Two indices, l and r, define a window [l, r]. As you iterate r forward, you maintain the window's state. When the state violates a constraint, you advance l until it holds again. At each step, optionally record the window's metric (length, sum) as a candidate answer.</p>

<h3>Why O(n)</h3>
<p>Each element is added (when r passes over it) and removed (when l passes over it) at most once. So total work is O(n) even though there are nested while loops — the inner loop's total iterations across the entire run is bounded by n.</p>

<h3>Fixed vs variable</h3>
<table>
  <thead><tr><th></th><th>Fixed-size</th><th>Variable-size</th></tr></thead>
  <tbody>
    <tr><td>Window size</td><td>Always k</td><td>Varies</td></tr>
    <tr><td>Loop shape</td><td>Single for; slide once</td><td>Outer for r; inner while contracts l</td></tr>
    <tr><td>Examples</td><td>Max sum of k consecutive, k-window average</td><td>Longest substring without repeats, smallest subarray with sum ≥ target</td></tr>
  </tbody>
</table>

<h3>The "constraint shape" decision</h3>
<ul>
  <li><strong>"At most"</strong>: expand r; contract l when constraint exceeded; record current window length.</li>
  <li><strong>"Exactly k"</strong>: at-most(k) - at-most(k-1) trick. Exact constraints often reduce to two at-most subproblems.</li>
  <li><strong>"Smallest window with sum ≥ target"</strong>: expand r until sum ≥ target; then contract l while still ≥ target, recording smallest length; then continue r.</li>
  <li><strong>"Permutation / anagram"</strong>: fixed window of length |pattern|; track char counts.</li>
</ul>

<h3>Why "at most" is easier than "exactly"</h3>
<p>"At most k distinct" → standard expand/contract.<br>
"Exactly k distinct" → atMost(k) - atMost(k-1). Reformulate.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "expanding/contracting" picture</h3>
<div class="diagram">
<pre>
 [a, b, c, d, e, f, g]
  l───r                       expand r (include new char)
  l──────r                    state may violate → start contracting
     l───r                    contracted; valid again
     l──────r                 expand r again
        l───r
        ...
 Each pass: l never goes left; r never goes left.
 Both move at most n times → O(n) total.</pre>
</div>

<h3>The "fixed window" picture</h3>
<div class="diagram">
<pre>
 k = 3:
 [a, b, c, d, e, f, g]
  ───
     ───
        ───
           ───
              ───
                 ───

 5 windows total. Compute first sum, then slide:
   newSum = oldSum - leaving + entering
 O(n) total.</pre>
</div>

<h3>The "templates" picture</h3>
<pre><code class="language-js">// Variable-size, "at most" pattern
function atMostK(s, k) {
  let l = 0, count = new Map(), distinct = 0, best = 0;
  for (let r = 0; r &lt; s.length; r++) {
    if (!count.get(s[r])) distinct++;
    count.set(s[r], (count.get(s[r]) || 0) + 1);
    while (distinct &gt; k) {
      count.set(s[l], count.get(s[l]) - 1);
      if (count.get(s[l]) === 0) distinct--;
      l++;
    }
    best = Math.max(best, r - l + 1);
  }
  return best;
}

// Fixed-size pattern
function fixedK(arr, k) {
  let sum = 0;
  for (let i = 0; i &lt; k; i++) sum += arr[i];
  let best = sum;
  for (let i = k; i &lt; arr.length; i++) {
    sum += arr[i] - arr[i - k];
    best = Math.max(best, sum);
  }
  return best;
}</code></pre>

<h3>The "answer tracking" picture</h3>
<ul>
  <li><strong>Max length</strong>: <code>best = Math.max(best, r - l + 1)</code> at each iteration.</li>
  <li><strong>Min length</strong>: <code>best = Math.min(best, r - l + 1)</code> WHEN the constraint is satisfied (typically inside the contract loop).</li>
  <li><strong>Count of windows</strong>: increment by <code>r - l + 1</code> for "subarrays ending at r," then sum up.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Sliding window is O(n²) because of the nested while loop." It's not. The inner while can run many iterations in one outer step, but l never moves left — so total inner iterations across all outer steps is bounded by n. Amortized O(n).</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Variable window template</h3>
<pre><code class="language-js">function variableWindow(arr, k) {
  let l = 0;
  let state = /* initial */;
  let best = /* sentinel */;
  for (let r = 0; r &lt; arr.length; r++) {
    // 1. Include arr[r] in state
    addToState(state, arr[r]);

    // 2. Contract until constraint holds
    while (constraintViolated(state, k)) {
      removeFromState(state, arr[l]);
      l++;
    }

    // 3. Update best with current valid window
    best = Math.max(best, r - l + 1);
  }
  return best;
}</code></pre>

<h3>Fixed window template</h3>
<pre><code class="language-js">function fixedWindow(arr, k) {
  let state = /* compute initial state for first k */;
  let best = state;
  for (let i = k; i &lt; arr.length; i++) {
    // Slide window: include arr[i], exclude arr[i-k]
    state = updateState(state, arr[i], arr[i-k]);
    best = compare(best, state);
  }
  return best;
}</code></pre>

<h3>Maximum sum subarray of size k</h3>
<pre><code class="language-js">function maxSumK(arr, k) {
  let sum = 0;
  for (let i = 0; i &lt; k; i++) sum += arr[i];
  let best = sum;
  for (let i = k; i &lt; arr.length; i++) {
    sum += arr[i] - arr[i - k];
    best = Math.max(best, sum);
  }
  return best;
}
// O(n) time, O(1) space</code></pre>

<h3>Average of subarrays of size k</h3>
<pre><code class="language-js">function findAverages(arr, k) {
  const result = [];
  let sum = 0;
  for (let i = 0; i &lt; k; i++) sum += arr[i];
  result.push(sum / k);
  for (let i = k; i &lt; arr.length; i++) {
    sum += arr[i] - arr[i - k];
    result.push(sum / k);
  }
  return result;
}</code></pre>

<h3>Longest substring without repeating</h3>
<pre><code class="language-js">function lengthOfLongestSubstring(s) {
  const seen = new Map();
  let l = 0, best = 0;
  for (let r = 0; r &lt; s.length; r++) {
    if (seen.has(s[r]) &amp;&amp; seen.get(s[r]) &gt;= l) {
      l = seen.get(s[r]) + 1;
    }
    seen.set(s[r], r);
    best = Math.max(best, r - l + 1);
  }
  return best;
}
// O(n) time, O(min(n, charset)) space.
// Trick: jump l directly past previous occurrence; saves a contract loop.</code></pre>

<h3>Longest substring with at most k distinct</h3>
<pre><code class="language-js">function lengthOfLongestSubstringKDistinct(s, k) {
  const count = new Map();
  let l = 0, best = 0;
  for (let r = 0; r &lt; s.length; r++) {
    count.set(s[r], (count.get(s[r]) || 0) + 1);
    while (count.size &gt; k) {
      count.set(s[l], count.get(s[l]) - 1);
      if (count.get(s[l]) === 0) count.delete(s[l]);
      l++;
    }
    best = Math.max(best, r - l + 1);
  }
  return best;
}
// O(n) time, O(k) space.</code></pre>

<h3>Smallest subarray with sum ≥ target</h3>
<pre><code class="language-js">function minSubArrayLen(target, nums) {
  let l = 0, sum = 0, best = Infinity;
  for (let r = 0; r &lt; nums.length; r++) {
    sum += nums[r];
    while (sum &gt;= target) {
      best = Math.min(best, r - l + 1);
      sum -= nums[l];
      l++;
    }
  }
  return best === Infinity ? 0 : best;
}
// O(n) time, O(1) space.</code></pre>

<h3>Permutation in string (anagram present?)</h3>
<pre><code class="language-js">function checkInclusion(s1, s2) {
  if (s1.length &gt; s2.length) return false;
  const need = new Array(26).fill(0);
  const have = new Array(26).fill(0);
  for (const c of s1) need[c.charCodeAt(0) - 97]++;
  for (let r = 0; r &lt; s2.length; r++) {
    have[s2.charCodeAt(r) - 97]++;
    if (r &gt;= s1.length) have[s2.charCodeAt(r - s1.length) - 97]--;
    if (need.every((n, i) =&gt; n === have[i])) return true;
  }
  return false;
}
// Fixed window of size |s1|; track char counts. O(n × 26) ≈ O(n).</code></pre>

<h3>Find all anagrams</h3>
<pre><code class="language-js">function findAnagrams(s, p) {
  if (s.length &lt; p.length) return [];
  const need = new Array(26).fill(0);
  const have = new Array(26).fill(0);
  for (const c of p) need[c.charCodeAt(0) - 97]++;
  const result = [];
  for (let r = 0; r &lt; s.length; r++) {
    have[s.charCodeAt(r) - 97]++;
    if (r &gt;= p.length) have[s.charCodeAt(r - p.length) - 97]--;
    if (r &gt;= p.length - 1 &amp;&amp; need.every((n, i) =&gt; n === have[i])) {
      result.push(r - p.length + 1);
    }
  }
  return result;
}
// O(n) time (with constant 26 factor), O(1) space.</code></pre>

<h3>Minimum window substring</h3>
<pre><code class="language-js">function minWindow(s, t) {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  let l = 0, required = need.size, formed = 0;
  const have = new Map();
  let best = [Infinity, 0, 0];   // [length, l, r]

  for (let r = 0; r &lt; s.length; r++) {
    const c = s[r];
    have.set(c, (have.get(c) || 0) + 1);
    if (need.has(c) &amp;&amp; have.get(c) === need.get(c)) formed++;
    while (formed === required) {
      if (r - l + 1 &lt; best[0]) best = [r - l + 1, l, r];
      const cl = s[l];
      have.set(cl, have.get(cl) - 1);
      if (need.has(cl) &amp;&amp; have.get(cl) &lt; need.get(cl)) formed--;
      l++;
    }
  }
  return best[0] === Infinity ? '' : s.slice(best[1], best[2] + 1);
}
// Variable window; contract while still valid; record smallest. O(n) time.</code></pre>

<h3>"Exactly K" trick</h3>
<pre><code class="language-js">// Subarrays with exactly K distinct = atMost(K) - atMost(K-1)
function subarraysWithKDistinct(nums, k) {
  return atMostK(nums, k) - atMostK(nums, k - 1);
}
function atMostK(nums, k) {
  const count = new Map();
  let l = 0, distinct = 0, total = 0;
  for (let r = 0; r &lt; nums.length; r++) {
    if (!count.get(nums[r])) distinct++;
    count.set(nums[r], (count.get(nums[r]) || 0) + 1);
    while (distinct &gt; k) {
      count.set(nums[l], count.get(nums[l]) - 1);
      if (count.get(nums[l]) === 0) distinct--;
      l++;
    }
    total += r - l + 1;   // subarrays ending at r
  }
  return total;
}</code></pre>

<h3>Sliding window maximum (monotonic deque)</h3>
<pre><code class="language-js">function maxSlidingWindow(nums, k) {
  const result = [];
  const dq = [];   // store indices; values at front are decreasing
  for (let i = 0; i &lt; nums.length; i++) {
    while (dq.length &amp;&amp; dq[0] &lt;= i - k) dq.shift();
    while (dq.length &amp;&amp; nums[dq[dq.length - 1]] &lt; nums[i]) dq.pop();
    dq.push(i);
    if (i &gt;= k - 1) result.push(nums[dq[0]]);
  }
  return result;
}
// Monotonic deque: front always has the max in current window. O(n) amortized.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — max sum of k consecutive</h3>
<pre><code class="language-js">function maxSumK(arr, k) {
  let sum = 0;
  for (let i = 0; i &lt; k; i++) sum += arr[i];
  let max = sum;
  for (let i = k; i &lt; arr.length; i++) {
    sum += arr[i] - arr[i - k];
    max = Math.max(max, sum);
  }
  return max;
}</code></pre>

<h3>Example 2 — longest substring without repeat</h3>
<pre><code class="language-js">function lengthOfLongestSubstring(s) {
  const seen = new Map();
  let l = 0, max = 0;
  for (let r = 0; r &lt; s.length; r++) {
    if (seen.has(s[r]) &amp;&amp; seen.get(s[r]) &gt;= l)
      l = seen.get(s[r]) + 1;
    seen.set(s[r], r);
    max = Math.max(max, r - l + 1);
  }
  return max;
}</code></pre>

<h3>Example 3 — longest substring with at most 2 distinct</h3>
<pre><code class="language-js">function longestSubstringTwoDistinct(s) {
  return lengthOfLongestSubstringKDistinct(s, 2);
}
// Reuse k-distinct template.</code></pre>

<h3>Example 4 — smallest subarray with sum ≥ target</h3>
<pre><code class="language-js">function minSubArrayLen(target, nums) {
  let l = 0, sum = 0, best = Infinity;
  for (let r = 0; r &lt; nums.length; r++) {
    sum += nums[r];
    while (sum &gt;= target) {
      best = Math.min(best, r - l + 1);
      sum -= nums[l]; l++;
    }
  }
  return best === Infinity ? 0 : best;
}</code></pre>

<h3>Example 5 — fruits into baskets</h3>
<pre><code class="language-js">// Two baskets, each holds one fruit type.
// Find longest subarray with at most 2 distinct types.
function totalFruit(fruits) {
  return lengthOfLongestSubstringKDistinct(fruits, 2);
}</code></pre>

<h3>Example 6 — character replacement</h3>
<pre><code class="language-js">// Longest substring after at most k replacements with the same char.
function characterReplacement(s, k) {
  const count = new Array(26).fill(0);
  let l = 0, max = 0, maxCount = 0;
  for (let r = 0; r &lt; s.length; r++) {
    count[s.charCodeAt(r) - 65]++;
    maxCount = Math.max(maxCount, count[s.charCodeAt(r) - 65]);
    while ((r - l + 1) - maxCount &gt; k) {
      count[s.charCodeAt(l) - 65]--;
      l++;
    }
    max = Math.max(max, r - l + 1);
  }
  return max;
}</code></pre>

<h3>Example 7 — permutation in string</h3>
<pre><code class="language-js">function checkInclusion(s1, s2) {
  if (s1.length &gt; s2.length) return false;
  const need = new Array(26).fill(0);
  const have = new Array(26).fill(0);
  for (const c of s1) need[c.charCodeAt(0) - 97]++;
  for (let r = 0; r &lt; s2.length; r++) {
    have[s2.charCodeAt(r) - 97]++;
    if (r &gt;= s1.length) have[s2.charCodeAt(r - s1.length) - 97]--;
    if (need.every((n, i) =&gt; n === have[i])) return true;
  }
  return false;
}</code></pre>

<h3>Example 8 — find all anagrams</h3>
<pre><code class="language-js">function findAnagrams(s, p) {
  if (s.length &lt; p.length) return [];
  const need = new Array(26).fill(0);
  const have = new Array(26).fill(0);
  for (const c of p) need[c.charCodeAt(0) - 97]++;
  const result = [];
  for (let r = 0; r &lt; s.length; r++) {
    have[s.charCodeAt(r) - 97]++;
    if (r &gt;= p.length) have[s.charCodeAt(r - p.length) - 97]--;
    if (r &gt;= p.length - 1 &amp;&amp; need.every((n, i) =&gt; n === have[i]))
      result.push(r - p.length + 1);
  }
  return result;
}</code></pre>

<h3>Example 9 — minimum window substring</h3>
<pre><code class="language-js">function minWindow(s, t) {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  let l = 0, formed = 0, required = need.size;
  const have = new Map();
  let best = [Infinity, 0, 0];

  for (let r = 0; r &lt; s.length; r++) {
    const c = s[r];
    have.set(c, (have.get(c) || 0) + 1);
    if (need.has(c) &amp;&amp; have.get(c) === need.get(c)) formed++;
    while (formed === required) {
      if (r - l + 1 &lt; best[0]) best = [r - l + 1, l, r];
      const cl = s[l];
      have.set(cl, have.get(cl) - 1);
      if (need.has(cl) &amp;&amp; have.get(cl) &lt; need.get(cl)) formed--;
      l++;
    }
  }
  return best[0] === Infinity ? '' : s.slice(best[1], best[2] + 1);
}</code></pre>

<h3>Example 10 — sliding window maximum</h3>
<pre><code class="language-js">function maxSlidingWindow(nums, k) {
  const result = [], dq = [];
  for (let i = 0; i &lt; nums.length; i++) {
    while (dq.length &amp;&amp; dq[0] &lt;= i - k) dq.shift();
    while (dq.length &amp;&amp; nums[dq[dq.length-1]] &lt; nums[i]) dq.pop();
    dq.push(i);
    if (i &gt;= k - 1) result.push(nums[dq[0]]);
  }
  return result;
}</code></pre>

<h3>Example 11 — subarray product less than k</h3>
<pre><code class="language-js">function numSubarrayProductLessThanK(nums, k) {
  if (k &lt;= 1) return 0;
  let l = 0, product = 1, count = 0;
  for (let r = 0; r &lt; nums.length; r++) {
    product *= nums[r];
    while (product &gt;= k) { product /= nums[l]; l++; }
    count += r - l + 1;
  }
  return count;
}</code></pre>

<h3>Example 12 — subarrays with k distinct (exactly)</h3>
<pre><code class="language-js">function subarraysWithKDistinct(nums, k) {
  return atMostK(nums, k) - atMostK(nums, k - 1);
}
function atMostK(nums, k) {
  const count = new Map();
  let l = 0, distinct = 0, total = 0;
  for (let r = 0; r &lt; nums.length; r++) {
    if (!count.get(nums[r])) distinct++;
    count.set(nums[r], (count.get(nums[r]) || 0) + 1);
    while (distinct &gt; k) {
      count.set(nums[l], count.get(nums[l]) - 1);
      if (count.get(nums[l]) === 0) distinct--;
      l++;
    }
    total += r - l + 1;
  }
  return total;
}</code></pre>

<h3>Example 13 — longest repeating character replacement</h3>
<pre><code class="language-js">// Same as character replacement above; common variant.
// Length of longest window where (windowSize - maxCharFrequency) &lt;= k.
function characterReplacement(s, k) {
  const count = new Array(26).fill(0);
  let l = 0, max = 0, maxCount = 0;
  for (let r = 0; r &lt; s.length; r++) {
    count[s.charCodeAt(r) - 65]++;
    maxCount = Math.max(maxCount, count[s.charCodeAt(r) - 65]);
    while ((r - l + 1) - maxCount &gt; k) { count[s.charCodeAt(l) - 65]--; l++; }
    max = Math.max(max, r - l + 1);
  }
  return max;
}</code></pre>

<h3>Example 14 — max consecutive 1s with k flips</h3>
<pre><code class="language-js">// Flip at most k zeros; find longest consecutive 1s.
function longestOnes(nums, k) {
  let l = 0, zeros = 0, max = 0;
  for (let r = 0; r &lt; nums.length; r++) {
    if (nums[r] === 0) zeros++;
    while (zeros &gt; k) { if (nums[l] === 0) zeros--; l++; }
    max = Math.max(max, r - l + 1);
  }
  return max;
}</code></pre>

<h3>Example 15 — first negative in every window of size k</h3>
<pre><code class="language-js">function firstNegative(arr, k) {
  const result = [], dq = [];   // indices of negatives
  for (let i = 0; i &lt; arr.length; i++) {
    while (dq.length &amp;&amp; dq[0] &lt;= i - k) dq.shift();
    if (arr[i] &lt; 0) dq.push(i);
    if (i &gt;= k - 1) result.push(dq.length ? arr[dq[0]] : 0);
  }
  return result;
}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Empty input</h3>
<p>Length 0: while doesn't enter; return 0 / empty / sentinel. Or check up front.</p>

<h3>2. k larger than array length</h3>
<p>For fixed-window: no valid window. Either return 0 / sentinel or compute on full array depending on problem.</p>

<h3>3. k = 0</h3>
<p>"At most 0 distinct" → empty window only. Many algorithms break; handle as special case.</p>

<h3>4. All identical elements</h3>
<p>Window with 1 distinct — maximum is full length for "at most k" with k ≥ 1.</p>

<h3>5. Negative numbers in product window</h3>
<p>Product can flip sign. Windowed product comparisons get tricky. Often need to split positive / negative subarrays.</p>

<h3>6. Window invariant on first iteration</h3>
<p>State starts empty. At r = 0, first element added. Make sure constraint check works for window of size 1.</p>

<h3>7. Min length when no valid window</h3>
<p>Use Infinity as initial; check at end and return 0 / -1 if never updated.</p>

<h3>8. Counting subarrays vs lengths</h3>
<p>Two different problem styles. Counting: <code>total += r - l + 1</code> at each step (subarrays ending at r). Length: <code>best = max(best, r - l + 1)</code>.</p>

<h3>9. Map vs fixed-size array for counts</h3>
<p>For known charset (a-z, 26 letters): fixed array faster. For arbitrary keys: Map.</p>

<h3>10. Forgetting to delete from Map at zero</h3>
<p>When count drops to 0, distinct count tracking expects you to remove or set to 0. <code>count.get(c) === 0 ? count.delete(c) : ...</code>.</p>

<h3>11. Off-by-one in fixed window slide</h3>
<p>When r = k, you remove arr[r-k] = arr[0]. Verify the index alignment with your particular problem.</p>

<h3>12. Sliding window deque with non-numeric comparisons</h3>
<p>Make sure your &lt; and &gt; comparisons are correct for the data type. Strings sort lexically; numbers numerically.</p>

<h3>13. "Exactly K" — using "at most" subtraction</h3>
<p>atMost(K) - atMost(K-1) = exactly K. The trick works for counting subarrays. Doesn't directly extend to "longest" or "shortest" with exactly K.</p>

<h3>14. Counting subarrays product less than k with k ≤ 1</h3>
<p>If product must be &lt; 1 and all elements ≥ 1, no subarray qualifies. Handle the edge case explicitly.</p>

<h3>15. Sliding window with multiple constraints</h3>
<p>Some problems have two constraints (e.g., at most k distinct AND length ≤ n). Combine them; expand only when both hold; contract when either violates.</p>

<h3>16. Sliding window — when to record vs not</h3>
<p>Record best inside contract loop (for min-length) or after contract (for max-length). The position matters.</p>

<h3>17. r - l + 1 vs r - l</h3>
<p>Window length is <code>r - l + 1</code> (inclusive both ends). Forgetting the +1 is a common off-by-one.</p>

<h3>18. Streaming variant</h3>
<p>If input is a stream (not array), can't access arr[l] directly when contracting. Buffer the window or use deque.</p>

<h3>19. Sliding window max — front of deque</h3>
<p>The front of the monotonic deque is the maximum in current window. If front index has slid out of window, pop it from the front.</p>

<h3>20. Counting subarrays with sum &lt; X (negative numbers)</h3>
<p>Sliding window doesn't directly work with negatives because shrinking l doesn't necessarily maintain monotonicity. Need prefix sum + sorting or different algorithm.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — using sliding window with negative numbers</h3>
<p>For sum-based problems with negatives, contracting l doesn't necessarily reduce sum monotonically. Use prefix sum + binary search, or Kadane's variant.</p>

<h3>Anti-pattern 2 — recording in the wrong place</h3>
<p>"Min length with sum ≥ target" → record inside the contract loop (when the constraint holds, before shrinking further). "Max length with at most k" → record after contract.</p>

<h3>Anti-pattern 3 — Map size for "distinct count"</h3>
<p>If you don't remove keys at count 0, <code>map.size</code> exceeds true distinct count. Either: track distinct manually, or always delete keys at 0.</p>

<h3>Anti-pattern 4 — re-computing window state from scratch</h3>
<p>Recomputing sum / count over the window each iteration → O(n²). Always update incrementally (add new, remove old).</p>

<h3>Anti-pattern 5 — confusing fixed and variable</h3>
<p>"Find longest substring with k distinct" is variable. "Find max sum of k consecutive" is fixed. Different templates.</p>

<h3>Anti-pattern 6 — forgetting to advance l after recording min-length</h3>
<p>In min-length problems, you record then advance l. If you record but don't advance, infinite loop.</p>

<h3>Anti-pattern 7 — sliding window for sorted input two-sum</h3>
<p>Use two pointers from ends instead. Sliding window is for contiguous subarrays/substrings.</p>

<h3>Anti-pattern 8 — incorrect formed/required tracking</h3>
<p>In min-window-substring, increment <code>formed</code> when a char's count reaches need's count exactly; decrement when it falls below. Off-by-one here is a common bug.</p>

<h3>Anti-pattern 9 — fixed-size window with k = 0</h3>
<p>Empty window. Most operations break. Handle up front.</p>

<h3>Anti-pattern 10 — sliding window for non-contiguous problems</h3>
<p>Sliding window is contiguous-only. For "best subset of k elements," you need different patterns (DP, heap, etc.).</p>

<h3>Anti-pattern 11 — maxCount in character-replacement not decreasing</h3>
<p>maxCount tracks the max char frequency seen IN THE CURRENT WINDOW. Some implementations don't decrease when l advances — and it works because we're looking for max length, but conceptually it's a "stale" value.</p>

<h3>Anti-pattern 12 — window not advancing</h3>
<p>If neither expand nor contract makes progress, infinite loop. Make sure each iteration of outer loop advances r exactly once.</p>

<h3>Anti-pattern 13 — Map.get(undefined) returns undefined</h3>
<p>Treat as 0: <code>(count.get(c) || 0) + 1</code>. Or use object with <code>?? 0</code>.</p>

<h3>Anti-pattern 14 — computing best in wrong scope</h3>
<p>In contract-then-record, you might miss the case where the initial state (before any contraction) is the best. Think through which states qualify.</p>

<h3>Anti-pattern 15 — shifting from front of array as deque</h3>
<p><code>arr.shift()</code> is O(n). Use a real deque or index-based head pointer for O(1) amortized.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. When to use sliding window?</div>
  <div class="qa-answer">
    <p>Problems asking for the best contiguous subarray / substring with some property:</p>
    <ul>
      <li>Max sum of k consecutive elements (fixed).</li>
      <li>Longest substring without repeats (variable).</li>
      <li>Smallest subarray with sum ≥ target.</li>
      <li>Longest with at most K distinct.</li>
      <li>Min window containing all chars of pattern.</li>
    </ul>
    <p>Hint: brute force is O(n²); window pattern reduces to O(n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why is sliding window O(n)?</div>
  <div class="qa-answer">
    <p>Each element enters the window once (when r passes it) and leaves once (when l passes it). Total moves of l + r ≤ 2n. Even with the inner contract while loop, the total work is bounded by 2n. Amortized O(n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Implement longest substring without repeating chars.</div>
  <div class="qa-answer">
<pre><code class="language-js">function lengthOfLongestSubstring(s) {
  const seen = new Map();
  let l = 0, max = 0;
  for (let r = 0; r &lt; s.length; r++) {
    if (seen.has(s[r]) &amp;&amp; seen.get(s[r]) &gt;= l) l = seen.get(s[r]) + 1;
    seen.set(s[r], r);
    max = Math.max(max, r - l + 1);
  }
  return max;
}</code></pre>
    <p>O(n) time, O(min(n, charset)) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Smallest subarray with sum ≥ target.</div>
  <div class="qa-answer">
<pre><code class="language-js">function minSubArrayLen(target, nums) {
  let l = 0, sum = 0, best = Infinity;
  for (let r = 0; r &lt; nums.length; r++) {
    sum += nums[r];
    while (sum &gt;= target) {
      best = Math.min(best, r - l + 1);
      sum -= nums[l]; l++;
    }
  }
  return best === Infinity ? 0 : best;
}</code></pre>
    <p>Variable window; record inside contract. Note: works for non-negative inputs only.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Permutation in string (anagram present?).</div>
  <div class="qa-answer">
    <p>Fixed window of size |s1|; track 26-letter counts. Slide; check counts match at every position.</p>
<pre><code class="language-js">function checkInclusion(s1, s2) {
  if (s1.length &gt; s2.length) return false;
  const need = new Array(26).fill(0), have = new Array(26).fill(0);
  for (const c of s1) need[c.charCodeAt(0) - 97]++;
  for (let r = 0; r &lt; s2.length; r++) {
    have[s2.charCodeAt(r) - 97]++;
    if (r &gt;= s1.length) have[s2.charCodeAt(r - s1.length) - 97]--;
    if (need.every((n, i) =&gt; n === have[i])) return true;
  }
  return false;
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Min window substring.</div>
  <div class="qa-answer">
<pre><code class="language-js">function minWindow(s, t) {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  let l = 0, formed = 0, required = need.size;
  const have = new Map();
  let best = [Infinity, 0, 0];
  for (let r = 0; r &lt; s.length; r++) {
    const c = s[r];
    have.set(c, (have.get(c) || 0) + 1);
    if (need.has(c) &amp;&amp; have.get(c) === need.get(c)) formed++;
    while (formed === required) {
      if (r - l + 1 &lt; best[0]) best = [r - l + 1, l, r];
      const cl = s[l];
      have.set(cl, have.get(cl) - 1);
      if (need.has(cl) &amp;&amp; have.get(cl) &lt; need.get(cl)) formed--;
      l++;
    }
  }
  return best[0] === Infinity ? '' : s.slice(best[1], best[2] + 1);
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Sliding window maximum (monotonic deque).</div>
  <div class="qa-answer">
<pre><code class="language-js">function maxSlidingWindow(nums, k) {
  const result = [], dq = [];
  for (let i = 0; i &lt; nums.length; i++) {
    while (dq.length &amp;&amp; dq[0] &lt;= i - k) dq.shift();
    while (dq.length &amp;&amp; nums[dq[dq.length-1]] &lt; nums[i]) dq.pop();
    dq.push(i);
    if (i &gt;= k - 1) result.push(nums[dq[0]]);
  }
  return result;
}</code></pre>
    <p>O(n) amortized. Each index pushed and popped at most once.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Longest repeating character replacement.</div>
  <div class="qa-answer">
    <p>Window size - maxCharFrequency = chars to replace. If &gt; k, contract.</p>
<pre><code class="language-js">function characterReplacement(s, k) {
  const count = new Array(26).fill(0);
  let l = 0, max = 0, maxCount = 0;
  for (let r = 0; r &lt; s.length; r++) {
    count[s.charCodeAt(r) - 65]++;
    maxCount = Math.max(maxCount, count[s.charCodeAt(r) - 65]);
    while ((r - l + 1) - maxCount &gt; k) { count[s.charCodeAt(l) - 65]--; l++; }
    max = Math.max(max, r - l + 1);
  }
  return max;
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Longest substring with at most K distinct.</div>
  <div class="qa-answer">
<pre><code class="language-js">function lengthOfLongestSubstringKDistinct(s, k) {
  const count = new Map();
  let l = 0, max = 0;
  for (let r = 0; r &lt; s.length; r++) {
    count.set(s[r], (count.get(s[r]) || 0) + 1);
    while (count.size &gt; k) {
      count.set(s[l], count.get(s[l]) - 1);
      if (count.get(s[l]) === 0) count.delete(s[l]);
      l++;
    }
    max = Math.max(max, r - l + 1);
  }
  return max;
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Subarrays with exactly K distinct (the trick).</div>
  <div class="qa-answer">
    <p>atMost(K) - atMost(K-1) = exactly K. Subtract one less stringent constraint from another.</p>
<pre><code class="language-js">function subarraysWithKDistinct(nums, k) {
  return atMostK(nums, k) - atMostK(nums, k - 1);
}</code></pre>
    <p>Each call is O(n); total O(n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Subarrays with sum exactly K (with negatives)?</div>
  <div class="qa-answer">
    <p>Sliding window doesn't work with negatives. Use prefix sum + hash map: <code>count[prefixSum - k]</code> gives count of subarrays ending at current that sum to k.</p>
<pre><code class="language-js">function subarraySum(nums, k) {
  const count = new Map([[0, 1]]);
  let prefix = 0, total = 0;
  for (const x of nums) {
    prefix += x;
    if (count.has(prefix - k)) total += count.get(prefix - k);
    count.set(prefix, (count.get(prefix) || 0) + 1);
  }
  return total;
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. When does sliding window NOT work?</div>
  <div class="qa-answer">
    <ul>
      <li>Negative numbers in sum problems (no monotonicity on contract).</li>
      <li>Non-contiguous subset problems.</li>
      <li>Need to look at multiple windows simultaneously.</li>
    </ul>
    <p>Alternatives: prefix sum + hash map, DP, two pointers from ends.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Fixed vs variable — how to choose?</div>
  <div class="qa-answer">
    <p>If problem says "subarray of size k" → fixed. If "longest / shortest / with at most" → variable. Sometimes a problem has both flavors; pick the right template.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How to count subarrays in sliding window?</div>
  <div class="qa-answer">
    <p>For each valid window [l, r], the number of valid subarrays ending at r is <code>r - l + 1</code>. Sum across all r:</p>
<pre><code class="language-js">total += r - l + 1;</code></pre>
    <p>Used in atMostK, subarrays product less than k, etc.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Walk through min window substring complexity.</div>
  <div class="qa-answer">
    <p>n = |s|, m = |t|. <strong>Time: O(n + m)</strong>. m for building need; r iterates n; each char enters and leaves at most once. <strong>Space: O(charset)</strong> for need + have maps.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish fixed vs variable window.</li>
    <li>You explain O(n) by amortizing pointer movements.</li>
    <li>You handle the contract loop placement (record before vs after).</li>
    <li>You use Map / Array for window state efficiently.</li>
    <li>You know the atMost(K) - atMost(K-1) trick for "exactly K."</li>
    <li>You use monotonic deque for sliding window max/min.</li>
    <li>You recognize when sliding window fails (negatives, non-contiguous) and switch patterns.</li>
  </ul>
</div>
`}

]
});
