window.PREP_SITE.registerTopic({
  id: 'dbg-mobile',
  module: 'Debugging',
  title: 'Mobile Debugging',
  estimatedReadTime: '24 min',
  tags: ['debugging', 'mobile', 'react-native', 'flipper', 'xcode', 'android-studio', 'safari', 'remote-debugging'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Mobile debugging spans web (Mobile Safari, Chrome on Android) and native apps (React Native, Flutter, native iOS/Android). Different tools per stack; common workflows.</p>
<ul>
  <li><strong>Mobile Safari (iOS)</strong> — connect device via USB, debug via macOS Safari → Develop menu.</li>
  <li><strong>Chrome on Android</strong> — connect device via USB, <code>chrome://inspect/#devices</code> on desktop.</li>
  <li><strong>React Native DevTools</strong> (RN 0.76+) — built-in Chrome-based debugger with React + Hermes integration.</li>
  <li><strong>React DevTools standalone</strong> — Electron app for inspecting RN component trees.</li>
  <li><strong>Flipper</strong> — legacy Facebook tool; still works for older RN versions but de-emphasized.</li>
  <li><strong>Xcode Instruments / Console</strong> — native iOS perf + crash + log debugging.</li>
  <li><strong>Android Studio Profiler / Logcat</strong> — native Android equivalent.</li>
  <li><strong>Sentry / Crashlytics</strong> — production crash reporting with symbolication for both JS + native.</li>
  <li><strong>Reactotron</strong> — third-party RN dev tool for log streaming + state inspection.</li>
  <li><strong>Real device testing</strong> — simulators / emulators are approximations. Critical features (camera, biometrics, push, performance) need real devices.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Different stacks, different tools. Web on mobile: connect device + use desktop browser DevTools. RN: React Native DevTools + native platform tools (Xcode / Android Studio) for the native side. Production: Sentry with symbols. Always test critical paths on real devices.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The mobile debugging matrix</h3>
<table>
  <thead><tr><th>Stack</th><th>JS / app debugger</th><th>Native</th><th>Production crashes</th></tr></thead>
  <tbody>
    <tr><td>Mobile web (iOS Safari)</td><td>Safari Develop menu</td><td>—</td><td>Sentry</td></tr>
    <tr><td>Mobile web (Chrome Android)</td><td>chrome://inspect</td><td>—</td><td>Sentry</td></tr>
    <tr><td>React Native</td><td>RN DevTools / React DevTools</td><td>Xcode + Android Studio</td><td>Sentry / Crashlytics</td></tr>
    <tr><td>Native iOS (Swift / ObjC)</td><td>—</td><td>Xcode</td><td>Crashlytics + Sentry</td></tr>
    <tr><td>Native Android (Kotlin / Java)</td><td>—</td><td>Android Studio</td><td>Crashlytics + Sentry</td></tr>
    <tr><td>Flutter</td><td>DevTools (Flutter)</td><td>Xcode + Android Studio</td><td>Crashlytics + Sentry</td></tr>
  </tbody>
</table>

<h3>Why simulators / emulators differ from real devices</h3>
<ul>
  <li>iOS simulator runs on Mac CPU — often faster than the real device.</li>
  <li>Android emulator: hardware-accelerated, similar story.</li>
  <li>Camera, biometrics (Face ID, Touch ID), GPS, accelerometer, push notifications behave differently or are unsupported.</li>
  <li>Performance numbers misleading; battery / network behavior idealized.</li>
</ul>
<p>Real-device testing on a mid-range Android catches the most bugs.</p>

<h3>Why React Native DevTools (new) replaced "Debug in Chrome"</h3>
<p>"Debug in Chrome" actually ran your JS in Chrome's V8 engine — not the on-device Hermes / JSC. Behavior could differ. React Native DevTools (introduced in RN 0.76) connects directly to Hermes on-device via the Chrome DevTools Protocol — debug the actual JS engine your users get.</p>

<h3>Why Flipper got de-emphasized</h3>
<p>Flipper unified JS, native, network, layout debugging in one tool. Powerful but: heavyweight Electron app, plugin ecosystem hard to maintain across RN versions, Meta cut investment in 2022-2023. Replaced by React Native DevTools for most JS workflows; native debugging back to Xcode / Android Studio.</p>

<h3>Why production debugging needs Sentry</h3>
<p>You can't connect DevTools to a user's device. Crashes manifest as user reviews, app store complaints, support tickets. Without instrumentation: zero data. With Sentry: stack traces (symbolicated via uploaded source maps + dSYM / proguard mapping), user context, breadcrumbs, release tagging.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "where to debug" picture</h3>
<div class="diagram">
<pre>
                       ┌──────────────────────────┐
                       │       Symptom            │
                       └──────────┬───────────────┘
                                  ▼
                  ┌─────────┴─────────┐
                  ▼                    ▼
           Mobile web              Native / RN
                  │                    │
                  ▼                    ▼
       Connect device + use      JS issue?    Native issue?
       desktop browser DevTools       │              │
                                      ▼              ▼
                            RN DevTools / React  Xcode (iOS) /
                            DevTools             Android Studio
</pre>
</div>

<h3>The "iOS Safari workflow"</h3>
<div class="diagram">
<pre>
 1. iPhone: Settings → Safari → Advanced → Web Inspector ON
 2. Connect via USB to Mac
 3. Trust the computer
 4. macOS Safari: Settings → Advanced → Show Develop menu
 5. Develop menu → your iPhone → tab name
 6. Full Safari DevTools attached
</pre>
</div>

<h3>The "Chrome Android workflow"</h3>
<div class="diagram">
<pre>
 1. Android: Settings → Developer Options ON (tap Build Number 7×)
 2. Settings → Developer Options → USB Debugging ON
 3. Connect via USB to computer
 4. Trust the computer
 5. Desktop Chrome: chrome://inspect/#devices
 6. Find your device + tab → Inspect
 7. Full Chrome DevTools attached
</pre>
</div>

<h3>The "RN debugging matrix"</h3>
<table>
  <thead><tr><th>Need</th><th>Tool</th></tr></thead>
  <tbody>
    <tr><td>Inspect React component tree</td><td>React DevTools (browser ext or standalone)</td></tr>
    <tr><td>JS breakpoints, console</td><td>RN DevTools (RN 0.76+) or "Open Debugger"</td></tr>
    <tr><td>Network requests</td><td>RN DevTools Network tab; or Flipper Network plugin</td></tr>
    <tr><td>iOS native crash</td><td>Xcode → Console / Devices and Simulators → Device Logs</td></tr>
    <tr><td>Android native crash</td><td>Android Studio → Logcat (filter FATAL EXCEPTION)</td></tr>
    <tr><td>iOS perf profiling</td><td>Xcode Instruments (Time Profiler, Allocations, Animation Hitches)</td></tr>
    <tr><td>Android perf profiling</td><td>Android Studio Profiler (CPU, Memory, Network, Energy)</td></tr>
    <tr><td>Production crashes</td><td>Sentry / Crashlytics (with uploaded symbols)</td></tr>
    <tr><td>Production perf metrics</td><td>Sentry Perf / custom RUM</td></tr>
  </tbody>
</table>

<h3>The "ADB cheat sheet"</h3>
<pre><code>adb devices                            # list connected devices
adb logcat                             # stream logs
adb logcat | grep ReactNativeJS         # RN-specific JS logs
adb logcat *:E                          # error level only
adb logcat | grep -i "FATAL"            # crashes
adb shell am force-stop com.myapp       # kill an app
adb install app.apk                     # install
adb uninstall com.myapp                 # remove
adb shell am start -n com.myapp/.MainActivity
adb reverse tcp:8081 tcp:8081           # port forward (Metro)
adb pull /sdcard/screenshot.png .       # pull file
adb push file.txt /sdcard/              # push file
adb bugreport                           # full system bug report</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Simulator behavior is the same as device." It's an approximation. Always smoke-test on a real device before claiming "works." Camera, biometrics, push delivery, performance, real network behavior — all vary.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>iOS Safari Web Inspector</h3>
<pre><code>iPhone:
  Settings → Safari → Advanced → Web Inspector → ON

macOS:
  Safari → Settings → Advanced → Show Develop menu → ON
  Develop menu → [Your iPhone] → [Tab Name]
  Full Web Inspector attaches: Elements, Console, Sources, Network, Storage, Audit, Layers, Graphics, Timelines.</code></pre>

<h3>Chrome Android remote debugging</h3>
<pre><code>Android:
  Settings → About → Build Number (tap 7× to enable Developer Options)
  Settings → Developer Options → USB Debugging ON

Desktop Chrome:
  chrome://inspect/#devices
  Click "Inspect" on the target tab
  Full DevTools attaches</code></pre>

<h3>React Native DevTools (RN 0.76+)</h3>
<pre><code>npx react-native start
# In the metro terminal: press 'j' to open the React Native DevTools

# Or via the Dev Menu (shake device or Cmd+D / Cmd+M):
# "Open DevTools"

# Features:
# - Console
# - Sources (breakpoints in your TS/JS)
# - Network
# - React DevTools (Components + Profiler)
# - Memory snapshots</code></pre>

<h3>React DevTools standalone</h3>
<pre><code class="language-bash">npm install -g react-devtools
react-devtools

# Electron window opens on port 8097.
# RN dev mode auto-connects.
# Or: manual connect via Settings → Components.</code></pre>

<h3>Hermes debugger</h3>
<pre><code>RN with Hermes (default):
  Dev Menu → Open DevTools
  Connects to Hermes inspector via Chrome DevTools Protocol
  Real on-device JS engine (not Chrome V8)

Older "Debug with Chrome" deprecated — ran code in Chrome's V8.</code></pre>

<h3>Flipper (legacy)</h3>
<pre><code class="language-bash"># Download from https://fbflipper.com
# Runs on macOS / Windows / Linux

# Plugins (still work for older RN):
# - React DevTools
# - Network
# - Layout Inspector
# - Hermes Debugger
# - Crash Reporter
# - Logs

# RN integration via 'react-native-flipper' (legacy package)</code></pre>

<h3>Reactotron</h3>
<pre><code class="language-bash">npm install -D reactotron-react-native reactotron-redux
# In src/ReactotronConfig.ts:
import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';

Reactotron
  .configure({ name: 'MyApp' })
  .useReactNative()
  .use(reactotronRedux())
  .connect();

// In index.tsx:
if (__DEV__) require('./ReactotronConfig');</code></pre>

<h3>Xcode debugging (iOS native + RN)</h3>
<pre><code># Open the .xcworkspace in Xcode
# Click Run (Cmd+R) — builds + attaches debugger

# View logs: View → Debug Area
# Set breakpoints in Swift / ObjC by clicking line number

# For real device:
# - Connect via USB
# - Window → Devices and Simulators → Show device console
# - View → Debug → View Debugging → Capture View Hierarchy (3D view)

# Console: View → Debug Area → Show Console
# Filter logs by process name</code></pre>

<h3>Xcode Instruments</h3>
<pre><code>Product → Profile (Cmd+I)
Choose a template:
  - Time Profiler — CPU sampling
  - Allocations — memory allocations
  - Leaks — memory leaks (less reliable on iOS than Android)
  - Animation Hitches — dropped frames (iOS 15+)
  - Network — connections
  - Energy Log — battery impact
  - Core Animation — frame rate

Run, interact, stop, analyze. Find: hot functions, memory growth, slow frames.</code></pre>

<h3>Android Studio (Android native + RN)</h3>
<pre><code># Open the android/ folder in Android Studio
# Run → Attach Debugger to Android Process (or Run with debugger)

# Logcat tab:
# - Filter by package (your app)
# - Filter by log level (verbose / debug / info / warning / error / assert)
# - Search for specific tags (ReactNativeJS, AndroidRuntime)

# View → Tool Windows → Profiler:
# - CPU: flame graph
# - Memory: heap dumps, allocations
# - Network: requests
# - Energy: estimated impact

# Layout Inspector: Tools → Layout Inspector
# - 3D view of native view hierarchy
# - Inspect properties of any view</code></pre>

<h3>Logcat patterns (Android)</h3>
<pre><code class="language-bash">adb logcat | grep -i ReactNativeJS    # RN console.log output
adb logcat | grep -i FATAL            # crashes
adb logcat *:E                         # only errors
adb logcat -c                          # clear buffer
adb logcat -t 100                      # last 100 lines

# Filter to your app:
adb shell pidof com.myapp              # get pid
adb logcat --pid=&lt;pid&gt;</code></pre>

<h3>iOS device logs (no Xcode)</h3>
<pre><code class="language-bash">xcrun simctl spawn booted log stream --predicate 'processImagePath contains "YourApp"'

# Or:
npx react-native log-ios

# For real device (need libimobiledevice):
brew install libimobiledevice
idevicesyslog</code></pre>

<h3>RN Perf Monitor</h3>
<pre><code>Dev Menu → Show Perf Monitor
Overlay shows:
  - JS FPS (JS thread)
  - UI FPS (native render thread)
  - Memory
  - Total views

JS &lt; 58 = JS thread overloaded.
UI &lt; 58 = native render bottleneck.</code></pre>

<h3>Sentry on mobile</h3>
<pre><code class="language-ts">// React Native
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://...',
  environment: __DEV__ ? 'development' : 'production',
  release: 'myapp@1.2.3+42',
  tracesSampleRate: 0.1,
});

// Wrap navigation for tracing
import { ReactNavigationInstrumentation } from '@sentry/react-native';
const instrumentation = new ReactNavigationInstrumentation();</code></pre>

<h3>Sentry symbols upload</h3>
<pre><code class="language-bash"># JS source maps (for symbolication of JS stacks)
npx sentry-cli sourcemaps upload --release "myapp@1.2.3+42" build/

# iOS dSYM (for native symbolication)
npx sentry-cli debug-files upload --org=myorg --project=myapp ios/build

# Android proguard mapping
npx sentry-cli upload-proguard --org=myorg --project=myapp \\
  android/app/build/outputs/mapping/release/mapping.txt</code></pre>

<h3>Network debugging on mobile</h3>
<pre><code># Charles / Proxyman:
1. Configure device proxy: Settings → Wi-Fi → details → HTTP Proxy → manual
   IP: your computer's IP, Port: 8888 (Charles) or 9090 (Proxyman)
2. Install Charles cert on device (visit chls.pro/ssl on device)
3. Trust cert: Settings → General → About → Certificate Trust Settings
4. Charles sees + decrypts HTTPS traffic from the device

# Alternative: RN DevTools' built-in Network panel</code></pre>

<h3>Crash dump symbolication</h3>
<pre><code># iOS .ips crash report:
xcrun atos -arch arm64 -o YourApp.app.dSYM/Contents/Resources/DWARF/YourApp \\
  -l 0x100000000 0x10001234

# Android tombstone — automatically symbolicated by Android Studio
adb pull /data/tombstones/tombstone_00 .</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — debug iOS Safari issue</h3>
<pre><code>1. iPhone: Settings → Safari → Advanced → Web Inspector ON
2. Connect to Mac via USB
3. macOS Safari → Develop menu → [iPhone] → tab
4. Inspect → full Web Inspector attached
5. Set breakpoint, modify CSS, see network requests</code></pre>

<h3>Example 2 — Android Chrome remote debug</h3>
<pre><code>1. Android Settings → Developer Options → USB Debugging
2. Plug into computer
3. chrome://inspect/#devices
4. "Inspect" on the target tab
5. DevTools opens with that tab</code></pre>

<h3>Example 3 — RN crash investigation (Android)</h3>
<pre><code>1. App crashes on launch on a tester's device
2. adb logcat | grep -i "FATAL EXCEPTION"
3. See: java.lang.NullPointerException at com.myapp.SomeModule
4. Check Sentry for matching crash event with full stack
5. Reproduce locally; fix; verify</code></pre>

<h3>Example 4 — RN scroll jank</h3>
<pre><code>1. RN Dev Menu → Show Perf Monitor
2. Scroll list — observe JS FPS drop to 25
3. JS thread bottleneck
4. RN DevTools Profiler → record scroll
5. Identify: Row component re-renders 50 times per scroll
6. Fix: React.memo + useCallback + FlashList
7. Re-test: JS FPS stays 60</code></pre>

<h3>Example 5 — production iOS crash via Sentry</h3>
<pre><code>1. Sentry dashboard shows new crash
2. View event → stack trace symbolicated (because dSYM was uploaded)
3. Stack: -[MyView layoutSubviews] crashed at line 42
4. User context: iOS 17.2, iPhone 13, app version 1.2.3
5. Reproduce locally; fix; release; monitor crash rate drops</code></pre>

<h3>Example 6 — Xcode Instruments allocations</h3>
<pre><code>1. Xcode → Product → Profile → Allocations template
2. Run on device
3. Reproduce action
4. Mark generations every 10s with marker button
5. See generation deltas — growing types are leak candidates
6. Right-click → see allocation call tree</code></pre>

<h3>Example 7 — Android Studio Profiler memory</h3>
<pre><code>1. Android Studio → Profiler → Memory
2. Click record (heap dump or allocations)
3. Reproduce action
4. Stop
5. Filter by class to find leaked instances
6. Click instance → references → trace retainers</code></pre>

<h3>Example 8 — RN DevTools Profiler</h3>
<pre><code>1. RN Dev Menu → Open DevTools
2. Components / Profiler tabs available
3. Profiler → record
4. Interact with app
5. Stop → flame graph
6. Identify slow components, "why did this render"
7. Fix re-render issues</code></pre>

<h3>Example 9 — Reactotron logging</h3>
<pre><code class="language-ts">import Reactotron from 'reactotron-react-native';

if (__DEV__) {
  Reactotron.log('Manual log');
  Reactotron.display({
    name: 'CART STATE',
    value: cart,
    important: true,
  });

  // For Redux: actions + state visible automatically
}</code></pre>

<h3>Example 10 — proxy mobile traffic with Charles</h3>
<pre><code>1. Mac running Charles, IP 192.168.1.10, port 8888
2. iPhone Wi-Fi → manually configure proxy: 192.168.1.10:8888
3. iPhone Safari → chls.pro/ssl → install + trust profile
4. Settings → General → About → Certificate Trust Settings → enable Charles
5. Browse on iPhone — Charles intercepts + decrypts HTTPS
6. Right-click request → Edit → modify → replay</code></pre>

<h3>Example 11 — symbolicate a crash log manually</h3>
<pre><code class="language-bash"># iOS — atos
atos -arch arm64 \\
  -o YourApp.app.dSYM/Contents/Resources/DWARF/YourApp \\
  -l 0x100000000 \\
  0x10001234

# Output:
# -[MyView layoutSubviews] (in YourApp) (MyView.m:42)</code></pre>

<h3>Example 12 — RN inline-requires for startup debug</h3>
<pre><code class="language-js">// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () =&gt; ({
      transform: { inlineRequires: true },
    }),
  },
};
// Then measure cold start: 1.2s → 0.7s typical</code></pre>

