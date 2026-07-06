window.PREP_SITE.registerTopic({
  id: 'redux-advanced-testing',
  module: 'redux',
  title: 'Advanced Patterns & Testing',
  estimatedReadTime: '35 min',
  tags: ['redux', 'testing', 'performance', 'normalization', 'code-splitting', 'migration'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>This topic covers the patterns that separate "I've used Redux" from "I've maintained Redux at scale": <strong>normalizing</strong> state so nested/duplicated data doesn't rot, keeping <strong>selectors fast</strong> so a growing store doesn't mean growing re-renders, <strong>splitting reducers</strong> so a big app's store isn't one monolithic bundle, <strong>migrating</strong> a legacy <code>connect()</code>-and-switch-statements codebase without a rewrite, and <strong>testing</strong> every layer of a Redux app with confidence.</p>
<ul>
  <li><strong>Normalization:</strong> store entities keyed by id (<code>byId</code>/<code>allIds</code>, or RTK's <code>createEntityAdapter</code> equivalent) instead of nested/duplicated objects — dedupe, O(1) lookups, one place to update.</li>
  <li><strong>Selector performance:</strong> <code>useSelector</code> re-runs your selector on <em>every</em> dispatched action, but only re-renders if the result is <code>!==</code> the last one. Returning a fresh array/object each call defeats that check — memoize with <code>createSelector</code>, or compare with <code>shallowEqual</code>.</li>
  <li><strong>Code-splitting reducers:</strong> don't bundle every feature's reducer into the initial store. Inject reducers on demand with RTK's <code>combineSlices().inject()</code>, or the classic hand-rolled <code>reducerManager</code> pattern.</li>
  <li><strong>Migrating legacy Redux:</strong> <code>connect()</code> → hooks, and action-constants-plus-switch-reducers → <code>createSlice</code>, both done feature-by-feature — old and new code can coexist against the same store during the migration.</li>
  <li><strong>Testing:</strong> reducers/slices are pure functions — test them directly, no mocking. Thunks — mock the API, assert what got dispatched. RTK Query — mock the network with MSW, not the hook. Components — render against a <em>real</em> (but disposable, per-test) store via a <code>renderWithProviders</code> helper.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The problem: nested, duplicated state</h3>
<p>Imagine a store shaped like the API response you fetched it from:</p>
<pre><code class="language-js">{
  posts: [
    { id: 'p1', title: 'Hello', author: { id: 'u1', name: 'Ada' } },
    { id: 'p2', title: 'World', author: { id: 'u1', name: 'Ada' } },
  ],
}</code></pre>
<p>Ada's data is duplicated across every post she wrote. Rename her, and you must find and update every copy — miss one and your UI shows two different names for the same user. Look up "post p2" and you have to <code>.find()</code> through an array. Nest a comments-with-authors structure a level deeper and it gets worse. <strong>Normalization</strong> — storing each entity type once, keyed by id, and referencing it by id everywhere else — fixes all three problems: one source of truth per entity, O(1) lookup by id, and updates that touch exactly one place.</p>

<h3>The problem: selectors that cause re-render storms</h3>
<p>Redux's <code>useSelector</code> subscribes to <em>every</em> dispatched action — it has to, since it can't know in advance whether an action affects the slice of state you asked for. What it can control is whether that triggers a <em>re-render</em>: it compares the selector's return value to the value from last time, and only re-renders if they differ (by <code>===</code>, by default). A selector that builds a new array or object every time it runs — even one with identical contents — fails that check on every single dispatch, anywhere in the app, whether or not the data it cares about changed. On a large app that's death by a thousand cuts: dozens of components re-rendering on every action because their selectors "look" different each time even when nothing they depend on actually changed.</p>

<h3>The problem: one root reducer, one giant bundle</h3>
<p>The classic Redux setup combines every feature's reducer into a single root reducer at startup — <code>combineReducers({ auth, cart, reports, admin, ... })</code> — which means every feature's reducer code ships in the initial JavaScript bundle, whether or not the user ever visits that feature. On a large app with route-based code splitting, that's wasted bytes on every page load for reducers the user may never touch.</p>

<h3>The problem: a legacy codebase you can't rewrite in one sitting</h3>
<p>Most teams don't get to write Redux code fresh in 2026 — they inherit an app with <code>connect(mapStateToProps, mapDispatchToProps)</code>, hand-written action type constants, and switch-statement reducers, sunk cost that took years to build. Rewriting it all before shipping the next feature isn't realistic. The migration has to happen <em>incrementally</em>, feature by feature, while the app keeps working.</p>

<h3>The problem: how do you even test a Redux app?</h3>
<p>Redux touches four very different kinds of code — pure reducers, async thunks, server-cache logic (RTK Query), and React components wired to a store — and each needs a different testing strategy. Test a reducer like you'd test a component and you'll write brittle, over-mocked tests; test a component without a real store and you'll end up re-implementing Redux's plumbing in your test doubles.</p>

<div class="callout insight">
  <div class="callout-title">🧠 One-liner</div>
  <p>Every pattern in this topic is really the same move applied in a different place: keep the thing that changes often (data, code, tests) small, isolated, and provably correct on its own — instead of one big tangled blob you can only verify by running the whole app.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>Normalized shape: a database table, not a nested document</h3>
<p>Think of normalized state the way you'd think of relational database tables, not nested JSON:</p>
<pre><code class="language-js">{
  posts: {
    byId: {
      p1: { id: 'p1', title: 'Hello', authorId: 'u1' },
      p2: { id: 'p2', title: 'World', authorId: 'u1' },
    },
    allIds: ['p1', 'p2'],
  },
  users: {
    byId: { u1: { id: 'u1', name: 'Ada' } },
    allIds: ['u1'],
  },
}</code></pre>
<p><code>byId</code> is the lookup table (id → entity, O(1) access, no scanning arrays). <code>allIds</code> preserves order for anything that needs to render the full list. Relationships between entities (a post's author) are stored as an <strong>id reference</strong> (<code>authorId: 'u1'</code>), the same way a foreign key works in SQL — never as a copy of the related object. RTK's <code>createEntityAdapter</code> generates exactly this shape for you, just with the field names <code>ids</code>/<code>entities</code> instead of <code>allIds</code>/<code>byId</code> — same idea, different naming convention.</p>

<h3><code>useSelector</code>'s two-step gate</h3>
<p>Hold this model in your head for every selector you write:</p>
<ol>
  <li><strong>Step 1 — always runs:</strong> on every dispatched action, <code>useSelector</code> calls your selector function again with the latest state.</li>
  <li><strong>Step 2 — gates the re-render:</strong> it compares the new return value to the previous return value. Only if they're <code>!==</code> (by default, reference equality) does the component actually re-render.</li>
</ol>
<p>Step 1 is unavoidable — it's how Redux notices anything. Step 2 is where performance is won or lost, and it's entirely about what your selector <em>returns</em>: a primitive (number, string, boolean) or the exact same object/array reference as before passes step 2 cheaply; a freshly-built object or array literal never does, even when its contents are identical to last time.</p>

<h3>Code-splitting: the store as an extensible registry, not a fixed shape</h3>
<p>Instead of thinking of the root reducer as "all the reducers, decided once at startup," think of it as a <strong>registry</strong> that starts with only what the initial route needs, and that features can register more reducers into later, on demand — the same mental model as lazy-loading a route component, just for reducer code instead of UI code.</p>

<h3>Testing: match the tool to the layer</h3>
<p>Picture Redux as four layers, from purest to most integrated, and test each one at the layer where it's cheapest and most reliable to verify:</p>
<pre><code class="language-text">Reducer/slice   →  pure function            →  call it directly, assert the return value
Thunk           →  orchestrates a dispatch   →  mock the API, assert what got dispatched
RTK Query       →  orchestrates a fetch      →  mock the NETWORK (MSW), not the hook
Component       →  reads/writes the store    →  render with a REAL, disposable store (RTL)
</code></pre>
<p>Testing a lower layer at a higher layer's cost (e.g. rendering a whole component tree just to check a reducer's math) is slow and brittle. Testing a higher layer by mocking a lower one too aggressively (e.g. mocking <code>useSelector</code> itself) tests your mocks instead of your app.</p>

<div class="callout insight">
  <div class="callout-title">🔥 Key insight</div>
  <p>Every pattern here has the same shape: <strong>keep reference identity stable when nothing meaningfully changed.</strong> Normalization keeps entity references stable across updates to unrelated entities. Memoized selectors keep derived-data references stable across unrelated dispatches. Both exist so <code>===</code> comparisons — the ones <code>useSelector</code> relies on — stay meaningful.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Normalization, plus the <code>createEntityAdapter</code> recap</h3>
<p>Hand-rolling the normalized shape from the mental model looks like this in a reducer:</p>
<pre><code class="language-js">function postsReducer(state = { byId: {}, allIds: [] }, action) {
  switch (action.type) {
    case 'posts/added': {
      const post = action.payload;
      return {
        byId: { ...state.byId, [post.id]: post },
        allIds: state.allIds.includes(post.id)
          ? state.allIds
          : [...state.allIds, post.id],
      };
    }
    default:
      return state;
  }
}

// selectors built on top of the shape
const selectAllPosts = (state) => state.posts.allIds.map((id) => state.posts.byId[id]);
const selectPostById = (state, id) => state.posts.byId[id];</code></pre>
<p>RTK's <code>createEntityAdapter</code> generates this exact pattern — the reducer logic, plus the selectors — for you:</p>
<pre><code class="language-js">import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

const postsAdapter = createEntityAdapter(); // default: entity.id is the key

const postsSlice = createSlice({
  name: 'posts',
  initialState: postsAdapter.getInitialState(), // => { ids: [], entities: {} }
  reducers: {
    postAdded: postsAdapter.addOne,
    postUpdated: postsAdapter.updateOne,
    postRemoved: postsAdapter.removeOne,
  },
});

export const { postAdded, postUpdated, postRemoved } = postsSlice.actions;
export default postsSlice.reducer;

// getSelectors() generates selectAll, selectById, selectIds, etc., pre-wired to this slice
export const { selectAll: selectAllPosts, selectById: selectPostById } =
  postsAdapter.getSelectors((state) => state.posts);</code></pre>
<p>Same idea as the hand-rolled version — one lookup table, one ordered id list — just generated instead of hand-maintained, and named <code>entities</code>/<code>ids</code> rather than <code>byId</code>/<code>allIds</code>.</p>

<h3>Selector performance: <code>createSelector</code>, identity, and <code>shallowEqual</code></h3>
<p>A selector that builds a new array every call breaks the <code>!==</code> check that <code>useSelector</code> relies on:</p>
<pre><code class="language-js">// ❌ returns a brand-new array every single call, even with unchanged inputs
const selectCompletedTodos = (state) =>
  state.todos.filter((todo) => todo.completed);</code></pre>
<p><code>createSelector</code> (RTK re-exports it from Reselect) fixes this by memoizing: it caches the last inputs and the last result, and only recomputes when an input actually changed.</p>
<pre><code class="language-js">import { createSelector } from '@reduxjs/toolkit';

const selectCompletedTodos = createSelector(
  [(state) => state.todos],           // "input selector" — plucks raw state
  (todos) => todos.filter((t) => t.completed) // "result function" — only reruns if todos changed
);</code></pre>
<p>As of Reselect 5 (what current RTK ships), <code>createSelector</code> defaults to <strong>weakMapMemoize</strong>: instead of caching just the single most recent call, it builds a tree of cached results keyed by argument identity, so the same selector called with many different arguments (e.g. <code>selectPostById(state, id)</code> called once per row in a list) still gets a cache hit per distinct <code>id</code>, not just the last one called. Cache entries are held via <code>WeakMap</code>/<code>Map</code>, so they're garbage-collected once nothing references those arguments anymore — you don't manage cache size by hand.</p>
<p>When you can't avoid returning a fresh object/array from a selector (e.g. combining two independent pieces of state inline), pass <code>useSelector</code> a custom equality function instead of memoizing the selector itself:</p>
<pre><code class="language-jsx">import { useSelector, shallowEqual } from 'react-redux';

function TodoStats() {
  const { count, completed } = useSelector(
    (state) => ({
      count: state.todos.length,
      completed: state.todos.filter((t) => t.completed).length,
    }),
    shallowEqual // compare the returned object's OWN properties, not its reference
  );
  return <p>{completed} of {count} done</p>;
}</code></pre>
<p><code>shallowEqual</code> compares one level of keys/values instead of the object reference — cheap, and correct as long as the values themselves are primitives or stable references. Rule of thumb: derive primitives when you can (they compare by value automatically); reach for <code>createSelector</code> when the derivation is shared/reused; reach for <code>shallowEqual</code> when you must build an object inline right there in the component.</p>

<h3>Code-splitting reducers: dynamic injection</h3>
<p>RTK 2.x's <code>combineSlices</code> produces a reducer that other code can add slices to later, via <code>.inject()</code>:</p>
<pre><code class="language-js">// app/rootReducer.js — only what the shell/first route needs, combined eagerly
import { combineSlices } from '@reduxjs/toolkit';
import { authSlice } from '../features/auth/authSlice';

export const rootReducer = combineSlices(authSlice);</code></pre>
<pre><code class="language-js">// app/store.js
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';

export const store = configureStore({ reducer: rootReducer });</code></pre>
<pre><code class="language-js">// features/reports/reportsSlice.js — only loaded when the reports route is visited
import { createSlice } from '@reduxjs/toolkit';
import { rootReducer } from '../../app/rootReducer';

const reportsSlice = createSlice({
  name: 'reports',
  initialState: { items: [] },
  reducers: {
    reportsLoaded: (state, action) => { state.items = action.payload; },
  },
});

rootReducer.inject(reportsSlice); // adds it to the reducer the store already holds
export const { reportsLoaded } = reportsSlice.actions;</code></pre>
<div class="callout warn">
  <div class="callout-title">⚠️ Gotcha</div>
  <p><code>.inject()</code> registers the slice into the reducer map, but doesn't dispatch anything itself — the injected slice's state won't appear until the <em>next</em> action is dispatched (even a no-op one). If code immediately after <code>.inject()</code> tries to read the new slice's state, it may not be there yet.</p>
</div>
<p>Before RTK shipped this, the same idea was done by hand with a <strong>reducer manager</strong> — still valid, and worth recognizing in older codebases:</p>
<pre><code class="language-js">function createReducerManager(initialReducers) {
  const reducers = { ...initialReducers };
  let combinedReducer = combineReducers(reducers);

  return {
    reduce: (state, action) => combinedReducer(state, action),
    add(key, reducer) {
      if (!key || reducers[key]) return;
      reducers[key] = reducer;
      combinedReducer = combineReducers(reducers); // rebuild with the new reducer included
    },
  };
}

const reducerManager = createReducerManager({ auth: authReducer });
const store = createStore(reducerManager.reduce);
store.reducerManager = reducerManager;

// later, when the reports feature loads:
store.reducerManager.add('reports', reportsReducer);
store.dispatch({ type: '@@reports/INIT' }); // run the store once so the new key appears</code></pre>
<p>Same shape as <code>.inject()</code>: a mutable map of reducers closed over by one function the store calls, extended after the fact, with a dispatch needed afterward to make the new slice visible.</p>

<h3>Migrating a legacy Redux codebase</h3>
<p>Legacy Redux usually looks like this — string constants, a switch reducer, class components wired up with <code>connect</code>:</p>
<pre><code class="language-jsx">// BEFORE
const INCREMENTED = 'counter/INCREMENTED';
const increment = () => ({ type: INCREMENTED });

function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case INCREMENTED:
      return { ...state, count: state.count + 1 };
    default:
      return state;
  }
}

class Counter extends React.Component {
  render() {
    return <button onClick={this.props.increment}>{this.props.count}</button>;
  }
}
const mapStateToProps = (state) => ({ count: state.counter.count });
export default connect(mapStateToProps, { increment })(Counter);</code></pre>
<p>The RTK + hooks equivalent removes the constants, the switch, and the class wrapper — but the store and the shape of state don't have to change on day one:</p>
<pre><code class="language-jsx">// AFTER
import { createSlice } from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    incremented: (state) => { state.count += 1; }, // Immer makes this safe
  },
});
export const { incremented } = counterSlice.actions;
export default counterSlice.reducer;

