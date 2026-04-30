window.PREP_SITE.registerTopic({
  id: 'web-cwv',
  module: 'web',
  title: 'Core Web Vitals',
  estimatedReadTime: '40 min',
  tags: ['core-web-vitals', 'cwv', 'lcp', 'inp', 'cls', 'fcp', 'ttfb', 'web-vitals', 'performance'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Core Web Vitals (CWV)</strong> are Google's standardized metrics for user-perceived web performance. They power Search ranking signals and are the closest thing to an industry-wide rubric for "how fast and stable does this page feel?" The current trio: <strong>LCP</strong> (loading), <strong>INP</strong> (interactivity, replaced FID in March 2024), <strong>CLS</strong> (visual stability).</p>
<ul>
  <li><strong>LCP — Largest Contentful Paint:</strong> time from navigation to the largest element painted above-the-fold. Target: <strong>≤ 2.5s</strong>.</li>
  <li><strong>INP — Interaction to Next Paint:</strong> the worst-case latency from user input to next paint, measured across the page lifetime. Target: <strong>≤ 200ms</strong>.</li>
  <li><strong>CLS — Cumulative Layout Shift:</strong> sum of unexpected layout shift scores throughout the page lifetime. Target: <strong>≤ 0.1</strong>.</li>
  <li><strong>Other vitals:</strong> FCP, TTFB, TTI, TBT — supporting metrics, not Core but tracked.</li>
  <li><strong>Why they matter:</strong> Google Search ranks them; user behavior correlates strongly (slow pages = bounce); business metrics (conversion, revenue) follow.</li>
  <li><strong>Two data sources:</strong> <em>Lab</em> (Lighthouse, simulated) and <em>Field</em> (real users via CrUX or web-vitals lib). Field is what counts for ranking.</li>
  <li><strong>Common wins:</strong> preload LCP image; defer non-critical JS; reserve image dimensions; debounce expensive handlers; replace blocking requests with async.</li>
  <li><strong>Mobile reality:</strong> Mobile network + CPU is the bottleneck. Always optimize for the median Android user.</li>
</ul>
<p><strong>Mantra:</strong> "LCP for loading, INP for responsiveness, CLS for stability. Measure with web-vitals lib in the field. Real users on real devices."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The history of Core Web Vitals</h3>
<table>
  <thead><tr><th>Year</th><th>Event</th></tr></thead>
  <tbody>
    <tr><td>2017</td><td>Google introduces Lighthouse, codifies "performance audit" via single score.</td></tr>
    <tr><td>2020</td><td>Google announces Core Web Vitals: LCP, FID, CLS. Becomes a Search ranking signal.</td></tr>
    <tr><td>2021</td><td>CWV becomes part of "Page Experience" Search ranking.</td></tr>
    <tr><td>2022</td><td>INP introduced as experimental.</td></tr>
    <tr><td>March 2024</td><td>INP replaces FID as the official Core Web Vital.</td></tr>
  </tbody>
</table>

<h3>Why these three</h3>
<ul>
  <li><strong>Loading (LCP):</strong> "Did the page show up?"</li>
  <li><strong>Interactivity (INP):</strong> "Does it respond when I tap?"</li>
  <li><strong>Stability (CLS):</strong> "Does it stay still while I read?"</li>
</ul>
<p>Together they capture the user's three biggest complaints about modern web experiences.</p>

<h3>What FID was, why INP replaced it</h3>
<p>FID (First Input Delay) measured only the <em>first</em> interaction's delay. INP measures the <em>worst</em> interaction across the entire page lifetime. Reason: pages can be initially fast (good FID) but slow on subsequent clicks (bad real-user experience). INP catches that.</p>

<h3>The thresholds</h3>
<table>
  <thead><tr><th>Metric</th><th>Good</th><th>Needs Improvement</th><th>Poor</th></tr></thead>
  <tbody>
    <tr><td>LCP</td><td>≤ 2.5s</td><td>2.5s - 4.0s</td><td>&gt; 4.0s</td></tr>
    <tr><td>INP</td><td>≤ 200ms</td><td>200ms - 500ms</td><td>&gt; 500ms</td></tr>
    <tr><td>CLS</td><td>≤ 0.1</td><td>0.1 - 0.25</td><td>&gt; 0.25</td></tr>
    <tr><td>FCP (supporting)</td><td>≤ 1.8s</td><td>1.8s - 3.0s</td><td>&gt; 3.0s</td></tr>
    <tr><td>TTFB (supporting)</td><td>≤ 800ms</td><td>800ms - 1.8s</td><td>&gt; 1.8s</td></tr>
  </tbody>
</table>

<h3>How Google measures (CrUX)</h3>
<p>Chrome User Experience Report (CrUX) collects field data from real Chrome users (with browser data sharing enabled). Aggregated by URL, origin, country, device. Google Search uses the 75th percentile of CrUX as the ranking input.</p>
<p>So if 25% of your users have bad experience, your CWV is poor — even if median is fine.</p>

<h3>Why these matter for business</h3>
<ul>
  <li><strong>SEO:</strong> Direct ranking signal. Slow pages drop in search.</li>
  <li><strong>Conversion:</strong> 100ms of latency = 7% drop in conversion (Akamai). 1s = 11% page-view drop.</li>
  <li><strong>Bounce rate:</strong> users leave slow pages within seconds.</li>
  <li><strong>Brand:</strong> "this site feels broken" is durable.</li>
</ul>

<h3>Lab vs Field</h3>
<table>
  <thead><tr><th>Lab data</th><th>Field data</th></tr></thead>
  <tbody>
    <tr><td>Lighthouse, WebPageTest, Synthetic monitoring</td><td>web-vitals library, CrUX, RUM (real-user monitoring)</td></tr>
    <tr><td>Simulated network / CPU</td><td>Real users with real network and devices</td></tr>
    <tr><td>Reproducible</td><td>Statistical; varies per cohort</td></tr>
    <tr><td>Used for testing fixes</td><td>Used for ranking + business reporting</td></tr>
    <tr><td>Catches regressions in CI</td><td>Reveals what users actually experience</td></tr>
  </tbody>
</table>
<p>Both matter. Lab catches obvious regressions before deploy; field reveals what real users feel.</p>

<h3>What "good" looks like</h3>
<ul>
  <li>You measure with the <code>web-vitals</code> library in production; CWV land in your analytics.</li>
  <li>You have CWV alerts when p75 crosses thresholds.</li>
  <li>Your CI fails PRs that regress LCP / INP / CLS by more than X.</li>
  <li>You know the most impactful intervention per metric (preload for LCP; debounce for INP; reserve dimensions for CLS).</li>
  <li>You test on the median Android user, not your dev MacBook.</li>
  <li>You distinguish "load" performance (LCP, FCP, TTFB) from "post-load" (INP, CLS).</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>LCP — Largest Contentful Paint</h3>
<p>Time from navigation to the moment the largest visible content element above the fold paints. Eligible elements:</p>
<ul>
  <li>Images (img, background-image, video poster).</li>
  <li>Block-level text containing text nodes.</li>
  <li>video element (first frame).</li>
</ul>
<p>The "largest" is determined by visual size in the viewport. The browser updates the LCP candidate as elements load; when the page becomes interactive (or 500ms after the user interacts), LCP is finalized.</p>

<h3>The 4 sub-parts of LCP</h3>
<pre><code class="language-text">LCP = TTFB + Resource Load Delay + Resource Load Time + Element Render Delay

TTFB = Time to First Byte (server + DNS + connection)
Resource Load Delay = time from FCP-ish to when the resource starts loading
Resource Load Time = the actual fetch + decode
Element Render Delay = time after resource ready until paint
</code></pre>
<p>Optimizing LCP means attacking each part. Often the biggest win is "Resource Load Delay" — the LCP image isn't preloaded.</p>

<h3>INP — Interaction to Next Paint</h3>
<p>For each interaction (click, tap, key press), measure: time from user input to the browser's next paint. Take the worst of all such interactions across the page's life as INP. (Technically: 98th percentile for pages with many interactions.)</p>

<h3>The 3 sub-parts of INP</h3>
<pre><code class="language-text">INP = Input Delay + Processing Time + Presentation Delay

Input Delay = how long the input waited in the queue (main thread busy)
Processing Time = how long the event handler ran
Presentation Delay = time from end of handler to next paint (rendering work)
</code></pre>
<p>Most INP problems are Processing Time (slow handlers) or Input Delay (long tasks before the click).</p>

<h3>CLS — Cumulative Layout Shift</h3>
<p>Sum of layout shift scores across the page lifetime, except shifts within 500ms of user interaction (those are usually intentional).</p>

<p>Layout shift score = impact fraction × distance fraction:</p>
<ul>
  <li>Impact = portion of viewport affected by movement.</li>
  <li>Distance = how far elements moved as a fraction of viewport.</li>
</ul>
<p>If a 200px-tall element moves 100px on a 1000px viewport: impact = 0.3, distance = 0.1, score = 0.03.</p>

<h3>Why CLS is fractional</h3>
<p>It's a unitless ratio, not "pixels moved." Scaled to the viewport so CLS is comparable across screen sizes.</p>

<h3>Common CLS causes</h3>
<table>
  <thead><tr><th>Cause</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>Images without dimensions</td><td>Set width/height attributes; or aspect-ratio CSS</td></tr>
    <tr><td>Late-loading custom fonts</td><td>font-display: optional / swap with size-adjust</td></tr>
    <tr><td>Ads / iframes injecting</td><td>Reserve placeholder space</td></tr>
    <tr><td>Dynamic content above existing</td><td>Add content below or via overlay</td></tr>
    <tr><td>Animations of layout properties</td><td>Use transform instead</td></tr>
  </tbody>
</table>

<h3>The metric tree</h3>
<pre><code class="language-text">Loading metrics:
  TTFB     → server response time
  FCP      → first text/image painted
  LCP      → largest above-fold element painted (CWV)

Interactivity metrics:
  TTI      → time-to-interactive (lab only)
  TBT      → total blocking time (lab only)
  INP      → worst-case interaction latency (CWV; field)

Stability metrics:
  CLS      → cumulative layout shift (CWV)
</code></pre>

<h3>Field measurement — the web-vitals library</h3>
<pre><code class="language-js">import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);

// Output:
// {
//   name: 'LCP',
//   value: 1842,
//   delta: 1842,
//   id: 'v3-1234',
//   navigationType: 'navigate',
//   rating: 'good' | 'needs-improvement' | 'poor',
//   entries: [...]
// }
</code></pre>

<h3>Reporting to analytics</h3>
<pre><code class="language-js">import { onLCP, onINP, onCLS } from 'web-vitals';

function send(metric) {
  navigator.sendBeacon('/analytics', JSON.stringify(metric));
  // OR fetch with keepalive: true
}

onLCP(send);
onINP(send);
onCLS(send);
</code></pre>

<h3>The "p75" rule</h3>
<p>Google's CWV rating uses the 75th percentile of your real users. Designing for "median" is not enough; you need 75% of users to be in the green zone.</p>

<h3>Mobile vs desktop</h3>
<p>Google ranks mobile separately from desktop. Mobile thresholds are the same numbers, but achieving them on a 4G connection + median Android phone is harder. Test there.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Optimizing LCP</h3>

<h4>1. Preload the LCP resource</h4>
<pre><code class="language-html">&lt;link rel="preload" href="/hero.webp" as="image" fetchpriority="high" /&gt;
</code></pre>
<p>The single biggest LCP win for image-LCP pages.</p>

<h4>2. <code>fetchpriority="high"</code> on the LCP image</h4>
<pre><code class="language-html">&lt;img src="/hero.webp" fetchpriority="high" /&gt;
</code></pre>

<h4>3. Inline critical CSS</h4>
<p>Don't make LCP wait on external CSS. Inline the styles needed for above-the-fold content.</p>

<h4>4. Defer non-critical JS</h4>
<pre><code class="language-html">&lt;script src="/main.js" defer&gt;&lt;/script&gt;
</code></pre>

<h4>5. Server-side render or prerender</h4>
<p>SSR sends HTML on first byte; SPA waits for JS to render. SSR LCP is bounded by network; SPA LCP is bounded by JS.</p>

<h4>6. Resource hints to LCP origin</h4>
<pre><code class="language-html">&lt;link rel="preconnect" href="https://cdn.example.com" /&gt;
</code></pre>

<h4>7. Modern image formats</h4>
<pre><code class="language-html">&lt;picture&gt;
  &lt;source srcset="hero.avif" type="image/avif" /&gt;
  &lt;source srcset="hero.webp" type="image/webp" /&gt;
  &lt;img src="hero.jpg" alt="..." /&gt;
&lt;/picture&gt;
</code></pre>
<p>AVIF / WebP are 30-50% smaller than JPEG.</p>

<h4>8. Optimize TTFB</h4>
<p>If TTFB &gt; 800ms, no amount of front-end work fixes LCP. Optimize the server: caching, CDN edge, faster origin.</p>

<h4>9. Avoid lazy-loading the LCP image</h4>
<pre><code class="language-html">&lt;!-- BAD — defers LCP image --&gt;
&lt;img src="/hero.webp" loading="lazy" /&gt;

&lt;!-- GOOD --&gt;
&lt;img src="/hero.webp" fetchpriority="high" /&gt;
</code></pre>

<h3>Optimizing INP</h3>

<h4>1. Break up long tasks</h4>
<pre><code class="language-js">// BAD — 50ms+ task blocks input
function processAll(items) {
  for (const item of items) doExpensive(item);
}

// GOOD — yield to the browser
async function processAll(items) {
  for (const item of items) {
    doExpensive(item);
    await new Promise(r =&gt; setTimeout(r, 0));   // yield
  }
}

// MODERN — use scheduler.yield() (Chrome 129+)
async function processAll(items) {
  for (const item of items) {
    doExpensive(item);
    if (scheduler &amp;&amp; scheduler.yield) await scheduler.yield();
  }
}
</code></pre>

<h4>2. <code>requestIdleCallback</code> for non-critical work</h4>
<pre><code class="language-js">requestIdleCallback(() =&gt; {
  doNonCriticalWork();
});
</code></pre>

<h4>3. Web Workers for heavy compute</h4>
<pre><code class="language-js">const worker = new Worker('/work.js');
worker.postMessage(data);
worker.onmessage = (e) =&gt; useResult(e.data);
</code></pre>

<h4>4. Debounce expensive handlers</h4>
<pre><code class="language-js">const debouncedSearch = debounce(search, 300);
input.addEventListener('input', debouncedSearch);
</code></pre>

<h4>5. Move work to <code>requestAnimationFrame</code></h4>
<pre><code class="language-js">// In click handler — defers heavy work to next frame
button.addEventListener('click', () =&gt; {
  requestAnimationFrame(() =&gt; {
    expensiveDOM();
  });
});
</code></pre>

<h4>6. Use <code>scheduler.postTask</code></h4>
<pre><code class="language-js">scheduler.postTask(expensiveWork, { priority: 'background' });
</code></pre>

<h4>7. Hydrate progressively</h4>
<p>Frameworks like Astro, Qwik, React Server Components hydrate only what's interactive. Reduces initial JS execution that blocks early INP.</p>

<h3>Optimizing CLS</h3>

<h4>1. Always set image dimensions</h4>
<pre><code class="language-html">&lt;img src="..." width="800" height="600" alt="..." /&gt;
</code></pre>
<p>Or aspect-ratio CSS:</p>
<pre><code class="language-css">.thumb { aspect-ratio: 4 / 3; }
</code></pre>

<h4>2. Reserve space for ads/iframes</h4>
<pre><code class="language-css">.ad-slot {
  min-height: 250px;
}
</code></pre>

<h4>3. Avoid inserting content above existing content</h4>
<p>Don't display a banner that pushes the page down. Use overlays or notify in a fixed-position bar.</p>

<h4>4. font-display strategy</h4>
<pre><code class="language-css">@font-face {
  font-family: 'Inter';
  src: url('/inter.woff2') format('woff2');
  font-display: optional;   /* skip text render until font ready, with timeout */
}
</code></pre>
<p><code>font-display: swap</code> shows fallback then swaps; can cause CLS as text re-flows. <code>optional</code> is more CLS-friendly.</p>

<h4>5. <code>size-adjust</code> matching for fallbacks</h4>
<pre><code class="language-css">@font-face {
  font-family: 'InterFallback';
  size-adjust: 107%;   /* tune to match metrics of real font */
  src: local(Arial);
}
</code></pre>

<h4>6. Animate transforms not layout</h4>
<p>Transform animations don't shift layout; layout properties do.</p>

<h3>Measuring with web-vitals library</h3>
<pre><code class="language-bash">yarn add web-vitals
</code></pre>

<pre><code class="language-js">import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function send({ name, value, rating, navigationType }) {
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/cwv', JSON.stringify({ name, value, rating, navigationType }));
  }
}

onLCP(send);
onINP(send);
onCLS(send);
onFCP(send);
onTTFB(send);
</code></pre>

<h3>Aggregating in your analytics</h3>
<p>Backend receives metric events. Aggregate by:</p>
<ul>
  <li>Page (URL pattern).</li>
  <li>Country / connection type / device.</li>
  <li>Calculate p50, p75, p95 daily.</li>
</ul>
<p>Many tools (Google Analytics 4, Cloudflare RUM, Vercel Speed Insights, SpeedCurve, RUM frameworks) handle this for you.</p>

<h3>Lighthouse in CI</h3>
<pre><code class="language-yaml">- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun --upload.target=temporary-public-storage
</code></pre>
<p>Configure thresholds in <code>lighthouserc.json</code>; fail PRs that regress beyond budget.</p>

<h3>Targeted INP debugging</h3>
<pre><code class="language-js">// Log all interactions and their durations
new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    if (entry.duration &gt; 200) {
      console.warn('Slow interaction:', entry);
    }
  }
}).observe({ type: 'event', buffered: true, durationThreshold: 0 });
</code></pre>

