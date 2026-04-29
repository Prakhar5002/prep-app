window.PREP_SITE.registerTopic({
  id: 'dsa-linked-list',
  module: 'dsa',
  title: 'Linked Lists',
  estimatedReadTime: '40 min',
  tags: ['linked-list', 'singly', 'doubly', 'cycle-detection', 'pointers', 'lru', 'merge', 'reverse'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>linked list</strong> is a chain of nodes where each node holds a value and a pointer to the next (and sometimes previous) node. Unlike arrays, memory is non-contiguous, which trades random access (O(n) vs O(1)) for cheap insertion/deletion at known nodes (O(1) vs O(n)).</p>
<ul>
  <li><strong>Singly:</strong> <code>node.next</code>. Doubly: also <code>node.prev</code>. Circular: tail loops back to head.</li>
  <li><strong>Core moves:</strong> traverse, insert/delete at head/tail/middle, reverse (iterative + recursive), find middle (slow/fast).</li>
  <li><strong>Cycle detection:</strong> <strong>Floyd's tortoise & hare</strong> — O(n) time, O(1) space, finds cycle entry too.</li>
  <li><strong>Two-pointer tricks:</strong> nth-from-end (gap pointer), palindrome (reverse half), intersection (length diff or two-pass swap).</li>
  <li><strong>Dummy head sentinel:</strong> simplifies edge cases when head can change (delete head, insert before head, merge two lists).</li>
  <li><strong>LRU cache</strong> = doubly linked list + hash map → O(1) get/put. Classic FAANG combo.</li>
</ul>
<p><strong>Mantra:</strong> "Draw the pointers. Save next before you mutate. Use a dummy when head moves."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a linked list?</h3>
<p>A sequence of nodes linked by pointers. The list owns a reference to <code>head</code> (and sometimes <code>tail</code>). To reach the kth element, you must walk k pointers — there is no array-style index math.</p>
<pre><code class="language-js">// Singly linked node
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// 1 → 2 → 3 → null
const head = new ListNode(1, new ListNode(2, new ListNode(3)));
</code></pre>

<h3>Variants</h3>
<table>
  <thead><tr><th>Variant</th><th>Pointers</th><th>Used for</th></tr></thead>
  <tbody>
    <tr><td>Singly</td><td><code>next</code></td><td>Stacks, simple queues, hash buckets, function call frames</td></tr>
    <tr><td>Doubly</td><td><code>next</code> + <code>prev</code></td><td>LRU cache, browser history, deque, undo/redo</td></tr>
    <tr><td>Circular</td><td>tail.next = head</td><td>Round-robin schedulers, ring buffers, Josephus problem</td></tr>
    <tr><td>Skip list</td><td>multi-level next</td><td>Concurrent ordered maps (Redis sorted sets, LevelDB)</td></tr>
  </tbody>
</table>

<h3>Why use a linked list (and why not)?</h3>
<p><strong>Use it when:</strong></p>
<ul>
  <li>You frequently insert/delete at unknown positions and already hold the node reference (LRU cache, free lists, scheduler queues).</li>
  <li>You can't predict size and reallocation is expensive (kernel-level structures, embedded systems).</li>
  <li>You need a stable address for nodes — array <code>push/splice</code> can move references.</li>
</ul>
<p><strong>Avoid when:</strong></p>
<ul>
  <li>You need random access by index → use array.</li>
  <li>Tight loops over data → arrays win on <strong>cache locality</strong> by 5–50× even if Big O is identical.</li>
  <li>You don't know <em>why</em> you need a linked list. In real product code, an array is almost always the answer.</li>
</ul>

<h3>Why interviewers love linked lists</h3>
<ul>
  <li><strong>Pointer fluency.</strong> Reveals whether the candidate can mentally model references, mutation, and aliasing.</li>
  <li><strong>Edge-case discipline.</strong> Empty list, single node, head changes, tail changes, cycle, two-list merge.</li>
  <li><strong>Two-pointer & cycle patterns.</strong> Floyd's, gap pointer, reverse-and-compare — all classic.</li>
  <li><strong>Composable.</strong> LRU = list + hash. Sort linked list = merge sort recursion. Reverse k-group = sub-list reversal.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "draw the pointers" model</h3>
<p>The single biggest mistake on linked-list problems is mutating <code>node.next</code> before saving where you needed to go. <strong>Always</strong> draw the before/after state. The pseudo-physics:</p>
<ul>
  <li>A <em>node</em> is a box with two slots: <code>val</code> and <code>next</code>.</li>
  <li>An <em>arrow</em> is a pointer. Pointers can be reseated, but the box stays put.</li>
  <li>Reseating <code>a.next = c</code> doesn't move b or c — it only changes which arrow leaves a.</li>
</ul>
<pre><code class="language-text">Before reverse step:  prev → null     curr → 1 → 2 → 3 → null
After one step:                       prev → 1 → null,  curr → 2 → 3 → null

Order:
  1. save  next = curr.next        // hold onto 2
  2. flip  curr.next = prev        // 1 → null
  3. step  prev = curr; curr = next
</code></pre>

<h3>Dummy head sentinel</h3>
<p>If the head of your result might change (insertion before head, deletion of head, merging two lists), allocate a fake node and build off of it. At the end, return <code>dummy.next</code>. This eliminates the "is this the first node?" branch.</p>
<pre><code class="language-js">function buildList() {
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const v of [1, 2, 3]) {
    tail.next = new ListNode(v);
    tail = tail.next;
  }
  return dummy.next; // 1 → 2 → 3
}
</code></pre>

<h3>Two-pointer mental model</h3>
<table>
  <thead><tr><th>Pattern</th><th>Pointer setup</th><th>Solves</th></tr></thead>
  <tbody>
    <tr><td>Slow / fast (Floyd)</td><td>slow steps 1, fast steps 2</td><td>Cycle detection, find middle</td></tr>
    <tr><td>Gap pointer</td><td>fast advances n, then both move</td><td>nth from end, remove nth</td></tr>
    <tr><td>Pair walk</td><td>two heads, swap on null</td><td>Intersection of two lists</td></tr>
    <tr><td>Reverse-half</td><td>reverse slow.next, compare</td><td>Palindrome check</td></tr>
  </tbody>
</table>

<h3>Doubly linked list as a deque</h3>
<p>A doubly linked list with head and tail pointers gives you O(1) push/pop on both ends — the building block for LRU, browser history, and any "most recently used" structure. The cost: 2× pointer overhead per node.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Singly linked list: full implementation</h3>
<pre><code class="language-js">class SinglyLinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }

  // O(1)
  prepend(val) {
    this.head = new ListNode(val, this.head);
    this.size++;
  }

  // O(n) — must walk to tail. Use a tail pointer if you push often.
  append(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
    } else {
      let cur = this.head;
      while (cur.next) cur = cur.next;
      cur.next = node;
    }
    this.size++;
  }

  // O(n) — index-based access
  get(index) {
    if (index < 0 || index >= this.size) return null;
    let cur = this.head;
    for (let i = 0; i < index; i++) cur = cur.next;
    return cur;
  }

  // O(n) — delete first node with value
  remove(val) {
    const dummy = new ListNode(0, this.head);
    let prev = dummy;
    while (prev.next) {
      if (prev.next.val === val) {
        prev.next = prev.next.next;
        this.size--;
        this.head = dummy.next;
        return true;
      }
      prev = prev.next;
    }
    return false;
  }
}
</code></pre>