<h3>Example 13 — adb reverse for Metro</h3>
<pre><code class="language-bash"># Real Android device on Wi-Fi can't reach localhost:8081 of dev machine
# adb reverse tunnels device's localhost to host's localhost
adb reverse tcp:8081 tcp:8081

# Now device's localhost:8081 → your Mac's localhost:8081 (Metro)</code></pre>

<h3>Example 14 — RN release build local test</h3>
<pre><code class="language-bash"># iOS:
npx react-native run-ios --configuration Release

# Android:
cd android &amp;&amp; ./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk

# Test the actual production-like build before shipping
# Catches: Hermes-only bugs, ProGuard issues, missing assets</code></pre>

<h3>Example 15 — sentry breadcrumbs</h3>
<pre><code class="language-ts">// Manual breadcrumbs for context
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
  data: { userId: user.id },
});

// On crash: Sentry shows last 100 breadcrumbs leading to the error
// Massive context for "what was the user doing?"</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Web Inspector won't connect (iOS)</h3>
<p>Cable issue. Try a different USB cable / port. Trust the computer on iPhone (popup). Restart Safari and Phone. iOS update may toggle Web Inspector off.</p>

<h3>2. chrome://inspect doesn't see device</h3>
<p>USB Debugging not enabled. Cable is charge-only (use data cable). Driver missing on Windows. Authorize the computer on the device when prompted.</p>

