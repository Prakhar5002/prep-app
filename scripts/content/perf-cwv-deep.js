window.PREP_SITE.registerTopic({
  id: 'perf-cwv-deep',
  module: 'Frontend Performance',
  title: 'Core Web Vitals Deep',
  estimatedReadTime: '28 min',
  tags: ['performance', 'web-vitals', 'lcp', 'inp', 'cls', 'fcp', 'ttfb', 'rum'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Core Web Vitals</strong> are Google's shortlist of user-experience metrics that also happen to influence search ranking. As of 2024+, there are three:</p>
<table>
  <thead><tr><th>Metric</th><th>What it measures</th><th>Good</th><th>Needs work</th><th>Poor</th></tr></thead>
  <tbody>
    <tr><td><strong>LCP</strong> — Largest Contentful Paint</td><td>Time until the biggest element above the fold is painted</td><td>&lt; 2.5 s</td><td>2.5–4 s</td><td>&gt; 4 s</td></tr>
    <tr><td><strong>INP</strong> — Interaction to Next Paint</td><td>Worst-case input-to-paint latency (replaced FID in March 2024)</td><td>&lt; 200 ms</td><td>200–500 ms</td><td>&gt; 500 ms</td></tr>
    <tr><td><strong>CLS</strong> — Cumulative Layout Shift</td><td>Sum of unexpected layout shifts during the session</td><td>&lt; 0.1</td><td>0.1–0.25</td><td>&gt; 0.25</td></tr>
  </tbody>
</table>

<p>Supporting metrics still worth tracking:</p>
<ul>
  <li><strong>TTFB</strong> — Time to First Byte: server + network latency before any content arrives.</li>
  <li><strong>FCP</strong> — First Contentful Paint: first text, SVG, or image paint.</li>
  <li><strong>FID</strong> — First Input Delay (legacy, replaced by INP).</li>
</ul>

<p>Google publishes thresholds as the 75th-percentile of real-world users — you need 75% of sessions to be "good" to pass.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>LCP is about how fast the big thing shows up. INP is about how responsive every interaction feels, worst case. CLS is about how much the page jumps around. Each has a specific optimization playbook — treat them as distinct problems, not "make the site fast."</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why Web Vitals exist</h3>
<p>Legacy perf metrics like <code>load</code> and <code>DOMContentLoaded</code> don't correlate well with user experience. A page with <code>load</code> at 2s might have its main content visible at 500ms or at 4s — same <code>load</code>, very different UX. Web Vitals focus on user-perceived moments: when does the user see content? When do their inputs respond? How stable is what they see?</p>

<h3>LCP — Largest Contentful Paint</h3>
<p>The render time of the largest image or text block visible in the viewport during load. "Largest" is measured by pixel area. The browser keeps reporting until the user first interacts (click, scroll, tap) — any element that gets larger or is added before that resets LCP. Candidates include <code>&lt;img&gt;</code>, <code>&lt;video&gt;</code> posters, <code>&lt;svg&gt;</code>, and text blocks.</p>

<h3>Why LCP matters</h3>
<p>It proxies "when does the user see the content they came for." Shipping a skeleton in 200ms but revealing actual content at 5s feels broken — LCP captures that. Optimization targets: reduce server response (TTFB), deliver the hero resource quickly (preload, WebP, prioritization), avoid render-blocking resources.</p>

<h3>INP — Interaction to Next Paint</h3>
<p>The <em>worst-case</em> latency from a user input (click, tap, keydown) to the next paint reflecting that input, across the whole session. Replaced FID in March 2024 because FID only measured the first input; INP captures ongoing responsiveness. Measured per interaction; the reported value is usually the p98 of interactions.</p>

<h3>Why INP matters</h3>
<p>A site can have great LCP but freeze for half a second when you click a button — users hate this more than slow initial load. INP exposes it. Optimization targets: break up long JS tasks, yield to the browser, use <code>startTransition</code> in React, move heavy work off the main thread (Web Workers), optimize event handlers.</p>

<h3>CLS — Cumulative Layout Shift</h3>
<p>A score representing how much visible content shifts unexpectedly during a session. Each shift is weighted by (impact fraction) × (distance fraction). Summed across all shifts in a session window. Common causes: images without dimensions pushing content down when they load, web fonts swapping in at different metrics, ads/embeds being inserted, animations that change layout.</p>

<h3>Why CLS matters</h3>
<p>Layout shifts cause mis-clicks and a feeling that the page is unstable. Optimization targets: always reserve space for images, iframes, ads; use <code>font-display: optional</code> or match fallback metrics; avoid injecting content above existing content; use <code>transform</code> for animations.</p>

<h3>Field vs lab data</h3>
<ul>
  <li><strong>Lab data</strong> — measured in controlled tools (Lighthouse, WebPageTest). Deterministic, but one synthetic run on one device, one network. Can miss real-world variability.</li>
  <li><strong>Field data / RUM</strong> — collected from real users (Chrome UX Report, your own Performance Observer). Captures the actual distribution across devices and networks. Google uses field data for search ranking.</li>
</ul>
<p>Always measure both: labs for debugging specific issues with repeatable runs; field for tracking real UX trends.</p>

<h3>The "75th percentile" rule</h3>
<p>Google evaluates pages at the p75 of real-user metrics. "Good LCP" means 75% of page loads had LCP under 2.5s. You can't be "good" if only your median is good — the long tail matters. That's why reducing tail latency (slowest users, slowest devices) is often higher-leverage than shaving 50ms off an already-fast experience.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "three experiences" picture</h3>
<div class="diagram">
<pre>
  LCP ─── "When do I see it?"
           │
           └── Server, network, CSS/JS blocking, hero image speed

  INP ─── "Does it respond to me?"
           │
           └── JS long tasks, event handlers, main-thread hogs

  CLS ─── "Does it stay still?"
           │
           └── Image dimensions, font swaps, late-injected content
</pre>
</div>

<h3>The "time budget" picture</h3>
<p>For a "good" LCP of 2.5s on 4G mobile, a rough budget:</p>
<ul>
  <li>DNS + connect: 200ms</li>
  <li>Server response (TTFB): 200-600ms</li>
  <li>Download HTML: 100-300ms</li>
  <li>Parse HTML, fetch CSS/JS/fonts, render: 600-1000ms</li>
  <li>Paint LCP element: start of that budget</li>
</ul>
<p>Budget blows out on: slow TTFB, big JS bundle, render-blocking CSS, hero image that's huge or late to load.</p>

<h3>The "INP breakdown" picture</h3>
<div class="diagram">
<pre>
  user presses key or taps
       │
       ├── Input delay (main thread busy) ─── could be 0 or hundreds of ms
       │
       ├── Event processing (your handlers run)
       │
       ├── Presentation delay (render + paint)
       │
       ▼
  next paint visible to user
</pre>
</div>
<p>If INP is bad, ask: which phase is slow? Input delay → main thread was busy (long task was running). Processing → your handlers are expensive. Presentation → React render + commit were slow or there are many DOM ops.</p>

<h3>The "CLS score components" picture</h3>
<pre><code>Layout shift score = impact fraction × distance fraction

impact fraction   = (union of viewport areas occupied by moving elements, before + after) / viewport area
distance fraction = (largest move distance, any moving element) / max(viewport height, viewport width)</code></pre>
<p>A shift from (0,0) to (0,400) in a 800px-tall viewport on an element that takes 200px of viewport height: impact = (200+200-overlap)/viewport ≈ 0.5, distance = 400/800 = 0.5, shift = 0.25.</p>

<h3>The "RUM pipeline" picture</h3>
<div class="diagram">
<pre>
  Browser: PerformanceObserver → collect {lcp, inp, cls}
       │
       ▼
  Batch + encode (on pagehide or via sendBeacon)
       │
       ▼
  Your RUM endpoint / Sentry / Datadog / GA
       │
       ▼
  Dashboard: p75 by URL, country, device type, etc.
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Lighthouse score is Core Web Vitals." No — Lighthouse is a lab test on one device with one network profile. CWV scoring for search ranking uses the Chrome UX Report field data (CrUX) — real users. They often differ significantly. Track both and know which is which.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Measuring CWV in code</h3>
<p>The canonical library is Google's <code>web-vitals</code> (~2 KB). It handles observer timing, session windows for CLS, reporting on pagehide:</p>
<pre><code class="language-js">import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  navigator.sendBeacon('/vitals', JSON.stringify(metric));
}

onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);</code></pre>

<h3>Manual PerformanceObserver for LCP</h3>
<pre><code class="language-js">let lcp;
new PerformanceObserver((list) =&gt; {
  const entries = list.getEntries();
  const last = entries[entries.length - 1];
  lcp = last.startTime;
}).observe({ type: 'largest-contentful-paint', buffered: true });

addEventListener('visibilitychange', () =&gt; {
  if (document.visibilityState === 'hidden' &amp;&amp; lcp) {
    navigator.sendBeacon('/lcp', JSON.stringify({ lcp }));
  }
});</code></pre>

<h3>Measuring INP (requires event timing)</h3>
<pre><code class="language-js">let worstInp = 0;
new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    if (entry.duration &gt; worstInp) worstInp = entry.duration;
  }
}).observe({ type: 'event', buffered: true, durationThreshold: 40 });</code></pre>
<p>INP's official reporting excludes the first interactions' outliers and uses high-percentile selection. Use <code>web-vitals</code> for correct semantics.</p>

