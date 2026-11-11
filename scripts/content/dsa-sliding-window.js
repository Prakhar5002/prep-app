// Sliding Window, rewritten in plain English (Nov 2026). Main picture: a camera viewfinder
// panning along a row of items. Its left edge is the variable "left", its right edge is "right".
// DSA words link to the glossary at #/topic/dsa-words#w-<slug>.
window.PREP_SITE.registerTopic({
  id: "dsa-sliding-window",
  module: "DSA",
  title: "Sliding Window",
  estimatedReadTime: "35 min",
  tags: ["dsa","sliding-window","array","string","pattern"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">To find the best run of items that sit <strong>next to each other</strong>, slide a frame along the row: move its <code>right</code> edge to take in a new item, move its <code>left</code> edge to drop old items when a rule breaks, and keep the best answer as you go. Every item gets in once and out once, so it is <strong>one pass</strong>, <a href="#/topic/dsa-words#w-o-n">O(n)</a>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>When to use it:</strong> the question wants the best <a href="#/topic/dsa-words#w-contiguous">contiguous</a> stretch (items side by side, no gaps), called a <a href="#/topic/dsa-words#w-subarray">subarray</a> or <a href="#/topic/dsa-words#w-substring">substring</a>, that follows some rule. The stretch you are looking at right now is the <a href="#/topic/dsa-words#w-window">window</a>. Two <a href="#/topic/dsa-words#w-pointer">pointers</a> (plain number variables holding a position), <code>left</code> and <code>right</code>, mark its two ends.</li>
    <li><strong>Two kinds:</strong> a <em>fixed</em> window always holds exactly k items and just slides. A <em>variable</em> window stretches and shrinks to keep a rule true.</li>
    <li><strong>It is O(n), not <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a></strong>, even with a <code>while</code> inside the <code>for</code>. O(n) means "twice the items, twice the work". <code>left</code> and <code>right</code> only ever move forward, so all the shrinking together adds at most n steps. Averaged over the whole run, each step is cheap: this is called <a href="#/topic/dsa-words#w-amortized">amortized</a> O(n).</li>
    <li><strong>Fixed window: adjust, don't re-add.</strong> <code>newSum = oldSum - leaving + entering</code>. Adding up the whole window again at every step is the slow O(n × k) trap, which is O(n²) when k is large.</li>
    <li><strong>"At most k" is the easy shape:</strong> move <code>right</code>, shrink from <code>left</code> while the rule is broken, then record <code>right - left + 1</code>.</li>
    <li><strong>"Exactly k" = atMost(k) − atMost(k − 1).</strong> This works for <em>counting</em> how many subarrays there are. It does NOT work for longest or shortest.</li>
    <li><strong>Where you record matters.</strong> Longest: record <em>after</em> shrinking. Shortest: record <em>inside</em> the shrink loop, while the window still passes, then move <code>left</code>.</li>
    <li><strong>Window length is <code>right - left + 1</code></strong>, because both ends count. Forgetting the <code>+ 1</code> is the classic <a href="#/topic/dsa-words#w-off-by-one">off-by-one</a> mistake.</li>
    <li><strong>Counting:</strong> the number of good subarrays that <em>end</em> at <code>right</code> is <code>right - left + 1</code>. Add it to a running total.</li>
    <li><strong>Count kinds correctly:</strong> in a <a href="#/topic/dsa-words#w-frequency-map">frequency map</a> (a Map from value to how many times it is in the window), delete a key when its count drops to 0. Otherwise <code>map.size</code> counts kinds that already left.</li>
    <li><strong>Where to keep counts:</strong> only the 26 letters a–z → a plain array of 26 numbers. Anything else → a Map. A missing key means 0: read it into a variable first, then add 1.</li>
    <li><strong>Biggest (or smallest) in every window → <a href="#/topic/dsa-words#w-monotonic-deque">monotonic deque</a>:</strong> a waiting line of <a href="#/topic/dsa-words#w-index">indexes</a> (positions) whose values only go down. The front is the window's biggest. Drop the front once it slides out of the window.</li>
    <li><strong>It breaks on negative numbers</strong> (dropping an item no longer always lowers the sum) and on problems where the items need not be side by side. Use a <a href="#/topic/dsa-words#w-prefix-sum">prefix sum</a> (running totals) with a <a href="#/topic/dsa-words#w-hash-map">hash map</a> (a Map), <a href="#/topic/dsa-words#w-kadane">Kadane's algorithm</a> (best running sum), <a href="#/topic/dsa-words#w-dp">DP</a> (reuse answers to smaller questions) or a <a href="#/topic/dsa-words#w-heap">heap</a> (always hands you the smallest or biggest) instead.</li>
    <li><strong>"Two numbers in a <a href="#/topic/dsa-words#w-sorted">sorted</a> array that add to X" is <a href="#/topic/dsa-words#w-two-pointers">two pointers</a> walking in from both ends</strong>, not a sliding window. A window is for side-by-side stretches only.</li>
  </ul>
  <h4>Complexity &amp; when to reach for it</h4>
  <ul>
    <li><strong>Time:</strong> O(n). Each item enters the window once and leaves at most once.</li>
    <li><strong>Space:</strong> <a href="#/topic/dsa-words#w-o-1">O(1)</a> (a few fixed variables) for a running sum or count. O(k), or O(alphabet size, such as 26), when the window keeps a Map of different values.</li>
    <li><strong>The signal:</strong> "contiguous / in a row / consecutive" + "longest / shortest / biggest sum / how many" + a rule that only gets harder to meet as the window grows ("at most k different", "sum at least target", "no repeats") → variable window. "Every window of size k" or "an <a href="#/topic/dsa-words#w-anagram">anagram</a> (same letters, new order) of a k-letter word" → fixed window. If items can be skipped, or negative numbers break that "grows → harder to meet" behaviour, pick a different pattern.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Recording in the wrong place, and the <code>right - left + 1</code> off-by-one.</strong> Window length is <code>right - left + 1</code> because both ends count. For the <em>longest</em> window, record after shrinking. For the <em>shortest</em>, record inside the shrink loop while the window still passes. The bigger trap is using a window where it does not work. It breaks on <strong>negative numbers</strong>, because dropping an item can make the sum go <em>up</em>. It also breaks when items may be skipped. Then switch to prefix sums, Kadane's or DP. And delete a Map key when its count hits 0, or <code>map.size</code> will count too many kinds.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I'll keep a window from <code>left</code> to <code>right</code>. I move <code>right</code> forward to take in each item, and whenever the rule breaks I move <code>left</code> forward until it holds again, recording the best window as I go."</div>
  <div class="revision-say">"It's O(n) even with the inner while, because <code>left</code> never moves backwards. Over the whole run it moves at most n times, so the total work is at most about 2n steps."</div>
  <div class="revision-say">"For 'exactly k' I count atMost(k) minus atMost(k − 1). And if the array has negative numbers I switch to prefix sums, because then shrinking the window doesn't always lower the sum."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The pattern: a camera viewfinder sliding along a row</h3>
<p>Picture a class photo with 30 students standing in one long row. You pan your phone camera along it. The screen only shows a few faces at a time. You never re-shoot the whole row. You just slide the frame: one face comes in on the right, one face leaves on the left.</p>
<p>That frame is the <a href="#/topic/dsa-words#w-window">window</a>. In code, the row is an <a href="#/topic/dsa-words#w-array">array</a> (or a string), and the frame's two edges are two plain number variables:</p>
<ul>
  <li><code>left</code> is the <a href="#/topic/dsa-words#w-index">index</a> (position number) of the first item inside the frame.</li>
  <li><code>right</code> is the index of the last item inside the frame.</li>
</ul>
<p>A variable that holds a position like this is called a <a href="#/topic/dsa-words#w-pointer">pointer</a>. "Sliding the window" just means adding 1 to <code>left</code> and <code>right</code>.</p>
<p>Sometimes you zoom instead. You push the right edge out to take in more (the window <em>stretches</em>), or you pull the left edge in (it <em>shrinks</em>). Either way, <strong>both edges only ever move to the right, never back</strong>. Hold on to that one fact. It is the whole reason this pattern is fast.</p>
<p>The items inside the frame are always side by side, with no gaps. DSA calls that <a href="#/topic/dsa-words#w-contiguous">contiguous</a>. A side-by-side piece of an array is a <a href="#/topic/dsa-words#w-subarray">subarray</a>; of a string, a <a href="#/topic/dsa-words#w-substring">substring</a>. So the window is always a subarray or substring.</p>

<h3>A real problem: the best 3-day sales streak</h3>
<p>Your shop's daily sales for five days, in thousands of rupees, are <code>[2, 1, 5, 1, 3]</code>. Your manager asks: <em>"Which 3 days in a row made the most money?"</em></p>
<p>There are three runs of 3 days: 2 + 1 + 5 = 8, then 1 + 5 + 1 = 7, then 5 + 1 + 3 = 9. The answer is <strong>9</strong> (the last three days).</p>

<h3>The slow way, counted in steps</h3>
<p>The first idea most people write: for every possible starting day, add up the next 3 days.</p>
<pre><code class="language-js">function bestStreakSlow(sales, days) {
  let bestTotal = -Infinity; // "nothing yet": any real total is bigger
  for (let start = 0; start + days &lt;= sales.length; start++) {
    let total = 0;
    for (let i = start; i &lt; start + days; i++) {
      total += sales[i]; // re-add every day of this stretch from scratch
    }
    bestTotal = Math.max(bestTotal, total);
  }
  return bestTotal;
}
console.log(bestStreakSlow([2, 1, 5, 1, 3], 3)); // 9</code></pre>
<p>It is correct, but count the work. There are about n starting days (n = number of items), and each one adds up k days (k = the window size). That is about <strong>n × k additions</strong>.</p>
<ul>
  <li>5 days, k = 3: 3 starts × 3 additions = 9 steps. No problem.</li>
  <li>100,000 days of data, k = 1,000: about 99,000 × 1,000 ≈ <strong>100 million additions</strong>.</li>
</ul>
<p>And most of that work is repeated. Look at two neighbouring stretches:</p>
<div class="diagram"><pre>sales:      [2, 1, 5, 1, 3]

stretch 1:  [2, 1, 5]
stretch 2:     [1, 5, 1]      1 and 5 were already added a moment ago
stretch 3:        [5, 1, 3]   5 and 1 again</pre></div>
<p>Neighbouring stretches share all but one item at each end. The slow way throws that away and adds them all up again.</p>

<h3>What the window fixes</h3>
<p>Keep the total of the stretch you are looking at in one variable, <code>windowSum</code>. When the frame slides one step, exactly one day leaves on the left and one day enters on the right. So:</p>
<div class="diagram"><pre>new windowSum = old windowSum - (day leaving) + (day entering)

[2, 1, 5]  = 8
   [1, 5, 1]  = 8 - 2 + 1 = 7
      [5, 1, 3]  = 7 - 1 + 3 = 9</pre></div>
<p>Two small steps per slide, instead of k. For 100,000 days that is about 200,000 steps instead of 100 million. That is the whole trick: <strong>update the window, don't rebuild it.</strong></p>
<p>The same idea works when the size is not given. Example: <em>"What is the longest stretch of your playlist with no song repeated?"</em> The slow way checks every possible stretch. A list of n songs has n × (n + 1) / 2 stretches: for 10,000 songs that is about 50 million, and each one still needs checking for repeats. The window way walks once: keep stretching the right edge while the songs are new; when a song repeats, pull the left edge in just past its earlier copy.</p>

<h3>Why O(n): each item gets in once and out once</h3>
<p><a href="#/topic/dsa-words#w-big-o">Big-O</a> describes how the work grows as the input grows. <a href="#/topic/dsa-words#w-o-n">O(n)</a> means the work grows in step with the input: twice the items, twice the work. <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a> means a loop inside a loop: twice the items, four times the work.</p>
<p>A variable window has a <code>while</code> loop (shrink) inside a <code>for</code> loop (stretch). That looks like O(n²). It is not:</p>
<ul>
  <li><code>right</code> moves forward n times in total: once per round of the <code>for</code> loop.</li>
  <li><code>left</code> also only moves forward, and it can never pass the end of the array. So over the <em>whole run</em>, the <code>while</code> loop can move it at most n times in total. In one round it might move 5 times; in the next round, 0 times.</li>
  <li>Total moves: at most n + n = 2n. Each item is added once (when <code>right</code> reaches it) and removed at most once (when <code>left</code> passes it).</li>
</ul>
<p>2n is still "twice the items, twice the work", so it is O(n). This way of counting the total over the whole run, instead of the worst single round, is called <a href="#/topic/dsa-words#w-amortized">amortized</a> analysis: one round can be expensive, but the rounds average out to cheap.</p>

<h3>Fixed vs variable</h3>
<table>
  <thead><tr><th></th><th>Fixed-size window</th><th>Variable-size window</th></tr></thead>
  <tbody>
    <tr><td>Window size</td><td>Always k items</td><td>Grows and shrinks</td></tr>
    <tr><td>What the question says</td><td>"k consecutive", "every window of size k"</td><td>"longest", "shortest", "at most", "at least"</td></tr>
    <tr><td>Loop shape</td><td>One <code>for</code> loop. Each step: add the item entering, subtract the item leaving.</td><td>A <code>for</code> loop moves <code>right</code>. A <code>while</code> loop inside moves <code>left</code> until the rule holds again.</td></tr>
    <tr><td>Classic problems</td><td>Max sum of k consecutive, average of every k-window, anagram search (same letters, new order)</td><td>Longest substring with no repeats, smallest subarray with sum ≥ target</td></tr>
  </tbody>
</table>

<h3>The "constraint shape" decision</h3>
<p>The rule in the question (the "constraint") tells you which shape of code to write. Four shapes cover almost every question:</p>
<ul>
  <li><strong>"At most"</strong> (for example "at most 2 different letters"): move <code>right</code>; when the rule breaks, move <code>left</code> until it holds; record the window's length.</li>
  <li><strong>"Exactly k"</strong>: count the windows with at most k, subtract the windows with at most k − 1. Explained just below.</li>
  <li><strong>"Smallest window with sum ≥ target"</strong>: move <code>right</code> until the sum reaches the target. Then, while it still reaches it, record the length and move <code>left</code> to try a shorter one. Then carry on with <code>right</code>.</li>
  <li><strong>"Permutation / anagram"</strong>: an <a href="#/topic/dsa-words#w-anagram">anagram</a> is the same letters in a different order ("listen" and "silent"). A <a href="#/topic/dsa-words#w-permutation">permutation</a> means the same thing here: a reordering. Use a <em>fixed</em> window as long as the word, and keep a count of each letter in the window.</li>
</ul>

<h3>Why "at most" is easier than "exactly"</h3>
<p>With "at most 2 different letters", the rule has a useful property: if a window passes, every smaller window inside it passes too. So when the rule breaks, you know exactly what to do: shrink. There is only ever one direction to move.</p>
<p>With "exactly 2 different letters", a window with 1 kind is too few (you want to grow) and a window with 3 kinds is too many (you want to shrink). From the left edge alone you can't tell which way to go, so the simple loop doesn't work.</p>
<p>The fix is a subtraction, like a head count: <em>the number of people aged at most 30, minus the number aged at most 29, is the number aged exactly 30</em>. In the same way:</p>
<div class="diagram"><pre>windows with exactly k kinds  =  windows with at most k kinds
                                 - windows with at most (k - 1) kinds</pre></div>
<p>Both halves use the easy "at most" loop. This only works for <em>counting</em> windows, not for finding the longest or shortest one.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<p>Two traces show the whole pattern. A <strong>trace</strong> is a table of what every variable holds after each step. Both use the same five days of sales, <code>[2, 1, 5, 1, 3]</code>, so you can compare them.</p>

<h3>The "fixed window" picture: a step-by-step trace</h3>
<p>Question: the best total of <strong>3 days in a row</strong> (k = 3). The frame is always 3 days wide. This is exactly what the <a href="#/topic/dsa-sliding-window#mechanics">Fixed window template</a> code does.</p>
<div class="diagram"><pre>sales = [2, 1, 5, 1, 3]        k = 3
index:   0  1  2  3  4
(out = the item leaving, in = the item entering)

step   left..right  frame               out  in   windowSum      best
start  0..2         [2  1  5] 1  3      -    -    2 + 1 + 5 = 8  8
1      1..3          2 [1  5  1] 3      2    1    8 - 2 + 1 = 7  8
2      2..4          2  1 [5  1  3]     1    3    7 - 1 + 3 = 9  9

right would be 5 = sales.length, so the loop stops.
Answer: 9 (days 2, 3 and 4).
Work: 3 additions to build the first frame, then 2 per slide.</pre></div>
<p>Notice that <code>left</code> is always <code>right - k + 1</code>. In a fixed window you only need to track <code>right</code>; the item leaving is <code>sales[right - k]</code>.</p>

<h3>The "expanding/contracting" picture: stretch right, shrink left</h3>
<p>Question: the <strong>shortest</strong> run of days whose total is <strong>at least 6</strong>. Now the frame changes size. <code>right</code> stretches it until the total is big enough. Then <code>left</code> shrinks it as far as it can while the total is still big enough, because we want it short. This is exactly what the code in <a href="#/topic/dsa-sliding-window#ex-4">Example 4</a> does.</p>
<div class="diagram"><pre>sales = [2, 1, 5, 1, 3]        target: total of at least 6
index:   0  1  2  3  4
Rule: when the frame passes, record its length, then shrink.
      When it fails, stop shrinking and move right on.

right  what happens         left  frame     sum  passes?  best
0      take in 2            0     [2]       2    no       -
1      take in 1            0     [2 1]     3    no       -
2      take in 5            0     [2 1 5]   8    yes      3
       drop 2, left = 1     1     [1 5]     6    yes      2
       drop 1, left = 2     2     [5]       5    no       2
3      take in 1            2     [5 1]     6    yes      2
       drop 5, left = 3     3     [1]       1    no       2
4      take in 3            3     [1 3]     4    no       2

Answer: 2   ([1, 5] or [5, 1])
right moved 5 times, left moved 3 times: 8 moves in total for 5 items.
Neither edge ever moved backwards.</pre></div>
<p>Look at the right-hand column. The window got short only by moving <code>left</code> forward. It never had to go back and re-check old days. That is why it is one pass.</p>

<h3>The "templates" picture</h3>
<p>Every sliding-window solution is one of these two shapes. Only the details change: what you keep about the window, and what "the rule is broken" means.</p>
<div class="diagram"><pre>FIXED window (always k items)
1. add up the first k items; record it as the best so far
2. for right = k, k + 1, ... :
     add items[right]             (the item entering)
     subtract items[right - k]    (the item leaving)
     record if better

VARIABLE window (grows and shrinks)
for right = 0, 1, 2, ... :
  1. take in items[right]
  2. while the rule is broken:
       drop items[left]
       left = left + 1
  3. record the window if it is the best</pre></div>
<p>The <a href="#/topic/dsa-sliding-window#mechanics">Mechanics</a> section turns both shapes into real, runnable code.</p>

<h3>The "answer tracking" picture</h3>
<p>There are three kinds of answer, and each is recorded in a different place:</p>
<ul>
  <li><strong>Longest window:</strong> <code>bestLength = Math.max(bestLength, right - left + 1)</code>, <em>after</em> the shrink loop. After shrinking, the window is valid again, so it is safe to measure.</li>
  <li><strong>Shortest window:</strong> <code>bestLength = Math.min(bestLength, right - left + 1)</code>, <em>inside</em> the shrink loop. Inside the loop the window still passes; once the loop ends, it no longer does.</li>
  <li><strong>How many windows:</strong> <code>total += right - left + 1</code> on every step. Here is why that number is right:</li>
</ul>
<div class="diagram"><pre>Rule: "at most 2 different letters".   text = "a a b"   right = 2, left = 0

The good windows that END at right (index 2):
  [b]          index 2 only
  [a b]        index 1..2
  [a a b]      index 0..2
That is 3 windows = right - left + 1 = 2 - 0 + 1.

Each one is a piece of the valid window [left..right] that ends at right.
A piece of a valid "at most" window is always valid too.
Adding this number for every right counts every good window exactly once.</pre></div>

<h3>How to recognise a sliding-window question</h3>
<p>The wording gives it away. Look for three things together:</p>
<ol>
  <li><strong>Side by side:</strong> "subarray", "substring", "contiguous", "consecutive", "in a row", "window".</li>
  <li><strong>A best-of or a count:</strong> "longest", "shortest", "maximum sum", "minimum length", "how many".</li>
  <li><strong>A rule that only gets more broken as the window grows:</strong> "at most k different", "sum at least target", "no repeating characters", "product less than k", "contains all letters of t".</li>
</ol>
<table>
  <thead><tr><th>The question says…</th><th>Use…</th></tr></thead>
  <tbody>
    <tr><td>"every window of size k", "k consecutive"</td><td>Fixed window</td></tr>
    <tr><td>"longest … with at most / without"</td><td>Variable window, record after shrinking</td></tr>
    <tr><td>"shortest / smallest … with at least / containing"</td><td>Variable window, record inside the shrink loop</td></tr>
    <tr><td>"number of subarrays with at most / less than"</td><td>Variable window, <code>total += right - left + 1</code></td></tr>
    <tr><td>"number of subarrays with exactly k"</td><td>atMost(k) − atMost(k − 1)</td></tr>
    <tr><td>"anagram / permutation of p inside s"</td><td>Fixed window of length p, letter counts</td></tr>
    <tr><td>"maximum / minimum of every window"</td><td>Fixed window + <a href="#/topic/dsa-words#w-monotonic-deque">monotonic deque</a></td></tr>
  </tbody>
</table>
<p><strong>Red flags that it is NOT a sliding window:</strong> the items may be skipped ("subsequence", "subset", "any k elements"); the array has negative numbers and the rule is about a sum; or the array is <a href="#/topic/dsa-words#w-sorted">sorted</a> and you need a pair (use <a href="#/topic/dsa-words#w-two-pointers">two pointers</a> from both ends).</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Sliding window is O(n²) because there is a loop inside a loop." It is not. The inner <code>while</code> can run many times in one round, but <code>left</code> never moves backwards, so across the <em>whole run</em> it runs at most n times in total. Look at the second trace: 5 items, 8 moves. That is <a href="#/topic/dsa-words#w-amortized">amortized</a> O(n).</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>Two templates, written as real code you can run, then every variant explained one at a time. Each variant only changes three things: <strong>what you remember about the window</strong>, <strong>when the rule is broken</strong>, and <strong>where you record the answer</strong>.</p>

<h3>Fixed window template</h3>
<p>The best total of k items in a row. This is the code behind the first trace in the Mental Model.</p>
<pre><code class="language-js">function bestSumOfK(items, k) {
  let windowSum = 0;
  for (let i = 0; i &lt; k; i++) {
    windowSum += items[i]; // build the first window: items 0 .. k-1
  }
  let bestSum = windowSum;
  for (let right = k; right &lt; items.length; right++) {
    const entering = items[right]; // the new item on the right edge
    const leaving = items[right - k]; // the item falling off the left edge
    windowSum = windowSum + entering - leaving;
    bestSum = Math.max(bestSum, windowSum);
  }
  return bestSum;
}
console.log(bestSumOfK([2, 1, 5, 1, 3], 3)); // 9</code></pre>
<p>Line by line:</p>
<ul>
  <li>The first loop adds up items 0, 1, 2. That is the first frame (sum 8), and it is also the best so far.</li>
  <li>The second loop starts with <code>right = k</code>, the first item that is <em>not</em> yet in the window.</li>
  <li><code>items[right - k]</code> is the item exactly k places behind the new one. That is the one sliding out. When <code>right</code> is 3, it is <code>items[0]</code>.</li>
  <li>One addition and one subtraction move the frame. Then we compare with the best.</li>
</ul>
<p>In general words: build the first window's "state" (here, a sum), then for each step, add what enters, remove what leaves, and compare. The state could also be a count of letters or a count of negatives.</p>

<h3>Variable window template</h3>
<p>A real version of the "stretch and shrink" shape. Problem: <em>you have a budget; find the longest run of days you could afford, where each day costs <code>costs[i]</code>.</em> Costs are never negative.</p>
<pre><code class="language-js">function longestAffordableRun(costs, budget) {
  let left = 0;
  let windowSum = 0; // total cost of the days inside the window
  let bestLength = 0;
  for (let right = 0; right &lt; costs.length; right++) {
    windowSum += costs[right]; // 1. take in the new day
    while (windowSum &gt; budget) { // 2. over budget: the rule is broken
      windowSum -= costs[left]; // drop the oldest day...
      left++; // ...and move the left edge past it
    }
    const windowLength = right - left + 1; // both ends count, hence + 1
    bestLength = Math.max(bestLength, windowLength); // 3. the window is valid again: record it
  }
  return bestLength;
}
console.log(longestAffordableRun([2, 1, 5, 1, 3], 7)); // 3  (days 1..3: 1 + 5 + 1 = 7)</code></pre>
<p>Line by line:</p>
<ul>
  <li><code>for</code> moves <code>right</code> one step every round. Each day is taken in exactly once.</li>
  <li><code>while</code> shrinks the window only while it breaks the rule. Because costs are never negative, dropping a day always lowers the total. That is what guarantees the loop finishes, and why negatives break the pattern (see Pitfalls).</li>
  <li>After the <code>while</code>, the window is within budget, so this is the place to record a <em>longest</em> answer.</li>
</ul>
<p>Short trace: right = 0 → [2] sum 2, length 1. right = 1 → [2 1] sum 3, length 2. right = 2 → [2 1 5] sum 8 is over 7, drop 2 → [1 5] sum 6, length 2. right = 3 → [1 5 1] sum 7, length <strong>3</strong>. right = 4 → [1 5 1 3] sum 10, drop 1 → 9, drop 5 → [1 3] sum 4, length 2. Best: 3.</p>
<p>In general words: for each new item, add it to the window's state; while the state breaks the rule, remove the item at <code>left</code> and move <code>left</code> on; then record. Every variable-window problem on this page is this loop with a different state and a different rule.</p>

<h3>Keeping the window's state</h3>
<p>"State" is whatever you remember about the items inside the window. Three kinds come up again and again:</p>
<ul>
  <li><strong>A number</strong>: a sum, a product, or a count of zeros. Add when an item enters, subtract when it leaves.</li>
  <li><strong>A <a href="#/topic/dsa-words#w-frequency-map">frequency map</a></strong>: a <a href="#/topic/dsa-words#w-hash-map">Map</a> from each value to how many times it is inside the window. Use it when values can be anything (words, numbers, any character).</li>
  <li><strong>An array of 26 counts</strong>: when the input is only the letters a–z. Slot 0 counts 'a', slot 1 counts 'b', and so on. This is a little faster and simpler than a Map.</li>
</ul>
<pre><code class="language-js">// A frequency map: add one item, remove one item
const countInWindow = new Map();
function addToWindow(value) {
  let current = 0; // a value we have never seen counts as 0
  if (countInWindow.has(value)) {
    current = countInWindow.get(value);
  }
  countInWindow.set(value, current + 1);
}
function removeFromWindow(value) {
  const remaining = countInWindow.get(value) - 1;
  if (remaining === 0) {
    countInWindow.delete(value); // fully gone: delete it so .size stays honest
  } else {
    countInWindow.set(value, remaining);
  }
}
addToWindow("tea");
addToWindow("coffee");
addToWindow("tea");
removeFromWindow("coffee");
console.log(countInWindow.size); // 1  (only "tea" is left; "coffee" was deleted)

// 26 counts: turn a letter into a slot number
const letterCounts = new Array(26).fill(0);
const word = "cab";
for (let i = 0; i &lt; word.length; i++) {
  const slot = word.charCodeAt(i) - 97; // 'a' has code 97, so 'a' -&gt; 0, 'b' -&gt; 1, 'c' -&gt; 2
  letterCounts[slot]++;
}
console.log(letterCounts[0], letterCounts[1], letterCounts[2]); // 1 1 1</code></pre>
<p><code>charCodeAt</code> gives a character's number code. Lowercase 'a' is 97 and uppercase 'A' is 65, so subtracting 97 (or 65) turns a letter into a slot from 0 to 25.</p>

<h3>Maximum sum subarray of size k</h3>
<p>This is the fixed window template above, word for word: a running sum, plus the item entering, minus the item leaving. It runs in O(n) time and <a href="#/topic/dsa-words#w-o-1">O(1)</a> space (only a few number variables, however long the input). The full worked version, with edge cases, is <a href="#/topic/dsa-sliding-window#ex-1">Example 1</a>.</p>

<h3>Average of subarrays of size k</h3>
<p>Same fixed window, but instead of keeping only the best, you save the average of <em>every</em> window. Think of a "5-day moving average" line on a stock chart.</p>
<pre><code class="language-js">function findAverages(prices, k) {
  const averages = [];
  let windowSum = 0;
  for (let i = 0; i &lt; k; i++) {
    windowSum += prices[i]; // the first window
  }
  averages.push(windowSum / k);
  for (let right = k; right &lt; prices.length; right++) {
    windowSum = windowSum + prices[right] - prices[right - k]; // slide one step
    averages.push(windowSum / k);
  }
  return averages;
}
console.log(findAverages([1, 3, 2, 6, -1, 4, 1, 8, 2], 5)); // [2.2, 2.8, 2.4, 3.6, 2.8]</code></pre>
<p>Negative numbers are fine here. A fixed window never has to decide "should I shrink?", so the problem with negatives (see Pitfalls) does not apply. Time O(n). Space O(1) besides the output array.</p>

<h3>Longest substring without repeating</h3>
<p>State: a Map from each letter to the <em>last index where we saw it</em>. Rule broken: the new letter is already inside the window. Instead of shrinking one step at a time, jump <code>left</code> straight past the old copy: <code>left = previousIndex + 1</code>. Only jump if that old copy is still inside the window (<code>previousIndex &gt;= left</code>); otherwise <code>left</code> could move backwards. Record after the jump (longest). Full code and trace: <a href="#/topic/dsa-sliding-window#ex-2">Example 2</a>.</p>

<h3>Longest substring with at most k distinct</h3>
<p>"Distinct" means different. State: a frequency map of letters in the window. Rule broken: the map holds more than k keys (<code>countInWindow.size &gt; k</code>). Shrink one letter at a time, deleting a key when its count reaches 0. Record after shrinking. Full code: <a href="#/topic/dsa-sliding-window#ex-3">Example 3</a>.</p>

<h3>Smallest subarray with sum ≥ target</h3>
<p>State: the window's sum. Here the rule is a goal to reach, not a limit. While the window <em>passes</em> (sum ≥ target), record its length, then drop the left item to try a shorter one. Start <code>bestLength</code> at <code>Infinity</code>, a <a href="#/topic/dsa-words#w-sentinel">sentinel</a> (a stand-in value meaning "nothing found yet"), and turn it into 0 at the end if it never changed. Traced in the Mental Model; full code: <a href="#/topic/dsa-sliding-window#ex-4">Example 4</a>.</p>

<h3>Permutation in string (anagram present?)</h3>
<p>A fixed window as long as the short word. State: 26 letter counts for the window, compared with 26 counts for the word. Each slide adds one letter and removes one. If the two count arrays match, the window is an anagram. Comparing 26 numbers each step costs 26 × n steps, which is still O(n), because 26 never grows. Full code: <a href="#/topic/dsa-sliding-window#ex-7">Example 7</a>.</p>

<h3>Find all anagrams</h3>
<p>The same window as above, but instead of stopping at the first match, save the start index of every matching window (<code>right - p.length + 1</code>). Full code: <a href="#/topic/dsa-sliding-window#ex-8">Example 8</a>.</p>

<h3>Minimum window substring</h3>
<p>The hardest classic. State: a "need" map from the pattern, a "window" map, and two counters: how many different letters we must cover (interviewers call it <code>required</code>) and how many are covered right now (<code>formed</code>). Stretch until every letter is covered, then shrink while it stays covered, recording the shortest. Full code and trace: <a href="#/topic/dsa-sliding-window#ex-9">Example 9</a>.</p>

<h3>"Exactly K" trick</h3>
<p>Write one helper, <code>atMostK</code>, that <em>counts</em> windows with at most k different values (using <code>total += right - left + 1</code>). Then exactly k = <code>atMostK(k) - atMostK(k - 1)</code>. Two O(n) passes is still O(n). Full code and the counting trace: <a href="#/topic/dsa-sliding-window#ex-12">Example 12</a>.</p>

<h3>Sliding window maximum (monotonic deque)</h3>
<p>Question: the biggest number in every window of size k. Re-scanning each window is O(n × k). The fast way keeps a waiting line of <em>candidates</em>:</p>
<ul>
  <li>A <a href="#/topic/dsa-words#w-deque">deque</a> (said "deck") is a line you can add to and remove from at <em>both</em> ends.</li>
  <li><a href="#/topic/dsa-words#w-monotonic">Monotonic</a> means "only goes one way". Here, the values in the line only go <em>down</em> from front to back.</li>
  <li>When a new number arrives, everyone at the back who is smaller leaves. They are older <em>and</em> smaller, so they can never be the biggest again.</li>
  <li>The front is always the biggest in the window. When the front's index slides out of the window, it leaves from the front.</li>
</ul>
<p>The line stores <em>indexes</em>, not values, so you can tell when one has slid out. Each index joins once and leaves once: O(n) in total. Full code and trace: <a href="#/topic/dsa-sliding-window#ex-10">Example 10</a>.</p>
<p><strong>About JavaScript arrays as a deque:</strong> <code>push</code> and <code>pop</code> (the back) are fast, but <code>shift()</code> (the front) moves every other item down one place, so it costs O(k). The examples on this page avoid <code>shift()</code>. They keep a number, <code>front</code>, that says where the line really starts, and remove from the front with <code>front++</code>, which is O(1).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<p>Fifteen classic interview problems. Each one has the problem in plain words, the idea, a short trace, code you can paste into a console, and its cost in words.</p>

<h3 id="ex-1">Example 1 — max sum of k consecutive</h3>
<p><strong>The problem:</strong> A café records how many customers came in each hour: <code>[4, 2, 12, 3, 8, 1]</code>. Which 3 hours in a row were the busiest? (LeetCode-style: "maximum sum subarray of size k".)</p>
<p><strong>The idea:</strong> A fixed window of 3. Keep a running sum: add the hour that enters, subtract the hour that leaves.</p>
<div class="diagram"><pre>customers = [4, 2, 12, 3, 8, 1]     k = 3

right  frame              leaving  entering  windowSum         best
start  [4 2 12] 3 8 1       -        -       4 + 2 + 12 = 18   18
3      4 [2 12 3] 8 1       4        3       18 - 4 + 3 = 17   18
4      4 2 [12 3 8] 1       2        8       17 - 2 + 8 = 23   23
5      4 2 12 [3 8 1]       12       1       23 - 12 + 1 = 12  23
Answer: 23</pre></div>
<pre><code class="language-js">function maxSumOfK(numbers, k) {
  if (k &lt;= 0 || k &gt; numbers.length) {
    return null; // no window of size k fits; say so instead of guessing
  }
  let windowSum = 0;
  for (let i = 0; i &lt; k; i++) {
    windowSum += numbers[i]; // the first window: items 0 .. k-1
  }
  let bestSum = windowSum;
  for (let right = k; right &lt; numbers.length; right++) {
    const entering = numbers[right];
    const leaving = numbers[right - k]; // exactly k places behind the new item
    windowSum = windowSum + entering - leaving;
    bestSum = Math.max(bestSum, windowSum);
  }
  return bestSum;
}
console.log(maxSumOfK([4, 2, 12, 3, 8, 1], 3)); // 23
console.log(maxSumOfK([4, 2], 3)); // null  (k is bigger than the array)</code></pre>
<p><strong>Cost:</strong> time O(n), one pass with two small steps per slide. Space O(1), just a few numbers.</p>

<h3 id="ex-2">Example 2 — longest substring without repeat</h3>
<p><strong>The problem:</strong> Your playlist is a string of song letters, like <code>"abcabcbb"</code>. What is the longest stretch with no song repeated? Here it is 3 ("abc").</p>
<p><strong>The idea:</strong> Stretch <code>right</code> one song at a time. Remember the last index where each song appeared. If the new song already appears <em>inside</em> the window, jump <code>left</code> to just after that earlier copy. Then the window has no repeats again.</p>
<div class="diagram"><pre>text = "abcabcbb"

right  letter  last seen at        left  window  length  best
0      a       never               0     a       1       1
1      b       never               0     ab      2       2
2      c       never               0     abc     3       3
3      a       0 (inside window)   1     bca     3       3
4      b       1 (inside window)   2     cab     3       3
5      c       2 (inside window)   3     abc     3       3
6      b       4 (inside window)   5     cb      2       3
7      b       6 (inside window)   7     b       1       3
Answer: 3</pre></div>
<pre><code class="language-js">function lengthOfLongestSubstring(text) {
  const lastSeenAt = new Map(); // letter -&gt; the index where we last saw it
  let left = 0;
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const letter = text[right];
    if (lastSeenAt.has(letter)) {
      const previousIndex = lastSeenAt.get(letter);
      if (previousIndex &gt;= left) {
        left = previousIndex + 1; // the old copy is inside the window: jump just past it
      }
    }
    lastSeenAt.set(letter, right);
    const windowLength = right - left + 1;
    bestLength = Math.max(bestLength, windowLength);
  }
  return bestLength;
}
console.log(lengthOfLongestSubstring("abcabcbb")); // 3
console.log(lengthOfLongestSubstring("abba")); // 2  (the last 'a' was seen at 0, outside the window, so left stays)
console.log(lengthOfLongestSubstring("")); // 0</code></pre>
<p>Why the <code>previousIndex &gt;= left</code> check? In <code>"abba"</code>, when the last 'a' arrives, <code>left</code> is already 2. The old 'a' at index 0 is outside the window. Without the check, <code>left</code> would jump <em>back</em> to 1 and the window "bba" would wrongly be counted.</p>
<p><strong>Cost:</strong> time O(n). Space O(min(n, alphabet size)): the map holds at most one entry per different character.</p>

<h3 id="ex-3">Example 3 — longest substring with at most 2 distinct</h3>
<p><strong>The problem:</strong> In <code>"eceba"</code>, find the longest stretch that uses at most 2 different letters. Answer: 3 ("ece"). The general version takes any k.</p>
<p><strong>The idea:</strong> A frequency map of letters in the window. Its <code>.size</code> is the number of different letters. When it goes over k, drop letters from the left, deleting a key when its count reaches 0. Record after shrinking.</p>
<div class="diagram"><pre>text = "eceba"   k = 2

right  letter  counts after taking it in   window  best
0      e       {e:1}                       e       1
1      c       {e:1, c:1}                  ec      2
2      e       {e:2, c:1}                  ece     3
3      b       {e:2, c:1, b:1}  3 kinds!   eb      3
         shrink: drop e {e:1}, drop c (count 0, so delete it)
4      a       {e:1, b:1, a:1}  3 kinds!   ba      3
         shrink: drop e (count 0, so delete it)
(window = what is left after shrinking)
Answer: 3</pre></div>
<pre><code class="language-js">function longestWithAtMostKDistinct(text, k) {
  const countInWindow = new Map(); // letter -&gt; how many times it is inside the window
  let left = 0;
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const entering = text[right];
    let enteringCount = 0; // a letter we have not seen counts as 0
    if (countInWindow.has(entering)) {
      enteringCount = countInWindow.get(entering);
    }
    countInWindow.set(entering, enteringCount + 1);
    while (countInWindow.size &gt; k) { // too many different letters: shrink
      const leaving = text[left];
      const leavingCount = countInWindow.get(leaving) - 1;
      if (leavingCount === 0) {
        countInWindow.delete(leaving); // gone from the window, so it no longer counts as a kind
      } else {
        countInWindow.set(leaving, leavingCount);
      }
      left++;
    }
    bestLength = Math.max(bestLength, right - left + 1);
  }
  return bestLength;
}
function longestSubstringTwoDistinct(text) {
  return longestWithAtMostKDistinct(text, 2);
}
console.log(longestSubstringTwoDistinct("eceba")); // 3
console.log(longestSubstringTwoDistinct("ccaabbb")); // 5  ("aabbb")
console.log(longestWithAtMostKDistinct("aa", 0)); // 0  (k = 0 allows only the empty window)</code></pre>
<p><strong>Cost:</strong> time O(n): each letter enters once and leaves at most once. Space O(k): the map never holds more than k + 1 keys.</p>

<h3 id="ex-4">Example 4 — smallest subarray with sum ≥ target</h3>
<p><strong>The problem:</strong> A fundraiser needs at least ₹7 (thousand) and wants to finish fast. Daily donations were <code>[2, 3, 1, 2, 4, 3]</code>. What is the fewest days in a row that reach 7? Answer: 2 (the days with 4 and 3). If no stretch reaches it, return 0. All numbers are positive.</p>
<p><strong>The idea:</strong> Stretch <code>right</code> until the sum reaches the target. Then, <em>while</em> it still does, record the length and drop the left item to try a shorter window. This is the "expanding/contracting" trace from the Mental Model, which used <code>[2, 1, 5, 1, 3]</code> and target 6.</p>
<div class="diagram"><pre>donations = [2, 3, 1, 2, 4, 3]    target 7

right  take in  window        sum  inside the shrink loop               best
0..2   2, 3, 1  [2 3 1]       6    sum &lt; 7, nothing                     none
3      2        [2 3 1 2]     8    record 4; drop 2 -&gt; [3 1 2] = 6      4
4      4        [3 1 2 4]     10   record 4; drop 3 -&gt; [1 2 4] = 7,
                                   record 3; drop 1 -&gt; [2 4] = 6        3
5      3        [2 4 3]       9    record 3; drop 2 -&gt; [4 3] = 7,
                                   record 2; drop 4 -&gt; [3] = 3          2
Answer: 2</pre></div>
<pre><code class="language-js">function minSubArrayLen(target, numbers) {
  let left = 0;
  let windowSum = 0;
  let bestLength = Infinity; // sentinel: "nothing found yet"; any real length is smaller
  for (let right = 0; right &lt; numbers.length; right++) {
    windowSum += numbers[right];
    while (windowSum &gt;= target) { // the window passes: record it, then try a shorter one
      bestLength = Math.min(bestLength, right - left + 1);
      windowSum -= numbers[left];
      left++; // always move left after recording, or this loop never ends
    }
  }
  if (bestLength === Infinity) {
    return 0; // no window ever reached the target
  }
  return bestLength;
}
console.log(minSubArrayLen(7, [2, 3, 1, 2, 4, 3])); // 2
console.log(minSubArrayLen(6, [2, 1, 5, 1, 3])); // 2  (the Mental Model trace)
console.log(minSubArrayLen(100, [1, 2, 3])); // 0  (never reached)</code></pre>
<p><strong>Cost:</strong> time O(n), since <code>left</code> and <code>right</code> each move at most n times. Space O(1). Only correct when all numbers are positive (or zero).</p>

<h3 id="ex-5">Example 5 — fruits into baskets</h3>
<p><strong>The problem:</strong> You walk along a row of fruit trees, picking one fruit from each tree, left to right, without skipping. <code>fruits[i]</code> is the type of tree i. You have <strong>two baskets</strong>, and each basket holds only one type. You must stop when you reach a third type. What is the most fruit you can pick? For <code>[1, 2, 3, 2, 2]</code> the answer is 4 (start at index 1: 2, 3, 2, 2).</p>
<p><strong>The idea:</strong> Strip away the story and it is Example 3 with k = 2: the longest subarray with at most 2 different values. The baskets <em>are</em> the frequency map; "a third type" means the map's size goes over 2.</p>
<div class="diagram"><pre>fruits = [1, 2, 3, 2, 2]

right  fruit  baskets after picking      window      best
0      1      {1:1}                      [1]         1
1      2      {1:1, 2:1}                 [1 2]       2
2      3      {1:1, 2:1, 3:1} 3 types!   [2 3]       2
         shrink: drop 1 (count 0, so delete it)
3      2      {2:2, 3:1}                 [2 3 2]     3
4      2      {2:3, 3:1}                 [2 3 2 2]   4
(window = what is left after shrinking)
Answer: 4</pre></div>
<pre><code class="language-js">function totalFruit(fruits) {
  const basket = new Map(); // fruit type -&gt; how many of it are in the window
  let left = 0;
  let mostFruit = 0;
  for (let right = 0; right &lt; fruits.length; right++) {
    const picked = fruits[right];
    let pickedCount = 0;
    if (basket.has(picked)) {
      pickedCount = basket.get(picked);
    }
    basket.set(picked, pickedCount + 1);
    while (basket.size &gt; 2) { // a third type: empty fruit from the left until only 2 types remain
      const dropped = fruits[left];
      const droppedCount = basket.get(dropped) - 1;
      if (droppedCount === 0) {
        basket.delete(dropped);
      } else {
        basket.set(dropped, droppedCount);
      }
      left++;
    }
    mostFruit = Math.max(mostFruit, right - left + 1);
  }
  return mostFruit;
}
console.log(totalFruit([1, 2, 3, 2, 2])); // 4
console.log(totalFruit([1, 2, 1])); // 3
console.log(totalFruit([0, 1, 2, 2])); // 3</code></pre>
<p><strong>Cost:</strong> time O(n). Space O(1): the map never holds more than 3 keys.</p>

<h3 id="ex-6">Example 6 — character replacement</h3>
<p><strong>The problem:</strong> A banner is a row of coloured tiles, written as capital letters, like <code>"AABABBA"</code>. You may repaint at most k tiles (here k = 1). What is the longest run of one colour you can make? Answer: 4 (repaint the B in "AABA" to get "AAAA").</p>
<p><strong>The idea:</strong> In any window, keep the most common letter and repaint the rest. So the number of repaints needed is:</p>
<div class="diagram"><pre>repaints needed = window length - count of its most common letter</pre></div>
<p>If that is more than k, shrink from the left. This version keeps <code>mostCommonCount</code> as the highest count seen so far and never lowers it, even when letters leave. That sounds wrong, but it still gives the right answer; <a href="#/topic/dsa-sliding-window#ex-13">Example 13</a> explains why.</p>
<div class="diagram"><pre>text = "AABABBA"   k = 1
most = mostCommonCount;  need = length - most (repaints needed)

right  letter  counts  most  window  left..right  need  best
0      A       A1      1     A       0..0         0     1
1      A       A2      2     AA      0..1         0     2
2      B       A2 B1   2     AAB     0..2         1     3
3      A       A3 B1   3     AABA    0..3         1     4
4      B       A3 B2   3     AABAB   0..4         2     4   2 &gt; 1: drop A
5      B       A2 B3   3     ABABB   1..5         2     4   2 &gt; 1: drop A
6      A       A2 B3   3     BABBA   2..6         2     4   2 &gt; 1: drop B
Answer: 4</pre></div>
<pre><code class="language-js">function characterReplacement(text, k) {
  const countOf = new Array(26).fill(0); // countOf[0] = how many 'A' in the window, countOf[1] = 'B', ...
  let left = 0;
  let mostCommonCount = 0; // the highest single-letter count seen in any window so far
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const slot = text.charCodeAt(right) - 65; // 'A' has code 65, so 'A' -&gt; 0, 'B' -&gt; 1, ...
    countOf[slot]++;
    mostCommonCount = Math.max(mostCommonCount, countOf[slot]);
    let windowLength = right - left + 1;
    while (windowLength - mostCommonCount &gt; k) { // needs more than k repaints: shrink
      const leavingSlot = text.charCodeAt(left) - 65; // 'A' is 65, so this turns A..Z into slot 0..25
      countOf[leavingSlot]--;
      left++;
      windowLength = right - left + 1;
    }
    bestLength = Math.max(bestLength, windowLength);
  }
  return bestLength;
}
console.log(characterReplacement("AABABBA", 1)); // 4
console.log(characterReplacement("ABAB", 2)); // 4</code></pre>
<p><strong>Cost:</strong> time O(n). Space O(1): always 26 counts, however long the text.</p>