<h3>3. RN Hermes vs Chrome V8</h3>
<p>"Debug in Chrome" used Chrome's V8 — different from on-device Hermes. Behavior could diverge (regex edge cases, Intl support). Use RN DevTools or Hermes inspector for real on-device JS.</p>

<h3>4. Sentry stack obfuscated</h3>
<p>Source maps / dSYM / proguard mapping not uploaded. Run <code>sentry-cli</code> in CI after each build. Without it, prod crashes are unreadable.</p>

<h3>5. Logcat noisy</h3>
<p>System messages drown out app logs. Filter by package: <code>adb logcat --pid=$(adb shell pidof com.myapp)</code>. Or filter by log level: <code>*:E</code> for errors only.</p>

<h3>6. React DevTools doesn't connect to RN</h3>
<p>Standalone needs port 8097 open. Run <code>react-devtools</code> on host; RN dev mode auto-connects. If not: manually point app to host IP via Reactotron-style config, or use RN DevTools (built-in).</p>

<h3>7. Real-device tests slower than simulator</h3>
<p>Older real devices are slow. Don't pad the timing budget; debug on the slowest device you support. Use mid-range Android (Pixel 5, Galaxy A series) as your perf baseline.</p>

<h3>8. iOS simulator camera missing</h3>
<p>Xcode 15+ has a virtual camera; older Xcode doesn't. Test camera flows on real device.</p>