function Counter() {
  const count = useSelector((state) => state.counter.count);
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(incremented())}>{count}</button>;
}</code></pre>
<p>The migration path that keeps the app shippable throughout:</p>
<ul>
  <li><strong>Don't rewrite the store.</strong> Old switch reducers and new <code>createSlice</code> reducers are both just <code>(state, action) => newState</code> functions — they can sit side by side in the same <code>combineReducers</code>/<code>combineSlices</code> call indefinitely.</li>
  <li><strong>Migrate one feature at a time</strong>, starting with whichever slice changes most often or is best covered by tests — that's where the payoff (less boilerplate, Immer-safe updates) is highest soonest.</li>
  <li><strong><code>connect()</code> and hooks can coexist</strong> in the same component tree during the migration, since both ultimately read from and dispatch to the same store. Convert component-by-component, not tree-by-tree.</li>
  <li><strong>Watch action-type strings if other code depends on them</strong> (sagas, analytics middleware, logging matched on literal strings). <code>createSlice</code> generates types as <code>${'${name}/${reducerName}'}</code> — name the slice and reducer to reproduce the old string if anything outside the slice still matches on it.</li>
  <li><strong>Delete the old reducer only once nothing dispatches through it or reads its slice</strong> — grep for the old action constants and the old state key before removing them.</li>