<h3>Long Task observer</h3>
<pre><code class="language-js">new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    console.warn('Long task:', entry.duration, entry);
  }
}).observe({ entryTypes: ['longtask'] });
</code></pre>

<h3>LCP element identification</h3>
<pre><code class="language-js">new PerformanceObserver((list) =&gt; {
  const entries = list.getEntries();
  const last = entries[entries.length - 1];
  console.log('LCP element:', last.element);
  console.log('LCP time:', last.startTime);
}).observe({ type: 'largest-contentful-paint', buffered: true });
</code></pre>

<h3>CLS attribution</h3>
<pre><code class="language-js">new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      console.warn('CLS:', entry.value, 'caused by:', entry.sources);
    }
  }
}).observe({ type: 'layout-shift', buffered: true });
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Fix LCP via preload</h3>
<pre><code class="language-html">&lt;!-- Before — LCP ~ 4.2s --&gt;
&lt;link rel="stylesheet" href="/main.css" /&gt;
&lt;script src="/app.js" defer&gt;&lt;/script&gt;
...
&lt;img src="/hero.webp" /&gt;

&lt;!-- After — LCP ~ 2.1s --&gt;
&lt;link rel="preload" href="/hero.webp" as="image" fetchpriority="high" /&gt;
&lt;link rel="stylesheet" href="/main.css" /&gt;
&lt;script src="/app.js" defer&gt;&lt;/script&gt;
...
&lt;img src="/hero.webp" fetchpriority="high" /&gt;
</code></pre>

