// Two Pointers, rewritten in plain English (Nov 2026). Main picture: two fingers on a row of
// price tags in a shop. Each finger is a variable holding a position ("left", "right",
// "slow", "fast"). DSA words link to the glossary at #/topic/dsa-words#w-<slug>.
window.PREP_SITE.registerTopic({
  id: "dsa-two-pointers",
  module: "dsa",
  title: "Two Pointers",
  estimatedReadTime: "40 min",
  tags: ["dsa","two-pointers","array","string","pattern"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Put two fingers on the data and move them by a rule, so that <strong>every move rules something out for good</strong>. That turns "check every pair" (a loop inside a loop, <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a>) into <strong>one pass</strong> (<a href="#/topic/dsa-words#w-o-n">O(n)</a>), usually with no extra memory (<a href="#/topic/dsa-words#w-o-1">O(1)</a> space). First spot what makes the rule safe: the data is <a href="#/topic/dsa-words#w-sorted">sorted</a>, it is symmetric, or a value only moves one way.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Two <a href="#/topic/dsa-words#w-index">indexes</a>, moved on purpose.</strong> A <a href="#/topic/dsa-words#w-pointer">pointer</a> here is just a number variable holding a position. Each step looks at the two items and decides which finger to move.</li>
    <li><strong>Shape 1, from both ends inwards:</strong> sorted pair sums, <a href="#/topic/dsa-words#w-palindrome">palindromes</a> (reads the same both ways), container with most water. Move the finger the comparison tells you to.</li>
    <li><strong>Shape 2, same direction (slow + fast):</strong> remove duplicates, move zeros, partition (split into two groups). <code>slow</code> = where the next kept item is written; <code>fast</code> = the item being read.</li>
    <li><strong>Shape 3, different speeds (<a href="#/topic/dsa-words#w-fast-slow-pointers">Floyd's tortoise and hare</a>):</strong> loop (cycle) in a <a href="#/topic/dsa-words#w-linked-list">linked list</a>, middle of a list, nth from the end. O(1) memory, instead of the O(n) a <a href="#/topic/dsa-words#w-hash-set">Set</a> of visited nodes needs.</li>
    <li><strong>Both-ends needs sorted data, so sort first</strong> (<a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a>). But sorting loses the original positions: for two-sum on an unsorted array that must return positions, use a <a href="#/topic/dsa-words#w-hash-map">Map</a> instead.</li>
    <li><strong>3-sum without repeats:</strong> skip <code>nums[i] === nums[i - 1]</code> in the outer loop, and after each match skip both inner fingers past equal neighbours.</li>
    <li><strong>Container with most water: move the shorter wall.</strong> Moving the taller one can never give a bigger area.</li>
    <li><strong>Trapping rain water:</strong> work on the side whose highest wall so far is lower; its water level is already known. O(n) time, O(1) space.</li>
    <li><strong><a href="#/topic/dsa-words#w-dutch-national-flag">Dutch flag</a></strong> (three pointers, sort 0s/1s/2s): after swapping with <code>high</code>, do NOT move <code>mid</code>; the swapped-in value has not been checked.</li>
    <li><strong>Floyd's setup:</strong> both start at the <a href="#/topic/dsa-words#w-head-tail">head</a>; loop while <code>fast !== null &amp;&amp; fast.next !== null</code>. To find where the loop starts, send one pointer back to the head and step both by 1.</li>
    <li><strong>Squares of a sorted array:</strong> the biggest square is at one of the two ends. Fill the answer from the back: O(n) instead of an O(n log n) sort.</li>
    <li><strong><code>left &lt; right</code> stops before the fingers meet (the middle item is not looked at); <code>left &lt;= right</code> looks at it too.</strong> Pick per problem. A <a href="#/topic/dsa-words#w-dummy-node">dummy node</a> makes removing a list's head work like removing any other node.</li>
  </ul>
  <h4>Complexity &amp; when to reach for it</h4>
  <ul>
    <li><strong>Time:</strong> O(n) for one-pass problems. O(n²) for 3-sum (an outer loop, and a two-finger pass inside it). O(n log n) when you must sort first and the rest is one pass.</li>
    <li><strong>Space:</strong> O(1) when you change the array <a href="#/topic/dsa-words#w-in-place">in place</a>. O(n) only when you build a new output array (sorted squares, merge).</li>
    <li><strong>The signal:</strong> sorted + "pair / triplet that adds to X" → both ends. Palindrome / symmetry → both ends. "In place: remove / move / partition" → slow + fast. Linked list loop / middle / nth from end → fast + slow speeds. "Sort 0s, 1s and 2s" → Dutch flag.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Using both-ends two pointers on an UNSORTED array.</strong> The "too small → move left, too big → move right" rule only works when the data is sorted. Sort first, but remember sorting loses the original positions (use a Map for two-sum on unsorted input). The other repeat mistakes: forgetting to skip duplicates, so 3-sum returns the same triplet twice; moving <code>mid</code> after a swap with <code>high</code> in the Dutch flag; mixing up <code>left &lt; right</code> with <code>left &lt;= right</code>; and running Floyd's loop without checking <code>fast</code> and <code>fast.next</code> for <code>null</code>.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The array is sorted, so I'll put one pointer at each end. If the sum is too small, only moving left can raise it; if it's too big, only moving right can lower it. Each step rules out one item for good, so it's O(n) time and O(1) space."</div>
  <div class="revision-say">"In container with most water I always move the shorter wall. The water height is capped by the shorter wall, so moving the taller one keeps or lowers that cap while the width shrinks. It can never help."</div>
  <div class="revision-say">"For a loop in a linked list I use Floyd's tortoise and hare. Both start at the head; slow moves 1 step and fast moves 2. If they meet there's a loop, and it needs O(1) memory instead of an O(n) visited set."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The pattern: two fingers on a shelf of price tags</h3>
<p>You are in a gift shop with a gift card worth exactly ₹10. You want to buy <strong>two</strong> items that use it up exactly. The shop has lined the items up on one shelf, <strong>cheapest on the left, priciest on the right</strong>.</p>
<p>You put your left finger on the cheapest item and your right finger on the priciest. Add the two prices:</p>
<ul>
  <li><strong>Too much?</strong> The right item is too expensive to pair with anything here, even the cheapest. Move the <em>right</em> finger one step left, to a cheaper item.</li>
  <li><strong>Too little?</strong> The left item is too cheap to pair with anything here, even the priciest. Move the <em>left</em> finger one step right, to a pricier item.</li>
  <li><strong>Exactly ₹10?</strong> Done.</li>
</ul>
<p>The fingers walk towards each other and stop when they meet. You never go back.</p>
<p>In code, the shelf is an <a href="#/topic/dsa-words#w-array">array</a> that is <a href="#/topic/dsa-words#w-sorted">sorted</a> (in order, smallest first). Each finger is a plain number variable holding an <a href="#/topic/dsa-words#w-index">index</a> (a position: 0 for the first item, 1 for the second, and so on):</p>
<ul>
  <li><code>left</code> is the index of the item under your left finger. It starts at <code>0</code>.</li>
  <li><code>right</code> is the index under your right finger. It starts at <code>prices.length - 1</code>, the last item.</li>
</ul>
<p>A variable that holds a position like this is called a <a href="#/topic/dsa-words#w-pointer">pointer</a>. Using two of them, moved by a clear rule, is the <a href="#/topic/dsa-words#w-two-pointers">two pointers</a> pattern. "Move the right finger left" in code is just <code>right--</code>.</p>

<h3>A real problem: spend the gift card exactly</h3>
<p>The prices on the shelf are <code>[1, 3, 4, 5, 7, 11]</code>, already sorted. The gift card is worth <strong>10</strong>. Which two items add up to exactly 10?</p>
<p>The answer is 3 + 7, the items at indexes 1 and 4. (Interviewers call this "two sum on a sorted array".)</p>

<h3>The slow way, counted in steps</h3>
<p>The first idea most people write: try every pair. Take each item, and check it against every item after it.</p>
<pre><code class="language-js">function twoSumSlow(prices, target) {
  for (let i = 0; i &lt; prices.length; i++) {
    for (let j = i + 1; j &lt; prices.length; j++) { // every item after i
      if (prices[i] + prices[j] === target) {
        return [i, j];
      }
    }
  }
  return []; // no pair found
}
console.log(twoSumSlow([1, 3, 4, 5, 7, 11], 10)); // [1, 4]</code></pre>
<p>It is correct, but count the work. With n items there are n × (n − 1) / 2 pairs. This shape of code, which does work for every pair, is called a <a href="#/topic/dsa-words#w-brute-force">brute force</a>.</p>
<ul>
  <li>6 items: 6 × 5 / 2 = <strong>15 pair checks</strong> at most. No problem.</li>
  <li>10,000 items: 10,000 × 9,999 / 2 ≈ <strong>50 million pair checks</strong>.</li>
</ul>
<p>And it ignores the one thing we were given for free: the shelf is sorted.</p>

<h3>What two pointers fixes</h3>
<p>With two fingers, every check moves one finger by one step, and a finger never moves back. The fingers start n − 1 steps apart and stop when they meet. So there are <strong>at most n − 1 checks</strong>.</p>
<ul>
  <li>6 items: at most 5 checks (for this shelf, 3 are enough; see the trace in the Mental Model).</li>
  <li>10,000 items: at most 9,999 checks, instead of 50 million.</li>
</ul>
<p><a href="#/topic/dsa-words#w-big-o">Big-O</a> describes how the work grows as the input grows. The slow way is <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a>: twice the items, four times the work. Two pointers is <a href="#/topic/dsa-words#w-o-n">O(n)</a>: twice the items, twice the work. It also needs only two number variables however big the input is. That is <a href="#/topic/dsa-words#w-o-1">O(1)</a> extra space: memory that does not grow with the input.</p>

<h3>Why two pointers works</h3>
<p>The trick is that every move <strong>throws away a whole item, safely</strong>.</p>
<ul>
  <li>Say <code>prices[left] + prices[right]</code> is too big. <code>prices[left]</code> is the cheapest item still in play. If even the cheapest partner makes the sum too big, then <em>every</em> partner does. So the item at <code>right</code> can never be part of the answer. Drop it: <code>right--</code>.</li>
  <li>Say the sum is too small. <code>prices[right]</code> is the priciest item still in play. If even the priciest partner is not enough, nothing is. So the item at <code>left</code> is useless. Drop it: <code>left++</code>.</li>
</ul>
<p>Each step rules out one item for good, and each finger moves at most n times in total. That is why it is O(n). The whole argument depends on the order: <strong>without sorting, "the cheapest still in play" means nothing</strong>, and the rule breaks.</p>

<h3>Variations</h3>
<p>"Two pointers" is a family. All of them use two (or three) position variables that move by a rule, but the fingers move in different ways:</p>
<table>
  <thead><tr><th>Variation</th><th>The picture</th><th>Use it for</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Opposite ends, walking inwards</td><td>Two fingers on the shelf, from both ends</td><td>Sorted data, symmetry, "container" problems</td><td>Two-sum on sorted, palindrome, container with most water</td></tr>
    <tr><td>Same direction (slow + fast)</td><td>A <em>reader</em> finger and a <em>writer</em> finger: the reader checks every item; the writer only moves when an item is kept</td><td>Changing an array <a href="#/topic/dsa-words#w-in-place">in place</a> (no second array): remove items, remove duplicates, split into groups</td><td>Remove duplicates, move zeros</td></tr>
    <tr><td>Different speeds (slow + fast)</td><td>Two runners on a track: one runs twice as fast</td><td>Finding a loop or the middle of a linked list</td><td><a href="#/topic/dsa-words#w-fast-slow-pointers">Floyd's algorithm</a>, middle of a linked list</td></tr>
    <tr><td>Three pointers</td><td>Sorting laundry into three piles in one walk</td><td>Splitting into three groups; triplets</td><td><a href="#/topic/dsa-words#w-dutch-national-flag">Dutch flag</a>, three-sum</td></tr>
  </tbody>
</table>

<h3>When two pointers DOESN'T work</h3>
<ul>
  <li><strong>Unsorted data, and you are not allowed to sort.</strong> For example, two-sum that must return the <em>original</em> positions. Sorting moves the items, so the positions change. Use a <a href="#/topic/dsa-words#w-hash-map">Map</a> instead (see Q16).</li>
  <li><strong>No "one way only" rule to lean on.</strong> If neither "too big" nor "too small" tells you which item to throw away, you really do have to consider all pairs. The fancy word for "only goes one way" is <a href="#/topic/dsa-words#w-monotonic">monotonic</a>: in a sorted array, moving <code>left</code> right can only raise the sum.</li>
  <li><strong>You need a stretch of items that changes as you go</strong>, like "the longest run with no repeated letter". That is the <a href="#/topic/dsa-sliding-window">sliding window</a> pattern: also two pointers, but they mark the two edges of a <a href="#/topic/dsa-words#w-window">window</a> and you keep a running total of what is inside it.</li>
</ul>

<h3>Why "skip duplicates" matters</h3>
<p>In 3-sum you find every group of three numbers that adds to 0, and each group should be listed <strong>once</strong>. Take <code>[-1, -1, 0, 1, 2]</code>. The outer loop fixes the first number. The first <code>-1</code> finds <code>[-1, -1, 2]</code> and <code>[-1, 0, 1]</code>. Then the second <code>-1</code> would find <code>[-1, 0, 1]</code> <em>again</em>, because it has the same value. The fix: in the outer loop, skip any value equal to the one just before it (<code>nums[i] === nums[i - 1]</code>). Do the same for the two inner fingers right after a match.</p>

<h3>Why on linked lists</h3>
<p>A <a href="#/topic/dsa-words#w-linked-list">linked list</a> is a chain of small objects called <a href="#/topic/dsa-words#w-node">nodes</a>. Each node holds a value and a <code>next</code> link to the next node. Think of a treasure hunt: each clue tells you where the next clue is. You cannot jump to "clue number 50"; you have to follow 49 clues to get there. The first node is the <a href="#/topic/dsa-words#w-head-tail">head</a>; the last node's <code>next</code> is <code>null</code>.</p>
<p>So there is no <code>list[i]</code>, and no way to start a finger "at the end". But two fingers that walk forward at <em>different speeds</em> still tell you a lot in a single walk:</p>
<ul>
  <li>When the fast one (2 steps at a time) reaches the end, the slow one (1 step) is in the middle.</li>
  <li>If the chain loops back on itself (a <a href="#/topic/dsa-words#w-cycle">cycle</a>), the fast one never reaches the end. It goes round and round, and catches up with the slow one, like a runner lapping another on a track.</li>
</ul>
<p>This is <strong>Floyd's cycle detection</strong>, also called the tortoise and the hare. It is the classic linked-list use of two pointers.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<p>A <strong>trace</strong> is a table of what every variable holds after each step. The four traces below cover the four shapes of two pointers. They use small inputs so you can check every line by hand. The answer column comes first in each table.</p>

<h3>The "convergence" picture</h3>
<p>"Convergence" means the two fingers walk towards each other until they meet. This is the gift card problem from What &amp; Why: prices <code>[1, 3, 4, 5, 7, 11]</code>, card worth 10. It is exactly what the code in <a href="#/topic/dsa-two-pointers#mechanics">Two sum on sorted</a> does (that version adds 1 to each, so it prints [2, 5]).</p>
<div class="diagram"><pre>prices = [1, 3, 4, 5, 7, 11]      target = 10
index:    0  1  2  3  4  5

found?  left  right  pair     sum  compared to 10  move
no      0     5      1 + 11   12   too big         right-- (to 4)
no      0     4      1 + 7    8    too small       left++  (to 1)
YES     1     4      3 + 7    10   exact           stop

Answer: indexes [1, 4]   (3 + 7 = 10)
Row 1 throws away 11: even the cheapest partner (1) is too much.
Row 2 throws away 1: even the priciest partner left (7) is too little.
Work: 3 checks. Trying every pair could take up to 15.</pre></div>

<h3>The "fast / slow" picture</h3>
<p>Here both fingers start at the left and walk the same way. Problem: move every 0 to the end, keeping the other numbers in their order. <code>fast</code> is the <em>reader</em>: it looks at every item. <code>slow</code> is the <em>writer</em>: it marks the spot where the next non-zero belongs, and only moves when it gets one. This is the code in <a href="#/topic/dsa-two-pointers#mechanics">Move zeros to end</a>.</p>
<div class="diagram"><pre>nums = [0, 1, 0, 3, 12]

array AFTER this step  fast  reads  slow before  what happens
[0, 1, 0, 3, 12]       0     0      0            a zero: skip it
[1, 0, 0, 3, 12]       1     1      0            swap spots 0, 1; slow = 1
[1, 0, 0, 3, 12]       2     0      1            a zero: skip it
[1, 3, 0, 0, 12]       3     3      1            swap spots 1, 3; slow = 2
[1, 3, 12, 0, 0]       4     12     2            swap spots 2, 4; slow = 3

Answer: [1, 3, 12, 0, 0]
Everything before slow is a kept number, in its original order.
fast read 5 items once each: one pass.</pre></div>

<h3>The "Floyd's cycle" picture</h3>
<p>A linked list whose last node links back into the middle, so it loops forever:</p>
<div class="diagram"><pre>head
 1 → 2 → 3 → 4 → 5
         ↑       ↓
         7  ←─── 6        (7's next is 3: the loop is 3 4 5 6 7)</pre></div>
<p>The tortoise (<code>slow</code>) moves 1 node per step; the hare (<code>fast</code>) moves 2. Both start at the head. This is the code in <a href="#/topic/dsa-two-pointers#mechanics">Floyd's cycle detection</a>.</p>
<div class="diagram"><pre>PHASE 1: is there a loop?
met?  step   slow at  fast at
-     start  1        1
no    1      2        3
no    2      3        5
no    3      4        7
no    4      5        4        fast went 7 → 3 → 4, round the loop
YES   5      6        6        they meet at node 6: there IS a loop

PHASE 2: where does the loop start?
Send one pointer (call it finder) back to the head. Leave the other
at node 6. Now move BOTH by 1 step.
met?  step   finder   other
no    start  1        6
no    1      2        7
YES   2      3        3        → the loop starts at node 3

No loop? Then fast hits null (the end) and we stop with "no loop".</pre></div>
<p>Why Phase 2 works is explained in Interview Q8. The short version: from the head and from the meeting point, the loop's start is the same number of steps away (give or take whole laps).</p>

<h3>The "Dutch flag" picture (3 pointers)</h3>
<p>Sort an array that holds only 0s, 1s and 2s, in one pass. Three pointers split it into four zones:</p>
<div class="diagram"><pre>[ 0 0 0 | 1 1 1 | ? ? ? ? | 2 2 2 ]
          ↑       ↑     ↑
         low     mid   high

before low:          all 0s
low .. mid - 1:      all 1s
mid .. high:         not checked yet
after high:          all 2s

look at nums[mid]:
  0 → swap it with nums[low]; low + 1, mid + 1
  1 → already in the 1s zone; mid + 1
  2 → swap it with nums[high]; high - 1; do NOT move mid
      (the value that came from high has not been checked yet)</pre></div>
<p>Trace on <code>[2, 0, 1, 0, 2, 1, 0]</code>. This is the code in <a href="#/topic/dsa-two-pointers#ex-12">Example 12</a>.</p>
<div class="diagram"><pre>array AFTER this step  low  mid  high  saw  what happens
[2, 0, 1, 0, 2, 1, 0]  0    0    6     -    start
[0, 0, 1, 0, 2, 1, 2]  0    0    5     2    swap mid and high; high - 1
[0, 0, 1, 0, 2, 1, 2]  1    1    5     0    swap low and mid; both + 1
[0, 0, 1, 0, 2, 1, 2]  2    2    5     0    swap low and mid; both + 1
[0, 0, 1, 0, 2, 1, 2]  2    3    5     1    mid + 1
[0, 0, 0, 1, 2, 1, 2]  3    4    5     0    swap low and mid; both + 1
[0, 0, 0, 1, 1, 2, 2]  3    4    4     2    swap mid and high; high - 1
[0, 0, 0, 1, 1, 2, 2]  3    5    4     1    mid + 1; mid passed high: stop

Answer: [0, 0, 0, 1, 1, 2, 2]
Row 2: the 2 went to the back and a 0 came in. mid stayed, and
row 3 checked that 0. Moving mid there would have skipped it.</pre></div>

<h3>How to recognise a two-pointer question</h3>
<p>The wording gives it away. Look for:</p>
<ol>
  <li><strong>Sorted input plus a pair or triplet:</strong> "sorted array", "find two numbers that add up to", "three numbers that sum to 0", "closest sum".</li>
  <li><strong>Symmetry:</strong> "palindrome", "reverse", "reads the same".</li>
  <li><strong>In place:</strong> "without extra space", "modify the array in place", "remove", "move all X to the end", "return the new length".</li>
  <li><strong>Linked list shape:</strong> "cycle", "loop", "middle node", "nth node from the end".</li>
  <li><strong>Two sorted lists:</strong> "merge", "compare", "intersection".</li>
</ol>
<table>
  <thead><tr><th>The question says…</th><th>Use…</th></tr></thead>
  <tbody>
    <tr><td>"sorted" + "pair that adds to X"</td><td>Opposite ends, walking inwards</td></tr>
    <tr><td>"three numbers that sum to…"</td><td>Sort, fix one number, opposite ends on the rest</td></tr>
    <tr><td>"palindrome" / "reverse in place"</td><td>Opposite ends</td></tr>
    <tr><td>"in place", "remove", "move zeros", "new length"</td><td>Slow (writer) + fast (reader)</td></tr>
    <tr><td>"linked list" + "cycle" / "middle"</td><td>Fast and slow at different speeds</td></tr>
    <tr><td>"nth from the end" (one pass)</td><td>Fast goes n steps ahead, then both move together</td></tr>
    <tr><td>"sort 0s, 1s and 2s" / "three groups"</td><td>Dutch flag (three pointers)</td></tr>
  </tbody>
</table>
<p><strong>Red flags that it is NOT plain two pointers:</strong> the array is unsorted and you must return original positions (use a <a href="#/topic/dsa-words#w-hash-map">Map</a>); the question is about the longest or shortest stretch that follows a rule (use a <a href="#/topic/dsa-sliding-window">sliding window</a>).</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Two pointers always means starting at both ends." No. In the fast / slow trace above, both pointers start at index 0 and move the same way. What makes it two pointers is: <strong>two positions, each moved on purpose by a rule</strong>, so that nothing has to be checked twice.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>Two templates, written as real code you can run, then every classic variant one at a time. Each variant only changes two things: <strong>where the fingers start</strong> and <strong>the rule that decides which finger moves</strong>.</p>

<h3>Template — opposite ends</h3>
<p>The shape in words: one finger at the start, one at the end. While they have not met, look at both items. Either record an answer, or move the one finger that the comparison says is useless.</p>
<p>A real version. Problem: <em>prices are sorted; how many pairs of items cost at most your budget together?</em></p>
<pre><code class="language-js">function countPairsWithinBudget(sortedPrices, budget) {
  let left = 0; // cheapest item still in play
  let right = sortedPrices.length - 1; // priciest item still in play
  let pairCount = 0;
  while (left &lt; right) { // stop when the fingers meet: a pair needs two different items
    const sum = sortedPrices[left] + sortedPrices[right];
    if (sum &lt;= budget) {
      // left fits with right, so it also fits with every cheaper item between them.
      // That is (right - left) pairs that all use the item at left.
      pairCount += right - left;
      left++; // every pair using the item at left is now counted
    } else {
      right--; // too pricey even with the cheapest partner: drop the item at right
    }
  }
  return pairCount;
}
console.log(countPairsWithinBudget([1, 2, 3, 5, 8], 7)); // 5</code></pre>
<p>Line by line:</p>
<ul>
  <li><code>left</code> starts on the first item and <code>right</code> on the last.</li>
  <li><code>while (left &lt; right)</code>: once they meet, there are no pairs left to look at.</li>
  <li>If the sum fits the budget, the item at <code>left</code> also fits with every item between the two fingers (they are all cheaper than <code>right</code>). Count them all at once, then move <code>left</code>.</li>
  <li>If the sum is too big, the item at <code>right</code> is too pricey even with the cheapest partner. Drop it.</li>
</ul>
<p>Short trace: 1 + 8 = 9 &gt; 7, drop 8. 1 + 5 = 6 fits: count 3 pairs (1 with 2, 3, 5). 2 + 5 = 7 fits: count 2 more (2 with 3, 5). 3 + 5 = 8 &gt; 7, drop 5. Fingers meet. Total <strong>5</strong>. Time O(n), space O(1).</p>

<h3>Template — slow + fast</h3>
<p>The shape in words: both fingers start at the front. <code>fast</code> reads every item. When an item should be kept, write it at <code>slow</code> and move <code>slow</code> on. At the end, the first <code>slow</code> spots hold the kept items, and <code>slow</code> is how many there are.</p>
<p>A real version. Problem: <em>remove every space from an array of characters, in place, and return the new length.</em></p>
<pre><code class="language-js">function removeSpaces(chars) {
  let slow = 0; // the writer: where the next kept character goes
  for (let fast = 0; fast &lt; chars.length; fast++) { // the reader: looks at every character
    if (chars[fast] !== " ") {
      chars[slow] = chars[fast]; // keep it: copy it down to the writer's spot
      slow++;
    }
  }
  return slow; // how many characters were kept = the new length
}
const letters = ["a", " ", "b", " ", " ", "c"];
const newLength = removeSpaces(letters);
console.log(newLength); // 3
console.log(letters.slice(0, newLength)); // ["a", "b", "c"]</code></pre>
<p>Line by line:</p>
<ul>
  <li><code>fast</code> moves every round; <code>slow</code> only moves when something is kept. So <code>slow</code> is never ahead of <code>fast</code>, and writing at <code>slow</code> never overwrites an item we still need to read.</li>
  <li>The items after the new length are leftovers. In-place problems usually say "it does not matter what you leave beyond the new length".</li>
</ul>
<p>Time O(n): <code>fast</code> reads each item once. Space O(1).</p>

<h3>Reverse string</h3>
<p>Swap the first and last characters, then the second and second-to-last, and so on, walking inwards. JavaScript strings are <a href="#/topic/dsa-words#w-immutable">immutable</a> (they cannot be changed in place), so the input here is an array of characters, as on LeetCode.</p>
<pre><code class="language-js">function swap(list, i, j) {
  const temp = list[i]; // hold one value so it is not lost
  list[i] = list[j];
  list[j] = temp;
}
function reverseString(chars) {
  let left = 0;
  let right = chars.length - 1;
  while (left &lt; right) { // when they meet, the middle item stays where it is
    swap(chars, left, right);
    left++;
    right--;
  }
}
const word = ["h", "e", "l", "l", "o"];
reverseString(word);
console.log(word.join("")); // olleh</code></pre>
<p>Line by line: each round swaps one pair and moves both fingers inwards. For "hello": swap h/o, then e/l, then both fingers sit on the middle "l" and the loop stops. Time O(n), space O(1): it changes the array in place.</p>

<h3>Two sum on sorted</h3>
<p>The gift card problem, traced in the Mental Model. LeetCode's version ("Two Sum II") wants the positions counted from 1, not 0, so we add 1 to each.</p>
<pre><code class="language-js">function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;
  while (left &lt; right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) {
      return [left + 1, right + 1]; // LeetCode counts positions from 1
    }
    if (sum &lt; target) {
      left++; // too small: only a bigger left number can raise the sum
    } else {
      right--; // too big: only a smaller right number can lower the sum
    }
  }
  return []; // the fingers met: no pair adds up to target
}
console.log(twoSumSorted([1, 3, 4, 5, 7, 11], 10)); // [2, 5]  (3 + 7)
console.log(twoSumSorted([1, 2, 4], 100)); // []</code></pre>
<p>Line by line: the sum is too small → move <code>left</code>; too big → move <code>right</code>. The fingers start n − 1 apart and every round closes the gap by 1, so there are at most n − 1 rounds. Time O(n), space O(1).</p>

<h3>Three sum</h3>
<p>Find every group of three numbers that adds to 0, each group listed once. The idea: sort, then <strong>fix one number</strong> with an outer loop, and run "two sum on sorted" on the numbers after it, looking for a pair that adds to minus the fixed number.</p>
<pre><code class="language-js">function threeSum(nums) {
  nums.sort((a, b) =&gt; a - b); // sort as numbers (plain .sort() would sort as text)
  const result = [];
  for (let i = 0; i &lt; nums.length - 2; i++) {
    if (nums[i] &gt; 0) {
      break; // the smallest of the three is positive: no group can sum to 0
    }
    if (i &gt; 0 &amp;&amp; nums[i] === nums[i - 1]) {
      continue; // same first number as last round: it would find the same groups
    }
    let left = i + 1;
    let right = nums.length - 1;
    while (left &lt; right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left &lt; right &amp;&amp; nums[left] === nums[left + 1]) {
          left++; // skip copies of this left value
        }
        while (left &lt; right &amp;&amp; nums[right] === nums[right - 1]) {
          right--; // skip copies of this right value
        }
        left++; // now step past the last copy on each side
        right--;
      } else if (sum &lt; 0) {
        left++; // too small: raise it
      } else {
        right--; // too big: lower it
      }
    }
  }
  return result;
}
console.log(threeSum([-1, 0, 1, 2, -1, -4])); // [[-1, -1, 2], [-1, 0, 1]]</code></pre>
<p>Line by line:</p>
<ul>
  <li>Sorting is what lets the inner pair use the "too small / too big" rule.</li>
  <li>The <code>break</code>: once the fixed number is above 0, the two after it are too, so nothing can add to 0.</li>
  <li>The <code>continue</code> skips a fixed number we have already tried, so no group is found twice.</li>
  <li>After a match, the two small <code>while</code> loops slide past copies of the matched values. Then both fingers step once more. Both must move: keeping one still would only find the same group again.</li>
</ul>
<p>Cost: the outer loop runs about n times and the inner pass is O(n), so O(n²) time. The sort, O(n log n), is smaller than that. Space: O(1) besides the output. (Strictly, JavaScript's built-in sort may use up to about n extra slots of memory.) The full trace is in <a href="#/topic/dsa-two-pointers#ex-4">Example 4</a>.</p>

<h3>Container with most water</h3>
<p>Each number is the height of a wall standing on a line. Pick two walls; the water they hold is <code>(shorter wall) × (distance between them)</code>. Find the most water.</p>
<pre><code class="language-js">function maxArea(heights) {
  let left = 0;
  let right = heights.length - 1;
  let bestArea = 0;
  while (left &lt; right) {
    const shorterWall = Math.min(heights[left], heights[right]); // water can't rise above it
    const width = right - left;
    const area = shorterWall * width;
    bestArea = Math.max(bestArea, area);
    if (heights[left] &lt; heights[right]) {
      left++; // left is shorter: it is the limit, so move it
    } else {
      right--; // right is shorter (or both are equal): move right
    }
  }
  return bestArea;
}
console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49</code></pre>
<p>Line by line: we start with the widest pair. Width can only shrink from here, so the only hope of more water is a taller shorter-wall. Moving the taller wall keeps the same shorter wall (or a lower one) and loses width, so it can never help. So we always move the shorter one. On the example, the best is walls 8 (index 1) and 7 (index 8): 7 × 7 = 49. Time O(n), space O(1).</p>

<h3>Trapping rain water</h3>
<p>Each number is the height of a bar. After rain, how much water sits between the bars? The water above one bar is <code>min(tallest bar to its left, tallest bar to its right) - its own height</code>.</p>
<pre><code class="language-js">function trap(heights) {
  let left = 0;
  let right = heights.length - 1;
  let leftMax = 0; // tallest bar seen so far from the left
  let rightMax = 0; // tallest bar seen so far from the right
  let water = 0;
  while (left &lt; right) {
    if (heights[left] &lt; heights[right]) {
      // There is a bar on the right at least this tall, so the left side
      // decides the water level here.
      leftMax = Math.max(leftMax, heights[left]);
      water += leftMax - heights[left]; // 0 when this bar is the new tallest
      left++;
    } else {
      // Mirror image: the right side decides the water level here.
      rightMax = Math.max(rightMax, heights[right]);
      water += rightMax - heights[right];
      right--;
    }
  }
  return water;
}
console.log(trap([3, 0, 2, 0, 4])); // 7
console.log(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6</code></pre>
<p>Line by line: we always work on the side with the <em>lower</em> bar. Say the left bar is lower. Then somewhere on the right there is a bar at least as tall as it, so the right side will never be the limit for this spot. The water here depends only on <code>leftMax</code>, which we already know.</p>
<div class="diagram"><pre>heights = [3, 0, 2, 0, 4]

water so far  left  right  side   leftMax  this bar's water
0             0     4      left   3        3 - 3 = 0
3             1     4      left   3        3 - 0 = 3
4             2     4      left   3        3 - 2 = 1
7             3     4      left   3        3 - 0 = 3
left = 4 = right: stop.   Answer: 7</pre></div>
<p>Time O(n), space O(1). The simpler version builds two arrays (tallest-to-the-left and tallest-to-the-right for every spot) and costs O(n) space; two pointers removes them.</p>

<h3>Remove duplicates from sorted</h3>
<p>In a sorted array, copies sit next to each other. Keep one of each, in place, and return how many are kept.</p>
<pre><code class="language-js">function removeDuplicates(nums) {
  if (nums.length === 0) {
    return 0;
  }
  let slow = 0; // index of the last kept (unique) value
  for (let fast = 1; fast &lt; nums.length; fast++) {
    if (nums[fast] !== nums[slow]) { // a new value: sorted, so all its copies come together
      slow++; // move the writer to the next free spot...
      nums[slow] = nums[fast]; // ...and keep the new value there
    }
  }
  return slow + 1; // slow is an index; the count is one more
}
const scores = [1, 1, 2, 3, 3];
const keptCount = removeDuplicates(scores);
console.log(keptCount); // 3
console.log(scores.slice(0, keptCount)); // [1, 2, 3]</code></pre>
<p>Line by line: here <code>slow</code> points at the last kept value (not the next free spot), so we move it first and then write. That is why the answer is <code>slow + 1</code>. Time O(n), space O(1).</p>

<h3>Move zeros to end</h3>
<p>Traced step by step in the Mental Model. Every non-zero is swapped down to the writer's spot, so the zeros drift to the back and the other numbers keep their order.</p>
<pre><code class="language-js">function moveZeroes(nums) {
  let slow = 0; // where the next non-zero belongs
  for (let fast = 0; fast &lt; nums.length; fast++) {
    if (nums[fast] !== 0) {
      const temp = nums[slow]; // swap nums[slow] and nums[fast]
      nums[slow] = nums[fast];
      nums[fast] = temp;
      slow++;
    }
  }
}
const data = [0, 1, 0, 3, 12];
moveZeroes(data);
console.log(data); // [1, 3, 12, 0, 0]</code></pre>
<p>Why a swap and not a copy: the swap moves the zero that was at <code>slow</code> back to <code>fast</code>, so no zero-filling pass is needed at the end. Time O(n), space O(1).</p>

<h3>Floyd's cycle detection (linked list)</h3>
<p>Two functions. <code>hasCycle</code> answers "is there a loop?". <code>detectCycle</code> also finds the node where the loop starts. Both are traced in the Mental Model. Each node is <code>{ value, next }</code>.</p>
<pre><code class="language-js">// Helper: build 1 → 2 → ... and (optionally) link the last node back to index loopTo
function buildList(values, loopTo) {
  const nodes = [];
  for (const value of values) {
    nodes.push({ value: value, next: null });
  }
  for (let i = 0; i + 1 &lt; nodes.length; i++) {
    nodes[i].next = nodes[i + 1];
  }
  if (loopTo &gt;= 0) {
    nodes[nodes.length - 1].next = nodes[loopTo]; // close the loop
  }
  return nodes[0];
}

function hasCycle(head) {
  let slow = head; // tortoise: 1 step at a time
  let fast = head; // hare: 2 steps at a time
  while (fast !== null &amp;&amp; fast.next !== null) { // the hare can take 2 more steps
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) { // same node object, not just same value
      return true; // the hare lapped the tortoise: there is a loop
    }
  }
  return false; // the hare reached the end: no loop
}

function detectCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) { // phase 1 done: they met inside the loop
      let finder = head; // phase 2: one pointer goes back to the head
      while (finder !== slow) {
        finder = finder.next; // both now move 1 step at a time
        slow = slow.next;
      }
      return finder; // they meet exactly where the loop starts
    }
  }
  return null; // no loop
}

