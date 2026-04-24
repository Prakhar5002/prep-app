window.PREP_SITE.registerTopic({
  id: 'perf-crp',
  module: 'Frontend Performance',
  title: 'Critical Rendering Path',
  estimatedReadTime: '28 min',
  tags: ['performance', 'crp', 'rendering', 'browser', 'layout', 'paint', 'composite', 'parser'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>The <strong>Critical Rendering Path (CRP)</strong> is the sequence of steps the browser takes from receiving HTML bytes to painting the first pixels. Understanding it is the foundation of all page-load and runtime performance work.</p>
<ol>
  <li><strong>HTML parse</strong> — bytes → tokens → DOM. Streaming; the parser pauses for synchronous scripts.</li>
  <li><strong>CSS parse</strong> — bytes → CSSOM. Blocks rendering until done.</li>
  <li><strong>Render tree</strong> — DOM × CSSOM, minus <code>display:none</code>.</li>
  <li><strong>Layout</strong> (aka reflow) — compute geometry (positions, sizes) for every visible box.</li>
  <li><strong>Paint</strong> — fill pixels into layers (text, colors, borders, shadows).</li>
  <li><strong>Composite</strong> — GPU combines layers into the final frame.</li>
</ol>
<ul>
  <li><strong>CSS blocks rendering.</strong> The browser won't paint until every stylesheet in the path has loaded.</li>
  <li><strong>Synchronous scripts block parsing.</strong> A <code>&lt;script src&gt;</code> in the <code>&lt;head&gt;</code> halts DOM construction until it downloads and runs.</li>
  <li><strong>async/defer</strong> release the parser. <code>defer</code> runs after parse, in order. <code>async</code> runs ASAP, order undefined.</li>
  <li><strong>Layout is expensive</strong>, especially on large trees. Paint less expensive; composite cheapest.</li>
  <li><strong>Preload / preconnect</strong> tell the browser what's critical early, winning hundreds of ms on real connections.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>HTML and CSS must both be ready before the first paint. Anything you can inline, defer, preload, or cut reduces time to that first paint. Anything that forces a re-layout after paint (reading <code>offsetHeight</code>, writing styles in a loop) is a runtime perf bug.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The full path, step by step</h3>
<ol>
  <li><strong>Network</strong> — DNS, TCP, TLS, HTTP request, response streaming. Starts before the browser sees any HTML.</li>
  <li><strong>HTML parser</strong> — consumes bytes, decodes to characters (respecting charset), tokenizes, builds the DOM incrementally.</li>
  <li><strong>Preload scanner</strong> — an optimization where the browser looks ahead in the HTML stream for discovers like <code>&lt;link rel="stylesheet"&gt;</code>, <code>&lt;script&gt;</code>, <code>&lt;img&gt;</code>, and starts their fetches in parallel even while the main parser is blocked.</li>
  <li><strong>CSSOM construction</strong> — as CSS arrives, the browser parses and builds a tree of style rules. Blocks rendering until every stylesheet in the head is ready.</li>
  <li><strong>Script execution</strong> — synchronous scripts block parsing; they also block on the CSSOM because they might read styles.</li>
  <li><strong>Render tree</strong> — marries DOM + CSSOM, excluding elements with <code>display:none</code>, pseudo-elements, and generated content.</li>
  <li><strong>Layout</strong> — recursive traversal computing box geometry. O(n) in size of the render tree.</li>
  <li><strong>Paint</strong> — walk the tree, record drawing operations per compositor layer (background, text, borders, shadows, filters).</li>
  <li><strong>Composite</strong> — the GPU takes each layer's bitmap and combines them with transforms and opacity into the final framebuffer.</li>
  <li><strong>First paint / First contentful paint (FCP)</strong> — the moment real pixels hit the screen.</li>
</ol>

<h3>Why CSS blocks rendering</h3>
<p>If the browser painted before CSS was ready, users would see a "flash of unstyled content" (FOUC) — HTML rendered with default browser styles. The spec chose to block rendering until the CSSOM is complete for stylesheets in the document flow. That's why critical CSS inlined in a <code>&lt;style&gt;</code> tag is so valuable — it avoids a network round-trip before the first paint.</p>

<h3>Why synchronous scripts block parsing</h3>
<p>A <code>&lt;script&gt;</code> can call <code>document.write</code>, which mutates the parser's input stream. To handle that deterministically, the parser must wait for the script to finish before continuing. <code>defer</code> and <code>async</code> let you opt out of this blocking behavior by promising you won't use <code>document.write</code>.</p>

<h3>Why layout is the expensive step</h3>
<p>Layout (also called reflow) computes the position and size of every visible box. Its cost scales with the depth and width of the render tree. Worse, some layout properties are <em>non-local</em> — changing one element's height can shift every element below it, cascading through the whole document. That's why "layout thrashing" (repeatedly alternating style reads and writes in a loop) is so pathological: each write invalidates layout, each read forces it to recompute.</p>

<h3>Why paint and composite matter less</h3>
<p>Modern browsers promote certain elements to their own compositor layers (<code>transform</code>, <code>opacity</code>, <code>will-change</code>, <code>&lt;video&gt;</code>, canvas, iframes). Once a layer is cached as a bitmap on the GPU, moving it around (compose) costs almost nothing — the GPU rasterizes it in microseconds. That's why <code>transform: translateY</code> for animations is dramatically faster than <code>top</code>: the former only re-composites; the latter forces layout + paint.</p>

<h3>Why preload / preconnect / dns-prefetch exist</h3>
<p>The preload scanner can find resources referenced in HTML but can't find resources referenced only from CSS (fonts, background images) or only from JS (dynamically loaded chunks). Resource hints like <code>&lt;link rel="preload" as="font" href="..."&gt;</code> tell the browser "download this now, I'll need it soon." <code>preconnect</code> opens the TCP+TLS connection to a domain early; <code>dns-prefetch</code> does just the DNS lookup. All cheap to add, often save hundreds of ms.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "pipeline" picture</h3>
<div class="diagram">
<pre>
 bytes ─► chars ─► tokens ─► DOM ─┐
                                  ├─► Render Tree ─► Layout ─► Paint ─► Composite ─► PIXELS
 bytes ─► chars ─► tokens ─► CSSOM ┘

 Scripts can interrupt this pipeline:
   sync     : halt parsing until script runs
   defer    : runs after DOMContentLoaded, in order
   async    : runs whenever it arrives, any order
   type=module: defers by default, imports resolved
</pre>
</div>

<h3>The "what blocks the first paint" picture</h3>
<div class="diagram">
<pre>
  Required before first paint:
    - HTML parsed enough to reach body
    - Every &lt;link rel="stylesheet"&gt; in the critical path loaded
    - Every sync &lt;script&gt; in the head finished
    - (Optional) fonts — or swap during load

  NOT required:
    - Images (they paint lazily as they arrive)
    - Async scripts
    - Below-the-fold content
</pre>
</div>

<h3>The "layers" picture</h3>
<div class="diagram">
<pre>
  Root document layer (most elements)
  ┌─────────────────────────────┐
  │ ┌──────────┐                │
  │ │ Sticky   │ (own layer)    │
  │ │ header   │                │
  │ └──────────┘                │
  │ ┌──────────────────────────┐│
  │ │ Video / canvas (own)     ││
  │ └──────────────────────────┘│
  │ ┌──────────┐                │
  │ │ Floating │ (own, opacity) │
  │ │ panel    │                │
  │ └──────────┘                │
  └─────────────────────────────┘
  Promoted by: transform, opacity, filter, will-change, video, iframe, canvas
</pre>
</div>

<h3>The "cheap vs expensive operations" picture</h3>
<table>
  <thead><tr><th>Change</th><th>Triggers</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td><code>width</code>, <code>height</code>, <code>top</code>, <code>left</code>, <code>padding</code>, <code>font-size</code></td><td>Layout + Paint + Composite</td><td>High</td></tr>
    <tr><td><code>background-color</code>, <code>color</code>, <code>border-color</code></td><td>Paint + Composite</td><td>Medium</td></tr>
    <tr><td><code>transform</code>, <code>opacity</code> (on a promoted layer)</td><td>Composite only</td><td>Lowest</td></tr>
    <tr><td>Reading <code>offsetHeight</code> / <code>getBoundingClientRect</code> after a write</td><td>Forces sync layout</td><td>Very high (blocks main thread)</td></tr>
  </tbody>
</table>

<h3>The "preload scanner" mental model</h3>
<p>Think of the browser as having two parsers: the <em>main HTML parser</em> (blocked by scripts), and the <em>preload scanner</em> (never blocked — skims ahead for discoverable resources and kicks off fetches). The preload scanner is one of the highest-impact browser optimizations. It's also why you should NOT inject critical resources via inline JS at the top of <code>&lt;head&gt;</code> — the preload scanner can't see them.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"defer" and "async" both make scripts non-blocking, but they differ importantly. <code>defer</code> preserves source order and waits until HTML parsing is done. <code>async</code> runs the second the script downloads — so three async scripts can execute in any order. For analytics → <code>async</code>. For your app bundle → <code>defer</code>. For a script that depends on another script → neither; use ES modules or bundle them.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Script loading modes</h3>
<table>
  <thead><tr><th>Mode</th><th>Blocks parsing?</th><th>Runs</th><th>Order preserved?</th></tr></thead>
  <tbody>
    <tr><td><code>&lt;script src&gt;</code> (sync)</td><td>Yes</td><td>When downloaded</td><td>Yes</td></tr>
    <tr><td><code>&lt;script src defer&gt;</code></td><td>No</td><td>After HTML parse, before DOMContentLoaded</td><td>Yes</td></tr>
    <tr><td><code>&lt;script src async&gt;</code></td><td>No</td><td>As soon as downloaded</td><td>No</td></tr>
    <tr><td><code>&lt;script type="module" src&gt;</code></td><td>No (deferred by default)</td><td>After HTML parse</td><td>Yes (via import graph)</td></tr>
    <tr><td><code>&lt;script type="module" async src&gt;</code></td><td>No</td><td>As soon as graph resolves</td><td>No</td></tr>
    <tr><td>Inline <code>&lt;script&gt;</code></td><td>Yes (halts until run)</td><td>Immediately</td><td>Yes</td></tr>
  </tbody>
</table>

<h3>CSS loading modes</h3>
<pre><code class="language-html">&lt;!-- Blocks rendering --&gt;
&lt;link rel="stylesheet" href="main.css" /&gt;

&lt;!-- Non-blocking: preload then swap to stylesheet --&gt;
&lt;link rel="preload" href="non-critical.css" as="style"
      onload="this.onload=null;this.rel='stylesheet'" /&gt;

&lt;!-- Media-query-based: doesn't block render for non-matching media --&gt;
&lt;link rel="stylesheet" href="print.css" media="print" /&gt;</code></pre>

<h3>Resource hints — cheapest wins</h3>
<pre><code class="language-html">&lt;!-- DNS only --&gt;
&lt;link rel="dns-prefetch" href="//cdn.example.com" /&gt;

&lt;!-- DNS + TCP + TLS --&gt;
&lt;link rel="preconnect" href="https://cdn.example.com" crossorigin /&gt;

&lt;!-- Fetch the resource at high priority --&gt;
&lt;link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin /&gt;
&lt;link rel="preload" href="/hero.webp" as="image" /&gt;

&lt;!-- Fetch lower-priority for next-page navigation --&gt;
&lt;link rel="prefetch" href="/next-page.js" /&gt;

&lt;!-- Render the page in the background ready for instant navigation --&gt;
&lt;link rel="prerender" href="/likely-next-page" /&gt; &lt;!-- heavy; use sparingly --&gt;</code></pre>

<h3>Critical CSS inlining</h3>
<p>Extract the CSS that applies to above-the-fold content and inline it in a <code>&lt;style&gt;</code> tag in the head. Load the rest via non-blocking link. Tools: Critters (Webpack), Penthouse, built-in support in Next.js/Remix.</p>
<pre><code class="language-html">&lt;head&gt;
  &lt;style&gt;/* inlined critical CSS: navbar, hero, above-the-fold */&lt;/style&gt;
  &lt;link rel="preload" href="/full.css" as="style" onload="this.rel='stylesheet'" /&gt;
&lt;/head&gt;</code></pre>

<h3>Font loading strategies</h3>
<ul>
  <li><code>font-display: swap</code> — show fallback immediately, swap in custom font when loaded (FOUT = flash of unstyled text; acceptable tradeoff).</li>
  <li><code>font-display: optional</code> — if font doesn't load in ~100ms, use fallback for this session (no swap).</li>
  <li><code>&lt;link rel="preload" as="font"&gt;</code> to start fetching early (must have <code>crossorigin</code>).</li>
  <li>Self-host fonts to avoid third-party DNS/TLS overhead.</li>
  <li>Subset fonts to only the characters you need (Latin-1 + extended covers most English; subset more for CJK).</li>
</ul>

<h3>Avoiding layout thrashing</h3>
<p>Batch reads, then batch writes. Use <code>requestAnimationFrame</code> for DOM changes that need to be in sync with paint.</p>
<pre><code class="language-js">// BAD — reads interleaved with writes → sync layout per iteration
for (const el of items) {
  el.style.left = el.offsetLeft + 10 + 'px';
}

// GOOD — batch reads, then writes
const lefts = items.map(el =&gt; el.offsetLeft);
items.forEach((el, i) =&gt; { el.style.left = lefts[i] + 10 + 'px'; });</code></pre>

<h3>Compositor-only properties</h3>
<p>These properties can be animated without layout or paint, only composite:</p>
<ul>
  <li><code>transform</code> (translate, rotate, scale, skew)</li>
  <li><code>opacity</code></li>
  <li><code>filter</code> (on promoted layers)</li>
</ul>
<p>Use these for animations that should hit 60fps.</p>

<h3>will-change hint</h3>
<pre><code class="language-css">.modal { will-change: transform, opacity; }</code></pre>
<p>Tells the browser "I plan to animate these properties; promote this element to its own layer now." Use sparingly — every promoted layer costs GPU memory. Remove <code>will-change</code> after the animation ends.</p>

<h3>Content-visibility (recent)</h3>
<pre><code class="language-css">.section { content-visibility: auto; contain-intrinsic-size: 1000px 500px; }</code></pre>
<p>Tells the browser "skip rendering this section's contents when they're off-screen." Massive win for long pages. <code>contain-intrinsic-size</code> reserves placeholder space so the scrollbar doesn't jump as sections render.</p>

<h3>contain — isolation boundaries</h3>
<pre><code class="language-css">.card { contain: layout paint; }</code></pre>
<p><code>contain</code> promises the browser that changes inside this element won't affect layout or paint of siblings/ancestors. Lets the browser skip work. Good candidates: cards in lists, modals, widgets.</p>

<h3>HTTP/2 + HTTP/3 effects</h3>
<ul>
  <li>HTTP/2 multiplexes many requests over one connection — bundling matters less.</li>
  <li>HTTP/3 over QUIC reduces connection setup and recovers from packet loss faster on mobile networks.</li>
  <li>Server Push (H2) was largely abandoned; use <code>103 Early Hints</code> + <code>preload</code> instead.</li>
</ul>

<h3>103 Early Hints</h3>
<p>A new HTTP status code where the server can send <code>Link: &lt;/app.css&gt;; rel=preload</code> headers <em>before</em> the full 200 response is ready, giving the browser a head start on fetches while the server is still computing the HTML.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — head that doesn't block</h3>
<pre><code class="language-html">&lt;head&gt;
  &lt;meta charset="UTF-8" /&gt;
  &lt;meta name="viewport" content="width=device-width, initial-scale=1" /&gt;
  &lt;link rel="preconnect" href="https://cdn.example.com" crossorigin /&gt;
  &lt;link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin /&gt;
  &lt;style&gt;/* critical CSS — ~10 KB */&lt;/style&gt;
  &lt;link rel="preload" href="/full.css" as="style" onload="this.rel='stylesheet'" /&gt;
  &lt;script src="/app.js" defer&gt;&lt;/script&gt;
&lt;/head&gt;</code></pre>

<h3>Example 2 — comparing defer vs async</h3>
<pre><code class="language-html">&lt;!-- Executes in order, after HTML parse --&gt;
&lt;script src="/a.js" defer&gt;&lt;/script&gt;
&lt;script src="/b.js" defer&gt;&lt;/script&gt;

&lt;!-- Executes whenever downloaded, order undefined --&gt;
&lt;script src="/ga.js" async&gt;&lt;/script&gt;
&lt;script src="/fbpixel.js" async&gt;&lt;/script&gt;</code></pre>

<h3>Example 3 — layout thrash and its fix</h3>
<pre><code class="language-js">// BAD — thrashes layout
function shiftAll(els) {
  for (const el of els) {
    const w = el.offsetWidth;  // forces layout
    el.style.width = (w + 10) + 'px'; // invalidates layout
  }
}

// GOOD — batch read, then write
function shiftAll(els) {
  const widths = els.map(el =&gt; el.offsetWidth); // single layout pass
  requestAnimationFrame(() =&gt; {
    els.forEach((el, i) =&gt; el.style.width = (widths[i] + 10) + 'px');
  });
}</code></pre>

<h3>Example 4 — compositor-only animation</h3>
<pre><code class="language-css">/* BAD — triggers layout + paint every frame */
.slide { transition: left 0.3s ease; }
.slide.active { left: 100px; }

/* GOOD — compositor-only */
.slide { transition: transform 0.3s ease; }
.slide.active { transform: translateX(100px); }</code></pre>

<h3>Example 5 — critical CSS split</h3>
<pre><code class="language-html">&lt;style&gt;
/* Inlined — just the above-the-fold styles */
body { margin: 0; font-family: system-ui; }
.header { height: 60px; background: #fff; }
.hero { padding: 40px 20px; }
&lt;/style&gt;
&lt;link rel="preload" href="/rest.css" as="style" onload="this.rel='stylesheet'" /&gt;</code></pre>

<h3>Example 6 — font with swap</h3>
<pre><code class="language-css">@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap;
}
body { font-family: 'Inter', system-ui, sans-serif; }</code></pre>

<h3>Example 7 — preloading a font</h3>
<pre><code class="language-html">&lt;link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin /&gt;</code></pre>
<p>Without this, the browser discovers the font only after parsing CSS and computing styles — often 300-800ms too late on real networks.</p>

<h3>Example 8 — content-visibility</h3>
<pre><code class="language-css">article section {
  content-visibility: auto;
  contain-intrinsic-size: 0 800px; /* reserve placeholder space */
}</code></pre>

<h3>Example 9 — containment</h3>
<pre><code class="language-css">.card {
  contain: layout paint;
}
/* Changes inside .card cannot force layout or paint outside it. */</code></pre>

<h3>Example 10 — lazy-loading images below the fold</h3>
<pre><code class="language-html">&lt;img src="/hero.webp" alt="" fetchpriority="high" /&gt;             &lt;!-- above fold --&gt;
&lt;img src="/thumb.webp" alt="" loading="lazy" decoding="async" /&gt; &lt;!-- below fold --&gt;</code></pre>

<h3>Example 11 — measuring with PerformanceObserver</h3>
<pre><code class="language-js">new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.startTime.toFixed(1));
  }
}).observe({ type: 'paint', buffered: true });
// logs: first-paint 342.1, first-contentful-paint 412.0</code></pre>

