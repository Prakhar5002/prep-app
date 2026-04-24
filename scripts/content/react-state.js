window.PREP_SITE.registerTopic({
  id: 'react-state',
  module: 'React Deep',
  title: 'State Management',
  estimatedReadTime: '28 min',
  tags: ['react', 'state', 'useState', 'useReducer', 'context', 'redux', 'zustand', 'lifting', 'derived-state'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>State management in React is a set of design choices, not a single technology. The question is always: <em>who owns this piece of data, and who needs to know when it changes?</em></p>
<ul>
  <li><strong>Component-local state</strong> (<code>useState</code>, <code>useReducer</code>): the default. If only this component needs it, keep it here.</li>
  <li><strong>Lift state up</strong>: when two sibling components need the same data, hoist it to their lowest common ancestor.</li>
  <li><strong>Context</strong>: ambient "read-mostly" values like theme, current user, i18n locale. Not a general-purpose store — context invalidation re-renders all consumers.</li>
  <li><strong>External stores</strong> (Redux, Zustand, Jotai, Valtio): when many disparate components read or write the same data, or you need selector-based subscriptions. Redux Toolkit is the industry standard for complex apps; Zustand for lightweight needs.</li>
  <li><strong>Server state</strong> (React Query, SWR, Apollo): data fetched from an API belongs in a server-state library that handles caching, revalidation, staleness, retries — NOT in Redux / useState.</li>
  <li><strong>URL state</strong>: filters, search, tab selection — belongs in the URL (shareable, refresh-safe). React Router, search params, nuqs.</li>
  <li><strong>Form state</strong>: its own ecosystem — React Hook Form, Formik, Final Form — because form UX has idiosyncratic requirements (validation, dirty tracking, field registration).</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Don't start with Redux. Start with <code>useState</code>. Lift when necessary. Add Context for ambient values. Add a server-state library for server data. Only reach for a global store when you have a real cross-cutting concern — and still prefer lightweight stores over ceremony-heavy ones.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The "kinds of state" taxonomy</h3>
<p>Before picking a tool, classify your state:</p>
<table>
  <thead><tr><th>Kind</th><th>Owned by</th><th>Lifetime</th><th>Good tool</th></tr></thead>
  <tbody>
    <tr><td><strong>Server state</strong></td><td>The backend</td><td>Cached client-side</td><td>React Query, SWR, Apollo, Relay</td></tr>
    <tr><td><strong>URL state</strong></td><td>The browser URL</td><td>Persists on refresh/share</td><td>React Router, search params</td></tr>
    <tr><td><strong>Form state</strong></td><td>The form component</td><td>Until submit/navigate</td><td>React Hook Form, Formik</td></tr>
    <tr><td><strong>UI state</strong> (open/close, hover, focus)</td><td>The component</td><td>While mounted</td><td><code>useState</code></td></tr>
    <tr><td><strong>Client cache</strong> (computed derived data)</td><td>A module or store</td><td>Session</td><td><code>useMemo</code>, store with selectors</td></tr>
    <tr><td><strong>App-wide settings</strong> (theme, auth, locale)</td><td>The app root</td><td>Session / localStorage</td><td>Context, or a small store</td></tr>
    <tr><td><strong>Cross-cutting domain state</strong> (cart, todos, chat)</td><td>A store</td><td>Session</td><td>Zustand / Redux / Jotai</td></tr>
  </tbody>
</table>
<p>Mis-classifying leads to pain. Putting server data in Redux means you're re-implementing React Query badly. Putting form state in a global store means you're re-implementing React Hook Form badly.</p>

<h3>Why lift state up, not down</h3>
<p>Two components need the same value? Instead of syncing between two sources of truth (always bugs eventually), put ONE source of truth at a common ancestor and pass down via props. The pattern is called "lifting state up." It's the default React pattern; libraries come later.</p>

<h3>Why context is not a general store</h3>
<p>Every consumer re-renders on context value change. For small, rarely-updating data (theme, auth user, locale), that's fine. For frequently-updating data (scroll position, form fields, realtime counters), it's a perf disaster. Use context for ambient read-mostly values; use a store with selector-based subscriptions for everything else.</p>

<h3>Why external stores exist</h3>
<ul>
  <li><strong>Selector-based subscriptions.</strong> A component subscribes to a derived slice. When unrelated parts of the store change, the component doesn't re-render.</li>
  <li><strong>DevTools.</strong> Redux DevTools lets you see every action, time-travel, and diff state. Invaluable for debugging.</li>
  <li><strong>Middleware.</strong> Logging, persistence, analytics, async actions — pluggable.</li>
  <li><strong>Predictability.</strong> A single source of truth + pure reducers = deterministic state transitions that are easy to reason about and test.</li>
</ul>

<h3>Why server state deserves its own library</h3>
<p>Server data has unique challenges that component state doesn't:</p>
<ul>
  <li><strong>Caching.</strong> Multiple components asking for the same data should share a cache and a single in-flight request.</li>
  <li><strong>Staleness.</strong> Data can change on the server; revalidate on focus / reconnect / timer.</li>
  <li><strong>Optimistic updates.</strong> Reflect a mutation in the UI before the server confirms, then reconcile.</li>
  <li><strong>Retries and error handling.</strong> Transient network failures, rate limits, auth expiry.</li>
  <li><strong>Pagination and infinite scroll.</strong> Stitching pages into a coherent view.</li>
  <li><strong>Subscriptions.</strong> WebSockets, polling.</li>
</ul>
<p>Re-implementing these in Redux is most Redux codebases you've seen. React Query / SWR do it out of the box.</p>

<h3>Why derived state is a trap</h3>
<p>Storing derived state in <code>useState</code> means you have to keep it in sync with its sources — any time either source changes, you must update the derived copy. That's a source of bugs. <em>Derive during render</em> via <code>useMemo</code> or plain expressions. Only put something in state if it has its own identity (the user typed, a server returned data).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "state ownership graph" picture</h3>
<p>For each piece of state, ask: <em>which component is its source of truth?</em> Anyone else that needs it should receive it via props or subscribe via context/store. Trouble comes when two components both think they own the same state and you write "sync" logic between them.</p>

<h3>The "read cost" picture</h3>
<div class="diagram">
<pre>
  useState (local)        → cheapest — a component reads itself
  props                   → cheap — reference comparison
  useContext              → medium — cascades; every consumer re-renders on value change
  Zustand (selector)      → cheap — subscribe only to the slice
  Redux (connect/selector)→ cheap with memoized selectors; costly otherwise
</pre>
</div>

<h3>The "state shape" picture</h3>
<p>Prefer <em>normalized</em> state: arrays of ids + a lookup by id, not nested objects. Normalized state makes updates O(1), avoids deep-clone patches, and makes selectors trivial. Redux Toolkit's <code>createEntityAdapter</code> and most modern stores nudge you toward this.</p>
<pre><code class="language-js">// BAD — nested, hard to update a single task
{ todos: [{id:1, tasks: [{id:1, title:'x'}, ...]}] }
// GOOD — normalized
{
  todosById: { 1: { id:1, title:'x', taskIds: [1, 2] } },
  tasksById: { 1: { id:1, ... }, 2: { ... } },
  todoIds: [1, 2, 3]
}</code></pre>

<h3>The "update flow" picture</h3>
<pre><code class="language-js">Action → Reducer (pure) → New state → Selectors re-run → Subscribers re-render</code></pre>
<p>Purity is the key — given the same state and action, you always get the same new state. Easy to test, easy to replay for time-travel.</p>

<h3>The "context vs store" picture</h3>
<p>Context is fine for:</p>
<ul>
  <li>Data that changes rarely (theme, locale, logged-in user).</li>
  <li>Small consumer count.</li>
</ul>
<p>Use a store when:</p>
<ul>
  <li>Data changes often.</li>
  <li>Many components read different slices.</li>
  <li>You want selector-based subscriptions.</li>
  <li>You want DevTools / time-travel / middleware.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Redux is too complex, so I'll use Context everywhere." Context is not a store. Rendering 50 components for a one-field update to a mega-context is worse than learning Zustand. For anything non-trivial, use a library.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>useState vs useReducer</h3>
<ul>
  <li><code>useState</code>: great for one or two fields with simple transitions.</li>
  <li><code>useReducer</code>: better when (a) state has many fields that update together, (b) updates have logic (not just assignment), (c) you want a single "action log" view of transitions.</li>
</ul>
<pre><code class="language-js">function cartReducer(s, a) {
  switch (a.type) {
    case 'add':     return { ...s, items: [...s.items, a.item] };
    case 'remove':  return { ...s, items: s.items.filter(i =&gt; i.id !== a.id) };
    case 'clear':   return { ...s, items: [] };
    default: throw new Error(a.type);
  }
}
const [cart, dispatch] = useReducer(cartReducer, { items: [] });</code></pre>

<h3>Lifting state up</h3>
<pre><code class="language-js">// Parent owns state; children emit events via callbacks.
function Parent() {
  const [value, setValue] = useState('');
  return (
    &lt;&gt;
      &lt;Input value={value} onChange={setValue} /&gt;
      &lt;Preview text={value} /&gt;
    &lt;/&gt;
  );
}</code></pre>
<p>When the shared state is trivial, this is the best pattern. When it's deep or passed through many layers, consider context or a store.</p>

<h3>Context API</h3>
<pre><code class="language-js">const ThemeCtx = createContext('light');

function App() {
  const [theme, setTheme] = useState('dark');
  const value = useMemo(() =&gt; ({ theme, setTheme }), [theme]);
  return &lt;ThemeCtx.Provider value={value}&gt;&lt;Children/&gt;&lt;/ThemeCtx.Provider&gt;;
}

function Toggle() {
  const { theme, setTheme } = useContext(ThemeCtx);
  return &lt;button onClick={() =&gt; setTheme(t =&gt; t === 'light' ? 'dark' : 'light')}&gt;{theme}&lt;/button&gt;;
}</code></pre>
<p>Tips:</p>
<ul>
  <li>Memoize the value to prevent needless re-renders.</li>
  <li>Split contexts by update cadence.</li>
  <li>Consider splitting state and setter into separate contexts — components that only <code>setX</code> don't need to re-render when <code>x</code> changes.</li>
</ul>

<h3>Redux / Redux Toolkit</h3>
<pre><code class="language-js">import { createSlice, configureStore } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    add(s, a) { s.items.push(a.payload); },        // Immer — safe to mutate
    remove(s, a) { s.items = s.items.filter(i =&gt; i.id !== a.payload); },
  }
});

