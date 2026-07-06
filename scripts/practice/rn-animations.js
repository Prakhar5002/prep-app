/* Practice challenges — RN Deep Dives: Animations & Gestures */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-anim-animated-vs-reanimated', track: 'rn', category: 'rn-animations',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'When would you actually reach for the legacy Animated API over Reanimated in a new RN screen, and where structurally does Animated\'s performance ceiling come from?',
    answer: {
      core: `<code>Animated</code> describes an animation as a static configuration (from/to/duration/easing) that, with <code>useNativeDriver: true</code>, gets handed to the native side up front so per-frame interpolation runs natively instead of round-tripping through JS every frame. Reanimated instead compiles your animation logic into a <strong>worklet</strong> that runs directly on the UI thread via JSI, so both "what should happen" and "run it every frame" happen off the JS thread entirely, with no restriction to a fixed property whitelist. Reach for plain <code>Animated</code> only for simple, one-shot transform/opacity animations where you don't want the Reanimated + worklets native dependency in the project at all; anything gesture-driven, or that needs per-frame conditional logic, is Reanimated's job.`,
      mechanism: `The native driver's real constraint is which properties it can apply: it can only push updates directly onto a small set of view properties (transform, opacity, and a handful of others) that don't require a Yoga layout pass, since native has to apply the interpolated value directly without re-running JS. Anything outside that set (width/height/color-driven layout changes) still updates via <code>requestAnimationFrame</code> callbacks on the JS thread, calling <code>setNativeProps</code> once per frame — so a busy JS thread visibly stalls that specific animation. Reanimated's worklets sidestep this distinction entirely: a worklet is a JS function extracted at build time by a Babel plugin so it can be shipped to, and executed on, a second JS runtime pinned to the UI thread, with direct JSI access to <strong>shared values</strong> — so per-frame execution never depends on the main JS thread being free, regardless of which style property is being animated.`,
      tradeoffs: `Reanimated isn't free: it's an added native dependency, a Babel plugin in your build pipeline, and — as of Reanimated 4 — a hard requirement on the New Architecture. A team stuck on the legacy architecture for migration-debt reasons is capped at Reanimated 3 and can't adopt Reanimated 4's features until that migration lands. For a genuinely trivial fade-in/fade-out one-shot animation, <code>Animated</code> with <code>useNativeDriver: true</code> remains adequate and keeps the dependency surface smaller.`,
      followups: [
        { q: 'What specifically does useNativeDriver: true do, and why can\'t it be used for every animatable property?', a: 'It ships the fully-resolved animation config to native up front instead of driving updates from the JS thread frame-by-frame — but native can only apply it directly to a small set of properties (transform, opacity, a few others) that bypass Yoga layout. Width/height/color-driven layout changes still need the JS thread each frame, since the native-driver path doesn\'t participate in layout recalculation.' },
        { q: 'Could you build a continuously interactive drag/swipe animation using only the classic Animated API?', a: 'Only awkwardly — PanResponder plus Animated.event can wire raw touch deltas straight into an Animated.Value without a JS round trip per move, but any conditional, derived-from-multiple-values logic (snap points, velocity-based decisions) still needs the JS thread, since Animated has no worklet/UI-thread execution model. That\'s exactly why gesture-heavy interactions reach for Reanimated + Gesture Handler instead.' }
      ],
      redFlags: `Claiming "Animated is deprecated" (it still ships and is still the right call for simple one-shot fades); calling Reanimated "just Animated but faster" without naming the worklet/UI-thread execution model as the actual mechanism.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-anim-worklets-fundamentals', track: 'rn', category: 'rn-animations',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'What is a "worklet" in Reanimated terms, mechanically, and when did this execution model actually appear in the library\'s history?',
    answer: {
      core: `A worklet is a JS function that Reanimated's Babel plugin detects (via the <code>'worklet'</code> directive, or automatically for functions passed into Reanimated's own APIs) and compiles into a standalone form that can be shipped to, and executed on, a separate JS VM instance running on the UI thread — not the JS thread your React code runs on. This execution model was introduced in <strong>Reanimated 2 (2021)</strong>, not Reanimated 3. Reanimated 3 kept the worklet model and added new capabilities (layout animations, internals refactor); Reanimated 4 is the version that extracted the worklets machinery itself into a standalone <code>react-native-worklets</code> package and made the whole stack New-Architecture-only.`,
      mechanism: `The Babel plugin walks a marked function, captures whatever outer-scope variables it references into a serializable closure object, and produces an equivalent function the UI-thread runtime can reconstruct with those captured values available directly:
<pre><code class="language-js">function clamp(value, lower, upper) {
  'worklet';
  return Math.min(Math.max(value, lower), upper);
}</code></pre>
That "capture the closure at the point the worklet is created" step is exactly why stale-variable bugs happen: the worklet runtime doesn't share live memory with the JS thread's variables — it gets a value baked in at creation time, or a JSI shared-value reference if you explicitly pass one in. Once running on the UI thread, a worklet has direct JSI HostObject access to shared values, so reading/writing <code>.value</code> is a synchronous, in-process call rather than a bridge/queue hop, which is what makes worklets viable for genuine 60-120fps per-frame execution.`,
      tradeoffs: `Worklets aren't free JS — they run in a restricted runtime (plain JS language features plus whatever JSI-backed API surface Reanimated exposes), and any function called from inside one must itself be worklet-compatible or explicitly hopped to the other thread via <code>runOnJS</code>. Debugging a worklet also means debugging code that isn't necessarily attached to your main JS-thread debugger session the way ordinary component code is.`,
      followups: [
        { q: 'Can a worklet call an arbitrary imported JS function, like a date-formatting utility from npm?', a: 'Only if that function is itself worklet-compatible (pure, synchronous, no reliance on JS-thread-only globals) and gets processed by the Babel plugin or explicitly marked \'worklet\'. Most general-purpose npm utilities aren\'t authored with this in mind, so calling into them from a worklet either fails to run or has to be reimplemented as a worklet.' },
        { q: 'Is the Babel plugin still react-native-reanimated/plugin in the current version?', a: 'No — as of Reanimated 4 the worklets machinery (and its Babel plugin) moved into the standalone react-native-worklets package, so babel.config.js now points at \'react-native-worklets/plugin\' instead.' }
      ],
      redFlags: `Saying worklets "were introduced in Reanimated 3" (wrong — they're a Reanimated 2, 2021 concept); describing a worklet as "just a callback" without mentioning the separate-runtime/closure-serialization mechanism underneath it.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-anim-v4-worklets-split', track: 'rn', category: 'rn-animations',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'Reanimated 4 shipped a structural package split and a hard platform requirement. What changed concretely, and what happens if a team tries to adopt it on an old-architecture app?',
    answer: {
      core: `Two structural changes define Reanimated 4, which is the <strong>current</strong> major version (Reanimated 3 is not current — it's the maintained line for apps still on the legacy architecture): (1) the worklets runtime, thread-scheduling primitives, and Babel plugin were extracted out of <code>react-native-reanimated</code> into a standalone <code>react-native-worklets</code> package, so other libraries can build worklet-based features without depending on all of Reanimated; and (2) Reanimated 4 and react-native-worklets only support apps running the <strong>New Architecture</strong> — there is no legacy-bridge code path at all. An old-architecture app cannot install and run Reanimated 4; it must either finish its New Architecture migration first, or stay on Reanimated 3.x, which continues to support old architecture.`,
      mechanism: `<code>react-native-worklets</code> now owns the worklet runtime, thread-hop scheduling primitives, and the Babel transform previously bundled inside react-native-reanimated; react-native-reanimated becomes a consumer of that package, layered with its animation-specific APIs (shared values, useAnimatedStyle, layout animations). The New-Arch-only requirement isn't arbitrary: Reanimated 4 leans directly on JSI HostObjects for shared values and on Fabric's synchronous layout/measurement and commit-hook machinery for its new <strong>CSS Animations and Transitions</strong> API — a declarative, CSS-like layer (keyframes and transition properties expressed as style-adjacent config, alongside the existing imperative worklet API) that has no equivalent path under the legacy bridge:
<pre><code class="language-js">// Reanimated 4 CSS Animations — declarative, no manual worklet required
const styles = {
  fadeIn: {
    animationName: { from: { opacity: 0 }, to: { opacity: 1 } },
    animationDuration: '300ms',
  },
};</code></pre>
Because there's no bridgeless JSI runtime or Fabric shadow tree under the legacy architecture, there's no meaningful shim path here — unlike, say, old NativeModules, which keep working on New Arch via the interop layer.`,
      tradeoffs: `This is a forcing function, not a preference: teams on a legacy-architecture app that want Reanimated's latest features (CSS animations, ongoing performance work, new gesture APIs) are blocked until the New Architecture migration is actually finished. Reanimated 3.x isn't "deprecated legacy junk" in the meantime — it's the correctly-maintained old-arch-compatible line, for as long as any supported RN version still permits old architecture at all (increasingly moot given RN 0.82 removed the opt-out entirely).`,
      followups: [
        { q: 'If react-native-worklets is now a separate package, do other libraries get to use worklets without pulling in all of Reanimated?', a: 'Yes — that\'s the explicit motivation for the split: any library (a bespoke gesture or physics library, for instance) can depend on react-native-worklets directly for UI-thread-executable functions and scheduling primitives, without requiring Reanimated\'s full animation API surface as a dependency.' },
        { q: 'Does moving to Reanimated 4 change how existing v3-style shared-value/useAnimatedStyle code is written?', a: 'The call-site API for shared values and useAnimatedStyle is largely unchanged. What changes is the install shape (two packages instead of one, a different Babel plugin import path) and the availability of the new CSS Animations/Transitions layer alongside the existing worklet-based API.' }
      ],
      redFlags: `Calling Reanimated 3 "the current version" in 2026 (Reanimated 4 is current, and mandatory-New-Arch); claiming Reanimated 4 works on old architecture via some interop shim (it doesn't — there's no compatibility path here at all).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-anim-shared-values', track: 'rn', category: 'rn-animations',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Explain what a shared value actually is and how useAnimatedStyle turns changes to it into an on-screen style update, without ever touching the JS thread.',
    answer: {
      core: `A shared value, created by <code>useSharedValue</code>, is a JSI HostObject wrapping a mutable <code>.value</code> that both the JS thread and the UI thread can read and write directly and synchronously — it's the one piece of deliberately shared mutable state that breaks React's normal one-directional data flow, by design, for performance. <code>useAnimatedStyle</code> is a worklet that Reanimated re-runs on the UI thread whenever a shared value it reads changes, producing a plain style object applied straight to the underlying native view — no React re-render, no reconciliation, no JS thread involvement for that update.`,
      mechanism: `Reanimated tracks which shared values a useAnimatedStyle worklet reads the first time it runs, and re-invokes the worklet only when one of those tracked values changes — conceptually a reactive selector, implemented entirely inside the UI-thread JSI runtime, not via React's render cycle:
<pre><code class="language-js">const offset = useSharedValue(0);
const style = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],
}));
// from anywhere — a gesture callback, a timer, the JS thread:
offset.value = withSpring(200);</code></pre>
Mutating <code>offset.value</code> does not trigger a React re-render of the component; it directly notifies the UI-thread worklet runtime, which re-executes the useAnimatedStyle worklet and pushes the resulting style straight onto the native view. <code>useDerivedValue</code> extends the same model one level further: it computes a value from other shared values, also on the UI thread, as its own shared value — useful when several consumers (several useAnimatedStyle worklets) need the same derived number, so the derivation runs once instead of being duplicated per consumer.`,
      tradeoffs: `Because a shared value's mutation bypasses React state entirely, anything that needs a shared value's current progress to affect actual React render output (not just a style) — swapping which child renders based on animation progress, say — requires deliberately bridging back into React state via a listener and setState, which reintroduces exactly the JS-thread/render cost shared values were meant to avoid. Overusing that bridge defeats the point of using shared values in the first place.`,
      followups: [
        { q: 'Does reading sharedValue.value from a normal component body (not inside a worklet) trigger a re-render when it changes?', a: 'No — reading .value on the JS thread just returns the JSI-backed current value at that instant. It isn\'t wired into React\'s reactivity system, so a change to it never causes that component to re-render on its own.' },
        { q: 'When would you reach for useDerivedValue instead of computing the same expression inline inside useAnimatedStyle?', a: 'When multiple worklets need the same computed value — useDerivedValue computes it once as its own shared value that others can read, instead of recomputing the same derivation, per frame, inline in every style worklet that needs it.' }
      ],
      redFlags: `Saying useAnimatedStyle "returns a value React re-renders with" (it explicitly bypasses React's render/reconciliation path); treating a shared-value mutation as equivalent in cost or semantics to a setState call.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-anim-gesture-handler-integration', track: 'rn', category: 'rn-animations',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'How does react-native-gesture-handler\'s Gesture API actually hand touch data to a Reanimated worklet, and why does that pairing avoid the JS-thread latency a JS-driven PanResponder has?',
    answer: {
      core: `Gesture Handler recognizes and tracks native touch gestures (pan, pinch, tap, and so on) using its own native gesture recognizers, directly on the UI thread — entirely independent of whatever the JS thread is doing. When a Reanimated worklet is attached as a gesture callback (<code>.onUpdate((e) => { 'worklet'; ... })</code>), that per-touch-frame callback executes as a worklet on the same UI thread — so the full pipeline (native touch recognition → worklet-driven shared-value update → useAnimatedStyle re-render) never has to leave the UI thread for the interactive part of the gesture.`,
      mechanism: `<pre><code class="language-js">const pan = Gesture.Pan()
  .onUpdate((e) => {
    offset.value = e.translationX;
  })
  .onEnd(() => {
    offset.value = withSpring(0);
  });

// &lt;GestureDetector gesture={pan}&gt;
//   &lt;Animated.View style={animatedStyle} /&gt;
// &lt;/GestureDetector&gt;</code></pre>
Gesture Handler's callback methods are recognized by the Babel plugin and treated as worklets automatically, so mutating <code>offset.value</code> inside <code>.onUpdate</code> is a direct UI-thread JSI write, and the paired useAnimatedStyle worklet reacting to <code>offset</code> updates the native view on the same thread, same frame. Contrast this with <code>PanResponder</code> plus plain <code>Animated</code>: every touch-move is delivered to the JS thread first as a synthetic event, your JS handler runs, and only then (if using the native driver) is an update handed off natively — meaning a busy JS thread can visibly delay how "live" the gesture feels, in a way a fully worklet-driven gesture structurally cannot.`,
      tradeoffs: `This only holds for the steady-state per-frame handling. The moment a gesture callback needs to do something JS-thread-only — dispatch a Redux action, call a JS-only library, navigate — it has to explicitly hop via <code>runOnJS</code>, which reintroduces the latency/queueing the worklet was avoiding. The trick is keeping that hop off the hot per-frame path (call it once in onEnd, not on every onUpdate).`,
      followups: [
        { q: 'If a gesture\'s onUpdate callback calls a non-worklet JS function directly, without runOnJS, what happens?', a: 'It throws at runtime, or fails Babel\'s static analysis, because the callback runs on the UI-thread worklet runtime, which cannot directly invoke an ordinary JS-thread-only function — that requires an explicit runOnJS hop to marshal the call back to the JS thread.' },
        { q: 'Does using Gesture Handler at all require Reanimated?', a: 'No — Gesture Handler works standalone with plain JS callbacks, like a modernized PanResponder. You only get the "gesture logic never leaves the UI thread" benefit when the callbacks themselves are worklets, which is Reanimated\'s contribution to the pairing.' }
      ],
      redFlags: `Describing Gesture Handler as "just a wrapper around PanResponder" (it uses native gesture recognizers, not JS-thread synthetic touch events — the entire architectural point); assuming every gesture callback is automatically fast regardless of whether it's a worklet or a plain JS function.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-anim-thread-hops', track: 'rn', category: 'rn-animations',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'What do runOnJS and runOnUI actually do, and what changed about this API surface in Reanimated 4?',
    answer: {
      core: `<code>runOnJS</code> schedules a plain JS-thread function to run from worklet code executing on the UI thread — the common case being a gesture's onEnd worklet calling a JS-thread-only callback, dispatching state, or calling an API that isn't worklet-safe. <code>runOnUI</code> does the inverse: it schedules a worklet to run on the UI thread from JS-thread code. Both exist because the two runtimes don't share a call stack; crossing between them is always an explicit, scheduled hop, never a direct synchronous call. In Reanimated 4, <code>runOnJS</code>/<code>runOnUI</code> are <strong>deprecated</strong> in favor of <code>scheduleOnRN</code> and <code>scheduleOnUI</code>, now exposed from the react-native-worklets package directly — the old names still work for backward compatibility, but new code should use the renamed APIs.`,
      mechanism: `<pre><code class="language-js">// UI thread (inside a worklet) -> JS thread
const onGestureEnd = () => {
  'worklet';
  runOnJS(logGestureEnd)(finalOffset.value);   // deprecated name, still works
  // scheduleOnRN(logGestureEnd, finalOffset.value); // Reanimated 4 preferred name
};

// JS thread -> UI thread
runOnUI(() => {
  'worklet';
  offset.value = withTiming(0);
})();</code></pre>
Each hop is a scheduled, asynchronous message, not a synchronous call — <code>runOnJS(fn)(args)</code> doesn't block the UI thread waiting for <code>fn</code> to finish, and there is no return-value path back to the caller. Chaining many small runOnJS calls per frame (rather than once, at a gesture's start or end) reintroduces per-frame cross-thread traffic, undoing much of the value of doing the work in a worklet in the first place.`,
      tradeoffs: `It's tempting to sprinkle runOnJS calls liberally "just to be safe," but each one queues work onto the JS thread's event loop, subject to whatever else is already queued there — a runOnJS call made from inside a high-frequency onUpdate handler can back up exactly like any other JS-thread congestion, defeating the purpose of doing the gesture work in a worklet. Prefer restricting these hops to gesture lifecycle boundaries (onStart/onEnd), not per-frame updates.`,
      followups: [
        { q: 'Can you get the return value of a JS-thread function called via runOnJS back into worklet code synchronously?', a: 'No — runOnJS schedules the call asynchronously with no return channel back to the worklet. If the UI thread needs the result, the JS function should write it into a shared value that the worklet then reads, rather than expecting a return value.' },
        { q: 'Why did Reanimated 4 rename these to scheduleOnRN/scheduleOnUI instead of keeping runOnJS/runOnUI?', a: 'Because the underlying scheduling primitives now live in the standalone react-native-worklets package rather than being Reanimated-specific, and the new names better describe scheduling work onto a runtime, versus the old "run on X" naming, which read as more synchronous than the mechanism actually is.' }
      ],
      redFlags: `Implying runOnJS is a synchronous call with a return value (it isn't); calling runOnJS/runOnUI "removed" in Reanimated 4 (they're deprecated but still functional for backward compatibility, not removed).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-anim-layout-entering-exiting', track: 'rn', category: 'rn-animations',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'How do Reanimated\'s entering/exiting layout animations actually work when a component is inserted, removed, or repositioned, and what\'s the mechanical difference from the legacy LayoutAnimation API?',
    answer: {
      core: `Reanimated's layout animation props (<code>entering</code>, <code>exiting</code>, <code>layout</code> on Animated.View — e.g. <code>entering={FadeIn}</code>, <code>exiting={SlideOutLeft}</code>, <code>layout={LinearTransition}</code>) hook directly into Fabric's commit lifecycle: when a shadow node is about to be inserted, removed, or repositioned as a result of a parent re-render, Reanimated intercepts that mutation, keeps the outgoing/incoming view mounted for the duration of a UI-thread worklet animation, and only lets Fabric complete the removal/insertion once the animation finishes. The legacy <code>LayoutAnimation.configureNext</code> API, by contrast, is a single one-shot, fire-and-forget native declaration — "animate whatever layout changes happen in the next commit" — with no per-component control, no interruption handling, and notoriously inconsistent behavior, especially on Android.`,
      mechanism: `<pre><code class="language-jsx">&lt;Animated.View
  entering={FadeIn.duration(300)}
  exiting={SlideOutLeft}
  layout={LinearTransition.springify()}
&gt;
  &lt;ListItem /&gt;
&lt;/Animated.View&gt;</code></pre>
<code>entering</code>/<code>exiting</code> fire on mount/unmount of that specific node; <code>layout</code> fires whenever Fabric would otherwise reposition it — for example, a sibling above it was removed, shifting it up. Reanimated computes the before/after layout frames from Fabric and animates the transform between them as a worklet, instead of relying on a native primitive to guess what to animate. On the New Architecture, this hooks directly into Fabric's commit lifecycle as described above; on the legacy architecture, Reanimated 3 still offers entering/exiting/layout — but through a structurally different mechanism, keyed off the legacy UIManager's layout callbacks instead of Fabric commit hooks, since there's no shadow-tree commit to intercept without Fabric. Same feature, two different underlying triggers — not one mechanism running in a degraded mode.`,
      tradeoffs: `Per-component layout animations are more predictable and composable than the legacy API's single global "animate the next layout pass" declaration, but they cost more at scale: many simultaneously entering/exiting/repositioning items (a large list reorder) means many concurrent worklet-driven animations — real UI-thread work, not free just because it's off the JS thread. Test list-heavy screens under real reorder/insert/remove load, not a two-item toy case.`,
      followups: [
        { q: 'Do entering/exiting animations work the same way on old-architecture apps still on Reanimated 3?', a: 'Reanimated 3\'s layout animations exist on old architecture too, but are noticeably less reliable there — particularly on Android — since they lack Fabric\'s commit-hook lifecycle to key off of. That\'s one of the concrete regressions teams accept by staying on old architecture.' },
        { q: 'What happens if a component with an exiting animation is removed while its entering animation is still running?', a: 'Reanimated interrupts the in-flight entering animation and transitions into the exiting one from its current animated state, rather than snapping or waiting for the enter animation to finish. That interruption handling is exactly what the legacy LayoutAnimation API can\'t offer, since it has no notion of a specific component\'s in-flight animation state to interrupt.' }
      ],
      redFlags: `Calling Reanimated's entering/exiting props "just LayoutAnimation with better names" (the mechanism — Fabric commit-hook interception with per-component interruptible worklets — is fundamentally different, not a rename); assuming these layout animations are equally reliable on old architecture.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-anim-bug-stale-closure-worklet', track: 'rn', category: 'rn-animations',
    difficulty: 'senior', type: 'spot-the-bug',
    prompt: 'A gesture\'s onEnd worklet is supposed to snap the card back to center whenever the latest "isLocked" flag is true, but it always behaves as if isLocked were still false, no matter how many times the flag gets toggled elsewhere in the app. Find the bug.',
    code: "function DraggableCard() {\n  const offset = useSharedValue(0);\n  const [isLocked, setIsLocked] = useState(false); // toggled by a button elsewhere\n\n  // BUG: isLocked is a plain JS variable, captured by value into the worklet's\n  // closure at the render that created this gesture object.\n  const pan = Gesture.Pan()\n    .onUpdate((e) => {\n      offset.value = e.translationX;\n    })\n    .onEnd(() => {\n      if (isLocked) {                 // always reads THIS render's isLocked\n        offset.value = withSpring(0);\n      }\n    });\n\n  return (\n    <GestureDetector gesture={pan}>\n      <Animated.View style={useAnimatedStyle(() => ({\n        transform: [{ translateX: offset.value }],\n      }))} />\n    </GestureDetector>\n  );\n}",
    answer: "function DraggableCard() {\n  const offset = useSharedValue(0);\n  const [isLocked, setIsLocked] = useState(false);\n\n  // Mirror isLocked into a shared value so the worklet reads a LIVE\n  // UI-thread value instead of a JS closure snapshotted at creation time.\n  const isLockedShared = useSharedValue(false);\n  useEffect(() => {\n    isLockedShared.value = isLocked;\n  }, [isLocked]);\n\n  const pan = Gesture.Pan()\n    .onUpdate((e) => {\n      offset.value = e.translationX;\n    })\n    .onEnd(() => {\n      if (isLockedShared.value) {\n        offset.value = withSpring(0);\n      }\n    });\n\n  return (\n    <GestureDetector gesture={pan}>\n      <Animated.View style={useAnimatedStyle(() => ({\n        transform: [{ translateX: offset.value }],\n      }))} />\n    </GestureDetector>\n  );\n}",
    explanation: "Reanimated's Babel plugin serializes a worklet's closure at the point the worklet is created — a worklet on the UI thread only holds whatever plain JS values were captured then, with no live reference back into a component's React state across later re-renders. Depending on exactly when Gesture Handler rebuilds the underlying gesture object, a plain-variable read like `isLocked` inside `.onEnd` can end up stuck on a stale render's value instead of tracking later toggles reliably. Shared values sidestep this entirely: `isLockedShared.value` is a JSI-backed reference the worklet reads live, at call time, on the UI thread, so it always reflects the latest write regardless of which render created the worklet. The general rule: any JS state a worklet needs to read live must be mirrored into a shared value, not captured as a plain closure variable."
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-anim-bug-heavy-useanimatedstyle', track: 'rn', category: 'rn-animations',
    difficulty: 'senior', type: 'spot-the-bug',
    prompt: 'This list item\'s entrance animation is supposed to be a cheap opacity fade, but scrolling the list is janky, and profiling shows most dropped frames land inside the UI-thread worklet runtime. Find the bug.',
    code: "function ListItem({ item, progress }) {\n  const animatedStyle = useAnimatedStyle(() => {\n    // BUG: expensive, non-animation work re-run on EVERY frame this worklet\n    // re-evaluates, i.e. any time progress.value changes -- not just once.\n    const formatted = expensiveFormatPrice(item.rawPriceCents); // parsing + currency lookup\n    const sortedTags = [...item.tags].sort();                   // new array + sort, per frame\n    console.log('rendering', item.id, sortedTags);              // hops back to the JS thread too\n\n    return {\n      opacity: progress.value,\n      // formatted/sortedTags aren't even used in the returned style object\n    };\n  });\n\n  return (\n    <Animated.View style={animatedStyle}>\n      <Text>{item.title}</Text>\n    </Animated.View>\n  );\n}",
    answer: "function ListItem({ item, progress }) {\n  // Compute non-animation work ONCE, outside the worklet, in plain JS/React.\n  const formatted = useMemo(\n    () => expensiveFormatPrice(item.rawPriceCents),\n    [item.rawPriceCents]\n  );\n  const sortedTags = useMemo(() => [...item.tags].sort(), [item.tags]);\n\n  const animatedStyle = useAnimatedStyle(() => {\n    // Only the actual per-frame animated value belongs in here.\n    return { opacity: progress.value };\n  });\n\n  return (\n    <Animated.View style={animatedStyle}>\n      <Text>{item.title}</Text>\n    </Animated.View>\n  );\n}",
    explanation: "useAnimatedStyle's worklet body re-runs on the UI thread every time any shared value it reads changes -- for a scrolling or animating list, that can be every single frame. Doing string formatting, array allocation/sorting, or (worst of all) a console.log that has to hop back to the JS thread just to print, inside that worklet turns a cheap 60-120fps opacity update into real per-frame CPU work on the very thread that also owns touch input and native rendering -- so it shows up as dropped frames and janky scrolling, the opposite of what moving the animation onto a worklet was supposed to buy. The fix is to treat useAnimatedStyle as strictly the minimal derivation of already-cheap shared values into a style object, and do anything expensive or non-animation-related (formatting, sorting, logging, data lookups) outside of it, in plain React, computed once and passed in already finished."
  });

})();