<h3>Example 12 — Navigation Timing</h3>
<pre><code class="language-js">const nav = performance.getEntriesByType('navigation')[0];
console.log({
  dns: nav.domainLookupEnd - nav.domainLookupStart,
  tcp: nav.connectEnd - nav.connectStart,
  ttfb: nav.responseStart - nav.requestStart,
  download: nav.responseEnd - nav.responseStart,
  domInteractive: nav.domInteractive,
  domContentLoaded: nav.domContentLoadedEventEnd,
  loadEvent: nav.loadEventEnd,
});</code></pre>

<h3>Example 13 — avoiding render-blocking script</h3>
<pre><code class="language-html">&lt;!-- BAD: blocks HTML parsing --&gt;
&lt;script src="/jquery.js"&gt;&lt;/script&gt;
&lt;script&gt;$(document).ready(...)&lt;/script&gt;

&lt;!-- GOOD: defer --&gt;
&lt;script src="/jquery.js" defer&gt;&lt;/script&gt;
&lt;script defer&gt;document.addEventListener('DOMContentLoaded', ...);&lt;/script&gt;</code></pre>

<h3>Example 14 — 103 Early Hints (server-side)</h3>
<pre><code class="language-js">// Express example
app.get('/', (req, res) =&gt; {
  res.writeEarlyHints({
    link: ['&lt;/main.css&gt;; rel=preload; as=style',
           '&lt;/app.js&gt;; rel=preload; as=script']
  });
  // ... then compute HTML and send 200
  res.render('index', data);
});</code></pre>

