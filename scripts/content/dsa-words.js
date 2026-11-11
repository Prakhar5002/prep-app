// DSA Words in Plain English: the glossary every DSA topic links to (#/topic/dsa-words#w-<slug>).
// Each entry: <h3 id="w-<slug>"> → plain meaning → everyday picture → tiny example → "You'll meet it in".
window.PREP_SITE.registerTopic({
  id: "dsa-words",
  module: "dsa",
  title: "DSA Words in Plain English",
  estimatedReadTime: "40 min",
  tags: ["dsa","glossary","beginner","terms","big-o","vocabulary"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">DSA has its own vocabulary. About fifteen words unlock almost everything, and this page explains each one with an everyday picture and a tiny example.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong><a href="#/topic/dsa-words#w-array">Array</a> and <a href="#/topic/dsa-words#w-index">index</a>:</strong> a row of lockers. The index is the locker number, and it starts at 0. The last index is <code>length - 1</code>.</li>
    <li><strong><a href="#/topic/dsa-words#w-subarray">Subarray</a> vs <a href="#/topic/dsa-words#w-subsequence">subsequence</a>:</strong> a subarray is neighbours with no gaps. A subsequence keeps the order but may skip items.</li>
    <li><strong><a href="#/topic/dsa-words#w-pointer">Pointer</a>:</strong> a variable holding a position, like a finger on a locker. <a href="#/topic/dsa-words#w-two-pointers">Two pointers</a> = two fingers moving through the data.</li>
    <li><strong><a href="#/topic/dsa-words#w-window">Window</a>:</strong> the stretch between a <code>left</code> and a <code>right</code> pointer, sliding along like a camera viewfinder.</li>
    <li><strong><a href="#/topic/dsa-words#w-big-o">Big-O</a>:</strong> how the work grows as the input (n) grows. <a href="#/topic/dsa-words#w-o-1">O(1)</a> = same work always. <a href="#/topic/dsa-words#w-o-log-n">O(log n)</a> = halve each step. <a href="#/topic/dsa-words#w-o-n">O(n)</a> = one pass. <a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a> = good sorting. <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a> = a loop inside a loop.</li>
    <li><strong><a href="#/topic/dsa-words#w-space-complexity">Space</a>:</strong> the extra memory you create, including recursive calls still waiting to finish.</li>
    <li><strong><a href="#/topic/dsa-words#w-hash-map">Hash map</a> / <a href="#/topic/dsa-words#w-hash-set">hash set</a>:</strong> find by key, or answer "seen it?", in O(1) on average.</li>
    <li><strong><a href="#/topic/dsa-words#w-stack">Stack</a> vs <a href="#/topic/dsa-words#w-queue">queue</a>:</strong> a stack of plates (last in, first out) vs a ticket line (first in, first out).</li>
    <li><strong><a href="#/topic/dsa-words#w-recursion">Recursion</a> and <a href="#/topic/dsa-words#w-base-case">base case</a>:</strong> a function calling itself on a smaller piece, until the smallest piece stops it.</li>
    <li><strong><a href="#/topic/dsa-words#w-tree">Tree</a> and <a href="#/topic/dsa-words#w-node">node</a>:</strong> boxes joined parent-to-child from one <a href="#/topic/dsa-words#w-root-leaf">root</a>, like folders. A <a href="#/topic/dsa-words#w-bst">BST</a> keeps smaller on the left, bigger on the right.</li>
    <li><strong><a href="#/topic/dsa-words#w-graph">Graph</a>:</strong> a metro map of <a href="#/topic/dsa-words#w-vertex">vertices</a> and <a href="#/topic/dsa-words#w-edge">edges</a>. <a href="#/topic/dsa-words#w-bfs">BFS</a> spreads like ripples; <a href="#/topic/dsa-words#w-dfs">DFS</a> goes deep like exploring a cave.</li>
    <li><strong><a href="#/topic/dsa-words#w-dp">DP</a> and <a href="#/topic/dsa-words#w-memoization">memoization</a>:</strong> remember and reuse the answers to smaller questions.</li>
    <li><strong><a href="#/topic/dsa-words#w-in-place">In-place</a>:</strong> change the array you were given; do not make a copy.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Mixing up words that sound alike.</strong> Subarray (no gaps) vs subsequence (gaps allowed). Index (where) vs element (what). A graph <a href="#/topic/dsa-words#w-edge">edge</a> vs an <a href="#/topic/dsa-words#w-edge-case">edge case</a>. A <a href="#/topic/dsa-words#w-heap">heap</a> (the structure) vs the memory heap. And reading O(n) as "n seconds": Big-O is about how work <em>grows</em>, not a stopwatch time. The <a href="#/topic/dsa-words#pitfalls">Pitfalls</a> section lists each pair with an example.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The brute force checks every pair, which is O(n²): for 10,000 items that is about 50 million pairs. If I keep the numbers I've seen in a hash set, each check is O(1) on average, so the whole thing becomes one O(n) pass, at the cost of O(n) extra space."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Why a page of words?</h3>
<p>Think about your first week in a new team. People say "LGTM, merge the PR and ship it to prod". You are not slow; you just do not know the words yet. Someone hands you a one-page cheat sheet of team jargon, and by Friday the meetings make sense.</p>
<p>DSA is the same. A typical explanation says: <em>"Use a monotonic deque to keep the window invariant in amortized O(1)."</em> That sentence has five words that each need explaining. If even one of them is unclear, the whole sentence is unclear.</p>

<h3>The slow way</h3>
<p>The usual way is to look up each word as you meet it. But the search results explain it with more jargon ("a deque is a double-ended queue abstract data type"). So one word turns into three open tabs. The DSA topics on this site use over a hundred of these words. Looked up one by one, that is hundreds of tabs, and you lose the thread of what you were actually learning.</p>

<h3>What this page does instead</h3>
<p>Every word lives here, in one place, in the same shape:</p>
<ul>
  <li><strong>In plain words:</strong> one simple sentence.</li>
  <li><strong>Everyday picture:</strong> something from normal life that works the same way.</li>
  <li><strong>Tiny example:</strong> a few numbers or a few lines of plain JavaScript that you could paste into the console.</li>
  <li><strong>You'll meet it in:</strong> the topics where the word matters.</li>
</ul>
<p>Every other DSA topic links back here the first time it uses one of these words. So you never have to leave the site to understand a sentence.</p>

<div class="callout success">
  <div class="callout-title">How to use this page</div>
  <p>Read the Revision card above now. Then read families 1 to 3 (basics, pointers and Big-O) properly, because every topic uses them. Dip into the rest only when a topic sends you here.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<p>Three pictures hold most of the vocabulary. If you can draw these from memory, you know the words that matter most.</p>

<h3>Picture 1: the row of lockers</h3>
<p>An <a href="#/topic/dsa-words#w-array">array</a> is a row of lockers. The number on each door is the <a href="#/topic/dsa-words#w-index">index</a>; what is inside is the <a href="#/topic/dsa-words#w-element">element</a>. Every way of "cutting out a piece" has its own name:</p>
<div class="diagram"><pre>scores = [70, 85, 90, 60, 75]

index    -&gt;    0      1      2      3      4
            ┌──────┬──────┬──────┬──────┬──────┐
element  -&gt; │  70  │  85  │  90  │  60  │  75  │
            └──────┴──────┴──────┴──────┴──────┘

subarray     (neighbours, no gaps):         85     90     60        = indexes 1, 2, 3
subsequence  (order kept, gaps OK):  70            90            75 = indexes 0, 2, 4
subset       (any pick, order free): {75, 70} is the same pick as {70, 75}</pre></div>

<h3>Picture 2: a pointer walking the row (step by step)</h3>
<p>A <a href="#/topic/dsa-words#w-pointer">pointer</a> is just a variable that remembers which locker we are at. Here the pointer <code>i</code> walks along five days of sales, keeping a running total. The list of running totals is called a <a href="#/topic/dsa-words#w-prefix-sum">prefix sum</a>. This is exactly what the code in the <a href="#/topic/dsa-words#w-prefix-sum">prefix sum entry</a> does:</p>
<div class="diagram"><pre>sales = [3, 1, 4, 1, 5]          i = the pointer (our finger)

step   i   sales[i]   runningTotal   prefix so far
start  -      -            0         [0]
1      0      3        0 + 3 = 3     [0, 3]
2      1      1        3 + 1 = 4     [0, 3, 4]
3      2      4        4 + 4 = 8     [0, 3, 4, 8]
4      3      1        8 + 1 = 9     [0, 3, 4, 8, 9]
5      4      5        9 + 5 = 14    [0, 3, 4, 8, 9, 14]
i becomes 5 = sales.length, so the loop stops.
The pointer visited each locker once: one pass, O(n).

Question: total of the subarray from index 1 to 3?
prefix[4] - prefix[1] = 9 - 3 = 6        check: 1 + 4 + 1 = 6
Answered with one subtraction: O(1) per question.</pre></div>
<p>One picture, six words: pointer, element, pass, prefix sum, subarray, and the Big-O of each step.</p>

<h3>Picture 3: how fast the work grows</h3>
<p><a href="#/topic/dsa-words#w-big-o">Big-O</a> is about the <em>shape</em> of growth. This table shows roughly how many steps each shape takes as n gets bigger:</p>
<div class="diagram"><pre>n (items)    O(1)  O(log n)  O(n)        O(n log n)    O(n²)                O(2ⁿ)
10           1     ~3        10          ~33           100                  1,024
1,000        1     ~10       1,000       ~10,000       1,000,000            far too many
1,000,000    1     ~20       1,000,000   ~20,000,000   1,000,000,000,000    forget it</pre></div>
<p>A laptop does very roughly 100 million simple steps a second. So O(n log n) on a million items takes a fraction of a second, while O(n²) on a million items takes hours. That gap is why interviewers keep asking "can you do better?"</p>

<h3>How to recognise the words in a question</h3>
<p>Interview questions hint at the right idea through their wording. A quick translation table:</p>
<table>
  <thead><tr><th>The question says…</th><th>Think of…</th></tr></thead>
  <tbody>
    <tr><td>"contiguous", "consecutive", "in a row"</td><td><a href="#/topic/dsa-words#w-subarray">subarray</a>, <a href="#/topic/dsa-words#w-window">sliding window</a>, <a href="#/topic/dsa-words#w-prefix-sum">prefix sum</a></td></tr>
    <tr><td>"in order, but not necessarily next to each other"</td><td><a href="#/topic/dsa-words#w-subsequence">subsequence</a>, usually <a href="#/topic/dsa-words#w-dp">DP</a></td></tr>
    <tr><td>"sorted array"</td><td><a href="#/topic/dsa-words#w-binary-search">binary search</a> or <a href="#/topic/dsa-words#w-two-pointers">two pointers</a></td></tr>
    <tr><td>"have we seen…", "count how many", "pair that adds to"</td><td><a href="#/topic/dsa-words#w-hash-set">hash set</a>, <a href="#/topic/dsa-words#w-frequency-map">frequency map</a>, <a href="#/topic/dsa-words#w-complement">complement</a></td></tr>
    <tr><td>"matching brackets", "undo", "next greater"</td><td><a href="#/topic/dsa-words#w-stack">stack</a>, <a href="#/topic/dsa-words#w-monotonic-stack">monotonic stack</a></td></tr>
    <tr><td>"fewest steps", "nearest", "level by level"</td><td><a href="#/topic/dsa-words#w-bfs">BFS</a> with a <a href="#/topic/dsa-words#w-queue">queue</a></td></tr>
    <tr><td>"all combinations", "all arrangements", "every way to"</td><td><a href="#/topic/dsa-words#w-backtracking">backtracking</a></td></tr>
    <tr><td>"number of ways", "minimum cost", "maximum profit" with choices</td><td><a href="#/topic/dsa-words#w-dp">DP</a></td></tr>
    <tr><td>"k largest", "k closest", "keep getting the smallest"</td><td><a href="#/topic/dsa-words#w-heap">heap</a> / <a href="#/topic/dsa-words#w-priority-queue">priority queue</a></td></tr>
    <tr><td>"starts with", "autocomplete", "dictionary of words"</td><td><a href="#/topic/dsa-words#w-trie">trie</a></td></tr>
    <tr><td>"prerequisites", "order of tasks", "depends on"</td><td><a href="#/topic/dsa-words#w-topological-sort">topological sort</a></td></tr>
    <tr><td>"groups", "connected", "islands"</td><td><a href="#/topic/dsa-words#w-connected-component">connected components</a>, <a href="#/topic/dsa-words#w-dfs">DFS</a>, <a href="#/topic/dsa-words#w-union-find">Union-Find</a></td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics — The Glossary, Part 1", collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">How to use this page</div>
  <p>Read families 1 to 3 (basics, pointers and Big-O) properly, because every topic uses them. Dip into the rest only when a topic sends you here.</p>
</div>

<p>The glossary is split across two sections. This one holds the four families every topic leans on. The <a href="#/topic/dsa-words#examples">Examples</a> section holds the data structures and techniques. Use the list below to jump straight to any word.</p>

<h3 id="glossary-contents">All the words</h3>
<ul>
<li><strong><a href="#/topic/dsa-words#fam-basics">1. Basics: arrays and strings</a></strong>: <a href="#/topic/dsa-words#w-array">Array</a>, <a href="#/topic/dsa-words#w-index">Index</a>, <a href="#/topic/dsa-words#w-element">Element</a>, <a href="#/topic/dsa-words#w-contiguous">Contiguous</a>, <a href="#/topic/dsa-words#w-subarray">Subarray</a>, <a href="#/topic/dsa-words#w-substring">Substring</a>, <a href="#/topic/dsa-words#w-subsequence">Subsequence</a>, <a href="#/topic/dsa-words#w-subset">Subset</a>, <a href="#/topic/dsa-words#w-permutation">Permutation</a>, <a href="#/topic/dsa-words#w-combination">Combination</a>, <a href="#/topic/dsa-words#w-in-place">In-place</a>, <a href="#/topic/dsa-words#w-immutable">Immutable</a>, <a href="#/topic/dsa-words#w-prefix-suffix">Prefix and suffix</a>, <a href="#/topic/dsa-words#w-prefix-sum">Prefix sum</a>, <a href="#/topic/dsa-words#w-palindrome">Palindrome</a>, <a href="#/topic/dsa-words#w-anagram">Anagram</a>, <a href="#/topic/dsa-words#w-matrix">Matrix, grid, 2D array</a>, <a href="#/topic/dsa-words#w-sorted">Sorted</a>, <a href="#/topic/dsa-words#w-stable-sort">Stable sort</a>, <a href="#/topic/dsa-words#w-lexicographic">Lexicographic order</a>, <a href="#/topic/dsa-words#w-interval">Interval</a>, <a href="#/topic/dsa-words#w-half-open-range">Half-open range [start, end)</a>, <a href="#/topic/dsa-words#w-off-by-one">Off-by-one error</a>, <a href="#/topic/dsa-words#w-edge-case">Edge case</a></li>
<li><strong><a href="#/topic/dsa-words#fam-pointers">2. Pointers and windows</a></strong>: <a href="#/topic/dsa-words#w-pointer">Pointer</a>, <a href="#/topic/dsa-words#w-two-pointers">Two pointers</a>, <a href="#/topic/dsa-words#w-window">Window</a></li>
<li><strong><a href="#/topic/dsa-words#fam-big-o">3. Big-O: how work grows</a></strong>: <a href="#/topic/dsa-words#w-input-size">n</a>, <a href="#/topic/dsa-words#w-big-o">Big-O</a>, <a href="#/topic/dsa-words#w-time-complexity">Time complexity</a>, <a href="#/topic/dsa-words#w-space-complexity">Space complexity</a>, <a href="#/topic/dsa-words#w-o-1">O(1): constant time</a>, <a href="#/topic/dsa-words#w-o-log-n">O(log n): logarithmic time</a>, <a href="#/topic/dsa-words#w-o-n">O(n): linear time</a>, <a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a>, <a href="#/topic/dsa-words#w-o-n-squared">O(n²): quadratic time</a>, <a href="#/topic/dsa-words#w-o-2-n">O(2ⁿ): exponential time</a>, <a href="#/topic/dsa-words#w-o-n-factorial">O(n!): factorial time</a>, <a href="#/topic/dsa-words#w-worst-average-case">Worst, average and best case</a>, <a href="#/topic/dsa-words#w-amortized">Amortized</a>, <a href="#/topic/dsa-words#w-brute-force">Brute force</a>, <a href="#/topic/dsa-words#w-trade-off">Time-space trade-off</a>, <a href="#/topic/dsa-words#w-constraints">Constraints</a>, <a href="#/topic/dsa-words#w-divide-and-conquer">Divide and conquer</a>, <a href="#/topic/dsa-words#w-master-theorem">Master Theorem</a></li>
<li><strong><a href="#/topic/dsa-words#fam-recursion">4. Recursion and remembering</a></strong>: <a href="#/topic/dsa-words#w-recursion">Recursion</a>, <a href="#/topic/dsa-words#w-base-case">Base case</a>, <a href="#/topic/dsa-words#w-call-stack">Call stack</a>, <a href="#/topic/dsa-words#w-stack-overflow">Stack overflow</a>, <a href="#/topic/dsa-words#w-iterative">Iterative</a>, <a href="#/topic/dsa-words#w-memoization">Memoization</a>, <a href="#/topic/dsa-words#w-tabulation">Tabulation</a></li>
<li><strong><a href="#/topic/dsa-words#fam-hashing">5. Hashing: instant lookups</a></strong>: <a href="#/topic/dsa-words#w-hash-map">Hash map</a>, <a href="#/topic/dsa-words#w-hash-set">Hash set</a>, <a href="#/topic/dsa-words#w-hash-function">Hash function and collision</a>, <a href="#/topic/dsa-words#w-frequency-map">Frequency map</a>, <a href="#/topic/dsa-words#w-complement">Complement</a></li>
<li><strong><a href="#/topic/dsa-words#fam-stacks">6. Stacks and queues</a></strong>: <a href="#/topic/dsa-words#w-stack">Stack</a>, <a href="#/topic/dsa-words#w-queue">Queue</a>, <a href="#/topic/dsa-words#w-deque">Deque</a>, <a href="#/topic/dsa-words#w-monotonic">Monotonic</a>, <a href="#/topic/dsa-words#w-monotonic-stack">Monotonic stack</a>, <a href="#/topic/dsa-words#w-monotonic-deque">Monotonic deque</a></li>
<li><strong><a href="#/topic/dsa-words#fam-linked">7. Linked lists</a></strong>: <a href="#/topic/dsa-words#w-node">Node</a>, <a href="#/topic/dsa-words#w-linked-list">Linked list</a>, <a href="#/topic/dsa-words#w-head-tail">Head and tail</a>, <a href="#/topic/dsa-words#w-dummy-node">Dummy node</a>, <a href="#/topic/dsa-words#w-fast-slow-pointers">Fast and slow pointers</a>, <a href="#/topic/dsa-words#w-lru-cache">LRU cache</a></li>
<li><strong><a href="#/topic/dsa-words#fam-trees">8. Trees</a></strong>: <a href="#/topic/dsa-words#w-tree">Tree</a>, <a href="#/topic/dsa-words#w-root-leaf">Root, parent, child, leaf</a>, <a href="#/topic/dsa-words#w-subtree">Subtree, ancestor, descendant</a>, <a href="#/topic/dsa-words#w-depth-height">Depth, height and level</a>, <a href="#/topic/dsa-words#w-binary-tree">Binary tree</a>, <a href="#/topic/dsa-words#w-bst">BST</a>, <a href="#/topic/dsa-words#w-balanced">Balanced</a>, <a href="#/topic/dsa-words#w-traversal">Traversal</a>, <a href="#/topic/dsa-words#w-lca">LCA</a>, <a href="#/topic/dsa-words#w-serialize">Serialize and deserialize</a></li>
<li><strong><a href="#/topic/dsa-words#fam-heaps">9. Heaps and tries</a></strong>: <a href="#/topic/dsa-words#w-heap">Heap</a>, <a href="#/topic/dsa-words#w-priority-queue">Priority queue</a>, <a href="#/topic/dsa-words#w-top-k">Top-k</a>, <a href="#/topic/dsa-words#w-lazy-deletion">Lazy deletion</a>, <a href="#/topic/dsa-words#w-trie">Trie</a></li>
<li><strong><a href="#/topic/dsa-words#fam-graphs">10. Graphs</a></strong>: <a href="#/topic/dsa-words#w-graph">Graph</a>, <a href="#/topic/dsa-words#w-vertex">Vertex (plural: vertices), also called node</a>, <a href="#/topic/dsa-words#w-edge">Edge</a>, <a href="#/topic/dsa-words#w-directed-undirected">Directed and undirected</a>, <a href="#/topic/dsa-words#w-weighted">Weighted graph</a>, <a href="#/topic/dsa-words#w-adjacency-list">Adjacency list</a>, <a href="#/topic/dsa-words#w-degree">Degree, in-degree, out-degree</a>, <a href="#/topic/dsa-words#w-cycle">Cycle</a>, <a href="#/topic/dsa-words#w-dag">DAG</a>, <a href="#/topic/dsa-words#w-connected-component">Connected component</a>, <a href="#/topic/dsa-words#w-visited">Visited set</a>, <a href="#/topic/dsa-words#w-bipartite">Bipartite</a>, <a href="#/topic/dsa-words#w-bfs">BFS</a>, <a href="#/topic/dsa-words#w-dfs">DFS</a>, <a href="#/topic/dsa-words#w-topological-sort">Topological sort</a>, <a href="#/topic/dsa-words#w-union-find">Union-Find</a>, <a href="#/topic/dsa-words#w-shortest-path">Shortest path</a>, <a href="#/topic/dsa-words#w-mst">MST</a></li>
<li><strong><a href="#/topic/dsa-words#fam-techniques">11. Problem-solving techniques</a></strong>: <a href="#/topic/dsa-words#w-binary-search">Binary search</a>, <a href="#/topic/dsa-words#w-search-space">Search space</a>, <a href="#/topic/dsa-words#w-greedy">Greedy</a>, <a href="#/topic/dsa-words#w-backtracking">Backtracking</a>, <a href="#/topic/dsa-words#w-pruning">Pruning</a>, <a href="#/topic/dsa-words#w-dp">DP</a>, <a href="#/topic/dsa-words#w-subproblem">Subproblem</a>, <a href="#/topic/dsa-words#w-state">State</a>, <a href="#/topic/dsa-words#w-transition">Transition</a></li>
<li><strong><a href="#/topic/dsa-words#fam-bits">12. Bits</a></strong>: <a href="#/topic/dsa-words#w-bit">Bit and binary</a>, <a href="#/topic/dsa-words#w-bitmask">Bitmask</a>, <a href="#/topic/dsa-words#w-xor">XOR</a>, <a href="#/topic/dsa-words#w-set-bit">Set bit</a>, <a href="#/topic/dsa-words#w-overflow">Overflow</a></li>
<li><strong><a href="#/topic/dsa-words#fam-jargon">13. Jargon and named tricks</a></strong>: <a href="#/topic/dsa-words#w-invariant">Invariant</a>, <a href="#/topic/dsa-words#w-sentinel">Sentinel</a>, <a href="#/topic/dsa-words#w-kadane">Kadane's algorithm</a>, <a href="#/topic/dsa-words#w-dutch-national-flag">Dutch national flag</a></li>
</ul>

<div class="callout info" id="fam-basics">
  <div class="callout-title">Family 1 · Basics: arrays and strings</div>
  <p>The words for "a list of things" and the pieces you cut out of it. Picture a corridor of numbered school lockers; we will keep coming back to it.</p>
</div>

<h3 id="w-array">Array</h3>
<p><strong>In plain words:</strong> A list of values kept in order, one after another.</p>
<p><strong>Everyday picture:</strong> A row of school lockers in a corridor. Each locker holds one thing, and the lockers never change order.</p>
<p><strong>Tiny example:</strong> Five test scores, stored as one array:</p>
<pre><code class="language-js">const scores = [70, 85, 90, 60, 75];
console.log(scores.length); // 5 lockers in the row</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-binary-search">Binary Search</a></p>

<h3 id="w-index">Index (plural: indices or indexes)</h3>
<p><strong>In plain words:</strong> The position number of an item in an array. Counting starts at 0, not 1.</p>
<p><strong>Everyday picture:</strong> The number painted on a locker door. The first locker in the corridor is number 0.</p>
<p><strong>Tiny example:</strong> The last index is always <code>length - 1</code>, because we started at 0:</p>
<pre><code class="language-js">const fruits = ["apple", "banana", "cherry"];
// index:          0        1         2
console.log(fruits[0]); // "apple"  (the first locker)
console.log(fruits[2]); // "cherry" (the last locker)
const lastIndex = fruits.length - 1;
console.log(lastIndex); // 2, not 3</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-binary-search">Binary Search</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a></p>

<h3 id="w-element">Element (also: item, value)</h3>
<p><strong>In plain words:</strong> The thing stored at an index. The index says <em>where</em>; the element is <em>what</em>.</p>
<p><strong>Everyday picture:</strong> The locker number is the index. The bag inside the locker is the element.</p>
<p><strong>Tiny example:</strong> In <code>["apple", "banana", "cherry"]</code>, the element at index 1 is <code>"banana"</code>. People mix these two up all the time. "Return the index" and "return the element" are different answers.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-heaps">Heaps</a></p>

<h3 id="w-contiguous">Contiguous</h3>
<p><strong>In plain words:</strong> Next to each other, with no gaps.</p>
<p><strong>Everyday picture:</strong> Cinema seats 4, 5 and 6 are contiguous: your group sits together. Seats 4, 6 and 9 are not.</p>
<p><strong>Tiny example:</strong> In <code>[3, 8, 2, 7]</code>, the items <code>8, 2, 7</code> are contiguous. The items <code>3, 2</code> are not, because <code>8</code> sits between them. When a question says "contiguous", "consecutive" or "in a row", it means this.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a></p>

<h3 id="w-subarray">Subarray</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-contiguous">contiguous</a> slice of an array: a run of neighbours, in their original order.</p>
<p><strong>Everyday picture:</strong> Lockers 1 to 3 in a row. You cannot skip locker 2 in the middle.</p>
<p><strong>Tiny example:</strong> Five days of temperatures. Days 1 to 3 form a subarray:</p>
<pre><code class="language-js">const temps = [30, 32, 29, 35, 31];
// slice(start, end) copies from start up to, but NOT including, end
const middleThree = temps.slice(1, 4);
console.log(middleThree); // [32, 29, 35]</code></pre>
<p>An array of n items has n × (n + 1) / 2 subarrays. For 4 items that is 10. This is why "check every subarray" is slow (see <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a>).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-greedy">Greedy</a></p>

<h3 id="w-substring">Substring</h3>
<p><strong>In plain words:</strong> The same idea as a <a href="#/topic/dsa-words#w-subarray">subarray</a>, but for text: a run of neighbouring characters.</p>
<p><strong>Everyday picture:</strong> Cutting one word out of a sentence with scissors. You get a single unbroken piece.</p>
<p><strong>Tiny example:</strong> "cat" is a substring of "concatenate". "cnt" is not, because the letters are not side by side.</p>
<pre><code class="language-js">const word = "concatenate";
console.log(word.slice(3, 6)); // "cat" (characters at index 3, 4, 5)
console.log(word.includes("cat")); // true
console.log(word.includes("cnt")); // false</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-trie">Trie</a></p>

<h3 id="w-subsequence">Subsequence</h3>
<p><strong>In plain words:</strong> Items picked from an array or string <strong>in their original order</strong>, but gaps are allowed. You may skip items. You may not reorder them.</p>
<p><strong>Everyday picture:</strong> A highlights reel of a cricket match. It skips the dull overs, but the clips still play in match order.</p>
<p><strong>Tiny example:</strong> From <code>[3, 1, 4, 1, 5]</code>, the list <code>[3, 4, 5]</code> is a subsequence (we skipped the 1s). <code>[4, 3]</code> is not, because the order changed. This small check walks the big string once:</p>
<pre><code class="language-js">function isSubsequence(small, big) {
  let smallIndex = 0; // which letter of "small" we are hunting for
  for (let bigIndex = 0; bigIndex &lt; big.length; bigIndex++) {
    if (big[bigIndex] === small[smallIndex]) {
      smallIndex++; // found it, now hunt for the next letter
    }
  }
  return smallIndex === small.length; // found every letter, in order
}
console.log(isSubsequence("ace", "abcde")); // true
console.log(isSubsequence("aec", "abcde")); // false (order is wrong)</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-greedy">Greedy</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a></p>

<h3 id="w-subset">Subset (and power set)</h3>
<p><strong>In plain words:</strong> Any pick of items where <strong>order does not matter</strong>. The "power set" is the list of every possible subset.</p>
<p><strong>Everyday picture:</strong> Choosing pizza toppings. "Cheese and olives" is the same pizza as "olives and cheese".</p>
<p><strong>Tiny example:</strong> For <code>[1, 2, 3]</code> the subsets are: <code>[]</code>, <code>[1]</code>, <code>[2]</code>, <code>[3]</code>, <code>[1, 2]</code>, <code>[1, 3]</code>, <code>[2, 3]</code>, <code>[1, 2, 3]</code>. That is 8 = 2 × 2 × 2, because each item is either in or out. So n items have 2ⁿ subsets (see <a href="#/topic/dsa-words#w-o-2-n">O(2ⁿ)</a>).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-bit">Bit Manipulation</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a></p>

<h3 id="w-permutation">Permutation</h3>
<p><strong>In plain words:</strong> One possible <strong>ordering</strong> of a set of items. Here order is the whole point.</p>
<p><strong>Everyday picture:</strong> The different ways three friends can stand in a line for a photo.</p>
<p><strong>Tiny example:</strong> The permutations of <code>"abc"</code> are <code>abc, acb, bac, bca, cab, cba</code>: 6 of them. With n items there are n × (n − 1) × … × 1 orderings, written n! ("n factorial"). See <a href="#/topic/dsa-words#w-o-n-factorial">O(n!)</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a></p>

<h3 id="w-combination">Combination</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-subset">subset</a> of a fixed size, where order does not matter.</p>
<p><strong>Everyday picture:</strong> Picking 2 friends out of 4 to come to a concert. "Asha and Ben" is the same pick as "Ben and Asha".</p>
<p><strong>Tiny example:</strong> Choosing 2 from <code>[A, B, C, D]</code> gives 6 combinations: <code>AB, AC, AD, BC, BD, CD</code>. If order mattered (permutations), <code>AB</code> and <code>BA</code> would both count, giving 12.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a></p>

<h3 id="w-in-place">In-place</h3>
<p><strong>In plain words:</strong> Changing the array you were given, instead of building a new copy. It needs almost no extra memory.</p>
<p><strong>Everyday picture:</strong> Rearranging books on your own shelf, instead of buying a second shelf to sort them onto.</p>
<p><strong>Tiny example:</strong> Reverse an array in-place by swapping the two ends and moving inwards. <code>left</code> and <code>right</code> are just two index numbers (we call them <a href="#/topic/dsa-words#w-pointer">pointers</a>):</p>
<pre><code class="language-js">const letters = ["a", "b", "c", "d"];
let left = 0;
let right = letters.length - 1;
while (left &lt; right) {
  const temp = letters[left]; // hold one book in your hand
  letters[left] = letters[right];
  letters[right] = temp;
  left++;
  right--;
}
console.log(letters); // ["d", "c", "b", "a"]: same array, no copy made</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-heaps">Heaps</a></p>

<h3 id="w-immutable">Immutable</h3>
<p><strong>In plain words:</strong> Cannot be changed after it is made. In JavaScript, strings are immutable.</p>
<p><strong>Everyday picture:</strong> A printed receipt. To fix a typo, you print a new receipt. You cannot edit the old one.</p>
<p><strong>Tiny example:</strong> Changing one letter of a string silently does nothing. You must build a new string:</p>
<pre><code class="language-js">const name = "Jill";
const fixed = "B" + name.slice(1); // build a brand-new string
console.log(fixed); // "Bill"
console.log(name);  // "Jill": the original never changes</code></pre>
<p>Because of this, gluing a string together with <code>+=</code> inside a long loop can copy the text again and again. The safe habit: push the pieces into an array, then call <code>join("")</code> once at the end.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a></p>

<h3 id="w-prefix-suffix">Prefix and suffix</h3>
<p><strong>In plain words:</strong> A prefix is the start of something. A suffix is the end of it.</p>
<p><strong>Everyday picture:</strong> "un" is a prefix of "undo". "ing" is a suffix of "running".</p>
<p><strong>Tiny example:</strong> For arrays: the first 3 items of <code>[5, 6, 7, 8]</code> are a prefix (<code>[5, 6, 7]</code>). The last 2 are a suffix (<code>[7, 8]</code>). Autocomplete is a prefix search: you type "pre" and it shows every word that starts with it.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-trie">Trie</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a></p>

<h3 id="w-prefix-sum">Prefix sum (running total)</h3>
<p><strong>In plain words:</strong> A second array where each spot holds the total of everything up to that point. It lets you get the sum of any <a href="#/topic/dsa-words#w-subarray">subarray</a> with one subtraction.</p>
<p><strong>Everyday picture:</strong> The odometer in a car. To know the distance from town B to town D, you subtract the reading at B from the reading at D. You do not re-drive the road.</p>
<p><strong>Tiny example:</strong> Sales for five days, and the total for days 1 to 3:</p>
<pre><code class="language-js">const sales = [3, 1, 4, 1, 5];
const prefix = [0]; // prefix[i] = total of the first i days
for (let i = 0; i &lt; sales.length; i++) {
  const runningTotal = prefix[i] + sales[i];
  prefix.push(runningTotal);
}
console.log(prefix); // [0, 3, 4, 8, 9, 14]
// total of days 1, 2, 3 = (total of first 4 days) - (total of first 1 day)
const daysOneToThree = prefix[4] - prefix[1];
console.log(daysOneToThree); // 6, which is 1 + 4 + 1</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a></p>

<h3 id="w-palindrome">Palindrome</h3>
<p><strong>In plain words:</strong> Something that reads the same forwards and backwards.</p>
<p><strong>Everyday picture:</strong> The word "racecar", or the number 12321. Hold it up to a mirror in your head and it looks the same.</p>
<p><strong>Tiny example:</strong> The simplest check: reverse it and compare.</p>
<pre><code class="language-js">const word = "racecar";
const reversed = word.split("").reverse().join("");
console.log(word === reversed); // true</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-linked-list">Linked List</a></p>

<h3 id="w-anagram">Anagram</h3>
<p><strong>In plain words:</strong> Two words made of exactly the same letters, in a different order.</p>
<p><strong>Everyday picture:</strong> Scrabble tiles. "listen" and "silent" use the same six tiles, just rearranged.</p>
<p><strong>Tiny example:</strong> One way to check: sort the letters of both words and compare.</p>
<pre><code class="language-js">function sortLetters(word) {
  return word.split("").sort().join("");
}
console.log(sortLetters("listen")); // "eilnst"
console.log(sortLetters("listen") === sortLetters("silent")); // true</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a></p>

<h3 id="w-matrix">Matrix, grid, 2D array</h3>
<p><strong>In plain words:</strong> An array of arrays: rows and columns.</p>
<p><strong>Everyday picture:</strong> A cinema seating chart, or a spreadsheet. You find a seat by its row and then its column.</p>
<p><strong>Tiny example:</strong> Read it as <code>grid[row][column]</code>:</p>
<pre><code class="language-js">const seats = [
  ["A1", "A2", "A3"],
  ["B1", "B2", "B3"],
];
console.log(seats[1][2]); // "B3": row 1, column 2
console.log(seats.length); // 2 rows
console.log(seats[0].length); // 3 columns</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-binary-search">Binary Search</a></p>

<h3 id="w-sorted">Sorted (and comparator)</h3>
<p><strong>In plain words:</strong> In order, usually smallest to largest ("ascending"). A comparator is the small function that tells <code>sort</code> which of two items comes first.</p>
<p><strong>Everyday picture:</strong> Books on a shelf in alphabetical order. You can find one fast because you know where it must be.</p>
<p><strong>Tiny example:</strong> JavaScript trap: <code>sort()</code> with no comparator compares items as <em>text</em>, so 10 lands before 9.</p>
<pre><code class="language-js">const prices = [10, 9, 1];
// copy first, so prices stays untouched
console.log([...prices].sort()); // [1, 10, 9]: wrong, compared as text
// comparator: a negative result means "a goes first"
const ascending = [...prices].sort((a, b) =&gt; a - b);
console.log(ascending); // [1, 9, 10]</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-binary-search">Binary Search</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-greedy">Greedy</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a></p>

<h3 id="w-stable-sort">Stable sort</h3>
<p><strong>In plain words:</strong> A sort that keeps items with equal keys in the order they started in.</p>
<p><strong>Everyday picture:</strong> Sorting a queue of people by age. Two 30-year-olds keep their original places relative to each other.</p>
<p><strong>Tiny example:</strong> Sort <code>[Ravi 30, Mia 25, Sam 30]</code> by age. A stable sort gives <code>Mia 25, Ravi 30, Sam 30</code>: Ravi stays ahead of Sam. JavaScript's <code>sort</code> is stable in all modern engines.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-greedy">Greedy</a></p>

<h3 id="w-lexicographic">Lexicographic order</h3>
<p><strong>In plain words:</strong> Dictionary order: compare letter by letter from the left.</p>
<p><strong>Everyday picture:</strong> How words are listed in a paper dictionary. "apple" comes before "apply" because at the fifth letter, "e" comes before "y".</p>
<p><strong>Tiny example:</strong> It treats digits as text too, so the string "10" comes before "9" (because "1" comes before "9"). Questions saying "return the answers in lexicographic order" just want dictionary order.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a></p>

<h3 id="w-interval">Interval</h3>
<p><strong>In plain words:</strong> A pair <code>[start, end]</code> that describes a stretch of time or numbers.</p>
<p><strong>Everyday picture:</strong> A meeting in your calendar from 9:00 to 10:30.</p>
<p><strong>Tiny example:</strong> Two meetings overlap when each one starts before the other one ends:</p>
<pre><code class="language-js">const standup = { start: 9, end: 10 };
const review = { start: 9.5, end: 11 };
const overlaps = standup.start &lt; review.end &amp;&amp; review.start &lt; standup.end;
console.log(overlaps); // true: the review starts before stand-up finishes</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-greedy">Greedy</a> · <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-binary-search">Binary Search</a></p>

<h3 id="w-half-open-range">Half-open range [start, end)</h3>
<p><strong>In plain words:</strong> A range that <strong>includes</strong> start but <strong>stops just before</strong> end. The square bracket means "included"; the round bracket means "not included".</p>
<p><strong>Everyday picture:</strong> A hotel booking from the 1st to the 4th. You sleep the nights of the 1st, 2nd and 3rd. You leave on the 4th.</p>
<p><strong>Tiny example:</strong> <code>slice(1, 4)</code> uses a half-open range: it takes indexes 1, 2 and 3. A nice bonus: the number of items is simply <code>end - start</code> (4 − 1 = 3).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-binary-search">Binary Search</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a></p>

<h3 id="w-off-by-one">Off-by-one error</h3>
<p><strong>In plain words:</strong> A bug where a loop or range goes one step too far, or stops one step short.</p>
<p><strong>Everyday picture:</strong> Fence posts. A 10-metre fence with a post every metre needs 11 posts, not 10.</p>
<p><strong>Tiny example:</strong> Using <code>&lt;=</code> instead of <code>&lt;</code> reads one locker past the end:</p>
<pre><code class="language-js">const marks = [4, 7, 9];
const seen = [];
for (let i = 0; i &lt;= marks.length; i++) { // bug: should be i &lt; marks.length
  seen.push(marks[i]);
}
console.log(seen); // [4, 7, 9, undefined]: one step too far</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-binary-search">Binary Search</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a></p>

<h3 id="w-edge-case">Edge case</h3>
<p><strong>In plain words:</strong> An unusual input at the limits, where code often breaks. It has nothing to do with graph <a href="#/topic/dsa-words#w-edge">edges</a>.</p>
<p><strong>Everyday picture:</strong> Testing a lift with nobody inside, and with the maximum number of people. Normal use is easy; the extremes find the bugs.</p>
<p><strong>Tiny example:</strong> The usual suspects: an empty array <code>[]</code>, one item <code>[5]</code>, all items equal <code>[2, 2, 2]</code>, negative numbers, duplicates, and very large inputs. Interviewers love it when you list these before coding.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-binary-search">Binary Search</a></p>

<div class="callout info" id="fam-pointers">
  <div class="callout-title">Family 2 · Pointers and windows</div>
  <p>Ways to keep your place while you walk through an array. Back to the lockers: a pointer is a finger resting on one locker.</p>
</div>

<h3 id="w-pointer">Pointer</h3>
<p><strong>In plain words:</strong> In DSA, a pointer is just a variable that remembers <strong>where you are looking</strong>: usually an <a href="#/topic/dsa-words#w-index">index</a>, sometimes a <a href="#/topic/dsa-words#w-node">node</a>. It is not the scary memory pointer from C.</p>
<p><strong>Everyday picture:</strong> Your finger resting on one line of a page while you read.</p>
<p><strong>Tiny example:</strong> <code>position</code> below is a pointer. It "points at" the locker we are checking:</p>
<pre><code class="language-js">const queueOfOrders = ["tea", "coffee", "juice"];
let position = 0; // the pointer: our finger starts on locker 0
while (position &lt; queueOfOrders.length) {
  console.log("Now serving " + queueOfOrders[position]);
  position++; // move the finger one locker to the right
}</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-linked-list">Linked List</a> · <a href="#/topic/dsa-binary-search">Binary Search</a></p>

<h3 id="w-two-pointers">Two pointers</h3>
<p><strong>In plain words:</strong> Two <a href="#/topic/dsa-words#w-pointer">pointers</a> moving through the data at the same time. Often one starts at each end and they walk towards each other.</p>
<p><strong>Everyday picture:</strong> Two friends searching a long bookshelf, one from each end, walking towards the middle.</p>
<p><strong>Tiny example:</strong> In a <a href="#/topic/dsa-words#w-sorted">sorted</a> array, find two numbers that add up to 8. If the sum is too big, move the right finger left (to a smaller number). If too small, move the left finger right.</p>
<pre><code class="language-js">const numbers = [1, 2, 4, 6, 9]; // sorted
const target = 8;
let left = 0;
let right = numbers.length - 1;
while (left &lt; right) {
  const sum = numbers[left] + numbers[right];
  if (sum === target) {
    console.log(numbers[left], numbers[right]); // 2 6
    break;
  } else if (sum &gt; target) {
    right--; // too big: try a smaller right-hand number
  } else {
    left++; // too small: try a bigger left-hand number
  }
}
// steps: 1+9=10 (too big), 1+6=7 (too small), 2+6=8 (found)</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-linked-list">Linked List</a></p>

<h3 id="w-window">Window (sliding window)</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-subarray">subarray</a> marked by a <code>left</code> and a <code>right</code> pointer, which slides along the array. A fixed window always has the same size. A variable window grows and shrinks.</p>
<p><strong>Everyday picture:</strong> A camera viewfinder panning across a landscape. Whatever is inside the frame right now is the window.</p>
<p><strong>Tiny example:</strong> Best total of 3 days in a row. When the window slides, one day enters on the right and one day leaves on the left. We adjust the total instead of re-adding everything.</p>
<pre><code class="language-js">const visitors = [4, 2, 7, 1, 8, 3];
const windowSize = 3;
let windowSum = 0;
for (let i = 0; i &lt; windowSize; i++) {
  windowSum += visitors[i]; // first window: 4 + 2 + 7 = 13
}
let bestSum = windowSum;
for (let right = windowSize; right &lt; visitors.length; right++) {
  const leaving = visitors[right - windowSize]; // day sliding out on the left
  windowSum = windowSum + visitors[right] - leaving;
  if (windowSum &gt; bestSum) {
    bestSum = windowSum;
  }
}
console.log(bestSum); // 16, from 7 + 1 + 8</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a></p>

<div class="callout info" id="fam-big-o">
  <div class="callout-title">Family 3 · Big-O: how work grows</div>
  <p>Words for "how slow does this get when the input gets bigger?" No maths degree needed: it is mostly counting loops.</p>
</div>

<h3 id="w-input-size">n (input size)</h3>
<p><strong>In plain words:</strong> The letter <strong>n</strong> means "how many items you were given".</p>
<p><strong>Everyday picture:</strong> The number of guests at a party. It decides how many plates you need.</p>
<p><strong>Tiny example:</strong> For <code>[5, 8, 2]</code>, n = 3. For the string "hello", n = 5. With two inputs we use two letters, like n and m. For <a href="#/topic/dsa-words#w-graph">graphs</a> we write <strong>V</strong> (number of <a href="#/topic/dsa-words#w-vertex">vertices</a>) and <strong>E</strong> (number of <a href="#/topic/dsa-words#w-edge">edges</a>).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-big-o">Big-O</h3>
<p><strong>In plain words:</strong> A rough label for <strong>how the work grows as n grows</strong>. It is not a time in seconds. Strictly, Big-O means "grows no faster than this" (an upper bound).</p>
<p><strong>Everyday picture:</strong> Inviting friends to a party. Phoning each friend takes more work with every extra friend. Posting once in the group chat takes the same work for 5 friends or 500. Big-O names that difference.</p>
<p><strong>Tiny example:</strong> Two rules. Drop the fixed numbers: <code>2n</code> steps is still <code>O(n)</code>. Keep only the biggest part: <code>n² + n</code> steps is <code>O(n²)</code>, because for big n the n² part swamps everything else.</p>
<pre><code class="language-js">const guests = ["Asha", "Ben", "Chen", "Dev"];
let steps = 0;
for (const guest of guests) {
  steps++; // one phone call per guest
}
for (const guest of guests) {
  steps++; // one thank-you message per guest
}
console.log(steps); // 8 = 2 x n, still called O(n): it grows in step with n</code></pre>
<p>You may also see Θ ("theta", exact growth) and Ω ("omega", at least this much). In interviews, people say Big-O and mean the realistic growth.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a></p>

<h3 id="w-time-complexity">Time complexity</h3>
<p><strong>In plain words:</strong> The <a href="#/topic/dsa-words#w-big-o">Big-O</a> of how many <strong>steps</strong> the code takes.</p>
<p><strong>Everyday picture:</strong> How long a recipe takes to cook, as the number of guests grows.</p>
<p><strong>Tiny example:</strong> One loop over n items: <code>O(n)</code> time. A loop inside a loop over the same items: <code>O(n²)</code> time.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a></p>

<h3 id="w-space-complexity">Space complexity</h3>
<p><strong>In plain words:</strong> The <a href="#/topic/dsa-words#w-big-o">Big-O</a> of how much <strong>extra memory</strong> the code creates. The input itself does not count.</p>
<p><strong>Everyday picture:</strong> Time is how long you cook. Space is how many extra bowls you dirty.</p>
<p><strong>Tiny example:</strong> Copying the array into a <code>Set</code>: <code>O(n)</code> space. Using just two counters: <code>O(1)</code> space. Waiting <a href="#/topic/dsa-words#w-recursion">recursive</a> calls take space too, one "bowl" per waiting call (see <a href="#/topic/dsa-words#w-call-stack">call stack</a>).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-trees">Trees</a></p>

<h3 id="w-o-1">O(1): constant time</h3>
<p><strong>In plain words:</strong> The work stays the same, however big the input gets.</p>
<p><strong>Everyday picture:</strong> You know the exact locker number, so you walk straight to it. 10 lockers or 10,000, it is one trip.</p>
<p><strong>Tiny example:</strong> Reading <code>array[5]</code>, <code>map.get(key)</code>, and <code>array.push(x)</code> are all O(1) (push is amortized O(1): see <a href="#/topic/dsa-words#w-amortized">Amortized</a>).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a></p>

<h3 id="w-o-log-n">O(log n): logarithmic time</h3>
<p><strong>In plain words:</strong> Each step <strong>cuts the problem in half</strong>. "log n" is simply how many times you can halve n before you reach 1.</p>
<p><strong>Everyday picture:</strong> The "higher or lower" guessing game for a number from 1 to 100. Always guess the middle, and you need at most 7 guesses.</p>
<p><strong>Tiny example:</strong> Even a million items need only about 20 halvings:</p>
<pre><code class="language-js">let itemsLeft = 1000000;
let halvings = 0;
while (itemsLeft &gt; 1) {
  itemsLeft = Math.floor(itemsLeft / 2); // throw away half
  halvings++;
}
console.log(halvings); // 19: about 20 steps for a million items</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-binary-search">Binary Search</a> · <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-complexity">Complexity Analysis</a></p>

<h3 id="w-o-n">O(n): linear time</h3>
<p><strong>In plain words:</strong> The work grows in step with the input: twice the items, twice the work.</p>
<p><strong>Everyday picture:</strong> A ticket checker at a stadium gate. 1,000 fans means 1,000 tickets checked.</p>
<p><strong>Tiny example:</strong> One loop through the array, doing O(1) work for each item:</p>
<pre><code class="language-js">const prices = [120, 80, 300, 45];
let total = 0;
for (const price of prices) {
  total += price; // one step per item
}
console.log(total); // 545</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a></p>

<h3 id="w-o-n-log-n">O(n log n)</h3>
<p><strong>In plain words:</strong> n items, and each item gets handled about log n times. This is the speed of good sorting.</p>
<p><strong>Everyday picture:</strong> Sorting a pile of exam papers. Split the pile in half again and again (about log n rounds of splitting), then merge the piles back in order. Each round touches all n papers.</p>
<p><strong>Tiny example:</strong> For a million items: about 1,000,000 × 20 = 20 million steps. That is fine. JavaScript's <code>sort</code> is O(n log n).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-greedy">Greedy</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a></p>

<h3 id="w-o-n-squared">O(n²): quadratic time</h3>
<p><strong>In plain words:</strong> Usually a loop inside a loop. Double the items and the work goes up four times.</p>
<p><strong>Everyday picture:</strong> At a party, every guest shakes hands with every other guest. 10 guests is 45 handshakes; 1,000 guests is about 500,000.</p>
<p><strong>Tiny example:</strong> Checking every pair:</p>
<pre><code class="language-js">const guests = ["A", "B", "C", "D"];
let handshakes = 0;
for (let i = 0; i &lt; guests.length; i++) {
  for (let j = i + 1; j &lt; guests.length; j++) {
    handshakes++; // guest i shakes hands with guest j
  }
}
console.log(handshakes); // 6 for 4 guests</code></pre>
<p>For 1,000 items that is about a million steps. For 100,000 items it is too slow for an interview answer.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-hashing">Hashing</a></p>

<h3 id="w-o-2-n">O(2ⁿ): exponential time</h3>
<p><strong>In plain words:</strong> The work <strong>doubles</strong> with every extra item. This happens when you try every <a href="#/topic/dsa-words#w-subset">subset</a>.</p>
<p><strong>Everyday picture:</strong> A row of light switches. Each one is on or off. 10 switches give 1,024 patterns; 30 switches give over a billion.</p>
<p><strong>Tiny example:</strong> Fine for n up to about 20 to 25. After that it is hopeless, and you need a smarter idea such as <a href="#/topic/dsa-words#w-memoization">memoization</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-bit">Bit Manipulation</a></p>

<h3 id="w-o-n-factorial">O(n!): factorial time</h3>
<p><strong>In plain words:</strong> The work of trying every <a href="#/topic/dsa-words#w-permutation">ordering</a> of n items.</p>
<p><strong>Everyday picture:</strong> Seating guests at a dinner table in every possible order. 10 guests have 3,628,800 seatings.</p>
<p><strong>Tiny example:</strong> Only workable for n up to about 10 to 12. Generating all permutations is the classic example.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-complexity">Complexity Analysis</a></p>

<h3 id="w-worst-average-case">Worst, average and best case</h3>
<p><strong>In plain words:</strong> The same code can be fast on lucky inputs and slow on unlucky ones. Worst case is the slowest possible input; average case is what you usually get.</p>
<p><strong>Everyday picture:</strong> Your commute is usually 20 minutes (average), but 90 minutes in a storm (worst case).</p>
<p><strong>Tiny example:</strong> A <a href="#/topic/dsa-words#w-hash-map">hash map</a> lookup is O(1) on average, but O(n) in the worst case if every key lands in the same slot. Interviewers like it when you say both.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-binary-search">Binary Search</a></p>

<h3 id="w-amortized">Amortized</h3>
<p><strong>In plain words:</strong> The average cost per operation <strong>over a long run</strong>, where a rare expensive step is paid off by many cheap ones.</p>
<p><strong>Everyday picture:</strong> A monthly metro pass. One big payment, then every ride is free. Spread over 30 days, each ride costs very little.</p>
<p><strong>Tiny example:</strong> A JavaScript array sometimes has to move everything into a bigger block of memory when you <code>push</code>. That is rare, so each push is "O(1) amortized". This simulation counts the copying:</p>
<pre><code class="language-js">let capacity = 1;
let size = 0;
let totalCopies = 0;
for (let push = 1; push &lt;= 1000; push++) {
  if (size === capacity) {
    totalCopies += size; // full: move every item into a box twice as big
    capacity = capacity * 2;
  }
  size++;
}
console.log(totalCopies); // 1023 copies for 1000 pushes: about 1 per push</code></pre>
<p>This is not the same as "average case". Average case is about lucky or unlucky <em>inputs</em>. Amortized is a guarantee about a long <em>run</em> of operations, whatever the input.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a></p>

<h3 id="w-brute-force">Brute force</h3>
<p><strong>In plain words:</strong> Try every possibility. Simple and correct, but usually slow.</p>
<p><strong>Everyday picture:</strong> Trying every key on a big key ring until the door opens.</p>
<p><strong>Tiny example:</strong> Find two numbers that add to a target by checking every pair: <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a>. In an interview, say the brute force first, then improve it.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a></p>

<h3 id="w-trade-off">Time-space trade-off</h3>
<p><strong>In plain words:</strong> Spending extra memory to save time, or the other way round.</p>
<p><strong>Everyday picture:</strong> Writing a friend's number on a sticky note so you do not have to scroll your contacts every time.</p>
<p><strong>Tiny example:</strong> Checking "have I seen this number?" with <code>array.includes</code> is O(n) per check. Keeping a <code>Set</code> costs O(n) memory, but each check becomes O(1).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a></p>

<h3 id="w-constraints">Constraints</h3>
<p><strong>In plain words:</strong> The limits in the problem statement, like "1 ≤ n ≤ 100,000". They hint at how fast your answer must be.</p>
<p><strong>Everyday picture:</strong> The size of the guest list tells you whether you can phone everyone, or must post in the group chat.</p>
<p><strong>Tiny example:</strong> A rough guide:</p>
<div class="diagram"><pre>n up to about 20       -&gt;  O(2^n) is fine (try every subset)
n up to about 10,000   -&gt;  O(n^2) is usually OK
n up to about 1,000,000 -&gt; you need O(n log n) or O(n)</pre></div>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a></p>

<h3 id="w-divide-and-conquer">Divide and conquer</h3>
<p><strong>In plain words:</strong> Split the problem into smaller halves, solve each half, then combine the answers.</p>
<p><strong>Everyday picture:</strong> Two teachers marking a stack of 100 papers: each takes 50, then they combine the results.</p>
<p><strong>Tiny example:</strong> Merge sort splits the array in half, sorts each half, then merges the two sorted halves. Splitting gives about log n levels, and each level does n work, so it is <a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-linked-list">Linked List</a> · <a href="#/topic/dsa-binary-search">Binary Search</a></p>

<h3 id="w-master-theorem">Master Theorem (and recurrence)</h3>
<p><strong>In plain words:</strong> A recurrence is a formula that describes a recursive function's work in terms of smaller calls. The Master Theorem is a shortcut that turns common ones into a Big-O.</p>
<p><strong>Everyday picture:</strong> A ready-reckoner chart: look up the shape of your recursion and read off the answer.</p>
<p><strong>Tiny example:</strong> Merge sort: "two half-size calls plus n work to merge", written <code>T(n) = 2T(n/2) + n</code>. That gives O(n log n). Binary search: "one half-size call plus a little work", <code>T(n) = T(n/2) + 1</code>. That gives O(log n). You rarely need the full theorem in interviews; knowing these two results is usually enough.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a></p>

<div class="callout info" id="fam-recursion">
  <div class="callout-title">Family 4 · Recursion and remembering</div>
  <p>Functions that call themselves, and the tricks for not doing the same work twice.</p>
</div>

<h3 id="w-recursion">Recursion</h3>
<p><strong>In plain words:</strong> A function that solves a problem by calling <strong>itself</strong> on a smaller piece of the same problem.</p>
<p><strong>Everyday picture:</strong> Russian nesting dolls. Open one and there is a smaller doll inside, until you reach the tiny one that does not open.</p>
<p><strong>Tiny example:</strong> A countdown, where each call handles one number and passes the rest on:</p>
<pre><code class="language-js">function countDown(number) {
  if (number === 0) {
    console.log("Lift off!"); // the tiny doll: stop here
    return;
  }
  console.log(number);
  countDown(number - 1); // same job, smaller number
}
countDown(3); // 3, 2, 1, Lift off!</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-base-case">Base case</h3>
<p><strong>In plain words:</strong> The stopping rule in a <a href="#/topic/dsa-words#w-recursion">recursive</a> function: the smallest version of the problem, answered directly.</p>
<p><strong>Everyday picture:</strong> The smallest nesting doll, the one that does not open.</p>
<p><strong>Tiny example:</strong> In <code>countDown</code> above, <code>if (number === 0)</code> is the base case. Without it, the function calls itself forever, and JavaScript crashes with a <a href="#/topic/dsa-words#w-stack-overflow">stack overflow</a>. For trees, the base case is usually "the node is null".</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a></p>

<h3 id="w-call-stack">Call stack</h3>
<p><strong>In plain words:</strong> The list JavaScript keeps of functions that have started but not finished yet. Each call adds an entry; each <code>return</code> removes one.</p>
<p><strong>Everyday picture:</strong> A pile of sticky notes saying "come back here when you are done". The newest note is on top, and you handle that one first.</p>
<p><strong>Tiny example:</strong> While <code>countDown(3)</code> runs, the pile grows: <code>countDown(3)</code>, then <code>countDown(2)</code> on top, then <code>countDown(1)</code>, then <code>countDown(0)</code>. Then it shrinks again. The tallest the pile gets (the recursion depth) is memory, so it counts towards <a href="#/topic/dsa-words#w-space-complexity">space complexity</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a></p>

<h3 id="w-stack-overflow">Stack overflow</h3>
<p><strong>In plain words:</strong> The <a href="#/topic/dsa-words#w-call-stack">call stack</a> gets too tall and JavaScript gives up with <code>RangeError: Maximum call stack size exceeded</code>.</p>
<p><strong>Everyday picture:</strong> The pile of sticky notes reaches the ceiling.</p>
<p><strong>Tiny example:</strong> A missing <a href="#/topic/dsa-words#w-base-case">base case</a> causes it. So can very deep (but correct) recursion, such as walking a long linked list one call per node. JavaScript does not reliably optimise "tail calls" (a call that is the very last thing a function does), so you cannot count on that to save you. The fix is a loop (see <a href="#/topic/dsa-words#w-iterative">iterative</a>).</p>
<pre><code class="language-js">function forever(n) {
  return forever(n + 1); // no base case, so it never stops
}
try {
  forever(0);
} catch (error) {
  console.log(error instanceof RangeError); // true
}</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-linked-list">Linked List</a></p>

<h3 id="w-iterative">Iterative</h3>
<p><strong>In plain words:</strong> Solving it with a loop instead of <a href="#/topic/dsa-words#w-recursion">recursion</a>.</p>
<p><strong>Everyday picture:</strong> Climbing the stairs yourself, step by step, instead of asking a friend to ask a friend to ask a friend.</p>
<p><strong>Tiny example:</strong> Any recursion can be rewritten as a loop. When the recursion has to "come back" to earlier work, the loop keeps its own <a href="#/topic/dsa-words#w-stack">stack</a> array to remember where it was.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-memoization">Memoization (top-down)</h3>
<p><strong>In plain words:</strong> Remember the answer to every call you have already worked out, so you never work it out twice. Also called "top-down" <a href="#/topic/dsa-words#w-dp">dynamic programming</a>.</p>
<p><strong>Everyday picture:</strong> Writing answers on a cheat sheet. The second time someone asks "what is 7 × 8?", you just read it off.</p>
<p><strong>Tiny example:</strong> Fibonacci numbers (each is the sum of the two before it). Without the memo, <code>fib(50)</code> would take billions of calls. With it, each number is worked out once:</p>
<pre><code class="language-js">const memo = new Map(); // n -&gt; fib(n), filled in as we go
function fib(n) {
  if (n &lt;= 1) {
    return n; // base cases: fib(0) = 0, fib(1) = 1
  }
  if (memo.has(n)) {
    return memo.get(n); // already worked out: reuse it
  }
  const answer = fib(n - 1) + fib(n - 2);
  memo.set(n, answer); // write it on the cheat sheet
  return answer;
}
console.log(fib(50)); // 12586269025, instantly</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-trees">Trees</a></p>

<h3 id="w-tabulation">Tabulation (bottom-up)</h3>
<p><strong>In plain words:</strong> Fill in a table of answers with a loop, starting from the smallest case and building upwards. No recursion needed.</p>
<p><strong>Everyday picture:</strong> Building a staircase from the bottom step up. Each new step rests on the ones already built.</p>
<p><strong>Tiny example:</strong> The same Fibonacci, as a table:</p>
<pre><code class="language-js">const n = 10;
const table = [0, 1]; // table[i] holds fib(i)
for (let i = 2; i &lt;= n; i++) {
  table[i] = table[i - 1] + table[i - 2]; // build on the two steps below
}
console.log(table[n]); // 55</code></pre>
<p>Often you only need the last two rows, so you can keep two variables instead of the whole table. That is called "space-optimised".</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-dp">Dynamic Programming</a></p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples — The Glossary, Part 2", collapsible: true, html: `
<p>The rest of the glossary: the data structures, the graph words, the big techniques, bits, and the jargon that explanations drop in without warning. Back to the <a href="#/topic/dsa-words#glossary-contents">full word list</a>.</p>

<div class="callout info" id="fam-hashing">
  <div class="callout-title">Family 5 · Hashing: instant lookups</div>
  <p>Structures that find things by name instead of by position.</p>
</div>

<h3 id="w-hash-map">Hash map (JavaScript: Map)</h3>
<p><strong>In plain words:</strong> Stores <strong>key → value</strong> pairs and finds a value by its key in <a href="#/topic/dsa-words#w-o-1">O(1)</a> time on average.</p>
<p><strong>Everyday picture:</strong> A coat check. You hand over ticket 42 and get your coat straight away. Nobody searches the whole rack.</p>
<p><strong>Tiny example:</strong> In JavaScript, use <code>Map</code> (a plain object also works for string keys):</p>
<pre><code class="language-js">const phoneBook = new Map();
phoneBook.set("Asha", "98100 11111"); // key "Asha" -&gt; her number
phoneBook.set("Ben", "98100 22222");
console.log(phoneBook.get("Ben")); // "98100 22222", found instantly
console.log(phoneBook.has("Chen")); // false</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-linked-list">Linked List</a></p>

<h3 id="w-hash-set">Hash set (JavaScript: Set)</h3>
<p><strong>In plain words:</strong> Stores unique values only, and answers "have I seen this before?" in <a href="#/topic/dsa-words#w-o-1">O(1)</a> time on average.</p>
<p><strong>Everyday picture:</strong> The guest list at the door. The bouncer checks your name in a moment, and nobody is on it twice.</p>
<p><strong>Tiny example:</strong> Spot the first repeated number:</p>
<pre><code class="language-js">const readings = [4, 9, 2, 9, 5];
const seen = new Set();
for (const value of readings) {
  if (seen.has(value)) {
    console.log("First repeat: " + value); // First repeat: 9
    break;
  }
  seen.add(value); // remember it for later
}</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-linked-list">Linked List</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-hash-function">Hash function and collision</h3>
<p><strong>In plain words:</strong> A hash map turns each key into a slot number using a <strong>hash function</strong>. When two keys land in the same slot, that is a <strong>collision</strong>.</p>
<p><strong>Everyday picture:</strong> A library that shelves books by first letter. "Dune" and "Dracula" both go to shelf D: a collision. The librarian has to look through shelf D.</p>
<p><strong>Tiny example:</strong> A toy hash function that adds up the letter codes. "cat" and "act" collide:</p>
<pre><code class="language-js">function toyHash(word, slotCount) {
  let total = 0;
  for (const letter of word) {
    total += letter.charCodeAt(0); // each letter has a number code
  }
  return total % slotCount; // wrap the total into one of the slots
}
console.log(toyHash("cat", 10)); // 2
console.log(toyHash("act", 10)); // 2 as well: a collision</code></pre>
<p>Collisions are why lookups are O(1) on <em>average</em> but O(n) in the <a href="#/topic/dsa-words#w-worst-average-case">worst case</a>. Real hash functions are much better at spreading keys out.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-complexity">Complexity Analysis</a></p>

<h3 id="w-frequency-map">Frequency map (counter)</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-hash-map">Map</a> from each value to <strong>how many times</strong> it appears.</p>
<p><strong>Everyday picture:</strong> Tally marks on a whiteboard during a class vote.</p>
<p><strong>Tiny example:</strong> Counting votes. We read the old count into a variable first, so the line stays easy to read:</p>
<pre><code class="language-js">const votes = ["tea", "coffee", "tea", "juice", "tea"];
const countOf = new Map();
for (const drink of votes) {
  let currentCount = 0; // not seen yet means 0 votes so far
  if (countOf.has(drink)) {
    currentCount = countOf.get(drink);
  }
  countOf.set(drink, currentCount + 1);
}
console.log(countOf.get("tea")); // 3</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a></p>

<h3 id="w-complement">Complement</h3>
<p><strong>In plain words:</strong> The value you still need to reach a target: <code>target - current</code>.</p>
<p><strong>Everyday picture:</strong> Something costs ₹100 and you hold ₹70. The complement is the ₹30 you still need.</p>
<p><strong>Tiny example:</strong> The famous "two sum": for each number, ask the <a href="#/topic/dsa-words#w-hash-map">Map</a> whether its complement has already gone past.</p>
<pre><code class="language-js">const prices = [40, 25, 60, 75];
const budget = 100;
const indexOfPrice = new Map(); // price -&gt; where we saw it
for (let i = 0; i &lt; prices.length; i++) {
  const needed = budget - prices[i]; // the complement
  if (indexOfPrice.has(needed)) {
    console.log(indexOfPrice.get(needed), i); // 0 2  (40 + 60)
    break;
  }
  indexOfPrice.set(prices[i], i);
}</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a></p>

<div class="callout info" id="fam-stacks">
  <div class="callout-title">Family 6 · Stacks and queues</div>
  <p>Two ways to line things up, depending on who should go next.</p>
</div>

<h3 id="w-stack">Stack (LIFO)</h3>
<p><strong>In plain words:</strong> A pile where the <strong>last</strong> thing you put on is the <strong>first</strong> thing you take off. "LIFO" = last in, first out.</p>
<p><strong>Everyday picture:</strong> A stack of plates. You always take the top plate, the one put down most recently. Your browser's Back button works the same way.</p>
<p><strong>Tiny example:</strong> A JavaScript array with <code>push</code> and <code>pop</code> is a stack. Both are O(1) (push is amortized O(1): see <a href="#/topic/dsa-words#w-amortized">Amortized</a>).</p>
<pre><code class="language-js">const history = [];
history.push("home");
history.push("search");
history.push("product"); // the newest page is on top
const lastPage = history.pop(); // Back button: take the top plate
console.log(lastPage); // "product"
console.log(history); // ["home", "search"]</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a> · <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-backtracking">Backtracking</a></p>

<h3 id="w-queue">Queue (FIFO)</h3>
<p><strong>In plain words:</strong> A line where the <strong>first</strong> one in is the <strong>first</strong> one out. "FIFO" = first in, first out.</p>
<p><strong>Everyday picture:</strong> The queue at a ticket counter, or documents waiting at a printer.</p>
<p><strong>Tiny example:</strong> Careful: <code>array.shift()</code> removes the front item but slides every other item down one place, which is <a href="#/topic/dsa-words#w-o-n">O(n)</a>. A simple fix is to keep a "front" index instead:</p>
<pre><code class="language-js">const queue = [];
let front = 0; // index of the person at the front of the line
queue.push("Asha");
queue.push("Ben");
queue.push("Chen");
const served = queue[front]; // first in, first out
front++; // move the front forward instead of calling shift()
console.log(served); // "Asha"
console.log(queue[front]); // "Ben" is next</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a> · <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-trees">Trees</a></p>

<h3 id="w-deque">Deque (said "deck")</h3>
<p><strong>In plain words:</strong> A double-ended queue: you can add and remove at <strong>both</strong> ends.</p>
<p><strong>Everyday picture:</strong> A deck of cards where you may take from the top or the bottom.</p>
<p><strong>Tiny example:</strong> JavaScript has no built-in deque. In interviews people use an array (and mention that <code>shift</code>/<code>unshift</code> are O(n)), or write a small one with a <a href="#/topic/dsa-words#w-linked-list">linked list</a>. It powers the <a href="#/topic/dsa-words#w-monotonic-deque">monotonic deque</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-monotonic">Monotonic</h3>
<p><strong>In plain words:</strong> Only ever moving in <strong>one direction</strong>: never going down, or never going up.</p>
<p><strong>Everyday picture:</strong> A car's odometer. It only ever goes up.</p>
<p><strong>Tiny example:</strong> <code>[1, 3, 3, 7]</code> is monotonic increasing (it never goes down; equal neighbours are fine). <code>[9, 5, 2]</code> is monotonic decreasing. <code>[1, 3, 2]</code> is not monotonic.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-binary-search">Binary Search</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a></p>

<h3 id="w-monotonic-stack">Monotonic stack</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-stack">stack</a> kept in <a href="#/topic/dsa-words#w-monotonic">monotonic</a> order. Before pushing a new item, you pop every item that would break the order.</p>
<p><strong>Everyday picture:</strong> A line of people, each waiting for someone taller than them to turn up. When a tall person arrives, everyone shorter at the end of the line has found their answer and leaves. Here, "taller" means "warmer".</p>
<p><strong>Tiny example:</strong> For each day, find the next warmer temperature. Days wait on the stack until a warmer day pops them:</p>
<pre><code class="language-js">const temps = [73, 74, 75, 71, 69, 72, 76];
const nextWarmer = new Array(temps.length).fill(-1); // -1 = no warmer day ahead
const waiting = []; // stack of day indexes still waiting for a warmer day
for (let day = 0; day &lt; temps.length; day++) {
  while (waiting.length &gt; 0 &amp;&amp; temps[day] &gt; temps[waiting[waiting.length - 1]]) {
    const colderDay = waiting.pop(); // today is the warmer day it waited for
    nextWarmer[colderDay] = temps[day];
  }
  waiting.push(day);
}
console.log(nextWarmer); // [74, 75, 76, 72, 72, 76, -1]</code></pre>
<p>Each day is pushed once and popped at most once, so the whole thing is O(n), even with the loop inside a loop.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a></p>

<h3 id="w-monotonic-deque">Monotonic deque</h3>
<p><strong>In plain words:</strong> The same idea as a <a href="#/topic/dsa-words#w-monotonic-stack">monotonic stack</a>, but in a <a href="#/topic/dsa-words#w-deque">deque</a>, so old items can also leave from the front.</p>
<p><strong>Everyday picture:</strong> The same waiting line, but each person also has a time slot. When their slot ends, they leave from the front of the line, even if nobody taller has come.</p>
<p><strong>Tiny example:</strong> Its classic use is "the biggest number in every <a href="#/topic/dsa-words#w-window">window</a> of size k". The front of the deque always holds the biggest number in the current window. It runs in O(n) instead of O(n × k).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a></p>

<div class="callout info" id="fam-linked">
  <div class="callout-title">Family 7 · Linked lists</div>
  <p>Lists made of separate boxes joined by arrows, instead of one row of lockers.</p>
</div>

<h3 id="w-node">Node</h3>
<p><strong>In plain words:</strong> One box in a structure. It holds a value, plus links ("pointers") to other boxes.</p>
<p><strong>Everyday picture:</strong> A treasure-hunt clue card. It has a prize written on it, and it tells you where the next card is hidden.</p>
<p><strong>Tiny example:</strong> In JavaScript, a node is just an object:</p>
<pre><code class="language-js">const card = { value: "Prize 1", next: null }; // next: where the next card is
console.log(card.value); // "Prize 1"</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-linked-list">Linked List</a> · <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-trie">Trie</a></p>

<h3 id="w-linked-list">Linked list</h3>
<p><strong>In plain words:</strong> A chain of <a href="#/topic/dsa-words#w-node">nodes</a>, each one pointing to the next. There are no index numbers: to reach the 5th node, you walk from the start.</p>
<p><strong>Everyday picture:</strong> The treasure hunt. You cannot jump to clue 5. You must follow clue 1, then 2, then 3.</p>
<p><strong>Tiny example:</strong> Build three nodes and walk the chain:</p>
<pre><code class="language-js">const third = { value: 30, next: null };
const second = { value: 20, next: third };
const first = { value: 10, next: second };
let current = first; // start at the beginning
while (current !== null) {
  console.log(current.value); // 10, then 20, then 30
  current = current.next; // follow the arrow
}</code></pre>
<p>The upside: adding or removing a node in the middle is O(1) once you are standing there, because nothing has to shift. A "doubly" linked list also has a <code>prev</code> arrow pointing backwards.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-linked-list">Linked List</a> · <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a></p>

<h3 id="w-head-tail">Head and tail</h3>
<p><strong>In plain words:</strong> The head is the first <a href="#/topic/dsa-words#w-node">node</a> of a <a href="#/topic/dsa-words#w-linked-list">linked list</a>. The tail is the last one: its <code>next</code> is <code>null</code>.</p>
<p><strong>Everyday picture:</strong> The engine and the last carriage of a train.</p>
<p><strong>Tiny example:</strong> In <code>10 → 20 → 30 → null</code>, the head is 10 and the tail is 30. Most functions are given only the head. (A <a href="#/topic/dsa-words#w-queue">queue</a> also has a head, meaning its front.)</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-linked-list">Linked List</a></p>

<h3 id="w-dummy-node">Dummy node</h3>
<p><strong>In plain words:</strong> A fake <a href="#/topic/dsa-words#w-node">node</a> placed before the real head, so the first real node needs no special handling.</p>
<p><strong>Everyday picture:</strong> A "start here" sign at the front of a queue. Even when the queue is empty, the sign is there, so there is always something to stand behind.</p>
<p><strong>Tiny example:</strong> Building a new list without a dummy needs an extra "is the list still empty?" check every time. With one, you always attach to <code>tail.next</code>, and return <code>dummy.next</code> at the end:</p>
<pre><code class="language-js">const dummy = { value: 0, next: null }; // fake node, never part of the answer
let tail = dummy;
for (const value of [5, 8, 13]) {
  tail.next = { value: value, next: null }; // always attach after tail
  tail = tail.next;
}
const realHead = dummy.next; // skip the fake node
console.log(realHead.value); // 5</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-linked-list">Linked List</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a></p>

<h3 id="w-fast-slow-pointers">Fast and slow pointers (Floyd's cycle detection)</h3>
<p><strong>In plain words:</strong> Two <a href="#/topic/dsa-words#w-pointer">pointers</a> walking the same list: one moves 1 step at a time, the other 2. If the list loops back on itself, the fast one will catch up with the slow one. Also called "tortoise and hare".</p>
<p><strong>Everyday picture:</strong> Two runners on a circular track. The faster one eventually laps the slower one. On a straight road, the fast one just reaches the end.</p>
<p><strong>Tiny example:</strong> A list where node 3 points back to node 2:</p>
<pre><code class="language-js">const nodeA = { value: 1, next: null };
const nodeB = { value: 2, next: null };
const nodeC = { value: 3, next: null };
nodeA.next = nodeB;
nodeB.next = nodeC;
nodeC.next = nodeB; // the loop: 3 points back to 2
let slow = nodeA;
let fast = nodeA;
let hasCycle = false;
while (fast !== null &amp;&amp; fast.next !== null) {
  slow = slow.next; // tortoise: 1 step
  fast = fast.next.next; // hare: 2 steps
  if (slow === fast) {
    hasCycle = true; // the hare lapped the tortoise
    break;
  }
}
console.log(hasCycle); // true</code></pre>
<p>The same trick finds the middle of a list: when the fast pointer reaches the end, the slow one is halfway.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-linked-list">Linked List</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a></p>

<h3 id="w-lru-cache">LRU cache</h3>
<p><strong>In plain words:</strong> A small store with a size limit. When it is full, it throws out the <strong>L</strong>east <strong>R</strong>ecently <strong>U</strong>sed item.</p>
<p><strong>Everyday picture:</strong> A desk with room for 3 books. When you need a 4th, the book you have not touched for the longest goes back to the shelf.</p>
<p><strong>Tiny example:</strong> A JavaScript <code>Map</code> remembers insertion order, so its first key is the oldest. Using an item means "delete it and add it again" to move it to the newest end:</p>
<pre><code class="language-js">const capacity = 2;
const cache = new Map();
function use(key, value) {
  cache.delete(key); // if it was there, take it out...
  cache.set(key, value); // ...and put it back as the newest
  if (cache.size &gt; capacity) {
    const oldestKey = cache.keys().next().value; // first key = least recently used
    cache.delete(oldestKey);
  }
}
use("a", 1);
use("b", 2);
use("a", 1); // "a" is now the most recent
use("c", 3); // full, so "b" (least recently used) is thrown out
console.log([...cache.keys()]); // ["a", "c"]</code></pre>
<p>The classic interview version builds the same thing from a <a href="#/topic/dsa-words#w-hash-map">hash map</a> plus a doubly <a href="#/topic/dsa-words#w-linked-list">linked list</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-linked-list">Linked List</a> · <a href="#/topic/dsa-hashing">Hashing</a></p>

<div class="callout info" id="fam-trees">
  <div class="callout-title">Family 8 · Trees</div>
  <p>Structures that branch out from one top node, like a family tree.</p>
</div>

<h3 id="w-tree">Tree</h3>
<p><strong>In plain words:</strong> <a href="#/topic/dsa-words#w-node">Nodes</a> joined by parent-to-child links, starting from a single top node, with no loops.</p>
<p><strong>Everyday picture:</strong> The folders on your computer. "Documents" holds "Photos" and "Work", and "Work" holds more folders. No folder is inside itself.</p>
<p><strong>Tiny example:</strong> Drawn as text:</p>
<div class="diagram"><pre>        Documents
        /       \
    Photos      Work
                /   \
           Reports  Slides</pre></div>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-trie">Trie</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-root-leaf">Root, parent, child, leaf</h3>
<p><strong>In plain words:</strong> The root is the top <a href="#/topic/dsa-words#w-node">node</a> (it has no parent). A parent links down to its children. Children of the same parent are siblings. A leaf is a node with no children.</p>
<p><strong>Everyday picture:</strong> In the folder tree, "Documents" is the root, "Work" is the parent of "Reports", and "Photos", "Reports" and "Slides" are leaves (folders with nothing inside).</p>
<p><strong>Tiny example:</strong> Computer-science trees are drawn upside down: the root is at the top and the leaves are at the bottom.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-trie">Trie</a></p>

<h3 id="w-subtree">Subtree, ancestor, descendant</h3>
<p><strong>In plain words:</strong> A subtree is one <a href="#/topic/dsa-words#w-node">node</a> plus everything below it. Ancestors are the nodes above you on the way to the root. Descendants are everything below you.</p>
<p><strong>Everyday picture:</strong> The "Work" folder with all its contents is a subtree. "Documents" is an ancestor of "Slides".</p>
<p><strong>Tiny example:</strong> Tree code often says "solve the left subtree, solve the right subtree, then combine". That is <a href="#/topic/dsa-words#w-recursion">recursion</a> on a smaller tree.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a></p>

<h3 id="w-depth-height">Depth, height and level</h3>
<p><strong>In plain words:</strong> Depth is how many steps <strong>down</strong> from the root a node is. Height is the longest path from a node <strong>down</strong> to a leaf. A level is all the nodes at the same depth.</p>
<p><strong>Everyday picture:</strong> Floors of a building, counted from the top floor. Everyone on floor 2 is on the same level.</p>
<p><strong>Tiny example:</strong> In the folder tree, "Documents" has depth 0 and "Reports" has depth 2. The height of the whole tree is 2. Watch out: some books count nodes instead of steps, which adds 1. Say which one you mean.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-binary-tree">Binary tree</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-tree">tree</a> where every node has <strong>at most two</strong> children, called left and right.</p>
<p><strong>Everyday picture:</strong> A knockout tournament bracket, read from the winner backwards: each match came from at most two earlier matches.</p>
<p><strong>Tiny example:</strong> Each node is an object with <code>left</code> and <code>right</code>:</p>
<pre><code class="language-js">const leftChild = { value: 2, left: null, right: null };
const rightChild = { value: 3, left: null, right: null };
const root = { value: 1, left: leftChild, right: rightChild };
console.log(root.left.value); // 2
console.log(root.right.value); // 3</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-heaps">Heaps</a></p>

<h3 id="w-bst">BST (binary search tree)</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-binary-tree">binary tree</a> with one rule: everything in a node's left <a href="#/topic/dsa-words#w-subtree">subtree</a> is smaller, and everything in its right subtree is bigger.</p>
<p><strong>Everyday picture:</strong> The "higher or lower" guessing game, laid out as a tree. At each node you go left for lower or right for higher.</p>
<p><strong>Tiny example:</strong> Searching only walks one path, not the whole tree:</p>
<pre><code class="language-js">const six = { value: 6, left: null, right: null };
const three = { value: 3, left: null, right: six }; // 6 is bigger than 3: right side
const ten = { value: 10, left: null, right: null };
const tree = { value: 8, left: three, right: ten }; // 3 smaller (left), 10 bigger (right)
function contains(node, target) {
  while (node !== null) {
    if (target === node.value) {
      return true;
    }
    if (target &lt; node.value) {
      node = node.left; // smaller values live on the left
    } else {
      node = node.right; // bigger values live on the right
    }
  }
  return false; // fell off the bottom: not in the tree
}
console.log(contains(tree, 6)); // true (path: 8, 3, 6)
console.log(contains(tree, 7)); // false</code></pre>
<p>This is <a href="#/topic/dsa-words#w-o-log-n">O(log n)</a> when the tree is <a href="#/topic/dsa-words#w-balanced">balanced</a>, and O(n) when it is not.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-binary-search">Binary Search</a></p>

<h3 id="w-balanced">Balanced (and skewed)</h3>
<p><strong>In plain words:</strong> A balanced tree keeps its left and right sides about the same height everywhere, so the height stays around log n. A skewed tree leans all to one side.</p>
<p><strong>Everyday picture:</strong> A well-pruned bush versus a vine. The vine is really just a long line.</p>
<p><strong>Tiny example:</strong> Insert 1, 2, 3, 4, 5 into a plain <a href="#/topic/dsa-words#w-bst">BST</a> in that order. Each number goes to the right of the last, giving a skewed tree that is just a list. Searching it is O(n), not O(log n).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-complexity">Complexity Analysis</a> · <a href="#/topic/dsa-binary-search">Binary Search</a></p>

<h3 id="w-traversal">Traversal (preorder, inorder, postorder, level order)</h3>
<p><strong>In plain words:</strong> Visiting every node exactly once, in a chosen order.</p>
<p><strong>Everyday picture:</strong> Different routes for checking every room in a building: top floor first, or room by room down each corridor.</p>
<p><strong>Tiny example:</strong> For a binary tree, the name says when you visit the node itself:</p>
<div class="diagram"><pre>        4
       / \
      2   6
     / \
    1   3

preorder    (node, left, right):  4 2 1 3 6
inorder     (left, node, right):  1 2 3 4 6   &lt;- sorted, for a BST
postorder   (left, right, node):  1 3 2 6 4
level order (row by row):         4 2 6 1 3   &lt;- this is BFS</pre></div>
<pre><code class="language-js">function inorder(node, visited) {
  if (node === null) {
    return; // base case: empty spot
  }
  inorder(node.left, visited); // everything smaller first
  visited.push(node.value); // then this node
  inorder(node.right, visited); // then everything bigger
}
const one = { value: 1, left: null, right: null };
const three = { value: 3, left: null, right: null };
const six = { value: 6, left: null, right: null };
const two = { value: 2, left: one, right: three };
const root = { value: 4, left: two, right: six }; // the tree drawn above
const visited = [];
inorder(root, visited);
console.log(visited); // [1, 2, 3, 4, 6]</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-lca">LCA (lowest common ancestor)</h3>
<p><strong>In plain words:</strong> For two nodes, the deepest node that is an <a href="#/topic/dsa-words#w-subtree">ancestor</a> of both.</p>
<p><strong>Everyday picture:</strong> In a family tree, the closest grandparent that two cousins share.</p>
<p><strong>Tiny example:</strong> In the tree above (4 at the top), the LCA of 1 and 3 is 2. The LCA of 1 and 6 is 4.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a></p>

<h3 id="w-serialize">Serialize and deserialize</h3>
<p><strong>In plain words:</strong> Serialize: turn a structure into a string, so you can save or send it. Deserialize: rebuild the structure from that string.</p>
<p><strong>Everyday picture:</strong> Flat-packing a wardrobe into a box for delivery, then building it again at the other end.</p>
<p><strong>Tiny example:</strong> <code>JSON.stringify</code> and <code>JSON.parse</code> are the everyday version. In interviews you write your own, usually with a marker such as <code>"#"</code> for empty children so the shape can be rebuilt.</p>
<pre><code class="language-js">const child = { value: 2, left: null, right: null };
const tree = { value: 1, left: null, right: child };
const text = JSON.stringify(tree); // serialize: object -&gt; string
const copy = JSON.parse(text); // deserialize: string -&gt; object
console.log(copy.right.value); // 2</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-hashing">Hashing</a></p>

<div class="callout info" id="fam-heaps">
  <div class="callout-title">Family 9 · Heaps and tries</div>
  <p>Two special trees: one that keeps the most important item on top, and one that stores words letter by letter.</p>
</div>

<h3 id="w-heap">Heap (min-heap, max-heap)</h3>
<p><strong>In plain words:</strong> A tree-shaped structure that always keeps the <strong>smallest</strong> item on top (min-heap) or the <strong>biggest</strong> (max-heap). Peeking at the top is O(1). Adding or removing is <a href="#/topic/dsa-words#w-o-log-n">O(log n)</a>.</p>
<p><strong>Everyday picture:</strong> A hospital emergency room. The most urgent patient is always seen next, whatever order people arrived in.</p>
<p><strong>Tiny example:</strong> It is stored in a plain array. The children of index <code>i</code> sit at <code>2i + 1</code> and <code>2i + 2</code>. Every parent is smaller than its children:</p>
<div class="diagram"><pre>array:  [1, 3, 2, 7, 4]
index:   0  1  2  3  4

          1          &lt;- index 0: the smallest, always on top
        /   \
       3     2       &lt;- indexes 1 and 2
      / \
     7   4           &lt;- indexes 3 and 4 (children of index 1)</pre></div>
<p>When a new item is added, it "sifts up" (swaps with its parent until it is in place). When the top is removed, the last item moves to the top and "sifts down". This "heap" has nothing to do with the memory heap in JavaScript engines.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-greedy">Greedy</a></p>

<h3 id="w-priority-queue">Priority queue</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-queue">queue</a> where the most important item leaves first, not the oldest. It is usually built with a <a href="#/topic/dsa-words#w-heap">heap</a>.</p>
<p><strong>Everyday picture:</strong> Boarding a plane by priority group, instead of by who got to the gate first.</p>
<p><strong>Tiny example:</strong> JavaScript has no built-in priority queue. In an interview, say so, then either write a small heap or say "assume a MinPriorityQueue class". Used for <a href="#/topic/dsa-words#w-top-k">top-k</a> questions and <a href="#/topic/dsa-words#w-shortest-path">Dijkstra's shortest path</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-greedy">Greedy</a></p>

<h3 id="w-top-k">Top-k</h3>
<p><strong>In plain words:</strong> Find the k biggest (or smallest, or most frequent) items.</p>
<p><strong>Everyday picture:</strong> A leaderboard with only 3 spots. A new score only gets in if it beats the lowest score on the board.</p>
<p><strong>Tiny example:</strong> Keep a min-<a href="#/topic/dsa-words#w-heap">heap</a> of size k. Its top is the "lowest score on the board". Each new item either beats it (swap them) or is ignored. That is O(n log k), better than sorting everything when k is small.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-hashing">Hashing</a> · <a href="#/topic/dsa-trie">Trie</a></p>

<h3 id="w-lazy-deletion">Lazy deletion</h3>
<p><strong>In plain words:</strong> Do not remove an item right away. Mark it as out of date, and skip it later when it reaches the top.</p>
<p><strong>Everyday picture:</strong> Crossing out a cancelled order on a list instead of rewriting the whole list.</p>
<p><strong>Tiny example:</strong> A <a href="#/topic/dsa-words#w-heap">heap</a> can only remove its top quickly. To "remove" something from the middle, note it in a <a href="#/topic/dsa-words#w-hash-set">Set</a> of cancelled items. Each time you look at the top, throw it away first if it is in that Set.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-trie">Trie (said "try")</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-tree">tree</a> of letters. Each path down from the root spells the start of a word.</p>
<p><strong>Everyday picture:</strong> Your phone's autocomplete. Type "ca" and it already knows every word that starts that way: car, cat, cart.</p>
<p><strong>Tiny example:</strong> Each node is a Map from letter to child node. A special key marks "a whole word ends here":</p>
<pre><code class="language-js">const root = new Map(); // each node: a Map from letter to child node
function insertWord(word) {
  let node = root;
  for (const letter of word) {
    if (!node.has(letter)) {
      node.set(letter, new Map()); // new branch for this letter
    }
    node = node.get(letter);
  }
  node.set("END", true); // mark: a whole word finishes here
}
function hasPrefix(prefix) {
  let node = root;
  for (const letter of prefix) {
    if (!node.has(letter)) {
      return false; // the path stops: no word starts this way
    }
    node = node.get(letter);
  }
  return true;
}
insertWord("car");
insertWord("cat");
console.log(hasPrefix("ca")); // true
console.log(hasPrefix("do")); // false</code></pre>
<p>Checking a <a href="#/topic/dsa-words#w-prefix-suffix">prefix</a> costs one step per letter, however many words are stored.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-trie">Trie</a> · <a href="#/topic/dsa-backtracking">Backtracking</a></p>

<div class="callout info" id="fam-graphs">
  <div class="callout-title">Family 10 · Graphs</div>
  <p>Things connected to other things, with no single top. Picture a metro map.</p>
</div>

<h3 id="w-graph">Graph</h3>
<p><strong>In plain words:</strong> A set of things (vertices) joined by links (edges). Unlike a <a href="#/topic/dsa-words#w-tree">tree</a>, there is no top, and loops are allowed.</p>
<p><strong>Everyday picture:</strong> A metro map. Stations are the things; the tracks between them are the links.</p>
<p><strong>Tiny example:</strong> A <a href="#/topic/dsa-words#w-tree">tree</a> is a special kind of graph: connected, and with no loops.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-vertex">Vertex (plural: vertices), also called node</h3>
<p><strong>In plain words:</strong> One thing in a <a href="#/topic/dsa-words#w-graph">graph</a>.</p>
<p><strong>Everyday picture:</strong> One station on the metro map.</p>
<p><strong>Tiny example:</strong> People in a social network, cities on a map, or tasks in a project. <strong>V</strong> means "how many vertices".</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-edge">Edge</h3>
<p><strong>In plain words:</strong> A link between two <a href="#/topic/dsa-words#w-vertex">vertices</a> in a graph.</p>
<p><strong>Everyday picture:</strong> The track between two metro stations.</p>
<p><strong>Tiny example:</strong> <strong>E</strong> means "how many edges". Do not confuse it with an <a href="#/topic/dsa-words#w-edge-case">edge case</a>, which means an unusual input.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-trees">Trees</a></p>

<h3 id="w-directed-undirected">Directed and undirected</h3>
<p><strong>In plain words:</strong> In a directed graph, each edge is one-way (an arrow). In an undirected graph, each edge works both ways.</p>
<p><strong>Everyday picture:</strong> Following someone on Instagram is directed: they may not follow you back. Being friends on Facebook is undirected: it is always mutual.</p>
<p><strong>Tiny example:</strong> When you store an undirected edge between A and B, add it twice: A → B and B → A.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-weighted">Weighted graph</h3>
<p><strong>In plain words:</strong> Each <a href="#/topic/dsa-words#w-edge">edge</a> carries a number: a distance, cost or time.</p>
<p><strong>Everyday picture:</strong> A road map with the kilometres written on each road.</p>
<p><strong>Tiny example:</strong> Delhi → Agra 230, Agra → Jaipur 240. Without weights, every edge simply counts as 1 step.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-greedy">Greedy</a> · <a href="#/topic/dsa-heaps">Heaps</a></p>

<h3 id="w-adjacency-list">Adjacency list (and neighbours)</h3>
<p><strong>In plain words:</strong> The usual way to store a graph: for each vertex, a list of the vertices it links to. Those are its <strong>neighbours</strong>.</p>
<p><strong>Everyday picture:</strong> Each station on the metro map has a small sign: "From here you can go to…".</p>
<p><strong>Tiny example:</strong> A Map from each vertex to an array of neighbours:</p>
<pre><code class="language-js">const metro = new Map();
metro.set("A", ["B", "C"]); // from A you can reach B and C
metro.set("B", ["A", "D"]);
metro.set("C", ["A"]);
metro.set("D", ["B"]);
console.log(metro.get("B")); // ["A", "D"]: the neighbours of B</code></pre>
<p>The other option is an adjacency matrix: a V × V grid of true/false. It is simple, but uses V² memory even when there are few edges.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-degree">Degree, in-degree, out-degree</h3>
<p><strong>In plain words:</strong> Degree is how many edges touch a vertex. In a directed graph, in-degree counts arrows coming <strong>in</strong>, and out-degree counts arrows going <strong>out</strong>.</p>
<p><strong>Everyday picture:</strong> On Instagram, your follower count is your in-degree. The number of people you follow is your out-degree.</p>
<p><strong>Tiny example:</strong> A task with in-degree 0 has nothing it waits for, so it can start right now. That idea drives <a href="#/topic/dsa-words#w-topological-sort">topological sort</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-cycle">Cycle</h3>
<p><strong>In plain words:</strong> A path that comes back to where it started.</p>
<p><strong>Everyday picture:</strong> A circular bus route: keep riding and you pass the same stop again.</p>
<p><strong>Tiny example:</strong> A → B → C → A is a cycle. Cycles matter because code that does not remember where it has been will loop forever (see <a href="#/topic/dsa-words#w-visited">visited set</a>). A <a href="#/topic/dsa-words#w-linked-list">linked list</a> can have a cycle too (see <a href="#/topic/dsa-words#w-fast-slow-pointers">fast and slow pointers</a>).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-linked-list">Linked List</a> · <a href="#/topic/dsa-two-pointers">Two Pointers</a></p>

<h3 id="w-dag">DAG (directed acyclic graph)</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-directed-undirected">directed</a> graph with no <a href="#/topic/dsa-words#w-cycle">cycles</a>: all arrows are one-way and you can never get back to where you started.</p>
<p><strong>Everyday picture:</strong> Course prerequisites. Maths 101 → Maths 201 → Maths 301. No course can (directly or indirectly) be its own prerequisite.</p>
<p><strong>Tiny example:</strong> Only a DAG has a valid "do these in order" list. That list is a <a href="#/topic/dsa-words#w-topological-sort">topological sort</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a></p>

<h3 id="w-connected-component">Connected component</h3>
<p><strong>In plain words:</strong> A group of vertices that can all reach each other, cut off from the rest of the graph.</p>
<p><strong>Everyday picture:</strong> Islands on a map. You can walk anywhere on one island, but not to the next island.</p>
<p><strong>Tiny example:</strong> The "number of islands" problem counts connected components in a grid of land and water. Each time you find unvisited land, you start a <a href="#/topic/dsa-words#w-dfs">DFS</a> or <a href="#/topic/dsa-words#w-bfs">BFS</a> that "floods" the whole island (a "flood fill"), and add 1 to the count.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-visited">Visited set</h3>
<p><strong>In plain words:</strong> A <a href="#/topic/dsa-words#w-hash-set">Set</a> of the vertices you have already handled, so you never process one twice.</p>
<p><strong>Everyday picture:</strong> Marking rooms with chalk while exploring a maze, so you do not go round in circles.</p>
<p><strong>Tiny example:</strong> Add a vertex to <code>visited</code> as soon as you discover it. Without this, a <a href="#/topic/dsa-words#w-cycle">cycle</a> makes the search run forever.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-trees">Trees</a></p>

<h3 id="w-bipartite">Bipartite</h3>
<p><strong>In plain words:</strong> A graph whose vertices can be split into two teams so that every edge goes <strong>between</strong> the teams, never inside one.</p>
<p><strong>Everyday picture:</strong> Seating wedding guests at two tables so that no two people who argue sit at the same table.</p>
<p><strong>Tiny example:</strong> Check it by colouring: give the first vertex red, its neighbours blue, their neighbours red, and so on. If two neighbours ever need the same colour, it is not bipartite.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-bfs">BFS (breadth-first search)</h3>
<p><strong>In plain words:</strong> Explore a graph <strong>level by level</strong>: all neighbours first, then their neighbours, and so on. It uses a <a href="#/topic/dsa-words#w-queue">queue</a>.</p>
<p><strong>Everyday picture:</strong> Ripples on a pond: the circle near the stone first, then the next circle out. Or: your friends first, then friends of friends.</p>
<p><strong>Tiny example:</strong> Because it goes level by level, BFS finds the fewest steps between two places when every edge counts the same. Steps from A to every station:</p>
<pre><code class="language-js">const metro = new Map();
metro.set("A", ["B", "C"]);
metro.set("B", ["A", "D"]);
metro.set("C", ["A"]);
metro.set("D", ["B"]);
const stepsFromA = new Map(); // also works as our visited set
stepsFromA.set("A", 0);
const queue = ["A"];
let front = 0; // index of the next station to process
while (front &lt; queue.length) {
  const station = queue[front];
  front++;
  for (const next of metro.get(station)) {
    if (!stepsFromA.has(next)) {
      stepsFromA.set(next, stepsFromA.get(station) + 1); // one ripple further out
      queue.push(next);
    }
  }
}
console.log(stepsFromA.get("D")); // 2 (A -&gt; B -&gt; D)</code></pre>
<p>Time is O(V + E): each vertex and each edge is handled once.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a></p>

<h3 id="w-dfs">DFS (depth-first search)</h3>
<p><strong>In plain words:</strong> Explore a graph by going <strong>as deep as possible</strong> down one path, then backing up to the last fork and trying the next path. It uses <a href="#/topic/dsa-words#w-recursion">recursion</a> or a <a href="#/topic/dsa-words#w-stack">stack</a>.</p>
<p><strong>Everyday picture:</strong> Exploring a cave: follow one tunnel to its end, come back to the last fork, try the next tunnel.</p>
<p><strong>Tiny example:</strong> The order DFS visits the metro stations from A:</p>
<pre><code class="language-js">const metro = new Map();
metro.set("A", ["B", "C"]);
metro.set("B", ["A", "D"]);
metro.set("C", ["A"]);
metro.set("D", ["B"]);
const visited = new Set();
const order = [];
function explore(station) {
  visited.add(station); // chalk mark
  order.push(station);
  for (const next of metro.get(station)) {
    if (!visited.has(next)) {
      explore(next); // go deeper before trying the other neighbours
    }
  }
}
explore("A");
console.log(order); // ["A", "B", "D", "C"]: all the way down B's tunnel first</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-trees">Trees</a> · <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-stack-queue">Stack &amp; Queue</a></p>

<h3 id="w-topological-sort">Topological sort (and Kahn's algorithm)</h3>
<p><strong>In plain words:</strong> An order for the vertices of a <a href="#/topic/dsa-words#w-dag">DAG</a> where every arrow points forwards: everything a task depends on comes before it.</p>
<p><strong>Everyday picture:</strong> Getting dressed: socks before shoes, shirt before tie. Any order that respects those rules is fine.</p>
<p><strong>Tiny example:</strong> Kahn's algorithm: repeatedly take a task with <a href="#/topic/dsa-words#w-degree">in-degree</a> 0 (nothing left to wait for), and "remove" it by lowering the in-degree of the tasks that waited on it.</p>
<pre><code class="language-js">const mustComeBefore = new Map(); // task -&gt; tasks that wait for it
mustComeBefore.set("socks", ["shoes"]);
mustComeBefore.set("shirt", ["tie"]);
mustComeBefore.set("shoes", []);
mustComeBefore.set("tie", []);
const waitingOn = new Map(); // in-degree: how many tasks each one waits for
for (const task of mustComeBefore.keys()) {
  waitingOn.set(task, 0);
}
for (const laterTasks of mustComeBefore.values()) {
  for (const later of laterTasks) {
    waitingOn.set(later, waitingOn.get(later) + 1);
  }
}
const ready = [];
// each entry of a Map is a [key, value] pair; [task, count] unpacks it into two names
for (const [task, count] of waitingOn) {
  if (count === 0) {
    ready.push(task); // nothing to wait for: can start now
  }
}
const order = [];
while (ready.length &gt; 0) {
  const task = ready.shift(); // fine for tiny inputs; see the queue entry
  order.push(task);
  for (const later of mustComeBefore.get(task)) {
    waitingOn.set(later, waitingOn.get(later) - 1); // one less thing to wait for
    if (waitingOn.get(later) === 0) {
      ready.push(later);
    }
  }
}
console.log(order); // ["socks", "shirt", "shoes", "tie"]</code></pre>
<p>If the final order is shorter than the number of tasks, some tasks were stuck waiting on each other: the graph has a <a href="#/topic/dsa-words#w-cycle">cycle</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-union-find">Union-Find (disjoint set union, DSU)</h3>
<p><strong>In plain words:</strong> A structure that tracks which items are in the same group. <strong>find</strong> tells you an item's group leader. <strong>union</strong> merges two groups.</p>
<p><strong>Everyday picture:</strong> Companies merging. To know if two employees now work for the same company, each asks "who is my top boss?" and you compare the answers.</p>
<p><strong>Tiny example:</strong> Each item points to a "boss". Follow the bosses up to the top one:</p>
<pre><code class="language-js">const boss = new Map();
for (const person of ["Asha", "Ben", "Chen", "Dev"]) {
  boss.set(person, person); // at first, everyone is their own boss
}
function find(person) {
  let top = person;
  while (boss.get(top) !== top) {
    top = boss.get(top); // climb up to the top boss
  }
  boss.set(person, top); // shortcut for next time (a simple "path compression")
  return top;
}
function union(personA, personB) {
  const topA = find(personA);
  const topB = find(personB);
  if (topA !== topB) {
    boss.set(topB, topA); // merge: B's company now reports to A's
  }
}
union("Asha", "Ben");
union("Ben", "Chen");
console.log(find("Chen") === find("Asha")); // true: same company
console.log(find("Dev") === find("Asha")); // false</code></pre>
<p>The full version adds "union by rank" (attach the smaller group under the bigger one). With both tricks, each operation is almost O(1).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-greedy">Greedy</a></p>

<h3 id="w-shortest-path">Shortest path (Dijkstra, Bellman-Ford)</h3>
<p><strong>In plain words:</strong> The cheapest route between two vertices.</p>
<p><strong>Everyday picture:</strong> Google Maps finding the quickest way home.</p>
<p><strong>Tiny example:</strong> Which tool depends on the edges. All edges cost the same: use <a href="#/topic/dsa-words#w-bfs">BFS</a>. <a href="#/topic/dsa-words#w-weighted">Weighted</a> with no negative costs: use <strong>Dijkstra</strong>, which always finishes the closest unfinished vertex next, using a min-<a href="#/topic/dsa-words#w-heap">heap</a>. Negative costs allowed: use <strong>Bellman-Ford</strong>, which is slower. "Relaxing" an edge just means: "I found a cheaper way to reach this vertex, so update its best cost."</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-heaps">Heaps</a> · <a href="#/topic/dsa-greedy">Greedy</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a></p>

<h3 id="w-mst">MST (minimum spanning tree: Kruskal, Prim)</h3>
<p><strong>In plain words:</strong> The cheapest set of edges that connects <strong>every</strong> vertex, with no <a href="#/topic/dsa-words#w-cycle">cycles</a>.</p>
<p><strong>Everyday picture:</strong> Laying cable to connect every village, using as little cable as possible.</p>
<p><strong>Tiny example:</strong> <strong>Kruskal</strong>: sort edges cheapest first, and take each one unless it would make a cycle (<a href="#/topic/dsa-words#w-union-find">Union-Find</a> checks that). <strong>Prim</strong>: start at one vertex and keep adding the cheapest edge that reaches a new vertex (using a <a href="#/topic/dsa-words#w-heap">heap</a>). Both are <a href="#/topic/dsa-words#w-greedy">greedy</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-graphs">Graphs</a> · <a href="#/topic/dsa-greedy">Greedy</a></p>

<div class="callout info" id="fam-techniques">
  <div class="callout-title">Family 11 · Problem-solving techniques</div>
  <p>The big strategies. Each one has its own topic; this is the one-paragraph version.</p>
</div>

<h3 id="w-binary-search">Binary search</h3>
<p><strong>In plain words:</strong> Find something in a <a href="#/topic/dsa-words#w-sorted">sorted</a> list by checking the middle, then throwing away the half where it cannot be.</p>
<p><strong>Everyday picture:</strong> Looking up a word in a paper dictionary. Open in the middle, see you went too far, and only search the first half after that.</p>
<p><strong>Tiny example:</strong> Each check halves what is left, so it is <a href="#/topic/dsa-words#w-o-log-n">O(log n)</a>:</p>
<pre><code class="language-js">const pages = [3, 8, 15, 21, 30, 42, 57];
const target = 30;
let left = 0;
let right = pages.length - 1;
let foundAt = -1; // -1 means "not found"
while (left &lt;= right) {
  const middle = Math.floor((left + right) / 2);
  if (pages[middle] === target) {
    foundAt = middle;
    break;
  } else if (pages[middle] &lt; target) {
    left = middle + 1; // target is bigger: drop the left half
  } else {
    right = middle - 1; // target is smaller: drop the right half
  }
}
console.log(foundAt); // 4 (checked 21, then 42, then 30)</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-binary-search">Binary Search</a> · <a href="#/topic/dsa-trees">Trees</a></p>

<h3 id="w-search-space">Search space (binary search on the answer)</h3>
<p><strong>In plain words:</strong> The range of possible answers. If a yes/no question flips from "no" to "yes" at exactly one point, you can <a href="#/topic/dsa-words#w-binary-search">binary search</a> that range to find the flip. The yes/no question is called a <strong>predicate</strong>.</p>
<p><strong>Everyday picture:</strong> Finding the smallest shoe size that fits. Too small, too small, fits, fits, fits. Try the middle size and drop half the sizes each time.</p>
<p><strong>Tiny example:</strong> The smallest whole number whose square is at least 50. The question "is middle × middle ≥ 50?" is no, no, …, yes, yes:</p>
<pre><code class="language-js">function smallestWhoseSquareIsAtLeast(goal) {
  let low = 0;
  let high = goal; // the answer is somewhere in 0..goal
  while (low &lt; high) {
    const middle = Math.floor((low + high) / 2);
    if (middle * middle &gt;= goal) {
      high = middle; // middle works, but something smaller might too
    } else {
      low = middle + 1; // middle is too small, so the answer is bigger
    }
  }
  return low;
}
console.log(smallestWhoseSquareIsAtLeast(50)); // 8, because 7 x 7 = 49 is too small</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-binary-search">Binary Search</a></p>

<h3 id="w-greedy">Greedy</h3>
<p><strong>In plain words:</strong> At each step, take the choice that looks best <strong>right now</strong>, and never go back to change it.</p>
<p><strong>Everyday picture:</strong> Giving change with the biggest coin first. For ₹ or $ coins, that always gives the fewest coins.</p>
<p><strong>Tiny example:</strong> Greedy is only right for some problems. With coins 1, 3 and 4, making 6:</p>
<pre><code class="language-js">const coins = [4, 3, 1]; // biggest first
let amountLeft = 6;
let coinsUsed = 0;
for (const coin of coins) {
  while (amountLeft &gt;= coin) {
    amountLeft -= coin; // take the biggest coin that still fits
    coinsUsed++;
  }
}
console.log(coinsUsed); // 3 coins (4 + 1 + 1), but 3 + 3 needs only 2</code></pre>
<p>So you need a reason why greedy is safe. The usual one is an "exchange argument": show that swapping any other choice for the greedy one never makes the answer worse. When greedy fails, the fix is often <a href="#/topic/dsa-words#w-dp">DP</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-greedy">Greedy</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-heaps">Heaps</a></p>

<h3 id="w-backtracking">Backtracking</h3>
<p><strong>In plain words:</strong> Build an answer one choice at a time. When a path cannot work (or is finished), <strong>undo</strong> the last choice and try the next one. The pattern is: choose, explore, unchoose.</p>
<p><strong>Everyday picture:</strong> Solving a maze with a pencil. At a dead end, rub out back to the last fork and try another way.</p>
<p><strong>Tiny example:</strong> All <a href="#/topic/dsa-words#w-subset">subsets</a> of three letters. For each letter we try "take it", then undo, then try "skip it". The tree of all these choices is called a decision tree:</p>
<pre><code class="language-js">const items = ["a", "b", "c"];
const allSubsets = [];
const current = [];
function explore(index) {
  if (index === items.length) {
    allSubsets.push([...current]); // copy it: current keeps changing
    return;
  }
  current.push(items[index]); // choose: take this item
  explore(index + 1); // explore with it
  current.pop(); // unchoose: undo the choice...
  explore(index + 1); // ...and explore without it
}
explore(0);
console.log(allSubsets.length); // 8</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-trie">Trie</a> · <a href="#/topic/dsa-trees">Trees</a></p>

<h3 id="w-pruning">Pruning</h3>
<p><strong>In plain words:</strong> Stopping a <a href="#/topic/dsa-words#w-backtracking">backtracking</a> path early, as soon as you know it cannot lead to a valid answer.</p>
<p><strong>Everyday picture:</strong> On a road trip, you do not drive down a road signed "Dead end".</p>
<p><strong>Tiny example:</strong> Looking for numbers that add up to 10, sorted smallest first: once the running total passes 10, every later number only makes it bigger. Stop that path right there.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-trie">Trie</a></p>

<h3 id="w-dp">DP (dynamic programming)</h3>
<p><strong>In plain words:</strong> Solve a big problem by solving smaller versions of it <strong>once each</strong>, saving the answers, and combining them. In short: remember and reuse.</p>
<p><strong>Everyday picture:</strong> Climbing stairs, 1 or 2 steps at a time. The ways to reach step 5 = (ways to reach step 4) + (ways to reach step 3), because your last move was either 1 step or 2.</p>
<p><strong>Tiny example:</strong> That idea as a table:</p>
<pre><code class="language-js">const topStep = 5;
const ways = [1, 1]; // ways[i] = number of ways to reach step i
for (let step = 2; step &lt;= topStep; step++) {
  ways[step] = ways[step - 1] + ways[step - 2]; // last move was 1 step or 2 steps
}
console.log(ways[topStep]); // 8</code></pre>
<p>There are two styles: <a href="#/topic/dsa-words#w-memoization">memoization</a> (recursion plus a cheat sheet) and <a href="#/topic/dsa-words#w-tabulation">tabulation</a> (a loop filling a table). Under the hood, DP is the bridge from <a href="#/topic/dsa-words#w-o-2-n">O(2ⁿ)</a> "try everything" down to polynomial time, often O(n) or O(n²).</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-greedy">Greedy</a> · <a href="#/topic/dsa-backtracking">Backtracking</a></p>

<h3 id="w-subproblem">Subproblem (overlapping subproblems, optimal substructure)</h3>
<p><strong>In plain words:</strong> A subproblem is a smaller version of the same question. "Overlapping" means the same subproblem gets asked many times. "Optimal substructure" means the best answer can be built from the best answers to subproblems.</p>
<p><strong>Everyday picture:</strong> Planning the cheapest train trip Delhi → Mumbai via Jaipur. The cheapest overall trip uses the cheapest Delhi → Jaipur leg (optimal substructure). Every route through Jaipur asks for that same leg (overlapping).</p>
<p><strong>Tiny example:</strong> Plain recursive <code>fib(5)</code> asks for <code>fib(3)</code> twice and <code>fib(2)</code> three times. That repetition is the overlap that <a href="#/topic/dsa-words#w-memoization">memoization</a> removes. When both properties hold, <a href="#/topic/dsa-words#w-dp">DP</a> works.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-greedy">Greedy</a> · <a href="#/topic/dsa-backtracking">Backtracking</a></p>

<h3 id="w-state">State</h3>
<p><strong>In plain words:</strong> The small set of facts that fully describe "where you are" in a problem.</p>
<p><strong>Everyday picture:</strong> A saved game. Level, health and coins are enough to carry on exactly where you left off.</p>
<p><strong>Tiny example:</strong> In the stairs problem, the state is just "which step am I on". <code>ways[i]</code> stores the answer for state <code>i</code>. Choosing the state is the hardest part of <a href="#/topic/dsa-words#w-dp">DP</a>: too little information and the answer is wrong; too much and it is slow.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-transition">Transition (recurrence relation)</h3>
<p><strong>In plain words:</strong> The rule that builds the answer for one <a href="#/topic/dsa-words#w-state">state</a> from answers to smaller states.</p>
<p><strong>Everyday picture:</strong> A recipe step: "to make the sauce, combine the onions you fried and the tomatoes you chopped".</p>
<p><strong>Tiny example:</strong> For the stairs: <code>ways[i] = ways[i - 1] + ways[i - 2]</code>. In words: "the ways to reach step i are the ways to reach the step below, plus the ways to reach two steps below".</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-dp">Dynamic Programming</a></p>

<div class="callout info" id="fam-bits">
  <div class="callout-title">Family 12 · Bits</div>
  <p>How numbers look inside the computer, as rows of 0s and 1s.</p>
</div>

<h3 id="w-bit">Bit and binary</h3>
<p><strong>In plain words:</strong> A bit is a single 0 or 1. Binary writes numbers using only bits.</p>
<p><strong>Everyday picture:</strong> A row of light switches, each off (0) or on (1). Reading from the right, the switches are worth 1, 2, 4, 8 and so on.</p>
<p><strong>Tiny example:</strong> 13 in binary is <code>1101</code>: that is 8 + 4 + 0 + 1.</p>
<pre><code class="language-js">const thirteen = 13;
console.log(thirteen.toString(2)); // "1101"
console.log(parseInt("1101", 2)); // 13</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-bit">Bit Manipulation</a></p>

<h3 id="w-bitmask">Bitmask</h3>
<p><strong>In plain words:</strong> Using the bits of one number as a row of yes/no flags.</p>
<p><strong>Everyday picture:</strong> A pill organiser with 7 boxes, one per day. Each box is full or empty. One number can describe the whole organiser.</p>
<p><strong>Tiny example:</strong> Which of 3 friends are coming? <code>5</code> is <code>101</code> in binary: friend 0 yes, friend 1 no, friend 2 yes. <code>1 &lt;&lt; i</code> makes a number with only switch i turned on, and <code>&amp;</code> keeps only the switches that are on in both numbers:</p>
<pre><code class="language-js">const friends = ["Asha", "Ben", "Chen"];
const mask = 5; // binary 101
const coming = [];
for (let i = 0; i &lt; friends.length; i++) {
  const onlySwitchI = 1 &lt;&lt; i; // 1, then 2, then 4
  if ((mask &amp; onlySwitchI) !== 0) {
    coming.push(friends[i]); // switch i is on in the mask
  }
}
console.log(coming); // ["Asha", "Chen"]</code></pre>
<p>Counting from 0 to 2ⁿ − 1 visits every possible mask, which is a neat way to list every <a href="#/topic/dsa-words#w-subset">subset</a>.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-bit">Bit Manipulation</a> · <a href="#/topic/dsa-backtracking">Backtracking</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-graphs">Graphs</a></p>

<h3 id="w-xor">XOR (^)</h3>
<p><strong>In plain words:</strong> A bit operation: the result bit is 1 when the two bits are <strong>different</strong>, and 0 when they are the same.</p>
<p><strong>Everyday picture:</strong> Flipping a light switch. Flip it twice and you are back where you started.</p>
<p><strong>Tiny example:</strong> Two rules make it useful: <code>x ^ x = 0</code> and <code>x ^ 0 = x</code>. So XOR-ing every number in a list cancels out the pairs and leaves the odd one out:</p>
<pre><code class="language-js">const socks = [4, 7, 2, 7, 4];
let leftOver = 0;
for (const sock of socks) {
  leftOver = leftOver ^ sock; // pairs cancel each other out
}
console.log(leftOver); // 2: the sock without a pair</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-bit">Bit Manipulation</a> · <a href="#/topic/dsa-trie">Trie</a></p>

<h3 id="w-set-bit">Set bit (and popcount)</h3>
<p><strong>In plain words:</strong> A set bit is a bit that is 1. Popcount is how many set bits a number has.</p>
<p><strong>Everyday picture:</strong> How many light switches in the row are on.</p>
<p><strong>Tiny example:</strong> 13 is <code>1101</code>, so it has 3 set bits. The "lowest set bit" is the right-most 1.</p>
<pre><code class="language-js">const value = 13;
const binaryText = value.toString(2); // "1101"
let ones = 0;
for (const digit of binaryText) {
  if (digit === "1") {
    ones++; // this switch is on
  }
}
console.log(ones); // 3</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-bit">Bit Manipulation</a></p>

<h3 id="w-overflow">Overflow</h3>
<p><strong>In plain words:</strong> A number gets too big for the space it is stored in, and goes wrong.</p>
<p><strong>Everyday picture:</strong> An old car odometer rolling over from 99999 back to 00000.</p>
<p><strong>Tiny example:</strong> In JavaScript, normal numbers stay exact only up to <code>Number.MAX_SAFE_INTEGER</code> (about 9 × 10¹⁵). Bit operators like <code>&amp;</code> and <code>|</code> squash numbers to 32 bits first, so big numbers can turn negative:</p>
<pre><code class="language-js">const big = 2 ** 53;
console.log(big + 1 === big); // true: past the safe limit, + 1 gets lost
const twoBillion = 2 ** 31;
console.log(twoBillion | 0); // -2147483648: squashed to 32 bits</code></pre>
<p>In languages like Java, <code>(left + right) / 2</code> can overflow inside binary search. In JavaScript it is safe for normal array sizes, but interviewers may still ask.</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-bit">Bit Manipulation</a> · <a href="#/topic/dsa-binary-search">Binary Search</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a></p>

<div class="callout info" id="fam-jargon">
  <div class="callout-title">Family 13 · Jargon and named tricks</div>
  <p>Words that explanations use without warning, plus the named tricks interviewers expect you to recognise.</p>
</div>

<h3 id="w-invariant">Invariant</h3>
<p><strong>In plain words:</strong> A fact that you keep true at <strong>every step</strong> of a loop. If it is true at the start and every step keeps it true, it is still true at the end, which proves the code right.</p>
<p><strong>Everyday picture:</strong> A shop till. At any moment, the cash in the drawer = starting cash + today's sales. If that ever stops being true, something has gone wrong.</p>
<p><strong>Tiny example:</strong> In the <a href="#/topic/dsa-words#w-window">sliding window</a> example, the invariant is "<code>windowSum</code> always equals the total of the items currently inside the window". In <a href="#/topic/dsa-words#w-binary-search">binary search</a>, it is "if the target exists, it is between <code>left</code> and <code>right</code>".</p>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-binary-search">Binary Search</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-heaps">Heaps</a></p>

<h3 id="w-sentinel">Sentinel</h3>
<p><strong>In plain words:</strong> A special stand-in value that marks "nothing yet" or "the edge", so the code needs fewer special-case checks.</p>
<p><strong>Everyday picture:</strong> A "Reserved" card on an empty restaurant table. It is not a guest, but it holds the place.</p>
<p><strong>Tiny example:</strong> Common sentinels: <code>Infinity</code> as the starting "smallest so far", <code>-1</code> for "not found", and a <a href="#/topic/dsa-words#w-dummy-node">dummy node</a> in a linked list.</p>
<pre><code class="language-js">const prices = [42, 17, 99];
let cheapest = Infinity; // sentinel: any real price will be smaller
for (const price of prices) {
  if (price &lt; cheapest) {
    cheapest = price;
  }
}
console.log(cheapest); // 17</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-linked-list">Linked List</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-greedy">Greedy</a> · <a href="#/topic/dsa-sliding-window">Sliding Window</a></p>

<h3 id="w-kadane">Kadane's algorithm</h3>
<p><strong>In plain words:</strong> Finds the biggest total of any <a href="#/topic/dsa-words#w-subarray">subarray</a> in one pass. At each item, either keep the current run going or start a fresh run here.</p>
<p><strong>Everyday picture:</strong> A trader tracking a streak of daily profits. If the streak so far is a loss, drop it and start fresh today.</p>
<p><strong>Tiny example:</strong> Daily profit and loss:</p>
<pre><code class="language-js">const dailyProfit = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
let bestEndingHere = dailyProfit[0]; // best streak that ends today
let bestOverall = dailyProfit[0];
for (let i = 1; i &lt; dailyProfit.length; i++) {
  const extend = bestEndingHere + dailyProfit[i]; // keep the streak going
  const startFresh = dailyProfit[i]; // or drop it and start today
  bestEndingHere = Math.max(extend, startFresh);
  bestOverall = Math.max(bestOverall, bestEndingHere);
}
console.log(bestOverall); // 6, from 4 + -1 + 2 + 1</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a> · <a href="#/topic/dsa-dp">Dynamic Programming</a> · <a href="#/topic/dsa-greedy">Greedy</a></p>

<h3 id="w-dutch-national-flag">Dutch national flag</h3>
<p><strong>In plain words:</strong> Sorts an array of only 0s, 1s and 2s in one pass, using three <a href="#/topic/dsa-words#w-pointer">pointers</a>. Named after the Dutch flag's three colour bands.</p>
<p><strong>Everyday picture:</strong> Sorting laundry into three piles while walking down the line just once.</p>
<p><strong>Tiny example:</strong> <code>low</code> marks where the next 0 goes, <code>high</code> where the next 2 goes, and <code>mid</code> is the item being looked at:</p>
<pre><code class="language-js">const colors = [2, 0, 2, 1, 1, 0];
function swap(list, i, j) {
  const temp = list[i];
  list[i] = list[j];
  list[j] = temp;
}
let low = 0; // everything before low is 0
let mid = 0; // the item we are looking at now
let high = colors.length - 1; // everything after high is 2
while (mid &lt;= high) {
  if (colors[mid] === 0) {
    swap(colors, low, mid); // send the 0 to the front zone
    low++;
    mid++;
  } else if (colors[mid] === 2) {
    swap(colors, mid, high); // send the 2 to the back zone
    high--; // do not move mid: the swapped-in item is not checked yet
  } else {
    mid++; // a 1 is already in the middle zone
  }
}
console.log(colors); // [0, 0, 1, 1, 2, 2]</code></pre>
<p><strong>You'll meet it in:</strong> <a href="#/topic/dsa-two-pointers">Two Pointers</a> · <a href="#/topic/dsa-arrays-strings">Arrays &amp; Strings</a></p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🔀 Commonly confused words</div>

<h3>Subarray vs substring vs subsequence vs subset</h3>
<p><strong>What goes wrong:</strong> You solve a different problem from the one asked. "Longest subarray" and "longest subsequence" need completely different code.</p>
<p><strong>Tiny example:</strong> From <code>[3, 1, 4]</code>: <code>[1, 4]</code> is a <a href="#/topic/dsa-words#w-subarray">subarray</a> (neighbours). <code>[3, 4]</code> is a <a href="#/topic/dsa-words#w-subsequence">subsequence</a> but not a subarray (it skips the 1). <code>[4, 3]</code> is a <a href="#/topic/dsa-words#w-subset">subset</a> only, because the order changed. A <a href="#/topic/dsa-words#w-substring">substring</a> is a subarray of a string.</p>
<p><strong>Fix:</strong> Underline the word in the question. Ask: may I skip items? May I reorder them? Subarray/substring: no and no. Subsequence: yes and no. Subset: yes and yes.</p>

<h3>Index vs element</h3>
<p><strong>What goes wrong:</strong> You return the value when the question wanted its position, or the other way round.</p>
<p><strong>Tiny example:</strong> In <code>["apple", "banana"]</code>, the <a href="#/topic/dsa-words#w-index">index</a> of "banana" is 1; the <a href="#/topic/dsa-words#w-element">element</a> at index 1 is "banana". "Two sum" asks for <em>indexes</em>, so returning <code>[40, 60]</code> instead of <code>[0, 2]</code> is wrong.</p>
<p><strong>Fix:</strong> Read the "return" line of the question twice. Name variables clearly: <code>indexOfPrice</code>, not <code>p</code>.</p>

<h3>O(n) vs O(log n)</h3>
<p><strong>What goes wrong:</strong> Both sound "fast", but they are very different. Calling a halving loop O(n), or a full scan O(log n), gives the wrong answer.</p>
<p><strong>Tiny example:</strong> For a million items: <a href="#/topic/dsa-words#w-o-n">O(n)</a> is about 1,000,000 steps; <a href="#/topic/dsa-words#w-o-log-n">O(log n)</a> is about 20.</p>
<p><strong>Fix:</strong> Ask: does each step remove <em>one</em> item from the work (O(n)), or <em>half</em> of what is left (O(log n))?</p>

<h3>O(n log n) vs O(n²)</h3>
<p><strong>What goes wrong:</strong> People avoid sorting because "sorting is slow", then write a nested loop that is far slower.</p>
<p><strong>Tiny example:</strong> Sorting a million items, <a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a>, is about 20 million steps. A loop inside a loop, <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a>, is about a trillion.</p>
<p><strong>Fix:</strong> Sorting first and then doing one pass is often the better plan. It costs O(n log n) in total.</p>

<h3>Amortized vs average case</h3>
<p><strong>What goes wrong:</strong> You use them as if they mean the same thing.</p>
<p><strong>Tiny example:</strong> <a href="#/topic/dsa-words#w-amortized">Amortized</a>: array <code>push</code> is O(1) per push over any long run, guaranteed. <a href="#/topic/dsa-words#w-worst-average-case">Average case</a>: a hash map lookup is O(1) for typical inputs, but an unlucky set of keys can make it O(n).</p>
<p><strong>Fix:</strong> Amortized is about a long <em>run of operations</em>. Average case is about how lucky the <em>input</em> is.</p>

<h3>Stack vs queue</h3>
<p><strong>What goes wrong:</strong> You pick the wrong one and process things in reverse order.</p>
<p><strong>Tiny example:</strong> Push A, B, C. A <a href="#/topic/dsa-words#w-stack">stack</a> gives back C, B, A (plates). A <a href="#/topic/dsa-words#w-queue">queue</a> gives back A, B, C (ticket line).</p>
<p><strong>Fix:</strong> Ask: should the newest item go next (stack) or the oldest (queue)? BFS needs a queue; DFS uses a stack.</p>

<h3>BFS vs DFS</h3>
<p><strong>What goes wrong:</strong> You use DFS to find the fewest steps, and get a path that is valid but not the shortest.</p>
<p><strong>Tiny example:</strong> From A, with A–B, B–D and A–D: DFS might go A → B → D (2 steps), while <a href="#/topic/dsa-words#w-bfs">BFS</a> finds A → D (1 step) first, because it checks every 1-step place before any 2-step place.</p>
<p><strong>Fix:</strong> Fewest steps with equal-cost edges: BFS. Explore everything, or check if a path exists: either works, and <a href="#/topic/dsa-words#w-dfs">DFS</a> is often shorter to write.</p>

<h3>Tree vs graph, binary tree vs BST</h3>
<p><strong>What goes wrong:</strong> You assume rules that do not hold: no loops in a graph, or sorted order in any binary tree.</p>
<p><strong>Tiny example:</strong> A <a href="#/topic/dsa-words#w-graph">graph</a> can have <a href="#/topic/dsa-words#w-cycle">cycles</a>; a <a href="#/topic/dsa-words#w-tree">tree</a> cannot. A <a href="#/topic/dsa-words#w-binary-tree">binary tree</a> only promises "at most two children". A <a href="#/topic/dsa-words#w-bst">BST</a> also promises "smaller left, bigger right".</p>
<p><strong>Fix:</strong> Check what the question promises. In a graph, keep a <a href="#/topic/dsa-words#w-visited">visited set</a>. Only use the "smaller on the left" trick if the question says BST.</p>

<h3>Heap (structure) vs heap (memory)</h3>
<p><strong>What goes wrong:</strong> You mix the <a href="#/topic/dsa-words#w-heap">heap data structure</a> with the part of memory that JavaScript also calls "the heap".</p>
<p><strong>Tiny example:</strong> The data structure keeps the smallest item on top. The memory heap is just where objects live. They share a name and nothing else.</p>
<p><strong>Fix:</strong> In DSA questions, "heap" always means the data structure, and usually a <a href="#/topic/dsa-words#w-priority-queue">priority queue</a>.</p>

<h3>Edge vs edge case</h3>
<p><strong>What goes wrong:</strong> You read "handle the edge cases" as something about graphs.</p>
<p><strong>Tiny example:</strong> An <a href="#/topic/dsa-words#w-edge">edge</a> is a link between two vertices. An <a href="#/topic/dsa-words#w-edge-case">edge case</a> is an unusual input, like an empty array.</p>
<p><strong>Fix:</strong> Graph context: edge = link. Testing context: edge case = extreme input.</p>

<h3>Memoization vs tabulation</h3>
<p><strong>What goes wrong:</strong> You think they are different algorithms, and get stuck when asked to "convert to bottom-up".</p>
<p><strong>Tiny example:</strong> <a href="#/topic/dsa-words#w-memoization">Memoization</a>: recursion plus a cheat sheet, working down from the big question. <a href="#/topic/dsa-words#w-tabulation">Tabulation</a>: a loop filling a table, working up from the smallest case.</p>
<p><strong>Fix:</strong> Both are <a href="#/topic/dsa-words#w-dp">DP</a> with the same <a href="#/topic/dsa-words#w-state">state</a> and <a href="#/topic/dsa-words#w-transition">transition</a>. Only the direction changes.</p>

<h3>Greedy vs DP</h3>
<p><strong>What goes wrong:</strong> You use <a href="#/topic/dsa-words#w-greedy">greedy</a> where it does not work, and get a wrong answer that looks right on easy tests.</p>
<p><strong>Tiny example:</strong> Coins 1, 3, 4 and amount 6: greedy takes 4 + 1 + 1 (3 coins), but 3 + 3 needs only 2.</p>
<p><strong>Fix:</strong> Try to break greedy with a small example. If you cannot prove it is safe, use <a href="#/topic/dsa-words#w-dp">DP</a>, which checks every choice.</p>

<div class="pitfalls-part">🐛 Word mix-ups that cause bugs</div>

<h3>Thinking the last index is length (it is length − 1)</h3>
<p><strong>What goes wrong:</strong> An <a href="#/topic/dsa-words#w-off-by-one">off-by-one</a> error reads one locker past the end.</p>
<p><strong>Tiny example:</strong> For <code>[4, 7, 9]</code>, <code>arr[arr.length]</code> is <code>undefined</code>. The last index is 2.</p>
<p><strong>Fix:</strong> Loop with <code>i &lt; arr.length</code>. Use <code>arr.length - 1</code> when you need the last index.</p>

<h3>Forgetting the hidden loop inside a "single" loop</h3>
<p><strong>What goes wrong:</strong> Code that looks like one pass is really <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a>, because a built-in walks the whole array each time.</p>
<p><strong>Tiny example:</strong> <code>arr.includes(x)</code>, <code>arr.indexOf(x)</code> and <code>arr.shift()</code> are each O(n). Calling one inside a loop over n items gives O(n²).</p>
<p><strong>Fix:</strong> Use a <a href="#/topic/dsa-words#w-hash-set">Set</a> for "seen it?" checks, and a front index instead of <code>shift</code> for a <a href="#/topic/dsa-words#w-queue">queue</a>.</p>

<h3>Leaving out the recursion when counting space</h3>
<p><strong>What goes wrong:</strong> You say "O(1) space" for recursive code.</p>
<p><strong>Tiny example:</strong> A recursive walk down a skewed tree of 10,000 nodes has 10,000 calls waiting on the <a href="#/topic/dsa-words#w-call-stack">call stack</a> at once: O(n) space, and maybe a <a href="#/topic/dsa-words#w-stack-overflow">stack overflow</a>.</p>
<p><strong>Fix:</strong> Space = extra data structures + the deepest the recursion goes.</p>

<h3>Sorting numbers without a comparator</h3>
<p><strong>What goes wrong:</strong> <code>sort()</code> compares as text, so numbers end up in the wrong order.</p>
<p><strong>Tiny example:</strong> <code>[10, 9, 1].sort()</code> gives <code>[1, 10, 9]</code>.</p>
<p><strong>Fix:</strong> Always pass a <a href="#/topic/dsa-words#w-sorted">comparator</a> for numbers: <code>sort((a, b) =&gt; a - b)</code>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What does O(n log n) mean, in plain words?</div>
  <div class="qa-answer">
    <p>There are n items, and each one gets handled about log n times. log n is how many times you can halve n before reaching 1, which is about 20 for a million. So a million items take about 20 million steps.</p><p>It is the cost of good sorting, such as merge sort: split in half about log n times, and each level of splitting touches all n items. See <a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is the difference between a subarray and a subsequence?</div>
  <div class="qa-answer">
    <p>A <a href="#/topic/dsa-words#w-subarray">subarray</a> is a run of neighbours: no gaps. A <a href="#/topic/dsa-words#w-subsequence">subsequence</a> keeps the original order but may skip items.</p><p>From <code>[3, 1, 4, 1, 5]</code>, <code>[1, 4, 1]</code> is a subarray, and <code>[3, 4, 5]</code> is a subsequence but not a subarray. There are about n²/2 subarrays but 2ⁿ subsequences, so subsequence questions usually need <a href="#/topic/dsa-words#w-dp">DP</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why is looking something up in a hash map O(1)?</div>
  <div class="qa-answer">
    <p>A <a href="#/topic/dsa-words#w-hash-function">hash function</a> turns the key straight into a slot number, so the map jumps to that slot instead of searching. Like a coat check: ticket 42 goes straight to hook 42.</p><p>It is O(1) on <em>average</em>. If many keys collide in one slot, the map has to look through that slot, so the worst case is O(n). With a good hash function that is very rare.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What does "amortized O(1)" mean?</div>
  <div class="qa-answer">
    <p>Most operations are cheap, and a rare one is expensive. Spread over a long run, the average cost per operation is still O(1). This is a guarantee, not luck.</p><p>Example: array <code>push</code>. When the array is full, it copies everything into a bigger space (say, twice as big). Over 1,000 pushes that is only about 1,000 copies in total: about one per push. See <a href="#/topic/dsa-words#w-amortized">amortized</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What is a base case, and what happens if you forget it?</div>
  <div class="qa-answer">
    <p>The <a href="#/topic/dsa-words#w-base-case">base case</a> is the smallest version of the problem, which the function answers directly instead of calling itself again. For a tree, it is usually "the node is null".</p><p>Without it, the function calls itself forever. In JavaScript you get <code>RangeError: Maximum call stack size exceeded</code>, a <a href="#/topic/dsa-words#w-stack-overflow">stack overflow</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. When would you use BFS instead of DFS?</div>
  <div class="qa-answer">
    <p>Use <a href="#/topic/dsa-words#w-bfs">BFS</a> when you need the <strong>fewest steps</strong> and every edge costs the same. It explores level by level with a queue, so the first time it reaches a place is by the shortest route.</p><p>Use <a href="#/topic/dsa-words#w-dfs">DFS</a> to explore everything, check whether a path exists, detect cycles, or for backtracking and tree recursion. Both are O(V + E).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What is memoization?</div>
  <div class="qa-answer">
    <p>Saving the result of each function call in a Map, so the same question is never worked out twice. The second time, you just read the answer back.</p><p>It turns plain recursive Fibonacci from O(2ⁿ) into O(n) time, at the cost of O(n) memory. It is the "top-down" style of <a href="#/topic/dsa-words#w-dp">DP</a>. See <a href="#/topic/dsa-words#w-memoization">memoization</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What is the difference between time and space complexity?</div>
  <div class="qa-answer">
    <p><a href="#/topic/dsa-words#w-time-complexity">Time complexity</a> is how the number of steps grows as the input grows. <a href="#/topic/dsa-words#w-space-complexity">Space complexity</a> is how the extra memory grows. Do not count the input itself, but do count waiting recursive calls.</p><p>Like cooking: time is how long it takes, space is how many extra bowls you dirty. Always give both in an interview.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What does "in-place" mean?</div>
  <div class="qa-answer">
    <p>You change the array you were given, instead of building a new one, so you use only O(1) extra memory. Reversing an array by swapping its two ends and moving inwards is in-place. See <a href="#/topic/dsa-words#w-in-place">in-place</a>.</p><p>Check whether you are allowed to change the input. If the caller still needs the original, in-place is the wrong choice.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What is an invariant, and why mention it in an interview?</div>
  <div class="qa-answer">
    <p>An <a href="#/topic/dsa-words#w-invariant">invariant</a> is a fact your loop keeps true at every step, for example "<code>windowSum</code> equals the total of everything inside the window".</p><p>Saying it out loud shows you know <em>why</em> the code is correct, not just that it passed a test. It also helps you place the <code>+1</code>s and <code>-1</code>s correctly.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What is a monotonic stack, and when do you reach for it?</div>
  <div class="qa-answer">
    <p>A <a href="#/topic/dsa-words#w-stack">stack</a> kept in <a href="#/topic/dsa-words#w-monotonic">one-direction</a> order. Before pushing, you pop everything that would break the order.</p><p>Reach for it when the question says "next greater", "next smaller" or "previous warmer day". Each item is pushed and popped at most once, so it is O(n). See <a href="#/topic/dsa-words#w-monotonic-stack">monotonic stack</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What is the difference between greedy and dynamic programming?</div>
  <div class="qa-answer">
    <p><a href="#/topic/dsa-words#w-greedy">Greedy</a> takes the best-looking choice at each step and never looks back. It is fast, but only correct for some problems. <a href="#/topic/dsa-words#w-dp">DP</a> considers every choice, saving answers to smaller questions so nothing is worked out twice.</p><p>Coins 1, 3, 4 for amount 6: greedy says 4 + 1 + 1 (3 coins), but DP finds 3 + 3 (2 coins).</p>
  </div>
</div>
` },

  ],
});
