window.PREP_SITE.registerTopic({
  id: 'dsa-graphs',
  module: 'dsa',
  title: 'Graphs',
  estimatedReadTime: '50 min',
  tags: ['graphs', 'bfs', 'dfs', 'topological-sort', 'union-find', 'dijkstra', 'bellman-ford', 'mst', 'shortest-path', 'cycles'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>graph</strong> is a set of nodes (vertices) connected by edges. Trees are graphs that happen to be acyclic and connected with one root. Real graphs are messier — cycles, disconnected components, weighted edges, directed edges, multiple edges between the same pair.</p>
<ul>
  <li><strong>Two main representations:</strong> <em>adjacency list</em> (O(V+E) space; default choice) and <em>adjacency matrix</em> (O(V²); only for small dense graphs).</li>
  <li><strong>Two main traversals:</strong> <em>BFS</em> (queue; shortest path in unweighted graphs) and <em>DFS</em> (stack/recursion; cycle detection, topological order, connected components).</li>
  <li><strong>Always track <code>visited</code>.</strong> Without it, cycles cause infinite loops.</li>
  <li><strong>Topological sort:</strong> linear ordering of a DAG so every edge u→v has u before v. Two algorithms: Kahn's (BFS, in-degree) and DFS-postorder reverse.</li>
  <li><strong>Union-Find (DSU):</strong> nearly-O(1) "are these in the same component?" — used in MST, cycle detection on undirected graphs, account merging.</li>
  <li><strong>Shortest path:</strong> BFS for unweighted; <em>Dijkstra</em> for non-negative weights; <em>Bellman-Ford</em> for graphs with negative edges; <em>Floyd-Warshall</em> for all-pairs.</li>
  <li><strong>MST:</strong> Kruskal (sort edges + union-find) or Prim (priority queue); both build the cheapest tree connecting all nodes.</li>
  <li><strong>Bipartite check:</strong> 2-color via BFS/DFS; conflict means odd cycle exists.</li>
</ul>
<p><strong>Mantra:</strong> "Always track visited. BFS for shortest unweighted. DFS for structure. Dijkstra for weighted. Union-Find for components."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a graph?</h3>
<p>A pair <strong>G = (V, E)</strong>: V is the set of vertices (nodes), E is the set of edges (each connecting a pair of vertices). Edges may be:</p>
<ul>
  <li><strong>Directed</strong> (one-way: a → b) or <strong>undirected</strong> (a ↔ b).</li>
  <li><strong>Weighted</strong> (each edge has a number) or <strong>unweighted</strong>.</li>
  <li><strong>Self-loops</strong> (a vertex connected to itself) or not.</li>
  <li><strong>Multi-edges</strong> (two edges between the same pair) or simple.</li>
</ul>

<h3>Real-world graphs are everywhere</h3>
<table>
  <thead><tr><th>Domain</th><th>Vertices</th><th>Edges</th></tr></thead>
  <tbody>
    <tr><td>Social network</td><td>People</td><td>Friendship / follow</td></tr>
    <tr><td>Maps / routing</td><td>Intersections</td><td>Roads (weighted by distance / time)</td></tr>
    <tr><td>Web</td><td>Pages</td><td>Hyperlinks (directed)</td></tr>
    <tr><td>Build system</td><td>Tasks / files</td><td>Dependencies (DAG → topological sort)</td></tr>
    <tr><td>Game state</td><td>Configurations</td><td>Legal moves</td></tr>
    <tr><td>Compiler</td><td>Variables / instructions</td><td>Data flow / control flow</td></tr>
    <tr><td>UI navigation</td><td>Screens</td><td>Allowed transitions</td></tr>
    <tr><td>Module dependencies</td><td>Files / packages</td><td>Imports</td></tr>
  </tbody>
</table>

<h3>Why graphs in interviews</h3>
<p>Graph problems test:</p>
<ol>
  <li>Pattern recognition — "this is a connected-component problem in disguise."</li>
  <li>Algorithm fluency — BFS vs DFS vs Dijkstra vs Union-Find chosen on the right axis.</li>
  <li>Implementation discipline — visited tracking, queue/stack usage, edge case handling.</li>
  <li>Complexity analysis — V, E, log V appear together.</li>
</ol>

<h3>Trees are graphs but with rules</h3>
<table>
  <thead><tr><th>Tree</th><th>Graph</th></tr></thead>
  <tbody>
    <tr><td>Connected, acyclic, with a root</td><td>Possibly disconnected, possibly cyclic, no root</td></tr>
    <tr><td>n nodes, n−1 edges</td><td>Any V, E count</td></tr>
    <tr><td>Recursion natural</td><td>Recursion needs visited tracking</td></tr>
    <tr><td>BFS = level order</td><td>BFS = layers from a source</td></tr>
  </tbody>
</table>

<h3>What "good" looks like</h3>
<ul>
  <li>You write down V, E, directed/undirected, weighted/unweighted before coding.</li>
  <li>You pick adjacency list 99% of the time.</li>
  <li>You always wire the visited set / array.</li>
  <li>You stop and ask: shortest path, connectivity, ordering, structure?</li>
  <li>You name the algorithm before implementing (BFS for shortest unweighted; DFS for cycle / topo).</li>
  <li>You handle disconnected components if the problem allows them.</li>
  <li>You quote complexity: O(V + E) for traversals; O((V + E) log V) for Dijkstra; near-O(V + E) for Union-Find.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Two representations</h3>
<table>
  <thead><tr><th>Representation</th><th>Space</th><th>Get neighbors</th><th>Edge exists?</th><th>When to use</th></tr></thead>
  <tbody>
    <tr><td>Adjacency list</td><td>O(V + E)</td><td>O(deg)</td><td>O(deg)</td><td>Default; sparse graphs (most real graphs)</td></tr>
    <tr><td>Adjacency matrix</td><td>O(V²)</td><td>O(V)</td><td>O(1)</td><td>Dense graphs; algorithms that need fast edge-presence (Floyd-Warshall)</td></tr>
    <tr><td>Edge list</td><td>O(E)</td><td>O(E) to enumerate</td><td>O(E)</td><td>Kruskal's MST; algorithms that operate on edges</td></tr>
  </tbody>
</table>

<h3>Adjacency list — JS shapes</h3>
<pre><code class="language-js">// Map of vertex → list of neighbors
const graph = new Map();      // for sparse / arbitrary keys
graph.set('A', ['B', 'C']);
graph.set('B', ['C', 'D']);

// Or array of arrays for integer-indexed vertices
const adj = Array.from({ length: V }, () =&gt; []);
adj[0].push(1); adj[1].push(0);     // undirected edge

// Weighted: store [neighbor, weight] tuples
adj[0].push([1, 5]);
</code></pre>

<h3>BFS — the shortest-path-in-unweighted workhorse</h3>
<pre><code class="language-js">function bfs(adj, start) {
  const dist = new Map([[start, 0]]);
  const q = [start];
  let head = 0;                           // O(1) dequeue
  while (head &lt; q.length) {
    const u = q[head++];
    for (const v of adj.get(u) ?? []) {
      if (!dist.has(v)) {
        dist.set(v, dist.get(u) + 1);
        q.push(v);
      }
    }
  }
  return dist;
}
</code></pre>
<p>BFS visits vertices in increasing order of distance from <code>start</code>. The first time a vertex is reached IS the shortest unweighted path.</p>

<h3>DFS — recursion or stack</h3>
<pre><code class="language-js">// Recursive
function dfs(adj, u, visited = new Set()) {
  if (visited.has(u)) return;
  visited.add(u);
  // pre-order work
  for (const v of adj.get(u) ?? []) dfs(adj, v, visited);
  // post-order work
}

// Iterative (avoids stack overflow on deep graphs)
function dfsIter(adj, start) {
  const visited = new Set();
  const stack = [start];
  while (stack.length) {
    const u = stack.pop();
    if (visited.has(u)) continue;
    visited.add(u);
    for (const v of adj.get(u) ?? []) {
      if (!visited.has(v)) stack.push(v);
    }
  }
}
</code></pre>

<h3>Visited tracking — the universal rule</h3>
<p>Without a visited set, BFS/DFS on a graph with cycles loops forever. Three common variants:</p>
<ul>
  <li><strong>Set:</strong> for arbitrary keys (strings, objects).</li>
  <li><strong>Boolean array:</strong> for integer-indexed vertices (faster).</li>
  <li><strong>Three-state (white/gray/black):</strong> for cycle detection in directed graphs (gray = in current DFS stack).</li>
</ul>

<h3>Pattern selection cheatsheet</h3>
<table>
  <thead><tr><th>Problem signal</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"Shortest path" + unweighted</td><td>BFS</td></tr>
    <tr><td>"Shortest path" + non-negative weights</td><td>Dijkstra</td></tr>
    <tr><td>"Shortest path" + negative edges</td><td>Bellman-Ford</td></tr>
    <tr><td>"All-pairs shortest path"</td><td>Floyd-Warshall</td></tr>
    <tr><td>"Connected components" / "islands"</td><td>BFS/DFS sweep, or Union-Find</td></tr>
    <tr><td>"Order tasks with dependencies"</td><td>Topological sort (Kahn's / DFS)</td></tr>
    <tr><td>"Detect cycle" (directed)</td><td>DFS with white/gray/black</td></tr>
    <tr><td>"Detect cycle" (undirected)</td><td>DFS with parent check, OR Union-Find</td></tr>
    <tr><td>"Two-color / bipartite"</td><td>BFS/DFS with coloring</td></tr>
    <tr><td>"Minimum spanning tree"</td><td>Kruskal or Prim</td></tr>
    <tr><td>"Word ladder / shortest transformations"</td><td>BFS over implicit graph</td></tr>
    <tr><td>"Network flow / matching"</td><td>Max-flow algorithms (rarely in interviews)</td></tr>
  </tbody>
</table>

<h3>Topological sort</h3>
<p>Only valid for DAGs (Directed Acyclic Graphs). Two algorithms:</p>
<ol>
  <li><strong>Kahn's (BFS):</strong> repeatedly remove vertices with in-degree 0; their neighbors lose an in-edge. Detects cycle if any vertex remains with in-degree &gt; 0.</li>
  <li><strong>DFS postorder:</strong> push onto stack after recursing on all neighbors; reverse for topo order.</li>
</ol>

<h3>Union-Find mental model</h3>
<p>Each vertex starts in its own set. <code>union(a, b)</code> merges; <code>find(a)</code> returns the canonical representative. With <strong>path compression</strong> and <strong>union by rank</strong>, both operations run in nearly O(1) amortized (specifically α(n), the inverse Ackermann function).</p>
<p>Use it for:</p>
<ul>
  <li>Connected components in a static (no-deletion) graph.</li>
  <li>Kruskal's MST.</li>
  <li>"Are two accounts merged?" / "Is this network partitioned?"</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Build adjacency list from edges</h3>
<pre><code class="language-js">function buildGraph(n, edges, directed = false) {
  const adj = Array.from({ length: n }, () =&gt; []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    if (!directed) adj[v].push(u);
  }
  return adj;
}
</code></pre>

<h3>BFS for shortest unweighted path</h3>
<pre><code class="language-js">function shortestPath(adj, start, end) {
  const dist = new Array(adj.length).fill(-1);
  const parent = new Array(adj.length).fill(-1);
  dist[start] = 0;
  const q = [start];
  let head = 0;
  while (head &lt; q.length) {
    const u = q[head++];
    if (u === end) break;
    for (const v of adj[u]) {
      if (dist[v] === -1) {
        dist[v] = dist[u] + 1;
        parent[v] = u;
        q.push(v);
      }
    }
  }
  if (dist[end] === -1) return null;
  // Reconstruct path
  const path = [];
  for (let c = end; c !== -1; c = parent[c]) path.push(c);
  return path.reverse();
}
</code></pre>

<h3>DFS — connected components count</h3>
<pre><code class="language-js">function countComponents(n, edges) {
  const adj = buildGraph(n, edges);
  const visited = new Array(n).fill(false);
  let count = 0;
  function dfs(u) {
    if (visited[u]) return;
    visited[u] = true;
    for (const v of adj[u]) dfs(v);
  }
  for (let i = 0; i &lt; n; i++) {
    if (!visited[i]) { dfs(i); count++; }
  }
  return count;
}
</code></pre>

<h3>Cycle detection — undirected (Union-Find)</h3>
<pre><code class="language-js">function hasCycleUndirected(n, edges) {
  const parent = Array.from({ length: n }, (_, i) =&gt; i);
  function find(x) {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  }
  for (const [u, v] of edges) {
    const ru = find(u), rv = find(v);
    if (ru === rv) return true;
    parent[ru] = rv;
  }
  return false;
}
</code></pre>

<h3>Cycle detection — directed (white/gray/black DFS)</h3>
<pre><code class="language-js">function hasCycleDirected(n, edges) {
  const adj = buildGraph(n, edges, true);
  const color = new Array(n).fill(0);   // 0=white, 1=gray, 2=black
  function dfs(u) {
    color[u] = 1;
    for (const v of adj[u]) {
      if (color[v] === 1) return true;       // back edge
      if (color[v] === 0 &amp;&amp; dfs(v)) return true;
    }
    color[u] = 2;
    return false;
  }
  for (let i = 0; i &lt; n; i++) if (color[i] === 0 &amp;&amp; dfs(i)) return true;
  return false;
}
</code></pre>

<h3>Topological sort — Kahn's (BFS, in-degree)</h3>
<pre><code class="language-js">function topoSort(n, edges) {
  const adj = buildGraph(n, edges, true);
  const inDeg = new Array(n).fill(0);
  for (const [, v] of edges) inDeg[v]++;
  const q = [];
  for (let i = 0; i &lt; n; i++) if (inDeg[i] === 0) q.push(i);
  const order = [];
  let head = 0;
  while (head &lt; q.length) {
    const u = q[head++];
    order.push(u);
    for (const v of adj[u]) {
      if (--inDeg[v] === 0) q.push(v);
    }
  }
  return order.length === n ? order : [];   // empty array → cycle
}
</code></pre>

<h3>Topological sort — DFS postorder</h3>
<pre><code class="language-js">function topoDFS(n, edges) {
  const adj = buildGraph(n, edges, true);
  const visited = new Array(n).fill(0);
  const stack = [];
  function dfs(u) {
    if (visited[u] === 1) throw new Error('cycle');
    if (visited[u] === 2) return;
    visited[u] = 1;
    for (const v of adj[u]) dfs(v);
    visited[u] = 2;
    stack.push(u);
  }
  for (let i = 0; i &lt; n; i++) if (visited[i] === 0) dfs(i);
  return stack.reverse();
}
</code></pre>

<h3>Bipartite check (BFS 2-coloring)</h3>
<pre><code class="language-js">function isBipartite(n, edges) {
  const adj = buildGraph(n, edges);
  const color = new Array(n).fill(-1);
  for (let start = 0; start &lt; n; start++) {
    if (color[start] !== -1) continue;
    color[start] = 0;
    const q = [start];
    let head = 0;
    while (head &lt; q.length) {
      const u = q[head++];
      for (const v of adj[u]) {
        if (color[v] === -1) {
          color[v] = 1 - color[u];
          q.push(v);
        } else if (color[v] === color[u]) {
          return false;
        }
      }
    }
  }
  return true;
}
</code></pre>

<h3>Dijkstra — single-source shortest path (non-negative weights)</h3>
<pre><code class="language-js">// Requires a min-heap. JS has no built-in; here's a hand-rolled one inline.
class MinHeap {
  constructor() { this.h = []; }
  push(x) { this.h.push(x); this.up(this.h.length - 1); }
  pop() {
    if (!this.h.length) return undefined;
    const top = this.h[0], last = this.h.pop();
    if (this.h.length) { this.h[0] = last; this.down(0); }
    return top;
  }
  size() { return this.h.length; }
  up(i) {
    while (i &gt; 0) {
      const p = (i - 1) &gt;&gt; 1;
      if (this.h[p][0] &lt;= this.h[i][0]) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  }
  down(i) {
    const n = this.h.length;
    while (true) {
      let l = 2*i + 1, r = 2*i + 2, m = i;
      if (l &lt; n &amp;&amp; this.h[l][0] &lt; this.h[m][0]) m = l;
      if (r &lt; n &amp;&amp; this.h[r][0] &lt; this.h[m][0]) m = r;
      if (m === i) break;
      [this.h[i], this.h[m]] = [this.h[m], this.h[i]];
      i = m;
    }
  }
}

function dijkstra(adj, start) {
  // adj[u] = [[v, w], ...]
  const n = adj.length;
  const dist = new Array(n).fill(Infinity);
  dist[start] = 0;
  const pq = new MinHeap();
  pq.push([0, start]);
  while (pq.size()) {
    const [d, u] = pq.pop();
    if (d &gt; dist[u]) continue;     // stale entry
    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd &lt; dist[v]) {
        dist[v] = nd;
        pq.push([nd, v]);
      }
    }
  }
  return dist;
}
</code></pre>
<p>Time: O((V + E) log V). Space: O(V).</p>

<h3>Bellman-Ford — handles negative weights, detects negative cycles</h3>
<pre><code class="language-js">function bellmanFord(n, edges, start) {
  const dist = new Array(n).fill(Infinity);
  dist[start] = 0;
  for (let i = 0; i &lt; n - 1; i++) {
    let updated = false;
    for (const [u, v, w] of edges) {
      if (dist[u] + w &lt; dist[v]) {
        dist[v] = dist[u] + w;
        updated = true;
      }
    }
    if (!updated) break;
  }
  // One more pass: if any edge relaxes, there's a negative cycle reachable from start.
  for (const [u, v, w] of edges) {
    if (dist[u] + w &lt; dist[v]) return null;
  }
  return dist;
}
</code></pre>

<h3>Union-Find with path compression + union by rank</h3>
<pre><code class="language-js">class DSU {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) =&gt; i);
    this.rank = new Array(n).fill(0);
  }
  find(x) {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a, b) {
    const ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra] &lt; this.rank[rb]) this.parent[ra] = rb;
    else if (this.rank[ra] &gt; this.rank[rb]) this.parent[rb] = ra;
    else { this.parent[rb] = ra; this.rank[ra]++; }
    return true;
  }
}
</code></pre>

