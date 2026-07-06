window.PREP_SITE.registerTopic({
  id: 'redux-toolkit',
  module: 'redux',
  title: 'Redux Toolkit (RTK)',
  estimatedReadTime: '30 min',
  tags: ['redux', 'rtk', 'redux-toolkit', 'immer', 'typescript'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Redux Toolkit (RTK)</strong> is the official, recommended way to write Redux — as of 2026 it's not an alternative to Redux, it <em>is</em> Redux. Nobody hand-writes action constants and switch-statement reducers in production anymore (that's the previous topic, and it exists purely to teach the mechanism).</p>
<ul>
  <li><strong>Batteries included:</strong> one package (<code>@reduxjs/toolkit</code>, current major RTK 2.x on top of Redux core 5.x) bundles <code>configureStore</code> (store setup with good defaults), <code>createSlice</code> (reducers + actions in one place), <code>createAsyncThunk</code> (async request lifecycle), <code>createEntityAdapter</code> (normalized CRUD state), and RTK Query (a full data-fetching layer, covered next topic).</li>
  <li><strong>The core trick: Immer.</strong> <code>createSlice</code> lets you write reducer logic that <em>looks</em> like it mutates state (<code>state.count += 1</code>) but is actually 100% safe — Immer intercepts those writes on a "draft" object and produces a real, immutable next state behind the scenes. The rule from the last topic ("never mutate") still holds; RTK just makes obeying it automatic instead of manual.</li>
  <li><strong>No more action-type strings scattered everywhere.</strong> <code>createSlice</code> auto-generates action creators and action-type strings from the reducer names you write, so there's exactly one place that defines each piece of slice logic.</li>
  <li><strong>Good defaults, not just less typing:</strong> <code>configureStore</code> wires up the thunk middleware, Redux DevTools, and (in development only) checks that catch accidental state mutation and non-serializable values — the exact two bugs called out as "edge cases" in hand-written Redux.</li>
  <li><strong>Mental model doesn't change.</strong> There's still one store, state still changes only via dispatched actions run through reducers. RTK is a layer that generates the boilerplate you'd otherwise hand-write — it doesn't replace the store/action/reducer/dispatch loop from the previous topic.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What hand-written Redux actually cost you</h3>
<p>The previous topic showed the real mechanism — and also, honestly, most of the pain. For one small slice of state (say, a cart), hand-written Redux typically meant writing and maintaining <em>all</em> of the following, by hand, in sync with each other:</p>
<ul>
  <li><strong>Action type constants.</strong> Strings like <code>'cart/itemAdded'</code> had to be spelled identically in the action creator and the reducer's <code>switch</code>/<code>if</code> chain — a typo in either place is a silent no-op bug, since dispatching an unrecognized action type just falls through to <code>default: return state</code>.</li>
  <li><strong>Action creator functions.</strong> Small, repetitive functions whose only job was to shape a plain object: <code>const itemAdded = (payload) =&gt; ({ type: 'cart/itemAdded', payload })</code>, one per action.</li>
  <li><strong>A switch-statement (or if-chain) reducer</strong> that grew a new case for every action, all funneled through one function per slice of state.</li>
  <li><strong>Careful, manual immutable updates.</strong> Every single state change meant hand-spreading objects/arrays (<code>{ ...state, count: state.count + 1 }</code>, <code>state.map(...)</code> to update one array item) — correct, but verbose, and one missed spread is a real, hard-to-spot mutation bug.</li>
  <li><strong>Store setup wiring.</strong> Manually applying <code>applyMiddleware(thunk)</code>, connecting the Redux DevTools extension, and remembering to add development-only sanity checks — all things easy to forget, and easy to configure inconsistently across projects.</li>
</ul>
<p>None of this was <em>wrong</em> — it's exactly what makes Redux predictable. But it's a lot of hand-typed, error-prone ceremony to express what is, conceptually, a small idea: "here's some state, and here's how it changes."</p>

<h3>What RTK removes, one line per pain point</h3>
<ul>
  <li><strong>Action constants + action creators</strong> → gone. <code>createSlice</code> generates both from the names of the reducer functions you write.</li>
  <li><strong>Switch-statement reducers</strong> → gone. You write one small function per action, keyed by name, inside a <code>reducers</code> object; <code>createSlice</code> builds the dispatcher for you.</li>
  <li><strong>Manual immutable spreading</strong> → gone (for the common case). Write <code>state.count += 1</code> and Immer converts it into a correct immutable update under the hood.</li>
  <li><strong>Store wiring</strong> → one function call. <code>configureStore({ reducer })</code> sets up thunk middleware, DevTools, and dev-only safety checks automatically.</li>
  <li><strong>Async request boilerplate</strong> (loading flags, success/error handling, race conditions) → <code>createAsyncThunk</code> standardizes it into a three-action lifecycle you handle once, the same way, every time.</li>
  <li><strong>Normalized collections</strong> (arrays you keep looking up by id, sorting, deduping) → <code>createEntityAdapter</code> generates the CRUD reducer logic and memoized selectors for a normalized shape.</li>
</ul>
<div class="callout insight">
  <div class="callout-title">🧠 One-liner</div>
  <p>RTK doesn't change what Redux <em>is</em> — action in, reducer computes, store holds, subscribers notified. It changes what you have to <em>type</em> to get there, and it bakes in the defaults (thunk, DevTools, mutation/serializability checks) that used to be easy to forget.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>A slice = one domain's reducer logic + its actions, together</h3>
<p>In hand-written Redux, "the cart reducer" and "the cart actions" were two separate things you kept in sync by hand. RTK's central unit, the <strong>slice</strong>, fuses them: <code>createSlice</code> takes a name, an initial state, and a set of "case reducer" functions, and returns <em>both</em> a reducer function <em>and</em> matching action creators — generated from the same source, so they can never drift out of sync.</p>
<pre><code class="language-text">createSlice({ name: 'cart', initialState, reducers: { itemAdded, itemRemoved } })
        │
        ├──► .reducer          — one reducer function for this slice of state
        └──► .actions.itemAdded / .actions.itemRemoved
                                — auto-generated action creators, pre-wired
                                  to dispatch { type: 'cart/itemAdded', payload }
</code></pre>
<p>The store, as before, is a single object composed of every slice's state, keyed by slice name — <code>configureStore({ reducer: { cart: cartSlice.reducer, users: usersSlice.reducer } })</code> produces a store whose state looks like <code>{ cart: {...}, users: {...} }</code>. Each slice only ever sees and updates its own corner of that object.</p>

<h3>Immer: "mutating" a draft is not mutating state</h3>
<p>The single idea that unlocks how <code>createSlice</code> reducers read is: <strong>the <code>state</code> parameter inside a case reducer is not your real state</strong> — it's a special Immer <em>draft</em> object, a proxy that records every write you make to it.</p>
<pre><code class="language-text">Your code:            state.count += 1;
What actually happens: Immer records "count changed to N+1" on the draft,
                       then produces a BRAND NEW state object with that
                       one change applied — the real, original state object
                       is never touched. Everything else is structurally
                       shared (same references) to keep this cheap.
</code></pre>
<p>That's why the "never mutate" rule from hand-written Redux doesn't vanish — it's just enforced by Immer instead of by your discipline. Write mutating-looking code inside a <code>createSlice</code> reducer, and Immer produces a correctly immutable result. Write that same mutating code <em>outside</em> a slice reducer (say, in a component, straight on data pulled out of the store) and it's a real, dangerous mutation — Immer only intercepts writes to its draft, not arbitrary JavaScript objects.</p>

<div class="callout insight">
  <div class="callout-title">🔥 Key insight</div>
  <p><code>createSlice</code> reducers get to look like ordinary, mutating JavaScript (<code>state.items.push(x)</code>, <code>state.done = true</code>) because Immer is silently translating every one of those writes into an immutable update. The mental model from the last topic — reducers return new state, never mutate the old one — is still exactly true; RTK just does the translation for you.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3><code>configureStore</code> — good defaults, one call</h3>
<pre><code class="language-js">import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import usersReducer from './usersSlice';

const store = configureStore({
  reducer: {
    cart: cartReducer,
    users: usersReducer,
  },
});</code></pre>
<p>Compared to hand-rolled <code>createStore</code> + <code>applyMiddleware</code>, <code>configureStore</code> sets up, automatically:</p>
<ul>
  <li><strong>The thunk middleware</strong> (from <code>redux-thunk</code>) — lets you dispatch functions, not just plain action objects, which is what <code>createAsyncThunk</code> relies on. No manual <code>applyMiddleware(thunk)</code> needed.</li>
  <li><strong>Redux DevTools</strong> — connected automatically if the browser extension is present.</li>
  <li><strong>Two development-only sanity checks</strong>, both stripped out of production builds: an <strong>immutability check</strong> (warns if any reducer mutated state directly instead of going through Immer/a new object) and a <strong>serializability check</strong> (warns if a non-plain value — a class instance, a Promise, a function — ends up in state or an action).</li>
</ul>

<h3><code>createSlice</code> — reducers + actions, generated together</h3>
<pre><code class="language-ts">import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  count: number;
}
const initialState: CounterState = { count: 0 };

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    incremented(state) {
      state.count += 1; // "mutating" syntax — safe: state is an Immer draft
    },
    decremented(state) {
      state.count -= 1;
    },
    incrementedBy(state, action: PayloadAction&lt;number&gt;) {
      state.count += action.payload;
    },
  },
});

