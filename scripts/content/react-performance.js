window.PREP_SITE.registerTopic({
  id: 'react-performance',
  module: 'React Deep',
  title: 'Performance',
  estimatedReadTime: '30 min',
  tags: ['react', 'performance', 'memo', 'useMemo', 'useCallback', 'profiler', 'virtualization', 'code-splitting'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>React performance work is mostly about <strong>not doing unnecessary work</strong>. There are three places to save time:</p>
<ol>
  <li><strong>Skip renders</strong> — <code>React.memo</code>, <code>useMemo</code>, <code>useCallback</code>, stable context values, splitting contexts, moving state down.</li>
  <li><strong>Do less during render</strong> — avoid expensive computation in the component body, virtualize long lists, defer non-urgent updates with <code>startTransition</code>.</li>
  <li><strong>Ship less JS / paint less</strong> — code-split routes with <code>lazy</code>, tree-shake dead code, hydrate less with RSC, avoid DOM churn (keys, portals, layout stability).</li>
</ol>
<ul>
  <li>Always <strong>measure first</strong> — React DevTools Profiler shows why components rendered and how long they took. Optimizing without measurement wastes time and often makes code slower (memo overhead).</li>
  <li>Common culprits: new inline objects/functions every render (breaks memo), huge Context, reading shared state that updates often, uncontrolled lists without virtualization, synchronous expensive calculations in render.</li>
  <li>Many "perf bugs" are actually correctness bugs (wrong keys, missing deps) that happen to cost frames.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Measure, then optimize. React re-renders are cheap if the reconciler can quickly decide "no changes." Your job is usually to stabilize identity, scope state correctly, and avoid expensive work in the render path.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What "slow React" usually means</h3>
<p>"The page is slow" in React apps decomposes into a few distinct issues:</p>
<ol>
  <li><strong>Initial load is slow.</strong> Too much JS to download/parse/execute, blocking render. Measured by LCP, FCP, TBT.</li>
  <li><strong>Interactions are slow.</strong> Clicking something causes a pause. Measured by INP (formerly FID), long-task counts.</li>
  <li><strong>Scrolling is janky.</strong> Frames drop. Usually a layout/paint issue or synchronous rendering of off-screen items.</li>
  <li><strong>Memory grows over time.</strong> Leaked components, observers, timers. Covered in JS memory chapter.</li>
</ol>
<p>Each needs different instrumentation and fixes. This chapter focuses on interaction & render-time issues; bundle/load perf is covered in the Frontend Performance module.</p>

<h3>Why re-renders aren't automatically bad</h3>
<p>A render is just React calling your function and doing a cheap diff. For a component with simple output, that might take microseconds. It only <em>matters</em> when:</p>
<ul>
  <li>The component is called thousands of times (a virtualized list, a grid).</li>
  <li>The component does heavy work itself — sorting, parsing, formatting.</li>
  <li>The subtree is huge and re-renders propagate.</li>
  <li>Effects kick off expensive side effects (re-fetching, re-subscribing) because a dep changed.</li>
</ul>
<p>Profiler will tell you which of these is hitting you. Guessing leads to over-memoization (which has its own cost).</p>

<h3>Why memoization is nuanced</h3>
<p>Every <code>useMemo</code> / <code>useCallback</code> costs: a hook slot, a deps array, a shallow-compare on every render. For cheap values, that overhead can outweigh the savings. Memoization <em>pays off</em> when:</p>
<ul>
  <li>The factory function is expensive (sort, filter, parse).</li>
  <li>The value is passed as a prop to a memoized child (stability prevents re-render).</li>
  <li>The value is a dependency of an effect — stability prevents effect re-runs.</li>
</ul>
<p>Blanket memoization of every primitive and handler is cargo cult. The upcoming <strong>React Compiler</strong> (Babel plugin) automatically memoizes components based on static analysis — when it ships widely, manual memoization is less needed.</p>

<h3>Why stable identity matters</h3>
<p>React's diff is a reference comparison for props and deps. If a parent passes <code>onClick={() =&gt; ...}</code>, the function is new every render — children can't bail out, effects re-run. Stable identity (via <code>useCallback</code>, moving definitions outside the component, deriving from stable props) is often more impactful than memoizing the receiving component.</p>

<h3>Why profiling is non-optional</h3>
<p>Your intuition about "the expensive part" is almost always wrong. A tiny re-render 200 times a second is a bigger problem than a 30ms filter that runs once. Profile. Look at actual commit durations, self time vs total time, whether the commit was caused by props or state. Optimize the biggest number first.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "render pipeline" picture</h3>
<div class="diagram">
<pre>
Trigger       → Render phase            → Commit phase
  state          call components            DOM mutations
  props          diff elements              refs
  context        produce fiber tree         layout effects
                                            passive effects

OPTIMIZATIONS
  - avoid trigger: memo, stable refs, context split
  - cheaper render: useMemo, virtualize, startTransition
  - cheaper commit: fewer DOM ops (keys, batched updates)
  - cheaper effects: correct deps, skip unnecessary re-runs
</pre>
</div>

<h3>The "state lives as close as possible" picture</h3>
<p>Heavy re-renders often come from state being too high in the tree. If only one leaf needs the state, hoist the leaf. If many leaves need it but they're siblings, consider lifting a <em>selector</em> store (Zustand) instead of context. Don't put everything in a single top-level provider.</p>

<h3>The "memoization flow" picture</h3>
<div class="diagram">
<pre>
  Parent renders
    │
    ├── prop A: stable (useMemo in parent)  ──► Child.memo skips ✓
    │
    ├── prop B: new object every render     ──► Child.memo re-renders ✗
    │
    └── context C: changed this render      ──► consumer re-renders (memo bypassed)
</pre>
</div>

<h3>The "virtualization" picture</h3>
<p>Rendering 10,000 rows creates 10,000 fibers, 10,000 DOM nodes, 10,000 listeners. Virtualization renders only the rows visible in the viewport (plus a small overscan). As you scroll, it recycles DOM nodes. Libraries: <code>react-window</code> (simple, fixed/variable height), <code>react-virtual</code> / <code>@tanstack/virtual</code> (more flexible), <code>FlashList</code> in React Native.</p>

<h3>The "time-slicing" picture</h3>
<p>If a render takes 200ms, the browser is blocked for 200ms — no input processing, no painting. With <code>startTransition</code>, React yields every few ms (fiber boundary), letting input and painting happen, then resumes. User feels responsiveness even if total render time is the same.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Wrap everything in React.memo for free perf." No — memo has a cost. Components that render cheaply and often get new props are slower with memo than without. Benchmark in production, not dev (dev has extra instrumentation).</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Tooling: the React DevTools Profiler</h3>
<p>Install React DevTools → Profiler tab. Click record → interact → stop. You see:</p>
<ul>
  <li><strong>Commit list</strong> — each commit with its total time.</li>
  <li><strong>Flamegraph</strong> — per-component render time for the selected commit. Width = time. Gray = didn't render; green-yellow-red = fast-to-slow.</li>
  <li><strong>Ranked</strong> view — components sorted by render time.</li>
  <li><strong>Why did this render?</strong> — toggle in settings; shows "props changed: X, Y" or "hook 3 changed" per component.</li>
</ul>
<p>Goals: identify top N components by total time; find unexpected re-renders; measure the impact of each change.</p>

<h3>React.memo</h3>
<pre><code class="language-js">const Child = React.memo(function Child({ a, b }) { ... });
// Re-renders only if Object.is(prevProps[k], nextProps[k]) fails for any key.
// Custom comparator:
const Child = React.memo(Child, (prev, next) =&gt; prev.id === next.id);
// Return true = skip render.</code></pre>

<h3>useMemo for expensive computation</h3>
<pre><code class="language-js">const sorted = useMemo(() =&gt; items.slice().sort(cmp), [items]);
// Runs factory only when items reference changes.</code></pre>
<p>Don't memoize trivial transforms — the compare + cache overhead exceeds the work.</p>

<h3>useCallback for stable handlers</h3>
<pre><code class="language-js">const onClick = useCallback((id) =&gt; dispatch({ type: 'toggle', id }), [dispatch]);</code></pre>
<p>Only useful if the receiver is memoized or the fn is a dep. Otherwise pure overhead.</p>

<h3>Context splitting</h3>
<pre><code class="language-js">// Instead of one mega-context...
&lt;App.Provider value={{ user, theme, cart }}&gt; // ← every change invalidates every consumer
// ...split by update cadence
&lt;User.Provider value={user}&gt;
  &lt;Theme.Provider value={theme}&gt;
    &lt;Cart.Provider value={cart}&gt;</code></pre>

<h3>Move state down</h3>
<pre><code class="language-js">// BAD — state high, re-renders whole subtree
function App() {
  const [hover, setHover] = useState(false);
  return (
    &lt;&gt;
      &lt;HeavyTree/&gt; // re-renders when hover changes
      &lt;Tooltip visible={hover} /&gt;
    &lt;/&gt;
  );
}
// GOOD — localize state
function App() {
  return (&lt;&gt;&lt;HeavyTree/&gt;&lt;HoverArea/&gt;&lt;/&gt;);
}
function HoverArea() {
  const [hover, setHover] = useState(false);
  return &lt;div onMouseEnter={...}&gt;&lt;Tooltip visible={hover}/&gt;&lt;/div&gt;;
}</code></pre>

<h3>Virtualization</h3>
<pre><code class="language-js">import { FixedSizeList } from 'react-window';
&lt;FixedSizeList height={600} itemCount={10000} itemSize={36}&gt;
  {({ index, style }) =&gt; &lt;div style={style}&gt;Item {index}&lt;/div&gt;}
&lt;/FixedSizeList&gt;</code></pre>

<h3>Code splitting</h3>
<pre><code class="language-js">const Settings = lazy(() =&gt; import('./Settings'));
&lt;Suspense fallback={&lt;Spinner/&gt;}&gt;
  &lt;Settings/&gt;
&lt;/Suspense&gt;
// Bundler splits Settings into a separate chunk, loaded on demand.</code></pre>

<h3>Tree-shaking</h3>
<p>Use ES module imports (<code>import { X } from 'lib'</code>) to let the bundler drop unused exports. Ensure the library has <code>"sideEffects": false</code> in its package.json. Prefer named imports over default-imports of huge modules.</p>

<h3>Avoid unnecessary work in render</h3>
<pre><code class="language-js">// BAD
function Comp({ items }) {
  const big = items.map(expensiveTransform); // runs every render
  return &lt;List data={big} /&gt;;
}
// GOOD
const big = useMemo(() =&gt; items.map(expensiveTransform), [items]);</code></pre>

<h3>useTransition for heavy updates</h3>
<pre><code class="language-js">const [pending, startTransition] = useTransition();
const onFilter = (q) =&gt; {
  setInput(q);
  startTransition(() =&gt; setFiltered(filter(items, q)));
};
// Typing stays responsive; filter render is interruptible.</code></pre>

<h3>useDeferredValue</h3>
<pre><code class="language-js">const deferredQ = useDeferredValue(query);
// When query changes, urgent UI updates first; heavy child sees old query until ready.</code></pre>

<h3>Avoid prop drilling through heavy trees</h3>
<p>A prop passed through 10 levels causes re-renders at every level. Use context (scoped), or colocate consumers with the state.</p>

<h3>React.Profiler API (runtime)</h3>
<pre><code class="language-js">&lt;Profiler id="Panel" onRender={(id, phase, actualDur, baseDur, start, end) =&gt; {
  if (actualDur &gt; 16) console.warn('slow', id, actualDur);
}}&gt;
  &lt;Panel/&gt;
&lt;/Profiler&gt;</code></pre>
<p>Available in production. Useful for real-user monitoring of specific critical subtrees.</p>

<h3>React Compiler (2025)</h3>
<p>A Babel plugin that statically analyzes components and auto-memoizes. Wrapping in <code>React.memo</code>, calls to <code>useMemo</code>/<code>useCallback</code> mostly become unnecessary. Opt-in; not all patterns are supported yet. Will increasingly be the default advice once stable.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — memo on a leaf</h3>
<pre><code class="language-js">const Row = React.memo(function Row({ item, onClick }) {
  return &lt;li onClick={() =&gt; onClick(item.id)}&gt;{item.title}&lt;/li&gt;;
});
// Parent:
const onClick = useCallback((id) =&gt; ..., []);
return items.map(i =&gt; &lt;Row key={i.id} item={i} onClick={onClick} /&gt;);
// Rows skip re-renders when parent re-renders for unrelated reasons.</code></pre>

<h3>Example 2 — useMemo for sort/filter</h3>
<pre><code class="language-js">const visible = useMemo(() =&gt; items.filter(byActive).sort(byDate), [items]);</code></pre>

<h3>Example 3 — context split</h3>
<pre><code class="language-js">const UserCtx = createContext();
const ThemeCtx = createContext();
function Root() {
  const [user, setUser] = useState(...);
  const [theme, setTheme] = useState('dark');
  return (
    &lt;UserCtx.Provider value={user}&gt;
      &lt;ThemeCtx.Provider value={theme}&gt;
        &lt;App/&gt;
      &lt;/ThemeCtx.Provider&gt;
    &lt;/UserCtx.Provider&gt;
  );
}
// A ThemeCtx change re-renders only theme consumers, not user consumers.</code></pre>

<h3>Example 4 — state moved down</h3>
<pre><code class="language-js">// Bad: App rerenders on every keystroke
function App() {
  const [search, setSearch] = useState('');
  return (&lt;&gt;&lt;Heavy/&gt;&lt;SearchBox value={search} onChange={setSearch} /&gt;&lt;/&gt;);
}
// Good: SearchBox owns its state, emits events up via callback / store
function App() { return (&lt;&gt;&lt;Heavy/&gt;&lt;SearchBox onSubmit={runQuery} /&gt;&lt;/&gt;); }</code></pre>

<h3>Example 5 — virtualized list with react-window</h3>
<pre><code class="language-js">import { VariableSizeList } from 'react-window';
&lt;VariableSizeList itemCount={rows.length} itemSize={(i) =&gt; heights[i]} height={600}&gt;
  {({ index, style }) =&gt; &lt;Row style={style} row={rows[index]} /&gt;}
&lt;/VariableSizeList&gt;</code></pre>

<h3>Example 6 — code split by route</h3>
<pre><code class="language-js">const Settings = lazy(() =&gt; import('./Settings'));
const Billing = lazy(() =&gt; import('./Billing'));
&lt;Routes&gt;
  &lt;Route path="/settings" element={&lt;Suspense fallback={&lt;Spinner/&gt;}&gt;&lt;Settings/&gt;&lt;/Suspense&gt;} /&gt;
  &lt;Route path="/billing" element={&lt;Suspense fallback={&lt;Spinner/&gt;}&gt;&lt;Billing/&gt;&lt;/Suspense&gt;} /&gt;
&lt;/Routes&gt;</code></pre>

<h3>Example 7 — memo with custom comparator</h3>
<pre><code class="language-js">const Chart = React.memo(function Chart({ data, options }) { ... },
  (prev, next) =&gt; prev.data === next.data &amp;&amp; prev.options.width === next.options.width);</code></pre>

<h3>Example 8 — pushing function identity higher</h3>
<pre><code class="language-js">// BAD — new fn per render
&lt;Child onUpdate={(val) =&gt; setX(val + 1)} /&gt;
// GOOD
const onUpdate = useCallback((val) =&gt; setX(p =&gt; p + 1), []);
&lt;Child onUpdate={onUpdate} /&gt;</code></pre>

<h3>Example 9 — useTransition around slow state</h3>
<pre><code class="language-js">const [pending, startTransition] = useTransition();
function onSort(by) {
  startTransition(() =&gt; setSortKey(by));
}
{pending &amp;&amp; &lt;SubtleSpinner/&gt;}</code></pre>

<h3>Example 10 — Profiler API logging slow commits</h3>
<pre><code class="language-js">&lt;Profiler id="Cart" onRender={(_, phase, dur) =&gt; {
  if (dur &gt; 32) log('slow cart render', phase, dur);
}}&gt;
  &lt;Cart/&gt;
&lt;/Profiler&gt;</code></pre>

<h3>Example 11 — avoiding inline objects in JSX</h3>
<pre><code class="language-js">// BAD: new style object every render
&lt;Child style={{ color: 'red' }} /&gt;
// GOOD: extract
const redStyle = { color: 'red' }; // outside render body
&lt;Child style={redStyle} /&gt;</code></pre>

<h3>Example 12 — using useReducer instead of many useState</h3>
<pre><code class="language-js">// If several setStates always fire together, useReducer batches naturally
// and gives a single action type, making the update signature clearer.</code></pre>

<h3>Example 13 — deferring with useDeferredValue</h3>
<pre><code class="language-js">function Comp({ query }) {
  const deferredQuery = useDeferredValue(query);
  const heavyResult = useMemo(() =&gt; expensiveCalc(deferredQuery), [deferredQuery]);
  return &lt;View data={heavyResult} /&gt;;
}</code></pre>

<h3>Example 14 — avoiding prop drilling with composition</h3>
<pre><code class="language-js">// Instead of threading onClose through 5 levels:
&lt;Modal onClose={close}&gt;
  &lt;Content/&gt;
&lt;/Modal&gt;
// Modal handles its own close button; Content doesn't need to know.</code></pre>

<h3>Example 15 — image lazy loading</h3>
<pre><code class="language-js">&lt;img src="hero.webp" loading="lazy" decoding="async" /&gt;
// Offload image fetching/decode from main thread, cuts LCP work.</code></pre>

<h3>Example 16 — bailout via setState equal value</h3>
<pre><code class="language-js">const [n, setN] = useState(0);
setN(0); // React compares Object.is → bails out, no re-render.</code></pre>

<h3>Example 17 — React.memo with context-consuming child (pitfall)</h3>
<pre><code class="language-js">const Child = React.memo(function Child() {
  const t = useContext(ThemeCtx); // re-renders on context change regardless of memo
  return ...;
});</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. memo doesn't help if props are always new</h3>
<pre><code class="language-js">&lt;Memo onClick={() =&gt; {}} options={{a:1}} /&gt;
// New fn + new object every render → memo never bails out.</code></pre>

<h3>2. useMemo cache can be evicted</h3>
<p>React docs: "useMemo may forget previously memoized values in the future." Works today, but don't rely on caching for correctness.</p>

<h3>3. useCallback with empty deps captures initial values</h3>
<pre><code class="language-js">const fn = useCallback(() =&gt; console.log(count), []);
// fn always logs initial count. Stale closure. Include count in deps.</code></pre>

<h3>4. Context value wrapped in memo doesn't always help</h3>
<p>If you memoize the value but the object fields change frequently, consumers re-render. Split into multiple contexts or use a selector library for fine-grained updates.</p>

<h3>5. Virtualized list focus loss</h3>
<p>Items scrolled out of view are unmounted. If a virtualized item has an input with focus, scrolling loses focus. Workarounds: use libraries that support focus restoration, or avoid virtualization for focused subtrees.</p>

<h3>6. React.memo's shallow prop comparison and children</h3>
<pre><code class="language-js">&lt;Memo&gt;&lt;Child/&gt;&lt;/Memo&gt;
// JSX children produce a new element every render → memo always re-renders.
// Memoize the children:
const child = useMemo(() =&gt; &lt;Child/&gt;, []);
&lt;Memo&gt;{child}&lt;/Memo&gt;</code></pre>

<h3>7. React Compiler vs manual memoization</h3>
<p>Once React Compiler is enabled project-wide, manual memo+useMemo+useCallback mostly become redundant. Until then, pragmatic hand-memoization in hot paths is the norm.</p>

<h3>8. Profiler overhead in production</h3>
<p>React DevTools Profiler hooks are present in production builds marked <code>profiling</code>. They add slight overhead. Regular production builds (<code>production</code>) don't have them — can't profile live.</p>

<h3>9. Lazy components re-suspend on every remount</h3>
<p>If you toggle a <code>&lt;Suspense&gt;</code> boundary with a lazy child, the chunk is loaded once; but the component instance remounts each time. Preserve state by keeping the component mounted and hiding with CSS, or cache the state externally.</p>

<h3>10. Very deep trees and context invalidation cost</h3>
<p>Context invalidation walks every descendant. For a 100k-fiber tree, that's slow regardless of memoization. Keep context near consumers; split trees.</p>

<h3>11. Hydration vs CSR initial render</h3>
<p>First load on SSR uses hydration (React reconciles with existing DOM). Hydration runs all components and effects, similar cost to CSR render. Selective hydration (React 18) lets interactive parts hydrate before the rest.</p>

<h3>12. Measuring in development vs production</h3>
<p>Dev build is slower due to PropTypes checks, warnings, StrictMode double-invocation. Always benchmark on production builds with <code>NODE_ENV=production</code>.</p>

<h3>13. Keys as remount trigger (intended vs accidental)</h3>
<p>Intentional: <code>&lt;Form key={recordId} /&gt;</code> to reset state.<br/>Accidental: using <code>Math.random()</code> as key → remounts every render → full teardown every time.</p>

<h3>14. useState lazy initializer runs only on mount</h3>
<p>Expensive init function in useState should be passed as a function, not the result of calling it:</p>
<pre><code class="language-js">useState(() =&gt; heavyComputation())   // runs once
useState(heavyComputation())          // runs every render (discarded after mount)</code></pre>

<h3>15. Cloning and spreading large props</h3>
<pre><code class="language-js">&lt;Child {...mostly} extra="x" /&gt;
// Spread is fine for small objects; for big ones, explicit props are clearer
// and avoid creating a new Element shape each render.</code></pre>

<h3>16. Expensive useSyncExternalStore selectors</h3>
<p>The selector runs on every store change. Use a memoized selector, structural equality, or narrow the subscription.</p>

<h3>17. Browser paint vs React commit timing</h3>
<p>React's commit is sync, but the browser only paints at the next animation frame. If your commit is big (lots of DOM ops), the paint is delayed — feels like the commit is slow even if React work is cheap. Audit DOM complexity, not just React work.</p>

<h3>18. JS work outside React still matters</h3>
<p>A 200ms JSON.parse in a handler blocks React too. Move off main thread: Web Workers, chunked parsing, streaming.</p>

<h3>19. Forcing layout reads inside render</h3>
<pre><code class="language-js">const rect = ref.current?.getBoundingClientRect(); // layout thrash</code></pre>
<p>Reading layout during render or in a loop with DOM writes causes "layout thrashing." Batch reads before writes, or use ResizeObserver.</p>

<h3>20. <code>Object.freeze</code> to catch mutations</h3>
<p>In dev, freeze props/state to prove nothing mutates them. If your app crashes on freeze, you had hidden mutation that was probably a bug.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — wrap-everything-in-memo</h3>
<p>Memoization is not free. Only wrap components that are proven slow or receive stable props. Benchmark before and after.</p>

<h3>Anti-pattern 2 — inline object/array/fn in JSX every render</h3>
<pre><code class="language-js">&lt;Child options={[1,2]} onClick={() =&gt; doIt()} /&gt;
// New array + new fn every render → any downstream memo is defeated.</code></pre>

<h3>Anti-pattern 3 — top-level context with frequent updates</h3>
<pre><code class="language-js">// BAD
&lt;AppCtx.Provider value={{cursorX, cursorY, scrollTop, ...}}&gt;</code></pre>
<p>Anything tracking pointer/scroll updates 60×/sec and invalidates every consumer.</p>

<h3>Anti-pattern 4 — rendering 10k rows without virtualization</h3>
<p>A thousand-row table that paints with no virtualization costs ~50ms on a modest device. Use <code>react-window</code> / <code>@tanstack/virtual</code>.</p>

<h3>Anti-pattern 5 — heavy work in render body</h3>
<pre><code class="language-js">function Comp({ items }) {
  const sorted = items.sort(); // mutates + runs every render
}</code></pre>
<p>Wrap with <code>useMemo</code>, or better, move to a derived store.</p>

<h3>Anti-pattern 6 — mis-using useState for computed values</h3>
<pre><code class="language-js">const [sum, setSum] = useState(0);
useEffect(() =&gt; setSum(a + b), [a, b]);</code></pre>
<p>Extra render, extra state to sync. Derive inline: <code>const sum = a + b</code>.</p>

<h3>Anti-pattern 7 — Profiler in production logs disabled</h3>
<p>When a user reports slowness, you have no data. Instrument critical subtrees with <code>&lt;Profiler&gt;</code> + RUM logging.</p>

<h3>Anti-pattern 8 — blocking main thread in handlers</h3>
<pre><code class="language-js">onClick={() =&gt; expensiveSyncWork()}
// Blocks paint until done. Break into chunks with requestIdleCallback or Web Worker.</code></pre>

<h3>Anti-pattern 9 — giant bundle from one page's dependencies</h3>
<p>Home page ships 2MB of settings-page code because everything is imported from one index barrel. Split: <code>lazy</code> routes, dynamic import of rarely-used features, sideEffects: false in packages.</p>

<h3>Anti-pattern 10 — reading context high, passing state deep</h3>
<p>Subscribing high invalidates too much; passing deep causes prop drilling pain. Library-grade state systems (Zustand, Jotai) give fine-grained read scoping.</p>

<h3>Anti-pattern 11 — using useEffect for sync derived state</h3>
<pre><code class="language-js">useEffect(() =&gt; setDerived(compute(a,b)), [a,b]); // one extra render
// Prefer:
const derived = useMemo(() =&gt; compute(a,b), [a,b]);</code></pre>

<h3>Anti-pattern 12 — keys as Math.random()</h3>
<pre><code class="language-js">items.map(i =&gt; &lt;Row key={Math.random()} item={i}/&gt;)
// Remounts every render. Expensive mount/unmount. Use stable id.</code></pre>

<h3>Anti-pattern 13 — over-subscribing stores</h3>
<pre><code class="language-js">const everything = useStore(); // selector = identity → re-render on any change</code></pre>
<p>Use a scoped selector: <code>useStore(s =&gt; s.cart.total)</code>.</p>

<h3>Anti-pattern 14 — big useEffect with many responsibilities</h3>
<p>One effect handling 5 subscriptions is hard to optimize. Split per concern; deps become simpler and unrelated changes don't trigger resubscriptions.</p>

<h3>Anti-pattern 15 — rendering hidden content</h3>
<pre><code class="language-js">&lt;div style={{ display: 'none' }}&gt;&lt;HeavyDashboard/&gt;&lt;/div&gt;
// HeavyDashboard still renders, effects still run, DOM nodes still exist.
// Unmount conditionally instead: {show &amp;&amp; &lt;HeavyDashboard/&gt;}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you approach a "my React app is slow" ticket?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Clarify:</strong> slow initial load, slow interaction, slow scroll, or memory?</li>
      <li><strong>Measure:</strong> open React Profiler; capture a representative session; identify top 3 components by total time.</li>
      <li><strong>Classify:</strong> unexpected re-renders (props churn, context invalidation) vs expensive renders (sort, render many nodes) vs big commits (many DOM ops).</li>
      <li><strong>Fix:</strong> targeted memoization, virtualize long lists, split contexts, move state down, extract stable identities, <code>startTransition</code> for heavy state updates.</li>
      <li><strong>Re-measure</strong>: confirm the fix moves the needle; avoid "vibes-based" optimization.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. When should I use React.memo?</div>
  <div class="qa-answer">
    <p>When profiling shows a component re-renders often with unchanged props AND its render cost is non-trivial (more than a few μs). Also requires stable props from the parent — often needs <code>useCallback</code> / <code>useMemo</code> upstream. Not useful for: components always receiving new props; cheap components; components consuming context that changes (memo is bypassed by context).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why might useMemo be slower than just recomputing?</div>
  <div class="qa-answer">
    <p>Every <code>useMemo</code> has costs: a hook slot allocation, deps array shallow-compare on every render, cache management. For trivial expressions (<code>a + b</code>, small object literals), these costs exceed the saved work. Use it for <em>actually</em> expensive computations or for stabilizing identity feeding memoized children / deps.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you virtualize a list? When should you?</div>
  <div class="qa-answer">
    <p>Virtualization renders only the rows visible in the viewport, recycling DOM nodes on scroll. Rule of thumb: virtualize if &gt; 100-200 rows. Use <code>react-window</code> for simple cases, <code>@tanstack/virtual</code> for flexible control (measured heights, grids). Cautions: focus management inside items, accessibility (ensure ARIA roles are still sensible), printing (virtualized lists don't print everything). For React Native: FlashList (Shopify).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you prevent a parent re-render from re-rendering memoized children?</div>
  <div class="qa-answer">
    <p>Wrap the child in <code>React.memo</code>, AND ensure props passed from the parent are stable references: primitives are fine; for objects/functions, use <code>useMemo</code>/<code>useCallback</code>. For a context consumer, <code>memo</code> is not enough — a context value change re-renders the consumer regardless. Split contexts by update cadence or switch to a selector-based store.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What's the cost of re-rendering in React?</div>
  <div class="qa-answer">
    <p>For a cheap component with unchanged output: a few microseconds — the function runs, React produces the same Elements, the reconciler diffs, no DOM mutations happen. For a component with changed output: the diff produces DOM ops; commit applies them. Costs scale with tree size and output complexity, not just render calls. A million trivial re-renders can still be faster than one massive commit with thousands of DOM ops.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How does code splitting work in React?</div>
  <div class="qa-answer">
    <p>Use <code>const X = lazy(() =&gt; import('./X'))</code> — the bundler (Webpack/Vite) emits X as a separate chunk. At render time, React throws a promise if the chunk isn't loaded yet; the nearest Suspense shows its fallback. When the chunk arrives, React retries the render. Strategies: split by route (home vs settings vs checkout), split by interaction (a modal, a rarely-used feature), split vendor libs from app code, split dynamically imported plugins.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Explain useTransition's impact on perceived performance.</div>
  <div class="qa-answer">
    <p>Wrapping a state update in <code>startTransition</code> tags it as low-priority. React yields during its render to process urgent updates (e.g., further typing into an input). The wall-clock render time is the same, but the user sees urgent UI (their input value) update immediately and the heavy render complete later — feels responsive. If a new urgent update arrives, the transition render is abandoned and restarted. Great for search-as-you-type, sort/filter toggles, tab transitions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. When does Context cause performance problems?</div>
  <div class="qa-answer">
    <p>Every consumer of a context re-renders on value change, bypassing <code>React.memo</code>. Problems:</p>
    <ul>
      <li><strong>Large value, small fields change:</strong> all consumers re-render even if they only read one field. Fix: split contexts.</li>
      <li><strong>Deep trees with many consumers:</strong> context invalidation walks every subscriber fiber. Fix: lift state into a library (Zustand, Jotai) with selector subscriptions.</li>
      <li><strong>New object each render:</strong> <code>value={{a,b}}</code> invalidates every consumer even if fields unchanged. Fix: <code>useMemo</code> the value.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. You're asked to improve INP on a page. Where do you start?</div>
  <div class="qa-answer">
    <p>INP (Interaction to Next Paint) is the user-perceived responsiveness metric. Steps:</p>
    <ol>
      <li>Chrome DevTools Performance → record the slow interaction. Identify long tasks.</li>
      <li>Look at the JS call graph: React reconciler, event handler logic, third-party libs.</li>
      <li>Break up synchronous work: <code>startTransition</code>, <code>requestIdleCallback</code>, Web Worker for pure JS work (parsing, crypto).</li>
      <li>Reduce DOM ops: virtualize lists, defer off-screen renders, batch state updates.</li>
      <li>Check for layout thrashing (alternating reads and writes in a loop).</li>
      <li>Reduce hydration work on initial load (RSC, partial hydration, lazy components).</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What is the React Compiler?</div>
  <div class="qa-answer">
    <p>A Babel plugin (in beta as of 2025) that statically analyzes your components and auto-inserts memoization. Functions it would wrap in <code>useCallback</code>, expressions in <code>useMemo</code>, components in <code>React.memo</code> — all happen automatically. Rules-of-React-compliant code just runs faster without manual tuning. Opt-in; not all patterns are supported. As adoption grows, manual memoization will be less common.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Explain the difference between actual time and base time in Profiler.</div>
  <div class="qa-answer">
    <p><strong>Actual time</strong>: how long this render actually took, including memo bailouts (bailouts are fast). <strong>Base time</strong>: how long the render WOULD have taken if nothing was memoized. A huge gap between base and actual means memoization is working. Similar actual and base means the component isn't benefitting from memo (or doesn't have any).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you keep a 100k-row table fast?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Virtualize</strong> — only render ~30 visible rows plus overscan.</li>
      <li><strong>Stable row component</strong> — <code>React.memo</code> on Row; stable onClick from useCallback.</li>
      <li><strong>Derived data outside render</strong> — useMemo for sorted/filtered views; web worker for very large sorts.</li>
      <li><strong>Avoid per-row effects</strong> — no per-row useEffect; use a single effect at the table level that observes row visibility.</li>
      <li><strong>Keyed by id</strong> — stable id for reorder efficiency.</li>
      <li><strong>Column virtualization</strong> for wide tables.</li>
      <li><strong>Pagination or infinite scroll</strong> — don't load all 100k at once; load as needed.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What's the impact of StrictMode on perf?</div>
  <div class="qa-answer">
    <p>StrictMode is <strong>dev-only</strong>. It double-invokes renders, effects, and state initializers, which roughly doubles dev perf cost. Does NOT affect production. Its goal is surfacing impure code and missing effect cleanups so they break loudly in dev rather than subtly in concurrent production scenarios.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. You have a hover tooltip that causes the whole app to re-render. Why and how do you fix?</div>
  <div class="qa-answer">
    <p>Hover state is held too high in the tree. Every mouse enter/leave triggers a top-level re-render. Fix: move the state into the smallest component that needs it.</p>
<pre><code class="language-js">function HoverCard() {
  const [hover, setHover] = useState(false);
  return (
    &lt;div onMouseEnter={() =&gt; setHover(true)} onMouseLeave={() =&gt; setHover(false)}&gt;
      {hover &amp;&amp; &lt;Tooltip/&gt;}
    &lt;/div&gt;
  );
}</code></pre>
    <p>General principle: state lives at the lowest common ancestor of its consumers.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You say "measure first" — specifically Profiler, Performance panel, RUM.</li>
    <li>You distinguish initial load, interaction, scroll, and memory as separate problems.</li>
    <li>You can justify why memo/useMemo have costs.</li>
    <li>You reach for virtualization at the right scale.</li>
    <li>You split context; move state down; avoid render-time heavy work.</li>
    <li>You know <code>startTransition</code>/<code>useDeferredValue</code> can improve perceived perf.</li>
    <li>You mention React Compiler as the emerging direction.</li>
  </ul>
</div>
`}

]
});