<h3 id="ex-7">Example 7 — permutation in string</h3>
<p><strong>The problem:</strong> Does <code>text</code> contain some reordering of <code>pattern</code> as a side-by-side piece? For pattern <code>"ab"</code> and text <code>"eidbaooo"</code>: yes, "ba" is at index 3. For text <code>"eidboaoo"</code>: no.</p>
<p><strong>The idea:</strong> Two words are reorderings of each other exactly when they have the same count of every letter. So slide a fixed window as long as the pattern, keep 26 letter counts for it, and compare with the pattern's counts.</p>
<div class="diagram"><pre>pattern = "ab" (needs a:1, b:1)    text = "eidbaooo"   window size 2

right  window  window counts   same as pattern?
1      ei      e:1 i:1         no
2      id      i:1 d:1         no
3      db      d:1 b:1         no
4      ba      b:1 a:1         YES -&gt; return true</pre></div>
<pre><code class="language-js">function sameCounts(countsA, countsB) {
  for (let i = 0; i &lt; 26; i++) {
    if (countsA[i] !== countsB[i]) {
      return false;
    }
  }
  return true;
}
function checkInclusion(pattern, text) {
  if (pattern.length &gt; text.length) {
    return false; // the window cannot even fit
  }
  const needCount = new Array(26).fill(0); // letter counts of the pattern
  const windowCount = new Array(26).fill(0); // letter counts inside the window
  for (let i = 0; i &lt; pattern.length; i++) {
    needCount[pattern.charCodeAt(i) - 97]++; // 'a' has code 97, so 'a' -&gt; slot 0
  }
  const size = pattern.length; // the window is always exactly this long
  for (let right = 0; right &lt; text.length; right++) {
    windowCount[text.charCodeAt(right) - 97]++; // letter entering on the right ('a' is 97, so a..z -&gt; slot 0..25)
    if (right &gt;= size) {
      windowCount[text.charCodeAt(right - size) - 97]--; // letter leaving on the left (same a..z -&gt; 0..25 slot)
    }
    if (right &gt;= size - 1 &amp;&amp; sameCounts(needCount, windowCount)) {
      return true; // a full-size window with the same letters
    }
  }
  return false;
}
console.log(checkInclusion("ab", "eidbaooo")); // true
console.log(checkInclusion("ab", "eidboaoo")); // false</code></pre>
<p><strong>Cost:</strong> time O(26 × n), which is O(n) because 26 is a fixed number that never grows. Space O(1): two arrays of 26.</p>

