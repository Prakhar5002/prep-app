window.PREP_SITE.registerTopic({
  id: 'dsa-stack-queue',
  module: 'DSA',
  title: 'Stack & Queue',
  estimatedReadTime: '24 min',
  tags: ['dsa', 'stack', 'queue', 'deque', 'monotonic-stack', 'lifo', 'fifo'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Stack (LIFO) and Queue (FIFO) are foundational structures. The patterns built on them — monotonic stack, BFS, balanced parens, expression eval — show up often.</p>
<ul>
  <li><strong>Stack</strong>: push/pop at one end. LIFO. <code>arr.push() / arr.pop()</code> in JS — O(1).</li>
  <li><strong>Queue</strong>: enqueue at one end, dequeue at the other. FIFO. JS arrays' <code>shift()</code> is O(n) — use a custom deque or two-stack queue for O(1).</li>
  <li><strong>Deque (double-ended queue)</strong>: O(1) push / pop at both ends. Useful for sliding window max, BFS variants.</li>
  <li><strong>Monotonic stack</strong>: stack maintained in increasing or decreasing order. Solves "next greater / smaller element" in O(n).</li>
  <li><strong>BFS</strong>: queue-based level-order traversal of trees / graphs.</li>
  <li><strong>Balanced parens, expression eval, undo / redo</strong> — classic stack uses.</li>
  <li><strong>Recursion = stack</strong>: any recursive solution can be made iterative with an explicit stack (avoid stack overflow on deep recursion).</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Stack solves "match the most recent" problems (parens, history, monotonic). Queue solves "process in order" (BFS, scheduling). When a brute force loops backward to find a match, monotonic stack often reduces it to O(n).</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Stack — LIFO</h3>
<p>Last-In-First-Out. Push adds to the top; pop removes from the top. Useful when you need to "remember the most recent" — undo/redo, function calls, balanced symbols.</p>
<p>JS: array with <code>push</code> / <code>pop</code>. Both O(1) amortized.</p>

<h3>Queue — FIFO</h3>
<p>First-In-First-Out. Enqueue adds at one end; dequeue removes at the other. Useful when order of arrival matters: BFS, task queues, message queues.</p>
<p>JS pitfall: <code>arr.shift()</code> is O(n). For O(1) queue, use a linked list, two-stack pattern, or index-based head pointer.</p>

<h3>Deque — both ends O(1)</h3>
<p>Double-ended queue. <code>pushFront</code>, <code>pushBack</code>, <code>popFront</code>, <code>popBack</code> all O(1). Powers monotonic deque, sliding window max, etc.</p>
<p>JS: implement via doubly linked list or two arrays. <code>arr.push</code> + <code>arr.pop</code> are O(1) but <code>arr.unshift / shift</code> are O(n).</p>

<h3>Monotonic stack</h3>
<p>Stack maintained in monotonic (increasing or decreasing) order. As you scan, pop elements that violate the monotonic property; push the new one. Solves:</p>
<ul>
  <li>Next greater / smaller element.</li>
  <li>Daily temperatures.</li>
  <li>Largest rectangle in histogram.</li>
  <li>Trapping rain water (alternative to two-pointer).</li>
</ul>
<p>Time: O(n) — each element pushed and popped at most once.</p>

<h3>Why "recursion = stack"</h3>
<p>Function calls use the call stack. Tree DFS recursive ↔ tree DFS with explicit stack. Useful when:</p>
<ul>
  <li>Avoiding stack overflow on deep recursion.</li>
  <li>Pausing / resuming traversal (e.g., for iterators).</li>
  <li>JS doesn't tail-call optimize, so deep recursion is dangerous.</li>
</ul>

<h3>BFS via queue</h3>
<p>Level-order tree traversal, shortest path in unweighted graph, flood fill. Initialize with start; while queue not empty: dequeue, process, enqueue neighbors. Visited set prevents revisits.</p>

<h3>Why deque for BFS variants</h3>
<p>0-1 BFS: edges weighted 0 or 1. Use deque: push to front for weight-0 edges, push to back for weight-1. Equivalent to Dijkstra in O(V+E).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "stack" picture</h3>
<div class="diagram">
<pre>
 push 1, push 2, push 3:
 [1, 2, 3]
        ↑ top

 pop():
 returns 3
 [1, 2]

 LIFO — most recent out first.</pre>
</div>

<h3>The "queue" picture</h3>
<div class="diagram">
<pre>
 enqueue 1, 2, 3:
 [1, 2, 3]
  ↑ front
        ↑ back

 dequeue():
 returns 1
 [2, 3]

 FIFO — first in first out.</pre>
</div>

<h3>The "monotonic stack" picture</h3>
<div class="diagram">
<pre>
 Decreasing stack (track next greater):

 nums:    [2, 1, 5, 3, 4]
 result:  [5, 5, ?, 4, ?]   ← next greater (or -1)

 i=0  push 2     stack: [2]
 i=1  push 1     stack: [2, 1]    (1 &lt; 2, monotonic decreasing)
 i=2  5 &gt; 1: pop 1 → result[1]=5
       5 &gt; 2: pop 2 → result[0]=5
       push 5  stack: [5]
 i=3  3 &lt; 5: push 3  stack: [5, 3]
 i=4  4 &gt; 3: pop 3 → result[3]=4
       4 &lt; 5: push 4  stack: [5, 4]
 end: leftover indices have no next greater → -1</pre>
</div>

<h3>The "balanced parens" picture</h3>
<div class="diagram">
<pre>
 "( ( ) [ ] )"

 push '(' → stack: ['(']
 push '(' → stack: ['(', '(']
 ')' → top is '('; pop. stack: ['(']
 push '[' → stack: ['(', '[']
 ']' → top is '['; pop. stack: ['(']
 ')' → top is '('; pop. stack: []
 stack empty at end → balanced ✓</pre>
</div>

<h3>The "BFS" picture</h3>
<div class="diagram">
<pre>
 Tree:        1
            /   \\
           2     3
          / \\    \\
         4   5    6

 BFS: queue [1] → [2,3] → [3,4,5] → [4,5,6] → [5,6] → [6] → []
 Visit order: 1, 2, 3, 4, 5, 6 (level by level)</pre>
</div>

<h3>The "deque for sliding max" picture</h3>
<pre><code>Window [3, 1, 5, 2, 4], k=3:
  i=0: dq=[0]                  (val 3)
  i=1: nums[i]=1 &lt; 3, push     dq=[0, 1]    (vals 3, 1)
  i=2: nums[i]=5 &gt; 1, pop 1
       5 &gt; 3, pop 0
       dq=[2]                  (val 5)
       window full → output 5
  i=3: 2 &lt; 5, push             dq=[2, 3]    (vals 5, 2)
       output 5
  i=4: 4 &gt; 2, pop 3
       4 &lt; 5, push             dq=[2, 4]    (vals 5, 4)
       output 5

 Max so far: 5, 5, 5
 Front of deque always holds max of current window.</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Use arr.shift() for queue dequeue." JS array's shift is O(n) (every element moves down). For O(1) queue, use a linked list, the two-stack trick, or an index-based head pointer.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Stack basics (JS)</h3>
<pre><code class="language-js">const stack = [];
stack.push(1);
stack.push(2);
const top = stack[stack.length - 1];   // peek
const popped = stack.pop();
const isEmpty = stack.length === 0;
// O(1) for push/pop/peek</code></pre>

<h3>Queue with index head pointer</h3>
<pre><code class="language-js">class Queue {
  constructor() { this.items = []; this.head = 0; }
  enqueue(x) { this.items.push(x); }
  dequeue() {
    if (this.head &gt;= this.items.length) return undefined;
    const x = this.items[this.head++];
    if (this.head &gt; 50 &amp;&amp; this.head &gt; this.items.length / 2) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return x;
  }
  get size() { return this.items.length - this.head; }
}
// O(1) amortized; periodic compaction prevents unbounded array growth.</code></pre>

<h3>Two-stack queue</h3>
<pre><code class="language-js">class QueueViaStacks {
  constructor() { this.in = []; this.out = []; }
  enqueue(x) { this.in.push(x); }
  dequeue() {
    if (this.out.length === 0) {
      while (this.in.length) this.out.push(this.in.pop());
    }
    return this.out.pop();
  }
}
// Each element pushed twice + popped twice → O(1) amortized.</code></pre>

<h3>Deque via doubly linked list</h3>
<pre><code class="language-js">class Deque {
  constructor() { this.head = null; this.tail = null; this.size = 0; }
  pushFront(x) {
    const node = { val: x, prev: null, next: this.head };
    if (this.head) this.head.prev = node;
    else this.tail = node;
    this.head = node;
    this.size++;
  }
  pushBack(x) {
    const node = { val: x, prev: this.tail, next: null };
    if (this.tail) this.tail.next = node;
    else this.head = node;
    this.tail = node;
    this.size++;
  }
  popFront() {
    if (!this.head) return undefined;
    const x = this.head.val;
    this.head = this.head.next;
    if (this.head) this.head.prev = null;
    else this.tail = null;
    this.size--;
    return x;
  }
  popBack() {
    if (!this.tail) return undefined;
    const x = this.tail.val;
    this.tail = this.tail.prev;
    if (this.tail) this.tail.next = null;
    else this.head = null;
    this.size--;
    return x;
  }
  peekFront() { return this.head?.val; }
  peekBack() { return this.tail?.val; }
}
// All O(1).</code></pre>

<h3>Balanced parentheses</h3>
<pre><code class="language-js">function isValid(s) {
  const stack = [];
  const pair = { ')': '(', ']': '[', '}': '{' };
  for (const c of s) {
    if (c === '(' || c === '[' || c === '{') stack.push(c);
    else if (stack.pop() !== pair[c]) return false;
  }
  return stack.length === 0;
}
// O(n) time, O(n) space.</code></pre>

<h3>Min stack</h3>
<pre><code class="language-js">class MinStack {
  constructor() { this.stack = []; this.minStack = []; }
  push(x) {
    this.stack.push(x);
    if (this.minStack.length === 0 || x &lt;= this.minStack.at(-1))
      this.minStack.push(x);
  }
  pop() {
    const x = this.stack.pop();
    if (x === this.minStack.at(-1)) this.minStack.pop();
    return x;
  }
  top() { return this.stack.at(-1); }
  getMin() { return this.minStack.at(-1); }
}
// All ops O(1). Auxiliary minStack tracks min at each level.</code></pre>

<h3>Monotonic stack — next greater element</h3>
<pre><code class="language-js">function nextGreater(nums) {
  const result = new Array(nums.length).fill(-1);
  const stack = [];   // indices, values decreasing from bottom
  for (let i = 0; i &lt; nums.length; i++) {
    while (stack.length &amp;&amp; nums[stack.at(-1)] &lt; nums[i]) {
      result[stack.pop()] = nums[i];
    }
    stack.push(i);
  }
  return result;
}
// O(n) time. Each element pushed and popped at most once.</code></pre>

<h3>Daily temperatures</h3>
<pre><code class="language-js">function dailyTemperatures(temps) {
  const result = new Array(temps.length).fill(0);
  const stack = [];
  for (let i = 0; i &lt; temps.length; i++) {
    while (stack.length &amp;&amp; temps[stack.at(-1)] &lt; temps[i]) {
      const j = stack.pop();
      result[j] = i - j;
    }
    stack.push(i);
  }
  return result;
}
// O(n) time. Same monotonic-stack pattern.</code></pre>

<h3>Largest rectangle in histogram</h3>
<pre><code class="language-js">function largestRectangle(heights) {
  const stack = [];   // indices of increasing heights
  let max = 0;
  for (let i = 0; i &lt;= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];
    while (stack.length &amp;&amp; heights[stack.at(-1)] &gt; h) {
      const idx = stack.pop();
      const width = stack.length ? i - stack.at(-1) - 1 : i;
      max = Math.max(max, heights[idx] * width);
    }
    stack.push(i);
  }
  return max;
}
// O(n) time, O(n) space.</code></pre>

<h3>Evaluate Reverse Polish Notation</h3>
<pre><code class="language-js">function evalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if (['+', '-', '*', '/'].includes(t)) {
      const b = stack.pop(), a = stack.pop();
      stack.push({
        '+': a + b, '-': a - b, '*': a * b,
        '/': Math.trunc(a / b),
      }[t]);
    } else {
      stack.push(Number(t));
    }
  }
  return stack[0];
}</code></pre>