<h3>Example 15 — detecting long tasks</h3>
<pre><code class="language-js">new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    console.warn('long task', entry.duration, 'ms at', entry.startTime);
  }
}).observe({ type: 'longtask', buffered: true });
// Any task &gt; 50ms is a jank candidate.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. CSS-in-head hides the body</h3>
<p>If your <code>&lt;link rel="stylesheet"&gt;</code> fails or is very slow, the browser won't paint — the entire page appears blank. Set a reasonable timeout on your CSS CDN or fallback.</p>

<h3>2. @import in CSS cascades into extra round-trips</h3>
<pre><code class="language-css">/* main.css */
@import 'reset.css'; /* browser fetches reset.css ONLY after main.css parsed */</code></pre>
<p>Each <code>@import</code> delays rendering by a full round-trip. Flatten imports at build time or use <code>&lt;link&gt;</code> tags.</p>

<h3>3. inline styles attribute vs &lt;style&gt; block</h3>
<p>Inline styles (<code>style=""</code>) don't block — they're just DOM attributes. <code>&lt;style&gt;</code> blocks rendering like an external stylesheet would while it's parsed, but is done almost instantly.</p>

<h3>4. document.write inside async scripts</h3>
<p>Async scripts ignore <code>document.write</code> after the document is parsed — it silently does nothing. Don't assume <code>document.write</code> works from any script type except sync.</p>