</ul>

<h3>Testing, layer by layer</h3>
<p><strong>Reducers/slices are pure functions</strong> — call them directly with a state and an action, and assert on the return value. No store, no React, no mocking:</p>
<pre><code class="language-js">test('incremented adds one', () => {
  expect(counterReducer({ count: 3 }, incremented())).toEqual({ count: 4 });
});</code></pre>
<p><strong>Thunks</strong> orchestrate dispatches around async work — test them by mocking the thing they call out to (the API), and asserting what got dispatched, in what order:</p>
<pre><code class="language-js">const fetchUser = (id) => async (dispatch, getState, api) => {
  dispatch({ type: 'users/loading' });
  const user = await api.getUser(id);
  dispatch({ type: 'users/loaded', payload: user });
};

test('fetchUser dispatches loading then loaded', async () => {
  const dispatch = jest.fn();
  const fakeApi = { getUser: jest.fn().mockResolvedValue({ id: '1', name: 'Ada' }) };

  await fetchUser('1')(dispatch, () => ({}), fakeApi);

  expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'users/loading' });
  expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'users/loaded', payload: { id: '1', name: 'Ada' } });
});</code></pre>
<p><strong>RTK Query</strong> is best tested by mocking the network, not the generated hook — <a href="https://mswjs.io" target="_blank" rel="noopener">Mock Service Worker (MSW)</a> intercepts the actual HTTP request, so the real query/cache logic runs unmodified:</p>
<pre><code class="language-js">import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/pets/:id', () => HttpResponse.json({ id: '1', name: 'Rex' }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());</code></pre>
<p>If a test suite reuses one store instance across tests, reset RTK Query's cache between tests so one test's cached response can't leak into the next: <code>store.dispatch(petApi.util.resetApiState())</code>.</p>
<p><strong>Components</strong> that read/dispatch to the store need a <em>real</em> store in the test — mocking <code>useSelector</code>/<code>useDispatch</code> means you're no longer testing the component's actual wiring. The standard approach is a <code>renderWithProviders</code> helper that wraps React Testing Library's <code>render</code> in a fresh <code>&lt;Provider&gt;</code> per test (full code in the next section).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — <code>renderWithProviders</code> test helper</h3>
<p>A reusable helper that creates a fresh store per test (optionally seeded with <code>preloadedState</code>) and wraps the component under test in a real <code>&lt;Provider&gt;</code>:</p>
<pre><code class="language-jsx">// test-utils.jsx
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import rootReducer from '../app/rootReducer';