const looped = buildList([1, 2, 3, 4, 5, 6, 7], 2); // 7 links back to 3
const straight = buildList([1, 2, 3], -1);
console.log(hasCycle(looped)); // true
console.log(hasCycle(straight)); // false
console.log(detectCycle(looped).value); // 3
console.log(detectCycle(straight)); // null</code></pre>
<p>Line by line:</p>
<ul>
  <li>The loop check <code>fast !== null &amp;&amp; fast.next !== null</code> makes sure <code>fast.next.next</code> is safe to read. It also handles an empty list (<code>head</code> is <code>null</code>) and a one-node list.</li>
  <li><code>slow === fast</code> compares node <em>objects</em>. Two different nodes can hold the same value.</li>
  <li>Phase 2 must start with <em>both</em> pointers having started at the head in phase 1. That is what makes the step counts line up (Interview Q8).</li>
</ul>
<p>Time O(n): the hare catches the tortoise before the tortoise finishes its first lap of the loop. Space O(1): two variables, instead of a <a href="#/topic/dsa-words#w-hash-set">Set</a> holding every visited node.</p>

<h3>Find middle of linked list</h3>
<p>The hare moves 2 steps for every 1 step of the tortoise. So when the hare reaches the end, the tortoise has gone half as far: it is in the middle. For an even number of nodes this gives the <em>second</em> of the two middle nodes. Same loop as Floyd's, without the "did they meet?" check. Full code and trace: <a href="#/topic/dsa-two-pointers#ex-10">Example 10</a>. Time O(n), space O(1).</p>