<h3 id="ex-8">Example 8 — find all anagrams</h3>
<p><strong>The problem:</strong> Find the start index of every <a href="#/topic/dsa-words#w-anagram">anagram</a> of <code>p</code> inside <code>s</code>. For <code>s = "cbaebabacd"</code>, <code>p = "abc"</code>: "cba" starts at 0 and "bac" starts at 6, so the answer is <code>[0, 6]</code>.</p>
<p><strong>The idea:</strong> Example 7, but don't stop at the first match. Each time the counts match, the window starts at <code>right - p.length + 1</code>; save it.</p>
<div class="diagram"><pre>s = "cbaebabacd"   p = "abc"   window size 3

right  window  matches abc?   start = right - 3 + 1
2      cba     yes            0  saved
3      bae     no
4      aeb     no
5      eba     no
6      bab     no
7      aba     no
8      bac     yes            6  saved
9      acd     no
Answer: [0, 6]</pre></div>
<pre><code class="language-js">function sameCounts(countsA, countsB) {
  for (let i = 0; i &lt; 26; i++) {
    if (countsA[i] !== countsB[i]) {
      return false;
    }
  }
  return true;
}
function findAnagrams(s, p) {
  if (s.length &lt; p.length) {
    return [];
  }
  const needCount = new Array(26).fill(0);
  const windowCount = new Array(26).fill(0);
  for (let i = 0; i &lt; p.length; i++) {
    needCount[p.charCodeAt(i) - 97]++; // 'a' is 97, so this turns a..z into slot 0..25
  }
  const starts = [];
  for (let right = 0; right &lt; s.length; right++) {
    windowCount[s.charCodeAt(right) - 97]++; // entering letter, as a slot 0..25
    if (right &gt;= p.length) {
      windowCount[s.charCodeAt(right - p.length) - 97]--; // leaving letter, as a slot 0..25
    }
    if (right &gt;= p.length - 1 &amp;&amp; sameCounts(needCount, windowCount)) {
      starts.push(right - p.length + 1); // where this window begins
    }
  }
  return starts;
}
console.log(findAnagrams("cbaebabacd", "abc")); // [0, 6]
console.log(findAnagrams("abab", "ab")); // [0, 1, 2]</code></pre>
<p><strong>Cost:</strong> time O(26 × n) = O(n). Space O(1) besides the answer list.</p>

