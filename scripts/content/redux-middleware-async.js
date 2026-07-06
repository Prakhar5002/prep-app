window.PREP_SITE.registerTopic({
  id: 'redux-middleware-async',
  module: 'redux',
  title: 'Middleware & Async',
  estimatedReadTime: '24 min',
  tags: ['redux', 'middleware', 'async', 'thunk', 'listener-middleware', 'saga'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Middleware</strong> is the layer Redux runs every action through <em>between</em> <code>dispatch(action)</code> and the reducer. Reducers must stay pure (no async, no side effects) — middleware is where fetching data, logging, retries, and other side effects actually live.</p>
<ul>
  <li><strong>The signature:</strong> every middleware is a function shaped <code>store => next => action</code>. It gets the store, gets a handle to the rest of the chain (<code>next</code>), and receives each action — with the choice to forward it, transform it, delay it, or swallow it entirely.</li>
  <li><strong>Thunks are the default.</strong> Redux Toolkit's <code>configureStore</code> wires in thunk middleware automatically, giving you <code>dispatch(someFunction)</code> — a plain, imperative way to run async logic (fetch, then dispatch more actions) whenever <em>you</em> call it.</li>
  <li><strong><code>createListenerMiddleware</code> is the modern, RTK-recommended tool</strong> for <em>reactive</em> side effects — "when this action happens, run this effect" — via <code>startListening({ actionCreator | matcher | predicate, effect })</code>. Its effect API (<code>condition</code>, <code>fork</code>, <code>cancelActiveListeners</code>, <code>unsubscribe</code>, <code>take</code>, <code>delay</code>) covers most of what teams used to reach for redux-saga for.</li>
  <li><strong>Sagas (redux-saga) and Observables (redux-observable) are niche in 2026</strong> — still genuinely useful for gnarly concurrent orchestration (races, cancellation trees, retry/backoff graphs) or teams already fluent in generators/RxJS, but not a default choice for typical apps anymore.</li>
  <li><strong>Enhancers are a different, bigger lever</strong> than middleware: an enhancer wraps the whole store-creation process and can override any store method, not just intercept dispatched actions. <code>applyMiddleware(...)</code> is itself an enhancer — it's how middleware gets wired in underneath.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The gap reducers leave behind</h3>
<p>The <a href="#/topic/redux-core">Core Concepts</a> topic was firm about one rule: reducers must be pure — <code>(state, action) => newState</code>, no <code>fetch</code>, no <code>Date.now()</code>, no side effects of any kind. That rule is what makes state changes deterministic and replayable. But real apps unavoidably need exactly the things reducers are forbidden from doing: fetch a user profile, log every action for debugging, retry a failed request, debounce a search box, redirect after a login succeeds.</p>
<p>None of that can happen in the reducer. So where does it happen?</p>

<h3>Middleware: the interception layer</h3>
<p>Redux's answer is <strong>middleware</strong> — code that sits between the moment you call <code>dispatch(action)</code> and the moment the action actually reaches the reducer. Every dispatched action passes through the full middleware chain first. Each middleware gets to look at the action, and decide: pass it along unchanged, transform it, delay it, dispatch other actions because of it, or stop it from reaching the reducer at all.</p>
<p>That's a powerful hook. It's exactly where side effects belong, because middleware — unlike a reducer — is explicitly allowed to be impure: it can call <code>fetch</code>, read the clock, log to the console, or wait on a timer.</p>

<h3>The 2026 landscape, at a glance</h3>
<ul>
  <li><strong>Thunks</strong> — the default, already wired in by RTK. Best for <em>imperative</em> async: "when the user clicks submit, run this sequence of dispatches." You call it; it's not watching for anything on its own.</li>
  <li><strong><code>createListenerMiddleware</code></strong> — RTK's built-in tool for <em>reactive</em> async: "whenever action X happens anywhere in the app, run this effect." No extra dependency, since it ships inside <code>@reduxjs/toolkit</code>.</li>
  <li><strong>redux-saga / redux-observable</strong> — generator- or RxJS-based tools for complex, long-running orchestration. Still show up in large or older codebases, and still worth reaching for when the concurrency graph gets genuinely hairy. Most new apps in 2026 cover their needs with the first two and never install either.</li>
</ul>
<div class="callout insight">
  <div class="callout-title">🧠 One-liner</div>
  <p>Reducers compute; middleware <em>acts</em>. If a piece of logic needs to wait, fetch, retry, or log — it belongs in middleware, not the reducer.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The chain: <code>store => next => action</code></h3>
<p>Every middleware has the same three-layer, curried shape:</p>
<pre><code class="language-js">const exampleMiddleware = (storeAPI) => (next) => (action) => {
  // storeAPI: { getState, dispatch } — the same two methods a thunk gets
  // next: call this to hand the action to the NEXT middleware (or the reducer, if last)
  // action: the thing that was dispatched
  return next(action); // forward it, unchanged, and return whatever next() returns
};</code></pre>
<ul>
  <li><strong><code>storeAPI</code></strong> gives you <code>getState()</code> and <code>dispatch()</code> — you can read current state or fire off more actions from inside a middleware.</li>
  <li><strong><code>next</code></strong> is your handle on the rest of the pipeline. Calling <code>next(action)</code> passes the action one step further down the chain — to the next middleware, or to the reducer if this is the last one. <strong>Not calling it</strong> stops the action right there — it never reaches the reducer, and nothing after it in the chain runs either.</li>
  <li><strong>Middleware is applied in order</strong>, and every dispatched action — no matter where it came from — flows through the <em>entire</em> chain, in the order the middleware was registered.</li>
</ul>

<h3>The chain, end to end</h3>
<pre><code class="language-text">dispatch(action)
      │
      ▼
┌─────────────┐   next(action)   ┌─────────────┐   next(action)   ┌─────────┐
│ Middleware 1│ ───────────────► │ Middleware 2│ ───────────────► │ Reducer │
│  (logger)   │                  │   (thunk)   │                  └────┬────┘
└─────────────┘                  └─────────────┘                       │
                                                                        ▼
                                                              store saves new state,
                                                              notifies subscribers</code></pre>
<p>Thunk middleware is a perfect illustration of "intercept, don't always forward": it checks <code>typeof action === 'function'</code>. If it's a plain object, it calls <code>next(action)</code> like any well-behaved middleware. If it's a <em>function</em> (a thunk), it calls that function directly with <code>(dispatch, getState)</code> instead — and never calls <code>next</code> at all, because a raw function isn't something the reducer (or a serialization-based devtool) knows how to handle.</p>

<h3>Enhancers vs. middleware — a different axis</h3>
<p>These two terms get confused because both are configured near <code>createStore</code>/<code>configureStore</code>, but they operate at different levels:</p>
<ul>
  <li><strong>Middleware</strong> only ever intercepts <code>dispatch</code>. It can't change what <code>getState</code> or <code>subscribe</code> do.</li>
  <li><strong>A store enhancer</strong> is a higher-order function that wraps the <em>entire</em> store-creation process and can override <em>any</em> store method — <code>dispatch</code>, <code>getState</code>, <code>subscribe</code>, even replace the reducer. <code>applyMiddleware(...)</code> is itself a store enhancer — it's the standard mechanism by which middleware gets wired into a plain Redux store. Redux DevTools' browser extension and offline-persistence libraries are also implemented as enhancers, since they need to hook into more than just dispatched actions.</li>
</ul>
<p>In practice you almost never write a custom enhancer — <code>configureStore</code> (RTK) sets up the standard one (middleware + devtools) for you. Custom <em>middleware</em>, on the other hand, is something you'll write regularly (a logger, an analytics tap, a listener effect).</p>
<div class="callout insight">
  <div class="callout-title">🔥 Key insight</div>
  <p>Middleware reshapes what happens to a <em>dispatched action</em>. An enhancer reshapes the <em>store itself</em>. Middleware is the tool for "run this side effect when X is dispatched"; enhancers are the tool for "change how the store fundamentally behaves."</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Thunk middleware — already wired in by RTK</h3>
<p>To see the mechanism, here's essentially the whole of thunk middleware — a handful of lines:</p>
<pre><code class="language-js">const thunkMiddleware = (storeAPI) => (next) => (action) => {
  if (typeof action === 'function') {
    // it's a thunk: call it directly, give it dispatch + getState, and STOP —
    // it never reaches next() or the reducer as-is
    return action(storeAPI.dispatch, storeAPI.getState);
  }
  return next(action); // a normal plain-object action: let it fall through as usual
};</code></pre>
<p><code>configureStore</code> includes this automatically, so in RTK you get <code>dispatch(fn)</code> for free:</p>
<pre><code class="language-js">import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({ reducer: rootReducer }); // thunk middleware included by default

function fetchUser(userId) {
  // an action CREATOR that returns a function (a "thunk") instead of a plain object
  return async function thunk(dispatch, getState) {
    dispatch({ type: 'users/fetchStarted' });
    try {
      const res = await fetch(\`/api/users/\${userId}\`);
      const user = await res.json();
      dispatch({ type: 'users/fetchSucceeded', payload: user });
    } catch (err) {
      dispatch({ type: 'users/fetchFailed', payload: err.message });
    }
  };
}

store.dispatch(fetchUser('u1')); // dispatch() accepts a FUNCTION because thunk middleware intercepts it
</code></pre>
<p>Thunks are <strong>imperative</strong>: you call <code>dispatch(fetchUser('u1'))</code> at the moment you want the async sequence to run — a button click, a route change. Nothing "listens" on its own.</p>

<h3><code>createListenerMiddleware</code> — the modern reactive side-effect tool</h3>
<p>Sometimes you don't want to hand-wire "and also call fetchUser here" into every place a login can succeed — you want a rule that says "whenever <code>loginSucceeded</code> is dispatched, anywhere, run this effect." That's what <code>createListenerMiddleware</code> (built into <code>@reduxjs/toolkit</code>, no extra package) is for.</p>
<pre><code class="language-js">import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

const listenerMiddleware = createListenerMiddleware();

const store = configureStore({
  reducer: rootReducer,
  // .prepend() puts the listener middleware BEFORE RTK's serializability check —
  // addListener/removeListener dispatch actions whose payload carries functions
  // (the effect/predicate being registered), which would otherwise trip that check
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

listenerMiddleware.startListening({
  actionCreator: loginSucceeded, // matches by exact action creator (also: matcher, predicate, or type string)
  effect: async (action, listenerApi) => {
    // effect runs whenever a loginSucceeded action is dispatched, anywhere in the app
    const { userId } = action.payload;
    await listenerApi.dispatch(fetchUserProfile(userId)); // dispatch a thunk from inside a listener
  },
});</code></pre>
<p>The <code>effect(action, listenerApi)</code> callback is conceptually similar to a React <code>useEffect</code>, except it runs off Redux dispatches instead of component renders. <code>listenerApi</code> gives you far more than a thunk's <code>(dispatch, getState)</code>:</p>
<ul>
  <li><strong><code>dispatch</code> / <code>getState</code> / <code>getOriginalState()</code></strong> — same as a thunk, plus the state <em>before</em> the triggering action's reducer ran.</li>
  <li><strong><code>condition(predicate, timeout?)</code></strong> — returns a promise that resolves once some later state/action matches a predicate; lets you write "wait until X happens" without polling.</li>
  <li><strong><code>take(predicate, timeout?)</code></strong> — pause and resolve with the next matching <code>[action, state, originalState]</code>.</li>
  <li><strong><code>fork(executor)</code></strong> — spawn a cancellable child task, returning <code>{ result, cancel() }</code>, for running work concurrently with the rest of the effect.</li>
  <li><strong><code>cancelActiveListeners()</code></strong> — cancel any other still-running instance of <em>this same</em> listener (the building block for debouncing/"take latest").</li>
  <li><strong><code>unsubscribe()</code> / <code>subscribe()</code></strong> — turn this listener entry off/on; <code>startListening</code> itself also returns an unsubscribe function you can call from outside.</li>
  <li><strong><code>delay(ms)</code></strong> — a cancellation-aware timeout (if the listener gets cancelled mid-delay, the delay aborts cleanly instead of firing late).</li>
</ul>

<h3>The niche landscape: sagas and observables</h3>
<p><strong>redux-saga</strong> models side effects as <em>generator functions</em> (<code>function*</code>) that <code>yield</code> plain-object "effect descriptions" (<code>call</code>, <code>put</code>, <code>take</code>, <code>race</code>, <code>all</code>) which a saga middleware interprets and executes. Because a saga's own code never directly calls <code>fetch</code> or <code>dispatch</code> — it just yields descriptions of them — sagas are unusually easy to unit test without mocking network calls. They also make gnarly concurrency (racing two async flows, building a cancellable tree of child tasks, retrying with backoff) more explicit than callback- or promise-based code tends to be.</p>
<p><strong>redux-observable</strong> takes the same "declarative side-effect pipeline" idea and builds it on RxJS: an "epic" is a function that takes a stream of actions in and returns a stream of actions out, composed with RxJS operators like <code>switchMap</code>, <code>debounceTime</code>, <code>retry</code>. It's a strong fit if your team is already fluent in RxJS operator composition, especially around real-time/streaming data.</p>
<p>Both are still legitimate choices — but mostly for: codebases already built on them (rewriting working saga/epic logic rarely pays for itself), or genuinely complex concurrent orchestration where thunks/listeners would turn into a tangle of manual cancellation flags. For the large majority of apps — CRUD screens, dashboards, typical "fetch on login, debounce a search, react to a websocket event" needs — <code>createListenerMiddleware</code> plus thunks now cover the same ground without adding a dependency or a new mental model (generators, or RxJS operators) for the team to learn.</p>

<h3>Writing your own middleware: a logger</h3>
<p>Middleware isn't just something you configure — it's a function you can write yourself in a few lines:</p>
<pre><code class="language-js">const logger = (storeAPI) => (next) => (action) => {
  console.group(action.type ?? '(non-standard action)');
  console.log('prev state:', storeAPI.getState());
  console.log('action:', action);
  const result = next(action); // forward it — and capture what the rest of the chain returns
  console.log('next state:', storeAPI.getState());
  console.groupEnd();
  return result; // MUST return this — callers of dispatch(...) may depend on the return value
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});</code></pre>
<p>Two details matter here: always call <code>next(action)</code> (otherwise the action never reaches the reducer), and always <code>return</code> what <code>next(action)</code> gives back (a thunk's <code>dispatch(someThunk())</code> call returns whatever that thunk's function returns — often a promise — and a middleware that swallows the return value silently breaks any code awaiting it).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — A thunk that fetches a user profile</h3>
<pre><code class="language-js">// action creator returning a thunk
function fetchUserProfile(userId) {
  return async function (dispatch, getState) {
    dispatch({ type: 'profile/fetchStarted' });
    try {
      const res = await fetch(\`/api/users/\${userId}/profile\`);
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      const profile = await res.json();
      dispatch({ type: 'profile/fetchSucceeded', payload: profile });
    } catch (err) {
      dispatch({ type: 'profile/fetchFailed', payload: err.message });
    }
  };
}</code></pre>
<pre><code class="language-jsx">function ProfilePage({ userId }) {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.profile.data);

  useEffect(() => {
    dispatch(fetchUserProfile(userId)); // imperative: fires once, when this component mounts
  }, [userId, dispatch]);

  return profile ? &lt;h1&gt;{profile.name}&lt;/h1&gt; : &lt;p&gt;Loading…&lt;/p&gt;;
}</code></pre>

<h3>Example 2 — <code>createListenerMiddleware</code>: react to login, fetch a profile</h3>
<pre><code class="language-js">listenerMiddleware.startListening({
  actionCreator: loginSucceeded,
  effect: async (action, listenerApi) => {
    // drop any profile fetch still in flight from a PREVIOUS login (e.g. quick account switch)
    listenerApi.cancelActiveListeners();

    const { userId } = action.payload;
    await listenerApi.dispatch(fetchUserProfile(userId));
  },
});

// nothing in the login form's component needs to know this happens —
// it just dispatches loginSucceeded and the listener takes it from there
dispatch(loginSucceeded({ userId: 'u1' }));</code></pre>
<p>Compare this to Example 1: the thunk runs because a component <em>called</em> it. This listener runs because a matching action was dispatched, from anywhere — the login form, a websocket reconnect handler, a test — without either of them needing to know the listener exists.</p>

<h3>Example 3 — <code>createListenerMiddleware</code>: debounced search</h3>
<pre><code class="language-js">listenerMiddleware.startListening({
  actionCreator: searchQueryChanged,
  effect: async (action, listenerApi) => {
    // cancel any earlier instance of THIS listener still waiting out its delay —
    // this is what makes it "debounced" instead of firing once per keystroke
    listenerApi.cancelActiveListeners();

    await listenerApi.delay(300); // cancellation-aware: an earlier call above aborts this cleanly

    const query = action.payload;
    if (!query.trim()) return;

    const results = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`).then((r) => r.json());
    listenerApi.dispatch(searchResultsReceived(results));
  },
});</code></pre>
<p>Every keystroke dispatches <code>searchQueryChanged</code>, which starts a new effect instance. Each new instance immediately cancels the previous one via <code>cancelActiveListeners()</code>, so only the <em>last</em> keystroke's effect survives its 300ms delay and actually hits the network — the same "take latest" behavior teams used to reach for a saga's <code>takeLatest</code> to get.</p>

<h3>Example 4 — a logging middleware, wired into the store</h3>
<pre><code class="language-js">const logger = (storeAPI) => (next) => (action) => {
  console.group(action.type ?? '(non-standard action)');
  console.log('prev state:', storeAPI.getState());
  console.log('action:', action);
  const result = next(action);
  console.log('next state:', storeAPI.getState());
  console.groupEnd();
  return result;
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

store.dispatch({ type: 'counter/incremented' });
// console output:
//   ▼ counter/incremented
//     prev state: { count: 0 }
//     action: { type: 'counter/incremented' }
//     next state: { count: 1 }</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3>Sneaking async into a reducer</h3>
<pre><code class="language-js">// ❌ BUG — async work and mutation smuggled into what looks like a reducer
function badReducer(state = { user: null }, action) {
  if (action.type === 'user/requested') {
    fetch(\`/api/users/\${action.payload}\`) // side effect inside a reducer!
      .then((r) => r.json())
      .then((user) => { state.user = user; }); // mutates, and does so asynchronously
    return state; // returns the OLD state immediately — the fetch hasn't resolved yet
  }
  return state;
}</code></pre>
<p>This breaks in two ways at once: the reducer returns before the fetch resolves (so nothing looks like it updated), and when the promise <em>does</em> resolve, it mutates <code>state</code> outside of any dispatch — invisible to Redux DevTools, invisible to <code>useSelector</code>, and not run through the reducer at all. All async work belongs in middleware (a thunk or a listener effect), never in the reducer itself.</p>

<h3>Listener leaks and runaway effects</h3>
<p>A <code>createListenerMiddleware</code> effect that dispatches the same action type it's listening for — without a guard — will re-trigger itself indefinitely. And a listener that's registered once (e.g. inside a component that can mount more than once) but never <code>unsubscribe()</code>d will keep running its effect on every matching action for the lifetime of the store, even after the component that registered it is gone. Store the unsubscribe function <code>startListening(...)</code> returns, and call it when the listener is no longer needed (e.g. on unmount, or in a "logout" cleanup).</p>

<h3>Middleware order matters</h3>
<p>Middleware runs in the order it's registered, and order changes behavior — not just log formatting. Two concrete examples: putting a logger <em>before</em> thunk middleware logs the thunk <em>function</em> itself (unhelpful); putting it <em>after</em> logs the plain actions the thunk eventually dispatches (what you actually want). Similarly, RTK's docs call out that <code>listenerMiddleware.middleware</code> should be <code>.prepend()</code>-ed — placed before the serializability-check middleware — because the <code>addListener</code>/<code>removeListener</code> action creators dispatch actions whose payload carries functions (the <code>effect</code>/<code>predicate</code> being dynamically registered), and running the serializability check on those first would produce noisy false-positive warnings.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"<code>createListenerMiddleware</code> replaces thunks." It doesn't — they solve different problems and most codebases use both. Thunks are for <em>imperative</em> async you trigger yourself ("fetch this now, because the user just clicked submit"). Listener middleware is for <em>reactive</em> async triggered by something else happening in the store ("whenever this action fires, anywhere, do this"). A listener's effect commonly dispatches a thunk internally, as Example 2 shows — they compose.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What is Redux middleware, and what does the <code>store => next => action</code> signature mean?</div>
<div class="qa-a">
<p>Middleware is a function that sits between <code>dispatch(action)</code> and the reducer, able to inspect, transform, delay, or block every dispatched action. The signature is a triple-curried function: the outer layer receives the store's <code>{ getState, dispatch }</code>; the middle layer receives <code>next</code>, a handle on the rest of the chain (the next middleware, or the reducer if this is the last one); the inner layer receives the actual <code>action</code> and decides what to do with it. Calling <code>next(action)</code> forwards it; not calling it stops the action from going any further.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Thunks vs. sagas vs. listener middleware — how do you decide?</div>
<div class="qa-a">
<p>Thunks (default in RTK) are the right tool for <em>imperative</em> async — a component calls <code>dispatch(someThunk())</code> at the moment it wants that sequence to run. <code>createListenerMiddleware</code> is the right tool for <em>reactive</em> async — "whenever action X happens anywhere, run this effect" — and covers debouncing, cancellation, and "wait for a condition" without an extra dependency. Sagas (or redux-observable) earn their cost only for genuinely complex, long-running concurrent orchestration — races between multiple flows, deep cancellation trees, retry/backoff graphs — or in a codebase that already has them and where rewriting isn't worth it. Default to thunks + listener middleware; reach for sagas/observables when the concurrency itself, not just the async, is the hard part.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is <code>createListenerMiddleware</code> and how does it compare to redux-saga?</div>
<div class="qa-a">
<p>It's RTK's built-in middleware for declarative, reactive side effects: you call <code>startListening({ actionCreator | matcher | predicate, effect })</code>, and the <code>effect(action, listenerApi)</code> callback runs whenever a matching action is dispatched. <code>listenerApi</code> gives you <code>dispatch</code>/<code>getState</code> plus async-workflow helpers — <code>condition</code>, <code>take</code>, <code>fork</code>, <code>cancelActiveListeners</code>, <code>delay</code>, <code>unsubscribe</code> — that cover most of what redux-saga's effects (<code>call</code>, <code>put</code>, <code>take</code>, <code>race</code>) are used for, but written as plain async/await instead of generator functions with yielded effect descriptions. The trade-off: sagas' yielded effects are easier to unit-test without mocking (you assert on the yielded description, not the real call), and their generator-based model makes very complex concurrency graphs more explicit. For most apps, listener middleware's lower ceremony (no generators, no separate saga runtime, ships in <code>@reduxjs/toolkit</code>) wins.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between middleware and a store enhancer?</div>
<div class="qa-a">
<p>Middleware only ever intercepts what happens to a dispatched action, on its way to the reducer — it can't change how <code>getState</code> or <code>subscribe</code> behave. A store enhancer wraps the entire store-creation process and can override <em>any</em> store method, including replacing <code>dispatch</code>, <code>getState</code>, or <code>subscribe</code> wholesale. <code>applyMiddleware(...)</code> is itself implemented as a store enhancer — it's the standard way middleware gets attached underneath a store. In day-to-day work you write custom middleware often (loggers, listener effects); you almost never write a custom enhancer, since <code>configureStore</code> already sets one up for you.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why must a middleware call <code>next(action)</code> (and return its result)?</div>
<div class="qa-a">
<p>Calling <code>next(action)</code> is what hands the action to the rest of the chain — skip it, and the action silently never reaches the reducer (or any middleware registered after this one). Returning what <code>next(action)</code> gives back matters too: <code>dispatch(...)</code>'s return value is whatever the last thing in the chain returned, and code that calls <code>dispatch(someThunk())</code> and <code>await</code>s the result depends on that value propagating all the way back up through every middleware in between.</p>
</div>
</div>
`}

]});
