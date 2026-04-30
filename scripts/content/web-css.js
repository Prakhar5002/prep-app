window.PREP_SITE.registerTopic({
  id: 'web-css',
  module: 'web',
  title: 'CSS Deep',
  estimatedReadTime: '50 min',
  tags: ['css', 'flexbox', 'grid', 'cascade', 'specificity', 'custom-properties', 'container-queries', 'subgrid', 'web'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Modern CSS in 2026 has matured dramatically. <strong>Flexbox</strong> for 1D layout, <strong>Grid</strong> for 2D, <strong>Container Queries</strong> for component-responsive design, <strong>logical properties</strong> for international layouts, <strong>:has()</strong> for parent selectors, <strong>cascade layers</strong> for predictable specificity. Understanding the cascade, layout systems, and the rendering pipeline that consumes CSS is the foundation of senior frontend engineering.</p>
<ul>
  <li><strong>The cascade:</strong> origin → layer → specificity → source order, with <code>!important</code> as a flip on every level except origin.</li>
  <li><strong>Specificity:</strong> (id-count, class-count, element-count). Inline styles beat selectors; <code>!important</code> beats inline.</li>
  <li><strong>Box model:</strong> content + padding + border + margin. <code>box-sizing: border-box</code> is the modern default.</li>
  <li><strong>Layout systems:</strong> normal flow, Flexbox, Grid, multi-column, table, positioned. Pick the right one per context.</li>
  <li><strong>Custom properties (CSS variables):</strong> runtime-mutable; cascading; the foundation of design systems.</li>
  <li><strong>Modern selectors:</strong> <code>:has()</code>, <code>:is()</code>, <code>:where()</code>, <code>:nth-child(of)</code>, attribute selectors.</li>
  <li><strong>Container queries:</strong> respond to parent size, not viewport — game-changer for component design.</li>
  <li><strong>Cascade layers:</strong> <code>@layer</code> for explicit specificity ordering.</li>
  <li><strong>Logical properties:</strong> <code>margin-inline-start</code> instead of <code>margin-left</code> — RTL-friendly.</li>
</ul>
<p><strong>Mantra:</strong> "Cascade, specificity, box model. Flex for 1D, grid for 2D, container queries for components. Custom properties as the design system. Modern selectors over JS state."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What CSS actually does</h3>
<p>CSS describes how HTML should be styled and laid out. The browser parses CSS into the CSSOM, combines with the DOM into a render tree, then computes layout and paint. CSS rules cascade and inherit, with specificity resolving conflicts.</p>

<h3>Modern CSS is not your 2010 CSS</h3>
<table>
  <thead><tr><th>Feature</th><th>Year shipped</th></tr></thead>
  <tbody>
    <tr><td>Flexbox</td><td>2014 (broad support)</td></tr>
    <tr><td>Grid</td><td>2017 (broad support)</td></tr>
    <tr><td>CSS Variables</td><td>2017</td></tr>
    <tr><td>Logical properties</td><td>2019 (broad), 2024 (universal)</td></tr>
    <tr><td>:is(), :where()</td><td>2021</td></tr>
    <tr><td>Container queries</td><td>2023</td></tr>
    <tr><td>:has() (parent selector)</td><td>2023</td></tr>
    <tr><td>Cascade layers</td><td>2022</td></tr>
    <tr><td>Subgrid</td><td>2023</td></tr>
    <tr><td>Nesting</td><td>2023</td></tr>
    <tr><td>View Transitions</td><td>2023 (Chrome), 2024 (Safari)</td></tr>
    <tr><td>Anchor positioning</td><td>2024 (Chrome)</td></tr>
  </tbody>
</table>

<h3>Why the cascade matters</h3>
<p>Multiple CSS rules can match the same element. The cascade decides which wins. Understanding it predicts which style applies; misunderstanding leads to "I added a class but nothing changed" frustration.</p>

<h3>Specificity calculation</h3>
<table>
  <thead><tr><th>Selector</th><th>Specificity (A,B,C,D)</th></tr></thead>
  <tbody>
    <tr><td>* { }</td><td>0,0,0,0</td></tr>
    <tr><td>div { }</td><td>0,0,0,1</td></tr>
    <tr><td>div p { }</td><td>0,0,0,2</td></tr>
    <tr><td>.foo { }</td><td>0,0,1,0</td></tr>
    <tr><td>div.foo { }</td><td>0,0,1,1</td></tr>
    <tr><td>#id { }</td><td>0,1,0,0</td></tr>
    <tr><td>style="..."</td><td>1,0,0,0 (inline)</td></tr>
    <tr><td>!important</td><td>Wins regardless</td></tr>
  </tbody>
</table>

<h3>The box model</h3>
<pre><code class="language-text">┌─────────────────────────────────┐
│           margin                │
│  ┌───────────────────────────┐  │
│  │         border            │  │
│  │  ┌─────────────────────┐  │  │
│  │  │      padding        │  │  │
│  │  │  ┌───────────────┐  │  │  │
│  │  │  │   content     │  │  │  │
│  │  │  └───────────────┘  │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
</code></pre>

<table>
  <thead><tr><th>box-sizing</th><th>width includes</th></tr></thead>
  <tbody>
    <tr><td>content-box (default)</td><td>only content</td></tr>
    <tr><td>border-box</td><td>content + padding + border</td></tr>
  </tbody>
</table>
<p>Modern reset: <code>*, *::before, *::after { box-sizing: border-box; }</code> — predictable sizing.</p>

<h3>Why Flexbox + Grid</h3>
<p>Flexbox: distribute items along ONE axis (row OR column). Easy alignment, gap, ordering.</p>
<p>Grid: distribute items in TWO axes simultaneously. Tracks, gaps, named areas, alignment.</p>
<p>Most layouts use both: Flex for navigation rows, Grid for page-level structure.</p>

<h3>Why interviewers ask</h3>
<ol>
  <li>CSS is the layer most engineers underestimate. Senior knowledge differentiates.</li>
  <li>Layout problems consume disproportionate engineering time.</li>
  <li>Modern CSS (container queries, :has, layers) signals you've kept up.</li>
  <li>Tests visual reasoning under constraint (mobile-first, RTL, accessibility).</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You use Flexbox / Grid intentionally; you don't reach for floats.</li>
  <li>Your CSS uses custom properties for theming.</li>
  <li>You write specificity-conscious CSS; you avoid <code>!important</code>.</li>
  <li>You use <code>border-box</code> sizing globally.</li>
  <li>You use logical properties for international support.</li>
  <li>You use container queries for component-level responsive design.</li>
  <li>You leverage modern selectors: <code>:has</code>, <code>:is</code>, <code>:where</code>.</li>
  <li>You scope CSS via modules, components, or layers — not ID overrides.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The cascade in detail</h3>
<p>When two rules match an element, the winner is decided by:</p>
<ol>
  <li><strong>Origin and importance:</strong> author normal &lt; user normal &lt; author !important &lt; user !important &lt; transition &lt; animation</li>
  <li><strong>Cascade layers:</strong> later layers win</li>
  <li><strong>Specificity:</strong> highest wins</li>
  <li><strong>Source order:</strong> later in source wins</li>
</ol>

<h3>Cascade layers (modern)</h3>
<pre><code class="language-css">@layer reset, base, components, utilities;

@layer reset {
  * { margin: 0; padding: 0; box-sizing: border-box; }
}

@layer base {
  body { font-family: system-ui; line-height: 1.5; }
}

@layer components {
  .card { padding: 16px; border-radius: 8px; }
}

@layer utilities {
  .text-center { text-align: center; }
}
</code></pre>
<p>Layers are ordered: utilities beat components beat base beat reset. Specificity within a layer still applies, but no layer can beat a later one regardless of specificity. Solves the "Tailwind utility class doesn't override component CSS" problem cleanly.</p>

<h3>Inheritance</h3>
<p>Some properties inherit from parent (color, font, line-height, text-align); others don't (margin, padding, border, background). <code>inherit</code> forces inheritance; <code>initial</code> resets to spec default; <code>unset</code> = inherit if inheritable, initial otherwise; <code>revert</code> = browser default.</p>

<h3>Flexbox in 60 seconds</h3>
<pre><code class="language-css">.container {
  display: flex;
  flex-direction: row;          /* row | column | row-reverse | column-reverse */
  justify-content: space-between; /* main axis: flex-start | center | flex-end | space-between | space-around | space-evenly */
  align-items: center;          /* cross axis: stretch | flex-start | center | flex-end | baseline */
  gap: 16px;                    /* gap between items */
  flex-wrap: wrap;              /* wrap | nowrap */
}

.item {
  flex: 1;                      /* shorthand for flex-grow flex-shrink flex-basis */
  flex: 0 0 auto;               /* don't grow / shrink; size to content */
  flex: 1 1 200px;              /* grow / shrink; basis 200px */
  align-self: flex-start;       /* override align-items per-item */
}
</code></pre>

<h3>Grid in 60 seconds</h3>
<pre><code class="language-css">.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);     /* 3 equal columns */
  grid-template-columns: 200px 1fr 200px;    /* fixed-fluid-fixed */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));   /* responsive */
  grid-template-rows: auto 1fr auto;
  gap: 16px;                                 /* row + col gap */
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
}