<h3 id="ex-9">Example 9 — minimum window substring</h3>
<p><strong>The problem:</strong> Find the shortest piece of <code>text</code> that contains every letter of <code>pattern</code> (repeats included). For text <code>"ADOBECODEBANC"</code> and pattern <code>"ABC"</code>, the answer is <code>"BANC"</code>. If there is none, return <code>""</code>. Real-life picture: the shortest stretch of a shopping street where you can buy everything on your list.</p>
<p><strong>The idea:</strong> Shortest + "contains everything" = stretch until the window covers everything, then shrink while it still covers everything, recording as you go. To check "covers everything" in O(1), keep two counters:</p>
<ul>
  <li><code>lettersToSatisfy</code>: how many <em>different</em> letters the pattern needs (interviewers call it <code>required</code>). For "ABC" it is 3.</li>
  <li><code>lettersSatisfied</code>: how many of them the window has enough of right now (<code>formed</code>). Add 1 when a letter's count <em>reaches exactly</em> what is needed. Take 1 away when it <em>drops below</em>.</li>
</ul>
<div class="diagram"><pre>text = "ADOBECODEBANC"   pattern = "ABC"   (needs A:1, B:1, C:1)
have = how many of A, B, C the window has enough of (lettersSatisfied)

right  letter  window       have  what happens
0..4   ADOBE   ADOBE        2     still missing C (has A and B)
5      C       ADOBEC       3     covered! record "ADOBEC" (6)
                                  drop A -&gt; have 2
6..9   ODEB    DOBECODEB    2     missing A
10     A       DOBECODEBA   3     covered, but 10 is not better
                                  drop D, O, B, E: still covered
                                  drop C -&gt; have 2
11     N       ODEBAN       2     missing C
12     C       ODEBANC      3     covered, but 7 is not better
                                  drop O: "DEBANC" (6), not better
                                  drop D: "EBANC" (5), record
                                  drop E: "BANC" (4), record
                                  drop B -&gt; have 2
Answer: "BANC"</pre></div>
<pre><code class="language-js">function minWindow(text, pattern) {
  const needCount = new Map(); // letter -&gt; how many the pattern needs
  for (const letter of pattern) {
    let current = 0;
    if (needCount.has(letter)) {
      current = needCount.get(letter);
    }
    needCount.set(letter, current + 1);
  }
  const lettersToSatisfy = needCount.size; // "required": different letters we must fully cover
  let lettersSatisfied = 0; // "formed": how many of those the window covers right now
  const windowCount = new Map(); // letter -&gt; how many are inside the window
  let left = 0;
  let bestLength = Infinity;
  let bestStart = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const entering = text[right];
    let enteringCount = 0;
    if (windowCount.has(entering)) {
      enteringCount = windowCount.get(entering);
    }
    enteringCount = enteringCount + 1;
    windowCount.set(entering, enteringCount);
    if (needCount.has(entering) &amp;&amp; enteringCount === needCount.get(entering)) {
      lettersSatisfied++; // this letter just reached the amount we need (exactly, so it counts once)
    }
    while (lettersSatisfied === lettersToSatisfy) { // window covers everything: record, then shrink
      const windowLength = right - left + 1;
      if (windowLength &lt; bestLength) {
        bestLength = windowLength;
        bestStart = left;
      }
      const leaving = text[left];
      const leavingCount = windowCount.get(leaving) - 1;
      windowCount.set(leaving, leavingCount);
      if (needCount.has(leaving) &amp;&amp; leavingCount &lt; needCount.get(leaving)) {
        lettersSatisfied--; // we just dropped below what we need of this letter
      }
      left++;
    }
  }
  if (bestLength === Infinity) {
    return ""; // the text never covered the whole pattern
  }
  return text.slice(bestStart, bestStart + bestLength);
}
console.log(minWindow("ADOBECODEBANC", "ABC")); // "BANC"
console.log(minWindow("a", "aa")); // ""  (needs two a's, only one exists)</code></pre>
<p><strong>Cost:</strong> time O(n + m), where n is the text length and m the pattern length: m to build the need map, then each text letter enters once and leaves once. Space O(alphabet size) for the two maps.</p>

