window.PREP_SITE.registerTopic({
  id: 'rn-architecture',
  module: 'React Native',
  title: 'Architecture (Bridge / Fabric / JSI)',
  estimatedReadTime: '32 min',
  tags: ['react-native', 'architecture', 'bridge', 'fabric', 'jsi', 'hermes', 'turbomodules', 'new-architecture'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>React Native is a framework for writing mobile apps in JavaScript/TypeScript where your code drives <em>real native UI</em> (UIView on iOS, android.view.View on Android). Understanding its architecture — how JS talks to native — is the foundation of every performance, debugging, and interop discussion.</p>
<ul>
  <li><strong>Two runtimes</strong> communicate per app: a JavaScript engine (Hermes by default in 0.70+, also JSC) and the native platform runtime.</li>
  <li><strong>Old Architecture (Bridge, pre-0.68)</strong>: JS and native communicate over an <em>asynchronous</em>, serialized (JSON) message queue. Every call crosses a JSON boundary — batched per frame.</li>
  <li><strong>New Architecture (JSI + Fabric + TurboModules)</strong>: <em>synchronous</em> direct C++ binding between JS and native. No JSON serialization. Enables direct memory sharing (e.g., Reanimated worklets), synchronous native calls, and a concurrent renderer (Fabric).</li>
  <li><strong>Hermes</strong>: Facebook's JS engine optimized for mobile — smaller binaries, faster startup, bytecode pre-compilation, better memory profile than JSC.</li>
  <li><strong>Three threads</strong> typically: JS thread (React + your code), Native UI thread (view hierarchy), Shadow thread (layout via Yoga).</li>
  <li><strong>Metro</strong> is the RN bundler — like Webpack for mobile.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Old architecture: JS sends JSON across an async bridge to native, which rebuilds the view tree. New architecture: JS and native share C++ objects directly via JSI, so calls are synchronous and the renderer (Fabric) can coordinate with React's concurrent mode. Performance-sensitive code (animations, gestures) moves off the JS thread entirely via Reanimated worklets.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What React Native actually is</h3>
<p>React Native runs your React component tree in a JavaScript engine on the device. When React says "render a View," RN translates that to a native view — <code>UIView</code> on iOS, <code>android.view.View</code> on Android. You're not writing a web view; you're writing a native app whose UI is described in React.</p>
<p>Three processes are happening simultaneously:</p>
<ul>
  <li><strong>JS thread</strong>: runs your React code, hooks, state, effects, event handlers.</li>
  <li><strong>Native UI thread</strong> (main thread on the OS): owns the view hierarchy and user input; renders at 60/120 fps.</li>
  <li><strong>Shadow thread</strong>: computes layout using Yoga (Facebook's cross-platform Flexbox engine).</li>
</ul>
<p>The challenge: these threads must coordinate. How JS "tells" native to update the view is the architecture question.</p>

<h3>Old Architecture (Bridge) — pre-0.68</h3>
<p>JS and native communicate through a <strong>bridge</strong>: an asynchronous message queue where every call is serialized as JSON, sent over the bridge, and deserialized on the other side.</p>
<div class="diagram">
<pre>
JS Thread                         Native Thread
┌──────────────┐                 ┌──────────────┐
│ React runs   │                 │              │
│ produces ops │ ──── JSON ────► │ Parse ops    │
│              │     (async)     │ Create views │
│              │ ◄──── JSON ──── │ Send events  │
└──────────────┘                 └──────────────┘
</pre>
</div>
<p>Problems:</p>
<ul>
  <li><strong>JSON serialization is slow</strong> — an animation running on the JS thread at 60Hz is frequently dropped.</li>
  <li><strong>Async only</strong> — there's no way for JS to synchronously ask native for a value (e.g., "what's the current scroll position?").</li>
  <li><strong>Single queue</strong> — a slow call blocks the next.</li>
  <li><strong>Scheduling problems</strong> — when JS thread is busy, the bridge buffers, and UI feels laggy.</li>
</ul>

<h3>New Architecture (JSI + Fabric + TurboModules) — 0.68+</h3>
<p>The new architecture replaces the bridge with <strong>JSI</strong> (JavaScript Interface), a C++ API that lets JS and native code share memory and call each other synchronously — without JSON.</p>
<ul>
  <li><strong>JSI</strong> — the base layer. JS can hold references to native C++ objects (HostObjects) and call methods on them directly, synchronously, without JSON. Native can hold references to JS objects too.</li>
  <li><strong>TurboModules</strong> — native modules exposed via JSI. Replaces the old NativeModules API. Lazily loaded (modules aren't instantiated until first used). Can be synchronous.</li>
  <li><strong>Fabric</strong> — the new renderer. Replaces the old ShadowNode + UIManager. Written in C++, shared across platforms, concurrent-mode aware. Provides synchronous layout reads and immediate view updates.</li>
  <li><strong>Codegen</strong> — generates type-safe bindings between JS (TypeScript) and native (ObjC/Kotlin) from a spec file. Eliminates hand-written bindings.</li>
</ul>

<h3>Why New Architecture matters</h3>
<ol>
  <li><strong>Performance</strong>: eliminates JSON overhead on hot paths (animations, gestures, sync layout queries).</li>
  <li><strong>Synchronous native calls</strong>: <code>getLayoutSync()</code>, <code>measureInWindow()</code> don't require a callback ceremony.</li>
  <li><strong>Concurrent React</strong>: Fabric lets React 18's startTransition / Suspense work in RN. The old architecture couldn't coordinate with React's scheduler.</li>
  <li><strong>Memory sharing</strong>: Reanimated worklets can access and modify native state directly — animations run on the UI thread at 60/120fps regardless of what JS is doing.</li>
  <li><strong>Type safety</strong>: codegen catches native module signature mismatches at build time.</li>
</ol>

<h3>Why Hermes</h3>
<p>Hermes is Facebook's JS engine designed for mobile. Key advantages over JSC (JavaScriptCore, Apple's engine used by RN historically):</p>
<ul>
  <li><strong>Bytecode pre-compilation</strong>: Hermes compiles JS to bytecode at build time. Device loads bytecode directly — faster startup (often 30-50% improvement).</li>
  <li><strong>Smaller binary</strong>: JS app size in the APK/IPA is smaller.</li>
  <li><strong>Memory efficient</strong>: generational GC tuned for mobile, lower peak memory.</li>
  <li><strong>Great debugging</strong>: Hermes dev tooling integrates with Chrome DevTools.</li>
</ul>
<p>Since RN 0.70, Hermes is default. In 0.73+, Fabric+TurboModules+Hermes is the recommended combination ("New Architecture").</p>

<h3>Why three threads</h3>
<p>Splitting work:</p>
<ul>
  <li>JS thread runs heavy computation without blocking UI.</li>
  <li>UI thread handles native animations, touches, scrolling — cannot block.</li>
  <li>Shadow thread computes Flexbox layout without interrupting either.</li>
</ul>
<p>If you block the JS thread (bad loop, sync work), the UI doesn't freeze — animations continue if they're on UI thread (via Reanimated) — but your React state doesn't update. Understanding this split is essential for debugging jank.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "Old Architecture" picture</h3>
<div class="diagram">
<pre>
 JS Thread                           Bridge                  Native (UI) Thread
 ┌──────────────┐                ┌──────────┐               ┌──────────────┐
 │ React tree   │                │          │               │ UIView /     │
 │ Shadow tree  │ ─ JSON ops ──► │ Queue    │ ─ deserialize ► │ ViewGroup    │
 │ (in-memory)  │                │ (async)  │               │ actual views │
 │              │ ◄── events ─── │          │ ◄─ serialize  │ user taps    │
 └──────────────┘                └──────────┘               └──────────────┘

 Every message = JSON. High-frequency updates = JSON spam = jank.
</pre>
</div>

<h3>The "New Architecture" picture</h3>
<div class="diagram">
<pre>
 JS Thread                                         Native (UI) Thread
 ┌──────────────────┐                             ┌──────────────────┐
 │ JS VM (Hermes)   │                             │ Fabric Renderer  │
 │                  │ ──── JSI (C++) direct ────► │ (shared C++)     │
 │ holds refs to    │                             │ owns views       │
 │ HostObjects      │                             │                  │
 │                  │ ◄── method calls (sync) ─── │                  │
 └──────────────────┘                             └──────────────────┘
       │
       │ TurboModules: native modules via JSI, lazy-loaded, typed via codegen
       │ Reanimated: worklets execute on UI thread using JSI shared state
       │ Concurrent React: Fabric aware of lanes / priorities
</pre>
</div>

<h3>The "where does code run" picture</h3>
<div class="diagram">
<pre>
 JS THREAD                                UI THREAD
 ───────────────────                      ─────────────────────
 Your React components                    Native animations
 Event handlers (onPress)                 Scroll
 State updates                            Touch input
 useEffect                                Reanimated worklets (!)
 Network requests                         Native gesture handlers
 Business logic                           Video playback
 Most libraries                           GPU rasterization

 If JS thread is blocked: animations keep running (if on UI);
   touches still register; but setState callbacks delay.
 If UI thread is blocked: everything visibly freezes.
</pre>
</div>

<h3>The "metro bundler" picture</h3>
<div class="diagram">
<pre>
 .tsx / .ts / .js files
         │
         ▼
 Metro transforms (Babel, TypeScript)
         │
         ▼
 Module graph built
         │
         ▼
 Bundle emitted:
   - Dev: served over HTTP, hot-reloaded
   - Prod: single bundle, optionally Hermes-compiled to .hbc bytecode
         │
         ▼
 Packaged into APK (Android) or IPA (iOS)
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"React Native runs inside a WebView." Absolutely not. There's no web engine. Your components render as <em>real native views</em>. A <code>&lt;View&gt;</code> becomes a UIView; a <code>&lt;Text&gt;</code> becomes a UILabel/TextView. The JS runs in a separate engine (Hermes or JSC) that talks to the native UI via JSI or the old Bridge. No HTML, no CSS parser, no DOM.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Lifecycle of an app startup</h3>
<ol>
  <li>User taps icon → OS launches native app process.</li>
  <li>AppDelegate (iOS) or MainActivity (Android) initializes RN runtime.</li>
  <li>JS VM (Hermes) loaded; JS bundle (or bytecode) parsed.</li>
  <li>Root component registered via <code>AppRegistry.registerComponent</code>.</li>
  <li>React renders the tree; Fabric (or old UIManager) creates native views.</li>
  <li>First frame shown. Metro hot-reload listener starts (dev only).</li>
</ol>
<p>Startup is often the biggest perf concern. Hermes bytecode + lazy TurboModules reduce it significantly vs JSC + eager bridge.</p>

<h3>JSI — the foundation</h3>
<p>JSI is a C++ abstraction for holding references to JS values from C++ and vice versa. Implementations:</p>
<ul>
  <li><code>jsi::Runtime</code> — the JS VM (Hermes or JSC).</li>
  <li><code>jsi::Value</code> — a JS value seen from C++.</li>
  <li><code>jsi::Object</code> — a JS object.</li>
  <li><code>jsi::HostObject</code> — a C++ object that looks like a JS object. When JS accesses a property, C++ receives the call synchronously.</li>
  <li><code>jsi::Function</code> — callable from C++.</li>
</ul>
<p>This means native code can install methods directly on the JS global, synchronously callable. Libraries like MMKV (storage), Reanimated, and react-native-skia use JSI heavily.</p>

<h3>TurboModules — the new native module system</h3>
<p>Old NativeModules were eagerly loaded, bridge-bound, untyped. TurboModules:</p>
<ul>
  <li><strong>Lazily loaded</strong> — a module's native class isn't instantiated until first accessed from JS.</li>
  <li><strong>JSI-based</strong> — sync calls, no JSON.</li>
  <li><strong>Typed via codegen</strong> — spec is a TS file that generates ObjC and Kotlin headers + JS wrapper.</li>
</ul>
<pre><code class="language-ts">// NativeMyModule.ts — the spec
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
export interface Spec extends TurboModule {
  add(a: number, b: number): number; // SYNC — impossible in old arch
  getDeviceName(): Promise&lt;string&gt;;
}
export default TurboModuleRegistry.getEnforcing&lt;Spec&gt;('MyModule');</code></pre>
<p>Codegen reads this spec and generates <code>RCTMyModuleSpec.h</code> (ObjC) and <code>MyModuleSpec.java</code> (Kotlin) that the native implementation extends.</p>

<h3>Fabric — the new renderer</h3>
<p>Replaces the legacy UIManager + ShadowNode system. Key properties:</p>
<ul>
  <li><strong>C++ shared core</strong> — same ShadowTree on iOS and Android. Consistent behavior.</li>
  <li><strong>Synchronous reads</strong> — layout measurements available immediately, no callback.</li>
  <li><strong>Immutable shadow trees</strong> — similar to React Fiber's work-in-progress pattern: old tree stays stable while new tree is built; swap atomically.</li>
  <li><strong>Concurrent-mode-aware</strong> — Fabric respects React's lanes, allowing <code>startTransition</code> to defer rendering.</li>
  <li><strong>Direct view manipulation</strong> — certain properties (transform, opacity) can bypass the shadow tree for high-frequency animations.</li>
</ul>

<h3>Codegen — type safety across the boundary</h3>
<p>Specs written in TypeScript, transformed into:</p>
<ul>
  <li>JS wrapper that calls into TurboModule registry.</li>
  <li>ObjC protocol that the native iOS implementation implements.</li>
  <li>Kotlin abstract class that the native Android implementation extends.</li>
</ul>
<p>Build-time errors if native implementation doesn't match the TypeScript spec. No more "method not found" at runtime.</p>

<h3>Reanimated 3 + the UI thread</h3>
<p>Reanimated's killer feature is <strong>worklets</strong> — functions that run on the UI thread. Powered by JSI: the worklet is serialized into a second JS VM running on the UI thread, with shared state (SharedValue) accessible from both.</p>
<pre><code class="language-js">const offset = useSharedValue(0);
const animStyle = useAnimatedStyle(() =&gt; ({
  transform: [{ translateX: offset.value }]  // runs on UI thread
}));
// Gesture or animation updates offset.value on UI thread → style changes without JS round-trip</code></pre>
<p>Result: 60+fps animations even when the JS thread is busy doing heavy work.</p>

<h3>Hermes specifics</h3>
<ul>
  <li>Bytecode files are <code>.hbc</code> and shipped in the app bundle.</li>
  <li>Dev mode uses JS directly (for hot-reload); release mode uses pre-compiled bytecode.</li>
  <li>Supports most modern JS — ES2021+, async/await, optional chaining.</li>
  <li>Some edge cases differ from V8 (e.g., <code>eval</code> support was limited; <code>Intl</code> is optional).</li>
  <li>Debugging: Chrome DevTools via <code>hermes-engine</code> debugger.</li>
</ul>

<h3>Enabling New Architecture</h3>
<pre><code>// iOS Podfile
use_react_native!(
  :path =&gt; config[:reactNativePath],
  :hermes_enabled =&gt; true,
  :fabric_enabled =&gt; true,
  :new_arch_enabled =&gt; true,
)
// Android gradle.properties
newArchEnabled=true
hermesEnabled=true</code></pre>
<p>Requires RN 0.71+ for stable, 0.73+ for recommended. Third-party libraries must support the new arch (check their docs/flags).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — simple component</h3>
<pre><code class="language-tsx">import { View, Text, Pressable } from 'react-native';
function App() {
  const [n, setN] = useState(0);
  return (
    &lt;View&gt;
      &lt;Text&gt;{n}&lt;/Text&gt;
      &lt;Pressable onPress={() =&gt; setN(n + 1)}&gt;
        &lt;Text&gt;Increment&lt;/Text&gt;
      &lt;/Pressable&gt;
    &lt;/View&gt;
  );
}
AppRegistry.registerComponent('MyApp', () =&gt; App);</code></pre>
<p>The <code>&lt;View&gt;</code> and <code>&lt;Text&gt;</code> become real <code>UIView</code> / <code>UILabel</code> on iOS. No HTML / DOM.</p>

<h3>Example 2 — inspecting thread</h3>
<pre><code class="language-js">console.log('Hello from JS thread'); // runs on JS VM
// On UI thread (via Reanimated worklet):
import { runOnUI } from 'react-native-reanimated';
runOnUI(() =&gt; { console.log('Hello from UI thread'); })();</code></pre>

<h3>Example 3 — Reanimated shared value on UI thread</h3>
<pre><code class="language-tsx">import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function Box() {
  const x = useSharedValue(0);
  const animStyle = useAnimatedStyle(() =&gt; ({
    transform: [{ translateX: x.value }],
  }));
  return (
    &lt;&gt;
      &lt;Animated.View style={[styles.box, animStyle]} /&gt;
      &lt;Button onPress={() =&gt; x.value = withSpring(x.value + 100)} title="Move" /&gt;
    &lt;/&gt;
  );
}
// Even if JS is blocked by a heavy task, animation is smooth on UI thread.</code></pre>

<h3>Example 4 — TurboModule spec</h3>
<pre><code class="language-ts">// specs/NativeDeviceInfo.ts
import { TurboModuleRegistry, TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  getModel(): string;
  getBatteryLevel(): number;
  vibrate(ms: number): void;
}
export default TurboModuleRegistry.getEnforcing&lt;Spec&gt;('DeviceInfo');</code></pre>
<p>Codegen generates iOS + Android headers that your native impl extends.</p>

<h3>Example 5 — JSI-powered storage (MMKV)</h3>
<pre><code class="language-ts">import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();
storage.set('theme', 'dark');                   // SYNC — no bridge call
const theme = storage.getString('theme');       // SYNC, ~30× faster than AsyncStorage
// AsyncStorage on bridge: ~1-5ms per op. MMKV via JSI: ~0.01-0.05ms.</code></pre>

<h3>Example 6 — old architecture NativeModule (for reference)</h3>
<pre><code class="language-objc">// iOS ObjC (old)
@interface RCTMyModule : NSObject &lt;RCTBridgeModule&gt;
@end
@implementation RCTMyModule
RCT_EXPORT_MODULE();
RCT_EXPORT_METHOD(doWork:(NSString *)str resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  resolve(@"ok");
}
@end</code></pre>
<p>Everything returned / received is JSON. Cannot be synchronous.</p>

<h3>Example 7 — TurboModule (new architecture)</h3>
<pre><code class="language-objc">// iOS ObjC-C++ (new)
#import "RCTMyModuleSpec.h"  // generated by codegen

@interface RCTMyModule : NSObject &lt;NativeMyModuleSpec&gt;
@end
@implementation RCTMyModule
RCT_EXPORT_MODULE();
- (NSString *)doWork:(NSString *)str {
  return @"ok"; // synchronous return
}
@end</code></pre>

<h3>Example 8 — thread-aware API</h3>
<pre><code class="language-tsx">import { InteractionManager } from 'react-native';

// Defer expensive work until after animations/transitions complete
InteractionManager.runAfterInteractions(() =&gt; {
  expensiveAnalyticsComputation();
});
// Maintains frame rate during navigation.</code></pre>

<h3>Example 9 — checking if new arch is enabled</h3>
<pre><code class="language-js">import { NewAppScreen } from 'react-native/Libraries/NewAppScreen';
// As of RN 0.72+:
global.RN$Bridgeless  // true if new arch is enabled (bridgeless mode)</code></pre>

<h3>Example 10 — Metro config snippet</h3>
<pre><code class="language-js">// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () =&gt; ({
      transform: { experimentalImportSupport: false, inlineRequires: true },
    }),
  },
  resolver: { assetExts: [...], sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json'] },
};</code></pre>
<p><code>inlineRequires</code> defers module evaluation until first use, improving startup.</p>

<h3>Example 11 — debugging Hermes</h3>
<pre><code>1. App Settings → Dev Menu → Open DevTools (Chrome)
2. chrome://inspect → pick Hermes entry
3. Full DevTools UI: breakpoints, heap snapshots, profiler</code></pre>

<h3>Example 12 — checking if a module is available (robust against missing native code)</h3>
<pre><code class="language-ts">import { NativeModules, Platform } from 'react-native';
const MyMod = NativeModules.MyModule;
if (MyMod?.doThing) MyMod.doThing();
else console.warn('Native module not linked');</code></pre>

<h3>Example 13 — shadow tree + Yoga layout</h3>
<pre><code class="language-tsx">&lt;View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}&gt;
  &lt;Text&gt;Left&lt;/Text&gt;
  &lt;Text&gt;Right&lt;/Text&gt;
