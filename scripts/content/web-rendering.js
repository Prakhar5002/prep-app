window.PREP_SITE.registerTopic({
  id: 'web-rendering',
  module: 'web',
  title: 'Rendering Pipeline',
  estimatedReadTime: '40 min',
  tags: ['rendering', 'pipeline', 'reflow', 'repaint', 'composite', 'parser', 'critical-rendering-path', 'browser'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>The <strong>browser rendering pipeline</strong> turns HTML/CSS/JS into pixels in 5 phases: <strong>Parse → Style → Layout → Paint → Composite</strong>. Knowing exactly what triggers what is the foundation of frontend performance: animation that runs on the compositor stays smooth even when JS is busy; layout property changes cause re-flow that ripples up the tree; paint changes redraw bitmaps. This topic is the rendering equivalent of "OS internals for engineers."</p>
<ul>
  <li><strong>Parse:</strong> HTML → DOM. CSS → CSSOM. The two combine into the render tree.</li>
  <li><strong>Style:</strong> compute the cascade for each element; produces ComputedStyle.</li>
  <li><strong>Layout (reflow):</strong> compute geometry — position and size of every box.</li>
  <li><strong>Paint:</strong> rasterize layers — compute the pixel color for each fragment.</li>
  <li><strong>Composite:</strong> assemble layers into the final frame; handed to the GPU.</li>
  <li><strong>The compositor thread</strong> handles the final composite step — independent of the main thread. Animations of <code>transform</code>/<code>opacity</code> can skip layout AND paint.</li>
  <li><strong>Reflow is expensive</strong>; it cascades through descendants. Avoid layout-thrashing patterns (read → write → read in a loop).</li>
  <li><strong>Render-blocking resources:</strong> CSS (always); sync scripts (parse + render). The Critical Rendering Path is what runs before First Contentful Paint.</li>
</ul>
<p><strong>Mantra:</strong> "Parse, Style, Layout, Paint, Composite. Animate transform/opacity to skip layout and paint. Avoid layout thrashing. Defer non-critical resources."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "rendering pipeline" means</h3>
<p>The browser is a complex system that turns markup into pixels. The pipeline is a sequence of phases — each phase produces an artifact that the next phase consumes. Understanding the pipeline tells you which operations are cheap, which are expensive, and what triggers re-doing work you thought was done.</p>

<h3>The 5 phases</h3>
<table>
  <thead><tr><th>Phase</th><th>Input</th><th>Output</th><th>Triggered by</th></tr></thead>
  <tbody>
    <tr><td>Parse</td><td>HTML, CSS bytes</td><td>DOM, CSSOM</td><td>Document load, JS DOM mutations, dynamic CSS</td></tr>
    <tr><td>Style</td><td>DOM + CSSOM</td><td>ComputedStyle per element</td><td>Style mutations (class change, inline style, CSS rule add)</td></tr>
    <tr><td>Layout (reflow)</td><td>Computed style</td><td>Box tree (position, size)</td><td>Geometry-affecting style changes; window resize; DOM tree changes</td></tr>
    <tr><td>Paint</td><td>Layout boxes</td><td>Layer bitmaps (display lists)</td><td>Paint-affecting style changes (color, background)</td></tr>
    <tr><td>Composite</td><td>Layers</td><td>Final frame</td><td>Compositor-only changes (transform, opacity)</td></tr>
  </tbody>
</table>

<h3>The three threads (simplified Chromium model)</h3>
<table>
  <thead><tr><th>Thread</th><th>Runs</th></tr></thead>
  <tbody>
    <tr><td>Main</td><td>JS, DOM, parsing, styling, layout, paint (record)</td></tr>
    <tr><td>Compositor</td><td>Layer assembly; runs even when main is busy</td></tr>
    <tr><td>GPU</td><td>Actual rasterization (where supported)</td></tr>
  </tbody>
</table>
<p>Animations whose work happens entirely on the compositor (transform, opacity, will-change'd elements) keep going even if the main thread is hung.</p>

<h3>Critical Rendering Path (CRP)</h3>
<p>The minimum work the browser must do to display the first pixel of meaningful content. Reducing CRP work shortens First Contentful Paint (FCP).</p>
<pre><code class="language-text">HTML byte stream → parse → DOM
                             │
CSS byte stream → parse → CSSOM
                             │
                             ▼
                       Render tree (DOM ∩ CSSOM, only visible elements)
                             ↓
                       Layout (geometry)
                             ↓
                       Paint
                             ↓
                       Composite
                             ↓
                       Pixels on screen
</code></pre>
<p>Both DOM and CSSOM must be ready before render tree → layout → paint can start. CSS is "render-blocking" in this sense.</p>

<h3>Why interviewers ask</h3>
<ol>
  <li>Foundational understanding. Senior frontend engineers diagnose perf bugs from first principles.</li>
  <li>Animation knowledge depends on this — what triggers what.</li>
  <li>Diagnosing jank in DevTools requires reading the timeline, which is structured around these phases.</li>
  <li>Architectural decisions (CSS-in-JS vs static CSS, virtual DOM diffing) all interact with the pipeline.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You can name the 5 phases and which thread runs each.</li>
  <li>You map a CSS property to which phase(s) it triggers (csstriggers.com fluency).</li>
  <li>You diagnose janky animation by reading the Performance panel.</li>
  <li>You avoid layout-thrashing in JS (batched read/write).</li>
  <li>You treat <code>transform</code> + <code>opacity</code> as the "fast lane" for animations.</li>
  <li>You know what's render-blocking vs deferrable.</li>
  <li>You understand layer promotion and its cost.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Phase 1 — Parse</h3>
<pre><code class="language-text">Bytes → Characters → Tokens → Nodes → DOM tree

The HTML parser is streaming: it builds the DOM as bytes arrive.
But sync &lt;script&gt; can pause the parser (because document.write).
CSS bytes are parsed in parallel into the CSSOM.
</code></pre>

<h3>The "preload scanner"</h3>
<p>Modern browsers run a secondary scanner that peeks ahead in the HTML stream looking for resources to start fetching even while the main parser is blocked. This is why placing your scripts/styles/images correctly in the <code>&lt;head&gt;</code> matters — the preload scanner finds them earlier.</p>

<h3>Phase 2 — Style</h3>
<p>For each DOM node, the browser computes its ComputedStyle by:</p>
<ol>
  <li>Matching CSS rules (selectors).</li>
  <li>Resolving the cascade (specificity, source order, !important).</li>
  <li>Inheriting from parent.</li>
  <li>Resolving CSS custom properties (variables).</li>
  <li>Resolving relative units (em, %, vw).</li>
</ol>
<p>This is fast for most pages; slow for pages with thousands of selectors or deeply nested style overrides.</p>

<h3>Phase 3 — Layout (Reflow)</h3>
<p>Given styled elements, compute the box tree: where each element is and how big. Layout is recursive — a parent's size depends on children; a child's size may depend on the parent (% sizing). Layout is in geometric units (CSS pixels).</p>

<p>Layout cascades. Changing one element's geometry can force re-layout of:</p>
<ul>
  <li>Its ancestors (if their size depends on children).</li>
  <li>Its descendants (if their size depends on it).</li>
  <li>Following siblings (in normal flow).</li>
</ul>

<h3>Phase 4 — Paint</h3>
<p>For each box, generate paint instructions: "draw a rectangle at (x, y, w, h) filled with color". Painted into <strong>layers</strong> — typically the whole document is one layer, but specific elements promote to their own (transformed, position: fixed, will-change, video, canvas, etc.).</p>

<h3>Phase 5 — Composite</h3>
<p>Layers are combined into the final image. The compositor thread handles this. Layers can be transformed and opacity-adjusted at this stage without re-painting — that's why animating <code>transform</code> and <code>opacity</code> stays at 60fps.</p>

<h3>The "what triggers what" map</h3>
<table>
  <thead><tr><th>Property changed</th><th>Layout?</th><th>Paint?</th><th>Composite?</th></tr></thead>
  <tbody>
    <tr><td>width, height, top, left, margin, padding, border, font-size</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>color, background, box-shadow, outline, visibility</td><td>—</td><td>✓</td><td>✓</td></tr>
    <tr><td>transform, opacity</td><td>—</td><td>—</td><td>✓</td></tr>
    <tr><td>filter (most)</td><td>—</td><td>—</td><td>✓</td></tr>
  </tbody>
</table>

<h3>Layer promotion triggers</h3>
<ul>
  <li><code>position: fixed</code></li>
  <li><code>transform</code> non-default</li>
  <li><code>will-change: transform</code> or <code>opacity</code></li>
  <li><code>video</code>, <code>canvas</code>, plugin elements</li>
  <li>3D-transformed elements</li>
  <li>Elements that overlap a layer that's already promoted</li>
  <li><code>backdrop-filter</code></li>
</ul>

<h3>Render-blocking</h3>
<table>
  <thead><tr><th>Resource</th><th>Blocks render?</th></tr></thead>
  <tbody>
    <tr><td>External CSS in <code>&lt;head&gt;</code></td><td>YES — blocks until loaded + parsed</td></tr>
    <tr><td>Sync external script</td><td>YES — blocks parse AND render</td></tr>
    <tr><td>Defer / async script</td><td>NO</td></tr>
    <tr><td>Module script (default)</td><td>NO (deferred)</td></tr>
    <tr><td>Inline CSS</td><td>NO (parses inline)</td></tr>
    <tr><td>Inline script (no src)</td><td>YES — blocks parse</td></tr>
    <tr><td>Image / font</td><td>NO (rendered when ready, may shift)</td></tr>
  </tbody>
</table>

<h3>Layout thrashing</h3>
<pre><code class="language-js">// BAD — alternates reads (force layout) and writes (invalidate layout)
items.forEach((item) =&gt; {
  const w = item.offsetWidth;        // forces layout
  item.style.width = w * 2 + 'px';   // invalidates layout
});
// Each iteration triggers a full layout. n items = O(n) layouts.

// GOOD — batch reads, then batch writes
const widths = items.map(i =&gt; i.offsetWidth);   // one layout
items.forEach((item, i) =&gt; {
  item.style.width = widths[i] * 2 + 'px';      // no layout (just style invalidation)
});
// Browser does one layout at the end.
</code></pre>

<h3>Forced synchronous layout</h3>
<p>Some properties force the browser to flush pending style changes and re-layout immediately to give you an accurate value:</p>
<ul>
  <li><code>offsetWidth, offsetHeight, offsetTop, offsetLeft</code></li>
  <li><code>clientWidth, clientHeight</code></li>
  <li><code>scrollWidth, scrollHeight, scrollTop, scrollLeft</code></li>
  <li><code>getBoundingClientRect()</code></li>
  <li><code>getComputedStyle()</code> (some properties)</li>
  <li><code>focus()</code> (in some browsers)</li>
</ul>
<p>Reading these AFTER a write forces a synchronous layout. This is the source of "layout thrashing."</p>

<h3>The 16ms budget at 60fps</h3>
<pre><code class="language-text">16.67ms per frame:
  - JS execution (event handlers, rAF, microtasks)
  - Style recalc
  - Layout
  - Paint
  - Composite

If any phase exceeds budget for the current frame: dropped frame.
If JS is the offender: input lag, jank.
If layout is the offender: structural change is too big.
If paint is the offender: heavy element with shadows / filters.
If composite is the offender: too many layers.
</code></pre>

<h3>The "60fps animation" rule</h3>
<p>Stay within compositor thread:</p>
<ul>
  <li>Animate <code>transform</code> or <code>opacity</code>.</li>
  <li>Promote element to its own layer (<code>will-change: transform</code> or implicit via transform).</li>
  <li>Avoid synchronous JS work during the animation.</li>
</ul>

<h3>The "renders are cheap, layouts are not" mental model</h3>
<p>React's virtual DOM diffing minimizes DOM operations, but the cost of a DOM operation isn't constant. Setting <code>style.color</code> = paint. Setting <code>style.width</code> = layout. The browser reflow cost dominates; React's reconciliation cost is usually small.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Inspecting the pipeline in DevTools</h3>
<ol>
  <li>Open Chrome DevTools → Performance panel.</li>
  <li>Click record; perform the action; stop.</li>
  <li>Look at the "Frames" track. Each frame should be ≤ 16ms.</li>
  <li>Within each frame, see Style, Layout, Paint, Composite blocks.</li>
  <li>Long Style or Layout = work to optimize.</li>
</ol>

<h3>Layer visualization</h3>
<p>DevTools → ⋮ → More Tools → Layers. Shows current layers; helpful for diagnosing too many layers / unexpected promotions.</p>

<h3>Force layout via JS</h3>
<pre><code class="language-js">// Reading these forces synchronous layout
const w = el.offsetWidth;
const r = el.getBoundingClientRect();
const ch = el.scrollHeight;

// Helps when you NEED a fresh measurement, e.g., before FLIP
</code></pre>

<h3>Avoiding layout thrashing — the "read all, then write all" pattern</h3>
<pre><code class="language-js">// BAD
function alignToWidest() {
  buttons.forEach(b =&gt; {
    const w = b.offsetWidth;       // force layout
    b.style.width = w + 'px';      // invalidate
  });
}

// GOOD
function alignToWidest() {
  // Read phase
  const widths = buttons.map(b =&gt; b.offsetWidth);
  const maxW = Math.max(...widths);
  // Write phase
  buttons.forEach(b =&gt; { b.style.width = maxW + 'px'; });
}
</code></pre>

<h3>requestAnimationFrame batches</h3>
<pre><code class="language-js">// rAF callbacks fire just before the next frame's paint
requestAnimationFrame(() =&gt; {
  // Style writes here are batched into one layout/paint
  el.style.transform = 'translateX(100px)';
});
</code></pre>

<h3>Layer promotion — <code>will-change</code></h3>
<pre><code class="language-css">/* Promote in advance of an animation; remove after */
.card.about-to-animate {
  will-change: transform;
}
</code></pre>

<h3>Containment — <code>contain</code></h3>
<pre><code class="language-css">/* "Layout / paint / size are contained inside this element" */
.card {
  contain: layout style;   /* layout changes inside don't trigger ancestor reflow */
}

.feed-item {
  contain: content;        /* layout + paint + style + size */
}
</code></pre>
<p><code>contain</code> is the modern way to tell the browser "you don't need to reflow anything outside me." Especially powerful for long lists where you scroll into / out of items.</p>

<h3><code>content-visibility: auto</code></h3>
<pre><code class="language-css">.feed-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px;  /* placeholder size when off-screen */
}
</code></pre>
<p>Browsers can skip rendering off-screen elements entirely. Massive speedup for long lists.</p>

<h3>CSS containment levels</h3>
<table>
  <thead><tr><th>Value</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td>layout</td><td>Element's internal layout doesn't affect ancestors</td></tr>
    <tr><td>paint</td><td>Children can't paint outside element's bounds</td></tr>
    <tr><td>size</td><td>Element's size is independent of children's size</td></tr>
    <tr><td>style</td><td>Styles defined inside don't escape</td></tr>
    <tr><td>strict</td><td>layout + paint + size + style</td></tr>
    <tr><td>content</td><td>layout + paint + style</td></tr>
  </tbody>
</table>

<h3>Promote to layer manually</h3>
<pre><code class="language-css">.layer { will-change: transform; }
/* or, legacy hack: */
.layer { transform: translateZ(0); }
</code></pre>

<h3>Detecting jank programmatically</h3>
<pre><code class="language-js">// Long Tasks API — fires when main thread is blocked &gt; 50ms
new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    console.log('Long task:', entry.duration);
  }
}).observe({ entryTypes: ['longtask'] });
</code></pre>