<h3 id="ex-10">Example 10 — sliding window maximum</h3>
<p><strong>The problem:</strong> A temperature sensor gives readings <code>[1, 3, -1, -3, 5, 3, 6, 7]</code>. For every window of 3 readings, report the highest. Answer: <code>[3, 3, 5, 5, 6, 7]</code>.</p>
<p><strong>The idea:</strong> Re-scanning each window costs k steps, so O(n × k) in total. Instead keep a waiting line of candidate indexes, a <a href="#/topic/dsa-words#w-monotonic-deque">monotonic deque</a>, where the values only go down from front to back:</p>
<ul>
  <li>A new reading first sends away every smaller reading at the back of the line. They are older and smaller, so they can never be the highest again.</li>
  <li>The front of the line is the highest reading in the window.</li>
  <li>If the front's index has slid out of the window, it leaves from the front.</li>
</ul>
<div class="diagram"><pre>readings = [1, 3, -1, -3, 5, 3, 6, 7]    k = 3
line = the candidates, front first (shown as values; the code
stores their indexes). max = the front, once a full window exists.

i  reading  what happens                 line          max
0  1        join                         [1]
1  3        3 sends away 1               [3]
2  -1       join                         [3, -1]       3
3  -3       join                         [3, -1, -3]   3
4  5        3 (index 1) slid out;        [5]           5
            5 sends away -3 and -1
5  3        join                         [5, 3]        5
6  6        6 sends away 3 and 5         [6]           6
7  7        7 sends away 6               [7]           7
Answer: [3, 3, 5, 5, 6, 7]</pre></div>
<pre><code class="language-js">function maxSlidingWindow(numbers, k) {
  const result = [];
  const candidates = []; // indexes; their values go DOWN from front to back
  let front = 0; // candidates[front] is the real front of the line (moving it is O(1), unlike shift())
  for (let i = 0; i &lt; numbers.length; i++) {
    while (front &lt; candidates.length &amp;&amp; candidates[front] &lt;= i - k) {
      front++; // the front index has slid out of the window on the left
    }
    while (candidates.length &gt; front &amp;&amp; numbers[candidates[candidates.length - 1]] &lt; numbers[i]) {
      candidates.pop(); // older and smaller than numbers[i]: it can never be a window's max again
    }
    candidates.push(i);
    if (i &gt;= k - 1) {
      result.push(numbers[candidates[front]]); // the first full window ends at i = k - 1
    }
  }
  return result;
}
console.log(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)); // [3, 3, 5, 5, 6, 7]</code></pre>
<p><strong>Cost:</strong> time O(n): each index joins the line once and leaves at most once, even with the loops inside the loop (amortized). Space: at most k live candidates, so O(k) with a real deque. This simple version leaves used slots behind <code>front</code>, so its array can grow to n entries; say so if asked. For the <em>minimum</em> of every window, flip the comparison to <code>&gt;</code>.</p>

<h3 id="ex-11">Example 11 — subarray product less than k</h3>
<p><strong>The problem:</strong> Count the side-by-side groups of numbers whose product (all multiplied together) is less than k. For <code>[10, 5, 2, 6]</code> and k = 100 the answer is 8: [10], [5], [2], [6], [10, 5], [5, 2], [2, 6], [5, 2, 6]. All numbers are positive.</p>
<p><strong>The idea:</strong> Keep the product of the window. While it is k or more, divide out the left number. Then every window ending at <code>right</code> and starting at <code>left</code> or later is good, which is <code>right - left + 1</code> windows.</p>
<div class="diagram"><pre>numbers = [10, 5, 2, 6]   k = 100

right  take in  product            left  new windows ending here     count
0      10       10                 0     [10]                         1
1      5        50                 0     [5], [10 5]                  3
2      2        100 too big,
                / 10 = 10          1     [2], [5 2]                   5
3      6        60                 1     [6], [2 6], [5 2 6]          8
Answer: 8</pre></div>
<pre><code class="language-js">function numSubarrayProductLessThanK(numbers, k) {
  if (k &lt;= 1) {
    return 0; // all numbers are at least 1, so no product can be below 1
  }
  let left = 0;
  let product = 1; // the product of an empty window is 1
  let count = 0;
  for (let right = 0; right &lt; numbers.length; right++) {
    product *= numbers[right];
    while (product &gt;= k) { // too big: divide out the leftmost number
      product /= numbers[left];
      left++;
    }
    count += right - left + 1; // good windows that end at right
  }
  return count;
}
console.log(numSubarrayProductLessThanK([10, 5, 2, 6], 100)); // 8
console.log(numSubarrayProductLessThanK([1, 2, 3], 0)); // 0</code></pre>
<p>Why the <code>k &lt;= 1</code> check? If k is 1 or less, even a single number fails, so the <code>while</code> would empty the window and then keep dividing with <code>left</code> past <code>right</code>. Returning 0 up front avoids that.</p>
<p><strong>Cost:</strong> time O(n). Space O(1).</p>

<h3 id="ex-12">Example 12 — subarrays with k distinct (exactly)</h3>
<p><strong>The problem:</strong> Count the subarrays that contain <em>exactly</em> k different numbers. For <code>[1, 2, 1, 2, 3]</code> and k = 2 the answer is 7: [1,2], [2,1], [1,2], [2,3], [1,2,1], [2,1,2], [1,2,1,2].</p>
<p><strong>The idea:</strong> "Exactly" has no simple shrink rule (see What &amp; Why), so count "at most 2" and subtract "at most 1". The helper counts with <code>total += right - left + 1</code>.</p>
<div class="diagram"><pre>numbers = [1, 2, 1, 2, 3]

atMost(2):
right  window after shrinking  adds
0      [1]                     1
1      [1 2]                   2
2      [1 2 1]                 3
3      [1 2 1 2]               4
4      [2 3]                   2
total                          12

atMost(1):
right  window after shrinking  adds
0      [1]                     1
1      [2]                     1
2      [1]                     1
3      [2]                     1
4      [3]                     1
total                          5

exactly 2 = 12 - 5 = 7</pre></div>
<pre><code class="language-js">function countAtMostKDistinct(numbers, k) {
  const countInWindow = new Map(); // value -&gt; how many times it is inside the window
  let left = 0;
  let total = 0;
  for (let right = 0; right &lt; numbers.length; right++) {
    const entering = numbers[right];
    let enteringCount = 0;
    if (countInWindow.has(entering)) {
      enteringCount = countInWindow.get(entering);
    }
    countInWindow.set(entering, enteringCount + 1);
    while (countInWindow.size &gt; k) { // too many different values: shrink
      const leaving = numbers[left];
      const leavingCount = countInWindow.get(leaving) - 1;
      if (leavingCount === 0) {
        countInWindow.delete(leaving);
      } else {
        countInWindow.set(leaving, leavingCount);
      }
      left++;
    }
    total += right - left + 1; // every good subarray that ends at right
  }
  return total;
}
function subarraysWithKDistinct(numbers, k) {
  return countAtMostKDistinct(numbers, k) - countAtMostKDistinct(numbers, k - 1);
}
console.log(subarraysWithKDistinct([1, 2, 1, 2, 3], 2)); // 7
console.log(subarraysWithKDistinct([1, 2, 1, 3, 4], 3)); // 3</code></pre>
<p><strong>Cost:</strong> time O(n): two passes of O(n) each. Space O(k) for the map.</p>

<h3 id="ex-13">Example 13 — longest repeating character replacement</h3>
<p><strong>The problem:</strong> The same problem as <a href="#/topic/dsa-sliding-window#ex-6">Example 6</a> (LeetCode 424): repaint at most k letters to get the longest run of one letter. Interviewers often ask a follow-up: <em>"In Example 6 you never lower <code>mostCommonCount</code> when letters leave. Isn't that a bug?"</em> This example answers it by writing the "honest" version and comparing.</p>
<p><strong>The idea:</strong> The honest version works out the real most-common count of the current window (by checking all 26 counts) every time it needs it. So the window really is valid after every shrink.</p>
<div class="diagram"><pre>text = "AABABBA"   k = 1    (honest version)

right  window after shrinking  real counts   length - mostCommon  best
3      AABA      (0..3)        A3 B1         1                    4
4      AABAB -&gt; drop A -&gt; ABAB, still 2 &gt; 1,
       drop A -&gt; BAB (2..4)    A1 B2         1                    4
5      BABB      (2..5)        A1 B3         1                    4
6      BABBA -&gt; drop B -&gt; ABBA, still 2 &gt; 1,
       drop A -&gt; BBA (4..6)    A1 B2         1                    4
Answer: 4, the same as Example 6.</pre></div>
<pre><code class="language-js">function largestCount(countOf) {
  let largest = 0;
  for (let i = 0; i &lt; 26; i++) {
    if (countOf[i] &gt; largest) {
      largest = countOf[i];
    }
  }
  return largest;
}
function characterReplacementHonest(text, k) {
  const countOf = new Array(26).fill(0);
  let left = 0;
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    countOf[text.charCodeAt(right) - 65]++; // 'A' is 65, so this turns A..Z into slot 0..25
    while (right - left + 1 - largestCount(countOf) &gt; k) { // the REAL most-common count, every time
      countOf[text.charCodeAt(left) - 65]--; // the leaving letter's slot loses one
      left++;
    }
    bestLength = Math.max(bestLength, right - left + 1);
  }
  return bestLength;
}
console.log(characterReplacementHonest("AABABBA", 1)); // 4
console.log(characterReplacementHonest("ABAB", 2)); // 4</code></pre>
<p><strong>Why the shortcut in Example 6 is still right:</strong> In Example 6, a stale (too high) <code>mostCommonCount</code> can only stop the window from shrinking further. It never makes the window <em>grow</em>, so the window just slides along at its best size so far. The window grows past the best only when some letter <em>really</em> reaches a new highest count. That is exactly when a longer valid answer exists. So the recorded best is always a real answer. The honest version above is easier to explain; the shortcut saves the 26-count check.</p>
<p><strong>Cost:</strong> honest version: time O(26 × n) = O(n), space O(1). Shortcut (Example 6): time O(n), space O(1).</p>

<h3 id="ex-14">Example 14 — max consecutive 1s with k flips</h3>
<p><strong>The problem:</strong> A workout log marks each day 1 (worked out) or 0 (skipped): <code>[1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0]</code>. You may turn up to k = 2 skipped days into workout days. What is the longest streak you can make? Answer: 6.</p>
<p><strong>The idea:</strong> Find the longest window with at most k zeros inside it. State: a count of zeros. Too many zeros: shrink from the left. Record after shrinking.</p>
<div class="diagram"><pre>days = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0]   k = 2
index:  0  1  2  3  4  5  6  7  8  9  10