<h3>BFS template</h3>
<pre><code class="language-js">function bfs(start) {
  const queue = [start];
  const visited = new Set([start]);
  while (queue.length) {
    const node = queue.shift();   // OK for small queues; use deque for big
    process(node);
    for (const next of neighbors(node)) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
}</code></pre>

<h3>Level-order traversal of tree</h3>
<pre><code class="language-js">function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  while (queue.length) {
    const level = [];
    const size = queue.length;
    for (let i = 0; i &lt; size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
// O(n) time, O(n) space.</code></pre>

<h3>Iterative tree traversals</h3>
<pre><code class="language-js">// Inorder
function inorder(root) {
  const result = [], stack = [];
  let curr = root;
  while (curr || stack.length) {
    while (curr) { stack.push(curr); curr = curr.left; }
    curr = stack.pop();
    result.push(curr.val);
    curr = curr.right;
  }
  return result;
}

// Preorder
function preorder(root) {
  if (!root) return [];
  const result = [], stack = [root];
  while (stack.length) {
    const node = stack.pop();
    result.push(node.val);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  return result;
}</code></pre>

<h3>Stack used for undo/redo</h3>
<pre><code class="language-js">class History {
  constructor() { this.undoStack = []; this.redoStack = []; }
  do(action) {
    this.undoStack.push(action);
    this.redoStack = [];   // any new action invalidates redo
  }
  undo() {
    const action = this.undoStack.pop();
    if (action) this.redoStack.push(action);
    return action;
  }
  redo() {
    const action = this.redoStack.pop();
    if (action) this.undoStack.push(action);
    return action;
  }
}</code></pre>

<h3>Implement Stack via Queue</h3>
<pre><code class="language-js">class StackViaQueue {
  constructor() { this.q = []; }
  push(x) {
    this.q.push(x);
    for (let i = 0; i &lt; this.q.length - 1; i++) this.q.push(this.q.shift());
  }
  pop() { return this.q.shift(); }
  top() { return this.q[0]; }
  empty() { return this.q.length === 0; }
}
// Push is O(n); pop O(1) (on the front-rotated queue).</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — Valid parentheses</h3>
<pre><code class="language-js">function isValid(s) {
  const stack = [];
  const pair = { ')': '(', ']': '[', '}': '{' };
  for (const c of s) {
    if (c in pair) {
      if (stack.pop() !== pair[c]) return false;
    } else {
      stack.push(c);
    }
  }
  return stack.length === 0;
}</code></pre>

<h3>Example 2 — Min stack</h3>
<pre><code class="language-js">class MinStack {
  constructor() { this.stack = []; this.min = []; }
  push(x) {
    this.stack.push(x);
    this.min.push(this.min.length === 0 ? x : Math.min(x, this.min.at(-1)));
  }
  pop() { this.min.pop(); return this.stack.pop(); }
  top() { return this.stack.at(-1); }
  getMin() { return this.min.at(-1); }
}</code></pre>

<h3>Example 3 — Daily temperatures (monotonic stack)</h3>
<pre><code class="language-js">function dailyTemperatures(temps) {
  const result = new Array(temps.length).fill(0);
  const stack = [];
  for (let i = 0; i &lt; temps.length; i++) {
    while (stack.length &amp;&amp; temps[stack.at(-1)] &lt; temps[i]) {
      const j = stack.pop();
      result[j] = i - j;
    }
    stack.push(i);
  }
  return result;
}</code></pre>

<h3>Example 4 — Next greater element</h3>
<pre><code class="language-js">function nextGreaterElement(nums1, nums2) {
  const map = new Map();
  const stack = [];
  for (const n of nums2) {
    while (stack.length &amp;&amp; stack.at(-1) &lt; n) map.set(stack.pop(), n);
    stack.push(n);
  }
  return nums1.map(n =&gt; map.get(n) ?? -1);
}</code></pre>

<h3>Example 5 — Trapping rain water (monotonic stack alt)</h3>
<pre><code class="language-js">function trap(height) {
  const stack = [];
  let water = 0;
  for (let i = 0; i &lt; height.length; i++) {
    while (stack.length &amp;&amp; height[i] &gt; height[stack.at(-1)]) {
      const top = stack.pop();
      if (stack.length === 0) break;
      const distance = i - stack.at(-1) - 1;
      const bounded = Math.min(height[i], height[stack.at(-1)]) - height[top];
      water += distance * bounded;
    }
    stack.push(i);
  }
  return water;
}</code></pre>

<h3>Example 6 — Largest rectangle</h3>
<pre><code class="language-js">function largestRectangleArea(heights) {
  const stack = [];
  let max = 0;
  for (let i = 0; i &lt;= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];
    while (stack.length &amp;&amp; heights[stack.at(-1)] &gt; h) {
      const idx = stack.pop();
      const w = stack.length ? i - stack.at(-1) - 1 : i;
      max = Math.max(max, heights[idx] * w);
    }
    stack.push(i);
  }
  return max;
}</code></pre>

<h3>Example 7 — RPN evaluation</h3>
<pre><code class="language-js">function evalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if (['+', '-', '*', '/'].includes(t)) {
      const b = stack.pop(), a = stack.pop();
      const r = t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : Math.trunc(a / b);
      stack.push(r);
    } else stack.push(Number(t));
  }
  return stack[0];
}</code></pre>

<h3>Example 8 — Decode string</h3>
<pre><code class="language-js">function decodeString(s) {
  const stack = [];   // pairs of [count, accumulated string]
  let curr = '', count = 0;
  for (const c of s) {
    if (/\\d/.test(c)) count = count * 10 + +c;
    else if (c === '[') { stack.push([count, curr]); count = 0; curr = ''; }
    else if (c === ']') {
      const [k, prev] = stack.pop();
      curr = prev + curr.repeat(k);
    } else {
      curr += c;
    }
  }
  return curr;
}
// "3[a2[c]]" → "accaccacc"</code></pre>

<h3>Example 9 — Asteroid collision</h3>
<pre><code class="language-js">function asteroidCollision(asteroids) {
  const stack = [];
  for (const a of asteroids) {
    let alive = true;
    while (alive &amp;&amp; a &lt; 0 &amp;&amp; stack.length &amp;&amp; stack.at(-1) &gt; 0) {
      if (stack.at(-1) &lt; -a) stack.pop();
      else if (stack.at(-1) === -a) { stack.pop(); alive = false; }
      else alive = false;
    }
    if (alive) stack.push(a);
  }
  return stack;
}</code></pre>

<h3>Example 10 — BFS shortest path (unweighted)</h3>
<pre><code class="language-js">function shortestPath(graph, start, end) {
  const queue = [[start, 0]];
  const visited = new Set([start]);
  while (queue.length) {
    const [node, dist] = queue.shift();
    if (node === end) return dist;
    for (const next of graph[node]) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([next, dist + 1]);
      }
    }
  }
  return -1;
}</code></pre>

