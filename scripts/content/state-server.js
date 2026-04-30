window.PREP_SITE.registerTopic({
  id: 'state-server',
  module: 'state-deep',
  title: 'Server State (React Query)',
  estimatedReadTime: '45 min',
  tags: ['react-query', 'tanstack-query', 'server-state', 'cache', 'mutations', 'optimistic-update', 'pagination', 'infinite-scroll', 'react-native'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Server state</strong> is a fundamentally different beast from client state — it's owned by a remote source, can become stale, supports out-of-band updates, and needs caching, deduplication, retries, and invalidation. <strong>TanStack Query</strong> (formerly React Query) is the de facto library for managing it. Once you adopt it, you stop hand-rolling loading flags and start thinking in queries and mutations.</p>
<ul>
  <li><strong>Two primitives:</strong> <em>queries</em> (read; cached by key) and <em>mutations</em> (write; can invalidate queries).</li>
  <li><strong>Cache key = source of identity.</strong> Same key → same cache entry; different key → independent fetch.</li>
  <li><strong>Stale-while-revalidate</strong> by default: cached data served immediately; background refetch updates.</li>
  <li><strong>Deduplication:</strong> 5 components asking for <code>users/123</code> at the same time → one fetch.</li>
  <li><strong>Auto-refetch</strong> on window focus, network reconnect, mount, configurable interval (polling).</li>
  <li><strong>Mutations</strong> can invalidate keys, optimistically update cache, rollback on failure.</li>
  <li><strong>The shift in mindset:</strong> server state isn't "your" state — it's a <em>cache</em> of a remote source. Stop owning it; start syncing it.</li>
  <li><strong>Common alternatives:</strong> SWR (Vercel — leaner, similar API), Apollo Client (GraphQL), urql, RTK Query (if you're in Redux).</li>
</ul>
<p><strong>Mantra:</strong> "Server state is a cache. Use queries for reads, mutations for writes, invalidate on success. Don't store fetched data in your client store."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The fundamental insight</h3>
<p>Around 2018-2020, the React community realized: most "Redux state" was actually <em>copies of server data</em>. Client state (UI flags, form values) was small; server state (lists, profiles, cached responses) was large. Treating both with the same tool (Redux) was the wrong abstraction.</p>

<p>Server state has properties client state doesn't:</p>
<table>
  <thead><tr><th>Property</th><th>Client state</th><th>Server state</th></tr></thead>
  <tbody>
    <tr><td>Source of truth</td><td>Local app</td><td>Remote server</td></tr>
    <tr><td>Becomes stale</td><td>No</td><td>Yes</td></tr>
    <tr><td>Out-of-band updates</td><td>No</td><td>Yes (other users, server jobs)</td></tr>
    <tr><td>Loading / error states</td><td>Rare</td><td>Per fetch</td></tr>
    <tr><td>Pagination / infinite scroll</td><td>N/A</td><td>Common</td></tr>
    <tr><td>Background refetch</td><td>N/A</td><td>Often desired</td></tr>
    <tr><td>Retry on failure</td><td>N/A</td><td>Common</td></tr>
  </tbody>
</table>

<h3>What React Query / TanStack Query gives you</h3>
<ol>
  <li><strong>Cache</strong> keyed by query key; entries shared across components.</li>
  <li><strong>Stale-while-revalidate:</strong> show cached data instantly while refreshing in the background.</li>
  <li><strong>Deduplication:</strong> simultaneous requests for the same key collapse to one network call.</li>
  <li><strong>Auto-refetch</strong> on focus, reconnect, mount; configurable.</li>
  <li><strong>Loading / error / data shape</strong> from one hook; no manual flags.</li>
  <li><strong>Mutations</strong> with built-in optimistic updates and rollback.</li>
  <li><strong>Pagination + infinite scroll</strong> primitives.</li>
  <li><strong>DevTools</strong> — inspect cache, queries, mutations.</li>
  <li><strong>Suspense</strong> support for loading states.</li>
  <li><strong>Persistence</strong> via plugins (offline-first apps).</li>
</ol>

<h3>The library landscape</h3>
<table>
  <thead><tr><th>Library</th><th>Niche</th></tr></thead>
  <tbody>
    <tr><td><strong>TanStack Query</strong> (formerly React Query)</td><td>The default. Framework-agnostic core; React/RN/Vue/Solid bindings.</td></tr>
    <tr><td><strong>SWR</strong> (Vercel)</td><td>Smaller surface; minimal API; tightly integrated with Next.js.</td></tr>
    <tr><td><strong>Apollo Client</strong></td><td>GraphQL-first; normalized cache; subscriptions.</td></tr>
    <tr><td><strong>urql</strong></td><td>Lighter GraphQL alternative.</td></tr>
    <tr><td><strong>RTK Query</strong></td><td>Native to Redux; tag-based invalidation; codegen.</td></tr>
    <tr><td><strong>tRPC + React Query</strong></td><td>End-to-end TypeScript on top of React Query.</td></tr>
  </tbody>
</table>

<h3>When NOT to use</h3>
<ul>
  <li>If you're already deep in Redux and have RTK Query, don't migrate.</li>
  <li>If you're using GraphQL with Apollo or urql and they fit, don't add a second cache.</li>
  <li>For purely local data, you don't need any server-state library.</li>
  <li>If the data is tiny and only fetched once at app start (e.g., feature flags), a simple <code>useEffect</code> + state is fine.</li>
</ul>

<h3>Why interviewers ask</h3>
<ol>
  <li>Server state is the largest category of "where state goes wrong" in production apps.</li>
  <li>Tests architectural reasoning: "what state lives where?"</li>
  <li>Tests cache invalidation literacy ("the second hardest thing in CS").</li>
  <li>Mobile-relevant: offline support, persistence, retry behavior matter especially.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>Every fetched data lives in React Query, not in Redux/Zustand.</li>
  <li>Query keys are typed, descriptive arrays: <code>['user', userId]</code>.</li>
  <li>Mutations invalidate exactly the affected queries.</li>
  <li>Optimistic updates with rollback on failure.</li>
  <li>StaleTime / cacheTime are tuned per query (not always default).</li>
  <li>Pagination uses <code>useInfiniteQuery</code> or cursor-based handling.</li>
  <li>For offline-first apps, persistence + retry strategies are configured.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The query lifecycle</h3>
<pre><code class="language-text">Component mounts → useQuery(key, fn)
                       │
                       ▼
              Cache hit?
                 │      │
              yes│      │no
                 ▼      ▼
            return    fetch → store in cache
            cached      │
            data        ▼
              │     return data
              ▼
       data is "fresh"?
              │
              │ yes → done
              │
              │ no (stale) → refetch in background
                              │
                              ▼
                      update cache
                              │
                              ▼
                  re-render subscribers
</code></pre>

<h3>Query state shape</h3>
<pre><code class="language-ts">const { data, isLoading, isError, isFetching, error, refetch, status } = useQuery(...);

// status: 'pending' | 'error' | 'success'
// isLoading: true on initial fetch (status === 'pending' &amp;&amp; no data yet)
// isFetching: true during ANY fetch (initial OR background refetch)
</code></pre>

<h3>Stale vs cached</h3>
<table>
  <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><strong>Cached</strong></td><td>Held in memory by the cache. Default <code>cacheTime</code> = 5 min after last subscription.</td></tr>
    <tr><td><strong>Stale</strong></td><td>"Old enough to refetch when next observed." Default <code>staleTime</code> = 0 (always stale).</td></tr>
    <tr><td><strong>Fresh</strong></td><td>Within <code>staleTime</code>; not refetched automatically.</td></tr>
  </tbody>
</table>

<h3>Tuning staleTime and cacheTime (gcTime in v5)</h3>
<pre><code class="language-ts">// Default: staleTime: 0, cacheTime: 5 min — re-fetches on every mount/focus
useQuery({
  queryKey: ['user', id],
  queryFn: fetchUser,
  staleTime: 60_000,        // fresh for 1 minute
  gcTime: 30 * 60_000,      // keep in cache for 30 min after unused
});

// For data that rarely changes:
staleTime: Infinity         // never stale; only refetch when explicitly invalidated

// For real-time data:
staleTime: 0,
refetchInterval: 5_000      // poll every 5 seconds
</code></pre>

<h3>Mutation lifecycle</h3>
<pre><code class="language-ts">const { mutate, mutateAsync, isPending, isError, isSuccess } = useMutation({
  mutationFn: updateUser,
  onMutate: (variables) =&gt; {
    // Optimistic update; runs before mutationFn
  },
  onSuccess: (data, variables) =&gt; {
    // Network call succeeded
    queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
  },
  onError: (error, variables, context) =&gt; {
    // Rollback optimistic update
  },
  onSettled: () =&gt; {
    // Runs always — success or error
  },
});

mutate({ id: 'u1', name: 'New Name' });
</code></pre>

<h3>Cache invalidation</h3>
<table>
  <thead><tr><th>Approach</th><th>What happens</th></tr></thead>
  <tbody>
    <tr><td><code>invalidateQueries({ queryKey: ['users'] })</code></td><td>Marks all <code>['users', ...]</code> queries stale; refetches active ones.</td></tr>
    <tr><td><code>setQueryData(key, newData)</code></td><td>Manually update cache without fetching.</td></tr>
    <tr><td><code>refetchQueries({ queryKey: ['users'] })</code></td><td>Force refetch even if not stale.</td></tr>
    <tr><td><code>removeQueries({ queryKey: ['users'] })</code></td><td>Drop from cache entirely.</td></tr>
  </tbody>
</table>

<h3>Query keys are paths</h3>
<pre><code class="language-ts">['users']                             // all users list
['users', id]                          // one user
['users', id, 'posts']                 // user's posts
['users', { filter: 'active' }]        // users with filter
['posts', { page: 2, limit: 20 }]      // paginated posts

// Invalidation can be partial:
invalidateQueries({ queryKey: ['users'] })           // matches all of the above
invalidateQueries({ queryKey: ['users', id] })       // matches user-specific only
</code></pre>

<h3>The "shape of fetching" question</h3>
<table>
  <thead><tr><th>Fetching shape</th><th>Use</th></tr></thead>
  <tbody>
    <tr><td>Single resource by ID</td><td><code>useQuery({ queryKey: ['user', id], queryFn: ... })</code></td></tr>
    <tr><td>List of items</td><td><code>useQuery({ queryKey: ['users'], queryFn: ... })</code></td></tr>
    <tr><td>Paginated list</td><td><code>useQuery({ queryKey: ['users', { page }], queryFn: ... })</code></td></tr>
    <tr><td>Infinite scroll</td><td><code>useInfiniteQuery</code></td></tr>
    <tr><td>Polling</td><td><code>refetchInterval</code></td></tr>
    <tr><td>Conditional fetch</td><td><code>enabled</code> flag</td></tr>
    <tr><td>Dependent queries</td><td>Use one query's result as another's <code>enabled</code></td></tr>
    <tr><td>Parallel queries</td><td>Multiple <code>useQuery</code> calls; or <code>useQueries</code> for dynamic count</td></tr>
  </tbody>
</table>

<h3>The "where does it live?" rule</h3>
<table>
  <thead><tr><th>Type of data</th><th>Goes in</th></tr></thead>
  <tbody>
    <tr><td>Fetched from server</td><td>React Query cache</td></tr>
    <tr><td>UI flags (modal open, hover)</td><td>useState</td></tr>
    <tr><td>Cross-component client state</td><td>Zustand / Jotai / Redux</td></tr>
    <tr><td>Form values</td><td>react-hook-form, formik, or local state</td></tr>
    <tr><td>Router state (URL, search params)</td><td>React Router / TanStack Router / URL itself</td></tr>
  </tbody>
</table>

<h3>Caching topology</h3>
<pre><code class="language-text">QueryClient (singleton per app)
  │
  ├── Query: ['user', 'u1']      → { data: {...}, status, dataUpdatedAt }
  ├── Query: ['user', 'u2']      → { data: {...}, ... }
  ├── Query: ['posts', { page: 1 }]  → { data: [...], ... }
  └── Mutation cache: in-flight mutations

Components subscribe to specific keys via useQuery hooks.
On invalidation: matching queries are marked stale + refetched.
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Setup</h3>
<pre><code class="language-bash">yarn add @tanstack/react-query
yarn add @tanstack/react-query-devtools  # optional but recommended
</code></pre>

<pre><code class="language-tsx">// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

export default function App() {
  return (
    &lt;QueryClientProvider client={queryClient}&gt;
      &lt;Root /&gt;
      &lt;ReactQueryDevtools /&gt;
    &lt;/QueryClientProvider&gt;
  );
}
</code></pre>

<h3>Basic query</h3>
<pre><code class="language-tsx">import { useQuery } from '@tanstack/react-query';

function UserProfile({ id }: { id: string }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user', id],
    queryFn: async () =&gt; {
      const r = await fetch(\`/api/users/\${id}\`);
      if (!r.ok) throw new Error('Failed to fetch user');
      return r.json() as Promise&lt;User&gt;;
    },
  });

  if (isLoading) return &lt;Spinner /&gt;;
  if (isError) return &lt;Error error={error} onRetry={refetch} /&gt;;
  return &lt;Profile user={data!} /&gt;;
}
</code></pre>

<h3>Mutation</h3>
<pre><code class="language-tsx">import { useMutation, useQueryClient } from '@tanstack/react-query';

function EditProfile({ user }: { user: User }) {
  const qc = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (changes: Partial&lt;User&gt;) =&gt;
      fetch(\`/api/users/\${user.id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      }).then(r =&gt; r.json()),
    onSuccess: (updated) =&gt; {
      qc.setQueryData(['user', user.id], updated);   // direct cache update
      qc.invalidateQueries({ queryKey: ['users'] });   // refetch lists
    },
  });

  return (
    &lt;form onSubmit={(e) =&gt; { e.preventDefault(); mutate({ name: nameRef.current.value }); }}&gt;
      &lt;input ref={nameRef} defaultValue={user.name} /&gt;
      &lt;button disabled={isPending}&gt;{isPending ? 'Saving…' : 'Save'}&lt;/button&gt;
    &lt;/form&gt;
  );
}
</code></pre>

<h3>Optimistic update with rollback</h3>
<pre><code class="language-ts">const likePost = useMutation({
  mutationFn: (postId: string) =&gt;
    fetch(\`/api/posts/\${postId}/like\`, { method: 'POST' }).then(r =&gt; r.json()),
  onMutate: async (postId) =&gt; {
    // Cancel in-flight queries that would overwrite our optimistic update
    await qc.cancelQueries({ queryKey: ['post', postId] });

    // Snapshot previous value for rollback
    const previous = qc.getQueryData&lt;Post&gt;(['post', postId]);

    // Optimistically update
    qc.setQueryData&lt;Post&gt;(['post', postId], (old) =&gt;
      old ? { ...old, likeCount: old.likeCount + 1, likedByMe: true } : old
    );

    return { previous };
  },
  onError: (err, postId, context) =&gt; {
    // Rollback
    if (context?.previous) qc.setQueryData(['post', postId], context.previous);
  },
  onSettled: (_, __, postId) =&gt; {
    qc.invalidateQueries({ queryKey: ['post', postId] });
  },
});
</code></pre>

<h3>Conditional fetching</h3>
<pre><code class="language-ts">// Only fetch when userId is set
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () =&gt; fetchUser(userId!),
  enabled: !!userId,
});
</code></pre>

<h3>Dependent queries</h3>
<pre><code class="language-tsx">function UserPosts({ id }: { id: string }) {
  const userQuery = useQuery({
    queryKey: ['user', id],
    queryFn: () =&gt; fetchUser(id),
  });

  const postsQuery = useQuery({
    queryKey: ['posts', userQuery.data?.id],
    queryFn: () =&gt; fetchPosts(userQuery.data!.id),
    enabled: !!userQuery.data,
  });

  // Render...
}
</code></pre>

<h3>Polling</h3>
<pre><code class="language-ts">const { data } = useQuery({
  queryKey: ['live-prices'],
  queryFn: fetchPrices,
  refetchInterval: 5000,             // every 5 seconds
  refetchIntervalInBackground: false, // pause when tab hidden (default)
});
</code></pre>

<h3>useInfiniteQuery for infinite scroll</h3>
<pre><code class="language-tsx">function PostsFeed() {
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) =&gt; fetch(\`/api/posts?cursor=\${pageParam ?? ''}\`).then(r =&gt; r.json()),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =&gt; lastPage.nextCursor ?? undefined,
  });

  return (
    &lt;FlatList
      data={data?.pages.flatMap(p =&gt; p.items) ?? []}
      keyExtractor={(p) =&gt; p.id}
      renderItem={({ item }) =&gt; &lt;PostCard post={item} /&gt;}
      onEndReached={() =&gt; { if (hasNextPage &amp;&amp; !isFetchingNextPage) fetchNextPage(); }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={isFetchingNextPage ? &lt;Spinner /&gt; : null}
    /&gt;
  );
}
</code></pre>

<h3>Parallel queries (dynamic count)</h3>
<pre><code class="language-tsx">import { useQueries } from '@tanstack/react-query';

function ProfileGroup({ ids }: { ids: string[] }) {
  const queries = useQueries({
    queries: ids.map((id) =&gt; ({
      queryKey: ['user', id],
      queryFn: () =&gt; fetchUser(id),
    })),
  });

  const allLoaded = queries.every(q =&gt; !q.isLoading);
  if (!allLoaded) return &lt;Spinner /&gt;;

  return &lt;&gt;{queries.map((q, i) =&gt; q.data &amp;&amp; &lt;UserCard key={ids[i]} user={q.data} /&gt;)}&lt;/&gt;;
}
</code></pre>

<h3>Suspense mode</h3>
<pre><code class="language-tsx">// In QueryClient defaults or per-query:
const { data } = useQuery({
  queryKey: ['user', id],
  queryFn: fetchUser,
  // Throws promise on loading → component suspends
});

// Wrap consumer in Suspense + ErrorBoundary
&lt;ErrorBoundary fallback={&lt;Error /&gt;}&gt;
  &lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
    &lt;UserProfile id="u1" /&gt;
  &lt;/Suspense&gt;
&lt;/ErrorBoundary&gt;

// Use useSuspenseQuery in v5 for explicit suspense
const { data } = useSuspenseQuery({ queryKey: ..., queryFn: ... });
</code></pre>

<h3>Persistence (offline-first)</h3>
<pre><code class="language-ts">import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persister = createAsyncStoragePersister({ storage: AsyncStorage });

persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60_000,   // 24 hours
});
</code></pre>

<h3>Network state integration (mobile)</h3>
<pre><code class="language-tsx">import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

onlineManager.setEventListener((setOnline) =&gt; {
  return NetInfo.addEventListener((state) =&gt; {
    setOnline(state.isConnected ?? true);
  });
});

// React Query pauses fetches when offline; resumes on reconnect.
</code></pre>

<h3>Pre-fetching</h3>
<pre><code class="language-ts">// Before navigation
queryClient.prefetchQuery({
  queryKey: ['user', userId],
  queryFn: () =&gt; fetchUser(userId),
  staleTime: 60_000,
});
// Then navigate; UserProfile's useQuery hits the cache.
</code></pre>

<h3>Centralized query factory</h3>
<pre><code class="language-ts">// queries.ts
export const userQueries = {
  detail: (id: string) =&gt; ({
    queryKey: ['user', id] as const,
    queryFn: () =&gt; fetchUser(id),
  }),
  list: (filters: Filters) =&gt; ({
    queryKey: ['users', filters] as const,
    queryFn: () =&gt; fetchUsers(filters),
  }),
};

// Usage
const { data } = useQuery(userQueries.detail('u1'));
queryClient.invalidateQueries({ queryKey: userQueries.list({}).queryKey });
</code></pre>

<h3>Custom hooks</h3>
<pre><code class="language-ts">// hooks/useUser.ts
export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () =&gt; fetchUser(id),
    staleTime: 60_000,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; changes: Partial&lt;User&gt; }) =&gt; updateUser(params),
    onSuccess: (data, vars) =&gt; {
      qc.setQueryData(['user', vars.id], data);
    },
  });
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Pull-to-refresh on a list</h3>
<pre><code class="language-tsx">function ItemList() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  });

  return (
    &lt;FlatList
      data={data ?? []}
      keyExtractor={(i) =&gt; i.id}
      renderItem={({ item }) =&gt; &lt;ItemRow item={item} /&gt;}
      refreshControl={
        &lt;RefreshControl refreshing={isRefetching} onRefresh={() =&gt; refetch()} /&gt;
      }
    /&gt;
  );
}
</code></pre>

<h3>Example 2: Search with debounce + cancellation</h3>
<pre><code class="language-tsx">function Search() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debounced],
    queryFn: ({ signal }) =&gt; fetch(\`/api/search?q=\${debounced}\`, { signal }).then(r =&gt; r.json()),
    enabled: debounced.length &gt;= 2,
    staleTime: 5 * 60_000,   // search results valid for 5 min
  });

  return (
    &lt;&gt;
      &lt;TextInput value={query} onChangeText={setQuery} /&gt;
      {isLoading && &lt;Spinner /&gt;}
      &lt;FlatList data={data ?? []} ... /&gt;
    &lt;/&gt;
  );
}
</code></pre>
<p>Note: passing the <code>signal</code> to fetch enables React Query to abort outdated requests when the query key changes.</p>

<h3>Example 3: Optimistic todo toggle</h3>
<pre><code class="language-ts">function useToggleTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =&gt; api.toggleTodo(id),
    onMutate: async (id) =&gt; {
      await qc.cancelQueries({ queryKey: ['todos'] });
      const prev = qc.getQueryData&lt;Todo[]&gt;(['todos']);
      qc.setQueryData&lt;Todo[]&gt;(['todos'], (old) =&gt;
        old?.map((t) =&gt; (t.id === id ? { ...t, done: !t.done } : t))
      );
      return { prev };
    },
    onError: (_err, _id, ctx) =&gt; {
      if (ctx?.prev) qc.setQueryData(['todos'], ctx.prev);
    },
    onSettled: () =&gt; qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}
</code></pre>

<h3>Example 4: Per-user cache with prefetch on hover</h3>
<pre><code class="language-tsx">function UserList({ users }: { users: User[] }) {
  const qc = useQueryClient();

  return (
    &lt;ul&gt;
      {users.map((u) =&gt; (
        &lt;li
          key={u.id}
          onMouseEnter={() =&gt;
            qc.prefetchQuery({
              queryKey: ['user', u.id],
              queryFn: () =&gt; fetchUserDetail(u.id),
              staleTime: 60_000,
            })
          }
        &gt;
          &lt;Link to={\`/users/\${u.id}\`}&gt;{u.name}&lt;/Link&gt;
        &lt;/li&gt;
      ))}
    &lt;/ul&gt;
  );
}
// Hover prefetches; click navigates and detail page reads cache → instant.
</code></pre>

<h3>Example 5: Pagination with cursor</h3>
<pre><code class="language-tsx">function MessagesScreen() {
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch,
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =&gt;
      fetch(\`/api/conversations/\${conversationId}/messages?before=\${pageParam ?? ''}\`).then(r =&gt; r.json()),
    initialPageParam: null as string | null,
    getNextPageParam: (last) =&gt; last.nextCursor,
  });

  const messages = data?.pages.flatMap((p) =&gt; p.items) ?? [];

  return (
    &lt;FlatList
      inverted
      data={messages}
      keyExtractor={(m) =&gt; m.id}
      renderItem={({ item }) =&gt; &lt;MessageRow message={item} /&gt;}
      onEndReached={() =&gt; hasNextPage &amp;&amp; fetchNextPage()}
      ListFooterComponent={isFetchingNextPage ? &lt;Spinner /&gt; : null}
    /&gt;
  );
}
</code></pre>

<h3>Example 6: Polling stops on tab background</h3>
<pre><code class="language-tsx">function StockTicker() {
  const { data } = useQuery({
    queryKey: ['stock', 'AAPL'],
    queryFn: () =&gt; fetchStock('AAPL'),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,   // pause when tab hidden
  });
  return &lt;span&gt;{data?.price}&lt;/span&gt;;
}
</code></pre>

<h3>Example 7: Multiple paginations sharing cache</h3>
<pre><code class="language-ts">// Two views: filtered "active" and "archived" — separate cache entries
useQuery({ queryKey: ['users', { filter: 'active' }], queryFn: () =&gt; fetchUsers({ filter: 'active' }) });
useQuery({ queryKey: ['users', { filter: 'archived' }], queryFn: () =&gt; fetchUsers({ filter: 'archived' }) });

// Both invalidated together:
queryClient.invalidateQueries({ queryKey: ['users'] });
</code></pre>

<h3>Example 8: Setting cache from a mutation response</h3>
<pre><code class="language-ts">const updateUser = useMutation({
  mutationFn: (changes) =&gt; api.updateUser(userId, changes),
  onSuccess: (data) =&gt; {
    qc.setQueryData(['user', userId], data);   // skip refetch, use response directly
  },
});
</code></pre>

<h3>Example 9: Server-driven invalidation with WebSocket</h3>
<pre><code class="language-tsx">function ChatProvider({ children }) {
  const qc = useQueryClient();

  useEffect(() =&gt; {
    const ws = new WebSocket('wss://api.example.com/chat');
    ws.onmessage = (e) =&gt; {
      const event = JSON.parse(e.data);
      if (event.type === 'message:new') {
        qc.invalidateQueries({ queryKey: ['messages', event.conversationId] });
      }
      if (event.type === 'user:updated') {
        qc.invalidateQueries({ queryKey: ['user', event.userId] });
      }
    };
    return () =&gt; ws.close();
  }, [qc]);

  return &lt;&gt;{children}&lt;/&gt;;
}
</code></pre>

<h3>Example 10: Offline-first with persistence</h3>
<pre><code class="language-tsx">// Persist setup
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

persistQueryClient({
  queryClient,
  persister: createAsyncStoragePersister({ storage: AsyncStorage }),
  maxAge: 7 * 24 * 60 * 60_000,
  buster: 'v1',   // bump on schema changes to invalidate persisted cache
});

// Network awareness
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

onlineManager.setEventListener((setOnline) =&gt;
  NetInfo.addEventListener((state) =&gt; setOnline(state.isConnected ?? true))
);

// Mutation queue for offline writes
useMutation({
  mutationFn: api.saveDraft,
  retry: 5,                // retry transient errors
  retryDelay: (attempt) =&gt; Math.min(1000 * 2 ** attempt, 30_000),   // exponential backoff
});
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Stale closures in queryFn</h3>
<pre><code class="language-tsx">// Avoid capturing component-level state inside queryFn unless it's in the queryKey
function Foo({ filter }) {
  useQuery({
    queryKey: ['foo'],
    queryFn: () =&gt; fetch(\`/api/foo?filter=\${filter}\`),  // ❌ stale; won't refetch when filter changes
  });
}

// FIX
useQuery({
  queryKey: ['foo', filter],
  queryFn: () =&gt; fetch(\`/api/foo?filter=\${filter}\`),
});
</code></pre>

<h3>Cache hit but data is wrong</h3>
<p>Two queries with the same key produce one cache entry. If two components inadvertently use the same key for different data shapes, one will win and corrupt the other. Use specific, descriptive keys.</p>

<h3>Optimistic update that conflicts with refetch</h3>
<p>The order matters:</p>
<ol>
  <li><code>onMutate</code>: cancel in-flight queries, snapshot, optimistic update.</li>
  <li><code>mutationFn</code>: actual network call.</li>
  <li><code>onError</code>: rollback using snapshot.</li>
  <li><code>onSettled</code>: invalidate to refetch fresh.</li>
</ol>

<h3>Refetch on focus during testing</h3>
<p>Tests window-focus simulation can trigger refetches; configure default <code>refetchOnWindowFocus: false</code> for tests:</p>
<pre><code class="language-tsx">const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});
</code></pre>

<h3>Setting query data that conflicts with the type</h3>
<pre><code class="language-ts">// TS infers data type from queryFn; setQueryData accepts T
qc.setQueryData&lt;User&gt;(['user', id], (old) =&gt; old &amp;&amp; { ...old, name: 'New' });
</code></pre>

<h3>Background refetch flicker</h3>
<p>Stale data shown immediately + background refetch can cause UI flicker if data is significantly different. Use <code>placeholderData</code> or <code>keepPreviousData</code> (v5: <code>keepPreviousData</code> via <code>placeholderData: keepPreviousData</code>) for paginated views.</p>

<h3>Query key arrays vs strings</h3>
<p>v4: arrays only; strings deprecated. Always use arrays. <code>['users']</code> not <code>'users'</code>.</p>

<h3>Refetch interval running while offline</h3>
<p>Default behavior pauses on offline. But if you skip <code>onlineManager</code> setup on mobile, network changes aren't detected. Wire NetInfo to onlineManager for correct behavior.</p>

<h3>Retry on every error</h3>
<p>Default: retry 3 times for failed queries. For 4xx errors (especially 401, 403, 404), retrying is useless. Customize:</p>
<pre><code class="language-ts">retry: (failureCount, error) =&gt; {
  if (error instanceof HttpError &amp;&amp; error.status &gt;= 400 &amp;&amp; error.status &lt; 500) return false;
  return failureCount &lt; 3;
}
</code></pre>

<h3>Mutation retries</h3>
<p>Mutations don't auto-retry by default (writes are usually idempotent only by design). Be explicit:</p>
<pre><code class="language-ts">useMutation({
  mutationFn: ...,
  retry: 2,   // explicit; only do this if backend is idempotent
});
</code></pre>

<h3>Error boundaries with Suspense queries</h3>
<p>Suspense queries throw errors which bubble to the nearest ErrorBoundary. Without one, errors crash the app. Always pair Suspense with an ErrorBoundary.</p>

<h3>Stale data after route change</h3>
<p>Navigating away and back — query is stale on remount; default behavior refetches. To skip refetch: <code>refetchOnMount: false</code> or set <code>staleTime: Infinity</code>.</p>

<h3>Persistence + sensitive data</h3>
<p>Default persisters serialize the entire cache. If queries hold tokens / PII, persisting is a security issue. Use <code>shouldDehydrateQuery</code> to filter:</p>
<pre><code class="language-ts">persistQueryClient({
  queryClient,
  persister,
  dehydrateOptions: {
    shouldDehydrateQuery: (q) =&gt; !q.queryKey.includes('private'),
  },
});
</code></pre>

<h3>Query factory key uniqueness</h3>
<p>If two factories accidentally produce the same key with different shapes, you get cache collision. Use feature-prefixed keys: <code>['user', ...]</code>, <code>['post', ...]</code>, <code>['order', ...]</code>.</p>

<h3>Network error not surfaced</h3>
<p>Standard <code>fetch</code> doesn't throw on 4xx/5xx — only on network failure. Check <code>r.ok</code> in your queryFn:</p>
<pre><code class="language-ts">queryFn: async () =&gt; {
  const r = await fetch(url);
  if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
  return r.json();
}
</code></pre>

<h3>setQueryData immutability</h3>
<p>Returning the same reference from a setQueryData updater means React Query thinks nothing changed; subscribers don't re-render. Always return a new object/array:</p>
<pre><code class="language-ts">qc.setQueryData(['todos'], (old) =&gt; old.map((t) =&gt; t.id === id ? { ...t, done: true } : t));
</code></pre>

<h3>Mounting many queries simultaneously</h3>
<p>Hundreds of <code>useQuery</code> calls in a list trigger hundreds of fetches; deduplication helps if keys collide, otherwise the network gets hammered. Consolidate via a single query that returns all data, or use <code>useQueries</code> with batching.</p>

<h3>Versioning the persisted cache</h3>
<p>Schema changes break persisted cache. Always set <code>buster</code> (or <code>maxAge</code>) so the persister invalidates on bump:</p>
<pre><code class="language-ts">persistQueryClient({ queryClient, persister, buster: 'v3' });
</code></pre>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Storing fetched data in Redux/Zustand</h3>
<p>"Manual" loading flags + dispatched fetch + storing data in client store = 90% of pre-React-Query code. Migrate; React Query handles this end-to-end.</p>

<h3>Bug 2: Same key, different data</h3>
<pre><code class="language-ts">// Component A
useQuery({ queryKey: ['user'], queryFn: () =&gt; fetchUser('me') });
// Component B
useQuery({ queryKey: ['user'], queryFn: () =&gt; fetchUser('them') });
// → cache collision; second one overwrites first

// FIX — include parameters in key
useQuery({ queryKey: ['user', 'me'], queryFn: () =&gt; fetchUser('me') });
useQuery({ queryKey: ['user', 'them'], queryFn: () =&gt; fetchUser('them') });
</code></pre>

<h3>Bug 3: Forgetting to throw on HTTP errors</h3>
<pre><code class="language-ts">// BAD — fetch doesn't throw on 4xx/5xx
queryFn: () =&gt; fetch('/api/foo').then(r =&gt; r.json())

// GOOD
queryFn: async () =&gt; {
  const r = await fetch('/api/foo');
  if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
  return r.json();
}
</code></pre>

<h3>Bug 4: Mutating cache directly</h3>
<pre><code class="language-ts">const data = qc.getQueryData(['todos']);
data.push(newTodo);   // ❌ mutating cached array
qc.setQueryData(['todos'], data);   // same reference; React doesn't see a change

// FIX
qc.setQueryData(['todos'], (old) =&gt; [...old, newTodo]);
</code></pre>

<h3>Bug 5: Missing <code>enabled</code> for conditional fetch</h3>
<pre><code class="language-ts">// BAD — fetches even when id is undefined; queryFn crashes
useQuery({
  queryKey: ['user', id],
  queryFn: () =&gt; fetchUser(id),
});

// GOOD
useQuery({
  queryKey: ['user', id],
  queryFn: () =&gt; fetchUser(id!),
  enabled: !!id,
});
</code></pre>

<h3>Bug 6: Not invalidating after mutation</h3>
<pre><code class="language-ts">// User updated; UI shows old data
useMutation({
  mutationFn: updateUser,
  // forgot onSuccess invalidate
});

// FIX
useMutation({
  mutationFn: updateUser,
  onSuccess: (_, vars) =&gt; qc.invalidateQueries({ queryKey: ['user', vars.id] }),
});
</code></pre>

<h3>Bug 7: Optimistic update without rollback</h3>
<pre><code class="language-ts">// BAD
useMutation({
  mutationFn: ...,
  onMutate: () =&gt; { qc.setQueryData(...); },
  // no onError → optimistic state persists on failure
});

// GOOD — pair with onError + return context
</code></pre>

<h3>Bug 8: Refetching too aggressively</h3>
<p>Default <code>staleTime: 0</code> means every mount/focus triggers refetch. For data that doesn't change often, this hammers the network. Tune <code>staleTime</code> per query.</p>

<h3>Bug 9: Persisting tokens / sensitive data</h3>
<p>Default persisters serialize everything. Tokens in cache = tokens on disk. Filter via <code>shouldDehydrateQuery</code>; or store credentials in Keychain instead.</p>

<h3>Bug 10: Query key drift between query and invalidation</h3>
<pre><code class="language-ts">useQuery({ queryKey: ['users', { filter: 'active' }], ... });

// Later
qc.invalidateQueries({ queryKey: ['user', { filter: 'active' }] });   // typo: 'user' vs 'users'
// no match → no refetch → stale data
</code></pre>
<p>Fix with a query factory: shared key constructors.</p>

<h3>Anti-pattern 1: One mega query</h3>
<p>Fetching the entire app state in one query. You lose granularity; one mutation invalidates everything. Split by entity.</p>

<h3>Anti-pattern 2: Skipping the QueryClientProvider in tests</h3>
<p>Tests fail because hooks have no QueryClient context. Always wrap test components.</p>

<h3>Anti-pattern 3: Using queryFn for non-async work</h3>
<p>If queryFn doesn't actually fetch, you've shoehorned synchronous logic into the wrong tool. Use a memo / selector.</p>

<h3>Anti-pattern 4: Inline queryFn lambdas everywhere</h3>
<p>Hard to test; impossible to share. Extract queryFn into a named function or query factory.</p>

<h3>Anti-pattern 5: Reading <code>data</code> without null check</h3>
<pre><code class="language-tsx">// BAD — data is User | undefined initially
const { data: user } = useQuery({ queryKey: ['user', id], queryFn: ... });
return &lt;p&gt;{user.name}&lt;/p&gt;;   // crashes on first render

// GOOD
const { data: user } = useQuery(...);
if (!user) return &lt;Spinner /&gt;;
return &lt;p&gt;{user.name}&lt;/p&gt;;

// Or use suspense queries:
const { data: user } = useSuspenseQuery(...);
</code></pre>

<h3>Anti-pattern 6: Not using DevTools</h3>
<p>React Query DevTools shows cache state, in-flight queries, mutations. Skipping it means debugging blind.</p>

<h3>Anti-pattern 7: Setting <code>retry: 0</code> globally</h3>
<p>Disables retries everywhere. Network blip → user sees an error. Tune per query type instead.</p>

<h3>Anti-pattern 8: Two server-state libraries in one app</h3>
<p>React Query + Apollo + RTK Query in one app = three caches that don't sync. Pick one.</p>

<h3>Anti-pattern 9: Manual loading state</h3>
<pre><code class="language-tsx">// BAD — duplicate state
const [loading, setLoading] = useState(false);
const { data, isLoading } = useQuery(...);

// GOOD — use isLoading directly
</code></pre>

<h3>Anti-pattern 10: Polling at high frequency without backoff</h3>
<p><code>refetchInterval: 1000</code> for a chat — works for a small user base, kills your API at scale. Use WebSocket for true real-time; polling is fine but tune the interval to actual freshness needs.</p>
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
    <tr><td><em>What's "server state"?</em></td><td>Cached, stale-able copies of remote data; needs revalidation, not just storage.</td></tr>
    <tr><td><em>What does React Query give you?</em></td><td>Cache, stale-while-revalidate, dedup, retries, mutations, invalidation, devtools, persistence.</td></tr>
    <tr><td><em>Query key role?</em></td><td>Identity for the cache entry; same key = same data.</td></tr>
    <tr><td><em>StaleTime vs gcTime?</em></td><td>StaleTime: when to refetch. gcTime: when to evict from cache.</td></tr>
    <tr><td><em>Optimistic update pattern?</em></td><td>onMutate cancel + snapshot + apply; onError rollback; onSettled invalidate.</td></tr>
    <tr><td><em>How does dedup work?</em></td><td>Multiple subscribers to same key share one in-flight fetch.</td></tr>
    <tr><td><em>useInfiniteQuery vs paginated useQuery?</em></td><td>useInfiniteQuery: pages stay; useQuery: each page replaces.</td></tr>
    <tr><td><em>How to handle dependent queries?</em></td><td>Use <code>enabled</code>: gate the second query on first's result.</td></tr>
    <tr><td><em>How to refetch on server-side change?</em></td><td>WebSocket → invalidateQueries; or polling.</td></tr>
    <tr><td><em>React Query vs SWR vs RTK Query?</em></td><td>RQ: full-featured default. SWR: leaner, Next.js-native. RTK Query: Redux-native.</td></tr>
    <tr><td><em>How to handle offline?</em></td><td>Persistence + onlineManager + retry with backoff.</td></tr>
    <tr><td><em>When NOT to use?</em></td><td>Data fetched once at app start; tiny apps; existing RTK Query / Apollo invested.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Set up QueryClient + Provider + a basic <code>useQuery</code>.</li>
  <li>Write a mutation with optimistic update + rollback.</li>
  <li>Build infinite scroll with <code>useInfiniteQuery</code>.</li>
  <li>Add prefetch on hover.</li>
  <li>Implement polling that pauses when offline.</li>
  <li>Wire WebSocket → invalidateQueries.</li>
  <li>Persist cache for offline-first.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Stale closure in queryFn — variable not in queryKey, stale on change.</li>
  <li>Same key for different data — cache collision.</li>
  <li>fetch without ok-check — error never thrown; broken query never errors.</li>
  <li>Mutation succeeds but UI stale — missing invalidate.</li>
  <li>Optimistic update without rollback — UI keeps wrong state on failure.</li>
  <li>Token persisted to disk via default persister — security issue.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Server-state separation</td><td>You distinguish server from client state and use the right tool.</td></tr>
    <tr><td>Cache-invalidation literacy</td><td>You volunteer "invalidate after mutation" as a default.</td></tr>
    <tr><td>Optimistic update pattern</td><td>You name onMutate / onError / onSettled correctly.</td></tr>
    <tr><td>Performance awareness</td><td>You tune staleTime / gcTime per use case.</td></tr>
    <tr><td>Mobile awareness</td><td>You wire NetInfo to onlineManager; you persist for offline.</td></tr>
    <tr><td>DevTools fluency</td><td>You volunteer the React Query DevTools as a debugging tool.</td></tr>
    <tr><td>Honest tool selection</td><td>You compare RQ vs SWR vs RTK Query vs Apollo by use case.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>NetInfo + onlineManager</strong> — non-negotiable on RN; React Query needs to know about connectivity changes.</li>
  <li><strong>AsyncStorage persister</strong> — basic offline cache; works for non-sensitive data.</li>
  <li><strong>MMKV persister</strong> — much faster than AsyncStorage; recommended for cold-start critical caches.</li>
  <li><strong>App state events</strong> — use <code>focusManager</code> to refetch when app foregrounds.</li>
  <li><strong>Background fetch</strong> — limited on iOS; use silent push to invalidate cache from server.</li>
  <li><strong>Pagination on FlatList</strong> — onEndReached + useInfiniteQuery's fetchNextPage is the canonical pattern.</li>
</ul>

<h3>focusManager for RN</h3>
<pre><code class="language-tsx">import { focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

AppState.addEventListener('change', (state) =&gt; {
  focusManager.setFocused(state === 'active');
});
</code></pre>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why is server state different from client state?"</em> — Server is owned remotely; can be stale; updated out-of-band; needs revalidation, deduplication, retries. Client state has none of these problems. Different problems → different tool.</li>
  <li><em>"What's the relationship between queries and mutations?"</em> — Queries READ; mutations WRITE. Mutations invalidate queries to keep them in sync.</li>
  <li><em>"Why memoize the queryFn?"</em> — You don't have to; React Query stores it per query. But if you create new queryFn references every render unnecessarily, you risk subtle bugs.</li>
  <li><em>"What happens on error retries?"</em> — Default: 3 attempts with exponential backoff (1s, 2s, 4s). Configure per query; for 4xx, often disable.</li>
  <li><em>"How does suspense mode work?"</em> — Pending queries throw promises; React Suspense catches and shows fallback. Errors throw to ErrorBoundary. Cleaner UI code; pair with both ErrorBoundary and Suspense.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit fetched data — anything stored in Redux/Zustand that should be in React Query?</li>
  <li>Inspect query keys — collisions, drift between query and invalidation.</li>
  <li>Check stale/cache time tuning — defaults often refetch too aggressively.</li>
  <li>Verify onlineManager + focusManager are wired on mobile.</li>
  <li>Audit persistence configuration — sensitive data filtered out?</li>
  <li>Set up DevTools in dev builds.</li>
  <li>Document team conventions: query key shape, factory pattern, custom hooks.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd build a query factory module so query keys are typed and shared."</li>
  <li>"I'd add WebSocket-driven invalidation for live-updated entities."</li>
  <li>"I'd persist cache to MMKV instead of AsyncStorage for cold-start speed."</li>
  <li>"I'd add a 'mutation queue' for offline writes that flushes on reconnect."</li>
  <li>"I'd add custom retry logic per error type — never retry 4xx, retry 5xx with backoff."</li>
  <li>"I'd profile bundle size; tree-shake unused query features."</li>
</ul>
`
    }
  ]
});
