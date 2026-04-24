window.PREP_SITE.registerTopic({
  id: 'rn-animations',
  module: 'React Native',
  title: 'Animations (Reanimated 3)',
  estimatedReadTime: '28 min',
  tags: ['react-native', 'animations', 'reanimated', 'worklets', 'gesture-handler', 'jsi', 'shared-values'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Reanimated 3</strong> is the production-grade animation library for React Native. It runs animations on the UI thread via <strong>worklets</strong> — JS functions serialized and executed in a second JS VM on the UI thread, communicating with the main JS thread via JSI-shared memory.</p>
<ul>
  <li><strong>Shared values</strong> (<code>useSharedValue</code>) — reactive primitives readable/writable from both threads.</li>
  <li><strong>Animated styles</strong> (<code>useAnimatedStyle</code>) — worklets that derive styles from shared values.</li>
  <li><strong>Timing / spring / decay</strong> (<code>withTiming</code>, <code>withSpring</code>, <code>withDecay</code>) — animation drivers.</li>
  <li><strong>Gesture Handler</strong> pairs with Reanimated for smooth gesture-driven animations on the UI thread.</li>
  <li><strong>Layout Animations</strong> (<code>Layout</code>, <code>FadeIn</code>, etc.) — automatic mount/unmount/position animations.</li>
  <li><strong>Moti</strong> (built on Reanimated) — declarative higher-level API for simple animations.</li>
  <li>Old built-in <strong>Animated</strong> API still works but can't run arbitrary worklets on UI thread.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Reanimated moves animations to the UI thread. JS thread can be busy, and your animations still hit 60-120fps. Master <code>useSharedValue</code>, <code>useAnimatedStyle</code>, and the <code>withTiming</code>/<code>withSpring</code> drivers — they cover 90% of animation needs.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why not the old Animated API?</h3>
<p>RN's built-in <code>Animated</code> library runs interpolation on the JS thread by default. Setting <code>useNativeDriver: true</code> lifts some properties (transform, opacity) to the UI thread, but only those properties; arbitrary logic isn't supported. Any animation driven by JS-thread state updates gets janky when JS is busy.</p>

<h3>What Reanimated solves</h3>
<p>Reanimated's <strong>worklets</strong> are JS functions that can be serialized and evaluated on the UI thread in a second JS VM. They can:</p>
<ul>
  <li>Read/write shared values synchronously.</li>
  <li>Compute derived values (animated styles).</li>
  <li>Run arbitrary logic — interpolations, branching, gesture handling.</li>
  <li>Call back to the JS thread when needed (<code>runOnJS</code>).</li>
</ul>
<p>Result: even if the JS thread is frozen by heavy work, animations and gestures stay at 60-120fps.</p>

<h3>How worklets work (high-level)</h3>
<ol>
  <li>Babel plugin transforms functions marked <code>'worklet'</code> (or wrapped in useAnimatedStyle / useDerivedValue / etc.) into serializable blobs.</li>
  <li>At runtime, the worklet is sent to the UI-thread JS VM via JSI.</li>
  <li>Shared values are JSI-accessible from both threads; writes trigger worklet re-evaluation.</li>
  <li>Worklet output drives native view properties without round-trip to JS thread.</li>
</ol>

<h3>Why shared values</h3>
<p>A <code>SharedValue&lt;T&gt;</code> is a mutable box whose contents are visible on both the JS and UI threads. Writes from either side propagate. It's the bridge for animation state.</p>
<pre><code class="language-ts">const x = useSharedValue(0);
x.value = 100;                        // mutation triggers re-eval of subscribers
const animStyle = useAnimatedStyle(() =&gt; ({ transform: [{ translateX: x.value }] }));</code></pre>

<h3>Why Gesture Handler pairs with Reanimated</h3>
<p><strong>react-native-gesture-handler</strong> processes gestures on the UI thread natively. Combined with Reanimated worklets, a drag/swipe interaction drives shared values on the UI thread → animated style updates on the UI thread → view moves, all without a JS-thread round trip. This is how "native-feeling" animations are built in RN.</p>

<h3>Why Layout Animations</h3>
<p>When a component mounts, unmounts, or moves due to layout change, you often want a transition. Reanimated 3 provides declarative primitives:</p>
<pre><code class="language-tsx">&lt;Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition.springify()} /&gt;</code></pre>
<p>No imperative state; the library handles measuring + animating.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "two JS VMs" picture</h3>
<div class="diagram">
<pre>
  JS Thread VM              UI Thread VM (worklet runtime)
  ────────────              ──────────────────────────────
  React components          Worklets
  Event handlers            Animated style functions
  API calls                 Gesture handlers
  Business logic            Animation drivers

           └────── SharedValue&lt;T&gt; (JSI-backed, both sides see it) ──────┘

  runOnUI(fn)   : schedule fn to run on UI thread
  runOnJS(fn)   : from a worklet, schedule fn on JS thread
</pre>
</div>

<h3>The "pipeline" picture</h3>
<div class="diagram">
<pre>
  Gesture (UI thread) ──► updates SharedValue
                                │
                                ▼
  useAnimatedStyle worklet re-runs on UI thread
                                │
                                ▼
  Native view props updated directly
                                │
                                ▼
  60-120fps render — no JS thread round-trip
</pre>
</div>

<h3>The "driver" picture</h3>
<pre><code class="language-ts">x.value = withTiming(100, { duration: 300, easing: Easing.inOut(Easing.cubic) });
x.value = withSpring(0, { damping: 10, stiffness: 100 });
x.value = withDecay({ velocity: 500 });
x.value = withRepeat(withTiming(100, { duration: 300 }), -1, true);
x.value = withSequence(withTiming(100), withTiming(0));
x.value = withDelay(500, withTiming(100));</code></pre>
<p>Drivers produce an animated value over time. Assigning to a shared value triggers the animation; each frame computes the next value on the UI thread.</p>

<h3>The "derived value" picture</h3>
<pre><code class="language-ts">const progress = useSharedValue(0);
const rotation = useDerivedValue(() =&gt; progress.value * 360);
const opacity = useDerivedValue(() =&gt; interpolate(progress.value, [0, 1], [0, 1]));
// Derived values re-compute automatically when dependencies change.</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Worklets are just functions." They're <em>serializable</em> closures with access to workletized values. You can't reference arbitrary React state from a worklet (it's a different VM). You can read shared values, derived values, and values captured at worklet creation time. For JS-side updates, use <code>runOnJS</code>.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Setup</h3>
<pre><code>npm install react-native-reanimated react-native-gesture-handler
// babel.config.js: add reanimated plugin LAST
module.exports = { plugins: [['react-native-reanimated/plugin']] };
// App root:
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
&lt;GestureHandlerRootView style={{ flex: 1 }}&gt;&lt;App /&gt;&lt;/GestureHandlerRootView&gt;</code></pre>

<h3>Basic animation</h3>
<pre><code class="language-tsx">import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function Box() {
  const offset = useSharedValue(0);
  const animStyle = useAnimatedStyle(() =&gt; ({
    transform: [{ translateX: offset.value }],
  }));
  return (
    &lt;&gt;
      &lt;Animated.View style={[styles.box, animStyle]} /&gt;
      &lt;Button title="Move" onPress={() =&gt; { offset.value = withSpring(offset.value + 50); }} /&gt;
    &lt;/&gt;
  );
}</code></pre>

<h3>Interpolate</h3>
<pre><code class="language-ts">import { interpolate, Extrapolation } from 'react-native-reanimated';

const scale = useDerivedValue(() =&gt; interpolate(
  scrollY.value,
  [0, 100],      // input range
  [1, 0.8],      // output range
  Extrapolation.CLAMP
));</code></pre>
<p>Interpolates input value through a piecewise linear mapping. CLAMP prevents values outside the range.</p>

<h3>Gestures + animations</h3>
<pre><code class="language-tsx">import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function DraggableBox() {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() =&gt; {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((e) =&gt; {
      x.value = startX.value + e.translationX;
      y.value = startY.value + e.translationY;
    })
    .onEnd(() =&gt; {
      x.value = withSpring(0);
      y.value = withSpring(0);
    });

  const style = useAnimatedStyle(() =&gt; ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.box, style]} /&gt;
    &lt;/GestureDetector&gt;
  );
}</code></pre>

<h3>Scroll-driven animations</h3>
<pre><code class="language-tsx">import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';

function ParallaxHeader() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) =&gt; { scrollY.value = e.contentOffset.y; }
  });

  const headerStyle = useAnimatedStyle(() =&gt; ({
    opacity: interpolate(scrollY.value, [0, 100], [1, 0], 'clamp'),
    transform: [{ translateY: interpolate(scrollY.value, [0, 100], [0, -50]) }],
  }));

  return (
    &lt;&gt;
      &lt;Animated.View style={[styles.header, headerStyle]} /&gt;
      &lt;Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}&gt;
        ...content...
      &lt;/Animated.ScrollView&gt;
    &lt;/&gt;
  );
}</code></pre>