<h3>Measuring CLS</h3>
<pre><code class="language-js">let cls = 0;
new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) cls += entry.value;
  }
}).observe({ type: 'layout-shift', buffered: true });</code></pre>
<p>The "user-initiated" shifts (within 500ms of input) are excluded — scrolling into new content or clicking a button that changes layout doesn't count against you.</p>

<h3>Optimizing LCP</h3>
<ol>
  <li><strong>Reduce TTFB.</strong> CDN, server caching, edge rendering, faster DB queries.</li>
  <li><strong>Avoid render-blocking resources.</strong> Inline critical CSS, defer non-critical scripts, preload fonts.</li>
  <li><strong>Prioritize the LCP element.</strong> Add <code>fetchpriority="high"</code> to hero images. Discoverable via HTML (not lazy-loaded, not behind JS).</li>
  <li><strong>Use modern formats.</strong> WebP/AVIF for images; compress appropriately for viewport size.</li>
  <li><strong>Serve responsive images.</strong> <code>&lt;img srcset=... sizes=...&gt;</code> so mobile doesn't download desktop pixels.</li>
  <li><strong>Preconnect</strong> to image CDN early.</li>
</ol>

<h3>Optimizing INP</h3>
<ol>
  <li><strong>Break up long tasks.</strong> Any task &gt; 50ms blocks input. Split with <code>await</code> boundaries, <code>scheduler.yield()</code>, <code>setTimeout(0)</code>, or chunked loops.</li>
  <li><strong>Use React's <code>startTransition</code></strong> to mark heavy state updates as non-urgent; the main input path stays responsive.</li>
  <li><strong>Optimize event handlers.</strong> Don't do synchronous expensive work on click/keydown — defer to rAF or idle callback.</li>
  <li><strong>Reduce JS bundle size.</strong> Less code = less parse/compile time = shorter tasks.</li>
  <li><strong>Move heavy work off main thread.</strong> Web Workers for JSON parsing, cryptography, data processing.</li>
  <li><strong>Hydrate less.</strong> RSC + islands architecture ships only interactive components' JS.</li>