export function setupStore(preloadedState) {
  // A brand-new store per call — nothing leaks in from a previous test.
  return configureStore({ reducer: rootReducer, preloadedState });
}

export function renderWithProviders(
  ui,
  { preloadedState, store = setupStore(preloadedState), ...renderOptions } = {}
) {
  function Wrapper({ children }) {
    return &lt;Provider store={store}&gt;{children}&lt;/Provider&gt;;
  }
  // Return the store too, so a test can dispatch more actions or read state directly.
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}</code></pre>

<h3>Example 2 — slice unit test</h3>
<pre><code class="language-js">// todosSlice.test.js
import todosReducer, { addTodo, toggleTodo } from './todosSlice';

test('addTodo appends a new, incomplete todo', () => {
  const state = todosReducer([], addTodo('Write tests'));
  expect(state).toEqual([
    { id: expect.any(Number), text: 'Write tests', completed: false },
  ]);
});

test('toggleTodo flips only the matching todo, leaves others untouched', () => {
  const initial = [
    { id: 1, text: 'A', completed: false },
    { id: 2, text: 'B', completed: false },
  ];
  const state = todosReducer(initial, toggleTodo(1));

  expect(state[0].completed).toBe(true);
  expect(state[1]).toBe(initial[1]); // reference-equal: this todo was never touched
});</code></pre>