<h3>Kruskal's MST</h3>
<pre><code class="language-js">function kruskal(n, edges) {
  // edges: [[u, v, w], ...]
  edges.sort((a, b) =&gt; a[2] - b[2]);
  const dsu = new DSU(n);
  let total = 0, picked = 0;
  for (const [u, v, w] of edges) {
    if (dsu.union(u, v)) {
      total += w;
      if (++picked === n - 1) break;
    }
  }
  return picked === n - 1 ? total : null;   // null if disconnected
}
</code></pre>

<h3>Number of Islands (grid as graph)</h3>
<pre><code class="language-js">function numIslands(grid) {
  const m = grid.length, n = grid[0].length;
  let count = 0;
  function dfs(r, c) {
    if (r &lt; 0 || c &lt; 0 || r &gt;= m || c &gt;= n || grid[r][c] !== '1') return;
    grid[r][c] = '0';
    dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);
  }
  for (let r = 0; r &lt; m; r++) {
    for (let c = 0; c &lt; n; c++) {
      if (grid[r][c] === '1') { dfs(r, c); count++; }
    }
  }
  return count;
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Course Schedule (cycle in directed graph)</h3>
<pre><code class="language-js">function canFinish(n, prereqs) {
  const adj = Array.from({ length: n }, () =&gt; []);
  const inDeg = new Array(n).fill(0);
  for (const [a, b] of prereqs) { adj[b].push(a); inDeg[a]++; }
  const q = [];
  for (let i = 0; i &lt; n; i++) if (inDeg[i] === 0) q.push(i);
  let taken = 0, head = 0;
  while (head &lt; q.length) {
    const u = q[head++];
    taken++;
    for (const v of adj[u]) if (--inDeg[v] === 0) q.push(v);
  }
  return taken === n;   // false if a cycle prevents some courses
}
</code></pre>