<h3>Web Vitals — pipeline-related metrics</h3>
<table>
  <thead><tr><th>Metric</th><th>What's measured</th><th>Pipeline relation</th></tr></thead>
  <tbody>
    <tr><td>FCP (First Contentful Paint)</td><td>Time to first text/image</td><td>End of first Paint phase</td></tr>
    <tr><td>LCP (Largest Contentful Paint)</td><td>Time to largest above-fold element</td><td>Heaviest Paint phase</td></tr>
    <tr><td>CLS (Cumulative Layout Shift)</td><td>Sum of layout-shift movements</td><td>Layout phase changes after first render</td></tr>
    <tr><td>INP (Interaction to Next Paint)</td><td>Time from input to next visual update</td><td>Whole pipeline triggered by user input</td></tr>
    <tr><td>TBT (Total Blocking Time)</td><td>Sum of long-task durations &gt; 50ms</td><td>Main thread blockage</td></tr>
  </tbody>
</table>

<h3>The cascade in practice</h3>
<pre><code class="language-text">.button { color: red; }                  ← specificity 0,0,1,0
#submit  { color: blue; }                 ← specificity 0,1,0,0 → wins
.button.primary { color: green; }         ← specificity 0,0,2,0 (loses to id)
[type="submit"].button { color: purple; } ← specificity 0,0,2,1 (loses to id)
* { color: pink !important; }             ← !important wins regardless

