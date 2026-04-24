window.PREP_SITE.registerTopic({
  id: 'rn-debugging',
  module: 'React Native',
  title: 'Debugging',
  estimatedReadTime: '22 min',
  tags: ['react-native', 'debugging', 'flipper', 'react-devtools', 'xcode', 'android-studio', 'hermes', 'sentry'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>RN debugging touches three domains: JavaScript, React, and native. Different tools for each.</p>
<ul>
  <li><strong>Flipper</strong> — the legacy Facebook tool; unified JS/React/Layout/Network debugger. RN 0.75+ de-emphasized it; still works for older versions.</li>
  <li><strong>React Native DevTools</strong> (new, RN 0.76+) — built-in Chrome-based debugger with proper Hermes + React Profiler + Network + Components integration. Replaces "Debug with Chrome."</li>
  <li><strong>React DevTools (standalone)</strong> — dedicated Electron app. Component tree, props, Profiler. Works over websocket.</li>
  <li><strong>Xcode</strong> — native iOS debugging: breakpoints, logs (Console.app), Instruments (CPU / memory / animation).</li>
  <li><strong>Android Studio</strong> — native Android debugging: Logcat, Profiler (CPU, memory, network, energy), Layout Inspector.</li>
  <li><strong>Perf Monitor</strong> (Dev Menu) — in-app overlay showing JS FPS + UI FPS + memory.</li>
  <li><strong>Sentry / Crashlytics</strong> — production crash reporting with symbolicated JS + native stacks.</li>
  <li><strong>Reactotron</strong> — third-party desktop tool for log streaming + state inspection.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Debug JS with React Native DevTools or React DevTools. Debug native perf with Instruments / Android Studio Profiler. Debug production crashes with Sentry. Know where to look per symptom — trying to find a native crash in JS DevTools wastes hours.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The debugging matrix</h3>
<table>
  <thead><tr><th>Symptom</th><th>Likely domain</th><th>Tool</th></tr></thead>
  <tbody>
    <tr><td>JS exception, bad state</td><td>JS/React</td><td>React Native DevTools, React DevTools</td></tr>
    <tr><td>Wrong render output, prop mismatch</td><td>React</td><td>React DevTools Components tab</td></tr>
    <tr><td>Perf lag, slow renders</td><td>React/JS</td><td>React DevTools Profiler, Perf Monitor</td></tr>
    <tr><td>UI thread jank</td><td>Native render</td><td>Instruments "Animation Hitches", Android Systrace</td></tr>
    <tr><td>Memory leak, OOM</td><td>JS or native</td><td>Memory snapshots (DevTools, Xcode, Android Studio)</td></tr>
    <tr><td>Native crash</td><td>Native</td><td>Xcode Console, Android Studio Logcat, Sentry native symbols</td></tr>
    <tr><td>Network issue</td><td>Runtime</td><td>Flipper Network, Charles / Proxyman, DevTools Network tab</td></tr>
    <tr><td>Layout wrong</td><td>Native layout</td><td>Xcode View Debugger, Android Layout Inspector</td></tr>
    <tr><td>Build failure</td><td>Build</td><td>Xcode build log, gradle output, Metro logs</td></tr>
  </tbody>
</table>

<h3>Why Flipper was replaced (partially)</h3>
<p>Flipper was Meta's unified debugger — one window for everything. But it became complex to maintain across RN versions, had its own plugin ecosystem that lagged. Meta announced reduced investment in 2022-2023. RN 0.76+ shifted to <strong>React Native DevTools</strong> (Chrome-based, built on Hermes) for most workflows. Flipper still works but isn't the primary path forward.</p>

<h3>Why "Debug in Chrome" is deprecated</h3>
<p>Old "Debug with Chrome" actually ran your JS in Chrome's V8 — not on-device Hermes. Behavior differed subtly. The new React Native DevTools uses a Hermes-native debugger so you debug the exact JS that runs in production.</p>

<h3>Why Sentry (or similar) is non-negotiable in production</h3>
<p>Users don't file bug reports with stack traces. Without crash reporting:</p>
<ul>
  <li>You don't know your app's crash rate.</li>
  <li>You can't correlate spikes with releases.</li>
  <li>Bugs reproduce only in production environments.</li>
</ul>
<p>Sentry captures JS + native stacks, symbolicates via uploaded source maps and dSYM/proguard mapping files, groups by fingerprint, alerts on spikes.</p>

<h3>Why native profiling matters</h3>
<p>RN perf is not all JS. Main-thread work, view count, image decode, native gesture handling all contribute. Xcode Instruments + Android Studio Profiler reveal the native half. If JS FPS is 60 but UI FPS is 30, the problem is native — JS tools won't help.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "three runtimes" picture</h3>
<div class="diagram">
<pre>
  JS (Hermes / JSC)         Native (iOS / Android)
  ────────────────         ──────────────────────
  DevTools: RN DevTools,    DevTools: Xcode,
    React DevTools            Android Studio
  Profiler: React Profiler,  Profiler: Instruments,
    Flipper Perf              Android Profiler
  Logs: console              Logs: NSLog / Logcat
  Crashes: Sentry JS         Crashes: Sentry native
                             (with dSYM / mapping)</pre>
</div>

<h3>The "Dev Menu" picture</h3>
<pre><code>Shake device or Cmd+D (iOS simulator) / Cmd+M (Android emulator):

  Reload
  Debug JS Remotely (deprecated, use DevTools)
  Enable Fast Refresh
  Toggle Element Inspector
  Show Perf Monitor           ← JS FPS + UI FPS + memory
  Show Element Tree (dev only)
  Open DevTools                ← new React Native DevTools

Usually accessed via: npx react-native start → d key to open Dev Menu remotely</code></pre>

<h3>The "perf monitor overlay" picture</h3>
<pre><code>RAM     153 MB
JS     60 fps       ← below 58 → JS thread overloaded
UI     60 fps       ← below 58 → native render overloaded
Views  1234         ← total mounted native views</code></pre>

<h3>The "symbolication flow" (production crash)</h3>
<div class="diagram">
<pre>
  User crashes in production
      │
      ▼
  Sentry captures raw stack (minified JS, mangled native)
      │
      ▼
  Sentry looks up uploaded artifacts:
    - JS source map (for minified JS → readable)
    - dSYM (iOS native symbols)
    - proguard mapping.txt (Android minified → original)
      │
      ▼
  You see readable stack in Sentry UI</pre>
</div>

<h3>The "debug vs release" picture</h3>
<pre><code>Debug (local)                     Release (TestFlight / Play)
─────────────                     ────────────────────────
- DevTools attachable              - DevTools typically disabled
- Fast Refresh                     - Static bundle
- __DEV__ = true                   - __DEV__ = false
- Source maps inline               - Maps uploaded to crash service
- Console logs pass through        - Logs often stripped
- Hermes JS source                 - Hermes bytecode</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"I can debug a release build the same way as dev." Release builds strip debugging hooks. To debug a near-release state, build in "release" configuration locally and attach. For production crashes, Sentry + symbolication is the path — don't try to reproduce with DevTools.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>React Native DevTools (RN 0.76+)</h3>
<pre><code>npx react-native start
# Press 'j' to open DevTools in your default browser</code></pre>
<p>What you get:</p>
<ul>
  <li><strong>Console</strong> — JS logs, evaluate expressions.</li>
  <li><strong>Sources</strong> — set breakpoints in your TS/JS.</li>
  <li><strong>Network</strong> — watch fetch calls, responses.</li>
  <li><strong>Components</strong> — React tree, props, state.</li>
  <li><strong>Profiler</strong> — React render times.</li>
  <li><strong>Memory</strong> — heap snapshots.</li>
</ul>

<h3>React DevTools standalone</h3>
<pre><code># Install
npm install -g react-devtools
# Run
react-devtools
# In your app: app connects automatically over websocket</code></pre>

<h3>Flipper (legacy but still works)</h3>
<pre><code># Download the Flipper desktop app
# Run your RN app in dev → Flipper auto-detects connected devices
# Plugins:
- React DevTools
- Layout Inspector
- Network
- Databases (SQLite browser)
- Crash reporter
- Redux Debugger (if you're on Redux)</code></pre>

<h3>In-app Perf Monitor</h3>
<pre><code>Dev Menu → Show Perf Monitor
Shows JS FPS, UI FPS, memory, views count, time since last frame.
Drop below 58 → red; investigate.</code></pre>

<h3>Element Inspector</h3>
<pre><code>Dev Menu → Toggle Element Inspector
Tap any element → shows component name, style, layout dimensions.
Useful for "what is rendering here?" questions.</code></pre>

<h3>Native iOS — Xcode</h3>
<pre><code># Run from Xcode: builds + attaches debugger
# Can set breakpoints in ObjC / Swift
# View console (View → Debug Area)

# Profile with Instruments:
Product → Profile → pick template
  - Time Profiler
  - Allocations / Leaks
  - Animation Hitches (iOS 15+)
  - Network Diagnostics</code></pre>

<h3>Native Android — Android Studio</h3>
<pre><code># Open android/ folder in Android Studio
# Run → Attach Debugger to Android Process
# Logcat tab: filter by package name to see RN logs + crashes

# Profiler (View → Tool Windows → Profiler):
  - CPU: flame graph, system traces
  - Memory: heap dumps, allocations
  - Network
  - Energy</code></pre>

<h3>Viewing device logs (non-IDE)</h3>
<pre><code># iOS:
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "YourApp"'
# or:
npx react-native log-ios

# Android:
adb logcat | grep -i ReactNativeJS
# or:
npx react-native log-android</code></pre>

<h3>Reactotron</h3>
<pre><code># Reactotron is a standalone app for:
- Logs + custom events
- Redux state / actions
- Async storage viewer
- API call logs
- Custom commands

# Setup:
npm install --save-dev reactotron-react-native reactotron-redux

// in index.tsx (dev only)
if (__DEV__) require('./ReactotronConfig');</code></pre>

<h3>Debugging bridges (legacy) / JSI</h3>
<p>You can't easily step through JSI bridge calls. Use:</p>
<ul>
  <li>Add <code>console.log</code> inline at the JS boundary.</li>
  <li>Set breakpoints in JS with DevTools.</li>
  <li>Set breakpoints in native code with Xcode / Android Studio.</li>
</ul>

<h3>Crash dump analysis</h3>
<p>iOS: <code>.ips</code> crash reports from TestFlight / devices; symbolicate with matching dSYM (via <code>atos</code> or Xcode Organizer). Android: ANR and tombstone files under <code>/data/tombstones/</code>; <code>adb bugreport</code> to export.</p>

<h3>Network debugging</h3>
<pre><code># Flipper Network plugin: auto-captures fetch/XHR

# Proxy-based: Charles Proxy / Proxyman / mitmproxy
# Configure simulator proxy to point at Charles.
# HTTPS requires installing Charles CA cert on the simulator/device.

# For React Query: React Query DevTools (if supported in RN) + Sentry breadcrumbs.</code></pre>

<h3>LogBox</h3>
<pre><code>// In dev, RN shows a LogBox for warnings and errors.
LogBox.ignoreLogs(['Warning: text that should be ignored']);
LogBox.ignoreAllLogs();   // nuclear

// Don't use ignoreAllLogs in production; strip console instead.</code></pre>

<h3>Source maps for Sentry</h3>
<pre><code># After EAS or Fastlane build:
SENTRY_AUTH_TOKEN=... npx @sentry/cli sourcemaps upload --release "myapp@1.2.3+42" dist/

# Native iOS dSYMs:
SENTRY_AUTH_TOKEN=... npx @sentry/cli debug-files upload --org=myorg --project=myapp ios/build</code></pre>

<h3>React Profiler (for renders)</h3>
<pre><code>1. Open DevTools → Profiler tab
2. Click record
3. Interact with the app
4. Stop
5. See commits + per-component render times, "why did this render"</code></pre>

<h3>Layout Inspector (Android)</h3>
<pre><code>Android Studio → Tools → Layout Inspector → select running app
Shows native view tree with properties, lets you inspect individual views.</code></pre>

<h3>View Debugger (iOS)</h3>
<pre><code>Xcode with app running → Debug → View Debugging → Capture View Hierarchy
3D exploded view of the native UIView tree.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — breakpoint in a useEffect</h3>
<pre><code class="language-ts">useEffect(() =&gt; {
  debugger;                    // DevTools pauses here in dev
  loadData(userId);
}, [userId]);</code></pre>

<h3>Example 2 — React Profiler session</h3>
<pre><code>1. Open DevTools → Profiler
2. Click "Record"
3. Scroll through the slow screen
4. Stop
5. Flamegraph: look for bars &gt;16ms
6. Ranked: identify top offenders
7. "Why did this render?": per-commit inspection
8. Fix, re-profile</code></pre>

<h3>Example 3 — Perf Monitor during scroll</h3>
<pre><code>Dev Menu → Show Perf Monitor
Scroll the list rapidly.
Observe: JS FPS drops from 60 → 40 during scroll.
Conclusion: JS thread overloaded on renderItem.
Fix: memoize Row, useCallback, maybe FlashList.</code></pre>

<h3>Example 4 — Xcode Instruments for animations</h3>
<pre><code>Product → Profile → Animation Hitches template
Interact with the animation.
See: "Frame duration: 22ms" in red → dropped frames.
Inspect stack trace: heavy native layout / image decode.
Fix: reduce view count, use transform, offload decode.</code></pre>

<h3>Example 5 — Memory leak hunt</h3>
<pre><code>1. DevTools Memory → take heap snapshot (baseline)
2. Navigate into feature, interact, back out 5x
3. Take second snapshot
4. Compare view: filter by "Delta"
5. Components with growing counts = likely leaks
6. Expand "Retainers" to trace the reference chain</code></pre>

<h3>Example 6 — Android native crash</h3>
<pre><code>1. adb logcat | grep -i "FATAL EXCEPTION"
2. Find the stack trace
3. If obfuscated: decode with proguard mapping.txt
4. java.lang.NullPointerException: Attempt to invoke virtual method '...' on a null object reference
5. Locate the line, patch</code></pre>

<h3>Example 7 — network debug with Proxyman</h3>
<pre><code>1. Install Proxyman on Mac
2. Simulator → Settings → Wi-Fi → HTTP Proxy = localhost:9090
3. Install Proxyman CA cert in simulator
4. Launch app: see all requests/responses
5. Modify responses on the fly for testing edge cases</code></pre>

<h3>Example 8 — symbolicate a JS stack</h3>
<pre><code># If you have a crash log with minified JS stack:
npx react-native-symbolicate-stack \\
  --stackFile crash.json \\
  --bundlePath dist/main.jsbundle.map

# Or via Metro:
npx react-native symbolicate-js \\
  --sourcemap=dist/main.jsbundle.map \\
  --input=crash.txt</code></pre>

<h3>Example 9 — Sentry setup in code</h3>
<pre><code class="language-ts">import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://...',
  environment: __DEV__ ? 'development' : 'production',
  release: 'myapp@1.2.3+42',
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (event.exception?.values?.[0]?.value?.includes('expected-dev-error')) return null;
    return event;
  },
});</code></pre>

<h3>Example 10 — tag errors with context</h3>
<pre><code class="language-ts">Sentry.setUser({ id: user.id });
Sentry.setTag('feature_flags', JSON.stringify(flags));
Sentry.setContext('cart', { itemCount, total });

// Wrap risky calls
try {
  await payApi.charge(cart);
} catch (e) {
  Sentry.captureException(e, { tags: { action: 'charge' } });
  throw e;
}</code></pre>

<h3>Example 11 — custom console logger</h3>
<pre><code class="language-ts">const log = (...args: unknown[]) =&gt; {
  if (__DEV__) console.log('[MyApp]', ...args);
  // In prod, maybe send to Sentry breadcrumb
};</code></pre>

<h3>Example 12 — Reactotron redux monitor</h3>
<pre><code class="language-ts">// ReactotronConfig.ts
import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';

Reactotron.configure({ name: 'MyApp' }).use(reactotronRedux()).connect();
export default Reactotron;

// Reducer wiring:
const store = createStore(reducer, compose(Reactotron.createEnhancer()));
// Actions + state visible in Reactotron app in real time.</code></pre>

<h3>Example 13 — Performance API</h3>
<pre><code class="language-ts">import { InteractionManager } from 'react-native';
// Measure render + interaction time
const t0 = performance.now();
await waitForInteractions();
console.log('TTI', performance.now() - t0);</code></pre>

<h3>Example 14 — debug a Detox flaky test</h3>
<pre><code class="language-ts">// Capture screenshot on failure
afterEach(async () =&gt; {
  if (jasmine.currentTest.failedExpectations.length) {
    await device.takeScreenshot('failure-' + Date.now());
  }
});</code></pre>

<h3>Example 15 — bisect a regression</h3>
<pre><code>git log --oneline --since='2 weeks ago'
# Identify suspect commits; checkout each; test.
# Or automate: git bisect, providing a script that runs your reproducer.
git bisect start
git bisect bad HEAD
git bisect good v1.2.0
# Git checks out mid commits; you run test + mark good/bad; converges to offender.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. DevTools can't connect</h3>
<p>Firewall blocking, emulator's <code>10.0.2.2</code> mapping, Metro on wrong port. Verify <code>npx react-native start</code> is running; on Android Studio emulator, host Mac's IP differs from device. Expo's dev tools usually handle automatically.</p>

<h3>2. Breakpoint doesn't fire</h3>
<p>Source maps stale after a code change. Reload metro (<code>r</code> in Metro), clear DevTools, reload app. Sometimes Hermes needs a full rebuild if bytecode cached from a prior state.</p>

<h3>3. Crash on Hermes but works in JSC (or vice versa)</h3>
<p>Engine-specific JS behavior (regex, Intl, edge cases in iterators). Reproduce on both; log engine version; open an issue.</p>

<h3>4. Release crash not reproducible in dev</h3>
<p>Different engine mode, minification, missing assets, Flipper dependencies removed. Build a release binary locally (<code>npm run ios --configuration Release</code>) and attach to it.</p>

<h3>5. Sentry stack is obfuscated</h3>
<p>Source maps not uploaded. Run the <code>sentry-cli</code> upload after each build. For native: upload dSYMs after iOS archive; upload <code>mapping.txt</code> after Android proguard run.</p>

<h3>6. Android Studio connects but no Logcat output</h3>
<p>Filter is on wrong package. Set filter to your app's package name. Also check log level — sometimes "Error" filter hides "Info."</p>

<h3>7. Xcode sees app but breakpoints don't hit</h3>
<p>Using Metro's hot reload: the JS changed after Xcode cached. Stop + restart Xcode run. Also: switch from "Debug JS" (deprecated) to Hermes-native debugger.</p>

<h3>8. Memory snapshot crash</h3>
<p>Taking heap snapshots of a large app can crash the debugger. Reduce before snapshotting; force GC first.</p>

<h3>9. Sentry rate-limit</h3>
<p>Free tier throttles. A crash loop can hit the limit and lose events. Configure <code>beforeSend</code> to de-duplicate; upgrade plan if needed.</p>

<h3>10. Flipper plugin out of date</h3>
<p>Plugins lag RN updates. Check GitHub issues; sometimes you're stuck on old Flipper until updated. New React Native DevTools mostly replaces it.</p>

<h3>11. Memory leak in a native module</h3>
<p>JS-side debug doesn't show it. Use Xcode Instruments Allocations / Leaks or Android Studio Memory Profiler; look at native heap growth after repeated actions.</p>

<h3>12. Broken network due to ATS (iOS)</h3>
<p>iOS blocks plaintext HTTP by default (App Transport Security). In development, allow exceptions in Info.plist. In production, ship HTTPS only.</p>

<h3>13. console.log in production builds</h3>
<p>Still executes unless stripped. Each log costs parse + Metro bridge. Add Babel plugin <code>transform-remove-console</code> in release.</p>

<h3>14. Zombie RN instances</h3>
<p>Old RN instances not torn down (embedded apps with multiple roots). Memory leaks of "the old React tree." Explicitly dispose via RN lifecycle.</p>

<h3>15. Errors swallowed by Promise</h3>
<p>Unhandled promise rejection silently fails. Install a global handler:</p>
<pre><code class="language-ts">global.HermesInternal?.enablePromiseRejectionTracker?.({ allRejections: true, onUnhandled: (id, err) =&gt; Sentry.captureException(err) });</code></pre>

<h3>16. Fast Refresh masks a crash</h3>
<p>Error → RN auto-reloads → user never sees red screen. Watch Metro output; turn off Fast Refresh if investigating.</p>

<h3>17. Simulator differs from device</h3>
<p>Features not working on device: push notifications, biometrics, camera, performance. Always test on a physical device for final validation.</p>

<h3>18. Crashed with no stack</h3>
<p>iOS sometimes kills apps for memory pressure (jetsam) with no JS stack. Check iOS "jetsam events" in Instruments; reduce memory usage.</p>

<h3>19. Broken SSL in dev</h3>
<p>Local dev server using self-signed cert. Android blocks. Use a real domain + dev TLS cert (mkcert) or trust-store workarounds.</p>

<h3>20. OTA update crashes</h3>
<p>New JS bundle references a native API not in the installed binary. runtimeVersion should prevent, but if misconfigured, crash happens. Always bump runtimeVersion on native change.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — debugging in production mode locally</h3>
<p>Release builds strip DevTools. Reproduce in a Release config only when you need to (e.g., minifier bug).</p>

<h3>Anti-pattern 2 — relying on console.log for production debugging</h3>
<p>Logs either stripped (good) or flood Metro/transmission (bad). Use Sentry breadcrumbs + structured logging.</p>

<h3>Anti-pattern 3 — no crash reporting</h3>
<p>Without Sentry, you discover crashes from user reviews days later. Install from day 1.</p>

<h3>Anti-pattern 4 — not uploading source maps</h3>
<p>Obfuscated stack in Sentry = wasted data. Automate in CI.</p>

<h3>Anti-pattern 5 — Flipper-only workflow</h3>
<p>Flipper is being deprecated. Migrate to React Native DevTools + Reactotron.</p>

<h3>Anti-pattern 6 — ignoring LogBox warnings</h3>
<p>Yellow/red boxes mean something. "Ignored" warnings compound; each might be hiding a real bug.</p>

<h3>Anti-pattern 7 — blaming Hermes for every odd bug</h3>
<p>Most "Hermes bugs" turn out to be your code's behavior differences. Reproduce in V8 (via DevTools) and Hermes (release build) before filing.</p>

<h3>Anti-pattern 8 — debugging via screenshots from users</h3>
<p>Users send a photo of a screen. Install RUM + session replay (Sentry has this) for actionable reproduction.</p>

<h3>Anti-pattern 9 — not validating release builds</h3>
<p>Dev works; release crashes on launch. Always build + smoke-test release on simulator before shipping.</p>

<h3>Anti-pattern 10 — symbolicating manually</h3>
<p>For every crash, manually decoding maps. Automate — Sentry does this; set it up once.</p>

<h3>Anti-pattern 11 — no user context on errors</h3>
<p>Sentry shows a stack but no user ID, app version, feature flag state. Set these globally; enriched errors save hours.</p>

<h3>Anti-pattern 12 — copying code from logs to email</h3>
<p>Instead, link to the Sentry / Logcat entry. Keeps trace + context.</p>

<h3>Anti-pattern 13 — debugging in JS when the bug is native</h3>
<p>Touch events not firing, memory growing — check native side first via platform profilers.</p>

<h3>Anti-pattern 14 — console.log inside render</h3>
<p>Fires on every render. Noisy; costly. Move to useEffect or Profiler-style inspection.</p>

<h3>Anti-pattern 15 — ignoring source map size</h3>
<p>Source maps balloon with complex code; upload to Sentry + CDN but don't ship to users (sourceMappingURL pointing at hosted map is fine; inline is not).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. A user reports "the app is slow." How do you investigate?</div>
  <div class="qa-answer">
    <ol>
      <li>Clarify: slow to open? slow to scroll? slow after specific action?</li>
      <li>Ask for device model, OS version, app version.</li>
      <li>Reproduce on same model if possible; if not, similar mid-range device.</li>
      <li>Use Perf Monitor (Dev Menu) or RUM data for JS/UI FPS.</li>
      <li>React Profiler for render times, Instruments / Android Profiler for native.</li>
      <li>Check Sentry for correlated slowness or crashes.</li>
      <li>Fix the top bottleneck; verify via RUM trend.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Debug tools for JS, React, and native — name them.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>JS</strong>: React Native DevTools (new, 0.76+), Reactotron, Flipper (legacy).</li>
      <li><strong>React</strong>: React DevTools (standalone or in RN DevTools), Profiler.</li>
      <li><strong>iOS native</strong>: Xcode Console / Instruments / View Debugger.</li>
      <li><strong>Android native</strong>: Android Studio Logcat / Profiler / Layout Inspector.</li>
      <li><strong>Network</strong>: Flipper Network, DevTools Network, Proxyman, Charles.</li>
      <li><strong>Production</strong>: Sentry, Firebase Crashlytics, Datadog RUM.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why did Meta move away from Flipper?</div>
  <div class="qa-answer">
    <p>Flipper's plugin ecosystem became hard to maintain across RN versions; its architecture (Electron + desktop plugins) was heavy. RN 0.76 introduced React Native DevTools based on Chrome DevTools + Hermes native debugger — lighter, unifies JS/React/Network/Profiler, debugs the actual on-device engine rather than Chrome V8. Flipper still works but isn't the primary path.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you debug a native crash in production?</div>
  <div class="qa-answer">
    <ol>
      <li>Sentry / Crashlytics captures the native crash with platform-specific stack.</li>
      <li>Symbolicate using uploaded dSYM (iOS) or proguard mapping (Android) — Sentry does this automatically if the artifacts are uploaded.</li>
      <li>Stack trace shows class, method, line number.</li>
      <li>Reproduce locally if possible; otherwise read code + logs for clues.</li>
      <li>Fix, release, monitor that the crash rate drops.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Scroll is janky. What's your first check?</div>
  <div class="qa-answer">
    <ol>
      <li>Perf Monitor: JS FPS vs UI FPS during scroll.</li>
      <li>If JS FPS drops: unmemoized row, heavy render, non-stable key. Fix with memoization, FlashList.</li>
      <li>If UI FPS drops: too many native views, image decode, layout thrash. Simplify row, use transform for animations.</li>
      <li>Re-measure.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you set up Sentry correctly?</div>
  <div class="qa-answer">
    <ol>
      <li>Install <code>@sentry/react-native</code>, run the CLI setup.</li>
      <li>Init in your app entry with DSN, environment, release version ("app@1.2.3+42").</li>
      <li>Upload source maps per JS build (EAS has a built-in step).</li>
      <li>Upload dSYM (iOS) and mapping.txt (Android) per native build.</li>
      <li>Set user context on login: <code>Sentry.setUser({ id })</code>.</li>
      <li>Wrap navigation with <code>Sentry.ReactNavigationInstrumentation</code> for perf tracing.</li>
      <li>Configure <code>beforeSend</code> to drop noise, scrub PII.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What's in the Dev Menu and when do you use each option?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Reload</strong>: after a change that didn't hot-reload.</li>
      <li><strong>Toggle Inspector</strong>: find which component renders a pixel.</li>
      <li><strong>Show Perf Monitor</strong>: JS/UI FPS, memory, views.</li>
      <li><strong>Enable Fast Refresh</strong>: on by default in dev.</li>
      <li><strong>Open DevTools</strong>: full debugger.</li>
    </ul>
    <p>Dev Menu opens via shake, Cmd+D (iOS sim), Cmd+M (Android emulator), or <code>d</code> key in Metro.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Your app crashes on Android only. Where do you look?</div>
  <div class="qa-answer">
    <ol>
      <li>Logcat in Android Studio or <code>adb logcat</code>.</li>
      <li>Filter by app package or tag ReactNativeJS.</li>
      <li>Look for FATAL EXCEPTION.</li>
      <li>Stack trace → identify method.</li>
      <li>If native (Java/Kotlin): check permission, null handling, gradle proguard rules.</li>
      <li>If JS: check Android-specific paths (different keyboard behavior, different runtime), maybe a library that requires Android linking.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you debug a memory leak?</div>
  <div class="qa-answer">
    <ol>
      <li>Reproduce the leak — repeat an action 5-10 times.</li>
      <li>Take a baseline heap snapshot (DevTools Memory).</li>
      <li>Do the action.</li>
      <li>Take another snapshot.</li>
      <li>Compare: filter by Delta.</li>
      <li>Growing types? Expand to retainers — see the reference chain keeping them alive.</li>
      <li>Common culprits: listeners not unsubscribed, timers not cleared, module-level arrays, observers not disconnected.</li>
      <li>For native leaks: Xcode Allocations / Android Profiler Memory.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you debug a flaky E2E test?</div>
  <div class="qa-answer">
    <ol>
      <li>Capture screenshots on failure.</li>
      <li>Replace any <code>sleep(ms)</code> with <code>waitFor</code>.</li>
      <li>Reset app state (<code>device.reloadReactNative</code>) between tests.</li>
      <li>Check for animations not finishing; Detox's sync should handle.</li>
      <li>Increase launch timeout if CI is slow.</li>
      <li>Verify no test depends on state from another test.</li>
      <li>If still flaky: move flow to Maestro (different instrumentation).</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. console.log in production — safe?</div>
  <div class="qa-answer">
    <p>Not ideal. Every log costs string coercion and Metro transmission. Strip in release builds via Babel plugin <code>transform-remove-console</code>. For intentional logging (errors, audit events), use Sentry breadcrumbs + structured logging to a remote sink.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you handle an unhandled promise rejection?</div>
  <div class="qa-answer">
<pre><code class="language-ts">global.HermesInternal?.enablePromiseRejectionTracker?.({
  allRejections: true,
  onUnhandled: (id, err) =&gt; Sentry.captureException(err),
});</code></pre>
    <p>Otherwise, silent rejections lose data. Hermes supports this directly. In production, route to Sentry for visibility.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. A regression appeared. How do you bisect?</div>
  <div class="qa-answer">
<pre><code>git bisect start
git bisect bad HEAD
git bisect good v1.2.0
# Git checks out mid-commit; you run the reproducer; mark good/bad.
# Converges to the first bad commit.</code></pre>
    <p>Automate with a script (<code>git bisect run ./test.sh</code>) for speed when reproducer is scriptable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What's Reactotron good for?</div>
  <div class="qa-answer">
    <p>Lightweight dev observability — log stream, state inspection (Redux / MST), custom events, async storage viewer, API logs. Lower ceremony than Flipper, good for small teams. Not for production debugging. Installable per project via <code>reactotron-*</code> packages.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Describe your end-to-end observability setup.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Crash reporting</strong>: Sentry — JS + native symbolicated stacks, user context, release tagging.</li>
      <li><strong>RUM</strong>: LCP/INP/CLS equivalents on mobile (cold-start time, screen-load time, gesture responsiveness) via Sentry Perf or Firebase Performance.</li>
      <li><strong>Analytics</strong>: Amplitude / PostHog / custom — screen views, key events.</li>
      <li><strong>Feature flags</strong>: LaunchDarkly / ConfigCat for rollout + kill switches.</li>
      <li><strong>Logs</strong>: Sentry breadcrumbs for state prior to errors; don't ship raw console.logs.</li>
      <li><strong>Session replay</strong> (optional): Sentry Replay / LogRocket for hard-to-reproduce bugs.</li>
      <li><strong>Dashboards</strong>: crash rate per version, p75 cold-start, top crashing screens — visible to the team.</li>
    </ul>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You map symptoms to the right tool (JS / React / native / network).</li>
    <li>You use React Native DevTools + React DevTools + Profiler.</li>
    <li>You install Sentry and upload symbols.</li>
    <li>You reach for Instruments / Android Studio Profiler for native perf.</li>
    <li>You use Perf Monitor during dev.</li>
    <li>You track p75 cold-start + crash rate per release.</li>
    <li>You handle unhandled promise rejections.</li>
    <li>You bisect to find regressions.</li>
  </ul>
</div>
`}

]
});
