window.PREP_SITE.registerTopic({
  id: "rn-performance",
  module: "React Native",
  title: "Performance",
  estimatedReadTime: "28 min",
  tags: ["react-native","performance","flashlist","reanimated","hermes","profiler","bundle","ram-bundle"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>Profile first on a real mid-range Android, then fix the right thread</strong> — mobile is slower and pickier than web, and intuition about "the slow part" fails more often than not.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Four targets, four playbooks:</strong> startup (bundle size + parse), render (memoize + virtualize), frame rate (move work to the UI thread), memory (kill leaks + retain cycles).</li>
    <li><strong>Three threads:</strong> JS (components, handlers, network), UI (native views, gestures, Reanimated worklets), Shadow (Yoga layout). Blocking JS → state lags but scroll still works; blocking UI → everything freezes.</li>
    <li><strong>Profile before optimizing</strong> — intuition fails more on mobile. Many cheap renders often cost more than one expensive one; a 3MB hero image beats a fancy animation for jank.</li>
    <li><strong>Profiling tools:</strong> the Perf Monitor (JS vs UI FPS), React Native DevTools, the React DevTools Profiler, Xcode Instruments and the Android Studio Profiler.</li>
    <li><strong>Profile on a physical mid-range Android</strong> — simulators and flagship iPhones hide problems.</li>
    <li><strong>Hermes</strong> (default since 0.70): pre-compiled bytecode → 30–50% faster startup, smaller binary, lower heap. Keep it on.</li>
    <li><strong>New Architecture</strong> (Fabric + TurboModules + JSI, default since 0.76): synchronous native calls (no JSON bridge), lazy TurboModules, bridgeless, real Concurrent React.</li>
    <li><strong>FlashList over FlatList</strong> for long lists — recycles native views (like RecyclerView/UITableView) instead of unmounting. v2 (2025) dropped the required <code>estimatedItemSize</code>.</li>
    <li><strong>Reanimated + Gesture Handler:</strong> worklets run on the UI thread via JSI → animations stay smooth even when the JS thread is busy.</li>
    <li><strong>expo-image / FastImage</strong> for caching, placeholders (blurhash), and automatic memory management. Never ship full-res images for thumbnails.</li>
    <li><strong>inlineRequires: true</strong> in Metro defers module loading to first use → faster startup.</li>
    <li><strong>What breaks memoization:</strong> inline functions (<code>onPress={() =&gt; …}</code>), inline objects, and inline style arrays create new references every render. Stabilize with <code>useCallback</code>/<code>useMemo</code>/pre-declared constants.</li>
    <li><strong>Memoization is not free</strong> — for cheap components the comparison cost exceeds the saving. Profile first.</li>
    <li><strong>JS FPS vs UI FPS:</strong> low JS + high UI → JS-thread bottleneck (fix renders/offload work); low UI + high JS → native-side (fewer views, simpler layouts).</li>
    <li><strong>Heavy JS work</strong> (filter/sort/parse) locking the app → <code>startTransition</code>, debounce input, <code>InteractionManager.runAfterInteractions</code>, or a worker/native module.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Optimizing without profiling — and over-memoizing everything.</strong> Wrapping every component in <code>React.memo</code> and every value in <code>useMemo</code>/<code>useCallback</code> isn't free: each one costs a comparison plus the memoized box, and for cheap components that cost exceeds the saving. Worse, memo is silently defeated by inline functions, objects, and style arrays passed as props (a new reference every render). Fix: profile on a physical device to find the actual hot path, then stabilize only those props and memoize only what measurably benefits.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I profile first on a physical mid-range Android, then read JS FPS vs UI FPS — that tells me whether the bottleneck is the JS thread or the native side before I change anything."</div>
  <div class="revision-say">"My defaults are Hermes and the New Architecture on, FlashList for long lists, Reanimated for animations and gestures, and expo-image for images."</div>
  <div class="revision-say">"Animation jank usually means work on the wrong thread — I move it to the UI thread with Reanimated worklets so it's decoupled from a busy JS thread."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Why mobile performance is harder than web</h3>
<ul>
  <li><strong>Device variety</strong> — from flagship iPhones to $100 Android devices with 1GB RAM.</li>
  <li><strong>Thermal throttling</strong> — sustained load reduces CPU/GPU speed after 30s-2min.</li>
  <li><strong>Memory pressure</strong> — OS may kill backgrounded apps to reclaim memory; cold restart visible to user.</li>
  <li><strong>Battery</strong> — 60fps animations burn battery; users notice.</li>
  <li><strong>Cellular networks</strong> — higher latency, intermittent connectivity, data caps.</li>
</ul>

<h3>Four perf targets, four playbooks</h3>
<table>
  <thead><tr><th>Target</th><th>Symptoms</th><th>Playbook</th></tr></thead>
  <tbody>
    <tr><td>Startup</td><td>Long splash, late TTI</td><td>Hermes bytecode, RAM bundle, lazy imports, new arch, Fast Refresh off in prod</td></tr>
    <tr><td>Rendering</td><td>Slow screen transitions, jank on state update</td><td>Memoize, virtualize, reduce wrapper depth, profile with DevTools</td></tr>
    <tr><td>Frame rate</td><td>Dropped frames during scroll/animation</td><td>Reanimated worklets, FlashList, useNativeDriver, scrollEventThrottle</td></tr>
    <tr><td>Memory</td><td>Crashes after long use, OOM warnings</td><td>Clean up listeners, virtualize lists, image cache size, avoid retain cycles</td></tr>
  </tbody>
</table>

<h3>Why profile before optimizing</h3>
<p>Your intuition about "the slow part" is often wrong. Cheap components rendered many times cost more than one expensive component rendered once. A 3MB image on the hero costs more than a fancy animation. Use real tools (React Native DevTools, Instruments) on a mid-range Android device to find the actual bottleneck.</p>

<h3>Why Hermes matters</h3>
<ul>
  <li><strong>Bytecode pre-compile</strong> at build time → device loads bytecode, not source. Startup saves 30-50%.</li>
  <li><strong>Smaller APK/IPA</strong> — bytecode is smaller than minified JS.</li>
  <li><strong>Lower memory ceiling</strong> — generational GC tuned for mobile.</li>
  <li><strong>Faster time-to-interactive</strong>.</li>
</ul>
<p>Cost: minor bytecode compile step at build; tooling still catching up to V8 for some edge cases. Default since RN 0.70.</p>

<h3>Why FlashList over FlatList for long lists</h3>
<p>FlatList <em>unmounts</em> items as you scroll past them; FlashList <em>recycles</em> native views (like UITableView / RecyclerView). Benefits:</p>
<ul>
  <li>Fewer native view creations (expensive on the UI thread).</li>
  <li>Item state preserved across scroll (good for uncontrolled media).</li>
  <li>Better memory profile under heavy scroll.</li>
</ul>
<p>FlashList v1 requires <code>estimatedItemSize</code>; FlashList v2 (2025) removed it (auto-measured), so it's no longer required. Drop-in replacement for most cases.</p>

<h3>Why Reanimated for animations</h3>
<p>Animations running on the JS thread drop frames when JS is busy (rendering, network, business logic). Reanimated's worklets run on the UI thread via JSI, decoupled from JS work — animations stay at 60-120fps regardless. Same for gestures via react-native-gesture-handler.</p>

<h3>Why bundle size matters</h3>
<p>Every kilobyte of JS is downloaded (if OTA update), parsed, compiled, kept in memory. On low-end devices, parse/compile dominates startup. Aim for code-split routes, tree-shake, avoid shipping debug libs in production.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The "three threads" picture</h3>
<div class="diagram">
<pre>
  JS THREAD                        UI THREAD                       SHADOW THREAD
  ─────────                        ─────────                       ─────────────
  React components                 UIView / Android.View           Yoga layout
  Event handlers                   Native scroll / touches         Compute sizes
  Network requests                 Reanimated worklets             Run alongside
  Heavy JS work                    GPU compose                     UI thread

  Blocking JS → state updates lag but native scroll/gesture still work
  Blocking UI → everything freezes visually</code>
</pre>
</div>

<h3>The "startup waterfall" picture</h3>
<div class="diagram">
<pre>
  icon tap
    │
    ▼
  OS launches process                                    (platform)
    │
    ▼
  RN runtime init (load JS VM, parse bundle)             ← Hermes bytecode saves here
    │
    ▼
  App.tsx mounts
    │
    ▼
  Root component renders (Nav → first screen)
    │
    ▼
  Fonts / initial data load (await)
    │
    ▼
  First frame paints → user sees content
  └─ Target: &lt;1-2s on mid-range Android for cold start</pre>
</div>

<h3>The "render cost" picture</h3>
<pre><code>Cheap per component:
  - diff props, run hooks, return JSX

Expensive per component:
  - Creating new native views (first render)
  - Large text measurement (Yoga computes)
  - Image decode (first render)
  - Complex layout cascades

Scale to 100 rows? Multiply. Scale to 1000? Virtualize.</code></pre>

<h3>The "what breaks memoization" picture</h3>
<pre><code class="language-tsx">&lt;Row
  data={item}                     ← fine if item is stable
  onPress={() =&gt; handle(item)}   ← new fn per render → memo useless
  options={{ flag: true }}       ← new object per render
  style={[styles.base, {...}]}   ← new array per render
/&gt;</code></pre>
<p>Stabilize with useCallback, useMemo, or pre-declared constants.</p>

<h3>The "profile loop" picture</h3>
<div class="diagram">
<pre>
  1. Reproduce the slow scenario on target device
  2. Profile (React Native DevTools / Instruments / Android Studio)
  3. Identify the top 3 hot spots
  4. Apply ONE fix
  5. Re-profile — confirm improvement
  6. If no improvement, revert and try another fix
  7. Repeat until budget hit</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Premature memoization is harmless." It's not free — each <code>useMemo</code>/<code>useCallback</code> costs comparisons + the memoized box. For cheap components, the cost exceeds the saving. Profile to find which parts actually benefit.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>Startup — Hermes + bytecode</h3>
<pre><code>// android/gradle.properties
hermesEnabled=true

// ios/Podfile
use_react_native!(
  :hermes_enabled =&gt; true,
  # ...
)</code></pre>
<p>Release builds emit <code>.hbc</code> bytecode. Dev builds still use JS source for Fast Refresh.</p>

<h3>Startup — inlineRequires</h3>
<pre><code class="language-js">// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () =&gt; ({
      transform: { experimentalImportSupport: false, inlineRequires: true },
    }),
  },
};</code></pre>
<p>Defers <code>require()</code> evaluation to first use — large libs don't eagerly run on app load.</p>