<h3>Example 3 — thunk test</h3>
<pre><code class="language-js">// usersThunks.js
export const fetchUser = (id) => async (dispatch, getState, api) => {
  dispatch({ type: 'users/loading' });
  try {
    const user = await api.getUser(id);
    dispatch({ type: 'users/loaded', payload: user });
  } catch (err) {
    dispatch({ type: 'users/failed', payload: err.message });
  }
};</code></pre>
<pre><code class="language-js">// usersThunks.test.js
import { fetchUser } from './usersThunks';

test('fetchUser dispatches loading then loaded on success', async () => {
  const dispatch = jest.fn();
  const fakeApi = { getUser: jest.fn().mockResolvedValue({ id: '1', name: 'Ada' }) };

  await fetchUser('1')(dispatch, () => ({}), fakeApi);

  expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'users/loading' });
  expect(dispatch).toHaveBeenNthCalledWith(2, {
    type: 'users/loaded',
    payload: { id: '1', name: 'Ada' },
  });
});

test('fetchUser dispatches failed on rejection', async () => {
  const dispatch = jest.fn();
  const fakeApi = { getUser: jest.fn().mockRejectedValue(new Error('network down')) };

  await fetchUser('1')(dispatch, () => ({}), fakeApi);

  expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'users/failed', payload: 'network down' });
});</code></pre>

