window.PREP_SITE.registerTopic({
  id: 'anim-reanimated',
  module: 'animation',
  title: 'Reanimated 3 Worklets',
  estimatedReadTime: '50 min',
  tags: ['reanimated', 'react-native', 'worklets', 'shared-value', 'gesture-handler', 'ui-thread', 'animations', 'spring'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Reanimated</strong> is the de facto animation library for React Native. Reanimated 3 (released 2023) introduced a fundamentally new architecture: <strong>worklets</strong> — small JavaScript functions that run on the <strong>UI thread</strong>, not the JS thread. This means animations and gesture responses don't depend on a busy JS thread; they stay at 60/120fps even when JS is doing heavy work.</p>
<ul>
  <li><strong>Two threads, two worlds.</strong> JS thread (your React app) and UI thread (native rendering). Reanimated lets a subset of JS run on the UI thread.</li>
  <li><strong>Worklet:</strong> a JS function marked with <code>'worklet'</code> directive that's serialized + run on the UI thread.</li>
  <li><strong>SharedValue:</strong> the Reanimated equivalent of state; readable/writable from both threads.</li>
  <li><strong>useAnimatedStyle:</strong> compose styles from SharedValues; runs as a worklet on the UI thread.</li>
  <li><strong>withSpring / withTiming / withDecay:</strong> animation primitives; physics-based or duration-based.</li>
  <li><strong>react-native-gesture-handler integration:</strong> gestures + animations both on UI thread → pixel-perfect drag-with-physics.</li>
  <li><strong>Layout animations:</strong> <code>entering</code>/<code>exiting</code>/<code>layout</code> props for declarative mount/unmount/reorder transitions.</li>
  <li><strong>vs old Animated API:</strong> Reanimated runs on the UI thread by default; legacy Animated API needs <code>useNativeDriver: true</code> and only supports a subset of properties.</li>
</ul>
<p><strong>Mantra:</strong> "SharedValue stores. useAnimatedStyle reads. withSpring animates. Worklets run on UI thread. Gestures and animation never touch the JS thread."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The "two threads" reality of React Native</h3>
<p>RN apps run on at least two threads:</p>
<table>
  <thead><tr><th>Thread</th><th>Runs</th></tr></thead>
  <tbody>
    <tr><td><strong>JS thread</strong></td><td>Your React code, business logic, fetch calls, reducers</td></tr>
    <tr><td><strong>UI thread (native main)</strong></td><td>Native view rendering, layout, scrolling, native gestures</td></tr>
    <tr><td>Shadow / layout (older arch)</td><td>Yoga layout calculation</td></tr>
  </tbody>
</table>
<p>Anything that depends on the JS thread (a Text component re-rendering, an Animated.Value without nativeDriver) blocks visibly when the JS thread is busy. Animations that should be smooth become janky.</p>

<h3>The problem Reanimated solves</h3>
<p>Pre-Reanimated (and with the legacy Animated API), animation values flowed JS → bridge → native every frame. If the JS thread was busy, frames dropped. Even with <code>useNativeDriver: true</code>, you could only animate a subset of properties (transforms, opacity), and gestures still hopped to the JS thread.</p>

<p>Reanimated runs animation code <em>on the UI thread</em>. Gestures handled by <code>react-native-gesture-handler</code> (also on the UI thread) feed values directly into Reanimated worklets. The JS thread can be running heavy work; the animation continues at 60fps because nothing is asking the JS thread for anything.</p>

<h3>Worklets — the magic primitive</h3>
<p>A worklet is a JavaScript function marked with the <code>'worklet'</code> string at the top. The Reanimated Babel plugin extracts this function, serializes it to a minimal form, and the Reanimated runtime can call it on the UI thread. The plugin handles:</p>
<ul>
  <li>Capturing closure values.</li>
  <li>Marshalling callbacks to JS thread when needed (<code>runOnJS</code>).</li>
  <li>Marshalling calls back from JS to UI thread (<code>runOnUI</code>).</li>
</ul>

<pre><code class="language-js">function someWorklet(value) {
  'worklet';
  // This runs on the UI thread
  return value * 2;
}
</code></pre>

<h3>Reanimated 3 changes from Reanimated 2</h3>
<ul>
  <li>Default rendering on UI thread — no opt-in needed.</li>
  <li>Layout animations (<code>entering</code>, <code>exiting</code>, <code>layout</code>).</li>
  <li>SharedTransition for navigation.</li>
  <li>Improved web support.</li>
  <li>Better TypeScript inference.</li>
  <li>Removed legacy "Reanimated 1" API.</li>
</ul>

<h3>Why it's a senior signal</h3>
<ol>
  <li>The two-threads model is genuinely advanced; understanding it differentiates senior RN devs.</li>
  <li>Worklet boundaries (<code>runOnJS</code> / <code>runOnUI</code>) are easy to get wrong — knowing them is signal.</li>
  <li>Performance under load — apps that stay smooth during heavy JS work depend on Reanimated.</li>
  <li>Animation companies (Discord, Airbnb, Linear, Coinbase, Robinhood) hire RN devs specifically for this skill.</li>
</ol>

<h3>When NOT to use Reanimated</h3>
<ul>
  <li>Simple one-shot animations (use the built-in Animated API + LayoutAnimation).</li>
  <li>Tiny apps where the bundle cost (Reanimated adds ~100KB) isn't worth it.</li>
  <li>Web-only React projects (Reanimated has web support but it's not the natural fit).</li>
</ul>

<h3>What "good" looks like</h3>
<ul>
  <li>You write worklets without confusion about the worklet boundary.</li>
  <li>You use <code>runOnJS</code> / <code>runOnUI</code> only when crossing threads is necessary.</li>
  <li>You compose <code>withSpring</code> / <code>withTiming</code> / <code>withDecay</code> for natural motion.</li>
  <li>You integrate gesture-handler for drag, swipe, pinch on the UI thread.</li>
  <li>You use <code>useAnimatedStyle</code> for derived styles, not <code>setState</code> in callbacks.</li>
  <li>You leverage layout animations (<code>entering</code>/<code>exiting</code>/<code>layout</code>) before reaching for manual implementations.</li>
  <li>You profile on real devices to confirm UI-thread execution.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "two contexts" model</h3>
<p>Mental shift: your React Native code runs in two contexts.</p>
<pre><code class="language-text">┌────────────────────────────┐    ┌──────────────────────┐
│       JS thread            │    │     UI thread        │
│                            │    │                      │
│  React components          │◄──►│  Worklets            │
│  Hooks                     │    │  Animations          │
│  Fetch / Redux / Zustand   │    │  Gestures            │
│  Heavy logic               │    │  SharedValue updates │
│                            │    │  useAnimatedStyle    │
│  setState                  │    │                      │
│  Most JS APIs              │    │  Limited JS subset   │
└────────────┬───────────────┘    └──────────┬───────────┘
             │                                │
             │  runOnJS()  ◄──────────────►  runOnUI()
             │                                │
             └────────────────────────────────┘
                  bridge / shared memory
</code></pre>

<h3>SharedValue — the cross-thread primitive</h3>
<pre><code class="language-tsx">import { useSharedValue, withSpring } from 'react-native-reanimated';

function MyComponent() {
  const offset = useSharedValue(0);

  // Read/write from JS thread:
  console.log(offset.value);   // 0
  offset.value = 100;          // sets new value, triggers updates

  // From a worklet (runs on UI thread):
  function someWorklet() {
    'worklet';
    offset.value = withSpring(200);   // animates over time on UI thread
  }
}
</code></pre>
<p>SharedValue is reactive: changes trigger re-evaluation of any worklet that reads it (e.g., <code>useAnimatedStyle</code>).</p>

<h3>useAnimatedStyle — the styling primitive</h3>
<pre><code class="language-tsx">import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

function Box() {
  const offset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() =&gt; {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  return (
    &lt;&gt;
      &lt;Animated.View style={[styles.box, animatedStyle]} /&gt;
      &lt;Button title="Move" onPress={() =&gt; { offset.value = withSpring(150); }} /&gt;
    &lt;/&gt;
  );
}
</code></pre>
<p>The function passed to <code>useAnimatedStyle</code> is a worklet. It re-runs on the UI thread whenever any SharedValue it reads changes. The result becomes the <code>style</code> of the <code>Animated.View</code>.</p>

<h3>Animation primitives</h3>
<table>
  <thead><tr><th>Primitive</th><th>Behavior</th></tr></thead>
  <tbody>
    <tr><td><code>withTiming(target, { duration, easing })</code></td><td>Duration-based; standard tween</td></tr>
    <tr><td><code>withSpring(target, { damping, stiffness, mass, ... })</code></td><td>Physics-based; natural feel</td></tr>
    <tr><td><code>withDecay({ velocity, deceleration, clamp })</code></td><td>Inertia after gesture release</td></tr>
    <tr><td><code>withDelay(ms, animation)</code></td><td>Delay then run</td></tr>
    <tr><td><code>withSequence(a, b, c, ...)</code></td><td>Sequential</td></tr>
    <tr><td><code>withRepeat(animation, count, reverse)</code></td><td>Loop</td></tr>
    <tr><td><code>cancelAnimation(sharedValue)</code></td><td>Stop in-flight animation</td></tr>
  </tbody>
</table>

<h3>Composing animations</h3>
<pre><code class="language-tsx">// Sequence: move right, then up
offset.value = withSequence(
  withTiming(100, { duration: 200 }),
  withTiming(0, { duration: 200 })
);

// Repeat with reverse (alternating)
scale.value = withRepeat(
  withTiming(1.2, { duration: 300 }),
  -1,    // infinite
  true   // reverse
);

// Delayed
opacity.value = withDelay(500, withTiming(1, { duration: 300 }));
</code></pre>

<h3>useDerivedValue — computed SharedValues</h3>
<pre><code class="language-tsx">const x = useSharedValue(0);

const xSquared = useDerivedValue(() =&gt; {
  return x.value * x.value;
});
// xSquared.value updates whenever x.value updates; runs on UI thread
</code></pre>

<h3>The worklet directive</h3>
<pre><code class="language-js">function myFunction(arg) {
  'worklet';   // first statement; tells Babel plugin to extract for UI thread
  return arg * 2;
}
</code></pre>
<p>You usually don't write 'worklet' yourself — it's auto-applied to functions passed to Reanimated APIs (<code>useAnimatedStyle</code>, <code>useDerivedValue</code>, <code>useAnimatedReaction</code>, gesture handlers). Mark explicitly only for utilities you want to call from worklets.</p>

<h3>runOnJS — back to React-land</h3>
<pre><code class="language-tsx">import { runOnJS } from 'react-native-reanimated';

function showAlert() {
  Alert.alert('Done!');   // React / non-worklet API
}

const tap = Gesture.Tap()
  .onEnd(() =&gt; {
    'worklet';
    runOnJS(showAlert)();   // marshal call back to JS thread
  });
</code></pre>
<p>You need <code>runOnJS</code> when you want to call a React handler / async function / setState from inside a worklet.</p>

<h3>runOnUI — fire-and-forget worklet from JS</h3>
<pre><code class="language-tsx">import { runOnUI } from 'react-native-reanimated';

function expensiveCalc() {
  'worklet';
  // do work on UI thread
  return result;
}

// From JS thread:
runOnUI(expensiveCalc)();   // fire on UI thread; result not awaitable
</code></pre>

<h3>useAnimatedReaction — react to value changes</h3>
<pre><code class="language-tsx">useAnimatedReaction(
  () =&gt; {
    return offset.value &gt; 100;   // dependency calculation (worklet)
  },
  (isOver100, prev) =&gt; {
    if (isOver100 &amp;&amp; !prev) {
      runOnJS(triggerHaptic)();
    }
  }
);
</code></pre>
<p>Reads SharedValues; second function called whenever the first's result changes. Both worklets.</p>

<h3>The gesture-handler partnership</h3>
<p>Reanimated and react-native-gesture-handler are designed together. Gestures emit events on the UI thread; you can write Reanimated worklets directly inside gesture handlers. The result: drag → animation pipeline that never crosses threads.</p>

<pre><code class="language-tsx">import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function Draggable() {
  const x = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange((e) =&gt; {
      x.value += e.changeX;
    })
    .onEnd(() =&gt; {
      x.value = withSpring(0);
    });

  const style = useAnimatedStyle(() =&gt; ({
    transform: [{ translateX: x.value }],
  }));

  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.box, style]} /&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Layout animations (Reanimated 3)</h3>
<pre><code class="language-tsx">import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

function List({ items }) {
  return (
    &lt;&gt;
      {items.map(item =&gt; (
        &lt;Animated.View
          key={item.id}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={Layout.springify()}   // FLIP-style reorder animation
        &gt;
          &lt;Text&gt;{item.text}&lt;/Text&gt;
        &lt;/Animated.View&gt;
      ))}
    &lt;/&gt;
  );
}
</code></pre>

<h3>SharedTransition (navigation)</h3>
<pre><code class="language-tsx">// Across screens
import { SharedTransition } from 'react-native-reanimated';

const transition = SharedTransition.duration(500);

// Screen A
&lt;Animated.View sharedTransitionTag="hero" sharedTransitionStyle={transition} /&gt;

// Screen B
&lt;Animated.View sharedTransitionTag="hero" sharedTransitionStyle={transition} /&gt;
// Element morphs from A's position to B's.
</code></pre>

<h3>The "no setState in worklets" rule</h3>
<p>You can't call React's <code>setState</code> from a worklet directly. If you need to update React state in response to a worklet, wrap with <code>runOnJS</code>:</p>
<pre><code class="language-tsx">const x = useSharedValue(0);

useAnimatedReaction(
  () =&gt; x.value &gt; 100,
  (over) =&gt; {
    if (over) runOnJS(setIsBig)(true);
  }
);
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Setup</h3>
<pre><code class="language-bash">yarn add react-native-reanimated react-native-gesture-handler
cd ios &amp;&amp; pod install
</code></pre>

<pre><code class="language-js">// babel.config.js — Reanimated plugin MUST be last
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
  ],
};
</code></pre>

<pre><code class="language-tsx">// App.tsx — wrap with GestureHandlerRootView
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    &lt;GestureHandlerRootView style={{ flex: 1 }}&gt;
      &lt;NavigationContainer&gt;...&lt;/NavigationContainer&gt;
    &lt;/GestureHandlerRootView&gt;
  );
}
</code></pre>