<h3>Dutch flag (sort 0/1/2)</h3>
<p>Three pointers: <code>low</code> (the next spot for a 0), <code>mid</code> (the item being checked) and <code>high</code> (the next spot for a 2). A 0 is swapped down to <code>low</code>, a 2 is swapped up to <code>high</code>, a 1 is left alone. The rule to remember: after swapping with <code>high</code>, do not move <code>mid</code>. The zone picture and a full trace are in the Mental Model; the code is in <a href="#/topic/dsa-two-pointers#ex-12">Example 12</a>. One pass: time O(n), space O(1).</p>

<h3>Squares of sorted array</h3>
<p>The input is sorted but may have negatives, like <code>[-4, -1, 0, 3, 10]</code>. Squaring makes big negatives big, so the <em>largest</em> square is always at one of the two ends. Put a finger on each end, take the one with the bigger absolute value (size without the sign), and write its square at the <em>back</em> of the answer, filling towards the front. Full code and trace: <a href="#/topic/dsa-two-pointers#ex-8">Example 8</a>. Time O(n) instead of the O(n log n) of "square everything, then sort". Space O(n) for the answer array.</p>

<h3>Backspace string compare</h3>
<p>In each string, <code>#</code> means "backspace": delete the character before it. Do <code>s</code> and <code>t</code> end up as the same text? For example <code>"ab#c"</code> becomes "ac".</p>
<p>The idea: read both strings <em>from the end</em>. A <code>#</code> tells you to skip the next real character you meet going left. That way you know whether a character survives the moment you reach it, and you never build the typed strings.</p>
<pre><code class="language-js">// Move index i left past any characters that get deleted.
// Returns the index of the next character that survives, or -1 if none is left.
function nextSurvivor(text, i) {
  let skipCount = 0; // how many characters to the left are still to be deleted
  while (i &gt;= 0) {
    if (text[i] === "#") {
      skipCount++; // one more character to delete
      i--;
    } else if (skipCount &gt; 0) {
      skipCount--; // this character is deleted by a later #
      i--;
    } else {
      return i; // a character that survives
    }
  }
  return -1;
}

function backspaceCompare(s, t) {
  let i = s.length - 1;
  let j = t.length - 1;
  while (i &gt;= 0 || j &gt;= 0) {
    i = nextSurvivor(s, i);
    j = nextSurvivor(t, j);
    if (i &lt; 0 &amp;&amp; j &lt; 0) {
      return true; // both ran out together: everything matched
    }
    if (i &lt; 0 || j &lt; 0) {
      return false; // one string has a character left, the other does not
    }
    if (s[i] !== t[j]) {
      return false; // surviving characters differ
    }
    i--; // both matched: move on to the next character to the left
    j--;
  }
  return true;
}
console.log(backspaceCompare("ab#c", "ad#c")); // true   (both type "ac")
console.log(backspaceCompare("a#c", "b")); // false  ("c" vs "b")
console.log(backspaceCompare("a##c", "#a#c")); // true   (both type "c")</code></pre>
<p>Short trace for "ab#c" vs "ad#c": both end in "c": match. Next, in each string the <code>#</code> deletes "b" / "d", and the survivors are "a" and "a": match. Both run out together: <strong>true</strong>.</p>
<p>Time O(n + m), where n and m are the two lengths: each index only moves left. Space O(1). (Building both typed strings with a <a href="#/topic/dsa-words#w-stack">stack</a> is easier to write but uses O(n + m) space.)</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<p>Fifteen classic interview problems. Each one has the problem in plain words, the idea, a short trace, code you can paste into a console, and its cost in words.</p>

<h3 id="ex-1">Example 1 — palindrome check</h3>
<p><strong>The problem:</strong> A <a href="#/topic/dsa-words#w-palindrome">palindrome</a> reads the same forwards and backwards, like "racecar" or "madam". Is a given word one?</p>
<p><strong>The idea:</strong> Compare the first and last letters, then the second and second-to-last, walking inwards. One mismatch means no.</p>
<div class="diagram"><pre>text = "racecar"
index:  0123456

same?  left  right  letters
yes    0     6      r  r
yes    1     5      a  a
yes    2     4      c  c
left = 3 = right: the middle letter has no partner. Stop.
Answer: true</pre></div>
<pre><code class="language-js">function isPalindrome(text) {
  let left = 0;
  let right = text.length - 1;
  while (left &lt; right) { // the middle letter (odd length) needs no check
    if (text[left] !== text[right]) {
      return false; // one mismatch is enough
    }
    left++;
    right--;
  }
  return true;
}
console.log(isPalindrome("racecar")); // true
console.log(isPalindrome("abca")); // false
console.log(isPalindrome("")); // true  (nothing to mismatch)</code></pre>
<p><strong>Cost:</strong> time O(n), about n / 2 comparisons. Space O(1).</p>

<h3 id="ex-2">Example 2 — valid palindrome (alphanumeric)</h3>
<p><strong>The problem:</strong> The same check, but on a real sentence. Ignore spaces and punctuation, and ignore upper/lower case. "A man, a plan, a canal: Panama" counts as a palindrome. ("Alphanumeric" means letters and digits only.)</p>
<p><strong>The idea:</strong> Same two fingers. Before comparing, each finger skips over anything that is not a letter or digit. Compare in lowercase.</p>
<div class="diagram"><pre>text = "Race car!"
index:  012345678