<h3>Example 2: Fix CLS via reserved dimensions</h3>
<pre><code class="language-html">&lt;!-- Before — CLS 0.18 (image swap pushes content) --&gt;
&lt;img src="..." /&gt;

&lt;!-- After — CLS 0.02 --&gt;
&lt;img src="..." width="800" height="600" alt="..." /&gt;
</code></pre>

<h3>Example 3: Fix INP via debounce</h3>
<pre><code class="language-js">// Before — keystroke triggers expensive search; INP ~ 600ms
input.addEventListener('input', (e) =&gt; {
  const results = expensiveSearch(e.target.value);
  renderResults(results);
});

// After — debounced; INP ~ 150ms
const debouncedSearch = debounce((q) =&gt; {
  const results = expensiveSearch(q);
  renderResults(results);
}, 200);
input.addEventListener('input', (e) =&gt; debouncedSearch(e.target.value));
</code></pre>

<h3>Example 4: Yielding for INP</h3>
<pre><code class="language-js">// Before — 80ms task per click; INP poor
button.addEventListener('click', () =&gt; {
  for (let i = 0; i &lt; 10000; i++) computeStep(i);
  render();
});

// After — yield between batches; INP good
button.addEventListener('click', async () =&gt; {
  for (let i = 0; i &lt; 10000; i += 100) {
    for (let j = i; j &lt; i + 100; j++) computeStep(j);
    await new Promise(r =&gt; setTimeout(r));   // yield
  }
  render();
});
</code></pre>