<h3>Example 2: Word Ladder (BFS on implicit graph)</h3>
<pre><code class="language-js">function ladderLength(begin, end, wordList) {
  const set = new Set(wordList);
  if (!set.has(end)) return 0;
  const q = [[begin, 1]];
  let head = 0;
  while (head &lt; q.length) {
    const [w, d] = q[head++];
    if (w === end) return d;
    for (let i = 0; i &lt; w.length; i++) {
      for (let c = 97; c &lt;= 122; c++) {
        const next = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
        if (set.has(next)) {
          set.delete(next);             // mark visited
          q.push([next, d + 1]);
        }
      }
    }
  }
  return 0;
}
</code></pre>

<h3>Example 3: Network Delay Time (Dijkstra)</h3>
<pre><code class="language-js">function networkDelayTime(times, n, k) {
  const adj = Array.from({ length: n + 1 }, () =&gt; []);
  for (const [u, v, w] of times) adj[u].push([v, w]);
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  const pq = new MinHeap();
  pq.push([0, k]);
  while (pq.size()) {
    const [d, u] = pq.pop();
    if (d &gt; dist[u]) continue;
    for (const [v, w] of adj[u]) {
      if (d + w &lt; dist[v]) {
        dist[v] = d + w;
        pq.push([d + w, v]);
      }
    }
  }
  let max = 0;
  for (let i = 1; i &lt;= n; i++) max = Math.max(max, dist[i]);
  return max === Infinity ? -1 : max;
}
</code></pre>

