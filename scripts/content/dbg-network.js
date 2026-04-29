window.PREP_SITE.registerTopic({
  id: 'dbg-network',
  module: 'Debugging',
  title: 'Network & Performance Debugging',
  estimatedReadTime: '26 min',
  tags: ['debugging', 'network', 'performance', 'http', 'devtools', 'lighthouse', 'webpagetest'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Network and performance debugging is about answering: "what is my page actually doing, when, and how long?" Tooling spans browser DevTools, command-line tools, and synthetic + real-user monitoring.</p>
<ul>
  <li><strong>DevTools Network panel</strong> — see every request, timing breakdown, headers, response. Throttle, block, override.</li>
  <li><strong>DevTools Performance panel</strong> — record main thread + render pipeline. Find long tasks, layout thrashing, jank.</li>
  <li><strong>Lighthouse</strong> — automated audits with actionable recommendations.</li>
  <li><strong>WebPageTest</strong> — synthetic testing with real device + network profiles, filmstrip, waterfall.</li>
  <li><strong>Web Vitals + RUM</strong> — real user metrics (LCP, INP, CLS) at scale via web-vitals library + analytics endpoint.</li>
  <li><strong>Network throttling</strong> — Slow 4G + 4× CPU is realistic mid-range mobile. Test there.</li>
  <li><strong>HTTP debugging</strong> — Charles, Proxyman, mitmproxy for inspecting / modifying requests outside browser.</li>
  <li><strong>HAR files</strong> — exportable network log; share between teams.</li>
  <li><strong>Chrome User Experience Report (CrUX)</strong> — public real-user data for popular sites.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Reproduce + measure + fix + verify. Reproduce on a slow connection / slow device. Measure with Performance + Network + Lighthouse. Fix one thing at a time. Verify with another measurement. Most "perf bugs" are visible in the first recording — if you know how to read it.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The "performance vs network" distinction</h3>
<ul>
  <li><strong>Network</strong> — bytes over the wire. DNS, TCP, TLS, HTTP, response. Optimization: smaller payloads, fewer requests, better caching, CDN closer.</li>
  <li><strong>Performance</strong> — what the browser does once bytes arrive. Parse, compile, layout, paint, composite. Optimization: smaller bundles, lazy load, virtualize, avoid layout thrash.</li>
</ul>
<p>Both contribute to perceived speed. Most LCP wins come from network; most INP wins from performance.</p>

<h3>Lab vs field</h3>
<table>
  <thead><tr><th></th><th>Lab (synthetic)</th><th>Field (RUM / CrUX)</th></tr></thead>
  <tbody>
    <tr><td>Tools</td><td>Lighthouse, WebPageTest, DevTools</td><td>web-vitals + Sentry / Datadog / GA</td></tr>
    <tr><td>Reproducibility</td><td>Deterministic, controlled</td><td>Variable, real-world</td></tr>
    <tr><td>Use for</td><td>Debugging specific issues, regression testing</td><td>Tracking real UX over time</td></tr>
    <tr><td>SEO ranking</td><td>No</td><td>Yes (Google uses CrUX)</td></tr>
  </tbody>
</table>

<h3>Why throttle</h3>
<p>Your dev machine on Wi-Fi is the fastest realistic case. p75 of users are on slower networks + CPUs:</p>
<ul>
  <li>4G median: ~10 Mbps with 70ms RTT.</li>
  <li>4× CPU slowdown approximates a mid-range Android.</li>
  <li>Slow 4G in DevTools: 3 Mbps with 400ms RTT — closer to p75 of mobile users globally.</li>
</ul>
<p>If you don't see the slow case in dev, you don't fix it.</p>

<h3>Why HAR files</h3>
<p>Network panel shows your reproduction. To share with a teammate or paste into a bug report: right-click → Save all as HAR. Recipient imports it back into DevTools (or any HAR viewer). All requests, timings, headers preserved.</p>

<h3>Why proxy tools (Charles / Proxyman)</h3>
<ul>
  <li>Inspect requests from any app (mobile, Electron, server-side).</li>
  <li>Modify requests / responses on the fly (test edge cases).</li>
  <li>Throttle bandwidth + introduce packet loss.</li>
  <li>Reproduce HTTPS issues (with installed root cert).</li>
  <li>Decode SSL traffic for legitimate debugging.</li>
</ul>

<h3>Why CrUX</h3>
<p>Chrome's anonymized real-user metrics for the top sites. Google uses it for search ranking. Public data — anyone can see how your site (or competitors') performs in p75 LCP / INP / CLS. Tools: PageSpeed Insights aggregates Lighthouse + CrUX in one report.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "request timing breakdown"</h3>
<div class="diagram">
<pre>
 Queueing      ← waiting for a connection (browser limit, scheduler)
 Stalled       ← couldn't start: proxy negotiation, etc.
 DNS Lookup    ← resolve hostname → IP
 Initial Connection ← TCP + TLS handshake
 SSL          ← TLS portion of above
 Request sent  ← bytes sent
 Waiting (TTFB) ← waiting for server's first byte
 Content Download ← actual response body

 Open Network → click request → Timing tab → see breakdown
</pre>
</div>

<h3>The "long task" picture</h3>
<div class="diagram">
<pre>
 Performance recording — main thread track:

 [───────][─long task ─][───]   ← red/orange borders on tasks &gt;50ms
   16ms      120ms        20ms

 INP requires "input → next paint" within ~200ms.
 A 120ms long task in that window blocks input.
 Goal: keep all tasks &lt;50ms via yielding, splitting, workers.</pre>
</div>

<h3>The "Lighthouse audit" picture</h3>
<div class="diagram">
<pre>
 Performance: 78
   ├── First Contentful Paint: 1.8s   ✓
   ├── Largest Contentful Paint: 4.2s ✗  ← actionable
   ├── Total Blocking Time: 410ms     ✗
   ├── Speed Index: 3.1s              ⚠
   └── Cumulative Layout Shift: 0.05  ✓

 Opportunities:
   - Eliminate render-blocking resources (saves 0.5s)
   - Properly size images (saves 0.3s)
   - Defer offscreen images (saves 0.2s)
   - Avoid enormous network payloads (3.2MB → goal &lt;1.5MB)

 Each opportunity has details + code snippets to fix.</pre>
</div>

<h3>The "Web Vitals dashboard" picture</h3>
<pre><code>Track in production:
  - LCP p75 per route
  - INP p75 per route
  - CLS p75 per route
  - TTFB
  - Custom: time-to-interactive, time-to-route-rendered

Send to Sentry / Datadog / custom RUM.
Alert on regressions: p75 LCP &gt; 2.5s for 24h.</code></pre>

<h3>The "waterfall" reading</h3>
<pre><code>Network panel timeline (when you scroll the requests):
  Bars colored by phase (DNS, connect, request, wait, download)
  Sequence + parallelism visible
  Hover for tooltip

 What to look for:
  - Long blue bars = big payloads (compress, split, lazy)
  - Long teal bars = TTFB (server slow)
  - Many small fast bars = lots of requests (consider HTTP/2 multiplexing benefit, or batch)
  - Critical path: which requests block first paint?
  - Idle gaps: bandwidth wasted</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Lighthouse score is THE perf metric." Lighthouse is a snapshot lab test on one device + network. Real users span many devices, networks, regions. Track real-user p75 (RUM) and use Lighthouse for actionable diagnosis.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Network panel essentials</h3>
<ul>
  <li><strong>Filter</strong>: <code>method:GET</code>, <code>status-code:404</code>, <code>mime-type:application/json</code>, <code>has-response-header:cache-control</code>.</li>
  <li><strong>Disable cache</strong> while DevTools is open.</li>
  <li><strong>Preserve log</strong> across navigation.</li>
  <li><strong>Throttle</strong>: presets (Slow 3G, Fast 3G, Offline) + custom.</li>
  <li><strong>Block requests</strong>: right-click → Block request URL / domain.</li>
  <li><strong>Initiator</strong>: which line / file caused this request.</li>
  <li><strong>Priority</strong>: how the browser ranked it (high / medium / low).</li>
  <li><strong>Status colors</strong>: green = 200, yellow = 3xx, orange = 4xx, red = 5xx.</li>
</ul>

<h3>Network panel filters</h3>
<pre><code>Filters in the search box:
  domain:cdn.example.com
  has-response-header:set-cookie
  is:from-cache
  larger-than:100k
  method:POST
  mime-type:image/jpeg
  status-code:404
  scheme:https

Combine with text matching.</code></pre>

<h3>Throttling presets vs custom</h3>
<pre><code>Slow 3G:   500/500 Kbps, 2000ms RTT (very slow — emerging markets)
Fast 3G:   1.6/0.75 Mbps, 562ms RTT
Slow 4G:   ~3 Mbps, 400ms RTT (median real-world mobile)
Default:   no throttle — desktop wifi

Custom: set kbps + RTT; combine with Network conditions panel</code></pre>

<h3>Block patterns</h3>
<pre><code>Cmd+Shift+P → Show Network Request Blocking
Add patterns like:
  *.gtag.com
  *analytics*
  google-analytics.com

Reload to test "what if this resource didn't load?"</code></pre>

<h3>HAR export / import</h3>
<pre><code>Export: right-click in Network panel → "Save all as HAR with content"
Import: drag HAR file onto Network panel (must reload first to clear)

Useful for sharing repros: "I'm seeing this — here's the HAR."</code></pre>

<h3>Performance panel — recording</h3>
<pre><code>1. Click record (or Cmd+E)
2. Reproduce slow scenario
3. Stop

Tracks: Main, Compositor, GPU, Network, Frames, Long tasks, Memory (toggle).
Click any task → flame graph below
Shift+click bracket selection → measure a range</code></pre>

<h3>Performance panel — tabs</h3>
<ul>
  <li><strong>Summary</strong>: pie chart of time per category (scripting, rendering, painting, system, idle).</li>
  <li><strong>Bottom-Up</strong>: which functions had highest cumulative self time. Best for finding hot functions.</li>
  <li><strong>Call Tree</strong>: top-down hierarchical view.</li>
  <li><strong>Event Log</strong>: list of events with timing.</li>
</ul>

<h3>Lighthouse</h3>
<pre><code>Modes:
  - Navigation (cold load)
  - Timespan (already-loaded session, e.g., post-interaction)
  - Snapshot (current page state)

Devices: Mobile (slow CPU + slow 4G simulated) or Desktop.
Categories: Performance, Accessibility, Best Practices, SEO, PWA.

Output: scores 0-100 + actionable opportunities + diagnostics.

Run multiple times (3-5) and take median — single runs are noisy.</code></pre>

<h3>Lighthouse CI</h3>
<pre><code class="language-yaml"># GitHub Actions
- uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://preview.example.com/
      https://preview.example.com/products
    budgetPath: ./lighthouserc.json
    uploadArtifacts: true</code></pre>
<pre><code class="language-json">// lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }]
      }
    }
  }
}</code></pre>