<h3>Startup — RAM bundle (legacy optimization)</h3>
<p>Splits the JS bundle into modules stored in memory as-needed. Used mainly on Android before Hermes. With Hermes bytecode, RAM bundle is mostly obsolete. Check your RN version's recommendation.</p>

<h3>Rendering — memo hot paths</h3>
<pre><code class="language-tsx">const Row = React.memo(function Row({ item, onPress }) {
  return &lt;Pressable onPress={() =&gt; onPress(item.id)}&gt;&lt;Text&gt;{item.title}&lt;/Text&gt;&lt;/Pressable&gt;;
});

function List({ items }) {
  const onPress = useCallback((id: string) =&gt; { /* ... */ }, []);
  const renderItem = useCallback(({ item }) =&gt; &lt;Row item={item} onPress={onPress} /&gt;, [onPress]);
  const keyExtractor = useCallback((i) =&gt; i.id, []);
  return &lt;FlatList data={items} renderItem={renderItem} keyExtractor={keyExtractor} /&gt;;
}</code></pre>

<h3>Virtualization — FlashList</h3>
<pre><code class="language-tsx">import { FlashList } from '@shopify/flash-list';
&lt;FlashList
  data={items}
  renderItem={renderItem}
  keyExtractor={(i) =&gt; i.id}
  estimatedItemSize={120}     // v1 only — required on v1, removed in v2
  getItemType={(item) =&gt; item.type}  // optional; speeds up mixed lists