<h3>Basic animation — fade in on mount</h3>
<pre><code class="language-tsx">import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

function FadeBox() {
  const opacity = useSharedValue(0);

  useEffect(() =&gt; {
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const style = useAnimatedStyle(() =&gt; ({ opacity: opacity.value }));

  return &lt;Animated.View style={[styles.box, style]} /&gt;;
}
</code></pre>

<h3>Spring animation</h3>
<pre><code class="language-tsx">import { withSpring } from 'react-native-reanimated';

const scale = useSharedValue(1);

function press() {
  scale.value = withSpring(1.1, {
    damping: 10,
    stiffness: 100,
    mass: 1,
  });
}

function release() {
  scale.value = withSpring(1);
}

const style = useAnimatedStyle(() =&gt; ({
  transform: [{ scale: scale.value }],
}));
</code></pre>

<h3>Pan gesture with snap-back</h3>
<pre><code class="language-tsx">import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function DraggableCard() {
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange((e) =&gt; {
      x.value += e.changeX;
      y.value += e.changeY;
    })
    .onEnd(() =&gt; {
      x.value = withSpring(0);
      y.value = withSpring(0);
    });

  const style = useAnimatedStyle(() =&gt; ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
    ],
  }));

  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.card, style]} /&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Pan with velocity-based decay</h3>