const store = configureStore({ reducer: { cart: cartSlice.reducer } });

// In component:
const items = useSelector(s =&gt; s.cart.items);
const dispatch = useDispatch();
dispatch(cartSlice.actions.add({ id: 1, title: 'x' }));</code></pre>
<p>RTK eliminates most Redux boilerplate — Immer for writes, slices for co-located reducers + actions, built-in Thunks, RTK Query for server state.</p>

<h3>Zustand</h3>
<pre><code class="language-js">import { create } from 'zustand';

const useCart = create((set) =&gt; ({
  items: [],
  add: (item) =&gt; set((s) =&gt; ({ items: [...s.items, item] })),
  remove: (id) =&gt; set((s) =&gt; ({ items: s.items.filter(i =&gt; i.id !== id) })),
}));

// In component — selector for fine-grained subscription:
const items = useCart((s) =&gt; s.items);
const add = useCart((s) =&gt; s.add);
add({ id: 1 });</code></pre>
<p>Minimal API, no provider required, selector-based. Middleware: persist, immer, devtools. Excellent for 90% of apps that don't need Redux's ceremony.</p>

<h3>Jotai (atomic state)</h3>
<pre><code class="language-js">import { atom, useAtom } from 'jotai';
const countAtom = atom(0);
function Comp() { const [count, setCount] = useAtom(countAtom); }</code></pre>
<p>Like <code>useState</code>, but globally shared atoms. Fine-grained reactivity — a component only re-renders for atoms it reads.</p>

