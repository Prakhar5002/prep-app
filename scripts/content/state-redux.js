window.PREP_SITE.registerTopic({
  id: 'state-redux',
  module: 'state-deep',
  title: 'Redux / RTK / RTK Query',
  estimatedReadTime: '50 min',
  tags: ['redux', 'rtk', 'redux-toolkit', 'rtk-query', 'reducers', 'middleware', 'normalization', 'react-redux', 'flux'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Redux</strong> is a single-store, immutable, pure-reducer state-management library. It dominated React state from 2015-2019, then ceded ground to Context, Zustand, Jotai, and React Query as the "default." It remains the right answer for large client-state-heavy apps with complex cross-feature state, undo/redo, time-travel debugging, and strict auditability.</p>
<ul>
  <li><strong>The three principles:</strong> single source of truth, state is read-only, changes via pure functions (reducers).</li>
  <li><strong>Modern Redux = RTK.</strong> Redux Toolkit eliminates the boilerplate; <code>configureStore</code>, <code>createSlice</code>, <code>createAsyncThunk</code> are the default vocabulary now.</li>
  <li><strong>RTK Query</strong> is RTK's data-fetching layer — alternative to React Query when you're already invested in Redux.</li>
  <li><strong>Selectors with reselect</strong> memoize derived state to avoid wasteful re-renders.</li>
  <li><strong>Middleware</strong> intercepts every action — used for logging, async (thunk, saga), analytics, persistence.</li>
  <li><strong>Normalization</strong> flattens nested data to dictionaries keyed by ID, avoiding deep updates.</li>
  <li><strong>The trap:</strong> Redux is overkill for &gt;90% of small/medium apps. Reach for it only when justified.</li>
  <li><strong>Common mistakes:</strong> mutating state in reducers, putting derived data in the store, fetching directly from components, over-globalizing local UI state.</li>
</ul>
<p><strong>Mantra:</strong> "Use RTK, normalize entities, memoize selectors, keep UI state local. Redux only when the cross-feature shape demands it."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is Redux?</h3>
<p>Redux is a state-management library for JavaScript apps. It's an implementation of the Flux architecture: a single store holding all application state, modified only by dispatching <strong>actions</strong> (plain objects describing what happened) processed by pure <strong>reducers</strong> (functions that take current state + action and return new state). Components subscribe to the store and re-render when their slice of state changes.</p>

<h3>The three principles</h3>
<ol>
  <li><strong>Single source of truth.</strong> All shared state lives in one store. Easier to debug, persist, hydrate, time-travel.</li>
  <li><strong>State is read-only.</strong> The only way to change state is to dispatch an action. No direct mutation.</li>
  <li><strong>Changes via pure functions.</strong> Reducers are <code>(state, action) =&gt; newState</code>. No side effects. Same input → same output.</li>
</ol>

<h3>Why Redux exists</h3>
<p>In 2014-2015, React apps grew large enough that <code>props</code>-only state passing got painful. Components 6 levels deep needed shared state. Local <code>useState</code> couldn't reach across siblings. Context existed but was clunky. Redux gave teams a predictable global store with time-travel debugging and a clear architectural pattern.</p>

<h3>The Redux Toolkit (RTK) era</h3>
<p>Pre-RTK Redux was famously verbose. You wrote action types, action creators, switch-statement reducers, immutable updates by hand, normalizer logic. RTK (released 2019) hides this:</p>
<ul>
  <li><code>createSlice</code> — defines reducer + actions + initial state in one place.</li>
  <li>Built-in <strong>Immer</strong> — write mutating-style code; RTK produces immutable output.</li>
  <li><code>configureStore</code> — sane defaults (DevTools, thunk middleware, immutable check, serializable check).</li>
  <li><code>createAsyncThunk</code> — standardized async pattern.</li>
  <li><code>createEntityAdapter</code> — normalization helpers.</li>
  <li><code>RTK Query</code> — full data-fetching layer.</li>
</ul>
<p>"Redux" in 2026 means RTK. Don't write classic Redux unless you're maintaining legacy.</p>

<h3>When Redux is the right answer</h3>
<table>
  <thead><tr><th>Signal</th><th>Why Redux fits</th></tr></thead>
  <tbody>
    <tr><td>Large state shape across many features</td><td>Single store, normalized entities, cross-feature selectors</td></tr>
    <tr><td>Need time-travel debugging</td><td>Redux DevTools is unmatched</td></tr>
    <tr><td>Undo/redo</td><td>Pure reducers + state snapshots make this trivial</td></tr>
    <tr><td>Audit log of state changes</td><td>Every action is a discrete, serializable event</td></tr>
    <tr><td>Strong architectural conventions across team</td><td>Redux's rules are well-documented and consistent</td></tr>
    <tr><td>Existing Redux codebase</td><td>Don't migrate just for fashion</td></tr>
  </tbody>
</table>

<h3>When Redux is overkill</h3>
<table>
  <thead><tr><th>Signal</th><th>Better alternative</th></tr></thead>
  <tbody>
    <tr><td>Mostly server state</td><td>React Query / TanStack Query / RTK Query</td></tr>
    <tr><td>Small/medium app, single screen flows</td><td>Component state + Context</td></tr>
    <tr><td>Need ergonomic API and minimal boilerplate</td><td>Zustand</td></tr>
    <tr><td>Atomic state with derived computations</td><td>Jotai</td></tr>
    <tr><td>Complex transitions / state machines</td><td>XState</td></tr>
    <tr><td>One feature's local state grew complex</td><td><code>useReducer</code> + Context</td></tr>
  </tbody>
</table>

<h3>Why interviewers ask</h3>
<ol>
  <li>Redux remains in many large enterprise codebases; staff+ candidates must understand it.</li>
  <li>Tests architectural reasoning: when is global state appropriate?</li>
  <li>Tests immutability and pure-function discipline.</li>
  <li>Tests selector performance (memoization, re-render minimization).</li>
  <li>Pattern-matching skill: "is this a Redux problem or a React Query problem?"</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>Use RTK; never hand-roll classic Redux for new code.</li>
  <li>Slice files: each feature owns one slice.</li>
  <li>Normalize entities with <code>createEntityAdapter</code>.</li>
  <li>Memoize derived state with <code>createSelector</code> from reselect.</li>
  <li>Local UI state stays local (<code>useState</code>); only put cross-feature state in the store.</li>
  <li>Server state goes in RTK Query, not in slices.</li>
  <li>Async logic in <code>createAsyncThunk</code> or RTK Query, not in reducers.</li>
  <li>Strict typing with TypeScript; <code>RootState</code> and <code>AppDispatch</code> typed at the store level.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The unidirectional dataflow</h3>
<pre><code class="language-text">┌──────────────┐     dispatch      ┌────────────┐
│  Component   │ ─────────────────→ │   Action   │
└──────────────┘                    └─────┬──────┘
       ▲                                  │
       │ subscribes to                    ▼
       │                            ┌────────────┐
       │                            │  Reducer   │
       │                            └─────┬──────┘
       │                                  │ returns new
       │                                  ▼
       │                            ┌────────────┐
       └────── re-render ←─── store │   Store    │
                                    └────────────┘
</code></pre>

<h3>Action shape</h3>
<pre><code class="language-js">// Plain object. Type is required; payload is conventional.
{ type: 'cart/itemAdded', payload: { sku: 'abc', qty: 1 } }

// In RTK, the slice's createSlice generates these for you:
slice.actions.itemAdded({ sku: 'abc', qty: 1 })
//   → { type: 'cart/itemAdded', payload: { sku: 'abc', qty: 1 } }
</code></pre>

<h3>Reducer shape</h3>
<pre><code class="language-js">// (state, action) =&gt; newState — PURE. No fetch, no Date.now(), no Math.random().
const cartReducer = (state, action) =&gt; {
  switch (action.type) {
    case 'cart/itemAdded':
      return { ...state, items: [...state.items, action.payload] };
    case 'cart/cleared':
      return { ...state, items: [] };
    default:
      return state;
  }
};

// In RTK with Immer, you write "mutating" code:
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    itemAdded(state, action) {
      state.items.push(action.payload);   // looks like mutation; Immer makes it immutable
    },
    cleared(state) {
      state.items = [];
    },
  },
});
</code></pre>