&lt;/View&gt;
// Yoga (C++) computes layout on the shadow thread.
// Values handed to native UIView for drawing.</code></pre>

<h3>Example 14 — what blocks the JS thread vs UI thread</h3>
<pre><code class="language-js">// Blocks JS thread:
for (let i = 0; i &lt; 1e8; i++) {} // 5s of React freeze
// setState after this still works — but not until loop finishes.

// Blocks UI thread:
// Only heavy native code (synchronous image decode in main queue).
// Or a sync call from JS that native runs on the main thread.</code></pre>

<h3>Example 15 — Reanimated gesture + UI-thread state</h3>
<pre><code class="language-tsx">import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const pan = Gesture.Pan()
  .onChange((e) =&gt; { x.value = e.translationX; })
  .onEnd(() =&gt; { x.value = withSpring(0); });

// Gesture updates run entirely on the UI thread — fluid even when JS is busy.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Library not yet new-arch-compatible</h3>
<p>Not every library ships TurboModule specs yet. Check the lib's README for "new architecture support." You can mix: some modules on the bridge, others as TurboModules. But enabling new arch fails the build if a depended module doesn't support it.</p>

<h3>2. Debugger disables JIT and slows Hermes</h3>
<p>When you "Debug in Chrome," JS actually runs in Chrome's V8 — not on the device's Hermes. Behavior can differ. Prefer Flipper or Hermes direct debug for accurate behavior.</p>