// Auto-generated action creators — dispatch these directly.
export const { incremented, decremented, incrementedBy } = counterSlice.actions;
// Auto-generated reducer — plug this into configureStore.
export default counterSlice.reducer;</code></pre>
<p>Each key inside <code>reducers</code> becomes both an action creator (<code>counterSlice.actions.incremented()</code> returns <code>{ type: 'counter/incremented', payload: undefined }</code>) and a case handled inside the generated reducer — the action type string <code>'counter/incremented'</code> is built from <code>name</code> + the reducer's key, so you never type it by hand or risk a typo mismatch between creator and reducer.</p>
<p><code>PayloadAction&lt;T&gt;</code> types the shape of <code>action.payload</code> in TypeScript — <code>PayloadAction&lt;number&gt;</code> above means <code>action.payload</code> is a <code>number</code>, and passing anything else to <code>incrementedBy(...)</code> is a compile error.</p>

<h3><code>createAsyncThunk</code> — the pending/fulfilled/rejected lifecycle, standardized</h3>
<p>Any async request (an API call, in particular) has the same three states worth tracking: it's in flight, it succeeded, or it failed. Hand-writing this every time means hand-writing three action types and remembering to dispatch each at the right moment. <code>createAsyncThunk</code> generates all three automatically from one payload-creator function:</p>
<pre><code class="language-ts">import { createAsyncThunk } from '@reduxjs/toolkit';