</ol>

<h3>Optimizing CLS</h3>
<ol>
  <li><strong>Set dimensions on images and videos.</strong> <code>width</code>/<code>height</code> attributes, or <code>aspect-ratio</code> CSS.</li>
  <li><strong>Reserve space for ads and embeds.</strong> Pre-measure slot size.</li>
  <li><strong>Avoid inserting content above existing content.</strong> If you must (banner, toast), use <code>position: fixed</code> or <code>transform</code>.</li>
  <li><strong>Use <code>font-display: optional</code></strong> or match fallback metrics via <code>size-adjust</code> / <code>ascent-override</code>.</li>
  <li><strong>Animate with <code>transform</code>, not layout properties.</strong></li>
  <li><strong>Reserve skeleton space</strong> for async content.</li>
</ol>

<h3>Common LCP killers</h3>
<ul>
  <li>Hero image served from unoptimized CDN.</li>
  <li>Hero image loaded lazily (<code>loading="lazy"</code> on above-the-fold).</li>
  <li>Hero is a background-image in CSS (not discoverable by preload scanner).</li>
  <li>LCP candidate becomes available only after client-side fetch resolves.</li>
  <li>Big render-blocking stylesheet from a slow CDN.</li>
</ul>

<h3>Common INP killers</h3>
<ul>
  <li>JSON.parse of a large payload in an event handler.</li>
  <li>A giant list re-rendering in React on every keystroke.</li>
  <li>A third-party analytics script that executes a long task on click.</li>
  <li>Synchronous XHR (forbidden in modern browsers but still in some legacy libs).</li>
  <li>A memoization regression causing 1000 fibers to re-render per input.</li>
</ul>

<h3>Common CLS killers</h3>
<ul>
  <li>Image tags without width/height.</li>
  <li>Late-loading web fonts with metric mismatch.</li>
  <li>Ads or iframes injected with no reserved space.</li>
  <li>"Cookie banner appears 2s after load" pushing everything down.</li>
  <li>Carousels adding items dynamically with layout impact.</li>
</ul>