<h3>3. Text layout idiosyncrasies</h3>
<p>Yoga layout + platform text measurement differ slightly. Fonts with different ascender metrics cause cross-platform vertical alignment tweaks. Use <code>includeFontPadding: false</code> on Android to normalize.</p>

<h3>4. <code>console.log</code> perf cost</h3>
<p>Excessive logging hits the bridge (old arch) or still serializes strings (new arch) and flushes to Metro. In hot paths, can cost milliseconds. Strip in release builds.</p>

<h3>5. Hermes doesn't support all proposals</h3>
<p>Older Hermes versions lacked some ES features (e.g., <code>Symbol.iterator</code> on older iterators). Recent Hermes supports most modern JS. Check the <code>hermes-parser</code> compatibility table.</p>

<h3>6. <code>Intl</code> is opt-in on Hermes</h3>
<p>Historically, Hermes didn't include Intl to save bundle size. Now opt-in via a build flag. For international number/date formatting, either enable it or polyfill.</p>

<h3>7. Fabric's commit model</h3>
<p>Fabric's commit is atomic per react transaction. If you read layout right after a commit but before it's applied, you may get old values. Use <code>onLayout</code> callback or measure after <code>requestAnimationFrame</code>.</p>

<h3>8. Bridgeless mode</h3>
<p>New architecture in full form eliminates the bridge entirely — "bridgeless." Some legacy APIs that assumed bridge presence won't work (e.g., certain <code>NativeEventEmitter</code> patterns). Check lib compatibility.</p>