<h3>5. defer scripts and DOMContentLoaded</h3>
<p><code>defer</code> scripts run BEFORE the <code>DOMContentLoaded</code> event. If your script listens for DCL, the handler runs as expected.</p>

<h3>6. Async scripts and DCL</h3>
<p>Async scripts may run BEFORE or AFTER DCL depending on download time. If DCL has already fired, your "wait for DCL" handler never runs. Guard with <code>if (document.readyState !== 'loading')</code>.</p>

<h3>7. Scripts in the body</h3>
<p>Historically, putting <code>&lt;script&gt;</code> at the end of <code>&lt;body&gt;</code> was the "no blocking" trick. Today, prefer <code>defer</code> in the head — same effect, better preload discovery.</p>

<h3>8. Media-query-bound CSS</h3>
<pre><code class="language-html">&lt;link rel="stylesheet" href="print.css" media="print" /&gt;</code></pre>
<p>For print media, this is downloaded but doesn't block render. Same applies for <code>media="(min-width: 1000px)"</code> on a narrow screen — downloaded but non-blocking.</p>

<h3>9. CSS custom properties can trigger style recalc</h3>
<p>Setting a CSS variable on <code>document.documentElement</code> that's used in many places invalidates computed styles everywhere. Scope variables to the smallest element that needs them.</p>