<h3>9. Push notifications don't deliver to simulator</h3>
<p>iOS simulator supports push since Xcode 11.4 via simulated payload (drag .apns file into simulator). FCM on Android emulator works. Real-device tests still recommended.</p>

<h3>10. Crash without symbol</h3>
<p>App was built with a different version than the dSYM available. Each build has a UUID; mismatched UUID = no symbolication. Use Sentry's auto-upload to keep them in sync.</p>

<h3>11. ANR (Android)</h3>
<p>Application Not Responding — main thread blocked &gt;5s. Look at <code>tombstone</code> file or Sentry. Check for sync I/O, network on main thread, JNI deadlock.</p>

<h3>12. iOS Watchdog timeout</h3>
<p>App startup &gt;20s on launch → iOS kills with watchdog. Check launch trace, defer work after first frame.</p>

<h3>13. ProGuard / R8 obfuscation breaks reflection</h3>
<p>Native module uses <code>Class.forName</code> dynamically — ProGuard removes the class. Add <code>-keep</code> rules in proguard-rules.pro for those classes.</p>

<h3>14. Memory leak only on real device</h3>
<p>Simulators have abundant memory. Real device with 3GB RAM hits OOM. Monitor with Xcode Instruments / Android Studio profiler on actual hardware.</p>