right  zeros  shrink?                       left  length  best
0..4   2      no                            0     5       5
5      3      drop 1,1,1, then the 0 at 3   4     2       5
6..9   2      no                            4     6       6
10     3      drop the 0 at 4               5     6       6
Answer: 6   (index 4..9, flipping the zeros at 4 and 5)</pre></div>
<pre><code class="language-js">function longestOnes(days, k) {
  let left = 0;
  let zerosInWindow = 0;
  let bestLength = 0;
  for (let right = 0; right &lt; days.length; right++) {
    if (days[right] === 0) {
      zerosInWindow++;
    }
    while (zerosInWindow &gt; k) { // more skipped days than we may flip: shrink
      if (days[left] === 0) {
        zerosInWindow--;
      }
      left++;
    }
    bestLength = Math.max(bestLength, right - left + 1);
  }
  return bestLength;
}
console.log(longestOnes([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2)); // 6
console.log(longestOnes([0, 0, 0], 0)); // 0</code></pre>
<p><strong>Cost:</strong> time O(n). Space O(1).</p>

<h3 id="ex-15">Example 15 — first negative in every window of size k</h3>
<p><strong>The problem:</strong> Daily profit figures: <code>[12, -1, -7, 8, -15, 30, 16, 28]</code>. For every window of 3 days, report the first loss (the first negative number), or 0 if there is none. Answer: <code>[-1, -1, -7, -15, -15, 0]</code>.</p>
<p><strong>The idea:</strong> A fixed window plus a simple line (a <a href="#/topic/dsa-words#w-queue">queue</a>: first in, first out) of the indexes of negative numbers. A negative joins at the back. When the front index slides out of the window, it leaves from the front. The front is the window's first negative.</p>
<div class="diagram"><pre>profits = [12, -1, -7, 8, -15, 30, 16, 28]   k = 3
index:      0   1   2  3    4   5   6   7

i  window (i-2..i)     negatives line (values)   first negative
2  12 -1 -7            [-1, -7]                  -1
3  -1 -7 8             [-1, -7]                  -1
4  -7 8 -15            [-7, -15]   (-1 left)     -7
5  8 -15 30            [-15]       (-7 left)     -15
6  -15 30 16           [-15]                     -15
7  30 16 28            []          (-15 left)    0
Answer: [-1, -1, -7, -15, -15, 0]</pre></div>
<pre><code class="language-js">function firstNegative(profits, k) {
  const result = [];
  const negativeIndexes = []; // indexes of negative numbers, oldest first
  let front = 0; // negativeIndexes[front] is the oldest one still in the window
  for (let i = 0; i &lt; profits.length; i++) {
    if (profits[i] &lt; 0) {
      negativeIndexes.push(i);
    }
    while (front &lt; negativeIndexes.length &amp;&amp; negativeIndexes[front] &lt;= i - k) {
      front++; // that negative has slid out of the window
    }
    if (i &gt;= k - 1) { // a full window ends at i
      if (front &lt; negativeIndexes.length) {
        result.push(profits[negativeIndexes[front]]);
      } else {
        result.push(0); // no negative in this window
      }
    }
  }
  return result;
}
console.log(firstNegative([12, -1, -7, 8, -15, 30, 16, 28], 3)); // [-1, -1, -7, -15, -15, 0]</code></pre>
<p><strong>Cost:</strong> time O(n): each index joins and leaves the line at most once. Space: at most k live entries (O(k) with a real deque; this array version can grow to n, as in Example 10).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>
<p>An <a href="#/topic/dsa-words#w-edge-case">edge case</a> is an unusual input at the limits: empty, size 1, all the same, and so on. Each item below says what goes wrong, gives a tiny example, and gives the fix.</p>

<h3>1. Empty input</h3>
<p><strong>What goes wrong:</strong> With an empty array or string, the <code>for</code> loop never runs. That is fine only if your starting answer is the right "nothing" value.</p>
<p><strong>Tiny example:</strong> <code>lengthOfLongestSubstring("")</code> should be 0. A shortest-window function that starts at <code>Infinity</code> and forgets to convert it would return <code>Infinity</code>.</p>
<p><strong>Fix:</strong> Start "longest" answers at 0. Convert a leftover <code>Infinity</code> to 0, -1 or <code>""</code>. Or check for empty input at the top.</p>

<h3>2. k larger than array length</h3>
<p><strong>What goes wrong:</strong> A fixed window of size 5 cannot fit in 3 items. The "build the first window" loop reads <code>items[3]</code> and <code>items[4]</code>, which are <code>undefined</code>, and the sum becomes <code>NaN</code> (not a number).</p>
<p><strong>Tiny example:</strong> Without a size check, <code>maxSumOfK([4, 2], 3)</code> would add 4 + 2 + undefined = NaN.</p>
<p><strong>Fix:</strong> Check <code>k &gt; items.length</code> first and return what the problem asks for (0, <code>null</code>, or the whole-array answer), as <a href="#/topic/dsa-sliding-window#ex-1">Example 1</a> does.</p>

<h3>3. k = 0</h3>
<p><strong>What goes wrong:</strong> "At most 0 different letters" allows only the empty window. A fixed window of size 0 divides by zero for averages.</p>
<p><strong>Tiny example:</strong> <code>longestWithAtMostKDistinct("aa", 0)</code> must return 0. The code works because the shrink loop empties the window every time, but many hand-written versions break.</p>
<p><strong>Fix:</strong> Decide the k = 0 answer up front and return it, or test your code with k = 0.</p>

<h3>4. All identical elements</h3>
<p><strong>What goes wrong:</strong> Nothing, if your code is right. But it is a good test: with <code>"aaaa"</code> and "at most k different" (k ≥ 1), the answer is the whole length, 4. "No repeats" gives 1.</p>
<p><strong>Tiny example:</strong> <code>lengthOfLongestSubstring("bbbb")</code> is 1; <code>longestWithAtMostKDistinct("bbbb", 1)</code> is 4.</p>
<p><strong>Fix:</strong> Run both checks in your head before saying you are done.</p>

<h3>5. Negative numbers in product window</h3>
<p><strong>What goes wrong:</strong> A negative number flips the product's sign. A product can jump from big-negative to big-positive, so "shrink while the product is too big" stops making sense. Zero is a problem too: dividing it out means dividing by 0.</p>
<p><strong>Tiny example:</strong> In <code>[-2, 3, -4]</code>, the product of the window goes -2 → -6 → 24. Taking in a number made it jump past the limit from far below.</p>
<p><strong>Fix:</strong> The product window (<a href="#/topic/dsa-sliding-window#ex-11">Example 11</a>) needs positive numbers. With negatives or zeros, split the array at the zeros and track the count of negatives, or use a <a href="#/topic/dsa-words#w-dp">DP</a> that keeps both the biggest and smallest product ending at each index.</p>

<h3>6. Window invariant on first iteration</h3>
<p><strong>What goes wrong:</strong> An <a href="#/topic/dsa-words#w-invariant">invariant</a> is a fact your loop keeps true at every step, like "<code>windowSum</code> equals the sum of the items between <code>left</code> and <code>right</code>". At <code>right = 0</code> the window has just 1 item. Code that assumes at least 2 items, or reads <code>items[right - 1]</code>, breaks here.</p>
<p><strong>Tiny example:</strong> A check like <code>items[right] === items[right - 1]</code> reads <code>items[-1]</code>, which is <code>undefined</code>, on the first step.</p>
<p><strong>Fix:</strong> Trace your code by hand for a window of size 1 before anything else.</p>

<h3>7. Min length when no valid window</h3>
<p><strong>What goes wrong:</strong> For "shortest window" problems you start <code>bestLength</code> at <code>Infinity</code> (a <a href="#/topic/dsa-words#w-sentinel">sentinel</a> meaning "nothing yet"). If no window ever passes, the function returns <code>Infinity</code>.</p>
<p><strong>Tiny example:</strong> <code>minSubArrayLen(100, [1, 2, 3])</code> must be 0, not Infinity.</p>
<p><strong>Fix:</strong> At the end, <code>if (bestLength === Infinity) return 0;</code> (or -1 or <code>""</code>, whatever the problem says).</p>

<h3>8. Counting subarrays vs lengths</h3>
<p><strong>What goes wrong:</strong> "How many subarrays" and "how long is the longest" look alike but need different lines. Mixing them up gives a confident wrong number.</p>
<p><strong>Tiny example:</strong> For <code>[10, 5, 2, 6]</code>, k = 100: the longest window with product &lt; 100 has length 3, but the <em>count</em> of such windows is 8.</p>
<p><strong>Fix:</strong> Counting: <code>total += right - left + 1</code> on every step (the good subarrays ending at <code>right</code>). Longest: <code>bestLength = Math.max(bestLength, right - left + 1)</code>.</p>

<h3>9. Map vs fixed-size array for counts</h3>
<p><strong>What goes wrong:</strong> Using a 26-slot array when the input can contain capitals, digits or spaces. <code>" ".charCodeAt(0) - 97</code> is -65, which is not a valid slot. JavaScript does not complain: it quietly writes NaN into a property named "-65", and the space is never counted.</p>
<p><strong>Tiny example:</strong> Counting letters of <code>"a b"</code> with a 26-array miscounts the space.</p>
<p><strong>Fix:</strong> Only lowercase a–z (as the problem promises) → array of 26. Anything else → a Map. Say which one you chose and why.</p>

<h3>10. Forgetting to delete from Map at zero</h3>
<p><strong>What goes wrong:</strong> When a value's count drops to 0, it is no longer in the window, but its key is still in the Map. Then <code>map.size</code> counts it as a kind that is still present.</p>
<p><strong>Tiny example:</strong> Window "ab" slides to "b". If you only set 'a' to 0, <code>map.size</code> is still 2, and an "at most 1 kind" check shrinks for no reason.</p>
<p><strong>Fix:</strong> <code>if (remaining === 0) { map.delete(value); } else { map.set(value, remaining); }</code>, as in <a href="#/topic/dsa-sliding-window#ex-3">Example 3</a>. Or keep your own <code>distinctCount</code> variable and lower it when a count reaches 0.</p>

<h3>11. Off-by-one in fixed window slide</h3>
<p><strong>What goes wrong:</strong> Removing the wrong item when the window slides. With the window ending at <code>right</code>, the item leaving is <code>items[right - k]</code>, not <code>items[right - k + 1]</code> or <code>items[right - 1]</code>.</p>
<p><strong>Tiny example:</strong> k = 3, <code>right = 3</code>: the new window is indexes 1..3, so the item leaving is index 0 = <code>3 - 3</code>.</p>
<p><strong>Fix:</strong> Check the first slide by hand: when <code>right</code> equals k, the item leaving must be index 0.</p>

<h3>12. Sliding window deque with non-numeric comparisons</h3>
<p><strong>What goes wrong:</strong> The monotonic deque compares values with <code>&lt;</code> and <code>&gt;</code>. On strings, JavaScript compares letter by letter (dictionary order), not by number.</p>
<p><strong>Tiny example:</strong> <code>"10" &lt; "9"</code> is <code>true</code>, because "1" comes before "9". Readings stored as strings give the wrong maximum.</p>
<p><strong>Fix:</strong> Convert to numbers first (<code>Number(x)</code>), or compare with a function that matches what "biggest" means for your data.</p>

<h3>13. "Exactly K" — using "at most" subtraction</h3>
<p><strong>What goes wrong:</strong> Trying to use atMost(K) − atMost(K − 1) for the <em>longest</em> or <em>shortest</em> window with exactly K. Subtraction works for counts, not for lengths.</p>
<p><strong>Tiny example:</strong> In <code>"aabbcc"</code>: the longest window with at most 2 kinds is 4 ("aabb"), and with at most 1 kind it is 2 ("aa"). 4 − 2 = 2, but the longest window with exactly 2 kinds is 4.</p>
<p><strong>Fix:</strong> Use the subtraction only to count windows. For longest-with-exactly-K, use the "at most K" loop and only record when the window has exactly K kinds.</p>

<h3>14. Counting subarrays product less than k with k ≤ 1</h3>
<p><strong>What goes wrong:</strong> If every number is at least 1, every product is at least 1, so nothing is "less than 1". The shrink loop then empties the window and keeps dividing with <code>left</code> past <code>right</code>.</p>
<p><strong>Tiny example:</strong> <code>[1, 2, 3]</code> with k = 1: the answer is 0.</p>
<p><strong>Fix:</strong> <code>if (k &lt;= 1) return 0;</code> before the loop, as in <a href="#/topic/dsa-sliding-window#ex-11">Example 11</a>.</p>

<h3>15. Sliding window with multiple constraints</h3>
<p><strong>What goes wrong:</strong> Some problems have two rules at once, for example "at most k different values AND length at most L". Checking only one of them in the shrink loop gives windows that break the other.</p>
<p><strong>Tiny example:</strong> At most 2 kinds and length ≤ 3, on <code>"aaaa"</code>: the 2-kinds rule alone allows length 4, which is too long.</p>
<p><strong>Fix:</strong> Shrink while <em>either</em> rule is broken: <code>while (map.size &gt; k || right - left + 1 &gt; maxLength)</code>. Record only after both hold.</p>

<h3>16. Sliding window — when to record vs not</h3>
<p><strong>What goes wrong:</strong> Recording in the wrong place gives answers for windows that break the rule.</p>
<p><strong>Tiny example:</strong> Recording a <em>longest</em> answer before shrinking can record a window with 3 kinds when only 2 are allowed.</p>
<p><strong>Fix:</strong> Longest → record after the shrink loop. Shortest → record inside it, while the window still passes. See "answer tracking" in the Mental Model.</p>

<h3>17. right - left + 1 vs right - left</h3>
<p><strong>What goes wrong:</strong> A window from index 2 to index 4 holds 3 items (2, 3 and 4), but <code>4 - 2</code> is 2.</p>
<p><strong>Tiny example:</strong> A one-item window has <code>left === right</code>; its length is <code>right - left + 1 = 1</code>, not 0.</p>
<p><strong>Fix:</strong> Both ends are inside the window, so always add 1: <code>right - left + 1</code>. (If you write windows as <a href="#/topic/dsa-words#w-half-open-range">half-open</a>, with <code>right</code> one past the end, then the length is <code>right - left</code>. Pick one style and stick with it.)</p>

<h3>18. Streaming variant</h3>
<p><strong>What goes wrong:</strong> If the numbers arrive one at a time (a live stream) and you don't keep them, you can't read <code>items[left]</code> later to remove it.</p>
<p><strong>Tiny example:</strong> A "last 5 readings" average on a sensor that never stores history cannot subtract the reading that is leaving.</p>
<p><strong>Fix:</strong> Keep just the window's own items in a small <a href="#/topic/dsa-words#w-queue">queue</a> (or a <a href="#/topic/dsa-words#w-deque">deque</a>): push each new item, and remove from the front when it leaves. Memory stays O(k), not O(n).</p>

<h3>19. Sliding window max — front of deque</h3>
<p><strong>What goes wrong:</strong> Reading the front of the monotonic deque as the answer without first checking that its index is still inside the window.</p>
<p><strong>Tiny example:</strong> In <a href="#/topic/dsa-sliding-window#ex-10">Example 10</a> at i = 4, the front is the 3 at index 1, but the window is now indexes 2..4. Reporting 3 would be wrong; the answer is 5.</p>
<p><strong>Fix:</strong> At each step, first remove front indexes that are <code>&lt;= i - k</code>, then read the front.</p>

<h3>20. Counting subarrays with sum &lt; X (negative numbers)</h3>
<p><strong>What goes wrong:</strong> The window relies on one fact: taking in an item makes the sum bigger, and dropping one makes it smaller. With negative numbers that fact is false, so you no longer know which way to move. The rule is no longer <a href="#/topic/dsa-words#w-monotonic">monotonic</a> (moving one way only).</p>
<p><strong>Tiny example:</strong> In <code>[5, -10, 5]</code>, the sum goes 5 → -5 → 0 as the window grows. Taking in -10 made it smaller.</p>
<p><strong>Fix:</strong> Switch from a window to <a href="#/topic/dsa-words#w-prefix-sum">prefix sums</a> (running totals). The sum of any subarray is "running total at its end minus running total before its start", so the question becomes "how many pairs of running totals differ by less than X?". For the exactly-equal version, see Q11 (prefix sum + hash map). For the "less than X" version, keep the earlier running totals in sorted order and use <a href="#/topic/dsa-words#w-binary-search">binary search</a> (repeatedly halving the search range) to count how many are big enough.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>
<p>An "anti-pattern" is a common way of writing it that looks fine but is wrong or slow.</p>

<h3>Anti-pattern 1 — using sliding window with negative numbers</h3>
<p><strong>What goes wrong:</strong> For sum problems with negatives, dropping an item can make the sum <em>go up</em>, so the shrink loop stops too early or too late.</p>
<p><strong>Tiny example:</strong> Shortest subarray with sum ≥ 4 in <code>[-1, 4]</code>. The window [-1, 4] has sum 3, below 4, so the code never shrinks and returns 0. But [4] alone works: the answer is 1.</p>
<p><strong>Fix:</strong> Use prefix sums + a hash map (exact sums, Q11), prefix sums + a monotonic deque (shortest with sum ≥ K), or <a href="#/topic/dsa-words#w-kadane">Kadane's algorithm</a> (best sum of any subarray).</p>

<h3>Anti-pattern 2 — recording in the wrong place</h3>
<p><strong>What goes wrong:</strong> "Shortest with sum ≥ target" needs the record <em>inside</em> the shrink loop; "longest with at most k" needs it <em>after</em>. Swapping them gives wrong answers.</p>
<p><strong>Tiny example:</strong> In Example 4, recording after the loop measures a window that has already dropped below the target.</p>
<p><strong>Fix:</strong> Ask: "Is the window valid at this line?" Only record where the answer is yes.</p>

<h3>Anti-pattern 3 — Map size for "distinct count"</h3>
<p><strong>What goes wrong:</strong> Using <code>map.size</code> as "how many different values are in the window" while leaving keys with count 0 in the Map.</p>
<p><strong>Tiny example:</strong> Window "abc" shrinks to "c". If 'a' and 'b' are set to 0 but not deleted, <code>map.size</code> is 3, not 1.</p>
<p><strong>Fix:</strong> Delete keys at 0, or keep a separate <code>distinctCount</code> that you raise when a count goes 0 → 1 and lower when it goes 1 → 0.</p>

<h3>Anti-pattern 4 — re-computing window state from scratch</h3>
<p><strong>What goes wrong:</strong> Adding up the whole window (or recounting its letters) at every step. That is the slow way from What &amp; Why: O(n × k), which is O(n²) when the window is large.</p>
<p><strong>Tiny example:</strong> <code>bestStreakSlow</code> in What &amp; Why: about 100 million additions for 100,000 items with k = 1,000.</p>
<p><strong>Fix:</strong> Update, don't rebuild: add the item entering, remove the item leaving.</p>

<h3>Anti-pattern 5 — confusing fixed and variable</h3>
<p><strong>What goes wrong:</strong> Writing a shrink loop for a fixed-size problem, or a fixed slide for a variable one.</p>
<p><strong>Tiny example:</strong> "Longest substring with at most k distinct" is <em>variable</em> (the length is the answer). "Max sum of k consecutive" is <em>fixed</em> (the length is given).</p>
<p><strong>Fix:</strong> If the question gives the window size, it is fixed. If it asks for a length, it is variable.</p>

<h3>Anti-pattern 6 — forgetting to advance left after recording min-length</h3>
<p><strong>What goes wrong:</strong> In a "shortest" problem you record inside the <code>while</code> loop. If you record but forget <code>left++</code> (and removing the item), the window never changes and the loop runs forever.</p>
<p><strong>Tiny example:</strong> In Example 4, deleting the <code>left++</code> line makes <code>minSubArrayLen(7, [2, 3, 1, 2, 4, 3])</code> hang.</p>
<p><strong>Fix:</strong> Every pass of a shrink loop must remove <code>items[left]</code> from the state and then do <code>left++</code>.</p>

<h3>Anti-pattern 7 — sliding window for sorted input two-sum</h3>
<p><strong>What goes wrong:</strong> "Find two numbers in a sorted array that add up to X" is not about a side-by-side stretch, so a window doesn't fit it.</p>
<p><strong>Tiny example:</strong> In <code>[1, 3, 4, 6, 9]</code> with X = 10, the pair is 1 and 9: the two ends, nowhere near each other.</p>
<p><strong>Fix:</strong> Use <a href="#/topic/dsa-words#w-two-pointers">two pointers</a> starting at both ends: if the sum is too small, move the left one in; if too big, move the right one in. See <a href="#/topic/dsa-two-pointers">Two Pointers</a>.</p>

<h3>Anti-pattern 8 — incorrect formed/required tracking</h3>
<p><strong>What goes wrong:</strong> In minimum window substring, raising <code>formed</code> (<code>lettersSatisfied</code>) every time a needed letter comes in, instead of only when its count <em>reaches exactly</em> the amount needed.</p>
<p><strong>Tiny example:</strong> Pattern "AB", text "AAB". With "raise on every A", formed is already 2 after "AA", and "AA" is wrongly reported as covering "AB".</p>
<p><strong>Fix:</strong> Raise when <code>count === need</code> (not <code>&gt;=</code>); lower when <code>count &lt; need</code> after removing. See <a href="#/topic/dsa-sliding-window#ex-9">Example 9</a>.</p>

<h3>Anti-pattern 9 — fixed-size window with k = 0</h3>
<p><strong>What goes wrong:</strong> A window of size 0 holds nothing. The first-window loop doesn't run, the slide reads <code>items[right - 0]</code> as both entering and leaving, and averages divide by 0.</p>
<p><strong>Tiny example:</strong> <code>findAverages([1, 2, 3], 0)</code> would push <code>0 / 0 = NaN</code>.</p>
<p><strong>Fix:</strong> Check <code>k &lt;= 0</code> at the top and return what the problem expects.</p>

<h3>Anti-pattern 10 — sliding window for non-contiguous problems</h3>
<p><strong>What goes wrong:</strong> A window is always a side-by-side stretch. "Pick the best k items from anywhere" is a different problem.</p>
<p><strong>Tiny example:</strong> "The 3 biggest numbers in <code>[9, 1, 8, 2, 7]</code>" are 9, 8, 7, which are not next to each other.</p>
<p><strong>Fix:</strong> Use a <a href="#/topic/dsa-words#w-heap">heap</a>, sorting, or <a href="#/topic/dsa-words#w-dp">DP</a>, depending on the problem. If the question says <a href="#/topic/dsa-words#w-subsequence">subsequence</a> or <a href="#/topic/dsa-words#w-subset">subset</a>, it is not a window.</p>

<h3>Anti-pattern 11 — maxCount in character-replacement not decreasing</h3>
<p><strong>What goes wrong:</strong> Nothing breaks, but it confuses people. In <a href="#/topic/dsa-sliding-window#ex-6">Example 6</a>, <code>mostCommonCount</code> is never lowered when letters leave, so it can be "stale": higher than the real count in the current window.</p>
<p><strong>Tiny example:</strong> In "AABABBA" at <code>right = 4</code>, the window shrinks to "ABAB" (A2, B2), but <code>mostCommonCount</code> still says 3.</p>
<p><strong>Fix:</strong> Know why it is safe (the window never grows past a real answer; see <a href="#/topic/dsa-sliding-window#ex-13">Example 13</a>), or use the honest version that recounts. Either is fine if you can explain it.</p>

<h3>Anti-pattern 12 — window not advancing</h3>
<p><strong>What goes wrong:</strong> A loop where neither edge moves in some round runs forever.</p>
<p><strong>Tiny example:</strong> A hand-written <code>while (right &lt; n)</code> loop that only moves <code>right</code> inside an <code>if</code>: when the <code>if</code> is false, nothing moves.</p>
<p><strong>Fix:</strong> Use a <code>for</code> loop for <code>right</code>, so it moves exactly once per round, and make every pass of the shrink loop move <code>left</code>.</p>

<h3>Anti-pattern 13 — Map.get(undefined) returns undefined</h3>
<p><strong>What goes wrong:</strong> <code>map.get(key)</code> for a key that is not there returns <code>undefined</code>, and <code>undefined + 1</code> is <code>NaN</code>.</p>
<p><strong>Tiny example:</strong> <code>const counts = new Map(); counts.set("a", counts.get("a") + 1);</code> stores NaN.</p>
<p><strong>Fix:</strong> Read the old count into a variable first, treating "missing" as 0, then add 1:</p>
<pre><code class="language-js">const counts = new Map();
const letter = "a";
let current = 0; // missing means 0
if (counts.has(letter)) {
  current = counts.get(letter);
}
counts.set(letter, current + 1);
console.log(counts.get(letter)); // 1</code></pre>

<h3>Anti-pattern 14 — computing best in wrong scope</h3>
<p><strong>What goes wrong:</strong> Some code only records inside the shrink loop, so a window that is valid from the start, and never needs shrinking, is never recorded.</p>
<p><strong>Tiny example:</strong> "Longest with at most 2 kinds" on <code>"aab"</code>: the shrink loop never runs. If the record line sits inside it, the answer comes out as 0 instead of 3.</p>
<p><strong>Fix:</strong> For each problem, ask which windows count as answers, and make sure every one of them reaches the record line.</p>

<h3>Anti-pattern 15 — shifting from front of array as deque</h3>
<p><strong>What goes wrong:</strong> <code>array.shift()</code> removes the first item, but it moves every other item down one place. That costs O(size), so the "O(n)" deque solution becomes slower.</p>
<p><strong>Tiny example:</strong> A deque holding 10,000 indexes: each <code>shift()</code> moves 9,999 items.</p>
<p><strong>Fix:</strong> Keep a <code>front</code> number and do <code>front++</code> instead (as in <a href="#/topic/dsa-sliding-window#ex-10">Example 10</a> and <a href="#/topic/dsa-sliding-window#ex-15">Example 15</a>), or use a real deque. In an interview, using <code>shift()</code> is fine for small inputs if you say out loud that it is O(k).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. When to use sliding window?</div>
  <div class="qa-answer">
    <p>When the question asks for the best <em>side-by-side</em> stretch (a subarray or substring) that follows a rule, and the rule only gets more broken as the stretch grows. Classic examples:</p>
    <ul>
      <li>Max sum of k consecutive items (fixed window).</li>
      <li>Longest substring with no repeated letter (variable).</li>
      <li>Smallest subarray with sum ≥ target (variable).</li>
      <li>Longest stretch with at most K different values (variable).</li>
      <li>Shortest window containing every letter of a pattern (variable).</li>
    </ul>
    <p>The hint: the brute force tries every stretch, which is O(n²) or worse. The window gets it to O(n) by updating the stretch instead of rebuilding it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why is sliding window O(n)?</div>
  <div class="qa-answer">
    <p>Each item enters the window once (when <code>right</code> reaches it) and leaves at most once (when <code>left</code> passes it). Both pointers only move forward, so together they make at most 2n moves. The inner <code>while</code> loop can run many times in one round, but its <em>total</em> over the whole run is at most n. So the work is about 2n steps: O(n), counted in the amortized way (the total over the run, not the worst single round).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Implement longest substring without repeating chars.</div>
  <div class="qa-answer">
    <p>Keep a Map from each letter to the last index it was seen. If the new letter was last seen inside the window, jump <code>left</code> just past it. Record after the jump.</p>
<pre><code class="language-js">function lengthOfLongestSubstring(text) {
  const lastSeenAt = new Map(); // letter -&gt; last index seen
  let left = 0;
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const letter = text[right];
    if (lastSeenAt.has(letter) &amp;&amp; lastSeenAt.get(letter) &gt;= left) {
      left = lastSeenAt.get(letter) + 1; // jump past the copy inside the window
    }
    lastSeenAt.set(letter, right);
    bestLength = Math.max(bestLength, right - left + 1);
  }
  return bestLength;
}
console.log(lengthOfLongestSubstring("pwwkew")); // 3  ("wke")</code></pre>
    <p>Time O(n). Space O(min(n, alphabet size)). Trace: <a href="#/topic/dsa-sliding-window#ex-2">Example 2</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Smallest subarray with sum ≥ target.</div>
  <div class="qa-answer">