<h3>runOnJS / runOnUI</h3>
<pre><code class="language-ts">const pan = Gesture.Pan()
  .onEnd((e) =&gt; {
    if (e.translationY &gt; 100) {
      runOnJS(navigation.goBack)();   // call JS-side function
    }
  });

// From JS side, push work to UI:
runOnUI(() =&gt; {
  'worklet';
  sharedValue.value = 100;
})();</code></pre>

<h3>Layout animations</h3>
<pre><code class="language-tsx">import Animated, { FadeIn, FadeOut, LinearTransition, SlideInRight } from 'react-native-reanimated';

&lt;Animated.View
  entering={FadeIn.duration(300)}
  exiting={FadeOut.duration(200)}
  layout={LinearTransition.springify()}
&gt;
  ...
&lt;/Animated.View&gt;

// List items
{items.map((it) =&gt; (
  &lt;Animated.View key={it.id} layout={LinearTransition} entering={SlideInRight}&gt;
    &lt;Item item={it} /&gt;
  &lt;/Animated.View&gt;
))}</code></pre>

<h3>Shared element transitions (v3+)</h3>
<pre><code class="language-tsx">// On source screen
&lt;Animated.View sharedTransitionTag="hero"&gt;
  &lt;Image source={img} /&gt;
&lt;/Animated.View&gt;