<h3>Example 4: Clone Graph (DFS with map)</h3>
<pre><code class="language-js">function cloneGraph(node) {
  if (!node) return null;
  const map = new Map();
  function dfs(n) {
    if (map.has(n)) return map.get(n);
    const copy = { val: n.val, neighbors: [] };
    map.set(n, copy);
    for (const nb of n.neighbors) copy.neighbors.push(dfs(nb));
    return copy;
  }
  return dfs(node);
}
</code></pre>

<h3>Example 5: Friend Circles / Provinces (Union-Find on matrix)</h3>
<pre><code class="language-js">function findProvinces(M) {
  const n = M.length;
  const dsu = new DSU(n);
  for (let i = 0; i &lt; n; i++) {
    for (let j = i + 1; j &lt; n; j++) {
      if (M[i][j] === 1) dsu.union(i, j);
    }
  }
  const roots = new Set();
  for (let i = 0; i &lt; n; i++) roots.add(dsu.find(i));
  return roots.size;
}
</code></pre>

<h3>Example 6: Pacific Atlantic Water Flow (multi-source BFS)</h3>
<pre><code class="language-js">function pacificAtlantic(heights) {
  const m = heights.length, n = heights[0].length;
  const pac = Array.from({ length: m }, () =&gt; new Array(n).fill(false));
  const atl = Array.from({ length: m }, () =&gt; new Array(n).fill(false));
  function dfs(r, c, vis) {
    vis[r][c] = true;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr&lt;0||nc&lt;0||nr&gt;=m||nc&gt;=n) continue;
      if (vis[nr][nc]) continue;
      if (heights[nr][nc] &lt; heights[r][c]) continue;   // can flow back UP from sea
      dfs(nr, nc, vis);
    }
  }
  for (let i = 0; i &lt; m; i++) { dfs(i, 0, pac); dfs(i, n - 1, atl); }
  for (let j = 0; j &lt; n; j++) { dfs(0, j, pac); dfs(m - 1, j, atl); }
  const out = [];
  for (let i = 0; i &lt; m; i++) for (let j = 0; j &lt; n; j++) {
    if (pac[i][j] &amp;&amp; atl[i][j]) out.push([i, j]);
  }
  return out;
}
</code></pre>