<h3>React Query / TanStack Query (server state)</h3>
<pre><code class="language-js">const { data, isLoading, error } = useQuery({
  queryKey: ['user', id],
  queryFn: () =&gt; fetchUser(id),
  staleTime: 60_000,  // how long data is fresh
});
// Automatic: caching, refetch on focus, retries, pagination hooks, mutations with optimistic updates.</code></pre>

<h3>Form state (React Hook Form)</h3>
<pre><code class="language-js">const { register, handleSubmit, formState: { errors } } = useForm();
&lt;form onSubmit={handleSubmit(onSave)}&gt;
  &lt;input {...register('email', { required: true })} /&gt;
  {errors.email &amp;&amp; &lt;small&gt;required&lt;/small&gt;}
&lt;/form&gt;</code></pre>
<p>Uncontrolled inputs, zero re-renders per keystroke, built-in validation. For most forms, far better than rolling state by hand.</p>

<h3>URL state</h3>
<pre><code class="language-js">// React Router
const [params, setParams] = useSearchParams();
const filter = params.get('filter') ?? 'all';

// Or nuqs for typed hooks:
const [filter, setFilter] = useQueryState('filter', parseAsString.withDefault('all'));</code></pre>
<p>Makes state shareable (paste URL), refresh-safe, back-button-safe.</p>

<h3>Decision tree</h3>
<ol>
  <li>Only this component? → <code>useState</code> / <code>useReducer</code>.</li>
  <li>Two siblings? → Lift to common parent.</li>
  <li>Ambient read-mostly (theme, user)? → Context.</li>
  <li>Derived from data? → <code>useMemo</code>.</li>
  <li>From the server? → React Query / SWR.</li>
  <li>In the URL? → search params.</li>
  <li>In a form? → React Hook Form.</li>
  <li>Cross-cutting, updates often, multiple consumers? → Zustand (default) or Redux Toolkit (complex apps).</li>