<h3>15. Network on Android emulator</h3>
<p>Emulator's <code>10.0.2.2</code> maps to host's localhost. <code>localhost</code> on emulator = emulator itself. Use <code>10.0.2.2:8081</code> for Metro from emulator.</p>

<h3>16. Different Hermes versions</h3>
<p>RN versions ship different Hermes versions. Bytecode incompatible across versions. Ensure local + CI + ship use the same version.</p>

<h3>17. Flipper plugin lag</h3>
<p>Flipper plugins lag RN releases. New RN version → some plugins broken until updated. Check before relying.</p>

<h3>18. Charles HTTPS without cert install</h3>
<p>Won't decrypt HTTPS traffic without the root cert installed + trusted on device. Pinning frameworks (TrustKit) further prevent it.</p>

<h3>19. WebView on mobile</h3>
<p>App embeds WebView. Debug via Safari Develop menu (iOS) or chrome://inspect (Android WebView). Different from native debugging.</p>

<h3>20. Multi-process apps</h3>
<p>Some apps run multiple processes (web workers in browser; service worker; iOS extensions). Each has its own debugger entry. Choose the right one.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — debugging only on simulator</h3>
<p>Camera, biometrics, push, real perf, real network all differ. Always smoke-test critical paths on a real device before claiming "ready."</p>