<h3>WebPageTest</h3>
<p>Free public tool (paid for higher concurrency). Test from real devices around the world:</p>
<ul>
  <li>Choose location (US East, EU, India, etc.).</li>
  <li>Choose device (Moto G4 = mid-range Android, iPhone, etc.).</li>
  <li>Choose connection (Cable, 4G LTE, 3G, 2G).</li>
  <li>Output: filmstrip (screenshots over time), waterfall, perf summary.</li>
  <li>Compare two runs side-by-side.</li>
</ul>
<p>Better than Lighthouse for: cross-region testing, real devices, before/after comparisons.</p>

<h3>web-vitals library (RUM)</h3>
<pre><code class="language-js">import { onLCP, onINP, onCLS, onTTFB, onFCP } from 'web-vitals/attribution';

const send = (m) =&gt; navigator.sendBeacon('/rum', JSON.stringify({
  name: m.name,
  value: m.value,
  rating: m.rating,        // 'good' | 'needs-improvement' | 'poor'
  delta: m.delta,
  id: m.id,
  attribution: m.attribution,  // which element / event was slow
  url: location.pathname,
  connection: navigator.connection?.effectiveType,
}));

onLCP(send);
onINP(send);
onCLS(send);
onTTFB(send);
onFCP(send);</code></pre>