<h3>9. Metro cache issues</h3>
<p>If a build picks up stale code after a change: <code>npx react-native start --reset-cache</code> and <code>watchman watch-del-all</code>. Metro aggressively caches module transforms.</p>

<h3>10. Linking on iOS / Android changed</h3>
<p>RN 0.60+ uses autolinking (pod install on iOS, gradle on Android automatically pick up libs). But native code changes still need a rebuild, not just Metro restart. A common "why is my native code not working" bug is hot-reload only rebuilding JS.</p>

<h3>11. New architecture requires codegen</h3>
<p>Turbomodules and Fabric components need a <code>codegenConfig</code> in <code>package.json</code>. Run codegen as part of the build pipeline. Forgetting leads to "class not found" errors.</p>

<h3>12. Memory between JS and UI threads</h3>
<p>Values passed between threads via Reanimated must be serializable or JSI-backed. You can't share an arbitrary JS object — only primitive values and JSI shared memory (SharedValue, frozen worklet-safe structures).</p>

<h3>13. Event dispatch timing</h3>
<p>Native events (scroll, press) arrive on the JS thread asynchronously in old architecture. In new architecture with Fabric, some events can be sync or coalesced. Don't rely on a specific order unless the docs guarantee it.</p>

<h3>14. Multiple React roots</h3>
<p>Most apps have one root. Embedded RN (a native app hosting RN for a screen) may have multiple. Each root has its own bundle instance; TurboModules can be shared. This is a common source of bugs with singletons and navigation state.</p>