.item {
  grid-column: 1 / 3;       /* span columns 1-2 (3 is end-line) */
  grid-row: span 2;         /* span 2 rows */
  grid-area: header;        /* match a named area */
}
</code></pre>

<h3>Position values</h3>
<table>
  <thead><tr><th>Value</th><th>Behavior</th></tr></thead>
  <tbody>
    <tr><td>static (default)</td><td>Normal flow</td></tr>
    <tr><td>relative</td><td>Normal flow but offset by top/left/right/bottom; creates positioning context</td></tr>
    <tr><td>absolute</td><td>Out of flow; positioned relative to nearest positioned ancestor</td></tr>
    <tr><td>fixed</td><td>Out of flow; positioned relative to viewport (or transformed ancestor)</td></tr>
    <tr><td>sticky</td><td>Like relative until scroll threshold, then becomes fixed within container</td></tr>
  </tbody>
</table>

<h3>z-index gotchas</h3>
<p>z-index only applies to positioned elements (not static). Stacking contexts are created by:</p>
<ul>
  <li>Positioned + z-index (other than auto)</li>
  <li>Flex / grid items with z-index</li>
  <li>opacity &lt; 1</li>
  <li>transform, filter, will-change, isolation</li>
</ul>
<p>An element's z-index is local to its stacking context. <code>z-index: 9999</code> on a child of a low-stacking-context ancestor stays trapped.</p>