same?  left  right  compare   note
yes    0     7      R / r     right skipped "!" at 8
yes    1     6      a / a
yes    2     5      c / c
yes    3     3      e / e     right skipped " " at 4, landed on left
Fingers have met.  Answer: true</pre></div>
<pre><code class="language-js">function isLetterOrDigit(char) {
  return /[a-zA-Z0-9]/.test(char); // true for a-z, A-Z and 0-9 only
}
function isPalindromeAlnum(text) {
  let left = 0;
  let right = text.length - 1;
  while (left &lt; right) {
    while (left &lt; right &amp;&amp; !isLetterOrDigit(text[left])) {
      left++; // skip spaces and punctuation on the left
    }
    while (left &lt; right &amp;&amp; !isLetterOrDigit(text[right])) {
      right--; // and on the right
    }
    if (text[left].toLowerCase() !== text[right].toLowerCase()) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}
console.log(isPalindromeAlnum("A man, a plan, a canal: Panama")); // true
console.log(isPalindromeAlnum("Race car!")); // true
console.log(isPalindromeAlnum("race a car")); // false</code></pre>
<p><strong>Cost:</strong> time O(n): the skipping loops only move the fingers forward, so every character is passed at most once. Space O(1). (Building a cleaned-up copy of the string first is also fine, but costs O(n) space.)</p>

<h3 id="ex-3">Example 3 — valid palindrome with one removal</h3>
<p><strong>The problem:</strong> Can the word become a palindrome if you delete <strong>at most one</strong> letter? "abca" can (delete "b" or "c"). "abc" cannot.</p>
<p><strong>The idea:</strong> Walk inwards as usual. At the first mismatch you have one delete to spend, and only two choices: delete the left letter or the right letter. Check whether the rest is a palindrome either way.</p>
<div class="diagram"><pre>text = "abca"
index:  0123

result         left  right  letters
match          0     3      a  a
MISMATCH       1     2      b  c    → try both deletes:
  delete b:    check 2..2 = "c"     a palindrome → true
  delete c:    check 1..1 = "b"     (not needed)
Answer: true</pre></div>
<pre><code class="language-js">// Is text[from..to] a palindrome? (both ends included)
function isPalindromeRange(text, from, to) {
  let left = from;
  let right = to;
  while (left &lt; right) {
    if (text[left] !== text[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}
function validPalindrome(text) {
  let left = 0;
  let right = text.length - 1;
  while (left &lt; right) {
    if (text[left] !== text[right]) {
      const skipLeft = isPalindromeRange(text, left + 1, right); // delete the left letter
      const skipRight = isPalindromeRange(text, left, right - 1); // delete the right letter
      return skipLeft || skipRight; // our one delete is used up either way
    }
    left++;
    right--;
  }
  return true; // already a palindrome: no delete needed
}
console.log(validPalindrome("abca")); // true
console.log(validPalindrome("abc")); // false
console.log(validPalindrome("aba")); // true</code></pre>
<p><strong>Cost:</strong> time O(n). The outer walk stops at the first mismatch, and then at most two more walks over the rest. That is at most about 3 passes, still "twice the letters, twice the work". Space O(1).</p>

<h3 id="ex-4">Example 4 — three sum</h3>
<p><strong>The problem:</strong> A team of three friends must split a bill so the money in and out balances to exactly 0. Given everyone's balance, like <code>[-1, 0, 1, 2, -1, -4]</code>, list every group of three numbers that adds up to 0. Each group only once.</p>
<p><strong>The idea:</strong> Sort. Fix the first number with an outer loop. On the rest, run two fingers from both ends looking for a pair that adds to minus the fixed number. Skip repeated values so no group is listed twice.</p>
<div class="diagram"><pre>sorted = [-4, -1, -1, 0, 1, 2]
index:     0   1   2  3  4  5

found        i (fixed)  left  right  sum            move
-            0  (-4)    1     5      -4-1+2 = -3    left++
-            0  (-4)    2     5      -4-1+2 = -3    left++
-            0  (-4)    3     5      -4+0+2 = -2    left++
-            0  (-4)    4     5      -4+1+2 = -1    left++ → met
[-1,-1,2]    1  (-1)    2     5      -1-1+2 = 0     skip copies; both move
[-1,0,1]     1  (-1)    3     4      -1+0+1 = 0     both move → met
             2  (-1)    same value as index 1: skip the whole round
-            3  (0)     4     5      0+1+2 = 3      right-- → met
Answer: [[-1, -1, 2], [-1, 0, 1]]</pre></div>
<pre><code class="language-js">function threeSum(nums) {
  nums.sort((a, b) =&gt; a - b); // sort as numbers, smallest first
  const result = [];
  for (let i = 0; i &lt; nums.length - 2; i++) {
    if (nums[i] &gt; 0) {
      break; // all three would be positive: can't reach 0
    }
    if (i &gt; 0 &amp;&amp; nums[i] === nums[i - 1]) {
      continue; // already tried this first number
    }
    let left = i + 1;
    let right = nums.length - 1;
    while (left &lt; right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left &lt; right &amp;&amp; nums[left] === nums[left + 1]) {
          left++; // skip copies of the left value
        }
        while (left &lt; right &amp;&amp; nums[right] === nums[right - 1]) {
          right--; // skip copies of the right value
        }
        left++;
        right--;
      } else if (sum &lt; 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return result;
}
console.log(threeSum([-1, 0, 1, 2, -1, -4])); // [[-1, -1, 2], [-1, 0, 1]]
console.log(threeSum([0, 0, 0, 0])); // [[0, 0, 0]]</code></pre>
<p><strong>Cost:</strong> time O(n²): about n fixed numbers, and an O(n) two-finger pass for each. The O(n log n) sort is smaller. Space O(1) besides the output (plus whatever the built-in sort uses internally).</p>

<h3 id="ex-5">Example 5 — three sum closest</h3>
<p><strong>The problem:</strong> Pick three numbers whose sum is as <strong>close</strong> as possible to a target, and return that sum. For <code>[-1, 2, 1, -4]</code> and target 1, the closest is 2 (−1 + 2 + 1).</p>
<p><strong>The idea:</strong> The same loop as three sum, but instead of "equals 0?", keep the closest sum seen so far. Move the fingers towards the target: too small → <code>left++</code>, too big → <code>right--</code>.</p>
<div class="diagram"><pre>sorted = [-4, -1, 1, 2]     target = 1

closest so far  i (fixed)  left  right  sum           distance to 1
-4              start: first three = -4 + -1 + 1 = -4             5
-3              0  (-4)    1     3      -4-1+2 = -3   4
-1              0  (-4)    2     3      -4+1+2 = -1   2
2               1  (-1)    2     3      -1+1+2 = 2    1
Answer: 2</pre></div>
<pre><code class="language-js">function threeSumClosest(nums, target) {
  nums.sort((a, b) =&gt; a - b);
  let closest = nums[0] + nums[1] + nums[2]; // any real sum is a fair starting guess
  for (let i = 0; i &lt; nums.length - 2; i++) {
    let left = i + 1;
    let right = nums.length - 1;
    while (left &lt; right) {
      const sum = nums[i] + nums[left] + nums[right];
      const distance = Math.abs(sum - target); // how far this sum is from the target
      const bestDistance = Math.abs(closest - target);
      if (distance &lt; bestDistance) {
        closest = sum;
      }
      if (sum === target) {
        return sum; // can't get closer than exact
      }
      if (sum &lt; target) {
        left++; // move the sum up towards the target
      } else {
        right--; // move the sum down towards the target
      }
    }
  }
  return closest;
}
console.log(threeSumClosest([-1, 2, 1, -4], 1)); // 2
console.log(threeSumClosest([0, 0, 0], 1)); // 0</code></pre>
<p><strong>Cost:</strong> time O(n²), space O(1) (besides the sort). Assumes at least 3 numbers, as the problem promises.</p>

<h3 id="ex-6">Example 6 — partition list around pivot</h3>
<p><strong>The problem:</strong> Rearrange an array so that everything smaller than a chosen value (the <strong>pivot</strong>) comes first, and everything else after. The order inside each group does not matter. Return where the second group starts. (This is the heart of quicksort.)</p>
<p><strong>The idea:</strong> Fingers from both ends. The left finger skips items that are already fine (small); the right finger skips items that are already fine (big). When both are stuck on a wrong item, swap the two.</p>
<div class="diagram"><pre>nums = [9, 2, 7, 1, 8, 3]     pivot = 5

array AFTER this step  left  right  what happens
[3, 2, 7, 1, 8, 9]     1     4      9 and 3 both wrong side: swap
[3, 2, 7, 1, 8, 9]     2     4      2 &lt; 5 is fine: left moves
[3, 2, 7, 1, 8, 9]     2     3      7 stuck; 8 is fine: right moves
[3, 2, 1, 7, 8, 9]     3     2      7 and 1 wrong side: swap
left passed right: stop.   Answer: 3 (the big group starts at index 3)</pre></div>
<pre><code class="language-js">function partition(nums, pivot) {
  let left = 0;
  let right = nums.length - 1;
  while (left &lt;= right) { // &lt;= so the last unchecked item is checked too
    if (nums[left] &lt; pivot) {
      left++; // already on the correct (small) side
    } else if (nums[right] &gt;= pivot) {
      right--; // already on the correct (big) side
    } else {
      // left holds a big item, right holds a small one: swap them
      const temp = nums[left];
      nums[left] = nums[right];
      nums[right] = temp;
      left++;
      right--;
    }
  }
  return left; // every index before left holds a value &lt; pivot
}
const values = [9, 2, 7, 1, 8, 3];
console.log(partition(values, 5)); // 3
console.log(values); // [3, 2, 1, 7, 8, 9]</code></pre>
<p><strong>Cost:</strong> time O(n): every step moves at least one finger inwards. Space O(1).</p>

<h3 id="ex-7">Example 7 — remove element in place</h3>
<p><strong>The problem:</strong> Remove every copy of a value from an array, in place, and return how many items are left. Like deleting every "spam" email from your inbox without making a new inbox.</p>
<p><strong>The idea:</strong> The slow + fast template. <code>fast</code> reads every item; each item that is not the value is copied to <code>slow</code>.</p>
<div class="diagram"><pre>nums = [3, 2, 2, 3]     remove: 3

array AFTER this step  fast  reads  slow after  what happens
[3, 2, 2, 3]           0     3      0           it's a 3: skip
[2, 2, 2, 3]           1     2      1           keep: write at 0
[2, 2, 2, 3]           2     2      2           keep: write at 1
[2, 2, 2, 3]           3     3      2           it's a 3: skip
Answer: 2   (the first 2 items, [2, 2], are what is left)</pre></div>
<pre><code class="language-js">function removeElement(nums, valueToRemove) {
  let slow = 0; // where the next kept item is written
  for (let fast = 0; fast &lt; nums.length; fast++) {
    if (nums[fast] !== valueToRemove) {
      nums[slow] = nums[fast]; // keep this item
      slow++; // move the writer on (written as its own line on purpose)
    }
  }
  return slow; // the number of items kept = the new length
}
const inbox = [3, 2, 2, 3];
const newLength = removeElement(inbox, 3);
console.log(newLength); // 2
console.log(inbox.slice(0, newLength)); // [2, 2]</code></pre>
<p><strong>Cost:</strong> time O(n), space O(1).</p>

<h3 id="ex-8">Example 8 — squares of sorted array</h3>
<p><strong>The problem:</strong> A sorted array can contain negatives, like daily temperature changes <code>[-4, -1, 0, 3, 10]</code>. Return the squares, also sorted: <code>[0, 1, 9, 16, 100]</code>.</p>
<p><strong>The idea:</strong> After squaring, the biggest value comes from one of the two ends (a big negative or a big positive). So the two ends compete for the last slot of the answer. Fill the answer from the back.</p>
<div class="diagram"><pre>nums = [-4, -1, 0, 3, 10]

answer so far           write  left  right  compare     winner
[_, _, _, _, 100]       4      0     4      4 vs 10     right: 100
[_, _, _, 16, 100]      3      0     3      4 vs 3      left: 16
[_, _, 9, 16, 100]      2      1     3      1 vs 3      right: 9
[_, 1, 9, 16, 100]      1      1     2      1 vs 0      left: 1
[0, 1, 9, 16, 100]      0      2     2      0 vs 0      right: 0
(compare = sizes without the sign; "left" and "right" are before the move)</pre></div>
<pre><code class="language-js">function sortedSquares(nums) {
  const result = new Array(nums.length);
  let left = 0;
  let right = nums.length - 1;
  for (let write = nums.length - 1; write &gt;= 0; write--) { // fill from the back
    const leftSize = Math.abs(nums[left]); // size without the sign
    const rightSize = Math.abs(nums[right]);
    if (leftSize &gt; rightSize) {
      result[write] = leftSize * leftSize;
      left++;
    } else {
      result[write] = rightSize * rightSize;
      right--;
    }
  }
  return result;
}
console.log(sortedSquares([-4, -1, 0, 3, 10])); // [0, 1, 9, 16, 100]
console.log(sortedSquares([-3, -2, -1])); // [1, 4, 9]</code></pre>
<p><strong>Cost:</strong> time O(n), one pass, instead of O(n log n) for "square, then sort". Space O(n) for the answer array.</p>

<h3 id="ex-9">Example 9 — Floyd's cycle (detect)</h3>
<p><strong>The problem:</strong> Does a <a href="#/topic/dsa-words#w-linked-list">linked list</a> loop back on itself? Think of a chain of "next page" links on a website: does following them ever bring you round in a circle?</p>
<p><strong>The idea:</strong> <a href="#/topic/dsa-words#w-fast-slow-pointers">Floyd's tortoise and hare</a>. The tortoise takes 1 step, the hare 2. With a loop, the hare laps the tortoise and they land on the same node. Without one, the hare reaches the end.</p>
<div class="diagram"><pre>list: 1 → 2 → 3 → 4 → (back to 2)

met?  step   slow at  fast at
-     start  1        1
no    1      2        3
no    2      3        2       fast went 3 → 4 → 2
YES   3      4        4
Answer: true</pre></div>
<pre><code class="language-js">// Helper: build a list from values; if loopTo &gt;= 0, the last node links back to that index
function buildList(values, loopTo) {
  const nodes = [];
  for (const value of values) {
    nodes.push({ value: value, next: null });
  }
  for (let i = 0; i + 1 &lt; nodes.length; i++) {
    nodes[i].next = nodes[i + 1];
  }
  if (nodes.length &gt; 0 &amp;&amp; loopTo &gt;= 0) {
    nodes[nodes.length - 1].next = nodes[loopTo];
  }
  if (nodes.length === 0) {
    return null; // an empty list has no head
  }
  return nodes[0];
}
function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) { // safe to take 2 steps
    slow = slow.next; // 1 step
    fast = fast.next.next; // 2 steps
    if (slow === fast) {
      return true; // same node: the hare lapped the tortoise
    }
  }
  return false; // the hare fell off the end
}
console.log(hasCycle(buildList([1, 2, 3, 4], 1))); // true  (4 links back to 2)
console.log(hasCycle(buildList([1, 2, 3], -1))); // false
console.log(hasCycle(buildList([], -1))); // false (empty list)</code></pre>
<p><strong>Cost:</strong> time O(n), space O(1). A <a href="#/topic/dsa-words#w-hash-set">Set</a> of visited nodes also works, but needs O(n) memory.</p>

<h3 id="ex-10">Example 10 — find middle node</h3>
<p><strong>The problem:</strong> Return the middle node of a linked list, in one walk. For 1 → 2 → 3 → 4 → 5 it is 3. For 1 → 2 → 3 → 4 → 5 → 6 there are two middles (3 and 4); LeetCode wants the second, 4.</p>
<p><strong>The idea:</strong> The hare moves twice as fast. When it reaches the end, the tortoise is halfway.</p>
<div class="diagram"><pre>list: 1 → 2 → 3 → 4 → 5 → 6

slow at  step   fast at
1        start  1
2        1      3
3        2      5
4        3      null   (5 → 6 → null)
fast is null: stop.   Answer: 4 (the second middle)</pre></div>
<pre><code class="language-js">function buildList(values) {
  const dummy = { value: 0, next: null }; // fake first node: every real node is added the same way
  let tail = dummy;
  for (const value of values) {
    tail.next = { value: value, next: null };
    tail = tail.next;
  }
  return dummy.next;
}
function middleNode(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) {
    slow = slow.next; // 1 step
    fast = fast.next.next; // 2 steps
  }
  return slow; // fast is at (or just past) the end, so slow is halfway
}
console.log(middleNode(buildList([1, 2, 3, 4, 5])).value); // 3
console.log(middleNode(buildList([1, 2, 3, 4, 5, 6])).value); // 4</code></pre>
<p><strong>Cost:</strong> time O(n), space O(1). For the <em>first</em> middle instead, loop while <code>fast.next !== null &amp;&amp; fast.next.next !== null</code> (see Pitfall 9).</p>

<h3 id="ex-11">Example 11 — remove nth from end</h3>
<p><strong>The problem:</strong> Remove the nth node counted from the <em>end</em> of a linked list, in one walk. For 1 → 2 → 3 → 4 → 5 and n = 2, remove 4.</p>
<p><strong>The idea:</strong> Send <code>fast</code> n steps ahead. Then move both together. When <code>fast</code> is on the last node, <code>slow</code> is exactly on the node <em>before</em> the one to remove. A <a href="#/topic/dsa-words#w-dummy-node">dummy node</a> (a fake node placed before the head) means "remove the head" works the same way as any other removal.</p>
<div class="diagram"><pre>dummy → 1 → 2 → 3 → 4 → 5        n = 2

slow at  fast at  what happens
dummy    dummy    start
dummy    2        fast runs n = 2 steps ahead
1        3        both move 1
2        4        both move 1
3        5        both move 1; fast.next is null: stop
slow is 3: unlink 3.next (node 4) → 1 → 2 → 3 → 5</pre></div>
<pre><code class="language-js">function buildList(values) {
  const dummy = { value: 0, next: null };
  let tail = dummy;
  for (const value of values) {
    tail.next = { value: value, next: null };
    tail = tail.next;
  }
  return dummy.next;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.value);
  }
  return values;
}
function removeNthFromEnd(head, n) {
  const dummy = { value: 0, next: head }; // a fake node before the real head
  let slow = dummy;
  let fast = dummy;
  for (let i = 0; i &lt; n; i++) {
    fast = fast.next; // fast gets an n-node head start
  }
  while (fast.next !== null) { // stop when fast is on the last node
    slow = slow.next;
    fast = fast.next;
  }
  slow.next = slow.next.next; // skip over the node to remove
  return dummy.next; // the real head (which changed if we removed the old head)
}
console.log(listToArray(removeNthFromEnd(buildList([1, 2, 3, 4, 5]), 2))); // [1, 2, 3, 5]
console.log(listToArray(removeNthFromEnd(buildList([1, 2]), 2))); // [2]  (the head was removed)</code></pre>
<p><strong>Cost:</strong> time O(L) for a list of L nodes, one walk. Space O(1). Assumes n is between 1 and the list length, as the problem promises.</p>