// On detail screen
&lt;Animated.View sharedTransitionTag="hero"&gt;
  &lt;Image source={img} /&gt;
&lt;/Animated.View&gt;
// Reanimated animates between the two positions on navigation.</code></pre>

<h3>Complex animations with useAnimatedReaction</h3>
<pre><code class="language-ts">useAnimatedReaction(
  () =&gt; scrollY.value,                   // derive
  (current, previous) =&gt; {               // react
    if (current &gt; 100 &amp;&amp; previous &lt;= 100) {
      runOnJS(onScrollPastThreshold)();
    }
  }
);</code></pre>

<h3>Easings</h3>
<pre><code class="language-ts">import { Easing } from 'react-native-reanimated';
withTiming(100, { duration: 300, easing: Easing.inOut(Easing.cubic) });
// Also: Easing.linear, Easing.ease, Easing.bounce, Easing.elastic(1), Easing.bezier(0.4, 0, 0.2, 1)</code></pre>

<h3>Moti (higher-level)</h3>
<pre><code class="language-tsx">import { MotiView } from 'moti';
&lt;MotiView
  from={{ opacity: 0, translateY: 20 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'spring', damping: 15 }}
/&gt;</code></pre>

<h3>Performance tips</h3>
<ul>
  <li>Keep worklets small — less work per frame.</li>
  <li>Avoid object allocations inside worklets.</li>
  <li>Use <code>scrollEventThrottle={16}</code> on ScrollView for 60Hz, <code>8</code> for 120Hz.</li>
  <li>Batch shared-value writes when possible.</li>
  <li>Avoid calling <code>runOnJS</code> on every frame — coalesce.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — fade in on mount</h3>
<pre><code class="language-tsx">const opacity = useSharedValue(0);
useEffect(() =&gt; { opacity.value = withTiming(1, { duration: 400 }); }, []);
const style = useAnimatedStyle(() =&gt; ({ opacity: opacity.value }));
return &lt;Animated.View style={[styles.box, style]} /&gt;;

// Or simpler with Layout Animation:
return &lt;Animated.View entering={FadeIn.duration(400)} style={styles.box} /&gt;;</code></pre>

<h3>Example 2 — button press scale</h3>
<pre><code class="language-tsx">function AnimatedButton({ onPress, children }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() =&gt; ({ transform: [{ scale: scale.value }] }));
  return (
    &lt;Animated.View style={[styles.btn, style]}&gt;
      &lt;Pressable
        onPressIn={() =&gt; { scale.value = withSpring(0.95); }}
        onPressOut={() =&gt; { scale.value = withSpring(1); }}
        onPress={onPress}
      &gt;{children}&lt;/Pressable&gt;
    &lt;/Animated.View&gt;
  );
}</code></pre>

<h3>Example 3 — swipe-to-delete</h3>
<pre><code class="language-tsx">function SwipeRow({ onDelete, children }) {
  const x = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate((e) =&gt; { x.value = Math.min(0, e.translationX); })
    .onEnd(() =&gt; {
      if (x.value &lt; -120) {
        x.value = withTiming(-400, { duration: 200 }, () =&gt; runOnJS(onDelete)());
      } else {
        x.value = withSpring(0);
      }
    });
  const style = useAnimatedStyle(() =&gt; ({ transform: [{ translateX: x.value }] }));
  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={style}&gt;{children}&lt;/Animated.View&gt;
    &lt;/GestureDetector&gt;
  );
}</code></pre>

