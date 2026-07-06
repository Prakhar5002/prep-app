window.PREP_SITE.registerTopic({
  id: 'redux-rtk-query',
  module: 'redux',
  title: 'RTK Query',
  estimatedReadTime: '24 min',
  tags: ['redux', 'rtk-query', 'data-fetching', 'caching', 'server-state'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>RTK Query</strong> is the data-fetching and caching layer built into Redux Toolkit. Instead of hand-writing thunks, loading/error flags, and refetch-after-mutation logic for every resource, you describe <strong>endpoints</strong> — "here's how to fetch/mutate this data" — and RTK Query generates the reducer, the middleware, the cache, and a React hook for each endpoint.</p>
<ul>
  <li><strong>One call, everything included:</strong> <code>createApi({ baseQuery, endpoints })</code> returns a slice-like object plus auto-generated hooks like <code>useGetPostsQuery()</code> and <code>useAddPostMutation()</code> — no action creators or reducer cases to write by hand.</li>
  <li><strong>It's a cache, not just a fetcher.</strong> Two components calling the same query with the same arguments share one cached entry and one in-flight request — no duplicate network calls, and <code>isLoading</code>/<code>isFetching</code>/<code>error</code> come for free from the hook.</li>
  <li><strong>Cache invalidation is declarative.</strong> Queries say what data they <em>provide</em> (<code>providesTags</code>); mutations say what they <em>invalidate</em> (<code>invalidatesTags</code>). Any query holding an invalidated tag refetches automatically — you never manually call "refetch the list" after an add/edit/delete.</li>
  <li><strong>It's for <em>server</em> state, not client state.</strong> RTK Query exists because data fetched from a server (a list of posts, a user profile) behaves nothing like local UI state — it can go stale, be needed by multiple components, and require dedup/caching/invalidation. <a href="#/topic/redux-core">Plain Redux slices</a> (from <a href="#/topic/redux-core">Why Redux &amp; Core Concepts</a>) are still the right tool for actual client state — theme, form drafts, whether a modal is open.</li>
  <li><strong>Where it sits in this module:</strong> builds directly on <a href="#/topic/redux-core">the store/action/reducer loop</a> and RTK's <code>createSlice</code> — an <code>api</code> object is really just a specialized slice + middleware that RTK Query generates for you. Next up: <a href="#/topic/redux-middleware-async">Middleware &amp; Async</a>, which covers what's actually happening under the hood when RTK Query dispatches all of this.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The problem: fetching data by hand in Redux</h3>
<p>Before RTK Query, the standard way to fetch server data into a Redux store was <code>createAsyncThunk</code> plus a slice that tracked loading state by hand:</p>
<pre><code class="language-js">// The "before" picture — hand-rolled async fetching, one resource at a time
export const fetchPosts = createAsyncThunk('posts/fetchAll', async () => {
  const res = await fetch('/api/posts');
  return res.json();
});

const postsSlice = createSlice({
  name: 'posts',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});</code></pre>
<p>That's a lot of ceremony to fetch one list. And it only gets worse from here:</p>
<ul>
  <li><strong>It repeats per resource.</strong> Posts, users, comments — each one needs its own thunk, its own <code>status</code>/<code>error</code>/<code>items</code> fields, its own three <code>extraReducers</code> cases. It's the same shape every time, hand-copied.</li>
  <li><strong>There's no caching or dedup.</strong> If two components both need the posts list, either one fetches (and the other waits, coordinating manually) or both fire the same request. Nothing here remembers "we already have this data, don't refetch it."</li>
  <li><strong>Invalidation is manual and easy to forget.</strong> After <code>addPost</code> succeeds, something has to remember to also dispatch <code>fetchPosts</code> again so the list reflects the new post. That's a second thing to wire up per mutation, and it's exactly the kind of cross-cutting concern that gets missed in a big codebase.</li>
</ul>

<h3>Server state is a different problem than client state</h3>
<p>The deeper issue is a category mismatch. Redux slices are built for <strong>client state</strong> — state that only exists on the client and that <em>you</em> are the source of truth for (a toggle, a form draft, a selected tab). Data fetched from a server is <strong>server state</strong>: the real source of truth lives elsewhere, your copy is a cache that can go stale, might be needed by several components, and needs to be fetched, de-duplicated, invalidated, and re-fetched — none of which a plain reducer is designed to do.</p>
<p>RTK Query's answer is to stop modeling server data as "state you update" and start modeling it as <strong>endpoints you describe</strong>: "here's how to fetch this," "here's how to change it," "here's what it provides and what invalidates it." From that description, RTK Query generates the reducer, the middleware that actually performs requests and manages cache lifetimes, and a hook per endpoint that gives you <code>data</code>/<code>isLoading</code>/<code>error</code> without a single <code>extraReducers</code> case in sight.</p>

<div class="callout insight">
  <div class="callout-title">🧠 One-liner</div>
  <p>RTK Query doesn't add a new concept to Redux — it recognizes that server data is a different <em>kind</em> of state than client state, and auto-generates the slice-and-thunk machinery you'd otherwise write by hand for every single resource.</p>
</div>

<h3>Honest talk: RTK Query isn't the only option</h3>
<p>If you're not already in a Redux codebase, a standalone server-state library like <a href="https://tanstack.com/query">TanStack Query</a> gets you the same caching/dedup/invalidation model without requiring a Redux store at all. RTK Query's specific advantage is that it plugs into a store you already have and shares DevTools, middleware, and the rest of the Redux ecosystem. The comparison is covered in depth in <a href="#interview-patterns">Interview Patterns</a> below — the short version is: both are valid, reach for whichever matches whether you already have Redux.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>An <code>api</code> object is a self-contained slice + middleware</h3>
<p>Calling <code>createApi({ baseQuery, endpoints })</code> once produces a single object with everything wired together:</p>
<ul>
  <li><strong><code>reducerPath</code></strong> — a string key (e.g. <code>'postsApi'</code>) under which this API's cache lives in the store.</li>
  <li><strong><code>reducer</code></strong> — the actual reducer function, mounted at <code>reducerPath</code>, that holds every cached query result.</li>
  <li><strong><code>middleware</code></strong> — intercepts the actions RTK Query dispatches internally and is what actually performs fetches, manages cache lifetimes/timers, and handles refetch-on-focus/reconnect.</li>
  <li><strong>One hook per endpoint</strong> — <code>useGetPostsQuery</code>, <code>useAddPostMutation</code>, etc. — generated automatically from the endpoint names you defined.</li>
</ul>
<p>You still only have <em>one</em> store, and RTK Query state still flows through the exact same dispatch → reducer → subscriber loop from <a href="#/topic/redux-core">Why Redux &amp; Core Concepts</a>. The difference is that instead of writing that loop's pieces by hand, you describe endpoints and RTK Query writes them for you.</p>

<h3>The cache: keyed by endpoint + serialized arguments</h3>
<p>Every query result is stored under a cache key built from the endpoint name and its arguments — conceptually <code>getPost(5)</code> and <code>getPost(6)</code> are two <em>separate</em> cache entries, while two components both calling <code>useGetPostQuery(5)</code> share the exact same one (one request, one cached value, both components re-render off the same data).</p>
<pre><code class="language-text">┌───────────────┐  useGetPostQuery(5) ┌──────────────────────────┐
│  PostDetail A │ ──────────────────► │   cache["getPost(5)"]    │
└───────────────┘                     │  (fetched once, shared)  │
┌───────────────┐  useGetPostQuery(5) │                          │
│  PostDetail B │ ──────────────────► │                          │
└───────────────┘                     └──────────────────────────┘
</code></pre>
<p>Arguments are serialized to build that key — passed as a plain object, <code>{ id: 5, sort: 'new' }</code> and <code>{ sort: 'new', id: 5 }</code> produce the <em>same</em> key (RTK Query sorts object keys before serializing), so argument order never accidentally creates duplicate cache entries. But a function, a class instance, or anything else non-serializable in the args breaks that guarantee — more on this in <a href="#edge-cases">Edge Cases</a>.</p>

<h3>Tags: how the cache knows what to invalidate</h3>
<p>The other half of the mental model is the <strong>tag system</strong>, which is how RTK Query answers "a mutation just happened — which cached queries are now stale?" without you manually calling refetch:</p>
<ul>
  <li>A query endpoint declares, via <code>providesTags</code>, what data its result <em>represents</em> — e.g. "this result <em>is</em> <code>Post</code> data."</li>
  <li>A mutation endpoint declares, via <code>invalidatesTags</code>, what data it <em>changed</em> — e.g. "this mutation <em>invalidates</em> <code>Post</code> data."</li>
  <li>When a mutation succeeds, RTK Query looks at every currently-cached query that provided a now-invalidated tag, and automatically refetches it.</li>
</ul>
<pre><code class="language-text">useAddPostMutation() succeeds
        │  invalidatesTags: [{ type: 'Post', id: 'LIST' }]
        ▼
RTK Query scans the cache for queries that provided { type: 'Post', id: 'LIST' }
        │
        ▼
useGetPostsQuery() provided that tag → automatically refetches
        │
        ▼
Every component subscribed via useGetPostsQuery() re-renders with fresh data
</code></pre>
<div class="callout insight">
  <div class="callout-title">🔥 Key insight</div>
  <p>You never dispatch "refetch the posts list" yourself. You declare, once, <em>what each endpoint provides</em> and <em>what each mutation invalidates</em> — RTK Query's middleware connects those declarations and triggers refetches for you, for the lifetime of the app.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3><code>createApi</code>: defining the whole API in one place</h3>
<pre><code class="language-js">import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post'], // declare every tag "type" this API will use
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => '/posts', // GET /api/posts
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Post', id })), { type: 'Post', id: 'LIST' }]
          : [{ type: 'Post', id: 'LIST' }],
    }),
    getPost: builder.query({
      query: (id) => \`/posts/\${id}\`, // GET /api/posts/:id
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    addPost: builder.mutation({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
  }),
});

// Auto-generated — one hook per endpoint, named useEndpointNameQuery/Mutation
export const { useGetPostsQuery, useGetPostQuery, useAddPostMutation } = postsApi;</code></pre>
<p>Import from <code>@reduxjs/toolkit/query/react</code> (not the plain <code>@reduxjs/toolkit/query</code> entry point) to get the React-hook-generating version of <code>createApi</code>. <code>fetchBaseQuery</code> is a thin wrapper over <code>fetch</code> — set a shared <code>baseUrl</code>, headers, and (optionally) auth logic once, and every endpoint's <code>query</code> just returns a relative path or a request-config object.</p>

<h3>Query endpoints vs. mutation endpoints</h3>
<ul>
  <li><strong><code>builder.query(...)</code></strong> — for reads. Its <code>query</code> function takes the hook's argument and returns either a URL string (GET) or a request object like <code>{ url, method, params }</code>. Its result is cached.</li>
  <li><strong><code>builder.mutation(...)</code></strong> — for writes (POST/PATCH/PUT/DELETE). Its <code>query</code> function typically returns <code>{ url, method, body }</code>. Mutations aren't cached the way queries are — they run once per call and are the usual trigger for tag invalidation.</li>
</ul>

<h3>Auto-generated hooks</h3>
<p>RTK Query names hooks by convention: <code>get&lt;Name&gt;</code> → <code>useGet&lt;Name&gt;Query</code>, <code>add&lt;Name&gt;</code> → <code>useAdd&lt;Name&gt;Mutation</code>. Query hooks return <code>data</code>, and <code>isLoading</code>/<code>isFetching</code>/<code>isError</code>/<code>error</code> flags, and re-run automatically when their arguments change. Mutation hooks return a <code>[trigger, result]</code> tuple — calling <code>trigger(arg)</code> fires the request and returns a promise you can <code>.unwrap()</code> to get the raw payload or throw the raw error (handy for <code>try/catch</code> in a submit handler, instead of reading the mutation's <code>error</code> field).</p>

<h3>Tag invalidation, in full: the <code>LIST</code> bulk pattern</h3>
<p>Notice <code>getPosts</code> above provides both a tag <em>per item</em> (<code>{ type: 'Post', id: 5 }</code>) <em>and</em> one shared tag for the whole collection (<code>{ type: 'Post', id: 'LIST' }</code>). <code>'LIST'</code> here is just a conventional, arbitrary id — RTK Query doesn't treat it specially, but using it consistently gives you a clean way to say "invalidate the whole collection" without listing every individual item id:</p>
<ul>
  <li><strong>Adding</strong> a post can't invalidate a specific item id (it didn't exist yet) — it invalidates <code>{ type: 'Post', id: 'LIST' }</code>, so any query that provided that bulk tag (i.e. <code>getPosts</code>) refetches.</li>
  <li><strong>Updating/deleting</strong> a specific post invalidates <em>that</em> item's tag (<code>{ type: 'Post', id }</code>) — so a <code>getPost(id)</code> cache entry for that one post refetches, without needlessly refetching the whole list.</li>
</ul>

<h3><code>keepUnusedDataFor</code>: how long unused cache entries stick around</h3>
<p>When the last component unsubscribes from a query (e.g. it unmounts), RTK Query doesn't drop the cached data immediately — it keeps it for <code>keepUnusedDataFor</code> seconds (default <strong>60</strong>) in case another component asks for the same data soon. Set it per-endpoint or globally on <code>createApi</code> when a resource is cheap to refetch (lower it) or expensive/rarely-changing (raise it).</p>

<h3>Refetch triggers</h3>
<ul>
  <li><strong><code>refetchOnMountOrArgChange</code></strong> — refetch when a component mounts (or arguments change) even if a cached value exists, instead of always serving the cache.</li>
  <li><strong><code>refetchOnFocus</code> / <code>refetchOnReconnect</code></strong> — refetch active queries when the browser window regains focus, or when the network reconnects. Both require calling <code>setupListeners(store.dispatch)</code> once (see store wiring below) — without it, these are no-ops.</li>
  <li><strong><code>pollingInterval</code></strong> — pass to a query hook to refetch on a fixed interval, for near-real-time data without a websocket.</li>
</ul>

<h3>Store wiring: <code>reducerPath</code>, <code>middleware</code>, <code>setupListeners</code></h3>
<pre><code class="language-js">import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { postsApi } from './postsApi';

export const store = configureStore({
  reducer: {
    [postsApi.reducerPath]: postsApi.reducer, // mount the generated cache reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(postsApi.middleware), // enables caching, invalidation, polling, etc.
});

// Enables refetchOnFocus / refetchOnReconnect app-wide
setupListeners(store.dispatch);</code></pre>
<p>Skipping <code>postsApi.middleware</code> is a common mistake: without it in the store, requests are never actually dispatched/executed and cache lifetimes are never managed — the hooks will look wired up but nothing will fetch.</p>

<h3>Optimistic updates: <code>onQueryStarted</code> + <code>updateQueryData</code></h3>
<p>By default a mutation waits for the server response before the UI reflects the change. For interactions that should feel instant (liking a post, toggling a checkbox), you can update the cache immediately and roll back if the request fails:</p>
<pre><code class="language-js">updatePost: builder.mutation({
  query: ({ id, ...patch }) => ({ url: \`/posts/\${id}\`, method: 'PATCH', body: patch }),
  async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
    // Write directly into the cached "getPost" entry for this id, right away —
    // updateQueryData uses Immer, so this "mutating" draft syntax is safe.
    const patchResult = dispatch(
      postsApi.util.updateQueryData('getPost', id, (draft) => {
        Object.assign(draft, patch);
      })
    );
    try {
      await queryFulfilled; // resolves/rejects with the real request outcome
    } catch {
      patchResult.undo(); // request failed — roll the optimistic edit back
    }
  },
  invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
}),</code></pre>
<p><code>onQueryStarted</code> fires as soon as the mutation is triggered — before the network request resolves. <code>dispatch(api.util.updateQueryData(endpointName, args, recipe))</code> patches an already-cached entry for that specific endpoint+args pair (it can't create a new cache entry) and returns a patch object with an <code>.undo()</code> escape hatch. <code>queryFulfilled</code> is a promise that settles once the real request finishes — awaiting it (and catching its rejection) is what lets you decide whether to keep the optimistic edit or revert it.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Posts list + add, with tag invalidation</h3>
<pre><code class="language-js">// postsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post'],
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => '/posts',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Post', id })), { type: 'Post', id: 'LIST' }]
          : [{ type: 'Post', id: 'LIST' }],
    }),
    addPost: builder.mutation({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
  }),
});

export const { useGetPostsQuery, useAddPostMutation } = postsApi;</code></pre>
<pre><code class="language-jsx">function PostsList() {
  const { data: posts, isLoading, isError } = useGetPostsQuery();
  const [addPost, { isLoading: isAdding }] = useAddPostMutation();

  if (isLoading) return &lt;p&gt;Loading posts…&lt;/p&gt;;
  if (isError) return &lt;p&gt;Failed to load posts.&lt;/p&gt;;

  const handleAdd = async () => {
    try {
      await addPost({ title: 'New post', body: '...' }).unwrap();
      // No manual refetch here — addPost's invalidatesTags triggers it automatically.
    } catch (err) {
      console.error('Failed to add post', err);
    }
  };

  return (
    &lt;div&gt;
      &lt;button onClick={handleAdd} disabled={isAdding}&gt;Add post&lt;/button&gt;
      &lt;ul&gt;
        {posts.map((post) => (
          &lt;li key={post.id}&gt;{post.title}&lt;/li&gt;
        ))}
      &lt;/ul&gt;
    &lt;/div&gt;
  );
}</code></pre>
<p>Walk through what happens on "Add post": <code>addPost(...)</code> fires the mutation → server responds → <code>invalidatesTags: [{ type: 'Post', id: 'LIST' }]</code> runs → RTK Query notices <code>getPosts</code> (still mounted, subscribed via this component's <code>useGetPostsQuery()</code>) provided that exact tag → it refetches automatically → <code>posts</code> updates and the list re-renders with the new post. Nothing in <code>handleAdd</code> mentions refetching — that's the whole point of the tag system.</p>

<h3>Example 2 — Optimistic "like" toggle</h3>
<pre><code class="language-js">// Added to postsApi's endpoints:
toggleLike: builder.mutation({
  query: (id) => ({ url: \`/posts/\${id}/like\`, method: 'POST' }),
  async onQueryStarted(id, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      postsApi.util.updateQueryData('getPost', id, (draft) => {
        draft.liked = !draft.liked;
        draft.likeCount += draft.liked ? 1 : -1;
      })
    );
    try {
      await queryFulfilled;
    } catch {
      patchResult.undo(); // server rejected the like — snap the UI back
    }
  },
}),</code></pre>
<pre><code class="language-jsx">function LikeButton({ postId }) {
  const { data: post } = useGetPostQuery(postId);
  const [toggleLike] = useToggleLikeMutation();

  return (
    &lt;button onClick={() => toggleLike(postId)}&gt;
      {post.liked ? '♥' : '♡'} {post.likeCount}
    &lt;/button&gt;
  );
}</code></pre>
<p>The heart icon and count flip the instant the button is clicked — <code>updateQueryData</code> writes straight into the cached <code>getPost(postId)</code> entry before the network request even resolves. If the request fails, <code>patchResult.undo()</code> reverts the cache to exactly what it was before the optimistic edit, and the UI snaps back — the user sees an instant response in the common case, with a correct rollback in the rare failure case.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3>Over-granular tags at scale</h3>
<p>Tagging every single item individually works fine at hundreds of rows, but tagging (and invalidating) 10,000 individual item tags on every list fetch is wasteful — RTK Query has to track and compare all of them. Prefer the <code>LIST</code> bulk-tag pattern from <a href="#mechanics">Mechanics</a> for "the whole collection changed" cases (adds, filters, bulk deletes), and reserve per-item tags for mutations that genuinely target one row (a single edit/delete). Mixing both, as in the worked examples, is the normal and recommended approach — the mistake is invalidating every item tag when only the bulk tag was needed.</p>

<h3>Cache keys depend on serializable arguments</h3>
<p>RTK Query builds a cache key from the endpoint name plus its arguments, serialized to a stable string (object keys are sorted first, so <code>{ id: 5, sort: 'new' }</code> and <code>{ sort: 'new', id: 5 }</code> correctly hit the same cache entry). But passing something non-serializable as an argument — a function, a class instance, a <code>Map</code>/<code>Set</code>, a DOM node — breaks that guarantee: it may serialize inconsistently (or fail to serialize meaningfully at all), producing cache keys that don't match when you expect them to, or a growing pile of "unique" cache entries that never get reused. Keep query arguments to plain, JSON-serializable values — the same discipline plain Redux state relies on.</p>

<h3>Mixing RTK Query with hand-written slices</h3>
<pre><code class="language-js">// ❌ duplicating server data into a manual slice alongside the RTK Query cache
const postsSlice = createSlice({
  name: 'posts',
  initialState: { items: [] }, // ...now there are TWO copies of "posts" in the store
  reducers: {
    setPosts: (state, action) => { state.items = action.payload; },
  },
});</code></pre>
<p>Once an <code>api</code> slice owns a resource, avoid also mirroring that same data into a separate hand-written slice "for convenience" (e.g. to add a derived field). That creates two sources of truth that can drift out of sync — the RTK Query cache updates on its own schedule (refetch, invalidation, optimistic patches), and nothing keeps a manually-synced copy in step with it. If you need derived data from a query result, compute it in a selector or in the component, not by copying the query's data into a second slice.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">RTK Query vs. <code>createAsyncThunk</code> — when would you use each?</div>
<div class="qa-a">
<p><code>createAsyncThunk</code> gives you a dispatchable async action and three lifecycle action types (<code>pending</code>/<code>fulfilled</code>/<code>rejected</code>) — you still write the slice, the <code>status</code>/<code>error</code>/<code>data</code> fields, and any refetch-after-mutation logic yourself. RTK Query is built <em>on top of</em> that same async-middleware idea, but for the common "fetch and cache server data" case specifically: you describe endpoints, and it generates the reducer, request de-duplication, cache invalidation via tags, and a hook per endpoint. Use <code>createAsyncThunk</code> directly for one-off async logic that isn't really a cache (e.g. "submit this form once"); use RTK Query for anything that's fundamentally "fetch this resource, keep it fresh, refetch when it changes."</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How does RTK Query's tag-based invalidation actually work?</div>
<div class="qa-a">
<p>Every query endpoint declares, via <code>providesTags</code>, which tags its cached result represents. Every mutation endpoint declares, via <code>invalidatesTags</code>, which tags it changed. When a mutation succeeds, RTK Query's middleware looks at every currently-cached query result that provided a tag the mutation just invalidated, and refetches those specifically — nothing else. The common refinement is the <code>{ type, id: 'LIST' }</code> convention: list-fetching queries provide a shared "LIST" tag plus one tag per item; "add" mutations invalidate just the LIST tag (a new item can't have an id to target yet), while "update"/"delete" mutations invalidate the specific item's tag, so only the queries that actually need fresh data refetch.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">RTK Query vs. TanStack Query (React Query) — which would you pick?</div>
<div class="qa-a">
<p>Both solve the same core problem — caching, de-duping, and invalidating server state — and both are reasonable, current (2026) choices; this isn't a "one is outdated" comparison. The deciding factor is usually whether Redux is already in the app: if you already have a Redux store, RTK Query shares its DevTools, middleware pipeline, and store with the rest of your app's state at no extra cost. If you don't already use Redux, pulling in RTK Query just to get server-state caching means adopting a store you otherwise wouldn't need — TanStack Query gives you the same caching model as a standalone library with no Redux dependency. In short: RTK Query if you're already in Redux, TanStack Query otherwise.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How would you implement an optimistic update in RTK Query?</div>
<div class="qa-a">
<p>In the mutation's <code>onQueryStarted</code> callback (which fires as soon as the mutation is triggered, before the network request resolves), dispatch <code>api.util.updateQueryData(endpointName, args, recipe)</code> to write the expected change directly into the relevant cached query entry — the recipe uses Immer, so you can "mutate" a draft safely. That dispatch returns a patch object with an <code>.undo()</code> method. Then <code>await queryFulfilled</code> (a promise that settles once the real request completes) inside a <code>try/catch</code>: if it rejects, call <code>patchResult.undo()</code> to roll the cache back to its pre-optimistic state. The net effect is the UI updates instantly, with an automatic rollback if the server ultimately rejects the change.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Two components call the same query hook with the same arguments — how many network requests happen?</div>
<div class="qa-a">
<p>One. RTK Query keys its cache by endpoint name plus serialized arguments, so both components subscribe to the exact same cache entry — the first one to mount triggers the fetch, the second one gets served the same in-flight request (or the already-resolved cached value) with no duplicate call. This is a large part of what makes RTK Query more than "a fetch wrapped in a thunk": the cache is shared across every consumer of that query, not per-component.</p>
</div>
</div>
`}

]});
