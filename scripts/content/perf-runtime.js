window.PREP_SITE.registerTopic({
  id: "perf-runtime",
  module: "Frontend Performance",
  title: "Runtime Performance",
  estimatedReadTime: "30 min",
  tags: ["performance","runtime","inp","long-tasks","main-thread","web-workers","scheduler","animations","scroll"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>Keep tasks small (&lt;50ms), animate on the compositor, batch DOM reads and writes, move heavy work off the main thread, and profile</strong> — every long task in the input-to-paint path inflates INP.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Runtime perf is what happens after load</strong> — interaction responsiveness, scroll, animation, sustained CPU. The dominant metric is <strong>INP</strong>, measured at p98 across the session.</li>
    <li><strong>Long tasks (&gt;50ms) are the enemy.</strong> At 60fps that's already ~3 dropped frames; a single 50ms task eats 25% of the 200ms INP budget. Keep every task under 50ms.</li>
    <li><strong>INP has three phases:</strong> input delay (main thread busy before the event), processing (your handler + setState + render), presentation (layout + paint). Diagnose which is slow, then fix that one.</li>
    <li><strong>Yield to the browser</strong> in long loops: <code>scheduler.yield()</code> (newest) with <code>setTimeout(0)</code> fallback — each yield lets the browser handle pending input, layout, and paint.</li>
    <li><strong>React's <code>startTransition</code> / <code>useDeferredValue</code></strong> mark heavy state updates low-priority so input and paint stay responsive while the render proceeds incrementally.</li>
    <li><strong>Web Workers</strong> run &gt;50ms CPU work off the main thread (JSON parse, crypto, fuzzy search, image processing); communicate via <code>postMessage</code>, use <code>Transferable</code> for big buffers, reuse a pool, and consider Comlink.</li>
    <li><strong>Compositor-only animation:</strong> <code>transform</code> / <code>opacity</code> / <code>filter</code> on a promoted layer skip layout + paint and run on the GPU — 60fps even when JS is busy; <code>width</code>/<code>height</code>/<code>top</code>/<code>left</code> force layout per frame.</li>
    <li><strong>Avoid layout thrashing:</strong> batch all reads, then all writes (ideally in <code>requestAnimationFrame</code>); interleaving them forces a synchronous layout each iteration.</li>
    <li><strong>Rate-limit high-frequency events:</strong> debounce (fire once after inactivity — search-as-you-type) vs throttle (at most once per interval — scroll/resize); prefer <code>IntersectionObserver</code> over scroll handlers, and set <code>{ passive: true }</code> on scroll/touch/wheel.</li>
    <li><strong>Virtualize long lists</strong> (react-window/virtuoso or <code>content-visibility: auto</code>) so only visible rows render; use <code>requestIdleCallback</code> for genuinely non-urgent work.</li>
    <li><strong>Profile, don't guess</strong> — DevTools Performance for long tasks, React Profiler for renders, a <code>longtask</code> observer + web-vitals <code>onINP</code> (with attribution) in production RUM.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Doing heavy work synchronously inside an event handler.</strong> Sorting/filtering a big array or parsing large JSON on <code>click</code>/<code>input</code> blocks the main thread for its whole duration — the interaction feels frozen and INP is exactly that duration. Fix: keep the urgent update (setState for the input value) immediate, then defer the expensive part with <code>startTransition</code>, yield with <code>scheduler.yield()</code>, or move it to a Worker. Related misconception: <code>requestAnimationFrame</code> is not a magic perf fix — its callback still runs on the main thread and counts toward the 16ms frame budget.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"INP is worst-case input-to-paint across the session, and every long task over 50ms in that path inflates it — so I break work into sub-50ms chunks and yield with scheduler.yield."</div>
  <div class="revision-say">"For a slow input I keep the value update urgent and wrap the heavy filter in startTransition or useDeferredValue; if the work itself is CPU-bound I move it to a Web Worker."</div>
  <div class="revision-say">"I animate transform and opacity on the compositor, batch reads then writes to avoid layout thrashing, virtualize long lists, and measure INP with web-vitals in RUM — not just Lighthouse."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The main thread budget</h3>
<p>Browser runs your JS, layout, paint, compositing on the main thread. Many tasks compete:</p>
<ul>
  <li>JS execution (your code, framework, libraries).</li>
  <li>Style + layout calculation.</li>
  <li>Paint of changed regions.</li>
  <li>Input event dispatch.</li>
  <li>requestAnimationFrame callbacks.</li>
  <li>Microtasks (Promise then, queueMicrotask).</li>
</ul>
<p>The browser tries to run at 60fps (16.7ms per frame) or 120fps (8.3ms). When a single JS task exceeds the budget, frames drop. INP rises.</p>

<h3>Why "long task" is 50ms</h3>
<p>The Long Task API (PerformanceObserver) reports any task over 50ms. That's deliberately generous — at 60fps, 50ms is already three dropped frames. INP threshold of 200ms means a single 50ms long task uses 25% of your budget. Multiple in the chain → INP fails.</p>

<h3>What contributes to INP</h3>
<div class="diagram">
<pre>
 User input arrives
   │
   ├── Input delay (main thread busy with prior work)
   │
   ├── Event handler runs (your onClick)
   │     │── handler logic
   │     └── setState → React render → commit
   │
   ├── Layout / paint of changed DOM
   │
   └── Frame paints (visible to user)

 INP = total of these phases for the worst interaction in the session.
</pre>
</div>

<h3>Why animations should be GPU-only</h3>
<p>Animating <code>top</code> / <code>left</code> / <code>width</code> / <code>height</code> triggers <strong>layout</strong> (recompute geometry) and <strong>paint</strong> (re-rasterize) on the main thread per frame. Animating <code>transform</code> and <code>opacity</code> on a promoted layer goes through <strong>compositing</strong> on the GPU only — main thread free. 60+fps even when JS is busy.</p>

<h3>Why Web Workers exist</h3>
<p>JS is single-threaded by default. A 500ms JSON parse blocks input, animation, and layout for 500ms. Web Workers run JS on a separate thread; you postMessage tasks and results between. The main thread stays free. Examples: cryptography, large data parsing, fuzzy search, image manipulation, syntax highlighting.</p>

<h3>Why scheduler.yield()</h3>
<p>The newest browser API for cooperative scheduling. Replaces hacks like <code>setTimeout(0)</code>:</p>
<pre><code class="language-js">async function processItems(items) {
  for (const item of items) {
    expensive(item);
    await scheduler.yield();   // give browser a chance to handle input
  }
}</code></pre>
<p>The browser handles pending input, layout, paint, then resumes you. Result: you can do heavy iteration without blocking input. Available in Chrome 129+; fallback is <code>setTimeout(0)</code>.</p>

<h3>Why React's <code>startTransition</code></h3>
<p>React 18 introduced concurrent rendering. Wrapping a state update in <code>startTransition</code> marks it as low-priority. React yields to the browser between fiber units, so input + paint stay responsive while the heavy render happens incrementally. INP wins for heavy state changes (filter, sort, navigate).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The "16.7ms frame" picture</h3>
<div class="diagram">
<pre>
 Frame budget: 16.67ms at 60fps (8.33ms at 120fps)
   │
   ├── Input event handlers
   ├── requestAnimationFrame callbacks
   ├── Style calc + layout
   ├── Paint
   ├── Composite (often GPU)
   └── Browser overhead

 Any single chunk &gt;16ms → frame dropped.
 Long task (&gt;50ms) → multiple frames dropped + INP regression.
</pre>
</div>

<h3>The "where does work run" picture</h3>
<table>
  <thead><tr><th>Type</th><th>Thread</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Your JS code</td><td>Main</td><td>Single-threaded by default</td></tr>
    <tr><td>Promise callbacks</td><td>Main (microtasks)</td><td>Run between tasks</td></tr>
    <tr><td>requestAnimationFrame</td><td>Main</td><td>Right before paint</td></tr>
    <tr><td>requestIdleCallback</td><td>Main</td><td>When browser is idle</td></tr>
    <tr><td>setTimeout / setInterval</td><td>Main (macrotask queue)</td><td>Each tick</td></tr>
    <tr><td>Web Worker code</td><td>Worker thread</td><td>Communicate via postMessage</td></tr>
    <tr><td>Service Worker code</td><td>SW thread</td><td>Network proxy / cache</td></tr>
    <tr><td>CSS animation (transform/opacity)</td><td>Compositor</td><td>GPU; main thread free</td></tr>
    <tr><td>Layout / paint</td><td>Main</td><td>Triggered by JS / scroll / resize</td></tr>
  </tbody>
</table>

<h3>The "compositor-only animation" rule</h3>
<pre><code>Cheap (compositor): transform, opacity, filter (on promoted layers)
Medium (paint):     color, background, border-color, box-shadow (sometimes)
Expensive (layout): width, height, top, left, padding, margin, font-size

If you animate it 60 times per second, make sure it's only triggering composite.</code></pre>

<h3>The "yield" picture</h3>
<div class="diagram">
<pre>
 BAD: 200ms work blocks input
 ┌──────────────────────────────────────┐
 │ work...                              │
 └──────────────────────────────────────┘
        ↑ no input handled, INP suffers

 GOOD: yields every ~5-10ms
 ┌─────┐input┌─────┐input┌─────┐...
 │work │handle│work│handle│work│
 └─────┘      └─────┘      └─────┘
   each chunk &lt;50ms; input stays responsive
</pre>
</div>

<h3>The "layout thrashing" picture</h3>
<pre><code class="language-js">// BAD — interleaved read/write forces layout each iteration
for (const el of items) {
  el.style.left = el.offsetLeft + 10 + 'px';   // read offsetLeft → forces layout
}                                               // write style → invalidates layout
                                                // next iteration's read → forces layout AGAIN

// GOOD — batch reads, then writes
const lefts = items.map(el =&gt; el.offsetLeft);   // single layout pass
items.forEach((el, i) =&gt; el.style.left = lefts[i] + 10 + 'px');</code></pre>

<h3>The "INP optimization checklist"</h3>
<ol>
  <li>Identify the slow interaction (DevTools Performance recording).</li>
  <li>Reduce input delay — what was the main thread doing before the event?</li>
  <li>Reduce processing — split long handlers, useTransition, move to worker.</li>
  <li>Reduce presentation delay — fewer DOM mutations, virtualize lists, animate on compositor.</li>
  <li>Re-measure.</li>
</ol>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"requestAnimationFrame is for performance." It's a frame-aligned scheduling primitive — the work inside still runs on the main thread and counts toward your 16ms budget. Use it for batched DOM updates, not as a magic perf fix.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>Detecting long tasks (production)</h3>
<pre><code class="language-js">new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    sendBeacon('/rum/longtask', JSON.stringify({
      duration: entry.duration,
      startTime: entry.startTime,
      url: location.pathname,
      attribution: entry.attribution,
    }));
  }
}).observe({ type: 'longtask', buffered: true });</code></pre>

