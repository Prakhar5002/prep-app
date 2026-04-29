window.PREP_SITE.registerTopic({
  id: 'dbg-chrome',
  module: 'Debugging',
  title: 'Chrome DevTools Mastery',
  estimatedReadTime: '32 min',
  tags: ['debugging', 'chrome', 'devtools', 'sources', 'performance', 'network', 'console', 'memory'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Chrome DevTools is the most powerful in-browser debugger. Mastery means knowing not just where the panels are, but the workflows that map symptoms to tools.</p>
<ul>
  <li><strong>Elements</strong> — inspect / edit DOM + CSS live. Force pseudo-states (:hover, :focus). Visual debugging.</li>
  <li><strong>Console</strong> — JS REPL + log viewer. Use <code>$0</code>, <code>$_</code>, <code>copy()</code>, <code>monitor()</code>, conditional breakpoints.</li>
  <li><strong>Sources</strong> — set breakpoints, step through code, conditional + log breakpoints, blackboxing, workspaces (edit-and-save to disk).</li>
  <li><strong>Network</strong> — every HTTP request, with timings, response, headers. Throttle, block, override responses.</li>
  <li><strong>Performance</strong> — record timeline. CPU profile, frame rate, long tasks, layout / paint / composite phases.</li>
  <li><strong>Memory</strong> — heap snapshots, allocation timeline, detect leaks.</li>
  <li><strong>Application</strong> — storage (localStorage, IndexedDB, cookies, cache), service workers, manifest, background services.</li>
  <li><strong>Lighthouse</strong> — automated audits (perf, a11y, SEO, best practices).</li>
  <li><strong>Coverage</strong> — measure unused JS/CSS bytes.</li>
  <li><strong>Animations / Rendering</strong> — paint flashing, layer borders, FPS meter.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Don't <code>console.log</code> everything — use breakpoints. Don't reload to clear state — use <code>$0</code> in console. Don't guess — record a Performance trace. The fastest debug is the one that doesn't restart the app.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why DevTools matter</h3>
<p>Every browser ships dev tools, but Chrome's are the most feature-complete and the de-facto standard for web debugging. Mastery cuts debug time 5-10× — the difference between "spent 4 hours hunting a bug" and "found it in 20 minutes by reading the right panel."</p>

<h3>The "panel decision tree"</h3>
<table>
  <thead><tr><th>Symptom</th><th>Open</th></tr></thead>
  <tbody>
    <tr><td>Element looks wrong</td><td>Elements</td></tr>
    <tr><td>JS error / unexpected behavior</td><td>Console + Sources</td></tr>
    <tr><td>Failed / slow request</td><td>Network</td></tr>
    <tr><td>Page slow, jank, INP regression</td><td>Performance</td></tr>
    <tr><td>Memory growth / OOM</td><td>Memory</td></tr>
    <tr><td>Something stored wrong (cookies, cache)</td><td>Application</td></tr>
    <tr><td>How much JS is unused?</td><td>Coverage</td></tr>
    <tr><td>Want a holistic perf + a11y check</td><td>Lighthouse</td></tr>
    <tr><td>Sliding scale of UI panels</td><td>Animations / Rendering</td></tr>
  </tbody>
</table>

<h3>Why workspaces (edit-and-save)</h3>
<p>DevTools can map a folder on your disk to a domain. Edit a CSS or JS file in DevTools; save updates the file on disk. Tighter feedback loop than browser → file → save → reload.</p>

<h3>Why source maps in debugging</h3>
<p>Production code is minified + bundled. Stack traces show <code>main.a1b2.js:1:5283</code> — useless. Source maps map back to original files (App.tsx, line 42). Configure your bundler to emit source maps; DevTools loads them automatically (or via <code>//# sourceMappingURL</code>).</p>

<h3>Why breakpoints &gt; console.log</h3>
<p><code>console.log</code> requires reload + edit + reload. Breakpoints pause execution at a chosen point — inspect all variables, the call stack, step forward. Conditional breakpoints fire only when a condition is true. Log breakpoints log without pausing — like <code>console.log</code> but added without code edit.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "shortcut cheat sheet"</h3>
<table>
  <thead><tr><th>Shortcut</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>F12 / Cmd+Opt+I / Ctrl+Shift+I</td><td>Open DevTools</td></tr>
    <tr><td>Cmd+Shift+P / Ctrl+Shift+P</td><td>Command palette — search any feature</td></tr>
    <tr><td>Cmd+Shift+M / Ctrl+Shift+M</td><td>Toggle device toolbar (responsive)</td></tr>
    <tr><td>Cmd+P / Ctrl+P</td><td>Quick file open in Sources</td></tr>
    <tr><td>Cmd+F / Ctrl+F</td><td>Find in current panel</td></tr>
    <tr><td>Cmd+Opt+F / Ctrl+Shift+F</td><td>Search across all loaded sources</td></tr>
    <tr><td>F8 / Cmd+\\</td><td>Resume after pause</td></tr>
    <tr><td>F10</td><td>Step over</td></tr>
    <tr><td>F11</td><td>Step into</td></tr>
    <tr><td>Shift+F11</td><td>Step out</td></tr>
    <tr><td>Cmd+\\ / Ctrl+\\</td><td>Pause / resume execution</td></tr>
    <tr><td>Cmd+Shift+Y / Ctrl+Shift+Y</td><td>Toggle drawer (console + extras)</td></tr>
  </tbody>
</table>

<h3>The "console superpowers" picture</h3>
<pre><code class="language-js">// Console-only globals:
$0      // currently selected element in Elements panel
$1      // previously selected
$2..$4  // older selections
$_      // value of last expression
$$('.x') // shortcut for document.querySelectorAll
$x('//div[@class="x"]') // XPath query

// Functions:
copy(obj)       // copy a value to clipboard
inspect(fn)     // jump to function source
monitor(fn)     // log every call to fn with args
unmonitor(fn)
debug(fn)       // pause at every call to fn
undebug(fn)
queryObjects(Constructor)  // find all instances
getEventListeners($0)      // see listeners on selected element
clear()</code></pre>

<h3>The "Performance recording" picture</h3>
<div class="diagram">
<pre>
 Click record →  interact normally  →  stop record
                                          │
                                          ▼
 Timeline shows:
  - Network track (requests over time)
  - Frames track (which frames painted, which dropped)
  - Main thread track (JS, layout, paint per task)
  - Long tasks (red bordered) — blocking input
  - GPU track
  - Memory line graph (with checkbox)

 Click a long task → flame graph of what JS ran
 Click a frame → see which tasks contributed
 Bottom-Up view: which functions contribute most aggregated time</pre>
</div>

<h3>The "DOM breakpoint types"</h3>
<ul>
  <li><strong>Subtree modifications</strong> — pause when descendants added/removed.</li>
  <li><strong>Attribute modifications</strong> — pause when an attribute changes (great for "what's setting class to active?").</li>
  <li><strong>Node removal</strong> — pause when this element is removed.</li>
</ul>

<h3>The "blackboxing" picture</h3>
<p>Tell DevTools to skip stepping through certain files (libraries, polyfills). Right-click in Sources → "Add script to ignore list" or configure regex in Settings → Ignore List. When stepping, DevTools jumps over those files. Your stack trace also hides them.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"DevTools shows the production code I shipped." DevTools shows the running browser's code. With source maps, you debug original sources. Without, you debug minified output. Always ship hidden source maps to make production debugging possible.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Elements panel</h3>
<ul>
  <li><strong>Inspect</strong> — Cmd+Shift+C, then hover any element.</li>
  <li><strong>Force state</strong> — right-click element → Force state → :hover, :focus, :active. See styles in those states.</li>
  <li><strong>Edit attributes</strong> — double-click in markup. Live updates the page.</li>
  <li><strong>Edit styles</strong> — Styles panel; click value, edit. Disabled rules preserved.</li>
  <li><strong>Computed</strong> — see effective styles (inherits, browser defaults, declared).</li>
  <li><strong>Layout</strong> — flexbox / grid editors. Visual highlights.</li>
  <li><strong>Box model</strong> — content / padding / border / margin diagram.</li>
  <li><strong>DOM breakpoint</strong> — pause when element changes.</li>
  <li><strong>Event listeners</strong> — see what's bound. Click to jump to source.</li>
</ul>

<h3>Console</h3>
<pre><code class="language-js">// Filter logs by level: All, Errors, Warnings, Info, Verbose
// Preserve log across page reload: top-right gear icon

// Console methods beyond log:
console.error('msg', err);     // red
console.warn('msg');            // yellow
console.info('msg');
console.debug('msg');           // hidden by default
console.table(arrayOfObjects);  // tabular
console.group('label'); ...; console.groupEnd();
console.count('label');         // increments counter
console.time('label'); ...; console.timeEnd('label');  // duration
console.trace('here');          // stack trace
console.assert(cond, 'fail msg');
console.dir(obj);               // structured object view
console.dirxml(domElement);     // tree view of DOM</code></pre>

<h3>Sources panel</h3>
<pre><code>// Set a breakpoint:
1. Open file (Cmd+P)
2. Click line number to add breakpoint
3. Right-click for: edit breakpoint (condition), log point, never pause here

// Step controls (top-right):
- Resume (F8)
- Step over (F10)
- Step into (F11)
- Step out (Shift+F11)
- Step (next instruction)

// Side panel:
- Threads
- Watch (custom expressions)
- Call Stack
- Scope (Local, Closure, Global vars at current step)
- Breakpoints (list, toggle, remove)
- DOM Breakpoints
- XHR / fetch breakpoints
- Event Listener Breakpoints (e.g., click, keydown)</code></pre>

<h3>Conditional breakpoints</h3>
<pre><code class="language-js">// Right-click breakpoint → Edit breakpoint
// Enter condition:
user.id === 'admin'
// Pauses only when condition is true.

// Log point (logpoint):
// Right-click → Add logpoint → expression
'user is', user
// Logs without stopping execution.</code></pre>

<h3>Network panel</h3>
<ul>
  <li><strong>Filter</strong> by type: XHR, JS, CSS, Img, Media, Font, Doc, WS, Manifest, Other.</li>
  <li><strong>Preserve log</strong> across navigations (top toolbar).</li>
  <li><strong>Disable cache</strong> while DevTools is open.</li>
  <li><strong>Throttle</strong> — Slow 3G, Fast 3G, Offline. Test slow networks.</li>
  <li><strong>Block request URL</strong> — right-click → Block request URL. Tests degraded behavior.</li>
  <li><strong>Override responses</strong> — Sources → Overrides → enable. Modify response without server change.</li>
  <li><strong>Initiator</strong> column — what triggered the request (line of code).</li>
  <li><strong>Timing</strong> — DNS, TCP, TLS, request sent, waiting (TTFB), download.</li>
  <li><strong>Copy as cURL</strong> — right-click → Copy → as cURL. Reproduce request in terminal.</li>
  <li><strong>HAR export</strong> — share a session.</li>
</ul>

<h3>Performance panel — recording a trace</h3>
<pre><code>1. Click record (red dot)
2. Reproduce slow scenario
3. Click stop

Tracks visible:
- CPU graph (top)
- Frames (filmstrip)
- Network requests
- Main thread (call tree)
- Long tasks (red borders)
- GPU
- Raster
- Memory (toggle in settings)

Click a task → see flame graph of subroutines
"Bottom-Up" tab → which functions used the most cumulative time
"Call Tree" tab → top-down view
"Event Log" tab → list of events</code></pre>

<h3>Performance Insights (newer panel)</h3>
<p>Auto-detected issues from a Performance recording: long animation frames, render blocking, layout shifts, slow interaction. Friendlier than raw Performance for non-experts.</p>

<h3>Lighthouse</h3>
<pre><code>1. Open Lighthouse panel
2. Choose mode: Navigation, Timespan, or Snapshot
3. Choose device: Mobile or Desktop
4. Choose categories: Performance, Accessibility, Best Practices, SEO, PWA
5. Click "Analyze page load"

Output:
- Scores per category (0-100)
- Per-metric drill-down (LCP, INP, CLS)
- Specific actionable improvements with code references
- Diagnostic info (network throughput, CPU multipliers used)</code></pre>

<h3>Memory panel</h3>
<ul>
  <li><strong>Heap snapshot</strong> — object graph at a point in time. Find leaks via Comparison view.</li>
  <li><strong>Allocation instrumentation on timeline</strong> — track allocations over a session. Find what's allocating.</li>
  <li><strong>Allocation sampling</strong> — lighter-weight profiler showing per-function allocations.</li>
</ul>
<p>Workflow: snapshot → interact → snapshot → compare → find growing types → trace retainer paths.</p>

<h3>Application panel</h3>
<ul>
  <li><strong>Manifest</strong> — PWA manifest validation.</li>
  <li><strong>Service Workers</strong> — registered SWs, lifecycle, debug.</li>
  <li><strong>Storage</strong> — local/session/IndexedDB/cookies/cache; clear all.</li>
  <li><strong>Background Services</strong> — push, sync, periodic, notifications, payments.</li>
  <li><strong>Frames</strong> — iframes, embedded resources.</li>
</ul>

<h3>Coverage panel</h3>
<pre><code>1. Cmd+Shift+P → "Show Coverage"
2. Click record
3. Reload + interact
4. Stop

Shows: per-file used vs unused bytes.
Red = unused. Green = used.
Identify: 200KB main bundle, 60% used → likely candidates for code splitting.</code></pre>

<h3>Rendering panel</h3>
<pre><code>Cmd+Shift+P → "Show Rendering"

Toggles:
- Paint flashing (highlights painted areas — find unnecessary repaints)
- Layout shift regions
- Layer borders
- FPS meter
- Frame rendering stats
- Show scroll bottleneck
- Disable local fonts
- Force prefers-color-scheme: dark/light
- Force prefers-reduced-motion: reduce</code></pre>

<h3>Workspace setup</h3>
<pre><code>1. Sources → Filesystem tab → Add folder
2. Allow access
3. DevTools maps source files to domain
4. Editing in DevTools saves to disk
5. Hot reload picks up changes</code></pre>

<h3>Local overrides</h3>
<pre><code>1. Sources → Overrides → Set up overrides
2. Pick a folder
3. Right-click any resource → Save for overrides
4. Edit in DevTools → all loads of that URL serve your overridden version
// Useful for: testing CSS / config without touching the server</code></pre>

<h3>Snippets</h3>
<pre><code>Sources → Snippets → New
// Save reusable JS snippets, run with Cmd+Enter
// Example: a snippet that highlights all big images
[...document.images].forEach(i =&gt; {
  if (i.naturalWidth &gt; 2000) i.style.outline = '5px solid red';
});</code></pre>

<h3>Issues panel</h3>
<p>Auto-detected problems: deprecation warnings, mixed content, COOP/COEP, cookie issues, third-party tracker concerns. Often a fast fix list.</p>

<h3>Device emulation</h3>
<pre><code>Cmd+Shift+M → Device toolbar
- Pre-defined devices (iPhone, Pixel, iPad)
- Custom dimensions
- Throttle to mobile network
- Throttle CPU (4x slowdown for low-end devices)
- Touch simulation
- Geolocation override
- User-agent override</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — debug a click handler</h3>
<pre><code>1. Elements → click target element → see Event Listeners pane
2. See "click" handler → click the source link → jumps to handler in Sources
3. Set breakpoint at handler entry
4. Click button → execution pauses → inspect args + scope</code></pre>

<h3>Example 2 — find what's setting a className</h3>
<pre><code>1. Elements → right-click target → Break on → Attribute modifications
2. Trigger the change
3. DevTools pauses on the line that mutated class
4. Check call stack to trace the cause</code></pre>

<h3>Example 3 — slow API call investigation</h3>
<pre><code>1. Network → reproduce
2. Click failing request → see Timing tab
3. "Waiting (TTFB)" 2.5s → server is slow
4. "Stalled" 800ms → connection contention
5. Initiator column shows the JS that fired it</code></pre>

<h3>Example 4 — block a 3rd-party script</h3>
<pre><code>1. Network → right-click on suspect script → Block request URL
2. Reload — script never loaded
3. See if app still works without it
// Useful to debug "is this third-party causing INP regression?"</code></pre>

<h3>Example 5 — record a Performance trace</h3>
<pre><code>1. Performance → Record (red dot)
2. Click + scroll the slow page
3. Stop
4. Filmstrip at top — visual frames
5. Zoom into slow frame in main thread track
6. Click long task (red border) → see flame graph
7. Identify hot function: e.g., expensiveFilter() called 100x</code></pre>

<h3>Example 6 — heap snapshot to find a leak</h3>
<pre><code>1. Memory → Take snapshot (S1)
2. Click trash 🗑 to force GC first
3. Open + close modal 5x
4. Take snapshot S2
5. Choose Comparison vs S1
6. Filter "Detached" → 5 detached HTMLDivElements
7. Expand → Retainers → "ModalManager.history[N]"
8. Fix: clear history on close</code></pre>

<h3>Example 7 — find unused bundles</h3>
<pre><code>1. Cmd+Shift+P → "Show Coverage"
2. Click record + reload page
3. Interact normally
4. Stop
5. Sort by Unused bytes
6. main.js: 200KB total, 60% unused → split moments + chart-lib into lazy chunks</code></pre>

<h3>Example 8 — emulate a slow phone</h3>
<pre><code>1. Cmd+Shift+M → Device toolbar
2. Choose iPhone 13
3. Set network to "Slow 4G"
4. Set CPU to "4x slowdown"
5. Reload — measure perf as a real phone user</code></pre>

<h3>Example 9 — copy a network request as cURL</h3>
<pre><code>1. Network → right-click request → Copy → Copy as cURL
2. Paste in terminal
3. Modify, replay, debug server-side</code></pre>

<h3>Example 10 — log without modifying code</h3>
<pre><code>1. Sources → open file
2. Right-click line number → Add logpoint
3. Enter expression: 'user', user.id, 'page', page
4. Code runs without pausing; logs to console
// No code edit, no reload required</code></pre>

<h3>Example 11 — conditional breakpoint</h3>
<pre><code>1. Right-click line number → Edit breakpoint
2. Condition: user.id === 'admin' &amp;&amp; cart.length === 0
3. Only pauses when both true
// Save hours of stepping through the same code path</code></pre>

<h3>Example 12 — workspaces edit-and-save</h3>
<pre><code>1. Sources → Filesystem → + → choose project folder → Allow
2. Open a file in DevTools
3. Edit it (Cmd+S to save)
4. Local file system updated; HMR picks up the change
// Tighter than browser → file → IDE round-trip</code></pre>

<h3>Example 13 — local overrides for CSS testing</h3>
<pre><code>1. Sources → Overrides → Set up
2. Right-click main.css → Save for overrides
3. Edit it in DevTools
4. Reload — DevTools serves the overridden version
// Try a CSS change locally without server access</code></pre>

<h3>Example 14 — XHR breakpoint</h3>
<pre><code>1. Sources → Breakpoints panel → XHR/fetch Breakpoints
2. Add: contains "/api/users"
3. Reload — pauses on every fetch matching the pattern
4. Inspect the call stack to see what triggered it</code></pre>

<h3>Example 15 — "monitor" all calls</h3>
<pre><code class="language-js">// In console:
function login() { ... }
monitor(login);
// Every call to login logged with arguments
// unmonitor(login) to stop</code></pre>

<h3>Example 16 — find all instances of a class</h3>
<pre><code class="language-js">// In console:
queryObjects(MyComponent);
// → [MyComponent, MyComponent, ...]
// Useful for finding leaked instances</code></pre>

<h3>Example 17 — Lighthouse user-flow</h3>
<pre><code>// Programmatic Lighthouse via Node
const { generateUserFlow } = require('lighthouse');
const flow = await generateUserFlow(page, { name: 'Checkout' });
await flow.startNavigation();
await page.goto('https://example.com');
await flow.endNavigation();
await flow.startTimespan({ name: 'Add to cart' });
await page.click('#add');
await flow.endTimespan();
const report = await flow.generateReport();
fs.writeFileSync('flow.html', report);</code></pre>

<h3>Example 18 — Source map upload validation</h3>
<pre><code>1. Sources → minified file
2. Right-click → "Add source map" → paste URL
3. DevTools loads it; minified code now shows readable</code></pre>

<h3>Example 19 — disable JavaScript</h3>
<pre><code>Cmd+Shift+P → "Disable JavaScript"
// Reload → see what your page looks like for SEO crawlers / no-JS users
// Cmd+Shift+P → "Enable JavaScript" to re-enable</code></pre>

<h3>Example 20 — measuring a specific block</h3>
<pre><code class="language-js">performance.mark('start');
expensiveOperation();
performance.mark('end');
performance.measure('myBlock', 'start', 'end');

// Marks visible in Performance recording timeline as user-defined entries</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. DevTools changes performance</h3>
<p>The act of recording / debugging adds overhead. Numbers in Performance trace are slower than reality. For accurate measurements, RUM is better than DevTools.</p>

<h3>2. console.log retains references</h3>
<p>Logged objects are kept alive in DevTools console. Heavy logging in long sessions causes memory growth that's not in your app code. Strip in production.</p>

<h3>3. Source maps don't load</h3>
<p>Common causes: <code>//# sourceMappingURL</code> missing, file at wrong URL, CORS blocking the .map fetch, or path mismatch. Check Network for the .map request.</p>

<h3>4. Breakpoints don't fire after edit</h3>
<p>Source map went stale after a hot reload. Reload page; reset breakpoint.</p>

<h3>5. Network throttling missing TLS time</h3>
<p>Throttling simulates bandwidth + latency but doesn't model real cellular RTT variance. For accurate testing, use WebPageTest with real device + network.</p>

<h3>6. Heap snapshot crashes on huge heap</h3>
<p>Snapshotting 1GB+ heaps can hang DevTools. Profile with smaller scenarios; or use Node's <code>--inspect</code> for large server-side debugging.</p>

<h3>7. Coverage shows static-time used bytes only</h3>
<p>Coverage reports based on what's executed during the session. Code that runs on a different page (e.g., admin) shows as "unused" — not a real signal to delete.</p>

<h3>8. Storage cleared accidentally</h3>
<p>Application → Clear storage button wipes everything. Easy to click. Tip: use "Clear site data" only when intended.</p>

<h3>9. Service worker stuck</h3>
<p>Old SW caches old assets; reload doesn't update. Application → Service Workers → "Update on reload" + "Bypass for network" while developing.</p>

<h3>10. CORS errors mid-debugging</h3>
<p>Origin headers cause confusion. Check Network → response Headers; "Origin", "Access-Control-Allow-Origin" tell the story.</p>

<h3>11. Headless / remote debugging</h3>
<p><code>chrome --remote-debugging-port=9222</code> launches Chrome that DevTools can attach to. Useful for debugging Electron, Cypress, Puppeteer.</p>

<h3>12. Mobile remote debugging</h3>
<p>Connect Android phone via USB → chrome://inspect/#devices → select your tab. Real-device DevTools — invaluable for cross-device bugs.</p>

<h3>13. iOS Safari debugging</h3>
<p>iOS doesn't use Chrome DevTools. Connect iPhone via USB → Safari → Develop menu → your phone → tab. Different tools but similar workflow.</p>

<h3>14. Recording a slow scenario when JS is fine</h3>
<p>Performance trace shows mostly idle main thread, yet user reports lag. Likely: layout / paint / GPU bottleneck. Use Rendering panel: paint flashing + layer borders.</p>

<h3>15. Memory leak only in production</h3>
<p>Dev's React StrictMode double-mounts; production single-mounts. Build with production config, debug with hidden source maps + Sentry.</p>

<h3>16. Too many extensions polluting console</h3>
<p>Extensions can inject scripts. Use Incognito (extensions off) for a clean debug environment.</p>

<h3>17. <code>$_</code> not what you expect</h3>
<p>Last expression value. After a <code>$0</code> reference, <code>$_</code> updates — sometimes confusing chain.</p>

<h3>18. Network preserve log lost on tab close</h3>
<p>Preserve log keeps logs across navigation, NOT across tab restarts. Use HAR export to save.</p>

<h3>19. Lighthouse running into a different state</h3>
<p>Lighthouse navigates fresh + may not see auth state. Use "Timespan" mode for already-loaded apps.</p>

<h3>20. Animations panel missing</h3>
<p>Hidden by default. Cmd+Shift+P → "Show Animations". Lets you slow down + step through CSS / Web Animations.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — only console.log</h3>
<p>Slower than breakpoints; pollutes code; shipped to prod accidentally. Learn breakpoints.</p>

<h3>Anti-pattern 2 — no source maps</h3>
<p>Production stack traces unreadable. Always ship hidden source maps + upload to Sentry.</p>

<h3>Anti-pattern 3 — debugging dev build only</h3>
<p>Dev has different perf characteristics, different bundle, different runtime checks. Test prod builds before claiming "ready."</p>

<h3>Anti-pattern 4 — clicking around without recording</h3>
<p>Manual debugging "feels" perf — easily wrong. Use Performance trace; numbers don't lie.</p>

<h3>Anti-pattern 5 — never using command palette</h3>
<p>Cmd+Shift+P unlocks every feature. Faster than menu navigation.</p>

<h3>Anti-pattern 6 — debugging with extensions enabled</h3>
<p>Extensions inject. Use Incognito for clean reproduction.</p>

<h3>Anti-pattern 7 — alert() / confirm() for debug</h3>
<p>Blocking. Use console.log or breakpoints instead.</p>

<h3>Anti-pattern 8 — DevTools resized to tiny</h3>
<p>Some panels need width. Toggle dock position (right / bottom / undocked) for the panel you need.</p>

<h3>Anti-pattern 9 — running Lighthouse once</h3>
<p>Single run is noisy. Run 3-5x and take median. Or use Lighthouse CI for regression tracking.</p>

<h3>Anti-pattern 10 — debugging by reload</h3>
<p>Re-add breakpoints, re-enter test data. Keep state alive in DevTools; use logpoints instead of console.log.</p>

<h3>Anti-pattern 11 — ignoring Issues panel</h3>
<p>Auto-detected fixes for deprecation, mixed content, etc. Most teams never glance at it.</p>

<h3>Anti-pattern 12 — not using workspaces</h3>
<p>Edit-and-save in DevTools is a force multiplier. Sources → Filesystem → add folder.</p>

<h3>Anti-pattern 13 — forgetting "preserve log"</h3>
<p>Reload clears logs; can't see what happened before navigation. Toggle preserve log in Console + Network.</p>

<h3>Anti-pattern 14 — using <code>debugger;</code> in committed code</h3>
<p>Pauses for everyone. Strip via Babel transform-remove-debugger plugin.</p>

<h3>Anti-pattern 15 — assuming desktop perf = mobile perf</h3>
<p>4x CPU throttle + Slow 4G in Device toolbar reflects more realistic mobile experience.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you debug a slow page?</div>
  <div class="qa-answer">
    <ol>
      <li>Open Performance panel; record a session reproducing the slowness.</li>
      <li>Identify slow tasks (red bordered &gt;50ms long).</li>
      <li>Drill into the flame graph to find hot functions.</li>
      <li>Check Network for slow requests blocking critical path.</li>
      <li>Check Coverage for unused JS that could be split.</li>
      <li>Run Lighthouse for actionable suggestions.</li>
      <li>For mobile: emulate slow CPU + 4G throttling.</li>
      <li>Apply fixes; re-record to verify.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. How do you find what's setting an attribute?</div>
  <div class="qa-answer">
    <p>Elements → right-click target → Break on → Attribute modifications. Trigger the change. DevTools pauses on the line that mutated the attribute. Inspect the call stack to trace the cause.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you debug a memory leak?</div>
  <div class="qa-answer">
    <ol>
      <li>Memory panel → Take heap snapshot S1.</li>
      <li>Force GC (trash icon) before snapshotting for clean baseline.</li>
      <li>Reproduce the leaking action 5-10×.</li>
      <li>Force GC, take S2.</li>
      <li>Comparison view; sort by Δ count or Δ size.</li>
      <li>Look for "Detached" subtrees, growing class instances.</li>
      <li>Expand → Retainers → trace up the chain to find the holder.</li>
      <li>Fix; verify with another comparison.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What's the difference between <code>console.log</code>, breakpoint, and logpoint?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>console.log</strong>: requires editing code, redeploy/reload. Stays in code if you forget to remove.</li>
      <li><strong>breakpoint</strong>: pauses execution; inspect everything; step through.</li>
      <li><strong>logpoint</strong>: like console.log but added in DevTools without code edit. Logs an expression each time the line runs. No pause.</li>
    </ul>
    <p>Default to logpoint for non-blocking observation; breakpoint when you need to step.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's <code>$0</code> and how is it useful?</div>
  <div class="qa-answer">
    <p><code>$0</code> in the console is a reference to the currently selected element in the Elements panel. Lets you operate on it from JS:</p>
<pre><code class="language-js">$0.style.outline = '5px solid red';
getEventListeners($0);
$0.matches('button.primary');
queryObjects($0.constructor);</code></pre>
    <p>Massive workflow speed-up: select in Elements, manipulate in Console.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you simulate a slow mobile?</div>
  <div class="qa-answer">
    <ol>
      <li>Cmd+Shift+M → Device toolbar</li>
      <li>Choose a phone preset (iPhone, Pixel)</li>
      <li>Network throttle: Slow 4G or Slow 3G</li>
      <li>CPU throttle: 4× or 6× slowdown</li>
      <li>Reload → measure perf as a real user would</li>
    </ol>
    <p>Caveat: emulator approximates; real-device testing on a mid-range Android catches more.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you measure unused JS?</div>
  <div class="qa-answer">
    <p>Cmd+Shift+P → "Show Coverage". Click record, reload + interact, stop. Output lists files with used vs unused bytes. A 200KB file with 60% unused is a candidate to split (lazy load) or remove. Caveat: shows only what was executed during the session — code on other pages may legitimately be unused now.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why use logpoints instead of console.log?</div>
  <div class="qa-answer">
    <p>Logpoints add logs without code changes — no commit risk, no rebuild. Removed when you close DevTools. Faster debug loop. Especially valuable in production builds where you can't easily edit + reload — set logpoint via source maps, see the values without modifying source.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you debug a third-party script slowing your page?</div>
  <div class="qa-answer">
    <ol>
      <li>Network → block the script's URL (right-click → Block).</li>
      <li>Reload → see if your page improves.</li>
      <li>If yes, profile that script in Performance.</li>
      <li>Workarounds: load it async, defer via interaction, use Partytown to move to a worker.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Walk through diagnosing INP regression.</div>
  <div class="qa-answer">
    <ol>
      <li>Performance panel → record a session including the slow interaction.</li>
      <li>Filmstrip shows the slow frame.</li>
      <li>Click the long task on the main thread.</li>
      <li>Flame graph: identify slow function (your code or library).</li>
      <li>Check the event handler chain → React render → commit phase.</li>
      <li>If JS thread heavy: split with startTransition, defer to idle, move to worker.</li>
      <li>If layout thrashing: batch reads/writes.</li>
      <li>Re-record; verify INP improved.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What's an XHR breakpoint?</div>
  <div class="qa-answer">
    <p>Sources → Breakpoints → XHR/fetch Breakpoints → Add. Specify URL pattern. DevTools pauses on every <code>fetch</code> / XHR matching that URL. Inspect the call stack to find the code that fired it. Useful when "I have no idea what's making this request."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you persist a console log across reload?</div>
  <div class="qa-answer">
    <p>Toggle "Preserve log" in Console settings (top-right gear). Same toggle exists in Network. Without it, reload clears the log. Preserve log lets you see what happened before navigation.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's blackboxing?</div>
  <div class="qa-answer">
    <p>Tells DevTools to skip stepping through certain files (libraries you don't need to debug). Sources → right-click file → "Add script to ignore list", or configure regex in Settings → Ignore List. When stepping, DevTools jumps over those files. Stack traces hide them. Massively cleaner debugging when you're focused on your code, not React's internals.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How do you debug a service worker?</div>
  <div class="qa-answer">
    <p>Application → Service Workers. See registered SWs, their state (installing, activated, redundant). Inspect link opens DevTools attached to the SW context. "Update on reload" + "Bypass for network" useful while developing. Application → Storage → Clear storage to nuke a stuck SW.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What command palette commands do you use most?</div>
  <div class="qa-answer">
    <ul>
      <li>"Show Coverage" — bundle analysis.</li>
      <li>"Show Rendering" — paint flashing, layer borders.</li>
      <li>"Show Animations" — animation timeline.</li>
      <li>"Disable JavaScript" — see what crawlers see.</li>
      <li>"Show Issues" — auto-detected problems.</li>
      <li>"Capture full size screenshot" — page screenshot.</li>
      <li>"Show Network conditions" — UA override, throttling presets.</li>
    </ul>
    <p>Cmd+Shift+P is the most-used shortcut.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You use breakpoints (conditional + logpoints) over console.log.</li>
    <li>You record Performance traces to debug perf.</li>
    <li>You use heap snapshot Comparison to find leaks.</li>
    <li>You know <code>$0</code>, <code>$_</code>, <code>copy()</code>, <code>monitor()</code>, <code>queryObjects()</code>.</li>
    <li>You use Network throttling + CPU throttling for mobile testing.</li>
    <li>You use Coverage to find unused bytes.</li>
    <li>You use Local Overrides + Workspaces for in-tool editing.</li>
    <li>You use the command palette (Cmd+Shift+P) heavily.</li>
    <li>You blackbox library code from stepping.</li>
    <li>You ship hidden source maps for prod debugging via Sentry.</li>
  </ul>
</div>
`}

]
});