<h3>Anti-pattern 2 — using "Debug in Chrome" for RN</h3>
<p>Runs in Chrome V8, not Hermes. Behavior can differ. Use RN DevTools or Hermes inspector for accurate behavior.</p>

<h3>Anti-pattern 3 — no Sentry symbols</h3>
<p>Production crashes are unreadable. Upload source maps, dSYM, proguard mapping in CI.</p>

<h3>Anti-pattern 4 — printf-style debugging only</h3>
<p>console.log everywhere. Use breakpoints, profiler, structured logging.</p>

<h3>Anti-pattern 5 — testing on a flagship phone</h3>
<p>iPhone 15 Pro hides perf issues. Mid-range Android (Pixel 5, Galaxy A52) is the realistic perf baseline.</p>

<h3>Anti-pattern 6 — release build never tested locally</h3>
<p>Dev works; release crashes on launch. Always smoke-test a release-config build before shipping.</p>

<h3>Anti-pattern 7 — ignoring ANR / Watchdog</h3>
<p>"Sometimes the app freezes" reports. Profile main thread; eliminate sync I/O.</p>

<h3>Anti-pattern 8 — Flipper as primary RN tool in 2024+</h3>
<p>Flipper de-emphasized. Migrate to RN DevTools for JS, native tools for native.</p>

<h3>Anti-pattern 9 — ignoring Logcat noise</h3>
<p>"Just a lot of logs." Filter by your package; you'll see real errors.</p>

<h3>Anti-pattern 10 — pre-OS-update untested</h3>
<p>iOS 17 ships; your app works on 16. Test betas + first GA on day-of-release.</p>

<h3>Anti-pattern 11 — sharing crash dumps in screenshots</h3>
<p>Tiny text, can't search. Share Sentry link, or full <code>adb bugreport</code> / <code>idevicesyslog</code> file.</p>

