window.PREP_SITE.registerTopic({
  id: 'dsa-trie',
  module: 'dsa',
  title: 'Trie',
  estimatedReadTime: '40 min',
  tags: ['trie', 'prefix-tree', 'autocomplete', 'string-search', 'suffix-trie', 'word-search', 'wildcard'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>Trie</strong> (prefix tree) is a tree-shaped data structure where each path from root to leaf spells a string. It's the canonical answer for problems involving <strong>prefix queries</strong>, <strong>autocomplete</strong>, <strong>spellcheck</strong>, <strong>word search in grids</strong>, and any "find all strings starting with X" workload. Time complexity is O(L) for insert/lookup where L is string length — independent of the number of stored strings.</p>
<ul>
  <li><strong>Each node holds children</strong> (typically a Map or 26-element array for lowercase letters) plus a flag indicating "word ends here."</li>
  <li><strong>Insert / search / startsWith</strong> all run in O(L).</li>
  <li><strong>Memory:</strong> O(total characters stored) in the worst case; less when prefixes overlap.</li>
  <li><strong>Use cases:</strong> autocomplete, search-as-you-type, IP routing tables, spell-check, dictionary problems, word search II (boggle).</li>
  <li><strong>Variants:</strong> compressed trie (Patricia / Radix), suffix trie, ternary search tree, double-array trie.</li>
  <li><strong>vs Hash set:</strong> Trie wins on prefix queries; hash set wins on exact-match memory and constant-time lookup.</li>
  <li><strong>Common interview pattern:</strong> implement Trie + use it inside DFS for "find all words on grid" or "longest word with all prefixes" problems.</li>
</ul>
<p><strong>Mantra:</strong> "Trie when prefixes matter. O(L) operations. Pair with DFS for grid word search."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a Trie?</h3>
<p>A trie (pronounced "try" or "tree") is a tree where each edge represents a character, and a path from root to a marked node spells a stored string. Multiple strings sharing a prefix share the same nodes for that prefix.</p>

<pre><code class="language-text">Stored: "cat", "car", "card", "care", "dog"

      (root)
      /    \\
     c      d
     |      |
     a      o
    / \\     |
   t*  r*   g*
       |
       d*  ← also "card"
       |
       e   ← also "care"
       *

* = end-of-word marker
</code></pre>
<p>"car" and "card" share the path c-a-r; "card" extends with d. Memory savings grow with prefix overlap.</p>

<h3>Why a trie</h3>
<table>
  <thead><tr><th>Operation</th><th>Trie</th><th>Hash set</th><th>Sorted array</th></tr></thead>
  <tbody>
    <tr><td>Insert</td><td>O(L)</td><td>O(L) (hash)</td><td>O(N + L)</td></tr>
    <tr><td>Exact lookup</td><td>O(L)</td><td>O(L)</td><td>O(L log N) bisect</td></tr>
    <tr><td>Prefix search ("words starting with 'ca'")</td><td>O(L + k) where k = matches</td><td>O(N · L)</td><td>O(L + log N + k) (sorted scan)</td></tr>
    <tr><td>"Does any word start with this prefix?"</td><td>O(L)</td><td>O(N · L)</td><td>O(L log N)</td></tr>
  </tbody>
</table>
<p>Tries dominate when prefix queries are frequent and N is large.</p>

<h3>Real-world tries</h3>
<ul>
  <li><strong>Autocomplete</strong> — Google search, IDE intellisense, address fields.</li>
  <li><strong>Spell check</strong> — find candidates within edit distance K of a misspelled word.</li>
  <li><strong>IP routing</strong> — longest-prefix match on bit-tries.</li>
  <li><strong>Dictionaries</strong> — Scrabble / Wordle / crossword solvers.</li>
  <li><strong>Word filters</strong> — profanity / sensitive-content matching.</li>
  <li><strong>Compilers</strong> — keyword recognition in lexers.</li>
  <li><strong>Search engines</strong> — query expansion, term lookup.</li>
</ul>

<h3>Why interviewers love tries</h3>
<ol>
  <li>Recognizable from problem signals: "starts with," "prefix," "dictionary words," "autocomplete."</li>
  <li>Tests data structure design (node shape, end-of-word marker).</li>
  <li>Composes with DFS / backtracking — Word Search II is a classic combo.</li>
  <li>Less common than arrays/hash, so candidates who know it stand out.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You recognize trie shape from problem wording.</li>
  <li>You implement insert / search / startsWith cleanly.</li>
  <li>You consider memory: Map vs fixed-size array per node depending on alphabet size.</li>
  <li>You combine with DFS for grid word problems.</li>
  <li>You consider compressed tries for memory-sensitive applications.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Anatomy of a Trie node</h3>
<pre><code class="language-text">TrieNode {
  children: { 'a': TrieNode, 'b': TrieNode, ... }   // map of next chars
  isEnd: bool                                        // marks end-of-word
  // optionally: word: string (the full word ending here)
  // optionally: count: number (how many words share this prefix)
}
</code></pre>

<h3>Two storage choices for children</h3>
<table>
  <thead><tr><th>Choice</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>Map / Object</td><td>Works with any alphabet; sparse storage</td><td>Slight constant-time overhead per access</td></tr>
    <tr><td>Fixed array (size 26 for a-z)</td><td>Faster lookup; indexed by <code>c - 'a'</code></td><td>Wastes memory; only works for known small alphabet</td></tr>
  </tbody>
</table>
<p>Default: Map. Use array only when alphabet is small (DNA = 4, lowercase = 26) and you need top-tier perf.</p>

<h3>The 3 core operations</h3>
<table>
  <thead><tr><th>Operation</th><th>Walk</th></tr></thead>
  <tbody>
    <tr><td><code>insert(word)</code></td><td>Walk character by character; create missing nodes; mark final node as end-of-word.</td></tr>
    <tr><td><code>search(word)</code></td><td>Walk; if any character missing, return false. End at end-of-word? return true.</td></tr>
    <tr><td><code>startsWith(prefix)</code></td><td>Walk; if any character missing, return false. Otherwise return true (regardless of end-of-word).</td></tr>
  </tbody>
</table>

<h3>Why isEnd matters</h3>
<p>"app" stored, "apple" not stored. <code>search("apple")</code> would walk to 'e' but not find isEnd. <code>search("app")</code> walks to 'p' and finds isEnd → true. Without the flag, you can't distinguish "stored word" from "prefix of stored word."</p>

<h3>Memory analysis</h3>
<p>Worst case: no overlap. Storing N strings of length L = O(N·L) nodes. Best case: all share a long prefix → O(L + N) nodes. Real-world dictionaries are in between.</p>

<h3>The "wildcard" extension</h3>
<p>Modified search where <code>'.'</code> matches any character. Run a DFS instead of a linear walk:</p>
<pre><code class="language-js">function searchWithDot(node, word, i) {
  if (i === word.length) return node.isEnd;
  const c = word[i];
  if (c === '.') {
    for (const child of Object.values(node.children)) {
      if (searchWithDot(child, word, i + 1)) return true;
    }
    return false;
  }
  if (!node.children[c]) return false;
  return searchWithDot(node.children[c], word, i + 1);
}
</code></pre>

<h3>The "delete" operation</h3>
<p>Tries support delete: walk to the end, unmark isEnd. Optionally prune nodes with no children up the tree. More complex than insert; many problems don't require delete.</p>

<h3>The "all words with prefix" walk</h3>
<p>Walk to the prefix node, then DFS to collect all isEnd nodes below. Return them. Useful for autocomplete.</p>

<h3>Pairing trie with DFS — Word Search II</h3>
<p>Given a grid of letters and a list of words, find all words present. Naive: for each word, do BFS/DFS on grid. Trie way: build a trie of all words; walk the grid in DFS; at each step, check if the current path is a trie node. Massive speedup when many words share prefixes.</p>

<h3>Compressed Trie / Radix Tree</h3>
<p>Merge chains of single-child nodes into one edge labeled with the substring. Memory-efficient for large dictionaries; common in IP routing and database indexes (e.g., PostgreSQL's GIN indexes).</p>
<pre><code class="language-text">Standard trie:
  c → a → r → null (end)
       → t → null (end)

Radix tree:
  c → "ar" (end)
   → "at" (end)
</code></pre>

<h3>Suffix Trie / Suffix Tree</h3>
<p>Trie of all suffixes of a single string. Used for substring search, longest repeated substring, etc. Suffix trees can be built in O(N) (Ukkonen). For interview: usually suffix array + LCP is the more common alternative.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Basic Trie implementation (JS)</h3>
<pre><code class="language-js">class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const c of word) {
      if (!node.children.has(c)) node.children.set(c, new TrieNode());
      node = node.children.get(c);
    }
    node.isEnd = true;
  }

  search(word) {
    const node = this._walk(word);
    return node !== null &amp;&amp; node.isEnd;
  }

  startsWith(prefix) {
    return this._walk(prefix) !== null;
  }

  _walk(s) {
    let node = this.root;
    for (const c of s) {
      if (!node.children.has(c)) return null;
      node = node.children.get(c);
    }
    return node;
  }
}
</code></pre>

<h3>Object-based variant</h3>
<pre><code class="language-js">class Trie {
  constructor() {
    this.root = {};
  }

  insert(word) {
    let node = this.root;
    for (const c of word) {
      if (!node[c]) node[c] = {};
      node = node[c];
    }
    node.$ = true;   // sentinel for end-of-word
  }

  search(word) {
    let node = this.root;
    for (const c of word) {
      if (!node[c]) return false;
      node = node[c];
    }
    return node.$ === true;
  }
}
</code></pre>

<h3>Array-based for lowercase a-z</h3>
<pre><code class="language-js">class TrieNode {
  constructor() {
    this.children = new Array(26).fill(null);
    this.isEnd = false;
  }
}

function idx(c) { return c.charCodeAt(0) - 97; }

class Trie {
  constructor() { this.root = new TrieNode(); }

  insert(word) {
    let node = this.root;
    for (const c of word) {
      const i = idx(c);
      if (!node.children[i]) node.children[i] = new TrieNode();
      node = node.children[i];
    }
    node.isEnd = true;
  }

  search(word) {
    let node = this.root;
    for (const c of word) {
      const i = idx(c);
      if (!node.children[i]) return false;
      node = node.children[i];
    }
    return node.isEnd;
  }
}
</code></pre>

<h3>Wildcard search — '.' matches any</h3>
<pre><code class="language-js">class WordDictionary {
  constructor() { this.root = new TrieNode(); }

  addWord(word) {
    let node = this.root;
    for (const c of word) {
      if (!node.children.has(c)) node.children.set(c, new TrieNode());
      node = node.children.get(c);
    }
    node.isEnd = true;
  }

  search(word) {
    return this._search(this.root, word, 0);
  }

  _search(node, word, i) {
    if (i === word.length) return node.isEnd;
    const c = word[i];
    if (c === '.') {
      for (const child of node.children.values()) {
        if (this._search(child, word, i + 1)) return true;
      }
      return false;
    }
    if (!node.children.has(c)) return false;
    return this._search(node.children.get(c), word, i + 1);
  }
}
</code></pre>

<h3>All words with given prefix (autocomplete)</h3>
<pre><code class="language-js">function wordsWithPrefix(trie, prefix) {
  const node = trie._walk(prefix);
  if (!node) return [];
  const results = [];
  function collect(n, path) {
    if (n.isEnd) results.push(prefix + path);
    for (const [c, child] of n.children) {
      collect(child, path + c);
    }
  }
  collect(node, '');
  return results;
}
</code></pre>

<h3>Longest common prefix of all words</h3>
<pre><code class="language-js">function longestCommonPrefix(words) {
  const trie = new Trie();
  for (const w of words) trie.insert(w);

  let prefix = '';
  let node = trie.root;
  while (node.children.size === 1 &amp;&amp; !node.isEnd) {
    const [c, child] = [...node.children.entries()][0];
    prefix += c;
    node = child;
  }
  return prefix;
}
</code></pre>

<h3>Replace words (root replacement)</h3>
<pre><code class="language-js">function replaceWords(roots, sentence) {
  const trie = new Trie();
  for (const r of roots) trie.insert(r);

  return sentence.split(' ').map(word =&gt; {
    let node = trie.root;
    let prefix = '';
    for (const c of word) {
      if (!node.children.has(c)) break;
      prefix += c;
      node = node.children.get(c);
      if (node.isEnd) return prefix;
    }
    return word;
  }).join(' ');
}
</code></pre>

<h3>Word Search II (grid + trie)</h3>
<pre><code class="language-js">function findWords(board, words) {
  const trie = new Trie();
  for (const w of words) trie.insert(w);

  const m = board.length, n = board[0].length;
  const result = new Set();

  function dfs(r, c, node, path) {
    if (r &lt; 0 || c &lt; 0 || r &gt;= m || c &gt;= n) return;
    const ch = board[r][c];
    if (ch === '#' || !node.children.has(ch)) return;
    const next = node.children.get(ch);
    const newPath = path + ch;
    if (next.isEnd) result.add(newPath);

    board[r][c] = '#';   // mark visited
    dfs(r+1, c, next, newPath);
    dfs(r-1, c, next, newPath);
    dfs(r, c+1, next, newPath);
    dfs(r, c-1, next, newPath);
    board[r][c] = ch;
  }

  for (let r = 0; r &lt; m; r++) {
    for (let c = 0; c &lt; n; c++) {
      dfs(r, c, trie.root, '');
    }
  }
  return [...result];
}
</code></pre>

<h3>Counting words with prefix</h3>
<p>Add a <code>count</code> field to each node, increment on insert, return at the prefix node:</p>
<pre><code class="language-js">class CountingTrie {
  insert(word) {
    let node = this.root;
    for (const c of word) {
      if (!node.children.has(c)) node.children.set(c, { children: new Map(), count: 0, isEnd: false });
      node = node.children.get(c);
      node.count++;
    }
    node.isEnd = true;
  }

  countWithPrefix(prefix) {
    let node = this.root;
    for (const c of prefix) {
      if (!node.children.has(c)) return 0;
      node = node.children.get(c);
    }
    return node.count;
  }
}
</code></pre>

<h3>Delete word from trie</h3>
<pre><code class="language-js">function deleteWord(trie, word) {
  function helper(node, i) {
    if (i === word.length) {
      if (!node.isEnd) return false;
      node.isEnd = false;
      return node.children.size === 0;   // safe to delete from parent if no children
    }
    const c = word[i];
    const child = node.children.get(c);
    if (!child) return false;
    const shouldDelete = helper(child, i + 1);
    if (shouldDelete) {
      node.children.delete(c);
      return !node.isEnd &amp;&amp; node.children.size === 0;
    }
    return false;
  }
  helper(trie.root, 0);
}
</code></pre>

<h3>Memory-efficient: ternary search tree</h3>
<p>Instead of a children map per node, each node has a single character + left/middle/right child pointers. Less memory per node; slower lookup. Used in some search engines.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Implement Trie (LeetCode 208)</h3>
<p>The canonical "trie warmup." Insert / search / startsWith. See Mechanics.</p>

<h3>Example 2: Add and Search Word — wildcard support</h3>
<p>WordDictionary above. Tests trie + DFS for '.' wildcard.</p>

<h3>Example 3: Word Search II</h3>
<p>Grid + word list. Build trie of words; DFS the grid; only proceed if current path matches a trie node.</p>

<h3>Example 4: Longest word in dictionary (LeetCode 720)</h3>
<pre><code class="language-js">function longestWord(words) {
  const trie = new Trie();
  for (const w of words) trie.insert(w);

  let best = '';
  function dfs(node, path) {
    for (const [c, child] of node.children) {
      if (!child.isEnd) continue;   // every step must end a word
      const np = path + c;
      if (np.length &gt; best.length || (np.length === best.length &amp;&amp; np &lt; best)) {
        best = np;
      }
      dfs(child, np);
    }
  }
  dfs(trie.root, '');
  return best;
}
</code></pre>

<h3>Example 5: Maximum XOR pair (bit trie)</h3>
<pre><code class="language-js">// Insert numbers as bit strings (32 bits, MSB first). For each, walk the trie
// preferring the OPPOSITE bit at each level → maximizes XOR.
class BitTrie {
  constructor() { this.root = {}; }
  insert(num) {
    let node = this.root;
    for (let i = 31; i &gt;= 0; i--) {
      const b = (num &gt;&gt; i) &amp; 1;
      if (!node[b]) node[b] = {};
      node = node[b];
    }
  }
  maxXor(num) {
    let node = this.root, xor = 0;
    for (let i = 31; i &gt;= 0; i--) {
      const b = (num &gt;&gt; i) &amp; 1;
      const want = 1 - b;
      if (node[want]) {
        xor |= (1 &lt;&lt; i);
        node = node[want];
      } else {
        node = node[b];
      }
    }
    return xor;
  }
}

function findMaximumXOR(nums) {
  const trie = new BitTrie();
  for (const n of nums) trie.insert(n);
  return Math.max(...nums.map(n =&gt; trie.maxXor(n)));
}
</code></pre>

<h3>Example 6: Stream-of-characters (LeetCode 1032)</h3>
<pre><code class="language-js">// Given a stream of characters, after each character return whether
// some suffix of the stream so far matches any of the given words.
// Insert REVERSED words into the trie; check stream from latest backwards.

class StreamChecker {
  constructor(words) {
    this.root = new TrieNode();
    for (const w of words) {
      let node = this.root;
      for (let i = w.length - 1; i &gt;= 0; i--) {
        const c = w[i];
        if (!node.children.has(c)) node.children.set(c, new TrieNode());
        node = node.children.get(c);
      }
      node.isEnd = true;
    }
    this.stream = [];
  }

  query(c) {
    this.stream.push(c);
    let node = this.root;
    for (let i = this.stream.length - 1; i &gt;= 0 &amp;&amp; node; i--) {
      const ch = this.stream[i];
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch);
      if (node.isEnd) return true;
    }
    return false;
  }
}
</code></pre>