<h3>Reverse a linked list (iterative)</h3>
<pre><code class="language-js">// Time O(n), Space O(1). Memorize this.
function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    const next = curr.next;  // 1. save
    curr.next = prev;        // 2. flip
    prev = curr;             // 3. step
    curr = next;
  }
  return prev;
}
</code></pre>

<h3>Reverse a linked list (recursive)</h3>
<pre><code class="language-js">// Time O(n), Space O(n) due to call stack
function reverseRecursive(head) {
  if (!head || !head.next) return head;
  const newHead = reverseRecursive(head.next);
  head.next.next = head;  // the node after head now points back to head
  head.next = null;       // and head becomes the new tail
  return newHead;
}
</code></pre>

<h3>Find the middle node</h3>
<pre><code class="language-js">// For even length, returns the second middle (1→2→3→4 returns 3).
// For "first middle" change condition to fast.next && fast.next.next
function middleNode(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
</code></pre>

<h3>Detect a cycle (Floyd's tortoise & hare)</h3>
<pre><code class="language-js">function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

// Find cycle entry. Math: distance from head to cycle entry === distance from
// meeting point to cycle entry (mod cycle length). So reset one pointer to head
// and step both by 1 until they meet.
function detectCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let p = head;
      while (p !== slow) {
        p = p.next;
        slow = slow.next;
      }
      return p; // cycle entry node
    }
  }
  return null;
}
</code></pre>

