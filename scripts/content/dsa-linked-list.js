// Linked Lists, rewritten in plain English (Nov 2026). Main picture: a treasure hunt, where each
// clue card holds a prize (val) and says where the next card is hidden (next). The first card is
// the head; "The end" is null. DSA words link to the glossary at #/topic/dsa-words#w-<slug>.
window.PREP_SITE.registerTopic({
  id: "dsa-linked-list",
  module: "dsa",
  title: "Linked Lists",
  estimatedReadTime: "45 min",
  tags: ["linked-list","singly","doubly","cycle-detection","pointers","lru","merge","reverse"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">A <a href="#/topic/dsa-words#w-linked-list">linked list</a> is a chain of boxes (<a href="#/topic/dsa-words#w-node">nodes</a>), each holding a value and an arrow, <code>next</code>, to the next box. Three habits prevent almost every bug: <strong>draw the arrows</strong>, <strong>save <code>next</code> before you change it</strong>, and <strong>start from a <a href="#/topic/dsa-words#w-dummy-node">dummy node</a> whenever the first box can change</strong>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>The trade:</strong> reaching the 5th box means walking 5 arrows, so lookup by position is <a href="#/topic/dsa-words#w-o-n">O(n)</a>. But adding or removing a box you are already holding is 1–2 arrow changes, <a href="#/topic/dsa-words#w-o-1">O(1)</a>.</li>
    <li><strong>Kinds:</strong> singly (<code>next</code> only), doubly (also <code>prev</code>), circular (the last box points back to the first). The boxes sit scattered in memory, so looping over an array is usually much faster.</li>
    <li><strong>Reverse in 3 moves per box:</strong> save <code>next = curr.next</code> → flip <code>curr.next = prev</code> → step <code>prev = curr</code>, <code>curr = next</code>. The #1 bug is flipping before saving: the rest of the list is lost.</li>
    <li><strong>Dummy node:</strong> a fake box in front of the real first box. Build after it and return <code>dummy.next</code>. Use it when the head can change: delete the head, insert before it, merge, remove nth from end.</li>
    <li><strong><a href="#/topic/dsa-words#w-fast-slow-pointers">Fast and slow pointers</a></strong> (Floyd's "tortoise and hare"): slow moves 1, fast moves 2. If they meet, the list has a <a href="#/topic/dsa-words#w-cycle">cycle</a> (a loop). O(n) time, O(1) extra memory. Restart one from the head, move both by 1: they meet where the loop starts. The same pair finds the middle.</li>
    <li><strong>Guard every fast/slow loop with <code>fast &amp;&amp; fast.next</code>.</strong> Without it, <code>fast.next.next</code> walks off the end of a list with no loop and throws a TypeError.</li>
    <li><strong>Which middle:</strong> <code>fast &amp;&amp; fast.next</code> stops on the <em>second</em> middle of an even list; <code>fast.next &amp;&amp; fast.next.next</code> stops on the <em>first</em> (the palindrome check uses this one).</li>
    <li><strong>nth from the end:</strong> move <code>fast</code> n boxes ahead, then move both until <code>fast</code> hits the end. Start both at a dummy so removing the head is not a special case.</li>
    <li><strong>Palindrome</strong> = find the middle + reverse the second half + compare. <strong>Intersection</strong> = pointer A walks list A then list B, pointer B walks B then A; they meet at the shared box (or both reach null).</li>
    <li><strong>Doubly linked removal updates both sides:</strong> <code>node.prev.next</code> and <code>node.next.prev</code>. Forget one and the box is still reachable from the other direction.</li>
    <li><strong><a href="#/topic/dsa-words#w-lru-cache">LRU cache</a> = doubly linked list + Map:</strong> O(1) get and put. When you evict a box, also <code>map.delete(key)</code>.</li>
    <li><strong>Detach before re-attaching:</strong> a box still linked into another list drags that list along. End the tail with <code>next = null</code> first, or you get a Y-shape or a loop.</li>
    <li><strong>Always test <code>[]</code> (head is null) and <code>[1]</code> (head.next is null).</strong></li>
    <li><strong>Recursion depth:</strong> recursive reverse (and recursive merge) make one call per box, so a long list (a few thousand to around 10,000 boxes, depending on the function and Node version) overflows the <a href="#/topic/dsa-words#w-call-stack">call stack</a>. Use the loop version.</li>
    <li><strong>Sort a list with merge sort</strong>, not quicksort: it only walks forward, needs no jumping to positions, and is <a href="#/topic/dsa-words#w-stable-sort">stable</a>.</li>
    <li><strong>In real product code, prefer an array.</strong> Use a list only when you hold box references and need O(1) insert/remove in the middle.</li>
  </ul>
  <h4>Complexity &amp; when to reach for it</h4>
  <ul>
    <li><strong>Time:</strong> lookup by position or value O(n); insert/remove at a box you hold O(1); reverse, cycle check, find middle, nth from end: all O(n), one or two walks.</li>
    <li><strong>Space:</strong> O(1) for the loop-based pointer patterns (a few variables); O(n) call stack for recursive versions.</li>
    <li><strong>The signal:</strong> "reverse / reorder in place" → save-next loop · "cycle" or "middle" → fast and slow · "nth from end" → gap of n · "head may change / merge two lists" → dummy node · "O(1) get and put with eviction" → doubly linked list + Map.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Changing <code>curr.next</code> before saving the old <code>next</code></strong> cuts the list, and everything after <code>curr</code> is lost. Always write <code>const next = curr.next</code> first. Close behind: a fast/slow loop without the <code>fast &amp;&amp; fast.next</code> guard (crashes when the list has no loop), and no dummy node when the head itself can be removed or inserted before.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Before I change any pointer I save <code>next</code>, and I put a dummy node in front whenever the head can change. That removes most edge cases."</div>
  <div class="revision-say">"For a cycle I use Floyd's tortoise and hare: O(n) time, O(1) space. Restarting one pointer from the head and moving both one step finds where the cycle begins."</div>
  <div class="revision-say">"An LRU cache is a doubly linked list, so I can move or remove any node in O(1), plus a hash map from key to node, so I can find that node in O(1). The <code>prev</code> pointer is what makes removing a node from the middle O(1)."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The picture: a treasure hunt</h3>
<p>Think of a children's treasure hunt. Each clue card has a small prize on it, and it says where the next card is hidden: "look under the sofa". You are only told where the <em>first</em> card is. The last card says "The end".</p>
<p>To reach card 5, you must find cards 1, 2, 3 and 4 first. There is no way to jump straight to card 5, because nobody wrote down where it is except card 4.</p>
<p>That chain of cards is a <a href="#/topic/dsa-words#w-linked-list">linked list</a>. In code:</p>
<ul>
  <li>Each card is a <a href="#/topic/dsa-words#w-node">node</a>: a small object (think "box").</li>
  <li>The prize is <code>val</code>, the value stored in the box.</li>
  <li>"Where the next card is" is <code>next</code>: the next box itself, or <code>null</code> for "The end".</li>
  <li>The first card is the <a href="#/topic/dsa-words#w-head-tail">head</a>; the last card (whose <code>next</code> is <code>null</code>) is the tail.</li>
</ul>
<p>A variable that remembers which box you are looking at is called a <a href="#/topic/dsa-words#w-pointer">pointer</a>. It is just an ordinary variable such as <code>node</code> or <code>curr</code>. In drawings, a pointer is an arrow.</p>
<p>Two things about the hunt matter for everything below:</p>
<ul>
  <li><strong>Adding a card in the middle is cheap.</strong> Hide the new card, copy "where next" from card 2 onto it, then change card 2 to point at the new card. No other card moves.</li>
  <li><strong>Rewriting a card before reading it loses the rest of the hunt.</strong> If you scribble over card 2's "where next" without first noting where card 3 was, nobody can ever find card 3 again. This is the number one linked-list bug.</li>
</ul>

<h3>What is a linked list?</h3>
<p>Here is the box in JavaScript, and a three-card hunt <code>1 → 2 → 3 → null</code>:</p>
<pre><code class="language-js">class ListNode {
  constructor(val, next = null) {
    this.val = val; // the prize on this card
    this.next = next; // where the next card is; null means "The end"
  }
}
// Build from the back: the last card first, so each card can point at one that exists
const third = new ListNode(3);
const second = new ListNode(2, third);
const head = new ListNode(1, second);

// Walk the hunt: start at the head, follow next until there is none
const prizes = [];
let node = head;
while (node !== null) {
  prizes.push(node.val);
  node = node.next; // move to the next card
}
console.log(prizes); // [1, 2, 3]
console.log(head.next === second); // true  (the same box, not a copy)</code></pre>
<p>The last line matters. In JavaScript, a variable that holds an object holds <em>where the object is</em>, not a copy of it. So <code>head.next</code> and <code>second</code> are two arrows to the same box. Change <code>second.val</code> and <code>head.next.val</code> changes too. That is exactly what "pointer" means on this page.</p>
<p>Compare an <a href="#/topic/dsa-words#w-array">array</a>: its items sit in one numbered row, so <code>items[4]</code> jumps straight to position 4 (its <a href="#/topic/dsa-words#w-index">index</a>). A linked list has no numbers. To reach the item at position k, you follow k arrows.</p>
<p>Typing <code>new ListNode(...)</code> by hand gets long, so every code block on this page starts with the same small setup: the <code>ListNode</code> box, <code>buildList([1, 2, 3])</code> to turn an array into a list, and <code>listToArray(head)</code> to turn a list back into an array for printing. Each block can be pasted into a console on its own.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
const head = buildList([10, 20, 30]); // 10 → 20 → 30 → null
console.log(head.val); // 10
console.log(head.next.next.val); // 30
console.log(listToArray(head)); // [10, 20, 30]</code></pre>
<p><code>buildList</code> works backwards: it makes 30 first, then 20 pointing at it, then 10 pointing at 20. Each new box goes in front of the list built so far.</p>

<h3>A real problem: the "Up next" queue in a music app</h3>
<p>Your music app has an "Up next" queue of 100,000 songs. You tap <strong>Play next</strong> on a song: it must go straight after the song playing now, at position 1. You do this many times a day. Songs also get removed from the middle.</p>
<p>The first idea is an array. But an array keeps its items in one tight row with no gaps. To open a gap at position 1, every song after it must move one place to the right. Here is that work, counted:</p>
<pre><code class="language-js">function insertAtCountingMoves(queue, position, song) {
  let moves = 0;
  queue.push(undefined); // make room for one more slot at the end
  for (let i = queue.length - 1; i &gt; position; i--) {
    queue[i] = queue[i - 1]; // shift one song one place to the right
    moves++;
  }
  queue[position] = song; // the gap is open: drop the new song in
  return moves;
}
const queue = ["a", "b", "c", "d", "e"];
console.log(insertAtCountingMoves(queue, 1, "new")); // 4
console.log(queue); // ["a", "new", "b", "c", "d", "e"]</code></pre>
<p>The built-in <code>queue.splice(1, 0, "new")</code> does the same shifting for you, inside the engine. You don't see it, but the work is there.</p>
<ul>
  <li>5 songs: 4 moves. No problem.</li>
  <li>100,000 songs: about <strong>100,000 moves</strong> for one tap of "Play next".</li>
  <li>1,000 taps: about <strong>100 million moves</strong>, just to keep the row tidy.</li>
</ul>

<h3>What the linked list fixes</h3>
<p>Make the queue a linked list, and keep a pointer to the song playing now. "Play next" changes two arrows, however long the queue is:</p>
<div class="diagram"><pre>before:   [a] → [b] → [c] → ...        playing = a

1. new.next = playing.next    [new] → [b]   (new points where a pointed)
2. playing.next = new         [a] → [new]   (a now points at new)

after:    [a] → [new] → [b] → [c] → ...
Two arrow changes. Songs b, c, ... did not move at all.</pre></div>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function insertAfter(node, value) {
  const newNode = new ListNode(value);
  newNode.next = node.next; // 1. the new box points where node used to point
  node.next = newNode; // 2. node now points at the new box
}
const playing = buildList(["a", "b", "c", "d", "e"]); // "a" is playing now
insertAfter(playing, "new");
console.log(listToArray(playing)); // ["a", "new", "b", "c", "d", "e"]</code></pre>
<p>The order of the two lines matters. If you did step 2 first, <code>node.next</code> would already be the new box, and the arrow to "b" would be gone. That is the treasure-hunt rule again: read before you overwrite.</p>
<p>To compare the two, we use <a href="#/topic/dsa-words#w-big-o">Big-O</a>, a short way to say how the work grows as the input grows:</p>
<ul>
  <li><a href="#/topic/dsa-words#w-o-1">O(1)</a> means the same small amount of work however big the input is. The linked-list insert is O(1): two arrow changes for 5 songs or 5 million.</li>
  <li><a href="#/topic/dsa-words#w-o-n">O(n)</a> means the work grows in step with the input (n = the number of items): twice the items, twice the work. The array insert at the front is O(n).</li>
</ul>
<p>But nothing is free. This is a <a href="#/topic/dsa-words#w-trade-off">trade-off</a>. A linked list makes <em>finding</em> position 50,000 slow: you must follow 50,000 arrows. The O(1) insert only helps when you <strong>already hold the box</strong>, like the song playing now. Real apps often keep a Map from song id to its box so they can jump to any song at once. That combination (list + Map) is exactly the <a href="#/topic/dsa-linked-list#ex-1">LRU cache</a> later on this page.</p>
<table>
  <thead><tr><th>Operation</th><th>Array</th><th>Linked list</th></tr></thead>
  <tbody>
    <tr><td>Read the item at position k</td><td>O(1), jump to <code>items[k]</code></td><td>O(n), follow k arrows</td></tr>
    <tr><td>Insert or remove at the front</td><td>O(n), everything shifts</td><td>O(1), change the head</td></tr>
    <tr><td>Insert or remove next to a box you hold</td><td>O(n), the rest shifts</td><td>O(1), 1–2 arrow changes</td></tr>
    <tr><td>Add at the end</td><td>O(1) usually (<a href="#/topic/dsa-words#w-amortized">amortized</a>: the occasional resize averages out)</td><td>O(1) if you keep a <code>tail</code> pointer, O(n) if you must walk there</td></tr>
    <tr><td>Find a value</td><td>O(n)</td><td>O(n)</td></tr>
  </tbody>
</table>

<h3>Variants</h3>
<table>
  <thead><tr><th>Kind</th><th>Arrows in each box</th><th>Picture</th><th>Used for</th></tr></thead>
  <tbody>
    <tr><td>Singly linked</td><td><code>next</code></td><td>A treasure hunt: forward only</td><td><a href="#/topic/dsa-words#w-stack">Stacks</a> (last in, first out) and simple <a href="#/topic/dsa-words#w-queue">queues</a> (first in, first out); the short chains a <a href="#/topic/dsa-words#w-hash-map">hash map</a> keeps when two keys land in the same slot</td></tr>
    <tr><td>Doubly linked</td><td><code>next</code> and <code>prev</code></td><td>Train carriages: you can walk both ways</td><td>An <a href="#/topic/dsa-words#w-lru-cache">LRU cache</a> (one that throws out the least recently used item), browser back/forward, a <a href="#/topic/dsa-words#w-deque">deque</a> (a line you can add to or remove from at both ends), undo/redo</td></tr>
    <tr><td>Circular</td><td>the tail's <code>next</code> is the head</td><td>Kids passing a parcel round a circle</td><td>Taking turns forever (a "round-robin" scheduler), ring buffers (a fixed-size line that wraps around to the start), the Josephus counting-out puzzle</td></tr>
    <tr><td>Skip list</td><td>several <code>next</code> arrows per box, at different "levels"</td><td>A metro line with express trains that skip stops</td><td>Sorted collections that stay fast: Redis sorted sets, LevelDB</td></tr>
  </tbody>
</table>

<h3>Why use a linked list (and why not)?</h3>
<p><strong>Use it when:</strong></p>
<ul>
  <li>You often insert or remove in the middle, <em>and</em> you already hold the box (LRU cache, lists of free memory blocks, a scheduler's waiting line).</li>
  <li>You can't predict the size, and copying everything into a bigger array would be expensive (inside an operating system, or on small devices).</li>
  <li>You need each item to stay in the same box forever, so other code can keep a reference to it. Array <code>splice</code> moves items to new positions.</li>
</ul>
<p><strong>Avoid it when:</strong></p>
<ul>
  <li>You need "give me item k" → use an array.</li>
  <li>You loop over the data a lot. Arrays win because of <strong>cache locality</strong>: the computer's processor loads memory in chunks, and array items sit side by side, so loading one item brings its neighbours along for free. List boxes are scattered, so each arrow can mean a fresh trip to memory. With the same Big-O, an array loop is often many times faster (5–50× is a commonly quoted range).</li>
  <li>You can't say <em>why</em> you need a linked list. In real product code, an array is almost always the answer.</li>
</ul>

<h3>Why interviewers love linked lists</h3>
<ul>
  <li><strong>Pointer fluency.</strong> Can you keep track of which arrow points where, while you change them? Can you tell when two variables point at the same box?</li>
  <li><strong>Edge-case discipline.</strong> An <a href="#/topic/dsa-words#w-edge-case">edge case</a> is an unusual input at the limits. Here: an empty list, one box, the head changing, the tail changing, a loop, merging two lists.</li>
  <li><strong>Classic pointer patterns.</strong> <a href="#/topic/dsa-words#w-fast-slow-pointers">Fast and slow pointers</a> (Floyd's: one pointer moves twice as fast as the other), a gap of n, reverse-and-compare. All are short to write and easy to get subtly wrong.</li>
  <li><strong>They combine well.</strong> LRU = list + hash map. Sorting a list = merge sort (split in half, sort each half, merge the two). Reversing in groups of k = the reverse loop, used again and again.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<p>A <strong>trace</strong> is a table of what every variable holds after each step. Linked-list code is short, but the arrows change fast, so tracing on paper is the main skill. The answer column comes first in each trace below.</p>

<h3>The "draw the pointers" model</h3>
<p>Three rules for the pictures:</p>
<ul>
  <li>A <em>box</em> (node) has two slots: <code>val</code> and <code>next</code>.</li>
  <li>An <em>arrow</em> is a pointer. You can re-aim an arrow; the box itself never moves.</li>
  <li><code>a.next = c</code> does not move b or c. It only changes which way the one arrow leaving a points. If nothing else points at b any more, b is lost.</li>
</ul>
<p>The classic exercise: <strong>reverse</strong> <code>1 → 2 → 3</code> so it becomes <code>3 → 2 → 1</code>, by re-aiming arrows, not by making new boxes. That is called <a href="#/topic/dsa-words#w-in-place">in place</a>. Three pointers do the work:</p>
<ul>
  <li><code>prev</code>: the part already reversed (it starts as <code>null</code>, an empty part).</li>
  <li><code>curr</code>: the box we are working on now.</li>
  <li><code>next</code>: a saved note of where <code>curr</code> used to point, so we don't lose the rest.</li>
</ul>
<p>Each round: <strong>save</strong> <code>next = curr.next</code>, <strong>flip</strong> <code>curr.next = prev</code>, <strong>step</strong> <code>prev = curr</code> and <code>curr = next</code>.</p>
<div class="diagram"><pre>Reverse 1 → 2 → 3 → null.   Each round: save, flip, step.

reversed part (prev)   left to do (curr)   saved next   arrow flipped
null                   1 → 2 → 3           -            (start)
1 → null               2 → 3               2            1.next = null
2 → 1 → null           3                   3            2.next = 1
3 → 2 → 1 → null       null                null         3.next = 2

curr is null, so stop.   Answer: prev, which is 3 → 2 → 1 → null</pre></div>
<p>Why save first? Look at round 1 done in the wrong order:</p>
<div class="diagram"><pre>wrong order:  1.next = prev (null)   →   1 → null
              now try curr = curr.next   →   curr = null
Box 2 and box 3: nothing points at them any more. Lost.</pre></div>
<p>The code for this is in <a href="#/topic/dsa-linked-list#mechanics">Mechanics</a>; the bug has its own entry in <a href="#/topic/dsa-linked-list#pitfalls">Pitfalls</a> (Bug 1).</p>

<h3>Dummy head sentinel</h3>
<p>Many problems can change the <em>first</em> box: deleting it, inserting before it, merging two lists, removing the nth box from the end. Then your code needs an extra "is this the head?" branch, and that branch is where bugs hide.</p>
<p>The fix is a <a href="#/topic/dsa-words#w-dummy-node">dummy node</a>: a fake box you place in front of the real head. A fake value that stands in for "the start" like this is called a <a href="#/topic/dsa-words#w-sentinel">sentinel</a>. Now even the real head has a box before it, so every box is handled the same way. At the end, return <code>dummy.next</code>, the real first box.</p>
<p>Example: remove every 7 from <code>7 → 7 → 3 → 7 → 5</code>. The first two boxes must go, so the head changes.</p>
<div class="diagram"><pre>dummy → 7 → 7 → 3 → 7 → 5        remove every 7
cur starts at dummy. Look at cur.next each step.

list after step (dummy.next on)   looked at   action          cur after
7 → 3 → 7 → 5                     7           skip it         dummy
3 → 7 → 5                         7           skip it         dummy
3 → 7 → 5                         3           keep, move on   3
3 → 5                             7           skip it         3
3 → 5                             5           keep, move on   5
cur.next is null: stop.           Answer: dummy.next = 3 → 5

"skip it" is cur.next = cur.next.next: one arrow jumps over the box.
Both deleted 7s at the front were handled by the SAME line.</pre></div>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function removeAll(head, unwanted) {
  const dummy = new ListNode(0, head); // fake box in front of the real head
  let cur = dummy;
  while (cur.next !== null) {
    if (cur.next.val === unwanted) {
      cur.next = cur.next.next; // skip the unwanted box; stay put to check the new cur.next
    } else {
      cur = cur.next; // keep this box, move on
    }
  }
  return dummy.next; // the real head (may be a different box than before)
}
console.log(listToArray(removeAll(buildList([7, 7, 3, 7, 5]), 7))); // [3, 5]
console.log(listToArray(removeAll(buildList([7, 7]), 7))); // []</code></pre>
<p>The same trick builds a new list neatly. Keep a <code>tail</code> pointer that starts at the dummy; attach each new box at <code>tail.next</code>, then move <code>tail</code> on:</p>
<pre><code class="language-js">class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildWithDummy(values) {
  const dummy = new ListNode(0); // fake start: there is always a box to attach after
  let tail = dummy;
  for (const value of values) {
    tail.next = new ListNode(value); // attach after the current last box
    tail = tail.next; // the new box is now the last one
  }
  return dummy.next; // skip the fake box
}
const head = buildWithDummy([1, 2, 3]);
console.log(head.val, head.next.val, head.next.next.val); // 1 2 3</code></pre>

<h3>Two-pointer mental model</h3>
<p>Many list problems use <a href="#/topic/dsa-words#w-two-pointers">two pointers</a>: two variables walking the same list (or two lists) in a planned way.</p>
<table>
  <thead><tr><th>Pattern</th><th>How the two pointers move</th><th>Solves</th></tr></thead>
  <tbody>
    <tr><td>Slow / fast (Floyd's)</td><td>slow moves 1 box, fast moves 2</td><td>Is there a loop? Where is the middle?</td></tr>
    <tr><td>Gap pointer</td><td>fast goes n boxes ahead, then both move 1</td><td>The nth box from the end; remove it</td></tr>
    <tr><td>Pair walk</td><td>one pointer per list; at the end of its list, each jumps to the other list's head</td><td>Where do two lists join?</td></tr>
    <tr><td>Reverse-half</td><td>find the middle, reverse the second half, walk both halves</td><td>Is the list a <a href="#/topic/dsa-words#w-palindrome">palindrome</a> (the same read forwards and backwards)?</td></tr>
  </tbody>
</table>
<p><strong>Slow and fast: finding the middle.</strong> Two runners start at the head. The fast one takes 2 boxes per step, the slow one takes 1. When the fast one reaches the end, the slow one is halfway. That is the <a href="#/topic/dsa-words#w-fast-slow-pointers">fast and slow pointers</a> idea.</p>
<div class="diagram"><pre>List: 1 → 2 → 3 → 4 → 5        loop runs while fast &amp;&amp; fast.next

middle (slow)   fast   can fast take 2 more steps?
1               1      yes (2 and 3 exist)
2               3      yes (4 and 5 exist)
3               5      no, 5.next is null: stop
Answer: 3

Even list 1 → 2 → 3 → 4:   slow 1 → 2 → 3,   fast 1 → 3 → null
Answer: 3, the SECOND of the two middles (2 and 3).</pre></div>
<p><strong>Slow and fast: finding a loop.</strong> A <a href="#/topic/dsa-words#w-cycle">cycle</a> is a loop: following <code>next</code> brings you back to a box you have already seen, forever. Think of two runners on a track. On a straight road, the fast one simply reaches the end. On a circular track, the fast one gains one box per step and must catch the slow one from behind. It can't jump over it, because the gap shrinks by exactly 1 each step.</p>
<div class="diagram"><pre>1 → 2 → 3 → 4 → 5
        ↑       │
        └───────┘      5.next is 3: a loop

Phase 1: slow +1, fast +2, until they land on the same box.
same box?   slow   fast
no          1      1        (start)
no          2      3
no          3      5
YES         4      4        fast went 5 → 3 → 4
Phase 2: p starts at the head; p and slow both move +1.
same box?   p      slow
no          1      4
no          2      5
YES         3      3        Answer: the loop starts at box 3</pre></div>
<p>Why does phase 2 land on the start of the loop? The walk from the head to the loop's start is the same length as the walk from the meeting box forward to the loop's start (counting whole extra laps). Here both are 2 steps: 1 → 2 → 3, and 4 → 5 → 3. So two pointers moving one step at a time, one from each place, arrive together. The full reasoning is in <a href="#/topic/dsa-linked-list#interview-qa">Interview Q&amp;A</a> Q3.</p>

<h3>Doubly linked list as a deque</h3>
<p>Give every box a second arrow, <code>prev</code>, pointing backwards, and keep pointers to both ends. Now you can add or remove at either end in O(1), and remove any box you hold in O(1), because it knows its own neighbours. That makes it a <a href="#/topic/dsa-words#w-deque">deque</a> (said "deck"): a line you can use from both ends.</p>
<div class="diagram"><pre>head ⇄ [A] ⇄ [B] ⇄ [C] ⇄ tail      (head and tail are dummy boxes)

remove B:   A.next = C   and   C.prev = A      two arrow changes
result:     head ⇄ [A] ⇄ [C] ⇄ tail</pre></div>
<p>This is the building block for the LRU cache, browser history, and anything "most recently used". The cost: two arrows per box instead of one, so a bit more memory.</p>

<h3>How to recognise a linked-list pattern in a question</h3>
<p>The input is a list head (often called <code>head</code>, <code>l1</code>, <code>list1</code>), and the wording points at one of these:</p>
<table>
  <thead><tr><th>The question says…</th><th>Use…</th></tr></thead>
  <tbody>
    <tr><td>"reverse", "reorder", "in place", "swap pairs"</td><td>The save / flip / step loop</td></tr>
    <tr><td>"has a cycle", "where does the cycle begin"</td><td>Fast and slow pointers (Floyd's)</td></tr>
    <tr><td>"middle node", "split in half"</td><td>Fast and slow pointers</td></tr>
    <tr><td>"nth from the end", "remove the kth last"</td><td>Gap pointer + dummy node</td></tr>
    <tr><td>"merge", "remove all with value", "delete duplicates", "partition"</td><td>Dummy node + a <code>tail</code> or <code>cur</code> pointer</td></tr>
    <tr><td>"palindrome"</td><td>Middle + reverse second half + compare</td></tr>
    <tr><td>"where do the two lists meet"</td><td>Pair walk (switch lists at the end)</td></tr>
    <tr><td>"O(1) get and put", "evict least recently used"</td><td>Doubly linked list + hash map</td></tr>
    <tr><td>"sort the list in <a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a>"</td><td>Merge sort on the list</td></tr>
  </tbody>
</table>
<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Linked lists are faster than arrays for inserting." Only if you already hold the box. If you must first <em>find</em> position k, that walk is O(n) and costs as much as the array shift. The O(1) insert is about arrows you already have in hand.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>The building blocks, as real code you can run. Each one is short. Learn the reverse loop, the dummy node and the fast/slow loop by heart: nearly every list problem is made of them.</p>

<h3>Singly linked list: full implementation</h3>
<p>A small class that owns the head and a count of boxes. Each method notes its cost.</p>
<pre><code class="language-js">class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
class SinglyLinkedList {
  constructor() {
    this.head = null; // empty list: no first box yet
    this.size = 0;
  }

  // O(1): the new box becomes the head and points at the old head
  prepend(val) {
    this.head = new ListNode(val, this.head);
    this.size++;
  }

  // O(n): we must walk to the last box first. Keep a tail pointer if you append often.
  append(val) {
    const node = new ListNode(val);
    if (this.head === null) {
      this.head = node; // empty list: the new box is the whole list
    } else {
      let cur = this.head;
      while (cur.next !== null) {
        cur = cur.next; // walk until the box whose next is null (the tail)
      }
      cur.next = node;
    }
    this.size++;
  }

  // O(n): there are no index numbers, so follow index arrows
  get(index) {
    if (index &lt; 0 || index &gt;= this.size) {
      return null; // no such position
    }
    let cur = this.head;
    for (let i = 0; i &lt; index; i++) {
      cur = cur.next;
    }
    return cur;
  }

  // O(n): remove the first box holding val; returns true if one was removed
  remove(val) {
    const dummy = new ListNode(0, this.head); // dummy, so removing the head needs no extra branch
    let prev = dummy;
    while (prev.next !== null) {
      if (prev.next.val === val) {
        prev.next = prev.next.next; // skip over the box
        this.size--;
        this.head = dummy.next; // the head may have been the box we removed
        return true;
      }
      prev = prev.next;
    }
    return false;
  }

  toArray() {
    const values = [];
    for (let cur = this.head; cur !== null; cur = cur.next) {
      values.push(cur.val);
    }
    return values;
  }
}
const list = new SinglyLinkedList();
list.append(2);
list.append(3);
list.prepend(1);
console.log(list.toArray()); // [1, 2, 3]
console.log(list.get(2).val); // 3
console.log(list.remove(1)); // true
console.log(list.toArray(), list.size); // [2, 3] 2</code></pre>
<p>Line by line:</p>
<ul>
  <li><code>prepend</code> is one line: the new box points at the old head, then becomes the head.</li>
  <li><code>append</code> has to walk the whole list to find the last box. That walk is why it is O(n). Storing a <code>tail</code> pointer as well makes it O(1), but then every method that can change the last box must update <code>tail</code> too (see <a href="#/topic/dsa-linked-list#pitfalls">Pitfalls</a>, "Tail handling").</li>
  <li><code>get(index)</code> follows <code>index</code> arrows. Calling it inside a loop is a trap (Pitfalls, Bug 9).</li>
  <li><code>remove</code> uses a dummy, so "the box to remove is the head" is handled by the same line as any other box.</li>
</ul>

<h3>Reverse a linked list (iterative)</h3>
<p>"Iterative" means "with a loop" (<a href="#/topic/dsa-words#w-iterative">iterative</a>), as opposed to recursive. This is the save / flip / step loop traced in the <a href="#/topic/dsa-linked-list#mental-model">Mental Model</a>. Memorise it.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function reverseList(head) {
  let prev = null; // the reversed part so far: empty
  let curr = head; // the box we are working on
  while (curr !== null) {
    const next = curr.next; // 1. save: remember the rest of the list
    curr.next = prev; // 2. flip: point this box backwards
    prev = curr; // 3. step: the reversed part now starts at curr...
    curr = next; // ...and we move on to the saved rest
  }
  return prev; // when curr is null, prev is the new head
}
console.log(listToArray(reverseList(buildList([1, 2, 3])))); // [3, 2, 1]
console.log(listToArray(reverseList(buildList([7])))); // [7]
console.log(reverseList(null)); // null</code></pre>
<ul>
  <li>The loop visits each box once: <strong>O(n) time</strong>.</li>
  <li>It uses three variables however long the list is: <strong>O(1) extra space</strong>.</li>
  <li>An empty list skips the loop and returns <code>null</code>. One box: the loop runs once and returns that box. No special cases needed.</li>
</ul>

<h3>Reverse a linked list (recursive)</h3>
<p><a href="#/topic/dsa-words#w-recursion">Recursion</a> means a function that calls itself on a smaller piece of the problem. Every recursion needs a <a href="#/topic/dsa-words#w-base-case">base case</a>: a piece so small you answer it directly, without calling again.</p>
<p>The idea: "to reverse <code>1 → 2 → 3</code>, first reverse <code>2 → 3</code> (trust the function to do it), then hook box 1 on the end."</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function reverseRecursive(head) {
  if (head === null || head.next === null) {
    return head; // base case: 0 or 1 box is already reversed
  }
  const newHead = reverseRecursive(head.next); // reverse everything after head
  head.next.next = head; // the box after head now points back at head
  head.next = null; // and head becomes the new last box
  return newHead;
}
console.log(listToArray(reverseRecursive(buildList([1, 2, 3])))); // [3, 2, 1]</code></pre>
<div class="diagram"><pre>reverseRecursive(1 → 2 → 3)
  reverseRecursive(2 → 3)
    reverseRecursive(3)      one box: base case, returns 3
  back in the (2) call:  2.next.next = 2   makes 3 → 2
                         2.next = null     list: 3 → 2 → null
  back in the (1) call:  1.next is still 2, so 2.next = 1
                         1.next = null     list: 3 → 2 → 1 → null
Answer: 3 → 2 → 1 (box 3 is passed back up as newHead)</pre></div>
<p>Each call waits on the <a href="#/topic/dsa-words#w-call-stack">call stack</a> (the computer's pile of unfinished function calls) until the one below it returns. A list of n boxes means n waiting calls: <strong>O(n) time and O(n) space</strong>. A very long list makes the pile too tall and the program crashes with a <a href="#/topic/dsa-words#w-stack-overflow">stack overflow</a>. Interviewers like to see both versions, and like to hear you prefer the loop for long lists.</p>

<h3>Find the middle node</h3>
<p>Slow moves 1, fast moves 2. When fast runs out of list, slow is in the middle. Traced in the <a href="#/topic/dsa-linked-list#mental-model">Mental Model</a>.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
// Even length: returns the SECOND middle (1 → 2 → 3 → 4 gives 3).
function middleNode(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) { // fast can safely take 2 steps
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
// Even length: returns the FIRST middle (1 → 2 → 3 → 4 gives 2).
function firstMiddleNode(head) {
  if (head === null) {
    return null; // this version reads fast.next, so it needs a non-empty list
  }
  let slow = head;
  let fast = head;
  while (fast.next !== null &amp;&amp; fast.next.next !== null) { // stop one round earlier
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
console.log(middleNode(buildList([1, 2, 3, 4, 5])).val); // 3
console.log(middleNode(buildList([1, 2, 3, 4])).val); // 3
console.log(firstMiddleNode(buildList([1, 2, 3, 4])).val); // 2</code></pre>
<p>Fast covers the list once and slow half of it: <strong>O(n) time, O(1) space</strong>. Which middle you get depends only on the loop condition. Pick the one the problem needs (the palindrome check below wants the first middle).</p>

<h3>Detect a cycle (Floyd's tortoise &amp; hare)</h3>
<p>Two functions: <code>hasCycle</code> answers yes or no; <code>detectCycle</code> returns the box where the loop begins. Both were traced in the <a href="#/topic/dsa-linked-list#mental-model">Mental Model</a>.</p>
<pre><code class="language-js">class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) { // fast reaching null means: no loop
    slow = slow.next; // tortoise: 1 step
    fast = fast.next.next; // hare: 2 steps
    if (slow === fast) {
      return true; // same box: the hare lapped the tortoise, so there is a loop
    }
  }
  return false;
}

// The walk from the head to the loop's start is as long as the walk from the
// meeting box forward to the loop's start (plus whole laps). So restart one
// pointer at the head, move both 1 step at a time, and they meet at the start.
function detectCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let fromHead = head;
      while (fromHead !== slow) {
        fromHead = fromHead.next;
        slow = slow.next;
      }
      return fromHead; // the first box of the loop
    }
  }
  return null; // no loop
}
// Build 1 → 2 → 3 → 4 → 5, then make 5 point back at 3
const nodes = [1, 2, 3, 4, 5].map((value) =&gt; new ListNode(value));
for (let i = 0; i &lt; nodes.length - 1; i++) {
  nodes[i].next = nodes[i + 1];
}
nodes[4].next = nodes[2]; // the loop: 5 → 3
console.log(hasCycle(nodes[0])); // true
console.log(detectCycle(nodes[0]).val); // 3
nodes[4].next = null; // break the loop
console.log(hasCycle(nodes[0]), detectCycle(nodes[0])); // false null</code></pre>
<p><strong>Cost:</strong> O(n) time. Before the loop is entered, slow takes at most n steps; once both are inside, fast closes the gap by 1 per step, so they meet within one lap. O(1) space. The easy alternative, a <a href="#/topic/dsa-words#w-hash-set">Set</a> of boxes already visited, is also O(n) time but needs O(n) memory.</p>

<h3>Remove nth node from end (gap pointer)</h3>
<p>You don't know the length, so you can't count "length − n" without an extra walk. Instead, put a gap of n boxes between two pointers. When the front one reaches the last box, the back one is just before the box to delete.</p>
<div class="diagram"><pre>Remove the 2nd from the end of 1 → 2 → 3 → 4 → 5.   n = 2
Both start at dummy. First, fast moves n = 2 boxes ahead.

box after slow (to delete)   slow    fast   fast.next?
-                            dummy   2      yes, move both
-                            1       3      yes, move both
-                            2       4      yes, move both
4                            3       5      no: stop
slow.next = slow.next.next   →   1 → 2 → 3 → 5</pre></div>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head); // so that removing the head is not a special case
  let fast = dummy;
  let slow = dummy;
  for (let i = 0; i &lt; n; i++) {
    fast = fast.next; // open a gap of n boxes
  }
  while (fast.next !== null) { // move both until fast is on the last box
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next; // slow is just before the box to delete: skip it
  return dummy.next;
}
console.log(listToArray(removeNthFromEnd(buildList([1, 2, 3, 4, 5]), 2))); // [1, 2, 3, 5]
console.log(listToArray(removeNthFromEnd(buildList([1, 2]), 2))); // [2]  (the head itself)
console.log(listToArray(removeNthFromEnd(buildList([1]), 1))); // []</code></pre>
<p><strong>Cost:</strong> one walk, O(n) time, O(1) space. Without the dummy, the second call (remove the head) would push <code>fast</code> past the end and crash on <code>fast.next</code>.</p>

<h3>Merge two sorted lists</h3>
<p>Two <a href="#/topic/dsa-words#w-sorted">sorted</a> lists, like two sorted piles of exam papers. Look at the top of each pile, take the smaller one, repeat. A dummy node gives you something to attach the first box to.</p>
<div class="diagram"><pre>a = 1 → 4 → 6      b = 2 → 3 → 7

merged so far (dummy.next on)   a      b      took
1                               4      2      1 from a
1 → 2                           4      3      2 from b
1 → 2 → 3                       4      7      3 from b
1 → 2 → 3 → 4                   6      7      4 from a
1 → 2 → 3 → 4 → 6               null   7      6 from a
a is empty: attach the rest of b in one step  →  1 → 2 → 3 → 4 → 6 → 7</pre></div>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function mergeTwoLists(a, b) {
  const dummy = new ListNode(0);
  let tail = dummy; // the last box of the merged list so far
  while (a !== null &amp;&amp; b !== null) {
    if (a.val &lt;= b.val) { // "&lt;=" takes from a on ties, which keeps equal items in order
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  if (a !== null) {
    tail.next = a; // whatever is left is already sorted: attach it whole
  } else {
    tail.next = b;
  }
  return dummy.next;
}
console.log(listToArray(mergeTwoLists(buildList([1, 4, 6]), buildList([2, 3, 7])))); // [1, 2, 3, 4, 6, 7]
console.log(listToArray(mergeTwoLists(null, buildList([5])))); // [5]</code></pre>
<p><strong>Cost:</strong> O(m + n) time, where m and n are the two lengths: each box is taken once. O(1) extra space, because it re-uses the existing boxes instead of making new ones.</p>

<h3>Palindrome check (reverse half)</h3>
<p>A <a href="#/topic/dsa-words#w-palindrome">palindrome</a> reads the same both ways, like "level" or <code>1 → 2 → 2 → 1</code>. A list can't be read backwards, so: find the middle, reverse the second half, then walk the two halves side by side.</p>
<div class="diagram"><pre>1 → 2 → 2 → 1

1. first middle: slow stops on the first 2
2. reverse what comes after slow:   2 → 1   becomes   1 → 2
3. compare:
   still a palindrome?   left half   right half (reversed)
   yes                   1           1
   yes                   2           2
   right half is used up: Answer: true</pre></div>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function isPalindrome(head) {
  if (head === null || head.next === null) {
    return true; // 0 or 1 box reads the same both ways
  }
  // 1. find the FIRST middle
  let slow = head;
  let fast = head;
  while (fast.next !== null &amp;&amp; fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  // 2. reverse the second half (everything after slow)
  let prev = null;
  let curr = slow.next;
  while (curr !== null) {
    const next = curr.next; // save
    curr.next = prev; // flip
    prev = curr; // step
    curr = next;
  }
  // 3. compare the first half with the reversed second half
  let left = head;
  let right = prev;
  while (right !== null) { // the second half is never longer, so stop when it ends
    if (left.val !== right.val) {
      return false;
    }
    left = left.next;
    right = right.next;
  }
  return true;
}
console.log(isPalindrome(buildList([1, 2, 2, 1]))); // true
console.log(isPalindrome(buildList([1, 2, 3, 2, 1]))); // true
console.log(isPalindrome(buildList([1, 2]))); // false</code></pre>
<p><strong>Cost:</strong> O(n) time (three half-or-full walks), O(1) space. Note that it changes the input list. If the caller still needs it, reverse the second half back before returning.</p>

<h3>Intersection of two linked lists</h3>
<p>Two lists can share their ending: from some box on, they are the very same boxes (a Y-shape). Find that first shared box, or <code>null</code>.</p>
<p>The trick: pointer <code>a</code> walks list A and then list B; pointer <code>b</code> walks list B and then list A. Both then walk the same total distance, so they reach the shared part at the same moment.</p>
<div class="diagram"><pre>A: 1 → 2 ↘
           8 → 9          A has 2 boxes of its own, B has 1,
B:     5 ↗                and they share 8 → 9

same box?   a      b
no          1      5
no          2      8
no          8      9
no          9      null
no          null   1      (b ran out: jump to the head of A)
no          5      2      (a ran out: jump to the head of B)
YES         8      8      Answer: box 8
Before box 8, both walked 5 boxes (a: 1 2 8 9 5,  b: 5 8 9 1 2).</pre></div>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
// O(m + n) time, O(1) space. When a pointer runs off the end of its list it
// jumps to the other list's head. After at most m + n steps they are level,
// and meet at the first shared box (or both are null if nothing is shared).
function getIntersectionNode(headA, headB) {
  if (headA === null || headB === null) {
    return null;
  }
  let a = headA;
  let b = headB;
  while (a !== b) {
    if (a === null) {
      a = headB; // finished list A: continue on list B
    } else {
      a = a.next;
    }
    if (b === null) {
      b = headA; // finished list B: continue on list A
    } else {
      b = b.next;
    }
  }
  return a; // the shared box, or null
}
const shared = buildList([8, 9]);
const listA = new ListNode(1, new ListNode(2, shared)); // 1 → 2 → 8 → 9
const listB = new ListNode(5, shared); // 5 → 8 → 9
console.log(getIntersectionNode(listA, listB).val); // 8
console.log(getIntersectionNode(buildList([1, 2]), buildList([3]))); // null</code></pre>
<p>"Shared" means the <em>same box</em> (<code>a === b</code>), not just the same value. Two separate boxes both holding 8 do not count.</p>
<p><strong>The other way, length-diff align:</strong> measure both lengths, move the longer list's pointer ahead by the difference, then walk both together until they meet. Also O(m + n) time and O(1) space; it is just more code.</p>

<h3>Doubly linked list (LRU building block)</h3>
<p>Each box has <code>prev</code> and <code>next</code>. Two dummy boxes sit at the ends, so the list is never truly empty and no method needs an "is this the first/last box?" branch.</p>
<pre><code class="language-js">class DLLNode {
  constructor(key, val) {
    this.key = key; // kept so the LRU cache can delete it from its map
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}
class DoublyLinkedList {
  constructor() {
    this.head = new DLLNode(null, null); // dummy at the front
    this.tail = new DLLNode(null, null); // dummy at the back
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  // put node right after the front dummy: 4 arrows
  addFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }
  // take node out: its two neighbours now point at each other
  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
  // remove and return the last real box (or null if empty)
  popBack() {
    if (this.tail.prev === this.head) {
      return null; // only the two dummies are left
    }
    const node = this.tail.prev;
    this.remove(node);
    return node;
  }
  keys() {
    const result = [];
    for (let node = this.head.next; node !== this.tail; node = node.next) {
      result.push(node.key);
    }
    return result;
  }
}
const list = new DoublyLinkedList();
const boxA = new DLLNode("A", 1);
const boxB = new DLLNode("B", 2);
const boxC = new DLLNode("C", 3);
list.addFront(boxC);
list.addFront(boxB);
list.addFront(boxA);
console.log(list.keys()); // ["A", "B", "C"]
list.remove(boxB); // O(1): no walking, the box knows its neighbours
console.log(list.keys()); // ["A", "C"]
console.log(list.popBack().key); // C
console.log(list.keys()); // ["A"]</code></pre>
<p>Every method is O(1). The key one is <code>remove</code>: with only <code>next</code> arrows, removing a box means finding the box before it, which is an O(n) walk. With <code>prev</code>, the box already knows. That is why the LRU cache below uses a doubly linked list.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<p>Seven classic interview problems. Each one has the problem in plain words, the idea, a short trace, code you can paste into a console, and its cost in words.</p>

<h3 id="ex-1">1. LRU Cache (LeetCode 146)</h3>
<p><strong>The problem:</strong> Your phone keeps the 2 most recently opened apps warm in memory, so they open instantly. When you open a third app, the one you used <em>longest ago</em> is closed to make room. That rule is "least recently used", or <a href="#/topic/dsa-words#w-lru-cache">LRU</a>. Build a cache with a fixed capacity and two methods: <code>get(key)</code> returns the value (or -1 if missing) and counts as a "use"; <code>put(key, value)</code> adds or updates, and evicts the least recently used key when full. Both must be O(1). This is a classic FAANG question.</p>
<p><strong>The idea:</strong> Two structures working together:</p>
<ul>
  <li>A <strong>doubly linked list</strong> keeps the keys in order of use: most recent at the front, least recent at the back. Moving a box to the front, or removing the back box, is O(1).</li>
  <li>A <a href="#/topic/dsa-words#w-hash-map">hash map</a> (a JavaScript <code>Map</code>) from key to its box, so you can find any box without walking the list. A Map lookup is O(1) on average: that is its expected cost with a good hash function, though a rare unlucky case can be slower (see <a href="#/topic/dsa-words#w-worst-average-case">worst vs average case</a>).</li>
</ul>
<div class="diagram"><pre>capacity = 2.   list: most recent first.

returns   list (front → back)   map keys   call
-         1                     {1}        put(1, "a")
-         2, 1                  {1, 2}     put(2, "b")
"a"       1, 2                  {1, 2}     get(1): move 1 to the front
-         3, 1                  {1, 3}     put(3, "c"): full, evict back (2)
-1        3, 1                  {1, 3}     get(2): not there
"c"       3, 1                  {1, 3}     get(3): already at the front</pre></div>
<pre><code class="language-js">class DLLNode {
  constructor(key, val) {
    this.key = key; // kept so that eviction knows which map entry to delete
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}
class DoublyLinkedList {
  constructor() {
    this.head = new DLLNode(null, null); // dummy at the front (most recent side)
    this.tail = new DLLNode(null, null); // dummy at the back (least recent side)
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
    node.prev.next = node.next; // both neighbours must be updated
    node.next.prev = node.prev;
  }
  popBack() {
    if (this.tail.prev === this.head) {
      return null;
    }
    const node = this.tail.prev;
    this.remove(node);
    return node;
  }
}
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key -&gt; its box in the list
    this.list = new DoublyLinkedList();
  }
  get(key) {
    const node = this.map.get(key);
    if (node === undefined) {
      return -1;
    }
    this.list.remove(node);
    this.list.addFront(node); // just used: move to the most-recent end
    return node.val;
  }
  put(key, value) {
    const existing = this.map.get(key);
    if (existing !== undefined) {
      existing.val = value; // update in place
      this.list.remove(existing);
      this.list.addFront(existing);
      return;
    }
    if (this.map.size === this.capacity) {
      const evicted = this.list.popBack(); // the least recently used box
      this.map.delete(evicted.key); // forget it in the map too, or the map keeps growing
    }
    const node = new DLLNode(key, value);
    this.list.addFront(node);
    this.map.set(key, node);
  }
}
const cache = new LRUCache(2);
cache.put(1, "a");
cache.put(2, "b");
console.log(cache.get(1)); // a
cache.put(3, "c"); // full: evicts key 2, the least recently used
console.log(cache.get(2)); // -1
console.log(cache.get(3)); // c</code></pre>
<p><strong>Why a doubly linked list?</strong> On every <code>get</code>, we take a box out of the middle and move it to the front. With only <code>next</code> arrows, taking a box out means finding the box before it: an O(n) walk. With <code>prev</code>, the box knows its neighbour, so it is O(1). The map gives the O(1) jump to the box we want.</p>
<p><strong>Cost:</strong> <code>get</code> and <code>put</code> are O(1) on average (a few arrow changes plus a Map lookup). Space O(capacity): one box and one map entry per stored key.</p>

<h3 id="ex-2">2. Reverse nodes in k-group (LeetCode 25, hard)</h3>
<p><strong>The problem:</strong> Reverse the list in groups of k boxes. A group at the end with fewer than k boxes stays as it is. For <code>1 → 2 → 3 → 4 → 5</code> and k = 2: <code>2 → 1 → 4 → 3 → 5</code>.</p>
<p><strong>The idea:</strong> First check that at least k boxes are left; if not, leave them alone. Otherwise, solve the <em>rest</em> of the list first (recursion), then reverse this group of k with the usual save / flip / step loop, starting <code>prev</code> at the already-solved rest. That way the group's last box ends up pointing at the right place.</p>
<div class="diagram"><pre>1 → 2 → 3 → 4 → 5        k = 2

call starts at   k boxes left?   returns (new head of this part)
5                no (only 1)     5               left as it is
3                yes (3, 4)      4 → 3 → 5       reverse 3, 4 onto 5
1                yes (1, 2)      2 → 1 → 4 → 3 → 5
The deepest call finishes first; each call reverses its group
on top of what the call after it returned.   Answer: 2 1 4 3 5</pre></div>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function reverseKGroup(head, k) {
  // 1. count: are there at least k boxes from head on?
  let count = 0;
  let node = head;
  while (count &lt; k &amp;&amp; node !== null) {
    node = node.next;
    count++;
  }
  if (count &lt; k) {
    return head; // a short last group stays as it is
  }
  // node is now the first box of the NEXT group. Solve that part first.
  let prev = reverseKGroup(node, k); // our group will be hooked in front of this
  let curr = head;
  for (let i = 0; i &lt; k; i++) { // the usual reverse loop, but only k times
    const next = curr.next; // save
    curr.next = prev; // flip
    prev = curr; // step
    curr = next;
  }
  return prev; // the old k-th box is this group's new head
}
console.log(listToArray(reverseKGroup(buildList([1, 2, 3, 4, 5]), 2))); // [2, 1, 4, 3, 5]
console.log(listToArray(reverseKGroup(buildList([1, 2, 3, 4, 5]), 3))); // [3, 2, 1, 4, 5]</code></pre>
<p><strong>Cost:</strong> O(n) time: each box is counted once and flipped once. Space O(n / k) for the waiting recursive calls, one per group. A loop-only version with a dummy node gets this to O(1) space; it is longer but the same idea.</p>

<h3 id="ex-3">3. Copy list with random pointer</h3>
<p><strong>The problem:</strong> Each box has <code>next</code> and also <code>random</code>, which can point at any box in the list, or be <code>null</code>. Make a <em>deep copy</em>: brand-new boxes with the same values, where every copied <code>next</code> and <code>random</code> points at a copied box, never at an original.</p>
<p><strong>The idea (no extra map):</strong> The hard part is: when copying A, where is the copy of A's random target? Trick: put each copy <em>right after its original</em>. Then "the copy of X" is always <code>X.next</code>. Three passes:</p>
<div class="diagram"><pre>Originals: A → B → C      randoms: A→C, B→A, C→null

pass 1, weave in copies:  A → A' → B → B' → C → C'
pass 2, set copy randoms: A'.random = A.random.next = C'
                          B'.random = B.random.next = A'
                          C'.random stays null
pass 3, unweave:          originals A → B → C   (put back)
                          copies    A' → B' → C'   ← Answer</pre></div>
<pre><code class="language-js">class RandomNode {
  constructor(val) {
    this.val = val;
    this.next = null;
    this.random = null; // may point at any box in the list, or be null
  }
}
// Build a list from values, plus the index each random points to (or null)
function buildRandomList(values, randomIndexes) {
  const nodes = values.map((value) =&gt; new RandomNode(value));
  for (let i = 0; i &lt; nodes.length - 1; i++) {
    nodes[i].next = nodes[i + 1];
  }
  for (let i = 0; i &lt; nodes.length; i++) {
    if (randomIndexes[i] !== null) {
      nodes[i].random = nodes[randomIndexes[i]];
    }
  }
  if (nodes.length === 0) {
    return null;
  }
  return nodes[0];
}
// Describe a list as [value, index its random points to]
function describe(head) {
  const nodes = [];
  for (let node = head; node !== null; node = node.next) {
    nodes.push(node);
  }
  const result = [];
  for (const node of nodes) {
    if (node.random === null) {
      result.push([node.val, null]);
    } else {
      result.push([node.val, nodes.indexOf(node.random)]);
    }
  }
  return result;
}
function copyRandomList(head) {
  if (head === null) {
    return null;
  }
  // 1. weave: put a copy right after each original
  let cur = head;
  while (cur !== null) {
    const copy = new RandomNode(cur.val);
    copy.next = cur.next;
    cur.next = copy;
    cur = copy.next; // jump to the next ORIGINAL
  }
  // 2. the copy of X is X.next, so a copy's random is "original random's .next"
  cur = head;
  while (cur !== null) {
    if (cur.random !== null) {
      cur.next.random = cur.random.next;
    }
    cur = cur.next.next; // next original
  }
  // 3. unweave: pull the copies out into their own list, and repair the originals
  const dummy = new RandomNode(0);
  let tail = dummy;
  cur = head;
  while (cur !== null) {
    const copy = cur.next;
    tail.next = copy; // add the copy to the new list
    tail = copy;
    cur.next = copy.next; // the original skips over its copy again
    cur = cur.next;
  }
  return dummy.next;
}
const original = buildRandomList([7, 13, 11, 10, 1], [null, 0, 4, 2, 0]);
const copied = copyRandomList(original);
console.log(describe(copied)); // [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]]
console.log(describe(original)); // [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]]
console.log(copied === original, copied.next.random === original); // false false</code></pre>
<p><strong>Cost:</strong> O(n) time (three walks). O(1) extra space besides the copies themselves. The simpler way is a Map from each original box to its copy: also O(n) time, but O(n) extra memory for the map.</p>

<h3 id="ex-4">4. Add two numbers (LeetCode 2)</h3>
<p><strong>The problem:</strong> Two numbers are stored as lists of digits, <em>ones digit first</em>. 342 is <code>2 → 4 → 3</code>, and 465 is <code>5 → 6 → 4</code>. Return their sum as a list in the same style: 807 is <code>7 → 0 → 8</code>.</p>
<p><strong>The idea:</strong> This is column addition from school. Because the ones digit comes first, walking the lists left to right is exactly adding right to left on paper. Keep a <code>carry</code>. A list that runs out counts as 0. Keep going while either list has digits <em>or</em> a carry is left.</p>
<div class="diagram"><pre>  342 + 465:   a = 2 → 4 → 3     b = 5 → 6 → 4

result so far   digit a   digit b   carry in   sum   carry out
7               2         5         0          7     0
7 → 0           4         6         0          10    1
7 → 0 → 8       3         4         1          8     0
Answer: 7 → 0 → 8   (807)</pre></div>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function addTwoNumbers(first, second) {
  const dummy = new ListNode(0);
  let tail = dummy;
  let carry = 0;
  let a = first;
  let b = second;
  while (a !== null || b !== null || carry &gt; 0) {
    let digitA = 0; // a list that has run out counts as 0
    if (a !== null) {
      digitA = a.val;
      a = a.next;
    }
    let digitB = 0;
    if (b !== null) {
      digitB = b.val;
      b = b.next;
    }
    const sum = digitA + digitB + carry;
    carry = Math.floor(sum / 10); // the tens part moves to the next column
    tail.next = new ListNode(sum % 10); // the ones part stays in this column
    tail = tail.next;
  }
  return dummy.next;
}
console.log(listToArray(addTwoNumbers(buildList([2, 4, 3]), buildList([5, 6, 4])))); // [7, 0, 8]
console.log(listToArray(addTwoNumbers(buildList([9, 9]), buildList([1])))); // [0, 0, 1]  (99 + 1 = 100)</code></pre>
<p>The second call shows why <code>carry &gt; 0</code> is in the loop condition: both lists are used up, but a carry of 1 still needs a box.</p>
<p><strong>Cost:</strong> O(max(m, n)) time, one step per digit of the longer number. O(1) extra space besides the answer list.</p>

<h3 id="ex-5">5. Sort linked list — merge sort, O(n log n) time, O(log n) space</h3>
<p><strong>The problem:</strong> Sort a linked list, for example <code>4 → 2 → 1 → 3</code> into <code>1 → 2 → 3 → 4</code>, in <a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a> time (a bit more than one walk per item; the next paragraph explains).</p>
<p><strong>The idea:</strong> Merge sort, a <a href="#/topic/dsa-words#w-divide-and-conquer">divide and conquer</a> method: split the problem in half, solve each half, combine. Split the list at its middle (fast and slow pointers), sort each half the same way, then merge the two sorted halves (the <a href="#/topic/dsa-linked-list#mechanics">merge</a> from Mechanics). Halving n boxes again and again takes about log₂ n rounds (<a href="#/topic/dsa-words#w-o-log-n">O(log n)</a>: 1,000 boxes need only about 10 halvings), and each round merges all n boxes once. So the total is n × log n.</p>
<div class="diagram"><pre>sorted result      what happens
                   4 → 2 → 1 → 3        split at the first middle
                   4 → 2  |  1 → 3      split each half again
                   4 | 2  |  1 | 3      one box each: already sorted
2 → 4  |  1 → 3    merge pairs
1 → 2 → 3 → 4      merge the halves.    Answer: 1 2 3 4</pre></div>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function mergeTwoLists(a, b) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (a !== null &amp;&amp; b !== null) {
    if (a.val &lt;= b.val) {
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  if (a !== null) {
    tail.next = a;
  } else {
    tail.next = b;
  }
  return dummy.next;
}
function sortList(head) {
  if (head === null || head.next === null) {
    return head; // 0 or 1 box: already sorted
  }
  // 1. split with slow/fast. fast starts one box ahead, so slow stops on the
  //    FIRST middle and both halves are non-empty (no endless recursion on 2 boxes).
  let slow = head;
  let fast = head.next;
  while (fast !== null &amp;&amp; fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  const secondHalf = slow.next;
  slow.next = null; // cut the list in two
  // 2. sort each half, then merge
  const left = sortList(head);
  const right = sortList(secondHalf);
  return mergeTwoLists(left, right);
}
console.log(listToArray(sortList(buildList([4, 2, 1, 3])))); // [1, 2, 3, 4]
console.log(listToArray(sortList(buildList([5, -1, 3, 4, 0])))); // [-1, 0, 3, 4, 5]</code></pre>
<p><strong>Why merge sort?</strong> Quicksort's "partition" step jumps between positions from both ends, which an array does in O(1) but a list can't. Merge sort only ever walks forward, which suits a list perfectly, and it is <a href="#/topic/dsa-words#w-stable-sort">stable</a> (equal values keep their order). <strong>Space:</strong> the recursion is only about log₂ n calls deep, so O(log n). A "bottom-up" merge sort (merge pairs of 1, then pairs of 2, then 4, … with loops) needs no recursion and gets to O(1) extra space.</p>
<p><strong>Cost:</strong> O(n log n) time, O(log n) space.</p>

<h3 id="ex-6">6. Flatten a multilevel doubly linked list (LeetCode 430)</h3>
<p><strong>The problem:</strong> A doubly linked list where any box may also have a <code>child</code> pointer to another doubly linked list, which may have children of its own. Think of a document outline with sub-points. Flatten it into one level: each child list goes right after its parent box, before the parent's old next box. All <code>child</code> pointers become <code>null</code>.</p>
<p><strong>The idea:</strong> Walk the list. When a box has a child, splice the child list in after it, and remember the box that used to come next on a <a href="#/topic/dsa-words#w-stack">stack</a> (a pile: the last thing put on is the first taken off). When you reach the end of a child list, pop the remembered box and attach it. This is a depth-first walk (<a href="#/topic/dsa-words#w-dfs">DFS</a>): go as deep as possible first, then come back.</p>
<div class="diagram"><pre>1 ⇄ 2 ⇄ 3 ⇄ 4
    |
    5 ⇄ 6          2 has child 5;  5 has child 7
    |
    7

flattened so far          box   stack (top last)   what happens
1                         1     []                 no child
1 2 5                     2     [3]                child 5: save 3
1 2 5 7                   5     [3, 6]             child 7: save 6
1 2 5 7 6                 7     [3]                end: pop 6
1 2 5 7 6 3               6     []                 end: pop 3
1 2 5 7 6 3 4             3     []                 walk on to 4
Answer: 1 2 5 7 6 3 4</pre></div>
<pre><code class="language-js">class MultiNode {
  constructor(val) {
    this.val = val;
    this.prev = null;
    this.next = null;
    this.child = null; // may point at the head of another list
  }
}
// Make a doubly linked list from values; returns its boxes so we can add children
function makeLevel(values) {
  const nodes = values.map((value) =&gt; new MultiNode(value));
  for (let i = 0; i &lt; nodes.length - 1; i++) {
    nodes[i].next = nodes[i + 1];
    nodes[i + 1].prev = nodes[i];
  }
  return nodes;
}
function flatten(head) {
  if (head === null) {
    return null;
  }
  const stack = []; // boxes to come back to after a child list ends
  let cur = head;
  while (cur !== null) {
    if (cur.child !== null) {
      if (cur.next !== null) {
        stack.push(cur.next); // remember where this level continues
      }
      cur.next = cur.child; // splice the child list in after cur
      cur.child.prev = cur;
      cur.child = null;
    }
    if (cur.next === null &amp;&amp; stack.length &gt; 0) {
      const resume = stack.pop(); // end of a child list: go back up one level
      cur.next = resume;
      resume.prev = cur;
    }
    cur = cur.next;
  }
  return head;
}
const top = makeLevel([1, 2, 3, 4]);
const middle = makeLevel([5, 6]);
const bottom = makeLevel([7]);
top[1].child = middle[0]; // 2 has child 5
middle[0].child = bottom[0]; // 5 has child 7
const flat = flatten(top[0]);
const forward = [];
let last = null;
for (let node = flat; node !== null; node = node.next) {
  forward.push(node.val);
  last = node;
}
const backward = [];
for (let node = last; node !== null; node = node.prev) {
  backward.push(node.val); // walking back checks every prev arrow too
}
console.log(forward); // [1, 2, 5, 7, 6, 3, 4]
console.log(backward); // [4, 3, 6, 7, 5, 2, 1]</code></pre>
<p><strong>Cost:</strong> O(n) time: each box is visited once, and pushed and popped at most once. Space O(d), where d is the number of levels, because the stack holds at most one box per level (O(n) in the worst case, a long chain of children).</p>

<h3 id="ex-7">7. Rotate list right by k</h3>
<p><strong>The problem:</strong> Move the last k boxes to the front. For <code>1 → 2 → 3 → 4 → 5</code> and k = 2: <code>4 → 5 → 1 → 2 → 3</code>. k can be bigger than the length: rotating 5 boxes by 7 is the same as by 2.</p>
<p><strong>The idea:</strong> Walk once to find the length and the last box. Reduce k with <code>k % length</code>. Join the last box to the head, making a circle. Then walk to the box that should become the new last one, <code>length - k</code> boxes in, and cut the circle after it.</p>
<div class="diagram"><pre>1 → 2 → 3 → 4 → 5     k = 2,   length = 5,   steps = 2 % 5 = 2

join tail to head:   1 → 2 → 3 → 4 → 5 → (back to 1)
new last box = box number length - steps = 3 (box 3)
new head = box 3's next = 4;   cut: 3.next = null
Answer: 4 → 5 → 1 → 2 → 3</pre></div>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function rotateRight(head, k) {
  if (head === null || head.next === null || k === 0) {
    return head; // nothing to move
  }
  // find the length and the last box
  let length = 1;
  let tail = head;
  while (tail.next !== null) {
    tail = tail.next;
    length++;
  }
  const steps = k % length; // rotating by length is a full turn: no change
  if (steps === 0) {
    return head;
  }
  tail.next = head; // close the circle
  let newTail = head;
  for (let i = 1; i &lt; length - steps; i++) {
    newTail = newTail.next; // walk to box number (length - steps)
  }
  const newHead = newTail.next;
  newTail.next = null; // cut the circle
  return newHead;
}
console.log(listToArray(rotateRight(buildList([1, 2, 3, 4, 5]), 2))); // [4, 5, 1, 2, 3]
console.log(listToArray(rotateRight(buildList([1, 2, 3, 4, 5]), 7))); // [4, 5, 1, 2, 3]
console.log(listToArray(rotateRight(buildList([0, 1, 2]), 3))); // [0, 1, 2]</code></pre>
<p><strong>Cost:</strong> O(n) time (at most two walks), O(1) space.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>
<p>An <a href="#/topic/dsa-words#w-edge-case">edge case</a> is an unusual input at the limits: empty, one box, a loop, and so on. Each item says what goes wrong, gives a tiny example, and gives the fix.</p>

<h3>The empty list</h3>
<p><strong>What goes wrong:</strong> An empty list is just <code>head === null</code>. Any code that reads <code>head.val</code> or <code>head.next</code> without checking crashes with a TypeError. This is the most common linked-list bug.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">function firstValueUnsafe(head) {
  return head.val; // crashes when head is null
}
function firstValue(head) {
  if (head === null) {
    return null; // explicit early return for the empty list
  }
  return head.val;
}
try {
  firstValueUnsafe(null);
} catch (error) {
  console.log(error.name); // TypeError
}
console.log(firstValue(null)); // null</code></pre>
<p><strong>Fix:</strong> Decide what an empty list should return, and check <code>head === null</code> at the top. Many loop-based functions (like <code>reverseList</code>) handle it for free because their <code>while (curr !== null)</code> loop simply never runs. Check that yours does.</p>

<h3>Single node</h3>
<p><strong>What goes wrong:</strong> With one box, <code>head.next === null</code>. Code that assumes a second box (<code>head.next.val</code>) crashes, and two-pointer loops must stop at once.</p>
<p><strong>Tiny example:</strong> <code>isPalindrome([1])</code> must be <code>true</code>; <code>removeNthFromEnd([1], 1)</code> must return an empty list; <code>head.next.val</code> on <code>[1]</code> throws.</p>
<p><strong>Fix:</strong> Test every solution against <code>[1]</code> as well as <code>[]</code>. Where needed, start with <code>if (head === null || head.next === null) return head;</code>.</p>

<h3>Head changes</h3>
<p><strong>What goes wrong:</strong> Insert before the head, remove the head, merge, reverse, rotate: all of these can give back a <em>different</em> first box. Code that returns the old <code>head</code>, or forgets to handle "the box to change is the head", returns the wrong list.</p>
<p><strong>Tiny example:</strong> Removing every 7 from <code>7 → 7 → 3</code> must return the box holding 3, not the old head (which is a deleted 7).</p>
<p><strong>Fix:</strong> Use a <a href="#/topic/dsa-words#w-dummy-node">dummy node</a> in front of the head, work from it, and return <code>dummy.next</code> (see the <a href="#/topic/dsa-linked-list#mental-model">Mental Model</a> trace). For reverse and rotate, return the new head the code computed.</p>

<h3>Tail handling</h3>
<p><strong>What goes wrong:</strong> If you keep a <code>tail</code> pointer (to make append O(1)), every change that affects the last box must update it. If you forget, <code>tail</code> still points at a box that is no longer in the list, and the next append hangs the new box off that dead box, where nobody can reach it.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
class TailList {
  constructor(fixed) {
    this.head = null;
    this.tail = null; // the last box, kept so append is O(1)
    this.fixed = fixed; // false = the buggy removeLast below
  }
  append(val) {
    const node = new ListNode(val);
    if (this.head === null) {
      this.head = node;
    } else {
      this.tail.next = node; // hang the new box after the current last box
    }
    this.tail = node;
  }
  removeLast() { // assumes at least 2 boxes, to keep the example short
    let cur = this.head;
    while (cur.next !== this.tail) {
      cur = cur.next; // find the box before the tail
    }
    cur.next = null;
    if (this.fixed) {
      this.tail = cur; // the fix: the box before is the new tail
    }
  }
}
const buggy = new TailList(false);
buggy.append(1);
buggy.append(2);
buggy.removeLast();
buggy.append(3); // goes after the removed box 2, so it can't be reached
console.log(listToArray(buggy.head)); // [1]
const fixed = new TailList(true);
fixed.append(1);
fixed.append(2);
fixed.removeLast();
fixed.append(3);
console.log(listToArray(fixed.head)); // [1, 3]</code></pre>
<p><strong>Fix:</strong> In every method, ask "can this change the last box?" If yes, update <code>tail</code>. Also: when the list becomes empty, set both <code>head</code> and <code>tail</code> to <code>null</code>.</p>

<h3>Cycle traps</h3>
<p>Three separate ways a loop (<a href="#/topic/dsa-words#w-cycle">cycle</a>) bites:</p>
<ul>
  <li><strong>Naïve length traversal on a cyclic list never terminates → infinite loop.</strong> <em>What goes wrong:</em> <code>while (node !== null)</code> never sees <code>null</code> if the list loops. <em>Tiny example:</em> counting the boxes of <code>1 → 2 → 3 → (back to 2)</code> runs forever. <em>Fix:</em> if a loop is possible, check with <code>hasCycle</code> first, or count with a fast/slow pair.</li>
  <li><strong>Always check <code>fast &amp;&amp; fast.next</code> in slow/fast loops.</strong> <em>What goes wrong:</em> on a list with <em>no</em> loop, fast walks off the end. If the guard is missing, <code>fast.next.next</code> or <code>fast.next</code> is read on <code>null</code> and throws a TypeError. (On a list that <em>does</em> loop, fast never reaches <code>null</code>, so this crash only happens on lists without a loop. See Bug 4 for the code.) <em>Fix:</em> <code>while (fast !== null &amp;&amp; fast.next !== null)</code>.</li>
  <li><strong>If you accidentally create a cycle (<code>node.next = node</code>) during a mutation, downstream traversals hang.</strong> <em>What goes wrong:</em> a wrong assignment while re-aiming arrows (for example forgetting <code>head.next = null</code> in the recursive reverse, Bug 5) leaves a loop, and the <em>next</em> function that walks the list hangs. <em>Fix:</em> after any change, make sure the last box ends with <code>next = null</code>; in tests, run <code>hasCycle</code> on your output.</li>
</ul>
<pre><code class="language-js">class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      return true;
    }
  }
  return false;
}
// Counts boxes, but refuses to start on a list with a loop (it would never end)
function safeLength(head) {
  if (hasCycle(head)) {
    return -1;
  }
  let count = 0;
  for (let node = head; node !== null; node = node.next) {
    count++;
  }
  return count;
}
const three = new ListNode(3);
const two = new ListNode(2, three);
const one = new ListNode(1, two);
console.log(safeLength(one)); // 3
three.next = two; // a loop: 3 → 2
console.log(safeLength(one)); // -1
const lonely = new ListNode(9);
lonely.next = lonely; // the accidental self-loop: node.next = node
console.log(hasCycle(lonely)); // true</code></pre>

<h3>Aliasing &amp; accidental sharing</h3>
<p><strong>What goes wrong:</strong> "Aliasing" means two variables or lists point at the same boxes. A box keeps its <code>next</code> arrow wherever you attach it. So attaching a box that is still part of another list drags the rest of that list along: the two lists now share a tail (a Y-shape). Attach a box from <em>later in the same list</em> and you get a loop.</p>
<p><strong>Tiny example:</strong> Move box 4 from list B (<code>3 → 4 → 5</code>) to the end of list A (<code>1 → 2</code>):</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
// BAD: attach box 4 while it still points at 5 and is still inside list B
let listA = buildList([1, 2]);
let listB = buildList([3, 4, 5]);
let boxFour = listB.next;
listA.next.next = boxFour;
console.log(listToArray(listA)); // [1, 2, 4, 5]  (5 came along too)
console.log(listToArray(listB)); // [3, 4, 5]  (B still holds 4: a shared Y-shape)

// GOOD: detach first, then attach
listA = buildList([1, 2]);
listB = buildList([3, 4, 5]);
boxFour = listB.next;
listB.next = boxFour.next; // 1. take 4 out of B: 3 now points at 5
boxFour.next = null; // 2. end the moved box's arrow
listA.next.next = boxFour; // 3. now attach it
console.log(listToArray(listA)); // [1, 2, 4]
console.log(listToArray(listB)); // [3, 5]</code></pre>
<p><strong>Fix:</strong> <strong>Detach before re-attaching:</strong> cut the box (or sub-list) out of where it was, end it with <code>next = null</code>, then attach it. Ask in the interview whether the inputs may share boxes.</p>

<h3>Off-by-one in nth-from-end</h3>
<p><strong>What goes wrong:</strong> An <a href="#/topic/dsa-words#w-off-by-one">off-by-one</a> error is being one step too far or too short. Without a dummy node, removing the nth from the end when n equals the length (that is, removing the head) pushes <code>fast</code> past the last box to <code>null</code>, and <code>fast.next</code> crashes.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function removeNthNoDummy(head, n) {
  let fast = head;
  let slow = head;
  for (let i = 0; i &lt; n; i++) {
    fast = fast.next; // when n equals the length, fast ends up null
  }
  while (fast.next !== null) { // reads null.next: crash
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next;
  return head;
}
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head); // one extra box in front absorbs the off-by-one
  let fast = dummy;
  let slow = dummy;
  for (let i = 0; i &lt; n; i++) {
    fast = fast.next;
  }
  while (fast.next !== null) {
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}
try {
  removeNthNoDummy(buildList([1, 2, 3]), 3);
} catch (error) {
  console.log(error.name); // TypeError
}
console.log(listToArray(removeNthFromEnd(buildList([1, 2, 3]), 3))); // [2, 3]</code></pre>
<p><strong>Fix:</strong> <strong>Use a dummy.</strong> With both pointers starting at the dummy, the gap logic is the same for every n, including removing the head.</p>

<h3>Mutation vs. immutability</h3>
<p><strong>What goes wrong:</strong> "Mutate" means change in place. Most interview solutions (reverse, palindrome, sort) re-aim the arrows of the list you were given. Any other code still holding the old head now sees a changed list. <a href="#/topic/dsa-words#w-immutable">Immutable</a> means "never changed after creation"; if the problem demands that, mutating is wrong.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}
function copyList(head) {
  const dummy = new ListNode(0);
  let tail = dummy;
  for (let node = head; node !== null; node = node.next) {
    tail.next = new ListNode(node.val); // a brand-new box with the same value
    tail = tail.next;
  }
  return dummy.next;
}
const original = buildList([1, 2, 3]);
const reversed = reverseList(original);
console.log(listToArray(original)); // [1]  (the old head is now the last box)
const kept = buildList([1, 2, 3]);
const reversedCopy = reverseList(copyList(kept)); // reverse a copy instead
console.log(listToArray(kept), listToArray(reversedCopy)); // [1, 2, 3] [3, 2, 1]</code></pre>
<p><strong>Fix:</strong> Ask before you start: "Can I modify the input list?" It is almost always yes. If not, copy first (O(n) extra space), or undo your changes before returning (for example, reverse the second half back after a palindrome check).</p>

<h3>Doubly linked list pointer bookkeeping</h3>
<p><strong>What goes wrong:</strong> In a doubly linked list each link is stored twice: <code>A.next = B</code> and <code>B.prev = A</code>. Every insert and remove must update <strong>both</strong> directions. Forget one and the box is gone when you walk forward but still there when you walk backward: a "phantom" box.</p>
<p><strong>Tiny example:</strong> removing B from <code>A ⇄ B ⇄ C</code> with only <code>A.next = C</code> leaves <code>C.prev === B</code>. Walking back from C visits B. Runnable code: Bug 8 below.</p>
<p><strong>Fix:</strong> Write removal as a pair, always: <code>node.prev.next = node.next;</code> and <code>node.next.prev = node.prev;</code>. Dummy boxes at both ends mean <code>node.prev</code> and <code>node.next</code> are never <code>null</code>, so both lines are always safe.</p>

<h3>Even vs. odd length in middle/palindrome</h3>
<p><strong>What goes wrong:</strong> An even-length list has two middles. The two common loop conditions pick different ones, and using the wrong one splits a list unevenly (or loops forever in merge sort).</p>
<ul>
  <li><strong><code>fast &amp;&amp; fast.next</code> → returns the second middle for even length (1→2→3→4 returns 3).</strong></li>
  <li><strong><code>fast.next &amp;&amp; fast.next.next</code> → returns the first middle (returns 2).</strong> It needs a non-empty list, because it reads <code>fast.next</code> straight away.</li>
</ul>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function secondMiddle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow.val;
}
function firstMiddle(head) {
  let slow = head;
  let fast = head;
  while (fast.next !== null &amp;&amp; fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow.val;
}
console.log(secondMiddle(buildList([1, 2, 3, 4])), firstMiddle(buildList([1, 2, 3, 4]))); // 3 2
console.log(secondMiddle(buildList([1, 2, 3, 4, 5])), firstMiddle(buildList([1, 2, 3, 4, 5]))); // 3 3</code></pre>
<p><strong>Fix:</strong> Decide which middle you need and trace a 4-box list. The palindrome check uses the first-middle version, so the second half (the part after <code>slow</code>) is never longer than the first half; the compare loop can then just stop when the second half ends.</p>

<h3>Memory in long-running services</h3>
<p><strong>What goes wrong:</strong> JavaScript frees memory for you: once nothing can reach a box any more, the garbage collector (the engine's automatic clean-up) takes it back. Dropping the head is normally enough to free a whole list. <strong>Unless</strong> something else still holds a box: a Map, a closure (a function that remembers variables from where it was made), an event listener. Then that box, and every box it points to, stays in memory.</p>
<p><strong>Tiny example:</strong> In an LRU cache, evicting a box from the list but not calling <code>map.delete(key)</code> keeps the box alive through the map. The cache's memory grows forever (Bug 6 shows the code).</p>
<p><strong>Fix:</strong> Whenever you remove a box from a structure, remove it from every index (Map, Set, listener list) that points at it.</p>

<h3>Stack overflow on recursion</h3>
<p><strong>What goes wrong:</strong> A recursive function that calls itself once per box (recursive reverse, recursive merge, recursive length) needs one waiting call per box on the <a href="#/topic/dsa-words#w-call-stack">call stack</a>. The stack has a size limit: in Node it is reached somewhere between a few thousand and around 10,000 calls, depending on the function and Node version. Past that you get a <a href="#/topic/dsa-words#w-stack-overflow">stack overflow</a>: "RangeError: Maximum call stack size exceeded". JavaScript engines do not do "tail-call optimisation" (a trick some languages use to re-use one call slot), so writing the call last does not help.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function lengthRecursive(node) {
  if (node === null) {
    return 0;
  }
  return 1 + lengthRecursive(node.next); // one waiting call per box
}
function lengthLoop(head) {
  let count = 0;
  for (let node = head; node !== null; node = node.next) {
    count++;
  }
  return count;
}
const values = [];
for (let i = 0; i &lt; 100000; i++) {
  values.push(i);
}
const longList = buildList(values);
try {
  lengthRecursive(longList);
} catch (error) {
  console.log(error.name); // RangeError
}
console.log(lengthLoop(longList)); // 100000</code></pre>
<p><strong>Fix:</strong> <strong>Convert to a loop</strong> (<a href="#/topic/dsa-words#w-iterative">iterative</a>) for production code or anything that might see long inputs. Recursion is fine when the depth is small: merge sort's splitting is only about log₂ n calls deep (20 for a million boxes).</p>

<h3>Random pointer copy edge cases</h3>
<p><strong>What goes wrong:</strong> In "copy list with random pointer" (<a href="#/topic/dsa-linked-list#ex-3">Example 3</a>), the <code>random</code> arrows can be awkward, and a copy that handles only the "normal" case points copies at originals or crashes.</p>
<ul>
  <li><strong><code>random</code> can point to the node itself.</strong> The copy's <code>random</code> must point at the <em>copy</em> itself, not at the original.</li>
  <li><strong><code>random</code> can be null while <code>next</code> isn't.</strong> Reading <code>cur.random.next</code> without checking crashes.</li>
  <li><strong>Two nodes can share a random target — make sure the clone preserves the same sharing.</strong> Both copies must point at the <em>same</em> copied box, not at two separate copies of it.</li>
</ul>
<p><strong>Tiny example</strong> (this is the Map-based version: a Map from each original box to its copy, which handles all three cases naturally):</p>
<pre><code class="language-js">class RandomNode {
  constructor(val) {
    this.val = val;
    this.next = null;
    this.random = null;
  }
}
function copyWithMap(head) {
  const copyOf = new Map(); // original box -&gt; its copy
  for (let node = head; node !== null; node = node.next) {
    copyOf.set(node, new RandomNode(node.val)); // pass 1: one copy per box
  }
  for (let node = head; node !== null; node = node.next) {
    const copy = copyOf.get(node);
    if (node.next !== null) {
      copy.next = copyOf.get(node.next);
    }
    if (node.random !== null) {
      copy.random = copyOf.get(node.random); // the same original always maps to the same copy
    }
  }
  if (head === null) {
    return null;
  }
  return copyOf.get(head);
}
const a = new RandomNode("a");
const b = new RandomNode("b");
const c = new RandomNode("c");
a.next = b;
b.next = c;
a.random = a; // points to itself
b.random = c; // b and c share a random target (c)
c.random = c;
const copyA = copyWithMap(a);
const copyB = copyA.next;
const copyC = copyB.next;
console.log(copyA.random === copyA); // true  (self-pointer kept, on the copy)
console.log(copyB.random === copyC, copyC.random === copyC); // true true  (sharing kept)
console.log(copyA === a, copyC.random === c); // false false  (no arrows back into the original)
const d = new RandomNode("d");
d.next = new RandomNode("e"); // d.random stays null while d.next is set
console.log(copyWithMap(d).random); // null</code></pre>
<p><strong>Fix:</strong> Check <code>random !== null</code> before following it, and always look copies up through the map (or the woven <code>.next</code> in Example 3), never create a second copy of the same box.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Bug 1: forgetting to save next before mutating</h3>
<p><strong>What goes wrong:</strong> Flipping <code>head.next</code> first destroys the only arrow to the rest of the list. The loop then "moves on" to the box you just pointed back at, which is <code>null</code> on the first round.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
// BAD: loses the rest of the list after the first round
function reverseBad(head) {
  let prev = null;
  while (head !== null) {
    head.next = prev; // OOPS: the arrow to box 2 is gone
    prev = head;
    head = head.next; // this is now prev's old value (null on round 1): the loop ends
  }
  return prev;
}
// FIX: save first
function reverseGood(head) {
  let prev = null;
  while (head !== null) {
    const next = head.next; // save
    head.next = prev; // flip
    prev = head; // step
    head = next;
  }
  return prev;
}
console.log(listToArray(reverseBad(buildList([1, 2, 3])))); // [1]
console.log(listToArray(reverseGood(buildList([1, 2, 3])))); // [3, 2, 1]</code></pre>
<p><strong>Fix:</strong> The first line inside the loop is always <code>const next = curr.next;</code>.</p>

<h3>Bug 2: the missed dummy node</h3>
<p><strong>What goes wrong:</strong> Without a dummy, "remove the head" needs its own separate loop or branch. The code below works, but it has two paths to get right and test, and in harder problems that extra path is where the bug hides.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
// BAD-ish: special-cases head removal with a separate loop
function removeValTwoPaths(head, val) {
  while (head !== null &amp;&amp; head.val === val) {
    head = head.next; // path 1: remove matching boxes at the front
  }
  let cur = head;
  while (cur !== null &amp;&amp; cur.next !== null) { // path 2: everything else
    if (cur.next.val === val) {
      cur.next = cur.next.next;
    } else {
      cur = cur.next;
    }
  }
  return head;
}
// CLEAN: one path, thanks to the dummy
function removeValOnePath(head, val) {
  const dummy = new ListNode(0, head);
  let cur = dummy;
  while (cur.next !== null) {
    if (cur.next.val === val) {
      cur.next = cur.next.next;
    } else {
      cur = cur.next;
    }
  }
  return dummy.next;
}
console.log(listToArray(removeValTwoPaths(buildList([6, 1, 6, 2]), 6))); // [1, 2]
console.log(listToArray(removeValOnePath(buildList([6, 1, 6, 2]), 6))); // [1, 2]</code></pre>
<p><strong>Fix:</strong> Whenever the head might change, start with <code>const dummy = new ListNode(0, head)</code> and return <code>dummy.next</code>.</p>

<h3>Bug 3: cycle-creating merge (really: dropped leftovers)</h3>
<p><strong>What goes wrong:</strong> Two separate mistakes live here.</p>
<ul>
  <li><strong>Forgetting the final "attach the rest" line.</strong> When one list runs out, the loop stops. The leftover boxes of the other list are simply dropped.</li>
  <li><strong>Merging lists that share boxes.</strong> If <code>b</code> is actually part of <code>a</code> (or both were joined to a third list earlier), re-aiming arrows in one changes the other. A box can end up pointing at itself, so the merge, or the next walk, never ends. That is how a merge creates a cycle.</li>
</ul>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function mergeForgetful(a, b) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (a !== null &amp;&amp; b !== null) {
    if (a.val &lt;= b.val) {
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  // forgot: attach what is left of a or b
  return dummy.next;
}
console.log(listToArray(mergeForgetful(buildList([1, 5]), buildList([2, 3])))); // [1, 2, 3]  (5 is lost)</code></pre>
<p><strong>Fix:</strong> End every merge with <code>if (a !== null) { tail.next = a; } else { tail.next = b; }</code>. And make sure the two inputs are separate lists (detach or copy first if they might share boxes).</p>

<h3>Bug 4: slow/fast missing null guard</h3>
<p><strong>What goes wrong:</strong> Fast moves 2 boxes per step. On a list with no loop it will reach the end, and if the loop condition doesn't check <code>fast</code> itself, it reads <code>null.next</code>. On an even-length list fast lands exactly on <code>null</code>; on an odd-length list it lands on the last box. So a check that only looks at <code>fast.next</code> crashes on even lengths.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
// BAD: crashes on even-length lists, where fast becomes null
function middleBad(head) {
  let slow = head;
  let fast = head;
  while (fast.next !== null) { // fast itself may be null here
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow.val;
}
// FIX: guard fast first, then fast.next
function middleGood(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow.val;
}
console.log(middleBad(buildList([1, 2, 3]))); // 2  (odd length happens to work)
try {
  middleBad(buildList([1, 2, 3, 4]));
} catch (error) {
  console.log(error.name); // TypeError
}
console.log(middleGood(buildList([1, 2, 3, 4]))); // 3</code></pre>
<p><strong>Fix:</strong> <code>while (fast !== null &amp;&amp; fast.next !== null)</code>. The first-middle form <code>while (fast.next !== null &amp;&amp; fast.next.next !== null)</code> is also safe, but only if you have already checked that <code>head</code> is not <code>null</code>.</p>

<h3>Bug 5: reverse-recursive without nulling old next</h3>
<p><strong>What goes wrong:</strong> In the recursive reverse, <code>head.next.next = head</code> makes the box after <code>head</code> point back at it. If you forget <code>head.next = null</code>, <code>head</code> still points forward too. Box 1 points at box 2 and box 2 points at box 1: a 2-box loop. Any later walk never ends.</p>
<pre><code class="language-js">class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
// BAD: creates a 2-box loop
function reverseRecBad(head) {
  if (head === null || head.next === null) {
    return head;
  }
  const newHead = reverseRecBad(head.next);
  head.next.next = head;
  // forgot: head.next = null;
  return newHead;
}
const one = new ListNode(1, new ListNode(2));
const two = one.next;
reverseRecBad(one);
console.log(one.next === two, two.next === one); // true true  (1 → 2 → 1 → 2 → ... forever)</code></pre>
<p><strong>Fix:</strong> Always pair the two lines: <code>head.next.next = head;</code> then <code>head.next = null;</code> (the full version is in <a href="#/topic/dsa-linked-list#mechanics">Mechanics</a>).</p>

<h3>Bug 6: LRU map drift</h3>
<p><strong>What goes wrong:</strong> On eviction you remove the box from the list but forget <code>map.delete(evicted.key)</code>. The map and the list now disagree ("drift"). Two things break:</p>
<ul>
  <li><code>get</code> on an evicted key still finds the old box through the map and returns a stale value instead of -1. Worse, it "removes" that box from the list using its old <code>prev</code>/<code>next</code> arrows, which can unhook boxes that are still in the list.</li>
  <li><code>map.size</code> never goes down, so the "is the cache full?" check (<code>map.size === capacity</code>) stops being true, eviction stops, and the cache grows past its capacity.</li>
</ul>
<pre><code class="language-js">class DLLNode {
  constructor(key, val) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}
class BuggyLRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = new DLLNode(null, null);
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
  get(key) {
    const node = this.map.get(key);
    if (node === undefined) {
      return -1;
    }
    this.remove(node);
    this.addFront(node);
    return node.val;
  }
  put(key, value) {
    if (this.map.size === this.capacity) {
      const evicted = this.tail.prev;
      this.remove(evicted);
      // BUG: forgot this.map.delete(evicted.key);
    }
    const node = new DLLNode(key, value);
    this.addFront(node);
    this.map.set(key, node);
  }
  keys() {
    const result = [];
    for (let node = this.head.next; node !== this.tail; node = node.next) {
      result.push(node.key);
    }
    return result;
  }
}
const cache = new BuggyLRUCache(1);
cache.put(1, "a");
cache.put(2, "b"); // evicts key 1 from the list, but the map still has it
console.log(cache.get(1)); // a  (should be -1: a stale value)
cache.put(3, "c"); // map.size is 2, not 1, so nothing is evicted
console.log(cache.map.size, cache.keys()); // 3 [3, 1]  (capacity was 1; key 2 silently fell out of the list)</code></pre>
<p><strong>Fix:</strong> Eviction is always two lines together: <code>const evicted = list.popBack();</code> and <code>map.delete(evicted.key);</code>. That is why each box stores its <code>key</code>.</p>

<h3>Bug 7: building list backward by accident</h3>
<p><strong>What goes wrong:</strong> Putting each new box in <em>front</em> of the list reverses the order.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
// BAD: produces 3 → 2 → 1 instead of 1 → 2 → 3
let backwards = null;
for (const value of [1, 2, 3]) {
  backwards = new ListNode(value, backwards); // each new box goes in front
}
console.log(listToArray(backwards)); // [3, 2, 1]

// FIX: dummy + tail, attaching at the back
const dummy = new ListNode(0);
let tail = dummy;
for (const value of [1, 2, 3]) {
  tail.next = new ListNode(value);
  tail = tail.next;
}
console.log(listToArray(dummy.next)); // [1, 2, 3]</code></pre>
<p><strong>Fix:</strong> Attach at the back with a dummy and a <code>tail</code> pointer. (Building in front is fine when you loop over the values from the end, which is what this page's <code>buildList</code> helper does.)</p>

<h3>Bug 8: doubly linked list — half-removed node</h3>
<p><strong>What goes wrong:</strong> Only one of the two arrows is updated. Walking forward skips the box; walking backward still finds it. Bugs that appear only from one direction are very hard to track down.</p>
<pre><code class="language-js">function makeBox(val) {
  return { val: val, prev: null, next: null };
}
function link(left, right) {
  left.next = right;
  right.prev = left;
}
function walkForward(first) {
  const values = [];
  for (let node = first; node !== null; node = node.next) {
    values.push(node.val);
  }
  return values;
}
function walkBackward(last) {
  const values = [];
  for (let node = last; node !== null; node = node.prev) {
    values.push(node.val);
  }
  return values;
}
const boxA = makeBox("A");
const boxB = makeBox("B");
const boxC = makeBox("C");
link(boxA, boxB);
link(boxB, boxC);
// BAD: remove B by updating only one side
boxB.prev.next = boxB.next;
// forgot: boxB.next.prev = boxB.prev;
console.log(walkForward(boxA)); // ["A", "C"]
console.log(walkBackward(boxC)); // ["C", "B", "A"]  (B is still there going backwards)
// FIX: the second line
boxB.next.prev = boxB.prev;
console.log(walkBackward(boxC)); // ["C", "A"]</code></pre>
<p><strong>Fix:</strong> Removal is always two lines: <code>node.prev.next = node.next</code> and <code>node.next.prev = node.prev</code>.</p>

<h3>Bug 9: O(n²) "linked list = array" reflex</h3>
<p><strong>What goes wrong:</strong> Writing <code>for (let i = 0; i &lt; size; i++) list.get(i)</code> as if it were an array. Each <code>get(i)</code> walks i arrows from the head, so the loop does 0 + 1 + 2 + … + (n − 1) steps, about n² / 2: <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a> (twice the items, four times the work).</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
let arrowSteps = 0; // counts every arrow we follow
function getAt(head, index) {
  let node = head;
  for (let i = 0; i &lt; index; i++) {
    node = node.next;
    arrowSteps++;
  }
  return node;
}
const values = [];
for (let i = 0; i &lt; 1000; i++) {
  values.push(i);
}
const head = buildList(values);
// BAD: O(n²) because getAt walks from the head every time
let total = 0;
for (let i = 0; i &lt; 1000; i++) {
  total += getAt(head, i).val;
}
console.log(total, arrowSteps); // 499500 499500
// FIX: one walk
arrowSteps = 0;
total = 0;
for (let node = head; node !== null; node = node.next) {
  total += node.val;
  arrowSteps++;
}
console.log(total, arrowSteps); // 499500 1000</code></pre>
<p><strong>Fix:</strong> Walk with a pointer: <code>for (let node = head; node !== null; node = node.next)</code>. 1,000 steps instead of about 500,000.</p>

<h3>Bug 10: not detaching when moving nodes</h3>
<p><strong>What goes wrong:</strong> You append list B onto list A with <code>tailOfA.next = headOfB</code>. But B still exists on its own, and some other code still uses it. The two lists now share boxes: changing "B" changes the end of "A" too, without anyone meaning to.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
const listA = buildList([1, 2]);
const listB = buildList([3, 4]);
listA.next.next = listB; // append B onto A, without detaching or copying
listB.next.val = 99; // later, some other code edits "its" list B
console.log(listToArray(listA)); // [1, 2, 3, 99]  (A changed too)

// FIX: if B must stay independent, attach a copy
const listC = buildList([1, 2]);
const listD = buildList([3, 4]);
const dummy = new ListNode(0);
let tail = dummy;
for (let node = listD; node !== null; node = node.next) {
  tail.next = new ListNode(node.val); // new boxes, same values
  tail = tail.next;
}
listC.next.next = dummy.next;
listD.next.val = 99;
console.log(listToArray(listC)); // [1, 2, 3, 4]</code></pre>
<p><strong>Fix:</strong> ALWAYS clarify ownership: either B is handed over (nobody uses B any more), or you copy it before splicing.</p>

<h3>Anti-pattern: arrayifying for "simplicity"</h3>
<p><strong>What goes wrong:</strong> Copying the list into an array, working on the array, and building a new list. It works, but in an interview it is a yellow flag: it shows you avoided thinking in pointers, and it uses O(n) extra memory where O(1) was possible.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
// Works, but uses an extra array of n values and makes n new boxes
function reverseViaArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val);
  }
  values.reverse();
  return buildList(values);
}
console.log(listToArray(reverseViaArray(buildList([1, 2, 3])))); // [3, 2, 1]</code></pre>
<p><strong>Fix:</strong> Use the in-place pointer version (save / flip / step: O(1) extra space). Copying to an array is acceptable when the problem genuinely needs to jump to positions (for example "reorder as first, last, second, second-last…" with a simple solution), and when you say out loud that you are trading O(n) memory for simpler code. Never as a default.</p>

<h3>Anti-pattern: deep recursion in production</h3>
<p><strong>What goes wrong:</strong> A recursive solution that goes one call deeper per box (recursive reverse, recursive merge of two lists) works on interview-sized inputs and crashes on real ones. See "Stack overflow on recursion" above for runnable proof.</p>
<p><strong>Tiny example:</strong> A recursive <code>mergeTwoLists</code> on two lists of 10,000 boxes makes about 20,000 nested calls, which is well past Node's usual limit.</p>
<p><strong>Fix:</strong> Use the loop versions of reverse and merge. Top-down merge sort itself is safe as long as its merge step is a loop: its splitting is only about log₂ n calls deep. For no recursion at all, use bottom-up merge sort, which merges runs of size 1, 2, 4, 8, … with plain loops.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<h3>How to approach a linked list problem in an interview</h3>
<ol>
  <li><strong>Clarify mutability.</strong> Ask: "Can I change the input list?" Almost always yes, but ask.</li>
  <li><strong>Sketch the structure.</strong> Draw 3–4 boxes on the whiteboard or shared doc. Mark the head, the tail, and every pointer variable.</li>
  <li><strong>Pick the building block.</strong> Reverse? Fast and slow? Gap pointer? Dummy node? Say out loud which one and why.</li>
  <li><strong>Walk through the arrow changes before coding.</strong> For anything that re-aims arrows, say "save next, flip, step". The interviewer wants to see you keep track of the arrows under pressure.</li>
  <li><strong>Edge cases first.</strong> Empty list, one box, even and odd length, a loop (if possible). Many candidates code the happy path and forget these.</li>
  <li><strong>Get it right, then improve.</strong> Get an O(n) solution working, then ask "can I do this in O(1) extra space?" For linked lists the answer is often yes.</li>
</ol>

<h3>Top 15 classic problems and which pattern they use</h3>
<table>
  <thead><tr><th>Problem</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>Reverse linked list</td><td>Save / flip / step. Expect to write both the loop and the recursive version.</td></tr>
    <tr><td>Reverse linked list II (only positions m to n)</td><td>Dummy node + reverse just that stretch</td></tr>
    <tr><td>Reverse nodes in k-group</td><td>Recursion, or a stack of k boxes (<a href="#/topic/dsa-linked-list#ex-2">Example 2</a>)</td></tr>
    <tr><td>Detect a cycle / find where it starts</td><td>Floyd's tortoise and hare (fast and slow)</td></tr>
    <tr><td>Find the middle node</td><td>Fast and slow</td></tr>
    <tr><td>Remove nth from end</td><td>Gap pointer + dummy</td></tr>
    <tr><td>Merge two sorted lists</td><td>Dummy + tail pointer</td></tr>
    <tr><td>Merge k sorted lists</td><td>A min-<a href="#/topic/dsa-words#w-heap">heap</a> (always hands you the smallest of the k fronts), or merge in pairs like merge sort</td></tr>
    <tr><td>Sort a linked list</td><td>Merge sort (<a href="#/topic/dsa-linked-list#ex-5">Example 5</a>)</td></tr>
    <tr><td>Palindrome linked list</td><td>Find middle + reverse second half + compare</td></tr>
    <tr><td>Intersection of two lists</td><td>Pair walk with list switching, or line up by length difference</td></tr>
    <tr><td>Add two numbers</td><td>Dummy + carry (<a href="#/topic/dsa-linked-list#ex-4">Example 4</a>)</td></tr>
    <tr><td>Copy list with random pointer</td><td>Weave copies in, or a Map from original to copy (<a href="#/topic/dsa-linked-list#ex-3">Example 3</a>)</td></tr>
    <tr><td>LRU cache</td><td>Doubly linked list + hash map (<a href="#/topic/dsa-linked-list#ex-1">Example 1</a>)</td></tr>
    <tr><td>Flatten a multilevel doubly linked list</td><td>Stack-based depth-first walk (<a href="#/topic/dsa-linked-list#ex-6">Example 6</a>)</td></tr>
  </tbody>
</table>

<h3>Patterns to recognize on sight</h3>
<ul>
  <li><strong>"Find the middle / kth from the end / does it have a cycle"</strong> → two pointers.</li>
  <li><strong>"Reverse / partition / reorder a list"</strong> → re-aiming arrows with <code>prev</code>, <code>curr</code>, <code>next</code>, plus a dummy node.</li>
  <li><strong>"Process two lists together"</strong> → a dummy node, and walk both until the shorter one runs out.</li>
  <li><strong>"O(1) eviction / promotion / access"</strong> → doubly linked list + hash map (the LRU shape).</li>
  <li><strong>"Sort in O(n log n) without an extra array"</strong> → merge sort on the list itself.</li>
  <li><strong>"You keep needing item number k"</strong> → step back: maybe an array is the right structure, and the interviewer wants you to notice that.</li>
</ul>

<h3>What FAANG interviewers grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they're checking</th></tr></thead>
  <tbody>
    <tr><td>Pointer hygiene</td><td>You save <code>next</code>, never read <code>.next</code> of <code>null</code>, and notice when two variables point at the same box</td></tr>
    <tr><td>Use of dummy nodes</td><td>You spot when the head can change and reach for a dummy</td></tr>
    <tr><td>Edge case listing</td><td>Empty, one box, odd/even length, a loop: named before you are asked</td></tr>
    <tr><td>Recursion vs. loop choice</td><td>You can write both and explain the stack-overflow risk</td></tr>
    <tr><td>Combining pieces</td><td>LRU cleanly combines a doubly linked list and a hash map; reverse-k-group combines reverse and recursion</td></tr>
    <tr><td>Communication</td><td>You say what each pointer holds as you go, and draw before coding</td></tr>
  </tbody>
</table>

<h3>"Dry-run trace" — the demo move</h3>
<p>After you finish coding, take 30 seconds to run your solution on a 3-box example <em>out loud</em>, naming what every pointer holds at each round, exactly like the traces on this page. It catches off-by-ones and missing null checks, and it shows the interviewer you check your own work.</p>

<h3>Mobile / React Native angle</h3>
<ul>
  <li><strong>Navigation history</strong> behaves like a doubly linked list: back and forward from where you are. (React Navigation itself stores each stack's routes in an array, but the "move back and forth one step" model is the same.)</li>
  <li><strong>FlatList / VirtualizedList</strong> render only the rows near the screen (a "window"). Their internals track rows by index, using arrays: when you mostly need "item number k", arrays win, which is the lesson from What &amp; Why.</li>
  <li><strong>Queues of pending work</strong> (for example messages between JavaScript and native code) are first-in, first-out lines, a natural fit for a linked list or a ring buffer. In the New Architecture (TurboModules / Fabric) this traffic goes through JSI and C++ structures instead of the old bridge's batched message queue.</li>
  <li><strong>Animated value chains:</strong> <code>Animated.add</code> and <code>Animated.multiply</code> link values into a graph, not strictly a linked list, but "follow the references from box to box" is the same way of thinking.</li>
</ul>

<h3>One-liner answers to common interviewer follow-ups</h3>
<ul>
  <li><em>"Why a doubly linked list for LRU?"</em> → "To remove any node in O(1) when I move it to the front. That needs its <code>prev</code> pointer; a singly linked list would need an O(n) walk to find the node before it."</li>
  <li><em>"Why merge sort, not quicksort, on a linked list?"</em> → "Quicksort's partition jumps between positions, which a list can't do cheaply. Merge sort only walks forward, and it is stable."</li>
  <li><em>"Why does Floyd's work?"</em> → "Once both pointers are in the loop, fast gains exactly one box per step on slow. The gap shrinks by one each step, so fast can't jump over slow. They meet within one lap."</li>
  <li><em>"When would you pick an array over a linked list?"</em> → "Almost always in real product code: arrays are faster to loop over because their items sit side by side in memory. I'd use a linked list when I hold node references and need O(1) insert or remove in the middle."</li>
</ul>

<div class="qa-block">
  <div class="qa-question">Q1. Reverse a singly linked list in place.</div>
  <div class="qa-answer">
    <p>Walk the list with <code>prev</code> and <code>curr</code>. Each round: save <code>next</code>, flip <code>curr.next</code> to point at <code>prev</code>, then step both forward. When <code>curr</code> is <code>null</code>, <code>prev</code> is the new head. O(n) time, O(1) extra space.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function reverse(head) {
  let prev = null; // the reversed part so far
  let curr = head;
  while (curr !== null) {
    const next = curr.next; // save before changing anything
    curr.next = prev; // flip
    prev = curr; // step
    curr = next;
  }
  return prev;
}
console.log(listToArray(reverse(buildList([1, 2, 3, 4])))); // [4, 3, 2, 1]
console.log(reverse(null)); // null</code></pre>
    <p>The recursive version also works, but it keeps one waiting call per box: O(n) stack space. On a long list it overflows the call stack, because JavaScript engines (V8 included) don't do tail-call optimisation.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function reverseRecursive(head) {
  if (head === null || head.next === null) {
    return head; // 0 or 1 box: already reversed
  }
  const newHead = reverseRecursive(head.next); // reverse the rest
  head.next.next = head; // the next box points back at head
  head.next = null; // head becomes the last box
  return newHead;
}
console.log(listToArray(reverseRecursive(buildList([1, 2, 3, 4])))); // [4, 3, 2, 1]</code></pre>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q2. What is a dummy head node and when do you use one?</div>
  <div class="qa-answer">
    <p>A dummy (also called a <a href="#/topic/dsa-words#w-sentinel">sentinel</a>) is a throwaway box placed before the real head. Now the head is just "the next of something", like every other box. Use it whenever the head can change: deleting the head, inserting before it, merging two lists, removing the nth box from the end. It removes the "is this the first box?" branch. At the end, return <code>dummy.next</code>.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function removeElements(head, unwanted) {
  const dummy = new ListNode(0, head); // the box before the head
  let cur = dummy;
  while (cur.next !== null) {
    if (cur.next.val === unwanted) {
      cur.next = cur.next.next; // same line removes the head or any other box
    } else {
      cur = cur.next;
    }
  }
  return dummy.next; // the real (possibly new) head
}
console.log(listToArray(removeElements(buildList([6, 6, 1, 6, 2]), 6))); // [1, 2]</code></pre>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q3. How do you detect a cycle in a linked list, and find where it starts?</div>
  <div class="qa-answer">
    <p>Floyd's tortoise and hare. Both pointers start at <code>head</code>; slow moves one box, fast moves two, and the loop is guarded by <code>fast &amp;&amp; fast.next</code>. If fast reaches <code>null</code>, there is no cycle. If they land on the same box, there is one: inside the loop fast gains one box per step, so it must catch slow.</p>
    <p>To find the start, use the Mental Model example <code>1 → 2 → 3 → 4 → 5 → (back to 3)</code>, where the pointers met at box 4:</p>
    <ul>
      <li><code>a</code> = steps from the head to the loop's start = 2 (1 → 2 → 3). <code>b</code> = steps from the loop's start to the meeting box, counted from the loop's start = 1 (3 → 4). <code>L</code> = boxes in the loop = 3 (boxes 3, 4, 5).</li>
      <li>Slow walked <code>a + b</code> = 3 steps; fast walked twice that, 6. Since they stand on the same box, fast's extra 3 steps must be whole laps: here exactly one lap (<code>L</code> = 3). In general, <code>a + b</code> is a multiple of <code>L</code>.</li>
      <li>So from the meeting box, walking <code>a</code> = 2 more steps (4 → 5 → 3) completes those laps and lands on the loop's start.</li>
      <li>A pointer starting at the head also reaches the loop's start after <code>a</code> steps. Reset one pointer to the head, move both one step at a time, and they meet there.</li>
    </ul>
    <p>O(n) time and O(1) space, versus O(n) space for a Set of visited boxes.</p>
<pre><code class="language-js">class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function detectCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) {
    slow = slow.next; // 1 step
    fast = fast.next.next; // 2 steps
    if (slow === fast) { // they met: there is a loop
      let fromHead = head;
      while (fromHead !== slow) { // both move 1 step until they meet
        fromHead = fromHead.next;
        slow = slow.next;
      }
      return fromHead; // the loop's first box
    }
  }
  return null; // fast ran off the end: no loop
}
const nodes = [1, 2, 3, 4, 5].map((value) =&gt; new ListNode(value));
for (let i = 0; i &lt; nodes.length - 1; i++) {
  nodes[i].next = nodes[i + 1];
}
nodes[4].next = nodes[1]; // 5 points back at 2
console.log(detectCycle(nodes[0]).val); // 2
nodes[4].next = null;
console.log(detectCycle(nodes[0])); // null</code></pre>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q4. What are the classic null-pointer and off-by-one traps in linked-list code?</div>
  <div class="qa-answer">
    <p><strong>Null traps:</strong></p>
    <ul>
      <li>Re-aiming <code>node.next</code> before saving where you were going: you lose the rest of the list.</li>
      <li>A slow/fast loop without the <code>fast &amp;&amp; fast.next</code> guard: it throws a TypeError on even-length lists, where fast lands on <code>null</code>.</li>
    </ul>
    <p><strong>Off-by-one traps:</strong></p>
    <ul>
      <li>nth from the end: does the gap pointer move n or n + 1 steps ahead? With both pointers starting at a dummy, it is exactly n, and removing the head just works.</li>
      <li>Find-middle: <code>fast &amp;&amp; fast.next</code> gives the second middle, <code>fast.next &amp;&amp; fast.next.next</code> gives the first.</li>
    </ul>
    <p>Always test against <code>[]</code>, a single box, and both even and odd lengths; use a dummy head when the head can be removed.</p>
<pre><code class="language-js">// Setup (the same in every block): the box, plus "array -&gt; list" and "list -&gt; array"
class ListNode {
  constructor(val, next = null) {
    this.val = val; // the value in this box
    this.next = next; // the arrow to the next box; null means "end of the list"
  }
}
function buildList(values) {
  let head = null;
  for (let i = values.length - 1; i &gt;= 0; i--) {
    head = new ListNode(values[i], head); // put each value in front, last value first
  }
  return head;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.val); // follow the arrows, collecting each value
  }
  return values;
}
function middleNode(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) { // the null guard
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head); // makes "remove the head" an ordinary case
  let fast = dummy;
  let slow = dummy;
  for (let i = 0; i &lt; n; i++) {
    fast = fast.next; // a gap of exactly n
  }
  while (fast.next !== null) {
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}
console.log(middleNode(null)); // null
console.log(middleNode(buildList([1, 2, 3, 4])).val); // 3
console.log(listToArray(removeNthFromEnd(buildList([1, 2, 3]), 3))); // [2, 3]
console.log(listToArray(removeNthFromEnd(buildList([1]), 1))); // []</code></pre>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q5. Design an LRU cache with O(1) get and put.</div>
  <div class="qa-answer">
    <p>Combine a hash map from key to box with a doubly linked list ordered by how recently each key was used.</p>
    <ul>
      <li><code>get</code> looks the box up in the map, unhooks it, and moves it to the most-recent end.</li>
      <li><code>put</code> updates or inserts the box at the most-recent end. When over capacity, it removes the least-recent box from the other end.</li>
    </ul>
    <p>The doubly linked list is what makes unhooking any box O(1), because the box has its <code>prev</code> pointer. Removal must update both <code>prev.next</code> and <code>next.prev</code>. The classic bug is forgetting <code>map.delete(key)</code> on eviction, which keeps evicted boxes alive and lets the cache grow past its capacity. Both operations are O(1) on average (the Map lookup is O(1) expected).</p>
<pre><code class="language-js">class DLLNode {
  constructor(key, val) {
    this.key = key; // needed to delete the map entry on eviction
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key -&gt; box
    this.head = new DLLNode(null, null); // dummy: most recent side
    this.tail = new DLLNode(null, null); // dummy: least recent side
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
    node.prev.next = node.next; // update BOTH neighbours
    node.next.prev = node.prev;
  }
  get(key) {
    const node = this.map.get(key);
    if (node === undefined) {
      return -1;
    }
    this.remove(node);
    this.addFront(node); // now the most recently used
    return node.val;
  }
  put(key, value) {
    const existing = this.map.get(key);
    if (existing !== undefined) {
      existing.val = value;
      this.remove(existing);
      this.addFront(existing);
      return;
    }
    if (this.map.size === this.capacity) {
      const evicted = this.tail.prev; // least recently used
      this.remove(evicted);
      this.map.delete(evicted.key); // never forget this line
    }
    const node = new DLLNode(key, value);
    this.addFront(node);
    this.map.set(key, node);
  }
}
const cache = new LRUCache(2);
cache.put("a", 1);
cache.put("b", 2);
cache.get("a"); // "a" is now the most recent
cache.put("c", 3); // full: evicts "b"
console.log(cache.get("b"), cache.get("a"), cache.get("c")); // -1 1 3
console.log(cache.map.size); // 2</code></pre>
  </div>
</div>
` },

  ]
});