<h3>Example 7: Map sum pairs (LeetCode 677)</h3>
<pre><code class="language-js">class MapSum {
  constructor() {
    this.root = { children: new Map(), value: 0 };
    this.keys = new Map();
  }
  insert(key, val) {
    const delta = val - (this.keys.get(key) ?? 0);
    this.keys.set(key, val);
    let node = this.root;
    for (const c of key) {
      if (!node.children.has(c)) node.children.set(c, { children: new Map(), value: 0 });
      node = node.children.get(c);
      node.value += delta;
    }
  }
  sum(prefix) {
    let node = this.root;
    for (const c of prefix) {
      if (!node.children.has(c)) return 0;
      node = node.children.get(c);
    }
    return node.value;
  }
}
</code></pre>

<h3>Example 8: Concatenated words</h3>
<pre><code class="language-js">// Words made up entirely of shorter words from the same list
function findAllConcatenatedWords(words) {
  const trie = new Trie();
  for (const w of words) trie.insert(w);

  const result = [];
  for (const word of words) {
    if (canForm(trie, word, 0, 0)) result.push(word);
  }
  return result;
}

function canForm(trie, word, start, count) {
  if (start === word.length) return count &gt;= 2;
  let node = trie.root;
  for (let i = start; i &lt; word.length; i++) {
    if (!node.children.has(word[i])) return false;
    node = node.children.get(word[i]);
    if (node.isEnd &amp;&amp; canForm(trie, word, i + 1, count + 1)) return true;
  }
  return false;
}
</code></pre>

