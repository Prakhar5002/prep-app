window.PREP_SITE.registerTopic({
  id: 'dbg-memory',
  module: 'Debugging',
  title: 'Memory Leak Hunt',
  estimatedReadTime: '24 min',
  tags: ['debugging', 'memory', 'leak', 'heap-snapshot', 'devtools', 'detached-dom', 'retainers'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Memory leak hunting is the process of finding objects that should have been garbage-collected but weren't — because some reference still points to them. Single most common debugging shape: take snapshot, reproduce action, take snapshot, compare, trace retainers.</p>
<ul>
  <li><strong>DevTools Memory panel</strong> — three modes: heap snapshot, allocation timeline, allocation sampling.</li>
  <li><strong>Snapshot + diff</strong> — baseline snapshot → reproduce action 5-10x → snapshot 2 → comparison view → growing object types.</li>
  <li><strong>Detached DOM</strong> — filter <code>"Detached"</code> in heap snapshot to find DOM trees still in JS but removed from page.</li>
  <li><strong>Retainer chain</strong> — for any object, expand "Retainers" panel to find what holds it alive.</li>
  <li><strong>Force GC</strong> — trash icon. Critical: snapshot AFTER force-GC for clean baseline.</li>
  <li><strong>queryObjects</strong> in console — find all instances of a class.</li>
  <li><strong>fuite / memlab</strong> — automated memory leak detection in CI.</li>
  <li><strong>performance.measureUserAgentSpecificMemory()</strong> — modern API for production memory tracking.</li>
  <li><strong>Common culprits</strong>: detached DOM in arrays, unremoved listeners, uncleared intervals, undisconnected observers, closures over big state.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Snapshot, repeat, snapshot, compare. Sort by Δ. Detached &gt; 0 = leak. Trace the retainer chain to find the holder. Cut it. Verify with another snapshot.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why memory leaks are hard</h3>
<ul>
  <li>Symptoms appear gradually — slow tab over hours.</li>
  <li>Reproduction requires repetition.</li>
  <li>Multiple references can hold an object — cutting one isn't enough.</li>
  <li>Library code may be the culprit; you debug your code.</li>
  <li>GC timing is non-deterministic; "memory grows" can be GC delay.</li>
</ul>

<h3>Why DevTools Memory panel is the right tool</h3>
<ul>
  <li>Pauses execution and walks the entire heap.</li>
  <li>Categorizes objects by class (constructor name).</li>
  <li>Shows shallow + retained size.</li>
  <li>Traces retainers — the path of references that keeps an object alive.</li>
  <li>Diffs between snapshots → growing types are leak candidates.</li>
</ul>

<h3>Why force GC before snapshotting</h3>
<p>Without forcing GC, "growth" between snapshots includes garbage that just hasn't been collected yet — a false positive. Trash icon (🗑) forces a major GC. Snapshot immediately after for a clean baseline.</p>

<h3>Why retained size matters more than shallow</h3>
<ul>
  <li><strong>Shallow size</strong>: bytes the object itself uses.</li>
  <li><strong>Retained size</strong>: shallow + everything this object exclusively keeps alive.</li>
</ul>
<p>A 200-byte component holding 40MB of data has retained size 40MB. Cutting that one reference frees 40MB. Sort by retained size to find leak anchors.</p>

<h3>Why Detached DOM is special</h3>
<p>An HTML element removed from the page (<code>parentNode.removeChild</code>) but still referenced from JS (in an array, closure, etc.) is a "detached" subtree. It can't ever appear again, but won't be GC'd. The whole subtree is alive — including listeners, child elements, attached data. Detached DOM is the most common leak source in browsers.</p>

<h3>Why fuite / memlab in CI</h3>
<p>Manual hunts find one-off bugs. CI tools run automated scenarios in headless Chrome, take snapshots, diff, report regressions. Catches leaks before they ship. Recommended for active SPAs.</p>

<h3>Why memory APIs in production</h3>
<p>You can't take heap snapshots from production users. But you CAN report aggregated memory usage:</p>
<ul>
  <li><code>performance.memory</code> (Chrome only, quantized): coarse signal.</li>
  <li><code>performance.measureUserAgentSpecificMemory()</code>: modern, more accurate, rate-limited.</li>
</ul>
<p>Track in RUM; spot leaks at scale before user complaints.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "leak hunt" workflow</h3>
<div class="diagram">
<pre>
 1. Identify reproducer
    "Open + close modal X times → memory grows"

 2. Open DevTools → Memory panel
    Force GC (trash icon)

 3. Take snapshot S1 (baseline)

 4. Reproduce action 5-10×
    Force GC
    Take snapshot S2

 5. Compare S2 vs S1
    Sort by # delta or size delta
    Filter "Detached" for DOM leaks

 6. Inspect retainers
    Expand chain → find holder

 7. Fix
    Cut the reference (cleanup, WeakMap, etc.)

 8. Verify
    Repeat 1-5 — count should be 0</pre>
</div>

<h3>The "snapshot view modes"</h3>
<table>
  <thead><tr><th>View</th><th>Shows</th></tr></thead>
  <tbody>
    <tr><td>Summary</td><td>Constructors with count + size</td></tr>
    <tr><td>Comparison</td><td>Diff vs another snapshot</td></tr>
    <tr><td>Containment</td><td>Tree of references from GC roots</td></tr>
    <tr><td>Statistics</td><td>Pie chart by category</td></tr>
  </tbody>
</table>

<h3>The "retainer chain"</h3>
<div class="diagram">
<pre>
 Detached &lt;div class="card"&gt;
   ↑ retained by
 Array (length 47)
   ↑ retained by
 ModalManager.history
   ↑ retained by
 window.__modalManager
   ↑ root: Window

 Conclusion: window.__modalManager.history holds all detached cards.
 Fix: clear .history when closing modals, or use WeakRef.</pre>
</div>

<h3>The "five canonical leaks" (recap)</h3>
<table>
  <thead><tr><th>Pattern</th><th>How leak forms</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>Detached DOM</td><td>Array holds removed nodes</td><td>Drop reference / WeakRef</td></tr>
    <tr><td>Listener never removed</td><td>Target pins listener</td><td>removeEventListener in cleanup</td></tr>
    <tr><td>Timer not cleared</td><td>Callback closure pinned</td><td>clearInterval / clearTimeout</td></tr>
    <tr><td>Observer not disconnected</td><td>Observer pins targets</td><td>obs.disconnect() in cleanup</td></tr>
    <tr><td>Closure over big state</td><td>Returned fn pins outer scope</td><td>Capture only needed values</td></tr>
  </tbody>
</table>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Memory grew, so there's a leak." Memory growth can be normal: cache filling, image decoding, lazy-loaded modules. Real leak: memory keeps growing across repeated identical actions, AND survives forced GC.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Memory panel — three modes</h3>
<ol>
  <li><strong>Heap snapshot</strong>: full graph at a point in time. Best for diff-based hunts.</li>
  <li><strong>Allocation instrumentation on timeline</strong>: records every allocation over a session. Bars on a timeline. Best for "where do these objects come from?"</li>
  <li><strong>Allocation sampling</strong>: lighter-weight profiler showing per-function allocations. Use on slow / busy pages where instrumentation is too heavy.</li>
</ol>

<h3>Heap snapshot workflow</h3>
<pre><code>1. DevTools → Memory tab
2. Click trash 🗑 (force GC)
3. Take heap snapshot — name it "baseline"
4. Reproduce suspect action 5-10×
5. Click trash 🗑
6. Take heap snapshot — name it "after"
7. Switch view to "Comparison" → choose baseline as source
8. Sort by # Delta or Size Delta
9. Object types with growing Δ are candidates
10. Expand row → expand individual objects → "Retainers" panel</code></pre>

<h3>Detached DOM filter</h3>
<pre><code>In heap snapshot's filter box, type:
  "Detached"

Lists all detached HTML* subtrees:
- Detached HTMLDivElement: 47
- Detached HTMLImageElement: 12
- Detached HTMLButtonElement: 23

Expand any → Retainers shows the chain.</code></pre>

<h3>Retainers panel</h3>
<pre><code>Selected object → bottom panel shows references:
  - "Retainers" tab — what holds this object alive
  - Chain expandable; each row shows: reference name + holder

Walk up until you reach a GC root (Window, builtins, current call stack).
Identify which named property in your code is the holder.</code></pre>

<h3>queryObjects</h3>
<pre><code class="language-js">// In Console (after snapshot or any time):
queryObjects(MyComponent)
// → [MyComponent, MyComponent, ...]

// Useful for finding leaked instances:
queryObjects(HTMLDivElement)        // all div elements
queryObjects(EventTarget)            // all event targets

// After cleaning up:
queryObjects(MyComponent).length     // should match expected</code></pre>

<h3>Allocation timeline</h3>
<pre><code>1. Memory → Allocation instrumentation on timeline
2. Click record
3. Reproduce scenario
4. Stop
5. Bars at top: blue = alive, gray = freed
6. Drag-select a bar range → see allocations in that window
7. Click an allocation → call stack of where it was created</code></pre>

<h3>Allocation sampling</h3>
<pre><code>Lighter than instrumentation. Lower overhead.
1. Memory → Allocation sampling
2. Record + interact + stop
3. Per-function allocation summary
4. Sort by self size or total size
5. Click → call tree</code></pre>

<h3>Force GC reliably</h3>
<pre><code>The trash icon force-collects. To verify with code (in dev only):
- Chrome: --js-flags="--expose-gc"
- Then: window.gc() in console

For testing in CI, run Chrome with that flag.</code></pre>

<h3>fuite (memlab successor)</h3>
<pre><code class="language-bash"># scenarios/route-loop.js
module.exports = {
  setup: async (page) =&gt; { await page.goto('http://localhost:3000'); },
  iteration: async (page) =&gt; {
    await page.click('a[href="/posts"]');
    await page.click('a[href="/"]');
  },
};

# Run:
npx fuite --scenario ./scenarios/route-loop.js --iterations 10

# Output: "Detected leak: 25 detached HTMLDivElements per iteration"
# With retainer paths.</code></pre>

<h3>Memory APIs (production)</h3>
<pre><code class="language-js">// Chrome only, quantized:
const m = performance.memory;
console.log(m.usedJSHeapSize, m.totalJSHeapSize, m.jsHeapSizeLimit);

// Modern, more accurate, rate-limited (~once per 30s):
const m = await performance.measureUserAgentSpecificMemory();
console.log(m.bytes);              // total
m.breakdown.forEach((b) =&gt; console.log(b.bytes, b.attribution));</code></pre>

<h3>RUM memory tracking</h3>
<pre><code class="language-js">function reportMemory() {
  if (!performance.memory) return;
  navigator.sendBeacon('/rum/memory', JSON.stringify({
    used: performance.memory.usedJSHeapSize,
    limit: performance.memory.jsHeapSizeLimit,
    url: location.pathname,
    duration: performance.now(),
  }));
}

document.addEventListener('visibilitychange', () =&gt; {
  if (document.visibilityState === 'hidden') reportMemory();
});
setInterval(reportMemory, 60000);</code></pre>

<h3>Identifying common patterns</h3>
<table>
  <thead><tr><th>If you see…</th><th>Likely…</th></tr></thead>
  <tbody>
    <tr><td>Detached HTMLDivElement growing</td><td>Array holding removed nodes</td></tr>
    <tr><td>Lots of EventListener objects</td><td>Listeners not removed</td></tr>
    <tr><td>Closure objects growing</td><td>setInterval / setTimeout not cleared</td></tr>
    <tr><td>Map / Set growing</td><td>Cache without bound</td></tr>
    <tr><td>Promise objects piling up</td><td>Pending promises that never settle</td></tr>
    <tr><td>Worker / SharedWorker count rising</td><td>Workers spawned but not terminated</td></tr>
    <tr><td>Specific component constructor growing</td><td>Component instances not unmounting</td></tr>
  </tbody>
</table>

<h3>Class instance leak (React)</h3>
<pre><code>1. queryObjects(YourComponent) → 50 instances
2. But only 1 mounted in the tree
3. 49 leaked
4. Pick one of the leaked → Retainers
5. Trace: array of refs in a global event bus → never removed
6. Fix: unsubscribe in cleanup</code></pre>

<h3>console.log retains in DevTools</h3>
<p>Logged objects are kept alive in DevTools console buffer to allow expansion. Excessive logging in long sessions adds memory not in your app. Strip console in release; clear DevTools console between snapshots if debugging.</p>

<h3>Profiler retains too</h3>
<p>While Profiler is recording, every commit's snapshot stays in memory. Stop Profiler before measuring leaks; otherwise normal app growth looks like a leak.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — modal leak hunt</h3>
<pre><code>// Reproducer:
function openModal() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  someBus.on('event', () =&gt; el.remove());
}

// In DevTools:
1. Memory → force GC → snapshot (S1)
2. Open + close modal 10×
3. force GC → snapshot (S2)
4. Compare → "Detached HTMLDivElement: +10"
5. Expand → Retainers → "EventBus.handlers[N]"
6. Fix: remove handler when modal closes</code></pre>

<h3>Example 2 — undocumented setInterval</h3>
<pre><code class="language-js">// Reproducer:
function startPolling() {
  setInterval(poll, 1000);   // never cleared
}

// Symptoms:
- Closure objects grow over time
- Memory rises monotonically

// Fix:
const id = setInterval(poll, 1000);
useEffect(() =&gt; {
  return () =&gt; clearInterval(id);
}, []);</code></pre>

<h3>Example 3 — IntersectionObserver leak</h3>
<pre><code class="language-js">// Bad:
function observe(el) {
  const obs = new IntersectionObserver(([entry]) =&gt; {
    if (entry.isIntersecting) load();
  });
  obs.observe(el);
}

// Symptoms:
- IntersectionObserver count grows
- Detached HTMLDivElement: many

// Fix:
function observe(el) {
  const obs = new IntersectionObserver(([entry]) =&gt; {
    if (entry.isIntersecting) {
      load();
      obs.disconnect();   // stop observing once triggered
    }
  });
  obs.observe(el);
}</code></pre>

<h3>Example 4 — closure over big state</h3>
<pre><code class="language-js">// Bad:
function buildHandler() {
  const big = new Array(1e7);    // 80MB
  return () =&gt; big.length;       // pins big forever
}

// In snapshot:
- Function objects with retained size 80MB+

// Fix:
function buildHandler() {
  const big = new Array(1e7);
  const len = big.length;
  return () =&gt; len;              // captures only the primitive
}</code></pre>

<h3>Example 5 — bus subscription forgotten</h3>
<pre><code class="language-js">// Bad:
class Modal {
  constructor() {
    bus.on('close', this.handleClose.bind(this));
  }
  destroy() {
    // forgot: bus.off
  }
}

// In snapshot:
queryObjects(Modal).length // grows on every open/close

// Fix:
constructor() {
  this._handleClose = this.handleClose.bind(this);
  bus.on('close', this._handleClose);
}
destroy() {
  bus.off('close', this._handleClose);
}</code></pre>

<h3>Example 6 — module-scope cache</h3>
<pre><code class="language-js">// Bad:
const userCache = new Map();
export function getUser(id) {
  if (!userCache.has(id)) userCache.set(id, fetchUser(id));
  return userCache.get(id);
}

// In snapshot:
- Map shallow size growing
- Retained: every cached User

// Fix: bounded LRU
class LRU {
  constructor(max) { this.max = max; this.map = new Map(); }
  set(k, v) {
    if (this.map.size &gt;= this.max) this.map.delete(this.map.keys().next().value);
    this.map.set(k, v);
  }
  get(k) {
    const v = this.map.get(k);
    if (v) { this.map.delete(k); this.map.set(k, v); }
    return v;
  }
}</code></pre>

<h3>Example 7 — promise never settles</h3>
<pre><code class="language-js">// Bad:
const forever = new Promise(() =&gt; {});      // never settles
const big = new Array(1e7);
forever.then(() =&gt; console.log(big.length));  // big pinned

// In snapshot:
- Pending Promise objects
- Retainers include captured "big"

// Fix: don't create promises that never settle.</code></pre>

<h3>Example 8 — Web Worker not terminated</h3>
<pre><code class="language-js">// Bad:
function process(data) {
  const w = new Worker('/parser.js');
  w.postMessage(data);
  w.onmessage = (e) =&gt; setData(e.data);
  // never terminates
}

// In snapshot:
- Worker count grows on every call

// Fix:
function process(data) {
  return new Promise((resolve) =&gt; {
    const w = new Worker('/parser.js');
    w.postMessage(data);
    w.onmessage = (e) =&gt; { resolve(e.data); w.terminate(); };
  });
}</code></pre>

<h3>Example 9 — RUM memory observer</h3>
<pre><code class="language-js">setInterval(() =&gt; {
  if (!performance.memory) return;
  const used = performance.memory.usedJSHeapSize;
  if (used &gt; LAST + 50_000_000) {
    sendBeacon('/rum/memory-warn', JSON.stringify({
      used,
      route: location.pathname,
    }));
  }
  LAST = used;
}, 60_000);</code></pre>

<h3>Example 10 — fuite scenario</h3>
<pre><code class="language-js">// scenarios/list-scroll.js
module.exports = {
  setup: async (page) =&gt; { await page.goto('http://localhost:3000/posts'); },
  iteration: async (page) =&gt; {
    await page.evaluate(() =&gt; window.scrollBy(0, 500));
    await page.evaluate(() =&gt; window.scrollBy(0, -500));
  },
};
// Run: npx fuite --scenario list-scroll.js --iterations 20</code></pre>

<h3>Example 11 — find DOM listeners</h3>
<pre><code class="language-js">// Console:
getEventListeners($0)
// { click: [{listener: ƒ, ...}], keydown: [...] }
// See what's bound to the selected element</code></pre>

<h3>Example 12 — heap snapshot from CDP</h3>
<pre><code class="language-js">// Chrome DevTools Protocol — programmatic snapshots
// Run Chrome with --remote-debugging-port=9222
import CDP from 'chrome-remote-interface';

const client = await CDP();
const { HeapProfiler } = client;
await HeapProfiler.enable();
const result = await HeapProfiler.takeHeapSnapshot();
// Process result.chunks for analysis</code></pre>

<h3>Example 13 — instrumented allocations on click</h3>
<pre><code>1. Memory → Allocation instrumentation on timeline
2. Click record
3. Click the suspect button 5×
4. Stop
5. Bars at top show allocation spikes
6. Drag-select around the spikes
7. See "Allocation Stack" — call site of each new object
8. Identify excessive allocations + fix</code></pre>

<h3>Example 14 — confirm fix with comparison</h3>
<pre><code>1. Take baseline snapshot
2. Apply fix
3. Reproduce same scenario 10×
4. Take second snapshot
5. Compare → growing types should be empty (or static)
6. queryObjects(SuspectClass).length should match before-action count</code></pre>

<h3>Example 15 — measure heap after navigation</h3>
<pre><code class="language-js">// Custom check during dev
function checkHeapDelta(label) {
  if (!performance.memory) return;
  const used = performance.memory.usedJSHeapSize;
  console.log(label, 'heap:', (used / 1e6).toFixed(1), 'MB');
}

// Sprinkle in suspect places:
checkHeapDelta('before route change');
nav.navigate('/posts');
setTimeout(() =&gt; checkHeapDelta('after route change'), 100);</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. GC isn't synchronous</h3>
<p>Memory grows visible after dropping a reference until GC runs. Force GC before measuring.</p>

<h3>2. console.log retains references</h3>
<p>Open console + log object + close ref in code. Object stays alive because console expands lazily. Strip console from production.</p>

<h3>3. WeakRef not always immediately collected</h3>
<p>WeakRef.deref() returns the object until GC happens, even after all strong refs gone. Don't expect immediate cleanup.</p>

<h3>4. Sliced strings retain parent</h3>
<p>V8 may store <code>str.slice(0, 5)</code> as a "sliced string" pointing at the original — original 1MB string stays alive. Force copy via <code>('' + str).slice()</code> if needed.</p>

<h3>5. Listeners with options.once auto-remove</h3>
<p><code>{ once: true }</code> auto-removes listener after first call. Save you from cleanup. Use when applicable.</p>

<h3>6. Detached iframes</h3>
<p>Removing an iframe from DOM but keeping a ref to its <code>contentWindow</code> retains the entire subordinate window's heap. Same-origin iframes especially.</p>

<h3>7. Service Worker cache</h3>
<p>SW maintains its own cache (Cache API + IndexedDB). Doesn't appear in the page's heap. Inspect via Application → Cache Storage / IndexedDB.</p>

<h3>8. Snapshot of huge heap fails</h3>
<p>1GB+ heaps can hang DevTools. Profile smaller scenarios; or use Node's <code>--inspect</code> for server-side.</p>

<h3>9. Memory keeps rising — but stable</h3>
<p>Memory grows, then plateaus at a high level. Likely bloat (full caches, lazy-loaded modules), not leak. Different fix: bound caches, lazy-load less.</p>

<h3>10. Tab freezes during snapshot</h3>
<p>Snapshot is a stop-the-world walk. UI freezes briefly. Plan around — don't snapshot during recording.</p>

<h3>11. Workers have separate heap</h3>
<p>Heap snapshot of main thread doesn't include workers. Open Sources → workers → take snapshot of each.</p>

<h3>12. Closure variables vs function references</h3>
<p>A closure capturing <code>x</code> retains <code>x</code>. The function itself, captured elsewhere, also retains <code>x</code>. Both must be released.</p>

<h3>13. Detached DOM with no listeners — still alive</h3>
<p>Even without listeners, references in JS arrays keep DOM alive. Filter "Detached" catches all.</p>

<h3>14. window-level globals</h3>
<p><code>window.something = bigObject</code> for debugging — easy to forget. Heap snapshot retainer chain ends at "Window".</p>

<h3>15. Profiler running</h3>
<p>React DevTools Profiler holds commits. Stop profiling before snapshot.</p>

<h3>16. Browser extension memory</h3>
<p>Extensions inject scripts that may keep references. For clean repro, use Incognito.</p>

<h3>17. Module-level state</h3>
<p>Modules are evaluated once; module-scope <code>const cache = new Map()</code> lives forever. Bound or rotate.</p>

<h3>18. Prototype pollution leaks</h3>
<p>Mutating <code>Object.prototype</code> gives every object a property — retains forever. Hard to debug.</p>

<h3>19. AbortController unused</h3>
<p>Forgetting to abort fetches: in-flight responses + their handlers retained until network completes.</p>

<h3>20. Performance memory quantization</h3>
<p><code>performance.memory.usedJSHeapSize</code> is rounded for security. Small leaks invisible. Use modern <code>measureUserAgentSpecificMemory()</code> for accuracy.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — snapshot without force GC</h3>
<p>"Memory grew" includes garbage. Force GC before each snapshot.</p>

<h3>Anti-pattern 2 — measuring leak in dev mode</h3>
<p>StrictMode double-mounts; HMR retains old modules. Profile production builds for accurate leak hunting.</p>

<h3>Anti-pattern 3 — comparing one snapshot</h3>
<p>One snapshot shows current state. Need at least two to detect growth.</p>

<h3>Anti-pattern 4 — focusing on wrong type</h3>
<p>Sort by Δ count or size. A 1KB object growing by 1000 = 1MB leak. Don't ignore "small" types.</p>

<h3>Anti-pattern 5 — fixing one retainer of many</h3>
<p>Multiple paths can hold an object. Cutting one isn't enough. Verify with another snapshot.</p>

<h3>Anti-pattern 6 — leaking via debugging</h3>
<p>Adding <code>window.foo = bigState</code> for "debugging". Forget to remove. window holds it forever.</p>

<h3>Anti-pattern 7 — no production memory tracking</h3>
<p>You don't know real memory usage. <code>performance.memory</code> + RUM = early warning.</p>

<h3>Anti-pattern 8 — assuming the framework is leaking</h3>
<p>React + popular libs are well-tested. Your usage of them is more likely buggy. Audit your useEffect cleanups.</p>

<h3>Anti-pattern 9 — ignoring detached DOM warnings</h3>
<p>"Detached HTMLDivElement: 47" is the most actionable signal. Don't gloss over it.</p>

<h3>Anti-pattern 10 — mass console.log retention</h3>
<p>Excessive logging in long sessions retains in DevTools. Hides leak signal. Strip in release; clear console between snapshots.</p>

<h3>Anti-pattern 11 — leak-fixing without verification</h3>
<p>"This looks like the cause." Verify with snapshot diff before claiming fixed.</p>

<h3>Anti-pattern 12 — relying on FinalizationRegistry</h3>
<p>Best-effort cleanup hooks. Non-deterministic. Don't rely for correctness.</p>

<h3>Anti-pattern 13 — long-lived listeners on global targets</h3>
<p><code>window.addEventListener('resize', ...)</code> in a component without cleanup. Massive accumulation across mounts.</p>

<h3>Anti-pattern 14 — running fuite without baseline</h3>
<p>Without comparison to a known-good run, fuite output is just numbers. Compare main vs PR branches.</p>

<h3>Anti-pattern 15 — tab restart as the fix</h3>
<p>"User reports memory issues; tell them to refresh." Real fix: identify + cut the leak. Restart hides the bug.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Walk me through finding a memory leak.</div>
  <div class="qa-answer">
    <ol>
      <li>Reproduce: identify a user action that triggers the leak.</li>
      <li>DevTools → Memory → force GC → snapshot S1.</li>
      <li>Reproduce action 5-10×.</li>
      <li>Force GC, snapshot S2.</li>
      <li>Comparison view; sort by Δ count or size.</li>
      <li>Filter "Detached" for DOM leaks.</li>
      <li>Inspect retainers — chain up to find the holder.</li>
      <li>Fix the source; verify with another snapshot.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Detached DOM — what is it?</div>
  <div class="qa-answer">
    <p>An HTML element removed from the document (parentNode.removeChild) but still referenced from JS — typically held in an array, Map, closure, or event listener. The browser can't reclaim it because it's still reachable. Common in caches, removed-but-tracked elements, undisposed components. Filter "Detached" in heap snapshot to find them.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What's shallow vs retained size?</div>
  <div class="qa-answer">
    <p><strong>Shallow size</strong>: bytes the object's own fields use.</p>
    <p><strong>Retained size</strong>: shallow + everything this object exclusively keeps alive.</p>
    <p>A 200-byte component holding a 40MB array has retained size 40MB. Cutting that one reference frees 40MB. Sort by retained to find leak anchors.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Why force GC before snapshotting?</div>
  <div class="qa-answer">
    <p>Without forcing GC, the heap contains garbage that hasn't been collected yet — would-be-freed objects look like growth. Force GC (trash icon) ensures the snapshot reflects only live, reachable objects. Critical for diff-based hunts.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Top 5 memory leak sources in a web app?</div>
  <div class="qa-answer">
    <ol>
      <li>Detached DOM held in JS arrays / Maps.</li>
      <li>Event listeners not removed.</li>
      <li>setInterval / setTimeout not cleared.</li>
      <li>Observers (Intersection / Resize / Mutation) not disconnected.</li>
      <li>Closures over large state.</li>
    </ol>
    <p>Plus: workers not terminated, pending promises, module-level caches.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. queryObjects — how does it help?</div>
  <div class="qa-answer">
<pre><code class="language-js">queryObjects(MyComponent)
// → array of all instances on the heap

// Useful for:
// - Confirming "I have 1 mounted, but 50 instances exist" (leak)
// - Finding undisposed objects of a specific class
// - After a fix: verify count matches expected</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. fuite / memlab — when do you use them?</div>
  <div class="qa-answer">
    <p>For automated, repeatable leak detection in CI. Run a scenario (open page, click X, navigate, repeat 10×) in headless Chrome; tools take snapshots, diff, report. Catches regressions before they ship. Run on PR or scheduled (nightly). Especially valuable for SPAs with long user sessions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Allocation timeline vs heap snapshot — when?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Heap snapshot</strong>: "what's alive right now?" Compare to find leaks.</li>
      <li><strong>Allocation timeline</strong>: "what's being allocated?" Tracks allocations over time, with stack traces. Best for finding hot allocation paths.</li>
    </ul>
    <p>Snapshot for leak detection; timeline for allocation profiling.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. <code>performance.memory</code> in production — useful?</div>
  <div class="qa-answer">
    <p>Limited but better than nothing. Chrome-only, quantized for security. Useful as a coarse signal: track <code>usedJSHeapSize</code> per route in RUM; alert on monotonic growth. For more accurate measurement, the newer <code>performance.measureUserAgentSpecificMemory()</code> (rate-limited but more precise). Both feed RUM dashboards for early warning.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. The retainer chain points to a Map. What now?</div>
  <div class="qa-answer">
    <ol>
      <li>The Map is holding the leaked object's keys / values.</li>
      <li>Walk up the chain to find what holds the Map — typically a class instance or window global.</li>
      <li>Identify what should remove entries: usually unsubscribe / cleanup.</li>
      <li>If keys are objects: convert Map → WeakMap. Auto-cleanup when key is GC'd.</li>
      <li>If size-bounded is the goal: convert to LRU.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you avoid leaks in React?</div>
  <div class="qa-answer">
    <ul>
      <li>Always return a cleanup from useEffect (unsubscribe listener, clearInterval, abort fetch, disconnect observer).</li>
      <li>AbortController for in-flight fetches; abort on unmount.</li>
      <li>Don't store large data in module scope without bounds.</li>
      <li>Use WeakMap for instance metadata.</li>
      <li>Don't put debug refs on window without removing.</li>
      <li>Watch for closure captures of big state — capture only what you need.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Memory grew but stable. Leak or bloat?</div>
  <div class="qa-answer">
    <p><strong>Bloat</strong>: high but stable. Cache filled, lazy modules loaded, render state warm. Different remediation (bound caches, lazy-load less).</p>
    <p><strong>Leak</strong>: monotonic growth across repeated identical actions, AND survives forced GC. Different remediation (find + cut retainer).</p>
    <p>Run snapshot after several action repetitions to distinguish.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Single Map vs WeakMap?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Map</strong>: keys held strongly. Entries persist until explicitly removed.</li>
      <li><strong>WeakMap</strong>: object keys held weakly. Entry auto-vanishes when key is GC'd elsewhere.</li>
    </ul>
    <p>Use WeakMap for metadata on objects you don't own (DOM nodes, instance metadata) — automatic cleanup. Caveats: keys must be objects; WeakMap not iterable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Browser extension keeps memory growing — your code or the extension?</div>
  <div class="qa-answer">
    <p>Test in Incognito (extensions disabled). If memory still grows: your code. If stable in Incognito: an extension (often analytics, ad blockers, password managers). Document this for users; not in your control.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Walk through fixing a leak from "user reports lag after 30 minutes."</div>
  <div class="qa-answer">
    <ol>
      <li>Confirm via memory measurement (RUM): is heap growing over the session?</li>
      <li>Reproduce locally with similar usage pattern.</li>
      <li>DevTools Memory → snapshot every 5 minutes during a 30-min session.</li>
      <li>Compare snapshots: which types grow?</li>
      <li>Inspect retainer paths to find the holder.</li>
      <li>Apply fix (cleanup, WeakMap, bounded cache).</li>
      <li>Re-test 30-min session; heap should plateau.</li>
      <li>Roll out + monitor RUM for the trend.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You force GC before snapshotting.</li>
    <li>You compare snapshots, not single ones.</li>
    <li>You distinguish shallow vs retained size.</li>
    <li>You filter "Detached" for DOM leaks.</li>
    <li>You trace retainer chains to find the holder.</li>
    <li>You use queryObjects to verify counts.</li>
    <li>You name 5+ canonical leak sources.</li>
    <li>You distinguish leak from bloat.</li>
    <li>You set up production memory tracking via RUM.</li>
    <li>You run automated leak detection (fuite / memlab) in CI.</li>
  </ul>
</div>
`}

]
});