// First arg: the action type PREFIX — three concrete actions get built from it:
//   'users/fetchAll/pending', 'users/fetchAll/fulfilled', 'users/fetchAll/rejected'
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_: void, { rejectWithValue }) => {
    const res = await fetch('/api/users');
    if (!res.ok) return rejectWithValue(await res.text());
    return (await res.json()) as User[]; // becomes action.payload on fulfilled
  }
);</code></pre>
<p>Dispatching <code>fetchUsers()</code> automatically dispatches <code>users/fetchAll/pending</code> immediately, then — once the promise settles — either <code>users/fetchAll/fulfilled</code> (with the resolved value as <code>payload</code>) or <code>users/fetchAll/rejected</code> (with the error, or whatever <code>rejectWithValue</code> was called with, as <code>payload</code>). You never dispatch these three actions by hand; you just react to them in the slice.</p>

<h3>Handling those actions: <code>extraReducers</code> with the builder callback</h3>
<p>A slice's <code>reducers</code> field only handles actions <em>it</em> defines. Actions from outside the slice — like the three <code>createAsyncThunk</code> generates — are handled in a second field, <code>extraReducers</code>, using a builder callback:</p>
<pre><code class="language-ts">interface UsersState {
  list: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}
const initialState: UsersState = { list: [], status: 'idle', error: null };

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {}, // no plain synchronous actions needed for this slice
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload; // action.payload is User[], typed from the thunk
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      });
  },
});

export default usersSlice.reducer;</code></pre>
<p>The builder gives you autocomplete and type-checking that plain string action types can't: <code>builder.addCase(fetchUsers.pending, ...)</code> is tied directly to the actual action creator, so a typo or a renamed thunk is a compile error, not a silently-ignored action type.</p>