<h3>15. <code>useNativeDriver</code> only on certain properties</h3>
<p>Old <code>Animated</code> API with <code>useNativeDriver: true</code> works only for non-layout properties (transform, opacity). Layout props (width, left) can't use native driver. Reanimated avoids this by running worklets.</p>

<h3>16. Platform-specific thread model</h3>
<p>On iOS, UI runs on the "main" thread. On Android, it's "main" too but Java/Kotlin + native renderer sometimes on separate threads. Behavior is mostly abstracted away — bugs surface in layout timing and gesture handler priority.</p>

<h3>17. Hermes bytecode is not compatible across Hermes versions</h3>
<p>Upgrading RN also upgrades Hermes; bytecode is regenerated. Don't ship precompiled bytecode in third-party packages — ship JS.</p>

<h3>18. Concurrent React caveats in Fabric</h3>
<p><code>startTransition</code>, Suspense, and automatic batching work with Fabric. <code>useSyncExternalStore</code> works. But some third-party libs use bridge assumptions and break under concurrent mode — validate carefully.</p>

<h3>19. Long JS tasks still visibly affect touches in old arch</h3>
<p>Even though touches are processed on the UI thread, the bridge is where the "press state" reaches React. So a 2s JS block means onPress fires with a 2s delay. New arch + synchronous JSI reduces but doesn't eliminate this.</p>