Cascade order: !important &gt; specificity &gt; source order
</code></pre>

<h3>Style invalidation</h3>
<p>When you change one element's class, the browser invalidates its computed style — and potentially its descendants if rules cascade. The browser tries to be smart about which descendants need recompute, but worst-case it's the whole subtree.</p>

<h3>How JS frameworks intersect</h3>
<table>
  <thead><tr><th>Framework</th><th>Pipeline impact</th></tr></thead>
  <tbody>
    <tr><td>React virtual DOM</td><td>Reduces DOM operations to minimal patch; doesn't change pipeline cost per operation.</td></tr>
    <tr><td>Vue reactive</td><td>Same — minimizes operations.</td></tr>
    <tr><td>Svelte compiled</td><td>Compiles away the runtime; only your final mutations execute.</td></tr>
    <tr><td>SolidJS fine-grained</td><td>Per-property updates, no diffing.</td></tr>
  </tbody>
</table>
<p>All frameworks face the same pipeline. Their job is to issue the right DOM mutations efficiently; the browser's pipeline does the rest.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Animating a sidebar slide</h3>
<pre><code class="language-css">/* BAD — animating left triggers layout every frame */
.sidebar {
  position: absolute;
  left: -300px;
  transition: left 300ms ease;
}
.sidebar.open { left: 0; }