<h3>Example 11 — Number of islands (BFS)</h3>
<pre><code class="language-js">function numIslands(grid) {
  const m = grid.length, n = grid[0].length;
  let count = 0;
  for (let i = 0; i &lt; m; i++) {
    for (let j = 0; j &lt; n; j++) {
      if (grid[i][j] === '1') {
        count++;
        const queue = [[i, j]];
        grid[i][j] = '0';
        while (queue.length) {
          const [r, c] = queue.shift();
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr &gt;= 0 &amp;&amp; nr &lt; m &amp;&amp; nc &gt;= 0 &amp;&amp; nc &lt; n &amp;&amp; grid[nr][nc] === '1') {
              grid[nr][nc] = '0';
              queue.push([nr, nc]);
            }
          }
        }
      }
    }
  }
  return count;
}</code></pre>

<h3>Example 12 — Implement queue using stacks</h3>
<pre><code class="language-js">class MyQueue {
  constructor() { this.in = []; this.out = []; }
  push(x) { this.in.push(x); }
  pop() { this.peek(); return this.out.pop(); }
  peek() {
    if (this.out.length === 0) {
      while (this.in.length) this.out.push(this.in.pop());
    }
    return this.out.at(-1);
  }
  empty() { return this.in.length === 0 &amp;&amp; this.out.length === 0; }
}</code></pre>

