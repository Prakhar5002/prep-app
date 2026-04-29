window.PREP_SITE.registerTopic({
  id: 'dbg-react',
  module: 'Debugging',
  title: 'React DevTools',
  estimatedReadTime: '24 min',
  tags: ['debugging', 'react', 'devtools', 'profiler', 'components', 'hooks', 'fiber'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>React DevTools is a browser extension (Chrome / Firefox / Edge) and standalone Electron app for debugging React. Two key panels:</p>
<ul>
  <li><strong>Components</strong> — inspect the React fiber tree. See props, state, hooks, context. Edit live. Find owner / parent / consumer relationships.</li>
  <li><strong>Profiler</strong> — record renders. See per-component render times, why each rendered, ranked by cost. The single best tool for finding render bottlenecks.</li>
</ul>
<ul>
  <li><strong>Search</strong> components by name; filter by HOC / memo / suspense.</li>
  <li><strong>"$r"</strong> in console — reference to currently selected component instance (like <code>$0</code> for DOM).</li>
  <li><strong>Why did this render?</strong> Setting + per-render attribution.</li>
  <li><strong>Suspense fallback</strong> — visualize active fallbacks.</li>
  <li><strong>Hooks</strong> with names (named hooks via custom names where supported).</li>
  <li><strong>Components.editable</strong> — edit props, state, hook values inline; component re-renders.</li>
  <li><strong>Standalone</strong> — for React Native, Electron, etc.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>React DevTools answers two questions Chrome DevTools can't: "what's the React tree look like?" and "why did this re-render?" Master Components for inspection and Profiler for perf.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why React DevTools is separate</h3>
<p>Browser DevTools shows the DOM. React's "tree" is the fiber tree — components, hooks, props, state — that produces the DOM. There's no DOM equivalent. React DevTools introspects React's fiber tree directly via the <code>__REACT_DEVTOOLS_GLOBAL_HOOK__</code> bridge.</p>

<h3>Why Profiler matters</h3>
<p>"Why is my React app slow?" is rarely answered by Chrome's Performance panel — that shows JS execution time, but not which component re-rendered or why. React's Profiler captures per-commit render data: which components rendered, how long each took, why they rendered (props change, state change, parent rendered). Single biggest tool for performance debugging.</p>

<h3>Why Components panel</h3>
<p>Lets you see the fiber tree. For each node:</p>
<ul>
  <li>Props (current values, editable).</li>
  <li>State (current state, editable).</li>
  <li>Hooks (each useState / useReducer / useContext / useEffect — named when possible).</li>
  <li>Rendered by (owner component).</li>
  <li>Source location (which file).</li>
  <li>Suspense status.</li>
</ul>
<p>Editing props / state live triggers a re-render — fast iteration.</p>

<h3>Why <code>$r</code> works like <code>$0</code></h3>
<p>When you select a component in DevTools, <code>$r</code> in the browser console is bound to that component instance. Inspect it from JS. Combined with breakpoints / logpoints, this is fluent debugging.</p>

<h3>Why "Highlight updates"</h3>
<p>Optional setting that flashes a border around components on each render. Visual signal: "this small button re-renders 100x per second." Often reveals memoization opportunities or state placement issues.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "two panels" picture</h3>
<div class="diagram">
<pre>
 Components panel                Profiler panel
 ─────────────────               ─────────────────
 Snapshot of current             Timeline of recorded commits
 fiber tree                      Per-commit: which fibers rendered
 Inspect / edit live             Why each rendered
 Search / filter                 Ranked by render time
 Highlight updates               Flame graph + bar chart views</pre>
</div>

<h3>The "fiber tree vs DOM" picture</h3>
<div class="diagram">
<pre>
 React fiber tree                       DOM tree
 ────────────────                       ────────
 &lt;App&gt;                                  &lt;div id="root"&gt;
   &lt;ThemeProvider&gt;                       &lt;header&gt;...&lt;/header&gt;
     &lt;Header&gt;                             &lt;main&gt;...&lt;/main&gt;
       &lt;Logo&gt;                             &lt;footer&gt;...&lt;/footer&gt;
     &lt;Main&gt;                            &lt;/div&gt;
       &lt;Feed&gt;
         &lt;Card x10&gt;
       &lt;Footer&gt;
   &lt;Modal portal&gt; (lives outside in DOM)

 React DevTools shows the fiber tree.
 Chrome DevTools shows the DOM tree.
 Different views of the same UI.</pre>
</div>

<h3>The "Profiler views" picture</h3>
<table>
  <thead><tr><th>View</th><th>Shows</th></tr></thead>
  <tbody>
    <tr><td>Flame graph</td><td>Per-commit hierarchy. Width = time. Color: yellow/red = slow.</td></tr>
    <tr><td>Ranked</td><td>Components sorted by render time. Quick "which is slowest."</td></tr>
    <tr><td>Component chart</td><td>Per-component bar across all commits. "How often does this re-render?"</td></tr>
    <tr><td>Interactions</td><td>Tagged interactions (deprecated; replaced by stacks).</td></tr>
  </tbody>
</table>

<h3>The "why did this render" reasons</h3>
<ul>
  <li>"This is the first time the component rendered" — initial mount.</li>
  <li>"Props changed: foo, bar" — parent passed new props.</li>
  <li>"Hooks changed (X)" — internal state via setState.</li>
  <li>"Parent component rendered" — even when own props/state didn't change (no memo).</li>
  <li>"Context changed" — a context value updated.</li>
</ul>
<p>Enable in Profiler settings → "Record why each component rendered."</p>

<h3>The "actual vs base time" picture</h3>
<ul>
  <li><strong>Actual time</strong>: time this commit actually spent on this component (including memo bailouts — bailouts are fast).</li>
  <li><strong>Base time</strong>: time it would have taken without memoization.</li>
</ul>
<p>Big gap = memoization is helping. Equal = no memoization or all of it busts.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"React DevTools Profiler is the same as Chrome's Performance panel." They're complementary. Chrome's Performance shows raw JS / layout / paint timings. React's Profiler shows per-component render data with React-specific attribution. Use both: Chrome for "is JS thread blocked," React for "which component is responsible."</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Install</h3>
<ul>
  <li><strong>Chrome / Edge</strong>: Chrome Web Store → "React Developer Tools."</li>
  <li><strong>Firefox</strong>: Firefox add-on store.</li>
  <li><strong>Safari</strong>: not supported as extension; use standalone.</li>
  <li><strong>Standalone</strong> (Electron, RN, Safari): <code>npm install -g react-devtools</code> + run <code>react-devtools</code>.</li>
</ul>

<h3>Components panel essentials</h3>
<ul>
  <li><strong>Tree view</strong> — collapsible component hierarchy.</li>
  <li><strong>Search</strong> (Cmd+F in panel) — filter by name. Click a result jumps to it.</li>
  <li><strong>Filter</strong> button — hide HOCs, memo wrappers, host elements.</li>
  <li><strong>Inspect element</strong> — pick mode (icon, top-left); click element on page to select its component.</li>
  <li><strong>Show in Elements panel</strong> — right-click → reveals corresponding DOM in Chrome's Elements.</li>
  <li><strong>Source</strong> — Settings → "show component source" links to the file.</li>
  <li><strong>Component owner / parent</strong> — distinct concepts; both shown in side panel.</li>
</ul>

<h3>Editing props / state / hooks</h3>
<pre><code>1. Select component in tree.
2. Right side panel shows props, state, hooks.
3. Click a value to edit.
4. Press Enter — component re-renders with new value.
// Useful for testing edge cases without code changes.</code></pre>

<h3>Hook names</h3>
<p>By default, hooks show as "State", "Effect", etc. — not great when component has 5 useState calls. <code>useDebugValue(x, format)</code> gives custom hooks display labels:</p>
<pre><code class="language-js">function useUser(id) {
  const user = ...;
  useDebugValue(user, u =&gt; u ? u.name : 'loading');
  return user;
}
// In React DevTools: "useUser: Ada"</code></pre>

<h3>Console reference</h3>
<pre><code class="language-js">// Select component in DevTools, then in console:
$r                        // selected component instance
$r.props                  // its props
$r.state                  // its state (class components)
$r.hooks                  // hooks (function components)
$r.memoizedState         // raw fiber state

// Useful: queryObjects
queryObjects(MyComponent) // all instances</code></pre>

<h3>Highlight updates</h3>
<p>Settings (gear icon) → "Highlight updates when components render". Each render flashes a colored border:</p>
<ul>
  <li>Blue: low frequency.</li>
  <li>Green/yellow: moderate.</li>
  <li>Red: high frequency (concerning).</li>
</ul>
<p>Visual sanity check: a button you didn't expect to flash means it's re-rendering needlessly.</p>

<h3>Profiler — recording</h3>
<pre><code>1. Profiler tab → Record (red dot).
2. Interact with the app (or reload to capture initial render).
3. Stop record.
4. Commits appear as bars at top — width = duration.
5. Click a commit; flame graph shows per-component render in that commit.
6. Toggle views: Flame graph, Ranked, Component chart.</code></pre>

<h3>Profiler settings</h3>
<ul>
  <li>"Record why each component rendered" — adds attribution; slight overhead but worth it.</li>
  <li>"Hide commits below X ms" — skip irrelevant commits.</li>
  <li>"Highlight components that triggered an update" — visual indicator.</li>
</ul>

<h3>Reading the flame graph</h3>
<pre><code>Each row: a tree level
Each cell: a component
Width: render time for that commit
Color: yellow → red = slower
Hover: tooltip with self time + total time + reason</code></pre>

<h3>Ranked view</h3>
<p>Sort components by render time within a single commit. Quickly spot "the most expensive component this commit." Click → see why.</p>

<h3>Component chart</h3>
<p>Pick one component → bar chart showing its render time across all commits. "How often does this re-render? How fast each time?" Useful for catching components that re-render way more often than expected.</p>

<h3>Filter by suspense</h3>
<p>Components panel → filter button → toggle Suspense. See which boundaries currently have suspended children. Useful when suspense isn't catching as expected.</p>

<h3>React Fast Refresh / HMR</h3>
<p>When code edits, React DevTools state is preserved across the refresh — so you don't lose your selection. Sometimes Fast Refresh fails (e.g., editing non-component file); full reload kicks in; selection is lost.</p>

<h3>Standalone for React Native</h3>
<pre><code class="language-bash">npm install -g react-devtools
react-devtools
# Opens an Electron app on port 8097
# In RN app: shake device → "Open React DevTools" or it auto-connects in dev mode</code></pre>

<h3>Profile a release / production build</h3>
<p>By default, production builds strip Profiler. To enable in production:</p>
<pre><code class="language-js">// vite.config.ts
export default {
  resolve: {
    alias: {
      'react-dom$': 'react-dom/profiling',
      'scheduler/tracing': 'scheduler/tracing-profiling',
    },
  },
};
// or in webpack: alias react-dom to react-dom/profiling

// Build a "profiling" build for staging only.
// Production users still get the regular smaller build.</code></pre>

<h3>Programmatic profiling — Profiler component</h3>
<pre><code class="language-jsx">import { Profiler } from 'react';
&lt;Profiler id="HomeFeed" onRender={(id, phase, actual, base) =&gt; {
  if (actual &gt; 16) sendBeacon('/rum/slow', JSON.stringify({ id, actual }));
}}&gt;
  &lt;HomeFeed /&gt;
&lt;/Profiler&gt;
// Per-render measurement, available in production.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — find a re-rendering child</h3>
<pre><code>1. Profiler → Record
2. Reproduce: type into a search input
3. Stop
4. Flame graph shows: every keystroke renders 50 components
5. Filter Component chart by &lt;Row&gt;: bar count per commit
6. "Why did this render?": Parent rendered (even though props identical)
7. Fix: wrap Row in React.memo + useCallback for handlers
8. Re-record: Row no longer renders</code></pre>

<h3>Example 2 — inspect props live</h3>
<pre><code>1. Components panel
2. Click on &lt;UserCard&gt;
3. Right pane shows: props.user = { id: 1, name: 'Ada', ... }
4. Click name value → edit to "Test"
5. Component re-renders with new name
// Quick check: does the component handle weird inputs?</code></pre>

<h3>Example 3 — find owner of a deep child</h3>
<pre><code>1. Components → click target
2. Right side: "Rendered by &lt;Provider&gt; → &lt;Layout&gt; → &lt;Page&gt; → &lt;UserCard&gt;"
3. Click &lt;Provider&gt; → jumps in tree
// Faster than reading the JSX yourself.</code></pre>

<h3>Example 4 — $r in console</h3>
<pre><code class="language-js">// Selected &lt;Form&gt; in Components panel
// In console:
$r.props
// { onSubmit: ƒ, defaultValues: {...} }
$r.props.onSubmit({ email: 'a@b.com' })
// Programmatically invoke the callback to test
queryObjects($r.constructor)
// All Form instances on the page</code></pre>

<h3>Example 5 — useDebugValue for a custom hook</h3>
<pre><code class="language-js">function useFetch(url) {
  const [state, setState] = useState({ status: 'loading', data: null });
  useDebugValue(\`\${state.status} \${url}\`);
  useEffect(() =&gt; { /* fetch */ }, [url]);
  return state;
}
// In React DevTools, the hook entry shows: "useFetch: loading /api/user"</code></pre>

<h3>Example 6 — measure a specific subtree</h3>
<pre><code class="language-jsx">&lt;Profiler id="Sidebar" onRender={(id, phase, actual) =&gt; {
  console.log(\`Sidebar \${phase}: \${actual.toFixed(1)}ms\`);
}}&gt;
  &lt;Sidebar /&gt;
&lt;/Profiler&gt;
// Console: Sidebar mount: 12.3ms / Sidebar update: 2.1ms</code></pre>

<h3>Example 7 — RN with standalone DevTools</h3>
<pre><code class="language-bash">npm install -g react-devtools
react-devtools
# Electron window opens

# In your RN app, in dev:
# Shake device → "Show React DevTools" or it connects automatically.</code></pre>

<h3>Example 8 — find context consumer</h3>
<pre><code>1. Components → search "Provider"
2. Select &lt;ThemeProvider&gt;
3. Right side shows: value = { theme: 'dark', setTheme: ƒ }
4. Edit value to "light" → all consumers re-render</code></pre>

<h3>Example 9 — highlight unexpected updates</h3>
<pre><code>1. Settings → toggle "Highlight updates"
2. Interact with app
3. Watch for components flashing colored borders
4. Red flash on a component you didn't touch → re-rendering needlessly
// Investigate why</code></pre>

<h3>Example 10 — production profiling build</h3>
<pre><code class="language-js">// vite.config.ts (separate config for staging)
export default {
  resolve: {
    alias: {
      'react-dom$': 'react-dom/profiling',
      'scheduler/tracing': 'scheduler/tracing-profiling',
    },
  },
};

// Deploy to staging-with-profiler subdomain
// Real-user-like data with profiling enabled
// Production users still get the regular faster build</code></pre>

<h3>Example 11 — compare commits</h3>
<pre><code>1. Profiler → record
2. Commit timeline at top: bars per commit
3. Click a slow commit → see flame graph
4. Right arrow / left arrow keys to navigate commits
5. "Show only commits with: in-progress &gt;X ms" filter</code></pre>

<h3>Example 12 — Component chart over time</h3>
<pre><code>1. Profiler → Record
2. Interact for a while
3. Stop
4. Switch to Component chart view
5. Search/select &lt;Row&gt;
6. Bar per commit showing render time
7. If bar count is high — over-rendering. If bar height — slow renders.</code></pre>

<h3>Example 13 — debug Suspense</h3>
<pre><code>1. Components → search "Suspense"
2. Select &lt;Suspense fallback={...}&gt;
3. Right pane shows: status = "Active" (currently rendering fallback)
4. Click on suspended children to see what's loading
// Helps debug "why is this still showing fallback?"</code></pre>

<h3>Example 14 — find unmemoized handlers</h3>
<pre><code>1. Profiler → Record
2. Trigger parent render
3. "Why did Row render?" → "Props changed: onPress"
4. Conclusion: onPress is a new function each render
5. Fix: wrap in useCallback in parent
6. Re-record: Row says "props identical → no render"</code></pre>

<h3>Example 15 — diff DOM and Component tree</h3>
<pre><code>1. Components → right-click target → "Find the corresponding DOM element"
2. Switches to Chrome's Elements with that node selected
3. Or: Elements → right-click → "Find the corresponding component"
// Bidirectional traversal between trees</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Profiler shows 0ms</h3>
<p>Means the commit took less than 1ms — typical for trivial updates. Not a bug.</p>

<h3>2. Production build doesn't show in Profiler</h3>
<p>By default, production strips profiler hooks. Either build with the profiling alias, or use the in-code <code>&lt;Profiler&gt;</code> component for explicit measurements.</p>

<h3>3. "Highlight updates" floods the screen</h3>
<p>Animated apps re-render constantly. Disable for animations; enable for state-driven UIs only.</p>

<h3>4. Component name shows as "Anonymous" or arrow function</h3>
<p>Functions without names show as anonymous. Use named function components: <code>function MyComponent() {}</code> instead of <code>() =&gt; {}</code>. Or <code>Component.displayName = 'MyComponent'</code>.</p>

<h3>5. HOCs add wrapper noise</h3>
<p>withRouter, connect, memo each add a wrapper component. Filter button → hide HOCs. Or set displayName on each HOC: <code>WithRouter.displayName = 'withRouter(Component)'</code>.</p>

<h3>6. Hooks list confusing</h3>
<p>Multiple useState / useEffect calls; only generic names shown. Use useDebugValue for custom hooks; for built-in hooks, name your state variables clearly.</p>

<h3>7. Standalone DevTools won't connect</h3>
<p>Standalone listens on port 8097. RN app must connect to your machine. Set <code>localhost</code> ip override; check firewall; use <code>react-devtools-core</code> in code if needed.</p>

<h3>8. React DevTools missing in production</h3>
<p>By default, React DevTools detects React in dev mode only. For production, you need to expose <code>__REACT_DEVTOOLS_GLOBAL_HOOK__</code>. Tradeoff: slight bundle size and security exposure. Most teams: profile in dev or staging only.</p>

<h3>9. Component re-renders but props look identical</h3>
<p>"Why did this render?" says "props changed: foo". But foo looks the same. Likely: foo is a new object reference (function, array, object literal in render). Use referential equality, not deep equality.</p>

<h3>10. State editing doesn't update</h3>
<p>Editing useState value sometimes doesn't propagate. Likely: component's render is cached via memo and dependencies didn't change. Force re-render via parent.</p>

<h3>11. <code>$r</code> stale after re-render</h3>
<p><code>$r</code> in console is bound to a fiber. After commits, it may point to old data. Re-select in DevTools to refresh.</p>

<h3>12. Profiler hides commits</h3>
<p>"Hide commits below X ms" filter is enabled. Loosen the threshold or disable.</p>

<h3>13. Profiler is slow on huge trees</h3>
<p>Recording every commit + per-component metadata is expensive on 10K+ fibers. Profile a smaller scenario; reduce active components; profile in stages.</p>

<h3>14. Concurrent rendering / Suspense show "render in progress"</h3>
<p>React 18 + concurrent + Suspense produces "in-progress" commits that don't display the same way. Update React DevTools to recent version for better support.</p>

<h3>15. RN debugging via Hermes</h3>
<p>Hermes is the default JS engine in RN. React DevTools connects via the Hermes inspector. New React Native DevTools (2024+) integrates this directly.</p>

<h3>16. Profiler shows commits but no flamegraph</h3>
<p>Likely: "Record why each component rendered" is off, but you're filtering for components-with-attribution. Toggle setting and re-record.</p>

<h3>17. Cannot edit props</h3>
<p>Props are read-only by default; editing doesn't propagate to source. The displayed component re-renders with the override but the parent will overwrite on next render. Useful for one-off testing only.</p>

<h3>18. Browser extension lags on huge apps</h3>
<p>10K+ component trees can hang DevTools. Filter the tree, profile smaller subtrees, or use the standalone app for more memory.</p>

<h3>19. Production build profiler crashes</h3>
<p>Profiler uses scheduler/tracing-profiling. If aliased incorrectly, runtime errors. Only alias when actually needed; revert for prod.</p>

<h3>20. Source linking broken</h3>
<p>Settings → "Show source line" requires source maps. Without them, source links don't work. Configure bundler to emit dev source maps.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — only Chrome DevTools, no React DevTools</h3>
<p>Half the picture. React DevTools answers component-level questions Chrome can't.</p>

<h3>Anti-pattern 2 — never enabling "Why did this render"</h3>
<p>Saves a few CPU cycles in profiling but defeats the main perf insight. Always on while profiling.</p>

<h3>Anti-pattern 3 — anonymous arrow components</h3>
<p>Show as "Anonymous" everywhere. Use named functions or set displayName.</p>

<h3>Anti-pattern 4 — testing memoization without Profiler</h3>
<p>Adding React.memo without measuring. Profile before AND after to verify the change helped.</p>

<h3>Anti-pattern 5 — debugging in dev only</h3>
<p>Dev re-renders differently (StrictMode). Profile a production build with profiling alias for accurate numbers.</p>

<h3>Anti-pattern 6 — ignoring "Highlight updates"</h3>
<p>Visual signal of unexpected re-renders. Worth keeping on briefly during dev.</p>

<h3>Anti-pattern 7 — hand-coding profiling</h3>
<p>Custom timing wrappers around components. The Profiler API does this better; the panel visualizes it.</p>

<h3>Anti-pattern 8 — never using $r</h3>
<p>Selecting a component then jumping to console with <code>$r</code> is a power workflow. Most devs don't know about it.</p>

<h3>Anti-pattern 9 — useDebugValue ignored</h3>
<p>Custom hooks display as "Custom Hook" with no info. <code>useDebugValue</code> labels them. 1-line addition, big DX improvement.</p>

<h3>Anti-pattern 10 — profiling everything</h3>
<p>Recording from page load through 30 minutes of interaction → useless data dump. Profile specific scenarios (slow click, list render, route transition).</p>

<h3>Anti-pattern 11 — ignoring HOC display names</h3>
<p>withFoo(withBar(MyComponent)) shows as 3 wrappers with confusing names. Set displayName on HOC outputs.</p>

<h3>Anti-pattern 12 — not filtering noise</h3>
<p>Tree filled with React.Fragment, React.memo, Suspense wrappers. Filter button → hide them when irrelevant.</p>

<h3>Anti-pattern 13 — Profiler in production for all users</h3>
<p>Profiling alias adds bundle size + slight overhead. Use only in staging or specific debug builds.</p>

<h3>Anti-pattern 14 — assuming initial render is the slow part</h3>
<p>Often it's update renders. Profile interactions, not just mount.</p>

<h3>Anti-pattern 15 — not pairing with Chrome Performance</h3>
<p>React Profiler tells you which component; Chrome Performance tells you what JS function inside it. Use together.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you find why a component re-renders too often?</div>
  <div class="qa-answer">
    <ol>
      <li>React DevTools Profiler → enable "Record why each component rendered."</li>
      <li>Record an interaction.</li>
      <li>Find the over-rendering component (Component chart shows many bars).</li>
      <li>Inspect the reason — usually "Props changed" or "Parent rendered."</li>
      <li>If "Props changed: onClick" — parent recreates onClick each render. Wrap in useCallback.</li>
      <li>If "Parent rendered" — wrap in React.memo (with stable props).</li>
      <li>If "Hooks changed" — internal state update; check why state changes that frequently.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What's <code>$r</code>?</div>
  <div class="qa-answer">
    <p>In the browser console, <code>$r</code> is a reference to the currently-selected React component instance. Equivalent to Chrome DevTools' <code>$0</code> but for React fibers. Useful for invoking handlers, inspecting props/state from JS:</p>
<pre><code class="language-js">$r.props.onSubmit({ test: 1 });
queryObjects($r.constructor);     // find all instances</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Difference between React Profiler and Chrome Performance?</div>
  <div class="qa-answer">
    <p><strong>Chrome Performance</strong>: low-level main thread tracing. Shows JS calls, layout, paint, frame rates. Doesn't know about React.</p>
    <p><strong>React Profiler</strong>: per-component render times, attribution (why did this render), filtered by React internals. Doesn't show layout/paint or non-React JS work.</p>
    <p>Use together: React Profiler to find the slow component, Chrome Performance to find what JS in that component is slow.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. When would you use the in-code <code>&lt;Profiler&gt;</code> component?</div>
  <div class="qa-answer">
    <p>For programmatic measurement in production. The DevTools Profiler is dev-only. The <code>&lt;Profiler id="X" onRender={...}&gt;</code> component fires a callback per render with timing data — works in production builds. Send to RUM for real-user perf data on specific subtrees.</p>
<pre><code class="language-jsx">&lt;Profiler id="Feed" onRender={(_, phase, actual) =&gt; {
  if (actual &gt; 16) rum.report('slow_feed', { phase, actual });
}}&gt;
  &lt;Feed /&gt;
&lt;/Profiler&gt;</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Walk through diagnosing a slow form.</div>
  <div class="qa-answer">
    <ol>
      <li>React Profiler → record while typing in the form.</li>
      <li>Stop. Look at commit list — many commits per keystroke?</li>
      <li>Click slowest commit. Flame graph shows which components rendered.</li>
      <li>If parent + many children render: state lifted too high. Consider component-local state.</li>
      <li>If field-level re-renders are slow: virtualize or memoize fields.</li>
      <li>Switch to React Hook Form (uncontrolled inputs) — only the changed field re-renders.</li>
      <li>Re-profile to verify.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you display custom names for hooks?</div>
  <div class="qa-answer">
<pre><code class="language-js">function useUser(id) {
  const user = ...;
  useDebugValue(user, u =&gt; u?.name ?? 'loading');
  return user;
}
// In React DevTools: "useUser: Ada"</code></pre>
    <p>The second arg is a formatter (only called when DevTools is open — can be expensive without performance hit in prod).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you test edge case props?</div>
  <div class="qa-answer">
    <p>React DevTools Components panel: select component, edit prop value inline, component re-renders. Test:</p>
    <ul>
      <li>Empty arrays, null, undefined.</li>
      <li>Very long strings.</li>
      <li>Negative numbers, zero, NaN.</li>
      <li>Unicode characters, emojis.</li>
    </ul>
    <p>Without writing code or restarting.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Profiler shows a 50ms render — too slow. What next?</div>
  <div class="qa-answer">
    <ol>
      <li>Click the commit; flame graph shows where the 50ms went.</li>
      <li>Identify the slowest component (widest in flamegraph).</li>
      <li>Click it; see "self time" vs "total time."</li>
      <li>If self time is high: that component itself is slow. Profile its JS in Chrome to see what code.</li>
      <li>If total time is high but self is low: a child is slow.</li>
      <li>Mitigations: virtualize lists, memoize expensive subtrees, defer with startTransition.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you debug context propagation?</div>
  <div class="qa-answer">
    <p>Components panel → search for the Provider (e.g., <code>ThemeContext.Provider</code>). Select it; right pane shows current value. Edit live to see consumers re-render. Filter the tree by Provider name to find boundary issues. Combine with Profiler to see which consumers re-render on context change.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Standalone vs extension React DevTools — when to use which?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Browser extension</strong>: web apps in Chrome / Firefox / Edge. Easiest setup.</li>
      <li><strong>Standalone</strong> (Electron app): React Native, Electron apps, Safari, server-side rendering inspection. <code>npm install -g react-devtools</code>.</li>
    </ul>
    <p>Same UI; same features. The browser extension is "attached"; standalone connects via WebSocket.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What does "Highlight updates" reveal?</div>
  <div class="qa-answer">
    <p>Each render flashes a colored border on the component. Gives a visual sense of update frequency. Common findings:</p>
    <ul>
      <li>Component flashes red constantly — re-rendering every frame, often.</li>
      <li>Static UI flashes on unrelated state change — over-broad re-render scope.</li>
      <li>Memoized component flashes — memoization broken.</li>
    </ul>
    <p>Quick visual sanity check; turn off when not actively debugging.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Editing props in DevTools doesn't persist — why?</div>
  <div class="qa-answer">
    <p>Editing props overrides the displayed value but doesn't change the source. On next render, parent passes original props again. Useful for one-off testing of how the component handles edge cases — not for permanent changes (those go in code).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you profile production?</div>
  <div class="qa-answer">
    <p>Two ways:</p>
    <ul>
      <li><strong>Profiling build</strong>: alias <code>react-dom</code> to <code>react-dom/profiling</code> in your bundler config. Build a separate "staging-with-profiler" deployment; use React DevTools Profiler against it.</li>
      <li><strong>Profiler component</strong>: wrap parts of your tree in <code>&lt;Profiler id="..." onRender={...}&gt;</code>. Works in regular production. Send to RUM.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What's actual time vs base time in Profiler?</div>
  <div class="qa-answer">
    <p><strong>Actual time</strong>: how long this commit actually spent on this component. Includes memoization bailouts (which are fast).</p>
    <p><strong>Base time</strong>: how long it would have taken without any memoization.</p>
    <p>Big gap = memoization is helping. Equal numbers = no memoization or all of it busted (e.g., new prop reference each render).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. The Profiler shows your fix worked. But INP regressed in production RUM. What happened?</div>
  <div class="qa-answer">
    <p>Possible reasons:</p>
    <ul>
      <li>Dev mode renders differently (StrictMode double-renders).</li>
      <li>Prod build has different optimizations applied; Profiler was on dev.</li>
      <li>RUM measures real user devices (mostly slow Android); your test was on a fast Mac.</li>
      <li>Network conditions differ.</li>
      <li>The fix optimized one path; another path regressed.</li>
    </ul>
    <p>Mitigations: profile a profiling-build deployed to staging; throttle CPU + network to mid-range mobile; instrument with <code>&lt;Profiler&gt;</code> for production data; correlate with RUM.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You use Profiler with "Why did this render?" enabled.</li>
    <li>You use <code>$r</code> in console.</li>
    <li>You use Component chart for "how often does this render?"</li>
    <li>You use <code>useDebugValue</code> for custom hooks.</li>
    <li>You name function components for clear DevTools output.</li>
    <li>You set displayName on HOCs.</li>
    <li>You use the in-code <code>&lt;Profiler&gt;</code> for production measurement.</li>
    <li>You profile production builds (with profiling alias) for accurate numbers.</li>
    <li>You pair React DevTools with Chrome Performance for deeper analysis.</li>
  </ul>
</div>
`}

]
});