<h3><code>createEntityAdapter</code> — normalized collections, generated CRUD</h3>
<p>Lists of records looked up by id (users, todos, products) are almost always better stored <strong>normalized</strong> — as <code>{ ids: [...], entities: { [id]: record } }</code> — rather than as a plain array, because updating or removing one record by id in a plain array means scanning/mapping the whole array; in a normalized shape it's a direct key lookup. <code>createEntityAdapter</code> generates the reducer logic and selectors for that shape:</p>
<pre><code class="language-ts">import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const todosAdapter = createEntityAdapter&lt;Todo&gt;({
  sortComparer: (a, b) => a.text.localeCompare(b.text), // keeps selectAll pre-sorted
});

const todosSlice = createSlice({
  name: 'todos',
  initialState: todosAdapter.getInitialState(), // => { ids: [], entities: {} }
  reducers: {
    todoAdded: todosAdapter.addOne,       // pre-built reducers — no hand-written logic
    todoToggled(state, action: PayloadAction&lt;string&gt;) {
      const todo = state.entities[action.payload];
      if (todo) todo.completed = !todo.completed; // direct lookup by id, no scanning
    },
    todoRemoved: todosAdapter.removeOne,
  },
});

// Generated, memoized selectors: selectAll, selectById, selectIds, selectTotal
export const todosSelectors = todosAdapter.getSelectors((state: RootState) => state.todos);
</code></pre>
<p><code>todosAdapter.addOne</code>/<code>removeOne</code>/<code>updateOne</code>/<code>upsertMany</code>, etc. are ready-made reducer functions — you rarely need to hand-write the "add this record, keeping <code>ids</code> and <code>entities</code> in sync" logic yourself.</p>

<h3><code>createSelector</code> — memoized derived state</h3>
<p>The earlier topic's edge case, "don't store derived data — compute it when you read state," still holds under RTK. But recomputing an expensive derived value (filtering, sorting, summing a large list) on <em>every</em> render, even when the underlying data hasn't changed, is wasteful. <code>createSelector</code> (re-exported from <a href="https://github.com/reduxjs/reselect" target="_blank" rel="noopener">Reselect</a>) memoizes: it only recomputes when its <em>input</em> selectors' results actually change.</p>
<pre><code class="language-ts">import { createSelector } from '@reduxjs/toolkit';

const selectTodos = (state: RootState) => state.todos.list;
const selectFilter = (state: RootState) => state.todos.filter;

export const selectVisibleTodos = createSelector(
  [selectTodos, selectFilter], // input selectors
  (todos, filter) =>            // result function — only reruns if todos or filter changed
    filter === 'completed' ? todos.filter((t) => t.completed) : todos
);</code></pre>
<p>If neither <code>state.todos.list</code> nor <code>state.todos.filter</code> changed since the last call, <code>createSelector</code> returns the previously computed array (same reference) without re-running the filter — which also means components reading it via <code>useSelector</code> can skip a re-render, since the reference is unchanged.</p>

<h3>Typing the store: <code>RootState</code>, <code>AppDispatch</code>, typed hooks</h3>
<pre><code class="language-ts">// store.ts
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import usersReducer from './usersSlice';

export const store = configureStore({
  reducer: { cart: cartReducer, users: usersReducer },
});

export type RootState = ReturnType&lt;typeof store.getState&gt;;
export type AppDispatch = typeof store.dispatch;</code></pre>
<pre><code class="language-ts">// hooks.ts — pre-typed replacements for the plain react-redux hooks
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes&lt;AppDispatch&gt;();
export const useAppSelector = useSelector.withTypes&lt;RootState&gt;();</code></pre>
<p><code>RootState</code> is inferred from the store's own <code>getState</code> return type — never hand-typed and re-typed to match every reducer you add. <code>AppDispatch</code> matters because the plain <code>Dispatch</code> type doesn't know your store accepts thunks (functions), only plain action objects; without it, TypeScript would reject <code>dispatch(fetchUsers())</code>. Using <code>useAppSelector</code>/<code>useAppDispatch</code> everywhere means every component gets full autocomplete on state shape and dispatchable actions, with zero per-call type annotations.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — <code>counterSlice</code>, wired into a component</h3>
<pre><code class="language-ts">// counterSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  count: number;
}

const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 } as CounterState,
  reducers: {
    incremented: (state) => {
      state.count += 1;
    },
    decremented: (state) => {
      state.count -= 1;
    },
    incrementedBy: (state, action: PayloadAction&lt;number&gt;) => {
      state.count += action.payload;
    },
  },
});