<h3>Example 13 — Stack with two queues</h3>
<pre><code class="language-js">class MyStack {
  constructor() { this.q = []; }
  push(x) {
    this.q.push(x);
    for (let i = 0; i &lt; this.q.length - 1; i++) this.q.push(this.q.shift());
  }
  pop() { return this.q.shift(); }
  top() { return this.q[0]; }
  empty() { return this.q.length === 0; }
}</code></pre>

<h3>Example 14 — Sliding window max (deque)</h3>
<pre><code class="language-js">function maxSlidingWindow(nums, k) {
  const result = [], dq = [];
  for (let i = 0; i &lt; nums.length; i++) {
    while (dq.length &amp;&amp; dq[0] &lt;= i - k) dq.shift();
    while (dq.length &amp;&amp; nums[dq.at(-1)] &lt; nums[i]) dq.pop();
    dq.push(i);
    if (i &gt;= k - 1) result.push(nums[dq[0]]);
  }
  return result;
}</code></pre>

<h3>Example 15 — Iterative DFS</h3>
<pre><code class="language-js">function dfs(root) {
  if (!root) return;
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    visit(node);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);   // left popped first
  }
}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. JS array.shift() is O(n)</h3>
<p>Common bug for queue: <code>queue.shift()</code> takes O(n) per call. For BFS on large graphs, use index head pointer or linked list.</p>