/&gt;</code></pre>

<h3>Virtualization — FlatList tuning (when not using FlashList)</h3>
<pre><code class="language-tsx">&lt;FlatList
  data={items}
  keyExtractor={(i) =&gt; i.id}
  renderItem={renderItem}
  initialNumToRender={10}       // tradeoff: startup vs perceived speed
  maxToRenderPerBatch={5}       // lower for smoother scroll
  windowSize={10}               // viewport multiplier; lower = less memory
  updateCellsBatchingPeriod={50}
  removeClippedSubviews         // Android only — unmount off-screen
  getItemLayout={(_, i) =&gt; ({ length: 80, offset: 80 * i, index: i })}
/&gt;</code></pre>

<h3>Images — optimization pipeline</h3>
<pre><code class="language-tsx">import { Image } from 'expo-image';
&lt;Image
  source={{ uri: thumbUrl }}
  placeholder={{ blurhash }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  priority="normal"
  style={{ width: '100%', aspectRatio: 16/9 }}
/&gt;</code></pre>
<p>Pipeline: server sends right-sized WebP/AVIF per device; CDN serves; client caches (expo-image disk cache); placeholders prevent layout shift.</p>

<h3>Animations — Reanimated worklets</h3>
<pre><code class="language-tsx">const x = useSharedValue(0);
const style = useAnimatedStyle(() =&gt; ({ transform: [{ translateX: x.value }] }));
// Animation runs on UI thread regardless of JS workload.</code></pre>

<h3>Gestures — gesture-handler</h3>
<pre><code class="language-tsx">const pan = Gesture.Pan().onUpdate((e) =&gt; { x.value = e.translationX; });
&lt;GestureDetector gesture={pan}&gt;&lt;Animated.View style={style}/&gt;&lt;/GestureDetector&gt;</code></pre>

<h3>Defer heavy work</h3>
<pre><code class="language-ts">import { InteractionManager } from 'react-native';
InteractionManager.runAfterInteractions(() =&gt; {
  heavyAnalyticsCompute();
});
// Waits until current transitions/animations complete, avoids dropping frames during nav.</code></pre>

<h3>Break JS long tasks</h3>
<pre><code class="language-ts">async function processItems(items) {
  const CHUNK = 50;
  for (let i = 0; i &lt; items.length; i += CHUNK) {
    items.slice(i, i + CHUNK).forEach(process);
    await new Promise(r =&gt; setTimeout(r, 0));  // yield to RN
  }
}</code></pre>

<h3>Memory — cleanup</h3>
<ul>
  <li>Always <code>unsubscribe()</code> listeners in useEffect cleanup.</li>
  <li>Clear timers: <code>clearTimeout</code> / <code>clearInterval</code>.</li>
  <li>Abort in-flight requests on unmount.</li>
  <li>Avoid keeping refs to large views in module scope.</li>
  <li>Use <code>removeClippedSubviews</code> for FlatList on Android.</li>
</ul>

<h3>Profiling — React Native DevTools</h3>
<p>React Native DevTools (built-in since RN 0.76) replaced Flipper as the current debug/profiling tool. Flipper is no longer supported for RN debugging:</p>
<ul>
  <li>Components + Profiler — profile renders, see "why did this render."</li>
  <li>Perf Monitor (Dev Menu) — JS frame rate, UI frame rate, memory.</li>
  <li>Network inspector.</li>
  <li>Native layout inspection — use Xcode View Debugger / Android Studio Layout Inspector.</li>
  <li>Debugs the actual on-device Hermes engine (not Chrome V8).</li>
</ul>

<h3>Profiling — Xcode Instruments</h3>
<p>Time Profiler: native CPU usage. Allocations: memory allocations by type. Animation Hitches: frames that missed their deadline. Leaks: detect obvious memory leaks.</p>

<h3>Profiling — Android Studio Profiler</h3>
<p>CPU Profiler: flame graphs for Java and native code. Memory Profiler: heap allocations, GC events. Network. Energy.</p>

<h3>Perf monitor (in-app)</h3>
<pre><code>Dev menu → Show Perf Monitor
Shows two numbers: JS FPS and UI FPS. Below 60 means dropped frames.</code></pre>

<h3>Bundle analysis</h3>
<pre><code>npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output main.jsbundle --sourcemap-output main.jsbundle.map
npx source-map-explorer main.jsbundle main.jsbundle.map
// Shows what's taking space — catch a 500KB lib you forgot about.</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — memoized row</h3>
<pre><code class="language-tsx">const Row = React.memo(function Row({ item, onPress }: Props) {
  return (
    &lt;Pressable onPress={() =&gt; onPress(item.id)}&gt;
      &lt;Image source={{ uri: item.avatar }} style={styles.avatar} /&gt;
      &lt;Text&gt;{item.name}&lt;/Text&gt;
    &lt;/Pressable&gt;
  );
}, (prev, next) =&gt; prev.item.id === next.item.id &amp;&amp; prev.onPress === next.onPress);</code></pre>

<h3>Example 2 — FlashList with mixed item types</h3>
<pre><code class="language-tsx">&lt;FlashList
  data={mixed}
  renderItem={({ item }) =&gt; item.type === 'header' ? &lt;Header /&gt; : &lt;Row item={item} /&gt;}
  getItemType={(item) =&gt; item.type}
  estimatedItemSize={80}
/&gt;
// Recycles separate pools for each type → no layout thrash on type changes</code></pre>

<h3>Example 3 — heavy compute off JS thread</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  InteractionManager.runAfterInteractions(async () =&gt; {
    const analytics = await computeAnalytics(largeData);
    setAnalytics(analytics);
  });
}, [largeData]);
// Runs after navigation transition completes</code></pre>