<h3>Tooling inventory</h3>
<ul>
  <li><strong>Lighthouse</strong> (DevTools and PageSpeed Insights) — lab runs, scores, actionable diagnostics.</li>
  <li><strong>WebPageTest</strong> — detailed waterfalls, filmstrip, custom networks.</li>
  <li><strong>Chrome UX Report (CrUX)</strong> — public real-user data for popular sites.</li>
  <li><strong>PageSpeed Insights</strong> — combines Lighthouse + CrUX.</li>
  <li><strong>Search Console → Core Web Vitals report</strong> — per-URL CrUX for your site.</li>
  <li><strong>web-vitals library</strong> for RUM.</li>
  <li><strong>Chrome DevTools Performance panel</strong> — debug individual interactions.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — preload hero image</h3>
<pre><code class="language-html">&lt;link rel="preload" as="image" href="/hero.webp" fetchpriority="high" /&gt;
&lt;img src="/hero.webp" alt="" width="1200" height="600" fetchpriority="high" /&gt;</code></pre>

<h3>Example 2 — responsive images with srcset</h3>
<pre><code class="language-html">&lt;img
  src="/hero-800.webp"
  srcset="/hero-400.webp 400w, /hero-800.webp 800w, /hero-1600.webp 1600w"
  sizes="(max-width: 768px) 100vw, 800px"
  width="1600" height="800" alt=""
  fetchpriority="high" /&gt;</code></pre>

<h3>Example 3 — aspect-ratio reservation</h3>
<pre><code class="language-css">.hero-img {
  aspect-ratio: 16/9;
  width: 100%;
  height: auto;
}</code></pre>

<h3>Example 4 — font-display optional + preload</h3>
<pre><code class="language-html">&lt;link rel="preload" as="font" href="/fonts/inter.woff2" type="font/woff2" crossorigin /&gt;
&lt;style&gt;
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: optional;
}
&lt;/style&gt;</code></pre>

<h3>Example 5 — matching fallback font metrics (reduces CLS)</h3>
<pre><code class="language-css">@font-face {
  font-family: 'Inter-fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
body { font-family: 'Inter', 'Inter-fallback', system-ui, sans-serif; }</code></pre>

<h3>Example 6 — breaking a long task with yield</h3>
<pre><code class="language-js">async function processItems(items) {
  for (let i = 0; i &lt; items.length; i++) {
    heavyWork(items[i]);
    if (i % 50 === 0) await yieldToMain();
  }
}
function yieldToMain() {
  return new Promise(resolve =&gt; setTimeout(resolve, 0));
}
// Better when supported:
// await scheduler.yield();</code></pre>

<h3>Example 7 — startTransition in React</h3>
<pre><code class="language-jsx">function Search({ items }) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState(items);
  const [pending, startTransition] = useTransition();
  return (
    &lt;input value={query} onChange={(e) =&gt; {
      setQuery(e.target.value);  // urgent — input stays responsive
      startTransition(() =&gt; {
        setFiltered(items.filter(i =&gt; i.includes(e.target.value)));
      });
    }} /&gt;
  );
}</code></pre>

<h3>Example 8 — web-vitals library</h3>
<pre><code class="language-js">import { onLCP, onINP, onCLS } from 'web-vitals';
const send = (m) =&gt; navigator.sendBeacon('/vitals', JSON.stringify({
  name: m.name, value: m.value, id: m.id, rating: m.rating,
}));
onLCP(send); onINP(send); onCLS(send);</code></pre>

<h3>Example 9 — reserve space for async content</h3>
<pre><code class="language-jsx">function Card() {
  const { data, isLoading } = useQuery(...);
  return (
    &lt;div style={{ minHeight: 200 }}&gt;
      {isLoading ? &lt;Skeleton/&gt; : &lt;Content data={data}/&gt;}
    &lt;/div&gt;
  );
}
// minHeight prevents layout shift when Skeleton → Content transition happens.</code></pre>

<h3>Example 10 — fetchpriority to prioritize LCP image</h3>
<pre><code class="language-html">&lt;img src="/hero.webp" fetchpriority="high" alt="" /&gt;
&lt;img src="/thumb1.webp" fetchpriority="low" alt="" /&gt;
&lt;img src="/thumb2.webp" fetchpriority="low" alt="" /&gt;</code></pre>

<h3>Example 11 — moving JSON.parse off main thread</h3>
<pre><code class="language-js">// BAD: 5 MB JSON parse blocks main thread 300ms
const data = JSON.parse(bigJsonString);

// GOOD: parse in Worker
const worker = new Worker('/parse-worker.js');
worker.postMessage(bigJsonString);
worker.onmessage = (e) =&gt; setData(e.data);

// parse-worker.js:
self.onmessage = (e) =&gt; self.postMessage(JSON.parse(e.data));</code></pre>