<h3>2. Empty stack pop</h3>
<p><code>[].pop()</code> returns undefined. Don't strict-equality compare without checking length first.</p>

<h3>3. Monotonic direction</h3>
<p>Increasing or decreasing? Depends on problem. "Next greater" → decreasing (pop smaller as we go). "Next smaller" → increasing.</p>

<h3>4. Storing indices vs values</h3>
<p>Most monotonic stack problems store indices, not values. Lets you compute width / distance.</p>

<h3>5. BFS visited check on enqueue vs dequeue</h3>
<p>Mark visited when you ENQUEUE, not when you DEQUEUE. Otherwise you can enqueue the same node multiple times.</p>

<h3>6. Deque implementation in JS</h3>
<p>No native deque. Use doubly linked list (custom class), or two arrays with head/tail indices, or accept arr.shift's O(n) cost on small queues.</p>

<h3>7. Stack-based recursion conversion</h3>
<p>Push state on the stack, including "return value" placeholders if needed. Easy to forget intermediate state when manually managing.</p>

<h3>8. Reverse Polish vs infix</h3>
<p>RPN: easy stack-based eval. Infix needs Shunting-yard or two-stack algorithm. Don't conflate.</p>

<h3>9. Min stack with duplicates</h3>
<p>If using "push to min stack only if smaller," you'll fail with duplicates. Use ≤ to allow tracked duplicates, OR push (value, count) pairs.</p>

