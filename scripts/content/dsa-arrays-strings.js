// Arrays & Strings, rewritten in plain English (Nov 2026). Main picture: a row of numbered
// lockers. Each locker has a number painted on it (the index, starting at 0) and holds one item.
// A string is a row of lockers that has been sealed shut: you can read it, but not change it.
// DSA words link to the glossary at #/topic/dsa-words#w-<slug>.
window.PREP_SITE.registerTopic({
  id: "dsa-arrays-strings",
  module: "dsa",
  title: "Arrays & Strings",
  estimatedReadTime: "45 min",
  tags: ["dsa","array","string","patterns","in-place","reverse","rotate"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">An <a href="#/topic/dsa-words#w-array">array</a> is a row of numbered lockers; a string is the same row, sealed shut. Almost every question about them is solved by <strong>one of eight tools</strong>: two pointers, sliding window, prefix sum, hash map, sort first, cyclic sort, reverse/rotate, Kadane's. Name the tool, write its shape, then test the edge cases.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Eight tools cover most array and string questions</strong> (roughly 6 in 10): <a href="#/topic/dsa-words#w-two-pointers">two pointers</a>, <a href="#/topic/dsa-words#w-window">sliding window</a>, <a href="#/topic/dsa-words#w-prefix-sum">prefix sums</a>, <a href="#/topic/dsa-words#w-hash-map">hash map</a> (a JS Map used as an instant lookup notebook), sort first, cyclic sort, reverse/rotate, <a href="#/topic/dsa-words#w-kadane">Kadane's</a>.</li>
    <li><strong>Two pointers</strong> (two position variables): either start at both ends and walk inward (a pair in a sorted array, <a href="#/topic/dsa-words#w-palindrome">palindromes</a> that read the same backwards, Container With Most Water), or walk the same way at two speeds, <code>slow</code> and <code>fast</code> (remove duplicates, move zeros). Usually <a href="#/topic/dsa-words#w-o-n">O(n)</a> time (twice the items, twice the work) and <a href="#/topic/dsa-words#w-o-1">O(1)</a> extra space (a few variables, whatever the size).</li>
    <li><strong>Sliding window</strong> for the best side-by-side stretch: move <code>right</code> to take in an item, move <code>left</code> to drop items when the rule breaks. O(n).</li>
    <li><strong>Prefix sums:</strong> build running totals once in O(n); then any range sum is one subtraction, O(1): sum of <code>left..right</code> = <code>prefix[right + 1] - prefix[left]</code>.</li>
    <li><strong>Rotate = three reverses</strong> (whole array, first k, the rest). Do <code>k = k % n</code> first. O(n) time, O(1) extra space.</li>
    <li><strong>Kadane's</strong> (best sum of a side-by-side stretch): if every number is negative it returns the biggest single number. Never write a version that returns 0.</li>
    <li><strong>Cyclic sort</strong> when the values are 1 to n: put each value in locker <code>value - 1</code>; the gaps show what is missing or doubled. O(n).</li>
    <li><strong>Strings are <a href="#/topic/dsa-words#w-immutable">immutable</a>: they can't be changed in place.</strong> <code>s += x</code> in a loop can cost <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a> (twice the items, four times the work), so collect pieces and <code>join</code> once. To edit letters, <code>split('')</code> into an array first. For only a–z, an array of 26 counts beats a Map.</li>
    <li><strong>Use a Set or Map to ask "have I seen this?"</strong> in O(1). Never call <code>arr.includes</code> inside a loop: that is O(n²).</li>
    <li><strong>Product except self:</strong> one pass from the left, one from the right, no division. O(n) time, O(1) extra.</li>
    <li><strong>Sort first</strong> when it makes the problem easy (3-sum, merge intervals). That costs <a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a>, the price of a good sort: a little more than O(n). Skip repeated values so you don't output the same triple twice.</li>
    <li><strong>Always test the edges:</strong> empty, one item, all the same, sorted up, sorted down. Check where <code>left</code>/<code>right</code> start and when the loop stops.</li>
  </ul>
  <h4>Complexity &amp; when to reach for it</h4>
  <ul>
    <li><strong>Time:</strong> most tools are O(n). Sorting first makes it O(n log n). A loop around two pointers (3-sum) is O(n²).</li>
    <li><strong>Space:</strong> two pointers, Kadane's and rotate need O(1) extra. Hash maps and prefix arrays need O(n).</li>
    <li><strong>The signal:</strong> sorted + a pair or triple → two pointers · side-by-side stretch with a rule → sliding window · many range sums → prefix sum · "seen it before?", counts, or "the other half of a pair" → hash map · values 1 to n → cyclic sort · best sum of a stretch → Kadane's · rearrange without extra space → reverse/rotate.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Hidden O(n²) and forgotten edges.</strong> <code>s += x</code> in a loop looks like one pass but can be O(n²), and <code>arr.includes</code> inside a loop really is O(n²). Use <code>join</code> and a Set. The other classic misses: Kadane's returning 0 when every number is negative, rotating without <code>k = k % n</code>, and never trying empty, one-item and all-same inputs or checking where <code>left</code>/<code>right</code> start and stop.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"First I'll name the pattern: two pointers, sliding window, prefix sum or hash map. Then I'll write its usual shape and handle empty, single and all-same inputs up front."</div>
  <div class="revision-say">"Two pointers and sliding window both use two positions. Two pointers compare single items from the ends or at two speeds. A sliding window keeps a whole stretch that follows a rule."</div>
  <div class="revision-say">"Strings can't be changed in place, so I avoid <code>+=</code> in a loop. I build an array of pieces and join once, and for lowercase letters I count with an array of 26."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The picture: a row of numbered lockers</h3>
<p>Picture a school corridor with a long row of lockers. Each locker has a number painted on the door: 0, 1, 2, 3 and so on. Each locker holds exactly one thing.</p>
<p>That row is an <a href="#/topic/dsa-words#w-array">array</a>. In code:</p>
<ul>
  <li>The number on the door is the <a href="#/topic/dsa-words#w-index">index</a>. It starts at 0, not 1. In <code>prices = [400, 150, 700]</code>, <code>prices[0]</code> is 400.</li>
  <li>The thing inside a locker is an <a href="#/topic/dsa-words#w-element">element</a>.</li>
  <li>Because every door has a number, you can walk straight to locker 57 without opening the 57 before it. Reading <code>arr[57]</code> takes the same tiny time whether the row has 10 lockers or 10 million.</li>
  <li>But adding a new locker at the <em>front</em> is slow: every item must shift one door along to make room.</li>
</ul>
<p>A <strong>string</strong> like <code>"hello"</code> is the same row, holding one letter per locker: <code>"hello"[1]</code> is <code>"e"</code>. The difference: in JavaScript the string's lockers are <strong>sealed</strong>. You can read any letter, but you cannot swap one. To "change" a string you build a new one. DSA calls that <a href="#/topic/dsa-words#w-immutable">immutable</a>.</p>
<p>You will also meet two words for a piece of the row. A <a href="#/topic/dsa-words#w-subarray">subarray</a> is a side-by-side piece of an array, with no gaps. A <a href="#/topic/dsa-words#w-substring">substring</a> is the same for a string. "Side by side, no gaps" is called <a href="#/topic/dsa-words#w-contiguous">contiguous</a>.</p>

<h3>A real problem: two prices that use up a gift card</h3>
<p>You have a gift card worth ₹950. A shop's prices are <code>[400, 150, 700, 250, 900]</code>. Which <strong>two</strong> items cost exactly ₹950 together? You want their positions (indexes) in the list.</p>
<p>Answer: 700 + 250 = 950, so the items at index <strong>2 and 3</strong>. This is the famous interview question "Two Sum".</p>

<h3>The slow way, counted in steps</h3>
<p>The first idea most people write: try every pair.</p>
<pre><code class="language-js">function twoSumSlow(prices, budget) {
  for (let i = 0; i &lt; prices.length; i++) {
    for (let j = i + 1; j &lt; prices.length; j++) { // j starts after i, so each pair is tried once
      if (prices[i] + prices[j] === budget) {
        return [i, j];
      }
    }
  }
  return []; // no pair found
}
console.log(twoSumSlow([400, 150, 700, 250, 900], 950)); // [2, 3]</code></pre>
<p>It is correct, but count the work. With n items there are n × (n − 1) / 2 pairs.</p>
<ul>
  <li>5 items: 5 × 4 / 2 = 10 pair checks. No problem.</li>
  <li>10,000 items (a real product catalogue): about <strong>50 million</strong> pair checks.</li>
</ul>
<p><a href="#/topic/dsa-words#w-big-o">Big-O</a> is the shorthand for how work grows with the input size n. A loop inside a loop like this is <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a>: twice the items, four times the work. Trying every possibility like this is called <a href="#/topic/dsa-words#w-brute-force">brute force</a>.</p>

<h3>What the patterns fix</h3>
<p>The slow way keeps re-checking things it has already looked at. The fix here: walk the list <strong>once</strong>, and keep a notebook of prices you have already seen. For each new price, ask: "Is the <em>other half</em> (950 minus this price) already in my notebook?"</p>
<div class="diagram"><pre>prices = [400, 150, 700, 250, 900]      gift card = 950

look at  other half needed  in notebook?  notebook after
400      950 - 400 = 550    no            {400 at 0}
150      950 - 150 = 800    no            {400 at 0, 150 at 1}
700      950 - 700 = 250    no            {400, 150, 700 at 2}
250      950 - 250 = 700    YES, at 2     stop: answer [2, 3]</pre></div>
<p>That notebook is a <a href="#/topic/dsa-words#w-hash-map">hash map</a> (in JavaScript, a <code>Map</code>). Asking it "do you have 700?" takes about the same time however big it gets. So 10,000 items need about 10,000 steps, not 50 million. That is <a href="#/topic/dsa-words#w-o-n">O(n)</a>: twice the items, twice the work.</p>
<p>The "other half" you look for is called the <a href="#/topic/dsa-words#w-complement">complement</a>. The full code is <a href="#/topic/dsa-arrays-strings#ex-1">Example 1</a>.</p>
<p>This whole topic is a <strong>toolbox</strong> of eight such fixes. Each one avoids re-checking in its own way. Learn to spot which tool a question wants, and the rest is a known shape of code.</p>

<h3>Why arrays / strings dominate</h3>
<ul>
  <li><strong>Every language has them.</strong> An interviewer can ask an array question whatever language you use.</li>
  <li><strong>One question tests many skills:</strong> reading by index, changing items, searching, sorting, hash maps, and sometimes <a href="#/topic/dsa-words#w-recursion">recursion</a> (a function that calls itself).</li>
  <li><strong>Real data is array-shaped:</strong> a list of orders, a day's prices, the letters of a message, rows of a spreadsheet.</li>
  <li><strong>The tools carry over.</strong> Two pointers, windows and hash maps come back in linked lists, trees and graphs.</li>
</ul>

<h3>The pattern catalog</h3>
<p>The eight tools, each with the kind of question it solves. Every row is explained step by step further down.</p>
<table>
  <thead><tr><th>Tool</th><th>In plain words</th><th>Use it when</th><th>Time</th><th>Classic problems</th></tr></thead>
  <tbody>
    <tr><td><a href="#/topic/dsa-words#w-two-pointers">Two pointers</a></td><td>Two position variables walking the row, from both ends or at two speeds</td><td>Sorted array, <a href="#/topic/dsa-words#w-palindrome">palindrome</a> (reads the same backwards), pair that adds to X, splitting into groups</td><td>O(n)</td><td>Reverse, Container with most water</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-window">Sliding window</a></td><td>A frame over a side-by-side stretch that grows and shrinks</td><td>Best subarray or substring that follows a rule</td><td>O(n)</td><td>Longest substring with no repeats, max sum of k in a row</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-prefix-sum">Prefix sum</a></td><td>Running totals, built once</td><td>Many "sum from here to there" questions</td><td>O(n) to build, then O(1) per question</td><td>Range sum, split into equal halves</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-hash-map">Hash map</a></td><td>A notebook you can check instantly</td><td>"Seen it before?", counting, looking for the other half of a pair</td><td>O(n) time, O(n) space</td><td>Two sum, anagrams</td></tr>
    <tr><td>Sort first</td><td>Put things in order, then the rest is easy</td><td>Closest pairs, the k-th smallest, removing repeats</td><td>O(n log n)</td><td>3-sum, merge intervals</td></tr>
    <tr><td>Cyclic sort</td><td>Put each value in its own locker</td><td>The values are exactly 1 to n</td><td>O(n)</td><td>Find missing number, find duplicate</td></tr>
    <tr><td>Reverse / rotate</td><td>Flip parts of the row in place</td><td>Rearrange without a second array</td><td>O(n)</td><td>Rotate array, reverse words</td></tr>
    <tr><td><a href="#/topic/dsa-words#w-kadane">Kadane's</a></td><td>A running total that restarts when it goes bad</td><td>Biggest sum of a side-by-side stretch</td><td>O(n)</td><td>Maximum subarray</td></tr>
  </tbody>
</table>
<p><a href="#/topic/dsa-words#w-o-n-log-n">O(n log n)</a> is the cost of a good sort: a bit more than O(n). For 1,000 items it is about 10,000 steps, not 1,000,000.</p>

<h3>Why "in-place"</h3>
<p><a href="#/topic/dsa-words#w-in-place">In-place</a> means you rearrange the items inside the same array, without building a second copy. Picture tidying the lockers by swapping items between them, instead of renting a second corridor.</p>
<p>Interviewers often say "solve it with O(1) extra space". O(1) means a fixed handful of variables, however big the input is. That rules out copying the array. It pushes you to work on the array directly: swap two items, use two pointers, or mark an item (for example by making it negative).</p>

<h3>Why string differs from array</h3>
<ul>
  <li><strong>JavaScript strings are sealed (immutable).</strong> <code>s[0] = "X"</code> silently does nothing. Building a string with <code>+=</code> inside a loop may copy the whole string every time, which adds up to O(n²) in the worst case. Collect the pieces in an array and <code>join</code> them once.</li>
  <li><strong>To change letters, unseal first.</strong> <code>"hello".split("")</code> gives <code>["h", "e", "l", "l", "o"]</code>, an ordinary array you can edit. Then <code>join("")</code> it back.</li>
  <li><strong>Letters come from a small, known set.</strong> There are 26 lowercase letters (and 256 in extended ASCII, the classic numbering that gives every English letter, digit and punctuation mark a code number). So instead of a Map, you can count letters in an array of 26 numbers. <code>"c".charCodeAt(0) - 97</code> is 2, so slot 2 counts the letter c ('a' has code 97).</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<p>Below, each tool is shown as a <strong>trace</strong>: a table of what every variable holds after each step, on a small real input. The answer column comes first, so you can watch it change.</p>

<h3>The "two pointers" picture</h3>
<p>A <a href="#/topic/dsa-words#w-pointer">pointer</a> here is just a number variable that holds a locker number (an index). "Two pointers" means two of them. There are two ways to walk them.</p>
<p><strong>Way 1, from opposite ends.</strong> Two people start at the two ends of the corridor and walk toward each other. Question: in the <a href="#/topic/dsa-words#w-sorted">sorted</a> prices <code>[1, 3, 4, 6, 8, 11]</code>, which two add up to exactly 10? Sorted means smallest to biggest.</p>
<div class="diagram"><pre>prices = [1, 3, 4, 6, 8, 11]       target = 10
index:    0  1  2  3  4   5

step  found?  left  right  pair sum      so...
1     no      0     5      1 + 11 = 12   too big: right moves in
2     no      0     4      1 + 8  = 9    too small: left moves in
3     no      1     4      3 + 8  = 11   too big: right moves in
4     no      1     3      3 + 6  = 9    too small: left moves in
5     YES     2     3      4 + 6  = 10   answer: indexes [2, 3]</pre></div>
<p>Why is it safe to move a pointer? At step 1, 1 + 11 is already too big, and 1 is the <em>smallest</em> price still in play. So 11 plus any other price is too big as well. 11 can never be in the answer: drop it by moving <code>right</code> in. At step 2, 1 + 8 is too small, and 8 is the <em>biggest</em> price still in play. So 1 plus anything is too small: drop 1 by moving <code>left</code> in.</p>
<p>Put simply: too big, give up the biggest; too small, give up the smallest. Each step rules out one item for good, so it takes at most n steps.</p>
<p><strong>Way 2, same direction at two speeds.</strong> <code>fast</code> reads every locker. <code>slow</code> marks where the next "keeper" goes. Question: move every 0 in <code>[0, 1, 0, 3, 12]</code> to the end, keeping the other numbers in order.</p>
<div class="diagram"><pre>numbers = [0, 1, 0, 3, 12]
Rule: if numbers[fast] is not 0, swap it into slot "slow", then slow + 1.

fast  array after this step  slow after  numbers[fast]  action
0     [0, 1, 0, 3, 12]       0           0              skip it
1     [1, 0, 0, 3, 12]       1           1              swap slots 0 and 1
2     [1, 0, 0, 3, 12]       1           0              skip it
3     [1, 3, 0, 0, 12]       2           3              swap slots 1 and 3
4     [1, 3, 12, 0, 0]       3           12             swap slots 2 and 4

Answer: [1, 3, 12, 0, 0]. Everything left of "slow" is a keeper.</pre></div>
<p>The same two-speed walk also removes duplicates from a sorted array, and (on a <a href="#/topic/dsa-words#w-linked-list">linked list</a>) finds loops. That last one is the <a href="#/topic/dsa-words#w-fast-slow-pointers">fast and slow pointers</a> trick.</p>

<h3>The "sliding window" picture</h3>
<p>A <a href="#/topic/dsa-words#w-window">window</a> is a frame over a side-by-side stretch, from <code>left</code> to <code>right</code>. <code>right</code> moves forward to take in a new item. When a rule breaks, <code>left</code> moves forward to drop old items. Question: the longest stretch of <code>"pwwkew"</code> with no letter repeated.</p>
<div class="diagram"><pre>text = "pwwkew"
index:  012345

right  best  letter  what happens                 left  window
0      1     p       take p in                    0     p
1      2     w       take w in                    0     pw
2      2     w       w repeats: drop p, drop w    2     w
3      2     k       take k in                    2     wk
4      3     e       take e in                    2     wke
5      3     w       w repeats: drop w            3     kew

Answer: 3 ("wke" or "kew"). left only ever moved forward.</pre></div>
<p>A <em>fixed</em> window always holds exactly k items and just slides along. A <em>variable</em> window (like this one) stretches and shrinks. The whole pattern has its own topic: <a href="#/topic/dsa-sliding-window">Sliding Window</a>.</p>

<h3>The "prefix sum" picture</h3>
<p>A <a href="#/topic/dsa-words#w-prefix-sum">prefix sum</a> array holds running totals, like the "balance" column of a bank statement. <code>prefix[i]</code> is the total of the first i items. It starts with a 0, meaning "total of no items yet".</p>
<div class="diagram"><pre>numbers = [3, 1, 4, 1, 5,  9,  2,  6]
index:     0  1  2  3  4   5   6   7

prefix  = [0, 3, 4, 8, 9, 14, 23, 25, 31]
index:     0  1  2  3  4   5   6   7   8
           ^     ^              ^
           |     |              total of numbers[0..5] = 23
           |     total of numbers[0..1] = 4
           total of no numbers = 0

Sum of numbers[2..5] (4 + 1 + 5 + 9):
  = (total of first 6) - (total of first 2)
  = prefix[6] - prefix[2] = 23 - 4 = 19</pre></div>
<p>Like a bank statement: money spent between two dates = balance on the later date minus balance on the earlier date. One subtraction, however long the range.</p>

<h3>The "rotation = three reverses" picture</h3>
<p>"Rotate right by k" means every item moves k lockers to the right, and items that fall off the end wrap around to the front.</p>
<div class="diagram"><pre>Rotate [1, 2, 3, 4, 5, 6, 7] right by k = 3.
Wanted: [5, 6, 7, 1, 2, 3, 4]

step                          array after
1. reverse the whole array    [7, 6, 5, 4, 3, 2, 1]
2. reverse the first k (3)    [5, 6, 7, 4, 3, 2, 1]
3. reverse the rest           [5, 6, 7, 1, 2, 3, 4]   done

In place: O(n) time, O(1) extra space.</pre></div>
<p>Why it works: step 1 puts the last k items at the front, but backwards, and the first items at the back, also backwards. Steps 2 and 3 turn each group the right way round again.</p>

<h3>The "edge cases" checklist</h3>
<p>An <a href="#/topic/dsa-words#w-edge-case">edge case</a> is an unusual input at the limits. Try each of these in your head before you say "done":</p>
<ul>
  <li>Empty array or string: <code>[]</code>, <code>""</code>.</li>
  <li>A single item: <code>[5]</code>.</li>
  <li>All items the same: <code>[3, 3, 3]</code>.</li>
  <li>Already sorted, smallest first: <code>[1, 2, 3]</code>.</li>
  <li>Sorted the other way: <code>[3, 2, 1]</code>.</li>
  <li>Negative numbers (if they are allowed).</li>
  <li>Repeated values: allowed or not?</li>
  <li>A very large input: will the numbers get too big (<a href="#/topic/dsa-words#w-overflow">overflow</a>)? Is O(n²) too slow?</li>
  <li>The first and last index: does the loop touch index 0 and index n − 1, and never index n?</li>
</ul>

<h3>How to recognise which tool a question needs</h3>
<table>
  <thead><tr><th>The question says…</th><th>Reach for…</th></tr></thead>
  <tbody>
    <tr><td>"sorted array" + "pair / triplet that adds to X"</td><td>Two pointers from both ends</td></tr>
    <tr><td>"in place", "remove duplicates", "move zeros"</td><td>Two pointers, slow and fast</td></tr>
    <tr><td>"longest / shortest subarray or substring" + a rule</td><td>Sliding window</td></tr>
    <tr><td>"sum between i and j", many times</td><td>Prefix sum</td></tr>
    <tr><td>"have I seen it", "count", "two numbers that add to X" (unsorted)</td><td>Hash map or Set</td></tr>
    <tr><td>"numbers from 1 to n", "missing", "duplicate"</td><td>Cyclic sort</td></tr>
    <tr><td>"maximum sum subarray"</td><td>Kadane's</td></tr>
    <tr><td>"rotate", "reverse words"</td><td>Reverse / rotate</td></tr>
    <tr><td>"overlapping intervals", "unique triplets"</td><td>Sort first, then one pass</td></tr>
  </tbody>
</table>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Two pointers and sliding window are the same thing." Both use two index variables, but they do different jobs:</p>
  <ul>
    <li><strong>Two pointers</strong> look at <em>single items</em>: the pair at both ends, or one fast reader and one slow writer. What lies between them does not matter.</li>
    <li><strong>Sliding window</strong> cares about <em>everything between</em> <code>left</code> and <code>right</code>: its sum, or how many different letters it holds. It grows and shrinks to keep a rule true.</li>
  </ul>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>Each tool as real code you can paste into a console, followed by a line-by-line walkthrough. Every block has its own sample input and prints its answer.</p>

<h3>Two pointers — opposite ends</h3>
<p>Two shapes: reverse an array in place, and find a pair in a sorted array.</p>
<pre><code class="language-js">// Reverse in place: swap the two ends, then step both pointers inward
function reverse(items) {
  let left = 0;
  let right = items.length - 1;
  while (left &lt; right) { // stop when they meet: the middle item stays put
    const temp = items[left]; // hold the left item so it isn't overwritten
    items[left] = items[right];
    items[right] = temp;
    left++;
    right--;
  }
  return items;
}
console.log(reverse([1, 2, 3, 4, 5])); // [5, 4, 3, 2, 1]

// Two-sum on a SORTED array: return the two indexes, or [-1, -1]
function twoSumSorted(sortedNumbers, target) {
  let left = 0;
  let right = sortedNumbers.length - 1;
  while (left &lt; right) {
    const pairSum = sortedNumbers[left] + sortedNumbers[right];
    if (pairSum === target) {
      return [left, right];
    }
    if (pairSum &lt; target) {
      left++; // too small: the smallest number can't be in the answer
    } else {
      right--; // too big: the biggest number can't be in the answer
    }
  }
  return [-1, -1];
}
console.log(twoSumSorted([1, 3, 4, 6, 8, 11], 10)); // [2, 3]</code></pre>
<ul>
  <li><code>while (left &lt; right)</code>: once the two pointers meet, every pair has been dealt with.</li>
  <li>The swap uses a <code>temp</code> variable, like putting one item on the floor while you move the other. (You may also see <code>[a[i], a[j]] = [a[j], a[i]]</code>; it does the same.)</li>
  <li>In <code>twoSumSorted</code>, each round throws away one number for good. That is why it is O(n) time. It uses only three variables: O(1) space.</li>
</ul>

<h3>Two pointers — same direction (fast/slow)</h3>
<p><code>fast</code> reads every item. <code>slow</code> is where the next item worth keeping gets written.</p>
<pre><code class="language-js">// Remove duplicates from a SORTED array in place; return how many unique items remain
function dedupSorted(sortedItems) {
  if (sortedItems.length === 0) {
    return 0;
  }
  let slow = 0; // sortedItems[0..slow] holds the unique items found so far
  for (let fast = 1; fast &lt; sortedItems.length; fast++) {
    if (sortedItems[fast] !== sortedItems[slow]) { // a new value (sorted, so repeats sit together)
      slow++;
      sortedItems[slow] = sortedItems[fast]; // write it just after the last unique one
    }
  }
  return slow + 1; // slow is an index; the count is one more
}
const days = [1, 1, 2, 3, 3, 3, 4];
const uniqueCount = dedupSorted(days);
console.log(uniqueCount); // 4
console.log(days.slice(0, uniqueCount)); // [1, 2, 3, 4]

// Move every 0 to the end, keeping the other numbers in their order
function moveZeros(numbers) {
  let slow = 0; // the next slot for a non-zero number
  for (let fast = 0; fast &lt; numbers.length; fast++) {
    if (numbers[fast] !== 0) {
      const temp = numbers[slow]; // swap the keeper into slot "slow"
      numbers[slow] = numbers[fast];
      numbers[fast] = temp;
      slow++;
    }
  }
  return numbers;
}
console.log(moveZeros([0, 1, 0, 3, 12])); // [1, 3, 12, 0, 0]</code></pre>
<ul>
  <li>Both pointers only move forward, so each item is looked at once: O(n) time, O(1) space.</li>
  <li><code>dedupSorted</code> relies on the array being sorted: equal values sit next to each other, so "different from the last keeper" means "new".</li>
  <li>This is traced step by step in the Mental Model ("same direction at two speeds").</li>
</ul>

<h3>Sliding window — variable</h3>
<p>The longest stretch with no repeated letter. A <a href="#/topic/dsa-words#w-hash-set">Set</a> holds the letters inside the window.</p>
<pre><code class="language-js">function longestUnique(text) {
  const inWindow = new Set(); // letters between left and right
  let left = 0;
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const letter = text[right];
    while (inWindow.has(letter)) { // the new letter is a repeat: shrink from the left
      inWindow.delete(text[left]);
      left++;
    }
    inWindow.add(letter); // now take the new letter in
    const windowLength = right - left + 1; // both ends count, hence + 1
    bestLength = Math.max(bestLength, windowLength);
  }
  return bestLength;
}
console.log(longestUnique("pwwkew")); // 3
console.log(longestUnique("")); // 0</code></pre>
<ul>
  <li>The <code>for</code> loop moves <code>right</code>; the <code>while</code> moves <code>left</code>. Both only go forward, so the total work is at most 2n steps: O(n). This is traced in the Mental Model.</li>
  <li>Space is O(number of different letters), at most the size of the alphabet.</li>
</ul>

<h3>Sliding window — fixed</h3>
<p>The biggest total of any k items in a row. The window is always k wide.</p>
<pre><code class="language-js">function maxSumK(numbers, k) {
  if (k &lt;= 0 || k &gt; numbers.length) {
    return null; // no window of size k fits
  }
  let windowSum = 0;
  for (let i = 0; i &lt; k; i++) {
    windowSum += numbers[i]; // the first window: items 0 .. k-1
  }
  let bestSum = windowSum;
  for (let right = k; right &lt; numbers.length; right++) {
    const entering = numbers[right];
    const leaving = numbers[right - k]; // the item k places behind falls out
    windowSum = windowSum + entering - leaving;
    bestSum = Math.max(bestSum, windowSum);
  }
  return bestSum;
}
console.log(maxSumK([2, 1, 5, 1, 3], 3)); // 9</code></pre>
<ul>
  <li>Instead of re-adding k items at every step, add the one entering and subtract the one leaving. That turns O(n × k) into O(n).</li>
</ul>

<h3>Prefix sum</h3>
<pre><code class="language-js">// prefix[i] = total of the first i numbers; prefix[0] = 0 (total of nothing)
function buildPrefix(numbers) {
  const prefix = [0];
  for (let i = 0; i &lt; numbers.length; i++) {
    const runningTotal = prefix[i] + numbers[i]; // previous total + this number
    prefix.push(runningTotal);
  }
  return prefix;
}

// Sum of numbers[left..right], both ends included (left and right are 0-based indexes)
function rangeSum(prefix, left, right) {
  return prefix[right + 1] - prefix[left]; // total of first right+1, minus total of first left
}

const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
const prefix = buildPrefix(numbers);
console.log(prefix); // [0, 3, 4, 8, 9, 14, 23, 25, 31]
console.log(rangeSum(prefix, 2, 5)); // 19  (4 + 1 + 5 + 9)
console.log(rangeSum(prefix, 0, 0)); // 3</code></pre>
<ul>
  <li>The prefix array is one longer than the input because of the leading 0. That 0 is what makes <code>rangeSum(prefix, 0, r)</code> work without a special case.</li>
  <li>Building costs O(n) time and O(n) space. Each question after that is one subtraction: O(1).</li>
</ul>

<h3>Kadane's algorithm — max subarray sum</h3>
<p>Question: the biggest total of any side-by-side stretch. Think of a cricket batter's run of scores. At each new number you ask one question: <strong>"Should I carry on my current stretch, or start fresh from here?"</strong> If what you carry is negative, it only drags you down, so you start fresh. That is <a href="#/topic/dsa-words#w-kadane">Kadane's algorithm</a>.</p>
<pre><code class="language-js">function maxSubarray(numbers) {
  let bestEndingHere = numbers[0]; // best total of a stretch that ends at the current item
  let bestOverall = numbers[0]; // best total seen anywhere so far
  for (let i = 1; i &lt; numbers.length; i++) {
    const carryOn = bestEndingHere + numbers[i]; // extend the current stretch
    const startFresh = numbers[i]; // or begin a new stretch at this item
    bestEndingHere = Math.max(carryOn, startFresh);
    bestOverall = Math.max(bestOverall, bestEndingHere);
  }
  return bestOverall;
}
console.log(maxSubarray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 6  ([4, -1, 2, 1])
console.log(maxSubarray([-3, -1, -2])); // -1  (all negative: the biggest single number)</code></pre>
<ul>
  <li>Starting from <code>numbers[0]</code>, not 0, is what makes the all-negative case right.</li>
  <li>O(n) time, O(1) space. Full trace in <a href="#/topic/dsa-arrays-strings#ex-8">Example 8</a>.</li>
</ul>

<h3>Cyclic sort (for [1..n] range)</h3>
<p>When the values are the numbers 1 to n, each value has a "home" locker: value 1 belongs at index 0, value 2 at index 1, value v at index <code>v - 1</code>. Keep swapping each value into its home. Afterwards, any locker holding the wrong value shows what is missing.</p>
<pre><code class="language-js">// The array holds n-1 different numbers from 1..n. Which one is missing?
function findMissing(numbers) {
  let i = 0;
  while (i &lt; numbers.length) {
    const value = numbers[i];
    const homeIndex = value - 1; // where this value belongs
    const homeExists = homeIndex &lt; numbers.length; // the value n has no locker here
    if (homeExists &amp;&amp; numbers[homeIndex] !== value) {
      // send value home; whatever was there comes back to slot i, so don't move i yet
      numbers[i] = numbers[homeIndex];
      numbers[homeIndex] = value;
    } else {
      i++; // already home, or has no home: move on
    }
  }
  for (let j = 0; j &lt; numbers.length; j++) {
    if (numbers[j] !== j + 1) {
      return j + 1; // locker j should hold j + 1, and doesn't
    }
  }
  return numbers.length + 1; // every locker is right, so the missing one is n
}
console.log(findMissing([3, 1, 5, 2])); // 4
console.log(findMissing([1, 2, 3, 4])); // 5</code></pre>
<ul>
  <li>Why O(n) even with <code>i</code> sometimes staying still: every swap puts one value in its home for good, so there are at most n swaps in total, plus n steps of <code>i++</code>.</li>
  <li>O(1) extra space, but it rearranges the input.</li>
</ul>

<h3>Rotate array</h3>
<pre><code class="language-js">// Reverse the items between two indexes, both included
function reverseRange(items, start, end) {
  let left = start;
  let right = end;
  while (left &lt; right) {
    const temp = items[left];
    items[left] = items[right];
    items[right] = temp;
    left++;
    right--;
  }
}

// Rotate right by k places, in place
function rotate(items, k) {
  const n = items.length;
  if (n === 0) {
    return items;
  }
  const steps = k % n; // rotating by n is a full circle, so only the remainder matters
  reverseRange(items, 0, n - 1); // 1. reverse everything
  reverseRange(items, 0, steps - 1); // 2. reverse the first k
  reverseRange(items, steps, n - 1); // 3. reverse the rest
  return items;
}
console.log(rotate([1, 2, 3, 4, 5, 6, 7], 3)); // [5, 6, 7, 1, 2, 3, 4]
console.log(rotate([1, 2, 3, 4, 5], 7)); // [4, 5, 1, 2, 3]  (7 % 5 = 2)</code></pre>
<ul>
  <li><code>%</code> is the remainder: <code>7 % 5</code> is 2. Rotating 5 items by 7 is the same as rotating by 2.</li>
  <li>Each item is swapped at most twice: O(n) time, O(1) space. Picture in the Mental Model.</li>
</ul>

<h3>String-specific patterns</h3>
<pre><code class="language-js">// Count letters a-z in an array of 26 slots: slot 0 is 'a', slot 25 is 'z'
function charCount(word) {
  const counts = new Array(26).fill(0);
  for (const letter of word) {
    const slot = letter.charCodeAt(0) - 97; // 'a' has code 97, so 'a' -&gt; 0, 'b' -&gt; 1
    counts[slot]++;
  }
  return counts;
}

// Anagram check: same letters, same number of times
function isAnagram(first, second) {
  if (first.length !== second.length) {
    return false;
  }
  const firstCounts = charCount(first);
  const secondCounts = charCount(second);
  for (let i = 0; i &lt; 26; i++) {
    if (firstCounts[i] !== secondCounts[i]) {
      return false;
    }
  }
  return true;
}

// Palindrome check, looking only at letters and digits
function isPalindrome(text) {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9]/g, ""); // drop everything else
  let left = 0;
  let right = cleaned.length - 1;
  while (left &lt; right) {
    if (cleaned[left] !== cleaned[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}

// Reverse the order of words; extra spaces are dropped
function reverseWords(sentence) {
  const pieces = sentence.split(" ");
  const words = pieces.filter(piece =&gt; piece !== ""); // several spaces in a row make empty pieces
  return words.reverse().join(" ");
}

console.log(charCount("abca").slice(0, 3)); // [2, 1, 1]
console.log(isAnagram("listen", "silent")); // true
console.log(isPalindrome("Race car!")); // true
console.log(reverseWords("  the sky   is blue ")); // "blue is sky the"</code></pre>
<ul>
  <li>An <a href="#/topic/dsa-words#w-anagram">anagram</a> is the same letters in a new order ("listen", "silent"). A <a href="#/topic/dsa-words#w-palindrome">palindrome</a> reads the same backwards ("racecar").</li>
  <li>The 26-slot array only works for lowercase a–z. For any other characters, count with a Map instead.</li>
  <li>All four are O(n) time. The count arrays are O(1) space because 26 never grows.</li>
</ul>

<h3>Three sum (sort + two pointers)</h3>
<p>Find every group of three numbers that adds to 0, with no repeated groups. Sort first; then for each number, run the opposite-ends two pointers on the numbers after it.</p>
<pre><code class="language-js">function threeSum(numbers) {
  const sorted = [...numbers].sort((a, b) =&gt; a - b); // a copy, smallest first
  const triples = [];
  for (let i = 0; i &lt; sorted.length - 2; i++) {
    if (i &gt; 0 &amp;&amp; sorted[i] === sorted[i - 1]) {
      continue; // same first number as last round: would repeat a triple
    }
    let left = i + 1;
    let right = sorted.length - 1;
    while (left &lt; right) {
      const total = sorted[i] + sorted[left] + sorted[right];
      if (total === 0) {
        triples.push([sorted[i], sorted[left], sorted[right]]);
        while (left &lt; right &amp;&amp; sorted[left] === sorted[left + 1]) {
          left++; // skip copies of the middle number
        }
        while (left &lt; right &amp;&amp; sorted[right] === sorted[right - 1]) {
          right--; // skip copies of the last number
        }
        left++;
        right--;
      } else if (total &lt; 0) {
        left++; // too small: need a bigger number
      } else {
        right--; // too big: need a smaller number
      }
    }
  }
  return triples;
}
console.log(threeSum([-1, 0, 1, 2, -1, -4])); // [[-1, -1, 2], [-1, 0, 1]]</code></pre>
<ul>
  <li>Sorting costs O(n log n). Then an O(n) two-pointer walk for each of n first numbers: O(n²) in total.</li>
  <li>Extra space is O(1) apart from the output and the sorted copy (sort in place instead if you may change the input).</li>
</ul>

<h3>Merge intervals</h3>
<p>An <a href="#/topic/dsa-words#w-interval">interval</a> is a <code>[start, end]</code> pair, like a meeting from 1 to 3. Merge every overlapping pair.</p>
<pre><code class="language-js">function mergeIntervals(intervals) {
  if (intervals.length === 0) {
    return [];
  }
  const sorted = [...intervals].sort((a, b) =&gt; a[0] - b[0]); // by start time
  const merged = [[sorted[0][0], sorted[0][1]]]; // a copy, so the input isn't changed
  for (let i = 1; i &lt; sorted.length; i++) {
    const start = sorted[i][0];
    const end = sorted[i][1];
    const last = merged[merged.length - 1];
    if (start &lt;= last[1]) {
      last[1] = Math.max(last[1], end); // overlaps: stretch the last one
    } else {
      merged.push([start, end]); // a gap: start a new one
    }
  }
  return merged;
}
console.log(mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]])); // [[1, 6], [8, 10], [15, 18]]</code></pre>
<ul>
  <li>After sorting by start, only the <em>last</em> merged interval can overlap the next one. So one pass is enough.</li>
  <li>O(n log n) time because of the sort; the pass itself is O(n).</li>
</ul>

<h3>Product of array except self</h3>
<p>For each slot, the product of every <em>other</em> number, without using division. The trick: the answer for slot i is (product of everything to its left) × (product of everything to its right). These left and right products are the <a href="#/topic/dsa-words#w-prefix-suffix">prefix and suffix</a> products.</p>
<pre><code class="language-js">function productExceptSelf(numbers) {
  const result = new Array(numbers.length).fill(1);
  let leftProduct = 1; // product of everything left of i
  for (let i = 0; i &lt; numbers.length; i++) {
    result[i] = leftProduct;
    leftProduct *= numbers[i];
  }
  let rightProduct = 1; // product of everything right of i
  for (let i = numbers.length - 1; i &gt;= 0; i--) {
    result[i] *= rightProduct;
    rightProduct *= numbers[i];
  }
  return result;
}
console.log(productExceptSelf([1, 2, 3, 4])); // [24, 12, 8, 6]</code></pre>
<ul>
  <li>After the first loop, <code>result</code> is <code>[1, 1, 2, 6]</code> (left products). The second loop multiplies in the right products: 24, 12, 8, 6.</li>
  <li>O(n) time. O(1) extra space, not counting the output array.</li>
</ul>

<h3>Common operations cost (JS)</h3>
<p>What each built-in really costs. n is the length of the array or string.</p>
<table>
  <thead><tr><th>Operation</th><th>Cost</th><th>Why, in plain words</th></tr></thead>
  <tbody>
    <tr><td><code>arr[i]</code></td><td>O(1)</td><td>Walk straight to locker i</td></tr>
    <tr><td><code>arr.push</code> / <code>arr.pop</code></td><td>O(1) <a href="#/topic/dsa-words#w-amortized">amortized</a></td><td>Add or remove at the end; nothing moves. "Amortized" means: now and then the array must grow its storage, but averaged out each push is cheap</td></tr>
    <tr><td><code>arr.shift</code> / <code>arr.unshift</code></td><td>O(n)</td><td>Remove or add at the front: every item shifts one locker</td></tr>
    <tr><td><code>arr.splice(i, n)</code></td><td>O(n)</td><td>Items after i shift along</td></tr>
    <tr><td><code>arr.slice</code> / <code>concat</code> / <code>map</code> / <code>filter</code></td><td>O(n)</td><td>They touch or copy every item</td></tr>
    <tr><td><code>arr.includes</code> / <code>indexOf</code></td><td>O(n)</td><td>They check lockers one by one</td></tr>
    <tr><td><code>arr.sort</code></td><td>O(n log n)</td><td>A good sort</td></tr>
    <tr><td><code>set.has</code> / <code>map.has</code></td><td>O(1) on average</td><td>A hash map jumps straight to the answer</td></tr>
    <tr><td><code>str.charAt(i)</code> / <code>str[i]</code></td><td>O(1)</td><td>Read one letter</td></tr>
    <tr><td><code>str + str</code></td><td>O(n)</td><td>Builds a new string</td></tr>
    <tr><td><code>+=</code> on a string, in a loop</td><td>Up to O(n²) total</td><td>May copy the growing string each time; use <code>join</code></td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<p>Fifteen classic interview problems. Each one has the problem in plain words, the idea, a short trace (answer column first), code you can paste into a console, and its cost in words.</p>

<h3 id="ex-1">Example 1 — Two Sum</h3>
<p><strong>The problem:</strong> Given a list of numbers and a target, return the indexes of the two numbers that add up to the target. The list is <em>not</em> sorted. This is the gift-card question from What &amp; Why.</p>
<p><strong>The idea:</strong> Walk once. For each number, work out the <a href="#/topic/dsa-words#w-complement">complement</a> (target minus this number). If the complement is already in a Map of "numbers seen so far", you are done. If not, write this number and its index into the Map.</p>
<div class="diagram"><pre>numbers = [400, 150, 700, 250, 900]     target = 950

i  answer  number  complement  in Map?   Map after this step
0  -       400     550         no        400:0
1  -       150     800         no        400:0, 150:1
2  -       700     250         no        400:0, 150:1, 700:2
3  [2, 3]  250     700         yes, at 2 (stop)</pre></div>
<pre><code class="language-js">function twoSum(numbers, target) {
  const indexOfNumber = new Map(); // number -&gt; the index where we saw it
  for (let i = 0; i &lt; numbers.length; i++) {
    const complement = target - numbers[i]; // the other half we need
    if (indexOfNumber.has(complement)) {
      const otherIndex = indexOfNumber.get(complement);
      return [otherIndex, i];
    }
    indexOfNumber.set(numbers[i], i); // remember this one for later numbers
  }
  return []; // no pair adds up to target
}
console.log(twoSum([400, 150, 700, 250, 900], 950)); // [2, 3]
console.log(twoSum([3, 3], 6)); // [0, 1]</code></pre>
<p>Why check <em>before</em> storing? Take <code>[3]</code> with target 6. If you stored 3 first, its complement (3) would already be in the Map, and the code would wrongly pair the 3 with itself: <code>[0, 0]</code>. Checking first means a number can only pair with an <em>earlier</em> one. That is also why <code>[3, 3]</code> correctly gives <code>[0, 1]</code>.</p>
<p><strong>Cost:</strong> time O(n), one pass. Space O(n): the Map can hold every number.</p>

<h3 id="ex-2">Example 2 — Best Time to Buy and Sell Stock</h3>
<p><strong>The problem:</strong> <code>prices[i]</code> is a share's price on day i. Buy on one day and sell on a <em>later</em> day. What is the most profit you can make? If no profit is possible, return 0.</p>
<p><strong>The idea:</strong> Walk the days once. Remember the cheapest price so far. On each day, ask: "If I sold today, having bought at the cheapest day before, what would I make?" Keep the best of those.</p>
<div class="diagram"><pre>prices = [7, 1, 5, 3, 6, 4]

day  best profit  price  cheapest so far  profit if sold today
0    0            7      7                0
1    0            1      1                0
2    4            5      1                4
3    4            3      1                2
4    5            6      1                5
5    5            4      1                3
Answer: 5 (buy at 1, sell at 6)</pre></div>
<pre><code class="language-js">function maxProfit(prices) {
  let cheapestSoFar = Infinity; // no price seen yet; any real price is cheaper
  let bestProfit = 0;
  for (const price of prices) {
    cheapestSoFar = Math.min(cheapestSoFar, price);
    const profitToday = price - cheapestSoFar; // sell today, bought at the cheapest earlier day
    bestProfit = Math.max(bestProfit, profitToday);
  }
  return bestProfit;
}
console.log(maxProfit([7, 1, 5, 3, 6, 4])); // 5
console.log(maxProfit([7, 6, 4, 3, 1])); // 0  (prices only fall)</code></pre>
<p><strong>Cost:</strong> time O(n), one pass. Space O(1), two numbers.</p>

<h3 id="ex-3">Example 3 — Container With Most Water</h3>
<p><strong>The problem:</strong> Each number is the height of a vertical wall standing at that index. Pick two walls. Water fills between them up to the <em>shorter</em> wall. Which pair holds the most water? Water held = shorter height × distance between them.</p>
<p><strong>The idea:</strong> Start with the two outermost walls (the widest container). Then move the pointer at the <em>shorter</em> wall inward. Why? The shorter wall limits the water. Moving the taller wall inward can only make the container narrower without raising that limit, so it can never help.</p>
<div class="diagram"><pre>height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
index:    0  1  2  3  4  5  6  7  8

left  right  best  water = shorter x width   move
0     8      8     min(1, 7) x 8 = 8        left (1 is shorter)
1     8      49    min(8, 7) x 7 = 49       right (7 is shorter)
1     7      49    min(8, 3) x 6 = 18       right
1     6      49    min(8, 8) x 5 = 40       right (a tie: either)
1     5      49    min(8, 4) x 4 = 16       right
1     4      49    min(8, 5) x 3 = 15       right
1     3      49    min(8, 2) x 2 = 4        right
1     2      49    min(8, 6) x 1 = 6        right, then they meet
Answer: 49</pre></div>
<pre><code class="language-js">function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let bestWater = 0;
  while (left &lt; right) {
    const shorterWall = Math.min(height[left], height[right]); // water can't rise above it
    const width = right - left;
    const water = shorterWall * width;
    bestWater = Math.max(bestWater, water);
    if (height[left] &lt; height[right]) {
      left++; // the left wall is the limit: try a taller one
    } else {
      right--; // the right wall is the limit (or a tie)
    }
  }
  return bestWater;
}
console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49</code></pre>
<p><strong>Cost:</strong> time O(n): each step moves one pointer inward. Space O(1).</p>