/* GOOD — animating transform stays on compositor */
.sidebar {
  transform: translateX(-300px);
  transition: transform 300ms ease;
}
.sidebar.open { transform: translateX(0); }
</code></pre>

<h3>Example 2: Diagnosing layout thrashing</h3>
<pre><code class="language-js">// Original
function adjustHeights() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card =&gt; {
    const h = card.firstChild.offsetHeight;   // force layout
    card.style.height = h + 20 + 'px';        // invalidate layout
  });
}
// 100 cards = 100 layouts.

// Fixed
function adjustHeights() {
  const cards = document.querySelectorAll('.card');
  // Read phase
  const heights = Array.from(cards).map(c =&gt; c.firstChild.offsetHeight);
  // Write phase
  cards.forEach((card, i) =&gt; {
    card.style.height = heights[i] + 20 + 'px';
  });
}
// 1 layout (forced once during the read phase).
</code></pre>

<h3>Example 3: content-visibility for long lists</h3>
<pre><code class="language-css">.feed-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px;
}
</code></pre>
<pre><code class="language-html">&lt;ul&gt;
  &lt;li class="feed-item"&gt;...&lt;/li&gt;   &lt;!-- 1000 items --&gt;
  ...
&lt;/ul&gt;
</code></pre>
<p>Off-screen items don't get rendered. Page scroll stays smooth even with thousands of items.</p>

