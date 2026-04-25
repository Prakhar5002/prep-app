window.PREP_SITE.registerTopic({
  id: 'perf-memory',
  module: 'Frontend Performance',
  title: 'Memory Leaks',
  estimatedReadTime: '28 min',
  tags: ['performance', 'memory', 'leak', 'devtools', 'heap-snapshot', 'detached-dom', 'listeners', 'closures'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>A <strong>memory leak</strong> is when an object stays reachable after you're done with it, so the GC cannot reclaim it. Leaks accumulate during a session: scrolling slows, animations stutter, the tab eventually freezes or is killed by the browser. Mobile and SPA users feel them most — long sessions across many route changes.</p>
<ul>
  <li><strong>Reachability is the rule</strong>: GC reclaims objects unreachable from any root (globals, call stack, DOM tree, timers, listeners). Anything still referenced is alive — even if your code is "done with it."</li>
  <li><strong>Five classic web leak sources</strong>: detached DOM held in JS, unremoved event listeners, uncleared timers/intervals, undisconnected observers (Intersection / Resize / Mutation), closures over big data.</li>
  <li><strong>Detection</strong>: Chrome DevTools Memory tab — heap snapshots, comparison view, allocation profiles. Look for retainer chains and "Detached" tree filter.</li>
  <li><strong>Production signals</strong>: <code>performance.memory</code> (Chrome only), <code>PerformanceObserver('measure-memory')</code>, RUM tracking; sustained growth across navigations = leak.</li>
  <li><strong>Mitigations</strong>: cleanup in <code>useEffect</code>, AbortController for requests, <code>WeakMap</code>/<code>WeakRef</code> for caches, virtualization for long lists, single-source-of-truth state.</li>
  <li><strong>Don't confuse leak with bloat</strong>: leak = monotonic growth; bloat = high but stable usage. Different fixes.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Leaks are forgotten references, not "objects you no longer need." Any reference still in the graph keeps the object alive. Find the retainer; cut the reference; verify with another snapshot.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What "leak" means in JavaScript</h3>
<p>Unlike C / C++, you don't <code>malloc</code> / <code>free</code>. The garbage collector reclaims objects unreachable from a set of roots. A "leak" in JS is therefore a logical leak — the GC can't reclaim what it can still reach. Common roots in browsers:</p>
<ul>
  <li><code>window</code> / <code>globalThis</code> and any of its properties (your modules, libraries, vars).</li>
  <li>The current call stack — locals, parameters, captured closures.</li>
  <li>The microtask + macrotask queues (pending callbacks).</li>
  <li>The <strong>DOM tree</strong> attached to <code>document</code>. Detached subtrees rooted nowhere can be collected.</li>
  <li>Active timers (<code>setTimeout</code>, <code>setInterval</code>) — pin their callback closures.</li>
  <li>Registered event listeners — pin the listener function.</li>
  <li>Active observers (Intersection / Resize / Mutation / PerformanceObserver) — pin both the callback and observed targets.</li>
  <li>Promises in pending state — pin <code>.then</code> reactions.</li>
  <li>WebSocket / EventSource / fetch streams.</li>
</ul>

<h3>Why memory matters in modern apps</h3>
<ul>
  <li><strong>SPAs and long sessions</strong>: route changes don't reload the page; leaks accumulate over hours.</li>
  <li><strong>Tab discard</strong>: browsers kill backgrounded tabs to reclaim memory; users lose state.</li>
  <li><strong>Mobile</strong>: 1-2GB device RAM; the OS terminates apps proactively under pressure.</li>
  <li><strong>UX symptoms</strong>: GC pauses become longer; INP regresses; animation jank; eventually crash / out-of-memory.</li>
</ul>

<h3>Why leaks are hard to find</h3>
<ul>
  <li>Reproducible only after specific user actions repeated many times.</li>
  <li>Retainer paths can be deep and indirect (closure → array → DOM node → listener → component → useEffect → ...).</li>
  <li>Some "growth" is GC delay rather than leak (force GC before measurement).</li>
  <li>Library bugs hide behind your app code.</li>
</ul>

<h3>Why leak vs bloat distinction matters</h3>
<table>
  <thead><tr><th></th><th>Leak</th><th>Bloat</th></tr></thead>
  <tbody>
    <tr><td>Pattern</td><td>Monotonic growth over time</td><td>High but stable</td></tr>
    <tr><td>Cause</td><td>Forgotten reference</td><td>Caching too much, large objects</td></tr>
    <tr><td>Symptom</td><td>Crash after long use</td><td>Slow but doesn't crash</td></tr>
    <tr><td>Fix</td><td>Cut the retainer</td><td>Bound caches; smaller data structures</td></tr>
  </tbody>
</table>
<p>Different remediation. Don't lump both as "memory issues."</p>

<h3>Why "performance.memory" is unreliable for production</h3>
<p>Chrome exposes <code>performance.memory</code> (jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize) but: only Chrome, deliberately quantized for security (so timing attacks can't leak data), often updates lazily. Useful as a smoke signal in dev / a/b experiments but not for precise tracking. The newer <code>performance.measureUserAgentSpecificMemory()</code> is more accurate but rate-limited and origin-locked.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "graph of references" picture</h3>
<div class="diagram">
<pre>
 Roots (window, stack, DOM, timers, listeners, observers)
        │
   ┌────┴────┐
   ▼         ▼
  obj1 ──► obj2 ──► obj3
                     │
                     └─► detached &lt;div&gt;
                          │
                          └─► event listener fn
                              │
                              └─► component instance
                                  │
                                  └─► huge array (10MB)

 If ANY path from a root reaches obj3, it's alive.
 Cutting one path doesn't help — must cut all.
 Tracing GC starts from roots, marks reachable; sweeps the rest.
</pre>
</div>

<h3>The "five canonical leaks" picture</h3>
<table>
  <thead><tr><th>Pattern</th><th>How it leaks</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>Detached DOM in array</td><td>Array holds removed nodes; nodes hold subtree</td><td>Drop reference when removing</td></tr>
    <tr><td>Listener never removed</td><td>Target pins listener closure → captured state</td><td>removeEventListener in cleanup</td></tr>
    <tr><td>setInterval not cleared</td><td>Callback closure pinned forever</td><td>clearInterval on unmount</td></tr>
    <tr><td>Observer never disconnected</td><td>Observer pins target + callback</td><td>observer.disconnect() in cleanup</td></tr>
    <tr><td>Closure captures big state</td><td>Returned function holds onto outer scope</td><td>Pull only what's needed; nullify after use</td></tr>
  </tbody>
</table>

<h3>The "snapshot diff" picture</h3>
<div class="diagram">
<pre>
 1. Open DevTools → Memory tab
 2. Click trash 🗑 (force GC)
 3. Take heap snapshot S1 (baseline)
 4. Do the suspect action 5-10x (open/close modal, navigate route, etc.)
 5. Click trash 🗑 (force GC)
 6. Take heap snapshot S2

 7. Choose "Comparison" view, base S1
 8. Sort by Δ count or Δ size
 9. Object types with growing Δ are candidates
10. Expand → see retainer chain → walk up to find what's holding them</pre>
</div>

<h3>The "shallow vs retained size" picture</h3>
<pre><code>Shallow size: bytes the object itself occupies (its own fields)
Retained size: shallow + everything this object EXCLUSIVELY keeps alive
                (would be freed if this object went away)</code></pre>
<p>A 200-byte component with 40MB retained means cutting that one reference frees 40MB. Sort by retained to find the heaviest leak anchors.</p>

<h3>The "detached DOM" picture</h3>
<div class="diagram">
<pre>
 document
    │
    └─► (no longer connected)

 ╳ but JS still references this subtree:

 cache[id] = el  // BAD — array holds the removed node
        │
        ▼
 &lt;div class="card"&gt;  ← detached
   &lt;img src="..."/&gt;
   &lt;Listener for click&gt;
 &lt;/div&gt;

 In DevTools heap snapshot: filter "Detached" → see all such subtrees.
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"GC will eventually clean it up." Tracing GC only reclaims unreachable objects. If your code still has any reference, the GC's hands are tied. The fix is in your code, not in the GC.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Chrome DevTools Memory tab — three tools</h3>
<ol>
  <li><strong>Heap snapshot</strong> — point-in-time graph of all live JS objects. Use for diff detection.</li>
  <li><strong>Allocation instrumentation on timeline</strong> — record allocations over time; bars show what was allocated when. Use for "where do these objects come from?"</li>
  <li><strong>Allocation sampling</strong> — lighter-weight allocation profiler; shows where allocations happen by JS function. Use for low-overhead inspection on slow pages.</li>
</ol>

<h3>Heap snapshot views</h3>
<ul>
  <li><strong>Summary</strong> — constructors / classes grouped, with count + shallow + retained.</li>
  <li><strong>Comparison</strong> — diff against a baseline snapshot; #New, #Deleted, #Delta columns.</li>
  <li><strong>Containment</strong> — tree view rooted at GC roots; navigate paths.</li>
  <li><strong>Statistics</strong> — pie chart of categories (closures, arrays, strings, etc.).</li>
</ul>

<h3>Hunting "Detached" DOM</h3>
<pre><code>1. Take heap snapshot
2. In the class filter box, type "Detached"
3. List of detached HTML* subtrees appears
4. Expand each → see "Retainers" panel
5. Trace up the retainer chain to find the holder
   (commonly: an array, a Map, a closure)</code></pre>

<h3>Workflow: "leak after closing modal"</h3>
<pre><code>// Sample reproducer
function modalLeak() {
  document.body.appendChild(modalEl);
  someEventBus.on('event', handler);   // ← leaks if not cleaned
}
function closeModal() {
  document.body.removeChild(modalEl);
  // forgot: someEventBus.off('event', handler)
}

// In DevTools:
1. Open + close modal 10x
2. Force GC, take snapshot
3. Search "Detached HTMLDivElement" — see growing count
4. Expand retainer → "EventBus.handlers[3]" → "ModalComponent.handler"
5. Fix: someEventBus.off in close handler</code></pre>

<h3>Performance Memory APIs (production-ish)</h3>
<pre><code class="language-js">// Chrome-only, quantized
const stats = performance.memory;
console.log(stats.usedJSHeapSize, stats.totalJSHeapSize, stats.jsHeapSizeLimit);

// Modern, more accurate, rate-limited (~once per 30s)
const measurement = await performance.measureUserAgentSpecificMemory();
console.log(measurement.bytes);   // total bytes used by this realm
// measurement.breakdown — per-attribution detail (with cross-origin isolation)</code></pre>

<h3>Production tracking via RUM</h3>
<pre><code class="language-js">function reportMemory() {
  if (performance.memory) {
    sendBeacon('/rum/memory', JSON.stringify({
      url: location.pathname,
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      ts: Date.now(),
    }));
  }
}
// Sample on visibility change, route change, every 30s while active.
// Server-side: chart usedJSHeapSize per-route; spot growth over a session.</code></pre>

<h3>Detecting leaks in CI</h3>
<p>Tools like <strong>fuite</strong> (formerly memlab):</p>
<pre><code># Headless Chrome runs your app, performs scenarios repeatedly,
# takes heap snapshots, diffs them.
npx fuite --scenario ./scenarios/route-loop.js --iterations 10</code></pre>
<p>Catches regressions before production. Memory-leak CI is rare but high-value for complex SPAs.</p>

<h3>WeakRef / WeakMap / FinalizationRegistry</h3>
<pre><code class="language-js">// WeakMap — keys held weakly; entries auto-removed when key has no other refs
const meta = new WeakMap();
meta.set(domNode, { tracked: true });
// When domNode is unreachable, entry vanishes.

// WeakRef — manual weak reference (like Java's WeakReference)
const ref = new WeakRef(bigObject);
const obj = ref.deref();   // either the object or undefined

// FinalizationRegistry — fires a callback when an object is GC'd (best-effort)
const registry = new FinalizationRegistry((handle) =&gt; {
  console.log('object collected:', handle);
});
registry.register(obj, 'some-handle');</code></pre>
<p><strong>Caveats</strong>: timing of finalization is non-deterministic. Don't rely on it for correctness — only opportunistic cleanup.</p>

<h3>Common cleanup patterns (React)</h3>
<pre><code class="language-js">useEffect(() =&gt; {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then(setData);

  const handler = (e) =&gt; setX(e.x);
  window.addEventListener('resize', handler);

  const observer = new ResizeObserver(...);
  observer.observe(ref.current);

  const id = setInterval(tick, 1000);

  return () =&gt; {
    ctrl.abort();
    window.removeEventListener('resize', handler);
    observer.disconnect();
    clearInterval(id);
  };
}, []);</code></pre>

<h3>Vanilla JS cleanup</h3>
<pre><code class="language-js">function attach() {
  const handler = () =&gt; doStuff();
  el.addEventListener('click', handler);
  return () =&gt; el.removeEventListener('click', handler);
}
const detach = attach();
// later:
detach();</code></pre>

<h3>Bound listeners and class instances</h3>
<pre><code class="language-js">class Widget {
  constructor() {
    this.onClick = this.onClick.bind(this);  // store the bound version
    el.addEventListener('click', this.onClick);
  }
  destroy() {
    el.removeEventListener('click', this.onClick);  // same fn reference
  }
  onClick() {}
}
// If you bind inline (el.addEventListener('click', this.onClick.bind(this))) you can't remove it later — different ref each time.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — detached DOM cache</h3>
<pre><code class="language-js">// BAD
const cache = [];
function track(el) { cache.push(el); }

document.querySelectorAll('.card').forEach(track);
document.querySelectorAll('.card').forEach((el) =&gt; el.remove());
// All .card subtrees still in cache → detached, never freed.

// GOOD
function track(el) { cache.push(new WeakRef(el)); }
// Entries auto-vanish when DOM is removed.</code></pre>

<h3>Example 2 — listener on global target</h3>
<pre><code class="language-js">// BAD
function mount() {
  document.addEventListener('keydown', onKey);
}
// onKey handler captures component state; never removed → component pinned forever.

// GOOD
function mount() {
  document.addEventListener('keydown', onKey);
  return () =&gt; document.removeEventListener('keydown', onKey);
}</code></pre>

<h3>Example 3 — setInterval that outlives use</h3>
<pre><code class="language-js">// BAD
setInterval(pollServer, 1000);
// pollServer's closure pinned forever; pinned state grows.

// GOOD
const id = setInterval(pollServer, 1000);
window.addEventListener('beforeunload', () =&gt; clearInterval(id));
// or, in React, clearInterval in useEffect cleanup.</code></pre>

<h3>Example 4 — IntersectionObserver leak</h3>
<pre><code class="language-js">// BAD
function lazy(el) {
  const obs = new IntersectionObserver(([entry]) =&gt; { if (entry.isIntersecting) load(); });
  obs.observe(el);
}
// obs and its callback live forever; el is pinned.

// GOOD
function lazy(el) {
  const obs = new IntersectionObserver(([entry]) =&gt; {
    if (entry.isIntersecting) { load(); obs.disconnect(); }
  });
  obs.observe(el);
}
// Disconnect when no longer needed.</code></pre>

<h3>Example 5 — closure over big array</h3>
<pre><code class="language-js">// BAD
function buildHandler() {
  const big = new Array(1e7);   // 80MB
  return () =&gt; big.length;       // pins big forever
}

// GOOD
function buildHandler() {
  const big = new Array(1e7);
  const len = big.length;        // capture only the primitive
  return () =&gt; len;
}</code></pre>

<h3>Example 6 — React unsubscribe pattern</h3>
<pre><code class="language-jsx">function Counter() {
  const [n, setN] = useState(0);
  useEffect(() =&gt; {
    const id = setInterval(() =&gt; setN((n) =&gt; n + 1), 1000);
    return () =&gt; clearInterval(id);
  }, []);
  return n;
}</code></pre>

<h3>Example 7 — AbortController for fetch on unmount</h3>
<pre><code class="language-jsx">useEffect(() =&gt; {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal })
    .then(setData)
    .catch((e) =&gt; { if (e.name !== 'AbortError') console.error(e); });
  return () =&gt; ctrl.abort();
}, [url]);</code></pre>

<h3>Example 8 — WeakMap for instance metadata</h3>
<pre><code class="language-js">const meta = new WeakMap();
function tag(node, info) { meta.set(node, info); }
function lookup(node) { return meta.get(node); }
// When node is removed and unreferenced, meta entry auto-cleared.</code></pre>

<h3>Example 9 — leak from event-bus subscription</h3>
<pre><code class="language-js">// BAD
class Component {
  constructor() {
    bus.on('update', this.handle.bind(this)); // bound fn lost
  }
  destroy() {
    bus.off('update', /* what reference? */);  // can't remove
  }
}

// GOOD
class Component {
  constructor() {
    this.handler = this.handle.bind(this);
    bus.on('update', this.handler);
  }
  destroy() {
    bus.off('update', this.handler);
  }
}</code></pre>

<h3>Example 10 — module-scope caches that grow forever</h3>
<pre><code class="language-js">// BAD
const cache = new Map();
export function get(key) { /* ... grows forever */ }

// GOOD — bounded LRU
class LRU {
  constructor(max) { this.max = max; this.map = new Map(); }
  set(k, v) {
    if (this.map.size &gt;= this.max) this.map.delete(this.map.keys().next().value);
    this.map.set(k, v);
  }
  get(k) {
    if (!this.map.has(k)) return;
    const v = this.map.get(k); this.map.delete(k); this.map.set(k, v);
    return v;
  }
}</code></pre>

<h3>Example 11 — Promise pending forever pins state</h3>
<pre><code class="language-js">// BAD
const p = new Promise(() =&gt; {});      // never settles
const big = new Array(1e7);
p.then(() =&gt; console.log(big.length)); // big pinned forever

// Avoid creating promises with no resolution path.</code></pre>

<h3>Example 12 — async generator pinning state</h3>
<pre><code class="language-js">async function* stream(items) {
  const big = new Array(1e7);   // pinned for entire iteration
  for (const x of items) yield process(x, big);
}
const it = stream(items);
// Memory pinned until iterator is exhausted OR explicitly returned.
await it.return(); // releases retained state</code></pre>

<h3>Example 13 — preventing detached DOM in lists</h3>
<pre><code class="language-js">function removeRow(id) {
  const el = rows[id];
  el.remove();          // remove from DOM
  delete rows[id];      // remove from JS map → no detached leak
  rowsObserver.unobserve(el);
}</code></pre>

<h3>Example 14 — instrument production memory</h3>
<pre><code class="language-js">setInterval(() =&gt; {
  if (!performance.memory) return;
  const used = performance.memory.usedJSHeapSize;
  if (used &gt; LAST + 50_000_000) {  // grew &gt;50MB since last sample
    console.warn('memory growth', used);
    sendBeacon('/rum/memwarn', JSON.stringify({ used, route: location.pathname }));
  }
  LAST = used;
}, 60_000);</code></pre>

<h3>Example 15 — fuite-style automated leak test</h3>
<pre><code class="language-js">// scenarios/route-loop.js
module.exports = {
  setup: async (page) =&gt; { await page.goto('http://localhost:3000'); },
  iteration: async (page) =&gt; {
    await page.click('a[href="/posts"]');
    await page.click('a[href="/"]');
  },
};
// fuite reports: "+ 25 detached HTMLDivElements per iteration"</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. GC isn't synchronous</h3>
<p>After dropping a reference, the object isn't immediately freed. Force GC in DevTools (trash icon) before snapshotting; otherwise temporary growth looks like a leak.</p>

<h3>2. console.log retains references in DevTools</h3>
<p>Open the DevTools console; log an object; you can expand and inspect it forever. DevTools holds a strong reference. Close the console group or filter logs out before snapshotting.</p>

<h3>3. WeakRef is not a free pass</h3>
<p>Weak references don't prevent leaks of <em>other</em> things. If your WeakMap key is held strongly elsewhere, the entry stays. WeakRef.deref() may return undefined at any time — code must handle that.</p>

<h3>4. Closures vary by engine optimization</h3>
<p>V8 attempts "context escape analysis" — captures only used variables. But complex code (eval, with, captured arguments object, mutually recursive functions) can fall back to capturing the whole scope. When in doubt, destructure what you need before returning a closure.</p>

<h3>5. String slice retains parent</h3>
<p>In V8, <code>"a".repeat(1e6).slice(0, 5)</code> may keep the original 1MB string alive (sliced strings reference the parent). Force a copy when needed: <code>('' + slice).slice()</code> or use template literal interpolation with a forced copy.</p>

<h3>6. EventListeners with options.once</h3>
<p><code>el.addEventListener('click', fn, { once: true })</code> auto-removes after the first call. Saves you from forgetting cleanup. Use when applicable.</p>

<h3>7. Detached iframes</h3>
<p>An iframe removed from the DOM but referenced (in JS or in another tab) may keep its window object alive — including all its memory. Same-origin iframes especially: drop all references to the contentWindow.</p>

<h3>8. Service worker keeping pages alive</h3>
<p>An active service worker maintains its own state across navigations. SW-cached objects in IndexedDB stay forever unless cleaned. Clear caches periodically.</p>

<h3>9. Detached DOM subtree referenced by attributes</h3>
<p>A node with custom JS-bound properties (Element.dataset, custom attributes set via JS) holds the JS values. If detached but JS holds the node, all sub-references stay.</p>

<h3>10. React DevTools profiler retains snapshots</h3>
<p>While Profiler is recording, every commit's snapshot stays in memory. Stop recording before measuring leaks; otherwise normal app growth looks like a leak.</p>

<h3>11. Long-running setInterval triggers GC pressure</h3>
<p>An interval allocating 1KB per tick → 60KB/sec, 3.6MB/min. Eventually triggers full GC pause. Reduce per-tick allocations; reuse buffers.</p>

<h3>12. Strict-mode double-effect in React 18 dev</h3>
<p>Effects run twice. If your cleanup is buggy, you'll see double-listener counts. Production runs effects once. Helpful for catching cleanup bugs.</p>

<h3>13. Module-level subscriptions never released</h3>
<pre><code class="language-js">// At module scope:
window.addEventListener('focus', () =&gt; analytics.ping());
// Never removed; module unload doesn't happen for SPA bundles. Acceptable for app-lifetime listeners; problematic for routes.</code></pre>

<h3>14. Cross-frame leaks on old IE</h3>
<p>Pre-IE9 had separate GCs for JS and COM/DOM, so cycles across the boundary leaked. Modern browsers don't. Old advice to "null out DOM refs before unload" comes from there.</p>

<h3>15. Browser extension memory</h3>
<p>Page running with an extension that injects scripts: extensions hold their own references. Repro leaks in incognito / no-extension Chrome to isolate.</p>

<h3>16. <code>console.log(obj)</code> in production</h3>
<p>Each log retains the object in DevTools-side memory if open; on closed DevTools, it's a noop but still a string-coerce cost. Strip in release.</p>

<h3>17. Prototype pollution induces leaks indirectly</h3>
<p>If <code>Object.prototype.x = bigArray</code> sneaks in via prototype pollution, every object inherits a reference to bigArray. Defend against pollution (Object.create(null), validation).</p>

<h3>18. Workers leak independently</h3>
<p>Web Workers have their own heap. <code>new Worker(...)</code> followed by <code>worker.terminate()</code> required for cleanup. Untermimated workers keep their memory + posted message backlog.</p>

<h3>19. Tab discard restores partial state</h3>
<p>Browsers can discard backgrounded tabs to reclaim memory; on revisit, they reload. Code that writes state lazily to storage may lose unflushed data. Save eagerly on visibilitychange.</p>

<h3>20. Memory in dev mode is not production memory</h3>
<p>Dev bundles include sourcemaps + warnings + StrictMode + Profiler hooks. Real production size is usually 30-50% smaller. Profile in production builds for representative numbers.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — global subscriptions that components register</h3>
<pre><code class="language-js">function Comp() {
  document.addEventListener('keydown', onKey); // never removed
  // ...
}</code></pre>
<p>Wrap in useEffect with cleanup. Otherwise every mount adds a listener.</p>

<h3>Anti-pattern 2 — module-scope caches without bounds</h3>
<pre><code class="language-js">const userCache = new Map();
function getUser(id) { /* grows forever */ }</code></pre>
<p>Cap with LRU, TTL, or use WeakMap if keys are objects.</p>

<h3>Anti-pattern 3 — anonymous functions for listeners</h3>
<pre><code class="language-js">el.addEventListener('click', () =&gt; doIt()); // can't remove later</code></pre>
<p>Store a reference; remove with the same reference.</p>

<h3>Anti-pattern 4 — long-lived setInterval without clear</h3>
<p>Every interval pins its callback's closure forever. Always store the id and clearInterval at the right point.</p>

<h3>Anti-pattern 5 — observers that observe but never disconnect</h3>
<p>IntersectionObserver, ResizeObserver, MutationObserver pin their callbacks AND targets. Always disconnect when the observation is no longer needed.</p>

<h3>Anti-pattern 6 — closures pinning entire scopes</h3>
<pre><code class="language-js">function withState() {
  const big = loadAllData();   // pinned
  return () =&gt; big.length;
}</code></pre>
<p>Capture only what you need. Even better: pass values into the closure rather than closing over them.</p>

<h3>Anti-pattern 7 — keeping React state for things that don't need re-renders</h3>
<p>Use refs for data not used in render. Stale state references can pile up; refs are mutable boxes that don't trigger renders.</p>

<h3>Anti-pattern 8 — leaking via event delegation done wrong</h3>
<pre><code class="language-js">document.body.addEventListener('click', (e) =&gt; {
  if (e.target.closest('.card')) handleCardClick(this.state);
});</code></pre>
<p>If the listener captures a stale state, it stays alive forever pinning that state. Refs > closures for delegated handlers.</p>

<h3>Anti-pattern 9 — promise chains that never settle</h3>
<pre><code class="language-js">const forever = new Promise(() =&gt; {});
forever.then(() =&gt; console.log(big));</code></pre>
<p>Memory pinned indefinitely. Avoid intentionally-unresolved promises as sentinels.</p>

<h3>Anti-pattern 10 — over-storing in Redux / global state</h3>
<p>Server data, ephemeral UI state, caches all in one mega-store. Never trimmed. Bound state size; evict stale; use server-state libs (TanStack Query) for cacheable data.</p>

<h3>Anti-pattern 11 — bind/arrow inline on JSX prop = loses removeListener</h3>
<pre><code class="language-jsx">&lt;button onClick={() =&gt; this.handleClick()}/&gt;</code></pre>
<p>Different fn reference each render. Memo handlers via useCallback or class methods.</p>

<h3>Anti-pattern 12 — cycles between native and JS objects</h3>
<p>Modern browsers handle most cycles, but a subtle one: <code>el._app = appInstance; appInstance.el = el</code>. Self-reinforcing references can complicate retainer chains. Avoid bidirectional pointers when possible.</p>

<h3>Anti-pattern 13 — exposing internals on window for debugging, never removing</h3>
<pre><code class="language-js">window.__store = store;  // for debugging
// Forget to remove → store is forever pinned via window.</code></pre>
<p>If you do this in dev, gate with <code>__DEV__</code> and ensure release strips.</p>

<h3>Anti-pattern 14 — unbounded log buffer</h3>
<pre><code class="language-js">const logs = [];
function log(x) { logs.push(x); }   // forever-growing</code></pre>
<p>Cap or rotate; flush to server periodically.</p>

<h3>Anti-pattern 15 — console.log in production</h3>
<p>If DevTools is open, logged objects are retained. Even closed, the string serialization costs CPU. Strip via build transform.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is a memory leak in JavaScript?</div>
  <div class="qa-answer">
    <p>An object that remains reachable from a GC root after it's no longer needed by the application. The garbage collector cannot reclaim it because there's still a reference path. Logical leak, not a runtime "we forgot to free" — JS is GC'd. The fix is to drop the lingering reference.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Name the top 5 sources of leaks on the web.</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Detached DOM</strong> kept in JS arrays / maps.</li>
      <li><strong>Event listeners</strong> not removed.</li>
      <li><strong>Timers</strong> (setInterval, setTimeout) not cleared.</li>
      <li><strong>Observers</strong> (Intersection / Resize / Mutation) not disconnected.</li>
      <li><strong>Closures</strong> capturing big state in long-lived functions.</li>
    </ol>
    <p>Bonus: long-pending promises, modules-scope caches, workers not terminated, Redux state never trimmed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Walk me through finding a leak in DevTools.</div>
  <div class="qa-answer">
    <ol>
      <li>Open DevTools → Memory tab.</li>
      <li>Force GC (trash icon).</li>
      <li>Take baseline heap snapshot.</li>
      <li>Perform the suspect action repeatedly (5-10x).</li>
      <li>Force GC again.</li>
      <li>Take another snapshot.</li>
      <li>Choose Comparison view; sort by Δ count or Δ size.</li>
      <li>Look at constructors with growing counts (e.g., "Detached HTMLDivElement").</li>
      <li>Expand → Retainers panel; trace up the chain to find the holder.</li>
      <li>Fix the retaining code; re-run to verify.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Detect a detached DOM tree — how?</div>
  <div class="qa-answer">
    <p>In a heap snapshot, type "Detached" in the class filter. DevTools shows all detached HTML* subtrees. Each is a candidate leak. Expand to see retainers: typically an array, a Map, an event-bus subscription, or a closure.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Explain shallow vs retained size.</div>
  <div class="qa-answer">
    <p><strong>Shallow size</strong>: how many bytes the object's own fields occupy. <strong>Retained size</strong>: shallow size plus everything this object exclusively keeps alive. A 200-byte component with 40MB retained size means dropping that single reference frees the entire 40MB. Sort by retained to find the biggest leak anchors.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Why can't I just trust GC to clean up?</div>
  <div class="qa-answer">
    <p>GC reclaims unreachable objects. If your code holds a reference — even unintentionally, in a cache or closure — the object is reachable and won't be reclaimed. The leak is in your code, not the GC. The fix is to find and remove the lingering reference.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Difference between leak and bloat?</div>
  <div class="qa-answer">
    <p><strong>Leak</strong>: memory grows monotonically over time; never reclaimed. <strong>Bloat</strong>: memory is high but stable. Leaks have a growth pattern in RUM / DevTools timeline; bloat has a flat-but-elevated baseline. Different fixes: leak = find retainer; bloat = bound caches, smaller structures, lazy load.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why is performance.memory unreliable?</div>
  <div class="qa-answer">
    <p>Chrome-only, deliberately quantized for security (timing attack mitigation), and updates lazily. Useful as a coarse signal but not for precise tracking. Modern alternative: <code>performance.measureUserAgentSpecificMemory()</code> — more accurate, rate-limited (~once per 30s), and requires cross-origin isolation. For production, sample sparingly + report to RUM.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Implement an LRU cache.</div>
  <div class="qa-answer">
<pre><code class="language-js">class LRU {
  constructor(max) { this.max = max; this.map = new Map(); }
  get(k) {
    if (!this.map.has(k)) return undefined;
    const v = this.map.get(k);
    this.map.delete(k); this.map.set(k, v);   // move to most recent
    return v;
  }
  set(k, v) {
    if (this.map.has(k)) this.map.delete(k);
    else if (this.map.size &gt;= this.max) this.map.delete(this.map.keys().next().value);
    this.map.set(k, v);
  }
}</code></pre>
    <p>Map preserves insertion order; oldest is the first key.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. When would you use WeakMap?</div>
  <div class="qa-answer">
    <p>To attach metadata to objects without preventing their GC. Example: a cache keyed by DOM elements where entries should auto-clear when the element is removed. Or private-data store for class instances. Caveat: keys must be objects (not primitives) and not iterable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you handle cleanup in React?</div>
  <div class="qa-answer">
<pre><code class="language-jsx">useEffect(() =&gt; {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then(setData);
  const handler = () =&gt; ...;
  window.addEventListener('resize', handler);
  const id = setInterval(tick, 1000);
  return () =&gt; {
    ctrl.abort();
    window.removeEventListener('resize', handler);
    clearInterval(id);
  };
}, []);</code></pre>
    <p>The cleanup function runs on unmount AND before the effect re-runs (deps change).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. A user reports the tab freezes after using your app for an hour. How do you diagnose?</div>
  <div class="qa-answer">
    <ol>
      <li>Open DevTools Performance Monitor → memory growth visible?</li>
      <li>Take heap snapshot; reproduce the user's flow; take another snapshot.</li>
      <li>Compare; identify growing object types.</li>
      <li>Trace retainer chains.</li>
      <li>Fix the source; verify with another comparison.</li>
      <li>For production: instrument <code>performance.memory</code> on visibility change; identify which routes leak most.</li>
      <li>Consider running fuite / memlab in CI for repeatable detection.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Leak vs late cleanup — how do you tell?</div>
  <div class="qa-answer">
    <p>Force GC before snapshotting. Late cleanup means objects waiting to be reclaimed; after force-GC, they're gone. A real leak survives forced GC because reachable. If memory still rises after forced GC, you have a leak; otherwise it's GC timing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Common cause: chat-app message list grows forever. Fix?</div>
  <div class="qa-answer">
    <p>Cap the rendered list (virtualized — react-window, FlashList). Cap the in-memory store (only last N messages; older paged on demand from server / DB). Cap the Redux / Zustand store size. Periodically evict messages outside the active viewport. Combined: virtualized list + bounded cache + on-demand fetch beyond cache.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How do you prevent leaks in CI?</div>
  <div class="qa-answer">
    <p>Tools like fuite (formerly memlab from Meta): run automated scenarios in headless Chrome, take repeated heap snapshots, diff. Reports leaks by type with retainer chains. Integrate into CI to fail PRs that introduce new leaks. Plus React Profiler-based regression checks for excess fiber retention.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You define leak as "reachable from root but no longer needed."</li>
    <li>You name 5+ canonical leak sources (DOM, listeners, timers, observers, closures).</li>
    <li>You walk through DevTools heap snapshot + comparison workflow.</li>
    <li>You distinguish shallow vs retained size.</li>
    <li>You distinguish leak from bloat.</li>
    <li>You reach for WeakMap / WeakRef when appropriate.</li>
    <li>You force GC before snapshotting.</li>
    <li>You handle cleanup correctly in React (useEffect return).</li>
    <li>You instrument production with <code>performance.memory</code> + RUM.</li>
    <li>You set up automated leak detection (fuite / memlab) in CI.</li>
  </ul>
</div>
`}

]
});
