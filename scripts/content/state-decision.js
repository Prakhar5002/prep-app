window.PREP_SITE.registerTopic({
  id: 'state-decision',
  module: 'state-deep',
  title: 'Decision Tree',
  estimatedReadTime: '30 min',
  tags: ['state-management', 'decision-tree', 'architecture', 'redux', 'zustand', 'jotai', 'react-query', 'xstate', 'context'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Most state-management debates ("Redux or Zustand?") miss the actual question: <em>what kind of state is this?</em> Different categories of state want different tools. The decision isn't "what library" — it's "which type of state do I have, and what's the right home for it?"</p>
<ul>
  <li><strong>5 categories of state:</strong> server state, URL state, client UI state, cross-feature client state, behavioral state (state machines).</li>
  <li><strong>Server state →</strong> React Query / TanStack Query / RTK Query / SWR. <em>Always</em>. Don't put server data in Redux/Zustand.</li>
  <li><strong>URL state →</strong> the URL itself (search params, path). React Router / TanStack Router.</li>
  <li><strong>Local UI state →</strong> <code>useState</code> / <code>useReducer</code>. Modal open, hover, focus, form values.</li>
  <li><strong>Cross-feature client state →</strong> Zustand (default), Jotai (atomic shape), Redux + RTK (large enterprise apps), Context (low-change values like theme).</li>
  <li><strong>Behavioral state with discrete modes →</strong> XState. Forms wizards, payment flows, retry logic, WebSocket lifecycle.</li>
  <li><strong>Most apps need 2-3 of these</strong> — never just one. The wrong default is "everything in Redux."</li>
  <li><strong>Migration is OK.</strong> Start small (useState); promote to Zustand when shared; promote to XState when behavior gets complex; always keep server state separate.</li>
</ul>
<p><strong>Mantra:</strong> "Categorize state first. Then pick the tool that fits the category. Server state, URL state, UI state, client state, behavioral state — five categories, four to five tools."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The fundamental insight</h3>
<p>The "best state management library" question is the wrong question. There's no single library that handles every kind of state well. Server state has different lifecycle, persistence, and consistency requirements than UI flag state. Treating them with the same tool produces awkward code.</p>

<h3>The 5 categories of state</h3>
<table>
  <thead><tr><th>#</th><th>Category</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Server state</td><td>User profile, posts list, search results, anything fetched</td></tr>
    <tr><td>2</td><td>URL state</td><td>Current route, query params, fragment, filters that should be shareable</td></tr>
    <tr><td>3</td><td>Local UI state</td><td>Modal open, focused input, hover, typing draft, animation progress</td></tr>
    <tr><td>4</td><td>Cross-feature client state</td><td>Auth tokens, theme, user preferences, cart contents (when not server-backed)</td></tr>
    <tr><td>5</td><td>Behavioral state (state machines)</td><td>Form wizards, payment flows, WebSocket connection, retry logic, drag-drop</td></tr>
  </tbody>
</table>

<h3>Why categorization first</h3>
<p>Once you know the category, the tool follows almost mechanically:</p>
<table>
  <thead><tr><th>Category</th><th>Default tool</th><th>Alternatives</th></tr></thead>
  <tbody>
    <tr><td>Server state</td><td>React Query / TanStack Query</td><td>SWR, RTK Query, Apollo Client (GraphQL)</td></tr>
    <tr><td>URL state</td><td>The URL itself</td><td>React Router, TanStack Router, Next.js useSearchParams</td></tr>
    <tr><td>Local UI state</td><td><code>useState</code></td><td><code>useReducer</code> for &gt;3 related fields</td></tr>
    <tr><td>Cross-feature client state</td><td>Zustand</td><td>Jotai (atomic), Redux + RTK (enterprise), Context (rare-change values)</td></tr>
    <tr><td>Behavioral state</td><td>XState</td><td>useReducer (simpler cases), Redux state machine pattern</td></tr>
  </tbody>
</table>

<h3>What this topic adds</h3>
<p>The previous four topics in this module each cover a tool deeply. This topic is the <em>meta</em>: how do you decide which to use when, and how do they coexist in one app?</p>

<h3>Why interviewers ask</h3>
<ol>
  <li>Tests architectural reasoning, not framework knowledge.</li>
  <li>Differentiates engineers who default to "Redux for everything" from those who pick tools deliberately.</li>
  <li>Common interview prompt: "How would you structure state for this feature?"</li>
  <li>Tests the ability to defend tool choices with concrete trade-off reasoning.</li>
</ol>

<h3>Why "everything in Redux" is the most common anti-pattern</h3>
<p>Pre-2018 mindset: "we have Redux, so put everything in it." Result: forms in Redux, modal flags in Redux, fetched data in Redux with manual loading flags, XHR retry logic in middleware. Boilerplate explodes. Testing hurts. Migration becomes a wedding ring.</p>
<p>Post-2020 mindset: each category gets its right tool. Smaller surfaces, clearer intent, easier evolution.</p>

<h3>What "good" looks like</h3>
<ul>
  <li>You can name 5 categories of state.</li>
  <li>You categorize before reaching for tools.</li>
  <li>Your apps use 2-4 different state libraries — and the boundaries are clear.</li>
  <li>You can defend each tool choice in 30 seconds.</li>
  <li>You don't migrate state libraries for fashion; you migrate when category-tool mismatch causes real pain.</li>
  <li>Local UI state is local; you don't promote it without a reason.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The decision tree</h3>
<pre><code class="language-text">                  ┌────────────────────────────────────┐
                  │   What kind of state is this?      │
                  └─────────────┬──────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┬─────────────────────────┬──────────────────────┐
        ▼                       ▼                       ▼                         ▼                      ▼
  Fetched from server?   Lives in URL?         Strictly local UI?     Shared across components?   Discrete modes / flow?
        │                       │                       │                         │                      │
        ▼                       ▼                       ▼                         ▼                      ▼
   React Query             URL params /         useState / useReducer       Zustand (default)       XState
   (TanStack Query)        React Router         (modal open, hover,         Jotai (atomic)
   RTK Query              TanStack Router       form values, anim)          Redux + RTK
                                                                            Context (rare changes)
</code></pre>

<h3>The "where does it live?" decision questions</h3>
<ol>
  <li><strong>Is this data fetched from a server?</strong> If yes → React Query. Stop.</li>
  <li><strong>Should this state survive a page refresh / be shareable via URL?</strong> If yes → URL params.</li>
  <li><strong>Is this state used only by one component (and its children)?</strong> If yes → useState / useReducer.</li>
  <li><strong>Does this state have distinct modes with specific allowed transitions?</strong> If yes → XState (or a smaller machine via useReducer if simple).</li>
  <li><strong>Otherwise:</strong> cross-feature client state → Zustand or Jotai.</li>
</ol>

<h3>The "size of state" axis</h3>
<table>
  <thead><tr><th>Size</th><th>Tool</th></tr></thead>
  <tbody>
    <tr><td>One value, one component</td><td><code>useState</code></td></tr>
    <tr><td>Few related fields, one component</td><td><code>useReducer</code></td></tr>
    <tr><td>Few values, several components in a tree</td><td>Lift to common parent + props</td></tr>
    <tr><td>Many components across the tree</td><td>Zustand / Jotai / Context</td></tr>
    <tr><td>Whole-app state with auditability</td><td>Redux + RTK</td></tr>
  </tbody>
</table>

<h3>The "change frequency" axis</h3>
<table>
  <thead><tr><th>Change frequency</th><th>Best fit</th></tr></thead>
  <tbody>
    <tr><td>Never / very rare</td><td>Constants / config; module-level</td></tr>
    <tr><td>Once per session</td><td>Context (theme, locale, auth)</td></tr>
    <tr><td>Few times per minute</td><td>Zustand / Jotai</td></tr>
    <tr><td>Many times per second</td><td>useState (don't go global)</td></tr>
  </tbody>
</table>

<h3>The "concurrency" axis</h3>
<table>
  <thead><tr><th>Property</th><th>Tool</th></tr></thead>
  <tbody>
    <tr><td>Suspense-ready async</td><td>Jotai (async atoms) + React Query (suspense queries)</td></tr>
    <tr><td>Synchronous client state</td><td>Zustand / useState</td></tr>
    <tr><td>Time-aware transitions</td><td>XState (after, invoke, services)</td></tr>
  </tbody>
</table>

<h3>Composing tools in one app</h3>
<p>A typical modern app uses 3-4 tools simultaneously:</p>
<pre><code class="language-text">┌────────────────────────────────────────────────────┐
│                  React App                         │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ React Query  │  │   Zustand    │               │
│  │ server state │  │ client state │               │
│  └──────────────┘  └──────────────┘               │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐               │
│  │   useState   │  │   XState     │               │
│  │  local UI    │  │ checkout flow│               │
│  └──────────────┘  └──────────────┘               │
│                                                    │
│  ┌──────────────┐                                  │
│  │  URL params  │                                  │
│  │ filters/sort │                                  │
│  └──────────────┘                                  │
│                                                    │
└────────────────────────────────────────────────────┘
</code></pre>
<p>Each tool's surface stays small; boundaries are obvious; migration is incremental.</p>

<h3>The "promotion" pattern</h3>
<p>Don't predict where state will end up. Start as small as possible; promote when justified:</p>
<pre><code class="language-text">useState (one component)
   │
   │ another component needs it
   ▼
Lift to common parent + props
   │
   │ &gt;3 components or deep tree
   ▼
Zustand / Jotai / Context
   │
   │ behavior is becoming complex
   ▼
XState
   │
   │ enterprise scale + audit needs
   ▼
Redux + RTK
</code></pre>
<p>Demoting is fine too: state that started global but is actually local can move back down.</p>

<h3>The "what to NOT use" matrix</h3>
<table>
  <thead><tr><th>Tool</th><th>Don't use for</th></tr></thead>
  <tbody>
    <tr><td>Redux</td><td>Form state, modal state, hover state, server data (use RTK Query for that), small/medium apps</td></tr>
    <tr><td>Zustand / Jotai</td><td>Server data, local UI state for single components, complex transition logic</td></tr>
    <tr><td>React Query</td><td>Pure client state, UI flags, behavioral state</td></tr>
    <tr><td>XState</td><td>Simple data, lists, settings, single-flag toggles</td></tr>
    <tr><td>Context</td><td>Frequently-changing state with many consumers (re-render fan-out)</td></tr>
    <tr><td>useState</td><td>Cross-tree shared state</td></tr>
  </tbody>
</table>

<h3>The "URL state" sub-decision</h3>
<table>
  <thead><tr><th>Should state be in the URL?</th><th>Yes if…</th></tr></thead>
  <tbody>
    <tr><td>Filters / sort / page</td><td>Users would expect "share this view" to work</td></tr>
    <tr><td>Modal / dialog open</td><td>Sometimes; deep linkable modals are useful</td></tr>
    <tr><td>Selected tab</td><td>Often; especially with browser-back behavior</td></tr>
    <tr><td>Form values</td><td>Almost never (privacy, length); except simple search inputs</td></tr>
    <tr><td>Auth state</td><td>No</td></tr>
    <tr><td>Theme</td><td>No (use localStorage)</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>By scenario — what to use</h3>

<h4>1. Login form with validation</h4>
<table>
  <tbody>
    <tr><td>Form values</td><td><code>useState</code> per field, or react-hook-form</td></tr>
    <tr><td>Submission state</td><td>useMutation (React Query)</td></tr>
    <tr><td>Auth token storage</td><td>Zustand persisted to Keychain</td></tr>
    <tr><td>Multi-step flow with 2FA</td><td>XState if complex; useReducer if simple</td></tr>
  </tbody>
</table>

<h4>2. Product list with filters</h4>
<table>
  <tbody>
    <tr><td>Filter values</td><td>URL params (shareable)</td></tr>
    <tr><td>Product data</td><td>useQuery, key includes filter values</td></tr>
    <tr><td>Selected product detail open</td><td><code>useState</code> in parent</td></tr>
    <tr><td>"Sort by" dropdown UI state</td><td><code>useState</code> in dropdown component</td></tr>
  </tbody>
</table>

<h4>3. Chat application</h4>
<table>
  <tbody>
    <tr><td>Conversation list</td><td>useInfiniteQuery</td></tr>
    <tr><td>Active conversation messages</td><td>useInfiniteQuery + WebSocket invalidation</td></tr>
    <tr><td>Typing draft</td><td><code>useState</code> per conversation</td></tr>
    <tr><td>Online status</td><td>useQuery polling (or WebSocket)</td></tr>
    <tr><td>"Connected" / "Reconnecting" indicator</td><td>XState (WebSocket lifecycle)</td></tr>
  </tbody>
</table>

<h4>4. Multi-step checkout</h4>
<table>
  <tbody>
    <tr><td>Step navigation + validation</td><td>XState (clear state machine)</td></tr>
    <tr><td>Cart contents</td><td>Zustand (local) + useMutation (when synced to server)</td></tr>
    <tr><td>Address autocomplete</td><td>useQuery with debounced input</td></tr>
    <tr><td>Payment processing state</td><td>Part of XState machine (submitting / 3DS / done)</td></tr>
    <tr><td>Saved cards list</td><td>useQuery</td></tr>
  </tbody>
</table>

<h4>5. Dashboard with widgets</h4>
<table>
  <tbody>
    <tr><td>Widget data (each fetched)</td><td>useQuery, one per widget</td></tr>
    <tr><td>Layout config (which widgets, position)</td><td>Zustand (persisted)</td></tr>
    <tr><td>Date range filter (shared across widgets)</td><td>URL params or Zustand</td></tr>
    <tr><td>"Customize layout" mode</td><td><code>useState</code> in dashboard root</td></tr>
  </tbody>
</table>

<h4>6. Mobile onboarding flow</h4>
<table>
  <tbody>
    <tr><td>Current step</td><td>XState (multi-step with branching)</td></tr>
    <tr><td>User's data being filled</td><td>XState context</td></tr>
    <tr><td>Network calls per step</td><td>XState invoke (services)</td></tr>
    <tr><td>"Has completed onboarding" flag</td><td>Zustand persisted</td></tr>
  </tbody>
</table>

<h4>7. Real-time analytics dashboard</h4>
<table>
  <tbody>
    <tr><td>Metrics (polled)</td><td>useQuery with refetchInterval</td></tr>
    <tr><td>Date range</td><td>URL params</td></tr>
    <tr><td>Selected drilldown</td><td>URL params or <code>useState</code></td></tr>
    <tr><td>Connection status</td><td>XState (idle / connected / reconnecting)</td></tr>
  </tbody>
</table>

<h4>8. Settings page</h4>
<table>
  <tbody>
    <tr><td>Form values</td><td>react-hook-form or <code>useState</code></td></tr>
    <tr><td>Save mutation</td><td>useMutation</td></tr>
    <tr><td>"Has unsaved changes" guard</td><td><code>useState</code> + form library's dirty flag</td></tr>
    <tr><td>Theme / language preferences</td><td>Zustand persisted; effective theme as derived value</td></tr>
  </tbody>
</table>

<h4>9. Drag-and-drop kanban board</h4>
<table>
  <tbody>
    <tr><td>Cards data (server-backed)</td><td>useQuery</td></tr>
    <tr><td>Drag interaction state</td><td>XState (idle / picking-up / dragging / dropping)</td></tr>
    <tr><td>Optimistic reordering</td><td>useMutation with onMutate optimistic update</td></tr>
    <tr><td>Selected board ID</td><td>URL param (shareable)</td></tr>
  </tbody>
</table>

<h4>10. Audio / video player</h4>
<table>
  <tbody>
    <tr><td>Playback state (paused / playing / ended)</td><td>XState (often parallel with sound + fullscreen)</td></tr>
    <tr><td>Current media</td><td>Zustand (cross-component) or props</td></tr>
    <tr><td>Volume / playback rate</td><td>Zustand persisted</td></tr>
    <tr><td>Streaming buffer state</td><td>XState (parallel "network" region)</td></tr>
  </tbody>
</table>

<h3>Translation table — common patterns</h3>
<table>
  <thead><tr><th>"I want to..."</th><th>Use</th></tr></thead>
  <tbody>
    <tr><td>...show a loading spinner while data loads</td><td><code>isLoading</code> from useQuery</td></tr>
    <tr><td>...debounce a search input</td><td><code>useState</code> for the input + useDebounce + useQuery with the debounced value</td></tr>
    <tr><td>...refresh data when window focuses</td><td>React Query default behavior; configure refetchOnWindowFocus</td></tr>
    <tr><td>...persist user preferences across sessions</td><td>Zustand with persist middleware (or atomWithStorage in Jotai)</td></tr>
    <tr><td>...sync with multiple tabs</td><td>BroadcastChannel + Zustand subscribe; or React Query's broadcastChannel plugin</td></tr>
    <tr><td>...show a toast notification</td><td>Zustand store with toast queue + useEffect for display</td></tr>
    <tr><td>...remember scroll position when navigating back</td><td>React Router state OR ref-based scroll restoration</td></tr>
    <tr><td>...handle a multi-step form with conditional branching</td><td>XState</td></tr>
    <tr><td>...let users undo recent actions</td><td>Redux (history slice) or XState (history states); or a custom undo stack in Zustand</td></tr>
    <tr><td>...optimistically update UI before server confirms</td><td>useMutation with onMutate + rollback</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: "How would you structure state for an e-commerce app?"</h3>
<pre><code class="language-text">Server state (React Query):
  - Product catalog
  - Product details
  - User's order history
  - Cart contents (when synced)
  - Search results
  - Recommendations

URL state:
  - Current category / search query / filters / sort
  - Product detail ID
  - Cart open / closed (shareable preview)

Client state (Zustand):
  - Auth token (persisted to Keychain on RN, httpOnly cookie on web)
  - User preferences (currency, theme)
  - Recently-viewed products
  - Wishlist (when not server-backed)

Behavioral state (XState):
  - Checkout flow (cart → review → shipping → payment → confirmation)
  - Payment processing (idle / processing / 3DS / success / declined)

Local UI state (useState):
  - Modal open/close
  - Carousel current slide
  - Hover state
  - Form values per checkout step (or feed into XState context)
</code></pre>

<h3>Example 2: "How do these tools coexist? Walk me through a request lifecycle."</h3>
<pre><code class="language-text">User clicks "Buy now" on a product.

1. Component dispatches to XState checkout machine: { type: 'START_CHECKOUT', product }
2. XState transitions: cart → review state.
3. React Query useQuery for "/api/me/saved-payment-methods" runs.
4. Zustand userPreferences supplies default shipping address.
5. URL changes via React Router to /checkout/review.
6. User clicks "Continue".
7. XState validates step; transitions to shipping.
8. Component renders shipping form (useState for inputs).
9. ... and so on through the flow.

Each tool has a clear, narrow job.
</code></pre>

<h3>Example 3: Migration from Redux to layered approach</h3>
<pre><code class="language-text">Before (Redux for everything):
  store.user (auth + profile)
  store.cart (cart state)
  store.products (fetched products)
  store.ui.modal (modal open/close)
  store.ui.toast (toast queue)
  store.checkout.step (current step)

After (categorized):
  React Query: products (was store.products with manual loading)
  Zustand: auth.token, user.preferences (slimmer than store.user)
  XState: checkout machine (was store.checkout)
  useState in components: modal flags, toast triggers
  Cart: choose Zustand if local, React Query if server-backed

Migration steps:
  1. Add React Query; migrate products first; remove from Redux.
  2. Add Zustand; migrate auth + preferences.
  3. Add XState for checkout; migrate state + transitions.
  4. Move modal/toast/ephemeral UI back to component-local state.
  5. Remove Redux entirely.
</code></pre>

<h3>Example 4: "I have a dashboard with 12 widgets. How should I store data?"</h3>
<pre><code class="language-ts">// Each widget fetches its own data
function MetricsWidget({ metric }) {
  const { data } = useQuery({
    queryKey: ['metric', metric, dateRange],
    queryFn: () =&gt; fetchMetric(metric, dateRange),
    staleTime: 60_000,
    refetchInterval: 30_000,
  });
  return &lt;Metric value={data?.value} /&gt;;
}

// Date range shared across widgets — URL state
const [searchParams, setSearchParams] = useSearchParams();
const dateRange = searchParams.get('range') ?? '7d';

// Layout (which widgets, position) — Zustand persisted
const useLayout = create(persist(
  (set) =&gt; ({ widgets: defaultWidgets, set: (w) =&gt; set({ widgets: w }) }),
  { name: 'dashboard-layout' }
));

// Customize-mode flag — useState in Dashboard root
function Dashboard() {
  const [customizing, setCustomizing] = useState(false);
  // ...
}

// Total tools used: useQuery (data), URL params (date range), Zustand (layout), useState (mode).
</code></pre>

<h3>Example 5: Common interview prompt — "Build a todo app architecture"</h3>
<pre><code class="language-ts">// Server state — todos persisted on the server
function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: api.getTodos,
  });
}
function useToggleTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.toggleTodo,
    onMutate: async (id) =&gt; { /* optimistic */ },
    onError: (...) =&gt; { /* rollback */ },
    onSettled: () =&gt; qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

// URL state — current filter
const [params, setParams] = useSearchParams();
const filter = params.get('filter') ?? 'all';

// Local UI state — new todo input
function AddTodoInput() {
  const [text, setText] = useState('');
  // ...
}

// No XState needed (no complex behavioral flow).
// No Zustand needed (no cross-component client state beyond what React Query holds).
// Probably no Redux ever.
</code></pre>

<h3>Example 6: When to add Redux</h3>
<pre><code class="language-text">Signals that suggest Redux is the right answer:
  - 50+ engineers; need strong conventions
  - Cross-feature state shape with many entities (orders, products, users, addresses, ...)
  - Audit trail / time-travel debugging
  - Undo/redo across features
  - Existing Redux infrastructure that's working

Signals that suggest skip Redux:
  - 1-3 engineers
  - Mostly server-state
  - Mostly per-screen local state
  - No cross-cutting state shape
  - You've never asked "what was the action that caused this?"
</code></pre>

<h3>Example 7: When to add XState</h3>
<pre><code class="language-text">Signals that suggest XState:
  - State has clearly named modes (idle, loading, success, error, retrying...)
  - Transitions between modes follow specific rules
  - You've drawn the state diagram on a whiteboard before coding
  - Async work tied to specific states
  - Diagrams help PM/designer review the flow

Signals that suggest skip XState:
  - "States" are just data (counter, form fields)
  - Transitions are trivial (single boolean toggle)
  - Code is faster to write than the state machine config
  - Team unfamiliar; learning curve doesn't pay off for this feature
</code></pre>

<h3>Example 8: When to add a state library beyond useState</h3>
<pre><code class="language-text">Signals it's time:
  - State needs to be shared by 3+ unrelated components
  - Prop drilling 4+ levels
  - Multiple components need to write the same value
  - State should persist across mounts/unmounts in the same session
  - You're using Context with frequent updates and seeing re-render fan-out

Signals it's NOT time yet:
  - One component owns the state
  - 2-3 sibling components — lift to parent
  - State is rarely changed (theme, locale) — Context is fine
</code></pre>

<h3>Example 9: How to defend a tool choice in an interview</h3>
<pre><code class="language-text">Interviewer: "Why Zustand and not Redux?"
You: "For this app — small team, mostly server-side state with React Query, only ~5 cross-feature client values
       (auth, theme, sidebar collapsed, recent searches, locale) — Zustand's 1KB footprint and zero-boilerplate
       hooks fit. Redux's strength is whole-app conventions and time-travel debugging; we don't have an
       auditability requirement and the team is small enough to enforce conventions through code review.
       If we grow to 20+ engineers and the cross-feature state shape gets large, I'd revisit."

Interviewer: "Why XState here?"
You: "The checkout has 6 distinct phases (cart, review, shipping, payment, processing, confirmation) with
       specific transition rules — you can't go from cart to processing without going through review.
       Modeling this as a state machine makes the rules unambiguous and lets us visualize the flow.
       We'd also use the diagram for PM review."

Interviewer: "Why React Query and not Redux Toolkit Query?"
You: "We don't have Redux. RTK Query brings Redux infrastructure that we'd otherwise skip. React Query
       gives us the same caching, deduplication, and invalidation primitives without the Redux store."
</code></pre>

<h3>Example 10: Reverse — recognizing the wrong choice</h3>
<pre><code class="language-text">"Where would you change this design?"

Given:
  - Form values stored in Redux (input value as redux action per keystroke)
  - Modal open/close in Redux
  - Server data fetched manually with useEffect, stored in Redux
  - Theme stored in React Query

Wrong choices:
  - Form values in Redux: high-frequency action stream; should be useState
  - Modal in Redux: pure local UI; useState
  - Server data in Redux with manual fetch: should be React Query
  - Theme in React Query: theme isn't fetched; Zustand or Context

After fixes: Redux is mostly empty. Maybe Redux can go entirely.
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>"My team is migrating to React Query but the legacy Redux is huge"</h3>
<p>Don't migrate everything at once. Migrate one feature; verify cleanup; move on. Keep Redux for the rest. Coexistence is fine for years.</p>

<h3>"My state spans server AND client (e.g., draft posts)"</h3>
<p>Common in offline-first apps. Pattern:</p>
<ul>
  <li>Drafts live in Zustand (persisted) or React Query (with optimistic mutations).</li>
  <li>On send, mutate; React Query handles the cache.</li>
  <li>On reconnect, queued drafts flush.</li>
</ul>

<h3>"What if URL state and Zustand state diverge?"</h3>
<p>Pick one as source of truth. URL state is shareable; Zustand persists across sessions but isn't shareable. Don't store the same value in both — sync one to the other on mount, write to both on change is fragile.</p>

<h3>"Should auth token be in Zustand or React Query?"</h3>
<p>Zustand. Tokens are client state; they're not "fetched in the React-Query sense." React Query queries CAN include the token in headers via a base query interceptor that reads from Zustand.</p>

<h3>"Where do feature flags live?"</h3>
<table>
  <thead><tr><th>Feature flag source</th><th>Storage</th></tr></thead>
  <tbody>
    <tr><td>Statsig / LaunchDarkly / GrowthBook SDK</td><td>SDK's own store; integrate via custom hooks</td></tr>
    <tr><td>Backend-served flags</td><td>React Query (cache the flag response)</td></tr>
    <tr><td>Static / build-time flags</td><td>Constants module; no state needed</td></tr>
  </tbody>
</table>

<h3>"My useState is being shared via prop drilling"</h3>
<p>Lift to common parent. If &gt; 3 levels, promote to Zustand. Don't reach for global state at the first prop drill; props are fine for shallow trees.</p>

<h3>"I have a cart that's both local and synced"</h3>
<p>Cart pattern (anonymous → logged-in):</p>
<ol>
  <li>Anonymous: cart in Zustand persisted to local storage.</li>
  <li>On login: send local cart to server (merge); receive canonical cart.</li>
  <li>Logged in: cart is server state via React Query.</li>
  <li>Local Zustand cart cleared after migration.</li>
</ol>

<h3>"Should derived state be a Zustand selector or a React Query select function?"</h3>
<table>
  <thead><tr><th>Source</th><th>Use</th></tr></thead>
  <tbody>
    <tr><td>Derived from server data</td><td>React Query <code>select</code> option</td></tr>
    <tr><td>Derived from client state</td><td>Zustand selector / Jotai derived atom</td></tr>
    <tr><td>Mixed</td><td>useMemo combining both reads</td></tr>
  </tbody>
</table>

<h3>"My modal opens for an item; the item is server data"</h3>
<p>Modal-open flag and modal-target-id are local UI state. Detail data is server state.</p>
<pre><code class="language-tsx">const [openId, setOpenId] = useState&lt;string | null&gt;(null);
const { data } = useQuery({
  queryKey: ['user', openId],
  queryFn: () =&gt; fetchUser(openId!),
  enabled: !!openId,
});
</code></pre>

<h3>"My ESLint rule says no useState in a module"</h3>
<p>The rule is about a specific file (e.g., a "store" file should be in Zustand). Audit per file; if the file is a presentational component, useState is fine.</p>

<h3>"How do I avoid prop drilling without going global?"</h3>
<p>Three options:</p>
<ul>
  <li>Component composition — pass children, not data.</li>
  <li>Context for the specific subtree.</li>
  <li>Hook factory — a custom hook that internally subscribes.</li>
</ul>

<h3>"My state library doesn't support SSR / Server Components"</h3>
<p>For Server Components: client state libraries can only be used in client components. Categorize earlier — if it should run on the server, it's not "state" in the React Query / Zustand sense; it's data.</p>

<h3>"Different teams in my org use different libraries"</h3>
<p>Common in larger orgs. Standardize at the platform / framework level. Document conventions. Allow exceptions with rationale.</p>

<h3>"I want shared state, but only across one route"</h3>
<p>React Router supports route-scoped state via Outlet context, or you can use Zustand with a manual cleanup on route exit. Often easiest: useReducer at the route layout component.</p>

<h3>"My state library doesn't have a feature I need"</h3>
<p>Almost always, the feature exists somewhere — official plugin, community plugin, or a 5-line custom hook. Check before reaching for a different library.</p>

<h3>"My team can't agree on a state library"</h3>
<p>Pick one for the new code. Allow legacy code to stay. Have a brief, documented decision tree (this topic). Revisit in 6-12 months.</p>

<h3>"Is Context a state management library?"</h3>
<p>Sort of. Context is a transport mechanism, not a store. Pair Context with useState/useReducer for small, low-change values (theme, locale, current user). Don't use Context for high-frequency state — re-render fan-out kills perf.</p>

<h3>"Why not just use props for everything?"</h3>
<p>Props are perfect when the tree is shallow. Past 3-4 levels, prop drilling becomes painful and refactor-hostile. Hoisting state up creates new coupling. Global stores avoid both.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Server data in client store</h3>
<p>"We fetch users with useEffect and store in Redux." Causes manual loading flags, no cache, no dedupe, no invalidation, no retry. Migrate to React Query.</p>

<h3>Bug 2: UI flags in global store</h3>
<p>Modal open/close, hover, focus — local state. Putting in Zustand or Redux causes unnecessary fan-out and harder testing.</p>

<h3>Bug 3: Form state in global store</h3>
<p>Every keystroke dispatches an action; every component subscribed re-renders. Use react-hook-form, formik, or local useState. Form state is local.</p>

<h3>Bug 4: Two libraries holding the same data</h3>
<p>Auth token in Zustand AND in Redux. They drift. Pick one source of truth; the other reads from it.</p>

<h3>Bug 5: useReducer for trivial state</h3>
<p>One boolean — useState is fine. useReducer's overhead pays off at 3+ related fields.</p>

<h3>Bug 6: Redux just for "structure"</h3>
<p>Adding Redux to a small app for "organization" introduces 5x more code than the value gained. Smaller apps are cleaner without it.</p>

<h3>Bug 7: XState for trivial flows</h3>
<p>3 states, 2 transitions — useState/useReducer suffice. XState's verbosity pays off for 5+ states with branching.</p>

<h3>Bug 8: Context for high-frequency updates</h3>
<p>Mouse position in Context → all consumers re-render on every mouse-move. Use Zustand with a selector for high-frequency state.</p>

<h3>Bug 9: Promoting state to global "just in case"</h3>
<p>Speculative globalization. Each addition increases coupling and retraining cost. Promote when you have a real reason.</p>

<h3>Bug 10: Skipping URL state</h3>
<p>Filters in Zustand → "share this view" doesn't work. Browser back doesn't restore state. Page refresh resets. URL state for shareable / restorable filters.</p>

<h3>Anti-pattern 1: "Single state library" rule</h3>
<p>Mandating one library for everything in the codebase. Different categories of state want different tools. Mandate a decision tree, not a library.</p>

<h3>Anti-pattern 2: Migrating because of fashion</h3>
<p>"Everyone's using Zustand now, we should migrate." Working Redux code shouldn't be migrated for trends. Migrate when there's a real pain point.</p>

<h3>Anti-pattern 3: Building "the perfect store"</h3>
<p>Spending weeks on a state architecture diagram before writing any code. Start with useState; promote as needed. Architecture emerges; doesn't precede.</p>

<h3>Anti-pattern 4: Skipping the categorization step</h3>
<p>"How should we manage state?" → "Use Redux." A categorization step would have revealed the app is 80% server state, where Redux is the wrong default.</p>

<h3>Anti-pattern 5: Not understanding what each tool optimizes</h3>
<p>Picking Zustand because "it's simpler" without knowing why React Query exists is not a defensible choice. Defend each tool's role.</p>

<h3>Anti-pattern 6: Hidden state in third-party libraries</h3>
<p>react-navigation has its own state; react-hook-form has its own; some date pickers have their own. Don't try to mirror them in your store. They're tools that own their state.</p>

<h3>Anti-pattern 7: Context as a global store</h3>
<p>One giant Context with all app state. Re-render fan-out makes this slow. Either split into many narrow Contexts, or use a real store library.</p>

<h3>Anti-pattern 8: Manually re-implementing React Query</h3>
<p>"Our useFetch hook handles loading, error, data." That's React Query, but worse. Use the real thing.</p>

<h3>Anti-pattern 9: Mandate without flexibility</h3>
<p>"All cross-component state goes in Redux, period." But form state is also cross-component (parent + child interacting). Rules need exceptions; rules without judgment cause bugs.</p>

<h3>Anti-pattern 10: Underestimating the cost of state mistakes</h3>
<p>"We can refactor later" — state shapes are sticky. Bad early choices haunt you for years. Get the categorization right early.</p>
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
    <tr><td><em>How would you structure state for [given app]?</em></td><td>Categorize first: server, URL, local UI, cross-feature, behavioral.</td></tr>
    <tr><td><em>When use Redux?</em></td><td>Large enterprise apps; cross-feature state; audit / undo needs; existing Redux infra.</td></tr>
    <tr><td><em>Zustand vs Jotai?</em></td><td>Zustand: store-based. Jotai: atomic + derived. Both small; pick by mental model.</td></tr>
    <tr><td><em>When use XState?</em></td><td>Discrete modes with specific transitions; complex flows worth visualizing.</td></tr>
    <tr><td><em>When use React Query?</em></td><td>For all server state. Always.</td></tr>
    <tr><td><em>What's wrong with "Redux for everything"?</em></td><td>Different categories of state want different tools; one tool fits one category well, others poorly.</td></tr>
    <tr><td><em>How do tools coexist?</em></td><td>Most apps use 3-4 tools simultaneously, each with a clear domain.</td></tr>
    <tr><td><em>What about Context?</em></td><td>Transport mechanism, not a store. Good for low-change values; bad for high-frequency updates.</td></tr>
    <tr><td><em>What about useState / useReducer?</em></td><td>Local UI state; useReducer for &gt;3 related fields.</td></tr>
    <tr><td><em>How do you decide whether to promote local state to global?</em></td><td>3+ unrelated consumers, 4+ levels of prop drilling, persistence needs.</td></tr>
    <tr><td><em>How do you handle migration?</em></td><td>Incremental; one feature at a time; coexistence with legacy is fine.</td></tr>
    <tr><td><em>How do you defend a state library choice?</em></td><td>Categorize the state; pick the matching tool; explain trade-offs concretely.</td></tr>
  </tbody>
</table>

<h3>Live design prompts</h3>
<ol>
  <li><em>"Design the state for a Twitter clone."</em>
    <ul>
      <li>Tweets, timeline, profile, notifications: React Query.</li>
      <li>Compose-tweet draft, modal flags: useState.</li>
      <li>Auth token, current user (lightweight): Zustand.</li>
      <li>URL: thread ID, profile slug, notifications view.</li>
      <li>No XState (no complex behavioral flows in core feed).</li>
    </ul>
  </li>
  <li><em>"Design the state for an Uber-like ride request flow."</em>
    <ul>
      <li>Ride lifecycle: XState (idle / requesting / matched / picking-up / in-ride / completed / cancelled).</li>
      <li>Driver location, ETA: React Query (with refetchInterval) or WebSocket.</li>
      <li>Map markers, selected vehicle type: Zustand.</li>
      <li>Origin / destination: URL params or Zustand.</li>
    </ul>
  </li>
  <li><em>"Design the state for a Notion-like editor."</em>
    <ul>
      <li>Document content: complex; usually OT/CRDT-backed (Automerge, Yjs); not standard React state.</li>
      <li>Cursor position, selection: useState in editor component.</li>
      <li>Document list, sharing settings: React Query.</li>
      <li>Theme, sidebar collapsed, recent docs: Zustand.</li>
      <li>URL: workspace + document ID.</li>
    </ul>
  </li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>"Server data in Redux with manual loading flags" → React Query.</li>
  <li>"Form state in Zustand with per-keystroke updates" → useState / react-hook-form.</li>
  <li>"Modal open/close in Redux" → useState.</li>
  <li>"Filters in Zustand only, not in URL" → URL params for shareable views.</li>
  <li>"Auth token in React Query" → Zustand persisted (or Keychain on RN).</li>
  <li>"3-state flow modeled as nested booleans" → useReducer or XState.</li>
  <li>"All app state in Context" → re-render fan-out; switch to Zustand.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Categorization first</td><td>You volunteer the 5 categories before naming any library.</td></tr>
    <tr><td>Honest tool selection</td><td>Each choice has a defensible reason tied to specific properties.</td></tr>
    <tr><td>Coexistence awareness</td><td>You expect 3-4 tools per app; you don't push for "one tool".</td></tr>
    <tr><td>Anti-pattern recognition</td><td>You can spot misuse: server data in client store, UI flags in Redux, form state global.</td></tr>
    <tr><td>Migration pragmatism</td><td>You favor incremental over big-bang.</td></tr>
    <tr><td>Performance awareness</td><td>You know Context fan-out; you prefer Zustand for high-frequency.</td></tr>
    <tr><td>Trade-off articulation</td><td>You can defend why NOT to use each tool, not just why to use it.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>React Query + NetInfo + focusManager</strong> — non-negotiable on RN; the trio handles offline + refresh-on-foreground.</li>
  <li><strong>MMKV-backed Zustand persistence</strong> — preferred over AsyncStorage for cold-start speed.</li>
  <li><strong>XState for native flows</strong> — IAP purchase state, biometric auth, deep-link routing all map cleanly.</li>
  <li><strong>Bundle size</strong> — Zustand 1KB vs Redux+RTK 12KB+ matters more on mobile.</li>
  <li><strong>App lifecycle awareness</strong> — query refetching, machine timers all need pause/resume on background.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"What's the cost of getting state architecture wrong?"</em> — High. State shapes are sticky; refactoring across many components is expensive. Categorization upfront is cheap insurance.</li>
  <li><em>"When have you been wrong about a state choice?"</em> — Real interviews probe self-awareness. Have a story: "I put X in Redux when it should have been local; we paid the migration cost a year later."</li>
  <li><em>"Why not always use the most powerful tool?"</em> — Power has a cost: boilerplate, complexity, learning curve. The tool that fits is better than the tool that scales further.</li>
  <li><em>"What's the difference between Context and a state library?"</em> — Context is transport (passing values down). A state library is a store (centralized state with subscriptions). Pair Context with useState for transport; reach for a library for centralized concerns.</li>
  <li><em>"How would you migrate to a new state library?"</em> — Pick one feature; migrate; verify; release. Coexistence with legacy is fine. Big-bang migrations rarely succeed.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit current state placement against the 5 categories.</li>
  <li>Identify top 3 misplacements (e.g., server data in Redux, form state in global store).</li>
  <li>Document the team's decision tree (this topic) in the wiki.</li>
  <li>Pick one high-leverage migration; do it as a proof of value.</li>
  <li>Add ESLint rules for obvious smells (e.g., useEffect + setState pattern that should be React Query).</li>
  <li>Run a 30-min internal "state library review" — what each library is for, when to use, when not.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd build a small playground showing each library handling the same example so the team can compare."</li>
  <li>"I'd add a CI check that flags new <code>connect()</code> usage (legacy Redux) in favor of useSelector."</li>
  <li>"I'd profile re-render fan-out to validate which Context-based state should move to Zustand."</li>
  <li>"I'd refactor 1-2 high-touch features as exemplars of the new architecture."</li>
  <li>"I'd write a 'state architecture' chapter in our team's onboarding docs, referencing this decision tree."</li>
</ul>

<h3>Module summary</h3>
<p>State Management Deep covers:</p>
<ul>
  <li><strong>Redux + RTK + RTK Query</strong> — the enterprise default; powerful, verbose, well-trodden.</li>
  <li><strong>Zustand &amp; Jotai</strong> — modern minimalist; small bundles, ergonomic APIs.</li>
  <li><strong>XState</strong> — state machines; for behavioral state with specific transitions.</li>
  <li><strong>React Query</strong> — server state; the right home for fetched data.</li>
  <li><strong>Decision Tree</strong> (this topic) — categorize first, pick second.</li>
</ul>
<p>Master the categorization habit and the rest follows: each library becomes a tool with a clear job rather than a religion to subscribe to.</p>
`
    }
  ]
});