<h3>Example 5: Web Worker offload</h3>
<pre><code class="language-js">// main.js
const worker = new Worker('/heavy.js');

button.addEventListener('click', () =&gt; {
  worker.postMessage({ kind: 'compute', items });
});

worker.addEventListener('message', (e) =&gt; {
  render(e.data);
});

// heavy.js — runs on background thread
self.onmessage = (e) =&gt; {
  const { kind, items } = e.data;
  if (kind === 'compute') {
    const result = items.map(expensiveCalc);
    self.postMessage(result);
  }
};
</code></pre>

<h3>Example 6: Web-vitals reporting</h3>
<pre><code class="language-js">import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function reportToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: Math.round(metric.value),
    rating: metric.rating,
    navigationType: metric.navigationType,
    page: location.pathname,
    deviceClass: navigator.connection?.effectiveType,
  });
  navigator.sendBeacon?.('/api/cwv', body);
}

onLCP(reportToAnalytics);
onINP(reportToAnalytics);
onCLS(reportToAnalytics);
onFCP(reportToAnalytics);
onTTFB(reportToAnalytics);
</code></pre>

<h3>Example 7: Font-display optional</h3>
<pre><code class="language-css">/* Before — CLS spikes when font swaps */
@font-face {
  font-family: 'Inter';
  src: url('/inter.woff2');
  font-display: swap;
}