<h3>Example 12 — chunked list rendering</h3>
<pre><code class="language-js">async function renderLargeList(items) {
  const CHUNK = 100;
  for (let i = 0; i &lt; items.length; i += CHUNK) {
    renderChunk(items.slice(i, i + CHUNK));
    await new Promise(r =&gt; requestAnimationFrame(r));
  }
}</code></pre>

<h3>Example 13 — CLS-safe banner insertion</h3>
<pre><code class="language-css">.banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  transform: translateY(-100%);
  transition: transform 0.3s;
}
.banner.visible { transform: translateY(0); }
/* Fixed + transform → no layout impact on content below */</code></pre>

<h3>Example 14 — Lighthouse CI in GitHub Actions</h3>
<pre><code class="language-yaml">- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://preview.example.com/
      https://preview.example.com/product/1
    uploadArtifacts: true
    temporaryPublicStorage: true
# Fails PR if budgets are exceeded.</code></pre>

<h3>Example 15 — RUM with context</h3>
<pre><code class="language-js">onLCP((m) =&gt; {
  navigator.sendBeacon('/vitals', JSON.stringify({
    ...m,
    url: location.pathname,
    connection: navigator.connection?.effectiveType,
    device: navigator.userAgent,
    timestamp: Date.now(),
  }));
});</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. LCP candidate changes during load</h3>
<p>The largest element changes as content progressively loads. Browser keeps updating until user interacts. If a late-arriving hero image becomes largest, it resets the clock — the LCP is its paint time, which may be bad.</p>

<h3>2. LCP can be text — don't overlook it</h3>
<p>Big headlines often qualify as LCP. Custom fonts that render late can hurt text LCP. Optimize font loading too.</p>

<h3>3. Background-image LCP</h3>
<p>If your "hero" is a CSS <code>background-image</code>, the preload scanner won't find it until CSS is parsed and styles resolved. Preload it explicitly, or switch to <code>&lt;img&gt;</code>.</p>

<h3>4. CLS from scrollbars</h3>
<p>Content without <code>overflow</code> causing a scrollbar to appear shifts layout. Set <code>overflow-y: scroll</code> to always reserve scrollbar space, or use <code>scrollbar-gutter: stable</code>.</p>

<h3>5. Dynamic viewport resize on mobile</h3>
<p>Pulling down the URL bar changes viewport height (dvh vs vh). <code>100vh</code> elements shift. Use <code>100dvh</code> (dynamic viewport) or <code>100svh</code> (small viewport).</p>

<h3>6. Bot traffic polluting RUM</h3>
<p>Headless bots have weird timing. Filter out by user-agent, or use Google's method: ignore <code>loadEventEnd === 0</code> sessions.</p>

<h3>7. iOS's different INP characteristics</h3>
<p>Safari on iOS sometimes reports different INP than Chrome on Android. Device and JS engine differences. Sample per platform in RUM.</p>

<h3>8. Back-forward cache (bfcache) affects metrics</h3>
<p>When the user navigates back and the page is restored from bfcache, a "restore" event fires. <code>web-vitals</code> handles this; if you're instrumenting manually, capture the restore case or you'll miss metrics.</p>

<h3>9. CLS within the first 500ms of input is exempt</h3>
<p>User-initiated shifts (modal opening, accordion expanding) don't count. The browser checks <code>hadRecentInput</code>. This means clicks that cause layout are fine.</p>

<h3>10. Single-page app navigations and CWV</h3>
<p>Historically, SPA navigations didn't get new CWV measurements — CWV was per hard page load. The new "soft navigation" API (experimental) extends CWV to SPAs.</p>

<h3>11. Lab-field divergence</h3>
<p>Lighthouse predicts LCP based on simulated throttling. Actual user devices and networks vary widely. A p75 LCP of 3s in field can coexist with Lighthouse LCP of 1.5s. Trust the field; use the lab to debug.</p>

<h3>12. CLS during infinite scroll</h3>
<p>Adding items to a list as you scroll doesn't count as CLS (user-initiated). But if you accidentally modify layout above the scroll position, that does count.</p>

<h3>13. Web fonts and LCP text</h3>
<p>If LCP is text rendered in a web font, LCP measures the paint WITH the font applied (if the font arrives in time) or without (if fallback renders first then swaps — two paint events, two LCP candidates). <code>font-display: optional</code> avoids the swap entirely.</p>

<h3>14. Preload without using the resource quickly</h3>
<p>If you preload something but don't actually use it within ~3s, Chrome warns in console. Preloads are high-priority fetches; wasting them slows other resources.</p>

<h3>15. fetchpriority on multiple images</h3>
<p>If you mark many images as <code>fetchpriority="high"</code>, none of them is actually prioritized. Use high for one or two (the LCP candidate), low for the rest.</p>

