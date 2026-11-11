// Hashing, rewritten in plain English (Nov 2026). Main picture: a cloakroom with numbered hooks.
// You hand over your coat with a name tag; the attendant turns the name into a hook number and
// goes straight to that hook. The name is the KEY, the coat is the VALUE, the rule that turns a
// name into a hook number is the HASH FUNCTION. In code the cloakroom is a JS Map (or a Set).
// DSA words link to the glossary at #/topic/dsa-words#w-<slug>.
window.PREP_SITE.registerTopic({
  id: "dsa-hashing",
  module: "dsa",
  title: "Hashing",
  estimatedReadTime: "40 min",
  tags: ["dsa","hash","map","set","frequency","lookup","prefix-sum"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">A <a href="#/topic/dsa-words#w-hash-map">hash map</a> is a cloakroom: give it a key and it goes <strong>straight to the value</strong> without searching. Whenever your slow solution has a loop that searches a list inside another loop, a hash map usually removes the inner search, turning <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a> into <a href="#/topic/dsa-words#w-o-n">O(n)</a>. The price is extra memory.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Lookup, add and delete are <a href="#/topic/dsa-words#w-o-1">O(1)</a> on average</strong>: the same small amount of work whether the map holds 10 keys or 10 million. You pay for it with O(n) extra memory (one slot per item stored). That swap is a <a href="#/topic/dsa-words#w-trade-off">trade-off</a>: memory for speed.</li>
    <li><strong>Set for "have I seen this?"</strong> A <a href="#/topic/dsa-words#w-hash-set">hash set</a> stores only keys. <strong>Map for "key → value"</strong>: counts, positions, groups.</li>
    <li><strong>In JS, prefer <code>Map</code> over a plain object</strong> for algorithm work. A Map keeps keys of any type as they are (the number 1 stays a number), remembers the order you added them, and tells you its size with <code>map.size</code>.</li>
    <li><strong>The big signal:</strong> if your <a href="#/topic/dsa-words#w-brute-force">brute force</a> (try-everything) solution has a loop inside a loop just to <em>find</em> something, a hash map usually replaces the inner loop. The extra memory is normally worth it.</li>
    <li><strong>Two-sum pattern:</strong> for each number, ask "is the <a href="#/topic/dsa-words#w-complement">complement</a> (target minus me) already in the map?" <em>before</em> you store the current number. That order also handles duplicates correctly. Time O(n), space O(n).</li>
    <li><strong>Counting is the foundation:</strong> a <a href="#/topic/dsa-words#w-frequency-map">frequency map</a> (value → how many times it appears) powers <a href="#/topic/dsa-words#w-anagram">anagram</a>, <a href="#/topic/dsa-words#w-top-k">top-K</a> and majority-element problems.</li>
    <li><strong>Prefix sum + hash</strong> counts <a href="#/topic/dsa-words#w-subarray">subarrays</a> (side-by-side stretches) that add up to K. A <a href="#/topic/dsa-words#w-prefix-sum">prefix sum</a> is a running total. Keep a map "running total → how many times seen", started with 0 → 1 (total 0, seen once: the empty start). It works with negative numbers, where a <a href="#/topic/dsa-words#w-window">sliding window</a> (a stretch you slide along the list) fails.</li>
    <li><strong>Group by a shared label</strong> (the "canonical form"): sort the letters, or count them, and use that as the key. Counting is O(n·k) (n words, k letters each); sorting each word is O(n·k log k), slower on long words.</li>
    <li><strong>Top-K most frequent</strong> with "buckets by frequency" is O(n). Using a <a href="#/topic/dsa-words#w-heap">heap</a> instead is O(n log k).</li>
    <li><strong>Longest consecutive run:</strong> only start counting from a number whose smaller neighbour (n − 1) is missing. That keeps it O(n).</li>
    <li><strong>Only the 26 letters a–z?</strong> Use a plain array of 26 counts instead of a Map. It skips the hashing work, so it is faster.</li>
    <li><strong>Arrays and objects as keys compare by identity, not contents.</strong> <code>[1, 2]</code> and another <code>[1, 2]</code> are different keys. Turn them into a string like <code>"1,2"</code>. And a stored count of <code>0</code> is falsy: check with <code>map.has(key)</code>, not <code>if (map.get(key))</code>.</li>
    <li><strong>O(1) is the average, not a promise.</strong> If many keys land on the same hook (a "collision"), lookups slow down; if all do, each lookup is O(n). Engines use random-seeded hashing so attackers can't force that.</li>
  </ul>
  <h4>Complexity &amp; when to reach for it</h4>
  <ul>
    <li><strong>Time:</strong> O(1) on average per lookup, add or delete, so most hash solutions are O(n): one pass, one cheap question per item. Splitting into pairs (4-sum II) gives O(n²) instead of the O(n⁴) try-everything way.</li>
    <li><strong>Space:</strong> O(n) for the map or set, or O(26) (fixed, so O(1)) for a letter-count array.</li>
    <li><strong>Signal → tool:</strong> "seen before? / remove duplicates" → Set · "how many times / most frequent" → counting Map · "two things that add up to X" → two-sum Map · "subarray sum equals K, negatives allowed" → prefix sum + Map · "group anagrams" → shared-label key · any slow solution with a search loop inside a loop → replace the inner search with a Map or Set.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>In two-sum, look for the complement BEFORE you store the current number.</strong> Store first and a number can pair with itself (target 8, number 4 finds its own 4). Two more classic slips: forgetting to start the prefix-sum map with 0 → 1 (total 0, seen once; needed when the answer starts at index 0), and writing <code>if (map.get(key))</code> when a stored count can be <code>0</code>, which is falsy. Check with <code>map.has(key)</code> instead.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"My brute force has a search loop inside a loop. I'll replace the inner search with a hash map lookup: O(n) extra space brings the time down from O(n²) to O(n)."</div>
  <div class="revision-say">"For subarray-sum with negative numbers I'll use a prefix sum plus a hash map, started with zero seen once for the empty start. A sliding window doesn't work when numbers can be negative."</div>
  <div class="revision-say">"Hash lookup is O(1) on average, not in the worst case. If every key collides, each lookup is O(n), which is why engines use randomised hashing against crafted input."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The pattern: a cloakroom with numbered hooks</h3>
<p>Picture the cloakroom at a wedding hall. It has 100 numbered hooks. You hand over your coat and say your name, "Riya". The attendant has a fixed rule that turns any name into a hook number, say hook 42. Your coat goes on hook 42.</p>
<p>When you come back and say "Riya", the attendant uses the same rule, gets 42 again, and walks <strong>straight to hook 42</strong>. They never look through the other 99 hooks. It takes the same time whether there are 10 coats or 1,000.</p>
<p>That cloakroom is a <a href="#/topic/dsa-words#w-hash-map">hash map</a>. In JavaScript it is the built-in <code>Map</code>:</p>
<ul>
  <li>The <strong>key</strong> is what you look things up by: the name "Riya".</li>
  <li>The <strong>value</strong> is what is stored for that key: the coat.</li>
  <li>The rule that turns a key into a hook number is the <a href="#/topic/dsa-words#w-hash-function">hash function</a>. JS runs it for you, inside <code>Map</code>; you never write it yourself.</li>
</ul>
<p>Sometimes you don't need a coat at all, only a guest list: "Is Riya here, yes or no?" That is a <a href="#/topic/dsa-words#w-hash-set">hash set</a>. In JS it is the built-in <code>Set</code>. It stores keys only.</p>
<p>Because the attendant goes straight to the hook, a lookup takes a fixed, small amount of work. In <a href="#/topic/dsa-words#w-big-o">Big-O</a> (the way we describe how work grows as the input grows) that is <a href="#/topic/dsa-words#w-o-1">O(1)</a>: "the same cost no matter how many items". Compare that with searching an <a href="#/topic/dsa-words#w-array">array</a> with <code>includes</code>, which checks items one by one. That is <a href="#/topic/dsa-words#w-o-n">O(n)</a>: "twice the items, twice the work".</p>

<h3>A real problem: two items that use up a gift card</h3>
<p>You have a gift card worth exactly ₹9 (keep the numbers small). A shop's prices are <code>[2, 7, 11, 15]</code>. Which two items add up to exactly 9? Answer: the items at positions 0 and 1 (2 + 7 = 9).</p>
<p>A position in an array is called an <a href="#/topic/dsa-words#w-index">index</a>, and it starts at 0. Interviewers call this problem <strong>Two Sum</strong>: return the two indexes.</p>

<h3>The slow way, counted in steps</h3>
<p>The first idea most people write: try every pair.</p>
<pre><code class="language-js">function twoSumSlow(prices, target) {
  for (let i = 0; i &lt; prices.length; i++) {
    for (let j = i + 1; j &lt; prices.length; j++) { // every item after i
      if (prices[i] + prices[j] === target) {
        return [i, j];
      }
    }
  }
  return []; // no pair adds up to target
}
console.log(twoSumSlow([2, 7, 11, 15], 9)); // [ 0, 1 ]</code></pre>
<p>It is correct, but count the work. With n prices there are n × (n − 1) / 2 pairs:</p>
<ul>
  <li>4 prices: 6 pairs. No problem.</li>
  <li>10,000 prices: about <strong>50 million pairs</strong>.</li>
</ul>
<p>That is <a href="#/topic/dsa-words#w-o-n-squared">O(n²)</a>: a loop inside a loop, so twice the items means four times the work. Look at what the inner loop is really doing. For the price 2, it is <em>searching</em> the rest of the list for one specific number: 9 − 2 = 7. A search through a list is exactly what a cloakroom avoids.</p>

<h3>What the hash map fixes</h3>
<p>Walk through the prices once. For each price, the partner you need is <code>target - price</code>. That partner is called the <a href="#/topic/dsa-words#w-complement">complement</a>. Ask the Map one question: "have I already seen the complement?"</p>
<ul>
  <li>If yes, you are done: the Map tells you where you saw it.</li>
  <li>If no, put the current price in the Map (price → its index) and move on.</li>
</ul>
<p>Each question is O(1). 10,000 prices means about 10,000 questions instead of 50 million pair checks. You spend memory on the Map (one entry per price) and save a huge amount of time. Spending memory to save time is the <a href="#/topic/dsa-words#w-trade-off">trade-off</a> this whole topic is about.</p>
<p>The one-sentence version: <strong>if you are searching a list inside a loop, put the list in a Map or Set first, and the search becomes one O(1) question.</strong></p>

<h3>What hash structures give you</h3>
<ul>
  <li><strong>Fast "is it there?" and "what is stored for it?":</strong> <code>set.has(x)</code>, <code>map.get(key)</code>. O(1) on average.</li>
  <li><strong>Fast add and remove:</strong> <code>map.set(key, value)</code>, <code>map.delete(key)</code>. Also O(1) on average.</li>
  <li><strong>Looping in the order you added things:</strong> a JS <code>Map</code> or <code>Set</code> gives back keys in the order you inserted them.</li>
</ul>

<h3>Set vs Map</h3>
<table>
  <thead><tr><th></th><th>Set (guest list)</th><th>Map (cloakroom)</th></tr></thead>
  <tbody>
    <tr><td>Stores</td><td>Keys only. "Is it there, yes or no?"</td><td>Key → value pairs</td></tr>
    <tr><td>Examples</td><td>Places already <a href="#/topic/dsa-words#w-visited">visited</a>, numbers already seen, removing duplicates</td><td>How many times each word appears, where each number was seen, groups of words</td></tr>
  </tbody>
</table>

<h3>Map vs object</h3>
<p>A plain JS object <code>{}</code> also stores key → value, so why not use it?</p>
<ul>
  <li><strong>Map</strong>: keys can be any type (numbers, strings, even objects), and they stay that type. It remembers insertion order. <code>map.size</code> tells you how many entries it has. It is usually a little faster when you add and delete a lot.</li>
  <li><strong>Object</strong>: keys are always turned into strings (the number 1 becomes the string "1"). It is built into the language and is handy for data that looks like JSON.</li>
</ul>
<p>For algorithm work, <strong>use Map</strong>. Pitfalls 2 to 5 below show what goes wrong with objects.</p>

<h3>Why hash isn't always O(1)</h3>
<p>Back to the cloakroom. Two different names can turn into the same hook number: "Riya" and "Arjun" both → hook 42. That is a <strong>collision</strong>. The attendant then hangs both coats on hook 42, and must check the name tags on that hook. With a few coats per hook, that is still quick.</p>
<ul>
  <li><strong>Average case:</strong> a good hash function spreads names evenly, so each hook holds only a few coats. Lookup is O(1).</li>
  <li><strong>Worst case:</strong> every name lands on the same hook. Now the attendant checks every coat: O(n) per lookup. (The <a href="#/topic/dsa-words#w-worst-average-case">worst vs average case</a> entry explains the difference.)</li>
  <li><strong>Attacks:</strong> someone who knows the rule can pick keys that all collide on purpose, to slow a server down. Defence: the engine mixes a random secret into the rule (randomised hashing), so outsiders can't predict hook numbers.</li>
  <li><strong>Long keys cost more:</strong> to get the hook number for a string, the rule reads every character. A key of length k costs about k steps. "O(1)" quietly assumes keys are short.</li>
</ul>

<h3>Common hash patterns</h3>
<table>
  <thead><tr><th>Pattern</th><th>What the map stores</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Presence / remove duplicates</td><td>Set of things seen</td><td>Contains duplicate, intersect two arrays, contains nearby duplicate</td></tr>
    <tr><td>Frequency count</td><td>value → count</td><td>Anagram check, top-K frequent, majority element</td></tr>
    <tr><td>Index map</td><td>value → where it was seen</td><td>First-seen index, two-sum, longest substring with no repeats</td></tr>
    <tr><td>Complement lookup</td><td>value → index or count, then ask for "target − value"</td><td>Two-sum, 4-sum II</td></tr>
    <tr><td>Group by a shared label</td><td>label → list of items</td><td>Group anagrams</td></tr>
    <tr><td>Prefix sum + count</td><td>running total → how many times seen</td><td>Subarray sum equals K, subarray sum is a multiple of K</td></tr>
    <tr><td>Hashing pairs / coordinates</td><td>"row,col" strings in a Set</td><td>Visited cells in <a href="#/topic/dsa-words#w-bfs">BFS</a> / <a href="#/topic/dsa-words#w-dfs">DFS</a> on a grid, sets of points</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<p>A <strong>trace</strong> is a table of what every variable holds after each step. The traces below use small inputs so you can check every line by hand. The answer column comes first in each table.</p>

<h3>The "lookup speedup" picture</h3>
<p>Almost every hash solution is the same move: take a slow "search inside a loop" and replace the search with one question to a Map.</p>
<div class="diagram"><pre>SLOW, O(n²): a loop inside a loop
  for each item a:
    for each item b:              the inner loop is a SEARCH
      if a and b match → record

FAST, O(n): one loop and one cloakroom
  for each item a:
    ask the map: "is a's partner already here?"    one O(1) question
    if yes → record
    put a into the map, for the items still to come

You spend O(n) memory (the map) to save a factor of n in time.</pre></div>

<h3>The "complement" picture (two-sum)</h3>
<p>Gift card: <strong>9</strong>. Prices: <code>[4, 11, 7, 2, 5]</code>. For each price, the partner we need is <code>9 - price</code>. The map <code>seenAt</code> remembers price → index for every price we have walked past. This is exactly what the code in <a href="#/topic/dsa-hashing#ex-1">Example 1</a> does.</p>
<div class="diagram"><pre>prices = [4, 11, 7, 2, 5]      target = 9
index:    0   1  2  3  4

found?  i  price  need = 9 - price  seenAt BEFORE this step
no      0  4      5                 { }
no      1  11     -2                {4→0}
no      2  7      2                 {4→0, 11→1}
YES     3  2      7                 {4→0, 11→1, 7→2}   7 is at 2

After each "no", we add the price: seenAt.set(price, i).
Answer: [2, 3]   (7 + 2 = 9)
4 + 5 = 9 too, but we stop at the first pair; index 4 is never read.
Work: 4 questions to the map instead of up to 10 pair checks.</pre></div>
<p>Notice the order inside each step: <strong>ask first, then store</strong>. If we stored 2 before asking, a target of 4 would let 2 pair with itself.</p>

<h3>The "frequency" picture</h3>
<p>A <a href="#/topic/dsa-words#w-frequency-map">frequency map</a> answers "how many times does each value appear?" Here it counts the letters of <code>"banana"</code>, one letter at a time:</p>
<div class="diagram"><pre>counts AFTER this step        step  letter  count before
{b:1}                         1     b       0 (new key)
{b:1, a:1}                    2     a       0 (new key)
{b:1, a:1, n:1}               3     n       0 (new key)
{b:1, a:2, n:1}               4     a       1
{b:1, a:2, n:2}               5     n       1
{b:1, a:3, n:2}               6     a       2

Each step: read the old count (0 if the key is new), add 1, store it.</pre></div>
<p>Two words are <a href="#/topic/dsa-words#w-anagram">anagrams</a> (same letters, different order) exactly when their counts match:</p>
<div class="diagram"><pre>"listen":  {l:1, i:1, s:1, t:1, e:1, n:1}
"silent":  {s:1, i:1, l:1, e:1, n:1, t:1}
Same letters, same counts → anagrams.</pre></div>

<h3>The "prefix sum + hash" picture</h3>
<p>Problem: how many <a href="#/topic/dsa-words#w-subarray">subarrays</a> (stretches of items side by side) add up to exactly <strong>k = 2</strong> in <code>[1, -1, 2, 1]</code>?</p>
<p>A <a href="#/topic/dsa-words#w-prefix-sum">prefix sum</a> is a running total: the sum of everything from the start up to here. The key fact:</p>
<div class="diagram"><pre>running total now  -  running total at some earlier point
    = the sum of the items in between

So a stretch ending HERE sums to k exactly when some earlier
running total was  (total now - k).
Count how many earlier totals equal (total now - k): that is
how many good stretches end here.</pre></div>
<p>So we keep a map "running total → how many times we have seen it". It starts as <code>{0: 1}</code>: before any item, the running total is 0, once. That stands for "the stretch starts at index 0".</p>
<div class="diagram"><pre>nums = [1, -1, 2, 1]      k = 2

count so far  item  running  need = running - 2  times need  map AFTER
                                                 was seen    this step
0             -     0        -                   -           {0:1} (start)
0             1     1        -1                  0           {0:1, 1:1}
0             -1    0        -2                  0           {0:2, 1:1}
2             2     2        0                   2           {0:2, 1:1, 2:1}
3             1     3        1                   1           {0:2, 1:1,
                                                              2:1, 3:1}
Answer: 3
  At item 2: need 0, seen twice → [1, -1, 2] and [2]
  At item 1 (last): need 1, seen once → [-1, 2, 1]</pre></div>
<p>The negative number did not break anything. This is why prefix sum + hash is the tool when a sliding window fails.</p>

<h3>The "canonical form" picture (group anagrams)</h3>
<p>"Canonical form" just means a <strong>shared label</strong> that every member of a group turns into. Sorting a word's letters gives one: every anagram of "eat" sorts to "aet". Use that label as the Map key.</p>
<div class="diagram"><pre>words = ["eat", "tea", "tan", "ate", "nat", "bat"]

label (sorted letters)   word
"aet"                    "eat"
"aet"                    "tea"
"ant"                    "tan"
"aet"                    "ate"
"ant"                    "nat"
"abt"                    "bat"

map:  "aet" → ["eat", "tea", "ate"]
      "ant" → ["tan", "nat"]
      "abt" → ["bat"]
Answer: the map's values, [["eat","tea","ate"], ["tan","nat"], ["bat"]]</pre></div>

<h3>How to recognise a hashing question</h3>
<p>Look for any of these in the wording, or in your own first solution:</p>
<ol>
  <li><strong>"Have I seen this before?"</strong> Words like duplicate, unique, first non-repeating, already visited, cycle.</li>
  <li><strong>"How many times?"</strong> Words like frequency, count, most common, majority, top K, anagram.</li>
  <li><strong>"Find a partner"</strong>: two numbers that add up to a target, a pair with a given difference.</li>
  <li><strong>"Group these"</strong>: group words that are anagrams, group by some property.</li>
  <li><strong>Your brute force searches a list inside a loop</strong> (<code>includes</code>, <code>indexOf</code>, a nested <code>for</code> that only looks for something). That inner search is the thing to replace.</li>
</ol>
<table>
  <thead><tr><th>The question says…</th><th>Use…</th></tr></thead>
  <tbody>
    <tr><td>"contains duplicate", "seen before", "unique"</td><td>Set</td></tr>
    <tr><td>"count", "frequency", "most frequent", "anagram"</td><td>Counting Map (or a 26-slot array for a–z)</td></tr>
    <tr><td>"two numbers that add up to target" (array not sorted)</td><td>Two-sum Map: value → index</td></tr>
    <tr><td>"number of subarrays with sum k", negatives allowed</td><td>Prefix sum + Map of totals → counts</td></tr>
    <tr><td>"group anagrams", "group by"</td><td>Map: shared label → list</td></tr>
    <tr><td>"longest consecutive sequence" in O(n)</td><td>Set + start only at the smallest member</td></tr>
  </tbody>
</table>
<p><strong>Red flags that a hash is NOT the best tool:</strong> the array is already <a href="#/topic/dsa-words#w-sorted">sorted</a> and you need a pair (use <a href="#/topic/dsa-words#w-two-pointers">two pointers</a>, O(1) memory); the question needs "the next bigger key" or a range of keys (a Map has no order by value); or the problem says "O(1) extra space".</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"A hash map is always faster than an array for lookup." Not when the keys are a small fixed set. For the 26 letters a–z, an array of 26 numbers indexed by <code>letter.charCodeAt(0) - 97</code> ('a' is char code 97, so 'a' → slot 0, 'b' → slot 1) is faster than a Map, because it skips the hashing work completely. Pick the tool that fits the data.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>First the everyday JS tools (<code>Map</code>, <code>Set</code>, the counting idiom), then the core templates. Problems whose full code lives in the Examples section say so and link there.</p>

<h3>JS Map basics</h3>
<pre><code class="language-js">const coats = new Map(); // an empty cloakroom
coats.set("riya", "red coat"); // key "riya" → value "red coat"
coats.set("arjun", "blue coat");
console.log(coats.has("riya")); // true
console.log(coats.get("riya")); // red coat
console.log(coats.get("meera")); // undefined  (missing keys give undefined, no error)
console.log(coats.size); // 2
coats.delete("riya");
console.log(coats.size); // 1

coats.set("meera", "green coat");
for (const [name, coat] of coats) { // loops in the order keys were added
  console.log(name + ": " + coat); // arjun: blue coat, then meera: green coat
}
console.log([...coats.keys()]); // [ 'arjun', 'meera' ]
console.log([...coats.values()]); // [ 'blue coat', 'green coat' ]
console.log([...coats.entries()]); // [ [ 'arjun', 'blue coat' ], [ 'meera', 'green coat' ] ]
coats.clear(); // empty it
console.log(coats.size); // 0</code></pre>
<p>Line by line: <code>set</code> adds or replaces, <code>get</code> reads, <code>has</code> answers yes/no, <code>delete</code> removes, <code>size</code> counts. <code>[...coats.keys()]</code> copies the keys into a normal array. All the single-key operations are O(1) on average.</p>

<h3>JS Set basics</h3>
<pre><code class="language-js">const guests = new Set(); // an empty guest list
guests.add("riya");
guests.add("riya"); // adding again does nothing: a Set holds each key once
console.log(guests.has("riya")); // true
console.log(guests.size); // 1
guests.delete("riya");
console.log(guests.size); // 0

// Build a Set from any list: duplicates disappear
const numbers = new Set([1, 2, 3, 1]);
console.log(numbers.size); // 3
for (const n of numbers) {
  console.log(n); // 1, 2, 3  (in the order first added)
}
console.log([...numbers]); // [ 1, 2, 3 ]  (back to a normal array)</code></pre>

<h3>Frequency map idiom</h3>
<p>The most common hash move: count how many times each value appears. A missing key means "seen 0 times", so read the old count into a variable first, then store old + 1.</p>
<pre><code class="language-js">function countEach(items) {
  const counts = new Map(); // value → how many times seen
  for (const item of items) {
    let current = 0; // a value we have never seen counts as 0
    if (counts.has(item)) {
      current = counts.get(item);
    }
    counts.set(item, current + 1);
  }
  return counts;
}
const fruitCounts = countEach(["apple", "kiwi", "apple"]);
console.log(fruitCounts.get("apple")); // 2
console.log(fruitCounts.get("kiwi")); // 1

// The same with a plain object (keys become strings)
function countEachObject(items) {
  const counts = {};
  for (const item of items) {
    let current = 0;
    if (Object.hasOwn(counts, item)) { // own key only: "in" would also say yes to "toString"
      current = counts[item];
    }
    counts[item] = current + 1;
  }
  return counts;
}
console.log(countEachObject(["a", "b", "a"])); // { a: 2, b: 1 }</code></pre>
<p>You will often see this squeezed into one line with an <code>|| 0</code> shortcut. It works, but it hides two steps (read, then add). The longer form above is easier to read and to debug, and it doesn't trip over the "0 is falsy" bug (Anti-pattern 5).</p>

<h3>Two sum (the canonical hash problem)</h3>
<p>This is the template behind the "complement" trace in the Mental Model.</p>
<pre><code class="language-js">function twoSum(nums, target) {
  const seenAt = new Map(); // number → the index where we saw it
  for (let i = 0; i &lt; nums.length; i++) {
    const need = target - nums[i]; // the partner (complement) we are looking for
    if (seenAt.has(need)) {
      return [seenAt.get(need), i]; // the partner came earlier: done
    }
    seenAt.set(nums[i], i); // store AFTER asking, so a number can't pair with itself
  }
  return []; // no pair found
}
console.log(twoSum([4, 11, 7, 2, 5], 9)); // [ 2, 3 ]
console.log(twoSum([3, 3], 6)); // [ 0, 1 ]
console.log(twoSum([4], 8)); // []  (4 must not pair with itself)</code></pre>
<p>Line by line:</p>
<ul>
  <li><code>seenAt</code> is the cloakroom. Its keys are numbers we have walked past; its values are their indexes.</li>
  <li><code>need</code> is what the current number is missing. If it is already in the map, the pair is (that earlier index, this index).</li>
  <li>Only after asking do we store the current number, for the numbers still to come.</li>
</ul>
<p>Time O(n): one pass, one O(1) question per number. Space O(n): the map can hold every number.</p>
<p>In general words: <strong>walk once; for each item, ask the map about its partner; then store the item.</strong> Every "find a partner" problem on this page has this shape.</p>

<h3>Contains duplicate</h3>
<p>"Does any value appear twice?" Put values into a Set as you walk; if one is already there, you found a duplicate. Full code, trace and both versions are in <a href="#/topic/dsa-hashing#ex-2">Example 2</a>. O(n) time, O(n) space.</p>

<h3>Contains nearby duplicate (within k)</h3>
<p><strong>The problem:</strong> is there a value that appears twice with the two positions at most k apart? Example: a door sensor logs badge IDs <code>[1, 2, 3, 1]</code>; did any badge tap twice within 3 taps?</p>
<p><strong>The idea:</strong> a Map from value → the <em>last</em> index we saw it. For each new item, if the value was seen and the gap is at most k, answer yes. Always update to the newest index, because a newer copy can only make the gap smaller.</p>
<pre><code class="language-js">function containsNearbyDuplicate(nums, k) {
  const lastSeenAt = new Map(); // value → most recent index
  for (let i = 0; i &lt; nums.length; i++) {
    const value = nums[i];
    if (lastSeenAt.has(value)) {
      const gap = i - lastSeenAt.get(value); // distance to the previous copy
      if (gap &lt;= k) {
        return true;
      }
    }
    lastSeenAt.set(value, i); // remember the newest position
  }
  return false;
}
console.log(containsNearbyDuplicate([1, 2, 3, 1], 3)); // true  (indexes 0 and 3, gap 3)
console.log(containsNearbyDuplicate([1, 2, 3, 1, 2, 3], 2)); // false  (every gap is 3)</code></pre>
<p>Time O(n), space O(n). (You can also keep only the last k values in a Set, as a sliding window: space O(k).)</p>

<h3>Group anagrams</h3>
<p>Group words that use the same letters. The sorted-letters version (label = the word's letters sorted) is in <a href="#/topic/dsa-hashing#ex-4">Example 4</a>, with its trace. It costs O(n · k log k) for n words of about k letters, because each word is sorted.</p>
<p><strong>A faster label: letter counts.</strong> Instead of sorting, count the 26 letters and join the counts into a string such as <code>"1,0,0,0,1,..."</code>. Every anagram produces the same string. Counting a word is O(k), so the whole job is O(n · k), which beats sorting on long words.</p>
<pre><code class="language-js">function groupAnagramsByCount(words) {
  const groups = new Map(); // label → list of words with that label
  for (const word of words) {
    const letterCounts = new Array(26).fill(0); // slot 0 = 'a', slot 1 = 'b', ...
    for (const letter of word) {
      const slot = letter.charCodeAt(0) - 97; // 'a' has char code 97
      letterCounts[slot] = letterCounts[slot] + 1;
    }
    const label = letterCounts.join(","); // e.g. "1,0,0,0,1,..." for "eat"
    if (!groups.has(label)) {
      groups.set(label, []); // first word with this label: start a new group
    }
    const group = groups.get(label);
    group.push(word);
  }
  return [...groups.values()];
}
const grouped = groupAnagramsByCount(["eat", "tea", "tan", "ate", "nat", "bat"]);
console.log(JSON.stringify(grouped)); // [["eat","tea","ate"],["tan","nat"],["bat"]]</code></pre>
<p>Why the commas in the label? Without them, counts like 1 and 11 would run together and two different words could get the same label. Assumes lowercase a–z only.</p>

<h3>Top K frequent (with bucket sort or heap)</h3>
<p>"Return the k values that appear most often." Count with a frequency map, then put each value in a <strong>bucket</strong> numbered by its count (bucket 3 holds values that appear 3 times). Read the buckets from the highest number down. That "bucket sort" is O(n). A <a href="#/topic/dsa-words#w-heap">heap</a> of size k is the other common answer at O(n log k). Full code and trace: <a href="#/topic/dsa-hashing#ex-5">Example 5</a>.</p>

<h3>Subarray sum equals K (prefix + hash)</h3>
<p>Count stretches that add up to k, negatives allowed. Keep a running total and a map "running total → times seen", started with <code>[0, 1]</code>. At each item, add the count of <code>running - k</code>. This is the "prefix sum + hash" trace in the Mental Model; full code in <a href="#/topic/dsa-hashing#ex-6">Example 6</a>. O(n) time, O(n) space.</p>

<h3>Continuous subarray with sum multiple of K</h3>
<p><strong>The problem:</strong> is there a stretch of at least 2 items whose sum is a multiple of k (0, k, 2k, ...)? Example: <code>[23, 2, 4, 6, 7]</code> with k = 6 → yes, <code>[2, 4]</code> sums to 6.</p>
<p><strong>The idea:</strong> track the <em>remainder</em> of the running total after dividing by k (<code>%</code> in JS). If the same remainder shows up at two positions, the items between them added a whole multiple of k (the remainder came back to where it was). So keep a Map "remainder → first index where it appeared". Start it with <code>[0, -1]</code>: remainder 0 "before index 0".</p>
<div class="diagram"><pre>nums = [23, 2, 4, 6, 7]      k = 6

answer  i  item  running  remainder  first seen at   gap
-       -  -     0        0          -1 (start)
no      0  23    23       5          new → store 0
no      1  2     25       1          new → store 1
YES     2  4     29       5          0               2 - 0 = 2
The stretch after index 0 up to index 2 is [2, 4], sum 6.</pre></div>
<pre><code class="language-js">function checkSubarraySum(nums, k) {
  const firstIndexOf = new Map(); // remainder → first index where it appeared
  firstIndexOf.set(0, -1); // remainder 0 "before the start", so a stretch can begin at index 0
  let runningSum = 0;
  for (let i = 0; i &lt; nums.length; i++) {
    runningSum += nums[i];
    const remainder = ((runningSum % k) + k) % k; // keeps it 0..k-1, even if the sum goes negative
    if (firstIndexOf.has(remainder)) {
      const length = i - firstIndexOf.get(remainder); // items between the two positions
      if (length &gt;= 2) {
        return true;
      }
    } else {
      firstIndexOf.set(remainder, i); // store only the FIRST index: it gives the longest stretch
    }
  }
  return false;
}
console.log(checkSubarraySum([23, 2, 4, 6, 7], 6)); // true  ([2, 4] = 6)
console.log(checkSubarraySum([23, 2, 6, 4, 7], 13)); // false</code></pre>
<p>Time O(n), space O(min(n, k)): there are at most k different remainders.</p>

<h3>Longest consecutive sequence</h3>
<p>Longest run of numbers that follow each other (4, 5, 6, ...) in any order. Put everything in a Set; start counting only from numbers whose smaller neighbour is missing. Full code and trace: <a href="#/topic/dsa-hashing#ex-7">Example 7</a>. O(n).</p>

<h3>Isomorphic strings</h3>
<p><strong>The problem:</strong> can you turn string <code>s</code> into string <code>t</code> by swapping each letter for another, consistently? "egg" → "add" works (e→a, g→d). "foo" → "bar" does not (o would need to become both a and r).</p>
<p><strong>The idea:</strong> two maps, one for each direction. <code>sToT</code> makes sure each letter of s always becomes the same letter. <code>tToS</code> makes sure two different letters of s don't both become the same letter of t.</p>
<pre><code class="language-js">function isIsomorphic(s, t) {
  if (s.length !== t.length) {
    return false;
  }
  const sToT = new Map(); // letter in s → the letter it must become in t
  const tToS = new Map(); // letter in t → the letter of s it came from
  for (let i = 0; i &lt; s.length; i++) {
    const fromLetter = s[i];
    const toLetter = t[i];
    if (sToT.has(fromLetter) &amp;&amp; sToT.get(fromLetter) !== toLetter) {
      return false; // this letter already turns into something else
    }
    if (tToS.has(toLetter) &amp;&amp; tToS.get(toLetter) !== fromLetter) {
      return false; // another letter already turns into this one
    }
    sToT.set(fromLetter, toLetter);
    tToS.set(toLetter, fromLetter);
  }
  return true;
}
console.log(isIsomorphic("egg", "add")); // true
console.log(isIsomorphic("foo", "bar")); // false
console.log(isIsomorphic("badc", "baba")); // false  (b and d would both become b)</code></pre>
<p>Time O(n), space O(number of different letters).</p>

<h3>Word pattern</h3>
<p>The same two-map idea, but letters ↔ whole words: does <code>"abba"</code> match <code>"dog cat cat dog"</code>? Full code and trace: <a href="#/topic/dsa-hashing#ex-13">Example 13</a>.</p>

<h3>Hashing tuples (coordinates)</h3>
<p>A grid (a <a href="#/topic/dsa-words#w-matrix">matrix</a>: rows and columns) problem often needs "have I visited cell (row, col)?". You can't use the pair <code>[row, col]</code> as a key (see the next heading), so turn it into a string, or use a 2D array of true/false when you know the grid's size.</p>
<pre><code class="language-js">// Way 1: a Set of "row,col" strings
const visited = new Set();
const row = 2;
const col = 3;
visited.add(row + "," + col); // the key is the string "2,3"
console.log(visited.has("2,3")); // true
console.log(visited.has("3,2")); // false  (order matters: a different cell)

// Way 2: a 2D array of true/false, when the grid size is known
const rowCount = 4;
const colCount = 5;
const visitedGrid = [];
for (let r = 0; r &lt; rowCount; r++) {
  visitedGrid.push(new Array(colCount).fill(false)); // one row of "not visited"
}
visitedGrid[2][3] = true;
console.log(visitedGrid[2][3]); // true</code></pre>
<p>Way 2 is faster and lighter when the size is known, because it does no string building and no hashing.</p>

<h3>Hash collisions awareness</h3>
<p>Before worrying about real collisions (two different keys landing on the same hook, which JS handles for you), watch out for keys that <em>look</em> equal but aren't. An array key is matched by <strong>identity</strong> (which exact array object it is), not by its contents.</p>
<pre><code class="language-js">const labels = new Map();
labels.set([1, 2], "a"); // this array object is the key
console.log(labels.has([1, 2])); // false  (a brand-new array, a different object)

// Fix: turn the pair into a string
labels.set("1,2", "a");
console.log(labels.has("1,2")); // true  (strings compare by their characters)</code></pre>

<h3>JSON.stringify for complex keys</h3>
<p>For a key that is a whole object, <code>JSON.stringify</code> turns it into a string you can use as a key.</p>
<pre><code class="language-js">const key = JSON.stringify({ a: 1, b: 2 });
console.log(key); // {"a":1,"b":2}

// Caveat: the string follows the order the properties were written in
const sameDataOtherOrder = JSON.stringify({ b: 2, a: 1 });
console.log(sameDataOtherOrder); // {"b":2,"a":1}
console.log(key === sameDataOtherOrder); // false  (same data, different key!)</code></pre>
<p>So always build the object with properties in the same order, or build the key string by hand (e.g. <code>a + "|" + b</code>). It is also slow when done in a hot loop (Anti-pattern 6).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<p>Fifteen classic interview problems. Each one has the problem in plain words, the idea, a short trace, code you can paste into a console, and its cost in words.</p>

<h3 id="ex-1">Example 1 — Two sum</h3>
<p><strong>The problem:</strong> Prices <code>[2, 7, 11, 15]</code>, gift card 9. Return the indexes of the two prices that add up to exactly 9. Exactly one answer exists.</p>
<p><strong>The idea:</strong> For each price, ask a Map whether its partner (9 − price) was already seen. If not, store price → index and move on.</p>
<div class="diagram"><pre>nums = [2, 7, 11, 15]    target = 9

found?  i  num  need  seenAt before this step
no      0  2    7     { }          → store 2→0
YES     1  7    2     {2→0}        2 is at index 0
Answer: [0, 1]</pre></div>
<pre><code class="language-js">function twoSum(nums, target) {
  const seenAt = new Map(); // number → index where we saw it
  for (let i = 0; i &lt; nums.length; i++) {
    const need = target - nums[i]; // the complement
    if (seenAt.has(need)) {
      return [seenAt.get(need), i];
    }
    seenAt.set(nums[i], i); // store after asking
  }
  return [];
}
console.log(twoSum([2, 7, 11, 15], 9)); // [ 0, 1 ]
console.log(twoSum([3, 2, 4], 6)); // [ 1, 2 ]</code></pre>
<p><strong>Cost:</strong> time O(n), one pass with one O(1) question per number. Space O(n) for the map.</p>

<h3 id="ex-2">Example 2 — Contains duplicate</h3>
<p><strong>The problem:</strong> Did any customer ID appear twice in today's orders <code>[1, 2, 3, 1]</code>? Return true or false.</p>
<p><strong>The idea:</strong> A Set of IDs seen so far. Before adding an ID, ask if it is already there.</p>
<div class="diagram"><pre>answer  id  seen before this step
-       1   { }
-       2   {1}
-       3   {1, 2}
true    1   {1, 2, 3}     1 is already there
</pre></div>
<pre><code class="language-js">function containsDuplicate(nums) {
  const seen = new Set();
  for (const value of nums) {
    if (seen.has(value)) {
      return true; // stop early: no need to read the rest
    }
    seen.add(value);
  }
  return false;
}
console.log(containsDuplicate([1, 2, 3, 1])); // true
console.log(containsDuplicate([1, 2, 3, 4])); // false

// Short version: a Set drops duplicates, so a smaller size means there was one
function containsDuplicateShort(nums) {
  const uniqueCount = new Set(nums).size;
  return uniqueCount !== nums.length;
}
console.log(containsDuplicateShort([1, 2, 3, 1])); // true</code></pre>
<p><strong>Cost:</strong> time O(n), space O(n). The loop version can stop early; the short version always reads everything but is one clear line of logic.</p>

<h3 id="ex-3">Example 3 — Valid anagram</h3>
<p><strong>The problem:</strong> Are <code>"tea"</code> and <code>"ate"</code> made of the same letters? (Lowercase a–z only.)</p>
<p><strong>The idea:</strong> One array of 26 counts. Walk both words together: add 1 for each letter of the first word, subtract 1 for each letter of the second. If every count ends at 0, they match.</p>
<div class="diagram"><pre>s = "tea"   t = "ate"

counts after step (non-zero only)   i  +s[i]  -t[i]
{t:1, a:-1}                         0  t      a
{a:-1, e:1}                         1  e      t     (t back to 0)
{ }                                 2  a      e     all zero
Answer: true</pre></div>
<pre><code class="language-js">function isAnagram(s, t) {
  if (s.length !== t.length) {
    return false; // different lengths can never match
  }
  const counts = new Array(26).fill(0); // slot 0 = 'a' ... slot 25 = 'z'
  for (let i = 0; i &lt; s.length; i++) {
    const slotS = s.charCodeAt(i) - 97; // 'a' has char code 97
    const slotT = t.charCodeAt(i) - 97;
    counts[slotS] = counts[slotS] + 1; // letter from s: one more
    counts[slotT] = counts[slotT] - 1; // letter from t: one less
  }
  for (const count of counts) {
    if (count !== 0) {
      return false; // some letter was used a different number of times
    }
  }
  return true;
}
console.log(isAnagram("tea", "ate")); // true
console.log(isAnagram("rat", "car")); // false</code></pre>
<p><strong>Cost:</strong> time O(n). Space O(1): the array is always 26 slots, however long the words are. For letters beyond a–z (emoji, accents), use a Map instead.</p>

<h3 id="ex-4">Example 4 — Group anagrams</h3>
<p><strong>The problem:</strong> Group the words <code>["eat", "tea", "tan", "ate", "nat", "bat"]</code> so that anagrams sit together.</p>
<p><strong>The idea:</strong> Give every word a shared label: its letters sorted. Anagrams get the same label. A Map from label → list of words does the grouping.</p>
<div class="diagram"><pre>groups after step                         word   label
{aet:[eat]}                               eat    aet
{aet:[eat,tea]}                           tea    aet
{aet:[eat,tea], ant:[tan]}                tan    ant
{aet:[eat,tea,ate], ant:[tan]}            ate    aet
{aet:[eat,tea,ate], ant:[tan,nat]}        nat    ant
{aet:[...], ant:[...], abt:[bat]}         bat    abt</pre></div>
<pre><code class="language-js">function groupAnagrams(words) {
  const groups = new Map(); // label (sorted letters) → words with that label
  for (const word of words) {
    const label = word.split("").sort().join(""); // "tea" → ["t","e","a"] → sorted → "aet"
    if (!groups.has(label)) {
      groups.set(label, []); // first word with this label
    }
    const group = groups.get(label);
    group.push(word);
  }
  return [...groups.values()]; // just the lists
}
const result = groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]);
console.log(JSON.stringify(result)); // [["eat","tea","ate"],["tan","nat"],["bat"]]</code></pre>
<p><strong>Cost:</strong> time O(n · k log k) for n words of up to k letters, because each word is sorted. Space O(n · k) to store every word. The count-label version in Mechanics is O(n · k).</p>

<h3 id="ex-5">Example 5 — Top K frequent (bucket sort)</h3>
<p><strong>The problem:</strong> Song plays today: <code>[1, 1, 1, 2, 2, 3]</code> (song IDs). Return the k = 2 most played songs.</p>
<p><strong>The idea:</strong> Count plays with a frequency map. Then make <strong>buckets</strong>: bucket number f holds the songs played exactly f times. No song can be played more than n times, so buckets 0..n are enough. Walk from the highest bucket down, collecting songs until you have k.</p>
<div class="diagram"><pre>counts:  {1:3, 2:2, 3:1}

result so far   bucket  songs in it
[]              6       []
[]              5       []
[]              4       []
[1]             3       [1]
[1, 2]          2       [2]     have k = 2 → stop
Answer: [1, 2]</pre></div>
<pre><code class="language-js">function topKFrequent(nums, k) {
  // 1. Count how many times each value appears
  const counts = new Map();
  for (const value of nums) {
    const current = counts.has(value) ? counts.get(value) : 0; // 0 if new
    counts.set(value, current + 1);
  }

  // 2. Bucket f holds the values that appear exactly f times
  const buckets = [];
  for (let f = 0; f &lt;= nums.length; f++) {
    buckets.push([]); // one empty bucket per possible count
  }
  for (const [value, count] of counts) {
    buckets[count].push(value);
  }

  // 3. Walk from the biggest count down, collecting k values
  const result = [];
  for (let f = buckets.length - 1; f &gt;= 0; f--) {
    for (const value of buckets[f]) {
      result.push(value);
      if (result.length === k) {
        return result; // got enough
      }
    }
  }
  return result; // fewer than k different values exist
}
console.log(topKFrequent([1, 1, 1, 2, 2, 3], 2)); // [ 1, 2 ]
console.log(topKFrequent([7], 1)); // [ 7 ]</code></pre>
<p><strong>Cost:</strong> time O(n): counting is one pass, there are n + 1 buckets, and each value goes into one bucket. Space O(n). A heap version is O(n log k); sorting all counts is O(n log n).</p>

<h3 id="ex-6">Example 6 — Subarray sum equals K</h3>
<p><strong>The problem:</strong> Daily profit (can be negative) <code>[1, 1, 1]</code>. How many runs of days in a row add up to exactly k = 2?</p>
<p><strong>The idea:</strong> Running total plus a map "running total → times seen", started with <code>{0: 1}</code>. At each day, the number of good runs ending today equals how many times <code>running - k</code> was seen before. (The full reasoning is the "prefix sum + hash" picture in the Mental Model.)</p>
<div class="diagram"><pre>nums = [1, 1, 1]    k = 2

count so far  item  running  need (running - 2)  times seen  map after
0             -     0        -                   -           {0:1}
0             1     1        -1                  0           {0:1, 1:1}
1             1     2        0                   1           {0:1, 1:1, 2:1}
2             1     3        1                   1           {.., 3:1}
Answer: 2   (days 0..1 and days 1..2)</pre></div>
<pre><code class="language-js">function subarraySum(nums, k) {
  const timesSeen = new Map(); // running total → how many times we have had it
  timesSeen.set(0, 1); // the empty start: running total 0, seen once
  let runningSum = 0;
  let total = 0; // the answer: how many good stretches so far
  for (const value of nums) {
    runningSum += value;
    const need = runningSum - k; // an earlier total this size means a stretch summing to k
    if (timesSeen.has(need)) {
      total += timesSeen.get(need); // one good stretch per earlier match
    }
    const current = timesSeen.has(runningSum) ? timesSeen.get(runningSum) : 0;
    timesSeen.set(runningSum, current + 1); // record this total AFTER asking
  }
  return total;
}
console.log(subarraySum([1, 1, 1], 2)); // 2
console.log(subarraySum([1, -1, 2, 1], 2)); // 3  (negatives are fine)</code></pre>
<p><strong>Cost:</strong> time O(n), one pass. Space O(n) for the map. Works with negative numbers, unlike a sliding window.</p>

<h3 id="ex-7">Example 7 — Longest consecutive sequence</h3>
<p><strong>The problem:</strong> Seat numbers booked: <code>[100, 4, 200, 1, 3, 2]</code>. What is the longest run of seats in a row (in any order in the list)? Here 1, 2, 3, 4 → 4. It must be O(n), so sorting (O(n log n)) is not allowed.</p>
<p><strong>The idea:</strong> Put all numbers in a Set. A number starts a run only if its smaller neighbour (number − 1) is NOT in the set. From each start, count upward while the next number exists.</p>
<div class="diagram"><pre>set = {100, 4, 200, 1, 3, 2}

best  n    n - 1 in set?   what happens
1     100  99: no          start: 100 (101 missing) → length 1
1     4    3: yes          not a start, skip
1     200  199: no         start: 200 → length 1
4     1    0: no           start: 1, 2, 3, 4 (5 missing) → length 4
4     3    2: yes          skip
4     2    1: yes          skip
Answer: 4</pre></div>
<pre><code class="language-js">function longestConsecutive(nums) {
  const numberSet = new Set(nums); // O(1) "is this number here?"
  let best = 0;
  for (const n of numberSet) {
    if (numberSet.has(n - 1)) {
      continue; // n is in the middle of a run: let the run's start count it
    }
    let current = n; // n is the smallest member of a run
    let length = 1;
    while (numberSet.has(current + 1)) { // walk up the run
      current++;
      length++;
    }
    best = Math.max(best, length);
  }
  return best;
}
console.log(longestConsecutive([100, 4, 200, 1, 3, 2])); // 4
console.log(longestConsecutive([])); // 0</code></pre>
<p><strong>Cost:</strong> time O(n), even with a <code>while</code> inside the <code>for</code>. The <code>while</code> only runs from a run's start, and each number is walked over by at most one run, so all the <code>while</code> steps together add up to at most n. Space O(n) for the set.</p>

<h3 id="ex-8">Example 8 — Intersection of two arrays</h3>
<p><strong>The problem:</strong> Two friends' favourite song IDs: <code>[1, 2, 2, 1]</code> and <code>[2, 2]</code>. Which songs do both like? Each song listed once: <code>[2]</code>.</p>
<p><strong>The idea:</strong> Put the first list in a Set. Walk the second list; keep a value if the Set has it. Collect results in a second Set so each appears once.</p>
<div class="diagram"><pre>firstSet = {1, 2}

result after step   value from 2nd list   in firstSet?
{2}                 2                     yes
{2}                 2                     yes (already in result)
Answer: [2]</pre></div>
<pre><code class="language-js">function intersection(first, second) {
  const firstSet = new Set(first);
  const both = new Set(); // a Set, so each shared value appears once
  for (const value of second) {
    if (firstSet.has(value)) {
      both.add(value);
    }
  }
  return [...both];
}
console.log(intersection([1, 2, 2, 1], [2, 2])); // [ 2 ]
console.log(intersection([4, 9, 5], [9, 4, 9, 8, 4])); // [ 9, 4 ]</code></pre>
<p><strong>Cost:</strong> time O(a + b) for lists of length a and b, with no nested loop. Space O(a).</p>

<h3 id="ex-9">Example 9 — Find common characters</h3>
<p><strong>The problem:</strong> Which letters appear in <em>every</em> word, counting repeats? For <code>["bella", "label", "roller"]</code> the answer is <code>["e", "l", "l"]</code>: every word has at least one e and at least two l's.</p>
<p><strong>The idea:</strong> Count letters in each word (26 slots). Keep, for each letter, the <em>smallest</em> count across all words so far. That minimum is how many copies every word can supply.</p>
<div class="diagram"><pre>min so far (non-zero only)    word     its counts
{a:1, b:1, e:1, l:2}          bella    a1 b1 e1 l2
{a:1, b:1, e:1, l:2}          label    a1 b1 e1 l2
{e:1, l:2}                    roller   e1 l2 o1 r2  (no a, no b)
Answer: e once, l twice → ["e", "l", "l"]</pre></div>
<pre><code class="language-js">function commonChars(words) {
  const minCounts = new Array(26).fill(Infinity); // "no limit yet" for every letter
  for (const word of words) {
    const counts = new Array(26).fill(0);
    for (const letter of word) {
      const slot = letter.charCodeAt(0) - 97;
      counts[slot] = counts[slot] + 1;
    }
    for (let slot = 0; slot &lt; 26; slot++) {
      minCounts[slot] = Math.min(minCounts[slot], counts[slot]); // keep the smallest
    }
  }
  const result = [];
  for (let slot = 0; slot &lt; 26; slot++) {
    for (let copy = 0; copy &lt; minCounts[slot]; copy++) {
      result.push(String.fromCharCode(97 + slot)); // slot number back to a letter
    }
  }
  return result;
}
console.log(commonChars(["bella", "label", "roller"])); // [ 'e', 'l', 'l' ]
console.log(commonChars(["cool", "lock", "cook"])); // [ 'c', 'o' ]</code></pre>
<p><strong>Cost:</strong> time O(total letters in all words), since the 26-slot loops are a fixed cost per word. Space O(1): two arrays of 26.</p>

<h3 id="ex-10">Example 10 — First unique character</h3>
<p><strong>The problem:</strong> In <code>"loveleetcode"</code>, what is the index of the first letter that appears only once? Here 'v' at index 2. Return -1 if none.</p>
<p><strong>The idea:</strong> Two passes. Pass 1 counts every letter. Pass 2 walks the word again, in order, and returns the first index whose letter has count 1.</p>
<div class="diagram"><pre>counts: l2 o2 v1 e4 t1 c1 d1

answer  i  letter  count
-       0  l       2
-       1  o       2
2       2  v       1    first count of 1 → return 2</pre></div>
<pre><code class="language-js">function firstUniqChar(text) {
  const counts = new Array(26).fill(0);
  for (const letter of text) { // pass 1: count
    const slot = letter.charCodeAt(0) - 97;
    counts[slot] = counts[slot] + 1;
  }
  for (let i = 0; i &lt; text.length; i++) { // pass 2: first letter seen once
    const slot = text.charCodeAt(i) - 97;
    if (counts[slot] === 1) {
      return i;
    }
  }
  return -1; // every letter repeats
}
console.log(firstUniqChar("leetcode")); // 0
console.log(firstUniqChar("loveleetcode")); // 2
console.log(firstUniqChar("aabb")); // -1</code></pre>
<p><strong>Cost:</strong> time O(n), two passes. Space O(1), a 26-slot array.</p>

<h3 id="ex-11">Example 11 — Happy number</h3>
<p><strong>The problem:</strong> Replace a number by the sum of the squares of its digits, again and again. If you reach 1, the number is "happy". Some numbers never reach 1; they go round in a loop forever. Is 19 happy?</p>
<p><strong>The idea:</strong> Remember every number you have reached in a Set. If you reach one you've seen before, you are in a loop (a <a href="#/topic/dsa-words#w-cycle">cycle</a>) and will never get to 1.</p>
<div class="diagram"><pre>19 → 1² + 9² = 82
82 → 64 + 4  = 68
68 → 36 + 64 = 100
100 → 1 + 0 + 0 = 1     reached 1 → happy (true)

2 → 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4
                                            4 again → loop (false)</pre></div>
<pre><code class="language-js">function sumOfDigitSquares(n) {
  let sum = 0;
  while (n &gt; 0) {
    const digit = n % 10; // the last digit
    sum += digit * digit;
    n = Math.floor(n / 10); // drop the last digit
  }
  return sum;
}

function isHappy(n) {
  const seen = new Set(); // every number reached so far
  while (n !== 1 &amp;&amp; !seen.has(n)) {
    seen.add(n);
    n = sumOfDigitSquares(n);
  }
  return n === 1; // stopped because we reached 1 (happy) or repeated (not happy)
}
console.log(isHappy(19)); // true
console.log(isHappy(2)); // false</code></pre>
<p><strong>Cost:</strong> the sequence quickly drops to small numbers (any number with d digits maps to at most 81 × d), so the loop runs a small number of times: about O(log n) work per step and few steps. Space: the Set holds the numbers reached. A no-memory alternative is <a href="#/topic/dsa-words#w-fast-slow-pointers">Floyd's fast and slow pointers</a>: one walker moves 2 steps at a time, one moves 1, and they meet if there is a loop.</p>

<h3 id="ex-12">Example 12 — Find all duplicates in array (1..n)</h3>
<p><strong>The problem:</strong> An array of length n holds numbers from 1 to n. Some appear twice, the rest once. Return the ones that appear twice. For <code>[4, 3, 2, 7, 8, 2, 3, 1]</code> → <code>[2, 3]</code>.</p>
<p><strong>The idea:</strong> A Set of numbers seen. When a number is already in it, it is a duplicate.</p>
<div class="diagram"><pre>result  value  seen before this step
[]      4      { }
[]      3      {4}
[]      2      {4, 3}
[]      7      {4, 3, 2}
[]      8      {4, 3, 2, 7}
[2]     2      {4, 3, 2, 7, 8}       2 again
[2, 3]  3      {4, 3, 2, 7, 8}       3 again
[2, 3]  1      {4, 3, 2, 7, 8}       new
Answer: [2, 3]</pre></div>
<pre><code class="language-js">function findDuplicates(nums) {
  const seen = new Set();
  const result = [];
  for (const value of nums) {
    if (seen.has(value)) {
      result.push(value); // second time we meet it
    } else {
      seen.add(value);
    }
  }
  return result;
}
console.log(findDuplicates([4, 3, 2, 7, 8, 2, 3, 1])); // [ 2, 3 ]</code></pre>
<p><strong>Cost:</strong> time O(n), space O(n).</p>
<p><strong>The O(1)-space trick:</strong> because every value is between 1 and n, value v can "own" the slot at index v − 1. Mark a value as seen by making its slot negative. If the slot is already negative, v was seen before. This changes the input array <a href="#/topic/dsa-words#w-in-place">in place</a>, so only use it when that is allowed.</p>
<pre><code class="language-js">function findDuplicatesNoExtraSpace(nums) {
  const result = [];
  for (let i = 0; i &lt; nums.length; i++) {
    const value = Math.abs(nums[i]); // the slot may already be negative from an earlier mark
    const slot = value - 1; // value v owns index v - 1
    if (nums[slot] &lt; 0) {
      result.push(value); // already marked: v was seen before
    } else {
      nums[slot] = -nums[slot]; // mark v as seen
    }
  }
  return result;
}
console.log(findDuplicatesNoExtraSpace([4, 3, 2, 7, 8, 2, 3, 1])); // [ 2, 3 ]</code></pre>

<h3 id="ex-13">Example 13 — Word pattern</h3>
<p><strong>The problem:</strong> Does the sentence <code>"dog cat cat dog"</code> follow the pattern <code>"abba"</code>? Each letter must always stand for the same word, and two different letters must not stand for the same word.</p>
<p><strong>The idea:</strong> Two maps, one per direction: letter → word and word → letter. A clash in either one means no.</p>
<div class="diagram"><pre>pattern = "abba"   words = dog cat cat dog

ok?  i  letter  word  letterToWord before   wordToLetter before
yes  0  a       dog   { }                   { }
yes  1  b       cat   {a→dog}               {dog→a}
yes  2  b       cat   {a→dog, b→cat}        {dog→a, cat→b}
yes  3  a       dog   (a→dog matches)       (dog→a matches)
Answer: true</pre></div>
<pre><code class="language-js">function wordPattern(pattern, sentence) {
  const words = sentence.split(" ");
  if (words.length !== pattern.length) {
    return false;
  }
  const letterToWord = new Map();
  const wordToLetter = new Map();
  for (let i = 0; i &lt; pattern.length; i++) {
    const letter = pattern[i];
    const word = words[i];
    if (letterToWord.has(letter) &amp;&amp; letterToWord.get(letter) !== word) {
      return false; // this letter already means a different word
    }
    if (wordToLetter.has(word) &amp;&amp; wordToLetter.get(word) !== letter) {
      return false; // this word already belongs to a different letter
    }
    letterToWord.set(letter, word);
    wordToLetter.set(word, letter);
  }
  return true;
}
console.log(wordPattern("abba", "dog cat cat dog")); // true
console.log(wordPattern("abba", "dog cat cat fish")); // false
console.log(wordPattern("abba", "dog dog dog dog")); // false  (a and b can't both be dog)</code></pre>
<p><strong>Cost:</strong> time O(n) over the words (plus the time to split the sentence), space O(n). The second map is what catches "dog dog dog dog".</p>

<h3 id="ex-14">Example 14 — Sudoku validity (3 hash sets)</h3>
<p><strong>The problem:</strong> A part-filled 9 × 9 Sudoku board (<code>"."</code> = empty). Is it valid so far? No digit may repeat in any row, any column, or any of the nine 3 × 3 boxes.</p>
<p><strong>The idea:</strong> 9 Sets for rows, 9 for columns, 9 for boxes. For each filled cell, check its row set, column set and box set; then add the digit to all three. The box number for (row, col) is <code>Math.floor(row / 3) * 3 + Math.floor(col / 3)</code>: boxes 0, 1, 2 across the top, 3, 4, 5 in the middle, 6, 7, 8 at the bottom.</p>
<div class="diagram"><pre>box numbers                  cell (4, 7):
 0 | 1 | 2                   floor(4 / 3) = 1  → middle band
---+---+---                  floor(7 / 3) = 2  → right stack
 3 | 4 | 5                   box = 1 * 3 + 2 = 5
---+---+---
 6 | 7 | 8</pre></div>
<pre><code class="language-js">function isValidSudoku(board) {
  const rowSets = [];
  const colSets = [];
  const boxSets = [];
  for (let i = 0; i &lt; 9; i++) {
    rowSets.push(new Set()); // digits already in row i
    colSets.push(new Set()); // digits already in column i
    boxSets.push(new Set()); // digits already in box i
  }
  for (let row = 0; row &lt; 9; row++) {
    for (let col = 0; col &lt; 9; col++) {
      const digit = board[row][col];
      if (digit === ".") {
        continue; // empty cell: nothing to check
      }
      const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      if (rowSets[row].has(digit) || colSets[col].has(digit) || boxSets[box].has(digit)) {
        return false; // this digit already appears in the same row, column or box
      }
      rowSets[row].add(digit);
      colSets[col].add(digit);
      boxSets[box].add(digit);
    }
  }
  return true;
}

const rows = [
  "53..7....",
  "6..195...",
  ".98....6.",
  "8...6...3",
  "4..8.3..1",
  "7...2...6",
  ".6....28.",
  "...419..5",
  "....8..79"
];
const board = [];
for (const line of rows) {
  board.push(line.split("")); // each row becomes an array of 9 characters
}
console.log(isValidSudoku(board)); // true

board[0][0] = "8"; // now column 0 has two 8s (rows 0 and 3)
console.log(isValidSudoku(board)); // false</code></pre>
<p><strong>Cost:</strong> the board is always 81 cells, so time and space are O(1) (fixed). For an n × n board it would be O(n²) time and space.</p>

<h3 id="ex-15">Example 15 — 4-sum II (count tuples)</h3>
<p><strong>The problem:</strong> Four lists A, B, C, D, each of length n. Count the ways to pick one number from each so that a + b + c + d = 0. A "tuple" here just means one such pick of four.</p>
<p><strong>The idea:</strong> Trying every pick is n⁴. Split it in half. First, count every pair sum a + b in a Map. Then for every pair c + d, the half you need from A and B is <code>0 - (c + d)</code>: add how many A + B pairs gave that.</p>
<div class="diagram"><pre>A = [1, 2]   B = [-2, -1]   C = [-1, 2]   D = [0, 2]
pair sums A + B:  1-2=-1  1-1=0  2-2=0  2-1=1
map: {-1:1, 0:2, 1:1}

count  c   d  c + d  need = -(c + d)  ways in map
1      -1  0  -1     1                1
2      -1  2  1      -1               1
2      2   0  2      -2               0
2      2   2  4      -4               0
Answer: 2</pre></div>
<pre><code class="language-js">function fourSumCount(listA, listB, listC, listD) {
  const pairSumCount = new Map(); // a + b → how many (a, b) pairs give it
  for (const a of listA) {
    for (const b of listB) {
      const pairSum = a + b;
      const current = pairSumCount.has(pairSum) ? pairSumCount.get(pairSum) : 0;
      pairSumCount.set(pairSum, current + 1);
    }
  }
  let count = 0;
  for (const c of listC) {
    for (const d of listD) {
      const need = 0 - (c + d); // the a + b that would cancel c + d out
      if (pairSumCount.has(need)) {
        count += pairSumCount.get(need); // every such (a, b) pair makes one tuple
      }
    }
  }
  return count;
}
console.log(fourSumCount([1, 2], [-2, -1], [-1, 2], [0, 2])); // 2</code></pre>
<p><strong>Cost:</strong> time O(n²): two double loops of n × n each, with O(1) map work inside. Brute force is O(n⁴). Space O(n²): up to n² different pair sums.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>
<p>An <a href="#/topic/dsa-words#w-edge-case">edge case</a> is an unusual input at the limits, or a corner of the language that surprises you. Each item says what goes wrong, gives a tiny example, and gives the fix.</p>

<h3>1. Map / Set with object keys</h3>
<p><strong>What goes wrong:</strong> A Map matches object and array keys by identity (which exact object it is), not by what is inside. Two arrays that look the same are two different keys.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const points = new Map();
points.set([1, 2], "a");
console.log(points.has([1, 2])); // false  (a new array, a different object)
points.set("1,2", "a");
console.log(points.has("1,2")); // true</code></pre>
<p><strong>Fix:</strong> turn compound keys into strings (<code>row + "," + col</code>), or keep a reference to the exact same object and look up with that.</p>

<h3>2. Object as Map key vs string</h3>
<p><strong>What goes wrong:</strong> A plain object turns every key into a string. Number keys become text, and an object used as a key becomes the useless string <code>"[object Object]"</code>, so all objects share one key.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const store = {};
const userA = { id: 1 };
const userB = { id: 2 };
store[userA] = "A";
store[userB] = "B"; // overwrites "A": both keys became "[object Object]"
console.log(Object.keys(store)); // [ '[object Object]' ]

const betterStore = new Map();
betterStore.set(userA, "A");
betterStore.set(userB, "B");
console.log(betterStore.size); // 2</code></pre>
<p><strong>Fix:</strong> use a Map whenever keys are not plain strings.</p>

<h3>3. <code>0 vs '0'</code></h3>
<p><strong>What goes wrong:</strong> A Map keeps the key's type: the number 0 and the string "0" are different keys. An object turns both into "0". Mixing the two styles gives misses you don't expect.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const byNumber = new Map();
byNumber.set(0, "zero");
console.log(byNumber.get("0")); // undefined  (string "0" is a different key)
console.log(byNumber.get(0)); // zero

const plain = {};
plain[0] = "zero";
console.log(plain["0"]); // zero  (the object turned 0 into "0")</code></pre>
<p><strong>Fix:</strong> keep keys one type. If values come from text (input fields, <code>split</code>), convert them with <code>Number(...)</code> before using them as Map keys.</p>

<h3>4. Map size vs object size</h3>
<p><strong>What goes wrong:</strong> Objects have no size property. <code>Object.keys(obj).length</code> builds a whole array of keys first, which is O(n) every time you ask.</p>
<p><strong>Tiny example:</strong> <code>map.size</code> is O(1). <code>Object.keys(counts).length</code> inside a loop of n steps adds O(n²) work.</p>
<p><strong>Fix:</strong> use a Map and <code>map.size</code>, especially when you check the size on every step (like "how many different letters are in the window?").</p>

<h3>5. Iteration order</h3>
<p><strong>What goes wrong:</strong> Maps and Sets loop in the order you added keys. Objects mostly do too, except that keys that look like whole numbers ("1", "2") jump to the front, sorted.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const plain = {};
plain.b = 1;
plain[2] = 1;
plain.a = 1;
plain[1] = 1;
console.log(Object.keys(plain)); // [ '1', '2', 'b', 'a' ]  (number-like keys first)

const ordered = new Map();
ordered.set("b", 1);
ordered.set(2, 1);
ordered.set("a", 1);
ordered.set(1, 1);
console.log([...ordered.keys()]); // [ 'b', 2, 'a', 1 ]  (exactly as added)</code></pre>
<p><strong>Fix:</strong> if your answer depends on "first seen" order, use a Map.</p>

<h3>6. NaN as key</h3>
<p><strong>What goes wrong:</strong> In plain JS, <code>NaN === NaN</code> is false, so you might think NaN can never be found as a key. A Map uses a slightly different rule (called SameValueZero) where NaN equals NaN, and +0 equals -0.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">console.log(NaN === NaN); // false
const results = new Map();
results.set(NaN, "not a number");
console.log(results.get(NaN)); // not a number  (Map finds it)
results.set(-0, "zero");
console.log(results.get(0)); // zero  (-0 and 0 are the same key)</code></pre>
<p><strong>Fix:</strong> nothing to fix, just know it. If NaN shows up as a key, it usually means a bad calculation earlier.</p>

<h3>7. Empty map operations</h3>
<p><strong>What goes wrong:</strong> <code>map.get(missingKey)</code> returns <code>undefined</code>; it does not throw. So <code>map.get(key) + 1</code> on a new key gives <code>NaN</code>. And a value can legitimately be 0, which is falsy, so "missing" and "zero" look the same in an <code>if</code>.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const counts = new Map();
console.log(counts.get("x") + 1); // NaN  (undefined + 1)
counts.set("y", 0);
console.log(Boolean(counts.get("y"))); // false, although "y" IS in the map
console.log(counts.has("y")); // true</code></pre>
<p><strong>Fix:</strong> read the old value into a variable with a <code>has</code> check (or <code>?? 0</code>) before adding. Use <code>has</code> to ask "is it there?".</p>

<h3>8. Hash collisions on adversarial input</h3>
<p><strong>What goes wrong:</strong> If many keys land on the same hook, lookups slow from O(1) toward O(n). Someone attacking a server can try to send keys built to collide.</p>
<p><strong>Tiny example:</strong> If 10,000 keys all collide, each lookup checks up to 10,000 entries, and 10,000 inserts cost about 50 million checks.</p>
<p><strong>Fix:</strong> JS engines choose the hash rule internally and mix in random values, so in normal app code and interviews you can treat it as O(1) average. For security-critical systems handling untrusted input, rely on keyed (secret-seeded) hashing and size limits.</p>

<h3>9. WeakMap can't be iterated</h3>
<p><strong>What goes wrong:</strong> A <code>WeakMap</code> lets the garbage collector (the part of JS that frees unused memory) delete an entry once nothing else uses its key. To allow that, it hides its contents: it has no <code>size</code>, no <code>keys()</code>, and you can't loop over it. Its keys must be objects.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const cache = new WeakMap();
const page = { url: "/home" };
cache.set(page, "rendered html");
console.log(cache.get(page)); // rendered html
console.log(cache.size); // undefined  (no size on a WeakMap)
console.log(typeof cache.keys); // undefined  (no way to list keys)</code></pre>
<p><strong>Fix:</strong> use a normal Map for algorithm work. WeakMap is for caching data attached to objects in app code.</p>

<h3>10. JSON.stringify for compound keys</h3>
<p><strong>What goes wrong:</strong> <code>JSON.stringify</code> writes properties in the order they were added. The same data built in a different order gives a different string, so a different key.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const first = JSON.stringify({ a: 1, b: 2 });
const second = JSON.stringify({ b: 2, a: 1 });
console.log(first); // {"a":1,"b":2}
console.log(second); // {"b":2,"a":1}
console.log(first === second); // false</code></pre>
<p><strong>Fix:</strong> build keys in a fixed order yourself, e.g. <code>obj.a + "|" + obj.b</code>. It is also faster.</p>

<h3>11. Counter map vs Array index</h3>
<p><strong>What goes wrong:</strong> Using a Map to count the 26 letters works, but does hashing work on every letter. With a known small range, an array is simpler and faster.</p>
<p><strong>Tiny example:</strong> counting "banana" with <code>new Array(26).fill(0)</code> is <code>counts[letter.charCodeAt(0) - 97]</code> plus 1, with no hashing at all.</p>
<p><strong>Fix:</strong> lowercase a–z only → 26-slot array. Digits 0–9 → 10-slot array. Anything else (any characters, words, big numbers) → Map.</p>

<h3>12. Two-sum with duplicates</h3>
<p><strong>What goes wrong:</strong> With repeated values, storing before asking lets a number pair with itself, and storing overwrites a useful earlier index.</p>
<p><strong>Tiny example:</strong> <code>[3, 3]</code>, target 6. Ask-then-store: at index 1, need 3, the map has 3 → index 0, answer <code>[0, 1]</code>. Correct. Store-then-ask with <code>[3]</code> and target 6 would wrongly return <code>[0, 0]</code>.</p>
<p><strong>Fix:</strong> always ask for the complement first, then store. If the question wants <em>all</em> pairs, store a count (or a list of indexes) per value instead of one index.</p>

<h3>13. Subarray sum K with negatives</h3>
<p><strong>What goes wrong:</strong> A sliding window assumes that adding an item makes the sum bigger and removing one makes it smaller. Negative numbers break that, so the window doesn't know which way to move.</p>
<p><strong>Tiny example:</strong> <code>[1, -1, 2, 1]</code>, k = 2: a window would miss <code>[1, -1, 2]</code>. Prefix sum + hash finds all 3 (see the Mental Model trace).</p>
<p><strong>Fix:</strong> for "sum equals k" with negatives allowed, use prefix sum + Map. The prefix method only asks "was this total seen?", which doesn't care whether totals go up or down.</p>

<h3>14. Longest consecutive — careful start detection</h3>
<p><strong>What goes wrong:</strong> If you count upward from <em>every</em> number, a run of length n gets walked n times, n − 1 times, ... That is O(n²).</p>
<p><strong>Tiny example:</strong> <code>[1, 2, 3, 4, 5]</code> without the start check: 5 + 4 + 3 + 2 + 1 = 15 steps. With it: 5 steps. For 100,000 numbers in one run, about 5 billion vs 100,000.</p>
<p><strong>Fix:</strong> count only from numbers where <code>!set.has(n - 1)</code>, as in <a href="#/topic/dsa-hashing#ex-7">Example 7</a>.</p>

<h3>15. Frequency map with small fixed range</h3>
<p><strong>What goes wrong:</strong> Same idea as item 11, for any small known range: a Map wastes time and memory on hashing.</p>
<p><strong>Tiny example:</strong> exam scores 0–100 → <code>new Array(101).fill(0)</code>, and <code>counts[score]</code> is the slot. No hashing.</p>
<p><strong>Fix:</strong> if the keys are small whole numbers in a known range, use an array of that size. Arrays sit in one block of memory, which the processor reads fast.</p>

<h3>16. Set difference / intersection</h3>
<p><strong>What goes wrong:</strong> For years JS had no built-in "union / intersection / difference" for Sets (newer engines added <code>a.union(b)</code> and friends in 2024, but don't count on them everywhere). You have to write them.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const morning = new Set(["riya", "arjun", "meera"]);
const evening = new Set(["arjun", "kabir"]);

const both = new Set(); // in both sets (intersection)
const onlyMorning = new Set(); // in morning but not evening (difference)
for (const name of morning) {
  if (evening.has(name)) {
    both.add(name);
  } else {
    onlyMorning.add(name);
  }
}
const anyTime = new Set([...morning, ...evening]); // in either (union)
console.log([...both]); // [ 'arjun' ]
console.log([...onlyMorning]); // [ 'riya', 'meera' ]
console.log([...anyTime]); // [ 'riya', 'arjun', 'meera', 'kabir' ]</code></pre>
<p><strong>Fix:</strong> loop over one set and ask the other with <code>has</code>. Each is O(size of the set you loop over).</p>

<h3>17. Removing while iterating Map</h3>
<p><strong>What goes wrong:</strong> In JS, deleting the current key while looping over a Map is allowed and safe. <em>Adding</em> keys while looping is the risky part: new keys get visited too, so a loop that keeps adding can run forever. Code that mixes both is hard to reason about.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const stock = new Map([["pen", 0], ["book", 3], ["bag", 0]]);
const soldOut = []; // pass 1: collect the keys to remove
for (const [item, count] of stock) {
  if (count === 0) {
    soldOut.push(item);
  }
}
for (const item of soldOut) { // pass 2: remove them
  stock.delete(item);
}
console.log([...stock.keys()]); // [ 'book' ]</code></pre>
<p><strong>Fix:</strong> collect the keys first, then delete in a second loop. It is easy to read and works the same in every language.</p>

<h3>18. Map vs Object perf in V8</h3>
<p><strong>What goes wrong:</strong> People argue about which is faster. V8 (Chrome's and Node's JS engine) optimises both. Objects are fast for a fixed set of named fields (like a <code>user</code> record). Maps are usually faster when you add and delete many different keys, which is what algorithms do.</p>
<p><strong>Tiny example:</strong> a frequency count over 1 million words: a Map is the natural fit. A config object with 5 known fields: an object is fine.</p>
<p><strong>Fix:</strong> both are O(1) on average, so Big-O doesn't decide it. Use Map for algorithm work, objects for records.</p>

<h3>19. Large key collision attacks</h3>
<p><strong>What goes wrong:</strong> This is item 8 at server scale. If a server puts user-controlled keys (like form field names) into a hash table, an attacker who knows the hash rule can send thousands of colliding keys and tie up the CPU. This is a real "hash flooding" denial-of-service attack.</p>
<p><strong>Tiny example:</strong> 50,000 crafted field names that all collide turn one request into about a billion comparisons.</p>
<p><strong>Fix:</strong> use secret-seeded (keyed) hash functions, which modern engines and languages do, plus limits on how many keys a request may send.</p>

<h3>20. Float keys</h3>
<p><strong>What goes wrong:</strong> Decimal numbers are stored approximately. <code>0.1 + 0.2</code> is <code>0.30000000000000004</code>, so it is a different key from <code>0.3</code>.</p>
<p><strong>Tiny example:</strong></p>
<pre><code class="language-js">const prices = new Map();
prices.set(0.1 + 0.2, "found");
console.log(prices.get(0.3)); // undefined  (0.30000000000000004 is not 0.3)

const pricesInPaise = new Map(); // store whole numbers instead
pricesInPaise.set(10 + 20, "found");
console.log(pricesInPaise.get(30)); // found</code></pre>
<p><strong>Fix:</strong> use whole numbers (paise instead of rupees, or round to a fixed number of decimals) for keys.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — using array.includes in nested loop</h3>
<p><strong>What goes wrong:</strong> <code>includes</code> searches the array one item at a time, O(n). Inside a loop, that is O(n²) again: the exact slowness hashing is meant to remove.</p>
<pre><code class="language-js">const list1 = [1, 2, 3, 4];
const list2 = [3, 4, 5];

// SLOW: O(n × m), includes scans list2 every time
const slowResult = [];
for (const value of list1) {
  if (list2.includes(value)) {
    slowResult.push(value);
  }
}

// FAST: O(n + m), build a Set once, then O(1) questions
const list2Set = new Set(list2);
const fastResult = [];
for (const value of list1) {
  if (list2Set.has(value)) {
    fastResult.push(value);
  }
}
console.log(fastResult); // [ 3, 4 ]</code></pre>
<p><strong>Fix:</strong> build the Set once, before the loop.</p>

<h3>Anti-pattern 2 — Object as Map for non-string keys</h3>
<p><strong>What goes wrong:</strong> Number and object keys get turned into strings, so <code>1</code> and <code>"1"</code> collide, and every object key becomes <code>"[object Object]"</code> (see Pitfall 2).</p>
<p><strong>Tiny example:</strong> <code>obj[1] = "a"; obj["1"] = "b";</code> leaves one key, "1", with value "b".</p>
<p><strong>Fix:</strong> use a Map.</p>

<h3>Anti-pattern 3 — recreating frequency map in loop</h3>
<p><strong>What goes wrong:</strong> Building a fresh count for each word is fine when each word needs its own count (that work is unavoidable). The waste is rebuilding the <em>same</em> count over and over.</p>
<pre><code class="language-js">const words = ["apple", "plea", "leap"];
const target = "pale";

// BAD: counts "pale" again inside the loop, once per word
// GOOD: count the target once, outside the loop
const targetCounts = new Array(26).fill(0);
for (const letter of target) {
  const slot = letter.charCodeAt(0) - 97;
  targetCounts[slot] = targetCounts[slot] + 1;
}
const matches = [];
for (const word of words) {
  const wordCounts = new Array(26).fill(0); // this one IS per word, so it belongs in the loop
  for (const letter of word) {
    const slot = letter.charCodeAt(0) - 97;
    wordCounts[slot] = wordCounts[slot] + 1;
  }
  if (wordCounts.join(",") === targetCounts.join(",")) {
    matches.push(word); // same letters as "pale"
  }
}
console.log(matches); // [ 'plea', 'leap' ]</code></pre>
<p><strong>Fix:</strong> anything that doesn't change between loop rounds is computed once, before the loop.</p>

<h3>Anti-pattern 4 — using arrays as hash keys</h3>
<p><strong>What goes wrong:</strong> Each array literal is a new object, so it never matches an earlier one (see Pitfall 1).</p>
<pre><code class="language-js">const seenPairs = new Map();
seenPairs.set([1, 2], "a");
console.log(seenPairs.has([1, 2])); // false  (different array object)

// Use a string key instead
seenPairs.set("1,2", "a");
console.log(seenPairs.has("1,2")); // true</code></pre>
<p><strong>Fix:</strong> serialise: join the parts into a string with a separator.</p>

<h3>Anti-pattern 5 — counter check with falsy 0</h3>
<p><strong>What goes wrong:</strong> <code>if (map.get(key))</code> is false for a missing key AND for a stored 0. When 0 is a real value, the check lies.</p>
<pre><code class="language-js">const counts = new Map();
counts.set("apple", 0); // apple is tracked, count currently 0

// BAD: treats a real 0 like "missing"
if (counts.get("apple")) {
  console.log("never printed");
}

// GOOD: ask the right question
if (counts.has("apple")) {
  console.log("apple is tracked"); // printed
}

// GOOD: read with a default only when missing (?? keeps a real 0)
const appleCount = counts.get("apple") ?? 0;
console.log(appleCount); // 0</code></pre>
<p><strong>Fix:</strong> use <code>map.has(key)</code> for "is it there?", and <code>??</code> (only replaces <code>undefined</code>/<code>null</code>) rather than <code>||</code> (replaces any falsy value, including 0) for defaults.</p>

<h3>Anti-pattern 6 — heavy stringify for complex keys</h3>
<p><strong>What goes wrong:</strong> <code>JSON.stringify</code> on every lookup builds a long string each time, with quotes and braces. In a loop that runs millions of times, that dominates the cost.</p>
<p><strong>Tiny example:</strong> <code>JSON.stringify({ row: 2, col: 3 })</code> makes <code>{"row":2,"col":3}</code> (17 characters) when <code>"2,3"</code> (3 characters) would do.</p>
<p><strong>Fix:</strong> build a short key by hand (<code>row + "," + col</code>), or use a nested Map (row → Map of col → value), or a 2D array when the size is known.</p>

<h3>Anti-pattern 7 — forgetting to delete keys at zero</h3>
<p><strong>What goes wrong:</strong> If you use <code>map.size</code> to mean "how many different values are there right now", a key whose count dropped to 0 still counts.</p>
<p><strong>Tiny example:</strong> a window held "a", "b"; "a" leaves and its count goes to 0. If you only set it to 0, <code>map.size</code> still says 2 kinds instead of 1.</p>
<p><strong>Fix:</strong> when a count reaches 0, <code>map.delete(key)</code>.</p>

<h3>Anti-pattern 8 — using Map when Array works</h3>
<p><strong>What goes wrong:</strong> For 26 lowercase letters, a Map adds hashing work and extra memory for no benefit.</p>
<p><strong>Tiny example:</strong> <code>new Array(26).fill(0)</code> plus <code>charCodeAt(0) - 97</code> does the same job with plain indexing.</p>
<p><strong>Fix:</strong> small known range → array; anything else → Map.</p>

<h3>Anti-pattern 9 — over-iterating</h3>
<p><strong>What goes wrong:</strong> Looping over keys and then calling <code>get</code> for each one does two lookups per entry. Looping over entries gives you both at once.</p>
<pre><code class="language-js">const scores = new Map([["riya", 9], ["arjun", 7]]);
const lines = [];

// Wasteful: a second lookup for every key
for (const name of scores.keys()) {
  lines.push(name + "=" + scores.get(name));
}

// Better: key and value together, no extra lookup
for (const [name, score] of scores) {
  lines.push(name + "=" + score);
}
console.log(lines); // [ 'riya=9', 'arjun=7', 'riya=9', 'arjun=7' ]</code></pre>
<p><strong>Fix:</strong> <code>for (const [key, value] of map)</code>.</p>

<h3>Anti-pattern 10 — re-hashing strings on every iteration</h3>
<p><strong>What goes wrong:</strong> Hashing a string reads every character. Building or looking up the same long key many times inside a loop repeats that work.</p>
<p><strong>Tiny example:</strong> a 1,000-character key looked up 10,000 times costs about 10 million character reads.</p>
<p><strong>Fix:</strong> compute the key once, store it in a variable, and reuse it. Or look the value up once and keep it in a variable.</p>

<h3>Anti-pattern 11 — group anagrams via sort instead of count</h3>
<p><strong>What goes wrong:</strong> Sorting each word costs O(k log k) for k letters. Counting costs O(k).</p>
<p><strong>Tiny example:</strong> 10,000 words of 100 letters: sorting is roughly 10,000 × 100 × 7 ≈ 7 million steps, counting about 1 million.</p>
<p><strong>Fix:</strong> for long words, use the letter-count label (<code>groupAnagramsByCount</code> in Mechanics). For short words, sorting is fine and simpler to explain.</p>

<h3>Anti-pattern 12 — relying on Object insertion order pre-ES2015</h3>
<p><strong>What goes wrong:</strong> Older JS versions (before ES2015, the 2015 edition) did not promise any key order for objects. Even today, number-like keys jump to the front (Pitfall 5).</p>
<p><strong>Tiny example:</strong> keys added as "b", "2", "a" come back as "2", "b", "a".</p>
<p><strong>Fix:</strong> when order matters, use a Map: it always loops in insertion order.</p>

<h3>Anti-pattern 13 — using Set as Map alternative</h3>
<p><strong>What goes wrong:</strong> A Set stores keys only. If you later need "how many?" or "at which index?", a Set can't tell you, and people start hacks like storing <code>"apple:3"</code> strings.</p>
<p><strong>Tiny example:</strong> two-sum needs the <em>index</em> of the partner. A Set of seen numbers tells you the partner exists, but not where.</p>
<p><strong>Fix:</strong> need only yes/no → Set. Need anything attached to the key → Map.</p>

<h3>Anti-pattern 14 — not initializing prefix-count map with [0, 1]</h3>
<p><strong>What goes wrong:</strong> The entry <code>0 → 1</code> stands for "before any item, the running total was 0". Without it, stretches that start at index 0 are never counted.</p>
<p><strong>Tiny example:</strong> <code>[2]</code>, k = 2. Running total 2, need 2 − 2 = 0. With <code>{0: 1}</code> the answer is 1. Without it, 0: wrong.</p>
<p><strong>Fix:</strong> always <code>timesSeen.set(0, 1)</code> before the loop. (For the "first index" version, set <code>0 → -1</code>.)</p>

<h3>Anti-pattern 15 — hashing every grid cell as string</h3>
<p><strong>What goes wrong:</strong> For a grid of known size m × n, a Set of <code>"r,c"</code> strings builds a new string and hashes it for every cell visited. That is slower and uses more memory than needed.</p>
<p><strong>Tiny example:</strong> a 1,000 × 1,000 grid: a million string keys in a Set, versus a 2D array of true/false that needs no strings at all.</p>
<p><strong>Fix:</strong> known size → 2D array of booleans (<code>visitedGrid[r][c] = true</code>). Unknown or unbounded grid → Set of string keys.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. When use a hash map?</div>
  <div class="qa-answer">
    <p>Whenever you need to find something fast by a key, instead of searching for it. Typical cases:</p>
    <ul>
      <li>"Is it there?" or "what is stored for it?" in O(1) on average.</li>
      <li>Counting: how many times each value appears.</li>
      <li>Remembering the first or last index where a value was seen.</li>
      <li>Finding a partner (complement), as in two-sum and 4-sum II.</li>
      <li>Grouping items by a shared label, as in group anagrams.</li>
      <li>Prefix sum + count, for "how many subarrays sum to k".</li>
      <li>Any brute force with a search loop inside a loop: replace the inner search, O(n²) → O(n).</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Map vs Object in JS?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Map</strong>: keys of any type, kept as that type. Loops in insertion order. <code>map.size</code> is O(1). Usually faster when you add and delete many keys.</li>
      <li><strong>Object</strong>: keys become strings (1 becomes "1", objects become "[object Object]"). Number-like keys jump to the front when listed. Easy to turn into JSON.</li>
    </ul>
    <p>For algorithms and hot loops: Map. For app records with fixed string fields: an object is fine.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Implement Two Sum with hash.</div>
  <div class="qa-answer">
    <p>Walk once. For each number, ask the map whether its complement (target − number) was already seen. If yes, return both indexes. If not, store number → index.</p>
<pre><code class="language-js">function twoSum(nums, target) {
  const seenAt = new Map(); // number → index where we saw it
  for (let i = 0; i &lt; nums.length; i++) {
    const need = target - nums[i]; // the complement
    if (seenAt.has(need)) {
      return [seenAt.get(need), i];
    }
    seenAt.set(nums[i], i); // store AFTER asking, so a number can't pair with itself
  }
  return [];
}
console.log(twoSum([2, 7, 11, 15], 9)); // [ 0, 1 ]</code></pre>
    <p>O(n) time, O(n) space, single pass. If the array were sorted, two pointers would do it in O(1) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Subarray Sum Equals K — explain.</div>
  <div class="qa-answer">
    <p>Keep a running total. The sum of a stretch equals (total now) minus (total just before the stretch). So a stretch ending here sums to k exactly when an earlier running total equals <code>running - k</code>. A map counts how many times each running total has appeared; start it with 0 seen once (the empty start).</p>
<pre><code class="language-js">function subarraySum(nums, k) {
  const timesSeen = new Map(); // running total → how many times seen
  timesSeen.set(0, 1); // the empty start
  let runningSum = 0;
  let total = 0;
  for (const value of nums) {
    runningSum += value;
    const need = runningSum - k;
    if (timesSeen.has(need)) {
      total += timesSeen.get(need); // each earlier match is one good stretch
    }
    const current = timesSeen.has(runningSum) ? timesSeen.get(runningSum) : 0;
    timesSeen.set(runningSum, current + 1);
  }
  return total;
}
console.log(subarraySum([1, -1, 2, 1], 2)); // 3</code></pre>
    <p>O(n) time, O(n) space. Works with negatives, which is exactly where a sliding window fails.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Group anagrams.</div>
  <div class="qa-answer">
    <p>Give each word a label that all its anagrams share, and group by label in a Map. Label 1: the sorted letters.</p>
<pre><code class="language-js">function groupAnagrams(words) {
  const groups = new Map(); // label → words
  for (const word of words) {
    const label = word.split("").sort().join(""); // "tea" → "aet"
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    const group = groups.get(label);
    group.push(word);
  }
  return [...groups.values()];
}
console.log(JSON.stringify(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))); // [["eat","tea","ate"],["tan","nat"],["bat"]]</code></pre>
    <p>O(n · k log k). Label 2, faster on long words: the 26 letter counts joined into a string, O(n · k).</p>
<pre><code class="language-js">function groupAnagramsByCount(words) {
  const groups = new Map();
  for (const word of words) {
    const letterCounts = new Array(26).fill(0);
    for (const letter of word) {
      const slot = letter.charCodeAt(0) - 97; // 'a' → 0
      letterCounts[slot] = letterCounts[slot] + 1;
    }
    const label = letterCounts.join(","); // commas keep 1,11 apart from 11,1
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    const group = groups.get(label);
    group.push(word);
  }
  return [...groups.values()];
}
console.log(JSON.stringify(groupAnagramsByCount(["eat", "tea", "bat"]))); // [["eat","tea"],["bat"]]</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Top K Frequent Elements.</div>
  <div class="qa-answer">
    <p>Count with a frequency map, then bucket sort by frequency: bucket f holds the values seen exactly f times. Read buckets from the top down until you have k values.</p>
<pre><code class="language-js">function topKFrequent(nums, k) {
  const counts = new Map();
  for (const value of nums) {
    const current = counts.has(value) ? counts.get(value) : 0;
    counts.set(value, current + 1);
  }
  const buckets = [];
  for (let f = 0; f &lt;= nums.length; f++) {
    buckets.push([]); // a count can be at most nums.length
  }
  for (const [value, count] of counts) {
    buckets[count].push(value);
  }
  const result = [];
  for (let f = buckets.length - 1; f &gt;= 0; f--) {
    for (const value of buckets[f]) {
      result.push(value);
      if (result.length === k) {
        return result;
      }
    }
  }
  return result;
}
console.log(topKFrequent([1, 1, 1, 2, 2, 3], 2)); // [ 1, 2 ]</code></pre>
    <p>O(n) time, O(n) space. The heap alternative (keep the k most frequent in a min-heap of size k) is O(n log k), and is the better pick when the data streams in and you can't size buckets.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Longest consecutive sequence.</div>
  <div class="qa-answer">
    <p>Put all numbers in a Set. A number starts a run only if number − 1 is not in the set. From each start, count upward.</p>
<pre><code class="language-js">function longestConsecutive(nums) {
  const numberSet = new Set(nums);
  let best = 0;
  for (const n of numberSet) {
    if (numberSet.has(n - 1)) {
      continue; // not a start
    }
    let current = n;
    let length = 1;
    while (numberSet.has(current + 1)) {
      current++;
      length++;
    }
    best = Math.max(best, length);
  }
  return best;
}
console.log(longestConsecutive([100, 4, 200, 1, 3, 2])); // 4</code></pre>
    <p>O(n) time despite the inner <code>while</code>: it only runs from run starts, so every number is walked over at most once in total. Space O(n).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why is hash O(1) only on average?</div>
  <div class="qa-answer">
    <p>The hash function turns each key into a slot number. Different keys can get the same slot (a collision), and then the table has to check every key in that slot. With a good hash function, keys spread evenly and each slot holds only a few: O(1) on average. If all keys landed in one slot, every operation would check all of them: O(n). Attackers can try to force that with crafted keys, which is why real engines (V8 and others) use randomised, secret-seeded hashing. Hashing a long key also costs time proportional to its length.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Is anagram check faster with sort or count?</div>
  <div class="qa-answer">
    <p>Counting. For letters a–z, a 26-slot count array is O(n) with O(1) extra space. Sorting both words is O(n log n). For any characters (emoji, accents), count with a Map: still O(n). Sorting is only "simpler to write", not faster.</p>
<pre><code class="language-js">function isAnagram(s, t) {
  if (s.length !== t.length) {
    return false;
  }
  const counts = new Array(26).fill(0);
  for (let i = 0; i &lt; s.length; i++) {
    const slotS = s.charCodeAt(i) - 97;
    const slotT = t.charCodeAt(i) - 97;
    counts[slotS] = counts[slotS] + 1;
    counts[slotT] = counts[slotT] - 1;
  }
  for (const count of counts) {
    if (count !== 0) {
      return false;
    }
  }
  return true;
}
console.log(isAnagram("listen", "silent")); // true</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you intersect two arrays?</div>
  <div class="qa-answer">
    <p>Put one array in a Set, then keep the items of the other that the Set has. Use a second Set if each shared value should appear once.</p>
<pre><code class="language-js">function intersect(first, second) {
  const firstSet = new Set(first);
  const both = new Set();
  for (const value of second) {
    if (firstSet.has(value)) {
      both.add(value);
    }
  }
  return [...both];
}
console.log(intersect([4, 9, 5], [9, 4, 9, 8, 4])); // [ 9, 4 ]</code></pre>
    <p>O(a + b) time, O(a) space, no nested loop. (If duplicates should be kept as many times as both have them, use a count Map instead of a Set.)</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. 4Sum II — count tuples summing to 0 across 4 arrays.</div>
  <div class="qa-answer">
    <p>Split the four lists into two halves. Count every a + b in a Map. Then for each c + d, add how many a + b pairs equal −(c + d).</p>
<pre><code class="language-js">function fourSumCount(listA, listB, listC, listD) {
  const pairSumCount = new Map();
  for (const a of listA) {
    for (const b of listB) {
      const pairSum = a + b;
      const current = pairSumCount.has(pairSum) ? pairSumCount.get(pairSum) : 0;
      pairSumCount.set(pairSum, current + 1);
    }
  }
  let count = 0;
  for (const c of listC) {
    for (const d of listD) {
      const need = 0 - (c + d); // the a + b that cancels c + d
      if (pairSumCount.has(need)) {
        count += pairSumCount.get(need);
      }
    }
  }
  return count;
}
console.log(fourSumCount([1, 2], [-2, -1], [-1, 2], [0, 2])); // 2</code></pre>
    <p>O(n²) time and space, instead of O(n⁴) for trying every pick of four.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How to use prefix sum + hash for "K-multiple sum"?</div>
  <div class="qa-answer">
    <p>Track the running total's remainder after dividing by k. If two positions have the same remainder, the items between them add up to a multiple of k. Store the <em>first</em> index of each remainder (starting with remainder 0 at index −1), and check the stretch has at least 2 items.</p>
<pre><code class="language-js">function checkSubarraySum(nums, k) {
  const firstIndexOf = new Map(); // remainder → first index it appeared
  firstIndexOf.set(0, -1); // "before the start"
  let runningSum = 0;
  for (let i = 0; i &lt; nums.length; i++) {
    runningSum += nums[i];
    const remainder = ((runningSum % k) + k) % k; // always 0..k-1
    if (firstIndexOf.has(remainder)) {
      const length = i - firstIndexOf.get(remainder);
      if (length &gt;= 2) {
        return true;
      }
    } else {
      firstIndexOf.set(remainder, i);
    }
  }
  return false;
}
console.log(checkSubarraySum([23, 2, 4, 6, 7], 6)); // true</code></pre>
    <p>O(n) time, O(min(n, k)) space.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How to hash a coordinate?</div>
  <div class="qa-answer">
    <p>Turn it into a string with a separator, like <code>row + "," + col</code>, and store that in a Set or Map. The separator matters: without it, (1, 23) and (12, 3) would both become "123". If the grid's size is known, a 2D array of true/false indexed by <code>[row][col]</code> is faster and simpler.</p>
<pre><code class="language-js">const visited = new Set();
function cellKey(row, col) {
  return row + "," + col; // "1,23" and "12,3" stay different
}
visited.add(cellKey(1, 23));
console.log(visited.has(cellKey(1, 23))); // true
console.log(visited.has(cellKey(12, 3))); // false</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Hash collisions in algorithm interviews?</div>
  <div class="qa-answer">
    <p>Usually you just say "O(1) average" and move on. Mention the O(n) worst case if asked, or if you claim a total time. If the problem involves untrusted input at scale (a web server, for example), bring up collision attacks and randomised, secret-seeded hashing as the defence.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. When would you NOT use a hash map?</div>
  <div class="qa-answer">
    <ul>
      <li>The problem demands O(1) extra memory (for example, a sorted array: use two pointers).</li>
      <li>You need things in sorted order, not just insertion order: sort, or use a heap.</li>
      <li>Range questions such as "all keys between 10 and 20" or "the next bigger key": a hash map can't answer those quickly. Use a sorted array with <a href="#/topic/dsa-words#w-binary-search">binary search</a>, or a <a href="#/topic/dsa-words#w-bst">binary search tree</a>.</li>
      <li>Keys are expensive to hash (very long strings) compared to the work you save.</li>
      <li>Keys are a small fixed range (letters, digits, scores 0–100): a plain array is cheaper.</li>
    </ul>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You reach for a Map or Set as soon as the brute force has a search inside a loop.</li>
    <li>You explain Map vs Object (any key type vs string keys only).</li>
    <li>You use a 26-slot array for letters, and a Map for anything else.</li>
    <li>You use prefix sum + hash for subarray sums when negatives are allowed.</li>
    <li>You group by a shared label for anagram-style problems.</li>
    <li>You use bucket sort to get top-K frequent in O(n).</li>
    <li>You start the prefix-sum map with 0 → 1 for the empty start.</li>
    <li>You delete keys when their count reaches 0 if you rely on <code>map.size</code>.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. How do hash tables handle collisions?</div>
  <div class="qa-answer">
    <p>Two keys can get the same slot. There are two main fixes:</p>
    <ul>
      <li><strong>Chaining:</strong> each slot holds a small list of entries. A lookup goes to the slot, then checks the few keys in its list. (The cloakroom hook with several coats on it.)</li>
      <li><strong>Open addressing:</strong> every entry lives directly in the table. On a collision, the table tries other slots in a fixed order until it finds a free one; lookups follow the same order.</li>
    </ul>
    <p>Either way, lookups stay O(1) on average only while the table isn't too full. So when it fills past a limit, the table grows (often doubling) and re-places every key. That rebuild is O(n), but it happens rarely enough that, averaged over all inserts, each insert is still O(1). That averaging is called <a href="#/topic/dsa-words#w-amortized">amortized</a> O(1). If every key collides, operations degrade to O(n); engines defend against crafted input with randomised hashing.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q17. What goes wrong when you use an array or object as a Map key?</div>
  <div class="qa-answer">
    <p>A Map compares object keys by identity (which exact object), not by contents. A new <code>[1, 2]</code> is a different object from an earlier <code>[1, 2]</code>, so the lookup misses.</p>
<pre><code class="language-js">const labels = new Map();
labels.set([1, 2], "a");
console.log(labels.has([1, 2])); // false  (different array object)

labels.set("1,2", "a"); // fix: a string key
console.log(labels.has("1,2")); // true</code></pre>
    <p>Fixes: encode compound keys as strings with a separator (<code>"1,2"</code>), use a 2D boolean array when grid bounds are known, or use <code>JSON.stringify</code> carefully (property order changes the string, and it is slow in hot loops).</p>
  </div>
</div>
` },

  ]
});