<h3>Why immutability matters</h3>
<ul>
  <li><strong>Reference equality powers re-render decisions.</strong> React Redux's <code>useSelector</code> bails out when the result <code>===</code> the previous one.</li>
  <li><strong>Time-travel debugging</strong> requires snapshots; mutation breaks the timeline.</li>
  <li><strong>Predictability:</strong> you can compare old and new state side-by-side.</li>
</ul>

<h3>Selector mental model</h3>
<p>Selectors are pure functions <code>(state) =&gt; result</code>. Plain selectors are cheap but produce fresh references on every call. <strong>Memoized</strong> selectors (via <code>createSelector</code>) cache the last result and return it if input slices haven't changed.</p>

<pre><code class="language-js">// Plain selector — fine for primitives
const selectCartItems = (state) =&gt; state.cart.items;

// Memoized selector — for derived data
import { createSelector } from '@reduxjs/toolkit';

const selectCartTotal = createSelector(
  [selectCartItems],
  (items) =&gt; items.reduce((sum, i) =&gt; sum + i.price * i.qty, 0)
);
// Re-computes ONLY when items array reference changes
</code></pre>

<h3>Middleware is a pipeline</h3>
<pre><code class="language-text">dispatch(action)
   │
   ▼
[middleware 1: logger]
   │
   ▼
[middleware 2: thunk]    ← can intercept; if action is a function, run it
   │
   ▼
[middleware 3: saga]     ← can spawn side effects
   │
   ▼
reducer
   │
   ▼
new state
</code></pre>
<p>Middleware sees every action in order; can transform, delay, intercept, or add new ones.</p>

<h3>Normalization mental model</h3>
<pre><code class="language-text">// Nested (bad for Redux)
{
  posts: [
    { id: 1, author: { id: 'u1', name: 'Sara' }, comments: [{...}] },
    { id: 2, author: { id: 'u1', name: 'Sara' }, comments: [{...}] }   // duplicated author
  ]
}