<h3>Performance Observer (custom marks)</h3>
<pre><code class="language-js">// Mark important moments
performance.mark('app-mounted');
performance.mark('feed-rendered');
performance.measure('mount-to-feed', 'app-mounted', 'feed-rendered');

// Observe long tasks
new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    if (entry.duration &gt; 100) {
      reportLongTask(entry);
    }
  }
}).observe({ type: 'longtask', buffered: true });

// Observe navigation timing
const nav = performance.getEntriesByType('navigation')[0];
console.log('TTFB', nav.responseStart - nav.requestStart);</code></pre>

<h3>Network conditions panel</h3>
<pre><code>Cmd+Shift+P → Show Network conditions
- Disable cache
- Network throttling
- User-Agent override (test mobile UA on desktop)
- Accept-Language</code></pre>

<h3>Server-Timing headers</h3>
<pre><code class="language-http">HTTP/2 200
Server-Timing: db;dur=120, render;dur=80, total;dur=210</code></pre>
<p>Server reports its internal timing in headers. DevTools Network → Timing tab shows them. Useful for "is the server slow or the network?"</p>

<h3>chrome://tracing for advanced</h3>
<pre><code>chrome://tracing
Click Record → choose categories → record system-level traces
More detail than Performance panel; visualize multi-process / GPU events
Mostly for browser engineers; rarely needed for app debugging</code></pre>

