window.PREP_SITE.registerTopic({
  id: 'anim-css-js',
  module: 'animation',
  title: 'CSS vs JS Animation',
  estimatedReadTime: '40 min',
  tags: ['animation', 'css', 'transition', 'keyframes', 'requestanimationframe', 'jank', 'compositor', 'will-change', 'performance'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>The choice between CSS and JS animation isn't either/or — it's about <strong>which thread runs the work</strong> and <strong>what the browser can optimize</strong>. CSS animations and transitions of compositor-only properties (transform, opacity) are handed to the GPU and run on the compositor thread; everything else (top, left, width, color, layout-affecting properties) runs on the main thread and competes with your JS.</p>
<ul>
  <li><strong>The 60fps budget = 16.67ms per frame.</strong> Anything that pushes a frame past this drops it.</li>
  <li><strong>Animate only <code>transform</code> and <code>opacity</code></strong> for guaranteed compositor-thread acceleration. <code>filter</code> sometimes works (browser-dependent).</li>
  <li><strong>CSS transitions:</strong> for state-driven simple animations (hover, theme switch). One-shot only.</li>
  <li><strong>CSS keyframes:</strong> for declarative loops, named sequences, more control.</li>
  <li><strong>JS animation (rAF / WAAPI / libs):</strong> for dynamic values, timeline scrubbing, gesture-driven, complex orchestration.</li>
  <li><strong>The "JS is slower" myth is false.</strong> CSS and WAAPI both go through the compositor when animating compositor properties; rAF-driven JS animation of <code>transform</code> is just as fast.</li>
  <li><strong><code>will-change</code> is a hint, not a fix.</strong> Promotes to its own layer; overuse blows up memory.</li>
  <li><strong>Mobile reality:</strong> CSS animations on RN web don't apply to native; React Native uses Animated API, Reanimated, or the Animations API — covered later in this module.</li>
</ul>
<p><strong>Mantra:</strong> "Animate transform and opacity. Stay on the compositor. Profile every animation. CSS for state changes; JS for dynamic; libraries for choreography."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The browser's frame loop</h3>
<p>Modern browsers target 60fps (some 90/120fps). Each frame has a fixed budget: at 60fps, ~16.67ms. Within that budget the browser must:</p>
<ol>
  <li>Run JavaScript (timers, events, rAF callbacks).</li>
  <li>Recalculate styles for changed elements.</li>
  <li>Run layout (reflow) if geometry changed.</li>
  <li>Paint affected layers.</li>
  <li>Composite layers and draw to screen.</li>
</ol>
<p>If any phase exceeds budget, the frame drops — visible jank. Animation's job is to fit inside that budget every single frame.</p>

<h3>The compositor thread is the secret weapon</h3>
<p>Browsers run the main thread (your JS, layout, paint) and a separate compositor thread (assembling layers and pushing pixels). Animations of <strong><code>transform</code></strong> and <strong><code>opacity</code></strong> can be handed to the compositor thread — once the GPU has the layer's texture, animating it doesn't touch the main thread. The animation runs even if your JS is busy.</p>

<h3>The "main thread" trap</h3>
<table>
  <thead><tr><th>Property</th><th>Triggers</th><th>Speed</th></tr></thead>
  <tbody>
    <tr><td><code>top, left, width, height, margin, padding</code></td><td>Layout + paint + composite</td><td>Slow; main thread</td></tr>
    <tr><td><code>color, background, border-color, box-shadow</code></td><td>Paint + composite</td><td>Medium; main thread</td></tr>
    <tr><td><code>transform, opacity, filter (some)</code></td><td>Composite only</td><td>Fast; compositor thread</td></tr>
  </tbody>
</table>
<p><a href="https://csstriggers.com/" target="_blank">csstriggers.com</a> documents which properties trigger which phases.</p>

<h3>Why not animate <code>top</code> / <code>left</code>?</h3>
<p>Changing <code>top</code> or <code>left</code> moves an element by adjusting its position in the layout tree. The browser must:</p>
<ol>
  <li>Recalculate styles.</li>
  <li>Re-layout (potentially the entire descendant tree).</li>
  <li>Re-paint affected pixels.</li>
  <li>Re-composite.</li>
</ol>
<p>For a 60fps animation that's 60 layouts per second on the main thread. JS execution gets squeezed; user input lags; frames drop.</p>

<p>Changing <code>transform: translate(x, y)</code> achieves the same visual move but only changes the layer's transformation matrix on the compositor. No re-layout. No re-paint. The compositor and GPU handle it.</p>

<h3>CSS vs JS — the actual question</h3>
<p>Both CSS and JS can animate compositor properties at 60fps. The real differences:</p>
<table>
  <thead><tr><th>Aspect</th><th>CSS</th><th>JS</th></tr></thead>
  <tbody>
    <tr><td>Declarative</td><td>Yes</td><td>No (imperative)</td></tr>
    <tr><td>Off main thread</td><td>If transform/opacity</td><td>If transform/opacity (and via WAAPI / RAF)</td></tr>
    <tr><td>Dynamic values</td><td>Hard (CSS variables help)</td><td>Trivial</td></tr>
    <tr><td>Pause / reverse / scrub</td><td>Limited (animation-play-state)</td><td>Fine-grained</td></tr>
    <tr><td>Trigger from interaction</td><td>Class toggle</td><td>Direct</td></tr>
    <tr><td>Sequencing / orchestration</td><td>Limited</td><td>Easy</td></tr>
    <tr><td>Performance ceiling</td><td>Limited by browser</td><td>Same</td></tr>
  </tbody>
</table>

<h3>Where each shines</h3>
<table>
  <thead><tr><th>Scenario</th><th>Best fit</th></tr></thead>
  <tbody>
    <tr><td>Hover effect</td><td>CSS transition</td></tr>
    <tr><td>Loading spinner</td><td>CSS keyframes</td></tr>
    <tr><td>Page enter / exit</td><td>CSS or JS (depends on dynamic data)</td></tr>
    <tr><td>Drag-and-drop</td><td>JS (gesture-driven)</td></tr>
    <tr><td>Scroll-linked animation</td><td>JS (rAF) or modern CSS scroll-driven animations</td></tr>
    <tr><td>Complex sequence with branches</td><td>JS (e.g., GSAP, Framer Motion)</td></tr>
    <tr><td>Layout-aware transition (FLIP)</td><td>JS — covered next topic</td></tr>
  </tbody>
</table>

<h3>Mobile — RN doesn't use CSS</h3>
<p>React Native runs on its own renderer; CSS is irrelevant. RN has three animation paths:</p>
<ul>
  <li><strong>Animated API</strong> — built-in; <code>useNativeDriver: true</code> moves animation to native side.</li>
  <li><strong>Reanimated</strong> — third-party; runs on UI thread via worklets. Modern default.</li>
  <li><strong>LayoutAnimation</strong> — declarative for layout transitions.</li>
</ul>
<p>The principles in this topic — main vs UI thread, compositor properties, frame budget — apply directly. Just substitute "compositor thread" with "UI thread" and "transform/opacity" with "transform/opacity" (RN matches CSS here).</p>

<h3>Why interviewers ask</h3>
<ol>
  <li>Animation knowledge separates "I make things move" from "I make things move at 60fps."</li>
  <li>Tests architectural understanding of the rendering pipeline.</li>
  <li>Performance debugging — can you diagnose jank?</li>
  <li>Senior-level signal: knowing why <code>transform</code> beats <code>top</code>.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You default to <code>transform</code> and <code>opacity</code>.</li>
  <li>You profile in DevTools / Flipper / Hermes profiler before declaring "smooth."</li>
  <li>You don't sprinkle <code>will-change</code> everywhere.</li>
  <li>You know which CSS properties are compositor-only without checking docs.</li>
  <li>For RN: you reach for Reanimated worklets when animation is gesture-driven or complex.</li>
  <li>You test on real low-end devices, not just your dev machine.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The render pipeline (5 stages)</h3>
<pre><code class="language-text">JS / event → Style recalc → Layout → Paint → Composite → Pixels on screen
                              │            │
                  changed?    │   needed?  │
                  ┌───────────┘            │
                  ▼                        │
            re-layout subtree              │
                  └────────────────────────┘
                                            ▼
                                       composite layers
                                            ▼
                                       GPU draw

Animating layout properties (top, width) → re-layout EVERY frame.
Animating paint properties (color)        → re-paint EVERY frame.
Animating composite properties (transform, opacity) → SKIP layout AND paint.
</code></pre>

<h3>The "what triggers what" cheat</h3>
<table>
  <thead><tr><th>Property changed</th><th>Layout?</th><th>Paint?</th><th>Composite?</th></tr></thead>
  <tbody>
    <tr><td>width / height / top / left / margin / padding / display / position</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>color / background / border-color / box-shadow / outline / visibility</td><td>—</td><td>✓</td><td>✓</td></tr>
    <tr><td>transform / opacity</td><td>—</td><td>—</td><td>✓</td></tr>
    <tr><td>filter (mostly)</td><td>—</td><td>—</td><td>✓</td></tr>
  </tbody>
</table>

<h3>Layers</h3>
<p>The compositor works with <em>layers</em>. An element gets its own layer when:</p>
<ul>
  <li>It has <code>position: fixed</code> or <code>position: sticky</code>.</li>
  <li>It has <code>transform: translateZ(0)</code> or <code>transform: translate3d</code>.</li>
  <li>It has <code>will-change: transform</code> or <code>will-change: opacity</code>.</li>
  <li>It contains <code>video</code>, <code>canvas</code>, or some media.</li>
  <li>It's a 3D-transformed descendant.</li>
  <li>It overlaps a layer that's already promoted.</li>
</ul>
<p>Each layer costs GPU memory. Promoting everything blows up VRAM and can cause the OS to throttle / kill the page.</p>

<h3><code>will-change</code> — the "promote to layer" hint</h3>
<pre><code class="language-css">.card {
  will-change: transform;   /* promote BEFORE animating */
}
</code></pre>
<ul>
  <li><strong>When to use:</strong> moments before an animation that the browser can't predict (e.g., on hover before applying transform).</li>
  <li><strong>When NOT to use:</strong> on every element. Promoting hundreds of layers tanks memory; can drop performance instead of helping.</li>
  <li><strong>Remove after animation</strong> — you can toggle on JS-side: add <code>will-change</code> on hover, remove on transition end.</li>
</ul>

<h3>The "60fps budget"</h3>
<pre><code class="language-text">Frame budget at 60fps: 16.67ms

Time available for YOUR work: ~10ms
  - Browser overhead: ~1-2ms
  - rAF + style recalc: ~1-2ms
  - Layout + paint: 0-many ms
  - Composite: ~1ms

If you animate a layout property:
  - Layout cost: 1-30ms+ depending on tree size
  - Single-digit-ms tree: just survives
  - Multi-second-ms tree: drops every frame
</code></pre>

<h3>Easing — the "feel" function</h3>
<table>
  <thead><tr><th>Curve</th><th>When</th></tr></thead>
  <tbody>
    <tr><td>linear</td><td>Almost never; feels mechanical</td></tr>
    <tr><td>ease-out (cubic-bezier(0, 0, 0.2, 1))</td><td>Things entering / appearing</td></tr>
    <tr><td>ease-in (cubic-bezier(0.4, 0, 1, 1))</td><td>Things leaving / disappearing (rare)</td></tr>
    <tr><td>ease-in-out (cubic-bezier(0.4, 0, 0.2, 1))</td><td>State-to-state transitions</td></tr>
    <tr><td>spring</td><td>Native-feeling motion (RN-friendly)</td></tr>
    <tr><td>steps()</td><td>Frame-by-frame sprite animation</td></tr>
  </tbody>
</table>

<h3>Spring vs duration animation</h3>
<table>
  <thead><tr><th>Duration animation</th><th>Spring animation</th></tr></thead>
  <tbody>
    <tr><td>Fixed time; same regardless of distance</td><td>Time depends on stiffness, damping, mass, distance</td></tr>
    <tr><td>Predictable</td><td>Natural-feeling</td></tr>
    <tr><td>Easy to chain</td><td>Continuous; physics-based</td></tr>
    <tr><td>CSS / WAAPI default</td><td>iOS native default; popular in mobile / RN</td></tr>
  </tbody>
</table>

<h3>The "composite-only" rule of thumb</h3>
<p>If you find yourself animating anything other than <code>transform</code>, <code>opacity</code>, or <code>filter</code>, ask: "is there a way to express this as a transform?"</p>
<ul>
  <li>"Move element from A to B": <code>transform: translate</code>, not <code>top/left</code>.</li>
  <li>"Resize from 100px to 200px": <code>transform: scale</code>, not <code>width</code>.</li>
  <li>"Fade in": <code>opacity</code>, not <code>visibility</code>.</li>
  <li>"Rotate": <code>transform: rotate</code> always.</li>
  <li>"Color change": stuck on paint; usually fine but watch for fan-out.</li>
</ul>

<h3>JS-driven animation: <code>requestAnimationFrame</code></h3>
<pre><code class="language-js">function animate(start, duration, fn) {
  const t0 = performance.now();
  function step(now) {
    const t = Math.min(1, (now - t0) / duration);
    fn(t);
    if (t &lt; 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

animate(0, 300, (t) =&gt; {
  el.style.transform = \`translateX(\${t * 200}px)\`;
});
</code></pre>
<p>rAF fires before each frame; your callback runs once per frame, synchronously with the compositor. Animating <code>transform</code> via rAF is just as fast as CSS for the same operation.</p>

<h3>The "JS is slow" myth</h3>
<p>JS-driven <code>transform</code>/<code>opacity</code> animations run on the same compositor as CSS — same speed, same characteristics. The difference: CSS is declarative (the browser knows it can prepare ahead); JS is imperative (each frame's value comes from your code). For static animations, declarative is slightly cheaper. For dynamic animations, JS is needed regardless.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>CSS transitions — for state changes</h3>
<pre><code class="language-css">.card {
  transform: translateY(0);
  opacity: 1;
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}

.card.hidden {
  transform: translateY(20px);
  opacity: 0;
}
</code></pre>
<pre><code class="language-js">// Toggle by adding/removing class
card.classList.toggle('hidden');
</code></pre>

<h3>CSS keyframes — for loops or named sequences</h3>
<pre><code class="language-css">@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-10px); }
  75%      { transform: translateX(10px); }
}

.error { animation: shake 200ms ease-in-out; }
</code></pre>

<h3>Animation properties</h3>
<table>
  <thead><tr><th>Property</th><th>Default</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>animation-name</code></td><td>none</td><td>Which @keyframes</td></tr>
    <tr><td><code>animation-duration</code></td><td>0</td><td>How long</td></tr>
    <tr><td><code>animation-timing-function</code></td><td>ease</td><td>Easing curve</td></tr>
    <tr><td><code>animation-delay</code></td><td>0</td><td>Wait before starting</td></tr>
    <tr><td><code>animation-iteration-count</code></td><td>1</td><td>Repeat (or "infinite")</td></tr>
    <tr><td><code>animation-direction</code></td><td>normal</td><td>normal / reverse / alternate</td></tr>
    <tr><td><code>animation-fill-mode</code></td><td>none</td><td>none / forwards / backwards / both</td></tr>
    <tr><td><code>animation-play-state</code></td><td>running</td><td>running / paused</td></tr>
  </tbody>
</table>

<h3>requestAnimationFrame</h3>
<pre><code class="language-js">// rAF basics
let raf;
function loop(timestamp) {
  // do animation work using timestamp (high-res monotonic clock)
  raf = requestAnimationFrame(loop);
}
raf = requestAnimationFrame(loop);

// Cancel
cancelAnimationFrame(raf);
</code></pre>

<h3>Animating with rAF</h3>
<pre><code class="language-js">function move(el, fromX, toX, duration) {
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(t);
    el.style.transform = \`translateX(\${fromX + (toX - fromX) * eased}px)\`;
    if (t &lt; 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
</code></pre>

<h3>CSS variables for runtime values</h3>
<pre><code class="language-css">.card {
  --offset: 0px;
  transform: translateX(var(--offset));
  transition: transform 200ms ease-out;
}
</code></pre>
<pre><code class="language-js">// JS sets the value; CSS handles the animation
card.style.setProperty('--offset', '100px');
</code></pre>

<h3>Detecting animation end</h3>
<pre><code class="language-js">// CSS transitions
el.addEventListener('transitionend', (e) =&gt; {
  if (e.propertyName === 'transform') doSomething();
});

// CSS animations
el.addEventListener('animationend', () =&gt; doSomething());
el.addEventListener('animationiteration', () =&gt; doSomething());
</code></pre>

<h3>will-change usage</h3>
<pre><code class="language-css">/* Bad — always promoted; eats memory */
.card { will-change: transform; }

/* Better — promote only when about to animate */
.card:hover { will-change: transform; }

/* Or via JS */
</code></pre>
<pre><code class="language-js">card.addEventListener('mouseenter', () =&gt; {
  card.style.willChange = 'transform';
});
card.addEventListener('mouseleave', () =&gt; {
  card.style.willChange = 'auto';
});
</code></pre>

<h3>Layer promotion via translate3d (legacy hack)</h3>
<pre><code class="language-css">.card {
  transform: translate3d(0, 0, 0);   /* triggers layer creation in older engines */
}
</code></pre>
<p>Use <code>will-change</code> in modern code; <code>translate3d(0,0,0)</code> is a legacy fallback.</p>

<h3>Reduced motion preference</h3>
<pre><code class="language-css">@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</code></pre>
<p>Respect users with vestibular sensitivity or motion-disabled OS settings. iOS / Android / macOS / Windows all expose this.</p>

<h3>The "double rAF trick" for transitions on newly-mounted elements</h3>
<pre><code class="language-js">// Just-mounted element with .open class — transition won't trigger
el.classList.add('open');

// Wait two frames so the browser has committed initial styles
requestAnimationFrame(() =&gt; {
  requestAnimationFrame(() =&gt; {
    el.classList.add('animating');   // now transition fires
  });
});
</code></pre>

<h3>Scroll-driven animation (modern CSS)</h3>
<pre><code class="language-css">@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.card {
  animation: fadeIn 1s linear;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
</code></pre>
<p>2024+ Chrome / Edge / latest Safari support <code>animation-timeline</code> for scroll-linked animations natively. No JS / IntersectionObserver needed.</p>

<h3>Animating from "auto" (e.g., height: 0 → height: auto)</h3>
<p>CSS doesn't transition from / to <code>auto</code> values. Workarounds:</p>
<ul>
  <li>Animate <code>max-height</code> with a guess (<code>max-height: 1000px</code>); ugly but works.</li>
  <li>Use <code>transform: scaleY()</code> and adjust child's transform-origin.</li>
  <li>JS measure the natural height, set explicit <code>height: 200px</code>, transition.</li>
  <li>Modern: <code>interpolate-size: allow-keywords;</code> (Chrome 129+) finally enables animating to/from auto.</li>
</ul>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Hover with transform (compositor-only)</h3>
<pre><code class="language-css">.button {
  transform: scale(1);
  transition: transform 150ms ease-out;
}
.button:hover {
  transform: scale(1.05);
}
.button:active {
  transform: scale(0.97);
}
</code></pre>

<h3>Example 2: Card flip</h3>
<pre><code class="language-css">.card {
  perspective: 1000px;
}
.card-inner {
  transform-style: preserve-3d;
  transition: transform 600ms;
}
.card.flipped .card-inner {
  transform: rotateY(180deg);
}
.front, .back {
  position: absolute;
  backface-visibility: hidden;
}
.back {
  transform: rotateY(180deg);
}
</code></pre>

<h3>Example 3: Loading spinner</h3>
<pre><code class="language-css">@keyframes rotate {
  to { transform: rotate(360deg); }
}
.spinner {
  width: 24px; height: 24px;
  border: 3px solid #ccc;
  border-top-color: #333;
  border-radius: 50%;
  animation: rotate 1s linear infinite;
}
</code></pre>

<h3>Example 4: Page enter / exit (slide up)</h3>
<pre><code class="language-css">.page {
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.page.open {
  transform: translateY(0);
}
</code></pre>
<pre><code class="language-js">// Mount + animate in
page.classList.add('mounted');
requestAnimationFrame(() =&gt; requestAnimationFrame(() =&gt; {
  page.classList.add('open');
}));

// Animate out + unmount
page.classList.remove('open');
page.addEventListener('transitionend', () =&gt; page.remove(), { once: true });
</code></pre>

<h3>Example 5: Drag with rAF (web)</h3>
<pre><code class="language-js">let dragging = false;
let startX = 0;
let currentX = 0;
let lastFrame = 0;

el.addEventListener('pointerdown', (e) =&gt; {
  dragging = true;
  startX = e.clientX;
  el.setPointerCapture(e.pointerId);
});

el.addEventListener('pointermove', (e) =&gt; {
  if (!dragging) return;
  currentX = e.clientX - startX;
  // batch via rAF: don't update style on every pointermove
  if (!lastFrame) {
    lastFrame = requestAnimationFrame(() =&gt; {
      el.style.transform = \`translateX(\${currentX}px)\`;
      lastFrame = 0;
    });
  }
});

el.addEventListener('pointerup', () =&gt; {
  dragging = false;
  el.style.transition = 'transform 200ms ease-out';
  el.style.transform = 'translateX(0)';
  el.addEventListener('transitionend', () =&gt; {
    el.style.transition = '';
  }, { once: true });
});
</code></pre>

<h3>Example 6: Crossfade between two elements</h3>
<pre><code class="language-css">.crossfade-container { position: relative; }
.crossfade-container &gt; * {
  position: absolute; top: 0; left: 0;
  opacity: 0;
  transition: opacity 250ms ease;
}
.crossfade-container &gt; .visible { opacity: 1; }
</code></pre>

<h3>Example 7: Skeleton shimmer</h3>
<pre><code class="language-css">@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #eee 0%, #ddd 50%, #eee 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
</code></pre>
<p>Note: this animates <code>background-position</code>, which triggers paint. For very large skeletons, swap to a <code>transform</code>-based gradient overlay.</p>

<h3>Example 8: Spring-feeling button press (CSS approximation)</h3>
<pre><code class="language-css">.button {
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.button:active {
  transform: scale(0.95);
}
</code></pre>
<p>The cubic-bezier overshoots slightly, mimicking a spring. For real spring physics use a JS library.</p>

<h3>Example 9: Animating "auto" height</h3>
<pre><code class="language-js">// Open: measure natural height, set explicit height, transition
function expand(el) {
  el.style.height = 'auto';
  const natural = el.offsetHeight;
  el.style.height = '0';
  requestAnimationFrame(() =&gt; requestAnimationFrame(() =&gt; {
    el.style.transition = 'height 200ms ease-out';
    el.style.height = \`\${natural}px\`;
  }));
  el.addEventListener('transitionend', () =&gt; {
    el.style.height = 'auto';      // reset to auto so resize works
    el.style.transition = '';
  }, { once: true });
}
</code></pre>

<h3>Example 10: Profiling with performance.measure()</h3>
<pre><code class="language-js">function animateExample() {
  performance.mark('anim:start');
  // run animation
  performance.mark('anim:end');
  performance.measure('animation-duration', 'anim:start', 'anim:end');
  const entries = performance.getEntriesByName('animation-duration');
  console.log(entries[entries.length - 1].duration);
}
</code></pre>
<p>For real frame-rate monitoring, use the Chrome Performance panel (or RN's Performance Monitor).</p>

<h3>Example 11: Promote-then-cleanup pattern</h3>
<pre><code class="language-js">function expensiveAnimation(el) {
  el.style.willChange = 'transform';

  // run animation (CSS class toggle, rAF, etc.)
  el.classList.add('moving');

  el.addEventListener('transitionend', () =&gt; {
    el.style.willChange = 'auto';   // un-promote
  }, { once: true });
}
</code></pre>

<h3>Example 12: Stagger</h3>
<pre><code class="language-css">.list-item {
  transform: translateY(20px);
  opacity: 0;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}
.list-item.visible {
  transform: translateY(0);
  opacity: 1;
}
</code></pre>
<pre><code class="language-js">items.forEach((item, i) =&gt; {
  setTimeout(() =&gt; item.classList.add('visible'), i * 50);
});
</code></pre>
<p>For larger lists, prefer a single rAF loop staggering through items rather than dozens of setTimeouts.</p>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Animating display: none → block</h3>
<p>You can't transition display. Workarounds:</p>
<ul>
  <li><code>visibility: hidden</code> + <code>opacity: 0</code> for visual effect (still takes space).</li>
  <li><code>height: 0</code> + <code>overflow: hidden</code> for collapse (animatable but layout-triggering).</li>
  <li><code>transform: scale(0)</code> for shrink (composite-only, but still takes space).</li>
  <li>Mount/unmount via JS with the double-rAF trick.</li>
  <li>Modern: <code>display: none</code> is animatable in newer browsers via <code>transition-behavior: allow-discrete</code>.</li>
</ul>

<h3>Layer explosion</h3>
<p>Promoting hundreds of layers via <code>will-change</code> or <code>translate3d</code> can blow up GPU memory. On low-end Android devices, the OS may evict pages. Profile with Chrome DevTools' Layers panel.</p>

<h3>Z-index after promotion</h3>
<p>Promoting an element to its own layer may change stacking. The element rendered with <code>transform: translateZ(0)</code> creates a new stacking context; child <code>position: absolute</code> z-indices are now relative to it.</p>

<h3>iOS Safari position: fixed inside transform</h3>
<p>When an element with <code>position: fixed</code> is descendant of a transformed ancestor, Safari treats it as <code>position: absolute</code>. Common bug for sticky headers inside transformed containers.</p>

<h3>Subpixel rendering</h3>
<p>Animating <code>transform: translateY(0.5px)</code> can produce blurry text on some devices. Use <code>transform: translate3d(0, 0, 0)</code> or whole-pixel translations to keep text crisp.</p>

<h3>Backface-visibility</h3>
<p>3D-flipped elements may show their flipped side unless <code>backface-visibility: hidden</code>. Common in card-flip implementations.</p>

<h3>Browser-specific: transform-style: preserve-3d</h3>
<p>Without preserve-3d, child transforms are flattened into the parent. Often hides 3D effects unexpectedly.</p>

<h3>The "first frame" jump</h3>
<p>Adding a class with both CSS variables and an existing transition can cause the first frame to start at the new value rather than the current. Mitigation: ensure both states are explicit; use the double-rAF trick.</p>

<h3>iOS rubber-band scrolling</h3>
<p>iOS overscrolls past edges with a rubber-band effect. CSS animations during overscroll can fight with native scroll. Disable overscroll bounce on container or use <code>overscroll-behavior: contain</code>.</p>

<h3>Animation timing on Hidden tabs</h3>
<p>Browsers throttle rAF in background tabs (typically to 1Hz). CSS keyframes pause too. Long-running rAF loops should detect <code>document.hidden</code> and pause.</p>

<h3>Reduced motion ignored</h3>
<p>Authors often forget to respect <code>prefers-reduced-motion</code>. iOS users with motion sickness, vestibular disorders see your tween-heavy UI and uninstall.</p>

<h3>scrollIntoView smooth behavior</h3>
<p>Browsers honor <code>scrollIntoView({ behavior: 'smooth' })</code>; older mobile browsers may snap. For consistent behavior, polyfill or write a custom scroll animation.</p>

<h3>FPS measurement caveat</h3>
<p>FPS counters via <code>performance.now()</code> in main thread may report wrong values during heavy main-thread work. Compositor animations may render at 60fps even when JS appears stuck. Use Chrome's frame timeline to be authoritative.</p>

<h3>Hardware acceleration regressions</h3>
<p>Some browser updates regress hardware acceleration for specific properties. <code>filter: blur</code> on iOS Safari has historically been slow. Always test on real devices after a new browser update.</p>

<h3>Animating to / from "0"</h3>
<p>Browsers sometimes don't animate from <code>opacity: 0</code> when <code>display: none</code> hides the element. Use <code>visibility</code> + <code>opacity</code> together or animate after the display state is set.</p>

<h3>Pointer events during animation</h3>
<p>Animating elements may interfere with hit-testing. <code>pointer-events: none</code> during animation prevents accidental triggers; restore after.</p>

<h3>Animation on transformed shadow</h3>
<p>Animating <code>box-shadow</code> is a paint operation; performance varies wildly. Faster: animate a child overlay's <code>transform: scale</code> simulating the shadow.</p>

<h3>Mobile safari & iOS gotcha — <code>filter</code></h3>
<p>iOS Safari sometimes rejects compositor acceleration for <code>filter</code> properties. Test on actual iPhone, not just simulator.</p>

<h3>Anchor positioning + animation</h3>
<p>CSS anchor positioning (Chrome 125+) lets you tie one element's position to another. Combining with transitions can cause layout flicker; avoid until the spec stabilizes.</p>

<h3>RN-specific: the "JS thread" myth</h3>
<p>RN's Animated.timing() with <code>useNativeDriver: false</code> runs on the JS thread; with <code>useNativeDriver: true</code>, it runs on the UI thread. Confusing the two leads to "why is my animation jankky" investigations.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Animating layout properties</h3>
<pre><code class="language-css">/* BAD — re-layouts every frame */
.card { left: 0; transition: left 300ms; }
.card.moved { left: 200px; }

/* GOOD */
.card { transform: translateX(0); transition: transform 300ms; }
.card.moved { transform: translateX(200px); }
</code></pre>

<h3>Bug 2: <code>will-change</code> on every element</h3>
<pre><code class="language-css">/* BAD — promotes every card to its own layer; eats GPU memory */
.card { will-change: transform; }

/* GOOD — promote only when about to animate */
.card:hover { will-change: transform; }
</code></pre>

<h3>Bug 3: setTimeout in animation loops</h3>
<pre><code class="language-js">// BAD — drifts; not synced to frame
setInterval(updatePosition, 16);

// GOOD — synced
function loop() { updatePosition(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
</code></pre>

<h3>Bug 4: First-frame jump</h3>
<pre><code class="language-js">// BAD — no transition because both states applied in same paint
el.style.transition = 'transform 200ms';
el.style.transform = 'translateX(100px)';

// GOOD — apply initial style, force layout, then animate
el.style.transform = 'translateX(0)';
el.offsetHeight;   // force layout
el.style.transition = 'transform 200ms';
el.style.transform = 'translateX(100px)';
</code></pre>

<h3>Bug 5: Multiple transitions stacking</h3>
<pre><code class="language-js">// BAD — running animations stack; jank
button.addEventListener('click', () =&gt; {
  el.classList.add('shake');
  setTimeout(() =&gt; el.classList.remove('shake'), 500);
});
// User clicks rapidly; multiple shakes overlap

// GOOD — abort/restart explicitly
let animTimer;
button.addEventListener('click', () =&gt; {
  clearTimeout(animTimer);
  el.classList.remove('shake');
  void el.offsetHeight;   // restart animation
  el.classList.add('shake');
  animTimer = setTimeout(() =&gt; el.classList.remove('shake'), 500);
});
</code></pre>

<h3>Bug 6: Animation on transitionend that doesn't fire</h3>
<p><code>transitionend</code> fires once per property; if you transition <code>transform</code> and <code>opacity</code>, you get two events. Filter by <code>e.propertyName</code>. If the transition is interrupted (replaced), the event may not fire — wrap in a timer fallback.</p>

<h3>Bug 7: Animating in low-power mode</h3>
<p>iOS / Android's low-power mode throttles animations. Frame rate drops to 30fps or less. Test in low-power mode; consider showing static UI instead of animations when the OS reports low power.</p>

<h3>Bug 8: Forgetting to cancel rAF</h3>
<pre><code class="language-js">// Component unmounts; rAF keeps firing
function start() {
  function loop() { animate(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
}
// Memory leak; CPU drain

// GOOD
let rafId;
function start() {
  function loop() {
    animate();
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);
}
function stop() { cancelAnimationFrame(rafId); }
</code></pre>

<h3>Bug 9: Animations during scroll-jank</h3>
<p>Heavy main-thread work during scroll causes both scroll-jank and animation-jank. Move work off the main thread (Web Workers, off-main-thread animations) or defer until idle.</p>

<h3>Bug 10: Animation values that can't be interpolated</h3>
<pre><code class="language-css">/* CSS doesn't interpolate from auto */
.card { height: auto; }
.card.expanded { height: 300px; }
/* No animation; jumps. */
</code></pre>

<h3>Anti-pattern 1: Animating everything</h3>
<p>Making every state change animated feels delightful initially; users find it slow. Reserve motion for state changes that benefit from continuity. Keep durations short (150-300ms for most UI).</p>

<h3>Anti-pattern 2: Long durations</h3>
<p>500ms+ feels sluggish for UI. 60-150ms for instant feedback (button press), 200-300ms for transitions, &gt;500ms only for showcase animations.</p>

<h3>Anti-pattern 3: Linear easing for UI</h3>
<p>Linear is for progress bars and rotations. UI animations need ease curves: ease-out for entering, ease-in-out for state changes. Linear feels mechanical and wrong.</p>

<h3>Anti-pattern 4: Animations without reduced-motion fallback</h3>
<p>Vestibular sensitivity is real. Always include <code>@media (prefers-reduced-motion)</code> as a baseline.</p>

<h3>Anti-pattern 5: Using JavaScript libraries for trivial animations</h3>
<p>Importing GSAP for a fade-in is overkill. CSS handles 90% of animation needs. Reserve heavy libraries for genuine orchestration / timeline / morph needs.</p>

<h3>Anti-pattern 6: Profiling on dev machine only</h3>
<p>Your M1 Mac runs everything at 120fps. Real users have 5-year-old Android phones with thermal throttling. Test there.</p>

<h3>Anti-pattern 7: Reaching for <code>!important</code> to fix animation conflicts</h3>
<p>Stacking !important breaks specificity reasoning. Refactor instead.</p>

<h3>Anti-pattern 8: Uncoordinated parallel animations</h3>
<p>Three independent animations triggered separately can compete for the main thread. Either choreograph (single timeline) or stagger to avoid contention.</p>

<h3>Anti-pattern 9: Heavy CSS animation complexity</h3>
<p>50 simultaneous keyframe animations across 100 elements WILL drop frames. Either reduce, use containment, or hand off to a library that schedules work.</p>

<h3>Anti-pattern 10: Treating animation as an afterthought</h3>
<p>Adding animations to a finished feature often surfaces jank that's expensive to fix. Profile during development, not after release.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 14 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>Why prefer transform/opacity?</em></td><td>Compositor-only — no layout, no paint; runs on GPU.</td></tr>
    <tr><td><em>What's the 16ms budget?</em></td><td>Frame budget at 60fps; everything per frame must fit.</td></tr>
    <tr><td><em>What's <code>will-change</code>?</em></td><td>Hint to promote element to its own layer; use sparingly.</td></tr>
    <tr><td><em>CSS vs JS animation?</em></td><td>Same speed for compositor properties; CSS declarative, JS dynamic.</td></tr>
    <tr><td><em>What is rAF?</em></td><td><code>requestAnimationFrame</code> — fires before each frame; the right way to schedule animation work.</td></tr>
    <tr><td><em>Why animate <code>transform: translate</code> instead of <code>top/left</code>?</em></td><td>top/left triggers layout; transform doesn't.</td></tr>
    <tr><td><em>What triggers a layer?</em></td><td>position fixed/sticky, transforms, will-change, video, 3D-transformed children.</td></tr>
    <tr><td><em>How do you animate height: auto?</em></td><td>Measure natural height, set explicit, transition; or use scaleY.</td></tr>
    <tr><td><em>What's the prefers-reduced-motion media query?</em></td><td>Browser-level user preference; respect for accessibility.</td></tr>
    <tr><td><em>What's a layer explosion?</em></td><td>Promoting too many elements; eats GPU memory and can hurt performance.</td></tr>
    <tr><td><em>Why is <code>top/left</code> bad?</em></td><td>Triggers layout; reflows ancestors; slow on big trees.</td></tr>
    <tr><td><em>How would you debug janky animation?</em></td><td>Chrome DevTools Performance panel; identify long frames; check what triggered (layout, paint).</td></tr>
    <tr><td><em>What does <code>transform: translateZ(0)</code> do?</em></td><td>Legacy hack to promote layer; modern: <code>will-change: transform</code>.</td></tr>
    <tr><td><em>How is RN different?</em></td><td>No CSS; uses Animated API or Reanimated worklets; same compositor-thread principle.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Write a CSS hover-scale button.</li>
  <li>Write a CSS spinner via @keyframes.</li>
  <li>Convert <code>top/left</code>-based motion to <code>transform: translate</code>.</li>
  <li>Write rAF that animates an element from x=0 to x=200 over 300ms with ease-out.</li>
  <li>Implement a class-toggle slide-in panel with double-rAF trick.</li>
  <li>Add <code>prefers-reduced-motion</code> to a complex animation.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li><code>transition: top</code> — should be transform.</li>
  <li><code>will-change: transform</code> on every list item — layer explosion.</li>
  <li>setInterval driving an animation — should be rAF.</li>
  <li>Animation jumps without transitioning — first-frame; need double-rAF or force layout.</li>
  <li>No reduced-motion fallback — accessibility issue.</li>
  <li>Animation at full speed in low-power mode — should detect and degrade.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Pipeline awareness</td><td>You name the 5 stages: JS → style → layout → paint → composite.</td></tr>
    <tr><td>Compositor-only fluency</td><td>You default to transform/opacity; you can name the alternatives.</td></tr>
    <tr><td><code>will-change</code> discipline</td><td>You use it; you remove it; you avoid blanket usage.</td></tr>
    <tr><td>Performance debugging</td><td>You name DevTools Performance, Layers, FPS overlay.</td></tr>
    <tr><td>Accessibility</td><td>You volunteer prefers-reduced-motion.</td></tr>
    <tr><td>Cross-platform fluency</td><td>You distinguish web CSS vs RN Animated/Reanimated.</td></tr>
    <tr><td>Mobile reality</td><td>You test on low-end devices; you respect frame budget.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>RN doesn't use CSS;</strong> the Animated API and Reanimated are the equivalent. Same principles apply: animate compositor-thread-friendly properties (transform, opacity).</li>
  <li><strong><code>useNativeDriver: true</code></strong> is RN's "promote to native thread" — equivalent to running on the compositor.</li>
  <li><strong>Reanimated worklets</strong> run on the UI thread; gestures + animations stay smooth even when JS is busy.</li>
  <li><strong>iOS spring physics</strong> is the platform-native feel; RN's Animated.spring and Reanimated's withSpring approximate it.</li>
  <li><strong>JS-thread Animated</strong> (<code>useNativeDriver: false</code>) is needed for properties native driver doesn't support (e.g., dynamic height); know the tradeoff.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why is the compositor thread separate?"</em> — To keep visual updates running even when the main thread is busy. Scrolling and CSS transform animations work during heavy JS because the compositor doesn't depend on JS execution.</li>
  <li><em>"What's the difference between paint and composite?"</em> — Paint converts vector instructions into bitmap pixels (per layer). Composite assembles all layers into the final framebuffer. Compositor changes only re-composite; paint changes re-rasterize the layer.</li>
  <li><em>"How does <code>transform</code> avoid layout?"</em> — Transform is a 4×4 matrix multiplied with the element's quads at composite time. The element's box in the layout tree doesn't change; ancestors don't reflow.</li>
  <li><em>"Why does <code>position: fixed</code> sometimes break inside transformed parents?"</em> — A transformed ancestor creates a new containing block for descendants, even fixed-positioned ones. Browsers behave differently; Safari is stricter than Chrome.</li>
  <li><em>"How does the OS know to throttle background tabs?"</em> — Browser detects <code>document.hidden = true</code>; rAF callbacks fire at ~1Hz instead of 60Hz. Some throttling kicks in even before tabs go fully background.</li>
  <li><em>"Why are 60fps animations sometimes still janky?"</em> — Frame can be presented at 60Hz but still feel uneven if frames are dropped (33ms apart instead of 16ms). FPS counter doesn't show this; frame-pacing visualizer does.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit existing animations: are they on transform/opacity?</li>
  <li>Find <code>will-change</code> blanket usage; recommend conditional promotion.</li>
  <li>Profile on a real low-end Android device.</li>
  <li>Add prefers-reduced-motion baseline to the design system.</li>
  <li>Build a "frame timeline" debug overlay so the team can see jank in dev.</li>
  <li>Document team conventions: durations, easing, when to use CSS vs library.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add a CSS lint rule rejecting <code>transition: width/height/top/left</code> for non-trivial elements."</li>
  <li>"I'd write a small dev overlay showing FPS + which property triggered each frame's slowdown."</li>
  <li>"I'd benchmark our top animations on real devices; document FPS per device tier."</li>
  <li>"I'd consolidate animation tokens (durations, easings) into design tokens for cross-team consistency."</li>
  <li>"I'd add a feature flag to disable heavy animations in low-power mode."</li>
</ul>
`
    }
  ]
});