<h3 id="ex-4">Example 4 — Trapping Rain Water</h3>
<p><strong>The problem:</strong> The numbers are heights of blocks in a row, each 1 wide. After rain, how much water is trapped in the dips between blocks?</p>
<p><strong>The idea:</strong> Water above a block rises to the <em>lower</em> of (tallest block on its left, tallest block on its right), minus its own height. Walk two pointers inward. Always handle the side with the lower wall. On that side you already know the tallest wall that limits it, because the other side has something at least as tall.</p>
<div class="diagram"><pre>height = [3, 0, 2, 0, 4]
index:    0  1  2  3  4

left  right  water  side   tallest on that side  water on this block
0     4      0      left   3                     3 - 3 = 0
1     4      3      left   3                     3 - 0 = 3
2     4      4      left   3                     3 - 2 = 1
3     4      7      left   3                     3 - 0 = 3
(left reaches right: stop)
Answer: 7</pre></div>
<pre><code class="language-js">function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let tallestLeft = 0; // tallest block seen from the left so far
  let tallestRight = 0; // tallest block seen from the right so far
  let water = 0;
  while (left &lt; right) {
    if (height[left] &lt; height[right]) {
      // the right side has a taller wall, so the left side's limit is tallestLeft
      tallestLeft = Math.max(tallestLeft, height[left]);
      water += tallestLeft - height[left];
      left++;
    } else {
      tallestRight = Math.max(tallestRight, height[right]);
      water += tallestRight - height[right];
      right--;
    }
  }
  return water;
}
console.log(trap([3, 0, 2, 0, 4])); // 7
console.log(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6</code></pre>
<p><strong>Cost:</strong> time O(n), space O(1). (A simpler version builds two arrays of "tallest to the left" and "tallest to the right": also O(n) time, but O(n) space.)</p>

<h3 id="ex-5">Example 5 — Longest Substring Without Repeating</h3>
<p><strong>The problem:</strong> The length of the longest <a href="#/topic/dsa-words#w-substring">substring</a> (side-by-side letters) with no letter repeated.</p>
<p><strong>The idea:</strong> A sliding window. Instead of shrinking one letter at a time (as in Mechanics), remember where each letter was last seen. When a letter repeats <em>inside</em> the window, jump <code>left</code> straight past its old copy.</p>
<div class="diagram"><pre>text = "abba"

right  best  letter  last seen at          left  window
0      1     a       never                 0     a
1      2     b       never                 0     ab
2      2     b       1 (inside window)     2     b
3      2     a       0 (outside: ignore)   2     ba
Answer: 2</pre></div>
<pre><code class="language-js">function lengthOfLongestSubstring(text) {
  const lastSeenAt = new Map(); // letter -&gt; the index where we last saw it
  let left = 0;
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const letter = text[right];
    if (lastSeenAt.has(letter)) {
      const previousIndex = lastSeenAt.get(letter);
      if (previousIndex &gt;= left) {
        left = previousIndex + 1; // the old copy is inside the window: jump past it
      }
    }
    lastSeenAt.set(letter, right);
    const windowLength = right - left + 1;
    bestLength = Math.max(bestLength, windowLength);
  }
  return bestLength;
}
console.log(lengthOfLongestSubstring("abcabcbb")); // 3
console.log(lengthOfLongestSubstring("abba")); // 2
console.log(lengthOfLongestSubstring("")); // 0</code></pre>
<p>The <code>previousIndex &gt;= left</code> check matters. At the last 'a' in "abba", the old 'a' (index 0) is already outside the window. Without the check, <code>left</code> would jump <em>back</em> to 1.</p>
<p><strong>Cost:</strong> time O(n). Space O(min(n, alphabet size)): one Map entry per different letter.</p>