<pre><code class="language-tsx">import { withDecay } from 'react-native-reanimated';

const pan = Gesture.Pan()
  .onChange((e) =&gt; {
    x.value += e.changeX;
  })
  .onEnd((e) =&gt; {
    x.value = withDecay({
      velocity: e.velocityX,
      deceleration: 0.998,
      clamp: [-200, 200],
    });
  });
</code></pre>

<h3>Swipe-to-dismiss</h3>
<pre><code class="language-tsx">function Swipeable({ onDismiss }: { onDismiss: () =&gt; void }) {
  const x = useSharedValue(0);
  const screenWidth = Dimensions.get('window').width;

  const pan = Gesture.Pan()
    .onChange((e) =&gt; {
      x.value += e.changeX;
    })
    .onEnd((e) =&gt; {
      const shouldDismiss = Math.abs(x.value) &gt; screenWidth * 0.4 || Math.abs(e.velocityX) &gt; 800;
      if (shouldDismiss) {
        x.value = withTiming(
          x.value &gt; 0 ? screenWidth : -screenWidth,
          { duration: 200 },
          (finished) =&gt; {
            if (finished) runOnJS(onDismiss)();
          }
        );
      } else {
        x.value = withSpring(0);
      }
    });

  const style = useAnimatedStyle(() =&gt; ({
    transform: [{ translateX: x.value }],
    opacity: 1 - Math.abs(x.value) / screenWidth,
  }));

  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.card, style]} /&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Pinch-to-zoom</h3>
<pre><code class="language-tsx">const scale = useSharedValue(1);
const savedScale = useSharedValue(1);

const pinch = Gesture.Pinch()
  .onUpdate((e) =&gt; {
    scale.value = savedScale.value * e.scale;
  })
  .onEnd(() =&gt; {
    savedScale.value = scale.value;
  });

const style = useAnimatedStyle(() =&gt; ({
  transform: [{ scale: scale.value }],
}));
</code></pre>

<h3>Compose gestures (pan + pinch)</h3>
<pre><code class="language-tsx">const composed = Gesture.Simultaneous(pan, pinch);