<h3 id="ex-12">Example 12 — Dutch flag (sort 0/1/2)</h3>
<p><strong>The problem:</strong> An array holds only 0s, 1s and 2s (say red, white and blue socks). Sort it in one pass, in place. This is the <a href="#/topic/dsa-words#w-dutch-national-flag">Dutch national flag</a> problem, named after the flag's three colour bands.</p>
<p><strong>The idea:</strong> Three pointers. <code>low</code>: the next spot for a 0. <code>high</code>: the next spot for a 2. <code>mid</code>: the item being checked. A 0 is swapped to <code>low</code>; a 2 is swapped to <code>high</code>; a 1 stays. After a swap with <code>high</code>, <code>mid</code> stays put, because the item that came back has not been checked. A longer trace is in the Mental Model.</p>
<div class="diagram"><pre>nums = [2, 0, 2, 1, 1, 0]

array AFTER this step  low  mid  high  saw  what happens
[0, 0, 2, 1, 1, 2]     0    0    4     2    swap mid and high; high - 1
[0, 0, 2, 1, 1, 2]     1    1    4     0    swap low and mid; both + 1
[0, 0, 2, 1, 1, 2]     2    2    4     0    swap low and mid; both + 1
[0, 0, 1, 1, 2, 2]     2    2    3     2    swap mid and high; high - 1
[0, 0, 1, 1, 2, 2]     2    3    3     1    mid + 1
[0, 0, 1, 1, 2, 2]     2    4    3     1    mid + 1; mid passed high: stop</pre></div>
<pre><code class="language-js">function swap(list, i, j) {
  const temp = list[i];
  list[i] = list[j];
  list[j] = temp;
}
function sortColors(nums) {
  let low = 0; // everything before low is 0
  let mid = 0; // the item being checked
  let high = nums.length - 1; // everything after high is 2
  while (mid &lt;= high) { // mid..high is the unchecked zone; stop when it is empty
    if (nums[mid] === 0) {
      swap(nums, low, mid); // send the 0 down to the 0s zone
      low++;
      mid++; // what came back from low was already checked (a 1, or this same 0), so move on
    } else if (nums[mid] === 1) {
      mid++; // a 1 is already in the right zone
    } else {
      swap(nums, mid, high); // send the 2 up to the 2s zone
      high--; // do NOT move mid: the value from high is unchecked
    }
  }
}
const socks = [2, 0, 2, 1, 1, 0];
sortColors(socks);
console.log(socks); // [0, 0, 1, 1, 2, 2]</code></pre>
<p><strong>Cost:</strong> time O(n), one pass: every step either moves <code>mid</code> up or <code>high</code> down. Space O(1). (Counting the 0s, 1s and 2s and rewriting the array also works, but takes two passes.)</p>

<h3 id="ex-13">Example 13 — sort by parity</h3>
<p><strong>The problem:</strong> Put all even numbers before all odd numbers, in place. Any order inside each group is fine. "Parity" just means even or odd.</p>
<p><strong>The idea:</strong> Like the partition in Example 6. The left finger skips evens (already fine); the right finger skips odds (already fine). When both are stuck, swap.</p>
<div class="diagram"><pre>nums = [3, 1, 2, 4]

array AFTER this step  left  right  what happens
[4, 1, 2, 3]           1     2      3 (odd) and 4 (even) stuck: swap
[4, 2, 1, 3]           2     1      1 (odd) and 2 (even) stuck: swap
left passed right: stop.   Answer: [4, 2, 1, 3]</pre></div>
<pre><code class="language-js">function sortArrayByParity(nums) {
  let left = 0;
  let right = nums.length - 1;
  while (left &lt; right) {
    if (nums[left] % 2 === 0) {
      left++; // even on the left: already fine
    } else if (nums[right] % 2 !== 0) {
      right--; // odd on the right: already fine (!== 0 also catches -3 % 2, which is -1)
    } else {
      const temp = nums[left]; // odd on the left, even on the right: swap
      nums[left] = nums[right];
      nums[right] = temp;
      left++;
      right--;
    }
  }
  return nums;
}
console.log(sortArrayByParity([3, 1, 2, 4])); // [4, 2, 1, 3]
console.log(sortArrayByParity([-1, 2, -3])); // [2, -1, -3]</code></pre>
<p><strong>Cost:</strong> time O(n), space O(1). Note the <code>!== 0</code> test for odd. In JavaScript, <code>-3 % 2</code> is <code>-1</code>, not 1, so a test like <code>% 2 === 1</code> would treat negative odd numbers as "not odd" and put them in the wrong group.</p>

<h3 id="ex-14">Example 14 — happy number (cycle detection on integers)</h3>
<p><strong>The problem:</strong> Take a number. Replace it with the sum of the squares of its digits. Repeat. If you reach 1, the number is "happy". If you go round in a loop that never reaches 1, it is not. Example: 19 → 1² + 9² = 82 → 68 → 100 → 1. Happy.</p>
<p><strong>The idea:</strong> The numbers form a chain, just like a linked list: each number's "next" is its digit-square sum. Every chain ends up in a loop (1 → 1 is a loop too). Floyd's tortoise and hare find the loop with no memory; then check whether the loop is the one at 1.</p>
<div class="diagram"><pre>n = 19.  next(x) = sum of the squares of x's digits
chain: 19 → 82 → 68 → 100 → 1 → 1 → ...

met?  step   slow (1 step)  fast (2 steps)
-     start  19             19
no    1      82             68
no    2      68             1
no    3      100            1
YES   4      1              1
They met at 1.   Answer: true (happy)</pre></div>
<pre><code class="language-js">function sumOfDigitSquares(number) {
  let sum = 0;
  let rest = number;
  while (rest &gt; 0) {
    const lastDigit = rest % 10; // e.g. 19 % 10 = 9
    sum += lastDigit * lastDigit;
    rest = Math.floor(rest / 10); // drop the last digit: 19 becomes 1
  }
  return sum;
}
function isHappy(n) {
  let slow = n;
  let fast = n;
  do {
    slow = sumOfDigitSquares(slow); // tortoise: 1 step
    const fastOnce = sumOfDigitSquares(fast);
    fast = sumOfDigitSquares(fastOnce); // hare: 2 steps
  } while (slow !== fast); // do...while: they start equal, so move first, then compare
  return slow === 1; // the loop they met in is the "stuck at 1" loop
}
console.log(isHappy(19)); // true
console.log(isHappy(2)); // false  (2 → 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4 ...)</code></pre>
<p><strong>Cost:</strong> space O(1), instead of a Set of numbers already seen. Time: each step costs one operation per digit, and after the first few steps the numbers stay small (a 3-digit number gives at most 3 × 81 = 243). So the work is dominated by the first step on the original number: about O(log n), meaning "grows with the number of digits".</p>

<h3 id="ex-15">Example 15 — interleaving / merge</h3>
<p><strong>The problem:</strong> Two queues at a bank are each sorted by ticket number. Merge them into one sorted line. For <code>[1, 4, 7]</code> and <code>[2, 3, 9]</code> the answer is <code>[1, 2, 3, 4, 7, 9]</code>. (This is the "merge" step of merge sort.)</p>
<p><strong>The idea:</strong> One finger on the front of each array. Take the smaller of the two front items, and move that finger. When one array runs out, copy the rest of the other.</p>
<div class="diagram"><pre>a = [1, 4, 7]     b = [2, 3, 9]

result so far       i  j  compare  take
[1]                 0  0  1 vs 2   a: 1
[1, 2]              1  0  4 vs 2   b: 2
[1, 2, 3]           1  1  4 vs 3   b: 3
[1, 2, 3, 4]        1  2  4 vs 9   a: 4
[1, 2, 3, 4, 7]     2  2  7 vs 9   a: 7
[1, 2, 3, 4, 7, 9]  a is used up: copy the rest of b
(i and j are before the move)</pre></div>
<pre><code class="language-js">function merge(a, b) {
  const result = [];
  let i = 0; // finger on a
  let j = 0; // finger on b
  while (i &lt; a.length &amp;&amp; j &lt; b.length) {
    if (a[i] &lt;= b[j]) { // &lt;= keeps a's item first on a tie (a "stable" merge)
      result.push(a[i]);
      i++;
    } else {
      result.push(b[j]);
      j++;
    }
  }
  while (i &lt; a.length) { // b ran out first: copy what is left of a
    result.push(a[i]);
    i++;
  }
  while (j &lt; b.length) { // a ran out first: copy what is left of b
    result.push(b[j]);
    j++;
  }
  return result;
}
console.log(merge([1, 4, 7], [2, 3, 9])); // [1, 2, 3, 4, 7, 9]
console.log(merge([], [5])); // [5]</code></pre>
<p><strong>Cost:</strong> time O(n + m) for arrays of length n and m: every item is pushed once. Space O(n + m) for the result.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>
<p>An <a href="#/topic/dsa-words#w-edge-case">edge case</a> is an unusual input at the limits: empty, size 1, all the same, and so on. Each item below says what goes wrong, gives a tiny example, and gives the fix.</p>

<h3>1. Off-by-one (left &lt; right vs left &lt;= right)</h3>
<p><strong>What goes wrong:</strong> <code>left &lt; right</code> stops when the fingers meet, so the item they meet on is never looked at. <code>left &lt;= right</code> looks at it too. Picking the wrong one is a classic <a href="#/topic/dsa-words#w-off-by-one">off-by-one</a> mistake.</p>
<p><strong>Tiny example:</strong> A palindrome check wants <code>&lt;</code>: the middle letter has no partner. Partition (<a href="#/topic/dsa-two-pointers#ex-6">Example 6</a>) needs <code>&lt;=</code>: with <code>&lt;</code>, <code>partition([1], 5)</code> never looks at the 1 and returns 0, but the right answer is 1 (one item is smaller than 5).</p>
<p><strong>Fix:</strong> Ask: "does the item where the fingers meet still need a decision?" Pairs and palindromes: no, use <code>&lt;</code>. Partition, Dutch flag, "check every item": yes, use <code>&lt;=</code>.</p>

<h3>2. Empty input</h3>
<p><strong>What goes wrong:</strong> With an empty array, <code>right</code> starts at <code>-1</code>. The loop never runs, which is fine, as long as the value you return then is the right "nothing" answer.</p>
<p><strong>Tiny example:</strong> <code>removeDuplicates([])</code> must return 0. Without its <code>if (nums.length === 0)</code> line it would return <code>slow + 1</code> = 1. <code>sortedSquares([])</code> correctly returns <code>[]</code>.</p>
<p><strong>Fix:</strong> Trace your code once with an empty input. Add an early <code>return</code> if the default answer is wrong.</p>

<h3>3. Single element</h3>
<p><strong>What goes wrong:</strong> Usually nothing: <code>left = 0</code> and <code>right = 0</code>, so <code>left &lt; right</code> is false and the loop does not run. But check that "not running" gives the right answer.</p>
<p><strong>Tiny example:</strong> <code>isPalindrome("a")</code> is <code>true</code>: correct, one letter reads the same both ways. <code>twoSumSorted([5], 10)</code> returns <code>[]</code>: correct, one item can't make a pair.</p>
<p><strong>Fix:</strong> Trace it by hand with one item. If the answer is wrong, add a guard at the top.</p>