<pre><code class="language-js">function minSubArrayLen(target, numbers) {
  let left = 0;
  let windowSum = 0;
  let bestLength = Infinity; // "nothing yet"
  for (let right = 0; right &lt; numbers.length; right++) {
    windowSum += numbers[right];
    while (windowSum &gt;= target) { // valid: record, then try shorter
      bestLength = Math.min(bestLength, right - left + 1);
      windowSum -= numbers[left];
      left++;
    }
  }
  if (bestLength === Infinity) {
    return 0;
  }
  return bestLength;
}
console.log(minSubArrayLen(7, [2, 3, 1, 2, 4, 3])); // 2</code></pre>
    <p>A variable window; record <em>inside</em> the shrink loop. It only works when the numbers are not negative, because it relies on "dropping an item lowers the sum". O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Permutation in string (anagram present?).</div>
  <div class="qa-answer">
    <p>Use a fixed window as long as the short string. Keep 26 letter counts for the window and 26 for the short string. Each slide adds the entering letter and removes the leaving one. If the two sets of counts are equal, the window is a reordering of the short string, so return true. Time O(26 × n) = O(n), space O(1). Full code: <a href="#/topic/dsa-sliding-window#ex-7">Example 7</a>.</p>
    <p>A small speed-up worth mentioning: instead of comparing all 26 counts each step, keep a number <code>matches</code> = how many of the 26 slots are currently equal, and update it only for the two slots that changed. That makes each step O(1).</p>
<pre><code class="language-js">function sameCounts(countsA, countsB) {
  for (let i = 0; i &lt; 26; i++) {
    if (countsA[i] !== countsB[i]) {
      return false;
    }
  }
  return true;
}
function checkInclusion(pattern, text) {
  if (pattern.length &gt; text.length) {
    return false; // the window cannot even fit
  }
  const needCount = new Array(26).fill(0); // letter counts of the pattern
  const windowCount = new Array(26).fill(0); // letter counts inside the window
  for (let i = 0; i &lt; pattern.length; i++) {
    needCount[pattern.charCodeAt(i) - 97]++; // 'a' has code 97, so 'a' -&gt; slot 0
  }
  const size = pattern.length; // the window is always exactly this long
  for (let right = 0; right &lt; text.length; right++) {
    windowCount[text.charCodeAt(right) - 97]++; // letter entering on the right ('a' is 97, so a..z -&gt; slot 0..25)
    if (right &gt;= size) {
      windowCount[text.charCodeAt(right - size) - 97]--; // letter leaving on the left (same a..z -&gt; 0..25 slot)
    }
    if (right &gt;= size - 1 &amp;&amp; sameCounts(needCount, windowCount)) {
      return true; // a full-size window with the same letters
    }
  }
  return false;
}
console.log(checkInclusion("ab", "eidbaooo")); // true
console.log(checkInclusion("ab", "eidboaoo")); // false</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Min window substring.</div>
  <div class="qa-answer">
    <p>Build a "need" map from the pattern. Stretch <code>right</code>, counting letters in a "window" map. Keep <code>formed</code>: how many different letters have reached their needed count. When <code>formed</code> equals <code>required</code> (the number of different letters needed), the window covers the pattern. Then shrink while it still covers it, recording the shortest. Raise <code>formed</code> only when a count becomes <em>exactly</em> the needed amount; lower it when a count drops below. Full code and trace: <a href="#/topic/dsa-sliding-window#ex-9">Example 9</a>.</p>