export const { incremented, decremented, incrementedBy } = counterSlice.actions;
export default counterSlice.reducer;</code></pre>
<pre><code class="language-tsx">// Counter.tsx
import { useAppDispatch, useAppSelector } from './hooks';
import { incremented, decremented, incrementedBy } from './counterSlice';

function Counter() {
  const count = useAppSelector((state) => state.counter.count);
  const dispatch = useAppDispatch();

  return (
    &lt;div&gt;
      &lt;p&gt;Count: {count}&lt;/p&gt;
      &lt;button onClick={() =&gt; dispatch(decremented())}&gt;-&lt;/button&gt;
      &lt;button onClick={() =&gt; dispatch(incremented())}&gt;+&lt;/button&gt;
      &lt;button onClick={() =&gt; dispatch(incrementedBy(5))}&gt;+5&lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>
<p>Side by side with the hand-written counter from the previous topic: no action-type strings, no <code>switch</code>, and <code>state.count += 1</code> instead of <code>{ count: state.count + 1 }</code> — same behavior, a fraction of the code.</p>

<h3>Example 2 — async <code>usersSlice</code> with <code>createAsyncThunk</code></h3>
<pre><code class="language-ts">// usersSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
}
interface UsersState {
  list: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}
const initialState: UsersState = { list: [], status: 'idle', error: null };

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return (await res.json()) as User[];
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export default usersSlice.reducer;</code></pre>
<pre><code class="language-tsx">// UserList.tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { fetchUsers } from './usersSlice';

function UserList() {
  const dispatch = useAppDispatch();
  const { list, status, error } = useAppSelector((state) =&gt; state.users);

  useEffect(() =&gt; {
    if (status === 'idle') dispatch(fetchUsers());
  }, [status, dispatch]);

  if (status === 'loading') return &lt;p&gt;Loading…&lt;/p&gt;;
  if (status === 'failed') return &lt;p&gt;Error: {error}&lt;/p&gt;;
  return (
    &lt;ul&gt;
      {list.map((u) =&gt; (
        &lt;li key={u.id}&gt;{u.name}&lt;/li&gt;
      ))}
    &lt;/ul&gt;
  );
}</code></pre>
<p>Notice the component never dispatches <code>pending</code>/<code>fulfilled</code>/<code>rejected</code> itself, and never manages a loading flag with <code>useState</code> — <code>status</code> lives in the store, driven entirely by the thunk's lifecycle, so any other component can read the same loading/error state without prop-drilling it.</p>

<h3>Example 3 — normalized <code>todosAdapter</code></h3>
<pre><code class="language-ts">// todosSlice.ts
import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const todosAdapter = createEntityAdapter&lt;Todo&gt;();

const todosSlice = createSlice({
  name: 'todos',
  initialState: todosAdapter.getInitialState(),
  reducers: {
    todoAdded: todosAdapter.addOne,
    todoRemoved: todosAdapter.removeOne,
    todoToggled(state, action: PayloadAction&lt;string&gt;) {
      const todo = state.entities[action.payload];
      if (todo) todo.completed = !todo.completed;
    },
  },
});

export const { todoAdded, todoRemoved, todoToggled } = todosSlice.actions;
export default todosSlice.reducer;

// Generated, memoized selectors — bound to this slice's location in the store.
export const { selectAll: selectAllTodos, selectById: selectTodoById } =
  todosAdapter.getSelectors((state: RootState) =&gt; state.todos);</code></pre>

<h3>Full store composition</h3>
<pre><code class="language-ts">// store.ts
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';
import usersReducer from './usersSlice';
import todosReducer from './todosSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    users: usersReducer,
    todos: todosReducer,
  },
});