</ol>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — local state for an open/close</h3>
<pre><code class="language-js">function Modal() {
  const [open, setOpen] = useState(false);
  return (
    &lt;&gt;
      &lt;button onClick={() =&gt; setOpen(true)}&gt;Open&lt;/button&gt;
      {open &amp;&amp; &lt;Dialog onClose={() =&gt; setOpen(false)} /&gt;}
    &lt;/&gt;
  );
}</code></pre>

<h3>Example 2 — lifting state up</h3>
<pre><code class="language-js">function Page() {
  const [query, setQuery] = useState('');
  return (
    &lt;&gt;
      &lt;SearchBox value={query} onChange={setQuery} /&gt;
      &lt;Results query={query} /&gt;
    &lt;/&gt;
  );
}</code></pre>

<h3>Example 3 — useReducer for a complex form</h3>
<pre><code class="language-js">function formReducer(s, a) {
  switch (a.type) {
    case 'field':  return { ...s, [a.name]: a.value };
    case 'submit': return { ...s, submitting: true, error: null };
    case 'error':  return { ...s, submitting: false, error: a.error };
    case 'reset':  return { email: '', password: '' };
    default: return s;
  }
}
const [state, dispatch] = useReducer(formReducer, { email: '', password: '' });</code></pre>

<h3>Example 4 — context for theme</h3>
<pre><code class="language-js">const ThemeCtx = createContext('light');
function ThemedButton() {
  const theme = useContext(ThemeCtx);
  return &lt;button data-theme={theme}&gt;...&lt;/button&gt;;
}</code></pre>

<h3>Example 5 — splitting context for perf</h3>
<pre><code class="language-js">const UserCtx = createContext();
const SetUserCtx = createContext();

function Provider({ children }) {
  const [user, setUser] = useState(null);
  return (
    &lt;UserCtx.Provider value={user}&gt;
      &lt;SetUserCtx.Provider value={setUser}&gt;{children}&lt;/SetUserCtx.Provider&gt;
    &lt;/UserCtx.Provider&gt;
  );
}
// Login button doesn't need user value, only setUser — won't re-render when user changes.</code></pre>

<h3>Example 6 — Redux Toolkit slice</h3>
<pre><code class="language-js">const todosSlice = createSlice({
  name: 'todos',
  initialState: { byId: {}, ids: [] },
  reducers: {
    added: (s, a) =&gt; { s.byId[a.payload.id] = a.payload; s.ids.push(a.payload.id); },
    toggled: (s, a) =&gt; { s.byId[a.payload].done = !s.byId[a.payload].done; },
    removed: (s, a) =&gt; { delete s.byId[a.payload]; s.ids = s.ids.filter(i =&gt; i !== a.payload); },
  }
});</code></pre>

<h3>Example 7 — Zustand store</h3>
<pre><code class="language-js">const useStore = create((set, get) =&gt; ({
  count: 0,
  inc: () =&gt; set((s) =&gt; ({ count: s.count + 1 })),
  double: () =&gt; get().count * 2,
}));
function Count() { return useStore((s) =&gt; s.count); }
function Inc() { const inc = useStore((s) =&gt; s.inc); return &lt;button onClick={inc}&gt;+&lt;/button&gt;; }</code></pre>

<h3>Example 8 — React Query for server state</h3>
<pre><code class="language-js">function Profile({ id }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () =&gt; fetch('/user/' + id).then(r =&gt; r.json()),
  });
  if (isLoading) return &lt;Skeleton/&gt;;
  if (error) return &lt;ErrorBox/&gt;;
  return &lt;div&gt;{data.name}&lt;/div&gt;;
}</code></pre>

<h3>Example 9 — optimistic mutation</h3>
<pre><code class="language-js">const qc = useQueryClient();
const m = useMutation({
  mutationFn: (todo) =&gt; fetch('/todos', { method: 'POST', body: JSON.stringify(todo) }),
  onMutate: async (todo) =&gt; {
    await qc.cancelQueries({ queryKey: ['todos'] });
    const prev = qc.getQueryData(['todos']);
    qc.setQueryData(['todos'], (old) =&gt; [...old, todo]);
    return { prev };
  },
  onError: (_e, _v, ctx) =&gt; qc.setQueryData(['todos'], ctx.prev),
  onSettled: () =&gt; qc.invalidateQueries({ queryKey: ['todos'] }),
});</code></pre>

<h3>Example 10 — React Hook Form</h3>
<pre><code class="language-js">const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
const submit = async (data) =&gt; await api.save(data);
&lt;form onSubmit={handleSubmit(submit)}&gt;
  &lt;input {...register('title', { required: 'Required' })} /&gt;
  {errors.title &amp;&amp; &lt;small&gt;{errors.title.message}&lt;/small&gt;}
  &lt;button disabled={isSubmitting}&gt;Save&lt;/button&gt;
&lt;/form&gt;</code></pre>