return (
  &lt;GestureDetector gesture={composed}&gt;
    &lt;Animated.View ... /&gt;
  &lt;/GestureDetector&gt;
);

// Other compositions:
//   Gesture.Race(a, b) — first to start wins
//   Gesture.Exclusive(a, b) — sequential exclusive
</code></pre>

<h3>useAnimatedScrollHandler — scroll-driven</h3>
<pre><code class="language-tsx">import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';

function HeaderShrink() {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) =&gt; {
      scrollY.value = e.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() =&gt; ({
    height: interpolate(scrollY.value, [0, 200], [120, 60], 'clamp'),
    opacity: interpolate(scrollY.value, [0, 100, 200], [1, 0.5, 0], 'clamp'),
  }));

  return (
    &lt;&gt;
      &lt;Animated.View style={[styles.header, headerStyle]} /&gt;
      &lt;Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}&gt;
        ...
      &lt;/Animated.ScrollView&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h3>interpolate — map ranges</h3>
<pre><code class="language-tsx">// Linear interpolation
interpolate(value, [0, 100], [0, 1]);          // value 50 → 0.5
interpolate(value, [0, 50, 100], [0, 1, 0]);   // value 50 → 1 (peak); 0 or 100 → 0
interpolate(value, [0, 100], [0, 1], 'clamp'); // values outside range clamped

// Color interpolation (separate function)
import { interpolateColor } from 'react-native-reanimated';
const bg = interpolateColor(progress.value, [0, 1], ['#fff', '#000']);
</code></pre>

<h3>Layout animation — list items</h3>
<pre><code class="language-tsx">import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft, Layout, LinearTransition } from 'react-native-reanimated';

function TodoList({ todos }) {
  return (
    &lt;&gt;
      {todos.map(t =&gt; (
        &lt;Animated.View
          key={t.id}
          entering={SlideInRight.duration(200)}
          exiting={SlideOutLeft.duration(200)}
          layout={LinearTransition.springify()}
        &gt;
          &lt;Text&gt;{t.text}&lt;/Text&gt;
        &lt;/Animated.View&gt;
      ))}
    &lt;/&gt;
  );
}
</code></pre>

<h3>Custom layout animation</h3>
<pre><code class="language-tsx">import { withSpring } from 'react-native-reanimated';

const customEntering = (targetValues) =&gt; {
  'worklet';
  return {
    initialValues: {
      opacity: 0,
      transform: [{ scale: 0.5 }],
    },
    animations: {
      opacity: withSpring(1),
      transform: [{ scale: withSpring(1) }],
    },
  };
};

&lt;Animated.View entering={customEntering} /&gt;
</code></pre>

<h3>Animation completion callback</h3>
<pre><code class="language-tsx">offset.value = withSpring(100, { damping: 10 }, (finished, current) =&gt; {
  'worklet';
  if (finished) {
    runOnJS(onComplete)();
  }
});
</code></pre>

<h3>Shared value to React state (read-only)</h3>
<pre><code class="language-tsx">// Use case: keyboard input or React UI needs to read SharedValue
const x = useSharedValue(0);
const [xState, setXState] = useState(0);

useAnimatedReaction(
  () =&gt; x.value,
  (val) =&gt; {
    runOnJS(setXState)(val);
  }
);
</code></pre>
<p>Use sparingly — defeats the purpose of staying off the JS thread. Better: keep the value as SharedValue and consume via useAnimatedStyle / useAnimatedProps.</p>