<h3>INP measurement</h3>
<pre><code class="language-js">import { onINP } from 'web-vitals';
onINP((m) =&gt; {
  sendBeacon('/rum/inp', JSON.stringify({
    value: m.value,
    rating: m.rating,
    target: m.attribution?.eventTarget,
    type: m.attribution?.eventType,
  }));
});
// Attribution gives you which event + element was slow — actionable.</code></pre>

<h3>scheduler API (modern)</h3>
<pre><code class="language-js">// scheduler.postTask — explicit priority
scheduler.postTask(() =&gt; doWork(), { priority: 'background' });
// priorities: 'user-blocking', 'user-visible', 'background'

// scheduler.yield — let browser handle pending work
async function processBatch(items) {
  for (let i = 0; i &lt; items.length; i++) {
    process(items[i]);
    if (i % 100 === 0) await scheduler.yield();
  }
}</code></pre>

<h3>Fallback yielding pattern</h3>
<pre><code class="language-js">function yieldToMain() {
  return new Promise((resolve) =&gt; {
    if ('scheduler' in window &amp;&amp; 'yield' in scheduler) return scheduler.yield().then(resolve);
    setTimeout(resolve, 0);
  });
}

async function chunkWork(items) {
  for (let i = 0; i &lt; items.length; i++) {
    expensive(items[i]);
    if (i % 50 === 0) await yieldToMain();
  }
}</code></pre>