<h3>Remove nth node from end (gap pointer)</h3>
<pre><code class="language-js">function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy, slow = dummy;
  for (let i = 0; i < n; i++) fast = fast.next;
  while (fast.next) {
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}
</code></pre>

<h3>Merge two sorted lists</h3>
<pre><code class="language-js">function mergeTwoLists(a, b) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) {
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  tail.next = a || b; // attach remainder
  return dummy.next;
}
</code></pre>

<h3>Palindrome check (reverse half)</h3>
<pre><code class="language-js">function isPalindrome(head) {
  if (!head || !head.next) return true;
  // 1. find middle
  let slow = head, fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  // 2. reverse second half
  let prev = null, curr = slow.next;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  // 3. compare
  let p1 = head, p2 = prev;
  while (p2) {
    if (p1.val !== p2.val) return false;
    p1 = p1.next;
    p2 = p2.next;
  }
  return true;
}
</code></pre>

<h3>Intersection of two linked lists</h3>
<pre><code class="language-js">// O(m + n) time, O(1) space. The two pointers each walk both lists; when one
// hits null, it jumps to the other head. They sync up after at most m + n steps,
// meeting at the intersection (or both at null if disjoint).
function getIntersectionNode(headA, headB) {
  if (!headA || !headB) return null;
  let a = headA, b = headB;
  while (a !== b) {
    a = a ? a.next : headB;
    b = b ? b.next : headA;
  }
  return a;
}
</code></pre>

<h3>Doubly linked list (LRU building block)</h3>
<pre><code class="language-js">class DLLNode {
  constructor(key, val) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  constructor() {
    this.head = new DLLNode(null, null); // sentinels both ends
    this.tail = new DLLNode(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  addFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }
  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
  popBack() {
    if (this.tail.prev === this.head) return null;
    const node = this.tail.prev;
    this.remove(node);
    return node;
  }
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>1. LRU Cache (LeetCode 146)</h3>
<p>Classic FAANG problem. O(1) get and put using doubly linked list + hash map.</p>
<pre><code class="language-js">class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();          // key → node
    this.list = new DoublyLinkedList();
  }
  get(key) {
    const node = this.map.get(key);
    if (!node) return -1;
    this.list.remove(node);
    this.list.addFront(node);      // promote to most-recently-used
    return node.val;
  }
  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.val = value;
      this.list.remove(node);
      this.list.addFront(node);
      return;
    }
    if (this.map.size === this.cap) {
      const evicted = this.list.popBack();
      this.map.delete(evicted.key);
    }
    const node = new DLLNode(key, value);
    this.list.addFront(node);
    this.map.set(key, node);
  }
}
</code></pre>
<p><strong>Why doubly linked list?</strong> We need O(1) deletion of an arbitrary node when promoting on access. With a singly linked list, you'd need O(n) to find the previous pointer. The hash map gives O(1) lookup of the node we want to delete.</p>

<h3>2. Reverse nodes in k-group (LeetCode 25, hard)</h3>
<pre><code class="language-js">function reverseKGroup(head, k) {
  // count if at least k nodes remain
  let count = 0, node = head;
  while (count < k && node) {
    node = node.next;
    count++;
  }
  if (count < k) return head; // tail group stays as-is

  // reverse k nodes: prev becomes the new head of this group
  let prev = reverseKGroup(node, k); // recurse first
  let curr = head;
  for (let i = 0; i < k; i++) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}
</code></pre>