<h3>10. Forced synchronous layout</h3>
<p>Reading <code>offsetTop</code>, <code>clientWidth</code>, <code>getBoundingClientRect</code>, <code>getComputedStyle</code>, <code>scrollTop</code> forces the browser to flush pending layout work synchronously. Chrome DevTools flags these as "Forced reflow" purple warnings.</p>

<h3>11. Transitions on display:none elements</h3>
<p>An element toggling from <code>display:none</code> to <code>display:block</code> cannot transition — the CSS transition kicks in only after the first paint of the new display state. Workaround: toggle <code>opacity</code> + <code>visibility</code> or use <code>&lt;dialog&gt;</code>.</p>

<h3>12. Image dimensions affect layout shifts</h3>
<p>An <code>&lt;img&gt;</code> without <code>width</code>/<code>height</code> attributes has zero intrinsic size until it loads, then reflows the page (CLS hit). Always specify dimensions or use <code>aspect-ratio</code> CSS.</p>

<h3>13. Render-blocking iframes</h3>
<p>Iframes load independently but can delay the parent's <code>load</code> event. For third-party widgets (chat, ads), load them async or in a worker.</p>

<h3>14. SVG sprite rendering</h3>
<p>Inlining large SVG sprites in <code>&lt;body&gt;</code> increases HTML parse time. Prefer external sprite + <code>&lt;use xlink:href&gt;</code>, or inline just the icons you use above the fold.</p>