<h3>Charles / Proxyman setup</h3>
<pre><code>1. Install (charlesproxy.com or proxyman.io)
2. Configure browser / system to proxy through localhost:8888 (Charles) or :9090 (Proxyman)
3. For HTTPS: install root cert (Charles → Help → SSL Proxying → Install Root Certificate)
4. Trust the cert in your OS keychain
5. Add SSL proxying for specific domains
6. Now: every HTTP/HTTPS request visible + modifiable</code></pre>

<h3>cURL replay</h3>
<pre><code>Network panel → right-click request → Copy → Copy as cURL
Paste in terminal:
curl 'https://api.example.com/users' \\
  -H 'authorization: Bearer ...' \\
  -H 'content-type: application/json' \\
  --data-raw '{"id":1}'

Modify and replay. Good for: server-side debugging, automation, sharing.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — slow API call diagnosis</h3>
<pre><code>1. Network panel → reproduce slow call
2. Click the request
3. Timing tab:
   - DNS Lookup: 50ms
   - TCP: 80ms
   - TLS: 100ms
   - Waiting (TTFB): 2400ms ← problem
   - Content Download: 50ms
4. TTFB high → server-side issue
5. Check Server-Timing headers for breakdown
6. Optimize on the server</code></pre>

<h3>Example 2 — block third-party tracker</h3>
<pre><code>1. Cmd+Shift+P → Show Network Request Blocking
2. Add: *gtag*
3. Reload
4. Confirm tracker not loaded
5. Measure perf without it (Performance panel)
6. If significant: defer load via interaction or move to Web Worker (Partytown)</code></pre>

<h3>Example 3 — INP regression on a list</h3>
<pre><code>1. Performance → record while clicking a row
2. Stop
3. Look for long task at the click moment
4. Click the long task → flame graph
5. Identify slow function (e.g., synchronous filter on 10K items)
6. Fix: useTransition or move to worker
7. Re-record → INP improved</code></pre>

<h3>Example 4 — Lighthouse + budget in CI</h3>
<pre><code class="language-yaml"># .github/workflows/ci.yml
- uses: treosh/lighthouse-ci-action@v10
  with:
    urls: 'https://preview.example.com'
    budgetPath: ./lighthouserc.json
    runs: 3
    temporaryPublicStorage: true</code></pre>

<h3>Example 5 — RUM with web-vitals</h3>
<pre><code class="language-js">import { onLCP, onINP, onCLS } from 'web-vitals';

const send = (m) =&gt; {
  navigator.sendBeacon('/rum', JSON.stringify({
    name: m.name,
    value: m.value,
    target: m.attribution?.eventTarget,
    url: location.pathname,
  }));
};

onLCP(send);
onINP(send);
onCLS(send);</code></pre>

<h3>Example 6 — measure render time</h3>
<pre><code class="language-js">performance.mark('feed-fetch-start');
const data = await fetch('/feed').then(r =&gt; r.json());
performance.mark('feed-fetch-end');
performance.measure('feed-fetch', 'feed-fetch-start', 'feed-fetch-end');

renderFeed(data);
performance.mark('feed-rendered');
performance.measure('feed-end-to-end', 'feed-fetch-start', 'feed-rendered');

// Visible in Performance recording as user-defined marks</code></pre>

<h3>Example 7 — long task observer</h3>
<pre><code class="language-js">new PerformanceObserver((list) =&gt; {
  list.getEntries().forEach((entry) =&gt; {
    if (entry.duration &gt; 100) {
      sendBeacon('/long-task', JSON.stringify({
        duration: entry.duration,
        attribution: entry.attribution?.[0]?.name,
        url: location.pathname,
      }));
    }
  });
}).observe({ type: 'longtask', buffered: true });</code></pre>