<h3>Example 4 — Reanimated scroll header</h3>
<pre><code class="language-tsx">const scrollY = useSharedValue(0);
const scrollHandler = useAnimatedScrollHandler({ onScroll: (e) =&gt; { scrollY.value = e.contentOffset.y; } });
const headerStyle = useAnimatedStyle(() =&gt; ({
  height: interpolate(scrollY.value, [0, 200], [300, 100], 'clamp'),
}));
// Smooth even while JS renders list items</code></pre>

<h3>Example 5 — startup: lazy-load rarely-used screen</h3>
<pre><code class="language-tsx">const Settings = lazy(() =&gt; import('./Settings'));
&lt;Stack.Screen name="Settings" component={() =&gt; (
  &lt;Suspense fallback={&lt;Spinner /&gt;}&gt;&lt;Settings /&gt;&lt;/Suspense&gt;
)} /&gt;
// Settings bundle loaded only when navigated to</code></pre>

<h3>Example 6 — image caching for a feed</h3>
<pre><code class="language-tsx">&lt;Image
  source={{ uri: post.coverUrl }}
  placeholder={{ blurhash: post.coverBlurhash }}
  contentFit="cover"
  recyclingKey={post.id}      // FlashList compatibility
  style={{ width: '100%', aspectRatio: 16/9 }}
  cachePolicy="memory-disk"
/&gt;</code></pre>

<h3>Example 7 — abort in-flight request on unmount</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal })
    .then((r) =&gt; r.json())
    .then(setData)
    .catch((e) =&gt; { if (e.name !== 'AbortError') setError(e); });
  return () =&gt; ctrl.abort();
}, [url]);</code></pre>

<h3>Example 8 — Profiler API</h3>
<pre><code class="language-tsx">import { Profiler } from 'react';
&lt;Profiler id="HomeFeed" onRender={(id, phase, actualDur, baseDur) =&gt; {
  if (actualDur &gt; 16) analytics.slowRender(id, actualDur);
}}&gt;
  &lt;HomeFeed /&gt;
&lt;/Profiler&gt;</code></pre>

<h3>Example 9 — startTransition for heavy filter</h3>
<pre><code class="language-tsx">const [input, setInput] = useState('');
const [filtered, setFiltered] = useState(items);
const [pending, startTransition] = useTransition();
const onChange = (text) =&gt; {
  setInput(text);
  startTransition(() =&gt; setFiltered(items.filter(i =&gt; i.includes(text))));
};
// Input stays responsive while 10K-row re-filter runs in background</code></pre>

<h3>Example 10 — cleanup pattern</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  const sub = subscribeToSomething(handler);
  const timer = setInterval(tick, 1000);
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal });
  return () =&gt; {
    sub.unsubscribe();
    clearInterval(timer);
    ctrl.abort();
  };
}, []);</code></pre>