<h3>4. Forgetting to skip duplicates</h3>
<p><strong>What goes wrong:</strong> 3-sum lists the same group more than once.</p>
<p><strong>Tiny example:</strong> <code>[-1, -1, 0, 1, 2]</code> without any skipping returns <code>[-1, 0, 1]</code> twice: once for each <code>-1</code> as the fixed number.</p>
<p><strong>Fix:</strong> Skip in two places: in the outer loop (<code>nums[i] === nums[i - 1]</code> → <code>continue</code>), and for both inner fingers right after a match. See <a href="#/topic/dsa-two-pointers#ex-4">Example 4</a>.</p>

<h3>5. Sorting destroys original indices</h3>
<p><strong>What goes wrong:</strong> Both-ends two pointers needs sorted data. But sorting moves items, so the positions you find are positions in the <em>sorted</em> copy, not in the input.</p>
<p><strong>Tiny example:</strong> <code>[3, 2, 4]</code>, target 6. The answer is indexes <code>[1, 2]</code> (2 + 4). After sorting to <code>[2, 3, 4]</code>, two pointers finds indexes 0 and 2, which are wrong for the original.</p>
<p><strong>Fix:</strong> Either use a <a href="#/topic/dsa-words#w-hash-map">Map</a> (Interview Q16), or sort <code>[value, originalIndex]</code> pairs so each value carries its old position with it:</p>
<pre><code class="language-js">function twoSumKeepIndexes(nums, target) {
  const pairs = [];
  for (let i = 0; i &lt; nums.length; i++) {
    pairs.push([nums[i], i]); // [value, where it was originally]
  }
  pairs.sort((a, b) =&gt; a[0] - b[0]); // sort by value; the index travels along
  let left = 0;
  let right = pairs.length - 1;
  while (left &lt; right) {
    const sum = pairs[left][0] + pairs[right][0];
    if (sum === target) {
      return [pairs[left][1], pairs[right][1]]; // the ORIGINAL indexes
    }
    if (sum &lt; target) {
      left++;
    } else {
      right--;
    }
  }
  return [];
}
console.log(twoSumKeepIndexes([3, 2, 4], 6)); // [1, 2]</code></pre>
<p>This costs O(n log n) for the sort and O(n) extra memory for the pairs. The Map way is O(n) on average, so it is usually the better pick.</p>

<h3>6. Negative numbers in container problem</h3>
<p><strong>What goes wrong:</strong> Container and rain-water problems treat each number as a wall height. A negative height has no meaning, and the "water level" maths can give negative water.</p>
<p><strong>Tiny example:</strong> <code>maxArea([-2, -3])</code> would compute <code>min(-2, -3) × 1 = -3</code> and report 0 only because <code>bestArea</code> started at 0.</p>
<p><strong>Fix:</strong> Read the constraints: these problems promise heights ≥ 0. If they don't, ask the interviewer what a negative height means.</p>

<h3>7. Pointers crossing</h3>
<p><strong>What goes wrong:</strong> A loop that moves a finger several times in one round (a skipping loop, or a "move both" step) can carry it past the other finger, or off the end of the array. Then you read the wrong item, or <code>undefined</code>.</p>
<p><strong>Tiny example:</strong> In the alphanumeric palindrome (<a href="#/topic/dsa-two-pointers#ex-2">Example 2</a>), drop the <code>left &lt; right</code> guard from the skipping loops and run it on <code>"!!!"</code>. The left finger runs off the end to index 3, and <code>text[3].toLowerCase()</code> crashes, because <code>text[3]</code> is <code>undefined</code>.</p>
<p><strong>Fix:</strong> Every inner loop that moves a finger repeats the outer condition: <code>while (left &lt; right &amp;&amp; ...)</code>.</p>

<h3>8. Floyd's cycle on null head</h3>
<p><strong>What goes wrong:</strong> An empty list has <code>head = null</code>. Code that reads <code>head.next</code> first crashes with a TypeError.</p>
<p><strong>Tiny example:</strong> <code>hasCycle(null)</code> must return <code>false</code>.</p>
<p><strong>Fix:</strong> Use the loop condition <code>fast !== null &amp;&amp; fast.next !== null</code>. It covers the empty list and the one-node list, with no extra <code>if</code>. See <a href="#/topic/dsa-two-pointers#ex-9">Example 9</a>.</p>

