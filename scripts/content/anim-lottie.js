window.PREP_SITE.registerTopic({
  id: 'anim-lottie',
  module: 'animation',
  title: 'Lottie & Complex Motion',
  estimatedReadTime: '35 min',
  tags: ['lottie', 'animation', 'after-effects', 'rive', 'svg', 'json-animation', 'motion-design', 'react-native'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Lottie</strong> is the de facto format for shipping designer-built animations to apps. Designers create animations in <strong>Adobe After Effects</strong>, export them as JSON via the <strong>Bodymovin</strong> plugin, and your app plays them via the Lottie runtime. Result: complex motion graphics (loaders, illustrations, micro-interactions, success animations) that would be impractical to hand-code, rendered as crisp vectors at any resolution.</p>
<ul>
  <li><strong>Why Lottie:</strong> hand-coding a complex motion graphic is hours of CSS/SVG/canvas; designers create it in 30 minutes and you embed JSON.</li>
  <li><strong>Format:</strong> JSON describing layers, paths, transforms, keyframes; rendered via SVG/Canvas/native.</li>
  <li><strong>Players:</strong> <code>lottie-react-native</code> (mobile), <code>lottie-web</code> (web), native iOS/Android libraries.</li>
  <li><strong>Performance:</strong> small files (~10-100KB JSON), but complex animations can stress CPU. Profile and prefer simpler animations for mobile.</li>
  <li><strong>Properties to control:</strong> <code>autoPlay</code>, <code>loop</code>, <code>speed</code>, <code>progress</code> (for scrubbing). Imperative ref methods for play/pause/reset.</li>
  <li><strong>Dynamic content:</strong> color overrides, text replacement at runtime via <code>colorFilters</code> / dynamic properties.</li>
  <li><strong>Alternatives:</strong> <strong>Rive</strong> — same problem, smaller files, state machines built in, growing ecosystem.</li>
  <li><strong>When NOT to use:</strong> simple state changes (use CSS / Reanimated); animations that need to react to gestures (use Reanimated worklets).</li>
</ul>
<p><strong>Mantra:</strong> "Lottie for designer-built motion graphics. Reanimated for gesture-driven animation. Pick the right tool per motion type."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The animation handoff problem</h3>
<p>Designers build beautiful animations in After Effects: a checkmark drawing itself, a complex empty state illustration with subtle motion, a custom loader with multiple shapes. Engineers traditionally had three bad options:</p>
<ol>
  <li>Reverse-engineer the animation in CSS / SVG by hand (hours of work; never quite matches).</li>
  <li>Export as a video / GIF (huge files, limited quality, no transparency).</li>
  <li>Skip the animation; ship something simpler (designer disappointed).</li>
</ol>

<h3>What Lottie does</h3>
<p>Designer exports their After Effects composition via <strong>Bodymovin</strong> plugin → JSON file describing every layer, shape, transform, keyframe. Your app loads the JSON and a Lottie runtime renders it natively (SVG on web, native shapes on iOS/Android). Result: pixel-perfect designer animation, vector-crisp at any size, ~10-50KB file.</p>

<h3>Why it exists</h3>
<p>Created at Airbnb in 2017 to solve the designer-to-engineer handoff for their Trips app. Open-sourced; ecosystem exploded. Now used by every major mobile app: Tinder, Uber, Netflix, NYT, etc.</p>

<h3>Lottie's anatomy</h3>
<table>
  <thead><tr><th>Layer</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>JSON file</td><td>Describes the animation: layers, transforms, keyframes</td></tr>
    <tr><td>Bodymovin (After Effects plugin)</td><td>Exports AE composition to JSON</td></tr>
    <tr><td>LottieFiles.com</td><td>Marketplace + free animations + editor</td></tr>
    <tr><td>Lottie runtime</td><td>Per-platform renderer (iOS / Android / Web / RN)</td></tr>
  </tbody>
</table>

<h3>Where Lottie shines</h3>
<table>
  <thead><tr><th>Scenario</th><th>Why Lottie</th></tr></thead>
  <tbody>
    <tr><td>Empty states</td><td>"Inbox zero" illustrations with subtle motion</td></tr>
    <tr><td>Loading screens</td><td>Branded loaders that feel polished</td></tr>
    <tr><td>Onboarding</td><td>Multi-step illustrative animations</td></tr>
    <tr><td>Success / error states</td><td>Animated checkmarks, error shakes</td></tr>
    <tr><td>Micro-interactions</td><td>Like-button heart fill, bookmark animation</td></tr>
    <tr><td>Notifications</td><td>Bell shake, message bounce</td></tr>
    <tr><td>Walkthroughs</td><td>Pointer animations, illustrative arrows</td></tr>
  </tbody>
</table>

<h3>Where Lottie struggles</h3>
<ul>
  <li><strong>Gesture-driven animations.</strong> Lottie animations are pre-baked timelines; gesture-reactive motion (drag, pinch) needs Reanimated/CSS.</li>
  <li><strong>State machines.</strong> Lottie can't natively branch based on state. Workarounds: multiple Lottie files, manual progress control. (Rive solves this.)</li>
  <li><strong>Performance-critical animation.</strong> Complex Lottie files can be CPU-heavy on low-end Android. Profile.</li>
  <li><strong>Tiny micro-animations.</strong> A 200ms hover effect doesn't justify a Lottie file; use CSS.</li>
</ul>

<h3>Why interviewers ask</h3>
<ol>
  <li>Tests cross-discipline awareness — engineering-design collaboration.</li>
  <li>Tests ability to choose the right animation tool for the job.</li>
  <li>Lottie performance pitfalls (large files, CPU usage) are real-world senior-level concerns.</li>
  <li>Mobile-relevance: every major mobile app uses Lottie or Rive.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You know when Lottie fits (designer-built, complex, pre-baked) vs Reanimated (gesture-driven) vs CSS (simple).</li>
  <li>You set up the file pipeline: designer ships JSON; engineer drops in.</li>
  <li>You profile JSON size and runtime CPU on real devices.</li>
  <li>You use color overrides / dynamic properties to theme animations.</li>
  <li>You use <code>progress</code> control for scroll-driven Lottie or interactive transitions.</li>
  <li>You consider Rive for new projects with complex state-driven animation needs.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The pipeline</h3>
<pre><code class="language-text">After Effects → Bodymovin plugin → animation.json
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │   Lottie Runtime    │
                              │  (per platform)     │
                              ├─────────────────────┤
                              │  iOS — native shapes│
                              │  Android — Drawables│
                              │  Web — SVG / Canvas │
                              │  RN — native bridge │
                              └──────────┬──────────┘
                                         │
                                         ▼
                                   pixels on screen
</code></pre>

<h3>The "single source of truth" model</h3>
<p>One JSON file → identical animation across iOS / Android / web. The designer iterates in After Effects; engineering re-exports. No platform-specific code.</p>

<h3>Lottie file structure (simplified)</h3>
<pre><code class="language-json">{
  "v": "5.5.7",          // Bodymovin version
  "fr": 60,              // frame rate
  "ip": 0, "op": 60,     // in / out points (frame range)
  "w": 400, "h": 400,    // dimensions
  "nm": "Animation",
  "layers": [            // array of layers
    {
      "ty": 4,           // type: shape layer
      "ks": {            // transforms
        "p": { ... },    // position keyframes
        "s": { ... },    // scale keyframes
        "r": { ... }     // rotation keyframes
      },
      "shapes": [...],   // path data
      "ip": 0, "op": 60  // layer's frame range
    }
  ]
}
</code></pre>
<p>You don't usually read or hand-edit this; designers produce it via After Effects export. But knowing the shape helps when debugging size/perf issues.</p>

<h3>Imperative control surface</h3>
<table>
  <thead><tr><th>Method</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td>play()</td><td>Play from current frame</td></tr>
    <tr><td>pause()</td><td>Pause at current frame</td></tr>
    <tr><td>reset()</td><td>Reset to first frame; pause</td></tr>
    <tr><td>resume()</td><td>Continue from paused</td></tr>
    <tr><td>play(from, to)</td><td>Play a frame range</td></tr>
    <tr><td>setProgress(0-1)</td><td>Scrub to a specific point</td></tr>
    <tr><td>setSpeed(n)</td><td>Adjust playback rate</td></tr>
    <tr><td>setLoop(bool)</td><td>Toggle loop</td></tr>
  </tbody>
</table>

<h3>Declarative props</h3>
<table>
  <thead><tr><th>Prop</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td>source</td><td>JSON file or URL</td></tr>
    <tr><td>autoPlay</td><td>Start on mount</td></tr>
    <tr><td>loop</td><td>Repeat indefinitely</td></tr>
    <tr><td>speed</td><td>Playback rate</td></tr>
    <tr><td>progress (RN)</td><td>0-1 value to scrub</td></tr>
    <tr><td>colorFilters (RN)</td><td>Override colors of named layers</td></tr>
    <tr><td>onAnimationFinish</td><td>Callback when done</td></tr>
  </tbody>
</table>

<h3>Color overrides</h3>
<p>Designers name important layers (e.g., "primaryColor", "background"). At runtime, you can override those colors to theme the animation:</p>
<pre><code class="language-tsx">&lt;LottieView
  source={require('./success.json')}
  autoPlay
  colorFilters={[
    { keypath: 'primaryColor', color: '#0a84ff' },
    { keypath: 'secondaryColor', color: '#ffffff' },
  ]}
/&gt;
</code></pre>

<h3>Dynamic properties</h3>
<p>Lottie supports more than colors — you can override paths, sizes, opacity per-keypath. Less common; most apps use color overrides only.</p>

<h3>Progress-based scrubbing</h3>
<p>For interactive animations (e.g., progress bars, scroll-driven), drive Lottie via the <code>progress</code> prop. The animation plays based on a 0-1 value you control.</p>
<pre><code class="language-tsx">// Driven by SharedValue in Reanimated
const progress = useSharedValue(0);
&lt;LottieView source={...} progress={progress} /&gt;
</code></pre>

<h3>Performance considerations</h3>
<table>
  <thead><tr><th>Concern</th><th>Mitigation</th></tr></thead>
  <tbody>
    <tr><td>File size (5KB to 5MB possible)</td><td>Audit: simplify paths, reduce keyframe count, lower fps</td></tr>
    <tr><td>CPU on low-end devices</td><td>Use <code>renderMode</code> options; profile; consider Rive</td></tr>
    <tr><td>Many simultaneous animations</td><td>Limit; combine; defer offscreen</td></tr>
    <tr><td>Heavy effects (drop shadows, blurs)</td><td>Avoid; not all renderers support; expensive</td></tr>
    <tr><td>Path tessellation</td><td>Simplify paths in After Effects</td></tr>
  </tbody>
</table>

<h3>Alternatives — why Rive matters in 2026</h3>
<p><strong>Rive</strong> (formerly Flare) is a competing format that addresses Lottie's weaknesses:</p>
<ul>
  <li><strong>Smaller files</strong> — binary format vs JSON; ~5-10× smaller.</li>
  <li><strong>State machines</strong> — animations can react to inputs / states natively.</li>
  <li><strong>Better runtime perf</strong> — designed for runtime, not just export.</li>
  <li><strong>Editor</strong> — Rive provides its own editor (free), unlike Lottie which requires After Effects ($$).</li>
  <li><strong>Maturity</strong> — younger ecosystem; fewer designers know it.</li>
</ul>

<h3>The "Lottie or Rive?" decision</h3>
<table>
  <thead><tr><th>Pick Lottie if...</th><th>Pick Rive if...</th></tr></thead>
  <tbody>
    <tr><td>Designers already in After Effects</td><td>Starting fresh</td></tr>
    <tr><td>Large library of existing Lottie assets</td><td>Need state-driven, gesture-reactive animation</td></tr>
    <tr><td>Pre-baked timeline animations</td><td>Want smaller files</td></tr>
    <tr><td>Maximum tooling / community support</td><td>Want native state machines</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>RN setup</h3>
<pre><code class="language-bash">yarn add lottie-react-native
cd ios &amp;&amp; pod install
</code></pre>

<h3>Basic usage</h3>
<pre><code class="language-tsx">import LottieView from 'lottie-react-native';

function Loader() {
  return (
    &lt;LottieView
      source={require('./loader.json')}
      autoPlay
      loop
      style={{ width: 200, height: 200 }}
    /&gt;
  );
}
</code></pre>

<h3>Imperative control via ref</h3>
<pre><code class="language-tsx">import { useRef } from 'react';
import LottieView from 'lottie-react-native';

function ControlledAnimation() {
  const ref = useRef&lt;LottieView&gt;(null);

  return (
    &lt;&gt;
      &lt;LottieView ref={ref} source={require('./check.json')} loop={false} /&gt;
      &lt;Button title="Play" onPress={() =&gt; ref.current?.play()} /&gt;
      &lt;Button title="Pause" onPress={() =&gt; ref.current?.pause()} /&gt;
      &lt;Button title="Reset" onPress={() =&gt; ref.current?.reset()} /&gt;
      &lt;Button title="Play 0-30" onPress={() =&gt; ref.current?.play(0, 30)} /&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h3>onAnimationFinish callback</h3>
<pre><code class="language-tsx">&lt;LottieView
  source={require('./success.json')}
  autoPlay
  loop={false}
  onAnimationFinish={() =&gt; {
    // navigate, show next screen, etc.
  }}
/&gt;
</code></pre>

<h3>Color overrides</h3>
<pre><code class="language-tsx">&lt;LottieView
  source={require('./logo.json')}
  autoPlay
  loop
  colorFilters={[
    { keypath: 'primaryColor', color: theme.colors.primary },
    { keypath: 'accentColor', color: theme.colors.accent },
  ]}
/&gt;
</code></pre>
<p>The keypath names match what designers set in After Effects (or you can ask them to use specific names).</p>

<h3>Progress-driven (with Reanimated)</h3>
<pre><code class="language-tsx">import LottieView from 'lottie-react-native';
import Animated, { useSharedValue, useAnimatedProps } from 'react-native-reanimated';

const AnimatedLottie = Animated.createAnimatedComponent(LottieView);

function ScrubbableAnimation() {
  const progress = useSharedValue(0);

  const animatedProps = useAnimatedProps(() =&gt; ({
    progress: progress.value,
  }));

  return (
    &lt;&gt;
      &lt;AnimatedLottie source={require('./journey.json')} animatedProps={animatedProps} /&gt;
      &lt;Slider
        value={0}
        onValueChange={(v) =&gt; { progress.value = v; }}
        minimumValue={0}
        maximumValue={1}
      /&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h3>Scroll-driven Lottie</h3>
<pre><code class="language-tsx">function ScrollDrivenLottie() {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) =&gt; { scrollY.value = e.contentOffset.y; },
  });

  const animatedProps = useAnimatedProps(() =&gt; ({
    progress: Math.min(1, scrollY.value / 500),
  }));

  return (
    &lt;Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}&gt;
      &lt;AnimatedLottie source={require('./header-anim.json')} animatedProps={animatedProps} /&gt;
      ...
    &lt;/Animated.ScrollView&gt;
  );
}
</code></pre>

<h3>Loading from URL</h3>
<pre><code class="language-tsx">&lt;LottieView
  source={{ uri: 'https://assets.lottiefiles.com/packages/lf20_xyz.json' }}
  autoPlay
  loop
/&gt;

// For RN, requires fetching first:
const [animation, setAnimation] = useState(null);
useEffect(() =&gt; {
  fetch('https://...').then(r =&gt; r.json()).then(setAnimation);
}, []);

if (!animation) return &lt;Spinner /&gt;;
return &lt;LottieView source={animation} autoPlay loop /&gt;;
</code></pre>

<h3>Lottie web (vanilla / React)</h3>
<pre><code class="language-bash">yarn add lottie-web
# Or React-specific:
yarn add lottie-react
</code></pre>

<pre><code class="language-jsx">import Lottie from 'lottie-react';
import animation from './loader.json';

function Loader() {
  return &lt;Lottie animationData={animation} loop autoplay style={{ width: 200, height: 200 }} /&gt;;
}
</code></pre>

<h3>Vanilla web</h3>
<pre><code class="language-js">import lottie from 'lottie-web';
import animationData from './loader.json';

const anim = lottie.loadAnimation({
  container: document.querySelector('#anim'),
  renderer: 'svg',         // or 'canvas' / 'html'
  loop: true,
  autoplay: true,
  animationData,
});

// Control
anim.play();
anim.pause();
anim.goToAndStop(60, true);   // jump to frame 60
anim.setSpeed(0.5);
anim.addEventListener('complete', () =&gt; { ... });
</code></pre>

<h3>Render mode (RN)</h3>
<pre><code class="language-tsx">&lt;LottieView
  source={...}
  renderMode="HARDWARE"   // 'HARDWARE' | 'SOFTWARE' | 'AUTOMATIC'
/&gt;
</code></pre>
<p>HARDWARE uses GPU; SOFTWARE renders on CPU; AUTOMATIC chooses based on complexity. HARDWARE is faster but doesn't support all features (e.g., masks).</p>

<h3>Caching loaded animations</h3>
<pre><code class="language-tsx">// Pre-load animations during app start
const animations = {
  checkmark: require('./check.json'),
  loader: require('./loader.json'),
  empty: require('./empty.json'),
};

// Use throughout app
&lt;LottieView source={animations.checkmark} autoPlay /&gt;
</code></pre>

<h3>Conditional rendering</h3>
<pre><code class="language-tsx">function StatusIcon({ status }) {
  const source = {
    success: require('./check.json'),
    error: require('./error.json'),
    loading: require('./loader.json'),
  }[status];

  return &lt;LottieView source={source} autoPlay loop={status === 'loading'} /&gt;;
}
</code></pre>

<h3>Rive setup (alternative)</h3>
<pre><code class="language-bash">yarn add rive-react-native
</code></pre>

<pre><code class="language-tsx">import Rive from 'rive-react-native';

function Logo() {
  return (
    &lt;Rive
      resourceName="logo"   // logo.riv in assets
      autoplay
      stateMachineName="State Machine 1"
    /&gt;
  );
}
</code></pre>

<h3>Rive state machine</h3>
<pre><code class="language-tsx">import { useRive, useStateMachineInput } from 'rive-react';

function Button() {
  const { rive, RiveComponent } = useRive({
    src: '/button.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  const hover = useStateMachineInput(rive, 'State Machine 1', 'isHover');
  const press = useStateMachineInput(rive, 'State Machine 1', 'isPressed');

  return (
    &lt;div
      onMouseEnter={() =&gt; (hover.value = true)}
      onMouseLeave={() =&gt; (hover.value = false)}
      onMouseDown={() =&gt; (press.value = true)}
      onMouseUp={() =&gt; (press.value = false)}
    &gt;
      &lt;RiveComponent /&gt;
    &lt;/div&gt;
  );
}
</code></pre>
<p>Rive's state machines react to inputs natively — no need to imperatively play/pause segments.</p>

<h3>File optimization checklist</h3>
<ul>
  <li>Run JSON through <code>lottie-shrink</code> or similar minifier.</li>
  <li>Reduce keyframe count where possible (designer can simplify in AE).</li>
  <li>Avoid effects: drop shadows, glows, blurs.</li>
  <li>Reduce dimensions (the JSON encodes paths at original resolution).</li>
  <li>Lower frame rate (60fps animations rarely need 60fps export — 30fps is often enough).</li>
  <li>Convert raster images to vectors where possible.</li>
  <li>Compare file sizes; aim for &lt; 50KB for typical UI animations.</li>
</ul>

<h3>Caveats per platform</h3>
<table>
  <thead><tr><th>Feature</th><th>iOS</th><th>Android</th><th>Web</th></tr></thead>
  <tbody>
    <tr><td>Standard transforms</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>Masks</td><td>✓ (slow)</td><td>✓ (sometimes slow)</td><td>✓</td></tr>
    <tr><td>Mattes</td><td>✓</td><td>limited</td><td>✓</td></tr>
    <tr><td>Effects (gaussian blur, drop shadow)</td><td>partial</td><td>partial</td><td>partial</td></tr>
    <tr><td>Text (live text)</td><td>partial</td><td>partial</td><td>✓</td></tr>
    <tr><td>Audio</td><td>—</td><td>—</td><td>—</td></tr>
  </tbody>
</table>

<p>Always test on target platforms; assume "works in After Effects" doesn't mean "works in Lottie." Designers should verify exports.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Empty state with subtle motion</h3>
<pre><code class="language-tsx">function EmptyInbox() {
  return (
    &lt;View style={styles.center}&gt;
      &lt;LottieView
        source={require('./empty-inbox.json')}
        autoPlay
        loop
        style={{ width: 240, height: 240 }}
      /&gt;
      &lt;Text style={styles.title}&gt;No new messages&lt;/Text&gt;
      &lt;Text style={styles.subtitle}&gt;You're all caught up.&lt;/Text&gt;
    &lt;/View&gt;
  );
}
</code></pre>

<h3>Example 2: Success state — play once, navigate</h3>
<pre><code class="language-tsx">function PaymentSuccess({ onDone }) {
  return (
    &lt;LottieView
      source={require('./success-check.json')}
      autoPlay
      loop={false}
      onAnimationFinish={onDone}
      style={{ width: 200, height: 200 }}
    /&gt;
  );
}
</code></pre>

<h3>Example 3: Themeable loader</h3>
<pre><code class="language-tsx">function ThemedLoader() {
  const theme = useTheme();
  return (
    &lt;LottieView
      source={require('./loader.json')}
      autoPlay
      loop
      colorFilters={[
        { keypath: 'main', color: theme.colors.primary },
        { keypath: 'accent', color: theme.colors.accent },
      ]}
      style={{ width: 60, height: 60 }}
    /&gt;
  );
}
</code></pre>

<h3>Example 4: Like button (heart fill)</h3>
<pre><code class="language-tsx">function LikeButton({ liked, onToggle }) {
  const ref = useRef&lt;LottieView&gt;(null);
  const wasLiked = useRef(liked);

  useEffect(() =&gt; {
    if (liked &amp;&amp; !wasLiked.current) {
      ref.current?.play(0, 30);   // play the "fill" segment
    } else if (!liked &amp;&amp; wasLiked.current) {
      ref.current?.play(30, 60);  // play the "empty" segment
    }
    wasLiked.current = liked;
  }, [liked]);

  return (
    &lt;Pressable onPress={onToggle}&gt;
      &lt;LottieView
        ref={ref}
        source={require('./heart.json')}
        loop={false}
        autoPlay={false}
        style={{ width: 50, height: 50 }}
      /&gt;
    &lt;/Pressable&gt;
  );
}
</code></pre>

<h3>Example 5: Onboarding with progress</h3>
<pre><code class="language-tsx">function Onboarding() {
  const [step, setStep] = useState(0);
  const sources = [
    require('./onboard-1.json'),
    require('./onboard-2.json'),
    require('./onboard-3.json'),
  ];

  return (
    &lt;&gt;
      &lt;LottieView
        source={sources[step]}
        autoPlay
        loop
        style={styles.illustration}
        key={step}   // remount when step changes
      /&gt;
      &lt;Button title="Next" onPress={() =&gt; setStep((s) =&gt; (s + 1) % 3)} /&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h3>Example 6: Pull-to-refresh custom indicator</h3>
<pre><code class="language-tsx">function CustomRefresh() {
  const ref = useRef&lt;LottieView&gt;(null);
  const [refreshing, setRefreshing] = useState(false);

  return (
    &lt;FlatList
      data={items}
      refreshControl={
        &lt;RefreshControl
          refreshing={refreshing}
          onRefresh={async () =&gt; {
            setRefreshing(true);
            ref.current?.play();
            await refetch();
            setRefreshing(false);
            ref.current?.reset();
          }}
        /&gt;
      }
      ListHeaderComponent={
        refreshing ? (
          &lt;LottieView ref={ref} source={require('./pull.json')} loop /&gt;
        ) : null
      }
      ...
    /&gt;
  );
}
</code></pre>

<h3>Example 7: Toast with success animation</h3>
<pre><code class="language-tsx">function Toast({ message, type = 'success' }) {
  const sources = {
    success: require('./toast-success.json'),
    error: require('./toast-error.json'),
    info: require('./toast-info.json'),
  };

  return (
    &lt;Animated.View entering={SlideInUp} exiting={SlideOutDown} style={styles.toast}&gt;
      &lt;LottieView source={sources[type]} autoPlay loop={false} style={{ width: 32, height: 32 }} /&gt;
      &lt;Text style={styles.message}&gt;{message}&lt;/Text&gt;
    &lt;/Animated.View&gt;
  );
}
</code></pre>

<h3>Example 8: Scroll-driven progress with Reanimated</h3>
<pre><code class="language-tsx">function ScrollHero() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({ onScroll: (e) =&gt; { scrollY.value = e.contentOffset.y; } });

  const animatedProps = useAnimatedProps(() =&gt; ({
    progress: Math.min(1, Math.max(0, scrollY.value / 400)),
  }));

  return (
    &lt;Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}&gt;
      &lt;AnimatedLottie source={require('./hero.json')} animatedProps={animatedProps} style={{ height: 400 }} /&gt;
      &lt;View&gt;Content...&lt;/View&gt;
    &lt;/Animated.ScrollView&gt;
  );
}
</code></pre>

<h3>Example 9: Conditional play based on data</h3>
<pre><code class="language-tsx">function StatusIndicator({ status }: { status: 'idle' | 'success' | 'error' }) {
  const ref = useRef&lt;LottieView&gt;(null);

  useEffect(() =&gt; {
    if (status === 'success') ref.current?.play();
    if (status === 'idle') ref.current?.reset();
  }, [status]);

  if (status === 'error') return &lt;LottieView source={require('./error.json')} autoPlay /&gt;;
  return &lt;LottieView ref={ref} source={require('./success.json')} loop={false} autoPlay={false} /&gt;;
}
</code></pre>

<h3>Example 10: Rive button with state inputs</h3>
<pre><code class="language-tsx">import Rive, { useRive, useStateMachineInput } from 'rive-react-native';

function HoverButton() {
  const riveRef = useRef&lt;Rive&gt;(null);

  const setHover = (val: boolean) =&gt; {
    riveRef.current?.setInputState('State Machine 1', 'isHover', val);
  };
  const setPressed = (val: boolean) =&gt; {
    riveRef.current?.setInputState('State Machine 1', 'isPressed', val);
  };

  return (
    &lt;Pressable
      onPressIn={() =&gt; setPressed(true)}
      onPressOut={() =&gt; setPressed(false)}
      onHoverIn={() =&gt; setHover(true)}
      onHoverOut={() =&gt; setHover(false)}
    &gt;
      &lt;Rive ref={riveRef} resourceName="button" stateMachineName="State Machine 1" autoplay /&gt;
    &lt;/Pressable&gt;
  );
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>File size blowout</h3>
<p>A single Lottie can be 5MB if it has many keyframes / complex paths / embedded raster images. Audit before shipping; aim for &lt; 50KB. Use <code>lottie-shrink</code> or simplify in After Effects.</p>

<h3>Performance on low-end Android</h3>
<p>Complex Lottie files with masks and effects can drop to 20fps on a Pixel 4a. Test on real low-end devices; consider Rive or simpler animations for those tiers.</p>

<h3>Memory growth from large Lottie</h3>
<p>Each frame's path tessellation costs memory. 5MB of paths × multiple instances = significant. Avoid running many simultaneous large Lottie animations.</p>

<h3>Effects that don't render</h3>
<p>After Effects supports many effects Lottie doesn't (drop shadow, gaussian blur, particle systems). The JSON exports them as no-ops; designer's animation looks broken in your app. Always preview in target runtime.</p>

<h3>Text rendering inconsistencies</h3>
<p>Live text in Lottie (vs path-baked text) renders with the platform's font rasterizer; small differences in font metrics across iOS/Android cause text to clip or shift. Either path-bake text or test on all platforms.</p>

<h3>Interaction with React Native screens</h3>
<p>Lottie animations may pause when screen is unmounted but resumed on remount. Use <code>autoPlay={false}</code> + ref control if you need precise lifecycle.</p>

<h3>iOS background pause</h3>
<p>iOS pauses animations when app backgrounds. On foreground, you may want to <code>play()</code> again or jump to a known state. Listen to <code>AppState</code>.</p>

<h3>Loading from network</h3>
<p>Network-loaded Lottie has no animation until JSON arrives. Show placeholder. Cache to disk for repeat plays. Pre-bundle critical animations to avoid network dependency.</p>

<h3>Color override keypath mismatch</h3>
<p>If designer renames "primaryColor" → "main", your colorFilters silently fail. Establish naming conventions; communicate.</p>

<h3>Progress prop sticky</h3>
<p>Setting <code>progress</code> manually pauses auto-playback. To resume, set autoPlay back; don't mix progress and autoPlay.</p>

<h3>Looping and onAnimationFinish</h3>
<p><code>onAnimationFinish</code> fires once per loop iteration. If you want one-shot detection, pair with <code>loop={false}</code>.</p>

<h3>Layered AE compositions</h3>
<p>Nested compositions in After Effects sometimes break Bodymovin export. Designer should check exports; flatten if necessary.</p>

<h3>Bodymovin plugin version</h3>
<p>Lottie runtime versions don't always match Bodymovin export versions. Mismatch can cause subtle rendering differences. Pin both.</p>

<h3>Web vs RN rendering differences</h3>
<p>lottie-web (SVG) and lottie-react-native (native) sometimes render slightly differently — different anti-aliasing, gradient interpolation, mask handling. Test on each.</p>

<h3>Hardware vs software rendering</h3>
<p>RN's <code>renderMode: 'HARDWARE'</code> doesn't support all features (some masks, mattes). Falling back to software for unsupported features can be much slower. Test rendering modes.</p>

<h3>Animation freezes mid-way</h3>
<p>Sometimes Lottie animations stutter or freeze on a specific frame. Often caused by complex paths or unsupported effects. Profile in Lottie's preview; simplify.</p>

<h3>Audio in Lottie</h3>
<p>Lottie doesn't support audio. If your animation has sound, implement playback separately and synchronize.</p>

<h3>SVG vs Canvas vs HTML rendering (web)</h3>
<table>
  <thead><tr><th>Renderer</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>SVG (default)</td><td>Crisp, scalable, accessible</td><td>Slow with many paths</td></tr>
    <tr><td>Canvas</td><td>Fast for complex animations</td><td>Not crisp on retina without explicit handling; not accessible</td></tr>
    <tr><td>HTML</td><td>Sometimes simpler animations</td><td>Limited support; rarely used</td></tr>
  </tbody>
</table>

<h3>Memory leaks in lottie-web</h3>
<p>Failing to call <code>animation.destroy()</code> when removing the element leaks. In React, use cleanup in useEffect.</p>

<h3>Concurrent rendering</h3>
<p>React 18 may render twice in StrictMode; Lottie components may double-mount. Use refs and cleanup carefully.</p>

<h3>iOS dynamic font scaling</h3>
<p>Live text in Lottie respects iOS's dynamic type, which can resize text and break layout. Path-bake critical text to avoid.</p>

<h3>Outdated Lottie runtime versions</h3>
<p>Old <code>lottie-react-native</code> versions have bugs and limited features. Keep updated.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Setting <code>autoPlay</code> + <code>loop</code> for one-shot</h3>
<pre><code class="language-tsx">// BAD — keeps looping
&lt;LottieView source={...} autoPlay loop /&gt;

// FIX
&lt;LottieView source={...} autoPlay loop={false} onAnimationFinish={onDone} /&gt;
</code></pre>

<h3>Bug 2: Playing before mount</h3>
<pre><code class="language-tsx">const ref = useRef&lt;LottieView&gt;(null);
ref.current?.play();   // ref is null on first render

// FIX — useEffect after mount
useEffect(() =&gt; { ref.current?.play(); }, []);
</code></pre>

<h3>Bug 3: Color filter keypath wrong</h3>
<pre><code class="language-tsx">// Designer's keypath is "fill"; engineer wrote "primary" — silent no-op
colorFilters={[{ keypath: 'primary', color: '#0a84ff' }]}
</code></pre>

<h3>Bug 4: Missing dimensions</h3>
<pre><code class="language-tsx">// Without explicit dimensions, Lottie may render at 0×0
&lt;LottieView source={...} /&gt;

// FIX
&lt;LottieView source={...} style={{ width: 200, height: 200 }} /&gt;
</code></pre>

<h3>Bug 5: Network source on every render</h3>
<pre><code class="language-tsx">// BAD — re-fetches every render
&lt;LottieView source={{ uri: \`https://.../\${anim}.json?\${Math.random()}\` }} /&gt;
</code></pre>

<h3>Bug 6: Rendering many Lotties simultaneously</h3>
<p>20 simultaneous animated Lotties in a list = scroll jank. Either render only visible items, or use a static placeholder for off-screen rows.</p>

<h3>Bug 7: Forgetting cleanup in lottie-web</h3>
<pre><code class="language-js">const anim = lottie.loadAnimation(...);
// component unmounts; anim still running
// FIX
return () =&gt; anim.destroy();
</code></pre>

<h3>Bug 8: Mixing autoPlay and progress</h3>
<pre><code class="language-tsx">// Setting progress overrides autoPlay; animation stops at the progress value
&lt;LottieView autoPlay progress={0.5} /&gt;
</code></pre>

<h3>Bug 9: Lottie inside a Pressable that absorbs touches</h3>
<p>Lottie may steal touches from parent Pressable. Set <code>pointerEvents: 'none'</code> on the Lottie if it's purely decorative.</p>

<h3>Bug 10: Loading raster-heavy Lottie</h3>
<p>Designer embedded a 1MB JPEG in the Lottie file. The "vector animation" is now a raster slideshow. Audit and replace with vector shapes.</p>

<h3>Anti-pattern 1: Lottie for every animation</h3>
<p>A 200ms hover doesn't need Lottie. Reach for it for designer-built complex motion graphics, not basic state changes.</p>

<h3>Anti-pattern 2: Skipping the size audit</h3>
<p>Shipping 2MB of Lottie JSON in your app's main bundle. Each install pays the size cost forever. Audit, optimize, lazy-load.</p>

<h3>Anti-pattern 3: Not testing on low-end devices</h3>
<p>Lottie works smoothly on iPhone 15 Pro; chokes on Pixel 3a. Test there.</p>

<h3>Anti-pattern 4: After Effects effects without verification</h3>
<p>Designer adds drop shadow → engineer ships → users see no shadow. Establish a verification step.</p>

<h3>Anti-pattern 5: Hard-coding Lottie colors</h3>
<p>Animation looks great in light mode; ugly in dark mode. Use color overrides for brand-tied colors.</p>

<h3>Anti-pattern 6: Network Lottie without caching</h3>
<p>Each load fetches; no offline support. Either bundle or cache to disk.</p>

<h3>Anti-pattern 7: Skipping fallback for failed loads</h3>
<p>Network Lottie fails → user sees nothing. Show static placeholder.</p>

<h3>Anti-pattern 8: Not coordinating with designer</h3>
<p>Designer makes 60fps animation; engineer ships at 30fps via speed override. Looks bad. Communicate.</p>

<h3>Anti-pattern 9: Treating Lottie as gesture-reactive</h3>
<p>Pre-baked timeline can't truly react to gestures. Use Reanimated for that or switch to Rive.</p>

<h3>Anti-pattern 10: Not considering Rive</h3>
<p>For new projects in 2026, Rive often beats Lottie on file size, runtime perf, and state-machine support. At minimum evaluate.</p>
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
    <tr><td><em>What is Lottie?</em></td><td>JSON-based animation format from After Effects via Bodymovin; rendered natively per platform.</td></tr>
    <tr><td><em>When use Lottie?</em></td><td>Designer-built motion graphics: empty states, success animations, branded loaders, illustrations.</td></tr>
    <tr><td><em>When NOT to use?</em></td><td>Simple state changes (CSS / Reanimated); gesture-driven (Reanimated worklets); micro-interactions (CSS).</td></tr>
    <tr><td><em>Performance considerations?</em></td><td>File size, CPU on low-end Android, mask/effect support varies.</td></tr>
    <tr><td><em>How do you theme an animation?</em></td><td>Color overrides via colorFilters / dynamic properties keyed by layer name.</td></tr>
    <tr><td><em>How do you scrub?</em></td><td>Set <code>progress</code> prop (0-1); useful for scroll-driven and interactive transitions.</td></tr>
    <tr><td><em>What's onAnimationFinish?</em></td><td>Callback when one iteration completes; useful for navigation flows.</td></tr>
    <tr><td><em>How does Lottie compare to Rive?</em></td><td>Rive: smaller files, native state machines, better runtime perf. Lottie: bigger ecosystem, designer-friendly via After Effects.</td></tr>
    <tr><td><em>What's Bodymovin?</em></td><td>The After Effects plugin that exports compositions to Lottie JSON.</td></tr>
    <tr><td><em>Why might a Lottie animation render differently on iOS vs Android?</em></td><td>Effects support varies; mask/matte support varies; font rendering differs for live text.</td></tr>
    <tr><td><em>How do you handle a 5MB Lottie file?</em></td><td>Audit (designer simplify), shrink JSON, lower fps, replace embedded rasters with vectors.</td></tr>
    <tr><td><em>What's the imperative API?</em></td><td>play / pause / reset / setSpeed / setProgress via ref.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Render a Lottie file with autoplay + loop.</li>
  <li>Add color theming via colorFilters.</li>
  <li>Implement a like-button with play(0, 30) / play(30, 60) for fill / unfill segments.</li>
  <li>Drive Lottie progress from a Reanimated SharedValue.</li>
  <li>Handle onAnimationFinish to navigate after success.</li>
  <li>Compare a Lottie animation vs a hand-coded equivalent in CSS.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Lottie at 0×0 — missing dimensions.</li>
  <li>autoPlay + loop on a one-shot success animation — should be loop={false} + onFinish.</li>
  <li>Color override silently failing — keypath mismatch with designer's naming.</li>
  <li>2MB Lottie file — audit and optimize.</li>
  <li>Missing destroy() in lottie-web — memory leak.</li>
  <li>Drop shadow not rendering — Lottie limitation; advise designer.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Tool selection</td><td>You pick Lottie for designer-built; Reanimated for gestures; CSS for simple state.</td></tr>
    <tr><td>Workflow awareness</td><td>You understand After Effects → Bodymovin → JSON → runtime.</td></tr>
    <tr><td>Performance discipline</td><td>You profile; you cap simultaneous animations; you audit file sizes.</td></tr>
    <tr><td>Theming</td><td>You volunteer color overrides for theme-aware animations.</td></tr>
    <tr><td>Cross-platform awareness</td><td>You know iOS / Android / Web have different feature support.</td></tr>
    <tr><td>Designer collaboration</td><td>You propose naming conventions for keypaths.</td></tr>
    <tr><td>Modern alternatives</td><td>You can defend Lottie vs Rive vs hand-coded for the right use case.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Almost every consumer mobile app</strong> uses Lottie or Rive somewhere — empty states, loaders, success animations.</li>
  <li><strong>Tinder, Uber, Netflix, NYT</strong> are public Lottie users; the format is mainstream.</li>
  <li><strong>Performance on low-end Android</strong> is a real concern; profile.</li>
  <li><strong>Reanimated + Lottie</strong> compose well: drive Lottie's progress via Reanimated for interactive scroll / drag-driven animations.</li>
  <li><strong>For new projects:</strong> evaluate Rive — better state machines, smaller files, free editor.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why JSON instead of binary?"</em> — Human-readable for debugging; easy to edit; small enough at typical sizes; benefits from gzip. Rive uses binary because it's optimized for state machines and runtime perf.</li>
  <li><em>"How does Lottie achieve cross-platform fidelity?"</em> — One format describes paths, transforms, keyframes; per-platform runtimes interpret. Inevitable rendering differences for advanced effects (masks, blurs).</li>
  <li><em>"What's the runtime cost of a Lottie animation?"</em> — Path tessellation per frame, layer composition, transform interpolation. For complex animations, dozens of paths × 60fps = noticeable CPU.</li>
  <li><em>"How would you handle 100 Lottie animations on a screen?"</em> — Don't. Use static thumbnails for off-screen items; render Lottie only when in viewport; consider replacing with simpler animations.</li>
  <li><em>"How does Rive's state machine differ from Lottie's segments?"</em> — Lottie segments are fixed timeline ranges (frames 0-30 for "fill"); you imperatively play them. Rive state machines are reactive — inputs (booleans, numbers) trigger transitions; the animation knows how to react. Cleaner for interactive elements.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit current Lottie usage: file sizes, simultaneous animations, low-end perf.</li>
  <li>Establish naming conventions for color keypaths.</li>
  <li>Document the After Effects → Bodymovin → engineering pipeline.</li>
  <li>Add Lottie file-size budget to CI.</li>
  <li>Profile top 5 animations on real low-end Android.</li>
  <li>Evaluate Rive for new state-driven animations.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add a CI check that fails if any Lottie file exceeds 50KB without an exception."</li>
  <li>"I'd build a Lottie audit dashboard showing usage and load impact across the app."</li>
  <li>"I'd partner with the design team on a 'Lottie style guide' — color naming, file naming, AE features to avoid."</li>
  <li>"I'd lazy-load non-critical Lotties to reduce app launch time."</li>
  <li>"I'd POC Rive for our most interactive component (e.g., the like button) to compare bundle size and gesture responsiveness."</li>
</ul>

<h3>Module summary</h3>
<p>Animation Deep covers:</p>
<ul>
  <li><strong>CSS vs JS</strong> — pipeline awareness, compositor-only rule, requestAnimationFrame, will-change.</li>
  <li><strong>WAAPI</strong> — modern imperative animation API; Promise-friendly; native scroll-driven.</li>
  <li><strong>FLIP</strong> — animating layout changes via measure-mutate-invert-play.</li>
  <li><strong>Reanimated 3 Worklets</strong> — RN's UI-thread animation library; gesture integration; layout animations.</li>
  <li><strong>Lottie &amp; Complex Motion</strong> (this topic) — designer-built motion graphics; cross-platform fidelity.</li>
</ul>
<p>Together these tools cover the full animation surface: simple state changes (CSS), dynamic JS-driven (WAAPI), layout transitions (FLIP), gesture-reactive native (Reanimated), and complex designer motion (Lottie / Rive).</p>
`
    }
  ]
});