<h3>Example 7: Min Cost to Connect All Points (MST via Prim)</h3>
<pre><code class="language-js">function minCostConnectPoints(points) {
  const n = points.length;
  const inMST = new Array(n).fill(false);
  const pq = new MinHeap();
  pq.push([0, 0]);
  let total = 0, count = 0;
  while (count &lt; n) {
    const [w, u] = pq.pop();
    if (inMST[u]) continue;
    inMST[u] = true;
    total += w;
    count++;
    for (let v = 0; v &lt; n; v++) {
      if (!inMST[v]) {
        const dist = Math.abs(points[u][0]-points[v][0]) + Math.abs(points[u][1]-points[v][1]);
        pq.push([dist, v]);
      }
    }
  }
  return total;
}
</code></pre>

<h3>Example 8: Detect Cycle in Undirected Graph (DFS)</h3>
<pre><code class="language-js">function hasCycle(n, edges) {
  const adj = buildGraph(n, edges);
  const visited = new Array(n).fill(false);
  function dfs(u, parent) {
    visited[u] = true;
    for (const v of adj[u]) {
      if (!visited[v]) {
        if (dfs(v, u)) return true;
      } else if (v !== parent) {
        return true;
      }
    }
    return false;
  }
  for (let i = 0; i &lt; n; i++) {
    if (!visited[i] &amp;&amp; dfs(i, -1)) return true;
  }
  return false;
}
</code></pre>

<h3>Example 9: Reconstruct Itinerary (Hierholzer / DFS Eulerian path)</h3>
<pre><code class="language-js">function findItinerary(tickets) {
  const adj = new Map();
  for (const [u, v] of tickets) {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u).push(v);
  }
  for (const [, list] of adj) list.sort();   // lex order
  const path = [];
  function dfs(u) {
    const list = adj.get(u);
    while (list &amp;&amp; list.length) dfs(list.shift());
    path.push(u);
  }
  dfs('JFK');
  return path.reverse();
}
</code></pre>

