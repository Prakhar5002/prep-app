window.PREP_SITE.registerTopic({
  id: 'react-concurrent',
  module: 'React Deep',
  title: 'Concurrent React (18+)',
  estimatedReadTime: '28 min',
  tags: ['react', 'concurrent', 'suspense', 'transitions', 'lanes', 'startTransition', 'useDeferredValue', 'streaming-ssr'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Concurrent React</strong> (shipped in React 18) is a rendering model where React can prepare multiple versions of the UI at the same time, interrupt a low-priority render to process a high-priority update, and discard abandoned work without committing it. Updates are tagged with <strong>lanes</strong> (priority tiers); the scheduler always picks the highest-priority non-empty lane.</p>
<ul>
  <li><strong>Opt-in APIs:</strong> <code>startTransition</code>, <code>useTransition</code>, <code>useDeferredValue</code>, <code>&lt;Suspense&gt;</code>. Other APIs are unchanged.</li>
  <li><strong>Automatic batching</strong> now applies everywhere (promises, timeouts, native events), not just React-synthetic handlers.</li>
  <li><strong>Suspense</strong> lets you declaratively describe loading states in the tree; components can "suspend" (throw a promise) and React shows the nearest fallback until the promise resolves.</li>
  <li><strong>Streaming SSR</strong> with <code>renderToPipeableStream</code> / <code>renderToReadableStream</code> sends HTML chunks as they become ready — fast TTFB, selective hydration.</li>
  <li>Concurrent rendering is safe-by-default for well-behaved components (pure render, effects do cleanup). Side effects during render become visible bugs (hence <code>StrictMode</code>'s double-invocation).</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Old React: one priority, render-to-completion, commit. New React: N priorities (lanes), interruptible render, speculative trees. Your code mostly stays the same — but the model rewards pure renders and declarative loading states.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What concurrent rendering is</h3>
<p>Before React 18, a render was a single, uninterruptible traversal of the fiber tree on the main thread. If your tree took 100ms to render, the main thread was blocked for 100ms — during which the browser couldn't process input, couldn't paint, couldn't run animations. Users saw jank.</p>

<p>Concurrent React splits work into <strong>lanes</strong>. When a state update arrives, React tags it with a lane (urgent / default / transition / idle). The scheduler picks the highest-priority non-empty lane to work on. A render walks the fiber tree in small chunks; between chunks, React asks the browser "do you need the main thread?" If yes, React yields and resumes later. A high-priority update arriving mid-render can abandon the in-flight work and start fresh.</p>

<h3>What problem it solves</h3>
<ul>
  <li><strong>Input lag.</strong> Typing in a search box that filters a huge list — typing should feel instant; the list can update later.</li>
  <li><strong>Slow navigations.</strong> Clicking "next page" shouldn't freeze the UI for a second while the next page builds.</li>
  <li><strong>Waterfall loading.</strong> A child component needs data from an API; you want to show a skeleton without writing boilerplate loading state in every component.</li>
  <li><strong>TTFB under SSR.</strong> You want to stream HTML as parts of the page become ready, not wait for the slowest query.</li>
</ul>

<h3>Why lanes and not a single priority number</h3>
<p>A single priority number can't express "these two updates should be rendered together." Lanes are a bitmask — multiple lanes can be "entangled" and processed in the same render. This models real-world scheduling: an urgent click might need to update both state A (high priority) and state B (lower priority), and you want them consistent on screen.</p>

<h3>Why Suspense?</h3>
<p>Before Suspense, loading states required per-component boilerplate:</p>
<pre><code class="language-js">function UserProfile({ id }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() =&gt; { /* ... */ }, [id]);
  if (loading) return &lt;Spinner/&gt;;
  if (error) return &lt;Err/&gt;;
  return &lt;...&gt;;
}</code></pre>
<p>With Suspense, a data-fetching library (React Query, Relay, RSC) can make the read "suspend" — throw a promise — and the nearest <code>&lt;Suspense fallback={...}&gt;</code> ancestor renders its fallback. When the promise resolves, React retries the render.</p>
<pre><code class="language-js">&lt;Suspense fallback={&lt;Spinner/&gt;}&gt;
  &lt;UserProfile id={id} /&gt;
&lt;/Suspense&gt;</code></pre>
<p>Result: loading logic lives at the boundary, not scattered inside every leaf. Multiple components can suspend simultaneously and share one fallback. Streaming SSR extends this: the server emits the fallback first, then the real content when data is ready.</p>

<h3>Why your code needs to be pure in render</h3>
<p>Concurrent React can call your component multiple times before committing (or not commit at all). A render with side effects — <code>window.foo = x</code>, mutating an external store, pushing to an array — becomes observable and wrong. React docs have always said render should be pure; concurrent mode makes that rule actually enforced.</p>

<h3>Opt-in vs opt-out</h3>
<p>React 18 ships concurrent <em>capabilities</em>, not concurrent <em>mode</em>. You opt in per update via <code>startTransition</code>. Other updates behave exactly like before (synchronous, uninterruptible). You can migrate incrementally. Creating the root with <code>createRoot</code> (vs legacy <code>ReactDOM.render</code>) unlocks all the opt-in features.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "lanes as tiers" picture</h3>
<div class="diagram">
<pre>
Lane priority (highest → lowest):

  SyncLane            → legacy sync updates (setState in raw event)
  InputContinuousLane → ongoing input (scroll, drag)
  DefaultLane         → normal setState in handlers
  TransitionLane      → startTransition, low-pri
  IdleLane            → never-urgent background work

Scheduler always picks highest-priority NON-EMPTY lane.
Updates can be "entangled" → processed in same render for consistency.
</pre>
</div>

<h3>The "render as interruptible work" picture</h3>
<div class="diagram">
<pre>
  [UserClicks urgent setState]
          │
          ▼
  scheduler sees Sync lane pending
          │
  abandon in-progress transition render, if any
          │
          ▼
  render sync update to completion, commit
          │
          ▼
  resume/restart transition render from scratch
</pre>
</div>

<h3>The "Suspense = declarative loading" picture</h3>
<pre><code class="language-js">&lt;Suspense fallback={&lt;PageSkeleton/&gt;}&gt;
  &lt;Header/&gt;           // renders immediately
  &lt;Suspense fallback={&lt;CardSkeleton/&gt;}&gt;
    &lt;UserCard/&gt;       // if this suspends, CardSkeleton shows (not PageSkeleton)
  &lt;/Suspense&gt;
  &lt;Sidebar/&gt;          // independent, renders regardless
&lt;/Suspense&gt;</code></pre>
<p>Nested boundaries scope fallbacks. The closest boundary wins. Once resolved, the component mounts without unmounting anything around it.</p>

<h3>The "startTransition = I don't need this instantly" picture</h3>
<pre><code class="language-js">function handleType(e) {
  setInput(e.target.value);           // urgent — keep typing responsive
  startTransition(() =&gt; {
    setFilteredList(filter(items, e.target.value)); // deferrable
  });
}</code></pre>
<p>Input updates render immediately. The big filter render is marked transition — can be interrupted if the user types again before it finishes.</p>

<h3>The "streaming SSR = ship chunks as ready" picture</h3>
<div class="diagram">
<pre>
  server
   │
   ├─ renders shell immediately → flush HTML
   │   └─ &lt;Suspense fallback&gt; placeholder
   │
   ├─ data for region A arrives → flush inline &lt;script&gt; to swap fallback
   ├─ data for region B arrives → flush inline &lt;script&gt; to swap fallback
   │
   └─ done.

client hydrates progressively:
  selective hydration — user can interact with shells before all JS loads.
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Concurrent React runs on multiple threads." No. JS is still single-threaded. Concurrent means React can <em>interleave</em> work — pause render, handle input, resume. Everything runs on the main thread; the difference is yielding granularity.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Lanes and the scheduler</h3>
<p>A <strong>lane</strong> is a bit in a 31-bit mask. Each setState call gets a lane based on the current scheduler priority (inferred from the current event type). Major lanes:</p>
<ul>
  <li><code>SyncLane</code> (bit 0) — highest. Legacy sync updates.</li>
  <li><code>InputContinuousLane</code> — scroll/drag events.</li>
  <li><code>DefaultLane</code> — normal updates in React handlers.</li>
  <li>Transition lanes (multiple, round-robin) — <code>startTransition</code>.</li>
  <li>Retry lanes — Suspense boundary retries after data arrives.</li>
  <li><code>IdleLane</code> — lowest. Never runs if anything higher is pending.</li>
</ul>
<p>The scheduler (V8's <code>MessageChannel</code> / <code>requestIdleCallback</code> / <code>requestAnimationFrame</code>) yields to the browser between fiber units. If an urgent update arrives, the current render is discarded and a new render begins at the higher priority.</p>

<h3>Automatic batching</h3>
<p>React 18 batches state updates in <em>all</em> contexts (promises, <code>setTimeout</code>, native event listeners) — not just React synthetic events as before. Result: multiple <code>setState</code> calls in async callbacks cause one render.</p>
<pre><code class="language-js">setTimeout(() =&gt; {
  setA(1);
  setB(2);
  // React 18: 1 render with both values
  // React 17:  2 renders (one per setState)
}, 0);</code></pre>
<p>Opt out with <code>flushSync(() =&gt; setX(v))</code> when you need a synchronous render mid-sequence (e.g., measure between updates).</p>

<h3>startTransition / useTransition</h3>
<pre><code class="language-js">startTransition(() =&gt; {
  setState(newValue);
  // any state updates inside this callback are tagged as transitions
});
const [isPending, startTransition] = useTransition();</code></pre>
<p><code>isPending</code> is <code>true</code> while the transition render is in flight — use to show non-blocking indicators. Transitions are interruptible: if a new urgent update arrives, React abandons the transition render.</p>

<h3>useDeferredValue</h3>
<pre><code class="language-js">const q = userInput;
const deferredQ = useDeferredValue(q);
// q updates immediately; deferredQ lags behind while heavy work renders.
// Great for wrapping a prop that drives a heavy child, without the child needing to know about transitions.</code></pre>
<p>Internally: React keeps a previous version of the value. When the value changes, React schedules a transition-priority render that uses the new value; urgent renders in the meantime see the old value.</p>

<h3>Suspense under concurrent rendering</h3>
<p>A component <em>suspends</em> by throwing a thenable (a promise-like) during render. React catches it, walks up to the nearest <code>&lt;Suspense&gt;</code>, and renders the fallback. When the thenable resolves, React retries.</p>
<p>Under concurrent rendering, a Suspense boundary can preserve the old UI until the new render is ready — no fallback flash if the transition is "not urgent." Key controls:</p>
<ul>
  <li>Default: if a Suspense boundary is newly revealed (mount), fallback shows.</li>
  <li>During a transition: if an already-rendered Suspense boundary would need to show a fallback, React <em>keeps the old UI</em> until the new tree is ready (to avoid flicker).</li>
</ul>

<h3>Suspense + data fetching</h3>
<p>React doesn't ship a data-fetching primitive. Ways to use Suspense for data:</p>
<ul>
  <li><strong>React Query / SWR</strong> have a <code>suspense: true</code> flag → a <code>useQuery</code> call suspends if data isn't cached.</li>
  <li><strong>Relay / Apollo</strong> have first-class Suspense support.</li>
  <li><strong>Next.js / Remix (React Server Components)</strong> integrate Suspense natively.</li>
  <li><strong>Promise wrapped in a cache</strong> — the <code>use</code> hook (stable in 19) reads a promise, suspending if unresolved.</li>
</ul>

<h3>The <code>use</code> hook (React 19)</h3>
<pre><code class="language-js">function Profile({ userPromise }) {
  const user = use(userPromise);     // suspends until resolved
  return &lt;div&gt;{user.name}&lt;/div&gt;;
}</code></pre>
<p>Can also call in conditions/loops (unlike other hooks). Reads a promise or a Context, integrating with Suspense / streaming.</p>

<h3>Streaming SSR</h3>
<p>React 18 shipped:</p>
<ul>
  <li><code>renderToPipeableStream(jsx)</code> — Node streams API. Returns a pipeable stream; flush chunks to the client as regions become ready.</li>
  <li><code>renderToReadableStream(jsx)</code> — Web Streams API (Edge runtimes, Deno).</li>
</ul>
<p>Boundaries with slow data suspend; the server emits their fallback first, then later streams the real markup inline with a <code>&lt;script&gt;</code> that swaps it in. Clients can hydrate progressively — regions become interactive as soon as their JS loads, not waiting for the full page.</p>

<h3>Selective hydration</h3>
<p>When the browser receives the HTML, it can start hydrating. If the user clicks on a region that hasn't hydrated yet, React prioritizes that region — hydrating the click target first, others later. Powered by the same lane system.</p>

<h3>createRoot vs ReactDOM.render</h3>
<pre><code class="language-js">// React 18+ (concurrent-enabled)
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(&lt;App/&gt;);
// Legacy (no concurrent features)
ReactDOM.render(&lt;App/&gt;, document.getElementById('app'));</code></pre>
<p>Only <code>createRoot</code> unlocks concurrent features. <code>ReactDOM.render</code> still works in 18 but is in legacy mode and will be removed.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — useTransition for filter responsiveness</h3>
<pre><code class="language-js">function Filter({ items }) {
  const [text, setText] = useState('');
  const [list, setList] = useState(items);
  const [pending, startTransition] = useTransition();
  return (&lt;&gt;
    &lt;input value={text} onChange={(e) =&gt; {
      setText(e.target.value);                   // urgent
      startTransition(() =&gt; setList(              // deferred
        items.filter(i =&gt; i.includes(e.target.value))
      ));
    }} /&gt;
    {pending &amp;&amp; &lt;small&gt;searching…&lt;/small&gt;}
    &lt;List items={list} /&gt;
  &lt;/&gt;);
}</code></pre>

<h3>Example 2 — useDeferredValue replacing useTransition when you don't control the setter</h3>
<pre><code class="language-js">function Wrapper({ query }) {
  const deferredQuery = useDeferredValue(query);
  const stale = query !== deferredQuery;
  return &lt;Results className={stale ? 'stale' : ''} q={deferredQuery} /&gt;;
}</code></pre>

<h3>Example 3 — Suspense for async component</h3>
<pre><code class="language-js">const LazyProfile = lazy(() =&gt; import('./Profile'));
&lt;Suspense fallback={&lt;Spinner/&gt;}&gt;
  &lt;LazyProfile id={userId} /&gt;
&lt;/Suspense&gt;</code></pre>

<h3>Example 4 — Nested Suspense for waterfall fallbacks</h3>
<pre><code class="language-js">&lt;Suspense fallback={&lt;Page/&gt;}&gt;
  &lt;Header/&gt;
  &lt;Suspense fallback={&lt;CardSkeleton/&gt;}&gt;
    &lt;UserCard/&gt;
  &lt;/Suspense&gt;
  &lt;Footer/&gt;
&lt;/Suspense&gt;
// UserCard suspends → shows CardSkeleton (not Page), Header and Footer render.</code></pre>

<h3>Example 5 — React Query with Suspense</h3>
<pre><code class="language-js">function User({ id }) {
  const { data } = useQuery(['user', id], () =&gt; fetchUser(id), { suspense: true });
  return &lt;div&gt;{data.name}&lt;/div&gt;;
}
// App:
&lt;Suspense fallback={&lt;Spinner/&gt;}&gt;&lt;User id={id}/&gt;&lt;/Suspense&gt;</code></pre>

<h3>Example 6 — startTransition without useTransition (imperative)</h3>
<pre><code class="language-js">import { startTransition } from 'react';
function onClickTab(tab) {
  startTransition(() =&gt; setTab(tab));
}
// No pending indicator, but tab switch is still interruptible.</code></pre>

<h3>Example 7 — automatic batching</h3>
<pre><code class="language-js">function App() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  useEffect(() =&gt; {
    fetch(url).then(() =&gt; {
      setA(1);
      setB(2);
      // React 18: single render. React 17: two renders.
    });
  }, []);
}</code></pre>

<h3>Example 8 — flushSync opting out</h3>
<pre><code class="language-js">import { flushSync } from 'react-dom';
function scrollToNewItem() {
  flushSync(() =&gt; setItems([...items, newItem]));
  // DOM is now updated; can measure and scroll
  listRef.current.lastChild.scrollIntoView();
}</code></pre>

<h3>Example 9 — streaming SSR Node</h3>
<pre><code class="language-js">import { renderToPipeableStream } from 'react-dom/server';
app.get('/', (req, res) =&gt; {
  const { pipe } = renderToPipeableStream(&lt;App/&gt;, {
    onShellReady() {
      res.status(200).setHeader('Content-Type', 'text/html');
      pipe(res); // start flushing shell; suspended regions stream later
    },
    onError(err) { console.error(err); }
  });
});</code></pre>

<h3>Example 10 — Edge / Web Streams</h3>
<pre><code class="language-js">import { renderToReadableStream } from 'react-dom/server';
export default async function handler(req) {
  const stream = await renderToReadableStream(&lt;App/&gt;, {
    bootstrapScripts: ['/main.js'],
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/html' } });
}</code></pre>

<h3>Example 11 — selective hydration illustration</h3>
<pre><code class="language-jsx">&lt;Layout&gt;
  &lt;Header /&gt;                      {/* hydrates first (user hovering menu) */}
  &lt;Suspense fallback={...}&gt;
    &lt;RelatedPosts /&gt;              {/* waits on data, hydrates when ready */}
  &lt;/Suspense&gt;
  &lt;Suspense fallback={...}&gt;
    &lt;Comments /&gt;                  {/* hydrates last */}
  &lt;/Suspense&gt;
&lt;/Layout&gt;
// If user clicks Comments before Header hydrated, Comments gets priority.</code></pre>

<h3>Example 12 — use hook reading a promise</h3>
<pre><code class="language-js">function Profile({ userPromise }) {
  const user = use(userPromise); // suspends until resolved
  return &lt;div&gt;{user.name}&lt;/div&gt;;
}
// Called under a Suspense boundary. Works with RSC.</code></pre>

<h3>Example 13 — transitions + suspense for "show old while new loads"</h3>
<pre><code class="language-js">const [isPending, startTransition] = useTransition();
function navigate(id) {
  startTransition(() =&gt; setPage(id));
  // If the new page suspends, React keeps the current page rendered
  // and shows isPending = true, rather than flashing the fallback.
}</code></pre>

<h3>Example 14 — measuring with flushSync between updates</h3>
<pre><code class="language-js">function AutoResize() {
  const ref = useRef();
  const [rows, setRows] = useState(3);
  function grow() {
    flushSync(() =&gt; setRows(r =&gt; r + 1));
    // DOM is updated; measure height
    console.log(ref.current.clientHeight);
  }
  return &lt;textarea ref={ref} rows={rows} /&gt;;
}</code></pre>

<h3>Example 15 — opt into concurrent with createRoot</h3>
<pre><code class="language-js">// index.js
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(&lt;App/&gt;);</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Side effects in render become visible</h3>
<pre><code class="language-js">// BAD in concurrent
function Comp() {
  window.x++; // called 2× in StrictMode, plus may be re-run if render aborted
  return null;
}</code></pre>
<p>Any render-time mutation is unsafe under concurrent rendering. Move to <code>useEffect</code>.</p>

<h3>2. useTransition inside a raw event handler</h3>
<pre><code class="language-js">document.addEventListener('click', () =&gt; {
  startTransition(() =&gt; setState(x));
  // Works — startTransition works outside React event handlers too.
});</code></pre>

<h3>3. Transition can be interrupted → stale results avoided</h3>
<pre><code class="language-js">startTransition(() =&gt; setResults(await fetch(q).json()));
// Type faster → a new transition starts → old fetch's setResults is still pending.
// Need a cancel/abort mechanism (AbortController) to prevent stale data.</code></pre>

<h3>4. Suspense fallback flicker on navigation</h3>
<p>Without transitions, a route change reveals a Suspense fallback momentarily. Wrap the route change in <code>startTransition</code> → fallback doesn't flash; old page stays until new is ready.</p>

<h3>5. Suspending above an already-mounted boundary</h3>
<p>If a component above an existing Suspense boundary starts suspending, React unmounts the subtree and shows the fallback. This is why boundaries are best placed just above the suspending component — not at the top of the app.</p>

<h3>6. useDeferredValue on primitives vs objects</h3>
<p>Works best with stable primitives (strings, numbers). If you defer an object and the object is recreated every render, the deferred version is always different from the current — not what you want.</p>

<h3>7. useTransition's isPending lags by one render</h3>
<p><code>isPending</code> becomes true on the first render after the transition is started — not synchronously. For the first urgent render, you may see the old UI without <code>pending</code> indicator. Usually fine.</p>

<h3>8. Sync updates can't be transitions</h3>
<pre><code class="language-js">// BAD
startTransition(() =&gt; {
  setState(v);
  flushSync(() =&gt; setX(y)); // escalates to sync, defeats purpose
});</code></pre>

<h3>9. Streaming SSR requires Suspense to work</h3>
<p>Without <code>&lt;Suspense&gt;</code> boundaries, the server can't stream — it's got to wait for everything. The more boundaries, the more granular streaming.</p>

<h3>10. Hydration mismatches under streaming</h3>
<p>Streaming SSR plus dynamic content can cause hydration mismatches (server renders "guest," client hydrates as "logged in"). Fix: render such conditional UI inside a Suspense boundary or use <code>useSyncExternalStore</code> with a proper server snapshot.</p>

<h3>11. Automatic batching breaks some libraries</h3>
<p>Pre-18 code that relied on "each setState is a separate render" (e.g., a custom observable lib triggering a re-render per dispatch) may behave differently. Fix: usually works correctly; if not, <code>flushSync</code> around critical updates.</p>

<h3>12. Concurrent mode and DOM refs</h3>
<p>Refs are set during commit only. You can't read <code>ref.current</code> during render and expect it to reflect the latest DOM — the tree might not have committed yet.</p>

<h3>13. StrictMode double-mounting effects</h3>
<p>In React 18 dev StrictMode, effects run → clean up → run again on mount. Tests this: if your cleanup doesn't restore state (e.g., subscription count goes from 0 → 1 → 1 → 2), you have a missed cleanup.</p>

<h3>14. Suspense can only catch thrown thenables</h3>
<p>If a library throws a regular Error or throws synchronously, Suspense does NOT catch it. That's for Error Boundaries. The contract is: throw a promise-like, React waits.</p>

<h3>15. startTransition callback must be synchronous</h3>
<pre><code class="language-js">// BAD
startTransition(async () =&gt; {
  await fetch(...);
  setState(...); // NOT in transition — async boundary detached it
});
// GOOD
const data = await fetch(...);
startTransition(() =&gt; setState(data));</code></pre>

<h3>16. Lanes can coalesce multiple startTransition calls</h3>
<p>Several transitions in quick succession share a lane — they commit together. Usually desired. Rarely surprising.</p>

<h3>17. Retry lanes vs transition lanes</h3>
<p>When a Suspense boundary resolves (data arrives), React schedules work on a retry lane — separate from transition lanes. This is why a Suspense retry doesn't starve other pending transitions.</p>

<h3>18. setState from an aborted render</h3>
<p>If you call <code>setState</code> during a render that gets aborted, the update is still queued for the next render. React doesn't "undo" state updates when aborting — it just discards the tentative UI.</p>

<h3>19. Context inside transitions</h3>
<p>Context changes during a transition are also deferred along with the transition. Consumers see the new value only when the transition commits.</p>

<h3>20. RSC changes the picture again</h3>
<p>React Server Components (stable in React 19) push a lot of data-fetching server-side; client components stay "dumb" and receive serialized trees. <code>use</code> + Suspense are the core primitives. Concurrent rendering is foundational to RSC — you can't do RSC without it.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — startTransition for the wrong thing</h3>
<pre><code class="language-js">// BAD — debounces intent but doesn't update UI
startTransition(() =&gt; setInput(e.target.value));</code></pre>
<p>Input value should be urgent. Filter result is the transition.</p>

<h3>Anti-pattern 2 — Suspense boundary too high</h3>
<pre><code class="language-js">// BAD — any slow child blanks the whole app
&lt;Suspense fallback={&lt;Loading/&gt;}&gt;
  &lt;App/&gt;
&lt;/Suspense&gt;</code></pre>
<p>Wrap closer to the async child.</p>

<h3>Anti-pattern 3 — Suspense in a non-streaming environment</h3>
<p>Old SSR (<code>renderToString</code>) doesn't support Suspense for data. Its suspension becomes a client-only fallback, losing SEO benefits. Migrate to streaming APIs.</p>

<h3>Anti-pattern 4 — async startTransition callback</h3>
<pre><code class="language-js">// BAD
startTransition(async () =&gt; {
  const data = await fetch(url);
  setX(data);
});</code></pre>
<p>Only sync state updates inside the callback are tagged. Move the await outside, then <code>startTransition(() =&gt; setX(data))</code>.</p>

<h3>Anti-pattern 5 — flushSync over-use</h3>
<pre><code class="language-js">// BAD
flushSync(() =&gt; setA(1));
flushSync(() =&gt; setB(2));
flushSync(() =&gt; setC(3));</code></pre>
<p>Three synchronous renders. Only use when you must measure layout between updates.</p>

<h3>Anti-pattern 6 — mutating external stores during render</h3>
<pre><code class="language-js">function Comp() {
  store.count++; // concurrent render may double-run or discard
}</code></pre>
<p>Move to effects or event handlers.</p>

<h3>Anti-pattern 7 — assuming single commit per setState</h3>
<p>Pre-18 code that expected one commit per <code>setState</code> in async contexts will see batched behavior in 18. If your tests rely on the old ordering, they'll fail.</p>

<h3>Anti-pattern 8 — Suspense + throwing plain Errors</h3>
<p>Errors bubble to the nearest ErrorBoundary, not Suspense. Mixing these mental models leads to "my loading state shows when my code throws." Wrap with an ErrorBoundary too.</p>

<h3>Anti-pattern 9 — no cancel for transitions</h3>
<p>A transition can be restarted by a new urgent update, but side effects inside the transition keep running (e.g., an async fetch). Pair with AbortController or a cancellation token.</p>

<h3>Anti-pattern 10 — setState in useEffect that doesn't early-return</h3>
<pre><code class="language-js">useEffect(() =&gt; {
  fetch(url).then(setData); // component unmounted? Still calls setData.
}, [url]);</code></pre>
<p>In concurrent rendering, components may mount/unmount rapidly (e.g., during StrictMode double-mount). Always guard or use AbortController.</p>

<h3>Anti-pattern 11 — Heavy work in useLayoutEffect</h3>
<p>Blocks paint. If the work can be async, use <code>useEffect</code> and accept the extra frame.</p>

<h3>Anti-pattern 12 — Missing Suspense fallback entirely</h3>
<pre><code class="language-js">// BAD
&lt;LazyX /&gt;  // throws promise, no boundary catches, unhandled</code></pre>

<h3>Anti-pattern 13 — relying on double-effect-mount</h3>
<p>Don't write code that only works because StrictMode double-mounts. Production does not. Your logic should be correct regardless.</p>

<h3>Anti-pattern 14 — Using <code>use</code> outside Suspense</h3>
<p><code>use(promise)</code> throws to the nearest Suspense. Without one, the error bubbles to an ErrorBoundary or crashes.</p>

<h3>Anti-pattern 15 — Legacy render + concurrent APIs</h3>
<p>If you still use <code>ReactDOM.render</code> (legacy mode), <code>startTransition</code> is a no-op. Migrate to <code>createRoot</code> to unlock concurrent features.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What does "concurrent" mean in React 18?</div>
  <div class="qa-answer">
    <p>React can interrupt a long-running render to process a higher-priority update, then come back. It splits renders into small units (fiber boundaries) and yields to the browser between units. It can also prepare multiple versions of the UI simultaneously and discard unused ones without committing. Not multi-threaded; still on the main thread. Not automatic either — you opt in via <code>startTransition</code> / <code>useTransition</code> / <code>useDeferredValue</code> / Suspense.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. How do lanes work?</div>
  <div class="qa-answer">
    <p>Lanes are a 31-bit bitmask, each bit a priority tier: Sync, InputContinuous, Default, multiple Transition lanes, Retry, Idle. Each <code>setState</code> is tagged with a lane inferred from the current event. The scheduler picks the highest-priority non-empty lane to render. Multiple lanes can be entangled (processed together) for consistency. A new higher-priority update arriving mid-render aborts the in-flight render, and React restarts at the new priority.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What is startTransition and when do I use it?</div>
  <div class="qa-answer">
    <p><code>startTransition(() =&gt; setX(...))</code> marks the wrapped state updates as low priority. React can defer rendering those updates if more urgent work (user input) arrives. Use it whenever a state update triggers heavy work that doesn't need to be instantaneous — route transitions, filter/sort of large lists, tab switches. Use <code>useTransition</code> if you also want the <code>isPending</code> flag for non-blocking indicators.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Difference between useTransition and useDeferredValue?</div>
  <div class="qa-answer">
    <p><code>useTransition</code> lets YOU mark YOUR own state updates as low priority. <code>useDeferredValue(x)</code> wraps a value you receive (from props, from a parent's state you can't modify) and returns a "deferred" version that lags behind during heavy work. Both produce a similar effect — keep urgent renders responsive. Use <code>useTransition</code> when you control the setter; <code>useDeferredValue</code> when you don't.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How does Suspense work?</div>
  <div class="qa-answer">
    <p>A component "suspends" by throwing a thenable (promise-like object) during render. React walks up the tree to find the nearest <code>&lt;Suspense&gt;</code> boundary and renders its <code>fallback</code>. When the thenable resolves, React retries that subtree. Under concurrent rendering, transitions can avoid showing fallbacks — keeping the old UI until the new tree is ready. Primary consumer: data-fetching libraries (React Query, Relay, RSC) that integrate Suspense to declaratively describe loading states.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What is automatic batching and how did it change in 18?</div>
  <div class="qa-answer">
    <p>Multiple <code>setState</code> calls in the same tick are collapsed into one render. Pre-18, this only happened inside React-synthetic event handlers — async callbacks (setTimeout, promise.then, native events) rendered per <code>setState</code>. In 18, batching is <em>automatic</em> in all contexts. Opt out with <code>flushSync(() =&gt; setX(v))</code> when you need a mid-sequence synchronous render (e.g., measuring between updates).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What's streaming SSR and why is it better than renderToString?</div>
  <div class="qa-answer">
    <p><code>renderToString</code> waits until the ENTIRE tree renders, then flushes all HTML at once. Slow queries block the shell. <code>renderToPipeableStream</code> (or <code>renderToReadableStream</code> for Edge) flushes the shell immediately and streams in Suspense boundary contents as their data arrives. Benefits: faster TTFB, progressive rendering, selective hydration (users can interact with the header before the comments section finishes). Requires Suspense boundaries to partition the tree.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What's selective hydration?</div>
  <div class="qa-answer">
    <p>React 18 hydrates the page progressively as JS loads. If the user interacts with a region that hasn't hydrated yet, React prioritizes that region. Powered by lanes: the click raises the priority of its subtree's hydration. Result: pages become usable before they're fully hydrated, which is especially important on slow connections.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Is my code automatically concurrent in React 18?</div>
  <div class="qa-answer">
    <p>Not exactly. Upgrading to <code>createRoot</code> enables <em>opt-in</em> features — <code>startTransition</code>, Suspense with streaming, automatic batching. Your existing synchronous <code>setState</code>s remain synchronous. You pick which updates are transitions. Concurrent rendering is a capability React makes available; you adopt it gradually.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's the <code>use</code> hook?</div>
  <div class="qa-answer">
    <p>A new hook in React 19 that reads from a Promise or a Context. <code>const data = use(promise)</code> suspends the component until the promise resolves. Can be called conditionally (unlike other hooks) and inside loops. Designed for React Server Components (where the server passes promises to client components) and for Suspense-integrated data fetching without needing a library wrapper.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Why does concurrent rendering require render to be pure?</div>
  <div class="qa-answer">
    <p>Because React may call the component function multiple times before committing, may discard a render and start over, may prepare speculative branches. Render-time side effects — mutating an external store, calling a global function with a log — become non-deterministic and visible. Effects (<code>useEffect</code>) run exactly once per commit, so they're the safe place for side effects. StrictMode double-invokes renders in dev to surface violators.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Predict the output</div>
<pre><code class="language-js">function App() {
  const [n, setN] = useState(0);
  useEffect(() =&gt; {
    Promise.resolve().then(() =&gt; {
      setN(1);
      setN(2);
      setN(3);
    });
  }, []);
  console.log('render', n);
  return null;
}</code></pre>
  <div class="qa-answer">
    <p>React 18: logs <code>render 0</code>, then <code>render 3</code>. Automatic batching collapses the three setN calls into a single re-render. React 17: logs <code>render 0, render 1, render 2, render 3</code> because each setState triggered its own render (batching didn't apply inside promise callbacks).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. When should I use Error Boundary vs Suspense?</div>
  <div class="qa-answer">
    <p><strong>Suspense</strong> handles thrown thenables (i.e., async not-yet-ready). Shows a fallback until resolved.</p>
    <p><strong>Error Boundary</strong> handles thrown Errors (i.e., render-time bugs or explicit failures). Shows a fallback after catching the error.</p>
    <p>Place both: an Error Boundary outside a Suspense boundary, so loading and failure have separate fallbacks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Explain the difference between <code>createRoot</code> and <code>ReactDOM.render</code>.</div>
  <div class="qa-answer">
    <p><code>createRoot</code> (React 18+) creates a concurrent-capable root. Opt-in hooks (<code>useTransition</code>, <code>useDeferredValue</code>), Suspense streaming, automatic batching all work. <code>ReactDOM.render</code> (legacy) creates a synchronous root — concurrent features are no-ops. <code>ReactDOM.render</code> is deprecated and will be removed. Migration is usually a one-line change in the entry file.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Give a real-world use case for each concurrent API.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>startTransition</strong> — clicking a tab that renders a chart with 50k points; keep the tab UI responsive.</li>
      <li><strong>useTransition</strong> — the above, plus a subtle "updating…" label while the chart renders.</li>
      <li><strong>useDeferredValue</strong> — a heavy child driven by a prop from a third-party library that you can't wrap; defer the prop.</li>
      <li><strong>Suspense</strong> — declarative loading states for code-split routes and async data boundaries.</li>
      <li><strong>Streaming SSR</strong> — a product page whose recommendations are slow; send the shell immediately and stream the recs later.</li>
      <li><strong>Selective hydration</strong> — a marketing page where the fold is interactive before the below-the-fold JS loads.</li>
    </ul>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You say "lanes" and explain priority-driven scheduling.</li>
    <li>You distinguish startTransition from useDeferredValue by who controls the setter.</li>
    <li>You describe Suspense as "throw a thenable, nearest boundary catches, retries on resolve."</li>
    <li>You know automatic batching changed scope in 18.</li>
    <li>You can explain selective hydration and streaming SSR.</li>
    <li>You call out render purity as a requirement of concurrent rendering.</li>
    <li>You don't conflate Suspense (async) with ErrorBoundary (errors).</li>
  </ul>
</div>
`}

]
});