<h3>20. Third-party library compatibility matrix</h3>
<p>When upgrading RN, check each major lib (Reanimated, Navigation, Gesture Handler, Screens, Keyboard Controller) for compatibility. Mismatches are the #1 source of upgrade pain.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — treating RN as a web renderer</h3>
<p>Using web mental models (DOM, CSS cascading, hover states, media queries) leads to surprise. There's no DOM, no cascade, no hover. Use Flexbox via Yoga, Dimensions API, Platform.select.</p>

<h3>Anti-pattern 2 — heavy work on JS thread during interactions</h3>
<p>Scrolling + running a heavy reducer = dropped frames on JS thread; scroll also jerks because the JS-side handler can't keep up. Use <code>InteractionManager</code>, <code>startTransition</code>, or move to worklet.</p>

<h3>Anti-pattern 3 — over-logging in production</h3>
<p><code>console.log</code> has cost. Strip via Babel plugin in release, or use a dev-only logger.</p>

<h3>Anti-pattern 4 — blocking the main JS execution with require-on-import</h3>
<p>Large synchronous imports at app start inflate TTI. Use <code>inlineRequires: true</code> in Metro config to defer module evaluation until first use.</p>

<h3>Anti-pattern 5 — AsyncStorage for everything</h3>
<p>AsyncStorage (bridge-based) is ~1-5ms per op. For frequent or sync-needed storage (settings, cached tokens), switch to <strong>react-native-mmkv</strong> (JSI-based, ~0.01ms).</p>

<h3>Anti-pattern 6 — using old <code>Animated</code> API for complex animations</h3>
<p>Reanimated 3 is the modern answer. Old Animated can't hit 60fps when JS is busy; Reanimated runs on UI thread.</p>

<h3>Anti-pattern 7 — ignoring memory leaks in native modules</h3>
<p>Native modules that hold JS references must release them properly. In TurboModules, use <code>jsi::HostObject</code> lifecycle carefully. On old arch, <code>RCTEventEmitter</code> that holds strong refs leaks.</p>

<h3>Anti-pattern 8 — not enabling Hermes</h3>
<p>Hermes is default on new RN, but legacy projects upgrading sometimes miss it. Binary smaller, startup faster, memory lower — turn it on.</p>

<h3>Anti-pattern 9 — unmemoized list items in FlatList</h3>
<p>FlatList re-renders items liberally. Memoize the item component with <code>React.memo</code> + stable <code>keyExtractor</code> + <code>renderItem</code> wrapped in <code>useCallback</code>. Or switch to FlashList.</p>

<h3>Anti-pattern 10 — custom native code for things libraries handle</h3>
<p>Tempting to write your own camera / image picker / storage native module. But maintenance of platform-specific code is costly. Prefer established libs (react-native-vision-camera, expo-image-picker, MMKV).</p>

