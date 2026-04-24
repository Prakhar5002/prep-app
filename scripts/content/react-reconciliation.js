window.PREP_SITE.registerTopic({
  id: 'react-reconciliation',
  module: 'React Deep',
  title: 'Reconciliation & Fiber',
  estimatedReadTime: '35 min',
  tags: ['react', 'reconciliation', 'fiber', 'virtual-dom', 'rendering', 'diffing', 'keys', 'commit-phase'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>When React re-renders, it doesn't replace the DOM. It builds a new <strong>tree of element descriptors</strong> (React Elements), compares it to the previous tree, and produces a list of <em>minimal DOM operations</em> to apply. That process is called <strong>reconciliation</strong>.</p>
<ul>
  <li><strong>React Elements</strong> are plain objects (<code>{ type, props, key, ref }</code>) returned by components and JSX. They are cheap to create and throw away.</li>
  <li><strong>Fiber</strong> is React's internal representation — a linked-list tree of work units, one node per Element. Each Fiber has pointers to parent / child / sibling and fields for hooks, effects, state, and scheduling metadata.</li>
  <li>Rendering happens in two phases: <strong>Render</strong> (build the new fiber tree, can be paused/cancelled, pure) and <strong>Commit</strong> (apply DOM mutations and effects, synchronous, one-shot).</li>
  <li>The <strong>diffing algorithm</strong> is O(n) by making two assumptions: (1) elements of different types produce different trees; (2) sibling elements are matched by <code>key</code>, with stable identity across renders.</li>
  <li><strong>Keys</strong> matter most for lists. Wrong keys cause reused state on the wrong item, or wasted re-creation.</li>
  <li>Fiber (React 16+) enables <strong>concurrent features</strong>: rendering can be sliced across frames, low-priority work can yield to high-priority updates, and error boundaries can contain failures.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>React Elements are the diff target; Fiber is the scheduler's work unit. Same type + same key = same fiber, state preserved. Different type OR different key = destroy and re-create.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What reconciliation actually is</h3>
<p>React's job is to keep the DOM in sync with a descriptor of what the UI should look like. Each render, your components return <strong>React Elements</strong> — plain immutable objects describing the tree. React compares the new tree to the previous one (the <em>work-in-progress fiber tree</em> vs the <em>current</em> one) and computes the minimum set of DOM mutations to turn current into new. That comparison is reconciliation.</p>

<h3>Why not just replace the DOM?</h3>
<p>Two reasons: (1) DOM mutations are expensive — layout, paint, composite, and accessibility tree updates all trigger. (2) Wholesale replacement would destroy user state that lives in the DOM: focus, scroll position, text selection, input values, animations in progress. Reconciliation preserves element identity wherever the descriptor says the element is "the same."</p>

<h3>What a React Element is</h3>
<pre><code class="language-js">// &lt;Button color="red"&gt;Hi&lt;/Button&gt; compiles to:
{
  $$typeof: Symbol.for('react.element'),
  type: Button,          // function or string tag
  key: null,
  ref: null,
  props: { color: 'red', children: 'Hi' }
}</code></pre>
<p>Plain object. Created on every render. Cheap to allocate, cheap to compare by shallow equality. <em>Not</em> a DOM node.</p>

<h3>Why Fiber exists (history)</h3>
<p>Before Fiber (React ≤ 15), reconciliation was recursive. Once it started, the call stack ran until the tree was fully diffed and the DOM was updated. A heavy render could block the main thread for 100+ ms — janky animations and dropped input. You couldn't pause, cancel, or prioritize work.</p>
<p>React 16 rewrote reconciliation on top of Fiber — a linked-list-based tree walkable in chunks. Each Fiber node represents one unit of work. The reconciler walks with pointers, pausing when the browser needs the main thread, resuming later. That unlocked concurrent rendering, Suspense, time-slicing, and error boundaries.</p>

<h3>What a Fiber node is</h3>
<pre><code class="language-js">{
  type: Button,        // same as Element.type
  key: null,
  stateNode: DOMNode,  // instance (class) or DOM node or null (function)
  return: parentFiber, // the parent
  child: firstChildFiber,
  sibling: nextSiblingFiber,
  alternate: otherFiber, // paired work-in-progress or current fiber
  flags: 0b00101,      // side-effect bitmask (Placement, Update, Deletion, ...)
  lanes: 0b010000,     // priority lanes for this update
  memoizedState: hooksList,   // linked list of hooks
  memoizedProps: { ... },     // props at last commit
  pendingProps: { ... },      // props for this work
  ...
}</code></pre>
<p>Two trees exist at once: <strong>current</strong> (what's on screen) and <strong>work-in-progress</strong> (what's being built). Each fiber has an <code>alternate</code> pointer to its twin. When the new tree is ready, React "commits" by making work-in-progress the new current (pointer swap — <em>double buffering</em>).</p>

<h3>Why two phases: Render and Commit?</h3>
<ul>
  <li><strong>Render phase</strong> is pure and interruptible. React can call your component, then throw away the result without touching the DOM. This is what makes time-slicing safe. Side effects here break things; that's why render must be pure.</li>
  <li><strong>Commit phase</strong> is synchronous and atomic — once started, it runs to completion. React batches all DOM mutations, then runs layout effects, then paints, then runs passive effects. The browser sees one consistent update, not intermediate states.</li>
</ul>
<p>Knowing this split explains almost every rule: <em>don't</em> mutate DOM or call <code>setState</code> during render; <em>do</em> it in <code>useEffect</code>/<code>useLayoutEffect</code>.</p>

<h3>Why keys matter</h3>
<p>Diffing child lists is the hardest case. Without keys, React matches siblings by <em>position</em>. Insert an item at index 0 and every subsequent item is mismatched — React thinks item 1 is now item 2, tries to update it in place, and drags state along with it (e.g., input values). With keys, React matches by identity, so inserting at the top just creates one new fiber and shifts the rest. Keys are a <em>hint to the diffing algorithm</em>, not a React-internal ID.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "two-pass tree walker" picture</h3>
<div class="diagram">
<pre>
  Render phase (pure, interruptible):
    for each fiber in new tree:
       call component  → get new Element
       diff vs current Element
       flag fiber with Placement / Update / Deletion

  Commit phase (atomic, sync):
    walk fibers with flags:
      apply DOM mutations
      run cDM / cDU / refs
      run useLayoutEffect synchronously
    yield; browser paints
    then: run useEffect (passive) after paint
</pre>
</div>

<h3>The "double buffering" picture</h3>
<div class="diagram">
<pre>
       current tree  ◄── what's on screen
                    ╲
                     ╲  alternate pointer
                      ╲
                       work-in-progress tree  ◄── being built
                            │
                      (committed)
                            ▼
                       new current tree
</pre>
</div>
<p>React never mutates the current tree while building the new one. The WIP tree is a fresh linked list (with fibers often recycled via the <code>alternate</code> pair, but logically separate). Swap pointers atomically at commit time.</p>

<h3>The "Elements vs Fibers" picture</h3>
<table>
  <thead><tr><th/><th>React Element</th><th>Fiber</th></tr></thead>
  <tbody>
    <tr><td>Lifetime</td><td>One render</td><td>Spans renders</td></tr>
    <tr><td>Created by</td><td>JSX / <code>React.createElement</code></td><td>React internals</td></tr>
    <tr><td>Content</td><td>type, props, key, ref</td><td>Element info + links + hooks + flags + lanes</td></tr>
    <tr><td>Mutability</td><td>Immutable</td><td>Mutated during render (WIP only)</td></tr>
    <tr><td>Allocation</td><td>Many — one per render per node</td><td>One per mounted node, recycled</td></tr>
  </tbody>
</table>

<h3>The "diff in O(n)" picture</h3>
<p>Left tree → right tree diff is NP-hard in general. React makes two heuristics that reduce it to O(n):</p>
<ol>
  <li><strong>Different types → different trees.</strong> A <code>&lt;div&gt;</code> swapped with a <code>&lt;section&gt;</code> causes the entire subtree to be destroyed and rebuilt — no attempt at deep matching.</li>
  <li><strong>Stable keys identify siblings.</strong> For lists of children at the same level, React uses the <code>key</code> prop to match old and new children by identity. Without keys, positional matching is the fallback (and is usually wrong when the list changes).</li>
</ol>

<h3>The "state lives on the fiber" picture</h3>
<p>When you call <code>useState</code> inside a function component, the hook record is stored in the <em>fiber</em> for that component — not inside a closure, not inside React's global state. That's why reconciliation preserves state across renders: the same fiber still has its hook list. Destroy the fiber (wrong key, type change) → state is gone.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Re-rendering means React re-creates DOM nodes." No. Re-rendering means React calls your function again and diffs the result. DOM nodes are reused wherever possible. If children produce the exact same Element structure, React applies zero DOM mutations.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Stages of a single render</h3>
<ol>
  <li><strong>Scheduler schedules work</strong> on a lane. Lanes encode priority: SyncLane, InputContinuousLane, DefaultLane, TransitionLane, IdleLane.</li>
  <li><strong>Begin phase</strong> walks down the tree (depth-first). For each Fiber: call the component (function components run here), create/reuse child fibers, diff Elements against <code>memoizedProps</code>, attach flags.</li>
  <li><strong>Complete phase</strong> walks up. Each finished fiber runs <code>completeWork</code> — creates DOM instances (for host components), attaches child DOM into parent, and bubbles side-effect flags up to the root.</li>
  <li><strong>Commit</strong> the flagged tree: <code>before mutation</code> (snapshots), <code>mutation</code> (DOM inserts/updates/deletes), <code>layout</code> (<code>useLayoutEffect</code>, refs, cDM/cDU). Browser paints. Then <code>passive</code> (<code>useEffect</code>) runs.</li>
</ol>

<h3>The diffing algorithm — three cases</h3>
<h4>Case 1: same type at same position → update in place</h4>
<pre><code class="language-js">// Before: &lt;div className="a"/&gt;
// After : &lt;div className="b"/&gt;
// Action: keep DOM node, diff props, apply className change</code></pre>

<h4>Case 2: different type at same position → destroy + create</h4>
<pre><code class="language-js">// Before: &lt;div&gt;&lt;Child/&gt;&lt;/div&gt;
// After : &lt;section&gt;&lt;Child/&gt;&lt;/section&gt;
// Action: unmount entire div subtree (including &lt;Child/&gt;), mount new section subtree.
// Child remounts — state reset, refs reattached.</code></pre>

<h4>Case 3: list of siblings → match by key</h4>
<pre><code class="language-js">// Before: [&lt;Item key="a"/&gt;, &lt;Item key="b"/&gt;, &lt;Item key="c"/&gt;]
// After : [&lt;Item key="c"/&gt;, &lt;Item key="a"/&gt;, &lt;Item key="b"/&gt;]
// Action: reuse all three fibers (matched by key), reorder DOM nodes,
//         preserve each item's state.</code></pre>

<h3>How children diffing works internally</h3>
<p>For a list of children, React does a linear scan:</p>
<ol>
  <li>Walk old and new lists in order while keys match — update in place.</li>
  <li>On first mismatch, build a <code>Map&lt;key, oldFiber&gt;</code> from remaining old children.</li>
  <li>For each remaining new child, look up the map by key. Hit → reuse + flag as move. Miss → create new.</li>
  <li>Any leftover map entries → delete those fibers.</li>
</ol>
<p>Complexity: O(n + m) where n, m are old and new sibling counts. This is why React doesn't use LCS — good-enough heuristics beat optimal algorithms when the input is almost always stable.</p>

<h3>The flags bitmask</h3>
<p>Every fiber has a <code>flags</code> integer. Relevant bits include:</p>
<ul>
  <li><code>Placement</code> — fiber is being inserted (new fiber, or moved).</li>
  <li><code>Update</code> — fiber's props/state changed; apply DOM update.</li>
  <li><code>Deletion</code> — fiber should be removed.</li>
  <li><code>Passive</code> / <code>Layout</code> — schedule effect callbacks.</li>
  <li><code>Ref</code> — reattach ref in commit.</li>
  <li><code>Hydrating</code>, <code>Snapshot</code>, etc. — hydration + getSnapshotBeforeUpdate.</li>
</ul>
<p>The commit phase walks the tree looking at flags and applies matching work in the right sub-phase.</p>

<h3>Lanes — priority model</h3>
<p>React 18 replaced the old expirationTime with <strong>lanes</strong>, a 31-bit bitmask where each bit is a priority tier. Common lanes:</p>
<ul>
  <li><code>SyncLane</code> — legacy sync updates and urgent input.</li>
  <li><code>InputContinuousLane</code> — continuous input (scroll, drag).</li>
  <li><code>DefaultLane</code> — regular updates (<code>setState</code> in event handler).</li>
  <li><code>TransitionLane</code> — <code>startTransition</code>, marked as interruptible.</li>
  <li><code>IdleLane</code> — lowest priority, runs when nothing else is pending.</li>
</ul>
<p>When you call <code>setState</code>, it assigns a lane based on the current scheduler priority and queues work. The scheduler picks the highest-priority non-empty lane and renders it. A high-priority update can preempt a low-priority render in progress.</p>

<h3>Batching</h3>
<p>Multiple <code>setState</code> calls in the same tick are batched into one render. In React 18, this is <em>automatic batching</em> — it applies even inside promises, setTimeouts, and native event handlers (pre-18, only React-synthetic event handlers batched). Effect: <code>setA(); setB(); setC();</code> causes one render, with all three values.</p>

<h3>What triggers a re-render</h3>
<ul>
  <li><code>setState</code> (useState/useReducer) — schedules a re-render of that fiber and walks down its subtree.</li>
  <li>Parent re-renders — children re-render by default (unless memoized).</li>
  <li>Context value change — every consumer of that context in the subtree re-renders.</li>
  <li><code>forceUpdate</code> — class component API.</li>
</ul>

<h3>Bailouts and memoization</h3>
<ul>
  <li>If <code>setState(x)</code> is called with the <em>same</em> value (<code>Object.is</code> comparison), React bails out before re-rendering that fiber.</li>
  <li><code>React.memo(Component)</code> does a shallow props comparison; if props didn't change, the component is skipped entirely.</li>
  <li><code>useMemo</code> / <code>useCallback</code> stabilize values passed as props, which helps the above.</li>
  <li>A parent re-rendering does NOT re-run a memoized child if props are equal — the child's fiber is reused without calling the function.</li>
</ul>

<h3>Commit phase subphases</h3>
<ol>
  <li><strong>Before mutation</strong> — <code>getSnapshotBeforeUpdate</code> runs (class only).</li>
  <li><strong>Mutation</strong> — insert / update / delete DOM nodes, update refs from old to new.</li>
  <li><strong>Layout</strong> — run <code>useLayoutEffect</code>, <code>componentDidMount</code>, <code>componentDidUpdate</code>. Browser has <em>not</em> painted yet; this is the last chance to read layout and synchronously re-mutate before pixels flash.</li>
  <li>Browser paint (if allowed).</li>
  <li><strong>Passive</strong> — <code>useEffect</code> runs after paint, asynchronously.</li>
</ol>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — Element vs Fiber</h3>
<pre><code class="language-js">// JSX
const el = &lt;Button color="red"&gt;Hi&lt;/Button&gt;;
// Element (plain object):
console.log(el.type === Button); // true
console.log(el.props);           // { color: 'red', children: 'Hi' }
// This is what your component returns. React turns it into a fiber.</code></pre>

<h3>Example 2 — same type, update in place</h3>
<pre><code class="language-js">function App({ color }) {
  return &lt;div style={{ background: color }}&gt;hello&lt;/div&gt;;
}
// color 'red' → 'blue': same div, React applies one style update, no re-create.</code></pre>

<h3>Example 3 — different type, destroy and rebuild</h3>
<pre><code class="language-js">function Toggle({ open }) {
  return open ? &lt;section&gt;&lt;Input/&gt;&lt;/section&gt; : &lt;div&gt;&lt;Input/&gt;&lt;/div&gt;;
}
// Toggling 'open' swaps section ↔ div at the same position. React tears down
// the whole subtree and rebuilds. &lt;Input/&gt; REMOUNTS — its state is lost.</code></pre>

<h3>Example 4 — keys preserve state</h3>
<pre><code class="language-js">function List({ items }) {
  return items.map(item =&gt; &lt;Row key={item.id} item={item}/&gt;);
}
// Insert an item at the front:
// Without key: positional match → every row shifts, inputs keep previous values incorrectly.
// With key:    matched by id   → one new Row created, all existing Rows preserve state.</code></pre>

<h3>Example 5 — wrong key as index</h3>
<pre><code class="language-js">// BAD when list can reorder
items.map((item, i) =&gt; &lt;Row key={i} item={item}/&gt;);
// After reordering [a, b, c] → [c, a, b]:
// Row with key=0 now has item=c, but its fiber (with its state) was the old a.
// State bleeds across items.</code></pre>

<h3>Example 6 — React.memo skipping re-renders</h3>
<pre><code class="language-js">const Child = React.memo(function Child({ value }) {
  console.log('render Child');
  return &lt;span&gt;{value}&lt;/span&gt;;
});
function Parent() {
  const [n, setN] = useState(0);
  return (&lt;&gt;
    &lt;button onClick={() =&gt; setN(n + 1)}&gt;{n}&lt;/button&gt;
    &lt;Child value="static" /&gt;
  &lt;/&gt;);
}
// Clicking the button re-renders Parent but not Child (props unchanged).</code></pre>

<h3>Example 7 — new object prop breaks memo</h3>
<pre><code class="language-js">function Parent() {
  const [n, setN] = useState(0);
  return &lt;Child options={{ debug: true }} /&gt;;
  // A new options object every render → memo sees unequal shallow props → renders.
}
// Fix: useMemo the options:
const options = useMemo(() =&gt; ({ debug: true }), []);</code></pre>

<h3>Example 8 — preserving focus across re-renders</h3>
<pre><code class="language-js">function Form({ showExtras }) {
  return (&lt;form&gt;
    &lt;input name="email" /&gt;
    {showExtras &amp;&amp; &lt;div&gt;extras&lt;/div&gt;}
  &lt;/form&gt;);
}
// Toggling showExtras adds/removes the div AFTER the input. Input stays mounted,
// focus and value preserved. If the div were BEFORE the input:
// ...  the input's DOM node moves. Focus is preserved if React sees same fiber.</code></pre>

<h3>Example 9 — the "key as a remount trigger" pattern</h3>
<pre><code class="language-js">// Force a child to fully reset when some external prop changes:
&lt;Form key={userId} user={user} /&gt;
// Changing userId swaps the key → new fiber, fresh state, effects re-run.
// Common pattern for reusable edit forms keyed to the entity id.</code></pre>

<h3>Example 10 — reordering a list stably</h3>
<pre><code class="language-js">const sorted = useMemo(() =&gt; items.slice().sort(byDate), [items]);
return sorted.map(i =&gt; &lt;Row key={i.id} item={i}/&gt;);
// Keys = stable ids. Reorder only moves DOM, no remount, no state loss.</code></pre>

<h3>Example 11 — state update during render crashes</h3>
<pre><code class="language-js">function Bad() {
  const [n, setN] = useState(0);
  setN(n + 1); // ERROR: Too many re-renders
  return n;
}
// Setting state synchronously during render causes an infinite re-render loop.
// React detects and throws. State updates belong in event handlers or effects.</code></pre>

<h3>Example 12 — deriving state (no effect needed)</h3>
<pre><code class="language-js">// BAD
function List({ items }) {
  const [sorted, setSorted] = useState([]);
  useEffect(() =&gt; setSorted(items.sort(byDate)), [items]);
  return sorted.map(...);
}
// GOOD — compute during render; no extra render + no stale sync
function List({ items }) {
  const sorted = useMemo(() =&gt; items.slice().sort(byDate), [items]);
  return sorted.map(...);
}</code></pre>

<h3>Example 13 — useLayoutEffect vs useEffect ordering</h3>
<pre><code class="language-js">function Box() {
  const ref = useRef();
  useLayoutEffect(() =&gt; {
    // Runs SYNCHRONOUSLY after DOM mutation, before browser paint.
    const rect = ref.current.getBoundingClientRect();
    if (rect.width &lt; 100) ref.current.style.width = '100px';
  }, []);
  return &lt;div ref={ref}/&gt;;
}
// useEffect would run after paint → user sees a flash of wrong width.
// useLayoutEffect blocks paint until your sync work is done.</code></pre>

<h3>Example 14 — parent re-render doesn't always re-render children</h3>
<pre><code class="language-js">function Parent({ x }) {
  const [c, setC] = useState(0);
  return (&lt;&gt;
    &lt;button onClick={() =&gt; setC(c + 1)}&gt;{c}&lt;/button&gt;
    &lt;Static/&gt;
  &lt;/&gt;);
}
const Static = React.memo(() =&gt; {
  console.log('Static render');
  return &lt;div&gt;static&lt;/div&gt;;
});
// Clicking button → Parent re-renders, Static does NOT (memoized, no props).</code></pre>

<h3>Example 15 — context invalidates all consumers</h3>
<pre><code class="language-js">const T = createContext();
function Provider({ children }) {
  const [theme, setTheme] = useState('dark');
  return &lt;T.Provider value={theme}&gt;{children}&lt;/T.Provider&gt;;
}
function Deep() {
  const t = useContext(T);
  return &lt;div&gt;{t}&lt;/div&gt;;
}
// Every useContext(T) subscriber re-renders on value change.
// That includes distant components; consider splitting contexts by update cadence.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Hidden remount via different parent type</h3>
<pre><code class="language-js">{open ? &lt;Wrap1&gt;&lt;Child/&gt;&lt;/Wrap1&gt; : &lt;Wrap2&gt;&lt;Child/&gt;&lt;/Wrap2&gt;}</code></pre>
<p><code>Child</code> looks like it's stable, but its parent type differs in the two branches, so React treats the subtree as different. Child's fiber is destroyed and re-created — state reset. Fix: unify the wrapper and change its props, or pass the child prop through.</p>

<h3>2. Array vs fragment</h3>
<pre><code class="language-js">// These are different:
return [&lt;A key="1"/&gt;, &lt;B key="2"/&gt;];
return &lt;&gt;&lt;A/&gt;&lt;B/&gt;&lt;/&gt;;</code></pre>
<p>Arrays require keys. Fragments don't (the children are at a known position in the parent). If you return an array, missing keys warn.</p>

<h3>3. Conditional rendering without a stable slot</h3>
<pre><code class="language-js">{condition &amp;&amp; &lt;Heavy/&gt;}
&lt;Other/&gt;</code></pre>
<p>When <code>condition</code> toggles, <code>Heavy</code>'s slot appears/disappears. <code>Other</code>'s fiber slot stays the same, so its state is preserved. No wrapping needed.</p>

<h3>4. Keys on Fragment</h3>
<pre><code class="language-js">items.map(i =&gt; (
  &lt;React.Fragment key={i.id}&gt;
    &lt;dt&gt;{i.title}&lt;/dt&gt;
    &lt;dd&gt;{i.body}&lt;/dd&gt;
  &lt;/React.Fragment&gt;
))</code></pre>
<p>Short syntax <code>&lt;&gt;&lt;/&gt;</code> can't take a key. Use <code>&lt;React.Fragment key={...}&gt;</code>.</p>

<h3>5. <code>ref</code> changes — when and how</h3>
<ul>
  <li>During commit's mutation phase, React sets the <code>ref.current</code> to the DOM node. On unmount, it resets to <code>null</code>.</li>
  <li>A callback ref (<code>&lt;div ref={fn}/&gt;</code>) is called with <code>node</code> on mount and <code>null</code> on unmount; if the ref function identity changes between renders, it's called with null on the old render and node on the new.</li>
  <li>Refs don't trigger re-renders when you mutate <code>.current</code>.</li>
</ul>

<h3>6. Strict Mode double-invokes</h3>
<p>In dev, <code>&lt;StrictMode&gt;</code> intentionally double-invokes component bodies, hooks setup, and effects to help surface side effects. It also double-runs effects on mount (mount → unmount → mount) in React 18 to test cleanup. Does not apply in production. Surprises people who thought render was single-shot.</p>

<h3>7. setState of the same value bails out</h3>
<pre><code class="language-js">const [n, setN] = useState(0);
setN(0); // no re-render — Object.is(oldState, newState) equal</code></pre>
<p>But: the function version <code>setN(prev =&gt; prev)</code> still runs the reducer (to compute the next value) before comparing. If your updater has side effects, they run.</p>

<h3>8. Re-render without DOM change</h3>
<pre><code class="language-js">function App() {
  const [_, setTick] = useState(0);
  return &lt;div&gt;hi&lt;/div&gt;;
}</code></pre>
<p>Calling <code>setTick</code> causes a render but the diff shows no change → zero DOM mutations. The component function ran (measurable in Profiler), but the DOM didn't change.</p>

<h3>9. <code>key</code>'d remount of reusable child</h3>
<pre><code class="language-js">&lt;EditForm key={route.id} /&gt;</code></pre>
<p>Changing <code>key</code> forces a remount. Cleanest way to reset a complex subtree on navigation — no effect cleanup logic needed; the fiber is thrown away.</p>

<h3>10. <code>children</code> as a stability boost</h3>
<pre><code class="language-js">function Panel({ children }) {
  const [open, setOpen] = useState(false);
  return open ? &lt;div&gt;{children}&lt;/div&gt; : null;
}
&lt;Panel&gt;&lt;Big/&gt;&lt;/Panel&gt;
// Panel re-renders when open toggles, but 'children' is the same React Element
// from the parent render. React reuses Big's fiber — Big doesn't re-render.</code></pre>

<h3>11. Context doesn't use memo-bailout</h3>
<p>Even if a consumer is wrapped in <code>React.memo</code>, a context change triggers it to re-render. That's because context bypasses the props comparison.</p>

<h3>12. Using object literals as context values</h3>
<pre><code class="language-js">&lt;Ctx.Provider value={{ user, setUser }}&gt; // new object each render → every consumer re-renders</code></pre>
<p>Wrap with <code>useMemo</code> if stability matters, or split into two contexts.</p>

<h3>13. Effects seeing "stale closures"</h3>
<pre><code class="language-js">useEffect(() =&gt; {
  const id = setInterval(() =&gt; console.log(count), 1000);
  return () =&gt; clearInterval(id);
}, []); // deps []</code></pre>
<p>The interval's closure captures <code>count</code>'s value at mount (0). Either include <code>count</code> in deps or use a ref for the latest value.</p>

<h3>14. Keys must be unique among siblings, not globally</h3>
<p>Two list components on the same page can both use <code>key={0,1,2}</code> — that's fine; keys are scoped to each list's parent.</p>

<h3>15. Reconciler short-circuits on Object.is referential equality of props</h3>
<p>React compares previous vs new Element by looking at <code>type</code> and <code>props</code>. If <code>props</code> is the exact same object (rare, happens with <code>children</code> reuse), the reconciler can sometimes skip work. This is why <code>children</code> stability matters.</p>

<h3>16. Portals don't change reconciliation rules</h3>
<p><code>createPortal(child, container)</code> still follows the React tree for fiber purposes — context, state, events bubble through the React tree. Only the actual DOM location is different.</p>

<h3>17. Error boundaries catch render + commit errors</h3>
<p>Errors in event handlers are NOT caught by error boundaries (they're synchronous and exit through the event system). Errors in async code (promises) are also not caught. Only errors during render, lifecycle methods, and constructors of descendants.</p>

<h3>18. List keys from index can actually be correct</h3>
<p>If the list is never reordered, never has items inserted/removed in the middle — e.g., an append-only log — <code>key={index}</code> is fine. The linter warning is a heuristic. Just understand the invariant.</p>

<h3>19. Commit is synchronous, render is not</h3>
<p>Once React decides to commit, it runs to completion even if it takes long. That's why splitting long work into <code>startTransition</code> is about <em>render phase</em> — it doesn't help if your commit is heavy (big DOM tree, big layout).</p>

<h3>20. Large trees and deep recursion</h3>
<p>Fiber's linked-list structure means React doesn't recurse in JS; it iterates. Stack depth is constant regardless of tree depth. Pre-Fiber React could blow the stack with deeply nested components; Fiber can't.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — using index as key for reorderable lists</h3>
<pre><code class="language-js">// BAD
todos.map((t, i) =&gt; &lt;Todo key={i} todo={t}/&gt;);</code></pre>
<p>After insert/delete in the middle, every subsequent item's state migrates to the wrong todo (inputs, animations, focus). Use a stable id.</p>

<h3>Anti-pattern 2 — calling setState during render</h3>
<pre><code class="language-js">// BAD
function Bad({ x }) {
  const [y, setY] = useState(0);
  if (x &gt; y) setY(x);
  return &lt;div&gt;{y}&lt;/div&gt;;
}</code></pre>
<p>Use derived state (compute from props), or <code>useEffect</code> for actual sync. The unconditional version triggers infinite renders.</p>

<h3>Anti-pattern 3 — new inline functions / objects everywhere</h3>
<pre><code class="language-js">// BAD — breaks React.memo children
&lt;Child onClick={() =&gt; doSomething(id)} options={{ mode: 'x' }} /&gt;</code></pre>
<p>Use <code>useCallback</code> / <code>useMemo</code> when the child is memoized or when the prop is a dependency of a hook.</p>

<h3>Anti-pattern 4 — deriving state via effect</h3>
<pre><code class="language-js">// BAD
const [sorted, setSorted] = useState([]);
useEffect(() =&gt; setSorted(items.sort()), [items]);
// Extra render, risk of stale state. Derive inline with useMemo instead.</code></pre>

<h3>Anti-pattern 5 — returning a different type based on state</h3>
<pre><code class="language-js">function Toggle({ open }) {
  return open ? &lt;section&gt;&lt;Costly/&gt;&lt;/section&gt; : &lt;div&gt;&lt;Costly/&gt;&lt;/div&gt;;
}</code></pre>
<p>Remounts Costly on every toggle. Use one tag with conditional styling/content.</p>

<h3>Anti-pattern 6 — object spread in render when not needed</h3>
<pre><code class="language-js">&lt;Child {...{ a, b, c }} extraObj={{ ...other }} /&gt;</code></pre>
<p>New object every render; breaks memoization. Destructure only if needed, memoize if the prop is complex.</p>

<h3>Anti-pattern 7 — useState storing derived data</h3>
<pre><code class="language-js">const [visible, setVisible] = useState(items.filter(i =&gt; i.active));
// visible is computed from items; if items changes, visible is stale.</code></pre>
<p>Compute with <code>useMemo</code> or inline — no state needed.</p>

<h3>Anti-pattern 8 — huge single context</h3>
<pre><code class="language-js">// BAD
&lt;AppContext.Provider value={{ user, settings, notifications, cart, ... }}&gt;</code></pre>
<p>Every consumer re-renders for every sub-change. Split by update cadence (UserCtx, SettingsCtx, etc.) or use a selector library (Zustand / Redux) for read scoping.</p>

<h3>Anti-pattern 9 — mutating state in place</h3>
<pre><code class="language-js">// BAD
items.push(newItem);
setItems(items); // same reference — bailout, no re-render</code></pre>
<p>Always create a new array/object: <code>setItems([...items, newItem])</code> or use Immer.</p>

<h3>Anti-pattern 10 — overusing useEffect for side effects that belong in handlers</h3>
<pre><code class="language-js">// BAD
useEffect(() =&gt; { if (submitted) sendAnalytics(); }, [submitted]);
// GOOD
const onSubmit = () =&gt; { sendAnalytics(); setSubmitted(true); };</code></pre>
<p>Event-driven side effects belong in handlers. Effects are for syncing to external systems (DOM, subscriptions, refs).</p>

<h3>Anti-pattern 11 — forcing remount instead of fixing state logic</h3>
<pre><code class="language-js">// BAD
&lt;ExpensiveThing key={Math.random()} /&gt;
// Remounts every render, destroying state AND paying full setup cost.</code></pre>
<p>Key should change only when a meaningful identity changes.</p>

<h3>Anti-pattern 12 — wrapping every component in React.memo</h3>
<p>Memo has overhead (shallow compare) and helps only when props are stable. For cheap, frequently-changing components, memo can be slower than no-memo. Profile first; memo specific heavy children, not every one.</p>

<h3>Anti-pattern 13 — deeply nested children causing O(n) context propagation</h3>
<p>A context change walks every fiber to invalidate consumers. Millions of nodes = noticeable hitch. Split your tree, virtualize lists, or lift the context closer to where it's needed.</p>

<h3>Anti-pattern 14 — using refs for state that should re-render</h3>
<pre><code class="language-js">// BAD
const countRef = useRef(0);
return &lt;button onClick={() =&gt; countRef.current++}&gt;{countRef.current}&lt;/button&gt;;</code></pre>
<p>Mutating a ref doesn't trigger re-render; UI stays stale. Use <code>useState</code>.</p>

<h3>Anti-pattern 15 — setting state in useLayoutEffect that triggers another layout</h3>
<pre><code class="language-js">useLayoutEffect(() =&gt; {
  const rect = ref.current.getBoundingClientRect();
  setSize(rect); // synchronous re-render before paint
}, [deps]);</code></pre>
<p>OK for rare measurement cases, but this forces an extra render synchronously. For animations and perf-critical paths, batch or switch to ResizeObserver.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is React's reconciliation algorithm?</div>
  <div class="qa-answer">
    <p>Reconciliation is how React decides what changed between two renders. It compares the new React Element tree to the previous one, using two heuristics to stay O(n): (1) if the element type at a position differs, the whole subtree is destroyed and rebuilt — no attempt at deep matching; (2) sibling lists are matched by the <code>key</code> prop (fallback: position). Matching fibers are updated in place — DOM nodes reused, hooks state preserved. Unmatched new siblings are created, unmatched old siblings are removed.</p>
    <p><strong>Keywords:</strong> React Element (immutable descriptor), Fiber (internal work unit), diff heuristics, keys, destroy/create vs update.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is Fiber? Why was it introduced?</div>
  <div class="qa-answer">
    <p>Fiber is React 16+'s internal representation of the component tree — a linked-list of nodes with parent/child/sibling pointers. Each fiber corresponds to a React element instance and carries hook state, effect flags, scheduling lanes, and a pointer to its alternate (work-in-progress or current). Before Fiber, reconciliation was recursive on the JS call stack — you couldn't pause or prioritize work. Fiber allowed React to break rendering into small units (one fiber = one unit), yield to the browser between units, and build new features on top: Suspense, concurrent rendering, startTransition, time-slicing, error boundaries.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What's the difference between the Render and Commit phases?</div>
  <div class="qa-answer">
    <p><strong>Render phase</strong>: React calls components, builds a new fiber tree, and diffs against the current tree. This phase is <em>pure</em> (your code shouldn't have side effects) and <em>interruptible</em> — React can pause, cancel, or restart it. No DOM changes yet.</p>
    <p><strong>Commit phase</strong>: React applies the diff to the DOM, reattaches refs, runs layout effects synchronously, lets the browser paint, then runs passive effects after paint. This phase is <em>synchronous</em> and atomic — once started, it runs to completion. DOM is the single source of truth at this point.</p>
    <p>Key rule: never mutate, never <code>setState</code> synchronously during render (infinite loops, inconsistent reads). That belongs in effects or event handlers.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Why do keys matter in lists?</div>
  <div class="qa-answer">
    <p>When React diffs a list of children, it needs a way to identify each sibling across renders. Without keys, it matches by position — so inserting at the front causes every item to be "the previous one with different content," which breaks state (inputs, focus, animations). With stable keys, React builds a <code>Map&lt;key, fiber&gt;</code> and matches by identity, so inserting creates one new fiber and moves the existing ones. Use database ids when available. Never use index for reorderable or insert-in-middle lists.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Is Virtual DOM the same as Fiber?</div>
  <div class="qa-answer">
    <p>Related but distinct. <strong>Virtual DOM</strong> is the concept: an in-memory tree of element descriptors that React compares to produce a DOM diff. Both Stack and Fiber reconcilers are implementations of that concept. <strong>Fiber</strong> is React's specific internal data structure, designed to enable time-slicing and prioritized rendering. In React docs today, "Virtual DOM" has been largely retired in favor of "React Elements" + "Fiber" to be more precise.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How does React.memo decide whether to skip a render?</div>
  <div class="qa-answer">
    <p>Default comparator: shallow equality of props. For each prop in new vs old, it uses <code>Object.is</code>. If all are equal, the component's fiber is reused — the function is NOT called. You can pass a custom comparator: <code>React.memo(Component, (prev, next) =&gt; ...)</code> returning true means "skip." Gotchas: object/function props created in the parent's render body are new every time, breaking memo. Use <code>useMemo</code>/<code>useCallback</code> on the parent side, or lift state. Context changes bypass memo entirely.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What triggers a re-render in React?</div>
  <div class="qa-answer">
    <ul>
      <li>State change via <code>useState</code>/<code>useReducer</code>/<code>forceUpdate</code> — that fiber re-renders (and its subtree, unless memoized).</li>
      <li>Parent re-renders — children re-render by default.</li>
      <li>Context value change — every consumer of that context in the subtree.</li>
      <li>Prop changes from parent — children re-render (unless memoized with equal props).</li>
    </ul>
    <p>Props never "set state." A parent passing new props renders the child; if state needs to derive from props, compute during render with <code>useMemo</code>, or reset with a <code>key</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Predict the output</div>
<pre><code class="language-js">function List({ items }) {
  return items.map((it, i) =&gt; &lt;input key={i} defaultValue={it}/&gt;);
}
// Initial: items = ['a', 'b', 'c']
// User types 'X' in the middle input
// Then items changes to ['a', 'b2', 'c']
// What does the user see?</code></pre>
  <div class="qa-answer">
    <p>User sees 'X' preserved, because the keys (indices 0, 1, 2) remain the same — same fibers, same DOM inputs, same uncontrolled state. <code>defaultValue</code> only seeds the initial DOM value, it doesn't re-set on re-render. But if the user inserts <code>'new'</code> at index 0 (<code>['new','a','b2','c']</code>), the 'X' will migrate to the wrong input because key=0 now points at 'new'. That's why index keys are dangerous on reorderable lists.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How does React batch state updates?</div>
  <div class="qa-answer">
    <p>React collects all <code>setState</code> calls that happen within the same "work boundary" and applies them in a single render. In React 18+, batching is <strong>automatic</strong> everywhere — inside event handlers, promises, <code>setTimeout</code>, native events. Pre-18, batching only applied inside React-synthetic event handlers; async code triggered multiple renders. The effect: <code>setA(); setB(); setC();</code> causes ONE render with all three new values. To opt out when you need mid-sequence renders, use <code>flushSync</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Why is <code>useLayoutEffect</code> synchronous, and when do you actually need it?</div>
  <div class="qa-answer">
    <p><code>useLayoutEffect</code> runs synchronously after React has written to the DOM but <em>before</em> the browser paints. It's the only place to: (a) read layout (<code>getBoundingClientRect</code>) and synchronously mutate based on it without the user seeing an intermediate frame; (b) set up imperative DOM APIs that must be in place before paint (some third-party libraries, animations, scroll position preservation). <code>useEffect</code> runs after paint — same code placed there causes a visible flash of wrong layout. Tradeoff: layoutEffect blocks paint, so expensive work belongs in <code>useEffect</code> (or off-main-thread).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What does it mean that "React Elements are immutable"?</div>
  <div class="qa-answer">
    <p>Once created, a React Element (the object <code>{ type, props, key, ref }</code>) cannot be modified — its props object is frozen in dev. Every render produces fresh Elements. This is what makes reconciliation safe to run speculatively: a cancelled render can just throw away the new Elements without having dirtied the current tree. It's also why you can't "mutate props" and expect re-renders — the Elements go away each render; they're descriptors, not state.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What is the <code>key</code> prop on a non-list component doing?</div>
  <div class="qa-answer">
    <p>Telling React: "when this key changes, treat it as a different component instance — destroy the old fiber, build a new one." Useful pattern: <code>&lt;EditForm key={recordId} record={record} /&gt;</code> — changing <code>recordId</code> forces all internal state to reset without you writing effect-based reset logic. It's React's built-in "remount" escape hatch.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Explain double-buffering in the commit phase.</div>
  <div class="qa-answer">
    <p>React maintains two fiber trees simultaneously: the <strong>current tree</strong> (what's rendered on screen) and the <strong>work-in-progress tree</strong> (what's being built). Each fiber in one tree has an <code>alternate</code> pointer to its counterpart. Updates build the WIP tree from scratch by mutating / creating fibers connected through alternates. Once the WIP tree is complete, commit swaps the pointer: WIP becomes current, old current becomes the new WIP pool. Like page-flipping in graphics — the user never sees an intermediate state.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Why does React re-render a child whose props didn't change?</div>
  <div class="qa-answer">
    <p>Because the default behavior is: if the parent re-renders, every child re-renders. React doesn't do prop comparison for free — that would be shallow compare on every render for every child, which is often wasted work. Opt-in via <code>React.memo</code>, and even then, only if props are stable (use <code>useMemo</code>/<code>useCallback</code>). Memoization is a perf optimization, not a correctness guarantee; applying it everywhere usually doesn't pay off.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How does error handling work in reconciliation?</div>
  <div class="qa-answer">
    <p>If a render or commit phase throws below an Error Boundary, React catches it, unmounts the subtree rooted at the boundary, and renders the boundary's fallback UI. The boundary is a class component with <code>componentDidCatch</code> or <code>getDerivedStateFromError</code>. Errors in event handlers, setTimeouts, and promises are NOT caught by boundaries — they escape to the global handler. React 18 introduced <code>useErrorBoundary</code>-like patterns via libraries, and RSC has similar server-side handling.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. What's concurrent rendering and when does it matter?</div>
  <div class="qa-answer">
    <p>Concurrent rendering lets React prepare multiple versions of the UI at the same time, interrupt low-priority work when a high-priority update arrives, and throw away abandoned work without committing it. Opt-in via <code>startTransition</code>, <code>useDeferredValue</code>, and Suspense with data fetching. Under the hood: lanes assign priority to updates; the scheduler picks the highest-priority lane; work yields to the browser at fiber boundaries. Use cases: keeping input responsive while a big list recomputes, avoiding flicker by preferring the old UI until the new one is ready.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q17. Walk me through what happens when I call <code>setState</code>.</div>
  <div class="qa-answer">
    <ol>
      <li>React creates an <em>update</em> object <code>{ action, lane, next }</code> and enqueues it on the fiber's hook queue.</li>
      <li>It schedules work on that fiber at the update's lane priority.</li>
      <li>At the next tick (batched), the scheduler picks the work and starts the render phase for the root containing that fiber.</li>
      <li>In render, your component function runs again; <code>useState</code> returns the new state computed by running through the queue.</li>
      <li>React walks the subtree, diffing, flagging fibers with effects.</li>
      <li>If the new state equals the old (<code>Object.is</code>), the component may bail out.</li>
      <li>Commit phase: DOM updated, refs reattached, layout effects run, paint, passive effects run.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish React Element (descriptor, immutable, per-render) from Fiber (internal, spans renders).</li>
    <li>You describe the two phases — render (pure, interruptible) vs commit (sync, atomic).</li>
    <li>You explain the diffing heuristics — type mismatch destroys, keys identify siblings.</li>
    <li>You know batching is automatic in React 18 everywhere.</li>
    <li>You can name the commit subphases and place layout/passive effects.</li>
    <li>You reach for <code>key</code> as a remount mechanism.</li>
    <li>You can name lanes and explain how <code>startTransition</code> uses them.</li>
  </ul>
</div>
`}

]
});
