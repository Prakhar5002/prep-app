window.PREP_SITE.registerTopic({
  id: 'mux-gestures',
  module: 'mobile-ux',
  title: 'Mobile Gestures',
  estimatedReadTime: '45 min',
  tags: ['gestures', 'touch', 'pointer', 'react-native-gesture-handler', 'reanimated', 'pan', 'pinch', 'swipe', 'long-press', 'haptics'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Mobile gestures are how users actually interact with phones — taps, swipes, pinches, long-presses, drags, edge-pulls. Get them right and the app feels alive; get them wrong and users uninstall. For React Native, this almost always means <strong>react-native-gesture-handler (RNGH)</strong> + <strong>Reanimated worklets</strong> running on the UI thread, not the legacy JS-thread <code>PanResponder</code>.</p>
<ul>
  <li><strong>Native gestures users expect:</strong> tap, double-tap, long-press, pan, pinch, rotate, fling/swipe, edge-swipe-back, pull-to-refresh, swipe-to-action.</li>
  <li><strong>Why RNGH:</strong> recognises gestures on the native UI thread; handles the responder system, gesture composition (simultaneous, exclusive, sequential), and back-pressure.</li>
  <li><strong>Why Reanimated:</strong> drives gesture-linked animation on the UI thread (60–120 fps), bypassing the JS thread entirely. Worklets run native.</li>
  <li><strong>Composition:</strong> <code>Gesture.Race()</code> picks one, <code>Gesture.Simultaneous()</code> runs both, <code>Gesture.Exclusive()</code> prefers in order.</li>
  <li><strong>Touch budget:</strong> tap target 44pt (iOS) / 48dp (Android); drag threshold ~10pt; long-press threshold 500ms; swipe velocity threshold ~300dp/s.</li>
  <li><strong>Haptic + sound:</strong> haptic on commit / threshold cross — never per-frame; sound only with explicit user expectation.</li>
  <li><strong>Don't fight the system:</strong> edge-swipe-back, pull-to-refresh, status-bar-tap-to-top, two-finger pan, three-finger swipe-up are reserved.</li>
</ul>
<p><strong>Mantra:</strong> "Recognise on the native thread. Animate on the UI thread. Compose deliberately. Respect system gestures."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "gesture" means in mobile</h3>
<p>A <strong>gesture</strong> is a recognised pattern of touch events (or pointer events on iPad / mouse / pen) that the system or your app interprets as a discrete intent. The OS ships gesture recognisers (UIPanGestureRecognizer on iOS, GestureDetector on Android); apps add their own on top, often through React Native bindings.</p>

<h3>Why gestures matter more than tap handlers</h3>
<table>
  <thead><tr><th>Reason</th><th>Outcome</th></tr></thead>
  <tbody>
    <tr><td>Direct manipulation</td><td>"Drag the card" feels different from "tap to move it." Users connect with content viscerally.</td></tr>
    <tr><td>Information density</td><td>Gestures multiply the actions on a small screen — swipe-left to archive, swipe-right to flag, long-press for menu.</td></tr>
    <tr><td>Speed</td><td>One gesture replaces multiple taps. Power users live in gestures.</td></tr>
    <tr><td>Native feel</td><td>Apps without gestures feel like web pages on a touch screen.</td></tr>
    <tr><td>Discoverability with reveal</td><td>Edge swipe + ripple feedback hint at what's possible.</td></tr>
  </tbody>
</table>

<h3>Why React Native makes this challenging</h3>
<ul>
  <li>RN's legacy <code>PanResponder</code> runs on the JS thread — touch frame goes JS bridge → native render. Drops frames easily.</li>
  <li>Cross-platform gestures must respect both iOS and Android system gesture conventions.</li>
  <li>Touch events must coordinate with native scroll views, modals, and other RN children.</li>
  <li>Gesture composition (which one wins?) is non-trivial; PanResponder gives you no real tools.</li>
  <li>Reanimated worklets + RNGH solve all of this but introduce concepts (worklet, shared value, animated style) that take time to learn.</li>
</ul>

<h3>The two-thread problem</h3>
<table>
  <thead><tr><th>Thread</th><th>Runs</th><th>Frame budget</th></tr></thead>
  <tbody>
    <tr><td>JS thread</td><td>Your React code, business logic, fetch handlers</td><td>~16ms (60 fps)</td></tr>
    <tr><td>UI thread (native)</td><td>Layout, paint, native gesture recognisers, Reanimated worklets</td><td>~16ms (60 fps); ~8ms (120 fps)</td></tr>
  </tbody>
</table>
<p>Pre-RNGH / Reanimated: gesture event → bridge → JS handler → bridge → animation. Each hop ~2–8ms. With Reanimated worklets, the gesture stays entirely on the UI thread; JS only sees the final result.</p>

<h3>The gesture taxonomy</h3>
<table>
  <thead><tr><th>Gesture</th><th>What it does</th><th>RNGH name</th></tr></thead>
  <tbody>
    <tr><td>Tap</td><td>Quick down + up at one point</td><td><code>Gesture.Tap()</code></td></tr>
    <tr><td>Long press</td><td>Hold for ≥ 500ms</td><td><code>Gesture.LongPress()</code></td></tr>
    <tr><td>Pan</td><td>Drag a finger</td><td><code>Gesture.Pan()</code></td></tr>
    <tr><td>Pinch</td><td>Two fingers expand / contract</td><td><code>Gesture.Pinch()</code></td></tr>
    <tr><td>Rotate</td><td>Two fingers rotate around midpoint</td><td><code>Gesture.Rotation()</code></td></tr>
    <tr><td>Fling / Swipe</td><td>Quick directional pan</td><td><code>Gesture.Fling()</code></td></tr>
    <tr><td>Force / 3D Touch</td><td>Pressure-sensitive (deprecated on most devices)</td><td><code>Gesture.ForceTouch()</code></td></tr>
    <tr><td>Hover (iPad with pencil/trackpad)</td><td>Cursor moves over an element</td><td><code>Gesture.Hover()</code></td></tr>
    <tr><td>Manual / Native</td><td>Compose lower-level</td><td><code>Gesture.Manual()</code> / <code>Gesture.Native()</code></td></tr>
  </tbody>
</table>

<h3>What "good gesture work" looks like</h3>
<ul>
  <li>Animations are buttery smooth at 60+ fps even on mid-range devices.</li>
  <li>Gesture recognises immediately at threshold (10pt drag, not 30).</li>
  <li>Visual feedback during the gesture (the dragged card follows your finger; doesn't lag).</li>
  <li>Composition rules are explicit (swipe-to-delete vs scroll-vertically — defined, not accidental).</li>
  <li>Haptic feedback at threshold cross (snap to next page; commit delete).</li>
  <li>System gestures aren't blocked (back-swipe still works, pull-to-refresh still works).</li>
  <li>Works for trackpad / Apple Pencil hover / mouse on iPad.</li>
  <li>Cancellation handled (when user lifts finger mid-action).</li>
</ul>

<h3>What "bad gesture work" looks like</h3>
<ul>
  <li>Drag lags behind finger (JS thread bridge cost).</li>
  <li>Gesture conflicts: scrolling list eats horizontal swipe-to-action (or vice versa).</li>
  <li>Edge-swipe-back blocked by your custom horizontal pan.</li>
  <li>Tap registers as drag because threshold is too tight.</li>
  <li>Long-press fires while user is still scrolling.</li>
  <li>Pinch-zoom on a non-zoomable image goes nowhere or breaks layout.</li>
  <li>Haptic on every frame of a drag (battery drain + buzzy).</li>
  <li>No pull-to-refresh on a list that updates from the network.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The gesture lifecycle (RNGH state machine)</h3>
<table>
  <thead><tr><th>State</th><th>When</th></tr></thead>
  <tbody>
    <tr><td><code>UNDETERMINED</code></td><td>Initial; finger may be on screen but pattern not yet recognised</td></tr>
    <tr><td><code>BEGAN</code></td><td>Recognition started (e.g., finger moved &gt; 10pt for pan)</td></tr>
    <tr><td><code>ACTIVE</code></td><td>Pattern confirmed; gesture is "in flight"</td></tr>
    <tr><td><code>END</code></td><td>Finger lifted with gesture still valid (commit)</td></tr>
    <tr><td><code>CANCELLED</code></td><td>Gesture interrupted (parent took over, app backgrounded)</td></tr>
    <tr><td><code>FAILED</code></td><td>Pattern didn't match (e.g., long-press finger moved too soon)</td></tr>
  </tbody>
</table>

<h3>The composition operators</h3>
<table>
  <thead><tr><th>Operator</th><th>Behaviour</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>Gesture.Race(a, b)</code></td><td>First to recognise wins; others fail</td><td>Tap vs long-press: first to commit wins</td></tr>
    <tr><td><code>Gesture.Simultaneous(a, b)</code></td><td>Both can be active at once</td><td>Pinch + rotate (photo viewer)</td></tr>
    <tr><td><code>Gesture.Exclusive(a, b)</code></td><td>Try a first; if a fails, try b</td><td>Double-tap (try) → single-tap (fallback)</td></tr>
  </tbody>
</table>

<p>You build complex behavior by nesting these:</p>
<pre><code class="language-typescript">const composed = Gesture.Simultaneous(
  pinch,
  Gesture.Race(pan, longPress)
);
</code></pre>

<h3>Recognition thresholds</h3>
<table>
  <thead><tr><th>Gesture</th><th>Default threshold</th></tr></thead>
  <tbody>
    <tr><td>Tap</td><td>~10pt movement maximum; ~250ms duration max</td></tr>
    <tr><td>Long press</td><td>500ms hold; ~10pt movement max</td></tr>
    <tr><td>Pan</td><td>~10pt movement triggers BEGAN</td></tr>
    <tr><td>Pinch</td><td>~5% scale change triggers ACTIVE</td></tr>
    <tr><td>Fling</td><td>~300dp/s velocity in direction</td></tr>
    <tr><td>Double tap</td><td>two taps within ~300ms</td></tr>
  </tbody>
</table>

<h3>The Reanimated worklet bridge</h3>
<p>A <strong>worklet</strong> is a JS function that Reanimated compiles + ships to the UI thread at startup. It runs there, not in JS, so:</p>
<ul>
  <li>It can read / write <strong>shared values</strong> (Reanimated's UI-thread-resident state).</li>
  <li>It can drive <code>useAnimatedStyle</code> at 60–120 fps without a single bridge crossing.</li>
  <li>It can NOT call most JS code (no setState, no console.log without <code>runOnJS</code>).</li>
</ul>

<pre><code class="language-typescript">'worklet';
function clamp(v, min, max) { return Math.max(min, Math.min(v, max)); }

const offsetX = useSharedValue(0);

const pan = Gesture.Pan().onUpdate((e) =&gt; {
  'worklet';
  offsetX.value = clamp(e.translationX, -100, 100); // runs on UI thread
});
</code></pre>

<h3>Touch target + hit slop</h3>
<table>
  <thead><tr><th>Concern</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>iOS minimum tap target</td><td>44 × 44 pt</td></tr>
    <tr><td>Android minimum tap target</td><td>48 × 48 dp</td></tr>
    <tr><td>Hit slop</td><td>Extends touchable area beyond visible bounds</td></tr>
    <tr><td>Edge gesture exclusion</td><td>~24dp from screen edges (system back gesture territory)</td></tr>
  </tbody>
</table>

<pre><code class="language-typescript">&lt;Pressable hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}&gt;
  &lt;Icon name="x" size={20} /&gt;
&lt;/Pressable&gt;
</code></pre>

<h3>Haptic feedback principles</h3>
<table>
  <thead><tr><th>When</th><th>Type</th></tr></thead>
  <tbody>
    <tr><td>Selection change (picker scroll)</td><td>Selection</td></tr>
    <tr><td>Toggle switch</td><td>Light impact</td></tr>
    <tr><td>Threshold cross (e.g., snap to next card)</td><td>Medium impact</td></tr>
    <tr><td>Commit destructive action</td><td>Heavy impact + warning notification</td></tr>
    <tr><td>Success</td><td>Notification (Success)</td></tr>
    <tr><td>Error</td><td>Notification (Error)</td></tr>
    <tr><td>Long-press triggers preview</td><td>Light impact</td></tr>
  </tbody>
</table>
<p>Never haptic per-frame during a drag — only at meaningful state transitions.</p>

<h3>System-reserved gestures</h3>
<ul>
  <li><strong>iOS:</strong> edge-swipe-back, swipe-down-from-top (Notification Center / Search), swipe-up-from-bottom (App Switcher / Home), two-finger pan in editable text (selection), shake (Undo prompt), tap status bar (scroll to top).</li>
  <li><strong>Android:</strong> system back gesture (left + right edges), home gesture (bottom edge swipe up), recent apps (bottom edge horizontal), notification shade (top edge swipe down), three-finger swipe (assistive shortcuts on some OEMs).</li>
</ul>
<p>Don't override these; users expect them everywhere.</p>

<h3>Pointer types</h3>
<table>
  <thead><tr><th>Pointer</th><th>Special considerations</th></tr></thead>
  <tbody>
    <tr><td>Finger</td><td>Default; ~44pt fat-finger area</td></tr>
    <tr><td>Apple Pencil</td><td>Pressure, tilt, hover (iPad Pro M2+)</td></tr>
    <tr><td>Trackpad / mouse (iPad, foldables)</td><td>Hover state, right-click, scroll wheel</td></tr>
    <tr><td>Stylus (Samsung S Pen)</td><td>Hover, button press, tilt</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Setting up RNGH + Reanimated</h3>
<pre><code class="language-typescript">// App.tsx
import 'react-native-gesture-handler'; // must be top of entry file
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function App() {
  return (
    &lt;GestureHandlerRootView style={{ flex: 1 }}&gt;
      &lt;NavigationContainer&gt; ... &lt;/NavigationContainer&gt;
    &lt;/GestureHandlerRootView&gt;
  );
}
</code></pre>

<p>Reanimated needs Babel plugin in <code>babel.config.js</code>:</p>
<pre><code class="language-javascript">module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['react-native-reanimated/plugin'], // must be last
};
</code></pre>

<h3>Tap with feedback</h3>
<pre><code class="language-typescript">import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function TappableCard() {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onBegin(() =&gt; {
      'worklet';
      scale.value = withSpring(0.96);
    })
    .onFinalize(() =&gt; {
      'worklet';
      scale.value = withSpring(1);
    })
    .onEnd(() =&gt; {
      'worklet';
      runOnJS(onTap)();
    });

  const animatedStyle = useAnimatedStyle(() =&gt; ({
    transform: [{ scale: scale.value }],
  }));

  return (
    &lt;GestureDetector gesture={tap}&gt;
      &lt;Animated.View style={[styles.card, animatedStyle]}&gt;
        &lt;Text&gt;Tap me&lt;/Text&gt;
      &lt;/Animated.View&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Long press with haptic</h3>
<pre><code class="language-typescript">import * as Haptics from 'expo-haptics';

const longPress = Gesture.LongPress()
  .minDuration(500)
  .onStart(() =&gt; {
    'worklet';
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
  })
  .onEnd(() =&gt; {
    'worklet';
    runOnJS(showContextMenu)();
  });
</code></pre>

<h3>Drag-to-dismiss (vertical pan)</h3>
<pre><code class="language-typescript">function DraggableSheet({ onDismiss }) {
  const translateY = useSharedValue(0);
  const SHEET_HEIGHT = 400;
  const DISMISS_THRESHOLD = SHEET_HEIGHT / 3;

  const pan = Gesture.Pan()
    .onUpdate((e) =&gt; {
      'worklet';
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) =&gt; {
      'worklet';
      if (e.translationY &gt; DISMISS_THRESHOLD || e.velocityY &gt; 1000) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, () =&gt; {
          runOnJS(onDismiss)();
        });
      } else {
        translateY.value = withSpring(0);
      }
    });

  const sheetStyle = useAnimatedStyle(() =&gt; ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.sheet, sheetStyle]}&gt;
        {/* sheet content */}
      &lt;/Animated.View&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Pinch-to-zoom + pan, simultaneous</h3>
<pre><code class="language-typescript">function ZoomableImage({ source }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedOffsetX = useSharedValue(0);
  const savedOffsetY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) =&gt; {
      'worklet';
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() =&gt; {
      'worklet';
      savedScale.value = scale.value;
      if (scale.value &lt; 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) =&gt; {
      'worklet';
      offsetX.value = savedOffsetX.value + e.translationX;
      offsetY.value = savedOffsetY.value + e.translationY;
    })
    .onEnd(() =&gt; {
      'worklet';
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() =&gt; ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    &lt;GestureDetector gesture={composed}&gt;
      &lt;Animated.Image source={source} style={[styles.image, animatedStyle]} /&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Swipe-to-delete row</h3>
<pre><code class="language-typescript">import Swipeable from 'react-native-gesture-handler/Swipeable';

function ListRow({ item, onDelete }) {
  return (
    &lt;Swipeable
      renderRightActions={(progress, dragX) =&gt; {
        const scale = dragX.interpolate({
          inputRange: [-100, 0],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        });
        return (
          &lt;Animated.View style={[styles.deleteAction, { transform: [{ scale }] }]}&gt;
            &lt;Text style={{ color: '#fff' }}&gt;Delete&lt;/Text&gt;
          &lt;/Animated.View&gt;
        );
      }}
      onSwipeableOpen={() =&gt; onDelete(item.id)}
    &gt;
      &lt;Row {...item} /&gt;
    &lt;/Swipeable&gt;
  );
}
</code></pre>

<h3>Carousel with snap</h3>
<pre><code class="language-typescript">function Carousel({ pages, width }) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const currentPage = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin(() =&gt; {
      'worklet';
      startX.value = translateX.value;
    })
    .onUpdate((e) =&gt; {
      'worklet';
      translateX.value = startX.value + e.translationX;
    })
    .onEnd((e) =&gt; {
      'worklet';
      const delta = -translateX.value / width;
      let next = Math.round(delta);
      if (Math.abs(e.velocityX) &gt; 500) {
        next = currentPage.value + (e.velocityX &lt; 0 ? 1 : -1);
      }
      next = Math.max(0, Math.min(next, pages.length - 1));
      currentPage.value = next;
      translateX.value = withSpring(-next * width);
    });

  const trackStyle = useAnimatedStyle(() =&gt; ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.track, trackStyle, { width: width * pages.length }]}&gt;
        {pages.map((p, i) =&gt; &lt;Page key={i} style={{ width }} {...p} /&gt;)}
      &lt;/Animated.View&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Drag-to-reorder list</h3>
<p>Use <code>react-native-draggable-flatlist</code> — it handles long-press-to-pick-up + drag + drop with auto-scroll near edges. Building from scratch is fiddly.</p>
<pre><code class="language-typescript">import DraggableFlatList from 'react-native-draggable-flatlist';

&lt;DraggableFlatList
  data={items}
  onDragEnd={({ data }) =&gt; setItems(data)}
  keyExtractor={(item) =&gt; item.id}
  renderItem={({ item, drag, isActive }) =&gt; (
    &lt;TouchableOpacity onLongPress={drag} style={[styles.row, isActive &amp;&amp; styles.active]}&gt;
      &lt;Text&gt;{item.label}&lt;/Text&gt;
    &lt;/TouchableOpacity&gt;
  )}
/&gt;
</code></pre>

<h3>Disabling parent scroll while dragging child</h3>
<pre><code class="language-typescript">import { ScrollView } from 'react-native-gesture-handler';

const pan = Gesture.Pan()
  .activeOffsetX([-10, 10])  // wait for 10pt horizontal movement
  .failOffsetY([-5, 5]);     // fail if vertical movement &gt; 5pt

&lt;ScrollView&gt; {/* will keep scrolling vertically */}
  &lt;GestureDetector gesture={pan}&gt;
    &lt;Animated.View&gt; {/* horizontal swipe-to-delete row */} &lt;/Animated.View&gt;
  &lt;/GestureDetector&gt;
&lt;/ScrollView&gt;
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Tinder-style swipe deck</h3>
<pre><code class="language-typescript">function Card({ user, onSwipeLeft, onSwipeRight }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const SWIPE_THRESHOLD = 100;

  const pan = Gesture.Pan()
    .onUpdate((e) =&gt; {
      'worklet';
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.2;
    })
    .onEnd((e) =&gt; {
      'worklet';
      if (translateX.value &gt; SWIPE_THRESHOLD || e.velocityX &gt; 800) {
        translateX.value = withTiming(500, { duration: 300 });
        runOnJS(onSwipeRight)();
      } else if (translateX.value &lt; -SWIPE_THRESHOLD || e.velocityX &lt; -800) {
        translateX.value = withTiming(-500, { duration: 300 });
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() =&gt; ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: \`\${translateX.value / 20}deg\` },
    ],
  }));

  const likeOpacity = useAnimatedStyle(() =&gt; ({
    opacity: Math.max(0, translateX.value / 100),
  }));

  const nopeOpacity = useAnimatedStyle(() =&gt; ({
    opacity: Math.max(0, -translateX.value / 100),
  }));

  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.card, cardStyle]}&gt;
        &lt;Image source={{ uri: user.photo }} style={styles.photo} /&gt;
        &lt;Animated.Text style={[styles.likeStamp, likeOpacity]}&gt;LIKE&lt;/Animated.Text&gt;
        &lt;Animated.Text style={[styles.nopeStamp, nopeOpacity]}&gt;NOPE&lt;/Animated.Text&gt;
      &lt;/Animated.View&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Example 2: Pull-to-refresh on a custom list</h3>
<pre><code class="language-typescript">// react-native FlatList with system pull-to-refresh
&lt;FlatList
  data={items}
  refreshing={isRefreshing}
  onRefresh={onRefresh}
  renderItem={renderItem}
/&gt;
</code></pre>
<p>Use the system <code>RefreshControl</code> — building a custom pull-to-refresh is rarely worth it. The system one already animates the spinner, handles thresholds, and matches platform conventions.</p>

<h3>Example 3: Bottom-sheet snap to detents</h3>
<pre><code class="language-typescript">import BottomSheet from '@gorhom/bottom-sheet';

const sheetRef = useRef&lt;BottomSheet&gt;(null);
const snapPoints = useMemo(() =&gt; ['25%', '50%', '90%'], []);

&lt;BottomSheet
  ref={sheetRef}
  snapPoints={snapPoints}
  enablePanDownToClose
  enableDynamicSizing={false}
&gt;
  &lt;BottomSheetView style={styles.sheetContent}&gt;
    &lt;Text&gt;Filters&lt;/Text&gt;
  &lt;/BottomSheetView&gt;
&lt;/BottomSheet&gt;
</code></pre>
<p>The library handles pan, snap, momentum, and dismiss-on-pan-down for you. Building this with raw RNGH is hundreds of lines.</p>

<h3>Example 4: Long-press preview (peek)</h3>
<pre><code class="language-typescript">function PeekableThumbnail({ source, onTap }) {
  const scale = useSharedValue(1);
  const isPeeking = useSharedValue(false);

  const longPress = Gesture.LongPress()
    .minDuration(300)
    .onStart(() =&gt; {
      'worklet';
      isPeeking.value = true;
      scale.value = withSpring(1.2);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onEnd(() =&gt; {
      'worklet';
      isPeeking.value = false;
      scale.value = withSpring(1);
    });

  const tap = Gesture.Tap().onEnd(() =&gt; {
    'worklet';
    runOnJS(onTap)();
  });

  const composed = Gesture.Exclusive(longPress, tap);

  const style = useAnimatedStyle(() =&gt; ({
    transform: [{ scale: scale.value }],
    zIndex: isPeeking.value ? 999 : 1,
  }));

  return (
    &lt;GestureDetector gesture={composed}&gt;
      &lt;Animated.Image source={source} style={[styles.thumb, style]} /&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Example 5: Pinch + double-tap reset</h3>
<pre><code class="language-typescript">const pinch = Gesture.Pinch().onUpdate((e) =&gt; {
  'worklet';
  scale.value = savedScale.value * e.scale;
});

const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() =&gt; {
  'worklet';
  scale.value = withSpring(1);
  savedScale.value = 1;
  offsetX.value = withSpring(0);
  offsetY.value = withSpring(0);
});

const composed = Gesture.Race(pinch, doubleTap);
</code></pre>

<h3>Example 6: Gesture-driven nav transition</h3>
<p>Native-stack with <code>fullScreenGestureEnabled</code> gives you iOS-style edge-swipe-back across the full screen, not just the left edge:</p>
<pre><code class="language-typescript">&lt;Stack.Navigator
  screenOptions={{
    fullScreenGestureEnabled: true,
    gestureResponseDistance: 50,
  }}
&gt;
  &lt;Stack.Screen name="Home" component={HomeScreen} /&gt;
  &lt;Stack.Screen name="Detail" component={DetailScreen} /&gt;
&lt;/Stack.Navigator&gt;
</code></pre>

<h3>Example 7: Drag-to-reorder with auto-scroll</h3>
<pre><code class="language-typescript">import DraggableFlatList from 'react-native-draggable-flatlist';

function ReorderableList({ items, onReorder }) {
  return (
    &lt;DraggableFlatList
      data={items}
      onDragEnd={({ data }) =&gt; onReorder(data)}
      keyExtractor={(item) =&gt; item.id}
      activationDistance={5}
      autoscrollSpeed={150}
      autoscrollThreshold={50}
      renderItem={({ item, drag, isActive }) =&gt; (
        &lt;ScaleDecorator&gt;
          &lt;Pressable
            onLongPress={drag}
            disabled={isActive}
            style={[styles.row, isActive &amp;&amp; styles.dragging]}
          &gt;
            &lt;Icon name="drag-handle" /&gt;
            &lt;Text&gt;{item.label}&lt;/Text&gt;
          &lt;/Pressable&gt;
        &lt;/ScaleDecorator&gt;
      )}
    /&gt;
  );
}
</code></pre>

<h3>Example 8: Hold-to-record button</h3>
<pre><code class="language-typescript">function HoldToRecord({ onComplete }) {
  const progress = useSharedValue(0);
  const RECORD_DURATION = 5000; // 5s

  const longPress = Gesture.LongPress()
    .minDuration(0)
    .onStart(() =&gt; {
      'worklet';
      progress.value = withTiming(1, { duration: RECORD_DURATION }, (finished) =&gt; {
        if (finished) runOnJS(onComplete)();
      });
    })
    .onEnd(() =&gt; {
      'worklet';
      cancelAnimation(progress);
      progress.value = withTiming(0, { duration: 200 });
    });

  const ringStyle = useAnimatedStyle(() =&gt; ({
    transform: [{ scale: 1 + progress.value * 0.5 }],
    opacity: 0.3 + progress.value * 0.7,
  }));

  return (
    &lt;GestureDetector gesture={longPress}&gt;
      &lt;View style={styles.button}&gt;
        &lt;Animated.View style={[styles.ring, ringStyle]} /&gt;
        &lt;Icon name="microphone" size={32} /&gt;
      &lt;/View&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Gesture conflicts with parent scroll</h3>
<ul>
  <li>Horizontal swipe-to-delete inside vertical FlatList: pan and scroll fight.</li>
  <li>Solution: <code>activeOffsetX([-10, 10])</code> + <code>failOffsetY([-5, 5])</code> on the pan; gesture only activates on horizontal movement.</li>
  <li>Inverse: vertical drag inside horizontal carousel — <code>activeOffsetY</code> + <code>failOffsetX</code>.</li>
</ul>

<h3>System gesture conflicts</h3>
<ul>
  <li>Custom horizontal pan on the leftmost ~24pt fights iOS edge-swipe-back.</li>
  <li>Solution: pad your interactive area inset 24pt from the edge, or use <code>setSystemGestureExclusionRects</code> on Android.</li>
  <li>iOS: <code>fullScreenGestureEnabled: false</code> if you want to allow your custom gesture full width but still keep edge-swipe.</li>
</ul>

<h3>Parent vs child gesture priority</h3>
<table>
  <thead><tr><th>Want</th><th>Use</th></tr></thead>
  <tbody>
    <tr><td>Child wins, parent fails</td><td>Default (gestures cascade child-first)</td></tr>
    <tr><td>Parent wins on simultaneous</td><td><code>simultaneousWithExternalGesture(parentRef)</code></td></tr>
    <tr><td>Wait for child to fail before parent activates</td><td><code>requireExternalGestureToFail(childRef)</code></td></tr>
  </tbody>
</table>

<h3>Gesture cancellation</h3>
<ul>
  <li>App backgrounded mid-gesture → CANCELLED state. Reset transient UI state.</li>
  <li>Phone call interrupts gesture → CANCELLED.</li>
  <li>Don't fire side effects in <code>onEnd</code> blindly; check <code>state === END</code> not <code>state === CANCELLED</code>.</li>
</ul>

<h3>Double-tap delay</h3>
<ul>
  <li><code>Gesture.Tap().numberOfTaps(2)</code> waits ~300ms for a possible second tap before resolving as single.</li>
  <li>If you have both single and double tap, single tap feels laggy. Use <code>Gesture.Exclusive(doubleTap, singleTap)</code> only when needed.</li>
  <li>Otherwise prefer one or the other.</li>
</ul>

<h3>Pinch with one finger after second lifts</h3>
<ul>
  <li>User starts pinching with two fingers, lifts one mid-pinch — gesture continues as pan with one finger or transitions awkwardly.</li>
  <li>RNGH handles this correctly; don't over-think.</li>
  <li>For zoom + pan: composed Simultaneous(pinch, pan); test the two-finger-to-one transition explicitly.</li>
</ul>

<h3>Velocity edge cases</h3>
<ul>
  <li>Very slow drag → <code>onEnd</code> velocity is near 0. Don't trigger fling-based actions.</li>
  <li>Very fast fling at the very end → translation is small but velocity is high. Use velocity threshold OR translation threshold (not both as AND).</li>
  <li>Different OS, different velocity units (iOS: pt/s, Android: px/s, Reanimated normalises to dp/s).</li>
</ul>

<h3>Touch slop and accidental triggers</h3>
<ul>
  <li>Hands shake; users may move 5pt while "tapping." Tap should tolerate ~10pt movement.</li>
  <li>Long-press should fail if finger moves &gt; ~10pt.</li>
  <li>For sliders / large draggables, threshold can be tighter.</li>
</ul>

<h3>Reduce Motion</h3>
<ul>
  <li>Users with Reduce Motion enabled expect minimal animation.</li>
  <li>Springs / decay animations can disorient them.</li>
  <li>Check <code>AccessibilityInfo.isReduceMotionEnabled()</code>; fall back to <code>withTiming({ duration: 0 })</code> or instantaneous transitions.</li>
</ul>

<h3>Trackpad / mouse on iPad</h3>
<ul>
  <li>iPadOS supports trackpad / mouse; touch becomes a pointer with hover state.</li>
  <li>RNGH handles this transparently for tap / pan.</li>
  <li>Hover state for buttons / cards is iOS-specific — RN hover prop on Pressable.</li>
</ul>

<h3>Apple Pencil hover (iPad Pro M2+)</h3>
<ul>
  <li>Pencil hovers without touching = preview / hover state.</li>
  <li>RNGH 2.18+ supports <code>Gesture.Hover()</code> for hovering pointers.</li>
  <li>Niche but premium feel for drawing apps.</li>
</ul>

<h3>Accessibility shortcuts users may have</h3>
<ul>
  <li>VoiceOver / TalkBack: gestures change semantics — single tap reads, double tap activates, swipe right moves to next item.</li>
  <li>Don't test only with eyes open; enable VoiceOver and verify gestures still work.</li>
  <li>Expose actions via <code>accessibilityActions</code> for custom gestures (e.g., swipe-to-delete should also be reachable via VoiceOver).</li>
</ul>

<h3>RTL gesture mirroring</h3>
<ul>
  <li>Arabic / Hebrew users: swipe-left should still mean "next forward in reading order"; that's right-to-left in RTL.</li>
  <li>Use <code>I18nManager.isRTL</code> to mirror swipe directions in carousels and back-swipe.</li>
</ul>

<h3>Performance: never run heavy code in worklets</h3>
<ul>
  <li>Worklets run on the UI thread; heavy work blocks the next frame.</li>
  <li>Keep worklets to math + shared-value updates.</li>
  <li>Use <code>runOnJS</code> for anything that touches React state, fetch, navigation.</li>
  <li>Profile with the Reanimated FPS monitor.</li>
</ul>

<h3>Memory + cleanup</h3>
<ul>
  <li>Gesture objects are held by React refs; unmount cleanup is automatic if you use them inline in JSX.</li>
  <li>Custom gesture refs need manual <code>useEffect</code> cleanup if you set up listeners.</li>
  <li>Avoid creating new Gesture objects each render — wrap in <code>useMemo</code> if heavy.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 10 most common gesture mistakes in RN</h3>
<ol>
  <li><strong>Using PanResponder in 2026.</strong> Bridge cost = laggy drag. Use RNGH + Reanimated.</li>
  <li><strong>Not setting hit slop.</strong> Tap targets are too small for fingers.</li>
  <li><strong>Blocking edge-swipe-back.</strong> Custom pan eats system gesture.</li>
  <li><strong>Haptic per frame.</strong> Battery drain + buzzy.</li>
  <li><strong>Tap + drag conflict (no thresholds).</strong> Tap registers as drag.</li>
  <li><strong>Gestures fighting parent scroll.</strong> Need <code>activeOffsetX/Y</code>.</li>
  <li><strong>setState inside worklet without runOnJS.</strong> Throws.</li>
  <li><strong>Spring without bound clamping.</strong> Card flies off-screen.</li>
  <li><strong>Forgetting onEnd vs onFinalize.</strong> onFinalize runs even on cancel.</li>
  <li><strong>Pull-to-refresh on a screen the user can't manually trigger.</strong> Add a refresh button too.</li>
</ol>

<h3>Anti-pattern: PanResponder for animation</h3>
<pre><code class="language-typescript">// BAD — bridge crossings; ~60ms lag on mid-range devices
const responder = useRef(PanResponder.create({
  onMoveShouldSetPanResponder: () =&gt; true,
  onPanResponderMove: (e, g) =&gt; {
    setX(g.dx); // setState every frame; React reconciles; bridge sends to native
  },
})).current;

// GOOD — RNGH + Reanimated; UI thread end-to-end
const x = useSharedValue(0);
const pan = Gesture.Pan().onUpdate((e) =&gt; {
  'worklet';
  x.value = e.translationX;
});
</code></pre>

<h3>Anti-pattern: forgetting hit slop</h3>
<pre><code class="language-typescript">// BAD — 16pt icon button; users miss
&lt;Pressable onPress={onPress}&gt;
  &lt;Icon name="x" size={16} /&gt;
&lt;/Pressable&gt;

// GOOD — hit slop pads the touchable area
&lt;Pressable onPress={onPress} hitSlop={16}&gt;
  &lt;Icon name="x" size={16} /&gt;
&lt;/Pressable&gt;
</code></pre>

<h3>Anti-pattern: gesture without composition rules</h3>
<p>Two custom gestures on the same area without explicit composition behave non-deterministically across iOS / Android. Always wrap in <code>Gesture.Race</code> / <code>Simultaneous</code> / <code>Exclusive</code>.</p>

<h3>Anti-pattern: gratuitous haptics</h3>
<pre><code class="language-typescript">// BAD — vibrates every frame
.onUpdate(() =&gt; {
  'worklet';
  runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
})

// GOOD — haptic at threshold cross
.onUpdate((e) =&gt; {
  'worklet';
  if (e.translationX &gt; THRESHOLD &amp;&amp; !crossed.value) {
    crossed.value = true;
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
  }
})
</code></pre>

<h3>Anti-pattern: Reanimated worklet with unsafe access</h3>
<pre><code class="language-typescript">// BAD — accessing React state in worklet; throws or returns stale
const [count, setCount] = useState(0);
const tap = Gesture.Tap().onEnd(() =&gt; {
  'worklet';
  setCount(count + 1); // setState not allowed in worklet
});

// GOOD — runOnJS to bounce back to React
const tap = Gesture.Tap().onEnd(() =&gt; {
  'worklet';
  runOnJS(setCount)(count + 1);
});
</code></pre>

<h3>Anti-pattern: spring without clamps</h3>
<pre><code class="language-typescript">// BAD — finger lifts way off screen; spring back from 800pt
.onUpdate((e) =&gt; {
  'worklet';
  translateX.value = e.translationX;
})

// GOOD — clamp during drag so the spring is bounded
.onUpdate((e) =&gt; {
  'worklet';
  translateX.value = clamp(e.translationX, -100, 100);
})
</code></pre>

<h3>Anti-pattern: blocking back gesture without alternative</h3>
<pre><code class="language-typescript">// BAD — disables system back; users feel trapped
&lt;Stack.Screen options={{ gestureEnabled: false }} /&gt;

// GOOD — block back conditionally; show confirmation
&lt;Stack.Screen options={{
  gestureEnabled: !hasUnsaved,
  beforeRemove: (e) =&gt; {
    if (!hasUnsaved) return;
    e.preventDefault();
    Alert.alert('Discard changes?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', onPress: () =&gt; navigation.dispatch(e.data.action) },
    ]);
  },
}} /&gt;
</code></pre>

<h3>Anti-pattern: complex state machine in onUpdate</h3>
<p>Worklets should be simple math. Long branches, fetches, navigation calls = drop frames. Move complexity to <code>onEnd</code> + <code>runOnJS</code>.</p>

<h3>Anti-pattern: not respecting Reduce Motion</h3>
<pre><code class="language-typescript">// BAD — spring everywhere even for accessibility users
translateX.value = withSpring(target);

// GOOD — fall back to no animation
const reduceMotion = useReducedMotion();
translateX.value = reduceMotion ? target : withSpring(target);
</code></pre>

<h3>Anti-pattern: ignoring trackpad / mouse</h3>
<p>Pressable ships with hover support but custom gesture-based components often don't. Add hover via <code>Gesture.Hover()</code> for iPad with trackpad.</p>

<h3>Anti-pattern: drag that fights with native scroll</h3>
<pre><code class="language-typescript">// BAD — pan steals all touches even when user is trying to scroll
const pan = Gesture.Pan();

// GOOD — only activates on horizontal movement
const pan = Gesture.Pan()
  .activeOffsetX([-10, 10])
  .failOffsetY([-5, 5]);
</code></pre>

<h3>Anti-pattern: long-press without visual feedback</h3>
<p>Long-press fires after 500ms but no visual indication anything is happening. Users feel they pressed wrong. Animate scale, opacity, or shadow during the hold.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common gesture interview prompts</h3>
<ol>
  <li>Build a swipe-to-dismiss bottom sheet from scratch.</li>
  <li>Build a Tinder-style swipe deck.</li>
  <li>Build a pinch-to-zoom photo viewer.</li>
  <li>How do you handle gesture conflicts between a custom pan and scroll?</li>
  <li>Why use react-native-gesture-handler over PanResponder?</li>
  <li>How do worklets work in Reanimated?</li>
  <li>How do you respect system gestures (back-swipe, pull-to-refresh)?</li>
  <li>Tell me about a tricky gesture bug you fixed.</li>
</ol>

<h3>The 5-step framework for "build this gesture"</h3>
<ol>
  <li><strong>Identify the gesture(s):</strong> tap, pan, pinch, long-press, fling — pick the primitives.</li>
  <li><strong>Pick composition:</strong> Race / Simultaneous / Exclusive based on user intent.</li>
  <li><strong>Set thresholds + clamps:</strong> activation distance, velocity, hit slop, bounds during drag.</li>
  <li><strong>Drive animation via shared values + worklets:</strong> UI thread end-to-end.</li>
  <li><strong>Handle edges:</strong> cancellation, threshold haptics, parent gesture conflicts, system gestures, Reduce Motion.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"react-native-gesture-handler runs on the native UI thread — recognises before JS even sees the touch. PanResponder bridges every event = ~60ms lag on mid-range devices."</em></li>
  <li><em>"Reanimated worklets ship JS to the UI thread; <code>useAnimatedStyle</code> at 60–120fps without bridge crossings. <code>runOnJS</code> bounces back to React when needed."</em></li>
  <li><em>"<code>Gesture.Simultaneous(pinch, pan)</code> for photo viewer — both active. <code>Gesture.Race(tap, longPress)</code> for press menus — first to commit wins."</em></li>
  <li><em>"<code>activeOffsetX</code> + <code>failOffsetY</code> on a horizontal swipe inside a vertical scroll — gesture only triggers on horizontal motion."</em></li>
  <li><em>"Threshold-based haptics: <code>impactAsync</code> at threshold cross, never per-frame. Battery + UX both win."</em></li>
  <li><em>"Bounds clamping during drag so the spring doesn't have to recover from 800pt of overshoot."</em></li>
  <li><em>"Test with VoiceOver / TalkBack — custom gestures must expose <code>accessibilityActions</code> for screen-reader users."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"swipe to dismiss"</td><td>Pan + threshold + velocity check</td></tr>
    <tr><td>"swipe to delete row"</td><td>react-native-gesture-handler Swipeable</td></tr>
    <tr><td>"drag to reorder"</td><td>react-native-draggable-flatlist</td></tr>
    <tr><td>"pinch to zoom"</td><td>Simultaneous(pinch, pan) + double-tap reset</td></tr>
    <tr><td>"long press menu"</td><td>LongPress + context-menu library or custom modal</td></tr>
    <tr><td>"carousel with snap"</td><td>Pan + velocity-aware page snap + spring</td></tr>
    <tr><td>"hold to record"</td><td>LongPress with progress shared value</td></tr>
    <tr><td>"bottom sheet"</td><td>@gorhom/bottom-sheet (don't reinvent)</td></tr>
    <tr><td>"pull to refresh"</td><td>FlatList refreshControl (don't reinvent)</td></tr>
    <tr><td>"two-finger rotate"</td><td>Rotation gesture composed with Pinch</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard / IDE)</h3>
<ol>
  <li>State the gesture: pan / pinch / etc.</li>
  <li>Sketch the composition (Race / Simultaneous / Exclusive).</li>
  <li>Define shared values + thresholds.</li>
  <li>Show the worklet driving an animated style.</li>
  <li>Talk system gesture exclusions + parent scroll conflicts.</li>
  <li>Add haptic at threshold + Reduce Motion fallback.</li>
  <li>Address cancellation + accessibility.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Add accessibilityActions so swipe-to-delete works with VoiceOver."</em></li>
  <li><em>"Add Reduce Motion respect via useReducedMotion."</em></li>
  <li><em>"Trackpad hover support via Gesture.Hover for iPad."</em></li>
  <li><em>"Apple Pencil pressure for variable response on draw apps."</em></li>
  <li><em>"Worklet performance audit — make sure heavy logic moves to runOnJS."</em></li>
  <li><em>"Snapshot tests of gesture-driven layouts at key threshold values."</em></li>
  <li><em>"Telemetry: track how often users discover gestures vs use buttons."</em></li>
  <li><em>"Cancellation hardening: ensure transient state resets if app backgrounds mid-gesture."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Stack fluency</td><td>RNGH + Reanimated, not PanResponder</td></tr>
    <tr><td>Composition awareness</td><td>Race / Simultaneous / Exclusive used deliberately</td></tr>
    <tr><td>Threshold discipline</td><td>activeOffset, hitSlop, velocity vs translation</td></tr>
    <tr><td>UI-thread instinct</td><td>Worklets for animation; runOnJS for React</td></tr>
    <tr><td>System gesture respect</td><td>Doesn't block back-swipe / pull-to-refresh</td></tr>
    <tr><td>Haptic discretion</td><td>At thresholds, not per-frame</td></tr>
    <tr><td>Cancellation handling</td><td>onFinalize for cleanup; doesn't fire side effects on cancel</td></tr>
    <tr><td>Accessibility default</td><td>accessibilityActions for non-touch alternatives</td></tr>
    <tr><td>Restraint with custom UI</td><td>Reaches for libraries (gorhom, draggable-flatlist) when reasonable</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RNGH + Reanimated is the modern stack — RN core teams recommend it; it's what every production app should use.</li>
  <li>PanResponder still works but is deprecated in spirit; use only for trivial cases or codebases that haven't migrated.</li>
  <li>Reanimated v3 (current) has the cleanest API — Gesture.X().onUpdate(worklet).</li>
  <li>Test on real devices — simulator gestures don't model true touch latency.</li>
  <li>Mid-range Android devices (Snapdragon 6xx) are the right perf target — anything that drops frames there will worry users.</li>
  <li>Bridgeless mode (RN 0.74+) reduces some legacy bridge cost but doesn't eliminate the worklet advantage.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why does PanResponder lag?"</em> — Each frame: native touch event → bridge → JS handler → setState → React reconcile → bridge → native style update. ~5+ ms of overhead per frame; drops to 30fps under load.</li>
  <li><em>"What's a worklet?"</em> — A JS function compiled and shipped to the UI thread at app startup; it can read/write Reanimated shared values directly without bridge cost. Limited to a subset of JS (no setState, no async).</li>
  <li><em>"How do you prevent gesture conflicts?"</em> — Composition operators + activation/fail thresholds; let RNGH's responder system arbitrate; explicit refs for parent/child cooperation.</li>
  <li><em>"How do you support gesture-based actions for screen reader users?"</em> — <code>accessibilityActions</code> prop exposes named alternatives ("delete", "archive") that VoiceOver/TalkBack triggers via swipe-up menu.</li>
  <li><em>"How would you build a custom carousel?"</em> — Pan with shared value, spring on release, velocity-aware snap. But really, use Reanimated's Carousel or FlatList horizontal — building from scratch loses time.</li>
  <li><em>"How do you handle a 5-finger gesture?"</em> — RNGH supports any finger count; specify <code>minPointers</code> on relevant gestures. Useful for accessibility shortcuts (3-finger drag = system gesture on iOS for selection).</li>
  <li><em>"What's the cost of useAnimatedStyle?"</em> — Near zero on the UI thread; the worklet runs once per frame. Avoid creating new objects inside it; reuse cached values.</li>
  <li><em>"How do you debug a gesture that's not firing?"</em> — Reanimated dev menu has a frame-by-frame log; RNGH provides state callbacks (onBegin, onStart, onUpdate, onEnd, onFinalize); log states with <code>runOnJS(console.log)</code>.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build 3 gesture demos: swipe deck, pinch+pan photo, drag-to-reorder list.</li>
  <li>Memorise the RNGH composition operators + thresholds.</li>
  <li>Practice writing a worklet from scratch — when it errors, why.</li>
  <li>Test gesture conflicts: horizontal swipe inside vertical scroll.</li>
  <li>Read the Reanimated docs sections on shared values + worklets.</li>
  <li>Profile FPS on mid-range Android during a swipe-heavy screen.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read William Candillon's RN gesture videos (Can it be done in React Native?) — the canonical resource."</li>
  <li>"Build a CodePen-equivalent demo for one Apple-app gesture (Photos pinch-zoom, Mail swipe-actions) and compare feel."</li>
  <li>"Audit a real RN app for gesture lag — Reanimated profiler + frame counter."</li>
  <li>"Compare RNGH's approach to Flutter's GestureDetector — different mental model, similar primitives."</li>
</ul>
`
    }
  ]
});