<h3>useAnimatedProps — for props (not just style)</h3>
<pre><code class="language-tsx">import { useAnimatedProps } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function ProgressText() {
  const progress = useSharedValue(0);

  const animatedProps = useAnimatedProps(() =&gt; {
    return {
      text: \`\${Math.round(progress.value * 100)}%\`,   // animated text content
    };
  });

  return &lt;AnimatedTextInput animatedProps={animatedProps} editable={false} /&gt;;
}
</code></pre>

<h3>SharedTransition (across screens)</h3>
<pre><code class="language-tsx">import { SharedTransition, withSpring } from 'react-native-reanimated';

const transition = SharedTransition.custom((values) =&gt; {
  'worklet';
  return {
    height: withSpring(values.targetHeight),
    width: withSpring(values.targetWidth),
    originX: withSpring(values.targetOriginX),
    originY: withSpring(values.targetOriginY),
  };
});

// Screen A
&lt;Animated.View sharedTransitionTag="hero-1" sharedTransitionStyle={transition}&gt;
  &lt;Image ... /&gt;
&lt;/Animated.View&gt;

// Screen B
&lt;Animated.View sharedTransitionTag="hero-1" sharedTransitionStyle={transition}&gt;
  &lt;Image ... /&gt;
&lt;/Animated.View&gt;
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Press-to-grow button</h3>
<pre><code class="language-tsx">function PressButton({ onPress, children }) {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .onBegin(() =&gt; {
      scale.value = withSpring(0.95);
    })
    .onFinalize(() =&gt; {
      scale.value = withSpring(1);
    })
    .onEnd(() =&gt; {
      runOnJS(onPress)();
    });

  const style = useAnimatedStyle(() =&gt; ({ transform: [{ scale: scale.value }] }));

  return (
    &lt;GestureDetector gesture={tap}&gt;
      &lt;Animated.View style={[styles.button, style]}&gt;{children}&lt;/Animated.View&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Example 2: Bottom sheet drag</h3>
<pre><code class="language-tsx">function BottomSheet() {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

  const open = () =&gt; { translateY.value = withSpring(SCREEN_HEIGHT - SHEET_HEIGHT); };
  const close = () =&gt; { translateY.value = withSpring(SCREEN_HEIGHT); };

  const pan = Gesture.Pan()
    .onChange((e) =&gt; {
      translateY.value += e.changeY;
    })
    .onEnd((e) =&gt; {
      const shouldClose = e.velocityY &gt; 500 || translateY.value &gt; SCREEN_HEIGHT - SHEET_HEIGHT * 0.5;
      if (shouldClose) close();
      else open();
    });

  const style = useAnimatedStyle(() =&gt; ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.sheet, style]}&gt;...&lt;/Animated.View&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Example 3: Pull-to-refresh with custom indicator</h3>
<pre><code class="language-tsx">function PullToRefresh() {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) =&gt; { scrollY.value = e.contentOffset.y; },
  });

  const indicatorStyle = useAnimatedStyle(() =&gt; ({
    height: interpolate(scrollY.value, [-100, 0], [100, 0], 'clamp'),
    opacity: interpolate(scrollY.value, [-100, 0], [1, 0], 'clamp'),
    transform: [{ rotate: \`\${interpolate(scrollY.value, [-100, 0], [180, 0], 'clamp')}deg\` }],
  }));

  return (
    &lt;&gt;
      &lt;Animated.View style={[styles.indicator, indicatorStyle]}&gt;
        &lt;Text&gt;Pull to refresh&lt;/Text&gt;
      &lt;/Animated.View&gt;
      &lt;Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}&gt;...&lt;/Animated.ScrollView&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h3>Example 4: Tinder-style swipe cards</h3>
<pre><code class="language-tsx">function SwipeCard({ onSwipe }: { onSwipe: (dir: 'left' | 'right') =&gt; void }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

  const pan = Gesture.Pan()
    .onChange((e) =&gt; {
      x.value += e.changeX;
      y.value += e.changeY;
    })
    .onEnd((e) =&gt; {
      const direction = x.value &gt; SWIPE_THRESHOLD ? 'right' : x.value &lt; -SWIPE_THRESHOLD ? 'left' : null;
      if (direction) {
        x.value = withTiming(direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5, { duration: 250 }, (f) =&gt; {
          if (f) runOnJS(onSwipe)(direction);
        });
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });

  const style = useAnimatedStyle(() =&gt; ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: \`\${interpolate(x.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-15, 15])}deg\` },
    ],
  }));

  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.card, style]} /&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Example 5: Animated tab bar indicator</h3>
<pre><code class="language-tsx">function TabBar({ tabs, activeIndex, onSelect }) {
  const indicatorX = useSharedValue(0);
  const TAB_WIDTH = SCREEN_WIDTH / tabs.length;

  useEffect(() =&gt; {
    indicatorX.value = withSpring(activeIndex * TAB_WIDTH, { damping: 15, stiffness: 100 });
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() =&gt; ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    &lt;&gt;
      &lt;View style={styles.tabRow}&gt;
        {tabs.map((tab, i) =&gt; (
          &lt;Pressable key={tab} style={{ width: TAB_WIDTH }} onPress={() =&gt; onSelect(i)}&gt;
            &lt;Text&gt;{tab}&lt;/Text&gt;
          &lt;/Pressable&gt;
        ))}
      &lt;/View&gt;
      &lt;Animated.View style={[styles.indicator, { width: TAB_WIDTH }, indicatorStyle]} /&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h3>Example 6: Loading dots</h3>
<pre><code class="language-tsx">function LoadingDots() {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() =&gt; {
    const animate = (val: SharedValue&lt;number&gt;) =&gt; {
      val.value = withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
        -1
      );
    };
    animate(dot1);
    setTimeout(() =&gt; animate(dot2), 150);
    setTimeout(() =&gt; animate(dot3), 300);
  }, []);

  const dot = (val: SharedValue&lt;number&gt;) =&gt; useAnimatedStyle(() =&gt; ({ opacity: val.value }));

  return (
    &lt;View style={styles.row}&gt;
      &lt;Animated.View style={[styles.dot, dot(dot1)]} /&gt;
      &lt;Animated.View style={[styles.dot, dot(dot2)]} /&gt;
      &lt;Animated.View style={[styles.dot, dot(dot3)]} /&gt;
    &lt;/View&gt;
  );
}
</code></pre>

<h3>Example 7: List item enter/exit/reorder</h3>
<pre><code class="language-tsx">import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

function TodoList({ todos }) {
  return (
    &lt;Animated.FlatList
      data={todos}
      keyExtractor={t =&gt; t.id}
      renderItem={({ item }) =&gt; (
        &lt;Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition.duration(200)}
          style={styles.row}
        &gt;
          &lt;Text&gt;{item.text}&lt;/Text&gt;
        &lt;/Animated.View&gt;
      )}
      itemLayoutAnimation={LinearTransition}
    /&gt;
  );
}
</code></pre>

<h3>Example 8: Color interpolation (theme switch)</h3>
<pre><code class="language-tsx">function ThemedBox({ isDark }: { isDark: boolean }) {
  const progress = useSharedValue(isDark ? 1 : 0);

  useEffect(() =&gt; {
    progress.value = withTiming(isDark ? 1 : 0, { duration: 300 });
  }, [isDark]);

  const style = useAnimatedStyle(() =&gt; ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#ffffff', '#1a1a1a']),
  }));

  return &lt;Animated.View style={[styles.box, style]} /&gt;;
}
</code></pre>

<h3>Example 9: Drag-and-drop reordering</h3>
<pre><code class="language-tsx">function DraggableRow({ index, onSwap }: { index: number; onSwap: (from: number, to: number) =&gt; void }) {
  const y = useSharedValue(0);

  const pan = Gesture.Pan()
    .activateAfterLongPress(300)
    .onChange((e) =&gt; {
      y.value += e.changeY;
    })
    .onEnd(() =&gt; {
      const movedRows = Math.round(y.value / ROW_HEIGHT);
      if (movedRows !== 0) {
        runOnJS(onSwap)(index, index + movedRows);
      }
      y.value = withSpring(0);
    });

  const style = useAnimatedStyle(() =&gt; ({ transform: [{ translateY: y.value }] }));

  return (
    &lt;GestureDetector gesture={pan}&gt;
      &lt;Animated.View style={[styles.row, style]}&gt;...&lt;/Animated.View&gt;
    &lt;/GestureDetector&gt;
  );
}
</code></pre>

<h3>Example 10: Animated progress ring</h3>
<pre><code class="language-tsx">import Svg, { Circle } from 'react-native-svg';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({ progress }: { progress: number }) {
  const animatedProgress = useSharedValue(0);

  useEffect(() =&gt; {
    animatedProgress.value = withTiming(progress, { duration: 600 });
  }, [progress]);

  const RADIUS = 50;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const animatedProps = useAnimatedProps(() =&gt; ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  return (
    &lt;Svg width={120} height={120}&gt;
      &lt;Circle cx={60} cy={60} r={RADIUS} stroke="#eee" strokeWidth={8} fill="none" /&gt;
      &lt;AnimatedCircle
        cx={60} cy={60} r={RADIUS}
        stroke="#0a84ff" strokeWidth={8} fill="none"
        strokeDasharray={CIRCUMFERENCE}
        animatedProps={animatedProps}
      /&gt;
    &lt;/Svg&gt;
  );
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Worklet captures stale closure values</h3>
<pre><code class="language-tsx">function Comp({ value }) {
  // BAD — value is captured at definition time; stale on re-renders
  const tap = Gesture.Tap()
    .onEnd(() =&gt; {
      'worklet';
      console.log(value);   // stale!
    });
}
// FIX — pass via SharedValue or capture explicitly via deps
</code></pre>

<h3>Calling React hooks inside worklets</h3>
<p>Forbidden. Hooks live in React context. From a worklet, marshal to JS via runOnJS.</p>

<h3>Babel plugin order</h3>
<p>Reanimated's Babel plugin must be the LAST plugin in <code>babel.config.js</code>. Otherwise worklet extraction breaks.</p>

<h3>Forgetting to wrap with GestureHandlerRootView</h3>
<p>Without it, gestures don't propagate. Always wrap your root component.</p>

<h3>Animated.createAnimatedComponent for non-RN-core components</h3>
<p>To animate <code>react-native-svg</code>'s <code>Circle</code>, you need <code>Animated.createAnimatedComponent(Circle)</code>. Same for any third-party native component you want to animate.</p>

<h3>Reading SharedValue from a render</h3>
<pre><code class="language-tsx">// BAD — reads .value during render; not reactive
return &lt;Text&gt;{x.value}&lt;/Text&gt;;

// GOOD — use useDerivedValue + animated text
const animatedProps = useAnimatedProps(() =&gt; ({ text: \`\${x.value}\` }));
return &lt;AnimatedTextInput animatedProps={animatedProps} editable={false} /&gt;;
</code></pre>

<h3>Spring that never settles</h3>
<p>Spring with bad parameters (very low damping) oscillates forever. Test with realistic values; consider <code>overshootClamping: true</code> to prevent overshoot.</p>

<h3>Memory leaks from animation in unmounted components</h3>
<p>useEffect cleanup should cancel animations:</p>
<pre><code class="language-tsx">useEffect(() =&gt; {
  return () =&gt; {
    cancelAnimation(offset);
  };
}, []);
</code></pre>

<h3>SharedValue + StrictMode double-fires</h3>
<p>React 18 StrictMode runs effects twice in dev. Animations may stack. Always cancel previous before starting new.</p>

<h3>useAnimatedStyle returning conditional shapes</h3>
<pre><code class="language-tsx">// BAD — sometimes returns { opacity }, sometimes { transform }; React Native complains
useAnimatedStyle(() =&gt; {
  if (cond) return { opacity: x.value };
  return { transform: [{ translateX: x.value }] };
});

// GOOD — return same shape always
useAnimatedStyle(() =&gt; ({
  opacity: cond ? x.value : 1,
  transform: [{ translateX: cond ? 0 : x.value }],
}));
</code></pre>

<h3>Worklet referencing component-scoped functions</h3>
<p>If you reference a regular function from a worklet, it might not be marked as worklet. Either mark it explicitly with 'worklet' directive, or define it inside the worklet.</p>

<h3>Web support gaps</h3>
<p>Reanimated has React Native Web support, but layout animations and SharedTransition are partial. Test in your specific scenario.</p>

<h3>Performance: too many SharedValues</h3>
<p>Hundreds of SharedValues each driving a useAnimatedStyle is fine. Thousands can cause overhead. Profile.</p>

<h3>Gesture conflict between gestures</h3>
<p>Pan inside ScrollView fights with scroll. Use <code>simultaneousWithExternalGesture</code> or <code>requireExternalGestureToFail</code> to express precedence.</p>

<h3>iOS bounce affecting drag</h3>
<p>Drag inside a ScrollView with bounce can produce weird velocities. Test on physical iPhone; consider disabling bounce for the drag area.</p>

<h3>Layout animations + FlatList</h3>
<p>FlatList recycles views; <code>entering</code>/<code>exiting</code> can fire on recycled cells. Use <code>itemLayoutAnimation</code> on the FlatList itself, or use Animated.FlatList for proper handling.</p>

<h3>Dimensions changes (rotation)</h3>
<p>SharedValues holding screen-width-based positions become wrong on rotation. Listen to dimensions changes and update or use percentage-based interpolation.</p>

<h3>Animated.event (legacy) vs useAnimatedScrollHandler</h3>
<p>Reanimated 3 prefers useAnimatedScrollHandler. Don't mix with the legacy Animated.event API — they don't share threads.</p>

<h3>Hermes vs JSC — both support Reanimated</h3>
<p>Hermes is the default since RN 0.70. Reanimated supports both; the worklet runtime is engine-agnostic.</p>

<h3>"Reanimated 1" code in tutorials</h3>
<p>Old tutorials use deprecated APIs. Reanimated 3 is the current; check the docs version. Reanimated 1 is removed.</p>

<h3>The "TypeScript can't infer my style" warning</h3>
<p>useAnimatedStyle's return type sometimes doesn't satisfy ViewStyle. Cast carefully or specify return type explicitly.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: setState inside worklet</h3>
<pre><code class="language-tsx">// BAD — throws; setState is JS-thread only
const tap = Gesture.Tap().onEnd(() =&gt; {
  setCount(c =&gt; c + 1);   // ❌
});

// GOOD
const tap = Gesture.Tap().onEnd(() =&gt; {
  runOnJS(setCount)(count + 1);
});
</code></pre>

<h3>Bug 2: Calling React hooks inside worklets</h3>
<pre><code class="language-tsx">// BAD — hooks rule violated
const handler = (e) =&gt; {
  'worklet';
  const dispatch = useDispatch();   // ❌
};
</code></pre>

<h3>Bug 3: Forgetting to add Reanimated Babel plugin</h3>
<p>Without the plugin, worklets don't get extracted; everything runs on the JS thread. Symptoms: animations laggy, gestures choppy. Check babel.config.js.</p>

<h3>Bug 4: SharedValue reads during render</h3>
<pre><code class="language-tsx">// BAD — non-reactive; doesn't trigger re-render
return &lt;Text&gt;{offset.value}&lt;/Text&gt;;

// GOOD — animated text
const animatedProps = useAnimatedProps(() =&gt; ({ text: \`\${offset.value}\` }));
</code></pre>

<h3>Bug 5: Capturing component state in worklet</h3>
<pre><code class="language-tsx">function Comp() {
  const [count, setCount] = useState(0);
  const tap = Gesture.Tap().onEnd(() =&gt; {
    'worklet';
    console.log(count);   // stale closure
  });
}
// FIX — pass via SharedValue
const countSV = useSharedValue(0);
useEffect(() =&gt; { countSV.value = count; }, [count]);
</code></pre>

<h3>Bug 6: Wrong order of Babel plugins</h3>
<pre><code class="language-js">// BAD — Reanimated plugin not last
plugins: [
  'react-native-reanimated/plugin',
  'other-plugin',   // runs after Reanimated
]

// GOOD — Reanimated last
plugins: [
  'other-plugin',
  'react-native-reanimated/plugin',
]
</code></pre>

<h3>Bug 7: Mixing Animated and Reanimated</h3>
<p>Mixing the legacy Animated API with Reanimated SharedValues on the same component leads to weird behavior — they don't share threads. Pick one per component.</p>

<h3>Bug 8: useAnimatedStyle returning new shape conditionally</h3>
<p>Returning <code>{ opacity }</code> sometimes and <code>{ transform }</code> other times confuses RN's view manager. Always return the same shape.</p>

<h3>Bug 9: Forgetting to cancel on unmount</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  offset.value = withSpring(100);
  // forgot return cleanup
}, []);

// FIX
useEffect(() =&gt; {
  offset.value = withSpring(100);
  return () =&gt; cancelAnimation(offset);
}, []);
</code></pre>

<h3>Bug 10: Using <code>scrollEventThrottle: 0</code></h3>
<p>Default is 0 which means "every frame." On iOS, <code>onScroll</code> is throttled by the platform; on Android, <code>scrollEventThrottle: 16</code> is the recommended value for smooth interpolation. Set explicitly.</p>

<h3>Anti-pattern 1: Worklet for trivial animation</h3>
<p>A 200ms fade-in doesn't need Reanimated complexity. Use the built-in Animated API or a simple timing.</p>

<h3>Anti-pattern 2: One mega-worklet</h3>
<p>Stuffing all animation logic into one giant useAnimatedStyle. Decompose; smaller worklets are easier to debug and don't block one another.</p>

<h3>Anti-pattern 3: Avoiding runOnJS</h3>
<p>Sometimes you must update React state. <code>runOnJS</code> is fine; use it. Avoiding it leads to convoluted SharedValue + useEffect bridges.</p>

<h3>Anti-pattern 4: Skipping Layout animations</h3>
<p>The built-in <code>entering</code>/<code>exiting</code>/<code>layout</code> props handle 90% of mount/unmount/reorder cases. Don't hand-roll FLIP unless you have a specific need.</p>

<h3>Anti-pattern 5: Not testing on physical devices</h3>
<p>Reanimated benefits show on real devices. Simulators / emulators may not reveal jank that physical devices do.</p>

<h3>Anti-pattern 6: Animating layout-affecting properties</h3>
<p>Even on the UI thread, animating <code>height</code> / <code>width</code> triggers Yoga layout. Prefer transform / opacity for the same compositor-only benefit.</p>

<h3>Anti-pattern 7: Massive SharedValue trees</h3>
<p>Hundreds of SharedValues each driving a useAnimatedStyle is fine. Thousands cause overhead. Combine related values into single objects when reasonable.</p>

<h3>Anti-pattern 8: Using outdated tutorials</h3>
<p>Many tutorials show Reanimated 1 or 2 syntax. Always cross-check against the v3 docs.</p>

<h3>Anti-pattern 9: Importing wrong</h3>
<pre><code class="language-tsx">// Wrong — old default-export style
import Animated from 'react-native-reanimated/Animated';

// Right
import Animated, { useSharedValue, ... } from 'react-native-reanimated';
</code></pre>

<h3>Anti-pattern 10: Skipping reduced-motion</h3>
<p>iOS's "Reduce Motion" should be respected. Reanimated doesn't auto-honor it; check via <code>AccessibilityInfo.isReduceMotionEnabled()</code> and adjust durations / disable.</p>
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
    <tr><td><em>What's a worklet?</em></td><td>A JS function marked with 'worklet' that runs on the UI thread.</td></tr>
    <tr><td><em>What's SharedValue?</em></td><td>A reactive value readable/writable across JS and UI threads.</td></tr>
    <tr><td><em>useAnimatedStyle vs StyleSheet?</em></td><td>useAnimatedStyle returns reactive styles tied to SharedValues; runs on UI thread.</td></tr>
    <tr><td><em>withSpring vs withTiming?</em></td><td>withSpring is physics; withTiming is duration. Spring feels native; timing is predictable.</td></tr>
    <tr><td><em>What's runOnJS?</em></td><td>Marshals a function call from worklet (UI thread) back to JS thread.</td></tr>
    <tr><td><em>Why is the UI thread important?</em></td><td>Animations and gestures run smoothly even when JS is busy.</td></tr>
    <tr><td><em>How does Reanimated 3 differ from Reanimated 2?</em></td><td>Default UI-thread, layout animations, shared transitions, no v1 legacy.</td></tr>
    <tr><td><em>How do you handle gestures?</em></td><td>react-native-gesture-handler + Reanimated worklets — both run on UI thread, never crossing JS.</td></tr>
    <tr><td><em>What's a layout animation?</em></td><td>Declarative <code>entering</code>/<code>exiting</code>/<code>layout</code> props for mount/unmount/reorder.</td></tr>
    <tr><td><em>Why animate transform/opacity?</em></td><td>Compositor / native-renderer fast paths; layout properties trigger Yoga.</td></tr>
    <tr><td><em>How do you debug worklet behavior?</em></td><td>Reanimated devtools, console.log inside worklets (works), or runOnJS to log values.</td></tr>
    <tr><td><em>When would you NOT use Reanimated?</em></td><td>Simple LayoutAnimation cases; very small apps; web-only projects.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Build a press-to-grow button with withSpring.</li>
  <li>Build a draggable card with snap-back.</li>
  <li>Build swipe-to-dismiss with velocity check + runOnJS.</li>
  <li>Build a scroll-driven shrinking header.</li>
  <li>Add layout animations to a FlatList.</li>
  <li>Build an animated tab bar indicator.</li>
  <li>Build pinch-to-zoom with Gesture.Simultaneous.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li><code>setState</code> inside worklet — wrap with runOnJS.</li>
  <li>Reading <code>offset.value</code> in render — not reactive; use animated component.</li>
  <li>Stale closure capturing component state — pass via SharedValue.</li>
  <li>Reanimated plugin not last in babel.config.js — worklets not extracted.</li>
  <li>Animation not cancelled on unmount — memory issue.</li>
  <li>Mixing Animated and Reanimated — different threads, conflict.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Two-thread mental model</td><td>You distinguish JS thread vs UI thread; you place each piece of code correctly.</td></tr>
    <tr><td>Worklet fluency</td><td>You write worklets without confusion; you know runOnJS / runOnUI.</td></tr>
    <tr><td>SharedValue discipline</td><td>You use it for cross-thread state; you don't read .value in render.</td></tr>
    <tr><td>Gesture integration</td><td>You compose gestures + animations on the UI thread.</td></tr>
    <tr><td>Animation primitives</td><td>You pick withSpring vs withTiming based on feel.</td></tr>
    <tr><td>Layout animations</td><td>You use the built-in <code>entering</code>/<code>exiting</code>/<code>layout</code> before hand-rolling.</td></tr>
    <tr><td>Cross-platform</td><td>You can compare to web (CSS, WAAPI) and native iOS/Android.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>This entire topic is mobile-specific.</strong> Reanimated is the RN animation library.</li>
  <li><strong>Senior signal:</strong> understanding the JS-thread vs UI-thread separation. Many candidates only know "useNativeDriver"; fewer can articulate the worklet model.</li>
  <li><strong>Discord-tier interviewers</strong> (Discord, Airbnb, Linear, Robinhood, Coinbase, Apple) probe Reanimated knowledge specifically — they ship animation-heavy apps.</li>
  <li><strong>Performance reasoning:</strong> "why is this animation choppy?" → "the JS thread is busy; the animation isn't on the UI thread."</li>
  <li><strong>The new RN architecture (Fabric)</strong> changes some details but the worklet model persists. Reanimated 3 was rebuilt for the new architecture.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"What happens to a worklet when the JS thread is blocked?"</em> — It keeps running on the UI thread. The UI continues responding to gestures and animations even if JS is doing 5-second-long heavy work.</li>
  <li><em>"How does the Babel plugin work?"</em> — It identifies functions marked 'worklet', extracts them, serializes their closures, and replaces them with calls into the Reanimated runtime that knows how to invoke them on the UI thread.</li>
  <li><em>"What's the difference between <code>useAnimatedStyle</code> and <code>useDerivedValue</code>?"</em> — useAnimatedStyle returns a style object (consumed by Animated.View). useDerivedValue returns a SharedValue (consumed by other worklets / styles). Same underlying mechanism.</li>
  <li><em>"How does <code>withSpring</code> integrate with gesture velocity?"</em> — Gesture handlers report <code>velocityX</code>/<code>velocityY</code> on release; <code>withSpring(target, { velocity: e.velocityX })</code> seeds the spring's initial velocity, producing fling-style natural physics.</li>
  <li><em>"Why doesn't Reanimated need <code>useNativeDriver</code>?"</em> — It runs on the UI thread by design; "native driver" is a legacy concept from the original Animated API. Reanimated's whole architecture replaces it.</li>
  <li><em>"How would you implement an iOS-style sheet drag?"</em> — Pan gesture; SharedValue for translateY; withSpring on release; check velocity to decide snap-up vs snap-down; useAnimatedStyle to apply.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit existing animations: are they on Reanimated 3? Anything still using the legacy Animated API?</li>
  <li>Verify Babel plugin is correctly configured.</li>
  <li>Check that GestureHandlerRootView wraps the app.</li>
  <li>Identify mount/unmount animations that could use built-in layout animations.</li>
  <li>Profile animation hot paths on a real low-end Android device.</li>
  <li>Add reduced-motion handling.</li>
  <li>Document team conventions: when to use Reanimated vs simpler alternatives.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd build a small set of reusable gesture-animation hooks (useDraggable, useSwipeable, usePinchZoom)."</li>
  <li>"I'd add SharedTransitions to our top 3 navigation flows for a more native feel."</li>
  <li>"I'd integrate the Reanimated devtools into our dev builds for animation debugging."</li>
  <li>"I'd benchmark our drag interactions on Pixel 4a to validate UI-thread execution."</li>
  <li>"I'd add a layer of reduced-motion fallbacks across all components for accessibility."</li>
</ul>
`
    }
  ]
});