<h3>Example 4: Large component update — using contain</h3>
<pre><code class="language-css">.card {
  contain: layout paint;
}
</code></pre>
<p>Updates inside <code>.card</code> won't reflow ancestors. For a feed of 100 cards, an update inside one card stays local.</p>

<h3>Example 5: Forcing layout intentionally (FLIP)</h3>
<pre><code class="language-js">// FLIP requires fresh measurements
const first = el.getBoundingClientRect();   // forces layout
mutate();
const last = el.getBoundingClientRect();    // forces layout
const dx = first.left - last.left;
// Now apply transform...
</code></pre>

<h3>Example 6: Detecting render-blocking CSS</h3>
<pre><code class="language-html">&lt;!-- BAD — print stylesheet block render --&gt;
&lt;link rel="stylesheet" href="/print.css" /&gt;

&lt;!-- GOOD — only print loads it --&gt;
&lt;link rel="stylesheet" href="/print.css" media="print" /&gt;

&lt;!-- Async pattern (preload + onload swap) --&gt;
&lt;link rel="preload" href="/print.css" as="style" onload="this.rel='stylesheet'" /&gt;
&lt;noscript&gt;&lt;link rel="stylesheet" href="/print.css" /&gt;&lt;/noscript&gt;
</code></pre>

<h3>Example 7: Lazy-loading off-screen images</h3>
<pre><code class="language-html">&lt;img src="below-fold.jpg" loading="lazy" decoding="async" /&gt;
</code></pre>
<p>Images below the fold don't trigger paint until near viewport. Combined with <code>content-visibility</code> on containers, dramatic improvements.</p>