<h3>3. Copy list with random pointer</h3>
<p>Each node has <code>next</code> and <code>random</code> (which can point anywhere or null). Make a deep copy.</p>
<pre><code class="language-js">// O(n) time, O(1) extra space (no map): interleave clones into the original list.
function copyRandomList(head) {
  if (!head) return null;
  // 1. interleave: A → A' → B → B' → C → C'
  let cur = head;
  while (cur) {
    const clone = { val: cur.val, next: cur.next, random: null };
    cur.next = clone;
    cur = clone.next;
  }
  // 2. wire up randoms on clones
  cur = head;
  while (cur) {
    if (cur.random) cur.next.random = cur.random.next;
    cur = cur.next.next;
  }
  // 3. unweave
  const dummy = { next: null };
  let tail = dummy;
  cur = head;
  while (cur) {
    tail.next = cur.next;
    tail = tail.next;
    cur.next = cur.next.next;
    cur = cur.next;
  }
  return dummy.next;
}
</code></pre>

<h3>4. Add two numbers (LeetCode 2)</h3>
<p>Numbers stored in reverse order in linked lists. Add them and return the sum as a list.</p>
<pre><code class="language-js">function addTwoNumbers(l1, l2) {
  const dummy = new ListNode(0);
  let tail = dummy, carry = 0;
  while (l1 || l2 || carry) {
    const sum = (l1?.val || 0) + (l2?.val || 0) + carry;
    carry = Math.floor(sum / 10);
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    l1 = l1?.next;
    l2 = l2?.next;
  }
  return dummy.next;
}
</code></pre>

<h3>5. Sort linked list — merge sort, O(n log n) time, O(log n) space</h3>
<pre><code class="language-js">function sortList(head) {
  if (!head || !head.next) return head;

  // 1. split with slow/fast (use the "first middle" variant)
  let slow = head, fast = head.next;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  const mid = slow.next;
  slow.next = null;

  // 2. recurse + merge
  const left = sortList(head);
  const right = sortList(mid);
  return mergeTwoLists(left, right);
}
</code></pre>
<p><strong>Why merge sort?</strong> Quicksort needs random access for partition; merge sort works beautifully on sequential structures. Bottom-up merge sort gets you to O(1) extra space.</p>

<h3>6. Flatten a multilevel doubly linked list (LeetCode 430)</h3>
<pre><code class="language-js">function flatten(head) {
  if (!head) return null;
  const stack = [];
  let cur = head;
  while (cur) {
    if (cur.child) {
      if (cur.next) stack.push(cur.next);
      cur.next = cur.child;
      cur.child.prev = cur;
      cur.child = null;
    }
    if (!cur.next && stack.length) {
      const next = stack.pop();
      cur.next = next;
      next.prev = cur;
    }
    cur = cur.next;
  }
  return head;
}
</code></pre>