<h3>Example 11 — RAM constraint on images</h3>
<pre><code class="language-tsx">// For a large grid of images:
&lt;FlashList
  numColumns={3}
  data={photos}
  renderItem={({ item }) =&gt; (
    &lt;Image
      source={{ uri: item.thumbUrl }}        // use THUMBNAIL url, not full
      style={{ width: cellWidth, height: cellWidth }}
      contentFit="cover"
    /&gt;
  )}
  estimatedItemSize={cellWidth}
/&gt;
// Server serves appropriately-sized thumbs; memory stays in check</code></pre>

<h3>Example 12 — break large JSON parse</h3>
<pre><code class="language-ts">// Instead of:
const data = JSON.parse(hugeString);  // blocks JS thread

// Use a worker:
const worker = new Worker(...);  // react-native-worker-thread or similar
worker.postMessage(hugeString);
worker.onmessage = (e) =&gt; setData(e.data);</code></pre>

<h3>Example 13 — Metro minification</h3>
<pre><code class="language-js">// metro.config.js — production build
module.exports = {
  transformer: {
    minifierConfig: {
      mangle: { toplevel: true },
      compress: { drop_console: true },  // strip console.log in release
    },
  },
};</code></pre>

<h3>Example 14 — enabling New Architecture</h3>
<pre><code>// android/gradle.properties
newArchEnabled=true
hermesEnabled=true
// ios/Podfile
use_react_native!(:new_arch_enabled =&gt; true, :hermes_enabled =&gt; true)
// Note: default-on since RN 0.76 — these flags are only needed to opt in on 0.71–0.75.</code></pre>

<h3>Example 15 — memory snapshot via React Native DevTools</h3>
<p>Open React Native DevTools → Memory → Take snapshot. Interact with the app → take another snapshot → compare. Growing components = likely leaks.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. FlashList estimatedItemSize wrong</h3>
<p>Estimate used for initial layout. Too small → empty space flashes. Too big → over-scroll. Use a realistic average.</p>

<h3>2. FlatList + getItemLayout with variable heights</h3>
<p><code>getItemLayout</code> assumes known offsets — wrong for variable heights. Skip it unless items are fixed-size.</p>

<h3>3. removeClippedSubviews iOS</h3>
<p>Default true in FlatList but sometimes causes items to render blank on iOS. If you see blank rows, try disabling it.</p>

<h3>4. Reanimated worklets can't reference non-worklet functions</h3>
<p>Compile error: "Cannot read property 'value' of undefined." Review that any function called inside a worklet has <code>'worklet'</code> directive or is a built-in.</p>

<h3>5. Image decoding on main thread (old iOS)</h3>
<p>Large images decoded lazily on main thread when rendering — causes jank on first-appearance. expo-image handles async decode by default.</p>

<h3>6. JS thread unresponsive &gt; 5s</h3>
<p>On Android, ANR (Application Not Responding) dialog appears if the main thread is blocked that long. Though UI thread is different from JS thread, long native calls can trigger.</p>

<h3>7. Animated.event vs useAnimatedScrollHandler</h3>
<p>Old API + useNativeDriver works, but Reanimated's handler is more consistent and full-featured. Migrate when possible.</p>

<h3>8. React Profiler ID collision</h3>
<p>If multiple <code>&lt;Profiler id="feed"&gt;</code> with the same id mount, callbacks conflate. Use unique IDs per instance.</p>

<h3>9. Remote JS debugging removed (was not V8-accurate)</h3>
<p>The old "Debug in Chrome" ran JS in Chrome V8 — behavior differed from on-device Hermes — and was removed in RN 0.79. Use React Native DevTools, which debugs the actual Hermes engine. Test production behavior on Hermes.</p>

<h3>10. Startup time regresses after a minor update</h3>
<p>Common cause: a library's new version eagerly imports heavy deps. Check bundle analyzer after upgrades.</p>

<h3>11. Memory leak from module scope</h3>
<pre><code class="language-ts">const cache = new Map();   // module-level — never GC'd
export function put(k, v) { cache.set(k, v); }
// Grows forever. Bound the size.</code></pre>

<h3>12. Listener double-firing after hot reload</h3>
<p>Fast Refresh preserves state; global listeners registered at module scope can accumulate. Register in useEffect.</p>

<h3>13. Large <code>console.log</code> in hot path</h3>
<p>Serialization + Metro forwarding costs. Strip console in release builds via Babel transform-remove-console.</p>

<h3>14. Nested ScrollViews</h3>
<p>Gesture conflicts, rendering costs. If you need horizontal within vertical: use horizontal FlatList with <code>nestedScrollEnabled</code> (Android). Generally avoid.</p>

<h3>15. Animated width / height / top / left</h3>
<p>These trigger layout (Yoga) per frame. Use transform (translateX/Y, scale) via Reanimated; it skips layout.</p>

<h3>16. StrictMode double-render cost in dev</h3>
<p>Dev StrictMode double-invokes to surface bugs. Prod is fine. Don't benchmark in dev.</p>