<h3>Example 11 — URL state with React Router</h3>
<pre><code class="language-js">const [params, setParams] = useSearchParams();
const sort = params.get('sort') ?? 'date';
&lt;select value={sort} onChange={(e) =&gt; setParams({ sort: e.target.value })}&gt;
  &lt;option value="date"&gt;Date&lt;/option&gt;
  &lt;option value="name"&gt;Name&lt;/option&gt;
&lt;/select&gt;</code></pre>

<h3>Example 12 — derived state done right</h3>
<pre><code class="language-js">function Cart({ items }) {
  const total = useMemo(
    () =&gt; items.reduce((sum, i) =&gt; sum + i.price * i.qty, 0),
    [items]
  );
  return &lt;div&gt;Total: {total}&lt;/div&gt;;
}</code></pre>

<h3>Example 13 — persistent store (Zustand + persist)</h3>
<pre><code class="language-js">import { persist } from 'zustand/middleware';
const useSettings = create(persist(
  (set) =&gt; ({ theme: 'dark', setTheme: (t) =&gt; set({ theme: t }) }),
  { name: 'settings' }
));
// Automatically persists to localStorage and rehydrates on load.</code></pre>

<h3>Example 14 — selector with equality</h3>
<pre><code class="language-js">// Zustand
import { shallow } from 'zustand/shallow';
const { a, b } = useStore((s) =&gt; ({ a: s.a, b: s.b }), shallow);
// shallow equality → re-render only when a or b change (not when c changes)</code></pre>

<h3>Example 15 — cross-tab sync via BroadcastChannel</h3>
<pre><code class="language-js">const bc = new BroadcastChannel('cart');
useStore.subscribe((s) =&gt; bc.postMessage(s.items));
bc.onmessage = (e) =&gt; useStore.setState({ items: e.data });</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Storing server data in Redux</h3>
<p>You'll re-implement caching, revalidation, optimistic updates, retry logic. Each badly. Use React Query / RTK Query / SWR for server data.</p>

<h3>2. Using context for high-frequency updates</h3>
<p>Cursor position, scroll, ticking clock in context → entire app re-renders. Use a store with selector subscriptions, or pass via ref + imperative API.</p>

<h3>3. Nested context providers of the same type</h3>
<pre><code class="language-js">&lt;Theme.Provider value="dark"&gt;&lt;Theme.Provider value="light"&gt;{children}&lt;/Theme.Provider&gt;&lt;/Theme.Provider&gt;
// Inner provider wins for descendants. Works but can be confusing to trace.</code></pre>

<h3>4. useState with object — full replace, not merge</h3>
<pre><code class="language-js">const [user, setUser] = useState({ name: '', age: 0 });
setUser({ name: 'Ada' }); // age is now undefined — no implicit merge
// Fix: setUser(u =&gt; ({ ...u, name: 'Ada' }));</code></pre>
<p>Unlike class <code>setState</code>, <code>useState</code>'s setter replaces entirely. Use spread or reducer.</p>

<h3>5. setState on unmounted component</h3>
<pre><code class="language-js">async function load() {
  const data = await fetch(url); // takes 2s
  setState(data); // user navigated away; component is unmounted → React warns
}</code></pre>
<p>Fix: AbortController, or check a "mounted" ref, or return a cleanup function in useEffect.</p>

<h3>6. Zustand selector returning a new object every call</h3>
<pre><code class="language-js">const { a, b } = useStore((s) =&gt; ({ a: s.a, b: s.b })); // new object each render!
// Add shallow equality:
import { shallow } from 'zustand/shallow';
const { a, b } = useStore((s) =&gt; ({ a: s.a, b: s.b }), shallow);</code></pre>

<h3>7. React Query refetch on focus surprising user</h3>
<p>By default React Query refetches when the window regains focus. For data the user is editing, this can overwrite their input. Set <code>refetchOnWindowFocus: false</code> for those queries.</p>

<h3>8. Using useState for derived data</h3>
<pre><code class="language-js">const [filtered, setFiltered] = useState([]);
useEffect(() =&gt; setFiltered(items.filter(pred)), [items]);
// Extra render, risk of stale. Compute: const filtered = useMemo(() =&gt; items.filter(pred), [items]).</code></pre>

<h3>9. Props as the initial value of state (freezing on mount)</h3>
<pre><code class="language-js">function Comp({ initialCount }) {
  const [n, setN] = useState(initialCount);
  // n is initialCount at mount ONLY; later prop changes don't update n.
}</code></pre>
<p>Intentional often, but can surprise. Use <code>key</code> to reset, or derive from the prop directly.</p>

<h3>10. Circular reducer imports</h3>
<p>Slice A reduces on action from Slice B, and Slice B reduces on action from Slice A → import cycle. RTK's <code>extraReducers</code> + action creators defined in one slice, consumed in many, handle this cleanly.</p>