<h3>Example 8 — replay with cURL</h3>
<pre><code>1. Network → right-click → Copy → Copy as cURL
2. Paste:
   curl 'https://api.example.com/users/1' \\
     -H 'authorization: Bearer xyz' \\
     -H 'content-type: application/json'
3. Modify token, headers, body
4. Replay to test edge cases</code></pre>

<h3>Example 9 — share a HAR</h3>
<pre><code>1. Network panel → right-click → Save all as HAR with content
2. Send HAR file to teammate
3. They drag it onto their DevTools Network panel (after reload to clear)
4. They see your exact request log</code></pre>

<h3>Example 10 — server-timing measurement</h3>
<pre><code class="language-js">// Express middleware
app.use((req, res, next) =&gt; {
  const start = Date.now();
  res.on('finish', () =&gt; {
    res.setHeader('Server-Timing', \`total;dur=\${Date.now() - start}\`);
  });
  next();
});

// In DevTools Network → Timing tab → "Server Timing" section visible</code></pre>

<h3>Example 11 — Lighthouse from CLI</h3>
<pre><code class="language-bash">npm install -g lighthouse
lighthouse https://example.com --view
# Opens HTML report with scores + opportunities

# JSON output for automation:
lighthouse https://example.com --output=json --output-path=./report.json --chrome-flags="--headless"</code></pre>

<h3>Example 12 — WebPageTest API</h3>
<pre><code class="language-bash">curl -X POST 'https://www.webpagetest.org/runtest.php' \\
  -d 'url=https://example.com' \\
  -d 'k=YOUR_API_KEY' \\
  -d 'location=Dulles_iPhone8.4G' \\
  -d 'runs=3' \\
  -d 'f=json'</code></pre>

<h3>Example 13 — slow 3G + 4× CPU mobile profile</h3>
<pre><code>1. Cmd+Shift+M → Device toolbar
2. Choose: Pixel 5 or iPhone SE
3. Throttling:
   - Network: Slow 4G
   - CPU: 4× slowdown
4. Reload — measure as a real mid-range mobile user</code></pre>

<h3>Example 14 — find unused JavaScript</h3>
<pre><code>1. Cmd+Shift+P → Show Coverage
2. Click record + reload + interact
3. Stop
4. Sort by Unused bytes
5. Identify: main.js — 250KB total, 60% unused
6. Action: split chart-lib + analytics into lazy chunks</code></pre>

<h3>Example 15 — debug HTTPS with Charles</h3>
<pre><code>1. Charles → Help → SSL Proxying → Install Root Certificate
2. Trust cert in OS keychain
3. Add Charles as proxy: localhost:8888 in browser settings
4. Charles → Proxy → SSL Proxying Settings → add domain
5. Browse — see decrypted HTTPS traffic
6. Right-click request → Edit Request to modify; replay</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Throttling doesn't model real RTT variance</h3>
<p>Slow 4G is constant 400ms RTT. Real cellular varies 50-2000ms based on signal. Use WebPageTest with real devices for accurate testing.</p>

<h3>2. DevTools observed differs from production</h3>
<p>Devtools observation adds overhead. Numbers in Performance trace are slower than reality. Trust RUM for absolute numbers; Performance trace for relative diffing.</p>

<h3>3. Cache miss on first run</h3>
<p>Lighthouse cold-start runs disable cache. Subsequent runs cache. Compare apples-to-apples by clearing cache or using "Disable cache" toggle.</p>

<h3>4. Lighthouse score variance</h3>
<p>Single Lighthouse run can vary ±5 in Performance score. Run 3-5x; take median. Or use Lighthouse CI's <code>numberOfRuns</code> setting.</p>

<h3>5. Service worker hides network</h3>
<p>SW intercepts requests; Network panel shows them but with "(ServiceWorker)" badge. Toggle "Disable cache" or "Update on reload" in Application → SW.</p>

<h3>6. CORS preflight</h3>
<p>OPTIONS request precedes PUT/POST/DELETE for cross-origin. Sometimes the preflight is the slow part. Inspect both in Network.</p>

<h3>7. Brotli compression negotiation</h3>
<p>Server only sends Brotli if Accept-Encoding includes "br". DevTools shows negotiated encoding in response headers. Curl with <code>-H "Accept-Encoding: br"</code> to test.</p>

<h3>8. HTTP/2 multiplexing hides slow requests</h3>
<p>Browser doesn't queue HTTP/2 requests; all "in flight" simultaneously. Slow ones look like long bars but don't block others. Sort by total time to find them.</p>

<h3>9. WebSocket / SSE stay open</h3>
<p>Long-lived connections in Network panel show as one long bar. Click to see frames (WS) or events (SSE). Useful for debugging real-time.</p>

<h3>10. Performance tab sample rate</h3>
<p>By default, Performance samples at high frequency. Long recordings (&gt;30s) become huge files. Reduce by recording shorter scenarios.</p>

<h3>11. Web Vitals attribution missing</h3>
<p>Some browsers / older versions don't expose attribution. <code>web-vitals/attribution</code> import gives the best data; falls back gracefully.</p>

<h3>12. CrUX data lag</h3>
<p>CrUX aggregates 28 days of real user data. Recent perf changes take days to surface. Use field RUM (your own) for faster signal.</p>

<h3>13. Lighthouse Performance score formula changes</h3>
<p>Google updates Lighthouse scoring periodically. Numerical scores drift; targets may shift. Track absolute metrics (LCP seconds) alongside scores.</p>

<h3>14. Network panel hides preflight</h3>
<p>Filter set to XHR may hide CORS preflight (OPTIONS). Filter Doc + XHR or "All" to see them.</p>

<h3>15. Charles + iOS simulator</h3>
<p>iOS simulator uses Mac's network. Charles intercepts. Real iOS device: install Charles cert via Wi-Fi proxy + Settings → General → About → Certificate Trust Settings.</p>

<h3>16. Server-Timing exposed by CORS</h3>
<p>For cross-origin requests, server must include <code>Timing-Allow-Origin: *</code> header for the browser to expose timing info.</p>

<h3>17. Performance recording on Hermes</h3>
<p>React Native Hermes traces are different from V8. New React Native DevTools provides similar functionality.</p>

<h3>18. Long task not always reported</h3>
<p>Long Task Observer reports tasks &gt;50ms. Sub-50ms tasks aggregate. For a more granular view, use scheduler API + custom measurement.</p>

<h3>19. Cache validation overhead</h3>
<p>Even with 304 Not Modified responses, you pay DNS + TCP + request round-trip. <code>immutable</code> cache headers tell browser to skip even revalidation.</p>

<h3>20. Connection: keep-alive issues</h3>
<p>HTTP/1.1 keep-alive can fail on certain proxies. Network panel shows "Connection: close" — every request opens new TCP. Inspect headers when bandwidth seems weird.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — testing only on dev machine on Wi-Fi</h3>
<p>Fastest realistic case. Always throttle to mid-range mobile.</p>

<h3>Anti-pattern 2 — Lighthouse score as the only metric</h3>
<p>Snapshot lab test. Real users span devices + networks. Track CrUX + RUM.</p>

<h3>Anti-pattern 3 — single Lighthouse run</h3>
<p>Variance ±5 score. Run 3-5x; median.</p>

<h3>Anti-pattern 4 — disabled cache permanently in DevTools</h3>
<p>Useful while debugging; misleading for repeat-visit perf measurement. Toggle off when not actively dev'ing.</p>

<h3>Anti-pattern 5 — no RUM</h3>
<p>You don't know real user perf without measurement. web-vitals + endpoint = 30 minutes of work.</p>

<h3>Anti-pattern 6 — alert-only RUM</h3>
<p>Alerts fire on regressions; nobody charts trends. Build a dashboard: p75 LCP / INP / CLS over time, per route.</p>

<h3>Anti-pattern 7 — ignoring third-party impact</h3>
<p>Tag managers, ads, analytics often dominate INP regressions. Block in Network, measure delta, decide.</p>

<h3>Anti-pattern 8 — manual perf testing in branches</h3>
<p>Inconsistent. Lighthouse CI on PRs gives reproducible feedback.</p>

<h3>Anti-pattern 9 — performance budgets without enforcement</h3>
<p>"We aim for &lt;200KB JS." Nobody checks. CI fail PR over budget.</p>

<h3>Anti-pattern 10 — comparing throttled to unthrottled</h3>
<p>Apples-to-oranges. Always test before/after with same conditions.</p>

<h3>Anti-pattern 11 — focusing only on cold load</h3>
<p>Repeat visits use cache; SPA navigations don't reload. Measure both.</p>

<h3>Anti-pattern 12 — ignoring Server-Timing</h3>
<p>Server-side breakdown lost. Add <code>Server-Timing</code> headers; inspect in DevTools.</p>

<h3>Anti-pattern 13 — only testing the home page</h3>
<p>Other pages may regress separately. Test critical user paths (checkout, search, profile) too.</p>

<h3>Anti-pattern 14 — running Lighthouse with extensions</h3>
<p>Browser extensions inject scripts; skew measurement. Use Incognito or Lighthouse CI's headless.</p>

<h3>Anti-pattern 15 — claiming victory after one synthetic improvement</h3>
<p>Lighthouse shows +10 score; user-reported field metrics unchanged for weeks. Synthetic wins don't always translate. Verify with RUM.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How would you debug a slow page?</div>
  <div class="qa-answer">
    <ol>
      <li>Reproduce on slow conditions: Slow 4G + 4× CPU.</li>
      <li>Run Lighthouse — actionable starting point.</li>
      <li>Record Performance trace; identify long tasks.</li>
      <li>Network panel: any slow requests? Big payloads? Long TTFB?</li>
      <li>Coverage panel: unused JS to split.</li>
      <li>Check RUM data: which percentile / which routes regress.</li>
      <li>Apply fixes one at a time; re-measure each.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Lab vs Field metrics?</div>
  <div class="qa-answer">
    <p><strong>Lab</strong> (Lighthouse, WebPageTest, DevTools): synthetic, deterministic, controlled. Use for debugging + regression testing.</p>
    <p><strong>Field</strong> (CrUX, RUM): real users, p75 metrics. Used by Google for ranking. Optimize for these.</p>
    <p>Lab tells you what to fix; Field tells you whether the fix matters at scale.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you measure INP in production?</div>
  <div class="qa-answer">
<pre><code class="language-js">import { onINP } from 'web-vitals/attribution';
onINP((m) =&gt; {
  navigator.sendBeacon('/rum', JSON.stringify({
    value: m.value,
    target: m.attribution?.eventTarget,
    type: m.attribution?.eventType,
    delay: m.attribution?.inputDelay,
    processing: m.attribution?.processingDuration,
    presentation: m.attribution?.presentationDelay,
  }));
});</code></pre>
    <p>Attribution gives breakdown: which event + element was slow + which phase. Actionable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What's a HAR file?</div>
  <div class="qa-answer">
    <p>HTTP Archive — JSON-formatted dump of a browser session's network log. Contains all requests, headers, timings, response bodies. Exportable from Network panel (right-click → Save all as HAR). Useful for: sharing repros, replaying in tools (HAR Analyzer, WebPageTest), historical archival.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How does Network panel's Timing tab break down a request?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Queueing</strong>: waiting for browser to start.</li>
      <li><strong>Stalled</strong>: queued for the connection.</li>
      <li><strong>DNS Lookup</strong>: hostname → IP.</li>
      <li><strong>Initial Connection</strong>: TCP handshake.</li>
      <li><strong>SSL</strong>: TLS handshake (subset of Initial Connection).</li>
      <li><strong>Request sent</strong>: bytes uploaded.</li>
      <li><strong>Waiting (TTFB)</strong>: server processing time.</li>
      <li><strong>Content Download</strong>: response bytes.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How would you diagnose a high TTFB?</div>
  <div class="qa-answer">
    <ol>
      <li>Network panel → click request → Timing tab → confirm TTFB is the slow phase.</li>
      <li>Check Server-Timing headers if available (server breakdown).</li>
      <li>Server-side: profile the endpoint (database query? slow service?).</li>
      <li>Check CDN: is it serving the response, or hitting origin?</li>
      <li>Network: cellular 1.5s baseline RTT alone could explain. Test from a desktop wired connection.</li>
      <li>Mitigations: edge caching, ISR, faster DB query, CDN.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What's WebPageTest good for that Lighthouse isn't?</div>
  <div class="qa-answer">
    <ul>
      <li>Real device + real network (vs Lighthouse's simulated).</li>
      <li>Multi-region testing (different POPs).</li>
      <li>Filmstrip + visual completeness.</li>
      <li>Side-by-side run comparison.</li>
      <li>HAR export.</li>
      <li>Custom scripting (login flows).</li>
      <li>Server-Timing visualized.</li>
    </ul>
    <p>Lighthouse: easier setup, simulated. WPT: more realistic, more setup.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you add a perf budget to CI?</div>
  <div class="qa-answer">
<pre><code class="language-yaml">- uses: treosh/lighthouse-ci-action@v10
  with:
    urls: 'https://preview.example.com/'
    budgetPath: ./lighthouserc.json
    runs: 3</code></pre>
<pre><code class="language-json">{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }]
      }
    }
  }
}</code></pre>
    <p>PR fails if exceeded. Forces conscious decisions on perf-impacting changes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How does <code>navigator.connection</code> help?</div>
  <div class="qa-answer">
<pre><code class="language-js">navigator.connection?.effectiveType    // '2g' | '3g' | '4g' | 'slow-2g'
navigator.connection?.downlink         // estimated Mbps
navigator.connection?.rtt              // estimated round-trip
navigator.connection?.saveData         // user has data-saving mode</code></pre>
    <p>Adapt UX: lower image quality on 3G, defer non-critical resources, show "lite mode" prompt. Saves bandwidth on metered connections.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. When do you reach for proxy tools (Charles, Proxyman)?</div>
  <div class="qa-answer">
    <ul>
      <li>Mobile / native app debugging (DevTools doesn't see RN traffic easily).</li>
      <li>Modify responses on the fly (test edge cases).</li>
      <li>Throttle bandwidth + simulate packet loss.</li>
      <li>Inspect cross-origin iframe traffic.</li>
      <li>Replay with modified headers / body.</li>
    </ul>
    <p>Browser DevTools Network panel covers 80% of debugging; proxy tools handle the rest.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. CrUX vs your RUM — both?</div>
  <div class="qa-answer">
    <p>Yes, both:</p>
    <ul>
      <li><strong>CrUX</strong>: Google-aggregated 28-day p75 from Chrome users. Used for SEO ranking. Public via PageSpeed Insights.</li>
      <li><strong>Your RUM</strong>: real-time, per-route, per-user attribution. Faster feedback for fixes. Includes non-Chrome users.</li>
    </ul>
    <p>CrUX for SEO impact + benchmarking; your RUM for actionable engineering.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you find what's slow?</div>
  <div class="qa-answer">
    <ol>
      <li>Lighthouse for top-level signals (LCP, INP, CLS).</li>
      <li>Performance trace for main thread breakdown.</li>
      <li>Network for slow requests / payloads.</li>
      <li>Coverage for unused bytes.</li>
      <li>RUM attribution for specific elements / events.</li>
    </ol>
    <p>Combine: Lighthouse identifies "LCP is slow"; Performance trace identifies "image fetch starts late"; Network shows "image is 2MB unoptimized JPEG."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What does "Disable cache" affect?</div>
  <div class="qa-answer">
    <p>Toggling "Disable cache" in Network panel forces the browser to fetch every resource fresh on every reload, ignoring browser cache. Useful while developing (don't see stale JS) and when measuring cold-load. Unrealistic for testing repeat-visit perf — toggle off for that.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What's a synthetic performance test?</div>
  <div class="qa-answer">
    <p>An automated, scripted test in a controlled environment (Lighthouse, WebPageTest, Playwright with perf metrics). Same conditions every run — perfect for regression detection. Contrast with field testing (real users, variable). Synthetic is essential for CI; field is essential for understanding real impact.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. The Performance trace shows a 200ms long task during scroll. Next steps?</div>
  <div class="qa-answer">
    <ol>
      <li>Click the long task → flame graph.</li>
      <li>Identify the function (e.g., <code>computeStyle</code> or your <code>onScroll</code> handler).</li>
      <li>If your code: split with rAF / scheduler.yield, throttle, move to worker.</li>
      <li>If browser internal (style recalc / layout): find what triggered it (forced sync layout).</li>
      <li>Set <code>passive: true</code> on scroll listener if not already.</li>
      <li>Reduce DOM size; virtualize long lists.</li>
      <li>Re-record, verify INP improves.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish lab vs field metrics.</li>
    <li>You record Performance traces under realistic throttling.</li>
    <li>You ship web-vitals to RUM.</li>
    <li>You use Lighthouse + budgets in CI.</li>
    <li>You read Network timing breakdowns.</li>
    <li>You block third-party scripts to measure delta.</li>
    <li>You use Server-Timing headers.</li>
    <li>You reach for WebPageTest for cross-region / real-device.</li>
    <li>You correlate Lighthouse fixes with RUM trends.</li>
  </ul>
</div>
`}

]
});
