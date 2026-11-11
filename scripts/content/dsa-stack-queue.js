// Stack & Queue, rewritten in plain English (Nov 2026). Main pictures: a pile of plates in a
// canteen (stack: take from the top) and the line at a metro ticket counter (queue: first come,
// first served). DSA words link to the glossary at #/topic/dsa-words#w-<slug>.
window.PREP_SITE.registerTopic({
  id: "dsa-stack-queue",
  module: "dsa",
  title: "Stack & Queue",
  estimatedReadTime: "40 min",
  tags: ["dsa","stack","queue","deque","monotonic-stack","lifo","fifo"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">A <a href="#/topic/dsa-words#w-stack">stack</a> is a pile of plates: you add and take from the top, so the <strong>most recent</strong> item comes out first. A <a href="#/topic/dsa-words#w-queue">queue</a> is a ticket line: the <strong>first</strong> to join is the first served. Use a stack to "match the most recent thing", a queue to "handle things in arrival order", and a <a href="#/topic/dsa-words#w-monotonic-stack">monotonic stack</a> when the slow way keeps looking back for a bigger or smaller item: it turns <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a> into <a href="#/topic/dsa-words#w-o-n">O(n)</a>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Stack = LIFO</strong> (last in, first out): matching brackets or HTML tags, undo/redo, monotonic stack, <a href="#/topic/dsa-words#w-dfs">DFS</a> (go deep first). <strong>Queue = FIFO</strong> (first in, first out): <a href="#/topic/dsa-words#w-bfs">BFS</a> (go level by level), task scheduling.</li>
    <li><strong>A JS stack is a plain array:</strong> <code>push</code> to add, <code>pop</code> to remove, <code>arr.at(-1)</code> to peek at the top. <code>pop</code> and peek are <a href="#/topic/dsa-words#w-o-1">O(1)</a> (same small cost at any size). <code>push</code> is <a href="#/topic/dsa-words#w-amortized">amortized</a> O(1): now and then the array grows and copies itself, but the total over many pushes stays O(1) each.</li>
    <li><strong>Never use <code>arr.shift()</code> as a dequeue:</strong> it moves every other item down one place, so it is O(n). For an O(1) queue, keep a <code>head</code> <a href="#/topic/dsa-words#w-index">index</a> that marks the front, or use the two-stack trick, or a <a href="#/topic/dsa-words#w-linked-list">linked list</a>.</li>
    <li><strong>Two-stack queue is amortized O(1):</strong> one pour from the inbox stack to the outbox stack can cost O(n), but each item is poured only once, so any n operations cost O(n) in total. That total is guaranteed, not a lucky average.</li>
    <li><strong>A <a href="#/topic/dsa-words#w-deque">deque</a> is O(1) at both ends.</strong> JS has none built in (<code>unshift</code>/<code>shift</code> are O(n)), so build one from a doubly linked list or a circular buffer (ring array). An array plus a <code>front</code> index is enough when you only remove from the front, as in sliding max.</li>
    <li><strong>A monotonic stack solves "next greater / next smaller" in O(n):</strong> each item is pushed once and popped at most once. "Next greater" → values on the stack go <em>down</em> from bottom to top. "Next smaller" → they go <em>up</em>.</li>
    <li><strong>Store indexes, not values, in a monotonic stack:</strong> you need the position to work out a width or a distance (histogram, daily temperatures). The value is always <code>nums[index]</code>.</li>
    <li><strong>Recursion = stack:</strong> any recursive DFS can become a loop with your own array as the stack. Chrome and Node do not do tail-call optimisation (TCO), so very deep <a href="#/topic/dsa-words#w-recursion">recursion</a> crashes with a <a href="#/topic/dsa-words#w-stack-overflow">stack overflow</a>. Your own array lives in normal memory and does not.</li>
    <li><strong>Iterative DFS pushes the right child, then the left,</strong> so the left one is popped first, because a stack hands back the last thing pushed. That gives preorder: node, then its left side, then its right side.</li>
    <li><strong>BFS: mark a node <a href="#/topic/dsa-words#w-visited">visited</a> when you ENQUEUE it, not when you dequeue it.</strong> Otherwise the same node gets queued once from every path that reaches it, and the queue swells.</li>
    <li><strong>BFS finds the <a href="#/topic/dsa-words#w-shortest-path">shortest path</a> only when every step costs the same</strong> (unweighted). It costs O(V + E): V nodes, E connections. Different step costs → Dijkstra with a <a href="#/topic/dsa-words#w-heap">heap</a>. Costs of only 0 or 1 → "0-1 BFS" with a deque (cost-0 steps go to the front, cost-1 to the back).</li>
    <li><strong>Max of every <a href="#/topic/dsa-words#w-window">window</a> = <a href="#/topic/dsa-words#w-monotonic-deque">monotonic deque</a> of indexes:</strong> the front holds the window's biggest. Remove the front once its index has slid out of the window.</li>
    <li><strong>Always check for empty before you pop:</strong> <code>[].pop()</code> gives <code>undefined</code>, not an error. Guard with <code>if (stack.length === 0) return false;</code> first.</li>
    <li><strong>The empty string is a valid bracket string</strong> (nothing is unmatched). A stack that still has items at the end means something was never closed.</li>
    <li><strong>Min stack:</strong> push onto the min-helper when the new value is <code>&lt;=</code> the current min (not just <code>&lt;</code>), or store value + count pairs, so repeated minimums are tracked.</li>
  </ul>
  <h4>Complexity &amp; when to reach for it</h4>
  <ul>
    <li><strong>Time:</strong> stack push/pop and queue enqueue/dequeue: O(1) (push amortized). Monotonic stack and sliding-window deque: O(n) in total. BFS: O(V + E).</li>
    <li><strong>Space:</strong> O(n) for the structure itself. BFS holds up to a whole level of nodes in the queue, plus an O(V) visited set.</li>
    <li><strong>The signal:</strong> "most recent" / nesting / balanced symbols / next greater or smaller → stack (monotonic if the slow way loops backward looking for a match). Level by level / fewest steps in an unweighted graph / flood fill → BFS with a queue. Max or min of every window → monotonic deque. Recursion that might go very deep → a loop with your own stack.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Using <code>arr.shift()</code> as a dequeue quietly turns your O(V + E) BFS into O(V² + E).</strong> Each <code>shift()</code> moves every waiting item down one place, and BFS dequeues V times. Use a <code>head</code> index (or a two-stack queue) instead. Two other classic slips: in BFS, mark visited on <em>enqueue</em>, or the same node is queued from several paths; and in a monotonic stack, store <em>indexes</em>, not values, so you can work out widths and distances.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"A stack is for 'match the most recent', a queue is for 'process in order'. When the brute force scans backward to find a match, a monotonic stack usually brings it down to O(n), because each item is pushed once and popped at most once."</div>
  <div class="revision-say">"In JavaScript I don't use <code>arr.shift()</code> for a queue, because it's O(n). I keep a head index, or use two stacks, for amortized O(1)."</div>
  <div class="revision-say">"In BFS I mark a node visited when I enqueue it, not when I dequeue it, so it can't be queued twice from different paths."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The pattern: a pile of plates and a ticket line</h3>
<p>Picture the plate pile in an office canteen. Washed plates are put on <strong>top</strong>. Each person takes a plate from the <strong>top</strong>. The plate put down last is the first one taken. Nobody digs out the bottom plate.</p>
<p>That pile is a <a href="#/topic/dsa-words#w-stack">stack</a>. Its rule is called <strong>LIFO</strong>: last in, first out. A stack has three moves:</p>
<ul>
  <li><strong>push</strong>: put an item on top.</li>
  <li><strong>pop</strong>: take the top item off and hand it back.</li>
  <li><strong>peek</strong>: look at the top item without taking it.</li>
</ul>
<p>Now picture the line at a metro ticket counter. New people join at the <strong>back</strong>. The person at the <strong>front</strong> is served and leaves. Whoever came first is served first.</p>
<p>That line is a <a href="#/topic/dsa-words#w-queue">queue</a>. Its rule is <strong>FIFO</strong>: first in, first out. Its two main moves are <strong>enqueue</strong> (join at the back) and <strong>dequeue</strong> (leave from the front).</p>
<p>In JavaScript, both are usually a plain <a href="#/topic/dsa-words#w-array">array</a>. The only question is <em>which end</em> you add to and which end you take from.</p>
<div class="diagram"><pre>STACK (plates)                 QUEUE (ticket line)
add here, take here            take here            add here
        ↓↑                     ↓                    ↓
      [ 3 ]  ← top             front [ 1, 2, 3 ] back
      [ 2 ]
      [ 1 ]  ← bottom          1 joined first, so 1 leaves first
3 was added last, so 3 leaves first</pre></div>

<h3>A real problem: is this bracket string balanced?</h3>
<p>A code editor highlights unmatched brackets. Given a string like <code>"([]{})"</code>, every opening bracket must be closed by the <em>same kind</em>, in the right order. <code>"([]{})"</code> is fine. <code>"([)]"</code> is not: the <code>(</code> is closed while the <code>[</code> inside it is still open.</p>
<p>The key fact: a closing bracket must match the <strong>most recent</strong> bracket that is still open. "Most recent" is the word that says <em>stack</em>.</p>

<h3>The slow way, counted in steps</h3>
<p>A natural first idea: keep deleting any pair like <code>"()"</code>, <code>"[]"</code> or <code>"{}"</code> until nothing changes. If the string ends up empty, it was balanced.</p>
<pre><code class="language-js">function isBalancedSlow(text) {
  let current = text;
  while (true) {
    let shorter = current.replace("()", ""); // delete one "()" pair, if there is one
    shorter = shorter.replace("[]", "");
    shorter = shorter.replace("{}", "");
    if (shorter === current) {
      break; // nothing was deleted on this pass, so stop
    }
    current = shorter;
  }
  return current === ""; // balanced only if everything got deleted
}
console.log(isBalancedSlow("([]{})")); // true
console.log(isBalancedSlow("([)]")); // false</code></pre>
<p>It is correct, but count the work. Each pass reads the string up to three times and deletes only a few characters. For a string of n characters like <code>"((((…))))"</code>, it needs about n / 2 passes, and each pass reads a string that is still long.</p>
<ul>
  <li>6 characters: 3 passes. No problem.</li>
  <li>10,000 characters: 5,000 passes over a string that is thousands of characters long. That is <strong>tens of millions of character reads</strong> (about 60 million here).</li>
</ul>
<p>The work grows with n × n. In <a href="#/topic/dsa-words#w-big-o">Big-O</a> language (a way to say how work grows as the input grows) this is <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a>: twice the characters, four times the work.</p>

<h3>What the stack fixes</h3>
<p>Read the string <strong>once</strong>, left to right. Keep the brackets that are still open on a stack, like plates:</p>
<ul>
  <li>An opening bracket: push it on top.</li>
  <li>A closing bracket: pop the top. It must be the matching opener. If the stack is empty, or the top is the wrong kind, the string is broken.</li>
  <li>At the end, the stack must be empty. A leftover opener was never closed.</li>
</ul>
<div class="diagram"><pre>text = "([)]"

still OK?  char  what happens                       stack after
yes        (     opener: push                       [ ( ]
yes        [     opener: push                       [ ( [ ]
NO         )     pop "[" ... but ")" needs "("      stop
Answer: false. One read of each character; no second pass.</pre></div>
<p>Each character is pushed at most once and popped at most once. For 10,000 characters that is about 20,000 small steps instead of tens of millions. The work grows in step with the input: <a href="#/topic/dsa-words#w-o-n">O(n)</a>, "twice the characters, twice the work".</p>

<h3>A second real problem: a printer queue</h3>
<p>An office printer gets jobs: <code>"report.pdf"</code>, then <code>"photo.png"</code>, then <code>"notes.txt"</code>. It must print them in the order they arrived. That is a queue.</p>
<p>The obvious JavaScript is <code>jobs.push(job)</code> to join and <code>jobs.shift()</code> to take the front. But <code>shift()</code> has a hidden cost. It removes item 0 and then moves <em>every other item</em> down one place, so the array starts at 0 again:</p>
<pre><code class="language-js">const printQueue = ["report.pdf", "photo.png", "notes.txt"];
const first = printQueue.shift(); // takes item 0, then moves the other 2 down one place
console.log(first); // report.pdf
console.log(printQueue); // [ 'photo.png', 'notes.txt' ]</code></pre>
<p>Moving 2 items is nothing. But with 100,000 jobs waiting, the first <code>shift()</code> moves 99,999 items, the next moves 99,998, and so on. Serving them all is about <strong>5 billion moves</strong>: O(n²) again. (JavaScript engines sometimes speed <code>shift()</code> up, but the language makes no promise, so treat it as O(n).)</p>
<p>The fix is to <em>not move anyone</em>. Keep a number called <code>head</code>, the <a href="#/topic/dsa-words#w-index">index</a> (position) of the person at the front. To serve someone, read <code>items[head]</code> and add 1 to <code>head</code>. That is like the counter clerk calling "next!" instead of everyone shuffling forward. 100,000 jobs → 100,000 small steps. The Mechanics section has the full code.</p>

<h3>Stack — LIFO</h3>
<p>Last in, first out. <code>push</code> adds on top; <code>pop</code> removes from the top. Use it whenever you need to "remember the most recent thing":</p>
<ul>
  <li><strong>Undo / redo</strong> in an editor: undo takes back your <em>latest</em> change.</li>
  <li><strong>Function calls:</strong> when a function calls another, the inner one must finish first. JavaScript keeps them on the <a href="#/topic/dsa-words#w-call-stack">call stack</a>.</li>
  <li><strong>Balanced symbols:</strong> brackets, HTML tags.</li>
</ul>
<p>In JS, a stack is an array with <code>push</code> and <code>pop</code>. <code>pop</code> is <a href="#/topic/dsa-words#w-o-1">O(1)</a>: the same small cost no matter how big the stack is. <code>push</code> is <a href="#/topic/dsa-words#w-amortized">amortized</a> O(1): once in a while the array is full and copies itself into a bigger block of memory, which costs O(n) that one time. But the copies get rarer as it grows, so the total over n pushes is still O(n), so each push costs O(1) when spread over the whole run.</p>

<h3>Queue — FIFO</h3>
<p>First in, first out. Enqueue adds at the back; dequeue removes from the front. Use it when the order of arrival matters: <a href="#/topic/dsa-words#w-bfs">BFS</a> (explained below), task queues, message queues.</p>
<p>The JS trap: <code>arr.shift()</code> is O(n), as the printer example showed. For an O(1) queue, use one of:</p>
<ul>
  <li>a <strong>head index</strong> that marks the front (simplest);</li>
  <li><strong>two stacks</strong> (an "inbox" and an "outbox");</li>
  <li>a <a href="#/topic/dsa-words#w-linked-list">linked list</a>: a chain of small objects called <a href="#/topic/dsa-words#w-node">nodes</a>, each holding a value and a link to the next one. Removing the first node only changes one link.</li>
</ul>

<h3>Deque — both ends O(1)</h3>
<p>A <a href="#/topic/dsa-words#w-deque">deque</a> (say "deck", short for double-ended queue) lets you add and remove at <strong>both</strong> ends: <code>pushFront</code>, <code>pushBack</code>, <code>popFront</code>, <code>popBack</code>, all O(1). Think of a metro coach with a door at each end: people can get on or off at either door.</p>
<p>It powers the <a href="#/topic/dsa-words#w-monotonic-deque">monotonic deque</a> used for "maximum of every window".</p>
<p>JS has no built-in deque. <code>arr.push</code> and <code>arr.pop</code> (the back end) are O(1), but <code>arr.unshift</code> and <code>arr.shift</code> (the front end) are O(n). So build one from a doubly linked list (each node links to the next <em>and</em> the previous one) or a circular buffer (a "ring array" whose ends wrap around, so both ends can grow in O(1)). An array plus a <code>front</code> index is enough when you only remove from the front, as in sliding max, but it can't add at the front in O(1), which 0-1 BFS needs.</p>

<h3>Monotonic stack</h3>
<p><a href="#/topic/dsa-words#w-monotonic">Monotonic</a> means "only goes one way": only up, or only down. A <a href="#/topic/dsa-words#w-monotonic-stack">monotonic stack</a> is a stack whose values, read from bottom to top, only go down (or only go up). As you read each new item, you pop every item that would break that order, then push the new one.</p>
<p>Real problem: a weather app shows daily temperatures <code>[73, 74, 75, 71, 69, 72, 76, 73]</code>. For each day, how many days until a warmer one? The slow way looks forward from every day: up to n × n checks, about 50 million for 10,000 days. The monotonic stack does it in one pass, because each day is pushed once and popped at most once: about 20,000 steps.</p>
<p>It solves:</p>
<ul>
  <li>Next greater / next smaller element.</li>
  <li>Daily temperatures.</li>
  <li>Largest rectangle in a histogram (a bar chart).</li>
  <li>Trapping rain water (another way besides <a href="#/topic/dsa-words#w-two-pointers">two pointers</a>).</li>
</ul>
<p>Time: O(n), because each item is pushed once and popped at most once.</p>

<h3>Why "recursion = stack"</h3>
<p><a href="#/topic/dsa-words#w-recursion">Recursion</a> is a function calling itself on a smaller piece of the problem. Each call waits for the inner call to finish, so JavaScript keeps the waiting calls on the <a href="#/topic/dsa-words#w-call-stack">call stack</a>: a stack of "where was I?" notes, one per call.</p>
<p>So any recursive <a href="#/topic/dsa-words#w-dfs">DFS</a> (depth-first search: go as deep as you can down one path before trying the next) on a <a href="#/topic/dsa-words#w-tree">tree</a> can be rewritten as a plain loop that keeps its own array as the stack. Writing it as a loop is called <a href="#/topic/dsa-words#w-iterative">iterative</a>. That helps when:</p>
<ul>
  <li><strong>The recursion is very deep.</strong> The call stack is small (roughly 10,000 calls in Node). Past that you get a <a href="#/topic/dsa-words#w-stack-overflow">stack overflow</a> crash. Your own array can hold millions of items.</li>
  <li><strong>You want to pause and resume</strong> a walk, for example in an iterator that hands out one tree node at a time.</li>
  <li><strong>Chrome and Node don't do tail-call optimisation.</strong> Some languages reuse the same stack slot when a function's very last step is calling itself (a "tail call"). Chrome and Node don't, so deep recursion is dangerous even in that shape.</li>
</ul>

<h3>BFS via queue</h3>
<p><a href="#/topic/dsa-words#w-bfs">BFS</a> (breadth-first search) explores in rings, like ripples from a stone dropped in water: first everything 1 step from the start, then everything 2 steps away, and so on. A queue gives exactly that order, because nodes found earlier are handled earlier.</p>
<p>It is used for: reading a tree level by level, the fewest steps between two places in an unweighted <a href="#/topic/dsa-words#w-graph">graph</a> (a network of places, called <a href="#/topic/dsa-words#w-vertex">vertices</a> or nodes, joined by connections called <a href="#/topic/dsa-words#w-edge">edges</a>), and "flood fill" (colouring in a whole connected area, like the paint-bucket tool).</p>
<p>The loop: put the start in the queue. While the queue is not empty: take the front, handle it, and add its unseen neighbours to the back. A <a href="#/topic/dsa-words#w-visited">visited</a> set stops you going round in circles.</p>

<h3>Why deque for BFS variants</h3>
<p>Some graphs have edges that cost either 0 or 1 (for example, "walking within a station is free, each train ride costs 1"). Plain BFS can't handle that, but a deque can: when you reach a neighbour by a cost-0 edge, push it to the <strong>front</strong> (it is just as close as the current node); by a cost-1 edge, push it to the <strong>back</strong>. This is called <strong>0-1 BFS</strong>. It gives the same answer as Dijkstra's algorithm (the general <a href="#/topic/dsa-words#w-shortest-path">shortest-path</a> method, which needs a <a href="#/topic/dsa-words#w-heap">heap</a>) but in O(V + E) time.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<p>A <strong>trace</strong> is a table of what every variable holds after each step. In each trace below the first column is the answer (or the value handed back), so you can watch it being built.</p>

<h3>The "stack" picture</h3>
<p>Three plates go on the pile, then one comes off.</p>
<div class="diagram"><pre>handed back  action      stack after (bottom → top)
-            push 1      [1]
-            push 2      [1, 2]
-            push 3      [1, 2, 3]       3 is on top
3            pop()       [1, 2]          the newest plate leaves first
2            peek()      [1, 2]          looks at the top, removes nothing

LIFO: last in, first out.</pre></div>

<h3>The "queue" picture</h3>
<p>Three people join the ticket line, then two are served. This uses the <code>head</code> index from the printer example: nobody moves; <code>head</code> just points at whoever is at the front.</p>
<div class="diagram"><pre>handed back  action       items array  head  waiting (front → back)
-            enqueue 1    [1]          0     1
-            enqueue 2    [1, 2]       0     1 2
-            enqueue 3    [1, 2, 3]    0     1 2 3
1            dequeue()    [1, 2, 3]    1     2 3
2            dequeue()    [1, 2, 3]    2     3

FIFO: first in, first out. The array never shifts; head moves on.</pre></div>

<h3>The "monotonic stack" picture</h3>
<p>Question: for each number, what is the <strong>next greater</strong> number to its right? (-1 if none.) The stack holds <a href="#/topic/dsa-words#w-index">indexes</a> of numbers still waiting for their answer. Their values go down from bottom to top. When a bigger number arrives, it is the answer for every smaller one waiting on top.</p>
<div class="diagram"><pre>nums  = [2, 1, 5, 3, 4]
index:   0  1  2  3  4
The stack holds INDEXES; the value is shown in ( ) to help you read.

result after step   i  value  what happens            stack after
[-1,-1,-1,-1,-1]    0  2      push 0                  [0(2)]
[-1,-1,-1,-1,-1]    1  1      1 &lt; 2: push 1           [0(2), 1(1)]
[ 5, 5,-1,-1,-1]    2  5      5 &gt; 1: pop 1, ans = 5   [2(5)]
                              5 &gt; 2: pop 0, ans = 5
                              push 2
[ 5, 5,-1,-1,-1]    3  3      3 &lt; 5: push 3           [2(5), 3(3)]
[ 5, 5,-1, 4,-1]    4  4      4 &gt; 3: pop 3, ans = 4   [2(5), 4(4)]
                              4 &lt; 5: push 4

Indexes 2 and 4 are left: nothing bigger came after them, so -1.
Answer: [5, 5, -1, 4, -1]
Each index was pushed once and popped at most once: O(n).</pre></div>
<p>Why it works: an index stays on the stack only while nothing bigger has come after it. The moment something bigger arrives, that index has its answer and leaves. So the stack only ever holds "still waiting" items, and they are in going-down order.</p>

<h3>The "balanced parens" picture</h3>
<div class="diagram"><pre>text = "(()[])"

still OK?  char  what happens                  stack after
yes        (     opener: push                  [ ( ]
yes        (     opener: push                  [ ( ( ]
yes        )     top is "(": match, pop        [ ( ]
yes        [     opener: push                  [ ( [ ]
yes        ]     top is "[": match, pop        [ ( ]
yes        )     top is "(": match, pop        [ ]
YES        end   stack is empty                balanced</pre></div>

<h3>The "BFS" picture</h3>
<p>BFS on a small <a href="#/topic/dsa-words#w-binary-tree">binary tree</a> (each node has at most two children, a left one and a right one). Take the front of the queue, record it, and add its children to the back.</p>
<div class="diagram"><pre>Tree:        1
           /   \\
          2     3
         / \\     \\
        4   5     6

visit order so far   took  added       queue after (front → back)
-                    -     start       [1]
1                    1     2, 3        [2, 3]
1 2                  2     4, 5        [3, 4, 5]
1 2 3                3     6           [4, 5, 6]
1 2 3 4              4     -           [5, 6]
1 2 3 4 5            5     -           [6]
1 2 3 4 5 6          6     -           []

Level by level: 1, then 2 3, then 4 5 6.</pre></div>

<h3>The "deque for sliding max" picture</h3>
<p>Question: the <strong>biggest</strong> number in every window of 3 side-by-side numbers. The deque holds indexes whose values go down from front to back, so the front is always the biggest in the window. Two rules each step: drop from the <em>back</em> anything smaller than the new number (it can never be the max again), and drop the <em>front</em> once it has slid out of the window.</p>
<div class="diagram"><pre>nums = [3, 1, 5, 2, 4, 1]     k = 3 (window size)
index:  0  1  2  3  4  5
Deque holds INDEXES, value in ( ). Front is on the left.

output so far  i  value  what happens                 deque after
[]             0  3      push 0                       [0(3)]
[]             1  1      1 &lt; 3: push 1                [0(3), 1(1)]
[5]            2  5      pop back 1 and 0 (both &lt; 5)  [2(5)]
                         push 2; first window full
[5, 5]         3  2      2 &lt; 5: push 3                [2(5), 3(2)]
[5, 5, 5]      4  4      pop back 3 (2 &lt; 4); push 4   [2(5), 4(4)]
[5, 5, 5, 4]   5  1      window is 3..5, so front     [4(4), 5(1)]
                         index 2 slid out: drop it;
                         1 &lt; 4: push 5

Answer: [5, 5, 5, 4]. The front is always the max of the window.</pre></div>

<h3>How to recognise a stack or queue question</h3>
<p>The wording gives it away:</p>
<table>
  <thead><tr><th>The question says…</th><th>Use…</th></tr></thead>
  <tbody>
    <tr><td>"valid / balanced brackets", "matching tags", "nested", "decode 3[ab]"</td><td>Stack</td></tr>
    <tr><td>"undo", "back button", "most recent"</td><td>Stack</td></tr>
    <tr><td>"next greater", "next warmer day", "previous smaller", "how many days until"</td><td>Monotonic stack of indexes</td></tr>
    <tr><td>"largest rectangle", "trapped water"</td><td>Monotonic stack (widths come from indexes)</td></tr>
    <tr><td>"evaluate the expression" in Reverse Polish Notation</td><td>Stack of numbers</td></tr>
    <tr><td>"level by level", "fewest steps / moves", "nearest", "spreads one step per minute"</td><td>BFS with a queue</td></tr>
    <tr><td>"count islands / regions", "flood fill"</td><td>BFS (or DFS) with a visited mark</td></tr>
    <tr><td>"maximum / minimum of every window of size k"</td><td>Monotonic deque of indexes</td></tr>
    <tr><td>"implement a queue using stacks" (or the reverse)</td><td>Two-stack queue / rotate a queue</td></tr>
    <tr><td>Recursion that could go 100,000 levels deep</td><td>A loop with your own array as the stack</td></tr>
  </tbody>
</table>
<p><strong>The big hint for a monotonic stack:</strong> your brute force has an inner loop that walks backward (or forward) from each item looking for the first bigger or smaller one. That inner search is what the stack removes.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Use <code>arr.shift()</code> to dequeue." It works, but <code>shift()</code> moves every other item down one place, so it is O(n) per call. For an O(1) queue, keep a <code>head</code> index, use the two-stack trick, or a linked list.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>The building blocks first (stack, queue, deque), then the classic templates. Every block runs on its own if you paste it into Node or a browser console.</p>

<h3>Stack basics (JS)</h3>
<pre><code class="language-js">const stack = []; // an empty array is an empty stack
stack.push(1); // stack is [1]
stack.push(2); // stack is [1, 2]; 2 is on top
const top = stack[stack.length - 1]; // peek: read the top, don't remove it
console.log(top); // 2
const popped = stack.pop(); // remove the top and hand it back
console.log(popped); // 2
console.log(stack); // [ 1 ]
const isEmpty = stack.length === 0;
console.log(isEmpty); // false
console.log(stack.at(-1)); // 1  (at(-1) is a shorter way to peek)</code></pre>
<p><strong>Walkthrough:</strong> the end of the array is the top of the pile. <code>push</code>, <code>pop</code> and peek all work on that end, so nothing else in the array has to move. That is why they are O(1) (<code>push</code> is amortized O(1), because the array now and then grows).</p>

<h3>Queue with index head pointer</h3>
<pre><code class="language-js">class Queue {
  constructor() {
    this.items = []; // everyone who has joined, in order
    this.head = 0; // index of the person at the front
  }
  enqueue(value) {
    this.items.push(value); // join at the back: O(1)
  }
  dequeue() {
    if (this.head &gt;= this.items.length) {
      return undefined; // nobody is waiting
    }
    const value = this.items[this.head];
    this.head++; // "next!": move the front marker, nobody shifts
    // Tidy up now and then: once the served part is more than half
    // the array, copy out only the people still waiting.
    if (this.head &gt; 50 &amp;&amp; this.head &gt; this.items.length / 2) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return value;
  }
  peek() {
    return this.items[this.head]; // undefined when empty
  }
  get size() {
    return this.items.length - this.head; // joined minus already served
  }
}
const line = new Queue();
line.enqueue("a");
line.enqueue("b");
line.enqueue("c");
console.log(line.dequeue()); // a
console.log(line.dequeue()); // b
console.log(line.size); // 1</code></pre>
<p><strong>Walkthrough:</strong></p>
<ul>
  <li><code>items</code> keeps everyone who ever joined. <code>head</code> is the index of the front. Everything before <code>head</code> has already been served.</li>
  <li><code>dequeue</code> reads <code>items[head]</code> and adds 1 to <code>head</code>. No item moves, so it is O(1).</li>
  <li>Without tidying, <code>items</code> would grow forever. The <code>slice</code> copies only the waiting part. It runs only when more than half the array is already served, so its cost is at most the number of dequeues since the last tidy-up. Spread over those dequeues it is O(1) each: <a href="#/topic/dsa-words#w-amortized">amortized</a> O(1).</li>
</ul>
<p>In a quick interview BFS you can skip the class: keep <code>const queue = [start]</code> and <code>let head = 0</code>, and "dequeue" with <code>queue[head]</code> then <code>head++</code>. Every BFS on this page does that.</p>

<h3>Two-stack queue</h3>
<p>The picture: an office has an <strong>inbox</strong> tray and an <strong>outbox</strong> tray. New letters go on top of the inbox. When the outbox is empty, you flip the whole inbox pile over into the outbox. Flipping reverses the order, so the <em>oldest</em> letter ends up on top of the outbox, ready to be taken first.</p>
<pre><code class="language-js">class QueueViaStacks {
  constructor() {
    this.inbox = []; // new arrivals are pushed here
    this.outbox = []; // items wait here in serving order (oldest on top)
  }
  enqueue(value) {
    this.inbox.push(value);
  }
  dequeue() {
    if (this.outbox.length === 0) {
      // Pour the inbox into the outbox. Popping from one stack and
      // pushing onto another reverses the order: oldest ends on top.
      while (this.inbox.length &gt; 0) {
        this.outbox.push(this.inbox.pop());
      }
    }
    return this.outbox.pop(); // undefined if both trays are empty
  }
}
const queue = new QueueViaStacks();
queue.enqueue(1);
queue.enqueue(2);
queue.enqueue(3);
console.log(queue.dequeue()); // 1
queue.enqueue(4);
console.log(queue.dequeue()); // 2
console.log(queue.dequeue()); // 3
console.log(queue.dequeue()); // 4</code></pre>
<div class="diagram"><pre>handed back  action      inbox       outbox (top is on the right)
-            enqueue 1   [1]         []
-            enqueue 2   [1, 2]      []
-            enqueue 3   [1, 2, 3]   []
1            dequeue     []          [3, 2]     poured 3 items, then pop 1
-            enqueue 4   [4]         [3, 2]
2            dequeue     [4]         [3]        outbox not empty: no pour
3            dequeue     [4]         []
4            dequeue     []          []         poured 1 item, then pop 4</pre></div>
<p><strong>Why amortized O(1):</strong> one dequeue can pour n items (O(n)). But each item is pushed into the inbox once, poured once, and popped from the outbox once: at most 4 cheap steps per item. So any n operations cost at most about 4n steps in total. That is a guarantee for every sequence, not a hope about typical inputs (which would be "average case").</p>

<h3>Deque via doubly linked list</h3>
<p>Each <a href="#/topic/dsa-words#w-node">node</a> is a small object holding a value and two links: <code>prev</code> (the node before it) and <code>next</code> (the node after it). The deque remembers the first node (<code>head</code>) and the last node (<code>tail</code>). Adding or removing at either end only changes a couple of links, so every operation is O(1).</p>
<pre><code class="language-js">class Deque {
  constructor() {
    this.head = null; // first node (the front)
    this.tail = null; // last node (the back)
    this.size = 0;
  }
  pushFront(value) {
    const node = { val: value, prev: null, next: this.head };
    if (this.head !== null) {
      this.head.prev = node; // old front now points back to the new node
    } else {
      this.tail = node; // deque was empty: new node is also the back
    }
    this.head = node;
    this.size++;
  }
  pushBack(value) {
    const node = { val: value, prev: this.tail, next: null };
    if (this.tail !== null) {
      this.tail.next = node; // old back now points on to the new node
    } else {
      this.head = node; // deque was empty: new node is also the front
    }
    this.tail = node;
    this.size++;
  }
  popFront() {
    if (this.head === null) {
      return undefined; // empty
    }
    const value = this.head.val;
    this.head = this.head.next; // the second node becomes the front
    if (this.head !== null) {
      this.head.prev = null; // cut the link back to the removed node
    } else {
      this.tail = null; // that was the only node
    }
    this.size--;
    return value;
  }
  popBack() {
    if (this.tail === null) {
      return undefined; // empty
    }
    const value = this.tail.val;
    this.tail = this.tail.prev; // the second-to-last node becomes the back
    if (this.tail !== null) {
      this.tail.next = null;
    } else {
      this.head = null; // that was the only node
    }
    this.size--;
    return value;
  }
  peekFront() {
    if (this.head === null) {
      return undefined;
    }
    return this.head.val;
  }
  peekBack() {
    if (this.tail === null) {
      return undefined;
    }
    return this.tail.val;
  }
}
const deque = new Deque();
deque.pushBack(2); // [2]
deque.pushBack(3); // [2, 3]
deque.pushFront(1); // [1, 2, 3]
console.log(deque.popFront()); // 1
console.log(deque.popBack()); // 3
console.log(deque.peekFront()); // 2
console.log(deque.size); // 1</code></pre>
<p><strong>Walkthrough:</strong> the only tricky part is the empty case. When the deque has one node, it is both <code>head</code> and <code>tail</code>. So adding to an empty deque sets both, and removing the last node clears both. Every method does a fixed handful of steps: O(1).</p>

<h3>Balanced parentheses</h3>
<p>The stack from the What &amp; Why section, as a function.</p>
<pre><code class="language-js">function isValid(text) {
  const openerFor = { ")": "(", "]": "[", "}": "{" }; // closer → the opener it needs
  const stack = []; // openers still waiting to be closed
  for (const char of text) {
    if (char === "(" || char === "[" || char === "{") {
      stack.push(char); // a new opener goes on top
    } else {
      if (stack.length === 0) {
        return false; // a closer with nothing open
      }
      const lastOpen = stack.pop(); // the most recent opener
      if (lastOpen !== openerFor[char]) {
        return false; // wrong kind, like "(]"
      }
    }
  }
  return stack.length === 0; // anything left open was never closed
}
console.log(isValid("(()[])")); // true
console.log(isValid("([)]")); // false
console.log(isValid("")); // true</code></pre>
<p><strong>Walkthrough:</strong> openers are pushed. Each closer pops the most recent opener and checks it is the right kind. The empty check before <code>pop</code> catches strings like <code>")"</code>. The final check catches strings like <code>"("</code>. Time O(n), one pass. Space O(n): in the worst case (all openers) every character sits on the stack.</p>

<h3>Min stack</h3>
<p>A stack that can also tell you its smallest value in O(1). Keep a second stack, <code>minStack</code>, whose top is always the current minimum.</p>
<pre><code class="language-js">class MinStack {
  constructor() {
    this.stack = []; // all values
    this.minStack = []; // top is always the smallest value in stack
  }
  push(value) {
    this.stack.push(value);
    const noMinYet = this.minStack.length === 0;
    // use &lt;= (not &lt;) so a repeated minimum is pushed again
    if (noMinYet || value &lt;= this.minStack[this.minStack.length - 1]) {
      this.minStack.push(value);
    }
  }
  pop() {
    const value = this.stack.pop();
    if (value === this.minStack[this.minStack.length - 1]) {
      this.minStack.pop(); // the min is leaving, so the helper's top leaves too
    }
    return value;
  }
  top() {
    return this.stack[this.stack.length - 1];
  }
  getMin() {
    return this.minStack[this.minStack.length - 1];
  }
}
const prices = new MinStack();
prices.push(5);
prices.push(2);
prices.push(2); // a second 2: with &lt; instead of &lt;= this one would be lost
prices.push(7);
console.log(prices.getMin()); // 2
prices.pop(); // removes 7
prices.pop(); // removes one 2
console.log(prices.getMin()); // 2  (the other 2 is still there)
prices.pop(); // removes the last 2
console.log(prices.getMin()); // 5</code></pre>
<p><strong>Walkthrough:</strong> <code>minStack</code> only gets a value when it is a new minimum or ties the current one. When that value is popped from the main stack, it is popped from <code>minStack</code> too, and the old minimum is back on top. All operations O(1); space O(n) in the worst case. <a href="#/topic/dsa-stack-queue#ex-2">Example 2</a> shows another way: store the minimum for every level.</p>

<h3>Monotonic stack — next greater element</h3>
<p>The code behind the monotonic-stack trace in the Mental Model.</p>
<pre><code class="language-js">function nextGreater(nums) {
  const result = new Array(nums.length).fill(-1); // -1 = "nothing bigger later"
  const stack = []; // indexes still waiting; their values go down bottom → top
  for (let i = 0; i &lt; nums.length; i++) {
    // nums[i] is the answer for every smaller value waiting on top
    while (stack.length &gt; 0 &amp;&amp; nums[stack[stack.length - 1]] &lt; nums[i]) {
      const waitingIndex = stack.pop();
      result[waitingIndex] = nums[i];
    }
    stack.push(i); // now i waits for its own answer
  }
  return result;
}
console.log(nextGreater([2, 1, 5, 3, 4])); // [ 5, 5, -1, 4, -1 ]</code></pre>
<p><strong>Walkthrough:</strong></p>
<ul>
  <li>The stack holds indexes whose answer is not known yet.</li>
  <li>When <code>nums[i]</code> arrives, every waiting value smaller than it has just found its next greater number, so pop them and fill in <code>result</code>.</li>
  <li>Then push <code>i</code>. Because all smaller values were just popped, the stack's values still go down from bottom to top.</li>
  <li>Time O(n): the <code>while</code> loop sits inside the <code>for</code>, but in total it can pop at most n times, because each index is pushed only once. Space O(n) for the stack.</li>
</ul>
<p>For "next <em>smaller</em>", flip the comparison to <code>&gt;</code>; the stack's values then go up from bottom to top.</p>

<h3>Daily temperatures</h3>
<p>The same pattern, but the answer is a <em>distance</em> (how many days to wait), not a value. That is why the stack stores indexes: <code>i - waitingIndex</code> is the number of days. The full code, with a trace, is in <a href="#/topic/dsa-stack-queue#ex-3">Example 3</a>. Time O(n).</p>

<h3>Largest rectangle in histogram</h3>
<p>A histogram is a bar chart. The biggest rectangle that fits under it uses some bar as its <em>shortest</em> bar. For each bar, you want how far it can stretch left and right before hitting a shorter bar. A stack of indexes whose heights go <em>up</em> from bottom to top gives exactly that: when a shorter bar arrives, each taller bar popped off has found its right edge, and the bar now below it on the stack is its left edge. The full code and trace are in <a href="#/topic/dsa-stack-queue#ex-6">Example 6</a>. Time O(n), space O(n).</p>

<h3>Evaluate Reverse Polish Notation</h3>
<p>Reverse Polish Notation (RPN) writes the operator <em>after</em> its two numbers: <code>2 1 + 3 *</code> means (2 + 1) × 3 = 9. No brackets are ever needed. Read the tokens left to right: push numbers; on an operator, pop two numbers, combine them, and push the result. The full code and trace are in <a href="#/topic/dsa-stack-queue#ex-7">Example 7</a>. Time O(n).</p>

<h3>BFS template</h3>
<pre><code class="language-js">function bfsOrder(graph, start) {
  const order = []; // the order nodes are visited in
  const queue = [start];
  let head = 0; // index of the front of the queue (instead of shift)
  const visited = new Set([start]); // the start is "seen" as soon as it is queued
  while (head &lt; queue.length) {
    const node = queue[head];
    head++; // dequeue in O(1): just move the front marker
    order.push(node); // "process" the node; here we just record it
    for (const next of graph[node]) {
      if (!visited.has(next)) {
        visited.add(next); // mark on ENQUEUE, so it is never queued twice
        queue.push(next);
      }
    }
  }
  return order;
}
// Each key lists its neighbours. This is called an adjacency list.
const graph = { A: ["B", "C"], B: ["A", "D"], C: ["A", "D"], D: ["B", "C"] };
console.log(bfsOrder(graph, "A")); // [ 'A', 'B', 'C', 'D' ]</code></pre>
<p><strong>Walkthrough:</strong></p>
<ul>
  <li>The graph is an <a href="#/topic/dsa-words#w-adjacency-list">adjacency list</a>: an object where each node's key lists the nodes it connects to.</li>
  <li>The queue starts with the start node, and the start is marked visited straight away.</li>
  <li>Each round takes the front node and queues every neighbour not yet seen, marking it at that moment.</li>
  <li>Time O(V + E): each of the V nodes is dequeued once, and each node's neighbour list is read once, which adds up to the E edges (twice each in an undirected graph). Space O(V) for the queue and the visited set.</li>
  <li>With <code>queue.shift()</code> instead of <code>head++</code>, each dequeue could move up to V items, and the total becomes O(V² + E).</li>
</ul>

<h3>Level-order traversal of tree</h3>
<p>"Give me the tree's values level by level" is BFS plus one trick: at the start of each round, the queue holds <em>exactly one whole level</em>. So count how many are waiting, and take exactly that many.</p>
<pre><code class="language-js">function makeNode(val, left = null, right = null) {
  return { val: val, left: left, right: right };
}
//        1
//      /   \\
//     2     3
//    / \\     \\
//   4   5     6
const root = makeNode(1, makeNode(2, makeNode(4), makeNode(5)), makeNode(3, null, makeNode(6)));

function levelOrder(root) {
  if (root === null) {
    return [];
  }
  const levels = [];
  const queue = [root];
  let head = 0; // front of the queue
  while (head &lt; queue.length) {
    const levelSize = queue.length - head; // everyone waiting = one whole level
    const level = [];
    for (let i = 0; i &lt; levelSize; i++) {
      const node = queue[head];
      head++;
      level.push(node.val);
      if (node.left !== null) {
        queue.push(node.left); // children join the back: they are the next level
      }
      if (node.right !== null) {
        queue.push(node.right);
      }
    }
    levels.push(level);
  }
  return levels;
}
console.log(levelOrder(root)); // [ [ 1 ], [ 2, 3 ], [ 4, 5, 6 ] ]</code></pre>
<p><strong>Walkthrough:</strong> <code>levelSize</code> is measured <em>before</em> the inner loop, so the children pushed during the loop wait for the next round. Time O(n): each node is queued and taken once. Space O(n) for the queue and the answer.</p>

<h3>Iterative tree traversals</h3>
<p>A <a href="#/topic/dsa-words#w-traversal">traversal</a> visits every node of a tree once. The three depth-first orders differ only in <em>when</em> the node itself is recorded:</p>
<ul>
  <li><strong>Preorder:</strong> node, then left side, then right side.</li>
  <li><strong>Inorder:</strong> left side, then node, then right side (on a binary search tree this gives sorted order).</li>
  <li><strong>Postorder:</strong> left side, then right side, then node.</li>
</ul>
<p>Preorder is the simplest with a stack. Its code is in <a href="#/topic/dsa-stack-queue#ex-15">Example 15</a>. Inorder and postorder:</p>
<pre><code class="language-js">function makeNode(val, left = null, right = null) {
  return { val: val, left: left, right: right };
}
const root = makeNode(1, makeNode(2, makeNode(4), makeNode(5)), makeNode(3, null, makeNode(6)));

// Inorder: go as far left as possible, read the node, then do its right side.
function inorder(root) {
  const result = [];
  const stack = []; // nodes passed on the way down, waiting to be read
  let current = root;
  while (current !== null || stack.length &gt; 0) {
    while (current !== null) {
      stack.push(current); // remember this node, then keep going left
      current = current.left;
    }
    current = stack.pop(); // the leftmost node not yet read
    result.push(current.val);
    current = current.right; // now walk its right side the same way
  }
  return result;
}

// Postorder: collect node, right, left (a mirrored preorder), then reverse.
function postorder(root) {
  if (root === null) {
    return [];
  }
  const result = [];
  const stack = [root];
  while (stack.length &gt; 0) {
    const node = stack.pop();
    result.push(node.val); // collects in node, right, left order
    if (node.left !== null) {
      stack.push(node.left);
    }
    if (node.right !== null) {
      stack.push(node.right); // pushed last, so popped first
    }
  }
  result.reverse(); // node-right-left reversed = left-right-node
  return result;
}
console.log(inorder(root)); // [ 4, 2, 5, 1, 3, 6 ]
console.log(postorder(root)); // [ 4, 5, 2, 6, 3, 1 ]</code></pre>
<p><strong>Walkthrough:</strong> in <code>inorder</code>, the stack holds the "parents I still owe a visit": you walk left, stacking each node, and only read a node once its whole left side is done. In <code>postorder</code>, the trick is that reversing "node, right, left" gives "left, right, node". Both are O(n) time. Space is O(h), where h is the tree's <a href="#/topic/dsa-words#w-depth-height">height</a> (the number of levels) for inorder, and O(n) for this postorder because it keeps the full result before reversing.</p>

<h3>Stack used for undo/redo</h3>
<p>Two stacks of actions. Undo takes your latest action off the undo stack and keeps it on the redo stack. Redo moves it back. Doing a brand-new action wipes the redo stack, because the old "future" no longer makes sense.</p>
<pre><code class="language-js">class History {
  constructor() {
    this.undoStack = []; // actions you can undo, latest on top
    this.redoStack = []; // actions you undid, latest on top
  }
  doAction(action) {
    this.undoStack.push(action);
    this.redoStack = []; // a new action makes the old redo list meaningless
  }
  undo() {
    if (this.undoStack.length === 0) {
      return undefined; // nothing to undo
    }
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    return action;
  }
  redo() {
    if (this.redoStack.length === 0) {
      return undefined; // nothing to redo
    }
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    return action;
  }
}
const editor = new History();
editor.doAction("type a");
editor.doAction("type b");
editor.doAction("type c");
console.log(editor.undo()); // type c
console.log(editor.undo()); // type b
console.log(editor.redo()); // type b
editor.doAction("type d"); // clears the redo stack ("type c" is gone)
console.log(editor.redo()); // undefined</code></pre>
<p><strong>Walkthrough:</strong> the empty checks use <code>length</code>, not "is the action truthy". An action like <code>0</code> or <code>""</code> is falsy but still real. All operations O(1).</p>

<h3>Implement Stack via Queue</h3>
<p>A puzzle interviewers like: build a stack when you are only allowed queue moves (add at back, take from front). The trick: after adding a new item at the back, <strong>rotate</strong> the queue by taking each older item from the front and adding it to the back again. The new item ends up at the front, so "take from front" now gives the newest item: LIFO.</p>
<pre><code class="language-js">// A small O(1) queue: a head index instead of shift().
class SimpleQueue {
  constructor() {
    this.items = [];
    this.head = 0; // index of the front item
  }
  enqueue(value) {
    this.items.push(value);
  }
  dequeue() {
    if (this.size() === 0) {
      return undefined;
    }
    const value = this.items[this.head];
    this.head++; // move the front marker: O(1)
    if (this.head === this.items.length) {
      this.items = []; // now empty: drop the served slots
      this.head = 0;
    } else if (this.head &gt; this.items.length / 2) {
      this.items = this.items.slice(this.head); // over half served: keep only the waiting part
      this.head = 0;
    }
    return value;
  }
  peek() {
    return this.items[this.head];
  }
  size() {
    return this.items.length - this.head;
  }
}

class StackViaQueue {
  constructor() {
    this.queue = new SimpleQueue();
  }
  push(value) {
    this.queue.enqueue(value); // new item joins at the back
    const olderCount = this.queue.size() - 1;
    for (let i = 0; i &lt; olderCount; i++) {
      this.queue.enqueue(this.queue.dequeue()); // move each older item behind it
    }
  }
  pop() {
    return this.queue.dequeue(); // the front is now the newest item
  }
  top() {
    return this.queue.peek();
  }
  empty() {
    return this.queue.size() === 0;
  }
}
const stack = new StackViaQueue();
stack.push(1);
stack.push(2);
stack.push(3); // queue front → back is now 3, 2, 1
console.log(stack.top()); // 3
console.log(stack.pop()); // 3
console.log(stack.pop()); // 2
console.log(stack.empty()); // false</code></pre>
<p><strong>Cost:</strong> <code>push</code> is O(n), because it rotates every older item. <code>pop</code> and <code>top</code> are O(1). This holds only because <code>SimpleQueue</code> dequeues in O(1). With a plain array and <code>shift()</code>, each rotation step would itself be O(n), making <code>push</code> O(n²) and <code>pop</code> O(n). <code>SimpleQueue</code> drops its served slots when it empties or when more than half is served; without that, every rotation would leave a used slot behind and memory would grow O(n²). Space O(n).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<p>Fifteen classic interview problems. Each one has the problem in plain words, the idea, a short trace, code you can paste into a console, and its cost in words.</p>

<h3 id="ex-1">Example 1 — Valid parentheses</h3>
<p><strong>The problem:</strong> Given a string made only of <code>()[]{}</code>, is every bracket closed by the same kind, in the right order? <code>"()[]{}"</code> → true, <code>"(]"</code> → false, <code>"{[]}"</code> → true.</p>
<p><strong>The idea:</strong> Push every opener. Each closer must match the most recent opener still open, which is the top of the stack.</p>
<div class="diagram"><pre>text = "{[]}"

still OK?  char  what happens                stack after
yes        {     opener: push                [ { ]
yes        [     opener: push                [ { [ ]
yes        ]     pop "[": matches            [ { ]
yes        }     pop "{": matches            [ ]
YES        end   stack empty                 balanced → true</pre></div>
<pre><code class="language-js">function isValid(text) {
  const openerFor = { ")": "(", "]": "[", "}": "{" }; // closer → the opener it needs
  const stack = [];
  for (const char of text) {
    if (char in openerFor) {
      // a closer: the top of the stack must be its opener
      if (stack.length === 0) {
        return false; // nothing is open
      }
      const lastOpen = stack.pop();
      if (lastOpen !== openerFor[char]) {
        return false; // wrong kind
      }
    } else {
      stack.push(char); // an opener
    }
  }
  return stack.length === 0; // leftovers were never closed
}
console.log(isValid("()[]{}")); // true
console.log(isValid("(]")); // false
console.log(isValid("{[]}")); // true
console.log(isValid("")); // true  (nothing to match)
console.log(isValid("(")); // false  (left open)</code></pre>
<p><strong>Cost:</strong> time O(n), one pass. Space O(n): a string of only openers puts every character on the stack.</p>

<h3 id="ex-2">Example 2 — Min stack</h3>
<p><strong>The problem:</strong> Build a stack with <code>push</code>, <code>pop</code>, <code>top</code> and <code>getMin</code>, all O(1). Think of a stock-price log where you can undo the latest entry and always ask "what's the lowest price in the log right now?"</p>
<p><strong>The idea:</strong> Next to every value, also store "the smallest value from the bottom up to here". Then the minimum is always on top of that second stack, and popping both together brings back the previous minimum. (The Mechanics version stores a value only when it is a new minimum; this version is simpler and handles repeats automatically, at the cost of always using 2n slots.)</p>
<div class="diagram"><pre>getMin after  action    stack          minSoFar
5             push 5    [5]            [5]
3             push 3    [5, 3]         [5, 3]
3             push 7    [5, 3, 7]      [5, 3, 3]
3             push 3    [5, 3, 7, 3]   [5, 3, 3, 3]
3             pop → 3   [5, 3, 7]      [5, 3, 3]
3             pop → 7   [5, 3]         [5, 3]
5             pop → 3   [5]            [5]</pre></div>
<pre><code class="language-js">class MinStack {
  constructor() {
    this.stack = []; // the real values
    this.minSoFar = []; // minSoFar[i] = smallest of stack[0..i]
  }
  push(value) {
    this.stack.push(value);
    if (this.minSoFar.length === 0) {
      this.minSoFar.push(value); // the first value is the min
    } else {
      const currentMin = this.minSoFar[this.minSoFar.length - 1];
      this.minSoFar.push(Math.min(value, currentMin));
    }
  }
  pop() {
    this.minSoFar.pop(); // both stacks always have the same height
    return this.stack.pop();
  }
  top() {
    return this.stack[this.stack.length - 1];
  }
  getMin() {
    return this.minSoFar[this.minSoFar.length - 1];
  }
}
const log = new MinStack();
log.push(5);
log.push(3);
log.push(7);
log.push(3);
console.log(log.getMin()); // 3
log.pop();
log.pop();
console.log(log.getMin()); // 3
log.pop();
console.log(log.getMin()); // 5
console.log(log.top()); // 5</code></pre>
<p><strong>Cost:</strong> every operation is O(1) time. Space O(n): two stacks of n values.</p>

<h3 id="ex-3">Example 3 — Daily temperatures (monotonic stack)</h3>
<p><strong>The problem:</strong> Daily temperatures <code>[73, 74, 75, 71, 69, 72, 76, 73]</code>. For each day, how many days until a warmer day? 0 if none. Answer: <code>[1, 1, 4, 2, 1, 1, 0, 0]</code>.</p>
<p><strong>The idea:</strong> Keep a stack of days still waiting for a warmer day. Their temperatures go down from bottom to top. When a warmer day arrives, pop every cooler day waiting on top: today is their answer, and the wait is <code>today - thatDay</code>. That is why the stack stores <em>indexes</em>.</p>
<div class="diagram"><pre>temps = [73, 74, 75, 71, 69, 72, 76, 73]
index:    0   1   2   3   4   5   6   7

answer so far      i  temp  popped (wait)        stack after
[0,0,0,0,0,0,0,0]  0  73    -                    [0]
[1,0,0,0,0,0,0,0]  1  74    0 (1)                [1]
[1,1,0,0,0,0,0,0]  2  75    1 (1)                [2]
[1,1,0,0,0,0,0,0]  3  71    -                    [2, 3]
[1,1,0,0,0,0,0,0]  4  69    -                    [2, 3, 4]
[1,1,0,2,1,0,0,0]  5  72    4 (1), 3 (2)         [2, 5]
[1,1,4,2,1,1,0,0]  6  76    5 (1), 2 (4)         [6]
[1,1,4,2,1,1,0,0]  7  73    -                    [6, 7]
Days 6 and 7 never see a warmer day, so they keep 0.</pre></div>
<pre><code class="language-js">function dailyTemperatures(temps) {
  const answer = new Array(temps.length).fill(0); // 0 = no warmer day ahead
  const stack = []; // indexes of days still waiting; temps go down bottom → top
  for (let today = 0; today &lt; temps.length; today++) {
    // today is warmer than the day on top: that day's wait is over
    while (stack.length &gt; 0 &amp;&amp; temps[stack[stack.length - 1]] &lt; temps[today]) {
      const waitingDay = stack.pop();
      answer[waitingDay] = today - waitingDay; // the distance in days
    }
    stack.push(today); // today now waits for its own warmer day
  }
  return answer;
}
console.log(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73])); // [ 1, 1, 4, 2, 1, 1, 0, 0 ]</code></pre>
<p><strong>Cost:</strong> time O(n): each day is pushed once and popped at most once, so the inner <code>while</code> runs at most n times in total. Space O(n) for the stack (a run of falling temperatures keeps every day on it).</p>

<h3 id="ex-4">Example 4 — Next greater element</h3>
<p><strong>The problem (LeetCode 496):</strong> You get <code>nums2 = [1, 3, 4, 2]</code> and a smaller list <code>nums1 = [4, 1, 2]</code> whose values all appear in <code>nums2</code>. All values are different. For each value in <code>nums1</code>, find the first bigger value to its right <em>in nums2</em>, or -1. Answer: <code>[-1, 3, -1]</code>.</p>
<p><strong>The idea:</strong> Run the next-greater monotonic stack over <code>nums2</code> once, and save each answer in a Map (value → next greater value). Then look up every value of <code>nums1</code>. Because values are all different, the value itself can be the key, so this stack can hold values instead of indexes.</p>
<div class="diagram"><pre>nums2 = [1, 3, 4, 2]

map after         value  what happens              stack after
{}                1      push 1                    [1]
{1→3}             3      3 &gt; 1: pop 1, save 1→3    [3]
{1→3, 3→4}        4      4 &gt; 3: pop 3, save 3→4    [4]
{1→3, 3→4}        2      2 &lt; 4: push 2             [4, 2]
4 and 2 never found a bigger value: not in the map → -1.

nums1 = [4, 1, 2]  →  [-1, 3, -1]</pre></div>
<pre><code class="language-js">function nextGreaterElement(nums1, nums2) {
  const nextBigger = new Map(); // value → the first bigger value after it
  const stack = []; // values still waiting; they go down bottom → top
  for (const value of nums2) {
    while (stack.length &gt; 0 &amp;&amp; stack[stack.length - 1] &lt; value) {
      const waitingValue = stack.pop();
      nextBigger.set(waitingValue, value);
    }
    stack.push(value);
  }
  const result = [];
  for (const value of nums1) {
    if (nextBigger.has(value)) {
      result.push(nextBigger.get(value));
    } else {
      result.push(-1); // never found a bigger value
    }
  }
  return result;
}
console.log(nextGreaterElement([4, 1, 2], [1, 3, 4, 2])); // [ -1, 3, -1 ]
console.log(nextGreaterElement([2, 4], [1, 2, 3, 4])); // [ 3, -1 ]</code></pre>
<p><strong>Cost:</strong> time O(n + m), where n and m are the two list lengths: one pass over <code>nums2</code>, one over <code>nums1</code>. Space O(n) for the map and stack.</p>

<h3 id="ex-5">Example 5 — Trapping rain water (monotonic stack alt)</h3>
<p><strong>The problem:</strong> Wall heights <code>[3, 0, 2, 0, 4]</code> (each 1 unit wide). After rain, how many units of water sit between the walls? Answer: 7 (3 above index 1, 1 above index 2, 3 above index 3).</p>
<p><strong>The idea:</strong> Keep a stack of indexes whose heights go down from bottom to top. When a taller wall arrives, the wall just popped is the <em>floor</em> of a pool, the new stack top is the pool's <em>left wall</em>, and the new wall is its <em>right wall</em>. Fill that pool layer: width × (lower wall − floor).</p>
<div class="diagram"><pre>height = [3, 0, 2, 0, 4]
index:    0  1  2  3  4

water so far  i  h  what happens                          stack after
0             0  3  push 0                                [0]
0             1  0  0 &lt; 3: push 1                         [0, 1]
2             2  2  pop 1 (floor 0). left wall 0 (h 3).   [0, 2]
                    width 2-0-1 = 1, depth min(2,3)-0 = 2
                    → +2. Then 2 &lt; 3: push 2
2             3  0  0 &lt; 2: push 3                         [0, 2, 3]
4             4  4  pop 3 (floor 0). left wall 2 (h 2).   [4]
                    width 1, depth min(4,2)-0 = 2 → +2
7                   pop 2 (floor 2). left wall 0 (h 3).
                    width 4-0-1 = 3, depth min(4,3)-2 = 1
                    → +3
7                   pop 0: nothing left of it, no pool.
                    push 4
Answer: 7</pre></div>
<pre><code class="language-js">function trap(height) {
  const stack = []; // indexes; heights go down bottom → top
  let water = 0;
  for (let i = 0; i &lt; height.length; i++) {
    // the new wall is taller than the top: a pool may be closed off
    while (stack.length &gt; 0 &amp;&amp; height[i] &gt; height[stack[stack.length - 1]]) {
      const floorIndex = stack.pop(); // the bottom of this pool layer
      if (stack.length === 0) {
        break; // no wall on the left, so water would run off
      }
      const leftIndex = stack[stack.length - 1];
      const width = i - leftIndex - 1; // the gap between the two walls
      const lowerWall = Math.min(height[i], height[leftIndex]);
      const depth = lowerWall - height[floorIndex]; // water fills up to the lower wall
      water += width * depth;
    }
    stack.push(i);
  }
  return water;
}
console.log(trap([3, 0, 2, 0, 4])); // 7
console.log(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6</code></pre>
<p><strong>Cost:</strong> time O(n): each index is pushed and popped at most once. Space O(n) for the stack. The <a href="#/topic/dsa-words#w-two-pointers">two-pointer</a> solution is also O(n) time but only O(1) extra space, so interviewers usually prefer it (see Pitfall 10).</p>

<h3 id="ex-6">Example 6 — Largest rectangle</h3>
<p><strong>The problem:</strong> A bar chart has bars of heights <code>[2, 1, 5, 6, 2, 3]</code>, each 1 unit wide. What is the area of the biggest rectangle that fits under the bars? Answer: 10 (height 5, across the bars 5 and 6).</p>
<p><strong>The idea:</strong> Keep a stack of indexes whose heights go <em>up</em> from bottom to top. When a shorter bar arrives, every taller bar on top can't stretch any further right. Pop it and measure its rectangle: its right edge is just before <code>i</code>; its left edge is just after the bar now below it on the stack (or the start, if the stack is empty). At the end, pretend there is one extra bar of height 0. It is shorter than everything, so it pops (and measures) every bar still waiting. A fake item like this, added to save special-case code, is called a <a href="#/topic/dsa-words#w-sentinel">sentinel</a>.</p>
<div class="diagram"><pre>heights = [2, 1, 5, 6, 2, 3]   + sentinel 0 at index 6
index:     0  1  2  3  4  5

best  i  h  popped: height × width                    stack after
0     0  2  -                                         [0]
2     1  1  0: 2 × 1 (stack empty, width = i = 1)     [1]
2     2  5  -                                         [1, 2]
2     3  6  -                                         [1, 2, 3]
6     4  2  3: 6 × (4-2-1 = 1) = 6                    [1, 4]
10          2: 5 × (4-1-1 = 2) = 10
10    5  3  -                                         [1, 4, 5]
10    6  0  5: 3 × (6-4-1 = 1) = 3                    [6]
            4: 2 × (6-1-1 = 4) = 8
            1: 1 × 6 (stack empty, width = 6) = 6
Answer: 10</pre></div>
<pre><code class="language-js">function largestRectangleArea(heights) {
  const stack = []; // indexes; heights go up bottom → top
  let best = 0;
  for (let i = 0; i &lt;= heights.length; i++) {
    // one extra round with height 0 (the sentinel) empties the stack
    let currentHeight = 0;
    if (i &lt; heights.length) {
      currentHeight = heights[i];
    }
    while (stack.length &gt; 0 &amp;&amp; heights[stack[stack.length - 1]] &gt; currentHeight) {
      const barIndex = stack.pop(); // this bar can't stretch past i
      let width = i; // nothing shorter on the left: it reaches index 0
      if (stack.length &gt; 0) {
        width = i - stack[stack.length - 1] - 1; // between the shorter bars
      }
      best = Math.max(best, heights[barIndex] * width);
    }
    stack.push(i);
  }
  return best;
}
console.log(largestRectangleArea([2, 1, 5, 6, 2, 3])); // 10
console.log(largestRectangleArea([2, 4])); // 4</code></pre>
<p><strong>Cost:</strong> time O(n): each index is pushed and popped once. Space O(n) for the stack.</p>

<h3 id="ex-7">Example 7 — RPN evaluation</h3>
<p><strong>The problem:</strong> Evaluate an expression in Reverse Polish Notation: each operator comes <em>after</em> its two numbers. <code>["2", "1", "+", "3", "*"]</code> means (2 + 1) × 3 = 9. Division drops the decimal part, rounding toward zero (13 / 5 = 2, −7 / 2 = −3).</p>
<p><strong>The idea:</strong> Numbers go on a stack. An operator pops two numbers, combines them, and pushes the result. Careful with the order: the <em>first</em> pop is the <em>right</em>-hand number.</p>
<div class="diagram"><pre>tokens = ["4", "13", "5", "/", "+"]

result  token  what happens                    stack after
-       4      number: push                    [4]
-       13     number: push                    [4, 13]
-       5      number: push                    [4, 13, 5]
-       /      pop 5 (right), pop 13 (left)    [4, 2]
               13 / 5 = 2.6 → trunc → 2
-       +      pop 2 (right), pop 4 (left)     [6]
               4 + 2 = 6
6       end    the one number left            </pre></div>
<pre><code class="language-js">function evalRPN(tokens) {
  const stack = [];
  for (const token of tokens) {
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      const right = stack.pop(); // the first pop is the RIGHT-hand number
      const left = stack.pop();
      let result;
      if (token === "+") {
        result = left + right;
      } else if (token === "-") {
        result = left - right;
      } else if (token === "*") {
        result = left * right;
      } else {
        result = Math.trunc(left / right); // drop the decimals, toward zero
      }
      stack.push(result);
    } else {
      stack.push(Number(token)); // "13" → 13, "-2" → -2
    }
  }
  return stack[0];
}
console.log(evalRPN(["2", "1", "+", "3", "*"])); // 9
console.log(evalRPN(["4", "13", "5", "/", "+"])); // 6
console.log(evalRPN(["7", "-2", "/"])); // -3</code></pre>
<p><strong>Cost:</strong> time O(n), one pass over the tokens. Space O(n) for the stack.</p>

<h3 id="ex-8">Example 8 — Decode string</h3>
<p><strong>The problem:</strong> <code>"3[a2[c]]"</code> means "3 times: a, then 2 times c" → <code>"accaccacc"</code>. Brackets can nest, and the number can have several digits (<code>"12[x]"</code>).</p>
<p><strong>The idea:</strong> When you hit <code>[</code>, you are starting a new inner piece. Save what you had so far (the text before it and the repeat count) on a stack, then start fresh. When you hit <code>]</code>, the inner piece is done: pop the saved state and glue it back together: <code>textBefore + inner repeated count times</code>.</p>
<div class="diagram"><pre>text = "3[a2[c]]"

current after   char  what happens                 stack after
""              3     count = 3                    []
""              [     save [3, ""], reset          [[3, ""]]
"a"             a     add letter                   [[3, ""]]
"a"             2     count = 2                    [[3, ""]]
""              [     save [2, "a"], reset         [[3, ""], [2, "a"]]
"c"             c     add letter                   [[3, ""], [2, "a"]]
"acc"           ]     pop [2, "a"]: "a" + "cc"     [[3, ""]]
"accaccacc"     ]     pop [3, ""]: "" + "acc" × 3  []</pre></div>
<pre><code class="language-js">function decodeString(text) {
  const stack = []; // saved [repeatCount, textBefore] pairs, one per open "["
  let current = ""; // the text built since the last "["
  let count = 0; // the number being read just before a "["
  for (const char of text) {
    if (char &gt;= "0" &amp;&amp; char &lt;= "9") {
      count = count * 10 + Number(char); // "12" → 1, then 1 × 10 + 2 = 12
    } else if (char === "[") {
      stack.push([count, current]); // remember where we were
      count = 0;
      current = ""; // start the inner piece fresh
    } else if (char === "]") {
      const [repeatCount, textBefore] = stack.pop();
      current = textBefore + current.repeat(repeatCount); // close the inner piece
    } else {
      current += char; // a normal letter
    }
  }
  return current;
}
console.log(decodeString("3[a2[c]]")); // accaccacc
console.log(decodeString("2[abc]3[cd]ef")); // abcabccdcdcdef
console.log(decodeString("12[x]")); // xxxxxxxxxxxx</code></pre>
<p><strong>Cost:</strong> time grows with the length of the <em>decoded output</em>, because every output character is built at least once (and nested pieces are copied once per level). Space: the output plus one saved pair per level of nesting.</p>

<h3 id="ex-9">Example 9 — Asteroid collision</h3>
<p><strong>The problem:</strong> Asteroids fly in a row. The number is the size; the sign is the direction (+ right, − left). When a right-mover meets a left-mover, the smaller one explodes; equal sizes both explode. What is left? <code>[5, 10, -5]</code> → <code>[5, 10]</code>. <code>[8, -8]</code> → <code>[]</code>. <code>[10, 2, -5]</code> → <code>[10]</code>.</p>
<p><strong>The idea:</strong> The stack holds the survivors so far, left to right. A crash can only happen when the top of the stack moves right (+) and the new asteroid moves left (−). Keep crashing the new one into the top until it explodes or no crash is possible.</p>
<div class="diagram"><pre>asteroids = [10, 2, -5]

survivors after  rock  what happens
[10]             10    nothing to hit: push
[10, 2]          2     moving right, no crash: push
[10]             -5    top 2 &lt; 5: 2 explodes, check again
[10]                   top 10 &gt; 5: -5 explodes. stop.
Answer: [10]</pre></div>
<pre><code class="language-js">function asteroidCollision(asteroids) {
  const stack = []; // survivors so far, left to right
  for (const rock of asteroids) {
    let alive = true;
    // a crash needs: new rock moving left, top of stack moving right
    while (alive &amp;&amp; rock &lt; 0 &amp;&amp; stack.length &gt; 0 &amp;&amp; stack[stack.length - 1] &gt; 0) {
      const top = stack[stack.length - 1];
      const size = -rock; // the size of the left-mover
      if (top &lt; size) {
        stack.pop(); // the top explodes; the rock keeps going
      } else if (top === size) {
        stack.pop(); // equal sizes: both explode
        alive = false;
      } else {
        alive = false; // the rock explodes
      }
    }
    if (alive) {
      stack.push(rock);
    }
  }
  return stack;
}
console.log(asteroidCollision([5, 10, -5])); // [ 5, 10 ]
console.log(asteroidCollision([8, -8])); // []
console.log(asteroidCollision([10, 2, -5])); // [ 10 ]
console.log(asteroidCollision([-2, -1, 1, 2])); // [ -2, -1, 1, 2 ]  (moving apart: no crash)</code></pre>
<p><strong>Cost:</strong> time O(n): each asteroid is pushed at most once and popped at most once. Space O(n) for the stack.</p>

<h3 id="ex-10">Example 10 — BFS shortest path (unweighted)</h3>
<p><strong>The problem:</strong> A small metro map. Every ride between two neighbouring stations counts as 1 step. What is the fewest number of steps from station A to station F? -1 if F can't be reached.</p>
<p><strong>The idea:</strong> BFS explores in rings: all stations 1 step away, then all 2 steps away, and so on. So the first time BFS reaches F, it got there by the fewest steps. Store <code>[station, steps]</code> pairs in the queue.</p>
<div class="diagram"><pre>    B ——— D ——— F
   /     /     /
  A ——— C ——— E

Edges: A-B, A-C, B-D, C-D, C-E, D-F, E-F

answer  took (steps)  queued now      queue after
-       A (0)         B1, C1          [B1, C1]
-       B (1)         D2              [C1, D2]
-       C (1)         E2  (D is seen) [D2, E2]
-       D (2)         F3              [E2, F3]
-       E (2)         - (F is seen)   [F3]
3       F (3)         it's the goal: stop</pre></div>
<pre><code class="language-js">function shortestPath(graph, start, end) {
  const queue = [[start, 0]]; // [station, steps from start]
  let head = 0; // front of the queue
  const visited = new Set([start]);
  while (head &lt; queue.length) {
    const [station, steps] = queue[head];
    head++;
    if (station === end) {
      return steps; // the first arrival is the fewest steps
    }
    for (const next of graph[station]) {
      if (!visited.has(next)) {
        visited.add(next); // mark on enqueue
        queue.push([next, steps + 1]);
      }
    }
  }
  return -1; // the queue ran out: end can't be reached
}
const metro = {
  A: ["B", "C"],
  B: ["A", "D"],
  C: ["A", "D", "E"],
  D: ["B", "C", "F"],
  E: ["C", "F"],
  F: ["D", "E"],
  G: [], // a station with no connections
};
console.log(shortestPath(metro, "A", "F")); // 3
console.log(shortestPath(metro, "A", "A")); // 0
console.log(shortestPath(metro, "A", "G")); // -1</code></pre>
<p><strong>Cost:</strong> time O(V + E): each station is queued once and each connection is looked at once from each end. Space O(V) for the queue and the visited set. This only works when every step costs the same; see Pitfall 14 for weighted maps.</p>

<h3 id="ex-11">Example 11 — Number of islands (BFS)</h3>
<p><strong>The problem:</strong> A map grid of <code>"1"</code> (land) and <code>"0"</code> (water). Land cells touching up, down, left or right belong to the same island. How many islands? The grid below has 3.</p>
<p><strong>The idea:</strong> Scan every cell. When you find land you haven't counted, that's a new island: add 1, then BFS from it and turn every connected land cell into water, so it is never counted again. Each island is one <a href="#/topic/dsa-words#w-connected-component">connected component</a>: a group of cells all reachable from each other.</p>
<div class="diagram"><pre>grid               islands  scan reaches  BFS sinks
1 1 0 0 0          1        (0,0)         (0,0) (0,1) (1,0) (1,1)
1 1 0 0 0          2        (2,2)         (2,2)
0 0 1 0 0          3        (3,3)         (3,3) (3,4)
0 0 0 1 1
Every other cell is water, or was already sunk. Answer: 3</pre></div>
<pre><code class="language-js">function numIslands(grid) {
  if (grid.length === 0) {
    return 0;
  }
  const land = grid.map(row =&gt; row.slice()); // a copy, so the caller's grid isn't changed
  const rows = land.length;
  const cols = land[0].length;
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
  let islands = 0;
  for (let r = 0; r &lt; rows; r++) {
    for (let c = 0; c &lt; cols; c++) {
      if (land[r][c] !== "1") {
        continue; // water, or land already counted
      }
      islands++; // new island found
      land[r][c] = "0"; // sink it on enqueue, like marking visited
      const queue = [[r, c]];
      let head = 0;
      while (head &lt; queue.length) {
        const [row, col] = queue[head];
        head++;
        for (const [dRow, dCol] of directions) {
          const nextRow = row + dRow;
          const nextCol = col + dCol;
          const inside = nextRow &gt;= 0 &amp;&amp; nextRow &lt; rows &amp;&amp; nextCol &gt;= 0 &amp;&amp; nextCol &lt; cols;
          if (inside &amp;&amp; land[nextRow][nextCol] === "1") {
            land[nextRow][nextCol] = "0";
            queue.push([nextRow, nextCol]);
          }
        }
      }
    }
  }
  return islands;
}
const map = [
  ["1", "1", "0", "0", "0"],
  ["1", "1", "0", "0", "0"],
  ["0", "0", "1", "0", "0"],
  ["0", "0", "0", "1", "1"],
];
console.log(numIslands(map)); // 3</code></pre>
<p><strong>Cost:</strong> time O(m × n) for an m-row, n-column grid: each cell is scanned once and queued at most once. Space O(m × n) for the copy and the queue.</p>

<h3 id="ex-12">Example 12 — Implement queue using stacks</h3>
<p><strong>The problem (LeetCode 232):</strong> Build a queue with <code>push</code> (join the back), <code>pop</code> (leave the front), <code>peek</code> and <code>empty</code>, using only stack moves.</p>
<p><strong>The idea:</strong> The inbox/outbox trays from Mechanics. Push into the inbox. When the front is needed and the outbox is empty, pour the whole inbox into the outbox; that flips the order so the oldest item is on top.</p>
<div class="diagram"><pre>handed back  action   inbox     outbox (top on the right)
-            push 1   [1]       []
-            push 2   [1, 2]    []
1            peek     []        [2, 1]   outbox empty → pour
1            pop      []        [2]
-            push 3   [3]       [2]
2            pop      [3]       []       outbox not empty: no pour
3            pop      []        []       outbox empty → pour 3, pop</pre></div>
<pre><code class="language-js">class MyQueue {
  constructor() {
    this.inbox = []; // push here
    this.outbox = []; // pop from here; oldest item on top
  }
  push(value) {
    this.inbox.push(value);
  }
  pop() {
    this.peek(); // makes sure the outbox has the front item on top
    return this.outbox.pop();
  }
  peek() {
    if (this.outbox.length === 0) {
      while (this.inbox.length &gt; 0) {
        this.outbox.push(this.inbox.pop()); // pouring flips the order
      }
    }
    return this.outbox[this.outbox.length - 1];
  }
  empty() {
    return this.inbox.length === 0 &amp;&amp; this.outbox.length === 0;
  }
}
const queue = new MyQueue();
queue.push(1);
queue.push(2);
console.log(queue.peek()); // 1
console.log(queue.pop()); // 1
queue.push(3);
console.log(queue.pop()); // 2
console.log(queue.pop()); // 3
console.log(queue.empty()); // true</code></pre>
<p><strong>Cost:</strong> <code>push</code> and <code>empty</code> are O(1). <code>pop</code> and <code>peek</code> are amortized O(1): one call may pour n items, but each item is poured only once in its life, so n operations cost O(n) in total. Space O(n).</p>

<h3 id="ex-13">Example 13 — Stack with two queues</h3>
<p><strong>The problem (LeetCode 225):</strong> Build a stack (<code>push</code>, <code>pop</code>, <code>top</code>, <code>empty</code>) using only queue moves: add at back, take from front, look at front, size.</p>
<p><strong>The idea:</strong> Keep every item in <code>main</code>, with the <em>newest at the front</em>. To push x: put x alone into the empty <code>helper</code> queue, then move every item from <code>main</code> behind it. Now <code>helper</code> has x at the front, followed by the older items in the right order. Swap the names. (The Mechanics section does the same with one queue, by rotating.)</p>
<div class="diagram"><pre>top after  action   main (front → back)   helper during the push
1          push 1   [1]                   [1]
2          push 2   [2, 1]                [2] then + 1
3          push 3   [3, 2, 1]             [3] then + 2, 1
2          pop → 3  [2, 1]</pre></div>
<pre><code class="language-js">// A small O(1) queue: a head index instead of shift().
class SimpleQueue {
  constructor() {
    this.items = [];
    this.head = 0; // index of the front item
  }
  enqueue(value) {
    this.items.push(value);
  }
  dequeue() {
    if (this.size() === 0) {
      return undefined;
    }
    const value = this.items[this.head];
    this.head++;
    if (this.head === this.items.length) {
      this.items = []; // now empty: drop the served slots
      this.head = 0;
    } else if (this.head &gt; this.items.length / 2) {
      this.items = this.items.slice(this.head); // over half served: keep only the waiting part
      this.head = 0;
    }
    return value;
  }
  peek() {
    return this.items[this.head];
  }
  size() {
    return this.items.length - this.head;
  }
}

class MyStack {
  constructor() {
    this.main = new SimpleQueue(); // newest item at the front
    this.helper = new SimpleQueue(); // empty between operations
  }
  push(value) {
    this.helper.enqueue(value); // the new item goes first
    while (this.main.size() &gt; 0) {
      this.helper.enqueue(this.main.dequeue()); // older items line up behind it
    }
    const emptied = this.main;
    this.main = this.helper; // helper is now the full, correctly ordered queue
    this.helper = emptied;
  }
  pop() {
    return this.main.dequeue(); // the front is the newest item
  }
  top() {
    return this.main.peek();
  }
  empty() {
    return this.main.size() === 0;
  }
}
const stack = new MyStack();
stack.push(1);
stack.push(2);
stack.push(3);
console.log(stack.pop()); // 3
console.log(stack.top()); // 2
console.log(stack.empty()); // false</code></pre>
<p><strong>Cost:</strong> <code>push</code> is O(n), because every older item is moved. <code>pop</code>, <code>top</code> and <code>empty</code> are O(1). This needs a queue whose dequeue really is O(1): built on <code>shift()</code>, push would become O(n²). <code>SimpleQueue</code> also drops its served slots (on empty, or when over half is served), so space is O(n), not O(n²).</p>

<h3 id="ex-14">Example 14 — Sliding window max (deque)</h3>
<p><strong>The problem:</strong> For <code>nums = [1, 3, -1, -3, 5, 3, 6, 7]</code> and k = 3, give the biggest number in every <a href="#/topic/dsa-words#w-window">window</a> (stretch) of 3 side-by-side numbers. Answer: <code>[3, 3, 5, 5, 6, 7]</code>.</p>
<p><strong>The idea:</strong> A <a href="#/topic/dsa-words#w-monotonic-deque">monotonic deque</a> of indexes whose values go down from front to back. Each step: (1) drop the front if it slid out of the window; (2) drop from the back every value smaller than the new one, since it can never be a max while the new one is in the window; (3) push the new index; (4) once a full window exists, the front is the max. To keep "drop the front" O(1) in JS, the code uses a <code>front</code> index instead of <code>shift()</code>.</p>
<div class="diagram"><pre>nums = [1, 3, -1, -3, 5, 3, 6, 7]   k = 3
index:  0  1   2   3  4  5  6  7

output so far    i  value  deque after (values)   note
[]               0  1      [0]   (1)
[]               1  3      [1]   (3)              1 &lt; 3: dropped
[3]              2  -1     [1,2] (3,-1)
[3,3]            3  -3     [1,2,3] (3,-1,-3)
[3,3,5]          4  5      [4]   (5)              1 slid out; rest &lt; 5
[3,3,5,5]        5  3      [4,5] (5,3)
[3,3,5,5,6]      6  6      [6]   (6)              all smaller: dropped
[3,3,5,5,6,7]    7  7      [7]   (7)</pre></div>
<pre><code class="language-js">function maxSlidingWindow(nums, k) {
  const result = [];
  const deque = []; // indexes; their values go down from front to back
  let front = 0; // deque[front] is the real front; earlier slots are removed
  for (let i = 0; i &lt; nums.length; i++) {
    // 1. the front index slid out of the window (i - k + 1 .. i)
    while (front &lt; deque.length &amp;&amp; deque[front] &lt;= i - k) {
      front++; // O(1) "pop front"
    }
    // 2. smaller values at the back can never be a window max again
    while (deque.length &gt; front &amp;&amp; nums[deque[deque.length - 1]] &lt; nums[i]) {
      deque.pop(); // O(1) "pop back"
    }
    deque.push(i);
    // 3. from the first full window on, the front holds the max
    if (i &gt;= k - 1) {
      result.push(nums[deque[front]]);
    }
  }
  return result;
}
console.log(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)); // [ 3, 3, 5, 5, 6, 7 ]
console.log(maxSlidingWindow([3, 1, 5, 2, 4, 1], 3)); // [ 5, 5, 5, 4 ]</code></pre>
<p><strong>Cost:</strong> time O(n): each index is pushed once and removed at most once (from the front or the back). Space: this simple version keeps the removed front slots in the array, so O(n); a real deque would hold at most k indexes, O(k).</p>

<h3 id="ex-15">Example 15 — Iterative DFS</h3>
<p><strong>The problem:</strong> Visit every node of a tree in <strong>preorder</strong> (node, then its left side, then its right side) without recursion. For the tree below: <code>[1, 2, 4, 5, 3, 6]</code>.</p>
<p><strong>The idea:</strong> Your own array plays the call stack. Pop a node, record it, then push its children. Push the <em>right</em> child first and the <em>left</em> child second: the stack hands back the last thing pushed, so the left child is handled first.</p>
<div class="diagram"><pre>Tree:        1
           /   \\
          2     3
         / \\     \\
        4   5     6

visited so far   popped  pushed (right, then left)  stack after
1                1       3, 2                       [3, 2]
1 2              2       5, 4                       [3, 5, 4]
1 2 4            4       -                          [3, 5]
1 2 4 5          5       -                          [3]
1 2 4 5 3        3       6                          [6]
1 2 4 5 3 6      6       -                          []</pre></div>
<pre><code class="language-js">function makeNode(val, left = null, right = null) {
  return { val: val, left: left, right: right };
}
const root = makeNode(1, makeNode(2, makeNode(4), makeNode(5)), makeNode(3, null, makeNode(6)));

function preorder(root) {
  if (root === null) {
    return [];
  }
  const visited = [];
  const stack = [root]; // our own call stack
  while (stack.length &gt; 0) {
    const node = stack.pop();
    visited.push(node.val);
    if (node.right !== null) {
      stack.push(node.right); // pushed first, so handled later
    }
    if (node.left !== null) {
      stack.push(node.left); // pushed last, so popped next: left goes first
    }
  }
  return visited;
}
console.log(preorder(root)); // [ 1, 2, 4, 5, 3, 6 ]</code></pre>
<p><strong>Cost:</strong> time O(n): each node is pushed and popped once. Space O(h) for the stack, where h is the tree's height; a very lopsided tree makes that O(n). Unlike recursion, a deep tree here can't cause a stack overflow: the array lives in normal memory.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>
<p>An <a href="#/topic/dsa-words#w-edge-case">edge case</a> is an unusual input at the limits: empty, one item, all the same, and so on. Each item below says what goes wrong, gives a tiny example, and gives the fix.</p>

<h3>1. JS array.shift() is O(n)</h3>
<p><strong>What goes wrong:</strong> <code>queue.shift()</code> removes item 0 and then moves every other item down one place. In a BFS over a big graph that is done once per node, so the total becomes about V × V moves.</p>
<p><strong>Tiny example:</strong> a BFS over 100,000 nodes with <code>shift()</code> can do around 5 billion moves; with a head index it does 100,000 steps.</p>
<p><strong>Fix:</strong> keep <code>let head = 0</code> and read <code>queue[head]</code>, then <code>head++</code> (as every BFS on this page does), or use a two-stack queue or a linked list.</p>

<h3>2. Empty stack pop</h3>
<p><strong>What goes wrong:</strong> <code>[].pop()</code> does not throw an error; it quietly returns <code>undefined</code>. That <code>undefined</code> then leaks into comparisons and maths.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const stack = [];
console.log(stack.pop()); // undefined  (no error is thrown)
const lowest = Math.min(4, stack[stack.length - 1]); // peeking at an empty stack
console.log(lowest); // NaN  (undefined sneaked into the maths)</code></pre>
<p><strong>Fix:</strong> check <code>stack.length === 0</code> before every <code>pop</code> or peek whose result you use, and decide what "empty" should mean for the problem.</p>

<h3>3. Monotonic direction</h3>
<p><strong>What goes wrong:</strong> using a stack that goes the wrong way gives answers for the wrong question.</p>
<p><strong>Tiny example:</strong> for "next greater" on <code>[2, 1, 5]</code>, a stack whose values go <em>up</em> would pop 2 when 1 arrives and record 1 as 2's "next greater", which is wrong.</p>
<p><strong>Fix:</strong> "next greater" → pop while the top is <em>smaller</em> than the new value, so values go down from bottom to top. "Next smaller" → pop while the top is <em>bigger</em>, so values go up. Say the direction out loud before coding.</p>

<h3>4. Storing indices vs values</h3>
<p><strong>What goes wrong:</strong> if the stack holds values, you can't work out how far apart two items are.</p>
<p><strong>Tiny example:</strong> in daily temperatures <code>[73, 74]</code>, a stack holding <code>73</code> knows the next warmer temperature is 74 but not that it is 1 day later. With repeated values you can't even tell which 73 it was.</p>
<p><strong>Fix:</strong> store the index <code>i</code>. The value is always <code>nums[i]</code>, and distances and widths come from subtracting indexes.</p>

<h3>5. BFS visited check on enqueue vs dequeue</h3>
<p><strong>What goes wrong:</strong> if you mark a node visited only when it is taken off the queue, two different nodes can both queue it before that happens. It gets queued more than once. With a "skip if already visited" check on dequeue it is still handled only once, but every extra copy is a wasted push and takes queue memory.</p>
<p><strong>Tiny example:</strong> in the diamond graph A → B, A → C, B → D, C → D, marking on dequeue queues D twice:</p>
<pre><code class="language-js">function countEnqueues(graph, start, markWhen) {
  const queue = [start];
  let head = 0;
  let enqueues = 1; // the start counts as one
  const visited = new Set();
  if (markWhen === "enqueue") {
    visited.add(start);
  }
  while (head &lt; queue.length) {
    const node = queue[head];
    head++;
    if (markWhen === "dequeue") {
      if (visited.has(node)) {
        continue; // a duplicate copy: skip it
      }
      visited.add(node);
    }
    for (const next of graph[node]) {
      if (!visited.has(next)) {
        if (markWhen === "enqueue") {
          visited.add(next);
        }
        queue.push(next);
        enqueues++;
      }
    }
  }
  return enqueues;
}
const graph = { A: ["B", "C"], B: ["D"], C: ["D"], D: [] };
console.log(countEnqueues(graph, "A", "dequeue")); // 5  (D is queued twice)
console.log(countEnqueues(graph, "A", "enqueue")); // 4  (each node once)</code></pre>
<p><strong>Fix:</strong> mark visited at the moment you push onto the queue. Then each node enters the queue exactly once.</p>

<h3>6. Deque implementation in JS</h3>
<p><strong>What goes wrong:</strong> JS has no built-in deque, and the obvious array methods for the front end (<code>unshift</code>, <code>shift</code>) are O(n).</p>
<p><strong>Tiny example:</strong> a sliding-window-max deque built with <code>shift()</code> on a window of 10,000 moves up to 9,999 items every time the front leaves.</p>
<p><strong>Fix:</strong> use a doubly linked list (the <code>Deque</code> class in Mechanics), or an array plus a <code>front</code> index (Example 14). For small inputs, plain <code>shift()</code> is acceptable if you say out loud that it is O(n).</p>

<h3>7. Stack-based recursion conversion</h3>
<p><strong>What goes wrong:</strong> recursion quietly remembers each call's local variables (like the current depth). When you switch to your own stack, you must store that state yourself, or it is lost.</p>
<p><strong>Tiny example:</strong> to find a tree's depth with a stack, pushing just the node forgets how deep it was. Push <code>[node, depth]</code> pairs instead:</p>
<pre><code class="language-js">function makeNode(val, left = null, right = null) {
  return { val: val, left: left, right: right };
}
const root = makeNode(1, makeNode(2, makeNode(4)), makeNode(3));

function maxDepth(root) {
  if (root === null) {
    return 0;
  }
  let deepest = 0;
  const stack = [[root, 1]]; // each entry remembers its own depth
  while (stack.length &gt; 0) {
    const [node, depth] = stack.pop();
    deepest = Math.max(deepest, depth);
    if (node.left !== null) {
      stack.push([node.left, depth + 1]);
    }
    if (node.right !== null) {
      stack.push([node.right, depth + 1]);
    }
  }
  return deepest;
}
console.log(maxDepth(root)); // 3</code></pre>
<p><strong>Fix:</strong> list everything the recursive version keeps in its parameters and local variables, and push all of it together.</p>

<h3>8. Reverse Polish vs infix</h3>
<p><strong>What goes wrong:</strong> the RPN stack trick only works when the operator comes <em>after</em> its numbers. Normal "infix" maths like <code>3 + 4 * 2</code> has operators in the middle and needs precedence rules (× before +) and brackets.</p>
<p><strong>Tiny example:</strong> feeding <code>["3", "+", "4", "*", "2"]</code> to <code>evalRPN</code> pops from a stack that has only one number. The answer is garbage, not 11.</p>
<p><strong>Fix:</strong> for infix, first convert to RPN with the Shunting-yard algorithm, which uses a stack to hold operators until their numbers have been output (<code>3 4 2 * +</code>), or use the "two stacks" method (one for numbers, one for operators). Don't treat the two kinds as the same problem.</p>

<h3>9. Min stack with duplicates</h3>
<p><strong>What goes wrong:</strong> if the helper stack only takes values that are <em>strictly smaller</em> (<code>&lt;</code>), a repeated minimum is stored once. Popping one copy then removes it from the helper too, and <code>getMin</code> is wrong.</p>
<p><strong>Tiny example:</strong> push 2, push 2, pop. One 2 is still in the stack, but a <code>&lt;</code>-only helper is now empty and <code>getMin()</code> returns <code>undefined</code>.</p>
<p><strong>Fix:</strong> use <code>&lt;=</code> so each copy of the minimum is pushed (Mechanics), or store the minimum for every level (Example 2), or store <code>[value, count]</code> pairs.</p>

<h3>10. Trapping water — stack vs two-pointer</h3>
<p><strong>What goes wrong:</strong> nothing is wrong with the stack (Example 5), but it uses O(n) extra memory, and interviewers often ask "can you do it in O(1) space?"</p>
<p><strong>Tiny example:</strong> the <a href="#/topic/dsa-words#w-two-pointers">two-pointer</a> version walks in from both ends. The side with the lower wall decides the water level there, so move that side inward:</p>
<pre><code class="language-js">function trapTwoPointers(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0; // tallest wall seen from the left so far
  let rightMax = 0; // tallest wall seen from the right so far
  let water = 0;
  while (left &lt; right) {
    if (height[left] &lt; height[right]) {
      // the right side has a taller wall, so the left max sets the level here
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];
      right--;
    }
  }
  return water;
}
console.log(trapTwoPointers([3, 0, 2, 0, 4])); // 7
console.log(trapTwoPointers([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6</code></pre>
<p><strong>Fix:</strong> both are O(n) time. Two pointers: O(1) extra space. Stack: O(n). Know both; lead with two pointers unless asked for the stack.</p>

<h3>11. Histograms with zero / negative heights</h3>
<p><strong>What goes wrong:</strong> the largest-rectangle code assumes heights are 0 or more. Zero is fine: a 0 bar just splits the chart, because no rectangle can cross it. A negative height has no meaning as a bar, and the code would give nonsense.</p>
<p><strong>Tiny example:</strong> <code>[2, 0, 2]</code> correctly gives 2. <code>[2, -1, 2]</code> isn't a valid chart.</p>
<p><strong>Fix:</strong> check or ask about the input range. Reject negatives, or treat them as 0 if the problem allows it.</p>

<h3>12. Decode string nesting depth</h3>
<p><strong>What goes wrong:</strong> a recursive decoder calls itself once per <code>[</code>. A string nested 50,000 levels deep (<code>"1[1[1[…]]]"</code>) would overflow the call stack.</p>
<p><strong>Tiny example:</strong> the stack version in Example 8 just pushes one pair per level into an array, which can hold millions.</p>
<p><strong>Fix:</strong> use the explicit stack when nesting may be deep, or mention the limit if you write it recursively.</p>

<h3>13. Asteroid collision — equal sizes</h3>
<p><strong>What goes wrong:</strong> two equal asteroids must <em>both</em> explode. A common slip is popping the top and then still pushing the new one, or checking <code>&lt;=</code> in the wrong branch.</p>
<p><strong>Tiny example:</strong> <code>[8, -8]</code> must give <code>[]</code>, not <code>[-8]</code>.</p>
<p><strong>Fix:</strong> three clear branches, as in Example 9: top smaller → pop and keep checking; equal → pop and the new one dies; top bigger → the new one dies.</p>

<h3>14. BFS for shortest path with weighted edges</h3>
<p><strong>What goes wrong:</strong> BFS counts <em>steps</em>, not cost. If edges have different costs (a <a href="#/topic/dsa-words#w-weighted">weighted</a> graph), the path with the fewest steps may not be the cheapest.</p>
<p><strong>Tiny example:</strong> A → B costs 10, A → C costs 1, C → B costs 1. BFS reaches B in 1 step (cost 10). The cheapest route is A → C → B, cost 2.</p>
<p><strong>Fix:</strong> with costs that are never negative, use Dijkstra's algorithm, which always expands the cheapest-so-far node using a <a href="#/topic/dsa-words#w-heap">heap</a>. With negative costs, use Bellman-Ford, which relaxes (improves) the cost estimate along every edge over and over, V − 1 times. With costs of only 0 or 1, use 0-1 BFS with a deque. More in the <a href="#/topic/dsa-words#w-shortest-path">shortest path</a> entry.</p>

<h3>15. Stack of mixed types</h3>
<p><strong>What goes wrong:</strong> a JS array happily holds numbers, strings and arrays together. If you push different kinds onto one stack, you can pop the wrong kind and JS will quietly glue a string and a number.</p>
<p><strong>Tiny example:</strong> a decoder that pushes the count <code>3</code> and the text <code>"ab"</code> as separate items might pop them in the wrong order and compute <code>"ab" + 3</code> = <code>"ab3"</code>.</p>
<p><strong>Fix:</strong> push one clear shape per entry, like the <code>[count, textBefore]</code> pair in Example 8, or keep two separate stacks.</p>

<h3>16. Empty string in valid parens</h3>
<p><strong>What goes wrong:</strong> some code returns <code>false</code> for <code>""</code> as a special case.</p>
<p><strong>Tiny example:</strong> <code>isValid("")</code> should be <code>true</code>: there is nothing unmatched.</p>
<p><strong>Fix:</strong> no special case is needed. The loop doesn't run, the stack is empty, and <code>stack.length === 0</code> returns <code>true</code>.</p>

<h3>17. Single open paren</h3>
<p><strong>What goes wrong:</strong> code that only checks closers never notices an opener that was never closed.</p>
<p><strong>Tiny example:</strong> <code>"("</code>: no closer appears, so no check fails, but the stack still holds <code>"("</code> at the end.</p>
<p><strong>Fix:</strong> finish with <code>return stack.length === 0;</code>, not <code>return true;</code>.</p>

<h3>18. Two-stack queue's amortized O(1)</h3>
<p><strong>What goes wrong:</strong> people either claim every dequeue is O(1) (false: one dequeue can pour n items) or call the queue O(n) (too pessimistic).</p>
<p><strong>Tiny example:</strong> enqueue 1,000 items, then dequeue once: that one dequeue pours 1,000 items. The next 999 dequeues pour nothing.</p>
<p><strong>Fix:</strong> say it precisely: the <em>worst single</em> dequeue is O(n), but each item is poured only once, so any n operations cost O(n) in total, which is <a href="#/topic/dsa-words#w-amortized">amortized</a> O(1) each. "Amortized" is a guarantee over the whole sequence; it is not the same as "average case", which is about typical inputs (see <a href="#/topic/dsa-words#w-worst-average-case">worst, average and best case</a>).</p>

<h3>19. Iterative inorder vs preorder vs postorder</h3>
<p><strong>What goes wrong:</strong> the three orders need different loop shapes, and mixing them up gives the wrong order.</p>
<p><strong>Tiny example:</strong> for the tree 1 (left 2, right 3), preorder is <code>[1, 2, 3]</code>, inorder is <code>[2, 1, 3]</code>, postorder is <code>[2, 3, 1]</code>.</p>
<p><strong>Fix:</strong> preorder: pop, record, push right then left (Example 15). Inorder: walk left pushing nodes, pop and record, then go right (Mechanics). Postorder: collect node-right-left and reverse it (Mechanics), or keep a "children done?" flag per stack entry.</p>

<h3>20. Sliding window max — push value not index</h3>
<p><strong>What goes wrong:</strong> if the deque holds values, you can't tell when the front has slid out of the window.</p>
<p><strong>Tiny example:</strong> <code>[5, 1, 1, 1]</code>, k = 2: the deque front is the value 5, but at i = 2 the window is <code>[1, 1]</code>. Without the index you don't know 5 is gone, and you'd report 5 again.</p>
<p><strong>Fix:</strong> push the index. Read the value with <code>nums[index]</code>, and drop the front when <code>index &lt;= i - k</code>.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — using arr.shift for queue</h3>
<p><strong>What goes wrong:</strong> each <code>shift()</code> is O(n), so a BFS that should be O(V + E) becomes O(V² + E).</p>
<p><strong>Tiny example:</strong> <code>while (queue.length) { const node = queue.shift(); … }</code> on a graph with a million nodes.</p>
<p><strong>Fix:</strong> head index, two-stack queue, or linked list.</p>

<h3>Anti-pattern 2 — not marking visited on enqueue</h3>
<p><strong>What goes wrong:</strong> marking on dequeue lets several paths queue the same node. That costs memory and repeats work.</p>
<p><strong>Tiny example:</strong> the diamond graph in Pitfall 5 queues D twice. On a grid, a cell can be queued by up to 4 neighbours.</p>
<p><strong>Fix:</strong> <code>visited.add(next)</code> on the same line where you <code>queue.push(next)</code>.</p>

<h3>Anti-pattern 3 — recursing for deep trees</h3>
<p><strong>What goes wrong:</strong> Chrome and Node don't do tail-call optimisation, and the call stack holds only about 10,000 calls. A recursive DFS on a 100,000-node chain crashes with "Maximum call stack size exceeded".</p>
<p><strong>Tiny example:</strong> a linked list stored as a tree where every node has only a left child, 100,000 deep.</p>
<p><strong>Fix:</strong> convert to a loop with your own array as the stack (Example 15, Pitfall 7).</p>

<h3>Anti-pattern 4 — storing values in monotonic stack</h3>
<p><strong>What goes wrong:</strong> many monotonic-stack problems need a distance or width, which only indexes give.</p>
<p><strong>Tiny example:</strong> daily temperatures and largest rectangle both compute <code>i - index</code>.</p>
<p><strong>Fix:</strong> store indexes by default. Store values only when you truly need nothing else and the values are all different (Example 4).</p>

<h3>Anti-pattern 5 — confusing peek with pop</h3>
<p><strong>What goes wrong:</strong> peek reads the top and leaves it there; pop reads it and removes it. Using pop to "just look" deletes an item.</p>
<p><strong>Tiny example:</strong> <code>if (stack.pop() &lt; x)</code> inside a <code>while</code> condition removes the top even when the test is false.</p>
<p><strong>Fix:</strong> peek with <code>stack[stack.length - 1]</code> (or <code>stack.at(-1)</code>) in conditions; <code>pop()</code> only once you've decided to remove.</p>

<h3>Anti-pattern 6 — using array as deque without measuring</h3>
<p><strong>What goes wrong:</strong> <code>unshift</code> and <code>shift</code> are O(n) each, so an "O(n)" deque algorithm can become O(n × k).</p>
<p><strong>Tiny example:</strong> sliding window max with <code>dq.shift()</code> on a big window.</p>
<p><strong>Fix:</strong> a front index or a real deque. If you do use <code>shift()</code> for small input, say its cost out loud.</p>

<h3>Anti-pattern 7 — string concat in expression eval</h3>
<p><strong>What goes wrong:</strong> building a long output with <code>result += piece</code> in a loop may copy the whole string every time, which is O(n²) in the worst case. V8 (Chrome, Node) often avoids the copy, but the language doesn't promise it.</p>
<p><strong>Tiny example:</strong> collecting the pieces in an array and joining once is always proportional to the total length:</p>
<pre><code class="language-js">const pieces = [];
for (let i = 0; i &lt; 3; i++) {
  pieces.push("ab"); // add each piece to an array
}
const output = pieces.join(""); // glue them together once at the end
console.log(output); // ababab</code></pre>
<p><strong>Fix:</strong> for big outputs, push pieces to an array and <code>join("")</code> once.</p>

<h3>Anti-pattern 8 — using Set as stack</h3>
<p><strong>What goes wrong:</strong> a <code>Set</code> does remember the order items were added, but it has no "remove the last one" method, and it can't hold the same value twice. A stack often needs both.</p>
<p><strong>Tiny example:</strong> pushing <code>"("</code> twice for <code>"(("</code> leaves only one <code>"("</code> in a Set, so <code>"(()"</code> would look balanced.</p>
<p><strong>Fix:</strong> use an array. Use a Set only for "have I seen this?" checks, like BFS's visited set.</p>

<h3>Anti-pattern 9 — forgetting empty check before pop</h3>
<p><strong>What goes wrong:</strong> popping an empty stack gives <code>undefined</code>, which can accidentally "match" something else that is also <code>undefined</code>.</p>
<p><strong>Tiny example:</strong> if the input can contain a character with no entry in the opener map, <code>openerFor[char]</code> is <code>undefined</code>, and so is <code>[].pop()</code>, so the bad check says they match:</p>
<pre><code class="language-js">const openerFor = { ")": "(", "]": "[", "}": "{" };

function closerMatchesBad(stack, char) {
  return stack.pop() === openerFor[char]; // undefined === undefined on empty!
}
function closerMatchesGood(stack, char) {
  if (stack.length === 0) {
    return false; // nothing open, so a closer can't match
  }
  return stack.pop() === openerFor[char];
}
console.log(closerMatchesBad([], "x")); // true  (wrong)
console.log(closerMatchesGood([], "x")); // false</code></pre>
<p><strong>Fix:</strong> check <code>stack.length === 0</code> first, always.</p>

<h3>Anti-pattern 10 — not using BFS for shortest path</h3>
<p><strong>What goes wrong:</strong> <a href="#/topic/dsa-words#w-dfs">DFS</a> dives down one path first, so the first time it reaches the goal may be by a long route.</p>
<p><strong>Tiny example:</strong> on the metro map in Example 10, a DFS from A might go A → B → D → C → E → F (5 steps) before trying A → B → D → F (3 steps).</p>
<p><strong>Fix:</strong> for fewest steps in an unweighted graph, use BFS: O(V + E), and the first arrival is the shortest.</p>

<h3>Anti-pattern 11 — flooding queue with duplicates</h3>
<p><strong>What goes wrong:</strong> with no visited check at all, a graph with a <a href="#/topic/dsa-words#w-cycle">cycle</a> (a loop of connections) is never finished: A queues B, B queues A, forever. Even without cycles, the number of queued copies can grow as fast as the number of different paths, which can be exponential.</p>
<p><strong>Tiny example:</strong> a chain of 30 diamonds (like the one in Pitfall 5) has 2³⁰ (about a billion) different paths from top to bottom.</p>
<p><strong>Fix:</strong> a visited set, marked on enqueue.</p>

<h3>Anti-pattern 12 — wrong order pushing left/right in iterative DFS</h3>
<p><strong>What goes wrong:</strong> pushing left then right makes the stack hand back the right child first, so you get node-right-left instead of preorder.</p>
<p><strong>Tiny example:</strong> tree 1 (left 2, right 3): pushing left first gives <code>[1, 3, 2]</code> instead of <code>[1, 2, 3]</code>.</p>
<p><strong>Fix:</strong> push right first, then left (Example 15).</p>

<h3>Anti-pattern 13 — stack overflow on iterative DFS via array</h3>
<p><strong>What goes wrong:</strong> people sometimes worry that an iterative DFS can "stack overflow" too. It can't in the same way: your array lives in normal (heap) memory, not the heap data structure, and not the small call stack.</p>
<p><strong>Tiny example:</strong> an array stack holding 1,000,000 nodes is fine; 1,000,000 nested recursive calls is not.</p>
<p><strong>Fix:</strong> this is the main reason to write DFS iteratively. The only limit is total memory.</p>

<h3>Anti-pattern 14 — missing index slide-out in monotonic deque</h3>
<p><strong>What goes wrong:</strong> if you never drop the front when it leaves the window, an old big value stays the "max" forever.</p>
<p><strong>Tiny example:</strong> <code>[9, 1, 2, 3]</code>, k = 2: without the slide-out step every window reports 9; the right answer is <code>[9, 2, 3]</code>.</p>
<p><strong>Fix:</strong> each step, drop the front while <code>deque[front] &lt;= i - k</code> (Example 14).</p>

<h3>Anti-pattern 15 — over-engineering simple stack/queue</h3>
<p><strong>What goes wrong:</strong> writing a full linked-list deque class for a queue that never holds more than a few dozen items wastes interview time.</p>
<p><strong>Tiny example:</strong> a BFS over a 3 × 3 grid is fine with a plain array.</p>
<p><strong>Fix:</strong> for small data, a plain array (even with <code>shift()</code>) is fine. Mention the O(n) cost and the fix in one sentence, and build the custom structure only when the size calls for it.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. When to use a stack?</div>
  <div class="qa-answer">
    <p>Whenever the <em>most recent</em> unfinished thing is the one you need next, like the top plate on a pile:</p>
    <ul>
      <li>Matching the latest opener with its closer (brackets, HTML tags).</li>
      <li>Turning recursion into a loop (your array replaces the call stack).</li>
      <li>Monotonic stack for "next greater / next smaller".</li>
      <li>Evaluating expressions in Reverse Polish Notation.</li>
      <li>Undo / redo history, the browser's back button.</li>
      <li>DFS without recursion.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. When to use a queue?</div>
  <div class="qa-answer">
    <p>Whenever things must be handled in the order they arrived, like a ticket line:</p>
    <ul>
      <li>BFS: reading a tree level by level.</li>
      <li>Fewest steps between two places in an unweighted graph.</li>
      <li>Producer-consumer setups: one part of a program adds jobs, another takes them in order.</li>
      <li>Task scheduling, print queues, message queues.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why is array.shift() bad for queue?</div>
  <div class="qa-answer">
    <p>Because it is O(n): after removing item 0, every other item moves down one place so the array starts at 0 again. In a BFS over a graph with a million nodes, that moving dominates everything, and the BFS becomes O(V² + E) instead of O(V + E). The fixes: a head index, a two-stack queue, or a doubly linked list. The head index is the simplest:</p>
<pre><code class="language-js">class Queue {
  constructor() {
    this.items = []; // everyone who has joined, in order
    this.head = 0; // index of the person at the front
  }
  enqueue(value) {
    this.items.push(value); // O(1)
  }
  dequeue() {
    if (this.head &gt;= this.items.length) {
      return undefined; // empty
    }
    const value = this.items[this.head];
    this.head++; // move the front marker; nobody shifts
    // now and then, drop the served part so memory doesn't grow forever
    if (this.head &gt; 50 &amp;&amp; this.head &gt; this.items.length / 2) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return value;
  }
  get size() {
    return this.items.length - this.head;
  }
}
const line = new Queue();
line.enqueue("a");
line.enqueue("b");
console.log(line.dequeue()); // a
console.log(line.size); // 1</code></pre>
    <p>Dequeue is amortized O(1): the occasional <code>slice</code> copies at most as many items as were dequeued since the last one.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Implement Min Stack.</div>
  <div class="qa-answer">
    <p>Keep a second stack where each level stores "the smallest value from the bottom up to here". The top of that stack is always the current minimum.</p>
<pre><code class="language-js">class MinStack {
  constructor() {
    this.stack = []; // the real values
    this.minSoFar = []; // minSoFar[i] = smallest of stack[0..i]
  }
  push(value) {
    this.stack.push(value);
    if (this.minSoFar.length === 0) {
      this.minSoFar.push(value);
    } else {
      const currentMin = this.minSoFar[this.minSoFar.length - 1];
      this.minSoFar.push(Math.min(value, currentMin));
    }
  }
  pop() {
    this.minSoFar.pop(); // both stacks stay the same height
    return this.stack.pop();
  }
  top() {
    return this.stack[this.stack.length - 1];
  }
  getMin() {
    return this.minSoFar[this.minSoFar.length - 1];
  }
}
const log = new MinStack();
log.push(5);
log.push(3);
log.push(3);
log.pop();
console.log(log.getMin()); // 3  (the other 3 is still there)
log.pop();
console.log(log.getMin()); // 5</code></pre>
    <p>All operations O(1) time; O(n) space. A space-saving variant pushes onto the helper only when <code>value &lt;= currentMin</code>; use <code>&lt;=</code>, not <code>&lt;</code>, or repeated minimums break.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Daily temperatures (monotonic stack).</div>
  <div class="qa-answer">
    <p>For each day, how many days until a warmer one? Keep a stack of day indexes still waiting; their temperatures go down from bottom to top. A warmer day pops every cooler day on top and fills in their wait.</p>
<pre><code class="language-js">function dailyTemperatures(temps) {
  const answer = new Array(temps.length).fill(0); // 0 = no warmer day ahead
  const stack = []; // indexes of days still waiting
  for (let today = 0; today &lt; temps.length; today++) {
    while (stack.length &gt; 0 &amp;&amp; temps[stack[stack.length - 1]] &lt; temps[today]) {
      const waitingDay = stack.pop();
      answer[waitingDay] = today - waitingDay; // distance in days
    }
    stack.push(today);
  }
  return answer;
}
console.log(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73])); // [ 1, 1, 4, 2, 1, 1, 0, 0 ]</code></pre>
    <p>O(n) time: each index is pushed once and popped at most once, so the inner loop runs at most n times in total. O(n) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Implement Queue using two Stacks.</div>
  <div class="qa-answer">
    <p>An inbox stack for arrivals and an outbox stack for leaving. When the outbox is empty, pour the inbox into it; pouring flips the order, so the oldest item ends on top.</p>
<pre><code class="language-js">class MyQueue {
  constructor() {
    this.inbox = [];
    this.outbox = []; // oldest item on top
  }
  push(value) {
    this.inbox.push(value);
  }
  pop() {
    this.peek(); // fill the outbox if needed
    return this.outbox.pop();
  }
  peek() {
    if (this.outbox.length === 0) {
      while (this.inbox.length &gt; 0) {
        this.outbox.push(this.inbox.pop()); // pour: reverses the order
      }
    }
    return this.outbox[this.outbox.length - 1];
  }
  empty() {
    return this.inbox.length === 0 &amp;&amp; this.outbox.length === 0;
  }
}
const queue = new MyQueue();
queue.push(1);
queue.push(2);
console.log(queue.pop()); // 1
queue.push(3);
console.log(queue.pop()); // 2
console.log(queue.pop()); // 3</code></pre>
    <p>All operations amortized O(1). One <code>pop</code> can pour n items (O(n) worst single call), but each item is poured only once, so n operations cost O(n) in total.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Valid parentheses.</div>
  <div class="qa-answer">
    <p>Push openers. Each closer must match the opener on top; check for an empty stack first. At the end the stack must be empty.</p>
<pre><code class="language-js">function isValid(text) {
  const openerFor = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const char of text) {
    if (char in openerFor) {
      if (stack.length === 0) {
        return false; // a closer with nothing open
      }
      const lastOpen = stack.pop();
      if (lastOpen !== openerFor[char]) {
        return false; // wrong kind
      }
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0; // leftovers were never closed
}
console.log(isValid("()[]{}")); // true
console.log(isValid("([)]")); // false
console.log(isValid("")); // true</code></pre>
    <p>O(n) time, O(n) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. BFS template.</div>
  <div class="qa-answer">
<pre><code class="language-js">function bfsOrder(graph, start) {
  const order = [];
  const queue = [start];
  let head = 0; // front of the queue, instead of shift()
  const visited = new Set([start]);
  while (head &lt; queue.length) {
    const node = queue[head];
    head++;
    order.push(node); // process the node
    for (const next of graph[node]) {
      if (!visited.has(next)) {
        visited.add(next); // mark on enqueue
        queue.push(next);
      }
    }
  }
  return order;
}
const graph = { A: ["B", "C"], B: ["A", "D"], C: ["A", "D"], D: ["B", "C"] };
console.log(bfsOrder(graph, "A")); // [ 'A', 'B', 'C', 'D' ]</code></pre>
    <p>Mark visited at enqueue time. For shortest path, store <code>[node, steps]</code> pairs (or a distance map) and return the steps when you dequeue the goal. O(V + E) time, O(V) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Largest rectangle in histogram.</div>
  <div class="qa-answer">
    <p>Keep a stack of bar indexes whose heights go up from bottom to top. When a shorter bar arrives, each taller bar popped has found how far it can stretch: right up to the new bar, and left to just after the bar now below it. A final height-0 <a href="#/topic/dsa-words#w-sentinel">sentinel</a> pops whatever is left.</p>
<pre><code class="language-js">function largestRectangleArea(heights) {
  const stack = []; // indexes; heights go up bottom → top
  let best = 0;
  for (let i = 0; i &lt;= heights.length; i++) {
    let currentHeight = 0; // the sentinel round, when i === heights.length
    if (i &lt; heights.length) {
      currentHeight = heights[i];
    }
    while (stack.length &gt; 0 &amp;&amp; heights[stack[stack.length - 1]] &gt; currentHeight) {
      const barIndex = stack.pop();
      let width = i; // nothing shorter on the left
      if (stack.length &gt; 0) {
        width = i - stack[stack.length - 1] - 1;
      }
      best = Math.max(best, heights[barIndex] * width);
    }
    stack.push(i);
  }
  return best;
}
console.log(largestRectangleArea([2, 1, 5, 6, 2, 3])); // 10</code></pre>
    <p>O(n) time, O(n) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Decode string with k[encoded].</div>
  <div class="qa-answer">
    <p>On <code>[</code>, save the current text and the repeat count on a stack and start fresh. On <code>]</code>, pop them and build <code>textBefore + current repeated count times</code>.</p>
<pre><code class="language-js">function decodeString(text) {
  const stack = []; // saved [repeatCount, textBefore] pairs
  let current = "";
  let count = 0;
  for (const char of text) {
    if (char &gt;= "0" &amp;&amp; char &lt;= "9") {
      count = count * 10 + Number(char); // multi-digit counts like "12"
    } else if (char === "[") {
      stack.push([count, current]);
      count = 0;
      current = "";
    } else if (char === "]") {
      const [repeatCount, textBefore] = stack.pop();
      current = textBefore + current.repeat(repeatCount);
    } else {
      current += char;
    }
  }
  return current;
}
console.log(decodeString("3[a2[c]]")); // accaccacc</code></pre>
    <p>Time grows with the length of the decoded output; extra space is the output plus one pair per nesting level.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Iterative DFS.</div>
  <div class="qa-answer">
    <p>Your own array is the call stack. Pop, record, then push right before left so left comes out first (preorder).</p>
<pre><code class="language-js">function makeNode(val, left = null, right = null) {
  return { val: val, left: left, right: right };
}
const root = makeNode(1, makeNode(2, makeNode(4), makeNode(5)), makeNode(3, null, makeNode(6)));

function preorder(root) {
  if (root === null) {
    return [];
  }
  const visited = [];
  const stack = [root];
  while (stack.length &gt; 0) {
    const node = stack.pop();
    visited.push(node.val);
    if (node.right !== null) {
      stack.push(node.right);
    }
    if (node.left !== null) {
      stack.push(node.left); // pushed last → popped first → preorder
    }
  }
  return visited;
}
console.log(preorder(root)); // [ 1, 2, 4, 5, 3, 6 ]</code></pre>
    <p>O(n) time, O(h) stack space for a tree of height h. No stack-overflow risk, because the array lives in normal memory.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Sliding window maximum (deque).</div>
  <div class="qa-answer">
    <p>A monotonic deque of indexes whose values go down from front to back. Drop the front when it slides out; drop smaller values from the back; the front is the window's max.</p>
<pre><code class="language-js">function maxSlidingWindow(nums, k) {
  const result = [];
  const deque = []; // indexes; values go down front → back
  let front = 0; // index of the real front inside the deque array
  for (let i = 0; i &lt; nums.length; i++) {
    while (front &lt; deque.length &amp;&amp; deque[front] &lt;= i - k) {
      front++; // the front slid out of the window
    }
    while (deque.length &gt; front &amp;&amp; nums[deque[deque.length - 1]] &lt; nums[i]) {
      deque.pop(); // smaller values can never be a max again
    }
    deque.push(i);
    if (i &gt;= k - 1) {
      result.push(nums[deque[front]]);
    }
  }
  return result;
}
console.log(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)); // [ 3, 3, 5, 5, 6, 7 ]</code></pre>
    <p>O(n) time: each index is added once and removed at most once. Using <code>front++</code> instead of <code>shift()</code> keeps "remove from front" O(1). A real deque would use O(k) space; this simple array version keeps old slots, so O(n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Number of islands (BFS).</div>
  <div class="qa-answer">
    <p>Scan every cell. Each time you find unvisited land, count a new island and BFS from it, sinking (marking) every connected land cell so it is never counted again. The number of BFS starts is the number of islands.</p>
<pre><code class="language-js">function numIslands(grid) {
  if (grid.length === 0) {
    return 0;
  }
  const land = grid.map(row =&gt; row.slice()); // copy: don't change the caller's grid
  const rows = land.length;
  const cols = land[0].length;
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let islands = 0;
  for (let r = 0; r &lt; rows; r++) {
    for (let c = 0; c &lt; cols; c++) {
      if (land[r][c] !== "1") {
        continue;
      }
      islands++;
      land[r][c] = "0"; // sink on enqueue
      const queue = [[r, c]];
      let head = 0;
      while (head &lt; queue.length) {
        const [row, col] = queue[head];
        head++;
        for (const [dRow, dCol] of directions) {
          const nextRow = row + dRow;
          const nextCol = col + dCol;
          const inside = nextRow &gt;= 0 &amp;&amp; nextRow &lt; rows &amp;&amp; nextCol &gt;= 0 &amp;&amp; nextCol &lt; cols;
          if (inside &amp;&amp; land[nextRow][nextCol] === "1") {
            land[nextRow][nextCol] = "0";
            queue.push([nextRow, nextCol]);
          }
        }
      }
    }
  }
  return islands;
}
const map = [
  ["1", "1", "0", "0", "0"],
  ["1", "1", "0", "0", "0"],
  ["0", "0", "1", "0", "0"],
  ["0", "0", "0", "1", "1"],
];
console.log(numIslands(map)); // 3</code></pre>
    <p>O(m × n) time and space for an m × n grid.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Recursion vs iterative — when prefer iterative?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Very deep recursion:</strong> the call stack holds only about 10,000 calls in Node, and Chrome/Node don't do tail-call optimisation, so deep recursion crashes with a stack overflow.</li>
      <li><strong>Pausing and resuming:</strong> an iterator that hands out one node at a time is easy when the stack is your own array.</li>
      <li><strong>Speed:</strong> each function call has a small overhead; a loop avoids it.</li>
      <li><strong>Debugging:</strong> all the state is in one array you can print.</li>
    </ul>
    <p>Iterative tree traversals use an explicit stack (Example 15). BFS is naturally iterative, because it uses a queue, not the call stack. Recursion is still fine, and often clearer, when the depth is small (like a balanced tree, about 20 levels for a million nodes).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What's a monotonic stack good for?</div>
  <div class="qa-answer">
    <p>Problems where, for each item, you need the next (or previous) item that is bigger (or smaller). The slow way searches from each item, O(n²). The stack keeps only the items still waiting for an answer, in going-up or going-down order; a new item pops every waiting item it answers. Each item is pushed once and popped at most once, so it is O(n).</p>
    <p>Classic uses: daily temperatures, next greater element, largest rectangle in a histogram, trapping rain water, and stock span (how many days in a row up to today the price was at most today's price).</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You say <code>arr.shift()</code> is O(n) and use a head index or two stacks for big queues.</li>
    <li>You store indexes in monotonic stacks when you need a width or a distance.</li>
    <li>You mark BFS nodes visited on enqueue.</li>
    <li>You switch recursion to a loop with your own stack for deep trees.</li>
    <li>You pick the right direction: values going up for "next smaller", going down for "next greater".</li>
    <li>You use a monotonic deque for sliding window max in O(n).</li>
    <li>You check for an empty stack before popping.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. What are the core operations of a stack and a queue, and what do they cost in JavaScript?</div>
  <div class="qa-answer">
    <p><strong>Stack</strong> (LIFO, a pile of plates): push, pop and peek, all at one end. A plain array does it: <code>push</code> is amortized O(1) (the array occasionally grows and copies itself), <code>pop</code> and <code>arr.at(-1)</code> are O(1).</p>
    <p><strong>Queue</strong> (FIFO, a ticket line): enqueue at the back, dequeue from the front. <code>push</code> is fine for enqueue, but <code>shift()</code> is O(n) because every other item moves down. So use a head index (O(1), or amortized O(1) with tidy-ups), a two-stack queue (amortized O(1)), or a linked list (O(1)).</p>
    <p><strong>Deque</strong> needs O(1) at both ends. JS has none built in, so use a doubly linked list or a circular buffer (ring array). An array plus a <code>front</code> index is enough when you only remove from the front, as in sliding max.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q17. Why does BFS mark a node visited when it is enqueued rather than when it is dequeued?</div>
  <div class="qa-answer">
    <p>If you mark only on dequeue, a node that several nodes point to gets queued once per path before any copy is taken out. The queue fills with duplicates. With a skip-if-visited check on dequeue, each node is still handled once and time stays O(V + E), but the queue can hold up to O(E) copies instead of O(V) nodes, and every copy is a wasted push. Without that check, the node is handled more than once. Marking on enqueue means each node enters the queue exactly once. A diamond graph shows it:</p>
<pre><code class="language-js">function countEnqueues(graph, start, markWhen) {
  const queue = [start];
  let head = 0;
  let enqueues = 1; // the start counts as one
  const visited = new Set();
  if (markWhen === "enqueue") {
    visited.add(start);
  }
  while (head &lt; queue.length) {
    const node = queue[head];
    head++;
    if (markWhen === "dequeue") {
      if (visited.has(node)) {
        continue; // a duplicate copy
      }
      visited.add(node);
    }
    for (const next of graph[node]) {
      if (!visited.has(next)) {
        if (markWhen === "enqueue") {
          visited.add(next);
        }
        queue.push(next);
        enqueues++;
      }
    }
  }
  return enqueues;
}
const graph = { A: ["B", "C"], B: ["D"], C: ["D"], D: [] };
console.log(countEnqueues(graph, "A", "dequeue")); // 5  (D queued twice)
console.log(countEnqueues(graph, "A", "enqueue")); // 4  (each node once)</code></pre>
  </div>
</div>
` },

  ]
});