<h3>11. Redux dispatch during render</h3>
<pre><code class="language-js">function Bad() {
  const dispatch = useDispatch();
  dispatch(action); // infinite renders — action is fired every render
}</code></pre>
<p>Move to useEffect or an event handler.</p>

<h3>12. Persisted store with schema changes</h3>
<p>LocalStorage has yesterday's shape; today's code expects new shape. Use migration logic (both Zustand <code>persist</code> and redux-persist support versioned migrations).</p>

<h3>13. Race conditions with async setState</h3>
<pre><code class="language-js">async function fetchAndSet() {
  const data = await fetch(url);
  setState(data); // what if user changed url while fetching?
}</code></pre>
<p>Pattern: track the "current" request, ignore stale responses. Or use React Query which handles this automatically.</p>

<h3>14. Big state object causing expensive shallow compare</h3>
<p>If a Redux selector returns a huge object, every re-render shallow-compares it. Memoize selectors (Reselect) or slice smaller.</p>

<h3>15. Form state as top-level state</h3>
<p>A page-level <code>useState</code> for every form field → every keystroke re-renders the page. RHF uses uncontrolled inputs; only the input itself rerenders on change.</p>

<h3>16. URL state: encoding complex objects</h3>
<p>Complex objects → base64-JSON → unsafe and ugly. Prefer individual primitive params: <code>?sort=date&amp;dir=desc&amp;filter=active</code>.</p>

<h3>17. Optimistic updates and error rollback</h3>
<p>Write the optimistic value AND store the previous; on error, restore. React Query's <code>onMutate</code>/<code>onError</code> pattern handles this.</p>

<h3>18. Subscriptions leaking across unmounts</h3>
<p>A store subscription registered in useEffect with incorrect cleanup → grows forever. Always return the unsubscribe function.</p>

<h3>19. Shared mutable arrays/objects in state</h3>
<pre><code class="language-js">const [items, setItems] = useState([]);
items.push(x); setItems(items); // same reference → no re-render + hidden mutation
// setItems([...items, x]);</code></pre>

<h3>20. Using context value before mount complete</h3>
<pre><code class="language-js">&lt;Ctx.Provider value={undefined}&gt;...&lt;/Ctx.Provider&gt;
// Consumers must handle the undefined sentinel; or provide a default in createContext.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — dumping everything into Redux</h3>
<p>Server data, form state, animation state, UI open/close — all in Redux. Actions file explodes, reducers mirror server logic, team hates state code. Classify your state.</p>

<h3>Anti-pattern 2 — context as a store</h3>
<p>Mega-context with user + cart + theme + notifications + feature flags. Any update re-renders everything. Split, or use a store.</p>

<h3>Anti-pattern 3 — useState where useMemo would work</h3>
<p>Computed data in state + effect to keep it in sync = two renders + duplicate source of truth. Derive instead.</p>

<h3>Anti-pattern 4 — syncing two useStates of the "same thing"</h3>
<pre><code class="language-js">const [a, setA] = useState(defaultA);
const [b, setB] = useState(defaultA); // duplicate — which is the truth?</code></pre>
<p>Pick one source, derive the other.</p>

<h3>Anti-pattern 5 — mutating state</h3>
<pre><code class="language-js">items.sort();
setItems(items); // same reference — no re-render</code></pre>
<p>Always produce new arrays/objects. Or use Immer (RTK bundles it).</p>

<h3>Anti-pattern 6 — using Context for just avoiding prop drilling</h3>
<p>If the state only travels through 2-3 components, props are fine. Don't promote every variable to a context.</p>

<h3>Anti-pattern 7 — caching in useState that should be a server-state query</h3>
<pre><code class="language-js">const [users, setUsers] = useState([]);
useEffect(() =&gt; fetch('/users').then(r =&gt; r.json()).then(setUsers), []);</code></pre>
<p>Every component needs its own copy, no cache, no revalidation. Use React Query.</p>

<h3>Anti-pattern 8 — non-normalized nested state</h3>
<pre><code class="language-js">// BAD
{ orders: [{ id, items: [{ id, product: { id, ... } }] }] }</code></pre>
<p>Updating one product nested 3 levels deep requires surgical copying. Normalize.</p>

<h3>Anti-pattern 9 — Redux Thunk abuse for flows</h3>
<p>Long sequences of dispatch → await → dispatch in a thunk. Prefer state machines (XState) or simply server-state (React Query handles most of this).</p>

