window.PREP_SITE.registerTopic({
  id: 'anim-flip',
  module: 'animation',
  title: 'FLIP Technique',
  estimatedReadTime: '35 min',
  tags: ['flip', 'animation', 'layout-animation', 'shared-element', 'view-transition', 'getboundingclientrect', 'paul-lewis'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>FLIP</strong> is a technique for animating layout-driven changes (size, position, parent change) at 60fps without ever animating layout properties. The trick: let the browser do the layout instantaneously, then reverse the visual change with a transform, then play it forward via a transition. Coined by Paul Lewis at Google in 2016; still the gold standard for "shared element" / list-reorder / "expand from card to detail" animations.</p>
<ul>
  <li><strong>F:</strong> First — measure the element's starting position with <code>getBoundingClientRect()</code>.</li>
  <li><strong>L:</strong> Last — make the layout change (move DOM, change classes, update styles), then measure the ending position.</li>
  <li><strong>I:</strong> Invert — apply a <code>transform</code> that visually puts the element back at "First."</li>
  <li><strong>P:</strong> Play — remove the transform with a transition; the element animates from "First" appearance to "Last" position via compositor-only transform.</li>
  <li><strong>Why it's brilliant:</strong> the actual layout change is instant; the visual animation is pure transform — no layout/paint per frame.</li>
  <li><strong>What it solves:</strong> animating from one position to another when CSS transitions can't (DOM reorder, parent change, list filter).</li>
  <li><strong>Modern alternatives:</strong> CSS <code>view-transition-name</code> + <code>document.startViewTransition()</code> (browser-native), Framer Motion's layout animations.</li>
  <li><strong>Mobile:</strong> RN doesn't have native FLIP, but Reanimated layout animations + shared-element transitions cover the same use cases.</li>
</ul>
<p><strong>Mantra:</strong> "Measure first, change layout, invert with transform, play forward. All animation is transform; all layout is instant."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The problem FLIP solves</h3>
<p>You have a list of cards. The user filters → some cards reorder, others appear/disappear. You want them to <em>animate</em> to their new positions, not jump.</p>
<p>The naive approach: animate <code>top</code> / <code>left</code> / <code>order</code> properties. Problems:</p>
<ol>
  <li>Layout-affecting properties trigger re-layout every frame.</li>
  <li>You can't animate <code>order</code> at all.</li>
  <li>Animating from "auto" positions is impossible without measuring.</li>
  <li>If a card moves to a different parent, transitions don't carry across.</li>
</ol>

<h3>The FLIP insight</h3>
<p>You don't actually need to animate the layout change. The browser is already great at layout. Let it do the layout in one frame; then compute the visual delta and animate that delta as a transform. The element ends up in its "Last" position, but visually starts at "First" and animates to "Last" via compositor.</p>

<pre><code class="language-text">FRAME 0 (before)        FRAME 1 (after layout)         FRAME 2 (animation)
    ┌─┐                       ┌─┐                          ┌─┐
    │A│                       │B│ ← rect: { top: 0 }      │B│
    │ │                       │ │                          │ │ ← visually at A's old pos
    └─┘                       │ │                          │ │
    ┌─┐                       │ │                          │ │
    │B│ ← rect: { top: 100 }  │A│ ← rect: { top: 80 }      │A│
    │ │                       └─┘                          └─┘
    └─┘
    ┌─┐
    │C│
    └─┘

In frame 1:
  - Layout has happened.
  - We measured B's old (top: 100) and new (top: 0) positions.
  - We apply transform: translateY(100px) to B → it visually stays at old position.

In frame 2 (next paint):
  - We add transition: transform 300ms; remove the transform.
  - B animates from translateY(100px) → translateY(0) via compositor.
  - Visually: smooth move from old to new position.
  - Behind the scenes: layout already happened in frame 1.
</code></pre>

<h3>Where FLIP shines</h3>
<table>
  <thead><tr><th>Scenario</th><th>Why FLIP</th></tr></thead>
  <tbody>
    <tr><td>List reorder / sort / filter</td><td>Items reposition smoothly</td></tr>
    <tr><td>"Expand from card to detail" (shared element)</td><td>Card visibly grows from list position to fill screen</td></tr>
    <tr><td>"Collapse from detail back to card"</td><td>Same in reverse</td></tr>
    <tr><td>Drag-and-drop: snap-to-position</td><td>Item smoothly settles</td></tr>
    <tr><td>"Animating to a new parent"</td><td>DOM reparent + FLIP for visual continuity</td></tr>
    <tr><td>Image gallery: clicked image expands to overlay</td><td>The overlay starts at thumbnail rect; animates to fullscreen</td></tr>
  </tbody>
</table>

<h3>The "shared element transition" framing</h3>
<p>FLIP is the foundation of shared element transitions: an element's identity persists across screens / states, even though the DOM may have completely re-rendered. Modern names: View Transitions API (CSS), Layout Animations (Framer Motion), Shared Element Transitions (Android, iOS).</p>

<h3>Why FLIP wins</h3>
<ul>
  <li><strong>60fps guarantee:</strong> the only animation is a compositor transform.</li>
  <li><strong>Works with React / Vue / any framework:</strong> measure DOM rects, apply transforms, play. No framework integration required.</li>
  <li><strong>Works across DOM moves:</strong> measure both states even when the element jumped to a different parent.</li>
  <li><strong>Universal:</strong> any layout change you can make via CSS / DOM, FLIP can animate.</li>
</ul>

<h3>The modern alternatives</h3>
<table>
  <thead><tr><th>Approach</th><th>How</th></tr></thead>
  <tbody>
    <tr><td>FLIP (manual)</td><td>Measure + transform + transition; framework-agnostic</td></tr>
    <tr><td>Framer Motion's <code>layout</code> prop</td><td>Library does FLIP for you; one line</td></tr>
    <tr><td>View Transitions API</td><td><code>document.startViewTransition()</code> + <code>view-transition-name: foo</code></td></tr>
    <tr><td>React's flushSync + useLayoutEffect</td><td>Manual but synchronous; allows FLIP within a single render cycle</td></tr>
    <tr><td>RN's Reanimated <code>SharedTransition</code></td><td>Native equivalent</td></tr>
  </tbody>
</table>

<h3>Why interviewers ask</h3>
<ol>
  <li>FLIP is a "shibboleth" — only candidates who've genuinely worked on UI performance know it.</li>
  <li>Tests rendering pipeline understanding (layout vs paint vs composite).</li>
  <li>Tests problem-solving creativity (the inversion idea is non-obvious).</li>
  <li>Real-world relevance: most "delightful" UI moments use FLIP under the hood.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You can derive FLIP from first principles: "we want to animate position, but transform is the only fast property."</li>
  <li>You implement it correctly: measure → mutate → measure → invert → play.</li>
  <li>You handle edge cases: element resized (not just moved), parent change, scroll position drift.</li>
  <li>You know when to use the library / View Transitions API vs hand-rolling.</li>
  <li>You test with low-end devices to confirm perf.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The four phases</h3>
<table>
  <thead><tr><th>Phase</th><th>Meaning</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>F — First</td><td>The starting visual state</td><td>Measure with <code>getBoundingClientRect()</code></td></tr>
    <tr><td>L — Last</td><td>The ending visual state</td><td>Make the layout change; measure again</td></tr>
    <tr><td>I — Invert</td><td>Compute delta; apply inverse transform</td><td>Element visually returns to First</td></tr>
    <tr><td>P — Play</td><td>Remove transform with transition</td><td>Element animates to Last via compositor</td></tr>
  </tbody>
</table>

<h3>The math</h3>
<pre><code class="language-text">Measure F: rect = { top, left, width, height }
Mutate layout: change classes, reorder DOM, etc.
Measure L: newRect = { top, left, width, height }

Compute deltas:
  dx = F.left - L.left
  dy = F.top  - L.top
  dw = F.width  / L.width    (if size changes)
  dh = F.height / L.height

Apply inverse transform:
  element.style.transform = \`translate(\${dx}px, \${dy}px) scale(\${dw}, \${dh})\`;
  element.style.transformOrigin = '0 0';
  // → element visually appears at First position

Next frame, transition:
  element.style.transition = 'transform 300ms ease-out';
  element.style.transform = '';   // identity → animation plays
</code></pre>

<h3>Why two measures (not one + delta calc)</h3>
<p>You can't compute "Last" without doing the layout change. The whole point: let the browser layout once, then animate visually back to where it was, then play forward. One measurement before, mutation, second measurement after.</p>

<h3>The "invert vs anti-transform" naming</h3>
<p>Some sources call the invert step "anti-transform." Same idea: the transform that makes "Last" look like "First" again.</p>

<h3>Single-element FLIP</h3>
<pre><code class="language-text">Element moves from A to B (e.g., dropdown opens, card moves on filter).

  rect_A = { top: 100 }
  // mutate
  rect_B = { top: 50 }

  delta = A.top - B.top = 50

  el.style.transform = 'translateY(50px)';   // visually at A
  // next frame
  el.style.transition = 'transform 300ms';
  el.style.transform = '';                    // animates from A to B
</code></pre>

<h3>Multi-element FLIP (list)</h3>
<p>Same procedure, but for each child:</p>
<pre><code class="language-text">For each child:
  rect_F = child.getBoundingClientRect()
  // (gather all firsts before mutating)

Mutate layout (re-order, filter, etc.)

For each child:
  rect_L = child.getBoundingClientRect()
  delta = compute(rect_F, rect_L)
  child.style.transform = inverse_transform(delta)

Next frame:
  for each child: transition + clear transform
</code></pre>

<h3>Shared element ("expand card to detail")</h3>
<p>Card thumbnail clicks → detail page. The thumbnail visually grows into the hero image.</p>
<pre><code class="language-text">Before: thumbnail rect = { top: 200, left: 50, width: 100, height: 100 }
After:  hero rect      = { top: 0,   left: 0,  width: 1000, height: 600 }

Strategy:
  1. Capture thumbnail rect.
  2. Switch to detail screen (hero now in DOM at its final position).
  3. Compute delta: dx, dy, dw, dh.
  4. Apply inverse transform to hero → it visually starts as a 100x100 box at (50, 200).
  5. Transition transform → hero animates from thumbnail position to fullscreen.

The DOM change is instant; the visual change is a 300ms transform.
</code></pre>

<h3>Cross-DOM-tree FLIP</h3>
<p>Element moves to different parent. Same FLIP logic; the second <code>getBoundingClientRect()</code> reads from the new parent. The transform invertion accounts for the new parent's offset.</p>

<h3>Scrolling concerns</h3>
<p><code>getBoundingClientRect()</code> returns viewport-relative coordinates. If the page scrolls during the animation (e.g., expanding card scrolls the page), the rects are still accurate at measure-time. But if you measure during a scroll, you may get stale values. Generally measure synchronously, before any layout.</p>

<h3>Resizing (not just moving)</h3>
<p>If element changes width/height, FLIP needs <code>scale</code> in the inverse transform. The element's children may need a counter-scale to avoid being squished:</p>
<pre><code class="language-text">Card grows from 100x100 to 1000x600.
  Card transform: scale(0.1) — children visually squished too.

To avoid: child gets transform: scale(10) (the inverse-inverse).
  Or: animate width/height separately (loses compositor benefit).

Real solution: clip-path or explicit child transforms during transition.
</code></pre>

<h3>The View Transitions API approach</h3>
<pre><code class="language-js">document.startViewTransition(() =&gt; {
  // synchronous DOM mutation
  applyNewLayout();
});
// Browser snapshots before, snapshots after, animates between them automatically.
</code></pre>
<p>Browser does FLIP for you, including for cross-document navigations (multi-page apps via prefetch + transition).</p>

<h3>Single root vs per-element identity</h3>
<table>
  <thead><tr><th>Without view-transition-name</th><th>With view-transition-name</th></tr></thead>
  <tbody>
    <tr><td>Whole document crossfades</td><td>Named elements morph individually</td></tr>
    <tr><td>One snapshot before, one after</td><td>Per-element snapshots</td></tr>
    <tr><td>Coarse</td><td>Granular shared-element</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Single-element FLIP — vanilla</h3>
<pre><code class="language-js">function flip(el, mutate, duration = 300) {
  const first = el.getBoundingClientRect();
  mutate();   // synchronous layout change
  const last = el.getBoundingClientRect();

  const dx = first.left - last.left;
  const dy = first.top - last.top;
  const dw = first.width / last.width;
  const dh = first.height / last.height;

  el.style.transformOrigin = '0 0';
  el.style.transition = 'none';
  el.style.transform = \`translate(\${dx}px, \${dy}px) scale(\${dw}, \${dh})\`;

  requestAnimationFrame(() =&gt; {
    el.style.transition = \`transform \${duration}ms ease-out\`;
    el.style.transform = '';
  });
}

// Usage
flip(card, () =&gt; {
  card.classList.add('expanded');
});
</code></pre>

<h3>Multi-element FLIP — list reorder</h3>
<pre><code class="language-js">function flipList(items, mutate, duration = 300) {
  // F — first measurements
  const firsts = new Map();
  items.forEach(el =&gt; firsts.set(el, el.getBoundingClientRect()));

  // L — change layout
  mutate();

  // I + P — invert and play
  items.forEach(el =&gt; {
    const first = firsts.get(el);
    const last = el.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if (dx === 0 &amp;&amp; dy === 0) return;   // no movement

    el.style.transformOrigin = '0 0';
    el.style.transition = 'none';
    el.style.transform = \`translate(\${dx}px, \${dy}px)\`;

    requestAnimationFrame(() =&gt; {
      el.style.transition = \`transform \${duration}ms ease-out\`;
      el.style.transform = '';
    });
  });
}

// Usage: filter list
flipList(Array.from(list.children), () =&gt; {
  const sorted = [...list.children].sort((a, b) =&gt; a.dataset.order - b.dataset.order);
  sorted.forEach(el =&gt; list.appendChild(el));   // reorder
});
</code></pre>

<h3>FLIP with WAAPI (cleaner)</h3>
<pre><code class="language-js">function flipWAAPI(el, mutate, duration = 300) {
  const first = el.getBoundingClientRect();
  mutate();
  const last = el.getBoundingClientRect();

  const dx = first.left - last.left;
  const dy = first.top - last.top;
  const dw = first.width / last.width;
  const dh = first.height / last.height;

  return el.animate(
    [
      { transformOrigin: '0 0', transform: \`translate(\${dx}px, \${dy}px) scale(\${dw}, \${dh})\` },
      { transformOrigin: '0 0', transform: 'translate(0, 0) scale(1, 1)' }
    ],
    { duration, easing: 'ease-out' }
  ).finished;
}
</code></pre>

<h3>FLIP in React (with refs)</h3>
<pre><code class="language-tsx">function FlipList({ items }: { items: Item[] }) {
  const refs = useRef&lt;Map&lt;string, HTMLElement&gt;&gt;(new Map());
  const prevRects = useRef&lt;Map&lt;string, DOMRect&gt;&gt;(new Map());

  // Capture rects BEFORE the render that changes layout
  useLayoutEffect(() =&gt; {
    refs.current.forEach((el, id) =&gt; {
      prevRects.current.set(id, el.getBoundingClientRect());
    });
  });

  // After layout, run FLIP for each element
  useLayoutEffect(() =&gt; {
    refs.current.forEach((el, id) =&gt; {
      const last = el.getBoundingClientRect();
      const first = prevRects.current.get(id);
      if (!first) return;
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (dx === 0 &amp;&amp; dy === 0) return;

      el.animate(
        [
          { transform: \`translate(\${dx}px, \${dy}px)\` },
          { transform: 'translate(0, 0)' }
        ],
        { duration: 300, easing: 'ease-out' }
      );
    });
  }, [items]);

  return (
    &lt;ul&gt;
      {items.map(item =&gt; (
        &lt;li
          key={item.id}
          ref={el =&gt; el &amp;&amp; refs.current.set(item.id, el)}
        &gt;{item.text}&lt;/li&gt;
      ))}
    &lt;/ul&gt;
  );
}
</code></pre>

<h3>Counter-scale for children (resize FLIP)</h3>
<pre><code class="language-js">function flipWithChildren(el, mutate, duration = 300) {
  const first = el.getBoundingClientRect();
  mutate();
  const last = el.getBoundingClientRect();

  const dw = first.width / last.width;
  const dh = first.height / last.height;

  el.style.transformOrigin = '0 0';
  el.style.transform = \`scale(\${dw}, \${dh})\`;

  // Counter-scale children
  const inverse = \`scale(\${1/dw}, \${1/dh})\`;
  Array.from(el.children).forEach(child =&gt; {
    child.style.transformOrigin = '0 0';
    child.style.transform = inverse;
  });

  requestAnimationFrame(() =&gt; {
    el.style.transition = \`transform \${duration}ms ease-out\`;
    el.style.transform = '';
    Array.from(el.children).forEach(child =&gt; {
      child.style.transition = \`transform \${duration}ms ease-out\`;
      child.style.transform = '';
    });
  });
}
</code></pre>

<h3>View Transitions API (modern)</h3>
<pre><code class="language-html">&lt;!-- HTML --&gt;
&lt;img class="thumb" style="view-transition-name: hero" src="..." /&gt;
&lt;!-- After navigation: --&gt;
&lt;img class="hero" style="view-transition-name: hero" src="..." /&gt;
</code></pre>
<pre><code class="language-js">// Trigger
function navigate() {
  if (document.startViewTransition) {
    document.startViewTransition(() =&gt; {
      // synchronous DOM mutation: render the new screen
      renderDetailScreen();
    });
  } else {
    // fallback
    renderDetailScreen();
  }
}
</code></pre>
<pre><code class="language-css">/* Customize the auto-generated transition */
::view-transition-old(hero), ::view-transition-new(hero) {
  animation-duration: 300ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</code></pre>

<h3>Same in Framer Motion (declarative)</h3>
<pre><code class="language-tsx">// motion.div with layout prop does FLIP automatically
&lt;motion.div layout&gt;Card&lt;/motion.div&gt;

// LayoutGroup for shared layouts
&lt;LayoutGroup&gt;
  {items.map(item =&gt; &lt;motion.div key={item.id} layout&gt;{item.text}&lt;/motion.div&gt;)}
&lt;/LayoutGroup&gt;

// Shared element with layoutId
&lt;motion.img layoutId="hero" src="..." /&gt;
// On a different screen, an image with same layoutId animates from one to the other.
</code></pre>

<h3>FLIP for image expand</h3>
<pre><code class="language-js">async function expandImage(thumb, fullscreenContainer) {
  const first = thumb.getBoundingClientRect();
  // mount fullscreen image at its final position
  const hero = document.createElement('img');
  hero.src = thumb.src;
  hero.style.position = 'fixed';
  hero.style.top = '0';
  hero.style.left = '0';
  hero.style.width = '100vw';
  hero.style.height = '100vh';
  hero.style.objectFit = 'contain';
  fullscreenContainer.appendChild(hero);

  const last = hero.getBoundingClientRect();
  const dx = first.left - last.left;
  const dy = first.top - last.top;
  const dw = first.width / last.width;
  const dh = first.height / last.height;

  hero.style.transformOrigin = '0 0';
  hero.style.transform = \`translate(\${dx}px, \${dy}px) scale(\${dw}, \${dh})\`;

  await hero.animate(
    [
      { transformOrigin: '0 0', transform: hero.style.transform },
      { transformOrigin: '0 0', transform: 'translate(0, 0) scale(1, 1)' }
    ],
    { duration: 350, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
  ).finished;

  thumb.style.visibility = 'hidden';   // hide original
}
</code></pre>

<h3>FLIP cleanup pattern</h3>
<pre><code class="language-js">// Clear styles after animation completes so subsequent layout changes are clean
async function flipClean(el, mutate) {
  await flipWAAPI(el, mutate, 300);
  el.style.transition = '';
  el.style.transform = '';
  el.style.transformOrigin = '';
}
</code></pre>

<h3>Interrupting an in-flight FLIP</h3>
<pre><code class="language-js">// User filters list while previous FLIP is still animating
let activeAnimations = new Map();

function flipWithCancel(el, mutate) {
  const existing = activeAnimations.get(el);
  if (existing) existing.cancel();

  // measure CURRENT visual state (mid-animation), not transformed state
  const first = el.getBoundingClientRect();   // returns current visible rect
  mutate();
  const last = el.getBoundingClientRect();
  const dx = first.left - last.left;
  const dy = first.top - last.top;

  const anim = el.animate(
    [{ transform: \`translate(\${dx}px, \${dy}px)\` }, { transform: 'translate(0, 0)' }],
    { duration: 300, easing: 'ease-out' }
  );
  activeAnimations.set(el, anim);
  return anim.finished;
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Toggle "expanded" card</h3>
<pre><code class="language-js">card.addEventListener('click', () =&gt; {
  flipWAAPI(card, () =&gt; card.classList.toggle('expanded'), 350);
});

// CSS
.card { width: 200px; height: 100px; }
.card.expanded { width: 100%; height: 400px; }
</code></pre>

<h3>Example 2: Sortable list with smooth reorder</h3>
<pre><code class="language-js">function reorderList(newOrder) {
  flipList(
    Array.from(list.children),
    () =&gt; {
      newOrder.forEach(id =&gt; {
        const el = list.querySelector(\`[data-id="\${id}"]\`);
        list.appendChild(el);   // re-append in new order
      });
    },
    300
  );
}
</code></pre>

<h3>Example 3: Filter visible items (with crossfade)</h3>
<pre><code class="language-js">function filterItems(predicate) {
  const allItems = Array.from(list.children);
  // F — measure currently visible
  const visible = allItems.filter(el =&gt; el.style.display !== 'none');
  const firsts = new Map(visible.map(el =&gt; [el, el.getBoundingClientRect()]));

  // L — apply filter
  allItems.forEach(el =&gt; {
    el.style.display = predicate(el) ? '' : 'none';
  });

  // FLIP for newly visible / repositioned
  const newlyVisible = allItems.filter(el =&gt; el.style.display !== 'none');
  newlyVisible.forEach(el =&gt; {
    const first = firsts.get(el);
    const last = el.getBoundingClientRect();
    if (!first) {
      // newly added — fade in
      el.animate({ opacity: [0, 1] }, { duration: 200 });
      return;
    }
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if (dx === 0 &amp;&amp; dy === 0) return;
    el.animate(
      [{ transform: \`translate(\${dx}px, \${dy}px)\` }, { transform: 'translate(0, 0)' }],
      { duration: 300, easing: 'ease-out' }
    );
  });
}
</code></pre>

<h3>Example 4: Image gallery — thumbnail to fullscreen</h3>
<pre><code class="language-js">async function openImage(thumb) {
  const overlay = document.createElement('div');
  overlay.className = 'image-overlay';
  document.body.appendChild(overlay);

  await expandImage(thumb, overlay);

  overlay.addEventListener('click', () =&gt; closeImage(thumb, overlay));
}

async function closeImage(thumb, overlay) {
  const hero = overlay.querySelector('img');
  const first = hero.getBoundingClientRect();
  const last = thumb.getBoundingClientRect();

  await hero.animate(
    [
      { transform: 'translate(0, 0) scale(1, 1)', transformOrigin: '0 0' },
      { transform: \`translate(\${last.left - first.left}px, \${last.top - first.top}px) scale(\${last.width / first.width}, \${last.height / first.height})\`, transformOrigin: '0 0' }
    ],
    { duration: 350, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
  ).finished;

  overlay.remove();
  thumb.style.visibility = '';
}
</code></pre>

<h3>Example 5: Drag with FLIP snap-back</h3>
<pre><code class="language-js">card.addEventListener('pointerup', () =&gt; {
  const first = card.getBoundingClientRect();
  card.style.transform = '';   // snap to original
  const last = card.getBoundingClientRect();

  card.animate(
    [
      { transform: \`translate(\${first.left - last.left}px, \${first.top - last.top}px)\` },
      { transform: 'translate(0, 0)' }
    ],
    { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
  );
});
</code></pre>

<h3>Example 6: View Transitions for full-page navigation</h3>
<pre><code class="language-js">async function navigate(url) {
  if (!document.startViewTransition) {
    location.href = url;
    return;
  }

  // Prefetch new page contents
  const html = await fetch(url).then(r =&gt; r.text());

  document.startViewTransition(() =&gt; {
    // Synchronously swap content
    document.querySelector('main').innerHTML = parseHtml(html, 'main');
    history.pushState(null, '', url);
  });
}
</code></pre>

<h3>Example 7: Framer Motion equivalent</h3>
<pre><code class="language-tsx">function FilterableList({ items, filter }: { items: Item[]; filter: (i: Item) =&gt; boolean }) {
  const visible = items.filter(filter);

  return (
    &lt;motion.ul layout&gt;
      &lt;AnimatePresence&gt;
        {visible.map(item =&gt; (
          &lt;motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          &gt;
            {item.text}
          &lt;/motion.li&gt;
        ))}
      &lt;/AnimatePresence&gt;
    &lt;/motion.ul&gt;
  );
}
</code></pre>

<h3>Example 8: Reorderable to-do list</h3>
<pre><code class="language-js">function moveTodo(fromIdx, toIdx) {
  const items = Array.from(list.children);
  const firsts = new Map(items.map(el =&gt; [el, el.getBoundingClientRect()]));

  // Mutate
  const [moving] = items.splice(fromIdx, 1);
  items.splice(toIdx, 0, moving);
  items.forEach(el =&gt; list.appendChild(el));

  // FLIP each
  items.forEach(el =&gt; {
    const first = firsts.get(el);
    const last = el.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if (!dx &amp;&amp; !dy) return;
    el.animate(
      [{ transform: \`translate(\${dx}px, \${dy}px)\` }, { transform: '' }],
      { duration: 250, easing: 'ease-out' }
    );
  });
}
</code></pre>

<h3>Example 9: FLIP across DOM trees (move element to different parent)</h3>
<pre><code class="language-js">function moveCard(card, newParent) {
  const first = card.getBoundingClientRect();
  newParent.appendChild(card);   // DOM move
  const last = card.getBoundingClientRect();
  const dx = first.left - last.left;
  const dy = first.top - last.top;
  card.animate(
    [{ transform: \`translate(\${dx}px, \${dy}px)\` }, { transform: '' }],
    { duration: 300, easing: 'ease-out' }
  );
}
</code></pre>

<h3>Example 10: FLIP integrated with React's flushSync</h3>
<pre><code class="language-tsx">import { flushSync } from 'react-dom';

function MyList() {
  const [items, setItems] = useState(initial);

  function reorder() {
    const cards = document.querySelectorAll('.card');
    const firsts = new Map();
    cards.forEach(el =&gt; firsts.set(el, el.getBoundingClientRect()));

    flushSync(() =&gt; {
      setItems(items.slice().reverse());
    });

    // After flushSync, DOM is updated — measure last
    cards.forEach(el =&gt; {
      const first = firsts.get(el);
      const last = el.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (!dx &amp;&amp; !dy) return;
      el.animate([{ transform: \`translate(\${dx}px, \${dy}px)\` }, { transform: '' }], { duration: 300 });
    });
  }
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Element resized — child squish</h3>
<p>If your FLIP includes scale (size change), children get scaled too — text becomes squished. Counter-scale children with the inverse transform, or use clip-path / explicit child animations.</p>

<h3>Scroll position changes during animation</h3>
<p><code>getBoundingClientRect()</code> is viewport-relative; if the page scrolls between F and L, the measured rects shift. Workaround: account for scroll delta, or use document-relative coordinates (<code>rect.top + window.scrollY</code>).</p>

<h3>Subpixel rendering issues</h3>
<p>Browsers can render <code>translate(0.5px, 0.5px)</code>; some downsample to integers. For text-heavy elements, this causes blurriness mid-animation. Force whole-pixel rounding or accept the slight blur.</p>

<h3>Performance: too many simultaneous FLIPs</h3>
<p>500 list items each with their own FLIP animation can blow up memory and overload the compositor. Either:</p>
<ul>
  <li>Animate only visible items (IntersectionObserver).</li>
  <li>Stagger animations.</li>
  <li>Use opacity fade for off-screen items rather than position transitions.</li>
</ul>

<h3>Layered transforms — parent FLIP affects child</h3>
<p>If a parent has a FLIP transform, its children inherit. Compute children's FLIP relative to the parent's transformed coordinate space, not to viewport.</p>

<h3>FLIP after async content load</h3>
<p>Image / lazy-loaded content shifts layout. If you measured F before, then content loaded, then measured L — the heights changed for reasons unrelated to your animation. FLIP still works mathematically; the animation just shows the cumulative delta.</p>

<h3>Element added during FLIP</h3>
<p>You can't FLIP an element that didn't exist at F. For new elements, use a separate fade-in animation; FLIP only existing elements.</p>

<h3>Element removed during FLIP</h3>
<p>Don't FLIP a removed element. For exit animations: clone the element, position it absolutely at its old rect, animate it out, then remove. Or use libraries' <code>AnimatePresence</code> equivalents.</p>

<h3>transform-origin mismatch</h3>
<p>Default transform-origin is center; FLIP usually wants <code>0 0</code> (top-left) so translate + scale compose correctly. Always set <code>transformOrigin: '0 0'</code> in FLIP transforms.</p>

<h3>Force a layout flush before measuring</h3>
<p>After applying a class change, the layout may not have happened yet (browser batches). Force it with <code>void el.offsetHeight</code> or <code>el.getBoundingClientRect()</code> before measuring final.</p>

<h3>RAF vs immediate transform</h3>
<p>The "Invert" transform must be applied BEFORE the next paint. Some browsers paint before rAF. Use <code>requestAnimationFrame()</code> after applying the inverse to ensure the paint sees it; then transition.</p>

<h3>FLIP + CSS containment</h3>
<p><code>contain: layout</code> can prevent FLIP from working correctly by isolating layout. Test with realistic CSS contain rules.</p>

<h3>FLIP + position: sticky</h3>
<p>Sticky elements are positioned by scroll; FLIP's measure-and-transform approach can fight with sticky. Often the simplest path: don't FLIP sticky elements; let them stay sticky.</p>

<h3>iOS Safari + getBoundingClientRect during scroll</h3>
<p>iOS Safari has historically had bugs returning stale rects during momentum scroll. Workaround: defer FLIP measurement to next rAF after scroll-end.</p>

<h3>Fixed-position element changes parent</h3>
<p>Fixed-positioned elements ignore their parent's transform; the FLIP math may still work, but visual effect can surprise. Test, or convert to absolute before FLIPing.</p>

<h3>View Transitions: animation-only vs DOM swap</h3>
<p>The View Transitions API requires a synchronous DOM swap inside <code>startViewTransition()</code>. Async work (fetch) must happen before. Fetch first, then call <code>startViewTransition</code>.</p>

<h3>Browser support: View Transitions</h3>
<p>Chromium-led; Safari behind; Firefox lagging. For broad compatibility, hand-roll FLIP or use Framer Motion.</p>

<h3>Concurrent React + useLayoutEffect</h3>
<p>FLIP via React relies on synchronous layout-effects. React 18 concurrent rendering may interleave; <code>flushSync</code> ensures the render happens before measurement. Add explicit flushSync for FLIP-critical updates.</p>

<h3>Animation cancellation cleanup</h3>
<p>If a user interrupts (e.g., navigates away mid-animation), cancel the in-flight animation explicitly. Otherwise it can race with the next mutation.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Forgetting transformOrigin</h3>
<pre><code class="language-js">// BAD — default transform-origin is center; scale + translate composition is wrong
el.style.transform = \`translate(\${dx}px, \${dy}px) scale(0.5)\`;

// GOOD
el.style.transformOrigin = '0 0';
el.style.transform = \`translate(\${dx}px, \${dy}px) scale(0.5)\`;
</code></pre>

<h3>Bug 2: Measuring after the transform applied</h3>
<pre><code class="language-js">// BAD — last rect is the inverted position, not the layout position
const first = el.getBoundingClientRect();
el.style.transform = '...';
const last = el.getBoundingClientRect();   // includes transform!

// GOOD — measure BEFORE applying invert; remove existing transform first
el.style.transform = '';
const last = el.getBoundingClientRect();
</code></pre>

<h3>Bug 3: Missing rAF before transition</h3>
<pre><code class="language-js">// BAD — transform set, transition set in same frame; browser sees only the final state
el.style.transform = invertTransform;
el.style.transition = 'transform 300ms';
el.style.transform = '';   // browser collapses; no animation

// GOOD — let invert paint first
el.style.transform = invertTransform;
requestAnimationFrame(() =&gt; {
  el.style.transition = 'transform 300ms';
  el.style.transform = '';
});
</code></pre>

<h3>Bug 4: Forgetting to clear transition after FLIP</h3>
<pre><code class="language-js">// Future style changes will animate via the lingering transition
el.style.transition = 'transform 300ms';
// later, set color → no transition expected, but transition rule still applies
// FIX — clear after animation
el.addEventListener('transitionend', () =&gt; {
  el.style.transition = '';
}, { once: true });
</code></pre>

<h3>Bug 5: FLIP without proper cleanup on unmount</h3>
<pre><code class="language-jsx">// Element unmounts mid-animation; transform persists in DOM until GC
// React: clean up in useEffect return
useEffect(() =&gt; {
  const animation = flipWAAPI(el, mutate);
  return () =&gt; animation.cancel?.();
}, []);
</code></pre>

<h3>Bug 6: Stacking transforms</h3>
<pre><code class="language-js">// BAD — first.left - last.left when last already has a transform applied
// FIX — clear transform before measuring
el.style.transform = '';
const last = el.getBoundingClientRect();
</code></pre>

<h3>Bug 7: FLIP on element with margin-collapse</h3>
<p>Margin-collapse changes layout in subtle ways. After mutating, the rect may not match expectations. Use <code>display: flex</code> or <code>display: grid</code> on the parent to avoid margin collapse.</p>

<h3>Bug 8: Counter-scaling children incorrectly</h3>
<pre><code class="language-js">// BAD — single child counter-scale during transition
parent.style.transform = 'scale(0.5)';
child.style.transform = 'scale(2)';   // counters parent scale

// During transition (parent animating to scale(1)), child stays at scale(2) → distortion
// FIX — animate both with synced transitions; or use clip-path; or accept the squish
</code></pre>

<h3>Bug 9: Not using transform-origin: 0 0 with scale</h3>
<p>Default origin = center; scale + translate composes weirdly. FLIP almost always wants <code>0 0</code>.</p>

<h3>Bug 10: Wrong delta sign</h3>
<pre><code class="language-js">// dx = first.left - last.left   ← invert direction
// If you write last.left - first.left, the element flies the wrong way
</code></pre>

<h3>Anti-pattern 1: FLIP for everything</h3>
<p>Simple state changes (button hover) don't need FLIP. Reach for FLIP only for layout-affected animations.</p>

<h3>Anti-pattern 2: Hand-rolling FLIP when libraries handle it</h3>
<p>Framer Motion's <code>layout</code> prop, View Transitions API, and Reanimated SharedTransition are robust. Hand-rolling is for learning or special cases.</p>

<h3>Anti-pattern 3: FLIP without IntersectionObserver for huge lists</h3>
<p>Animating 1000 items even if only 20 are visible wastes work. Only FLIP visible items.</p>

<h3>Anti-pattern 4: FLIP that breaks on resize</h3>
<p>Window resize changes layout; in-flight FLIP becomes wrong. Either cancel on resize or finish before resize handlers fire.</p>

<h3>Anti-pattern 5: Coupling FLIP to specific components</h3>
<p>A reusable FLIP utility (function or hook) beats per-component FLIP code. Centralize.</p>

<h3>Anti-pattern 6: Using FLIP across DOM trees with conflicting CSS</h3>
<p>Element moves to a parent with different padding / margins / borders; rect math doesn't account for these. Test thoroughly across parents.</p>

<h3>Anti-pattern 7: Skipping cleanup in animation cancellation</h3>
<p>Cancelled animations leave inline styles. Always clear via finally block or animation.oncancel.</p>

<h3>Anti-pattern 8: FLIP without prefers-reduced-motion respect</h3>
<p>Same accessibility consideration as all animations.</p>

<h3>Anti-pattern 9: Mixing FLIP with non-transform animations</h3>
<p>If you also animate background color or shadow during FLIP, the composite chain becomes unstable. Either animate everything via FLIP or split clearly.</p>

<h3>Anti-pattern 10: Not testing on low-end devices</h3>
<p>FLIP looks great on M2 MacBook; jank surfaces on a 5-year-old Android. Test there before claiming "smooth."</p>
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
    <tr><td><em>What does FLIP stand for?</em></td><td>First, Last, Invert, Play.</td></tr>
    <tr><td><em>Why FLIP instead of animating <code>top</code>/<code>left</code>?</em></td><td>Animating layout properties triggers re-layout per frame; FLIP uses pure transform → compositor only.</td></tr>
    <tr><td><em>Walk me through the FLIP steps.</em></td><td>Measure F, mutate layout, measure L, compute delta, apply inverse transform, transition transform to identity.</td></tr>
    <tr><td><em>What's the role of transform-origin?</em></td><td>Set to '0 0' so translate + scale compose correctly.</td></tr>
    <tr><td><em>What problem does FLIP solve uniquely?</em></td><td>Animating across layout changes (reorder, parent change, filter) — CSS transitions can't.</td></tr>
    <tr><td><em>How do you handle resize in FLIP?</em></td><td>Add scale to the inverse transform; counter-scale children to avoid squish.</td></tr>
    <tr><td><em>How does this relate to the View Transitions API?</em></td><td>Browser does FLIP for you when you wrap mutation in <code>startViewTransition</code>.</td></tr>
    <tr><td><em>What's a shared element transition?</em></td><td>An element identity persists across screens / states; FLIP animates from one position to another.</td></tr>
    <tr><td><em>Why two measurements?</em></td><td>Can't compute Last without applying layout; two measures bracket the change.</td></tr>
    <tr><td><em>How would you implement reorderable list animations?</em></td><td>Multi-element FLIP: capture rects, mutate, compute deltas, FLIP each.</td></tr>
    <tr><td><em>How do you integrate with React?</em></td><td>useLayoutEffect to capture before mutation; flushSync if necessary; useLayoutEffect after to apply FLIP.</td></tr>
    <tr><td><em>Reduced motion?</em></td><td>Skip FLIP or shorten duration via <code>prefers-reduced-motion</code>.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Implement single-element FLIP from scratch.</li>
  <li>FLIP a list reorder.</li>
  <li>FLIP an image expand from thumbnail to fullscreen.</li>
  <li>Convert your FLIP to use WAAPI.</li>
  <li>Add reduced-motion handling.</li>
  <li>Add interruption handling (cancel previous FLIP if a new one starts).</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Measuring after applying transform — should clear transform first.</li>
  <li>No requestAnimationFrame between invert and transition — browser collapses; no animation.</li>
  <li>Missing transform-origin: 0 0 — scale + translate composition wrong.</li>
  <li>FLIP not cancelled on unmount — transforms linger in DOM.</li>
  <li>Counter-scale children missing — text squishes during scale FLIP.</li>
  <li>Stacking transforms — measuring with transform applied gives wrong "last."</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>FLIP knowledge</td><td>You can name and derive it on the spot.</td></tr>
    <tr><td>Pipeline understanding</td><td>You connect FLIP to the compositor-only rule.</td></tr>
    <tr><td>Implementation rigor</td><td>You handle transform-origin, rAF, cleanup.</td></tr>
    <tr><td>Library awareness</td><td>You know Framer Motion / View Transitions / RN equivalents.</td></tr>
    <tr><td>Edge case awareness</td><td>You handle resize, scroll, parent change, interruption.</td></tr>
    <tr><td>Reusability</td><td>You build a generic <code>flip()</code> utility, not per-component code.</td></tr>
    <tr><td>Cross-platform fluency</td><td>You translate to RN's Reanimated SharedTransition.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN doesn't have <code>getBoundingClientRect</code> — measurements via <code>onLayout</code> or <code>measureInWindow</code>.</li>
  <li><strong>Reanimated SharedTransition</strong> is the official RN equivalent — declarative, GPU-accelerated, "shared element" for navigation transitions.</li>
  <li><strong>react-native-shared-element</strong> library does FLIP-style transitions for older RN apps.</li>
  <li>The mental model transfers: measure-mutate-measure-invert-play. Reanimated does the inverting on the UI thread automatically.</li>
  <li>iOS / Android native both support shared element transitions in their respective navigation systems; RN libraries map to those.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why does FLIP need two measurements?"</em> — You can't predict the layout outcome; you must let the browser compute it. The first measurement captures the "before"; the layout mutation triggers reflow; the second captures the "after."</li>
  <li><em>"Why is the inverse transform applied immediately, not in a transition?"</em> — The inverse must be in place BEFORE the next paint, so the user sees the element at its First position. Otherwise they see it jump to Last and then animate from there (wrong direction).</li>
  <li><em>"How would you handle FLIP for an SVG path morph?"</em> — FLIP is for box geometry; path morph is its own problem. Use SMIL or a library like Flubber.</li>
  <li><em>"What's the difference between FLIP and CSS view-transition-name?"</em> — Same concept; the browser does FLIP for you when you opt in via <code>view-transition-name</code> + <code>startViewTransition</code>. You don't need rect math.</li>
  <li><em>"How would you debug a janky FLIP?"</em> — Chrome Performance panel; check that "Recalculate Style" / "Layout" doesn't appear in the animation frames; only "Composite Layers" should.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit existing list-animation code; consider FLIP migration.</li>
  <li>Build a reusable <code>flip()</code> utility / React hook.</li>
  <li>Identify shared-element transitions opportunities (image gallery, card-to-detail).</li>
  <li>Add View Transitions API for browsers that support it; keep FLIP fallback.</li>
  <li>Test on low-end devices; verify compositor-only.</li>
  <li>Add reduced-motion handling.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add View Transitions API as a progressive enhancement."</li>
  <li>"I'd write a generic <code>useFlip(deps)</code> hook with proper cleanup."</li>
  <li>"I'd benchmark FLIP-heavy screens on Pixel 4a / iPhone SE to validate compositor behavior."</li>
  <li>"I'd add an animation-pause-on-window-blur to save battery."</li>
  <li>"For RN, I'd standardize on Reanimated's SharedTransition and document team patterns."</li>
</ul>
`
    }
  ]
});
