window.PREP_SITE.registerTopic({
  id: 'rn-state-data',
  module: 'React Native',
  title: 'State & Data (MMKV / React Query)',
  estimatedReadTime: '24 min',
  tags: ['react-native', 'state', 'mmkv', 'react-query', 'zustand', 'async-storage', 'data', 'persistence'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>RN state management uses the same React patterns you know, but with mobile-specific storage, caching, and sync considerations.</p>
<ul>
  <li><strong>Component state</strong>: <code>useState</code> / <code>useReducer</code>. Same as web.</li>
  <li><strong>Global client state</strong>: <strong>Zustand</strong> is the modern default. Redux Toolkit still fine for large apps. Avoid Context for frequently-changing data.</li>
  <li><strong>Server state</strong>: <strong>TanStack Query (React Query)</strong>. Handles caching, revalidation, retries, optimistic updates, offline queues, pagination.</li>
  <li><strong>Storage — persistent, sync, fast</strong>: <strong>react-native-mmkv</strong>. JSI-powered, ~30× faster than AsyncStorage, synchronous API. Use for settings, tokens, cached data.</li>
  <li><strong>Storage — structured / queryable</strong>: <strong>WatermelonDB</strong> (sync + reactive) or <strong>op-sqlite</strong> / <strong>expo-sqlite</strong> (raw SQL). For thousands of records with relationships.</li>
  <li><strong>AsyncStorage</strong>: the OG; still supported but slower (bridge-based). Migrate to MMKV unless bound to a lib.</li>
  <li><strong>Offline-first</strong>: cache + queue pattern. TanStack Query + MMKV persistor + mutation queue handles most cases.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Default stack: Zustand for client state + TanStack Query for server state + MMKV for persistence. Reach for SQLite-based stores only when you have large datasets with relational queries.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why mobile state differs from web state</h3>
<p>Everything you know about React state applies. But mobile has distinct concerns:</p>
<ul>
  <li><strong>Offline is common</strong> — users in tunnels, airplanes, bad coverage. Server data must be cached locally.</li>
  <li><strong>App lifecycle</strong> — backgrounded for hours, relaunched. State must persist across cold starts.</li>
  <li><strong>Storage constraints</strong> — users care about app size; binary quotas matter.</li>
  <li><strong>Sync is synchronous</strong> on mobile — AsyncStorage's async API hurts startup and UX. Sync storage (MMKV) avoids async ceremony for reading settings.</li>
  <li><strong>Background sync</strong> — app in background can still run tasks on iOS/Android with proper APIs.</li>
</ul>

<h3>Why Zustand over Context or Redux (for most apps)</h3>
<ul>
  <li><strong>Selector subscriptions</strong>: components re-render only when their selected slice changes, not on every store update.</li>
  <li><strong>No provider tree</strong> — the store is a module export.</li>
  <li><strong>Small API</strong>: <code>create</code>, <code>useStore</code>, set/get.</li>
  <li><strong>Middleware</strong>: persist, devtools, immer.</li>
  <li><strong>Works with React Native naturally</strong>: no quirks with reconciliation modes.</li>
</ul>
<p>Context is fine for rarely-changing ambient values (theme, locale). Redux Toolkit is fine for big teams / large apps but carries more ceremony.</p>

<h3>Why TanStack Query for server state</h3>
<p>Same rationale as web: caching, revalidation, background refetch, optimistic mutations, retries. Mobile-specific wins:</p>
<ul>
  <li><strong>Focus refetch</strong>: refetch when app comes to foreground — users expect fresh data.</li>
  <li><strong>Network-state aware</strong>: reconnect triggers refetch.</li>
  <li><strong>Offline mutations</strong>: queue, replay on reconnect.</li>
  <li><strong>Persist cache</strong>: TanStack Query Persist Client + MMKV → survives app relaunch.</li>
</ul>

<h3>Why MMKV over AsyncStorage</h3>
<table>
  <thead><tr><th></th><th>AsyncStorage</th><th>MMKV</th></tr></thead>
  <tbody>
    <tr><td>API</td><td>Async (Promise)</td><td>Sync</td></tr>
    <tr><td>Implementation</td><td>Bridge (JSON → Native → SQLite/file)</td><td>JSI (direct C++ via mmap file)</td></tr>
    <tr><td>Speed</td><td>~1-5ms per op</td><td>~0.01ms per op</td></tr>
    <tr><td>Size</td><td>Virtually unlimited (file)</td><td>Fast for KB-MB range</td></tr>
    <tr><td>Encryption</td><td>Third-party layer</td><td>Built-in AES</td></tr>
    <tr><td>Multiple instances</td><td>One global</td><td>Multiple named instances</td></tr>
  </tbody>
</table>
<p>For anything latency-sensitive (settings, tokens read on every render), MMKV is a dramatic upgrade.</p>

<h3>When to reach for SQLite / WatermelonDB</h3>
<p>MMKV is a key-value store — great for small objects and settings. For complex data:</p>
<ul>
  <li><strong>Many records</strong> (thousands of messages, posts, contacts).</li>
  <li><strong>Relational queries</strong> (join, filter, sort by multiple fields).</li>
  <li><strong>Reactive queries</strong> (automatic re-render when underlying rows change).</li>
</ul>
<p>Options:</p>
<ul>
  <li><strong>WatermelonDB</strong>: SQLite + reactive sync layer. Great for offline-first apps.</li>
  <li><strong>op-sqlite</strong> / <strong>expo-sqlite</strong>: raw SQL access.</li>
  <li><strong>Drizzle ORM</strong> on top: TypeScript-first SQL.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "four kinds of state" picture</h3>
<div class="diagram">
<pre>
  SERVER STATE          ───► TanStack Query (cache, refetch, mutations)
   - user profile, posts, likes

  CLIENT STATE          ───► Zustand / Redux (UI flags, selections)
   - modal open, selected tab, form draft in memory

  PERSISTENT STATE      ───► MMKV (small) / SQLite (large)
   - auth token, theme, last seen route, drafts saved

  URL / ROUTE STATE     ───► React Navigation params / Expo Router params
   - current screen, its params
</pre>
</div>

<h3>The "cache persistence" picture</h3>
<div class="diagram">
<pre>
  App starts
     │
     ▼
  Read MMKV → hydrate Zustand stores + TanStack Query cache
     │
     ▼
  Components render with cached data (instant)
     │
     ▼
  TanStack Query revalidates in background
     │
     ▼
  Updated data replaces stale, UI reflects
</pre>
</div>

<h3>The "offline mutation queue" picture</h3>
<div class="diagram">
<pre>
  Online:  mutation → server → success → cache update + UI
  Offline: mutation → QUEUE (persistent) → UI optimistic update
     │
     ▼
  NetInfo detects reconnect
     │
     ▼
  Replay queue in order with idempotency key
     │
     ▼
  Server confirms → cache update, queue drained
</pre>
</div>

<h3>The "MMKV as a fast sync shelf" picture</h3>
<pre><code class="language-ts">import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();
storage.set('authToken', 'abc');          // sync, no promise
const t = storage.getString('authToken'); // sync, ~30μs

// Multiple instances for separation
const settings = new MMKV({ id: 'settings' });
const cache = new MMKV({ id: 'cache', encryptionKey: 'key' });</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"AsyncStorage is enough for everything." For a simple flag, yes. For settings read on every screen, auth tokens checked in navigation guards, cached server state — AsyncStorage's 1-5ms per read adds up. MMKV's sub-millisecond reads make sync access viable.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Zustand with persist to MMKV</h3>
<pre><code class="language-ts">import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const mmkvAdapter = {
  getItem: (k: string) =&gt; storage.getString(k) ?? null,
  setItem: (k: string, v: string) =&gt; storage.set(k, v),
  removeItem: (k: string) =&gt; storage.delete(k),
};

type Settings = { theme: 'light' | 'dark'; setTheme: (t: 'light' | 'dark') =&gt; void };

export const useSettings = create&lt;Settings&gt;()(
  persist(
    (set) =&gt; ({ theme: 'light', setTheme: (theme) =&gt; set({ theme }) }),
    { name: 'settings', storage: createJSONStorage(() =&gt; mmkvAdapter) }
  )
);</code></pre>

<h3>TanStack Query setup</h3>
<pre><code class="language-tsx">import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

// Online/focus hooks for mobile
onlineManager.setEventListener(setOnline =&gt; {
  return NetInfo.addEventListener(state =&gt; setOnline(!!state.isConnected));
});
AppState.addEventListener('change', (status) =&gt; {
  focusManager.setFocused(status === 'active');
});

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 } }
});

