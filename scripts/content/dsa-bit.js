window.PREP_SITE.registerTopic({
  id: 'dsa-bit',
  module: 'dsa',
  title: 'Bit Manipulation',
  estimatedReadTime: '40 min',
  tags: ['bits', 'bitwise', 'xor', 'masking', 'population-count', 'subset-iteration', 'bit-tricks'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Bit manipulation</strong> uses bitwise operators (<code>&amp;</code>, <code>|</code>, <code>^</code>, <code>~</code>, <code>&lt;&lt;</code>, <code>&gt;&gt;</code>, <code>&gt;&gt;&gt;</code>) to operate on integers at the bit level. It's the right answer for problems involving sets of small N (subset bitmasks), XOR-based parity tricks, single-pass O(1) optimizations, and low-level encodings. Most "is this a power of 2?" / "find the unique element" / "iterate all subsets" problems collapse to a few bit operations.</p>
<ul>
  <li><strong>The 6 essential operators:</strong> AND (<code>&amp;</code>), OR (<code>|</code>), XOR (<code>^</code>), NOT (<code>~</code>), left shift (<code>&lt;&lt;</code>), right shift (<code>&gt;&gt;</code>, signed) and unsigned right shift (<code>&gt;&gt;&gt;</code>).</li>
  <li><strong>JS specifics:</strong> bitwise ops coerce to 32-bit signed integers. Numbers above 2³¹ truncate. For 64-bit, use BigInt.</li>
  <li><strong>Patterns:</strong> set / clear / toggle / test bit; isolate lowest set bit; count set bits (popcount); check power of 2; XOR all elements.</li>
  <li><strong>Subset bitmasks:</strong> for N ≤ 20, represent any subset of N items as an N-bit integer. Iterate all 2^N subsets.</li>
  <li><strong>XOR identities:</strong> <code>a ^ a = 0</code>, <code>a ^ 0 = a</code>, commutative + associative — basis for "find unique" and "swap without temp."</li>
  <li><strong>Bit-trick interview classics:</strong> Single Number, Counting Bits, Maximum XOR, Power of Two, Sum of Two Integers without +, Subsets via bitmask.</li>
  <li><strong>Real-world:</strong> color packing (RGB565), permission flags, feature toggles, hash bloom filters, GPU compute, network packet headers.</li>
</ul>
<p><strong>Mantra:</strong> "AND to test/clear, OR to set, XOR to toggle/find-unique, shift to scale by 2. Subset of 20 items = 20-bit integer."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>Why bit manipulation matters</h3>
<p>Modern computers are bit machines. Many algorithms have bit-level shortcuts that are 10-100× faster than equivalent arithmetic. Even if you don't write low-level code, certain interview problems are easier with bits, and certain perf-critical product code (image processing, hashing, compression) lives in bits.</p>

<h3>The 6 operators</h3>
<table>
  <thead><tr><th>Op</th><th>Symbol</th><th>Truth (per bit)</th></tr></thead>
  <tbody>
    <tr><td>AND</td><td><code>&amp;</code></td><td>1 if both bits 1</td></tr>
    <tr><td>OR</td><td><code>|</code></td><td>1 if either bit 1</td></tr>
    <tr><td>XOR</td><td><code>^</code></td><td>1 if bits differ</td></tr>
    <tr><td>NOT</td><td><code>~</code></td><td>flip all bits</td></tr>
    <tr><td>LEFT shift</td><td><code>&lt;&lt;</code></td><td>multiply by 2^n; new low bits = 0</td></tr>
    <tr><td>RIGHT shift (signed)</td><td><code>&gt;&gt;</code></td><td>divide by 2^n; preserves sign bit</td></tr>
    <tr><td>RIGHT shift (unsigned)</td><td><code>&gt;&gt;&gt;</code></td><td>divide by 2^n; fill with 0s (JS-specific)</td></tr>
  </tbody>
</table>

<h3>JavaScript bitwise quirks</h3>
<ul>
  <li>JS bitwise ops convert to <strong>32-bit signed integers</strong>. <code>0xFFFFFFFF | 0</code> = -1, not 4294967295.</li>
  <li>Numbers between 2³¹ and 2⁵³ overflow when bitwise-operated.</li>
  <li>For larger integers use <strong>BigInt</strong>: <code>1n &lt;&lt; 50n</code>.</li>
  <li><code>&gt;&gt;&gt;</code> exists only because of JS's signed-32-bit treatment; it's the only way to get unsigned right shift.</li>
</ul>

<h3>The mental model</h3>
<p>Think of every integer as its binary representation. <code>13 = 0b1101</code>. Bit positions index from 0 (LSB) on the right. Operations work bit-by-bit; carry-free for AND/OR/XOR.</p>

<h3>Why interviewers ask</h3>
<ol>
  <li>Bit manipulation is the cleanest answer to many specific problems (Single Number, Power of Two).</li>
  <li>Tests understanding of how computers represent numbers.</li>
  <li>Demonstrates O(1) tricks that beat naive O(n) loops.</li>
  <li>Real-world performance: bit-packing colors, flags, sets is common in graphics / network / embedded.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You recognize bitmask subset problems for N ≤ 20.</li>
  <li>You write XOR-based "find unique" without thinking.</li>
  <li>You use <code>n &amp; (n-1)</code> for popcount or "is power of 2."</li>
  <li>You understand JS's 32-bit coercion and switch to BigInt when needed.</li>
  <li>You can trace bit operations by hand.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The fundamental bit operations</h3>
<table>
  <thead><tr><th>Operation</th><th>Recipe</th></tr></thead>
  <tbody>
    <tr><td>Get bit at position i</td><td><code>(n &gt;&gt; i) &amp; 1</code></td></tr>
    <tr><td>Set bit at position i</td><td><code>n |= (1 &lt;&lt; i)</code></td></tr>
    <tr><td>Clear bit at position i</td><td><code>n &amp;= ~(1 &lt;&lt; i)</code></td></tr>
    <tr><td>Toggle bit at position i</td><td><code>n ^= (1 &lt;&lt; i)</code></td></tr>
    <tr><td>Update bit at position i to v (0 or 1)</td><td><code>n = (n &amp; ~(1 &lt;&lt; i)) | (v &lt;&lt; i)</code></td></tr>
    <tr><td>Test if bit i is set</td><td><code>(n &amp; (1 &lt;&lt; i)) !== 0</code></td></tr>
  </tbody>
</table>

<h3>Magic bit tricks</h3>
<table>
  <thead><tr><th>Trick</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td><code>n &amp; (n - 1)</code></td><td>Clears the lowest set bit</td></tr>
    <tr><td><code>n &amp; -n</code></td><td>Isolates the lowest set bit</td></tr>
    <tr><td><code>n | (n + 1)</code></td><td>Sets the lowest unset bit</td></tr>
    <tr><td><code>n &amp; (n + 1)</code></td><td>Tests if all-ones below highest bit (e.g., 7 = 0b111)</td></tr>
    <tr><td><code>(n &amp; -n) === n</code></td><td>True iff exactly one bit set (power of 2 + n &gt; 0)</td></tr>
    <tr><td><code>(n &amp; (n - 1)) === 0 &amp;&amp; n &gt; 0</code></td><td>Same: n is a power of 2</td></tr>
  </tbody>
</table>

<h3>XOR's algebraic properties</h3>
<table>
  <thead><tr><th>Identity</th><th>Useful for</th></tr></thead>
  <tbody>
    <tr><td><code>a ^ a = 0</code></td><td>Cancels duplicates</td></tr>
    <tr><td><code>a ^ 0 = a</code></td><td>Identity element</td></tr>
    <tr><td>commutative</td><td>Order doesn't matter</td></tr>
    <tr><td>associative</td><td>Group however convenient</td></tr>
    <tr><td><code>a ^ b = c → a ^ c = b → b ^ c = a</code></td><td>Recover any from the other two</td></tr>
  </tbody>
</table>
<p>"Single Number" problem: XOR every element. Pairs cancel; the unique remains.</p>

<h3>Population count (popcount)</h3>
<pre><code class="language-js">// Standard: count by clearing lowest set bit
function popcount(n) {
  let count = 0;
  while (n) {
    n &amp;= (n - 1);   // clear lowest set bit
    count++;
  }
  return count;
}

// Or 1 bit at a time
function popcountSlow(n) {
  let count = 0;
  while (n) {
    count += n &amp; 1;
    n &gt;&gt;&gt;= 1;
  }
  return count;
}

// Or built-in (modern JS / Node 22+)
const count = (n &gt;&gt;&gt; 0).toString(2).split('1').length - 1;
</code></pre>

<h3>The "subset bitmask" pattern</h3>
<p>For N ≤ 20: represent any subset of [0..N-1] as an integer 0..(2^N - 1). Bit i = 1 means item i is in the subset.</p>
<pre><code class="language-js">const N = 5;
for (let mask = 0; mask &lt; (1 &lt;&lt; N); mask++) {
  const subset = [];
  for (let i = 0; i &lt; N; i++) {
    if (mask &amp; (1 &lt;&lt; i)) subset.push(items[i]);
  }
  process(subset);
}
</code></pre>

<h3>Iterate submasks of a mask</h3>
<pre><code class="language-js">// Useful in DP problems where state is "what subset have I covered"
let sub = mask;
while (sub &gt; 0) {
  // process sub
  sub = (sub - 1) &amp; mask;
}
// process 0 (empty subset)
</code></pre>

<h3>JS-specific gotchas</h3>
<table>
  <thead><tr><th>Gotcha</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>32-bit signed coercion</td><td><code>1 &lt;&lt; 31</code> = -2147483648, not 2147483648</td></tr>
    <tr><td>Negative shifting</td><td><code>-5 &gt;&gt; 1</code> = -3 (sign-extend); <code>-5 &gt;&gt;&gt; 1</code> = 2147483645</td></tr>
    <tr><td>NaN / Infinity</td><td>Bitwise op coerces to 0</td></tr>
    <tr><td>1n vs 1</td><td>BigInt and Number can't mix in one expression</td></tr>
  </tbody>
</table>

<h3>The "boolean array as bitmask"</h3>
<p>For up to 32 booleans, an integer is faster + cheaper than an array. Each bit represents one boolean. Used in graph algorithms, game state, feature flags.</p>

<h3>BigInt for &gt; 32 bits</h3>
<pre><code class="language-js">// JS Numbers are 32-bit for bitwise; BigInt for larger
const x = 1n &lt;&lt; 50n;   // 2^50 exactly
const flags = 0n;
const SET = 1n &lt;&lt; 40n;
const newFlags = flags | SET;

// All operators work on BigInt: &amp;, |, ^, ~, &lt;&lt;, &gt;&gt; (signed only — no &gt;&gt;&gt;)
</code></pre>

<h3>Bit-counting with Brian Kernighan's algorithm</h3>
<p>The trick <code>n &amp; (n - 1)</code> clears exactly the lowest set bit. Iterating until 0 takes exactly popcount(n) iterations — far better than scanning all 32 bits.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Single Number — find the one without a pair</h3>
<pre><code class="language-js">function singleNumber(nums) {
  let result = 0;
  for (const n of nums) result ^= n;
  return result;
}
// Pairs cancel; lone element remains.
// O(n) time, O(1) space; beats sorting / hash set.
</code></pre>

<h3>Single Number II — every element appears 3 times except one</h3>
<pre><code class="language-js">function singleNumberII(nums) {
  let ones = 0, twos = 0;
  for (const n of nums) {
    ones = (ones ^ n) &amp; ~twos;
    twos = (twos ^ n) &amp; ~ones;
  }
  return ones;
}
// Tracks bits seen 1 mod 3 vs 2 mod 3 times.
</code></pre>

<h3>Single Number III — two elements appear once; rest twice</h3>
<pre><code class="language-js">function singleNumberIII(nums) {
  let xor = 0;
  for (const n of nums) xor ^= n;
  // xor = a ^ b; pick any bit where they differ
  const diff = xor &amp; -xor;
  let a = 0, b = 0;
  for (const n of nums) {
    if (n &amp; diff) a ^= n;
    else b ^= n;
  }
  return [a, b];
}
</code></pre>

<h3>Counting Bits (LeetCode 338)</h3>
<pre><code class="language-js">// For each i in 0..n, return number of 1 bits
function countBits(n) {
  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i &lt;= n; i++) {
    dp[i] = dp[i &gt;&gt; 1] + (i &amp; 1);
  }
  return dp;
}
// Or: dp[i] = dp[i &amp; (i-1)] + 1
</code></pre>

<h3>Power of Two</h3>
<pre><code class="language-js">function isPowerOfTwo(n) {
  return n &gt; 0 &amp;&amp; (n &amp; (n - 1)) === 0;
}
</code></pre>

<h3>Power of Four</h3>
<pre><code class="language-js">function isPowerOfFour(n) {
  return n &gt; 0 &amp;&amp; (n &amp; (n - 1)) === 0 &amp;&amp; (n &amp; 0x55555555) !== 0;
  // 0x55555555 has bits set at even positions; powers of 4 fall there
}
</code></pre>

<h3>Reverse Bits</h3>
<pre><code class="language-js">function reverseBits(n) {
  let result = 0;
  for (let i = 0; i &lt; 32; i++) {
    result = (result &lt;&lt; 1) | (n &amp; 1);
    n &gt;&gt;&gt;= 1;
  }
  return result &gt;&gt;&gt; 0;   // ensure unsigned for display
}
</code></pre>

<h3>Number of 1 Bits (Hamming Weight)</h3>
<pre><code class="language-js">function hammingWeight(n) {
  let count = 0;
  while (n) {
    n &amp;= (n - 1);
    count++;
  }
  return count;
}
</code></pre>

<h3>Sum of Two Integers without + or -</h3>
<pre><code class="language-js">function getSum(a, b) {
  while (b !== 0) {
    const carry = (a &amp; b) &lt;&lt; 1;
    a = a ^ b;
    b = carry;
  }
  return a;
}
// XOR adds without carry; AND finds carry; shift carry left, repeat.
</code></pre>

<h3>Missing Number (XOR trick)</h3>
<pre><code class="language-js">// nums contains 0..n with one missing
function missingNumber(nums) {
  let xor = nums.length;
  for (let i = 0; i &lt; nums.length; i++) {
    xor ^= i ^ nums[i];
  }
  return xor;
}
// XOR all 0..n with all elements; pairs cancel; missing remains.
</code></pre>

<h3>Generate all subsets via bitmask</h3>
<pre><code class="language-js">function subsets(nums) {
  const n = nums.length;
  const result = [];
  for (let mask = 0; mask &lt; (1 &lt;&lt; n); mask++) {
    const subset = [];
    for (let i = 0; i &lt; n; i++) {
      if (mask &amp; (1 &lt;&lt; i)) subset.push(nums[i]);
    }
    result.push(subset);
  }
  return result;
}
// O(N · 2^N) time and space.
</code></pre>

<h3>Bitmask DP — Traveling Salesman Problem</h3>
<pre><code class="language-js">function tsp(dist) {
  const n = dist.length;
  const FULL = (1 &lt;&lt; n) - 1;
  const dp = Array.from({ length: 1 &lt;&lt; n }, () =&gt; new Array(n).fill(Infinity));
  dp[1][0] = 0;   // visited only city 0, currently at city 0

  for (let mask = 1; mask &lt;= FULL; mask++) {
    for (let i = 0; i &lt; n; i++) {
      if (!(mask &amp; (1 &lt;&lt; i))) continue;
      if (dp[mask][i] === Infinity) continue;
      for (let j = 0; j &lt; n; j++) {
        if (mask &amp; (1 &lt;&lt; j)) continue;
        const next = mask | (1 &lt;&lt; j);
        if (dp[mask][i] + dist[i][j] &lt; dp[next][j]) {
          dp[next][j] = dp[mask][i] + dist[i][j];
        }
      }
    }
  }

  let best = Infinity;
  for (let i = 1; i &lt; n; i++) best = Math.min(best, dp[FULL][i] + dist[i][0]);
  return best;
}
</code></pre>

<h3>Maximum XOR of two numbers in array</h3>
<pre><code class="language-js">function findMaximumXOR(nums) {
  let max = 0, mask = 0;
  for (let bit = 31; bit &gt;= 0; bit--) {
    mask |= (1 &lt;&lt; bit);
    const prefixes = new Set(nums.map(n =&gt; n &amp; mask));
    const candidate = max | (1 &lt;&lt; bit);
    for (const p of prefixes) {
      if (prefixes.has(p ^ candidate)) {
        max = candidate;
        break;
      }
    }
  }
  return max;
}
// Greedy: try to set each bit from MSB; if some pair achieves it, keep.
// O(32 · N) — very fast.
</code></pre>

<h3>Bit-pack RGB565 color</h3>
<pre><code class="language-js">// 5 bits R, 6 bits G, 5 bits B
function rgb565(r, g, b) {
  return ((r &gt;&gt; 3) &lt;&lt; 11) | ((g &gt;&gt; 2) &lt;&lt; 5) | (b &gt;&gt; 3);
}

function rgb565ToRgb(packed) {
  return {
    r: ((packed &gt;&gt; 11) &amp; 0x1F) &lt;&lt; 3,
    g: ((packed &gt;&gt; 5) &amp; 0x3F) &lt;&lt; 2,
    b: (packed &amp; 0x1F) &lt;&lt; 3,
  };
}
</code></pre>

<h3>Permission flags via bitmask</h3>
<pre><code class="language-js">const READ    = 1 &lt;&lt; 0;   // 1
const WRITE   = 1 &lt;&lt; 1;   // 2
const EXECUTE = 1 &lt;&lt; 2;   // 4
const ADMIN   = 1 &lt;&lt; 3;   // 8

let perms = READ | WRITE;

// Check
const canRead = (perms &amp; READ) !== 0;

// Add
perms |= ADMIN;

// Remove
perms &amp;= ~WRITE;

// Toggle
perms ^= EXECUTE;
</code></pre>

<h3>Bit-twiddle Hamming Distance</h3>
<pre><code class="language-js">function hammingDistance(x, y) {
  let xor = x ^ y;
  let count = 0;
  while (xor) {
    xor &amp;= (xor - 1);
    count++;
  }
  return count;
}
</code></pre>

<h3>Iterate all submasks of a mask</h3>
<pre><code class="language-js">function eachSubmask(mask, fn) {
  let sub = mask;
  while (sub &gt; 0) {
    fn(sub);
    sub = (sub - 1) &amp; mask;
  }
  fn(0);
}
// Total: 3^N over all masks of N bits — useful in subset DP
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Single Number (LeetCode 136)</h3>
<p>XOR all elements; pairs cancel.</p>

<h3>Example 2: Counting Bits (LeetCode 338)</h3>
<p>DP: <code>dp[i] = dp[i &gt;&gt; 1] + (i &amp; 1)</code></p>

<h3>Example 3: Maximum XOR Pair</h3>
<p>Build bit trie or use prefix-set greedy from MSB. Both O(32N).</p>

<h3>Example 4: Subset enumeration</h3>
<pre><code class="language-js">// Enumerate all subsets of [1, 2, 3]
const nums = [1, 2, 3];
for (let mask = 0; mask &lt; (1 &lt;&lt; nums.length); mask++) {
  const subset = nums.filter((_, i) =&gt; mask &amp; (1 &lt;&lt; i));
  console.log(subset);
}
// []
// [1]
// [2]
// [1, 2]
// [3]
// [1, 3]
// [2, 3]
// [1, 2, 3]
</code></pre>

<h3>Example 5: Word abbreviation matching (bitmask)</h3>
<pre><code class="language-js">// "internationalization" → "i12n" (i + 12 chars + n)
// Encode each pattern as a bitmask of "kept" letters
function isMatch(word, abbr) {
  // ... (decoder)
}
</code></pre>

<h3>Example 6: Bitmask DP — Smallest sufficient team</h3>
<pre><code class="language-js">// Given required skills + people with skill sets, find min team
function smallestSufficientTeam(req_skills, people) {
  const skillIdx = new Map(req_skills.map((s, i) =&gt; [s, i]));
  const target = (1 &lt;&lt; req_skills.length) - 1;

  const peopleSkills = people.map(skills =&gt; {
    let mask = 0;
    for (const s of skills) {
      if (skillIdx.has(s)) mask |= (1 &lt;&lt; skillIdx.get(s));
    }
    return mask;
  });

  const dp = new Array(1 &lt;&lt; req_skills.length).fill(null);
  dp[0] = [];

  for (let i = 0; i &lt; people.length; i++) {
    const pSkills = peopleSkills[i];
    for (let mask = 0; mask &lt; dp.length; mask++) {
      if (dp[mask] === null) continue;
      const newMask = mask | pSkills;
      if (dp[newMask] === null || dp[newMask].length &gt; dp[mask].length + 1) {
        dp[newMask] = [...dp[mask], i];
      }
    }
  }
  return dp[target];
}
</code></pre>

<h3>Example 7: Find unique twice in O(1) space</h3>
<p>See Single Number III in Mechanics — XOR + bit-isolation trick.</p>

<h3>Example 8: Encode short strings as integers</h3>
<pre><code class="language-js">// Encode a string of up to 5 lowercase letters as 26-base integer (~5 * 5 bits = 25 bits)
function encode(s) {
  let n = 0;
  for (const c of s) {
    n = n * 27 + (c.charCodeAt(0) - 96);   // 1-26, 0 = end
  }
  return n;
}
function decode(n) {
  let s = '';
  while (n &gt; 0) {
    s = String.fromCharCode(96 + (n % 27)) + s;
    n = Math.floor(n / 27);
  }
  return s;
}
</code></pre>

<h3>Example 9: Bit manipulation in graph problems</h3>
<pre><code class="language-js">// Use bitmask to track visited set in BFS over implicit graph (e.g., word ladder)
function ladderLength(begin, end, wordList) {
  // Each word can be encoded as a bitmask of "differs from this word in exactly 1 letter" relationships.
  // Then BFS over masks.
}
</code></pre>

<h3>Example 10: Hash bloom filter (simplified)</h3>
<pre><code class="language-js">class BloomFilter {
  constructor(bits = 1024) {
    this.bits = new Uint32Array(Math.ceil(bits / 32));
    this.size = bits;
  }
  add(s) {
    const h1 = hash(s);
    const h2 = hash2(s);
    const h3 = hash3(s);
    [h1, h2, h3].forEach(h =&gt; this.set(h % this.size));
  }
  contains(s) {
    const h1 = hash(s);
    const h2 = hash2(s);
    const h3 = hash3(s);
    return [h1, h2, h3].every(h =&gt; this.get(h % this.size));
  }
  set(i)  { this.bits[i &gt;&gt; 5] |= (1 &lt;&lt; (i &amp; 31)); }
  get(i)  { return (this.bits[i &gt;&gt; 5] &amp; (1 &lt;&lt; (i &amp; 31))) !== 0; }
}
</code></pre>

<h3>Example 11: Find first set bit (trailing zeros)</h3>
<pre><code class="language-js">function trailingZeros(n) {
  if (n === 0) return 32;
  let count = 0;
  while (!(n &amp; 1)) {
    count++;
    n &gt;&gt;&gt;= 1;
  }
  return count;
}
// Or: Math.log2(n &amp; -n) — isolates lowest bit
</code></pre>

<h3>Example 12: Brian Kernighan demo</h3>
<pre><code class="language-js">// Print which bits are set in n
function showSetBits(n) {
  while (n) {
    const lowest = n &amp; -n;   // isolate lowest set bit
    console.log(Math.log2(lowest));
    n &amp;= (n - 1);   // clear it
  }
}
// 13 (0b1101) → 0, 2, 3
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>JS 32-bit signed coercion</h3>
<pre><code class="language-js">1 &lt;&lt; 31;   // -2147483648 (negative!)
2147483648 | 0;   // -2147483648 (negative!)
0xFFFFFFFF;   // 4294967295 as Number
0xFFFFFFFF | 0;   // -1 (32-bit signed)
</code></pre>
<p>Use <code>n &gt;&gt;&gt; 0</code> to convert to unsigned 32-bit if needed. For larger, BigInt.</p>

<h3>Negative right shift</h3>
<pre><code class="language-js">-5 &gt;&gt; 1;   // -3 (arithmetic shift; sign-extends)
-5 &gt;&gt;&gt; 1;  // 2147483645 (logical shift; fills 0)
</code></pre>

<h3>BigInt and Number don't mix</h3>
<pre><code class="language-js">1n + 1;   // TypeError
1n + BigInt(1);   // 2n
</code></pre>

<h3>Subset bitmask requires N ≤ 30</h3>
<p>2^30 ≈ 10⁹; 2^32 = 4·10⁹ — overflow on signed int. For N ≤ 20 you have ~10⁶ subsets, easily iterable. For N &gt; 20, look for alternative algorithms.</p>

<h3>Bit operations are idempotent on NaN / Infinity</h3>
<p>Coerced to 0. <code>NaN | 0</code> = 0.</p>

<h3>Floating-point won't go through bitwise correctly</h3>
<p><code>1.5 | 0</code> = 1 (floors to int). For non-integer math, don't use bitwise.</p>

<h3>Large array / set bitmasks</h3>
<p>For N &gt; 32, use Uint32Array with two operations: <code>arr[i &gt;&gt; 5]</code> for word; <code>i &amp; 31</code> for bit position.</p>

<h3>BigInt has no &gt;&gt;&gt; (unsigned right shift)</h3>
<p>BigInt is arbitrary precision; "unsigned" doesn't apply. Use <code>(n &gt;&gt; nBigInt) &amp; ((1n &lt;&lt; bitsBigInt) - 1n)</code> if you need a window.</p>

<h3>Sign extension in negative numbers</h3>
<p>Reading a negative number's binary representation in JS: <code>(-1).toString(2)</code> gives "-1", not the full 32-bit. Use <code>(n &gt;&gt;&gt; 0).toString(2)</code> to get the unsigned representation.</p>

<h3>Performance: bitwise vs arithmetic in JS</h3>
<p>Bitwise is sometimes faster than equivalent arithmetic in V8 / Node, but margins are small. JIT often optimizes both. Don't micro-optimize without profiling.</p>

<h3>The 0 case</h3>
<p>Many bit tricks fail for n = 0:</p>
<ul>
  <li><code>0 &amp; -0 = 0</code> (correct: no lowest bit)</li>
  <li><code>(0 &amp; (0-1)) === 0</code> → would say "0 is power of 2" without n &gt; 0 guard</li>
</ul>
<p>Always check n &gt; 0 explicitly.</p>

<h3>Bit patterns and printing</h3>
<pre><code class="language-js">// Standard: pad to known width
function bin(n, width = 32) {
  return (n &gt;&gt;&gt; 0).toString(2).padStart(width, '0');
}
bin(13);   // "00000000000000000000000000001101"
</code></pre>

<h3>Bit count in V8</h3>
<p>Modern JS engines may have a popcount intrinsic, but no standard JS API. Brian Kernighan's algorithm is the portable choice.</p>

<h3>Cross-platform bit width</h3>
<p>JS bitwise = 32-bit. Other languages may default to 64-bit. Translating bit tricks across languages: be explicit about width.</p>

<h3>bigint serialization</h3>
<p>JSON.stringify can't serialize BigInt directly (throws). Convert to string: <code>JSON.stringify(n, (k, v) =&gt; typeof v === 'bigint' ? v.toString() : v)</code>.</p>

<h3>Subtle bug: shift count modulo 32</h3>
<pre><code class="language-js">1 &lt;&lt; 32;   // 1, not 0! shift count is mod 32
1 &lt;&lt; 33;   // 2
</code></pre>
<p>For "all ones" pattern: <code>~0</code> or <code>0xFFFFFFFF | 0</code>, not <code>(1 &lt;&lt; 32) - 1</code>.</p>

<h3>ESM strict mode and bitwise</h3>
<p>No issue; bitwise ops work the same in strict mode.</p>

<h3>Mobile JS engines (Hermes / JSC)</h3>
<p>All major mobile JS engines implement bitwise the same as V8 (32-bit signed). BigInt support varies; check Hermes version.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: 32-bit overflow surprise</h3>
<pre><code class="language-js">// BAD — for n &gt; 32 bits
let mask = 0;
for (let i = 0; i &lt; 50; i++) mask |= (1 &lt;&lt; i);
// mask is now NOT what you think (overflow)

// FIX — use BigInt
let mask = 0n;
for (let i = 0n; i &lt; 50n; i++) mask |= (1n &lt;&lt; i);
</code></pre>

<h3>Bug 2: Forgetting parentheses</h3>
<pre><code class="language-js">// BAD — operator precedence
if (n &amp; 1 &lt;&lt; i) { ... }   // shifts 1 by i then ANDs n? Actually: 1&lt;&lt;i has higher priority

// EXPLICIT
if (n &amp; (1 &lt;&lt; i)) { ... }
</code></pre>

<h3>Bug 3: Comparing bitwise result to truthy</h3>
<pre><code class="language-js">// BAD — works for most cases but fails for sign bit
if (n &amp; 0x80000000) { ... }   // returns -2147483648, not 0; truthy in JS
// OK in JS but bad practice; explicit:
if ((n &amp; 0x80000000) !== 0) { ... }
</code></pre>

<h3>Bug 4: Power-of-2 check without n &gt; 0</h3>
<pre><code class="language-js">// BAD
function isPow2(n) {
  return (n &amp; (n - 1)) === 0;   // returns true for n = 0!
}

// FIX
function isPow2(n) {
  return n &gt; 0 &amp;&amp; (n &amp; (n - 1)) === 0;
}
</code></pre>

<h3>Bug 5: Shift overflow (count &gt; 31)</h3>
<pre><code class="language-js">// BAD — shift mod 32
const allOnes = (1 &lt;&lt; 32) - 1;   // = 0!

// FIX
const allOnes = ~0 &gt;&gt;&gt; 0;   // = 0xFFFFFFFF
// or
const allOnes = 0xFFFFFFFF;
</code></pre>

<h3>Bug 6: Negative shift</h3>
<pre><code class="language-js">// Most languages: undefined behavior
// JS: shift count is masked with 31, so n &lt;&lt; -1 == n &lt;&lt; 31
// Probably not what you wanted
</code></pre>

<h3>Bug 7: Float bitwise unintentional</h3>
<pre><code class="language-js">// BAD — bitwise truncates to int
const half = 0.5 | 0;   // 0
// If you wanted Math.floor — say so
</code></pre>

<h3>Bug 8: Off-by-one in masks</h3>
<pre><code class="language-js">// "Lower 5 bits"
const mask = (1 &lt;&lt; 5) - 1;   // = 31, correct
// NOT (1 &lt;&lt; 5) = 32 (the bit ABOVE the 5 lower bits)
</code></pre>

<h3>Bug 9: Mistaking ^ for power</h3>
<p>In JS, <code>^</code> is XOR, not exponentiation. <code>2 ^ 3</code> = 1 (XOR), not 8. For exponent, use <code>**</code> or <code>Math.pow</code>.</p>

<h3>Bug 10: Bit-pack overflow</h3>
<pre><code class="language-js">// Trying to pack a 9-bit value into 8-bit slot
const r = 256;   // doesn't fit in 8 bits
const packed = (r &lt;&lt; 16);   // r &gt;&gt; 8 needed first; otherwise bits leak into other slots

// Always mask before packing
const safe = (r &amp; 0xFF) &lt;&lt; 16;
</code></pre>

<h3>Anti-pattern 1: Bit tricks where readability matters</h3>
<p>"Cleverly" using XOR to swap variables in production code is a smell — readability matters more than the negligible perf win.</p>

<h3>Anti-pattern 2: Bit manipulation when sets work</h3>
<p>For N &gt; 32, a Set is simpler and just as fast for typical use. Bitmask shines for small N with frequent set ops.</p>

<h3>Anti-pattern 3: Reaching for bit tricks first</h3>
<p>Many problems can be solved more clearly without bits. Use bitwise when it's idiomatic (Single Number, subset enumeration), not as a flex.</p>

<h3>Anti-pattern 4: Ignoring JS specifics in interview</h3>
<p>Mention "JS coerces to 32-bit signed" if the problem constraints exceed it. Show awareness.</p>

<h3>Anti-pattern 5: Hand-rolling popcount in a tight loop</h3>
<p>Modern engines may have intrinsics; for hot paths, profile. Brian Kernighan's algorithm is fine for most cases.</p>

<h3>Anti-pattern 6: Using bitmask DP without checking N</h3>
<p>2^N DP for N = 20 is fine (1M states); for N = 25 it's ~33M — borderline; for N = 30 it's 1B — too much. Know the limit.</p>

<h3>Anti-pattern 7: Mixing NaN / non-integers in bitwise</h3>
<p>Bitwise coerces silently. Pass an integer; document if your function requires it.</p>

<h3>Anti-pattern 8: Reading "&amp;" as "and" in code review</h3>
<p>Mistake <code>&amp;</code> for <code>&amp;&amp;</code> or vice versa. Use linters; double-check operator before submitting.</p>

<h3>Anti-pattern 9: Encoding bitmask as string for serialization</h3>
<p>Storing bitmask as a string of 0s and 1s wastes space. For storage, use raw integer or Base64-encoded byte array.</p>

<h3>Anti-pattern 10: Premature bit packing</h3>
<p>Packing fields into bits saves memory. For 1000 records, the savings are negligible; readability suffers. Use bit-packing for hot data structures (graphics, network) where memory or cache locality matters.</p>
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
    <tr><td>Single Number</td><td>XOR all elements</td></tr>
    <tr><td>Single Number II / III</td><td>XOR + bit-isolation tricks</td></tr>
    <tr><td>Counting Bits</td><td>DP via dp[i] = dp[i &gt;&gt; 1] + (i &amp; 1)</td></tr>
    <tr><td>Number of 1 Bits</td><td>Brian Kernighan's: n &amp; (n-1) clears lowest set bit</td></tr>
    <tr><td>Power of Two / Four</td><td>n &gt; 0 &amp;&amp; (n &amp; (n-1)) === 0; +mask check for 4</td></tr>
    <tr><td>Reverse Bits</td><td>Loop 32 times; shift result left, OR with low bit of n</td></tr>
    <tr><td>Sum of Two Integers</td><td>XOR + AND (carry); shift; loop</td></tr>
    <tr><td>Missing Number</td><td>XOR all 0..n with all elements</td></tr>
    <tr><td>Subsets / Subsets II</td><td>Bitmask iteration 0..2^N - 1</td></tr>
    <tr><td>Maximum XOR Pair</td><td>Bit trie OR greedy MSB-first prefix set</td></tr>
    <tr><td>Bitmask DP (TSP, Smallest Sufficient Team)</td><td>State = bitmask of visited / covered</td></tr>
    <tr><td>Hamming Distance</td><td>popcount(a ^ b)</td></tr>
    <tr><td>UTF-8 Validation</td><td>Bit pattern matching on bytes</td></tr>
    <tr><td>Bitwise AND of Range</td><td>Find common prefix of left, right</td></tr>
  </tbody>
</table>

<h3>Pattern recognition cheatsheet</h3>
<table>
  <thead><tr><th>Problem says...</th><th>Likely bits</th></tr></thead>
  <tbody>
    <tr><td>"Find the unique element"</td><td>YES (XOR)</td></tr>
    <tr><td>"All other elements appear N times"</td><td>YES (Single Number variants)</td></tr>
    <tr><td>"Power of K"</td><td>YES if K is 2; sometimes for 4 / 8</td></tr>
    <tr><td>"Subsets of N items, N ≤ 20"</td><td>YES (bitmask iteration)</td></tr>
    <tr><td>"Maximum / minimum XOR"</td><td>YES (greedy + trie)</td></tr>
    <tr><td>"State is which subset of items is covered"</td><td>YES (bitmask DP)</td></tr>
    <tr><td>"Encode boolean flags"</td><td>YES (bitmask as int)</td></tr>
    <tr><td>"N can be very large (10^9+)"</td><td>Not bitmask DP; need different approach</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Single Number — XOR all elements.</li>
  <li>Number of 1 Bits — Brian Kernighan's loop.</li>
  <li>Power of Two — single-line check.</li>
  <li>Counting Bits — DP from bits already counted.</li>
  <li>Subsets — bitmask iteration.</li>
  <li>Sum without + — XOR + carry loop.</li>
  <li>Maximum XOR Pair — bit trie or prefix-set greedy.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li><code>(1 &lt;&lt; 32)</code> = 1 in JS, not the next bit position. Shift mask mod 32.</li>
  <li><code>n &amp; -n</code> for n = 0 returns 0 — guard against this in power-of-two checks.</li>
  <li>Bitwise on float silently truncates — don't pass non-integers.</li>
  <li>Operator precedence: <code>n &amp; 1 == 1</code> = <code>n &amp; (1 == 1)</code> = <code>n &amp; true</code> — always parenthesize.</li>
  <li>JS XOR is <code>^</code>; don't confuse with exponent <code>**</code>.</li>
  <li>BigInt + Number type error — explicit conversion needed.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Pattern recognition</td><td>You name "XOR" or "bitmask DP" before coding.</td></tr>
    <tr><td>Trick fluency</td><td>You know <code>n &amp; (n-1)</code>, <code>n &amp; -n</code>, <code>(n &amp; (n-1)) === 0</code>.</td></tr>
    <tr><td>JS specifics awareness</td><td>You volunteer "32-bit signed coercion" when relevant.</td></tr>
    <tr><td>Subset bitmask</td><td>For N ≤ 20, you reach for bitmask iteration.</td></tr>
    <tr><td>BigInt awareness</td><td>You switch to BigInt for &gt;32 bit needs.</td></tr>
    <tr><td>Restraint</td><td>You don't use bit tricks where readability suffers.</td></tr>
    <tr><td>Brian Kernighan's algo</td><td>You write it on demand.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Bit manipulation in mobile: feature flags packed into ints, color packing (RGB565 for low-memory devices), bitmask permission systems.</li>
  <li>Hermes supports BigInt since Hermes 0.10; avoid in older Hermes.</li>
  <li>RN's StyleSheet is converted to integers internally for native bridge — bit packing.</li>
  <li>Native modules (iOS / Android) often expose bit-flag APIs (e.g., notification options, gesture states).</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why does <code>n &amp; (n - 1)</code> clear the lowest set bit?"</em> — n - 1 flips all bits at and below the lowest set bit. ANDing with n keeps only bits where both are 1, which excludes the previously-lowest bit.</li>
  <li><em>"Why is XOR 'addition without carry'?"</em> — XOR is bit-by-bit addition modulo 2; AND is the carry. Together they implement full add: a XOR b is the sum bit; (a AND b) &lt;&lt; 1 is the carry.</li>
  <li><em>"Why does Brian Kernighan's algorithm beat bit-by-bit popcount?"</em> — It runs in O(set bits) instead of O(total bits). For sparse integers, much faster.</li>
  <li><em>"What's the largest N for bitmask DP?"</em> — 2^N states must fit in memory. For N = 20, 2^20 = 1M states is comfortable; N = 25 = 33M borderline; N = 30+ is too large.</li>
  <li><em>"Why do CPUs have a POPCNT instruction?"</em> — Hardware support makes popcount O(1) at the CPU level. JS engines may use it; standard JS API doesn't expose it directly.</li>
</ul>

<h3>"What I'd do day one prepping for bit problems"</h3>
<ul>
  <li>Memorize the 6 essential ops + JS specifics (32-bit signed).</li>
  <li>Master <code>n &amp; (n - 1)</code>, <code>n &amp; -n</code>, <code>(n &amp; (n - 1)) === 0</code>.</li>
  <li>Practice subset bitmask iteration.</li>
  <li>Solve Single Number I/II/III.</li>
  <li>Implement XOR-based "missing number" and "max XOR pair".</li>
  <li>Write Sum of Two Integers without + or -.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd benchmark bit-packed feature flags vs Set for our flag system."</li>
  <li>"I'd implement a fast popcount via lookup table for Hermes (no built-in)."</li>
  <li>"I'd build a subset-bitmask DP utility module for combinatorial problems we encounter."</li>
  <li>"I'd add BigInt support to our hash-mask functions for 64-bit hashes."</li>
</ul>

<h3>DSA module summary</h3>
<p>The complete DSA module covers:</p>
<ul>
  <li><strong>Complexity Analysis</strong> — Big O fundamentals.</li>
  <li><strong>Arrays &amp; Strings</strong> — fundamental manipulation.</li>
  <li><strong>Two Pointers, Sliding Window, Hashing, Stack &amp; Queue, Linked List</strong> — core patterns.</li>
  <li><strong>Trees, Graphs, Heaps</strong> — non-linear structures.</li>
  <li><strong>Trie</strong> (prefix queries), <strong>Backtracking</strong>, <strong>DP</strong>, <strong>Greedy</strong>, <strong>Binary Search</strong>, <strong>Bit Manipulation</strong> (this topic).</li>
</ul>
<p>16 topics total. Together they cover ~95% of FAANG-style interview questions. Recognize the pattern → reach for the right tool → execute cleanly.</p>
`
    }
  ]
});
