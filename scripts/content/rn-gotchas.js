window.PREP_SITE.registerTopic({
  id: 'rn-gotchas',
  module: 'React Native',
  title: 'Common Gotchas',
  estimatedReadTime: '24 min',
  tags: ['react-native', 'gotchas', 'platform-differences', 'keyboard', 'safe-area', 'text', 'scrollview', 'pitfalls'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>A curated catalog of the problems every RN developer eventually hits. Most are cross-platform differences, API quirks, or subtle behaviors that aren't documented prominently.</p>
<ul>
  <li><strong>Text rendering</strong> — strings must be in <code>&lt;Text&gt;</code>; only Text inherits font styles.</li>
  <li><strong>Flexbox defaults</strong> — <code>flexDirection: 'column'</code>, <code>alignItems: 'stretch'</code>. Different from web.</li>
  <li><strong>Keyboard handling</strong> — Android push-vs-resize, iOS notch interactions, <code>KeyboardAvoidingView</code> is flaky.</li>
  <li><strong>Safe area</strong> — use <code>react-native-safe-area-context</code>; built-in SafeAreaView is iOS-focused.</li>
  <li><strong>Shadows</strong> — iOS <code>shadow*</code> vs Android <code>elevation</code>; requires non-transparent background on Android.</li>
  <li><strong>ScrollView vs FlatList</strong> — ScrollView mounts all children; don't use for long lists.</li>
  <li><strong>Image dimensions</strong> — no auto-sizing; always specify.</li>
  <li><strong>Animations</strong> — <code>width</code>/<code>height</code> trigger layout; use <code>transform</code>.</li>
  <li><strong>AsyncStorage</strong> is slow; MMKV is the modern default.</li>
  <li><strong>Platform-specific behavior</strong> — touch feedback, status bar, back button, permissions, keyboard, system fonts.</li>
  <li><strong>Hermes vs JSC differences</strong> — usually safe, occasionally bite on edge cases (regex, Intl).</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Most RN bugs are not bugs — they're cross-platform differences your JS code didn't handle. Learn the pitfalls early, or they'll surface at the worst time (production on a device you don't have).</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'text-gotchas', title: '📝 Text Gotchas', html: `
<h3>1. Strings must be inside &lt;Text&gt;</h3>
<pre><code class="language-tsx">// BAD — crashes
&lt;View&gt;Hello&lt;/View&gt;

// GOOD
&lt;View&gt;&lt;Text&gt;Hello&lt;/Text&gt;&lt;/View&gt;</code></pre>

<h3>2. Nested Text for inline styling</h3>
<pre><code class="language-tsx">&lt;Text style={{ fontSize: 16 }}&gt;
  Welcome, &lt;Text style={{ fontWeight: 'bold' }}&gt;{name}&lt;/Text&gt;!
&lt;/Text&gt;
// Outer font propagates; inner overrides.</code></pre>

<h3>3. Only Text inherits</h3>
<p>Setting <code>color: 'red'</code> on a <code>&lt;View&gt;</code> does nothing to children. Only font styles within Text cascade to Text children. Nothing else inherits.</p>

<h3>4. numberOfLines behavior differs on platforms</h3>
<p>iOS and Android sometimes truncate differently for the same content. Use <code>ellipsizeMode</code> ('head', 'middle', 'tail', 'clip') to control.</p>

<h3>5. includeFontPadding on Android</h3>
<p>Android adds internal font padding, causing text to appear higher than expected. For precise vertical centering:</p>
<pre><code class="language-tsx">&lt;Text style={{ includeFontPadding: false, textAlignVertical: 'center' }}&gt;</code></pre>

<h3>6. fontFamily mismatch</h3>
<p>The fontFamily name must match exactly the PostScript name on iOS and the file name on Android. A font file named "Inter-Regular.ttf" might register as "Inter-Regular" on iOS and "Inter_Regular" on Android. Use <code>Platform.select</code> or normalize.</p>

<h3>7. Accessibility font scaling</h3>
<p>Users can increase system font size 200-300%. Default RN Text respects it. If your layout assumes fixed size, text overflows. Either design with flex for variable sizes or cap with <code>maxFontSizeMultiplier</code> or disable <code>allowFontScaling</code>.</p>

<h3>8. textAlign and RTL</h3>
<p><code>textAlign: 'left'</code> stays left even in RTL locales. Use <code>textAlign: 'auto'</code> to respect reading direction, or logical properties like <code>textAlign: 'start'</code>.</p>

<h3>9. selectable on iOS vs Android</h3>
<p><code>selectable</code> lets users copy text. iOS shows a magnifier / copy menu. Android behavior varies by version.</p>

<h3>10. Inline image in Text is iOS-only historically</h3>
<p><code>&lt;Text&gt;&lt;Image/&gt;&lt;/Text&gt;</code> renders inline on iOS. On Android it shows as a block (may wrap onto next line). Test both.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'layout-gotchas', title: '📐 Layout Gotchas', html: `
<h3>1. flexDirection defaults to column</h3>
<p>Web developers trip on this first. Every horizontal layout needs <code>flexDirection: 'row'</code>.</p>

<h3>2. alignItems stretches by default</h3>
<p>Children of a flex row/column stretch in the cross axis unless you set <code>alignItems</code>. Surprising when you want auto-width content.</p>

<h3>3. Percentage needs a parent with dimensions</h3>
<pre><code class="language-tsx">// Parent must have a defined size (flex: 1, height, or content-based)
&lt;View style={{ flex: 1 }}&gt;
  &lt;View style={{ height: '50%' }} /&gt; {/* works */}
&lt;/View&gt;</code></pre>

<h3>4. No CSS Grid</h3>
<p>Only Flexbox. Build grids with <code>flexDirection: 'row'</code> + <code>flexWrap: 'wrap'</code> + percentage widths.</p>

<h3>5. Negative margins behave oddly</h3>
<p>Work but can clip at overflow boundaries. Prefer transforms or adjust padding on adjacent elements.</p>

<h3>6. absoluteFill vs full coverage</h3>
<p><code>StyleSheet.absoluteFill</code> is shorthand for <code>position: 'absolute'; top: 0; left: 0; right: 0; bottom: 0</code>. Use for overlays.</p>

<h3>7. z-index issues on Android</h3>
<p>Android uses <code>elevation</code> for z-order. Raising <code>elevation</code> also adds shadow. If you just want z-order without shadow, use <code>elevation</code> with <code>shadowColor: 'transparent'</code> or use absolute positioning.</p>

<h3>8. Overflow clipping inconsistency</h3>
<p>iOS clips children to rounded corners by default; Android often doesn't unless you set <code>overflow: 'hidden'</code>.</p>

<h3>9. gap support</h3>
<p><code>gap</code> / <code>rowGap</code> / <code>columnGap</code> supported in RN 0.71+. Older versions need margin hacks on children.</p>

<h3>10. aspectRatio for responsive images</h3>
<pre><code class="language-tsx">&lt;Image style={{ width: '100%', aspectRatio: 16/9 }} /&gt;
// Height derived from width × ratio — no layout shift.</code></pre>

<h3>11. Absolute inside ScrollView</h3>
<p>An absolutely-positioned child doesn't scroll — it's positioned relative to the scroll container, not the content. Put it inside a wrapper View that does scroll, or outside the ScrollView entirely.</p>

<h3>12. Yoga vs web Flexbox edge cases</h3>
<p>Yoga implements a subset of Flexbox. <code>flex: auto</code> and some legacy values differ. Usually not a problem; if you're porting a complex web layout, expect tweaks.</p>

<h3>13. Text layout alignment</h3>
<p>Baseline alignment works differently across iOS and Android. Small visual differences in a row of mixed text + icons.</p>

<h3>14. onLayout timing</h3>
<p><code>onLayout</code> fires after layout is computed — on mount and on any change. Don't rely on it for a "first render complete" signal; use a ref + <code>useLayoutEffect</code>.</p>

<h3>15. Dimensions vs useWindowDimensions</h3>
<p><code>Dimensions.get('window')</code> is static at read time — doesn't update on rotation. <code>useWindowDimensions()</code> is reactive. Prefer the hook.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'keyboard-gotchas', title: '⌨️ Keyboard Gotchas', html: `
<h3>1. KeyboardAvoidingView behavior differs per platform</h3>
<pre><code class="language-tsx">&lt;KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={64}
/&gt;</code></pre>
<p>iOS usually wants <code>padding</code>; Android varies. Flaky with ScrollView + nested views.</p>

<h3>2. react-native-keyboard-controller is more reliable</h3>
<p>Newer library with consistent cross-platform behavior, animated keyboard tracking, toolbar above the keyboard. Most modern apps prefer it.</p>

<h3>3. keyboardShouldPersistTaps</h3>
<p>ScrollView / FlatList default: tapping outside input dismisses keyboard AND doesn't register the tap on the child. Set <code>keyboardShouldPersistTaps="handled"</code> to let taps on children work.</p>

<h3>4. Keyboard height varies</h3>
<p>Different on language keyboards (CJK IMEs are taller), with suggestion bar, in landscape. Listen to <code>keyboardDidShow</code> / <code>keyboardDidHide</code> events for actual heights.</p>

<h3>5. Software vs hardware keyboard</h3>
<p>External keyboards on iPad don't trigger the same events. Always test with both.</p>

<h3>6. Android resize vs pan</h3>
<p><code>android:windowSoftInputMode="adjustResize"</code> (default): the content area shrinks when keyboard appears. <code>adjustPan</code>: content stays same size, focused input scrolls into view. Behavior of KeyboardAvoidingView depends on this setting.</p>

<h3>7. Keyboard dismiss on scroll</h3>
<p><code>keyboardDismissMode="on-drag"</code> on ScrollView — keyboard dismisses as user scrolls. Common UX.</p>

<h3>8. TextInput autocomplete</h3>
<p>Autocomplete behavior differs: iOS autofill rich (credit cards, contacts); Android Autofill Framework. Set <code>autoComplete</code>, <code>textContentType</code>, <code>importantForAutofill</code> accordingly.</p>

<h3>9. Focus flow</h3>
<pre><code class="language-tsx">const pwRef = useRef&lt;TextInput&gt;(null);
&lt;TextInput returnKeyType="next" onSubmitEditing={() =&gt; pwRef.current?.focus()} /&gt;
&lt;TextInput ref={pwRef} returnKeyType="go" onSubmitEditing={submit} /&gt;</code></pre>

<h3>10. Keyboard hides input on Android (small screens)</h3>
<p>Default autoscroll doesn't always work. Explicit scroll with <code>scrollToInput</code> on focus.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'platform-gotchas', title: '📱 Platform Gotchas', html: `
<h3>1. Status bar manipulation</h3>
<pre><code class="language-tsx">&lt;StatusBar barStyle="dark-content" backgroundColor="#fff" /&gt;
// backgroundColor only on Android.
// barStyle: 'default' | 'light-content' | 'dark-content'
// translucent prop on Android to overlap under status bar.</code></pre>

<h3>2. Hardware back button (Android)</h3>
<p>iOS has no hardware back. On Android, <code>BackHandler</code> fires on back button press. React Navigation handles default behavior; intercept with <code>useEffect</code> + <code>BackHandler.addEventListener</code>.</p>

<h3>3. Ripple feedback on Android</h3>
<p>Android design language expects a ripple on tap. Pressable's <code>android_ripple</code> prop provides it:</p>
<pre><code class="language-tsx">&lt;Pressable android_ripple={{ color: '#0003', borderless: false }} /&gt;</code></pre>

<h3>4. iOS swipe-back gesture</h3>
<p>Native Stack Navigator enables iOS swipe-from-edge-to-go-back by default. Conflict with horizontal scroll at the edge — adjust <code>gestureResponseDistance</code>.</p>

<h3>5. Modal presentation differs</h3>
<p>iOS native modals cover status bar; Android don't by default. Use <code>statusBarTranslucent</code> on Modal for Android.</p>

<h3>6. Safe area handling</h3>
<pre><code class="language-tsx">// react-native-safe-area-context (recommended)
const insets = useSafeAreaInsets();
&lt;View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} /&gt;

// Built-in SafeAreaView is iOS-focused and doesn't cover Android fully.</code></pre>

<h3>7. System fonts</h3>
<p>iOS: San Francisco. Android: Roboto. Sizes and metrics differ. If you want a unified look, ship a custom font.</p>

<h3>8. Font weights</h3>
<p>On Android, font weights (300, 400, 500, 600) render only if the font file ships those weight variants. iOS maps closer weights. Shipping Inter: include Inter-Light, Inter-Regular, Inter-Medium, Inter-Bold.</p>

<h3>9. Permissions model</h3>
<ul>
  <li>iOS: install-time entitlements in Info.plist; runtime prompt first use.</li>
  <li>Android 6+: runtime permission requests for dangerous permissions.</li>
  <li>Android 13+: split media permissions (READ_MEDIA_IMAGES, etc.).</li>
  <li>iOS 14+: Photo Library Limited access state.</li>
</ul>

<h3>10. App lifecycle</h3>
<p>AppState on iOS has states: active, inactive (multitasking view, phone call), background. Android has: active, background. "Inactive" is iOS-only transition.</p>

<h3>11. File system paths</h3>
<p>iOS: <code>documentDirectory</code> (backed up to iCloud), <code>cacheDirectory</code> (purgeable). Android: app-private similar but no iCloud; <code>externalCacheDirectory</code> is readable by other apps.</p>

<h3>12. Push notification delivery</h3>
<p>iOS: APNs. Android: FCM. Tokens differ in format and lifecycle. Silent pushes work differently (background fetch window on iOS; restrictions on Android battery optimization).</p>

<h3>13. Network security</h3>
<p>iOS: ATS blocks HTTP by default; configure exceptions in Info.plist. Android: HTTPS required for API 28+ unless explicitly allowed.</p>

<h3>14. Dark mode</h3>
<p>Both platforms support system dark mode; <code>useColorScheme</code> hook. Default images / assets don't adapt; provide light/dark variants in <code>.colorassets</code> (iOS) or <code>values-night</code> (Android) or swap in JS.</p>

<h3>15. App icon / launch screen</h3>
<p>iOS: Xcode asset catalog for icons; LaunchScreen.storyboard for splash. Android: <code>mipmap/</code> for icons; <code>res/drawable/splash.xml</code> for splash. Tools like <code>@expo/image-utils</code> generate both automatically.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'list-image-gotchas', title: '📃 List & Image Gotchas', html: `
<h3>1. ScrollView mounts all children</h3>
<p>1000 items in a ScrollView = 1000 mounted components. Use FlatList / FlashList.</p>

<h3>2. FlatList key extractor</h3>
<p>Always provide a stable <code>keyExtractor</code>. Default uses index — breaks virtualization when items move.</p>

<h3>3. Inline renderItem</h3>
<pre><code class="language-tsx">// BAD — new function each render; Row can't memo
&lt;FlatList renderItem={({ item }) =&gt; &lt;Row data={item} /&gt;} /&gt;

// GOOD
const renderItem = useCallback(({ item }) =&gt; &lt;Row data={item} /&gt;, []);</code></pre>

<h3>4. getItemLayout with dynamic heights</h3>
<p>Breaks. Only use for fixed-size rows. Skip otherwise.</p>

<h3>5. FlashList requires estimatedItemSize</h3>
<p>Missing it means FlashList can't pre-allocate cells. Mandatory prop.</p>

<h3>6. FlatList unmounts off-screen; FlashList recycles</h3>
<p>FlatList: scrolled-off items lose local state (useState). FlashList: recycles cells — local state may persist across items. Design accordingly.</p>

<h3>7. Image without dimensions = zero size</h3>
<p>Unlike HTML <code>&lt;img&gt;</code>, RN Image needs width and height. Use <code>aspectRatio</code> + one dimension, or explicit sizes.</p>

<h3>8. Built-in Image lacks features</h3>
<p>No placeholder, no priority, limited caching. Use <code>expo-image</code> or <code>react-native-fast-image</code> in production.</p>

<h3>9. Network images blocked on iOS without ATS exception</h3>
<p>HTTP URLs blocked; HTTPS required unless you allow arbitrary loads in Info.plist (not recommended).</p>

<h3>10. Image resize modes</h3>
<ul>
  <li><code>cover</code>: fill, crop overflow.</li>
  <li><code>contain</code>: fit within bounds, letterbox.</li>
  <li><code>stretch</code>: distort to fit.</li>
  <li><code>repeat</code>: iOS only.</li>
  <li><code>center</code>: original size, centered.</li>
</ul>

<h3>11. Blur / shadow on Image on Android</h3>
<p>Limited. iOS has <code>blurRadius</code>; Android's implementation is slower or absent in some RN versions. Test.</p>

<h3>12. SVG rendering</h3>
<p>Not built in. Use <code>react-native-svg</code> for SVG. For icon libraries, most use <code>react-native-svg</code> under the hood.</p>

<h3>13. Image cache not bounded by default</h3>
<p>Can fill device storage. Expo Image has configurable cache policy + size limits; clear programmatically when needed.</p>

<h3>14. Image decoding on main thread</h3>
<p>Large images decoded synchronously on the main thread cause jank. Use <code>decoding="async"</code> on expo-image; fast-image handles async decode by default.</p>

<h3>15. FlatList onEndReached fires repeatedly</h3>
<p>If data doesn't grow, it triggers on every bounce. Guard with <code>isLoading</code> flag:</p>
<pre><code class="language-tsx">onEndReached={() =&gt; { if (!isFetching &amp;&amp; hasMore) fetchMore(); }}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'animation-gotchas', title: '🎬 Animation & Gesture Gotchas', html: `
<h3>1. Animating layout properties</h3>
<p><code>width</code>, <code>height</code>, <code>top</code>, <code>left</code>, <code>margin</code> trigger layout (Yoga) each frame. Use <code>transform: [{ translateX }]</code> for movement, <code>scale</code> for size changes.</p>

<h3>2. Animated API vs Reanimated</h3>
<p>Old Animated runs interpolation on JS thread by default; only <code>useNativeDriver: true</code> lifts transform/opacity to UI thread. Reanimated's worklets run arbitrary logic on the UI thread.</p>

<h3>3. useNativeDriver limits</h3>
<p>Only works on non-layout properties: <code>transform</code>, <code>opacity</code>, <code>shadowOpacity</code>. Doesn't work on <code>width</code>, <code>left</code>, etc.</p>

<h3>4. Gesture conflicts in ScrollView</h3>
<p>A Pan gesture inside a ScrollView fights the scroll. Use <code>simultaneousWithExternalGesture()</code>, <code>requireExternalGestureToFail()</code>, or <code>Gesture.Simultaneous()</code> composition.</p>

<h3>5. Reanimated worklet must declare directive</h3>
<pre><code class="language-ts">function clamp(v, min, max) {
  'worklet';
  return Math.min(max, Math.max(min, v));
}</code></pre>

<h3>6. Worklet can't reference React state</h3>
<p>Worklets run in a different VM. Use shared values for cross-thread state. runOnJS to call React-side functions.</p>

<h3>7. Animations during navigation</h3>
<p>Animations starting simultaneously with a screen transition drop frames. Wait:</p>
<pre><code class="language-ts">InteractionManager.runAfterInteractions(() =&gt; {
  x.value = withSpring(100);
});</code></pre>

<h3>8. scrollEventThrottle=16 required</h3>
<p>For smooth scroll-driven animations. Default throttle varies by platform; explicit 16 (or 8 for 120Hz) is safest.</p>

<h3>9. Gesture Handler root missing</h3>
<p>If gestures don't fire, check that <code>&lt;GestureHandlerRootView&gt;</code> wraps the app. Common missed setup.</p>

<h3>10. Babel plugin order for Reanimated</h3>
<p><code>react-native-reanimated/plugin</code> must be LAST in babel.config.js. Otherwise worklets fail to transform.</p>

<h3>11. Layout animations on FlatList</h3>
<p>Can conflict with virtualization. Keep layout animations on top-level items; consider switching to FlashList.</p>

<h3>12. iOS spring defaults feel sluggish</h3>
<p>Default <code>withSpring</code> params are conservative. Tune <code>damping</code>, <code>stiffness</code>, <code>mass</code> for responsive feel.</p>

<h3>13. runOnJS cost</h3>
<p>Every call to <code>runOnJS</code> hops to the JS thread. Don't call per frame — coalesce.</p>

<h3>14. Animated component must be Animated.View / Animated.Image / Animated.createAnimatedComponent</h3>
<pre><code class="language-tsx">// Plain View can't animate
&lt;View style={style} /&gt;  // style is a worklet-backed object — doesn't apply

// Must use Animated.View
&lt;Animated.View style={style} /&gt;</code></pre>

<h3>15. Shared element transitions require native stack</h3>
<p>Shared transitions integrate with <code>@react-navigation/native-stack</code>; not supported on JS stack. Check compatibility.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'state-storage-gotchas', title: '💾 State & Storage Gotchas', html: `
<h3>1. setState with object — full replace</h3>
<pre><code class="language-tsx">const [user, setUser] = useState({ name: '', age: 0 });
setUser({ name: 'Ada' });  // age is now undefined — no merge
setUser((u) =&gt; ({ ...u, name: 'Ada' }));  // correct</code></pre>

<h3>2. useState with expensive initializer</h3>
<pre><code class="language-tsx">// BAD — runs every render
const [data, setData] = useState(expensiveInit());

// GOOD — runs once
const [data, setData] = useState(() =&gt; expensiveInit());</code></pre>

<h3>3. Zustand persist schema change</h3>
<p>App update adds a field to store — persisted version lacks it. Use <code>version</code> + <code>migrate</code>:</p>
<pre><code class="language-ts">persist((set) =&gt; ({ ... }), {
  name: 'store',
  version: 2,
  migrate: (state, from) =&gt; from &lt; 2 ? { ...state, newField: [] } : state,
})</code></pre>

<h3>4. AsyncStorage slowness</h3>
<p>~1-5ms per op over the bridge. Reading auth token on every render = visible lag. Migrate to MMKV (JSI, sync, sub-ms).</p>

<h3>5. MMKV requires native rebuild</h3>
<p>Add the pod / link; run <code>pod install</code>; rebuild. Can't install via Fast Refresh.</p>

<h3>6. AsyncStorage size limit on Android</h3>
<p>6MB default. Increase via gradle property or switch to MMKV.</p>

<h3>7. TanStack Query cache persists across logouts</h3>
<p>Next user might see previous user's data. Call <code>qc.clear()</code> on logout.</p>

<h3>8. useEffect deps with objects</h3>
<pre><code class="language-ts">useEffect(() =&gt; { fetchIt(filters); }, [filters]);
// If filters is created anew every render, effect fires every render.
// Stabilize with useMemo, or depend on primitives: [filters.category, filters.sort]</code></pre>

<h3>9. Stale closure in setInterval</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  setInterval(() =&gt; console.log(count), 1000);
}, []);
// Logs initial count forever. Fix: include count in deps (restart interval on change)
// or use a ref for the latest value.</code></pre>

<h3>10. Listeners registered module-level</h3>
<p>Register in useEffect with cleanup. Module-level listeners accumulate across hot reloads.</p>

<h3>11. Persisted state after app reinstall</h3>
<p>MMKV / AsyncStorage files are wiped on app uninstall on both iOS and Android. For data that should survive, use a cloud sync.</p>

<h3>12. SecureStore vs MMKV</h3>
<p>SecureStore: OS keychain / keystore, hardware-backed, slow, small-size-best. MMKV: fast, general-purpose, plain file (encryption opt-in). For tokens: SecureStore.</p>

<h3>13. Redux-persist on old RN</h3>
<p>Historically used AsyncStorage. Migrate to MMKV backend for faster rehydration.</p>

<h3>14. useEffect runs twice in StrictMode dev</h3>
<p>React 18 dev: mount → unmount → mount. Cleanup must properly undo setup (unsubscribe listeners, abort requests). Production runs once.</p>

<h3>15. React Query focus refetch on app resume</h3>
<p>Wire <code>focusManager</code> to AppState so TanStack Query refetches when app comes to foreground. Most teams forget.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'runtime-gotchas', title: '🏃 Runtime & Build Gotchas', html: `
<h3>1. Hermes vs JSC differences</h3>
<p>Mostly compatible, but: regex edge cases, <code>Intl</code> not included by default in Hermes, <code>eval</code> behavior, some older iterator patterns. Test release on Hermes.</p>

<h3>2. __DEV__ = true in tests and development</h3>
<p>Dev-only code paths run in tests. Either mock / stub or check <code>process.env.NODE_ENV</code>.</p>

<h3>3. console.log in production</h3>
<p>Still executes unless stripped. Each log costs parse + serialization. Use Babel <code>transform-remove-console</code> in release.</p>

<h3>4. Metro cache issues</h3>
<p>After complex changes, Metro might serve stale bundles. Reset:</p>
<pre><code>npx react-native start --reset-cache
watchman watch-del-all
rm -rf $TMPDIR/metro-*</code></pre>

<h3>5. CocoaPods install forgotten</h3>
<p>After adding a native dependency: <code>cd ios &amp;&amp; pod install</code>. Otherwise native module not found.</p>

<h3>6. Gradle sync forgotten (Android)</h3>
<p>After adding a native library: Android Studio syncs automatically, or run <code>./gradlew --refresh-dependencies</code>.</p>

<h3>7. Autolinking failure</h3>
<p>A library fails to link. Check <code>npx react-native config</code> lists it. For custom local modules, may need explicit <code>react-native.config.js</code>.</p>

<h3>8. iOS build error: "module not found"</h3>
<p>After pod install, clean build: Xcode → Product → Clean Build Folder (Cmd+Shift+K), then rebuild.</p>

<h3>9. Android build error: "duplicate class"</h3>
<p>Library version conflicts in gradle. Force a version:</p>
<pre><code>configurations.all {
  resolutionStrategy { force 'com.google.code.gson:gson:2.10' }
}</code></pre>

<h3>10. Android versionCode must increase</h3>
<p>Play Store rejects upload with same or lower versionCode. Auto-bump via CI script or EAS.</p>

<h3>11. iOS build number must increase</h3>
<p>CFBundleVersion. App Store Connect rejects otherwise. Also auto-bump.</p>

<h3>12. Keystore lost</h3>
<p>Can't update Android app. Back up to password manager + team vault. Migrate to Play App Signing to let Google hold the signing key.</p>

<h3>13. React Native upgrade pain</h3>
<p>Major version upgrades (0.70 → 0.74, etc.) touch native projects. Use <code>npx react-native upgrade</code> + manual diffs. Test thoroughly.</p>

<h3>14. Fast Refresh loses state</h3>
<p>Full reload (after non-component file change) resets state. Dev tool, not production concern.</p>

<h3>15. Release build behaves differently</h3>
<p>Minification, Hermes bytecode, proguard, no LogBox. Test release builds on simulator + device before shipping.</p>

<h3>16. Native module not available on new arch</h3>
<p>Library hasn't migrated to TurboModule. Check its compatibility status; may need to fork or wait.</p>

<h3>17. Privacy manifest (iOS 17+)</h3>
<p>Required from 2024. Missing or incomplete causes warnings / rejection. Include in <code>ios/PrivacyInfo.xcprivacy</code>.</p>

<h3>18. TargetSdkVersion Play Store annual requirement</h3>
<p>Play increases required targetSdk each year. Missing deadline blocks new uploads. Update annually.</p>

<h3>19. Simulator vs device</h3>
<p>Camera, biometrics, push, performance, some gestures differ. Always smoke-test release on a physical device.</p>

<h3>20. Expo Go limitations</h3>
<p>Expo Go doesn't include arbitrary native modules. If your app needs custom native, use Expo Dev Client (custom build) instead.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'top-30', title: '🏆 The Top 30', html: `
<p>If you remember nothing else from this topic, these 30 catch 90% of new-developer bugs.</p>
<ol>
  <li>Wrap strings in <code>&lt;Text&gt;</code>.</li>
  <li><code>flexDirection: 'column'</code> default.</li>
  <li>Use <code>useWindowDimensions</code>, not <code>Dimensions.get</code>.</li>
  <li>Prefer FlashList for long lists.</li>
  <li>Memoize <code>renderItem</code> + <code>keyExtractor</code>.</li>
  <li>Provide <code>width</code>/<code>height</code>/<code>aspectRatio</code> on images.</li>
  <li>Use expo-image or fast-image, not built-in Image.</li>
  <li>Use Pressable, not Touchable*.</li>
  <li>Use <code>react-native-safe-area-context</code>.</li>
  <li>Animate <code>transform</code>/<code>opacity</code>, not layout.</li>
  <li>Use Reanimated worklets, not old Animated for complex animations.</li>
  <li>Put <code>react-native-reanimated/plugin</code> LAST in babel config.</li>
  <li>Wrap app in <code>&lt;GestureHandlerRootView&gt;</code>.</li>
  <li>Use MMKV, not AsyncStorage, for frequently-accessed data.</li>
  <li>Use <code>expo-secure-store</code> for tokens.</li>
  <li>Set <code>keyboardShouldPersistTaps="handled"</code> on ScrollView with inputs.</li>
  <li>Handle all permission states (granted / denied / blocked / limited).</li>
  <li>Request permissions contextually with rationale.</li>
  <li>Include Info.plist usage descriptions for every iOS permission.</li>
  <li>Test on physical mid-range Android — not just simulators.</li>
  <li>Enable Hermes.</li>
  <li>Enable New Architecture (Fabric + TurboModules).</li>
  <li>Install Sentry on day 1; upload source maps.</li>
  <li>Handle the cold-start deep-link case for notifications.</li>
  <li>Unsubscribe listeners, clear timers, abort requests in useEffect cleanup.</li>
  <li>Use <code>startTransition</code> for heavy state updates.</li>
  <li>Use <code>InteractionManager.runAfterInteractions</code> for work after transitions.</li>
  <li>Back up your Android keystore; enable Play App Signing.</li>
  <li>Increment versionCode / CFBundleVersion on every upload.</li>
  <li>Staged rollout on Play + phased release on App Store.</li>
</ol>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Name five common RN mistakes you've seen.</div>
  <div class="qa-answer">
    <ol>
      <li>ScrollView with 1000 items — needs FlatList / FlashList.</li>
      <li>Unmemoized renderItem + index as key — virtualization broken.</li>
      <li>AsyncStorage for frequently-read data — slow on bridge.</li>
      <li>Animating layout properties (width / height) — causes jank.</li>
      <li>Ignoring safe area — content under notch.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why does <code>&lt;View&gt;Hello&lt;/View&gt;</code> fail?</div>
  <div class="qa-answer">
    <p>RN requires text to be rendered inside a <code>&lt;Text&gt;</code> component. View has no text-rendering logic; Text scopes font, color, line height. Putting a string in View throws "Text strings must be rendered within a &lt;Text&gt; component."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What's the difference between iOS and Android shadows?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>iOS</strong>: <code>shadowColor</code>, <code>shadowOffset</code>, <code>shadowOpacity</code>, <code>shadowRadius</code> on any view.</li>
      <li><strong>Android</strong>: <code>elevation</code> (material-style). Requires non-transparent backgroundColor. Elevation also affects z-order.</li>
    </ul>
    <p>For cross-platform shadows, set all six. For more control, libraries like <code>react-native-shadow-2</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Why do my animations drop frames?</div>
  <div class="qa-answer">
    <ul>
      <li>Animating layout properties (width, height, top) triggers layout each frame. Use transform.</li>
      <li>Running on JS thread while heavy work is there. Move to UI thread via Reanimated worklets.</li>
      <li>Too many native views per row. Simplify.</li>
      <li>Large image decoding. Use expo-image with async decode.</li>
      <li>Debugger attached. Detach for perf-sensitive testing.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you handle the keyboard on Android?</div>
  <div class="qa-answer">
    <p>Options in order of reliability:</p>
    <ol>
      <li><code>react-native-keyboard-controller</code> — modern, consistent.</li>
      <li><code>KeyboardAvoidingView</code> with <code>behavior='height'</code> + set <code>android:windowSoftInputMode</code> to <code>adjustResize</code>.</li>
      <li>Manual: listen to <code>keyboardDidShow</code>/<code>Hide</code> events, compute insets, update layout.</li>
    </ol>
    <p>Always set <code>keyboardShouldPersistTaps="handled"</code> on ScrollView with inputs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Why is my Image a zero-size dot?</div>
  <div class="qa-answer">
    <p>Unlike HTML img, RN Image has no intrinsic size until dimensions are specified. Options:</p>
    <ul>
      <li>Explicit <code>width</code> and <code>height</code>.</li>
      <li><code>width</code> + <code>aspectRatio</code> (or <code>height</code> + aspectRatio).</li>
      <li>For known assets: <code>resolveAssetSource</code> returns width/height.</li>
      <li>For network: <code>Image.getSize(uri, w=&gt;{}, err=&gt;{})</code>.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. FlatList vs FlashList — why pick FlashList?</div>
  <div class="qa-answer">
    <p>FlashList recycles native views (like UITableView / RecyclerView). Benefits: fewer view creations, better memory, item state optionally preserved across scroll. FlatList unmounts off-screen items. For long or scroll-heavy lists, FlashList is a near-drop-in win. Requires <code>estimatedItemSize</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Your app crashes on Android but not iOS. First checks?</div>
  <div class="qa-answer">
    <ol>
      <li><code>adb logcat</code> for the FATAL EXCEPTION stack.</li>
      <li>Common Android-specific: permission missing in AndroidManifest, minSdkVersion mismatch, gradle dependency conflict, ProGuard eating a class.</li>
      <li>Check if a library is iOS-only or needs Android-specific setup.</li>
      <li>Clean + rebuild Android project.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Why use react-native-safe-area-context over SafeAreaView?</div>
  <div class="qa-answer">
    <p>Built-in SafeAreaView is iOS-focused (respects the notch + home indicator on iOS only). <code>react-native-safe-area-context</code> provides <code>useSafeAreaInsets</code> hook + SafeAreaProvider that works correctly on both iOS and Android, handles all the edge cases (status bar translucency, display cutouts on various Android devices).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Why should I not use plain Image in production?</div>
  <div class="qa-answer">
    <p>Built-in Image lacks: caching with size limits, placeholder / blurhash, loading priority, progressive loading, some format support. <code>expo-image</code> and <code>react-native-fast-image</code> are drop-in replacements with these features. Performance and UX noticeably improve.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Why does setState not merge objects like class setState did?</div>
  <div class="qa-answer">
    <p>Function component's <code>setState</code> replaces entirely. Class component's <code>this.setState</code> merged top-level fields. Different APIs. Spread manually:</p>
<pre><code class="language-tsx">setUser((u) =&gt; ({ ...u, name: 'Ada' }));</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Why is my useEffect running every render?</div>
  <div class="qa-answer">
    <p>Dependency is a new object each render. If you pass <code>useEffect(..., [options])</code> and <code>options</code> is created in the render body, it's a new reference every time. Fix: <code>useMemo</code> the options, or depend on primitives (<code>options.id</code>, <code>options.mode</code>) instead of the whole object.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Why does my animation freeze while scrolling?</div>
  <div class="qa-answer">
    <p>Scrolling keeps the JS thread busy (rendering items, handler callbacks). If your animation runs on the JS thread, it stalls. Solution: Reanimated worklets that run on the UI thread — animation continues smoothly regardless of JS load.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Dev works, release crashes on launch. How to debug?</div>
  <div class="qa-answer">
    <ol>
      <li>Build a local Release config (<code>npm run ios --configuration Release</code>).</li>
      <li>Attach Xcode / Android Studio debugger to see native logs.</li>
      <li>Common causes: ProGuard removed a class; dev dependency referenced in prod; missing Info.plist key; missing permission; Hermes-incompatible code.</li>
      <li>Check Metro-stripped debug logs; some dev-only imports may have leaked.</li>
      <li>Verify Sentry init doesn't crash (DSN present? Network available?).</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Give a one-line summary of the top 5 RN perf wins.</div>
  <div class="qa-answer">
    <ol>
      <li>FlashList for long lists.</li>
      <li>Reanimated for animations.</li>
      <li>expo-image with caching + placeholders.</li>
      <li>MMKV instead of AsyncStorage.</li>
      <li>Hermes + New Architecture enabled.</li>
    </ol>
    <p>Plus: memoize hot paths, profile before optimizing, test on mid-range Android.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You know Text rules (string-in-Text, nested styling, inheritance).</li>
    <li>You handle platform differences via Platform.select or .ios/.android files.</li>
    <li>You use FlashList + Reanimated + expo-image + MMKV as modern defaults.</li>
    <li>You handle safe area via <code>react-native-safe-area-context</code>.</li>
    <li>You test keyboard with react-native-keyboard-controller.</li>
    <li>You request permissions contextually with rationale.</li>
    <li>You test on physical devices, not just simulators.</li>
    <li>You enable Hermes + New Arch from day 1.</li>
    <li>You have Sentry + symbols uploaded.</li>
    <li>You cleanup listeners, timers, and requests in useEffect.</li>
  </ul>
</div>
`}

]
});