<h3 id="ex-6">Example 6 — Group Anagrams</h3>
<p><strong>The problem:</strong> Given a list of words, put words that are <a href="#/topic/dsa-words#w-anagram">anagrams</a> of each other (same letters, any order) into the same group.</p>
<p><strong>The idea:</strong> Give every word a "label" that anagrams share: its letters sorted. "eat", "tea" and "ate" all sort to "aet". Use a Map from label to the list of words with that label.</p>
<div class="diagram"><pre>words = ["eat", "tea", "tan", "ate", "nat", "bat"]

word  label  groups after this word
eat   aet    aet: [eat]
tea   aet    aet: [eat, tea]
tan   ant    aet: [eat, tea]        ant: [tan]
ate   aet    aet: [eat, tea, ate]   ant: [tan]
nat   ant    aet: [eat, tea, ate]   ant: [tan, nat]
bat   abt    ... plus abt: [bat]</pre></div>
<pre><code class="language-js">function groupAnagrams(words) {
  const groups = new Map(); // label -&gt; list of words with that label
  for (const word of words) {
    const label = word.split("").sort().join(""); // "tea" -&gt; "aet"
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    const group = groups.get(label);
    group.push(word);
  }
  return [...groups.values()]; // just the lists
}
console.log(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));
// [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]</code></pre>
<p><strong>Cost:</strong> n words, each about k letters long. Sorting one word is O(k log k), so the total is O(n × k log k). Space O(n × k) for the Map. (A faster label is the 26 letter counts joined into a string: O(n × k).)</p>