<h3>17. Bundle size from dependencies</h3>
<p>A small lib might ship huge internal polyfills. Use source-map-explorer. Example: moment is often 200KB+ — swap for date-fns or dayjs.</p>

<h3>18. Image memory not released</h3>
<p>expo-image has configurable memory cache; too large on low-end devices causes OOM. Tune <code>Image.getCachePolicyAsync()</code> or clear caches periodically.</p>

<h3>19. Animated list item remount kills state</h3>
<p>FlatList remounts scrolled-off items → local state lost. FlashList recycles → local state might remain but with wrong data if keys mismatch. Key carefully.</p>

<h3>20. iOS simulator performance is misleading</h3>
<p>Simulator uses Mac CPU — often faster than a real device. Always profile on a physical device (preferably a mid-range Android).</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — inline renderItem / onPress</h3>
<p>New function every render → children can't memoize. useCallback + React.memo.</p>

<h3>Anti-pattern 2 — ScrollView for 1000 items</h3>
<p>All children mount. Use FlashList or FlatList.</p>

<h3>Anti-pattern 3 — full-resolution images in a grid</h3>
<p>10 images × 5MB each = 50MB memory spike. Serve thumbnails; CDN resize.</p>

<h3>Anti-pattern 4 — heavy synchronous work in event handlers</h3>
<p>200ms of JSON parse in onPress = 200ms of frozen UI. Defer or worker.</p>

<h3>Anti-pattern 5 — never cleaning up listeners</h3>
<p>Subscriptions, timers, observers accumulate across mounts. Use useEffect cleanup.</p>

<h3>Anti-pattern 6 — over-memoization</h3>
<p>Wrapping every component in memo + every value in useMemo. Cost exceeds benefit for simple cases. Profile.</p>

<h3>Anti-pattern 7 — Old Animated API for complex animations</h3>
<p>Drops frames under load. Reanimated runs on UI thread.</p>

<h3>Anti-pattern 8 — AsyncStorage on every render</h3>
<p>Async reads for data used every render. MMKV is sub-millisecond and sync.</p>

<h3>Anti-pattern 9 — not using FlashList for social feeds</h3>
<p>Default FlatList fine for short lists but slower for scroll-heavy UIs. FlashList is a near drop-in win.</p>

<h3>Anti-pattern 10 — profiling with a JS debugger attached</h3>
<p>Remote JS debugging (removed in RN 0.79) ran JS in V8 (Chrome), not on-device Hermes — perf numbers were invalid. Even with React Native DevTools, detach the debugger for perf-sensitive measurements.</p>

<h3>Anti-pattern 11 — heavy work in useLayoutEffect</h3>
<p>Blocks paint. Reserve for measurements + sync writes; async work in useEffect.</p>

<h3>Anti-pattern 12 — shipping without Hermes</h3>
<p>Older projects forgot to enable. Free 30-50% startup win.</p>

<h3>Anti-pattern 13 — rendering off-screen lists eagerly</h3>
<p>Inactive tabs re-rendering + effects running on unmounted screens. Use <code>unmountOnBlur</code> where appropriate.</p>

<h3>Anti-pattern 14 — massive single Context</h3>
<p>Every change re-renders every consumer. Split by update frequency.</p>