<h3>Example 10: All Paths from Source to Target (DAG)</h3>
<pre><code class="language-js">function allPaths(graph) {
  const target = graph.length - 1;
  const out = [];
  function dfs(u, path) {
    if (u === target) { out.push([...path]); return; }
    for (const v of graph[u]) {
      path.push(v);
      dfs(v, path);
      path.pop();
    }
  }
  dfs(0, [0]);
  return out;
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Self-loops</h3>
<p>A vertex connected to itself. Most algorithms handle them gracefully if visited tracking is correct, but cycle-detection on undirected graphs needs care: a self-loop is a 1-edge cycle.</p>

<h3>Multi-edges</h3>
<p>Two edges between the same pair. Adjacency list naturally supports them; matrices have to choose (count or boolean). For shortest paths use min-weight; for flow use sum.</p>

<h3>Disconnected components</h3>
<p>Your traversal from one source only reaches its component. To process the whole graph, sweep:</p>
<pre><code class="language-js">for (let i = 0; i &lt; n; i++) {
  if (!visited[i]) traverse(i);
}
</code></pre>

<h3>Negative weights</h3>
<p>Dijkstra is wrong on graphs with negative edges (it commits to "closest unvisited" too early). Use Bellman-Ford. Negative <em>cycles</em> have no shortest path; Bellman-Ford detects them.</p>

<h3>Negative cycles in routing</h3>
<p>"Shortest path" is undefined when a negative cycle is reachable from the source — you can keep going around for less cost forever. Always check.</p>

<h3>Disconnected source for shortest path</h3>
<p>If <code>end</code> is unreachable from <code>start</code>, shortest path is <code>∞</code> / <code>-1</code>. Handle the unreachable case.</p>

<h3>0-weight edges</h3>
<p>Allowed in Dijkstra (weights are non-negative, not strictly positive). Mind the priority queue: an entry can become stale if you've already found a shorter path; check <code>if (d &gt; dist[u]) continue;</code>.</p>

<h3>BFS with weighted graphs</h3>
<p>BFS gives <em>edge count</em>, not weighted distance. If weights aren't all 1, use Dijkstra. Variant: 0-1 BFS for graphs with weights only 0 or 1 (use a deque; add 0-edges to front, 1-edges to back).</p>

<h3>Topo sort on a graph with cycles</h3>
<p>Doesn't exist. Both Kahn's and DFS variants must detect: Kahn's leaves vertices with in-degree &gt; 0; DFS sees a gray vertex.</p>

<h3>Disconnected source for topo sort</h3>
<p>Both algorithms work fine for disconnected DAGs; multiple "starting" vertices are handled.</p>

<h3>Recursion depth in DFS</h3>
<p>For graphs with V near 10⁵+, recursive DFS hits V8's stack limit. Convert to iterative (explicit stack) or use trampolining.</p>

<h3>Map.get returning undefined</h3>
<pre><code class="language-js">for (const v of adj.get(u)) { /* ... */ }   // ❌ if u has no out-edges
for (const v of adj.get(u) ?? []) { /* ... */ }   // ✅
</code></pre>

<h3>Edge double-counting (undirected)</h3>
<p>If you push both directions, BFS sees each edge twice. Visited tracking handles it, but if you're <em>summing</em> edges (e.g., total weight), don't double-count.</p>

<h3>Vertex IDs not contiguous</h3>
<p>Some graph problems give string IDs or integer IDs that don't form a 0..n-1 range. Use Map (not array) to avoid sparse allocation surprises.</p>

<h3>Large grid problems</h3>
<p>Treat each cell as a vertex. m × n cells with 4-directional moves means up to 4mn edges. DFS is fine for ~10⁶ cells; beyond that consider iterative + bit-tricks.</p>

<h3>Bidirectional BFS</h3>
<p>For shortest path in huge graphs, BFS from both ends meets in the middle: each side explores ~b^(d/2) instead of b^d. Used in word ladder, social-distance queries.</p>

<h3>Stale priority queue entries</h3>
<p>Dijkstra pushes a new entry when a shorter path is found, leaving the older one stale. Check on pop. Some implementations support decrease-key, but for typical problems "lazy deletion via dist check" is simplest.</p>

<h3>Floating-point weight comparisons</h3>
<p>If weights are doubles, equality / strictly-less comparisons can drift. Either use integers (multiply by precision factor) or epsilon comparisons.</p>

<h3>DAG vs cycle on the same input</h3>
<p>Some problems require you to detect, then build. Combine: run topo-sort; if it returns full order, no cycle; otherwise reject.</p>

<h3>Tarjan / Kosaraju for SCC</h3>
<p>Strongly Connected Components in directed graphs. Rare in interviews; if asked, Kosaraju (two DFS passes) is easier to implement; Tarjan is one pass with low-link values.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Forgetting visited tracking</h3>
<pre><code class="language-js">// BAD — infinite loop on any cycle
function dfs(u) {
  for (const v of adj[u]) dfs(v);
}
</code></pre>

<h3>Bug 2: Marking visited too late in BFS</h3>
<pre><code class="language-js">// BAD — vertex enqueued multiple times before being visited
const q = [start];
while (q.length) {
  const u = q.shift();
  if (visited.has(u)) continue;
  visited.add(u);
  for (const v of adj[u]) q.push(v);   // duplicates enqueued
}

// GOOD — mark visited at enqueue time
visited.add(start);
const q = [start];
while (q.length) {
  const u = q.shift();
  for (const v of adj[u]) {
    if (!visited.has(v)) { visited.add(v); q.push(v); }
  }
}
</code></pre>

<h3>Bug 3: <code>shift()</code> in BFS on huge graphs</h3>
<p>O(n) per shift → O(n²) total. Use a head index pointer:</p>
<pre><code class="language-js">let head = 0;
const q = [start];
while (head &lt; q.length) {
  const u = q[head++];
  // ...
}
</code></pre>

<h3>Bug 4: Negative weights with Dijkstra</h3>
<pre><code class="language-js">// Dijkstra with negative edges silently returns wrong shortest paths.
// FIX: use Bellman-Ford.
</code></pre>

<h3>Bug 5: Stale priority queue entries unhandled</h3>
<pre><code class="language-js">// BAD — relaxing stale entries
const [d, u] = pq.pop();
for (const [v, w] of adj[u]) { /* relax */ }   // d may be outdated

// GOOD
const [d, u] = pq.pop();
if (d &gt; dist[u]) continue;
</code></pre>

<h3>Bug 6: Cycle-detect undirected with parent omitted</h3>
<pre><code class="language-js">// BAD — every undirected edge looks like a "cycle" because back edge to neighbor
function dfs(u) {
  for (const v of adj[u]) {
    if (visited.has(v)) return true;
    visited.add(v);
    return dfs(v);
  }
}

// GOOD — track parent
function dfs(u, parent) {
  for (const v of adj[u]) {
    if (!visited.has(v)) { visited.add(v); if (dfs(v, u)) return true; }
    else if (v !== parent) return true;
  }
  return false;
}
</code></pre>

<h3>Bug 7: Topo sort but graph has cycle</h3>
<pre><code class="language-js">// BAD — silently returns partial result
return order;

// GOOD — verify all vertices included
return order.length === n ? order : [];
</code></pre>

<h3>Bug 8: Mutating the input graph during traversal</h3>
<p>Removing edges from <code>adj</code> while iterating produces undefined behavior. Mark visited instead.</p>

<h3>Bug 9: Edges added twice for undirected graphs</h3>
<pre><code class="language-js">// BAD — edges array has [u,v] and [v,u] both already
for (const [u, v] of edges) {
  adj[u].push(v);
  adj[v].push(u);   // now duplicates exist
}
</code></pre>

<h3>Bug 10: DSU without path compression / union by rank</h3>
<p>Without optimizations, DSU operations degrade to O(n). With both, near O(1) amortized. Always include them.</p>

<h3>Anti-pattern 1: Adjacency matrix for sparse graphs</h3>
<p>O(V²) space, O(V) to enumerate neighbors. If E is small, every neighbor lookup wastes work. Use adjacency list unless the graph is dense (E ≈ V²).</p>

<h3>Anti-pattern 2: Reaching for Dijkstra on unweighted graphs</h3>
<p>BFS is O(V + E); Dijkstra is O((V + E) log V). On unweighted inputs, BFS wins in both time and code complexity.</p>

<h3>Anti-pattern 3: Reinventing Union-Find</h3>
<p>Without rank/compression, naive parent-array DSU is O(n) per op. Always include both optimizations or use a tested implementation.</p>

<h3>Anti-pattern 4: Recursion on grid graphs without iteration consideration</h3>
<p>1000×1000 grid = 1M cells. DFS recursion can blow stack on long paths. Iterative stack or BFS is safer.</p>

<h3>Anti-pattern 5: Ignoring the difference between directed and undirected</h3>
<p>Cycle detection differs (parent check vs gray/black). Edge addition differs (single push vs two). Articulate which kind of graph you have.</p>

<h3>Anti-pattern 6: Building the graph on every call</h3>
<p>If you'll query the same graph many times, build the adjacency list once.</p>

<h3>Anti-pattern 7: Using <code>JSON.stringify</code> as a state hash</h3>
<p>For state-graph BFS (sliding puzzle, configurations), encoding states as strings via JSON.stringify per visit is slow. Use a deterministic compact encoding (joined characters, bitmask for small N).</p>

<h3>Anti-pattern 8: BFS without breaking early</h3>
<p>For shortest path to a target, exit the loop as soon as the target is dequeued. Don't traverse the rest of the graph.</p>

<h3>Anti-pattern 9: Confusing in-degree with out-degree</h3>
<p>For Kahn's algorithm, you decrement <em>incoming</em> edges. For graph reversal you flip both. Be explicit.</p>

<h3>Anti-pattern 10: Mixing 0-indexed and 1-indexed vertices</h3>
<p>Many problems use 1..n. Be careful with array sizing (use n+1) or convert at the boundary.</p>
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
    <tr><td>Number of Islands / Provinces</td><td>BFS/DFS sweep or Union-Find</td></tr>
    <tr><td>Course Schedule I / II</td><td>Topological sort (cycle detection)</td></tr>
    <tr><td>Clone Graph</td><td>BFS/DFS with map for cloning</td></tr>
    <tr><td>Word Ladder I / II</td><td>BFS with implicit graph (string transformations)</td></tr>
    <tr><td>Network Delay Time</td><td>Dijkstra</td></tr>
    <tr><td>Cheapest Flights Within K Stops</td><td>Bellman-Ford or modified BFS</td></tr>
    <tr><td>Min Cost to Connect Points</td><td>MST (Prim or Kruskal)</td></tr>
    <tr><td>Detect Cycle</td><td>directed: white/gray/black; undirected: parent or DSU</td></tr>
    <tr><td>Bipartite</td><td>2-color BFS/DFS</td></tr>
    <tr><td>Reconstruct Itinerary</td><td>Hierholzer / DFS Eulerian</td></tr>
    <tr><td>Pacific Atlantic Water Flow</td><td>Multi-source DFS/BFS from boundaries</td></tr>
    <tr><td>Surrounded Regions</td><td>BFS/DFS from boundary; rest is captured</td></tr>
    <tr><td>Walls and Gates</td><td>Multi-source BFS from gates</td></tr>
    <tr><td>Rotting Oranges</td><td>Multi-source BFS</td></tr>
    <tr><td>Critical Connections (Bridges)</td><td>Tarjan low-link</td></tr>
    <tr><td>Alien Dictionary</td><td>Topo sort over inferred edges</td></tr>
  </tbody>
</table>

<h3>Algorithm-cheatsheet</h3>
<table>
  <thead><tr><th>Need</th><th>Algorithm</th><th>Time</th></tr></thead>
  <tbody>
    <tr><td>Traversal</td><td>BFS / DFS</td><td>O(V + E)</td></tr>
    <tr><td>Shortest path unweighted</td><td>BFS</td><td>O(V + E)</td></tr>
    <tr><td>Shortest path non-negative weights</td><td>Dijkstra</td><td>O((V + E) log V)</td></tr>
    <tr><td>Shortest path with negative edges</td><td>Bellman-Ford</td><td>O(V · E)</td></tr>
    <tr><td>All-pairs shortest path</td><td>Floyd-Warshall</td><td>O(V³)</td></tr>
    <tr><td>MST</td><td>Kruskal / Prim</td><td>O(E log E) / O((V + E) log V)</td></tr>
    <tr><td>Connected components</td><td>BFS/DFS sweep or DSU</td><td>O(V + E) or O(V + E α)</td></tr>
    <tr><td>Topo sort</td><td>Kahn / DFS</td><td>O(V + E)</td></tr>
    <tr><td>Cycle detect (directed)</td><td>DFS w/ colors</td><td>O(V + E)</td></tr>
    <tr><td>Bridges / articulation</td><td>Tarjan</td><td>O(V + E)</td></tr>
    <tr><td>SCC</td><td>Kosaraju / Tarjan</td><td>O(V + E)</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Build adjacency list from edges (directed and undirected).</li>
  <li>Number of connected components.</li>
  <li>Course Schedule (cycle / topo).</li>
  <li>Number of Islands.</li>
  <li>Word Ladder.</li>
  <li>Bipartite check.</li>
  <li>Dijkstra from scratch (with hand-rolled min-heap).</li>
  <li>Union-Find with path compression + union by rank.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>BFS using <code>shift()</code> on huge inputs — switch to head pointer.</li>
  <li>Dijkstra with negative edges — switch to Bellman-Ford.</li>
  <li>DSU without path compression — degrades to O(n).</li>
  <li>Cycle detection on undirected graph without parent tracking — false positives on every back edge.</li>
  <li>Topo sort returning partial order on a cyclic graph — must check <code>order.length === n</code>.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Pattern recognition</td><td>You name the algorithm before writing it.</td></tr>
    <tr><td>Visited discipline</td><td>Always tracked; marked at the right moment.</td></tr>
    <tr><td>Representation choice</td><td>You default to adjacency list and explain when matrix is better.</td></tr>
    <tr><td>Algorithm fluency</td><td>You can write BFS, DFS, Dijkstra, DSU, topo sort from scratch.</td></tr>
    <tr><td>Complexity articulation</td><td>You quote V, E, log V; you distinguish dense vs sparse.</td></tr>
    <tr><td>Edge case handling</td><td>You handle disconnected, cyclic, empty, single-vertex.</td></tr>
    <tr><td>Iterative fallback</td><td>You convert recursion to iteration when stack depth is concerning.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Module dependency graph:</strong> JS bundlers walk a DAG of imports; topological sort decides bundle order; cycles cause "module is undefined" bugs.</li>
  <li><strong>UI navigation graph:</strong> screens + transitions form a graph; "can I reach X from Y?" is a graph reachability query.</li>
  <li><strong>State machine for app states:</strong> nodes = states, edges = events. Detecting unreachable states = connected component check.</li>
  <li><strong>React fiber:</strong> mostly a tree but with cross-pointers for context, refs, hooks; tree algorithms with extra care.</li>
  <li><strong>Layout dependency:</strong> Yoga / FlexBox compute layout in DFS-postorder traversal of the view tree.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why does Dijkstra fail on negative edges?"</em> — It commits to "this is the closest unvisited vertex" once popped. A later negative edge could provide a shorter path through an already-popped vertex. Bellman-Ford avoids this by relaxing all edges V−1 times.</li>
  <li><em>"How does path compression work in DSU?"</em> — During <code>find</code>, set every visited node's parent directly to the root; future finds traverse fewer edges.</li>
  <li><em>"BFS vs DFS for shortest path on a maze with obstacles?"</em> — BFS, because the underlying graph is unweighted and BFS finds shortest path in O(V + E). DFS may find <em>a</em> path but not necessarily shortest.</li>
  <li><em>"What's the difference between Prim's and Kruskal's?"</em> — Prim grows one tree from a starting vertex; Kruskal merges forest components by sorted edge weight. Both produce MST. Kruskal is easier with DSU; Prim with priority queue. Kruskal wins on sparse graphs; Prim on dense.</li>
  <li><em>"Why use Union-Find instead of BFS for connected components?"</em> — When you have many "are these connected?" queries interleaved with merges. BFS rebuilds each time; DSU answers in near-O(1).</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add bidirectional BFS for the word-ladder problem to halve search time on big dictionaries."</li>
  <li>"I'd profile the heap implementation; built-in min-heap would simplify Dijkstra significantly."</li>
  <li>"I'd handle the disconnected case explicitly and document expected output."</li>
  <li>"I'd write a small graph-printing utility to visualize cycles during debugging."</li>
  <li>"I'd benchmark Tarjan vs Kosaraju on a real SCC workload before picking."</li>
</ul>
`
    }
  ]
});
