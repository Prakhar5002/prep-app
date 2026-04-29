window.PREP_SITE.registerTopic({
  id: 'dsa-two-pointers',
  module: 'DSA',
  title: 'Two Pointers',
  estimatedReadTime: '22 min',
  tags: ['dsa', 'two-pointers', 'array', 'string', 'pattern'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Two pointers is a pattern where you maintain two indices into a sequence and move them according to logic. Reduces many O(n²) brute-force problems to O(n).</p>
<ul>
  <li><strong>Opposite ends</strong>: <code>l</code> starts at 0, <code>r</code> at end; converge. For sorted arrays, palindromes, container problems.</li>
  <li><strong>Same direction (slow + fast)</strong>: both start at 0 (or 0 and 1); fast advances; slow advances when condition met. For dedup, partition, cycle detection.</li>
  <li><strong>Linked-list cycle</strong>: Floyd's tortoise-and-hare uses fast/slow pointers.</li>
  <li><strong>Sorted prerequisite</strong>: opposite-ends two pointers on unsorted is usually wrong; sort first or use a different pattern.</li>
  <li><strong>Skip duplicates</strong>: when result must be unique tuples, advance pointers past equal neighbors.</li>
  <li><strong>O(n) time, O(1) space</strong> typical.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Two pointers turns nested loops into linear scans by exploiting structure (sortedness, monotonic constraints, symmetry). Identify the structure first; the pointer moves follow.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why two pointers works</h3>
<p>The pattern eliminates redundant work. In a sorted array's two-sum problem, brute force tries every pair (n²). Two pointers converge based on the sum's relationship to target — each step either rules out the left's smallest with current right, or right's largest with current left. Each pointer moves at most n steps total → O(n).</p>

<h3>Variations</h3>
<table>
  <thead><tr><th>Variation</th><th>Use</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Opposite ends, converging</td><td>Sorted, symmetric, container</td><td>Two-sum sorted, palindrome, container with most water</td></tr>
    <tr><td>Same direction (slow/fast)</td><td>Partition, dedup, in-place modify</td><td>Remove duplicates, move zeros</td></tr>
    <tr><td>Slow + fast at different speeds</td><td>Cycle detection, midpoint</td><td>Floyd's algorithm, find middle of linked list</td></tr>
    <tr><td>Three pointers</td><td>Three-way partition, three-sum</td><td>Dutch flag, three-sum</td></tr>
  </tbody>
</table>

<h3>When two pointers DOESN'T work</h3>
<ul>
  <li>Unsorted array where order matters but you can't sort (loses original indices).</li>
  <li>Problem requires considering all pairs (no monotonic property).</li>
  <li>Need to track multiple windows simultaneously — sliding window is the right pattern.</li>
</ul>

<h3>Why "skip duplicates" matters</h3>
<p>In 3-sum: <code>[-1, -1, 0, 1, 2]</code>. Without skipping, you'd add <code>[-1, -1, 2]</code> twice (one for each <code>-1</code> at i). Skip <code>nums[i] === nums[i-1]</code> for i, and on the inner two pointers as well after a match.</p>

<h3>Why on linked lists</h3>
<p>Random access is O(n), but two pointers (one fast, one slow) detect cycles, find midpoints, and perform other tasks in a single pass without random access. Floyd's cycle detection is the canonical example.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "convergence" picture</h3>
<div class="diagram">
<pre>
 [1, 3, 4, 5, 7, 11]   target=10
  l                r
  1 + 11 = 12 &gt; 10 → r--

 [1, 3, 4, 5, 7, 11]
  l            r
  1 + 7 = 8 &lt; 10 → l++

 [1, 3, 4, 5, 7, 11]
     l         r
     3 + 7 = 10 ✓
</pre>
</div>

<h3>The "fast / slow" picture</h3>
<div class="diagram">
<pre>
 Slow advances on a condition (e.g., "non-zero seen");
 Fast advances every iteration.

 Move zeros:
 [0, 1, 0, 3, 12]
  s
  f→ 0 - skip
  f→ 1 - swap with arr[s], s++
 [1, 0, 0, 3, 12]
     s
     f→ 0 - skip
     f→ 3 - swap, s++
 [1, 3, 0, 0, 12]
        s
        f→ 12 - swap, s++
 [1, 3, 12, 0, 0] ✓</pre>
</div>

<h3>The "Floyd's cycle" picture</h3>
<div class="diagram">
<pre>
 Linked list with cycle:
 1 → 2 → 3 → 4 → 5
             ↑       ↓
             7 ← 6 ←

 Tortoise (1 step) + Hare (2 steps).
 If cycle: hare laps tortoise — they meet inside the cycle.
 If no cycle: hare reaches null first.

 To find the cycle's start:
 - Reset tortoise to head; advance both 1 step at a time.
 - They meet at the cycle's start.</pre>
</div>

<h3>The "Dutch flag" picture (3 pointers)</h3>
<div class="diagram">
<pre>
 Sort 0s, 1s, 2s in one pass:
 [2, 0, 1, 0, 2, 1, 0]
  l     m              h

 - low: boundary of 0s (everything before is 0)
 - mid: current iteration
 - high: boundary of 2s (everything after is 2)

 if arr[m] === 0: swap with l, l++, m++
 if arr[m] === 1: m++
 if arr[m] === 2: swap with h, h--   (don't m++ — re-check swapped value)</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Two pointers always means starting at both ends." Many two-pointer problems have both pointers starting at 0 (slow + fast). The key is: two indices, intentional movement based on logic.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Template — opposite ends</h3>
<pre><code class="language-js">function template(arr) {
  let l = 0, r = arr.length - 1;
  while (l &lt; r) {
    // Examine arr[l] and arr[r]
    if (/* condition */) {
      // record / return
    }
    if (/* shrink left */) l++;
    else if (/* shrink right */) r--;
  }
}</code></pre>

<h3>Template — slow + fast</h3>
<pre><code class="language-js">function template(arr) {
  let slow = 0;
  for (let fast = 0; fast &lt; arr.length; fast++) {
    if (/* condition on arr[fast] */) {
      // process: swap, copy, etc. with slow
      slow++;
    }
  }
  return slow;   // typically: new length, count, etc.
}</code></pre>

<h3>Reverse string</h3>
<pre><code class="language-js">function reverseString(s) {
  let l = 0, r = s.length - 1;
  while (l &lt; r) {
    [s[l], s[r]] = [s[r], s[l]];
    l++; r--;
  }
}
// Modifies in place. O(n) time, O(1) space.</code></pre>

<h3>Two sum on sorted</h3>
<pre><code class="language-js">function twoSumSorted(numbers, target) {
  let l = 0, r = numbers.length - 1;
  while (l &lt; r) {
    const sum = numbers[l] + numbers[r];
    if (sum === target) return [l + 1, r + 1];   // 1-indexed
    if (sum &lt; target) l++; else r--;
  }
  return [];
}
// O(n) time, O(1) space.</code></pre>

<h3>Three sum</h3>
<pre><code class="language-js">function threeSum(nums) {
  nums.sort((a, b) =&gt; a - b);
  const result = [];
  for (let i = 0; i &lt; nums.length - 2; i++) {
    if (nums[i] &gt; 0) break;                    // can't sum to 0 with sorted positives
    if (i &gt; 0 &amp;&amp; nums[i] === nums[i-1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l &lt; r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum === 0) {
        result.push([nums[i], nums[l], nums[r]]);
        while (l &lt; r &amp;&amp; nums[l] === nums[l+1]) l++;
        while (l &lt; r &amp;&amp; nums[r] === nums[r-1]) r--;
        l++; r--;
      } else if (sum &lt; 0) l++; else r--;
    }
  }
  return result;
}
// O(n²) time, O(1) extra (excluding output).</code></pre>

<h3>Container with most water</h3>
<pre><code class="language-js">function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l &lt; r) {
    const area = Math.min(height[l], height[r]) * (r - l);
    best = Math.max(best, area);
    if (height[l] &lt; height[r]) l++; else r--;
  }
  return best;
}
// Move shorter side; longer might be paired with even longer next.
// O(n) time, O(1) space.</code></pre>

<h3>Trapping rain water</h3>
<pre><code class="language-js">function trap(height) {
  let l = 0, r = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (l &lt; r) {
    if (height[l] &lt; height[r]) {
      leftMax = Math.max(leftMax, height[l]);
      water += leftMax - height[l];
      l++;
    } else {
      rightMax = Math.max(rightMax, height[r]);
      water += rightMax - height[r];
      r--;
    }
  }
  return water;
}
// O(n) time, O(1) space.</code></pre>

<h3>Remove duplicates from sorted</h3>
<pre><code class="language-js">function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  let slow = 0;
  for (let fast = 1; fast &lt; nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;
}
// O(n) time, O(1) space.</code></pre>

<h3>Move zeros to end</h3>
<pre><code class="language-js">function moveZeroes(nums) {
  let slow = 0;
  for (let fast = 0; fast &lt; nums.length; fast++) {
    if (nums[fast] !== 0) {
      [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
      slow++;
    }
  }
}
// O(n) time, O(1) space. Maintains relative order of non-zeros.</code></pre>

<h3>Floyd's cycle detection (linked list)</h3>
<pre><code class="language-js">function hasCycle(head) {
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

// Find cycle start
function detectCycle(head) {
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      slow = head;
      while (slow !== fast) {
        slow = slow.next;
        fast = fast.next;
      }
      return slow;
    }
  }
  return null;
}</code></pre>

<h3>Find middle of linked list</h3>
<pre><code class="language-js">function middleNode(head) {
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
// When fast reaches end, slow is at middle. O(n) time, O(1) space.</code></pre>

<h3>Dutch flag (sort 0/1/2)</h3>
<pre><code class="language-js">function sortColors(nums) {
  let l = 0, m = 0, h = nums.length - 1;
  while (m &lt;= h) {
    if (nums[m] === 0) {
      [nums[l], nums[m]] = [nums[m], nums[l]];
      l++; m++;
    } else if (nums[m] === 1) {
      m++;
    } else {
      [nums[m], nums[h]] = [nums[h], nums[m]];
      h--;
    }
  }
}
// O(n) time, O(1) space, single pass.</code></pre>

<h3>Squares of sorted array</h3>
<pre><code class="language-js">// Input is sorted (may have negatives). Output: squares, sorted.
function sortedSquares(nums) {
  const n = nums.length;
  const result = new Array(n);
  let l = 0, r = n - 1;
  for (let i = n - 1; i &gt;= 0; i--) {
    if (Math.abs(nums[l]) &gt; Math.abs(nums[r])) {
      result[i] = nums[l] * nums[l];
      l++;
    } else {
      result[i] = nums[r] * nums[r];
      r--;
    }
  }
  return result;
}
// O(n) time, O(n) for output. Two pointers from ends, fill result from end.</code></pre>

<h3>Backspace string compare</h3>
<pre><code class="language-js">function backspaceCompare(s, t) {
  let i = s.length - 1, j = t.length - 1;
  let skipS = 0, skipT = 0;
  while (i &gt;= 0 || j &gt;= 0) {
    while (i &gt;= 0) {
      if (s[i] === '#') { skipS++; i--; }
      else if (skipS &gt; 0) { skipS--; i--; }
      else break;
    }
    while (j &gt;= 0) {
      if (t[j] === '#') { skipT++; j--; }
      else if (skipT &gt; 0) { skipT--; j--; }
      else break;
    }
    if (i &gt;= 0 &amp;&amp; j &gt;= 0 &amp;&amp; s[i] !== t[j]) return false;
    if ((i &gt;= 0) !== (j &gt;= 0)) return false;
    i--; j--;
  }
  return true;
}
// Two pointers from end, accounting for backspaces. O(n+m) time, O(1) space.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — palindrome check</h3>
<pre><code class="language-js">function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  while (l &lt; r) {
    if (s[l] !== s[r]) return false;
    l++; r--;
  }
  return true;
}
// O(n) time, O(1) space</code></pre>

<h3>Example 2 — valid palindrome (alphanumeric)</h3>
<pre><code class="language-js">function isPalindromeAlnum(s) {
  let l = 0, r = s.length - 1;
  const isAlnum = (c) =&gt; /[a-zA-Z0-9]/.test(c);
  while (l &lt; r) {
    while (l &lt; r &amp;&amp; !isAlnum(s[l])) l++;
    while (l &lt; r &amp;&amp; !isAlnum(s[r])) r--;
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++; r--;
  }
  return true;
}</code></pre>

<h3>Example 3 — valid palindrome with one removal</h3>
<pre><code class="language-js">function validPalindrome(s) {
  const check = (l, r) =&gt; {
    while (l &lt; r) {
      if (s[l] !== s[r]) return false;
      l++; r--;
    }
    return true;
  };
  let l = 0, r = s.length - 1;
  while (l &lt; r) {
    if (s[l] !== s[r]) return check(l + 1, r) || check(l, r - 1);
    l++; r--;
  }
  return true;
}</code></pre>

<h3>Example 4 — three sum</h3>
<pre><code class="language-js">// (Same as in mechanics; common pattern)
function threeSum(nums) {
  nums.sort((a, b) =&gt; a - b);
  const result = [];
  for (let i = 0; i &lt; nums.length - 2; i++) {
    if (i &gt; 0 &amp;&amp; nums[i] === nums[i-1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l &lt; r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum === 0) {
        result.push([nums[i], nums[l], nums[r]]);
        while (l &lt; r &amp;&amp; nums[l] === nums[l+1]) l++;
        while (l &lt; r &amp;&amp; nums[r] === nums[r-1]) r--;
        l++; r--;
      } else if (sum &lt; 0) l++; else r--;
    }
  }
  return result;
}</code></pre>

<h3>Example 5 — three sum closest</h3>
<pre><code class="language-js">function threeSumClosest(nums, target) {
  nums.sort((a, b) =&gt; a - b);
  let closest = nums[0] + nums[1] + nums[2];
  for (let i = 0; i &lt; nums.length - 2; i++) {
    let l = i + 1, r = nums.length - 1;
    while (l &lt; r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (Math.abs(sum - target) &lt; Math.abs(closest - target)) closest = sum;
      if (sum &lt; target) l++; else r--;
    }
  }
  return closest;
}</code></pre>

<h3>Example 6 — partition list around pivot</h3>
<pre><code class="language-js">function partition(nums, pivot) {
  let l = 0, r = nums.length - 1;
  while (l &lt;= r) {
    if (nums[l] &lt; pivot) l++;
    else if (nums[r] &gt;= pivot) r--;
    else { [nums[l], nums[r]] = [nums[r], nums[l]]; l++; r--; }
  }
  return l;
}</code></pre>

<h3>Example 7 — remove element in place</h3>
<pre><code class="language-js">function removeElement(nums, val) {
  let slow = 0;
  for (let fast = 0; fast &lt; nums.length; fast++) {
    if (nums[fast] !== val) {
      nums[slow++] = nums[fast];
    }
  }
  return slow;   // new length
}
// O(n) time, O(1) space</code></pre>

<h3>Example 8 — squares of sorted array</h3>
<pre><code class="language-js">function sortedSquares(nums) {
  const n = nums.length;
  const result = new Array(n);
  let l = 0, r = n - 1;
  for (let i = n - 1; i &gt;= 0; i--) {
    if (Math.abs(nums[l]) &gt; Math.abs(nums[r])) {
      result[i] = nums[l] * nums[l]; l++;
    } else {
      result[i] = nums[r] * nums[r]; r--;
    }
  }
  return result;
}</code></pre>

<h3>Example 9 — Floyd's cycle (detect)</h3>
<pre><code class="language-js">function hasCycle(head) {
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}</code></pre>

<h3>Example 10 — find middle node</h3>
<pre><code class="language-js">function middleNode(head) {
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
// For even length: returns second middle (1→2→3→4→5→6 returns 4).</code></pre>

<h3>Example 11 — remove nth from end</h3>
<pre><code class="language-js">function removeNthFromEnd(head, n) {
  const dummy = { next: head };
  let slow = dummy, fast = dummy;
  for (let i = 0; i &lt; n; i++) fast = fast.next;
  while (fast.next) { slow = slow.next; fast = fast.next; }
  slow.next = slow.next.next;
  return dummy.next;
}
// Single-pass two-pointer trick.</code></pre>

<h3>Example 12 — Dutch flag (sort 0/1/2)</h3>
<pre><code class="language-js">function sortColors(nums) {
  let l = 0, m = 0, h = nums.length - 1;
  while (m &lt;= h) {
    if (nums[m] === 0) { [nums[l], nums[m]] = [nums[m], nums[l]]; l++; m++; }
    else if (nums[m] === 1) m++;
    else { [nums[m], nums[h]] = [nums[h], nums[m]]; h--; }
  }
}</code></pre>

<h3>Example 13 — sort by parity</h3>
<pre><code class="language-js">function sortArrayByParity(nums) {
  let l = 0, r = nums.length - 1;
  while (l &lt; r) {
    if (nums[l] % 2 === 0) l++;
    else if (nums[r] % 2 === 1) r--;
    else { [nums[l], nums[r]] = [nums[r], nums[l]]; l++; r--; }
  }
  return nums;
}</code></pre>

<h3>Example 14 — happy number (cycle detection on integers)</h3>
<pre><code class="language-js">function isHappy(n) {
  const sumSquares = (x) =&gt; {
    let sum = 0;
    while (x &gt; 0) { sum += (x % 10) ** 2; x = Math.floor(x / 10); }
    return sum;
  };
  let slow = n, fast = n;
  do {
    slow = sumSquares(slow);
    fast = sumSquares(sumSquares(fast));
  } while (slow !== fast);
  return slow === 1;
}</code></pre>

<h3>Example 15 — interleaving / merge</h3>
<pre><code class="language-js">// Merge two sorted arrays into one (similar to merge in mergesort)
function merge(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i &lt; a.length &amp;&amp; j &lt; b.length) {
    if (a[i] &lt;= b[j]) result.push(a[i++]);
    else result.push(b[j++]);
  }
  while (i &lt; a.length) result.push(a[i++]);
  while (j &lt; b.length) result.push(b[j++]);
  return result;
}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Off-by-one (l &lt; r vs l &lt;= r)</h3>
<p><code>l &lt; r</code>: stop when they meet — meeting point not processed. <code>l &lt;= r</code>: meeting point processed. Choose based on whether you need to inspect the middle element.</p>

<h3>2. Empty input</h3>
<p>Length 0: while loop doesn't enter; return appropriately.</p>

<h3>3. Single element</h3>
<p>l = 0, r = 0: <code>l &lt; r</code> false; loop doesn't run. Often correct (palindrome of 1 char).</p>

<h3>4. Forgetting to skip duplicates</h3>
<p>3-sum returns duplicates if you don't skip. Skip after each match for both inner pointers, AND on the outer loop.</p>

<h3>5. Sorting destroys original indices</h3>
<p>If problem requires original indices (two-sum unsorted): can't sort + two-pointer naively. Either store [value, originalIndex] pairs, or use hash map.</p>

<h3>6. Negative numbers in container problem</h3>
<p>Most container/water problems assume non-negative heights. Negatives change semantics; read prompt carefully.</p>

<h3>7. Pointers crossing</h3>
<p>If your loop accidentally moves both pointers past each other, results may be wrong. Always check termination condition explicitly.</p>

<h3>8. Floyd's cycle on null head</h3>
<p>Head = null: <code>fast &amp;&amp; fast.next</code> handles both null and one-node cases. Don't forget the null check.</p>

<h3>9. Middle of even-length list</h3>
<p>Two definitions: first middle (3 of 6) or second middle (4 of 6). LeetCode typically wants the second; clarify if asked.</p>

<h3>10. Slow/fast advancing different rates</h3>
<p>Fast advances 2 per iteration; slow advances 1. After k iterations, fast is at index 2k, slow at k. They meet inside cycle (if cycle exists) within one cycle length.</p>

<h3>11. Skipping duplicates in 3-sum after match</h3>
<p>Need to skip both <code>l</code> AND <code>r</code> past their duplicates after finding a match — and then advance once more.</p>

<h3>12. Sorted-squares with all-positive or all-negative</h3>
<p>All positive: result = squares in same order. All negative: result = squares in reverse order. Two-pointer-from-ends handles both correctly.</p>

<h3>13. Dutch flag — don't increment m on swap with high</h3>
<pre><code class="language-js">// BAD: m++ after swap with h — skips re-checking the new arr[m]
if (nums[m] === 2) { swap; h--; m++; }   // wrong

// GOOD
if (nums[m] === 2) { swap; h--; }   // re-check arr[m] next iteration</code></pre>

<h3>14. Two pointers on string with multibyte chars</h3>
<p>Standard string indexing in JS gives UTF-16 code units. Emoji / supplementary chars are 2 code units. Use Array.from(str) to get true characters.</p>

<h3>15. Linked list "remove nth from end" with n equal to length</h3>
<p>Remove the head. Dummy node simplifies — it acts as a "node before head" so removing head is uniform with other positions.</p>

<h3>16. Container problem: equal heights</h3>
<p>When heights are equal, moving either pointer is fine (both can't increase area). Convention: move left.</p>

<h3>17. Trapping water with sorted heights</h3>
<p>Heights all increasing or all decreasing → 0 water. Two-pointer correctly returns 0 (one of leftMax / rightMax matches every element).</p>

<h3>18. Negative numbers in 3-sum</h3>
<p>Sort handles. <code>[-3,-2,-1,0,1,2]</code> still works; pointers converge as usual.</p>

<h3>19. Backspace compare with all backspaces</h3>
<p><code>"a##c"</code> should equal <code>"#a#c"</code>. Both reduce to "c". Two-pointer-from-end with skip count handles.</p>

<h3>20. Three sum closest with multiple equal sums</h3>
<p>Doesn't matter which triple you return (problem usually asks for the sum value, not the triple).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — using two pointers on unsorted</h3>
<p>Two-pointer convergence depends on monotonicity. Sort first or use a different pattern (hash map for two-sum unsorted).</p>

<h3>Anti-pattern 2 — forgetting to skip duplicates</h3>
<p>3-sum, 4-sum, and similar problems require unique tuples. Skip <code>nums[i] === nums[i-1]</code>.</p>

<h3>Anti-pattern 3 — wrong comparison direction</h3>
<p>"sum &lt; target → l++" makes sense for two-sum-sorted (need to grow). Reversed: "sum &lt; target → r--" decreases sum further — wrong direction.</p>

<h3>Anti-pattern 4 — modifying both pointers in same step</h3>
<pre><code class="language-js">// Sometimes wrong:
if (cond) { l++; r--; }
// Move only the side dictated by the logic.</code></pre>

<h3>Anti-pattern 5 — not handling crossing</h3>
<p>If your termination is <code>l &lt; r</code> but inside the loop you do <code>l++</code> and <code>r--</code> together, they may cross. Check between moves.</p>

<h3>Anti-pattern 6 — Floyd's cycle without null check</h3>
<pre><code class="language-js">while (slow !== fast) {   // ← never null-check; segfault on no cycle
  slow = slow.next;
  fast = fast.next.next;
}</code></pre>

<h3>Anti-pattern 7 — initializing slow/fast at different positions for cycle</h3>
<p>Both must start at head. Not <code>slow = head, fast = head.next</code>. Alternative initializations break the math.</p>

<h3>Anti-pattern 8 — copying array with two pointers when not needed</h3>
<p>If the algorithm doesn't need extra space, don't allocate. <code>O(1)</code> in-place is the win.</p>

<h3>Anti-pattern 9 — slow vs fast confusion in dedup</h3>
<p>"slow" = position to write next valid element; "fast" = scanning index. Write to <code>slow + 1</code> and increment <code>slow</code> only after a valid copy.</p>

<h3>Anti-pattern 10 — duplicate skipping order in 3-sum</h3>
<p>Skipping must be inside the matching <code>if</code> branch, not at the start of the while. Otherwise you skip duplicates that should advance to a new triple.</p>

<h3>Anti-pattern 11 — string mutation attempts</h3>
<p>Strings are immutable; <code>s[i] = 'x'</code> silently fails. Convert to array.</p>

<h3>Anti-pattern 12 — using indexOf in two-pointer setup</h3>
<p>Defeats O(n) goal. Use Map / Set if you need lookups.</p>

<h3>Anti-pattern 13 — recursing instead of iterating</h3>
<p>Two-pointer problems are inherently iterative. Recursing for "elegance" adds stack space.</p>

<h3>Anti-pattern 14 — not breaking early when impossible</h3>
<p>3-sum: <code>if (nums[i] &gt; 0) break</code> — three positives can't sum to 0. Small optimization, common.</p>

<h3>Anti-pattern 15 — mutating input when caller didn't expect</h3>
<p>Some callers expect a new array; in-place mutation is surprising. Document or copy first if uncertain.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. When to use two pointers?</div>
  <div class="qa-answer">
    <ul>
      <li>Sorted array + need pair / triplet with property.</li>
      <li>Palindrome / symmetric problems.</li>
      <li>Container / water problems with monotonic heights.</li>
      <li>In-place modification (dedup, partition, move zeros).</li>
      <li>Linked list cycle / midpoint / nth-from-end.</li>
    </ul>
    <p>Common signal: brute force is O(n²); two pointers reduces to O(n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Two pointers vs sliding window?</div>
  <div class="qa-answer">
    <p><strong>Two pointers</strong>: discrete pointwise checks (compare arr[l] and arr[r]); often converging or fast/slow.</p>
    <p><strong>Sliding window</strong>: maintain a region with property (sum, distinct count); expand right and contract left as the property breaks/holds.</p>
    <p>Overlap exists. If the problem is "find subarray/substring with X," it's usually sliding window.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Implement reverse string in place.</div>
  <div class="qa-answer">
<pre><code class="language-js">function reverseString(s) {
  let l = 0, r = s.length - 1;
  while (l &lt; r) {
    [s[l], s[r]] = [s[r], s[l]];
    l++; r--;
  }
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Two sum on sorted array.</div>
  <div class="qa-answer">
<pre><code class="language-js">function twoSumSorted(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l &lt; r) {
    const s = nums[l] + nums[r];
    if (s === target) return [l, r];
    if (s &lt; target) l++; else r--;
  }
  return [-1, -1];
}</code></pre>
    <p>O(n) time, O(1) space. The sorted property lets you decide which pointer to move.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Container with most water — why move shorter pointer?</div>
  <div class="qa-answer">
    <p>Area = min(h[l], h[r]) * (r - l). Moving the longer pointer either keeps the min the same or decreases it (the new pair's min is ≤ old min). Width also decreases. So moving longer can only stay the same or decrease area.</p>
    <p>Moving the shorter pointer might find a taller column; min could increase. That's the only direction that could improve.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Trapping rain water — explain.</div>
  <div class="qa-answer">
    <p>Water at position i = min(maxLeft, maxRight) - height[i]. Two-pointer trick: process the side with smaller current max. That side's water is bounded by the smaller max. Increment that max if current is larger; otherwise add water.</p>
<pre><code class="language-js">function trap(height) {
  let l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
  while (l &lt; r) {
    if (height[l] &lt; height[r]) {
      leftMax = Math.max(leftMax, height[l]);
      water += leftMax - height[l]; l++;
    } else {
      rightMax = Math.max(rightMax, height[r]);
      water += rightMax - height[r]; r--;
    }
  }
  return water;
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Detect cycle in linked list — algorithm + complexity?</div>
  <div class="qa-answer">
    <p>Floyd's tortoise-and-hare. Slow advances 1 per iteration; fast advances 2. If cycle exists, fast laps slow; they meet. If no cycle, fast reaches null.</p>
    <p>O(n) time, O(1) space. Better than hash set (O(n) space).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Find cycle's start in linked list.</div>
  <div class="qa-answer">
    <p>After Floyd's detects cycle: reset one pointer to head; advance both 1 step at a time. They meet at the cycle's start.</p>
    <p>Math: if cycle starts at distance d from head, and meeting point is k steps into the cycle, you can show that walking d steps from head and d steps from meeting (around cycle) lands at cycle start.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Remove duplicates from sorted array.</div>
  <div class="qa-answer">
<pre><code class="language-js">function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  let slow = 0;
  for (let fast = 1; fast &lt; nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;
}</code></pre>
    <p>Slow is the last unique position; fast scans. O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Move zeros to end maintaining order.</div>
  <div class="qa-answer">
<pre><code class="language-js">function moveZeroes(nums) {
  let slow = 0;
  for (let fast = 0; fast &lt; nums.length; fast++) {
    if (nums[fast] !== 0) {
      [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
      slow++;
    }
  }
}</code></pre>
    <p>Swap each non-zero forward. Maintains relative order. O(n) time, O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Sort 0/1/2 in one pass (Dutch flag).</div>
  <div class="qa-answer">
<pre><code class="language-js">function sortColors(nums) {
  let l = 0, m = 0, h = nums.length - 1;
  while (m &lt;= h) {
    if (nums[m] === 0) { [nums[l], nums[m]] = [nums[m], nums[l]]; l++; m++; }
    else if (nums[m] === 1) m++;
    else { [nums[m], nums[h]] = [nums[h], nums[m]]; h--; }
  }
}</code></pre>
    <p>Three pointers. Don't increment m after swapping with h — re-check the swapped value.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Find middle of linked list.</div>
  <div class="qa-answer">
<pre><code class="language-js">function middleNode(head) {
  let slow = head, fast = head;
  while (fast &amp;&amp; fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}</code></pre>
    <p>For 1→2→3→4→5: slow ends at 3. For 1→2→3→4→5→6: slow ends at 4 (second middle).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Remove nth node from end (single pass).</div>
  <div class="qa-answer">
<pre><code class="language-js">function removeNthFromEnd(head, n) {
  const dummy = { next: head };
  let slow = dummy, fast = dummy;
  for (let i = 0; i &lt; n; i++) fast = fast.next;
  while (fast.next) { slow = slow.next; fast = fast.next; }
  slow.next = slow.next.next;
  return dummy.next;
}</code></pre>
    <p>Fast races n nodes ahead; both advance until fast hits end. Slow is now n+1 from end. Dummy handles head removal uniformly.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Three sum — handle duplicates.</div>
  <div class="qa-answer">
    <p>After sorting:</p>
    <ul>
      <li>Outer loop: skip <code>nums[i] === nums[i-1]</code> for i &gt; 0.</li>
      <li>After finding a triple: skip <code>l</code> past <code>nums[l+1] === nums[l]</code>; same for <code>r</code> backward.</li>
      <li>Then advance both.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Squares of sorted array — why two pointers?</div>
  <div class="qa-answer">
    <p>Input may have negatives. After squaring, smallest is in the middle (if neg-pos crossover); largest at one end. Two pointers from ends; whichever has bigger absolute value squared goes to the end of result. Result fills back-to-front. O(n) instead of O(n log n) sort.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You name the variation (opposite ends / same direction / fast+slow).</li>
    <li>You explain why the pointer movement is correct (monotonicity argument).</li>
    <li>You skip duplicates when needed.</li>
    <li>You use Floyd's for cycle detection without hash set (O(1) space).</li>
    <li>You use a dummy node for linked-list problems involving head removal.</li>
    <li>You handle empty / single-element cases.</li>
    <li>You convert strings to arrays for in-place modification.</li>
    <li>You sort first when the algorithm requires it.</li>
  </ul>
</div>
`}

]
});