// Normalized (good)
{
  posts: { byId: { 1: { id: 1, authorId: 'u1', commentIds: [...] } }, allIds: [1, 2] },
  users: { byId: { u1: { id: 'u1', name: 'Sara' } } },
  comments: { byId: { ... }, allIds: [...] }
}

// To update Sara's name: one location, not N.
// To list posts: traverse posts.allIds, dereference users by authorId.
</code></pre>

<h3>RTK Query mental model</h3>
<p>RTK Query treats the cache as a normalized store-like layer. You define <strong>endpoints</strong>; the library generates hooks (<code>useGetUserQuery</code>, <code>useUpdateUserMutation</code>), handles loading state, caching, invalidation, refetching, polling.</p>
<pre><code class="language-text">Component → calls hook → cache hit? → return cached
                                  ↓ no
                              fetch → store in cache → return
Mutation → invalidate tags → refetch affected queries
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Modern store setup with RTK</h3>
<pre><code class="language-ts">// store.ts
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './features/cart/cartSlice';
import authReducer from './features/auth/authSlice';
import { apiSlice } from './services/api';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefault) =&gt; getDefault().concat(apiSlice.middleware),
});

export type RootState = ReturnType&lt;typeof store.getState&gt;;
export type AppDispatch = typeof store.dispatch;
</code></pre>

<h3>Slice — the unit of work</h3>
<pre><code class="language-ts">// features/cart/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem { sku: string; qty: number; price: number; }
interface CartState { items: CartItem[]; }

const initialState: CartState = { items: [] };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    itemAdded(state, action: PayloadAction&lt;CartItem&gt;) {
      const existing = state.items.find(i =&gt; i.sku === action.payload.sku);
      if (existing) existing.qty += action.payload.qty;
      else state.items.push(action.payload);
    },
    itemRemoved(state, action: PayloadAction&lt;string&gt;) {
      state.items = state.items.filter(i =&gt; i.sku !== action.payload);
    },
    cleared(state) {
      state.items = [];
    },
  },
});

export const { itemAdded, itemRemoved, cleared } = cartSlice.actions;
export default cartSlice.reducer;
</code></pre>

<h3>Typed hooks (one-time setup)</h3>
<pre><code class="language-ts">// app/hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = () =&gt; useDispatch&lt;AppDispatch&gt;();
export const useAppSelector: TypedUseSelectorHook&lt;RootState&gt; = useSelector;
</code></pre>

<h3>Component usage</h3>
<pre><code class="language-tsx">function Cart() {
  const items = useAppSelector(state =&gt; state.cart.items);
  const dispatch = useAppDispatch();

  return (
    &lt;ul&gt;
      {items.map(i =&gt; (
        &lt;li key={i.sku}&gt;
          {i.sku} × {i.qty}
          &lt;button onClick={() =&gt; dispatch(itemRemoved(i.sku))}&gt;Remove&lt;/button&gt;
        &lt;/li&gt;
      ))}
    &lt;/ul&gt;
  );
}
</code></pre>

<h3>createAsyncThunk for async logic</h3>
<pre><code class="language-ts">import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface User { id: string; name: string; }