<h3>9. Middle of even-length list</h3>
<p><strong>What goes wrong:</strong> A list of 6 nodes has two middles (the 3rd and the 4th). The standard loop returns the second one. Some problems (like splitting a list in half for merge sort) want the first.</p>
<p><strong>Tiny example:</strong> For 1 → 2 → 3 → 4 → 5 → 6 the usual loop gives 4. LeetCode's "Middle of the Linked List" wants 4; splitting in half wants 3.</p>
<p><strong>Fix:</strong> Ask which one. For the first middle, stop the hare one step earlier:</p>
<pre><code class="language-js">function buildList(values) {
  const dummy = { value: 0, next: null };
  let tail = dummy;
  for (const value of values) {
    tail.next = { value: value, next: null };
    tail = tail.next;
  }
  return dummy.next;
}
function firstMiddle(head) {
  let slow = head;
  let fast = head;
  while (fast.next !== null &amp;&amp; fast.next.next !== null) { // stop one step earlier
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
console.log(firstMiddle(buildList([1, 2, 3, 4, 5, 6])).value); // 3
console.log(firstMiddle(buildList([1, 2, 3, 4, 5])).value); // 3</code></pre>
<p>(This version assumes the list is not empty.)</p>

<h3>10. Slow/fast advancing different rates</h3>
<p><strong>What goes wrong:</strong> People worry that the hare might "jump over" the tortoise inside the loop and never land on the same node.</p>
<p><strong>Tiny example:</strong> After k steps the tortoise has moved k nodes and the hare 2k. Once both are inside the loop, the hare is some distance behind the tortoise (going round). Every step, the hare gains exactly 1 node: it moves 2, the tortoise moves 1. A gap of 3 becomes 2, then 1, then 0. It can't skip from 1 to −1.</p>
<p><strong>Fix:</strong> Nothing to fix; just know the argument. Because the gap is less than one lap, they meet before the tortoise finishes its first lap. That is why the time is O(n). Keep the speeds at exactly 1 and 2.</p>

<h3>11. Skipping duplicates in 3-sum after match</h3>
<p><strong>What goes wrong:</strong> After a match, skipping copies only on one side, or skipping copies but then forgetting to step once more, finds the same group again (or loops forever).</p>
<p><strong>Tiny example:</strong> Fixed number −2 in <code>[-2, 0, 0, 2, 2]</code>. The first match is <code>[-2, 0, 2]</code> at left = 1, right = 4. The skip loops move left to 2 and right to 3 (the last copies). Then <code>left++</code> and <code>right--</code> make left 3, right 2: they have crossed, done. Without that last step, the next round would match <code>[-2, 0, 2]</code> again.</p>
<p><strong>Fix:</strong> After a match: skip left past its copies, skip right past its copies, then move both once more.</p>

<h3>12. Sorted-squares with all-positive or all-negative</h3>
<p><strong>What goes wrong:</strong> Nothing, if you use two pointers. But a "find where the negatives end and merge outwards" version often breaks when there are no negatives, or only negatives.</p>
<p><strong>Tiny example:</strong> All positive <code>[1, 2, 3]</code>: the right end always wins, giving <code>[1, 4, 9]</code> (same order). All negative <code>[-3, -2, -1]</code>: the left end always wins, giving <code>[1, 4, 9]</code> (reversed order). <a href="#/topic/dsa-two-pointers#ex-8">Example 8</a> runs the all-negative case.</p>
<p><strong>Fix:</strong> Use the both-ends version; it needs no special cases.</p>

<h3>13. Dutch flag — don't increment mid on swap with high</h3>
<p><strong>What goes wrong:</strong> After swapping a 2 up to <code>high</code>, the value that came back to <code>mid</code> could be a 0, 1 or 2. It has not been checked. Moving <code>mid</code> past it leaves it in the wrong zone.</p>
<p><strong>Tiny example:</strong> <code>[1, 2, 0]</code>. The buggy version swaps the 2 with the 0, moves <code>mid</code> past the 0, stops, and returns <code>[1, 0, 2]</code>:</p>
<pre><code class="language-js">function swap(list, i, j) {
  const temp = list[i];
  list[i] = list[j];
  list[j] = temp;
}
function sortColorsBuggy(nums) {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;
  while (mid &lt;= high) {
    if (nums[mid] === 0) {
      swap(nums, low, mid);
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      swap(nums, mid, high);
      high--;
      mid++; // BUG: the value that just came back from high is never checked
    }
  }
  return nums;
}
function sortColorsFixed(nums) {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;
  while (mid &lt;= high) {
    if (nums[mid] === 0) {
      swap(nums, low, mid);
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      swap(nums, mid, high);
      high--; // mid stays: check the swapped-in value next round
    }
  }
  return nums;
}
console.log(sortColorsBuggy([1, 2, 0])); // [1, 0, 2]  (wrong)
console.log(sortColorsFixed([1, 2, 0])); // [0, 1, 2]</code></pre>
<p><strong>Fix:</strong> On the "2" branch, only <code>high--</code>. (On the "0" branch, moving <code>mid</code> is safe: what comes back from <code>low</code> was already checked.)</p>

<h3>14. Two pointers on string with multibyte chars</h3>
<p><strong>What goes wrong:</strong> <code>text[i]</code> and <code>text.length</code> count UTF-16 "code units", not characters. Most emoji take 2 code units, so a finger can land in the middle of one.</p>
<p><strong>Tiny example:</strong> <code>"😀a😀"</code> is a palindrome to a human, but the index-based check says no:</p>
<pre><code class="language-js">function isPalindromeByIndex(text) {
  let left = 0;
  let right = text.length - 1;
  while (left &lt; right) {
    if (text[left] !== text[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}
const smiley = "😀a😀";
console.log(smiley.length); // 5  (each emoji is 2 code units)
console.log(isPalindromeByIndex(smiley)); // false  (it compares the two halves of an emoji)
const characters = Array.from(smiley); // splits by real characters (code points)
console.log(characters.length); // 3
console.log(isPalindromeByIndex(characters)); // true  (the same code works on an array)</code></pre>
<p><strong>Fix:</strong> If the input can contain emoji or other non-English scripts, run the two pointers over <code>Array.from(text)</code>. (Even that splits some combined emoji, like family emoji or flags, into several pieces; for those you need <code>Intl.Segmenter</code>. Interviews rarely go that far.)</p>

<h3>15. Linked list "remove nth from end" with n equal to length</h3>
<p><strong>What goes wrong:</strong> When n equals the list length, the node to remove is the head itself. There is no node before it, so "set the previous node's next" has nothing to work on.</p>
<p><strong>Tiny example:</strong> 1 → 2 with n = 2 must return just 2.</p>
<p><strong>Fix:</strong> Start both pointers on a <a href="#/topic/dsa-words#w-dummy-node">dummy node</a> placed before the head. Then the head has a "node before it" like every other node, and you return <code>dummy.next</code>. <a href="#/topic/dsa-two-pointers#ex-11">Example 11</a> runs this exact case.</p>

<h3>16. Container problem: equal heights</h3>
<p><strong>What goes wrong:</strong> People are unsure which wall to move when both are the same height.</p>
<p><strong>Tiny example:</strong> Walls of height 5 at both ends. Any container that keeps one of these walls has a smaller width, and its shorter wall is at most 5. So neither wall can be part of a bigger answer, and moving either one is safe.</p>
<p><strong>Fix:</strong> Pick one and be consistent. The code in this topic uses <code>if (heights[left] &lt; heights[right]) left++; else right--;</code>, so on a tie it moves <code>right</code>. (Both choices give the correct answer.)</p>

<h3>17. Trapping water with sorted heights</h3>
<p><strong>What goes wrong:</strong> Nothing, but it is a good test. If the heights only go up, or only go down, no water can be held: every bar is the tallest on one of its sides.</p>
<p><strong>Tiny example:</strong> <code>trap([1, 2, 3, 4])</code> is 0. The left side is always lower, and each bar is a new <code>leftMax</code>, so each adds <code>leftMax - height = 0</code>.</p>
<p><strong>Fix:</strong> Use it as a quick check that your code returns 0 and not a negative number.</p>

<h3>18. Negative numbers in 3-sum</h3>
<p><strong>What goes wrong:</strong> The algorithm itself is fine with negatives (sorting puts them first). The real trap is JavaScript's <code>sort()</code>: without a compare function it sorts numbers as <em>text</em>, which puts negatives and multi-digit numbers in the wrong order.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">console.log([-1, -2, 10, 2].sort()); // [-1, -2, 10, 2]  (text order: wrong)
console.log([-1, -2, 10, 2].sort((a, b) =&gt; a - b)); // [-2, -1, 2, 10]</code></pre>
<p><strong>Fix:</strong> Always sort numbers with <code>(a, b) =&gt; a - b</code>. Then <code>[-3, -2, -1, 0, 1, 2]</code> works as usual.</p>

<h3>19. Backspace compare with all backspaces</h3>
<p><strong>What goes wrong:</strong> More <code>#</code> than letters, or a <code>#</code> at the very start. A backspace on an empty text does nothing, and the code must not "save it up" for later letters.</p>
<p><strong>Tiny example:</strong> <code>"a##c"</code> and <code>"#a#c"</code> both type "c". Reading from the end, a <code>#</code> only ever deletes characters to its <em>left</em>, so a leading <code>#</code> never affects anything. The code in <a href="#/topic/dsa-two-pointers#mechanics">Mechanics</a> returns <code>true</code> for this pair.</p>
<p><strong>Fix:</strong> Read from the end with a skip counter, as in Mechanics. Test "all backspaces" (<code>"##"</code> vs <code>""</code>, which is <code>true</code>).</p>

<h3>20. Three sum closest with multiple equal sums</h3>
<p><strong>What goes wrong:</strong> Two different groups can be equally close (one above the target, one below). People worry about which to return.</p>
<p><strong>Tiny example:</strong> Target 0 with groups summing to −1 and 1. Both are 1 away.</p>
<p><strong>Fix:</strong> The problem asks for the <em>sum</em> and usually promises one answer. With strict <code>&lt;</code>, the code keeps whichever it found first. If ties can happen, ask which one they want.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — using two pointers on unsorted</h3>
<p><strong>What goes wrong:</strong> The "too small → move left" rule only makes sense if moving left really makes the sum bigger. On unsorted data it doesn't, so pairs get skipped.</p>
<p><strong>Tiny example:</strong> Unsorted <code>[3, 1, 5]</code>, target 6 (the answer is 1 + 5). 3 + 5 = 8, too big, so <code>right</code> moves onto the 1: 3 + 1 = 4, too small, so <code>left</code> moves onto the 1 too. The fingers meet and 1 + 5 is never checked. The "too big" step threw away the 5, but the 5 was in the answer: it was only "too big" next to the 3.</p>
<p><strong>Fix:</strong> Sort first, or use a different pattern: a Map for two-sum on unsorted input.</p>

<h3>Anti-pattern 2 — forgetting to skip duplicates</h3>
<p><strong>What goes wrong:</strong> 3-sum, 4-sum and similar problems want <em>unique</em> groups. Without skipping, the same group appears several times.</p>
<p><strong>Tiny example:</strong> <code>[0, 0, 0, 0]</code> without any skipping returns <code>[0, 0, 0]</code> twice: once with the first 0 fixed, once with the second.</p>
<p><strong>Fix:</strong> Skip <code>nums[i] === nums[i - 1]</code> in the outer loop, and skip the inner fingers past copies after a match (Pitfall 11).</p>

<h3>Anti-pattern 3 — wrong comparison direction</h3>
<p><strong>What goes wrong:</strong> Moving the wrong finger pushes the sum the wrong way.</p>
<p><strong>Tiny example:</strong> Sorted <code>[1, 3, 4, 5, 7, 11]</code>, target 10. The first sum, 1 + 11 = 12, is too big. The wrong rule "too big → <code>left++</code>" gives 3 + 11 = 14, then 4 + 11 = 15, and so on: every sum gets bigger, the fingers meet, and 3 + 7 is never checked.</p>
<p><strong>Fix:</strong> Say it out loud: "too small → I need a bigger number → only <code>left++</code> gives one. Too big → I need a smaller number → only <code>right--</code> gives one."</p>

<h3>Anti-pattern 4 — modifying both pointers in same step</h3>
<p><strong>What goes wrong:</strong> Moving both fingers when only one is ruled out throws away an item that could still be in the answer.</p>
<p><strong>Tiny example:</strong> <code>[1, 4, 5, 9]</code>, target 13 (4 + 9). 1 + 9 = 10 is too small, so only the 1 is ruled out. Moving both gives 4 + 5 = 9, and the 9 is gone for good. The pair 4 + 9 is never checked.</p>
<p><strong>Fix:</strong> Move only the finger the comparison rules out. Move both only when both are done with, like after a match or a swap.</p>

<h3>Anti-pattern 5 — not handling crossing</h3>
<p><strong>What goes wrong:</strong> The loop condition is only checked at the top of each round. If a round moves a finger more than once, the fingers can cross in the middle of the round, and the code after that reads items it shouldn't.</p>
<p><strong>Tiny example:</strong> Pitfall 7: skipping loops without a <code>left &lt; right</code> guard run off the end of <code>"!!!"</code>.</p>
<p><strong>Fix:</strong> Repeat the condition on every inner move (<code>while (left &lt; right &amp;&amp; ...)</code>). A plain <code>left++; right--;</code> at the end of a round is fine: the loop condition catches it at the next check.</p>

<h3>Anti-pattern 6 — Floyd's cycle without null check</h3>
<p><strong>What goes wrong:</strong> On a list with <em>no</em> loop, the hare reaches <code>null</code>. Reading <code>null.next</code> throws a TypeError and the program crashes.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">function hasCycleUnsafe(head) {
  let slow = head;
  let fast = head.next; // starts one ahead only so the while body runs at all (see Anti-pattern 7)
  while (slow !== fast) { // BUG: never checks for the end of the list
    slow = slow.next;
    fast = fast.next.next;
  }
  return true;
}
const node1 = { value: 1, next: null };
const node2 = { value: 2, next: null };
node1.next = node2; // 1 → 2, no loop
try {
  hasCycleUnsafe(node1);
} catch (error) {
  console.log(error.name); // TypeError
}</code></pre>
<p>The <code>fast = head.next</code> start is only there so the <code>while (slow !== fast)</code> body runs at all. The bug shown here is the missing null check, not the start (see Anti-pattern 7).</p>
<p><strong>Fix:</strong> Loop while <code>fast !== null &amp;&amp; fast.next !== null</code>, and return <code>false</code> when that fails.</p>

<h3>Anti-pattern 7 — initializing slow/fast at different positions for cycle</h3>
<p><strong>What goes wrong:</strong> Starting with <code>slow = head</code> and <code>fast = head.next</code> is fine for <em>detecting</em> a loop (a common LeetCode version does this). But it breaks <em>finding the loop's start</em>: the Phase 2 maths assumes both started at the head.</p>
<p><strong>Tiny example:</strong> On the Mental Model list (1 → … → 7, with 7 linking back to 3), starting fast at <code>head.next</code> makes them meet at node 5 instead of 6. Phase 2 then starts the finder at 1 and the other at 5. They walk in step, always one node apart inside the loop, and never meet: an endless loop.</p>
<p><strong>Fix:</strong> For anything beyond yes/no detection, start both at the head.</p>

<h3>Anti-pattern 8 — copying array with two pointers when not needed</h3>
<p><strong>What goes wrong:</strong> Building a second array "to make it easier" throws away the main win of the pattern: O(1) extra space.</p>
<p><strong>Tiny example:</strong> Removing zeros by pushing non-zeros into a new array works, but uses O(n) memory when the problem said "in place".</p>
<p><strong>Fix:</strong> If the problem says "in place" or "O(1) extra space", write into the same array with a slow pointer. (When the output must be a new array anyway, like sorted squares, that's fine.)</p>

<h3>Anti-pattern 9 — slow vs fast confusion in dedup</h3>
<p><strong>What goes wrong:</strong> Mixing up which pointer reads and which writes, or when <code>slow</code> moves, gives off-by-one results.</p>
<p><strong>Tiny example:</strong> In <code>removeDuplicates</code>, <code>slow</code> points at the <em>last kept</em> value. Writing <code>nums[slow] = nums[fast]</code> <em>before</em> <code>slow++</code> overwrites a kept value: <code>[1, 1, 2]</code> becomes <code>[2, 1, 2]</code>, so the kept part is <code>[2, 1]</code> and the first 1 is lost.</p>
<p><strong>Fix:</strong> Decide what <code>slow</code> means and write it in a comment. "Last kept" → move, then write, return <code>slow + 1</code>. "Next free spot" → write, then move, return <code>slow</code>.</p>

<h3>Anti-pattern 10 — duplicate skipping order in 3-sum</h3>
<p><strong>What goes wrong:</strong> Putting the inner "skip copies" loops at the <em>start</em> of each round, instead of only after a match, skips groups that use the same value twice.</p>
<p><strong>Tiny example:</strong> <code>[-4, 2, 2]</code>. The answer is <code>[-4, 2, 2]</code>. Skipping copies first moves left from index 1 onto index 2, where right already is. The fingers meet and the group is never checked.</p>
<p><strong>Fix:</strong> Only skip copies inside the <code>if (sum === 0)</code> branch, after recording the match.</p>

<h3>Anti-pattern 11 — string mutation attempts</h3>
<p><strong>What goes wrong:</strong> Strings in JavaScript are <a href="#/topic/dsa-words#w-immutable">immutable</a>: they can't be changed after they are made. Writing to <code>text[i]</code> does nothing. In normal scripts it fails silently; in strict mode (modules and classes) it throws a TypeError.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">let word = "cat";
word[0] = "b"; // ignored in normal scripts; throws in strict mode
console.log(word); // cat
const letters = word.split(""); // an array CAN be changed
letters[0] = "b";
console.log(letters.join("")); // bat</code></pre>
<p><strong>Fix:</strong> Turn the string into an array (<code>split("")</code> or <code>Array.from</code>), run the two pointers on the array, then <code>join("")</code>.</p>

<h3>Anti-pattern 12 — using indexOf in two-pointer setup</h3>
<p><strong>What goes wrong:</strong> <code>indexOf</code> and <code>includes</code> scan the array from the start: O(n) each time. Calling one inside your loop quietly makes the whole thing O(n²) again.</p>
<p><strong>Tiny example:</strong> "For each item, <code>nums.indexOf(target - item)</code>" on 10,000 items is up to 100 million steps.</p>
<p><strong>Fix:</strong> Keep the fingers' own comparisons (they are O(1)). If you really need "have I seen this value?", use a <a href="#/topic/dsa-words#w-hash-set">Set</a> or Map: O(1) per lookup on average.</p>

<h3>Anti-pattern 13 — recursing instead of iterating</h3>
<p><strong>What goes wrong:</strong> Writing the two-pointer walk as <a href="#/topic/dsa-words#w-recursion">recursion</a> (a function that calls itself with <code>left + 1, right - 1</code>) looks neat, but each waiting call sits on the <a href="#/topic/dsa-words#w-call-stack">call stack</a>. That is O(n) memory instead of O(1).</p>
<p><strong>Tiny example:</strong> A recursive palindrome check on a 1,000,000-letter string makes about 500,000 nested calls and crashes with a <a href="#/topic/dsa-words#w-stack-overflow">stack overflow</a> ("Maximum call stack size exceeded").</p>
<p><strong>Fix:</strong> Use a <code>while</code> loop. Two pointers is naturally a loop.</p>

<h3>Anti-pattern 14 — not breaking early when impossible</h3>
<p><strong>What goes wrong:</strong> Not a wrong answer, just wasted work.</p>
<p><strong>Tiny example:</strong> In 3-sum, once the fixed number <code>nums[i]</code> is above 0, everything after it is too (the array is sorted). Three positive numbers can't add to 0, yet the loop keeps going.</p>
<p><strong>Fix:</strong> <code>if (nums[i] &gt; 0) break;</code>. It doesn't change the Big-O, but interviewers like seeing it.</p>

<h3>Anti-pattern 15 — mutating input when caller didn't expect</h3>
<p><strong>What goes wrong:</strong> <code>sort()</code> and in-place swaps change the caller's array. Code that uses that array later is surprised.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const prices = [30, 10, 20];
const sortedCopy = prices.slice().sort((a, b) =&gt; a - b); // slice() makes a copy first
console.log(sortedCopy); // [10, 20, 30]
console.log(prices); // [30, 10, 20]  (the caller's array is untouched)</code></pre>
<p><strong>Fix:</strong> If the problem says "in place", changing the input is the point. Otherwise, copy first (<code>slice()</code> or <code>[...array]</code>), or say out loud in the interview that you will change the input.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. When to use two pointers?</div>
  <div class="qa-answer">
    <p>When two positions, each moved by a clear rule, can replace "check every pair". Typical signs:</p>
    <ul>
      <li>A <strong>sorted</strong> array and a pair or triplet with some property ("adds up to X").</li>
      <li><strong>Palindrome</strong> or symmetry problems: compare the two ends, walk inwards.</li>
      <li><strong>Container / water</strong> problems, where you can prove one wall is useless and drop it.</li>
      <li><strong>In-place changes:</strong> remove duplicates, move zeros, partition (slow writer + fast reader).</li>
      <li><strong>Linked lists:</strong> loop detection, middle node, nth from the end (fast + slow).</li>
    </ul>
    <p>The common signal: the brute force tries every pair, O(n²). Two pointers gets it to O(n), because every step rules out one item for good.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Two pointers vs sliding window?</div>
  <div class="qa-answer">
    <p><strong>Two pointers:</strong> you compare the two items the pointers are on (for example <code>nums[left]</code> and <code>nums[right]</code>) and decide which one to move. The pointers often walk towards each other, or at two speeds. What lies <em>between</em> them usually doesn't matter.</p>
    <p><strong>Sliding window:</strong> the two pointers are the edges of a stretch, and what matters is everything <em>inside</em> it (its sum, how many different letters it has). You stretch the right edge and shrink the left edge to keep a rule true.</p>
    <p>They overlap: a sliding window is a kind of same-direction two pointers. A rule of thumb: if the question asks for a best <a href="#/topic/dsa-words#w-subarray">subarray</a> or <a href="#/topic/dsa-words#w-substring">substring</a> (a side-by-side stretch) with some property, it is a sliding window. If it asks about pairs, ends, or rearranging in place, it is two pointers.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Implement reverse string in place.</div>
  <div class="qa-answer">
    <p>Swap the two ends and walk inwards until the fingers meet. Strings can't be changed in JavaScript, so the input is an array of characters.</p>
<pre><code class="language-js">function reverseString(chars) {
  let left = 0;
  let right = chars.length - 1;
  while (left &lt; right) {
    const temp = chars[left]; // swap the two ends
    chars[left] = chars[right];
    chars[right] = temp;
    left++;
    right--;
  }
}
const letters = ["h", "e", "l", "l", "o"];
reverseString(letters);
console.log(letters.join("")); // olleh</code></pre>
    <p>Time O(n) (n / 2 swaps), space O(1).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Two sum on sorted array.</div>
  <div class="qa-answer">
    <p>One finger at each end. Too small → move <code>left</code> right (bigger number). Too big → move <code>right</code> left (smaller number). Equal → done.</p>
<pre><code class="language-js">function twoSumSorted(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left &lt; right) {
    const sum = nums[left] + nums[right];
    if (sum === target) {
      return [left, right]; // 0-based indexes (LeetCode 167 wants left + 1, right + 1)
    }
    if (sum &lt; target) {
      left++; // need a bigger sum
    } else {
      right--; // need a smaller sum
    }
  }
  return [-1, -1]; // no pair
}
console.log(twoSumSorted([1, 3, 4, 5, 7, 11], 10)); // [1, 4]
console.log(twoSumSorted([1, 2], 10)); // [-1, -1]</code></pre>
    <p>O(n) time, O(1) space. The sorted order is what tells you which finger to move: when the sum is too big, the item at <code>right</code> is too big even with the smallest partner left, so it can be dropped.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Container with most water — why move shorter pointer?</div>
  <div class="qa-answer">
    <p>Area = <code>min(heights[left], heights[right]) × (right - left)</code>. The shorter wall sets the water level.</p>
    <p>If you move the <strong>taller</strong> wall inwards, the width drops by 1, and the new pair's shorter wall is at most the old shorter wall (the old short wall is still there). So the area can only stay the same or shrink. Moving the taller wall can never help.</p>
    <p>If you move the <strong>shorter</strong> wall, the width still drops, but you might find a much taller wall, raising the water level. That is the only move that can possibly beat the current best. And the shorter wall can be dropped safely: with any partner further in, it would hold even less water than right now.</p>
<pre><code class="language-js">function maxArea(heights) {
  let left = 0;
  let right = heights.length - 1;
  let bestArea = 0;
  while (left &lt; right) {
    const shorterWall = Math.min(heights[left], heights[right]);
    const area = shorterWall * (right - left);
    bestArea = Math.max(bestArea, area);
    if (heights[left] &lt; heights[right]) {
      left++; // left is the limit: drop it
    } else {
      right--; // right is the limit (or a tie): drop it
    }
  }
  return bestArea;
}
console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49</code></pre>
    <p>O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Trapping rain water — explain.</div>
  <div class="qa-answer">
    <p>The water above bar i is <code>min(tallest bar on its left, tallest bar on its right) - heights[i]</code>. The two-pointer trick: always work on the side with the <strong>lower</strong> bar. If the left bar is lower than the right bar, then somewhere on the right there is a bar at least that tall, so the left side's tallest-so-far (<code>leftMax</code>) decides this spot's water. Update <code>leftMax</code> if this bar is taller; otherwise add <code>leftMax - height</code>. Mirror for the right.</p>
<pre><code class="language-js">function trap(heights) {
  let left = 0;
  let right = heights.length - 1;
  let leftMax = 0; // tallest bar seen from the left so far
  let rightMax = 0; // tallest bar seen from the right so far
  let water = 0;
  while (left &lt; right) {
    if (heights[left] &lt; heights[right]) {
      leftMax = Math.max(leftMax, heights[left]);
      water += leftMax - heights[left]; // 0 when this bar is the new tallest
      left++;
    } else {
      rightMax = Math.max(rightMax, heights[right]);
      water += rightMax - heights[right];
      right--;
    }
  }
  return water;
}
console.log(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6
console.log(trap([3, 0, 2, 0, 4])); // 7</code></pre>
    <p>O(n) time, O(1) space. (The two-array version, storing tallest-left and tallest-right for every spot, is also O(n) time but O(n) space.)</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Detect cycle in linked list — algorithm + complexity?</div>
  <div class="qa-answer">
    <p><a href="#/topic/dsa-words#w-fast-slow-pointers">Floyd's tortoise and hare</a>. Both start at the head. Slow moves 1 node per step; fast moves 2. If there is a loop, fast enters it, goes round, and catches slow: they land on the same node. If there is no loop, fast reaches <code>null</code>.</p>
<pre><code class="language-js">function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) { // fast can take 2 more steps
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      return true; // they met: there is a loop
    }
  }
  return false; // fast fell off the end: no loop
}
const first = { value: 1, next: null };
const second = { value: 2, next: null };
const third = { value: 3, next: null };
first.next = second;
second.next = third;
console.log(hasCycle(first)); // false
third.next = second; // now 3 links back to 2
console.log(hasCycle(first)); // true</code></pre>
    <p>O(n) time: once slow enters the loop, fast closes the gap by 1 node per step, so they meet before slow finishes one lap. O(1) space. That beats the <a href="#/topic/dsa-words#w-hash-set">Set</a> approach ("have I visited this node?"), which is also O(n) time but needs O(n) memory.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Find cycle's start in linked list.</div>
  <div class="qa-answer">
    <p>Run Floyd's until slow and fast meet. Then send one pointer back to the head and leave the other at the meeting point. Move both <strong>1 step at a time</strong>. Where they meet is the start of the loop.</p>
<pre><code class="language-js">function detectCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) { // phase 1: they met inside the loop
      let finder = head; // phase 2: restart one pointer from the head
      while (finder !== slow) {
        finder = finder.next; // both at speed 1 now
        slow = slow.next;
      }
      return finder; // the start of the loop
    }
  }
  return null; // no loop
}
// Build 1 → 2 → 3 → 4 → 5 → 6 → 7, with 7 linking back to 3
const nodes = [];
for (let value = 1; value &lt;= 7; value++) {
  nodes.push({ value: value, next: null });
}
for (let i = 0; i + 1 &lt; nodes.length; i++) {
  nodes[i].next = nodes[i + 1];
}
nodes[6].next = nodes[2];
console.log(detectCycle(nodes[0]).value); // 3</code></pre>
    <p><strong>Why it works, in plain numbers.</strong> Let <code>d</code> be the number of steps from the head to the loop's start, <code>L</code> the loop's length, and <code>k</code> how far into the loop they met.</p>
    <ul>
      <li>When they meet, slow has walked <code>d + k</code> steps. Fast has walked twice that: <code>2(d + k)</code>.</li>
      <li>They are on the same node, so fast's extra <code>d + k</code> steps must be whole laps of the loop. So <code>d + k</code> is a whole number of laps.</li>
      <li>Now walk <code>d</code> more steps from the meeting point. You will have gone <code>k + d</code> steps into the loop: whole laps, which lands you exactly on the loop's start.</li>
      <li>The finder, walking <code>d</code> steps from the head, also lands exactly on the loop's start. So they meet there.</li>
    </ul>
    <p>Check with the Mental Model trace: d = 2 (1 → 2 → 3), L = 5, they met at node 6, which is k = 3 into the loop. d + k = 5 = one lap. ✓ Time O(n), space O(1).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Remove duplicates from sorted array.</div>
  <div class="qa-answer">