<h3>Anti-pattern 15 — no perf budget / no CI</h3>
<p>App bloats over months; regression only noticed when user complains. Set startup + bundle budgets; fail PR if exceeded.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. An app feels janky during scroll. How do you debug?</div>
  <div class="qa-answer">
    <ol>
      <li>Open Dev Menu → Show Perf Monitor; note JS FPS vs UI FPS during scroll.</li>
      <li>If UI FPS drops: animations / layouts on UI thread are overloaded. Switch to Reanimated + transforms instead of layout props. Reduce native view count per row.</li>
      <li>If JS FPS drops: component re-renders or heavy JS work. Open React DevTools Profiler; find rows re-rendering unnecessarily.</li>
      <li>Fixes: memoize Row, wrap onPress in useCallback, switch to FlashList with cell recycling, use <code>scrollEventThrottle={16}</code>.</li>
      <li>Test on a physical mid-range Android — simulators/iPhones hide issues.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. FlatList vs FlashList — when to use which?</div>
  <div class="qa-answer">
    <p><strong>FlatList</strong>: built into RN, OK for &lt;100 items, unmounts off-screen.</p>
    <p><strong>FlashList (Shopify)</strong>: recycles native views. Huge wins on long lists, mixed item types, scroll-heavy UIs. FlashList v1 required <code>estimatedItemSize</code>; v2 (2025) removed it.</p>
    <p>Modern apps default to FlashList for long lists; FlatList for short.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you optimize app startup?</div>
  <div class="qa-answer">
    <ul>
      <li>Hermes — pre-compiled bytecode (default since 0.70; keep it on).</li>
      <li>New Architecture — lazy TurboModules, smaller init cost (default since 0.76).</li>
      <li><code>inlineRequires: true</code> in Metro.</li>
      <li>Lazy-import rarely-used screens / features.</li>
      <li>Reduce native deps at launch (link only what's needed).</li>
      <li>Profile with Instruments / Android Studio to find long cold-start tasks.</li>
      <li>Defer non-critical setup (analytics, remote config) via <code>InteractionManager.runAfterInteractions</code>.</li>
      <li>Use native splash screen (react-native-splash-screen or expo-splash-screen) to bridge the time visually.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Why does Reanimated keep animations smooth?</div>
  <div class="qa-answer">
    <p>Animations and gesture logic run in a second JS VM on the UI thread, connected via JSI-shared memory. Updates drive native view properties directly. If the JS thread is blocked (heavy render, long effect), the animation keeps running because it's not on that thread. Old Animated with useNativeDriver partially achieves this for transform/opacity but can't run arbitrary logic.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you prevent memory growth over a long session?</div>
  <div class="qa-answer">
    <ul>
      <li>Always unsubscribe listeners, clear timers, abort requests in useEffect cleanup.</li>
      <li>Avoid storing arbitrary refs to native views at module scope.</li>
      <li>Use virtualized lists — avoid keeping 1000s of items alive.</li>
      <li>Bound caches (query cache, image cache) with size limits.</li>
      <li>Take heap snapshots via React Native DevTools / Xcode; interact; compare snapshots to find growing object types.</li>
      <li>Mind retain cycles in native modules (common on iOS ObjC).</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What does the JS FPS vs UI FPS distinction tell you?</div>
  <div class="qa-answer">
    <p><strong>JS FPS</strong>: how fast the JS thread is processing frames. Drops when heavy compute runs there.</p>
    <p><strong>UI FPS</strong>: how fast native rendering is happening. Drops when too many DOM mutations or complex native layouts.</p>
    <p>Interpretation: low JS + high UI → JS thread bottleneck (optimize renders, offload work). Low UI + high JS → native-side issues (reduce view count, simplify layouts, check overdraw). Both low → terrible app overall; audit everything.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Implement a scroll-throttled handler that's smooth.</div>
  <div class="qa-answer">
<pre><code class="language-tsx">const scrollY = useSharedValue(0);
const handler = useAnimatedScrollHandler({
  onScroll: (e) =&gt; { scrollY.value = e.contentOffset.y; },  // runs on UI thread
});
&lt;Animated.ScrollView onScroll={handler} scrollEventThrottle={16}&gt; ... &lt;/Animated.ScrollView&gt;</code></pre>
    <p>ThrottleRate 16ms = 60Hz; 8ms for 120Hz. Handler's a worklet — no JS thread round-trip.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you analyze bundle size?</div>
  <div class="qa-answer">
<pre><code>npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output main.jsbundle --sourcemap-output main.jsbundle.map
npx source-map-explorer main.jsbundle main.jsbundle.map</code></pre>
    <p>Shows bytes per module. Usual findings: unused libraries, polyfills you don't need, accidental dev-only imports. Fix with tree-shaking (ES modules, sideEffects: false) and swapping heavy libs (moment → dayjs).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How does new arch improve perf?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Synchronous native calls</strong> via JSI — no JSON serialization, no async callback.</li>
      <li><strong>Lazy TurboModules</strong> — only load what's used → faster startup.</li>
      <li><strong>Fabric renderer</strong> — concurrent-aware, synchronous layout reads.</li>
      <li><strong>Bridgeless mode</strong> — eliminates the bridge entirely, reducing memory.</li>
      <li><strong>Concurrent React</strong> works — <code>startTransition</code> / Suspense, automatic batching.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you profile a specific screen?</div>
  <div class="qa-answer">
    <p>Wrap it in React's <code>&lt;Profiler&gt;</code>:</p>
<pre><code class="language-tsx">&lt;Profiler id="Home" onRender={(_, phase, actual, base) =&gt; {
  if (actual &gt; 16) console.warn('slow', phase, actual);
}}&gt;
  &lt;Home /&gt;
&lt;/Profiler&gt;</code></pre>
    <p>Combine with React Native DevTools' Profiler for flamegraphs. Instrument critical screens in production RUM for p95 measurements.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What's a common cause of dropped frames in an RN app?</div>
  <div class="qa-answer">
    <ul>
      <li>Heavy synchronous work on JS thread (JSON parse, big array sort) during scroll/animation.</li>
      <li>Unmemoized rows re-rendering on every scroll tick.</li>
      <li>Layout-triggering animations (animating width/height rather than transform).</li>
      <li>Too many native views per row (deep View nesting).</li>
      <li>Large image decoding on main thread.</li>
      <li>Debugger attached (V8 instead of Hermes, plus inspection overhead).</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. A heavy list filter locks the app when typing. Fix.</div>
  <div class="qa-answer">
    <ol>
      <li>Wrap filter in <code>startTransition</code> — typing stays responsive.</li>
      <li>Debounce the filter input 200ms to coalesce keystrokes.</li>
      <li>Memoize the filter result with <code>useMemo</code>.</li>
      <li>If filter itself is slow (complex regex on 10K items), move to a Web Worker or a native module.</li>
      <li>Use FlashList so the rendering of filtered results is fast.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you size images for mobile?</div>
  <div class="qa-answer">
    <ul>
      <li>Never send the full-resolution image for a thumbnail view.</li>
      <li>CDN with on-the-fly resize (Cloudinary, Imgix, Cloudflare Images).</li>
      <li>Serve WebP / AVIF when supported (smaller than JPEG).</li>
      <li>Use <code>Image.getSize</code> or srcset-like responsive sizing with <code>PixelRatio.get()</code>.</li>
      <li>Placeholder (blurhash, thumbhash) for instant feedback.</li>
      <li>expo-image manages disk + memory cache automatically.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Describe a perf budget you'd enforce.</div>
  <div class="qa-answer">
    <ul>
      <li>JS bundle &lt; 2 MB gzipped on first launch.</li>
      <li>Cold-start to first frame &lt; 2s on mid-range Android.</li>
      <li>Scroll FPS &gt; 58 (p95) on FlashList feed.</li>
      <li>Heap under 150 MB after 30 min session.</li>
      <li>Memory leak: no component instance count should grow on repeated navigate/unmount cycle.</li>
    </ul>
    <p>CI runs Detox + timing probes; PR blocks if any metric regresses.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. You've been told startup regressed 500ms. How do you isolate?</div>
  <div class="qa-answer">
    <ol>
      <li>Git bisect the last known good commit vs current.</li>
      <li>Check for new dependencies — <code>npm ls</code> or lockfile diff.</li>
      <li>Run source-map-explorer; compare bundle composition.</li>
      <li>Profile with Instruments / Android Studio; look at the startup trace.</li>
      <li>Common culprits: a library eagerly importing heavy deps, new SDK init code, new native module with slow setup.</li>
      <li>Fixes: lazy-load the library, defer init, remove the dep.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You know Hermes + New Architecture are defaults (0.70 / 0.76) and keep them on.</li>
    <li>You use FlashList + Reanimated + expo-image as defaults.</li>
    <li>You profile on physical Android mid-range devices.</li>
    <li>You distinguish JS thread jank from UI thread jank.</li>
    <li>You use <code>startTransition</code>, <code>InteractionManager</code>, workers for heavy work.</li>
    <li>You split bundles and lazy-load rare routes.</li>
    <li>You write a perf budget + CI check.</li>
    <li>You know memoization is not free — profile first.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. What are the common causes of unnecessary re-renders in RN, and how do you fix each?</div>
  <div class="qa-answer">
    <p>The usual culprits: inline <code>renderItem</code> / <code>onPress</code> functions, inline objects and inline style arrays passed as props — each is a new reference every render, so children can't memoize (fix: <code>useCallback</code> / <code>useMemo</code> / pre-declared constants plus <code>React.memo</code> on the child); unmemoized list rows re-rendering on every scroll tick (fix: memo the Row, or FlashList); one massive Context, where every change re-renders every consumer (fix: split contexts by update frequency, or use a selector-based store); and inactive tab screens re-rendering and running effects (fix: <code>lazy</code> / <code>unmountOnBlur</code>, <code>useFocusEffect</code>). Find them with the React DevTools Profiler rather than guessing.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q17. Contrast the JS thread, the UI thread and the shadow thread from a performance point of view.</div>
  <div class="qa-answer">
    <p>The <strong>JS thread</strong> runs React components, event handlers, network calls and any heavy JS; the <strong>UI thread</strong> owns the native views (UIView / android.view.View), native scrolling and touches, GPU composition and Reanimated worklets; the <strong>shadow thread</strong> runs Yoga layout, computing sizes alongside the UI thread. Blocking JS makes state updates lag while native scroll and gestures keep working; blocking the UI thread freezes everything visually; layout-heavy work (deep view trees, large text measurement, animating width/height) loads the layout side. The Perf Monitor tells you which: low JS FPS means fix renders or offload work, low UI FPS means reduce views and simplify layouts.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q18. How do Hermes and inline requires improve startup time?</div>
  <div class="qa-answer">
    <p>Startup is dominated by loading the JS VM and parsing/compiling the bundle, especially on low-end devices. <strong>Hermes</strong> pre-compiles JS to bytecode (<code>.hbc</code>) at build time, so the device loads bytecode instead of parsing source — roughly 30-50% faster startup, a smaller binary and a smaller heap; it has been the default since RN 0.70 (dev builds still use source for Fast Refresh). <strong>inlineRequires</strong>, set in <code>metro.config.js</code> under <code>transformer.getTransformOptions</code>, defers each <code>require()</code> until the module is first used, so large libraries don't execute eagerly at launch. Combine them with lazy-loading rare screens and deferring non-critical init via <code>InteractionManager.runAfterInteractions</code>.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q19. How do you spot a memoization mistake where useMemo or useCallback costs more than it saves?</div>
  <div class="qa-answer">
    <p>Memoization is not free: every <code>React.memo</code>, <code>useMemo</code> and <code>useCallback</code> adds a comparison of dependencies or props plus the stored value on every render. The two classic mistakes are wrapping cheap components and trivial values everywhere, where the comparison costs more than just re-rendering, and memoizing a child while still passing it an inline function, object or style array, so the memo check runs and fails every time. The tell is that the Profiler shows no reduction in renders or time after adding it. Profile first, memoize only the hot path you measured (e.g. list rows), and make sure the props you pass are actually stable.</p>
  </div>
</div>
` },

  ]
});