<h3>Selectors — modern arsenal</h3>
<table>
  <thead><tr><th>Selector</th><th>Matches</th></tr></thead>
  <tbody>
    <tr><td>:is(a, b, c)</td><td>Anything matching a, b, or c (specificity = highest)</td></tr>
    <tr><td>:where(a, b, c)</td><td>Same but specificity = 0</td></tr>
    <tr><td>:has(.child)</td><td>Element that contains .child (parent selector!)</td></tr>
    <tr><td>:not(.foo)</td><td>Not .foo</td></tr>
    <tr><td>:nth-child(odd)</td><td>1st, 3rd, 5th, ...</td></tr>
    <tr><td>:nth-child(2n+1 of .foo)</td><td>Modern: nth-of-class</td></tr>
    <tr><td>:focus-visible</td><td>Focused via keyboard (not mouse)</td></tr>
    <tr><td>:focus-within</td><td>Element with a focused descendant</td></tr>
    <tr><td>:placeholder-shown</td><td>Empty input with placeholder</td></tr>
    <tr><td>:user-valid / :user-invalid</td><td>Form input that user has interacted with</td></tr>
  </tbody>
</table>

<h3>Custom properties (CSS variables)</h3>
<pre><code class="language-css">:root {
  --primary: #0a84ff;
  --spacing: 16px;
}

.card {
  background: var(--primary);
  padding: var(--spacing);
}

/* Locally override (cascades) */
.dark .card {
  --primary: #5e9eff;
}

