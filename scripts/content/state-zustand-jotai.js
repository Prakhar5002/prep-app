window.PREP_SITE.registerTopic({
  id: 'state-zustand-jotai',
  module: 'state-deep',
  title: 'Zustand & Jotai',
  estimatedReadTime: '40 min',
  tags: ['zustand', 'jotai', 'state-management', 'atoms', 'stores', 'react', 'minimalist', 'recoil', 'valtio'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Zustand</strong> and <strong>Jotai</strong> are the modern minimalist alternatives to Redux. Both are made by the same author (Daishi Kato). Both fit cleanly with React 18+ and Suspense. Both are 1-3 KB. The difference is the mental model: Zustand has <em>stores</em> (one or more); Jotai has <em>atoms</em> (composable atomic units).</p>
<ul>
  <li><strong>Zustand</strong> — single-store-per-domain, hook-based, no providers, ~1KB. The closest "Redux but small" experience.</li>
  <li><strong>Jotai</strong> — atomic state à la Recoil, composable derivations, automatic dependency tracking, Suspense-friendly. Most ergonomic for fine-grained state.</li>
  <li><strong>Both:</strong> no boilerplate, no actions/reducers, no provider tree (Jotai has one optional Provider for testing/SSR).</li>
  <li><strong>Pick Zustand</strong> when state is "one big object per feature" and you want simple subscriptions.</li>
  <li><strong>Pick Jotai</strong> when state is naturally composed from many small pieces and you want React-native dependency tracking.</li>
  <li><strong>Performance:</strong> both subscribe at the value level, not the provider level — far fewer re-renders than Context.</li>
  <li><strong>Persistence, devtools, async, middleware</strong> — both support, with their own ergonomics.</li>
  <li><strong>Adjacent libraries:</strong> Valtio (proxy-based), Recoil (Meta, atoms but heavier), Nanostores (framework-agnostic).</li>
</ul>
<p><strong>Mantra:</strong> "Zustand for stores. Jotai for atoms. Pick by mental model, not benchmarks."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The minimalist movement</h3>
<p>Around 2020-2022, the React community pushed back against Redux's verbosity. Three observations crystallized:</p>
<ol>
  <li>Most apps use Redux for ~5% of features but pay the boilerplate tax across all of them.</li>
  <li>Server state should live in React Query, not Redux.</li>
  <li>What remains — local UI state, cross-feature client state — could be solved with much smaller libraries.</li>
</ol>
<p>Zustand (2019) and Jotai (2020) emerged in this space, alongside Recoil, Valtio, and others.</p>

<h3>What is Zustand?</h3>
<p>A 1KB store-based state library. You define a store with state and actions. Components subscribe via hooks; only the slices they read trigger re-renders.</p>
<pre><code class="language-js">import { create } from 'zustand';

const useCart = create((set) =&gt; ({
  items: [],
  addItem: (item) =&gt; set((s) =&gt; ({ items: [...s.items, item] })),
  clear: () =&gt; set({ items: [] }),
}));

// Component
const items = useCart((s) =&gt; s.items);          // re-renders only when items change
const addItem = useCart((s) =&gt; s.addItem);
</code></pre>

<h3>What is Jotai?</h3>
<p>A 3KB atomic state library inspired by Recoil. State is broken into "atoms" — primitive values or computed pieces that automatically track their dependencies.</p>
<pre><code class="language-js">import { atom, useAtom, useAtomValue } from 'jotai';

const countAtom = atom(0);
const doubledAtom = atom((get) =&gt; get(countAtom) * 2);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubled = useAtomValue(doubledAtom);    // auto-recomputes when count changes
  return &lt;button onClick={() =&gt; setCount(c =&gt; c + 1)}&gt;{count} → {doubled}&lt;/button&gt;;
}
</code></pre>

<h3>Why choose them over Redux</h3>
<table>
  <thead><tr><th>Reason</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Less boilerplate</td><td>No actions, reducers, dispatch. State and updates inline.</td></tr>
    <tr><td>Smaller bundle</td><td>Zustand ~1KB, Jotai ~3KB. Redux + RTK ~12KB+.</td></tr>
    <tr><td>No provider tree</td><td>Zustand: zero providers. Jotai: optional one for tests/SSR.</td></tr>
    <tr><td>React-friendly subscription</td><td>Re-renders only when subscribed slice changes; no Context fan-out.</td></tr>
    <tr><td>Suspense / Concurrent</td><td>Both work seamlessly with React 18 features.</td></tr>
    <tr><td>TypeScript-friendly</td><td>Generics inferred; no manual <code>RootState</code>/<code>AppDispatch</code> typing.</td></tr>
  </tbody>
</table>

<h3>Why choose Redux over them</h3>
<ul>
  <li>Existing large Redux codebase — don't migrate for fashion.</li>
  <li>Need time-travel debugging at the action level.</li>
  <li>Strong cross-team conventions; Redux is well-documented and consistent.</li>
  <li>Need RTK Query specifically (Jotai/Zustand pair with React Query for server state).</li>
</ul>

<h3>Why interviewers ask</h3>
<ol>
  <li>State-management modernization is a frequent interview topic.</li>
  <li>Tests architectural reasoning: "what state lives where?"</li>
  <li>Atomic vs store-based mental models surface library design taste.</li>
  <li>Performance: candidates who know about subscription granularity stand out.</li>
  <li>Mobile-relevant: both libraries fit RN well; small bundles matter on mobile.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>Zustand: feature-local stores; subscribe to specific slices only; use immer middleware for nested updates.</li>
  <li>Jotai: atoms colocated with features; derived atoms for computed state; <code>atomWithStorage</code> for persistence; Suspense-aware async atoms.</li>
  <li>You can defend the choice between Zustand and Jotai for a specific scenario.</li>
  <li>You don't put server state in either — use React Query for that.</li>
  <li>You don't put deeply local UI state (modal open/close) in global stores.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Zustand: store-based</h3>
<p>One (or a few) stores per domain. Each store is a hook with state + actions. Components call the hook with a selector to read; subscriptions are at the selector level.</p>
<pre><code class="language-text">┌─────────────────────────┐
│      useCart store      │
│  state: { items, ... }  │
│  actions: { addItem, ...│
└─────────────┬───────────┘
              │
   subscribe via selector
              │
       ┌──────┴──────┐
       ▼             ▼
  Component A   Component B
  (reads items) (reads count)
</code></pre>
<p>Zustand uses <em>shallow equality</em> by default; you can pass <code>shallow</code> to compare object slices.</p>

<h3>Jotai: atom-based</h3>
<p>State is a directed graph of atoms. Primitive atoms hold values; derived atoms compute from other atoms (and re-derive automatically).</p>
<pre><code class="language-text">  countAtom (primitive)
       │
       ├────► doubledAtom (derived: count * 2)
       │
       └────► quadAtom (derived from doubledAtom: doubled * 2)

Updating countAtom → doubledAtom recomputes → quadAtom recomputes.
Components subscribed to quadAtom re-render; not those subscribed only to countAtom.
</code></pre>

<h3>The "where is state?" question</h3>
<table>
  <thead><tr><th>Layer</th><th>Best fit</th></tr></thead>
  <tbody>
    <tr><td>Strictly local UI (modal open, focused, hovered)</td><td><code>useState</code></td></tr>
    <tr><td>Form state for one form</td><td><code>useReducer</code> or react-hook-form</td></tr>
    <tr><td>Cross-component but feature-local</td><td>Zustand (one store) or Jotai (a few atoms)</td></tr>
    <tr><td>Cross-feature global</td><td>Zustand (multiple stores) or Jotai (atom collection)</td></tr>
    <tr><td>Server state</td><td>React Query / TanStack Query</td></tr>
    <tr><td>Complex transitions / state machines</td><td>XState</td></tr>
    <tr><td>Audit log + undo + cross-feature</td><td>Redux</td></tr>
  </tbody>
</table>

<h3>Subscription granularity — why it beats Context</h3>
<p>React Context re-renders <em>all</em> consumers when its value changes. Selector-based libraries only re-render components whose selector output changed. The diff:</p>
<pre><code class="language-text">100 components subscribed to a context.
Context value mutates → all 100 re-render → measurable jank.

100 components subscribed to a Zustand store via selectors,
each reading a different slice.
One slice changes → only the components reading that slice re-render.
</code></pre>

<h3>Zustand actions live with state</h3>
<pre><code class="language-js">const useStore = create((set, get) =&gt; ({
  items: [],
  count: 0,
  // actions are part of the store
  addItem: (item) =&gt; set((s) =&gt; ({ items: [...s.items, item] })),
  reset: () =&gt; set({ items: [], count: 0 }),
  // can read current state via get()
  contains: (id) =&gt; get().items.some((i) =&gt; i.id === id),
}));
</code></pre>

<h3>Jotai derived atoms (read)</h3>
<pre><code class="language-js">const cartAtom = atom([]);
const totalAtom = atom((get) =&gt; get(cartAtom).reduce((s, i) =&gt; s + i.price, 0));
const isEmptyAtom = atom((get) =&gt; get(cartAtom).length === 0);
</code></pre>

<h3>Jotai writable derived (read + write)</h3>
<pre><code class="language-js">const tempCAtom = atom(20);
const tempFAtom = atom(
  (get) =&gt; get(tempCAtom) * 9 / 5 + 32,           // read
  (get, set, newF) =&gt; set(tempCAtom, (newF - 32) * 5 / 9)   // write
);
</code></pre>

<h3>Jotai atomic shape</h3>
<p>Most apps end up with a directory like:</p>
<pre><code class="language-text">atoms/
  auth.ts          // userAtom, tokenAtom, isLoggedInAtom
  cart.ts          // cartAtom, totalAtom, itemCountAtom
  preferences.ts   // themeAtom, languageAtom
  ui.ts            // sidebarOpenAtom, modalAtom
</code></pre>

<h3>The "subscribe" or "snapshot" question</h3>
<p>Both libraries internally use React's <code>useSyncExternalStore</code> (since React 18). This guarantees correct concurrent-rendering behavior. You don't have to think about it; just know that's why subscription is robust.</p>

<h3>Async in Zustand vs Jotai</h3>
<table>
  <thead><tr><th>Zustand</th><th>Jotai</th></tr></thead>
  <tbody>
    <tr><td>Actions can be async; you call them and update state when promise resolves.</td><td>Async atoms (<code>atom(async (get) =&gt; ...)</code>) integrate with Suspense; the consuming component suspends until resolved.</td></tr>
    <tr><td><code>set({ loading: true })</code> patterns are explicit.</td><td>Suspense handles loading; no explicit flags.</td></tr>
  </tbody>
</table>

<h3>The "single global vs many local stores" question</h3>
<ul>
  <li>Zustand: many small stores (per feature). They don't compose, but communication via direct imports is fine.</li>
  <li>Jotai: many small atoms; cross-atom composition is the design.</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Zustand basics</h3>
<pre><code class="language-ts">import { create } from 'zustand';

interface CartState {
  items: { sku: string; qty: number }[];
  total: number;
  addItem: (sku: string) =&gt; void;
  clear: () =&gt; void;
}

export const useCart = create&lt;CartState&gt;((set, get) =&gt; ({
  items: [],
  total: 0,
  addItem: (sku) =&gt; set((s) =&gt; {
    const items = [...s.items, { sku, qty: 1 }];
    return { items, total: items.length };
  }),
  clear: () =&gt; set({ items: [], total: 0 }),
}));

// Usage
function Cart() {
  const items = useCart((s) =&gt; s.items);
  const addItem = useCart((s) =&gt; s.addItem);
  // ...
}
</code></pre>

<h3>Zustand with Immer middleware</h3>
<pre><code class="language-ts">import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useStore = create&lt;State&gt;()(
  immer((set) =&gt; ({
    nested: { items: [] },
    addItem: (item) =&gt; set((s) =&gt; { s.nested.items.push(item); }),   // mutating syntax; Immer makes immutable
  }))
);
</code></pre>

<h3>Zustand persistence</h3>
<pre><code class="language-ts">import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuth = create(
  persist&lt;AuthState&gt;(
    (set) =&gt; ({
      token: null,
      login: (token) =&gt; set({ token }),
      logout: () =&gt; set({ token: null }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() =&gt; AsyncStorage),
      partialize: (state) =&gt; ({ token: state.token }),   // only persist token
    }
  )
);
</code></pre>

<h3>Zustand DevTools</h3>
<pre><code class="language-ts">import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useStore = create&lt;State&gt;()(
  devtools(
    (set) =&gt; ({ /* ... */ }),
    { name: 'CartStore' }
  )
);
</code></pre>

<h3>Zustand selectors with shallow equality</h3>
<pre><code class="language-ts">import { useShallow } from 'zustand/react/shallow';

function Profile() {
  // Selecting multiple fields — without shallow, returns new object each time
  const { name, email } = useStore(
    useShallow((s) =&gt; ({ name: s.user.name, email: s.user.email }))
  );
  // ...
}
</code></pre>

<h3>Zustand outside React</h3>
<pre><code class="language-ts">// Read state
const { items } = useCart.getState();

// Update state
useCart.setState({ items: [] });

// Subscribe to changes
const unsubscribe = useCart.subscribe((state, prev) =&gt; {
  if (state.items !== prev.items) console.log('items changed');
});
unsubscribe();
</code></pre>

<h3>Jotai basics</h3>
<pre><code class="language-tsx">import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

const countAtom = atom(0);

function Display() {
  const count = useAtomValue(countAtom);   // read-only
  return &lt;span&gt;{count}&lt;/span&gt;;
}

function Buttons() {
  const setCount = useSetAtom(countAtom);   // write-only
  return &lt;&gt;
    &lt;button onClick={() =&gt; setCount(c =&gt; c + 1)}&gt;+&lt;/button&gt;
    &lt;button onClick={() =&gt; setCount(c =&gt; c - 1)}&gt;-&lt;/button&gt;
  &lt;/&gt;;
}

function Combined() {
  const [count, setCount] = useAtom(countAtom);   // both
  // ...
}
</code></pre>

<h3>Jotai derived atoms</h3>
<pre><code class="language-ts">// Read-only derived
const doubledAtom = atom((get) =&gt; get(countAtom) * 2);

// Read-write derived
const upperNameAtom = atom(
  (get) =&gt; get(nameAtom).toUpperCase(),
  (get, set, newName: string) =&gt; set(nameAtom, newName.toLowerCase())
);

// Multiple dependencies
const summaryAtom = atom((get) =&gt; ({
  count: get(countAtom),
  user: get(userAtom),
  greeting: \`Hello \${get(userAtom).name}, count is \${get(countAtom)}\`,
}));
</code></pre>

<h3>Jotai async atoms (with Suspense)</h3>
<pre><code class="language-tsx">const userAtom = atom(async (get) =&gt; {
  const id = get(userIdAtom);
  const r = await fetch(\`/api/users/\${id}\`);
  return r.json();
});

function Profile() {
  const user = useAtomValue(userAtom);   // suspends until resolved
  return &lt;div&gt;{user.name}&lt;/div&gt;;
}

// Wrap in Suspense
&lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
  &lt;Profile /&gt;
&lt;/Suspense&gt;
</code></pre>

<h3>Jotai persistence</h3>
<pre><code class="language-ts">import { atomWithStorage } from 'jotai/utils';

const themeAtom = atomWithStorage('theme', 'light');
// Reads from localStorage on init; writes back on every update.

// On RN with AsyncStorage:
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const themeAtom = atomWithStorage(
  'theme',
  'light',
  createJSONStorage(() =&gt; AsyncStorage)
);
</code></pre>

<h3>Jotai utilities</h3>
<pre><code class="language-ts">import { atomWithDefault, atomWithReducer, splitAtom, atomFamily, loadable, useReducerAtom } from 'jotai/utils';

// Default that depends on other atoms
const themeWithDefault = atomWithDefault((get) =&gt; get(systemThemeAtom));

// Reducer-style atom
const counterAtom = atomWithReducer(0, (state, action) =&gt; {
  if (action === 'inc') return state + 1;
  if (action === 'dec') return state - 1;
  return state;
});

// Split an array atom into per-item atoms
const todosAtom = atom([{ id: 1, text: 'a' }, { id: 2, text: 'b' }]);
const todoAtomsAtom = splitAtom(todosAtom);
// Each todo gets its own atom; render list with stable references

// Family — parameterized atoms
const userAtomFamily = atomFamily((id: string) =&gt; atom(async () =&gt; {
  const r = await fetch(\`/api/users/\${id}\`);
  return r.json();
}));

// loadable — convert async atom to { state: 'loading' | 'hasData' | 'hasError' }
const userLoadableAtom = loadable(userAtom);
const result = useAtomValue(userLoadableAtom);
if (result.state === 'loading') return &lt;Spinner /&gt;;
if (result.state === 'hasError') return &lt;Error error={result.error} /&gt;;
return &lt;div&gt;{result.data.name}&lt;/div&gt;;
</code></pre>

<h3>Jotai store and Provider (testing / SSR)</h3>
<pre><code class="language-tsx">import { Provider, createStore } from 'jotai';

const store = createStore();
store.set(themeAtom, 'dark');

function App() {
  return (
    &lt;Provider store={store}&gt;
      &lt;Root /&gt;
    &lt;/Provider&gt;
  );
}

// Without Provider, atoms use a default global store.
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Auth slice (Zustand)</h3>
<pre><code class="language-ts">interface AuthState {
  token: string | null;
  user: User | null;
  status: 'unauth' | 'auth' | 'refreshing';
  login: (creds: Creds) =&gt; Promise&lt;void&gt;;
  logout: () =&gt; void;
}

export const useAuth = create&lt;AuthState&gt;()(
  persist(
    (set) =&gt; ({
      token: null,
      user: null,
      status: 'unauth',
      login: async (creds) =&gt; {
        set({ status: 'refreshing' });
        const r = await api.login(creds);
        set({ token: r.token, user: r.user, status: 'auth' });
      },
      logout: () =&gt; set({ token: null, user: null, status: 'unauth' }),
    }),
    { name: 'auth', storage: createJSONStorage(() =&gt; AsyncStorage) }
  )
);
</code></pre>

<h3>Example 2: Cart with derived total (Jotai)</h3>
<pre><code class="language-ts">const cartAtom = atom&lt;{ sku: string; qty: number; price: number }[]&gt;([]);
const totalAtom = atom((get) =&gt; get(cartAtom).reduce((s, i) =&gt; s + i.price * i.qty, 0));
const itemCountAtom = atom((get) =&gt; get(cartAtom).reduce((s, i) =&gt; s + i.qty, 0));

const addItemAtom = atom(null, (get, set, item: { sku: string; price: number }) =&gt; {
  const current = get(cartAtom);
  const existing = current.find((i) =&gt; i.sku === item.sku);
  if (existing) {
    set(cartAtom, current.map((i) =&gt; i.sku === item.sku ? { ...i, qty: i.qty + 1 } : i));
  } else {
    set(cartAtom, [...current, { ...item, qty: 1 }]);
  }
});

// Component
function CartTotal() {
  const total = useAtomValue(totalAtom);
  return &lt;span&gt;\${total.toFixed(2)}&lt;/span&gt;;
}

function AddToCart({ item }) {
  const addItem = useSetAtom(addItemAtom);
  return &lt;button onClick={() =&gt; addItem(item)}&gt;Add&lt;/button&gt;;
}
</code></pre>

<h3>Example 3: Theme toggle with persistence (Jotai)</h3>
<pre><code class="language-ts">const themeAtom = atomWithStorage&lt;'light' | 'dark' | 'auto'&gt;('theme', 'auto');

const effectiveThemeAtom = atom((get) =&gt; {
  const t = get(themeAtom);
  if (t === 'auto') return get(systemThemeAtom);
  return t;
});

function ThemeButton() {
  const [theme, setTheme] = useAtom(themeAtom);
  return &lt;button onClick={() =&gt; setTheme(t =&gt; t === 'light' ? 'dark' : 'light')}&gt;{theme}&lt;/button&gt;;
}
</code></pre>

<h3>Example 4: Modal manager (Zustand)</h3>
<pre><code class="language-ts">interface ModalState {
  open: { id: string; props: any } | null;
  show: (id: string, props?: any) =&gt; void;
  hide: () =&gt; void;
}

export const useModal = create&lt;ModalState&gt;((set) =&gt; ({
  open: null,
  show: (id, props = {}) =&gt; set({ open: { id, props } }),
  hide: () =&gt; set({ open: null }),
}));

// Usage anywhere
useModal.getState().show('confirmDelete', { onConfirm: () =&gt; ... });
</code></pre>

<h3>Example 5: Async user fetch (Jotai)</h3>
<pre><code class="language-tsx">const userIdAtom = atom('u1');
const userAtom = atom(async (get) =&gt; {
  const id = get(userIdAtom);
  const r = await fetch(\`/api/users/\${id}\`);
  if (!r.ok) throw new Error('User not found');
  return r.json();
});

function Profile() {
  const user = useAtomValue(userAtom);   // suspends
  return &lt;div&gt;{user.name}&lt;/div&gt;;
}

function Wrapper() {
  return (
    &lt;ErrorBoundary fallback={&lt;ErrorState /&gt;}&gt;
      &lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
        &lt;Profile /&gt;
      &lt;/Suspense&gt;
    &lt;/ErrorBoundary&gt;
  );
}
</code></pre>

<h3>Example 6: Atom family for dynamic items (Jotai)</h3>
<pre><code class="language-ts">const todoAtomFamily = atomFamily((id: string) =&gt; atom({ id, text: '', done: false }));

// Component for one todo
function TodoItem({ id }: { id: string }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id));
  return (
    &lt;div&gt;
      &lt;input type="checkbox" checked={todo.done}
        onChange={(e) =&gt; setTodo({ ...todo, done: e.target.checked })} /&gt;
      &lt;span&gt;{todo.text}&lt;/span&gt;
    &lt;/div&gt;
  );
}

// List
const todoIdsAtom = atom(['t1', 't2', 't3']);
function TodoList() {
  const ids = useAtomValue(todoIdsAtom);
  return &lt;&gt;{ids.map(id =&gt; &lt;TodoItem key={id} id={id} /&gt;)}&lt;/&gt;;
}
</code></pre>

<h3>Example 7: Zustand subscribing outside React</h3>
<pre><code class="language-ts">// Useful for analytics, side effects
useAuth.subscribe((state, prev) =&gt; {
  if (!prev.user &amp;&amp; state.user) {
    analytics.identify(state.user.id);
  }
  if (prev.user &amp;&amp; !state.user) {
    analytics.reset();
  }
});
</code></pre>

<h3>Example 8: Combining Zustand + React Query</h3>
<pre><code class="language-tsx">// Zustand for client state
const useFilter = create((set) =&gt; ({
  category: 'all',
  setCategory: (c) =&gt; set({ category: c }),
}));

// React Query for server state
function ProductList() {
  const category = useFilter((s) =&gt; s.category);
  const { data } = useQuery({
    queryKey: ['products', category],
    queryFn: () =&gt; api.getProducts(category),
  });
  return &lt;ul&gt;...&lt;/ul&gt;;
}
</code></pre>

<h3>Example 9: Jotai split atom for list rendering</h3>
<pre><code class="language-ts">const todosAtom = atom([{ id: 1, text: 'a' }, { id: 2, text: 'b' }]);
const todoAtomsAtom = splitAtom(todosAtom);

function TodoListItem({ todoAtom }: { todoAtom: PrimitiveAtom&lt;Todo&gt; }) {
  const [todo, setTodo] = useAtom(todoAtom);
  // mutating one item only re-renders this component
}

function TodoList() {
  const [todoAtoms] = useAtom(todoAtomsAtom);
  return &lt;&gt;{todoAtoms.map((a, i) =&gt; &lt;TodoListItem key={i} todoAtom={a} /&gt;)}&lt;/&gt;;
}
</code></pre>

<h3>Example 10: Migration sketch — Redux to Zustand</h3>
<pre><code class="language-ts">// Before (RTK slice)
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addItem: (s, a) =&gt; { s.items.push(a.payload); },
    clear: (s) =&gt; { s.items = []; },
  },
});

// After (Zustand store)
const useCart = create&lt;{ items: Item[]; addItem: (i: Item) =&gt; void; clear: () =&gt; void }&gt;()(
  immer((set) =&gt; ({
    items: [],
    addItem: (i) =&gt; set((s) =&gt; { s.items.push(i); }),
    clear: () =&gt; set((s) =&gt; { s.items = []; }),
  }))
);
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Selector returning fresh references (Zustand)</h3>
<pre><code class="language-ts">// BAD — new object every call → re-renders
const { name, email } = useStore((s) =&gt; ({ name: s.user.name, email: s.user.email }));

// GOOD — useShallow
const { name, email } = useStore(useShallow((s) =&gt; ({ name: s.user.name, email: s.user.email })));

// Or select primitives separately
const name = useStore((s) =&gt; s.user.name);
const email = useStore((s) =&gt; s.user.email);
</code></pre>

<h3>Atom-family memory leaks (Jotai)</h3>
<p><code>atomFamily</code> caches atoms by parameter; cache grows unbounded. Use <code>family.remove(id)</code> when an item is deleted, or <code>family.setShouldRemove((createdAt, param) =&gt; ...)</code>.</p>

<h3>Async atom suspends parent component (Jotai)</h3>
<p>An async atom causes the consuming component to suspend. If you don't want suspense (e.g., inline loading), use <code>loadable</code>:</p>
<pre><code class="language-ts">const userLoadableAtom = loadable(userAtom);
const result = useAtomValue(userLoadableAtom);
// result.state: 'loading' | 'hasData' | 'hasError'
</code></pre>

<h3>SSR hydration (both)</h3>
<p>Server-render with default values; client hydrates and may differ. Solutions:</p>
<ul>
  <li>Zustand: use <code>persist</code> with <code>onRehydrateStorage</code> callback; defer hydration-dependent UI until ready.</li>
  <li>Jotai: use <code>useHydrateAtoms</code> to seed client store from SSR.</li>
</ul>

<h3>Multiple stores referencing each other (Zustand)</h3>
<pre><code class="language-ts">// Store A wants to read from Store B
useA.subscribe((state) =&gt; {
  const b = useB.getState().something;
  // sync logic
});
// Or just call useB.getState() inside an action.
// Avoid circular subscriptions; can lead to infinite loops.
</code></pre>

<h3>Zustand persistence rehydration race</h3>
<p><code>persist</code> rehydrates from storage asynchronously. Reads before rehydration return defaults. Use <code>onRehydrateStorage</code> or <code>useStore.persist.onFinishHydration</code> to know when ready.</p>

<h3>Jotai atom dependency cycles</h3>
<p>Atom A reads atom B; atom B reads atom A → infinite loop or stale read. Jotai detects most cycles and throws; reorganize the graph.</p>

<h3>Zustand subscribeWithSelector for deep listeners</h3>
<pre><code class="language-ts">import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create&lt;State&gt;()(
  subscribeWithSelector((set) =&gt; ({ ... }))
);

// Subscribe to a specific slice
useStore.subscribe(
  (s) =&gt; s.user.id,
  (newId, prevId) =&gt; console.log('user id changed', prevId, '→', newId),
  { equalityFn: Object.is, fireImmediately: false }
);
</code></pre>

<h3>Jotai outside React</h3>
<pre><code class="language-ts">import { createStore } from 'jotai';

const store = createStore();
store.get(countAtom);           // read
store.set(countAtom, 5);        // write
const unsub = store.sub(countAtom, () =&gt; { /* changed */ });
</code></pre>

<h3>Zustand setState merging behavior</h3>
<pre><code class="language-ts">// Default: shallow merge
set({ a: 1 });             // merges into state, keeps b, c
set({ a: 1 }, true);       // REPLACE — destroys other keys; rare but supported
</code></pre>

<h3>Jotai: <code>useAtom</code> requires <code>Provider</code> in tests</h3>
<p>Tests run in isolation; without a fresh Provider, atoms persist across test cases. Wrap each test:</p>
<pre><code class="language-tsx">render(
  &lt;Provider&gt;
    &lt;ComponentUnderTest /&gt;
  &lt;/Provider&gt;
);
</code></pre>

<h3>Persistence with sensitive data</h3>
<p>Both libraries' default storage adapters (localStorage / AsyncStorage) are NOT secure. For tokens / secrets, use Keychain (iOS) / Keystore (Android) via a custom storage interface.</p>

<h3>State snapshot inside a render</h3>
<pre><code class="language-tsx">function Comp() {
  // BAD — getState during render bypasses subscription
  const items = useStore.getState().items;
  // GOOD
  const items = useStore((s) =&gt; s.items);
}
</code></pre>

<h3>Redux DevTools with Zustand</h3>
<p>Wrap with <code>devtools</code> middleware. Actions show up as named events if you call <code>set</code> with a third "action name" argument:</p>
<pre><code class="language-ts">const useStore = create()(devtools((set) =&gt; ({
  ...,
  addItem: (i) =&gt; set((s) =&gt; ({ items: [...s.items, i] }), false, 'addItem'),
})));
</code></pre>

<h3>Concurrent rendering correctness</h3>
<p>Both libraries use <code>useSyncExternalStore</code> internally (since their respective React 18-compatible versions). State reads during concurrent rendering are safe; older versions had subtle tearing bugs.</p>

<h3>Big stores (Zustand)</h3>
<p>One giant store with 50 fields and 30 actions becomes unwieldy. Split into multiple stores per feature; communicate via direct hooks if needed.</p>

<h3>Many atoms (Jotai)</h3>
<p>An app with 200 atoms is still fine — they're cheap. But organize them by feature, not by data type, for readability.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Selector returning new reference</h3>
<pre><code class="language-ts">// Zustand
const items = useStore((s) =&gt; s.items.filter((i) =&gt; i.active));   // ❌ new array every call

// FIX — derive in store, OR use a memo, OR shallow compare
const activeItemsAtom = atom((get) =&gt; get(itemsAtom).filter((i) =&gt; i.active));   // Jotai
</code></pre>

<h3>Bug 2: Calling getState inside render</h3>
<pre><code class="language-tsx">// BAD — bypasses subscription; doesn't re-render on changes
function Comp() {
  const items = useStore.getState().items;
  return &lt;ul&gt;{items.map(...)}&lt;/ul&gt;;
}
// FIX — use the hook
const items = useStore((s) =&gt; s.items);
</code></pre>

<h3>Bug 3: Storing functions in persisted state</h3>
<pre><code class="language-ts">// Zustand
persist(
  (set) =&gt; ({
    cb: () =&gt; {},                  // function — not serializable
    ...
  }),
  { name: 'foo', partialize: (s) =&gt; ({ token: s.token }) }   // partialize OUT functions
)
</code></pre>

<h3>Bug 4: Atom written but never used (Jotai)</h3>
<p>Define an atom; never read it; updates have no effect. Common when you forgot to wrap a component in <code>useAtom</code>. Atoms are lazy — they only "exist" when subscribed.</p>

<h3>Bug 5: Async atom in event handler</h3>
<pre><code class="language-tsx">// BAD — useAtomValue suspends; can't be used in handlers
function Btn() {
  return &lt;button onClick={() =&gt; {
    const user = useAtomValue(userAtom);   // Hooks rules violated
  }} /&gt;
}

// FIX — use the imperative store
const store = useStore();
const handleClick = async () =&gt; {
  const user = await store.get(userAtom);
};
</code></pre>

<h3>Bug 6: Mutating zustand state</h3>
<pre><code class="language-ts">// Without Immer middleware, mutating breaks subscriptions
addItem: (item) =&gt; set((s) =&gt; { s.items.push(item); return s; })   // ❌

// FIX — return new state OR use immer middleware
addItem: (item) =&gt; set((s) =&gt; ({ items: [...s.items, item] }))   // ✓
</code></pre>

<h3>Bug 7: Forgetting useShallow</h3>
<pre><code class="language-tsx">// Re-renders on every action because object reference is new
const { name, email } = useStore((s) =&gt; ({ name: s.user.name, email: s.user.email }));

// FIX
const { name, email } = useStore(useShallow((s) =&gt; ({ name: s.user.name, email: s.user.email })));
</code></pre>

<h3>Bug 8: Unbounded atomFamily growth</h3>
<p>Each unique parameter creates a new atom; cache grows. <code>family.remove(id)</code> when items disappear, or use <code>setShouldRemove</code> for TTL-based cleanup.</p>

<h3>Bug 9: SSR hydration mismatch</h3>
<p>Persisted Zustand store is async; first render uses defaults. If your app immediately reads persisted values and renders different content, you get React hydration warnings. Defer with a "hydrated" flag.</p>

<h3>Bug 10: Storing non-serializable in persist</h3>
<p>Date, Set, Map, class instances don't survive JSON. Either convert to plain values or use a custom serializer:</p>
<pre><code class="language-ts">persist(..., {
  name: 'foo',
  serialize: (state) =&gt; superjson.stringify(state),
  deserialize: (str) =&gt; superjson.parse(str),
})
</code></pre>

<h3>Anti-pattern 1: Putting everything in Zustand</h3>
<p>Modal open, hover state, form input — local UI. Don't promote to global; <code>useState</code> is fine.</p>

<h3>Anti-pattern 2: Server state in Zustand / Jotai</h3>
<p>Caching, refetching, invalidation, polling — that's React Query / TanStack Query / RTK Query territory. Don't reimplement.</p>

<h3>Anti-pattern 3: One mega store (Zustand)</h3>
<p>Auth + cart + theme + UI all in one 50-field store. Split by feature. Multiple smaller stores.</p>

<h3>Anti-pattern 4: One mega atom (Jotai)</h3>
<p>An atom holding the entire app state defeats the point. Atoms should be small, composable units.</p>

<h3>Anti-pattern 5: Mixing Zustand and Jotai</h3>
<p>Each works fine alone; mixing creates two mental models in one app. Pick one.</p>

<h3>Anti-pattern 6: Reaching for Provider in Jotai for every test</h3>
<p>You can; you don't always have to. Default global store works for most tests; Provider is for explicit isolation.</p>

<h3>Anti-pattern 7: Migrating from Redux for fashion</h3>
<p>Existing Redux + RTK code works. Migrating to Zustand for "smaller bundle" rarely justifies the rewrite cost. Migrate only when there's a real pain (boilerplate causing real velocity issues).</p>

<h3>Anti-pattern 8: Not using middleware</h3>
<p>Zustand: <code>persist</code>, <code>devtools</code>, <code>immer</code>, <code>subscribeWithSelector</code> are official and small. Most apps want at least devtools and persist.</p>

<h3>Anti-pattern 9: Not typing</h3>
<p>Both libraries have excellent TypeScript support. Skip typing → invite bugs.</p>

<h3>Anti-pattern 10: "Just use Context" instead</h3>
<p>Context for global state re-renders all consumers. For more than 5-10 consumers or fast-changing state, use Zustand or Jotai. Reserve Context for low-change values (theme, locale).</p>
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
    <tr><td><em>Why use Zustand instead of Redux?</em></td><td>Less boilerplate; tiny bundle; no provider tree; faster to write.</td></tr>
    <tr><td><em>Zustand vs Jotai mental model?</em></td><td>Zustand: store-based. Jotai: atomic with derived state.</td></tr>
    <tr><td><em>Why subscribe granularly?</em></td><td>Avoids the Context fan-out re-render problem.</td></tr>
    <tr><td><em>How do derived atoms work in Jotai?</em></td><td>An atom whose value is computed from <code>get(otherAtom)</code>; auto-tracks dependencies.</td></tr>
    <tr><td><em>How do you persist Zustand state?</em></td><td><code>persist</code> middleware with a storage adapter.</td></tr>
    <tr><td><em>What's <code>useShallow</code>?</em></td><td>Shallow-equal comparison for selecting multiple fields without unnecessary re-renders.</td></tr>
    <tr><td><em>When NOT to use Zustand/Jotai?</em></td><td>Server state (React Query); complex state machines (XState); existing Redux you don't want to migrate.</td></tr>
    <tr><td><em>How does Suspense work with Jotai?</em></td><td>Async atoms suspend the consumer; wrap in <code>&lt;Suspense&gt;</code>.</td></tr>
    <tr><td><em>What's atomFamily?</em></td><td>Parameterized atoms — one atom per ID; useful for dynamic lists.</td></tr>
    <tr><td><em>How do you avoid unnecessary re-renders?</em></td><td>Specific selectors; shallow equality; derived atoms.</td></tr>
    <tr><td><em>How do you debug?</em></td><td>Zustand: devtools middleware. Jotai: jotai-devtools / Redux DevTools integration.</td></tr>
    <tr><td><em>Bundle size?</em></td><td>Zustand ~1KB, Jotai ~3KB, Redux + RTK ~12KB+.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Build a Zustand counter with persist + devtools.</li>
  <li>Build a Jotai counter with a derived "doubled" atom.</li>
  <li>Migrate a Redux slice to Zustand.</li>
  <li>Migrate a Redux slice to Jotai (atom + writable derived).</li>
  <li>Pair Zustand client state with React Query server state.</li>
  <li>Add async atom + Suspense + ErrorBoundary in Jotai.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Zustand selector returning <code>{ a, b }</code> without shallow → re-renders every dispatch.</li>
  <li>Jotai async atom in an event handler → can't suspend handlers; use the imperative store.</li>
  <li>Persist storing functions → JSON throws.</li>
  <li>One mega store / one mega atom → split by feature.</li>
  <li>Server state in client store → use React Query instead.</li>
  <li>atomFamily with no cleanup → memory leak.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Tool selection</td><td>You can defend Zustand vs Jotai vs Redux vs React Query for the right use case.</td></tr>
    <tr><td>Subscription granularity</td><td>You volunteer "selectors only re-render their subscribers."</td></tr>
    <tr><td>Persistence awareness</td><td>You know AsyncStorage vs Keychain; you partialize sensitive fields.</td></tr>
    <tr><td>Suspense fluency (Jotai)</td><td>You know async atoms + ErrorBoundary + Suspense pattern.</td></tr>
    <tr><td>Modular design</td><td>You split big stores; you keep atoms composable.</td></tr>
    <tr><td>Server-state separation</td><td>You don't put React Query data in Zustand/Jotai.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Bundle size matters more on mobile.</strong> Zustand's 1KB and Jotai's 3KB add zero meaningful weight.</li>
  <li><strong>MMKV adapter</strong> for both libraries' persistence — synchronous, ~30× faster than AsyncStorage.</li>
  <li><strong>Lazy loading:</strong> code-split features by route; lazy-loaded modules can each define their own Zustand stores or Jotai atoms.</li>
  <li><strong>Hot reload:</strong> Zustand state survives fast-refresh in dev; Jotai requires a Provider to be re-instantiated for full reset.</li>
  <li><strong>Background → foreground:</strong> use AppState to flush queued updates from in-flight operations on app return.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why is Zustand smaller than Redux?"</em> — No middleware pipeline by default; no actions/reducers separation; uses React's built-in subscription primitives. The library is essentially a hook + a setState.</li>
  <li><em>"How does Jotai's dependency tracking work?"</em> — Atoms read each other through <code>get()</code>; this records the dependency at evaluation time. Updates propagate via a subscriber graph.</li>
  <li><em>"Atomic state vs store state — which is more performant?"</em> — Both are similar at React-update level. Atomic state can be slightly more granular (one atom changes → one component re-renders); stores rely on selector memoization.</li>
  <li><em>"Why no provider in Zustand?"</em> — Stores are module-scoped singletons. Hooks subscribe to the store directly. The cost: tests need explicit reset; SSR needs care for per-request isolation.</li>
  <li><em>"What's the smartest way to combine Zustand and React Query?"</em> — Zustand for filters/preferences/UI state; React Query for fetched data. The query keys can include Zustand state to refetch on filter change.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit current state library usage — is server state in the wrong place?</li>
  <li>Check selector hygiene — anything returning fresh objects without shallow comparison.</li>
  <li>Identify mega-stores / mega-atoms; propose splits.</li>
  <li>Verify persistence strategy is appropriate (Keychain for tokens, MMKV for everything else on RN).</li>
  <li>Set up devtools middleware everywhere.</li>
  <li>Document the team's "what state goes where" decision tree.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add atomFamily cleanup helpers so we don't accumulate orphaned atoms."</li>
  <li>"I'd benchmark re-render counts with React DevTools Profiler before and after a migration."</li>
  <li>"I'd write a small wrapper around <code>persist</code> that automatically uses Keychain for any field tagged 'sensitive'."</li>
  <li>"I'd add Jotai-devtools for atom-graph visualization in dev."</li>
</ul>
`
    }
  ]
});