<h3>10. Trapping water — stack vs two-pointer</h3>
<p>Both O(n) time. Two pointers is O(1) extra; stack is O(n) extra. Two pointers usually preferred.</p>

<h3>11. Histograms with zero / negative heights</h3>
<p>Algorithm assumes non-negative heights. Negatives need different handling.</p>

<h3>12. Decode string nesting depth</h3>
<p>Stack handles arbitrary nesting. Don't use recursion for very deep nests (stack overflow).</p>

<h3>13. Asteroid collision — equal sizes</h3>
<p>Both destroyed: pop and don't push. Be careful with the order of conditions.</p>

<h3>14. BFS for shortest path with weighted edges</h3>
<p>Standard BFS doesn't work. Use Dijkstra (heap) for non-negative weights, Bellman-Ford for negative.</p>

<h3>15. Stack of mixed types</h3>
<p>JS allows mixed types in arrays. Be careful: type confusion bugs.</p>

<h3>16. Empty string in valid parens</h3>
<p>Empty string is "valid" (vacuously balanced). Don't return false on empty.</p>

<h3>17. Single open paren</h3>
<p>"(" → at end stack has [. Return false because not empty.</p>

<h3>18. Two-stack queue's amortized O(1)</h3>
<p>Worst case for one operation: O(n) when transferring from in to out. But across n operations, total work is O(n) → amortized O(1).</p>

<h3>19. Iterative inorder vs preorder vs postorder</h3>
<p>Inorder: classic loop with current pointer. Preorder: simpler; push right then left. Postorder: trickier; reverse preorder with right-first, or use visited flag.</p>

<h3>20. Sliding window max — push value not index</h3>
<p>Common bug. Push the index; access value via nums[index]. Otherwise you can't tell when an element is out of window.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — using arr.shift for queue</h3>
<p>O(n) per dequeue. For BFS on large input, kills perf. Use linked list / two-stack / index head.</p>

<h3>Anti-pattern 2 — not marking visited on enqueue</h3>
<p>If you mark on dequeue, multiple paths can enqueue the same node. Memory + duplicate processing.</p>

<h3>Anti-pattern 3 — recursing for deep trees</h3>
<p>JS doesn't TCO. Deep recursion → stack overflow. Convert to iterative with explicit stack.</p>

<h3>Anti-pattern 4 — storing values in monotonic stack</h3>
<p>Many problems need indices for distance/width calculations. Use indices.</p>

<h3>Anti-pattern 5 — confusing peek with pop</h3>
<p>Peek (read top): <code>arr.at(-1)</code>. Pop (read + remove): <code>arr.pop()</code>. Confusing them changes algorithm semantics.</p>

<h3>Anti-pattern 6 — using array as deque without measuring</h3>
<p><code>arr.unshift</code> + <code>arr.shift</code> = O(n) each. Custom deque is O(1).</p>

<h3>Anti-pattern 7 — string concat in expression eval</h3>
<p>Building output strings in loops with += is O(n²). Push to array, then join.</p>

<h3>Anti-pattern 8 — using Set as stack</h3>
<p>Set isn't ordered for stack-style access. Use array.</p>

<h3>Anti-pattern 9 — forgetting empty check before pop</h3>
<pre><code class="language-js">// BAD if stack might be empty
const top = stack.pop();
if (top !== expected) ...

// GOOD
if (stack.length === 0 || stack.pop() !== expected) return false;</code></pre>

<h3>Anti-pattern 10 — not using BFS for shortest path</h3>
<p>For unweighted shortest path, BFS is O(V+E). DFS isn't guaranteed shortest.</p>

<h3>Anti-pattern 11 — flooding queue with duplicates</h3>
<p>If you don't dedupe (visited check), queue can blow up exponentially in graphs with cycles.</p>

<h3>Anti-pattern 12 — wrong order pushing left/right in iterative DFS</h3>
<p>Stack is LIFO. Push right first, then left, so left is processed first (preorder).</p>

<h3>Anti-pattern 13 — stack overflow on iterative DFS via array</h3>
<p>Array push is fast; the stack here is a regular JS array, so it doesn't overflow like the call stack would. This is iterative DFS's main advantage.</p>

<h3>Anti-pattern 14 — missing index slide-out in monotonic deque</h3>
<p>For sliding window max, must pop indices that have slid out of window from the front of the deque.</p>

<h3>Anti-pattern 15 — over-engineering simple stack/queue</h3>
<p>For small data, JS array works fine. Custom deque is overkill unless you measure a perf problem.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. When to use a stack?</div>
  <div class="qa-answer">
    <ul>
      <li>Match latest opening with closing (parens, tags).</li>
      <li>Convert recursion to iterative.</li>
      <li>Monotonic stack for "next greater / smaller."</li>
      <li>Expression eval (RPN).</li>
      <li>Undo / redo history.</li>
      <li>DFS without recursion.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. When to use a queue?</div>
  <div class="qa-answer">
    <ul>
      <li>BFS — level-order traversal.</li>
      <li>Shortest path in unweighted graph.</li>
      <li>Producer-consumer patterns.</li>
      <li>Task scheduling / message passing.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why is array.shift() bad for queue?</div>
  <div class="qa-answer">
    <p>O(n) — every other element shifts down by 1. For large queues (BFS on graphs with millions of nodes), this dominates. Alternatives: index head pointer, two-stack queue, doubly linked list.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Implement Min Stack.</div>
  <div class="qa-answer">
<pre><code class="language-js">class MinStack {
  constructor() { this.stack = []; this.min = []; }
  push(x) {
    this.stack.push(x);
    this.min.push(this.min.length ? Math.min(x, this.min.at(-1)) : x);
  }
  pop() { this.min.pop(); return this.stack.pop(); }
  top() { return this.stack.at(-1); }
  getMin() { return this.min.at(-1); }
}</code></pre>
    <p>All ops O(1).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Daily temperatures (monotonic stack).</div>
  <div class="qa-answer">
<pre><code class="language-js">function dailyTemperatures(temps) {
  const result = new Array(temps.length).fill(0);
  const stack = [];
  for (let i = 0; i &lt; temps.length; i++) {
    while (stack.length &amp;&amp; temps[stack.at(-1)] &lt; temps[i]) {
      const j = stack.pop();
      result[j] = i - j;
    }
    stack.push(i);
  }
  return result;
}</code></pre>
    <p>O(n) time. Each index pushed and popped once.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Implement Queue using two Stacks.</div>
  <div class="qa-answer">
<pre><code class="language-js">class MyQueue {
  constructor() { this.in = []; this.out = []; }
  push(x) { this.in.push(x); }
  pop() {
    if (this.out.length === 0)
      while (this.in.length) this.out.push(this.in.pop());
    return this.out.pop();
  }
  peek() {
    if (this.out.length === 0)
      while (this.in.length) this.out.push(this.in.pop());
    return this.out.at(-1);
  }
  empty() { return this.in.length === 0 &amp;&amp; this.out.length === 0; }
}</code></pre>
    <p>O(1) amortized for all ops.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Valid parentheses.</div>
  <div class="qa-answer">
<pre><code class="language-js">function isValid(s) {
  const stack = [];
  const pair = { ')': '(', ']': '[', '}': '{' };
  for (const c of s) {
    if (c in pair) {
      if (stack.pop() !== pair[c]) return false;
    } else {
      stack.push(c);
    }
  }
  return stack.length === 0;
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. BFS template.</div>
  <div class="qa-answer">
<pre><code class="language-js">function bfs(start) {
  const queue = [start];
  const visited = new Set([start]);
  while (queue.length) {
    const node = queue.shift();
    for (const next of neighbors(node)) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
}</code></pre>
    <p>Mark visited at enqueue time. For shortest path, track distance per node.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Largest rectangle in histogram.</div>
  <div class="qa-answer">
    <p>Monotonic increasing stack. For each bar, find left and right boundary where it's the smallest:</p>
<pre><code class="language-js">function largestRectangleArea(heights) {
  const stack = [];
  let max = 0;
  for (let i = 0; i &lt;= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];
    while (stack.length &amp;&amp; heights[stack.at(-1)] &gt; h) {
      const idx = stack.pop();
      const w = stack.length ? i - stack.at(-1) - 1 : i;
      max = Math.max(max, heights[idx] * w);
    }
    stack.push(i);
  }
  return max;
}</code></pre>
    <p>O(n) time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Decode string with k[encoded].</div>
  <div class="qa-answer">
<pre><code class="language-js">function decodeString(s) {
  const stack = [];
  let curr = '', count = 0;
  for (const c of s) {
    if (/\\d/.test(c)) count = count * 10 + +c;
    else if (c === '[') { stack.push([count, curr]); count = 0; curr = ''; }
    else if (c === ']') { const [k, prev] = stack.pop(); curr = prev + curr.repeat(k); }
    else curr += c;
  }
  return curr;
}
// "3[a2[c]]" → "accaccacc"</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Iterative DFS.</div>
  <div class="qa-answer">
<pre><code class="language-js">function dfs(root) {
  if (!root) return;
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    visit(node);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);   // left popped first → preorder
  }
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Sliding window maximum (deque).</div>
  <div class="qa-answer">
<pre><code class="language-js">function maxSlidingWindow(nums, k) {
  const result = [], dq = [];
  for (let i = 0; i &lt; nums.length; i++) {
    while (dq.length &amp;&amp; dq[0] &lt;= i - k) dq.shift();
    while (dq.length &amp;&amp; nums[dq.at(-1)] &lt; nums[i]) dq.pop();
    dq.push(i);
    if (i &gt;= k - 1) result.push(nums[dq[0]]);
  }
  return result;
}</code></pre>
    <p>Monotonic decreasing deque. Front is window max.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Number of islands (BFS).</div>
  <div class="qa-answer">
    <p>For each unvisited '1', BFS marks all connected land. Count BFS calls = islands. O(m × n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Recursion vs iterative — when prefer iterative?</div>
  <div class="qa-answer">
    <ul>
      <li>Very deep recursion → stack overflow risk in JS (no TCO).</li>
      <li>Need to pause / resume traversal (iterators).</li>
      <li>Performance — function call overhead.</li>
      <li>Want to step through state explicitly for debugging.</li>
    </ul>
    <p>Iterative tree traversals use explicit stack. BFS is naturally iterative.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What's a monotonic stack good for?</div>
  <div class="qa-answer">
    <p>Problems where you need to find, for each element, the next (or previous) element that's greater (or smaller). Examples: daily temperatures, next greater element, largest rectangle in histogram, trapping rain water, stock span. The stack maintains a monotonic order; popping smaller (or larger) elements gives O(n) total work.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You note JS array.shift is O(n) and use alternatives for big queues.</li>
    <li>You use indices in monotonic stacks when you need width / distance.</li>
    <li>You mark BFS visited on enqueue.</li>
    <li>You convert recursion to iterative for deep trees.</li>
    <li>You pair monotonic stack with the right direction (increasing for "next smaller", decreasing for "next greater").</li>
    <li>You use deque for sliding window max in O(n).</li>
    <li>You handle empty stack pops gracefully.</li>
  </ul>
</div>
`}

]
});