<pre><code class="language-js">function minWindow(text, pattern) {
  const needCount = new Map(); // letter -&gt; how many the pattern needs
  for (const letter of pattern) {
    let current = 0;
    if (needCount.has(letter)) {
      current = needCount.get(letter);
    }
    needCount.set(letter, current + 1);
  }
  const lettersToSatisfy = needCount.size; // "required": different letters we must fully cover
  let lettersSatisfied = 0; // "formed": how many of those the window covers right now
  const windowCount = new Map(); // letter -&gt; how many are inside the window
  let left = 0;
  let bestLength = Infinity;
  let bestStart = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const entering = text[right];
    let enteringCount = 0;
    if (windowCount.has(entering)) {
      enteringCount = windowCount.get(entering);
    }
    enteringCount = enteringCount + 1;
    windowCount.set(entering, enteringCount);
    if (needCount.has(entering) &amp;&amp; enteringCount === needCount.get(entering)) {
      lettersSatisfied++; // this letter just reached the amount we need (exactly, so it counts once)
    }
    while (lettersSatisfied === lettersToSatisfy) { // window covers everything: record, then shrink
      const windowLength = right - left + 1;
      if (windowLength &lt; bestLength) {
        bestLength = windowLength;
        bestStart = left;
      }
      const leaving = text[left];
      const leavingCount = windowCount.get(leaving) - 1;
      windowCount.set(leaving, leavingCount);
      if (needCount.has(leaving) &amp;&amp; leavingCount &lt; needCount.get(leaving)) {
        lettersSatisfied--; // we just dropped below what we need of this letter
      }
      left++;
    }
  }
  if (bestLength === Infinity) {
    return ""; // the text never covered the whole pattern
  }
  return text.slice(bestStart, bestStart + bestLength);
}
console.log(minWindow("ADOBECODEBANC", "ABC")); // "BANC"
console.log(minWindow("a", "aa")); // ""  (needs two a's, only one exists)</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Sliding window maximum (monotonic deque).</div>
  <div class="qa-answer">
    <p>Keep a line of indexes whose values go down from front to back. For each new item: (1) remove the front if its index has slid out of the window; (2) remove from the back every index whose value is smaller than the new one, because they can never be the max again; (3) add the new index at the back. Once the first full window is reached, the front is that window's max. Full code and trace: <a href="#/topic/dsa-sliding-window#ex-10">Example 10</a>.</p>
    <p>O(n) amortized: each index is added once and removed at most once. Space O(k) with a real deque (the simple array version in Example 10 leaves used slots behind <code>front</code>, so it can grow to n slots).</p>
<pre><code class="language-js">function maxSlidingWindow(numbers, k) {
  const result = [];
  const candidates = []; // indexes; their values go DOWN from front to back
  let front = 0; // candidates[front] is the real front of the line (moving it is O(1), unlike shift())
  for (let i = 0; i &lt; numbers.length; i++) {
    while (front &lt; candidates.length &amp;&amp; candidates[front] &lt;= i - k) {
      front++; // the front index has slid out of the window on the left
    }
    while (candidates.length &gt; front &amp;&amp; numbers[candidates[candidates.length - 1]] &lt; numbers[i]) {
      candidates.pop(); // older and smaller than numbers[i]: it can never be a window's max again
    }
    candidates.push(i);
    if (i &gt;= k - 1) {
      result.push(numbers[candidates[front]]); // the first full window ends at i = k - 1
    }
  }
  return result;
}
console.log(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)); // [3, 3, 5, 5, 6, 7]</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Longest repeating character replacement.</div>
  <div class="qa-answer">
    <p>In a window, the letters to repaint = window length − count of the most common letter. If that is more than k, shrink. Record after shrinking. Count letters in an array of 26. The classic version never lowers its most-common count; that is safe because the window then only slides without growing, and it grows only when a real new record count appears. Code: <a href="#/topic/dsa-sliding-window#ex-6">Example 6</a> (shortcut) and <a href="#/topic/dsa-sliding-window#ex-13">Example 13</a> (honest version). O(n) time, O(1) space.</p>
<pre><code class="language-js">function characterReplacement(text, k) {
  const countOf = new Array(26).fill(0); // countOf[0] = how many 'A' in the window, countOf[1] = 'B', ...
  let left = 0;
  let mostCommonCount = 0; // the highest single-letter count seen in any window so far
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const slot = text.charCodeAt(right) - 65; // 'A' has code 65, so 'A' -&gt; 0, 'B' -&gt; 1, ...
    countOf[slot]++;
    mostCommonCount = Math.max(mostCommonCount, countOf[slot]);
    let windowLength = right - left + 1;
    while (windowLength - mostCommonCount &gt; k) { // needs more than k repaints: shrink
      const leavingSlot = text.charCodeAt(left) - 65; // 'A' is 65, so this turns A..Z into slot 0..25
      countOf[leavingSlot]--;
      left++;
      windowLength = right - left + 1;
    }
    bestLength = Math.max(bestLength, windowLength);
  }
  return bestLength;
}
console.log(characterReplacement("AABABBA", 1)); // 4
console.log(characterReplacement("ABAB", 2)); // 4</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Longest substring with at most K distinct.</div>
  <div class="qa-answer">
    <p>A frequency map of the window; its <code>.size</code> is the number of different letters. Take in <code>text[right]</code>; while <code>size &gt; K</code>, lower the count of <code>text[left]</code>, delete it at 0, and move <code>left</code>. Record <code>right - left + 1</code> after shrinking. O(n) time, O(K) space. Full code: <a href="#/topic/dsa-sliding-window#ex-3">Example 3</a>.</p>
<pre><code class="language-js">function longestWithAtMostKDistinct(text, k) {
  const countInWindow = new Map(); // letter -&gt; how many times it is inside the window
  let left = 0;
  let bestLength = 0;
  for (let right = 0; right &lt; text.length; right++) {
    const entering = text[right];
    let enteringCount = 0; // a letter we have not seen counts as 0
    if (countInWindow.has(entering)) {
      enteringCount = countInWindow.get(entering);
    }
    countInWindow.set(entering, enteringCount + 1);
    while (countInWindow.size &gt; k) { // too many different letters: shrink
      const leaving = text[left];
      const leavingCount = countInWindow.get(leaving) - 1;
      if (leavingCount === 0) {
        countInWindow.delete(leaving); // gone from the window, so it no longer counts as a kind
      } else {
        countInWindow.set(leaving, leavingCount);
      }
      left++;
    }
    bestLength = Math.max(bestLength, right - left + 1);
  }
  return bestLength;
}
function longestSubstringTwoDistinct(text) {
  return longestWithAtMostKDistinct(text, 2);
}
console.log(longestSubstringTwoDistinct("eceba")); // 3
console.log(longestSubstringTwoDistinct("ccaabbb")); // 5  ("aabbb")
console.log(longestWithAtMostKDistinct("aa", 0)); // 0  (k = 0 allows only the empty window)</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Subarrays with exactly K distinct (the trick).</div>
  <div class="qa-answer">
    <p>Exactly K = atMost(K) − atMost(K − 1). The "at most" count is easy: each step adds <code>right - left + 1</code>. Subtracting the looser count from the other leaves exactly the windows with K kinds, the same way "people aged at most 30 minus people aged at most 29" leaves the 30-year-olds.</p>
<pre><code class="language-js">function countAtMostKDistinct(numbers, k) {
  const countInWindow = new Map();
  let left = 0;
  let total = 0;
  for (let right = 0; right &lt; numbers.length; right++) {
    let current = 0;
    if (countInWindow.has(numbers[right])) {
      current = countInWindow.get(numbers[right]);
    }
    countInWindow.set(numbers[right], current + 1);
    while (countInWindow.size &gt; k) {
      const leavingCount = countInWindow.get(numbers[left]) - 1;
      if (leavingCount === 0) {
        countInWindow.delete(numbers[left]);
      } else {
        countInWindow.set(numbers[left], leavingCount);
      }
      left++;
    }
    total += right - left + 1; // good subarrays ending at right
  }
  return total;
}
function subarraysWithKDistinct(numbers, k) {
  return countAtMostKDistinct(numbers, k) - countAtMostKDistinct(numbers, k - 1);
}
console.log(subarraysWithKDistinct([1, 2, 1, 2, 3], 2)); // 7</code></pre>
    <p>Each call is O(n); two calls are still O(n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Subarrays with sum exactly K (with negatives)?</div>
  <div class="qa-answer">
    <p>A sliding window doesn't work here, because with negative numbers dropping an item can make the sum go up. Use a <a href="#/topic/dsa-words#w-prefix-sum">prefix sum</a> (the running total so far) and a <a href="#/topic/dsa-words#w-hash-map">hash map</a> of how many times each running total has appeared.</p>
    <p>The idea: if the running total now is 10 and K is 3, every earlier point where the running total was 7 starts a subarray that sums to exactly 3. So look up how many times you have seen <code>runningTotal - K</code>.</p>
<pre><code class="language-js">function subarraySum(numbers, k) {
  const timesSeen = new Map(); // running total -&gt; how many times we have seen it
  timesSeen.set(0, 1); // the empty start: a running total of 0, seen once
  let runningTotal = 0;
  let count = 0;
  for (const value of numbers) {
    runningTotal += value;
    const needed = runningTotal - k; // an earlier total that would leave exactly k
    if (timesSeen.has(needed)) {
      count += timesSeen.get(needed);
    }
    let seenSoFar = 0;
    if (timesSeen.has(runningTotal)) {
      seenSoFar = timesSeen.get(runningTotal);
    }
    timesSeen.set(runningTotal, seenSoFar + 1);
  }
  return count;
}
console.log(subarraySum([1, -1, 1, 1], 2)); // 2  ([1, 1] and [1, -1, 1, 1])
console.log(subarraySum([1, 1, 1], 2)); // 2</code></pre>
    <p>O(n) time, O(n) space for the map.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. When does sliding window NOT work?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Negative numbers in sum problems:</strong> dropping an item no longer always lowers the sum, so you can't tell which way to move.</li>
      <li><strong>Items need not be side by side:</strong> <a href="#/topic/dsa-words#w-subsequence">subsequence</a> or <a href="#/topic/dsa-words#w-subset">subset</a> problems.</li>
      <li><strong>You need to compare several windows at once,</strong> or the rule does not get steadily worse as the window grows (for example "exactly k" when you want a length).</li>
    </ul>
    <p>Alternatives: prefix sum + hash map, <a href="#/topic/dsa-words#w-dp">DP</a>, <a href="#/topic/dsa-words#w-two-pointers">two pointers</a> from both ends, or a <a href="#/topic/dsa-words#w-heap">heap</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Fixed vs variable — how to choose?</div>
  <div class="qa-answer">
    <p>If the question gives the size ("subarray of size k", "every window of k") → fixed. If it asks you to find a length, or has a limit ("longest", "shortest", "at most", "at least") → variable. Some problems mix both, like "the maximum of every window of size k": a fixed window with extra state (the deque). Pick the template from what is given and what is asked.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How to count subarrays in sliding window?</div>
  <div class="qa-answer">
    <p>Once the window <code>[left..right]</code> is valid, every piece of it that ends at <code>right</code> is also valid: <code>[right]</code>, <code>[right-1..right]</code>, up to <code>[left..right]</code>. That is <code>right - left + 1</code> subarrays. Add that number on every step:</p>
<pre><code class="language-js">// count subarrays whose sum is at most 5 (all numbers positive)
const numbers = [1, 2, 3];
const limit = 5;
let left = 0;
let windowSum = 0;
let total = 0;
for (let right = 0; right &lt; numbers.length; right++) {
  windowSum += numbers[right];
  while (windowSum &gt; limit) {
    windowSum -= numbers[left];
    left++;
  }
  total += right - left + 1; // all good subarrays that end at right
}
console.log(total); // 5  ([1], [2], [1,2], [3], [2,3])</code></pre>
    <p>The same line is used in atMostK (Q10), subarray product less than k (<a href="#/topic/dsa-sliding-window#ex-11">Example 11</a>), and similar counting problems.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Walk through min window substring complexity.</div>
  <div class="qa-answer">
    <p>Let n be the length of the text and m the length of the pattern.</p>
    <ul>
      <li><strong>Time: O(n + m).</strong> Building the need map reads the pattern once: m steps. Then <code>right</code> walks the text once (n steps), and <code>left</code> also only moves forward (at most n steps in total). Each step is O(1) work because <code>formed</code> and <code>required</code> answer "is everything covered?" without scanning the maps.</li>
      <li><strong>Space: O(alphabet size)</strong> for the need and window maps, at most one entry per different character.</li>
    </ul>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You say whether it is a fixed or a variable window, and why.</li>
    <li>You explain O(n) by counting pointer moves over the whole run (amortized), not per round.</li>
    <li>You put the record line in the right place: inside the shrink loop for shortest, after it for longest.</li>
    <li>You pick a sensible state: a number, a Map, or an array of 26.</li>
    <li>You know atMost(K) − atMost(K − 1) for "exactly K".</li>
    <li>You use a monotonic deque for the max or min of every window.</li>
    <li>You notice when a window does not work (negatives, items not side by side) and switch patterns.</li>
  </ul>
</div>
` },

  ]
});