function App() {
  return (
    &lt;QueryClientProvider client={qc}&gt;
      &lt;Nav /&gt;
    &lt;/QueryClientProvider&gt;
  );
}</code></pre>

<h3>Persisting TanStack Query cache</h3>
<pre><code class="language-tsx">import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'rq-cache' });
const persister = createSyncStoragePersister({
  storage: {
    getItem: (k) =&gt; storage.getString(k) ?? null,
    setItem: (k, v) =&gt; storage.set(k, v),
    removeItem: (k) =&gt; storage.delete(k),
  },
});

&lt;PersistQueryClientProvider client={qc} persistOptions={{ persister, maxAge: 1000*60*60*24 }}&gt;
  &lt;Nav /&gt;
&lt;/PersistQueryClientProvider&gt;</code></pre>

<h3>Query with offline mutation</h3>
<pre><code class="language-tsx">const qc = useQueryClient();

const likeTweet = useMutation({
  mutationFn: (id: string) =&gt; api.post(\`/tweet/\${id}/like\`),
  onMutate: async (id) =&gt; {
    await qc.cancelQueries({ queryKey: ['feed'] });
    const prev = qc.getQueryData(['feed']);
    qc.setQueryData(['feed'], (old) =&gt; toggleLike(old, id));
    return { prev };
  },
  onError: (_e, _v, ctx) =&gt; ctx?.prev &amp;&amp; qc.setQueryData(['feed'], ctx.prev),
  onSettled: () =&gt; qc.invalidateQueries({ queryKey: ['feed'] }),
  retry: 5,
  retryDelay: (i) =&gt; Math.min(1000 * 2 ** i, 30000),
});</code></pre>
<p>TanStack Query pauses mutations when offline and replays them when online — as long as the mutation is "persistable" (typed args, idempotent).</p>

<h3>Infinite query for feed</h3>
<pre><code class="language-tsx">const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) =&gt; api.get('/feed', { cursor: pageParam }),
  getNextPageParam: (last) =&gt; last.nextCursor,
  initialPageParam: null,
});

const items = data?.pages.flatMap(p =&gt; p.items) ?? [];</code></pre>

<h3>NetInfo for network-aware UI</h3>
<pre><code class="language-tsx">import NetInfo from '@react-native-community/netinfo';

const [connected, setConnected] = useState(true);
useEffect(() =&gt; {
  const unsub = NetInfo.addEventListener(s =&gt; setConnected(!!s.isConnected));
  return unsub;
}, []);

// Use connected to show banner, disable actions, or adjust behavior.</code></pre>

<h3>MMKV advanced</h3>
<pre><code class="language-ts">// Encrypted instance
const secure = new MMKV({ id: 'auth', encryptionKey: 'user-derived-key' });
secure.set('token', jwt);

// Multiple instances per concern — separate GC
const settings = new MMKV({ id: 'settings' });
const cache = new MMKV({ id: 'cache' });

// Clear on logout
settings.clearAll();

// Listen for changes (across tabs / other parts of app)
const listener = settings.addOnValueChangedListener((key) =&gt; {
  console.log('changed:', key);
});</code></pre>

<h3>SQLite via expo-sqlite / op-sqlite</h3>
<pre><code class="language-ts">import * as SQLite from 'expo-sqlite';
const db = await SQLite.openDatabaseAsync('app.db');
await db.execAsync(\`CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, body TEXT, createdAt INTEGER)\`);
await db.runAsync('INSERT INTO messages VALUES (?, ?, ?)', ['1', 'hi', Date.now()]);
const rows = await db.getAllAsync('SELECT * FROM messages WHERE createdAt &gt; ? ORDER BY createdAt DESC LIMIT 50', [cutoff]);</code></pre>

<h3>WatermelonDB sketch</h3>
<pre><code class="language-ts">// Declare Model
class Message extends Model {
  static table = 'messages';
  @field('body') body!: string;
  @field('created_at') createdAt!: number;
}

// Reactive query in component
function Inbox() {
  const db = useDatabase();
  const messages = useObservable(
    () =&gt; db.collections.get&lt;Message&gt;('messages').query().observe(),
    [db]
  );
  return &lt;FlatList data={messages} ... /&gt;;
}
// Automatic re-render on row changes; sync protocol built-in.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — Zustand store</h3>
<pre><code class="language-ts">import { create } from 'zustand';

type CartStore = {
  items: CartItem[];
  add: (item: CartItem) =&gt; void;
  remove: (id: string) =&gt; void;
  total: () =&gt; number;
};

export const useCart = create&lt;CartStore&gt;((set, get) =&gt; ({
  items: [],
  add: (item) =&gt; set((s) =&gt; ({ items: [...s.items, item] })),
  remove: (id) =&gt; set((s) =&gt; ({ items: s.items.filter(i =&gt; i.id !== id) })),
  total: () =&gt; get().items.reduce((sum, i) =&gt; sum + i.price * i.qty, 0),
}));</code></pre>

<h3>Example 2 — selector subscription</h3>
<pre><code class="language-tsx">const itemCount = useCart((s) =&gt; s.items.length);   // re-renders only when length changes
const add = useCart((s) =&gt; s.add);                    // stable reference</code></pre>

<h3>Example 3 — persisting with MMKV</h3>
<pre><code class="language-ts">import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();

export const useAuth = create&lt;AuthStore&gt;()(persist(
  (set) =&gt; ({
    user: null,
    login: (user) =&gt; set({ user }),
    logout: () =&gt; set({ user: null }),
  }),
  { name: 'auth', storage: createJSONStorage(() =&gt; ({
    getItem: (k) =&gt; storage.getString(k) ?? null,
    setItem: (k, v) =&gt; storage.set(k, v),
    removeItem: (k) =&gt; storage.delete(k),
  })) }
));</code></pre>

<h3>Example 4 — TanStack Query with focus refetch</h3>
<pre><code class="language-tsx">function Profile({ userId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () =&gt; api.getUser(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: true,  // refetch when app comes to foreground
  });
  if (isLoading) return &lt;Loading /&gt;;
  return &lt;UserCard user={data} /&gt;;
}</code></pre>

<h3>Example 5 — infinite list</h3>
<pre><code class="language-tsx">const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) =&gt; api.feed({ cursor: pageParam }),
  getNextPageParam: (last) =&gt; last.nextCursor,
  initialPageParam: null,
});

&lt;FlashList
  data={data?.pages.flatMap(p =&gt; p.items) ?? []}
  renderItem={renderItem}
  onEndReached={() =&gt; hasNextPage &amp;&amp; fetchNextPage()}
  estimatedItemSize={120}
/&gt;</code></pre>

<h3>Example 6 — optimistic like mutation</h3>
<pre><code class="language-tsx">const like = useMutation({
  mutationFn: (id: string) =&gt; api.like(id),
  onMutate: async (id) =&gt; {
    await qc.cancelQueries({ queryKey: ['feed'] });
    const prev = qc.getQueriesData({ queryKey: ['feed'] });
    qc.setQueriesData({ queryKey: ['feed'] }, (old: any) =&gt; applyLike(old, id));
    return { prev };
  },
  onError: (_, __, ctx) =&gt; {
    ctx?.prev.forEach(([key, data]) =&gt; qc.setQueryData(key, data));
  },
  onSettled: () =&gt; qc.invalidateQueries({ queryKey: ['feed'] }),
});</code></pre>

<h3>Example 7 — persist TanStack Query cache</h3>
<pre><code class="language-tsx">&lt;PersistQueryClientProvider
  client={qc}
  persistOptions={{ persister, maxAge: 1000*60*60*24 }}
&gt;
  &lt;App /&gt;
&lt;/PersistQueryClientProvider&gt;
// Cache survives app relaunch. Users see last-loaded data instantly.</code></pre>

<h3>Example 8 — NetInfo banner</h3>
<pre><code class="language-tsx">function OfflineBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() =&gt; {
    const unsub = NetInfo.addEventListener((s) =&gt; setOnline(!!s.isConnected));
    return unsub;
  }, []);
  if (online) return null;
  return &lt;View style={styles.banner}&gt;&lt;Text&gt;Offline — showing cached data&lt;/Text&gt;&lt;/View&gt;;
}</code></pre>

<h3>Example 9 — mutation queue (TanStack Query)</h3>
<pre><code class="language-tsx">// PersistQueryClientProvider also persists mutations
// Failed mutations tagged for retry; replayed on reconnect.
// Requires mutations to be "persistable" — serializable args.

const mutation = useMutation({
  mutationFn: (data) =&gt; api.post('/items', data),
  retry: true,  // keep retrying
  networkMode: 'online',  // pause when offline, resume on reconnect
});</code></pre>

<h3>Example 10 — secure storage</h3>
<pre><code class="language-ts">import { MMKV } from 'react-native-mmkv';
// For truly secret (auth tokens, biometric-protected):
//   use expo-secure-store or react-native-keychain on both platforms
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('token', jwt);
const token = await SecureStore.getItemAsync('token');
// Encrypted by OS keychain on iOS, Keystore on Android.
// Slower than MMKV. Use only for genuinely sensitive data.</code></pre>

<h3>Example 11 — SQLite + Drizzle typed query</h3>
<pre><code class="language-ts">import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
const db = drizzle(SQLite.openDatabaseSync('app.db'));

const posts = await db.select().from(postsTable).where(eq(postsTable.userId, user.id));</code></pre>

<h3>Example 12 — Zustand + immer</h3>
<pre><code class="language-ts">import { immer } from 'zustand/middleware/immer';
const useStore = create&lt;Store&gt;()(immer((set) =&gt; ({
  items: [],
  add: (item) =&gt; set((s) =&gt; { s.items.push(item); }),  // OK to mutate
})));</code></pre>

<h3>Example 13 — re-hydrate store on app start</h3>
<pre><code class="language-ts">// Zustand persist is automatic — store rehydrates on create.
// Wait for rehydration before showing app if needed:
const hydrated = useStore.persist.hasHydrated();
if (!hydrated) return &lt;Splash /&gt;;</code></pre>

<h3>Example 14 — form draft persistence</h3>
<pre><code class="language-tsx">const [draft, setDraft] = useState(storage.getString('draft') ?? '');
useEffect(() =&gt; {
  storage.set('draft', draft);
}, [draft]);
// MMKV is fast enough to write on every keystroke without janking.</code></pre>

<h3>Example 15 — migration from AsyncStorage</h3>
<pre><code class="language-ts">// one-time migration
async function migrateAsyncStorageToMMKV() {
  const keys = await AsyncStorage.getAllKeys();
  for (const k of keys) {
    const v = await AsyncStorage.getItem(k);
    if (v != null) storage.set(k, v);
  }
  await AsyncStorage.clear();
}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. MMKV initialization and native install</h3>
<p>MMKV requires a native rebuild after install (it's a native library). Forgetting leads to "MMKV not found" at runtime. Run <code>pod install</code> on iOS and rebuild.</p>

<h3>2. Zustand persist + schema change</h3>
<p>Changing store shape breaks rehydrated state. Use <code>version</code> + <code>migrate</code>:</p>
<pre><code class="language-ts">persist(..., {
  name: 'store',
  version: 2,
  migrate: (state: any, version) =&gt; version &lt; 2 ? { ...state, newField: [] } : state,
})</code></pre>

<h3>3. TanStack Query's default retry</h3>
<p>Defaults to 3 retries with exponential backoff. On mobile, flaky networks mean 3 isn't always enough. Tune per query; also ensure queries are idempotent.</p>

<h3>4. Cache size in TanStack Query Persist</h3>
<p>Persisted cache can grow unbounded. Set <code>maxAge</code> and invalidate aggressively. MMKV is fast but the cache file grows over time.</p>

<h3>5. AsyncStorage limit on Android</h3>
<p>Default 6MB. Increase via gradle property or switch to MMKV.</p>

<h3>6. MMKV encryption key management</h3>
<p>Key stored in memory (Zustand) is not secure if device is compromised. For real secrets (tokens), use OS-level secure storage (expo-secure-store, react-native-keychain).</p>

<h3>7. TanStack Query in SSR / RSC</h3>
<p>Mobile doesn't have SSR concerns, but if you share code with web Next.js, query keys and rehydration semantics differ. Keep a clean separation.</p>

<h3>8. Focus refetch fires too often</h3>
<p>App coming to foreground triggers focus event. For stable data, set <code>staleTime</code> high (5-30min) to avoid refetching.</p>

<h3>9. Zustand outside React</h3>
<p><code>useStore.getState()</code> reads current state outside components (e.g., in API layer). <code>useStore.setState()</code> updates. Useful for listeners, logging.</p>

<h3>10. Concurrent setState in Zustand</h3>
<p>Zustand's set is synchronous. Two <code>set</code> calls in a microtask both apply. No batching issue. But if you do <code>set((s) =&gt; ({ a: s.a + 1 }))</code>, use functional form always.</p>

<h3>11. Persister limitations</h3>
<p>createSyncStoragePersister needs sync I/O. MMKV fits. AsyncStorage doesn't — use createAsyncStoragePersister instead. Mixing causes stale reads.</p>

<h3>12. Mutation replay order</h3>
<p>Pending mutations replay in order they were queued. If order matters across queries (add A → add B → delete A), design mutations with unique ids and idempotent server logic.</p>

<h3>13. Stale cache on deploy</h3>
<p>App update changes API shape; persisted cache has old shape. Version your cache key (include app version), or clear cache on version bump.</p>

<h3>14. SQLite migrations</h3>
<p>expo-sqlite migrations require manual up/down SQL. Use Drizzle + drizzle-kit for migration tooling, or WatermelonDB's built-in migrations.</p>

<h3>15. Clearing on logout</h3>
<p>After logout, clear auth store, user-specific caches, and queue. Easy to miss a cache that leaks data across users. Centralize logout: a single "onLogout" runs MMKV.clearAll() on user-data instance, qc.clear(), etc.</p>

<h3>16. WatermelonDB has no async-await API for everything</h3>
<p>WatermelonDB uses RxJS observables. Learning curve. If your team prefers promises, expo-sqlite + Drizzle may be a better fit.</p>

<h3>17. NetInfo permissions</h3>
<p>Some APIs require the ACCESS_NETWORK_STATE permission on Android. Autolinking handles, but custom Android builds may need manual entry.</p>

<h3>18. Background sync</h3>
<p>Running sync while the app is backgrounded needs platform-specific task APIs: iOS BackgroundTasks, Android WorkManager. Libraries like <code>react-native-background-fetch</code> wrap them.</p>

<h3>19. JSON stringify perf</h3>
<p>Large state objects serialized on every persist call. Debounce writes, or split into smaller stores with independent persistence.</p>

<h3>20. React Query keys as arrays of objects</h3>
<p>Keys must be serializable. Stable identity rules apply: <code>['user', { id }]</code> is fine, <code>['user', { id, nonce: Math.random() }]</code> breaks caching.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — AsyncStorage for hot-path reads</h3>
<p>Reading auth token on every navigation = async round-trip every time. Migrate to MMKV.</p>

<h3>Anti-pattern 2 — storing server data in Redux</h3>
<p>Reimplementing caching badly. TanStack Query solves this.</p>

<h3>Anti-pattern 3 — Context for high-frequency state</h3>
<p>Cursor position, scroll, timer tick in Context → whole subtree re-renders. Use Zustand with selectors or <code>useSyncExternalStore</code>.</p>

<h3>Anti-pattern 4 — no persistent cache</h3>
<p>User reopens app → shows loading, fetches again. Poor UX on mobile where offline is common. Add TanStack Query Persist.</p>

<h3>Anti-pattern 5 — storing tokens in AsyncStorage / MMKV plain</h3>
<p>Readable by anyone who gets a device backup. For tokens, use expo-secure-store / react-native-keychain. MMKV with encryption is better but still not hardware-backed.</p>

<h3>Anti-pattern 6 — no NetInfo handling</h3>
<p>App doesn't respond when offline. Add a banner, disable action buttons, queue mutations.</p>

<h3>Anti-pattern 7 — ignoring app state changes</h3>
<p>Not listening to AppState → stale data on focus, zombie timers in background. Use focusManager in TanStack Query.</p>

<h3>Anti-pattern 8 — massive state tree</h3>
<p>One Zustand store with everything → every selector re-evaluates. Split by domain.</p>

<h3>Anti-pattern 9 — synchronous SQLite on main thread</h3>
<p>Raw sync SQLite queries in render path block UI. Use async APIs and keep queries short.</p>

<h3>Anti-pattern 10 — no key versioning on persisted cache</h3>
<p>Ship v1.2 with new API shape → v1.1 persisted cache crashes rehydration. Version keys or include app version in the persist name.</p>

<h3>Anti-pattern 11 — unbounded query cache</h3>
<p>Users scroll for hours; cache grows. Set <code>gcTime</code> (cacheTime) and <code>maxAge</code> in persist.</p>

<h3>Anti-pattern 12 — manually maintaining "isLoading" for every fetch</h3>
<p>TanStack Query gives you <code>isLoading</code>, <code>isFetching</code>, <code>isRefetching</code>, <code>status</code>. Use them; don't roll your own.</p>

<h3>Anti-pattern 13 — overlapping queries for the same data</h3>
<p>Three components each calling <code>useQuery(['user', id])</code> → TanStack Query dedupes; one request. But if you use different keys for the same data, you create duplicate fetches. Standardize keys.</p>

<h3>Anti-pattern 14 — silent retry storms</h3>
<p>Query retries 3× on 500. 10K users with a broken backend = 30K requests. Tune retry carefully; consider circuit-breaker logic for widespread failure.</p>

<h3>Anti-pattern 15 — forgetting to clear on logout</h3>
<p>Next user sees previous user's cached feed. Central logout routine: clear auth store, call <code>qc.clear()</code>, clear user-data MMKV instance.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Which state management libraries do you use in RN and why?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Zustand</strong> for client state — small API, selector-based, no provider boilerplate.</li>
      <li><strong>TanStack Query</strong> for server state — caching, revalidation, retries, optimistic mutations, offline support.</li>
      <li><strong>MMKV</strong> for persistent storage — JSI-powered, synchronous, fast.</li>
      <li><strong>Context</strong> only for ambient rarely-changing data (theme, locale).</li>
    </ul>
    <p>For large apps with strict patterns: Redux Toolkit. For very large relational data: WatermelonDB or SQLite + Drizzle.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why MMKV over AsyncStorage?</div>
  <div class="qa-answer">
    <p>MMKV is built on JSI — synchronous, direct C++ (via mmap'd files), ~30× faster than AsyncStorage. Sync API means no async/await ceremony for reading settings or tokens. Supports multiple named instances for domain isolation, built-in AES encryption, and change listeners. AsyncStorage is bridge-based (JSON over async queue) — fine for occasional writes but slow for hot-path reads.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you handle offline data in an RN app?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Cache server data</strong>: TanStack Query + Persist to MMKV. Users see last-loaded data instantly on app open.</li>
      <li><strong>Listen to network</strong>: NetInfo + <code>onlineManager</code>, show offline banner.</li>
      <li><strong>Queue mutations</strong>: TanStack Query persists pending mutations; replay on reconnect with idempotency keys.</li>
      <li><strong>Optimistic updates</strong>: mutations reflect in cache immediately, rolled back on error.</li>
      <li><strong>Versioned local schema</strong>: on API shape change, version keys or migrate.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you implement optimistic updates?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">useMutation({
  mutationFn: api.doIt,
  onMutate: async (input) =&gt; {
    await qc.cancelQueries(['key']);
    const prev = qc.getQueryData(['key']);
    qc.setQueryData(['key'], optimisticValue);
    return { prev };
  },
  onError: (_e, _v, ctx) =&gt; qc.setQueryData(['key'], ctx.prev),
  onSettled: () =&gt; qc.invalidateQueries(['key']),
});</code></pre>
    <p>Cancel in-flight queries, store previous for rollback, apply optimistic, invalidate after settle to reconcile.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. When do you need a SQLite-based store?</div>
  <div class="qa-answer">
    <p>When you have:</p>
    <ul>
      <li>Thousands of records (messages, contacts, posts).</li>
      <li>Need for relational queries (join, filter, sort by multiple fields).</li>
      <li>Reactive queries — UI re-renders when underlying row changes.</li>
      <li>Offline-first app with CRUD operations on structured data.</li>
    </ul>
    <p>Options: WatermelonDB (reactive + sync built-in), expo-sqlite + Drizzle ORM (typed SQL), op-sqlite (perf-focused).</p>
    <p>For KV-shaped settings or small caches, MMKV is plenty.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you persist Zustand state?</div>
  <div class="qa-answer">
<pre><code class="language-ts">const useStore = create()(persist(
  (set) =&gt; ({ /* ... */ }),
  { name: 'store', storage: createJSONStorage(() =&gt; mmkvAdapter) }
));</code></pre>
    <p>Include <code>version</code> + <code>migrate</code> for schema evolution. Use <code>partialize</code> to persist only a subset of fields.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you handle auth tokens securely?</div>
  <div class="qa-answer">
    <p>Don't use AsyncStorage or plain MMKV. Use OS-level secure storage:</p>
    <ul>
      <li><strong>expo-secure-store</strong> — wraps iOS Keychain / Android Keystore. Simple API.</li>
      <li><strong>react-native-keychain</strong> — more options (biometrics, accessible-when-unlocked).</li>
    </ul>
    <p>Tokens encrypted at rest, bound to device hardware (not extractable via backup). Slower than MMKV; use only for truly sensitive data.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you sync data to the server after offline operations?</div>
  <div class="qa-answer">
    <p>TanStack Query's <code>PersistQueryClientProvider</code> persists pending mutations. When reconnecting:</p>
    <ol>
      <li>NetInfo + onlineManager flip to "online."</li>
      <li>TanStack Query resumes paused mutations in order.</li>
      <li>Each mutation should include an idempotency key (<code>clientId</code>) so the server can dedupe.</li>
      <li>On mutation success, invalidate affected queries to sync the cache.</li>
      <li>On permanent failure (validation, permission), rollback and surface UI.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you structure a global Zustand store?</div>
  <div class="qa-answer">
    <p>Split by domain:</p>
<pre><code class="language-ts">export const useAuth = create(...)   // user, login, logout
export const useSettings = create(...)  // theme, locale, notifications prefs
export const useCart = create(...)   // cart items, total
export const useUI = create(...)     // modal open, active tab, banners
</code></pre>
    <p>Each store persists independently; components subscribe to only what they need via selectors. Avoids the "one giant store" pattern.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's focusManager in TanStack Query?</div>
  <div class="qa-answer">
    <p>A React Query mechanism to treat "window focus" events as refetch triggers. On mobile, window focus = app coming to foreground. Wire it up:</p>
<pre><code class="language-ts">import { focusManager } from '@tanstack/react-query';
AppState.addEventListener('change', (status) =&gt; {
  focusManager.setFocused(status === 'active');
});</code></pre>
    <p>Queries with <code>refetchOnWindowFocus: true</code> revalidate when user returns to the app — fresh data on resume.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you clear all user data on logout?</div>
  <div class="qa-answer">
<pre><code class="language-ts">async function logout() {
  await api.logout();                         // invalidate server session
  userStorage.clearAll();                     // MMKV instance for user data
  await SecureStore.deleteItemAsync('token'); // remove auth token
  qc.clear();                                 // flush TanStack Query cache
  useAuth.getState().logout();                // reset auth store
  // navigation.reset to login
}</code></pre>
    <p>Centralizing logout prevents "previous user's data leaks into next session" bugs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you handle large lists of local data?</div>
  <div class="qa-answer">
    <p>For &lt;1K items: in-memory Zustand + FlashList. For thousands with relations: SQLite (expo-sqlite + Drizzle or WatermelonDB). SQLite's query engine handles filter/sort efficiently; pagination via LIMIT / OFFSET or cursor. Subscribe via polling or WatermelonDB's reactive observables.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's the difference between staleTime and gcTime in TanStack Query?</div>
  <div class="qa-answer">
    <p><strong>staleTime</strong>: how long data is considered fresh. During this window, no refetch happens even on mount/focus. Default 0.</p>
    <p><strong>gcTime</strong> (formerly cacheTime): how long inactive query data stays in cache before garbage collection. Default 5 min. If you unmount and remount within gcTime, data is available instantly.</p>
    <p>Set staleTime based on how fast your data changes; set gcTime based on how likely users return.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How do you debug a data flow issue?</div>
  <div class="qa-answer">
    <ul>
      <li>TanStack Query DevTools: see all queries, their state, cache content, retries.</li>
      <li>Zustand DevTools middleware: log every state transition.</li>
      <li>Flipper plugins for React Query + Zustand.</li>
      <li>Network inspector (Flipper / Reactotron) for raw requests.</li>
      <li>Enable logger middleware for Zustand.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Describe your ideal persistence architecture for a feed-based RN app.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Auth token</strong> — expo-secure-store (hardware-backed).</li>
      <li><strong>Settings</strong> — Zustand with persist → MMKV.</li>
      <li><strong>Server feed data</strong> — TanStack Query + Persist to MMKV (fast cold-start restore).</li>
      <li><strong>Draft posts</strong> — Zustand with persist → MMKV.</li>
      <li><strong>Recent search queries</strong> — Zustand.</li>
      <li><strong>Message history</strong> (if it's a chat) — SQLite for thousands of rows.</li>
      <li>On <strong>logout</strong>: clear all user-scoped storage, qc.clear(), secure store delete.</li>
      <li>Versioned cache keys so upgrades don't break rehydration.</li>
    </ul>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You pick Zustand + TanStack Query + MMKV as the modern default stack.</li>
    <li>You explain why MMKV beats AsyncStorage (JSI, sync, speed).</li>
    <li>You store tokens in secure storage, not MMKV.</li>
    <li>You implement offline with persist cache + mutation queue + idempotency keys.</li>
    <li>You use selector subscriptions, not whole-store reads.</li>
    <li>You centralize logout to clear everything.</li>
    <li>You reach for SQLite only when data scale and relations justify it.</li>
  </ul>
</div>
`}

]
});
