window.PREP_SITE.registerTopic({
  id: 'js-memory-gc',
  module: 'JavaScript Deep',
  title: 'Memory & Garbage Collection',
  estimatedReadTime: '28 min',
  tags: ['memory', 'gc', 'garbage-collection', 'heap', 'stack', 'leak', 'weakmap', 'weakref', 'performance', 'fundamentals'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>JavaScript is a <strong>memory-managed</strong> language. You don't <code>malloc</code>/<code>free</code>; the engine's garbage collector (GC) does it for you. The algorithm is conceptually simple: trace from a set of <strong>roots</strong> (the global object, the current call stack, and a few internal slots); every object reachable from those roots is <em>live</em>; everything else is <em>garbage</em> and may be reclaimed.</p>
<ul>
  <li><strong>Primitives</strong> (number, string, boolean, bigint, symbol, null, undefined) are typically stack-resident (or interned); they have value semantics.</li>
  <li><strong>Objects</strong> (including arrays, functions, maps, closures) live in the heap; you hold <em>references</em>.</li>
  <li>Modern engines use <strong>generational, tracing GC</strong>: most objects die young (in a small "nursery" / young generation); survivors are promoted to the old generation, which is collected less frequently.</li>
  <li>You can't force GC from user code (browsers intentionally don't expose it). You can only stop holding references.</li>
  <li><strong>Memory leaks</strong> in JS are references you forgot about: closures over big state, detached DOM nodes still in arrays, timers that keep running, event listeners never removed.</li>
  <li><code>WeakMap</code>, <code>WeakSet</code>, <code>WeakRef</code>, <code>FinalizationRegistry</code> let you reference objects without pinning them — useful for caches and observers.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>The GC doesn't collect objects you're "done with" — it collects objects <em>unreachable from any root</em>. If you still hold a path to an object, it's live, no matter how little you care about it. Leaks = forgotten references.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Stack vs Heap</h3>
<p>JavaScript runtimes divide working memory into two regions:</p>
<ul>
  <li><strong>Stack</strong> — a LIFO region holding the call stack frames. Each frame has local primitives, parameters, and <em>pointers</em> to heap objects. Primitives can live directly on the stack; they're fixed-size and vanish when the frame pops.</li>
  <li><strong>Heap</strong> — a large, dynamically managed region for objects whose size isn't known at compile time or whose lifetime exceeds the enclosing call frame. Arrays, objects, functions, closures, strings (often), typed arrays — all heap.</li>
</ul>
<p>Strings are a useful edge case: short strings are often interned in a shared table; long strings live on the heap; some engines use rope structures to make concatenation cheap.</p>

<h3>What is a "reference," really?</h3>
<p>When you write <code>const u = { name: 'Ada' };</code>, the engine allocates a heap object and the variable <code>u</code> holds a <em>pointer</em> into the heap. Assignments copy the pointer, not the object. That's why:</p>
<pre><code class="language-js">const a = { n: 1 };
const b = a;
b.n = 99;
console.log(a.n); // 99 — same object</code></pre>

<h3>What makes something "reachable"?</h3>
<p>Reachability is a graph problem. The GC maintains a conceptual set of <strong>roots</strong> and calls anything reachable from a root <strong>live</strong>:</p>
<ul>
  <li>The <strong>global object</strong> (<code>window</code> / <code>globalThis</code>).</li>
  <li>The <strong>current call stack</strong> — every local in every frame.</li>
  <li><strong>Closures</strong> over live functions — their captured variables.</li>
  <li><strong>DOM</strong> tree (in browsers) — nodes attached to the document tree.</li>
  <li><strong>Host timers / event handlers</strong> — while the timer or listener is registered, it's pinned.</li>
  <li><strong>Internal engine slots</strong> — e.g., a promise's reactions are pinned while pending.</li>
</ul>
<p>Anything NOT reachable from those roots is unreachable — and therefore garbage, even if it still has references to other objects.</p>

<h3>Why generational GC?</h3>
<p>Empirically, most objects die young. A function allocates a temporary array, uses it, returns. A render produces some strings, paints, discards them. By dividing the heap into a <em>young generation</em> (fast allocation, frequent collection) and an <em>old generation</em> (objects that survived several young-gen collections), engines keep pause times small for the 99% case. V8, JavaScriptCore, and SpiderMonkey all follow this model, with variations.</p>

<h3>Why mark-and-sweep beats reference counting</h3>
<p>Naive reference counting (a counter per object, incremented on each new reference, decremented on each release; free when it hits zero) has a fatal flaw: <strong>cycles</strong>. Two objects referencing each other keep their counts at 1+, even if nothing else points to them. Tracing GC (mark reachable, sweep everything else) handles cycles naturally because it starts from roots, not from counts.</p>

<h3>Why you can't force GC</h3>
<ul>
  <li><strong>Security:</strong> forcing GC can be used in timing attacks to probe heap layout.</li>
  <li><strong>Determinism:</strong> JS semantics intentionally don't specify WHEN finalization happens — code that relies on it breaks across engines / versions.</li>
  <li><strong>Performance:</strong> application-level GC triggering is almost always worse than the engine's heuristics.</li>
</ul>
<p>Node exposes <code>--expose-gc</code> flag + <code>global.gc()</code> for testing only. Chrome DevTools has a "Collect Garbage" button, also for debugging.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "root set → reachable graph" picture</h3>
<div class="diagram">
<pre>
 Roots:  [window]  [call stack frames]  [microtask queue]  [DOM tree root]
            │             │                     │                 │
            ▼             ▼                     ▼                 ▼
       ┌────────────────────────────────────────────────────────┐
       │                     LIVE OBJECTS                       │
       │   ┌──────┐    ┌──────┐    ┌──────┐                     │
       │   │  A   │──►│  B   │──►│  C   │                       │
       │   └──────┘    └──────┘    └──────┘                     │
       │       │                         ▲                      │
       │       ▼                         │                      │
       │   ┌──────┐                 ┌──────┐                    │
       │   │  D   │                 │  E   │ (cycle with C)     │
       │   └──────┘                 └──────┘                    │
       └────────────────────────────────────────────────────────┘
                          ╳  unreachable island  ╳
                    ┌──────┐    ┌──────┐
                    │  X   │──►│  Y   │   ← GC will reclaim
                    └──────┘◄──┘ (cycle — tracing GC handles it)
</pre>
</div>

<h3>The "generations" picture</h3>
<div class="diagram">
<pre>
   allocate new                   survive 1-2 scavenges
 ┌──────────────┐                 ┌──────────────────┐
 │    Eden     │──────promote───►│  Old generation   │
 │ (from-space)│                 │ (mark-sweep-compact)
 └──────┬──────┘                 └──────────────────┘
        │                                │
    scavenge (fast, frequent)       major GC (slower, infrequent)
</pre>
</div>
<p>V8 calls young gen the "new space" (cheney scavenger, two half-spaces, copying collection), and old gen the "old space" (mark-sweep-compact, incremental marking to keep pauses short).</p>

<h3>The "references are a graph, not a tree" picture</h3>
<p>Two forgotten references to the same object keep it alive together. Removing one doesn't free the object; you must remove all of them. Leaks usually happen because people remember one obvious reference and forget the subtle one (a closure captured it, an array still holds it, an event listener's closure captured it).</p>

<h3>The "closure captures by reference" picture</h3>
<pre><code class="language-js">function makeCounter() {
  const big = new Array(1e7).fill(0); // 40 MB
  return () =&gt; big.length;
}
const c = makeCounter();
// 'big' lives AS LONG AS c is reachable, because c closes over it.
// Even if you only use c.length, the engine must keep the whole array.</code></pre>
<p>This is a real bug pattern — closures inadvertently pin huge captured state. Fix: scope things tightly, or return only what you need.</p>

<div class="callout warn">
  <div class="callout-title">Not all closures are equal</div>
  <p>V8 tries to only capture variables a closure actually uses (called "context-sensitive escape analysis" in some engines). But it's a heuristic; complex code can surprise you. When in doubt, pass a minimal value instead of closing over the source.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>How V8's GC actually works (high-level)</h3>
<ul>
  <li><strong>Orinoco</strong> is the name of V8's mostly-parallel, incremental, concurrent GC.</li>
  <li><strong>Young generation</strong>: Cheney-style <em>scavenger</em>. Two half-spaces (from-space and to-space). Allocation bumps a pointer in from-space. When it fills, live objects are copied to to-space; roles swap. Typically very fast (&lt;1ms).</li>
  <li><strong>Old generation</strong>: mark-sweep-compact. Phases:
    <ol>
      <li><strong>Mark</strong> — trace from roots, color each reachable object (tri-color: white / gray / black).</li>
      <li><strong>Sweep</strong> — walk the heap, reclaim every unmarked (white) object.</li>
      <li><strong>Compact</strong> (sometimes) — relocate survivors to reduce fragmentation.</li>
    </ol>
  </li>
  <li><strong>Incremental marking</strong> — mark work is split into small slices interleaved with main-thread work. Write barriers track pointer changes so nothing is missed.</li>
  <li><strong>Concurrent marking</strong> — marking runs on a background thread. Only stop-the-world pauses for short "finalization" phases.</li>
  <li><strong>Lazy sweeping</strong> — pages are swept on-demand when allocation needs space.</li>
</ul>

<h3>What counts as a root in a browser</h3>
<ul>
  <li><code>globalThis</code> / <code>window</code> and all its properties.</li>
  <li>Every frame of the current call stack (locals, parameters, temporaries).</li>
  <li>The microtask queue and task queues (pending callbacks pin their closures).</li>
  <li>Active timers and intervals (callback closures are pinned until cleared or fired-once).</li>
  <li>Registered event listeners (the target pins the listener closure, which pins everything closure captures).</li>
  <li>Promise reactions (a pending promise's then-reactions are pinned).</li>
  <li>IntersectionObserver / ResizeObserver / MutationObserver observers and their callbacks.</li>
  <li>The DOM tree from <code>document</code> (every attached node — detached subtrees rooted nowhere can be collected).</li>
  <li>Running Web Workers, their postMessage backlog, Shared Array Buffers.</li>
</ul>

<h3>Weak references — the escape hatch</h3>
<table>
  <thead><tr><th>Structure</th><th>Key/Value holds strong ref?</th><th>Iterable?</th><th>Typical use</th></tr></thead>
  <tbody>
    <tr><td><code>Map</code></td><td>Yes (both)</td><td>Yes</td><td>General map with any keys.</td></tr>
    <tr><td><code>Set</code></td><td>Yes</td><td>Yes</td><td>General set.</td></tr>
    <tr><td><code>WeakMap</code></td><td>Key is weak; value is strong</td><td>No</td><td>Side-tables keyed by object, auto-cleanup.</td></tr>
    <tr><td><code>WeakSet</code></td><td>Weak</td><td>No</td><td>Tracking "has this object been seen."</td></tr>
    <tr><td><code>WeakRef</code></td><td>Weak</td><td>N/A</td><td>Cache slot that can be collected.</td></tr>
    <tr><td><code>FinalizationRegistry</code></td><td>Weak</td><td>N/A</td><td>Run cleanup code when an object is collected (non-deterministic timing).</td></tr>
  </tbody>
</table>

<h3>How WeakMap actually works</h3>
<pre><code class="language-js">const privateData = new WeakMap();
class User {
  constructor(name) { privateData.set(this, { secret: name }); }
  getSecret() { return privateData.get(this).secret; }
}</code></pre>
<p>When a <code>User</code> instance has no other references, both the instance AND the WeakMap entry are collected together. No leak, no cleanup code. Use-cases: (1) attach metadata to DOM nodes without pinning them; (2) implement private data without <code># syntax</code>; (3) build caches where keys are objects.</p>

<h3>WeakRef — manual weak reference</h3>
<pre><code class="language-js">const ref = new WeakRef(someBigObject);
// ...later...
const obj = ref.deref(); // object OR undefined if collected
if (obj) obj.doStuff();</code></pre>
<p>Unlike WeakMap, WeakRef is a box you read manually. The object can vanish between reads, so you check each time.</p>

<h3>FinalizationRegistry — run cleanup on collection</h3>
<pre><code class="language-js">const registry = new FinalizationRegistry(heldValue =&gt; {
  console.log('collected:', heldValue);
});
registry.register(someObject, 'some-label');</code></pre>
<p><strong>Use with extreme care.</strong> Timing is non-deterministic (may never fire if the process exits first). Never rely on finalization for correctness — only for opportunistic cleanup of native resources.</p>

<h3>Memory snapshot (Chrome DevTools)</h3>
<p>Memory tab → "Take heap snapshot." Every heap object is categorized. Key views:</p>
<ul>
  <li><strong>Summary</strong> — constructors grouped by count, shallow size, retained size. Retained = size this object + everything it keeps alive.</li>
  <li><strong>Comparison</strong> — diff two snapshots to see what's grown (classic leak hunt: take snapshot, interact, take again, compare).</li>
  <li><strong>Containment</strong> — tree view starting from GC roots; find who's holding an object.</li>
  <li><strong>Detached DOM</strong> — filter for "Detached" to find nodes removed from the tree but still held in JS.</li>
</ul>

<h3>How objects grow — inline caches & hidden classes</h3>
<p>V8 assigns objects a "hidden class" (structure) based on their shape. Adding a property transitions the object to a new class. Consistent object shapes → fast property access via inline caches. Tips:</p>
<ul>
  <li>Initialize all properties in the constructor in the same order.</li>
  <li>Avoid adding properties to an object after it's "in use."</li>
  <li>Avoid <code>delete obj.prop</code> (invalidates shape). Set to <code>null</code> or <code>undefined</code> instead.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — reachability basics</h3>
<pre><code class="language-js">let a = { n: 1 };
let b = a;         // same object, two refs
a = null;          // one ref gone; object still reachable via b
b = null;          // last ref gone; object is now garbage</code></pre>

<h3>Example 2 — cycle but unreachable</h3>
<pre><code class="language-js">function makePair() {
  const x = {}, y = {};
  x.friend = y; y.friend = x;
  return null; // neither x nor y escapes; cycle is garbage
}
makePair();
// Both collected on next GC. Mark-and-sweep handles cycles naturally.</code></pre>

<h3>Example 3 — forgotten setInterval leak</h3>
<pre><code class="language-js">// BAD
function startPolling(state) {
  setInterval(() =&gt; poll(state), 1000);
  // No handle saved, no clearInterval. The closure keeps 'state' alive forever.
}
// GOOD
function startPolling(state) {
  const id = setInterval(() =&gt; poll(state), 1000);
  return () =&gt; clearInterval(id);
}</code></pre>

<h3>Example 4 — detached DOM leak</h3>
<pre><code class="language-js">// BAD
const nodes = [];
function cacheNode(el) { nodes.push(el); }
// Even after these elements are removed from the document, the 'nodes' array
// keeps the DOM subtrees alive — visible in DevTools as "Detached DOM tree."</code></pre>

<h3>Example 5 — event listener leak</h3>
<pre><code class="language-js">// BAD
class Widget {
  constructor(el, bigData) {
    this.data = bigData;
    el.addEventListener('click', () =&gt; this.handleClick());
    // Listener's closure captures 'this' → pins 'data'. Never removed → leak.
  }
}
// GOOD
class Widget {
  constructor(el, bigData) {
    this.data = bigData;
    this.el = el;
    this.onClick = () =&gt; this.handleClick();
    el.addEventListener('click', this.onClick);
  }
  destroy() { this.el.removeEventListener('click', this.onClick); }
}</code></pre>

<h3>Example 6 — closure over unnecessary state</h3>
<pre><code class="language-js">function buildView() {
  const hugeArray = new Array(1e7).fill(Math.random());
  const len = hugeArray.length;
  return function showLength() { return len; };
  // Good: len (a number) is captured; hugeArray is not referenced after this.
  // The returned function retains a reference only to what it actually uses,
  // so (in most engines) hugeArray is collected.
}</code></pre>

<h3>Example 7 — WeakMap private data</h3>
<pre><code class="language-js">const _state = new WeakMap();
class Timer {
  constructor() { _state.set(this, { ticks: 0 }); }
  tick() { _state.get(this).ticks++; }
}
// When a Timer instance is no longer reachable, the WeakMap entry is auto-cleared.</code></pre>

<h3>Example 8 — WeakMap as DOM metadata store</h3>
<pre><code class="language-js">const metadata = new WeakMap();
function tag(el, info) { metadata.set(el, info); }
function lookup(el) { return metadata.get(el); }
// When 'el' is removed from the DOM AND no JS holds it, metadata auto-removes too.</code></pre>

<h3>Example 9 — WeakRef-backed cache</h3>
<pre><code class="language-js">class Cache {
  constructor() { this.refs = new Map(); }
  set(key, obj) { this.refs.set(key, new WeakRef(obj)); }
  get(key) {
    const ref = this.refs.get(key);
    const obj = ref && ref.deref();
    if (!obj) this.refs.delete(key);
    return obj;
  }
}
// The cache never pins its values. Great for large, re-creatable objects.</code></pre>

<h3>Example 10 — FinalizationRegistry for native handle</h3>
<pre><code class="language-js">const openHandles = new FinalizationRegistry(handle =&gt; {
  nativeLib.close(handle); // best-effort cleanup of native resource
});
class FileHandle {
  constructor(path) {
    this.h = nativeLib.open(path);
    openHandles.register(this, this.h);
  }
}
// Still prefer explicit .close() via Symbol.dispose (stage-3) or try/finally.</code></pre>

<h3>Example 11 — measure heap usage (Node)</h3>
<pre><code class="language-js">const usage = process.memoryUsage();
// {
//   rss: 40599552,          // total RSS (resident set size)
//   heapTotal: 18358272,    // V8 heap allocated
//   heapUsed: 11912096,     // V8 heap used
//   external: 2156534,      // C++ objects bound to JS objects
//   arrayBuffers: 9378
// }</code></pre>

<h3>Example 12 — force GC for tests (Node --expose-gc)</h3>
<pre><code class="language-js">// node --expose-gc script.js
if (typeof global.gc === 'function') global.gc();
// Otherwise: 'gc is not defined'. Do not rely on this in production.</code></pre>

<h3>Example 13 — reproducing a leak with snapshots</h3>
<pre><code class="language-js">// 1. Open DevTools → Memory tab
// 2. Take heap snapshot — call it "baseline"
// 3. Interact with the app in a way you suspect leaks
// 4. Click trash icon (force GC) to drop transient allocations
// 5. Take second snapshot — "after"
// 6. Choose Comparison view; sort by #Delta.
// Any constructor with growing #Delta is a candidate leak.</code></pre>

<h3>Example 14 — typed arrays for binary data</h3>
<pre><code class="language-js">const buf = new ArrayBuffer(1024 * 1024); // 1 MB fixed
const view = new Uint8Array(buf);
// buf is a single contiguous heap block; view is a window into it.
// Much cheaper than an Array of numbers (which are each boxed doubles).</code></pre>

<h3>Example 15 — closing a huge resource explicitly</h3>
<pre><code class="language-js">class Canvas2D {
  constructor(w, h) { this.ctx = document.createElement('canvas').getContext('2d'); }
  destroy() { this.ctx = null; /* allow canvas to be GC'd */ }
}
const c = new Canvas2D(8192, 8192);
c.destroy(); // critical for big backbuffers — don't wait for GC</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Closure captures more than you think</h3>
<p>V8 typically captures only used variables in a closure. But in some older engines and in certain patterns (e.g., <code>eval</code> inside the closure, function declarations that reference each other), the entire enclosing environment can be pinned. When in doubt, destructure what you need.</p>
<pre><code class="language-js">// Subtle: inner closes over entire scope because of eval
function wrap(big) {
  const small = big[0];
  return function () { eval('0'); return small; }; // big possibly retained
}</code></pre>

<h3>2. Strings are usually on the heap, not inline</h3>
<pre><code class="language-js">function leak() {
  const s = someHugeString.slice(0, 10); // sometimes still references the full string!
}</code></pre>
<p>In V8, short slices of big strings may share backing storage (a "sliced string"). Copy them with <code>('' + s)</code> or <code>s.slice()</code> forced if needed, though modern V8 generally handles this well.</p>

<h3>3. Detached DOM trees are a classic browser leak</h3>
<pre><code class="language-js">function badCache() {
  const cache = [];
  return el =&gt; { cache.push(el); /* never clears */ };
}</code></pre>
<p>Even if the element is <code>remove()</code>d from the DOM, the cache array pins it. In DevTools memory snapshot, filter for "Detached HTMLDivElement."</p>

<h3>4. Listener pins the target (and vice versa)</h3>
<p>In browsers, a registered event listener creates a reference from the event target to the listener function. The listener's closure captures whatever it captures. Removing the listener (or removing the element from the DOM AND dropping all JS references) is required.</p>

<h3>5. IntersectionObserver / ResizeObserver hold their targets</h3>
<pre><code class="language-js">const obs = new IntersectionObserver(entries =&gt; { ... });
obs.observe(el);
// Until obs.unobserve(el) or obs.disconnect(), 'el' is pinned by the observer.</code></pre>

<h3>6. Timers pin their closures</h3>
<pre><code class="language-js">setTimeout(() =&gt; useBigThing(), 600_000); // 10 min
// The closure and its captured state are pinned for 10 minutes.
// Use clearTimeout(id) if the operation becomes unnecessary.</code></pre>

<h3>7. WeakMap key must be an object</h3>
<pre><code class="language-js">const w = new WeakMap();
w.set('key', 1); // TypeError — primitives disallowed (for now; stage-3 proposal changes this)</code></pre>

<h3>8. WeakRef's deref may return undefined at any point</h3>
<pre><code class="language-js">const ref = new WeakRef(obj);
let o = ref.deref();
// Between these two lines, GC might run and invalidate it.
// Always re-check. Never cache deref() result across async boundaries.</code></pre>

<h3>9. FinalizationRegistry callback is not guaranteed</h3>
<p>The callback may NOT fire: before the program exits, during force-unload, during detached iframe teardown, or if the engine simply decides not to. Never put critical logic there.</p>

<h3>10. Cyclic references between JS and DOM (pre-IE9 pain, now fixed)</h3>
<p>Old IE used separate GCs for JS and COM/DOM, so cycles across the boundary leaked forever. Modern engines unified this — but legacy advice to "null out DOM references before leaving a page" comes from that era.</p>

<h3>11. Large-closure copy from <code>arguments</code></h3>
<pre><code class="language-js">function f() {
  const args = arguments; // arguments object pins all passed values
  setTimeout(() =&gt; console.log(args[0]), 1000);
}
// Even if you only use args[0], the entire arguments object is pinned.
// Prefer rest params: function f(...args) {...}</code></pre>

<h3>12. Array elements aren't collected individually</h3>
<pre><code class="language-js">const buf = new Array(1000);
buf[500] = someBigObject;
// To release just that element:
buf[500] = null;
// NOT: delete buf[500] — creates a sparse array, penalty on future access.</code></pre>

<h3>13. <code>Map</code> and <code>Set</code> iteration order is insertion order</h3>
<p>Not a memory pitfall per se, but relevant: don't use <code>Map</code> as a weak dictionary — it pins keys. Use <code>WeakMap</code> if the keys are objects.</p>

<h3>14. Promise chain pins everything until settlement</h3>
<pre><code class="language-js">const p = new Promise(() =&gt; {}); // never settles
const big = new Array(1e7);
p.then(() =&gt; console.log(big.length));
// 'big' is pinned forever — the .then reaction captures it and the promise never resolves.</code></pre>

<h3>15. Async iterators / generators can pin their scope</h3>
<pre><code class="language-js">async function* stream() {
  const big = new Array(1e7);
  for await (const chunk of readChunks()) yield process(chunk, big);
}
const it = stream();
// 'big' is pinned for the lifetime of the iterator — even between yields.
// Release the iterator when done: if (it.return) await it.return();</code></pre>

<h3>16. Arrays backed by typed arrays and SharedArrayBuffer</h3>
<p>Typed arrays can be very large and live in a separate allocation. SharedArrayBuffer is shared with Workers — freeing requires all references (main and worker) to drop. Missing that shared reference is a subtle cross-thread leak.</p>

<h3>17. Chrome's "Retained Size" in snapshots is the important metric</h3>
<p>An object's <em>shallow size</em> is its own bytes. Its <em>retained size</em> is shallow + everything it exclusively keeps alive. A 200-byte object with 40MB retained is a serious leak anchor — that's the pointer you need to remove.</p>

<h3>18. <code>Object.freeze</code>/<code>seal</code> don't help with memory</h3>
<p>They affect mutability, not reachability. A frozen object that's still referenced is still alive.</p>

<h3>19. Memory bloat vs leak</h3>
<ul>
  <li><strong>Leak</strong>: memory grows monotonically over time, never recovered even after GC.</li>
  <li><strong>Bloat</strong>: memory is higher than necessary but stable — e.g., caching more than you need.</li>
</ul>
<p>Different remedies: a leak is a bug (find the retainer and remove it); bloat is a design question (shrink cache, share structures).</p>

<h3>20. Workers have their own heap</h3>
<p>Web Workers / worker_threads run in separate JS realms with separate heaps. Moving heavy allocations into a worker can isolate GC pauses from the main thread.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — global caches that never evict</h3>
<pre><code class="language-js">// BAD
const userCache = new Map();
function getUser(id) {
  if (!userCache.has(id)) userCache.set(id, fetchUser(id));
  return userCache.get(id);
}
// userCache only grows. Add LRU or WeakRef-based eviction, or cap size.</code></pre>

<h3>Anti-pattern 2 — never removing event listeners in SPA routes</h3>
<pre><code class="language-js">// BAD
function onMount() {
  window.addEventListener('resize', handler);
  // ... no cleanup on unmount
}
// GOOD (React)
useEffect(() =&gt; {
  window.addEventListener('resize', handler);
  return () =&gt; window.removeEventListener('resize', handler);
}, []);</code></pre>

<h3>Anti-pattern 3 — setInterval without clear</h3>
<pre><code class="language-js">// BAD
setInterval(pollServer, 1000);
// The callback closure is pinned forever. If 'pollServer' captures a large
// component instance, you've leaked that instance + everything it referenced.</code></pre>

<h3>Anti-pattern 4 — storing state in module scope</h3>
<pre><code class="language-js">// BAD — accumulates forever
const logs = [];
export function log(msg) { logs.push(msg); }</code></pre>
<p>Module-level arrays are never collected while the module is loaded. Cap them, rotate, or send to a server.</p>

<h3>Anti-pattern 5 — detached DOM trees in React via stale refs</h3>
<pre><code class="language-js">// BAD
function Comp() {
  const ref = useRef();
  useEffect(() =&gt; {
    window.savedRef = ref.current; // leaks the DOM node globally
  }, []);
  return &lt;div ref={ref}/&gt;;
}</code></pre>

<h3>Anti-pattern 6 — long-lived closures capturing state</h3>
<pre><code class="language-js">// BAD
function withCache(fn) {
  const cache = {};
  return (x) =&gt; {
    if (!(x in cache)) cache[x] = fn(x); // cache grows forever
    return cache[x];
  };
}
// Use Map with size limit, or WeakMap keyed by object arguments.</code></pre>

<h3>Anti-pattern 7 — cross-referencing between view and model without cleanup</h3>
<pre><code class="language-js">// BAD
class Model { }
class View {
  constructor(model) {
    this.model = model;
    model.view = this; // cycle
  }
}
// Cycle is GC-collectable IF nothing external holds either. But if either is
// referenced elsewhere, the other is pinned too. Prefer one-way references,
// or WeakRef for "observer" links.</code></pre>

<h3>Anti-pattern 8 — storing React state in window</h3>
<p>Debugging shortcut people leave in: <code>window.appState = state</code>. Now every snapshot of state is retained for the tab's lifetime. Remove before merge.</p>

<h3>Anti-pattern 9 — keeping Response/Blob references unnecessarily</h3>
<pre><code class="language-js">// BAD
const responses = [];
responses.push(await fetch(url)); // Response / Blob can be large; leaks if accumulated
// Extract what you need, then drop the Response.
const data = await (await fetch(url)).json();</code></pre>

<h3>Anti-pattern 10 — using delete on hot objects</h3>
<pre><code class="language-js">// BAD
delete obj.x; // invalidates hidden class, slows all future access</code></pre>
<p>Set to <code>null</code> or <code>undefined</code> if you need to clear a slot.</p>

<h3>Anti-pattern 11 — over-reliance on FinalizationRegistry</h3>
<pre><code class="language-js">// BAD
new FinalizationRegistry(closeFile).register(fileHandle, handle);
// Never guaranteed to run. If you must close, use Symbol.dispose + using keyword (stage-3)
// or explicit .close() in try/finally.</code></pre>

<h3>Anti-pattern 12 — infinite promise without resolution</h3>
<pre><code class="language-js">// BAD — deliberately "pending forever" promise as a sentinel
const forever = new Promise(() =&gt; {});
forever.then(() =&gt; { /* never */ }); // closure pinned for eternity</code></pre>

<h3>Anti-pattern 13 — unbounded observer subscriptions</h3>
<pre><code class="language-js">// BAD
bus.on('event', handler);
// No removeListener on dispose; every component that subscribes forever adds one.
// GOOD
const off = bus.on('event', handler);
// ...
off();</code></pre>

<h3>Anti-pattern 14 — logging large objects every tick</h3>
<pre><code class="language-js">// BAD
setInterval(() =&gt; console.log(state), 100);
// DevTools console retains logged object references to allow expansion later.
// During long sessions this dominates memory. Log strings or shallow copies.</code></pre>

<h3>Anti-pattern 15 — React: creating objects in render that get captured by effects</h3>
<pre><code class="language-js">// BAD
function Comp({ id }) {
  const opts = { id, filters: { /* ... */ } };
  useEffect(() =&gt; subscribe(opts), [opts]); // opts is new every render → re-subscribes
}</code></pre>
<p>Leaks aren't always about bytes — they're also about lifecycle. Stable references prevent leak-shaped behavior like repeated subscriptions never cleaned up.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How does JavaScript garbage collection work?</div>
  <div class="qa-answer">
    <p>Modern engines (V8, JavaScriptCore, SpiderMonkey) use <strong>generational, tracing GC</strong>. The heap is split into a young generation (small, collected frequently with a copying Cheney scavenger) and an old generation (collected less often with mark-sweep-compact). The GC starts from a set of roots — the global object, the call stack, pending microtasks, the DOM root, active timers and listeners — and marks everything reachable. Unmarked objects are swept; surviving young objects are promoted to old after one or two collections. Marking is incremental and concurrent so main-thread pauses stay small.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is reference counting and why doesn't JS use it alone?</div>
  <div class="qa-answer">
    <p>Reference counting keeps a counter per object, incremented when a new reference is made and decremented on release. Free at zero. Problem: <strong>cycles</strong> — two objects referencing each other keep counts at 1, so neither can ever be freed. Mark-and-sweep traces from roots and ignores the counts, so it handles cycles correctly. Some systems combine RC + cycle collector (e.g., Python, CPython), but JS engines chose tracing GC end-to-end.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What's the difference between stack and heap memory in JS?</div>
  <div class="qa-answer">
    <p><strong>Stack</strong> holds call frames with primitive locals, parameters, and pointers. Fixed-size per frame, fast, LIFO, automatically freed when the function returns. <strong>Heap</strong> holds objects (arrays, functions, closures, maps). Variable size, accessed by reference, freed by GC when unreachable. Primitives can live on the stack; objects always live on the heap (engines may optimize small objects into stack via escape analysis, but that's invisible).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Give me 5 common JS memory leak patterns.</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Unremoved event listeners</strong> — component subscribes to a global target, never unsubscribes on unmount.</li>
      <li><strong>setInterval/setTimeout without clear</strong> — closure keeps captured state alive.</li>
      <li><strong>Detached DOM trees held in arrays</strong> — element removed from DOM but cached in JS.</li>
      <li><strong>Closures over large state</strong> — inner function retains the whole outer scope.</li>
      <li><strong>Global caches / module-scope arrays</strong> — grow monotonically because nothing evicts.</li>
    </ol>
    <p>Bonus: observers (Intersection, Mutation, Resize) that never disconnect; long-pending promises; bus subscriptions; window globals set for debugging.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you find a memory leak in a browser app?</div>
  <div class="qa-answer">
    <ol>
      <li>Open Chrome DevTools → Memory tab.</li>
      <li>Take a heap snapshot before the suspected leak action. Click the trash can to force GC first.</li>
      <li>Perform the suspected leak-inducing action 5-10 times (mount/unmount a component, open/close a modal, navigate a route).</li>
      <li>Take another snapshot; choose the "Comparison" view between baseline and now.</li>
      <li>Sort by <strong>Delta</strong>; look at constructors with growing counts. Expand to see retainers — the path from the root that's holding them.</li>
      <li>Fix the retainer (remove listener, clear timer, drop cache entry). Re-measure.</li>
    </ol>
    <p>Adjacent: <strong>Allocation instrumentation on timeline</strong> for seeing allocation hotspots; <strong>Performance</strong> tab's memory track to correlate with user events.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What's a WeakMap and when would you use one?</div>
  <div class="qa-answer">
    <p>A <code>WeakMap</code> is a key-value store where keys are objects and are held <em>weakly</em> — they don't prevent GC. When a key becomes unreachable elsewhere, the WeakMap entry vanishes automatically. Use it for: (1) attaching metadata to objects you don't own (DOM nodes, third-party instances) without pinning them; (2) private data for a class without the <code>#</code> syntax; (3) caches keyed by object identity where you want auto-cleanup. Downsides: not iterable (no <code>.keys()</code>/<code>.values()</code>), cannot use primitive keys.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What happens in this code, memory-wise?</div>
<pre><code class="language-js">function outer() {
  const big = new Array(1e7).fill(0);
  return function () { return big.length; };
}
const f = outer();</code></pre>
  <div class="qa-answer">
    <p>The inner function closes over <code>big</code>. While <code>f</code> is reachable, <code>big</code> is alive — tens of megabytes of it. To release it, drop <code>f</code> (<code>f = null</code>). In some engines, V8's escape analysis may optimize to capture only <code>big.length</code> as a primitive, letting the array be collected. <em>Don't rely on that</em>; hand the number out explicitly if memory matters: <code>const n = big.length; return () =&gt; n;</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why can't you force a garbage collection from user code?</div>
  <div class="qa-answer">
    <p>Three reasons: (1) <strong>security</strong> — triggering GC deterministically is used in timing side-channel attacks to probe heap layout; (2) <strong>determinism</strong> — exposing <code>gc()</code> would encourage code that depends on when GC runs, which varies across engines and versions and breaks portability; (3) <strong>performance</strong> — application-level heuristics for GC triggering are almost always worse than the engine's, so exposing it would make applications slower on average. Test tools do expose it: Node's <code>--expose-gc</code> flag, Chrome DevTools' trash-can button.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Explain generational GC. Why is it faster?</div>
  <div class="qa-answer">
    <p>Generational GC exploits the "infant mortality" observation: most objects die young. A short-lived temporary (a loop variable, a function's local array) becomes garbage quickly. So the GC separates the heap into a <strong>young generation</strong> (a small area) and an <strong>old generation</strong>. Young-gen collection runs frequently but only scans that small area; objects that survive a few rounds are promoted to old-gen, which is collected much less often with a more thorough (but slower) algorithm. Result: the common case (young garbage) pays only the cheap young-gen cost; the expensive old-gen collection runs rarely.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. When should you use WeakRef?</div>
  <div class="qa-answer">
    <p>Rarely. <code>WeakRef</code> is a manual weak reference — you get a box whose <code>.deref()</code> returns either the object (if still alive) or <code>undefined</code>. Valid use cases: (1) caches where values are re-creatable and you don't want to pin them; (2) implementing "weak listeners" that don't keep a component alive. Avoid for normal application code — the TC39 proposal explicitly warns that most uses should prefer WeakMap. Timing of collection is non-deterministic; code that "assumes" when things are cleared will break.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Detect this leak</div>
<pre><code class="language-js">class Modal {
  constructor() {
    document.body.addEventListener('keydown', e =&gt; this.onKey(e));
  }
  onKey(e) { if (e.key === 'Escape') this.close(); }
  close() { this.el.remove(); }
}</code></pre>
  <div class="qa-answer">
    <p>The <code>keydown</code> listener is added to <code>document.body</code> but never removed. Every time a Modal is instantiated, a new listener attaches, pinning the Modal instance (via <code>this</code> in the arrow) forever — even after <code>close()</code>. Fix: store the bound handler, <code>addEventListener</code> in a lifecycle-open method, <code>removeEventListener</code> in <code>close</code>.</p>
<pre><code class="language-js">constructor() {
  this._onKey = e =&gt; this.onKey(e);
  document.body.addEventListener('keydown', this._onKey);
}
close() {
  document.body.removeEventListener('keydown', this._onKey);
  this.el.remove();
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Is <code>setTimeout(fn, 0)</code> free memory-wise?</div>
  <div class="qa-answer">
    <p>No. It pins <code>fn</code> and its closure until the callback fires. If <code>fn</code> captures large state, that state is alive for at least one macrotask. Worse, never-clearing timers (<code>setInterval</code> is the classic) pin forever. Always pair <code>setTimeout</code>/<code>setInterval</code> with a handle you can clear.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's the difference between a memory leak and memory bloat?</div>
  <div class="qa-answer">
    <p><strong>Leak</strong>: memory grows monotonically over time — something is retained that shouldn't be, forever. Symptoms: app gets slower and slower, eventually crashes or is killed by the OS.</p>
    <p><strong>Bloat</strong>: memory is higher than necessary but stable — caches, pre-allocated buffers, over-eager prefetching. Symptoms: high baseline RSS, but no trending up over time.</p>
    <p>Different remedies: a leak is a bug (find and cut the retainer); bloat is a design decision (shrink caches, share structures, lazy-load).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Tell me everything you know about V8's hidden classes.</div>
  <div class="qa-answer">
    <p>V8 assigns each object a hidden class (a "Map" in V8 terminology) describing its layout. When you add a property, the object transitions to a new hidden class. Objects with the same shape share a hidden class, enabling fast property access via inline caches (ICs). To keep objects monomorphic: (1) initialize all properties in the constructor in the same order; (2) avoid adding fields later; (3) avoid <code>delete</code> — it degrades the object to a dictionary mode; (4) use consistent types for each field. For memory: monomorphic shapes share the hidden class, saving bytes per instance vs. dictionary mode.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Why does <code>delete obj.x</code> hurt performance and what should you do instead?</div>
  <div class="qa-answer">
    <p><code>delete</code> removes the property slot from the object's shape, invalidating inline caches. The object typically transitions to "dictionary mode" (hash map) — all future accesses go through a slower path. Cascading effect: any function that operates on that object becomes polymorphic/megamorphic. Fix: set the property to <code>null</code> or <code>undefined</code> to "clear" without deleting. Only use <code>delete</code> when the property actually shouldn't be present (e.g., serializing, <code>in</code> semantics matter).</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You talk about <em>reachability</em> rather than "objects I'm done with."</li>
    <li>You know GC is generational + tracing; can name mark-sweep and scavenge.</li>
    <li>You list the root set correctly (globals, stack, timers, listeners, DOM).</li>
    <li>You describe how to take and compare heap snapshots.</li>
    <li>You reach for <code>WeakMap</code> / <code>WeakRef</code> when appropriate and explain why.</li>
    <li>You identify the 5 classic leak patterns and how to prevent them.</li>
    <li>You warn against relying on <code>FinalizationRegistry</code> for correctness.</li>
  </ul>
</div>
`}

]
});
