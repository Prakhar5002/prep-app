window.PREP_SITE.registerTopic({
  id: 'dsa-hashing',
  module: 'DSA',
  title: 'Hashing',
  estimatedReadTime: '24 min',
  tags: ['dsa', 'hash', 'map', 'set', 'frequency', 'lookup', 'prefix-sum'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Hash maps + hash sets give O(1) average lookup. Trade space for time. Foundation of countless algorithms.</p>
<ul>
  <li><strong>Set</strong>: presence check ("have I seen this?"). <code>Set.has(x)</code> O(1).</li>
  <li><strong>Map</strong>: key → value lookup. <code>Map.get(key)</code> O(1) avg.</li>
  <li><strong>Frequency count</strong>: value → count. Many problems reduce to counting.</li>
  <li><strong>Index map</strong>: value → first/last index seen.</li>
  <li><strong>Group by</strong>: key → list of items.</li>
  <li><strong>Prefix sum + hash</strong>: range sum / count problems with O(n) time.</li>
  <li><strong>Two-sum pattern</strong>: complement lookup with hash map — O(n) time, O(n) space.</li>
  <li><strong>Anagram / canonical form</strong>: sorted string or char-count tuple as map key.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>If your brute force has nested loops doing lookups, hash map probably reduces to O(n). The space is usually worth the time saving.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What hash structures give you</h3>
<ul>
  <li><strong>Constant-time membership / lookup</strong>: <code>set.has(x)</code>, <code>map.get(k)</code>.</li>
  <li><strong>Constant-time insert / delete</strong>: <code>map.set(k, v)</code>, <code>map.delete(k)</code>.</li>
  <li><strong>Iteration in insertion order</strong> (Map / Set in JS).</li>
</ul>

<h3>Set vs Map</h3>
<table>
  <thead><tr><th></th><th>Set</th><th>Map</th></tr></thead>
  <tbody>
    <tr><td>Use</td><td>Membership only</td><td>Key → value</td></tr>
    <tr><td>Examples</td><td>Visited nodes, seen elements</td><td>Counts, indices, group-by</td></tr>
  </tbody>
</table>

<h3>Map vs object</h3>
<ul>
  <li><strong>Map</strong>: any key (including objects, numbers without coercion). Iteration in insertion order. <code>map.size</code>. Slightly faster for heavy use.</li>
  <li><strong>Object</strong>: string keys (numbers coerce). Built-in. Convenient for JSON-shape data.</li>
</ul>
<p>For algorithm work: <strong>Map</strong> is usually better.</p>

<h3>Why hash isn't always O(1)</h3>
<ul>
  <li>Worst case: all keys collide → O(n) per operation.</li>
  <li>Average case (uniform hash): O(1).</li>
  <li>Adversarial input: attacker crafts collisions (security concern). Mitigation: randomized hashing.</li>
  <li>Hash computation is O(k) where k = key size; for huge strings, "constant" includes a big k factor.</li>
</ul>

<h3>Common hash patterns</h3>
<table>
  <thead><tr><th>Pattern</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Presence / dedup</td><td>Has duplicate, intersect arrays, contains nearby duplicate</td></tr>
    <tr><td>Frequency count</td><td>Anagram, top-K frequent, majority element</td></tr>
    <tr><td>Index map</td><td>First-seen index, two-sum, longest substring without repeats</td></tr>
    <tr><td>Complement lookup</td><td>Two-sum, four-sum II</td></tr>
    <tr><td>Group by canonical form</td><td>Group anagrams</td></tr>
    <tr><td>Prefix sum + count</td><td>Subarray sum equals K, continuous subarray with K-multiple</td></tr>
    <tr><td>Hashing tuples / coords</td><td>Visited cells in BFS/DFS, point sets</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "lookup speedup" picture</h3>
<div class="diagram">
<pre>
 Brute force O(n²):
   for each i:
     for each j:
       if relationship(arr[i], arr[j]) → record

 With hash O(n):
   for each i:
     check if hash already has the complement / partner
     record if found
     add arr[i] to hash

 Trades O(n) space for n× speedup.</pre>
</div>

<h3>The "complement" picture (two-sum)</h3>
<div class="diagram">
<pre>
 Target: 9, scanning [2, 7, 11, 15]:

 i=0  arr[0]=2,  need 9-2=7    seen={}              not seen → seen.set(2, 0)
 i=1  arr[1]=7,  need 9-7=2    seen={2:0}            found! return [0, 1]</pre>
</div>

<h3>The "frequency" picture</h3>
<div class="diagram">
<pre>
 Anagram check: "listen" vs "silent"
 char counts:
   listen:  {l:1, i:1, s:1, t:1, e:1, n:1}
   silent:  {s:1, i:1, l:1, e:1, n:1, t:1}
 Equal → anagram.</pre>
</div>

<h3>The "prefix sum + hash" picture</h3>
<div class="diagram">
<pre>
 Subarrays with sum K:
   prefix sum[i] = sum of nums[0..i-1]
   subarray sum from j+1 to i = prefix[i+1] - prefix[j+1]

 If we want sum = K:
   prefix[i+1] - prefix[j+1] = K
   prefix[j+1] = prefix[i+1] - K

 Iterate; track count of each prefix sum seen.
 At each i, count of subarrays ending at i with sum K
   = count of (prefix[i+1] - K) seen so far.
 O(n) time, O(n) space.</pre>
</div>

<h3>The "canonical form" picture (group anagrams)</h3>
<div class="diagram">
<pre>
 strs = ["eat", "tea", "tan", "ate", "nat", "bat"]
 canonical = sort chars:
   "eat" → "aet"
   "tea" → "aet"
   "ate" → "aet"
   "tan" → "ant"
   "nat" → "ant"
   "bat" → "abt"

 group by canonical → [["eat","tea","ate"], ["tan","nat"], ["bat"]]</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Hash map is always faster than array for lookup." For small fixed sets (e.g., 26 lowercase letters), <code>new Array(26)</code> indexed by char code is faster than a Map (no hash computation). Use the right tool for the data shape.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>JS Map basics</h3>
<pre><code class="language-js">const map = new Map();
map.set('a', 1);
map.set('b', 2);
map.has('a');           // true
map.get('a');           // 1
map.delete('a');
map.size;
for (const [k, v] of map) { ... }
[...map.keys()];        // array of keys
[...map.values()];
[...map.entries()];     // array of [k, v]
map.clear();</code></pre>

<h3>JS Set basics</h3>
<pre><code class="language-js">const set = new Set();
set.add(1);
set.has(1);             // true
set.delete(1);
set.size;
for (const x of set) { ... }
[...set];               // array

// Init from iterable:
const set2 = new Set([1, 2, 3, 1]);   // {1, 2, 3}</code></pre>

<h3>Frequency map idiom</h3>
<pre><code class="language-js">function frequency(arr) {
  const count = new Map();
  for (const x of arr) count.set(x, (count.get(x) || 0) + 1);
  return count;
}

// Or with object:
function frequencyObj(arr) {
  const count = {};
  for (const x of arr) count[x] = (count[x] || 0) + 1;
  return count;
}</code></pre>

<h3>Two sum (the canonical hash problem)</h3>
<pre><code class="language-js">function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i &lt; nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
// O(n) time, O(n) space.</code></pre>

<h3>Contains duplicate</h3>
<pre><code class="language-js">function containsDuplicate(nums) {
  return new Set(nums).size !== nums.length;
}
// O(n) time, O(n) space — clean one-liner.</code></pre>

<h3>Contains nearby duplicate (within k)</h3>
<pre><code class="language-js">function containsNearbyDuplicate(nums, k) {
  const seen = new Map();
  for (let i = 0; i &lt; nums.length; i++) {
    if (seen.has(nums[i]) &amp;&amp; i - seen.get(nums[i]) &lt;= k) return true;
    seen.set(nums[i], i);
  }
  return false;
}</code></pre>

<h3>Group anagrams</h3>
<pre><code class="language-js">function groupAnagrams(strs) {
  const groups = new Map();
  for (const s of strs) {
    const key = s.split('').sort().join('');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}
// O(n × k log k) where k = avg string length.

// Faster canonical: char count signature
function groupAnagramsCount(strs) {
  const groups = new Map();
  for (const s of strs) {
    const count = new Array(26).fill(0);
    for (const c of s) count[c.charCodeAt(0) - 97]++;
    const key = count.join(',');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}
// O(n × k). Faster for long strings.</code></pre>

<h3>Top K frequent (with bucket sort or heap)</h3>
<pre><code class="language-js">function topKFrequent(nums, k) {
  const count = new Map();
  for (const n of nums) count.set(n, (count.get(n) || 0) + 1);

  // Bucket sort by frequency (max freq is nums.length)
  const buckets = Array.from({ length: nums.length + 1 }, () =&gt; []);
  for (const [num, freq] of count) buckets[freq].push(num);

  const result = [];
  for (let f = buckets.length - 1; f &gt;= 0 &amp;&amp; result.length &lt; k; f--)
    for (const num of buckets[f]) {
      result.push(num);
      if (result.length === k) break;
    }
  return result;
}
// O(n) time, O(n) space.</code></pre>

<h3>Subarray sum equals K (prefix + hash)</h3>
<pre><code class="language-js">function subarraySum(nums, k) {
  const count = new Map([[0, 1]]);   // empty prefix
  let prefix = 0, total = 0;
  for (const x of nums) {
    prefix += x;
    if (count.has(prefix - k)) total += count.get(prefix - k);
    count.set(prefix, (count.get(prefix) || 0) + 1);
  }
  return total;
}
// O(n) time, O(n) space. Works with negative numbers.</code></pre>

<h3>Continuous subarray with sum multiple of K</h3>
<pre><code class="language-js">function checkSubarraySum(nums, k) {
  const seen = new Map([[0, -1]]);   // prefix-mod → first index
  let prefix = 0;
  for (let i = 0; i &lt; nums.length; i++) {
    prefix = (prefix + nums[i]) % k;
    if (seen.has(prefix)) {
      if (i - seen.get(prefix) &gt;= 2) return true;
    } else {
      seen.set(prefix, i);
    }
  }
  return false;
}
// Use prefix mod K; if same mod seen twice, subarray between them sums to multiple of K.</code></pre>

<h3>Longest consecutive sequence</h3>
<pre><code class="language-js">function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const n of set) {
    if (!set.has(n - 1)) {              // start of a sequence
      let curr = n, length = 1;
      while (set.has(curr + 1)) { curr++; length++; }
      best = Math.max(best, length);
    }
  }
  return best;
}
// O(n) time. Each element starts at most one inner loop (because we check predecessor).</code></pre>

<h3>Isomorphic strings</h3>
<pre><code class="language-js">function isIsomorphic(s, t) {
  if (s.length !== t.length) return false;
  const sToT = new Map(), tToS = new Map();
  for (let i = 0; i &lt; s.length; i++) {
    if (sToT.has(s[i]) &amp;&amp; sToT.get(s[i]) !== t[i]) return false;
    if (tToS.has(t[i]) &amp;&amp; tToS.get(t[i]) !== s[i]) return false;
    sToT.set(s[i], t[i]);
    tToS.set(t[i], s[i]);
  }
  return true;
}</code></pre>

<h3>Word pattern</h3>
<pre><code class="language-js">function wordPattern(pattern, s) {
  const words = s.split(/\\s+/);
  if (words.length !== pattern.length) return false;
  const pToW = new Map(), wToP = new Map();
  for (let i = 0; i &lt; pattern.length; i++) {
    const p = pattern[i], w = words[i];
    if (pToW.has(p) &amp;&amp; pToW.get(p) !== w) return false;
    if (wToP.has(w) &amp;&amp; wToP.get(w) !== p) return false;
    pToW.set(p, w);
    wToP.set(w, p);
  }
  return true;
}</code></pre>

<h3>Hashing tuples (coordinates)</h3>
<pre><code class="language-js">// For grid problems, coords as keys
const visited = new Set();
visited.add(\`\${i},\${j}\`);                  // string key
visited.has(\`\${i},\${j}\`);

// Or 2D matrix:
const visited = Array.from({ length: m }, () =&gt; new Array(n).fill(false));
visited[i][j] = true;</code></pre>

<h3>Hash collisions awareness</h3>
<pre><code class="language-js">// Bad: numeric keys for points
map.set([1, 2], 'a');                       // doesn't work as expected
map.has([1, 2]);                             // false! Different array reference

// Good: string-encode the tuple
map.set('1,2', 'a');
map.has('1,2');                              // true</code></pre>

<h3>JSON.stringify for complex keys</h3>
<pre><code class="language-js">// Hash an object as key
const key = JSON.stringify({a: 1, b: 2});    // '{"a":1,"b":2}'
// Caveat: key order matters; not portable across all object shapes.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — Two sum</h3>
<pre><code class="language-js">function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i &lt; nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}</code></pre>

<h3>Example 2 — Contains duplicate</h3>
<pre><code class="language-js">function containsDuplicate(nums) {
  return new Set(nums).size !== nums.length;
}</code></pre>

<h3>Example 3 — Valid anagram</h3>
<pre><code class="language-js">function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);
  for (let i = 0; i &lt; s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
    count[t.charCodeAt(i) - 97]--;
  }
  return count.every(c =&gt; c === 0);
}</code></pre>

<h3>Example 4 — Group anagrams</h3>
<pre><code class="language-js">function groupAnagrams(strs) {
  const groups = new Map();
  for (const s of strs) {
    const key = s.split('').sort().join('');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}</code></pre>

<h3>Example 5 — Top K frequent (bucket sort)</h3>
<pre><code class="language-js">function topKFrequent(nums, k) {
  const count = new Map();
  for (const n of nums) count.set(n, (count.get(n) || 0) + 1);
  const buckets = Array.from({ length: nums.length + 1 }, () =&gt; []);
  for (const [n, f] of count) buckets[f].push(n);
  const result = [];
  for (let f = buckets.length - 1; f &gt;= 0 &amp;&amp; result.length &lt; k; f--)
    for (const n of buckets[f]) {
      result.push(n);
      if (result.length === k) break;
    }
  return result;
}</code></pre>

<h3>Example 6 — Subarray sum equals K</h3>
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

<h3>Example 7 — Longest consecutive sequence</h3>
<pre><code class="language-js">function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const n of set) {
    if (!set.has(n - 1)) {
      let curr = n, len = 1;
      while (set.has(curr + 1)) { curr++; len++; }
      best = Math.max(best, len);
    }
  }
  return best;
}
// O(n) time, O(n) space</code></pre>

<h3>Example 8 — Intersection of two arrays</h3>
<pre><code class="language-js">function intersection(nums1, nums2) {
  const set = new Set(nums1);
  const result = new Set();
  for (const n of nums2) if (set.has(n)) result.add(n);
  return [...result];
}</code></pre>

<h3>Example 9 — Find common characters</h3>
<pre><code class="language-js">function commonChars(words) {
  let common = new Array(26).fill(Infinity);
  for (const w of words) {
    const count = new Array(26).fill(0);
    for (const c of w) count[c.charCodeAt(0) - 97]++;
    common = common.map((c, i) =&gt; Math.min(c, count[i]));
  }
  const result = [];
  for (let i = 0; i &lt; 26; i++)
    for (let j = 0; j &lt; common[i]; j++)
      result.push(String.fromCharCode(97 + i));
  return result;
}</code></pre>

<h3>Example 10 — First unique character</h3>
<pre><code class="language-js">function firstUniqChar(s) {
  const count = new Array(26).fill(0);
  for (const c of s) count[c.charCodeAt(0) - 97]++;
  for (let i = 0; i &lt; s.length; i++)
    if (count[s.charCodeAt(i) - 97] === 1) return i;
  return -1;
}</code></pre>

<h3>Example 11 — Happy number</h3>
<pre><code class="language-js">function isHappy(n) {
  const seen = new Set();
  while (n !== 1 &amp;&amp; !seen.has(n)) {
    seen.add(n);
    n = squareSum(n);
  }
  return n === 1;
}
function squareSum(n) {
  let sum = 0;
  while (n &gt; 0) { sum += (n % 10) ** 2; n = Math.floor(n / 10); }
  return sum;
}</code></pre>

<h3>Example 12 — Find all duplicates in array (1..n)</h3>
<pre><code class="language-js">function findDuplicates(nums) {
  const seen = new Set();
  const result = [];
  for (const n of nums) {
    if (seen.has(n)) result.push(n);
    else seen.add(n);
  }
  return result;
}
// O(n) time, O(n) space.
// O(1) space alternative: mark visited via sign flip on nums[abs(x)-1].</code></pre>

<h3>Example 13 — Word pattern</h3>
<pre><code class="language-js">function wordPattern(pattern, s) {
  const words = s.split(/\\s+/);
  if (words.length !== pattern.length) return false;
  const pToW = new Map(), wToP = new Map();
  for (let i = 0; i &lt; pattern.length; i++) {
    if (pToW.has(pattern[i]) &amp;&amp; pToW.get(pattern[i]) !== words[i]) return false;
    if (wToP.has(words[i]) &amp;&amp; wToP.get(words[i]) !== pattern[i]) return false;
    pToW.set(pattern[i], words[i]);
    wToP.set(words[i], pattern[i]);
  }
  return true;
}</code></pre>

<h3>Example 14 — Sudoku validity (3 hash sets)</h3>
<pre><code class="language-js">function isValidSudoku(board) {
  const rows = Array.from({length: 9}, () =&gt; new Set());
  const cols = Array.from({length: 9}, () =&gt; new Set());
  const boxes = Array.from({length: 9}, () =&gt; new Set());
  for (let r = 0; r &lt; 9; r++) {
    for (let c = 0; c &lt; 9; c++) {
      const v = board[r][c];
      if (v === '.') continue;
      const box = Math.floor(r/3) * 3 + Math.floor(c/3);
      if (rows[r].has(v) || cols[c].has(v) || boxes[box].has(v)) return false;
      rows[r].add(v); cols[c].add(v); boxes[box].add(v);
    }
  }
  return true;
}</code></pre>

<h3>Example 15 — 4-sum II (count tuples)</h3>
<pre><code class="language-js">function fourSumCount(A, B, C, D) {
  const sumAB = new Map();
  for (const a of A)
    for (const b of B)
      sumAB.set(a + b, (sumAB.get(a + b) || 0) + 1);

  let count = 0;
  for (const c of C)
    for (const d of D)
      count += sumAB.get(-(c + d)) || 0;

  return count;
}
// O(n²) instead of O(n⁴) brute force.
// Hash map of pair sums; lookup complement.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Map / Set with object keys</h3>
<p>Two different array literals with same values are different references — different keys. <code>map.set([1,2], 'a'); map.has([1,2])</code> is false. Use serialized strings for compound keys.</p>

<h3>2. Object as Map key vs string</h3>
<p>Map allows any key. Object only string-coerced. Use Map when you need numeric / object keys.</p>

<h3>3. <code>0 vs '0'</code></h3>
<p>Map distinguishes by type: <code>map.set(0, 'a'); map.get('0')</code> is undefined. Object coerces both to '0'.</p>

<h3>4. Map size vs object size</h3>
<p><code>map.size</code> is direct. Object: <code>Object.keys(obj).length</code>, O(n).</p>

<h3>5. Iteration order</h3>
<p>Map / Set: insertion order. Object: insertion order for string keys, numeric keys come first in numeric order. Map's behavior is more predictable.</p>

<h3>6. NaN as key</h3>
<p>Map: <code>map.set(NaN, 'x'); map.get(NaN)</code> works (NaN === NaN here). Direct equality (<code>NaN === NaN</code> is false), but Map uses SameValueZero.</p>

<h3>7. Empty map operations</h3>
<p><code>map.get(missingKey)</code> returns undefined (not throw). Use <code>(map.get(k) || 0)</code> for counter idiom. But careful: if value can be 0 legitimately, distinguish missing vs 0.</p>

<h3>8. Hash collisions on adversarial input</h3>
<p>JS engine hashing is implementation-defined. Modern engines randomize. Don't worry for most apps; security-critical use cryptographic hash.</p>

<h3>9. WeakMap can't be iterated</h3>
<p>WeakMap intentionally hides keys to enable GC. <code>weakMap.size</code> is undefined; can't iterate. Use Map if you need iteration.</p>

<h3>10. JSON.stringify for compound keys</h3>
<p>Order of object keys matters. <code>{a:1, b:2}</code> stringify and <code>{b:2, a:1}</code> may differ (modern: same; older: not guaranteed). Prefer fixed-key-order serialization.</p>

<h3>11. Counter map vs Array index</h3>
<p>For known small charset (26 lowercase letters), Array is faster than Map. For arbitrary keys, Map.</p>

<h3>12. Two-sum with duplicates</h3>
<p>If nums has duplicates, you might want all pairs that sum to target. The "store as you scan" pattern handles correctly because we check before storing.</p>

<h3>13. Subarray sum K with negatives</h3>
<p>Hash + prefix sum works because we don't need monotonicity. Sliding window doesn't work with negatives, but prefix + hash does.</p>

<h3>14. Longest consecutive — careful start detection</h3>
<p>Only start counting from a sequence's smallest member (predecessor not in set). Otherwise O(n²).</p>

<h3>15. Frequency map with small fixed range</h3>
<p>Use array. Faster cache behavior, less overhead than Map.</p>

<h3>16. Set difference / intersection</h3>
<p>JS doesn't have built-in set algebra (until very recent ES). Manually:</p>
<pre><code class="language-js">const intersect = new Set([...a].filter(x =&gt; b.has(x)));
const diff = new Set([...a].filter(x =&gt; !b.has(x)));
const union = new Set([...a, ...b]);</code></pre>

<h3>17. Removing while iterating Map</h3>
<p>Allowed but iterate carefully. Better: collect keys to delete, then delete in second pass.</p>

<h3>18. Map vs Object perf in V8</h3>
<p>V8 optimizes both. Map is slightly faster for heavy use; object is faster for occasional. Both O(1) average.</p>

<h3>19. Large key collision attacks</h3>
<p>For network input, adversarial keys can degrade hash to O(n). For high-volume systems, use cryptographic hash + salt.</p>

<h3>20. Float keys</h3>
<p>Map: works but precision (0.1 + 0.2 ≠ 0.3). Use rounded / scaled integers when feasible.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — using array.includes in nested loop</h3>
<pre><code class="language-js">// O(n²)
for (const a of arr1)
  if (arr2.includes(a)) result.push(a);

// O(n) with Set
const set = new Set(arr2);
for (const a of arr1)
  if (set.has(a)) result.push(a);</code></pre>

<h3>Anti-pattern 2 — Object as Map for non-string keys</h3>
<p>Number / object keys get coerced to string. Use Map.</p>

<h3>Anti-pattern 3 — recreating frequency map in loop</h3>
<pre><code class="language-js">// BAD
for (const word of words) {
  const count = {};
  for (const c of word) count[c] = (count[c] || 0) + 1;
  // ... do something with count
}
// Already O(n × k); often unavoidable for per-word work.

// AVOID re-creating the same map across calls.</code></pre>

<h3>Anti-pattern 4 — using arrays as hash keys</h3>
<pre><code class="language-js">// Different references; never matches
const map = new Map();
map.set([1, 2], 'a');
map.has([1, 2]);   // false

// Use serialization
map.set('1,2', 'a');
map.has('1,2');    // true</code></pre>

<h3>Anti-pattern 5 — counter check with falsy 0</h3>
<pre><code class="language-js">// BAD when count can be 0
if (map.get(k)) { ... }   // false for 0!

// GOOD
if (map.has(k)) { ... }
// or:
const n = map.get(k) ?? 0;</code></pre>

<h3>Anti-pattern 6 — heavy stringify for complex keys</h3>
<p>JSON.stringify per operation is slow. For hot paths, custom serialization or nested Map.</p>

<h3>Anti-pattern 7 — forgetting to delete keys at zero</h3>
<p>If you track distinct via <code>map.size</code>, must delete keys at count 0. Otherwise size is wrong.</p>

<h3>Anti-pattern 8 — using Map when Array works</h3>
<p>For 26 lowercase letters, <code>new Array(26)</code> is faster + less memory.</p>

<h3>Anti-pattern 9 — over-iterating</h3>
<pre><code class="language-js">for (const k of map.keys())
  process(map.get(k));      // double lookup

// Better:
for (const [k, v] of map)
  process(k, v);</code></pre>

<h3>Anti-pattern 10 — re-hashing strings on every iteration</h3>
<p>Computing hash of long key repeatedly costs. Cache the key once if used multiple times.</p>

<h3>Anti-pattern 11 — group anagrams via sort instead of count</h3>
<p>For long strings, char-count signature beats sort. O(n × k) vs O(n × k log k).</p>

<h3>Anti-pattern 12 — relying on Object insertion order pre-ES2015</h3>
<p>Old engines didn't guarantee. Modern engines do. For algorithms relying on order, prefer Map (always insertion-ordered).</p>

<h3>Anti-pattern 13 — using Set as Map alternative</h3>
<p>Set stores values; Map stores key→value. If you need values, use Map.</p>

<h3>Anti-pattern 14 — not initializing prefix-count map with [0, 1]</h3>
<p>Subarray-sum-K solution requires <code>map.set(0, 1)</code> initially — represents the empty prefix. Forgetting → off-by-one results.</p>

<h3>Anti-pattern 15 — hashing every grid cell as string</h3>
<p>For grid of m×n, use 2D array of booleans instead of <code>Set</code> with <code>"r,c"</code> keys. Faster + less memory.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. When use a hash map?</div>
  <div class="qa-answer">
    <ul>
      <li>O(1) lookup of presence / value.</li>
      <li>Frequency / count problems.</li>
      <li>Index of first or last seen element.</li>
      <li>Complement search (two-sum, four-sum II).</li>
      <li>Group items by canonical form (anagrams).</li>
      <li>Prefix-sum + count for subarray-sum problems.</li>
      <li>Reduce O(n²) brute-force lookup to O(n).</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Map vs Object in JS?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Map</strong>: any key, any type. Iteration in insertion order. <code>map.size</code>. Faster for heavy use.</li>
      <li><strong>Object</strong>: string keys (coerced). JSON-friendly. Built-in.</li>
    </ul>
    <p>For algorithms / hot loops: Map. For app data with string keys: Object often fine.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Implement Two Sum with hash.</div>
  <div class="qa-answer">
<pre><code class="language-js">function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i &lt; nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}</code></pre>
    <p>O(n) time, O(n) space. Single pass.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Subarray Sum Equals K — explain.</div>
  <div class="qa-answer">
    <p>Compute running prefix sum. For each prefix, count of subarrays ending here with sum K equals count of (prefix - K) seen previously. Use hash map prefix → count.</p>
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
    <p>O(n) time, O(n) space. Works with negatives.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Group anagrams.</div>
  <div class="qa-answer">
<pre><code class="language-js">function groupAnagrams(strs) {
  const groups = new Map();
  for (const s of strs) {
    const key = s.split('').sort().join('');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}</code></pre>
    <p>Or canonical char-count signature for faster on long strings.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Top K Frequent Elements.</div>
  <div class="qa-answer">
    <p>Frequency map + bucket sort by frequency:</p>
<pre><code class="language-js">function topKFrequent(nums, k) {
  const count = new Map();
  for (const n of nums) count.set(n, (count.get(n) || 0) + 1);
  const buckets = Array.from({length: nums.length + 1}, () =&gt; []);
  for (const [n, f] of count) buckets[f].push(n);
  const result = [];
  for (let f = buckets.length - 1; f &gt;= 0 &amp;&amp; result.length &lt; k; f--)
    for (const n of buckets[f]) {
      result.push(n);
      if (result.length === k) break;
    }
  return result;
}</code></pre>
    <p>O(n) time. Heap alternative is O(n log k).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Longest consecutive sequence.</div>
  <div class="qa-answer">
    <p>Put all in Set. For each number that's the start of a sequence (n-1 not in set), count length.</p>
<pre><code class="language-js">function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const n of set) {
    if (!set.has(n - 1)) {
      let curr = n, len = 1;
      while (set.has(curr + 1)) { curr++; len++; }
      best = Math.max(best, len);
    }
  }
  return best;
}</code></pre>
    <p>O(n) time despite the inner while — each element visited at most once because we only start from sequence beginnings.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why is hash O(1) only on average?</div>
  <div class="qa-answer">
    <p>If all keys hash to the same bucket, every operation degenerates to O(n). Average uniformly-distributed keys → O(1). For adversarial input (security context), use randomized / cryptographic hashing. Real engines (V8, etc.) use randomized hashing to defend against attacks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Is anagram check faster with sort or count?</div>
  <div class="qa-answer">
    <p>For ASCII letters (small charset): char count is O(n) vs sort O(n log n). For arbitrary characters: sort is simpler. Hash map count works for any charset, O(n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you intersect two arrays?</div>
  <div class="qa-answer">
<pre><code class="language-js">function intersect(a, b) {
  const set = new Set(a);
  return b.filter(x =&gt; set.has(x));
}</code></pre>
    <p>O(a + b) time. With Set lookup, no nested loop.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. 4Sum II — count tuples summing to 0 across 4 arrays.</div>
  <div class="qa-answer">
<pre><code class="language-js">function fourSumCount(A, B, C, D) {
  const sumAB = new Map();
  for (const a of A) for (const b of B)
    sumAB.set(a + b, (sumAB.get(a + b) || 0) + 1);
  let count = 0;
  for (const c of C) for (const d of D)
    count += sumAB.get(-(c + d)) || 0;
  return count;
}</code></pre>
    <p>O(n²) by splitting into two pair sums.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How to use prefix sum + hash for "K-multiple sum"?</div>
  <div class="qa-answer">
    <p>Track <code>prefix mod K</code>. Two indices with same mod → subarray between them sums to multiple of K.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How to hash a coordinate?</div>
  <div class="qa-answer">
    <p>String-encode: <code>\`\${r},\${c}\`</code>. Or, for grid problems, use 2D boolean array indexed by [r][c]. Array is faster + simpler when bounds are known.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Hash collisions in algorithm interviews?</div>
  <div class="qa-answer">
    <p>Usually irrelevant; assume O(1) average lookup. Mention worst case if asked. For security-sensitive problems (e.g., DOS via collisions), discuss randomized hashing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. When would you NOT use a hash map?</div>
  <div class="qa-answer">
    <ul>
      <li>Memory-constrained problems demanding O(1) extra space.</li>
      <li>Order-sensitive operations where insertion order isn't enough (need sort).</li>
      <li>Range queries (need balanced BST or sorted structure).</li>
      <li>When the cost of hashing keys is high relative to the data size.</li>
      <li>Small fixed range — array indexing is cheaper.</li>
    </ul>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You reach for hash map / set when brute force has nested lookup.</li>
    <li>You distinguish Map from Object (any key vs string only).</li>
    <li>You use frequency arrays for small charset, Map otherwise.</li>
    <li>You apply prefix sum + hash for subarray-sum problems with negatives.</li>
    <li>You group by canonical form for anagram-style problems.</li>
    <li>You use bucket sort for top-K frequency in O(n).</li>
    <li>You initialize prefix-sum map with [0, 1] for empty subarray.</li>
    <li>You delete keys at count 0 when tracking distinct via size.</li>
  </ul>
</div>
`}

]
});
