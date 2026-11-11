// Complexity Analysis, rewritten in plain English (Nov 2026). Main picture: a party guest list.
// "How much more work do I do when the guest list doubles?" is the whole question Big-O answers.
// n is always "how many guests" (the size of the input). DSA words link to #/topic/dsa-words#w-<slug>.
window.PREP_SITE.registerTopic({
  id: "dsa-complexity",
  module: "dsa",
  title: "Complexity Analysis",
  estimatedReadTime: "45 min",
  tags: ["dsa","complexity","big-o","time","space","amortized","asymptotic"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><a href="#/topic/dsa-words#w-big-o">Big-O</a> answers one question: <strong>when the input doubles, how much more work does the code do?</strong> Keep only the biggest part of the step count, drop the fixed numbers, and always say the extra memory too.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>It is a growth label, not a stopwatch.</strong> n is the <a href="#/topic/dsa-words#w-input-size">input size</a> (how many items). Big-O says how the step count grows with n, not how many seconds it takes.</li>
    <li><strong>Drop fixed numbers and smaller parts:</strong> <code>3n² + 5n + 7</code> steps is <code>O(n²)</code>. For big n, the n² part swamps the rest.</li>
    <li><strong>The ladder, fastest to slowest:</strong> <a href="#/topic/dsa-words#w-o-1">O(1)</a> array read, Map lookup &lt; <a href="#/topic/dsa-words#w-o-log-n">O(log n)</a> halving, like <a href="#/topic/dsa-words#w-binary-search">binary search</a> &lt; <a href="#/topic/dsa-words#w-o-n">O(n)</a> one loop &lt; <a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a> good sorting &lt; <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a> loop inside a loop &lt; <a href="#/topic/dsa-words#w-o-2-n">O(2ⁿ)</a> every subset, naive Fibonacci &lt; <a href="#/topic/dsa-words#w-o-n-factorial">O(n!)</a> every ordering.</li>
    <li><strong>Always give time AND space.</strong> <a href="#/topic/dsa-words#w-space-complexity">Space</a> = extra memory you create, not the input. <a href="#/topic/dsa-words#w-recursion">Recursion</a> uses one <a href="#/topic/dsa-words#w-call-stack">call stack</a> slot per open call, so depth d costs O(d) space. Most engines (V8 in Chrome/Node) don't recycle those slots (Safari does, for tail calls), so very deep recursion crashes with <code>RangeError</code>.</li>
    <li><strong>Rough size limits</strong> (about 1 second of work): O(n²) is fine up to about 10,000 items, O(2ⁿ) up to about 20–30, O(n!) up to about 10–12. These are rough rules of thumb.</li>
    <li><strong><a href="#/topic/dsa-words#w-amortized">Amortized</a></strong> = the average cost per step over a long run. <code>push</code> sometimes copies the whole array, but N pushes do under 3N work in total, so each push is O(1) amortized. That is not the same as "average case" (which means "on a typical random input").</li>
    <li><strong><a href="#/topic/dsa-words#w-worst-average-case">Worst vs average</a>:</strong> quicksort (a common sort that splits the list around one chosen item) is O(n log n) on average but O(n²) at worst; a Map lookup is O(1) on average but O(n) at worst. Say both.</li>
    <li><strong><a href="#/topic/dsa-words#w-master-theorem">Master Theorem</a></strong> shortcuts for recursion: merge sort (sort each half, then merge them: 2 half-size calls + n work) → O(n log n); binary search (1 half-size call + a little work) → O(log n).</li>
    <li><strong>The log's base does not matter:</strong> log₂ n, log₁₀ n and ln n differ by a fixed multiplier, so all are O(log n).</li>
    <li><strong>Two inputs, two letters:</strong> say O(a + b), or O(V + E) for a graph. Don't squash them into one n.</li>
    <li><strong><a href="#/topic/dsa-words#w-memoization">Memoization</a></strong> (saving answers you already worked out) turns naive Fibonacci from O(2ⁿ) into O(n) time, at the price of O(n) memory. That is a <a href="#/topic/dsa-words#w-trade-off">trade-off</a>.</li>
    <li><strong>Fixed costs still matter for small n:</strong> a simple O(n²) sort beats merge sort under about 20 items.</li>
    <li><strong>JS hidden costs:</strong> <code>shift</code>, <code>unshift</code>, <code>splice</code>, <code>includes</code>, <code>indexOf</code> are O(n). <code>includes</code> inside a loop makes O(n²). <code>Set.has</code> and <code>Map.get</code> are O(1) on average.</li>
  </ul>
  <h4>Complexity &amp; when to reach for it</h4>
  <ul>
    <li><strong>Read time off the code's shape:</strong> one loop → O(n). Loop inside a loop over the same items → O(n²). Halving each step → O(log n). Split in half, solve both halves, merge in one pass → O(n log n). Two recursive calls per call with no saved answers → O(2ⁿ).</li>
    <li><strong>Space:</strong> new arrays, Maps and Sets you build, PLUS recursion depth. A <a href="#/topic/dsa-words#w-tree">tree</a> walk costs O(h), h = the tree's height: O(log n) if it is <a href="#/topic/dsa-words#w-balanced">balanced</a>, O(n) if it is one long chain.</li>
    <li><strong>Signal → tool:</strong> "how does it scale?" → Big-O. "Usually fast, sometimes slow" → amortized. A recursion that splits into equal parts → Master Theorem. The same small question solved again and again → memoize.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Counting only the loops you can see.</strong> A built-in call inside a loop has its own cost. <code>arr.includes</code>, <code>shift</code> or <code>splice</code> inside a loop are each O(n), so the loop becomes O(n²). Building a string with <code>s += x</code> in a loop can copy the whole string each time. And recursion costs stack space even when you create no arrays. Fix: write down the cost of every built-in call inside a loop, and add the recursion depth to your space answer.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Big-O is how the work grows as the input grows. I keep the biggest term and drop the fixed numbers."</div>
  <div class="revision-say">"I'll give both time and space. For space I count what I build plus the recursion depth, because most JavaScript engines, like V8 in Chrome and Node, don't reuse stack frames."</div>
  <div class="revision-say">"I separate worst, average and amortized. Quicksort is O(n log n) on average but O(n²) at worst, and array push is O(1) amortized."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The picture: your party guest list doubles</h3>
<p>You are hosting a party. Think about three jobs:</p>
<ul>
  <li><strong>Unlock the door.</strong> One job, whether 10 guests come or 1,000.</li>
  <li><strong>Greet every guest.</strong> One handshake each. Twice the guests, twice the handshakes.</li>
  <li><strong>Introduce every guest to every other guest.</strong> 10 guests need 45 introductions. 20 guests need 190. Twice the guests, about <em>four</em> times the work.</li>
</ul>
<p>Nobody cares how many seconds a handshake takes. What matters is the <strong>shape</strong>: when the list doubles, does the work stay flat, double, or quadruple? That shape is what <a href="#/topic/dsa-words#w-big-o">Big-O</a> describes.</p>
<p>In code, the guest list is an <a href="#/topic/dsa-words#w-array">array</a>, and we call its length <strong>n</strong>, the <a href="#/topic/dsa-words#w-input-size">input size</a>. The three jobs become:</p>
<ul>
  <li>Unlock the door → <a href="#/topic/dsa-words#w-o-1">O(1)</a>, "constant": the work does not grow with n at all.</li>
  <li>Greet everyone → <a href="#/topic/dsa-words#w-o-n">O(n)</a>, "linear": one loop over the array. Twice the items, twice the work.</li>
  <li>Introduce everyone → <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a>, "quadratic": a loop inside a loop. Twice the items, four times the work.</li>
</ul>
<p>How the running time grows is called <a href="#/topic/dsa-words#w-time-complexity">time complexity</a>. How the extra memory grows is called <a href="#/topic/dsa-words#w-space-complexity">space complexity</a>. Big-O is the label we use for both.</p>

<h3>A real problem: is anyone on the list twice?</h3>
<p>Your guest list has been copied from three WhatsApp groups. You want to know: <em>"Is any name on the list twice?"</em></p>
<p>For <code>["Asha", "Ben", "Chen", "Ben"]</code> the answer is yes: Ben.</p>

<h3>The slow way, counted in steps</h3>
<p>The first idea most people write: compare every guest with every guest after them.</p>
<pre><code class="language-js">function hasDuplicateSlow(guests) {
  let checks = 0; // count the comparisons so we can see the cost
  for (let i = 0; i &lt; guests.length; i++) {
    for (let j = i + 1; j &lt; guests.length; j++) {
      checks++;
      if (guests[i] === guests[j]) {
        console.log("checks made:", checks);
        return true;
      }
    }
  }
  console.log("checks made:", checks);
  return false;
}
console.log(hasDuplicateSlow(["Asha", "Ben", "Chen", "Dev"])); // checks made: 6, then false</code></pre>
<p>It is correct. Now count the work when there is <em>no</em> repeat (the slowest case). The first guest is compared with n − 1 others, the second with n − 2, and so on. In total that is about <strong>n × n / 2 checks</strong>.</p>
<ul>
  <li>4 guests: 6 checks. Instant.</li>
  <li>1,000 guests: about 500,000 checks. Still fine.</li>
  <li>100,000 guests (say, ticket holders at a concert): about <strong>5,000,000,000 checks</strong>. That is several seconds, maybe more.</li>
</ul>

<h3>What Big-O gives you</h3>
<p>Big-O lets you see that blow-up <em>before</em> you run anything. You look at the code, see a loop inside a loop over the same list, and say "O(n²): 100,000 items will be too slow".</p>
<p>Then you look for a better shape. A <a href="#/topic/dsa-words#w-hash-set">Set</a> remembers every name it has seen, and checking it costs about one step:</p>
<pre><code class="language-js">function hasDuplicateFast(guests) {
  const seen = new Set(); // names we have already met
  for (const name of guests) {
    if (seen.has(name)) {
      return true; // met this name before: a repeat
    }
    seen.add(name);
  }
  return false;
}
console.log(hasDuplicateFast(["Asha", "Ben", "Chen", "Ben"])); // true</code></pre>
<p>One pass: n steps. For 100,000 guests that is 100,000 steps instead of 5 billion. The price is memory: the Set can hold up to n names. So it is <strong>O(n) time and O(n) space</strong>, against O(n²) time and O(1) space for the slow way. That swap, memory for speed, is called a <a href="#/topic/dsa-words#w-trade-off">trade-off</a>.</p>

<h3>Why we measure complexity</h3>
<p>Two pieces of code can both give the right answer, and one can be 1,000 times faster on 10 million items. You cannot see that from a test with 5 items. Complexity analysis predicts how code behaves at scale, before users find out for you. In interviews, it is how you show you chose your approach on purpose.</p>

<h3>Big O — formal vs intuitive</h3>
<p><strong>The everyday meaning:</strong> "this code's work grows no faster than this shape, once n is big enough, ignoring fixed multipliers."</p>
<p><strong>The formal meaning</strong> (you may be asked): <code>f(n) = O(g(n))</code> if you can find a fixed number <code>c</code> and a starting size <code>n₀</code> so that <code>f(n) ≤ c × g(n)</code> for every <code>n ≥ n₀</code>. In words: past some size, f stays under a stretched copy of g.</p>
<p>Example: <code>f(n) = 3n² + 5n + 7</code>. Pick c = 4 and n₀ = 7. From n = 7 on, 3n² + 5n + 7 ≤ 4n² holds (at n = 7: 189 ≤ 196). So f is O(n²).</p>
<p><strong>For interviews:</strong> drop fixed multipliers and smaller terms. <code>3n² + 5n + 7</code> is <code>O(n²)</code>.</p>

<h3>Big Θ vs Big O vs Big Ω</h3>
<p>There are three related labels. Think of guessing someone's age:</p>
<ul>
  <li><strong>O ("big O")</strong> is a ceiling: "they are at most 40". The work grows <em>at most</em> this fast.</li>
  <li><strong>Ω ("big omega")</strong> is a floor: "they are at least 30". The work grows <em>at least</em> this fast.</li>
  <li><strong>Θ ("big theta")</strong> is both at once: "they are 35, give or take". The work grows <em>exactly</em> this fast, up to a fixed multiplier.</li>
</ul>
<p>Strictly, a single loop is also O(n²), because n² is a valid (but useless) ceiling. In practice, when people say "this is O(n)" they mean the tight answer, Θ(n). A ceiling far above the truth tells nobody anything.</p>

<h3>Why time AND space</h3>
<p>Fast code that needs too much memory can still fail, for example on a phone or a small server. So always give both. Recursion is the one people forget. Each call that has not finished yet waits on the <a href="#/topic/dsa-words#w-call-stack">call stack</a> (JavaScript's pile of open function calls). A recursive binary search takes O(log n) time and also O(log n) stack space. A recursive walk down a chain of n items takes O(n) stack space. Most engines (V8 in Chrome/Node) don't reuse stack slots for calls at the very end of a function (that reuse is called tail-call optimization); Safari does. So in practice the space is real.</p>

<h3>Why amortized matters</h3>
<p>Some operations are usually cheap but sometimes expensive. Think of a monthly metro pass: one big payment, then every ride is free. Spread over the month, each ride is cheap. Examples:</p>
<ul>
  <li><strong>Array <code>push</code>:</strong> usually O(1). When the array's reserved space is full, the engine copies everything into a block twice as big: O(n) that one time. Over N pushes the copying adds up to less than 2N, so each push is <strong>O(1) amortized</strong>.</li>
  <li><strong>Map / Set insert:</strong> usually O(1). When the table gets too full, it is rebuilt bigger (O(n)). Rare, so O(1) amortized.</li>
  <li><strong>Splay tree</strong> (a self-adjusting search tree): one lookup can take O(n), but any run of m lookups takes O(m log n) in total, so each is O(log n) amortized.</li>
</ul>
<p><a href="#/topic/dsa-words#w-amortized">Amortized</a> means the average cost per operation over a long run, on <em>any</em> input. It is not the same as "average case", which means the cost on a typical random input.</p>

<h3>Why "drop constants"</h3>
<p>Big-O is about the shape of growth. <code>2n</code> and <code>5n</code> are both straight lines: double the input, double the work. The 2 and the 5 depend on the computer, the language and the memory cache (a small, very fast store near the processor that holds recently used data), so Big-O leaves them out. <strong>But</strong> they still matter for real speed. If two O(n) solutions differ by 2×, the faster one is better, and you can say so.</p>

<h3>Why we ignore lower-order terms</h3>
<p>Look at <code>n² + n + 1</code> as n grows:</p>
<div class="diagram"><pre>share of n²   n          n²             n       1
91%           10         100            10      1
99%           100        10,000         100     1
99.9%         1,000      1,000,000      1,000   1</pre></div>
<p>By n = 1,000 the n² part is 99.9% of the work. The "lower-order" terms (the smaller pieces) stop mattering, so we write <code>O(n²)</code>, not <code>O(n² + n + 1)</code>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<p>The trick behind every Big-O answer is <strong>counting steps</strong>. A <strong>trace</strong> is a table of what happens at each step. The first column is always the running answer: here, the step count.</p>

<h3>The "loop counting" picture</h3>
<p>Trace of <code>hasDuplicateSlow</code> from What &amp; Why, on 4 guests with no repeat (the slowest case):</p>
<div class="diagram"><pre>guests = ["Asha", "Ben", "Chen", "Dev"]      n = 4
index:     0       1      2       3

checks  i  j  compare          same?
1       0  1  Asha vs Ben      no
2       0  2  Asha vs Chen     no
3       0  3  Asha vs Dev      no
4       1  2  Ben vs Chen      no
5       1  3  Ben vs Dev       no
6       2  3  Chen vs Dev      no

Total: 3 + 2 + 1 = 6 checks = 4 x 3 / 2
For n guests: n x (n - 1) / 2 checks, about n² / 2.
Drop the "/ 2": O(n²).</pre></div>
<p>Now the same question for bigger lists, next to the Set version (one step per guest):</p>
<div class="diagram"><pre>slow checks      Set steps   guests n
6                4           4
4,950            100         100
499,500          1,000       1,000
49,995,000       10,000      10,000

10x more guests: slow does about 100x more work, Set does 10x more.</pre></div>
<p>That last line is what Big-O captures. Here are the common loop shapes and their counts for n = 8:</p>
<div class="diagram"><pre>steps  code shape                              Big-O
1      read arr[i] once                        O(1)
3      halve 8 until 1: 8 -&gt; 4 -&gt; 2 -&gt; 1        O(log n)
8      one loop over n                         O(n)
16     two loops one after the other           O(n): 2n
24     8 items, 3 halving levels, n per level  O(n log n)
36     loop j from i to n inside loop i        O(n²): n(n+1)/2
64     loop j over n inside loop i over n      O(n²)
256    every subset (each item: in or out)     O(2ⁿ)
40,320 every ordering of 8 items (8!)          O(n!)</pre></div>

<h3>The "halving" picture: where log n comes from</h3>
<p><a href="#/topic/dsa-words#w-o-log-n">log n</a> sounds scary. It just means <strong>"how many times can you cut n in half before 1 is left?"</strong> Think of the "higher or lower" number game: always guess the middle, and you throw away half the numbers each time.</p>
<div class="diagram"><pre>halvings  numbers still possible
0         16
1         8
2         4
3         2
4         1      found it. 4 halvings = log₂ 16

1,000 numbers -&gt; about 10 halvings.
1,000,000 numbers -&gt; about 20 halvings.</pre></div>
<p>A million items, 20 steps. That is why O(log n) is "almost free".</p>

<h3>The "growth rate" picture</h3>
<p>Steps needed for each Big-O label as n grows:</p>
<div class="diagram"><pre>n          O(1)  O(log n)  O(n)   O(n log n)  O(n²)        O(2ⁿ)
10         1     3         10     33          100          1,024
100        1     7         100    664         10,000       ~10³⁰
1,000      1     10        1,000  9,966       1,000,000    too big
10,000     1     13        10K    132,877     100,000,000  too big
1,000,000  1     20        1M     20M         10¹²         too big

O(1) constant: free.        O(log n) logarithmic: nearly free.
O(n) linear: scales fine.   O(n log n) "n log n": still very good.
O(n²) quadratic: struggles past about 10,000 items.
O(2ⁿ) exponential: struggles past about 20-30 items.</pre></div>

<h3>The "common operations" cheat sheet</h3>
<p>What each basic data structure costs. "Access" = get the item at position i; "search" = find a value; "insert" / "delete" = add or remove one item. Each name links to its plain-words entry.</p>
<table>
  <thead><tr><th>Data structure</th><th>Access</th><th>Search</th><th>Insert</th><th>Delete</th></tr></thead>
  <tbody>
    <tr><td><a href="#/topic/dsa-words#w-array">Array</a></td><td>O(1)</td><td>O(n)</td><td>O(n) in the middle (everything after shifts), O(1) at the end</td><td>O(n) in the middle, O(1) at the end</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-sorted">Sorted</a> array</td><td>O(1)</td><td>O(log n) with binary search</td><td>O(n)</td><td>O(n)</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-linked-list">Linked list</a></td><td>O(n): walk from the start</td><td>O(n)</td><td>O(1) at the front</td><td>O(1) if you already hold the node</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-hash-map">Hash map</a> (Map, Set)</td><td>—</td><td>O(1) average, O(n) worst</td><td>O(1) average</td><td>O(1) average</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-bst">BST</a> (balanced)</td><td>—</td><td>O(log n)</td><td>O(log n)</td><td>O(log n)</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-heap">Heap</a></td><td>—</td><td>O(n) (O(1) to peek at the top)</td><td>O(log n)</td><td>O(log n) for the top item</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-trie">Trie</a></td><td>—</td><td>O(L), L = word length</td><td>O(L)</td><td>O(L)</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-stack">Stack</a> / <a href="#/topic/dsa-words#w-queue">queue</a> / <a href="#/topic/dsa-words#w-deque">deque</a></td><td>—</td><td>O(n)</td><td>O(1) at the ends</td><td>O(1) at the ends</td></tr>
  </tbody>
</table>

<h3>The "space" picture</h3>
<p>Space is the <em>extra</em> memory the code creates. The input itself does not count. Three cases:</p>
<pre><code class="language-js">// O(1) extra space: a few number variables, however long the array is
function reverseInPlace(items) {
  let left = 0;
  let right = items.length - 1;
  while (left &lt; right) {
    const temp = items[left]; // swap the two ends
    items[left] = items[right];
    items[right] = temp;
    left++;
    right--;
  }
  return items;
}
console.log(reverseInPlace([1, 2, 3, 4])); // [4, 3, 2, 1]

// O(n) extra space: builds a brand-new array of n items
function reversedCopy(items) {
  const copy = [];
  for (let i = items.length - 1; i &gt;= 0; i--) {
    copy.push(items[i]);
  }
  return copy;
}
console.log(reversedCopy([1, 2, 3, 4])); // [4, 3, 2, 1]

// O(depth) stack space: each open recursive call waits on the call stack
let deepest = 0;
function visit(node, depth) {
  if (node === null) {
    return;
  }
  deepest = Math.max(deepest, depth); // how many calls are open right now
  visit(node.left, depth + 1);
  visit(node.right, depth + 1);
}
// A "skewed" tree: every node has only a left child, so it is a chain of 4
const chain = { left: { left: { left: { left: null, right: null }, right: null }, right: null }, right: null };
visit(chain, 1);
console.log(deepest); // 4  (n nodes in a chain -&gt; n open calls: O(n) space)
// A balanced tree of n nodes is only about log₂ n deep: O(log n) space</code></pre>
<p>The first function swaps in place: it changes the array it was given and makes no copy. That is called <a href="#/topic/dsa-words#w-in-place">in-place</a>. The last one creates no arrays, but it still uses memory: one waiting call per level of the <a href="#/topic/dsa-words#w-tree">tree</a>.</p>

<h3>The "drop constants" picture</h3>
<div class="diagram"><pre>simplified   written as     why
O(n)         O(2n)          the fixed multiplier 2 is dropped
O(n)         O(n + 1000)    the fixed extra 1000 is dropped
O(n²)        O(n² + n)      n is the smaller term, dropped
O(n²)        O(3n² + 5n)    drop the 3, and 5n is smaller
O(log n)     O(log₂ n)      the log's base is a fixed multiplier</pre></div>

<h3>How to recognise which Big-O a question wants</h3>
<p>Interview questions often list <a href="#/topic/dsa-words#w-constraints">constraints</a>, the limits on the input, like "1 ≤ n ≤ 100,000". A computer does somewhere between 100 million and 1 billion simple steps per second. The limits below, and the others on this page, are rough rules of thumb, not exact cut-offs. So the limit on n tells you what speed is expected:</p>
<table>
  <thead><tr><th>If n can be up to…</th><th>You need about…</th><th>Typical approach</th></tr></thead>
  <tbody>
    <tr><td>10 or 12</td><td>O(n!) is OK</td><td>Try every ordering (<a href="#/topic/dsa-words#w-backtracking">backtracking</a>)</td></tr>
    <tr><td>20 to 30</td><td>O(2ⁿ) is OK</td><td>Try every <a href="#/topic/dsa-words#w-subset">subset</a></td></tr>
    <tr><td>500</td><td>O(n³)</td><td>Three nested loops</td></tr>
    <tr><td>10,000</td><td>O(n²)</td><td>Loop inside a loop</td></tr>
    <tr><td>100,000 to 1,000,000</td><td>O(n log n) or O(n)</td><td>Sort first, or one pass with a Map / Set</td></tr>
    <tr><td>Billions, or "n is huge"</td><td>O(log n) or O(1)</td><td>Binary search, or a formula</td></tr>
  </tbody>
</table>
<p>And to read the Big-O off code, look at its shape: count the nested loops over the same input, look for halving, check what each built-in call costs, and check how deep any recursion goes.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Big-O tells me how fast my code runs." It does not. It tells you how the work <em>grows</em>. Two O(n) solutions can differ 100× in real speed because of fixed costs (memory layout, caching, language overhead). When real speed matters, measure it.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>Here is how to work out a Big-O by hand, the code shapes you will meet, and the special cases: two inputs, recursion, amortized, worst vs average, and the real costs of JavaScript's built-in methods.</p>

<h3>How to analyze a function</h3>
<ol>
  <li><strong>Name n.</strong> What grows? The array length, the string length, the number of nodes?</li>
  <li><strong>Count steps as a formula in n.</strong> One loop over n is n. A loop inside it is n × n. Add the cost of every built-in call inside a loop.</li>
  <li><strong>Keep the biggest term.</strong> n² + n → n².</li>
  <li><strong>Drop the fixed multiplier.</strong> 3n² → n². Write O(n²).</li>
  <li><strong>Now do space separately:</strong> new arrays / Maps / Sets you build, plus the deepest the recursion goes.</li>
</ol>
<p>Worked example:</p>
<pre><code class="language-js">function summary(prices) {
  let total = 0;
  for (const price of prices) {
    total += price; // loop 1: n steps
  }
  const sorted = prices.slice().sort(function (a, b) { return a - b; }); // copy: n, sort: n log n
  const cheapest = sorted[0]; // 1 step
  return { total: total, cheapest: cheapest };
}
console.log(summary([40, 10, 30])); // { total: 80, cheapest: 10 }
// Steps: n + n + n log n + 1. Biggest term: n log n. Time O(n log n).
// Space: the sorted copy has n items. Space O(n).</code></pre>

<h3>Common patterns</h3>
<p>Each shape below counts its own steps, so you can see the number match the label. All use n = 8.</p>
<pre><code class="language-js">const n = 8;

// One loop -&gt; O(n)
let single = 0;
for (let i = 0; i &lt; n; i++) {
  single++;
}
console.log(single); // 8

// Loop inside a loop over the same n -&gt; O(n²)
let nested = 0;
for (let i = 0; i &lt; n; i++) {
  for (let j = 0; j &lt; n; j++) {
    nested++;
  }
}
console.log(nested); // 64

// Inner loop only covers what is left: n + (n-1) + ... + 1 = n(n+1)/2.
// That is about n² / 2, and halving is a fixed multiplier, so still O(n²).
let triangle = 0;
for (let i = 0; i &lt; n; i++) {
  for (let j = i; j &lt; n; j++) {
    triangle++;
  }
}
console.log(triangle); // 36

// Halve each round -&gt; O(log n)
let halvings = 0;
let remaining = n;
while (remaining &gt; 1) {
  remaining = Math.floor(remaining / 2);
  halvings++;
}
console.log(halvings); // 3  (8 -&gt; 4 -&gt; 2 -&gt; 1)</code></pre>
<p>The same ideas apply to recursion. Below, a search down a sorted tree (a <a href="#/topic/dsa-words#w-bst">binary search tree</a>: smaller values to the left, bigger to the right) goes down <em>one</em> path, so it costs the tree's height. A full walk (<a href="#/topic/dsa-words#w-dfs">DFS</a>, depth-first search) visits every node once, so it costs n.</p>
<pre><code class="language-js">// A small balanced search tree:      20
//                                   /    \
//                                 10      30
//                                /  \    /  \
//                               5   15  25   35
function makeNode(value, left, right) {
  return { value: value, left: left, right: right };
}
const root = makeNode(20,
  makeNode(10, makeNode(5, null, null), makeNode(15, null, null)),
  makeNode(30, makeNode(25, null, null), makeNode(35, null, null)));

// Search: one path from top to bottom -&gt; O(height).
// O(log n) when balanced, O(n) when the tree is one long chain.
let searchSteps = 0;
function search(node, target) {
  if (node === null) {
    return null; // fell off the bottom: not in the tree
  }
  searchSteps++;
  if (node.value === target) {
    return node;
  }
  if (target &lt; node.value) {
    return search(node.left, target); // smaller values live on the left
  }
  return search(node.right, target); // bigger values live on the right
}
search(root, 25);
console.log(searchSteps); // 3  (20, 30, 25)

// Full walk: every node once -&gt; O(n), even though each call makes 2 calls.
let visits = 0;
function walk(node) {
  if (node === null) {
    return;
  }
  visits++;
  walk(node.left);
  walk(node.right);
}
walk(root);
console.log(visits); // 7</code></pre>
<p>Why is the walk O(n) when naive Fibonacci (also two calls per call) is O(2ⁿ)? In a tree, the two calls go to <em>different</em> nodes, and each node is visited once. In Fibonacci, the two calls ask overlapping questions, so the same work is repeated again and again. More in Examples 5 and 6.</p>

<h3>Multi-variable complexity</h3>
<p>When there are two inputs of different sizes, give each its own letter.</p>
<pre><code class="language-js">// Which names are on both lists?
function intersect(listA, listB) {
  const inA = new Set(listA); // a steps to build, holds a names
  const both = [];
  for (const name of listB) { // b steps
    if (inA.has(name)) { // O(1) on average
      both.push(name);
    }
  }
  return both;
}
console.log(intersect(["Asha", "Ben", "Chen"], ["Chen", "Dev", "Asha", "Eli"])); // ["Chen", "Asha"]
// Time: O(a + b). Space: O(a) for the Set.</code></pre>
<p>Don't squash it into "O(n) where n = max(a, b)". O(a + b) tells the reader more: for example, that you should build the Set from the <em>smaller</em> list to save memory.</p>

<h3>Recursive analysis — Master Theorem</h3>
<p>Many fast recursive functions split the problem into equal parts. A <strong>recurrence</strong> is a formula for their work:</p>
<div class="diagram"><pre>T(n) = a T(n/b) + f(n)

T(n)   the total work for input size n
a      how many smaller calls each call makes
n/b    how big each smaller call is (b = 2 means half size)
f(n)   the work this call does itself (splitting, merging)</pre></div>
<p>The <a href="#/topic/dsa-words#w-master-theorem">Master Theorem</a> is a lookup chart for this formula. Write f(n) as n<sup>c</sup> and compare c with log<sub>b</sub> a. n<sup>log<sub>b</sub> a</sup> is how many tiny calls sit at the very bottom of the recursion.</p>
<p><strong>Limits of this simple form:</strong> it only works when f(n) is a plain power n<sup>c</sup>. Something like <code>T(n) = 2T(n/2) + n log n</code> (answer: O(n log² n)) needs the extended form of the theorem or a recursion-tree drawing like the one below. And it says nothing about recursions that shrink by subtracting, like <code>T(n) = T(n − 1) + n</code>; add those up level by level instead (here n + (n − 1) + … + 1 = O(n²)).</p>
<ul>
  <li><strong>c &lt; log<sub>b</sub> a</strong> (the bottom wins): <strong>T(n) = O(n<sup>log<sub>b</sub> a</sup>)</strong>.</li>
  <li><strong>c = log<sub>b</sub> a</strong> (every level does the same work): <strong>T(n) = O(n<sup>c</sup> log n)</strong>.</li>
  <li><strong>c &gt; log<sub>b</sub> a</strong> (the top call wins): <strong>T(n) = O(f(n))</strong>.</li>
</ul>
<p>The middle case is the common one. Here is merge sort on 8 items: 2 calls, each half size, plus n work to merge. Every level of the recursion does n work in total:</p>
<div class="diagram"><pre>merge work  level  pieces at this level
8           1      [4 items] [4 items]         merged into 8
8           2      [2] [2] [2] [2]             merged into 4 + 4
8           3      [1] [1] [1] [1] [1] [1] [1] [1]  merged into pairs

3 levels (= log₂ 8) x 8 work each = 24 = n log n</pre></div>
<p>Examples:</p>
<ul>
  <li><strong>Merge sort:</strong> <code>T(n) = 2T(n/2) + O(n)</code>. a = 2, b = 2, log₂ 2 = 1, c = 1. Tie → <code>O(n log n)</code>.</li>
  <li><strong>Binary search:</strong> <code>T(n) = T(n/2) + O(1)</code>. a = 1, b = 2, log₂ 1 = 0, c = 0. Tie → <code>O(n⁰ log n) = O(log n)</code>.</li>
  <li><strong>Karatsuba</strong> (a fast way to multiply huge numbers): <code>T(n) = 3T(n/2) + O(n)</code>. log₂ 3 ≈ 1.58 is bigger than c = 1, so the bottom wins → <code>O(n^1.58)</code>, better than the school method's O(n²).</li>
</ul>
<p>This pattern of splitting into parts, solving each, and combining is called <a href="#/topic/dsa-words#w-divide-and-conquer">divide and conquer</a>.</p>

<h3>Amortized analysis</h3>
<p>A JavaScript array grows when you <code>push</code>. Under the hood, the engine reserves a block of memory. When the block is full, it reserves one twice as big and copies everything across. Here is that idea as a small class that counts the copying:</p>
<pre><code class="language-js">class DynamicArray {
  constructor() {
    this.capacity = 1; // how many slots are reserved
    this.size = 0; // how many slots are used
    this.data = new Array(this.capacity);
    this.copies = 0; // total items ever copied, to measure the cost
  }
  push(value) {
    if (this.size === this.capacity) {
      // Full: reserve twice the room and copy every item across. O(size) this time.
      this.capacity = this.capacity * 2;
      const bigger = new Array(this.capacity);
      for (let i = 0; i &lt; this.size; i++) {
        bigger[i] = this.data[i];
        this.copies++;
      }
      this.data = bigger;
    }
    this.data[this.size] = value; // the normal, cheap O(1) part
    this.size++;
  }
}
const list = new DynamicArray();
for (let i = 1; i &lt;= 9; i++) {
  list.push(i);
}
console.log(list.copies); // 15  (copies of 1 + 2 + 4 + 8 items)
console.log(list.capacity); // 16</code></pre>
<div class="diagram"><pre>copies so far  push #  full?   copied now  capacity after
0              1       no      0           1
1              2       yes     1           2
3              3       yes     2           4
3              4       no      0           4
7              5       yes     4           8
7              6-8     no      0           8
15             9       yes     8           16</pre></div>
<p>The copies are 1 + 2 + 4 + 8 = 15 for 9 pushes. In general, the copies add up to less than 2N for N pushes, because each doubling copies only as many items as all the earlier doublings put together, plus one. Add the N normal writes: under 3N work for N pushes. Per push, that is a fixed amount: <strong>O(1) amortized</strong>, even though one single push can cost O(n).</p>

<h3>Worst case vs average case vs expected</h3>
<ul>
  <li><strong>Worst case:</strong> the cost on the unluckiest input. Quicksort that always picks a terrible pivot (the item it splits the list around; here the smallest item, say on already-sorted input): O(n²). A hash map where every key lands in the same slot: O(n) per lookup.</li>
  <li><strong>Average case:</strong> the cost on a typical random input. Quicksort: O(n log n). Hash map lookup: O(1).</li>
  <li><strong>Expected:</strong> the average over the code's <em>own</em> random choices, on any input. Quicksort with a random pivot is O(n log n) expected, even on a sorted input, because now bad luck depends on the dice, not on the input.</li>
</ul>
<p>In interviews, when they differ, say both: "O(1) on average, O(n) in the worst case". See <a href="#/topic/dsa-words#w-worst-average-case">worst, average and best case</a>.</p>

<h3>Time-space tradeoffs</h3>
<p>Often you can buy speed with memory, or save memory by spending time:</p>
<table>
  <thead><tr><th>Problem</th><th>Fastest way</th><th>Least-memory way</th></tr></thead>
  <tbody>
    <tr><td>Fibonacci</td><td>O(n) time with saved answers (O(n) memory)</td><td>O(n) time with two variables: O(1) memory. Best of both (Example 7)</td></tr>
    <tr><td>Find duplicates</td><td>O(n) time + O(n) for a Set</td><td>O(n²) time, O(1) memory (compare every pair)</td></tr>
    <tr><td>Sort</td><td>Merge sort: O(n log n) time, O(n) extra memory</td><td>Bubble sort: O(n²) time, O(1) extra memory (heap sort gets O(n log n) with O(1) extra)</td></tr>
  </tbody>
</table>

<h3>The "what does it mean for n to be large" picture</h3>
<p>Assume a computer does about 1 billion simple steps per second (1 step = 1 nanosecond). Then:</p>
<table>
  <thead><tr><th>n</th><th>O(n)</th><th>O(n log n)</th><th>O(n²)</th><th>O(2ⁿ)</th></tr></thead>
  <tbody>
    <tr><td>10</td><td>10 ns</td><td>33 ns</td><td>100 ns</td><td>1 µs</td></tr>
    <tr><td>1,000</td><td>1 µs</td><td>10 µs</td><td>1 ms</td><td>about 10²⁸⁴ years</td></tr>
    <tr><td>1,000,000</td><td>1 ms</td><td>20 ms</td><td>17 minutes</td><td>never</td></tr>
    <tr><td>1,000,000,000</td><td>1 s</td><td>30 s</td><td>32 years</td><td>never</td></tr>
  </tbody>
</table>
<p>(ns = nanosecond, µs = microsecond = 1,000 ns, ms = millisecond = 1,000 µs.) Practical limits: O(n²) struggles past about 10,000 items, O(2ⁿ) past about 20–30, O(n!) past about 12. These are rough rules of thumb.</p>

<h3>Common operation costs (JavaScript-specific)</h3>
<p>These are the hidden costs people miss. n is the array's length.</p>
<ul>
  <li><code>arr[i]</code> — O(1). Jump straight to the slot.</li>
  <li><code>arr.push(x)</code> — O(1) amortized (see above).</li>
  <li><code>arr.pop()</code> — O(1). Removes from the end; nothing moves.</li>
  <li><code>arr.shift()</code> / <code>arr.unshift(x)</code> — O(n). Removing or adding at the front moves every other item one place.</li>
  <li><code>arr.splice(i, count)</code> — O(n). Everything after position i moves.</li>
  <li><code>arr.slice()</code> — O(n). It copies (O(k) for k items copied).</li>
  <li><code>a.concat(b)</code> — O(n + m). It copies both arrays.</li>
  <li><code>arr.indexOf(x)</code> / <code>arr.includes(x)</code> — O(n). Checks items one by one.</li>
  <li><code>arr.sort()</code> — O(n log n).</li>
  <li><code>set.has(x)</code>, <code>map.get(k)</code>, <code>obj[key]</code> — O(1) on average. They use a <a href="#/topic/dsa-words#w-hash-function">hash function</a> to jump to the right slot.</li>
  <li><code>JSON.stringify(obj)</code> — O(size of the whole object).</li>
  <li><code>str1 + str2</code> — O(n + m) in the simple model: strings can't be changed (they are <a href="#/topic/dsa-words#w-immutable">immutable</a>), so joining makes a new string. Engines like V8 often avoid the copy with tricks, but you can't count on it.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<p>Fifteen classic pieces of code to analyse. Each one has the problem in plain words, the idea, a short trace, code you can paste into a console, and its cost in words.</p>

<h3 id="ex-1">Example 1 — single loop</h3>
<p><strong>The problem:</strong> Add up a week of expenses: <code>[4, 8, 15, 16, 23, 42]</code>.</p>
<p><strong>The idea:</strong> One loop, one addition per item, one running total.</p>
<div class="diagram"><pre>total  i  item
4      0  4
12     1  8
27     2  15
43     3  16
66     4  23
108    5  42      6 items, 6 additions</pre></div>
<pre><code class="language-js">function sum(numbers) {
  let total = 0;
  for (let i = 0; i &lt; numbers.length; i++) {
    total += numbers[i]; // one step per item
  }
  return total;
}
console.log(sum([4, 8, 15, 16, 23, 42])); // 108</code></pre>
<p><strong>Cost:</strong> time O(n): twice the items, twice the additions. Space O(1): one number, however long the list.</p>

<h3 id="ex-2">Example 2 — nested loops over same n</h3>
<p><strong>The problem:</strong> List every possible pair of players for a round of doubles from <code>[1, 2, 3]</code>.</p>
<p><strong>The idea:</strong> For each player i, pair them with every player after them (j starts at i + 1, so no pair appears twice).</p>
<div class="diagram"><pre>pairs so far  i  j  new pair
1             0  1  [1, 2]
2             0  2  [1, 3]
3             1  2  [2, 3]      3 players -&gt; 3 x 2 / 2 = 3 pairs</pre></div>
<pre><code class="language-js">function pairs(players) {
  const result = [];
  for (let i = 0; i &lt; players.length; i++) {
    for (let j = i + 1; j &lt; players.length; j++) { // only players after i
      result.push([players[i], players[j]]);
    }
  }
  return result;
}
console.log(pairs([1, 2, 3])); // [[1, 2], [1, 3], [2, 3]]</code></pre>
<p><strong>Cost:</strong> time O(n²): about n² / 2 pairs. Space O(n²) too, because the <em>output</em> itself holds about n² / 2 pairs. When the answer is that big, no code can be faster than the answer's size.</p>

<h3 id="ex-3">Example 3 — sequential loops, two inputs</h3>
<p><strong>The problem:</strong> Which guests are on both your list and your friend's list?</p>
<p><strong>The idea:</strong> Put your list in a Set (loop 1), then walk your friend's list and check the Set (loop 2). The loops run one after the other, not one inside the other, so their costs <em>add</em>.</p>
<div class="diagram"><pre>found so far     friend's name  in my Set?
["Chen"]         Chen           yes -&gt; keep
["Chen"]         Dev            no
["Chen", "Asha"] Asha           yes -&gt; keep
my list: Asha, Ben, Chen  (3 steps to build the Set)
friend's list: 3 checks.  3 + 3 steps in total.</pre></div>
<pre><code class="language-js">function intersect(myList, friendList) {
  const mine = new Set(myList); // loop 1: a steps
  const both = [];
  for (const name of friendList) { // loop 2: b steps
    if (mine.has(name)) { // O(1) on average
      both.push(name);
    }
  }
  return both;
}
console.log(intersect(["Asha", "Ben", "Chen"], ["Chen", "Dev", "Asha"])); // ["Chen", "Asha"]</code></pre>
<p><strong>Cost:</strong> time O(a + b), where a and b are the two list lengths. Space O(a) for the Set.</p>

<h3 id="ex-4">Example 4 — binary search</h3>
<p><strong>The problem:</strong> Find the price 42 in a <a href="#/topic/dsa-words#w-sorted">sorted</a> price list <code>[3, 8, 15, 21, 30, 42, 57]</code>, and return its position.</p>
<p><strong>The idea:</strong> <a href="#/topic/dsa-words#w-binary-search">Binary search</a>: look at the middle. If it is too small, the answer must be to the right, so throw away the left half. Each look halves what is left.</p>
<div class="diagram"><pre>result  low  high  mid  prices[mid]  decision
-       0    6     3    21           21 &lt; 42: go right, low = 4
5       4    6     5    42           found it at index 5
2 looks for 7 items. 1,000,000 items would need about 20.</pre></div>
<pre><code class="language-js">function binarySearch(sortedItems, target) {
  let low = 0; // first index still possible
  let high = sortedItems.length - 1; // last index still possible
  while (low &lt;= high) {
    const mid = Math.floor((low + high) / 2); // the middle of what is left
    if (sortedItems[mid] === target) {
      return mid;
    }
    if (sortedItems[mid] &lt; target) {
      low = mid + 1; // the target is bigger: drop the left half
    } else {
      high = mid - 1; // the target is smaller: drop the right half
    }
  }
  return -1; // nothing left to check: not found
}
console.log(binarySearch([3, 8, 15, 21, 30, 42, 57], 42)); // 5
console.log(binarySearch([3, 8, 15, 21, 30, 42, 57], 10)); // -1</code></pre>
<p><strong>Cost:</strong> time O(log n): each step halves the range. Space O(1): just three numbers.</p>

<h3 id="ex-5">Example 5 — recursive Fibonacci (naive)</h3>
<p><strong>The problem:</strong> The Fibonacci numbers go 0, 1, 1, 2, 3, 5, 8, …: each one is the sum of the two before it. Find the nth one.</p>
<p><strong>The idea:</strong> Write the definition straight as <a href="#/topic/dsa-words#w-recursion">recursion</a> (a function that calls itself on a smaller input). The <a href="#/topic/dsa-words#w-base-case">base case</a> (the input small enough to answer directly) is n &lt; 2.</p>
<div class="diagram"><pre>Calls made by fib(4): 9 calls, and fib(2) is worked out twice.

                 fib(4)
            /              \
        fib(3)            fib(2)
       /      \           /     \
   fib(2)   fib(1)    fib(1)   fib(0)
   /    \
fib(1) fib(0)

calls   n
15      5
67      8
177     10
21,891  20       each +1 to n multiplies the calls by about 1.6</pre></div>
<pre><code class="language-js">let calls = 0;
function fib(n) {
  calls++; // count every call so we can see the blow-up
  if (n &lt; 2) {
    return n; // fib(0) = 0, fib(1) = 1
  }
  return fib(n - 1) + fib(n - 2); // two calls, which repeat each other's work
}
console.log(fib(10)); // 55
console.log(calls); // 177</code></pre>
<p><strong>Cost:</strong> time O(2ⁿ): each call makes two more, so the number of calls roughly doubles with each +1 to n. (The exact growth is about 1.6ⁿ; O(2ⁿ) is the usual, safe ceiling.) Space O(n): the deepest chain of open calls is fib(n) → fib(n−1) → … → fib(1), which is n calls.</p>

<h3 id="ex-6">Example 6 — Fibonacci with memoization</h3>
<p><strong>The problem:</strong> The same, but fast.</p>
<p><strong>The idea:</strong> <a href="#/topic/dsa-words#w-memoization">Memoization</a>: save each answer in a Map the first time you work it out. Next time, look it up instead of recomputing. Each smaller question (a <a href="#/topic/dsa-words#w-subproblem">subproblem</a>) is then solved only once.</p>
<div class="diagram"><pre>memo after   call
{}           fib(4) -&gt; needs fib(3) and fib(2)
{}           fib(3) -&gt; needs fib(2) and fib(1)
{2:1}        fib(2) = fib(1) + fib(0) = 1, saved
{2:1, 3:2}   fib(3) = 1 + 1 = 2, saved
{2:1, 3:2}   fib(2) again: found in memo, no new calls
{.., 4:3}    fib(4) = 2 + 1 = 3, saved</pre></div>
<pre><code class="language-js">let calls = 0;
function fib(n, memo) {
  calls++;
  if (memo.has(n)) {
    return memo.get(n); // already worked out: reuse it
  }
  if (n &lt; 2) {
    return n;
  }
  const answer = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, answer); // save it for next time
  return answer;
}
console.log(fib(10, new Map())); // 55
console.log(calls); // 19  (instead of 177)
calls = 0;
console.log(fib(30, new Map())); // 832040
console.log(calls); // 59  (the naive version makes 2,692,537 calls)</code></pre>
<p><strong>Cost:</strong> time O(n): each of the n values is worked out once, and each lookup is O(1). Space O(n): the Map holds n answers, and the recursion is still up to n calls deep.</p>

<h3 id="ex-7">Example 7 — Fibonacci iterative</h3>
<p><strong>The problem:</strong> The same, with as little memory as possible.</p>
<p><strong>The idea:</strong> To get the next number you only need the last two. Build up from the bottom with a loop (<a href="#/topic/dsa-words#w-iterative">iterative</a>, no recursion), keeping just two variables.</p>
<div class="diagram"><pre>current  i  previous
1        1  0          start: fib(0) = 0, fib(1) = 1
1        2  1
2        3  1
3        4  2
5        5  3          fib(5) = 5</pre></div>
<pre><code class="language-js">function fib(n) {
  if (n &lt; 2) {
    return n;
  }
  let previous = 0; // fib(i - 1)
  let current = 1; // fib(i)
  for (let i = 2; i &lt;= n; i++) {
    const next = previous + current;
    previous = current; // slide both one step forward
    current = next;
  }
  return current;
}
console.log(fib(5)); // 5
console.log(fib(10)); // 55</code></pre>
<p><strong>Cost:</strong> time O(n), space O(1). The best of both: as fast as memoization, no Map, no recursion depth.</p>

<h3 id="ex-8">Example 8 — merge sort</h3>
<p><strong>The problem:</strong> Sort <code>[5, 2, 4, 1]</code>.</p>
<p><strong>The idea:</strong> Split the list in half, sort each half (by the same method), then merge the two sorted halves by repeatedly taking the smaller front item. This is <a href="#/topic/dsa-words#w-divide-and-conquer">divide and conquer</a>.</p>
<div class="diagram"><pre>result          step
[5, 2] [4, 1]   split
[5] [2] [4] [1] split again (size 1 is already sorted)
[2, 5] [1, 4]   merge pairs
[1, 2, 4, 5]    merge: take 1, then 2, then 4, then 5
2 levels of splitting (log₂ 4), n merge work per level: n log n.</pre></div>
<pre><code class="language-js">function merge(leftHalf, rightHalf) {
  const result = [];
  let i = 0; // next unused item in leftHalf
  let j = 0; // next unused item in rightHalf
  while (i &lt; leftHalf.length &amp;&amp; j &lt; rightHalf.length) {
    if (leftHalf[i] &lt;= rightHalf[j]) {
      result.push(leftHalf[i]); // take the smaller front item
      i++;
    } else {
      result.push(rightHalf[j]);
      j++;
    }
  }
  while (i &lt; leftHalf.length) {
    result.push(leftHalf[i]); // copy whatever is left over
    i++;
  }
  while (j &lt; rightHalf.length) {
    result.push(rightHalf[j]);
    j++;
  }
  return result;
}
function mergeSort(items) {
  if (items.length &lt;= 1) {
    return items; // 0 or 1 items: already sorted
  }
  const mid = Math.floor(items.length / 2);
  const sortedLeft = mergeSort(items.slice(0, mid));
  const sortedRight = mergeSort(items.slice(mid));
  return merge(sortedLeft, sortedRight);
}
console.log(mergeSort([5, 2, 4, 1])); // [1, 2, 4, 5]
console.log(mergeSort([38, 27, 43, 3, 9, 82, 10])); // [3, 9, 10, 27, 38, 43, 82]</code></pre>
<p><strong>Cost:</strong> time O(n log n). The recurrence is T(n) = 2T(n/2) + O(n): about log₂ n levels, n work each. Space O(n) for the temporary arrays, plus O(log n) for the recursion depth.</p>

<h3 id="ex-9">Example 9 — DFS on tree</h3>
<p><strong>The problem:</strong> How deep is this family tree? (Depth = the number of generations on the longest line from the top person down.)</p>
<p><strong>The idea:</strong> <a href="#/topic/dsa-words#w-dfs">DFS</a> (depth-first search: go as deep as possible down one branch, then come back). The depth of a person = 1 + the deeper of their two children's depths. An empty spot has depth 0.</p>
<div class="diagram"><pre>        1          depth(4) = 1 + max(0, 0) = 1
       / \         depth(2) = 1 + max(1, 0) = 2
      2   3        depth(3) = 1 + max(0, 0) = 1
     /             depth(1) = 1 + max(2, 1) = 3
    4</pre></div>
<pre><code class="language-js">function depth(node) {
  if (node === null) {
    return 0; // an empty spot adds no generations
  }
  const leftDepth = depth(node.left);
  const rightDepth = depth(node.right);
  return 1 + Math.max(leftDepth, rightDepth);
}
const four = { value: 4, left: null, right: null };
const two = { value: 2, left: four, right: null };
const three = { value: 3, left: null, right: null };
const family = { value: 1, left: two, right: three };
console.log(depth(family)); // 3</code></pre>
<p><strong>Cost:</strong> time O(n): each node is visited once. Space O(h), where h is the tree's <a href="#/topic/dsa-words#w-depth-height">height</a>: that many calls wait on the stack at once. h is about log₂ n for a <a href="#/topic/dsa-words#w-balanced">balanced</a> tree, but n for a tree that is one long chain.</p>

<h3 id="ex-10">Example 10 — string concat</h3>
<p><strong>The problem:</strong> Join a list of words into one string.</p>
<p><strong>The idea:</strong> JavaScript strings are <a href="#/topic/dsa-words#w-immutable">immutable</a>: they can't be changed, only replaced. So <code>s += x</code> may build a whole new string and copy everything so far. In the simple model, the copies are 1 + 2 + 3 + … + n characters: O(n²) in total.</p>
<div class="diagram"><pre>characters copied  s after += x
1                  "a"
1 + 2 = 3          "ab"
3 + 3 = 6          "abc"
6 + 4 = 10         "abcd"      n pieces -&gt; about n² / 2 copies</pre></div>
<pre><code class="language-js">function joinSlow(pieces) {
  let result = "";
  for (const piece of pieces) {
    result += piece; // may copy the whole string so far each time
  }
  return result;
}
function joinFast(pieces) {
  return pieces.join(""); // works out the final size once, copies each piece once
}
console.log(joinSlow(["a", "b", "c", "d"])); // abcd
console.log(joinFast(["a", "b", "c", "d"])); // abcd</code></pre>
<p><strong>Cost:</strong> <code>joinSlow</code> is O(n²) in the simple model. <code>joinFast</code> is O(n), where n is the total length. Modern engines (like V8 in Chrome and Node) often hide the copying with a trick called "ropes", so <code>+=</code> may be fast in practice. Still, in an interview say O(n²) for the loop and reach for <code>join</code>.</p>

<h3 id="ex-11">Example 11 — Two Sum (brute vs hash)</h3>
<p><strong>The problem:</strong> You have a gift card worth 9. Prices are <code>[2, 7, 11, 15]</code>. Which two items add up to exactly 9? Return their positions.</p>
<p><strong>The idea:</strong> The <a href="#/topic/dsa-words#w-brute-force">brute force</a> way tries every pair: O(n²). The fast way walks once. For each price, the partner it needs is <code>target - price</code>, called the <a href="#/topic/dsa-words#w-complement">complement</a>. A Map remembers every price seen so far and its position, so checking for the partner is O(1).</p>
<div class="diagram"><pre>answer  i  price  need 9 - price  seen before?  Map after
-       0  2      7               no            {2: 0}
[0, 1]  1  7      2               yes, at 0     done</pre></div>
<pre><code class="language-js">// Brute force: O(n²) time, O(1) space
function twoSumBrute(prices, target) {
  for (let i = 0; i &lt; prices.length; i++) {
    for (let j = i + 1; j &lt; prices.length; j++) {
      if (prices[i] + prices[j] === target) {
        return [i, j];
      }
    }
  }
  return null; // no pair adds up
}

// Hash map: O(n) time, O(n) space
function twoSum(prices, target) {
  const indexOfPrice = new Map(); // price -&gt; the position where we saw it
  for (let i = 0; i &lt; prices.length; i++) {
    const need = target - prices[i]; // the partner this price needs
    if (indexOfPrice.has(need)) {
      const partnerIndex = indexOfPrice.get(need);
      return [partnerIndex, i];
    }
    indexOfPrice.set(prices[i], i);
  }
  return null;
}
console.log(twoSumBrute([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]</code></pre>
<p><strong>Cost:</strong> brute force O(n²) time, O(1) space. Map version O(n) time, O(n) space. The classic time-space trade-off.</p>

<h3 id="ex-12">Example 12 — find duplicates</h3>
<p><strong>The problem:</strong> Does a list of ticket numbers contain any number twice? <code>[3, 1, 4, 1, 5]</code> → yes.</p>
<p><strong>The idea:</strong> Three ways, three different trade-offs: compare every pair; remember what you've seen in a Set; or sort first so equal numbers end up side by side.</p>
<div class="diagram"><pre>answer  way          what happens on [3, 1, 4, 1, 5]
true    every pair   3 vs 1, 3 vs 4, 3 vs 1, 3 vs 5, 1 vs 4, 1 vs 1 ✓
true    Set          5 numbers, Set keeps 4 -&gt; sizes differ
true    sort first   [1, 1, 3, 4, 5]: positions 0 and 1 match</pre></div>
<pre><code class="language-js">// 1. Every pair: O(n²) time, O(1) space
function hasDuplicateBrute(numbers) {
  for (let i = 0; i &lt; numbers.length; i++) {
    for (let j = i + 1; j &lt; numbers.length; j++) {
      if (numbers[i] === numbers[j]) {
        return true;
      }
    }
  }
  return false;
}

// 2. Set: O(n) time, O(n) space
function hasDuplicateSet(numbers) {
  const unique = new Set(numbers); // a Set keeps one copy of each value
  return unique.size !== numbers.length; // fewer unique values means a repeat
}

// 3. Sort first: O(n log n) time, no extra array of our own
function hasDuplicateSorted(numbers) {
  numbers.sort(function (a, b) { return a - b; }); // sorts the caller's array in place
  for (let i = 1; i &lt; numbers.length; i++) {
    if (numbers[i] === numbers[i - 1]) {
      return true; // equal values are now neighbours
    }
  }
  return false;
}
console.log(hasDuplicateBrute([3, 1, 4, 1, 5])); // true
console.log(hasDuplicateSet([3, 1, 4, 1, 5])); // true
console.log(hasDuplicateSorted([3, 1, 4, 1, 5])); // true
console.log(hasDuplicateSet([3, 1, 4])); // false</code></pre>
<p><strong>Cost:</strong> pairs O(n²) time, O(1) space. Set O(n) time, O(n) space. Sorting O(n log n) time and changes the input. It makes no array of its own, but JavaScript's built-in sort may use up to O(n) temporary memory internally. For a true O(1) extra, you would need an in-place sort such as heap sort.</p>

<h3 id="ex-13">Example 13 — palindrome check</h3>
<p><strong>The problem:</strong> Does a word read the same forwards and backwards? "racecar" does. That is a <a href="#/topic/dsa-words#w-palindrome">palindrome</a>.</p>
<p><strong>The idea:</strong> <a href="#/topic/dsa-words#w-two-pointers">Two pointers</a>: one position at each end. Compare, then step both inwards. Stop at the first mismatch.</p>
<div class="diagram"><pre>so far  left  right  letters
match   0     6      r = r
match   1     5      a = a
match   2     4      c = c
true    3     3      left meets right: stop</pre></div>
<pre><code class="language-js">function isPalindrome(word) {
  let left = 0;
  let right = word.length - 1;
  while (left &lt; right) {
    if (word[left] !== word[right]) {
      return false; // one mismatch is enough
    }
    left++; // step both ends inwards
    right--;
  }
  return true;
}
console.log(isPalindrome("racecar")); // true
console.log(isPalindrome("rocket")); // false</code></pre>
<p><strong>Cost:</strong> time O(n): about n / 2 comparisons. Space O(1): two numbers.</p>

<h3 id="ex-14">Example 14 — multi-variable</h3>
<p><strong>The problem:</strong> Build a search index for a blog: for each word, which posts use it?</p>
<p><strong>The idea:</strong> Loop over the posts (d of them) and, inside, over each post's words (about w each). Add the post's id to that word's list in a Map.</p>
<div class="diagram"><pre>index after                          post  words
{big: [1], o: [1]}                   1     big, o
{big: [1, 2], o: [1], idea: [2]}     2     big, idea
d = 2 posts x w = 2 words = 4 steps</pre></div>
<pre><code class="language-js">function buildIndex(posts) {
  const index = new Map(); // word -&gt; list of post ids
  for (const post of posts) { // d posts
    for (const word of post.words) { // about w words each
      if (!index.has(word)) {
        index.set(word, []); // first time we meet this word
      }
      const postIds = index.get(word);
      postIds.push(post.id); // O(1) amortized
    }
  }
  return index;
}
const posts = [
  { id: 1, words: ["big", "o"] },
  { id: 2, words: ["big", "idea"] }
];
const index = buildIndex(posts);
console.log(index.get("big")); // [1, 2]
console.log(index.get("idea")); // [2]</code></pre>
<p><strong>Cost:</strong> time O(d × w), d = number of posts, w = average words per post. Space O(d × w) as well: every (word, post) pair is stored once. There is no single n here, so keep both letters.</p>

<h3 id="ex-15">Example 15 — exponential search</h3>
<p><strong>The problem:</strong> Find a value in a very long sorted list, when it is probably near the start (or you don't know the list's end).</p>
<p><strong>The idea:</strong> First find a range that must contain it: check positions 1, 2, 4, 8, 16, … (doubling) until the value there is not smaller than the target. Then binary search inside that range.</p>
<div class="diagram"><pre>found  stage    bound  items[bound]  decision
-      doubling 1      3             3 &lt; 13: double
-      doubling 2      5             5 &lt; 13: double
-      doubling 4      13            not &lt; 13: stop
4      binary   search positions 2..4 -&gt; 13 is at index 4</pre></div>
<pre><code class="language-js">function binarySearchInRange(sortedItems, target, low, high) {
  while (low &lt;= high) {
    const mid = Math.floor((low + high) / 2);
    if (sortedItems[mid] === target) {
      return mid;
    }
    if (sortedItems[mid] &lt; target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return -1;
}
function exponentialSearch(sortedItems, target) {
  if (sortedItems.length === 0) {
    return -1;
  }
  if (sortedItems[0] === target) {
    return 0;
  }
  let bound = 1;
  while (bound &lt; sortedItems.length &amp;&amp; sortedItems[bound] &lt; target) {
    bound = bound * 2; // jump 1, 2, 4, 8, ... until we pass the target
  }
  const low = Math.floor(bound / 2); // the last jump that was still too small
  const high = Math.min(bound, sortedItems.length - 1); // don't run off the end
  return binarySearchInRange(sortedItems, target, low, high);
}
const fibs = [2, 3, 5, 8, 13, 21, 34, 55, 89];
console.log(exponentialSearch(fibs, 13)); // 4
console.log(exponentialSearch(fibs, 4)); // -1</code></pre>
<p><strong>Cost:</strong> time O(log n): about log n doublings to find the range, then a binary search inside it. More exactly O(log i), where i is the target's position, which is why it shines when the target is near the start. Space O(1).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>
<p>These are the places where a Big-O answer is technically right but misleading, or where JavaScript hides a cost. Each item says what goes wrong, gives a tiny example, and gives the fix.</p>

<h3>1. Constants matter at small n</h3>
<p><strong>What goes wrong:</strong> You assume the lower Big-O always wins. For small n, the fixed costs decide.</p>
<p><strong>Tiny example:</strong> For under about 20 items, insertion sort (O(n²), a very simple loop) beats merge sort (O(n log n), but it creates arrays and recurses). That's why real sorts like TimSort use insertion sort for small chunks.</p>
<p><strong>Fix:</strong> Say "for large n, X wins; for tiny inputs the simpler one may be faster".</p>

<h3>2. Hash table O(1) is "average"</h3>
<p><strong>What goes wrong:</strong> A Map or Set is O(1) only on average. If many keys land in the same slot (a "collision"), lookups slow towards O(n).</p>
<p><strong>Tiny example:</strong> An attacker who knows the <a href="#/topic/dsa-words#w-hash-function">hash function</a> can send thousands of keys that all collide, and turn a fast server slow (a known denial-of-service attack).</p>
<p><strong>Fix:</strong> Say "O(1) average, O(n) worst". Where attacks matter, use randomized or keyed hashing (modern engines already do).</p>

<h3>3. JavaScript array access isn't always O(1)</h3>
<p><strong>What goes wrong:</strong> JS arrays are objects. An array full of gaps (a "sparse" array) may switch to a slower dictionary-style storage. Access then becomes a hash lookup instead of a direct jump: still roughly O(1) on average, but much slower in practice.</p>
<p><strong>Tiny example:</strong> <code>const a = []; a[1000000] = 1;</code> makes an array with a million holes. <code>delete arr[i]</code> also leaves a hole.</p>
<p><strong>Fix:</strong> Don't punch holes on hot code paths. Assign <code>undefined</code> instead of <code>delete</code>, or use <code>splice</code> (and accept its O(n) cost).</p>

<h3>4. String operations and immutability</h3>
<p><strong>What goes wrong:</strong> Strings can't be changed in place, so <code>s += x</code> in a loop may copy the whole string every time: O(n²) in total.</p>
<p><strong>Tiny example:</strong> Building a 100,000-character string one character at a time could copy about 5 billion characters in the simple model.</p>
<p><strong>Fix:</strong> Push the pieces into an array and call <code>join("")</code> once (Example 10).</p>

<h3>5. Recursion stack space</h3>
<p><strong>What goes wrong:</strong> Each unfinished recursive call takes a slot on the call stack. With n levels deep you use O(n) memory, and past roughly ten thousand levels JavaScript throws <code>RangeError: Maximum call stack size exceeded</code>. That crash is a <a href="#/topic/dsa-words#w-stack-overflow">stack overflow</a>.</p>
<p><strong>Tiny example:</strong> A recursive sum over a 100,000-item array crashes, even though the loop version is fine.</p>
<p><strong>Fix:</strong> For deep inputs, rewrite with a loop and your own array used as a <a href="#/topic/dsa-words#w-stack">stack</a>.</p>

<h3>6. Time complexity ≠ wall clock</h3>
<p><strong>What goes wrong:</strong> Big-O counts steps, but real time also depends on memory caches and the CPU guessing your next branch.</p>
<p><strong>Tiny example:</strong> Walking an array in order is cache-friendly and fast. Jumping around memory randomly can make an "equal" O(n) loop several times slower.</p>
<p><strong>Fix:</strong> Use Big-O to choose the approach. Use measurement to compare two approaches with the same Big-O.</p>

<h3>7. Average case can be misleading</h3>
<p><strong>What goes wrong:</strong> Quoting only the average hides a dangerous worst case.</p>
<p><strong>Tiny example:</strong> Quicksort that always picks the first item as the pivot (the item the list is split around) is O(n²) on input that is already sorted, which is common in real life.</p>
<p><strong>Fix:</strong> Say both. Real sorts pick random pivots or switch algorithms when things go badly.</p>

<h3>8. Big O with multiple variables</h3>
<p><strong>What goes wrong:</strong> Squashing two sizes into one n hides how the code really scales.</p>
<p><strong>Tiny example:</strong> Walking a <a href="#/topic/dsa-words#w-graph">graph</a> costs O(V + E): V <a href="#/topic/dsa-words#w-vertex">vertices</a> (the points) plus E <a href="#/topic/dsa-words#w-edge">edges</a> (the links). A road map has few roads per town (E close to V). A friend network can have far more links (E up to V²).</p>
<p><strong>Fix:</strong> Keep both letters: O(V + E), O(a + b), O(d × w).</p>

<h3>9. log base doesn't matter</h3>
<p><strong>What goes wrong:</strong> People worry whether it is log₂ or log₁₀.</p>
<p><strong>Tiny example:</strong> log₂ n is always about 3.32 × log₁₀ n. A fixed multiplier, so Big-O drops it.</p>
<p><strong>Fix:</strong> Just write O(log n).</p>

<h3>10. nlogn vs n^1.5</h3>
<p><strong>What goes wrong:</strong> You assume a lower Big-O is a huge win at every size.</p>
<p><strong>Tiny example:</strong> At n = 1,000: n log n ≈ 1,000 × 10 = 10,000; n<sup>1.5</sup> = n × √n ≈ 1,000 × 32 = 31,600. O(n log n) wins, but only by about 3×, not 10×.</p>
<p><strong>Fix:</strong> Plug in real numbers when two labels are close.</p>

<h3>11. "O(n) where n = input bits"</h3>
<p><strong>What goes wrong:</strong> For big-number maths, the cost depends on how many <em>digits</em> (bits) the numbers have, not just how many operations you do.</p>
<p><strong>Tiny example:</strong> Computing n! (n factorial) with BigInt does only n multiplications, but the numbers get huge, so each multiply gets slower. The real cost is roughly n² log n bit steps, far more than n.</p>
<p><strong>Fix:</strong> By default, n = how many items. Say so when you measure in digits or bits.</p>

<h3>12. Polynomial vs exponential</h3>
<p><strong>What goes wrong:</strong> Mixing the two up. A <em>polynomial</em> cost has n in the base and a fixed power: n², n³, even n<sup>1000</sup>. An <em>exponential</em> cost has n in the power: 2ⁿ.</p>
<p><strong>Tiny example:</strong> At n = 100, n² = 10,000 (instant). 2ⁿ ≈ 10³⁰ (longer than the age of the universe).</p>
<p><strong>Fix:</strong> Remember the rule: a fixed number in the exponent is workable; n in the exponent is only fine for tiny n.</p>

<h3>13. Recursive calls reuse subproblems</h3>
<p><strong>What goes wrong:</strong> A recursion that asks the same smaller question many times wastes almost all its work.</p>
<p><strong>Tiny example:</strong> Naive fib(30) makes 2,692,537 calls. With memoization, 59 (Examples 5 and 6).</p>
<p><strong>Fix:</strong> Whenever the same arguments come up again, save answers in a Map. This is the heart of <a href="#/topic/dsa-words#w-dp">dynamic programming</a>.</p>

<h3>14. Big O can hide huge constants</h3>
<p><strong>What goes wrong:</strong> An O(n log n) method with a big fixed cost per step can lose to a simple O(n²) one until n is large.</p>
<p><strong>Tiny example:</strong> FFT-based multiplication of huge numbers is O(n log n) but has heavy setup. For a 20-digit number, the school O(n²) method is faster. For a million digits, the FFT method wins by a huge factor.</p>
<p><strong>Fix:</strong> Big-O wins "once n is big enough". Know roughly where that point is.</p>

<h3>15. Allocation cost</h3>
<p><strong>What goes wrong:</strong> Creating or filling an array of size n costs O(n), and that cost hides in one innocent-looking line.</p>
<p><strong>Tiny example:</strong> <code>new Array(n)</code> reserves the slots cheaply, but <code>new Array(n).fill(0)</code> or <code>Array.from(...)</code> touches all n: O(n) time and space. Doing that inside a loop makes O(n²).</p>
<p><strong>Fix:</strong> Count every line that builds an array, and create arrays outside loops when you can.</p>

<h3>16. Map vs object performance</h3>
<p><strong>What goes wrong:</strong> Treating a plain object <code>{}</code> and a <code>Map</code> as the same.</p>
<p><strong>Tiny example:</strong> Both are O(1) on average for string keys. But an object also looks up its prototype (keys like <code>"constructor"</code> already exist), and it turns number keys into strings. A <code>Map</code> is built for frequent adds and deletes, and it keeps any key type.</p>
<p><strong>Fix:</strong> Use a <code>Map</code> for heavy counting or caching; a plain object is fine for small fixed records.</p>

<h3>17. Set membership is O(1) — set.has(x)</h3>
<p><strong>What goes wrong:</strong> Using <code>arr.includes(x)</code> inside a loop. Each call scans the array: O(n) per call, so O(n²) in total.</p>
<p><strong>Tiny example:</strong> Checking 10,000 names against a 10,000-name array with <code>includes</code> is up to 100 million checks.</p>
<p><strong>Fix:</strong> Build a Set once (O(n)), then use <code>set.has(x)</code>: O(1) on average. Total O(n).</p>

<h3>18. Recursive memoization stack</h3>
<p><strong>What goes wrong:</strong> Memoization fixes the time, but the recursion is still n calls deep.</p>
<p><strong>Tiny example:</strong> The memoized <code>fib(20000, new Map())</code> from Example 6 can crash with <code>RangeError</code> even though it would only need 20,000 steps.</p>
<p><strong>Fix:</strong> Build the answers bottom-up with a loop and an array instead. That is called <a href="#/topic/dsa-words#w-tabulation">tabulation</a>, and it has no stack depth.</p>

<h3>19. Sort cost in built-in functions</h3>
<p><strong>What goes wrong:</strong> Treating <code>arr.sort()</code> as one free step.</p>
<p><strong>Tiny example:</strong> <code>arr.sort()</code> is O(n log n) in V8 (it uses TimSort). <code>arr.toSorted()</code> costs the same, plus O(n) memory for the new array. Sorting inside a loop of n rounds is O(n² log n).</p>
<p><strong>Fix:</strong> Count every sort as O(n log n). Also, the default sort compares as <em>text</em>: <code>[10, 9, 1].sort()</code> gives <code>[1, 10, 9]</code>. Pass a compare function for numbers.</p>

<h3>20. Math operations on bigints</h3>
<p><strong>What goes wrong:</strong> Assuming all maths is O(1).</p>
<p><strong>Tiny example:</strong> Normal JS numbers: O(1) per operation. <code>BigInt</code> numbers can have any number of digits, and multiplying two d-digit BigInts costs roughly O(d²) with the school method (engines may use faster methods for huge numbers). Either way, not O(1).</p>
<p><strong>Fix:</strong> When numbers grow without limit, include the digit count in your cost.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — quoting only time</h3>
<p><strong>What goes wrong:</strong> "This is O(n)." The interviewer's next question is "and space?"</p>
<p><strong>Tiny example:</strong> A recursive solution with no arrays is still O(n) space if it goes n calls deep.</p>
<p><strong>Fix:</strong> Always say both: "O(n) time, O(n) space for the Set".</p>

<h3>Anti-pattern 2 — not dropping constants</h3>
<p><strong>What goes wrong:</strong> Saying "O(2n + 5)". It is not wrong, but it signals you don't know the convention.</p>
<p><strong>Tiny example:</strong> Two loops one after the other: 2n steps. Write O(n).</p>
<p><strong>Fix:</strong> Keep the biggest term, drop the multipliers.</p>

<h3>Anti-pattern 3 — string concatenation in loops</h3>
<p><strong>What goes wrong:</strong> <code>s += x</code> inside a loop hides O(n²) copying in the simple model.</p>
<p><strong>Tiny example:</strong> <code>joinSlow</code> in Example 10.</p>
<p><strong>Fix:</strong> Collect the pieces in an array, then <code>join("")</code>.</p>

<h3>Anti-pattern 4 — <code>arr.includes</code> in a loop</h3>
<p><strong>What goes wrong:</strong> Each <code>includes</code> is a hidden loop, so a single loop becomes O(n × m).</p>
<p><strong>Tiny example and fix together:</strong></p>
<pre><code class="language-js">const myList = ["Asha", "Ben", "Chen"];
const friendList = ["Chen", "Dev", "Asha"];

// Slow: includes scans friendList every time -&gt; O(n x m)
const slowResult = [];
for (const name of myList) {
  if (friendList.includes(name)) {
    slowResult.push(name);
  }
}

// Fast: build a Set once (O(m)), then each check is O(1) -&gt; O(n + m)
const friendSet = new Set(friendList);
const fastResult = [];
for (const name of myList) {
  if (friendSet.has(name)) {
    fastResult.push(name);
  }
}
console.log(slowResult); // ["Asha", "Chen"]
console.log(fastResult); // ["Asha", "Chen"]</code></pre>

<h3>Anti-pattern 5 — recursive without memoization</h3>
<p><strong>What goes wrong:</strong> A recursion that recomputes the same subproblems blows up exponentially.</p>
<p><strong>Tiny example:</strong> Naive Fibonacci is O(2ⁿ): fib(30) makes 2.7 million calls.</p>
<p><strong>Fix:</strong> Memoize → O(n) (Example 6), or use a loop (Example 7).</p>

<h3>Anti-pattern 6 — claiming "amortized" without analysis</h3>
<p><strong>What goes wrong:</strong> Saying "it's O(1) amortized" as if it were a magic phrase.</p>
<p><strong>Tiny example:</strong> An array that grows by a fixed +10 slots each time it fills is <em>not</em> O(1) amortized: it copies 10 + 20 + 30 + … items, which is O(n²) in total.</p>
<p><strong>Fix:</strong> Give the reason: "capacity doubles, so the copies add up to less than 2N for N pushes".</p>

<h3>Anti-pattern 7 — forgetting recursion stack space</h3>
<p><strong>What goes wrong:</strong> Writing "space O(1)" for a recursive function because it creates no arrays.</p>
<p><strong>Tiny example:</strong> A recursive sum of an n-item list keeps n calls open: O(n) space.</p>
<p><strong>Fix:</strong> Space = what you build + the recursion depth. Most engines (V8 in Chrome/Node) don't reuse stack slots for tail calls (Safari does), so in practice the depth counts.</p>

<h3>Anti-pattern 8 — confusing input size with input value</h3>
<p><strong>What goes wrong:</strong> When the input is a single number, "n" can mean the number itself or how many digits it has. They give wildly different answers.</p>
<p><strong>Tiny example:</strong> Checking whether n is prime by trying every divisor up to n is O(n) in the <em>value</em>. But a 30-digit number has a value around 10³⁰, so that "O(n)" is hopeless; in terms of digits it is exponential.</p>
<p><strong>Fix:</strong> Say which you mean: "O(n) in the value of n" or "O(d) in the number of digits".</p>

<h3>Anti-pattern 9 — over-optimizing prematurely</h3>
<p><strong>What goes wrong:</strong> Writing complex O(log n) code for a list that will never hold more than 10 items.</p>
<p><strong>Tiny example:</strong> A sorted tree for the 7 days of the week, when a plain array scan of 7 items is instant.</p>
<p><strong>Fix:</strong> Ask about the real input size first. Optimize where n is actually large.</p>

<h3>Anti-pattern 10 — using Big O as "fast vs slow"</h3>
<p><strong>What goes wrong:</strong> Treating O(n) as "fast" and O(n²) as "slow" in every case.</p>
<p><strong>Tiny example:</strong> An O(n) solution with a big fixed cost per step can lose to an O(n²) one when n = 5.</p>
<p><strong>Fix:</strong> Big-O describes growth for large n. Say "it scales better", not "it is faster".</p>

<h3>Anti-pattern 11 — forgetting space-time tradeoffs</h3>
<p><strong>What goes wrong:</strong> Presenting the fast version without saying what it costs in memory.</p>
<p><strong>Tiny example:</strong> Memoization makes Fibonacci O(n) time but adds an O(n) Map.</p>
<p><strong>Fix:</strong> Name the trade: "I'm spending O(n) memory to get from O(n²) to O(n) time."</p>

<h3>Anti-pattern 12 — analyzing only the function, not callers</h3>
<p><strong>What goes wrong:</strong> A helper is O(n), so you call the whole thing O(n), but the caller runs the helper inside its own loop.</p>
<p><strong>Tiny example:</strong> <code>for (const id of ids) { findUser(users, id); }</code> where <code>findUser</code> scans the whole list: O(n) × n calls = O(n²).</p>
<p><strong>Fix:</strong> Multiply: cost of the helper × how many times it is called.</p>

<h3>Anti-pattern 13 — assuming average case</h3>
<p><strong>What goes wrong:</strong> Using quicksort with a "first item" pivot on input that might already be sorted.</p>
<p><strong>Tiny example:</strong> Sorted input of n items → every split is "nothing" and "everything else" → O(n²).</p>
<p><strong>Fix:</strong> Pick a random pivot or the median of three items (first, middle, last), or use merge sort when the worst case matters.</p>

<h3>Anti-pattern 14 — measuring wrong</h3>
<p><strong>What goes wrong:</strong> Timing code once on n = 10 and calling it "fast".</p>
<p><strong>Tiny example:</strong> At n = 10, O(n) and O(n²) both finish in microseconds. You can't see the shape.</p>
<p><strong>Fix:</strong> Time it at n = 1,000, 10,000 and 100,000. If time grows 10× per step it is about O(n); if it grows 100× it is about O(n²).</p>

<h3>Anti-pattern 15 — assuming hash O(1) always</h3>
<p><strong>What goes wrong:</strong> Promising O(1) lookups no matter what.</p>
<p><strong>Tiny example:</strong> Carefully crafted keys that all collide make each lookup O(n).</p>
<p><strong>Fix:</strong> Say "O(1) average". Where attackers can choose your keys, rely on randomized hashing (built into modern engines) or a balanced tree (O(log n) guaranteed).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What's Big O notation?</div>
  <div class="qa-answer">
    <p>It describes how a program's work (or memory) grows as the input grows, ignoring fixed multipliers and the small parts. One loop over n items is O(n): twice the items, twice the work. A loop inside a loop is O(n²): twice the items, four times the work.</p>
    <p>Formally, it is an upper bound: <code>f(n) = O(g(n))</code> if there is a fixed number c and a starting size n₀ so that <code>f(n) ≤ c × g(n)</code> for every n ≥ n₀. In words: past some size, f stays under a stretched copy of g. For example, 3n² + 5n + 7 ≤ 4n² once n ≥ 7, so it is O(n²).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Time complexity of common operations?</div>
  <div class="qa-answer">
    <ul>
      <li>Array read by position: O(1).</li>
      <li>Array search for a value: O(n).</li>
      <li>Map / Set get, set, has: O(1) on average (O(n) worst).</li>
      <li>Binary search in a sorted array: O(log n).</li>
      <li>Balanced binary search tree: O(log n) for search, insert and delete.</li>
      <li>Heap insert / remove the top: O(log n). Peek at the top: O(1).</li>
      <li>Good sorting: O(n log n).</li>
      <li>Linked list read by position: O(n), because you walk from the start.</li>
      <li>Trie operations: O(L), L = the word's length.</li>
      <li>JS hidden costs: <code>shift</code>, <code>unshift</code>, <code>splice</code>, <code>includes</code>, <code>indexOf</code>, <code>slice</code> are all O(n).</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Walk through analyzing this:</div>
<pre><code class="language-js">const n = 5;
let work = 0;
for (let i = 0; i &lt; n; i++) {
  for (let j = i; j &lt; n; j++) {
    work++; // stands for one unit of work
  }
}
console.log(work); // 15  (5 + 4 + 3 + 2 + 1)</code></pre>
  <div class="qa-answer">
    <p>The outer loop runs n times. When the outer loop is at i, the inner loop runs n − i times: n, then n − 1, … down to 1.</p>
    <div class="diagram"><pre>work so far  i  inner runs
5            0  5
9            1  4
12           2  3
14           3  2
15           4  1</pre></div>
    <p>Total: n + (n − 1) + … + 1 = n(n + 1) / 2. For n = 5 that is 15. As a formula it is about n² / 2. Drop the "/ 2" (a fixed multiplier) → <strong>O(n²)</strong>. Space O(1).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What's amortized O(1) for dynamic array push?</div>
  <div class="qa-answer">
    <p>Push is O(1) while there is free room. When the array is full, it reserves twice the room and copies everything: O(n) that one time. But the copies are 1 + 2 + 4 + 8 + …, up to the last doubling, and that adds up to less than 2N. Doublings get rarer as the array grows. With the N normal writes, N pushes do under 3N work in total. So each push is <strong>O(1) amortized</strong>: the rare expensive push is paid for by the many cheap ones.</p>
<pre><code class="language-js">class DynamicArray {
  constructor() {
    this.capacity = 1; // slots reserved
    this.size = 0; // slots used
    this.data = new Array(this.capacity);
    this.copies = 0; // items copied by all resizes so far
  }
  push(value) {
    if (this.size === this.capacity) {
      this.capacity = this.capacity * 2; // full: double the room
      const bigger = new Array(this.capacity);
      for (let i = 0; i &lt; this.size; i++) {
        bigger[i] = this.data[i]; // copy every item across: O(size)
        this.copies++;
      }
      this.data = bigger;
    }
    this.data[this.size] = value; // the cheap O(1) part
    this.size++;
  }
}
const list = new DynamicArray();
for (let i = 1; i &lt;= 1000; i++) {
  list.push(i);
}
console.log(list.copies); // 1023  (under 2 x 1000)</code></pre>
    <p>Key detail: it must <em>double</em> (or grow by any fixed factor). Growing by a fixed +10 slots would make the copies add up to O(n²).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Analyze recursive Fibonacci.</div>
  <div class="qa-answer">
    <p><strong>Naive:</strong> each call makes two more calls, and they repeat each other's work (fib(4) works out fib(2) twice). The number of calls roughly doubles with each +1 to n. <strong>Time O(2ⁿ)</strong> (more exactly about 1.6ⁿ). The deepest chain of open calls is n long: <strong>space O(n)</strong>.</p>
    <p><strong>With memoization:</strong> each value is worked out once and saved. <strong>Time O(n), space O(n)</strong> (the Map, plus n-deep recursion).</p>
    <p><strong>Iterative:</strong> a loop keeping the last two values. <strong>Time O(n), space O(1)</strong>.</p>
<pre><code class="language-js">// 1. Naive: O(2ⁿ) time, O(n) stack space
let naiveCalls = 0;
function fibNaive(n) {
  naiveCalls++;
  if (n &lt; 2) {
    return n;
  }
  return fibNaive(n - 1) + fibNaive(n - 2);
}

// 2. Memoized: O(n) time, O(n) space
function fibMemo(n, memo) {
  if (memo.has(n)) {
    return memo.get(n); // already worked out
  }
  if (n &lt; 2) {
    return n;
  }
  const answer = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, answer);
  return answer;
}

// 3. Iterative: O(n) time, O(1) space
function fibLoop(n) {
  if (n &lt; 2) {
    return n;
  }
  let previous = 0;
  let current = 1;
  for (let i = 2; i &lt;= n; i++) {
    const next = previous + current;
    previous = current;
    current = next;
  }
  return current;
}
console.log(fibNaive(20)); // 6765
console.log(naiveCalls); // 21891
console.log(fibMemo(20, new Map())); // 6765
console.log(fibLoop(20)); // 6765</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What's the master theorem?</div>
  <div class="qa-answer">
    <p>A lookup chart for recursions that split into equal parts. They are written <code>T(n) = aT(n/b) + f(n)</code>: a calls, each on 1/b of the input, plus f(n) work in the call itself. Write f(n) as n<sup>c</sup> and compare c with log<sub>b</sub> a (n<sup>log<sub>b</sub> a</sup> is how many tiny calls sit at the bottom):</p>
    <ul>
      <li><strong>c &lt; log<sub>b</sub> a</strong>: the bottom of the recursion dominates → <code>T(n) = O(n<sup>log<sub>b</sub> a</sup>)</code>.</li>
      <li><strong>c = log<sub>b</sub> a</strong>: every level does equal work → <code>T(n) = O(n<sup>c</sup> log n)</code>.</li>
      <li><strong>c &gt; log<sub>b</sub> a</strong>: the top call dominates → <code>T(n) = O(f(n))</code>.</li>
    </ul>
    <p>Examples: merge sort T(n) = 2T(n/2) + n: c = 1 and log₂ 2 = 1, a tie → O(n log n). Binary search T(n) = T(n/2) + 1: c = 0 and log₂ 1 = 0, a tie → O(log n).</p>
    <p>This simple form only works when f(n) is a plain power n<sup>c</sup>. <code>2T(n/2) + n log n</code> gives O(n log² n), which needs the extended form or a recursion tree. Recursions that subtract, like <code>T(n − 1) + n</code>, aren't covered at all: add the levels up by hand (that one is O(n²)).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What's the space complexity of merge sort?</div>
  <div class="qa-answer">
    <p><strong>O(n)</strong> extra for the temporary arrays used while merging, plus O(log n) for the recursion depth (it halves each time). O(n) + O(log n) = O(n). The code below creates more than n items' worth of arrays over the whole run, but only about O(n) is alive at once; finished pieces are thrown away.</p>
    <p>Compare in-place quicksort: no temporary arrays, just the recursion stack. That is O(log n) on average, but O(n) in the worst case, when every split is lopsided.</p>
<pre><code class="language-js">function merge(leftHalf, rightHalf) {
  const result = []; // the temporary array: this is the O(n) extra space
  let i = 0;
  let j = 0;
  while (i &lt; leftHalf.length &amp;&amp; j &lt; rightHalf.length) {
    if (leftHalf[i] &lt;= rightHalf[j]) {
      result.push(leftHalf[i]);
      i++;
    } else {
      result.push(rightHalf[j]);
      j++;
    }
  }
  while (i &lt; leftHalf.length) {
    result.push(leftHalf[i]);
    i++;
  }
  while (j &lt; rightHalf.length) {
    result.push(rightHalf[j]);
    j++;
  }
  return result;
}
function mergeSort(items) {
  if (items.length &lt;= 1) {
    return items;
  }
  const mid = Math.floor(items.length / 2);
  const sortedLeft = mergeSort(items.slice(0, mid)); // slice also copies: O(n) per level
  const sortedRight = mergeSort(items.slice(mid));
  return merge(sortedLeft, sortedRight);
}
console.log(mergeSort([5, 2, 4, 1, 3])); // [1, 2, 3, 4, 5]</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why is quicksort O(n log n) average but O(n²) worst?</div>
  <div class="qa-answer">
    <p>Quicksort picks one item, the <strong>pivot</strong>, and splits the rest into "smaller than the pivot" and "bigger". Then it sorts each side the same way.</p>
    <ul>
      <li><strong>Good pivot</strong> (near the middle): two halves. T(n) = 2T(n/2) + n → O(n log n), like merge sort.</li>
      <li><strong>Bad pivot</strong> (the smallest or biggest): one side is empty, the other has n − 1 items. T(n) = T(n − 1) + n → n + (n − 1) + … + 1 → O(n²). A "first item" pivot on already-sorted input does this every time.</li>
    </ul>
    <p>Fixes: a random pivot, the median of three items (first, middle, last), or switching to insertion sort for small pieces and heap sort when things go badly (that is what Introsort does).</p>
<pre><code class="language-js">let comparisons = 0;
function quickSort(items) {
  if (items.length &lt;= 1) {
    return items;
  }
  const pivot = items[0]; // the naive choice: always the first item
  const smaller = [];
  const bigger = [];
  for (let i = 1; i &lt; items.length; i++) {
    comparisons++;
    if (items[i] &lt; pivot) {
      smaller.push(items[i]);
    } else {
      bigger.push(items[i]);
    }
  }
  const sortedSmaller = quickSort(smaller);
  const sortedBigger = quickSort(bigger);
  return sortedSmaller.concat([pivot], sortedBigger);
}
console.log(quickSort([4, 2, 6, 1, 3, 5, 7])); // [1, 2, 3, 4, 5, 6, 7]
console.log(comparisons); // 10  (good pivots: balanced splits)
comparisons = 0;
quickSort([1, 2, 3, 4, 5, 6, 7]);
console.log(comparisons); // 21  (6 + 5 + 4 + 3 + 2 + 1: every split is lopsided)</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. When does O(n²) beat O(n log n) in practice?</div>
  <div class="qa-answer">
    <p>When n is small, usually under about 20 to 50 items. Then the fixed costs decide, and simple loops win. Insertion sort beats merge sort on tiny arrays because it creates no arrays and makes no recursive calls. That's why real sorts (TimSort, Introsort) switch to insertion sort for small pieces.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What is two-sum's time / space?</div>
  <div class="qa-answer">
    <p><strong>Brute force</strong> (try every pair): O(n²) time, O(1) space.</p>
    <p><strong>Hash map, one pass:</strong> O(n) time, O(n) space. For each number, look up its partner <code>target - number</code> in a Map of the numbers seen so far.</p>
    <p>A classic time-space trade-off.</p>
<pre><code class="language-js">// Brute force: O(n²) time, O(1) space
function twoSumBrute(numbers, target) {
  for (let i = 0; i &lt; numbers.length; i++) {
    for (let j = i + 1; j &lt; numbers.length; j++) {
      if (numbers[i] + numbers[j] === target) {
        return [i, j];
      }
    }
  }
  return null;
}

// Hash map: O(n) time, O(n) space
function twoSum(numbers, target) {
  const indexOfValue = new Map(); // value -&gt; where we saw it
  for (let i = 0; i &lt; numbers.length; i++) {
    const need = target - numbers[i]; // the partner this number needs
    if (indexOfValue.has(need)) {
      const partnerIndex = indexOfValue.get(need);
      return [partnerIndex, i];
    }
    indexOfValue.set(numbers[i], i);
  }
  return null;
}
console.log(twoSumBrute([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6)); // [1, 2]</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Time complexity of <code>arr.shift()</code>?</div>
  <div class="qa-answer">
    <p><strong>O(n).</strong> Removing the first item means every other item moves down one place. <code>unshift</code> is O(n) too. So using <code>shift</code> as a <a href="#/topic/dsa-words#w-queue">queue</a> inside a loop makes O(n²).</p>
    <p>JavaScript has no built-in fast queue. Two simple options: a doubly <a href="#/topic/dsa-words#w-linked-list">linked list</a> class, or keep a <code>front</code> index and move it forward instead of shifting:</p>
<pre><code class="language-js">const queue = ["Asha", "Ben", "Chen"];
let front = 0; // position of the next person to serve

queue.push("Dev"); // join at the back: O(1)
const served = queue[front]; // serve from the front: O(1), nothing moves
front++;
console.log(served); // Asha
console.log(queue.length - front); // 3  (people still waiting)</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What's O(V + E) and when does it apply?</div>
  <div class="qa-answer">
    <p>It is the cost of walking a <a href="#/topic/dsa-words#w-graph">graph</a> with <a href="#/topic/dsa-words#w-bfs">BFS</a> (breadth-first: nearest first) or DFS. V is the number of vertices (the points: people, towns). E is the number of edges (the links). The walk visits each vertex once and looks at each edge once (twice for two-way links, which is still O(E)). Total: O(V + E).</p>
    <p>Don't squash it to O(n). A sparse graph, like a road map, has E close to V. A dense graph can have E close to V². The two letters show which one you have.</p>
<pre><code class="language-js">function walkFriends(friendsOf, start) {
  const visited = new Set();
  visited.add(start);
  const queue = [start];
  let front = 0; // next person to process (avoids the O(n) shift)
  let edgeChecks = 0;
  while (front &lt; queue.length) {
    const person = queue[front]; // each vertex is processed once: V
    front++;
    for (const friend of friendsOf[person]) {
      edgeChecks++; // each link is looked at from both ends: 2E
      if (!visited.has(friend)) {
        visited.add(friend);
        queue.push(friend);
      }
    }
  }
  return { reached: visited.size, edgeChecks: edgeChecks };
}
// 4 people (V = 4), 3 two-way friendships (E = 3)
const friendsOf = {
  Asha: ["Ben", "Chen"],
  Ben: ["Asha", "Dev"],
  Chen: ["Asha"],
  Dev: ["Ben"]
};
console.log(walkFriends(friendsOf, "Asha")); // { reached: 4, edgeChecks: 6 }</code></pre>
    <p>The graph is stored as an <a href="#/topic/dsa-words#w-adjacency-list">adjacency list</a>: each person maps to the list of their friends.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What does "log base doesn't matter" mean?</div>
  <div class="qa-answer">
    <p>log₂ n, log₁₀ n and ln n differ only by a fixed multiplier: log₂ n is always about 3.32 × log₁₀ n. Big-O drops fixed multipliers, so they are all O(log n). Binary search really does about log₂ n steps; counting the digits of a number is log₁₀ n. Same Big-O.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Explain "polynomial vs exponential" with an example.</div>
  <div class="qa-answer">
    <p><strong>Polynomial</strong> means n is raised to a fixed power: n², n³. <strong>Exponential</strong> means n is the power: 2ⁿ. At n = 100, n² = 10,000 steps (instant), while 2ⁿ ≈ 10³⁰ steps (longer than the age of the universe). Polynomial scales; exponential does not.</p>
    <p>Problems like "try every subset" or "try every ordering" are exponential by nature. To make them usable you cut branches early that can't lead to an answer. That is called <a href="#/topic/dsa-words#w-pruning">pruning</a>, and it is the core of <a href="#/topic/dsa-words#w-backtracking">backtracking</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How would you choose between two algorithms?</div>
  <div class="qa-answer">
    <ol>
      <li>Give both Big-Os, time and space.</li>
      <li>Estimate n. Small (under about 100): fixed costs matter more than Big-O. Medium (1,000 to 100,000): most reasonable approaches work. Large (a million or more): only O(n log n) or better survives.</li>
      <li>Check memory limits.</li>
      <li>Weigh how hard it is to write and maintain. Sometimes a simple O(n²) is the right call.</li>
      <li>Check other needs, like keeping equal items in their original order. That is called a <a href="#/topic/dsa-words#w-stable-sort">stable</a> sort: merge sort is stable, quicksort is not.</li>
      <li>When fixed costs matter, measure both.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You drop fixed multipliers and smaller terms.</li>
    <li>You give both time AND space.</li>
    <li>You include recursion depth in space.</li>
    <li>You separate worst, average, amortized and expected.</li>
    <li>You memoize repeated subproblems.</li>
    <li>You name the Master Theorem when a recursion splits into equal parts.</li>
    <li>You know fixed costs still decide real speed for small n.</li>
    <li>You know the costs of common operations by heart, including JS's hidden O(n) ones.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. What's the difference between Big O, Big Theta and Big Omega?</div>
  <div class="qa-answer">
    <p><strong>O</strong> is a ceiling: the work grows at most this fast. <strong>Ω</strong> (omega) is a floor: it grows at least this fast. <strong>Θ</strong> (theta) is both: it grows exactly this fast, up to a fixed multiplier. Like guessing an age: "at most 40" (O), "at least 30" (Ω), "about 35" (Θ).</p>
    <p>Formally, <code>f(n) = O(g(n))</code> if there are fixed numbers c and n₀ with <code>f(n) ≤ c × g(n)</code> for all n ≥ n₀. In interviews, "O(n)" usually means the tight answer (Θ), because a ceiling far above the truth tells nobody anything.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q17. Distinguish worst-case, average-case and amortized complexity.</div>
  <div class="qa-answer">
    <p><strong>Worst case</strong> is the cost on the unluckiest input: quicksort with a bad pivot every time is O(n²); a hash table where every key lands in one slot is O(n) per lookup.</p>
    <p><strong>Average case</strong> is the cost on a typical random input: quicksort with a first-item pivot on a random input is O(n log n); hash lookup is O(1).</p>
    <p><strong>Expected</strong> is the average over the code's own coin flips on <em>any</em> input: quicksort with a random pivot is O(n log n) expected, even on sorted input.</p>
    <p><strong>Amortized</strong> is different from both. It is the average cost per operation over a long <em>run</em> of operations, on any input. Occasional expensive steps are paid for by many cheap ones: array push and hash-table resizing are O(1) amortized.</p>
    <p>When they differ, say both, for example "O(1) average, O(n) worst".</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q18. Rank the common growth rates from O(1) to O(n!) and give an example of each.</div>
  <div class="qa-answer">
    <div class="diagram"><pre>label        example                          about how big n can be
O(1)         array read, Map lookup           anything
O(log n)     binary search, balanced tree     anything
O(n)         one loop over the items          ~100 million
O(n log n)   merge sort, heap sort            ~10 million
O(n²)        loop inside a loop               ~10,000
O(2ⁿ)        every subset, naive Fibonacci    ~20-30
O(n!)        every ordering (permutation)     ~10-12</pre></div>
    <p>The size limits assume about one second of work. Each row grows faster than the one above it.</p>
  </div>
</div>
` },

  ]
});