/* After — no CLS from font; renders fallback if font not ready in 100ms */
@font-face {
  font-family: 'Inter';
  src: url('/inter.woff2');
  font-display: optional;
}

/* Or use size-adjust to match fallback to real font's metrics */
@font-face {
  font-family: 'InterFallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
}

body {
  font-family: 'Inter', 'InterFallback', sans-serif;
}
</code></pre>

<h3>Example 8: Defer non-critical JS</h3>
<pre><code class="language-html">&lt;!-- Before --&gt;
&lt;script src="/analytics.js"&gt;&lt;/script&gt;
&lt;script src="/feature-flags.js"&gt;&lt;/script&gt;
&lt;script src="/chat-widget.js"&gt;&lt;/script&gt;
&lt;!-- All sync; blocks parse + render --&gt;

&lt;!-- After --&gt;
&lt;script src="/analytics.js" async&gt;&lt;/script&gt;       &lt;!-- independent --&gt;
&lt;script src="/feature-flags.js" defer&gt;&lt;/script&gt;   &lt;!-- needs DOM --&gt;
&lt;!-- Lazy-load chat widget on user interaction --&gt;
&lt;script&gt;
  document.addEventListener('click', () =&gt; {
    const s = document.createElement('script');
    s.src = '/chat-widget.js';
    document.head.appendChild(s);
  }, { once: true });
&lt;/script&gt;
</code></pre>