<h3>Anti-pattern 12 — leaving __DEV__ checks shipped</h3>
<p>Dev-only code paths in production. Can leak debug info; performance impact. Ensure stripped.</p>

<h3>Anti-pattern 13 — manual symbolication every time</h3>
<p>Tedious + error-prone. Automate with Sentry CLI.</p>

<h3>Anti-pattern 14 — debugging without breadcrumbs</h3>
<p>Crash with no context. Add Sentry breadcrumbs at navigation, key actions, API calls.</p>

<h3>Anti-pattern 15 — letting test devices drift</h3>
<p>Old simulator, old OS, old Xcode. Every test on stale runtime gives stale results. Keep at least one device on latest stable, one on min-supported.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you debug iOS Safari?</div>
  <div class="qa-answer">
    <ol>
      <li>iPhone: Settings → Safari → Advanced → Web Inspector ON.</li>
      <li>Connect via USB to Mac.</li>
      <li>macOS Safari: Settings → Advanced → Show Develop menu.</li>
      <li>Develop → [Your iPhone] → tab name.</li>
      <li>Full Web Inspector attached: Elements, Console, Sources, Network, Storage, etc.</li>
    </ol>
    <p>Same workflow for iPad. Real device only — simulator not needed for Safari.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Chrome on Android remote debugging?</div>
  <div class="qa-answer">
    <ol>
      <li>Android: Settings → Developer Options → USB Debugging.</li>
      <li>Connect via USB to computer; trust the computer.</li>
      <li>Desktop Chrome: <code>chrome://inspect/#devices</code>.</li>
      <li>Click "Inspect" on the target tab.</li>
      <li>Full DevTools attaches.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why was Flipper de-emphasized?</div>
  <div class="qa-answer">
    <p>Maintenance burden. Plugin ecosystem lagged across RN versions. Heavyweight Electron app. Meta cut investment in 2022-2023. Replaced for most JS workflows by React Native DevTools (RN 0.76+) — Chrome-based, integrates with Hermes natively. Native debugging back to Xcode / Android Studio.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What does React Native DevTools give you?</div>
  <div class="qa-answer">
    <p>Built-in (RN 0.76+) Chrome DevTools-based debugger that connects to on-device Hermes. Features:</p>
    <ul>
      <li>Console, Sources (with breakpoints in TS/JS).</li>
      <li>Network (requests, headers, response).</li>
      <li>React DevTools (Components + Profiler integrated).</li>
      <li>Memory snapshots.</li>
      <li>Performance recording.</li>
    </ul>
    <p>Open via Metro (press <code>j</code>) or Dev Menu → Open DevTools.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you debug a native iOS crash?</div>
  <div class="qa-answer">
    <ol>
      <li>Sentry / Crashlytics receives it (with dSYM uploaded → symbolicated stack).</li>
      <li>Or: Xcode → Window → Devices and Simulators → device → View Device Logs.</li>
      <li>Find the .ips crash report; symbolicate manually with <code>atos</code> if needed.</li>
      <li>Stack shows the failing function + line.</li>
      <li>Reproduce; fix; release; monitor.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you debug an Android crash?</div>
  <div class="qa-answer">
    <ol>
      <li>Sentry / Crashlytics with proguard mapping uploaded.</li>
      <li>Or: <code>adb logcat | grep "FATAL EXCEPTION"</code>.</li>
      <li>Or: Android Studio → Logcat tab; filter by package + level.</li>
      <li>Stack trace shows exception type + class + line.</li>
      <li>Often: NPE due to bad ProGuard rule; or NDK crash with native stack.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Profile RN scroll perf — how?</div>
  <div class="qa-answer">
    <ol>
      <li>Dev Menu → Show Perf Monitor; observe JS FPS + UI FPS during scroll.</li>
      <li>If JS FPS drops: heavy work on JS thread. Open RN DevTools Profiler; record scroll; identify re-rendering components.</li>
      <li>If UI FPS drops: native rendering bottleneck. Open Xcode Instruments (Animation Hitches) or Android Studio Profiler (CPU).</li>
      <li>Fix per finding: memo + FlashList for JS; reduce native view count for UI.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why does the simulator differ from a real device?</div>
  <div class="qa-answer">
    <ul>
      <li>Different CPU (Mac vs ARM mobile chip).</li>
      <li>Camera, biometrics often unsupported.</li>
      <li>Push notifications behave differently.</li>
      <li>Battery / thermals not modeled.</li>
      <li>Real network (cellular variability) not simulated.</li>
    </ul>
    <p>Critical paths must be tested on real devices.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you intercept HTTPS traffic from a mobile app?</div>
  <div class="qa-answer">
    <p>Charles or Proxyman:</p>
    <ol>
      <li>Set device to use computer's IP as HTTP proxy.</li>
      <li>Install Charles' root cert on device + trust it (Settings → General → About → Certificate Trust Settings on iOS).</li>
      <li>Charles decrypts traffic; modify and replay if needed.</li>
    </ol>
    <p>Caveat: certificate pinning frameworks (TrustKit) may still block. For your own app: disable pinning in dev builds.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's adb logcat?</div>
  <div class="qa-answer">
    <p>Android Debug Bridge's log streamer. Streams system + app logs from a connected Android device. Common patterns:</p>
