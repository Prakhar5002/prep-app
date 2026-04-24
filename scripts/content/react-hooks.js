window.PREP_SITE.registerTopic({
  id: 'react-hooks',
  module: 'React Deep',
  title: 'Hooks Internals',
  estimatedReadTime: '32 min',
  tags: ['react', 'hooks', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'custom-hooks'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Hooks are functions (<code>useState</code>, <code>useEffect</code>, ...) that let function components "remember" state across renders. The memory is <em>not</em> in the hook itself — it's stored in the current Fiber's <code>memoizedState</code> as a <strong>singly-linked list of hook records</strong>. React matches each call to its record by <em>call order</em>. That's the entire reason for the "only call hooks at the top level" rule.</p>
<ul>
  <li><strong>Rules of Hooks</strong>: only call them (1) at the top level of a function component or another hook; (2) in the <em>same order</em> every render. Violating either corrupts the linked list.</li>
  <li><strong><code>useState</code></strong> holds a queue of pending updates and returns the committed value. Its setter has a stable identity across renders.</li>
  <li><strong><code>useEffect</code></strong> defers its callback to <em>after</em> commit + paint. Dependencies are shallow-compared (<code>Object.is</code>) between renders; if unchanged, effect is skipped.</li>
  <li><strong><code>useLayoutEffect</code></strong> runs synchronously after DOM mutations, before paint. Use for layout-reading + writing.</li>
  <li><strong><code>useRef</code></strong> returns the same object on every render; mutating <code>.current</code> does NOT trigger re-render.</li>
  <li><strong><code>useMemo</code> / <code>useCallback</code></strong> cache a computation/function across renders when deps didn't change.</li>
  <li><strong><code>useContext</code></strong> subscribes to a context; any change of the provider's value re-renders every consumer.</li>
  <li>Custom hooks are just functions that use other hooks — no special runtime, state is per-caller-fiber.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Hooks are slots in a per-fiber linked list, matched by call order. Everything else — dispatchers, queues, deps, memoization — is the machinery that makes those slots behave like state, effects, or caches.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What hooks are, under the hood</h3>
<p>Every time React renders a function component, it sets a global pointer to the current fiber's hook list and a counter starting at 0. Each call to <code>useState</code>, <code>useEffect</code>, etc. reads the hook at the current index, increments, and returns. After render, the counter is validated against the previous render — if the hook count or order changed, React errors.</p>

<p>So "hooks" are really just <em>indices into a per-fiber array-like structure</em> (actually a linked list). The functions <code>useState</code> and friends are dispatchers that look up and mutate those slots.</p>

<h3>Why the "only top level" rule?</h3>
<pre><code class="language-js">// BAD
function Comp() {
  if (cond) const [a] = useState(1);  // hook skipped when cond is false
  const [b] = useState(2);
}</code></pre>
<p>Render 1 (<code>cond=true</code>): slot 0 = a, slot 1 = b.<br/>Render 2 (<code>cond=false</code>): slot 0 = b (but React looks up the "first useState" in slot 0 → gets a's record, mixing state).</p>
<p>React's matching by index only works if the sequence of hook calls is identical across renders. Hence: no conditionals, no loops, no early returns before hooks. The dev-time ESLint rule <code>react-hooks/rules-of-hooks</code> enforces this.</p>

<h3>Why call-order matching, not names?</h3>
<p>Storing hooks by <em>name</em> would conflict with repeated usage (<code>useState</code> twice) and would require hooks to have unique identifiers. Storing by <em>call order</em> is simple, fast (O(1) per hook), and aligns naturally with JS execution. The tradeoff is the top-level rule. TC39 proposals for labeled hooks have never moved forward — this design works in practice.</p>

<h3>Why have hooks at all (vs classes)?</h3>
<ul>
  <li><strong>Logic reuse.</strong> Classes had HOCs and render props — both cause "wrapper hell" and make TypeScript generics painful. Custom hooks are plain function composition.</li>
  <li><strong>Grouping by concern, not lifecycle.</strong> A class's lifecycle methods force you to split related logic (subscribe in cDM, unsubscribe in cWU). Hooks let you put setup + teardown together in a single <code>useEffect</code>.</li>
  <li><strong>No binding of <code>this</code>.</strong> Function components don't have <code>this</code>-loss bugs. Event handlers are just closures.</li>
  <li><strong>Easier for the compiler.</strong> Hooks enabled React Compiler (rememoize automatically), Server Components, and Suspense-aware reads.</li>
</ul>

<h3>Why <code>useEffect</code> is async, <code>useLayoutEffect</code> is sync</h3>
<p>After the commit phase mutates the DOM, you want two different kinds of work:</p>
<ul>
  <li><strong>Sync before paint</strong> — read layout (<code>getBoundingClientRect</code>) and adjust it, so the user never sees an intermediate frame. That's <code>useLayoutEffect</code>. Blocks painting.</li>
  <li><strong>Async after paint</strong> — subscribe to a store, fetch data, log analytics. That's <code>useEffect</code>. Doesn't block painting.</li>
</ul>
<p>Default to <code>useEffect</code>. Escalate to <code>useLayoutEffect</code> only when you measure something synchronously. SSR can't run <code>useLayoutEffect</code> (no DOM) and warns.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "linked list of slots per fiber" picture</h3>
<div class="diagram">
<pre>
Fiber (component instance)
┌─────────────────────────────┐
│ type: MyComp                │
│ memoizedState ──►┐          │
└──────────────────┼──────────┘
                   ▼
           Hook slot 0 (useState)
           ┌───────────────────────┐
           │ memoizedState: 42     │
           │ queue: {pending: null}│
           │ next ──►              │
           └────────┬──────────────┘
                    ▼
           Hook slot 1 (useEffect)
           ┌───────────────────────┐
           │ memoizedState: effect │
           │ deps: [a, b]          │
           │ next ──►               │
           └────────┬──────────────┘
                    ▼
           Hook slot 2 (useRef)
           ┌───────────────────────┐
           │ memoizedState: {current:...}│
           │ next: null            │
           └───────────────────────┘
</pre>
</div>
<p>Render order determines slot order. The ESLint rule enforces that the order cannot vary between renders.</p>

<h3>The "dispatcher swap" picture</h3>
<p>Internally React has multiple <em>dispatchers</em>: <code>HooksDispatcherOnMount</code> (first render of this fiber — allocates slots) and <code>HooksDispatcherOnUpdate</code> (subsequent renders — reuses slots). Before calling your function, React points the global hooks dispatcher at the right one. After render, it swaps it to a "throw on use" dispatcher so hooks called outside a component error out loudly.</p>

<h3>The "useState returns a [value, setter] where the setter is stable" picture</h3>
<pre><code class="language-js">function Comp() {
  const [x, setX] = useState(0);
  // 'x' is the current committed value.
  // 'setX' is a function with stable identity across ALL renders of this fiber.
  // Safe to pass as deps: useEffect(..., [setX]) — never changes.
}</code></pre>

<h3>The "useEffect runs after paint" picture</h3>
<pre><code class="language-js">function F() {
  useEffect(() =&gt; {
    console.log('effect');  // after browser paints
    return () =&gt; console.log('cleanup');
  }, [deps]);
}</code></pre>
<p>Order: React renders → commits DOM → browser paints → useEffect callbacks run (previous cleanups first, then current effects). Cleanup on unmount runs synchronously during the next commit's cleanup phase.</p>

<h3>The "useRef is a box that persists" picture</h3>
<pre><code class="language-js">const ref = useRef(0);
ref.current++; // doesn't trigger render
ref.current    // === 1 on next render</code></pre>
<p>Same object every render, same <code>.current</code> field you can mutate. Perfect for "remember something across renders without re-rendering."</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Hooks don't use closures." They absolutely do — <code>useEffect(() =&gt; { console.log(count) })</code> captures <code>count</code>'s value at render time. That's why stale-closure bugs exist. React does NOT magically re-inject fresh values into your callback — deps must include every variable the callback reads.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Rendering pass: how the linked list is built and walked</h3>
<ol>
  <li>Before calling your component, React sets <code>currentFiber = fiber</code>, <code>workInProgressHook = null</code>, picks the mount-or-update dispatcher, and selects the right hook record pool.</li>
  <li>Your component runs top-to-bottom. Each hook call:
    <ul>
      <li>On mount: allocates a new hook record, links it to the previous one (<code>prev.next = hook</code>), makes it the current.</li>
      <li>On update: walks from the head of <code>fiber.memoizedState</code>, consuming one record per call. Merges any pending queue to compute the new value.</li>
    </ul>
  </li>
  <li>After the function returns, React validates the hook count matches the previous render. Mismatch → error "Rendered more/fewer hooks than previous render."</li>
</ol>

<h3><code>useState</code> in detail</h3>
<p>A <code>useState</code> hook record holds:</p>
<ul>
  <li><code>memoizedState</code> — the committed value.</li>
  <li><code>baseState</code> — state at the start of the update sequence.</li>
  <li><code>queue</code> — a circular linked list of pending updates (from setter calls).</li>
  <li>On update: React walks the queue, applying each update (either a value or an updater function), honoring priority lanes (skipping low-priority updates when rendering high-priority work, to be applied later).</li>
</ul>
<pre><code class="language-js">const [n, setN] = useState(0);
// setN(5)   → enqueue {action: 5}
// setN(p=&gt;p+1) → enqueue {action: p=&gt;p+1}
// Next render: walk queue: 0 → 5 → 6, memoize 6.</code></pre>
<p><strong>Setter identity:</strong> React gives the setter a stable identity per fiber instance, so it's safe to use in dependency arrays without churn.</p>

<h3><code>useReducer</code> in detail</h3>
<p>Identical to <code>useState</code> internally — in fact <code>useState</code> is implemented as a reducer that just replaces state. <code>useReducer(reducer, initial)</code> exposes the reducer for you to write. Returns <code>[state, dispatch]</code> with stable <code>dispatch</code>.</p>

<h3><code>useEffect</code> / <code>useLayoutEffect</code></h3>
<p>The hook record holds:</p>
<ul>
  <li><code>create</code> — the callback you passed.</li>
  <li><code>destroy</code> — the cleanup returned by the last <code>create</code>.</li>
  <li><code>deps</code> — the deps array.</li>
</ul>
<p>During render, React compares new deps vs old with <code>Object.is</code> per element (and same length). Unchanged → mark this effect as "skipped" (don't run). Changed → mark to run cleanup + create in commit.</p>
<p>Commit:</p>
<ol>
  <li>Mutation phase writes DOM.</li>
  <li>For each scheduled layout effect: run previous <code>destroy</code>, then <code>create</code> (its return becomes the new <code>destroy</code>). Synchronous.</li>
  <li>Browser paints.</li>
  <li>For each scheduled passive effect: same pattern, but async (microtask).</li>
</ol>
<p>Unmount: cleanup (<code>destroy</code>) runs synchronously during the unmount's commit.</p>

<h3><code>useRef</code></h3>
<p>Hook record stores a single object <code>{ current: initialValue }</code>. Every render returns the <em>same object</em>. Your mutations don't trigger re-renders — React doesn't know about them. Useful for: DOM refs, imperative handles, "latest value" access inside stale closures.</p>

<h3><code>useMemo</code> / <code>useCallback</code></h3>
<p>Hook record holds <code>[value, deps]</code>. Next render: if deps unchanged, return cached value. Otherwise, run factory and cache. <code>useCallback(fn, deps)</code> is sugar for <code>useMemo(() =&gt; fn, deps)</code>.</p>
<p><strong>Warning:</strong> the cache can be discarded by React (it's a hint, not a guarantee). Don't rely on memo for correctness — only for perf.</p>

<h3><code>useContext</code></h3>
<p>Reads the current value of a context. Subscribes the fiber to the Provider — when the Provider's <code>value</code> changes (by <code>Object.is</code>), React walks down the tree and invalidates every subscribing fiber. Re-renders skip the <code>React.memo</code> bailout for those fibers.</p>
<p>Cheap to use, but broad context changes can cascade. Common optimizations: split contexts by update cadence, use selectors, use an external store (Zustand / Redux) for fine-grained subscriptions.</p>

<h3><code>useImperativeHandle</code></h3>
<p>Exposes an imperative API from a function component to a parent via a ref:</p>
<pre><code class="language-js">const Input = forwardRef((props, ref) =&gt; {
  const inputRef = useRef();
  useImperativeHandle(ref, () =&gt; ({
    focus: () =&gt; inputRef.current.focus(),
    reset: () =&gt; inputRef.current.value = '',
  }), []);
  return &lt;input ref={inputRef} /&gt;;
});</code></pre>
<p>Use sparingly — imperative APIs are an escape hatch. Prefer props.</p>

<h3><code>useDeferredValue</code> / <code>useTransition</code></h3>
<p>Concurrent hooks for keeping input responsive while heavy updates happen.</p>
<ul>
  <li><code>useDeferredValue(value)</code> — returns a "deferred" copy of <code>value</code> that lags behind during high-priority updates. Use to show old data while new data renders.</li>
  <li><code>const [pending, startTransition] = useTransition()</code> — wraps a state update as a low-priority transition. <code>pending</code> is true while the transition is in flight.</li>
</ul>

<h3><code>useId</code></h3>
<p>Generates a stable, unique ID suitable for <code>aria-*</code> attributes and label-htmlFor pairing. Same ID on client and server so hydration doesn't mismatch. Not a random UUID; derived from the tree path.</p>

<h3><code>useSyncExternalStore</code></h3>
<p>The canonical way to subscribe to an external store (Redux, Zustand, Observables) safely in concurrent mode. Signature: <code>useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)</code>. Avoids tearing (UI showing two different snapshots in the same render) that older patterns (<code>useState</code>+<code>useEffect</code>) could exhibit under concurrent rendering.</p>

<h3>Custom hooks</h3>
<p>A custom hook is just a function whose name starts with <code>use</code>. It can call other hooks. State is per-fiber of the calling component — <em>not</em> shared between components that call the same custom hook. Custom hooks are pure composition, no magic runtime.</p>
<pre><code class="language-js">function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() =&gt; {
    const up = () =&gt; setOnline(true);
    const down = () =&gt; setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () =&gt; {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — basic useState</h3>
<pre><code class="language-js">function Counter() {
  const [count, setCount] = useState(0);
  return &lt;button onClick={() =&gt; setCount(count + 1)}&gt;{count}&lt;/button&gt;;
}</code></pre>

<h3>Example 2 — functional update form (avoids stale reads)</h3>
<pre><code class="language-js">const [n, setN] = useState(0);
function bump3() {
  setN(n + 1);
  setN(n + 1); // still uses captured n → only +1 total
  setN(n + 1);
}
function bump3Fn() {
  setN(p =&gt; p + 1); // each update sees the latest queued value
  setN(p =&gt; p + 1);
  setN(p =&gt; p + 1);
}
// bump3 → +1; bump3Fn → +3</code></pre>

<h3>Example 3 — useEffect with cleanup</h3>
<pre><code class="language-js">useEffect(() =&gt; {
  const id = setInterval(tick, 1000);
  return () =&gt; clearInterval(id); // runs before next effect AND on unmount
}, []);</code></pre>

<h3>Example 4 — missing deps cause stale closure</h3>
<pre><code class="language-js">const [count, setCount] = useState(0);
useEffect(() =&gt; {
  setInterval(() =&gt; console.log(count), 1000);
}, []); // never includes count → always logs 0
// Fix: [count] dep, OR use a ref for latest value, OR functional state access.</code></pre>

<h3>Example 5 — useLayoutEffect for measurement</h3>
<pre><code class="language-js">function AutoGrow() {
  const ref = useRef();
  useLayoutEffect(() =&gt; {
    const el = ref.current;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });
  return &lt;textarea ref={ref} /&gt;;
}
// Sync resize happens before paint → no flash of wrong height.</code></pre>

<h3>Example 6 — useRef for "latest value"</h3>
<pre><code class="language-js">function useLatest(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
function Comp({ onChange }) {
  const cbRef = useLatest(onChange);
  useEffect(() =&gt; {
    const id = setInterval(() =&gt; cbRef.current(), 1000);
    return () =&gt; clearInterval(id);
  }, []); // interval always calls the latest onChange
}</code></pre>

<h3>Example 7 — useMemo preventing expensive recomputation</h3>
<pre><code class="language-js">const sorted = useMemo(() =&gt; bigList.slice().sort(byDate), [bigList]);</code></pre>

<h3>Example 8 — useCallback for stable handler</h3>
<pre><code class="language-js">const handleClick = useCallback((id) =&gt; {
  dispatch({ type: 'toggle', id });
}, [dispatch]); // dispatch is stable, so handleClick is stable forever</code></pre>

<h3>Example 9 — context + memo interaction</h3>
<pre><code class="language-js">const ThemeCtx = createContext();
function Provider({ children }) {
  const [theme, setTheme] = useState('dark');
  const value = useMemo(() =&gt; ({ theme, setTheme }), [theme]);
  return &lt;ThemeCtx.Provider value={value}&gt;{children}&lt;/ThemeCtx.Provider&gt;;
}
// useMemo needed so value isn't new object every render → would re-render all consumers.</code></pre>

<h3>Example 10 — custom hook reusing logic</h3>
<pre><code class="language-js">function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() =&gt; {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : initial;
  });
  useEffect(() =&gt; {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}
// State is per-component-instance. Two components calling useLocalStorage('theme', 'dark')
// do NOT share state in memory — each has its own hook slot.</code></pre>

<h3>Example 11 — useReducer for complex state</h3>
<pre><code class="language-js">const initial = { count: 0, history: [] };
function reducer(s, a) {
  switch (a.type) {
    case 'inc': return { count: s.count + 1, history: [...s.history, 'inc'] };
    case 'dec': return { count: s.count - 1, history: [...s.history, 'dec'] };
    default: return s;
  }
}
function App() {
  const [state, dispatch] = useReducer(reducer, initial);
  return (&lt;&gt;
    &lt;button onClick={() =&gt; dispatch({type: 'inc'})}&gt;+&lt;/button&gt;
    &lt;p&gt;{state.count}&lt;/p&gt;
  &lt;/&gt;);
}</code></pre>

<h3>Example 12 — useImperativeHandle</h3>
<pre><code class="language-js">const FancyInput = forwardRef((_, ref) =&gt; {
  const input = useRef();
  useImperativeHandle(ref, () =&gt; ({
    focus: () =&gt; input.current.focus(),
    clear: () =&gt; { input.current.value = ''; }
  }), []);
  return &lt;input ref={input} /&gt;;
});
// Parent:
const r = useRef(); r.current.focus();</code></pre>

<h3>Example 13 — useTransition for responsive input</h3>
<pre><code class="language-js">function Search({ items }) {
  const [q, setQ] = useState('');
  const [shown, setShown] = useState(items);
  const [pending, startTransition] = useTransition();

  const onChange = (e) =&gt; {
    setQ(e.target.value);
    startTransition(() =&gt; {
      setShown(items.filter(i =&gt; i.includes(e.target.value)));
    });
  };

  return (&lt;&gt;
    &lt;input value={q} onChange={onChange} /&gt;
    {pending &amp;&amp; &lt;Spinner/&gt;}
    &lt;List items={shown} /&gt;
  &lt;/&gt;);
}
// Typing stays responsive even if filtering 10k items is slow.</code></pre>

<h3>Example 14 — useDeferredValue</h3>
<pre><code class="language-js">function Wrap({ value }) {
  const deferred = useDeferredValue(value);
  const isStale = deferred !== value;
  return &lt;List value={deferred} className={isStale ? 'stale' : ''} /&gt;;
}
// Same idea as useTransition, but applied to an external value you don't control setting of.</code></pre>

<h3>Example 15 — useSyncExternalStore for safe subscription</h3>
<pre><code class="language-js">function useWindowWidth() {
  return useSyncExternalStore(
    (cb) =&gt; { window.addEventListener('resize', cb); return () =&gt; window.removeEventListener('resize', cb); },
    () =&gt; window.innerWidth,
    () =&gt; 1024  // SSR fallback
  );
}</code></pre>

<h3>Example 16 — useId for accessibility</h3>
<pre><code class="language-js">function Field({ label }) {
  const id = useId();
  return (&lt;&gt;
    &lt;label htmlFor={id}&gt;{label}&lt;/label&gt;
    &lt;input id={id} /&gt;
  &lt;/&gt;);
}
// Stable between client/server, avoids collisions across many Field instances.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Hook called conditionally — React error</h3>
<pre><code class="language-js">function Bad({ on }) {
  if (on) useEffect(() =&gt; {});
  useState(0);
}
// "React has detected a change in the order of Hooks..."
// Solution: move condition INSIDE the hook: useEffect(() =&gt; { if (on) ... });</code></pre>

<h3>2. Initial state factory runs only on mount</h3>
<pre><code class="language-js">const [v, setV] = useState(() =&gt; expensive()); // runs once
const [v, setV] = useState(expensive());          // runs every render, value discarded after mount</code></pre>
<p>Always pass a function for expensive defaults.</p>

<h3>3. setState with same value — bailout</h3>
<pre><code class="language-js">const [v, setV] = useState(0);
setV(0); // React compares Object.is(0, 0) → true → NO re-render</code></pre>
<p>Works even within an already-queued render cycle. Use to avoid unnecessary renders.</p>

<h3>4. setState with new object (same shape) does re-render</h3>
<pre><code class="language-js">const [obj, setObj] = useState({ x: 1 });
setObj({ x: 1 }); // different reference → re-renders, even though shape matches</code></pre>

<h3>5. useEffect deps must include every closed-over variable</h3>
<pre><code class="language-js">useEffect(() =&gt; { fetch(url).then(setData); }, []); // missing [url]
// ESLint: react-hooks/exhaustive-deps catches this.</code></pre>

<h3>6. useEffect with missing deps hides bugs</h3>
<p>Tempting to <code>// eslint-disable-next-line</code>, but consider: the correct fix is usually a ref pattern, <code>useCallback</code>, or restructuring state. Escape hatches accumulate tech debt.</p>

<h3>7. useEffect and StrictMode double-mount</h3>
<p>In React 18 dev StrictMode, effects are intentionally run → cleaned up → run again on mount to surface missed cleanups. Production is normal. If your effect doesn't properly clean up, the double-mount reveals the bug.</p>

<h3>8. useRef doesn't update the UI</h3>
<pre><code class="language-js">const count = useRef(0);
&lt;button onClick={() =&gt; count.current++}&gt;{count.current}&lt;/button&gt;
// Number displayed never updates — no re-render triggered.</code></pre>

<h3>9. useMemo is a hint, not a guarantee</h3>
<p>React reserves the right to discard memo caches to reclaim memory. Don't rely on <code>useMemo</code> for correctness (e.g., don't use it to dedupe side-effect-producing objects).</p>

<h3>10. useCallback doesn't prevent render</h3>
<pre><code class="language-js">const fn = useCallback(() =&gt; {}, []);
&lt;Child onClick={fn} /&gt;
// Child still re-renders when PARENT re-renders, unless Child is React.memo'd.
// useCallback only helps memoized children or dependency arrays.</code></pre>

<h3>11. Context changes bypass React.memo</h3>
<pre><code class="language-js">const Memoed = React.memo(function (props) { useContext(T); return ...; });
// Every T change re-renders Memoed — memo prop check is irrelevant.</code></pre>

<h3>12. Custom hook state is per-caller</h3>
<pre><code class="language-js">function useTimer() {
  const [n, setN] = useState(0);
  // ...
  return n;
}
// Comp A and Comp B each get their own n — NOT a shared global.</code></pre>

<h3>13. Functional setState isn't synchronous</h3>
<pre><code class="language-js">setN(p =&gt; p + 1);
console.log(n); // still old value
// State updates are always async-ish (batched to next render).</code></pre>

<h3>14. Effects don't run on every commit — only when deps change</h3>
<pre><code class="language-js">useEffect(() =&gt; console.log('A'), []);    // once on mount
useEffect(() =&gt; console.log('B'));        // every render
useEffect(() =&gt; console.log('C'), [x]);   // when x changes</code></pre>

<h3>15. Effect ordering among multiple effects in one component</h3>
<p>Effects run in the order they appear in the source. Cleanups run in reverse order on unmount (LIFO).</p>

<h3>16. useLayoutEffect not safe on SSR</h3>
<pre><code class="language-js">if (typeof window === 'undefined') useLayoutEffect = useEffect;
// Or use useIsomorphicLayoutEffect helper. React 18 warns when useLayoutEffect runs during SSR.</code></pre>

<h3>17. Multiple state updates in one handler batch</h3>
<pre><code class="language-js">const handle = () =&gt; { setA(1); setB(2); setC(3); };
// React 18: one render, all three values applied.
// Pre-18 non-React context (setTimeout, promise): three renders.</code></pre>

<h3>18. flushSync forces a sync render mid-sequence</h3>
<pre><code class="language-js">flushSync(() =&gt; setA(1));
measureLayout();
flushSync(() =&gt; setB(2));
// Useful when you need to read layout BETWEEN updates.</code></pre>

<h3>19. Accessing state in a setTimeout captures render-time values</h3>
<pre><code class="language-js">const [count, setCount] = useState(0);
function delayed() {
  setTimeout(() =&gt; console.log(count), 1000);
  setCount(count + 1);
}
// Logs the count AS OF when delayed() was called, not the post-increment value.
// Predictable — JS closure semantics. Use refs for latest-value access.</code></pre>

<h3>20. useEffect's cleanup runs BEFORE the next effect of the same hook</h3>
<p>Order for a deps-changed effect: old cleanup → new create. For unmount: only cleanup (no new create).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — conditional hooks</h3>
<pre><code class="language-js">// BAD
if (user) { const [x] = useState(0); }</code></pre>
<p>Always call hooks unconditionally; move conditions inside.</p>

<h3>Anti-pattern 2 — ignoring exhaustive-deps</h3>
<pre><code class="language-js">// BAD
useEffect(() =&gt; { fetch(url).then(setData); }, []);
// URL becomes stale if prop changes</code></pre>
<p>Fix: add <code>url</code> to deps, or restructure so the effect doesn't need to read it.</p>

<h3>Anti-pattern 3 — storing derived state</h3>
<pre><code class="language-js">// BAD
const [filtered, setFiltered] = useState([]);
useEffect(() =&gt; setFiltered(items.filter(...)), [items]);
// GOOD
const filtered = useMemo(() =&gt; items.filter(...), [items]);</code></pre>

<h3>Anti-pattern 4 — useEffect for things that belong in handlers</h3>
<pre><code class="language-js">// BAD
useEffect(() =&gt; { if (submitted) sendAnalytics(); }, [submitted]);
// GOOD
const onSubmit = () =&gt; { sendAnalytics(); setSubmitted(true); };</code></pre>

<h3>Anti-pattern 5 — storing props in state</h3>
<pre><code class="language-js">// BAD
function View({ data }) {
  const [d, setD] = useState(data);
  useEffect(() =&gt; setD(data), [data]); // duplicate state, always one render behind
}
// GOOD — use 'data' directly, or use a key to force reset.</code></pre>

<h3>Anti-pattern 6 — effects depending on object/array props</h3>
<pre><code class="language-js">// BAD
useEffect(() =&gt; subscribe(opts), [opts]); // opts new object every render</code></pre>
<p>Memoize upstream or pass primitives: <code>useEffect(() =&gt; subscribe({ id }), [id])</code>.</p>

<h3>Anti-pattern 7 — over-memoization</h3>
<pre><code class="language-js">// BAD — every primitive and handler wrapped
const name = useMemo(() =&gt; 'Hello', []);
const onClick = useCallback(() =&gt; alert('hi'), []);</code></pre>
<p>Memoization costs a slot + shallow compare. For cheap values, it's slower than recomputing. Memoize when something actually depends on stability (memoized child, effect dep, context value).</p>

<h3>Anti-pattern 8 — useRef as reactive state</h3>
<pre><code class="language-js">// BAD — UI won't update
const ref = useRef([]);
function add(item) { ref.current.push(item); }</code></pre>
<p>Use <code>useState</code> when the UI depends on the value.</p>

<h3>Anti-pattern 9 — forgetting cleanup in useEffect</h3>
<pre><code class="language-js">// BAD
useEffect(() =&gt; {
  window.addEventListener('resize', onResize);
}, []);
// GOOD
useEffect(() =&gt; {
  window.addEventListener('resize', onResize);
  return () =&gt; window.removeEventListener('resize', onResize);
}, []);</code></pre>

<h3>Anti-pattern 10 — huge context value</h3>
<pre><code class="language-js">// BAD
&lt;AppCtx.Provider value={{ user, theme, route, cart, notifications, posts }} /&gt;</code></pre>
<p>Every field change re-renders every consumer. Split by update cadence, or use an external store.</p>

<h3>Anti-pattern 11 — not using functional setState when incrementing</h3>
<pre><code class="language-js">// BAD in async callbacks
setTimeout(() =&gt; setN(n + 1), 100); // uses captured n, wrong if other updates queued
// GOOD
setTimeout(() =&gt; setN(p =&gt; p + 1), 100);</code></pre>

<h3>Anti-pattern 12 — triggering re-render in useLayoutEffect for every render</h3>
<pre><code class="language-js">useLayoutEffect(() =&gt; { setX(measure()); });
// No deps → runs every render → setX → render → runs again. Infinite loop.</code></pre>

<h3>Anti-pattern 13 — building a custom <code>usePrevious</code> without ref</h3>
<pre><code class="language-js">// BAD
let prev;
function Comp({ x }) {
  const cur = x;
  // prev is module-level → shared across all instances!
}
// GOOD
function usePrevious(v) {
  const ref = useRef();
  useEffect(() =&gt; { ref.current = v; });
  return ref.current;
}</code></pre>

<h3>Anti-pattern 14 — treating hooks like class methods</h3>
<pre><code class="language-js">// BAD (mental model — hook is a function, not a method)
useState.prototype.set = ...; // makes no sense</code></pre>
<p>Hooks are functions. Their "methods" are just closures returned from the call.</p>

<h3>Anti-pattern 15 — state that should be a ref, ref that should be state</h3>
<p>If the UI doesn't depend on it and it needs to persist across renders: <code>useRef</code>. If the UI depends on it: <code>useState</code>. Mixing these up is the source of half of useState/useRef bugs.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do React hooks work internally?</div>
  <div class="qa-answer">
    <p>Each function component instance has a Fiber node. The Fiber holds a <strong>linked list of hook records</strong> in <code>memoizedState</code>. When your component renders, React walks that list in order, returning one record per hook call. On mount, records are allocated and linked. On update, React matches calls to records <em>by call order</em>. That's why hooks must be called at the top level in the same order every render — otherwise the slots misalign. The functions <code>useState</code>, <code>useEffect</code>, etc., are dispatchers that read/write the current hook record.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What are the Rules of Hooks and why?</div>
  <div class="qa-answer">
    <ol>
      <li>Only call hooks at the <strong>top level</strong> — not in conditions, loops, or after early returns.</li>
      <li>Only call hooks from <strong>React function components</strong> or <strong>other hooks</strong>.</li>
    </ol>
    <p>Rationale: React identifies hooks by call order, not names. Conditional calls would shift the slot indices and corrupt state. Rule 2 ensures React has set up the dispatcher pointer. The ESLint rule <code>react-hooks/rules-of-hooks</code> enforces both at lint time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Difference between useEffect and useLayoutEffect?</div>
  <div class="qa-answer">
    <p>Both run after commit. <code>useLayoutEffect</code> runs <strong>synchronously</strong> after React writes to the DOM but <strong>before</strong> the browser paints. Use for reading layout (e.g., <code>getBoundingClientRect</code>) and synchronously mutating based on it — no visual flicker. <code>useEffect</code> runs <strong>after</strong> the browser paints, asynchronously. Use for subscriptions, fetching, analytics, any work that doesn't need to block pixels. Default to <code>useEffect</code>; only escalate to <code>useLayoutEffect</code> when you measure.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What does useState actually store?</div>
  <div class="qa-answer">
    <p>A hook record on the fiber: <code>memoizedState</code> (committed value), <code>baseState</code> (value before this update sequence), and a <code>queue</code> of pending updates. The setter is a function bound to this specific record, stable across renders. On re-render, React walks the queue, applying value replacements or updater functions, computing the new state. If <code>Object.is(old, new)</code>, it bails out without re-rendering.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's a stale closure and how do you fix it?</div>
  <div class="qa-answer">
    <p>A stale closure happens when a callback (often inside <code>useEffect</code>, <code>setTimeout</code>, <code>setInterval</code>, an event handler) captures a variable's value at render time, but the variable has since changed. Example:</p>
<pre><code class="language-js">useEffect(() =&gt; {
  const id = setInterval(() =&gt; console.log(count), 1000);
  return () =&gt; clearInterval(id);
}, []); // never includes 'count' → always logs 0</code></pre>
    <p>Fixes: (1) add the variable to deps (may re-subscribe); (2) use the functional setter (<code>setX(p =&gt; p + 1)</code>); (3) use a ref as "latest value" store; (4) restructure to avoid the stale read.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. When should I use useRef vs useState?</div>
  <div class="qa-answer">
    <p><strong>useState:</strong> values the UI depends on. Changing them triggers a re-render. Use for anything rendered or used in JSX.</p>
    <p><strong>useRef:</strong> mutable "box" that persists across renders but does NOT trigger re-renders. Use for: DOM refs; storing the "latest" value read from inside stale closures; imperative instance state (animation handles, subscription ids, interval ids); anything where rendering from it would be wrong.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Write a useToggle hook.</div>
  <div class="qa-answer">
<pre><code class="language-js">function useToggle(initial = false) {
  const [v, setV] = useState(initial);
  const toggle = useCallback((val) =&gt;
    setV(prev =&gt; typeof val === 'boolean' ? val : !prev),
  []);
  return [v, toggle];
}
// const [open, toggle] = useToggle();
// &lt;button onClick={toggle}&gt;...&lt;/button&gt;
// toggle(true) → force on; toggle(false) → force off; toggle() → flip.</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Write useLocalStorage.</div>
  <div class="qa-answer">
<pre><code class="language-js">function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() =&gt; {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch { return initial; }
  });
  useEffect(() =&gt; {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}</code></pre>
    <p>Extensions: sync across tabs via <code>storage</code> event; handle SSR (check <code>typeof window</code>); schema-versioned migrations.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Write useDebounce.</div>
  <div class="qa-answer">
<pre><code class="language-js">function useDebounce(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() =&gt; {
    const id = setTimeout(() =&gt; setV(value), ms);
    return () =&gt; clearTimeout(id);
  }, [value, ms]);
  return v;
}</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Why does useMemo not always return the same reference even with the same deps?</div>
  <div class="qa-answer">
    <p>Because <code>useMemo</code> is a hint, not a guarantee. React may discard the cache to reclaim memory (especially during offscreen rendering or suspended boundaries). If your code REQUIRES identity stability, don't rely on <code>useMemo</code> — use <code>useRef</code> + manual management, or restructure to not need it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Why is useCallback needed? Wouldn't useMemo suffice?</div>
  <div class="qa-answer">
    <p><code>useCallback(fn, deps)</code> is literally <code>useMemo(() =&gt; fn, deps)</code>. It exists as a thin convenience because memoizing functions is so common. Either works. The main benefit of both: stabilizing reference equality for downstream dependencies — a memoized child using <code>React.memo</code>, or an effect dep array.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What does <code>&lt;StrictMode&gt;</code> change about hooks?</div>
  <div class="qa-answer">
    <p>In development only, StrictMode:</p>
    <ul>
      <li>Double-invokes component function bodies and most hooks (reducers, memo factories, state initializer functions) to surface impure code.</li>
      <li>Mounts → unmounts → mounts effects on mount (React 18+), testing that cleanup is correct.</li>
      <li>Deprecates legacy APIs and warns.</li>
    </ul>
    <p>Production is untouched. If a "new bug" appears only in dev after adding StrictMode, it was already a bug — cleanup or impurity.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Can a custom hook share state between components?</div>
  <div class="qa-answer">
    <p>No — not via the hook itself. Each component calling a custom hook gets its own set of hook records on its own fiber. To share state, put it in React context, a store (Redux/Zustand), or a module-level variable with a subscription API (then subscribe via <code>useSyncExternalStore</code>).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What's useSyncExternalStore for?</div>
  <div class="qa-answer">
    <p>The canonical hook for subscribing to an <em>external</em> store (outside React's state system) in a concurrent-safe way. Takes: (1) a <code>subscribe(callback)</code> returning an unsubscribe; (2) a <code>getSnapshot()</code> returning the current value; (3) optionally a <code>getServerSnapshot()</code> for SSR. Prevents "tearing" — where concurrent renders produce inconsistent snapshots. Libraries like Redux, Zustand, and Jotai use this hook internally.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Explain useTransition</div>
  <div class="qa-answer">
    <p><code>const [isPending, startTransition] = useTransition()</code>. Wrapping state updates in <code>startTransition(() =&gt; setX(big))</code> marks them as low priority. React defers that render, allowing urgent updates (typing into an input, for example) to continue feeling responsive. <code>isPending</code> is true while the transition is in flight — use it to show a non-blocking spinner. Internally: assigns a transition lane; the scheduler defers this work unless nothing higher-priority is pending.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. Write useFetch that cancels on unmount.</div>
  <div class="qa-answer">
<pre><code class="language-js">function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() =&gt; {
    const ctrl = new AbortController();
    setState({ data: null, loading: true, error: null });
    fetch(url, { signal: ctrl.signal })
      .then(r =&gt; r.json())
      .then(data =&gt; setState({ data, loading: false, error: null }))
      .catch(err =&gt; {
        if (err.name !== 'AbortError') setState({ data: null, loading: false, error: err });
      });
    return () =&gt; ctrl.abort();
  }, [url]);
  return state;
}</code></pre>
    <p>Key details: abort on unmount/url change; ignore AbortError rejections; reset state at the start of each fetch.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You describe hooks as "slots in a per-fiber linked list, matched by call order."</li>
    <li>You can name the record contents for useState (memoizedState, queue, baseState).</li>
    <li>You distinguish useEffect (async, after paint) from useLayoutEffect (sync, before paint).</li>
    <li>You warn about stale closures and show three fixes.</li>
    <li>You know setState is batched and functional form avoids stale reads.</li>
    <li>You know memoization is a hint, not a guarantee.</li>
    <li>You explain custom hooks as "just composition, state is per-caller."</li>
    <li>You reach for useSyncExternalStore for external-store subscriptions.</li>
  </ul>
</div>
`}

]
});
