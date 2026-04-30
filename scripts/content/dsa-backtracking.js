window.PREP_SITE.registerTopic({
  id: 'dsa-backtracking',
  module: 'dsa',
  title: 'Backtracking',
  estimatedReadTime: '45 min',
  tags: ['backtracking', 'recursion', 'dfs', 'pruning', 'permutations', 'combinations', 'subsets', 'n-queens', 'sudoku'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Backtracking</strong> is depth-first search through a tree of partial solutions: you incrementally build a candidate, and the moment a partial choice leads to a dead end, you <em>undo</em> it ("backtrack") and try the next option. It's the standard tool for combinatorial enumeration: permutations, combinations, subsets, partitions, N-queens, Sudoku, word search, palindrome partitioning.</p>
<ul>
  <li><strong>Three-step pattern:</strong> <em>choose</em> (make a decision), <em>explore</em> (recurse), <em>unchoose</em> (undo).</li>
  <li><strong>Pruning makes it fast.</strong> Without pruning, you visit every leaf of an exponential tree. With pruning, smart bounds and constraints kill huge branches early.</li>
  <li><strong>Three classic shapes:</strong>
    <ul>
      <li>Subsets — at each step, "include or skip."</li>
      <li>Permutations — pick from remaining; track <code>used</code>.</li>
      <li>Combinations — start index advances to avoid duplicates.</li>
    </ul>
  </li>
  <li><strong>The "input has duplicates"</strong> trick: sort first, skip identical siblings at the same recursion depth.</li>
  <li><strong>Always restore state on backtrack.</strong> Mutating shared structure is fine if you undo before returning.</li>
  <li><strong>Time:</strong> exponential or factorial in problem size. Good pruning brings real-world runtime down dramatically; mathematical worst case stays scary.</li>
  <li><strong>Space:</strong> recursion stack = depth of decision tree.</li>
</ul>
<p><strong>Mantra:</strong> "Choose, explore, unchoose. Prune ruthlessly. Sort to deduplicate. Avoid copying when you can backtrack."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is backtracking?</h3>
<p>Backtracking is a refinement of brute-force depth-first search. You're searching a <em>state space</em> — a tree where each node represents a partial solution and edges are choices. You walk the tree depth-first, but at each internal node:</p>
<ol>
  <li>If the partial solution is already invalid, <strong>prune</strong> the subtree (don't recurse).</li>
  <li>If the partial solution is complete, <strong>record</strong> it and return.</li>
  <li>Otherwise, try every legal next move; before returning, <strong>undo</strong> the move.</li>
</ol>

<h3>The relation to DFS</h3>
<p>Backtracking IS DFS over a state-space tree, with two refinements:</p>
<ul>
  <li>The tree is usually <em>implicit</em> (constructed on the fly from rules), not explicit.</li>
  <li>You actively <em>prune</em> impossible subtrees and <em>undo</em> work between siblings.</li>
</ul>
<p>If your DFS is on a graph (cycles, fixed structure) and tracks visited, that's "DFS." If it explores all configurations and undoes choices, that's "backtracking."</p>

<h3>Where backtracking shines</h3>
<table>
  <thead><tr><th>Problem class</th><th>Why backtrack?</th></tr></thead>
  <tbody>
    <tr><td>All permutations / combinations / subsets</td><td>Need to enumerate every configuration; tree of choices is natural.</td></tr>
    <tr><td>Constraint satisfaction (N-queens, Sudoku)</td><td>Constraints prune huge branches early; brute force is hopeless.</td></tr>
    <tr><td>Path / word search in grids</td><td>Need to mark visited, recurse, unmark.</td></tr>
    <tr><td>Partitioning (palindrome partitioning, integer partitioning)</td><td>Combinatorial; choose a split, recurse on remainder, undo.</td></tr>
    <tr><td>Decision-tree problems with rollback</td><td>"Try this; if it fails, try that."</td></tr>
  </tbody>
</table>

<h3>When to NOT backtrack</h3>
<ul>
  <li><strong>Optimization with overlapping subproblems.</strong> That's dynamic programming; memoize instead of re-explore.</li>
  <li><strong>Single-answer problems with greedy structure.</strong> You don't need full enumeration — pick the locally best.</li>
  <li><strong>Counting problems where DP can compute the count directly.</strong> Don't enumerate to count.</li>
  <li><strong>Inputs large enough that even pruned exponential is too slow.</strong> Switch to DP, math, or approximation.</li>
</ul>

<h3>Why interviewers test it</h3>
<ol>
  <li>Recursion fluency under pressure.</li>
  <li>Pruning awareness — separates "can write code" from "can write fast code."</li>
  <li>State management discipline — restoring shared structures correctly.</li>
  <li>Pattern recognition — distinguishing subsets vs permutations vs combinations vs partitioning.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You name the problem shape (subset / permutation / combination / partition) before coding.</li>
  <li>You write the three-step structure: choose, explore, unchoose.</li>
  <li>You add pruning conditions explicitly with comments.</li>
  <li>You handle the duplicate-input case via sort + skip.</li>
  <li>You don't deep-copy state when backtracking can undo cheaper.</li>
  <li>You quote complexity in terms of the problem size (e.g., O(N · N!) for permutations of N).</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The state-space tree</h3>
<p>Visualize the search as a tree:</p>
<ul>
  <li>Root: empty partial solution.</li>
  <li>Each level corresponds to "the next decision to make."</li>
  <li>Each branch corresponds to one choice for that decision.</li>
  <li>Leaves: complete solutions (or dead ends pruned early).</li>
</ul>
<pre><code class="language-text">Subsets of [1, 2, 3]:

                  []
              /        \\
          [1]            []
         /   \\          /   \\
       [1,2]  [1]    [2]     []
       / \\    / \\    / \\    / \\
   [1,2,3][1,2][1,3][1][2,3][2][3][]
</code></pre>

<h3>Three problem shapes</h3>
<table>
  <thead><tr><th>Shape</th><th>Choice at each step</th><th>State to track</th></tr></thead>
  <tbody>
    <tr><td>Subsets</td><td>Include or skip the next element</td><td>Index, current subset</td></tr>
    <tr><td>Permutations</td><td>Pick any unused element</td><td><code>used</code> bitmask / set, current permutation</td></tr>
    <tr><td>Combinations (size K)</td><td>Pick any element ≥ start</td><td>Start index, current combination</td></tr>
    <tr><td>Partitions</td><td>Pick a split point</td><td>Index, current partition list</td></tr>
  </tbody>
</table>

<h3>The "choose / explore / unchoose" template</h3>
<pre><code class="language-js">function backtrack(state) {
  if (isComplete(state)) {
    record(state);
    return;
  }
  for (const choice of validChoices(state)) {
    apply(state, choice);          // choose
    backtrack(state);              // explore
    revert(state, choice);         // unchoose
  }
}
</code></pre>

<h3>Pruning categories</h3>
<table>
  <thead><tr><th>Type</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Constraint check</td><td>Can't place queen in attacked column → skip</td></tr>
    <tr><td>Bound check</td><td>Current sum already &gt; target → return</td></tr>
    <tr><td>Duplicate skip</td><td><code>if (i &gt; start &amp;&amp; nums[i] === nums[i-1]) continue;</code></td></tr>
    <tr><td>Dead-end propagation</td><td>If recursive call returned "no solution," abandon this choice</td></tr>
    <tr><td>Symmetry breaking</td><td>Only consider the first queen in left-half columns; mirror solutions</td></tr>
  </tbody>
</table>

<h3>The duplicate-input trick</h3>
<pre><code class="language-js">// nums = [1, 2, 2, 3]
// Without skip: produces [1,2,3] twice (once via index 1, once via index 2)
nums.sort((a, b) =&gt; a - b);
function backtrack(start, path) {
  out.push([...path]);
  for (let i = start; i &lt; nums.length; i++) {
    if (i &gt; start &amp;&amp; nums[i] === nums[i - 1]) continue;   // skip duplicate
    path.push(nums[i]);
    backtrack(i + 1, path);
    path.pop();
  }
}
</code></pre>
<p>The condition <code>i &gt; start</code> is critical: it allows duplicates to be picked at <em>different</em> recursion depths but skips them as <em>siblings</em> at the same depth.</p>

<h3>Path mutation vs immutable accumulator</h3>
<pre><code class="language-js">// Mutate-and-undo (cheap, idiomatic)
function bt(path) {
  out.push([...path]);   // copy when recording
  for (...) {
    path.push(x);
    bt(path);
    path.pop();
  }
}

// Pass new array each call (more memory, sometimes clearer)
function bt(path) {
  out.push(path);
  for (...) bt([...path, x]);
}
</code></pre>
<p>The first is faster — only the final result needs copying. Always copy <em>at the recording moment</em>; never store a reference to a mutated path.</p>

<h3>The complexity rule of thumb</h3>
<table>
  <thead><tr><th>Problem</th><th>Worst case</th></tr></thead>
  <tbody>
    <tr><td>Subsets of N elements</td><td>O(N · 2^N)</td></tr>
    <tr><td>Permutations of N elements</td><td>O(N · N!)</td></tr>
    <tr><td>Combinations C(N, K)</td><td>O(K · C(N, K))</td></tr>
    <tr><td>N-queens</td><td>O(N!) without pruning; ~O(N²·something) with pruning</td></tr>
    <tr><td>Sudoku</td><td>Worst case exponential; well-pruned implementations finish ms-fast</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Subsets — the canonical pattern</h3>
<pre><code class="language-js">function subsets(nums) {
  const out = [];
  const path = [];
  function bt(start) {
    out.push([...path]);
    for (let i = start; i &lt; nums.length; i++) {
      path.push(nums[i]);
      bt(i + 1);
      path.pop();
    }
  }
  bt(0);
  return out;
}
</code></pre>

<h3>Subsets II — handle duplicates</h3>
<pre><code class="language-js">function subsetsWithDup(nums) {
  nums.sort((a, b) =&gt; a - b);
  const out = [];
  const path = [];
  function bt(start) {
    out.push([...path]);
    for (let i = start; i &lt; nums.length; i++) {
      if (i &gt; start &amp;&amp; nums[i] === nums[i - 1]) continue;
      path.push(nums[i]);
      bt(i + 1);
      path.pop();
    }
  }
  bt(0);
  return out;
}
</code></pre>

<h3>Permutations — unique elements</h3>
<pre><code class="language-js">function permute(nums) {
  const out = [];
  const path = [];
  const used = new Array(nums.length).fill(false);
  function bt() {
    if (path.length === nums.length) {
      out.push([...path]);
      return;
    }
    for (let i = 0; i &lt; nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      bt();
      path.pop();
      used[i] = false;
    }
  }
  bt();
  return out;
}
</code></pre>

<h3>Permutations II — duplicates</h3>
<pre><code class="language-js">function permuteUnique(nums) {
  nums.sort((a, b) =&gt; a - b);
  const out = [];
  const path = [];
  const used = new Array(nums.length).fill(false);
  function bt() {
    if (path.length === nums.length) {
      out.push([...path]);
      return;
    }
    for (let i = 0; i &lt; nums.length; i++) {
      if (used[i]) continue;
      // Skip duplicate that would produce the same permutation
      // Pick equal elements only in their original order
      if (i &gt; 0 &amp;&amp; nums[i] === nums[i - 1] &amp;&amp; !used[i - 1]) continue;
      used[i] = true;
      path.push(nums[i]);
      bt();
      path.pop();
      used[i] = false;
    }
  }
  bt();
  return out;
}
</code></pre>

<h3>Combinations C(n, k)</h3>
<pre><code class="language-js">function combine(n, k) {
  const out = [];
  const path = [];
  function bt(start) {
    if (path.length === k) {
      out.push([...path]);
      return;
    }
    // Pruning: stop early if remaining slots can't be filled
    const need = k - path.length;
    const limit = n - need + 1;
    for (let i = start; i &lt;= limit; i++) {
      path.push(i);
      bt(i + 1);
      path.pop();
    }
  }
  bt(1);
  return out;
}
</code></pre>

<h3>Combination Sum (unlimited reuse)</h3>
<pre><code class="language-js">function combinationSum(candidates, target) {
  candidates.sort((a, b) =&gt; a - b);
  const out = [];
  const path = [];
  function bt(start, remaining) {
    if (remaining === 0) { out.push([...path]); return; }
    for (let i = start; i &lt; candidates.length; i++) {
      if (candidates[i] &gt; remaining) break;   // pruning (sorted)
      path.push(candidates[i]);
      bt(i, remaining - candidates[i]);       // i, not i+1 → reuse
      path.pop();
    }
  }
  bt(0, target);
  return out;
}
</code></pre>

<h3>Combination Sum II (each used once, with duplicates)</h3>
<pre><code class="language-js">function combinationSum2(candidates, target) {
  candidates.sort((a, b) =&gt; a - b);
  const out = [];
  const path = [];
  function bt(start, remaining) {
    if (remaining === 0) { out.push([...path]); return; }
    for (let i = start; i &lt; candidates.length; i++) {
      if (candidates[i] &gt; remaining) break;
      if (i &gt; start &amp;&amp; candidates[i] === candidates[i - 1]) continue;
      path.push(candidates[i]);
      bt(i + 1, remaining - candidates[i]);
      path.pop();
    }
  }
  bt(0, target);
  return out;
}
</code></pre>

<h3>N-queens</h3>
<pre><code class="language-js">function solveNQueens(n) {
  const out = [];
  const cols = new Set();
  const diag1 = new Set();   // r - c
  const diag2 = new Set();   // r + c
  const queens = new Array(n).fill(-1);

  function bt(r) {
    if (r === n) {
      const board = queens.map(c =&gt; '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1));
      out.push(board);
      return;
    }
    for (let c = 0; c &lt; n; c++) {
      if (cols.has(c) || diag1.has(r - c) || diag2.has(r + c)) continue;
      queens[r] = c;
      cols.add(c); diag1.add(r - c); diag2.add(r + c);
      bt(r + 1);
      cols.delete(c); diag1.delete(r - c); diag2.delete(r + c);
    }
  }
  bt(0);
  return out;
}
</code></pre>

<h3>Word Search (grid)</h3>
<pre><code class="language-js">function exist(board, word) {
  const m = board.length, n = board[0].length;
  function bt(r, c, idx) {
    if (idx === word.length) return true;
    if (r &lt; 0 || c &lt; 0 || r &gt;= m || c &gt;= n) return false;
    if (board[r][c] !== word[idx]) return false;
    const tmp = board[r][c];
    board[r][c] = '#';   // mark visited
    const found = bt(r+1, c, idx+1) || bt(r-1, c, idx+1) || bt(r, c+1, idx+1) || bt(r, c-1, idx+1);
    board[r][c] = tmp;   // undo
    return found;
  }
  for (let r = 0; r &lt; m; r++)
    for (let c = 0; c &lt; n; c++)
      if (bt(r, c, 0)) return true;
  return false;
}
</code></pre>

<h3>Palindrome Partitioning</h3>
<pre><code class="language-js">function partition(s) {
  const out = [];
  const path = [];
  function isPalin(l, r) {
    while (l &lt; r) { if (s[l++] !== s[r--]) return false; }
    return true;
  }
  function bt(start) {
    if (start === s.length) { out.push([...path]); return; }
    for (let end = start; end &lt; s.length; end++) {
      if (isPalin(start, end)) {
        path.push(s.slice(start, end + 1));
        bt(end + 1);
        path.pop();
      }
    }
  }
  bt(0);
  return out;
}
</code></pre>

<h3>Sudoku Solver</h3>
<pre><code class="language-js">function solveSudoku(board) {
  function isValid(r, c, ch) {
    for (let i = 0; i &lt; 9; i++) {
      if (board[r][i] === ch) return false;
      if (board[i][c] === ch) return false;
      const br = 3 * Math.floor(r / 3) + Math.floor(i / 3);
      const bc = 3 * Math.floor(c / 3) + (i % 3);
      if (board[br][bc] === ch) return false;
    }
    return true;
  }
  function bt() {
    for (let r = 0; r &lt; 9; r++) {
      for (let c = 0; c &lt; 9; c++) {
        if (board[r][c] !== '.') continue;
        for (let ch = 1; ch &lt;= 9; ch++) {
          const s = String(ch);
          if (isValid(r, c, s)) {
            board[r][c] = s;
            if (bt()) return true;
            board[r][c] = '.';
          }
        }
        return false;
      }
    }
    return true;
  }
  bt();
}
</code></pre>

<h3>Generate Parentheses</h3>
<pre><code class="language-js">function generateParenthesis(n) {
  const out = [];
  function bt(s, open, close) {
    if (s.length === 2 * n) { out.push(s); return; }
    if (open &lt; n) bt(s + '(', open + 1, close);
    if (close &lt; open) bt(s + ')', open, close + 1);
  }
  bt('', 0, 0);
  return out;
}
</code></pre>

<h3>Letter Combinations of a Phone Number</h3>
<pre><code class="language-js">function letterCombinations(digits) {
  if (!digits) return [];
  const map = { 2:'abc', 3:'def', 4:'ghi', 5:'jkl', 6:'mno', 7:'pqrs', 8:'tuv', 9:'wxyz' };
  const out = [];
  function bt(idx, path) {
    if (idx === digits.length) { out.push(path); return; }
    for (const ch of map[digits[idx]]) bt(idx + 1, path + ch);
  }
  bt(0, '');
  return out;
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Restore IP Addresses</h3>
<pre><code class="language-js">function restoreIpAddresses(s) {
  const out = [];
  function isValid(seg) {
    if (seg.length === 0 || seg.length &gt; 3) return false;
    if (seg[0] === '0' &amp;&amp; seg.length &gt; 1) return false;
    return Number(seg) &lt;= 255;
  }
  function bt(idx, parts) {
    if (parts.length === 4) {
      if (idx === s.length) out.push(parts.join('.'));
      return;
    }
    for (let len = 1; len &lt;= 3; len++) {
      if (idx + len &gt; s.length) break;
      const seg = s.slice(idx, idx + len);
      if (!isValid(seg)) continue;
      parts.push(seg);
      bt(idx + len, parts);
      parts.pop();
    }
  }
  bt(0, []);
  return out;
}
</code></pre>

<h3>Example 2: Word Break II (recover all sentences)</h3>
<pre><code class="language-js">function wordBreak(s, wordDict) {
  const set = new Set(wordDict);
  const memo = new Map();
  function go(start) {
    if (memo.has(start)) return memo.get(start);
    if (start === s.length) return [''];
    const out = [];
    for (let end = start + 1; end &lt;= s.length; end++) {
      const word = s.slice(start, end);
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

<h3>Example 3: Combinations Sum III (k numbers, distinct, summing to n)</h3>
<pre><code class="language-js">function combinationSum3(k, n) {
  const out = [];
  const path = [];
  function bt(start, sum) {
    if (path.length === k) {
      if (sum === n) out.push([...path]);
      return;
    }
    for (let i = start; i &lt;= 9; i++) {
      if (sum + i &gt; n) break;
      path.push(i);
      bt(i + 1, sum + i);
      path.pop();
    }
  }
  bt(1, 0);
  return out;
}
</code></pre>

<h3>Example 4: Expression Add Operators</h3>
<pre><code class="language-js">function addOperators(num, target) {
  const out = [];
  function bt(idx, expr, prev, curEval) {
    if (idx === num.length) {
      if (curEval === target) out.push(expr);
      return;
    }
    for (let j = idx; j &lt; num.length; j++) {
      if (j &gt; idx &amp;&amp; num[idx] === '0') break;   // no leading zeros
      const piece = num.slice(idx, j + 1);
      const n = Number(piece);
      if (idx === 0) {
        bt(j + 1, piece, n, n);
      } else {
        bt(j + 1, expr + '+' + piece, n, curEval + n);
        bt(j + 1, expr + '-' + piece, -n, curEval - n);
        bt(j + 1, expr + '*' + piece, prev * n, curEval - prev + prev * n);
      }
    }
  }
  bt(0, '', 0, 0);
  return out;
}
</code></pre>

<h3>Example 5: All Paths in DAG</h3>
<pre><code class="language-js">function allPathsSourceTarget(graph) {
  const out = [];
  const target = graph.length - 1;
  function bt(node, path) {
    if (node === target) { out.push([...path]); return; }
    for (const next of graph[node]) {
      path.push(next);
      bt(next, path);
      path.pop();
    }
  }
  bt(0, [0]);
  return out;
}
</code></pre>

<h3>Example 6: Unique Permutations of a string</h3>
<pre><code class="language-js">function uniquePerms(s) {
  const arr = [...s].sort();
  const out = [];
  const path = [];
  const used = new Array(arr.length).fill(false);
  function bt() {
    if (path.length === arr.length) { out.push(path.join('')); return; }
    for (let i = 0; i &lt; arr.length; i++) {
      if (used[i]) continue;
      if (i &gt; 0 &amp;&amp; arr[i] === arr[i - 1] &amp;&amp; !used[i - 1]) continue;
      used[i] = true;
      path.push(arr[i]);
      bt();
      path.pop();
      used[i] = false;
    }
  }
  bt();
  return out;
}
</code></pre>

<h3>Example 7: Robot Path (with obstacles)</h3>
<pre><code class="language-js">function paths(grid, r = 0, c = 0, path = [], all = []) {
  const m = grid.length, n = grid[0].length;
  if (r &lt; 0 || c &lt; 0 || r &gt;= m || c &gt;= n) return;
  if (grid[r][c] === 1) return;          // obstacle
  path.push([r, c]);
  if (r === m - 1 &amp;&amp; c === n - 1) {
    all.push([...path]);
  } else {
    grid[r][c] = 1;                       // mark visited
    paths(grid, r + 1, c, path, all);
    paths(grid, r, c + 1, path, all);
    grid[r][c] = 0;                       // unmark
  }
  path.pop();
  return all;
}
</code></pre>

<h3>Example 8: K-th Permutation Sequence (math + skip)</h3>
<pre><code class="language-js">function getPermutation(n, k) {
  const fact = [1];
  for (let i = 1; i &lt;= n; i++) fact[i] = fact[i - 1] * i;
  const nums = Array.from({ length: n }, (_, i) =&gt; i + 1);
  k--;
  let out = '';
  for (let i = n; i &gt;= 1; i--) {
    const idx = Math.floor(k / fact[i - 1]);
    out += nums.splice(idx, 1)[0];
    k %= fact[i - 1];
  }
  return out;
}
</code></pre>
<p>This isn't pure backtracking — it computes directly. Mention as a follow-up: "if you only need the K-th, skip enumeration."</p>

<h3>Example 9: Beautiful Arrangement</h3>
<pre><code class="language-js">function countArrangement(n) {
  let count = 0;
  const used = new Array(n + 1).fill(false);
  function bt(pos) {
    if (pos &gt; n) { count++; return; }
    for (let v = 1; v &lt;= n; v++) {
      if (used[v]) continue;
      if (v % pos !== 0 &amp;&amp; pos % v !== 0) continue;
      used[v] = true;
      bt(pos + 1);
      used[v] = false;
    }
  }
  bt(1);
  return count;
}
</code></pre>

<h3>Example 10: Find paths summing to target in tree</h3>
<pre><code class="language-js">function pathSum(root, targetSum) {
  const out = [];
  function bt(node, remaining, path) {
    if (!node) return;
    path.push(node.val);
    if (!node.left &amp;&amp; !node.right &amp;&amp; remaining === node.val) {
      out.push([...path]);
    }
    bt(node.left, remaining - node.val, path);
    bt(node.right, remaining - node.val, path);
    path.pop();
  }
  bt(root, targetSum, []);
  return out;
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Empty input</h3>
<p>Subsets of <code>[]</code> = <code>[[]]</code>. Permutations of <code>[]</code> = <code>[[]]</code>. Always handle. Most templates do this naturally because the base case fires immediately.</p>

<h3>Duplicates in input</h3>
<p>Without sort + skip, you'll generate duplicate outputs. Always ask: are duplicates in the input allowed and how should they be handled in the output?</p>

<h3>Recording vs reference</h3>
<pre><code class="language-js">// BAD — pushes the same array reference; later mutations corrupt history
out.push(path);

// GOOD — copy at recording moment
out.push([...path]);
</code></pre>

<h3>Mutating shared state without undo</h3>
<pre><code class="language-js">// Marks visited but never unmarks → only the first complete path explored correctly
function bt(r, c, idx) {
  if (...) return true;
  board[r][c] = '#';
  return bt(r+1, c, idx+1);   // ❌ never unmarked
}

// FIX — restore on return
function bt(r, c, idx) {
  if (...) return true;
  const tmp = board[r][c];
  board[r][c] = '#';
  const found = bt(r+1, c, idx+1);
  board[r][c] = tmp;
  return found;
}
</code></pre>

<h3>Infinite recursion from missing base case</h3>
<p>Always test on n=0 and n=1. The most common backtracking bug is forgetting the base case in the simplest input.</p>

<h3>Pruning at the wrong level</h3>
<pre><code class="language-js">// BAD — checks AFTER recursion (too late)
bt(...);
if (path.length &gt; max) return;

// GOOD — check BEFORE recursion
if (path.length &gt; max) return;
bt(...);
</code></pre>

<h3>Sorting before deduplication</h3>
<p>The duplicate-skip trick (<code>i &gt; start &amp;&amp; nums[i] === nums[i-1]</code>) only works on sorted input. Forgetting to sort produces duplicates.</p>

<h3>Permutation duplicate-skip needs a different condition</h3>
<pre><code class="language-js">// Combinations: skip if same as previous AT SAME RECURSION DEPTH
if (i &gt; start &amp;&amp; nums[i] === nums[i - 1]) continue;

// Permutations: skip if same as previous AND previous is unused
if (i &gt; 0 &amp;&amp; nums[i] === nums[i - 1] &amp;&amp; !used[i - 1]) continue;
</code></pre>
<p>Easy to confuse; the conditions are NOT interchangeable.</p>

<h3>String concatenation cost</h3>
<pre><code class="language-js">// In tight loops, '+' on strings allocates a new string each time
bt(s + ch, ...);   // OK if depth is small; expensive otherwise

// Faster: char array + push/pop
const path = [];
path.push(ch); bt(); path.pop();
</code></pre>

<h3>Recording with shared buffer</h3>
<pre><code class="language-js">const path = [];
function bt(...) {
  out.push(path);   // ❌ all entries point to same array
}
</code></pre>
<p>Always copy at the moment of recording.</p>

<h3>Missing constraints in pruning</h3>
<p>Pruning based on incomplete information may exclude valid solutions. Always verify your pruning condition is necessary AND sound: "if I prune here, can I prove no descendant could have been valid?"</p>

<h3>Recursion depth</h3>
<p>For inputs of size ~50+, recursion depth can hit V8's stack limit. Iterative variants exist (explicit stack) but rarely needed in practice.</p>

<h3>Combination Sum with negatives</h3>
<p>If candidates can be negative, sorting + breaking early on <code>candidates[i] &gt; remaining</code> stops working. Either filter / convert, or remove the early-break optimization.</p>

<h3>Word Search marking with same character</h3>
<p>Marking a cell with <code>'#'</code> only works if <code>'#'</code> isn't a valid input character. Use a Set of (r,c) instead, or a sentinel that you confirm doesn't appear.</p>

<h3>Empty target / k = 0</h3>
<p>"Combinations of size 0" = <code>[[]]</code>. "Combinations summing to 0" with empty path = <code>[[]]</code>. Edge cases that often trip up the base case logic.</p>

<h3>Output ordering</h3>
<p>Most "all combinations" problems don't require a specific output order, but some judges do. If asked for sorted output, use sorted input + sorted recursion order; the natural traversal yields lexicographic.</p>

<h3>Memoization confusion</h3>
<p>Pure backtracking enumerates ALL solutions; memoization assumes the function returns ONE answer. You can memoize "from index i, what's the answer?" but only when each subproblem has a single answer (not a list of answers per state). Otherwise switch to DP.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: pushing path reference</h3>
<pre><code class="language-js">out.push(path);   // ❌ all entries are the same array

// FIX
out.push([...path]);
</code></pre>

<h3>Bug 2: forgetting to undo</h3>
<pre><code class="language-js">path.push(x);
bt();
// forgot path.pop() → siblings see polluted state
</code></pre>

<h3>Bug 3: using <code>start = 0</code> in combinations</h3>
<pre><code class="language-js">// Combinations should advance start to avoid duplicates
function combinations(start) {
  for (let i = 0; i &lt; n; i++) {   // ❌ generates duplicates
    bt(...);
  }
}

// FIX
function combinations(start) {
  for (let i = start; i &lt; n; i++) {
    bt(i + 1, ...);
  }
}
</code></pre>

<h3>Bug 4: pruning condition that's too aggressive</h3>
<pre><code class="language-js">// Excludes valid solutions
if (sum + nums[i] &gt; target) return;   // ❌ should be 'continue'
</code></pre>
<p>If you <code>return</code> on a single failure, you skip subsequent candidates that might work. Use <code>continue</code> on per-candidate failures and <code>return</code> only when the entire branch is dead.</p>

<h3>Bug 5: duplicate condition wrong for permutations</h3>
<pre><code class="language-js">// Wrong condition (the combinations version)
if (i &gt; start &amp;&amp; nums[i] === nums[i - 1]) continue;

// Correct for permutations
if (i &gt; 0 &amp;&amp; nums[i] === nums[i - 1] &amp;&amp; !used[i - 1]) continue;
</code></pre>

<h3>Bug 6: missing base case</h3>
<pre><code class="language-js">function bt() {
  for (...) bt();   // never terminates
}

// Always have:
if (isComplete()) { record(); return; }
</code></pre>

<h3>Bug 7: pushing before validity check</h3>
<pre><code class="language-js">// BAD
path.push(x);
if (!valid()) { /* forgot to pop! */ return; }

// GOOD
if (!valid()) return;
path.push(x);
bt();
path.pop();
</code></pre>

<h3>Bug 8: copying state every call (slow)</h3>
<pre><code class="language-js">// Wasteful
function bt(path) {
  out.push(path);
  for (...) bt([...path, x]);
}

// Faster — mutate-and-undo
function bt() {
  out.push([...path]);
  for (...) {
    path.push(x);
    bt();
    path.pop();
  }
}
</code></pre>

<h3>Bug 9: forgetting the return from recursive search</h3>
<pre><code class="language-js">// Looking for "any solution" — must propagate true
function bt() {
  if (found) return true;
  bt();   // ❌ ignores return
}

// FIX
if (bt()) return true;
</code></pre>

<h3>Bug 10: word search not undoing the mark</h3>
<pre><code class="language-js">board[r][c] = '#';
const f = bt(...) || bt(...);
return f;   // ❌ never restored — second call from a different path sees corrupted board
// FIX — restore before return
</code></pre>

<h3>Anti-pattern 1: enumerating then filtering</h3>
<p>Generating all permutations and then filtering for those satisfying a constraint is wasteful. Push the constraint into the recursion as a pruning step.</p>

<h3>Anti-pattern 2: backtracking when DP would memoize</h3>
<p>"Number of ways to reach the end" — counting problem with overlapping subproblems → DP, not backtracking. Backtracking is O(branching^depth); DP is O(states).</p>

<h3>Anti-pattern 3: deep copying state</h3>
<p>Cloning the entire state per recursive call (instead of mutate-and-undo) gives correctness at the cost of memory and constant factor.</p>

<h3>Anti-pattern 4: missing pruning on obviously bad branches</h3>
<p>If <code>currentSum &gt; target</code> with all positive candidates, you should prune. Failing to prune turns minutes-long searches into hours-long.</p>

<h3>Anti-pattern 5: hand-rolling factorial enumeration when math suffices</h3>
<p>For "K-th permutation," compute directly. For "number of permutations," use n! formula. Backtracking is for cases where you need ALL configurations, not just count.</p>

<h3>Anti-pattern 6: using set for path when array suffices</h3>
<p>Sets have larger constants than arrays for small N. If you only need order-preserving membership, use array + Set in parallel, or just the array.</p>

<h3>Anti-pattern 7: recursing on string slices</h3>
<pre><code class="language-js">function bt(s) { for (...) bt(s.slice(1)); }   // O(n) slice per call
// FIX — pass an index
function bt(idx) { for (...) bt(idx + 1); }
</code></pre>

<h3>Anti-pattern 8: backtracking when constraints determine a single answer</h3>
<p>"Find the unique solution to this puzzle" — backtracking works, but if the constraint structure has a tractable form, dedicated solvers (linear programming, SAT) are orders of magnitude faster.</p>

<h3>Anti-pattern 9: building output string with concatenation in tight loop</h3>
<p>String concatenation per call is O(n). Use an array and <code>.join('')</code> at recording time.</p>

<h3>Anti-pattern 10: not testing the duplicate trick</h3>
<p>"Subsets II" with input [1,2,2,3] — verify your output has 12 subsets, not more (which would indicate duplicates). Never trust pruning is correct without a test.</p>
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
    <tr><td>Subsets / Subsets II</td><td>Choose-skip with start index; sort + skip duplicates</td></tr>
    <tr><td>Permutations / Permutations II</td><td><code>used</code> tracking; duplicate skip with <code>!used[i-1]</code></td></tr>
    <tr><td>Combinations / Combination Sum / Sum II / Sum III</td><td>Start index; sort to enable break-on-too-big</td></tr>
    <tr><td>N-queens / Queens variants</td><td>Cols / diag1 / diag2 sets; row-by-row</td></tr>
    <tr><td>Sudoku</td><td>Find empty cell; try 1-9; check row/col/box</td></tr>
    <tr><td>Word Search / Word Search II</td><td>DFS in grid; mark visited; restore</td></tr>
    <tr><td>Palindrome Partitioning</td><td>Check substring palindromicity; recurse on suffix</td></tr>
    <tr><td>Generate Parentheses</td><td>Track open/close counts; constraint pruning</td></tr>
    <tr><td>Letter Combinations of Phone Number</td><td>Map digit→letters; recurse</td></tr>
    <tr><td>Restore IP Addresses</td><td>4 segments; validate each (length, leading-zero, ≤255)</td></tr>
    <tr><td>Expression Add Operators</td><td>+/-/* with precedence handling via 'prev'</td></tr>
    <tr><td>Beautiful Arrangement</td><td>Position-based with divisibility constraint</td></tr>
    <tr><td>All Paths in DAG</td><td>DFS with path tracking</td></tr>
    <tr><td>Word Break II</td><td>Memoized backtracking (returns list)</td></tr>
  </tbody>
</table>

<h3>Pattern selection cheatsheet</h3>
<table>
  <thead><tr><th>Problem signal</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"All subsets / power set"</td><td>Choose-skip pattern</td></tr>
    <tr><td>"All permutations"</td><td>Used-array pattern</td></tr>
    <tr><td>"All combinations of size K"</td><td>Start index + size check</td></tr>
    <tr><td>"All ways to partition"</td><td>Recurse on suffix; choose split</td></tr>
    <tr><td>"Constraint: place N items satisfying X"</td><td>Backtrack with constraint check (N-queens / Sudoku)</td></tr>
    <tr><td>"Path in grid satisfying constraint"</td><td>DFS + mark/unmark</td></tr>
    <tr><td>"Generate all valid X (parens, IPs, expressions)"</td><td>Recurse with state tracking</td></tr>
    <tr><td>"COUNT of ways" → not all configurations needed</td><td>DP, not backtracking</td></tr>
    <tr><td>"Best of all configurations"</td><td>DP often beats backtracking unless states are sparse</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Subsets — verify on <code>[1,2,3]</code> = 8 outputs.</li>
  <li>Subsets II — verify on <code>[1,2,2]</code> = 6 outputs (no duplicates).</li>
  <li>Permutations — verify on <code>[1,2,3]</code> = 6 outputs.</li>
  <li>Combinations — verify <code>combine(4, 2)</code> = 6 outputs.</li>
  <li>Combination Sum — find combos with reuse summing to target.</li>
  <li>N-queens — verify n=4 yields 2, n=8 yields 92.</li>
  <li>Generate Parentheses — verify n=3 yields <code>['((()))','(()())','(())()','()(())','()()()']</code>.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li><code>out.push(path)</code> instead of <code>out.push([...path])</code> — all outputs are the same array.</li>
  <li>Permutation duplicate-skip uses combination's condition — fails on inputs with duplicates.</li>
  <li>Word search marks visited but doesn't restore — only the first complete path explored correctly.</li>
  <li>Combination Sum without <code>break</code> on <code>candidates[i] &gt; remaining</code> — slow on large candidate sets.</li>
  <li>Subsets II without <code>nums.sort()</code> first — duplicate subsets generated.</li>
  <li>Recursion that returns <code>true</code>/<code>false</code> but caller ignores it — search continues past the answer.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Pattern recognition</td><td>You name "subsets / permutations / combinations / N-queens" before coding.</td></tr>
    <tr><td>Three-step structure</td><td>You write choose / explore / unchoose visibly.</td></tr>
    <tr><td>Pruning</td><td>You add at least one pruning condition with a comment explaining why.</td></tr>
    <tr><td>Duplicate handling</td><td>You sort + skip; you know the permutation-vs-combination conditions differ.</td></tr>
    <tr><td>State management</td><td>You mutate-and-undo, never deep-copy.</td></tr>
    <tr><td>Recording discipline</td><td>You copy <code>[...path]</code> at recording.</td></tr>
    <tr><td>Complexity articulation</td><td>You quote O(N · 2^N) for subsets, O(N · N!) for permutations.</td></tr>
    <tr><td>Knowing when to use DP</td><td>You distinguish enumeration from optimization.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Form path validators / autocompleters</strong> — backtracking recovers all valid completions.</li>
  <li><strong>Dependency resolvers</strong> in build tools — try a version; if conflict, undo and try another.</li>
  <li><strong>UI navigation graph search</strong> — find all reachable screens from the current state.</li>
  <li><strong>Deep-link route parsing</strong> with multiple matching patterns — backtrack between candidate parses.</li>
  <li><strong>A11y traversal</strong> — enumerate all valid focus orders given constraints.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why does sorting + the <code>i &gt; start &amp;&amp; nums[i] === nums[i-1]</code> trick work?"</em> — Same-value siblings at the same depth create duplicate sub-trees. Skipping them prevents duplicate outputs while still allowing the value at deeper levels.</li>
  <li><em>"Why does the permutation duplicate condition include <code>!used[i-1]</code>?"</em> — Equal values are interchangeable, but you only want to consider them in canonical order. The <code>!used[i-1]</code> ensures you only pick the i-th equal value when its predecessor (the (i-1)-th) is also unpicked at this level.</li>
  <li><em>"How does pruning improve runtime if worst-case is still exponential?"</em> — Worst case stays exponential; <em>typical</em> inputs see massive reductions because most branches terminate immediately. N-queens for n=20 without pruning is intractable; with pruning, finishes in seconds.</li>
  <li><em>"When is backtracking better than DP?"</em> — When the state space doesn't have overlapping subproblems (each path produces distinct states), or when you need to enumerate all solutions, not just count or find the best.</li>
  <li><em>"How do you parallelize backtracking?"</em> — Distribute root-level branches across workers. Each worker explores its subtree independently. Used in production constraint solvers.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add memoization where the recursion has overlapping state (Word Break, Palindrome Partition counting)."</li>
  <li>"I'd profile pruning effectiveness — count branches visited per problem size to verify the prune is working."</li>
  <li>"I'd convert deep recursion to iterative with an explicit stack for very large inputs."</li>
  <li>"I'd add a unique-output deduper at the boundary as a safety net even with sort + skip."</li>
  <li>"I'd consider symmetry breaking for N-queens and similar (only solve half; mirror for the rest)."</li>
</ul>
`
    }
  ]
});