<h3>requestIdleCallback (rIC)</h3>
<pre><code class="language-js">requestIdleCallback((deadline) =&gt; {
  while (deadline.timeRemaining() &gt; 0 &amp;&amp; queue.length) {
    queue.pop()();   // process one item per call
  }
}, { timeout: 1000 });
// Browser calls back when idle. timeRemaining decreases; bail if low.
// Good for analytics, prefetch, non-urgent setup.</code></pre>

<h3>requestAnimationFrame (rAF)</h3>
<pre><code class="language-js">function animate() {
  el.style.transform = \`translateX(\${x}px)\`;
  x += 5;
  if (x &lt; 1000) requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// rAF fires right before paint — perfect for visual updates.
// Don't use for non-visual work; that's setTimeout / scheduler.</code></pre>

<h3>Web Worker basics</h3>
<pre><code class="language-js">// main.js
const worker = new Worker('/parse.worker.js');
worker.postMessage({ type: 'parse', json: hugeString });
worker.onmessage = (e) =&gt; setData(e.data);

// parse.worker.js
self.onmessage = (e) =&gt; {
  if (e.data.type === 'parse') {
    const result = JSON.parse(e.data.json);
    self.postMessage(result);
  }
};</code></pre>
<p>Workers can't access DOM but can do almost everything else. Inter-thread communication is structured-clone (deep copy) by default; <code>Transferable</code> objects (ArrayBuffer, MessagePort) move ownership instead of copying.</p>

<h3>Comlink — friendlier worker API</h3>
<pre><code class="language-js">// worker.js
import * as Comlink from 'comlink';
class API { async parse(json) { return JSON.parse(json); } }
Comlink.expose(new API());

// main.js
import * as Comlink from 'comlink';
const api = Comlink.wrap(new Worker('/worker.js', { type: 'module' }));
const data = await api.parse(hugeString);
// Looks like a regular async call; Comlink handles message passing.</code></pre>

<h3>React startTransition</h3>
<pre><code class="language-jsx">import { startTransition, useTransition, useDeferredValue } from 'react';

function Search() {
  const [input, setInput] = useState('');
  const [filtered, setFiltered] = useState(items);
  const [pending, startTransition] = useTransition();

  return (
    &lt;input
      value={input}
      onChange={(e) =&gt; {
        setInput(e.target.value);                 // urgent — input stays responsive
        startTransition(() =&gt; {
          setFiltered(items.filter(i =&gt; i.includes(e.target.value)));  // deferred
        });
      }}
    /&gt;
  );
}</code></pre>

<h3>useDeferredValue</h3>
<pre><code class="language-jsx">function Wrap({ query }) {
  const deferred = useDeferredValue(query);
  // 'deferred' lags behind 'query' during heavy renders
  return &lt;HeavyChild query={deferred} /&gt;;
}</code></pre>

<h3>Compositor-only CSS animation</h3>
<pre><code class="language-css">/* GOOD — composited */
.slide {
  transition: transform 0.3s ease;
  will-change: transform;
}
.slide.active { transform: translateX(100px); }

/* BAD — triggers layout per frame */
.slide-bad {
  transition: left 0.3s ease;
}
.slide-bad.active { left: 100px; }</code></pre>

<h3>Throttle and debounce</h3>
<pre><code class="language-js">// Debounce — fires once after period of inactivity
function debounce(fn, wait) {
  let timer;
  return (...args) =&gt; {
    clearTimeout(timer);
    timer = setTimeout(() =&gt; fn(...args), wait);
  };
}

// Throttle — fires at most once per interval
function throttle(fn, wait) {
  let last = 0;
  return (...args) =&gt; {
    const now = Date.now();
    if (now - last &gt; wait) { last = now; fn(...args); }
  };
}

// Use lodash or es-toolkit for production: import { throttle, debounce } from 'lodash-es';</code></pre>

<h3>Avoid layout thrashing</h3>
<pre><code class="language-js">// BAD
for (const el of els) {
  el.style.height = el.offsetHeight + 10 + 'px';
}

// GOOD — batch reads then writes
const heights = els.map(el =&gt; el.offsetHeight);
els.forEach((el, i) =&gt; { el.style.height = heights[i] + 10 + 'px'; });

// BETTER — defer to rAF
const heights = els.map(el =&gt; el.offsetHeight);
requestAnimationFrame(() =&gt; {
  els.forEach((el, i) =&gt; { el.style.height = heights[i] + 10 + 'px'; });
});</code></pre>

<h3>FastDOM-like batching</h3>
<pre><code class="language-js">// fastdom batches reads and writes into separate phases
import fastdom from 'fastdom';
fastdom.measure(() =&gt; { const h = el.offsetHeight; });
fastdom.mutate(() =&gt; { el.style.height = h + 10 + 'px'; });
// fastdom interleaves reads in measure phase, writes in mutate phase, no thrash</code></pre>

<h3>Virtualization (long lists)</h3>
<pre><code class="language-jsx">import { FixedSizeList } from 'react-window';
&lt;FixedSizeList height={600} itemCount={10000} itemSize={50}&gt;
  {({ index, style }) =&gt; &lt;Row style={style} item={data[index]} /&gt;}
&lt;/FixedSizeList&gt;
// Only ~12 rows mounted at once regardless of itemCount.</code></pre>

<h3>Passive event listeners</h3>
<pre><code class="language-js">window.addEventListener('scroll', onScroll, { passive: true });
// Promises not to call preventDefault → browser doesn't wait, scroll stays smooth.</code></pre>

<h3>IntersectionObserver instead of scroll handler</h3>
<pre><code class="language-js">// BAD — runs handler on every scroll event
window.addEventListener('scroll', () =&gt; {
  if (el.getBoundingClientRect().top &lt; 0) loadMore();
});

// GOOD — fires only when element crosses threshold
const obs = new IntersectionObserver(([entry]) =&gt; {
  if (entry.isIntersecting) loadMore();
});
obs.observe(sentinelEl);</code></pre>

<h3>Profile in DevTools</h3>
<pre><code>Chrome DevTools → Performance tab
1. Click record
2. Reproduce slow interaction
3. Stop
4. Analyze: Main thread track shows tasks; bars colored by type
   - Yellow / red borders = long task
5. Drill in: function names, call stacks, time per frame
6. Bottom-up view: which functions take the most aggregate time</code></pre>

<h3>React Profiler</h3>
<pre><code>React DevTools Profiler tab → Record → interact → Stop
- Flamegraph per commit
- "Why did this render?" per component
- Ranked: components by total time
- Find &gt;16ms commits and explain them</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — yielding to keep input responsive</h3>
<pre><code class="language-js">async function processBigArray(arr) {
  for (let i = 0; i &lt; arr.length; i++) {
    transform(arr[i]);
    if (i % 100 === 0) await yieldToMain();
  }
}
function yieldToMain() {
  return new Promise((r) =&gt; {
    if (window.scheduler?.yield) return scheduler.yield().then(r);
    setTimeout(r, 0);
  });
}</code></pre>

<h3>Example 2 — JSON parse in worker</h3>
<pre><code class="language-js">// main.js
const worker = new Worker(new URL('./parser.worker.js', import.meta.url), { type: 'module' });
worker.postMessage(hugeString);
worker.onmessage = (e) =&gt; setData(e.data);

// parser.worker.js
self.onmessage = (e) =&gt; self.postMessage(JSON.parse(e.data));
// 5MB JSON parse no longer blocks main thread.</code></pre>

<h3>Example 3 — startTransition with heavy filter</h3>
<pre><code class="language-jsx">function FilteredList({ items }) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState(items);
  const [pending, startTransition] = useTransition();
  return (
    &lt;&gt;
      &lt;input
        value={query}
        onChange={(e) =&gt; {
          setQuery(e.target.value);
          startTransition(() =&gt; setFiltered(items.filter((i) =&gt; i.includes(e.target.value))));
        }}
      /&gt;
      {pending &amp;&amp; &lt;Spinner /&gt;}
      &lt;FlashList data={filtered} /&gt;
    &lt;/&gt;
  );
}</code></pre>

<h3>Example 4 — debounced search</h3>
<pre><code class="language-jsx">import { useDebouncedCallback } from 'use-debounce';

function Search() {
  const [results, setResults] = useState([]);
  const search = useDebouncedCallback(async (q) =&gt; {
    const r = await api.search(q);
    setResults(r);
  }, 300);
  return &lt;input onChange={(e) =&gt; search(e.target.value)} /&gt;;
}</code></pre>

<h3>Example 5 — IntersectionObserver for infinite scroll</h3>
<pre><code class="language-jsx">function InfiniteFeed({ items, loadMore }) {
  const sentinelRef = useRef();
  useEffect(() =&gt; {
    const obs = new IntersectionObserver(([e]) =&gt; { if (e.isIntersecting) loadMore(); });
    obs.observe(sentinelRef.current);
    return () =&gt; obs.disconnect();
  }, [loadMore]);
  return (
    &lt;&gt;
      {items.map((it) =&gt; &lt;Card key={it.id} item={it} /&gt;)}
      &lt;div ref={sentinelRef} /&gt;
    &lt;/&gt;
  );
}</code></pre>

<h3>Example 6 — passive scroll listener</h3>
<pre><code class="language-js">window.addEventListener('scroll', onScroll, { passive: true });</code></pre>

<h3>Example 7 — compositor-only fade</h3>
<pre><code class="language-css">.fade {
  transition: opacity 0.3s ease;
  will-change: opacity;
}
.fade.hidden { opacity: 0; }
/* No layout, no paint — only composite. 60fps even when JS is busy. */</code></pre>

<h3>Example 8 — RAF-batched DOM updates</h3>
<pre><code class="language-js">let pending = false;
function scheduleUpdate() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() =&gt; {
    flushUpdates();
    pending = false;
  });
}
// Coalesce many state changes into a single visual update.</code></pre>

<h3>Example 9 — Comlink-wrapped worker</h3>
<pre><code class="language-js">// worker.ts
import * as Comlink from 'comlink';
const api = {
  async fuzzySearch(query: string, items: string[]) {
    // expensive search algorithm
    return items.filter(i =&gt; i.includes(query));
  },
};
Comlink.expose(api);

// main.ts
import * as Comlink from 'comlink';
const api = Comlink.wrap(new Worker('./worker.ts', { type: 'module' }));
const results = await api.fuzzySearch(q, items);</code></pre>

<h3>Example 10 — virtualized list with React Virtuoso</h3>
<pre><code class="language-jsx">import { Virtuoso } from 'react-virtuoso';
&lt;Virtuoso
  style={{ height: 600 }}
  data={items}
  itemContent={(i, item) =&gt; &lt;Row item={item} /&gt;}
/&gt;</code></pre>

<h3>Example 11 — long task observer + reporting</h3>
<pre><code class="language-js">new PerformanceObserver((list) =&gt; {
  list.getEntries().forEach((e) =&gt; {
    if (e.duration &gt; 100) console.warn('long task', e.duration, 'ms');
  });
}).observe({ type: 'longtask', buffered: true });</code></pre>

<h3>Example 12 — RAF time-based animation</h3>
<pre><code class="language-js">let start;
function animate(t) {
  if (!start) start = t;
  const elapsed = t - start;
  el.style.transform = \`translateX(\${Math.min(elapsed / 5, 200)}px)\`;
  if (elapsed &lt; 1000) requestAnimationFrame(animate);
}
requestAnimationFrame(animate);</code></pre>

<h3>Example 13 — fastdom-style measurement batching</h3>
<pre><code class="language-js">function batch(reads, writes) {
  const values = reads.map((fn) =&gt; fn());          // batch reads
  requestAnimationFrame(() =&gt; writes.forEach((fn, i) =&gt; fn(values[i])));
}</code></pre>

<h3>Example 14 — long-task profiler hook (React)</h3>
<pre><code class="language-jsx">import { Profiler } from 'react';
&lt;Profiler id="HomeFeed" onRender={(id, phase, dur) =&gt; {
  if (dur &gt; 16) sendBeacon('/rum/slow-render', JSON.stringify({ id, dur }));
}}&gt;
  &lt;HomeFeed /&gt;
&lt;/Profiler&gt;</code></pre>

<h3>Example 15 — input event handler optimization</h3>
<pre><code class="language-js">// BAD — heavy work synchronously
input.addEventListener('input', (e) =&gt; {
  setQ(e.target.value);
  expensiveSync(e.target.value);   // 200ms work blocks input
});

// GOOD — defer
input.addEventListener('input', (e) =&gt; {
  setQ(e.target.value);
  startTransition(() =&gt; {
    setResults(filter(items, e.target.value));
  });
});</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. requestAnimationFrame in background tab</h3>
<p>rAF fires only when the tab is visible. Backgrounded tabs get no calls — which is correct for visual work, but if you used rAF for non-visual scheduling, it pauses unexpectedly. Use scheduler.postTask or setTimeout for non-visual.</p>

<h3>2. requestIdleCallback's 50ms quota</h3>
<p>Browsers call rIC during idle gaps. <code>deadline.timeRemaining()</code> tells you how much time you have (max ~50ms). Don't blow past it; check on each iteration.</p>

<h3>3. Worker startup cost</h3>
<p>Spawning a worker takes a few ms (Chrome ~3-10ms). Don't spawn one per task; reuse a long-lived worker pool.</p>

<h3>4. Worker postMessage clone cost</h3>
<p>Default postMessage uses structured clone — deep copy of the payload. Sending a 10MB array spends time copying. Use <code>Transferable</code> (ArrayBuffer, MessagePort) to transfer ownership without copy.</p>

<h3>5. SharedArrayBuffer + Atomics</h3>
<p>True shared memory between threads, but requires cross-origin isolation headers (COOP / COEP). Powerful for high-throughput scenarios; setup overhead.</p>

<h3>6. setTimeout(0) clamping</h3>
<p>Browsers clamp setTimeout minimum delay to 4ms after deep nesting (5+ recursive setTimeouts). Don't rely on 0ms; use scheduler API for precise yielding.</p>

<h3>7. will-change overuse</h3>
<p><code>will-change</code> tells the browser to promote an element to its own layer. Each layer costs GPU memory. Wrapping every component in <code>will-change: transform</code> bloats memory. Apply just before animating; remove after.</p>

<h3>8. Forced synchronous layout</h3>
<p>Reading layout properties (<code>offsetHeight</code>, <code>getBoundingClientRect</code>, <code>scrollTop</code>, <code>getComputedStyle</code>) after a write forces synchronous layout flush. DevTools flags as purple "Forced reflow" warning.</p>

<h3>9. Repaints from complex CSS</h3>
<p>box-shadow, filter, large gradients can be expensive to paint per frame. Composite-only animations skip paint, but on first paint they still pay. Profile and simplify when needed.</p>

<h3>10. Long animation in background tab</h3>
<p>Animations using setTimeout / setInterval continue in background tabs (throttled to ~1Hz). RAF stops. CSS animations technically continue but invisible. Pause animations explicitly on visibilitychange.</p>

<h3>11. INP attribution missing</h3>
<p>The web-vitals library's INP attribution provides <code>eventTarget</code>, <code>eventType</code>, but only if available. For older browsers / unattributed events, you get the value but not the cause.</p>

<h3>12. Virtualization breaks scroll-to-anchor</h3>
<p>Browser's "scroll into view" assumes the anchor exists. With virtualization, off-screen items don't exist. Need custom logic: scroll the list to the right index, then wait for render.</p>

<h3>13. ResizeObserver feedback loops</h3>
<p>If your ResizeObserver callback resizes the observed element, you'll get a new event → infinite loop. Browsers detect and throw "ResizeObserver loop limit exceeded." Use defensive check or rAF batching.</p>

<h3>14. IntersectionObserver root must include element ancestry</h3>
<p>If <code>root: scrollableContainer</code>, the observed element must be inside that container's DOM. Common bug: passing the wrong root.</p>

<h3>15. Cross-origin isolation breaks ad scripts</h3>
<p>Enabling COOP/COEP for SharedArrayBuffer can break some third-party scripts (ads, embeds). Apply selectively per route.</p>

<h3>16. Performance.now() resolution clamped</h3>
<p>For Spectre mitigation, <code>performance.now()</code> is clamped to ~5μs. Tight microbenchmarks need different approach.</p>

<h3>17. PerformanceObserver buffer</h3>
<p>Passing <code>{ buffered: true }</code> gives you events that occurred BEFORE the observer attached — useful for late-loading scripts. Without it, you miss earlier long tasks.</p>

<h3>18. setTimeout drift</h3>
<p>setTimeout doesn't fire exactly on time — it queues a task that runs when the event loop gets to it. Heavy work delays it. Don't rely on precise timing.</p>

<h3>19. Worker debugging</h3>
<p>Chrome DevTools shows workers as separate threads. Set breakpoints in worker source. Console logs from workers appear in main thread console.</p>

<h3>20. memo + transitions</h3>
<p>React.memo bypasses startTransition's deferral if upstream re-renders. Memoization is component-level; transitions are scheduling-level. Combine carefully — memoize stable children, defer state updates that drive heavy children.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — synchronous heavy work in event handlers</h3>
<pre><code class="language-js">btn.onclick = () =&gt; { sortHugeArray(items); render(); };</code></pre>
<p>Click feels frozen for the duration. Defer with setTimeout / startTransition / worker.</p>

<h3>Anti-pattern 2 — animating layout properties</h3>
<p>top, left, width, height. Triggers layout per frame. Use transform / opacity.</p>

<h3>Anti-pattern 3 — missing passive on scroll handler</h3>
<p>Without <code>{ passive: true }</code>, browser waits to see if you preventDefault. Smooth scroll suffers. Default to passive.</p>

<h3>Anti-pattern 4 — querying layout in tight loops</h3>
<pre><code class="language-js">for (const el of els) console.log(el.offsetHeight);</code></pre>
<p>Each read forces layout if there's any pending change. Batch.</p>

<h3>Anti-pattern 5 — long synchronous work without yielding</h3>
<pre><code class="language-js">function process(items) { items.forEach(heavy); }</code></pre>
<p>Blocks input until done. Yield every 50-100ms.</p>

<h3>Anti-pattern 6 — over-using requestIdleCallback</h3>
<p>rIC is unreliable on busy pages — may never fire. Critical work needs explicit scheduling, not "when idle."</p>

<h3>Anti-pattern 7 — worker per request</h3>
<p>Spawning a new Worker for every parse / search burns startup time. Use a worker pool.</p>

<h3>Anti-pattern 8 — postMessage huge structured-clone payloads</h3>
<p>Cloning a 50MB ArrayBuffer takes hundreds of ms. Use <code>Transferable</code> to move ownership.</p>

<h3>Anti-pattern 9 — non-debounced scroll handlers</h3>
<p>Firing 100 events per second running expensive logic. Throttle (rAF) or use IntersectionObserver.</p>

<h3>Anti-pattern 10 — will-change everywhere</h3>
<p>Promotes too many layers; GPU memory bloats. Apply specifically where you'll animate; remove after.</p>

<h3>Anti-pattern 11 — useEffect doing render-blocking work</h3>
<p>useEffect runs after commit. Heavy work there delays paint and INP. Defer to idle or worker.</p>

<h3>Anti-pattern 12 — synchronous JSON.parse of huge payloads on response</h3>
<p>Server returns 10MB JSON; client parse blocks 800ms. Either stream-parse incrementally or move to worker.</p>

<h3>Anti-pattern 13 — animating in JS when CSS can</h3>
<pre><code class="language-js">function animate() {
  el.style.opacity = (Math.cos(now * 0.001) + 1) / 2;
  requestAnimationFrame(animate);
}</code></pre>
<p>JS-driven 60fps animation. CSS transition / animation runs on compositor; cheaper.</p>

<h3>Anti-pattern 14 — uncontrolled re-renders in React</h3>
<p>Parent re-renders → all children re-render → state updates cascade. Memoize, lift state correctly, useTransition.</p>

<h3>Anti-pattern 15 — no INP measurement in production</h3>
<p>Without RUM, slow interactions are invisible until users complain. Set up web-vitals + dashboards.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is INP and how do you optimize it?</div>
  <div class="qa-answer">
    <p>Interaction to Next Paint — worst-case latency from a user input to the next paint reflecting it, measured at p98 across the session. Target p75 &lt; 200ms. Optimization phases:</p>
    <ol>
      <li><strong>Input delay</strong>: main thread busy → reduce long tasks before the event.</li>
      <li><strong>Processing</strong>: handler logic + setState + render → split with startTransition, defer to idle, move to worker.</li>
      <li><strong>Presentation</strong>: DOM mutations + layout + paint → minimize, use compositor-only animations, virtualize lists.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What's a long task?</div>
  <div class="qa-answer">
    <p>A task that runs longer than 50ms on the main thread. The Long Task API reports them via PerformanceObserver. They block input, paint, animation. Goal: split work so no task exceeds 50ms (or even 16ms). Tools: <code>scheduler.yield()</code>, <code>setTimeout(0)</code>, <code>requestIdleCallback</code>, Web Workers.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you yield to the browser?</div>
  <div class="qa-answer">
<pre><code class="language-js">// Modern (Chrome 129+):
await scheduler.yield();

// Universal fallback:
await new Promise(r =&gt; setTimeout(r, 0));

// In a loop:
for (let i = 0; i &lt; items.length; i++) {
  process(items[i]);
  if (i % 100 === 0) await yieldToMain();
}</code></pre>
    <p>Each yield gives the browser a chance to handle pending input, layout, paint.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. When would you use a Web Worker?</div>
  <div class="qa-answer">
    <ul>
      <li>JSON parsing of large payloads (&gt;1MB).</li>
      <li>Cryptographic operations.</li>
      <li>Image / audio / video processing.</li>
      <li>Fuzzy search / ranking on large datasets.</li>
      <li>Syntax highlighting / language servers.</li>
      <li>Anything CPU-bound that takes &gt;50ms.</li>
    </ul>
    <p>Worker can't access DOM but has fetch, IndexedDB, OffscreenCanvas. Communicate via postMessage; use Transferable for big buffers; consider Comlink for friendlier API.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's the difference between debounce and throttle?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Debounce</strong>: fires once <em>after</em> a period of inactivity. "Wait until they stop typing." Use for search-as-you-type API calls.</li>
      <li><strong>Throttle</strong>: fires at most once per interval. "At most once every 100ms." Use for scroll / resize handlers running expensive logic.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Which CSS properties are cheap to animate?</div>
  <div class="qa-answer">
    <p><strong>transform</strong>, <strong>opacity</strong>, and <strong>filter</strong> on a promoted layer skip layout + paint, run on the GPU compositor. They can hit 120fps even when JS is busy. Other properties (width, height, top, color) trigger layout / paint, costly per frame.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you avoid layout thrashing?</div>
  <div class="qa-answer">
    <p>Layout thrashing = alternating reads (e.g., <code>offsetHeight</code>) and writes (style mutations) in a loop. Each write invalidates layout; each subsequent read forces synchronous recompute. Fix: batch all reads first, then batch all writes. Optionally inside <code>requestAnimationFrame</code>. Library: fastdom.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. requestIdleCallback vs requestAnimationFrame?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>rAF</strong>: fires right before the next paint. Use for visual updates that should be in sync with the frame.</li>
      <li><strong>rIC</strong>: fires when the browser is idle (no other work). Use for low-priority work like analytics, prefetching, non-urgent setup. Returns a deadline — don't blow past it.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How does React's startTransition help?</div>
  <div class="qa-answer">
    <p>It marks state updates as low-priority. React's concurrent renderer yields to the browser between fiber units, so input + paint stay responsive while the heavy render proceeds incrementally. INP improves dramatically for state changes that drive expensive renders (filter, sort, navigation).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you measure INP in production?</div>
  <div class="qa-answer">
<pre><code class="language-js">import { onINP } from 'web-vitals';
onINP((metric) =&gt; {
  sendBeacon('/rum/inp', JSON.stringify({
    value: metric.value,
    target: metric.attribution?.eventTarget,
    type: metric.attribution?.eventType,
    url: location.pathname,
  }));
}, { reportAllChanges: false });</code></pre>
    <p>The web-vitals library handles correct sampling. Attribution tells you which event + element was slow — actionable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What's <code>passive: true</code> on event listeners?</div>
  <div class="qa-answer">
    <p>Promises the browser that the listener will not call <code>preventDefault()</code>. The browser can then start scrolling immediately without waiting for JS to confirm. Without it, scroll on touch / wheel events feels sluggish on slow handlers. Default to <code>{ passive: true }</code> for scroll / wheel / touch unless you actually preventDefault.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you optimize a long list?</div>
  <div class="qa-answer">
    <ol>
      <li>Virtualize — react-window, react-virtuoso, or browser's CSS <code>content-visibility: auto</code>.</li>
      <li>Memoize row component.</li>
      <li>Stable keyExtractor.</li>
      <li>Defer filter / sort with startTransition.</li>
      <li>For derived data, useMemo upstream of the list.</li>
      <li>Throttle scroll handlers (rAF).</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's content-visibility?</div>
  <div class="qa-answer">
    <p>CSS property: <code>content-visibility: auto</code> tells the browser to skip layout + paint for elements outside the viewport. Browser-native virtualization for tall pages. Pair with <code>contain-intrinsic-size</code> to reserve placeholder space. Excellent for long articles, wikis, comment threads.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Walk me through optimizing a slow input.</div>
  <div class="qa-answer">
    <ol>
      <li>Open DevTools Performance, record while typing.</li>
      <li>Find the long task — what's happening on each keystroke?</li>
      <li>Common cause: synchronous filter / re-render of a big list.</li>
      <li>Wrap state update in <code>startTransition</code>; input becomes urgent, list update deferred.</li>
      <li>Add <code>useDeferredValue</code> for the query passed to heavy children.</li>
      <li>If filter is itself heavy: move to worker.</li>
      <li>Virtualize the list.</li>
      <li>Re-measure INP.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What's the relationship between INP and long tasks?</div>
  <div class="qa-answer">
    <p>Every long task on the input → paint critical path inflates INP. Long tasks before the event → input delay. Long tasks during handler → processing delay. Long tasks after handler before paint → presentation delay. Eliminating long tasks (or staying under 50ms each) is the most direct path to good INP.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You name INP, long tasks, and the 50ms threshold.</li>
    <li>You yield with scheduler.yield (or setTimeout 0 fallback) in long loops.</li>
    <li>You use Web Workers for &gt;50ms CPU work.</li>
    <li>You wrap heavy state updates in <code>startTransition</code>.</li>
    <li>You animate with transform/opacity (compositor-only).</li>
    <li>You batch DOM reads and writes — no layout thrash.</li>
    <li>You use IntersectionObserver instead of scroll handlers.</li>
    <li>You set <code>passive: true</code> on scroll / touch / wheel.</li>
    <li>You virtualize long lists.</li>
    <li>You measure INP with web-vitals + RUM, not just Lighthouse.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. What is the frame budget, and what has to fit inside it?</div>
  <div class="qa-answer">
    <p>At 60fps the browser has about <strong>16.7ms per frame</strong> (8.3ms at 120fps). Into that budget go input event handlers, <code>requestAnimationFrame</code> callbacks, style calc and layout, paint, composite (often on the GPU), and browser overhead. Any single chunk of work over about 16ms drops a frame; a long task over 50ms drops several frames and pushes INP up. <code>requestAnimationFrame</code> is not a perf fix by itself: work inside it still runs on the main thread and counts against the same budget.</p>
  </div>
</div>
` },

  ]
});