<h3>16. Animation triggering layout in every frame</h3>
<p>An element animating <code>top</code> at 60fps causes 60 layouts/sec. You might not hit the "long task" threshold per frame but the CPU is hammered. Switch to transform.</p>

<h3>17. Third-party scripts causing long tasks</h3>
<p>A tag manager firing 15 analytics scripts on click can create a 200ms long task. You need to audit third parties' behavior, not just your own. Consider <code>Partytown</code> (run third parties in a worker).</p>

<h3>18. Hydration mismatches → CLS</h3>
<p>In SSR, if client render differs from server HTML, React replaces the mismatched subtree on hydration — visible as a layout shift. Fix the mismatch (useEffect for client-only values, stable IDs via useId).</p>

<h3>19. Late third-party script injecting content</h3>
<p>A chat widget that appears 5 seconds after load adds a bubble in the corner. If it pushes content (doesn't use <code>position: fixed</code>), CLS penalty.</p>

<h3>20. Slow DNS/TCP to third-party origins</h3>
<p>Every third-party origin needs DNS + TCP + TLS. Five analytics vendors = five full round-trips. Use <code>preconnect</code> to the critical ones, eliminate the non-critical ones.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — lazy-loading the LCP image</h3>
<pre><code class="language-html">&lt;img src="hero.webp" loading="lazy" /&gt;</code></pre>
<p>Defers the fetch → LCP suffers. <code>loading="lazy"</code> is for below-the-fold only. Use <code>loading="eager"</code> (default) + <code>fetchpriority="high"</code> for the hero.</p>

<h3>Anti-pattern 2 — client-side rendering a static hero</h3>
<p>If your hero image comes from a <code>useEffect</code> fetch, it's delayed by JS download + execution + request. Render it in HTML directly, or SSR it.</p>

<h3>Anti-pattern 3 — CSS-background hero</h3>
<pre><code class="language-css">.hero { background-image: url(hero.jpg); }</code></pre>
<p>Preload scanner can't find it. Preload explicitly, or use <code>&lt;img&gt;</code>.</p>

<h3>Anti-pattern 4 — images without dimensions</h3>
<p>CLS for every image that loads. Always specify width/height or aspect-ratio.</p>

<h3>Anti-pattern 5 — one long task per click</h3>
<p>A click runs 500ms of JS → INP ≥ 500ms. Break with async/await yields, web workers, startTransition.</p>

<h3>Anti-pattern 6 — debounced-input that still renders a 10k-row list on every press</h3>
<p>Debouncing doesn't help if the render itself is slow. Virtualize the list, transition the filter, or both.</p>

<h3>Anti-pattern 7 — unused JS in the critical path</h3>
<p>Shipping 500KB of admin dashboard code on the logged-out marketing page. Code-split by route.</p>

<h3>Anti-pattern 8 — unoptimized font subsets</h3>
<p>Shipping the full Inter font (400KB) when you only use Latin + Latin-ext. Subset to &lt; 60KB.</p>

<h3>Anti-pattern 9 — layout-triggering animations</h3>
<p>Animating <code>width</code>, <code>height</code>, <code>top</code>, <code>left</code>, <code>margin</code>. 60fps dropped. Use transform.</p>

<h3>Anti-pattern 10 — synchronous analytics on events</h3>
<pre><code class="language-js">button.onclick = () =&gt; { analytics.track('click'); handleClick(); };</code></pre>
<p>Analytics may be slow. Fire async: <code>setTimeout(() =&gt; analytics.track('click'), 0); handleClick();</code> or use a lib that batches on idle.</p>

<h3>Anti-pattern 11 — CLS from cookie banners</h3>
<p>"Cookie banner appears after 1s, pushes all content down." Reserve space at the top, or use <code>position: fixed</code>.</p>

<h3>Anti-pattern 12 — lighthouse-only optimization</h3>
<p>Team optimizes until Lighthouse shows 100, but real-user p75 LCP is still 3.5s. Lab ≠ field. Track CrUX/RUM, optimize what users actually see.</p>

<h3>Anti-pattern 13 — no budget, no CI</h3>
<p>Perf regresses slowly over months. Set budgets (bundle size, LCP target) in CI; fail PRs that blow them.</p>

<h3>Anti-pattern 14 — preloading everything</h3>
<p>Preload is high-priority. Preloading 20 resources reduces browser's ability to prioritize the truly critical ones. Preload 1-3 at most (hero image, hero font, critical CSS).</p>

<h3>Anti-pattern 15 — ignoring mobile</h3>
<p>Perf is typically 3-10× worse on mobile. 4G and mid-tier Android phones are your real benchmark, not a M1 MacBook on fiber.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Name and define the Core Web Vitals.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>LCP</strong> — Largest Contentful Paint. Time until the largest above-the-fold element paints. Target p75 &lt; 2.5s.</li>
      <li><strong>INP</strong> — Interaction to Next Paint. Worst-case latency from user input to next paint, across the session. Replaced FID in March 2024. Target p75 &lt; 200ms.</li>
      <li><strong>CLS</strong> — Cumulative Layout Shift. Sum of unexpected visible layout shifts. Target p75 &lt; 0.1.</li>
    </ul>
    <p>Plus supporting metrics (TTFB, FCP, FID for legacy) that feed into the three above.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why did Google replace FID with INP?</div>
  <div class="qa-answer">
    <p>FID measured only the FIRST input delay — if your first click was fast but subsequent clicks froze for 500ms, FID still looked good. INP measures the WORST-CASE latency across all interactions in the session, catching the real responsiveness profile. More representative of user experience, especially for SPAs where users interact many times without a hard navigation.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. You're told LCP is bad. How do you diagnose?</div>
  <div class="qa-answer">
    <ol>
      <li>Run Lighthouse or PageSpeed Insights to identify the LCP element.</li>
      <li>DevTools Performance → record the load; find the LCP marker and trace what's blocking it.</li>
      <li>Break down the time: TTFB, blocking resources, request for LCP element, render.</li>
      <li>Fix matrix:
        <ul>
          <li>TTFB high → CDN, server cache, edge rendering.</li>
          <li>CSS blocking → inline critical CSS, preload non-critical.</li>
          <li>Hero image late → preload, fetchpriority=high, WebP/AVIF, responsive srcset.</li>
          <li>Element only rendered after JS fetch → SSR or RSC it.</li>
          <li>Background-image hero → make it an <code>&lt;img&gt;</code>.</li>
        </ul>
      </li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. A user reports the app feels laggy. INP is 600ms. What's your plan?</div>
  <div class="qa-answer">
    <ol>
      <li>Record a DevTools Performance trace during the slow interaction.</li>
      <li>Look at the event's breakdown: input delay (main thread busy before event), processing (handler code), presentation (paint after).</li>
      <li>Input delay high → something else was running. Find and optimize the long task.</li>
      <li>Processing high → your handler does too much sync work. Split with await, defer to rAF, move to Worker.</li>
      <li>Presentation high → React is re-rendering too much. Profile with React DevTools; memoize heavy children; virtualize lists; try <code>startTransition</code>.</li>
      <li>Measure after each change; INP should drop below 200ms for the p75.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you reduce CLS?</div>
  <div class="qa-answer">
    <ul>
      <li>Specify <code>width</code>/<code>height</code> or <code>aspect-ratio</code> on images, videos, iframes.</li>
      <li>Reserve space for ads/embeds/skeletons (<code>min-height</code>).</li>
      <li>Avoid inserting content above existing content; use fixed/absolute positioning for banners.</li>
      <li>Use <code>font-display: optional</code> or match fallback font metrics (<code>size-adjust</code>, <code>ascent-override</code>).</li>
      <li>Animate with <code>transform</code>, not layout properties.</li>
      <li>Fix hydration mismatches in SSR.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Lab vs Field data — what's the difference and which matters?</div>
  <div class="qa-answer">
    <p>Lab: one synthetic run on one device/network (Lighthouse). Deterministic, repeatable, great for debugging a specific regression. Field: real-user measurements aggregated across all sessions (CrUX, RUM). Captures the actual distribution users experience. Google uses field data for search ranking. Recommendation: optimize the metrics that RUM shows are bad; use lab to debug specific scenarios you're trying to fix.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What's the p75 threshold rule?</div>
  <div class="qa-answer">
    <p>Google evaluates CWV at the 75th percentile of real-user sessions. A page "passes" for a metric only if 75% of sessions were in the "good" range. You can't median your way through — tail latency matters. The implication: improving the 25% slowest users is often higher-leverage than shaving 100ms off the median.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How would you set up RUM for CWV?</div>
  <div class="qa-answer">
    <p>Use Google's <code>web-vitals</code> library (~2 KB). Call <code>onLCP</code>, <code>onINP</code>, <code>onCLS</code>, etc. In each callback, <code>sendBeacon</code> a payload to your endpoint with the metric value, ID, rating, plus context (URL, connection type, device). Aggregate server-side by URL and percentile. Display p75 per page in a dashboard. Alert on regressions. Supplement with Lighthouse CI for lab testing in PR pipelines.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What's <code>fetchpriority</code> and when do you use it?</div>
  <div class="qa-answer">
    <p>An HTML attribute (and preload hint) that signals resource priority: <code>high</code>, <code>low</code>, or <code>auto</code>. Browsers have internal priority heuristics — images default low-ish, stylesheets high — but you know your page better. Common use: <code>fetchpriority="high"</code> on the hero image; <code>fetchpriority="low"</code> on below-the-fold thumbnails to let the hero win. Don't mark many resources as high; priority is relative.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Your page's LCP is an &lt;img&gt; that comes from an API. How do you optimize?</div>
  <div class="qa-answer">
    <ol>
      <li>SSR the image URL directly in HTML, not via client-side fetch.</li>
      <li>If the URL is unknown until logged-in, consider a signed CDN URL you can compute at edge.</li>
      <li>Preload the image with <code>&lt;link rel="preload" as="image"&gt;</code>.</li>
      <li>Use modern format (WebP/AVIF) served via content negotiation.</li>
      <li>Compress aggressively — hero at 80KB vs 500KB is a real LCP difference.</li>
      <li>Responsive: <code>srcset</code> for different viewport sizes.</li>
      <li>Add <code>fetchpriority="high"</code>.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How does React's <code>startTransition</code> help INP?</div>
  <div class="qa-answer">
    <p>Wraps state updates as low-priority. React yields during the subsequent render to process urgent updates (input, animations). An expensive tree render that would block the input response is split — input stays responsive, heavy render completes as microtasks permit. INP measures worst-case; shaving render time off the main path directly reduces it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Describe an image optimization pipeline.</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Format</strong>: AVIF (best compression) with WebP fallback with JPEG fallback via <code>&lt;picture&gt;</code>.</li>
      <li><strong>Responsive</strong>: <code>srcset</code> + <code>sizes</code> so mobile doesn't download desktop pixels.</li>
      <li><strong>Dimensions</strong>: always specify, or use <code>aspect-ratio</code>.</li>
      <li><strong>Priority</strong>: <code>fetchpriority="high"</code> on hero; <code>loading="lazy"</code> below the fold.</li>
      <li><strong>Decode</strong>: <code>decoding="async"</code>.</li>
      <li><strong>CDN with on-the-fly resize</strong>: Cloudinary, Imgix, Cloudflare Images — serves the right variant automatically.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What affects TTFB and how do you optimize it?</div>
  <div class="qa-answer">
    <p>TTFB = DNS + TCP + TLS + server processing + first byte of response. Optimizations:</p>
    <ul>
      <li>Use a CDN (most bytes served from edge, not origin).</li>
      <li>Cache HTML at the edge when possible (ISR in Next.js).</li>
      <li>Reduce server-side rendering work (lighter components, cached queries, RSC streaming).</li>
      <li>Database / API latency (connection pooling, read replicas, query optimization).</li>
      <li>HTTP/2 or HTTP/3 for better connection reuse and faster over lossy networks.</li>
      <li>Early Hints (103) to let the browser start fetching subresources while server is still computing HTML.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Your RUM shows great median but p95 LCP is 8 seconds. What's likely happening?</div>
  <div class="qa-answer">
    <p>Long-tail users — poor networks, low-end devices, or slow third-party resources. Look at breakdown by country, connection effective type, device category. Common culprits: 3G users, old Androids, image CDNs slow in some regions, blocking third-party scripts on legacy devices. Fix: reduce payload (tree-shaking, aggressive image compression), defer third parties, consider conditional loading based on network quality (<code>navigator.connection.effectiveType</code>).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What's Partytown and when would you use it?</div>
  <div class="qa-answer">
    <p>A library that relocates third-party scripts (analytics, tag managers, ads) to a Web Worker, removing them from the main thread. They see a proxied DOM and document via sync messaging. Main thread stays responsive; your INP benefits. Tradeoff: some third parties don't work correctly in a worker. Best fit: scripts that do heavy async work and don't need synchronous DOM access — GA, GTM, Hotjar, Mixpanel. Less suitable for scripts that need to inject visible UI immediately.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You know LCP / INP / CLS, thresholds, and what "p75" means.</li>
    <li>You know FID was replaced by INP in March 2024.</li>
    <li>You distinguish lab (Lighthouse) from field (CrUX/RUM).</li>
    <li>You have a specific fix playbook per metric.</li>
    <li>You mention <code>fetchpriority</code>, preload, responsive srcset, modern formats.</li>
    <li>You use the web-vitals library for RUM.</li>
    <li>You optimize for the slowest users, not just the median.</li>
    <li>You know third-party scripts often dominate INP; Partytown / async are tools.</li>
  </ul>
</div>
`}

]
});