<h3>Example 8: Long task detector</h3>
<pre><code class="language-js">const observer = new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    if (entry.duration &gt; 100) {
      console.warn(\`Long task: \${entry.duration}ms at \${entry.startTime}\`, entry);
    }
  }
});
observer.observe({ entryTypes: ['longtask'] });
</code></pre>

<h3>Example 9: Profile a re-render</h3>
<pre><code class="language-js">performance.mark('render-start');
// trigger update
performance.mark('render-end');
performance.measure('render', 'render-start', 'render-end');

const m = performance.getEntriesByName('render')[0];
console.log('Render took', m.duration, 'ms');
</code></pre>

<h3>Example 10: Above-fold optimization</h3>
<pre><code class="language-html">&lt;head&gt;
  &lt;style&gt;
    /* Inline critical CSS for above-fold */
    body { font-family: system-ui; }
    .hero { ... }
    .nav  { ... }
  &lt;/style&gt;

  &lt;!-- Preload LCP image --&gt;
  &lt;link rel="preload" href="/hero.webp" as="image" fetchpriority="high" /&gt;

  &lt;!-- Defer all JS --&gt;
  &lt;script src="/main.js" defer&gt;&lt;/script&gt;

  &lt;!-- Async-load non-critical CSS --&gt;
  &lt;link rel="preload" href="/below-fold.css" as="style" onload="this.rel='stylesheet'" /&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;img src="/hero.webp" fetchpriority="high" alt="..." /&gt;
  ...
&lt;/body&gt;
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Style recalc bottlenecks</h3>
<p>Pages with thousands of elements + complex selectors + frequent class toggles can spend significant time in style recalc. Lighthouse calls these out.</p>

<h3>Layout cost of ::pseudo elements</h3>
<p>Adding <code>::before</code> / <code>::after</code> with content can affect layout. Animating them sometimes works, sometimes doesn't (browser-specific).</p>

<h3>Forced synchronous layout in animation loops</h3>
<p>Reading <code>offsetWidth</code> in a rAF loop forces layout every frame. Cache values; recompute only on resize.</p>

<h3>position: sticky and reflow</h3>
<p>position: sticky elements re-layout on scroll. For complex sticky elements (e.g., headers with subnav), this can be expensive.</p>

<h3>Container queries</h3>
<p>CSS Container Queries (<code>@container</code>) work fine but introduce a containment requirement. Style recalc may run more often as containers resize.</p>

<h3>iframe rendering</h3>
<p>Each iframe is its own document with its own pipeline. Off-screen iframes still render; <code>loading="lazy"</code> defers.</p>

<h3>Layer explosion</h3>
<p>Promoting too many elements (will-change, transform on every list item) blows up GPU memory. The compositor may still keep up, but memory pressure can cause page kills on low-end devices.</p>

<h3>The "GPU process crash" tradeoff</h3>
<p>Heavy GPU usage (lots of layers, video, canvas, WebGL) can crash the GPU process, which the browser will recover by re-rendering everything on CPU — visible jank.</p>

<h3>Hidden but rendered</h3>
<p><code>opacity: 0</code> elements still render and consume layout. <code>visibility: hidden</code> takes space but doesn't paint. <code>display: none</code> doesn't render at all. Pick deliberately.</p>

<h3>SVG and the pipeline</h3>
<p>SVG goes through the same pipeline but with its own quirks. Animating SVG attributes may or may not be GPU-accelerated depending on browser. Test.</p>

<h3>Print mode</h3>
<p><code>@media print</code> rules cause re-layout when printing or in print preview. Heavy print stylesheets block print.</p>

<h3>iframes inside transformed parents</h3>
<p>Parent has <code>transform</code>; iframe inside may not paint correctly on Safari (legacy bug). Test cross-browser.</p>

<h3>Concurrent rendering and pipeline</h3>
<p>React 18 concurrent mode interleaves work; pipeline is unchanged but the timing of mutations differs. Use <code>flushSync</code> when you need a synchronous render.</p>

<h3>Subpixel rendering</h3>
<p>Browser may render <code>translate(0.5px)</code> with anti-aliasing that blurs text. Snap to whole pixels for crisp text mid-animation.</p>

<h3>Hardware acceleration regressions</h3>
<p>Browser updates can change which CSS properties are GPU-accelerated. <code>filter: blur</code> on iOS Safari has historically been CPU-bound. Profile after major browser releases.</p>

<h3>Reflow caused by font swap</h3>
<p>Custom fonts (FOIT/FOUT) cause re-layout when they load. <code>font-display: swap</code> or <code>optional</code> changes when the swap happens.</p>

<h3>Resize observer perf</h3>
<p>Many resize observers running simultaneously can cascade. ResizeObserver fires after layout; if your callback writes back to layout, you can create infinite loops.</p>

<h3>Intersection observer cost</h3>
<p>Cheap (off main thread). But callbacks fire on the main thread; doing heavy work in a callback for hundreds of items causes jank.</p>

<h3>Layout shift attribution</h3>
<p>CLS measures unexpected layout shifts. The browser attributes them to specific elements. Common culprits: late-loading images without dimensions, dynamic content insertion above the fold, web fonts.</p>

<h3>Backface-visibility</h3>
<p>3D-rotated elements may show their flipped side without <code>backface-visibility: hidden</code>. Mostly cosmetic but related to rendering.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Animating layout properties</h3>
<pre><code class="language-css">/* BAD — width animation triggers layout per frame */
.bar {
  width: 0;
  transition: width 300ms;
}
.bar.full { width: 100%; }

/* GOOD — scaleX */
.bar {
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 300ms;
}
.bar.full { transform: scaleX(1); }
</code></pre>

<h3>Bug 2: Layout thrashing in JS</h3>
<pre><code class="language-js">// Reads alternating with writes — n iterations = n layouts
items.forEach(i =&gt; {
  const w = i.offsetWidth;
  i.style.width = w * 2 + 'px';
});
// Fix: separate read phase from write phase.
</code></pre>

<h3>Bug 3: Sync script in head blocking parse</h3>
<pre><code class="language-html">&lt;head&gt;
  &lt;script src="/big.js"&gt;&lt;/script&gt;   ← blocks parse + render
&lt;/head&gt;
&lt;!-- FIX --&gt;
&lt;script src="/big.js" defer&gt;&lt;/script&gt;
</code></pre>

<h3>Bug 4: Print stylesheet rendering on screen</h3>
<pre><code class="language-html">&lt;link rel="stylesheet" href="/print.css" /&gt;   ← blocks render unnecessarily
&lt;link rel="stylesheet" href="/print.css" media="print" /&gt;   ← only when printing
</code></pre>

<h3>Bug 5: Forgetting <code>img</code> dimensions causes CLS</h3>
<pre><code class="language-html">&lt;img src="..." /&gt;   ← layout shifts when image loads

&lt;img src="..." width="800" height="600" /&gt;   ← reserves space
</code></pre>

<h3>Bug 6: Heavy paint properties in animations</h3>
<pre><code class="language-css">/* Animating box-shadow paints every frame */
.card { transition: box-shadow 300ms; }
.card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

/* For perf, animate a child overlay's transform: scale to simulate */
</code></pre>

<h3>Bug 7: <code>will-change</code> on too many elements</h3>
<pre><code class="language-css">/* BAD — every card promoted to its own layer */
.card { will-change: transform; }

/* GOOD — only promote during animation */
.card.animating { will-change: transform; }
</code></pre>

<h3>Bug 8: ResizeObserver causing infinite loop</h3>
<pre><code class="language-js">const observer = new ResizeObserver(entries =&gt; {
  for (const e of entries) {
    e.target.style.height = e.contentRect.width + 'px';   // triggers another resize
  }
});
// FIX — guard against unchanged sizes; or use rAF debounce
</code></pre>

<h3>Bug 9: Forcing layout in resize handlers</h3>
<pre><code class="language-js">window.addEventListener('resize', () =&gt; {
  document.querySelectorAll('.box').forEach(b =&gt; {
    const h = b.offsetHeight;   // forces layout per box
    b.style.lineHeight = h + 'px';
  });
});
// FIX — debounce + batch read/write
</code></pre>

<h3>Bug 10: ContentEditable performance</h3>
<p>Large contentEditable elements re-layout on every keystroke. For long content, virtualize or use a real editor (Slate, ProseMirror).</p>

<h3>Anti-pattern 1: Inline styles for animation</h3>
<pre><code class="language-js">// Setting style.transform repeatedly per frame is fine
// But mixing inline styles + classList toggles can cause cascade conflicts.
</code></pre>

<h3>Anti-pattern 2: Computing on every render</h3>
<pre><code class="language-jsx">function Component() {
  const computed = expensiveCalc();   // runs every render → may force layout
  // FIX — useMemo, or move outside component
}
</code></pre>

<h3>Anti-pattern 3: !important everywhere</h3>
<p>!important breaks the cascade. Once you start using it, you need more !important to override. Keep specificity reasonable; reach for !important only for utility classes.</p>

<h3>Anti-pattern 4: Animating filter: blur</h3>
<p>Filter blur is expensive. Animating it produces jank on lower-end devices. Use a static blurred image overlay where possible.</p>

<h3>Anti-pattern 5: Whole-page transitions</h3>
<p>Animating opacity from 0 to 1 on the entire body forces composite of every layer. Use targeted animations on specific elements.</p>

<h3>Anti-pattern 6: Reading layout then writing in a loop</h3>
<p>The most common layout thrashing pattern. Always batch reads, then writes.</p>

<h3>Anti-pattern 7: Skipping content-visibility for long lists</h3>
<p>Modern browsers can skip rendering offscreen items. Adding 1 line of CSS gives major scroll performance.</p>

<h3>Anti-pattern 8: Heavy DOM manipulation outside rAF</h3>
<p>Mutations from setTimeout, click handlers, etc. happen synchronously. rAF lets you batch within a single frame's window.</p>

<h3>Anti-pattern 9: Profiling in dev mode only</h3>
<p>React dev mode is slower than prod. Animations look fine in prod build but catastrophic in dev. Profile production builds.</p>

<h3>Anti-pattern 10: Ignoring layer count</h3>
<p>The Layers panel can reveal hundreds of unintended layers. Clean them up; promote only what genuinely needs it.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 12 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>Walk me through the rendering pipeline.</em></td><td>Parse → Style → Layout → Paint → Composite. Each phase consumes the previous.</td></tr>
    <tr><td><em>What's the Critical Rendering Path?</em></td><td>The minimum work needed to paint first content; sum of HTML parse + render-blocking CSS + critical JS.</td></tr>
    <tr><td><em>What's render-blocking?</em></td><td>External CSS in head; sync external scripts; inline scripts. Defer/async/module scripts are not.</td></tr>
    <tr><td><em>Why animate transform/opacity?</em></td><td>Compositor-only; skips layout and paint; runs on a separate thread.</td></tr>
    <tr><td><em>What's layout thrashing?</em></td><td>Alternating reads (force layout) and writes (invalidate layout) in a loop; n iterations = n layouts.</td></tr>
    <tr><td><em>What's <code>contain</code>?</em></td><td>CSS hint that an element's layout/paint/style/size is independent; lets browser skip cascade work.</td></tr>
    <tr><td><em>What's <code>content-visibility: auto</code>?</em></td><td>Browser skips rendering off-screen elements; major win for long lists.</td></tr>
    <tr><td><em>What's the compositor thread?</em></td><td>Separate thread that assembles layers; animations of compositor-only properties run there independent of main thread.</td></tr>
    <tr><td><em>What forces synchronous layout?</em></td><td>offsetWidth / scrollHeight / getBoundingClientRect / getComputedStyle (some). Reading these flushes pending styles.</td></tr>
    <tr><td><em>How does Web Vitals relate?</em></td><td>FCP/LCP measure paint; CLS measures layout shifts; INP measures interaction-to-next-paint.</td></tr>
    <tr><td><em>What's a layer?</em></td><td>Independently-rasterizable visual unit. Promoted via transform, will-change, fixed position, video, etc.</td></tr>
    <tr><td><em>How do you debug jank?</em></td><td>Performance panel; identify long frames; see which phase (Style/Layout/Paint/Composite) dominated.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Convert a <code>left</code>-animated sidebar to <code>transform</code>-animated.</li>
  <li>Refactor a layout-thrashing function into batched reads/writes.</li>
  <li>Add <code>content-visibility</code> to a feed.</li>
  <li>Add <code>contain</code> to a card component.</li>
  <li>Profile a re-render with the Performance panel and identify the bottleneck phase.</li>
  <li>Write a long-task observer.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Animating top/left/width — switch to transform.</li>
  <li>Sync script blocking parse — add defer.</li>
  <li>img without dimensions causing CLS — add width/height or aspect-ratio.</li>
  <li>Reading offsetWidth in a loop — batch reads first.</li>
  <li>will-change on every list item — promote selectively.</li>
  <li>Print stylesheet without media="print" — render-blocking unnecessarily.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Pipeline literacy</td><td>You name the 5 phases without prompting.</td></tr>
    <tr><td>Property-to-phase mapping</td><td>You know which CSS properties trigger layout vs paint vs composite.</td></tr>
    <tr><td>Layout thrashing awareness</td><td>You separate read and write phases.</td></tr>
    <tr><td>Tools fluency</td><td>You name Performance panel, Layers panel, Long Tasks API.</td></tr>
    <tr><td>Render-blocking awareness</td><td>You know what blocks vs what doesn't.</td></tr>
    <tr><td>Modern primitives</td><td>You volunteer <code>contain</code>, <code>content-visibility</code>, <code>will-change</code>.</td></tr>
    <tr><td>Web Vitals connection</td><td>You connect FCP/LCP/CLS to specific pipeline phases.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN doesn't have a CSS pipeline; it has <strong>Yoga layout</strong> (Flexbox-based) running on the shadow thread, with native rendering.</li>
  <li>Reanimated's "UI thread" maps conceptually to the web's compositor thread.</li>
  <li>Same principles apply: animate transform/opacity for fast paths; avoid layout-affecting properties; respect 16ms budget.</li>
  <li>RN Web (React Native for Web) translates RN components to HTML/CSS — pipeline applies normally there.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why is the compositor thread separate?"</em> — To keep visual updates fast even when the main thread is busy. Scrolling and CSS transform animations work during heavy JS.</li>
  <li><em>"Why does transform avoid layout?"</em> — Transform is a 4×4 matrix multiplied with the element's quads at composite time. The element's box in layout doesn't change; ancestors don't reflow.</li>
  <li><em>"How does the preload scanner work?"</em> — A secondary HTML parser reads ahead even when the main parser is blocked, finding resources to fetch early.</li>
  <li><em>"Why does CSS block render but not parse?"</em> — JS can read computed styles; the browser must finish CSSOM before running JS. So CSS doesn't block HTML parse but does block render (and JS execution that reads styles).</li>
  <li><em>"What's the cost of layer promotion?"</em> — GPU memory (each layer is a texture). Excessive layers can blow up VRAM, especially on mobile.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Profile the homepage in Performance panel; identify long Style / Layout / Paint phases.</li>
  <li>Find sync scripts in head; switch to defer.</li>
  <li>Identify animations of layout/paint properties; rewrite to use transform/opacity.</li>
  <li>Add <code>content-visibility</code> to long lists.</li>
  <li>Add <code>contain</code> to large components with isolated content.</li>
  <li>Audit will-change usage; remove blanket promotions.</li>
  <li>Verify image dimensions are set; LCP image is preloaded.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add a Long Tasks observer wired to error reporting; track main-thread blockage in production."</li>
  <li>"I'd add Web Vitals reporting (CrUX or web-vitals library) to tie real-user metrics to pipeline phases."</li>
  <li>"I'd build a perf budget per page (max FCP / LCP / CLS) and CI-gate releases that exceed it."</li>
  <li>"I'd evaluate Speculation Rules for prerender opportunities."</li>
  <li>"I'd profile our top components for paint cost — drop shadows / filters that hurt frame rates."</li>
</ul>
`
    }
  ]
});