<h3>Example 9: CLS attribution</h3>
<pre><code class="language-js">new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    if (entry.value &gt; 0.05 &amp;&amp; !entry.hadRecentInput) {
      console.warn(\`CLS: \${entry.value.toFixed(4)}\`, {
        sources: entry.sources?.map(s =&gt; ({
          node: s.node,
          previousRect: s.previousRect,
          currentRect: s.currentRect,
        })),
      });
    }
  }
}).observe({ type: 'layout-shift', buffered: true });
</code></pre>

<h3>Example 10: Lighthouse CI config</h3>
<pre><code class="language-jsonc">// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/product/123"],
      "numberOfRuns": 5
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "interaction-to-next-paint": ["error", { "maxNumericValue": 200 }]
      }
    }
  }
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>SPA navigations and CWV</h3>
<p>SPA navigations don't trigger a new page load; LCP / FCP / TTFB are not re-measured. INP / CLS continue accumulating. For SPA, treat navigations as their own metric (e.g., custom "soft navigation" tracking).</p>

<h3>Soft navigations API (experimental)</h3>
<p>Chrome's Soft Navigations API treats route changes as new navigations; LCP / FCP can be re-measured. Currently behind a flag; gradually rolling out.</p>

<h3>BFCache and CWV</h3>
<p>Pages restored from back/forward cache (bfcache) have near-instant LCP. Google counts bfcache navigations toward CWV. Optimize for bfcache eligibility (no <code>unload</code> handlers, no <code>Cache-Control: no-store</code>).</p>

<h3>Pages with infinite scroll</h3>
<p>CLS accumulates across the page lifetime. A long-running scroll page can rack up shifts even if each is small. Use the "session window" version: 5-second windows of consecutive shifts; take the worst window.</p>

<h3>Headless / bot traffic</h3>
<p>CrUX excludes headless / bot Chrome. Lab Lighthouse runs are also synthetic; field is what matters.</p>

<h3>Slow connections</h3>
<p>p75 includes slow connections. Even if your fast users are happy, the slow tail drags down your CWV. Use compression, smaller bundles, modern formats.</p>

<h3>iOS Safari isn't in CrUX</h3>
<p>CrUX is Chrome-only. iOS Safari users aren't represented in your CWV ranking signal. Still test on Safari for user experience.</p>

<h3>Pre-rendered pages</h3>
<p>Speculation Rules prerender = LCP near 0 if user navigates from origin. Big wins available with no UX cost.</p>

<h3>LCP via background-image</h3>
<p>If your LCP is a CSS background-image, it can't be preloaded easily. Either move to <code>&lt;img&gt;</code> + <code>fetchpriority="high"</code>, or use <code>&lt;link rel="preload" as="image"&gt;</code>.</p>

<h3>LCP element changes</h3>
<p>The LCP candidate changes as content loads. The final LCP is the largest element at the time of finalization (interaction or 500ms after first interaction). A late-loading hero image can replace text as LCP, often improving the score.</p>

<h3>CLS during interaction</h3>
<p>Shifts within 500ms of user input are excluded (assumed intentional). But if your handler triggers a shift after that window, it counts. Be careful with delayed UI changes.</p>

<h3>Print stylesheets</h3>
<p>Don't load print stylesheets unconditionally; gate with <code>media="print"</code>. Otherwise they're render-blocking.</p>

<h3>INP includes input delay from prior tasks</h3>
<p>If a long task is running when the user clicks, the click event waits. INP attributes that wait to the click. Diagnose long tasks broadly, not just handlers.</p>

<h3>Synthetic Lighthouse vs real users</h3>
<p>Lab data uses simulated 4G + Moto G4 by default. Real users may be on 5G with iPhone 15 (better) or 3G with budget Android (worse). The lab is one cohort; field is the truth.</p>

<h3>Web Vitals attribution build</h3>
<pre><code class="language-js">import { onLCP } from 'web-vitals/attribution';

onLCP((metric) =&gt; {
  console.log('LCP:', metric.value);
  console.log('Element:', metric.attribution.element);
  console.log('TTFB:', metric.attribution.timeToFirstByte);
  console.log('Resource Load Delay:', metric.attribution.resourceLoadDelay);
  console.log('Resource Load Time:', metric.attribution.resourceLoadTime);
  console.log('Element Render Delay:', metric.attribution.elementRenderDelay);
});
</code></pre>
<p>The /attribution build provides breakdowns of each metric.</p>

<h3>Content-Security-Policy and inline scripts</h3>
<p>Strict CSP can block inline scripts that the web-vitals library injects. Configure CSP nonces or use the npm package's pre-bundled output.</p>

<h3>InteractionId stability</h3>
<p>Each interaction has an interactionId. The same id is shared across pointerdown, pointerup, and click for a single tap. Track the worst interaction by id.</p>

<h3>CLS pre-paint</h3>
<p>Layout shifts before the first paint don't count toward CLS (they're page setup). Only post-paint shifts.</p>

<h3>iOS Safari CLS</h3>
<p>Safari supports the layout-shift entry but with quirks. Same metric, similar implementation, slight differences in attribution.</p>

<h3>Visibility changes</h3>
<p>If the user backgrounds the tab and returns, INP and CLS continue accumulating. Some pages "snapshot" CWV on visibility change; web-vitals library handles this.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Lazy-loading the LCP image</h3>
<pre><code class="language-html">&lt;!-- BAD — defers LCP --&gt;
&lt;img src="/hero.webp" loading="lazy" /&gt;

&lt;!-- GOOD --&gt;
&lt;img src="/hero.webp" fetchpriority="high" /&gt;
</code></pre>

<h3>Bug 2: Hero in CSS background-image</h3>
<p>Background-images are discovered late (after CSS parses). Move LCP image to <code>&lt;img&gt;</code> with preload.</p>

<h3>Bug 3: Synchronous third-party scripts</h3>
<pre><code class="language-html">&lt;script src="https://third-party/widget.js"&gt;&lt;/script&gt;
</code></pre>
<p>Blocks parse and render. Defer or load on demand.</p>

<h3>Bug 4: No image dimensions</h3>
<p>Causes CLS when images load and push content down. Always set width/height attributes or aspect-ratio.</p>

<h3>Bug 5: font-display: swap with no fallback adjustment</h3>
<p>Causes CLS when font swaps. Use <code>size-adjust</code> on fallback or switch to <code>font-display: optional</code>.</p>

<h3>Bug 6: Long click handlers</h3>
<pre><code class="language-js">button.addEventListener('click', () =&gt; {
  for (let i = 0; i &lt; 10000; i++) heavyWork(i);   // 200ms+ → bad INP
});
</code></pre>

<h3>Bug 7: setState chains during render</h3>
<p>React: rapid state changes during a single click can chain into a long task. Profile; consider startTransition / useDeferredValue.</p>

<h3>Bug 8: Print stylesheet not gated</h3>
<pre><code class="language-html">&lt;link rel="stylesheet" href="/print.css" /&gt;   ← render-blocking
&lt;link rel="stylesheet" href="/print.css" media="print" /&gt;   ← only when printing
</code></pre>

<h3>Bug 9: Pop-up banners after interaction</h3>
<p>"Newsletter sign-up" appearing 500ms+ after first interaction shifts content; counts toward CLS. Use overlay or fixed-position bar.</p>

<h3>Bug 10: Loading analytics first</h3>
<p>Loading 5 analytics scripts before your app code blocks initial render. Use <code>async</code> for analytics; defer for app.</p>

<h3>Anti-pattern 1: Optimizing for Lighthouse score only</h3>
<p>Lighthouse simulates a Moto G4. Real users may have iPhone 15 or budget Android. Optimize for field, not lab.</p>

<h3>Anti-pattern 2: Ignoring p75</h3>
<p>p50 might be great; p75 might be poor. Google ranks on p75. Look at the tail.</p>

<h3>Anti-pattern 3: One-time optimization</h3>
<p>CWV regress over time as features ship. Set up CI gates and monitoring; don't treat optimization as a one-off project.</p>

<h3>Anti-pattern 4: Skipping field data</h3>
<p>Without field data (web-vitals lib), you don't know what real users experience. Lab can be misleading.</p>

<h3>Anti-pattern 5: Optimizing wrong metric</h3>
<p>FCP is good, LCP is poor — you're rendering placeholder text fast but the actual content is slow. LCP is what matters; don't get tricked.</p>

<h3>Anti-pattern 6: Treating Lighthouse score as "the goal"</h3>
<p>Score is a weighted average. You can have 95 perf and still poor LCP. Focus on the individual metrics.</p>

<h3>Anti-pattern 7: Premature optimization of TTFB</h3>
<p>TTFB matters less than LCP unless TTFB itself is &gt; 800ms. Don't spend weeks optimizing TTFB if your LCP is bottlenecked elsewhere.</p>

<h3>Anti-pattern 8: Hidden CLS in carousels</h3>
<p>Carousel rotating with absolute-positioned slides may not cause CLS, but height changes can. Test.</p>

<h3>Anti-pattern 9: Shipping JS that runs on every page</h3>
<p>Global JS bundles add to every page's INP. Code-split per route; keep critical path minimal.</p>

<h3>Anti-pattern 10: Not regressing-test new features</h3>
<p>A new feature that adds 200KB JS may not break Lighthouse but can tank field LCP. Track CWV per feature flag rollout.</p>
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
    <tr><td><em>What are Core Web Vitals?</em></td><td>LCP, INP, CLS — Google's metrics for loading, interactivity, stability.</td></tr>
    <tr><td><em>What's LCP?</em></td><td>Time to largest above-fold element painted; target ≤ 2.5s at p75.</td></tr>
    <tr><td><em>What's INP?</em></td><td>Worst-case interaction-to-next-paint latency; replaced FID; target ≤ 200ms.</td></tr>
    <tr><td><em>What's CLS?</em></td><td>Cumulative Layout Shift score across page lifetime; target ≤ 0.1.</td></tr>
    <tr><td><em>How would you fix poor LCP?</em></td><td>Preload LCP resource, fetchpriority high, defer non-critical JS, faster TTFB, modern image formats.</td></tr>
    <tr><td><em>How would you fix poor INP?</em></td><td>Break up long tasks, debounce handlers, web workers for heavy compute, defer non-critical work.</td></tr>
    <tr><td><em>How would you fix poor CLS?</em></td><td>Set image dimensions, reserve ad/iframe space, font-display optional, animate transforms.</td></tr>
    <tr><td><em>Lab vs field?</em></td><td>Lab is reproducible (Lighthouse); field is real users (CrUX, web-vitals). Both matter.</td></tr>
    <tr><td><em>How does Google measure CWV?</em></td><td>CrUX dataset; p75 across real Chrome users; per-URL or per-origin.</td></tr>
    <tr><td><em>Why p75 not p50?</em></td><td>Captures the bottom 25% of users' experience; you must have 75% in green.</td></tr>
    <tr><td><em>How do you debug CWV in production?</em></td><td>web-vitals library + attribution build to identify cause; report to analytics; group by page / connection / device.</td></tr>
    <tr><td><em>Why did INP replace FID?</em></td><td>FID measured only first interaction; INP measures worst across page lifetime — closer to real UX.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Set up the web-vitals library and report to a fake endpoint.</li>
  <li>Write a Long Task observer.</li>
  <li>Write a CLS source observer.</li>
  <li>Identify and fix a layout-thrashing function for INP.</li>
  <li>Add fetchpriority + preload to a hero image.</li>
  <li>Configure Lighthouse CI to gate PRs.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>LCP image with <code>loading="lazy"</code> — should be eager + fetchpriority high.</li>
  <li>Synchronous third-party script in head — defer or async.</li>
  <li>Image without dimensions — add width/height or aspect-ratio.</li>
  <li>50ms+ task in click handler — break up or move to worker.</li>
  <li>font-display: swap without size-adjust — causes CLS on font swap.</li>
  <li>print stylesheet without media query — render-blocking.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Metric fluency</td><td>You name LCP/INP/CLS thresholds without prompting.</td></tr>
    <tr><td>Field-data orientation</td><td>You volunteer "Lab catches regressions; field is what counts for ranking."</td></tr>
    <tr><td>Specific interventions</td><td>For each metric, you can name the highest-leverage fix.</td></tr>
    <tr><td>Tool fluency</td><td>web-vitals library, Lighthouse CI, CrUX, attribution builds.</td></tr>
    <tr><td>p75 awareness</td><td>You optimize for the worst 25%, not just the median.</td></tr>
    <tr><td>Pipeline connection</td><td>You connect each metric to specific browser pipeline phases.</td></tr>
    <tr><td>Mobile reality</td><td>You test on real low-end Android with throttled network.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps don't have CWV per se; equivalent metrics: cold start, time-to-interactive, frame drops, screen transition latency.</li>
  <li>For RN Web (web port of an RN app), CWV applies normally.</li>
  <li>Mobile web (your marketing site, web fallback) inherits CWV directly.</li>
  <li>The principles transfer: measure with real users, optimize biggest wins first, monitor regressions.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why is LCP 2.5s the threshold?"</em> — Empirically derived from user studies; pages slower than 2.5s correlate with worse engagement / conversion. The threshold is the 75th percentile of well-performing pages in CrUX.</li>
  <li><em>"How does the soft-navigation API change CWV?"</em> — SPA route changes can be tracked as new navigations; LCP/FCP can be re-measured per soft nav. Currently behind flag in Chrome.</li>
  <li><em>"What's the difference between INP and TBT?"</em> — TBT (Total Blocking Time) is lab-only, sums long-task durations during page load. INP is field, measured per interaction across the page lifetime.</li>
  <li><em>"Why doesn't iOS Safari report to CrUX?"</em> — CrUX is Chrome's program. iOS uses its own engine (WebKit) and doesn't share data. iOS users still experience the page; just not in CrUX.</li>
  <li><em>"How does bfcache affect CWV?"</em> — bfcache navigations have near-zero LCP and TTFB. Google includes them in CrUX, which can dramatically improve aggregate scores. Optimize for bfcache eligibility.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Install web-vitals library; report to analytics.</li>
  <li>Set up Lighthouse CI to gate PRs.</li>
  <li>Audit the homepage and top 3 landing pages with PageSpeed Insights.</li>
  <li>Identify LCP element on each top page; preload it.</li>
  <li>Find biggest INP offenders via the attribution build.</li>
  <li>Audit images for dimensions; add aspect-ratio where missing.</li>
  <li>Set up a CWV dashboard with p75 by page / device / country.</li>
  <li>Document team conventions and include in onboarding.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd integrate web-vitals into our error reporter so spikes alert in real-time."</li>
  <li>"I'd add a Lighthouse CI assertion per Core metric; fail PRs that regress."</li>
  <li>"I'd build a 'CWV impact' calculator that estimates the user-experience cost of new features."</li>
  <li>"I'd add bfcache eligibility checks to our deployment pipeline."</li>
  <li>"I'd partner with backend on TTFB targets — under 800ms is the entry-level requirement."</li>
</ul>
`
    }
  ]
});