<h3>15. Reflow cascade inside Shadow DOM</h3>
<p>Shadow DOM encapsulates styles but not layout — a change inside a shadow root can still force global layout if its host changes size. <code>contain</code> on the host helps.</p>

<h3>16. Paint holding</h3>
<p>Chrome sometimes "paints white" briefly during navigation between same-origin pages to hide partial renders — paint holding. You can't control this directly.</p>

<h3>17. requestAnimationFrame vs setTimeout</h3>
<p>rAF callbacks run right before the next paint. setTimeout callbacks run at the next task tick, which may or may not align with painting. For visual updates → rAF. For deferred work → setTimeout or <code>scheduler.postTask</code>.</p>

<h3>18. Third-party CSS is an outage risk</h3>
<p>A slow or failing CSS CDN freezes your page. Self-host critical CSS; load third-party CSS async (preload-swap pattern) so its failure doesn't block.</p>

<h3>19. Fonts block first paint only if font-display: block</h3>
<p>The default <code>font-display: auto</code> in older specs was block-like. Modern best practice: always specify <code>swap</code> or <code>optional</code>. Otherwise text may be invisible until the custom font loads.</p>

<h3>20. The Preload scanner misses JS-injected resources</h3>
<pre><code class="language-html">&lt;script&gt;document.write('&lt;link rel="stylesheet" href="late.css"&gt;');&lt;/script&gt;</code></pre>
<p>late.css is discovered only AFTER the script executes. The preload scanner can't find it. Bad for initial render.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — synchronous script in head</h3>
<pre><code class="language-html">&lt;head&gt;
  &lt;script src="/jquery.js"&gt;&lt;/script&gt;  &lt;!-- blocks parsing --&gt;
&lt;/head&gt;</code></pre>
<p>Every byte of HTML below this waits until jquery downloads and runs. Use <code>defer</code> (preserves order, runs after parse) or <code>async</code>.</p>

<h3>Anti-pattern 2 — render-blocking third-party scripts</h3>
<p>Analytics, tag managers, chat widgets loaded synchronously can add seconds to first paint. Always <code>async</code> them or load via tag manager that loads async.</p>

<h3>Anti-pattern 3 — @import chains in CSS</h3>
<p>Each <code>@import</code> costs a round-trip. Flatten at build time or concatenate.</p>

<h3>Anti-pattern 4 — images without dimensions</h3>
<pre><code class="language-html">&lt;img src="hero.jpg" /&gt; &lt;!-- CLS hit when it loads --&gt;</code></pre>
<p>Add <code>width</code>, <code>height</code>, or <code>aspect-ratio</code>. Reserves space before the pixels arrive.</p>

<h3>Anti-pattern 5 — layout thrashing in loops</h3>
<pre><code class="language-js">for (const el of els) {
  el.style.height = el.offsetHeight + 10 + 'px'; // sync layout per iter
}</code></pre>
<p>Read once, write once. Batch.</p>

<h3>Anti-pattern 6 — animating <code>top</code> / <code>left</code> / <code>width</code> / <code>height</code></h3>
<p>Triggers layout + paint every frame. Prefer <code>transform</code> for motion, <code>opacity</code> for fades.</p>

<h3>Anti-pattern 7 — excessive will-change</h3>
<pre><code class="language-css">* { will-change: transform; } /* nope */</code></pre>
<p>Every promoted layer uses GPU memory. Use only where you actively animate, and remove after.</p>

<h3>Anti-pattern 8 — third-party CSS via CDN with no fallback</h3>
<p>When the CDN hiccups, your page blanks. Self-host critical CSS. Load non-critical async.</p>

<h3>Anti-pattern 9 — fonts without preload, without swap</h3>
<p>Network-discovered fonts cause 300-1000ms of invisible text. Preload + swap.</p>

<h3>Anti-pattern 10 — inline CSS in every component</h3>
<p>Style attributes don't block, but duplicate CSS blows up the HTML size. Prefer a stylesheet + className.</p>