<h3>Example 9: Autocomplete system</h3>
<pre><code class="language-js">class AutocompleteSystem {
  constructor(sentences, times) {
    this.root = { children: new Map(), counts: new Map() };
    for (let i = 0; i &lt; sentences.length; i++) {
      this.insert(sentences[i], times[i]);
    }
    this.current = '';
  }

  insert(sentence, count) {
    let node = this.root;
    for (const c of sentence) {
      if (!node.children.has(c)) node.children.set(c, { children: new Map(), counts: new Map() });
      node = node.children.get(c);
      node.counts.set(sentence, (node.counts.get(sentence) ?? 0) + count);
    }
  }

  input(c) {
    if (c === '#') {
      this.insert(this.current, 1);
      this.current = '';
      return [];
    }
    this.current += c;
    let node = this.root;
    for (const ch of this.current) {
      if (!node.children.has(ch)) return [];
      node = node.children.get(ch);
    }
    return [...node.counts.entries()]
      .sort((a, b) =&gt; b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(e =&gt; e[0]);
  }
}
</code></pre>

<h3>Example 10: Search suggestions system</h3>
<pre><code class="language-js">function suggestedProducts(products, searchWord) {
  products.sort();
  const trie = new Trie();
  for (const p of products) trie.insert(p);

  const result = [];
  let prefix = '';
  for (const c of searchWord) {
    prefix += c;
    const node = trie._walk(prefix);
    if (!node) {
      result.push([]);
      continue;
    }
    const matches = [];
    function dfs(n, path) {
      if (matches.length === 3) return;
      if (n.isEnd) matches.push(prefix + path);
      const sortedChildren = [...n.children.keys()].sort();
      for (const ch of sortedChildren) {
        if (matches.length === 3) return;
        dfs(n.children.get(ch), path + ch);
      }
    }
    dfs(node, '');
    result.push(matches);
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
<h3>Empty strings</h3>
<p>Inserting "" — root.isEnd = true. Searching "" returns true if marked. Some implementations don't handle empty strings; clarify in interview.</p>

<h3>Duplicate inserts</h3>
<p>Inserting the same word twice doesn't error; just re-marks isEnd. If you have a count field, increment correctly.</p>

<h3>Memory blow-up with sparse alphabet</h3>
<p>Fixed-size 26-element children arrays for every node = wasteful when most children are null. Use Map for sparse alphabets.</p>

<h3>Unicode / multi-byte characters</h3>
<p>JavaScript strings iterate by code unit, not code point. For emoji or surrogate pairs, use <code>[...word]</code> or <code>Array.from(word)</code> to iterate by actual characters.</p>

<h3>Case sensitivity</h3>
<p>Tries are case-sensitive by default. Decide upfront: store lowercase, store both, or compare case-insensitive in walk.</p>

<h3>Pruning after delete</h3>
<p>Deleting "car" from trie containing "car" + "card": you must NOT remove the c-a-r path because "card" still depends on it. Only remove nodes with no isEnd and no children. The recursive helper handles this carefully.</p>

<h3>Large words list — memory</h3>
<p>Storing 1M unique words with average length 8 = ~8M nodes. Each node with Map + flag ~80-100 bytes → 800MB+. Use compressed trie / radix tree, or external storage, or a different data structure (sorted array + binary search) for large dictionaries.</p>

<h3>Hash set vs trie for exact lookup</h3>
<p>Hash set is O(L) for lookup with smaller constant factor. Trie wins only when prefix queries are needed. If you only need "does this word exist," use Set.</p>

<h3>Very long strings</h3>
<p>Trie depth = longest string. Recursive operations may hit stack limits for &gt; 10k character strings. Use iterative implementations.</p>

<h3>Concurrent modification</h3>
<p>Tries aren't thread-safe. If multiple writers, you need locks or copy-on-write. Most interview problems are single-threaded.</p>

<h3>The "sentinel character" trick</h3>
<p>To distinguish "stored as a word" from "stored as a prefix only," some implementations store a special character ($ or '#') instead of a flag. Cleaner code, marginally more memory.</p>

<h3>Wildcard performance</h3>
<p>Wildcard search ('.' matches any) can degrade to O(N · L) when many wildcards branch out. For complex regex over a dictionary, consider DFA-based approaches.</p>

<h3>Suffix trie space</h3>
<p>A naive suffix trie of a string of length N has O(N²) nodes. Use a suffix tree (Ukkonen, O(N) space and time) or suffix array (O(N) space, O(N log N) construction) instead.</p>

<h3>Edit-distance autocomplete</h3>
<p>"Find words within edit distance 2 of 'helo'." Trie + DP edit-distance traversal: walk the trie, maintain a DP row, prune branches where the minimum row value &gt; threshold.</p>

<h3>Locale / collation</h3>
<p>Tries treat characters as raw bytes / code points. Locale-aware comparison (e.g., German ß = ss, Japanese hiragana/katakana equivalence) needs collation-aware preprocessing.</p>

<h3>Prefix counting overflow</h3>
<p>For a word inserted N times in a counting trie, the count along the path increments N times. For very large N, consider using BigInt or capping.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Forgetting end-of-word marker</h3>
<pre><code class="language-js">// search("app") returns true if "apple" is stored — wrong if "app" itself isn't
function search(word) {
  // walks to end without checking isEnd
  // FIX: check node.isEnd at the end
}
</code></pre>

<h3>Bug 2: Not pruning correctly on delete</h3>
<p>Deleting word that's a prefix of another shouldn't remove shared nodes. Always check children.size before deletion.</p>

<h3>Bug 3: Sharing children objects across nodes</h3>
<pre><code class="language-js">// BAD — all nodes share one map
class TrieNode { children = sharedMap; }   // disaster

// GOOD — each node has its own
class TrieNode { constructor() { this.children = new Map(); } }
</code></pre>

<h3>Bug 4: Iterating string by index instead of code point</h3>
<pre><code class="language-js">for (let i = 0; i &lt; word.length; i++) {
  const c = word[i];   // breaks for emoji
}

// FIX
for (const c of word) { ... }
// or
[...word].forEach(c =&gt; { ... });
</code></pre>

<h3>Bug 5: Wildcard search exiting too early</h3>
<pre><code class="language-js">// BAD — returns true on first child match without checking the rest of the word
if (c === '.') {
  for (const child of node.children.values()) {
    return search(child, ...);   // ❌ stops at first
  }
}

// GOOD — try all children, return true if any work
if (c === '.') {
  for (const child of node.children.values()) {
    if (search(child, ...)) return true;
  }
  return false;
}
</code></pre>

<h3>Bug 6: Storing the full word at every node</h3>
<p>Some implementations store the entire word at the leaf. Wasteful; the path implies it. Store only at end-of-word, or compute via traversal when needed.</p>

<h3>Bug 7: Using object children with Object.keys ordering</h3>
<p>Object.keys returns string keys in insertion order (mostly). For ordered traversal (e.g., sorted output), use Map or sort keys explicitly.</p>

<h3>Bug 8: Memory leak in long-lived tries</h3>
<p>Inserting and never deleting fills memory indefinitely. For caches, add LRU eviction or periodic rebuild.</p>

<h3>Bug 9: Wildcard with stack overflow</h3>
<p>Recursive '.' wildcard with deep nesting overflows. Either iterate explicitly with a stack or limit recursion depth.</p>

<h3>Bug 10: Building trie inside a hot loop</h3>
<p>Rebuilding the trie for each query in the same problem is O(words × inserts) per query. Build once outside.</p>

<h3>Anti-pattern 1: Trie when a hash set suffices</h3>
<p>If you only need exact match, a Set is simpler and often faster. Trie's value is prefix queries.</p>

<h3>Anti-pattern 2: Trie for tiny dictionaries</h3>
<p>For 100 words, the overhead of trie nodes outweighs the gain. Linear scan or binary search is faster up to ~10k words.</p>

<h3>Anti-pattern 3: Storing very large strings</h3>
<p>Path lengths in tries equal string lengths. For 10MB-long strings, you can't reasonably build a trie. Use suffix arrays or specialized indexes.</p>

<h3>Anti-pattern 4: Deeply nested children objects in hot code</h3>
<p>Object property access vs array index has different perf. For tight loops, arrays-as-children outperform Maps. Profile.</p>

<h3>Anti-pattern 5: Not considering compressed tries</h3>
<p>For dictionaries with long unique tails (e.g., URLs), each word adds many single-child nodes. Radix tree saves significant memory.</p>

<h3>Anti-pattern 6: Implementing trie when language has built-in trie-like structures</h3>
<p>Java has Trie via TreeMap; some libraries provide trie. JS has none built-in; you write your own.</p>

<h3>Anti-pattern 7: Recursing for simple operations</h3>
<p>Insert / search are naturally iterative. Recursion adds stack frames without clarity benefit.</p>

<h3>Anti-pattern 8: Mixing case without normalizing</h3>
<p>"App" and "app" become two paths. Either normalize on insert or use case-insensitive comparison consistently.</p>

<h3>Anti-pattern 9: Forgetting to handle empty strings</h3>
<p>Insert empty: root.isEnd = true. Search empty: return root.isEnd. Edge case in many problems.</p>

<h3>Anti-pattern 10: Ignoring memory in interview discussion</h3>
<p>Senior interviewers ask about memory. "How would you store a million dictionaries?" Be ready with compressed trie / external storage answer.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 12 problems worth memorizing patterns for</h3>
<table>
  <thead><tr><th>Problem</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>Implement Trie</td><td>Insert / search / startsWith with Map children + isEnd</td></tr>
    <tr><td>Add and Search Word — WordDictionary</td><td>Trie + DFS with '.' wildcard</td></tr>
    <tr><td>Word Search II</td><td>Trie of words + DFS on grid</td></tr>
    <tr><td>Replace Words</td><td>Trie of roots; walk each input word</td></tr>
    <tr><td>Map Sum Pairs</td><td>Trie + value at each node</td></tr>
    <tr><td>Stream of Characters</td><td>Trie of REVERSED words; check stream backward</td></tr>
    <tr><td>Maximum XOR Pair</td><td>Bit trie; greedy MSB-first</td></tr>
    <tr><td>Concatenated Words</td><td>Trie + DFS; count splits</td></tr>
    <tr><td>Search Suggestions System</td><td>Trie + sorted DFS for top-k matches</td></tr>
    <tr><td>Longest Word in Dictionary</td><td>Trie + DFS where every step is end-of-word</td></tr>
    <tr><td>Design Search Autocomplete</td><td>Trie + frequency map at each node</td></tr>
    <tr><td>Palindrome Pairs</td><td>Trie of reversed words; complex DFS</td></tr>
  </tbody>
</table>

<h3>Pattern recognition cheatsheet</h3>
<table>
  <thead><tr><th>Problem says...</th><th>Likely trie</th></tr></thead>
  <tbody>
    <tr><td>"prefix" / "starts with"</td><td>YES</td></tr>
    <tr><td>"autocomplete" / "search suggestions"</td><td>YES</td></tr>
    <tr><td>"dictionary of words"</td><td>OFTEN</td></tr>
    <tr><td>"word search" + multiple words</td><td>YES (trie + DFS)</td></tr>
    <tr><td>"concatenation of words"</td><td>OFTEN</td></tr>
    <tr><td>"maximum XOR" with N integers</td><td>YES (bit trie)</td></tr>
    <tr><td>"stream of characters" + match suffix</td><td>YES (reversed trie)</td></tr>
    <tr><td>Single-word exact match only</td><td>NO (use Set)</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Implement Trie from scratch (insert, search, startsWith).</li>
  <li>Add wildcard search with '.' character.</li>
  <li>Build Trie + DFS for Word Search II.</li>
  <li>Implement Stream Checker with reversed trie.</li>
  <li>Implement Bit Trie for Maximum XOR.</li>
  <li>Build autocomplete system with frequency.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Search returns true for prefix-only words — missing isEnd check.</li>
  <li>Wildcard search exits at first match attempt — should try all children.</li>
  <li>Iterating string by index breaks emoji — use for-of.</li>
  <li>Delete removes shared prefix — must check children.size before pruning.</li>
  <li>Trie used for exact lookup of small dictionary — Set is simpler.</li>
  <li>Building trie inside the query loop — build once outside.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Pattern recognition</td><td>You name "trie" before starting to code.</td></tr>
    <tr><td>Implementation fluency</td><td>You write insert/search/startsWith in 30 lines without bugs.</td></tr>
    <tr><td>End-of-word discipline</td><td>You always include isEnd flag and check it.</td></tr>
    <tr><td>Composition with DFS</td><td>You combine trie with grid DFS (Word Search II) cleanly.</td></tr>
    <tr><td>Memory awareness</td><td>You discuss compressed tries / Map vs array.</td></tr>
    <tr><td>Wildcard handling</td><td>You correctly implement '.' as DFS over children.</td></tr>
    <tr><td>Variant fluency</td><td>You know bit trie for XOR; reversed trie for suffix matching.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Tries appear in mobile apps: contact search, place autocomplete, recent-search history with prefix highlighting.</li>
  <li>SQLite's FTS (full-text search) uses trie-like structures internally.</li>
  <li>For smaller dictionaries, in-memory trie in JS is often faster than going through SQLite.</li>
  <li>For huge dictionaries (e.g., shipping a 100k-word dictionary in your app), use compressed trie or pre-built binary format.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why prefix tree over hash set?"</em> — Hash set is O(L) for exact lookup but O(N·L) to find all words with a prefix. Trie is O(L + k) where k is matches. Big win for autocomplete.</li>
  <li><em>"How would you handle case insensitivity?"</em> — Lowercase on insert and lookup; or store both cases; or compare case-insensitive in walk.</li>
  <li><em>"How does delete work?"</em> — Walk to the node; unmark isEnd; on the way back up, prune nodes with no children and no isEnd.</li>
  <li><em>"Why bit trie for XOR?"</em> — XOR is maximized when bits differ. At each bit position from MSB, prefer the opposite bit if possible. Tries make this greedy walk efficient.</li>
  <li><em>"How would you fit 1B words?"</em> — Compressed trie / radix tree to reduce node count; external storage with mmap; or different data structure entirely (sorted compressed array).</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit any "search-as-you-type" features for trie suitability.</li>
  <li>Identify large dictionary lookups; consider compressed trie.</li>
  <li>Profile memory of in-memory tries vs alternatives.</li>
  <li>Add tests for edge cases: empty strings, duplicates, deletes, wildcards.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd POC a radix tree for our 200K-word lexicon to save memory."</li>
  <li>"I'd add edit-distance traversal for fuzzy autocomplete."</li>
  <li>"I'd implement a counting trie to power our 'top suggestions' feature."</li>
  <li>"I'd benchmark trie vs sorted array + bisect for our specific lookup pattern."</li>
</ul>
`
    }
  ]
});