<h3>Example 4 — component test with a real store</h3>
<pre><code class="language-jsx">// TodoList.test.jsx
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import TodoList from './TodoList';

test('adding a todo shows it in the list', () => {
  renderWithProviders(&lt;TodoList /&gt;, { preloadedState: { todos: [] } });

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Buy milk' } });
  fireEvent.click(screen.getByText('Add'));

  expect(screen.getByText('Buy milk')).toBeInTheDocument();
});

test('starting with a preloaded todo renders it immediately', () => {
  renderWithProviders(&lt;TodoList /&gt;, {
    preloadedState: { todos: [{ id: 1, text: 'Existing', completed: false }] },
  });

  expect(screen.getByText('Existing')).toBeInTheDocument();
});</code></pre>
<p>Notice what none of these tests do: mock <code>useSelector</code>, mock <code>useDispatch</code>, or mock the reducer. The component test above runs the <em>real</em> reducer, inside a <em>real</em> (if disposable) store — the only thing swapped out anywhere is the network layer (the fake <code>api</code> object in the thunk test, MSW for RTK Query).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3>A selector that returns a new array every call</h3>
<pre><code class="language-js">// ❌ every call allocates a new array, even when state.todos didn't change
const selectCompletedTodos = (state) => state.todos.filter((t) => t.completed);</code></pre>
<p>The symptom rarely looks like "a selector bug" at first — it looks like a component re-rendering on every keystroke somewhere else in the app, or React DevTools' "highlight updates" flagging a component that has nothing to do with the action that was just dispatched. The cause is always the same: <code>useSelector</code> ran the selector (as it does on every dispatch), got back a new array reference, and — because <code>!==</code> is all it checks by default — decided state "changed" and re-rendered. Fix it with <code>createSelector</code> (reuse the memoized reference when inputs are unchanged) or, for one-off inline object/array construction, <code>shallowEqual</code> as <code>useSelector</code>'s second argument.</p>

<h3>Testing against a shared store instead of a fresh one per test</h3>
<pre><code class="language-js">// ❌ importing the app's real, singleton store into a test file
import { store } from '../../app/store';

test('adds a todo', () => {
  store.dispatch(addTodo('A'));
  expect(selectAllTodos(store.getState())).toHaveLength(1); // passes alone, fails in a suite
});</code></pre>
<p>Import the app's real store instance and every test that touches it shares state with every <em>other</em> test that touches it — test order starts to matter, tests pass in isolation but fail in a full run, and RTK Query's cache (if the app uses it) carries responses from one test's mocked network into the next test's assertions. The fix is always the same: build a fresh store per test (the <code>setupStore</code>/<code>renderWithProviders</code> pattern), or, if a store genuinely must be shared, explicitly reset the pieces that carry state across dispatches (e.g. <code>store.dispatch(api.util.resetApiState())</code> for RTK Query) in a <code>beforeEach</code>.</p>