<h3>Anti-pattern 11 — DOM mutations in scroll handler</h3>
<pre><code class="language-js">window.addEventListener('scroll', () =&gt; {
  el.style.transform = \`translateY(\${scrollY}px)\`; // fires many times/sec
});</code></pre>
<p>Use rAF or <code>scroll-timeline</code> + CSS, or debounce. Browsers don't natively throttle scroll.</p>

<h3>Anti-pattern 12 — reading dimensions just to re-set them</h3>
<pre><code class="language-js">el.style.width = el.offsetWidth + 'px';</code></pre>
<p>Forces sync layout for no reason. If you need a fixed width, measure once and set from a variable.</p>

<h3>Anti-pattern 13 — big HTML payload</h3>
<p>Sending 500KB of inline JSON/SVG blocks the parser. Externalize, stream, or split with Suspense.</p>

<h3>Anti-pattern 14 — above-the-fold image with loading=lazy</h3>
<pre><code class="language-html">&lt;img src="hero.jpg" loading="lazy" /&gt; &lt;!-- hurts LCP --&gt;</code></pre>
<p>The hero should load eagerly. Add <code>fetchpriority="high"</code> to it.</p>

<h3>Anti-pattern 15 — ignoring connection quality</h3>
<p>Your 4G test is nothing like the user on 3G / flaky wifi. Use WebPageTest's mobile/slow throttling, or Chrome DevTools' "Slow 3G" preset. Optimize for p75 network, not your own.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Walk me through the Critical Rendering Path.</div>
  <div class="qa-answer">
    <p>Six high-level stages:</p>
    <ol>
      <li><strong>HTML parse</strong> → DOM. Streaming. Sync scripts pause the parser.</li>
      <li><strong>CSS parse</strong> → CSSOM. Blocks rendering.</li>
      <li><strong>Render tree</strong>: DOM × CSSOM, minus <code>display:none</code>.</li>
      <li><strong>Layout</strong>: compute geometry (position, size) for every visible box.</li>
      <li><strong>Paint</strong>: fill pixels into compositor layers (text, color, borders, shadows).</li>
      <li><strong>Composite</strong>: GPU combines layers into the final frame.</li>
    </ol>
    <p>A preload scanner runs in parallel, discovering resources ahead of the main parser to start fetches early. CSS and sync scripts block the first paint; <code>defer</code>/<code>async</code>/type=module release parsing. Optimization targets: inline critical CSS, preload fonts, compress HTML, avoid render-blocking scripts.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Difference between defer and async?</div>
  <div class="qa-answer">
    <p>Both are non-blocking — HTML parsing continues while the script downloads. But:</p>
    <ul>
      <li><strong>defer</strong>: runs after HTML parsing is complete, BEFORE DOMContentLoaded. Multiple defers run in source order. Ideal for your main app bundle.</li>
      <li><strong>async</strong>: runs the instant it downloads. Order is undefined. Ideal for independent third-party scripts (analytics, fb pixel).</li>
    </ul>
    <p><code>type="module"</code> is deferred by default. <code>type="module" async</code> runs ASAP like async.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why does CSS block rendering?</div>
  <div class="qa-answer">
    <p>If the browser painted before CSS was ready, users would see unstyled HTML — flash of unstyled content. The spec blocks the first paint until every render-blocking stylesheet is loaded and parsed into CSSOM. You can opt resources out of blocking: media-query-mismatched stylesheets (<code>media="print"</code>), preload-then-swap pattern, or moving to inline critical CSS.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What's layout thrashing?</div>
  <div class="qa-answer">
    <p>Alternating DOM reads (<code>offsetHeight</code>, <code>getBoundingClientRect</code>) and writes (<code>style.height = ...</code>) in a loop. Each write invalidates layout; each subsequent read forces the browser to recompute it synchronously. A 100-iteration loop can cost 100 forced layouts — tens of ms of blocked main thread. Fix: batch all reads, then batch all writes, optionally inside <code>requestAnimationFrame</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Which CSS properties are cheapest to animate?</div>
  <div class="qa-answer">
    <p><code>transform</code> and <code>opacity</code> on a promoted compositor layer. They skip layout and paint entirely — only the GPU composites layers. That's why slide/fade animations use <code>transform: translateX</code> instead of <code>left</code>. <code>filter</code> is also GPU-accelerated when the element is layer-promoted.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Explain the preload scanner.</div>
  <div class="qa-answer">
    <p>A browser optimization where a secondary parser skims incoming HTML bytes for external resources (stylesheets, scripts, images, fonts via <code>&lt;link rel="preload"&gt;</code>) and starts their fetches BEFORE the main parser reaches them. Bypasses the bottleneck of script-blocked parsing. Catch: it only sees resources declared in HTML — resources loaded via JS-inserted tags or CSS <code>url()</code> (fonts, bg-images) are invisible. Use <code>rel="preload"</code> hints to make them discoverable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. A designer complains that the page is blank for 1s then pops in. Diagnose.</div>
  <div class="qa-answer">
    <ol>
      <li>Open DevTools → Performance panel → record page load.</li>
      <li>Identify the first paint / FCP mark. Check what happened before.</li>
      <li>Common culprits: a render-blocking CSS file (CDN on slow conn), a synchronous third-party script in the head, a custom font with no swap, huge inline JSON.</li>
      <li>Fix matrix: inline critical CSS, defer/async scripts, preload fonts with font-display: swap, reduce HTML size.</li>
    </ol>
    <p>Measure with Lighthouse or WebPageTest on throttled mobile, not your dev machine.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Preload vs prefetch vs preconnect?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>preconnect</strong>: open TCP+TLS to a domain now — cheap, doesn't download anything.</li>
      <li><strong>dns-prefetch</strong>: only resolve DNS, lighter than preconnect, less effective.</li>
      <li><strong>preload</strong>: actually download the resource at high priority; use when a resource will definitely be used this page.</li>
      <li><strong>prefetch</strong>: download at idle priority; use for likely next-page navigation.</li>
      <li><strong>prerender</strong> (or Speculation Rules API): render the next page offscreen in the background; heavy; use very selectively.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What's content-visibility: auto?</div>
  <div class="qa-answer">
    <p>A CSS property that tells the browser to skip rendering (layout + paint) for an element's contents when they're off-screen. Huge wins on long pages with many sections. Pair with <code>contain-intrinsic-size</code> to reserve approximate placeholder space so scrolling doesn't jump. Caveat: breaks a few things — find-in-page may not find hidden text in some older implementations, and the element isn't in the accessibility tree the same way.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you avoid FOUT / FOIT for custom fonts?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Preload</strong> the font file: <code>&lt;link rel="preload" as="font" crossorigin /&gt;</code>.</li>
      <li><strong>font-display: swap</strong> — show fallback immediately, swap when loaded. Accepts FOUT.</li>
      <li><strong>font-display: optional</strong> — if not loaded fast, use fallback for this session. No swap, no FOUT after the fact.</li>
      <li><strong>Self-host</strong> to avoid third-party connection overhead.</li>
      <li><strong>Subset</strong> the font to the characters you actually use.</li>
      <li><strong>Match fallback metrics</strong> with CSS Font Loading API or the new <code>size-adjust</code>/<code>ascent-override</code>/<code>descent-override</code> descriptors to minimize visible shift.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What triggers a forced synchronous layout?</div>
  <div class="qa-answer">
    <p>Any DOM API that needs up-to-date layout info while there are pending style or layout invalidations. Examples: <code>el.offsetHeight</code>, <code>el.getBoundingClientRect()</code>, <code>getComputedStyle()</code>, <code>window.scrollY</code> after changing styles, <code>el.scrollTop</code>, <code>el.clientWidth</code>. Browser must flush all pending work before responding. Chrome DevTools Performance panel shows these as purple "Forced reflow" warnings.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Why is requestAnimationFrame better than setTimeout for animations?</div>
  <div class="qa-answer">
    <p><code>requestAnimationFrame</code> schedules a callback to run right before the next browser paint (typically 60 times per second on a 60Hz display, or more on 120Hz). Writes inside rAF are batched with the paint — no extra reflow/paint cycle. <code>setTimeout(fn, 16)</code> runs on a best-effort task queue, potentially dropping frames when the queue is busy. rAF also pauses automatically when the tab is backgrounded, saving battery.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's 103 Early Hints?</div>
  <div class="qa-answer">
    <p>An HTTP status code where the server can send preliminary headers (typically <code>Link</code> with <code>rel=preload</code>) BEFORE it's finished computing the full 200 response. Example: a Node app takes 400ms to render HTML; with Early Hints, after 20ms the server sends <code>103 Link: &lt;/app.css&gt;; rel=preload; as=style</code>, letting the browser start fetching CSS while Node is still rendering. Supported in Chrome and Cloudflare; gaining adoption.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How would you instrument load performance in production?</div>
  <div class="qa-answer">
    <p>Use the <code>PerformanceObserver</code> API to capture: <code>navigation</code> entries (TTFB, DOMContentLoaded), <code>paint</code> entries (FP, FCP), <code>largest-contentful-paint</code>, <code>layout-shift</code> (CLS), <code>first-input</code> or <code>event</code> (INP). Batch and send to your RUM endpoint (Google Analytics, Sentry, custom). Use <code>web-vitals</code> library for the standard metrics with correct reporting semantics.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. A hero image causes a big CLS score. How do you fix it?</div>
  <div class="qa-answer">
    <p>CLS (Cumulative Layout Shift) counts unexpected layout shifts. For images:</p>
    <ol>
      <li>Always specify <code>width</code> and <code>height</code> (even if CSS will override) — reserves layout space.</li>
      <li>Or use <code>aspect-ratio</code> CSS: <code>img { aspect-ratio: 16/9; width: 100%; height: auto; }</code>.</li>
      <li>Use <code>fetchpriority="high"</code> on the hero to make it load fast.</li>
      <li>Consider a low-quality image placeholder (LQIP) — a tiny blurred version embedded as data URL.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You name the 6 stages: parse HTML, parse CSS, render tree, layout, paint, composite.</li>
    <li>You distinguish defer from async precisely.</li>
    <li>You can cite compositor-only properties for 60fps animation.</li>
    <li>You know <code>content-visibility</code>, <code>contain</code>, <code>fetchpriority</code>, Early Hints.</li>
    <li>You spot layout thrashing and know the batch-read-then-batch-write fix.</li>
    <li>You measure with PerformanceObserver / Web Vitals library, not <code>performance.now()</code> guesses.</li>
    <li>You avoid render-blocking third-party scripts and CSS.</li>
  </ul>
</div>
`}

]
});