<h3>Example 4 — bottom sheet</h3>
<pre><code class="language-tsx">function BottomSheet({ children }) {
  const y = useSharedValue(500);
  const open = () =&gt; { y.value = withSpring(0); };
  const close = () =&gt; { y.value = withSpring(500); };
  const pan = Gesture.Pan()
    .onUpdate((e) =&gt; { y.value = Math.max(0, e.translationY); })
    .onEnd((e) =&gt; {
      if (e.velocityY &gt; 500 || y.value &gt; 200) close();
      else y.value = withSpring(0);
    });
  const style = useAnimatedStyle(() =&gt; ({ transform: [{ translateY: y.value }] }));
  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.sheet, style]}&gt;
        {children}
      &lt;/Animated.View&gt;
    &lt;/GestureDetector&gt;
  );
}</code></pre>

<h3>Example 5 — list item animations</h3>
<pre><code class="language-tsx">{items.map((it) =&gt; (
  &lt;Animated.View
    key={it.id}
    entering={SlideInLeft.springify()}
    exiting={SlideOutRight}
    layout={LinearTransition}
  &gt;
    &lt;Row item={it} /&gt;
  &lt;/Animated.View&gt;
))}
// Adding / removing / reordering animates automatically.</code></pre>

<h3>Example 6 — parallax scroll header</h3>
<pre><code class="language-tsx">const scrollY = useSharedValue(0);
const onScroll = useAnimatedScrollHandler({
  onScroll: (e) =&gt; { scrollY.value = e.contentOffset.y; }
});
const heroStyle = useAnimatedStyle(() =&gt; ({
  height: interpolate(scrollY.value, [0, 200], [300, 100], 'clamp'),
  opacity: interpolate(scrollY.value, [0, 200], [1, 0.6], 'clamp'),
}));
return (
  &lt;&gt;
    &lt;Animated.View style={[styles.hero, heroStyle]} /&gt;
    &lt;Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}&gt; ... &lt;/Animated.ScrollView&gt;
  &lt;/&gt;
);</code></pre>

<h3>Example 7 — Moti simple entrance</h3>
<pre><code class="language-tsx">&lt;MotiView
  from={{ opacity: 0, translateY: 20 }}
  animate={{ opacity: 1, translateY: 0 }}
  exit={{ opacity: 0 }}
  transition={{ type: 'timing', duration: 300 }}
&gt;
  &lt;Text&gt;Hello&lt;/Text&gt;
&lt;/MotiView&gt;</code></pre>

<h3>Example 8 — pinch-to-zoom image</h3>
<pre><code class="language-tsx">const scale = useSharedValue(1);
const savedScale = useSharedValue(1);
const pinch = Gesture.Pinch()
  .onUpdate((e) =&gt; { scale.value = savedScale.value * e.scale; })
  .onEnd(() =&gt; {
    if (scale.value &lt; 1) scale.value = withSpring(1);
    savedScale.value = scale.value;
  });
const style = useAnimatedStyle(() =&gt; ({ transform: [{ scale: scale.value }] }));</code></pre>

<h3>Example 9 — shake animation</h3>
<pre><code class="language-tsx">const x = useSharedValue(0);
function shake() {
  x.value = withSequence(
    withTiming(-10, { duration: 50 }),
    withRepeat(withTiming(10, { duration: 100 }), 4, true),
    withTiming(0, { duration: 50 })
  );
}</code></pre>

<h3>Example 10 — staggered entrance</h3>
<pre><code class="language-tsx">{items.map((it, i) =&gt; (
  &lt;Animated.View
    key={it.id}
    entering={FadeInUp.delay(i * 50)}
  &gt;
    &lt;Card item={it} /&gt;
  &lt;/Animated.View&gt;
))}</code></pre>

<h3>Example 11 — spring chain</h3>
<pre><code class="language-ts">offset.value = withSequence(
  withSpring(100),
  withSpring(50),
  withSpring(0),
);</code></pre>

<h3>Example 12 — decay</h3>
<pre><code class="language-tsx">const y = useSharedValue(0);
const pan = Gesture.Pan()
  .onUpdate((e) =&gt; { y.value = e.translationY; })
  .onEnd((e) =&gt; {
    y.value = withDecay({ velocity: e.velocityY, clamp: [-200, 200] });
  });</code></pre>