<h3>Over-normalizing state that's small and never updated by id</h3>
<p>Normalization earns its keep when entities are added, updated, or removed individually and referenced from more than one place — user profiles, posts, cart line items. A static list of 5 dropdown options, or a one-shot config object fetched once and never patched by id, gets nothing out of a <code>byId</code>/<code>allIds</code> shape except extra selectors and adapter boilerplate to maintain. Normalize entities that behave like a database table; leave small, static, or write-once data as a plain array or object.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">Why normalize state instead of nesting it the way the API returns it?</div>
<div class="qa-a">
<p>Nested/duplicated data means the same entity (e.g. a post's author) can be copied in multiple places, so updating it means finding and updating every copy — miss one and the UI shows inconsistent data. Normalizing (an id-keyed lookup table plus an ordered id list, or RTK's <code>createEntityAdapter</code> equivalent) stores each entity exactly once: O(1) lookup by id, one place to update, and other entities reference it by id rather than by copying it — the same reasoning as normalizing a relational database schema.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you keep selectors fast, and what's actually slow about a naive one?</div>
<div class="qa-a">
<p><code>useSelector</code> re-runs your selector function on every dispatched action — that part is unavoidable — but only re-renders the component if the returned value is <code>!==</code> the previous one. A selector that builds a new array/object each call (e.g. <code>state.todos.filter(...)</code>) returns a different reference every time even when the underlying data hasn't changed, so it fails that check on every dispatch anywhere in the app and forces a re-render. <code>createSelector</code> (Reselect, re-exported by RTK) memoizes: it caches the last inputs and result and returns the cached reference when inputs haven't changed. For one-off object/array construction inline in a component, pass <code>shallowEqual</code> as <code>useSelector</code>'s second argument instead.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you code-split reducers in a large app?</div>
<div class="qa-a">
<p>Combine only the reducers the initial route needs at startup, and inject the rest on demand as features load. RTK 2.x's <code>combineSlices()</code> returns a reducer with an <code>.inject()</code> method — call it from a feature's own module (e.g. behind a lazy-loaded route) to register that feature's slice into the live store without touching the app's central reducer file. Before RTK, the same idea was done by hand with a <code>reducerManager</code>: a closure holding a mutable map of reducers, rebuilt via <code>combineReducers</code> whenever a new one is added, with the store's single reducer function always pointing at the manager's <code>reduce</code> method.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How would you migrate a legacy <code>connect()</code>-based app to Redux Toolkit without a big-bang rewrite?</div>
<div class="qa-a">
<p>Incrementally, because old-style reducers and RTK's <code>createSlice</code> reducers are both just <code>(state, action) =&gt; newState</code> functions that can live side by side in the same combined root reducer indefinitely. Migrate one feature at a time — usually starting with whichever slice changes most or is best covered by tests — converting its constants/switch-reducer to a <code>createSlice</code>, and swapping that feature's <code>connect()</code> components for <code>useSelector</code>/<code>useDispatch</code> hooks one component at a time. Both styles read from and dispatch to the same store, so they coexist safely in the same tree throughout the migration. Only delete the old action constants and reducer once nothing outside the migrated slice still dispatches through or reads them.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you test Redux code — reducers, thunks, RTK Query, and components?</div>
<div class="qa-a">
<p>Match the test to the layer. <strong>Reducers/slices</strong> are pure functions — call <code>reducer(state, action)</code> directly and assert on the return value, no mocking needed. <strong>Thunks</strong> orchestrate dispatches around async work — mock the API they call, then assert what got dispatched and in what order. <strong>RTK Query</strong> endpoints are best tested by mocking the network itself with something like Mock Service Worker, rather than mocking the generated hook, so the real caching/request logic still runs. <strong>Components</strong> that read from or dispatch to the store need a real (but fresh, per-test) store — a <code>renderWithProviders</code> helper that wraps React Testing Library's <code>render</code> in a <code>&lt;Provider store={setupStore(preloadedState)}&gt;</code> is the standard pattern, so the component's actual Redux wiring runs unmocked.</p>
</div>
</div>
`}

]});