<h3>Anti-pattern 10 — props as initial state without meaning to</h3>
<pre><code class="language-js">function View({ user }) {
  const [u, setU] = useState(user); // diverges from prop on parent updates</code></pre>
<p>Only seed state from props intentionally (and usually with a <code>key</code> on the parent to reset).</p>

<h3>Anti-pattern 11 — selector returns new object each time</h3>
<pre><code class="language-js">const { x, y } = useStore((s) =&gt; ({ x: s.x, y: s.y }));
// new object each render → component always re-renders</code></pre>
<p>Use <code>shallow</code> equality or select primitives separately.</p>

<h3>Anti-pattern 12 — dispatching side effects from reducers</h3>
<p>Reducers must be pure. Side effects (network, localStorage, logging) belong in middleware, thunks, or event handlers. Otherwise time-travel debugging is broken.</p>

<h3>Anti-pattern 13 — using form libraries for trivial forms</h3>
<p>A 1-field form doesn't need React Hook Form. <code>useState</code> is fine. Reach for the library when validation / field arrays / dynamic fields / touched tracking are needed.</p>

<h3>Anti-pattern 14 — URL-synced state via useEffect loop</h3>
<pre><code class="language-js">useEffect(() =&gt; setParams({ q }), [q]);
useEffect(() =&gt; setQ(params.get('q')), [params]);
// Ping-pong. Use a single source — the URL — with useSearchParams.</code></pre>

<h3>Anti-pattern 15 — no persistence strategy</h3>
<p>User's draft, cart, filters lost on reload. Plan persistence: URL (filters), localStorage (cart, drafts), server (user profile). Each has different requirements — don't stuff everything into localStorage.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you decide where to put a piece of state?</div>
  <div class="qa-answer">
    <p>Ask: who owns it, who reads it, how often does it change?</p>
    <ol>
      <li>Single component? <code>useState</code>.</li>
      <li>Siblings need it? Lift to common parent.</li>
      <li>Server-sourced? React Query / SWR.</li>
      <li>In URL (shareable)? search params.</li>
      <li>Form? React Hook Form / Formik.</li>
      <li>Ambient read-mostly (theme, user, locale)? Context.</li>
      <li>Cross-cutting, updated often, many consumers? Zustand / Redux.</li>
    </ol>
    <p>Mis-classifying is the main source of "bad state architecture."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. When would you pick Redux over Context?</div>
  <div class="qa-answer">
    <p>When you need selector-based subscriptions (components read specific slices without re-rendering on unrelated changes), DevTools and time-travel debugging, middleware for logging/async/persistence, or strong patterns for a team. Also when the state graph is complex enough that a formal action/reducer pattern aids readability. For simpler "needs global state but nothing fancy," Zustand or Jotai is lighter.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What's wrong with useState for server data?</div>
  <div class="qa-answer">
    <p>No caching — every component refetches. No deduplication — concurrent components making the same request each fire it. No revalidation — data goes stale silently. No error retry, no optimistic updates, no background refetch. You end up building a bad cache. React Query / SWR solve all this out of the box.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you prevent a big Context from causing re-renders?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Split by cadence:</strong> UserCtx (rare changes), CartCtx (moderate), NotificationsCtx (frequent).</li>
      <li><strong>Split state and setter:</strong> components that only setX don't re-render on X changes.</li>
      <li><strong>Memoize the value:</strong> <code>useMemo(() =&gt; ({x, setX}), [x])</code>.</li>
      <li><strong>Switch to a store with selectors</strong> when consumers only care about slices.</li>
      <li><strong>Use use-context-selector</strong> library for context-with-selectors.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Zustand vs Redux Toolkit — which and when?</div>
  <div class="qa-answer">
    <p>Zustand: small API, no provider boilerplate, direct mutation via set, selectors out of the box. Fast to add, easy to adopt incrementally. My default for small-medium apps.</p>
    <p>Redux Toolkit: richer ecosystem (RTK Query, middleware, DevTools, Redux patterns), strict action/reducer pattern, better fit for large teams where consistency matters. More ceremony but battle-tested.</p>
    <p>Zustand's "no ceremony" is actually a tradeoff: less structure to maintain as the app grows. Redux's patterns are good documentation of "here's how state changes."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What's derived state and why avoid storing it?</div>
  <div class="qa-answer">
    <p>Derived state is data computed from other state. Example: <code>total = items.reduce(...)</code>. Storing it in <code>useState</code> requires a matching <code>useEffect</code> to recompute whenever sources change — extra render, possibility of stale state. Instead derive during render with <code>useMemo</code> or plain expressions. Only store in state what has independent identity (user typed it, server returned it, user clicked it).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What's lifting state up?</div>
  <div class="qa-answer">
    <p>A pattern where two components that need the same state have it owned by their closest common ancestor and pass it down via props (and callbacks to modify). Keeps one source of truth. Alternative to both owning copies and syncing them (which creates bugs).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How would you manage a cart across the site?</div>
  <div class="qa-answer">
    <p>Depends on requirements:</p>
    <ul>
      <li><strong>Anonymous, client-only:</strong> Zustand with <code>persist</code> middleware to localStorage. Simple, fast.</li>
      <li><strong>Logged-in, synced server-side:</strong> React Query for the cart data from the server; optimistic updates on add/remove mutations.</li>
      <li><strong>Both:</strong> hybrid — local cart until sign-in, merge on login. RTK Query or React Query plus a small local store.</li>
    </ul>
    <p>Don't put cart logic in Context; consumers across the app would re-render on every item change.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you avoid prop drilling?</div>
  <div class="qa-answer">
    <p>Options in order of preference:</p>
    <ol>
      <li><strong>Composition:</strong> pass JSX children instead of props (<code>&lt;Layout&gt;&lt;Content/&gt;&lt;/Layout&gt;</code>).</li>
      <li><strong>Context</strong> for ambient values (theme, user).</li>
      <li><strong>Store</strong> for broadly-needed data.</li>
    </ol>
    <p>Don't reach for Context just to save typing 2 prop hops — it costs re-renders and readability.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Explain normalized state with an example.</div>
  <div class="qa-answer">
<pre><code class="language-js">// Denormalized
{ todos: [{ id:1, title:'x', user: { id:10, name:'Ada' } }] }
// Normalized
{
  todosById: { 1: { id:1, title:'x', userId:10 } },
  todoIds: [1],
  usersById: { 10: { id:10, name:'Ada' } }
}</code></pre>
    <p>Updating a user's name updates <em>one</em> entry, not every todo referencing it. Adding/removing is O(1). Selectors compose. Redux Toolkit's <code>createEntityAdapter</code> generates helpers for this shape.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Why is Immer (used in RTK) helpful?</div>
  <div class="qa-answer">
    <p>Immer lets reducers write "mutating" code (<code>s.items.push(x)</code>) while producing immutable new state under the hood via a proxy. Eliminates the <code>{ ...s, items: [...s.items, x] }</code> copy-fest. Keeps logic readable, avoids deep-spread bugs. Slight runtime cost, usually negligible.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What's optimistic update and how do you implement it?</div>
  <div class="qa-answer">
    <p>Show the result of a mutation in the UI before the server confirms. If the server rejects, roll back. Pattern (React Query):</p>
<pre><code class="language-js">useMutation({
  onMutate: async (newItem) =&gt; {
    await qc.cancelQueries(['items']);
    const prev = qc.getQueryData(['items']);
    qc.setQueryData(['items'], (old) =&gt; [...old, newItem]);
    return { prev };   // rollback context
  },
  onError: (_e, _v, ctx) =&gt; qc.setQueryData(['items'], ctx.prev),
  onSettled: () =&gt; qc.invalidateQueries(['items']),
});</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Why prefer URL state for filters/sort?</div>
  <div class="qa-answer">
    <p>Shareable (paste URL to show the filtered view to a colleague), refresh-safe, back-button-safe, SEO-friendly. In-memory state loses all of that. Pair with a server-state library: URL drives the query key, React Query caches responses per key.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What's "server components state" vs client state in React 19?</div>
  <div class="qa-answer">
    <p>React Server Components run on the server; they can directly read from a database or call services, producing a tree that's streamed to the client. No client-side fetching. "Server state" is baked into the HTML the user receives. Client components (the usual) still use <code>useState</code>, <code>useContext</code>, stores. The split simplifies data fetching: don't need React Query for data that's available server-side. Mutations still go through Server Actions, which return new state via subsequent RSC renders.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. You inherited a React app where every page uses Redux for 80% unnecessary things. What's your refactor plan?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Classify</strong> each slice: server data, form, UI, domain.</li>
      <li><strong>Server data</strong> slices → migrate to React Query (or RTK Query). Delete async thunks.</li>
      <li><strong>Form</strong> slices → React Hook Form. Delete reducers.</li>
      <li><strong>UI toggle/open/close</strong> → local <code>useState</code>.</li>
      <li><strong>Domain</strong> slices stay in Redux (or migrate to Zustand if the logic is light).</li>
      <li>Do this slice-by-slice; keep the app running; write tests as a safety net.</li>
      <li>Document the "where state lives" classification so new features don't accidentally go back to Redux.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish server, form, URL, UI, and domain state.</li>
    <li>You explain why Context ≠ Store.</li>
    <li>You reach for React Query for server data, not Redux.</li>
    <li>You know the lifting-state-up pattern.</li>
    <li>You prefer derived state over synced state.</li>
    <li>You pick Zustand vs Redux with clear reasoning (simplicity vs ecosystem).</li>
    <li>You know RTK's <code>createSlice</code> and <code>createEntityAdapter</code>.</li>
    <li>You can implement optimistic updates with rollback.</li>
  </ul>
</div>
`}

]
});