/* Fallback */
.card { color: var(--text, #333); }
</code></pre>

<h3>Container queries</h3>
<pre><code class="language-css">.card {
  container-type: inline-size;
  /* Now child elements can query .card's width */
}

@container (min-width: 600px) {
  .card-content {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}

/* Named container */
.card { container-name: card; container-type: inline-size; }
@container card (min-width: 600px) { ... }
</code></pre>

<h3>Logical properties</h3>
<table>
  <thead><tr><th>Physical</th><th>Logical</th></tr></thead>
  <tbody>
    <tr><td>margin-left</td><td>margin-inline-start</td></tr>
    <tr><td>margin-right</td><td>margin-inline-end</td></tr>
    <tr><td>margin-top</td><td>margin-block-start</td></tr>
    <tr><td>width</td><td>inline-size</td></tr>
    <tr><td>height</td><td>block-size</td></tr>
    <tr><td>border-radius (top-left)</td><td>border-start-start-radius</td></tr>
  </tbody>
</table>
<p>In LTR: inline = horizontal, block = vertical. In RTL: inline-start = right side. In vertical writing modes: inline = vertical.</p>

<h3>Modern color spaces</h3>
<pre><code class="language-css">color: rgb(255 0 0);                  /* spaces, no commas */
color: hsl(120 50% 50%);
color: hwb(120 50% 0%);
color: oklch(70% 0.2 200);            /* perceptually uniform */
color: color(display-p3 1 0 0);       /* wide gamut */
color: color-mix(in srgb, red, blue); /* blend */
color: rgb(from var(--brand) r g b / 0.5);  /* transparent variant */
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Modern reset</h3>
<pre><code class="language-css">/* Box model */
*, *::before, *::after { box-sizing: border-box; }

/* Remove default margin */
body, h1, h2, h3, h4, p, ul, ol, figure, blockquote, dl, dd { margin: 0; }

/* Smooth scroll */
html { scroll-behavior: smooth; }

/* Body baseline */
body {
  min-height: 100vh;
  line-height: 1.5;
  font-family: system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Images */
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

/* Form elements inherit fonts */
input, button, textarea, select { font: inherit; }

/* Remove animations for users who prefer */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</code></pre>

<h3>Holy Grail layout (Grid)</h3>
<pre><code class="language-css">.layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 200px 1fr 200px;
  grid-template-areas:
    "header header header"
    "left   main   right"
    "footer footer footer";
  min-height: 100vh;
}

header { grid-area: header; }
main   { grid-area: main; }
.left  { grid-area: left; }
.right { grid-area: right; }
footer { grid-area: footer; }

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "left"
      "right"
      "footer";
  }
}
</code></pre>

<h3>Centering 5 ways</h3>
<pre><code class="language-css">/* Flexbox */
.parent { display: flex; justify-content: center; align-items: center; }

/* Grid */
.parent { display: grid; place-items: center; }

/* Auto margin (single child) */
.child { margin: auto; }   /* requires defined width / flex parent */

/* Absolute */
.parent { position: relative; }
.child { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

/* Inset (modern) */
.parent { position: relative; }
.child { position: absolute; inset: 0; margin: auto; }   /* with defined width/height */
</code></pre>

<h3>Responsive layout — auto-fit + minmax</h3>
<pre><code class="language-css">.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
/* Items stretch to fill row; wrap when narrower than 280px */
</code></pre>

<h3>Aspect ratio</h3>
<pre><code class="language-css">.thumb { aspect-ratio: 16 / 9; }
.avatar { aspect-ratio: 1; }   /* square */

img.cover {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}
</code></pre>

<h3>Sticky positioning</h3>
<pre><code class="language-css">.header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}
</code></pre>

<h3>Flexbox: equal columns with growing first</h3>
<pre><code class="language-css">.container {
  display: flex;
  gap: 16px;
}
.first {
  flex: 1;       /* grow to fill remaining space */
}
.fixed {
  flex: 0 0 200px;   /* don't grow or shrink; 200px wide */
}
</code></pre>

<h3>Truncate text</h3>
<pre><code class="language-css">/* Single line */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Multi-line (line-clamp) */
.clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Modern (any browser supporting) */
.clamp { line-clamp: 3; overflow: hidden; }
</code></pre>

<h3>Custom properties as design tokens</h3>
<pre><code class="language-css">:root {
  /* colors */
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-primary: #0a84ff;

  /* spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;

  /* typography */
  --font-sm: 14px;
  --font-base: 16px;
  --font-lg: 18px;
  --font-xl: 24px;

  /* radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
}

[data-theme="dark"] {
  --color-bg: #1a1a1a;
  --color-text: #f0f0f0;
  --color-primary: #5e9eff;
}

.card {
  background: var(--color-bg);
  color: var(--color-text);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
</code></pre>

<h3>Container queries for components</h3>
<pre><code class="language-css">.card {
  container-type: inline-size;
}

.card-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

@container (min-width: 400px) {
  .card-body {
    grid-template-columns: auto 1fr;
  }
}

@container (min-width: 600px) {
  .card-body {
    grid-template-columns: 1fr 2fr 1fr;
  }
}
</code></pre>

<h3>:has() for parent selection</h3>
<pre><code class="language-css">/* Card with image */
.card:has(img) { padding-top: 0; }

/* Form with error */
form:has(:invalid) .submit { opacity: 0.5; pointer-events: none; }

/* Page based on which section is in view */
body:has(#cart:target) .checkout-bar { display: block; }

/* Sibling combinator */
.toggle:has(+ .menu:hover) { background: #eee; }
</code></pre>

<h3>:is and :where</h3>
<pre><code class="language-css">/* :is — specificity = highest of arguments */
:is(h1, h2, h3) { font-weight: bold; }

/* :where — specificity = 0; useful for resets */
:where(button, [type="button"]) { all: unset; }

/* Mixed */
article :where(h1, h2, h3) { color: var(--heading); }
</code></pre>

<h3>Cascade layers + specificity</h3>
<pre><code class="language-css">@layer base, components, utilities;

@layer base {
  .button { padding: 8px 16px; background: gray; }   /* spec 0,1,0 */
}

@layer utilities {
  .button { background: blue; }                       /* still wins despite same specificity */
}

/* Within a layer, specificity applies normally;
   between layers, layer order wins. */
</code></pre>

<h3>CSS nesting (native)</h3>
<pre><code class="language-css">.card {
  padding: 16px;
  border-radius: 8px;

  &amp;:hover {
    background: #f0f0f0;
  }

  &amp;.featured {
    border: 2px solid gold;
  }

  .title {
    font-weight: bold;
  }

  &amp; .meta {
    color: gray;
  }
}
</code></pre>
<p>Modern browsers (2023+) support native nesting; no preprocessor needed.</p>

<h3>Subgrid</h3>
<pre><code class="language-css">.outer {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.inner {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 3;
  /* inner now uses outer's column tracks; aligns with siblings */
}
</code></pre>

<h3>Print styles</h3>
<pre><code class="language-css">@media print {
  body { font-size: 12pt; color: black; background: white; }
  nav, footer, .no-print { display: none; }
  a::after { content: " (" attr(href) ")"; }
  .page-break { page-break-after: always; }
}
</code></pre>

<h3>Anchor positioning (Chrome 125+)</h3>
<pre><code class="language-css">.button {
  anchor-name: --my-button;
}

.tooltip {
  position: absolute;
  position-anchor: --my-button;
  top: anchor(bottom);
  left: anchor(center);
  translate: -50% 8px;
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Card grid responsive</h3>
<pre><code class="language-css">.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.card {
  background: var(--color-bg);
  border-radius: 8px;
  padding: 16px;
}
</code></pre>

<h3>Example 2: Centered modal</h3>
<pre><code class="language-css">.modal {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,0.5);
}

.modal-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}
</code></pre>

<h3>Example 3: Hover-aware card border</h3>
<pre><code class="language-css">.card { transition: border-color 200ms; }

/* Highlight when card OR its descendants are hovered */
.card:hover, .card:focus-within {
  border-color: var(--primary);
}

/* Only when card has a featured image */
.card:has(.image) { padding-top: 0; }
</code></pre>

<h3>Example 4: Collapsible section</h3>
<pre><code class="language-css">.collapsible {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease;
}
.collapsible.open { grid-template-rows: 1fr; }
.collapsible &gt; * { overflow: hidden; }
</code></pre>
<p>Modern technique to animate height: 0 → auto using grid-template-rows interpolation.</p>

<h3>Example 5: Theme toggle</h3>
<pre><code class="language-css">[data-theme="light"] {
  --bg: #ffffff;
  --text: #1a1a1a;
}
[data-theme="dark"] {
  --bg: #0d0d0d;
  --text: #f0f0f0;
}

body {
  background: var(--bg);
  color: var(--text);
  transition: background 200ms, color 200ms;
}
</code></pre>
<pre><code class="language-js">document.documentElement.setAttribute('data-theme', 'dark');
</code></pre>

<h3>Example 6: Sticky header with shadow on scroll</h3>
<pre><code class="language-css">.header {
  position: sticky;
  top: 0;
  background: white;
  transition: box-shadow 200ms;
}

/* Detect scroll via JS or via :has of scrolled state */
.scrolled .header {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</code></pre>

<h3>Example 7: Form with native validation styles</h3>
<pre><code class="language-css">input:user-invalid {
  border-color: red;
}
input:user-valid {
  border-color: green;
}
/* :user-invalid only applies after user interaction; :invalid applies immediately */
</code></pre>

<h3>Example 8: Avatar with fallback</h3>
<pre><code class="language-css">.avatar {
  aspect-ratio: 1;
  width: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--avatar-fallback, #ccc);
}
</code></pre>

<h3>Example 9: Container query for card</h3>
<pre><code class="language-css">.card {
  container-type: inline-size;
}

.card-grid {
  display: grid;
  gap: 16px;
}

@container (min-width: 400px) {
  .card-grid {
    grid-template-columns: 100px 1fr;
  }
}

@container (min-width: 600px) {
  .card-grid {
    grid-template-columns: 100px 1fr auto;
  }
}
</code></pre>

<h3>Example 10: Logical properties for RTL</h3>
<pre><code class="language-css">.message {
  padding-inline: 16px;
  padding-block: 8px;
  margin-inline-start: 8px;
  border-inline-start: 4px solid var(--accent);
}

[dir="rtl"] .message {
  /* No special rules needed — logical properties auto-flip */
}
</code></pre>

<h3>Example 11: Cascade layers with utilities</h3>
<pre><code class="language-css">@layer reset, base, components, utilities;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
}

@layer base {
  body { font-family: system-ui; line-height: 1.5; }
}

@layer components {
  .button {
    padding: 8px 16px;
    border-radius: 4px;
    background: var(--primary);
    color: white;
  }
}

@layer utilities {
  .mt-0 { margin-top: 0 !important; }
  .text-center { text-align: center; }
}
</code></pre>

<h3>Example 12: Modern CSS clamp() for fluid typography</h3>
<pre><code class="language-css">h1 {
  /* min 24px, max 48px, scales with viewport */
  font-size: clamp(24px, 4vw, 48px);
}

.container {
  /* fluid padding */
  padding-inline: clamp(16px, 5vw, 64px);
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>z-index without position</h3>
<p><code>z-index</code> requires <code>position</code> non-static (or flex / grid item). Setting z-index on <code>position: static</code> does nothing.</p>

<h3>Stacking context isolation</h3>
<p>Element with <code>z-index: 9999</code> can be hidden behind <code>z-index: 1</code> if its stacking context is below. <code>opacity &lt; 1</code>, <code>transform</code>, <code>filter</code> create new stacking contexts.</p>

<h3>Margin collapse</h3>
<p>Vertical margins of adjacent block elements collapse to the largest. Doesn't happen in flex/grid items, with <code>display: flow-root</code>, or with <code>overflow: hidden</code>. Common bug: <code>p { margin-top: 16px }</code> doesn't add space if parent has its own margin.</p>

<h3>height: 100% chain</h3>
<p>Height: 100% only works if every ancestor has a defined height. If body has no height, child can't fill. Use <code>height: 100vh</code> on root or grid/flex layouts instead.</p>

<h3>Fixed inside transform</h3>
<p>Element with <code>position: fixed</code> inside an ancestor with <code>transform</code> behaves like <code>position: absolute</code> (relative to the transformed ancestor, not viewport).</p>

<h3>Flex: 1 vs flex-grow: 1</h3>
<p><code>flex: 1</code> = <code>flex: 1 1 0%</code> (grow, shrink, basis 0). <code>flex-grow: 1</code> alone keeps default basis (auto), which is content-sized. Often you want <code>flex: 1</code> for equal columns; <code>flex-grow: 1</code> only.</p>

<h3>Grid: 1fr behavior</h3>
<p><code>1fr</code> means "1 fraction of remaining space." If items have intrinsic minimum widths larger than the fraction, the column expands. Use <code>minmax(0, 1fr)</code> to prevent overflow on long content.</p>

<h3>Subgrid browser support</h3>
<p>Subgrid landed in 2023 (Firefox first). Use feature query for older support:</p>
<pre><code class="language-css">@supports (grid-template-columns: subgrid) {
  .inner { grid-template-columns: subgrid; }
}
</code></pre>

<h3>Container queries unit</h3>
<p>Inside <code>@container</code>, you can use <code>cqw</code>, <code>cqh</code>, <code>cqi</code>, <code>cqb</code> units (container width / height / inline / block percent).</p>

<h3>:has() performance</h3>
<p>Modern engines optimize <code>:has()</code>, but complex queries (e.g., <code>:has(* &gt; .deep)</code>) can be slow. Profile.</p>

<h3>:where vs :is for resets</h3>
<p>Resets should use <code>:where()</code> so specificity stays at 0; otherwise reset styles can override later styles unexpectedly.</p>

<h3>Custom property fallbacks</h3>
<p>Custom properties that fail to resolve (e.g., bad value) make the entire declaration <em>invalid</em>, falling back to inherited. <code>color: var(--c, red)</code> uses red if <code>--c</code> is undefined.</p>

<h3>Animatable custom properties (@property)</h3>
<pre><code class="language-css">@property --gradient-pos {
  syntax: '&lt;percentage&gt;';
  initial-value: 0%;
  inherits: false;
}

.box {
  background: linear-gradient(red, blue var(--gradient-pos));
  transition: --gradient-pos 1s;
}
.box:hover { --gradient-pos: 100%; }
</code></pre>
<p>Without <code>@property</code>, custom properties are treated as strings; can't interpolate.</p>

<h3>Overflow scroll inside flex</h3>
<p>Flex item with <code>overflow: auto</code> may not shrink as expected. Add <code>min-height: 0</code> or <code>min-width: 0</code> to allow shrinking below content size.</p>

<h3>Absolute positioning + flexbox</h3>
<p>Absolute-positioned children of flex containers are removed from flex layout but retain their containing block (the positioned ancestor). This is normal but trips up beginners.</p>

<h3>Print page-break</h3>
<p>Modern: <code>break-after: page</code>. Legacy: <code>page-break-after: always</code>. Both work; modern preferred.</p>

<h3>vh on mobile Safari</h3>
<p>iOS Safari's address bar shrinks on scroll, changing viewport height. <code>100vh</code> can overshoot. Use <code>100dvh</code> (dynamic viewport height; modern), <code>100lvh</code> (large), or <code>100svh</code> (small).</p>

<h3>backdrop-filter performance</h3>
<p>Backdrop-filter (frosted glass effect) is GPU-expensive. Use sparingly. iOS Safari handles well; budget Android struggles.</p>

<h3>aspect-ratio with intrinsic content</h3>
<p>Setting <code>aspect-ratio</code> on an element with content larger than the ratio causes overflow. Combine with <code>overflow: hidden</code> or accept that aspect-ratio is a hint, not a clamp.</p>

<h3>color-mix browser support</h3>
<p>2024 baseline. For older browsers, use <code>@supports (color: color-mix(in srgb, red, blue))</code> with fallback.</p>

<h3>HTML attribute selectors and case</h3>
<p><code>[type="button"]</code> is case-sensitive by default. Use <code>[type="button" i]</code> for case-insensitive match.</p>

<h3>Pseudo-element specificity</h3>
<p>Pseudo-elements (<code>::before</code>, <code>::after</code>) count as element selectors. Pseudo-classes (<code>:hover</code>, <code>:focus</code>) count as class selectors.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: !important war</h3>
<p>Adding <code>!important</code> to fix a specificity issue. Other code adds more <code>!important</code>. Codebase becomes unmanageable. Solution: use cascade layers or refactor selectors.</p>

<h3>Bug 2: Wrong box-sizing</h3>
<pre><code class="language-css">/* Without border-box */
.card { width: 200px; padding: 20px; border: 1px solid; }
/* Total width: 200 + 40 + 2 = 242px → content overflow */

/* With border-box */
*, *::before, *::after { box-sizing: border-box; }
.card { width: 200px; padding: 20px; border: 1px solid; }
/* Total width stays 200px */
</code></pre>

<h3>Bug 3: Forgetting min-height/min-width: 0 in flex</h3>
<pre><code class="language-css">.flex-container {
  display: flex;
}
.flex-item {
  flex: 1;
  overflow: hidden;
  /* min-width: 0; */   ← without this, flex item won't shrink below content
}
</code></pre>

<h3>Bug 4: 100vh on mobile Safari</h3>
<p>Address bar collapses; layout overshoots. Use <code>100dvh</code> or set <code>--vh</code> via JS.</p>

<h3>Bug 5: Sticky element not sticking</h3>
<p>Common: ancestor has <code>overflow: hidden</code>. Sticky elements stick within the nearest scrollable ancestor; if you want viewport-sticky, ensure no ancestor has overflow set.</p>

<h3>Bug 6: z-index doesn't work</h3>
<p>Element has z-index but stays behind. Causes:</p>
<ul>
  <li>Element has <code>position: static</code> (z-index ignored).</li>
  <li>Stacking context isolation; child of a low-z ancestor.</li>
  <li>opacity / transform / filter on ancestor created stacking context.</li>
</ul>

<h3>Bug 7: Overrideing custom property in wrong place</h3>
<pre><code class="language-css">/* Won't work — pseudo-class doesn't cascade up */
.card:hover {
  --color: red;
}

/* Works — children inherit the override */
.card { --color: blue; }
.card:hover { --color: red; }
.card span { color: var(--color); }
</code></pre>

<h3>Bug 8: animating display</h3>
<p>display: none → block can't be transitioned (was true; modern <code>transition-behavior: allow-discrete</code> changes this). Use opacity + visibility for fades.</p>

<h3>Bug 9: gap on flex with no flex-wrap</h3>
<p>Flex container with <code>gap</code> + <code>flex-wrap: nowrap</code> + items larger than container = overflow. Use <code>flex-wrap: wrap</code> or set <code>min-width: 0</code> on items.</p>

<h3>Bug 10: Nested flex/grid alignment confusion</h3>
<p>Nesting flex inside flex (or grid in grid) — alignment properties are local to each container. <code>align-items: center</code> on outer doesn't apply to inner's children.</p>

<h3>Anti-pattern 1: ID selectors for styling</h3>
<p>IDs have specificity (0,1,0,0); hard to override. Use classes for styling; IDs for JS hooks if needed.</p>

<h3>Anti-pattern 2: Deep nesting</h3>
<p><code>.nav .menu .item .link</code> → high specificity, fragile. Flatten with classes (<code>.nav-link</code>) or use BEM.</p>

<h3>Anti-pattern 3: !important everywhere</h3>
<p>Cascading was designed to be predictable; !important breaks it. Reach for it only in utilities (Tailwind-style) or as a last resort.</p>

<h3>Anti-pattern 4: Using absolute positioning when grid/flex would do</h3>
<p>Absolute positioning is for overlays / popovers, not normal layout. Grid and flex give you flow-aware layouts that respect the box model.</p>

<h3>Anti-pattern 5: Duplicating values across rules</h3>
<p>Same #0a84ff repeated in 50 places. Use custom properties for design tokens.</p>

<h3>Anti-pattern 6: Pixel-perfect layouts</h3>
<p>Hardcoding 1366px breakpoints based on a designer's monitor. Use mobile-first with min-width and use clamp() / fr / minmax() for fluid layouts.</p>

<h3>Anti-pattern 7: Margin instead of gap</h3>
<p>Adding margin-right to siblings (with <code>:last-child { margin: 0 }</code>) when <code>gap</code> on flex/grid does it natively. Use gap.</p>

<h3>Anti-pattern 8: Float-based layout</h3>
<p>Floats are for text wrap around images. Pre-2014 they were hacked into grids. Don't use floats for layout in 2026; use Grid / Flexbox.</p>

<h3>Anti-pattern 9: Display: table for layout</h3>
<p>Tables are for tabular data. Don't use <code>display: table</code> for non-tabular layouts; Grid is the modern answer.</p>

<h3>Anti-pattern 10: Ignoring print styles</h3>
<p>Users often print web pages. Without print CSS, the page wastes ink and may not paginate well. Add <code>@media print</code> as a baseline.</p>
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
    <tr><td><em>Cascade order?</em></td><td>Origin → layer → specificity → source order. Plus !important flips on each.</td></tr>
    <tr><td><em>Specificity calculation?</em></td><td>(inline, ids, classes/attrs/pseudo-classes, elements/pseudo-elements). Higher wins.</td></tr>
    <tr><td><em>Box model?</em></td><td>content + padding + border + margin. <code>box-sizing: border-box</code> includes padding and border in width.</td></tr>
    <tr><td><em>Flexbox vs Grid?</em></td><td>Flex: 1D distribution. Grid: 2D layout with explicit tracks.</td></tr>
    <tr><td><em>How does z-index work?</em></td><td>Only on positioned elements; local to stacking context.</td></tr>
    <tr><td><em>What's a stacking context?</em></td><td>Element + descendants with z-index ordering local to it; created by position+z-index, opacity, transform, filter, etc.</td></tr>
    <tr><td><em>What's the difference between :is and :where?</em></td><td>:is takes specificity of highest argument; :where always 0.</td></tr>
    <tr><td><em>What's :has?</em></td><td>Parent selector — matches elements that contain a descendant matching the argument.</td></tr>
    <tr><td><em>What's a container query?</em></td><td>Style based on container size, not viewport. Requires container-type on parent.</td></tr>
    <tr><td><em>What are cascade layers?</em></td><td><code>@layer</code>; explicit ordering of style sources; predictable specificity across libraries.</td></tr>
    <tr><td><em>How do you center content?</em></td><td>Multiple ways: flex (justify+align), grid (place-items), absolute+transform.</td></tr>
    <tr><td><em>What are logical properties?</em></td><td>margin-inline-start instead of margin-left; auto-flips for RTL/vertical writing modes.</td></tr>
    <tr><td><em>What's clamp()?</em></td><td>clamp(min, preferred, max) — fluid value that's bounded.</td></tr>
    <tr><td><em>How to handle viewport on mobile Safari?</em></td><td>Use 100dvh (dynamic) instead of 100vh (which doesn't account for collapsing address bar).</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Center a div inside another using 3 different methods.</li>
  <li>Build a holy-grail layout with Grid.</li>
  <li>Create a responsive card grid with auto-fit + minmax.</li>
  <li>Add a theme toggle using custom properties.</li>
  <li>Add a container query that switches a card's layout based on its width.</li>
  <li>Use :has() to highlight a form when invalid.</li>
  <li>Animate a collapsible section using grid-template-rows.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>z-index not working — element is static or in lower stacking context.</li>
  <li>flex item not shrinking — needs min-width: 0.</li>
  <li>100vh overshooting on iOS — use 100dvh.</li>
  <li>!important war — use cascade layers.</li>
  <li>Margin between flex items — use gap.</li>
  <li>Tailwind utility not overriding component styles — wrap utilities in a higher layer.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Cascade fluency</td><td>You explain origin/layer/specificity/source-order order without prompting.</td></tr>
    <tr><td>Layout discipline</td><td>You pick Flex vs Grid based on dimensions, not preference.</td></tr>
    <tr><td>Modern selector knowledge</td><td>You volunteer :has, :is, :where, :focus-visible.</td></tr>
    <tr><td>Token-based theming</td><td>You use custom properties as design tokens.</td></tr>
    <tr><td>Container query awareness</td><td>You know when to use them over media queries.</td></tr>
    <tr><td>Logical properties</td><td>You volunteer for international support.</td></tr>
    <tr><td>!important restraint</td><td>You avoid it; use cascade layers when needed.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN doesn't use CSS — it uses StyleSheet API. Same underlying ideas: flex layout (Yoga), but no Grid, no cascade, no selectors.</li>
  <li>RN's flex defaults differ from web: <code>flexDirection: 'column'</code> (web is row); <code>alignItems: 'stretch'</code> default.</li>
  <li>RN doesn't have media queries; use <code>Dimensions</code> + <code>useWindowDimensions</code>.</li>
  <li>RN Web translates RN styles to CSS; same modern CSS applies.</li>
  <li>For shared design tokens, define both web CSS variables and RN style objects from a single source.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why does flex shrink ignore min-content?"</em> — Default <code>min-width: auto</code> on flex items is "min content size." A flex item with overflow content won't shrink below it. Override with <code>min-width: 0</code>.</li>
  <li><em>"Why is :has() so powerful?"</em> — Pre-:has, CSS could only style descendants of a parent. With :has, you can style a parent based on its children — pure CSS state machines for complex UIs without JS.</li>
  <li><em>"Why use cascade layers?"</em> — Predictable order: utility classes always beat component classes regardless of source order or selector specificity. Solves the "Tailwind class doesn't override" headache.</li>
  <li><em>"Why custom properties over Sass variables?"</em> — Custom properties cascade and are runtime-mutable. Sass variables are compile-time only. Theming requires runtime values.</li>
  <li><em>"What's the modern alternative to BEM?"</em> — CSS Modules, Tailwind utilities, CSS-in-JS, or just modern selectors with cascade layers. BEM solved a 2014 problem; modern tools have alternatives.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit !important usage; identify candidates for cascade layers.</li>
  <li>Verify modern reset includes border-box, system-ui font, reduced-motion respect.</li>
  <li>Check for floats / display: table layouts; migrate to Grid / Flex.</li>
  <li>Migrate hard-coded colors to custom properties as design tokens.</li>
  <li>Audit physical properties (margin-left, etc.); switch to logical for international support.</li>
  <li>Identify component-level responsive issues; consider container queries.</li>
  <li>Run Lighthouse / axe; fix any contrast / a11y CSS issues.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd consolidate design tokens into a single source feeding both web CSS variables and RN StyleSheet."</li>
  <li>"I'd migrate to cascade layers organization-wide for predictable specificity."</li>
  <li>"I'd build a Storybook with all components in light/dark/rtl variants."</li>
  <li>"I'd POC anchor positioning for our complex tooltip / popover system."</li>
  <li>"I'd add a 'CSS architecture' chapter to the team wiki — when to use which layout primitive."</li>
</ul>
`
    }
  ]
});