<h3 id="ex-7">Example 7 — Valid Anagram</h3>
<p><strong>The problem:</strong> Are two words anagrams of each other? Assume only lowercase a–z.</p>
<p><strong>The idea:</strong> One array of 26 counters. Walk both words together: add 1 for each letter of the first word, take 1 away for each letter of the second. If every counter ends at 0, the letters match exactly.</p>
<div class="diagram"><pre>first = "rat"   second = "tar"

i  all zero?  adds  takes  counters that are not zero
0  no         r     t      r: +1, t: -1
1  no         a     a      r: +1, t: -1   (a: +1 -1 = 0)
2  yes        t     r      none           (t back to 0, r back to 0)
Answer: true</pre></div>
<pre><code class="language-js">function isAnagram(first, second) {
  if (first.length !== second.length) {
    return false; // different lengths can't have the same letters
  }
  const counts = new Array(26).fill(0); // slot 0 = 'a' ... slot 25 = 'z'
  for (let i = 0; i &lt; first.length; i++) {
    counts[first.charCodeAt(i) - 97]++; // 'a' has code 97
    counts[second.charCodeAt(i) - 97]--;
  }
  for (let slot = 0; slot &lt; 26; slot++) {
    if (counts[slot] !== 0) {
      return false;
    }
  }
  return true;
}
console.log(isAnagram("rat", "tar")); // true
console.log(isAnagram("anagram", "nagaram")); // true
console.log(isAnagram("rat", "car")); // false</code></pre>
<p><strong>Cost:</strong> time O(n). Space O(1): always 26 counters, whatever the length. For other characters (capitals, emoji), use a Map of counts instead.</p>