<h3>Anti-pattern 11 — expecting CSS behavior from <code>StyleSheet</code></h3>
<p>No selectors, no cascade, no inheritance (except for Text children inheriting Text parent's font styles). Styles are plain JS objects. No <code>:hover</code> (mobile). No <code>@media</code> — use <code>Dimensions</code> or <code>useWindowDimensions</code>.</p>

<h3>Anti-pattern 12 — ignoring new arch during library selection</h3>
<p>Starting a new RN project in 2025+? Enable new arch from day 1. Picking a library that doesn't support it is future debt.</p>

<h3>Anti-pattern 13 — reading native module state without subscribing</h3>
<pre><code class="language-js">// BAD
const val = NativeModules.MyMod.getVal(); // might be undefined at startup
// GOOD
import { NativeEventEmitter } from 'react-native';
const emitter = new NativeEventEmitter(NativeModules.MyMod);
emitter.addListener('change', (val) =&gt; setVal(val));</code></pre>

<h3>Anti-pattern 14 — shipping the dev bundle to production</h3>
<p>Dev bundles include error symbolication, hot-reload, warnings. They're 5-10× larger and slower. Verify your release config uses the prod bundle with Hermes bytecode.</p>

<h3>Anti-pattern 15 — ignoring platform differences</h3>
<p>"Works on iOS" ≠ "works on Android" and vice versa. Status bar, keyboard avoidance, safe area, text rendering, permissions model — all differ. Test both platforms per feature.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Explain the React Native architecture.</div>
  <div class="qa-answer">
    <p>RN runs your React code in a JavaScript engine (Hermes by default) on the device. When React says "render a View," RN creates a real native view — UIView on iOS, android.view.View on Android.</p>
    <p>Two architectures exist:</p>
    <ul>
      <li><strong>Old (Bridge)</strong>: JS and native communicate via an asynchronous JSON-serialized message queue. Simple but slow for high-frequency calls.</li>
      <li><strong>New (JSI + Fabric + TurboModules)</strong>: JSI provides a C++ interface so JS and native share memory and call each other synchronously. Fabric is the new renderer. TurboModules replaces NativeModules with lazy-loaded, typed, sync-capable modules. Codegen generates bindings from TypeScript specs.</li>
    </ul>
    <p>Three threads run: JS (React + your code), Native UI (view hierarchy, input), Shadow (Yoga layout). Animations run on UI thread via Reanimated worklets powered by JSI.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is JSI and why does it matter?</div>
  <div class="qa-answer">
    <p>JSI (JavaScript Interface) is a lightweight C++ API that lets native code hold JS references and JS code hold references to native C++ objects (<code>jsi::HostObject</code>). Calls between them are direct function invocations — no JSON serialization, no asynchronous message queue. Matters because:</p>
    <ul>
      <li>Synchronous calls from JS to native become possible (measure layout without a callback).</li>
      <li>Native code can install objects on the JS global directly (enabling MMKV's sync storage).</li>
      <li>Libraries like Reanimated run worklets on the UI thread with shared state.</li>
      <li>Removes JSON serialization overhead on hot paths.</li>
    </ul>
    <p>JSI is the foundation under Fabric, TurboModules, and Reanimated 3.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What's Fabric?</div>
  <div class="qa-answer">
    <p>Fabric is RN's new renderer — a C++ implementation that replaces the old UIManager + ShadowNode system. Key features:</p>
    <ul>
      <li>Shared across iOS and Android — consistent behavior.</li>
      <li>Synchronous layout reads — no need to request and await measurements.</li>
      <li>Concurrent-React aware — Fabric respects React 18 lanes so <code>startTransition</code> / Suspense work.</li>
      <li>Immutable shadow trees with atomic swap — similar to Fiber's work-in-progress pattern.</li>
    </ul>
    <p>Enables smoother animations, faster layout, and proper integration with React's scheduler.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Why use Hermes?</div>
  <div class="qa-answer">
    <p>Hermes is Facebook's JS engine optimized for RN on mobile:</p>
    <ul>
      <li><strong>Smaller APK/IPA</strong> — JS bundle smaller in binary.</li>
      <li><strong>Faster startup</strong> — bytecode is pre-compiled at build time; device loads it directly.</li>
      <li><strong>Lower memory</strong> — generational GC tuned for mobile constraints.</li>
      <li><strong>Better debugging</strong> — integrates with Chrome DevTools via <code>hermes-engine</code>.</li>
    </ul>
    <p>Default since RN 0.70+. Previously some apps stayed on JSC because Hermes lacked features; that's mostly resolved.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's the difference between NativeModules and TurboModules?</div>
  <div class="qa-answer">
    <p><strong>NativeModules (old)</strong>: All modules loaded eagerly at app start. Communication via async bridge (JSON). No type safety between native and JS.</p>
    <p><strong>TurboModules (new)</strong>: Loaded lazily — native class isn't instantiated until first JS call. Uses JSI — synchronous, no JSON. Typed via TypeScript specs and codegen-generated native headers. Smaller startup cost, faster calls, compile-time safety.</p>
    <p>TurboModules are backward-compatible with old bridge-mode as fallback.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What threads exist in an RN app?</div>
  <div class="qa-answer">
    <p>Three primary threads:</p>
    <ul>
      <li><strong>JS thread</strong>: runs your React code, hooks, event handlers, business logic.</li>
      <li><strong>Native UI / Main thread</strong>: OS-level main thread. Owns the view hierarchy, processes input events, drives native animations and scrolling.</li>
      <li><strong>Shadow thread</strong>: runs Yoga layout calculations in the background.</li>
    </ul>
    <p>Implications: blocking JS thread → state updates delay but animations keep running (if on UI thread). Blocking UI thread → everything freezes. Reanimated lets you move animations and gestures entirely to the UI thread.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How does Reanimated achieve 60fps animations?</div>
  <div class="qa-answer">
    <p>Reanimated uses JSI to run <strong>worklets</strong> — small JS functions serialized and executed on the UI thread in a separate JS context. Shared values (<code>useSharedValue</code>) are backed by JSI-accessible memory, readable and writable from both threads. Animation work (style computation, gesture handlers) happens on the UI thread without any JS thread round-trip.</p>
    <p>Result: even if the JS thread is blocked by heavy work (sorting a huge list, parsing JSON), your animations stay smooth.</p>
    <p>On the old architecture, Animated with <code>useNativeDriver: true</code> partially achieved this for transform/opacity only. Reanimated works for arbitrary worklet logic.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Walk me through what happens when I call setState in an RN app.</div>
  <div class="qa-answer">
    <ol>
      <li><code>setState</code> queues an update on the fiber (JS thread).</li>
      <li>React schedules work on a lane (sync, transition, etc.).</li>
      <li>At the next scheduler tick, React re-renders the tree, diffing the new Elements against the current fibers.</li>
      <li>The renderer (Fabric or old UIManager) collects mutations and commits.</li>
      <li>In old arch: mutations serialized to JSON, sent over bridge, native rebuilds views.</li>
      <li>In new arch: mutations applied via JSI to the C++ shadow tree; Fabric commits to native views on UI thread.</li>
      <li>Native views update; user sees the change.</li>
    </ol>
    <p>If the tree is large or render is slow, user sees a delay. Mitigations: memoization, virtualization, startTransition.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What's the "bridgeless" mode?</div>
  <div class="qa-answer">
    <p>The full form of the new architecture — the legacy bridge is entirely removed. All communication goes through JSI. Requires every native module to be a TurboModule and every component to be Fabric-compatible. Activated via the new-arch flag. Available in RN 0.73+. Some third-party libraries may not yet work in bridgeless mode.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. When would you drop to writing a native module?</div>
  <div class="qa-answer">
    <p>When existing libraries don't cover your need:</p>
    <ul>
      <li>Accessing a platform-specific API not yet wrapped (e.g., a new OS API).</li>
      <li>Interfacing with a native SDK you can't call from JS (payment processor, OEM sensor).</li>
      <li>Performance-critical code that benefits from native execution.</li>
    </ul>
    <p>Write it as a TurboModule with a TS spec — codegen produces the ObjC/Kotlin headers; you implement them. Test on both platforms. Be prepared for maintenance cost.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What's codegen?</div>
  <div class="qa-answer">
    <p>A build-time tool that reads TypeScript specs for TurboModules and Fabric components and generates platform-specific native interfaces — ObjC protocols and Kotlin abstract classes. Your native implementation extends these. Benefits: method signatures checked at compile time; refactoring a spec rejects out-of-date native code loudly rather than silently. Lives under <code>codegenConfig</code> in package.json. Runs automatically as part of iOS pod install and Android gradle builds.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How is state preserved across reloads / Fast Refresh?</div>
  <div class="qa-answer">
    <p>Fast Refresh preserves React component state when you edit component code (replaces component definition without unmounting). If you edit a file that exports non-component values, it does a full reload (state lost). Hermes bytecode has no impact — Fast Refresh swaps JS source. To preserve specific state across reloads, use a storage layer (MMKV, AsyncStorage) or a module-level variable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. When does Metro re-bundle vs rebuild the app?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>JS changes</strong> → Metro rebuilds the JS bundle only; device gets the new bundle via Fast Refresh or full reload. No native build.</li>
      <li><strong>Native changes</strong> (Swift/ObjC/Kotlin/Java, Podfile, gradle) → full native rebuild required.</li>
      <li><strong>TurboModule spec changes</strong> → codegen runs → native rebuild.</li>
      <li><strong>Asset / bundled resource changes</strong> → often requires rebuild.</li>
    </ul>
    <p>A common trap: JS-only change hot-reloads successfully but "doesn't work" because of a stale native build. Always rebuild native after <code>pod install</code> / new library install.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What's the cost of the bridge in old architecture?</div>
  <div class="qa-answer">
    <p>Every call from JS to native (or vice versa) is:</p>
    <ol>
      <li>JS serializes args to JSON.</li>
      <li>JSON copied across thread boundary.</li>
      <li>Native deserializes JSON.</li>
      <li>Native executes; result JSON-serialized; sent back (if callback).</li>
    </ol>
    <p>At high call rates (animation frame, 60Hz gesture), JSON serialization dominates CPU — often causes dropped frames. Sync calls impossible (async queue only). Even batching per frame is a fragile mitigation. JSI eliminates this entirely.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. You're asked to debug a jank issue. Where do you look?</div>
  <div class="qa-answer">
    <ol>
      <li>Is it scroll jank, touch response, or animation stutter?</li>
      <li>Open Flipper / React DevTools / Perf Monitor (Dev Menu → Show Perf Monitor) — look at JS thread frame rate vs UI thread frame rate.</li>
      <li>JS thread low fps → heavy work on JS thread. Profile with Hermes profiler or React Profiler. Optimize renders, virtualize lists, move to worklet.</li>
      <li>UI thread low fps → heavy native work or too many layers / overdraw. Use the platform's native profiler (Instruments on iOS, Android Studio Profiler).</li>
      <li>Animation jank specifically → move animation to Reanimated worklet so it runs on UI thread regardless of JS load.</li>
      <li>Check list rendering: use FlashList or memoize FlatList items with stable handlers.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish Bridge (old) from JSI (new) and name Fabric + TurboModules.</li>
    <li>You know Hermes is the default JS engine and its benefits.</li>
    <li>You describe the three threads — JS, Native UI, Shadow — and their relationships.</li>
    <li>You explain Reanimated worklets as JSI-powered UI-thread execution.</li>
    <li>You know TurboModules are lazy, typed via codegen, and JSI-sync.</li>
    <li>You can debug jank by thread (JS vs UI).</li>
    <li>You cite MMKV as a JSI-powered replacement for AsyncStorage.</li>
    <li>You acknowledge ecosystem compatibility as the main new-arch adoption cost.</li>
  </ul>
</div>
`}

]
});