<h3>Example 13 — pulse loop</h3>
<pre><code class="language-ts">scale.value = withRepeat(
  withSequence(withTiming(1.1, { duration: 300 }), withTiming(1, { duration: 300 })),
  -1,   // infinite
  false // don't reverse
);</code></pre>

<h3>Example 14 — card flip</h3>
<pre><code class="language-tsx">const flipped = useSharedValue(0);
const frontStyle = useAnimatedStyle(() =&gt; ({
  transform: [{ perspective: 1000 }, { rotateY: \`\${flipped.value * 180}deg\` }],
  opacity: interpolate(flipped.value, [0, 0.5, 1], [1, 0, 0]),
}));
const backStyle = useAnimatedStyle(() =&gt; ({
  transform: [{ perspective: 1000 }, { rotateY: \`\${180 + flipped.value * 180}deg\` }],
  opacity: interpolate(flipped.value, [0, 0.5, 1], [0, 0, 1]),
}));
const flip = () =&gt; { flipped.value = withTiming(flipped.value ? 0 : 1, { duration: 600 }); };</code></pre>

<h3>Example 15 — progress bar with interpolateColor</h3>
<pre><code class="language-tsx">import { interpolateColor } from 'react-native-reanimated';
const progress = useSharedValue(0);
const barStyle = useAnimatedStyle(() =&gt; ({
  width: \`\${progress.value * 100}%\`,
  backgroundColor: interpolateColor(progress.value, [0, 0.5, 1], ['#f87171', '#fbbf24', '#10b981']),
}));
useEffect(() =&gt; { progress.value = withTiming(1, { duration: 2000 }); }, []);</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Forgetting the 'worklet' directive</h3>
<p>Inline functions inside <code>useAnimatedStyle</code>, <code>useDerivedValue</code>, etc. are automatically workletized by the Babel plugin. But a standalone function needs <code>'worklet'</code> as the first statement to run on UI thread:</p>
<pre><code class="language-ts">function clamp(v: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, v));
}</code></pre>

<h3>2. Accessing React state in a worklet</h3>
<p>Worklets run in a different VM — they can't read React state directly. Capture values at creation time (useAnimatedStyle closure), use shared values, or read props explicitly in the worklet body.</p>

<h3>3. runOnJS doesn't return a Promise</h3>
<p><code>runOnJS(fn)(arg)</code> returns void; to get a return value, use a shared value or a ref that JS populates.</p>

<h3>4. Gesture handler setup missing</h3>
<p>If gestures don't fire, check that the root of your app is wrapped in <code>&lt;GestureHandlerRootView&gt;</code>. Also <code>import 'react-native-gesture-handler'</code> at the entry file.</p>

<h3>5. Babel plugin order matters</h3>
<p><code>react-native-reanimated/plugin</code> must be the LAST plugin in babel.config.js. Otherwise worklets may not transform correctly.</p>

<h3>6. interpolate with out-of-range values</h3>
<p>Default extrapolates linearly beyond input range. For clamping:</p>
<pre><code class="language-ts">interpolate(x, [0, 100], [0, 1], Extrapolation.CLAMP);
// or: interpolate(x, [0, 100], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'identity' });</code></pre>

<h3>7. Layout animations and FlatList</h3>
<p>Layout animations on FlatList items can conflict with virtualization. Use FlashList or handle carefully; sometimes it's better to disable layout animations for list items and use entering/exiting only.</p>

<h3>8. Shared element transitions require React Navigation 7 / native stack</h3>
<p>Shared transitions integrate with screens; may not work in all navigator types. Check Reanimated + Navigation version compatibility.</p>

<h3>9. Worklets serialize closures</h3>
<p>Captured values must be serializable or shared values. Classes, functions from outside, large objects → failure.</p>

<h3>10. withSpring tweaking</h3>
<p><code>damping</code> (higher = less bouncy), <code>stiffness</code> (higher = faster), <code>mass</code>. Defaults often look sluggish; tune per design.</p>

<h3>11. Reanimated 2 → 3 migration</h3>
<p>API is mostly compatible; new features (layout animations, shared transitions) added. Check the changelog when upgrading.</p>

<h3>12. Hermes compatibility</h3>
<p>Reanimated 3 works on Hermes out of the box. Older versions required additional config. Ensure RN + Reanimated versions are compatible.</p>

<h3>13. Debugging worklets</h3>
<p><code>console.log</code> inside worklets works but is less ergonomic than JS-side logging. Pull the value out and log from the JS side.</p>

<h3>14. Scroll event throttle on Android</h3>
<p>Set <code>scrollEventThrottle={16}</code> (or <code>8</code> for 120Hz). On iOS the default already fires every frame; Android historically needed explicit.</p>

<h3>15. Animating non-transform properties</h3>
<p>Animating <code>width</code>, <code>height</code>, <code>margin</code> works but triggers layout — more expensive than transform. Prefer transform where possible.</p>

<h3>16. Shared value not re-rendering React</h3>
<p>Setting <code>sharedValue.value</code> does NOT re-render React. It only updates worklets that reference it. If you need React state too, use <code>useAnimatedReaction</code> + <code>runOnJS(setState)</code>, or dual-write (but incurs a cost).</p>

<h3>17. React.memo children with shared values</h3>
<p>If you pass a shared value as a prop to a memoized child, reference stability is preserved (same object). Inner components subscribing to <code>.value</code> still update on the UI thread.</p>

<h3>18. Gesture conflict with parent ScrollView</h3>
<p>A <code>Pan</code> gesture inside a ScrollView fights the scroll. Use <code>.simultaneousWithExternalGesture()</code>, <code>.requireExternalGestureToFail()</code>, or <code>Gesture.Simultaneous()</code> composition.</p>

<h3>19. Animations during screen transitions</h3>
<p>If an animation starts while the screen is being pushed/popped, frames may drop. Delay animations until after the transition:</p>
<pre><code class="language-tsx">useEffect(() =&gt; {
  InteractionManager.runAfterInteractions(() =&gt; { x.value = withSpring(100); });
}, []);</code></pre>

<h3>20. Shared value initial value reads before mount</h3>
<p>Calling <code>sharedValue.value</code> outside worklet and before mount reads synchronously — fine, but if the value hasn't been set on UI thread yet, you may get the initial.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — animating layout properties via JS state</h3>
<pre><code class="language-tsx">const [w, setW] = useState(100);
// every frame: setW(...) → re-render → layout → repaint</code></pre>
<p>Switches to Reanimated with <code>useSharedValue</code> + transform.</p>

<h3>Anti-pattern 2 — subscribing to shared values with React state</h3>
<pre><code class="language-tsx">const x = useSharedValue(0);
const [mirror, setMirror] = useState(0);
useAnimatedReaction(() =&gt; x.value, (v) =&gt; runOnJS(setMirror)(v));</code></pre>
<p>Fires setState every frame. Expensive. Only do this if you actually need React render coupled to the animation.</p>

<h3>Anti-pattern 3 — over-complex worklets</h3>
<p>Heavy computation inside useAnimatedStyle runs every frame on UI thread. Pre-compute constants outside; keep the worklet minimal.</p>

<h3>Anti-pattern 4 — object allocation inside worklets</h3>
<p>Creating <code>{ transform: [{ translateX: x.value }] }</code> every frame allocates. Mostly fine, but for hot paths with arrays of transforms, reuse stable shapes.</p>

<h3>Anti-pattern 5 — gesture without gesture-handler</h3>
<p>Using RN's built-in <code>PanResponder</code> instead of gesture-handler gives JS-thread gesture processing — janky. Use gesture-handler.</p>

<h3>Anti-pattern 6 — ignoring layout animations</h3>
<p>Manually animating mount/unmount with state flags when Reanimated's <code>entering</code>/<code>exiting</code>/<code>layout</code> does it declaratively.</p>

<h3>Anti-pattern 7 — scrollEventThrottle too low</h3>
<p>Omitting it or setting too high means scroll animations feel choppy. <code>16</code> (60Hz) or lower for 120Hz devices.</p>

<h3>Anti-pattern 8 — unnecessary runOnJS</h3>
<p>Every runOnJS has a cost. Only use when you genuinely need to touch JS (setState, navigation, network). Inline worklet math is cheap.</p>

<h3>Anti-pattern 9 — ignoring the old Animated when migrating</h3>
<p>Mixing old <code>Animated</code> and Reanimated on the same view causes conflicts. Pick one per screen.</p>

<h3>Anti-pattern 10 — huge animated list with unmemoed items</h3>
<p>Layout animations on every item of a 10K-row list chokes. Use FlashList + selective entering animations.</p>

<h3>Anti-pattern 11 — not testing on low-end Android</h3>
<p>High-end iPhones hide perf issues. Test on budget Android; Reanimated helps but device differences still surface.</p>

<h3>Anti-pattern 12 — forgetting to reset shared values on unmount</h3>
<p>Rare but: shared values created outside the component scope persist across mounts. If stored in context / store, be sure to reset.</p>

<h3>Anti-pattern 13 — hand-rolling physics</h3>
<p><code>withSpring</code> and <code>withDecay</code> are tuned primitives. Rolling your own spring via timing + math usually looks worse.</p>

<h3>Anti-pattern 14 — animating color via transform</h3>
<p>Color isn't a transform. Use <code>interpolateColor</code>:</p>
<pre><code class="language-ts">backgroundColor: interpolateColor(p.value, [0, 1], ['#fff', '#000'])</code></pre>

<h3>Anti-pattern 15 — massive useAnimatedScrollHandler</h3>
<p>The handler runs every scroll event — on UI thread. Keep it simple; computations pull into <code>useDerivedValue</code>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Why do we need Reanimated over the built-in Animated API?</div>
  <div class="qa-answer">
    <p>The built-in Animated runs interpolation on the JS thread by default. With <code>useNativeDriver: true</code> it lifts transform and opacity to the UI thread but can't run arbitrary JS logic there. Reanimated introduces <strong>worklets</strong> — JS functions that run in a second JS VM on the UI thread, with shared JSI-backed memory. You can animate anything, react to gestures on the UI thread, and maintain 60-120fps even when the JS thread is busy.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What's a worklet?</div>
  <div class="qa-answer">
    <p>A JS function designated to run on the UI thread rather than the main JS thread. Marked with the <code>'worklet'</code> directive (or wrapped in <code>useAnimatedStyle</code>, <code>useDerivedValue</code>, etc.). The Babel plugin serializes workletized code; at runtime, Reanimated loads it into a separate JS VM tied to the UI thread, with access to shared values via JSI. Worklets can call back to JS via <code>runOnJS</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What's useSharedValue?</div>
  <div class="qa-answer">
    <p>A reactive "box" whose contents are mutable and visible on both JS and UI threads. Writing <code>sv.value = 10</code> triggers recomputation of any worklet that depends on it. Backed by JSI for cross-thread access. The primary means of communicating animation state. Does NOT trigger React re-renders — that's intentional; re-renders would defeat the "animation runs on UI thread" goal.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Implement a button that scales on press.</div>
  <div class="qa-answer">
<pre><code class="language-tsx">const scale = useSharedValue(1);
const style = useAnimatedStyle(() =&gt; ({ transform: [{ scale: scale.value }] }));
&lt;Pressable
  onPressIn={() =&gt; { scale.value = withSpring(0.95); }}
  onPressOut={() =&gt; { scale.value = withSpring(1); }}
&gt;
  &lt;Animated.View style={[styles.btn, style]}&gt;
    &lt;Text&gt;Tap&lt;/Text&gt;
  &lt;/Animated.View&gt;
&lt;/Pressable&gt;</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do gestures integrate with animations?</div>
  <div class="qa-answer">
    <p><code>react-native-gesture-handler</code> processes touches on the UI thread natively. Gesture handlers are declared with <code>Gesture.Pan()</code>, <code>Pinch()</code>, etc. Their callbacks are worklets that update shared values directly — no JS round-trip. Combined with Reanimated's animated styles, the whole gesture→animation pipeline runs on the UI thread at 60-120fps.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Build a swipe-to-delete row.</div>
  <div class="qa-answer">
<pre><code class="language-tsx">const x = useSharedValue(0);
const pan = Gesture.Pan()
  .onUpdate((e) =&gt; { x.value = Math.min(0, e.translationX); })
  .onEnd(() =&gt; {
    if (x.value &lt; -120) {
      x.value = withTiming(-400, { duration: 200 }, () =&gt; runOnJS(onDelete)());
    } else {
      x.value = withSpring(0);
    }
  });
const style = useAnimatedStyle(() =&gt; ({ transform: [{ translateX: x.value }] }));
&lt;GestureDetector gesture={pan}&gt;
  &lt;Animated.View style={style}&gt;{children}&lt;/Animated.View&gt;
&lt;/GestureDetector&gt;</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What's withTiming vs withSpring vs withDecay?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>withTiming</strong>: time-based interpolation with an easing function. Predictable duration.</li>
      <li><strong>withSpring</strong>: physics-based — damping, stiffness, mass, initial velocity. Organic feel. Duration emergent.</li>
      <li><strong>withDecay</strong>: exponential slowdown from initial velocity. Used for "flings" after gesture release.</li>
    </ul>
    <p>Combine with <code>withSequence</code>, <code>withRepeat</code>, <code>withDelay</code> for complex choreographies.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do layout animations work?</div>
  <div class="qa-answer">
    <p>Reanimated intercepts layout changes on Animated.View. When a component mounts, unmounts, or changes position, Reanimated uses the <code>entering</code>, <code>exiting</code>, and <code>layout</code> props to compute a smooth transition. Built-in presets (FadeIn, SlideInRight, LinearTransition) cover common cases. Use cases: list item add/remove, reorder, route transitions, menu expand.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Explain runOnJS and runOnUI.</div>
  <div class="qa-answer">
    <p><code>runOnJS(fn)(args)</code>: from inside a worklet (UI thread), schedule a function to run on the JS thread. Use for calling setState, navigation, network, any non-worklet JS.</p>
    <p><code>runOnUI(fn)()</code>: from the JS thread, schedule a worklet to run on the UI thread. Useful for imperatively setting shared values from event handlers.</p>
    <p>Neither is free — they involve cross-thread messaging. Avoid per-frame usage.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you avoid stuttering animations?</div>
  <div class="qa-answer">
    <ol>
      <li>Run animations on the UI thread (Reanimated worklets).</li>
      <li>Use transform/opacity over layout properties.</li>
      <li>Memoize heavy components below animated views.</li>
      <li>Set <code>scrollEventThrottle={16}</code> on animated ScrollViews.</li>
      <li>Avoid <code>runOnJS</code> in hot paths.</li>
      <li>Offload heavy work via <code>InteractionManager.runAfterInteractions</code>.</li>
      <li>Keep the JS thread reasonably unbusy — long tasks can still affect gesture-less animations slightly (state changes trigger re-renders).</li>
      <li>Test on low-end devices.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What's useDerivedValue for?</div>
  <div class="qa-answer">
    <p>A shared-value whose value is <em>computed</em> from other shared values via a worklet. Auto-updates when dependencies change. Useful to decouple logic — e.g., <code>const rotation = useDerivedValue(() =&gt; progress.value * 360)</code>. Keeps animated styles simple and lets you compose transformations.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What's shared element transition?</div>
  <div class="qa-answer">
    <p>When navigating between screens, a visual element (like a hero image) animates from its position on the source screen to its position on the destination. Reanimated 3 implements this via <code>sharedTransitionTag="..."</code> on elements with the same tag on both screens — library measures source and destination, animates the transition automatically. Requires compatible navigation (React Navigation v7 native stack).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Implement a parallax scroll header.</div>
  <div class="qa-answer">
<pre><code class="language-tsx">const scrollY = useSharedValue(0);
const onScroll = useAnimatedScrollHandler({ onScroll: (e) =&gt; { scrollY.value = e.contentOffset.y; } });
const hero = useAnimatedStyle(() =&gt; ({
  transform: [{ translateY: interpolate(scrollY.value, [0, 200], [0, -100], 'clamp') }],
  opacity: interpolate(scrollY.value, [0, 200], [1, 0], 'clamp'),
}));
return (
  &lt;&gt;
    &lt;Animated.View style={[styles.hero, hero]} /&gt;
    &lt;Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}&gt; ... &lt;/Animated.ScrollView&gt;
  &lt;/&gt;
);</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. When should I use Moti vs Reanimated directly?</div>
  <div class="qa-answer">
    <p>Moti is a declarative wrapper on top of Reanimated. Use Moti for simple one-off animations (fade in, move, scale) where the declarative API is cleaner. Drop to raw Reanimated when you need custom worklets, gesture-driven animations, complex choreographies, or scroll integration. Both coexist in the same app.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Implement a pinch-to-zoom on an image.</div>
  <div class="qa-answer">
<pre><code class="language-tsx">const scale = useSharedValue(1);
const saved = useSharedValue(1);
const pinch = Gesture.Pinch()
  .onUpdate((e) =&gt; { scale.value = Math.max(0.5, Math.min(4, saved.value * e.scale)); })
  .onEnd(() =&gt; { saved.value = scale.value; if (scale.value &lt; 1) scale.value = withSpring(1); });
const style = useAnimatedStyle(() =&gt; ({ transform: [{ scale: scale.value }] }));
&lt;GestureDetector gesture={pinch}&gt;
  &lt;Animated.Image source={{uri}} style={[styles.img, style]} /&gt;
&lt;/GestureDetector&gt;</code></pre>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You explain worklets as "JS running on the UI thread via a second JS VM."</li>
    <li>You use useSharedValue + useAnimatedStyle + withSpring/withTiming.</li>
    <li>You pair Reanimated with gesture-handler for UI-thread gestures.</li>
    <li>You use layout animations (entering/exiting/layout) for list items.</li>
    <li>You call out runOnJS/runOnUI semantics.</li>
    <li>You prefer transform/opacity for 60fps.</li>
    <li>You know Moti for simple cases.</li>
    <li>You validate on low-end Android.</li>
  </ul>
</div>
`}

]
});