<h3 id="ex-8">Example 8 — Maximum Subarray (Kadane's)</h3>
<p><strong>The problem:</strong> The biggest total of any non-empty <a href="#/topic/dsa-words#w-subarray">subarray</a> (side-by-side stretch). Numbers can be negative.</p>
<p><strong>The idea:</strong> <a href="#/topic/dsa-words#w-kadane">Kadane's algorithm</a>. At each number: carry on the current stretch, or start fresh here, whichever is bigger. If the stretch so far is negative, it only drags you down, so start fresh.</p>
<div class="diagram"><pre>numbers = [-2, 1, -3, 4, -1, 2, 1, -5, 4]

i  best  number  carry on       start fresh  best ending here
0  -2    -2      (first item)   -2           -2
1  1     1       -2 + 1 = -1    1            1
2  1     -3      1 - 3 = -2     -3           -2
3  4     4       -2 + 4 = 2     4            4
4  4     -1      4 - 1 = 3      -1           3
5  5     2       3 + 2 = 5      2            5
6  6     1       5 + 1 = 6      1            6
7  6     -5      6 - 5 = 1      -5           1
8  6     4       1 + 4 = 5      4            5
Answer: 6 (the stretch [4, -1, 2, 1])</pre></div>
<pre><code class="language-js">function maxSubArray(numbers) {
  let bestEndingHere = numbers[0]; // best total of a stretch ending at the current item
  let bestOverall = numbers[0];
  for (let i = 1; i &lt; numbers.length; i++) {
    const carryOn = bestEndingHere + numbers[i];
    const startFresh = numbers[i];
    bestEndingHere = Math.max(carryOn, startFresh);
    bestOverall = Math.max(bestOverall, bestEndingHere);
  }
  return bestOverall;
}
console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 6
console.log(maxSubArray([-3, -1, -2])); // -1</code></pre>
<p>Starting both variables at <code>numbers[0]</code>, not 0, is what makes the all-negative case right: the answer is -1, not 0.</p>
<p><strong>Cost:</strong> time O(n), space O(1).</p>

<h3 id="ex-9">Example 9 — Merge Sorted Array (in place)</h3>
<p><strong>The problem:</strong> <code>first</code> has m sorted numbers followed by n empty slots (zeros). <code>second</code> has n sorted numbers. Merge <code>second</code> into <code>first</code> so all m + n are sorted, without a new array.</p>
<p><strong>The idea:</strong> Fill <code>first</code> from the <strong>back</strong>. The empty slots are at the back, so you never overwrite a number you still need. Three pointers: the last real number of each array, and the slot being written.</p>
<div class="diagram"><pre>first = [1, 2, 3, 0, 0, 0]  m = 3      second = [2, 5, 6]  n = 3

write  first after this step  i  j  compare     put
5      [1, 2, 3, 0, 0, 6]     2  2  3 vs 6      6 (from second)
4      [1, 2, 3, 0, 5, 6]     2  1  3 vs 5      5 (from second)
3      [1, 2, 3, 3, 5, 6]     2  0  3 vs 2      3 (from first)
2      [1, 2, 2, 3, 5, 6]     1  0  2 vs 2      2 (from second)
second is used up: stop. Answer: [1, 2, 2, 3, 5, 6]
(i and j are shown before the step.)</pre></div>
<pre><code class="language-js">function mergeSorted(first, m, second, n) {
  let i = m - 1; // last real number in first
  let j = n - 1; // last number in second
  let write = m + n - 1; // the slot to fill next, from the back
  while (j &gt;= 0) { // once second is used up, the rest of first is already in place
    if (i &gt;= 0 &amp;&amp; first[i] &gt; second[j]) {
      first[write] = first[i];
      i--;
    } else {
      first[write] = second[j];
      j--;
    }
    write--;
  }
  return first;
}
console.log(mergeSorted([1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3)); // [1, 2, 2, 3, 5, 6]
console.log(mergeSorted([0], 0, [1], 1)); // [1]</code></pre>
<p><strong>Cost:</strong> time O(m + n): each number is placed once. Space O(1).</p>

<h3 id="ex-10">Example 10 — Find Duplicate Number (cyclic)</h3>
<p><strong>The problem:</strong> An array of n + 1 numbers, each between 1 and n. So at least one number appears twice. Find it, without changing the array and with O(1) extra space.</p>
<p><strong>The idea:</strong> Read each value as "go to locker number <em>value</em> next". Starting from locker 0, you follow a trail. Because two lockers point to the same place (the duplicate), the trail ends in a loop, a <a href="#/topic/dsa-words#w-cycle">cycle</a>. The locker where the loop begins is the duplicate.</p>
<p>To find where the loop begins, use <a href="#/topic/dsa-words#w-fast-slow-pointers">Floyd's cycle detection</a> (the tortoise and the hare). Phase 1: a slow walker takes 1 step, a fast walker takes 2 steps, until they meet inside the loop. Phase 2: put one walker back at the start; now both take 1 step; where they meet is the start of the loop. (Why phase 2 works is a known maths fact. In an interview, you can state it.)</p>
<div class="diagram"><pre>numbers = [1, 3, 4, 2, 2]
index:     0  1  2  3  4
Trail from locker 0: 0 -&gt; 1 -&gt; 3 -&gt; 2 -&gt; 4 -&gt; 2 -&gt; 4 ...
The loop is 2 -&gt; 4 -&gt; 2, and it is entered at 2.

phase  answer  slow  fast
1      -       1     1      both start at numbers[0]
1      -       3     2      slow 1 step, fast 2 steps
1      -       2     2      they meet
2      -       1     2      slow back to the start; both 1 step
2      -       3     4
2      2       2     2      meet again: 2 is the duplicate</pre></div>
<pre><code class="language-js">function findDuplicate(numbers) {
  // Phase 1: find a meeting point inside the loop
  let slow = numbers[0];
  let fast = numbers[0];
  do {
    slow = numbers[slow]; // one step
    const fastHalfway = numbers[fast];
    fast = numbers[fastHalfway]; // two steps
  } while (slow !== fast);

  // Phase 2: one walker restarts; walking at the same speed, they meet at the loop's entrance
  slow = numbers[0];
  while (slow !== fast) {
    slow = numbers[slow];
    fast = numbers[fast];
  }
  return slow;
}
console.log(findDuplicate([1, 3, 4, 2, 2])); // 2
console.log(findDuplicate([3, 1, 3, 4, 2])); // 3</code></pre>
<p><strong>If you may change the array</strong>, cyclic sort is simpler: swap each value towards its home locker (<code>value - 1</code>). When the home already holds that same value, you have found the duplicate.</p>
<pre><code class="language-js">function findDuplicateBySwapping(numbers) {
  let i = 0;
  while (i &lt; numbers.length) {
    const value = numbers[i];
    const homeIndex = value - 1; // value v belongs at index v - 1
    if (i === homeIndex) {
      i++; // already home
    } else if (numbers[homeIndex] === value) {
      return value; // its home already holds a copy: duplicate
    } else {
      numbers[i] = numbers[homeIndex]; // swap value home
      numbers[homeIndex] = value;
    }
  }
  return -1; // no duplicate (can't happen with valid input)
}
console.log(findDuplicateBySwapping([1, 3, 4, 2, 2])); // 2</code></pre>
<p><strong>Cost:</strong> both are time O(n), space O(1). Floyd's leaves the array untouched; the swapping version rearranges it.</p>

<h3 id="ex-11">Example 11 — Valid Palindrome (alphanumeric)</h3>
<p><strong>The problem:</strong> Is a sentence a <a href="#/topic/dsa-words#w-palindrome">palindrome</a> if you ignore case and everything that is not a letter or digit? "A man, a plan, a canal: Panama" is.</p>
<p><strong>The idea:</strong> Two pointers from both ends. Each pointer skips over characters that don't count. Then compare, ignoring case. No cleaned copy needed.</p>
<div class="diagram"><pre>text = "Ab,a"
index:  0123

left  right  same so far?  what happens
0     3      yes           'A' vs 'a': equal, both move in
1     2      yes           text[2] is ',': right skips to 1
1     1      yes           left = right = 1: compares 'b' with itself
2     0      yes           left passed right: stop
Answer: true</pre></div>
<pre><code class="language-js">function isLetterOrDigit(character) {
  return /[a-zA-Z0-9]/.test(character);
}

function isPalindrome(text) {
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
console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
console.log(isPalindrome("race a car")); // false
console.log(isPalindrome("")); // true</code></pre>
<p><strong>Cost:</strong> time O(n). Space O(1): unlike the Mechanics version, it builds no cleaned copy.</p>

<h3 id="ex-12">Example 12 — Rotate Array</h3>
<p><strong>The problem:</strong> Rotate an array right by k places, in place. Items that fall off the end wrap around to the front.</p>
<p><strong>The idea:</strong> Three reverses: the whole array, the first k, the rest. First cut k down with <code>k % n</code>.</p>
<div class="diagram"><pre>numbers = [1, 2, 3, 4, 5, 6, 7]   k = 10, n = 7
steps = 10 % 7 = 3

step                       array after
reverse all (0..6)         [7, 6, 5, 4, 3, 2, 1]
reverse first 3 (0..2)     [5, 6, 7, 4, 3, 2, 1]
reverse the rest (3..6)    [5, 6, 7, 1, 2, 3, 4]
Answer: [5, 6, 7, 1, 2, 3, 4]</pre></div>
<pre><code class="language-js">function reverseRange(items, start, end) {
  let left = start;
  let right = end;
  while (left &lt; right) {
    const temp = items[left];
    items[left] = items[right];
    items[right] = temp;
    left++;
    right--;
  }
}

function rotate(numbers, k) {
  const n = numbers.length;
  if (n === 0) {
    return numbers;
  }
  const steps = k % n; // rotating by n changes nothing
  reverseRange(numbers, 0, n - 1);
  reverseRange(numbers, 0, steps - 1);
  reverseRange(numbers, steps, n - 1);
  return numbers;
}
console.log(rotate([1, 2, 3, 4, 5, 6, 7], 10)); // [5, 6, 7, 1, 2, 3, 4]
console.log(rotate([-1, -100, 3, 99], 2)); // [3, 99, -1, -100]</code></pre>
<p><strong>Cost:</strong> time O(n), space O(1). The easy alternative, copying into a new array at index <code>(i + k) % n</code>, is O(n) space.</p>

<h3 id="ex-13">Example 13 — Spiral Matrix</h3>
<p><strong>The problem:</strong> A <a href="#/topic/dsa-words#w-matrix">matrix</a> is a grid: an array of rows, each row an array. <code>grid[row][col]</code> is one cell. Read every cell in spiral order: along the top, down the right side, back along the bottom, up the left side, then the next ring inward.</p>
<p><strong>The idea:</strong> Keep four "walls": <code>top</code>, <code>bottom</code>, <code>left</code>, <code>right</code>. Walk one side, then move that wall inward. Stop when the walls cross.</p>
<div class="diagram"><pre>grid = [[1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]]

move              read so far                walls after (t, b, l, r)
along top row     1 2 3                      1, 2, 0, 2
down right side   1 2 3 6 9                  1, 2, 0, 1
back along bottom 1 2 3 6 9 8 7              1, 1, 0, 1
up left side      1 2 3 6 9 8 7 4            1, 1, 1, 1
along top row     1 2 3 6 9 8 7 4 5          2, 1, 1, 1  (walls cross)
Answer: [1, 2, 3, 6, 9, 8, 7, 4, 5]</pre></div>
<pre><code class="language-js">function spiralOrder(grid) {
  const result = [];
  if (grid.length === 0) {
    return result;
  }
  let top = 0;
  let bottom = grid.length - 1;
  let left = 0;
  let right = grid[0].length - 1;
  while (top &lt;= bottom &amp;&amp; left &lt;= right) {
    for (let col = left; col &lt;= right; col++) {
      result.push(grid[top][col]); // along the top row, left to right
    }
    top++;
    for (let row = top; row &lt;= bottom; row++) {
      result.push(grid[row][right]); // down the right side
    }
    right--;
    if (top &lt;= bottom) { // a bottom row is still left to read
      for (let col = right; col &gt;= left; col--) {
        result.push(grid[bottom][col]); // back along the bottom, right to left
      }
      bottom--;
    }
    if (left &lt;= right) { // a left column is still left to read
      for (let row = bottom; row &gt;= top; row--) {
        result.push(grid[row][left]); // up the left side
      }
      left++;
    }
  }
  return result;
}
console.log(spiralOrder([[1, 2, 3], [4, 5, 6], [7, 8, 9]])); // [1, 2, 3, 6, 9, 8, 7, 4, 5]
console.log(spiralOrder([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]])); // [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]</code></pre>
<p>The two <code>if</code> checks stop a single leftover row or column from being read twice.</p>
<p><strong>Cost:</strong> time O(m × n) for m rows and n columns: every cell is read once. Space O(1) besides the output.</p>

<h3 id="ex-14">Example 14 — Set Matrix Zeros</h3>
<p><strong>The problem:</strong> If a cell in a grid is 0, set its whole row and whole column to 0. Do it in place.</p>
<p><strong>The idea:</strong> You can't zero things as you find them, because new zeros would trigger more zeros. So first <em>mark</em> which rows and columns to clear, then clear them. To use O(1) extra space, use the grid's own first row and first column as the notepad. Two true/false flags remember whether that first row and column held a 0 of their own.</p>
<div class="diagram"><pre>grid:        after marking:    after clearing:
1  1  1      1  0  1           1  0  1
1  0  1      0  0  1           0  0  0
1  1  1      1  1  1           1  0  1

The 0 at row 1, col 1 writes a mark into row 1's first cell
and col 1's top cell. Then every cell whose row mark or column
mark is 0 becomes 0.</pre></div>
<pre><code class="language-js">function setZeroes(grid) {
  const rowCount = grid.length;
  const colCount = grid[0].length;
  let firstRowHasZero = false; // the notepad row needs its own flag
  let firstColHasZero = false; // and so does the notepad column
  for (let col = 0; col &lt; colCount; col++) {
    if (grid[0][col] === 0) {
      firstRowHasZero = true;
    }
  }
  for (let row = 0; row &lt; rowCount; row++) {
    if (grid[row][0] === 0) {
      firstColHasZero = true;
    }
  }
  // Mark: a 0 inside the grid writes a 0 into its row's first cell and its column's top cell
  for (let row = 1; row &lt; rowCount; row++) {
    for (let col = 1; col &lt; colCount; col++) {
      if (grid[row][col] === 0) {
        grid[row][0] = 0;
        grid[0][col] = 0;
      }
    }
  }
  // Clear: a cell becomes 0 if its row or its column was marked
  for (let row = 1; row &lt; rowCount; row++) {
    for (let col = 1; col &lt; colCount; col++) {
      if (grid[row][0] === 0 || grid[0][col] === 0) {
        grid[row][col] = 0;
      }
    }
  }
  // Finally the notepad row and column themselves
  if (firstRowHasZero) {
    for (let col = 0; col &lt; colCount; col++) {
      grid[0][col] = 0;
    }
  }
  if (firstColHasZero) {
    for (let row = 0; row &lt; rowCount; row++) {
      grid[row][0] = 0;
    }
  }
  return grid;
}
console.log(setZeroes([[1, 1, 1], [1, 0, 1], [1, 1, 1]])); // [[1, 0, 1], [0, 0, 0], [1, 0, 1]]
console.log(setZeroes([[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]])); // [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]]</code></pre>
<p>The notepad row and column are cleared <em>last</em>, so their marks are still readable while the rest is cleared. (The easy version keeps two separate arrays of marked rows and columns: O(m + n) extra space.)</p>
<p><strong>Cost:</strong> time O(m × n). Extra space O(1).</p>

<h3 id="ex-15">Example 15 — Encode and Decode Strings (length-prefixed)</h3>
<p><strong>The problem:</strong> Turn a list of strings into one string (to send it somewhere), and turn it back into the exact same list. The strings may contain any character, including your separator.</p>
<p><strong>The idea:</strong> Joining with a comma fails if a word contains a comma. Instead, write each string's <em>length</em>, then a <code>#</code>, then the string. To decode: read digits up to the <code>#</code>, and that number tells you exactly how many characters to take next. A <code>#</code> inside a word is never mistaken for a separator, because you never search inside the word.</p>
<div class="diagram"><pre>list = ["hello", "wo#rld", ""]
encoded = "5#hello6#wo#rld0#"

decoding: i   result so far              read
          0   []                         "5", then 5 letters: hello
          7   [hello]                    "6", then 6 letters: wo#rld
          15  [hello, wo#rld]            "0", then 0 letters: ""
          17  [hello, wo#rld, ""]        end of string</pre></div>
<pre><code class="language-js">function encode(strings) {
  const pieces = [];
  for (const text of strings) {
    pieces.push(text.length + "#" + text); // "hello" -&gt; "5#hello"
  }
  return pieces.join(""); // join once, not += in a loop
}

function decode(encoded) {
  const result = [];
  let i = 0;
  while (i &lt; encoded.length) {
    let hashIndex = i;
    while (encoded[hashIndex] !== "#") {
      hashIndex++; // find the end of the length digits
    }
    const length = Number(encoded.slice(i, hashIndex));
    const start = hashIndex + 1; // the string starts just after '#'
    result.push(encoded.slice(start, start + length));
    i = start + length; // jump to the next length prefix
  }
  return result;
}
const sent = encode(["hello", "wo#rld", ""]);
console.log(sent); // "5#hello6#wo#rld0#"
console.log(decode(sent)); // ["hello", "wo#rld", ""]</code></pre>
<p><strong>Cost:</strong> both are time O(total characters) and space O(total characters). The length prefix means no special characters ever need escaping.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>
<p>An <a href="#/topic/dsa-words#w-edge-case">edge case</a> is an unusual input at the limits: empty, size 1, all the same, and so on. Each item says what goes wrong, gives a tiny example, and gives the fix.</p>

<h3>1. Empty input</h3>
<p><strong>What goes wrong:</strong> Code that reads <code>arr[0]</code> first, or starts a pointer at <code>arr.length - 1</code>, gets <code>undefined</code> or -1 on an empty input.</p>
<p><strong>Tiny example:</strong> Kadane's starts with <code>numbers[0]</code>. On <code>[]</code> that is <code>undefined</code>, and the function returns <code>undefined</code>.</p>
<p><strong>Fix:</strong> Check for empty input at the top and return the sensible "nothing" value: 0 for a sum, <code>[]</code> for a list, <code>null</code> for "first item".</p>

<h3>2. Single element</h3>
<p><strong>What goes wrong:</strong> One item is trivially sorted, and trivially a palindrome. But loops that read <code>arr[i + 1]</code> or <code>arr[i - 1]</code> can step outside the array.</p>
<p><strong>Tiny example:</strong> In <code>[7]</code>, <code>right = arr.length - 1</code> is 0, the same as <code>left</code>. A <code>while (left &lt; right)</code> loop correctly does nothing. A <code>for (let i = 0; i &lt;= arr.length; i++)</code> loop reads <code>arr[1]</code>, which is <code>undefined</code>.</p>
<p><strong>Fix:</strong> Trace your loop by hand for a one-item input. Make sure no index can go below 0 or reach <code>length</code>.</p>

<h3>3. All same elements</h3>
<p><strong>What goes wrong:</strong> Code that assumes values are different gives wrong or repeated answers.</p>
<p><strong>Tiny example:</strong> Two Sum on <code>[3, 3]</code> with target 6 must return <code>[0, 1]</code>. A version that stores before checking can return <code>[0, 0]</code>. A window on <code>"aaaa"</code> with "no repeats" shrinks to length 1 each step.</p>
<p><strong>Fix:</strong> Always test an all-same input such as <code>[3, 3, 3]</code> or <code>"aaaa"</code>.</p>

<h3>4. Already sorted / reverse sorted</h3>
<p><strong>What goes wrong:</strong> Some algorithms hit their slowest case on sorted input. A simple quicksort that always picks the first item as its pivot (the item it splits around) becomes O(n²) on sorted data.</p>
<p><strong>Tiny example:</strong> On <code>[1, 2, 3, 4, 5]</code> with first-item pivots, each split peels off just one item: 5 + 4 + 3 + 2 + 1 comparisons, which grows like n².</p>
<p><strong>Fix:</strong> Test both <code>[1, 2, 3]</code> and <code>[3, 2, 1]</code>. If you write your own sort, pick a random pivot. JavaScript's built-in sort does not have this problem.</p>

<h3>5. Negatives + positives + zeros</h3>
<p><strong>What goes wrong:</strong> Sum problems behave differently once numbers can be negative. A max-subarray version that starts at 0 returns 0 when every number is negative, but the answer must be a real stretch of at least one item.</p>
<p><strong>Tiny example:</strong> For <code>[-3, -1, -2]</code> the right answer is -1. A Kadane's that starts <code>best = 0</code> wrongly returns 0.</p>
<p><strong>Fix:</strong> Start Kadane's at <code>numbers[0]</code>, as in <a href="#/topic/dsa-arrays-strings#ex-8">Example 8</a>. And remember that a sliding window on sums only works when no number is negative.</p>

<h3>6. Integer overflow</h3>
<p><strong>What goes wrong:</strong> <a href="#/topic/dsa-words#w-overflow">Overflow</a> means a number gets too big for its storage. JavaScript numbers are exact only up to 2<sup>53</sup> − 1 (about 9 million billion, <code>Number.MAX_SAFE_INTEGER</code>). Past that, adding 1 can silently do nothing.</p>
<pre><code class="language-js">const biggestSafe = Number.MAX_SAFE_INTEGER;
console.log(biggestSafe); // 9007199254740991
console.log(biggestSafe + 2 === biggestSafe + 1); // true: precision is lost

// BigInt (numbers ending in n) stays exact at any size
const exact = BigInt(biggestSafe) + 2n;
console.log(exact.toString()); // "9007199254740993"</code></pre>
<p><strong>Fix:</strong> For huge sums (long prefix-sum arrays of big numbers, big products), use <code>BigInt</code>. Or, if the problem says "return the answer modulo 1,000,000,007", take the remainder (<code>%</code>) after every step to keep numbers small.</p>

<h3>7. Off-by-one in two pointers</h3>
<p><strong>What goes wrong:</strong> <code>while (left &lt; right)</code> stops when the pointers meet. <code>while (left &lt;= right)</code> also runs once when they point at the same item. Picking the wrong one skips an item or uses one twice. This is an <a href="#/topic/dsa-words#w-off-by-one">off-by-one</a> mistake.</p>
<p><strong>Tiny example:</strong> Reversing <code>[1, 2, 3]</code>: with <code>&lt;</code> the middle 2 is left alone (correct). Pair-sum with <code>&lt;=</code> could pair the middle item with itself.</p>
<p><strong>Fix:</strong> Ask: "When <code>left === right</code>, is there still work to do on that one item?" Pairs and swaps: no, use <code>&lt;</code>. <a href="#/topic/dsa-words#w-binary-search">Binary search</a> (halving a sorted range to find one item), which checks single items: yes, use <code>&lt;=</code>.</p>

<h3>8. Sliding window with empty constraint</h3>
<p><strong>What goes wrong:</strong> The window starts empty and grows. If the very first item already breaks the rule, code that assumes "the window is never empty" can read outside the array or record a negative length.</p>
<p><strong>Tiny example:</strong> "Longest stretch with sum at most 2" on <code>[5, 1]</code>. Taking in 5 breaks the rule at once; the shrink loop must drop it and leave an empty window (<code>left = 1</code>, <code>right = 0</code>, length 0).</p>
<p><strong>Fix:</strong> Write the shrink loop as <code>while (rule is broken &amp;&amp; left &lt;= right)</code>, and check that the length formula <code>right - left + 1</code> gives 0 for an empty window.</p>

<h3>9. In-place modification while iterating</h3>
<p><strong>What goes wrong:</strong> Removing items from an array while a forward loop walks it shifts the later items left, so the loop skips the item that slid into the current slot.</p>
<p><strong>Tiny example:</strong> See Anti-pattern 3 below: removing every 2 from <code>[2, 2, 3]</code> going forward leaves <code>[2, 3]</code>.</p>
<p><strong>Fix:</strong> Walk backwards when deleting, use the slow/fast write pointer, or build a new array with <code>filter</code>.</p>

<h3>10. String immutability</h3>
<p><strong>What goes wrong:</strong> Strings are sealed (<a href="#/topic/dsa-words#w-immutable">immutable</a>). Assigning to one letter does nothing, with no error outside strict mode.</p>
<pre><code class="language-js">let word = "cat";
word[0] = "b"; // silently ignored
console.log(word); // "cat"

const letters = word.split(""); // unseal: ["c", "a", "t"]
letters[0] = "b";
const changed = letters.join("");
console.log(changed); // "bat"</code></pre>
<p><strong>Fix:</strong> Convert to an array with <code>split("")</code>, edit, then <code>join("")</code>.</p>

<h3>11. Char comparisons</h3>
<p><strong>What goes wrong:</strong> <code>"a" &lt; "b"</code> works, but JavaScript compares characters by their code number, not alphabetically as a person would. All capitals come before all small letters, and digits compare as text.</p>
<pre><code class="language-js">console.log("a" &lt; "b"); // true
console.log("Z" &lt; "a"); // true: 'Z' is code 90, 'a' is code 97
console.log("10" &lt; "9"); // true: compares '1' with '9' first
console.log("c".charCodeAt(0) - "a".charCodeAt(0)); // 2: position in the alphabet
console.log("apple".localeCompare("Banana") &lt; 0); // true: human (dictionary) order</code></pre>
<p><strong>Fix:</strong> Use <code>charCodeAt</code> when you need letter arithmetic (like "slot = code − 97"). Lower-case both sides before comparing. Use <code>localeCompare</code> for human order.</p>

<h3>12. Hash map vs object for keys</h3>
<p><strong>What goes wrong:</strong> A plain object turns every key into a string, so <code>1</code> and <code>"1"</code> become the same key. A <code>Map</code> keeps any key exactly as given.</p>
<pre><code class="language-js">const counts = {};
counts[1] = "number one";
counts["1"] = "string one"; // overwrites: both keys are the string "1"
console.log(Object.keys(counts).length); // 1

const map = new Map();
map.set(1, "number one");
map.set("1", "string one"); // a different key
console.log(map.size); // 2</code></pre>
<p><strong>Fix:</strong> Use a <code>Map</code> for counting and lookups in DSA code. Both a Map and a modern object remember insertion order (objects list integer-like keys first, in number order).</p>

<h3>13. Sorting strings</h3>
<p><strong>What goes wrong:</strong> <code>arr.sort()</code> with no argument compares items as text, in <a href="#/topic/dsa-words#w-lexicographic">lexicographic</a> (dictionary) order. Numbers get sorted wrongly.</p>
<p><strong>Tiny example:</strong> <code>["10", "9"].sort()</code> stays <code>["10", "9"]</code>, because '1' comes before '9'. <code>[10, 9, 2].sort()</code> gives <code>[10, 2, 9]</code>.</p>
<p><strong>Fix:</strong> For numbers, pass a comparator: <code>arr.sort((a, b) =&gt; a - b)</code>. See Anti-pattern 4 below.</p>

<h3>14. Sort stability</h3>
<p><strong>What goes wrong:</strong> A <a href="#/topic/dsa-words#w-stable-sort">stable sort</a> keeps items that tie in their original order. If you sort people by age, two 25-year-olds stay in the order they came in. JavaScript's sort is guaranteed stable only since ES2019; very old engines may shuffle ties.</p>
<pre><code class="language-js">const people = [
  { name: "Asha", age: 25 },
  { name: "Ravi", age: 22 },
  { name: "Neha", age: 25 },
];
people.sort((a, b) =&gt; a.age - b.age);
console.log(people.map(person =&gt; person.name)); // ["Ravi", "Asha", "Neha"]: Asha still before Neha</code></pre>
<p><strong>Fix:</strong> In modern JavaScript you can rely on it. If ties must break a certain way, say so in the comparator (for example, compare names when ages are equal).</p>

<h3>15. Rotation k larger than length</h3>
<p><strong>What goes wrong:</strong> Rotating 5 items by 7 with the three-reverse trick uses <code>k - 1 = 6</code> as an index, which is outside the array.</p>
<p><strong>Tiny example:</strong> Rotating by 7 is the same as rotating by 7 − 5 = 2, because rotating by 5 brings everything back to where it started.</p>
<p><strong>Fix:</strong> Do <code>k = k % n</code> first (remainder after dividing by n), and handle <code>n = 0</code> separately: <code>k % 0</code> is <code>NaN</code>; the reverses happen to do nothing, but an explicit guard makes the intent clear.</p>

<h3>16. Cyclic sort with values out of range</h3>
<p><strong>What goes wrong:</strong> Cyclic sort sends value v to index <code>v - 1</code>. A 0, a negative number, or a value bigger than the array has no such locker. The code reads <code>undefined</code> or loops forever.</p>
<p><strong>Tiny example:</strong> In <code>[3, 0, 1]</code> ("missing number from 0 to n"), the 0 belongs at index -1.</p>
<p><strong>Fix:</strong> Skip values without a home (the <code>homeExists</code> check in Mechanics), shift the range (put value v at index v instead), or use a different method such as a Set or the sum formula.</p>

<h3>17. Two pointers and duplicates in 3-sum</h3>
<p><strong>What goes wrong:</strong> After sorting, equal numbers sit side by side. If you don't skip them, the same triple is found again.</p>
<p><strong>Tiny example:</strong> <code>[-1, -1, 0, 1]</code> without skipping gives <code>[-1, 0, 1]</code> twice: once for each -1.</p>
<p><strong>Fix:</strong> Skip repeats at all three positions: the first number (<code>i</code>), and both <code>left</code> and <code>right</code> after a match. People often remember <code>i</code> and forget the inner two.</p>

<h3>18. Merge intervals — empty or single</h3>
<p><strong>What goes wrong:</strong> Code that starts with <code>[intervals[0]]</code> doesn't crash on an empty list, it quietly returns <code>[undefined]</code> instead of <code>[]</code>, because <code>intervals[0]</code> is <code>undefined</code>.</p>
<p><strong>Tiny example:</strong> <code>mergeIntervals([])</code> must return <code>[]</code>. <code>mergeIntervals([[1, 4]])</code> must return <code>[[1, 4]]</code>.</p>
<p><strong>Fix:</strong> Return <code>[]</code> for empty input up front. A single interval then needs no special case: sort it, copy it, and the loop does nothing.</p>

<h3>19. <code>arr.length</code> in tight loops</h3>
<p><strong>What goes wrong:</strong> Mostly nothing. Old advice said reading <code>arr.length</code> on every round is slow. Modern engines make it practically free.</p>
<pre><code class="language-js">const numbers = [4, 8, 15, 16, 23, 42];
const count = numbers.length; // read once, if you like
let total = 0;
for (let i = 0; i &lt; count; i++) {
  total += numbers[i];
}
console.log(total); // 108</code></pre>
<p><strong>Fix:</strong> Don't worry about it in interviews. The one real danger is the opposite: if the loop <em>changes</em> the array's length, a saved <code>count</code> goes stale.</p>

<h3>20. Spaces / special chars in strings</h3>
<p><strong>What goes wrong:</strong> "Is it a palindrome?" or "are they anagrams?" depends on whether spaces, punctuation and capitals count.</p>
<p><strong>Tiny example:</strong> <code>"A man a plan"</code> fails a plain letter-by-letter check because of the capital A and the spaces.</p>
<p><strong>Fix:</strong> Read the prompt, or ask: "Should I ignore case and non-letters?" Then lower-case and skip (or remove) the other characters, as in <a href="#/topic/dsa-arrays-strings#ex-11">Example 11</a>.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>
<p>An "anti-pattern" is a common way of writing code that looks fine but is slow or wrong.</p>

<h3>Anti-pattern 1 — string concatenation in loop</h3>
<p><strong>What goes wrong:</strong> Each <code>+=</code> may build a brand-new string and copy everything so far. For n pieces that is 1 + 2 + … + n copies: O(n²) in the worst case. (Engines such as V8 often optimise this, but interviewers expect you to know the risk.)</p>
<pre><code class="language-js">const pieces = ["a", "b", "c", "d"];

// Risky: may copy the growing string each time
let slowResult = "";
for (const piece of pieces) {
  slowResult += piece;
}

// Safe: collect, then join once, O(n)
const fastResult = pieces.join("");
console.log(slowResult, fastResult); // "abcd" "abcd"</code></pre>
<p><strong>Fix:</strong> Push pieces into an array and <code>join</code> once at the end.</p>

<h3>Anti-pattern 2 — <code>arr.includes</code> in nested loop</h3>
<p><strong>What goes wrong:</strong> <code>includes</code> checks items one by one, O(m). Inside a loop over n items that is O(n × m).</p>
<pre><code class="language-js">const firstList = [1, 2, 3, 4];
const secondList = [3, 4, 5];

// Slow: O(n x m), includes scans secondList every time
const slowCommon = [];
for (const value of firstList) {
  if (secondList.includes(value)) {
    slowCommon.push(value);
  }
}

// Fast: O(n + m), build a Set once, then each has() is O(1)
const secondSet = new Set(secondList);
const fastCommon = [];
for (const value of firstList) {
  if (secondSet.has(value)) {
    fastCommon.push(value);
  }
}
console.log(slowCommon, fastCommon); // [3, 4] [3, 4]</code></pre>
<p><strong>Fix:</strong> Turn the list you search into a <a href="#/topic/dsa-words#w-hash-set">Set</a> first.</p>

<h3>Anti-pattern 3 — modifying array while iterating</h3>
<p><strong>What goes wrong:</strong> <code>splice</code> removes an item and slides everything after it one place left. A forward loop then steps over the item that slid in.</p>
<pre><code class="language-js">// Buggy: forward loop skips the second 2
const forward = [2, 2, 3];
for (let i = 0; i &lt; forward.length; i++) {
  if (forward[i] === 2) {
    forward.splice(i, 1); // the next 2 slides into slot i, but i++ moves past it
  }
}
console.log(forward); // [2, 3]  (wrong)

// Better: walk backwards, so sliding items were already checked
const backward = [2, 2, 3];
for (let i = backward.length - 1; i &gt;= 0; i--) {
  if (backward[i] === 2) {
    backward.splice(i, 1);
  }
}
console.log(backward); // [3]

// Best: build a new array
const filtered = [2, 2, 3].filter(value =&gt; value !== 2);
console.log(filtered); // [3]</code></pre>
<p><strong>Fix:</strong> Loop backwards, use <code>filter</code>, or use the slow/fast write pointer (O(n) in place). Note: the backwards version is still O(n²) in the worst case, because every <code>splice</code> is O(n).</p>

<h3>Anti-pattern 4 — sorting strings of numbers</h3>
<p><strong>What goes wrong:</strong> <code>sort()</code> with no comparator sorts as text.</p>
<pre><code class="language-js">const asText = ["10", "9", "2"];
asText.sort();
console.log(asText); // ["10", "2", "9"]  (text order)

const asNumbers = ["10", "9", "2"];
asNumbers.sort((a, b) =&gt; a - b); // a - b turns the strings into numbers
console.log(asNumbers); // ["2", "9", "10"]</code></pre>
<p><strong>Fix:</strong> Always pass <code>(a, b) =&gt; a - b</code> for numbers (or numeric strings). Negative result: a goes first; positive: b goes first.</p>

<h3>Anti-pattern 5 — copying array with <code>...arr</code> in loop</h3>
<p><strong>What goes wrong:</strong> <code>[...acc, x]</code> copies the whole array every time. n rounds of copying a growing array is O(n²).</p>
<pre><code class="language-js">const source = [1, 2, 3, 4];

// Slow: O(n squared), each spread copies everything so far
let slowCopy = [];
for (const value of source) {
  slowCopy = [...slowCopy, value];
}

// Fast: push onto one array, O(n)
const fastCopy = [];
for (const value of source) {
  fastCopy.push(value);
}
console.log(slowCopy, fastCopy, [...source]); // three copies of [1, 2, 3, 4]</code></pre>
<p><strong>Fix:</strong> <code>push</code> into one array, or copy once with <code>[...source]</code>.</p>

<h3>Anti-pattern 6 — using <code>indexOf</code> instead of Set/Map</h3>
<p><strong>What goes wrong:</strong> <code>indexOf</code> scans one by one, O(n). Calling it once per item makes the whole thing O(n²).</p>
<p><strong>Tiny example:</strong> Removing duplicates with <code>list.filter((value, i) =&gt; list.indexOf(value) === i)</code> is O(n²). For 100,000 items that is about 10 billion steps.</p>
<p><strong>Fix:</strong> <code>[...new Set(list)]</code> removes duplicates in O(n). For "where did I see it?", keep a Map from value to index.</p>

<h3>Anti-pattern 7 — recursive solution that should be iterative</h3>
<p><strong>What goes wrong:</strong> <a href="#/topic/dsa-words#w-recursion">Recursion</a> (a function calling itself) keeps every unfinished call on the <a href="#/topic/dsa-words#w-call-stack">call stack</a>. Reversing an array by recursion uses O(n) memory for that stack, and on a big input the stack runs out ("Maximum call stack size exceeded").</p>
<p><strong>Tiny example:</strong> A recursive reverse of 1,000,000 items crashes. The two-pointer loop on the same input uses O(1) extra space and finishes.</p>
<p><strong>Fix:</strong> When a loop does the job, prefer the <a href="#/topic/dsa-words#w-iterative">iterative</a> (loop) version.</p>

<h3>Anti-pattern 8 — not handling empty / single-element</h3>
<p><strong>What goes wrong:</strong> Reading <code>arr[0]</code>, <code>grid[0].length</code> or <code>arr[arr.length - 1]</code> on an empty input gives <code>undefined</code> or a crash ("Cannot read properties of undefined").</p>
<p><strong>Tiny example:</strong> <code>spiralOrder([])</code> crashes on <code>grid[0].length</code> without the early return in Example 13.</p>
<p><strong>Fix:</strong> Put the empty check first. Then test with 0 and 1 items, every time.</p>

<h3>Anti-pattern 9 — mutating sort source vs returning new</h3>
<p><strong>What goes wrong:</strong> <code>arr.sort()</code> changes the original array in place (and also returns it). A caller who still needs the original order is surprised.</p>
<pre><code class="language-js">const original = [3, 1, 2];
const sortedCopy = [...original].sort((a, b) =&gt; a - b); // copy first, then sort
console.log(original, sortedCopy); // [3, 1, 2] [1, 2, 3]

const alsoOriginal = [3, 1, 2];
alsoOriginal.sort((a, b) =&gt; a - b); // sorts the original itself
console.log(alsoOriginal); // [1, 2, 3]</code></pre>
<p><strong>Fix:</strong> Copy first with <code>[...arr]</code>, or use <code>arr.toSorted(...)</code> in modern JavaScript (it returns a new array).</p>

<h3>Anti-pattern 10 — using string as key for object pairs</h3>
<p><strong>What goes wrong:</strong> Using an array like <code>[1, 2]</code> as a key. A plain object turns it into the text <code>"1,2"</code>, so different keys can clash. A Map compares arrays by identity, so a new <code>[1, 2]</code> never finds the old one.</p>
<pre><code class="language-js">const objectKeys = {};
objectKeys[[1, 2]] = "pair"; // the key becomes the string "1,2"
console.log(objectKeys["1,2"]); // "pair": a clash with a real "1,2" string key

const mapKeys = new Map();
mapKeys.set([1, 2], "pair");
console.log(mapKeys.get([1, 2])); // undefined: a different [1, 2] array

// Fix: build one clear string key yourself
function pairKey(row, col) {
  return row + "|" + col; // "1|2"; the separator stops 1,23 and 12,3 from clashing
}
const visited = new Set();
visited.add(pairKey(1, 2));
console.log(visited.has(pairKey(1, 2))); // true</code></pre>
<p><strong>Fix:</strong> Make a string key with a separator, or use a Map of Maps (row → Map of columns).</p>

<h3>Anti-pattern 11 — hard-coding charset size</h3>
<p><strong>What goes wrong:</strong> An array of 26 counts assumes only lowercase a–z. A capital letter, digit or emoji gives a slot like -32 or 9000, and the count is silently wrong.</p>
<p><strong>Tiny example:</strong> <code>"A".charCodeAt(0) - 97</code> is -32. Writing to slot -32 of an array adds an odd property instead of counting.</p>
<p><strong>Fix:</strong> Say the assumption out loud ("I'll assume lowercase a–z"). If it might not hold, count with a Map.</p>

<h3>Anti-pattern 12 — over-using regex</h3>
<p><strong>What goes wrong:</strong> A regex (a text pattern like <code>/[a-z]/</code>) for a simple job is harder to read and often slower. Clever ones are easy to get wrong.</p>
<pre><code class="language-js">const word = "stressed";
const reversed = word.split("").reverse().join(""); // clear: split, reverse, join
console.log(reversed); // "desserts"</code></pre>
<p><strong>Fix:</strong> Use plain string and array methods when they do the job. Keep regex for real pattern matching, like "keep only letters and digits".</p>

<h3>Anti-pattern 13 — not skipping duplicates in 3-sum</h3>
<p><strong>What goes wrong:</strong> The output has the same triple more than once, for example <code>[-1, 0, 1]</code> twice.</p>
<p><strong>Tiny example:</strong> On <code>[-1, -1, 0, 1]</code>, without the skip at <code>i</code>, both -1s start a search and both find <code>[-1, 0, 1]</code>.</p>
<p><strong>Fix:</strong> Skip <code>sorted[i] === sorted[i - 1]</code> for the first number, and after each match move <code>left</code> and <code>right</code> past their repeats. Full code in Mechanics, "Three sum".</p>

<h3>Anti-pattern 14 — Math.floor on negative numbers</h3>
<p><strong>What goes wrong:</strong> <code>Math.floor</code> rounds <em>down</em>, toward minus infinity, not toward zero. On negative numbers that surprises people.</p>
<pre><code class="language-js">console.log(Math.floor(-1 / 2)); // -1, not 0
console.log(Math.trunc(-1 / 2)); // -0: trunc just drops the fraction (toward zero)
const left = 4;
const right = 9;
const middle = left + Math.floor((right - left) / 2); // safe middle index
console.log(middle); // 6</code></pre>
<p><strong>Fix:</strong> For "drop the fraction", use <code>Math.trunc</code>. For a middle index, use <code>left + Math.floor((right - left) / 2)</code>. You may see <code>(a + b) &gt;&gt; 1</code> in other people's code; it is a bit trick (see <a href="#/topic/dsa-bit">Bit Manipulation</a>) that only works for numbers below about 2 billion.</p>

<h3>Anti-pattern 15 — re-declaring helpers in tight loops</h3>
<p><strong>What goes wrong:</strong> Defining a function inside a loop creates a new function object every round. It is usually a small cost, but it is wasted work and makes the loop harder to read.</p>
<pre><code class="language-js">const values = [1, 2, 3];

// Wasteful: a new helper function every round
const slowDoubled = [];
for (let i = 0; i &lt; values.length; i++) {
  const double = (x) =&gt; x * 2;
  slowDoubled.push(double(values[i]));
}

// Better: define it once, outside the loop
const double = (x) =&gt; x * 2;
const fastDoubled = [];
for (let i = 0; i &lt; values.length; i++) {
  fastDoubled.push(double(values[i]));
}
console.log(slowDoubled, fastDoubled); // [2, 4, 6] [2, 4, 6]</code></pre>
<p><strong>Fix:</strong> Move helpers out of the loop (hoist them).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<p>Each answer works on its own, so you can drill them one at a time. Where code is needed, the full code is repeated here.</p>

<div class="qa-block">
  <div class="qa-question">Q1. Two Sum — best approach?</div>
  <div class="qa-answer">
    <p><strong>Unsorted input: a hash map, one pass.</strong> For each number, the complement is <code>target - number</code>. If the complement is already in the Map, return both indexes. Otherwise store this number and its index. O(n) time, O(n) space.</p>
<pre><code class="language-js">function twoSum(numbers, target) {
  const indexOfNumber = new Map(); // number -&gt; index where we saw it
  for (let i = 0; i &lt; numbers.length; i++) {
    const complement = target - numbers[i];
    if (indexOfNumber.has(complement)) {
      const otherIndex = indexOfNumber.get(complement);
      return [otherIndex, i];
    }
    indexOfNumber.set(numbers[i], i); // check first, then store: a number can't pair with itself
  }
  return [];
}
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]</code></pre>
    <p><strong>Sorted input: two pointers from both ends.</strong> Too big: move <code>right</code> in. Too small: move <code>left</code> in. O(n) time, O(1) space.</p>
<pre><code class="language-js">function twoSumSorted(sortedNumbers, target) {
  let left = 0;
  let right = sortedNumbers.length - 1;
  while (left &lt; right) {
    const pairSum = sortedNumbers[left] + sortedNumbers[right];
    if (pairSum === target) {
      return [left, right];
    }
    if (pairSum &lt; target) {
      left++; // need a bigger sum
    } else {
      right--; // need a smaller sum
    }
  }
  return [-1, -1];
}
console.log(twoSumSorted([1, 3, 4, 6, 8, 11], 10)); // [2, 3]</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. When use sliding window?</div>
  <div class="qa-answer">
    <p>When the question asks about a <em>side-by-side</em> stretch (a subarray or substring) that follows some rule: max sum of k in a row, longest substring with no repeats, smallest subarray with sum at least a target, and so on.</p>
    <p>The window is the stretch from <code>left</code> to <code>right</code>. Move <code>right</code> forward to take in an item; when the rule breaks, move <code>left</code> forward until it holds again. Both only go forward, so it is O(n). Example, the longest stretch with no repeated letter:</p>
<pre><code class="language-js">function longestUnique(text) {
  const inWindow = new Set();
  let left = 0;
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    while (inWindow.has(text[right])) { // rule broken: shrink from the left
      inWindow.delete(text[left]);
      left++;
    }
    inWindow.add(text[right]);
    bestLength = Math.max(bestLength, right - left + 1);
  }
  return bestLength;
}
console.log(longestUnique("abcabcbb")); // 3</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. When use two pointers?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>A sorted array</strong>, walking in from both ends: pair that adds to X, Container With Most Water.</li>
      <li><strong>Palindrome checks</strong>: compare the two ends, step inward.</li>
      <li><strong>Same direction at different speeds</strong>: removing duplicates in place, moving zeros, and finding a loop in a linked list (fast and slow pointers).</li>
      <li><strong>Splitting into groups</strong> around a chosen value (a "pivot"), for example all small numbers left and all big ones right. The three-group version is the <a href="#/topic/dsa-words#w-dutch-national-flag">Dutch national flag</a> problem.</li>
    </ul>
    <p>The hint in the question: "sorted", "in place", "O(1) extra space", or "pair".</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Implement reverse in place.</div>
  <div class="qa-answer">
    <p>Two pointers at the ends; swap, step inward, stop when they meet.</p>
<pre><code class="language-js">function reverse(items) {
  let left = 0;
  let right = items.length - 1;
  while (left &lt; right) {
    const temp = items[left]; // hold it so it isn't overwritten
    items[left] = items[right];
    items[right] = temp;
    left++;
    right--;
  }
  return items;
}
console.log(reverse([1, 2, 3, 4])); // [4, 3, 2, 1]
console.log(reverse([])); // []</code></pre>
    <p>O(n) time (n/2 swaps), O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Rotate array by k positions.</div>
  <div class="qa-answer">
    <p>The three-reverse trick: reverse everything, reverse the first k, reverse the rest. Do <code>k % n</code> first.</p>
<pre><code class="language-js">function reverseRange(items, start, end) {
  let left = start;
  let right = end;
  while (left &lt; right) {
    const temp = items[left];
    items[left] = items[right];
    items[right] = temp;
    left++;
    right--;
  }
}

function rotate(items, k) {
  const n = items.length;
  if (n === 0) {
    return items;
  }
  const steps = k % n; // rotating by n is a full circle
  reverseRange(items, 0, n - 1);
  reverseRange(items, 0, steps - 1);
  reverseRange(items, steps, n - 1);
  return items;
}
console.log(rotate([1, 2, 3, 4, 5, 6, 7], 3)); // [5, 6, 7, 1, 2, 3, 4]</code></pre>
    <p>O(n) time, O(1) space. Alternatives: copy into a new array at index <code>(i + k) % n</code> (O(n) space), or rotate one step at a time, k times (O(n × k) time: too slow).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Maximum subarray sum (Kadane's).</div>
  <div class="qa-answer">
    <p>At each number, either carry on the current stretch or start fresh from this number, whichever is bigger. Track the best seen anywhere.</p>
<pre><code class="language-js">function maxSubArray(numbers) {
  let bestEndingHere = numbers[0];
  let bestOverall = numbers[0];
  for (let i = 1; i &lt; numbers.length; i++) {
    const carryOn = bestEndingHere + numbers[i];
    const startFresh = numbers[i];
    bestEndingHere = Math.max(carryOn, startFresh);
    bestOverall = Math.max(bestOverall, bestEndingHere);
  }
  return bestOverall;
}
console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 6
console.log(maxSubArray([-3, -1, -2])); // -1</code></pre>
    <p>O(n) time, O(1) space. Starting at <code>numbers[0]</code> (not 0) makes all-negative arrays correct.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Longest substring without repeating characters.</div>
  <div class="qa-answer">
    <p>A sliding window with a Map of where each letter was last seen. If the new letter was last seen inside the window, jump <code>left</code> just past it.</p>
<pre><code class="language-js">function lengthOfLongestSubstring(text) {
  const lastSeenAt = new Map(); // letter -&gt; last index seen
  let left = 0;
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const letter = text[right];
    if (lastSeenAt.has(letter)) {
      const previousIndex = lastSeenAt.get(letter);
      if (previousIndex &gt;= left) {
        left = previousIndex + 1; // only jump if the old copy is inside the window
      }
    }
    lastSeenAt.set(letter, right);
    bestLength = Math.max(bestLength, right - left + 1);
  }
  return bestLength;
}
console.log(lengthOfLongestSubstring("abcabcbb")); // 3
console.log(lengthOfLongestSubstring("abba")); // 2</code></pre>
    <p>O(n) time. O(min(n, alphabet size)) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Three Sum.</div>
  <div class="qa-answer">
    <p>Sort; then for each first number, run two pointers on the rest. Skip repeated values so no triple appears twice.</p>
<pre><code class="language-js">function threeSum(numbers) {
  const sorted = [...numbers].sort((a, b) =&gt; a - b);
  const triples = [];
  for (let i = 0; i &lt; sorted.length - 2; i++) {
    if (i &gt; 0 &amp;&amp; sorted[i] === sorted[i - 1]) {
      continue; // same first number as before
    }
    let left = i + 1;
    let right = sorted.length - 1;
    while (left &lt; right) {
      const total = sorted[i] + sorted[left] + sorted[right];
      if (total === 0) {
        triples.push([sorted[i], sorted[left], sorted[right]]);
        while (left &lt; right &amp;&amp; sorted[left] === sorted[left + 1]) {
          left++; // skip repeats of the middle number
        }
        while (left &lt; right &amp;&amp; sorted[right] === sorted[right - 1]) {
          right--; // skip repeats of the last number
        }
        left++;
        right--;
      } else if (total &lt; 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return triples;
}
console.log(threeSum([-1, 0, 1, 2, -1, -4])); // [[-1, -1, 2], [-1, 0, 1]]</code></pre>
    <p>O(n²) time. O(1) extra space apart from the output and the sort.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Best Time to Buy and Sell Stock.</div>
  <div class="qa-answer">
    <p>Track the cheapest price so far and the best profit if you sold today.</p>
<pre><code class="language-js">function maxProfit(prices) {
  let cheapestSoFar = Infinity;
  let bestProfit = 0;
  for (const price of prices) {
    cheapestSoFar = Math.min(cheapestSoFar, price);
    const profitToday = price - cheapestSoFar;
    bestProfit = Math.max(bestProfit, profitToday);
  }
  return bestProfit;
}
console.log(maxProfit([7, 1, 5, 3, 6, 4])); // 5</code></pre>
    <p>O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Container With Most Water.</div>
  <div class="qa-answer">
    <p>Two pointers from the ends. Always move the <em>shorter</em> wall inward: it is the limit, and moving the taller one can only shrink the width without raising that limit.</p>
<pre><code class="language-js">function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let bestWater = 0;
  while (left &lt; right) {
    const shorterWall = Math.min(height[left], height[right]);
    const water = shorterWall * (right - left);
    bestWater = Math.max(bestWater, water);
    if (height[left] &lt; height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return bestWater;
}
console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49</code></pre>
    <p>O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Product of Array Except Self (no division).</div>
  <div class="qa-answer">
    <p>Two passes. Left to right, store the product of everything to the left. Right to left, multiply in the product of everything to the right.</p>
<pre><code class="language-js">function productExceptSelf(numbers) {
  const result = new Array(numbers.length).fill(1);
  let leftProduct = 1;
  for (let i = 0; i &lt; numbers.length; i++) {
    result[i] = leftProduct; // everything left of i
    leftProduct *= numbers[i];
  }
  let rightProduct = 1;
  for (let i = numbers.length - 1; i &gt;= 0; i--) {
    result[i] *= rightProduct; // times everything right of i
    rightProduct *= numbers[i];
  }
  return result;
}
console.log(productExceptSelf([1, 2, 3, 4])); // [24, 12, 8, 6]</code></pre>
    <p>O(n) time, O(1) extra space (the output array is not counted). No division, so a 0 in the input causes no trouble.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Move zeros to end.</div>
  <div class="qa-answer">
    <p>Two pointers in the same direction: <code>fast</code> reads, <code>slow</code> marks where the next non-zero goes.</p>
<pre><code class="language-js">function moveZeroes(numbers) {
  let slow = 0;
  for (let fast = 0; fast &lt; numbers.length; fast++) {
    if (numbers[fast] !== 0) {
      const temp = numbers[slow];
      numbers[slow] = numbers[fast];
      numbers[fast] = temp;
      slow++;
    }
  }
  return numbers;
}
console.log(moveZeroes([0, 1, 0, 3, 12])); // [1, 3, 12, 0, 0]</code></pre>
    <p>O(n) time, O(1) space. The non-zero numbers keep their order.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Anagram check.</div>
  <div class="qa-answer">
    <p>For lowercase a–z: one array of 26 counters. Add for the first word, subtract for the second, then check every counter is 0.</p>
<pre><code class="language-js">function isAnagram(first, second) {
  if (first.length !== second.length) {
    return false;
  }
  const counts = new Array(26).fill(0);
  for (let i = 0; i &lt; first.length; i++) {
    counts[first.charCodeAt(i) - 97]++; // 'a' is code 97
    counts[second.charCodeAt(i) - 97]--;
  }
  for (let slot = 0; slot &lt; 26; slot++) {
    if (counts[slot] !== 0) {
      return false;
    }
  }
  return true;
}
console.log(isAnagram("listen", "silent")); // true</code></pre>
    <p>O(n) time, O(1) space (always 26 counters). For any characters (capitals, accents, emoji), count with a Map instead:</p>
<pre><code class="language-js">function isAnagramAnyCharacters(first, second) {
  if (first.length !== second.length) {
    return false;
  }
  const counts = new Map();
  for (const character of first) {
    let current = 0; // a character we haven't seen counts as 0
    if (counts.has(character)) {
      current = counts.get(character);
    }
    counts.set(character, current + 1);
  }
  for (const character of second) {
    if (!counts.has(character)) {
      return false; // second has a character first doesn't
    }
    const remaining = counts.get(character) - 1;
    if (remaining &lt; 0) {
      return false;
    }
    counts.set(character, remaining);
  }
  return true; // same length and nothing went below 0, so every count is 0
}
console.log(isAnagramAnyCharacters("Listen", "silent")); // false (capital L is not l)
console.log(isAnagramAnyCharacters("café", "éfac")); // true</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Merge Intervals.</div>
  <div class="qa-answer">
    <p>Sort by start time. Then walk once: if the next interval starts before the last merged one ends, stretch the last one; otherwise start a new one.</p>
<pre><code class="language-js">function mergeIntervals(intervals) {
  if (intervals.length === 0) {
    return [];
  }
  const sorted = [...intervals].sort((a, b) =&gt; a[0] - b[0]);
  const merged = [[sorted[0][0], sorted[0][1]]];
  for (let i = 1; i &lt; sorted.length; i++) {
    const start = sorted[i][0];
    const end = sorted[i][1];
    const last = merged[merged.length - 1];
    if (start &lt;= last[1]) {
      last[1] = Math.max(last[1], end); // overlap: stretch
    } else {
      merged.push([start, end]); // gap: new interval
    }
  }
  return merged;
}
console.log(mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]])); // [[1, 6], [8, 10], [15, 18]]</code></pre>
    <p>O(n log n) time because of the sort; O(n) space for the output.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What's your debugging checklist for array problems?</div>
  <div class="qa-answer">
    <ol>
      <li>Empty input.</li>
      <li>A single item.</li>
      <li>All items the same.</li>
      <li>Already sorted, and sorted the other way.</li>
      <li>Negatives, positives and zeros mixed (if allowed).</li>
      <li>Are repeated values allowed?</li>
      <li>Very large input: numbers too big (overflow) or O(n²) too slow?</li>
      <li>Off-by-one: where do <code>left</code>/<code>right</code> start, and is the loop <code>&lt;</code> or <code>&lt;=</code>?</li>
      <li>Skipping repeats in pointer solutions that need unique answers.</li>
      <li>Strings are sealed: am I trying to change a letter in place?</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You name the pattern (two pointers, sliding window, prefix sums, hash map) before coding.</li>
    <li>You state both time and space cost.</li>
    <li>You deal with edge cases up front.</li>
    <li>You work in place when you can.</li>
    <li>You use a Set or Map for lookups, not <code>arr.includes</code> in a loop.</li>
    <li>You skip repeats when the problem wants unique groups.</li>
    <li>You turn a string into an array of letters before editing it.</li>
    <li>You sort first when it makes the problem simpler.</li>
    <li>You know Kadane's for the maximum subarray.</li>
    <li>You rotate with three reverses.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. Why is building a string with += in a loop O(n²) in JavaScript?</div>
  <div class="qa-answer">
    <p>Strings are <a href="#/topic/dsa-words#w-immutable">immutable</a> (sealed): <code>+=</code> can't add to the old string, so it may build a new one and copy everything so far. Building a string of n pieces then copies 1 + 2 + … + n characters. That can add up to O(n²) (about n²/2 character copies when each piece is one character).</p>
    <p>Engines such as V8 often optimise this behind the scenes, but nothing guarantees it. The safe answer: collect the pieces in an array and <code>join</code> once, which is O(n). To edit letters in place, <code>split("")</code> first.</p>
<pre><code class="language-js">function buildLine(words) {
  const pieces = [];
  for (const word of words) {
    pieces.push(word.toUpperCase()); // push is O(1)
  }
  return pieces.join(" "); // one O(n) join at the end
}
console.log(buildLine(["arrays", "and", "strings"])); // "ARRAYS AND STRINGS"</code></pre>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q17. What does access, insert and delete cost on a JavaScript array?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Reading <code>arr[i]</code>:</strong> O(1). You walk straight to locker i.</li>
      <li><strong>Adding or removing at the end</strong> (<code>push</code>, <code>pop</code>): O(1) <a href="#/topic/dsa-words#w-amortized">amortized</a>. Now and then the array grows its storage, but averaged over many pushes each one is cheap.</li>
      <li><strong>Adding or removing at the front or middle</strong> (<code>shift</code>, <code>unshift</code>, <code>splice</code>): O(n), because every later item shifts one locker.</li>
      <li><strong>Searching</strong> (<code>includes</code>, <code>indexOf</code>): O(n), checking one by one. That is why it should not sit inside a loop. A Set answers "is it there?" in O(1) on average.</li>
    </ul>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q18. When does a prefix-sum array help, and how does it work?</div>
  <div class="qa-answer">
    <p>When you must answer many "sum from index left to index right" questions on an array that doesn't change. Adding up each range directly is O(n) per question, so q questions cost O(n × q). With a prefix array you pay O(n) once, and every question is one subtraction, O(1).</p>
    <p>Build it with a leading 0: <code>prefix[0] = 0</code> and <code>prefix[i + 1] = prefix[i] + numbers[i]</code>. Then the sum of <code>left..right</code> (both included) is <code>prefix[right + 1] - prefix[left]</code>, like a bank balance at the end of the range minus the balance just before it.</p>
<pre><code class="language-js">function buildPrefix(numbers) {
  const prefix = [0];
  for (let i = 0; i &lt; numbers.length; i++) {
    prefix.push(prefix[i] + numbers[i]); // running total so far
  }
  return prefix;
}

function rangeSum(prefix, left, right) {
  return prefix[right + 1] - prefix[left];
}

const prefix = buildPrefix([3, 1, 4, 1, 5, 9, 2, 6]);
console.log(rangeSum(prefix, 2, 5)); // 19
console.log(rangeSum(prefix, 0, 7)); // 31  (the whole array)</code></pre>
  </div>
</div>
` },

  ]
});