export const fetchUser = createAsyncThunk&lt;User, string&gt;(
  'user/fetch',
  async (id, { rejectWithValue }) =&gt; {
    try {
      const r = await fetch(\`/api/users/\${id}\`);
      if (!r.ok) return rejectWithValue('Network error');
      return await r.json();
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: { data: null as User | null, status: 'idle' as 'idle' | 'loading' | 'success' | 'error', error: null as string | null },
  reducers: {},
  extraReducers: (builder) =&gt; {
    builder
      .addCase(fetchUser.pending, (state) =&gt; { state.status = 'loading'; state.error = null; })
      .addCase(fetchUser.fulfilled, (state, action) =&gt; { state.status = 'success'; state.data = action.payload; })
      .addCase(fetchUser.rejected, (state, action) =&gt; { state.status = 'error'; state.error = action.payload as string; });
  },
});
</code></pre>

<h3>createEntityAdapter — normalization made easy</h3>
<pre><code class="language-ts">import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

const usersAdapter = createEntityAdapter&lt;User&gt;({
  selectId: (user) =&gt; user.id,
  sortComparer: (a, b) =&gt; a.name.localeCompare(b.name),
});

const usersSlice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState(),    // { ids: [], entities: {} }
  reducers: {
    userAdded: usersAdapter.addOne,
    usersAdded: usersAdapter.addMany,
    userUpdated: usersAdapter.updateOne,
    userRemoved: usersAdapter.removeOne,
    usersUpserted: usersAdapter.upsertMany,
  },
});

// Selectors generated by the adapter
export const usersSelectors = usersAdapter.getSelectors&lt;RootState&gt;((s) =&gt; s.users);
//   selectAll, selectById, selectIds, selectTotal, etc.
</code></pre>

<h3>Memoized selectors with reselect</h3>
<pre><code class="language-ts">import { createSelector } from '@reduxjs/toolkit';

const selectCartItems = (state: RootState) =&gt; state.cart.items;
const selectTaxRate = (state: RootState) =&gt; state.checkout.taxRate;

export const selectCartTotal = createSelector(
  [selectCartItems, selectTaxRate],
  (items, taxRate) =&gt; {
    const sub = items.reduce((s, i) =&gt; s + i.qty * i.price, 0);
    return sub * (1 + taxRate);
  }
);

// Component
const total = useAppSelector(selectCartTotal);   // memoized; only recomputes when items or taxRate change
</code></pre>

<h3>RTK Query — the modern data layer</h3>
<pre><code class="language-ts">// services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) =&gt; {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', \`Bearer \${token}\`);
      return headers;
    },
  }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) =&gt; ({
    getUser: builder.query&lt;User, string&gt;({
      query: (id) =&gt; \`users/\${id}\`,
      providesTags: (_, __, id) =&gt; [{ type: 'User', id }],
    }),
    updateUser: builder.mutation&lt;User, { id: string; changes: Partial&lt;User&gt; }&gt;({
      query: ({ id, changes }) =&gt; ({ url: \`users/\${id}\`, method: 'PATCH', body: changes }),
      invalidatesTags: (_, __, { id }) =&gt; [{ type: 'User', id }],
    }),
    listPosts: builder.query&lt;Post[], void&gt;({
      query: () =&gt; 'posts',
      providesTags: (result) =&gt; result
        ? [...result.map(({ id }) =&gt; ({ type: 'Post' as const, id })), { type: 'Post', id: 'LIST' }]
        : [{ type: 'Post', id: 'LIST' }],
    }),
  }),
});

export const { useGetUserQuery, useUpdateUserMutation, useListPostsQuery } = apiSlice;
</code></pre>

<h3>Component using RTK Query</h3>
<pre><code class="language-tsx">function UserProfile({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useGetUserQuery(id);
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();

  if (isLoading) return &lt;Spinner /&gt;;
  if (isError) return &lt;ErrorState onRetry={refetch} /&gt;;

  return (
    &lt;form onSubmit={async (e) =&gt; {
      e.preventDefault();
      await updateUser({ id, changes: { name: nameRef.current.value } }).unwrap();
    }}&gt;
      &lt;input ref={nameRef} defaultValue={data!.name} /&gt;
      &lt;button disabled={saving}&gt;{saving ? 'Saving…' : 'Save'}&lt;/button&gt;
    &lt;/form&gt;
  );
}
</code></pre>

<h3>Middleware example: logging</h3>
<pre><code class="language-ts">const logger: Middleware = (store) =&gt; (next) =&gt; (action) =&gt; {
  console.log('dispatching', action);
  const result = next(action);
  console.log('next state', store.getState());
  return result;
};
// Add via configureStore({ middleware: (g) =&gt; g().concat(logger) })
</code></pre>

<h3>Persistence (redux-persist)</h3>
<pre><code class="language-ts">import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistedReducer = persistReducer(
  { key: 'root', storage, whitelist: ['auth', 'cart'] },
  rootReducer
);

const store = configureStore({ reducer: persistedReducer });
const persistor = persistStore(store);
</code></pre>

<h3>Selectors typed by RTK Query</h3>
<pre><code class="language-tsx">// Access RTK Query state imperatively
const result = apiSlice.endpoints.getUser.select(userId)(store.getState());
// → { status, data, error, ... }
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Auth slice + token refresh</h3>
<pre><code class="language-ts">interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  status: 'unauthenticated' | 'authenticated' | 'refreshing';
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: null, refreshToken: null, user: null, status: 'unauthenticated' } as AuthState,
  reducers: {
    loggedIn(state, action: PayloadAction&lt;{ token: string; refreshToken: string; user: User }&gt;) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.status = 'authenticated';
    },
    refreshing(state) { state.status = 'refreshing'; },
    loggedOut(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.status = 'unauthenticated';
    },
  },
});
</code></pre>

<h3>Example 2: Optimistic updates with RTK Query</h3>
<pre><code class="language-ts">likePost: builder.mutation&lt;void, string&gt;({
  query: (postId) =&gt; ({ url: \`posts/\${postId}/like\`, method: 'POST' }),
  async onQueryStarted(postId, { dispatch, queryFulfilled }) {
    // Optimistic: bump like count immediately
    const patch = dispatch(
      apiSlice.util.updateQueryData('getPost', postId, (draft) =&gt; {
        draft.likeCount++;
        draft.likedByMe = true;
      })
    );
    try {
      await queryFulfilled;
    } catch {
      patch.undo();   // rollback on failure
    }
  },
}),
</code></pre>

<h3>Example 3: Cross-slice selectors</h3>
<pre><code class="language-ts">// orders depend on users and products
const selectOrderById = (state: RootState, id: string) =&gt; state.orders.entities[id];

const selectEnrichedOrder = createSelector(
  [
    selectOrderById,
    (state: RootState) =&gt; state.users.entities,
    (state: RootState) =&gt; state.products.entities,
  ],
  (order, users, products) =&gt; {
    if (!order) return null;
    return {
      ...order,
      user: users[order.userId],
      products: order.productIds.map((pid) =&gt; products[pid]),
    };
  }
);
</code></pre>

<h3>Example 4: Undo/redo via slice history</h3>
<pre><code class="language-ts">const initialState = { past: [] as State[], present: initialEditorState, future: [] as State[] };

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    set(state, action) {
      state.past.push(state.present);
      state.present = action.payload;
      state.future = [];
    },
    undo(state) {
      if (state.past.length === 0) return;
      state.future.unshift(state.present);
      state.present = state.past.pop()!;
    },
    redo(state) {
      if (state.future.length === 0) return;
      state.past.push(state.present);
      state.present = state.future.shift()!;
    },
  },
});
</code></pre>

<h3>Example 5: Polling with RTK Query</h3>
<pre><code class="language-tsx">function Dashboard() {
  // Poll every 10 seconds
  const { data } = useGetMetricsQuery(undefined, { pollingInterval: 10_000 });
  return &lt;Metric value={data?.activeUsers} /&gt;;
}
</code></pre>

<h3>Example 6: Listener middleware (replaces sagas for many cases)</h3>
<pre><code class="language-ts">import { createListenerMiddleware } from '@reduxjs/toolkit';

export const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: itemAdded,
  effect: async (action, { dispatch, getState }) =&gt; {
    // side effect: log analytics
    analytics.track('cart_item_added', { sku: action.payload.sku });
    // can dispatch follow-ups, await async work, etc.
  },
});

// In configureStore:
//   middleware: (getDefault) =&gt; getDefault().prepend(listenerMiddleware.middleware)
</code></pre>

<h3>Example 7: Conditional fetching</h3>
<pre><code class="language-tsx">const { data } = useGetUserQuery(userId, {
  skip: !userId,                  // don't fetch if userId is null
  refetchOnMountOrArgChange: 60,  // refetch if data &gt; 60s old
});
</code></pre>

<h3>Example 8: Pagination with infinite scroll</h3>
<pre><code class="language-ts">listPosts: builder.query&lt;Post[], { cursor: string | null }&gt;({
  query: ({ cursor }) =&gt; ({ url: 'posts', params: { cursor } }),
  serializeQueryArgs: ({ endpointName }) =&gt; endpointName,   // single cache entry
  merge: (existing, incoming) =&gt; { existing.push(...incoming); },
  forceRefetch: ({ currentArg, previousArg }) =&gt; currentArg !== previousArg,
}),
</code></pre>

<h3>Example 9: Selector with parameter (memoized per-call)</h3>
<pre><code class="language-ts">// Each component instance needs its own memoized version
import { createSelector } from '@reduxjs/toolkit';

export const makeSelectFilteredItems = () =&gt;
  createSelector(
    [(state: RootState) =&gt; state.cart.items, (_: RootState, category: string) =&gt; category],
    (items, category) =&gt; items.filter((i) =&gt; i.category === category)
  );

// Per-component
function CategoryList({ category }: { category: string }) {
  const selectFiltered = useMemo(makeSelectFilteredItems, []);
  const items = useAppSelector((state) =&gt; selectFiltered(state, category));
  // ...
}
</code></pre>

<h3>Example 10: Tagged invalidation across endpoints</h3>
<pre><code class="language-ts">// When user updates profile, invalidate all queries with their data
endpoints: (builder) =&gt; ({
  updateProfile: builder.mutation&lt;User, Partial&lt;User&gt;&gt;({
    query: (changes) =&gt; ({ url: 'me', method: 'PATCH', body: changes }),
    invalidatesTags: ['Me', { type: 'User', id: 'LIST' }],
  }),
  getMe: builder.query&lt;User, void&gt;({
    query: () =&gt; 'me',
    providesTags: ['Me'],
  }),
  listFriends: builder.query&lt;User[], void&gt;({
    query: () =&gt; 'me/friends',
    providesTags: (r) =&gt; [{ type: 'User', id: 'LIST' }],
  }),
}),
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Mutating state outside Immer</h3>
<p>RTK uses Immer; mutating syntax in <code>createSlice</code> reducers IS safe. But mutating elsewhere (in selectors, in middleware, in <code>extraReducers</code>'s draft escape) silently corrupts the store.</p>

<h3>Selector returning fresh references</h3>
<pre><code class="language-ts">// BAD — returns a new array every call → triggers re-renders
const selectActiveItems = (state: RootState) =&gt; state.cart.items.filter(i =&gt; i.active);

// GOOD — memoize
const selectActiveItems = createSelector(
  [(s: RootState) =&gt; s.cart.items],
  (items) =&gt; items.filter((i) =&gt; i.active)
);
</code></pre>

<h3>Putting non-serializable data in the store</h3>
<p>Date objects, Promises, class instances, functions are all non-serializable. RTK warns by default. Common offenders:</p>
<ul>
  <li>Storing a Date object — convert to ISO string.</li>
  <li>Storing a File / Blob — store the upload status, not the blob.</li>
  <li>Storing a callback — never. Pass it via prop.</li>
</ul>

<h3>Circular reducer dependencies</h3>
<p>Slice A imports an action from slice B; slice B imports from A. Resolves at runtime but signals a design issue. Refactor to flat shared action types or use <code>extraReducers</code> with action creators.</p>

<h3>Inline action creators in <code>useSelector</code></h3>
<pre><code class="language-tsx">// BAD — new function every render → bypasses memoization
const items = useAppSelector((state) =&gt; state.cart.items.filter(i =&gt; i.active));

// GOOD — pull selector out
const selectActiveItems = createSelector(...);
const items = useAppSelector(selectActiveItems);
</code></pre>

<h3>Stale closures with thunks</h3>
<pre><code class="language-ts">// thunk captures dispatch + getState; both are STABLE across calls
const myThunk = createAsyncThunk(
  'foo/bar',
  async (arg, { dispatch, getState }) =&gt; {
    const value = (getState() as RootState).feature.value;   // current at call time
    // safe; not stale
  }
);
</code></pre>

<h3>RTK Query: arg serialization for cache keys</h3>
<p>Cache key = endpoint + JSON.stringify(arg). If arg is a complex object, key drift can cause unnecessary cache misses. Use stable arg shapes; avoid embedding fresh references.</p>

<h3>RTK Query: tag explosion</h3>
<p>Providing tags like <code>{ type: 'User', id: '...' }</code> per item × 1000 items × 10 endpoints = 10k tags. Re-invalidation walks all of them. Use <code>{ type: 'User', id: 'LIST' }</code> as a "list" tag for bulk invalidation.</p>

<h3>RTK Query: subscription cleanup</h3>
<p>Each <code>useQuery</code> hook subscribes; the cache entry is kept alive by reference counting. When all components unmount, RTK Query keeps the entry for 60s by default before garbage collection. Tune via <code>keepUnusedDataFor</code> per endpoint.</p>

<h3>Persistence and migrations</h3>
<p><code>redux-persist</code> snapshots state; if you change the slice shape, old persisted data may not match. Always include <code>version</code> + <code>migrate</code> functions:</p>
<pre><code class="language-ts">const persistConfig = {
  key: 'root',
  storage,
  version: 2,
  migrate: createMigrate({
    1: (state) =&gt; ({ ...state, _migrated_to_v1: true }),
    2: (state) =&gt; ({ ...state, settings: { ...state.settings, theme: 'auto' } }),
  }),
};
</code></pre>

<h3>SSR / Next.js gotchas</h3>
<ul>
  <li>Per-request store instance to avoid leaking state between users.</li>
  <li>Hydrate from server-side state on the client.</li>
  <li>RTK Query has a separate <code>fetchBaseQuery</code> setup for SSR; consider <code>extractRehydrationInfo</code>.</li>
</ul>

<h3>Concurrent React + selectors</h3>
<p>React 18 concurrent rendering can call selectors twice (rendering both old and new states). Selectors must be pure; if they depend on outside-store state, you'll see flicker.</p>

<h3>useSelector and equality</h3>
<p>Default equality is <code>===</code>. For objects/arrays, it's reference equality. To compare deeply (avoid this if possible — fix the selector instead):</p>
<pre><code class="language-tsx">import { shallowEqual } from 'react-redux';
const items = useAppSelector(selectFoo, shallowEqual);
</code></pre>

<h3>Middleware order matters</h3>
<p>The first middleware sees actions before downstream ones. Logger first → sees raw action; logger after thunk → sees the resolved action sometimes (or not at all if cancelled). Plan order intentionally.</p>

<h3>Persistence + RTK Query</h3>
<p>RTK Query has its own cache; persisting it can leak stale data across sessions. Default: don't persist the API slice. Persist only your own slices.</p>

<h3>State growing unboundedly</h3>
<p>A "list of all messages ever" grows forever. Either cap (LRU eviction in the reducer) or use RTK Query with TTLs.</p>

<h3>Action explosion</h3>
<p>Dispatching 1000 actions in a tight loop blocks the main thread (every action runs all middleware + all subscribers). Batch:</p>
<pre><code class="language-ts">// Use batch from react-redux for legacy code paths
import { batch } from 'react-redux';
batch(() =&gt; {
  for (const item of items) dispatch(itemAdded(item));
});
// React 18 batches automatically inside event handlers
</code></pre>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Hand-rolling classic Redux for new code</h3>
<p>Action types, action creators, switch reducers. Use RTK; the boilerplate is gone.</p>

<h3>Bug 2: Mutating state outside Immer</h3>
<pre><code class="language-ts">// Inside createSlice — Immer makes this safe
itemAdded(state, action) { state.items.push(action.payload); }   // ✓

// In a selector — UNSAFE; mutates the store
selectAndSort: (state) =&gt; state.items.sort()   // ❌ — sorts in place

// FIX
selectAndSort: createSelector([(s) =&gt; s.items], (items) =&gt; [...items].sort())
</code></pre>

<h3>Bug 3: Using <code>useSelector</code> with a fresh function</h3>
<pre><code class="language-tsx">// BAD — re-renders on EVERY action because the inline filter returns a new array
const filtered = useSelector((s: RootState) =&gt; s.items.filter(i =&gt; i.active));

// GOOD — memoize with createSelector
</code></pre>

<h3>Bug 4: Storing derived data</h3>
<pre><code class="language-ts">// BAD — must be kept in sync manually
state.cart.totalPrice = computeTotal(state.cart.items);

// GOOD — derive via selector
const selectTotal = createSelector(...);
</code></pre>

<h3>Bug 5: Async logic in reducers</h3>
<pre><code class="language-ts">// BAD — reducers are pure; this throws or silently breaks
reducers: {
  loadUser(state, action) { state.user = await fetch(...); }   // ❌
}

// GOOD — createAsyncThunk
const loadUser = createAsyncThunk('user/load', async (id) =&gt; { ... });
</code></pre>

<h3>Bug 6: Forgetting to type the dispatch</h3>
<pre><code class="language-tsx">// Without types
const dispatch = useDispatch();
dispatch(myThunk());   // returns thenable; TS doesn't know

// With AppDispatch
const dispatch = useAppDispatch();
await dispatch(myThunk()).unwrap();   // typed
</code></pre>

<h3>Bug 7: Putting all state in Redux</h3>
<p>Form input value, modal open/close, hover state — these are local UI state. Use <code>useState</code>. Putting everything in Redux is the single most common over-engineering pattern.</p>

<h3>Bug 8: Missing tag invalidation</h3>
<pre><code class="language-ts">// Mutation succeeds but UI shows stale data
updateUser: builder.mutation({
  query: (...) =&gt; ({...}),
  // forgot invalidatesTags
}),
// FIX — invalidate the related query
invalidatesTags: (_, __, { id }) =&gt; [{ type: 'User', id }],
</code></pre>

<h3>Bug 9: Selector that depends on props without parameter</h3>
<pre><code class="language-ts">// BAD — global selector returns same value for all components
export const selectFiltered = createSelector([selectItems], (items) =&gt; items.filter(...));

// FIX — parameterized; create per-instance via factory
export const makeSelectFiltered = () =&gt; createSelector(...);
</code></pre>

<h3>Bug 10: Persisting auth tokens in plain storage</h3>
<p><code>redux-persist</code> writes to AsyncStorage / localStorage; tokens stored there are accessible to any code with that storage. Use <code>react-native-keychain</code> on mobile and httpOnly cookies on web for sensitive credentials.</p>

<h3>Anti-pattern 1: Redux for everything</h3>
<p>Form state, dropdown open/close, "is this hovered" — local UI state. Redux for cross-feature persistent data only.</p>

<h3>Anti-pattern 2: Sagas everywhere</h3>
<p>Sagas are powerful but overkill for most async work. <code>createAsyncThunk</code> handles 90% of cases; <code>createListenerMiddleware</code> handles complex side effects. Reach for sagas only when you genuinely need their event-stream model.</p>

<h3>Anti-pattern 3: Connecting every component</h3>
<p>The legacy <code>connect()</code> HOC and over-eager <code>useSelector</code> spawning across the tree. Lift selectors to the closest possible parent; pass results as props down.</p>

<h3>Anti-pattern 4: Middleware for business logic</h3>
<p>Middleware should handle infrastructure (logging, auth headers, retries), not domain decisions. Domain logic belongs in reducers or thunks.</p>

<h3>Anti-pattern 5: Using Redux as a glorified event bus</h3>
<p>Dispatching events that no reducer reads, just to trigger middleware side effects, abuses Redux's design. Use a real event bus (or RTK's listener middleware with action-creator filters).</p>

<h3>Anti-pattern 6: Multiple slices owning the same data</h3>
<p>If <code>cartSlice</code> and <code>checkoutSlice</code> both store cart items, they'll drift. One owner. Cross-feature reads via selectors.</p>

<h3>Anti-pattern 7: Skipping <code>configureStore</code> defaults</h3>
<p>Disabling the immutability check or serializability check ("they're noisy") removes useful guardrails. Fix the warnings; don't silence them.</p>

<h3>Anti-pattern 8: Not using TypeScript</h3>
<p>Untyped Redux is bug nursery. <code>RootState</code>, <code>AppDispatch</code>, slice action types, thunk return types — all should be inferred and exported.</p>

<h3>Anti-pattern 9: Premature normalization</h3>
<p>Normalizing 5 user records is overkill. Normalize when you have many entities referenced from many places. For local-only single-feature data, nested is fine.</p>

<h3>Anti-pattern 10: Mixing RTK Query with manual fetches in slices</h3>
<p>Pick one strategy per resource. Mixing causes cache desync and bug-prone refetch logic.</p>
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
    <tr><td><em>What are Redux's three principles?</em></td><td>Single store; state read-only; changes via pure reducers.</td></tr>
    <tr><td><em>Classic Redux vs RTK?</em></td><td>RTK eliminates boilerplate; uses Immer; ships sensible defaults; current default.</td></tr>
    <tr><td><em>Why immutability?</em></td><td>Reference equality powers re-render skipping; enables time-travel debugging.</td></tr>
    <tr><td><em>What's a selector?</em></td><td>Pure function (state) =&gt; derived data; memoize with createSelector for derived computations.</td></tr>
    <tr><td><em>What does middleware do?</em></td><td>Intercepts every action; used for logging, async (thunk), side effects (listener), persistence.</td></tr>
    <tr><td><em>RTK Query vs React Query?</em></td><td>Functionally similar. RTK Query if you're invested in Redux; React Query if standalone.</td></tr>
    <tr><td><em>What's normalization?</em></td><td>Storing entities by ID dictionary instead of nested arrays — single source per entity.</td></tr>
    <tr><td><em>When to use Redux?</em></td><td>Large cross-feature state, undo/redo, audit needs. Not for small/medium apps or pure server state.</td></tr>
    <tr><td><em>How does createAsyncThunk work?</em></td><td>Generates pending/fulfilled/rejected actions for an async function; integrates with extraReducers.</td></tr>
    <tr><td><em>What's tag-based invalidation?</em></td><td>RTK Query's pattern: queries provide tags; mutations invalidate them; invalidated queries refetch.</td></tr>
    <tr><td><em>How do you handle optimistic updates?</em></td><td><code>onQueryStarted</code> in RTK Query, with undo on failure.</td></tr>
    <tr><td><em>How do you avoid wasteful re-renders?</em></td><td>Memoize selectors, use shallowEqual, lift selectors to nearest parent.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Build a counter slice with RTK.</li>
  <li>Add a memoized selector that doubles the count.</li>
  <li>Add createAsyncThunk that fetches /api/count.</li>
  <li>Build an entity adapter for users.</li>
  <li>Set up RTK Query with one GET and one mutation.</li>
  <li>Add tag-based invalidation.</li>
  <li>Implement undo/redo via history slice.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Component re-renders on every dispatch despite irrelevant state changes — selector returning fresh references.</li>
  <li>Mutation succeeds but UI shows stale data — missing invalidatesTags.</li>
  <li>Reducers running async fetch — should be in createAsyncThunk.</li>
  <li>State has computed totals that get out of sync — should be derived selector.</li>
  <li>Form input lives in the global store — overkill; use useState.</li>
  <li>Type errors when dispatching thunks — missing AppDispatch typing.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>RTK fluency</td><td>You don't write classic Redux; you reach for createSlice, createAsyncThunk, RTK Query.</td></tr>
    <tr><td>Selector discipline</td><td>You memoize derived data; you lift selectors when shared.</td></tr>
    <tr><td>State-shape design</td><td>You normalize when needed; you keep local state local.</td></tr>
    <tr><td>Async patterns</td><td>You name createAsyncThunk and listener middleware; you justify when sagas.</td></tr>
    <tr><td>RTK Query awareness</td><td>You know tags, optimistic updates, polling, conditional fetching.</td></tr>
    <tr><td>TypeScript integration</td><td>You type RootState, AppDispatch, payload actions, thunk results.</td></tr>
    <tr><td>Honest tool selection</td><td>You can defend Redux vs Zustand vs React Query for the right use case.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Persistence:</strong> redux-persist with MMKV adapter (preferred over AsyncStorage for sync access and 30× speed).</li>
  <li><strong>Bridge cost:</strong> dispatch is sync JS-side; doesn't cross the bridge until the renderer reads. Many small dispatches OK.</li>
  <li><strong>Hot reloading:</strong> Redux state survives hot reloads (in dev); helps mobile dev loop.</li>
  <li><strong>Background fetch:</strong> RTK Query polling can fire while app is backgrounded; pause/resume on app state events.</li>
  <li><strong>Offline:</strong> persist whitelist your "outbox" queue; use listener middleware to flush on reconnect.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why prefer Redux over Context for global state?"</em> — Context re-renders all consumers when value changes; Redux uses subscriptions and selectors to skip irrelevant re-renders. Redux scales better for complex shared state.</li>
  <li><em>"Why is createSelector necessary?"</em> — A new array/object returned from a plain selector breaks reference equality, causing re-renders. createSelector memoizes input/output pairs.</li>
  <li><em>"When would you choose Sagas over thunks?"</em> — Complex async coordination (cancellable side effects, debouncing, racing, fork/join workflows). For 90% of cases, thunks + listener middleware suffice.</li>
  <li><em>"What's wrong with redux-persist for tokens?"</em> — Default storage is AsyncStorage / localStorage — accessible to any JS code. Use Keychain (iOS) / Keystore (Android) for credentials.</li>
  <li><em>"How does RTK Query differ from React Query?"</em> — Functional overlap is large. RTK Query lives in the Redux store; React Query has its own store. RTK Query: better fit for Redux apps, codegen tooling. React Query: simpler for standalone, more popular.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit the slice surface — which features have one slice, which have several? Consolidate.</li>
  <li>Identify any classic-Redux holdouts; migrate to RTK incrementally.</li>
  <li>Find non-memoized selectors causing re-renders; convert to createSelector.</li>
  <li>Audit what's in the store that shouldn't be (form inputs, modal state, derived data).</li>
  <li>Migrate any manual-fetch state to RTK Query if appropriate.</li>
  <li>Set up TypeScript types for RootState and AppDispatch if missing.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add the listener middleware for analytics events so we don't scatter analytics calls across reducers."</li>
  <li>"I'd write entity adapters for our top 3 collection types to standardize CRUD operations."</li>
  <li>"I'd add a per-feature 'state shape' diagram in the docs so new engineers can navigate."</li>
  <li>"I'd consider migrating server-state slices to RTK Query for cache benefits and fewer manual loading flags."</li>
  <li>"I'd profile re-renders with React DevTools and trace any high-fan-out selectors."</li>
</ul>
`
    }
  ]
});
