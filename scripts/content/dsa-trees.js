window.PREP_SITE.registerTopic({
  id: 'dsa-trees',
  module: 'dsa',
  title: 'Trees',
  estimatedReadTime: '45 min',
  tags: ['trees', 'binary-tree', 'bst', 'traversal', 'dfs', 'bfs', 'recursion', 'lca', 'serialize'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>tree</strong> is a connected acyclic graph: each node has one parent (except root) and any number of children. Trees model hierarchies — DOM, file systems, JSON, Abstract Syntax Trees, React fiber, navigation stacks, decision trees. In interview-land, the canonical species is the <strong>binary tree</strong>: every node has at most two children (<code>left</code>, <code>right</code>).</p>
<ul>
  <li><strong>Two traversal families:</strong> <em>DFS</em> (preorder, inorder, postorder — usually recursive or stack-based) and <em>BFS</em> (level-order via queue).</li>
  <li><strong>BST</strong> = binary tree with the invariant <code>left &lt; root &lt; right</code>. Search/insert/delete are O(h) where h is height — O(log n) balanced, O(n) worst case.</li>
  <li><strong>Inorder traversal of a BST</strong> yields sorted output. Memorize this.</li>
  <li><strong>The "carry up vs carry down" pattern</strong> determines most tree problem shapes: do you compute children first and combine (postorder), or pass parent state down (preorder)?</li>
  <li><strong>Recursion is the natural fit</strong> — trees ARE recursive structures. Every tree problem has a clean recursive solution; iterative versions exist when stack depth matters.</li>
  <li><strong>Common patterns:</strong> max depth, diameter, lowest common ancestor (LCA), path sum, serialize/deserialize, validate BST, level-order, zig-zag, view (left/right/top/bottom), sum of paths.</li>
  <li><strong>Balanced trees</strong> (AVL, red-black, B-tree) are mostly used in databases and engine internals; rarely required to implement in interviews — but knowing they exist matters.</li>
</ul>
<p><strong>Mantra:</strong> "Recurse on subtrees. Decide the work order. Pick BFS only if you need level-by-level."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a tree?</h3>
<p>A tree is a hierarchical data structure: a connected acyclic graph with a designated <strong>root</strong>. Each node holds a value and references to its <strong>children</strong>. A node's children are themselves the roots of <strong>subtrees</strong> — this recursive structure is what makes trees so amenable to recursion.</p>

<h3>Anatomy</h3>
<table>
  <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td>Root</td><td>The unique top node with no parent</td></tr>
    <tr><td>Leaf</td><td>A node with no children</td></tr>
    <tr><td>Internal node</td><td>Any non-leaf node</td></tr>
    <tr><td>Edge</td><td>The connection between a node and a child</td></tr>
    <tr><td>Depth (of a node)</td><td>Number of edges from root to that node (root depth = 0)</td></tr>
    <tr><td>Height (of a node / tree)</td><td>Longest path from that node to any leaf below it</td></tr>
    <tr><td>Subtree</td><td>The tree rooted at any node</td></tr>
    <tr><td>Ancestor / descendant</td><td>Predecessor / successor along the parent-child path</td></tr>
  </tbody>
</table>

<h3>Common tree variants</h3>
<table>
  <thead><tr><th>Variant</th><th>Property</th><th>Used for</th></tr></thead>
  <tbody>
    <tr><td>Binary tree</td><td>≤ 2 children per node</td><td>Most interview problems; expression trees</td></tr>
    <tr><td>Binary search tree (BST)</td><td><code>left &lt; root &lt; right</code></td><td>Ordered set/map (when balanced)</td></tr>
    <tr><td>Balanced BST (AVL, red-black)</td><td>Height kept O(log n) via rotations</td><td>Standard libraries' ordered map (Java TreeMap, C++ std::map)</td></tr>
    <tr><td>B-tree / B+ tree</td><td>Many children per node, kept balanced</td><td>Disk-backed indexes (SQLite, PostgreSQL, MongoDB)</td></tr>
    <tr><td>Trie (prefix tree)</td><td>Path from root to node spells a string</td><td>Autocomplete, dictionaries, IP routing</td></tr>
    <tr><td>Segment tree / Fenwick tree</td><td>Aggregates ranges</td><td>Competitive programming, range sum / min queries</td></tr>
    <tr><td>Heap</td><td>Complete binary tree with heap property</td><td>Priority queues (separate topic)</td></tr>
    <tr><td>N-ary tree</td><td>Any number of children</td><td>DOM, JSON, file system</td></tr>
  </tbody>
</table>

<h3>Why trees show up everywhere</h3>
<ol>
  <li><strong>Hierarchy</strong> is the most natural way to model real-world structure: company orgs, file paths, taxonomies, comment threads.</li>
  <li><strong>Logarithmic operations</strong> when balanced — sets, ordered maps, range queries.</li>
  <li><strong>Recursive computation</strong> mirrors recursive structure: parsers, compilers, interpreters, layout engines.</li>
  <li><strong>Rendering frameworks</strong> (React, Vue, RN, SwiftUI) all maintain a virtual / rendered tree; understanding diffing requires understanding tree manipulation.</li>
</ol>

<h3>What "good" looks like in an interview</h3>
<ul>
  <li>You sketch the tree on paper / whiteboard before coding.</li>
  <li>You identify the traversal pattern (DFS preorder/inorder/postorder, BFS).</li>
  <li>You decide what each recursive call <em>returns</em> (max depth, sum, boolean validity, list of paths).</li>
  <li>You handle base cases (null, single node) first.</li>
  <li>You discuss time/space complexity (typically O(n) time, O(h) space for recursion).</li>
  <li>You convert recursion → iteration if stack depth is a concern.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "subtree solver" pattern</h3>
<p>Every recursive tree solution has the same shape:</p>
<pre><code class="language-text">function solve(node):
  if node is null: return BASE
  L = solve(node.left)
  R = solve(node.right)
  return COMBINE(node.val, L, R)
</code></pre>
<p>Three choices define the problem:</p>
<ol>
  <li><strong>BASE</strong> — what does null contribute? (0 for sums, true for validation, etc.)</li>
  <li><strong>What do L and R return?</strong> (depth, sum, list, boolean...)</li>
  <li><strong>COMBINE</strong> — how do you merge children's answers with the current node? (max, sum, &amp;&amp;, concat...)</li>
</ol>

<h3>The three DFS orders</h3>
<table>
  <thead><tr><th>Order</th><th>Code shape</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Preorder</td><td>visit → left → right</td><td>Serialize, copy, "do something at every node before descending"</td></tr>
    <tr><td>Inorder</td><td>left → visit → right</td><td>BST sorted output, expression-tree infix</td></tr>
    <tr><td>Postorder</td><td>left → right → visit</td><td>Aggregating from leaves up: heights, sums, validation, deletion</td></tr>
  </tbody>
</table>

<h3>BFS = level-order = queue</h3>
<pre><code class="language-js">function bfs(root) {
  if (!root) return;
  const queue = [root];
  while (queue.length) {
    const levelSize = queue.length;     // snapshot
    for (let i = 0; i &lt; levelSize; i++) {
      const node = queue.shift();
      // process node
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    // end of level
  }
}
</code></pre>
<p>The <code>levelSize</code> snapshot is the trick that lets BFS distinguish "this level" from "next level" — used for level averages, zig-zag, right-side view, etc.</p>

<h3>The "carry down vs carry up" decision</h3>
<table>
  <thead><tr><th>Carry down (preorder-like)</th><th>Carry up (postorder-like)</th></tr></thead>
  <tbody>
    <tr><td>Pass state into the recursive call (depth, path, current sum)</td><td>Children compute and return; you combine</td></tr>
    <tr><td><code>solve(node, parentSum)</code></td><td><code>const x = solve(node.left)</code></td></tr>
    <tr><td>Path-from-root problems</td><td>Subtree-aggregate problems</td></tr>
    <tr><td>Path Sum, Sum Root to Leaf</td><td>Max Depth, Diameter, Validate BST</td></tr>
  </tbody>
</table>

<h3>BST mental model</h3>
<p>A BST is a binary tree with the invariant: for every node, <em>all</em> values in the left subtree are <em>less than</em> the node's value, and <em>all</em> values in the right subtree are <em>greater than</em>. Two consequences:</p>
<ol>
  <li><strong>Inorder traversal yields sorted output.</strong></li>
  <li><strong>Search runs in O(h) time.</strong> Compare with the node; go left or right.</li>
</ol>
<p>Critically, the invariant is about <em>all descendants</em>, not just immediate children. This trips up the naive "validate BST" attempt:</p>
<pre><code class="language-js">// WRONG: only checks immediate children
function isBST(node) {
  if (!node) return true;
  if (node.left &amp;&amp; node.left.val &gt;= node.val) return false;
  if (node.right &amp;&amp; node.right.val &lt;= node.val) return false;
  return isBST(node.left) &amp;&amp; isBST(node.right);
}

// RIGHT: pass min/max bounds down
function isBST(node, min = -Infinity, max = Infinity) {
  if (!node) return true;
  if (node.val &lt;= min || node.val &gt;= max) return false;
  return isBST(node.left, min, node.val) &amp;&amp; isBST(node.right, node.val, max);
}
</code></pre>

<h3>Recursion stack ≈ tree depth</h3>
<p>For balanced trees, recursion depth is O(log n). For pathological skewed trees (every node has only a right child), it's O(n) — and for trees with millions of nodes, the JavaScript call stack overflows around 10,000 frames in V8. Iterate when in doubt.</p>

<h3>Common base cases</h3>
<table>
  <thead><tr><th>Problem type</th><th>Null returns</th></tr></thead>
  <tbody>
    <tr><td>Max depth</td><td>0</td></tr>
    <tr><td>Sum</td><td>0</td></tr>
    <tr><td>Path count</td><td>0</td></tr>
    <tr><td>Validate</td><td>true</td></tr>
    <tr><td>Find node</td><td>null</td></tr>
    <tr><td>Build list</td><td>[]</td></tr>
    <tr><td>LCA</td><td>null</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Node definition</h3>
<pre><code class="language-js">class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}
</code></pre>

<h3>The four traversals</h3>
<pre><code class="language-js">// Preorder (root → left → right)
function preorder(node, out = []) {
  if (!node) return out;
  out.push(node.val);
  preorder(node.left, out);
  preorder(node.right, out);
  return out;
}

// Inorder (left → root → right)  — BST gives sorted
function inorder(node, out = []) {
  if (!node) return out;
  inorder(node.left, out);
  out.push(node.val);
  inorder(node.right, out);
  return out;
}

// Postorder (left → right → root) — aggregating
function postorder(node, out = []) {
  if (!node) return out;
  postorder(node.left, out);
  postorder(node.right, out);
  out.push(node.val);
  return out;
}

// Level-order (BFS)
function levelOrder(root) {
  if (!root) return [];
  const out = [];
  const q = [root];
  while (q.length) {
    const level = [];
    const sz = q.length;
    for (let i = 0; i &lt; sz; i++) {
      const n = q.shift();
      level.push(n.val);
      if (n.left) q.push(n.left);
      if (n.right) q.push(n.right);
    }
    out.push(level);
  }
  return out;
}
</code></pre>

<h3>Iterative DFS with a stack</h3>
<pre><code class="language-js">// Iterative preorder
function preorderIter(root) {
  if (!root) return [];
  const out = [];
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    out.push(n.val);
    if (n.right) stack.push(n.right);   // push right first so left pops first
    if (n.left) stack.push(n.left);
  }
  return out;
}

// Iterative inorder — Morris traversal does it in O(1) extra space (advanced)
function inorderIter(root) {
  const out = [], stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    out.push(cur.val);
    cur = cur.right;
  }
  return out;
}
</code></pre>

<h3>Maximum depth</h3>
<pre><code class="language-js">function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
</code></pre>

<h3>Diameter (longest path between any two nodes)</h3>
<pre><code class="language-js">function diameter(root) {
  let best = 0;
  function depth(node) {
    if (!node) return 0;
    const L = depth(node.left);
    const R = depth(node.right);
    best = Math.max(best, L + R);   // path through this node
    return 1 + Math.max(L, R);
  }
  depth(root);
  return best;
}
</code></pre>

<h3>Validate BST (using bounds)</h3>
<pre><code class="language-js">function isValidBST(root, min = -Infinity, max = Infinity) {
  if (!root) return true;
  if (root.val &lt;= min || root.val &gt;= max) return false;
  return isValidBST(root.left, min, root.val)
      &amp;&amp; isValidBST(root.right, root.val, max);
}
</code></pre>

<h3>Lowest Common Ancestor — generic binary tree</h3>
<pre><code class="language-js">function lca(root, p, q) {
  if (!root || root === p || root === q) return root;
  const L = lca(root.left, p, q);
  const R = lca(root.right, p, q);
  if (L &amp;&amp; R) return root;       // p and q diverge here
  return L || R;                  // both on one side
}
</code></pre>

<h3>LCA in BST (faster — exploits ordering)</h3>
<pre><code class="language-js">function lcaBST(root, p, q) {
  while (root) {
    if (p.val &lt; root.val &amp;&amp; q.val &lt; root.val) root = root.left;
    else if (p.val &gt; root.val &amp;&amp; q.val &gt; root.val) root = root.right;
    else return root;
  }
  return null;
}
</code></pre>

<h3>BST insert / search / delete</h3>
<pre><code class="language-js">function insert(root, val) {
  if (!root) return new TreeNode(val);
  if (val &lt; root.val) root.left = insert(root.left, val);
  else if (val &gt; root.val) root.right = insert(root.right, val);
  return root;
}

function search(root, val) {
  if (!root || root.val === val) return root;
  return val &lt; root.val ? search(root.left, val) : search(root.right, val);
}

function deleteNode(root, val) {
  if (!root) return null;
  if (val &lt; root.val) root.left = deleteNode(root.left, val);
  else if (val &gt; root.val) root.right = deleteNode(root.right, val);
  else {
    // node found
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    // two children: replace with inorder successor (smallest in right subtree)
    let succ = root.right;
    while (succ.left) succ = succ.left;
    root.val = succ.val;
    root.right = deleteNode(root.right, succ.val);
  }
  return root;
}
</code></pre>

<h3>Path Sum (root to leaf)</h3>
<pre><code class="language-js">function hasPathSum(root, target) {
  if (!root) return false;
  if (!root.left &amp;&amp; !root.right) return root.val === target;
  return hasPathSum(root.left, target - root.val)
      || hasPathSum(root.right, target - root.val);
}
</code></pre>

<h3>Serialize / Deserialize (preorder + null markers)</h3>
<pre><code class="language-js">function serialize(root) {
  const out = [];
  function go(n) {
    if (!n) { out.push('#'); return; }
    out.push(String(n.val));
    go(n.left);
    go(n.right);
  }
  go(root);
  return out.join(',');
}

function deserialize(s) {
  const tokens = s.split(',');
  let i = 0;
  function build() {
    const t = tokens[i++];
    if (t === '#') return null;
    const n = new TreeNode(Number(t));
    n.left = build();
    n.right = build();
    return n;
  }
  return build();
}
</code></pre>

<h3>Right-side view (last node at each level)</h3>
<pre><code class="language-js">function rightView(root) {
  if (!root) return [];
  const out = [];
  const q = [root];
  while (q.length) {
    const sz = q.length;
    for (let i = 0; i &lt; sz; i++) {
      const n = q.shift();
      if (i === sz - 1) out.push(n.val);   // last in level
      if (n.left) q.push(n.left);
      if (n.right) q.push(n.right);
    }
  }
  return out;
}
</code></pre>

<h3>Convert sorted array to balanced BST</h3>
<pre><code class="language-js">function sortedArrayToBST(nums, lo = 0, hi = nums.length - 1) {
  if (lo &gt; hi) return null;
  const mid = (lo + hi) &gt;&gt; 1;
  const node = new TreeNode(nums[mid]);
  node.left = sortedArrayToBST(nums, lo, mid - 1);
  node.right = sortedArrayToBST(nums, mid + 1, hi);
  return node;
}
</code></pre>

<h3>Build tree from preorder + inorder</h3>
<pre><code class="language-js">function buildTree(preorder, inorder) {
  const inIdx = new Map(inorder.map((v, i) =&gt; [v, i]));
  let p = 0;
  function build(lo, hi) {
    if (lo &gt; hi) return null;
    const val = preorder[p++];
    const node = new TreeNode(val);
    const mid = inIdx.get(val);
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  }
  return build(0, inorder.length - 1);
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Maximum Path Sum (any node to any node)</h3>
<pre><code class="language-js">function maxPathSum(root) {
  let best = -Infinity;
  function gain(node) {
    if (!node) return 0;
    const L = Math.max(0, gain(node.left));   // negative gain → drop
    const R = Math.max(0, gain(node.right));
    best = Math.max(best, L + R + node.val);   // path through node
    return node.val + Math.max(L, R);          // best one-arm extension
  }
  gain(root);
  return best;
}
</code></pre>
<p>The trick: each call <em>updates</em> the global best AND <em>returns</em> the best one-sided extension to the parent. Two-roles-per-call is the postorder pattern.</p>

<h3>Example 2: Symmetric Tree</h3>
<pre><code class="language-js">function isSymmetric(root) {
  function mirror(a, b) {
    if (!a &amp;&amp; !b) return true;
    if (!a || !b) return false;
    return a.val === b.val
        &amp;&amp; mirror(a.left, b.right)
        &amp;&amp; mirror(a.right, b.left);
  }
  return !root || mirror(root.left, root.right);
}
</code></pre>

<h3>Example 3: Zig-zag level order</h3>
<pre><code class="language-js">function zigzag(root) {
  if (!root) return [];
  const out = [];
  const q = [root];
  let leftToRight = true;
  while (q.length) {
    const sz = q.length;
    const level = [];
    for (let i = 0; i &lt; sz; i++) {
      const n = q.shift();
      if (leftToRight) level.push(n.val);
      else level.unshift(n.val);
      if (n.left) q.push(n.left);
      if (n.right) q.push(n.right);
    }
    out.push(level);
    leftToRight = !leftToRight;
  }
  return out;
}
</code></pre>

<h3>Example 4: Count Univalue Subtrees</h3>
<pre><code class="language-js">function countUnivalSubtrees(root) {
  let count = 0;
  function isUnival(node) {
    if (!node) return true;
    const L = isUnival(node.left);
    const R = isUnival(node.right);
    if (!L || !R) return false;
    if (node.left &amp;&amp; node.left.val !== node.val) return false;
    if (node.right &amp;&amp; node.right.val !== node.val) return false;
    count++;
    return true;
  }
  isUnival(root);
  return count;
}
</code></pre>

<h3>Example 5: Flatten BT to linked list (preorder)</h3>
<pre><code class="language-js">function flatten(root) {
  let prev = null;
  function go(n) {
    if (!n) return;
    go(n.right);    // reverse postorder!
    go(n.left);
    n.right = prev;
    n.left = null;
    prev = n;
  }
  go(root);
}
</code></pre>

<h3>Example 6: Kth smallest in BST</h3>
<pre><code class="language-js">function kthSmallest(root, k) {
  // Iterative inorder
  const stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    if (--k === 0) return cur.val;
    cur = cur.right;
  }
}
</code></pre>

<h3>Example 7: All Root-to-Leaf paths</h3>
<pre><code class="language-js">function binaryTreePaths(root) {
  const out = [];
  function go(n, path) {
    if (!n) return;
    path.push(n.val);
    if (!n.left &amp;&amp; !n.right) {
      out.push(path.join('-&gt;'));
    } else {
      go(n.left, path);
      go(n.right, path);
    }
    path.pop();   // backtrack
  }
  go(root, []);
  return out;
}
</code></pre>

<h3>Example 8: Lowest Common Ancestor in BST</h3>
<pre><code class="language-js">function lowestCommonAncestor(root, p, q) {
  let cur = root;
  while (cur) {
    if (p.val &lt; cur.val &amp;&amp; q.val &lt; cur.val) cur = cur.left;
    else if (p.val &gt; cur.val &amp;&amp; q.val &gt; cur.val) cur = cur.right;
    else return cur;     // split point
  }
}
</code></pre>

<h3>Example 9: Diameter via height memoization</h3>
<pre><code class="language-js">function diameterOfBinaryTree(root) {
  let dia = 0;
  function depth(n) {
    if (!n) return 0;
    const L = depth(n.left);
    const R = depth(n.right);
    dia = Math.max(dia, L + R);
    return 1 + Math.max(L, R);
  }
  depth(root);
  return dia;
}
</code></pre>

<h3>Example 10: Sum-Root-to-Leaf Numbers</h3>
<pre><code class="language-js">function sumNumbers(root) {
  function go(n, cur) {
    if (!n) return 0;
    cur = cur * 10 + n.val;
    if (!n.left &amp;&amp; !n.right) return cur;
    return go(n.left, cur) + go(n.right, cur);
  }
  return go(root, 0);
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Empty tree</h3>
<p>The single most common omission. <code>maxDepth(null)</code> should return 0; <code>levelOrder(null)</code> should return <code>[]</code>; <code>isBST(null)</code> should return true. Always handle null at the top.</p>

<h3>Single-node tree</h3>
<p>Tree of one node — leaf is also root. <code>maxDepth</code> = 1; <code>diameter</code> = 0 (no edges). Test against <code>[1]</code>.</p>

<h3>Skewed tree (every node has only one child)</h3>
<p>Effectively a linked list. Recursion depth = n. Hits V8's stack limit (~10,000) for large n. Convert to iterative or increase stack via <code>setImmediate</code> trampolining if absolutely necessary.</p>

<h3>Duplicates</h3>
<p>BST behavior with duplicates is implementation-defined. Some allow duplicates only on the right (or left); some forbid them. Clarify in interviews. The "<code>&lt; root &lt;</code>" formulation forbids duplicates and is the safe default.</p>

<h3>Inorder of BST is NOT strictly increasing if duplicates exist</h3>
<p>Naive validation: "inorder must be strictly sorted." With duplicates allowed, you need to redefine "valid." Always pin down duplicates handling.</p>

<h3>BST validation with Number boundaries</h3>
<p>Using <code>-Infinity</code> / <code>Infinity</code> as initial bounds works in JS. In other languages you need <code>Long.MIN_VALUE</code> / similar. <em>Never</em> use 0 as the initial lower bound — your tree might contain negative numbers.</p>

<h3>Level-order with <code>shift()</code></h3>
<p><code>Array.prototype.shift()</code> is O(n). For a tree of n nodes, BFS becomes O(n²). Use a deque (head pointer + array) or a real queue:</p>
<pre><code class="language-js">// O(n) BFS
let head = 0;
const q = [root];
while (head &lt; q.length) {
  const n = q[head++];
  if (n.left) q.push(n.left);
  if (n.right) q.push(n.right);
}
</code></pre>

<h3>Postorder iterative is tricky</h3>
<p>Iterative postorder requires either a marker or two stacks. Common approach: do reversed-preorder (root → right → left) and reverse the result. If the interviewer wants "true postorder traversal" (with visit timing), use the marker pattern.</p>

<h3>Mutating during traversal</h3>
<p>Deleting nodes during inorder is dangerous — your <code>cur.right</code> may have been freed. Either collect targets first then delete, or use postorder so children are processed before parents.</p>

<h3>Tree is a graph in disguise</h3>
<p>If the input is a "tree" but not pre-rooted (e.g., "given a list of edges"), pick any root and DFS/BFS from there. Common in graph-flavored tree problems (e.g., diameter of a generic tree).</p>

<h3>Finding parent</h3>
<p>Standard nodes don't have a <code>parent</code> pointer. To find ancestors, either:</p>
<ul>
  <li>Maintain a parent map during initial traversal.</li>
  <li>Pass the parent down as a parameter.</li>
  <li>Use a stack-based DFS keeping track of the path.</li>
</ul>

<h3>Serialization formats</h3>
<p>Many serialization schemes exist:</p>
<ul>
  <li>Preorder + null markers (works for any tree).</li>
  <li>Level-order + null markers (LeetCode's default).</li>
  <li>Inorder alone (does NOT uniquely determine a tree).</li>
  <li>Two of (pre, in, post) (uniquely determine a binary tree if no duplicates).</li>
</ul>

<h3>Cycle in a "tree"</h3>
<p>If the input is supposed to be a tree but actually contains a cycle, naive DFS infinite-loops. If you don't trust the input (e.g., parsing user data), include a visited set.</p>

<h3>Memory: how much does a deep recursion cost?</h3>
<p>Each recursive frame in V8 ≈ ~64–128 bytes. 10,000 deep = 1MB stack. Plus closure variables, parameters. Usually fine. For n &gt; 1M, iteration is mandatory.</p>

<h3>Numerical overflow in path sums</h3>
<p>JS numbers are 64-bit floats — safe integer is 2⁵³. Sum of paths that approach this need BigInt or modular arithmetic.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Validating BST with only adjacent comparisons</h3>
<pre><code class="language-js">// BAD — passes for invalid trees like [10,5,15,null,null,6,20]
//        — 6 is in 15's left subtree but 6 &lt; 10, BST invariant broken
function isBST(node) {
  if (!node) return true;
  if (node.left &amp;&amp; node.left.val &gt;= node.val) return false;
  if (node.right &amp;&amp; node.right.val &lt;= node.val) return false;
  return isBST(node.left) &amp;&amp; isBST(node.right);
}
// FIX — pass min/max bounds down (see Mechanics)
</code></pre>

<h3>Bug 2: Diameter as just max(L, R)</h3>
<pre><code class="language-js">// BAD — depth, not diameter
function diameter(node) {
  if (!node) return 0;
  return 1 + Math.max(diameter(node.left), diameter(node.right));
}
// Diameter passes THROUGH the node — sum L+R, not max.
</code></pre>

<h3>Bug 3: Forgetting null returns 0 (or appropriate base)</h3>
<pre><code class="language-js">function maxDepth(node) {
  if (!node) return;        // ❌ returns undefined
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}
// Math.max(undefined, undefined) = NaN; depth becomes NaN forever.
// FIX — return 0 for null.
</code></pre>

<h3>Bug 4: Mutation order in flatten</h3>
<pre><code class="language-js">// BAD — overwrites left before recursing on right's original
function flatten(node) {
  if (!node) return;
  node.left = null;          // ❌ lost
  node.right = node.left;    // now null
  // ...
}
// FIX — capture originals first, or do reverse-postorder (right → left → visit)
</code></pre>

<h3>Bug 5: Using global state without reset</h3>
<pre><code class="language-js">let best = 0;
function diameter(root) {
  best = 0;     // ❌ — easy to forget if module-level
  function depth(n) { /* updates best */ }
  depth(root);
  return best;
}
// FIX — declare best inside diameter, use closure
</code></pre>

<h3>Bug 6: BFS using <code>shift</code> in tight loops</h3>
<p>O(n²) for large trees. Use index-based dequeue or a real Deque structure.</p>

<h3>Bug 7: Modifying tree while iterating</h3>
<pre><code class="language-js">// BAD — deleting nodes during inorder may break right-pointer traversal
function deleteEvens(root) {
  inorder(root, n =&gt; { if (n.val % 2 === 0) deleteNode(root, n.val); });
}
// FIX — collect targets first, then delete
</code></pre>

<h3>Bug 8: BST insert with === instead of &lt;/&gt;</h3>
<pre><code class="language-js">function insert(root, val) {
  if (!root) return new TreeNode(val);
  if (val === root.val) return root;            // ✓ ignore duplicates
  if (val &gt; root.val) root.left = insert(root.left, val);   // ❌ swapped
  return root;
}
// FIX — &lt; goes left; &gt; goes right
</code></pre>

<h3>Bug 9: LCA on a graph that contains the same value twice</h3>
<p>Naive LCA assumes unique values. If <code>p.val === q.val</code> exists in two unrelated subtrees, comparison-by-value fails. Always compare by reference (<code>node === p</code>), not by value.</p>

<h3>Bug 10: Building tree from preorder+postorder without uniqueness check</h3>
<p>Pre+post does NOT uniquely determine a binary tree (only full binary trees). Pre+in or post+in do. Clarify input guarantees.</p>

<h3>Anti-pattern 1: Not drawing the tree</h3>
<p>"I'll just code it." Hours later, a bug. Spend 30 seconds on paper; saves 5 minutes of debugging.</p>

<h3>Anti-pattern 2: Recomputing depth in nested calls</h3>
<pre><code class="language-js">// BAD — diameter recomputes depth O(n) times → O(n²)
function diameter(node) {
  if (!node) return 0;
  return Math.max(
    depth(node.left) + depth(node.right),
    diameter(node.left), diameter(node.right)
  );
}
// FIX — compute depth once, update best inline
</code></pre>

<h3>Anti-pattern 3: Using arrays as trees with index math</h3>
<p>Heap representation aside, mapping a sparse binary tree to an array (Fenwick / segment trees) requires careful sizing. For interviews, prefer node objects unless the problem is heap-shaped.</p>

<h3>Anti-pattern 4: Printing as debugging strategy</h3>
<p>Print the tree pre/in/post-order to confirm shape. Better: write a small <code>printTree</code> that draws it 2D (level-by-level with indentation). Saves ~50% of debugging time.</p>

<h3>Anti-pattern 5: Returning multiple values via array hacks</h3>
<pre><code class="language-js">// BAD — fragile
function go(n) { return [depth, sum, isValid]; }
// FIX — return an object with named keys; readability wins
function go(n) { return { depth, sum, isValid }; }
</code></pre>

<h3>Anti-pattern 6: Forgetting iterative version exists</h3>
<p>Skewed inputs blow the stack. If interviewer asks "what about deep trees," have the iterative version ready (stack for DFS, queue for BFS).</p>

<h3>Anti-pattern 7: Confusing height with depth</h3>
<table>
  <thead><tr><th>Term</th><th>Direction</th></tr></thead>
  <tbody>
    <tr><td>Depth</td><td>Distance from root downward</td></tr>
    <tr><td>Height</td><td>Distance to deepest leaf below</td></tr>
  </tbody>
</table>
<p>"Max depth of tree" = "height of root". Different at non-root nodes.</p>

<h3>Anti-pattern 8: Hand-rolling balanced BST</h3>
<p>AVL/red-black implementations are 100+ lines of rotations. Almost never asked in interviews; certainly not implemented from scratch on a whiteboard. If you need an ordered map, use the language's built-in (Java's TreeMap, C++'s std::map). JS has no built-in; use a sorted array + binary search if the problem requires.</p>
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
    <tr><td>Maximum Depth</td><td>postorder; <code>1 + max(L, R)</code></td></tr>
    <tr><td>Diameter</td><td>postorder + global best updated by <code>L + R</code></td></tr>
    <tr><td>Symmetric Tree</td><td>mirror recursion on (left, right)</td></tr>
    <tr><td>Validate BST</td><td>pass (min, max) bounds down</td></tr>
    <tr><td>LCA generic</td><td>recurse; first place L &amp;&amp; R returns this node</td></tr>
    <tr><td>LCA in BST</td><td>walk down comparing values to bounds</td></tr>
    <tr><td>Path Sum (root → leaf)</td><td>preorder with running sum</td></tr>
    <tr><td>All root-to-leaf paths</td><td>preorder + path stack + backtrack</td></tr>
    <tr><td>Max Path Sum (any → any)</td><td>postorder; node updates best, returns one-arm</td></tr>
    <tr><td>Level Order / Zigzag / Right View</td><td>BFS with level-size snapshot</td></tr>
    <tr><td>Serialize / Deserialize</td><td>preorder with null markers</td></tr>
    <tr><td>Build Tree (pre+in / in+post)</td><td>recursion + index map</td></tr>
    <tr><td>Kth Smallest in BST</td><td>iterative inorder; stop at k</td></tr>
    <tr><td>Flatten BT</td><td>reverse preorder with prev pointer</td></tr>
  </tbody>
</table>

<h3>The "what to return" worksheet</h3>
<p>Before coding, fill out:</p>
<table>
  <thead><tr><th>Question</th><th>Your answer</th></tr></thead>
  <tbody>
    <tr><td>What does a null subtree contribute?</td><td>0 / true / [] / Infinity / null</td></tr>
    <tr><td>What information must each subtree return?</td><td>depth / sum / boolean / list / pair</td></tr>
    <tr><td>Do I need a global accumulator?</td><td>yes (e.g., diameter) / no</td></tr>
    <tr><td>Pre, in, or post order?</td><td>(decide based on dependency)</td></tr>
    <tr><td>Iterative needed for stack safety?</td><td>only if input can be huge</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Implement all four traversals (recursive + iterative).</li>
  <li>Validate BST with bounds.</li>
  <li>Compute diameter.</li>
  <li>Right-side view via BFS.</li>
  <li>LCA in BST and in generic binary tree.</li>
  <li>Serialize / deserialize.</li>
  <li>Convert sorted array → balanced BST.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>BST validate that only checks immediate children — fix with bounds.</li>
  <li>Diameter that returns max-depth instead of max-path — fix to L+R, not max(L, R).</li>
  <li>BFS using <code>shift()</code> on huge trees — switch to head pointer.</li>
  <li>Recursion blowing stack on a 1M-node skewed tree — switch to iterative.</li>
  <li>Tree serialization that uses inorder alone — non-unique; need pre+null or two orders.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Recursion fluency</td><td>You write the recursion cleanly without scaffolding.</td></tr>
    <tr><td>Pattern recognition</td><td>You name the traversal order before coding.</td></tr>
    <tr><td>Edge cases</td><td>You handle null, single, skewed proactively.</td></tr>
    <tr><td>Two-roles-per-call</td><td>You can do "update global, return useful piece" without confusion.</td></tr>
    <tr><td>BFS vs DFS</td><td>You pick BFS only when level-by-level is needed.</td></tr>
    <tr><td>Iterative fallback</td><td>You can convert recursion → iteration when asked.</td></tr>
    <tr><td>Complexity articulation</td><td>You quote O(n) time, O(h) space; you discuss balanced vs skewed.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>React fiber</strong> is a tree of fibers — diffing is a tree-walk with pause-and-resume; understanding tree manipulation directly maps.</li>
  <li><strong>Native view hierarchy</strong> (UIView on iOS, View on Android) is a tree; layout passes are postorder (compute children, combine).</li>
  <li><strong>Navigation stacks</strong> are degenerate trees (lists), but tab + nested stack structures are real trees.</li>
  <li><strong>JSON / nested config</strong> in your app is a tree — recursion / traversal patterns transfer directly.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why is BST validation easy with bounds but not with adjacent comparisons?"</em> — The invariant is over <em>all descendants</em>, not just immediate children. Bounds propagate the constraint correctly.</li>
  <li><em>"When would you choose iterative over recursive?"</em> — Skewed input, n &gt; ~10⁴, real-time perf where stack push/pop overhead matters, environments with small stacks (mobile JS engines).</li>
  <li><em>"How do you detect if two trees are structurally identical?"</em> — recursive: <code>same(a, b) = a.val === b.val &amp;&amp; same(a.l, b.l) &amp;&amp; same(a.r, b.r)</code>, with both-null base case.</li>
  <li><em>"How does Morris traversal achieve O(1) space inorder?"</em> — temporarily threads "next" pointers from each node's leftmost-rightmost descendant back to itself; restores them on the way up. O(n) time, O(1) space.</li>
  <li><em>"What's the practical cost of unbalanced BST?"</em> — Operations degrade to O(n). In production, always use a balanced variant (red-black, AVL) or a hash map.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add Morris traversal for O(1) space inorder."</li>
  <li>"I'd verify performance with a benchmark on a 100k-node skewed tree to confirm the iterative version doesn't blow the stack."</li>
  <li>"I'd handle duplicate values explicitly via a tie-break rule (always go right)."</li>
  <li>"I'd cache subtree heights per node so diameter / balanced-BST checks become O(n) on repeated queries."</li>
</ul>
`
    }
  ]
});
