window.PREP_SITE.registerTopic({
  id: 'dsa-dp',
  module: 'dsa',
  title: 'Dynamic Programming',
  estimatedReadTime: '60 min',
  tags: ['dynamic-programming', 'dp', 'memoization', 'tabulation', 'knapsack', 'lis', 'edit-distance', 'recursion', 'optimal-substructure'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Dynamic Programming (DP)</strong> is a technique for solving problems by breaking them into <em>overlapping subproblems</em> with <em>optimal substructure</em>. Instead of recomputing each subproblem repeatedly (which produces exponential time), you compute each one <em>once</em> and reuse the result. The mechanical hard part is recognizing the DP shape; the conceptual hard part is defining the state correctly.</p>
<ul>
  <li><strong>Two preconditions:</strong> overlapping subproblems (same subproblem solved many times) AND optimal substructure (optimal solution composed of optimal sub-solutions).</li>
  <li><strong>Two implementation styles:</strong> <em>top-down</em> (recursion + memoization, easier to derive) and <em>bottom-up</em> (iteration + tabulation, faster constants, no stack risk).</li>
  <li><strong>State = the parameters that fully describe a subproblem.</strong> If you can't write <code>f(state)</code>, you don't have a DP yet.</li>
  <li><strong>Recurrence = how the answer at state <code>s</code> depends on smaller states.</strong> The transition is the heart of every DP.</li>
  <li><strong>Common 1D shapes:</strong> Fibonacci-like, climbing stairs, house robber, coin change, longest increasing subsequence, longest palindromic substring.</li>
  <li><strong>Common 2D shapes:</strong> grid paths, edit distance, longest common subsequence, knapsack, regex matching, partition.</li>
  <li><strong>Space optimization:</strong> if state <code>i</code> only depends on state <code>i-1</code> (or i-1, i-2), you can replace the array with constant variables.</li>
  <li><strong>The big trap:</strong> over-engineering. Greedy works for many "looks like DP" problems. Memoizing pure functions of immutable inputs is enough for most.</li>
</ul>
<p><strong>Mantra:</strong> "Define the state. Write the recurrence. Pick top-down or bottom-up. Prove the base case. Optimize space last."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is Dynamic Programming?</h3>
<p>DP is a problem-solving paradigm. The recipe:</p>
<ol>
  <li>Define a function <code>f(state)</code> that returns the answer for a given state.</li>
  <li>Express <code>f(state)</code> as a combination of <code>f(smaller_state_1)</code>, <code>f(smaller_state_2)</code>, ... — this is the <strong>recurrence</strong>.</li>
  <li>Identify the <strong>base case(s)</strong>: states where the answer is known directly without recursion.</li>
  <li>Compute <code>f</code> for every needed state, ensuring each is computed once.</li>
</ol>
<p>The "dynamic" in DP doesn't mean "runtime-flexible." It's a historical artifact (Bellman picked the name to make it sound impressive). DP is just <em>structured caching of recursive computations</em>.</p>

<h3>Two preconditions</h3>
<table>
  <thead><tr><th>Property</th><th>Means</th></tr></thead>
  <tbody>
    <tr><td><strong>Overlapping subproblems</strong></td><td>The same subproblem appears many times in the recursion tree. Without this, memoization gives no speedup.</td></tr>
    <tr><td><strong>Optimal substructure</strong></td><td>The optimal answer to the whole can be built from the optimal answers to parts. (Without this, you'd need to consider all combinations of suboptimal parts.)</td></tr>
  </tbody>
</table>

<h3>Why both matter</h3>
<table>
  <thead><tr><th>Has overlapping?</th><th>Has optimal substructure?</th><th>Approach</th></tr></thead>
  <tbody>
    <tr><td>Yes</td><td>Yes</td><td>DP — perfect fit</td></tr>
    <tr><td>Yes</td><td>No</td><td>Need to enumerate; memoization helps but doesn't simplify</td></tr>
    <tr><td>No</td><td>Yes</td><td>Greedy or divide-and-conquer (no need to memoize)</td></tr>
    <tr><td>No</td><td>No</td><td>Brute force / backtracking</td></tr>
  </tbody>
</table>

<h3>Why DP is hard</h3>
<p>DP is famously the toughest interview category for most candidates. Three reasons:</p>
<ol>
  <li><strong>State definition is creative.</strong> No formula tells you what parameters matter. You define them based on insight into the problem's structure.</li>
  <li><strong>The recurrence isn't always obvious.</strong> Edit distance, regex matching, optimal BST — these have elegant recurrences that took mathematicians years to find.</li>
  <li><strong>Indices and base cases bite.</strong> Off-by-one errors, wrong initialization, accidentally allowing 0 when 1 is the floor — DP is unforgiving.</li>
</ol>

<h3>The two implementation styles</h3>
<table>
  <thead><tr><th>Top-down (memoization)</th><th>Bottom-up (tabulation)</th></tr></thead>
  <tbody>
    <tr><td>Recursive; cache results in a Map / array</td><td>Iterative; fill an array in dependency order</td></tr>
    <tr><td>Easier to derive (write the recurrence; add memo)</td><td>Faster (no function call overhead)</td></tr>
    <tr><td>Computes only needed states</td><td>Computes every reachable state</td></tr>
    <tr><td>Risks stack overflow on deep recursion</td><td>No stack risk</td></tr>
    <tr><td>Same time complexity</td><td>Same time complexity</td></tr>
  </tbody>
</table>

<h3>Where DP appears in real code</h3>
<ul>
  <li>String comparison (diff algorithms, edit distance).</li>
  <li>Path-finding with constraints (Dijkstra is dynamic-programming-flavored).</li>
  <li>Resource allocation (knapsack-shaped).</li>
  <li>Sequence alignment (bioinformatics).</li>
  <li>Optimal layout / packing.</li>
  <li>Bellman-Ford shortest paths (graph DP).</li>
</ul>

<h3>Why interviewers ask</h3>
<ol>
  <li>Tests pattern recognition under pressure.</li>
  <li>Tests state definition skill — the genuinely creative part.</li>
  <li>Tests rigor on base cases and indices.</li>
  <li>Distinguishes candidates who memorized solutions from those who can derive them.</li>
  <li>Mid-to-senior leetcode contests heavily feature DP; senior+ interviews follow.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You name the state explicitly: "<code>dp[i][j]</code> = min edit distance to convert prefix-of-A length i into prefix-of-B length j."</li>
  <li>You write the recurrence on paper before coding.</li>
  <li>You handle base cases first.</li>
  <li>You start with top-down (memoization) for clarity, then convert to bottom-up if asked.</li>
  <li>You quote complexity: O(states × work-per-state).</li>
  <li>You consider space optimization once correctness is proved.</li>
  <li>You don't reach for DP when greedy or simpler iteration suffices.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The 4-step DP framework</h3>
<ol>
  <li><strong>Define the state.</strong> Pick parameters such that knowing them uniquely determines a subproblem's answer. Less is more — fewer parameters → smaller table → faster.</li>
  <li><strong>Write the recurrence.</strong> Express <code>f(state)</code> in terms of <code>f(smaller states)</code>. Often two cases: include vs skip; left vs right; take vs leave.</li>
  <li><strong>Define base cases.</strong> What does <code>f</code> return at the trivial states (length 0, value 0, empty input)?</li>
  <li><strong>Implement.</strong> Top-down: function with memo. Bottom-up: array filled in dependency order.</li>
</ol>

<h3>The "what's the state?" rubric</h3>
<p>Ask: "If you froze me in the middle of this problem, what would I need to know to continue?"</p>
<table>
  <thead><tr><th>Problem</th><th>State</th></tr></thead>
  <tbody>
    <tr><td>Climbing stairs</td><td><code>(step #)</code> — 1D</td></tr>
    <tr><td>House robber</td><td><code>(house #)</code> — 1D</td></tr>
    <tr><td>Coin change</td><td><code>(amount remaining)</code> — 1D</td></tr>
    <tr><td>Longest increasing subsequence</td><td><code>(end index)</code> — 1D</td></tr>
    <tr><td>Edit distance</td><td><code>(prefix-of-A length, prefix-of-B length)</code> — 2D</td></tr>
    <tr><td>0/1 Knapsack</td><td><code>(items considered, capacity remaining)</code> — 2D</td></tr>
    <tr><td>LCS</td><td><code>(prefix-of-A, prefix-of-B)</code> — 2D</td></tr>
    <tr><td>Stock with cooldown</td><td><code>(day, holding-stock?, in-cooldown?)</code> — 1D + state flags</td></tr>
    <tr><td>Word break</td><td><code>(prefix length)</code> — 1D</td></tr>
    <tr><td>Regex match</td><td><code>(string index, pattern index)</code> — 2D</td></tr>
  </tbody>
</table>

<h3>The shape catalog</h3>
<table>
  <thead><tr><th>Shape</th><th>Recognized by</th></tr></thead>
  <tbody>
    <tr><td>Linear DP (1D)</td><td>"At each step, decision based on previous step(s)" → climbing stairs, house robber, coin change.</td></tr>
    <tr><td>Grid DP (2D)</td><td>Movement on a grid; counting paths; min-cost.</td></tr>
    <tr><td>Two-string DP</td><td>Comparing two strings → LCS, edit distance, regex matching.</td></tr>
    <tr><td>Knapsack family</td><td>Pick subset of items under a constraint to optimize value.</td></tr>
    <tr><td>Interval DP</td><td>Combine sub-intervals; matrix chain multiplication, palindrome partitioning.</td></tr>
    <tr><td>Tree DP</td><td>Solve at each node based on children; tree diameter, robber-in-tree.</td></tr>
    <tr><td>Bitmask DP</td><td>Subsets as integers; traveling salesman, subset sum.</td></tr>
    <tr><td>Digit DP</td><td>Count numbers with property; digit-by-digit state.</td></tr>
    <tr><td>State machine DP</td><td>Multiple state flags per index → stock with cooldown, paint house.</td></tr>
  </tbody>
</table>

<h3>Top-down recipe</h3>
<pre><code class="language-js">const memo = new Map();

function f(state) {
  if (isBaseCase(state)) return baseAnswer;
  const key = encode(state);
  if (memo.has(key)) return memo.get(key);

  let result = COMBINE(
    f(smallerState1),
    f(smallerState2),
    // ...
  );
  memo.set(key, result);
  return result;
}
</code></pre>

<h3>Bottom-up recipe</h3>
<pre><code class="language-js">const dp = new Array(n + 1).fill(initial);

dp[0] = baseAnswer;   // fill base case(s)

for (let i = 1; i &lt;= n; i++) {
  dp[i] = COMBINE(dp[i-1], dp[i-2], ...);
}

return dp[n];
</code></pre>

<h3>Space optimization mental model</h3>
<p>If <code>dp[i]</code> depends only on <code>dp[i-1]</code> and <code>dp[i-2]</code>, you don't need an n-length array — just two variables:</p>
<pre><code class="language-js">// O(n) space
const dp = new Array(n + 1);
dp[0] = 0; dp[1] = 1;
for (let i = 2; i &lt;= n; i++) dp[i] = dp[i-1] + dp[i-2];
return dp[n];

// O(1) space — same answer
let prev2 = 0, prev1 = 1;
for (let i = 2; i &lt;= n; i++) {
  const cur = prev1 + prev2;
  prev2 = prev1;
  prev1 = cur;
}
return prev1;
</code></pre>

<h3>Why memoization makes recursion polynomial</h3>
<p>Naive recursive Fibonacci has 2^n calls. With memoization, each <code>f(i)</code> is computed once → n calls. The exponential explosion was due to <em>repeating the same subproblem</em>; memoization caches the answer.</p>

<h3>The "decision tree → recurrence" mental shift</h3>
<p>Many DP problems are "at each step, choose A or B." Brute-force backtracking enumerates all combinations (exponential). DP collapses repeated states into one computation. The same problem with different framings:</p>
<pre><code class="language-text">"Should I include item i in the knapsack?"
   Backtracking: try both, recurse.
   DP: same call f(i, capacity) seen many times → memoize → O(n × capacity).
</code></pre>

<h3>The "include vs skip" pattern</h3>
<p>Most DP problems boil down to a binary decision at each step:</p>
<pre><code class="language-text">f(i) = max(
  CASE_INCLUDE: value_of_i + f(prev_state_after_including),
  CASE_SKIP:    f(prev_state_after_skipping)
)
</code></pre>
<p>Knapsack, house robber, LIS, stock-buy-sell — all variations.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Climbing Stairs (the canonical first example)</h3>
<pre><code class="language-js">// You climb a staircase with n steps. Each step you can go 1 or 2 stairs.
// How many distinct ways?

// Recurrence: ways(n) = ways(n-1) + ways(n-2)
// Base: ways(0) = 1, ways(1) = 1

// Top-down
function climbStairs(n, memo = new Map()) {
  if (n &lt;= 1) return 1;
  if (memo.has(n)) return memo.get(n);
  const result = climbStairs(n - 1, memo) + climbStairs(n - 2, memo);
  memo.set(n, result);
  return result;
}

// Bottom-up
function climbStairs(n) {
  if (n &lt;= 1) return 1;
  const dp = new Array(n + 1);
  dp[0] = 1; dp[1] = 1;
  for (let i = 2; i &lt;= n; i++) dp[i] = dp[i-1] + dp[i-2];
  return dp[n];
}

// Space-optimized (O(1))
function climbStairs(n) {
  let prev2 = 1, prev1 = 1;
  for (let i = 2; i &lt;= n; i++) {
    const cur = prev1 + prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}
</code></pre>

<h3>House Robber</h3>
<pre><code class="language-js">// Given houses with values, rob max value such that no two adjacent are robbed.

// State: dp[i] = max money from first i houses
// Recurrence: dp[i] = max(dp[i-1], dp[i-2] + nums[i])
// Base: dp[0] = nums[0], dp[1] = max(nums[0], nums[1])

function rob(nums) {
  const n = nums.length;
  if (n === 0) return 0;
  if (n === 1) return nums[0];
  let prev2 = nums[0];
  let prev1 = Math.max(nums[0], nums[1]);
  for (let i = 2; i &lt; n; i++) {
    const cur = Math.max(prev1, prev2 + nums[i]);
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}
</code></pre>

<h3>Coin Change (min coins to reach amount)</h3>
<pre><code class="language-js">// State: dp[a] = min coins to make amount a
// Recurrence: dp[a] = 1 + min(dp[a - coin]) for each coin if a - coin &gt;= 0
// Base: dp[0] = 0
// Answer: dp[amount] or -1 if Infinity

function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a &lt;= amount; a++) {
    for (const coin of coins) {
      if (a - coin &gt;= 0) dp[a] = Math.min(dp[a], dp[a - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
// Time O(amount * coins.length); space O(amount)
</code></pre>

<h3>Longest Increasing Subsequence</h3>
<pre><code class="language-js">// State: dp[i] = length of LIS ending at i
// Recurrence: dp[i] = 1 + max(dp[j]) for j &lt; i where nums[j] &lt; nums[i]
// Answer: max(dp)

function lengthOfLIS(nums) {
  const n = nums.length;
  if (n === 0) return 0;
  const dp = new Array(n).fill(1);
  for (let i = 1; i &lt; n; i++) {
    for (let j = 0; j &lt; i; j++) {
      if (nums[j] &lt; nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
  }
  return Math.max(...dp);
}
// O(n²) time, O(n) space.

// O(n log n) with binary search:
function lengthOfLIS(nums) {
  const tails = [];
  for (const x of nums) {
    let lo = 0, hi = tails.length;
    while (lo &lt; hi) {
      const mid = (lo + hi) &gt;&gt; 1;
      if (tails[mid] &lt; x) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = x;
  }
  return tails.length;
}
</code></pre>

<h3>Edit Distance (Levenshtein)</h3>
<pre><code class="language-js">// State: dp[i][j] = min ops to convert word1[0..i-1] to word2[0..j-1]
// Recurrence:
//   if last chars equal: dp[i][j] = dp[i-1][j-1]
//   else: dp[i][j] = 1 + min(
//     dp[i-1][j],     // delete from word1
//     dp[i][j-1],     // insert into word1
//     dp[i-1][j-1]    // substitute
//   )
// Base: dp[0][j] = j (insert j chars), dp[i][0] = i (delete i chars)

function minDistance(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, () =&gt; new Array(n + 1).fill(0));
  for (let i = 0; i &lt;= m; i++) dp[i][0] = i;
  for (let j = 0; j &lt;= n; j++) dp[0][j] = j;
  for (let i = 1; i &lt;= m; i++) {
    for (let j = 1; j &lt;= n; j++) {
      if (word1[i-1] === word2[j-1]) {
        dp[i][j] = dp[i-1][j-1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
  }
  return dp[m][n];
}
// O(m * n) time and space; can be O(min(m, n)) space with rolling array
</code></pre>

<h3>Longest Common Subsequence (LCS)</h3>
<pre><code class="language-js">// State: dp[i][j] = LCS of word1[0..i-1], word2[0..j-1]
// Recurrence:
//   if last chars equal: dp[i][j] = 1 + dp[i-1][j-1]
//   else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])

function longestCommonSubsequence(s1, s2) {
  const m = s1.length, n = s2.length;
  const dp = Array.from({ length: m + 1 }, () =&gt; new Array(n + 1).fill(0));
  for (let i = 1; i &lt;= m; i++) {
    for (let j = 1; j &lt;= n; j++) {
      if (s1[i-1] === s2[j-1]) dp[i][j] = 1 + dp[i-1][j-1];
      else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}
</code></pre>

<h3>0/1 Knapsack</h3>
<pre><code class="language-js">// items: { weight, value }; capacity W
// State: dp[i][w] = max value using first i items with capacity w
// Recurrence:
//   dp[i][w] = max(
//     dp[i-1][w],                                      // skip item i
//     dp[i-1][w - items[i-1].weight] + items[i-1].value // take item i (if fits)
//   )

function knapsack(items, W) {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () =&gt; new Array(W + 1).fill(0));
  for (let i = 1; i &lt;= n; i++) {
    for (let w = 0; w &lt;= W; w++) {
      dp[i][w] = dp[i-1][w];
      if (items[i-1].weight &lt;= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i-1][w - items[i-1].weight] + items[i-1].value);
      }
    }
  }
  return dp[n][W];
}

// Space-optimized O(W):
function knapsack(items, W) {
  const dp = new Array(W + 1).fill(0);
  for (const { weight, value } of items) {
    for (let w = W; w &gt;= weight; w--) {   // iterate descending to avoid reuse
      dp[w] = Math.max(dp[w], dp[w - weight] + value);
    }
  }
  return dp[W];
}
</code></pre>

<h3>Unbounded Knapsack (each item infinitely available)</h3>
<pre><code class="language-js">// Iterate ascending so we CAN reuse
function unboundedKnapsack(items, W) {
  const dp = new Array(W + 1).fill(0);
  for (const { weight, value } of items) {
    for (let w = weight; w &lt;= W; w++) {
      dp[w] = Math.max(dp[w], dp[w - weight] + value);
    }
  }
  return dp[W];
}
</code></pre>

<h3>Word Break</h3>
<pre><code class="language-js">// State: dp[i] = can s[0..i-1] be broken into words from dict
// Recurrence: dp[i] = OR over j &lt; i where s[j..i-1] in dict and dp[j] is true
function wordBreak(s, wordDict) {
  const set = new Set(wordDict);
  const n = s.length;
  const dp = new Array(n + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i &lt;= n; i++) {
    for (let j = 0; j &lt; i; j++) {
      if (dp[j] &amp;&amp; set.has(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[n];
}
</code></pre>

<h3>Unique Paths in Grid</h3>
<pre><code class="language-js">// State: dp[i][j] = paths from (0,0) to (i,j)
// Recurrence: dp[i][j] = dp[i-1][j] + dp[i][j-1]
// Base: dp[0][*] = 1; dp[*][0] = 1

function uniquePaths(m, n) {
  const dp = Array.from({ length: m }, () =&gt; new Array(n).fill(1));
  for (let i = 1; i &lt; m; i++) {
    for (let j = 1; j &lt; n; j++) {
      dp[i][j] = dp[i-1][j] + dp[i][j-1];
    }
  }
  return dp[m-1][n-1];
}

// O(n) space:
function uniquePaths(m, n) {
  const dp = new Array(n).fill(1);
  for (let i = 1; i &lt; m; i++) {
    for (let j = 1; j &lt; n; j++) {
      dp[j] = dp[j] + dp[j-1];
    }
  }
  return dp[n-1];
}
</code></pre>

<h3>Min Path Sum (grid)</h3>
<pre><code class="language-js">function minPathSum(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = Array.from({ length: m }, () =&gt; new Array(n).fill(0));
  dp[0][0] = grid[0][0];
  for (let i = 1; i &lt; m; i++) dp[i][0] = dp[i-1][0] + grid[i][0];
  for (let j = 1; j &lt; n; j++) dp[0][j] = dp[0][j-1] + grid[0][j];
  for (let i = 1; i &lt; m; i++) {
    for (let j = 1; j &lt; n; j++) {
      dp[i][j] = grid[i][j] + Math.min(dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m-1][n-1];
}
</code></pre>

<h3>State machine DP — Best Time to Buy/Sell Stock with Cooldown</h3>
<pre><code class="language-js">// At each day, you're in one of 3 states:
//   held — you currently hold a stock
//   sold — you just sold today (entering cooldown)
//   rest — you're idle (can buy next day)

function maxProfit(prices) {
  let held = -Infinity, sold = 0, rest = 0;
  for (const p of prices) {
    const prevSold = sold;
    sold = held + p;
    held = Math.max(held, rest - p);
    rest = Math.max(rest, prevSold);
  }
  return Math.max(sold, rest);
}
// O(n) time, O(1) space; the "states" are flags per day
</code></pre>

<h3>Longest Palindromic Substring (interval DP)</h3>
<pre><code class="language-js">// State: dp[i][j] = is s[i..j] a palindrome?
// Recurrence: dp[i][j] = (s[i] === s[j]) AND (j - i &lt; 3 OR dp[i+1][j-1])

function longestPalindrome(s) {
  const n = s.length;
  if (n &lt; 2) return s;
  const dp = Array.from({ length: n }, () =&gt; new Array(n).fill(false));
  let start = 0, maxLen = 1;
  for (let i = 0; i &lt; n; i++) dp[i][i] = true;
  for (let len = 2; len &lt;= n; len++) {
    for (let i = 0; i &lt;= n - len; i++) {
      const j = i + len - 1;
      if (s[i] === s[j] &amp;&amp; (len === 2 || dp[i+1][j-1])) {
        dp[i][j] = true;
        if (len &gt; maxLen) {
          maxLen = len;
          start = i;
        }
      }
    }
  }
  return s.substring(start, start + maxLen);
}
</code></pre>

<h3>Tree DP — House Robber III</h3>
<pre><code class="language-js">// At each node, return [robThis, skipThis]
//   robThis = node.val + skipLeft + skipRight
//   skipThis = max(robLeft, skipLeft) + max(robRight, skipRight)

function rob(root) {
  function go(node) {
    if (!node) return [0, 0];
    const [robL, skipL] = go(node.left);
    const [robR, skipR] = go(node.right);
    const robThis = node.val + skipL + skipR;
    const skipThis = Math.max(robL, skipL) + Math.max(robR, skipR);
    return [robThis, skipThis];
  }
  return Math.max(...go(root));
}
</code></pre>

<h3>Bitmask DP — Traveling Salesman (small N)</h3>
<pre><code class="language-js">// State: dp[mask][i] = min cost to visit cities in mask, ending at i
// O(2^n * n²)

function tsp(dist) {
  const n = dist.length;
  const FULL = (1 &lt;&lt; n) - 1;
  const dp = Array.from({ length: 1 &lt;&lt; n }, () =&gt; new Array(n).fill(Infinity));
  dp[1][0] = 0;   // start at city 0

  for (let mask = 1; mask &lt;= FULL; mask++) {
    for (let i = 0; i &lt; n; i++) {
      if (!(mask &amp; (1 &lt;&lt; i))) continue;
      for (let j = 0; j &lt; n; j++) {
        if (mask &amp; (1 &lt;&lt; j)) continue;
        const next = mask | (1 &lt;&lt; j);
        dp[next][j] = Math.min(dp[next][j], dp[mask][i] + dist[i][j]);
      }
    }
  }

  let best = Infinity;
  for (let i = 1; i &lt; n; i++) best = Math.min(best, dp[FULL][i] + dist[i][0]);
  return best;
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Partition Equal Subset Sum</h3>
<pre><code class="language-js">// Given an array, can it be partitioned into two subsets with equal sum?
// Reduces to: subset sum = total / 2

function canPartition(nums) {
  const sum = nums.reduce((a, b) =&gt; a + b, 0);
  if (sum % 2) return false;
  const target = sum / 2;
  const dp = new Array(target + 1).fill(false);
  dp[0] = true;
  for (const x of nums) {
    for (let s = target; s &gt;= x; s--) {
      dp[s] = dp[s] || dp[s - x];
    }
  }
  return dp[target];
}
</code></pre>

<h3>Example 2: Decode Ways</h3>
<pre><code class="language-js">// "12" → "AB" or "L"; how many decodings of digit string s?

function numDecodings(s) {
  const n = s.length;
  if (n === 0 || s[0] === '0') return 0;
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1;
  for (let i = 2; i &lt;= n; i++) {
    if (s[i-1] !== '0') dp[i] += dp[i-1];
    const two = parseInt(s.substring(i-2, i));
    if (two &gt;= 10 &amp;&amp; two &lt;= 26) dp[i] += dp[i-2];
  }
  return dp[n];
}
</code></pre>

<h3>Example 3: Maximum Subarray (Kadane's)</h3>
<pre><code class="language-js">// Kadane's algorithm — DP at its simplest
// State: dp[i] = max subarray sum ending at i
// Recurrence: dp[i] = max(nums[i], dp[i-1] + nums[i])

function maxSubArray(nums) {
  let curMax = nums[0], best = nums[0];
  for (let i = 1; i &lt; nums.length; i++) {
    curMax = Math.max(nums[i], curMax + nums[i]);
    best = Math.max(best, curMax);
  }
  return best;
}
</code></pre>

<h3>Example 4: Maximum Product Subarray</h3>
<pre><code class="language-js">// Need to track BOTH max and min ending at i (negative * negative = positive)
function maxProduct(nums) {
  let curMax = nums[0], curMin = nums[0], best = nums[0];
  for (let i = 1; i &lt; nums.length; i++) {
    const c1 = curMax * nums[i];
    const c2 = curMin * nums[i];
    curMax = Math.max(nums[i], c1, c2);
    curMin = Math.min(nums[i], c1, c2);
    best = Math.max(best, curMax);
  }
  return best;
}
</code></pre>

<h3>Example 5: Combination Sum IV (count permutations)</h3>
<pre><code class="language-js">// Count number of ordered combinations summing to target
// State: dp[t] = number of ways to reach sum t
// Order of loops matters: for each amount, try every coin

function combinationSum4(nums, target) {
  const dp = new Array(target + 1).fill(0);
  dp[0] = 1;
  for (let t = 1; t &lt;= target; t++) {
    for (const x of nums) {
      if (t - x &gt;= 0) dp[t] += dp[t - x];
    }
  }
  return dp[target];
}

// Compare with Combination Sum (unordered count): for each num outer loop, then sum
</code></pre>

<h3>Example 6: Best Time to Buy/Sell Stock (k transactions)</h3>
<pre><code class="language-js">// State: dp[i][j][0/1] = max profit at day i, with j transactions done, holding (1) or not (0)
// Recurrence:
//   dp[i][j][0] = max(dp[i-1][j][0], dp[i-1][j][1] + price[i])
//   dp[i][j][1] = max(dp[i-1][j][1], dp[i-1][j-1][0] - price[i])

function maxProfit(k, prices) {
  const n = prices.length;
  if (n === 0) return 0;
  if (k &gt;= n / 2) {
    // Equivalent to unlimited transactions — Kadane-style
    let total = 0;
    for (let i = 1; i &lt; n; i++) total += Math.max(0, prices[i] - prices[i-1]);
    return total;
  }

  const dp = Array.from({ length: k + 1 }, () =&gt; [0, -Infinity]);
  for (const p of prices) {
    for (let j = k; j &gt;= 1; j--) {
      dp[j][0] = Math.max(dp[j][0], dp[j][1] + p);
      dp[j][1] = Math.max(dp[j][1], dp[j-1][0] - p);
    }
  }
  return dp[k][0];
}
</code></pre>

<h3>Example 7: Regular Expression Matching</h3>
<pre><code class="language-js">// Match s against pattern p with '.' (any char) and '*' (0+ of prev)
// State: dp[i][j] = does s[0..i-1] match p[0..j-1]?

function isMatch(s, p) {
  const m = s.length, n = p.length;
  const dp = Array.from({ length: m + 1 }, () =&gt; new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j &lt;= n; j++) {
    if (p[j-1] === '*') dp[0][j] = dp[0][j-2];
  }
  for (let i = 1; i &lt;= m; i++) {
    for (let j = 1; j &lt;= n; j++) {
      if (p[j-1] === '*') {
        dp[i][j] = dp[i][j-2];   // 0 of prev
        if (p[j-2] === '.' || p[j-2] === s[i-1]) {
          dp[i][j] = dp[i][j] || dp[i-1][j];   // 1+ of prev
        }
      } else if (p[j-1] === '.' || p[j-1] === s[i-1]) {
        dp[i][j] = dp[i-1][j-1];
      }
    }
  }
  return dp[m][n];
}
</code></pre>

<h3>Example 8: Longest Common Subsequence variant — Longest Palindromic Subsequence</h3>
<pre><code class="language-js">// LPS = LCS(s, reverse(s))
function longestPalindromeSubseq(s) {
  const t = s.split('').reverse().join('');
  return longestCommonSubsequence(s, t);
}
</code></pre>

<h3>Example 9: Burst Balloons (interval DP)</h3>
<pre><code class="language-js">// Given balloons with values, burst them in some order; coins gained = left * cur * right
// (boundary balloons are 1)
// State: dp[i][j] = max coins from bursting all balloons strictly between i and j (boundaries left)
// Recurrence: dp[i][j] = max over k of (nums[i] * nums[k] * nums[j] + dp[i][k] + dp[k][j])

function maxCoins(nums) {
  const padded = [1, ...nums, 1];
  const n = padded.length;
  const dp = Array.from({ length: n }, () =&gt; new Array(n).fill(0));
  for (let len = 2; len &lt; n; len++) {
    for (let i = 0; i + len &lt; n; i++) {
      const j = i + len;
      for (let k = i + 1; k &lt; j; k++) {
        dp[i][j] = Math.max(dp[i][j], padded[i] * padded[k] * padded[j] + dp[i][k] + dp[k][j]);
      }
    }
  }
  return dp[0][n-1];
}
</code></pre>

<h3>Example 10: Egg Drop (advanced 2D DP)</h3>
<pre><code class="language-js">// k eggs, n floors. Find min number of attempts to determine the highest safe floor.
// State: dp[k][n] = min attempts
// Recurrence: dp[k][n] = 1 + min over x of max(dp[k-1][x-1], dp[k][n-x])
// O(k * n²) — for n large, use optimized O(k * n) version with binary search on x

function superEggDrop(k, n) {
  // Equivalent formulation: dp[k][m] = max floors we can check with k eggs and m moves
  // Find smallest m such that dp[k][m] &gt;= n
  const dp = new Array(k + 1).fill(0);
  let m = 0;
  while (dp[k] &lt; n) {
    m++;
    for (let i = k; i &gt;= 1; i--) {
      dp[i] = dp[i] + dp[i-1] + 1;   // +1 for the current floor
    }
  }
  return m;
}
</code></pre>

<h3>Example 11: Word Break II (memoized backtracking)</h3>
<pre><code class="language-js">function wordBreak(s, wordDict) {
  const set = new Set(wordDict);
  const memo = new Map();
  function go(start) {
    if (memo.has(start)) return memo.get(start);
    if (start === s.length) return [''];
    const out = [];
    for (let end = start + 1; end &lt;= s.length; end++) {
      const word = s.substring(start, end);
      if (!set.has(word)) continue;
      for (const tail of go(end)) {
        out.push(tail ? \`\${word} \${tail}\` : word);
      }
    }
    memo.set(start, out);
    return out;
  }
  return go(0);
}
</code></pre>

<h3>Example 12: Minimum Insertions to Make Palindrome</h3>
<pre><code class="language-js">// Min insertions = length - LPS(s)
// (LPS is the longest palindromic subsequence; the rest needs mirroring)

function minInsertions(s) {
  return s.length - longestPalindromeSubseq(s);
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Off-by-one in array indexing</h3>
<p>Most DP problems use a (n+1)-length dp array where <code>dp[0]</code> is the base case. Confusing <code>dp[i]</code> with <code>nums[i-1]</code> is the most frequent bug. Stay consistent with one convention throughout.</p>

<h3>Wrong base case</h3>
<pre><code class="language-js">// House robber: what's dp[1]?
// Wrong: dp[1] = nums[1]
// Right: dp[1] = max(nums[0], nums[1])
// Reason: dp[1] is "max from first 2 houses (indices 0 and 1)"
</code></pre>

<h3>Iteration order</h3>
<p>For 0/1 knapsack with O(W) space, you must iterate <code>w</code> descending — otherwise you'd reuse items. For unbounded knapsack, ascending — to allow reuse. Easy to mix up; verify with a tiny example.</p>

<h3>Loop order matters in two-coin DP</h3>
<pre><code class="language-js">// Combinations (order doesn't matter): outer = coin, inner = amount
for (const coin of coins) for (let a = coin; a &lt;= amount; a++) dp[a] += dp[a-coin];

// Permutations (order matters): outer = amount, inner = coin
for (let a = 1; a &lt;= amount; a++) for (const coin of coins) if (a - coin &gt;= 0) dp[a] += dp[a-coin];

// Wrong loop order silently produces wrong counts.
</code></pre>

<h3>Memoization with mutable state</h3>
<p>If your recursive function captures mutable external state, memoization breaks (same input may give different outputs). Always pass all relevant state as parameters; memoize as a function of those parameters.</p>

<h3>Hashing tuples for memo</h3>
<pre><code class="language-js">// JS Maps with array keys don't work as expected (reference equality)
const memo = new Map();
const key = \`\${i},\${j}\`;   // string key

// Or for 2D / 3D, use nested arrays of size n × m
const memo = Array.from({ length: m+1 }, () =&gt; new Array(n+1).fill(-1));
</code></pre>

<h3>Large values overflow</h3>
<p>JS numbers are 64-bit floats; safe up to 2^53. Path-counting DPs (unique paths) can grow exponentially; for big inputs use BigInt or modular arithmetic.</p>

<h3>Empty input handling</h3>
<p>Length 0: most DPs should return 0 / true / "" / Infinity (depending on the problem). Always handle explicitly:</p>
<pre><code class="language-js">if (s.length === 0) return ...;
</code></pre>

<h3>Negative numbers and DP</h3>
<p>For "max subarray sum" with all-negative input, the answer is the largest single element, not 0. Initialize <code>best</code> to <code>nums[0]</code> or <code>-Infinity</code>, not <code>0</code>.</p>

<h3>Counting "number of ways" overflows</h3>
<p>Many problems specify "modulo 10^9 + 7." Don't forget to mod at every addition:</p>
<pre><code class="language-js">const MOD = 1_000_000_007;
dp[i] = (dp[i-1] + dp[i-2]) % MOD;
</code></pre>

<h3>Recursion depth in top-down</h3>
<p>JS V8 stack is ~10,000 frames. For n up to ~5,000-10,000, top-down recursion may overflow. Convert to bottom-up or use trampolining.</p>

<h3>Memo key collisions</h3>
<pre><code class="language-js">// (i=10, j=23) and (i=102, j=3) both produce key "1023" if you naively concat
const key = \`\${i},\${j}\`;   // separator avoids collision
</code></pre>

<h3>Initial array values</h3>
<p>For min-DP, initialize to Infinity (or a very large sentinel). For max-DP, -Infinity. For boolean DP, false. For counting, 0. Wrong initial value silently produces wrong answers.</p>

<h3>Duplicate work in top-down</h3>
<p>If you forget to check the memo before recursing, you don't get the speedup. Symptom: still exponential time. Always: <code>if (memo.has(key)) return memo.get(key);</code> at the top.</p>

<h3>Multi-value memo (returning structures)</h3>
<p>If the recursive function returns a complex structure (list, object), memoization should compare and copy carefully. Tuples are easier; arrays/objects need careful key encoding.</p>

<h3>Path reconstruction</h3>
<p>DP gives you the optimal value but not the path. To reconstruct: store predecessor / decision at each state, then walk back from the answer cell. Adds O(states) memory.</p>

<h3>Floating-point DP</h3>
<p>If values are doubles, equality checks drift. Either round (multiply by 10^k and use integers) or compare with epsilon. Avoid double-DP when integer formulation exists.</p>

<h3>Iterative vs recursive correctness</h3>
<p>If your top-down works but bottom-up gives wrong answers, the conversion missed an edge case. Common: skipping the i=1 row or j=1 column in 2D DP.</p>

<h3>Order of cell filling in 2D DP</h3>
<pre><code class="language-js">// dp[i][j] depends on dp[i-1][j], dp[i][j-1], dp[i-1][j-1]
// Standard: row-major order (i outer, j inner) works.
// If your dependencies are different, you may need column-major or reverse order.
</code></pre>

<h3>State explosion</h3>
<p>If your state has 5+ dimensions, the table is huge. Consider whether some dimensions can be eliminated (often via mathematical insight) or whether the problem isn't actually DP.</p>

<h3>Greedy beats DP</h3>
<p>Some "looks like DP" problems have greedy solutions:</p>
<ul>
  <li><strong>Activity selection</strong> (intervals): sort by end-time, greedy.</li>
  <li><strong>Fractional knapsack</strong>: greedy by value/weight ratio.</li>
  <li><strong>Min number of platforms</strong>: sort starts and ends, sweep.</li>
  <li><strong>Job scheduling with deadlines</strong>: sort by profit, greedy.</li>
</ul>
<p>Don't reach for DP when greedy works.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Memoize but state is incomplete</h3>
<pre><code class="language-js">// BAD — forgot to include j in memo key
const memo = new Map();
function f(i, j) {
  if (memo.has(i)) return memo.get(i);   // wrong — different j's collide
  // ...
  memo.set(i, result);
}

// FIX
const key = \`\${i},\${j}\`;
if (memo.has(key)) return memo.get(key);
</code></pre>

<h3>Bug 2: Off-by-one between dp and nums</h3>
<pre><code class="language-js">// Convention: dp is (n+1)-length; dp[i] uses nums[i-1]
for (let i = 1; i &lt;= n; i++) {
  dp[i] = ... nums[i-1] ...;   // not nums[i]
}
</code></pre>

<h3>Bug 3: Wrong loop order</h3>
<pre><code class="language-js">// 0/1 knapsack with O(W) space MUST iterate w descending
for (let w = 0; w &lt;= W; w++) {              // ❌ allows reuse
  for (const item of items) { ... }
}
</code></pre>

<h3>Bug 4: Initial value</h3>
<pre><code class="language-js">// Min DP must start at Infinity (or a sentinel large value)
const dp = new Array(n + 1).fill(0);   // ❌ — 0 is wrong floor for min
const dp = new Array(n + 1).fill(Infinity);
dp[0] = 0;
</code></pre>

<h3>Bug 5: Mutable state captured in recursion</h3>
<pre><code class="language-js">let count = 0;
function f(i) {
  count++;             // ❌ side effect; memoization won't catch it
  // ...
}
</code></pre>

<h3>Bug 6: Forgetting to apply MOD</h3>
<pre><code class="language-js">// "Return answer mod 10^9 + 7"
const MOD = 1_000_000_007;
dp[i] = dp[i-1] + dp[i-2];        // ❌ overflow
dp[i] = (dp[i-1] + dp[i-2]) % MOD; // ✓
</code></pre>

<h3>Bug 7: Wrong base case</h3>
<pre><code class="language-js">// Climbing stairs: dp[0] = 1 (one way: do nothing)
// Many candidates write dp[0] = 0, breaking everything
</code></pre>

<h3>Bug 8: Memoizing impure function</h3>
<pre><code class="language-js">function f(i, j) {
  // reads from a global array that changes between calls
  // memoization returns stale results
}
// Either pass mutable state explicitly, or don't memoize.
</code></pre>

<h3>Bug 9: 2D DP with row index but dp is 1D</h3>
<p>You converted 2D → 1D for space optimization but forgot to update reads. <code>dp[j]</code> is now the previous row's value, not the current — be careful with iteration direction.</p>

<h3>Bug 10: Returning the wrong cell</h3>
<pre><code class="language-js">// Edit distance answer is dp[m][n], not dp[m-1][n-1] (we use 1-indexed dp)
return dp[m][n];
</code></pre>

<h3>Anti-pattern 1: DP for problems greedy solves</h3>
<p>"Activity selection" with O(n log n) sort + sweep is greedy. Don't write a quadratic DP.</p>

<h3>Anti-pattern 2: Premature space optimization</h3>
<p>Get correctness with full 2D table first; optimize space second. Reversing the order leads to bugs that are hard to debug because you can't compare against a reference.</p>

<h3>Anti-pattern 3: Top-down with deep recursion</h3>
<p>For n &gt; 5000, switch to bottom-up to avoid stack overflow. Top-down is for derivation; bottom-up is for production.</p>

<h3>Anti-pattern 4: 5+ dimensional state</h3>
<p>State <code>dp[a][b][c][d][e]</code> is almost always wrong. Either some dimensions are derivable from others, or the problem isn't DP-shaped. Re-examine.</p>

<h3>Anti-pattern 5: Memoizing without proving overlapping subproblems exist</h3>
<p>If each subproblem is unique, memoization adds overhead with no speedup. Trace the recursion tree for a small example; verify duplicates exist.</p>

<h3>Anti-pattern 6: Pretending it's DP when it's recursion</h3>
<p>Some problems have unique paths (no overlap). Memoizing them is just adding cache infrastructure for nothing. Plain recursion is the right shape.</p>

<h3>Anti-pattern 7: Building a giant table for small subproblems</h3>
<p>If only O(n) of the O(n²) cells are actually needed, sparse memoization (Map) beats a full 2D array. Smart for problems with sparse access patterns.</p>

<h3>Anti-pattern 8: Skipping "explain the state" step</h3>
<p>Coding without writing what <code>dp[i][j]</code> means is the #1 cause of subtle bugs. Verbalize: "dp[i][j] = ____, with the constraint that ____."</p>

<h3>Anti-pattern 9: Copy-pasting from memory</h3>
<p>Many candidates memorize 5 DP solutions and try to fit problems to them. Real interviews ask variants; you need to derive the recurrence, not recall it.</p>

<h3>Anti-pattern 10: Skipping examples</h3>
<p>Run your DP on a small example by hand. Fill the table. Verify. The 5 minutes you spend catches the off-by-one before the interviewer does.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 16 problems worth memorizing patterns for</h3>
<table>
  <thead><tr><th>Problem</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>Climbing Stairs</td><td>1D linear; dp[i] = dp[i-1] + dp[i-2]</td></tr>
    <tr><td>House Robber I / II / III</td><td>1D linear / circular / tree DP</td></tr>
    <tr><td>Coin Change (min) / Coin Change II (count)</td><td>1D unbounded knapsack</td></tr>
    <tr><td>Longest Increasing Subsequence</td><td>1D quadratic; or O(n log n) with binary search</td></tr>
    <tr><td>Maximum Subarray (Kadane's)</td><td>O(n) running max; track best</td></tr>
    <tr><td>Maximum Product Subarray</td><td>Track max AND min ending at i</td></tr>
    <tr><td>Edit Distance</td><td>2D string; min(insert, delete, sub)</td></tr>
    <tr><td>Longest Common Subsequence</td><td>2D string; equality vs max</td></tr>
    <tr><td>0/1 Knapsack / Partition Equal Subset Sum</td><td>2D capacity; iterate descending for O(W)</td></tr>
    <tr><td>Unique Paths / Min Path Sum</td><td>2D grid; combine dp[i-1][j] + dp[i][j-1]</td></tr>
    <tr><td>Word Break</td><td>1D over prefixes; substring lookup in dict</td></tr>
    <tr><td>Decode Ways</td><td>1D with two-digit lookback</td></tr>
    <tr><td>Best Time to Buy/Sell Stock (with cooldown / k)</td><td>State machine DP</td></tr>
    <tr><td>Longest Palindromic Substring / Subsequence</td><td>Interval DP / LCS variant</td></tr>
    <tr><td>Regular Expression Matching</td><td>2D string with '*' lookback</td></tr>
    <tr><td>Burst Balloons</td><td>Interval DP with k between i and j</td></tr>
  </tbody>
</table>

<h3>The "shape recognition" cheatsheet</h3>
<table>
  <thead><tr><th>Problem says...</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"How many ways..."</td><td>Counting DP (sum over decisions)</td></tr>
    <tr><td>"Minimum / maximum..."</td><td>Optimization DP (min/max over decisions)</td></tr>
    <tr><td>"Can it be done?"</td><td>Boolean DP (OR over decisions)</td></tr>
    <tr><td>"Longest / shortest sequence..."</td><td>Subsequence DP (LIS, LCS)</td></tr>
    <tr><td>"Optimal partition / split..."</td><td>Interval DP</td></tr>
    <tr><td>"Pick subset under constraint"</td><td>Knapsack family</td></tr>
    <tr><td>"On a grid / matrix..."</td><td>2D grid DP</td></tr>
    <tr><td>"Compare two strings"</td><td>2D string DP</td></tr>
    <tr><td>"Tree problem with optimal at each node"</td><td>Tree DP</td></tr>
    <tr><td>"N up to 20" + subsets</td><td>Bitmask DP</td></tr>
  </tbody>
</table>

<h3>The "Solve It in 4 Steps" interview move</h3>
<ol>
  <li>"Let me define the state. <code>dp[i]</code> represents... and the answer to the original problem is at <code>dp[n]</code>."</li>
  <li>"The recurrence: <code>dp[i] = ____</code>, derived from these decisions: ..."</li>
  <li>"Base cases: <code>dp[0] = ____</code> because ..."</li>
  <li>"Implementation: top-down with memoization first, then bottom-up. Time: O(states × work). Space: O(states), reducible to O(few rows) if needed."</li>
</ol>
<p>Saying this out loud signals seniority and structures the interview cleanly.</p>

<h3>Live coding warmups</h3>
<ol>
  <li>Climbing stairs (top-down + bottom-up + space-optimized).</li>
  <li>House robber.</li>
  <li>Coin change.</li>
  <li>LIS in O(n²) and O(n log n).</li>
  <li>Edit distance.</li>
  <li>0/1 knapsack with O(W) space.</li>
  <li>Word break.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Memoization not taking effect — likely incomplete state in the memo key.</li>
  <li>Off-by-one between dp and nums — fix indexing convention.</li>
  <li>0/1 knapsack reusing items — iterate <code>w</code> descending.</li>
  <li>Min DP returning 0 when no answer — initialize to Infinity.</li>
  <li>Combinations vs permutations confusion — outer-loop choice.</li>
  <li>Top-down stack overflow on large n — switch to bottom-up.</li>
  <li>Forgetting MOD in counting problems.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>State-definition rigor</td><td>You write down "dp[i][j] = ____" before coding.</td></tr>
    <tr><td>Recurrence clarity</td><td>You derive the transition with named cases.</td></tr>
    <tr><td>Base case handling</td><td>You enumerate edge cases (length 0, single element, all-negative).</td></tr>
    <tr><td>Pattern recognition</td><td>You name the family (knapsack, LIS, edit-distance) when it fits.</td></tr>
    <tr><td>Top-down / bottom-up fluency</td><td>You can convert between styles on demand.</td></tr>
    <tr><td>Space optimization</td><td>You volunteer "I can reduce to O(1) extra space because ..."</td></tr>
    <tr><td>Complexity articulation</td><td>You state O(states × work-per-state) precisely.</td></tr>
    <tr><td>Greedy awareness</td><td>You recognize when greedy beats DP and choose accordingly.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>DP rarely shows up in mobile product code, but interview-relevant for FAANG mobile loops.</li>
  <li><strong>Diff algorithms</strong> (used by React reconciliation, virtual DOM diffing) are DP-flavored.</li>
  <li><strong>Layout caching</strong> in FlatList / RecyclerView optimizes layout passes via memoization.</li>
  <li><strong>Spell check / autocomplete</strong> uses edit distance for fuzzy matching.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Top-down vs bottom-up — when to use each?"</em> — Top-down is easier to derive (just add memo to your recursive solution); bottom-up has better constants and no stack risk. Use top-down to find the recurrence, bottom-up for production.</li>
  <li><em>"Why is space optimization possible?"</em> — When dp[i] only depends on dp[i-1] (or a few previous rows), you don't need the entire history. Replace the array with rolling variables.</li>
  <li><em>"How do you reconstruct the optimal path?"</em> — Store at each state the decision that led to it (which prev cell was used). Walk back from the final cell.</li>
  <li><em>"How do you decide between top-down and bottom-up?"</em> — If most subproblems are reachable, bottom-up. If many are unreachable (sparse access), top-down avoids work. Top-down is also easier to derive when the recurrence is complex.</li>
  <li><em>"Why doesn't greedy work for 0/1 knapsack?"</em> — Greedy by value/weight ratio works for fractional knapsack but not 0/1. The greedy choice can foreclose the optimal answer because you can't split items.</li>
  <li><em>"What's the relationship between DP and Dijkstra?"</em> — Dijkstra is essentially DP on the graph: dp[v] = shortest distance from source. The priority queue determines processing order so each cell is correctly computed.</li>
</ul>

<h3>"What I'd do day one prepping for DP interviews"</h3>
<ul>
  <li>Pick 16 canonical problems (one per pattern in the table above).</li>
  <li>Solve each top-down first; then convert to bottom-up; then space-optimize.</li>
  <li>Write the state definition aloud before coding each.</li>
  <li>Trace the table by hand for a small input.</li>
  <li>Time each solve under interview pressure.</li>
  <li>Practice variants — "what if you can use each item twice?" "what if the array is circular?"</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add path reconstruction so the answer includes the chosen decisions."</li>
  <li>"I'd benchmark top-down vs bottom-up for our specific n; constants can matter at scale."</li>
  <li>"I'd extract the memoization helper into a generic <code>memoize</code> utility for reuse."</li>
  <li>"For very large states, I'd use a Map for sparse memo instead of a dense array."</li>
  <li>"I'd add input validation — the algorithm assumes positive integers; document or reject other shapes."</li>
</ul>
`
    }
  ]
});