<pre><code>adb logcat | grep ReactNativeJS    # RN console.log output
adb logcat *:E                      # only errors
adb logcat --pid=$(adb shell pidof com.myapp)   # only your app
adb logcat -c                       # clear buffer</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Reactotron — what's it for?</div>
  <div class="qa-answer">
    <p>Lightweight RN dev observability tool. Streaming logs, custom events, Redux / state inspection, async storage viewer, API logs. Easier setup than Flipper. Useful for small teams who want extra visibility beyond RN DevTools. Not for production.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you upload symbols to Sentry?</div>
  <div class="qa-answer">
<pre><code class="language-bash"># JS source maps
npx sentry-cli sourcemaps upload --release "myapp@1.2.3+42" build/

# iOS dSYM
npx sentry-cli debug-files upload --org=myorg --project=myapp ios/build

# Android proguard mapping
npx sentry-cli upload-proguard --org=myorg --project=myapp \\
  android/app/build/outputs/mapping/release/mapping.txt</code></pre>
    <p>Automate in CI after each build. Without symbols, prod crashes are unreadable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's a watchdog timeout (iOS)?</div>
  <div class="qa-answer">
    <p>iOS terminates apps that don't respond within fixed timeouts: ~20s for launch, ~10s for backgrounding. The system sends SIGKILL and writes a 0x8badf00d crash log. Causes: blocking main thread on launch (sync I/O, big bundle parse, heavy native init). Fix: defer non-critical work, use background queues, optimize Hermes startup.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. RN bug only in release build — debugging?</div>
  <div class="qa-answer">
    <ol>
      <li>Build release locally: <code>npx react-native run-ios --configuration Release</code> or <code>./gradlew assembleRelease</code>.</li>
      <li>Attach Xcode / Android Studio debugger to release process.</li>
      <li>Common causes: ProGuard removed a class (add <code>-keep</code> rule); dev-only dep referenced in prod; missing Info.plist key; Hermes-incompatible code.</li>
      <li>Check Sentry for symbolicated stack.</li>
      <li>Verify production behavior on a real device.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Describe an end-to-end mobile observability setup.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Sentry</strong> for JS + native crashes. Source maps + dSYM + proguard mapping uploaded in CI.</li>
      <li><strong>Sentry breadcrumbs</strong> at navigation + key actions for context.</li>
      <li><strong>Sentry Performance</strong> or custom RUM for cold-start, screen-load, gesture responsiveness.</li>
      <li><strong>Analytics</strong> (Amplitude / PostHog) for screen views + conversion funnels.</li>
      <li><strong>Feature flags</strong> (LaunchDarkly / ConfigCat) for kill switches.</li>
      <li><strong>Logs</strong> via Sentry breadcrumbs; Reactotron for dev-only.</li>
      <li><strong>Optional</strong>: session replay (Sentry Replay) for hard-to-reproduce bugs.</li>
      <li><strong>Dashboards</strong>: crash rate per version, p75 cold-start, top crashing screens.</li>
    </ul>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You connect real devices for debugging (Safari for iOS, chrome://inspect for Android).</li>
    <li>You use RN DevTools (RN 0.76+) over deprecated Chrome debugger.</li>
    <li>You profile native perf with Xcode Instruments + Android Studio Profiler.</li>
    <li>You install Sentry and upload all symbols (source maps + dSYM + proguard).</li>
    <li>You add breadcrumbs for context.</li>
    <li>You test critical paths on a mid-range Android, not just simulator.</li>
    <li>You profile in release builds, not just dev.</li>
    <li>You use Logcat / Console with proper filters.</li>
    <li>You symbolicate crashes (don't squint at minified stacks).</li>
  </ul>
</div>
`}

]
});
