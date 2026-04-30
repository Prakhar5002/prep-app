window.PREP_SITE.registerTopic({
  id: 'dsa-greedy',
  module: 'dsa',
  title: 'Greedy',
  estimatedReadTime: '40 min',
  tags: ['greedy', 'optimization', 'intervals', 'scheduling', 'sorting', 'huffman', 'gas-station', 'jump-game'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Greedy algorithms</strong> make the locally optimal choice at each step, hoping that the sequence of local optima yields a globally optimal answer. They work for a specific class of problems with the <strong>greedy choice property</strong> and <strong>optimal substructure</strong>. When greedy works, it's typically O(N log N) (sort + scan); when it doesn't, you need DP.</p>
<ul>
  <li><strong>Greedy choice property:</strong> a locally optimal choice leads to a globally optimal solution.</li>
  <li><strong>Optimal substructure:</strong> the global optimum is composed of optimal solutions to subproblems.</li>
  <li><strong>Recipe:</strong> sort by some criterion → scan once → make the obvious choice at each step.</li>
  <li><strong>Classic examples:</strong> activity selection (intervals), Huffman coding, Dijkstra's, Prim's MST, Kruskal's MST, fractional knapsack, Jump Game, Gas Station.</li>
  <li><strong>Why proving greedy works:</strong> exchange argument — show that any non-greedy choice can be replaced with the greedy one without worsening the answer.</li>
  <li><strong>vs DP:</strong> DP considers all paths; greedy commits early. When unsure, DP is safer; greedy is faster.</li>
  <li><strong>Common trap:</strong> 0/1 knapsack — greedy by value/weight ratio fails because you can't split items.</li>
</ul>
<p><strong>Mantra:</strong> "Sort by the right key. Make the locally optimal choice. Prove greedy works (or use DP if you can't)."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What greedy means</h3>
<p>An algorithm strategy: at each decision point, take the option that looks best right now, without backtracking. No reconsideration. The strategy succeeds when local optimality and global optimality align.</p>

<h3>Two preconditions for greedy correctness</h3>
<table>
  <thead><tr><th>Property</th><th>Definition</th></tr></thead>
  <tbody>
    <tr><td><strong>Greedy choice property</strong></td><td>A globally optimal solution can be constructed by making locally optimal choices.</td></tr>
    <tr><td><strong>Optimal substructure</strong></td><td>An optimal solution to the problem contains optimal solutions to subproblems.</td></tr>
  </tbody>
</table>
<p>Without both, greedy can produce wrong answers. Knowing when each holds is the entire skill.</p>

<h3>Greedy vs Dynamic Programming</h3>
<table>
  <thead><tr><th>Property</th><th>Greedy</th><th>DP</th></tr></thead>
  <tbody>
    <tr><td>Decisions</td><td>Locked in at each step</td><td>Considered + revised</td></tr>
    <tr><td>Time</td><td>Often O(N log N) (sort + scan)</td><td>O(states × transitions)</td></tr>
    <tr><td>Space</td><td>Often O(1) extra</td><td>O(states)</td></tr>
    <tr><td>Correctness</td><td>Requires proof</td><td>Always correct if recurrence is right</td></tr>
    <tr><td>Mistake cost</td><td>Wrong answer if greedy doesn't apply</td><td>Slower but correct</td></tr>
  </tbody>
</table>

<h3>The "exchange argument"</h3>
<p>To prove greedy works: show that you can always swap a non-greedy choice in any optimal solution with a greedy one without making the solution worse. By induction, the greedy choice is part of some optimal solution → greedy at every step yields an optimal overall.</p>

<p>Example: Activity selection (pick max non-overlapping intervals).</p>
<ul>
  <li>Greedy: sort by end-time; pick next that starts after current's end.</li>
  <li>Exchange argument: in any optimal solution, the first activity's end-time can be swapped to the earliest end-time without conflict. This earliest-end-time is the greedy choice. Recurse.</li>
</ul>

<h3>Why interviewers ask</h3>
<ol>
  <li>Greedy + sort patterns are common in interviews; recognizing them quickly = senior signal.</li>
  <li>Tests intuition + proof skills.</li>
  <li>Distinguishes engineers who reach for DP for everything from those who pick the simpler approach when it works.</li>
  <li>Many real-world scheduling / routing / resource allocation problems are greedy-shaped.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You recognize greedy patterns: intervals, scheduling, take-or-leave with value/cost.</li>
  <li>You sort by the right key (end-time vs start-time vs ratio).</li>
  <li>You sketch a proof or counterexample before committing.</li>
  <li>You distinguish problems where greedy works from those that need DP.</li>
  <li>You quote O(N log N) for the typical sort + scan structure.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The classic greedy structure</h3>
<pre><code class="language-text">function solve(items):
  sort items by some criterion
  for each item in sorted order:
    if it's safe to include (doesn't violate constraints):
      include it
  return result
</code></pre>

<h3>Sort key — the entire art</h3>
<p>Picking the wrong sort key dooms greedy. The sort key encodes "what do I prefer first?"</p>
<table>
  <thead><tr><th>Problem</th><th>Sort by</th></tr></thead>
  <tbody>
    <tr><td>Activity Selection (max non-overlapping intervals)</td><td>End time ascending</td></tr>
    <tr><td>Min Meeting Rooms</td><td>Start time ascending</td></tr>
    <tr><td>Fractional Knapsack</td><td>Value / weight descending</td></tr>
    <tr><td>Job Scheduling with Deadlines</td><td>Profit descending</td></tr>
    <tr><td>Huffman Coding</td><td>Frequency ascending (priority queue)</td></tr>
    <tr><td>Min Cost to Connect Sticks</td><td>Length ascending (priority queue)</td></tr>
    <tr><td>Gas Station</td><td>No sort needed; one-pass with running tally</td></tr>
    <tr><td>Jump Game</td><td>No sort; track furthest reachable</td></tr>
    <tr><td>Assign Cookies (greedy matching)</td><td>Both arrays sorted ascending</td></tr>
    <tr><td>Min Number of Arrows for Balloons</td><td>End coordinate ascending</td></tr>
  </tbody>
</table>

<h3>The "interval scheduling" template</h3>
<pre><code class="language-js">// Max number of non-overlapping intervals
function maxNonOverlap(intervals) {
  intervals.sort((a, b) =&gt; a[1] - b[1]);   // sort by end
  let count = 0, lastEnd = -Infinity;
  for (const [start, end] of intervals) {
    if (start &gt;= lastEnd) {
      count++;
      lastEnd = end;
    }
  }
  return count;
}
</code></pre>

<h3>The "two-pointer greedy" template</h3>
<pre><code class="language-js">// Match cookies to children: each child wants size &gt;= some threshold
function findContentChildren(children, cookies) {
  children.sort((a, b) =&gt; a - b);
  cookies.sort((a, b) =&gt; a - b);
  let i = 0, j = 0, content = 0;
  while (i &lt; children.length &amp;&amp; j &lt; cookies.length) {
    if (cookies[j] &gt;= children[i]) {
      content++;
      i++;
    }
    j++;
  }
  return content;
}
</code></pre>

<h3>The "running tally" template</h3>
<pre><code class="language-js">// Gas Station — find start station that can complete the circle
function canCompleteCircuit(gas, cost) {
  let total = 0, current = 0, start = 0;
  for (let i = 0; i &lt; gas.length; i++) {
    const diff = gas[i] - cost[i];
    total += diff;
    current += diff;
    if (current &lt; 0) {
      start = i + 1;
      current = 0;
    }
  }
  return total &gt;= 0 ? start : -1;
}
</code></pre>

<h3>Greedy with priority queue</h3>
<p>When the choice depends on dynamic state (e.g., always pick the smallest), maintain a min-heap.</p>
<pre><code class="language-js">// Connect sticks at min cost
function connectSticks(sticks) {
  const heap = new MinHeap();
  for (const s of sticks) heap.push(s);
  let cost = 0;
  while (heap.size() &gt; 1) {
    const a = heap.pop();
    const b = heap.pop();
    cost += a + b;
    heap.push(a + b);
  }
  return cost;
}
</code></pre>

<h3>When greedy fails — recognizing the trap</h3>
<table>
  <thead><tr><th>Problem</th><th>Why greedy fails</th><th>Use instead</th></tr></thead>
  <tbody>
    <tr><td>0/1 Knapsack</td><td>Can't split items; greedy by value/weight may pick wrong combination</td><td>DP</td></tr>
    <tr><td>Coin Change (general coins)</td><td>Greedy by largest fails for some denominations (e.g., {1,3,4} target 6 → 4+1+1 vs 3+3)</td><td>DP</td></tr>
    <tr><td>Longest Increasing Subsequence</td><td>Greedy doesn't capture optimal subsequence structure</td><td>DP / patience sort</td></tr>
    <tr><td>Edit Distance</td><td>Many possible paths; greedy doesn't prove optimal</td><td>DP</td></tr>
  </tbody>
</table>
<p>Standard US coin denominations {1, 5, 10, 25} happen to be greedy-friendly. {1, 3, 4} are not. Tells you the difference.</p>

<h3>Counterexample as proof of failure</h3>
<p>If you can't prove greedy works, try to construct a small input where it gives wrong answer. Two minutes of counterexamples saves an hour of debugging.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Activity Selection / Erase Overlap Intervals</h3>
<pre><code class="language-js">function eraseOverlapIntervals(intervals) {
  intervals.sort((a, b) =&gt; a[1] - b[1]);   // by end time
  let kept = 0, lastEnd = -Infinity;
  for (const [s, e] of intervals) {
    if (s &gt;= lastEnd) {
      kept++;
      lastEnd = e;
    }
  }
  return intervals.length - kept;
}
</code></pre>

<h3>Min Number of Arrows to Burst Balloons</h3>
<pre><code class="language-js">function findMinArrowShots(points) {
  if (!points.length) return 0;
  points.sort((a, b) =&gt; a[1] - b[1]);
  let arrows = 1, end = points[0][1];
  for (const [start, e] of points) {
    if (start &gt; end) {
      arrows++;
      end = e;
    }
  }
  return arrows;
}
</code></pre>

<h3>Jump Game</h3>
<pre><code class="language-js">// Can you reach the last index?
function canJump(nums) {
  let furthest = 0;
  for (let i = 0; i &lt; nums.length; i++) {
    if (i &gt; furthest) return false;
    furthest = Math.max(furthest, i + nums[i]);
  }
  return true;
}
</code></pre>

<h3>Jump Game II — min jumps</h3>
<pre><code class="language-js">function jump(nums) {
  let jumps = 0, currentEnd = 0, furthest = 0;
  for (let i = 0; i &lt; nums.length - 1; i++) {
    furthest = Math.max(furthest, i + nums[i]);
    if (i === currentEnd) {
      jumps++;
      currentEnd = furthest;
    }
  }
  return jumps;
}
</code></pre>

<h3>Gas Station</h3>
<pre><code class="language-js">function canCompleteCircuit(gas, cost) {
  let total = 0, current = 0, start = 0;
  for (let i = 0; i &lt; gas.length; i++) {
    const diff = gas[i] - cost[i];
    total += diff;
    current += diff;
    if (current &lt; 0) {
      start = i + 1;
      current = 0;
    }
  }
  return total &gt;= 0 ? start : -1;
}
</code></pre>

<h3>Assign Cookies</h3>
<pre><code class="language-js">function findContentChildren(g, s) {
  g.sort((a, b) =&gt; a - b);
  s.sort((a, b) =&gt; a - b);
  let i = 0, j = 0;
  while (i &lt; g.length &amp;&amp; j &lt; s.length) {
    if (s[j] &gt;= g[i]) i++;
    j++;
  }
  return i;
}
</code></pre>

<h3>Best Time to Buy/Sell Stock II (unlimited transactions)</h3>
<pre><code class="language-js">function maxProfit(prices) {
  let profit = 0;
  for (let i = 1; i &lt; prices.length; i++) {
    if (prices[i] &gt; prices[i - 1]) {
      profit += prices[i] - prices[i - 1];
    }
  }
  return profit;
}
// Greedy: take every up-step. Equivalent to "sum of all positive deltas."
</code></pre>

<h3>Min Number of Platforms (railway scheduling)</h3>
<pre><code class="language-js">function minPlatforms(arr, dep) {
  arr.sort((a, b) =&gt; a - b);
  dep.sort((a, b) =&gt; a - b);
  let i = 0, j = 0, count = 0, max = 0;
  while (i &lt; arr.length) {
    if (arr[i] &lt;= dep[j]) {
      count++;
      max = Math.max(max, count);
      i++;
    } else {
      count--;
      j++;
    }
  }
  return max;
}
</code></pre>

<h3>Job Sequencing with Deadlines</h3>
<pre><code class="language-js">// Each job has profit + deadline. Each job takes 1 unit time.
// Maximize total profit.
function jobScheduling(jobs) {
  jobs.sort((a, b) =&gt; b.profit - a.profit);   // highest profit first
  const maxDeadline = Math.max(...jobs.map(j =&gt; j.deadline));
  const slots = new Array(maxDeadline + 1).fill(null);

  let totalProfit = 0;
  for (const job of jobs) {
    for (let t = job.deadline; t &gt; 0; t--) {
      if (slots[t] === null) {
        slots[t] = job;
        totalProfit += job.profit;
        break;
      }
    }
  }
  return totalProfit;
}
// O(N²); for large N use Union-Find for slot allocation.
</code></pre>

<h3>Huffman Coding</h3>
<pre><code class="language-js">function huffman(charFreqs) {
  const heap = new MinHeap((a, b) =&gt; a.freq - b.freq);
  for (const [char, freq] of Object.entries(charFreqs)) {
    heap.push({ char, freq, left: null, right: null });
  }
  while (heap.size() &gt; 1) {
    const a = heap.pop();
    const b = heap.pop();
    heap.push({ freq: a.freq + b.freq, left: a, right: b });
  }
  return heap.pop();   // root of Huffman tree
}
</code></pre>

<h3>Min Cost to Hire K Workers</h3>
<pre><code class="language-js">function mincostToHireWorkers(quality, wage, k) {
  const workers = quality.map((q, i) =&gt; ({ ratio: wage[i] / q, quality: q }));
  workers.sort((a, b) =&gt; a.ratio - b.ratio);

  const heap = new MaxHeap();   // max-heap of qualities
  let qsum = 0, best = Infinity;
  for (const w of workers) {
    heap.push(w.quality);
    qsum += w.quality;
    if (heap.size() &gt; k) {
      qsum -= heap.pop();
    }
    if (heap.size() === k) {
      best = Math.min(best, qsum * w.ratio);
    }
  }
  return best;
}
</code></pre>

<h3>Largest Number (combine integers into largest string)</h3>
<pre><code class="language-js">function largestNumber(nums) {
  const strs = nums.map(String);
  strs.sort((a, b) =&gt; (b + a).localeCompare(a + b));
  if (strs[0] === '0') return '0';
  return strs.join('');
}
// Custom comparator: which order makes a bigger concatenation
</code></pre>

<h3>Min Number of Increments to Sorted</h3>
<pre><code class="language-js">function minIncrements(nums) {
  let prev = nums[0], count = 0;
  for (let i = 1; i &lt; nums.length; i++) {
    if (nums[i] &lt;= prev) {
      count += prev + 1 - nums[i];
      prev = prev + 1;
    } else {
      prev = nums[i];
    }
  }
  return count;
}
</code></pre>

<h3>Reorganize String</h3>
<pre><code class="language-js">function reorganizeString(s) {
  const freq = new Map();
  for (const c of s) freq.set(c, (freq.get(c) ?? 0) + 1);

  const heap = new MaxHeap((a, b) =&gt; a.count - b.count);
  for (const [c, count] of freq) {
    if (count &gt; (s.length + 1) / 2) return '';
    heap.push({ char: c, count });
  }

  let prev = null, result = '';
  while (heap.size()) {
    const cur = heap.pop();
    result += cur.char;
    cur.count--;
    if (prev &amp;&amp; prev.count &gt; 0) heap.push(prev);
    prev = cur;
  }
  return result;
}
</code></pre>

<h3>Greedy with stack (monotonic)</h3>
<pre><code class="language-js">// Remove K digits to make smallest number
function removeKdigits(num, k) {
  const stack = [];
  for (const c of num) {
    while (k &gt; 0 &amp;&amp; stack.length &amp;&amp; stack[stack.length - 1] &gt; c) {
      stack.pop();
      k--;
    }
    stack.push(c);
  }
  while (k--) stack.pop();
  return (stack.join('').replace(/^0+/, '') || '0');
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Non-overlapping Intervals</h3>
<p>See Mechanics. Sort by end time; keep ones that start after last kept.</p>

<h3>Example 2: Boats to Save People</h3>
<pre><code class="language-js">// Each boat carries at most 2 people, weight limit; find min boats
function numRescueBoats(people, limit) {
  people.sort((a, b) =&gt; a - b);
  let boats = 0, l = 0, r = people.length - 1;
  while (l &lt;= r) {
    if (people[l] + people[r] &lt;= limit) l++;
    r--;
    boats++;
  }
  return boats;
}
</code></pre>

<h3>Example 3: Min Jumps to Reach Last (variant)</h3>
<pre><code class="language-js">// Use BFS-like "current furthest reachable, next furthest reachable"
function jump(nums) {
  let jumps = 0, currentMax = 0, nextMax = 0;
  for (let i = 0; i &lt; nums.length - 1; i++) {
    nextMax = Math.max(nextMax, i + nums[i]);
    if (i === currentMax) {
      jumps++;
      currentMax = nextMax;
    }
  }
  return jumps;
}
</code></pre>

<h3>Example 4: Maximum Number of Events Attended</h3>
<pre><code class="language-js">// Each event spans [start, end]; attend one per day
function maxEvents(events) {
  events.sort((a, b) =&gt; a[0] - b[0]);
  const heap = new MinHeap();   // by end time
  let i = 0, day = 0, count = 0;
  while (i &lt; events.length || heap.size()) {
    if (!heap.size()) day = events[i][0];
    while (i &lt; events.length &amp;&amp; events[i][0] &lt;= day) {
      heap.push(events[i][1]);
      i++;
    }
    heap.pop();
    count++;
    day++;
    while (heap.size() &amp;&amp; heap.peek() &lt; day) heap.pop();   // expired
  }
  return count;
}
</code></pre>

<h3>Example 5: Lemonade Change</h3>
<pre><code class="language-js">function lemonadeChange(bills) {
  let fives = 0, tens = 0;
  for (const b of bills) {
    if (b === 5) fives++;
    else if (b === 10) {
      if (!fives) return false;
      fives--; tens++;
    } else {   // 20
      if (tens &amp;&amp; fives) { tens--; fives--; }
      else if (fives &gt;= 3) fives -= 3;
      else return false;
    }
  }
  return true;
}
</code></pre>

<h3>Example 6: Score after Flipping Matrix</h3>
<pre><code class="language-js">// Flip rows / columns to maximize binary number sum of rows
function matrixScore(grid) {
  const m = grid.length, n = grid[0].length;
  // Step 1: flip rows so leading bit is 1
  for (let r = 0; r &lt; m; r++) {
    if (grid[r][0] === 0) {
      for (let c = 0; c &lt; n; c++) grid[r][c] = 1 - grid[r][c];
    }
  }
  // Step 2: flip columns where 0s &gt; 1s
  let score = 0;
  for (let c = 0; c &lt; n; c++) {
    let ones = 0;
    for (let r = 0; r &lt; m; r++) ones += grid[r][c];
    const best = Math.max(ones, m - ones);
    score += best * (1 &lt;&lt; (n - 1 - c));
  }
  return score;
}
</code></pre>

<h3>Example 7: Maximize Distance to Closest Person</h3>
<pre><code class="language-js">// Find seat maximizing distance to nearest occupied
function maxDistToClosest(seats) {
  const n = seats.length;
  let prev = -1, best = 0;
  for (let i = 0; i &lt; n; i++) {
    if (seats[i] === 1) {
      if (prev === -1) best = i;
      else best = Math.max(best, Math.floor((i - prev) / 2));
      prev = i;
    }
  }
  best = Math.max(best, n - 1 - prev);
  return best;
}
</code></pre>

<h3>Example 8: Two City Scheduling</h3>
<pre><code class="language-js">// 2N people; send N to city A, N to city B; minimize total cost
function twoCitySchedCost(costs) {
  costs.sort((a, b) =&gt; (a[0] - a[1]) - (b[0] - b[1]));
  const n = costs.length / 2;
  let total = 0;
  for (let i = 0; i &lt; n; i++) total += costs[i][0];      // A
  for (let i = n; i &lt; 2 * n; i++) total += costs[i][1];  // B
  return total;
}
// Sort by "savings if you send to A vs B"; first half goes to A, second half to B.
</code></pre>

<h3>Example 9: Candy Distribution</h3>
<pre><code class="language-js">// Each child gets at least 1; child with higher rating gets more than neighbor
function candy(ratings) {
  const n = ratings.length;
  const candies = new Array(n).fill(1);
  for (let i = 1; i &lt; n; i++) {
    if (ratings[i] &gt; ratings[i - 1]) candies[i] = candies[i - 1] + 1;
  }
  for (let i = n - 2; i &gt;= 0; i--) {
    if (ratings[i] &gt; ratings[i + 1]) candies[i] = Math.max(candies[i], candies[i + 1] + 1);
  }
  return candies.reduce((a, b) =&gt; a + b);
}
</code></pre>

<h3>Example 10: Partition Labels</h3>
<pre><code class="language-js">// Partition string so each letter appears in at most one part
function partitionLabels(s) {
  const last = new Map();
  for (let i = 0; i &lt; s.length; i++) last.set(s[i], i);

  const result = [];
  let start = 0, end = 0;
  for (let i = 0; i &lt; s.length; i++) {
    end = Math.max(end, last.get(s[i]));
    if (i === end) {
      result.push(end - start + 1);
      start = i + 1;
    }
  }
  return result;
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Sort key matters</h3>
<p>Activity selection by start time fails; by end time works. Min meeting rooms by start time (with end-time heap). Picking wrong key dooms the algorithm.</p>

<h3>Tie-breaking in sort</h3>
<p>Two intervals with same end time? Order doesn't matter for activity selection. But for some problems (e.g., "longest non-overlapping"), tie-breaking matters. Be deliberate.</p>

<h3>Floating-point comparisons</h3>
<p>Sort by ratio (e.g., wage/quality). Floating-point comparison can be imprecise; for tied ratios, check tie-breaking explicitly.</p>

<h3>Empty input</h3>
<p>Most greedy problems have edge case for empty array. Return 0, [], or appropriate sentinel.</p>

<h3>Single element</h3>
<p>Often the answer is element itself or count of 1. Test against [5] with various target conditions.</p>

<h3>All elements identical</h3>
<p>Often a degenerate case: maxProfit on flat prices = 0; activity selection on identical intervals = 1.</p>

<h3>Greedy on coin change with non-canonical denominations</h3>
<p>{1, 3, 4}, target 6: greedy picks 4 + 1 + 1 (3 coins); optimal is 3 + 3 (2 coins). Detect non-canonical denominations and use DP.</p>

<h3>Negative numbers</h3>
<p>Some greedy assumes non-negative. Gas station with negative differences works because the algorithm tracks running balance. Activity selection with negative intervals doesn't make geometric sense; clarify constraints.</p>

<h3>Stable sort matters</h3>
<p>If you sort by primary key and want secondary order preserved, use a stable sort. JS's <code>Array.prototype.sort</code> is stable since ES2019.</p>

<h3>Greedy that requires global state</h3>
<p>Some problems combine greedy with stack/heap maintenance. Pure local choice isn't enough; track running state (max-heap of options seen so far).</p>

<h3>The "decrease and conquer" trap</h3>
<p>Looks like greedy because you process one element at a time, but actually requires DP (e.g., painting houses with constraints). Verify by counterexample.</p>

<h3>Greedy fails on small inputs</h3>
<p>Often the smallest counterexample to a wrong greedy is 2-3 elements. Always trace your algorithm on small inputs first.</p>

<h3>Off-by-one in interval comparisons</h3>
<p>"Non-overlapping" usually means <code>start &gt;= prevEnd</code>. "Strictly disjoint" might mean <code>start &gt; prevEnd</code>. Clarify.</p>

<h3>Mixed positive / negative — Kadane's</h3>
<p>Maximum subarray with all-negative input: answer is largest single element, not 0. Initialize <code>best = nums[0]</code>, not 0.</p>

<h3>Greedy with priority queue + lazy deletion</h3>
<p>Items in heap may become "stale" (e.g., out of viewport, expired). Check validity on pop; discard and continue.</p>

<h3>The "exchange argument" failure</h3>
<p>If you can't construct an exchange argument, greedy may not work. Try DP. If exchange-arg works for the first step but not subsequent, problem may need a different sort key.</p>

<h3>Multi-dimensional optimization</h3>
<p>"Maximize value, minimize weight, also at most K items" — greedy by single criterion fails. May need multi-pass or DP.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Sorting by wrong key</h3>
<p>Activity selection by start time → wrong. By end time → correct. Always verify key choice with a small example.</p>

<h3>Bug 2: Mutating input array</h3>
<pre><code class="language-js">// BAD — modifies caller's array
function solve(arr) {
  arr.sort();   // mutates!
  ...
}

// GOOD
function solve(arr) {
  const sorted = [...arr].sort();
  ...
}
</code></pre>

<h3>Bug 3: Greedy with non-canonical coins</h3>
<p>Standard US coins are greedy-friendly; arbitrary denominations are not. Don't apply greedy to general coin-change.</p>

<h3>Bug 4: Off-by-one in interval comparison</h3>
<pre><code class="language-js">// BAD
if (start &gt; lastEnd) include();   // misses adjacent (start === lastEnd)

// GOOD (depending on problem semantics)
if (start &gt;= lastEnd) include();
</code></pre>

<h3>Bug 5: Lossy floating-point sort</h3>
<pre><code class="language-js">// Ratios may compare as equal due to precision
items.sort((a, b) =&gt; a.value / a.weight - b.value / b.weight);
// FIX — sort by cross-product to avoid division
items.sort((a, b) =&gt; b.value * a.weight - a.value * b.weight);
</code></pre>

<h3>Bug 6: Not handling empty array</h3>
<pre><code class="language-js">// BAD
function maxProfit(prices) {
  let min = prices[0];   // undefined if empty
  ...
}

// GOOD
if (!prices.length) return 0;
</code></pre>

<h3>Bug 7: Greedy fails for K-of-N</h3>
<p>"Pick K items to maximize / minimize Y" often needs DP or heap-based selection, not pure greedy on a single sort.</p>

<h3>Bug 8: Forgetting tie-breaking</h3>
<p>Sorting by primary key may produce ambiguous order for ties. Specify secondary key explicitly.</p>

<h3>Bug 9: Greedy without proof</h3>
<p>"It looks like greedy should work." Try a counterexample. If you can't disprove in 5 minutes and can't prove in 10, fall back to DP.</p>

<h3>Bug 10: Mixing greedy with backtracking</h3>
<p>"Greedily pick, but if it fails, backtrack" → that's NOT greedy; it's just backtracking. Pure greedy never reconsiders.</p>

<h3>Anti-pattern 1: Reaching for greedy reflexively</h3>
<p>Greedy doesn't always work. If unsure, use DP. Slower but correct.</p>

<h3>Anti-pattern 2: Skipping the proof step</h3>
<p>"It worked on a few examples" is not proof. Construct a counterexample or an exchange argument.</p>

<h3>Anti-pattern 3: Hand-rolling priority queue</h3>
<p>Many greedy problems need a heap. JS doesn't have one built in. Have a clean implementation ready (see Heaps topic).</p>

<h3>Anti-pattern 4: Ignoring stable sort</h3>
<p>Some greedy proofs assume stable ordering. Modern JS sort is stable, but be aware of language differences.</p>

<h3>Anti-pattern 5: Two-phase greedy</h3>
<p>"Greedy + then a fix-up pass" is sometimes correct, sometimes not. Verify carefully — usually means greedy alone wasn't sufficient.</p>

<h3>Anti-pattern 6: Greedy on graph problems naively</h3>
<p>Single-source shortest path: greedy works (Dijkstra) only with non-negative edges. With negatives, you need Bellman-Ford. Don't apply greedy without checking.</p>

<h3>Anti-pattern 7: Greedy by first-come-first-served</h3>
<p>"Process in input order, greedily decide" — usually wrong. Sorting first is the key.</p>

<h3>Anti-pattern 8: One-character-at-a-time greedy on strings</h3>
<p>Some problems (longest palindrome, edit distance) need DP. Greedy byte-by-byte doesn't capture the global structure.</p>

<h3>Anti-pattern 9: Local optima only</h3>
<p>Always taking the cheapest local move can lead to dead ends. Some problems need lookahead (DP) or full search (BFS / DFS with state).</p>

<h3>Anti-pattern 10: Greedy on small inputs that look like big-O wins</h3>
<p>For N &lt; 1000, sometimes brute force is faster (in real time) than the greedy + sort. Check your constraints.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 16 problems worth memorizing patterns for</h3>
<table>
  <thead><tr><th>Problem</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>Activity Selection / Erase Overlap Intervals</td><td>Sort by end; pick non-overlapping</td></tr>
    <tr><td>Min Number of Arrows for Balloons</td><td>Sort by end; new arrow on disjoint</td></tr>
    <tr><td>Min Meeting Rooms</td><td>Sort starts; min-heap of ends</td></tr>
    <tr><td>Jump Game I / II</td><td>Track furthest reachable</td></tr>
    <tr><td>Gas Station</td><td>One pass; reset on negative running sum</td></tr>
    <tr><td>Stock II (unlimited transactions)</td><td>Sum positive deltas</td></tr>
    <tr><td>Assign Cookies</td><td>Two pointers on sorted arrays</td></tr>
    <tr><td>Job Sequencing with Deadlines</td><td>Sort by profit desc; greedy slot fill</td></tr>
    <tr><td>Huffman Coding</td><td>Repeatedly combine two smallest via heap</td></tr>
    <tr><td>Connect Sticks at Min Cost</td><td>Min-heap; pop two; push sum</td></tr>
    <tr><td>Largest Number</td><td>Custom string comparator</td></tr>
    <tr><td>Reorganize String</td><td>Max-heap by frequency; defer last placed</td></tr>
    <tr><td>Min Number of Platforms</td><td>Sort + two pointers; track concurrent</td></tr>
    <tr><td>Lemonade Change</td><td>Track inventory of fives and tens</td></tr>
    <tr><td>Two City Scheduling</td><td>Sort by cost differential; first half to A</td></tr>
    <tr><td>Candy Distribution</td><td>Two passes (left-to-right, right-to-left)</td></tr>
  </tbody>
</table>

<h3>Pattern recognition cheatsheet</h3>
<table>
  <thead><tr><th>Problem says...</th><th>Likely greedy</th></tr></thead>
  <tbody>
    <tr><td>"Maximum number of non-overlapping intervals"</td><td>YES — sort by end</td></tr>
    <tr><td>"Min boats / arrows / platforms / rooms"</td><td>YES — sort + sweep</td></tr>
    <tr><td>"Sum of positive deltas / max profit unlimited transactions"</td><td>YES</td></tr>
    <tr><td>"Make string by combining N words"</td><td>OFTEN — custom comparator</td></tr>
    <tr><td>"K closest / K largest"</td><td>HEAP-based greedy</td></tr>
    <tr><td>"Optimal selection with constraints (multiple)"</td><td>OFTEN DP, not greedy</td></tr>
    <tr><td>"Coin change with arbitrary denominations"</td><td>NO — DP</td></tr>
    <tr><td>"Edit distance / longest subsequence"</td><td>NO — DP</td></tr>
    <tr><td>"0/1 knapsack"</td><td>NO — DP</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Activity Selection — sort by end, scan, pick non-overlapping.</li>
  <li>Jump Game — track furthest.</li>
  <li>Gas Station — one-pass running sum.</li>
  <li>Min Meeting Rooms — sort + heap.</li>
  <li>Reorganize String — max-heap with deferred placement.</li>
  <li>Largest Number — string concat comparator.</li>
  <li>Two City Scheduling — sort by differential.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Activity selection sorted by start time — wrong; should be by end time.</li>
  <li>Coin change with arbitrary denominations using greedy — should be DP.</li>
  <li>0/1 knapsack with greedy by value/weight — wrong (works for fractional).</li>
  <li>Sorting by ratio with floating-point ties — use cross-product comparison.</li>
  <li>Mutating caller's input array — clone first.</li>
  <li>Greedy without correctness proof on a non-canonical case — find counterexample.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Pattern recognition</td><td>You name "greedy" with the right sort key.</td></tr>
    <tr><td>Proof intuition</td><td>You sketch an exchange argument.</td></tr>
    <tr><td>Counterexample skill</td><td>You disprove greedy when it fails.</td></tr>
    <tr><td>Sort + scan fluency</td><td>You write the standard interval template cleanly.</td></tr>
    <tr><td>Heap greedy</td><td>You combine greedy with priority queue when needed.</td></tr>
    <tr><td>Knowing when NOT</td><td>You fall back to DP when greedy fails.</td></tr>
    <tr><td>Complexity articulation</td><td>You quote O(N log N) for sort; O(N) for scan.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Mobile-relevant greedy: scheduling background tasks, bandwidth allocation, image-load priorities, queue eviction.</li>
  <li>Animation: choosing which animations to skip when frame budget tight (greedy by importance).</li>
  <li>Cache eviction (LRU is a form of greedy choice; LFU another).</li>
  <li>Battery-aware task selection: greedily defer high-power tasks until charging.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why does greedy work for activity selection?"</em> — Exchange argument: in any optimal solution, the activity with earliest end can be swapped to the first slot without conflict; recurse.</li>
  <li><em>"Why doesn't greedy work for 0/1 knapsack?"</em> — Can't split items. Highest value/weight ratio item may exclude two slightly less efficient items that together exceed it. Need DP to consider all combinations.</li>
  <li><em>"What's the difference between greedy and DP?"</em> — Greedy commits at each step; DP considers all paths. Greedy is faster when the greedy choice property holds; DP is correct in more cases.</li>
  <li><em>"How does Huffman coding prove greedy works?"</em> — At each step, the two least-frequent symbols can be combined (their codes will be longest in the optimal solution; making them siblings doesn't hurt). Recursive proof.</li>
  <li><em>"When is greedy + DP needed?"</em> — Some problems need a greedy upper-level decision then DP within (e.g., job scheduling with weighted deadlines + capacity constraint).</li>
</ul>

<h3>"What I'd do day one prepping for greedy"</h3>
<ul>
  <li>Memorize the 5 sort keys (end time, profit desc, ratio, frequency, etc.).</li>
  <li>Practice the interval template until it's reflexive.</li>
  <li>Write down the "fails greedy" set: 0/1 knapsack, edit distance, LIS, general coin change.</li>
  <li>Practice constructing counterexamples for borderline problems.</li>
  <li>Brush up on heap implementation for greedy + priority-queue patterns.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd write the exchange-argument proof formally as a sanity check."</li>
  <li>"I'd add a counterexample test in CI for any greedy decision in the codebase."</li>
  <li>"I'd benchmark greedy vs DP for medium-sized inputs to validate the tradeoff."</li>
  <li>"I'd document why greedy works for our specific use case so future engineers don't re-derive."</li>
</ul>
`
    }
  ]
});