export type RootState = ReturnType&lt;typeof store.getState&gt;;
export type AppDispatch = typeof store.dispatch;</code></pre>
<p>Three slices, each self-contained (its own reducer logic, actions, and — for <code>todos</code> — selectors), composed into one store with no manual middleware setup and no hand-written action-type wiring anywhere.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">Why use Redux Toolkit over hand-written Redux?</div>
<div class="qa-a">
<p>RTK removes the repetitive, error-prone parts of hand-written Redux without changing the underlying model. <code>createSlice</code> generates action creators and action types together (so they can never drift apart) and lets reducers use mutating-looking syntax that Immer safely converts to immutable updates. <code>configureStore</code> wires up the thunk middleware, Redux DevTools, and dev-only mutation/serializability checks automatically — all things that were easy to forget or misconfigure by hand. It's also just the officially recommended approach as of 2026: the Redux docs themselves teach RTK first.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How does Immer work inside <code>createSlice</code>, and why is "mutating" the state parameter safe?</div>
<div class="qa-a">
<p>The <code>state</code> parameter a <code>createSlice</code> reducer receives isn't the real state object — it's an Immer <em>draft</em>, a proxy that records every property write made to it. When the reducer function returns, Immer looks at everything that was written to the draft and produces a brand-new, real state object with exactly those changes applied, structurally sharing everything that wasn't touched. So <code>state.count += 1</code> never mutates real application state; it's recorded on the draft and replayed into a fresh object. The catch: this only works for writes made directly on the draft inside the reducer — mutating a plain object you pulled out of the store elsewhere (e.g. in a component) is a real, unsafe mutation, because there's no Immer draft involved there.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Walk through the <code>createAsyncThunk</code> lifecycle.</div>
<div class="qa-a">
<p><code>createAsyncThunk('prefix', payloadCreator)</code> generates three action creators from one prefix: <code>prefix/pending</code>, <code>prefix/fulfilled</code>, and <code>prefix/rejected</code>. Dispatching the thunk immediately dispatches <code>pending</code>; once the <code>payloadCreator</code>'s promise resolves, it dispatches <code>fulfilled</code> with the resolved value as <code>action.payload</code>; if it rejects (or you call <code>rejectWithValue(...)</code> inside it), it dispatches <code>rejected</code> with the error (or the rejected value) available on the action. You handle all three inside a slice's <code>extraReducers</code>, typically toggling a <code>status</code> field between <code>'loading'</code>/<code>'succeeded'</code>/<code>'failed'</code> and storing the result or error — the same three-state shape every async request needs, without re-deriving it by hand each time.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why normalize state with <code>createEntityAdapter</code> instead of keeping a plain array?</div>
<div class="qa-a">
<p>A plain array requires scanning (<code>.find</code>, <code>.map</code>, <code>.filter</code>) to update, remove, or look up one record by id — an O(n) operation that also means rebuilding the whole array on every touch. A normalized shape — <code>{ ids: [...], entities: { [id]: record } }</code> — makes "update this one record" a direct key lookup and write, and <code>ids</code> stays the single source of truth for ordering/iteration. <code>createEntityAdapter</code> generates the reducer logic for that shape (<code>addOne</code>, <code>removeOne</code>, <code>updateOne</code>, <code>upsertMany</code>, etc.) plus memoized selectors (<code>selectAll</code>, <code>selectById</code>, <code>selectIds</code>, <code>selectTotal</code>), so you get the performance and correctness benefits of normalization without hand-writing the bookkeeping.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you type the store end-to-end with TypeScript?</div>
<div class="qa-a">
<p>Infer, don't hand-write: <code>type RootState = ReturnType&lt;typeof store.getState&gt;</code> and <code>type AppDispatch = typeof store.dispatch</code>, both derived from the actual store you built with <code>configureStore</code>, so they can never drift out of sync as reducers are added. Then create pre-typed hooks once — <code>useAppSelector = useSelector.withTypes&lt;RootState&gt;()</code> and <code>useAppDispatch = useDispatch.withTypes&lt;AppDispatch&gt;()</code> — and use those everywhere instead of the plain <code>react-redux</code> hooks. <code>AppDispatch</code> matters specifically because the default <code>Dispatch</code> type only knows about plain action objects; without it, dispatching a thunk (a function) is a type error.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's a bug you can still write even with RTK, despite Immer?</div>
<div class="qa-a">
<p>Mixing styles in one reducer: mutating the draft <em>and</em> returning a new value in the same function. Immer only lets you do one or the other — if you return a value from a <code>createSlice</code> case reducer, Immer expects that return value to <em>be</em> the new state and ignores/conflicts with any draft mutations you made earlier in the same function. Another real one: putting a non-serializable value (a class instance, a <code>Map</code>, a Promise) into slice state — the dev-only serializability check in <code>configureStore</code> will warn about it, and it's worth listening to, since it breaks DevTools and persistence the same way it did in hand-written Redux.</p>
</div>
</div>
`}

]});
