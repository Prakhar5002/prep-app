window.PREP_SITE.registerTopic({
  id: 'anim-waapi',
  module: 'animation',
  title: 'Web Animations API',
  estimatedReadTime: '35 min',
  tags: ['waapi', 'web-animations', 'animation', 'animate', 'keyframes', 'timeline', 'scroll-driven', 'view-timeline'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>The <strong>Web Animations API (WAAPI)</strong> is the browser's native imperative animation interface. Call <code>element.animate(keyframes, options)</code> and you get back an <strong>Animation</strong> object you can play, pause, reverse, scrub, and listen to — without CSS classes or rAF loops. It's effectively "CSS @keyframes from JavaScript with a control object." Browser support is now broad (all modern browsers); WAAPI is the right primitive for dynamic-value JS animations on web.</p>
<ul>
  <li><strong>One-liner:</strong> <code>el.animate([from, to], { duration, easing, fill })</code> returns an Animation object.</li>
  <li><strong>Same compositor benefits as CSS</strong> — animating transform/opacity runs on the compositor thread.</li>
  <li><strong>Imperative control:</strong> <code>animation.pause()</code>, <code>play()</code>, <code>reverse()</code>, <code>currentTime</code>, <code>playbackRate</code>.</li>
  <li><strong>Promises:</strong> <code>animation.finished</code> resolves when done; <code>animation.ready</code> resolves when committed to compositor.</li>
  <li><strong>Modern <code>animation-timeline</code></strong> + WAAPI gives scroll-driven and view-driven animations natively.</li>
  <li><strong>vs CSS:</strong> WAAPI shines when keyframes are dynamic (computed at runtime), when you need timeline control, or when orchestration matters.</li>
  <li><strong>vs libraries:</strong> WAAPI handles ~80% of what GSAP / Framer Motion do. Reach for libraries only when you need timeline scrubbing, complex orchestration, or motion plugins.</li>
  <li><strong>RN does not have WAAPI.</strong> RN uses Animated API or Reanimated; this topic is web-only — but the imperative-control mental model transfers.</li>
</ul>
<p><strong>Mantra:</strong> "WAAPI = CSS keyframes + JS control. First-class browser primitive. Use before reaching for libraries."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is the Web Animations API?</h3>
<p>WAAPI is a JavaScript API that exposes the browser's animation engine directly. It's specified by W3C (CSS Animations and Web Animations modules) and implemented natively by all modern browsers. The same engine that runs your CSS animations runs WAAPI animations.</p>

<h3>The shape</h3>
<pre><code class="language-js">const animation = element.animate(
  // keyframes
  [
    { transform: 'translateX(0)', opacity: 0 },
    { transform: 'translateX(100px)', opacity: 1 }
  ],
  // options
  {
    duration: 300,
    easing: 'ease-out',
    fill: 'forwards',
  }
);

// Returned Animation has methods/properties
animation.pause();
animation.play();
animation.finished.then(() =&gt; console.log('done'));
</code></pre>

<h3>Why WAAPI exists</h3>
<p>Pre-WAAPI, you had two paths for JS-driven animation:</p>
<ol>
  <li><strong>requestAnimationFrame loops</strong> — main-thread; you compute every frame's value.</li>
  <li><strong>CSS class toggles</strong> — declarative but limited control.</li>
</ol>
<p>Neither was great for dynamic, controllable animations. WAAPI gave JS access to the same fast pipeline as CSS, with imperative control.</p>

<h3>What WAAPI gives you over rAF</h3>
<table>
  <thead><tr><th>Feature</th><th>rAF</th><th>WAAPI</th></tr></thead>
  <tbody>
    <tr><td>Compositor-thread acceleration</td><td>Only if you mutate transform/opacity</td><td>Yes — runs on compositor for those properties</td></tr>
    <tr><td>Pause / resume</td><td>Roll your own</td><td>Built-in</td></tr>
    <tr><td>Reverse</td><td>Roll your own</td><td>Built-in</td></tr>
    <tr><td>Playback rate scrubbing</td><td>Roll your own</td><td>Built-in</td></tr>
    <tr><td>Timeline control</td><td>Hard</td><td>Native</td></tr>
    <tr><td>Completion promise</td><td>Custom</td><td><code>animation.finished</code></td></tr>
    <tr><td>Cancel</td><td>cancelAnimationFrame</td><td><code>animation.cancel()</code></td></tr>
  </tbody>
</table>

<h3>What WAAPI gives you over CSS</h3>
<table>
  <thead><tr><th>Feature</th><th>CSS</th><th>WAAPI</th></tr></thead>
  <tbody>
    <tr><td>Dynamic keyframes (runtime values)</td><td>Hard (CSS variables help)</td><td>Trivial</td></tr>
    <tr><td>Imperative trigger</td><td>Class toggle</td><td>Direct call</td></tr>
    <tr><td>Pause / reverse during animation</td><td>Limited (animation-play-state)</td><td>Native</td></tr>
    <tr><td>Listen for completion</td><td>animationend event</td><td>Promise</td></tr>
    <tr><td>Scrub to specific time</td><td>Not really</td><td>animation.currentTime</td></tr>
    <tr><td>Compose multiple animations</td><td>Multiple animation properties</td><td>Multiple animate() calls; iterable</td></tr>
  </tbody>
</table>

<h3>Browser support today</h3>
<p>All modern browsers (Chrome, Edge, Safari 13.1+, Firefox 75+) support WAAPI core. <code>animation-timeline</code> (scroll-driven) is Chrome / Edge / Safari TP / pending Firefox. Polyfill: <code>web-animations-js</code> from Google for older browsers.</p>

<h3>When to use WAAPI</h3>
<ul>
  <li>Animation values come from data (drag distance, scroll position, computed measurements).</li>
  <li>You need to pause / resume / reverse mid-animation.</li>
  <li>You need to await animation completion (Promise-friendly).</li>
  <li>You're building a pattern that needs runtime control (toast queue, drag-snap, swipe-to-dismiss).</li>
  <li>You want to scrub through an animation based on user input.</li>
</ul>

<h3>When CSS is enough</h3>
<ul>
  <li>Hover / focus state changes.</li>
  <li>Static loading spinners.</li>
  <li>Page enter / exit driven by class toggle.</li>
  <li>Anything where the keyframe values are known at write-time.</li>
</ul>

<h3>When to reach for a library</h3>
<ul>
  <li>Complex timeline orchestration (GSAP).</li>
  <li>Layout-aware transitions across components (Framer Motion's layout animations).</li>
  <li>Path morphing / SVG complex animations.</li>
  <li>Motion plugins (physics, scroll-link, draggable bundles).</li>
</ul>

<h3>Why interviewers ask</h3>
<ol>
  <li>Tests modern browser-API knowledge — many candidates only know rAF and CSS.</li>
  <li>Tests imperative animation reasoning (pause/resume/scrub).</li>
  <li>Distinguishes "I write animations" from "I understand the animation engine."</li>
  <li>Mobile-relevant via mental-model transfer to RN's Animated API.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You reach for WAAPI when CSS isn't enough but a library is overkill.</li>
  <li>You use <code>animation.finished</code> as a Promise.</li>
  <li>You compose multiple animate() calls without state-machine confusion.</li>
  <li>You know the gotchas: <code>fill</code> mode, persistence after completion, easing values.</li>
  <li>You can build common patterns (drag-snap, swipe-to-dismiss, FLIP) using WAAPI.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The Animation object</h3>
<pre><code class="language-text">element.animate(keyframes, options) → Animation

Animation properties:
  currentTime       // ms into the animation; can be set
  playbackRate      // 1 = normal, -1 = reverse, 2 = double speed
  playState         // 'idle' | 'running' | 'paused' | 'finished'
  startTime         // when it started (timeline-relative)
  finished          // Promise that resolves on completion
  ready             // Promise that resolves when committed to compositor
  effect            // KeyframeEffect — the keyframes + options
  timeline          // DocumentTimeline (default) or ScrollTimeline

Animation methods:
  play()
  pause()
  reverse()
  cancel()
  finish()          // jump to end
  commitStyles()    // apply current state as inline styles
  persist()         // keep around after finish (default removes)
  updatePlaybackRate(rate)   // smooth rate change
</code></pre>

<h3>Keyframe shapes</h3>
<pre><code class="language-js">// Array of states
[
  { transform: 'translateX(0)' },
  { transform: 'translateX(100px)' }
]

// With offset (where in the timeline)
[
  { transform: 'translateX(0)', offset: 0 },
  { transform: 'translateX(50px)', offset: 0.5 },
  { transform: 'translateX(100px)', offset: 1 }
]

// With easing per-segment
[
  { transform: 'translateX(0)' },
  { transform: 'translateX(100px)', easing: 'ease-out' },
  { transform: 'translateX(100px) rotate(180deg)' }
]

// Object form (alternative syntax)
{
  transform: ['translateX(0)', 'translateX(100px)'],
  opacity: [0, 1]
}
</code></pre>

<h3>Options</h3>
<pre><code class="language-js">{
  duration: 300,             // ms; required
  easing: 'ease-out',        // 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier(...)' | 'steps(...)'
  delay: 0,                  // ms before starting
  endDelay: 0,               // ms after finishing before "finished"
  iterations: 1,             // or Infinity
  iterationStart: 0,         // start partway through iteration 0
  direction: 'normal',       // 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fill: 'none',              // 'none' | 'forwards' | 'backwards' | 'both'
  composite: 'replace',      // 'replace' | 'add' | 'accumulate'
  iterationComposite: 'replace',
  pseudoElement: '::before', // animate pseudo-elements
  id: 'my-animation'         // for debugging / multiple animations on same element
}
</code></pre>

<h3>fill mode in 60 seconds</h3>
<table>
  <thead><tr><th>fill value</th><th>Before delay</th><th>After end</th></tr></thead>
  <tbody>
    <tr><td>none (default)</td><td>Element's underlying value</td><td>Element's underlying value</td></tr>
    <tr><td>backwards</td><td>First keyframe</td><td>Element's underlying value</td></tr>
    <tr><td>forwards</td><td>Element's underlying value</td><td>Last keyframe</td></tr>
    <tr><td>both</td><td>First keyframe</td><td>Last keyframe</td></tr>
  </tbody>
</table>
<p>Without <code>fill: 'forwards'</code>, the animation snaps back to the original style at the end. Common gotcha.</p>

<h3>The "commit" alternative</h3>
<p>Instead of <code>fill: 'forwards'</code>, you can <code>animation.commitStyles()</code> at the end — bakes the current state into inline styles. Useful when you'll continue animating from that state.</p>

<h3>The default DocumentTimeline</h3>
<p>By default, animation runs on the document timeline (browser's monotonic clock). You can pass a custom timeline:</p>
<pre><code class="language-js">// Scroll-driven (Chrome 115+, others catching up)
const timeline = new ScrollTimeline({ source: document.scrollingElement, axis: 'block' });
el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, timeline });

// View-driven (when element scrolls into view)
const viewTimeline = new ViewTimeline({ subject: target, axis: 'block' });
target.animate([{ transform: 'translateY(20px)' }, { transform: 'translateY(0)' }], { duration: 1, timeline: viewTimeline });
</code></pre>

<h3>Promise interface</h3>
<pre><code class="language-js">const anim = el.animate(...);

// Wait for completion (or rejection on cancel)
try {
  await anim.finished;
  console.log('done');
} catch (e) {
  // Animation was cancelled; promise rejects
}

// Wait for compositor commit
await anim.ready;
</code></pre>

<h3>Composite operations</h3>
<table>
  <thead><tr><th>composite value</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td>replace</td><td>This animation's value replaces underlying. Default.</td></tr>
    <tr><td>add</td><td>Stacks (e.g., transform: translateX(50) + translateY(50) = both apply)</td></tr>
    <tr><td>accumulate</td><td>Like add but accumulates across iterations</td></tr>
  </tbody>
</table>
<p>Useful for combining multiple animations on the same property (e.g., a spring on top of a translate).</p>

<h3>Multiple animations on one element</h3>
<pre><code class="language-js">// Each call creates an independent Animation
const fade = el.animate({ opacity: [0, 1] }, { duration: 300 });
const move = el.animate({ transform: ['translateX(0)', 'translateX(100px)'] }, { duration: 600 });

// They run independently; you can pause one and not the other
fade.pause();
</code></pre>

<h3>Listing animations on an element</h3>
<pre><code class="language-js">const animations = el.getAnimations();
animations.forEach(a =&gt; console.log(a.id));
// All animations on the element + descendants if { subtree: true }
</code></pre>

<h3>Cancelling all animations</h3>
<pre><code class="language-js">document.getAnimations().forEach(a =&gt; a.cancel());
</code></pre>

<h3>The "imperative is faster than CSS" myth</h3>
<p>WAAPI animations of compositor properties run on the compositor — same as CSS. The execution speed is identical. WAAPI's value is control + dynamic values, not raw speed.</p>

<h3>Reduced motion</h3>
<pre><code class="language-js">const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  el.animate(...);
} else {
  el.animate(..., { duration: 0.01 });   // effectively instant
}
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Basic animation</h3>
<pre><code class="language-js">const card = document.querySelector('.card');

const anim = card.animate(
  [
    { opacity: 0, transform: 'translateY(20px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ],
  {
    duration: 300,
    easing: 'ease-out',
    fill: 'forwards'
  }
);
</code></pre>

<h3>Async / Promise pattern</h3>
<pre><code class="language-js">async function fadeIn(el) {
  await el.animate(
    { opacity: [0, 1] },
    { duration: 200, fill: 'forwards' }
  ).finished;
}

async function showSequence(el) {
  await fadeIn(el);
  // do something after
  await el.animate({ transform: ['translateY(0)', 'translateY(-10px)', 'translateY(0)'] }, { duration: 400 }).finished;
}
</code></pre>

<h3>Pause / resume</h3>
<pre><code class="language-js">const anim = el.animate({ transform: ['translateX(0)', 'translateX(200px)'] }, { duration: 1000 });

button.addEventListener('click', () =&gt; {
  if (anim.playState === 'running') anim.pause();
  else anim.play();
});
</code></pre>

<h3>Reverse</h3>
<pre><code class="language-js">const anim = el.animate({ transform: ['translateX(0)', 'translateX(200px)'] }, { duration: 600 });
anim.reverse();   // animates back; subsequent reverse() calls toggle direction
</code></pre>

<h3>Scrub by setting currentTime</h3>
<pre><code class="language-js">const anim = el.animate(keyframes, { duration: 1000, fill: 'forwards' });
anim.pause();   // important — paused state lets you scrub

slider.addEventListener('input', () =&gt; {
  anim.currentTime = slider.value * 10;   // 0..1000
});
</code></pre>

<h3>Cancellable</h3>
<pre><code class="language-js">const anim = el.animate(...);

abortButton.addEventListener('click', () =&gt; anim.cancel());

// On cancel: animation.finished rejects with AbortError
try {
  await anim.finished;
} catch (e) {
  if (e.name === 'AbortError') console.log('cancelled');
  else throw e;
}
</code></pre>

<h3>Spring-like animation via cubic-bezier overshoot</h3>
<pre><code class="language-js">el.animate(
  { transform: ['scale(1)', 'scale(0.95)'] },
  { duration: 200, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
);
// Approximates a slight overshoot. For real spring physics, use a library.
</code></pre>

<h3>Stagger</h3>
<pre><code class="language-js">items.forEach((item, i) =&gt; {
  item.animate(
    { transform: ['translateY(20px)', 'translateY(0)'], opacity: [0, 1] },
    { duration: 300, delay: i * 50, fill: 'forwards', easing: 'ease-out' }
  );
});
</code></pre>

<h3>Multiple properties with staggered timing</h3>
<pre><code class="language-js">// Single animation with multiple keyframes
el.animate(
  [
    { opacity: 0, transform: 'translateY(20px)', offset: 0 },
    { opacity: 0.5, offset: 0.3 },                              // half-fade at 30%
    { opacity: 1, transform: 'translateY(0)', offset: 1 }
  ],
  { duration: 400, easing: 'ease-out' }
);

// Or two animations
el.animate({ opacity: [0, 1] }, { duration: 200 });
el.animate({ transform: ['translateY(20px)', 'translateY(0)'] }, { duration: 400, easing: 'ease-out' });
</code></pre>

<h3>Interruptible animation (replace if running)</h3>
<pre><code class="language-js">const slot = new Map();   // element → current animation

function animate(el, keyframes, options) {
  const existing = slot.get(el);
  if (existing) existing.cancel();
  const anim = el.animate(keyframes, options);
  slot.set(el, anim);
  return anim;
}

// User clicks rapidly; each call cancels the previous
button.addEventListener('click', () =&gt; {
  animate(card, { transform: ['scale(1)', 'scale(1.1)', 'scale(1)'] }, { duration: 300 });
});
</code></pre>

<h3>commitStyles for "stay at end"</h3>
<pre><code class="language-js">const anim = el.animate(
  { transform: ['translateX(0)', 'translateX(100px)'] },
  { duration: 300 }    // no fill: 'forwards'
);
await anim.finished;
anim.commitStyles();   // bakes current state into inline style
anim.cancel();         // remove from active animations
// Element is now at translateX(100px) via inline style
</code></pre>

<h3>persist() — keep animation around after finish</h3>
<pre><code class="language-js">const anim = el.animate(...);
anim.persist();   // by default, finished animations are GC'd; persist keeps them
</code></pre>

<h3>Listening to events (alternative to Promise)</h3>
<pre><code class="language-js">anim.addEventListener('finish', () =&gt; console.log('done'));
anim.addEventListener('cancel', () =&gt; console.log('cancelled'));
anim.addEventListener('remove', () =&gt; console.log('removed from active'));
</code></pre>

<h3>Compose: layer animations</h3>
<pre><code class="language-js">// Two transforms via composite: 'add'
el.animate(
  { transform: 'translateX(50px)' },
  { duration: 1000, fill: 'forwards', composite: 'add' }
);
el.animate(
  { transform: 'translateY(50px)' },
  { duration: 1000, fill: 'forwards', composite: 'add' }
);
// Result: element moves diagonally (both transforms applied)
</code></pre>

<h3>Scroll-driven animation (modern)</h3>
<pre><code class="language-js">// Progress bar tied to page scroll
const bar = document.querySelector('.progress');
bar.animate(
  { transform: ['scaleX(0)', 'scaleX(1)'] },
  {
    fill: 'both',
    timeline: new ScrollTimeline({
      source: document.scrollingElement,
      axis: 'y'
    })
  }
);
</code></pre>

<h3>View timeline (when element enters viewport)</h3>
<pre><code class="language-js">const target = document.querySelector('.fade-on-scroll');
target.animate(
  { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
  {
    fill: 'both',
    timeline: new ViewTimeline({ subject: target, axis: 'y' }),
    rangeStart: 'cover 0%',
    rangeEnd: 'cover 50%'
  }
);
</code></pre>

<h3>Update playback rate smoothly</h3>
<pre><code class="language-js">const anim = el.animate(...);
anim.updatePlaybackRate(2);   // smoothly accelerates rather than jumping
</code></pre>

<h3>Animation groups (legacy / experimental)</h3>
<p>The Web Animations Level 2 spec includes <code>GroupEffect</code> for orchestrating multiple animations as a single object. Implementation is patchy; for now, use library equivalents (GSAP timelines) or roll your own.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Toast notification</h3>
<pre><code class="language-js">async function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  await toast.animate(
    [
      { transform: 'translateY(100%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ],
    { duration: 200, easing: 'ease-out', fill: 'forwards' }
  ).finished;

  await new Promise(r =&gt; setTimeout(r, 3000));   // hold

  await toast.animate(
    { opacity: [1, 0] },
    { duration: 200, fill: 'forwards' }
  ).finished;

  toast.remove();
}
</code></pre>

<h3>Example 2: Drag-and-snap</h3>
<pre><code class="language-js">let startX = 0;
let currentX = 0;

card.addEventListener('pointerdown', (e) =&gt; {
  startX = e.clientX;
  card.setPointerCapture(e.pointerId);
});

card.addEventListener('pointermove', (e) =&gt; {
  if (!card.hasPointerCapture(e.pointerId)) return;
  currentX = e.clientX - startX;
  card.style.transform = \`translateX(\${currentX}px)\`;
});

card.addEventListener('pointerup', () =&gt; {
  // Snap back to 0 with WAAPI
  const anim = card.animate(
    { transform: [\`translateX(\${currentX}px)\`, 'translateX(0)'] },
    { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
  );
  anim.finished.then(() =&gt; {
    card.style.transform = '';
  });
  currentX = 0;
});
</code></pre>

<h3>Example 3: Swipe-to-dismiss</h3>
<pre><code class="language-js">async function dismissCard(card, direction = 1) {
  const distance = direction * window.innerWidth;
  await card.animate(
    { transform: [\`translateX(0)\`, \`translateX(\${distance}px)\`], opacity: [1, 0] },
    { duration: 300, easing: 'ease-in', fill: 'forwards' }
  ).finished;
  card.remove();
}
</code></pre>

<h3>Example 4: Page transition with WAAPI</h3>
<pre><code class="language-js">async function transitionToPage(oldEl, newEl) {
  const exitAnim = oldEl.animate(
    { opacity: [1, 0], transform: ['translateX(0)', 'translateX(-30px)'] },
    { duration: 200, easing: 'ease-in', fill: 'forwards' }
  );

  await exitAnim.finished;
  oldEl.remove();
  newEl.style.opacity = '0';
  document.body.appendChild(newEl);

  await newEl.animate(
    { opacity: [0, 1], transform: ['translateX(30px)', 'translateX(0)'] },
    { duration: 200, easing: 'ease-out', fill: 'forwards' }
  ).finished;
}
</code></pre>

<h3>Example 5: Skeleton loader fade</h3>
<pre><code class="language-js">function showSkeleton(el) {
  el.animate(
    { opacity: [0.4, 1, 0.4] },
    { duration: 1500, iterations: Infinity, easing: 'ease-in-out' }
  );
}
// Stop when content arrives
const anims = el.getAnimations();
anims.forEach(a =&gt; a.cancel());
</code></pre>

<h3>Example 6: Number counter animation</h3>
<pre><code class="language-js">function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (t &lt; 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
// rAF here because text content can't be CSS-animated; WAAPI doesn't support it.
// Use WAAPI for transform/opacity; rAF for animating non-style values.
</code></pre>

<h3>Example 7: Modal open/close with promise chain</h3>
<pre><code class="language-js">async function openModal() {
  modalOverlay.style.display = 'block';
  const overlayAnim = modalOverlay.animate({ opacity: [0, 1] }, { duration: 200, fill: 'forwards' });
  const cardAnim = modalCard.animate(
    { opacity: [0, 1], transform: ['scale(0.96)', 'scale(1)'] },
    { duration: 250, easing: 'ease-out', fill: 'forwards' }
  );
  await Promise.all([overlayAnim.finished, cardAnim.finished]);
}

async function closeModal() {
  await Promise.all([
    modalCard.animate({ opacity: [1, 0], transform: ['scale(1)', 'scale(0.96)'] }, { duration: 200, fill: 'forwards' }).finished,
    modalOverlay.animate({ opacity: [1, 0] }, { duration: 200, fill: 'forwards' }).finished,
  ]);
  modalOverlay.style.display = 'none';
}
</code></pre>

<h3>Example 8: Persistent button state via commitStyles</h3>
<pre><code class="language-js">async function morphButton(button) {
  const anim = button.animate(
    { width: ['100px', '40px'], borderRadius: ['8px', '50%'] },
    { duration: 300, fill: 'forwards' }
  );
  await anim.finished;
  anim.commitStyles();
  anim.cancel();
}
// Without commit, re-renders / class changes might revert.
</code></pre>

<h3>Example 9: Pause animation when element leaves viewport</h3>
<pre><code class="language-js">const anims = new Map();

const observer = new IntersectionObserver((entries) =&gt; {
  entries.forEach((e) =&gt; {
    const anim = anims.get(e.target);
    if (!anim) return;
    if (e.isIntersecting) anim.play();
    else anim.pause();
  });
});

cards.forEach(card =&gt; {
  const anim = card.animate(...);
  anims.set(card, anim);
  observer.observe(card);
});
</code></pre>

<h3>Example 10: Reduced motion fallback</h3>
<pre><code class="language-js">const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function gentleAnim(el, from, to) {
  return el.animate({ transform: [from, to] }, {
    duration: reduce ? 0.01 : 300,
    easing: reduce ? 'linear' : 'ease-out',
    fill: 'forwards'
  }).finished;
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>fill: 'none' (the default) snaps back</h3>
<pre><code class="language-js">// Animation finishes; element snaps to original style
el.animate({ transform: ['translateX(0)', 'translateX(100px)'] }, { duration: 300 });
// After 300ms: element is back at translateX(0)

// Use fill: 'forwards' to stay
el.animate(..., { duration: 300, fill: 'forwards' });
</code></pre>

<h3>fill: 'forwards' eventually GC'd</h3>
<p>Spec says completed animations may be removed from the active list. Style snaps back. Workarounds: <code>animation.persist()</code>, or commit styles to inline.</p>

<h3>commitStyles requirements</h3>
<p>commitStyles() throws if the animation's effect can't be committed (some properties don't have inline-style equivalents). Wrap in try/catch.</p>

<h3>Cancel rejects finished promise</h3>
<pre><code class="language-js">try {
  await anim.finished;
} catch (e) {
  // AbortError on cancel
}
// Or check anim.playState before awaiting
</code></pre>

<h3>WAAPI doesn't animate non-CSS values</h3>
<p>Text content, attributes, scrollTop, dataset values — not animatable. Use rAF for those.</p>

<h3>Multiple animations on same property</h3>
<p>Default <code>composite: 'replace'</code> means the most recently started animation wins. <code>composite: 'add'</code> stacks. For complex orchestration, prefer one animation with multiple keyframes.</p>

<h3>animation-timeline browser support</h3>
<p>ScrollTimeline / ViewTimeline are Chrome-led. Safari and Firefox lag (as of 2026). Polyfill via <code>scroll-timeline-polyfill</code> or feature-detect.</p>

<h3>Pseudo-element animation</h3>
<pre><code class="language-js">el.animate(keyframes, { pseudoElement: '::before', duration: 300 });
// You can animate ::before / ::after via WAAPI; not all engines support all properties.
</code></pre>

<h3>Performance: many simultaneous animations</h3>
<p>Hundreds of WAAPI animations on different elements work. Hundreds on the same property of the same element via composite: 'add' can pile up. Use sparingly; one timeline often beats N animations.</p>

<h3>Animation timing on hidden tabs</h3>
<p>Like CSS, WAAPI throttles in background tabs. <code>document.hidden</code> = throttled. The <code>finished</code> promise still resolves but later than expected.</p>

<h3>Animation events fire late</h3>
<p>The <code>finish</code> event fires asynchronously after the animation completes. By the time your handler runs, more frames may have rendered. For frame-tight logic, prefer <code>animation.finished.then(...)</code> + commit styles.</p>

<h3>Easing strings</h3>
<p>Standard names: linear, ease, ease-in, ease-out, ease-in-out, step-start, step-end. cubic-bezier(x1, y1, x2, y2) for custom. <code>steps(n, jump-start | jump-end | jump-both | jump-none)</code> for sprite-style.</p>

<h3>Spring easing — not native</h3>
<p>WAAPI doesn't support spring physics directly. Approximate with cubic-bezier overshoot, or pre-compute keyframes from a spring formula, or use a library.</p>

<h3>Browser-specific: Safari composite mode</h3>
<p>Safari historically had bugs with <code>composite: 'add'</code> on transform. Test cross-browser.</p>

<h3>iOS Safari + scroll timeline</h3>
<p>iOS Safari lags Chrome on scroll-driven animations. Use a JS-driven IntersectionObserver fallback for a wider audience.</p>

<h3>Returning <code>animation</code> from React effects</h3>
<pre><code class="language-jsx">useEffect(() =&gt; {
  const anim = el.animate(...);
  return () =&gt; anim.cancel();   // cleanup on unmount
}, []);
</code></pre>

<h3>StrictMode double-fires effects</h3>
<p>React 18 StrictMode runs effects twice in dev. Without proper cleanup, animations stack. Always cancel in cleanup.</p>

<h3>Animation in Suspense boundaries</h3>
<p>If your component suspends mid-animation, the Animation object survives but the element may be unmounted. Use cleanup; don't rely on the animation completing.</p>

<h3>Animation outliving element</h3>
<p>If the element is removed while animation is running, the animation is GC'd. <code>finished</code> promise still resolves but the visual effect is gone.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: forgetting <code>fill: 'forwards'</code></h3>
<pre><code class="language-js">// Element snaps back at end
el.animate({ transform: ['translateX(0)', 'translateX(100px)'] }, { duration: 300 });

// FIX
el.animate({ transform: ['translateX(0)', 'translateX(100px)'] }, { duration: 300, fill: 'forwards' });
</code></pre>

<h3>Bug 2: not awaiting <code>finished</code></h3>
<pre><code class="language-js">// Subsequent code runs immediately, before animation completes
el.animate(...);
doNextThing();   // happens too soon

// FIX
await el.animate(...).finished;
doNextThing();
</code></pre>

<h3>Bug 3: animation cancels not handled</h3>
<pre><code class="language-js">// Without try/catch, AbortError on cancel propagates
await anim.finished;   // may throw

// FIX
try { await anim.finished; }
catch (e) { if (e.name !== 'AbortError') throw e; }
</code></pre>

<h3>Bug 4: stacking animations on same property</h3>
<pre><code class="language-js">// Each click adds a new animation; they stack and conflict
button.addEventListener('click', () =&gt; {
  card.animate(...);
});

// FIX — cancel previous
let current;
button.addEventListener('click', () =&gt; {
  current?.cancel();
  current = card.animate(...);
});
</code></pre>

<h3>Bug 5: animating non-animatable property</h3>
<pre><code class="language-js">// font-family isn't animatable; silently ignored or weirdly interpreted
el.animate({ fontFamily: ['Arial', 'Times'] }, { duration: 1000 });
// Result: jumps mid-way. WAAPI can't tween font-family.
</code></pre>

<h3>Bug 6: missing cleanup in React</h3>
<pre><code class="language-jsx">useEffect(() =&gt; {
  el.animate(...);
  // forgot return () =&gt; anim.cancel();
}, []);
// In StrictMode, animations stack; in unmount mid-flight, animation continues.
</code></pre>

<h3>Bug 7: forgetting commitStyles when persisting state</h3>
<p>Animation's effect may be GC'd; element snaps to original. Either persist + fill: 'forwards' or commitStyles + cancel.</p>

<h3>Bug 8: scroll timeline without polyfill</h3>
<p>Code works in Chrome; Safari users see no animation. Detect support; provide IntersectionObserver fallback.</p>

<h3>Bug 9: too many keyframes</h3>
<p>WAAPI handles 50 keyframes fine. 5,000 keyframes (e.g., per-pixel scroll) are wasteful — use a single keyframe pair with timeline-driven progress instead.</p>

<h3>Bug 10: missing prefers-reduced-motion</h3>
<p>Same as CSS. WAAPI animations need the same accessibility consideration.</p>

<h3>Anti-pattern 1: WAAPI for things CSS handles</h3>
<p>Hover effects, simple state changes — CSS is simpler. Reach for WAAPI when control is needed.</p>

<h3>Anti-pattern 2: rolling your own pause/resume on rAF when WAAPI exists</h3>
<p>Custom timeline state machines are bug nurseries. WAAPI gives you Animation.pause()/play() for free.</p>

<h3>Anti-pattern 3: heavy WAAPI for orchestration</h3>
<p>If you're managing 20 animations across 5 components with branching, GSAP / Framer Motion give you a richer timeline. WAAPI is fine for 5-10 coordinated animations; beyond that, libraries shine.</p>

<h3>Anti-pattern 4: animating layout properties via WAAPI</h3>
<p>WAAPI doesn't change the rules. <code>el.animate({ width: [...] })</code> still runs on the main thread. Stick to transform/opacity for the same compositor benefits.</p>

<h3>Anti-pattern 5: ignoring browser support gaps</h3>
<p>animation-timeline / ViewTimeline are bleeding-edge. Production code needs feature detection or fallback.</p>

<h3>Anti-pattern 6: not capping running animations</h3>
<p>Each WAAPI animation has a small cost. Hundreds of simultaneous animations on a page (e.g., particles) can degrade perf. Either cap or use canvas / WebGL.</p>

<h3>Anti-pattern 7: animation as side effect</h3>
<pre><code class="language-jsx">function Card({ open }) {
  // BAD — runs on every render; animation re-fires unnecessarily
  el.animate(...);
}
// FIX — useEffect with proper deps
</code></pre>

<h3>Anti-pattern 8: storing animation reference in state</h3>
<p>Animations are imperative; React state should hold serializable values. Use refs for animation references.</p>

<h3>Anti-pattern 9: testing against WAAPI</h3>
<p>JSDOM doesn't implement WAAPI. Tests that rely on <code>el.animate()</code> need a polyfill or to mock animations entirely.</p>

<h3>Anti-pattern 10: skipping the timeline option</h3>
<p>For scroll-linked / view-linked behavior, use the modern timeline API instead of rolling your own scroll-listener loop. Native is faster and simpler.</p>
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
    <tr><td><em>What is WAAPI?</em></td><td>Browser-native animation API: <code>el.animate(keyframes, options)</code> returns an Animation object.</td></tr>
    <tr><td><em>WAAPI vs CSS?</em></td><td>Same compositor; CSS declarative, WAAPI imperative + dynamic + controllable.</td></tr>
    <tr><td><em>WAAPI vs rAF?</em></td><td>WAAPI runs on compositor for compositor properties; rAF runs in JS each frame. WAAPI also gives pause/reverse/scrub for free.</td></tr>
    <tr><td><em>What does <code>fill: 'forwards'</code> do?</em></td><td>Keeps the final keyframe value applied after the animation ends.</td></tr>
    <tr><td><em>What's <code>commitStyles()</code>?</em></td><td>Bakes the animation's current state into inline styles.</td></tr>
    <tr><td><em>How do you await an animation?</em></td><td><code>await animation.finished</code></td></tr>
    <tr><td><em>How do you cancel?</em></td><td><code>animation.cancel()</code> — finished promise rejects with AbortError.</td></tr>
    <tr><td><em>What's a ScrollTimeline?</em></td><td>Driving animation progress by scroll position rather than time.</td></tr>
    <tr><td><em>How do you implement spring physics?</em></td><td>Approximate with cubic-bezier overshoot, or pre-compute spring keyframes, or use a library.</td></tr>
    <tr><td><em>How do multiple animations on the same property interact?</em></td><td>Default composite: 'replace' — last-started wins. Use composite: 'add' to stack.</td></tr>
    <tr><td><em>Browser support?</em></td><td>Core: all modern browsers. ScrollTimeline: Chromium first, Safari/Firefox catching up.</td></tr>
    <tr><td><em>RN equivalent?</em></td><td>RN doesn't have WAAPI; use Animated API or Reanimated.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Animate fade-in with <code>fill: 'forwards'</code> using WAAPI.</li>
  <li>Build a toast with WAAPI promise chain.</li>
  <li>Implement pause/resume button.</li>
  <li>Implement reverse on user input.</li>
  <li>Build a scrub-by-slider for an animation.</li>
  <li>Build swipe-to-dismiss with cancel-and-restart logic.</li>
  <li>Implement scroll-driven progress bar with ScrollTimeline + IO fallback.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Animation snaps back at end — missing <code>fill: 'forwards'</code>.</li>
  <li>Style reverts despite forwards — fill: 'forwards' alone may be GC'd; persist or commit.</li>
  <li>Multiple click triggers stack animations — cancel previous before starting new.</li>
  <li><code>await anim.finished</code> throws — animation cancelled; wrap in try/catch.</li>
  <li>Animation never completes — element removed mid-flight.</li>
  <li>ScrollTimeline doesn't work in Safari — needs polyfill.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>API fluency</td><td>You know el.animate(), the Animation object, .finished, .cancel.</td></tr>
    <tr><td>Imperative control</td><td>You build pause/resume/reverse without complex state machines.</td></tr>
    <tr><td>Promise patterns</td><td>You compose animations with await + Promise.all.</td></tr>
    <tr><td>Compositor awareness</td><td>You know transform/opacity is the right default.</td></tr>
    <tr><td>fill modes</td><td>You can explain forwards / backwards / both / none in 30 seconds.</td></tr>
    <tr><td>Modern timelines</td><td>You know about ScrollTimeline / ViewTimeline and feature-detect.</td></tr>
    <tr><td>Library tradeoffs</td><td>You can defend WAAPI vs GSAP vs Framer Motion.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN does NOT have WAAPI — use Animated or Reanimated.</li>
  <li>The "imperative animation object" mental model transfers: Animated.Value + Animated.timing returns a similar handle.</li>
  <li>Reanimated's withSpring + useSharedValue is closer to WAAPI's KeyframeEffect + Animation in spirit.</li>
  <li>If targeting React Native Web, WAAPI is available in the web bundle but not native bundles.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why does WAAPI have a Promise interface?"</em> — Promises compose; <code>await anim.finished</code> reads cleaner than event listener + state. Async/await fits naturally.</li>
  <li><em>"What's the relationship between Animation and KeyframeEffect?"</em> — KeyframeEffect = "what to animate" (target + keyframes + options). Animation = "when and how it plays" (timeline + state). Animation.effect gives you the KeyframeEffect; you can swap effects for advanced cases.</li>
  <li><em>"Why doesn't WAAPI have spring physics natively?"</em> — Spring needs continuous physics integration; WAAPI is keyframe-based. Spec extensions discussed; for now, libraries fill the gap.</li>
  <li><em>"How does ScrollTimeline differ from a scroll listener + rAF?"</em> — ScrollTimeline runs on the compositor when paired with compositor properties; the animation progress is driven by scroll position natively. Scroll listener + rAF is JS-thread-bound and slower.</li>
  <li><em>"Can WAAPI animate to/from auto?"</em> — Same limits as CSS; doesn't interpolate auto. Use transform-based alternatives.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit existing animations: which use rAF, CSS, or libraries; consider WAAPI migration where appropriate.</li>
  <li>Document team conventions: when WAAPI vs CSS vs library.</li>
  <li>Build a small <code>useAnimate</code> React hook for cleanup-safe animations.</li>
  <li>Add ScrollTimeline polyfill if targeting Safari users.</li>
  <li>Add tests with web-animations-js polyfill in JSDOM.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd build a small <code>useAnimate</code> React hook with proper cleanup and StrictMode safety."</li>
  <li>"I'd add browser-feature-detect for ScrollTimeline and provide an IntersectionObserver fallback."</li>
  <li>"I'd benchmark WAAPI vs CSS vs Framer Motion for our top animations to validate the choice."</li>
  <li>"I'd write a debug overlay that lists currently active animations across the document."</li>
  <li>"I'd add lint rules to prevent <code>el.animate(...)</code> in render bodies (forces useEffect)."</li>
</ul>
`
    }
  ]
});
