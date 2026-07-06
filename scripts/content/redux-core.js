window.PREP_SITE.registerTopic({
  id: 'redux-core',
  module: 'redux',
  title: 'Why Redux & Core Concepts',
  estimatedReadTime: '25 min',
  tags: ['redux', 'state-management', 'fundamentals', 'store', 'reducers'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Redux</strong> is a small library for holding all of an app's shared state in <strong>one place</strong> (the store), where the only way to change it is by describing "what happened" (an <strong>action</strong>) and running that through a <strong>pure function</strong> (a reducer) that computes the new state.</p>
<ul>
  <li><strong>The loop:</strong> a component calls <code>dispatch(action)</code> → the reducer computes <code>newState</code> from <code>(state, action)</code> → the store saves it → every subscribed component re-reads and re-renders.</li>
  <li><strong>Why it exists:</strong> once state needs to be shared by components that aren't close neighbors, passing it down as props ("prop-drilling") gets painful and updates get hard to trace. Redux gives that shared state one predictable home.</li>
  <li><strong>You might not need it.</strong> Local component state (<code>useState</code>) still wins for anything one component (or its direct children) own. React <code>Context</code> is often enough for state a handful of components share. Redux earns its keep when state is large, shared across many unrelated features, or you need strict traceability (e.g. undo/redo, time-travel debugging).</li>
  <li><strong>This topic hand-rolls Redux</strong> — writing <code>createStore</code>, action objects, and switch-statement reducers by hand — purely so you can <em>see</em> the mechanism. Nobody ships hand-written Redux in 2026.</li>
  <li><strong>What you'll actually use:</strong> <a href="#/topic/redux-toolkit">Redux Toolkit (RTK)</a>, next topic in this module, which generates all of this boilerplate for you. Learn the primitives here first — RTK will make a lot more sense once you've seen what it's automating away.</li>
</ul>
<p>Already know the basics and just want a fast reference? See the condensed <a href="#/topic/state-redux">Redux / RTK / RTK Query</a> deep-dive.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The problem Redux solves</h3>
<p>Say you're building a small e-commerce app. A <code>Header</code> shows the cart item count. A <code>ProductCard</code>, many levels away in the tree, has the "Add to cart" button. A <code>CartPage</code>, somewhere else entirely, needs the full cart list. All three need the <em>same</em> cart state, but none of them is an ancestor of the others.</p>
<p>With only component state, you'd have to lift the cart state up to the nearest common ancestor — often close to the app root — and then pass it down through every layer of components in between, even ones that don't care about it. That's <strong>prop-drilling</strong>: state and the setters for it get threaded through five or six components that only exist to pass them along.</p>
<p>As an app grows, two things get worse:</p>
<ul>
  <li><strong>Prop-drilling compounds.</strong> Every new consumer of shared state means another chain of props to wire up, and refactors get risky because you have to trace every hop.</li>
  <li><strong>Updates become unpredictable.</strong> When five different components can each modify a piece of shared state directly (via callbacks passed down, or by reaching into shared mutable objects), it becomes hard to answer "what changed this value, and when?" Bugs turn into archaeology.</li>
</ul>

<h3>What Redux gives you instead</h3>
<p>Redux's answer: put the shared state in exactly <strong>one place</strong> (the <em>store</em>), and make the <em>only</em> way to change it be dispatching a plain object describing what happened (an <em>action</em>), which a pure function (a <em>reducer</em>) turns into the next state. Any component, anywhere in the tree, can read from the store or dispatch an action directly — no prop-drilling required.</p>
<p>This buys you:</p>
<ul>
  <li><strong>Predictability.</strong> State only ever changes in response to a dispatched action, run through a pure reducer. Same state + same action always produces the same result.</li>
  <li><strong>Traceability.</strong> Every state change corresponds to exactly one action. Log the actions, and you have a complete history of everything that happened to your app's state — which is what makes tools like Redux DevTools' time-travel debugging possible.</li>
  <li><strong>Decoupling.</strong> Components don't need to know about each other or be related in the tree to share state. They just dispatch actions and read from the store.</li>
</ul>

<h3>Honest talk: you might not need Redux</h3>
<p>Redux is a tool for a specific problem — complex, widely-shared <em>client</em> state. It is not the default answer to "where do I put my state." Before reaching for it, ask:</p>
<ul>
  <li><strong>Is this state used by only one component (or its direct children)?</strong> Use <code>useState</code>/<code>useReducer</code> locally. Don't globalize it.</li>
  <li><strong>Is this state shared by a moderate, fairly stable set of components (e.g. current theme, logged-in user)?</strong> React's built-in <code>Context</code> is often enough, with no extra library.</li>
  <li><strong>Is this state actually a cache of data that lives on a server</strong> (a list of products, a user's profile)? That's <em>server state</em>, not client state — libraries like React Query/RTK Query (fetching, caching, refetching, background sync) fit far better than modeling it by hand in a Redux store.</li>
  <li><strong>Is the state large, touched by many unrelated features, and does it need strong guarantees</strong> (auditability, undo/redo, predictable debugging across a big team)? That's where Redux earns its complexity.</li>
</ul>
<div class="callout insight">
  <div class="callout-title">🧠 One-liner</div>
  <p>Reach for local state first, Context second, and Redux (via RTK) only when shared client state has genuinely outgrown both.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>Four pieces, one loop</h3>
<ul>
  <li><strong>Store</strong> — the single source of truth. One JavaScript object holding your entire app's shared state. There is exactly one store per app.</li>
  <li><strong>Action</strong> — a plain object describing "what happened." By convention it looks like <code>{ type: 'cart/itemAdded', payload: { sku: 'abc', qty: 1 } }</code>. Actions are just data — they don't do anything by themselves.</li>
  <li><strong>Reducer</strong> — a <strong>pure</strong> function: <code>(state, action) =&gt; newState</code>. Given the current state and an action, it computes and returns the <em>next</em> state. It never mutates the old state, and it never does anything unpredictable (no random values, no dates, no network calls).</li>
  <li><strong>Dispatch</strong> — the one function you call to trigger a change: <code>store.dispatch(action)</code>. It hands the action to the reducer, saves whatever the reducer returns as the new state, and then notifies every subscriber that state changed.</li>
</ul>

<h3>The loop, end to end</h3>
<pre><code class="language-text">┌─────────────┐   dispatch(action)   ┌─────────────┐
│  Component  │ ───────────────────► │    Store    │
└─────────────┘                      └──────┬──────┘
      ▲                                     │  runs
      │                                     ▼
      │                              ┌─────────────┐
      │                              │   Reducer   │
      │                              │(state,action)│
      │                              │ =&gt; newState │
      │                              └──────┬──────┘
      │                                     │ store saves
      │                                     │ newState, notifies
      │           re-render                 ▼
      └────────────────────── subscribers re-read state
</code></pre>
<p>Walk through it with the cart example:</p>
<ol>
  <li>User clicks "Add to cart" on a <code>ProductCard</code>.</li>
  <li>The component calls <code>dispatch({ type: 'cart/itemAdded', payload: { sku: 'abc', qty: 1 } })</code>. It doesn't touch the cart state directly — it just describes what happened.</li>
  <li>The store runs the reducer with the <em>current</em> state and this action. The reducer returns a brand-new state object with the item appended to the cart.</li>
  <li>The store replaces its internal state with that new object and tells every subscriber "something changed."</li>
  <li>The <code>Header</code> (showing cart count) and <code>CartPage</code> (showing cart items) — both subscribed to the store — re-read the new state and re-render. Neither needed a prop passed from <code>ProductCard</code>; they just read from the shared store.</li>
</ol>
<p>Notice what never happens in this loop: no component ever reaches in and does <code>state.cart.items.push(...)</code>. The <em>only</em> door in is <code>dispatch</code>, and the <em>only</em> thing behind that door is a pure reducer.</p>

<div class="callout insight">
  <div class="callout-title">🔥 Key insight</div>
  <p>Redux state changes are always <strong>synchronous, one-way, and traceable</strong>: action in → reducer runs → new state out → subscribers notified. There's no path for state to change any other way.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Hand-rolling <code>createStore</code></h3>
<p>To make the mechanism concrete, here's the entire engine behind Redux's store — about 15 lines. It's simplified (real Redux adds edge-case handling), but this is genuinely the core of it:</p>
<pre><code class="language-js">function createStore(reducer) {
  let state = reducer(undefined, { type: '@@INIT' }); // seed initial state
  let listeners = [];

  function getState() {
    return state;
  }

  function dispatch(action) {
    state = reducer(state, action);       // compute the next state
    listeners.forEach((listener) => listener()); // notify subscribers
  }

  function subscribe(listener) {
    listeners.push(listener);
    return () => {                        // unsubscribe function
      listeners = listeners.filter((l) => l !== listener);
    };
  }

  return { getState, dispatch, subscribe };
}</code></pre>
<p>That's it: <code>state</code> is a closed-over variable, <code>dispatch</code> re-assigns it by calling the reducer, and <code>subscribe</code> lets anyone register a "state changed" callback. There's no magic — just a variable, a function that recomputes it, and a list of callbacks.</p>

<h3>A counter reducer, wired to that store</h3>
<pre><code class="language-js">// The reducer: pure, no side effects, returns a NEW state each time.
function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case 'counter/incremented':
      return { count: state.count + 1 };
    case 'counter/decremented':
      return { count: state.count - 1 };
    default:
      return state; // unknown action: return state unchanged
  }
}

const store = createStore(counterReducer);

store.subscribe(() => console.log('state is now', store.getState()));

store.dispatch({ type: 'counter/incremented' }); // logs: state is now { count: 1 }
store.dispatch({ type: 'counter/incremented' }); // logs: state is now { count: 2 }
store.dispatch({ type: 'counter/decremented' }); // logs: state is now { count: 1 }</code></pre>

<h3>Two rules the reducer must never break</h3>
<ul>
  <li><strong>Never mutate — always return a new object.</strong> <code>state.count++; return state;</code> looks like it works, but it breaks Redux's ability to detect "did anything change" (many parts of the React-Redux ecosystem compare old vs. new state by reference, not by deep equality). Always build and return a new object/array.</li>
  <li><strong>Reducers must be pure — no side effects, no async.</strong> No <code>fetch</code>, no <code>Date.now()</code>, no <code>Math.random()</code>, no reading/writing anything outside the function's inputs. Given the same <code>(state, action)</code>, a reducer must <em>always</em> return the same result. That's what makes state changes replayable and debuggable — async work and randomness belong outside the reducer (you'll see where, in a later topic on middleware).</li>
</ul>

<h3>Wiring it into React: <code>Provider</code>, <code>useSelector</code>, <code>useDispatch</code></h3>
<p>The <code>react-redux</code> library connects a real Redux store to React components with three pieces:</p>
<pre><code class="language-jsx">import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store';

// 1. Provider makes the store available to every component below it.
function App() {
  return (
    &lt;Provider store={store}&gt;
      &lt;Counter /&gt;
    &lt;/Provider&gt;
  );
}

// 2. useSelector reads a slice of state and re-renders when it changes.
// 3. useDispatch gives you the dispatch function to send actions.
function Counter() {
  const count = useSelector((state) =&gt; state.count);
  const dispatch = useDispatch();

  return (
    &lt;div&gt;
      &lt;p&gt;{count}&lt;/p&gt;
      &lt;button onClick={() =&gt; dispatch({ type: 'counter/incremented' })}&gt;+&lt;/button&gt;
      &lt;button onClick={() =&gt; dispatch({ type: 'counter/decremented' })}&gt;-&lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>
<p><code>Provider</code> wraps once, near the app root. Any component anywhere underneath — no matter how deeply nested — can call <code>useSelector</code> to read state and <code>useDispatch</code> to send actions, with zero props threaded through the components in between. That's the prop-drilling problem, solved.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Counter (actions, reducer, component)</h3>
<pre><code class="language-js">// actions
const increment = () => ({ type: 'counter/incremented' });
const decrement = () => ({ type: 'counter/decremented' });
const incrementBy = (amount) => ({ type: 'counter/incrementedBy', payload: amount });

// reducer
function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case 'counter/incremented':
      return { count: state.count + 1 };
    case 'counter/decremented':
      return { count: state.count - 1 };
    case 'counter/incrementedBy':
      return { count: state.count + action.payload };
    default:
      return state;
  }
}</code></pre>
<pre><code class="language-jsx">function Counter() {
  const count = useSelector((state) => state.count);
  const dispatch = useDispatch();

  return (
    &lt;div&gt;
      &lt;p&gt;Count: {count}&lt;/p&gt;
      &lt;button onClick={() => dispatch(decrement())}&gt;-&lt;/button&gt;
      &lt;button onClick={() => dispatch(increment())}&gt;+&lt;/button&gt;
      &lt;button onClick={() => dispatch(incrementBy(5))}&gt;+5&lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>
<p>Notice <code>increment</code>/<code>decrement</code>/<code>incrementBy</code> are just plain functions that <em>build</em> action objects — this pattern is called an "action creator." It's optional (you could dispatch <code>{ type: '...' }</code> literals directly), but it keeps the action shape in one place instead of retyped everywhere.</p>

<h3>Example 2 — Todo list (add/toggle)</h3>
<pre><code class="language-js">// actions
const addTodo = (text) => ({
  type: 'todos/added',
  payload: { id: Date.now(), text, completed: false },
});
const toggleTodo = (id) => ({ type: 'todos/toggled', payload: { id } });

// reducer
function todosReducer(state = [], action) {
  switch (action.type) {
    case 'todos/added':
      return [...state, action.payload]; // new array, item appended
    case 'todos/toggled':
      return state.map((todo) =>
        todo.id === action.payload.id
          ? { ...todo, completed: !todo.completed } // new object for the changed todo
          : todo // untouched todos are returned as-is
      );
    default:
      return state;
  }
}</code></pre>
<pre><code class="language-jsx">function TodoList() {
  const todos = useSelector((state) => state.todos);
  const dispatch = useDispatch();
  const [text, setText] = useState('');

  return (
    &lt;div&gt;
      &lt;input value={text} onChange={(e) => setText(e.target.value)} /&gt;
      &lt;button
        onClick={() => {
          dispatch(addTodo(text));
          setText('');
        }}
      &gt;
        Add
      &lt;/button&gt;
      &lt;ul&gt;
        {todos.map((todo) => (
          &lt;li
            key={todo.id}
            onClick={() => dispatch(toggleTodo(todo.id))}
            style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
          &gt;
            {todo.text}
          &lt;/li&gt;
        ))}
      &lt;/ul&gt;
    &lt;/div&gt;
  );
}</code></pre>
<p>Note the pattern in <code>todosReducer</code>: to update <em>one</em> todo inside an array, you build a whole new array (<code>.map</code>) containing a whole new object for the changed item, and pass every other item through unchanged. Nothing is mutated in place.</p>

<h3>RTK removes this boilerplate</h3>
<p>Both examples above required: hand-written action creators, a <code>switch</code> statement, and careful manual spreading to avoid mutation. <strong>Redux Toolkit (RTK)</strong> — the next topic in this module — generates the action creators for you and lets you write reducers with mutating-looking syntax (it makes that safe under the hood via Immer). The mental model you just learned (store, action, reducer, dispatch) doesn't change; RTK just removes the ceremony around it.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3>Mutating state inside a reducer</h3>
<pre><code class="language-js">// ❌ BUG — mutates the existing state object instead of returning a new one
function badReducer(state = { count: 0 }, action) {
  if (action.type === 'counter/incremented') {
    state.count = state.count + 1; // mutation!
    return state; // same reference as before
  }
  return state;
}</code></pre>
<p>This <em>looks</em> like it works — <code>state.count</code> really does go up. The bug is subtler: because <code>state</code> is the same object reference before and after, anything that checks "did state change?" by comparing <code>oldState === newState</code> (which is exactly how React-Redux's <code>useSelector</code> decides whether to re-render, and how Redux DevTools decides whether to record a new entry) will conclude <em>nothing changed</em>. Components silently stop re-rendering, or debugging tools show a flat, useless history. Always build and return a new object.</p>

<h3>Non-serializable values in state or actions</h3>
<p>Keep the store (and actions) to plain, JSON-serializable data: strings, numbers, booleans, plain objects/arrays. Storing a <code>Date</code> object, a <code>Map</code>, a class instance, a Promise, or a function in state or in an action's payload breaks two things Redux depends on: (1) tools like Redux DevTools serialize state/actions to show you history and let you replay it, and (2) persistence libraries that save/restore your store need to serialize it. Store a Date as an ISO string, not a Date object.</p>

<h3>Putting derived data in the store</h3>
<pre><code class="language-js">// ❌ storing a value that's computed FROM other state
{ items: [{ price: 10, qty: 2 }, { price: 5, qty: 1 }], totalPrice: 25 }
</code></pre>
<p><code>totalPrice</code> is just <code>items.reduce(...)</code> — it can always be recomputed from <code>items</code>. Storing it separately means every reducer that touches <code>items</code> must also remember to keep <code>totalPrice</code> in sync, and it's easy to forget one spot and end up with stale, incorrect totals. Compute derived values when you read state (a "selector"), not when you write it.</p>

<h3>Over-using Redux for local UI state</h3>
<p>Whether a dropdown is open, what's currently typed into a search box, whether a modal is visible — this is state that only one component (and maybe its direct children) cares about. Routing it through the global store means every keystroke or toggle dispatches an action, runs a reducer, and notifies subscribers app-wide, for state nobody else needed. Keep it in <code>useState</code>. A good rule of thumb: if you can't name another, unrelated component that needs to read this value, it probably doesn't belong in Redux.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What problem does Redux solve?</div>
<div class="qa-a">
<p>Sharing state across components that aren't close relatives in the tree, without prop-drilling it through every layer in between, and doing so in a way where every change is traceable to a specific action — instead of state being mutated from many different places in unpredictable order.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why must reducers be pure?</div>
<div class="qa-a">
<p>Purity — same <code>(state, action)</code> input always produces the same output, no side effects — is what makes state changes deterministic and replayable. It's what powers Redux DevTools' time-travel debugging (replay any sequence of actions and get the same result), and it's what lets React-Redux safely skip re-renders by comparing state references. Async calls, <code>Date.now()</code>, and <code>Math.random()</code> inside a reducer would all break that determinism.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between an action, a reducer, and the store?</div>
<div class="qa-a">
<p>An <strong>action</strong> is a plain object describing what happened — just data, e.g. <code>{ type: 'cart/itemAdded', payload: {...} }</code>. A <strong>reducer</strong> is the pure function that decides how state should change in response to an action: <code>(state, action) =&gt; newState</code>. The <strong>store</strong> is the object that holds the current state, runs the reducer whenever <code>dispatch</code> is called, and notifies subscribers. Actions describe intent, reducers compute the result, the store holds and broadcasts it.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Redux vs. Context — when would you use each?</div>
<div class="qa-a">
<p>Context is built into React and is a good fit for state a moderate, fairly stable set of components needs to read — theme, current user, locale. It has no built-in concept of actions/reducers/middleware, and every consumer re-renders when the Context value changes (there's no fine-grained subscription). Redux fits when state is large, is written to frequently by many different features, and you want strict traceability, middleware (logging, async handling), or tooling like time-travel debugging. Many apps use both: Context for a few stable values, Redux for the actively-changing shared state.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Is Redux still relevant in 2026?</div>
<div class="qa-a">
<p>Yes — but "Redux" today effectively means <strong>Redux Toolkit (RTK)</strong>, not the hand-written action-types-and-switch-statements style from this topic. It's still the right choice for apps with large, complex, cross-feature client state that needs strong predictability guarantees. What's changed is that a lot of state that used to get shoved into Redux — data fetched from a server — now more naturally belongs in a server-state library (React Query, RTK Query), and simpler shared state often lives happily in Context or a lighter library. Redux (via RTK) is a deliberate choice for complex shared <em>client</em> state, not a default.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why does a reducer take the "old" state and return a whole new one instead of modifying it?</div>
<div class="qa-a">
<p>Returning a new object (rather than mutating) means the old and new state are two distinct references. That reference difference is exactly what React-Redux's <code>useSelector</code> uses to decide "should this component re-render," and what Redux DevTools uses to record a distinct entry in its history for time-travel debugging. Mutating in place collapses old and new state into the same reference, silently breaking both.</p>
</div>
</div>
`}

]});