<h3>7. Rotate list right by k</h3>
<pre><code class="language-js">function rotateRight(head, k) {
  if (!head || !head.next || k === 0) return head;
  // find length and tail
  let len = 1, tail = head;
  while (tail.next) {
    tail = tail.next;
    len++;
  }
  k %= len;
  if (k === 0) return head;
  // tail closes loop, walk to new tail
  tail.next = head;
  let newTail = head;
  for (let i = 1; i < len - k; i++) newTail = newTail.next;
  const newHead = newTail.next;
  newTail.next = null;
  return newHead;
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>The empty list</h3>
<p>Every linked-list function must handle <code>head === null</code>. Most often the answer is "return early." Failing to check is the most common bug.</p>
<pre><code class="language-js">function reverseList(head) {
  if (!head) return null;   // explicit
  // ... rest
}
</code></pre>

<h3>Single node</h3>
<p>If the list has one node, <code>head.next === null</code>. Many "two-pointer" routines must terminate immediately. Test every solution against <code>[1]</code>.</p>

<h3>Head changes</h3>
<p>Operations that may change head: insert before head, remove head, merge two lists, reverse, rotate. <strong>Use a dummy node</strong> in any of these to avoid special-casing head.</p>

<h3>Tail handling</h3>
<p>If you maintain a <code>tail</code> pointer, every mutation that touches the tail must update it. Forgetting this turns O(1) append into O(n) bugs (e.g., the new node never being reachable).</p>

<h3>Cycle traps</h3>
<ul>
  <li>Naïve length traversal on a cyclic list never terminates → infinite loop.</li>
  <li>Always check <code>fast && fast.next</code> in slow/fast loops; missing one nullable triggers TypeError on cycles of even length.</li>
  <li>If you accidentally create a cycle (<code>node.next = node</code>) during a mutation, downstream traversals hang.</li>
</ul>

<h3>Aliasing & accidental sharing</h3>
<p>Two list pointers can reference the same nodes. Mutating <code>a.next = b</code> when <code>b</code> is already part of another list creates a Y-shape or a cycle. <strong>Detach before re-attaching:</strong></p>
<pre><code class="language-js">// BAD — creates a cycle if mid is also a's tail
prev.next = mid;
// GOOD — terminate first
const newTail = mid;
while (newTail.next) newTail = newTail.next;
newTail.next = null;
</code></pre>

<h3>Off-by-one in nth-from-end</h3>
<p><strong>Use a dummy.</strong> Without one, removing the head with n === length crashes. With a dummy, the gap-pointer logic is uniform.</p>

<h3>Mutation vs. immutability</h3>
<p>Most interview solutions <em>mutate</em> input. If the problem says "do not modify input" (rare), you must clone first. Always clarify in the interview before you start mutating.</p>

<h3>Doubly linked list pointer bookkeeping</h3>
<p>Every removal must update <strong>both</strong> <code>prev.next</code> and <code>next.prev</code>. A "dangling prev" from forgetting this surfaces as a phantom node still reachable from the tail side.</p>

<h3>Even vs. odd length in middle/palindrome</h3>
<p>For middle-finding:</p>
<ul>
  <li><code>fast && fast.next</code> → returns <strong>second</strong> middle for even length (1→2→3→4 returns 3).</li>
  <li><code>fast.next && fast.next.next</code> → returns <strong>first</strong> middle (returns 2).</li>
</ul>
<p>Palindrome check uses the first-middle variant so the reversed second half is shorter or equal.</p>

<h3>Memory in long-running services</h3>
<p>In JS/TS, dropping the head reference is enough — GC reclaims the chain. <strong>Unless</strong> a node is referenced from elsewhere (closure, event listener, observer), in which case the whole list is retained. Common LRU bug: forgetting to <code>map.delete(key)</code> when evicting from list, leaking nodes.</p>

<h3>Stack overflow on recursion</h3>
<p>Recursive linked-list algorithms (recursive reverse, sort, etc.) blow the stack on lists of length &gt; ~10⁴ in V8. <strong>Convert to iterative</strong> for production code or anything that might see long inputs.</p>

<h3>Random pointer copy edge cases</h3>
<ul>
  <li><code>random</code> can point to the node itself.</li>
  <li><code>random</code> can be null while <code>next</code> isn't.</li>
  <li>Two nodes can share a random target — make sure the clone preserves the same sharing.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: forgetting to save next before mutating</h3>
<pre><code class="language-js">// BAD — loses the rest of the list after the first iteration
function reverseList(head) {
  let prev = null;
  while (head) {
    head.next = prev;     // OOPS — head.next is gone, can't advance
    prev = head;
    head = head.next;     // now null — loop exits early
  }
  return prev;
}

// FIX — save first
while (head) {
  const next = head.next;
  head.next = prev;
  prev = head;
  head = next;
}
</code></pre>

<h3>Bug 2: the missed dummy node</h3>
<pre><code class="language-js">// BAD — special-cases head removal
function removeVal(head, val) {
  while (head && head.val === val) head = head.next;  // separate path
  let cur = head;
  while (cur && cur.next) {
    if (cur.next.val === val) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return head;
}

// CLEAN — one path
function removeVal(head, val) {
  const dummy = new ListNode(0, head);
  let cur = dummy;
  while (cur.next) {
    if (cur.next.val === val) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return dummy.next;
}
</code></pre>

<h3>Bug 3: cycle-creating merge</h3>
<pre><code class="language-js">// In merge, if you forget to terminate the result tail, residue from one input
// can leak into the other and may form a cycle.
tail.next = a || b;     // ← required terminator
// And if a or b was previously joined to a third list, you've imported its tail too.
</code></pre>

<h3>Bug 4: slow/fast missing null guard</h3>
<pre><code class="language-js">// BAD — TypeError on even-length lists when fast becomes null
while (fast.next && fast.next.next) { /* ... */ }   // breaks if fast is null

// FIX — guard fast first
while (fast && fast.next) { /* ... */ }
</code></pre>

<h3>Bug 5: reverse-recursive without nulling old next</h3>
<pre><code class="language-js">// BAD — creates a 2-cycle
function reverseRec(head) {
  if (!head || !head.next) return head;
  const newHead = reverseRec(head.next);
  head.next.next = head;
  // forgot: head.next = null;
  return newHead;
}
// Now node 1.next === 2 AND 2.next === 1 → infinite loop next time you traverse.
</code></pre>

<h3>Bug 6: LRU map drift</h3>
<pre><code class="language-js">// BAD — eviction removes from list but leaves stale entry in map
popBack();
// forgot: this.map.delete(evicted.key);
// Symptom: get() returns -1 forever for any key that was evicted, but the
// map size keeps growing → cap silently exceeded.
</code></pre>

<h3>Bug 7: building list backward by accident</h3>
<pre><code class="language-js">// BAD — produces 3 → 2 → 1 instead of 1 → 2 → 3
let head = null;
for (const v of [1, 2, 3]) head = new ListNode(v, head);

// FIX — use dummy + tail
const dummy = new ListNode(0);
let tail = dummy;
for (const v of [1, 2, 3]) {
  tail.next = new ListNode(v);
  tail = tail.next;
}
return dummy.next;
</code></pre>

<h3>Bug 8: doubly linked list — half-removed node</h3>
<pre><code class="language-js">// BAD
node.prev.next = node.next;
// forgot: node.next.prev = node.prev;
// → traversals from tail see the deleted node; from head don't. Heisenbug.
</code></pre>

<h3>Bug 9: O(n²) "linked list = array" reflex</h3>
<pre><code class="language-js">// BAD — O(n²) because get(i) walks the chain each time
for (let i = 0; i < list.size; i++) console.log(list.get(i).val);

// FIX — single traversal
for (let cur = list.head; cur; cur = cur.next) console.log(cur.val);
</code></pre>

<h3>Bug 10: not detaching when moving nodes</h3>
<pre><code class="language-js">// BAD — appending b to a but b is still attached elsewhere
a.tail.next = b.head;
// b might still be referenced as another list's head, now mutated.
// ALWAYS clarify ownership and either clone or detach before splicing.
</code></pre>

<h3>Anti-pattern: arrayifying for "simplicity"</h3>
<pre><code class="language-js">// In an interview, dumping to an array, manipulating, and rebuilding is a yellow flag —
// it shows you didn't think in pointers. It also doubles memory.
const values = [];
for (let cur = head; cur; cur = cur.next) values.push(cur.val);
values.reverse();
// rebuild...
// Acceptable when the problem genuinely requires random access (e.g., k-th from end with k variable),
// but never as a default tactic.
</code></pre>

<h3>Anti-pattern: deep recursion in production</h3>
<p>Recursive merge sort or recursive reverse blow up on long lists. Convert to iterative, or use bottom-up merge sort with explicit step doubling.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>How to approach a linked list problem in an interview</h3>
<ol>
  <li><strong>Clarify mutability.</strong> "Can I mutate the input list?" Almost always yes, but ask.</li>
  <li><strong>Sketch the structure.</strong> Draw 3–4 nodes on the whiteboard / shared doc. Mark head, tail, and any input pointers.</li>
  <li><strong>Identify the right primitive.</strong> Reverse? Slow/fast? Gap pointer? Dummy node? State out loud which pattern you're reaching for and why.</li>
  <li><strong>Walk through the pointer flips.</strong> For mutating algorithms, narrate "save next, flip, advance" before coding. The interviewer wants to see you can trace pointer state under pressure.</li>
  <li><strong>Edge cases first.</strong> Empty list, single node, even/odd length, list with cycle (if applicable). Many candidates code the happy path and forget these.</li>
  <li><strong>Iterate, then optimize.</strong> Get O(n) right, then ask "can I do this in O(1) space?" — often yes for linked-list problems.</li>
</ol>

<h3>Top 15 classic problems and which pattern they use</h3>
<table>
  <thead><tr><th>Problem</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>Reverse linked list</td><td>Pointer flip, iterative + recursive both expected</td></tr>
    <tr><td>Reverse linked list II (range)</td><td>Dummy + sub-list reverse</td></tr>
    <tr><td>Reverse k-group</td><td>Recursion or stack of k</td></tr>
    <tr><td>Detect cycle / find cycle entry</td><td>Floyd's tortoise & hare</td></tr>
    <tr><td>Find middle node</td><td>Slow / fast</td></tr>
    <tr><td>Remove nth from end</td><td>Gap pointer + dummy</td></tr>
    <tr><td>Merge two sorted lists</td><td>Dummy + tail walk</td></tr>
    <tr><td>Merge k sorted lists</td><td>Min-heap or pairwise merge sort</td></tr>
    <tr><td>Sort linked list</td><td>Merge sort</td></tr>
    <tr><td>Palindrome linked list</td><td>Find middle + reverse half + compare</td></tr>
    <tr><td>Intersection of two lists</td><td>Two-pointer head swap, or length-diff align</td></tr>
    <tr><td>Add two numbers</td><td>Dummy + carry</td></tr>
    <tr><td>Copy list with random pointer</td><td>Interleave clones, or hash map</td></tr>
    <tr><td>LRU cache</td><td>DLL + hash map</td></tr>
    <tr><td>Flatten multilevel DLL</td><td>Stack-based DFS</td></tr>
  </tbody>
</table>

<h3>Patterns to recognize on sight</h3>
<ul>
  <li><strong>"Find the middle / kth from end / does it have a cycle"</strong> → two pointers.</li>
  <li><strong>"Reverse / partition / reorder a list"</strong> → mutation with prev/curr/next, dummy node.</li>
  <li><strong>"Process two lists together"</strong> → dummy + walk-the-shorter.</li>
  <li><strong>"O(1) eviction / promotion / access"</strong> → DLL + hash map (LRU shape).</li>
  <li><strong>"Sort in O(n log n) without extra array"</strong> → merge sort on the list itself.</li>
  <li><strong>"Random access pattern needed"</strong> → re-evaluate; maybe an array is the right structure and the interviewer wants you to recognize that.</li>
</ul>

<h3>What FAANG interviewers grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they're checking</th></tr></thead>
  <tbody>
    <tr><td>Pointer hygiene</td><td>Save next, never deref null, no aliasing surprises</td></tr>
    <tr><td>Use of dummy nodes</td><td>You recognize when head can change and reach for the right tool</td></tr>
    <tr><td>Edge case enumeration</td><td>Empty, single, odd/even, cycle — proactively named</td></tr>
    <tr><td>Recursion vs. iteration choice</td><td>You explain stack risk; you can do both</td></tr>
    <tr><td>Composition</td><td>LRU cleanly composes DLL + hash; reverse-k-group composes reverse + recursion</td></tr>
    <tr><td>Communication</td><td>You narrate pointer state; you draw before coding</td></tr>
  </tbody>
</table>

<h3>"Dry-run trace" — the demo move</h3>
<p>After you finish coding, take 30 seconds to walk through your solution on a 3-node example out loud, naming the value of every pointer at each iteration. Catches off-by-ones, missed null checks, and signals quality.</p>

<h3>Mobile / React Native angle</h3>
<ul>
  <li><strong>Navigation history stack</strong> often modeled as a doubly linked list under the hood (back/forward).</li>
  <li><strong>FlatList / VirtualizedList</strong> internals: render windowing relies on linked-list-like cell tracking — but in JS land, arrays + indices win for cache locality.</li>
  <li><strong>RN bridge message queue</strong> historically a linked list of pending calls; in the new architecture (TurboModules / Fabric), a typed C++ queue.</li>
  <li><strong>Animated value chains</strong>: <code>Animated.add</code>, <code>Animated.multiply</code> form a graph. Not strictly linked lists, but the pointer-following mental model carries over.</li>
</ul>

<h3>One-liner answers to common interviewer follow-ups</h3>
<ul>
  <li><em>"Why a doubly linked list for LRU?"</em> → "We need O(1) deletion of an arbitrary node when promoting, which requires the prev pointer."</li>
  <li><em>"Why merge sort, not quicksort, on a linked list?"</em> → "Quicksort needs random-access partitioning; merge sort is sequential-friendly and stable."</li>
  <li><em>"Why does Floyd's work?"</em> → "If there's a cycle, the fast pointer enters it and laps the slow pointer; their relative speed is 1, so they must meet within cycle length steps."</li>
  <li><em>"When would you pick an array over a linked list?"</em> → "Almost always in real product code — cache locality dominates Big O for typical sizes. Use linked lists when you have stable node references and need O(1) splice."</li>
</ul>
`
    }
  ]
});