<pre><code class="language-js">function removeDuplicates(nums) {
  if (nums.length === 0) {
    return 0;
  }
  let slow = 0; // index of the last kept (unique) value
  for (let fast = 1; fast &lt; nums.length; fast++) {
    if (nums[fast] !== nums[slow]) { // a value we have not kept yet
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1; // count of kept values
}
const nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
const kept = removeDuplicates(nums);
console.log(kept); // 5
console.log(nums.slice(0, kept)); // [0, 1, 2, 3, 4]</code></pre>
    <p><code>slow</code> marks the last unique value kept; <code>fast</code> reads ahead. Because the array is sorted, all copies of a value sit together, so comparing with <code>nums[slow]</code> is enough. O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Move zeros to end maintaining order.</div>
  <div class="qa-answer">
<pre><code class="language-js">function moveZeroes(nums) {
  let slow = 0; // the spot where the next non-zero belongs
  for (let fast = 0; fast &lt; nums.length; fast++) {
    if (nums[fast] !== 0) {
      const temp = nums[slow]; // swap the non-zero forward
      nums[slow] = nums[fast];
      nums[fast] = temp;
      slow++;
    }
  }
}
const data = [0, 1, 0, 3, 12];
moveZeroes(data);
console.log(data); // [1, 3, 12, 0, 0]</code></pre>
    <p>Each non-zero is swapped forward to <code>slow</code>, in the order <code>fast</code> meets them, so their order is kept. The zeros end up behind. O(n) time, O(1) space. Traced in the Mental Model.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Sort 0/1/2 in one pass (Dutch flag).</div>
  <div class="qa-answer">
<pre><code class="language-js">function sortColors(nums) {
  let low = 0; // next spot for a 0
  let mid = 0; // the item being checked
  let high = nums.length - 1; // next spot for a 2
  while (mid &lt;= high) {
    if (nums[mid] === 0) {
      const temp = nums[low]; // swap the 0 down to low
      nums[low] = nums[mid];
      nums[mid] = temp;
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      const temp = nums[high]; // swap the 2 up to high
      nums[high] = nums[mid];
      nums[mid] = temp;
      high--; // mid stays: the swapped-in value is unchecked
    }
  }
}
const colors = [2, 0, 2, 1, 1, 0];
sortColors(colors);
console.log(colors); // [0, 0, 1, 1, 2, 2]</code></pre>
    <p>Three pointers, one pass, O(n) time, O(1) space. The trap: don't move <code>mid</code> after swapping with <code>high</code>; the value that came back must be checked.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Find middle of linked list.</div>
  <div class="qa-answer">
<pre><code class="language-js">function buildList(values) {
  const dummy = { value: 0, next: null };
  let tail = dummy;
  for (const value of values) {
    tail.next = { value: value, next: null };
    tail = tail.next;
  }
  return dummy.next;
}
function middleNode(head) {
  let slow = head;
  let fast = head;
  while (fast !== null &amp;&amp; fast.next !== null) {
    slow = slow.next; // 1 step
    fast = fast.next.next; // 2 steps
  }
  return slow;
}
console.log(middleNode(buildList([1, 2, 3, 4, 5])).value); // 3
console.log(middleNode(buildList([1, 2, 3, 4, 5, 6])).value); // 4</code></pre>
    <p>Fast covers twice the distance, so when it reaches the end, slow is halfway. For 1→2→3→4→5, slow ends at 3. For 1→2→3→4→5→6, slow ends at 4 (the second middle). O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Remove nth node from end (single pass).</div>
  <div class="qa-answer">
<pre><code class="language-js">function buildList(values) {
  const dummy = { value: 0, next: null };
  let tail = dummy;
  for (const value of values) {
    tail.next = { value: value, next: null };
    tail = tail.next;
  }
  return dummy.next;
}
function listToArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) {
    values.push(node.value);
  }
  return values;
}
function removeNthFromEnd(head, n) {
  const dummy = { value: 0, next: head }; // a node before the head
  let slow = dummy;
  let fast = dummy;
  for (let i = 0; i &lt; n; i++) {
    fast = fast.next; // n steps head start
  }
  while (fast.next !== null) { // until fast is on the last node
    slow = slow.next;
    fast = fast.next;
  }
  slow.next = slow.next.next; // unlink the nth node from the end
  return dummy.next;
}
console.log(listToArray(removeNthFromEnd(buildList([1, 2, 3, 4, 5]), 2))); // [1, 2, 3, 5]
console.log(listToArray(removeNthFromEnd(buildList([1]), 1))); // []</code></pre>
    <p>Fast gets an n-node head start, then both move together until fast is on the last node. The gap stays n, so slow is on the node <em>just before</em> the one to remove (the (n + 1)th from the end, counting the last node as 1st). The <a href="#/topic/dsa-words#w-dummy-node">dummy node</a> means removing the head needs no special case. O(L) time for L nodes, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Three sum — handle duplicates.</div>
  <div class="qa-answer">
    <p>After sorting:</p>
    <ul>
      <li>Outer loop: skip <code>nums[i] === nums[i - 1]</code> for i &gt; 0. Same first number = same groups.</li>
      <li>After finding a group: move <code>left</code> past copies of its value (<code>nums[left] === nums[left + 1]</code>), and <code>right</code> past copies of its value going backwards.</li>
      <li>Then move both once more.</li>
      <li>Only skip inside the "found a match" branch. Skipping earlier misses groups like <code>[-4, 2, 2]</code>.</li>
    </ul>
<pre><code class="language-js">function threeSum(nums) {
  nums.sort((a, b) =&gt; a - b); // numeric sort
  const result = [];
  for (let i = 0; i &lt; nums.length - 2; i++) {
    if (nums[i] &gt; 0) {
      break; // three positives can't sum to 0
    }
    if (i &gt; 0 &amp;&amp; nums[i] === nums[i - 1]) {
      continue; // duplicate first number
    }
    let left = i + 1;
    let right = nums.length - 1;
    while (left &lt; right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left &lt; right &amp;&amp; nums[left] === nums[left + 1]) {
          left++; // duplicate left value
        }
        while (left &lt; right &amp;&amp; nums[right] === nums[right - 1]) {
          right--; // duplicate right value
        }
        left++;
        right--;
      } else if (sum &lt; 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return result;
}
console.log(threeSum([-1, 0, 1, 2, -1, -4])); // [[-1, -1, 2], [-1, 0, 1]]
console.log(threeSum([-4, 2, 2])); // [[-4, 2, 2]]</code></pre>
    <p>O(n²) time, O(1) extra space besides the output and the sort.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Squares of sorted array — why two pointers?</div>
  <div class="qa-answer">
    <p>The input may have negatives. After squaring, the <em>smallest</em> square sits somewhere in the middle (where negatives turn into positives), but the <em>largest</em> is always at one of the two ends. So put a finger on each end, take the one with the bigger absolute value (size without the sign), and write its square into the answer from the back. That is O(n), instead of O(n log n) for "square everything, then sort".</p>
<pre><code class="language-js">function sortedSquares(nums) {
  const result = new Array(nums.length);
  let left = 0;
  let right = nums.length - 1;
  for (let write = nums.length - 1; write &gt;= 0; write--) { // biggest square goes last
    const leftSize = Math.abs(nums[left]);
    const rightSize = Math.abs(nums[right]);
    if (leftSize &gt; rightSize) {
      result[write] = leftSize * leftSize;
      left++;
    } else {
      result[write] = rightSize * rightSize;
      right--;
    }
  }
  return result;
}
console.log(sortedSquares([-7, -3, 2, 3, 11])); // [4, 9, 9, 49, 121]</code></pre>
    <p>O(n) time, O(n) space for the output.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You name the variation (opposite ends / same direction / fast and slow).</li>
    <li>You explain why moving that pointer is safe: which item it rules out, and why sorted order guarantees it.</li>
    <li>You skip duplicates when the question wants unique answers.</li>
    <li>You use Floyd's for loop detection, without a Set (O(1) space).</li>
    <li>You use a dummy node in linked-list problems that might remove the head.</li>
    <li>You check empty and single-item inputs.</li>
    <li>You turn strings into arrays before changing them in place.</li>
    <li>You sort first (with <code>(a, b) =&gt; a - b</code>) when the method needs sorted data.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. Why does opposite-ends two pointers usually need a sorted array?</div>
  <div class="qa-answer">
    <p>Because the "which finger moves" rule depends on order. In a sorted array, if the pair sum is too small, moving <code>left</code> right is the only move that can raise it; if it is too big, moving <code>right</code> left is the only move that can lower it. So each step safely throws away one item. In an unsorted array, moving a finger can make the sum go either way, so you can throw away an item that was in the answer.</p>
    <p>You can sort first (O(n log n)). But sorting destroys the original positions. So for two-sum on an unsorted array that must return positions, either sort <code>[value, originalIndex]</code> pairs (Pitfall 5), or use a <a href="#/topic/dsa-words#w-hash-map">Map</a>. The Map remembers each value you have passed; for each new number, you ask whether its <a href="#/topic/dsa-words#w-complement">complement</a> (<code>target - number</code>) is already there:</p>
<pre><code class="language-js">function twoSumUnsorted(nums, target) {
  const indexOfValue = new Map(); // value -&gt; the index where we saw it
  for (let i = 0; i &lt; nums.length; i++) {
    const needed = target - nums[i]; // the partner this number needs
    if (indexOfValue.has(needed)) {
      return [indexOfValue.get(needed), i];
    }
    indexOfValue.set(nums[i], i); // store AFTER checking, so a number can't pair with itself
  }
  return [];
}
console.log(twoSumUnsorted([3, 2, 4], 6)); // [1, 2]
console.log(twoSumUnsorted([11, 7, 2, 15], 9)); // [1, 2]</code></pre>
    <p>That is O(n) time on average (each Map lookup is O(1) on average) and O(n) space. The trade-off: two pointers on sorted data uses O(1) space; the Map uses O(n) space but needs no sort and keeps the positions.</p>
  </div>
</div>
` },

  ]
});
